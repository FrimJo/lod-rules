import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State, id = 'procedure.sanity_condition') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const pending: State = {
  sanity_system_enabled: true,
  sanity: 0,
  maximum_sanity: 7,
  current_conditions: 1,
  sanity_condition_pending: true,
  condition_episode_processed: false,
  condition_draw_processed: false,
  condition_selected: false,
  die: 5,
  diagnosis_status_supplied: true,
  diagnosis_history_resolved: true,
  already_diagnosed: false,
  no_distinct_condition_left: false,
  condition_diagnosis_processed: false,
  condition_draw_rejected: false,
  condition_reroll_handoff_processed: false,
  condition_effect_handoff_processed: false,
};
describe('Exact-zero condition acquisition — rendered PDF55 / 57', () => {
  it.each([
    [1, 'Hate', 'hate'],
    [2, 'Acute Stress', 'acute_stress'],
    [3, 'Acute Stress', 'acute_stress'],
    [4, 'Lingering Trauma', 'lingering_trauma'],
    [5, 'Fear of the Dark', 'fear_of_the_dark'],
    [6, 'Arachnophobia', 'arachnophobia'],
    [7, 'Jumpy', 'jumpy'],
    [8, 'Irrational Fear', 'irrational_fear'],
    [9, 'Claustrophobia', 'claustrophobia'],
    [10, 'Depression', 'depression'],
  ] as const)('die %i selects %s and hands off its existing effect', (die, name, rule) => {
    const first = run({ ...pending, die });
    expect(first.state).toMatchObject({
      condition_name: name,
      acquired_condition_name: name,
      current_conditions: 2,
      sanity: 6,
      maximum_sanity: 6,
      condition_episode_processed: true,
      sanity_condition_pending: false,
    });
    expect(first.trace).toEqual([
      'procedure.sanity_condition',
      'character.sanity.draw_condition',
      'character.sanity.acquire_condition',
    ]);
    expect(first.events).toEqual([
      {
        type: 'invoke',
        dependency: [
          'hate',
          'acute_stress',
          'lingering_trauma',
          'jumpy',
          'depression',
          'fear_of_the_dark',
          'claustrophobia',
          'arachnophobia',
          'irrational_fear',
        ].includes(rule)
          ? 'procedure.' + rule
          : 'character.condition.' + rule,
      },
    ]);
    expect(first.state.resolve).toBeUndefined();
  });
  it('accepted episode replay cannot add a condition or reset changed Sanity', () => {
    const first = run(pending);
    expect(run({ ...first.state, sanity: 0, die: 9 }).state).toMatchObject({
      current_conditions: 2,
      sanity: 0,
      condition_name: 'Fear of the Dark',
    });
    expect(run(first.state).events).toEqual([]);
  });
  it('duplicate diagnosis requests a new draw without count/reset', () => {
    const first = run({ ...pending, already_diagnosed: true, die: 6 });
    expect(first.state).toMatchObject({
      condition_name: 'Arachnophobia',
      current_conditions: 1,
      sanity: 0,
      reroll_required: true,
      condition_draw_rejected: true,
      condition_episode_processed: false,
      sanity_condition_pending: true,
    });
    expect(first.events).toEqual([{ type: 'invoke', dependency: 'procedure.sanity_condition' }]);
    expect(first.trace).toEqual([
      'procedure.sanity_condition',
      'character.sanity.draw_condition',
      'character.sanity.duplicate_condition',
    ]);
    expect(run(first.state).events).toEqual([]);
  });
  it('replay cannot replace consumed duplicate membership or change selected die', () => {
    const first = run({ ...pending, already_diagnosed: true, die: 6 });
    const replay = run({ ...first.state, already_diagnosed: false, die: 9 });
    expect(replay.state).toMatchObject({
      condition_name: 'Arachnophobia',
      current_conditions: 1,
      sanity: 0,
      condition_episode_processed: false,
      reroll_required: true,
    });
    expect(replay.events).toEqual([]);
  });
  it('a genuinely new nonduplicate draw completes the same pending episode once', () => {
    const first = run({ ...pending, already_diagnosed: true, die: 6 });
    const second = run({
      ...first.state,
      condition_draw_processed: false,
      die: 9,
      already_diagnosed: false,
    });
    expect(second.state).toMatchObject({
      condition_name: 'Claustrophobia',
      current_conditions: 2,
      sanity: 6,
      condition_episode_processed: true,
      sanity_condition_pending: false,
    });
    expect(second.events).toEqual([{ type: 'invoke', dependency: 'procedure.claustrophobia' }]);
    expect(run(second.state).events).toEqual([]);
  });
  it('a distinct second duplicate draw can request another source-required reroll', () => {
    const first = run({ ...pending, already_diagnosed: true, die: 6 });
    const second = run({ ...first.state, condition_draw_processed: false, die: 5 });
    expect(second.events).toEqual([{ type: 'invoke', dependency: 'procedure.sanity_condition' }]);
    expect(second.state.current_conditions).toBe(1);
    expect(second.state.sanity).toBe(0);
  });
  it('awaiting membership preserves the actual selected name despite a changed supplied die', () => {
    const first = run({ ...pending, diagnosis_status_supplied: false });
    expect(first.state.condition_name).toBe('Fear of the Dark');
    expect(first.state.current_conditions).toBe(1);
    const checked = run({ ...first.state, die: 9, diagnosis_status_supplied: true });
    expect(checked.state.acquired_condition_name).toBe('Fear of the Dark');
  });
  it('unresolved historical diagnosis policy cannot acquire or reject a selected draw', () => {
    const r = run({ ...pending, diagnosis_history_resolved: false });
    expect(r.unresolved).toContain('issue.phase4.sanity_boundaries');
    expect(r.state).toMatchObject({
      current_conditions: 1,
      sanity: 0,
      condition_diagnosis_processed: false,
      condition_episode_processed: false,
    });
    expect(r.events).toEqual([]);
  });
  const rejected: State[] = [
    { sanity_system_enabled: false },
    { sanity: 1 },
    { sanity_condition_pending: false },
    { condition_episode_processed: true },
  ];
  it.each(rejected)('rejects unavailable episode %j', (override) => {
    const r = run({ ...pending, ...override });
    expect(r.state.current_conditions).toBe(1);
    expect(r.events).toEqual([]);
    expect(r.trace).toEqual(['procedure.sanity_condition']);
  });
  it.each([7, 8, 9])(
    'current count %i preserves nonpositive-reset boundary',
    (current_conditions) => {
      const r = run({ ...pending, current_conditions });
      expect(r.unresolved).toContain('issue.phase4.sanity_boundaries');
      expect(r.state).toMatchObject({
        current_conditions,
        sanity: 0,
        condition_episode_processed: false,
        condition_draw_processed: false,
      });
      expect(r.events).toEqual([]);
    },
  );
  it('six current conditions may acquire the seventh with a positive reset of one', () => {
    expect(run({ ...pending, current_conditions: 6 }).state).toMatchObject({
      current_conditions: 7,
      sanity: 1,
      maximum_sanity: 1,
    });
  });
  it('exhausted diagnoses preserve pending state without fallback or guessed reroll cap', () => {
    const r = run({ ...pending, no_distinct_condition_left: true });
    expect(r.unresolved).toContain('issue.phase4.sanity_boundaries');
    expect(r.state.condition_episode_processed).toBe(false);
    expect(r.events).toEqual([]);
  });
  it('negative Sanity does not clamp into a diagnosis', () => {
    const r = run({ ...pending, sanity: -1 });
    expect(r.unresolved).toContain('issue.phase4.sanity_boundaries');
    expect(r.state).toMatchObject({
      sanity: -1,
      current_conditions: 1,
      condition_episode_processed: false,
    });
    expect(r.events).toEqual([]);
  });
  const loss: State = {
    sanity: 1,
    sanity_system_enabled: true,
    event_kind: 'fear',
    event_confirmed: true,
    sanity_loss_processed: false,
    sanity_room_handoff_processed: false,
    sanity_condition_pending: false,
    sanity_condition_handoff_processed: true,
    condition_episode_processed: true,
  };
  it('composes loss, duplicate reroll and novel acquisition without a repeated loss/reset', () => {
    const zero = run(loss, 'procedure.sanity_loss');
    expect(zero.state).toMatchObject({
      sanity: 0,
      condition_episode_processed: false,
      condition_draw_processed: false,
      sanity_condition_pending: true,
    });
    expect(zero.events).toEqual([{ type: 'invoke', dependency: 'procedure.sanity_condition' }]);
    const duplicate = run({ ...pending, ...zero.state, die: 6, already_diagnosed: true });
    const revisit = run({ ...duplicate.state, die: 1 }, 'procedure.sanity_loss');
    expect(revisit.state).toMatchObject({
      condition_draw_processed: true,
      condition_draw_rejected: true,
      condition_diagnosis_processed: true,
      sanity: 0,
    });
    expect(revisit.events).toEqual([]);
    const acquired = run({
      ...duplicate.state,
      condition_draw_processed: false,
      die: 9,
      already_diagnosed: false,
    });
    expect(acquired.state).toMatchObject({ sanity: 6, current_conditions: 2, maximum_sanity: 6 });
    expect(run(acquired.state).state.current_conditions).toBe(2);
  });
  it('a distinct later exact-zero episode gets fresh acquisition markers', () => {
    const first = run(pending);
    const laterZero = run(
      {
        ...loss,
        ...first.state,
        die: 1,
        sanity: 1,
        event_kind: 'fear',
        sanity_loss_processed: false,
      },
      'procedure.sanity_loss',
    );
    expect(laterZero.state.condition_episode_processed).toBe(false);
    expect(run({ ...laterZero.state, die: 9, already_diagnosed: false }).state).toMatchObject({
      current_conditions: 3,
      sanity: 5,
      maximum_sanity: 5,
    });
  });
});
