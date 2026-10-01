import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (prefix: string, suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.${prefix}.${suffix}`], inputs } as TestCase, corpus);
describe('Fountain Room quests — rendered PDF253–254', () => {
  it('retains no travel for cleansing and random location for Baptising', () => {
    expect(run('cleansing_water', 'setup').state).toEqual({
      travel_required: false,
      corridors: 7,
      rooms: 7,
      encounters: 'Reptiles',
      reward_per_hero: 300,
    });
    expect(run('baptising', 'setup').state).toMatchObject({
      location: 'Random',
      special_rules_printed: '-',
      corridors: 7,
      rooms: 7,
      reward_per_hero: 300,
      encounters: 'Orcs and Goblins',
    });
  });
  it('preserves three random rolls plus two unarmoured Gecko Assassins', () => {
    expect(run('cleansing_water', 'objective_setup').state).toEqual({
      reptile_encounter_rolls: 3,
      reptile_placement: 'randomly in the chamber',
      gecko_assassins: 2,
      assassin_placement: 'close to the fountain',
      assassin_weapon: 'shortswords',
      assassin_armour: 0,
    });
  });
  it.each([true, false])('requires all reptiles dead for the cleansing aftermath: %s', (dead) => {
    expect(
      run('cleansing_water', 'aftermath', { all_reptiles_dead: dead }).state
        .prepare_return_to_surface === true,
    ).toBe(dead);
  });
  it.each([
    [true, true],
    [true, false],
    [false, true],
  ])(
    'requires temple return and all reptiles dead for per-hero payment/potion: %s / %s',
    (dead, returned) => {
      const state = run('cleansing_water', 'reward', {
        all_reptiles_dead: dead,
        heroes_back_in_temple: returned,
      }).state;
      expect(state.healing_potions_per_hero === 1).toBe(dead && returned);
      if (dead && returned)
        expect(state).toMatchObject({ reward_per_hero: 300, potion_strength_unspecified: true });
      expect(state).not.toHaveProperty('healing_die');
      expect(state).not.toHaveProperty('coins');
    },
  );
  it('places Gaul at the far-side fountain with two other random encounter rolls', () => {
    expect(run('baptising', 'objective_setup').state).toEqual({
      encounter_rolls: 2,
      enemy_placement: 'randomly in the chamber',
      gaul_position: 'next to the fountain, on the far side',
    });
  });
  it('does not add Gaul’s already included bonus to the printed Damage again', () => {
    expect(run('baptising', 'gaul').state).toEqual({
      enemy_kind: 'huge Orc',
      weapon: 'Longsword',
      shield: true,
      armour: 2,
      weapon_damage_bonus: 1,
      bonus_duration: 'rest of the battle',
      printed_damage: 2,
      printed_damage_includes_fountain_bonus: true,
      xp: 150,
      treasure_table: 'T4',
    });
  });
  it.each([true, false])(
    'requires the fight over for two unlocked/untrapped objective chests: %s',
    (over) => {
      const state = run('baptising', 'aftermath_chests', { objective_fight_over: over }).state;
      expect(state.objective_chests === 2).toBe(over);
      if (over)
        expect(state).toMatchObject({
          chest_position: 'stacked against a wall',
          chests_locked: false,
          chests_trapped: false,
        });
    },
  );
  it.each([
    [true, true],
    [true, false],
    [false, true],
  ])('requires fight over and actual dipping for weapon bonus: %s / %s', (over, dipped) => {
    const state = run('baptising', 'weapon_baptising', {
      objective_fight_over: over,
      hero_weapon_dipped: dipped,
    }).state;
    expect(state.weapon_damage_bonus === 1).toBe(over && dipped);
    if (over && dipped) expect(state.bonus_duration).toBe('until the end of the next quest');
  });
  it.each([true, false])('requires fight over before bottle filling/return: %s', (over) => {
    const state = run('baptising', 'water_return', { objective_fight_over: over }).state;
    expect(state.fill_bottle_for_garrison === true).toBe(over);
    if (over) expect(state.return_destination).toBe('Silver City');
    expect(state).not.toHaveProperty('bottle_volume');
  });
  it('checks all Threat and Gaul stat cells', () => {
    for (const [prefix, values] of [
      ['cleansing_water', ['2', '2', '18']],
      ['baptising', ['4', '4', '18']],
    ] as const) {
      const t = corpus.tables.find((x) => x.id === 'table.quest.' + prefix + '.threat');
      expect(['start', 'min', 'max'].map((x) => t?.rows[0]?.cells[x]?.printed)).toEqual(values);
    }
    const t = corpus.tables.find((x) => x.id === 'table.quest.baptising.gaul');
    expect(
      ['cs', 'rs', 'dmg', 'na', 'dex', 'to_hit', 'res', 'm', 'hp'].map(
        (x) => t?.rows[0]?.cells[x]?.printed,
      ),
    ).toEqual(['45', '-', '2', '1', '25', '-10', '40', '4', '22']);
  });
});
