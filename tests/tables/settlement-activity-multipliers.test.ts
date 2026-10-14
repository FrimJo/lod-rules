import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { runCase } from '../support/pilot-interpreter.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';

const pilot = readPilot();
const table = (id: string) => pilot.tables.find((t) => t.id === id)!;
const printed = (id: string, row: number, column: string): string => {
  const cell = table(id).rows[row]?.cells[column];
  if (!cell || cell.type !== 'text') throw new Error(`${id} row ${row} ${column} is not text`);
  return cell.printed;
};
/** Printed one-decimal multipliers ("1,1") as tenths. */
const tenths = (value: string): number =>
  Number(value.replace(',', '')) * (value.includes(',') ? 1 : 10);
const run = (procedure_id: string, inputs: State) =>
  runCase(
    {
      id: 'test.scratch',
      procedure_id,
      inputs,
      expected: { state: {}, events: [], trace: [], unresolved: [], steps: [] },
    } as unknown as TestCase,
    pilot,
  ).state;

describe('winnings multipliers used by the arena and horse racing procedures (PDF 142, 146)', () => {
  it('matches every printed arena multiplier for every hero level and won level', () => {
    const rows = table('table.settlement.arena_odds').rows;
    expect(rows).toHaveLength(10);
    rows.forEach((_, index) => {
      const level = Number(printed('table.settlement.arena_odds', index, 'level'));
      const state = run('procedure.arena_fighting', {
        coins: 200,
        entry_fee: 100,
        combat_skill: 200,
        hit_points: 12,
        strength: 45,
        hero_level: level,
        group_roll: 1,
        semi_roll: 1,
        final_roll: 1,
        continue_to_semi: true,
        award_roll: 10,
      });
      for (const stage of ['group', 'semi', 'final'] as const)
        expect(state[`${stage}_multiplier_tenths`]).toBe(
          tenths(printed('table.settlement.arena_odds', index, stage)),
        );
    });
  });
  it('matches every printed racing multiplier for first and second place', () => {
    const rows = table('table.settlement.racing_winnings').rows;
    expect(rows).toHaveLength(10);
    rows.forEach((_, index) => {
      const level = Number(printed('table.settlement.racing_winnings', index, 'level'));
      const base = {
        owns_horse: true,
        coins: 50,
        bet: 50,
        dexterity: 60,
        hero_level: level,
        award_roll: 10,
      };
      expect(run('procedure.horse_racing', { ...base, dex_roll: 1 }).multiplier_tenths).toBe(
        tenths(printed('table.settlement.racing_winnings', index, 'first')),
      );
      expect(run('procedure.horse_racing', { ...base, dex_roll: 40 }).multiplier_tenths).toBe(
        tenths(printed('table.settlement.racing_winnings', index, 'second')),
      );
    });
  });
});

describe('bank result ranges used by the banking procedure (PDF 143)', () => {
  const banks = [
    ['chamberlings', 'chamberlings_reserve'],
    ['smartfall', 'smartfall_bank'],
    ['vault', 'the_vault'],
  ] as const;
  it('gives every 1d20 roll at every bank the printed result', () => {
    const rows = table('table.settlement.bank_returns').rows;
    for (const [column, bank] of banks)
      for (let roll = 1; roll <= 20; roll += 1) {
        const expected = rows.filter((_, index) => {
          const range = printed('table.settlement.bank_returns', index, column);
          if (range === '-') return false;
          const [min, max = min] = range.split('-').map(Number);
          return roll >= min! && roll <= max!;
        });
        expect(expected).toHaveLength(1);
        const state = run('procedure.settlement_banking', {
          in_silver_city: true,
          bank,
          balance: 100,
          roll,
          deposit: 0,
          withdrawal: 0,
          coins: 0,
        });
        expect(state.result).toBe(
          printed('table.settlement.bank_returns', rows.indexOf(expected[0]!), 'result'),
        );
      }
  });
});
