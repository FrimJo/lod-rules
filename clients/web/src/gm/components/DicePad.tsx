import { useId, useState } from 'react';
import { parseDice, rollDice, rollDie, type DiceExpr } from '../dice.ts';

type Sides = 6 | 10 | 20 | 100;

/**
 * Dice are read off the table, not typed: the pad shows every face of the die the book asks
 * for, and one tap is the whole entry. A d100 is two taps (tens, then ones), as it is rolled.
 * "Roll for me" is there for the Game Master whose dice are across the table.
 */
export function DicePad({
  sides,
  dice,
  label,
  onCommit,
  hint,
  compact = false,
  autoFocus = false,
  highlight,
}: {
  sides?: Sides;
  /** Dice notation such as `1d4+1`: the pad then shows every possible total. */
  dice?: string;
  label: string;
  onCommit: (value: number) => void;
  hint?: string;
  compact?: boolean;
  autoFocus?: boolean;
  /** Faces to mark, e.g. the results that trigger something. */
  highlight?: (value: number) => 'bad' | 'good' | undefined;
}) {
  const id = useId();
  const expr: DiceExpr | null = dice
    ? parseDice(dice)
    : sides
      ? { count: 1, sides, modifier: 0 }
      : null;
  const [tens, setTens] = useState<number | null>(null);
  if (!expr) return null;
  const isD100 = !dice && sides === 100;
  const isD10 = !dice && sides === 10;
  const min = expr.count + expr.modifier;
  const max = expr.count * expr.sides + expr.modifier;
  const faces: number[] = [];
  for (let v = min; v <= max; v += 1) faces.push(v);
  const name = dice ?? `d${expr.sides}`;
  const rollForMe = () => onCommit(dice ? rollDice(expr) : rollDie(expr.sides));

  if (isD100) {
    return (
      <div
        className={`pad d100${compact ? ' compact' : ''}`}
        role="group"
        aria-labelledby={`${id}-label`}
      >
        <div className="pad-head">
          <span id={`${id}-label`} className="pad-label">
            {label}
          </span>
          <button type="button" className="pad-roll" onClick={rollForMe}>
            Roll {name} for me
          </button>
        </div>
        <div className="pad-row" aria-label="Tens die">
          {Array.from({ length: 10 }, (_, i) => i).map((t) => (
            <button
              key={t}
              type="button"
              className={`pad-face${tens === t ? ' on' : ''}`}
              aria-pressed={tens === t}
              autoFocus={autoFocus && t === 0}
              onClick={() => setTens(t)}
            >
              {t === 0 ? '00' : t * 10}
            </button>
          ))}
        </div>
        <div className="pad-row" aria-label="Ones die">
          {Array.from({ length: 10 }, (_, i) => i).map((o) => {
            const value = tens === null ? null : tens === 0 && o === 0 ? 100 : tens * 10 + o;
            return (
              <button
                key={o}
                type="button"
                className={`pad-face${value !== null && highlight ? ` ${highlight(value) ?? ''}` : ''}`.trim()}
                disabled={tens === null}
                title={value === null ? 'Pick the tens die first' : `${value}`}
                onClick={() => {
                  if (value === null) return;
                  setTens(null);
                  onCommit(value);
                }}
              >
                {o}
              </button>
            );
          })}
        </div>
        <span className="hint">
          {tens === null
            ? 'Tens die first, then the ones die; 00 and 0 is 100.'
            : `Tens: ${tens === 0 ? '00' : tens * 10}. Now the ones die.`}
          {hint ? ` ${hint}` : ''}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`pad d${expr.sides}${compact ? ' compact' : ''}${faces.length > 12 ? ' many' : ''}`}
      role="group"
      aria-labelledby={`${id}-label`}
    >
      <div className="pad-head">
        <span id={`${id}-label`} className="pad-label">
          {label}
        </span>
        <button type="button" className="pad-roll" onClick={rollForMe}>
          Roll {name} for me
        </button>
      </div>
      <div className="pad-row">
        {faces.map((value, i) => {
          const tone = highlight?.(value);
          return (
            <button
              key={value}
              type="button"
              className={`pad-face${tone ? ` ${tone}` : ''}`}
              autoFocus={autoFocus && i === 0}
              aria-label={isD10 && value === 10 ? '0, read as 10' : String(value)}
              onClick={() => onCommit(value)}
            >
              {isD10 && value === 10 ? '0' : value}
            </button>
          );
        })}
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/** The d10 and d6 rolled together for a door or chest: two taps, then the table reads both. */
export function DoorDice({ onCommit }: { onCommit: (d10: number, d6: number) => void }) {
  const [d10, setD10] = useState<number | null>(null);
  const [d6, setD6] = useState<number | null>(null);
  const id = useId();
  const commit = (ten: number | null, six: number | null) => {
    if (ten !== null && six !== null) {
      setD10(null);
      setD6(null);
      onCommit(ten, six);
    }
  };
  return (
    <div className="pad pair" role="group" aria-labelledby={`${id}-label`}>
      <div className="pad-head">
        <span id={`${id}-label`} className="pad-label">
          Roll 1d10 and 1d6 together
        </span>
        <button type="button" className="pad-roll" onClick={() => onCommit(rollDie(10), rollDie(6))}>
          Roll both for me
        </button>
      </div>
      <div className="pad-pair">
        <div className="pad-pair-die">
          <span className="pad-pair-label">d10 · Door Table</span>
          <div className="pad-row">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
              <button
                key={v}
                type="button"
                className={`pad-face${d10 === v ? ' on' : ''}${v >= 7 ? ' bad' : ''}`}
                aria-pressed={d10 === v}
                aria-label={v === 10 ? '0, read as 10' : String(v)}
                onClick={() => {
                  setD10(v);
                  commit(v, d6);
                }}
              >
                {v === 10 ? '0' : v}
              </button>
            ))}
          </div>
        </div>
        <div className="pad-pair-die">
          <span className="pad-pair-label">d6 · trap on a 6</span>
          <div className="pad-row">
            {Array.from({ length: 6 }, (_, i) => i + 1).map((v) => (
              <button
                key={v}
                type="button"
                className={`pad-face${d6 === v ? ' on' : ''}${v === 6 ? ' bad' : ''}`}
                aria-pressed={d6 === v}
                onClick={() => {
                  setD6(v);
                  commit(d10, v);
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <span className="hint">
        1–6 open; 7, 8, 9, 0 locked, harder each step. A 6 on the d6 means a trap.
      </span>
    </div>
  );
}
