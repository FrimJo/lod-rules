import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const ruleFixture = corpus.testCases.find((entry) => entry.rule_ids && !entry.procedure_id)!;
const run = (inputs: State, id = 'procedure.fear_of_the_dark') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const hero: State = {
  sanity_system_enabled: true,
  fear_of_the_dark_owner_matches: true,
  fear_of_the_dark: true,
  resolve_test_modifier: 0,
  claustrophobia_owner_matches: true,
  claustrophobia: true,
  claustrophobia_location_supplied: true,
  in_corridor: true,
  claustrophobia_skill_stat_modifier: 0,
  skill_stat_modifier: -20,
  claustrophobia_location_handoff_processed: false,
  individual_stat_application_requested: false,
  claustrophobia_stat_scope_resolved: false,
  resolve: 43,
  combat_skill: 51,
  strength: 31,
  hit_points: 23,
  energy: 1,
  energy_pool: 3,
  mana: 14,
  resolve_modifier: -10,
  trauma_resolve_modifier: -10,
  current_conditions: 2,
  sanity: 6,
  maximum_sanity: 6,
};
const claust = (inputs: State = hero) => run(inputs, 'procedure.claustrophobia');
describe('Fear of the Dark and Claustrophobia — rendered PDF57 rows 5/9', () => {
  it.each([false, true])(
    'all Resolve Tests get the owned -10 even with darkness %s',
    (darkness_present) => {
      const result = run({ ...hero, darkness_present });
      expect(result.state).toMatchObject({
        resolve_test_modifier: -10,
        fear_dark_modifier_resolved: true,
        resolve: 43,
        resolve_modifier: -10,
        trauma_resolve_modifier: -10,
      });
      expect(result.trace).toEqual([
        'procedure.fear_of_the_dark',
        'character.condition.fear_of_the_dark',
      ]);
      expect(result.events).toEqual([]);
    },
  );
  it('repeated tests and replays do not accumulate the fixed contribution', () => {
    const first = run(hero);
    expect(run(first.state).state.resolve_test_modifier).toBe(-10);
    expect(run({ ...first.state, test_roll: 62, distinct_test: true }).state.resolve).toBe(43);
  });
  it('actual removed condition clears only its contribution', () => {
    const first = run(hero);
    const removed = run({ ...first.state, fear_of_the_dark: false });
    expect(removed.state).toMatchObject({
      resolve_test_modifier: 0,
      resolve_modifier: -10,
      trauma_resolve_modifier: -10,
      resolve: 43,
      current_conditions: 2,
      sanity: 6,
    });
    expect(removed.trace).toEqual(['procedure.fear_of_the_dark']);
  });
  it('a treatment request without actual removal does not clear the contribution', () => {
    expect(run({ ...hero, treatment_requested: true }).state.resolve_test_modifier).toBe(-10);
  });
  it('disabled rule clears the owned contribution without curing or changing another condition', () => {
    const result = run({ ...hero, sanity_system_enabled: false, resolve_test_modifier: -10 });
    expect(result.state).toMatchObject({
      resolve_test_modifier: 0,
      fear_of_the_dark: true,
      resolve_modifier: -10,
      trauma_resolve_modifier: -10,
    });
  });
  it('another owner cannot overwrite this hero contribution', () => {
    const result = run({
      ...hero,
      fear_of_the_dark_owner_matches: false,
      resolve_test_modifier: -7,
    });
    expect(result.state).toMatchObject({
      resolve_test_modifier: -7,
      fear_dark_modifier_resolved: false,
    });
  });
  it('later diagnosis and pending acquisition do not disable this owned condition', () => {
    expect(
      run({ ...hero, acquired_condition_name: 'Jumpy', condition_episode_processed: false }).state
        .resolve_test_modifier,
    ).toBe(-10);
  });
  it('actual corridor gives the owned source contribution and full procedure trace', () => {
    const result = claust();
    expect(result.state).toMatchObject({
      claustrophobia_skill_stat_modifier: -10,
      claustrophobia_modifier_resolved: true,
      strength: 31,
      combat_skill: 51,
      hit_points: 23,
      energy: 1,
      energy_pool: 3,
      mana: 14,
      resolve: 43,
    });
    expect(result.trace).toEqual(['procedure.claustrophobia']);
    expect(result.events).toEqual([]);
  });
  it('actual room transition clears only this contribution; returning to a corridor reapplies once', () => {
    const corridor = claust();
    const room = claust({ ...corridor.state, in_corridor: false });
    expect(room.state).toMatchObject({
      claustrophobia_skill_stat_modifier: 0,
      resolve_modifier: -10,
      trauma_resolve_modifier: -10,
      claustrophobia: true,
    });
    expect(room.trace).toEqual(['procedure.claustrophobia']);
    const returned = claust({ ...room.state, in_corridor: true });
    expect(returned.state.claustrophobia_skill_stat_modifier).toBe(-10);
    expect(claust(returned.state).state.claustrophobia_skill_stat_modifier).toBe(-10);
  });
  it('actual condition removal clears the corridor contribution without restoring total stats', () => {
    const result = claust({ ...claust().state, claustrophobia: false });
    expect(result.state).toMatchObject({
      claustrophobia_skill_stat_modifier: 0,
      resolve: 43,
      strength: 31,
      hit_points: 23,
      current_conditions: 2,
      sanity: 6,
    });
  });
  it('a cure request or five corridor battles alone is not a global Claustrophobia cure', () => {
    const result = claust({
      ...hero,
      treatment_requested: true,
      corridor_battles_fought_and_survived: 5,
    });
    expect(result.state).toMatchObject({
      claustrophobia_skill_stat_modifier: -10,
      claustrophobia: true,
    });
    expect(result.events).toEqual([]);
  });
  it('disabled rule clears its own contribution even when actual location is unavailable', () => {
    const result = claust({
      ...hero,
      claustrophobia_skill_stat_modifier: -10,
      sanity_system_enabled: false,
      claustrophobia_location_supplied: false,
    });
    expect(result.state).toMatchObject({
      claustrophobia_skill_stat_modifier: 0,
      claustrophobia_modifier_resolved: true,
      claustrophobia: true,
    });
    expect(result.events).toEqual([]);
  });
  it('another owner cannot erase or recompute this corridor contribution', () => {
    const result = claust({
      ...hero,
      claustrophobia_skill_stat_modifier: -7,
      claustrophobia_owner_matches: false,
    });
    expect(result.state).toMatchObject({
      claustrophobia_skill_stat_modifier: -7,
      claustrophobia_modifier_resolved: false,
    });
  });
  it('missing active-condition location requests input once and does not claim a stale contribution is current', () => {
    const prior = claust();
    const missing = claust({ ...prior.state, claustrophobia_location_supplied: false });
    expect(missing.state).toMatchObject({
      claustrophobia_skill_stat_modifier: -10,
      claustrophobia_modifier_resolved: false,
    });
    expect(missing.events).toEqual([
      {
        type: 'invoke',
        dependency: 'Actual owned current corridor/non-corridor location for Claustrophobia',
      },
    ]);
    expect(claust(missing.state).events).toEqual([]);
    const actualRoom = claust({
      ...missing.state,
      claustrophobia_location_supplied: true,
      in_corridor: false,
    });
    expect(actualRoom.state).toMatchObject({
      claustrophobia_skill_stat_modifier: 0,
      claustrophobia_modifier_resolved: true,
    });
  });
  it('a distinct unknown location can request a fresh classification without inventing a move', () => {
    const first = claust({ ...hero, claustrophobia_location_supplied: false });
    expect(
      claust({ ...first.state, claustrophobia_location_handoff_processed: false }).events,
    ).toHaveLength(1);
  });
  it('removed condition requires no corridor guess to clear its contribution', () => {
    const result = claust({
      ...hero,
      claustrophobia_skill_stat_modifier: -10,
      claustrophobia: false,
      claustrophobia_location_supplied: false,
    });
    expect(result.state.claustrophobia_skill_stat_modifier).toBe(0);
    expect(result.events).toEqual([]);
  });
  it('undefined individual target/pool/bounds application retains the full generic scope and review issue', () => {
    const result = claust({ ...hero, individual_stat_application_requested: true });
    expect(result.unresolved).toEqual(['issue.sanity.claustrophobia_stat_scope']);
    expect(result.state).toMatchObject({
      claustrophobia_skill_stat_modifier: -10,
      hit_points: 23,
      energy: 1,
      mana: 14,
      strength: 31,
    });
    expect(result.trace).toEqual(['procedure.claustrophobia']);
  });
  it('a supplied resolved target scope still performs no individual stat mutations here', () => {
    const result = claust({
      ...hero,
      individual_stat_application_requested: true,
      claustrophobia_stat_scope_resolved: true,
    });
    expect(result.unresolved).toEqual([]);
    expect(result.state).toMatchObject({
      claustrophobia_skill_stat_modifier: -10,
      strength: 31,
      energy_pool: 3,
    });
  });
  it('both conditions coexist with Acute Stress and Trauma without overwriting each other', () => {
    const fear = run(hero);
    const corridor = claust(fear.state);
    expect(corridor.state).toMatchObject({
      resolve_test_modifier: -10,
      claustrophobia_skill_stat_modifier: -10,
      resolve_modifier: -10,
      trauma_resolve_modifier: -10,
    });
    const room = claust({ ...corridor.state, in_corridor: false });
    expect(run(room.state).state).toMatchObject({
      resolve_test_modifier: -10,
      claustrophobia_skill_stat_modifier: 0,
      resolve_modifier: -10,
      trauma_resolve_modifier: -10,
    });
  });
  it('the Encumbrance legacy field survives both corridor application and leaving the corridor', () => {
    const equipment = runCase(
      {
        ...ruleFixture,
        rule_ids: ['character.encumbrance.penalty'],
        inputs: { ...hero, encumbrance: 32, strength: 31 },
      },
      corpus,
    );
    expect(equipment.trace).toEqual(['character.encumbrance.penalty']);
    const corridor = claust(equipment.state);
    expect(corridor.state).toMatchObject({
      skill_stat_modifier: -10,
      claustrophobia_skill_stat_modifier: -10,
    });
    const room = claust({ ...corridor.state, in_corridor: false });
    expect(room.state).toMatchObject({
      skill_stat_modifier: -10,
      claustrophobia_skill_stat_modifier: 0,
    });
  });
  it.each([4, 5])(
    'existing The Well quest-local rule owns actual cure after %i survived corridor battles',
    (battles) => {
      const local = runCase(
        {
          ...ruleFixture,
          rule_ids: ['character.background.the_well.cure_and_reward'],
          inputs: {
            ...hero,
            corridor_battles_fought_and_survived: battles,
            reward_already_received: false,
            asylum_curable: false,
          },
        },
        corpus,
      );
      const result = claust(local.state);
      expect(result.state.claustrophobia).toBe(battles < 5);
      expect(result.state.claustrophobia_skill_stat_modifier).toBe(battles < 5 ? -10 : 0);
      expect(result.events).toEqual([]);
      expect(result.state.current_conditions).toBe(2);
      expect(result.state.asylum_curable).toBe(false);
    },
  );
  it.each([
    [5, 'procedure.fear_of_the_dark', 'fear_of_the_dark', 'resolve_test_modifier'],
    [9, 'procedure.claustrophobia', 'claustrophobia', 'claustrophobia_skill_stat_modifier'],
  ] as const)(
    'diagnosis die %i hands off %s without an automatic numeric modifier',
    (die, id, flag, modifier) => {
      const accepted = run(
        {
          ...hero,
          sanity: 0,
          current_conditions: 1,
          sanity_condition_pending: true,
          condition_episode_processed: false,
          condition_draw_processed: false,
          condition_selected: false,
          die,
          diagnosis_status_supplied: true,
          diagnosis_history_resolved: true,
          already_diagnosed: false,
          no_distinct_condition_left: false,
          condition_diagnosis_processed: false,
          condition_draw_rejected: false,
          condition_reroll_handoff_processed: false,
          condition_effect_handoff_processed: false,
          [flag]: false,
        },
        'procedure.sanity_condition',
      );
      expect(accepted.events).toEqual([{ type: 'invoke', dependency: id }]);
      expect(accepted.state[flag]).toBe(true);
      expect(accepted.state[modifier]).toBe(0);
      const applied = run(accepted.state, id);
      expect(applied.state[modifier]).toBe(-10);
      expect(applied.state).toMatchObject({ current_conditions: 2, sanity: 6, maximum_sanity: 6 });
      expect(run(applied.state, 'procedure.sanity_condition').events).toEqual([]);
    },
  );
});
