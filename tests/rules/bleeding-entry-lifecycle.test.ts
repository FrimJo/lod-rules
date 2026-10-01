import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.bleeding_out', inputs }, corpus);
const initial: State = {
  phase: 'initial',
  hit_points: 0,
  selected_value: 40,
  loss: 3,
  advanced_rule_enabled: true,
  die: 4,
  dead: false,
  zero_processed: false,
  timer_processed: false,
  all_bleeding_out: false,
};

describe('Bleeding entry ownership — rendered PDF122', () => {
  it('applies the zero, injury and optional timer rules in source checkpoint order', () => {
    const result = run(initial);
    expect(result.state).toMatchObject({
      selected_value: 37,
      knocked_down: true,
      bleeding_out: true,
      can_act: false,
      zero_processed: true,
      timer_processed: true,
      turns: 5,
    });
    expect(result.trace).toEqual([
      'procedure.bleeding_out',
      'character.hit_points.zero',
      'character.hit_points.permanent_injury',
      'character.hit_points.bleeding_time',
    ]);
  });
  it('cannot repeat injury or reroll the timer for the same downing event', () => {
    const first = run(initial);
    const replay = run({ ...first.state, loss: 4, die: 6 });
    expect(replay.state).toMatchObject({ selected_value: 37, turns: 5 });
    expect(replay.steps).not.toContain('zero');
    expect(replay.steps).not.toContain('timer');
    expect(replay.trace).toEqual(['procedure.bleeding_out']);
  });
  it('a distinct later downing event may apply a new injury and timer', () => {
    const first = run(initial);
    const later = run({ ...first.state, zero_processed: false, timer_processed: false, die: 1 });
    expect(later.state).toMatchObject({ selected_value: 34, turns: 2 });
  });
  it.each([1, 2, 3, 4])('preserves the supplied d4 permanent loss %i', (loss) => {
    expect(run({ ...initial, loss }).state.selected_value).toBe(40 - loss);
  });
  it('ordinary entry does not initialize an advanced-rule timer', () => {
    const result = run({ ...initial, advanced_rule_enabled: false });
    expect(result.state.turns).toBeUndefined();
    expect(result.state.timer_processed).toBe(false);
  });
  it.each([-1, 1])('does not turn HP %i into the exact-zero checkpoint', (hitPoints) => {
    const result = run({ ...initial, hit_points: hitPoints });
    expect(result.state.selected_value).toBe(40);
    expect(result.state.zero_processed).toBe(false);
    expect(result.state.turns).toBeUndefined();
  });
  it('does not initiate another downing event for a permanently dead hero', () => {
    const result = run({ ...initial, dead: true });
    expect(result.state.selected_value).toBe(40);
    expect(result.state.turns).toBeUndefined();
    expect(result.steps).not.toContain('zero');
  });
});
