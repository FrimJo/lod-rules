import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const run = (inputs: State, id = 'procedure.acute_stress') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const diagnosis: State = {
  phase: 'acquisition',
  sanity_system_enabled: true,
  acquired_condition_name: 'Acute Stress',
  condition_episode_processed: true,
  acute_stress_quest_matches: true,
  acute_stress_effect_processed: false,
  acute_stress_active: false,
  acute_stress_expired: false,
  resolve_modifier: 0,
  extra_threat_per_battle: 0,
  screams_during_battles: false,
  battle_started: false,
  acute_stress_battle_processed: false,
  threat: 10,
  quest_end_reached: false,
  quest_endpoint_resolved: true,
  resolve: 47,
  trauma_resolve_modifier: -10,
  fear_of_dark_modifier: -10,
  current_conditions: 2,
  sanity: 6,
  maximum_sanity: 6,
};
const battle = (state: State = run(diagnosis).state): State => ({
  ...state,
  phase: 'battle',
  battle_started: true,
  acute_stress_battle_processed: false,
});
const end = (state: State = run(diagnosis).state): State => ({
  ...state,
  phase: 'quest_end',
  quest_end_reached: true,
});
describe('Acute Stress current-quest lifecycle — rendered PDF57 row 2–3', () => {
  it('initializes this diagnosis contribution once with its applied source rule trace', () => {
    const result = run(diagnosis);
    expect(result.state).toMatchObject({
      acute_stress_effect_processed: true,
      acute_stress_active: true,
      resolve_modifier: -10,
      extra_threat_per_battle: 1,
      screams_during_battles: true,
      threat: 10,
      resolve: 47,
      trauma_resolve_modifier: -10,
      current_conditions: 2,
      sanity: 6,
    });
    expect(result.trace).toEqual(['procedure.acute_stress', 'character.condition.acute_stress']);
    expect(result.events).toEqual([]);
    expect(run(result.state).trace).toEqual(['procedure.acute_stress']);
  });
  it('another diagnosis or pending episode does not disable the already initialized quest effect', () => {
    const owned = {
      ...run(diagnosis).state,
      acquired_condition_name: 'Jumpy',
      condition_episode_processed: false,
    };
    const fought = run(battle(owned));
    expect(fought.state.threat).toBe(11);
    expect(run(end(fought.state)).state.acute_stress_active).toBe(false);
  });
  it('first actual later battle adds one Threat without applying the RES contribution again', () => {
    const result = run(battle());
    expect(result.state).toMatchObject({
      threat: 11,
      acute_stress_battle_processed: true,
      resolve_modifier: -10,
    });
    expect(result.trace).toEqual(['procedure.acute_stress']);
  });
  it('same battle replay, turns and hits cannot add another Threat', () => {
    const first = run(battle());
    expect(run(first.state).state.threat).toBe(11);
    expect(run({ ...first.state, turn_number: 2, enemy_hit: true }).state.threat).toBe(11);
  });
  it('a distinct later battle can add a new contribution', () => {
    const first = run(battle());
    expect(run(battle(first.state)).state.threat).toBe(12);
  });
  it('an unstarted battle or acquisition request adds no Threat', () => {
    expect(run({ ...battle(), battle_started: false }).state.threat).toBe(10);
    expect(run({ ...battle(), phase: 'acquisition' }).state.threat).toBe(10);
  });
  const rejected: State[] = [
    { sanity_system_enabled: false },
    { acquired_condition_name: 'Depression' },
    { condition_episode_processed: false },
    { acute_stress_quest_matches: false },
    { acute_stress_expired: true },
    { quest_end_reached: true },
  ];
  it.each(rejected)('does not initialize unavailable diagnosis context %j', (change) => {
    const result = run({ ...diagnosis, ...change });
    expect(result.state.resolve_modifier).toBe(0);
    expect(result.state.threat).toBe(10);
    expect(result.trace).toEqual(['procedure.acute_stress']);
  });
  const battleRejected: State[] = [
    { sanity_system_enabled: false },
    { acute_stress_quest_matches: false },
    { acute_stress_active: false },
    { acute_stress_effect_processed: false },
    { acute_stress_expired: true },
    { quest_end_reached: true },
  ];
  it.each(battleRejected)('rejects unavailable battle context %j', (change) => {
    expect(run({ ...battle(), ...change }).state.threat).toBe(10);
  });
  it('resolved current quest end clears only this owned effect', () => {
    const result = run(end());
    expect(result.state).toMatchObject({
      acute_stress_active: false,
      acute_stress_expired: true,
      acute_stress_effect_processed: true,
      resolve_modifier: 0,
      extra_threat_per_battle: 0,
      screams_during_battles: false,
      resolve: 47,
      trauma_resolve_modifier: -10,
      fear_of_dark_modifier: -10,
      threat: 10,
      current_conditions: 2,
      sanity: 6,
      maximum_sanity: 6,
    });
    expect(run(result.state).state).toEqual(result.state);
  });
  it('expired diagnosis cannot reactivate or affect a later battle/quest', () => {
    const expired = run(end()).state;
    expect(
      run({ ...expired, phase: 'acquisition', quest_end_reached: false }).state.acute_stress_active,
    ).toBe(false);
    expect(run({ ...battle(expired), quest_end_reached: false }).state.threat).toBe(10);
    expect(run({ ...battle(), acute_stress_quest_matches: false }).state.threat).toBe(10);
  });
  it('an unresolved quest endpoint preserves effects and emits the existing conflict', () => {
    const result = run({ ...end(), quest_endpoint_resolved: false });
    expect(result.unresolved).toEqual(['issue.0004']);
    expect(result.state).toMatchObject({
      acute_stress_active: true,
      acute_stress_expired: false,
      resolve_modifier: -10,
    });
    expect(run({ ...result.state, phase: 'battle', battle_started: true }).state.threat).toBe(10);
    const actual = run({ ...result.state, quest_endpoint_resolved: true });
    expect(actual.state.acute_stress_active).toBe(false);
  });
  it('objective completion, dungeon exit and a return request do not substitute for quest end', () => {
    const result = run({
      ...end(),
      quest_end_reached: false,
      objective_complete: true,
      dungeon_exit: true,
      return_requested: true,
    });
    expect(result.state.acute_stress_active).toBe(true);
    expect(result.state.resolve_modifier).toBe(-10);
  });
  it('composes accepted diagnosis, one battle and expiry without repeating count/reset', () => {
    const acquired = run(
      {
        ...diagnosis,
        sanity: 0,
        current_conditions: 1,
        sanity_condition_pending: true,
        condition_episode_processed: false,
        condition_draw_processed: false,
        condition_selected: false,
        die: 2,
        diagnosis_status_supplied: true,
        diagnosis_history_resolved: true,
        already_diagnosed: false,
        no_distinct_condition_left: false,
        condition_diagnosis_processed: false,
        condition_draw_rejected: false,
        condition_reroll_handoff_processed: false,
        condition_effect_handoff_processed: false,
        acute_stress_effect_processed: true,
        acute_stress_active: true,
        acute_stress_expired: true,
        acute_stress_battle_processed: true,
      },
      'procedure.sanity_condition',
    );
    expect(acquired.events).toEqual([{ type: 'invoke', dependency: 'procedure.acute_stress' }]);
    expect(acquired.state).toMatchObject({
      current_conditions: 2,
      sanity: 6,
      acute_stress_effect_processed: false,
      acute_stress_active: false,
      acute_stress_expired: false,
      acute_stress_battle_processed: false,
    });
    const applied = run(acquired.state);
    expect(applied.trace).toEqual(['procedure.acute_stress', 'character.condition.acute_stress']);
    const fought = run(battle(applied.state));
    const expired = run(end(fought.state));
    expect(expired.state).toMatchObject({
      current_conditions: 2,
      sanity: 6,
      maximum_sanity: 6,
      threat: 11,
      acute_stress_active: false,
    });
    expect(run(expired.state, 'procedure.sanity_condition').events).toEqual([]);
  });
  it('a distinct hero supplies a separate owned effect/battle marker and preserves the first hero', () => {
    const first = run(battle());
    const threat = first.state.threat;
    if (typeof threat !== 'number') throw new Error('Expected numeric party Threat');
    const second = run({ ...battle(), threat, resolve: 38 });
    expect(second.state.threat).toBe(12);
    expect(second.state.resolve).toBe(38);
    expect(first.state.threat).toBe(11);
    expect(first.state.resolve).toBe(47);
  });
});
