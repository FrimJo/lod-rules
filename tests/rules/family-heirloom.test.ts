import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const result = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.family_heirloom.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => result(suffix, inputs).state;
describe('Retrieving the Family Heirloom — PDF259–260', () => {
  it('preserves quest setup and corpse exception', () => {
    expect(run('setup')).toMatchObject({
      location: 'In the settlement',
      corridors: 8,
      rooms: 8,
      room_tiles: 'R1B-8B',
      advertised_reward_per_hero: 300,
      encounters: 'Undead',
    });
    expect(run('brotherhood_corpses')).toMatchObject({
      ignore_dead_brotherhood_special_rules: true,
      brotherhood_corpses_treated_as: 'dead adventurers',
      search_as_dead_adventurers: true,
    });
    expect(run('objective_setup')).toMatchObject({
      tombs: 6,
      initial_enemies: 0,
      hero_position: 'where they were when the door was opened',
      door_side: 'short side',
    });
  });
  it('checks every Threat cell', () => {
    const threat = corpus.tables.find((x) => x.id === 'table.quest.family_heirloom.threat');
    expect(threat?.rows[0]?.cells).toEqual({
      start: {
        type: 'dice',
        printed: '1d4+1',
        dice: { count: 1, sides: 4, modifier: 1 },
        meaning: 'initial',
      },
      min: { type: 'text', printed: 'Same as start lvl' },
      max: { type: 'number', printed: '18', value: 18, meaning: 'value' },
    });
  });
  it.each([7, 8, 9, 10])('tests Scenario threshold %s', (roll) => {
    expect(run('scenario_trigger', { scenario_roll: roll }).scenario_die_triggered === true).toBe(
      roll >= 8,
    );
  });
  it('retains the six-card pool and shuffling instruction', () => {
    expect(run('cards')).toMatchObject({
      playing_cards: 6,
      black_cards: 3,
      red_cards: 1,
      dressed_cards: 2,
      shuffle_cards: true,
      cards_face_down: true,
    });
  });
  it.each([
    [1, true],
    [2, false],
    [2, true],
  ])('requires two heroes and a complete turn: %s/%s', (heroes, complete) => {
    const state = run('open_tomb', {
      heroes_working_together: heroes,
      complete_turn_spent: complete,
    });
    expect(state.lid_removed === true).toBe(heroes === 2 && complete);
    expect(state.cards_to_draw === 1).toBe(heroes === 2 && complete);
  });
  it.each(['Black', 'Red', 'Dressed Card'])('selects only the supplied category %s', (category) => {
    const suffixes = ['black_card', 'red_card', 'dressed_card'];
    const inputs: State = { lid_removed: true, drawn_card_category: category };
    const state = runCase(
      {
        rule_ids: suffixes.map((x) => `core.quest.family_heirloom.${x}`),
        inputs,
      } as TestCase,
      corpus,
    );
    const expected = suffixes[['Black', 'Red', 'Dressed Card'].indexOf(category)];
    expect(state.trace).toEqual([`core.quest.family_heirloom.${expected}`]);
    if (category === 'Black')
      expect(state.state).toMatchObject({
        mummified_corpse_found: true,
        other_contents_found: false,
      });
    if (category === 'Red') expect(state.state.sword_retrieved).toBe(true);
    if (category === 'Dressed Card')
      expect(state.state).toMatchObject({
        mummy_placement: 'next to the tomb',
        commence_combat: true,
      });
    expect(state.state).not.toHaveProperty('mummy_hp');
  });
  it.each(['black_card', 'red_card', 'dressed_card'])(
    'does not resolve %s before removing the lid',
    (suffix) => {
      expect(
        result(suffix, {
          lid_removed: false,
          drawn_card_category:
            { black_card: 'Black', red_card: 'Red', dressed_card: 'Dressed Card' }[suffix] ?? '',
        }).trace,
      ).toEqual([]);
    },
  );
  it.each([
    [true, true, true],
    [false, true, true],
    [true, false, true],
    [true, true, false],
  ])('gates reward on sword, surface and presentation: %s/%s/%s', (sword, surface, presented) => {
    const state = run('reward', {
      sword_retrieved: sword,
      heroes_back_at_surface: surface,
      sword_presented_to_knight: presented,
    });
    expect(state.reward_per_hero === 300).toBe(sword && surface && presented);
    expect(state.sword_handed_to_knight === true).toBe(sword && surface && presented);
  });
});
