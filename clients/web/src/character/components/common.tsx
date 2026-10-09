import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from 'react';
import type {
  CharacterEvent,
  CharacterState,
  Derived,
  PartyDerived,
  PartyState,
  StationId,
} from '../engine.ts';
import {
  SPECIAL_BY_KEY,
  STAT_EFFECTS,
  STAT_NAMES,
  TERM_BY_ABBR,
  specialParts,
  type Cite,
  type SpecialRule,
  type StatKey,
  type Term,
} from '../rules.ts';

export interface CreatorUi {
  party: PartyState;
  partyDerived: PartyDerived;
  state: CharacterState;
  derived: Derived;
  dispatch: (event: CharacterEvent) => void;
  /** Opens the rulebook pane at a PDF page. */
  openPage: (cite: Cite) => void;
  /** Moves the stage to a station and, when given, scrolls to an anchor inside it. */
  goTo: (station: StationId, anchor?: string) => void;
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

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function modifierLabel(n: number | null): string {
  if (n === null) return 'N/A';
  if (n === 0) return '±0';
  return signed(n);
}

const GAP = 8;
function place(anchor: HTMLElement, popover: HTMLElement): void {
  const a = anchor.getBoundingClientRect();
  const p = popover.getBoundingClientRect();
  const above = a.top - p.height - GAP;
  const top = above >= GAP ? above : Math.min(a.bottom + GAP, innerHeight - p.height - GAP);
  const left = Math.max(
    GAP,
    Math.min(a.left + a.width / 2 - p.width / 2, innerWidth - p.width - GAP),
  );
  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
}

/** Hover or focus shows a peek popover; the returned handlers go on the anchor button. */
function usePeek() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const anchor = anchorRef.current;
      const pop = popRef.current;
      if (!anchor || !pop || pop.matches(':popover-open')) return;
      try {
        pop.showPopover();
        place(anchor, pop);
      } catch {
        // Older browsers without the popover API still get the click.
      }
    }, delay);
  };
  const hide = (delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const pop = popRef.current;
      if (pop?.matches(':popover-open')) pop.hidePopover();
    }, delay);
  };
  const handlers = {
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === 'mouse' && show(250),
    onPointerLeave: () => hide(100),
    onFocus: (e: React.FocusEvent<HTMLButtonElement>) =>
      e.currentTarget.matches(':focus-visible') && show(0),
    onBlur: () => hide(0),
    onKeyDown: (e: React.KeyboardEvent) => e.key === 'Escape' && hide(0),
  };
  return { anchorRef, popRef, hide, handlers };
}

/**
 * A page chip that opens the rulebook at the cited page. Hovering or focusing it peeks at the
 * heading and, when the caller has the printed words, the rule itself.
 */
export function CiteChip({
  cite,
  quote,
  className = '',
  label,
}: {
  cite: Cite;
  quote?: string;
  className?: string;
  label?: string;
}) {
  const { openPage } = useCreator();
  const { anchorRef, popRef, hide, handlers } = usePeek();
  const id = useId();
  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={`cc-cite ${className}`.trim()}
        aria-label={`${cite.heading}, ${pageLabel(cite)}. Open in the rulebook.`}
        aria-describedby={id}
        {...handlers}
        onClick={(event) => {
          event.stopPropagation();
          hide(0);
          openPage(cite);
        }}
      >
        {label ?? pageLabel(cite)}
      </button>
      <span ref={popRef} id={id} popover="manual" role="tooltip" className="cc-peek">
        <span className="cc-peek-head">
          {cite.heading} · {pageLabel(cite)}
        </span>
        {quote && <span className="cc-peek-quote">{quote}</span>}
        <span className="cc-peek-hint">Tap to open the page</span>
      </span>
    </>
  );
}

/**
 * An abbreviation as the sheet prints it (CS, ENC, DB…). A peek shows the printed meaning;
 * a tap opens the page it is defined on. Unknown abbreviations render as plain text.
 */
export function Term({
  abbr,
  children,
  className = '',
}: {
  abbr: string;
  children?: ReactNode;
  className?: string;
}) {
  const term = TERM_BY_ABBR.get(abbr);
  if (!term) return <span className={className}>{children ?? abbr}</span>;
  return (
    <TermChip term={term} className={className}>
      {children}
    </TermChip>
  );
}

function TermChip({
  term,
  children,
  className,
}: {
  term: Term;
  children?: ReactNode;
  className: string;
}) {
  const { openPage } = useCreator();
  const { anchorRef, popRef, hide, handlers } = usePeek();
  const id = useId();
  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={`cc-term ${className}`.trim()}
        aria-label={`${term.abbr}: ${term.name}. ${term.text} Open ${pageLabel(term.cite)} in the rulebook.`}
        aria-describedby={id}
        {...handlers}
        onClick={(event) => {
          event.stopPropagation();
          hide(0);
          openPage(term.cite);
        }}
      >
        {children ?? term.abbr}
      </button>
      <span ref={popRef} id={id} popover="manual" role="tooltip" className="cc-peek">
        <span className="cc-peek-head">
          {term.abbr === term.name ? term.name : `${term.abbr} · ${term.name}`}
        </span>
        <span className="cc-peek-quote">{term.text}</span>
        <span className="cc-peek-hint">
          {term.cite.heading} · {pageLabel(term.cite)} · tap to open
        </span>
      </span>
    </>
  );
}

