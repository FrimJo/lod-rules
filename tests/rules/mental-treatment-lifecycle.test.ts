import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State, id = 'procedure.mental_condition_treatment') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const hero: State = {
  phase: 'prepare',
  sanity_system_enabled: true,
  mental_treatment_owner_matches: true,
  mental_selection_scope_resolved: true,
  selected_disorder_supplied: true,
  selected_disorder: 'Depression',
  mental_treatment_selection_processed: false,
  mental_selection_request_processed: false,
  mental_accounting_request_processed: false,
  mental_result_request_processed: false,
  mental_treatment_roll_snapshot_processed: false,
  mental_treatment_result_processed: false,
  mental_treatment_trait_removal_processed: false,
  mental_treatment_succeeded: false,
  mental_treatment_removal_pending: false,
  mental_attempt_used: false,
  mental_conditions: 2,
  current_conditions: 2,
  mental_accounting_confirmed: true,
  service_completed: true,
  mental_treatment_days_completed: 5,
  treatment_roll_supplied: true,
  treatment_roll: 5,
  coins: 500,
  sanity: 6,
  maximum_sanity: 6,
  energy_pool: 3,
  hate_talent_owned: true,
  depression_active: true,
  jumpy_active: true,
  claustrophobia: true,
  diagnosed_before: true,
};
const service: State = {
  base_purchase_price: 100,
  quoted_purchase_price: 100,
  event_price_modifier: 0,
  event_price_delta: 0,
  combined_price_resolved: false,
  quest_departure_day: -1,
  quest_completed: true,
  reward_promised: true,
  at_quest_start_settlement: true,
  reward_collected: false,
  reward_value: 200,
  operation: 'purchase',
  visit_id: 0,
  item_lock_visit: -1,
  availability_roll: 3,
  item_availability: 3,
  item_locked_until_return: false,
  service_available: true,
  service_eligible: true,
  business_allowed: true,
  leaving_on_quest: false,
  activity_authorized: true,
  quote_supplied: true,
  item_present: true,
  treatment_succeeds: true,
  purchase_price: 100,
  sale_value: 50,
  repair_price: 10,
  event_sale_multiplier: 1,
  local_price_modifier: 0,
  coins: 500,
  inventory_count: 0,
  durability: 3,
  maximum_durability: 6,
  identified: false,
  diseased: true,
  poisoned: true,
  mental_attempt_used: false,
  mental_conditions: 2,
  treatment_roll: 5,
  day: 0,
  activity_completion_day: 0,
  last_treatment_day: -1,
};
const prepared = () => run(hero).state;
const complete = (change: State = {}) =>
  run({
    ...prepared(),
    phase: 'complete',
    mental_attempt_used: true,
    mental_conditions: 1,
    ...change,
  });
