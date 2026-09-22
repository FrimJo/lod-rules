import { describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';
import { readPilot } from '../../scripts/validate/pilot-files.ts';

const corpus = readPilot();

/**
 * Independently transcribed from a render of PDF page 179 (printed 177), column order
 * Name / Damage / Enc / Class / Special / Cost / Avail. / Reload. Empty printed cells are ''
 * and printed dashes are '-'; the two are distinct in the book and must stay distinct here.
 */
const weapons: ReadonlyArray<
  readonly [string, string, string, string, string, string, string, string]
> = [
  ['Dagger', '1d6', '5', '1', 'Dual Wield +1', '10 c', '4', ''],
  ['Rapier', '1d6+1', '5', '1', 'Fast, Dual Wield +2', '130 c', '3', ''],
  ['Javelin', '1d10', '10', '2', 'Reach, BFO, AP (1)', '100 c', '4', ''],
  ['Shortsword', '1d6+2', '7', '2', 'Dual Wield +2', '70 c', '4', ''],
  ['Staff', '1d8', '5', '2', 'Defensive', '5 c', '5', ''],
  ['Battle Hammer', '1d10', '10', '3', 'Stun, BFO', '100 c', '4', ''],
  ['Broadsword', '1d8+2', '8', '3', '', '90 c', '5', ''],
  ['Battleaxe', '1d10+1', '10', '4', 'BFO, AP (1)', '100 c', '4', ''],
  ['Longsword', '1d12', '10', '4', '', '100 c', '4', ''],
  ['Morning Star', '1d8+4', '10', '4', 'Unwieldy, BFO, Stun', '150 c', '2', ''],
  ['Flail', '1d10+4', '20', '5', 'Unwieldy, BFO, Stun', '150 c', '2', ''],
  ['Greataxe', '1d12+2', '20', '5', 'Slow, BFO, AP (2)', '200 c', '3', ''],
  ['Greatsword', '2d6', '20', '5', 'Slow', '200 c', '3', ''],
  ['Halberd', '1d12', '20', '5', 'Reach, AP (1)', '150 c', '4', ''],
  ['Warhammer', '2d6', '20', '5', 'Slow, BFO, Stun', '200 c', '3', ''],
  ['Arbalest', '3d6', '20', '6', 'Requires STR 55, AP (2)', '400 c', '2', '3'],
  ['Crossbow', '1d10+3', '15', '6', 'AP (1)', '250 c', '3', '2'],
  ['Crossbow Pistol', '1d8+1', '5', '2', 'Secondary Weapon', '350 c', '2', '2'],
  ['Elven bow', '1d10+2', '7', '6', 'AP (1)', '700 c', '2', '1'],
  ['Longbow', '1d10', '10', '6', 'AP (1)', '100 c', '4', '1'],
  ['Shortbow', '1d8', '5', '6', '', '100 c', '4', '1'],
  ['Sling', '1d6', '1', '6', 'Unlimited Ammo', '40 c', '4', '1'],
  ['Arrow/Bolt (5)', '-', '-', '-', '-', '5 c', '4', '-'],
  ['Net', '-', '2', '2', 'Ensnare, Dual Wield +0', '100 c', '3', '-'],
];

const columnIds = [
  'name',
  'damage',
  'enc',
  'weapon_class',
  'special',
  'cost',
  'availability',
  'reload',
] as const;

describe('Phase 5 independently transcribed Weapons table, PDF 179', () => {
  const table = corpus.tables.find((t) => t.id === 'table.equipment.weapons')!;

  it('is bound to the mapped table node and marked complete', () => {
    expect(table.section_id).toBe('section.appendix_iii_equipment.weapons.table');
    expect(table.completeness).toBe('complete');
    expect(table.source[0]).toMatchObject({ pdf_page: 179, printed_page: 177 });
    expect(table.source[0]).toMatchObject({
      extraction: { method: 'text', visually_verified: true },
    });
    expect(parse(stringify(table))).toEqual(table);
  });

  it('preserves the printed column order and labels', () => {
    expect(table.columns.map((c) => c.id)).toEqual([...columnIds]);
    expect(table.columns.map((c) => c.label)).toEqual([
      'Name',
      'Damage',
      'Enc',
      'Class',
      'Special',
      'Cost',
      'Avail.',
      'Reload',
    ]);
  });

  it('preserves every printed cell of all 24 rows', () => {
    expect(table.rows).toHaveLength(weapons.length);
    expect(table.rows.map((r) => r.source_row)).toEqual(weapons.map(([name]) => name));
    table.rows.forEach((row, index) => {
      columnIds.forEach((column, position) => {
        expect(row.cells[column]!.printed).toBe(weapons[index]![position]);
      });
    });
  });

  it('keeps blank cells and printed dashes as different cell types', () => {
    const cell = (name: string, column: (typeof columnIds)[number]) =>
      table.rows.find((r) => r.source_row === name)!.cells[column]!;
    expect(cell('Broadsword', 'special').type).toBe('blank');
    expect(cell('Dagger', 'reload').type).toBe('blank');
    expect(cell('Arrow/Bolt (5)', 'special')).toEqual({
      type: 'marker',
      printed: '-',
      meaning: 'no_increase',
    });
    expect(cell('Net', 'damage').type).toBe('marker');
    expect(cell('Net', 'enc').type).toBe('number');
  });

  it('types damage as dice and encumbrance, class, availability and reload as numbers', () => {
    expect(table.rows.find((r) => r.source_row === 'Greatsword')!.cells.damage).toEqual({
      type: 'dice',
      printed: '2d6',
      dice: { count: 2, sides: 6 },
      meaning: 'value',
    });
    expect(table.rows.find((r) => r.source_row === 'Flail')!.cells.damage).toEqual({
      type: 'dice',
      printed: '1d10+4',
      dice: { count: 1, sides: 10, modifier: 4 },
      meaning: 'value',
    });
    expect(table.rows.find((r) => r.source_row === 'Arbalest')!.cells.reload).toEqual({
      type: 'number',
      printed: '3',
      value: 3,
      meaning: 'value',
    });
  });

  it('keeps costs as printed strings rather than bare numbers', () => {
    for (const row of table.rows) {
      expect(row.cells.cost!.type).toBe('text');
      expect(row.cells.cost!.printed).toMatch(/^\d+ c$/);
    }
  });

  it('carries all eleven printed special-rule definitions verbatim', () => {
    const openings = [
      'AP (X):',
      'BFO (Built for offence):',
      'Defensive:',
      'Dual wield +X:',
      'Ensnare:',
      'Fast:',
      'Reach:',
      'Secondary Weapon:',
      'Slow:',
      'Stun:',
      'Unwieldy:',
    ];
    openings.forEach((opening, index) => {
      expect(table.footnotes[index]!.startsWith(opening)).toBe(true);
    });
    expect(table.footnotes).toHaveLength(openings.length + 1);
    expect(table.footnotes.at(-1)).toContain('unlabelled blank band');
  });

  it('records the Specials the book never defines as an open issue', () => {
    expect(table.issues).toEqual(['issue.phase5.weapons_undefined_specials']);
    expect(table.unresolved_references!.join(' ')).toContain('Unlimited Ammo');
    expect(table.unresolved_references!.join(' ')).toContain('Requires STR 55');
  });

  it('does not yet claim weapon entities or weapon special rules', () => {
    expect(corpus.entities.filter((e) => e.id.startsWith('equipment.'))).toEqual([]);
  });
});

/**
 * Independently transcribed from a render of PDF page 180 (printed 178), column order
 * Armour / Def / Enc / Covers / Special / Cost / Availability. Tier rows are printed band
 * headings with no values.
 */
const armour: ReadonlyArray<readonly [string, string, string, string, string, string, string]> = [
  ['Tier 1:', '', '', '', '', '', ''],
  ['Padded Cap', '2', '1', 'Head', '', '30 c', '4'],
  ['Padded Vest', '2', '3', 'Torso', 'Stackable', '60 c', '4'],
  ['Padded Jacket', '2', '5', 'Arms, Torso', 'Stackable', '120 c', '4'],
  ['Padded Pants', '2', '4', 'Legs', 'Stackable', '100 c', '4'],
  ['Padded Coat', '2', '6', 'Arms, Torso, Legs', '', '200 c', '3'],
  ['Cloak', '1', '1', 'Torso (only back)', 'Stackable', '50 c', '4'],
  ['Padded Dog Armour', '2', '1', 'Dog', '', '60 c', '3'],
  ['Tier 2:', '', '', '', '', '', ''],
  ['Leather Cap', '3', '1', 'Head', '', '50 c', '4'],
  ['Leather Vest', '3', '3', 'Torso', '', '80 c', '4'],
  ['Leather Jacket', '3', '4', 'Torso, Arms', '', '140 c', '4'],
  ['Leather Leggings', '3', '3', 'Legs', '', '120 c', '4'],
  ['Leather Bracers', '3', '3', 'Arms', 'Stackable', '120 c', '3'],
  ['Leather Dog Armour', '3', '3', 'Dog', '', '120 c', '3'],
  ['Tier 3:', '', '', '', '', '', ''],
  ['Mail Coif', '4', '4', 'Head', 'Stackable', '200 c', '3'],
  ['Mail Shirt', '4', '6', 'Torso', 'Stackable', '600 c', '3'],
  ['Sleeved Mail Shirt', '4', '7', 'Arms, Torso', 'Stackable', '950 c', '3'],
  ['Mail Coat', '4', '8', 'Torso, Legs', 'Stackable', '750 c', '3'],
  ['Sleeved Mail Coat', '4', '10', 'Arms, Torso, Legs', 'Stackable', '1300 c', '3'],
  ['Mail Leggings', '4', '5', 'Legs', 'Stackable', '200 c', '2'],
  ['Tier 4:', '', '', '', '', '', ''],
  ['Helmet', '5', '5', 'Head', 'Clunky, Stackable', '300 c', '3'],
  ['Breastplate', '5', '7', 'Torso', 'Clunky, Stackable', '700 c', '3'],
  ['Plate Bracers', '5', '4', 'Arms', 'Stackable', '600 c', '3'],
  ['Plate Leggings', '5', '6', 'Legs', 'Clunky, Stackable', '700 c', '3'],
];

const armourColumns = ['name', 'def', 'enc', 'covers', 'special', 'cost', 'availability'] as const;

describe('Phase 5 independently transcribed Armour table, PDF 180', () => {
  const table = corpus.tables.find((t) => t.id === 'table.equipment.armour')!;

  it('is bound to the first mapped table node on the page', () => {
    expect(table.section_id).toBe('section.appendix_iii_equipment.armour_and_shields.table');
    expect(table.completeness).toBe('complete');
    expect(table.source[0]).toMatchObject({ pdf_page: 180, printed_page: 178 });
    expect(parse(stringify(table))).toEqual(table);
  });

  it('preserves the printed column labels', () => {
    expect(table.columns.map((c) => c.id)).toEqual([...armourColumns]);
    expect(table.columns.map((c) => c.label)).toEqual([
      'Armour',
      'Def',
      'Enc',
      'Covers',
      'Special',
      'Cost',
      'Availability',
    ]);
  });

  it('preserves every printed cell, including the four tier band rows', () => {
    expect(table.rows).toHaveLength(armour.length);
    table.rows.forEach((row, index) => {
      armourColumns.forEach((column, position) => {
        expect(row.cells[column]!.printed).toBe(armour[index]![position]);
      });
    });
    expect(table.rows.filter((r) => /^Tier \d:$/.test(r.source_row))).toHaveLength(4);
  });

  it('keeps tier band rows valueless and armour values typed', () => {
    const tier = table.rows.find((r) => r.source_row === 'Tier 3:')!;
    for (const column of armourColumns.slice(1)) expect(tier.cells[column]!.type).toBe('blank');
    expect(tier.cells.name!.type).toBe('text');
    const coat = table.rows.find((r) => r.source_row === 'Sleeved Mail Coat')!;
    expect(coat.cells.enc).toEqual({ type: 'number', printed: '10', value: 10, meaning: 'value' });
    expect(coat.cells.covers!.printed).toBe('Arms, Torso, Legs');
    expect(table.rows.find((r) => r.source_row === 'Padded Coat')!.cells.special!.type).toBe(
      'blank',
    );
  });

  it('carries the printed Stackable and Clunky definitions and the unlabelled bands', () => {
    expect(table.footnotes[0]!.startsWith('Stackable:')).toBe(true);
    expect(table.footnotes[0]).toContain('highest tier is always the outer layer');
    expect(table.footnotes[1]!.startsWith('Clunky:')).toBe(true);
    expect(table.footnotes[2]).toContain('Tier 1:');
    expect(table.footnotes[3]).toContain('Padded Dog Armour');
  });
});

describe('Phase 5 independently transcribed Shield table, PDF 180', () => {
  const table = corpus.tables.find((t) => t.id === 'table.equipment.shields')!;

  it('is bound to the second mapped table node on the page', () => {
    expect(table.section_id).toBe('section.appendix_iii_equipment.armour_and_shields.table_2');
    expect(table.columns.map((c) => c.label)).toEqual([
      'Shield',
      'Def',
      'Class',
      'Enc',
      'Special',
      'Cost',
      'Availability',
    ]);
    expect(parse(stringify(table))).toEqual(table);
  });

  it('preserves all three printed shields', () => {
    expect(
      table.rows.map((r) =>
        ['name', 'def', 'shield_class', 'enc', 'special', 'cost', 'availability'].map(
          (column) => r.cells[column]!.printed,
        ),
      ),
    ).toEqual([
      ['Buckler', '4', '1', '4', '-', '20 c', '4'],
      ['Heater Shield', '6', '3', '10', '-', '100 c', '3'],
      ['Tower Shield', '8', '5', '15', 'Huge', '200 c', '2'],
    ]);
    expect(table.rows[0]!.cells.special!.type).toBe('marker');
    expect(table.rows[2]!.cells.special!.type).toBe('text');
  });

  it('keeps the Huge definition, including the printed 2-hand exception', () => {
    expect(table.footnotes).toHaveLength(1);
    expect(table.footnotes[0]!.startsWith('Huge:')).toBe(true);
    expect(table.footnotes[0]).toContain('does not require 2 hands');
  });
});

describe('Phase 5 independently transcribed General Equipment tables, PDF 181', () => {
  const alchemy = corpus.tables.find((t) => t.id === 'table.equipment.alchemy')!;
  const animals = corpus.tables.find((t) => t.id === 'table.equipment.animals_and_transportation')!;

  it('binds each table to its own mapped node with the printed column labels', () => {
    expect(alchemy.section_id).toBe(
      'section.appendix_iii_equipment.general_equipment.alchemy.table',
    );
    expect(animals.section_id).toBe(
      'section.appendix_iii_equipment.general_equipment.animals_and_transportation.table',
    );
    for (const table of [alchemy, animals]) {
      expect(table.columns.map((c) => c.label)).toEqual([
        'Equipment',
        'ENC',
        'DUR',
        'Special',
        'Cost',
        'Avail.',
      ]);
      expect(table.source[0]).toMatchObject({ pdf_page: 181, printed_page: 179 });
      expect(parse(stringify(table))).toEqual(table);
    }
  });

  it('preserves all eight alchemy rows with their slash notation intact', () => {
    expect(
      alchemy.rows.map((r) => [
        r.cells.name!.printed,
        r.cells.enc!.printed,
        r.cells.dur!.printed,
        r.cells.cost!.printed,
        r.cells.availability!.printed,
      ]),
    ).toEqual([
      ['Alchemist Belt', '-', '6', '300 c', '3'],
      ['Alchemist Tool', '5/1', '6', '200 c', '3'],
      ['Empty Bottle', '-/1', '1', '10 c', '5'],
      ['Healing Potion', '1/1', '1', '75/100 c', '4'],
      ['Potion of Cure Disease', '1/1', '1', '125 c', '3'],
      ['Potion of Cure Disease (Weak)', '1/1', '1', '90 c', '3'],
      ['Potion of Cure Poison', '1/1', '1', '125 c', '3'],
      ['Potion of Cure Poison (Weak)', '1/1', '1', '90 c', '3'],
    ]);
    expect(alchemy.rows.find((r) => r.source_row === 'Alchemist Belt')!.cells.enc!.type).toBe(
      'marker',
    );
    expect(alchemy.rows.find((r) => r.source_row === 'Empty Bottle')!.cells.enc!.type).toBe('text');
  });

  it('keeps the two-value Healing Potion cells and the weak-potion percentages', () => {
    const healing = alchemy.rows.find((r) => r.source_row === 'Healing Potion')!;
    expect(healing.cells.special!.printed).toBe(
      'Available at Weak or Standard level (1d4/1d6 healing)',
    );
    expect(healing.cells.cost!.printed).toBe('75/100 c');
    expect(
      alchemy.rows.find((r) => r.source_row === 'Potion of Cure Disease (Weak)')!.cells.special!
        .printed,
    ).toBe('75% chance to remove all effects of disease.');
  });

  it('preserves the printed absence of a full stop on the poison potions', () => {
    for (const name of ['Potion of Cure Poison', 'Potion of Cure Poison (Weak)'])
      expect(alchemy.rows.find((r) => r.source_row === name)!.cells.special!.printed).not.toMatch(
        /\.$/,
      );
    expect(
      alchemy.rows.find((r) => r.source_row === 'Potion of Cure Disease')!.cells.special!.printed,
    ).toMatch(/\.$/);
  });

  it('preserves all five transportation rows and their distinct access wordings', () => {
    expect(animals.rows.map((r) => r.source_row)).toEqual([
      'Horse',
      'Camel',
      'Saddlebags',
      'Mule',
      'Wagon',
    ]);
    for (const row of animals.rows) {
      expect(row.cells.enc!.type).toBe('marker');
      expect(row.cells.dur!.type).toBe('marker');
    }
    expect(
      animals.rows.find((r) => r.source_row === 'Saddlebags')!.cells.special!.printed,
    ).toContain('until after the quest');
    expect(animals.rows.find((r) => r.source_row === 'Mule')!.cells.special!.printed).toContain(
      'until after the dungeon',
    );
    expect(animals.rows.find((r) => r.source_row === 'Camel')!.cells.special!.printed).toContain(
      'not changed by the Outpost modifiers',
    );
    expect(animals.unresolved_references!.join(' ')).toContain('Travelling and Skirmishes');
  });

  it('extracts the printed Enc quick-slot note as a rule bound to both tables', () => {
    const rule = corpus.rules.find((r) => r.id === 'character.equipment.quick_slot_stack')!;
    expect(rule.section_id).toBe('section.appendix_iii_equipment.general_equipment');
    expect(rule.source_text).toContain('/X in the ENC column');
    expect(rule.uses_tables).toEqual([
      'table.equipment.alchemy',
      'table.equipment.animals_and_transportation',
    ]);
    expect(rule.effects).toEqual([
      {
        type: 'set',
        target: 'quick_slot_stack_size',
        value: { type: 'field', name: 'printed_stack_size' },
      },
    ]);
  });
});
