import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const result = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.closing_portal.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => result(suffix, inputs).state;
const table = (suffix: string) => {
  const record = corpus.tables.find((x) => x.id === `table.quest.closing_portal.${suffix}`);
  if (!record) throw new Error(`Missing ${suffix}`);
  return record;
};
describe('Closing the Portal — rendered PDF257–258', () => {
  it('retains setup, supplied scroll and two initial groups', () => {
    expect(run('setup')).toMatchObject({
      location: 'Silver City',
      corridors: 8,
      rooms: 8,
      advertised_reward_per_hero: 300,
      ritual_scroll_supplied: true,
    });
    expect(run('objective_setup')).toMatchObject({
      initial_demon_table_rolls: 2,
      initial_demon_placement: 'randomly in the room',
      hero_entry: 'centred along the long side',
      portal_position: 'centre of the room over a large summoning circle',
    });
    expect(result('objective_setup').trace).toContain('core.quest.closing_portal.objective_setup');
  });
  it('preserves all Threat cells', () => {
    expect(table('threat').rows[0]?.cells).toEqual({
      start: { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'initial' },
      min: { type: 'text', printed: 'Same as start lvl' },
      max: { type: 'number', printed: '20', value: 20, meaning: 'value' },
    });
  });
  it('preserves every ordinary encounter cell', () => {
    expect(table('encounters').rows.map((x) => x.cells)).toEqual(
      ['Bandits and Brigands', 'Orcs and Goblins', 'Undead', 'Beast', 'Dark Elves', 'Reptiles'].map(
        (printed, i) => ({
          roll: { type: 'number', printed: String(i + 1), value: i + 1, meaning: 'value' },
          dwellers: { type: 'text', printed },
        }),
      ),
    );
  });
  it('preserves every demon cell and parsed quantities', () => {
    expect(table('demons').rows.map((x) => x.cells)).toEqual([
      {
        roll: { type: 'range', printed: '1-4', min: 1, max: 4 },
        demons: { type: 'text', printed: '1d6 Lesser Plague Demons, no weapon, Armour 0.' },
        quantity: { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'value' },
        weapon: { type: 'text', printed: 'no weapon' },
        armour: { type: 'number', printed: '0', value: 0, meaning: 'value' },
      },
      {
        roll: { type: 'number', printed: '5', value: 5, meaning: 'value' },
        demons: { type: 'text', printed: '1d3 Blood Demons with Cursed Weapons, Armour 0.' },
        quantity: { type: 'dice', printed: '1d3', dice: { count: 1, sides: 3 }, meaning: 'value' },
        weapon: { type: 'text', printed: 'Cursed Weapons' },
        armour: { type: 'number', printed: '0', value: 0, meaning: 'value' },
      },
      {
        roll: { type: 'number', printed: '6', value: 6, meaning: 'value' },
        demons: { type: 'text', printed: '1d3 Plague Demons with Cursed Weapons, Armour 0.' },
        quantity: { type: 'dice', printed: '1d3', dice: { count: 1, sides: 3 }, meaning: 'value' },
        weapon: { type: 'text', printed: 'Cursed Weapons' },
        armour: { type: 'number', printed: '0', value: 0, meaning: 'value' },
      },
    ]);
  });
  it.each([1, 9, 10, 11, 19, 20, 21, 29, 30, 31, 90, 100])(
    'replaces encounter result %s only at multiples of ten',
    (roll) => {
      expect(
        run('encounter_replacement', { encounter_result: roll }).demon_encounter === true,
      ).toBe(roll % 10 === 0);
    },
  );
  it.each([1, 2, 3, 4, 5, 6])('keeps type roll %s separate from group quantity', (roll) => {
    const branch = roll <= 4 ? 1 : roll - 3;
    const types = ['Lesser Plague Demons', 'Blood Demons', 'Plague Demons'];
    expect(run(`demon_type_${branch}`, { demon_type_roll: roll }).demon_type).toBe(
      types[branch - 1],
    );
    for (const quantity of [1, branch === 1 ? 6 : 3]) {
      expect(
        run(`demon_group_${branch}`, {
          demon_type_roll: roll,
          group_quantity_roll: quantity,
          group_encounter: true,
        }).demon_count,
      ).toBe(quantity);
      expect(
        run(`demon_group_${branch}`, {
          demon_type_roll: roll,
          group_quantity_roll: quantity,
          group_encounter: false,
        }),
      ).not.toHaveProperty('demon_count');
    }
    const spawned = run('single_demon_spawn', { portal_open: true, spawn_turn_supplied: true });
    expect(spawned.demons_spawned).toBe(1);
    expect(spawned).not.toHaveProperty('group_quantity_roll');
  });
  it.each([1, 6])('uses 1d6+1 duration, die %s', (die) => {
    expect(
      run('ritual_start', {
        hero_in_objective_room: true,
        ritual_eligibility_supplied: true,
        reader_stationary: true,
        duration_die: die,
      }),
    ).toMatchObject({
      reading_allowed: true,
      required_turns: die + 1,
      reading_position: 'anywhere in the room',
      must_remain_stationary: true,
    });
  });
  it.each(['hero_in_objective_room', 'ritual_eligibility_supplied', 'reader_stationary'])(
    'requires %s before reading',
    (key) => {
      expect(
        run('ritual_start', {
          hero_in_objective_room: true,
          ritual_eligibility_supplied: true,
          reader_stationary: true,
          duration_die: 1,
          [key]: false,
        }),
      ).not.toHaveProperty('reading_allowed');
    },
  );
  const uninterrupted = {
    reading_active: true,
    interrupted_other_way: false,
    reader_wounded: false,
    reader_dodged: false,
    reader_parried: false,
    reader_stationary: true,
  };
  it.each([
    'interrupted_other_way',
    'reader_wounded',
    'reader_dodged',
    'reader_parried',
    'reader_stationary',
  ])('restarts for %s without deciding whether to reroll duration', (key) => {
    const state = run('ritual_interruption', {
      ...uninterrupted,
      [key]: key !== 'reader_stationary',
    });
    expect(state).toMatchObject({ restart_required: true, reading_progress_turns: 0 });
    expect(state).not.toHaveProperty('required_turns');
  });
  it('does not restart uninterrupted or inactive reading', () => {
    expect(run('ritual_interruption', uninterrupted)).not.toHaveProperty('restart_required');
    expect(
      run('ritual_interruption', { ...uninterrupted, reading_active: false, reader_wounded: true }),
    ).not.toHaveProperty('restart_required');
  });
  const closure = {
    valid_reading_attempt: true,
    reader_stationary: true,
    reading_interrupted: false,
    reading_progress_turns: 7,
    required_turns: 7,
  };
  it('closes after the duration and requires remaining demons killed', () => {
    expect(run('portal_closure', closure)).toMatchObject({
      portal_closed: true,
      remaining_demons_must_be_killed: true,
    });
  });
  it.each([
    'valid_reading_attempt',
    'reader_stationary',
    'reading_interrupted',
    'reading_progress_turns',
  ])('guards closure with %s', (key) => {
    expect(
      run('portal_closure', {
        ...closure,
        [key]: key === 'reading_progress_turns' ? 6 : key === 'reading_interrupted',
      }),
    ).not.toHaveProperty('portal_closed');
  });
  it.each([
    [true, true],
    [false, true],
    [true, false],
    [false, false],
  ])('separates spawn, loot and payment gates: closed=%s dead=%s', (closed, dead) => {
    const loot = run('objective_loot', { portal_closed: closed, all_demons_dead: dead });
    expect(loot.objective_chests === 2).toBe(closed && dead);
    if (closed && dead)
      expect(loot).toMatchObject({
        chests_locked: false,
        chests_trapped: false,
        treasure_tables_required: true,
      });
    for (const outside of [true, false])
      expect(
        run('reward', {
          portal_closed: closed,
          all_demons_dead: dead,
          heroes_back_outside: outside,
        }).reward_per_hero === 300,
      ).toBe(closed && dead && outside);
    for (const scheduled of [true, false])
      expect(
        run('single_demon_spawn', { portal_open: !closed, spawn_turn_supplied: scheduled })
          .demons_spawned === 1,
      ).toBe(!closed && scheduled);
  });
});
