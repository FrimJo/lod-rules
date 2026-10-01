import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.damage_follow_up', inputs }, corpus);
const exposure: State = {
  phase: 'initial',
  damage_type: 'poison',
  damage_resolved: true,
  took_damage: true,
  already_poisoned: false,
  poisoned: false,
  dead: false,
  poison_exposure_processed: false,
  con_roll: 50,
  con_success: false,
  poison_duration_roll: 4,
  rest_occurs: false,
};

describe('Poison damaging-hit exposure — rendered PDF122', () => {
  it.each([1, 4, 10])(
    'initializes one episode with d10=%i and next-turn plus later checks',
    (die) => {
      const result = run({ ...exposure, poison_duration_roll: die });
      expect(result.state).toMatchObject({
        poisoned: true,
        already_poisoned: true,
        poison_rolls_due: die + 1,
        remaining_poison_rolls: die + 1,
        poison_exposure_processed: true,
        cured: false,
      });
      expect(result.steps).toContain('poison');
      expect(result.trace).toEqual(['procedure.damage_follow_up']);
    },
  );
  it('replay cannot reset the remaining sequence with a different die', () => {
    const first = run(exposure);
    const repeat = run({ ...first.state, poison_duration_roll: 10, remaining_poison_rolls: 3 });
    expect(repeat.state.remaining_poison_rolls).toBe(3);
    expect(repeat.steps).not.toContain('accept_poison_exposure');
    expect(repeat.steps).not.toContain('poison');
  });
  it('ordinary resistance consumes the exposure checkpoint without infection', () => {
    const first = run({ ...exposure, con_success: true, poison_rolls_due: 9 });
    expect(first.state).toMatchObject({
      poison_exposure_processed: true,
      already_poisoned: false,
      poisoned: false,
    });
    expect(first.state.remaining_poison_rolls).toBe(0);
    expect(first.state.poison_rolls_due).toBe(0);
    const replay = run({ ...first.state, con_success: false });
    expect(replay.state.poisoned).toBe(false);
    expect(replay.steps).not.toContain('poison');
  });
  it.each([1, 2, 3, 4, 5])(
    'CON %i cannot infect through a contradictory supplied failed result',
    (roll) => {
      const result = run({ ...exposure, con_roll: roll });
      expect(result.state).toMatchObject({
        cured: true,
        poisoned: false,
        already_poisoned: false,
        remaining_poison_rolls: 0,
      });
      expect(result.steps).not.toContain('poison');
    },
  );
  const invalid: State[] = [
    { took_damage: false },
    { damage_resolved: false },
    { already_poisoned: true },
    { dead: true },
  ];
  it.each(invalid)('rejects ineligible exposure %j and stale permission', (override) => {
    const result = run({ ...exposure, poison_exposure_allowed: true, ...override });
    expect(result.state.poison_exposure_allowed).toBe(false);
    expect(result.state.poison_exposure_processed).toBe(false);
    expect(result.state.remaining_poison_rolls).toBeUndefined();
  });
  it('a distinct later hit can infect a previously resistant target', () => {
    const first = run({ ...exposure, con_success: true, poison_rolls_due: 9 });
    expect(
      run({ ...first.state, poison_exposure_processed: false, con_success: false }).state.poisoned,
    ).toBe(true);
  });
  it('a poisoned target cannot acquire another episode from a distinct later hit', () => {
    const first = run(exposure);
    const next = run({
      ...first.state,
      poison_exposure_processed: false,
      poison_duration_roll: 10,
    });
    expect(next.state.remaining_poison_rolls).toBe(5);
    expect(next.steps).not.toContain('poison');
  });
  it('explicit cure clears current condition so a distinct later exposure can infect', () => {
    const first = run(exposure);
    const cured = run({
      ...first.state,
      phase: 'ongoing',
      poison_check_processed: false,
      con_roll: 5,
      hit_points: 4,
    });
    expect(cured.state.already_poisoned).toBe(false);
    const later = run({
      ...cured.state,
      phase: 'initial',
      poison_exposure_processed: false,
      con_roll: 50,
      poison_duration_roll: 1,
    });
    expect(later.state).toMatchObject({
      poisoned: true,
      already_poisoned: true,
      cured: false,
      remaining_poison_rolls: 2,
    });
  });
  it.each([0, 11])('rejects supplied duration outside printed d10: %i', (die) => {
    expect(() => run({ ...exposure, poison_duration_roll: die })).toThrow(
      'Input out of range poison_duration_roll',
    );
  });
});
