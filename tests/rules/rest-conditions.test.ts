import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const bleedingId = 'procedure.rest_bleeding_check';
const poisonId = 'procedure.rest_poison_checks';
const run = (id: string, inputs: State) =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const bleeding: State = {
  rest_attempt_started: true,
  rest_completed: true,
  untreated_bleeding_out: true,
  bleeding_rest_processed: false,
  constitution: 40,
  roll: 50,
  bleeding_hp_die: 3,
  hit_points: 0,
  maximum_hp: 8,
  dead: false,
};
const poison: State = {
  rest_attempt_started: true,
  rest_completed: true,
  poisoned: true,
  poison_rest_processed: false,
  remaining_poison_rolls: 3,
};

describe('Rest condition passage — rendered PDF100', () => {
  it.each([1, 2, 3, 4])(
    'CON+10 success at the boundary recovers the printed d4 result %i',
    (die) => {
      const result = run(bleedingId, { ...bleeding, bleeding_hp_die: die });
      expect(result.state).toMatchObject({ effective_value: 50, hit_points: die, dead: false });
      expect(result.trace).toEqual([bleedingId, 'core.check.success']);
      expect(result.unresolved).toEqual([]);
    },
  );

  it('fails one above CON+10 and sets death without recovery', () => {
    const result = run(bleedingId, { ...bleeding, roll: 51 });
    expect(result.state).toMatchObject({ outcome: 'failure', dead: true, hit_points: 0 });
    expect(result.trace).toEqual([bleedingId, 'core.check.standard']);
    expect(result.steps).not.toContain('successful_recovery');
  });

  it('preserves automatic failure even when modified CON exceeds the roll', () => {
    const result = run(bleedingId, { ...bleeding, constitution: 95, roll: 91 });
    expect(result.state.dead).toBe(true);
    expect(result.trace).toEqual([bleedingId, 'core.check.automatic_failure']);
  });

  it('does not let ordinary HP bonuses change the bleeding d4', () => {
    const result = run(bleedingId, { ...bleeding, recovery_bonus: 10 });
    expect(result.state.hit_points).toBe(3);
    expect(result.state.recovery_bonus).toBe(10);
  });

  it.each([50, 51])('does not reroll a processed bleeding check with original roll %i', (roll) => {
    const first = run(bleedingId, { ...bleeding, roll });
    const replay = run(bleedingId, { ...first.state, roll: 1, bleeding_hp_die: 4 });
    expect(replay.state.hit_points).toBe(first.state.hit_points);
    expect(replay.state.dead).toBe(first.state.dead);
    expect(replay.steps).toEqual(['check_timing']);
    expect(replay.trace).toEqual([bleedingId]);
  });

  it('reports HP overflow before mutation and accepts exact maximum without false overflow', () => {
    const overflow = run(bleedingId, { ...bleeding, hit_points: 7 });
    expect(overflow.state.hit_points).toBe(7);
    expect(overflow.unresolved).toEqual(['issue.phase4.recovery_bounds']);
    const exact = run(bleedingId, { ...bleeding, hit_points: 5 });
    expect(exact.state.hit_points).toBe(8);
    expect(exact.unresolved).toEqual([]);
  });

  it.each([0, 1, 4])('preserves all %i remaining Poison Tests as one explicit handoff', (count) => {
    const result = run(poisonId, { ...poison, remaining_poison_rolls: count });
    expect(result.state.poison_tests_due).toBe(count);
    expect(result.state.remaining_poison_rolls).toBe(count);
    expect(result.events).toEqual(
      count === 0 ? [] : [{ type: 'invoke', dependency: 'procedure.damage_follow_up' }],
    );
    expect(result.trace).toEqual([poisonId]);
    const replay = run(poisonId, result.state);
    expect(replay.events).toEqual([]);
    expect(replay.steps).toEqual(['check_timing']);
  });

  it.each([bleedingId, poisonId])('does not invent interrupted timing for %s', (id) => {
    const base = id === bleedingId ? bleeding : poison;
    const result = run(id, { ...base, rest_completed: false });
    expect(result.unresolved).toEqual(['issue.rest.condition_check_timing']);
    expect(result.events).toEqual([]);
    expect(result.steps).toEqual(['check_timing', 'interrupted_timing_unknown']);
    expect(result.state.condition_checks_allowed).toBe(false);
    expect(result.trace).toEqual([id]);
    if (id === bleedingId) expect(result.state).toMatchObject({ hit_points: 0, dead: false });
    else expect(result.state.poison_tests_due).toBeUndefined();
  });

  it.each([bleedingId, poisonId])(
    'does not apply condition checks after rejected entry: %s',
    (id) => {
      const result = run(id, {
        ...(id === bleedingId ? bleeding : poison),
        rest_attempt_started: false,
        rest_completed: false,
      });
      expect(result.steps).toEqual(['check_timing']);
      expect(result.unresolved).toEqual([]);
      expect(result.events).toEqual([]);
    },
  );

  it('does not raise a timing issue for heroes without these conditions', () => {
    expect(
      run(bleedingId, { ...bleeding, untreated_bleeding_out: false, rest_completed: false })
        .unresolved,
    ).toEqual([]);
    expect(run(poisonId, { ...poison, poisoned: false, rest_completed: false }).unresolved).toEqual(
      [],
    );
  });

  it('preserves parent food consumption while child interruption remains unresolved', () => {
    const party = run('procedure.rest', { ...fixture.inputs, wandering_monster_spots_party: true });
    const started = party.state.rest_attempt_processed;
    const completed = party.state.rest_completed;
    if (typeof started !== 'boolean' || typeof completed !== 'boolean')
      throw new Error('Missing Rest checkpoints');
    const child = run(bleedingId, {
      ...bleeding,
      rest_attempt_started: started,
      rest_completed: completed,
    });
    expect(party.state.party_rations).toBe(3);
    expect(party.state.party_morale).toBe(3);
    expect(child.state.hit_points).toBe(0);
    expect(child.unresolved).toEqual(['issue.rest.condition_check_timing']);
    expect([...party.trace, ...child.trace]).toEqual(['procedure.rest', bleedingId]);
  });
});
