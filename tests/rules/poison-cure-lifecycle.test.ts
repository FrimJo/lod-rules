import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const ruleFixture = corpus.testCases.find((entry) => entry.rule_ids && !entry.procedure_id)!;
const id = 'procedure.poison_cure';
const run = (inputs: State, procedureId = id) =>
  runCase({ ...fixture, procedure_id: procedureId, inputs }, corpus);
const potion: State = {
  cure_route: 'potion',
  dead: false,
  already_poisoned: true,
  poisoned: true,
  remaining_poison_rolls: 3,
  poison_rolls_due: 3,
  poison_cure_handoff_processed: false,
  poison_cure_result_processed: false,
  potion_available: true,
  potion_consumed: false,
  potion_resolution_completed: false,
  poison_effects_removed: false,
  hit_points: -2,
  can_act: false,
  cure_potion_count: 1,
  actions_remaining: 2,
  coins: 120,
};
const chapel: State = {
  ...potion,
  cure_route: 'chapel',
  back_in_city: true,
  chapel_access_confirmed: true,
  chapel_visit_completed: false,
};

describe('Printed external poison cures — rendered PDF122 / 80', () => {
  it('potion request alone neither consumes nor cures and is recorded once', () => {
    const first = run(potion);
    expect(first.state).toMatchObject({
      already_poisoned: true,
      remaining_poison_rolls: 3,
      cure_potion_count: 1,
      actions_remaining: 2,
    });
    expect(first.events).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
  });
  it('accepts a completed successful potion outcome without charging resources or waking negative HP', () => {
    const result = run({
      ...run(potion).state,
      potion_consumed: true,
      potion_resolution_completed: true,
      poison_effects_removed: true,
      cure_potion_count: 0,
      actions_remaining: 1,
    });
    expect(result.state).toMatchObject({
      cured: true,
      poisoned: false,
      already_poisoned: false,
      remaining_poison_rolls: 0,
      poison_rolls_due: 0,
      hit_points: -2,
      can_act: false,
      cure_potion_count: 0,
      actions_remaining: 1,
      coins: 120,
      poison_cure_result_processed: true,
    });
    expect(result.trace).toEqual([id]);
    expect(run(result.state).steps).not.toContain('clear_poison');
  });
  it('consumption without completed effect resolution cannot create a cure', () => {
    const result = run({ ...potion, potion_consumed: true, poison_effects_removed: true });
    expect(result.state.already_poisoned).toBe(true);
    expect(result.state.poison_cure_result_processed).toBe(false);
  });
  it.each([75, 76])('composes the existing weak-potion rule at percentile %i', (roll) => {
    const effect = runCase(
      {
        ...ruleFixture,
        rule_ids: ['character.equipment.alchemy.potion_of_cure_poison_weak.cure'],
        inputs: { percentile_roll: roll, poison_effects_removed: false },
      },
      corpus,
    );
    const result = run({
      ...potion,
      ...effect.state,
      potion_consumed: true,
      potion_resolution_completed: true,
      cure_potion_count: 0,
    });
    expect(result.state.already_poisoned).toBe(roll > 75);
    expect(result.state.poison_cure_result_processed).toBe(true);
    expect(result.state.cure_potion_count).toBe(0);
  });
  it('cannot replace a failed consumed weak-potion result with a different outcome on replay', () => {
    const first = run({ ...potion, potion_consumed: true, potion_resolution_completed: true });
    expect(run({ ...first.state, poison_effects_removed: true }).state.already_poisoned).toBe(true);
    expect(first.state.remaining_poison_rolls).toBe(3);
  });
  it('a distinct later consumed potion can cure after the failed attempt', () => {
    const first = run({ ...potion, potion_consumed: true, potion_resolution_completed: true });
    const later = run({
      ...first.state,
      poison_cure_result_processed: false,
      poison_cure_handoff_processed: false,
      poison_effects_removed: true,
    });
    expect(later.state.already_poisoned).toBe(false);
  });
  it('composes the existing standard potion effect with condition cancellation', () => {
    const effect = runCase(
      {
        ...ruleFixture,
        rule_ids: ['character.equipment.alchemy.potion_of_cure_poison.cure'],
        inputs: {},
      },
      corpus,
    );
    expect(
      run({ ...potion, ...effect.state, potion_consumed: true, potion_resolution_completed: true })
        .state.remaining_poison_rolls,
    ).toBe(0);
  });
  it('preserves the Supreme bonus-healing instruction while applying known poison removal', () => {
    const effects = runCase(
      {
        ...ruleFixture,
        rule_ids: [
          'character.equipment.alchemy.potion_of_cure_poison.cure',
          'character.alchemy.quality_effect.potion_of_cure_poison.supreme',
        ],
        inputs: { quality: 'supreme' },
      },
      corpus,
    );
    const result = run({
      ...potion,
      ...effects.state,
      potion_consumed: true,
      potion_resolution_completed: true,
    });
    expect(result.state).toMatchObject({
      already_poisoned: false,
      bonus_healing_dice: '1d3',
      hit_points: -2,
    });
  });
  it('already resolved Supreme healing is preserved without another HP addition', () => {
    const result = run({
      ...potion,
      potion_consumed: true,
      potion_resolution_completed: true,
      poison_effects_removed: true,
      hit_points: 1,
    });
    expect(result.state.hit_points).toBe(1);
    expect(run(result.state).state.hit_points).toBe(1);
  });
  it('Chapel request records the printed visit without charging a guessed settlement price', () => {
    const first = run(chapel);
    expect(first.events).toHaveLength(1);
    expect(first.state).toMatchObject({
      coins: 120,
      already_poisoned: true,
      remaining_poison_rolls: 3,
    });
    expect(run(first.state).events).toEqual([]);
  });
  it('a completed printed Chapel visit clears poison and retains unrelated resource/HP state', () => {
    const result = run({ ...chapel, chapel_visit_completed: true });
    expect(result.state).toMatchObject({
      cured: true,
      already_poisoned: false,
      poisoned: false,
      remaining_poison_rolls: 0,
      coins: 120,
      actions_remaining: 2,
      hit_points: -2,
      can_act: false,
    });
    expect(result.events).toEqual([]);
  });
  const rejected: State[] = [{ dead: true }, { already_poisoned: false }, { cure_route: 'temple' }];
  it.each(rejected)('rejects ineligible or unbound cure %j', (override) => {
    const result = run({
      ...potion,
      potion_consumed: true,
      potion_resolution_completed: true,
      poison_effects_removed: true,
      ...override,
    });
    expect(result.steps).not.toContain('clear_poison');
    expect(result.events).toEqual([]);
  });
  it.each(['back_in_city', 'chapel_access_confirmed'])(
    'rejects an unsupported Chapel visit when %s is false',
    (field) => {
      expect(
        run({ ...chapel, chapel_visit_completed: true, [field]: false }).state.already_poisoned,
      ).toBe(true);
    },
  );
  it('retains the Chapel/Temple/Sick Ward boundary without a fabricated Chapel ID', () => {
    const procedure = corpus.procedures.find((entry) => entry.id === id)!;
    expect(procedure.issues).toContain('issue.poison.chapel_treatment_route');
    expect(
      procedure.dependencies.find((entry) => entry.key === 'chapel')?.object_id,
    ).toBeUndefined();
    expect(procedure.unresolved_references).toHaveLength(1);
  });
  const serviceContext: State = {
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
  const treatment: State = {
    ...serviceContext,
    operation: 'cure_poison',
    service_available: true,
    service_eligible: true,
    business_allowed: true,
    leaving_on_quest: false,
    activity_authorized: true,
    coins: 500,
    day: 1,
    activity_completion_day: 1,
    last_treatment_day: -1,
    quest_departure_day: -1,
    treatment_succeeds: true,
    poisoned: true,
    already_poisoned: true,
    remaining_poison_rolls: 3,
    poison_rolls_due: 3,
    hit_points: -2,
    diseased: true,
  };
  it('existing successful treatment charges once and cancels subsequent poison damage', () => {
    const result = run(treatment, 'procedure.settlement_buy_sell_and_service');
    expect(result.state).toMatchObject({
      coins: 400,
      poisoned: false,
      already_poisoned: false,
      remaining_poison_rolls: 0,
      poison_rolls_due: 0,
      cured: true,
      hit_points: -2,
      diseased: true,
    });
    expect(run(result.state, 'procedure.settlement_buy_sell_and_service').state.coins).toBe(400);
    const later = run(
      {
        ...result.state,
        damage_type: 'poison',
        phase: 'ongoing',
        rest_occurs: false,
        poison_check_processed: false,
      },
      'procedure.damage_follow_up',
    );
    expect(later.state.hit_points).toBe(-2);
    expect(later.steps).not.toContain('poison_loss');
  });
  it('a supplied failed treatment surfaces the undefined outcome without charging or clearing poison', () => {
    const result = run(
      { ...treatment, treatment_succeeds: false },
      'procedure.settlement_buy_sell_and_service',
    );
    expect(result.unresolved).toContain('issue.settlement.illness_treatment_limits');
    expect(result.state).toMatchObject({
      coins: 500,
      poisoned: true,
      already_poisoned: true,
      remaining_poison_rolls: 3,
    });
  });
  it('ineligible treatment cannot charge or clear current poison', () => {
    const result = run(
      { ...treatment, activity_authorized: false },
      'procedure.settlement_buy_sell_and_service',
    );
    expect(result.state).toMatchObject({
      coins: 500,
      already_poisoned: true,
      remaining_poison_rolls: 3,
    });
  });
  it('damage follow-up external-cure handoff does not itself clear the condition', () => {
    const result = run(
      {
        phase: 'external_cure',
        damage_type: 'poison',
        already_poisoned: true,
        dead: false,
        remaining_poison_rolls: 3,
      },
      'procedure.damage_follow_up',
    );
    expect(result.events).toEqual([{ type: 'invoke', dependency: id }]);
    expect(result.state.remaining_poison_rolls).toBe(3);
  });
});
