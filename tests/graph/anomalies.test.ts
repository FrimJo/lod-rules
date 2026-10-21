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
});
