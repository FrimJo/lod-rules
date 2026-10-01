import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const ruleFixture = corpus.testCases.find((e) => e.rule_ids && !e.procedure_id)!;
const run = (inputs: State, id = 'procedure.damage_follow_up') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const effect: State = {
  damage_type: 'stun',
  phase: 'initial',
  stun_effect_resolved: true,
  stun_effect_confirmed: true,
  stun_exposure_processed: false,
  action_points: 2,
};
const turn: State = {
  ...run(effect).state,
  next_turn_started: true,
  turn_ap_initialized: true,
  stun_scope_resolved: true,
};
const next = (inputs: State) => run(inputs, 'procedure.stun_next_turn');
describe('Stun / Frost affected-turn AP consumption — rendered PDF122 / 179', () => {
  it('confirmed effect schedules without changing current AP', () => {
    const r = run(effect);
    expect(r.state).toMatchObject({
      action_points: 2,
      stun: true,
      stun_next_turn_pending: true,
      next_turn_actions_lost: 1,
      stun_exposure_processed: true,
    });
  });
  it('false actual result schedules nothing and cannot be replaced on replay', () => {
    const first = run({ ...effect, stun_effect_confirmed: false });
    expect(first.state).toMatchObject({
      stun_next_turn_pending: false,
      next_turn_actions_lost: 0,
      stun_exposure_processed: true,
    });
    expect(run({ ...first.state, stun_effect_confirmed: true }).state.stun_next_turn_pending).toBe(
      false,
    );
  });
  it('unresolved effect does not consume its result', () => {
    const first = run({ ...effect, stun_effect_resolved: false });
    expect(first.state.stun_exposure_processed).toBe(false);
    expect(run({ ...first.state, stun_effect_resolved: true }).state.stun_next_turn_pending).toBe(
      true,
    );
  });
  it('replaying exposure after AP consumption does not recreate pending loss', () => {
    const applied = next(turn);
    expect(run({ ...applied.state, phase: 'initial' }).state.stun_next_turn_pending).toBe(false);
  });
  it.each([1, 2, 3, 4])('initialized allowance %i loses exactly one AP', (action_points) => {
    const r = next({ ...turn, action_points });
    expect(r.state).toMatchObject({
      action_points: action_points - 1,
      stun_turn_processed: true,
      stun_next_turn_pending: false,
      stun: false,
      next_turn_actions_lost: 0,
    });
    expect(r.steps).toContain('consume_ap');
  });
  it('replay with a substituted fresh allowance cannot subtract AP again', () => {
    const first = next(turn);
    const replay = next({ ...first.state, action_points: 3 });
    expect(replay.state.action_points).toBe(3);
    expect(replay.steps).not.toContain('consume_ap');
  });
  const rejected: State[] = [
    { next_turn_started: false },
    { turn_ap_initialized: false },
    { stun_next_turn_pending: false },
    { stun_turn_processed: true },
  ];
  it.each(rejected)('rejects an unavailable or consumed turn %j', (override) => {
    const r = next({ ...turn, ...override });
    expect(r.state.action_points).toBe(2);
    expect(r.steps).not.toContain('consume_ap');
  });
  it('zero initialized AP remains unresolved without clamp or marker consumption', () => {
    const r = next({ ...turn, action_points: 0 });
    expect(r.unresolved).toContain('issue.stun.ap_and_overlap');
    expect(r.state).toMatchObject({
      action_points: 0,
      stun_turn_processed: false,
      stun_next_turn_pending: true,
    });
  });
  it('unreconciled overlap preserves AP and pending loss', () => {
    const r = next({ ...turn, stun_scope_resolved: false });
    expect(r.unresolved).toContain('issue.stun.ap_and_overlap');
    expect(r.state).toMatchObject({
      action_points: 2,
      stun_turn_processed: false,
      stun_next_turn_pending: true,
    });
  });
  it('initialization later permits the same pending turn', () => {
    const waiting = next({ ...turn, turn_ap_initialized: false });
    expect(next({ ...waiting.state, turn_ap_initialized: true }).state.action_points).toBe(1);
  });
  it('distinct target state does not mutate another target', () => {
    const a = next({ ...turn, action_points: 3 });
    const b = next({ ...turn, action_points: 1 });
    expect(a.state.action_points).toBe(2);
    expect(b.state.action_points).toBe(0);
    expect(turn.action_points).toBe(2);
  });
  it('distinct later stun/affected turn starts fresh markers', () => {
    const first = next(turn);
    const later = run({
      ...first.state,
      phase: 'initial',
      stun_exposure_processed: false,
      stun_effect_confirmed: true,
    });
    expect(next({ ...later.state, action_points: 2 }).state.action_points).toBe(1);
  });
  it('Frost chance success composes parent handoff and actual AP loss once', () => {
    const frost = run({
      damage_type: 'frost',
      phase: 'initial',
      damage_resolved: true,
      elemental_hit_processed: false,
      frost_stun_result: true,
      action_points: 3,
    });
    const handoff = run({ ...frost.state, phase: 'next_turn' });
    expect(handoff.events).toEqual([{ type: 'invoke', dependency: 'procedure.stun_next_turn' }]);
    expect(handoff.state.action_points).toBe(3);
    const applied = next({
      ...handoff.state,
      next_turn_started: true,
      turn_ap_initialized: true,
      stun_scope_resolved: true,
    });
    expect(applied.state.action_points).toBe(2);
    expect(next(applied.state).state.action_points).toBe(2);
  });
  it('Frost chance failure cannot consume AP', () => {
    const frost = run({
      damage_type: 'frost',
      phase: 'initial',
      damage_resolved: true,
      elemental_hit_processed: false,
      frost_stun_result: false,
      action_points: 2,
    });
    expect(
      next({
        ...frost.state,
        next_turn_started: true,
        turn_ap_initialized: true,
        stun_scope_resolved: true,
      }).state.action_points,
    ).toBe(2);
  });
  it('weapon-specific duplicate effects preserve one next-turn loss in composition', () => {
    const first = runCase(
      {
        ...ruleFixture,
        rule_ids: ['combat.weapon.special.stun'],
        inputs: { damage_roll: 4, actions_lost_next_turn: 0 },
      },
      corpus,
    );
    const second = runCase(
      {
        ...ruleFixture,
        rule_ids: ['combat.weapon.special.stun'],
        inputs: { ...first.state, damage_roll: 6 },
      },
      corpus,
    );
    expect(second.state.actions_lost_next_turn).toBe(1);
    expect(second.trace).toContain('combat.weapon.special.stun');
    const scheduled = run({
      ...effect,
      stun_effect_confirmed: second.state.actions_lost_next_turn === 1,
    });
    expect(
      next({
        ...scheduled.state,
        next_turn_started: true,
        turn_ap_initialized: true,
        stun_scope_resolved: true,
      }).state.action_points,
    ).toBe(1);
  });
  it('odd weapon roll does not establish a stun effect', () => {
    const r = runCase(
      {
        ...ruleFixture,
        rule_ids: ['combat.weapon.special.stun'],
        inputs: { damage_roll: 5, actions_lost_next_turn: 0 },
      },
      corpus,
    );
    expect(r.trace).toEqual([]);
    expect(
      run({ ...effect, stun_effect_confirmed: r.state.actions_lost_next_turn === 1 }).state
        .stun_next_turn_pending,
    ).toBe(false);
  });
});
