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
const PRINTED_DIE = /\b\d*d(?:2|3|4|6|8|10|12|20|100)\b/i;

export interface TextCellDiceExemption {
  table_id: string;
  row_id: string;
  reason: string;
}

interface DiceGuardTable {
  id: string;
  rows: Array<{ id: string; cells: Record<string, Cell>; rule_refs?: string[] }>;
}

const printsTextDie = (row: DiceGuardTable['rows'][number]): boolean =>
  Object.values(row.cells).some((c) => c.type === 'text' && PRINTED_DIE.test(c.printed));

/**
 * Rows that print a die in a text cell must type it (a dice cell), link the rule that types it
 * (row `rule_refs`) or carry a reasoned exemption. Exemptions that no longer apply are stale.
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
      if (!printsTextDie(row) || exempt.has(key)) continue;
      const typed = Object.values(row.cells).some((c) => c.type === 'dice');
      if (!typed && !row.rule_refs?.length)
        errors.push(
          `${key}: die printed in a text cell without a dice cell, rule_refs or exemption`,
        );
    }
  for (const e of exemptions) {
    const row = tables.find((t) => t.id === e.table_id)?.rows.find((r) => r.id === e.row_id);
    const key = `${e.table_id}/${e.row_id}`;
    if (!row) errors.push(`${key}: stale exemption, row not found`);
    else if (!printsTextDie(row))
      errors.push(`${key}: stale exemption, row prints no die in a text cell`);
  }
  return errors;
}
