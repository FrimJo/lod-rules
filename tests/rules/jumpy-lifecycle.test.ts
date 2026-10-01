import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const run = (inputs: State, id = 'procedure.jumpy') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const scenario: State = {
  phase: 'scenario',
  sanity_system_enabled: true,
  acquired_condition_name: 'Jumpy',
  condition_episode_processed: true,
  jumpy_diagnosis_matches: true,
  jumpy_active: true,
  scenario_roll_confirmed: true,
  scenario_roll: 10,
  jumpy_scenario_processed: false,
  jumpy_threat_context_resolved: true,
  threat: 10,
  unsuspecting_noise_confirmed: false,
  jumpy_noise_processed: false,
  jumpy_scream_this_call: false,
  jumpy_startle_this_call: false,
  jumpy_alert_this_call: false,
  current_conditions: 2,
  sanity: 6,
  maximum_sanity: 6,
  morale: 5,
  actions_remaining: 2,
  hit_points: 20,
};
const noise: State = { ...scenario, phase: 'noise', unsuspecting_noise_confirmed: true };
describe('Jumpy actual Scenario/noise lifecycle — rendered PDF57 and PDF89', () => {
  it.each(Array.from({ length: 10 }, (_, index) => index + 1))(
    'actual roll %i consumes one result with +2 only on 10',
    (scenario_roll) => {
      const result = run({ ...scenario, scenario_roll });
      expect(result.state).toMatchObject({
        threat: scenario_roll === 10 ? 12 : 10,
        jumpy_scenario_processed: true,
        jumpy_scream_this_call: scenario_roll === 10,
        jumpy_startle_this_call: scenario_roll === 10,
        jumpy_alert_this_call: scenario_roll === 10,
      });
      expect(result.trace).toEqual(
        scenario_roll === 10
          ? ['procedure.jumpy', 'character.condition.jumpy']
          : ['procedure.jumpy'],
      );
      expect(result.events).toEqual([]);
      expect(result.state).toMatchObject({
        current_conditions: 2,
        sanity: 6,
        maximum_sanity: 6,
        morale: 5,
        actions_remaining: 2,
        hit_points: 20,
      });
    },
  );
  it('replaying an actual 10 cannot increase Threat or report another scream', () => {
    const first = run(scenario);
    const replay = run(first.state);
    expect(replay.state).toMatchObject({
      threat: 12,
      jumpy_scream_this_call: false,
      jumpy_alert_this_call: false,
    });
    expect(replay.trace).toEqual(['procedure.jumpy']);
  });
  it('a consumed non-10 cannot be changed into a 10 on replay', () => {
    const first = run({ ...scenario, scenario_roll: 9 });
    expect(run({ ...first.state, scenario_roll: 10 }).state.threat).toBe(10);
  });
  it('a distinct actual Scenario roll gets a fresh marker and another legal +2', () => {
    const first = run(scenario);
    const second = run({ ...first.state, jumpy_scenario_processed: false });
    expect(second.state.threat).toBe(14);
    expect(second.trace).toEqual(['procedure.jumpy', 'character.condition.jumpy']);
  });
  const unavailable: State[] = [
    { sanity_system_enabled: false },
    { jumpy_diagnosis_matches: false },
    { jumpy_active: false },
    { scenario_roll_confirmed: false },
    { phase: 'acquisition' },
  ];
  it.each(unavailable)('rejects unavailable Scenario context %j', (change) => {
    const result = run({ ...scenario, ...change });
    expect(result.state.threat).toBe(10);
    expect(result.state.jumpy_scenario_processed).toBe(false);
    expect(result.trace).toEqual(['procedure.jumpy']);
  });
  it('a later diagnosis does not suppress this already active Jumpy condition', () => {
    const result = run({ ...scenario, acquired_condition_name: 'Acute Stress' });
    expect(result.state.threat).toBe(12);
    expect(result.state.jumpy_active).toBe(true);
  });
  it('a different pending acquisition episode does not suppress an earlier active condition', () => {
    expect(
      run({
        ...scenario,
        acquired_condition_name: 'Depression',
        condition_episode_processed: false,
      }).state.threat,
    ).toBe(12);
    expect(run({ ...noise, condition_episode_processed: false }).state.jumpy_scream_this_call).toBe(
      true,
    );
  });
  it('unresolved order/maximum/aggregation context preserves the printed +2 pending', () => {
    const unresolved = run({
      ...scenario,
      jumpy_threat_context_resolved: false,
      quest_maximum_threat: 11,
      other_jumpy_heroes: 1,
    });
    expect(unresolved.unresolved).toEqual(['issue.sanity.jumpy_threat_order']);
    expect(unresolved.state).toMatchObject({
      threat: 10,
      jumpy_scenario_processed: false,
      jumpy_scream_this_call: false,
    });
    expect(unresolved.events).toEqual([]);
    const resolved = run({ ...unresolved.state, jumpy_threat_context_resolved: true });
    expect(resolved.state.threat).toBe(12);
  });
  it('a non-10 result needs no guessed simultaneous +2 ordering', () => {
    const result = run({ ...scenario, scenario_roll: 9, jumpy_threat_context_resolved: false });
    expect(result.unresolved).toEqual([]);
    expect(result.state).toMatchObject({ threat: 10, jumpy_scenario_processed: true });
  });
  it('an actual unsuspecting noise reports the printed behavior without arbitrary numeric Threat', () => {
    const result = run(noise);
    expect(result.state).toMatchObject({
      threat: 10,
      jumpy_noise_processed: true,
      jumpy_scenario_processed: false,
      jumpy_scream_this_call: true,
      jumpy_startle_this_call: true,
      jumpy_alert_this_call: true,
      morale: 5,
      actions_remaining: 2,
    });
    expect(result.trace).toEqual(['procedure.jumpy']);
    expect(result.events).toEqual([]);
    expect(run(result.state).state.jumpy_scream_this_call).toBe(false);
    expect(run(result.state).state.threat).toBe(10);
  });
  it('another actual noise can report another scream without inventing +2', () => {
    const first = run(noise);
    expect(run({ ...first.state, jumpy_noise_processed: false }).state).toMatchObject({
      threat: 10,
      jumpy_scream_this_call: true,
    });
  });
  it('unconfirmed noise cannot scream or alert the dungeon', () => {
    expect(run({ ...noise, unsuspecting_noise_confirmed: false }).state).toMatchObject({
      jumpy_noise_processed: false,
      jumpy_scream_this_call: false,
      jumpy_alert_this_call: false,
    });
  });
  it('actual completed removal of this condition suppresses later noise and Scenario effects', () => {
    expect(run({ ...noise, jumpy_active: false }).state.jumpy_scream_this_call).toBe(false);
    expect(run({ ...scenario, jumpy_active: false }).state.threat).toBe(10);
  });
  it('ordinary Scenario handling is a separate Threat-roll handoff, not another Jumpy mutation', () => {
    const ordinary = run(
      { ...scenario, scenario_die_roll: 10, threat_trigger: 9 },
      'procedure.scenario_die',
    );
    expect(ordinary.events).toEqual([{ type: 'invoke', dependency: 'procedure.threat_roll' }]);
    expect(ordinary.state.threat).toBe(10);
    const own = run(ordinary.state);
    expect(own.state.threat).toBe(12);
    expect(own.events).toEqual([]);
    expect(own.trace).toEqual(['procedure.jumpy', 'character.condition.jumpy']);
    expect(own.state.threat_roll).toBeUndefined();
    expect(run(own.state).state.threat).toBe(12);
  });
  it('quest-specific ordinary Scenario threshold does not rewrite the Jumpy 10 trigger', () => {
    const ordinary = run(
      { ...scenario, scenario_roll: 8, scenario_die_roll: 8, threat_trigger: 8 },
      'procedure.scenario_die',
    );
    expect(ordinary.events).toEqual([{ type: 'invoke', dependency: 'procedure.threat_roll' }]);
    expect(run(ordinary.state).state.threat).toBe(10);
  });
  it('accepted Jumpy diagnosis initializes owned state but does not roll or add Threat', () => {
    const accepted = run(
      {
        ...scenario,
        phase: 'acquisition',
        sanity: 0,
        current_conditions: 1,
        sanity_condition_pending: true,
        condition_episode_processed: false,
        condition_draw_processed: false,
        condition_selected: false,
        die: 7,
        diagnosis_status_supplied: true,
        diagnosis_history_resolved: true,
        already_diagnosed: false,
        no_distinct_condition_left: false,
        condition_diagnosis_processed: false,
        condition_draw_rejected: false,
        condition_reroll_handoff_processed: false,
        condition_effect_handoff_processed: false,
        jumpy_active: false,
        jumpy_scenario_processed: true,
        jumpy_noise_processed: true,
      },
      'procedure.sanity_condition',
    );
    expect(accepted.events).toEqual([{ type: 'invoke', dependency: 'procedure.jumpy' }]);
    expect(accepted.state).toMatchObject({
      current_conditions: 2,
      sanity: 6,
      jumpy_active: true,
      jumpy_scenario_processed: false,
      jumpy_noise_processed: false,
      threat: 10,
    });
    expect(run(accepted.state).state.threat).toBe(10);
    const actual = run({ ...accepted.state, phase: 'scenario' });
    expect(actual.state).toMatchObject({
      current_conditions: 2,
      sanity: 6,
      maximum_sanity: 6,
      threat: 12,
    });
    expect(run(actual.state, 'procedure.sanity_condition').events).toEqual([]);
  });
});
