import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
const corpus = readPilot();
const table = (id: string) => corpus.tables.find((t) => t.id === id)!;
const numbers = (id: string) =>
  table(id).rows.map((r) =>
    table(id).columns.map((c) => {
      const cell = r.cells[c.id];
      return cell?.type === 'number' ? cell.value : cell?.type === 'text' ? cell.printed : null;
    }),
  );

describe('Phase 4 independent printed-table matrices', () => {
  it('preserves the separate DB and NA tables', () => {
    expect(numbers('table.character.damage_bonus')).toEqual([
      [50, 1],
      [60, 2],
      [70, 3],
    ]);
    expect(numbers('table.character.natural_armour')).toEqual([
      [50, 1],
      [55, 2],
      [60, 3],
      [65, 4],
      [70, 5],
    ]);
  });
  it('preserves every racial maximum in printed column order', () => {
    expect(numbers('table.character.stat_maxima')).toEqual([
      ['Dwarf', 80, 60, 80, 80, 70],
      ['Human', 70, 70, 80, 80, 65],
      ['Elf', 60, 80, 80, 80, 65],
      ['Halfling', 40, 80, 80, 80, 60],
    ]);
  });
  it('preserves all skill/base-stat associations without extracting skill abilities', () => {
    expect(numbers('table.character.skill_bases')).toEqual([
      ['Combat Skill', 'DEX'],
      ['Ranged Skill', 'DEX'],
      ['Dodge', 'DEX'],
      ['Arcane Art', 'WIS'],
      ['Barter', 'WIS'],
      ['Heal', 'WIS'],
      ['Foraging', 'CON'],
      ['Pick Locks', 'DEX'],
      ['Alchemy', 'WIS'],
      ['Perception', 'WIS'],
      ['Battle Prayers', 'RES'],
    ]);
  });
  it('preserves all 50 sell/repair rows and the dual-purpose final column', () => {
    // Independently transcribed from rendered printed 184; do not derive expectations from corpus.
    const expected = `10 7 6 5 4 3 2
20 14 12 10 8 6 4
30 21 18 15 12 9 6
40 28 24 20 16 12 8
50 35 30 25 20 15 10
60 42 36 30 24 18 12
70 49 42 35 28 21 14
80 56 48 40 32 24 16
90 63 54 45 36 27 18
100 70 60 50 40 30 20
110 77 66 55 44 33 22
120 84 72 60 48 36 24
130 91 78 65 52 39 26
140 98 84 70 56 42 28
150 105 90 75 60 45 30
160 112 96 80 64 48 32
170 119 102 85 68 51 34
180 126 108 90 72 54 36
190 133 114 95 76 57 38
200 140 120 100 80 60 40
210 147 126 105 84 63 42
220 154 132 110 88 66 44
230 161 138 115 92 69 46
240 168 144 120 96 72 48
250 175 150 125 100 75 50
260 182 156 130 104 78 52
270 189 162 135 108 81 54
280 196 168 140 112 84 56
290 203 174 145 116 87 58
300 210 180 150 120 90 60
310 217 186 155 124 93 62
320 224 192 160 128 96 64
330 231 198 165 132 99 66
340 238 204 170 136 102 68
350 245 210 175 140 105 70
360 252 216 180 144 108 72
370 259 222 185 148 111 74
380 266 228 190 152 114 76
390 273 234 195 156 117 78
400 280 240 200 160 120 80
410 287 246 205 164 123 82
420 294 252 210 168 126 84
430 301 258 215 172 129 86
440 308 264 220 176 132 88
450 315 270 225 180 135 90
460 322 276 230 184 138 92
470 329 282 235 188 141 94
480 336 288 240 192 144 96
490 343 294 245 196 147 98
500 350 300 250 200 150 100`
      .split('\n')
      .map((line) => line.split(' ').map(Number));
    expect(numbers('table.equipment.sell_and_repair')).toEqual(expected);
    expect(table('table.equipment.sell_and_repair').columns.at(-1)?.label).toBe('5+/Repair');
    expect(table('table.equipment.sell_and_repair').footnotes).toHaveLength(5);
  });
  it('preserves sanity loss amounts, the die, and the unresolved card reference', () => {
    const rows = table('table.psychology.sanity_losses').rows;
    expect(rows.slice(0, 8).map((r) => r.cells.effect)).toEqual(
      [-2, -2, -1, -1, -1, -1, -1, -1].map((value) => ({
        type: 'number',
        printed: String(value),
        value,
        meaning: 'modifier',
      })),
    );
    expect(rows[8]?.cells.effect).toEqual({
      type: 'dice',
      printed: '-1d3',
      dice: { count: 1, sides: 3 },
      meaning: 'loss',
    });
    expect(rows[9]?.cells.effect).toEqual({ type: 'text', printed: 'See Exploration Card' });
  });
  it('preserves nine conditions, all d10 outcomes, and printed zero', () => {
    expect(
      table('table.psychology.mental_conditions').rows.map((r) => [
        r.cells.roll,
        r.cells.condition,
      ]),
    ).toEqual(
      [
        [1, 1, '1', 'Hate'],
        [2, 3, '2-3', 'Acute Stress'],
        [4, 4, '4', 'Lingering Trauma'],
        [5, 5, '5', 'Fear of the Dark'],
        [6, 6, '6', 'Arachnophobia'],
        [7, 7, '7', 'Jumpy'],
        [8, 8, '8', 'Irrational Fear'],
        [9, 9, '9', 'Claustrophobia'],
        [10, 10, '0', 'Depression'],
      ].map(([min, max, printed, name]) => [
        { type: 'range', min, max, printed },
        { type: 'text', printed: name },
      ]),
    );
    expect(corpus.entities.filter((e) => e.type === 'condition')).toHaveLength(9);
  });
  it('preserves all six trauma triggers', () => {
    expect(table('table.psychology.lingering_trauma').rows.map((r) => r.cells.trigger)).toEqual(
      [
        'A trap is sprung by the party.',
        'A portcullis falls down.',
        'A companion is reduced to 0 Hit Points.',
        'A miscast in the party.',
        'Party takes a short break.',
        'The party opens a chest.',
      ].map((printed) => ({ type: 'text', printed })),
    );
  });
  it('preserves the printed morale +1 rest even though Rest says +2', () => {
    const rows = table('table.psychology.morale_adjustments').rows;
    expect(rows.map((r) => r.cells.effect)).toEqual(
      [-6, -4, -2, -2, -2, -1, -1, -1, -1, -1, 1, 1, 2, 3, 3].map((value) => ({
        type: 'number',
        printed: value > 0 ? `+${value}` : String(value),
        value,
        meaning: 'modifier',
      })),
    );
    expect(rows[10]?.rule_refs).toEqual(['character.morale.event.short_rest']);
  });
});
