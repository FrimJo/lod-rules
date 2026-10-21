import { beforeAll, describe, expect, it } from 'vitest';
import { buildGraph, CATEGORIES, type Graph } from '../../scripts/graph/index.ts';
import { buildSearchDocuments } from '../../scripts/retrieve/documents.ts';
import { loadRetrievalCorpus } from '../../scripts/retrieve/load.ts';

let graph: Graph;
beforeAll(() => {
  graph = buildGraph();
}, 60_000);

const has = (source: string, relation: string, target: string): boolean =>
  graph.edges.some(
    (edge) => edge.source === source && edge.relation === relation && edge.target === target,
  );

describe('graph', () => {
  it('derives the relations the corpus records', () => {
    expect(
      has('core.quest.start_settlement', 'uses_table', 'table.settlement.start_settlement'),
    ).toBe(true);
  });

  it('emits every relation retrieval used before the graph existed', () => {
    const names = new Set(graph.edges.map((edge) => edge.relation));
    for (const name of [
      'uses_table',
      'overrides',
      'term',
      'timing',
      'entity',
      'depends_on',
      'rule',
      'table',
      'component',
      'grants',
      'starting_equipment',
      'row_rule',
      'row_entity',
      'step_rule',
      'enters',
      'related',
      'concerns',
      'see_also',
      'quest',
      'issue',
    ]) {
      expect(names, name).toContain(name);
    }
  });

  it('gives every edge a category and the field it came from', () => {
    for (const edge of graph.edges) {
      const label = `${edge.source} -${edge.relation}-> ${edge.target}`;
      expect(CATEGORIES, label).toContain(edge.category);
      expect(edge.field, label).not.toBe('');
      expect(edge.provenance.length, label).toBeGreaterThan(0);
    }
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        source: 'core.quest.start_settlement',
        relation: 'uses_table',
        target: 'table.settlement.start_settlement',
        category: 'dependency',
      }),
    );
  });

  it('is where retrieval documents get their relations', () => {
    const fromGraph = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
      const set = fromGraph.get(edge.source) ?? new Set<string>();
      set.add(`${edge.relation} ${edge.target}`);
      fromGraph.set(edge.source, set);
    }
    for (const doc of buildSearchDocuments(loadRetrievalCorpus())) {
      const relations = doc.relations.map((r) => `${r.relation} ${r.target}`);
      expect(new Set(relations), doc.id).toEqual(fromGraph.get(doc.id) ?? new Set());
      expect(relations.length, doc.id).toBe(new Set(relations).size);
    }
  }, 60_000);
});
