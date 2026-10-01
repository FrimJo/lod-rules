import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.damage_follow_up', inputs }, corpus);
const check: State = {
  phase: 'ongoing',
  damage_type: 'poison',
  already_poisoned: true,
  remaining_poison_rolls: 3,
  poison_check_processed: false,
  dead: false,
  hit_points: 4,
  con_roll: 50,
  con_success: false,
  rest_occurs: false,
};

describe('One remaining poison CON check — rendered PDF122', () => {
  it('a failure loses one HP and consumes exactly one check', () => {
    const result = run(check);
    expect(result.state).toMatchObject({
      hit_points: 3,
      hp_lost: 1,
      remaining_poison_rolls: 2,
      poison_check_processed: true,
      poison_starting_hp: 4,
    });
    expect(result.steps).toContain('consume_poison_check');
  });
  it('a successful ordinary check consumes a roll without curing poison', () => {
    const result = run({ ...check, con_success: true });
    expect(result.state).toMatchObject({ hit_points: 4, hp_lost: 0, remaining_poison_rolls: 2 });
    expect(result.state.cured).toBeUndefined();
  });
  it.each([1, 2, 3, 4, 5])('printed CON %i cures and cancels all future checks', (roll) => {
    const result = run({ ...check, con_roll: roll });
    expect(result.state).toMatchObject({
      cured: true,
      poisoned: false,
      remaining_poison_rolls: 0,
      poison_rolls_due: 0,
      hit_points: 4,
    });
    expect(result.steps).not.toContain('poison_loss');
  });
  it('roll 6 is outside the cure range', () => {
    expect(run({ ...check, con_roll: 6 }).state).toMatchObject({
      hit_points: 3,
      remaining_poison_rolls: 2,
    });
  });
  it('replay cannot repeat damage, consume a check or trigger rest death', () => {
    const first = run({ ...check, rest_occurs: true, hit_points: 2 });
    const repeat = run(first.state);
    expect(repeat.state).toMatchObject({
      hit_points: 1,
      remaining_poison_rolls: 2,
      dead: false,
      hp_lost: 0,
    });
    expect(repeat.steps).not.toContain('poison_loss');
    expect(repeat.steps).not.toContain('poison_rest_death');
  });
  it('a distinct next check uses the persisted remaining count', () => {
    const first = run(check);
    expect(run({ ...first.state, poison_check_processed: false }).state).toMatchObject({
      hit_points: 2,
      remaining_poison_rolls: 1,
    });
  });
  it('the last ordinary check is consumed without inventing an automatic cure', () => {
    const result = run({ ...check, remaining_poison_rolls: 1 });
    expect(result.state.remaining_poison_rolls).toBe(0);
    expect(result.state.cured).toBeUndefined();
  });
  const invalid: State[] = [
    { remaining_poison_rolls: 0 },
    { already_poisoned: false },
    { dead: true },
  ];
  it.each(invalid)('rejects ineligible checkpoint %j', (override) => {
    const result = run({ ...check, ...override });
    expect(result.state.hit_points).toBe(4);
    expect(result.state.poison_check_allowed).toBe(false);
    expect(result.steps).not.toContain('consume_poison_check');
  });
  it('reaching zero on a failed check during rest causes death', () => {
    const result = run({ ...check, rest_occurs: true, hit_points: 1 });
    expect(result.state).toMatchObject({ dead: true, hit_points: 0, remaining_poison_rolls: 2 });
    expect(result.steps).toContain('poison_rest_death');
  });
  it('reaching zero outside rest does not assert rest death', () => {
    expect(run({ ...check, hit_points: 1 }).state).toMatchObject({ dead: false, hit_points: 0 });
  });
  it.each([0, -1])('poison continues below zero from supplied HP %i', (hp) => {
    const result = run({ ...check, hit_points: hp, rest_occurs: true });
    expect(result.state).toMatchObject({ hit_points: hp - 1, dead: false });
  });
  it('a successful check at already-zero HP does not manufacture rest death', () => {
    expect(run({ ...check, hit_points: 0, rest_occurs: true, con_success: true }).state.dead).toBe(
      false,
    );
  });
});
