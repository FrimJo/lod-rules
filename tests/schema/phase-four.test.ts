import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity } from '../../scripts/validate/pilot.ts';
import { createAjv, getValidator } from '../../scripts/validate/schemas.ts';
import type { Effect, Operand, Pilot } from '../../scripts/validate/pilot-types.ts';
import { phaseFourContext } from '../support/phase-four-context.ts';
import { evaluateOperand, runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const context = phaseFourContext();
const ajv = createAjv();
const rule = () => structuredClone(corpus.rules.find((r) => r.id === 'character.mana.initial')!);

describe('Phase 4 schema and integrity boundaries', () => {
  it.each([
    { type: 'arithmetic', operator: 'eval', values: [] },
    { type: 'arithmetic', operator: 'floor', values: [], expression: 'Math.floor(x)' },
    { type: 'lookup', table_id: 'missing' },
  ])('rejects malformed operations %j', (operation) => {
    const r = rule();
    r.effects = [{ type: 'set', target: 'mana', value: operation as Operand }];
    expect(getValidator(ajv, 'rules')([r])).toBe(false);
  });
  const mutations: Array<[string, (data: Pilot) => void, string]> = [
    [
      'wrong arithmetic arity',
      (d) => {
        d.rules.find((r) => r.id === 'character.mana.initial')!.effects = [
          {
            type: 'set',
            target: 'mana',
            value: {
              type: 'arithmetic',
              operator: 'floor',
              values: [
                { type: 'literal', value: 2 },
                { type: 'literal', value: 3 },
              ],
            },
          },
        ];
      },
      'arity',
    ],
    [
      'division by zero',
      (d) => {
        d.rules.find((r) => r.id === 'character.mana.initial')!.effects = [
          {
            type: 'set',
            target: 'mana',
            value: {
              type: 'arithmetic',
              operator: 'divide',
              values: [
                { type: 'literal', value: 2 },
                { type: 'literal', value: 0 },
              ],
            },
          },
        ];
      },
      'division by zero',
    ],
    [
      'nonnumeric arithmetic',
      (d) => {
        d.rules.find((r) => r.id === 'character.mana.initial')!.effects = [
          {
            type: 'set',
            target: 'mana',
            value: {
              type: 'arithmetic',
              operator: 'floor',
              values: [{ type: 'literal', value: 'two' }],
            },
          },
        ];
      },
      'requires numbers',
    ],
    [
      'missing lookup column',
      (d) => {
        (
          d.rules.find((r) => r.id === 'character.damage_bonus.lookup')!.effects[0] as Extract<
            Effect,
            { type: 'lookup' }
          >
        ).value_column = 'missing';
      },
      'unknown lookup column',
    ],
    [
      'lookup into wrong result type',
      (d) => {
        d.rules.find((r) => r.id === 'character.skill.base_stat')!.fields.base_stat!.type =
          'number';
      },
      'lookup output type mismatch',
    ],
    [
      'resolved fallback issue',
      (d) => {
        (
          d.rules.find((r) => r.id === 'character.damage_bonus.lookup')!.effects[0] as Extract<
            Effect,
            { type: 'lookup' }
          >
        ).on_missing_issue = 'issue.0005';
      },
      'open issue',
    ],
    [
      'bad dice bounds',
      (d) => {
        d.rules.find((r) => r.id === 'core.dice.percentile')!.fields.roll!.maximum = 99;
      },
      'matching integer bounds',
    ],
    [
      'random table gap',
      (d) => {
        d.tables.find((t) => t.id === 'table.psychology.mental_conditions')!.rows.splice(0, 1);
      },
      'gap or overlap',
    ],
    [
      'random table overlap',
      (d) => {
        d.tables.find((t) => t.id === 'table.psychology.mental_conditions')!.rows[0]!.cells.roll = {
          type: 'range',
          printed: '1-2',
          min: 1,
          max: 2,
        };
      },
      'gap or overlap',
    ],
    [
      'missing roll domain',
      (d) => {
        delete d.tables.find((t) => t.id === 'table.psychology.mental_conditions')!.roll_domain;
      },
      'requires roll domain',
    ],
    [
      'dangling row rule',
      (d) => {
        d.tables.find((t) => t.id === 'table.psychology.sanity_losses')!.rows[0]!.rule_refs = [
          'character.missing',
        ];
      },
      'unknown reference',
    ],
    [
      'non-temporal timing reference',
      (d) => {
        d.rules.find((r) => r.id === 'core.action_points.allocation')!.timing_refs = [
          'term.strength',
        ];
      },
      'must be temporal',
    ],
  ];
  it.each(mutations)('rejects %s', (_name, mutate, message) => {
    const changed = structuredClone(corpus);
    mutate(changed);
    expect(checkPilotIntegrity(changed, context).join('\n')).toContain(message);
  });
  it('rejects out-of-domain d6 fixture input', () => {
    const test = structuredClone(
      corpus.testCases.find((t) => t.id === 'test.character.recovery.short_rest_energy.three')!,
    );
    test.inputs.die = 7;
    expect(() => runCase(test, corpus)).toThrow('Input out of range');
  });
  it('rejects dynamic division by zero and unsupported arithmetic', () => {
    expect(() =>
      evaluateOperand(
        {
          type: 'arithmetic',
          operator: 'divide',
          values: [
            { type: 'literal', value: 1 },
            { type: 'field', name: 'zero' },
          ],
        },
        { zero: 0 },
      ),
    ).toThrow('Division by zero');
    expect(() =>
      evaluateOperand(
        {
          type: 'arithmetic',
          operator: 'eval',
          values: [{ type: 'literal', value: 1 }],
        } as unknown as Operand,
        {},
      ),
    ).toThrow('Unsupported arithmetic');
  });
  it('does not commit effects after unresolved lookup', () => {
    const fixture = corpus.testCases.find(
      (t) => t.id === 'test.character.durability.repair_price.unlisted_price',
    )!;
    const result = runCase(fixture, corpus);
    expect(result.state).toEqual(fixture.inputs);
    expect(result.unresolved).toEqual(['issue.phase4.lookup_domain']);
  });
});
