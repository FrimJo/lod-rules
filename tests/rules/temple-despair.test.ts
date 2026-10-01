import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const execute = (suffixes: string[], inputs: State = {}) =>
  runCase(
    { rule_ids: suffixes.map((s) => `core.quest.temple_despair.${s}`), inputs } as TestCase,
    corpus,
  );
const run = (suffix: string, inputs: State = {}) => execute([suffix], inputs).state;
describe('Temple of Despair — PDF268–269', () => {
  it('checks every Threat cell, tile counts, exclusion and standard pool', () => {
    expect(
      corpus.tables.find((t) => t.id === 'table.quest.temple_despair.threat')?.rows[0]?.cells,
    ).toEqual({
      start: { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'initial' },
      min: { type: 'text', printed: 'Same as start lvl' },
      max: { type: 'number', printed: '20', value: 20, meaning: 'value' },
    });
    expect(run('setup')).toMatchObject({
      corridors: 6,
      rooms: 6,
      random_room_exclusion: 'R33',
      reward: 'Any loot found',
      encounters: 'Ancient Lands',
    });
    expect(run('standard_room_pool', { ancient_tiles_available: false }).random_room_pool).toBe(
      'R1B, R2B, R4B-8B, R1, R4, R5, R9-R11, R14, R16, R17',
    );
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
    [-1, false, true],
  ])('guards four furniture rerolls %s/%s/%s', (used, already, furniture) => {
    expect(
      run('furniture_reroll', {
        furniture_rerolls_used_this_quest: used,
        already_a_reroll: already,
        furniture_chart_roll: furniture,
      }).furniture_reroll_allowed === true,
    ).toBe(used >= 0 && used < 4 && !already && furniture);
  });
  it('places a single side quest card anywhere in the deck', () => {
    expect(run('side_quest_card')).toEqual({
      side_quest_cards_to_add: 1,
      side_quest_card_position: 'random; anywhere in the deck',
    });
  });
  it.each([true, false])('separates a last card from an immediate exploration draw: %s', (last) => {
    const result = execute(['last_card', 'secondary_objective'], {
      side_quest_card_drawn: true,
      side_quest_card_is_last: last,
    });
    expect(result.trace).toHaveLength(1);
    expect(result.state.secondary_objective_removed_as_last === true).toBe(last);
    expect(result.state.secondary_objective_effect_ignored === true).toBe(last);
    expect(result.state.exploration_cards_to_draw === 1).toBe(!last);
    expect(result.state.secondary_encounter_required === true).toBe(!last);
  });
  it('does not resolve an undrawn card', () => {
    expect(
      execute(['last_card', 'secondary_objective'], {
        side_quest_card_drawn: false,
        side_quest_card_is_last: true,
      }).trace,
    ).toHaveLength(0);
  });
  it('retains the exact priest profile without a Wraith count or invented spell names', () => {
    expect(run('secondary_creatures')).toEqual({
      hierophant_type: 'Mummy Priest',
      hierophant_weapon: 'staff',
      hierophant_armour: 1,
      hierophant_close_combat_spells: 3,
      hierophant_ranged_spells: 2,
      hierophant_support_spells: 1,
      hierophant_additional_spell: 'Raise Dead',
      wraith_weapons: 'cursed greatswords',
    });
  });
  it.each([true, false])('isolates the objective variant %s', (access) => {
    const suffix = `${access ? 'ancient' : 'standard'}_objective_setup`;
    expect(run(suffix, { ancient_tiles_available: access }).objective_tile).toBe(
      access ? 'R33' : 'R6',
    );
    expect(run(suffix, { ancient_tiles_available: !access })).not.toHaveProperty('objective_tile');
  });
  it.each([true, false])(
    'replaces the ordinary encounter when the side card was removed: %s',
    (removed) => {
      const result = execute(['objective_encounter', 'replacement_encounter'], {
        objective_room_entered: true,
        secondary_objective_removed_as_last: removed,
      });
      expect(result.trace).toHaveLength(1);
      if (removed) {
        expect(result.state).toMatchObject({
          normal_encounter_roll_used: false,
          secondary_creatures_in_objective_room: true,
        });
        expect(result.state).not.toHaveProperty('encounter_table_rolls');
        expect(result.state).not.toHaveProperty('enemy_placement');
      } else
        expect(result.state).toMatchObject({
          encounter_table_rolls: 1,
          enemy_placement: 'randomly in the room',
        });
    },
  );
  it('waits for the objective room before either encounter', () => {
    for (const removed of [true, false])
      expect(
        execute(['objective_encounter', 'replacement_encounter'], {
          objective_room_entered: false,
          secondary_objective_removed_as_last: removed,
        }).trace,
      ).toHaveLength(0);
  });
  it('collects books with no invented count or payment', () => {
    expect(run('books', { temple_aftermath_reached: true }).old_books_collected).toBe(true);
    expect(run('books', { temple_aftermath_reached: false })).not.toHaveProperty(
      'old_books_collected',
    );
    expect(run('books', { temple_aftermath_reached: true })).not.toHaveProperty('reward_per_hero');
  });
  it('hands each hero to the Curses Table with the explicit next-dungeon duration', () => {
    const result = execute(['curse'], { temple_aftermath_reached: true });
    expect(result.state).toMatchObject({
      curses_to_randomise_for_this_hero: 1,
      temple_curse_active: true,
      temple_curse_duration: 'until this hero leaves their next dungeon',
    });
    expect(result.events).toEqual([{ type: 'invoke', dependency: 'table.treasure.curses' }]);
    expect(execute(['curse'], { temple_aftermath_reached: false }).events).toEqual([]);
  });
  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('expires only after the cursed hero leaves the next dungeon: %s/%s', (cursed, left) => {
    const result = execute(['curse_expiry'], {
      hero_received_temple_curse: cursed,
      hero_left_next_dungeon: left,
      temple_curse_active: true,
    });
    expect(result.state.temple_curse_active).toBe(!(cursed && left));
    expect(result.trace).toHaveLength(cursed && left ? 1 : 0);
  });
});
