import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const run = (inputs: State, id = 'procedure.lingering_trauma') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const diagnosis: State = {
  sanity_system_enabled: true,
  acquired_condition_name: 'Lingering Trauma',
  condition_episode_processed: true,
  trauma_diagnosis_matches: true,
  trauma_diagnosed: true,
  trauma_selected: false,
  trauma_selection_processed: false,
  trauma_selection_request_processed: false,
  trauma_roll_supplied: true,
  die: 1,
  phase: 'acquisition',
  next_dungeon: false,
  trauma_dungeon_matches: false,
  trauma_dungeon_context_resolved: true,
  trauma_situation_resolved: true,
  event_confirmed: false,
  trigger_occurred: false,
  trauma_trigger_processed: false,
  active_until_dungeon_exit: false,
  trauma_resolve_modifier: 0,
  trauma_combat_skill_modifier: 0,
  leaves_dungeon: false,
  trauma_dungeon_closed: false,
  resolve: 45,
  combat_skill: 52,
  resolve_modifier: -10,
  current_conditions: 2,
  sanity: 6,
  maximum_sanity: 6,
};
const triggers = [
  'A trap is sprung by the party.',
  'A portcullis falls down.',
  'A companion is reduced to 0 Hit Points.',
  'A miscast in the party.',
  'Party takes a short break.',
  'The party opens a chest.',
];
const select = (inputs: State = diagnosis) => run(inputs, 'procedure.trauma_selection');
const selected = select().state;
const event = (state: State = selected): State => ({
  ...state,
  phase: 'event',
  next_dungeon: true,
  trauma_dungeon_matches: true,
  event_confirmed: true,
  trauma_event: triggers[0]!,
});
const active = run(event()).state;
const exit = (state: State = active): State => ({ ...state, phase: 'exit', leaves_dungeon: true });
describe('Lingering Trauma — rendered PDF57 row 4 and complete 1d6 table', () => {
  it.each(triggers.map((trigger, index) => [index + 1, trigger] as const))(
    'roll %i selects %s once, then that actual next-dungeon situation activates',
    (die, trigger) => {
      const chosen = select({ ...diagnosis, die });
      expect(chosen.state).toMatchObject({
        trigger,
        trauma_selected: true,
        trauma_selection_processed: true,
        trauma_resolve_modifier: 0,
      });
      expect(chosen.trace).toEqual([
        'procedure.trauma_selection',
        'character.sanity.trauma_trigger',
      ]);
      expect(chosen.events).toEqual([]);
      expect(select({ ...chosen.state, die: die === 6 ? 1 : 6 }).state.trigger).toBe(trigger);
      const applied = run({ ...event(chosen.state), trauma_event: trigger });
      expect(applied.state).toMatchObject({
        trauma_resolve_modifier: -10,
        trauma_combat_skill_modifier: -10,
        active_until_dungeon_exit: true,
        trauma_trigger_processed: true,
      });
      expect(applied.trace).toEqual([
        'procedure.lingering_trauma',
        'character.condition.lingering_trauma',
      ]);
    },
  );
  it('an owned earlier diagnosis remains selectable/active despite a later acquired name or pending episode', () => {
    const chosen = select({
      ...diagnosis,
      acquired_condition_name: 'Jumpy',
      condition_episode_processed: false,
    });
    expect(chosen.state.trauma_selected).toBe(true);
    const applied = run(event(chosen.state));
    expect(applied.state.active_until_dungeon_exit).toBe(true);
    expect(run(exit(applied.state)).state.active_until_dungeon_exit).toBe(false);
  });
  it('unresolved actual roll cannot select or invent a trigger', () => {
    const result = select({ ...diagnosis, trauma_roll_supplied: false });
    expect(result.trace).toEqual(['procedure.trauma_selection']);
    expect(result.state.trauma_selected).toBe(false);
    expect(result.state.trigger).toBeUndefined();
  });
  it('actual later Jumpy acquisition preserves the earlier selected Trauma diagnosis', () => {
    const acquired = run(
      {
        ...selected,
        sanity: 0,
        current_conditions: 2,
        sanity_condition_pending: true,
        condition_episode_processed: false,
        condition_draw_processed: false,
        condition_selected: false,
        die: 7,
        diagnosis_status_supplied: true,
        diagnosis_history_resolved: true,
        already_diagnosed: false,
        no_distinct_condition_left: false,
        condition_diagnosis_processed: false,
        condition_draw_rejected: false,
        condition_reroll_handoff_processed: false,
        condition_effect_handoff_processed: false,
      },
      'procedure.sanity_condition',
    );
    expect(acquired.state).toMatchObject({
      acquired_condition_name: 'Jumpy',
      current_conditions: 3,
      sanity: 5,
      trauma_diagnosed: true,
      trauma_selected: true,
      jumpy_active: true,
    });
    const triggered = run(event(acquired.state));
    expect(triggered.state).toMatchObject({
      active_until_dungeon_exit: true,
      jumpy_active: true,
      trauma_resolve_modifier: -10,
      current_conditions: 3,
      sanity: 5,
    });
  });
  const selectionRejected: State[] = [
    { sanity_system_enabled: false },
    { trauma_diagnosed: false },
    { trauma_diagnosis_matches: false },
    { trauma_dungeon_closed: true },
  ];
  it.each(selectionRejected)('rejects unavailable selection %j', (change) => {
    expect(select({ ...diagnosis, ...change }).state.trauma_selected).toBe(false);
  });
  it('requests separate actual selection once, with no automatic lookup or effect', () => {
    const first = run(diagnosis);
    expect(first.events).toEqual([{ type: 'invoke', dependency: 'procedure.trauma_selection' }]);
    expect(first.state).toMatchObject({
      trauma_selected: false,
      trauma_selection_request_processed: true,
      trauma_resolve_modifier: 0,
    });
    expect(first.state.trigger).toBeUndefined();
    expect(run(first.state).events).toEqual([]);
    const actual = select(first.state);
    expect(run(actual.state).events).toEqual([]);
  });
  it('a current-dungeon occurrence cannot activate a new diagnosis', () => {
    expect(run({ ...event(), next_dungeon: false }).state.active_until_dungeon_exit).toBe(false);
  });
  it('a different table situation does not activate the selected trigger', () => {
    const result = run({ ...event(), trauma_event: triggers[5]! });
    expect(result.state.trigger_occurred).toBe(false);
    expect(result.state.trauma_resolve_modifier).toBe(0);
    expect(result.trace).toEqual(['procedure.lingering_trauma']);
  });
  it('an actual event is required, even with a matching situation and stale trigger flag', () => {
    const result = run({ ...event(), event_confirmed: false, trigger_occurred: true });
    expect(result.state.trigger_occurred).toBe(false);
    expect(result.state.active_until_dungeon_exit).toBe(false);
  });
  it('an unresolved selection cannot activate from a supplied stale trigger', () => {
    expect(
      run({
        ...event(),
        trauma_selected: false,
        trauma_selection_processed: false,
        trigger_occurred: true,
      }).state.active_until_dungeon_exit,
    ).toBe(false);
  });
  const activationRejected: State[] = [
    { sanity_system_enabled: false },
    { trauma_diagnosed: false },
    { trauma_diagnosis_matches: false },
    { trauma_dungeon_matches: false },
    { leaves_dungeon: true },
  ];
  it.each(activationRejected)('rejects unavailable owned trigger %j', (change) => {
    expect(run({ ...event(), ...change }).state.active_until_dungeon_exit).toBe(false);
  });
  it.each(['trauma_dungeon_context_resolved', 'trauma_situation_resolved'] as const)(
    'unknown %s retains the scope issue without guessing',
    (field) => {
      const result = run({ ...event(), [field]: false });
      expect(result.unresolved).toEqual(['issue.sanity.trauma_scope']);
      expect(result.state.active_until_dungeon_exit).toBe(false);
      expect(result.state.trauma_resolve_modifier).toBe(0);
    },
  );
  it('active modifiers persist through other situations and replay without another application', () => {
    const replay = run(active);
    expect(replay.trace).toEqual(['procedure.lingering_trauma']);
    expect(replay.state.trauma_resolve_modifier).toBe(-10);
    const other = run({ ...active, trauma_event: triggers[5]!, event_confirmed: false });
    expect(other.state.active_until_dungeon_exit).toBe(true);
    expect(other.state.trauma_combat_skill_modifier).toBe(-10);
  });
  it('actual departure clears only the owned penalties with the expiry rule trace', () => {
    const result = run(exit());
    expect(result.trace).toEqual([
      'procedure.lingering_trauma',
      'character.condition.trauma_expiry',
    ]);
    expect(result.state).toMatchObject({
      active_until_dungeon_exit: false,
      trauma_resolve_modifier: 0,
      trauma_combat_skill_modifier: 0,
      trauma_dungeon_closed: true,
      trauma_trigger_processed: true,
      resolve: 45,
      combat_skill: 52,
      resolve_modifier: -10,
      current_conditions: 2,
      sanity: 6,
      maximum_sanity: 6,
    });
    expect(run(result.state).trace).toEqual(['procedure.lingering_trauma']);
  });
  it('quest objective completion, quest end and departure request do not replace actual departure', () => {
    expect(
      run({
        ...exit(),
        leaves_dungeon: false,
        objective_completed: true,
        quest_end_reached: true,
        departure_requested: true,
      }).state.active_until_dungeon_exit,
    ).toBe(true);
  });
  it('departure from another dungeon cannot clear this owned effect', () => {
    expect(run({ ...exit(), trauma_dungeon_matches: false }).state.active_until_dungeon_exit).toBe(
      true,
    );
  });
  it('unresolved departure identity retains the active effect and the scope issue', () => {
    const result = run({ ...exit(), trauma_dungeon_context_resolved: false });
    expect(result.unresolved).toEqual(['issue.sanity.trauma_scope']);
    expect(result.state).toMatchObject({
      active_until_dungeon_exit: true,
      trauma_resolve_modifier: -10,
      trauma_dungeon_closed: false,
    });
  });
  it('actual departure without a selected trigger cannot request a retroactive selection', () => {
    const result = run(exit(event(diagnosis)));
    expect(result.events).toEqual([]);
    expect(result.state.trauma_dungeon_closed).toBe(true);
    expect(result.state.trauma_selected).toBe(false);
  });
  it('untriggered next visit closes without penalties or a guessed cure', () => {
    const result = run(exit(event()));
    expect(result.trace).toEqual(['procedure.lingering_trauma']);
    expect(result.state).toMatchObject({
      trauma_dungeon_closed: true,
      trauma_trigger_processed: false,
      trauma_resolve_modifier: 0,
      current_conditions: 2,
    });
  });
  it('requested later recurrence remains unresolved instead of automatically rearming', () => {
    const closed = run(exit()).state;
    const later = run({ ...event(closed), next_dungeon: false, leaves_dungeon: false });
    expect(later.unresolved).toEqual(['issue.sanity.trauma_scope']);
    expect(later.state.active_until_dungeon_exit).toBe(false);
    expect(later.state.trauma_resolve_modifier).toBe(0);
    expect(select({ ...closed, trauma_selection_processed: false, die: 6 }).state.trigger).toBe(
      triggers[0],
    );
  });
  it('composes diagnosis, actual selection, next-dungeon occurrence and departure', () => {
    const accepted = run(
      {
        ...diagnosis,
        sanity: 0,
        current_conditions: 1,
        sanity_condition_pending: true,
        condition_episode_processed: false,
        condition_draw_processed: false,
        condition_selected: false,
        die: 4,
        diagnosis_status_supplied: true,
        diagnosis_history_resolved: true,
        already_diagnosed: false,
        no_distinct_condition_left: false,
        condition_diagnosis_processed: false,
        condition_draw_rejected: false,
        condition_reroll_handoff_processed: false,
        condition_effect_handoff_processed: false,
        trauma_selected: true,
        trauma_selection_processed: true,
        trauma_selection_request_processed: true,
        trauma_trigger_processed: true,
        active_until_dungeon_exit: true,
        trauma_dungeon_closed: true,
        trauma_resolve_modifier: -10,
        trauma_combat_skill_modifier: -10,
      },
      'procedure.sanity_condition',
    );
    expect(accepted.events).toEqual([{ type: 'invoke', dependency: 'procedure.lingering_trauma' }]);
    expect(accepted.state).toMatchObject({
      current_conditions: 2,
      sanity: 6,
      trauma_selected: false,
      trauma_selection_processed: false,
      trauma_selection_request_processed: false,
      trauma_trigger_processed: false,
      active_until_dungeon_exit: false,
      trauma_dungeon_closed: false,
      trauma_resolve_modifier: 0,
      trauma_combat_skill_modifier: 0,
    });
    const requested = run(accepted.state);
    const chosen = select({ ...requested.state, die: 3 });
    const triggered = run({ ...event(chosen.state), trauma_event: triggers[2]! });
    const departed = run(exit(triggered.state));
    expect(departed.state).toMatchObject({
      current_conditions: 2,
      sanity: 6,
      maximum_sanity: 6,
      active_until_dungeon_exit: false,
      trauma_dungeon_closed: true,
    });
    expect(run(departed.state, 'procedure.sanity_condition').events).toEqual([]);
  });
});
