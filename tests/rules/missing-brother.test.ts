import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const execute = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.missing_brother.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => execute(suffix, inputs).state;
describe('The Missing Brother — PDF274', () => {
  it('retains main-quest location, encounters, reward and progressive reading', () =>
    expect(run('setup')).toEqual({
      location: 'same dungeon as the next quest',
      advertised_reward_per_hero: 100,
      encounters: 'as defined by the main quest',
      read_sections_one_at_a_time: true,
    }));
  it('prepares the unseen extra room only once the main pile is done', () => {
    expect(run('deck', { main_card_pile_done: true })).toMatchObject({
      extra_room_cards: 1,
      extra_room_card_kept_unseen: true,
      side_quest_card_to_add: 'Side Quest 1',
    });
    expect(execute('deck', { main_card_pile_done: false }).trace).toHaveLength(0);
  });
  it.each([true, false])('replaces a drawn Side Quest 1 card: %s', (drawn) => {
    expect(execute('room_card', { side_quest_1_drawn: drawn }).trace).toHaveLength(drawn ? 1 : 0);
    if (drawn)
      expect(run('room_card', { side_quest_1_drawn: true })).toMatchObject({
        replace_side_quest_card_with_extra_room_card: true,
        extra_room_is_side_quest_objective: true,
      });
  });
  it.each([
    [true, false],
    [true, true],
    [false, false],
    [false, true],
  ])('requires a choice only for main objective first: %s/%s', (main, side) =>
    expect(
      execute('main_objective_first', {
        main_objective_room_found: main,
        side_quest_room_found: side,
      }).trace,
    ).toHaveLength(main && !side ? 1 : 0),
  );
  it('preserves ordinary and Archer placement separately on opening the door', () => {
    expect(run('objective', { side_quest_objective_door_opened: true })).toMatchObject({
      fight_already_ongoing: true,
      fighter_placement: 'one of the far corners',
      encounter_table_rolls: 2,
      ordinary_enemy_placement: 'as close to the survivor as possible',
      archer_placement: 'as far away from the fighter as possible',
      archer_excluded_squares: 'the 2 squares next to the door where the heroes are',
    });
    expect(execute('objective', { side_quest_objective_door_opened: false }).trace).toHaveLength(0);
    expect(run('targeting', { side_quest_objective_door_opened: true })).toMatchObject({
      heroes_may_continue_turn: true,
      enemies_target_only_heroes: true,
    });
  });
  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('requires the side room and last enemy dead for rescue: %s/%s', (room, dead) => {
    const result = execute('found', { side_quest_room_found: room, last_enemy_dead: dead });
    expect(result.trace).toHaveLength(room && dead ? 1 : 0);
    if (room && dead)
      expect(result.state).toMatchObject({
        missing_brother_rescued: true,
        brother_not_heavily_wounded: true,
        brother_heads_to_city: true,
      });
  });
  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('requires rescue and return before payment: %s/%s', (rescued, returned) => {
    const result = execute('reward', { missing_brother_rescued: rescued, back_in_city: returned });
    expect(result.trace).toHaveLength(rescued && returned ? 1 : 0);
    if (rescued && returned)
      expect(result.state).toMatchObject({ reward_per_hero: 100, reward_payer: 'sister' });
  });
  it('retains the unsuccessful tavern aftermath without inventing a penalty', () => {
    expect(run('not_found', { brother_not_found: true, back_at_tavern: true })).toMatchObject({
      sister_leaves_tavern: true,
    });
    expect(run('not_found', { brother_not_found: true, back_at_tavern: true })).not.toHaveProperty(
      'coins_lost',
    );
    expect(
      execute('not_found', { brother_not_found: false, back_at_tavern: true }).trace,
    ).toHaveLength(0);
  });
});
