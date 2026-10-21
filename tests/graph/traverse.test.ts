import { beforeAll, describe, expect, it } from 'vitest';
import { buildGraph, whatCouldAffect, type AnalysedGraph } from '../../scripts/graph/index.ts';

let graph: AnalysedGraph;
beforeAll(() => {
  graph = buildGraph();
}, 60_000);

const link = (edge: { source: string; relation: string; target: string }): string =>
  `${edge.source} -${edge.relation}-> ${edge.target}`;

describe('what could affect X', () => {
  // core.check.standard is overridden, cited by procedure steps and concerned by an issue.
  it('walks only dependency and precedence edges in reverse by default', () => {
    const edges = whatCouldAffect(graph, 'core.check.standard');
    const links = edges.map(link);
    expect(links).toContain('core.check.automatic_failure -overrides-> core.check.standard');
    expect(links).toContain('procedure.open_portcullis -step_rule-> core.check.standard');
    expect(links).not.toContain('issue.0005 -concerns-> core.check.standard');
    for (const edge of edges) {
      expect(['dependency', 'precedence'], link(edge)).toContain(edge.category);
      expect(edge.direction).toBe('reverse');
    }
  });
});
