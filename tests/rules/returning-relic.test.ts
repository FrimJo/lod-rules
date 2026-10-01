import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.returning_relic.${suffix}`], inputs } as TestCase, corpus).state;
describe('Returning the Relic — PDF255', () => {
  it('ends temporary nullification without inventing restored Luck amounts', () => {
    expect(run('luck_nullification', { stone_returned: false })).toMatchObject({
      all_heroes_luck_points_nullified: true,
    });
    const returned = run('curse_ends', { stone_returned: true });
    expect(returned.all_heroes_luck_points_nullified).toBe(false);
    expect(returned).not.toHaveProperty('luck_points');
  });
  it.each([7, 8, 9, 10])('checks Scenario boundary %s', (roll) => {
    expect(run('scenario_trigger', { scenario_roll: roll }).scenario_die_triggered === true).toBe(
      roll >= 8,
    );
  });
  it.each([
    [true, true, 0, true],
    [false, true, 0, false],
    [true, false, 0, false],
    [true, true, 1, false],
  ])('guards refitting: %s / %s / %s', (dead, front, attempts, allowed) => {
    expect(
      run('refit_attempt', {
        all_enemies_dead: dead,
        hero_in_front_of_statue: front,
        refit_attempts_this_turn: attempts,
      }).refit_attempt_allowed === true,
    ).toBe(allowed);
  });
  it.each([true, false])('rejects invalid refit outcomes, success=%s', (success) => {
    const state = run(success ? 'refit_success' : 'refit_failure', {
      valid_refit_attempt: false,
      dex_test_succeeded: success,
    });
    expect(state).not.toHaveProperty(success ? 'stone_returned' : 'threat_increase');
  });
  it('adds one Threat on valid failed refitting and returns stone on success', () => {
    expect(
      run('refit_failure', { valid_refit_attempt: true, dex_test_succeeded: false })
        .threat_increase,
    ).toBe(1);
    expect(
      run('refit_success', { valid_refit_attempt: true, dex_test_succeeded: true }).stone_returned,
    ).toBe(true);
  });
  it.each([
    [true, true],
    [true, false],
    [false, true],
  ])('requires stone return and home arrival: %s / %s', (returned, home) => {
    expect(
      run('reward', { stone_returned: returned, heroes_home: home }).reward_per_hero === 300,
    ).toBe(returned && home);
  });
  it('preserves the dependent minimum Threat and singular Beast encounter family', () => {
    const threat = corpus.tables.find((x) => x.id === 'table.quest.returning_relic.threat');
    expect(threat?.rows[0]?.cells.start?.printed).toBe('1d4+1');
    expect(threat?.rows[0]?.cells.min?.printed).toBe('Same as start lvl');
    const encounters = corpus.tables.find((x) => x.id === 'table.quest.returning_relic.encounters');
    expect(encounters?.rows.map((x) => x.cells.dwellers?.printed)).toEqual([
      'Bandits and Brigands',
      'Orcs and Goblins',
      'Undead',
      'Beast',
      'Dark Elves',
      'Reptiles',
    ]);
  });
});
