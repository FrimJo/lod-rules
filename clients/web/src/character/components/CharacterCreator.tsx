import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RulebookViewer } from '../../components/RulebookViewer.tsx';
import type { RulebookTarget } from '../../lib/citations.ts';
import { getRulebook } from '../../server/functions.ts';
import { derive, deriveParty, STATION_BY_ID, STATIONS, type StationId } from '../engine.ts';
import type { Cite } from '../rules.ts';
import { useCharacterStore } from '../store.ts';
import { CiteChip, CreatorContext, useAnchor, type CreatorUi } from './common.tsx';
import { GhostSheet } from './GhostSheet.tsx';
import { Roster } from './Roster.tsx';
import { BackgroundStation } from './stations/BackgroundStation.tsx';
import { DiceStation } from './stations/DiceStation.tsx';
import { LoadoutStation } from './stations/LoadoutStation.tsx';
import { MarketStation } from './stations/MarketStation.tsx';
import { PowersStation } from './stations/PowersStation.tsx';
import { ProfessionStation } from './stations/ProfessionStation.tsx';
import { SheetStation } from './stations/SheetStation.tsx';
import { SpecialiseStation } from './stations/SpecialiseStation.tsx';
import { SpeciesStation } from './stations/SpeciesStation.tsx';

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(
    el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)),
  );
}

/**
 * The character creator, built like the Game Master's table: a roster of the party down the
 * side, a stage that shows one station of the book's creation sequence at a time with the
 * open questions queued above it, a ghost of the character sheet that fills in as the dice
 * land, and the rulebook one tap away from every number and every abbreviation.
 */
