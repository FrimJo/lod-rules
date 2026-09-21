import { describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
const pilot = readPilot();

describe('source-faithful pilot tables', () => {
  it('preserves the complete rendered level progression table', () => {
    const table = pilot.tables.find((t) => t.id === 'table.character.level_progression');
    expect(table?.columns.map((c) => c.label)).toEqual([
      'Level',
      'XP requirement',
      'Hit Point increase',
      'Luck increase',
      'Energy',
    ]);
    expect(table?.rows.map((row) => table.columns.map((c) => row.cells[c.id]?.printed))).toEqual([
      ['1', '0', '0', '0', '1'],
      ['2', '2000', '+1d2', '+1', '+1'],
      ['3', '5000', '+1d2', '-', '-'],
      ['4', '10000', '+1d2', '-', '+1'],
      ['5', '25000', '+1d2', '+1', '-'],
      ['6', '50000', '+1d2', '-', '-'],
      ['7', '75000', '+1d2', '-', '+1'],
      ['8', '110000', '+1d2', '+1', '-'],
      ['9', '160000', '+1d2', '-', '+1'],
      ['10', '220000', '+1d2', '-', '-'],
    ]);
    expect(table?.rows[0]?.cells.energy).toMatchObject({ meaning: 'initial', value: 1 });
    expect(table?.rows[1]?.cells.energy).toMatchObject({ meaning: 'increase', value: 1 });
    expect(table?.rows[1]?.cells.hit_point_increase).toMatchObject({
      dice: { count: 1, sides: 2 },
    });
    expect(table?.completeness).toBe('complete');
  });
  it.each(pilot.tables)('round-trips $id without dropping cells or provenance', (table) => {
    expect(parse(stringify(table))).toEqual(table);
  });
});

describe('profession tables and entity features', () => {
  const expected: Record<string, string[][]> = {
    alchemist: [
      ['Combat Skill', '-5', 'Alchemy', '+10'],
      ['Ranged Skill', '-5', 'Perception', '-10'],
      ['Dodge', '-10', 'Arcane Art', 'N/A'],
      ['Pick Locks', '-20', 'Foraging', '-20'],
      ['Barter', '0', 'Battle Prayers', 'N/A'],
      ['Heal', '+5', 'Hit Points', '±0'],
    ],
    thief: [
      ['Combat Skill', '-5', 'Alchemy', '-30'],
      ['Ranged Skill', '+5', 'Perception', '+10'],
      ['Dodge', '+5', 'Arcane Art', 'N/A'],
      ['Pick Locks', '+10', 'Foraging', '-20'],
      ['Barter', '0', 'Battle Prayers', 'N/A'],
      ['Heal', '-20', 'Hit Points', '±0'],
    ],
  };
  it.each(['alchemist', 'thief'])('preserves every printed %s skill cell', (name) => {
    const table = pilot.tables.find((t) => t.id === `table.character.${name}_skills`)!;
    expect(table.columns.map((c) => c.label)).toEqual(['Skill', 'Mod', 'Skill', 'Mod']);
    expect(table.rows.map((row) => table.columns.map((c) => row.cells[c.id]!.printed))).toEqual(
      expected[name],
    );
    expect(table.rows[2]!.cells.right_modifier).toEqual({
      type: 'marker',
      printed: 'N/A',
      meaning: 'unavailable',
    });
    expect(table.rows[5]!.cells.right_modifier).toEqual({
      type: 'number',
      printed: '±0',
      meaning: 'modifier',
      value: 0,
    });
  });
  it('retains Alchemist equipment choices, grants and recipe reference', () => {
    const entity = pilot.entities.find((e) => e.id === 'profession.alchemist')!;
    expect(entity.starting_equipment).toEqual([
      { label: 'Small backpack', quantity: 1, selection: 'fixed' },
      { label: 'Alchemist tools', quantity: 1, selection: 'fixed' },
      { label: 'Alchemist belt', quantity: 1, selection: 'fixed' },
      { label: 'Shortsword', quantity: 1, selection: 'fixed' },
      { label: 'potions', quantity: 3, selection: 'choice', qualifier: 'standard level' },
      { label: 'bag', quantity: 1, selection: 'fixed' },
      { label: 'ingredients', quantity: 3, selection: 'random', qualifier: 'in the bag' },
      { label: 'parts', quantity: 3, selection: 'choice' },
      { label: 'recipe', quantity: 1, selection: 'choice', qualifier: 'for a Weak Potion' },
    ]);
    expect(entity.grants?.map((g) => [g.kind, g.label])).toEqual([
      ['talent', 'Resistance to Poison'],
      ['perk', 'Heroic Force of Will'],
    ]);
    expect(entity.grants?.[0]?.object_id).toBe('talent.resistance_to_poison');
    expect(entity.grants?.[1]?.object_id).toBeUndefined();
    expect(entity.see_also).toContain('section.alchemy.making_a_recipe');
  });
  it('retains Thief quantities and leaves unextracted grants as named references', () => {
    const entity = pilot.entities.find((e) => e.id === 'profession.thief')!;
    expect(entity.starting_equipment).toEqual([
      { label: 'Small backpack', quantity: 1, selection: 'fixed' },
      { label: 'Dagger', quantity: 1, selection: 'fixed' },
      { label: 'Rope', quantity: 1, selection: 'fixed' },
      { label: 'Lock Picks', quantity: 10, selection: 'fixed' },
    ]);
    expect(entity.grants?.map((g) => [g.kind, g.label])).toEqual([
      ['talent', 'Evaluate'],
      ['perk', 'Heroic Force of Will'],
    ]);
    expect(entity.grants?.every((g) => g.object_id === undefined)).toBe(true);
  });
  it('retains selected talent rows in printed order without claiming complete tables', () => {
    const physical = pilot.tables.find((t) => t.id === 'table.talent.physical_pilot')!;
    const combat = pilot.tables.find((t) => t.id === 'table.talent.combat_pilot')!;
    expect(physical.rows.map((r) => r.cells.talent!.printed)).toEqual([
      'Fast',
      'Night Vision',
      'Perfect Hearing',
      'Resistance to Poison',
      'Tank',
    ]);
    expect(combat.rows.map((r) => r.cells.talent!.printed)).toEqual(['Axeman']);
    expect([physical.completeness, combat.completeness]).toEqual(['partial', 'partial']);
    for (const table of [physical, combat])
      for (const row of table.rows) {
        const entity = pilot.entities.find((e) => e.id === `talent.${row.id}`)!;
        expect(entity.source_text).toBe(row.cells.description!.printed);
        expect(entity.activation).toBe('passive');
      }
  });
});
