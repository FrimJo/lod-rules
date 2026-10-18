import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const fixture = (extra: Partial<TestCase>, inputs: State): TestCase =>
  ({
    id: 'test.backgrounds.derived',
    kind: 'derived_case',
    inputs,
    expected: { state: {}, events: [], trace: [], unresolved: [], steps: [] },
    ...extra,
  }) as TestCase;
const rule = (id: string, inputs: State) => runCase(fixture({ rule_ids: [id] }, inputs), corpus);
const lostBrother = (inputs: State) =>
  runCase(fixture({ procedure_id: 'procedure.lost_brother_personal_quest' }, inputs), corpus);
const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined;
const lb = (suffix: string) => `character.background.the_lost_brother.${suffix}`;

describe('Backgrounds — PDF 42–48 printed headings', () => {
  const records = [...corpus.rules, ...corpus.entities, ...corpus.procedures].filter((record) =>
    record.section_id.startsWith('section.backgrounds.'),
  );
  it('cites the printed numbered heading and the chapter on every rulebook source', () => {
    expect(records.length).toBeGreaterThan(60);
    for (const record of records)
      for (const source of record.source.filter(
        (s) => s.document === 'rulebook.second_printing.eng',
      )) {
        expect(field(source, 'section'), record.id).toBe('Backgrounds');
        expect(source.heading, record.id).toMatch(/^\d{1,2}\. [A-Z]/);
      }
  });
  it('quotes the arachnophobia pointer without the quotation marks The Well prints', () => {
    const text = (id: string) => corpus.entities.find((e) => e.id === id)?.source_text;
    expect(text('background.arachnophobia')).toContain('(See Psychology Chapter)');
    expect(text('background.the_well')).toContain('(See ‘Psychology’ Chapter)');
    expect(text('background.the_lost_brother')).toContain('You gain + 10 RES permanently.');
  });
});

describe('6. The Lost Brother — ordered personal quest', () => {
  const base = {
    at_quest_start: true,
    quest_start_roll: 1,
    brother_found: false,
    entered_brother_room: true,
    dungeons_entered: 4,
    brother_dead: false,
    burying_brother: false,
    death_consequences_received: false,
    danger_approaches: false,
    died_in_dungeon: false,
    died_in_skirmish: false,
    buried_brother_outside: false,
    burial_reward_received: false,
    reached_next_settlement: false,
    rescue_reward_received: false,
    sanity: 8,
    xp: 0,
    resolve: 30,
  };
  it('requires the quest-start roll of 1 before the brother is placed', () => {
    for (const [start, roll] of [
      [true, 2],
      [false, 1],
    ] as const)
      expect(
        rule(lb('quest_setup'), { at_quest_start: start, quest_start_roll: roll }).trace,
      ).toEqual([]);
  });
  it('dead at 60 or higher: −3 Sanity, 250 XP, carry the body and +10 RES on burial', () => {
    const result = lostBrother({
      ...base,
      roll: 56,
      burial_choice: 'bury',
      buried_brother_outside: true,
    });
    expect(result.state).toMatchObject({
      result: 60,
      brother_dead: true,
      brother_alive: false,
      sanity: 5,
      xp: 250,
      must_carry_body: true,
      search_treasure_allowed: false,
      carry_found_items_allowed: false,
      resolve: 40,
    });
    expect(result.trace).not.toContain(lb('surviving_brother'));
    expect(result.trace).not.toContain(lb('rescue_reward'));
  });
  it('leaving the body still costs Sanity and gives XP, with no burial reward', () => {
    const result = lostBrother({ ...base, roll: 70, burial_choice: 'leave' });
    expect(result.state).toMatchObject({ sanity: 5, xp: 250, burying_brother: false, resolve: 30 });
    expect(result.trace).not.toContain(lb('carrying_restrictions'));
  });
  it('alive below 60: Bandit Monster Card (changelog 2.21 #142) and 1500 XP at the settlement', () => {
    const result = lostBrother({
      ...base,
      roll: 55,
      burial_choice: 'leave',
      reached_next_settlement: true,
    });
    expect(result.state).toMatchObject({
      result: 59,
      brother_alive: true,
      brother_wounded: true,
      representing_monster_card: 'Bandit Monster Card',
      xp: 1500,
      sanity: 8,
    });
    expect(result.trace).not.toContain(lb('remains_found'));
  });
  it('a rescued brother who dies in the dungeon reverts to the dead result', () => {
    const result = lostBrother({
      ...base,
      roll: 10,
      burial_choice: 'leave',
      died_in_dungeon: true,
      reached_next_settlement: true,
    });
    expect(result.state).toMatchObject({ brother_dead: true, sanity: 5, xp: 250 });
    expect(result.trace).not.toContain(lb('rescue_reward'));
  });
  it('the printed sentence keeps the civilian card while the effect follows the ruling', () => {
    const surviving = corpus.rules.find((r) => r.id === lb('surviving_brother'));
    expect(surviving?.source_text).toContain('civilian Monster Card');
    expect(surviving?.source.map((s) => field(field(s, 'locator'), 'row'))).toContain(142);
  });
});

