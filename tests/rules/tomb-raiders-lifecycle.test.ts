import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((x) => x.procedure_id === 'procedure.rest')!;
const procedure = corpus.procedures.find((x) => x.id === 'procedure.tomb_raiders')!;
const defaults: State = Object.fromEntries(
  Object.entries(procedure.fields).map(([key, f]) => [
    key,
    f.type === 'boolean' ? false : f.type === 'number' ? (f.minimum ?? 0) : '',
  ]),
);
const base: State = {
  ...defaults,
  phase: 'setup',
  instance_quest_id: 'quest.great_crypt.tomb_raiders',
  raiders_owner_matches: true,
  raiders_tomb_owner_matches: true,
  raiders_threat_event_owner_matches: true,
  threat_die_supplied: true,
  threat_die: 1,
  objective_room_entered: true,
  complete_turn_spent: true,
  heroes_working_together: 2,
  heroes_in_objective_room: 1,
  actual_threat_roll_supplied: true,
  threat_roll: 10,
  coins: 55,
};
const run = (inputs: State) => runCase({ ...fixture, procedure_id: procedure.id, inputs }, corpus);
const room = () => run({ ...run(base).state, phase: 'objective_room' }).state;
const event = (patch: State = {}) => run({ ...room(), phase: 'threat', threat: 10, ...patch });
describe('Tomb Raiders actual occurrence/tomb/Threat-event checkpoints — PDF262', () => {
  it.each([1, 2, 3, 4, 5, 6])(
    'actual initial d6%i initializes source bounds once',
    (threat_die) => {
      const first = run({ ...base, threat_die });
      expect(first.state).toMatchObject({
        threat: threat_die,
        raiders_minimum_threat: threat_die,
        raiders_maximum_threat: 20,
        location: 'White 38',
        corridors: 7,
        rooms: 5,
        room_tiles: 'R1B-8B',
        encounters: 'Undead',
        keep_any_loot_found: true,
        coins: 55,
      });
      expect(run({ ...first.state, threat: 19 }).state.threat).toBe(19);
    },
  );
  it('missing initial result resumes once and does not guess', () => {
    const first = run({ ...base, threat_die_supplied: false });
    expect(first.state.raiders_initial_threat_processed).toBe(false);
    expect(first.events).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
    expect(run({ ...first.state, threat_die_supplied: true, threat_die: 5 }).state.threat).toBe(5);
  });
  it('entry preserves source hero positions once', () => {
    const first = room();
    expect(first.hero_position).toBe('where they stood when the door was opened');
    expect(
      run({ ...first, hero_position: 'moved', initial_room_movement: true }).state,
    ).toMatchObject({ hero_position: 'moved', initial_room_movement: true });
  });
  it.each([
    { raiders_owner_matches: false },
    { instance_quest_id: 'quest.great_crypt.family_heirloom' },
    { raiders_tomb_owner_matches: false },
    { raiders_room_processed: false },
    { heroes_working_together: 1 },
    { heroes_working_together: 3 },
    { complete_turn_spent: false },
  ] as State[])('unowned/incomplete opening %j cannot remove lid', (patch) => {
    expect(run({ ...room(), phase: 'open_tomb', ...patch }).state.raiders_tomb_opened).toBe(false);
  });
  it('one actual tomb opening requests standard treasure once, another tomb has independent state', () => {
    const first = run({ ...room(), phase: 'open_tomb' });
    expect(first.state).toMatchObject({
      lid_removed: true,
      standard_sarcophagus_findings_required: true,
      raiders_tomb_opened: true,
      coins: 55,
    });
    expect(first.events).toEqual([
      { type: 'invoke', dependency: 'character.treasure.furniture.sarcophagus' },
    ]);
    expect(first.trace).toEqual(['procedure.tomb_raiders', 'core.quest.tomb_raiders.open_tomb']);
    expect(run(first.state).events).toEqual([]);
    expect(run({ ...room(), phase: 'open_tomb' }).events).toHaveLength(1);
    expect(first.state.treasure_collected).toBeUndefined();
  });
  it.each([9, 10, 11, 19, 20])(
    'actual Threat%i compares pre-event10 and preserves undefined increase',
    (threat_roll) => {
      const first = event({ threat_roll });
      expect(first.state).toMatchObject({
        raiders_event_threat_before: 10,
        threat: 10,
        wandering_monster_required: threat_roll > 10,
        threat_increase_required: threat_roll > 10,
        coins: 55,
      });
      expect(first.events).toHaveLength(1);
      expect(run({ ...first.state, threat_roll: 20, threat: 19 }).events).toEqual([]);
      expect(
        run({ ...first.state, threat_roll: 20, threat: 19 }).state.raiders_event_threat_before,
      ).toBe(10);
    },
  );
  it('no hero in objective room requests ordinary Threat, not local exception', () => {
    const first = event({ heroes_in_objective_room: 0, threat_roll: 20 });
    expect(first.state.wandering_monster_required).toBe(false);
    expect(first.events).toEqual([{ type: 'invoke', dependency: 'procedure.threat_roll' }]);
    expect(first.state.threat).toBe(10);
  });
  it.each([
    { actual_threat_roll_supplied: false },
    { raiders_threat_event_owner_matches: false },
    { raiders_owner_matches: false },
    { raiders_initial_threat_processed: false },
  ] as State[])('incomplete/unowned Threat event%j cannot consume', (patch) => {
    const first = event(patch);
    expect(first.state.raiders_threat_processed).toBe(false);
    expect(first.events).toEqual([]);
  });
  it('fresh actual event may trigger again while replay cannot', () => {
    const first = event({ threat_roll: 11 });
    const second = event({ threat_roll: 12, threat: 11 });
    expect(first.events).toHaveLength(1);
    expect(second.events).toHaveLength(1);
    expect(second.state.raiders_event_threat_before).toBe(11);
  });
});
