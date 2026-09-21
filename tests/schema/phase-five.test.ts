import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity } from '../../scripts/validate/pilot.ts';
import { printedDiceMatches } from '../../scripts/validate/dice.ts';
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
