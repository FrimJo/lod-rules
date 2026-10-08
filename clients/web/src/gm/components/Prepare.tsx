import { useEffect, useRef, useState } from 'react';
import { CITES, LIGHT_RULES, QUESTS, SANITY, questById, type LightKind } from '../rules.ts';
import { CiteChip, Stepper, useGm } from './common.tsx';

/**
 * Before the first turn the stage is the setup, in the order the book needs it: the quest
 * (Threat start, minimum, maximum, thresholds), the heroes with their RES (Party Morale),
 * and what the party carries into the dark. Then one button starts turn 1.
 */
export function Prepare() {
  const { state, dispatch } = useGm();
  const ready = state.heroes.length > 0;
  return (
    <div className="gm-prepare">
      <section className="gm-card">
        <header className="gm-card-head">
          <div>
            <span className="gm-card-kicker">1 · Quest</span>
            <h2 className="gm-card-title">Which dungeon?</h2>
          </div>
        </header>
        <QuestPicker />
      </section>
      <section className="gm-card">
        <header className="gm-card-head">
          <div>
            <span className="gm-card-kicker">2 · Party</span>
            <h2 className="gm-card-title">
              Who goes in?{' '}
              <CiteChip
                cite={CITES.moraleCalculation}
                quote="Each member's RES ÷ 10 (rounded down), summed, gives the Party Morale start value."
              />
            </h2>
          </div>
          <span className="gm-card-aside">
            Morale starts at <b>{state.morale.start}</b>
          </span>
        </header>
        <AddHero />
        {state.heroes.length > 0 && (
          <ul className="gm-plain">
            {state.heroes.map((hero) => (
              <li key={hero.id}>
                <span>
                  <strong>{hero.name}</strong>{' '}
                  <span className="muted">
                    RES {hero.resolve}
                    {hero.nightVision ? ' · Night Vision' : ''} · Sanity {SANITY.start}
                  </span>
                </span>
                <button
                  type="button"
                  className="gm-link"
                  onClick={() => dispatch({ type: 'hero_remove', id: hero.id })}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="gm-card">
        <header className="gm-card-head">
          <div>
            <span className="gm-card-kicker">3 · Light and supplies</span>
            <h2 className="gm-card-title">
              What do they carry? <CiteChip cite={CITES.lightSources} />
            </h2>
          </div>
        </header>
        <AddLight />
        {state.lights.length > 0 && (
          <ul className="gm-plain">
            {state.lights.map((light) => (
              <li key={light.id}>
                <span>
                  <strong>{LIGHT_RULES[light.kind].label}</strong>{' '}
                  <span className="muted">
                    {state.heroes.find((h) => h.id === light.carrierId)?.name ?? 'no carrier'} ·{' '}
                    {light.lit ? 'lit' : 'unlit'}
                  </span>
                </span>
                <button
                  type="button"
                  className="gm-link"
                  onClick={() => dispatch({ type: 'light_remove', id: light.id })}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="gm-supplies">
          <Stepper
            label="Spare torches"
            value={state.spares.torches}
            onChange={(torches) => dispatch({ type: 'set_spares', torches })}
          />
          <Stepper
            label="Lamp Oil"
            value={state.spares.lampOil}
            onChange={(lampOil) => dispatch({ type: 'set_spares', lampOil })}
          />
          <Stepper
            label="Rations"
            value={state.rations}
            onChange={(rations) => dispatch({ type: 'set_rations', rations })}
            hint="A short rest costs one."
          />
        </div>
      </section>
      <div className="gm-enter">
        <button
          type="button"
          className="gm-primary big"
          disabled={!ready}
          onClick={() => dispatch({ type: 'new_turn' })}
          title="Shortcut: N"
        >
          Enter the dungeon
        </button>
        <span className="gm-hint">
          {ready
            ? 'Starts turn 1 with the heroes on the starting tile. The stone-side door is unlocked and adds no Threat.'
            : 'Add at least one hero first.'}{' '}
          <CiteChip cite={CITES.initialSetup} />
        </span>
      </div>
    </div>
  );
}

export function QuestPicker() {
  const { state, dispatch } = useGm();
  const quest = questById(state.questId);
  return (
    <div className="gm-form column">
      <div className="gm-field">
        <label htmlFor="gm-quest">Quest</label>
        <select
          id="gm-quest"
          value={state.questId ?? ''}
          onChange={(e) => dispatch({ type: 'set_quest', questId: e.target.value || null })}
        >
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
      {quest ? (
        <p className="gm-card-text">
          <strong>{quest.title}.</strong>{' '}
          {quest.start === null
            ? 'No Threat Level.'
            : `Threat starts at ${quest.start}, minimum ${quest.min === 'start' ? 'the start value' : quest.min}, maximum ${quest.max}.`}
          {quest.thresholds.length
            ? ` Wandering Monster whenever Threat is increased to ${quest.thresholds.join(' or ')}.`
            : ''}
          {quest.noScenarioDie ? ' No Scenario die.' : ''} {quest.notes.join(' ')}{' '}
          <CiteChip cite={quest.cite} />
        </p>
      ) : (
        <p className="gm-hint">
          Without a quest the book's defaults apply: Threat never below 2, no maximum, Scenario die
          on. <CiteChip cite={CITES.threatLevel} />
        </p>
      )}
    </div>
  );
}

export function AddHero({ autoFocus = false }: { autoFocus?: boolean }) {
  const { dispatch } = useGm();
  const [name, setName] = useState('');
  const [resolve, setResolve] = useState('');
  const [nightVision, setNightVision] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const res = Number(resolve);
  const resValid = resolve.trim() !== '' && Number.isInteger(res) && res >= 0;
  const valid = name.trim() !== '' && resValid;
  useEffect(() => {
    if (autoFocus) nameRef.current?.focus();
  }, [autoFocus]);
  return (
    <form
      className="gm-form"
      aria-label="Add a hero"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        dispatch({ type: 'hero_add', name: name.trim(), resolve: res, nightVision });
        setName('');
        setResolve('');
        setNightVision(false);
        nameRef.current?.focus();
      }}
    >
      <div className="gm-field grow">
        <label htmlFor="gm-hero-name">Name</label>
        <input
          id="gm-hero-name"
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          placeholder="Hero’s name"
        />
      </div>
      <div className="gm-field narrow">
        <label htmlFor="gm-hero-res">RES</label>
        <input
          id="gm-hero-res"
          type="number"
          inputMode="numeric"
          min={0}
          value={resolve}
          onChange={(e) => setResolve(e.target.value)}
          placeholder="45"
        />
      </div>
      <label className="gm-check">
        <input
          type="checkbox"
          checked={nightVision}
          onChange={(e) => setNightVision(e.target.checked)}
        />
        Night Vision
      </label>
      <button type="submit" className="gm-primary" disabled={!valid}>
        Add{resValid ? ` (+${Math.floor(res / 10)} morale)` : ''}
      </button>
    </form>
  );
}

export function AddLight() {
  const { state, dispatch } = useGm();
  const [kind, setKind] = useState<LightKind>('torch');
  const living = state.heroes.filter((h) => !h.dead);
  const [carrier, setCarrier] = useState<string | null>(null);
  const [lit, setLit] = useState(true);
  const chosen =
    carrier && living.some((h) => h.id === carrier) ? carrier : (living[0]?.id ?? null);
  return (
    <form
      className="gm-form"
      aria-label="Add a light source"
      onSubmit={(e) => {
        e.preventDefault();
        dispatch({ type: 'light_add', kind, carrierId: chosen, lit });
      }}
    >
      <div className="gm-field">
        <label htmlFor="gm-light-kind">Light source</label>
        <select
          id="gm-light-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as LightKind)}
        >
          {(Object.keys(LIGHT_RULES) as LightKind[]).map((k) => (
            <option key={k} value={k}>
              {LIGHT_RULES[k].label} · +{LIGHT_RULES[k].perception} PER
            </option>
          ))}
        </select>
      </div>
      <div className="gm-field">
        <label htmlFor="gm-light-carrier">Carrier</label>
        <select
          id="gm-light-carrier"
          value={chosen ?? ''}
          onChange={(e) => setCarrier(e.target.value || null)}
        >
          {living.length === 0 && <option value="">Nobody yet</option>}
          {living.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>
      <label className="gm-check">
        <input type="checkbox" checked={lit} onChange={(e) => setLit(e.target.checked)} />
        Lit
      </label>
      <button type="submit" className="gm-primary">
        Add
      </button>
    </form>
  );
}
