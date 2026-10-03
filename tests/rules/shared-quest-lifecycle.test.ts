import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((x) => x.procedure_id === 'procedure.rest')!;
const lifecycle = corpus.procedures.find((x) => x.id === 'procedure.quest_dungeon_lifecycle')!;
const reading = corpus.procedures.find((x) => x.id === 'procedure.quest_reading_and_events')!;
const defaults = (fields: typeof lifecycle.fields): State =>
  Object.fromEntries(
    Object.entries(fields).map(([n, f]) => [
      n,
      f.type === 'boolean' ? false : f.type === 'number' ? (f.minimum ?? 0) : '',
    ]),
  );
const base: State = {
  ...defaults(lifecycle.fields),
  phase: 'enter',
  quest_owner_matches: true,
  dungeon_quest_scope: true,
  instance_acceptance_processed: true,
  instance_departure_processed: true,
  instance_id: 'occurrence.one',
  actual_instance_id: 'occurrence.one',
  instance_owner: 'party.one',
  actual_party_id: 'party.one',
  instance_layout_id: 'layout.one',
  actual_layout_id: 'layout.one',
  actual_visit_id: 'visit.one',
  actual_visit_sequence: 1,
  actual_dungeon_entry: true,
  quest_stage: 'accepted',
  coins: 81,
  objective_progress: 3,
  reward_consumed: false,
};
const run = (inputs: State) => runCase({ ...fixture, procedure_id: lifecycle.id, inputs }, corpus);
const active = () => run(base).state;
const abandon = () =>
  run({ ...active(), phase: 'abandon', actual_abandonment: true, actual_layout_recorded: true })
    .state;
const returning = (patch: State = {}) =>
  run({
    ...abandon(),
    phase: 'return',
    actual_visit_id: 'visit.two',
    actual_visit_sequence: 2,
    actual_return_arrival: true,
    actual_return_departure_confirmed: true,
    ...patch,
  });
