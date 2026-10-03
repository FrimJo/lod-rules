import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const procedure = corpus.procedures.find((x) => x.id === 'procedure.open_portcullis')!;
const fixture = corpus.testCases.find((x) => x.procedure_id === 'procedure.rest')!;
const base: State = {
  ...Object.fromEntries(
    Object.entries(procedure.fields).map(([k, v]) => [
      k,
      v.type === 'boolean' ? false : v.type === 'number' ? (v.minimum ?? 0) : '',
    ]),
  ),
  party_id: 'party',
  dungeon_visit_id: 'visit',
  portcullis_id: 'gate',
  acting_party_id: 'party',
  acting_visit_id: 'visit',
  acting_portcullis_id: 'gate',
  actor_id: 'hero',
  action_id: 'lift-1',
  phase: 'attempt',
  actual_action: true,
  adjacent: true,
  action_points: 2,
  strength: 40,
  threat_level: 3,
  action_sequence: 1,
};
const run = (inputs: State) => runCase({ ...fixture, procedure_id: procedure.id, inputs }, corpus);
const resolve = (state: State, roll = 40) =>
  run({
    ...state,
    phase: 'resolve',
    result_supplied: true,
    result_actor_id: 'hero',
    result_action_id: 'lift-1',
    roll,
  });
describe('Portcullis source-owned paid attempt and STR result — PDF103', () => {
  it('spends one AP before the delayed check and opens on exact STR success', () => {
    const pending = run(base);
    expect(pending.state).toMatchObject({ action_points: 1, pending: true, open: false });
    expect(pending.events).toEqual([{ type: 'invoke', dependency: 'core.check.standard' }]);
    const result = resolve(pending.state);
    expect(result.state).toMatchObject({
      action_points: 1,
      pending: false,
      open: true,
      threat_level: 3,
    });
    expect(result.trace).toContain('core.check.success');
    expect(resolve(result.state, 90).state.threat_level).toBe(3);
  });
  it.each([
    [0, 0, 40],
    [1, 0, 50],
    [0, 1, 50],
    [1, 1, 60],
    [1, 2, 70],
  ])('uses actual positioned helpers %i/%i to snapshot target %i', (same, opposite, target) => {
    const pending = run({ ...base, same_side_helpers: same, opposite_side_helpers: opposite });
    expect(pending.state.pending_target).toBe(target);
    expect(
      resolve(
        { ...pending.state, strength: 1, same_side_helpers: 0, opposite_side_helpers: 0 },
        target,
      ).state.open,
    ).toBe(true);
  });
  it('failure adds Threat once and permits a distinct paid retry', () => {
    const failed = resolve(run(base).state, 41);
    expect(failed.state).toMatchObject({
      threat_level: 4,
      open: false,
      pending: false,
      action_points: 1,
    });
    expect(resolve(failed.state, 41).state.threat_level).toBe(4);
    expect(run({ ...failed.state, phase: 'attempt' }).state.action_points).toBe(1);
    const next = run({
      ...failed.state,
      phase: 'attempt',
      action_id: 'lift-2',
      action_sequence: 2,
    });
    expect(next.state.action_points).toBe(0);
    expect(resolve(next.state, 1).state.pending).toBe(true);
    expect(
      run({
        ...next.state,
        phase: 'resolve',
        result_supplied: true,
        result_actor_id: 'hero',
        result_action_id: 'lift-2',
        roll: 1,
      }).state.open,
    ).toBe(true);
  });
  it.each<State>([
    { adjacent: false },
    { actual_action: false },
    { action_points: 0 },
    { acting_party_id: 'other' },
    { acting_visit_id: 'other' },
    { acting_portcullis_id: 'other' },
    { actor_id: '' },
    { action_id: '' },
    { open: true },
  ])('rejects ineligible action %j without cost or result', (patch) => {
    const result = run({ ...base, ...patch });
    expect(result.state.action_points).toBe(patch.action_points ?? 2);
    expect(result.events).toEqual([]);
    expect(result.state.pending).toBe(false);
  });
  it.each<State>([
    { result_actor_id: 'other' },
    { result_action_id: 'other' },
    { acting_party_id: 'other' },
    { acting_visit_id: 'other' },
    { result_supplied: false },
  ])('keeps pending result for wrong or absent result %j', (patch) => {
    const pending = run(base).state;
    const result = run({
      ...pending,
      phase: 'resolve',
      result_supplied: true,
      result_actor_id: 'hero',
      result_action_id: 'lift-1',
      roll: 40,
      ...patch,
    });
    expect(result.state).toMatchObject({
      pending: true,
      open: false,
      action_points: 1,
      threat_level: 3,
    });
  });
  it('a new request cannot overwrite pending actor, target or action', () => {
    const pending = run(base).state;
    const other = run({
      ...pending,
      actor_id: 'other',
      action_id: 'lift-2',
      action_sequence: 2,
      strength: 99,
    });
    expect(other.state).toMatchObject({
      pending_actor_id: 'hero',
      pending_action_id: 'lift-1',
      pending_target: 40,
      action_points: 1,
    });
  });
  it('reuses automatic failure at91 even when assisted STR is above100', () => {
    const pending = run({
      ...base,
      strength: 100,
      same_side_helpers: 1,
      opposite_side_helpers: 2,
    }).state;
    const result = resolve(pending, 91);
    expect(result.state).toMatchObject({ open: false, threat_level: 4 });
    expect(result.trace).toContain('core.check.automatic_failure');
  });
  it.each<State>([{ same_side_helpers: 2 }, { opposite_side_helpers: 3 }])(
    'rejects impossible helper count %j',
    (patch) => expect(() => run({ ...base, ...patch })).toThrow('Input out of range'),
  );
});
