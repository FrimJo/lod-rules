import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const execute = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.amenhotep.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => execute(suffix, inputs).state;
describe('Halls of Amenhotep — PDF270', () => {
  it('checks all Threat cells and catalogue setup', () => {
    expect(
      corpus.tables.find((t) => t.id === 'table.quest.amenhotep.threat')?.rows[0]?.cells,
    ).toEqual({
      start: { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'initial' },
      min: { type: 'text', printed: 'Same as start lvl' },
      max: { type: 'number', printed: '20', value: 20, meaning: 'value' },
    });
    expect(run('setup')).toEqual({
      location: 'Ancient Lands, random',
      corridors: 6,
      rooms: 6,
      advertised_reward_per_hero: 500,
      encounters: 'Ancient Land',
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
  ])('guards rerolls %s/%s/%s', (used, already, furniture) => {
    expect(
      run('furniture_reroll', {
        furniture_rerolls_used_this_quest: used,
        already_a_reroll: already,
        furniture_chart_roll: furniture,
      }).furniture_reroll_allowed === true,
    ).toBe(used < 4 && !already && furniture);
  });
  it.each([true, false])('retains objective variant %s', (access) => {
    const suffix = access ? 'ancient_objective' : 'standard_objective';
    expect(run(suffix, { ancient_tiles_available: access })).toMatchObject({
      objective_tile: access ? 'The Ancient Throne Room' : 'The Throne room',
      entry_edge: access ? 'short' : 'long',
      encounter_table_rolls: 2,
      enemy_placement: 'randomly in the room',
    });
    expect(run(suffix, { ancient_tiles_available: !access })).not.toHaveProperty('objective_tile');
  });
  it.each([4, 5, 6])('adds exactly two tokens and Guardians only on reload %s', (reload) => {
    for (const access of [true, false]) {
      const suffix = access ? 'ancient_awakening' : 'standard_awakening';
      const result = execute(suffix, {
        ancient_tiles_available: access,
        initiative_bag_reload_number: reload,
        fight_won: false,
      });
      expect(result.trace).toHaveLength(reload === 5 ? 1 : 0);
      if (reload === 5)
        expect(result.state).toMatchObject({
          initiative_tokens_to_add: 2,
          tomb_guardians_to_add: 2,
          guardian_placement: access
            ? 'on top of the seated statues’ art on the tile'
            : 'on top of the small statues flanking the hall',
        });
      expect(
        run(suffix, {
          ancient_tiles_available: access,
          initiative_bag_reload_number: reload,
          fight_won: true,
        }),
      ).not.toHaveProperty('initiative_tokens_to_add');
    }
  });
  it('keeps statues dormant on victory before the fifth reload', () => {
    expect(
      run('statues_dormant', { fight_won: true, initiative_bag_reload_number: 4 }),
    ).toMatchObject({ statues_remain_dormant: true, tomb_guardians_to_add: 0 });
    expect(
      run('statues_dormant', { fight_won: true, initiative_bag_reload_number: 5 }),
    ).not.toHaveProperty('statues_remain_dormant');
    expect(
      run('statues_dormant', { fight_won: false, initiative_bag_reload_number: 4 }),
    ).not.toHaveProperty('statues_remain_dormant');
  });
  it.each([true, false])('opens only vacated Standard statue squares: %s', (moved) => {
    expect(
      run('standard_statue_square', {
        ancient_tiles_available: false,
        guardian_has_moved_from_statue_square: moved,
      }).vacated_statue_square_is_open === true,
    ).toBe(moved);
    expect(
      run('standard_statue_square', {
        ancient_tiles_available: true,
        guardian_has_moved_from_statue_square: moved,
      }),
    ).not.toHaveProperty('vacated_statue_square_is_open');
  });
  it('requires all evil dead for aftermath without inventing payment timing', () => {
    expect(run('aftermath', { all_evil_dead: true })).toMatchObject({
      loot_available: true,
      party_ready_to_move_on_after_looting: true,
    });
    expect(run('aftermath', { all_evil_dead: false })).not.toHaveProperty('loot_available');
    expect(run('aftermath', { all_evil_dead: true })).not.toHaveProperty('paid_reward_per_hero');
  });
});
