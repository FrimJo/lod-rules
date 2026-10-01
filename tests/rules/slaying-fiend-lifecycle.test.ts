import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.slaying_fiend', inputs }, corpus);
const occurrence: State = {
  phase: 'objective_room',
  fiend_threat_initialized: true,
  fiend_threat_request_processed: false,
  fiend_threat_roll_supplied: true,
  fiend_threat_roll: 2,
  instance_quest_id: 'quest.chamber_of_reverence.slaying_fiend',
  fiend_owner_matches: true,
  fiend_setup_processed: false,
  objective_room_entered: true,
  fiend_wound_selection_supplied: true,
  fiend_wound_selection_processed: false,
  fiend_prior_wounds_supplied: true,
  fiend_wounds_processed: false,
  fiend_wound_result_resolved: false,
  fiend_wound_request_processed: false,
  fiend_placement_supplied: true,
  fiend_placement_processed: false,
  fiend_placement_request_processed: false,
  molgor_defeated: false,
  fiend_aftermath_processed: false,
  fiend_treasure_request_processed: false,
  fiend_battle_ready: false,
  fiend_wound_table_roll: 1,
  fiend_actual_prior_wounds: 2,
  hero_placement_roll: 1,
  molgor_placement_roll: 6,
  coins: 700,
  instance_reward_collected: false,
  instance_completed: false,
};
describe('Slaying the Fiend ordered occurrence lifecycle — PDF256', () => {
  it.each([1, 2, 3, 4])(
    'initial Threat uses actual d4 %i once, minimum start and maximum20',
    (fiend_threat_roll) => {
      const first = run({
        ...occurrence,
        phase: 'setup',
        fiend_threat_initialized: false,
        fiend_threat_roll,
      });
      expect(first.state).toMatchObject({
        threat: fiend_threat_roll + 2,
        fiend_start_threat: fiend_threat_roll + 2,
        fiend_minimum_threat: fiend_threat_roll + 2,
        fiend_maximum_threat: 20,
      });
      expect(run({ ...first.state, threat: 12, fiend_threat_roll: 1 }).state.threat).toBe(12);
    },
  );
  it('missing initial Threat requests actual d4 and cannot ready battle', () => {
    const first = run({
      ...occurrence,
      phase: 'setup',
      fiend_threat_initialized: false,
      fiend_threat_roll_supplied: false,
    });
    expect(first.events).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
    expect(run({ ...first.state, phase: 'objective_room' }).state.fiend_battle_ready).toBe(false);
    expect(run({ ...first.state, fiend_threat_roll_supplied: true }).state.threat).toBe(4);
  });
  it('setup preserves source layout, advertised None and named abilities once', () => {
    const r = run({ ...occurrence, phase: 'setup' });
    expect(r.state).toMatchObject({
      location: 'Random',
      corridors: 8,
      rooms: 8,
      encounters: 'Beast',
      special_rules_printed: '-',
      reward_printed: 'None',
      weapon: 'Greataxe',
      armour: 2,
      frenzy: true,
      ferocious_charge: true,
      coins: 700,
    });
    expect(r.trace).toEqual([
      'procedure.slaying_fiend',
      'core.quest.slaying_fiend.setup',
      'core.quest.slaying_fiend.molgor',
    ]);
    expect(run({ ...r.state, rooms: 7 }).state.rooms).toBe(7);
  });
  it.each([
    [1, 2, 12],
    [2, 1, 10],
    [3, 2, 7],
    [4, 1, 4],
    [5, 1, 3],
    [6, 1, 1],
  ])(
    'selected branch %i initializes HP once for every legal result',
    (fiend_wound_table_roll, min, max) => {
      for (
        let fiend_actual_prior_wounds = min;
        fiend_actual_prior_wounds <= max;
        fiend_actual_prior_wounds++
      ) {
        const r = run({ ...occurrence, fiend_wound_table_roll, fiend_actual_prior_wounds });
        expect(r.state).toMatchObject({
          molgor_starting_hp: 45 - fiend_actual_prior_wounds,
          fiend_wounds_processed: true,
          fiend_placement_processed: true,
          fiend_battle_ready: true,
        });
        expect(r.trace).toEqual([
          'procedure.slaying_fiend',
          'core.quest.slaying_fiend.prior_wounds_' + fiend_wound_table_roll,
          'core.quest.slaying_fiend.placement',
        ]);
        expect(
          run({
            ...r.state,
            molgor_starting_hp: 10,
            fiend_wound_table_roll: 6,
            fiend_actual_prior_wounds: 1,
          }).state.molgor_starting_hp,
        ).toBe(10);
      }
    },
  );
  it('fixed row 6 needs no invented secondary die', () => {
    const input: State = {
      ...occurrence,
      fiend_wound_table_roll: 6,
      fiend_prior_wounds_supplied: false,
    };
    delete input.fiend_actual_prior_wounds;
    const r = run(input);
    expect(r.state.molgor_starting_hp).toBe(44);
    expect(r.state.fiend_prior_wounds_supplied).toBe(false);
    expect(r.state.fiend_wound_result_resolved).toBe(true);
    expect(r.events).toEqual([]);
  });
  it('missing secondary wounds preserves initial actual selection through later input', () => {
    const first = run({
      ...occurrence,
      fiend_wound_table_roll: 3,
      fiend_prior_wounds_supplied: false,
    });
    expect(first.state.fiend_selected_wound_roll).toBe(3);
    expect(first.state.fiend_battle_ready).toBe(false);
    expect(first.events).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
    const r = run({
      ...first.state,
      fiend_wound_table_roll: 6,
      fiend_prior_wounds_supplied: true,
      fiend_actual_prior_wounds: 7,
    });
    expect(r.state.molgor_starting_hp).toBe(38);
    expect(r.trace).toContain('core.quest.slaying_fiend.prior_wounds_3');
  });
  it.each([
    [1, 1],
    [3, 1],
    [4, 5],
    [5, 4],
    [6, 2],
  ])(
    'out-of-branch %i/%i cannot initialize HP or ready battle',
    (fiend_wound_table_roll, fiend_actual_prior_wounds) => {
      const r = run({ ...occurrence, fiend_wound_table_roll, fiend_actual_prior_wounds });
      expect(r.state.fiend_wounds_processed).toBe(false);
      expect(r.state.fiend_battle_ready).toBe(false);
      expect(r.unresolved).toContain('issue.quest.fiend_lifecycle_scope');
    },
  );
  it.each([1, 2, 3])(
    'hero placement %i and all Molgor d6 faces are preserved once',
    (hero_placement_roll) => {
      for (let molgor_placement_roll = 1; molgor_placement_roll <= 6; molgor_placement_roll++) {
        const r = run({ ...occurrence, hero_placement_roll, molgor_placement_roll });
        expect(r.state).toMatchObject({
          hero_distance_from_door: hero_placement_roll,
          molgor_distance_from_idol: molgor_placement_roll,
          hero_entry: 'short side',
          molgor_direction: 'toward the heroes',
        });
        expect(
          run({
            ...r.state,
            hero_placement_roll: 3,
            molgor_placement_roll: 6,
            hero_distance_from_door: 8,
          }).state.hero_distance_from_door,
        ).toBe(8);
      }
    },
  );
  it('missing placement handoff cannot report ready battle', () => {
    const first = run({ ...occurrence, fiend_placement_supplied: false });
    expect(first.state.fiend_battle_ready).toBe(false);
    expect(first.events).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
    expect(run({ ...first.state, fiend_placement_supplied: true }).state.fiend_battle_ready).toBe(
      true,
    );
  });
  it.each([
    { fiend_owner_matches: false },
    { instance_quest_id: 'quest.side.mushrooms' },
    { objective_room_entered: false },
  ] as State[])('wrong quest/owner/no room cannot apply objective mechanics %s', (change) => {
    const r = run({ ...occurrence, ...change });
    expect(r.state.fiend_wounds_processed).toBe(false);
    expect(r.state.fiend_placement_processed).toBe(false);
    expect(r.trace).toEqual(['procedure.slaying_fiend']);
  });
  it('unresolved battle readiness cannot unlock aftermath despite a supplied defeat flag', () => {
    expect(
      run({ ...occurrence, phase: 'aftermath', molgor_defeated: true }).state
        .fiend_aftermath_processed,
    ).toBe(false);
  });
  it('prepared living Molgor does not unlock loot', () => {
    const ready = run(occurrence);
    const r = run({ ...ready.state, phase: 'aftermath' });
    expect(r.state.fiend_aftermath_processed).toBe(false);
    expect(r.events).toEqual([]);
  });
  it('actual defeat unlocks two chests once without coins, contents or promised reward', () => {
    const ready = run(occurrence);
    const r = run({ ...ready.state, phase: 'aftermath', molgor_defeated: true });
    expect(r.state).toMatchObject({
      gold_pile_found: true,
      objective_chests: 2,
      chests_locked: false,
      chests_trapped: false,
      treasure_tables_required: true,
      fiend_aftermath_processed: true,
      fiend_treasure_request_processed: true,
      coins: 700,
      instance_reward_collected: false,
      instance_completed: false,
    });
    expect([...ready.trace, ...r.trace]).toEqual([
      'procedure.slaying_fiend',
      'core.quest.slaying_fiend.prior_wounds_1',
      'core.quest.slaying_fiend.placement',
      'procedure.slaying_fiend',
      'core.quest.slaying_fiend.aftermath',
    ]);
    expect(r.events).toHaveLength(1);
    expect(run({ ...r.state, objective_chests: 1 }).state.objective_chests).toBe(1);
    expect(run(r.state).events).toEqual([]);
  });
  it('another source-eligible actual occurrence has fresh independent preparation/loot markers', () => {
    const first = run({ ...run(occurrence).state, phase: 'aftermath', molgor_defeated: true });
    const second = run({ ...occurrence, fiend_wound_table_roll: 6, fiend_actual_prior_wounds: 1 });
    expect(first.state.fiend_aftermath_processed).toBe(true);
    expect(second.state).toMatchObject({
      molgor_starting_hp: 44,
      fiend_aftermath_processed: false,
      fiend_treasure_request_processed: false,
    });
  });
});
