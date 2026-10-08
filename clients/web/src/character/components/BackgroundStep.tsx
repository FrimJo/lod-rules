import { useId } from 'react';
import { rollDie } from '../../gm/dice.ts';
import { BACKGROUNDS, CITES, QUOTES } from '../rules.ts';
import { CiteChip, Note, Quote, Section, useCreator } from './common.tsx';

export function BackgroundStep() {
  const { state, derived, dispatch } = useCreator();
  const id = useId();
  const background = derived.background;
  return (
    <Section title="Background (optional)" cite={CITES.backgroundOptional}>
      <Quote text={QUOTES.background} cite={CITES.backgroundOptional} />
      <label className="cc-check">
        <input type="checkbox" checked={state.background.enabled} onChange={(event) => dispatch({ type: 'set_background_enabled', enabled: event.target.checked })} />
        Roll up a Background for this hero
      </label>
      {state.background.enabled && (
        <>
          <Note tone="gap">The chapter numbers its twenty Backgrounds 1–20. The corpus has not extracted the chapter’s intro, so the die it names is not pinned here; a d20 over the numbered list matches the count.</Note>
          <div className="cc-form">
            <div className="cc-field narrow">
              <label htmlFor={id}>Result (1–20)</label>
              <input
                id={id}
                type="number"
                inputMode="numeric"
                min={1}
                max={BACKGROUNDS.length}
                value={state.background.roll ?? ''}
                onChange={(event) => {
                  const n = Number(event.target.value);
                  dispatch({ type: 'set_background_roll', roll: event.target.value === '' ? null : n });
                }}
              />
            </div>
            <button type="button" className="cc-secondary" onClick={() => dispatch({ type: 'set_background_roll', roll: rollDie(BACKGROUNDS.length) })}>
              Roll d20 for me
            </button>
          </div>
          {background && (
            <div className="cc-detail">
              <h3>
                {background.number}. {background.name} <CiteChip cite={background.cite} />
              </h3>
              <p>{background.text}</p>
              {background.startingCoins && <Note>Starting coins become {background.startingCoins} c; the Equipment step uses that.</Note>}
              {background.sanity && <Note>Sanity on the sheet is {8 + background.sanity} instead of 8.</Note>}
              {background.partyMorale && <Note>Party Morale contribution changes by {background.partyMorale}.</Note>}
              {background.hate && <Note>Write “Hate: {background.hate}” under Talents.</Note>}
              {background.wizardReroll && derived.profession?.id === 'wizard' && <Note tone="warn">Not applicable for wizards: reroll.</Note>}
            </div>
          )}
          <details className="cc-details">
            <summary>All twenty Backgrounds</summary>
            <ol className="cc-list numbered">
              {BACKGROUNDS.map((b) => (
                <li key={b.id} value={b.number}>
                  <button type="button" className="cc-link" onClick={() => dispatch({ type: 'set_background_roll', roll: b.number })}>
                    {b.name}
                  </button>{' '}
                  <CiteChip cite={b.cite} />
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
    </Section>
  );
}
