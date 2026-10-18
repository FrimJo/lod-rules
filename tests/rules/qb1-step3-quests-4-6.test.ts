import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const run = (id: string, inputs: State = {}) =>
  runCase({ rule_ids: [id], inputs } as TestCase, corpus);
const rule = (id: string) => corpus.rules.find((x) => x.id === id)!;
const entity = (id: string) => corpus.entities.find((x) => x.id === id)!;
const table = (id: string) => corpus.tables.find((x) => x.id === id)!;
const procedure = (id: string) => corpus.procedures.find((x) => x.id === id)!;

describe('Quest Book I Quests 4–6B and campaign: verbatim source and printed headings', () => {
  it.each([
    [
      'core.quest.burning_village.reinforcements',
      'The Scenario die should still be rolled and a result of 9 or 10 triggers reinforcements for the Goblinoids.',
      'Special Rules',
    ],
    [
      'core.quest.burning_village.victory',
      'If at any time, there are no living enemies on the table, the heroes win.',
      'Victory Condition',
    ],
    [
      'core.quest.burning_village.fled_aftermath',
      'Continue your travel to Silver city.',
      'If The Heroes Fled…',
    ],
    [
      'core.quest.apprentice.caretaker_encounter',
      'Any Encounter Table roll of 15-20 results in an encounter with the caretaker, plus the ordinary encounter.',
      'Special Rules',
    ],
    [
      'core.quest.apprentice.choose_master',
      'If they choose to go for the Master, Play 6B.',
      'Aftermath',
    ],
    [
      'core.quest.sacrifice.apostle',
      'The Apostle is a Vampire Fledgling armed with a longsword and has Armour 2.',
      'The Apostle',
    ],
    ['core.quest.master.reward', 'Reward: 1000 c.', 'Reward'],
    [
      'core.quest.master.master',
      'He knows Raise Dead, 3 Close combat Spells, and 4 Ranged Spells.',
      'The Master',
    ],
    [
      'core.quest.dead_rising_campaign.start',
      'This campaign starts wherever the heroes are, but the second quest must be started in Silver City.',
      'The Dead Rising',
    ],
  ])('%s quotes the page under its printed heading', (id, quote, heading) => {
    const r = rule(id);
    expect(r.source_text).toContain(quote);
    expect(r.source.map((s) => s.heading)).toContain(heading);
    expect(r.source.every((s) => !String(s.heading).includes('—'))).toBe(true);
  });

  it('keeps every heading in these files free of invented em-dash titles', () => {
    const quests = [
      'quest.dead_rising.campaign',
      'quest.dead_rising.burning_village',
      'quest.dead_rising.apprentice',
      'quest.dead_rising.sacrifice',
      'quest.dead_rising.master',
    ];
    const ids = new Set<string>();
    for (const q of quests) for (const r of entity(q).rules ?? []) ids.add(r);
    const records = [
      ...[...ids].filter((id) => !id.startsWith('core.quest.spring_cleaning')).map(rule),
      ...quests.map(entity),
    ];
    for (const r of records)
      for (const s of r.source) expect(String(s.heading), r.id).not.toMatch(/—/);
  });
});

describe('Campaign start: the second quest must be started in Silver City (PDF 224)', () => {
  it.each([
    [1, 'rochdale', 'core.quest.dead_rising_campaign.start', true],
    [2, 'silver_city', 'core.quest.dead_rising_campaign.start', true],
    [2, 'rochdale', 'core.quest.dead_rising_campaign.start_elsewhere', false],
    [3, 'rochdale', 'core.quest.dead_rising_campaign.start', true],
  ])('quest %s in %s', (n, settlement, fired, allowed) => {
    const inputs = { campaign_quest_number: n, current_settlement: settlement };
    const both = runCase(
      {
        rule_ids: [
          'core.quest.dead_rising_campaign.start',
          'core.quest.dead_rising_campaign.start_elsewhere',
        ],
        inputs,
      } as unknown as TestCase,
      corpus,
    );
    expect(both.trace).toEqual([fired]);
    expect(both.state).toMatchObject({
      quest_start_allowed: allowed,
      required_start_settlement: 'Silver City',
    });
  });
  it('is owned by the campaign root and linked from the campaign and its procedure', () => {
    expect(rule('core.quest.dead_rising_campaign.start').section_id).toBe(
      'section.quest_book_i.the_dead_rising',
    );
    expect(entity('quest.dead_rising.campaign').rules).toContain(
      'core.quest.dead_rising_campaign.start',
    );
    expect(
      procedure('procedure.dead_rising_campaign').dependencies?.some(
        (d) => d.object_id === 'core.quest.dead_rising_campaign.start',
      ),
    ).toBe(true);
  });
});

describe('Typed dice and restrictions', () => {
  it('types the 2d6 wall Zombies and keeps the higher-of-two only on the sacrifice path', () => {
    expect(rule('core.quest.apprentice.wall_zombies').fields?.zombie_roll?.dice).toEqual({
      count: 2,
      sides: 6,
    });
    expect(
      run('core.quest.master.harder_encounter', {
        chose_to_stop_sacrifice: false,
        first_roll: 3,
        second_roll: 9,
      }).trace,
    ).toEqual([]);
  });
  it('restricts the R10 middle chest to the bronze key from Quest 5', () => {
    expect(
      run('core.quest.master.key_missing', { has_emil_bronze_key: false }).state,
    ).toMatchObject({ middle_chest_opening_allowed: false });
    expect(entity('equipment.quest.emil_bronze_key').source.map((s) => s.pdf_page)).toEqual([
      232, 235,
    ]);
  });
});

describe('Stat-block footnotes verbatim and changelog evidence recorded', () => {
  it.each([
    ['table.quest.apprentice.emil', 'XP: 110, T2 Treasure Table'],
    ['table.quest.apprentice.imgrahil', 'XP: 200, T2 Treasure Table'],
    ['table.quest.master.necromancer', 'XP: 200, T4 Treasure Table'],
  ])('%s keeps %s without an added full stop', (id, xp) => {
    const t = table(id);
    expect(t.footnotes).toContain(xp);
    expect(t.source_text).toBe('CS RS DMG NA DEX To hit RES M HP');
  });
  it('keeps the printed T2 for Imgrahil and records changelog #104 as an open issue', () => {
    expect(run('core.quest.apprentice.imgrahil').state).toMatchObject({
      xp: 200,
      treasure_table: 'T2',
    });
    for (const id of ['core.quest.apprentice.imgrahil'])
      expect(rule(id).issues).toContain('issue.quest.imgrahil_loot_card_conflict');
    expect(entity('quest_actor.dead_rising.apostle').issues).toContain(
      'issue.quest.apostle_vampire_fledgling_hp',
    );
  });
});
