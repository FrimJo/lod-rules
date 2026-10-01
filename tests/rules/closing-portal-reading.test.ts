import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.closing_portal_reading_attempt', inputs }, corpus);
const initial: State = {
  phase: 'start',
  portal_reader_owner_matches: true,
  instance_quest_id: 'quest.chamber_of_reverence.closing_portal',
  portal_open: true,
  portal_attempt_started: false,
  hero_in_objective_room: true,
  ritual_eligibility_supplied: true,
  reader_stationary: true,
  duration_supplied: true,
  duration_die: 1,
  reading_active: false,
  reading_progress_turns: 0,
  restart_required: false,
  interrupted_other_way: false,
  reader_wounded: false,
  reader_dodged: false,
  reader_parried: false,
  coins: 700,
  last_restart_event: 0,
  last_reading_turn: 0,
};
describe('Closing the Portal initial reading and interruption — PDF257', () => {
  it.each([1, 2, 3, 4, 5, 6])('persists actual initial duration %i once', (duration_die) => {
    const first = run({ ...initial, duration_die });
    expect(first.state).toMatchObject({
      required_turns: duration_die + 1,
      reading_active: true,
      portal_attempt_started: true,
      reading_position: 'anywhere in the room',
      coins: 700,
    });
    expect(run({ ...first.state, duration_die: 6, reading_progress_turns: 1 }).state).toMatchObject(
      { required_turns: duration_die + 1, reading_progress_turns: 1 },
    );
  });
  it.each([
    'reader_wounded',
    'reader_dodged',
    'reader_parried',
    'interrupted_other_way',
    'reader_stationary',
  ])('stops reading on %s', (key) => {
    const first = run(initial);
    const result = run({
      ...first.state,
      phase: 'interruption',
      reading_progress_turns: 2,
      [key]: key !== 'reader_stationary',
    });
    expect(result.state).toMatchObject({
      reading_active: false,
      reading_allowed: false,
      restart_required: true,
      reading_progress_turns: 0,
      coins: 700,
    });
    expect(
      run({ ...result.state, phase: 'start', duration_die: 6, reader_stationary: true }).state,
    ).toMatchObject({ reading_active: false, required_turns: 2, restart_required: true });
  });
  it.each([
    { portal_reader_owner_matches: false },
    { instance_quest_id: 'quest.chamber_of_reverence.slaying_fiend' },
    { portal_open: false },
    { hero_in_objective_room: false },
    { ritual_eligibility_supplied: false },
    { reader_stationary: false },
  ] as State[])('rejects incompatible actual scope %j', (patch) => {
    expect(run({ ...initial, ...patch }).state.portal_attempt_started).toBe(false);
  });
  it('requests missing actual die without beginning or fabricating duration', () => {
    const result = run({ ...initial, duration_supplied: false });
    expect(result.state.portal_attempt_started).toBe(false);
    expect(result.state.required_turns).toBeUndefined();
  });
  it('uninterrupted checkpoint preserves progress without closing or spawning', () => {
    const result = run({ ...run(initial).state, phase: 'interruption', reading_progress_turns: 2 });
    expect(result.state).toMatchObject({
      reading_active: true,
      reading_progress_turns: 2,
      restart_required: false,
    });
    expect(result.state.portal_closed).toBeUndefined();
    expect(result.state.demons_spawned).toBeUndefined();
  });
});
const tick = (state: State, actual_reading_turn: number, patch: State = {}) =>
  run({
    ...state,
    phase: 'reading_turn',
    completed_reading_turn: true,
    reading_turn_context_resolved: true,
    actual_reading_turn,
    ...patch,
  });
const interrupted = () =>
  run({ ...run(initial).state, phase: 'interruption', reader_wounded: true }).state;
const restart = (state: State, patch: State = {}) =>
  run({
    ...state,
    phase: 'restart',
    reader_wounded: false,
    restart_event_supplied: true,
    restart_duration_context_resolved: true,
    actual_restart_event: 1,
    actual_restart_duration: 3,
    ...patch,
  });
