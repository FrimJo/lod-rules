import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const expected = parse(
  readFileSync('tests/fixtures/settlements/catalogue-cells.yaml', 'utf8'),
) as Record<string, string[][]>;
const run = (id: string, inputs: State = {}) =>
  runCase({ rule_ids: ['character.settlement.' + id], inputs } as TestCase, corpus);

describe('settlement catalogue source cells and relationships', () => {
  it.each(Object.entries(expected))('preserves every cell in %s', (id, cells) => {
    const table = corpus.tables.find((entry) => entry.id === id)!;
    expect(
      table.rows.map((row) => table.columns.map((column) => row.cells[column.id]?.printed ?? '')),
    ).toEqual(cells);
  });
  it('links each guild equipment and furnishing row to its entity and rules', () => {
    const tables = corpus.tables.filter((table) =>
      [
        'table.guild.dark_equipment',
        'table.guild.dark_tools',
        'table.guild.fighters_equipment',
        'table.guild.rangers_equipment',
        'table.guild.sanctum_equipment',
        'table.guild.wizard_staves',
        'table.estate.furnishings',
      ].includes(table.id),
    );
    expect(tables).toHaveLength(7);
    for (const table of tables)
      for (const row of table.rows) {
        expect(row.entity_refs).toHaveLength(1);
        const entity = corpus.entities.find((entry) => entry.id === row.entity_refs![0])!;
        expect(entity.table_rows).toContainEqual({ table_id: table.id, row_id: row.id });
        expect(entity.rules.length).toBeGreaterThan(0);
        for (const id of entity.rules)
          expect(corpus.rules.some((rule) => rule.id === id)).toBe(true);
      }
  });
  it('distinguishes settlement price modifiers from sale and event exceptions', () => {
    expect(run('buying').state).toMatchObject({
      items_per_success: 1,
      failed_availability_locks_whole_party: true,
      local_price_modifier_applies_to_sales: false,
      event_price_modifier_applies_to_sales: true,
    });
    expect(run('profile.durburim').state).toMatchObject({
      weapon_availability_modifier: 1,
      armour_availability_modifier: 0,
      weapon_price_percent_modifier: 20,
      armour_price_percent_modifier: 10,
      purchased_weapons_durability_modifier: 2,
      general_equipment_availability_modifier: -1,
    });
    expect(run('profile.birnheim').state).toMatchObject({
      weapon_availability_modifier: -1,
      armour_availability_modifier: 1,
      purchased_armour_durability_modifier: 2,
    });
  });
  it('retains trap timing, targeting and armour distinctions', () => {
    expect(run('guild.dark.caltrops').state).toMatchObject({
      range_squares: 2,
      action_points: 1,
      requires_no_adjacent_enemy: true,
      requires_unarmoured_enemy: true,
      damage_die: 4,
      ends_enemy_turn: true,
    });
    expect(run('guild.dark.tripwire').state).toMatchObject({
      quick_slot_setup_turns: 1,
      span_squares: 4,
      diagonal_allowed: false,
      damage_die: 8,
      armour_and_natural_armour_apply: true,
    });
    expect(run('guild.dark.bear_trap').state).toMatchObject({
      action_points: 1,
      wounds_die: 12,
      armour_applies: false,
      affected_group_members: 1,
      target_selection: 'random',
    });
  });
  it('does not assign Dark as the Night to the cap or bracers', () => {
    for (const item of ['nightstalker_cap', 'nightstalker_bracers']) {
      expect(run('equipment.' + item, { selected: true }).state.dark_as_the_night).toBeUndefined();
    }
    expect(run('equipment.nightstalker_vest', { selected: true }).state.dark_as_the_night).toBe(
      true,
    );
    expect(
      run('equipment.nightstalker_vest', { selected: false }).state.dark_as_the_night,
    ).toBeUndefined();
  });
  it('preserves weapon treatment and staff recharge restrictions', () => {
    expect(run('guild.fighters.slayer').state).toMatchObject({
      requires_edged_weapon: true,
      requires_full_durability: true,
      damage_modifier: 1,
      cumulative: true,
      duration: 'until the weapon breaks',
    });
    expect(run('guild.wizards.staves').state).toMatchObject({
      durability: 8,
      default_charges: 3,
      recharge_purchase_price_fraction: 0.5,
      casting_automatically_succeeds: true,
      normal_casting_action_points: 2,
    });
    expect(run('equipment.arcane_staff', { selected: true }).state.dissipation_minimum).toBe(9);
    expect(run('equipment.staff_of_the_heart', { selected: true }).state.dissipation_minimum).toBe(
      10,
    );
  });
  it('preserves estate timing, mutually exclusive training and departure restrictions', () => {
    expect(run('estate.furnishing').state).toMatchObject({
      purchases_between_quests: 1,
      usable_after: 'leaving the next dungeon',
    });
    expect(run('estate.archery_range').state.excludes_training_grounds_training).toBe(true);
    expect(run('estate.training_grounds').state.excludes_archery_range_training).toBe(true);
    expect(run('estate.departure').state).toMatchObject({
      may_change_plans: false,
      must_head_straight_to_world_map: true,
    });
    expect(run('estate.ghost_contact').state).toMatchObject({
      contact_die: 10,
      contact_minimum: 7,
    });
  });
});
