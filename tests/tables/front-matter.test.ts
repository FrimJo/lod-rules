import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';

const table = readPilot().tables.find((x) => x.id === 'table.front_matter.index_of_art')!;
const pages = table.rows.map((row) => row.cells.page?.printed);
const art = (page: string, nth = 0) =>
  table.rows.filter((row) => row.cells.page?.printed === page)[nth]?.cells.art?.printed;

describe('Index of Art — rendered PDF 11 (printed 9)', () => {
  it('keeps both printed blocks as one structured Page | Art table', () => {
    expect(table.section_id).toBe('section.front_matter.index_of_art.table');
    expect(table.columns.map((c) => c.label)).toEqual(['Page', 'Art']);
    expect(table.rows).toHaveLength(64);
    expect(pages[0]).toBe('Cover');
    expect(pages[31]).toBe('Quest Book Cover');
    expect(pages[32]).toBe('191');
    expect(pages[63]).toBe('Charts compendium cover');
  });

  it('preserves printed order and spelling verbatim', () => {
    expect(pages.indexOf('77-79')).toBeLessThan(pages.indexOf('72'));
    expect(art('3')).toBe('Skelton Knight by Foto Costic');
    expect(art('191')).toBe('Alchemist`s stove and other objects by Obsidian fantasy');
    expect(art('235,240')).toBe('Spiders by Digitalstormcinema');
    expect(art('284')).toBe('Old Well on a Poppy Meadow by Obsidianfantasy');
  });

  it('keeps the page numbers of other books under their cover rows', () => {
    const after = (cover: string) => pages.slice(pages.indexOf(cover) + 1);
    expect(after('Bestiary Cover').slice(0, 2)).toEqual(['1', '12']);
    expect(after('Dark Pyramid Cover').slice(0, 6)).toEqual(['1', '3', '5', '6', '7', '10']);
    expect(after('Quest Book II cover').slice(0, 8)).toEqual([
      '13',
      '30',
      '35',
      '39',
      '54',
      '61',
      '76',
      '89',
    ]);
    expect(art('Dark Pyramid Cover')).toBe('By Marlene Robinson');
  });
});
