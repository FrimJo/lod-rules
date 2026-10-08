import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { GmEvent, GmState } from '../engine.ts';
import type { Cite } from '../rules.ts';

/** Which side panel is open; each one is a slice of the table the rim only summarises. */
export type DrawerId =
  | { kind: 'threat' }
  | { kind: 'light' }
  | { kind: 'morale' }
  | { kind: 'party' }
  | { kind: 'hero'; heroId: string }
  | { kind: 'quest' }
  | { kind: 'log' };

export interface GmUi {
  state: GmState;
  dispatch: (event: GmEvent) => void;
  /** Opens the rulebook pane at a PDF page. */
  openPage: (cite: Cite) => void;
  drawer: DrawerId | null;
  openDrawer: (drawer: DrawerId | null) => void;
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

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
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

/**
 * A page chip that opens the rulebook at the cited page. Hovering or focusing it peeks at the
 * heading and, when the caller has the printed words, the rule itself, so the book is one
 * glance away and one tap away.
 */
export function CiteChip({
  cite,
  quote,
  className = '',
  label,
}: {
  cite: Cite;
  /** Verbatim rulebook words to show in the peek. */
  quote?: string;
  className?: string;
  /** Replaces the page label, e.g. "Rest checklist". */
  label?: string;
}) {
  const { openPage } = useGm();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = useId();
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

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={`gm-cite ${className}`.trim()}
        aria-label={`${cite.heading}, ${pageLabel(cite)}. Open in the rulebook.`}
        aria-describedby={id}
        onPointerEnter={(e) => e.pointerType === 'mouse' && show(250)}
        onPointerLeave={() => hide(100)}
        onFocus={(e) => e.currentTarget.matches(':focus-visible') && show(0)}
        onBlur={() => hide(0)}
        onKeyDown={(e) => e.key === 'Escape' && hide(0)}
        onClick={() => {
          hide(0);
          openPage(cite);
        }}
      >
        {label ?? pageLabel(cite)}
      </button>
      <span ref={popRef} id={id} popover="manual" role="tooltip" className="gm-peek">
        <span className="gm-peek-head">
          {cite.heading} · {pageLabel(cite)}
        </span>
        {quote && <span className="gm-peek-quote">{quote}</span>}
        <span className="gm-peek-hint">Tap to open the page</span>
      </span>
    </>
  );
}

/** A side panel over the stage. Only one is open at a time; Escape closes it. */
export function Drawer({
  title,
  cite,
  children,
  wide = false,
  onClose,
}: {
  title: string;
  cite?: Cite;
  children: ReactNode;
  wide?: boolean;
  onClose: () => void;
}) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    // A child that asked for focus (the party drawer's name field) keeps it.
    const aside = ref.current;
    if (aside && !aside.contains(document.activeElement)) aside.focus({ preventScroll: true });
  }, []);
  return (
    <aside
      ref={ref}
      className={`gm-drawer${wide ? ' wide' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby={id}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <header className="gm-drawer-head">
        <h2 id={id}>
          {title}
          {cite && <CiteChip cite={cite} />}
        </h2>
        <button type="button" className="gm-x" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <div className="gm-drawer-body">{children}</div>
    </aside>
  );
}

export function Stepper({
  label,
  value,
  min = 0,
  max,
  step = 1,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, n));
  return (
    <div className="gm-stepper">
      <label htmlFor={id}>{label}</label>
      <div className="gm-stepper-controls">
        <button
          type="button"
          className="gm-mini"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          step={step}
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
          onClick={() => onChange(clamp(value + step))}
        >
          +
        </button>
      </div>
      {hint && <span className="gm-hint">{hint}</span>}
    </div>
  );
}

/**
 * A row of hero chips to pick who something happened to. Nothing is chosen until the Game
 * Master says so; "Random" picks a living hero the way the book randomises a victim.
 */
export function HeroPicker({
  value,
  onChange,
  label = 'It happened to',
  random = false,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  random?: boolean;
}) {
  const { state } = useGm();
  const living = state.heroes.filter((hero) => !hero.dead);
  if (living.length === 0) return <p className="gm-hint">No heroes in the party yet.</p>;
  return (
    <div className="gm-pick" role="group" aria-label={label}>
      <span className="gm-pick-label">{label}</span>
      {living.map((hero) => (
        <button
          key={hero.id}
          type="button"
          aria-pressed={value === hero.id}
          className={`gm-pick-chip${value === hero.id ? ' on' : ''}`}
          onClick={() => onChange(value === hero.id ? null : hero.id)}
        >
          {hero.name}
        </button>
      ))}
      {random && (
        <button
          type="button"
          className="gm-pick-chip random"
          onClick={() => onChange(living[Math.floor(Math.random() * living.length)]!.id)}
        >
          Random
        </button>
      )}
    </div>
  );
}

/** A chosen hero that stays valid as the party changes; null until the Game Master picks. */
export function useHeroChoice(): [string | null, (id: string | null) => void] {
  const { state } = useGm();
  const [heroId, setHeroId] = useState<string | null>(null);
  const chosen = heroId && state.heroes.some((h) => h.id === heroId && !h.dead) ? heroId : null;
  return [chosen, setHeroId];
}

/** The five printed step names, short enough for the ring and the strip. */
export const STEP_SHORT = [
  'Scenario die',
  'Act',
  'Wandering',
  'Threat',
  'Sanity & Morale',
] as const;
