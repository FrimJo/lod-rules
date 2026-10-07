import { useState } from 'react';
import { lightSummary, type Hero } from '../engine.ts';
import { CITES, HERO_STATUSES, MENTAL_CONDITIONS, SANITY, type HeroStatus } from '../rules.ts';
import { CiteChip, Panel, useGm } from './common.tsx';

export function HeroesPanel() {
  const { state } = useGm();
  const [adding, setAdding] = useState(false);
  const showForm = adding || state.heroes.length === 0;
  return (
    <Panel
      title="Heroes"
      cite={CITES.sanity}
      aside={
        <button type="button" className="gm-secondary" onClick={() => setAdding((v) => !v)} aria-expanded={showForm}>
          Add hero
        </button>
      }
    >
      {showForm && <AddHero onDone={() => setAdding(false)} />}
      {state.heroes.length === 0 ? (
        <p className="muted">No heroes yet. Each hero starts with {SANITY.start} Sanity.</p>
      ) : (
        <ul className="gm-heroes">
          {state.heroes.map((hero) => (
            <li key={hero.id}>
              <HeroCard hero={hero} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function HeroCard({ hero }: { hero: Hero }) {
  const { state, dispatch } = useGm();
  const [editing, setEditing] = useState(false);
  const perception = lightSummary(state).perception[hero.id];
  const dots = Array.from({ length: SANITY.start }, (_, i) => i);
  return (
    <article className={`gm-hero${hero.dead ? ' dead' : ''}`}>
      <header className="gm-hero-head">
        <div>
          <strong>{hero.name}</strong>{' '}
          <span className="muted">
            RES {hero.resolve}
            {hero.nightVision ? ' · Night Vision' : ''}
            {perception ? ` · +${perception} Perception (light)` : ''}
            {hero.dead ? ' · dead' : ''}
          </span>
        </div>
        <div className="gm-row-actions">
          <button type="button" className="gm-link" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            Edit
          </button>
          <button type="button" className="gm-link" onClick={() => dispatch({ type: 'hero_remove', id: hero.id })}>
            Remove
          </button>
        </div>
      </header>

      {editing && <EditHero hero={hero} onDone={() => setEditing(false)} />}

      <div className="gm-sanity" aria-label={`Sanity ${hero.sanity} of ${hero.sanityMax}`}>
        <span className="gm-sanity-label">Sanity</span>
        <span className="gm-dots" aria-hidden="true">
          {dots.map((i) => (
            <span
              key={i}
              className={`gm-dot${i < hero.sanity ? ' full' : i < hero.sanityMax ? '' : ' gone'}`}
            />
          ))}
        </span>
        <span className="gm-sanity-value">
          {hero.sanity}/{hero.sanityMax}
        </span>
        <span className="gm-row-actions">
          <button
            type="button"
            className="gm-mini"
            aria-label={`${hero.name} loses 1 Sanity`}
            disabled={hero.dead || hero.sanity === 0}
            onClick={() => dispatch({ type: 'sanity_loss', heroId: hero.id, amount: 1, reason: 'event' })}
          >
            −
          </button>
          <button
            type="button"
            className="gm-mini"
            aria-label={`${hero.name} regains 1 Sanity`}
            disabled={hero.dead || hero.sanity >= hero.sanityMax}
            onClick={() => dispatch({ type: 'hero_update', id: hero.id, patch: { sanity: hero.sanity + 1 } })}
          >
            +
          </button>
        </span>
      </div>

      {hero.conditions.length > 0 && (
        <ul className="gm-conditions" aria-label={`${hero.name}'s mental conditions`}>
          {hero.conditions.map((id) => {
            const condition = MENTAL_CONDITIONS.find((c) => c.id === id)!;
            return (
              <li key={id}>
                <span className="gm-condition" title={condition.effect}>
                  <strong>{condition.name}</strong>
                  {condition.tracked ? ` — ${condition.tracked}` : ''}
                  <button
                    type="button"
                    className="gm-link"
                    aria-label={`Remove ${condition.name} from ${hero.name}`}
                    onClick={() => dispatch({ type: 'hero_condition_remove', id: hero.id, condition: id })}
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {!hero.dead && (
        <div className="gm-statuses">
          {(Object.keys(HERO_STATUSES) as HeroStatus[]).map((status) => {
            const on = hero.statuses.includes(status);
            const info = HERO_STATUSES[status];
            return (
              <label key={status} className={`gm-toggle${on ? ' on' : ''}`} title={info.reminder}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => dispatch({ type: 'hero_status', id: hero.id, status, on: e.target.checked })}
                />
                {info.label}
              </label>
            );
          })}
          <button
            type="button"
            className="gm-chip bad small"
            title="Wound to the head: −1 Sanity, and a headlamp is destroyed"
            onClick={() => dispatch({ type: 'hero_head_wound', id: hero.id })}
          >
            Head wound
          </button>
        </div>
      )}
      {hero.statuses.length > 0 && !hero.dead && (
        <ul className="gm-reminders">
          {hero.statuses.map((status) => (
            <li key={status}>
              {HERO_STATUSES[status].reminder} <CiteChip cite={HERO_STATUSES[status].cite} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function AddHero({ onDone }: { onDone: () => void }) {
  const { dispatch } = useGm();
  const [name, setName] = useState('');
  const [resolve, setResolve] = useState('');
  const [nightVision, setNightVision] = useState(false);
  const res = Number(resolve);
  const valid = name.trim() !== '' && Number.isInteger(res) && res >= 0;
  return (
    <form
      className="gm-form gm-inline"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        dispatch({ type: 'hero_add', name: name.trim(), resolve: res, nightVision });
        setName('');
        setResolve('');
        setNightVision(false);
      }}
    >
      <div className="gm-field">
        <label htmlFor="gm-hero-name">Name</label>
        <input id="gm-hero-name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </div>
      <div className="gm-field narrow">
        <label htmlFor="gm-hero-res">RES</label>
        <input id="gm-hero-res" type="number" inputMode="numeric" min={0} value={resolve} onChange={(e) => setResolve(e.target.value)} />
      </div>
      <label className="gm-check">
        <input type="checkbox" checked={nightVision} onChange={(e) => setNightVision(e.target.checked)} />
        Night Vision
      </label>
      <button type="submit" disabled={!valid}>
        Add hero
      </button>
      <button type="button" className="gm-link" onClick={onDone}>
        Close
      </button>
    </form>
  );
}

function EditHero({ hero, onDone }: { hero: Hero; onDone: () => void }) {
  const { dispatch } = useGm();
  const [name, setName] = useState(hero.name);
  const [resolve, setResolve] = useState(String(hero.resolve));
  return (
    <form
      className="gm-form gm-inline"
      onSubmit={(e) => {
        e.preventDefault();
        const res = Number(resolve);
        dispatch({
          type: 'hero_update',
          id: hero.id,
          patch: { name: name.trim() || hero.name, ...(Number.isInteger(res) && res >= 0 ? { resolve: res } : {}) },
        });
        onDone();
      }}
    >
      <div className="gm-field">
        <label htmlFor={`gm-edit-name-${hero.id}`}>Name</label>
        <input id={`gm-edit-name-${hero.id}`} type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="gm-field narrow">
        <label htmlFor={`gm-edit-res-${hero.id}`}>RES</label>
        <input id={`gm-edit-res-${hero.id}`} type="number" inputMode="numeric" min={0} value={resolve} onChange={(e) => setResolve(e.target.value)} />
      </div>
      <label className="gm-check">
        <input
          type="checkbox"
          checked={hero.nightVision}
          onChange={(e) => dispatch({ type: 'hero_update', id: hero.id, patch: { nightVision: e.target.checked } })}
        />
        Night Vision
      </label>
      <button type="submit">Save</button>
    </form>
  );
}
