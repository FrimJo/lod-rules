import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const execute = (suffixes: string[], inputs: State = {}) =>
  runCase(
    { rule_ids: suffixes.map((suffix) => `core.quest.hierophant.${suffix}`), inputs } as TestCase,
    corpus,
  );
const run = (suffix: string, inputs: State = {}) => execute([suffix], inputs).state;
describe('Tomb of the Hierophant — PDF266–267', () => {
  it('checks all Threat cells, counts, exclusion and standard pool', () => {
    const table = corpus.tables.find((x) => x.id === 'table.quest.hierophant.threat');
    expect(table?.rows[0]?.cells).toEqual({
      start: { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'initial' },
      min: { type: 'text', printed: 'Same as start lvl' },
      max: { type: 'number', printed: '20', value: 20, meaning: 'value' },
    });
    expect(run('setup')).toMatchObject({
      location: 'Ancient Lands, random',
      corridors: 7,
      rooms: 7,
      random_room_exclusion: 'R22',
      advertised_reward_per_hero: 300,
      extra_rewards_possible: true,
      encounters: 'Ancient Lands',
    });
    expect(run('standard_room_pool', { ancient_tiles_available: false })).toMatchObject({
      random_room_pool: 'R2B, R4B-8B, R1, R4-R6, R9-R11, R14, R16, R17',
      all_corridors_available: true,
    });
    expect(run('standard_room_pool', { ancient_tiles_available: true })).not.toHaveProperty(
      'random_room_pool',
    );
  });
  it.each([
    [0, false, true],
    [3, false, true],
    [4, false, true],
    [0, true, true],
    [0, false, false],
  ])('guards Furniture rerolls %s/%s/%s', (used, already, furniture) => {
    expect(
      run('furniture_reroll', {
        furniture_rerolls_used_this_quest: used,
        already_a_reroll: already,
        furniture_chart_roll: furniture,
      }).furniture_reroll_allowed === true,
    ).toBe(used < 4 && !already && furniture);
  });
  it('retains the exact 14-card composition and flips only for new tiles', () => {
    expect(run('card_deck')).toMatchObject({
      playing_cards: 14,
      ordinary_red_cards: 11,
      special_cards: 'Ace of Spades, 2 of Spades, 3 of Spades',
      mix_deck: true,
    });
    expect(run('new_tile_card', { entering_new_tile: true }).cards_to_flip).toBe(1);
    expect(run('new_tile_card', { entering_new_tile: false })).not.toHaveProperty('cards_to_flip');
  });
  it.each(['Ace of Spades', '2 of Spades', '3 of Spades', 'red card'])(
    'gates artifact acquisition by card %s and cleared room',
    (card) => {
      for (const clear of [true, false]) {
        expect(
          run('statue', { drawn_card: card, room_clear_of_monsters: clear }).statue_acquired ===
            true,
        ).toBe(card === 'Ace of Spades' && clear);
        expect(
          run('tablet', { drawn_card: card, room_clear_of_monsters: clear }).tablet_acquired ===
            true,
        ).toBe(card === '3 of Spades' && clear);
      }
    },
  );
  it.each([true, false])('requires an opened door on 2 of Spades: %s', (opened) => {
    expect(
      run('fire_trap', { drawn_card: '2 of Spades', door_opened: opened }).fire_trap_triggered ===
        true,
    ).toBe(opened);
    expect(
      run('fire_trap', { drawn_card: 'Ace of Spades', door_opened: opened }),
    ).not.toHaveProperty('fire_trap_triggered');
    if (opened)
      expect(run('fire_trap', { drawn_card: '2 of Spades', door_opened: true })).toMatchObject({
        each_hero_dodge_required: true,
        fire_damage_dice: '1d12',
      });
  });
  it.each([1, 12])('retains fire-damage boundary %s per failed hero', (damage) => {
    expect(
      run('fire_damage', {
        fire_trap_triggered: true,
        hero_dodge_succeeded: false,
        fire_damage_roll: damage,
      }).fire_damage,
    ).toBe(damage);
    expect(
      run('fire_damage', {
        fire_trap_triggered: true,
        hero_dodge_succeeded: true,
        fire_damage_roll: damage,
      }),
    ).not.toHaveProperty('fire_damage');
    expect(
      run('fire_dodge', { fire_trap_triggered: true, hero_dodge_succeeded: true }).fire_damage,
    ).toBe(0);
  });
  it.each([true, false])('isolates Objective Room variant %s', (access) => {
    const prefix = access ? 'ancient' : 'standard';
    const state = run(`${prefix}_objective_setup`, { ancient_tiles_available: access });
    expect(state).toMatchObject({
      objective_tile: access ? 'R22' : 'R1B',
      djet_type: 'Mummy Priest',
      djet_position: 'next to the sarcophagus',
      encounter_table_rolls: 2,
      enemy_placement:
        'on the tile the heroes vacated before moving to the tile they currently occupy',
      sarcophagus_position: 'centre of the room',
    });
    if (!access)
      expect(state).toMatchObject({
        dead_adventurer_present: false,
        dead_adventurer_search_allowed: false,
      });
    if (access) expect(state).not.toHaveProperty('dead_adventurer_search_allowed');
    expect(
      run(`${prefix}_objective_setup`, { ancient_tiles_available: !access }),
    ).not.toHaveProperty('objective_tile');
    expect(
      run(`${prefix}_sarcophagus`, {
        ancient_tiles_available: access,
        searching_djet_sarcophagus: true,
        search_result_is_mummy: true,
      }),
    ).toMatchObject({ ignore_mummy_search_result: true, spawn_another_mummy: false });
  });
  it('preserves the Standard aftermath omission', () => {
    const ancient = run('ancient_tome', {
      ancient_tiles_available: true,
      chamber_goes_quiet: true,
    });
    expect(ancient).toMatchObject({
      tome_found: true,
      tome_automatically_collected: true,
      additional_sarcophagus_search_allowed: true,
    });
    const standard = run('standard_tome', {
      ancient_tiles_available: false,
      chamber_goes_quiet: true,
    });
    expect(standard.tome_found).toBe(true);
    expect(standard).not.toHaveProperty('tome_automatically_collected');
    expect(standard).not.toHaveProperty('additional_sarcophagus_search_allowed');
    expect(
      run('ancient_tome', { ancient_tiles_available: true, chamber_goes_quiet: false }),
    ).not.toHaveProperty('tome_found');
  });
  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])('keeps statue/tablet bonuses independent: %s/%s', (statue, tablet) => {
    const state = execute(['base_reward', 'statue_bonus', 'tablet_bonus'], {
      chamber_goes_quiet: true,
      back_at_outpost: true,
      statue_brought_back: statue,
      tablet_brought_back: tablet,
    });
    expect(state.state.base_reward_per_hero).toBe(300);
    expect(state.state.statue_bonus_per_hero === 100).toBe(statue);
    expect(state.state.tablet_bonus_per_hero === 100).toBe(tablet);
    expect(state.trace).toHaveLength(1 + Number(statue) + Number(tablet));
  });
  it.each(['hand_in', 'learn_spell'])(
    'separates grimoire disposition %s without granting a spell',
    (disposition) => {
      const state = execute(['grimoire_handover', 'grimoire_learning'], {
        back_at_outpost: true,
        grimoire_available: true,
        grimoire_disposition: disposition,
        hero_is_wizard: true,
      });
      expect(state.state.grimoire_bonus_per_hero === 200).toBe(disposition === 'hand_in');
      expect(state.state.grimoire_learning_allowed === true).toBe(disposition === 'learn_spell');
      expect(state.events).toEqual(
        disposition === 'learn_spell'
          ? [{ type: 'invoke', dependency: 'procedure.learn_spell' }]
          : [],
      );
      expect(state.trace).toHaveLength(1);
      expect(state.state).not.toHaveProperty('spell_known');
    },
  );
  it('rejects missing book, nonwizard learning and premature rewards', () => {
    expect(
      run('grimoire_learning', {
        back_at_outpost: true,
        grimoire_available: true,
        grimoire_disposition: 'learn_spell',
        hero_is_wizard: false,
      }),
    ).not.toHaveProperty('grimoire_learning_allowed');
    expect(
      run('grimoire_handover', {
        back_at_outpost: true,
        grimoire_available: false,
        grimoire_disposition: 'hand_in',
      }),
    ).not.toHaveProperty('grimoire_bonus_per_hero');
    expect(
      run('base_reward', { chamber_goes_quiet: false, back_at_outpost: true }),
    ).not.toHaveProperty('base_reward_per_hero');
    expect(
      run('base_reward', { chamber_goes_quiet: true, back_at_outpost: false }),
    ).not.toHaveProperty('base_reward_per_hero');
    expect(
      run('statue_bonus', { back_at_outpost: false, statue_brought_back: true }),
    ).not.toHaveProperty('statue_bonus_per_hero');
    expect(
      run('tablet_bonus', { back_at_outpost: false, tablet_brought_back: true }),
    ).not.toHaveProperty('tablet_bonus_per_hero');
  });
});
