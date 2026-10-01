import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const ruleFixture = corpus.testCases.find((e) => e.rule_ids && !e.procedure_id)!;
const run = (inputs: State, id = 'procedure.wounded_status') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const current: State = {
  maximum_hp: 11,
  hit_points: 5,
  wounded: false,
  dead: false,
  can_act: true,
  turn_start: true,
  turn_ap_initialized: true,
  actions_spent_this_turn: 0,
  wounded_ap_context_resolved: true,
  wounded_turn_processed: false,
  action_points: 2,
};
describe('Wounded current status / actual fresh allowance — rendered PDF121', () => {
  it.each([
    [10, 6, false],
    [10, 5, true],
    [11, 6, false],
    [11, 5, true],
    [1, 1, false],
    [3, 2, false],
    [3, 1, true],
  ])('maximum %i / current %i yields wounded %s', (maximum_hp, hit_points, wounded) => {
    const result = run({ ...current, maximum_hp, hit_points });
    expect(result.state.wounded).toBe(wounded);
    expect(result.state.action_points).toBe(wounded ? 1 : 2);
  });
  it('healing above the threshold clears the flag without refunding active-turn AP', () => {
    const first = run(current);
    const healed = run({ ...first.state, hit_points: 6, turn_start: false, action_points: 0 });
    expect(healed.state).toMatchObject({
      wounded: false,
      action_points: 0,
      wounded_turn_processed: true,
      hit_points: 6,
    });
  });
  it('a later actual healthy turn preserves the separately owned normal allowance', () => {
    const first = run(current);
    const allocation = runCase(
      {
        ...ruleFixture,
        rule_ids: ['core.action_points.allocation'],
        inputs: { mode: 'dungeon', action_points: 0 },
      },
      corpus,
    );
    expect(allocation.trace).toEqual(['core.action_points.allocation']);
    expect(
      run({
        ...first.state,
        ...allocation.state,
        hit_points: 6,
        turn_start: true,
        wounded_turn_processed: false,
      }).state,
    ).toMatchObject({ wounded: false, action_points: 2 });
  });
  it('replay cannot replenish AP already spent in the affected turn', () => {
    const first = run(current);
    expect(
      run({ ...first.state, action_points: 0, actions_spent_this_turn: 1 }).state.action_points,
    ).toBe(0);
  });
  it('a distinct still-wounded later turn can apply its cap again', () => {
    const first = run(current);
    expect(
      run({ ...first.state, wounded_turn_processed: false, action_points: 2 }).state.action_points,
    ).toBe(1);
  });
  it.each([0, 1, 2, 4])('cap preserves a lower initialized allowance %i', (action_points) => {
    expect(run({ ...current, action_points }).state.action_points).toBe(Math.min(1, action_points));
  });
  const rejected: State[] = [
    { dead: true },
    { can_act: false },
    { hit_points: 0 },
    { hit_points: -2 },
    { turn_start: false },
    { turn_ap_initialized: false },
    { wounded_turn_processed: true },
  ];
  it.each(rejected)('does not grant AP or apply an unavailable cap %j', (override) => {
    const result = run({ ...current, ...override });
    expect(result.state.action_points).toBe(2);
    expect(result.steps).not.toContain('cap_allowance');
  });
  it('mid-turn spent actions remain unresolved without cap or marker consumption', () => {
    const result = run({ ...current, actions_spent_this_turn: 1 });
    expect(result.unresolved).toContain('issue.wounded.turn_allowance');
    expect(result.state).toMatchObject({
      action_points: 2,
      wounded: true,
      wounded_turn_processed: false,
    });
  });
  it('unknown modifier order remains unresolved without numerical precedence', () => {
    const result = run({ ...current, wounded_ap_context_resolved: false });
    expect(result.unresolved).toContain('issue.wounded.turn_allowance');
    expect(result.state).toMatchObject({ action_points: 2, wounded_turn_processed: false });
  });
  it('a supplied already-zero Stun allowance is not restored by Wounded', () => {
    const stunned = run(
      {
        stun_next_turn_pending: true,
        stun_turn_processed: false,
        stun: true,
        next_turn_actions_lost: 1,
        next_turn_started: true,
        turn_ap_initialized: true,
        stun_scope_resolved: true,
        action_points: 1,
      },
      'procedure.stun_next_turn',
    );
    expect(stunned.state.action_points).toBe(0);
    expect(run({ ...current, ...stunned.state }).state.action_points).toBe(0);
  });
  const damage: State = {
    hit_resolved: true,
    target_is_hero: true,
    defence_resolved: true,
    armour_resolution_supplied: false,
    quick_slot_resolution_supplied: false,
    weapon_damage: 8,
    damage_bonus: 0,
    natural_armour: 1,
    armour: 2,
    hit_points: 10,
    maximum_hp: 10,
    location_roll: 1,
    armour_durability_loss: 0,
    quick_slot_durability_loss: 0,
    quick_slot_damage: 0,
    action_points: 0,
  };
  it('post-hit composition subtracts HP once and hands off without restoring spent AP', () => {
    const hit = run(damage, 'procedure.combat_damage');
    expect(hit.state).toMatchObject({ hit_points: 5, action_points: 0 });
    expect(hit.trace).toContain('character.hit_points.loss');
    expect(hit.events).toContainEqual({ type: 'invoke', dependency: 'procedure.wounded_status' });
    const classified = run({
      ...current,
      ...hit.state,
      turn_start: false,
      actions_spent_this_turn: 2,
    });
    expect(classified.state).toMatchObject({ hit_points: 5, wounded: true, action_points: 0 });
    expect(run(classified.state).state.hit_points).toBe(5);
  });
  it('post-hit healthy target is classified without setting a Wounded allowance', () => {
    const hit = run({ ...damage, maximum_hp: 11, hit_points: 11 }, 'procedure.combat_damage');
    expect(hit.state.hit_points).toBe(6);
    expect(run({ ...current, ...hit.state, turn_start: false }).state).toMatchObject({
      wounded: false,
      hit_points: 6,
      action_points: 0,
    });
  });
});
