import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
const table = readPilot().tables.find((t) => t.id === 'table.travel.obstacles')!;
// Textual cells transcribed from rendered PDF 128–130. Example art remains supplied geometry.
const artPenalty = '-10 when shooting through if LOS passes through the actual art.';
const blocked = 'Blocks LOS if it passes through the actual art.';
const cumulative = '-10 when shooting into, through or out from such as square. It’s cumulative.';
const expected = [
  ['Barrels', '2x', artPenalty, 'Yes', 'Searchable.'],
  [
    'Boulder',
    '2x',
    artPenalty,
    'Yes',
    '50% or more of the square must be covered to count as boulders.',
  ],
  ['Boxes', '2x', artPenalty, 'Yes', 'Searchable.'],
  [
    'Broken cart',
    '2x.',
    'No effect.',
    'No',
    'Square with boxes may be searched. Counts as 2 sets of boxes.',
  ],
  ['Campfire', '1X', 'No effect.', 'No', ''],
  ['Cart', '2x', artPenalty, 'Yes', ''],
  ['Completely forested', '2x', cumulative, 'No', ''],
  [
    'Fishing pier',
    '1x',
    'No effect.',
    'No',
    'Only squares with more than 50% pier and/or land art can be entered.',
  ],
  ['Haystacks', '2x', '-10 when shooting through if LOS passes the actual art.', 'Yes', ''],
  ['House', 'No Entry.', blocked, '', ''],
  [
    'Huge boulder (>1 square)',
    'No entry.',
    blocked,
    'N/A',
    'If more than 50% of a square is covered by a huge boulder, it cannot be entered.',
  ],
  [
    'Large log',
    '2x',
    artPenalty,
    'Yes',
    '50% or more of the square must be covered to count as large log.',
  ],
  ['Log', '1x', 'No effect.', 'No', ''],
  [
    'Partly forested',
    '1x',
    '-10 when shooting into. -10 when shooting through if LOS passes through the actual art.',
    'No',
    '',
  ],
  ['Pyramid', '1x', blocked, 'Yes', 'Can only be climbed along the stairs.'],
  ['Statues', 'No entry.', blocked, 'No', ''],
  ['Stump', '1x', 'No effect.', 'No', ''],
  ['Tent', 'No entry.', blocked, 'N/A', 'May be searched from adjacent tiles. Counts as a chest.'],
  [
    'Thorns',
    '2x',
    cumulative,
    'No',
    'Heroes that are not fully covered in armour suffer 1 point of DMG when entering.',
  ],
  ['Water', 'No entry.', 'No effect.', 'N/A', ''],
  [
    'Walls',
    '2x to pass over.',
    '-10 when shooting into or across a wall. -10 when shooting through if LOS passes through the actual art.',
    'No',
    '',
  ],
  ['Well', 'No entry.', artPenalty, 'N/A', ''],
];
describe('outdoor obstacle matrix', () => {
  it('retains all 110 textual cells including blanks, capitalization and strict coverage boundaries', () => {
    expect(table.rows.map((row) => table.columns.map((col) => row.cells[col.id]?.printed))).toEqual(
      expected,
    );
    expect(table.rows[9]?.cells.height_advantage?.type).toBe('blank');
  });
  it('cites each continuation page and explicitly retains the artwork boundary', () => {
    expect(table.rows.map((r) => r.source?.[0]?.pdf_page)).toEqual([
      ...Array<number>(6).fill(128),
      ...Array<number>(8).fill(129),
      ...Array<number>(8).fill(130),
    ]);
    expect(table.footnotes[0]).toContain('Example');
  });
});
