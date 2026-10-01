import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const execute = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.mushrooms.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => execute(suffix, inputs).state;
describe('Mushrooms — PDF279', () => {
  it('retains inherited setup, habitat and total advertised reward', () =>
    expect(run('setup')).toEqual({
      location: 'same dungeon as the next quest',
      advertised_reward_coins: 250,
      encounters: 'as defined by the main quest',
      objective_room: 'No specific room',
      mushroom_habitat: 'indoors in dark, damp areas',
    }));
  it.each([1, 12, 18])('uses the same number of auxiliary cards %s', (count) => {
    expect(run('deck', { dungeon_deck_done: true, dungeon_deck_cards: count })).toMatchObject({
      auxiliary_deck_cards: count,
      chosen_objective_cards: 1,
      mix_auxiliary_deck: true,
      auxiliary_deck_next_to_ordinary: true,
    });
    expect(
      execute('deck', { dungeon_deck_done: false, dungeon_deck_cards: count }).trace,
    ).toHaveLength(0);
  });
  it.each(['room', 'corridor', 'other'])(
    'draws on searched %s regardless of roll success',
    (kind) => {
      for (const success of [true, false]) {
        const result = execute('search_draw', {
          search_attempt_made: true,
          searched_tile_kind: kind,
          search_roll_succeeded: success,
        });
        expect(result.trace).toHaveLength(kind === 'other' ? 0 : 1);
        if (kind !== 'other')
          expect(result.state).toMatchObject({
            auxiliary_cards_to_draw: 1,
            search_roll_success_required: false,
            search_takes_time: true,
          });
      }
      expect(
        execute('search_draw', { search_attempt_made: false, searched_tile_kind: kind }).trace,
      ).toHaveLength(0);
    },
  );
  it.each([true, false])('finds mushrooms only on the objective card: %s', (card) => {
    for (const success of [true, false])
      expect(
        execute('found', {
          search_attempt_made: true,
          searched_tile_kind: 'room',
          drawn_card_is_side_quest_objective: card,
          search_roll_succeeded: success,
        }).trace,
      ).toHaveLength(card ? 1 : 0);
    expect(
      execute('found', {
        search_attempt_made: false,
        searched_tile_kind: 'room',
        drawn_card_is_side_quest_objective: card,
      }).trace,
    ).toHaveLength(0);
  });
  it.each([true, false])('requires returning a specimen for payment: %s', (returned) => {
    expect(execute('reward', { specimen_brought_back_to_alchemist: returned }).trace).toHaveLength(
      returned ? 1 : 0,
    );
    if (returned)
      expect(run('reward', { specimen_brought_back_to_alchemist: true })).toMatchObject({
        reward_coins: 250,
        alchemist_payment_received: true,
      });
  });
  it.each([0, 1, 2])('requires a day after the payment aftermath for delivery: %s', (days) => {
    const result = execute('gift', {
      alchemist_payment_received: true,
      days_since_alchemist_payment: days,
    });
    expect(result.trace).toHaveLength(days >= 1 ? 1 : 0);
    if (days >= 1)
      expect(result.state).toMatchObject({
        new_healing_potion_delivered: true,
        potions_delivered: 1,
      });
    expect(
      execute('gift', { alchemist_payment_received: false, days_since_alchemist_payment: days })
        .trace,
    ).toHaveLength(0);
  });
  it.each([2, 12])('retains healing boundary %s only on consumption', (healing) => {
    expect(run('potion').potion_healing_dice).toBe('2d6');
    expect(
      run('consume', {
        new_healing_potion_available: true,
        new_healing_potion_consumed: true,
        potion_healing_roll: healing,
      }).potion_hp_healing,
    ).toBe(healing);
    expect(
      execute('consume', {
        new_healing_potion_available: true,
        new_healing_potion_consumed: false,
        potion_healing_roll: healing,
      }).trace,
    ).toHaveLength(0);
    expect(
      execute('consume', {
        new_healing_potion_available: false,
        new_healing_potion_consumed: true,
        potion_healing_roll: healing,
      }).trace,
    ).toHaveLength(0);
  });
});
