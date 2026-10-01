import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((x) => x.procedure_id === 'procedure.rest')!;
const run = (procedure_id: string, inputs: State) =>
  runCase({ ...fixture, procedure_id, inputs }, corpus);
const spawn = (inputs: State) => run('procedure.closing_portal_single_spawn', inputs);
const after = (inputs: State) => run('procedure.closing_portal_aftermath', inputs);
const owner: State = {
  instance_quest_id: 'quest.chamber_of_reverence.closing_portal',
  portal_owner_matches: true,
  coins: 700,
  instance_completed: false,
};
const event: State = {
  ...owner,
  portal_open: true,
  spawn_turn_supplied: true,
  spawn_schedule_context_resolved: true,
  spawn_pending: false,
  spawn_type_request_processed: false,
  actual_spawn_turn: 2,
  last_spawn_turn: 0,
  pending_spawn_turn: 0,
  spawn_type_supplied: true,
  actual_spawn_type_roll: 1,
  group_quantity_roll: 6,
};
const outcome: State = {
  ...owner,
  phase: 'loot',
  portal_closed: true,
  all_demons_dead: true,
  heroes_back_outside: false,
  portal_loot_processed: false,
  portal_treasure_request_processed: false,
  portal_reward_processed: false,
  portal_reward_owner_matches: true,
};
describe('Closing the Portal actual single spawn — PDF257', () => {
  it.each([1, 2, 3, 4, 5, 6])(
    'type %i creates only one demon ignoring quantity',
    (actual_spawn_type_roll) => {
      const first = spawn({ ...event, actual_spawn_type_roll });
      expect(first.state).toMatchObject({
        demons_spawned: 1,
        demon_type_table_rolls: 1,
        demon_type:
          actual_spawn_type_roll <= 4
            ? 'Lesser Plague Demons'
            : actual_spawn_type_roll === 5
              ? 'Blood Demons'
              : 'Plague Demons',
        demon_armour: 0,
        spawn_pending: false,
        last_spawn_turn: 2,
        coins: 700,
        group_quantity_roll: 6,
      });
      expect(first.state.demon_count).toBeUndefined();
      expect(first.trace).toEqual([
        'procedure.closing_portal_single_spawn',
        'core.quest.closing_portal.single_demon_spawn',
        `core.quest.closing_portal.demon_type_${actual_spawn_type_roll <= 4 ? 1 : actual_spawn_type_roll - 3}`,
      ]);
      expect(spawn({ ...first.state, actual_spawn_type_roll: 6 }).trace).toEqual([
        'procedure.closing_portal_single_spawn',
      ]);
    },
  );
  it.each([
    { portal_open: false },
    { spawn_turn_supplied: false },
    { spawn_schedule_context_resolved: false },
    { portal_owner_matches: false },
    { instance_quest_id: 'quest.chamber_of_reverence.slaying_fiend' },
    { actual_spawn_turn: 2, last_spawn_turn: 2 },
    { actual_spawn_turn: 1, last_spawn_turn: 2 },
  ] as State[])('unconfirmed/old/closed event %j cannot spawn', (patch) => {
    expect(spawn({ ...event, ...patch }).state.demons_spawned).toBeUndefined();
  });
  it('missing type preserves one pending event and cannot create a later event', () => {
    const first = spawn({ ...event, spawn_type_supplied: false });
    expect(first.state).toMatchObject({
      spawn_pending: true,
      spawn_type_request_processed: true,
      demons_spawned: 1,
      last_spawn_turn: 2,
    });
    const later = spawn({ ...first.state, actual_spawn_turn: 4, actual_spawn_type_roll: 6 });
    expect(later.trace).toEqual(['procedure.closing_portal_single_spawn']);
    expect(later.state).toMatchObject({
      pending_spawn_turn: 2,
      last_spawn_turn: 2,
      spawn_pending: true,
    });
    expect(later.state.demon_type).toBeUndefined();
  });
  it('already-emerged pending demon resolves type after closure without new spawn', () => {
    const first = spawn({ ...event, spawn_type_supplied: false });
    const resolved = spawn({
      ...first.state,
      portal_open: false,
      spawn_type_supplied: true,
      actual_spawn_type_roll: 5,
    });
    expect(resolved.state).toMatchObject({
      demon_type: 'Blood Demons',
      spawn_pending: false,
      last_spawn_turn: 2,
    });
    expect(resolved.trace).toEqual([
      'procedure.closing_portal_single_spawn',
      'core.quest.closing_portal.demon_type_2',
    ]);
  });
  it('actual later supplied spawn event is independent without inferred modulo phase', () => {
    const first = spawn(event);
    const next = spawn({ ...first.state, actual_spawn_turn: 7, actual_spawn_type_roll: 6 });
    expect(next.state).toMatchObject({
      demons_spawned: 1,
      demon_type: 'Plague Demons',
      last_spawn_turn: 7,
    });
    expect(next.trace[1]).toBe('core.quest.closing_portal.single_demon_spawn');
  });
});
describe('Closing the Portal defeat treasure and outside hero payment — PDF257–258', () => {
  it('actual final demon after closure unlocks two chests once without collecting', () => {
    const first = after(outcome);
    expect(first.state).toMatchObject({
      objective_chests: 2,
      chests_locked: false,
      chests_trapped: false,
      treasure_tables_required: true,
      portal_loot_processed: true,
      portal_treasure_request_processed: true,
      coins: 700,
      instance_completed: false,
    });
    expect(first.trace).toEqual([
      'procedure.closing_portal_aftermath',
      'core.quest.closing_portal.objective_loot',
    ]);
    expect(first.state.reward_per_hero).toBeUndefined();
    expect(after(first.state).trace).toEqual(['procedure.closing_portal_aftermath']);
  });
  it.each([
    { portal_closed: false },
    { all_demons_dead: false },
    { portal_owner_matches: false },
    { instance_quest_id: 'quest.chamber_of_reverence.slaying_fiend' },
  ] as State[])('unsuccessful/wrong outcome %j cannot reveal or pay', (patch) => {
    const first = after({ ...outcome, ...patch });
    expect(first.state.objective_chests).toBeUndefined();
    expect(
      after({ ...outcome, phase: 'reward', heroes_back_outside: true, ...patch }).state.coins,
    ).toBe(700);
  });
  it('300c credits once to actual hero outside and preserves treasure scope', () => {
    const first = after({ ...outcome, phase: 'reward', heroes_back_outside: true });
    expect(first.state).toMatchObject({
      reward_per_hero: 300,
      coins: 1000,
      portal_reward_processed: true,
      portal_loot_processed: false,
      instance_completed: false,
    });
    expect(first.trace).toEqual([
      'procedure.closing_portal_aftermath',
      'core.quest.closing_portal.reward',
    ]);
    expect(after(first.state).state.coins).toBe(1000);
  });
  it.each([
    { heroes_back_outside: false },
    { portal_reward_owner_matches: false },
    { portal_reward_processed: true },
  ] as State[])('missing outside/hero/unpaid context %j cannot duplicate credit', (patch) => {
    expect(
      after({ ...outcome, phase: 'reward', heroes_back_outside: true, ...patch }).state.coins,
    ).toBe(700);
  });
  it('party chest marker and two actual hero payments remain independently owned', () => {
    const loot = after(outcome).state;
    const heroA = after({ ...loot, phase: 'reward', heroes_back_outside: true }).state;
    const heroB = after({ ...loot, phase: 'reward', heroes_back_outside: true, coins: 20 }).state;
    expect(heroA.coins).toBe(1000);
    expect(heroB.coins).toBe(320);
    expect(heroA.portal_loot_processed).toBe(true);
    expect(heroB.portal_loot_processed).toBe(true);
    expect(after({ ...heroA, phase: 'loot' }).trace).toEqual([
      'procedure.closing_portal_aftermath',
    ]);
  });
  it('actual reading closure feeds distinct death, treasure and outside payment gates', () => {
    let state: State = {
      ...owner,
      phase: 'start',
      portal_open: true,
      portal_reader_owner_matches: true,
      portal_attempt_started: false,
      hero_in_objective_room: true,
      ritual_eligibility_supplied: true,
      reader_stationary: true,
      duration_supplied: true,
      duration_die: 1,
      reading_active: false,
      reading_progress_turns: 0,
      restart_required: false,
      last_reading_turn: 0,
      last_restart_event: 0,
      reader_wounded: false,
      reader_dodged: false,
      reader_parried: false,
      interrupted_other_way: false,
    };
    state = run('procedure.closing_portal_reading_attempt', state).state;
    for (const actual_reading_turn of [1, 2])
      state = run('procedure.closing_portal_reading_attempt', {
        ...state,
        phase: 'reading_turn',
        actual_reading_turn,
        completed_reading_turn: true,
        reading_turn_context_resolved: true,
      }).state;
    expect(state.portal_closed).toBe(true);
    expect(
      spawn({ ...event, portal_open: state.portal_open === true }).state.demons_spawned,
    ).toBeUndefined();
    expect(
      after({ ...outcome, portal_closed: state.portal_closed === true, all_demons_dead: false })
        .state.objective_chests,
    ).toBeUndefined();
    const loot = after({ ...outcome, portal_closed: state.portal_closed === true });
    const paid = after({ ...loot.state, phase: 'reward', heroes_back_outside: true });
    expect(paid.state).toMatchObject({
      coins: 1000,
      objective_chests: 2,
      instance_completed: false,
    });
    expect([...loot.trace, ...paid.trace]).toEqual([
      'procedure.closing_portal_aftermath',
      'core.quest.closing_portal.objective_loot',
      'procedure.closing_portal_aftermath',
      'core.quest.closing_portal.reward',
    ]);
  });
});
