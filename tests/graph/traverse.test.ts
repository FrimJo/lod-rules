import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildGraph,
  traverse,
  whatCouldAffect,
  type AnalysedGraph,
} from '../../scripts/graph/index.ts';

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

  it('widens to other categories only when asked', () => {
    const links = whatCouldAffect(graph, 'core.check.standard', {
      categories: ['dependency', 'precedence', 'evidence'],
    }).map(link);
    expect(links).toContain('issue.0005 -concerns-> core.check.standard');
  });
});

describe('traverse', () => {
  it('walks forward from a record, one hop', () => {
    const edges = traverse(graph, 'core.quest.start_settlement', { depth: 1 });
    expect(edges.map(link)).toContain(
      'core.quest.start_settlement -uses_table-> table.settlement.start_settlement',
    );
    for (const edge of edges) {
      expect(edge.source).toBe('core.quest.start_settlement');
      expect(edge.direction).toBe('forward');
      expect(edge.depth).toBe(1);
    }
  });

  it('walks both directions at once', () => {
    const edges = traverse(graph, 'core.check.standard', { direction: 'both', depth: 1 });
    expect(edges.map(link)).toContain(
      'core.check.automatic_failure -overrides-> core.check.standard',
    );
    expect(edges.some((edge) => edge.direction === 'forward')).toBe(true);
    expect(edges.some((edge) => edge.direction === 'reverse')).toBe(true);
  });

  it('keeps only the chosen categories and reaches further with each hop', () => {
    const edges = traverse(graph, 'core.check.standard', {
      direction: 'reverse',
      categories: ['precedence'],
    });
    expect(edges.length).toBeGreaterThan(0);
    for (const edge of edges) expect(edge.category).toBe('precedence');

    const near = whatCouldAffect(graph, 'core.check.standard', { depth: 1 });
    const far = whatCouldAffect(graph, 'core.check.standard');
    expect(near.every((edge) => edge.depth === 1)).toBe(true);
    expect(far.length).toBeGreaterThan(near.length);
  });
});
