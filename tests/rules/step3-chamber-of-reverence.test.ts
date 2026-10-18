import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';

const corpus = readPilot();
interface Sourced {
  id: string;
  source_text: string;
  source: Array<{ document: string; pdf_page?: number; heading?: string | null }>;
}
const all: Sourced[] = [
  ...corpus.rules,
  ...corpus.tables,
  ...corpus.entities,
  ...corpus.procedures,
] as unknown as Sourced[];
const record = (id: string): Sourced => {
  const found = all.find((x) => x.id === id);
  if (!found) throw new Error(`Missing ${id}`);
  return found;
};
const sections = [
  'section.quest_book_i.the_chamber_of_reverence.quest_1_returning_the_relic',
  'section.quest_book_i.the_chamber_of_reverence.quest_2_slaying_the_fiend',
  'section.quest_book_i.the_chamber_of_reverence.quest_3_closing_the_portal',
];
const owned = all.filter((x) =>
  sections.some((s) => (x as unknown as { section_id: string }).section_id.startsWith(s)),
);

describe('The Chamber of Reverence quests — verbatim quotes and printed headings (PDF 255–258)', () => {
  it.each([
    [
      'core.quest.returning_relic.luck_nullification',
      'Due to the curse of the stone, all their Luck Points are nullified until they have returned the stone.',
    ],
    [
      'core.quest.returning_relic.scenario_trigger',
      'The Scenario die is triggered on a result of 8-10.',
    ],
    [
      'core.quest.returning_relic.refit_attempt',
      'the heroes may try to refit the stone once per turn by standing in front of the statue and taking a DEX Test.',
    ],
    [
      'core.quest.returning_relic.refit_failure',
      'a failure means the Threat Level goes up 1 level.',
    ],
    ['core.quest.slaying_fiend.setup', 'Special Rules: - Number of Tiles: 8 corridors, 8 rooms.'],
    [
      'core.quest.slaying_fiend.prior_wounds_3',
      'Remove the result of the roll from the initial 45 HP before the fight begins.',
    ],
    [
      'core.quest.closing_portal.encounter_replacement',
      'All encounter results of even 10s (10, 20, 30…) result in an encounter with random demons.',
    ],
    ['core.quest.closing_portal.ritual_start', 'Roll 1d6+1 to see how many turns it takes.'],
    [
      'core.quest.closing_portal.objective_loot',
      'they notice 2 objective chests that they loot (unlocked, not trapped, just roll on the Treasure Tables).',
    ],
    [
      'quest_actor.chamber_of_reverence.molgor',
      'He is much larger than any Minotaur seen by the heroes before',
    ],
    ['equipment.quest.portal_ritual_scroll', 'This should be read at the gate to seal it.'],
    [
      'procedure.closing_portal_reading_attempt',
      'If the character is interrupted in any way (wounded, dodges, or parries), they have to start over.',
    ],
  ])('%s quotes the page', (id, text) => {
    expect(record(id).source_text).toContain(text);
  });

  it('cites printed headings only, on the pages that print them', () => {
    expect(owned.length).toBeGreaterThanOrEqual(45);
    for (const x of owned)
      for (const s of x.source) {
        if (s.document !== 'rulebook.second_printing.eng') continue;
        expect(s.heading, x.id).not.toMatch(/—/);
        expect([255, 256, 257, 258], x.id).toContain(s.pdf_page);
      }
    expect(record('core.quest.closing_portal.reward').source).toEqual([
      expect.objectContaining({ pdf_page: 257, heading: 'Reward:' }),
      expect.objectContaining({ pdf_page: 258, heading: 'Aftermath' }),
    ]);
  });

  it('keeps Molgor without EP or Loot and records changelog entry 109 unapplied', () => {
    const molgor = corpus.tables.find((x) => x.id === 'table.quest.slaying_fiend.molgor')!;
    expect(molgor.columns.map((c) => c.label)).toEqual([
      'CS',
      'RS',
      'DMG',
      'NA',
      'DEX',
      'To hit',
      'RES',
      'M',
      'HP',
    ]);
    expect(molgor.issues).toContain('issue.quest.molgor_card_ep_loot');
    const issues = parse(readFileSync(join(repoRoot, 'review/ambiguities.yaml'), 'utf8')) as Array<{
      id: string;
      status: string;
      related: string[];
      source: Array<{ document: string; locator?: { row?: number } }>;
    }>;
    const issue = issues.find((i) => i.id === 'issue.quest.molgor_card_ep_loot')!;
    expect(issue.status).toBe('unresolved');
    expect(issue.related).toEqual([
      'quest_actor.chamber_of_reverence.molgor',
      'table.quest.slaying_fiend.molgor',
    ]);
    expect(issue.source).toContainEqual(
      expect.objectContaining({ document: 'vonbraus.changelog_2_2x', locator: { row: 109 } }),
    );
  });

  it('types every printed die the quest rules read', () => {
    const dice = (ruleId: string, field: string) =>
      (corpus.rules.find((r) => r.id === ruleId)!.fields as Record<string, { dice?: unknown }>)[
        field
      ]?.dice;
    expect(dice('core.quest.slaying_fiend.placement', 'hero_placement_roll')).toEqual({
      count: 1,
      sides: 3,
    });
    expect(dice('core.quest.slaying_fiend.placement', 'molgor_placement_roll')).toEqual({
      count: 1,
      sides: 6,
    });
    expect(dice('core.quest.closing_portal.ritual_start', 'duration_die')).toEqual({
      count: 1,
      sides: 6,
    });
    const demons = corpus.tables.find((x) => x.id === 'table.quest.closing_portal.demons')!;
    expect(
      demons.rows.map((r) => (r.cells as Record<string, { printed: string }>).quantity?.printed),
    ).toEqual(['1d6', '1d3', '1d3']);
  });
});
