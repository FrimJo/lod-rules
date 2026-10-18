import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';

const tables = readPilot().tables;
const table = (id: string) => tables.find((x) => x.id === id)!;
const blank = { type: 'blank', printed: '' };

/** The die each row prints, by row id, from the rendered PDF pages; every other row is blank. */
function derivedColumn(tableId: string, columnId: string) {
  return Object.fromEntries(table(tableId).rows.map((row) => [row.id, row.cells[columnId]]));
}

describe('Dungeon event tables type the dice their text cells print', () => {
  it('Red Levers 19 types the 1d10 Points of Damage (PDF 104)', () => {
    const red = table('table.dungeon.red_levers');
    expect(red.columns.find((x) => x.id === 'damage')).toEqual({
      id: 'damage',
      label: 'Printed Damage within Event cell',
      cell_types: ['dice', 'blank'],
    });
    const damage = derivedColumn('table.dungeon.red_levers', 'damage');
    expect(damage.floor_gives_way).toEqual({
      type: 'dice',
      printed: '1d10',
      dice: { count: 1, sides: 10 },
      meaning: 'value',
    });
    // Row 18's 1d6 is the normal door trap roll with a new threshold, not a roll of its own.
    expect(damage.defence_system).toEqual(blank);
    expect(Object.values(damage).filter((x) => x?.type === 'dice')).toHaveLength(1);
  });

  it('Black Levers 7 types the 1d3 potions (PDF 105)', () => {
    const black = table('table.dungeon.black_levers');
    expect(black.columns.find((x) => x.id === 'potions')).toEqual({
      id: 'potions',
      label: 'Printed potions within Event cell',
      cell_types: ['dice', 'blank'],
    });
    const potions = derivedColumn('table.dungeon.black_levers', 'potions');
    expect(potions.dusty_bottles).toEqual({
      type: 'dice',
      printed: '1d3',
      dice: { count: 1, sides: 3 },
      meaning: 'value',
    });
    expect(Object.values(potions).filter((x) => x?.type === 'dice')).toHaveLength(1);
  });

  it('Threat in battle 4-5 types the 1d10 Hit Points healed (PDF 91)', () => {
    const threat = table('table.dungeon.threat_in_battle');
    expect(threat.columns.find((x) => x.id === 'healing')).toEqual({
      id: 'healing',
      label: 'Printed Hit Points within Result cell',
      cell_types: ['dice', 'blank'],
    });
    const healing = derivedColumn('table.dungeon.threat_in_battle', 'healing');
    expect(healing.healing).toEqual({
      type: 'dice',
      printed: '1d10',
      dice: { count: 1, sides: 10 },
      meaning: 'value',
    });
    expect(Object.values(healing).filter((x) => x?.type === 'dice')).toHaveLength(1);
  });

  it('keeps the printed text cells verbatim', () => {
    const cell = (tableId: string, rowId: string, columnId: string) =>
      table(tableId).rows.find((x) => x.id === rowId)!.cells[columnId]?.printed;
    expect(cell('table.dungeon.red_levers', 'floor_gives_way', 'event')).toContain(
      'the hero takes 1d10 Points of Damage without armour but with NA.',
    );
    expect(cell('table.dungeon.black_levers', 'dusty_bottles', 'event')).toContain(
      'There are 1d3 potions in the compartment',
    );
    expect(cell('table.dungeon.threat_in_battle', 'healing', 'result')).toContain(
      'will heal 1d10 Hit Points.',
    );
  });
});
