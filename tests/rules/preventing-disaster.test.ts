import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.preventing_disaster.${suffix}`], inputs } as TestCase, corpus);
describe('Preventing a Disaster — PDF247–248', () => {
  it('retains Silver City, room pool and two scrolls needing one success', () => {
    expect(run('setup').state).toEqual({
      location: 'Silver City',
      corridors: 7,
      rooms: 7,
      room_tiles: 'R1B-8B',
      encounters: 'Undead',
      reward_per_hero: 300,
      scrolls_supplied: 2,
      successful_incantations_required: 1,
    });
    expect(run('brotherhood_corpses').state).toEqual({
      ignore_dead_brotherhood_special_rules: true,
      brotherhood_corpses_treated_as: 'dead adventurers',
      search_as_dead_adventurers: true,
    });
  });
  it('enters opposite the altar wall and randomly places three encounter rolls', () => {
    expect(run('objective_setup').state).toEqual({
      hero_entry: 'wall opposite the altar',
      undead_encounter_rolls: 3,
      enemy_placement: 'randomly in the room',
    });
  });
  it.each([
    [true, true, 1, true],
    [true, true, 2, true],
    [true, true, 3, false],
    [false, true, 1, false],
    [true, false, 1, false],
  ])(
    'requires active local Scenario1–2 tremor: %s / %s / %s',
    (active, inRoom, roll, triggered) => {
      const state = run('tremor_event', {
        tremors_active: active,
        in_objective_room: inRoom,
        scenario_roll: roll,
      }).state;
      expect(state.each_character_dex_test_required === true).toBe(triggered);
      if (triggered) expect(state.undead_unaffected).toBe(true);
    },
  );
  it.each([true, false])('topples only a hero failing the source tremor test: %s', (failed) => {
    const state = run('toppled', { hero_failed_tremor_dex_test: failed }).state;
    expect(state.hero_toppled === true).toBe(failed);
    if (failed) expect(state.next_action_required).toBe('stand up with a DEX Test');
  });
  it('retains action-based standing attempts and ordinary lying-target bonus', () => {
    expect(run('standing_attempt', { hero_still_lying: true }).state).toMatchObject({
      standing_attempts_per_action: 1,
      standing_attempts_per_turn: 2,
      standing_requires_dex_test: true,
      undead_attack_bonus_against_lying_hero: 'Standard Bonus for attacking someone lying down',
    });
    expect(run('standing_attempt', { hero_still_lying: false }).state).not.toHaveProperty(
      'standing_attempts_per_action',
    );
  });
  it.each([true, false])(
    'requires the source scroll attempt and destroys failed scrolls too: %s',
    (valid) => {
      const state = run('scroll_attempt', { valid_incantation_attempt: valid }).state;
      expect(state.scroll_consumed_per_attempt === 1).toBe(valid);
      if (valid) expect(state.failed_scroll_also_crumbles).toBe(true);
      expect(state).not.toHaveProperty('scrolls_remaining');
      expect(
        corpus.rules.find((x) => x.id === 'core.quest.preventing_disaster.scroll_attempt')
          ?.overrides,
      ).toEqual(['core.magic.scroll.destroyed']);
    },
  );
  it.each([
    [true, true],
    [true, false],
    [false, true],
  ])(
    'requires valid successful casting for easy escape, without enemy death guard: %s / %s',
    (valid, success) => {
      const state = run('incantation_success', {
        valid_incantation_attempt: valid,
        incantation_succeeded: success,
        all_undead_dead: false,
      }).state;
      expect(state.easy_escape_to_surface === true).toBe(valid && success);
      if (valid && success)
        expect(state).toMatchObject({ tremors_stop: true, reward_per_hero: 300 });
    },
  );
  it.each([true, false])(
    'requires BOTH failed attempts for flooding and future luck: %s',
    (failed) => {
      const state = run('both_scrolls_fail', { both_scroll_attempts_failed: failed }).state;
      expect(state.river_flooding === true).toBe(failed);
      if (failed) expect(state.escape_turns_before_damage).toBe(3);
      const reward = run('failure_reward', { both_scroll_attempts_failed: failed }).state;
      expect(reward.next_quest_luck_bonus === 1).toBe(failed);
      if (failed)
        expect(reward).toMatchObject({
          priest_reward_per_hero: 0,
          luck_bonus_scope: 'heroes on their next quest',
        });
      expect(reward).not.toHaveProperty('luck');
    },
  );
  it.each([
    [true, true, 3, false],
    [true, true, 4, true],
    [true, true, 5, true],
    [true, false, 4, false],
    [false, true, 4, false],
  ])(
    'damages only remaining heroes after three flooding turns: %s / %s / %s',
    (flooding, remains, turn, damaged) => {
      const state = run('flood_damage', {
        river_flooding: flooding,
        hero_remains_in_chamber: remains,
        turns_since_flooding: turn,
      }).state;
      expect(state.hit_point_loss_dice === '1d6').toBe(damaged);
      if (damaged)
        expect(state).toMatchObject({
          damage_type: 'Fire Damage',
          damage_recurs_each_remaining_turn: true,
        });
    },
  );
  it('keeps the three Threat cells and continuation source folio', () => {
    const t = corpus.tables.find((x) => x.id === 'table.quest.preventing_disaster.threat');
    expect(['start', 'min', 'max'].map((x) => t?.rows[0]?.cells[x]?.printed)).toEqual([
      '6',
      '5',
      '20',
    ]);
    expect(
      corpus.rules.find((x) => x.id === 'core.quest.preventing_disaster.flood_damage')?.source[0],
    ).toMatchObject({ pdf_page: 248, printed_page: 246 });
  });
});
