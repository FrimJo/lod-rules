import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const hpId = 'procedure.rest_hp_recovery';
const energyId = 'procedure.rest_energy_point_recovery';
const manaId = 'procedure.rest_mana_recovery';
const run = (id: string, inputs: State) =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const hp: State = {
  rest_completed: true,
  standard_hp_recovery_applicable: true,
  untreated_bleeding_out: false,
  hp_recovery_processed: false,
  die: 3,
  hit_points: 5,
  maximum_hp: 12,
};
const energy: State = {
  rest_completed: true,
  standard_energy_recovery_applicable: true,
  point_is_lost: true,
  energy_point_processed: false,
  die: 3,
  energy: 1,
};
const mana: State = {
  rest_completed: true,
  mana_recovery_processed: false,
  mana: 1,
  mana_maximum: 4,
};

describe('hero-owned Rest recovery — rendered PDF100', () => {
  it.each([1, 3, 6])('applies the hero HP die %i once and traces the existing rule', (die) => {
    const result = run(hpId, { ...hp, die });
    expect(result.state.hit_points).toBe(5 + die);
    expect(result.state.hp_recovery_processed).toBe(true);
    expect(result.trace).toEqual([hpId, 'character.recovery.short_rest_hp']);
    expect(result.unresolved).toEqual([]);
    const replay = run(hpId, result.state);
    expect(replay.state.hit_points).toBe(5 + die);
    expect(replay.trace).toEqual([hpId]);
    expect(replay.steps).toEqual(['check_recovery']);
  });

  const refusedHp: State[] = [
    { rest_completed: false },
    { untreated_bleeding_out: true },
    { standard_hp_recovery_applicable: false },
  ];
  it.each(refusedHp)('does not apply ordinary HP recovery for %j', (change) => {
    const result = run(hpId, { ...hp, ...change });
    expect(result.state.hit_points).toBe(5);
    expect(result.state.hp_recovery_processed).toBe(false);
    expect(result.trace).toEqual([hpId]);
  });

  it('returns the existing overflow ambiguity before HP changes', () => {
    const result = run(hpId, { ...hp, hit_points: 10, die: 3 });
    expect(result.state.hit_points).toBe(10);
    expect(result.unresolved).toEqual(['issue.phase4.recovery_bounds']);
    expect(result.trace).toEqual([hpId, 'character.recovery.hp_overflow']);
    expect(result.state.hp_recovery_processed).toBe(true);
  });

  it('allows exact maximum HP without a false overflow after mutation', () => {
    const result = run(hpId, { ...hp, hit_points: 9, die: 3 });
    expect(result.state.hit_points).toBe(12);
    expect(result.unresolved).toEqual([]);
  });

  it.each([1, 2, 3, 4, 5, 6])(
    'resolves lost-point die %i and forbids rerolling the same point',
    (die) => {
      const result = run(energyId, { ...energy, die });
      expect(result.state.energy).toBe(die <= 3 ? 2 : 1);
      expect(result.state.energy_point_processed).toBe(true);
      expect(result.trace).toEqual(
        die <= 3 ? [energyId, 'character.recovery.short_rest_energy'] : [energyId],
      );
      const replay = run(energyId, { ...result.state, die: 1 });
      expect(replay.state.energy).toBe(result.state.energy);
      expect(replay.steps).toEqual(['check_recovery']);
    },
  );

  const refusedEnergy: State[] = [
    { rest_completed: false },
    { point_is_lost: false },
    { standard_energy_recovery_applicable: false },
  ];
  it.each(refusedEnergy)('preserves Energy for %j', (change) => {
    const result = run(energyId, { ...energy, ...change });
    expect(result.state.energy).toBe(1);
    expect(result.state.energy_point_processed).toBe(false);
    expect(result.trace).toEqual([energyId]);
  });

  it('restores one hero Mana once, including a zero maximum', () => {
    const restored = run(manaId, mana);
    expect(restored.state.mana).toBe(4);
    expect(restored.trace).toEqual([manaId, 'character.recovery.short_rest_mana']);
    const replay = run(manaId, { ...restored.state, mana: 2 });
    expect(replay.state.mana).toBe(2);
    expect(replay.trace).toEqual([manaId]);
    expect(run(manaId, { ...mana, mana: 0, mana_maximum: 0 }).state.mana).toBe(0);
  });

  it('does not recover Mana when interrupted', () => {
    const result = run(manaId, { ...mana, rest_completed: false });
    expect(result.state.mana).toBe(1);
    expect(result.state.mana_recovery_processed).toBe(false);
    expect(result.trace).toEqual([manaId]);
  });

  it('composes party accounting and distinct hero/point contexts in checklist order', () => {
    const party = run('procedure.rest', { ...fixture.inputs });
    expect(party.state).toMatchObject({ party_rations: 3, party_morale: 5, rest_completed: true });
    expect(party.events.slice(1, 4)).toEqual([
      { type: 'invoke', dependency: hpId },
      { type: 'invoke', dependency: energyId },
      { type: 'invoke', dependency: manaId },
    ]);
    // Handoffs alone do not execute children. Supply the completion checkpoint explicitly.
    expect(party.state.hit_points).toBeUndefined();
    const completed = party.state.rest_completed;
    if (typeof completed !== 'boolean') throw new Error('Missing completion checkpoint');
    const aHp = run(hpId, { ...hp, rest_completed: completed, hit_points: 3, die: 2 });
    const bHp = run(hpId, { ...hp, rest_completed: completed, hit_points: 5, die: 1 });
    const aPoint1 = run(energyId, { ...energy, rest_completed: completed, die: 1 });
    const carriedEnergy = aPoint1.state.energy;
    if (typeof carriedEnergy !== 'number') throw new Error('Missing hero Energy');
    const aPoint2 = run(energyId, {
      ...energy,
      rest_completed: completed,
      energy: carriedEnergy,
      die: 6,
    });
    const bPoint = run(energyId, { ...energy, rest_completed: completed, energy: 0, die: 3 });
    const aMana = run(manaId, { ...mana, rest_completed: completed });
    const bMana = run(manaId, { ...mana, rest_completed: completed, mana_maximum: 3 });
    expect([aHp.state.hit_points, aPoint2.state.energy, aMana.state.mana]).toEqual([5, 2, 4]);
    expect([bHp.state.hit_points, bPoint.state.energy, bMana.state.mana]).toEqual([6, 1, 3]);
    expect(party.state.party_rations).toBe(3);
    expect(party.state.party_morale).toBe(5);
    expect([
      ...party.trace,
      ...aHp.trace,
      ...bHp.trace,
      ...aPoint1.trace,
      ...aPoint2.trace,
      ...bPoint.trace,
      ...aMana.trace,
      ...bMana.trace,
    ]).toEqual([
      'procedure.rest',
      hpId,
      'character.recovery.short_rest_hp',
      hpId,
      'character.recovery.short_rest_hp',
      energyId,
      'character.recovery.short_rest_energy',
      energyId,
      energyId,
      'character.recovery.short_rest_energy',
      manaId,
      'character.recovery.short_rest_mana',
      manaId,
      'character.recovery.short_rest_mana',
    ]);
  });
});
