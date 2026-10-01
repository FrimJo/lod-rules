import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';

const pilot = readPilot();

// Independently transcribed from rendered source PDF 61–62 (printed 59–60).
// Expected cells were read from the PDF, not copied from the canonical extraction.
const improvementColumns = [
  'subject',
  'barbarian',
  'warrior',
  'ranger',
  'warrior_priest',
  'wizard',
  'thief',
  'rogue',
  'alchemist',
];
const progressionColumns = [
  'level',
  'alchemist',
  'barbarian',
  'ranger',
  'rogue',
  'thief',
  'warrior',
  'warrior_priest',
  'wizard',
];

function checkMatrix(id: string, columns: string[], expected: string[]) {
  const table = pilot.tables.find((candidate) => candidate.id === id);
  expect(table, `Missing source table ${id}`).toBeDefined();
  if (!table) throw new Error(`Missing source table ${id}`);
  expect(table.columns.map((column) => column.id)).toEqual(columns);
  expect(
    table.rows.map((row) => columns.map((column) => row.cells[column]?.printed).join('|')),
  ).toEqual(expected);
  for (const row of table.rows) {
    for (const column of columns) {
      const cell = row.cells[column];
      expect(cell, `${id}/${row.id}/${column}`).toBeDefined();
      if (cell?.printed === '-') expect(cell.type).toBe('marker');
      if (cell?.printed === 'None') expect(cell.type).toBe('text');
    }
  }
}

describe('independent advancement matrix transcription — PDF 61–62', () => {
  it('preserves every improvement cost and unavailable profession cell (printed 59)', () => {
    checkMatrix('table.character.improvement_costs', improvementColumns, [
      'STR|2|2|3|3|5|5|3|5',
      'DEX|2|2|2|3|4|2|2|4',
      'CON|2|2|1|3|4|4|3|4',
      'WIS|5|5|4|3|2|3|4|2',
      'RES|3|3|3|2|3|3|3|3',
      'CS|1|1|3|2|5|5|3|3',
      'RS|3|2|1|2|4|2|3|3',
      'Dodge|3|3|3|3|3|1|3|4',
      'Pick Lock|5|5|5|5|4|1|3|4',
      'Perception|4|4|2|4|2|1|3|2',
      'Heal|4|4|2|2|2|4|3|3',
      'Arcane Arts|-|-|-|-|1|-|-|-',
      'Battle Prayers|-|-|-|1|-|-|-|-',
      'Foraging|4|4|1|4|5|4|3|4',
      'Barter|5|4|3|3|1|2|3|3',
      'Alchemy|5|5|4|4|3|4|4|1',
      'Hit points +1|5|5|10|10|10|10|10|10',
    ]);
  });

  it('preserves every talent category by level and profession (printed 60)', () => {
    checkMatrix('table.character.talent_progression', progressionColumns, [
      '2|Alchemist|Physical|Physical|Physical|Sneaky|Mental|Mental|Magic',
      '3|Mental|Combat|Combat|Sneaky|Common|Combat|Faith|Common',
      '4|Common|Mental|Common|Combat|Sneaky|Physical|Combat|Mental',
      '5|Alchemist|Common|Mental|Mental|Combat|Combat|Physical|Magic',
      '6|Combat|Combat|Combat|Physical|Mental|Common|Faith|Mental',
      '7|Mental|Physical|Physical|Combat|Physical|Mental|Combat|Physical',
      '8|Common|Combat|Common|Sneaky|Common|Combat|Mental|Magic',
      '9|Alchemist|Common|Mental|Common|Combat|Common|Faith|Common',
      '10|Alchemist|Combat|Combat|Combat|Sneaky|Combat|Combat|Mental',
    ]);
  });

  it('preserves every perk category including the printed None cells (printed 60)', () => {
    checkMatrix('table.character.perk_progression', progressionColumns, [
      '2|Alchemist|Combat|Combat|Combat|Sneaky|Leader|Faith|Arcane',
      '3|None|None|None|None|None|None|None|None',
      '4|Leader|Common|Common|Sneaky|Common|Combat|Leader|Leader',
      '5|None|None|None|None|None|None|None|None',
      '6|Combat|Combat|Combat|Common|Sneaky|Combat|Combat|Arcane',
      '7|None|None|None|None|None|None|None|None',
      '8|Alchemist|Common|Common|Combat|Combat|Common|Faith|Common',
      '9|None|None|None|None|None|None|None|None',
      '10|Common|Combat|Common|Sneaky|Sneaky|Combat|Common|Arcane',
    ]);
  });
});
