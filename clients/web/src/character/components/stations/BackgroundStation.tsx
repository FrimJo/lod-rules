import { DicePad } from '../../../gm/components/DicePad.tsx';
import { BACKGROUNDS, CITES, GAPS, QUOTES } from '../../rules.ts';
import { Block, CiteChip, Note, Quote, useCreator } from '../common.tsx';

export function BackgroundStation() {
  const { state, derived, dispatch } = useCreator();
  const background = derived.background;
  return (
    <div className="cc-body">
      <Quote text={QUOTES.background} cite={CITES.backgroundOptional} />
      <div className="cc-segment" role="radiogroup" aria-label="Background">
        <label className={`cc-segment-option${!state.background.enabled ? ' on' : ''}`}>
          <input
            type="radio"
            name="cc-bg"
            checked={!state.background.enabled}
            onChange={() => dispatch({ type: 'set_background_enabled', enabled: false })}
          />
          No Background
        </label>
        <label className={`cc-segment-option${state.background.enabled ? ' on' : ''}`}>
          <input
            type="radio"
            name="cc-bg"
            checked={state.background.enabled}
            onChange={() => dispatch({ type: 'set_background_enabled', enabled: true })}
          />
          Roll one up
        </label>
      </div>
      {state.background.enabled && (
        <>
          <Note tone="gap">{GAPS.backgroundDie}</Note>
          {!background && (
            <div className="cc-padwell" id="todo:background">
              <DicePad
                sides={20}
                label="Roll 1d20 over the twenty numbered Backgrounds"
                onCommit={(roll) => dispatch({ type: 'set_background_roll', roll })}
              />
            </div>
          )}
          {background && (
            <div className="cc-result big">
              <span className="cc-power-head">
                <span className="cc-row-roll">{background.number}</span>
                <strong className="cc-result-title">{background.name}</strong>
                <CiteChip cite={background.cite} />
                <button
                  type="button"
                  className="cc-link"
                  onClick={() => dispatch({ type: 'set_background_roll', roll: null })}
                >
                  Roll again
                </button>
              </span>
              <p className="cc-text">{background.text}</p>
              <ul className="cc-list">
                {background.startingCoins && (
                  <li>Starting coins become {background.startingCoins} c; the Market uses that.</li>
                )}
                {background.sanity && (
                  <li>Sanity on the sheet is {derived.sanity} instead of 8.</li>
                )}
                {background.partyMorale && (
                  <li>Party Morale contribution changes by {background.partyMorale}.</li>
                )}
                {background.hate && <li>Write “Hate: {background.hate}” under Talents.</li>}
                {background.wizardReroll && derived.profession?.id === 'wizard' && (
                  <li>
                    <Note tone="warn">Not applicable for wizards: reroll.</Note>
                  </li>
                )}
              </ul>
            </div>
          )}
          <Block title="The twenty Backgrounds" cite={CITES.backgrounds}>
            <ol className="cc-rows" aria-label="Backgrounds">
              {BACKGROUNDS.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className={`cc-row tappable${state.background.roll === b.number ? ' hit' : ''}`}
                    onClick={() => dispatch({ type: 'set_background_roll', roll: b.number })}
                  >
                    <span className="cc-row-roll">{b.number}</span>
                    <span className="cc-row-text">
                      {b.name}
                      <span>{b.text.length > 120 ? `${b.text.slice(0, 117)}…` : b.text}</span>
                    </span>
                    <CiteChip cite={b.cite} />
                  </button>
                </li>
              ))}
            </ol>
          </Block>
        </>
      )}
    </div>
  );
}
