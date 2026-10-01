import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const ruleFixture = corpus.testCases.find((entry) => entry.rule_ids && !entry.procedure_id)!;
const run = (inputs: State, id = 'procedure.depression') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const onset: State = {
  phase: 'acquisition',
  sanity_system_enabled: true,
  depression_diagnosis_matches: true,
  depression_active: true,
  depression_reduction_pending: true,
  depression_effect_processed: false,
  depression_pool_supplied: true,
  depression_capacity_context_resolved: true,
  depression_pool_snapshot_processed: false,
  depression_capacity_handoff_processed: false,
  energy_pool: 5,
  energy_supplied: true,
  energy: 1,
  current_conditions: 2,
  sanity: 6,
  maximum_sanity: 6,
  trauma_diagnosed: true,
  trauma_resolve_modifier: -10,
};
describe('Depression onset capacity — rendered PDF57 / PDF26', () => {
  it.each([2, 3, 5, 9])('actual capacity %i loses exactly two once', (energy_pool) => {
    const result = run({ ...onset, energy_pool, energy: 0 });
    expect(result.state).toMatchObject({
      energy_pool: energy_pool - 2,
      depression_pool_at_onset: energy_pool,
      depression_pool_snapshot_processed: true,
      depression_effect_processed: true,
      depression_reduction_pending: false,
      depression_reduction_this_call: true,
      energy: 0,
    });
    expect(result.trace).toEqual(['procedure.depression', 'character.condition.depression']);
    expect(result.unresolved).toEqual([]);
    expect(result.events).toEqual([]);
    const replay = run(result.state);
    expect(replay.state.energy_pool).toBe(energy_pool - 2);
    expect(replay.state.depression_reduction_this_call).toBe(false);
    expect(replay.trace).toEqual(['procedure.depression']);
  });
  it('preserves current available Energy, other condition contributions and Sanity/count', () => {
    expect(run(onset).state).toMatchObject({
      energy_pool: 3,
      energy: 1,
      trauma_diagnosed: true,
      trauma_resolve_modifier: -10,
      current_conditions: 2,
      sanity: 6,
      maximum_sanity: 6,
    });
  });
  it('capacity growth after application does not reapply the diagnosis', () => {
    const applied = run(onset);
    expect(run({ ...applied.state, energy_pool: 4 }).state.energy_pool).toBe(4);
  });
  it('current Energy spending/rest is not a fresh capacity reduction', () => {
    const applied = run(onset);
    expect(run({ ...applied.state, energy: 0, phase: 'rest' }).state.energy_pool).toBe(3);
    expect(run({ ...applied.state, energy: 3 }).state.energy_pool).toBe(3);
  });
  it.each([-1, 0, 1])(
    'onset capacity %i preserves the original undefined floor without clamp',
    (energy_pool) => {
      const result = run({ ...onset, energy_pool });
      expect(result.unresolved).toEqual(['issue.phase4.energy_floor']);
      expect(result.state).toMatchObject({
        energy_pool,
        energy: 1,
        depression_pool_at_onset: energy_pool,
        depression_pool_snapshot_processed: true,
        depression_effect_processed: false,
        depression_reduction_pending: true,
      });
      expect(result.trace).toEqual(['procedure.depression']);
    },
  );
  it('later growth cannot turn an unresolved one-point onset into an automatic legal reduction', () => {
    const floor = run({ ...onset, energy_pool: 1 });
    const grown = run({ ...floor.state, energy_pool: 4 });
    expect(grown.unresolved).toEqual([
      'issue.sanity.depression_capacity_context',
      'issue.phase4.energy_floor',
    ]);
    expect(grown.state).toMatchObject({
      energy_pool: 4,
      depression_pool_at_onset: 1,
      depression_effect_processed: false,
      depression_reduction_pending: true,
    });
  });
  it('unknown onset capacity requests actual input once without starting-Energy initialization', () => {
    const { energy_pool: omitted, ...unknown } = onset;
    expect(omitted).toBe(5);
    const requested = run({ ...unknown, depression_pool_supplied: false });
    expect(requested.events).toHaveLength(1);
    expect(requested.events[0]).toMatchObject({
      type: 'invoke',
      dependency:
        'Actual owned unmodified Energy capacity at diagnosis onset; not a new starting-Energy initialization',
    });
    expect(requested.state.energy_pool).toBeUndefined();
    expect(requested.state).toMatchObject({
      energy: 1,
      depression_effect_processed: false,
      depression_pool_snapshot_processed: false,
    });
    expect(run(requested.state).events).toEqual([]);
    expect(
      run({ ...requested.state, depression_pool_supplied: true, energy_pool: 5 }).state.energy_pool,
    ).toBe(3);
  });
  it('an already-applied or otherwise unresolved capacity cannot be subtracted again', () => {
    const result = run({ ...onset, depression_capacity_context_resolved: false });
    expect(result.unresolved).toEqual(['issue.sanity.depression_capacity_context']);
    expect(result.state.energy_pool).toBe(5);
    expect(result.state.depression_pool_snapshot_processed).toBe(false);
  });
  it('a captured positive onset cannot be silently rebased onto another changed capacity', () => {
    const result = run({
      ...onset,
      depression_pool_snapshot_processed: true,
      depression_pool_at_onset: 5,
      energy_pool: 6,
    });
    expect(result.unresolved).toEqual(['issue.sanity.depression_capacity_context']);
    expect(result.state).toMatchObject({
      energy_pool: 6,
      depression_pool_at_onset: 5,
      depression_effect_processed: false,
    });
  });
  it('a source-reconciled original positive capacity can complete a still-pending reduction', () => {
    const result = run({
      ...onset,
      depression_pool_snapshot_processed: true,
      depression_pool_at_onset: 5,
    });
    expect(result.state.energy_pool).toBe(3);
  });
  const unavailable: State[] = [
    { sanity_system_enabled: false },
    { depression_diagnosis_matches: false },
    { depression_active: false },
    { depression_reduction_pending: false },
    { depression_effect_processed: true },
    { phase: 'rest' },
  ];
  it.each(unavailable)('rejects unavailable onset context %j', (change) => {
    const result = run({ ...onset, ...change });
    expect(result.state.energy_pool).toBe(5);
    expect(result.trace).toEqual(['procedure.depression']);
  });
  it('another acquired condition or pending diagnosis does not replace this owned onset', () => {
    expect(
      run({ ...onset, acquired_condition_name: 'Jumpy', condition_episode_processed: false }).state
        .energy_pool,
    ).toBe(3);
  });
  it('available Energy above the reduced pool remains unchanged and records the reconciliation gap', () => {
    const result = run({ ...onset, energy: 5 });
    expect(result.unresolved).toEqual(['issue.sanity.depression_capacity_context']);
    expect(result.state).toMatchObject({
      energy_pool: 3,
      energy: 5,
      depression_effect_processed: true,
      depression_reduction_pending: false,
    });
    const replay = run(result.state);
    expect(replay.state.energy_pool).toBe(3);
    expect(replay.state.energy).toBe(5);
    expect(replay.unresolved).toEqual([]);
  });
  it('known capacity reduction does not invent an unknown current-Energy value', () => {
    const { energy: omitted, ...unknown } = onset;
    expect(omitted).toBe(1);
    const result = run({ ...unknown, energy_supplied: false });
    expect(result.state.energy_pool).toBe(3);
    expect(result.state.energy).toBeUndefined();
  });
  it('separately completed treatment does not trigger blind capacity restoration or a new subtraction', () => {
    const applied = run(onset);
    const cured = run({ ...applied.state, depression_active: false, energy_pool: 4, energy: 2 });
    expect(cured.state).toMatchObject({
      energy_pool: 4,
      energy: 2,
      current_conditions: 2,
      sanity: 6,
    });
  });
  it('ordinary return recovery uses the actual modified capacity without undoing Depression', () => {
    const applied = run(onset);
    const recovered = runCase(
      {
        ...ruleFixture,
        rule_ids: ['character.energy.quest_return'],
        inputs: { ...applied.state, returned_from_quest: true, energy_maximum: 3 },
      },
      corpus,
    );
    expect(recovered.state).toMatchObject({ energy: 3, energy_pool: 3 });
    expect(recovered.trace).toEqual(['character.energy.quest_return']);
    expect(run(recovered.state).state.energy_pool).toBe(3);
  });
  it('actual accepted Depression initializes owned markers and hands off without reducing capacity', () => {
    const accepted = run(
      {
        ...onset,
        sanity: 0,
        current_conditions: 1,
        sanity_condition_pending: true,
        condition_episode_processed: false,
        condition_draw_processed: false,
        condition_selected: false,
        die: 10,
        diagnosis_status_supplied: true,
        diagnosis_history_resolved: true,
        already_diagnosed: false,
        no_distinct_condition_left: false,
        condition_diagnosis_processed: false,
        condition_draw_rejected: false,
        condition_reroll_handoff_processed: false,
        condition_effect_handoff_processed: false,
        depression_active: false,
        depression_reduction_pending: false,
        depression_effect_processed: true,
        depression_pool_snapshot_processed: true,
        depression_capacity_handoff_processed: true,
      },
      'procedure.sanity_condition',
    );
    expect(accepted.events).toEqual([{ type: 'invoke', dependency: 'procedure.depression' }]);
    expect(accepted.state).toMatchObject({
      energy_pool: 5,
      energy: 1,
      current_conditions: 2,
      sanity: 6,
      depression_active: true,
      depression_reduction_pending: true,
      depression_effect_processed: false,
      depression_pool_snapshot_processed: false,
      depression_capacity_handoff_processed: false,
    });
    const applied = run(accepted.state);
    expect(applied.trace).toEqual(['procedure.depression', 'character.condition.depression']);
    expect(applied.state).toMatchObject({
      energy_pool: 3,
      energy: 1,
      current_conditions: 2,
      sanity: 6,
    });
    expect(run(applied.state, 'procedure.sanity_condition').events).toEqual([]);
  });
});
