import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string) =>
  runCase({ rule_ids: [`core.quest.mapmaker.${suffix}`], inputs: {} } as TestCase, corpus);
describe('The Mapmaker — PDF276', () => {
  it('retains total reward, inherited location/encounters and no objective room', () =>
    expect(run('setup').state).toEqual({
      location: 'same dungeon as the next quest',
      advertised_reward_coins: 500,
      encounters: 'as defined by the main quest',
      objective_room: 'None',
    }));
  it('requires survival over outward journey, dungeon and return', () =>
    expect(run('escort').state.escort_alive_requirement).toBe(
      'journey from the city, through the dungeon, and back again',
    ));
  it('retains player movement control alongside the two-square preference', () =>
    expect(run('model_movement').state).toEqual({
      represented_by_model: true,
      players_control_movement: true,
      strives_to_be_within_squares_of_hero: 2,
    }));
  it('forbids fighting and enemy interaction but permits Dodge45', () => {
    expect(run('restrictions').state).toEqual({
      may_fight: false,
      may_interact_with_enemy: false,
      may_try_dodge: true,
    });
    expect(run('dodge').state.mapmaker_dodge).toBe(45);
    expect(run('dodge').trace).toHaveLength(1);
  });
  it('checks all ten statistics cells and two source header bands', () => {
    const table = corpus.tables.find((t) => t.id === 'table.quest.mapmaker.statistics');
    expect(table?.columns.map((c) => c.label)).toEqual([
      'CS',
      'RS',
      'DEX',
      'RES',
      'DMG/NA',
      'To hit',
      'Luck',
      'M',
      'HP',
      'Energy',
    ]);
    expect(table?.rows[0]?.cells).toEqual({
      cs: { type: 'text', printed: '-' },
      rs: { type: 'text', printed: '-' },
      dex: { type: 'number', printed: '25', value: 25, meaning: 'value' },
      res: { type: 'number', printed: '35', value: 35, meaning: 'value' },
      dmg_na: { type: 'text', printed: '-' },
      to_hit: { type: 'number', printed: '-5', value: -5, meaning: 'value' },
      luck: { type: 'number', printed: '0', value: 0, meaning: 'value' },
      m: { type: 'number', printed: '4', value: 4, meaning: 'value' },
      hp: { type: 'number', printed: '10', value: 10, meaning: 'value' },
      energy: { type: 'number', printed: '0', value: 0, meaning: 'value' },
    });
  });
});