const readBase: State = {
  ...defaults(reading.fields),
  phase: 'reading',
  quest_event_owner_matches: true,
  coins: 81,
  actual_threat_event: 1,
  quest_threshold: 12,
};
const read = (inputs: State) => runCase({ ...fixture, procedure_id: reading.id, inputs }, corpus);
describe('Shared dungeon quest occurrence versus return visit — PDF88', () => {
  it.each([
    { quest_owner_matches: false },
    { dungeon_quest_scope: false },
    { instance_acceptance_processed: false },
    { instance_departure_processed: false },
    { actual_dungeon_entry: false },
    { actual_instance_id: 'other' },
    { actual_party_id: 'other' },
    { actual_layout_id: 'other' },
  ] as State[])('rejects incomplete/unowned initial entry%j', (patch) => {
    expect(run({ ...base, ...patch }).state.quest_stage).toBe('accepted');
  });
  it('actual entry changes only the owned visit checkpoint once', () => {
    const first = run(base);
    expect(first.state).toMatchObject({
      quest_stage: 'active',
      current_visit_id: 'visit.one',
      last_visit_sequence: 1,
      coins: 81,
      objective_progress: 3,
    });
    expect(
      run({ ...first.state, actual_visit_id: 'forged', actual_visit_sequence: 2 }).state
        .current_visit_id,
    ).toBe('visit.one');
  });
  it('missing saved layout requests once and leaves active quest intact', () => {
    const first = run({ ...active(), phase: 'abandon', actual_abandonment: true });
    expect(first.state).toMatchObject({
      quest_stage: 'active',
      instance_abandoned: false,
      saved_layout_required: true,
      coins: 81,
      objective_progress: 3,
    });
    expect(first.events).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
    expect(run({ ...first.state, actual_layout_recorded: true }).state.quest_stage).toBe(
      'abandoned',
    );
  });
  it('abandonment is resumable and preserves layout, acceptance, objectives and reward state', () => {
    const first = abandon();
    expect(first).toMatchObject({
      quest_stage: 'abandoned',
      instance_abandoned: true,
      instance_completed: false,
      saved_layout_id: 'layout.one',
      instance_id: 'occurrence.one',
      instance_acceptance_processed: true,
      objective_progress: 3,
      reward_consumed: false,
      coins: 81,
    });
    expect(run({ ...first, actual_layout_id: 'replacement' }).state.saved_layout_id).toBe(
      'layout.one',
    );
  });
  it('return binds a distinct visit to same occurrence and requests repopulation once', () => {
    const first = returning();
    expect(first.state).toMatchObject({
      quest_stage: 'abandoned',
      return_pending: true,
      pending_return_visit_id: 'visit.two',
      repopulate_required: true,
      fresh_locked_door_checks_required: true,
      fresh_encounter_checks_required: true,
      instance_id: 'occurrence.one',
      objective_progress: 3,
      coins: 81,
    });
    expect(first.events).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
    expect(first.trace).toEqual([
      'procedure.quest_dungeon_lifecycle',
      'core.quest_lifecycle.return_checks',
    ]);
  });
  it.each([
    { actual_visit_id: 'visit.one' },
    { actual_visit_sequence: 1 },
    { actual_layout_id: 'replacement' },
    { actual_return_arrival: false },
    { actual_return_departure_confirmed: false },
    { actual_instance_id: 'new.quest' },
  ] as State[])('wrong or replayed return%j does not bind new pending visit', (patch) => {
    expect(returning(patch).state.return_pending).toBe(false);
  });
  it('only actual pending repopulation completion resumes, preserving original occurrence', () => {
    const first = returning().state;
    for (const patch of [
      { actual_visit_id: 'visit.three' },
      { actual_visit_sequence: 3 },
      { return_result_matches_pending_visit: false },
      { actual_instance_id: 'other' },
    ] as State[]) {
      expect(
        run({
          ...first,
          actual_repopulation_complete: true,
          return_result_matches_pending_visit: true,
          ...patch,
        }).state.quest_stage,
      ).toBe('abandoned');
    }
    const resumed = run({
      ...first,
      actual_repopulation_complete: true,
      return_result_matches_pending_visit: true,
    });
    expect(resumed.state).toMatchObject({
      quest_stage: 'active',
      instance_abandoned: false,
      current_visit_id: 'visit.two',
      last_visit_sequence: 2,
      instance_id: 'occurrence.one',
      instance_completed: false,
      objective_progress: 3,
      coins: 81,
      fresh_locked_door_checks_required: true,
      fresh_encounter_checks_required: true,
    });
    expect(run(resumed.state).events).toEqual([]);
  });
  it('second abandonment/return requires a fresh visit instead of resetting accepted quest', () => {
    const first = returning({
      actual_repopulation_complete: true,
      return_result_matches_pending_visit: true,
    }).state;
    const secondAbandon = run({
      ...first,
      phase: 'abandon',
      actual_abandonment: true,
      actual_layout_recorded: true,
    }).state;
    const second = run({
      ...secondAbandon,
      phase: 'return',
      actual_visit_id: 'visit.three',
      actual_visit_sequence: 3,
      actual_return_arrival: true,
      actual_return_departure_confirmed: true,
      actual_repopulation_complete: true,
      return_result_matches_pending_visit: true,
    });
    expect(second.events).toHaveLength(1);
    expect(second.state).toMatchObject({
      instance_id: 'occurrence.one',
      current_visit_id: 'visit.three',
      last_visit_sequence: 3,
      objective_progress: 3,
    });
  });
  it.each([
    { actual_task_result_supplied: false },
    { task_accomplished: false },
    { actual_visit_id: 'other' },
    { quest_owner_matches: false },
  ] as State[])('incomplete/unowned objective%j cannot complete', (patch) => {
    expect(
      run({
        ...active(),
        phase: 'objective',
        actual_task_result_supplied: true,
        task_accomplished: true,
        ...patch,
      }).state.instance_completed,
    ).toBe(false);
  });
  it('task achievement grants exit permission; actual exit is distinct and pays nothing', () => {
    const completed = run({
      ...active(),
      phase: 'objective',
      actual_task_result_supplied: true,
      task_accomplished: true,
    });
    expect(completed.state).toMatchObject({
      quest_stage: 'accomplished',
      instance_completed: true,
      leave_without_retracing_allowed: true,
      instance_exit_processed: false,
      coins: 81,
    });
    expect(completed.trace).toEqual([
      'procedure.quest_dungeon_lifecycle',
      'core.quest_lifecycle.finish_exit',
    ]);
    expect(run({ ...completed.state, phase: 'exit' }).state.quest_stage).toBe('accomplished');
    const exited = run({ ...completed.state, phase: 'exit', actual_dungeon_exit: true });
    expect(exited.state).toMatchObject({
      quest_stage: 'exited',
      instance_exit_processed: true,
      coins: 81,
      reward_consumed: false,
    });
    expect(
      run({ ...exited.state, phase: 'enter', actual_visit_sequence: 4 }).state.quest_stage,
    ).toBe('exited');
  });
  it('a legitimately accepted repeat owns a new occurrence instead of reusing exited markers', () => {
    const completed = run({
      ...active(),
      phase: 'objective',
      actual_task_result_supplied: true,
      task_accomplished: true,
    }).state;
    const exited = run({ ...completed, phase: 'exit', actual_dungeon_exit: true }).state;
    const repeat = run({
      ...base,
      instance_id: 'occurrence.two',
      actual_instance_id: 'occurrence.two',
    });
    expect(repeat.state.quest_stage).toBe('active');
    expect(exited.instance_id).toBe('occurrence.one');
    expect(exited.instance_exit_processed).toBe(true);
  });
});
describe('Reading and actual Threat/finding ownership — PDF222', () => {
  it.each([
    [false, false],
    [true, false],
    [true, true],
    [false, true],
  ])('reading permissions preserve reached%s/complete%s', (quest_room_reached, quest_complete) => {
    expect(read({ ...readBase, quest_room_reached, quest_complete }).state).toMatchObject({
      quest_room_text_readable: quest_room_reached,
      aftermath_readable: quest_complete,
    });
  });
  it('afterwards findings have distinct off-table no-trap/no-lock handoff without resource credit', () => {
    const first = read({
      ...readBase,
      phase: 'aftermath',
      quest_complete: true,
      found_in_aftermath: true,
      aftermath_finding_owner_matches: true,
    });
    expect(first.state).toMatchObject({
      off_table_looting: true,
      check_traps: false,
      check_locks: false,
      coins: 81,
      aftermath_finding_processed: true,
    });
    expect(first.events).toHaveLength(1);
    expect(read(first.state).events).toEqual([]);
    expect(read({ ...first.state, aftermath_finding_processed: false }).events).toHaveLength(1);
  });
  it.each([
    { quest_complete: false },
    { found_in_aftermath: false },
    { aftermath_finding_owner_matches: false },
    { quest_event_owner_matches: false },
  ] as State[])('unowned/incomplete finding%j cannot loot', (patch) => {
    expect(
      read({
        ...readBase,
        phase: 'aftermath',
        quest_complete: true,
        found_in_aftermath: true,
        aftermath_finding_owner_matches: true,
        ...patch,
      }).events,
    ).toEqual([]);
  });
  it('upward threshold12 triggers, downward12 does not, and falling below allows later upward12', () => {
    let state = { ...readBase, phase: 'threshold', actual_threat_change_supplied: true };
    for (const [i, previous_threat, current_threat, triggered] of [
      [1, 11, 12, true],
      [2, 15, 12, false],
      [3, 12, 11, false],
      [4, 11, 12, true],
    ] as const) {
      const result = read({ ...state, actual_threat_event: i, previous_threat, current_threat });
      expect(result.state.wandering_monster_triggered).toBe(triggered);
      expect(result.events).toHaveLength(triggered ? 1 : 0);
      expect(result.state.current_threat).toBe(current_threat);
      if (triggered) expect(result.state.threat_reduction_on_placement).toBe(0);
      expect(read({ ...result.state, previous_threat: 1, current_threat: 12 }).events).toEqual([]);
      state = result.state as typeof state;
    }
  });
  it.each([
    { actual_threat_change_supplied: false },
    { quest_event_owner_matches: false },
  ] as State[])('missing/unowned Threat%j does not consume', (patch) => {
    expect(
      read({
        ...readBase,
        phase: 'threshold',
        actual_threat_change_supplied: true,
        previous_threat: 11,
        current_threat: 12,
        ...patch,
      }).state.last_threat_event,
    ).toBe(0);
  });
  it('the structural machine has resumable abandonment, legal task exit and no repeat/reset transition', () => {
    const machine = corpus.stateMachines.find((x) => x.id === 'state_machine.quest_dungeon')!;
    expect(machine.states.find((x) => x.id === 'abandoned')!.transitions!.map((x) => x.to)).toEqual(
      ['active'],
    );
    expect(machine.states.find((x) => x.id === 'active')!.transitions!.map((x) => x.to)).toEqual([
      'abandoned',
      'accomplished',
    ]);
    expect(machine.states.find((x) => x.id === 'exited')!.terminal).toBe(true);
    expect(machine.states.find((x) => x.id === 'exited')!.transitions).toBeUndefined();
    expect(machine.states.flatMap((x) => x.transitions ?? []).every((x) => x.source?.length)).toBe(
      true,
    );
  });
});
