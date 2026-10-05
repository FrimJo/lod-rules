import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.rescuing_prisoners.${suffix}`], inputs } as TestCase, corpus);
describe('Rescuing the Prisoners — PDF249–250', () => {
  it('retains the setup reward independently from the conflicting aftermath', () => {
    expect(run('setup').state).toMatchObject({
      location: 'Random',
      corridors: 8,
      rooms: 8,
      encounters: 'Bandits and Brigands',
      reward_heading_per_hero: 250,
      prisoners_total: 10,
    });
    expect(run('reward_terms').state).toEqual({
      aftermath_initial_promised: 300,
      all_alive_bonus_per_hero: 100,
      deduction_per_dead_prisoner: 50,
      no_reward_possible: true,
      header_and_aftermath_reward_conflict: true,
    });
  });
  it.each([
    [16, undefined],
    [17, 'Briggo'],
    [18, 'Briggo'],
    [19, 'Gorm'],
    [20, 'Gorm'],
    [21, undefined],
  ])('uses unmodified encounter result for replacement: %s', (roll, enemy) => {
    const inputs: State = { unmodified_encounter_roll: roll };
    const result = runCase(
      {
        rule_ids: [
          'core.quest.rescuing_prisoners.encounter_briggo',
          'core.quest.rescuing_prisoners.encounter_gorm',
        ],
        inputs,
      } as TestCase,
      corpus,
    );
    expect(result.state.encounter_enemy).toBe(enemy);
    if (enemy) expect(result.state.ignore_ordinary_encounter_result).toBe(true);
  });
  it('preserves bed placement, two wall-spread rolls and prisoner movement', () => {
    expect(run('objective_setup').state).toMatchObject({
      golfrid_position: 'by the bed at the far end',
      prisoners_initial_position: 'along one wall',
      ordinary_encounter_rolls: 2,
      ordinary_enemy_placement: 'evenly along the walls',
    });
  });
  it.each(['briggo', 'gorm'])('excludes already killed %s from objective placement', (name) => {
    expect(run('objective_' + name, { [name + '_already_killed']: true }).state).not.toHaveProperty(
      name + '_placed_next_to_golfrid',
    );
    expect(
      run('objective_' + name, { [name + '_already_killed']: false }).state[
        name + '_placed_next_to_golfrid'
      ],
    ).toBe(true);
  });
  it.each([
    [true, 1, 10, true],
    [true, 3, 1, true],
    [true, 4, 10, false],
    [true, 1, 0, false],
    [false, 1, 10, false],
  ])(
    'guards prisoner death by battle,Scenario and remaining prisoners: %s / %s / %s',
    (active, roll, alive, death) => {
      expect(
        run('prisoner_death', {
          objective_battle_active: active,
          scenario_roll: roll,
          prisoners_still_alive: alive,
        }).state.prisoners_killed_this_result === 1,
      ).toBe(death);
    },
  );
  it('retains Frenzy, unlimited arrows and refusing close combat until cornered', () => {
    expect(run('gorm').state.frenzy).toBe(true);
    expect(run('golfrid').state).toMatchObject({
      ranged_weapon: 'shortbow',
      arrows_unlimited: true,
      melee_weapon: 'shortsword',
      armour: 1,
      xp: 120,
      treasure_table: 'T4',
    });
    expect(
      run('golfrid_not_cornered', { golfrid_cornered: false }).state.engages_close_combat,
    ).toBe(false);
    expect(run('golfrid_not_cornered', { golfrid_cornered: true }).state).not.toHaveProperty(
      'engages_close_combat',
    );
    expect(run('golfrid_movement').state.tries_to_leave_close_combat_for_shortbow).toBe(true);
  });
  it.each([
    [0, 350],
    [1, 200],
    [5, 0],
    [6, -50],
    [10, -250],
  ])(
    'uses the ruled 250 c base without choosing a scope or silently clamping: %s dead',
    (dead, raw) => {
      const state = run('reward_arithmetic', {
        objective_battle_over: true,
        survivor_escort_completed: true,
        dead_prisoners: dead,
        reward_case: dead === 0 ? 'all_alive' : 'dead_prisoners',
      }).state;
      expect(state.reward_arithmetic_before_uncertain_floor).toBe(raw);
      expect(state).not.toHaveProperty('coins');
      expect(state).not.toHaveProperty('reward_per_hero');
    },
  );
  it.each([
    [false, true],
    [true, false],
  ])('requires battle end and survivor escort for reward arithmetic: %s / %s', (over, escorted) => {
    expect(
      run('reward_arithmetic', {
        objective_battle_over: over,
        survivor_escort_completed: escorted,
        dead_prisoners: 0,
        reward_case: 'all_alive',
      }).state,
    ).not.toHaveProperty('reward_arithmetic_before_uncertain_floor');
  });
  it('checks every independently transcribed stat cell and Threat cell', () => {
    const ids = ['cs', 'rs', 'dmg', 'na', 'dex', 'to_hit', 'res', 'm', 'hp'];
    for (const [name, values] of [
      ['briggo', ['35', '-', '2', '1', '25', '-10', '35', '6', '40']],
      ['gorm', ['45', '-', '1', '1', '25', '0', '35', '4', '40']],
      ['golfrid', ['35', '55', '0', '0', '50', '-15', '50', '4', '12']],
    ] as const) {
      const t = corpus.tables.find((x) => x.id === 'table.quest.rescuing_prisoners.' + name);
      expect(ids.map((x) => t?.rows[0]?.cells[x]?.printed)).toEqual(values);
    }
    const t = corpus.tables.find((x) => x.id === 'table.quest.rescuing_prisoners.threat');
    expect(['start', 'min', 'max'].map((x) => t?.rows[0]?.cells[x]?.printed)).toEqual([
      '1d4+1',
      'Same as start lvl',
      '20',
    ]);
  });
});
