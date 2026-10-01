import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.slaying_fiend.${suffix}`], inputs } as TestCase, corpus).state;
const table = (suffix: string) => {
  const result = corpus.tables.find((x) => x.id === `table.quest.slaying_fiend.${suffix}`);
  if (!result) throw new Error(`Missing ${suffix}`);
  return result;
};
describe('Slaying the Fiend — rendered PDF256', () => {
  it('retains every setup distinction', () => {
    expect(run('setup')).toMatchObject({
      location: 'Random',
      special_rules_printed: '-',
      corridors: 8,
      rooms: 8,
      reward_printed: 'None',
      encounters: 'Beast',
    });
    expect(run('molgor')).toMatchObject({
      species: 'Minotaur',
      weapon: 'Greataxe',
      armour: 2,
      frenzy: true,
      ferocious_charge: true,
    });
  });
  it('checks all Threat cells', () => {
    expect(table('threat').rows[0]?.cells).toEqual({
      start: {
        type: 'dice',
        printed: '1d4+2',
        dice: { count: 1, sides: 4, modifier: 2 },
        meaning: 'initial',
      },
      min: { type: 'text', printed: 'Same as start lvl' },
      max: { type: 'number', printed: '20', value: 20, meaning: 'value' },
    });
  });
  it('checks all nine printed statistics without replacing the RS dash', () => {
    expect(Object.values(table('molgor').rows[0]?.cells ?? {}).map((x) => x.printed)).toEqual([
      '60',
      '-',
      '3',
      '3',
      '40',
      '-10',
      '55',
      '6',
      '45',
    ]);
    expect(table('molgor').rows[0]?.cells.rs).toEqual({
      type: 'marker',
      printed: '-',
      meaning: 'not_specified',
    });
  });
  it('checks all prior-wound table cells', () => {
    expect(
      table('prior_wounds').rows.map((x) => [x.cells.roll?.printed, x.cells.wounds?.printed]),
    ).toEqual([
      ['1', '2d6'],
      ['2', '1d10'],
      ['3', '1d6+1'],
      ['4', '1d4'],
      ['5', '1d3'],
      ['6', '1'],
    ]);
    expect(table('prior_wounds').rows.map((x) => x.cells.wounds)).toEqual([
      { type: 'dice', printed: '2d6', dice: { count: 2, sides: 6 }, meaning: 'value' },
      { type: 'dice', printed: '1d10', dice: { count: 1, sides: 10 }, meaning: 'value' },
      {
        type: 'dice',
        printed: '1d6+1',
        dice: { count: 1, sides: 6, modifier: 1 },
        meaning: 'value',
      },
      { type: 'dice', printed: '1d4', dice: { count: 1, sides: 4 }, meaning: 'value' },
      { type: 'dice', printed: '1d3', dice: { count: 1, sides: 3 }, meaning: 'value' },
      { type: 'number', printed: '1', value: 1, meaning: 'value' },
    ]);
  });
  it.each([
    [1, 2, 12],
    [2, 1, 10],
    [3, 2, 7],
    [4, 1, 4],
    [5, 1, 3],
    [6, 1, 1],
  ])('subtracts branch %s from initial 45 HP', (roll, min, max) => {
    for (let wounds = min; wounds <= max; wounds++) {
      expect(
        run(`prior_wounds_${roll}`, { wound_table_roll: roll, prior_wounds: wounds })
          .molgor_starting_hp,
      ).toBe(45 - wounds);
    }
    expect(
      run(`prior_wounds_${roll}`, {
        wound_table_roll: roll === 6 ? 1 : roll + 1,
        prior_wounds: min,
      }),
    ).not.toHaveProperty('molgor_starting_hp');
  });
  it.each([1, 2, 3])('places heroes at distance %s with both Molgor boundaries', (hero) => {
    for (const molgor of [1, 6]) {
      expect(
        run('placement', { hero_placement_roll: hero, molgor_placement_roll: molgor }),
      ).toMatchObject({
        hero_distance_from_door: hero,
        molgor_distance_from_idol: molgor,
        hero_entry: 'short side',
        molgor_direction: 'toward the heroes',
        idol_position: 'far end of the room',
      });
    }
  });
  it('guards aftermath and exposes unknown gold without a numeric award', () => {
    expect(run('aftermath', { molgor_defeated: false })).not.toHaveProperty('objective_chests');
    const loot = run('aftermath', { molgor_defeated: true });
    expect(loot).toMatchObject({
      gold_pile_found: true,
      objective_chests: 2,
      chests_locked: false,
      chests_trapped: false,
      treasure_tables_required: true,
    });
    expect(loot).not.toHaveProperty('gold_quantity');
  });
});
