import { describe, expect, it } from 'vitest';
import source from '../fixtures/treasures/source-tables.json';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity } from '../../scripts/validate/pilot.ts';
import { phaseFourContext } from '../support/phase-four-context.ts';
const corpus = readPilot();
const tables = corpus.tables.filter((t) => t.id.startsWith('table.treasure.'));
const table = (id: string) => tables.find((t) => t.id === `table.treasure.${id}`)!;
const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();
const joined = (cells: (string | null)[]) => clean(cells.filter(Boolean).join(' '));
const matrix = (id: string, columns: string[]) =>
  table(id).rows.map((r) => columns.map((col) => r.cells[col]!.printed));
// Reconstruct geometric source cells; no canonical file is used to build expectations.
function sourceRows(raw: (string | null)[][], widths: number[]): string[][] {
  const rows: string[][] = [];
  for (const rawRow of raw.slice(1)) {
    let offset = 0;
    const cells = widths.map((width) => {
      const value = joined(rawRow.slice(offset, offset + width));
      offset += width;
      return value;
    });
    if (cells[0]) rows.push(cells);
    else
      cells.forEach((cell, i) => {
        if (cell) rows.at(-1)![i] += ' ' + cell;
      });
  }
  return rows;
}
const furniture: string[][] = [];
for (const [page, raw] of [
  [194, source['194'][0]!],
  [195, source['195'][0]!],
] as const) {
  for (const row of page === 194 ? raw.slice(1) : raw) {
    const name = joined(row.slice(0, 3)),
      result = joined(row.slice(3));
    if (name === 'hole)') {
      furniture.at(-1)![0] += ' hole)';
      furniture.at(-1)![1] += ' ' + result;
    } else if (name) furniture.push([name, result]);
    else furniture.at(-1)![1] += ' ' + result;
  }
}
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_$/, '');

describe('treasure source cell regression matrices', () => {
  it('preserves every room/corridor and original furniture cell', () => {
    expect(matrix('rooms_corridors', ['roll', 'result'])).toEqual(
      sourceRows(source['193'][0]!, [3, 3]),
    );
    expect(matrix('furniture', ['furniture', 'findings'])).toEqual(furniture);
    expect(furniture).toHaveLength(35);
  });
  it.each([
    [0, 1],
    [1, 4],
    [2, 2],
    [3, 5],
    [4, 3],
  ])('preserves enemy loot table source %i / T%i', (index, number) => {
    expect(matrix(`t${number}`, ['roll', 'result'])).toEqual(
      source['196'][index!]!.slice(1).map((r) => r.filter(Boolean).map(clean)),
    );
  });
  it('preserves all six relic names and effects, including split glyphs', () => {
    const relicSource = source['196'][5]!;
    expect(matrix('relics', ['roll', 'relic', 'effect'])).toEqual(
      relicSource
        .slice(1)
        .map((r) => [
          joined(r.slice(0, 3)),
          joined(r.slice(3, 6)).replace('R elic', 'Relic'),
          joined(r.slice(6)),
        ]),
    );
  });
  it('preserves every Powerstone and curse cell', () => {
    expect(matrix('powerstones', ['roll', 'result'])).toEqual(
      sourceRows(source['199'][0]!, [3, 3]),
    );
    expect(matrix('curses', ['roll', 'result'])).toEqual(sourceRows(source['202'][0]!, [3, 3]));
  });
  it.each([
    ['magic_weapons', source['200'][0]!],
    ['magic_armours_shields', source['201'][0]!],
    ['magic_items', source['201'][2]!],
  ] as const)('preserves all %s descriptions and effects', (id, raw) => {
    expect(matrix(id, ['roll', 'description', 'effect'])).toEqual(sourceRows(raw, [3, 3, 3]));
  });
  it('preserves all 30 legendary selector rows, 60 blank cells, and the projectile table', () => {
    expect(matrix('legendary', ['group_1', 'group_2', 'group_3', 'item'])).toEqual(
      source['202'][1]!.slice(2).map((r) => [0, 3, 6, 9].map((n) => joined(r.slice(n, n + 3)))),
    );
    expect(
      table('legendary')
        .rows.flatMap((r) => Object.values(r.cells))
        .filter((c) => c.type === 'blank'),
    ).toHaveLength(60);
    expect(matrix('necklace_deflection', ['roll', 'result'])).toEqual(
      sourceRows(source['213'][0]!, [3, 3]),
    );
  });
  it.each(furniture)('keeps every nested outcome for %s', (name, original) => {
    const sections = original!.split('If you choose to drink from the fountain:');
    sections.forEach((text, index) => {
      if (!text.trim()) return;
      const expected = [
        ...text.matchAll(/(?:^|\s)(\d+(?:-\d+)?):\s*([\s\S]*?)(?=\s\d+(?:-\d+)?:|$)/g),
      ].map((m) => [m[1], m[2]]);
      expect(
        matrix('furniture.' + slug(name!) + (index ? '_drink' : ''), ['roll', 'result']),
      ).toEqual(expected);
    });
  });
  it.each(tables.filter((t) => t.type === 'random_table'))(
    'covers every endpoint without overlap: $id',
    (t) => {
      const ranges = t.rows.map((r) => Object.values(r.cells).find((c) => c.type === 'range')!);
      for (let n = t.roll_domain!.min; n <= t.roll_domain!.max; n++) {
        expect(
          ranges.filter((r) => r.type === 'range' && r.min <= n && r.max >= n),
          `${t.id}: ${n}`,
        ).toHaveLength(1);
      }
      for (const range of ranges) {
        if (range.type !== 'range') throw new Error('Expected range');
        const printed = range.printed.split(/[-–]/).map(Number);
        expect(range.min).toBe(printed[0]);
        expect(range.max).toBe(
          printed.length === 1 ? printed[0] : printed[1] === 0 ? 100 : printed[1],
        );
      }
    },
  );
  it('does not equate selector names, add Armour of the Father, or invent missing probabilities', () => {
    const ids = table('legendary').rows.flatMap((r) => r.entity_refs ?? []);
    expect(ids).toContain('equipment.legendary.belt_of_oakenshield');
    expect(ids).toContain('equipment.legendary.the_golden_kopesh');
    expect(ids).not.toContain('equipment.legendary.belt_of_copperbane');
    expect(ids).not.toContain('equipment.legendary.the_golden_khopesh');
    expect(ids).not.toContain('equipment.legendary.armour_of_the_father');
    for (const id of ['belt_of_copperbane', 'the_golden_khopesh', 'armour_of_the_father'])
      expect(
        corpus.entities.find((e) => e.id === 'equipment.legendary.' + id)!.issues!.length,
      ).toBeGreaterThan(0);
  });
  it('rejects missing references and nonreciprocal treasure entity links', () => {
    const bad = structuredClone(corpus);
    bad.tables.find((t) => t.id === 'table.treasure.powerstones')!.rows[0]!.entity_refs = [
      'equipment.not_present',
    ];
    expect(checkPilotIntegrity(bad, phaseFourContext()).join('\n')).toContain('unknown reference');
    const broken = structuredClone(corpus);
    broken.entities.find((e) => e.id === 'equipment.powerstone.effect_1')!.table_rows = [];
    expect(checkPilotIntegrity(broken, phaseFourContext()).join('\n')).toMatch(
      /reciprocal|back|row/i,
    );
  });
});
