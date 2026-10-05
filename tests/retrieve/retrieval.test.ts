import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSearchDocuments } from '../../scripts/retrieve/documents.ts';
import { Retrieval } from '../../scripts/retrieve/index.ts';
import { loadRetrievalCorpus } from '../../scripts/retrieve/load.ts';
import type { Step } from '../../scripts/validate/pilot-types.ts';

let retrieval: Retrieval;
beforeAll(() => {
  retrieval = Retrieval.fromCorpus();
}, 60_000);
afterAll(() => retrieval.close());

const top = (query: string, limit = 10, options = {}): string[] =>
  retrieval.search(query, { limit, ...options }).map((hit) => hit.id);

describe('search documents', () => {
  it('are deterministic and cover every canonical record with provenance', () => {
    const corpus = loadRetrievalCorpus();
    const first = buildSearchDocuments(corpus);
    expect(JSON.stringify(buildSearchDocuments(corpus))).toBe(JSON.stringify(first));
    expect(new Set(first.map((doc) => doc.id)).size).toBe(first.length);
    expect(first.length).toBe(
      corpus.pilot.rules.length +
        corpus.pilot.entities.length +
        corpus.pilot.tables.length +
        corpus.pilot.procedures.length +
        corpus.pilot.stateMachines.length +
        corpus.terms.length +
        corpus.issues.length,
    );
    for (const doc of first) {
      expect(doc.file, doc.id).toMatch(/^(corpus|review)\/.+\.yaml$/);
      expect(doc.citations.length, doc.id).toBeGreaterThan(0);
    }
  }, 60_000);

  it('state each cited passage of a procedure or state machine once', () => {
    const corpus = loadRetrievalCorpus();
    const texts = new Map(buildSearchDocuments(corpus).map((doc) => [doc.id, doc.text]));
    const passages = (steps: Step[]): string[] =>
      steps.flatMap((step) => [step.source_text, ...passages(step.substeps ?? [])]);
    for (const procedure of corpus.pilot.procedures) {
      const distinct = new Set([procedure.source_text, ...passages(procedure.steps)]);
      expect(texts.get(procedure.id), procedure.id).toBe([...distinct].join('\n'));
    }
    expect(retrieval.document('procedure.rest_mana_recovery')?.text).toBe(
      'If the rest is not interrupted, the heroes regain all Mana, 1D6 Hit Points and possibly some energy.',
    );
  }, 60_000);

  it('keep quest-local mechanics scoped to their quest', () => {
    const molgor = retrieval.document('table.quest.slaying_fiend.molgor');
    expect(molgor).toMatchObject({
      scope: 'quest',
      quest_id: 'quest.chamber_of_reverence.slaying_fiend',
    });
    expect(retrieval.document('procedure.closing_portal_reading_attempt')).toMatchObject({
      scope: 'quest',
      quest_id: 'quest.chamber_of_reverence.closing_portal',
    });
    expect(retrieval.document('table.dungeon.door_chest_difficulty')?.scope).toBe('global');
    expect(retrieval.document('background.arachnophobia')).toMatchObject({
      scope: 'global',
      quest_id: 'quest.background.arachnophobia',
    });
  });
});

describe('exact lookup', () => {
  it('returns the search document and canonical record for an id', () => {
    const result = retrieval.get('table.quest.slaying_fiend.molgor');
    expect(result?.document.citations).toContainEqual(
      expect.objectContaining({ pdf_page: 256, printed_page: 254 }),
    );
    expect(result?.record).toMatchObject({
      id: 'table.quest.slaying_fiend.molgor',
      rows: [expect.anything()],
    });
    expect(result?.document.text).toContain('45');
    expect(retrieval.get('table.does_not_exist')).toBeNull();
  });

  it('ranks an exact id query first', () => {
    expect(top('procedure.rest', 1)).toEqual(['procedure.rest']);
  });

  it.each([
    ['AP', 'term.action_points'],
    ['action points', 'term.action_points'],
    ['Pyramid of Xanthu', 'quest.ancient_lands.pyramid_xanthu'],
    ['Molgor, the Fiend of Summerhall', 'quest_actor.chamber_of_reverence.molgor'],
  ])('resolves the alias %s', (name, id) => {
    expect(retrieval.resolve(name).map((doc) => doc.id)).toContain(id);
  });
});

