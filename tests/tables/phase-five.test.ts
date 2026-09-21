import { describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
const corpus = readPilot();
describe('Phase 5 independently transcribed species profiles', () => {
  // PDF 30–31, rendered and checked: columns STR CON DEX WIS RES.
  it.each([
    ['dwarf', [40, 30, 25, 25, 30], 8],
    ['elf', [25, 20, 40, 35, 30], 6],
    ['halfling', [20, 20, 40, 30, 40], 5],
    ['human', [30, 30, 30, 30, 30], 7],
  ] as const)('preserves every %s stat and initial HP', (name, modifiers, hp) => {
    const table = corpus.tables.find((t) => t.id === `table.character.${name}_stats`)!;
    expect(table.columns.map((c) => c.label)).toEqual(['STR', 'CON', 'DEX', 'WIS', 'RES']);
    expect(table.rows).toHaveLength(1);
    expect(table.columns.map((c) => table.rows[0]!.cells[c.id])).toEqual(
      modifiers.map((modifier) => ({
        type: 'dice',
        printed: `${modifier}+1d10`,
        dice: { count: 1, sides: 10, modifier },
        meaning: 'initial',
      })),
    );
    expect(table.footnotes).toEqual([]);
    expect(parse(stringify(table))).toEqual(table);
    const entity = corpus.entities.find((e) => e.id === `species.${name}`)!;
    expect(entity.initial_hit_points).toEqual({
      printed: `1d6+${hp}`,
      dice: { count: 1, sides: 6, modifier: hp },
    });
    expect(entity.table_rows).toEqual([{ table_id: table.id, row_id: 'initial' }]);
  });
  it('keeps the Human choice of category separate from random talent selection', () => {
    expect(corpus.entities.find((e) => e.id === 'species.human')!.talent_selection).toEqual({
      selection: 'random',
      category_selection: 'choice',
      quantity: 1,
    });
  });
});

describe('Phase 5 independent profession matrices, PDF 35–37 and 39–41', () => {
  it.each([
    [
      'barbarian',
      ['+15', '-10', '+5', '-20', '-15', '-10'],
      ['-25', '-5', 'N/A', '-15', 'N/A', '+2'],
    ],
    ['ranger', ['-5', '+15', '-5', '-25', '-20', '-10'], ['-20', '0', 'N/A', '+15', 'N/A', '±0']],
    ['rogue', ['0', '0', '0', '0', '+5', '-10'], ['-25', '0', 'N/A', '0', 'N/A', '+1']],
    ['warrior', ['+10', '+5', '0', '-20', '-15', '-10'], ['-25', '-10', 'N/A', '-15', 'N/A', '+3']],
    [
      'warrior_priest',
      ['+5', '-5', '-5', '-20', '-10', '+5'],
      ['-15', '-10', 'N/A', '-20', '+15', '+1'],
    ],
    ['wizard', ['-5', '-10', '-10', '-20', '+5', '-5'], ['-20', '-10', '+10', '-20', 'N/A', '±0']],
  ])('preserves every %s cell and modifier meaning', (name, left, right) => {
    const table = corpus.tables.find((t) => t.id === `table.character.${name}_skills`)!;
    expect(table.columns.map((c) => c.label)).toEqual(['Skill', 'Mod', 'Skill', 'Mod']);
    expect(table.rows.map((r) => r.cells.left_skill!.printed)).toEqual([
      'Combat Skill',
      'Ranged Skill',
      'Dodge',
      'Pick Locks',
      'Barter',
      'Heal',
    ]);
    expect(table.rows.map((r) => r.cells.right_skill!.printed)).toEqual([
      'Alchemy',
      'Perception',
      'Arcane Art',
      'Foraging',
      'Battle Prayers',
      'Hit Points',
    ]);
    expect(table.rows.map((r) => r.cells.left_modifier!.printed)).toEqual(left);
    expect(table.rows.map((r) => r.cells.right_modifier!.printed)).toEqual(right);
    for (const row of table.rows)
      for (const name of ['left_modifier', 'right_modifier']) {
        const cell = row.cells[name]!;
        if (cell.type === 'number') expect(cell.value).toBe(Number(cell.printed.replace('±', '')));
        else expect(cell).toEqual({ type: 'marker', printed: 'N/A', meaning: 'unavailable' });
      }
    expect(table.footnotes).toEqual([]);
    expect(parse(stringify(table))).toEqual(table);
  });
  it('preserves alternative grants, starting abilities, and both Rogue backpacks', () => {
    const entity = (id: string) => corpus.entities.find((e) => e.id === `profession.${id}`)!;
    expect(entity('ranger').grant_choices![0]!.options.map((o) => o.label)).toEqual([
      'Marksman',
      'Hunter',
    ]);
    expect(entity('warrior').grant_choices![0]!.options.map((o) => o.label)).toEqual([
      'Mighty Blow',
      'Braveheart',
    ]);
    expect(entity('warrior_priest').grant_choices![0]!.options.map((o) => o.label)).toEqual([
      'Braveheart',
      'Confident',
    ]);
    expect(
      entity('rogue')
        .starting_equipment!.filter((i) => /backpack/i.test(i.label))
        .map((i) => i.label),
    ).toEqual(['Small Backpack', 'Medium backpack']);
    expect(
      entity('rogue')
        .starting_equipment!.find((i) => i.selection === 'choice')!
        .options!.map((o) => o.label),
    ).toEqual(['Shortsword', 'Rapier']);
    expect(
      entity('wizard').starting_abilities!.map((s) => [s.kind, s.quantity, s.level, s.category]),
    ).toEqual([
      ['spell', 3, 1, undefined],
      ['perk', 1, undefined, 'Arcane'],
    ]);
    expect(entity('warrior_priest').starting_abilities![0]).toMatchObject({
      kind: 'prayer',
      quantity: 2,
      level: 1,
    });
  });
});

describe('complete Physical Talents catalogue', () => {
  it('preserves all twelve printed rows and the repeated source word', () => {
    const t = corpus.tables.find((t) => t.id === 'table.talent.physical_pilot')!;
    expect(t.completeness).toBe('complete');
    expect(t.selection).toBeUndefined();
    expect(t.rows.map((r) => r.cells.talent!.printed)).toEqual([
      'Catlike',
      'Fast',
      'Mule',
      'Night Vision',
      'Observant',
      'Perfect Hearing',
      'Resilient',
      'Resistance to Disease',
      'Resistance to Poison',
      'Strong',
      'Strong Build',
      'Tank',
    ]);
    expect(t.rows.find((r) => r.id === 'perfect_hearing')!.cells.description!.printed).toContain(
      'and and',
    );
    expect(t.rows.find((r) => r.id === 'mule')!.cells.description!.printed).toBe(
      'Your hero is used to carry heavy equipment during long travels. Your hero can carry 20 ENC more than the STR value would allow.',
    );
    for (const row of t.rows) expect(row.rule_refs!.length).toBeGreaterThan(0);
  });
});
