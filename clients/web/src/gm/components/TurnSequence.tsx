import { useCallback, useEffect, useState } from 'react';
import { isWavering, lightSummary } from '../engine.ts';
import { CITES, THREAT, TURN_SEQUENCE } from '../rules.ts';
import { CiteChip, DieInput, useGm } from './common.tsx';

type SequenceView = 'steps' | 'list';
const VIEW_KEY = 'lod-rules:gm-sequence-view';

/** How the Game Master likes the turn sequence shown; a device preference, outside the table's state. */
function useSequenceView(): [SequenceView, (view: SequenceView) => void] {
  const [view, setView] = useState<SequenceView>('steps');
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      if (saved === 'list' || saved === 'steps') setView(saved);
    } catch {
      // No storage: keep the default for this visit.
    }
  }, []);
  const update = useCallback((next: SequenceView) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Ignore: the choice still holds for this visit.
    }
  }, []);
  return [view, update];
}

/**
 * The five printed steps of a dungeon turn. By default the Game Master clicks through them one
 * at a time; each step shows what the table knows about it and takes the roll it calls for.
 * The plain numbered list is one toggle away.
 */
export function TurnSequence() {
  const { state, dispatch } = useGm();
  const [view, setView] = useSequenceView();
  const started = state.turn > 0;
  const current = Math.min(state.turnStep, TURN_SEQUENCE.length - 1);
  const step = TURN_SEQUENCE[current]!;
  const last = current === TURN_SEQUENCE.length - 1;
  const asSteps = view === 'steps';

  return (
    <div className="gm-sequence-block">
      <div className="gm-sequence-head">
        <h3 className="gm-subhead">Turn sequence</h3>
        <button
          type="button"
          className="gm-link"
          aria-pressed={view === 'list'}
          onClick={() => setView(view === 'list' ? 'steps' : 'list')}
        >
          {view === 'list' ? 'Step by step' : 'Show as list'}
        </button>
      </div>

      {asSteps ? (
        <div className="gm-steps">
          <ol className="gm-step-track" aria-label="Turn steps">
            {TURN_SEQUENCE.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`gm-step-dot${!started ? '' : i < current ? ' done' : i === current ? ' current' : ''}`}
                  aria-current={started && i === current ? 'step' : undefined}
                  disabled={!started}
                  aria-label={`Step ${i + 1}: ${item.text}`}
                  title={item.text}
                  onClick={() => dispatch({ type: 'turn_step', step: i })}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ol>
          <div className="gm-step-card" aria-live="polite">
            <span className="gm-step-count">
              {started ? `Step ${current + 1} of ${TURN_SEQUENCE.length}` : 'Turn not started'}
            </span>
            <h4 className="gm-step-title">{step.text}</h4>
            {step.sub && (
              <ol className="gm-step-sub">
                {step.sub.map((sub) => (
                  <li key={sub}>{sub}</li>
                ))}
              </ol>
            )}
            {started ? (
              <StepBody id={step.id} />
            ) : (
              <p className="gm-step-note">
                Start the first turn once the heroes stand on the starting tile; the table then
                walks you through these steps.
              </p>
            )}
          </div>
          <div className="gm-step-nav">
            {started && (
              <button
                type="button"
                className="gm-secondary"
                disabled={current === 0}
                onClick={() => dispatch({ type: 'turn_step', step: current - 1 })}
              >
                Back
              </button>
            )}
            {!started || last ? (
              <button
                type="button"
                className="gm-primary"
                onClick={() => dispatch({ type: 'new_turn' })}
                title="Shortcut: N"
              >
                Start turn {state.turn + 1}
              </button>
            ) : (
              <button
                type="button"
                className="gm-primary"
                onClick={() => dispatch({ type: 'turn_step', step: current + 1 })}
              >
                Next step
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <ol className="gm-sequence">
            {TURN_SEQUENCE.map((item, i) => (
              <li
                key={item.id}
                className={started && i === current ? 'active' : ''}
                aria-current={started && i === current ? 'step' : undefined}
              >
                {item.text}
                {item.sub && (
                  <ol>
                    {item.sub.map((sub) => (
                      <li key={sub}>{sub}</li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
          {!started && (
            <p className="gm-hint">
              Press <kbd>New turn</kbd> once the heroes stand on the starting tile; the table then
              walks you through these steps.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** What the table knows about the current step, and the roll it needs, if any. */
function StepBody({ id }: { id: string }) {
  const { state, dispatch } = useGm();
  const pending = (kind: string) => state.pending.filter((p) => p.request.kind === kind);

  switch (id) {
    case 'scenario': {
      const scenario = pending('scenario_roll')[0];
      const threatRoll = pending('threat_roll')[0];
      const relights = pending('light_relight');
      const lit = lightSummary(state).lit.length;
      return (
        <div className="gm-step-body">
          {!state.scenarioEnabled ? (
            <p className="gm-step-note">This quest does not use the Scenario die.</p>
          ) : !state.entrancePassed ? (
            <p className="gm-step-note">
              Not rolled yet: the Scenario die starts once the party has passed the first door.{' '}
              <CiteChip cite={CITES.scenarioDie} />
            </p>
          ) : scenario ? (
            <DieInput
              sides={10}
              label="Scenario die (1d10)"
              onCommit={(value) => dispatch({ type: 'scenario_roll', value })}
            />
          ) : threatRoll ? (
            <>
              <p className="gm-step-note warn">{threatRoll.detail}</p>
              <DieInput
                sides={20}
                label="Threat roll (1d20)"
                onCommit={(value) => dispatch({ type: 'threat_roll', value })}
              />
            </>
          ) : (
            <p className="gm-step-note done">Nothing left to roll this step.</p>
          )}
          <p className="gm-step-note">
            {lit === 0
              ? 'No light source is lit.'
              : `${lit} light source${lit === 1 ? '' : 's'} lit.`}
            {relights.length > 0 ? ' A light went out: relight or remove it in Resolve now.' : ''}
          </p>
        </div>
      );
    }
    case 'act':
      return (
        <p className="gm-step-note">
          {state.inBattle
            ? 'The party is in battle. Record the end of it under Battle below.'
            : 'Doors, tiles, searches and battles are recorded under Exploring and Battle below.'}
        </p>
      );
    case 'wandering': {
      const move = state.pending.find((p) => p.key === 'wm-move');
      if (state.wanderingMonsters === 0)
        return <p className="gm-step-note done">No Wandering Monster tokens on the board.</p>;
      return (
        <div className="gm-step-body">
          <p className="gm-step-note">
            {state.wanderingMonsters === 1 ? 'One token' : `${state.wanderingMonsters} tokens`} to
            move. {move?.detail ?? ''} <CiteChip cite={CITES.wanderingMonsters} />
          </p>
          {move && (
            <button
              type="button"
              className="gm-secondary"
              onClick={() => dispatch({ type: 'dismiss_prompt', id: move.id })}
            >
              Moved
            </button>
          )}
        </div>
      );
    }
    case 'threat': {
      if (!state.threat.enabled)
        return <p className="gm-step-note">This quest does not use Threat.</p>;
      return (
        <p className="gm-step-note">
          A won battle increases Threat by {THREAT.battleWon}. Pressing Battle won below applies it.{' '}
          <CiteChip cite={CITES.threatIncrease} />
        </p>
      );
    }
    case 'psychology': {
      const conditions = pending('sanity_condition');
      const wavering = isWavering(state);
      const living = state.heroes.filter((h) => !h.dead);
      return (
        <div className="gm-step-body">
          <p
            className={`gm-step-note${wavering || (state.morale.current === 0 && state.morale.start > 0) ? ' warn' : ''}`}
          >
            Party Morale {state.morale.current} of {state.morale.start}
            {state.morale.start > 0 && state.morale.current === 0
              ? ': the party flees.'
              : wavering
                ? ': wavering, −20 RES.'
                : '.'}
          </p>
          {living.length > 0 && (
            <p className="gm-step-note">
              Sanity: {living.map((h) => `${h.name} ${h.sanity}/${h.sanityMax}`).join(' · ')}
            </p>
          )}
          {conditions.length > 0 && (
            <p className="gm-step-note warn">
              {conditions.length === 1
                ? 'A hero is at 0 Sanity'
                : `${conditions.length} heroes are at 0 Sanity`}
              : roll the mental condition in Resolve now.
            </p>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}
