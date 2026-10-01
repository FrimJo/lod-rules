import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.sanity_recovery', inputs }, corpus);
const hero: State = {
  sanity_system_enabled: true,
  sanity_recovery_owner_matches: true,
  recovery_route: 'between_quests',
  recovery_completed: true,
  sanity_rest_recovery_processed: false,
  sanity_indulgence_processed: false,
  sanity_recovery_input_request_processed: false,
  recovery_rolls_supplied: true,
  sanity_rest_scope_resolved: true,
  sanity_indulgence_scope_resolved: true,
  sanity_capacity_scope_resolved: true,
  between_quests: true,
  nights: 1,
  die: 2,
  cost_die: 2,
  recovery_die: 3,
  sanity: 4,
  current_conditions: 0,
  coins: 1000,
  maximum_sanity: 8,
  hit_points: 23,
  energy: 1,
  mana: 14,
  days: 4,
  mental_attempt_used: false,
};
describe('Actual hero recovery events — rendered PDF55/147', () => {
  it.each([1, 2, 3])('between-quest recovery adds actual d3 %i with full trace', (die) => {
    const r = run({ ...hero, die });
    expect(r.state.sanity).toBe(4 + die);
    expect(r.trace).toEqual(['procedure.sanity_recovery', 'character.sanity.recovery']);
    expect(r.state).toMatchObject({
      sanity_rest_recovery_processed: true,
      coins: 1000,
      current_conditions: 0,
      hit_points: 23,
      energy: 1,
      mana: 14,
      days: 4,
      mental_attempt_used: false,
    });
    expect(run({ ...r.state, die: 3 }).state.sanity).toBe(4 + die);
    expect(run(r.state).trace).toEqual(['procedure.sanity_recovery']);
  });
  it.each([6, 7, 8])(
    'ordinary recovery clamps at printed 8 from %i and consumes completed event',
    (sanity) => {
      expect(run({ ...hero, sanity, die: 3 }).state).toMatchObject({
        sanity: 8,
        sanity_rest_recovery_processed: true,
      });
    },
  );
  it.each([1, 2, 5])(
    'at least one actual inn night qualifies, %i nights do not multiply gain',
    (nights) => {
      const r = run({ ...hero, recovery_route: 'inn', nights, between_quests: false });
      expect(r.state.sanity).toBe(6);
      expect(r.trace).toEqual(['procedure.sanity_recovery', 'character.sanity.inn_recovery']);
    },
  );
  it('zero inn nights do not recover', () => {
    expect(run({ ...hero, recovery_route: 'inn', nights: 0 }).state).toMatchObject({
      sanity: 4,
      sanity_rest_recovery_processed: false,
    });
  });
  it('switching routes for the same completed rest cannot double recover', () => {
    const first = run(hero);
    expect(run({ ...first.state, recovery_route: 'inn' }).state.sanity).toBe(6);
    const inn = run({ ...hero, recovery_route: 'inn' });
    expect(run({ ...inn.state, recovery_route: 'between_quests' }).state.sanity).toBe(6);
  });
  it('a distinct source-grounded recovery occasion permits a fresh result', () => {
    const first = run({ ...hero, die: 1 });
    expect(
      run({ ...first.state, sanity_rest_recovery_processed: false, die: 2 }).state.sanity,
    ).toBe(7);
  });
  it.each([
    { sanity_system_enabled: false },
    { sanity_recovery_owner_matches: false },
    { recovery_completed: false },
    { between_quests: false },
    { recovery_route: 'dungeon_rest' },
  ] as State[])('inapplicable/interrupted context applies no gain %s', (change) => {
    const r = run({ ...hero, ...change });
    expect(r.state).toMatchObject({
      sanity: 4,
      coins: 1000,
      sanity_rest_recovery_processed: false,
    });
    expect(r.trace).toEqual(['procedure.sanity_recovery']);
  });
  it('missing rolls request input once then use actual resumed result', () => {
    const first = run({ ...hero, recovery_rolls_supplied: false });
    expect(first.state.sanity).toBe(4);
    expect(first.events).toEqual([
      {
        type: 'invoke',
        dependency: 'Actual completed hero recovery occasion, eligible scope and supplied rolls',
      },
    ]);
    expect(run(first.state).events).toEqual([]);
    expect(run({ ...first.state, recovery_rolls_supplied: true }).state.sanity).toBe(6);
  });
  it('unknown rest overlap/repetition scope requests input without recovery', () => {
    const first = run({ ...hero, sanity_rest_scope_resolved: false });
    expect(first.state.sanity).toBe(4);
    expect(first.events).toHaveLength(1);
    expect(run({ ...first.state, sanity_rest_scope_resolved: true }).state.sanity).toBe(6);
  });
  it.each(['between_quests', 'inn', 'indulgence'])(
    'active-condition maximum conflict blocks %s resource changes',
    (recovery_route) => {
      const r = run({ ...hero, recovery_route, current_conditions: 2 });
      expect(r.state).toMatchObject({
        sanity: 4,
        coins: 1000,
        sanity_rest_recovery_processed: false,
        sanity_indulgence_processed: false,
      });
      expect(r.trace).toEqual(['procedure.sanity_recovery']);
      expect(r.unresolved).toContain('issue.phase4.sanity_maximum');
    },
  );
  it.each([{ sanity_capacity_scope_resolved: false }, { sanity: -1 }, { sanity: 9 }] as State[])(
    'invalid/modified capacity stays pending %s',
    (change) => {
      const r = run({ ...hero, ...change });
      expect(r.state.sanity).toBe(change.sanity ?? 4);
      expect(r.state.sanity_rest_recovery_processed).toBe(false);
    },
  );
  it.each([1, 2, 3])('actual paid result costs d3 %i times 100 exactly once', (cost_die) => {
    const r = run({ ...hero, recovery_route: 'indulgence', cost_die });
    expect(r.state).toMatchObject({
      sanity: 7,
      coins: 1000 - cost_die * 100,
      sanity_indulgence_processed: true,
      sanity_rest_recovery_processed: false,
    });
    expect(r.trace).toEqual(['procedure.sanity_recovery', 'character.sanity.indulgence']);
    expect(run({ ...r.state, cost_die: 3, recovery_die: 1 }).state).toMatchObject({
      sanity: 7,
      coins: 1000 - cost_die * 100,
    });
  });
  it.each([1, 2, 3, 4, 5, 6])(
    'actual paid d6 %i recovery preserves other hero state',
    (recovery_die) => {
      const r = run({ ...hero, recovery_route: 'indulgence', sanity: 1, recovery_die });
      expect(r.state).toMatchObject({
        sanity: 1 + recovery_die,
        coins: 800,
        current_conditions: 0,
        maximum_sanity: 8,
        hit_points: 23,
        days: 4,
        mental_attempt_used: false,
      });
    },
  );
  it('insufficient funds cannot partially recover or consume result', () => {
    const r = run({ ...hero, recovery_route: 'indulgence', coins: 199 });
    expect(r.state).toMatchObject({ sanity: 4, coins: 199, sanity_indulgence_processed: false });
    expect(r.trace).toEqual(['procedure.sanity_recovery']);
  });
  it('exact funds complete both numerical changes', () => {
    expect(run({ ...hero, recovery_route: 'indulgence', coins: 200 }).state).toMatchObject({
      sanity: 7,
      coins: 0,
      sanity_indulgence_processed: true,
    });
  });
  it('uncertain overflow charges nothing and invents no clamp', () => {
    const r = run({ ...hero, recovery_route: 'indulgence', sanity: 7 });
    expect(r.state).toMatchObject({ sanity: 7, coins: 1000, sanity_indulgence_processed: false });
    expect(r.unresolved).toContain('issue.sanity.recovery_scope');
  });
  it('unknown paid occasion scope requests actual input without charging', () => {
    const first = run({
      ...hero,
      recovery_route: 'indulgence',
      sanity_indulgence_scope_resolved: false,
    });
    expect(first.state).toMatchObject({ sanity: 4, coins: 1000 });
    expect(first.events).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
  });
  it('ordinary rest and a distinct actual paid indulgence compose once each', () => {
    const rest = run({ ...hero, die: 1 });
    const paid = run({ ...rest.state, recovery_route: 'indulgence', recovery_die: 2 });
    expect([...rest.trace, ...paid.trace]).toEqual([
      'procedure.sanity_recovery',
      'character.sanity.recovery',
      'procedure.sanity_recovery',
      'character.sanity.indulgence',
    ]);
    expect(paid.state).toMatchObject({
      sanity: 7,
      coins: 800,
      sanity_rest_recovery_processed: true,
      sanity_indulgence_processed: true,
    });
  });
});