describe('Character Creation Example — PDF 49–50 against the catalogues', () => {
  const tables = corpus.tables;
  const table = (id: string) => tables.find((t) => t.id === id)!;
  const printed = (cell: unknown) => String((cell as { printed?: unknown }).printed ?? '');
  const stats: Record<string, number> = { STR: 47, CON: 33, DEX: 42, WIS: 32, RES: 44 };
  const bases = new Map(
    table('table.character.skill_bases').rows.map((row) => [
      printed(row.cells.skill),
      printed(row.cells.base_stat),
    ]),
  );
  const modifiers = new Map<string, number>();
  for (const row of table('table.character.warrior_priest_skills').rows)
    for (const side of ['left', 'right']) {
      const value = field(row.cells[`${side}_modifier`], 'value');
      if (typeof value === 'number') modifiers.set(printed(row.cells[`${side}_skill`]), value);
    }
  const skill = (name: string) =>
    rule('character.skill.starting_value', {
      base_stat: stats[bases.get(name)!]!,
      profession_modifier: modifiers.get(name)!,
    }).state.skill_value;
  it.each([
    ['Ranged Skill', 37],
    ['Dodge', 37],
    ['Pick Locks', 22],
    ['Barter', 22],
    ['Heal', 37],
    ['Alchemy', 17],
    ['Battle Prayers', 59],
    ['Foraging', 13],
  ] as const)('%s matches the printed sheet value %i', (name, value) =>
    expect(skill(name)).toBe(value),
  );
  it('Perception 42 is 22 plus the Free Skill and Night Vision', () => {
    expect(skill('Perception')).toBe(22);
    expect(
      rule('character.talent.night_vision.perception', {
        test_skill: 'perception',
        check_modifier: 0,
      }).state.check_modifier,
    ).toBe(10);
  });
  it('Combat Skill from the table is 47, not the printed 42 (recorded issue)', () => {
    expect(skill('Combat Skill')).toBe(47);
    expect(
      corpus.testCases.find((t) => t.id === 'test.backgrounds.creation_example.specialisation')
        ?.issues,
    ).toContain('issue.backgrounds.creation_example_values');
  });
  it('the Leather Jacket price leaves 10 c of 150 c, not the printed 30 c', () => {
    const coins = rule('character.creation.starting_coins', { coins: 0 }).state.coins as number;
    const jacket = table('table.equipment.armour').rows.find((row) => row.id === 'leather_jacket')!;
    expect(coins - Number.parseInt(printed(jacket.cells.cost), 10)).toBe(10);
  });
  it('the Morning Star has the standard Durability 6, so a wear roll of 3 leaves 3', () => {
    const max = rule('character.durability.standard', {
      weapon_armour_or_shield: true,
      otherwise_noted: false,
    }).state.maximum_durability;
    expect(max).toBe(6);
    const wear = corpus.testCases.find(
      (t) => t.id === 'test.backgrounds.creation_example.morning_star_wear',
    );
    expect(wear?.inputs.maximum_durability).toBe(max);
  });
  it('Holy Water in Quick Slot 1 breaks on a torso hit when the 1d10 shows 1', () => {
    const holyWater = tables
      .flatMap((t) => t.rows)
      .find((row) => row.id === 'holy_water' && row.cells.durability)!;
    const slots = rule('character.equipment.quick_slots', { item_is_armour: false }).state
      .quick_slots as number;
    for (const roll of [1, 2]) {
      const result = rule('character.durability.quick_slot_hit', {
        torso_hit: true,
        roll,
        slot_count: slots,
        slot_has_item: roll === 1,
        durability_applicable: true,
        magic_other_item: false,
        durability: field(holyWater.cells.durability, 'value') as number,
      });
      expect(result.state.durability).toBe(roll === 1 ? 0 : 1);
    }
  });
});
