import type { Cell, Dice } from './pilot-types.ts';

/** Compare source notation without evaluating arbitrary expressions or changing its spelling. */
export function printedDiceMatches(printed: string, dice: Dice, sign = ''): boolean {
  let notation = printed.replace(/\s+/g, '').toLowerCase();
  if (sign) {
    if (!notation.startsWith(sign)) return false;
    notation = notation.slice(1);
  }
  const trailing = /^(\d+)d(\d+)([+-]\d+)?$/.exec(notation);
  const leading = /^(\d+)\+(\d+)d(\d+)$/.exec(notation);
  if (trailing)
    return (
      Number(trailing[1]) === dice.count &&
      Number(trailing[2]) === dice.sides &&
      Number(trailing[3] ?? 0) === (dice.modifier ?? 0)
    );
  return Boolean(
    leading &&
    Number(leading[1]) === (dice.modifier ?? 0) &&
    Number(leading[2]) === dice.count &&
    Number(leading[3]) === dice.sides,
  );
}

/** A die printed in prose: optional count, `d`, and a die size the book uses (d2 up to d100). */
const PRINTED_DIE = /\b(\d*)d(2|3|4|6|8|10|12|20|100)\b/gi;

export interface TextCellDiceExemption {
  table_id: string;
  row_id: string;
  reason: string;
}

interface DiceGuardTable {
  id: string;
  rows: Array<{ id: string; cells: Record<string, Cell>; rule_refs?: string[] }>;
}

type GuardRow = DiceGuardTable['rows'][number];

/** Normalised `NdM` notation; a bare `dM` counts one die. Signs and modifiers are not part of it. */
const notation = (count: number, sides: number): string => `${count}d${sides}`;

/** Every die printed in the row's text cells, normalised and in print order. */
const textDice = (row: GuardRow): string[] =>
  Object.values(row.cells).flatMap((c) =>
    c.type === 'text'
      ? [...c.printed.matchAll(PRINTED_DIE)].map((m) => notation(Number(m[1] || 1), Number(m[2])))
      : [],
  );

/**
 * Rows that print a die in a text cell must type each such die in a dice cell of the same row
 * (matched on count and sides, so `1d8+the number of spent days` is typed by `1d8`), link the
 * rule that types the expression (row `rule_refs`) or carry a reasoned exemption. No `composite`
 * cell type exists, so only `dice` cells count as typing. Exemptions that no longer apply are
 * stale.
 */
export function textCellDiceErrors(
  tables: DiceGuardTable[],
  exemptions: TextCellDiceExemption[],
): string[] {
  const exempt = new Set(exemptions.map((e) => `${e.table_id}/${e.row_id}`));
  const errors: string[] = [];
  for (const table of tables)
    for (const row of table.rows) {
      const key = `${table.id}/${row.id}`;
      if (exempt.has(key) || row.rule_refs?.length) continue;
      const typed = new Set(
        Object.values(row.cells).flatMap((c) =>
          c.type === 'dice' ? [notation(c.dice.count, c.dice.sides)] : [],
        ),
      );
      for (const die of new Set(textDice(row)))
        if (!typed.has(die))
          errors.push(
            `${key}: die ${die} printed in a text cell is not typed by a dice cell, rule_refs or exemption`,
          );
    }
  for (const e of exemptions) {
    const row = tables.find((t) => t.id === e.table_id)?.rows.find((r) => r.id === e.row_id);
    const key = `${e.table_id}/${e.row_id}`;
    if (!row) errors.push(`${key}: stale exemption, row not found`);
    else if (!textDice(row).length)
      errors.push(`${key}: stale exemption, row prints no die in a text cell`);
  }
  return errors;
}
