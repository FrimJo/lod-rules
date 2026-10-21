import { beforeAll, describe, expect, it } from 'vitest';
import { buildGraph, type AnalysedGraph } from '../../scripts/graph/index.ts';
import { readPilot } from '../../scripts/validate/pilot-files.ts';

let graph: AnalysedGraph;
beforeAll(() => {
  graph = buildGraph();
}, 60_000);

describe('graph anomalies', () => {
  it('has no dangling ids', () => {
    // TEMPORARY until #7 adds test cases as graph nodes: issues already point at them.
    const testCases = new Set(readPilot().testCases.map((testCase) => testCase.id));
    const dangling = graph.anomalies.dangling.filter((edge) => !testCases.has(edge.target));
    expect(dangling).toEqual([]);
  });

  it('lists every unresolved reference with its owner and wording, never as an edge', () => {
    expect(graph.anomalies.unresolved).toContainEqual({
      owner: 'core.quest.pyramid_xanthu.ancient_awakening',
      wording:
        'Two Support, two Ranged and two Close Combat spells are unnamed; no selection method is stated.',
    });
    expect(graph.anomalies.unresolved).toContainEqual({
      owner: 'section.embarking_on_your_first_quest',
      wording:
        'the ‘Entering the Dungeon’ chapter (no chapter of that name; Into the Dungeons is the nearest title, but the book does not say so)',
    });
    const wordings = new Set(graph.anomalies.unresolved.map((entry) => entry.wording));
    for (const edge of graph.edges) expect(wordings.has(edge.target), edge.target).toBe(false);
  });
});
