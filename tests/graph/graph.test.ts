import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { writeGraphArtifacts } from '../../scripts/graph/build.ts';
import { buildGraph, CATEGORIES, deriveGraph, type Graph } from '../../scripts/graph/index.ts';
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

  it('places each section in its parent as a structural part_of edge', () => {
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        source: 'section.combat.who_can_fight',
        relation: 'part_of',
        target: 'section.combat',
        category: 'structural',
        field: 'parent',
      }),
    );
  });

  it('links a quest-scoped rule to its quest through quest_id', () => {
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        source: 'core.quest.pyramid_xanthu.setup',
        relation: 'quest',
        target: 'quest.ancient_lands.pyramid_xanthu',
        category: 'reference',
        field: 'quest_id',
      }),
    );
    const quests = graph.edges.filter((edge) => edge.relation === 'quest');
    expect(new Set(quests.map((edge) => edge.source)).size).toBe(quests.length);
  });

  it('marks a not_present book cited by a section as an external edge', () => {
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        source: 'section.introduction',
        relation: 'external',
        target: 'bestiary',
        category: 'external',
        field: 'external_references',
      }),
    );
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({ id: 'bestiary', kind: 'document', not_present: true }),
    );
  });

  it('records redirects and record sections as structural edges', () => {
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        source: 'section.magic.casting_spells.table_3',
        relation: 'redirects_to',
        target: 'section.magic.casting_spells.table_2',
        category: 'structural',
        field: 'redirect_to',
      }),
    );
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        source: 'core.quest.pyramid_xanthu.setup',
        relation: 'cites_section',
        category: 'structural',
        field: 'section_id',
      }),
    );
  });

  it('links test cases to the rules they exercise as evidence', () => {
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({
        id: 'test.character.alchemy.drink.two_dexterity',
        kind: 'test_case',
      }),
    );
    const tests = graph.edges.filter(
      (edge) =>
        edge.source === 'test.character.alchemy.drink.two_dexterity' && edge.relation === 'tests',
    );
    expect(tests.map((edge) => [edge.target, edge.field, edge.category])).toEqual([
      ['character.alchemy.drink', 'expected.trace', 'evidence'],
      ['character.alchemy.drink', 'rule_ids', 'evidence'],
    ]);
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

  it('is where retrieval documents get their tool-visible relations', () => {
    const hidden = new Set(['structural', 'evidence']);
    const fromGraph = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
      if (hidden.has(edge.category) && edge.relation !== 'part_of') continue;
      const set = fromGraph.get(edge.source) ?? new Set<string>();
      set.add(`${edge.relation} ${edge.target}`);
      fromGraph.set(edge.source, set);
    }
    const corpus = loadRetrievalCorpus();
    for (const doc of buildSearchDocuments(corpus, deriveGraph(corpus))) {
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
