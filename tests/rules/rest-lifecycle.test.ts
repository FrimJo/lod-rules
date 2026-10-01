import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const run = (changes: State = {}) =>
  runCase(
    {
      ...fixture,
      inputs: {
        wandering_monster_spots_party: false,
        rests_taken: 1,
        threat_level: 5,
        ambush_roll: 100,
        barred_door: false,
        party_rations: 4,
        party_morale: 3,
        starting_morale: 6,
        all_heroes_on_same_tile: true,
        enemies_on_rest_tile: false,
        enemies_on_adjacent_tiles: false,
        rest_attempt_processed: false,
        ...changes,
      },
    },
    corpus,
  );

describe('rest interruption checkpoint — rendered PDF100', () => {
  it.each([false, true])('keeps food and gear changes when interrupted, barred=%s', (barred) => {
    const result = run({
      wandering_monster_spots_party: true,
      barred_door: barred,
      ambush_roll: 1,
    });
    expect(result.state).toMatchObject({
      party_rations: 3,
      party_morale: 3,
      rest_completed: false,
    });
    expect(result.state.ambush_risk).toBeUndefined();
    expect(result.state.enemy_bonus_tokens).toBeUndefined();
    expect(result.steps).toEqual([
      'check_eligibility',
      'accept_attempt',
      'arrange',
      'bar_door',
      'deduct_ration',
      'rearrange_gear',
      'move_monsters',
      'interrupted',
    ]);
    expect(result.events).toEqual([
      { type: 'invoke', dependency: 'procedure.wandering_monster' },
      { type: 'invoke', dependency: 'state_machine.battle' },
    ]);
    expect(result.trace).toEqual(['procedure.rest']);
  });

  it('does not reuse a previous completed marker after a new interruption', () => {
    const result = run({ rest_completed: true, wandering_monster_spots_party: true });
    expect(result.state.rest_completed).toBe(false);
    expect(result.state.party_morale).toBe(3);
    expect(result.steps).not.toContain('increase_hp');
  });

  it('runs the later checklist once when not interrupted', () => {
    const result = run();
    expect(result.state).toMatchObject({ rest_completed: true, party_rations: 3, party_morale: 5 });
    expect(result.steps.filter((step) => step === 'deduct_ration')).toHaveLength(1);
    expect(result.steps.filter((step) => step === 'increase_morale')).toHaveLength(1);
    expect(result.steps).toContain('regain_mana');
    expect(result.events).not.toContainEqual({
      type: 'invoke',
      dependency: 'state_machine.battle',
    });
  });

  it.each([false, true])('preserves recovery before a later ambush, barred=%s', (barred) => {
    const result = run({ ambush_roll: 1, barred_door: barred });
    expect(result.state).toMatchObject({
      rest_completed: true,
      party_rations: 3,
      party_morale: 5,
      enemy_bonus_tokens: barred ? 0 : 3,
    });
    expect(result.steps.indexOf('increase_morale')).toBeLessThan(result.steps.indexOf('ambushed'));
    expect(result.events).toContainEqual({ type: 'invoke', dependency: 'procedure.initiative' });
    expect(result.trace).toEqual(['procedure.rest']);
  });
});

const rejectedEntries: State[] = [
  { all_heroes_on_same_tile: false },
  { enemies_on_rest_tile: true },
  { enemies_on_adjacent_tiles: true },
  { party_rations: 0 },
];

describe('rest entry and attempt ownership — rendered PDF100', () => {
  it.each(rejectedEntries)(
    'rejects source-ineligible rest %j without charging or invoking',
    (changes) => {
      const result = run(changes);
      expect(result.state.party_rations).toBe(changes.party_rations ?? 4);
      expect(result.state.party_morale).toBe(3);
      expect(result.state.rest_attempt_processed).toBe(false);
      expect(result.state.rest_execution_allowed).toBe(false);
      expect(result.steps).toEqual(['check_eligibility']);
      expect(result.events).toEqual([]);
      expect(result.trace).toEqual(['procedure.rest']);
    },
  );

  it.each([false, true])(
    'does not charge or repeat handoffs for a processed attempt, interrupted=%s',
    (interrupted) => {
      const first = run({ wandering_monster_spots_party: interrupted });
      const replay = run(first.state);
      expect(replay.state.party_rations).toBe(first.state.party_rations);
      expect(replay.state.party_morale).toBe(first.state.party_morale);
      expect(replay.state.rest_completed).toBe(first.state.rest_completed);
      expect(replay.state.rest_execution_allowed).toBe(false);
      expect(replay.steps).toEqual(['check_eligibility']);
      expect(replay.events).toEqual([]);
    },
  );

  it('permits a distinct later rest and charges one ration with its higher supplied count', () => {
    const first = run();
    const second = run({ ...first.state, rest_attempt_processed: false, rests_taken: 2 });
    expect(second.state).toMatchObject({ party_rations: 2, party_morale: 6, ambush_risk: 20 });
    expect(second.steps.filter((step) => step === 'deduct_ration')).toHaveLength(1);
    expect(
      second.events.filter(
        (event) => event.type === 'invoke' && event.dependency === 'procedure.wandering_monster',
      ),
    ).toHaveLength(1);
  });

  it.each([
    [3, 5],
    [5, 6],
    [6, 6],
  ])('caps starting morale six: %i becomes %i', (morale, expected) => {
    expect(run({ party_morale: morale }).state.party_morale).toBe(expected);
  });

  it('allows the final ration but protects that successful attempt from replay', () => {
    const first = run({ party_rations: 1 });
    expect(first.state.party_rations).toBe(0);
    expect(first.state.rest_completed).toBe(true);
    expect(run(first.state).state.party_rations).toBe(0);
  });
});