/** A basic stat's abbreviation (STR, CON…) with the book's one-line description in the peek. */
export function StatName({ stat, full = false }: { stat: StatKey; full?: boolean }) {
  const { openPage } = useCreator();
  const { anchorRef, popRef, hide, handlers } = usePeek();
  const id = useId();
  const effect = STAT_EFFECTS[stat];
  const name = STAT_NAMES[stat];
  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="cc-term stat"
        aria-label={`${name.abbr}: ${name.name}. ${effect.text}`}
        aria-describedby={id}
        {...handlers}
        onClick={(event) => {
          event.stopPropagation();
          hide(0);
          openPage(effect.cite);
        }}
      >
        {full ? name.name : name.abbr}
      </button>
      <span ref={popRef} id={id} popover="manual" role="tooltip" className="cc-peek">
        <span className="cc-peek-head">
          {name.abbr} · {name.name}
        </span>
        <span className="cc-peek-quote">{effect.text}</span>
        <span className="cc-peek-hint">
          {effect.cite.heading} · {pageLabel(effect.cite)} · tap to open
        </span>
      </span>
    </>
  );
}

/** A weapon or armour special rule ("BFO", "Stackable") with its printed explanation in the peek. */
export function SpecialChip({ rule, text }: { rule: SpecialRule; text?: string }) {
  const { openPage } = useCreator();
  const { anchorRef, popRef, hide, handlers } = usePeek();
  const id = useId();
  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="cc-term special"
        aria-label={`${rule.name}: ${rule.text}`}
        aria-describedby={id}
        {...handlers}
        onClick={(event) => {
          event.stopPropagation();
          hide(0);
          openPage(rule.cite);
        }}
      >
        {text ?? rule.key}
      </button>
      <span ref={popRef} id={id} popover="manual" role="tooltip" className="cc-peek">
        <span className="cc-peek-head">{rule.name}</span>
        <span className="cc-peek-quote">{rule.text}</span>
        <span className="cc-peek-hint">
          {rule.cite.heading} · {pageLabel(rule.cite)} · tap to open
        </span>
      </span>
    </>
  );
}

/** A printed Special cell as chips, one per rule it names. */
export function Specials({ printed }: { printed: string }) {
  const parts = specialParts(printed);
  if (parts.length === 0) return null;
  return (
    <span className="cc-specials">
      {parts.map((part, i) =>
        part.rule ? (
          <SpecialChip key={i} rule={part.rule} text={part.text} />
        ) : (
          <span key={i} className="cc-term plain">
            {part.text}
          </span>
        ),
      )}
    </span>
  );
}

export function specialRule(key: string): SpecialRule | undefined {
  return SPECIAL_BY_KEY.get(key);
}

/** The book's own words next to the control they govern. */
export function Quote({ text, cite }: { text: string; cite?: Cite }) {
  return (
    <blockquote className="cc-quote">
      <p>{text}</p>
      {cite && <CiteChip cite={cite} quote={text} />}
    </blockquote>
  );
}

export function Note({
  children,
  tone = 'info',
  id,
}: {
  children: ReactNode;
  tone?: 'info' | 'warn' | 'gap' | 'done';
  id?: string;
}) {
  return (
    <p className={`cc-note ${tone}`} role={tone === 'warn' ? 'alert' : undefined} id={id}>
      {tone === 'gap' && <span className="cc-note-kicker">The book is silent</span>}
      {children}
    </p>
  );
}

/** A block within a station card: a subhead with its page, then the controls. */
export function Block({
  title,
  cite,
  quote,
  aside,
  children,
  id,
  className = '',
}: {
  title: ReactNode;
  cite?: Cite;
  quote?: string;
  aside?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const headingId = useId();
  return (
    <section className={`cc-block ${className}`.trim()} aria-labelledby={headingId} id={id}>
      <header className="cc-block-head">
        <h3 id={headingId}>
          {title}
          {cite && <CiteChip cite={cite} quote={quote} />}
        </h3>
        {aside && <div className="cc-block-aside">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = 'plain',
}: {
  children: ReactNode;
  tone?: 'plain' | 'done' | 'spent' | 'warn' | 'gold';
}) {
  return <span className={`cc-badge ${tone}`}>{children}</span>;
}

/** Scrolls an anchor into view when the stage asks for it. */
export function useAnchor(anchor: string | null, onDone: () => void) {
  useEffect(() => {
    if (!anchor) return;
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.classList.add('cc-flash');
      const timer = setTimeout(() => el.classList.remove('cc-flash'), 1600);
      onDone();
      return () => clearTimeout(timer);
    }
    onDone();
    return undefined;
  }, [anchor, onDone]);
}

/** Row of selectable tiles; `aria-pressed` tells a screen reader which is chosen. */
export function Tile({
  selected,
  onClick,
  children,
  className = '',
  disabled = false,
  title,
  id,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      className={`cc-tile${selected ? ' on' : ''} ${className}`.trim()}
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

/** A bar of pips, filled up to `value`, used for stat pips and tracks. */
export function Pips({
  value,
  max,
  marks,
  label,
}: {
  value: number;
  max: number;
  marks?: number[];
  label?: string;
}) {
  return (
    <span className="cc-pips" aria-label={label ?? `${value} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`cc-pip${i < value ? ' full' : ''}${marks?.includes(i + 1) ? ' mark' : ''}`}
        />
      ))}
    </span>
  );
}
