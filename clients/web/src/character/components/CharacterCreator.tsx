import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RulebookViewer } from '../../components/RulebookViewer.tsx';
import type { RulebookTarget } from '../../lib/citations.ts';
import { getRulebook } from '../../server/functions.ts';
import { derive, STEPS, type StepId } from '../engine.ts';
import { CITES, type Cite } from '../rules.ts';
import { useCharacterStore } from '../store.ts';
import { BackgroundStep } from './BackgroundStep.tsx';
import { CreatorContext, type CreatorUi } from './common.tsx';
import { EquipmentStep } from './EquipmentStep.tsx';
import { ProfessionStep } from './ProfessionStep.tsx';
import { SheetStep } from './SheetStep.tsx';
import { SpeciesStep } from './SpeciesStep.tsx';
import { SpecialiseStep } from './SpecialiseStep.tsx';
import { StatsStep } from './StatsStep.tsx';
import { SummaryRail } from './SummaryRail.tsx';

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)));
}

const STEP_CITES: Record<StepId, Cite> = {
  species: CITES.speciesFirst,
  stats: CITES.rollStats,
  specialise: CITES.specialisation,
  profession: CITES.professionTalents,
  background: CITES.backgroundOptional,
  equipment: CITES.startingEquipment,
  sheet: CITES.finalTouches,
};

/**
 * The character creator: the book's creation sequence as seven steps, each quoting the rule it
 * applies and opening the page it came from. The player rolls real dice or lets the app roll,
 * sees every derived number, and copies the final sheet onto the printed character sheet.
 */
export function CharacterCreator() {
  const { state, dispatch, undo, canUndo } = useCharacterStore();
  const derived = useMemo(() => derive(state), [state]);
  const [target, setTarget] = useState<RulebookTarget | null>(null);
  const rulebook = useQuery({ queryKey: ['rulebook'], queryFn: () => getRulebook(), staleTime: Infinity });
  const opener = useRef<HTMLElement | null>(null);
  const main = useRef<HTMLElement | null>(null);

  const openPage = useCallback((cite: Cite) => {
    opener.current = document.activeElement as HTMLElement | null;
    setTarget({ pdf: cite.pdf });
  }, []);
  const closeViewer = () => {
    setTarget(null);
    opener.current?.focus({ preventScroll: true });
    opener.current = null;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.altKey) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo]);

  const ui = useMemo<CreatorUi>(() => ({ state, derived, dispatch, openPage }), [state, derived, dispatch, openPage]);

  const index = STEPS.findIndex((s) => s.id === state.step);
  const goTo = (step: StepId) => {
    dispatch({ type: 'set_step', step });
    main.current?.scrollTo({ top: 0 });
    main.current?.focus({ preventScroll: true });
  };
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];

  const reset = () => {
    if (window.confirm('Start a new hero? The current sheet is cleared. This cannot be undone.')) dispatch({ type: 'reset' });
  };

  return (
    <CreatorContext.Provider value={ui}>
      <div className={`app cc${target ? ' with-viewer' : ''}`}>
        <a className="skip-link" href="#cc-main">
          Skip to the step
        </a>
        <header className="topbar">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              L
            </span>
            <span>Character creator</span>
          </Link>
          <div className="topbar-actions">
            <button type="button" className="icon-button" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">
              Undo
            </button>
            <button
              type="button"
              className="icon-button"
              aria-pressed={Boolean(target)}
              onClick={() => (target ? closeViewer() : openPage(STEP_CITES[state.step]))}
            >
              Rulebook
            </button>
            <Link to="/gm" className="icon-button" title="Track Threat, light, morale and Sanity at the table">
              Game master’s table
            </Link>
            <Link to="/" className="icon-button">
              Rules search
            </Link>
            <button type="button" className="icon-button danger" onClick={reset} title="Start a new hero">
              New hero
            </button>
          </div>
        </header>

        <div className="cc-body">
          <nav className="cc-steps" aria-label="Creation steps">
            <ol>
              {STEPS.map((step, i) => {
                const current = step.id === state.step;
                const done = derived.complete[step.id];
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      className={`cc-step${current ? ' current' : ''}${done ? ' done' : ''}`}
                      aria-current={current ? 'step' : undefined}
                      onClick={() => goTo(step.id)}
                    >
                      <span className="cc-step-index" aria-hidden="true">
                        {done && !current ? '✓' : i + 1}
                      </span>
                      <span className="cc-step-label">{step.label}</span>
                      <span className="cc-visually-hidden">{done ? ', complete' : ', incomplete'}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <main className="cc-main" id="cc-main" tabIndex={-1} ref={main}>
            {state.step === 'species' && <SpeciesStep />}
            {state.step === 'stats' && <StatsStep />}
            {state.step === 'specialise' && <SpecialiseStep />}
            {state.step === 'profession' && <ProfessionStep />}
            {state.step === 'background' && <BackgroundStep />}
            {state.step === 'equipment' && <EquipmentStep />}
            {state.step === 'sheet' && <SheetStep />}

            <div className="cc-pager">
              {previous ? (
                <button type="button" className="cc-secondary" onClick={() => goTo(previous.id)}>
                  ← {previous.label}
                </button>
              ) : (
                <span />
              )}
              {next && (
                <button type="button" className="cc-primary" onClick={() => goTo(next.id)}>
                  {derived.complete[state.step] ? 'Next' : 'Skip for now'}: {next.label} →
                </button>
              )}
            </div>
          </main>

          <SummaryRail />
        </div>

        {target && (
          <aside
            className="viewer-pane"
            aria-label="Rulebook"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                closeViewer();
              }
            }}
          >
            <div className="pane-bar">
              <span className="pane-title">Rulebook</span>
              <button type="button" className="icon-button" onClick={closeViewer} aria-label="Close the rulebook" title="Close (Esc)">
                <span aria-hidden="true">×</span> Close
              </button>
            </div>
            <RulebookViewer target={target} index={rulebook.data} onShowRecord={() => {}} />
          </aside>
        )}
      </div>
    </CreatorContext.Provider>
  );
}
