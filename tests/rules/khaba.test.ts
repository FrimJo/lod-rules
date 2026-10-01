import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const execute = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.khaba.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => execute(suffix, inputs).state;
describe('Crypt of Khaba — PDF271–272', () => {
  it('checks every Threat cell, tile counts, reward and Standard pool', () => {
    expect(corpus.tables.find((t) => t.id === 'table.quest.khaba.threat')?.rows[0]?.cells).toEqual({
      start: { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'initial' },
      min: { type: 'text', printed: 'Same as start lvl' },
      max: { type: 'number', printed: '20', value: 20, meaning: 'value' },
    });
    expect(run('setup')).toEqual({
      location: 'Ancient Lands, random',
      corridors: 6,
      rooms: 6,
      advertised_reward_per_hero: 500,
      encounters: 'Ancient Lands',
    });
    expect(run('standard_room_pool', { ancient_tiles_available: false })).toMatchObject({
      random_room_pool: 'R1B, R2B, R4B-R8B, R1, R4-R6, R9-R11, R14, R16, R17',
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
  ])('guards rerolls %s/%s/%s', (used, already, furniture) =>
    expect(
      run('furniture_reroll', {
        furniture_rerolls_used_this_quest: used,
        already_a_reroll: already,
        furniture_chart_roll: furniture,
      }).furniture_reroll_allowed === true,
    ).toBe(used < 4 && !already && furniture),
  );
  it('retains the twelve-card deck and flips only on new tiles', () => {
    expect(run('deck')).toEqual({
      playing_cards: 12,
      ordinary_red_cards: 11,
      special_card: 'Ace of Spades',
      mix_deck: true,
    });
    expect(run('new_tile_card', { entering_new_tile: true }).cards_to_flip).toBe(1);
    expect(execute('new_tile_card', { entering_new_tile: false }).trace).toHaveLength(0);
  });
  it.each(['Ace of Spades', 'red card'])('replaces the normal encounter only for %s', (card) => {
    const result = execute('ace_encounter', { drawn_card: card });
    expect(result.trace).toHaveLength(card === 'Ace of Spades' ? 1 : 0);
    if (card === 'Ace of Spades')
      expect(result.state).toMatchObject({
        normal_encounter_roll_used: false,
        queen_khaba_present: true,
        wights_present: 4,
      });
  });
  it('retains exact profiles without a guessed creature class or shield type', () => {
    expect(run('queen_profile')).toEqual({
      queen_weapon: 'dagger',
      queen_armour: 0,
      queen_close_combat_spells: 3,
      queen_ranged_spells: 2,
      queen_support_spells: 2,
      queen_additional_spell: 'Raise Dead',
    });
    expect(run('wight_profile')).toEqual({
      wight_weapon: 'cursed longsword',
      wight_shield: true,
      wight_armour: 2,
    });
  });
  it.each([true, false])('retains objective and fallback variant %s', (access) => {
    const p = access ? 'ancient' : 'standard';
    expect(run(`${p}_objective`, { ancient_tiles_available: access })).toMatchObject({
      objective_tile: access ? 'The Large Tomb tile' : 'The Lone Tomb room',
      entry_edge: access ? 'long' : 'short',
      encounter_table_rolls: 2,
      enemy_placement: 'randomly in the room',
      sarcophagus_count: access ? 2 : 1,
    });
    expect(run(`${p}_objective`, { ancient_tiles_available: !access })).not.toHaveProperty(
      'objective_tile',
    );
    expect(
      run(`${p}_queen`, { ancient_tiles_available: access, party_has_met_queen_khaba: false }),
    ).toMatchObject({
      queen_khaba_present: true,
      queen_placement: access
        ? 'next to one of the sarcophagi; choose which one is hers'
        : 'next to the sarcophagus',
    });
    expect(
      run(`${p}_queen`, { ancient_tiles_available: access, party_has_met_queen_khaba: false }),
    ).not.toHaveProperty('wights_present');
    expect(
      execute(`${p}_queen`, { ancient_tiles_available: access, party_has_met_queen_khaba: true })
        .trace,
    ).toHaveLength(0);
  });
  it.each([true, false])(
    'ignores another mummy only in the Queen’s sarcophagus, variant %s',
    (access) => {
      const p = access ? 'ancient' : 'standard';
      expect(
        run(`${p}_queen_sarcophagus`, {
          ancient_tiles_available: access,
          searching_queen_sarcophagus: true,
          search_result_is_mummy: true,
        }),
      ).toMatchObject({ ignore_mummy_search_result: true, spawn_another_mummy: false });
      expect(
        execute(`${p}_queen_sarcophagus`, {
          ancient_tiles_available: access,
          searching_queen_sarcophagus: false,
          search_result_is_mummy: true,
        }).trace,
      ).toHaveLength(0);
      expect(
        execute(`${p}_queen_sarcophagus`, {
          ancient_tiles_available: access,
          searching_queen_sarcophagus: true,
          search_result_is_mummy: false,
        }).trace,
      ).toHaveLength(0);
    },
  );
  it('hands the other Ancient sarcophagus to ordinary search', () => {
    expect(
      execute('ancient_other_sarcophagus', {
        ancient_tiles_available: true,
        searching_other_sarcophagus: true,
      }).events,
    ).toEqual([{ type: 'invoke', dependency: 'character.treasure.furniture.sarcophagus' }]);
    expect(
      execute('ancient_other_sarcophagus', {
        ancient_tiles_available: false,
        searching_other_sarcophagus: true,
      }).events,
    ).toEqual([]);
  });
  it('gates aftermath on all undead vanquished without a guessed payment moment', () => {
    expect(run('aftermath', { all_undead_vanquished: true })).toMatchObject({
      sceptre_found: true,
      valuables_search_available: true,
    });
    expect(execute('aftermath', { all_undead_vanquished: false }).trace).toHaveLength(0);
    expect(run('aftermath', { all_undead_vanquished: true })).not.toHaveProperty(
      'paid_reward_per_hero',
    );
  });
  it('retains the legendary staff properties without recharge or sale', () =>
    expect(run('sceptre')).toEqual({
      legendary_item: true,
      sale_allowed: false,
      weapon_kind: 'magic staff',
      contained_spell: 'Fireball',
      casts_per_dungeon_or_skirmish: 1,
      recharge_required: false,
    }));
  it.each([0, 1, 2])('allows Fireball only with an unused allowance %s', (casts) => {
    const result = execute('sceptre_cast_permission', {
      sceptre_available: true,
      current_activity_is_dungeon_or_skirmish: true,
      sceptre_fireball_casts_this_dungeon_or_skirmish: casts,
    });
    expect(result.trace).toHaveLength(casts === 0 ? 1 : 0);
    expect(result.state.sceptre_fireball_casts_this_dungeon_or_skirmish).toBe(casts);
    expect(result.events).toEqual([]);
  });
  it('requires the sceptre and a dungeon or skirmish', () => {
    for (const [available, activity] of [
      [false, true],
      [true, false],
    ] as const)
      expect(
        execute('sceptre_cast_permission', {
          sceptre_available: available,
          current_activity_is_dungeon_or_skirmish: activity,
          sceptre_fireball_casts_this_dungeon_or_skirmish: 0,
        }).trace,
      ).toHaveLength(0);
  });
});
