import { useState } from 'react';
import { ambushRisk, encounterChance } from '../engine.ts';
import { CITES, ENCOUNTER, QUESTS, REST, SEARCH, TURN_SEQUENCE, questById } from '../rules.ts';
import { CiteChip, Panel, Stepper, useGm } from './common.tsx';

export function TurnPanel() {
  const { state, dispatch } = useGm();
  const quest = questById(state.questId);
  const [demons, setDemons] = useState(false);
  const roomChance = encounterChance('room', state.encounterStreak);
  const corridorChance = encounterChance('corridor', state.encounterStreak);
  const risk = ambushRisk(state.threat.level, state.restsTaken + 1);
  const scenarioPending = state.pending.some((p) => p.request.kind === 'scenario_roll');

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

      <ol className="gm-sequence">
        {TURN_SEQUENCE.map((step, i) => (
          <li key={step.id} className={i === 0 && scenarioPending ? 'active' : ''}>
            {step.text}
            {step.sub && (
              <ol>
                {step.sub.map((sub) => (
                  <li key={sub}>{sub}</li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>

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
      <div className="gm-tile">
        <span>
          Next tile: room <strong>{roomChance}%</strong>, corridor <strong>{corridorChance}%</strong>
          {state.encounterStreak >= ENCOUNTER.streakTiles ? ' (four or more empty tiles: +10)' : ''}{' '}
          <CiteChip cite={CITES.encounters} />
        </span>
        <div className="gm-actions wrap">
          <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'tile_revealed', kind: 'room', encounter: false })}>
            Room, empty
          </button>
          <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'tile_revealed', kind: 'room', encounter: true })}>
            Room, enemies
          </button>
          <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'tile_revealed', kind: 'corridor', encounter: false })}>
            Corridor, empty
          </button>
          <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'tile_revealed', kind: 'corridor', encounter: true })}>
            Corridor, enemies
          </button>
        </div>
        <span className="gm-hint">
          {state.encounterStreak} encounter-free tile{state.encounterStreak === 1 ? '' : 's'} in a row. Searching a room
          takes the whole turn: one search per room, +{SEARCH.oneHelper} with a second searcher, +{SEARCH.moreHelpers} each after that{' '}
          <CiteChip cite={CITES.searching} />
        </span>
      </div>

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