export function CharacterCreator() {
  const { party, state, dispatch, undo, canUndo } = useCharacterStore();
  const derived = useMemo(() => derive(state), [state]);
  const partyDerived = useMemo(() => deriveParty(party), [party]);
  const [target, setTarget] = useState<RulebookTarget | null>(null);
  const [anchor, setAnchor] = useState<string | null>(null);
  const rulebook = useQuery({
    queryKey: ['rulebook'],
    queryFn: () => getRulebook(),
    staleTime: Infinity,
  });
  const opener = useRef<HTMLElement | null>(null);
  const stage = useRef<HTMLElement | null>(null);

  const openPage = useCallback((cite: Cite) => {
    opener.current = document.activeElement as HTMLElement | null;
    setTarget({ pdf: cite.pdf });
  }, []);
  const closeViewer = useCallback(() => {
    setTarget(null);
    opener.current?.focus({ preventScroll: true });
    opener.current = null;
  }, []);
  const goTo = useCallback(
    (station: StationId, nextAnchor?: string) => {
      dispatch({ type: 'set_step', step: station });
      if (nextAnchor) setAnchor(nextAnchor);
      else stage.current?.scrollTo({ top: 0 });
      stage.current?.focus({ preventScroll: true });
    },
    [dispatch],
  );
  const clearAnchor = useCallback(() => setAnchor(null), []);
  useAnchor(anchor, clearAnchor);

  const index = STATIONS.findIndex((s) => s.id === state.step);
  const previous = STATIONS[index - 1];
  const next = STATIONS[index + 1];

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
      switch (event.key) {
        case 'r':
        case 'R':
          event.preventDefault();
          if (target) closeViewer();
          else openPage(STATION_BY_ID.get(state.step)!.cite);
          break;
        case '[':
          if (previous) goTo(previous.id);
          break;
        case ']':
          if (next) goTo(next.id);
          break;
        case 'Escape':
          if (target) closeViewer();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, target, closeViewer, openPage, state.step, previous, next, goTo]);

  const ui = useMemo<CreatorUi>(
    () => ({ party, partyDerived, state, derived, dispatch, openPage, goTo }),
    [party, partyDerived, state, derived, dispatch, openPage, goTo],
  );

  const station = STATION_BY_ID.get(state.step)!;
  const todoHere = derived.todo.filter((t) => t.station === state.step);
  const todoElsewhere = derived.todo.filter((t) => t.station !== state.step);

  return (
    <CreatorContext.Provider value={ui}>
      <div className={`cc${target ? ' with-viewer' : ''}`}>
        <a className="skip-link" href="#cc-stage">
          Skip to the station
        </a>
        <header className="cc-top">
          <div className="cc-top-left">
            <Link to="/" className="cc-brand" title="Rules search">
              <span className="cc-brand-mark" aria-hidden="true">
                L
              </span>
            </Link>
            <span className="cc-top-title">Character creator</span>
          </div>
          <div className="cc-top-actions">
            <button
              type="button"
              className="cc-top-btn"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
            >
              Undo
            </button>
            <button
              type="button"
              className="cc-top-btn"
              aria-pressed={Boolean(target)}
              onClick={() => (target ? closeViewer() : openPage(station.cite))}
              title="Rulebook (R)"
            >
              Rulebook
            </button>
            <Link
              to="/gm"
              className="cc-top-btn"
              title="Track Threat, light, morale and Sanity at the table"
            >
              Game master’s table
            </Link>
            <button
              type="button"
              className="cc-top-btn danger"
              onClick={() => {
                if (
                  window.confirm(
                    'Clear the whole party? Every sheet is lost. This cannot be undone.',
                  )
                )
                  dispatch({ type: 'party_reset' });
              }}
              title="Clear every hero"
            >
              Reset
            </button>
          </div>
        </header>

        <div className="cc-main">
          <div className="cc-columns">
            <Roster />

            <main className="cc-stage" id="cc-stage" tabIndex={-1} ref={stage}>
              <div className="cc-stage-inner">
                <ol className="cc-strip" aria-label="Stations">
                  {STATIONS.map((s, i) => {
                    const current = s.id === state.step;
                    const done = derived.complete[s.id];
                    const open = derived.todo.some((t) => t.station === s.id);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          className={`cc-station${current ? ' current' : ''}${done ? ' done' : ''}${open && !current ? ' open' : ''}`}
                          aria-current={current ? 'step' : undefined}
                          onClick={() => goTo(s.id)}
                          title={s.question}
                        >
                          <span className="cc-station-n" aria-hidden="true">
                            {done && !current ? '✓' : i + 1}
                          </span>
                          <span className="cc-station-t">{s.label}</span>
                          <span className="cc-sr">
                            {done ? ', complete' : open ? ', still open' : ''}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>

                {todoElsewhere.length > 0 && state.step === 'sheet' && (
                  <ol className="cc-queue" aria-label="Still to decide">
                    {todoElsewhere.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          className={`cc-queue-item ${t.severity}`}
                          onClick={() => goTo(t.station, `todo:${t.id}`)}
                        >
                          <span className="cc-queue-dot" aria-hidden="true" />
                          {t.label}
                          <span className="cc-queue-station">
                            {STATION_BY_ID.get(t.station)!.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}

                <article className="cc-card" aria-labelledby="cc-card-title">
                  <header className="cc-card-head">
                    <div>
                      <span className="cc-card-kicker">
                        {index + 1} · {station.label}
                      </span>
                      <h2 className="cc-card-title" id="cc-card-title">
                        {station.question} <CiteChip cite={station.cite} />
                      </h2>
                    </div>
                    {todoHere.length > 0 && (
                      <ul className="cc-card-open" aria-label="Open here">
                        {todoHere.map((t) => (
                          <li key={t.id} className={t.severity}>
                            <button
                              type="button"
                              className="cc-open-chip"
                              onClick={() => setAnchor(`todo:${t.id}`)}
                            >
                              {t.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </header>
                  {state.step === 'species' && <SpeciesStation />}
                  {state.step === 'dice' && <DiceStation />}
                  {state.step === 'specialise' && <SpecialiseStation />}
                  {state.step === 'profession' && <ProfessionStation />}
                  {state.step === 'powers' && <PowersStation />}
                  {state.step === 'background' && <BackgroundStation />}
                  {state.step === 'market' && <MarketStation />}
                  {state.step === 'loadout' && <LoadoutStation />}
                  {state.step === 'sheet' && <SheetStation />}
                </article>

                <div className="cc-pager">
                  {previous ? (
                    <button
                      type="button"
                      className="cc-ghost"
                      onClick={() => goTo(previous.id)}
                      title="Previous station ([)"
                    >
                      ‹ {previous.label}
                    </button>
                  ) : (
                    <span />
                  )}
                  {next && (
                    <button
                      type="button"
                      className={`cc-primary${derived.complete[state.step] ? '' : ' soft'}`}
                      onClick={() => goTo(next.id)}
                      title="Next station (])"
                    >
                      {derived.complete[state.step] ? 'Next' : 'Skip for now'}: {next.label} ›
                    </button>
                  )}
                </div>
              </div>
            </main>

            <GhostSheet />
          </div>
        </div>

        {target && (
          <aside
            className="viewer-pane cc-viewer"
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
                className="cc-top-btn"
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
    </CreatorContext.Provider>
  );
}
