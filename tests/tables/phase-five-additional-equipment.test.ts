import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';

const corpus = readPilot();
const expectedRows: Readonly<Record<string, readonly string[]>> = {
  'table.equipment.consumables': ['Beef Jerky', 'Dwarven Ale', 'Ration', 'Tobacco'],
  'table.equipment.jewellery': [
    'Necklace',
    'Religious Relic (Necklace)',
    'Religious Relic (Ring)',
    'Ring',
  ],
  'table.equipment.light_sources': ['Headlamp', 'Lamp Oil', 'Lantern (filled with oil)', 'Torch'],
  'table.equipment.miscellaneous': [
    'Backpack - Medium',
    'Backpack - Large',
    'Bandage (old rags)',
    'Bandage (linen)',
    'Bandage (Herbal wrap)',
    'Bed Roll',
    'Combat Harness',
    'Extended Battle Belt',
    'Holy Water',
    'Iron Wedges',
    'Parchment',
    'Partial Map',
  ],
  'table.equipment.tools': [
    'Armour Repair Kit',
    'Cooking Gear',
    'Crowbar',
    'Dwarven Pickaxe',
    'Fishing Gear',
    'Lockpicks (5)',
    'Pickaxe',
    'Rope (old)',
    'Rope',
    'Trap Disarming Kit',
    'Whetstone',
  ],
};

describe('Phase 5 Appendix III equipment tables, PDF 182–185', () => {
  it.each(Object.entries(expectedRows))('preserves the complete %s row inventory', (id, names) => {
    const table = corpus.tables.find((candidate) => candidate.id === id)!;
    expect(table.completeness).toBe('complete');
    expect(table.rows.map((row) => row.source_row)).toEqual(names);
    const extraction = (
      table.source[0] as (typeof table.source)[number] & {
        extraction: { visually_verified: boolean };
      }
    ).extraction;
    expect(extraction.visually_verified).toBe(true);
    for (const row of table.rows) {
      expect(row.cells.name?.printed).toBe(row.source_row);
      expect(row.cells.cost?.type).toBe('text');
      expect(row.cells.availability?.type).toBe('number');
      expect(row.entity_refs).toHaveLength(1);
    }
  });

  it('preserves equipment-specific slash notation, dashes, and printed special text', () => {
    const tools = corpus.tables.find((table) => table.id === 'table.equipment.tools')!;
    expect(
      tools.rows.find((row) => row.source_row === 'Crowbar')?.cells.special?.printed,
    ).toContain('8+DB');
    expect(tools.rows.find((row) => row.source_row === 'Lockpicks (5)')?.cells.enc?.printed).toBe(
      '-/10',
    );
    const miscellaneous = corpus.tables.find(
      (table) => table.id === 'table.equipment.miscellaneous',
    )!;
    expect(
      miscellaneous.rows.find((row) => row.source_row === 'Iron Wedges')?.cells.special?.printed,
    ).toContain('6 AP to pass the door');
    expect(
      miscellaneous.rows.find((row) => row.source_row === 'Backpack - Medium')?.cells.enc,
    ).toEqual({
      type: 'marker',
      printed: '-',
      meaning: 'no_increase',
    });
  });
});
