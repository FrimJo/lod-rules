import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
const tables = readPilot().tables;
const table = (suffix: string) =>
  tables.find((x) => x.id === `table.quest.spring_cleaning.${suffix}`)!;

describe('Spring Cleaning printed tables — rendered PDF 224–225', () => {
  it('retains the complete Threat grid', () => {
    expect(table('threat').columns.map((x) => x.label)).toEqual([
      'Start Threat Level',
      'Min Threat Level',
      'Max Threat Level',
    ]);
    expect(table('threat').rows[0]?.cells).toEqual({
      start: { type: 'number', printed: '2', value: 2, meaning: 'value' },
      min: { type: 'number', printed: '2', value: 2, meaning: 'value' },
      max: { type: 'number', printed: '18', value: 18, meaning: 'value' },
    });
  });
  it('preserves all seven encounter ranges, printed 00 and the Johann footnote', () => {
    const encounter = table('encounters');
    expect(encounter.rows.map((x) => x.cells.roll)).toEqual([
      { type: 'range', printed: '01-30', min: 1, max: 30 },
      { type: 'range', printed: '31-45', min: 31, max: 45 },
      { type: 'range', printed: '46-55', min: 46, max: 55 },
      { type: 'range', printed: '56-65', min: 56, max: 65 },
      { type: 'range', printed: '66-75', min: 66, max: 75 },
      { type: 'range', printed: '76-85', min: 76, max: 85 },
      { type: 'range', printed: '86-00', min: 86, max: 100 },
    ]);
    expect(encounter.rows.map((x) => x.cells.encounter?.printed)).toEqual([
      '1d4 Giant rats',
      'Johann the gardener',
      'Bat swarm',
      '1d6 Giant rats',
      '1d3 Pox rats',
      '1d2 Giant snakes',
      '1 Giant spider',
    ]);
    expect(encounter.footnotes).toEqual([
      'Johann can only appear once. If you end up with 31-45 again then place 1d4 Giant Rats and 1 Bat swarm.',
    ]);
    expect(encounter.roll_domain).toEqual({ min: 1, max: 100 });
  });
  it('retains the two printed Brood Mother header bands, typed dice and dash', () => {
    const stats = table('brood_mother');
    expect(stats.columns.map((x) => x.label)).toEqual([
      'CS',
      'RS',
      'DMG',
      'NA',
      'DEX',
      'To hit',
      'RES',
      'M',
      'HP',
    ]);
    expect(stats.rows[0]?.cells).toEqual({
      cs: { type: 'number', printed: '45', value: 45, meaning: 'value' },
      rs: { type: 'marker', printed: '-', meaning: 'not_specified' },
      dmg: { type: 'dice', printed: '1d10', dice: { count: 1, sides: 10 }, meaning: 'value' },
      na: { type: 'number', printed: '1', value: 1, meaning: 'value' },
      dex: { type: 'number', printed: '35', value: 35, meaning: 'value' },
      to_hit: { type: 'number', printed: '-5', value: -5, meaning: 'value' },
      res: { type: 'number', printed: '25', value: 25, meaning: 'value' },
      m: { type: 'number', printed: '4', value: 4, meaning: 'value' },
      hp: { type: 'number', printed: '15', value: 15, meaning: 'value' },
    });
    expect(stats.footnotes).toContain('XP: 115.');
    expect(stats.source[0]).toMatchObject({ pdf_page: 225, printed_page: 223 });
  });
});
