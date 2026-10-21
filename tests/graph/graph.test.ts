import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { writeGraphArtifacts } from '../../scripts/graph/build.ts';
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

  it('builds sorted, byte-identical artifacts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lod-graph-'));
    try {
      const read = (): string[] =>
        ['nodes.json', 'edges.json'].map((name) => readFileSync(join(dir, name), 'utf8'));
      writeGraphArtifacts(buildGraph(), dir);
      const first = read();
      writeGraphArtifacts(buildGraph(), dir);
      expect(read()).toEqual(first);

      const edges = JSON.parse(first[1]!) as Graph['edges'];
      expect(edges.length).toBe(graph.edges.length);
      const order = (a: Graph['edges'][number], b: Graph['edges'][number]): number =>
        a.source.localeCompare(b.source, 'en') ||
        a.relation.localeCompare(b.relation, 'en') ||
        a.target.localeCompare(b.target, 'en') ||
        a.field.localeCompare(b.field, 'en');
      edges.slice(1).forEach((edge, i) => expect(order(edges[i]!, edge)).toBeLessThanOrEqual(0));
      expect(first[0]!.endsWith('}\n]\n')).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
