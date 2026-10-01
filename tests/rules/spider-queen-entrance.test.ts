import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.spider_queen_entrance.${suffix}`], inputs } as TestCase, corpus);

describe('Lair of the Spider Queen — introduction and Entrance, PDF237–239', () => {
  it('distinguishes Whiteport campaign start from White40 acceptance and per-hero advertised reward', () => {
    expect(
      corpus.entities.find((entity) => entity.id === 'quest_actor.spider_queen.wizard'),
    ).toMatchObject({
      type: 'quest_actor',
      quest_id: 'quest.spider_queen.campaign',
      rules: ['core.quest.spider_queen_campaign.opening'],
      tables: [],
    });
    expect(
      runCase(
        { rule_ids: ['core.quest.spider_queen_campaign.opening'], inputs: {} } as TestCase,
        corpus,
      ).state,
    ).toEqual({
      campaign_start: 'Whiteport',
      quest_location: 'White 40',
      accept_quest_at_location: true,
      objective: 'locate the sceptre buried with Queen Araneae',
      reward_per_hero: 1200,
    });
  });
  it('excludes R17 from the ordinary pool while retaining it as the secondary override', () => {
    expect(run('setup').state).toMatchObject({
      rooms: 7,
      corridors: 7,
      excluded_corridor: 'C16',
      excluded_rooms: 'R17, R1',
      secondary_quest_card: 1,
      secondary_card_position: 'mixed in with the first half of the pile',
      encounters: 'Orcs and Goblins',
      objective_room: 'The Chamber of Reverence',
    });
    expect(run('secondary_setup').state).toEqual({
      room: 'R17',
      place_immediately: true,
      normal_room_rules_replaced: true,
      empty_hall: true,
      treasure_pile_in_play: false,
      exit_doors: 2,
      ettin_placement: 'far side against the wall',
      orcs: 2,
      orc_placement: 'one on either side of the Ettin',
    });
  });
  it('preserves the mechanical Warhammer instead of substituting the narrative club', () => {
    expect(run('amburr').state).toEqual({
      enemy_kind: 'standard Ettin',
      weapon: 'filthy Warhammer',
      wounding_hit_may_cause_disease: true,
    });
    expect(
      corpus.rules
        .find((x) => x.id.endsWith('spider_queen_entrance.amburr'))
        ?.unresolved_references?.join(' '),
    ).toContain('unavailable Bestiary');
  });
  it('retains both named Orc brutes and their equipment without absent stat grids', () => {
    expect(run('grop_and_digg').state).toEqual({
      enemy_kind: 'orc brutes',
      enemies: 2,
      armour: 2,
      weapon: 'battleaxes',
      shields: true,
    });
    const actors = corpus.entities.filter(
      (x) => x.type === 'quest_actor' && x.quest_id === 'quest.spider_queen.entrance',
    );
    expect(actors.map((x) => x.id).sort()).toEqual([
      'quest_actor.spider_queen.amburr',
      'quest_actor.spider_queen.digg',
      'quest_actor.spider_queen.grop',
      'quest_actor.spider_queen.grotto',
    ]);
    expect(actors.every((x) => x.tables?.length === 0)).toBe(true);
  });
  it('takes Amburr’s dark-metal spider amulet as a real linked item', () => {
    expect(run('secondary_aftermath', { fallen_creatures_examined: true }).state).toEqual({
      fallen_creatures_examined: true,
      spider_amulet_found: true,
      amulet_source: 'Amburr',
      amulet_shape: 'spider',
      amulet_material: 'some kind of dark metal',
    });
    expect(corpus.entities.find((x) => x.id === 'equipment.quest.spider_amulet')?.rules).toContain(
      'core.quest.spider_queen_entrance.aftermath',
    );
  });
  it('does not grant the amulet before examining the fallen creatures', () => {
    expect(
      run('secondary_aftermath', { fallen_creatures_examined: false }).state,
    ).not.toHaveProperty('spider_amulet_found');
  });
  it('keeps objective geometry, enemy orientation, current turn and ordinary searches', () => {
    expect(run('objective_setup').state).toEqual({
      hero_entry: 'short side opposite the statue',
      orcs: 5,
      orc_chieftains: 1,
      enemies_distance_from_statue: 2,
      enemies_back_towards_heroes: true,
      heroes_continue_their_turn: true,
      table_search_normal: true,
      statue_search_normal: true,
    });
  });
  it('preserves Battlehammers versus the chieftain’s Greataxe and different armour', () => {
    expect(run('objective_equipment').state).toEqual({
      chieftain_weapon: 'Greataxe',
      chieftain_armour: 3,
      orc_weapon: 'Battlehammers',
      orc_shields: true,
      orc_armour: 1,
    });
  });
  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('requires the quiet chamber and pressed amulet: %s / %s', (quiet, pressed) => {
    const result = run('aftermath', { chamber_quiet: quiet, amulet_pressed_into_imprint: pressed });
    expect(result.state.descending_stair_revealed === true).toBe(quiet && pressed);
    expect(result.state).not.toHaveProperty('amulet_consumed');
    expect(result.state).not.toHaveProperty('coins');
  });
  it('retains all three independently transcribed Threat cells and the continuation folio', () => {
    const table = corpus.tables.find((x) => x.id === 'table.quest.spider_queen_entrance.threat');
    expect(['start', 'min', 'max'].map((x) => table?.rows[0]?.cells[x]?.printed)).toEqual([
      '4',
      '4',
      '18',
    ]);
    const rule = corpus.rules.find((x) => x.id === 'core.quest.spider_queen_entrance.aftermath');
    expect(rule?.source[0]).toMatchObject({ pdf_page: 239, printed_page: 237 });
  });
});
