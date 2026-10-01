import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.spider_queen_basement.${suffix}`], inputs } as TestCase, corpus);
describe('Spider Queen Basement — PDF239–240', () => {
  it('restores previous cards and retains discretionary C18 placement and C16 objective', () => {
    expect(run('setup').state).toEqual({
      rooms: 7,
      corridors: 7,
      excluded_corridor: 'C16',
      excluded_room: 'R17',
      previous_level_cards_mixed_into_new_deck: true,
      encounters: 'Beasts',
      objective_room: 'the stairs, C16',
      objective_leads_down: true,
      starting_tile: 'C18',
      starting_door: 'far end',
      starting_hero_positions: 'as you see fit',
    });
  });
  it('mixes Secondary Quest1 before splitting so it may be last', () => {
    expect(run('secondary_card').state).toEqual({
      secondary_quest_card: 1,
      mix_secondary_before_normal_objective_division: true,
      secondary_card_may_be_last: true,
    });
  });
  it.each([
    [9, 10, true],
    [15, 16, true],
    [11, 10, false],
    [17, 16, false],
    [10, 10, false],
    [16, 16, false],
    [9, 11, false],
  ])('places only on increasing to a threshold: %s -> %s', (previous, current, triggered) => {
    const state = run('threshold', { previous_threat: previous, current_threat: current }).state;
    expect(state.wandering_monster_triggered === true).toBe(triggered);
    if (triggered)
      expect(state).toMatchObject({
        threat_reduction_on_placement: 0,
        scenario_result_ignored: true,
      });
  });
  it.each([true, false])(
    'adds Kraghul and applicable ordinary encounters only on the secondary card: %s',
    (drawn) => {
      const state = run('secondary_setup', { secondary_card_drawn: drawn }).state;
      expect(state.kraghul_added_to_room === true).toBe(drawn);
      if (drawn)
        expect(state).toMatchObject({
          ordinary_encounter_roll_required: true,
          ordinary_encounters_added_if_applicable: true,
        });
    },
  );
  it('retains all nine numeric statistics, especially RS0 and negative To hit', () => {
    const table = corpus.tables.find((x) => x.id === 'table.quest.spider_queen_basement.kraghul');
    expect(
      ['cs', 'rs', 'dmg', 'na', 'dex', 'to_hit', 'res', 'm', 'hp'].map(
        (x) => table?.rows[0]?.cells[x]?.printed,
      ),
    ).toEqual(['60', '0', '4', '3', '40', '-5', '55', '6', '50']);
    expect(run('kraghul').state).toEqual({
      enemy_kind: 'Minotaur',
      weapon: 'Greataxe',
      armour: 3,
      xp: 450,
      treasure_table: 'T4',
    });
  });
  it.each([true, false])(
    'guards the two party potions on the dead beast’s examined remains: %s',
    (examined) => {
      const state = run('secondary_aftermath', {
        kraghul_dead_and_remains_examined: examined,
      }).state;
      expect(state.antidote_potions === 2).toBe(examined);
      if (examined)
        expect(state).toMatchObject({
          identification_roll_required: false,
          ordinary_search_allowed_as_well: true,
          potion_label: 'Antidote',
        });
      expect(state).not.toHaveProperty('potion_strength');
    },
  );
  it('preserves stair darkness without inventing global trap immunity', () => {
    expect(run('objective').state).toEqual({
      stairs_safely_reached: true,
      spying_ahead_prevented_by_darkness: true,
      descend_further: true,
    });
  });
  it('retains Threat4/4/18 and the entrance’s bound next level', () => {
    const table = corpus.tables.find((x) => x.id === 'table.quest.spider_queen_basement.threat');
    expect(['start', 'min', 'max'].map((x) => table?.rows[0]?.cells[x]?.printed)).toEqual([
      '4',
      '4',
      '18',
    ]);
    expect(
      corpus.rules.find((x) => x.id === 'core.quest.spider_queen_entrance.aftermath')?.dependencies,
    ).toContainEqual({
      key: 'next_level',
      label: 'Level 2: The Basement',
      object_id: 'quest.spider_queen.basement',
    });
  });
});
