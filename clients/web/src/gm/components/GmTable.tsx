import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RulebookViewer } from '../../components/RulebookViewer.tsx';
import type { RulebookTarget } from '../../lib/citations.ts';
import { getRulebook } from '../../server/functions.ts';
import type { Cite } from '../rules.ts';
import { useGmStore } from '../store.ts';
import { GmContext, type GmUi } from './common.tsx';
import { HeroesPanel } from './HeroesPanel.tsx';
import { LightPanel } from './LightPanel.tsx';
import { LogPanel } from './LogPanel.tsx';
import { MoralePanel } from './MoralePanel.tsx';
import { NowPanel } from './NowPanel.tsx';
import { ThreatPanel } from './ThreatPanel.tsx';
import { TurnPanel } from './TurnPanel.tsx';

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)));
}

/**
 * The Game Master's table: one screen with the dungeon's moving parts (Threat, light, Party
 * Morale, each hero's Sanity, rations, Wandering Monsters) and a "Resolve now" list of the
 * follow-ups the rulebook asks for. Every number is a button away from the page it comes from.
 */
export function GmTable() {
  const { state, dispatch, undo, canUndo } = useGmStore();
  const [target, setTarget] = useState<RulebookTarget | null>(null);
  const rulebook = useQuery({ queryKey: ['rulebook'], queryFn: () => getRulebook(), staleTime: Infinity });
  const opener = useRef<HTMLElement | null>(null);

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
        return;
      }
      if (event.metaKey || event.ctrlKey) return;
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        dispatch({ type: 'new_turn' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch, undo]);

  const ui = useMemo<GmUi>(() => ({ state, dispatch, openPage }), [state, dispatch, openPage]);

  const reset = () => {
    if (window.confirm('Clear the whole table (heroes, Threat, log)? This cannot be undone.'))
      dispatch({ type: 'reset' });
  };

  return (
    <GmContext.Provider value={ui}>
      <div className={`app gm${target ? ' with-viewer' : ''}`}>
        <a className="skip-link" href="#gm-main">
          Skip to the table
        </a>
        <header className="topbar">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              L
            </span>
            <span>Game master’s table</span>
          </Link>
          <div className="topbar-actions">
            <span className="gm-turn-chip" aria-live="polite">
              {state.turn === 0 ? 'Not started' : `Turn ${state.turn}`}
              {state.inBattle ? ' · in battle' : ''}
            </span>
            <button type="button" className="icon-button" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">
              Undo
            </button>
            <button
              type="button"
              className="icon-button"
              aria-pressed={Boolean(target)}
              onClick={() => (target ? closeViewer() : openPage({ page: 18, pdf: 20, heading: 'Turn Sequence' }))}
            >
              Rulebook
            </button>
            <Link to="/" className="icon-button">
              Rules search
            </Link>
            <button type="button" className="icon-button danger" onClick={reset} title="Clear the table">
              Reset
            </button>
          </div>
        </header>

        <main className="gm-main" id="gm-main" tabIndex={-1}>
          <NowPanel />
          <div className="gm-grid">
            <div className="gm-col">
              <TurnPanel />
            </div>
            <div className="gm-col">
              <ThreatPanel />
              <LightPanel />
            </div>
            <div className="gm-col">
              <HeroesPanel />
              <MoralePanel />
            </div>
          </div>
          <LogPanel />
        </main>

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
    </GmContext.Provider>
  );
}
