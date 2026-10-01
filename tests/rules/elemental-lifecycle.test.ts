import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State, id = 'procedure.damage_follow_up') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const initial: State = {
  damage_type: 'fire',
  phase: 'initial',
  damage_resolved: true,
  elemental_hit_processed: false,
  continuation_roll: 4,
  damage_before_protection: 7,
  hit_points: 10,
};
describe('Elemental hit and one-turn continuation — rendered PDF121–122', () => {
  it.each(['fire', 'acidic'])('preserves %s protection distinctions', (damage_type) => {
    expect(run({ ...initial, damage_type }).state).toMatchObject({
      ignore_natural_armour: true,
      ignore_armour: damage_type === 'fire',
      hit_points: 10,
    });
  });
  it.each([1, 2, 3])('continuation roll %i ends immediately', (continuation_roll) => {
    expect(run({ ...initial, continuation_roll }).state).toMatchObject({
      next_turn_damage: 0,
      continuation_pending: false,
      expires: 'now',
      elemental_hit_processed: true,
    });
  });
  it.each([4, 5, 6])('continuation roll %i schedules exactly one turn', (continuation_roll) => {
    expect(run({ ...initial, continuation_roll }).state).toMatchObject({
      next_turn_damage: 3,
      continuation_pending: true,
      expires: 'after next turn',
      elemental_hit_processed: true,
    });
  });
  it.each([
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [8, 4],
    [9, 4],
  ])('supplied basis %i yields scheduled %i', (damage_before_protection, expected) => {
    expect(run({ ...initial, damage_before_protection }).state.next_turn_damage).toBe(expected);
  });
  it('replay cannot replace continuation die or halve another supplied amount', () => {
    const first = run(initial);
    const repeated = run({ ...first.state, continuation_roll: 1, damage_before_protection: 40 });
    expect(repeated.state).toMatchObject({ next_turn_damage: 3, continuation_pending: true });
    expect(repeated.steps).not.toContain('extinguished');
    expect(repeated.steps).not.toContain('continues');
  });
  it('distinct hits have fresh independently owned markers', () => {
    const first = run(initial);
    expect(
      run({ ...first.state, elemental_hit_processed: false, continuation_roll: 2 }).state
        .continuation_pending,
    ).toBe(false);
    expect(first.state.continuation_pending).toBe(true);
  });
  it('unresolved damage does not consume the initial hit marker', () => {
    const first = run({ ...initial, damage_resolved: false });
    expect(first.state.elemental_hit_processed).toBe(false);
    expect(run({ ...first.state, damage_resolved: true }).state.next_turn_damage).toBe(3);
  });
  const frost: State = {
    damage_type: 'frost',
    phase: 'initial',
    damage_resolved: true,
    elemental_hit_processed: false,
    frost_stun_result: true,
  };
  it('Frost supplied chance success schedules one AP loss', () => {
    expect(run(frost).state).toMatchObject({
      stun: true,
      next_turn_actions_lost: 1,
      elemental_hit_processed: true,
    });
  });
  it('Frost chance failure schedules no AP loss for its own hit context', () => {
    expect(
      run({ ...frost, frost_stun_result: false, stun: true, next_turn_actions_lost: 1 }).state,
    ).toMatchObject({ stun: false, next_turn_actions_lost: 0, elemental_hit_processed: true });
  });
  it('Frost failure consumes chance result and cannot be replaced on replay', () => {
    const first = run({ ...frost, frost_stun_result: false });
    expect(run({ ...first.state, frost_stun_result: true }).state.next_turn_actions_lost).toBe(0);
  });
  it('a distinct later Frost hit can schedule stun', () => {
    const first = run({ ...frost, frost_stun_result: false });
    expect(
      run({ ...first.state, elemental_hit_processed: false, frost_stun_result: true }).state
        .next_turn_actions_lost,
    ).toBe(1);
  });
  const continuation: State = {
    ...run(initial).state,
    next_turn_started: true,
    continuation_damage_resolved: false,
  };
  const follow = (inputs: State) => run(inputs, 'procedure.elemental_continuation');
  it('parent next-turn call is only a handoff', () => {
    const result = run({ ...continuation, phase: 'next_turn' });
    expect(result.events[0]).toMatchObject({
      type: 'invoke',
      dependency: 'procedure.elemental_continuation',
    });
    expect(result.state.hit_points).toBe(10);
  });
  it('actual next turn requests damage once without subtracting HP', () => {
    const first = follow(continuation);
    expect(first.events[0]).toMatchObject({
      type: 'invoke',
      dependency: 'character.hit_points.loss',
    });
    expect(first.state).toMatchObject({
      hit_points: 10,
      next_turn_damage: 3,
      continuation_pending: true,
      continuation_handoff_processed: true,
    });
    expect(follow(first.state).events).toEqual([]);
  });
  it.each(['fire', 'acidic'])(
    'completed %s damage cancels the one-turn effect without a second HP loss',
    (damage_type) => {
      const requested = follow({ ...continuation, damage_type });
      const completed = follow({
        ...requested.state,
        continuation_damage_resolved: true,
        hit_points: 7,
      });
      expect(completed.state).toMatchObject({
        hit_points: 7,
        continuation_pending: false,
        next_turn_damage: 0,
        continuation_result_processed: true,
        expires: 'now',
      });
      expect(completed.steps).toContain('end_continuation');
      expect(follow(completed.state).events).toEqual([]);
      expect(follow(completed.state).state.hit_points).toBe(7);
    },
  );
  const rejected: State[] = [
    { next_turn_started: false },
    { continuation_pending: false },
    { continuation_result_processed: true },
    { damage_type: 'frost' },
  ];
  it.each(rejected)('rejects unavailable or completed next-turn effect %j', (override) => {
    const result = follow({ ...continuation, ...override });
    expect(result.events).toEqual([]);
    expect(result.steps).not.toContain('end_continuation');
  });
  it('completed damage supplied before request ends without invoking it again', () => {
    const result = follow({ ...continuation, continuation_damage_resolved: true, hit_points: 7 });
    expect(result.events).toEqual([]);
    expect(result.state.continuation_pending).toBe(false);
  });
  it('retains halving/protection uncertainty and distinct-hit composition boundary', () => {
    expect(
      corpus.procedures.find((p) => p.id === 'procedure.elemental_continuation')?.issues,
    ).toContain('issue.damage_follow_up.continuation_basis');
  });
  it('composes one generic HP-loss rule with continuation completion and replay', () => {
    const requested = follow(continuation);
    expect(requested.events).toEqual([{ type: 'invoke', dependency: 'character.hit_points.loss' }]);
    const ruleFixture = corpus.testCases.find((entry) => entry.rule_ids && !entry.procedure_id)!;
    const hp = runCase(
      {
        ...ruleFixture,
        rule_ids: ['character.hit_points.loss'],
        inputs: { hit_points: 10, damage_taken: 3 },
      },
      corpus,
    );
    expect(hp.state.hit_points).toBe(7);
    expect(hp.trace).toContain('character.hit_points.loss');
    const completed = follow({
      ...requested.state,
      ...hp.state,
      continuation_damage_resolved: true,
    });
    expect(completed.state.hit_points).toBe(7);
    expect(completed.state.continuation_pending).toBe(false);
    const replay = follow(completed.state);
    expect(replay.events).toEqual([]);
    expect(replay.state.hit_points).toBe(7);
    expect(completed.state.hit_location).toBeUndefined();
    expect(completed.state.quick_slot_durability_loss).toBeUndefined();
  });
});
