import { useState } from 'react';
import { DicePad } from '../../../gm/components/DicePad.tsx';
import { rollDie } from '../../../gm/dice.ts';
import { canReroll, keptDie, statDie, type DieRoll } from '../../engine.ts';
import { CITES, CREATION, QUOTES, STAT_KEYS, STAT_NAMES, type StatKey } from '../../rules.ts';
import { Block, CiteChip, Note, Quote, StatName, Term, useCreator } from '../common.tsx';

/** A die as it sits on the table: the first roll, and the reroll beside it with the lower one struck through. */
export function DieFaces({
  roll,
  sides,
  size = 'normal',
}: {
  roll: DieRoll;
  sides: number;
  size?: 'normal' | 'big';
}) {
  const kept = keptDie(roll);
  const show = (v: number) => (sides === 10 && v === 10 ? '0' : String(v));
  return (
    <span
      className={`cc-dice ${size}`}
      aria-label={kept === null ? 'No die yet' : `Kept die ${kept}`}
    >
      {roll.value === null ? (
        <span className="cc-face empty" aria-hidden="true">
          d{sides}
        </span>
      ) : roll.reroll === null ? (
        <span className="cc-face">{show(roll.value)}</span>
      ) : (
        <>
          <span
            className={`cc-face${roll.value >= roll.reroll ? '' : ' dropped'}`}
            title="First roll"
          >
            {show(roll.value)}
          </span>
          <span
            className={`cc-face reroll${roll.reroll > roll.value ? '' : ' dropped'}`}
            title="Reroll"
          >
            {show(roll.reroll)}
          </span>
        </>
      )}
    </span>
  );
}

/** The two rerolls the book allows, shown as tokens that are spent. */
function RerollTokens({ left }: { left: number }) {
  return (
    <span className="cc-tokens-row" aria-label={`${left} of ${CREATION.rerolls} rerolls left`}>
      <span className="cc-tokens-label">Rerolls</span>
      {Array.from({ length: CREATION.rerolls }, (_, i) => (
        <span key={i} className={`cc-reroll-token${i < left ? '' : ' spent'}`} aria-hidden="true">
          ↻
        </span>
      ))}
      <span className="cc-hint inline">{left === 0 ? 'both spent' : `${left} left`}</span>
    </span>
  );
}

type Open =
  | { kind: 'stat'; stat: StatKey; reroll: boolean }
  | { kind: 'pool'; index: number; reroll: boolean }
  | { kind: 'hp'; reroll: boolean }
  | null;

