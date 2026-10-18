import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity } from '../../scripts/validate/pilot.ts';
import { readFileSync } from 'node:fs';
import { printedDiceMatches, textCellDiceErrors } from '../../scripts/validate/dice.ts';
import type { TextCellDiceExemption } from '../../scripts/validate/dice.ts';
import { createAjv, getValidator } from '../../scripts/validate/schemas.ts';
import type { Pilot } from '../../scripts/validate/pilot-types.ts';
import { phaseFourContext } from '../support/phase-four-context.ts';
const corpus = readPilot();
const context = phaseFourContext();
const ajv = createAjv();

describe('Phase 5 catalogue schema and reference boundaries', () => {
  it.each([
    ['1d6+8', { count: 1, sides: 6, modifier: 8 }, true],
    ['40+1d10', { count: 1, sides: 10, modifier: 40 }, true],
    ['2D6 + 3', { count: 2, sides: 6, modifier: 3 }, true],
    ['1d6', { count: 1, sides: 6 }, true],
    ['1d6+2', { count: 1, sides: 6, modifier: 3 }, false],
    ['1d6*2', { count: 1, sides: 6, modifier: 2 }, false],
  ] as const)('checks source dice %s', (printed, dice, expected) => {
    expect(printedDiceMatches(printed, dice)).toBe(expected);
  });
  it('rejects fractional dice modifiers and extra species properties', () => {
    const entity = structuredClone(corpus.entities.find((e) => e.id === 'species.dwarf')!);
    entity.initial_hit_points!.dice.modifier = 1.5;
    expect(getValidator(ajv, 'entities')([entity])).toBe(false);
    expect(getValidator(ajv, 'entities')([{ ...entity, expression: 'roll()' }])).toBe(false);
  });
  it('requires species profiles and forbids species fields on professions', () => {
    const entity = structuredClone(corpus.entities.find((e) => e.id === 'species.dwarf')!);
    delete entity.initial_hit_points;
    expect(getValidator(ajv, 'entities')([entity])).toBe(false);
    const profession = corpus.entities.find((e) => e.id === 'profession.thief')!;
    expect(
      getValidator(
        ajv,
        'entities',
      )([
        {
          ...profession,
          talent_selection: {
            selection: 'random',
            category_selection: 'choice',
            quantity: 1,
          },
        },
      ]),
    ).toBe(false);
  });
  const mutations: Array<[string, (p: Pilot) => void, string]> = [
    [
      'missing row',
      (p) => {
        p.entities.find((e) => e.id === 'species.dwarf')!.table_rows![0]!.row_id = 'absent';
      },
      'unknown table row',
    ],
    [
      'wrong reference kind',
      (p) => {
        p.entities.find((e) => e.id === 'species.dwarf')!.table_rows![0]!.table_id = 'talent.fast';
      },
      'wrong reference kind',
    ],
    [
      'wrong grant kind',
      (p) => {
        p.entities.find((e) => e.id === 'species.dwarf')!.grants![0]!.object_id = 'condition.hate';
      },
      'grant kind mismatch',
    ],
    [
      'bad nested provenance',
      (p) => {
        const t = p.tables.find((t) => t.id === 'table.character.dwarf_stats')!;
        t.rows[0]!.source = [{ ...t.source[0]!, printed_page: 999 }];
      },
      'printed/pdf page mismatch',
    ],
    [
      'dice spelling mismatch',
      (p) => {
        p.entities.find((e) => e.id === 'species.dwarf')!.initial_hit_points!.printed = '1d6+9';
      },
      'printed hit-point dice mismatch',
    ],
  ];
  it.each(mutations)('rejects %s', (_, mutate, message) => {
    const data = structuredClone(corpus);
    mutate(data);
    expect(checkPilotIntegrity(data, context).some((e) => e.includes(message))).toBe(true);
  });
});

describe('perk costs, blank cells and quest scope', () => {
  it('rejects passive perks and missing activation costs', () => {
    const e = structuredClone(corpus.entities.find((e) => e.id === 'perk.healer')!);
    expect(getValidator(ajv, 'entities')([{ ...e, activation: 'passive' }])).toBe(false);
    delete e.activation_cost;
    expect(getValidator(ajv, 'entities')([e])).toBe(false);
  });
  it('does not permit perk cost fields on talents', () => {
    const e = corpus.entities.find((e) => e.type === 'talent')!;
    expect(
      getValidator(ajv, 'entities')([{ ...e, activation_cost: { energy: 1, action_points: 0 } }]),
    ).toBe(false);
  });
  it('distinguishes printed blanks from markers', () => {
    const t = structuredClone(corpus.tables.find((t) => t.id === 'table.perk.leader')!);
    expect(t.rows[0]!.cells.comment).toEqual({ type: 'blank', printed: '' });
    expect(getValidator(ajv, 'tables')([t])).toBe(true);
    const invalid = {
      ...t,
      rows: [
        { ...t.rows[0], cells: { ...t.rows[0]!.cells, comment: { type: 'blank', printed: '-' } } },
      ],
    };
    expect(getValidator(ajv, 'tables')([invalid])).toBe(false);
  });
  it('requires an explicit quest on scenario rules', () => {
    const r = structuredClone(corpus.rules.find((r) => r.type === 'scenario_rule')!);
    delete r.quest_id;
    expect(getValidator(ajv, 'rules')([r])).toBe(false);
  });
  it('rejects wrong-kind quest targets', () => {
    const data = structuredClone(corpus);
    data.rules.find((r) => r.type === 'scenario_rule')!.quest_id = 'species.dwarf';
    expect(checkPilotIntegrity(data, context).join('\n')).toContain('quest');
  });
});

