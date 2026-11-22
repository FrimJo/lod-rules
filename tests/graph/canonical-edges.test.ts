import { beforeAll, describe, expect, it } from 'vitest';
import { buildGraph, traverse, type AnalysedGraph } from '../../scripts/graph/index.ts';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity } from '../../scripts/validate/pilot.ts';
import { phaseFourContext } from '../support/phase-four-context.ts';

const EDGE = 'edge.quest.start_settlement.first_acceptance';

let graph: AnalysedGraph;
beforeAll(() => {
  graph = buildGraph();
}, 60_000);

describe('canonical edges', () => {
  it('joins the derived graph as a dependency with its own source and condition', () => {
    const edge = graph.edges.find((e) => e.relation === 'input_from');
    expect(edge).toMatchObject({
      source: 'procedure.quest_acceptance',
      target: 'core.quest.start_settlement',
      category: 'dependency',
      field: 'corpus/graph/dependencies.yaml',
      condition: 'When you start the game',
    });
    expect(edge?.provenance).toEqual([expect.objectContaining({ pdf_page: 59 })]);
    expect(graph.nodes).toContainEqual(expect.objectContaining({ id: EDGE, kind: 'edge' }));
    expect(graph.anomalies.dangling).toEqual([]);
  });

  it('is found walking back from the start-settlement roll', () => {
    const edges = traverse(graph, 'core.quest.start_settlement', {
      direction: 'reverse',
      depth: 1,
      categories: ['dependency'],
    });
    expect(edges).toContainEqual(
      expect.objectContaining({ source: 'procedure.quest_acceptance', relation: 'input_from' }),
    );
  });
});

describe('canonical edge validation', () => {
  const corpus = readPilot();
  const context = phaseFourContext();
  const errors = (mutate: (edge: (typeof corpus.edges)[number]) => void): string => {
    const pilot = structuredClone(corpus);
    mutate(pilot.edges.find((edge) => edge.id === EDGE)!);
    return checkPilotIntegrity(pilot, context).join('\n');
  };

  it('accepts the committed edges', () => {
    expect(errors(() => undefined)).not.toContain(EDGE);
  });

  it('rejects an unknown endpoint', () => {
    expect(
      errors((edge) => {
        edge.to = 'core.quest.invented';
      }),
    ).toContain(`${EDGE}: unknown reference core.quest.invented`);
  });

  it('rejects a binding whose field is not an input of the consumer', () => {
    expect(
      errors((edge) => {
        edge.binding.field = 'instance_start_settlement';
      }),
    ).toContain('binding.field instance_start_settlement is not an input');
  });

  it('rejects a binding whose source field is not an output of the provider', () => {
    expect(
      errors((edge) => {
        edge.binding.from_field = 'roll';
      }),
    ).toContain('binding.from_field roll is not an output');
  });
});
