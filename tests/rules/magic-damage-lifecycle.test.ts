import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const ruleFixture = corpus.testCases.find((e) => e.rule_ids && !e.procedure_id)!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.damage_follow_up', inputs }, corpus);
const normal: State = {
  damage_type: 'magic',
  phase: 'initial',
  damage_resolved: true,
  magic_result_processed: false,
  magic_handoff_processed: false,
  magic_scope_resolved: true,
  magic_complication_applies: false,
  magic_complication_resolved: false,
  magic_checkpoint_complete: false,
  hit_points: 7,
  armour: 3,
  natural_armour: 2,
};
const special: State = { ...normal, magic_complication_applies: true };
describe('Magic Damage ordinary path / supplied complications — rendered PDF122', () => {
  it('ordinary resolved damage completes without extra HP mutation or handoff', () => {
    const result = run(normal);
    expect(result.state).toMatchObject({
      hit_points: 7,
      armour: 3,
      natural_armour: 2,
      magic_result_processed: true,
      magic_checkpoint_complete: true,
    });
    expect(result.events).toEqual([]);
    expect(result.steps).toContain('magic_normal');
  });
  it('ordinary replay cannot substitute an exceptional result', () => {
    const first = run(normal);
    const replay = run({ ...first.state, magic_complication_applies: true });
    expect(replay.events).toEqual([]);
    expect(replay.state.hit_points).toBe(7);
    expect(replay.steps).not.toContain('magic');
  });
  it('actual unresolved base damage does not consume its result', () => {
    const first = run({ ...normal, damage_resolved: false });
    expect(first.state.magic_result_processed).toBe(false);
    expect(first.state.magic_checkpoint_complete).toBe(false);
    expect(run({ ...first.state, damage_resolved: true }).state.magic_checkpoint_complete).toBe(
      true,
    );
  });
  it('unknown applicability remains unresolved without inventing damage or completion', () => {
    const result = run({ ...normal, magic_scope_resolved: false });
    expect(result.unresolved).toContain('issue.magic.creature_complications');
    expect(result.state).toMatchObject({
      hit_points: 7,
      magic_result_processed: false,
      magic_checkpoint_complete: false,
      magic_handoff_processed: false,
    });
    expect(result.events).toEqual([]);
  });
  it('later source-backed ordinary applicability resolves the same unprocessed event', () => {
    const first = run({ ...normal, magic_scope_resolved: false });
    expect(
      run({ ...first.state, magic_scope_resolved: true }).state.magic_checkpoint_complete,
    ).toBe(true);
  });
  it('applicable complication records one handoff without applying it', () => {
    const first = run(special);
    expect(first.events).toHaveLength(1);
    expect(first.state).toMatchObject({
      hit_points: 7,
      magic_result_processed: false,
      magic_handoff_processed: true,
      magic_checkpoint_complete: false,
    });
    expect(run(first.state).events).toEqual([]);
  });
  it('actual supplied completed complication is preserved without applying damage again', () => {
    const first = run(special);
    const completed = run({
      ...first.state,
      magic_complication_resolved: true,
      hit_points: 4,
      creature_effect_accounted: true,
    });
    expect(completed.state).toMatchObject({
      hit_points: 4,
      creature_effect_accounted: true,
      magic_result_processed: true,
      magic_checkpoint_complete: true,
    });
    expect(completed.events).toEqual([]);
    expect(completed.steps).toContain('magic_completed_complication');
    expect(run(completed.state).state.hit_points).toBe(4);
  });
  it('already completed complication does not request it again', () => {
    const result = run({ ...special, magic_complication_resolved: true, hit_points: 4 });
    expect(result.events).toEqual([]);
    expect(result.state.magic_checkpoint_complete).toBe(true);
  });
  it('a distinct event receives a fresh result and handoff context', () => {
    const first = run({ ...special, magic_complication_resolved: true });
    const later = run({
      ...first.state,
      magic_result_processed: false,
      magic_handoff_processed: false,
      magic_complication_resolved: false,
      magic_checkpoint_complete: false,
    });
    expect(later.events).toHaveLength(1);
    expect(later.state.magic_checkpoint_complete).toBe(false);
  });
  it('ordinary follow-up composes the existing HP-loss rule once with its applied trace', () => {
    const damage = runCase(
      {
        ...ruleFixture,
        rule_ids: ['character.hit_points.loss'],
        inputs: { hit_points: 10, damage_taken: 3 },
      },
      corpus,
    );
    expect(damage.trace).toEqual(['character.hit_points.loss']);
    const completed = run({ ...normal, ...damage.state });
    expect(completed.state.hit_points).toBe(7);
    expect(run(completed.state).state.hit_points).toBe(7);
    expect(completed.events).toEqual([]);
  });
  it('different targets keep separate completed state', () => {
    const a = run(normal);
    const b = run(special);
    expect(a.state.magic_result_processed).toBe(true);
    expect(b.state.magic_result_processed).toBe(false);
    expect(normal.magic_result_processed).toBe(false);
  });
  it.each(['next_turn', 'rest', 'after_battle'])(
    'does not repeat initial Magic on phase %s',
    (phase) => {
      const result = run({ ...special, phase });
      expect(result.events).toEqual([]);
      expect(result.state.magic_result_processed).toBe(false);
    },
  );
  it('retains undefined complication pointer without invented creature object', () => {
    const p = corpus.procedures.find((e) => e.id === 'procedure.damage_follow_up')!;
    const d = p.dependencies.find((e) => e.key === 'creature_specials')!;
    expect(d.object_id).toBeUndefined();
    expect(d.section_id).toBe('section.combat.different_kinds_of_damage.magic_damage');
    expect(p.issues).toContain('issue.magic.creature_complications');
    expect(p.source_text).not.toContain('multiplier');
  });
});
