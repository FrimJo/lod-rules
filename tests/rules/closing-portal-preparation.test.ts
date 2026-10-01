import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((x) => x.procedure_id === 'procedure.rest')!;
const run = (procedure_id: string, inputs: State) =>
  runCase({ ...fixture, procedure_id, inputs }, corpus);
const prep = (inputs: State) => run('procedure.closing_portal_preparation', inputs);
const group = (inputs: State) => run('procedure.closing_portal_demon_group', inputs);
const owner: State = {
  instance_quest_id: 'quest.chamber_of_reverence.closing_portal',
  portal_owner_matches: true,
  coins: 700,
};
const setup: State = {
  ...owner,
  phase: 'setup',
  portal_setup_processed: false,
  portal_threat_initialized: false,
  portal_threat_request_processed: false,
  portal_threat_roll_supplied: true,
  portal_threat_roll: 1,
  objective_room_entered: false,
  portal_objective_processed: false,
  portal_group_one_requested: false,
  portal_group_two_requested: false,
  portal_placement_requested: false,
};
const initial: State = {
  ...owner,
  group_context: 'initial',
  initial_group_authorized: true,
  initial_group_index: 1,
  group_context_processed: false,
  demon_encounter: false,
  group_encounter: false,
  group_selection_processed: false,
  group_resolved: false,
  group_request_processed: false,
  demon_type_supplied: true,
  actual_demon_type_roll: 1,
  group_quantity_supplied: true,
  actual_group_quantity: 1,
};
describe('Closing the Portal preparation — PDF257', () => {
  it.each([1, 2, 3, 4, 5, 6])(
    'initial Threat %i once preserves subsequent changes',
    (portal_threat_roll) => {
      const first = prep({ ...setup, portal_threat_roll });
      expect(first.state).toMatchObject({
        location: 'Silver City',
        corridors: 8,
        rooms: 8,
        advertised_reward_per_hero: 300,
        ritual_scroll_supplied: true,
        threat: portal_threat_roll,
        portal_start_threat: portal_threat_roll,
        portal_minimum_threat: portal_threat_roll,
        portal_maximum_threat: 20,
        coins: 700,
      });
      expect(prep({ ...first.state, threat: 17, portal_threat_roll: 1 }).state.threat).toBe(17);
      expect(first.state.reward_per_hero).toBeUndefined();
    },
  );
  it('missing initial Threat only requests actual input', () => {
    const first = prep({ ...setup, portal_threat_roll_supplied: false });
    expect(first.state.threat).toBeUndefined();
    expect(first.state.portal_threat_request_processed).toBe(true);
    expect(prep(first.state).state.threat).toBeUndefined();
  });
  it('actual room entry records geometry and separately hands off two groups once', () => {
    const first = prep({ ...setup, phase: 'objective_room', objective_room_entered: true });
    expect(first.state).toMatchObject({
      initial_demon_table_rolls: 2,
      initial_demon_placement: 'randomly in the room',
      hero_entry: 'centred along the long side',
      portal_group_one_requested: true,
      portal_group_two_requested: true,
      portal_placement_requested: true,
    });
    expect(first.trace).toEqual([
      'procedure.closing_portal_preparation',
      'core.quest.closing_portal.objective_setup',
    ]);
    expect(first.state.demon_count).toBeUndefined();
    expect(prep(first.state).trace).toEqual(['procedure.closing_portal_preparation']);
  });
  it.each([
    { objective_room_entered: false },
    { portal_owner_matches: false },
    { instance_quest_id: 'quest.chamber_of_reverence.slaying_fiend' },
  ] as State[])('wrong entry/owner/quest cannot request groups %j', (patch) => {
    expect(
      prep({ ...setup, phase: 'objective_room', objective_room_entered: true, ...patch }).state
        .portal_group_one_requested,
    ).toBe(false);
  });
});
describe('Closing the Portal separately owned demon groups — PDF257', () => {
  const outcomes = [1, 2, 3, 4, 5, 6].flatMap((type) =>
    Array.from({ length: type <= 4 ? 6 : 3 }, (_, i) => ({ type, quantity: i + 1 })),
  );
  it.each(outcomes)(
    'actual type $type quantity $quantity retains printed group result',
    ({ type, quantity }) => {
      const first = group({
        ...initial,
        actual_demon_type_roll: type,
        actual_group_quantity: quantity,
      });
      const branch = type <= 4 ? 1 : type - 3;
      expect(first.state).toMatchObject({
        group_resolved: true,
        demon_count: quantity,
        demon_armour: 0,
        demon_type:
          type <= 4 ? 'Lesser Plague Demons' : type === 5 ? 'Blood Demons' : 'Plague Demons',
        demon_weapon: type <= 4 ? 'no weapon' : 'Cursed Weapons',
        coins: 700,
      });
      expect(first.trace).toEqual([
        'procedure.closing_portal_demon_group',
        `core.quest.closing_portal.demon_type_${branch}`,
        `core.quest.closing_portal.demon_group_${branch}`,
      ]);
      expect(
        group({ ...first.state, actual_demon_type_roll: 6, actual_group_quantity: 3 }).state,
      ).toMatchObject({ demon_count: quantity, demon_type_roll: type });
    },
  );
  it.each([1, 2])('initial group %i has independent actual selection', (initial_group_index) => {
    expect(
      group({
        ...initial,
        initial_group_index,
        actual_demon_type_roll: initial_group_index === 1 ? 1 : 6,
        actual_group_quantity: initial_group_index === 1 ? 6 : 3,
      }).state.demon_count,
    ).toBe(initial_group_index === 1 ? 6 : 3);
  });
  it('delayed quantity retains the already supplied type', () => {
    const first = group({ ...initial, actual_demon_type_roll: 5, group_quantity_supplied: false });
    expect(first.state).toMatchObject({
      group_selection_processed: true,
      demon_type_roll: 5,
      group_resolved: false,
    });
    const resumed = group({
      ...first.state,
      actual_demon_type_roll: 1,
      group_quantity_supplied: true,
      actual_group_quantity: 2,
    });
    expect(resumed.state).toMatchObject({
      demon_type: 'Blood Demons',
      demon_count: 2,
      demon_type_roll: 5,
      actual_demon_type_roll: 1,
    });
  });
  it.each([5, 6])('d3 type %i rejects d6-only quantity', (actual_demon_type_roll) => {
    const result = group({ ...initial, actual_demon_type_roll, actual_group_quantity: 6 });
    expect(result.state.group_resolved).toBe(false);
    expect(result.state.demon_count).toBeUndefined();
    expect(result.trace).toEqual(['procedure.closing_portal_demon_group']);
  });
  it.each([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])(
    'actual encounter %i requests one replacement group',
    (encounter_result) => {
      const result = group({ ...initial, group_context: 'replacement', encounter_result });
      expect(result.state).toMatchObject({
        demon_encounter: true,
        demon_table_rolls: 1,
        demon_count: 1,
      });
      expect(result.trace[1]).toBe('core.quest.closing_portal.encounter_replacement');
    },
  );
  it.each([1, 9, 11, 19, 21, 29, 31, 99])(
    'ordinary encounter %i is not replaced',
    (encounter_result) => {
      const result = group({ ...initial, group_context: 'replacement', encounter_result });
      expect(result.state.group_context_processed).toBe(false);
      expect(result.state.demon_count).toBeUndefined();
    },
  );
  it.each([
    { group_context: 'single_spawn' },
    { initial_group_authorized: false },
    { portal_owner_matches: false },
    { instance_quest_id: 'quest.chamber_of_reverence.slaying_fiend' },
  ] as State[])('incompatible group scope %j cannot fabricate actors', (patch) => {
    expect(group({ ...initial, ...patch }).state.group_resolved).toBe(false);
  });
  it('missing type is a handoff and cannot produce a count', () => {
    const result = group({ ...initial, demon_type_supplied: false });
    expect(result.state.group_request_processed).toBe(true);
    expect(result.state.demon_count).toBeUndefined();
  });
});
