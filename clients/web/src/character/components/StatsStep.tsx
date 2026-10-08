import { useId } from 'react';
import { canReroll, keptDie, statDie, type DieRoll } from '../engine.ts';
import { CITES, CREATION, QUOTES, STAT_KEYS, STAT_NAMES, type StatKey } from '../rules.ts';
import { CiteChip, DieField, Note, Quote, Section, useCreator } from './common.tsx';

export function StatsStep() {
  const { state, derived, dispatch } = useCreator();
  const species = derived.species;
  const modeId = useId();
  if (!species) {
    return (
      <Section title="Roll your stats" cite={CITES.rollStats}>
        <Note tone="warn">Choose a species first: the stat rolls are 1d10 on top of the species base values.</Note>
      </Section>
    );
  }
  const used = CREATION.rerolls - derived.rerollsLeft;
  return (
    <>
      <Section
        title="Roll your stats"
        cite={CITES.rollStats}
        aside={
          <span className={`cc-badge${derived.rerollsLeft === 0 ? ' spent' : ''}`} aria-live="polite">
            Rerolls used {used} of {CREATION.rerolls}
          </span>
        }
      >
        <Quote text={QUOTES.rollStats} cite={CITES.rollStats} />
        <Quote text={QUOTES.reroll} cite={CITES.reroll} />
        <fieldset className="cc-radios" aria-describedby={`${modeId}-hint`}>
          <legend>How to roll</legend>
          <label className="cc-check">
            <input type="radio" name={modeId} checked={state.rollMode === 'in_order'} onChange={() => dispatch({ type: 'set_roll_mode', mode: 'in_order' })} />
            One stat at a time, in the book’s order
          </label>
          <label className="cc-check">
            <input type="radio" name={modeId} checked={state.rollMode === 'assign'} onChange={() => dispatch({ type: 'set_roll_mode', mode: 'assign' })} />
            Option: roll all five dice, then assign them to stats
          </label>
          <span id={`${modeId}-hint`} className="cc-hint">
            {QUOTES.rollAll} <CiteChip cite={CITES.rollAll} />
          </span>
        </fieldset>

        {state.rollMode === 'in_order' ? <InOrderTable /> : <AssignTable />}
      </Section>

      <Section title="Hit Points" cite={CITES.hitPoints}>
        <Quote text="Now it is time to determine how many Hit Points your character has. This is also modified later on depending on the choice of profession." cite={CITES.hitPoints} />
        <div className="cc-roll-row">
          <div className="cc-roll-label">
            <strong>{species.name}</strong> {species.hitPointsPrinted}
          </div>
          <DieDisplay roll={state.hitPointsRoll} sides={6} />
          <div className="cc-roll-controls">
            <DieField
              sides={6}
              label={state.hitPointsRoll.value === null ? 'Roll 1d6' : 'Replace the die'}
              value={keptDie(state.hitPointsRoll)}
              onCommit={(value) => dispatch({ type: 'roll_hit_points', value })}
              compact
            />
            {state.hitPointsRoll.value !== null && (
              <DieField
                sides={6}
                label="Reroll 1d6"
                value={null}
                disabled={!canReroll(state, state.hitPointsRoll)}
                onCommit={(value) => dispatch({ type: 'reroll_hit_points', value })}
                compact
              />
            )}
          </div>
          <div className="cc-roll-result">
            {derived.hitPointsParts.die !== null ? (
              <>
                <span className="cc-big">{species.hitPointsBase + derived.hitPointsParts.die}</span>
                <span className="cc-hint">
                  before the profession modifier
                  {derived.profession ? ` (${derived.profession.name} ${derived.profession.hitPointsPrinted} → ${derived.hitPoints})` : ''}
                </span>
              </>
            ) : (
              <span className="muted">—</span>
            )}
          </div>
        </div>
      </Section>

      <div className="cc-actions">
        <button type="button" className="cc-link" onClick={() => dispatch({ type: 'clear_rolls' })}>
          Clear all dice
        </button>
      </div>
    </>
  );
}