describe('lexical search', () => {
  it.each([
    ['how do I open a locked door', 'procedure.locked_door_and_close'],
    ['how do I open a locked door', 'table.dungeon.door_chest_difficulty'],
    ['what happens when a hero is bleeding', 'procedure.bleeding_out'],
    ['can heroes rest in a dungeon', 'procedure.rest_hp_recovery'],
    ['poison cure', 'procedure.poison_cure'],
    ['searching a room', 'procedure.search_room_or_corridor'],
    ['what happens when sanity reaches zero', 'procedure.sanity_loss'],
    ['Threat level increase', 'procedure.threat_roll'],
    ['Molgor hit points', 'table.quest.slaying_fiend.molgor'],
    ['Molgor prior wounds', 'table.quest.slaying_fiend.prior_wounds'],
    ['closing the portal threat', 'table.quest.closing_portal.threat'],
    ['closing the portal demons', 'table.quest.closing_portal.demons'],
    ['returning the relic reward', 'core.quest.returning_relic.reward'],
    ['what does a wizard start with', 'profession.wizard'],
  ])('"%s" finds %s in the top ten', (query, id) => {
    expect(top(query)).toContain(id);
  });

  it('ranks global rules above unrelated quest-local rules', () => {
    const hits = top('how do I open a locked door', 3);
    for (const id of hits) expect(retrieval.document(id)?.scope).toBe('global');
  });

  it('filters by kind, scope and quest', () => {
    const tables = retrieval.search('threat', { kinds: ['table'], limit: 20 });
    expect(tables.every((hit) => hit.kind === 'table')).toBe(true);
    const portal = retrieval.search('threat', {
      questId: 'quest.chamber_of_reverence.closing_portal',
    });
    expect(portal.length).toBeGreaterThan(0);
    expect(
      portal.every((hit) => hit.quest_id === 'quest.chamber_of_reverence.closing_portal'),
    ).toBe(true);
    expect(retrieval.search('door', { scope: 'quest' }).every((hit) => hit.scope === 'quest')).toBe(
      true,
    );
  });

  it('filters by exact section', () => {
    const hits = retrieval.search('miscast', { sections: ['section.magic.miscast'] });
    expect(hits.map((hit) => hit.id).sort()).toEqual([
      'core.magic.miscast',
      'core.magic.miscast.threshold.normal',
      'core.magic.miscast.threshold.wounded',
    ]);
  });

  it('finds headings a question names, including inflected forms', () => {
    const named = (text: string): string[] =>
      retrieval.namedHeadings(text).map((heading) => heading.section_id);
    expect(named('Can a wounded wizard cast?')).toContain('section.combat.wounded');
    expect(named('What happens when my hero is stunned?')).toContain(
      'section.combat.different_kinds_of_damage.stun',
    );
    // Chapters are too broad to count as a named heading.
    expect(named('How does magic work?')).not.toContain('section.magic');
  });

  it('excludes review issues unless asked', () => {
    expect(retrieval.search('battle combat endpoint').some((hit) => hit.kind === 'issue')).toBe(
      false,
    );
    expect(top('battle combat endpoint', 10, { kinds: ['issue'] })).toContain('issue.0001');
  });
});

describe('relations and uncertainty', () => {
  it('expands outgoing and incoming relations', () => {
    const incoming = retrieval.expand('table.quest.slaying_fiend.molgor', { direction: 'in' });
    expect(incoming.map((edge) => edge.target)).toContain(
      'quest_actor.chamber_of_reverence.molgor',
    );
    const outgoing = retrieval.expand('quest_actor.chamber_of_reverence.molgor', {
      direction: 'out',
    });
    expect(outgoing).toContainEqual(
      expect.objectContaining({
        relation: 'table',
        target: 'table.quest.slaying_fiend.molgor',
        found: true,
      }),
    );
  });

  it('surfaces review issues attached to a record', () => {
    const issues = retrieval.issues('term.battle');
    expect(issues.map((doc) => doc.id)).toContain('issue.0001');
    expect(issues[0]?.issue_status).toBe('unresolved');
  });

  it('surfaces unavailable external material instead of content', () => {
    const doc = retrieval.document('character.background.sworn_enemy.bandit_encounter');
    expect(doc?.external_dependencies).toContainEqual(
      expect.objectContaining({ document: 'bestiary' }),
    );
  });
});
