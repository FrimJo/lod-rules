import { useEffect, useId, useRef, useState } from 'react';
import { lightSummary, type Hero } from '../engine.ts';
import { CITES, HERO_STATUSES, MENTAL_CONDITIONS, SANITY, type HeroStatus } from '../rules.ts';
import { CiteChip, Panel, useGm } from './common.tsx';

const COLLAPSED_KEY = 'lod-rules:gm-table:heroes-collapsed';

/** A view preference (not table state): whether the party band is folded to its summary strip. */
function useCollapsed(): [boolean, (next: boolean) => void] {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === '1');
    } catch {
      // Storage blocked: the band simply starts open.
    }
  }, []);
  const set = (next: boolean) => {
    setCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Ignore; the preference lasts for the session.
    }
  };
  return [collapsed, set];
}

/**
 * The party, first on the table: the Game Master enters each hero's RES before anything else
 * (Party Morale starts at the sum of RES ÷ 10), so the form stays open until the first hero is
 * in and keeps the focus for the next one. Once the party is in, the band can fold to a
 * one-line summary and reopens with a click when a RES changes or a hero needs attention.
 */
export function HeroesPanel() {
  const { state } = useGm();
  const [adding, setAdding] = useState(false);
  const [stored, setCollapsed] = useCollapsed();
  const empty = state.heroes.length === 0;
  const collapsed = stored && !empty && !adding;
  const showForm = adding || empty;
  const bodyId = useId();
  const expand = () => setCollapsed(false);
  return (
    <Panel
      title="Heroes"
      cite={CITES.sanity}
      className="gm-party"
      aside={
        !empty && (
          <>
            {!showForm && !collapsed && (
              <button type="button" className="gm-secondary" onClick={() => setAdding(true)} aria-expanded={false}>
                Add hero
              </button>
            )}
            <button
              type="button"
              className="gm-link"
              aria-expanded={!collapsed}
              aria-controls={bodyId}
              onClick={() => (collapsed ? expand() : setCollapsed(true))}
            >
              {collapsed ? 'Show the party' : 'Fold away'}
            </button>
          </>
        )
      }
    >
      {empty && (
        <p className="gm-lead">
          Add each hero with the RES from their character sheet. Party Morale starts at the sum of RES ÷ 10{' '}
          <CiteChip cite={CITES.moraleCalculation} />, and every hero starts with {SANITY.start} Sanity.
        </p>
      )}
      {collapsed ? (
        <PartyStrip onExpand={expand} />
      ) : (
        <div id={bodyId}>
          {showForm && (
            <AddHero
              onDone={() => setAdding(false)}
              onAdded={() => setAdding(true)}
              closable={!empty}
              autoFocus={adding}
            />
          )}
          {!empty && (
            <ul className="gm-heroes">
              {state.heroes.map((hero) => (
                <li key={hero.id}>
                  <HeroCard hero={hero} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}

/** The folded party: one chip per hero with the numbers that change mid-dungeon. Click to open. */
function PartyStrip({ onExpand }: { onExpand: () => void }) {
  const { state } = useGm();
  return (
    <ul className="gm-party-strip" aria-label="Party summary">
      {state.heroes.map((hero) => {
        const flags = [
          ...hero.conditions.map((id) => MENTAL_CONDITIONS.find((c) => c.id === id)?.name ?? id),
          ...hero.statuses.map((status) => HERO_STATUSES[status].label),
        ];
        const alarmed = hero.dead || flags.length > 0 || hero.sanity < hero.sanityMax;
        return (
          <li key={hero.id}>
            <button
              type="button"
              className={`gm-party-chip${hero.dead ? ' dead' : alarmed ? ' alarmed' : ''}`}
              onClick={onExpand}
              title={`${hero.name}: RES ${hero.resolve}. Open the party to change Sanity or statuses.`}
            >
              <strong>{hero.name}</strong>
              {hero.dead ? (
                <span className="muted">dead</span>
              ) : (
                <span className="gm-party-sanity" aria-label={`Sanity ${hero.sanity} of ${hero.sanityMax}`}>
                  {hero.sanity}/{hero.sanityMax}
                </span>
              )}
              {flags.length > 0 && <span className="gm-party-flags">{flags.join(', ')}</span>}
            </button>
          </li>
        );
      })}
    </ul>
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

function AddHero({
  onDone,
  onAdded,
  closable,
  autoFocus,
}: {
  onDone: () => void;
  /** Keeps the form open after a hero is added so the next one follows at once. */
  onAdded: () => void;
  closable: boolean;
  autoFocus: boolean;
}) {
  const { dispatch } = useGm();
  const [name, setName] = useState('');
  const [resolve, setResolve] = useState('');
  const [nightVision, setNightVision] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const res = Number(resolve);
  const resValid = resolve.trim() !== '' && Number.isInteger(res) && res >= 0;
  const valid = name.trim() !== '' && resValid;
  const moraleShare = resValid ? Math.floor(res / 10) : null;

  // Focus the name only when the Game Master opened the form; on a fresh page the form is
  // already open and stealing focus would scroll the table.
  useEffect(() => {
    if (autoFocus) nameRef.current?.focus();
  }, [autoFocus]);

  return (
    <form
      className="gm-form gm-inline gm-add-hero"
      aria-label="Add a hero"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && closable) {
          e.preventDefault();
          onDone();
        }
      }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const trimmed = name.trim();
        dispatch({ type: 'hero_add', name: trimmed, resolve: res, nightVision });
        onAdded();
        setAdded(trimmed);
        setName('');
        setResolve('');
        setNightVision(false);
        nameRef.current?.focus();
      }}
    >
      <div className="gm-field">
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
          placeholder="e.g. 45"
          aria-describedby="gm-hero-res-hint"
        />
      </div>
      <label className="gm-check">
        <input type="checkbox" checked={nightVision} onChange={(e) => setNightVision(e.target.checked)} />
        Night Vision
      </label>
      <div className="gm-form-actions">
        <button type="submit" className="gm-primary" disabled={!valid}>
          Add to party
        </button>
        {closable && (
          <button type="button" className="gm-link" onClick={onDone}>
            Done
          </button>
        )}
      </div>
      <p id="gm-hero-res-hint" className="gm-form-status" aria-live="polite">
        {moraleShare !== null
          ? `Adds +${moraleShare} to the Party Morale start value (RES ÷ 10, rounded down).`
          : added
            ? `${added} joined the party. Add the next hero, or press Enter after typing.`
            : 'Resolve from the character sheet. Press Enter to add.'}
      </p>
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
