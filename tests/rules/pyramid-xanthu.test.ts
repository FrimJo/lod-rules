import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const result = (prefix: string, suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.${prefix}.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => result('pyramid_xanthu', suffix, inputs).state;
const intro = (suffix: string, inputs: State = {}) => result('ancient_lands', suffix, inputs).state;
describe('Ancient Lands introduction — PDF263', () => {
  it.each([true, false])('requires membership for Outpost entry, member=%s', (member) => {
    expect(intro('outpost_membership', { via_outpost: true }).league_membership_required).toBe(
      true,
    );
    expect(
      intro('outpost_eligibility', { via_outpost: true, league_member: member })
        .outpost_entry_eligible === true,
    ).toBe(member);
    expect(
      intro('outpost_eligibility', { via_outpost: false, league_member: member }),
    ).not.toHaveProperty('outpost_entry_eligible');
  });
  it('retains travel values as reminders without charging twice', () => {
    expect(intro('travel_costs', { travelling_in_ancient_lands: true })).toMatchObject({
      movement_points_per_hex: 2,
      rations_per_day_printed: 2,
      camel_reduces_travel_time: true,
    });
    expect(intro('travel_costs', { travelling_in_ancient_lands: true })).not.toHaveProperty(
      'rations_consumed',
    );
    expect(intro('travel_costs', { travelling_in_ancient_lands: false })).not.toHaveProperty(
      'movement_points_per_hex',
    );
  });
  it.each([9, 10, 11, 12])('triggers Desert Event cards at %s', (roll) => {
    expect(
      intro('travel_event', { travelling_in_ancient_lands: true, travel_event_roll: roll })
        .travel_event_required === true,
    ).toBe(roll >= 10);
    expect(
      intro('travel_event', { travelling_in_ancient_lands: false, travel_event_roll: roll }),
    ).not.toHaveProperty('travel_event_required');
  });
  it.each([true, false])('selects only the available tile variant: %s', (access) => {
    const active = access ? 'ancient_objective' : 'standard_objective';
    const inactive = access ? 'standard_objective' : 'ancient_objective';
    expect(intro(active, { ancient_tiles_available: access }).objective_room_variant).toBe(
      access ? 'Ancient Land tiles' : 'Standard tiles',
    );
    expect(intro(inactive, { ancient_tiles_available: access })).not.toHaveProperty(
      'objective_room_variant',
    );
  });
});
describe('The Pyramid of Xánthu — PDF264–265', () => {
  it('checks all Threat cells and the fallback room pool', () => {
    const table = corpus.tables.find((x) => x.id === 'table.quest.pyramid_xanthu.threat');
    expect(table?.rows[0]?.cells).toEqual({
      start: { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'initial' },
      min: { type: 'text', printed: 'Same as start lvl' },
      max: { type: 'number', printed: '20', value: 20, meaning: 'value' },
    });
    expect(run('setup')).toMatchObject({
      location: 'Ancient Lands, random',
      corridors: 7,
      rooms: 7,
      reward_printed: 'Any loot found',
      encounters: 'Ancient Lands',
    });
    expect(run('standard_room_pool', { ancient_tiles_available: false }).random_room_pool).toBe(
      'R1B, R2B, R4B-8B, R1, R4-R6, R9-R11, R14, R16, R17',
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
  ])('guards four original Furniture rerolls: %s/%s/%s', (used, already, furniture) => {
    expect(
      run('furniture_reroll', {
        furniture_rerolls_used_this_quest: used,
        already_a_reroll: already,
        furniture_chart_roll: furniture,
      }).furniture_reroll_allowed === true,
    ).toBe(used < 4 && !already && furniture);
  });
  it('keeps both room geometries distinct', () => {
    expect(run('ancient_objective_setup', { ancient_tiles_available: true })).toMatchObject({
      objective_tile: 'Large Tomb',
      hero_entry: 'one of the short edges',
      encounter_table_rolls: 2,
      enemy_placement: 'randomly in the room',
      sarcophagi: 2,
      sarcophagus_position: 'centre of the chamber',
      painted_glyphs_surround_sarcophagi: true,
    });
    expect(run('standard_objective_setup', { ancient_tiles_available: false })).toMatchObject({
      objective_tile: 'The Lone Tomb',
      hero_entry: 'one of the short edges',
      encounter_table_rolls: 2,
      enemy_placement: 'randomly in the room',
      sarcophagi: 1,
      sarcophagus_position: 'on a dais at the far end of the chamber',
    });
    expect(run('ancient_objective_setup', { ancient_tiles_available: false })).not.toHaveProperty(
      'objective_tile',
    );
    expect(run('standard_objective_setup', { ancient_tiles_available: true })).not.toHaveProperty(
      'objective_tile',
    );
  });
  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('awakens only on a trigger in the room: %s/%s', (inside, triggered) => {
    for (const access of [true, false]) {
      const prefix = access ? 'ancient' : 'standard';
      const state = run(`${prefix}_awakening`, {
        ancient_tiles_available: access,
        in_objective_room: inside,
        scenario_roll_triggered: triggered,
      });
      expect(state.xanthu_joins_fight === true).toBe(inside && triggered);
      if (inside && triggered)
        expect(state.xanthu_type).toBe(access ? 'Mummy Priest' : 'Mummy Prince');
      expect(state).not.toHaveProperty('xanthu_hp');
    }
  });
  it('does not copy Priest spells and dagger into the Prince variant', () => {
    const inputs: State = {
      ancient_tiles_available: true,
      in_objective_room: true,
      scenario_roll_triggered: true,
    };
    expect(run('ancient_awakening', inputs)).toMatchObject({
      weapon: 'dagger',
      support_spells: 2,
      ranged_spells: 2,
      close_combat_spells: 2,
      xanthu_position: 'next to one of the sarcophagi',
    });
    const standard = run('standard_awakening', { ...inputs, ancient_tiles_available: false });
    expect(standard.xanthu_position).toBe('next to the sarcophagus');
    expect(standard).not.toHaveProperty('weapon');
    expect(standard).not.toHaveProperty('ranged_spells');
  });
  it.each([
    [true, true],
    [false, true],
    [true, false],
  ])('replaces only his sarcophagus mummy result: %s/%s', (his, mummy) => {
    for (const access of [true, false])
      expect(
        run(access ? 'ancient_sarcophagus' : 'standard_sarcophagus', {
          ancient_tiles_available: access,
          searching_xanthu_sarcophagus: his,
          search_result_is_mummy: mummy,
        }).sarcophagus_search_result === 'nothing',
      ).toBe(his && mummy);
  });
  it.each([true, false])(
    'requires a quiet chamber before the single objective chest: %s',
    (quiet) => {
      for (const access of [true, false])
        expect(
          run(access ? 'ancient_aftermath' : 'standard_aftermath', {
            ancient_tiles_available: access,
            chamber_goes_quiet: quiet,
          }).objective_chests === 1,
        ).toBe(quiet);
    },
  );
});
