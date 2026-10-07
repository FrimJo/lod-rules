import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { parseDice, rollDice, rollDie, type DiceExpr } from '../dice.ts';
import type { GmEvent, GmState } from '../engine.ts';
import type { Cite } from '../rules.ts';

export interface GmUi {
  state: GmState;
  dispatch: (event: GmEvent) => void;
  /** Opens the rulebook pane at a PDF page. */
  openPage: (cite: Cite) => void;
}

export const GmContext = createContext<GmUi | null>(null);

export function useGm(): GmUi {
  const value = useContext(GmContext);
  if (!value) throw new Error('GmContext is missing');
  return value;
}

export function pageLabel(cite: Cite): string {
  return cite.page === null ? `PDF ${cite.pdf}` : `p. ${cite.page}`;
}

/** A page chip that opens the rulebook at the cited page. */
export function CiteChip({ cite, className = '' }: { cite: Cite; className?: string }) {
  const { openPage } = useGm();
  return (
    <button
      type="button"
      className={`gm-cite ${className}`.trim()}
      title={`${cite.heading}: open the rulebook at ${pageLabel(cite)}`}
      aria-label={`${cite.heading}, ${pageLabel(cite)}. Open in the rulebook.`}
      onClick={() => openPage(cite)}
    >
      {pageLabel(cite)}
    </button>
  );
}

export function Panel({
  title,
  cite,
  tone,
  children,
  aside,
  className = '',
}: {
  title: string;
  cite?: Cite;
  tone?: 'warn' | 'danger';
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section className={`gm-panel${tone ? ` ${tone}` : ''} ${className}`.trim()} aria-labelledby={id}>
      <header className="gm-panel-head">
        <h2 id={id}>
          {title}
          {cite && <CiteChip cite={cite} />}
        </h2>
        {aside && <div className="gm-panel-aside">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

export function Stepper({
  label,
  value,
  min = 0,
  max,
  onChange,
  compact = false,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  compact?: boolean;
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, n));
  return (
    <div className={`gm-stepper${compact ? ' compact' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="gm-stepper-controls">
        <button
          type="button"
          className="gm-mini"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          {...(max !== undefined ? { max } : {})}
          onChange={(event) => {
            const n = Number(event.target.value);
            if (Number.isFinite(n)) onChange(clamp(Math.round(n)));
          }}
        />
        <button
          type="button"
          className="gm-mini"
          aria-label={`Increase ${label}`}
          disabled={max !== undefined && value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

/**
 * A die result the Game Master either types from the table or lets the app roll. The printed
 * 0 face of a d10 is entered and shown as 0 but means 10.
 */
export function DieInput({
  sides,
  dice,
  label,
  onCommit,
  commitLabel = 'Apply',
  autoFocus = false,
}: {
  sides?: number;
  /** Dice notation such as `1d4+1`; overrides `sides`. */
  dice?: string;
  label: string;
  onCommit: (value: number) => void;
  commitLabel?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState('');
  const expr: DiceExpr | null = dice ? parseDice(dice) : sides ? { count: 1, sides, modifier: 0 } : null;
  if (!expr) return null;
  const min = expr.count + expr.modifier;
  const max = expr.count * expr.sides + expr.modifier;
  const isD10 = !dice && sides === 10;
  const parsed = (() => {
    if (text.trim() === '') return null;
    const n = Number(text);
    if (!Number.isInteger(n)) return null;
    if (isD10 && n === 0) return 10;
    return n >= min && n <= max ? n : null;
  })();
  const name = dice ?? `d${expr.sides}`;
  const commit = (value: number) => {
    setText('');
    onCommit(value);
  };
  return (
    <form
      className="gm-die"
      onSubmit={(event) => {
        event.preventDefault();
        if (parsed !== null) commit(parsed);
      }}
    >
      <label htmlFor={id}>{label}</label>
      <div className="gm-die-row">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          placeholder={isD10 ? '1–9, 0' : `${min}–${max}`}
          min={isD10 ? 0 : min}
          max={max}
          value={text}
          autoFocus={autoFocus}
          onChange={(event) => setText(event.target.value)}
          aria-describedby={`${id}-hint`}
        />
        <button type="submit" disabled={parsed === null}>
          {commitLabel}
        </button>
        <button
          type="button"
          className="gm-secondary"
          onClick={() => commit(dice ? rollDice(expr) : rollDie(expr.sides))}
        >
          Roll {name} for me
        </button>
      </div>
      <span id={`${id}-hint`} className="gm-hint">
        Type the die from the table, or let the app roll.
      </span>
    </form>
  );
}

export function HeroSelect({
  value,
  onChange,
  label = 'Hero',
  allowNone = false,
  id: givenId,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  allowNone?: boolean;
  id?: string;
}) {
  const { state } = useGm();
  const ownId = useId();
  const id = givenId ?? ownId;
  const living = state.heroes.filter((hero) => !hero.dead);
  return (
    <div className="gm-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value || null)}>
        {(allowNone || living.length === 0) && <option value="">{living.length ? 'Nobody' : 'No heroes yet'}</option>}
        {living.map((hero) => (
          <option key={hero.id} value={hero.id}>
            {hero.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}
