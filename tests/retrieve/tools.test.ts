import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Retrieval } from '../../scripts/retrieve/index.ts';
import { loadRetrievalCorpus } from '../../scripts/retrieve/load.ts';
import { RETRIEVAL_TOOLS, ToolInputError, runRetrievalTool } from '../../scripts/retrieve/tools.ts';

let retrieval: Retrieval;
beforeAll(() => {
  retrieval = Retrieval.fromCorpus();
}, 60_000);
afterAll(() => retrieval.close());

const run = (name: string, input: unknown): unknown => runRetrievalTool(retrieval, name, input);

/** Corpus bookkeeping that must never reach a consumer agent's context. */
const BOOKKEEPING_KEYS = [
  'status',
  'confidence',
  'completeness',
  'extraction',
  'locator',
  'file',
  'issues',
  'issue_id',
  'issue_ids',
  'issue_status',
  'unresolved_references',
  'review_status',
  'score',
  'found',
];

function keysOf(value: unknown, into = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) keysOf(item, into);
  else if (typeof value === 'object' && value !== null)
    for (const [key, child] of Object.entries(value)) {
      into.add(key);
      keysOf(child, into);
    }
  return into;
}

function expectRulebookOnly(value: unknown, label: string): void {
  const keys = keysOf(value);
  for (const key of BOOKKEEPING_KEYS) expect(keys.has(key), `${label}: ${key}`).toBe(false);
  const json = JSON.stringify(value);
  expect(json, label).not.toMatch(/"(corpus|review|source)\/[^"]*\.(yaml|pdf|html)"/);
  expect(json, label).not.toMatch(/"issue\./);
}

describe('rulebook tool definitions', () => {
  it('name four read tools with object schemas', () => {
    expect(RETRIEVAL_TOOLS.map((tool) => tool.name)).toEqual([
      'lod_search',
      'lod_get',
      'lod_resolve',
      'lod_expand',
    ]);
    for (const tool of RETRIEVAL_TOOLS) {
      expect(tool.name).toMatch(/^[a-zA-Z0-9_-]{1,64}$/);
      expect(tool.input_schema.type).toBe('object');
      for (const key of tool.input_schema.required)
        expect(tool.input_schema.properties).toHaveProperty(key);
    }
  });

  it('say nothing about maintaining the corpus', () => {
    const text = JSON.stringify(RETRIEVAL_TOOLS);
    expect(text).not.toMatch(/corpus|extract|review|issue|yaml|coverage|canonical|unreviewed/i);
  });
});

describe('runRetrievalTool', () => {
  it('returns rulebook content only for every record', () => {
    const corpus = loadRetrievalCorpus();
    const ids = [
      ...corpus.pilot.rules,
      ...corpus.pilot.entities,
      ...corpus.pilot.tables,
      ...corpus.pilot.procedures,
      ...corpus.pilot.stateMachines,
      ...corpus.terms,
    ].map((record) => record.id);
    for (const id of ids) {
      const result = run('lod_get', { id }) as { id?: string; text?: string };
      expect(result.id, id).toBe(id);
      expect(result.text, id).toBeTruthy();
      expectRulebookOnly(result, id);
    }
  }, 120_000);

  it('reads tables from their printed cells, not their source_text', () => {
    const table = run('lod_get', { id: 'table.combat.hit_location' }) as {
      text: string;
      data: { rows: unknown[] };
    };
    expect(table.text).toBe(
      '1d6 | Hit location\n1 | Head\n2 | Arms\n3-5 | Torso (check gear)\n6 | Legs',
    );
    expect(table.data.rows).toHaveLength(4);
    expect(JSON.stringify(table)).not.toMatch(/preserved/);
  });

  it('keeps quest scope and external dependencies', () => {
    expect(run('lod_get', { id: 'table.quest.slaying_fiend.molgor' })).toMatchObject({
      scope: 'quest',
      quest_id: 'quest.chamber_of_reverence.slaying_fiend',
    });
    const questId = 'quest.chamber_of_reverence.closing_portal';
    const hits = run('lod_search', { query: 'portal', quest_id: questId }) as Array<{
      quest_id?: string;
    }>;
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) expect(hit.quest_id).toBe(questId);
  });

  it('search, resolve and expand return rulebook records only', () => {
    const hits = run('lod_search', { query: 'hit location', limit: 20 }) as Array<{ id: string }>;
    expect(hits.map((hit) => hit.id)).toContain('table.combat.hit_location');
    expectRulebookOnly(hits, 'search');

    const resolved = run('lod_resolve', { name: 'AP' }) as Array<{ id: string }>;
    expect(resolved.map((doc) => doc.id)).toContain('term.action_points');
    expectRulebookOnly(resolved, 'resolve');

    const edges = run('lod_expand', { id: 'term.battle', depth: 2 });
    expectRulebookOnly(edges, 'expand');
    expect(run('lod_expand', { id: 'table.combat.hit_location', direction: 'in' })).toContainEqual(
      expect.objectContaining({ target: 'procedure.combat_damage' }),
    );
  });

  it('treat review issue ids as unknown', () => {
    const issueId = retrieval.document('term.battle')?.issue_ids[0];
    expect(issueId).toBeDefined();
    expect(run('lod_get', { id: issueId })).toMatchObject({ found: false });
    expectRulebookOnly(run('lod_search', { query: issueId }), 'search by issue id');
    expect(run('lod_expand', { id: issueId })).toEqual([]);
  });

  it.each([
    ['lod_issues', { id: 'term.battle' }],
    ['lod_search', {}],
    ['lod_search', { query: '' }],
    ['lod_search', { query: 'door', kinds: ['issue'] }],
    ['lod_search', { query: 'door', scope: 'review' }],
    ['lod_search', { query: 'door', limit: 0 }],
    ['lod_search', { query: 'door', extra: true }],
    ['lod_expand', { id: 'term.battle', direction: 'sideways' }],
    ['lod_expand', { id: 'term.battle', depth: 9 }],
    ['lod_get', 'term.battle'],
  ])('rejects malformed input: %s %j', (name, input) => {
    expect(() => run(name, input)).toThrow(ToolInputError);
  });
});
