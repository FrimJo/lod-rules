import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const result = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.stopping_necromancer.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => result(suffix, inputs).state;
describe('Stopping the Necromancer — PDF261', () => {
  it('preserves setup and six longsword zombies', () => {
    expect(run('setup')).toMatchObject({
      objective: 'find and kill Ragnalf the Mad',
      location: 'No travel necessary',
      special_rules_printed: '-',
      corridors: 7,
      rooms: 7,
      advertised_reward_per_hero: 300,
      encounters: 'Undead',
    });
    expect(run('objective_setup')).toMatchObject({
      ragnalf_position: 'far end of the room',
      zombies: 6,
      zombie_weapon: 'longswords',
      zombie_position: 'close to Ragnalf',
      hero_entry: 'short side',
    });
  });
  it('checks every Threat cell', () => {
    const table = corpus.tables.find((x) => x.id === 'table.quest.stopping_necromancer.threat');
    expect(table?.rows[0]?.cells).toEqual({
      start: { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'initial' },
      min: { type: 'text', printed: 'Same as start lvl' },
      max: { type: 'number', printed: '20', value: 20, meaning: 'value' },
    });
  });
  it('checks all Ragnalf cells and both equipment/XP footnotes', () => {
    const table = corpus.tables.find((x) => x.id === 'table.quest.stopping_necromancer.ragnalf');
    expect(Object.values(table?.rows[0]?.cells ?? {})).toEqual(
      [45, 60, 0, 0, 50, -5, 50, 4, 16].map((value) => ({
        type: 'number',
        printed: String(value),
        value,
        meaning: 'value',
      })),
    );
    expect(table?.footnotes).toEqual([
      'Ragnalf knows Raise Dead, 3 Ranged Spells and 2 Close-combat spells. Armed with a poisonous dagger and Armour 0.',
      'XP 200, T4',
    ]);
    expect(run('ragnalf')).toMatchObject({
      raise_dead_known: true,
      ranged_spells: 3,
      close_combat_spells: 2,
      weapon: 'poisonous dagger',
      armour: 0,
      xp: 200,
      treasure_table: 'T4',
    });
    expect(run('ragnalf')).not.toHaveProperty('poison_strength');
  });
  it('confines floor modifiers to heroes in the Objective Room', () => {
    expect(run('corpse_floor', { hero_in_objective_room: true })).toMatchObject({
      cs_modifier: -10,
      rs_modifier: -10,
    });
    expect(run('corpse_floor', { hero_in_objective_room: false })).not.toHaveProperty(
      'cs_modifier',
    );
  });
  it.each([89, 90, 99, 100])('checks falling on To Hit %s', (roll) => {
    const state = run('fall', { hero_in_objective_room: true, to_hit_roll: roll });
    expect(state.hero_fallen === true).toBe(roll >= 90);
    expect(state.next_action_getting_up_required === true).toBe(roll >= 90);
    expect(state.dex_test_required === true).toBe(roll >= 90);
    expect(run('fall', { hero_in_objective_room: false, to_hit_roll: roll })).not.toHaveProperty(
      'hero_fallen',
    );
  });
  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('requires the next action and successful DEX: %s/%s', (action, success) => {
    const state = run('getting_up_success', {
      hero_in_objective_room: true,
      hero_fallen: true,
      next_action_spent_getting_up: action,
      dex_test_succeeded: success,
    });
    expect(state.hero_fallen).toBe(!(action && success));
    expect(state.getting_up_succeeded === true).toBe(action && success);
  });
  it('does not stand an unfallen hero or advance zombies at living Ragnalf', () => {
    expect(
      result('getting_up_success', {
        hero_in_objective_room: true,
        hero_fallen: false,
        next_action_spent_getting_up: true,
        dex_test_succeeded: true,
      }).trace,
    ).toEqual([]);
    expect(run('zombie_protection', { ragnalf_dead: false })).toMatchObject({
      zombies_advance_toward_heroes: false,
      zombie_formation: 'circle to protect Ragnalf',
    });
  });
  it.each([true, false])('kills all zombies only on Ragnalf death=%s', (dead) => {
    expect(run('ragnalf_death', { ragnalf_dead: dead }).all_zombies_dead === true).toBe(dead);
    expect(
      run('ragnalf_death', { ragnalf_dead: dead }).corpse_floor_movement_stopped === true,
    ).toBe(dead);
  });
  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('gates payment on death and town return: %s/%s', (dead, town) => {
    expect(
      run('reward', { ragnalf_dead: dead, heroes_back_in_town: town }).reward_per_hero === 300,
    ).toBe(dead && town);
  });
});