describe('Asylum selected disorder and completed accounting — PDF147/57', () => {
  it.each([1, 5, 6])(
    'composes actual service result %i without duplicate resource changes',
    (treatment_roll) => {
      const preparation = run({ ...hero, coins: 1500 });
      const accounting = run(
        {
          ...service,
          ...preparation.state,
          operation: 'treat_mental',
          coins: 1500,
          treatment_roll,
          day: 4,
          activity_completion_day: 4,
        },
        'procedure.settlement_buy_sell_and_service',
      );
      const result = run({
        ...accounting.state,
        phase: 'complete',
        mental_accounting_confirmed: true,
        mental_treatment_days_completed: 5,
      });
      expect([...preparation.trace, ...accounting.trace, ...result.trace]).toEqual([
        'procedure.mental_condition_treatment',
        'procedure.settlement_buy_sell_and_service',
        'procedure.mental_condition_treatment',
      ]);
      expect(result.state).toMatchObject({
        coins: 500,
        mental_attempt_used: true,
        mental_conditions: treatment_roll <= 5 ? 1 : 2,
        current_conditions: treatment_roll <= 5 ? 1 : 2,
        depression_active: treatment_roll === 6,
      });
      expect(run(result.state).state.coins).toBe(500);
      expect(
        run({ ...result.state, day: 5 }, 'procedure.settlement_buy_sell_and_service').state.coins,
      ).toBe(500);
    },
  );
  it('selection input resumption still requests the separately owned accounting stage', () => {
    const first = run({ ...hero, selected_disorder_supplied: false });
    const resumed = run({ ...first.state, selected_disorder_supplied: true });
    expect(resumed.events).toEqual([
      { type: 'invoke', dependency: 'procedure.settlement_buy_sell_and_service' },
    ]);
  });
  it('completed missing roll requests result input despite prior service handoff', () => {
    const first = complete({ treatment_roll_supplied: false });
    expect(first.events).toEqual([
      {
        type: 'invoke',
        dependency: 'Actual owned selected disorder and same-attempt completed treatment result',
      },
    ]);
    expect(run(first.state).events).toEqual([]);
    expect(run({ ...first.state, treatment_roll_supplied: true }).state.depression_active).toBe(
      false,
    );
  });
  it('pending count reconciliation cannot replace the actual captured failure roll', () => {
    const first = complete({ treatment_roll: 6, mental_conditions: 1 });
    expect(first.state.mental_treatment_roll).toBe(6);
    const reconciled = run({ ...first.state, treatment_roll: 1, mental_conditions: 2 });
    expect(reconciled.state).toMatchObject({
      mental_treatment_result_processed: true,
      mental_treatment_succeeded: false,
      depression_active: true,
    });
  });
  it('snapshots target/count and requests accounting without performing it', () => {
    const r = run(hero);
    expect(r.state).toMatchObject({
      mental_treatment_disorder: 'Depression',
      mental_conditions_before_treatment: 2,
      coins: 500,
      current_conditions: 2,
      depression_active: true,
      mental_attempt_used: false,
    });
    expect(r.trace).toEqual(['procedure.mental_condition_treatment']);
    expect(r.events).toEqual([
      { type: 'invoke', dependency: 'procedure.settlement_buy_sell_and_service' },
    ]);
    expect(run({ ...r.state, selected_disorder: 'Jumpy' }).state.mental_treatment_disorder).toBe(
      'Depression',
    );
    expect(run(r.state).events).toEqual([]);
  });
  it.each([1, 2, 3, 4, 5])(
    'actual completed roll %i cures one snapshotted disorder without another charge/count subtraction',
    (treatment_roll) => {
      const r = complete({ treatment_roll });
      expect(r.state).toMatchObject({
        mental_treatment_succeeded: true,
        mental_treatment_result_processed: true,
        mental_treatment_trait_removal_processed: true,
        depression_active: false,
        current_conditions: 1,
        mental_conditions: 1,
        coins: 500,
        mental_attempt_used: true,
        jumpy_active: true,
        claustrophobia: true,
        sanity: 6,
        maximum_sanity: 6,
        energy_pool: 3,
        hate_talent_owned: true,
        diagnosed_before: true,
        mental_treatment_removal_pending: true,
      });
      expect(r.trace).toEqual(['procedure.mental_condition_treatment']);
      expect(r.events).toHaveLength(1);
      expect(
        run({ ...r.state, selected_disorder: 'Jumpy', treatment_roll: 6 }).state.jumpy_active,
      ).toBe(true);
      expect(run(r.state).events).toEqual([]);
    },
  );
  it('actual completed failure consumes result and opportunity without curing/refunding', () => {
    const r = complete({ treatment_roll: 6, mental_conditions: 2 });
    expect(r.state).toMatchObject({
      mental_treatment_result_processed: true,
      mental_treatment_succeeded: false,
      depression_active: true,
      current_conditions: 2,
      coins: 500,
      mental_attempt_used: true,
    });
    expect(r.events).toEqual([]);
    expect(
      run({ ...r.state, treatment_roll: 1, mental_conditions: 1 }).state.depression_active,
    ).toBe(true);
  });
  it.each([0, 1, 2, 3, 4])(
    'only %i completed service days cannot resolve a treatment',
    (mental_treatment_days_completed) => {
      const r = complete({ mental_treatment_days_completed });
      expect(r.state.mental_treatment_result_processed).toBe(false);
      expect(r.state.depression_active).toBe(true);
    },
  );
  it.each([
    { mental_accounting_confirmed: false },
    { service_completed: false },
    { mental_attempt_used: false },
    { treatment_roll_supplied: false },
    { mental_treatment_owner_matches: false },
    { sanity_system_enabled: false },
  ] as State[])('missing/unowned/incomplete actual result cannot cure %s', (change) => {
    const r = complete(change);
    expect(r.state).toMatchObject({
      mental_treatment_result_processed: false,
      depression_active: true,
      current_conditions: 2,
      coins: 500,
    });
  });
  it.each([
    { mental_conditions: 2 },
    { mental_conditions: 0 },
    { current_conditions: 7 },
    { treatment_roll: 6, mental_conditions: 1 },
  ] as State[])('inconsistent accounting/counts remain unresolved %s', (change) => {
    const r = complete(change);
    expect(r.state.mental_treatment_result_processed).toBe(false);
    expect(r.state.depression_active).toBe(true);
    expect(r.unresolved).toContain('issue.sanity.mental_treatment_ownership');
  });
  it('already synchronized active count is not decremented again', () => {
    expect(complete({ current_conditions: 1 }).state.current_conditions).toBe(1);
  });
  it.each([
    { selected_disorder_supplied: false },
    { mental_selection_scope_resolved: false },
  ] as State[])('unknown selection/curability requests actual input once %s', (change) => {
    const first = run({ ...hero, ...change });
    expect(first.state.mental_treatment_selection_processed).toBe(false);
    expect(first.events).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
    expect(
      run({
        ...first.state,
        selected_disorder_supplied: true,
        mental_selection_scope_resolved: true,
      }).state.mental_treatment_disorder,
    ).toBe('Depression');
  });
  it('out-of-list disorder is not silently substituted', () => {
    const r = run({ ...hero, selected_disorder: 'Disease' });
    expect(r.state.mental_treatment_selection_processed).toBe(false);
    expect(r.unresolved).toContain('issue.sanity.mental_treatment_ownership');
  });
  it('used between-quest opportunity blocks another preparation even after a new day/visit', () => {
    expect(
      run({ ...hero, mental_attempt_used: true, day: 99, visit_id: 6 }).state
        .mental_treatment_selection_processed,
    ).toBe(false);
  });
  it.each([
    ['Hate', 'hate'],
    ['Acute Stress', 'acute_stress_active'],
    ['Lingering Trauma', 'trauma_diagnosed'],
    ['Fear of the Dark', 'fear_of_the_dark'],
    ['Arachnophobia', 'arachnophobia'],
    ['Jumpy', 'jumpy_active'],
    ['Irrational Fear', 'irrational_fear'],
    ['Claustrophobia', 'claustrophobia'],
    ['Depression', 'depression_active'],
  ] as const)('actual cure of %s removes its owned flag %s', (selected_disorder, flag) => {
    const initial = run({ ...hero, selected_disorder, [flag]: true }).state;
    const r = run({
      ...initial,
      phase: 'complete',
      mental_attempt_used: true,
      mental_conditions: 1,
    });
    expect(r.state[flag]).toBe(false);
    expect(r.state.hate_talent_owned).toBe(true);
    expect(r.state.sanity).toBe(6);
  });
});