describe('equipment catalogue links', () => {
  it('requires equipment category and checks bidirectional table-row references', () => {
    const equipment = corpus.entities.find((entity) => entity.type === 'equipment')!;
    expect(getValidator(ajv, 'entities')([equipment])).toBe(true);
    expect(getValidator(ajv, 'entities')([{ ...equipment, category: undefined }])).toBe(false);
    const row = corpus.tables
      .flatMap((table) => table.rows)
      .find((candidate) => candidate.entity_refs?.includes(equipment.id));
    expect(row).toBeDefined();
    const broken = structuredClone(corpus);
    broken.tables
      .flatMap((table) => table.rows)
      .find((candidate) => candidate.entity_refs)
      ?.entity_refs?.push('equipment.absent');
    expect(checkPilotIntegrity(broken, context).join('\n')).toContain(
      'unknown reference equipment.absent',
    );
  });

  it('preserves all named weapon, armour and shield rows as source-linked entities', () => {
    for (const tableId of [
      'table.equipment.weapons',
      'table.equipment.armour',
      'table.equipment.shields',
    ]) {
      const table = corpus.tables.find((candidate) => candidate.id === tableId)!;
      const itemRows = table.rows.filter((row) => !/^Tier \d+:$/.test(row.source_row));
      expect(itemRows.every((row) => row.entity_refs?.length === 1)).toBe(true);
    }
  });
});

describe('text-cell dice guard', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/text-cell-dice-exemptions.json', import.meta.url), 'utf8'),
  );
  const isExemption = (e: unknown): e is TextCellDiceExemption =>
    typeof e === 'object' &&
    e !== null &&
    ['table_id', 'row_id', 'reason'].every(
      (k) => typeof (e as Record<string, unknown>)[k] === 'string',
    );
  if (!Array.isArray(raw) || !raw.every(isExemption)) throw new Error('bad exemption fixture');
  const exemptions: TextCellDiceExemption[] = raw;
  type Row = Pilot['tables'][number]['rows'][number];
  const withRow = (row: Row) => {
    const copy = structuredClone(corpus.tables);
    copy.find((t) => t.id === 'table.settlement.events')!.rows.push(row);
    return copy;
  };
  const untyped = (printed = 'The party loses 1d2 rations.'): Row => ({
    id: 'synthetic',
    source_row: 'synthetic',
    cells: { event: { type: 'text', printed } },
  });

  it('finds every text-cell die typed, linked through rule_refs or exempted', () => {
    expect(textCellDiceErrors(corpus.tables, exemptions)).toEqual([]);
  });
  it('gives every exemption one source-based reason', () => {
    const keys = exemptions.map((e) => `${e.table_id}/${e.row_id}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const e of exemptions) expect(e.reason).toMatch(/PDF \d+/);
  });
  it('names the table and row of an untyped text-cell die', () => {
    expect(textCellDiceErrors(withRow(untyped()), exemptions)).toEqual([
      'table.settlement.events/synthetic: die printed in a text cell without a dice cell, rule_refs or exemption',
    ]);
  });
  it('accepts a row with a typed dice cell', () => {
    const row = untyped();
    row.cells.event_dice = {
      type: 'dice',
      printed: '1d2',
      dice: { count: 1, sides: 2 },
      meaning: 'loss',
    };
    expect(textCellDiceErrors(withRow(row), exemptions)).toEqual([]);
  });
  it('accepts a row linked through rule_refs', () => {
    const row = { ...untyped(), rule_refs: ['character.settlement.event.4'] };
    expect(textCellDiceErrors(withRow(row), exemptions)).toEqual([]);
  });
  it('accepts an exempted row', () => {
    const extra = { table_id: 'table.settlement.events', row_id: 'synthetic', reason: 'x' };
    expect(textCellDiceErrors(withRow(untyped()), [...exemptions, extra])).toEqual([]);
  });
  it('rejects stale exemptions', () => {
    const gone = { table_id: 'table.settlement.events', row_id: 'absent', reason: 'x' };
    const noDie = { table_id: 'table.settlement.events', row_id: 'row_1', reason: 'x' };
    expect(textCellDiceErrors(corpus.tables, [...exemptions, gone, noDie])).toEqual([
      'table.settlement.events/absent: stale exemption, row not found',
      'table.settlement.events/row_1: stale exemption, row prints no die in a text cell',
    ]);
  });
  it.each(['1D10 DMG', 'heal 1d3', '+1d2 days', 'D3'])('detects %s as a die', (printed) => {
    expect(textCellDiceErrors(withRow(untyped(printed)), exemptions)).toHaveLength(1);
  });
  it.each(['road 2d', 'Card D5', 'id10x', '1d7'])('ignores %s', (printed) => {
    expect(textCellDiceErrors(withRow(untyped(printed)), exemptions)).toEqual([]);
  });
});
