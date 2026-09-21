import type { Dice } from './pilot-types.ts';

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
