import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffixes: string[], inputs: State = {}) =>
  runCase(
    { rule_ids: suffixes.map((s) => `core.quest.grieving_mother.${s}`), inputs } as TestCase,
    corpus,
  );
const single = (suffix: string, inputs: State = {}) => run([suffix], inputs);

describe('The Grieving Mother — rendered PDF 164–165', () => {
  it.each([
    [false, false, false],
    [false, true, false],
    [true, false, false],
    [true, true, true],
  ])(
    'preserves gated reading triggered=%s, first turn finished=%s',
    (triggered, finished, allowed) => {
      const result = run(['reading', 'reading_door_slam'], {
        quest_triggered: triggered,
        first_turn_finished: finished,
      });
      expect(result.state).toMatchObject({
        initial_text_readable: triggered,
        door_slam_text_readable: allowed,
        read_one_section_at_a_time: true,
      });
    },
  );
  it('preserves next-main-quest location, extra card and inherited encounters', () => {
    expect(single('setup').state).toMatchObject({
      location: 'same dungeon as the next quest',
      side_quest_cards_to_add: 1,
      encounter_source: 'main quest',
      objective: 'bring back the son to be buried in the family grave on the estate',
    });
  });
  it('puts the drawn side card aside and draws the next card for the side room', () => {
    expect(single('side_quest_card', { side_quest_card_drawn: true }).state).toMatchObject({
      set_side_quest_card_aside: true,
      draw_next_card: true,
      next_card_leads_to_side_objective: true,
      hidden_door_location: 'one of the walls',
      next_reading: 'Once in the room, read The Hidden Door',
    });
    expect(single('side_quest_card', { side_quest_card_drawn: false }).trace).toEqual([]);
  });
  it.each([
    [true, false, true],
    [false, false, false],
    [true, true, false],
  ])(
    'only offers unfinished-search choices after main completion: %s/%s',
    (finished, drawn, active) => {
      const result = single('main_quest_finished', {
        main_quest_finished: finished,
        side_quest_card_drawn: drawn,
      });
      expect(result.trace.length > 0).toBe(active);
      if (active)
        expect(result.state).toMatchObject({
          may_continue_search: true,
          ending_now_fails_side_quest: true,
        });
    },
  );
  it('uses ordinary lock/trap checks for the initial hidden door', () => {
    expect(single('hidden_door').state).toEqual({
      door_kind: 'regular door',
      roll_for_lock: true,
      roll_for_trap: true,
    });
  });
  it('preserves relative room geometry and all described objects without inventing coordinates', () => {
    expect(single('objective_room').state).toEqual({
      room_tile: 'R17',
      outside_opening: 'opposite side of the room',
      may_leave_via_opening: true,
      remains_location: 'one of the squares in front of the door',
      giant_spiders: 2,
      spider_placement: 'opposite corners',
      items_beside_remains: 'broken shield and rusty longsword',
    });
  });
  it.each([true, false])('slams the door only after the first combat turn: %s', (finished) => {
    const result = single('door_slam', { first_turn_finished: finished });
    expect(result.trace.length > 0).toBe(finished);
    if (finished)
      expect(result.state).toMatchObject({
        hidden_door_closed: true,
        door_table_result: 10,
        heroes_inside_trapped: true,
      });
  });
  it.each([
    [true, false, true, true, false],
    [true, true, false, false, true],
    [false, false, true, false, true],
    [false, false, false, true, true],
    [false, true, false, false, false],
    [false, false, false, false, false],
  ])(
    'retains inside/outside opening distinctions %s/%s/%s/%s',
    (inside, dead, unlocked, forced, allowed) => {
      expect(
        run(['door_access', 'door_access_blocked'], {
          opening_from_inside: inside,
          spiders_dead: dead,
          lock_opened: unlocked,
          door_beaten_down: forced,
        }).state.door_opening_allowed,
      ).toBe(allowed);
    },
  );
  it.each([true, false])('requires spiders beaten before picking up remains: %s', (beaten) => {
    const result = single('remains_pickup', { spiders_beaten: beaten });
    expect(result.trace.length > 0).toBe(beaten);
    if (beaten)
      expect(result.state).toMatchObject({
        pickup_action_cost: 1,
        remains_enc: 8,
        backpacks_required: 1,
      });
  });
  it.each([1, 2])('uses later 1d2 Giant spiders from the outside opening: %s', (count) => {
    expect(
      single('wandering_spiders', { later_wandering_monster: true, spider_roll: count }).state,
    ).toMatchObject({
      giant_spiders: count,
      wandering_monster_origin: 'opening from where the light comes',
    });
  });
  it('keeps wandering-spider activation as an explicit source uncertainty', () => {
    const rule = corpus.rules.find((x) => x.id === 'core.quest.grieving_mother.wandering_spiders')!;
    expect(rule.issues).toContain('issue.quest.grieving_mother_wandering_activation');
    expect(rule.fields.later_wandering_monster?.description).toContain('chosen interpretation');
  });
  it('forces Ghostly Event 8 on failure, without applying its resource effects here', () => {
    const result = single('failure', { side_quest_failed: true });
    expect(result.state).toMatchObject({
      automatic_ghostly_event: true,
      next_ghostly_event: 8,
      ghostly_event_time: 'before the next quest',
    });
    expect(result.events).toEqual([]);
    expect(single('failure', { side_quest_failed: false }).trace).toEqual([]);
  });
  it.each([
    [false, true, false],
    [true, false, false],
    [true, true, true],
  ])('requires return and burial for the successful aftermath: %s/%s', (back, buried, success) => {
    const result = single('success', { back_at_estate: back, remains_buried: buried });
    expect(result.trace.length > 0).toBe(success);
    if (success)
      expect(result.state).toMatchObject({
        mother_never_seen_again: true,
        reward_item: 'Longsword',
        reward_magical: true,
        reward_damage_bonus: 2,
        reward_time: 'next morning',
        reward_location: 'dining table',
      });
  });
  it('binds Ghostly Event 6 to the extracted quest and preserves retry/success replacement', () => {
    const event = corpus.rules.find((x) => x.id === 'character.settlement.ghost_event.6')!;
    expect(event.unresolved_references).toBeUndefined();
    expect(event.dependencies).toContainEqual({
      key: 'grieving_mother',
      label: 'The Grieving Mother side quest',
      object_id: 'quest.estate.grieving_mother',
    });
    const inputs: State = { selected: true };
    expect(runCase({ rule_ids: [event.id], inputs } as TestCase, corpus).state).toMatchObject({
      if_previously_succeeded: 'treat as result 2',
      retry_after_failure_allowed: true,
    });
  });
  it('keeps all local rules and the unique reward tied to the real quest', () => {
    const quest = corpus.entities.find((x) => x.id === 'quest.estate.grieving_mother')!;
    expect(quest.rules).toHaveLength(14);
    for (const id of quest.rules)
      expect(corpus.rules.find((x) => x.id === id)).toMatchObject({
        type: 'scenario_rule',
        scope: 'quest',
        quest_id: quest.id,
      });
    expect(
      corpus.entities.find((x) => x.id === 'equipment.quest.grieving_mother_longsword'),
    ).toMatchObject({ type: 'equipment', category: 'weapon', quest_id: quest.id });
  });
});
