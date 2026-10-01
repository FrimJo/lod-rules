import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot(),
  fixture = corpus.testCases.find((x) => x.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.returning_relic', inputs }, corpus);
const base: State = {
  phase: 'refit',
  instance_quest_id: 'quest.chamber_of_reverence.returning_relic',
  relic_owner_matches: true,
  stone_returned: false,
  relic_setup_processed: false,
  relic_threat_initialized: false,
  relic_threat_requested: false,
  threat_roll_supplied: true,
  threat_die: 1,
  threat: 7,
  relic_objective_processed: false,
  relic_encounters_requested: false,
  objective_room_entered: false,
  scenario_event_supplied: true,
  actual_scenario_event: 1,
  last_scenario_event: 0,
  relic_scenario_pending: false,
  scenario_roll: 8,
  refit_event_supplied: true,
  refit_scope_resolved: true,
  actual_refit_turn: 1,
  last_refit_turn: 0,
  pending_refit_turn: 0,
  all_enemies_dead: true,
  hero_in_front_of_statue: true,
  relic_refit_pending: false,
  relic_dex_requested: false,
  relic_failure_threat_pending: false,
  relic_failure_threat_requested: false,
  refit_result_supplied: true,
  refit_result_matches_attempt: true,
  dex_test_succeeded: false,
  refit_attempts_this_turn: 0,
  valid_refit_attempt: false,
  relic_reward_processed: false,
  relic_reward_owner_matches: true,
  heroes_home: false,
  coins: 700,
  luck_points: 3,
  other_luck_nullification: true,
  instance_completed: false,
};
describe('Returning the Relic source-owned lifecycle — PDF255', () => {
  it.each([1, 2, 3, 4])('actual initial d4 %i initializes Threat once', (threat_die) => {
    const first = run({ ...base, phase: 'setup', threat_die });
    expect(first.state).toMatchObject({
      location: 'Random',
      corridors: 8,
      rooms: 8,
      threat: threat_die + 1,
      relic_start_threat: threat_die + 1,
      relic_minimum_threat: threat_die + 1,
      relic_maximum_threat: 20,
      coins: 700,
      luck_points: 3,
      all_heroes_luck_points_nullified: true,
    });
    expect(run({ ...first.state, threat: 16, threat_die: 4 }).state.threat).toBe(16);
  });
  it('missing initial Threat requests without initializing', () => {
    expect(run({ ...base, phase: 'setup', threat_roll_supplied: false }).state).toMatchObject({
      relic_threat_initialized: false,
      relic_threat_requested: true,
      threat: 7,
    });
  });
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'actual Scenario %i trigger resets per event and never replays',
    (scenario_roll) => {
      const first = run({ ...base, phase: 'scenario', scenario_roll });
      expect(first.state.scenario_die_triggered).toBe(scenario_roll >= 8);
      expect(first.state.last_scenario_event).toBe(1);
      expect(run({ ...first.state, scenario_roll: 10 }).state.scenario_die_triggered).toBe(
        scenario_roll >= 8,
      );
      const next = run({ ...first.state, actual_scenario_event: 2, scenario_roll: 1 });
      expect(next.state.scenario_die_triggered).toBe(false);
    },
  );
  it('actual objective entry hands off exactly two encounters and placement once', () => {
    const first = run({ ...base, phase: 'objective_room', objective_room_entered: true });
    expect(first.state).toMatchObject({
      hero_entry: 'short side',
      statue_position: 'far end of the room',
      encounter_rolls: 2,
      relic_encounters_requested: true,
    });
    expect(first.state.enemy_count).toBeUndefined();
    expect(run(first.state).trace).not.toContain('core.quest.returning_relic.objective_setup');
  });
  it.each([
    { all_enemies_dead: false },
    { hero_in_front_of_statue: false },
    { refit_scope_resolved: false },
    { refit_event_supplied: false },
    { actual_refit_turn: 1, last_refit_turn: 1 },
    { relic_owner_matches: false },
    { instance_quest_id: 'quest.chamber_of_reverence.closing_portal' },
  ] as State[])('invalid source attempt %j cannot refit or raise Threat', (patch) => {
    const r = run({ ...base, ...patch, dex_test_succeeded: true });
    expect(r.state).toMatchObject({ stone_returned: false, threat: 7, coins: 700 });
    expect(r.trace).not.toContain('core.quest.returning_relic.refit_success');
  });
  it('failure consumes opportunity once and raises actual Threat1 without replay', () => {
    const first = run(base);
    expect(first.state).toMatchObject({
      threat: 8,
      stone_returned: false,
      refit_attempts_this_turn: 1,
      last_refit_turn: 1,
      relic_refit_pending: false,
      relic_failure_threat_pending: false,
      luck_points: 3,
    });
    expect(run({ ...first.state, dex_test_succeeded: true }).state).toMatchObject({
      threat: 8,
      stone_returned: false,
    });
    const next = run({ ...first.state, actual_refit_turn: 2 });
    expect(next.state.threat).toBe(9);
    expect(next.state.last_refit_turn).toBe(2);
  });
  it('actual successful pending DEX returns stone and clears only owned Luck flag', () => {
    const first = run({ ...base, refit_result_supplied: false });
    expect(first.state).toMatchObject({
      relic_refit_pending: true,
      relic_dex_requested: true,
      stone_returned: false,
      threat: 7,
    });
    const result = run({ ...first.state, refit_result_supplied: true, dex_test_succeeded: true });
    expect(result.state).toMatchObject({
      stone_returned: true,
      all_heroes_luck_points_nullified: false,
      luck_points: 3,
      other_luck_nullification: true,
      coins: 700,
      relic_refit_pending: false,
    });
    expect(result.trace).toContain('core.quest.returning_relic.refit_success');
    expect(result.trace).toContain('core.quest.returning_relic.curse_ends');
    expect(run(result.state).trace).not.toContain('core.quest.returning_relic.refit_success');
  });
  it('pending attempt rejects a later turn or mismatched result without replacement', () => {
    const first = run({ ...base, refit_result_supplied: false });
    expect(
      run({ ...first.state, actual_refit_turn: 2, dex_test_succeeded: true }).state,
    ).toMatchObject({
      pending_refit_turn: 1,
      last_refit_turn: 1,
      relic_refit_pending: true,
      stone_returned: false,
    });
    expect(
      run({
        ...first.state,
        refit_result_supplied: true,
        refit_result_matches_attempt: false,
        dex_test_succeeded: true,
      }).state.stone_returned,
    ).toBe(false);
  });
  it('failure at19 reaches20 once; at20 preserves unresolved maximum accounting', () => {
    expect(run({ ...base, threat: 19 }).state).toMatchObject({
      threat: 20,
      relic_failure_threat_pending: false,
    });
    const capped = run({ ...base, threat: 20 });
    expect(capped.state).toMatchObject({
      threat: 20,
      threat_increase: 1,
      relic_failure_threat_pending: true,
      relic_failure_threat_requested: true,
    });
    expect(run({ ...capped.state, actual_refit_turn: 2 }).state).toMatchObject({
      last_refit_turn: 1,
      threat: 20,
    });
  });
  it.each([
    { stone_returned: false, heroes_home: true },
    { stone_returned: true, heroes_home: false },
    { stone_returned: true, heroes_home: true, relic_reward_owner_matches: false },
    { stone_returned: true, heroes_home: true, relic_reward_processed: true },
  ] as State[])('reward guard %j preserves coins', (patch) => {
    expect(run({ ...base, phase: 'reward', ...patch }).state.coins).toBe(700);
  });
  it('each actual returned-home hero receives300 once without party multiplication', () => {
    const success = run({ ...base, dex_test_succeeded: true });
    const first = run({ ...success.state, phase: 'reward', heroes_home: true });
    expect(first.state).toMatchObject({
      coins: 1000,
      relic_reward_processed: true,
      stone_returned: true,
      instance_completed: false,
      luck_points: 3,
    });
    expect(run(first.state).state.coins).toBe(1000);
    expect(
      run({ ...success.state, phase: 'reward', heroes_home: true, coins: 10 }).state.coins,
    ).toBe(310);
    expect(first.state.objective_chests).toBeUndefined();
  });
});
