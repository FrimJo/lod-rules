import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RulebookViewer } from '../../components/RulebookViewer.tsx';
import type { RulebookTarget } from '../../lib/citations.ts';
import { getRulebook } from '../../server/functions.ts';
import { lightSummary, modeOf } from '../engine.ts';
import type { Cite } from '../rules.ts';
import { useGmStore } from '../store.ts';
import { GmContext, type DrawerId, type GmUi } from './common.tsx';
import { Drawers, LogLine } from './Drawers.tsx';
import { Palette } from './Palette.tsx';
import { PartyStrip, Rim } from './Rim.tsx';
import { Stage } from './Stage.tsx';

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(
    el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)),
  );
}

/**
 * The Game Master's table, built like a cockpit rather than a page: a rim of gauges that is
 * always in view (turn, Threat, light, morale, the party), a stage that shows the one thing
 * to resolve next, and a palette of "what happened" moments beneath it. Everything else lives
 * in drawers, and every number is one tap from the page it comes from.
 */
export function GmTable() {
  const { state, dispatch, undo, canUndo } = useGmStore();
  const [target, setTarget] = useState<RulebookTarget | null>(null);
  const [drawer, setDrawer] = useState<DrawerId | null>(null);
  const rulebook = useQuery({
    queryKey: ['rulebook'],
    queryFn: () => getRulebook(),
    staleTime: Infinity,
  });
  const opener = useRef<HTMLElement | null>(null);
  const drawerOpener = useRef<HTMLElement | null>(null);
  const mode = modeOf(state);
  const dark = mode !== 'prepare' && lightSummary(state).lit.length === 0;

  const openPage = useCallback((cite: Cite) => {
    opener.current = document.activeElement as HTMLElement | null;
    setTarget({ pdf: cite.pdf });
  }, []);
  const closeViewer = useCallback(() => {
    setTarget(null);
    opener.current?.focus({ preventScroll: true });
    opener.current = null;
  }, []);
  /** Remembers the control that opened a drawer so closing it puts focus back there. */
  const openDrawer = useCallback((next: DrawerId | null) => {
    setDrawer((current) => {
      if (next && !current) drawerOpener.current = document.activeElement as HTMLElement | null;
      if (!next && current) {
        const back = drawerOpener.current;
        drawerOpener.current = null;
        setTimeout(() => back?.focus({ preventScroll: true }), 0);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        if (isTyping(event.target)) return;
        event.preventDefault();
        undo();
        return;
      }
      if (event.metaKey || event.ctrlKey || isTyping(event.target)) return;
      switch (event.key.toLowerCase()) {
        case 'n':
          if (state.turn === 0 && state.heroes.length === 0) return;
          event.preventDefault();
          dispatch({ type: 'new_turn' });
          break;
        case 'l':
          event.preventDefault();
          openDrawer(drawer?.kind === 'log' ? null : { kind: 'log' });
          break;
        case 'r':
          event.preventDefault();
          if (target) closeViewer();
          else openPage({ page: 18, pdf: 20, heading: 'Turn Sequence' });
          break;
        case 'escape':
          if (drawer) openDrawer(null);
          else if (target) closeViewer();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    dispatch,
    undo,
    state.turn,
    state.heroes.length,
    target,
    drawer,
    closeViewer,
    openPage,
    openDrawer,
  ]);

  const ui = useMemo<GmUi>(
    () => ({ state, dispatch, openPage, drawer, openDrawer }),
    [state, dispatch, openPage, drawer, openDrawer],
  );

  const reset = () => {
    if (window.confirm('Clear the whole table (heroes, Threat, log)? This cannot be undone.')) {
      setDrawer(null);
      dispatch({ type: 'reset' });
    }
  };
  const recent = state.log.slice(-3).reverse();
  const latest = state.log.at(-1);

  return (
    <GmContext.Provider value={ui}>
      <div
        className={`gm mode-${mode}${target ? ' with-viewer' : ''}${dark ? ' is-dark' : ''}${state.pending.length > 0 ? ' has-prompt' : ''}`}
      >
        <a className="skip-link" href="#gm-stage">
          Skip to the stage
        </a>
        <header className="gm-top">
          <div className="gm-top-left">
            <Link to="/" className="gm-brand" title="Rules search">
              <span className="gm-brand-mark" aria-hidden="true">
                L
              </span>
            </Link>
            <span className="gm-top-title">Game master’s table</span>
          </div>
          <div className="gm-top-actions">
            <button
              type="button"
              className="gm-top-btn"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
            >
              Undo
            </button>
            <button
              type="button"
              className="gm-top-btn"
              aria-pressed={drawer?.kind === 'log'}
              onClick={() => openDrawer(drawer?.kind === 'log' ? null : { kind: 'log' })}
              title="Log (L)"
            >
              Log
            </button>
            <button
              type="button"
              className="gm-top-btn"
              aria-pressed={Boolean(target)}
              onClick={() =>
                target ? closeViewer() : openPage({ page: 18, pdf: 20, heading: 'Turn Sequence' })
              }
              title="Rulebook (R)"
            >
              Rulebook
            </button>
            <button
              type="button"
              className="gm-top-btn"
              aria-pressed={drawer?.kind === 'quest'}
              onClick={() => openDrawer(drawer?.kind === 'quest' ? null : { kind: 'quest' })}
            >
              Quest
            </button>
            <Link
              to="/character"
              className="gm-top-btn"
              title="Walk through character creation with the book’s rules"
            >
              Characters
            </Link>
            <button
              type="button"
              className="gm-top-btn danger"
              onClick={reset}
              title="Clear the table"
            >
              Reset
            </button>
          </div>
        </header>

        <div className="gm-main">
          <Rim />
          <PartyStrip />
          <main className="gm-stage" id="gm-stage" tabIndex={-1}>
            <Stage />
            {mode !== 'prepare' && recent.length > 0 && (
              <div className="gm-ticker" aria-label="Latest log entries">
                <ol>
                  {recent.map((entry) => (
                    <li key={entry.id} className={`gm-log-entry ${entry.kind}`}>
                      <LogLine entry={entry} />
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  className="gm-link"
                  onClick={() => openDrawer({ kind: 'log' })}
                >
                  Full log
                </button>
              </div>
            )}
          </main>
          {mode !== 'prepare' && <Palette />}
          <Drawers />
        </div>
        <p className="sr-only" aria-live="polite">
          {latest ? latest.text : ''}
        </p>

        {target && (
          <aside
            className="viewer-pane gm-viewer"
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
              <button
                type="button"
                className="gm-top-btn"
                onClick={closeViewer}
                aria-label="Close the rulebook"
                title="Close (Esc)"
              >
                <span aria-hidden="true">×</span> Close
              </button>
            </div>
            <RulebookViewer target={target} index={rulebook.data} onShowRecord={() => {}} />
          </aside>
        )}
      </div>
    </GmContext.Provider>
  );
}
