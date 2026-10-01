import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const execute = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.go_fetch.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => execute(suffix, inputs).state;
describe('Go Fetch — PDF277', () => {
  it('checks all six table cells against the printed condition results', () => {
    expect(
      corpus.tables
        .find((t) => t.id === 'table.quest.go_fetch.shield_condition')
        ?.rows.map((r) => r.cells),
    ).toEqual([
      {
        roll: { type: 'range', printed: '1-3', min: 1, max: 3 },
        result: {
          type: 'text',
          printed: 'The shield is exactly where it was said to be and seems untouched.',
        },
      },
      {
        roll: { type: 'range', printed: '4-5', min: 4, max: 5 },
        result: {
          type: 'text',
          printed:
            'The shield is lying on the floor beside the fountain and is in a miserable condition. Remove 1d4 points of wear.',
        },
      },
      {
        roll: { type: 'range', printed: '6', min: 6, max: 6 },
        result: {
          type: 'text',
          printed: 'There is no shield to be seen. It seems you have been fighting for nothing.',
        },
      },
    ]);
  });
  it('retains main-quest location/encounters, total reward and R9 inclusion', () => {
    expect(run('setup')).toEqual({
      location: 'same dungeon as the next quest',
      advertised_reward_coins: 350,
      encounters: 'as defined by the main quest',
      objective_room: 'The Sanctuary (R9)',
    });
    expect(run('exploration').required_exploration_card).toBe('R9');
  });
  it.each([true, false])('finds the side objective only with R9: %s', (found) =>
    expect(execute('objective_found', { r9_found: found }).trace).toHaveLength(found ? 1 : 0),
  );
  it('requires the objective for its automatic Encounter', () => {
    expect(run('encounter', { side_quest_objective_room_found: true })).toMatchObject({
      automatic_encounter: true,
      encounter_table_rolls: 1,
      encounter_table_basis: 'quest-specific Encounter Table',
    });
    expect(execute('encounter', { side_quest_objective_room_found: false }).trace).toHaveLength(0);
  });
  it.each([1, 2, 3, 4, 5, 6])(
    'selects the correct condition for %s only after the fight',
    (roll) => {
      const suffix = roll <= 3 ? 'untouched' : roll <= 5 ? 'damaged' : 'missing';
      for (const candidate of ['untouched', 'damaged', 'missing']) {
        expect(
          execute(candidate, { objective_fight_over: true, shield_search_roll: roll }).trace,
        ).toHaveLength(candidate === suffix ? 1 : 0);
        expect(
          execute(candidate, { objective_fight_over: false, shield_search_roll: roll }).trace,
        ).toHaveLength(0);
      }
      const state = run(suffix, { objective_fight_over: true, shield_search_roll: roll });
      expect(state.shield_found).toBe(roll !== 6);
      if (roll === 4 || roll === 5) expect(state.wear_points_to_remove_dice).toBe('1d4');
    },
  );
  it.each([1, 4])(
    'preserves removal of %s wear points without inventing initial health',
    (wear) => {
      expect(
        run('wear', { objective_fight_over: true, shield_search_roll: 4, shield_wear_roll: wear }),
      ).toMatchObject({ shield_wear_points_to_remove: wear });
      expect(
        run('wear', { objective_fight_over: true, shield_search_roll: 4, shield_wear_roll: wear }),
      ).not.toHaveProperty('shield_health');
      expect(
        execute('wear', {
          objective_fight_over: true,
          shield_search_roll: 3,
          shield_wear_roll: wear,
        }).trace,
      ).toHaveLength(0);
    },
  );
  it('retains usable standard Heater Shield DEF6/ENC4 with ordinary health tracking', () => {
    expect(run('shield', { shield_found: true })).toMatchObject({
      shield_kind: 'standard Heater Shield',
      shield_def: 6,
      shield_enc: 4,
      heroes_may_use_shield: true,
      track_shield_health_as_usual: true,
    });
    expect(execute('shield', { shield_found: false }).trace).toHaveLength(0);
  });
  it.each([
    [true, false],
    [true, true],
    [false, false],
    [false, true],
  ])('pays only an unbroken returned shield: %s/%s', (brought, broken) =>
    expect(
      execute('reward', {
        returned_to_adventurer: true,
        shield_brought_back: brought,
        shield_broken: broken,
      }).trace,
    ).toHaveLength(brought && !broken ? 1 : 0),
  );
  it.each([
    [true, false],
    [true, true],
    [false, false],
    [false, true],
  ])('denies payment for missing or broken shield: %s/%s', (missing, broken) => {
    const result = execute('no_reward', {
      returned_to_adventurer: true,
      shield_was_not_found: missing,
      shield_broken: broken,
    });
    expect(result.trace).toHaveLength(missing || broken ? 1 : 0);
    if (missing || broken) expect(result.state.reward_coins).toBe(0);
  });
  it('waits for return before either payment aftermath', () => {
    expect(
      execute('reward', {
        returned_to_adventurer: false,
        shield_brought_back: true,
        shield_broken: false,
      }).trace,
    ).toHaveLength(0);
    expect(
      execute('no_reward', {
        returned_to_adventurer: false,
        shield_was_not_found: true,
        shield_broken: false,
      }).trace,
    ).toHaveLength(0);
    expect(
      run('reward', {
        returned_to_adventurer: true,
        shield_brought_back: true,
        shield_broken: false,
      }).reward_coins,
    ).toBe(350);
  });
});