describe('Closing the Portal actual reading progression and start-over — PDF257', () => {
  it.each([1, 2, 3, 4, 5, 6])(
    'closes only after %i+1 actual uninterrupted turns',
    (duration_die) => {
      let state = run({ ...initial, duration_die }).state;
      for (let turn = 1; turn <= duration_die + 1; turn++) {
        const result = tick(state, turn);
        state = result.state;
        expect(state.reading_progress_turns).toBe(turn);
        if (turn <= duration_die) {
          expect(state.portal_open).toBe(true);
          expect(state.portal_closed).toBeUndefined();
          expect(tick(state, turn).state.reading_progress_turns).toBe(turn);
        } else {
          expect(state).toMatchObject({
            portal_closed: true,
            portal_open: false,
            reading_active: false,
            remaining_demons_must_be_killed: true,
            coins: 700,
          });
          expect(result.trace).toEqual([
            'procedure.closing_portal_reading_attempt',
            'core.quest.closing_portal.portal_closure',
          ]);
        }
      }
      expect(tick(state, 99).state.reading_progress_turns).toBe(duration_die + 1);
      expect(state.objective_chests).toBeUndefined();
      expect(state.demons_spawned).toBeUndefined();
    },
  );
  it.each([
    'reader_wounded',
    'reader_dodged',
    'reader_parried',
    'interrupted_other_way',
    'reader_stationary',
  ])('completion turn interrupted by %s cannot close', (key) => {
    const first = tick(run(initial).state, 1).state;
    const result = tick(first, 2, { [key]: key !== 'reader_stationary' });
    expect(result.state).toMatchObject({
      reading_progress_turns: 0,
      last_reading_turn: 2,
      restart_required: true,
      reading_active: false,
      valid_reading_attempt: false,
    });
    expect(result.state.portal_closed).toBeUndefined();
    expect(result.trace).toEqual([
      'procedure.closing_portal_reading_attempt',
      'core.quest.closing_portal.ritual_interruption',
    ]);
  });
  it.each([2, 3, 4, 5, 6, 7])(
    'actual reconciled restart duration %i resets progress once',
    (actual_restart_duration) => {
      const first = restart(interrupted(), { actual_restart_duration });
      expect(first.state).toMatchObject({
        required_turns: actual_restart_duration,
        reading_active: true,
        restart_required: false,
        reading_progress_turns: 0,
        last_restart_event: 1,
      });
      const advanced = tick(first.state, 5).state;
      expect(
        restart(advanced, { actual_restart_event: 2, actual_restart_duration: 7 }).state,
      ).toMatchObject({
        required_turns: actual_restart_duration,
        reading_progress_turns: 1,
        last_restart_event: 1,
      });
    },
  );
  it('unresolved duration retains interruption and cannot resume', () => {
    const result = restart(interrupted(), { restart_duration_context_resolved: false });
    expect(result.state).toMatchObject({
      reading_active: false,
      restart_required: true,
      last_restart_event: 0,
      required_turns: 2,
    });
  });
  it.each([
    { restart_event_supplied: false },
    { actual_restart_event: 1, last_restart_event: 1 },
    { hero_in_objective_room: false },
    { ritual_eligibility_supplied: false },
    { reader_stationary: false },
    { portal_reader_owner_matches: false },
  ] as State[])('rejects missing/newer restart context %j', (patch) => {
    expect(restart(interrupted(), patch).state.reading_active).toBe(false);
  });
  it('a completed interrupted turn cannot be recounted after restart', () => {
    const broken = tick(run(initial).state, 1, { reader_wounded: true }).state;
    const resumed = restart(broken).state;
    expect(tick(resumed, 1).state.reading_progress_turns).toBe(0);
    expect(tick(resumed, 2).state.reading_progress_turns).toBe(1);
  });
  it.each([
    { completed_reading_turn: false },
    { reading_turn_context_resolved: false },
    { hero_in_objective_room: false },
    { ritual_eligibility_supplied: false },
    { portal_reader_owner_matches: false },
  ] as State[])('does not advance from unconfirmed reading context %j', (patch) => {
    expect(tick(run(initial).state, 1, patch).state.reading_progress_turns).toBe(0);
  });
  it('old chronological turns cannot add progress', () => {
    const first = tick(run({ ...initial, duration_die: 6 }).state, 4).state;
    expect(tick(first, 3).state.reading_progress_turns).toBe(1);
    expect(tick(first, 4).state.reading_progress_turns).toBe(1);
    expect(tick(first, 5).state.reading_progress_turns).toBe(2);
  });
});