function DieDisplay({ roll, sides }: { roll: DieRoll; sides: number }) {
  const kept = keptDie(roll);
  return (
    <div className="cc-dice" aria-label={kept === null ? 'No die yet' : `Kept die ${kept}`}>
      {roll.value === null ? (
        <span className="cc-die-face empty" aria-hidden="true">
          d{sides}
        </span>
      ) : roll.reroll === null ? (
        <span className="cc-die-face">{roll.value}</span>
      ) : (
        <>
          <span className={`cc-die-face${roll.value >= roll.reroll ? '' : ' dropped'}`} title="First roll">
            {roll.value}
          </span>
          <span className={`cc-die-face${roll.reroll > roll.value ? '' : ' dropped'}`} title="Reroll">
            {roll.reroll}
          </span>
        </>
      )}
    </div>
  );
}

function InOrderTable() {
  const { state, derived, dispatch } = useCreator();
  const species = derived.species!;
  return (
    <table className="cc-table cc-stat-rolls">
      <thead>
        <tr>
          <th scope="col">Stat</th>
          <th scope="col">Roll</th>
          <th scope="col">Dice</th>
          <th scope="col">Enter or roll</th>
          <th scope="col">Result</th>
        </tr>
      </thead>
      <tbody>
        {STAT_KEYS.map((key) => {
          const roll = state.rolls[key];
          return (
            <tr key={key}>
              <th scope="row">
                <abbr title={STAT_NAMES[key].name}>{STAT_NAMES[key].abbr}</abbr>
              </th>
              <td className="muted">{species.base[key]}+1d10</td>
              <td>
                <DieDisplay roll={roll} sides={10} />
              </td>
              <td>
                <div className="cc-roll-controls">
                  <DieField sides={10} label={roll.value === null ? 'Roll 1d10' : 'Replace'} value={keptDie(roll)} onCommit={(value) => dispatch({ type: 'roll_stat', stat: key, value })} compact />
                  {roll.value !== null && (
                    <DieField sides={10} label="Reroll" value={null} disabled={!canReroll(state, roll)} onCommit={(value) => dispatch({ type: 'reroll_stat', stat: key, value })} compact />
                  )}
                </div>
              </td>
              <td className="cc-num">{derived.rolled[key] ?? <span className="muted">—</span>}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function AssignTable() {
  const { state, derived, dispatch } = useCreator();
  const species = derived.species!;
  const assigned = new Map<number, StatKey>();
  for (const key of STAT_KEYS) {
    const index = state.assignment[key];
    if (index !== null) assigned.set(index, key);
  }
  return (
    <div className="cc-assign">
      <h3>Five dice</h3>
      <ol className="cc-pool">
        {state.pool.map((roll, index) => (
          <li key={index}>
            <DieDisplay roll={roll} sides={10} />
            <div className="cc-roll-controls">
              <DieField sides={10} label={roll.value === null ? `Die ${index + 1}` : `Replace die ${index + 1}`} value={keptDie(roll)} onCommit={(value) => dispatch({ type: 'roll_pool', index, value })} compact />
              {roll.value !== null && (
                <DieField sides={10} label="Reroll" value={null} disabled={!canReroll(state, roll)} onCommit={(value) => dispatch({ type: 'reroll_pool', index, value })} compact />
              )}
            </div>
            {assigned.has(index) && <span className="cc-badge">→ {STAT_NAMES[assigned.get(index)!].abbr}</span>}
          </li>
        ))}
      </ol>
      <h3>Assign</h3>
      <table className="cc-table">
        <thead>
          <tr>
            <th scope="col">Stat</th>
            <th scope="col">Base</th>
            <th scope="col">Die</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {STAT_KEYS.map((key) => (
            <tr key={key}>
              <th scope="row">
                <abbr title={STAT_NAMES[key].name}>{STAT_NAMES[key].abbr}</abbr>
              </th>
              <td className="muted">{species.base[key]}</td>
              <td>
                <select
                  aria-label={`Die for ${STAT_NAMES[key].name}`}
                  value={state.assignment[key] ?? ''}
                  onChange={(event) => dispatch({ type: 'assign', stat: key, index: event.target.value === '' ? null : Number(event.target.value) })}
                >
                  <option value="">—</option>
                  {state.pool.map((roll, index) => {
                    const kept = keptDie(roll);
                    if (kept === null) return null;
                    const owner = assigned.get(index);
                    return (
                      <option key={index} value={index}>
                        Die {index + 1}: {kept}
                        {owner && owner !== key ? ` (on ${STAT_NAMES[owner].abbr})` : ''}
                      </option>
                    );
                  })}
                </select>
              </td>
              <td className="cc-num">{statDie(state, key) !== null ? derived.rolled[key] : <span className="muted">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
