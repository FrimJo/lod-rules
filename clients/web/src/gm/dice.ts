/** Dice notation as the rulebook prints it: `1d6`, `1d4+1`, `2d6-1`, `1d100`. */
export interface DiceExpr {
  count: number;
  sides: number;
  modifier: number;
}

/** Source of randomness in [0, 1); injected so tests are deterministic. */
export type Rng = () => number;

export function parseDice(text: string): DiceExpr | null {
  const match = /^\s*(\d*)d(\d+)\s*([+-]\s*\d+)?\s*$/i.exec(text);
  if (!match) return null;
  const count = match[1] ? Number(match[1]) : 1;
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3].replace(/\s+/g, '')) : 0;
  if (!Number.isInteger(count) || count < 1 || !Number.isInteger(sides) || sides < 2) return null;
  return { count, sides, modifier };
}

export function rollDie(sides: number, rng: Rng = Math.random): number {
  return 1 + Math.floor(rng() * sides);
}

export function rollDice(expr: DiceExpr, rng: Rng = Math.random): number {
  let total = expr.modifier;
  for (let i = 0; i < expr.count; i += 1) total += rollDie(expr.sides, rng);
  return total;
}

export function diceRange(expr: DiceExpr): { min: number; max: number } {
  return { min: expr.count + expr.modifier, max: expr.count * expr.sides + expr.modifier };
}

export function formatDice(expr: DiceExpr): string {
  const sign = expr.modifier > 0 ? `+${expr.modifier}` : expr.modifier < 0 ? `${expr.modifier}` : '';
  return `${expr.count}d${expr.sides}${sign}`;
}
