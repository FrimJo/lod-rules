import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity } from '../../scripts/validate/pilot.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { createAjv, getValidator } from '../../scripts/validate/schemas.ts';
import { phaseFourContext } from '../support/phase-four-context.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.spring_cleaning.${suffix}`], inputs } as TestCase, corpus);

describe('Spring Cleaning source — PDF 224–226', () => {
  it('preserves the quest location, objective and tile exclusions', () => {
    expect(run('setup').state).toMatchObject({
      location: 'any town',
      campaign_start: 'wherever the heroes are',
      second_quest_start: 'Silver City',
      corridors: 4,
      excluded_corridor: 'C16',
      rooms: 4,
      excluded_room: 'R17',
      objective_room: 'R5B',
      encounter_source: 'quest-specific',
      may_take_findings: true,
      objective: 'clear out the basement of the Town Hall',
    });
  });
  it.each([
    [11, 12, true],
    [13, 12, false],
    [12, 12, false],
    [11, 13, false],
  ])('uses the introductory Threat convention %s → %s', (before, after, trigger) => {
    const result = run('threshold', { previous_threat: before, current_threat: after });
    expect(result.trace.length > 0).toBe(trigger);
    if (trigger)
      expect(result.state).toMatchObject({
        quest_threshold: 12,
        wandering_monster_triggered: true,
        scenario_result_ignored: true,
        threat_reduction_on_placement: 0,
      });
  });
  it('excepts only the ration requirement, leaving rest lifecycle accounting separate', () => {
    const result = run('rest_exception');
    expect(result.state).toEqual({ rest_ration_cost: 0, rest_other_requirements_unchanged: true });
    expect(result.events).toEqual([]);
    expect(
      corpus.rules.find((x) => x.id === 'core.quest.spring_cleaning.rest_exception')?.dependencies,
    ).toContainEqual({
      key: 'rest',
      label: 'Ordinary Rest requirements and benefits, subject to the quest ration exception',
      object_id: 'procedure.rest',
    });
  });
  it.each([31, 45])('places unarmed Johann on his first qualifying roll %s', (roll) => {
    expect(
      run('johann_first_encounter', { encounter_roll: roll, johann_encountered: false }).state,
    ).toMatchObject({
      encounter: 'Johann the gardener',
      johann_unarmed: true,
      johann_appears: true,
    });
    expect(
      run('johann_first_encounter', { encounter_roll: roll, johann_encountered: true }).trace,
    ).toEqual([]);
  });
  it.each([1, 4])('replaces a repeated Johann result with %s rats and one swarm', (rats) => {
    expect(
      run('johann_repeat_encounter', {
        encounter_roll: 31,
        johann_encountered: true,
        giant_rat_roll: rats,
      }).state,
    ).toMatchObject({ giant_rats: rats, bat_swarms: 1, johann_appears: false });
  });
  it.each([30, 46])('does not replace unrelated encounter roll %s', (roll) => {
    expect(
      run('johann_repeat_encounter', {
        encounter_roll: roll,
        johann_encountered: true,
        giant_rat_roll: 2,
      }).trace,
    ).toEqual([]);
  });
  it('does not replace Johann before his first appearance', () => {
    expect(
      run('johann_repeat_encounter', {
        encounter_roll: 31,
        johann_encountered: false,
        giant_rat_roll: 2,
      }).trace,
    ).toEqual([]);
  });
  it.each([1, 10])('preserves objective room rat count %s and relative geometry', (rats) => {
    expect(run('objective_setup', { rat_roll: rats }).state).toMatchObject({
      rats,
      rat_placement: 'randomly in the room',
      brood_mother_placement: 'as far away as possible from the player',
    });
  });
  it.each([true, false])('places Johann in the objective only if not encountered: %s', (seen) => {
    const inputs: State = { johann_encountered: seen };
    const result = runCase(
      {
        rule_ids: [
          'core.quest.spring_cleaning.objective_johann',
          'core.quest.spring_cleaning.objective_johann_absent',
        ],
        inputs,
      } as TestCase,
      corpus,
    );
    expect(result.state.johann_appears).toBe(!seen);
    if (!seen) expect(result.state.johann_placement).toBe('far end of the room');
  });
  it('does not invent infection dice or turn possible disease into automatic infection', () => {
    expect(run('brood_mother').state).toEqual({
      xp: 115,
      causes_fear: true,
      wounding_bite_may_cause_disease: true,
    });
    expect(
      corpus.rules.find((x) => x.id === 'core.quest.spring_cleaning.brood_mother')?.issues,
    ).toContain('issue.quest.brood_mother_disease');
  });
  it('preserves living-or-Undead uncertainty without assigning a classification', () => {
    const actor = corpus.entities.find((x) => x.id === 'quest_actor.dead_rising.brood_mother')!;
    expect(actor.issues).toContain('issue.quest.brood_mother_living_or_undead');
    expect(actor.source_text).toContain('questionable whether this rat is living or Undead');
    expect(run('brood_mother').state).not.toHaveProperty('undead');
  });
  it('distinguishes advertised reward, additional per-hero money, and party rations', () => {
    expect(run('reward').state.reward_per_hero).toBe(100);
    expect(run('aftermath').state).toEqual({
      extra_reward_per_hero: 50,
      party_rations_offered: 10,
      next_destination: 'Silver City',
    });
  });
  it('binds local actors and all eleven scenario rules to the quest', () => {
    const quest = corpus.entities.find((x) => x.id === 'quest.dead_rising.spring_cleaning')!;
    expect(quest.rules).toHaveLength(11);
    for (const id of quest.rules)
      expect(corpus.rules.find((x) => x.id === id)).toMatchObject({
        type: 'scenario_rule',
        scope: 'quest',
        quest_id: quest.id,
      });
    expect(
      corpus.entities.filter((x) => x.type === 'quest_actor' && x.quest_id === quest.id),
    ).toHaveLength(2);
  });
});

describe('quest actor schema and integrity', () => {
  const actor = corpus.entities.find((x) => x.id === 'quest_actor.dead_rising.brood_mother')!;
  const validate = getValidator(createAjv(), 'entities');
  it('requires a real quest ownership field and a category', () => {
    expect(validate([actor])).toBe(true);
    const noQuest = structuredClone(actor);
    delete noQuest.quest_id;
    expect(validate([noQuest])).toBe(false);
    const noCategory = structuredClone(actor);
    delete noCategory.category;
    expect(validate([noCategory])).toBe(false);
  });
  it('rejects a dangling quest and a non-quest owner', () => {
    for (const target of ['quest.absent', 'species.human']) {
      const data = structuredClone(corpus);
      data.entities.find((x) => x.id === actor.id)!.quest_id = target;
      expect(checkPilotIntegrity(data, phaseFourContext()).some((e) => e.includes(actor.id))).toBe(
        true,
      );
    }
  });
  it('requires the quest_actor namespace', () => {
    const data = structuredClone(corpus);
    data.entities.find((x) => x.id === actor.id)!.id = 'quest.brood_mother';
    expect(
      checkPilotIntegrity(data, phaseFourContext()).some((e) =>
        e.includes('invalid entity namespace'),
      ),
    ).toBe(true);
  });
});
