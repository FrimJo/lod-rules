import { useState } from 'react';
import { ambushRisk } from '../engine.ts';
import { CITES, QUESTS, REST, questById } from '../rules.ts';
import { CiteChip, Panel, Stepper, useGm } from './common.tsx';
import { NextTile } from './NextTile.tsx';
import { TurnSequence } from './TurnSequence.tsx';

export function TurnPanel() {
  const { state, dispatch } = useGm();
  const quest = questById(state.questId);
  const [demons, setDemons] = useState(false);
  const risk = ambushRisk(state.threat.level, state.restsTaken + 1);

  return (
    <Panel
      title={state.turn === 0 ? 'Before the first turn' : `Turn ${state.turn}`}
      cite={CITES.turnSequence}
      aside={
        <button type="button" className="gm-primary" onClick={() => dispatch({ type: 'new_turn' })} title="Shortcut: N">
          New turn
        </button>
      }
    >
      <div className="gm-field">
        <label htmlFor="gm-quest">Quest</label>
        <select id="gm-quest" value={state.questId ?? ''} onChange={(e) => dispatch({ type: 'set_quest', questId: e.target.value || null })}>
          <option value="">No quest chosen (Threat floor 2, no maximum)</option>
          {[...new Set(QUESTS.map((q) => q.chapter))].map((chapter) => (
            <optgroup key={chapter} label={chapter}>
              {QUESTS.filter((q) => q.chapter === chapter).map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {quest && (
        <p className="gm-hint">
          {quest.title}: Threat{' '}
          {quest.start === null
            ? 'not used'
            : `${quest.start} to start, min ${quest.min === 'start' ? 'start value' : quest.min}, max ${quest.max}`}
          {quest.thresholds.length ? `; Wandering Monster at ${quest.thresholds.join(' and ')}` : ''}.{' '}
          {quest.notes.join(' ')} <CiteChip cite={quest.cite} />
        </p>
      )}

      <TurnSequence />

      <h3 className="gm-subhead">Exploring</h3>
      <div className="gm-actions wrap">
        {!state.entrancePassed && (
          <button type="button" onClick={() => dispatch({ type: 'door_open', entrance: true })} title="The stone-side door of the starting tile: unlocked, no Threat">
            Entrance door opened
          </button>
        )}
        <button type="button" onClick={() => dispatch({ type: 'door_open' })} title="+1 Threat, then the door checklist">
          Door or chest opened
        </button>
      </div>
      <NextTile />

      <h3 className="gm-subhead">Battle</h3>
      <div className="gm-actions wrap">
        {state.inBattle ? (
          <>
            <button type="button" onClick={() => dispatch({ type: 'battle_end', won: true })}>
              Battle won
            </button>
            <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'battle_end', won: false })}>
              Battle over (not won)
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => dispatch({ type: 'battle_start', demons })}>
              Battle begins
            </button>
            <label className="gm-check">
              <input type="checkbox" checked={demons} onChange={(e) => setDemons(e.target.checked)} />
              against demons (−2 morale, −1 Sanity each)
            </label>
          </>
        )}
      </div>

      <h3 className="gm-subhead">
        Short rest <CiteChip cite={CITES.rest} />
      </h3>
      <div className="gm-rest">
        <Stepper label="Rations" value={state.rations} onChange={(rations) => dispatch({ type: 'set_rations', rations })} compact />
        <div className="gm-rest-text">
          <span>
            {state.restsTaken} rest{state.restsTaken === 1 ? '' : 's'} taken. Next ambush risk{' '}
            <strong>{state.threat.enabled ? `${risk}%` : 'n/a'}</strong>
            {state.threat.enabled
              ? ` (${REST.ambushBase} + Threat ${state.threat.level}${state.restsTaken > 0 ? ` + ${state.restsTaken * REST.ambushPerLaterRest}` : ''}, max ${REST.ambushCap})`
              : ''}
            .
          </span>
          <button
            type="button"
            disabled={state.resting || state.inBattle || state.rations < REST.rationCost}
            title={state.rations < REST.rationCost ? 'A rest costs one ration' : 'Costs one ration'}
            onClick={() => dispatch({ type: 'rest_begin' })}
          >
            {state.resting ? 'Resting…' : 'Take a short rest'}
          </button>
        </div>
      </div>
    </Panel>
  );
}
