import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const ruleFixture = corpus.testCases.find((entry) => entry.rule_ids && !entry.procedure_id)!;
const run = (inputs: State, procedureId = 'procedure.disease_cure') =>
  runCase({ ...fixture, procedure_id: procedureId, inputs }, corpus);
const potion: State = {
  cure_route: 'potion',
  dead: false,
  diseased: true,
  disease_penalty_active: true,
  disease_cure_handoff_processed: false,
  disease_cure_result_processed: false,
  potion_available: true,
  potion_consumed: false,
  potion_resolution_completed: false,
  disease_effects_removed: false,
  constitution: 29,
  strength: 39,
  constitution_after: 18,
  strength_after: 21,
  hit_points: -2,
  can_act: false,
  poisoned: true,
  cure_potion_count: 1,
  actions_remaining: 2,
  coins: 120,
};
const ward: State = {
  ...potion,
  cure_route: 'sick_ward',
  sick_ward_access_confirmed: true,
  treatment_resolution_completed: false,
  treatment_succeeds: true,
};
describe('Explicit disease cures — rendered PDF121 / 80 / 144', () => {
  it('request is a once-only handoff, without consumption or cure', () => {
    const first = run(potion);
    expect(first.events).toHaveLength(1);
    expect(first.state).toMatchObject({
      diseased: true,
      cure_potion_count: 1,
      actions_remaining: 2,
    });
    expect(run(first.state).events).toEqual([]);
  });
  it.each([75, 76])('composes Weak potion at percentile %i', (roll) => {
    const effects = runCase(
      {
        ...ruleFixture,
        rule_ids: ['character.equipment.alchemy.potion_of_cure_disease_weak.cure'],
        inputs: { percentile_roll: roll, disease_effects_removed: false },
      },
      corpus,
    );
    const result = run({
      ...potion,
      ...effects.state,
      potion_consumed: true,
      potion_resolution_completed: true,
      cure_potion_count: 0,
    });
    expect(result.state.diseased).toBe(roll > 75);
    expect(result.state.disease_penalty_active).toBe(roll > 75);
    expect(result.state.disease_cure_result_processed).toBe(true);
    expect(result.state.cure_potion_count).toBe(0);
  });
  it('failed consumed result cannot be replaced on replay', () => {
    const first = run({ ...potion, potion_consumed: true, potion_resolution_completed: true });
    expect(run({ ...first.state, disease_effects_removed: true }).state.diseased).toBe(true);
  });
  it('a distinct later attempt can cure', () => {
    const first = run({ ...potion, potion_consumed: true, potion_resolution_completed: true });
    expect(
      run({
        ...first.state,
        disease_cure_result_processed: false,
        disease_cure_handoff_processed: false,
        disease_effects_removed: true,
      }).state.diseased,
    ).toBe(false);
  });
  it('composes Standard effects and preserves unrelated state', () => {
    const effects = runCase(
      {
        ...ruleFixture,
        rule_ids: ['character.equipment.alchemy.potion_of_cure_disease.cure'],
        inputs: {},
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
      diseased: false,
      disease_penalty_active: false,
      cured: true,
      constitution: 29,
      strength: 39,
      constitution_after: 18,
      strength_after: 21,
      poisoned: true,
      hit_points: -2,
      can_act: false,
      coins: 120,
    });
  });
  it('Supreme removal preserves the separate healing instruction', () => {
    const effects = runCase(
      {
        ...ruleFixture,
        rule_ids: [
          'character.equipment.alchemy.potion_of_cure_disease.cure',
          'character.alchemy.quality_effect.potion_of_cure_disease.supreme',
        ],
        inputs: { quality: 'supreme' },
      },
      corpus,
    );
    expect(
      run({ ...potion, ...effects.state, potion_consumed: true, potion_resolution_completed: true })
        .state,
    ).toMatchObject({ diseased: false, bonus_healing_dice: '1d3', hit_points: -2 });
  });
  it('already resolved Supreme healing is not applied twice', () => {
    const first = run({
      ...potion,
      potion_consumed: true,
      potion_resolution_completed: true,
      disease_effects_removed: true,
      hit_points: 1,
    });
    expect(run(first.state).state.hit_points).toBe(1);
  });
  it.each([{ potion_consumed: false }, { potion_resolution_completed: false }])(
    'requires actual completed consumption %j',
    (override) => {
      expect(
        run({
          ...potion,
          potion_consumed: true,
          potion_resolution_completed: true,
          disease_effects_removed: true,
          ...override,
        }).state.diseased,
      ).toBe(true);
    },
  );
  it('Sick Ward request invokes the existing service once without charging', () => {
    const first = run(ward);
    expect(first.events[0]).toMatchObject({
      type: 'invoke',
      dependency: 'procedure.settlement_buy_sell_and_service',
    });
    expect(first.state).toMatchObject({ coins: 120, diseased: true });
    expect(run(first.state).events).toEqual([]);
  });
  it('a completed successful treatment cures without additional fee/day changes', () => {
    const first = run({ ...ward, treatment_resolution_completed: true, coins: 20, day: 1 });
    expect(first.state).toMatchObject({
      diseased: false,
      disease_penalty_active: false,
      coins: 20,
      day: 1,
      constitution: 29,
      strength: 39,
      poisoned: true,
    });
    expect(run(first.state).state.coins).toBe(20);
  });
  it('completed unsuccessful treatment consumes this result without curing', () => {
    const first = run({ ...ward, treatment_resolution_completed: true, treatment_succeeds: false });
    expect(first.state).toMatchObject({
      diseased: true,
      disease_penalty_active: true,
      disease_cure_result_processed: true,
    });
    expect(run({ ...first.state, treatment_succeeds: true }).state.diseased).toBe(true);
  });
  const rejected: State[] = [{ dead: true }, { diseased: false }, { cure_route: 'unknown' }];
  it.each(rejected)('rejects ineligible or unknown cure %j', (override) => {
    const result = run({
      ...potion,
      potion_consumed: true,
      potion_resolution_completed: true,
      disease_effects_removed: true,
      ...override,
    });
    expect(result.steps).not.toContain('clear_disease');
    expect(result.events).toEqual([]);
  });
  it('inaccessible ward cannot cure from a completed-visit claim', () => {
    expect(
      run({ ...ward, sick_ward_access_confirmed: false, treatment_resolution_completed: true })
        .state.diseased,
    ).toBe(true);
  });
  it('parent external-cure call only hands off', () => {
    const result = run(
      { damage_type: 'disease', phase: 'external_cure', diseased: true, dead: false },
      'procedure.damage_follow_up',
    );
    expect(result.events[0]).toMatchObject({
      type: 'invoke',
      dependency: 'procedure.disease_cure',
    });
    expect(result.state.diseased).toBe(true);
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
    operation: 'cure_disease',
    day: 1,
    activity_completion_day: 1,
    disease_penalty_active: true,
    constitution: 29,
    strength: 39,
    hit_points: -2,
  };
  it('composes service accounting and cure without charging twice or restoring unrelated stats', () => {
    const request = run(ward);
    expect(request.events[0]).toMatchObject({
      type: 'invoke',
      dependency: 'procedure.settlement_buy_sell_and_service',
    });
    const service = run(treatment, 'procedure.settlement_buy_sell_and_service');
    expect(service.state).toMatchObject({
      coins: 400,
      last_treatment_day: 1,
      diseased: false,
      disease_penalty_active: false,
      poisoned: true,
      constitution: 29,
      strength: 39,
      hit_points: -2,
    });
    const result = run({ ...ward, ...service.state, treatment_resolution_completed: true });
    expect(result.state.coins).toBe(400);
    expect(run(service.state, 'procedure.settlement_buy_sell_and_service').state.coins).toBe(400);
  });
  it('failed service consumes its existing fee but leaves the modifier active', () => {
    const service = run(
      { ...treatment, treatment_succeeds: false },
      'procedure.settlement_buy_sell_and_service',
    );
    const result = run({ ...ward, ...service.state, treatment_resolution_completed: true });
    expect(result.state).toMatchObject({
      coins: 400,
      diseased: true,
      disease_penalty_active: true,
      disease_cure_result_processed: true,
    });
  });
  it('ineligible service cannot charge or clear disease', () => {
    const service = run(
      { ...treatment, activity_authorized: false },
      'procedure.settlement_buy_sell_and_service',
    );
    const result = run({ ...ward, ...service.state, treatment_resolution_completed: false });
    expect(result.state).toMatchObject({
      coins: 500,
      diseased: true,
      disease_penalty_active: true,
    });
  });
});
