import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Retrieval } from '../../scripts/retrieve/index.ts';
import { loadRetrievalCorpus } from '../../scripts/retrieve/load.ts';
import { RETRIEVAL_TOOLS, ToolInputError, runRetrievalTool } from '../../scripts/retrieve/tools.ts';
import { expectRulebookOnly } from '../support/rulebook-only.ts';

let retrieval: Retrieval;
beforeAll(() => {
  retrieval = Retrieval.fromCorpus();
}, 60_000);
afterAll(() => retrieval.close());

const run = (name: string, input: unknown): unknown => runRetrievalTool(retrieval, name, input);

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
      // No review issue's summary or resolution text reaches the agent, conflict notices included.
      const json = JSON.stringify(result);
      for (const issueId of retrieval.document(id)?.issue_ids ?? []) {
        const issue = retrieval.document(issueId);
        for (const text of [issue?.issue_summary, issue?.resolution?.summary])
          if (text) expect(json.includes(JSON.stringify(text).slice(1, -1)), issueId).toBe(false);
      }
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

  it('expand follows quest, external and part_of links but no bookkeeping or evidence', () => {
    type ToolEdge = { relation: string; target: string; target_title?: string };
    const expand = (input: unknown): ToolEdge[] => run('lod_expand', input) as ToolEdge[];

    expect(expand({ id: 'core.quest.pyramid_xanthu.setup', direction: 'out' })).toContainEqual(
      expect.objectContaining({
        relation: 'quest',
        target: 'quest.ancient_lands.pyramid_xanthu',
        target_title: 'The Pyramid of Xánthu',
      }),
    );
    expect(expand({ id: 'section.introduction', direction: 'out' })).toContainEqual({
      source: 'section.introduction',
      relation: 'external',
      target: 'bestiary',
      direction: 'out',
      target_title: 'Bestiary',
    });
    expect(expand({ id: 'section.combat.who_can_fight', direction: 'out' })).toContainEqual(
      expect.objectContaining({
        relation: 'part_of',
        target: 'section.combat',
        target_title: 'Combat',
      }),
    );

    // lod_get resolves section and manifest-document targets the way lod_expand does.
    expect(
      (run('lod_get', { id: 'character.alchemy.components' }) as { links: ToolEdge[] }).links,
    ).toContainEqual({
      relation: 'see_also',
      target: 'section.alchemists_guild',
      target_title: 'Alchemists’ Guild',
    });

    // A canonical edge carries its printed condition, and nothing else from corpus/graph/.
    const binding = {
      relation: 'input_from',
      target: 'core.quest.start_settlement',
      condition: 'When you start the game',
    };
    const acceptance = run('lod_get', { id: 'procedure.quest_acceptance' }) as {
      links: ToolEdge[];
    };
    expect(acceptance.links).toContainEqual({
      ...binding,
      target_title: 'randomise the start settlement',
    });
    expectRulebookOnly(acceptance, 'procedure.quest_acceptance');
    expect(
      expand({ id: 'core.quest.start_settlement', direction: 'in', relations: ['input_from'] }),
    ).toEqual([
      {
        source: 'core.quest.start_settlement',
        relation: 'input_from',
        target: 'procedure.quest_acceptance',
        direction: 'in',
        condition: 'When you start the game',
        target_title: 'Actual party quest acceptance and immutable instance provenance',
      },
    ]);

    // A summary reaches its detailed rule, and the detailed rule finds its summaries.
    expect(
      expand({ id: 'combat.action.parry_stance', direction: 'out', relations: ['summary_of'] }),
    ).toEqual([
      expect.objectContaining({ relation: 'summary_of', target: 'combat.defence.shield_parry' }),
    ]);
    expect(
      expand({ id: 'combat.defence.shield_parry', direction: 'out', relations: ['expanded_by'] }),
    ).toEqual([
      expect.objectContaining({ relation: 'expanded_by', target: 'combat.action.parry_stance' }),
    ]);

    const excluded = ['cites_section', 'redirects_to', 'tests', 'concerns', 'issue'];
    for (const id of [
      'core.quest.pyramid_xanthu.setup',
      'character.alchemy.drink',
      'section.magic.casting_spells.table_3',
      'section.alchemy.drinking_potions',
      'term.battle',
    ]) {
      const edges = expand({ id, depth: 2 });
      expectRulebookOnly(edges, id);
      for (const edge of edges)
        expect(excluded, `${id} ${edge.relation}`).not.toContain(edge.relation);
      const links = (run('lod_get', { id }) as { links?: ToolEdge[] }).links ?? [];
      for (const link of links)
        expect(excluded, `${id} ${link.relation}`).not.toContain(link.relation);
    }
  });

  describe('conflicting passages', () => {
    interface Passage {
      id: string;
      title: string;
      citations: Array<{ document: string; pdf_page: number | null }>;
    }
    interface WithConflicts {
      conflicts_with?: Passage[];
      rulings?: Array<{ document: string; heading?: string }>;
    }
    const get = (id: string): WithConflicts => run('lod_get', { id }) as WithConflicts;

    it('names the other passages of an unresolved conflict, with title and citations', () => {
      const result = get('core.quest.spider_queen_entrance.amburr');
      expect(result.conflicts_with).toEqual([
        {
          id: 'quest_actor.spider_queen.amburr',
          title: 'Amburr, The Ettin',
          citations: expect.arrayContaining([
            expect.objectContaining({ document: 'rulebook.second_printing.eng', pdf_page: 238 }),
          ]) as unknown,
        },
      ]);
      expect(result.rulings).toBeUndefined();
      expectRulebookOnly(result, 'amburr');
    });

    it('lists a conflict inside one record as that record', () => {
      const id = 'character.alchemy.preparation.potion_of_dragons_breath';
      expect(get(id).conflicts_with?.map((passage) => passage.id)).toEqual([id]);
    });

    it('cites the official ruling instead of a conflict it settles', () => {
      const result = get('core.movement.pit.down');
      expect(result.conflicts_with).toBeUndefined();
      expect(result.rulings).toEqual([
        expect.objectContaining({
          document: 'vonbraus.faq_gamefound',
          heading:
            'Does a hero have to make a DEX test to climb DOWN into a pit? The text in the rulebook contradicts itself.',
        }),
      ]);
      expectRulebookOnly(result, 'pit down');
    });

    it('shows nothing for a conflict the rulebook itself settles', () => {
      const result = get('term.skill_test');
      expect(result.conflicts_with).toBeUndefined();
      expect(result.rulings).toBeUndefined();
    });

    it('marks search hits that have a conflicting passage, and only those', () => {
      const hits = run('lod_search', { query: 'Amburr Ettin' }) as Array<{
        id: string;
        conflicting_passages?: true;
      }>;
      const marked = (id: string): boolean | undefined =>
        hits.find((hit) => hit.id === id)?.conflicting_passages;
      expect(marked('core.quest.spider_queen_entrance.amburr')).toBe(true);
      const skill = run('lod_search', { query: 'term.skill_test' }) as Array<{
        id: string;
        conflicting_passages?: true;
      }>;
      expect(skill[0]).toMatchObject({ id: 'term.skill_test' });
      expect(skill[0]).not.toHaveProperty('conflicting_passages');
    });

    it('tell the agent to read both passages and present the conflict', () => {
      for (const name of ['lod_search', 'lod_get'])
        expect(RETRIEVAL_TOOLS.find((tool) => tool.name === name)?.description).toMatch(
          /read both passages/,
        );
    });
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