export function DiceStation() {
  const { state, derived, dispatch } = useCreator();
  const [open, setOpen] = useState<Open>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const species = derived.species;
  if (!species) {
    return (
      <div className="cc-body">
        <Note tone="warn">Choose a species first: each stat is the species base plus 1d10.</Note>
      </div>
    );
  }
  const inOrder = state.rollMode === 'in_order';
  const rollAll = () => {
    if (inOrder)
      for (const key of STAT_KEYS)
        if (state.rolls[key].value === null)
          dispatch({ type: 'roll_stat', stat: key, value: rollDie(10) });
    if (!inOrder)
      state.pool.forEach(
        (roll, index) =>
          roll.value === null && dispatch({ type: 'roll_pool', index, value: rollDie(10) }),
      );
    if (state.hitPointsRoll.value === null)
      dispatch({ type: 'roll_hit_points', value: rollDie(6) });
    setOpen(null);
  };

  return (
    <div className="cc-body">
      <div className="cc-row-between">
        <div className="cc-segment" role="radiogroup" aria-label="How to roll">
          <label className={`cc-segment-option${inOrder ? ' on' : ''}`}>
            <input
              type="radio"
              name="cc-roll-mode"
              checked={inOrder}
              onChange={() => dispatch({ type: 'set_roll_mode', mode: 'in_order' })}
            />
            One stat at a time
          </label>
          <label className={`cc-segment-option${!inOrder ? ' on' : ''}`}>
            <input
              type="radio"
              name="cc-roll-mode"
              checked={!inOrder}
              onChange={() => dispatch({ type: 'set_roll_mode', mode: 'assign' })}
            />
            Roll five, then assign
          </label>
        </div>
        <RerollTokens left={derived.rerollsLeft} />
      </div>
      {inOrder ? (
        <Quote text={QUOTES.rollStats} cite={CITES.rollStats} />
      ) : (
        <Quote text={QUOTES.rollAll} cite={CITES.rollAll} />
      )}

      {inOrder ? (
        <div className="cc-dicerow" role="group" aria-label="Stat dice" id="todo:dice">
          {STAT_KEYS.map((key) => {
            const roll = state.rolls[key];
            const isOpen = open?.kind === 'stat' && open.stat === key;
            return (
              <div
                key={key}
                className={`cc-diecell${isOpen ? ' open' : ''}${roll.value === null ? ' empty' : ''}`}
                id={`stat:${key}`}
              >
                <span className="cc-diecell-k">
                  <StatName stat={key} />
                  <small>{species.base[key]}+1d10</small>
                </span>
                <button
                  type="button"
                  className="cc-diecell-die"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpen(isOpen ? null : { kind: 'stat', stat: key, reroll: false })
                  }
                  aria-label={
                    roll.value === null
                      ? `Roll 1d10 for ${STAT_NAMES[key].name}`
                      : `${STAT_NAMES[key].name} die ${keptDie(roll)}; tap to replace`
                  }
                >
                  <DieFaces roll={roll} sides={10} size="big" />
                </button>
                <span className="cc-diecell-v">{derived.rolled[key] ?? '—'}</span>
                {roll.value !== null && roll.reroll === null && (
                  <button
                    type="button"
                    className="cc-link small"
                    disabled={!canReroll(state, roll)}
                    onClick={() => setOpen({ kind: 'stat', stat: key, reroll: true })}
                  >
                    Reroll
                  </button>
                )}
              </div>
            );
          })}
          <div
            className={`cc-diecell hp${open?.kind === 'hp' ? ' open' : ''}${state.hitPointsRoll.value === null ? ' empty' : ''}`}
            id="hp"
          >
            <span className="cc-diecell-k">
              <Term abbr="HP" />
              <small>{species.hitPointsPrinted}</small>
            </span>
            <button
              type="button"
              className="cc-diecell-die"
              aria-expanded={open?.kind === 'hp'}
              onClick={() => setOpen(open?.kind === 'hp' ? null : { kind: 'hp', reroll: false })}
              aria-label={
                state.hitPointsRoll.value === null
                  ? 'Roll 1d6 for Hit Points'
                  : `Hit Points die ${keptDie(state.hitPointsRoll)}; tap to replace`
              }
            >
              <DieFaces roll={state.hitPointsRoll} sides={6} size="big" />
            </button>
            <span className="cc-diecell-v">
              {derived.hitPointsParts.die !== null
                ? species.hitPointsBase + derived.hitPointsParts.die
                : '—'}
            </span>
            {state.hitPointsRoll.value !== null && state.hitPointsRoll.reroll === null && (
              <button
                type="button"
                className="cc-link small"
                disabled={!canReroll(state, state.hitPointsRoll)}
                onClick={() => setOpen({ kind: 'hp', reroll: true })}
              >
                Reroll
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="cc-dicerow pool" role="group" aria-label="Five dice" id="todo:dice">
            {state.pool.map((roll, index) => {
              const owner = STAT_KEYS.find((key) => state.assignment[key] === index);
              const isOpen = open?.kind === 'pool' && open.index === index;
              return (
                <div
                  key={index}
                  className={`cc-diecell${isOpen ? ' open' : ''}${roll.value === null ? ' empty' : ''}${picked === index ? ' picked' : ''}`}
                >
                  <span className="cc-diecell-k">
                    Die {index + 1}
                    <small>
                      {owner
                        ? `→ ${STAT_NAMES[owner].abbr}`
                        : roll.value === null
                          ? ''
                          : 'tap, then a stat'}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="cc-diecell-die"
                    aria-pressed={picked === index}
                    onClick={() => {
                      if (roll.value === null)
                        setOpen(isOpen ? null : { kind: 'pool', index, reroll: false });
                      else setPicked(picked === index ? null : index);
                    }}
                    aria-label={
                      roll.value === null
                        ? `Roll die ${index + 1}`
                        : `Die ${index + 1} shows ${keptDie(roll)}; tap to pick it, then tap a stat`
                    }
                  >
                    <DieFaces roll={roll} sides={10} size="big" />
                  </button>
                  {roll.value !== null && (
                    <span className="cc-diecell-links">
                      <button
                        type="button"
                        className="cc-link small"
                        onClick={() =>
                          setOpen(
                            isOpen && !open.reroll ? null : { kind: 'pool', index, reroll: false },
                          )
                        }
                      >
                        Replace
                      </button>
                      {roll.reroll === null && (
                        <button
                          type="button"
                          className="cc-link small"
                          disabled={!canReroll(state, roll)}
                          onClick={() => setOpen({ kind: 'pool', index, reroll: true })}
                        >
                          Reroll
                        </button>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
            <div
              className={`cc-diecell hp${open?.kind === 'hp' ? ' open' : ''}${state.hitPointsRoll.value === null ? ' empty' : ''}`}
              id="hp"
            >
              <span className="cc-diecell-k">
                <Term abbr="HP" />
                <small>{species.hitPointsPrinted}</small>
              </span>
              <button
                type="button"
                className="cc-diecell-die"
                aria-expanded={open?.kind === 'hp'}
                onClick={() => setOpen(open?.kind === 'hp' ? null : { kind: 'hp', reroll: false })}
              >
                <DieFaces roll={state.hitPointsRoll} sides={6} size="big" />
              </button>
              <span className="cc-diecell-v">
                {derived.hitPointsParts.die !== null
                  ? species.hitPointsBase + derived.hitPointsParts.die
                  : '—'}
              </span>
              {state.hitPointsRoll.value !== null && state.hitPointsRoll.reroll === null && (
                <button
                  type="button"
                  className="cc-link small"
                  disabled={!canReroll(state, state.hitPointsRoll)}
                  onClick={() => setOpen({ kind: 'hp', reroll: true })}
                >
                  Reroll
                </button>
              )}
            </div>
          </div>
          <div className="cc-assign" role="group" aria-label="Assign the dice">
            {STAT_KEYS.map((key) => {
              const index = state.assignment[key];
              const die = statDie(state, key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`cc-assign-stat${picked !== null ? ' target' : ''}${index !== null ? ' filled' : ''}`}
                  id={`stat:${key}`}
                  disabled={picked === null && index === null}
                  onClick={() => {
                    if (picked !== null) {
                      dispatch({ type: 'assign', stat: key, index: picked });
                      setPicked(null);
                    } else if (index !== null) dispatch({ type: 'assign', stat: key, index: null });
                  }}
                  aria-label={`${STAT_NAMES[key].name}: ${die === null ? 'no die' : `die ${die}`}${picked !== null ? '. Tap to place the picked die here' : index !== null ? '. Tap to free the die' : ''}`}
                >
                  <span className="cc-assign-k">{STAT_NAMES[key].abbr}</span>
                  <span className="cc-assign-base">{species.base[key]} +</span>
                  <span className="cc-assign-die">
                    {die === null ? '·' : die === 10 ? '0' : die}
                  </span>
                  <span className="cc-assign-v">{derived.rolled[key] ?? '—'}</span>
                </button>
              );
            })}
          </div>
          <p className="cc-hint">
            Tap a rolled die, then the stat it goes to. Tap a filled stat to free its die.
          </p>
        </>
      )}

      {open && (
        <div className="cc-padwell">
          {open.kind === 'hp' ? (
            <DicePad
              sides={6}
              label={
                open.reroll
                  ? 'Reroll 1d6 for Hit Points: the higher die is kept'
                  : state.hitPointsRoll.value === null
                    ? 'Roll 1d6 for Hit Points'
                    : 'Replace the Hit Points die'
              }
              autoFocus
              onCommit={(value) => {
                dispatch(
                  open.reroll
                    ? { type: 'reroll_hit_points', value }
                    : { type: 'roll_hit_points', value },
                );
                setOpen(null);
              }}
            />
          ) : open.kind === 'stat' ? (
            <DicePad
              sides={10}
              label={
                open.reroll
                  ? `Reroll 1d10 for ${STAT_NAMES[open.stat].name}: the higher die is kept`
                  : state.rolls[open.stat].value === null
                    ? `Roll 1d10 for ${STAT_NAMES[open.stat].name}`
                    : `Replace the ${STAT_NAMES[open.stat].abbr} die`
              }
              hint="The 0 face reads as 10."
              autoFocus
              onCommit={(value) => {
                dispatch(
                  open.reroll
                    ? { type: 'reroll_stat', stat: open.stat, value }
                    : { type: 'roll_stat', stat: open.stat, value },
                );
                setOpen(null);
              }}
            />
          ) : (
            <DicePad
              sides={10}
              label={
                open.reroll
                  ? `Reroll die ${open.index + 1}: the higher die is kept`
                  : `Roll die ${open.index + 1}`
              }
              hint="The 0 face reads as 10."
              autoFocus
              onCommit={(value) => {
                dispatch(
                  open.reroll
                    ? { type: 'reroll_pool', index: open.index, value }
                    : { type: 'roll_pool', index: open.index, value },
                );
                setOpen(null);
              }}
            />
          )}
        </div>
      )}

      <div className="cc-actions">
        <button type="button" className="cc-ghost" onClick={rollAll}>
          Roll everything still empty for me
        </button>
        <button type="button" className="cc-link" onClick={() => dispatch({ type: 'clear_rolls' })}>
          Clear all dice
        </button>
      </div>

      <Block title="The two rerolls" cite={CITES.reroll} quote={QUOTES.reroll}>
        <Quote text={QUOTES.reroll} cite={CITES.reroll} />
        <p className="cc-small muted">
          Hit Points: {species.name} {species.hitPointsPrinted}
          {derived.profession
            ? `, then the ${derived.profession.name}’s ${derived.profession.hitPointsPrinted}`
            : ', then the profession’s modifier'}{' '}
          <CiteChip
            cite={CITES.hitPoints}
            quote="Now it is time to determine how many Hit Points your character has. This is also modified later on depending on the choice of profession."
          />
        </p>
      </Block>
    </div>
  );
}
