import { useState } from 'react';
import { rollDie } from '../dice.ts';
import { encounterChance } from '../engine.ts';
import { CITES, ENCOUNTER, SEARCH } from '../rules.ts';
import { CiteChip, DieInput, useGm } from './common.tsx';

type TileKind = 'room' | 'corridor';

/**
 * The enemy roll for a newly placed tile as one action: pick room or corridor, press Roll, and
 * the table rolls 1d100 against the printed chance and shows what came up. The Game Master can
 * still type a physical roll or declare a result the quest dictates.
 */
export function NextTile() {
  const { state, dispatch } = useGm();
  const [kind, setKind] = useState<TileKind>('room');
  const [manual, setManual] = useState(false);
  const chance = encounterChance(kind, state.encounterStreak);
  const bonus = state.encounterStreak >= ENCOUNTER.streakTiles;
  const last = state.lastTile;

  return (
    <div className="gm-tile">
      <div className="gm-tile-head">
        <span className="gm-tile-label">Next tile</span>
        <span className="gm-hint inline">
          {state.encounterStreak} encounter-free tile{state.encounterStreak === 1 ? '' : 's'} in a row
          {bonus ? `: +${ENCOUNTER.streakBonus} to the chance` : ''}
        </span>
        <CiteChip cite={CITES.encounters} />
      </div>

      <div className="gm-tile-row">
        <div className="gm-segment" role="radiogroup" aria-label="Tile type">
          {(['room', 'corridor'] as const).map((option) => (
            <label key={option} className={`gm-segment-option${kind === option ? ' on' : ''}`}>
              <input type="radio" name="gm-tile-kind" value={option} checked={kind === option} onChange={() => setKind(option)} />
              {option === 'room' ? 'Room' : 'Corridor'}
              <span className="gm-segment-chance">{encounterChance(option, state.encounterStreak)}%</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="gm-primary"
          onClick={() => dispatch({ type: 'tile_revealed', kind, roll: rollDie(100) })}
          title={`Rolls 1d100: ${chance} or less means enemies`}
        >
          Roll for enemies
        </button>
        <button type="button" className="gm-link" aria-expanded={manual} onClick={() => setManual((v) => !v)}>
          {manual ? 'Hide my own roll' : 'Enter my own roll'}
        </button>
      </div>

      {manual && (
        <div className="gm-inline gm-tile-manual">
          <DieInput
            sides={100}
            label={`Enemy roll from the table (1d100, enemies on ${chance} or less)`}
            onCommit={(roll) => dispatch({ type: 'tile_revealed', kind, roll })}
          />
          <div className="gm-actions">
            <span className="gm-hint inline">The quest decides, no roll:</span>
            <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'tile_revealed', kind, encounter: true })}>
              {kind === 'room' ? 'Room' : 'Corridor'} has enemies
            </button>
            <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'tile_revealed', kind, encounter: false })}>
              {kind === 'room' ? 'Room' : 'Corridor'} is empty
            </button>
          </div>
        </div>
      )}

      {last && (
        <p className={`gm-tile-outcome ${last.encounter ? 'bad' : 'good'}`} role="status">
          <strong>{last.encounter ? 'Enemies!' : 'Empty.'}</strong>{' '}
          {last.kind === 'room' ? 'Room' : 'Corridor'}
          {last.roll !== null ? `: rolled ${last.roll} against ${last.chance}%` : ` (chance was ${last.chance}%)`}
          {last.turn !== state.turn && last.turn > 0 ? `, turn ${last.turn}` : ''}.{' '}
          {last.encounter
            ? 'The turn ends; place the enemies and start the battle from Resolve now.'
            : `${state.encounterStreak} encounter-free tile${state.encounterStreak === 1 ? '' : 's'} in a row.`}
        </p>
      )}

      <span className="gm-hint">
        Searching a room takes the whole turn: one search per room, +{SEARCH.oneHelper} with a second searcher, +
        {SEARCH.moreHelpers} each after that <CiteChip cite={CITES.searching} />
      </span>
    </div>
  );
}
