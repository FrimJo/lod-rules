import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { rollDie } from '../../gm/dice.ts';
import type { CharacterEvent, CharacterState, Derived } from '../engine.ts';
import type { Cite } from '../rules.ts';

export interface CreatorUi {
  state: CharacterState;
  derived: Derived;
  dispatch: (event: CharacterEvent) => void;
  /** Opens the rulebook pane at a PDF page. */
  openPage: (cite: Cite) => void;
}

export const CreatorContext = createContext<CreatorUi | null>(null);

export function useCreator(): CreatorUi {
  const value = useContext(CreatorContext);
  if (!value) throw new Error('CreatorContext is missing');
  return value;
}

export function pageLabel(cite: Cite): string {
  return cite.page === null ? `PDF ${cite.pdf}` : `p. ${cite.page}`;
}

/** A page chip that opens the rulebook at the cited page. */
export function CiteChip({ cite, className = '' }: { cite: Cite; className?: string }) {
  const { openPage } = useCreator();
  return (
    <button
      type="button"
      className={`cc-cite ${className}`.trim()}
      title={`${cite.heading}: open the rulebook at ${pageLabel(cite)}`}
      aria-label={`${cite.heading}, ${pageLabel(cite)}. Open in the rulebook.`}
      onClick={(event) => {
        event.stopPropagation();
        openPage(cite);
      }}
    >
      {pageLabel(cite)}
    </button>
  );
}

/** The book's own words next to the control they govern. */
export function Quote({ text, cite }: { text: string; cite?: Cite }) {
  return (
    <blockquote className="cc-quote">
      <p>{text}</p>
      {cite && <CiteChip cite={cite} />}
    </blockquote>
  );
}

export function Section({
  title,
  cite,
  children,
  aside,
  tone,
  className = '',
}: {
  title: string;
  cite?: Cite;
  children: ReactNode;
  aside?: ReactNode;
  tone?: 'warn' | 'done';
  className?: string;
}) {
  const id = useId();
  return (
    <section className={`cc-section${tone ? ` ${tone}` : ''} ${className}`.trim()} aria-labelledby={id}>
      <header className="cc-section-head">
        <h2 id={id}>
          {title}
          {cite && <CiteChip cite={cite} />}
        </h2>
        {aside && <div className="cc-section-aside">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'gap' }) {
  return (
    <p className={`cc-note ${tone}`} role={tone === 'warn' ? 'alert' : undefined}>
      {children}
    </p>
  );
}

/**
 * A single die the player either types from the table or lets the app roll. The printed 0 face
 * of a d10 is entered and shown as 0 but means 10.
 */
export function DieField({
  sides,
  label,
  value,
  onCommit,
  disabled = false,
  compact = false,
}: {
  sides: number;
  label: string;
  value: number | null;
  onCommit: (value: number) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState('');
  const isD10 = sides === 10;
  const parsed = (() => {
    if (text.trim() === '') return null;
    const n = Number(text);
    if (!Number.isInteger(n)) return null;
    if (isD10 && n === 0) return 10;
    return n >= 1 && n <= sides ? n : null;
  })();
  const commit = (n: number) => {
    setText('');
    onCommit(n);
  };
  return (
    <form
      className={`cc-die${compact ? ' compact' : ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (parsed !== null) commit(parsed);
      }}
    >
      <label htmlFor={id}>{label}</label>
      <div className="cc-die-row">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          placeholder={isD10 ? '1–9, 0' : `1–${sides}`}
          min={isD10 ? 0 : 1}
          max={sides}
          value={text}
          disabled={disabled}
          aria-describedby={`${id}-current`}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" disabled={disabled || parsed === null}>
          Set
        </button>
        <button type="button" className="cc-secondary" disabled={disabled} onClick={() => commit(rollDie(sides))}>
          Roll d{sides}
        </button>
      </div>
      <span id={`${id}-current`} className="cc-visually-hidden">
        {value === null ? 'Not rolled yet' : `Current die ${value}`}
      </span>
    </form>
  );
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function modifierLabel(n: number | null): string {
  if (n === null) return 'N/A';
  if (n === 0) return '±0';
  return signed(n);
}
