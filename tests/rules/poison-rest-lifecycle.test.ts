import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const id = 'procedure.damage_follow_up';
const run = (inputs: State, procedureId = id) =>
  runCase({ ...fixture, procedure_id: procedureId, inputs }, corpus);
const rest: State = {
  damage_type: 'poison',
  phase: 'rest',
  rest_occurs: true,
  already_poisoned: true,
  poisoned: true,
  dead: false,
  hit_points: 20,
  remaining_poison_rolls: 3,
  poison_rest_handoff_processed: false,
};
const compose = (input: State, outcomes: readonly [number, boolean][]) => {
  const start = run(input);
  const results = [start];
  let state = start.state;
  if (state.poison_rest_allowed !== true) return { state, results };
  // Derived test driver only: invoke does not execute a child or a loop.
  for (const [roll, success] of outcomes) {
    if (
      state.dead === true ||
      state.already_poisoned === false ||
      state.remaining_poison_rolls === 0
    )
      break;
    const result = run({
      ...state,
      phase: 'ongoing',
      poison_check_processed: false,
      con_roll: roll,
      con_success: success,
    });
    results.push(result);
    state = result.state;
  }
  return { state, results };
};

describe('Poison rest remaining-check sequence — rendered PDF122', () => {
  it.each([1, 3, 11])('hands off all %i checks without executing or consuming them', (count) => {
    const result = run({ ...rest, remaining_poison_rolls: count });
    expect(result.state).toMatchObject({
      poison_rolls_due: count,
      remaining_poison_rolls: count,
      hit_points: 20,
      poison_rest_handoff_processed: true,
    });
    expect(result.events).toEqual([{ type: 'invoke', dependency: id }]);
    expect(result.steps).not.toContain('poison_loss');
  });
  it('replay cannot create a second rest sequence or keep stale due output', () => {
    const result = run(run(rest).state);
    expect(result.events).toEqual([]);
    expect(result.state).toMatchObject({
      poison_rest_allowed: false,
      poison_rolls_due: 0,
      remaining_poison_rolls: 3,
    });
  });
  const excluded: State[] = [
    { remaining_poison_rolls: 0 },
    { dead: true },
    { already_poisoned: false },
    { rest_occurs: false },
  ];
  it.each(excluded)('rejects ineligible rest handoff %j', (override) => {
    const result = run({ ...rest, poison_rest_allowed: true, poison_rolls_due: 9, ...override });
    expect(result.events).toEqual([]);
    expect(result.state.poison_rolls_due).toBe(0);
    expect(result.state.poison_rest_handoff_processed).toBe(false);
  });
  it('a distinct rest/episode context uses its supplied remaining count', () => {
    const first = run(rest);
    const later = run({
      ...first.state,
      poison_rest_handoff_processed: false,
      remaining_poison_rolls: 2,
    });
    expect(later.state.poison_rolls_due).toBe(2);
    expect(later.events).toEqual([{ type: 'invoke', dependency: id }]);
  });
  it.each(['dungeon', 'travel', 'inn'])(
    'explicit supplied outcomes resolve all remaining checks at %s rest',
    (location) => {
      const result = compose({ ...rest, rest_location: location }, [
        [50, false],
        [50, true],
        [50, false],
      ]);
      expect(result.state).toMatchObject({
        hit_points: 18,
        remaining_poison_rolls: 0,
        dead: false,
      });
      expect(result.results).toHaveLength(4);
      expect(result.results.slice(1).every((r) => r.steps.includes('consume_poison_check'))).toBe(
        true,
      );
      expect(result.state.cured).toBeUndefined();
    },
  );
  it('a cure halfway through the rest cancels remaining outcomes', () => {
    const result = compose(rest, [
      [50, false],
      [5, false],
      [50, false],
    ]);
    expect(result.state).toMatchObject({
      hit_points: 19,
      remaining_poison_rolls: 0,
      cured: true,
      already_poisoned: false,
    });
    expect(result.results).toHaveLength(3);
  });
  it('zero-reaching death ends the explicit rest sequence and allows permanent-removal composition', () => {
    const result = compose({ ...rest, hit_points: 1 }, [
      [50, false],
      [50, false],
    ]);
    expect(result.state).toMatchObject({ hit_points: 0, dead: true, remaining_poison_rolls: 2 });
    expect(result.results).toHaveLength(2);
    expect(result.results[1]?.events).toEqual([
      { type: 'invoke', dependency: 'procedure.hero_death' },
    ]);
    const removed = run(
      {
        ...result.state,
        removed_from_game: false,
        next_settlement_visit: false,
        replacement_chosen: false,
        replacement_processed: false,
      },
      'procedure.hero_death',
    );
    expect(removed.state).toMatchObject({ dead: true, removed_from_game: true, can_act: false });
  });
  it('rejected replay cannot start another composed rest sequence', () => {
    const result = compose(run(rest).state, [[50, false]]);
    expect(result.results).toHaveLength(1);
    expect(result.state).toMatchObject({ hit_points: 20, remaining_poison_rolls: 3 });
  });
  it('eleven supplied successful checks exhaust the longest printed initial sequence', () => {
    const outcomes: [number, boolean][] = Array.from({ length: 11 }, () => [50, true]);
    const result = compose({ ...rest, remaining_poison_rolls: 11 }, outcomes);
    expect(result.state).toMatchObject({ hit_points: 20, remaining_poison_rolls: 0 });
    expect(result.results).toHaveLength(12);
  });
  it('dungeon condition handoff, rest sequence and individual checks compose explicitly', () => {
    const outer = run(
      {
        rest_attempt_started: true,
        rest_completed: true,
        poisoned: true,
        poison_rest_processed: false,
        remaining_poison_rolls: 3,
      },
      'procedure.rest_poison_checks',
    );
    expect(outer.events).toEqual([{ type: 'invoke', dependency: id }]);
    const result = compose({ ...rest, ...outer.state }, [
      [50, true],
      [50, true],
      [50, true],
    ]);
    expect(result.state.remaining_poison_rolls).toBe(0);
    expect(result.results[0]?.state.poison_rest_handoff_processed).toBe(true);
    expect(result.results[0]?.state.poison_rest_processed).toBe(true);
  });
});
