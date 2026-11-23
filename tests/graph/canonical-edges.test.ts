import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildGraph,
  traverse,
  whatCouldAffect,
  type AnalysedGraph,
} from '../../scripts/graph/index.ts';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity } from '../../scripts/validate/pilot.ts';
import { phaseFourContext } from '../support/phase-four-context.ts';
import type { InputFromEdge, SummaryOfEdge } from '../../scripts/validate/pilot-types.ts';

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

const corpus = readPilot();
const context = phaseFourContext();

describe('canonical edge validation', () => {
  const errors = (mutate: (edge: InputFromEdge) => void): string => {
    const pilot = structuredClone(corpus);
    const edge = pilot.edges.find((e) => e.id === EDGE);
    if (edge?.relation !== 'input_from') throw new Error(`${EDGE} is not an input_from edge`);
    mutate(edge);
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

const SUMMARY = 'edge.summary.combat_parry_stance.shield_parry';

describe('summary_of edges', () => {
  it('records the summary once and derives expanded_by as its inverse', () => {
    const forward = graph.edges.filter(
      (e) =>
        e.source === 'combat.action.parry_stance' && e.target === 'combat.defence.shield_parry',
    );
    expect(forward).toEqual([
      expect.objectContaining({ relation: 'summary_of', category: 'reference' }),
    ]);
    expect(forward[0]?.derived).toBeUndefined();
    const inverse = graph.edges.filter(
      (e) =>
        e.source === 'combat.defence.shield_parry' && e.target === 'combat.action.parry_stance',
    );
    expect(inverse).toEqual([
      expect.objectContaining({ relation: 'expanded_by', category: 'precedence', derived: true }),
    ]);
    expect(inverse[0]?.provenance).toEqual([expect.objectContaining({ pdf_page: 111 })]);
    const summaries = graph.edges.filter((e) => e.relation === 'summary_of').length;
    expect(graph.edges.filter((e) => e.relation === 'expanded_by')).toHaveLength(summaries);
  });

  it('lets the detailed rule affect its summary, never the reverse', () => {
    const affectSummary = whatCouldAffect(graph, 'combat.action.parry_stance', { depth: 1 });
    expect(affectSummary).toContainEqual(
      expect.objectContaining({ source: 'combat.defence.shield_parry', relation: 'expanded_by' }),
    );
    const affectDetail = whatCouldAffect(graph, 'combat.defence.shield_parry', { depth: 1 });
    expect(affectDetail.map((e) => e.source)).not.toContain('combat.action.parry_stance');
  });

  const summaryErrors = (mutate: (edge: SummaryOfEdge) => void): string => {
    const pilot = structuredClone(corpus);
    const edge = pilot.edges.find((e) => e.id === SUMMARY);
    if (edge?.relation !== 'summary_of') throw new Error(`${SUMMARY} is not a summary_of edge`);
    mutate(edge);
    return checkPilotIntegrity(pilot, context).join('\n');
  };

  it('accepts the committed summaries', () => {
    expect(summaryErrors(() => undefined)).not.toContain('edge.summary.');
  });

  it('belongs to the section of the summarising record', () => {
    expect(
      summaryErrors((edge) => {
        edge.section_id = 'section.combat.parry_with_a_weapon';
      }),
    ).toContain(`${SUMMARY}: section_id must be the summary's section`);
  });

  it('rejects a summary of a record in the same section', () => {
    expect(
      summaryErrors((edge) => {
        edge.to = 'combat.action.shove.attempt';
      }),
    ).toContain(`${SUMMARY}: summary_of joins two records of one section`);
  });

  it('rejects an unknown endpoint', () => {
    expect(
      summaryErrors((edge) => {
        edge.to = 'combat.defence.invented';
      }),
    ).toContain(`${SUMMARY}: unknown reference combat.defence.invented`);
  });
});
