import { useState } from 'react';
import { isWavering } from '../engine.ts';
import { CITES, MORALE, MORALE_EVENTS, type MoraleEventId } from '../rules.ts';
import { CiteChip, HeroSelect, Panel, signed, useGm } from './common.tsx';

const NEGATIVE = MORALE_EVENTS.filter((e) => e.effect < 0);
const POSITIVE = MORALE_EVENTS.filter((e) => e.effect > 0);

export function MoralePanel() {
  const { state, dispatch } = useGm();
  const { morale } = state;
  const wavering = isWavering(state);
  const half = Math.floor(morale.start / 2);
  const [heroId, setHeroId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [override, setOverride] = useState('');
  const chosen = heroId && state.heroes.some((h) => h.id === heroId && !h.dead) ? heroId : (state.heroes.find((h) => !h.dead)?.id ?? null);

  const fire = (id: MoraleEventId) => {
    const row = MORALE_EVENTS.find((e) => e.id === id)!;
    if (row.id === 'poison_or_disease') return;
    dispatch({ type: 'morale_event', event: id, ...(row.perHero && chosen ? { heroId: chosen } : {}) });
  };

  return (
    <Panel
      title="Party Morale"
      cite={CITES.partyMorale}
      tone={morale.current === 0 && morale.start > 0 ? 'danger' : wavering ? 'warn' : undefined}
      aside={
        <button type="button" className="gm-secondary" onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings}>
          Start value
        </button>
      }
    >
      <div className="gm-threat-top">
        <div className="gm-big" aria-live="polite">
          <span className="gm-big-value">{morale.current}</span>
          <span className="gm-big-label">
            of {morale.start} to start
            <br />
            <span className="muted">wavers below {half}</span>
          </span>
        </div>
        <div className="gm-morale-state">
          {morale.start === 0 ? (
            <span className="muted">Add heroes with their RES to compute the start value.</span>
          ) : morale.current === 0 ? (
            <span className="gm-status-text bad">
              0: the party flees the dungeon as soon as it is not locked in combat.{' '}
              <CiteChip cite={CITES.moraleFlee} />
            </span>
          ) : wavering ? (
            <span className="gm-status-text bad">
              Wavering: all heroes −20 RES until morale is back above {half}.{' '}
              <CiteChip cite={CITES.moraleWavering} />
            </span>
          ) : (
            <span className="gm-status-text good">Steady.</span>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="gm-inline gm-form column">
          <p className="gm-hint">
            Start value: each hero’s RES ÷ 10 rounded down, summed <CiteChip cite={CITES.moraleCalculation} />. Flat
            bonuses:
          </p>
          <label className="gm-check">
            <input
              type="checkbox"
              checked={morale.naturalLeader}
              onChange={(e) => dispatch({ type: 'set_morale', naturalLeader: e.target.checked })}
            />
            Natural Leader talent in the party (+{MORALE.naturalLeader}, not cumulative){' '}
            <CiteChip cite={CITES.naturalLeader} />
          </label>
          <label className="gm-check">
            <input
              type="checkbox"
              checked={morale.powerstone}
              onChange={(e) => dispatch({ type: 'set_morale', powerstone: e.target.checked })}
            />
            Powerstone +2 Party Morale carried <CiteChip cite={CITES.powerstoneMorale} />
          </label>
          <form
            className="gm-form"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(override);
              dispatch({ type: 'set_morale', startOverride: override.trim() === '' ? null : Math.max(0, Math.round(n)) });
              setOverride('');
            }}
          >
            <div className="gm-field narrow">
              <label htmlFor="gm-morale-start">Override start value</label>
              <input
                id="gm-morale-start"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={morale.startOverride !== null ? String(morale.startOverride) : 'computed'}
                value={override}
                onChange={(e) => setOverride(e.target.value)}
              />
            </div>
            <button type="submit" className="gm-secondary">
              {override.trim() === '' ? 'Use computed' : 'Set'}
            </button>
          </form>
          <div className="gm-field narrow">
            <label htmlFor="gm-morale-current">Current value</label>
            <input
              id="gm-morale-current"
              type="number"
              inputMode="numeric"
              min={0}
              value={morale.current}
              onChange={(e) => dispatch({ type: 'set_morale', current: Math.round(Number(e.target.value)) })}
            />
          </div>
        </div>
      )}

      <div className="gm-morale-hero">
        <HeroSelect label="It happened to" value={chosen} onChange={setHeroId} />
        <span className="gm-hint">Hero events also apply the printed Sanity loss to this hero.</span>
      </div>

      <h3 className="gm-subhead">Setbacks</h3>
      <ul className="gm-chips" aria-label="Morale setbacks">
        {NEGATIVE.map((row) => (
          <li key={row.id}>
            {row.id === 'poison_or_disease' ? (
              <span className="gm-chip-pair">
                <button
                  type="button"
                  className="gm-chip bad"
                  title={row.flavour}
                  disabled={!chosen}
                  onClick={() => dispatch({ type: 'morale_event', event: row.id, heroId: chosen!, status: 'poisoned' })}
                >
                  <span className="gm-chip-delta">{signed(row.effect)}</span>Hero poisoned
                </button>
                <button
                  type="button"
                  className="gm-chip bad"
                  title={row.flavour}
                  disabled={!chosen}
                  onClick={() => dispatch({ type: 'morale_event', event: row.id, heroId: chosen!, status: 'diseased' })}
                >
                  <span className="gm-chip-delta">{signed(row.effect)}</span>Hero diseased
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="gm-chip bad"
                title={row.flavour}
                disabled={row.perHero && !chosen}
                onClick={() => fire(row.id)}
              >
                <span className="gm-chip-delta">{signed(row.effect)}</span>
                {row.situation.replace(/\.$/, '')}
              </button>
            )}
          </li>
        ))}
      </ul>
      <h3 className="gm-subhead">Boosts</h3>
      <ul className="gm-chips" aria-label="Morale boosts">
        {POSITIVE.map((row) => (
          <li key={row.id}>
            <button type="button" className="gm-chip good" title={row.flavour} onClick={() => fire(row.id)}>
              <span className="gm-chip-delta">
                {row.id === 'short_rest' ? `+${MORALE.restBonus}` : signed(row.effect)}
              </span>
              {row.situation}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="gm-chip good"
            title="Leader perk: increase Party Morale by +2, not above the starting value"
            onClick={() => dispatch({ type: 'morale_adjust', delta: MORALE.keepCalm, reason: 'Keep Calm and Carry On!', capAtStart: true, cite: CITES.keepCalm })}
          >
            <span className="gm-chip-delta">+{MORALE.keepCalm}</span>Keep Calm and Carry On!
          </button>
        </li>
      </ul>
      <p className="gm-hint">
        The table prints +1 for a short rest; the rest checklist on p. 98 gives +{MORALE.restBonus} up to the start
        value, which the corpus follows <CiteChip cite={CITES.rest} />.
      </p>
    </Panel>
  );
}
