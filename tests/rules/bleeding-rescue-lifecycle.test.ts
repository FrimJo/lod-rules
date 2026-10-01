import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.bleeding_out', inputs }, corpus);
const rescue: State = {
  phase: 'rescue',
  bleeding_out: true,
  dead: false,
  hit_points: 0,
  companion_healing_spell: false,
  own_ready_potion: false,
  adjacent_companion_ready_potion: false,
  battle_over: false,
  all_bleeding_out: false,
  rescue_result_supplied: false,
  healed_hp: 0,
  rescue_handoff_processed: false,
  bandage_handoff_processed: false,
};
const bandage: State = {
  ...rescue,
  phase: 'after_battle',
  battle_over: true,
  standing_companion: true,
  healer_knocked_out: false,
  means_to_help: true,
};
const handoffs = (result: ReturnType<typeof run>) =>
  result.events.filter((e) => e.type === 'invoke' && e.dependency !== 'procedure.hero_death');

describe('Bleeding rescue checkpoints — rendered PDF122', () => {
  it.each(['companion_healing_spell', 'own_ready_potion', 'adjacent_companion_ready_potion'])(
    'accepts printed means %s without creating healing from a handoff',
    (means) => {
      const result = run({ ...rescue, [means]: true });
      expect(result.state).toMatchObject({
        rescue_allowed: true,
        hit_points: 0,
        bleeding_out: true,
      });
      expect(handoffs(result)).toEqual([
        { type: 'invoke', dependency: 'Resolved healing spell or potion from ready slot' },
      ]);
      expect(result.trace).toEqual(['procedure.bleeding_out', 'character.hit_points.rescue']);
    },
  );
  it('records one handoff per attempt and permits a distinct later attempt', () => {
    const first = run({ ...rescue, own_ready_potion: true });
    expect(handoffs(run(first.state))).toEqual([]);
    expect(handoffs(run({ ...first.state, rescue_handoff_processed: false }))).toHaveLength(1);
  });
  it('accepts a positive supplied result after an earlier handoff', () => {
    const first = run({ ...rescue, own_ready_potion: true });
    const result = run({ ...first.state, rescue_result_supplied: true, healed_hp: 4 });
    expect(handoffs(result)).toEqual([]);
    expect(result.state).toMatchObject({
      hit_points: 4,
      bleeding_out: false,
      knocked_down: false,
      can_act: true,
    });
    const replay = run({ ...result.state, healed_hp: 7 });
    expect(replay.state.hit_points).toBe(4);
    expect(replay.steps).not.toContain('healed');
  });
  it.each([0, -1])('a supplied result %i does not wake the hero', (hp) => {
    const result = run({
      ...rescue,
      own_ready_potion: true,
      rescue_result_supplied: true,
      healed_hp: hp,
    });
    expect(result.state).toMatchObject({ hit_points: 0, bleeding_out: true });
    expect(result.steps).not.toContain('healed');
  });
  const invalid: State[] = [
    { dead: true },
    { bleeding_out: false },
    { battle_over: true },
    { all_bleeding_out: true },
  ];
  it.each(invalid)('rejects ineligible rescue %j and clears stale permissions', (override) => {
    const result = run({
      ...rescue,
      own_ready_potion: true,
      rescue_result_supplied: true,
      healed_hp: 4,
      rescue_allowed: true,
      bandage_allowed: true,
      ...override,
    });
    expect(result.state).toMatchObject({
      hit_points: 0,
      rescue_allowed: false,
      bandage_allowed: false,
    });
    expect(handoffs(result)).toEqual([]);
    expect(result.steps).not.toContain('healed');
  });
  it('absence of listed means rejects supplied healing', () => {
    const result = run({ ...rescue, rescue_result_supplied: true, healed_hp: 4 });
    expect(result.state.hit_points).toBe(0);
    expect(handoffs(result)).toEqual([]);
  });
  it('records bandaging once without inventing its HP effect', () => {
    const first = run(bandage);
    expect(first.state).toMatchObject({ bandage_allowed: true, hit_points: 0 });
    expect(handoffs(first)).toEqual([
      { type: 'invoke', dependency: 'Bandage effect from existing healing rules' },
    ]);
    expect(handoffs(run(first.state))).toEqual([]);
    expect(handoffs(run({ ...first.state, bandage_handoff_processed: false }))).toHaveLength(1);
  });
  const invalidBandage: State[] = [
    { healer_knocked_out: true },
    { standing_companion: false },
    { battle_over: false },
    { dead: true },
    { bleeding_out: false },
    { all_bleeding_out: true },
  ];
  it.each(invalidBandage)('rejects bandaging %j', (override) => {
    const result = run({ ...bandage, bandage_allowed: true, ...override });
    expect(result.state.bandage_allowed).toBe(false);
    expect(handoffs(result)).toEqual([]);
  });
});
