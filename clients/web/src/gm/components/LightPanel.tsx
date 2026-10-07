import { useState } from 'react';
import { heroById, lightSummary, type LightSource } from '../engine.ts';
import { CITES, GAPS, LIGHT_RULES, type LightKind } from '../rules.ts';
import { CiteChip, HeroSelect, Panel, Stepper, useGm } from './common.tsx';

export function LightPanel() {
  const { state, dispatch } = useGm();
  const summary = lightSummary(state);
  const dark = summary.lit.length === 0;
  const [adding, setAdding] = useState(false);
  return (
    <Panel
      title="Light"
      cite={CITES.lightSources}
      tone={dark && state.lights.length > 0 ? 'warn' : undefined}
      aside={
        <button type="button" className="gm-secondary" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
          Add light source
        </button>
      }
    >
      {dark ? (
        <div className="gm-status bad">
          <strong>No light source is lit.</strong>
          <p>
            No Fear/Terror or Perception bonus from light. {GAPS.darkness}{' '}
            <CiteChip cite={CITES.nightVision} />
          </p>
        </div>
      ) : (
        <div className="gm-status good">
          <strong>
            All heroes +{summary.fearTerror} on Fear and Terror tests
            {state.heroes.some((h) => h.nightVision) ? ' (Night Vision included)' : ''}.
          </strong>
          <p>
            {Object.entries(summary.perception).length > 0
              ? Object.entries(summary.perception)
                  .map(([id, bonus]) => `${heroById(state, id)?.name ?? 'Carrier'} +${bonus} Perception`)
                  .join(' · ')
              : 'Set the carrier on each light to track their Perception bonus.'}
          </p>
        </div>
      )}

      {adding && <AddLight onDone={() => setAdding(false)} />}

      {state.lights.length > 0 && (
        <ul className="gm-lights">
          {state.lights.map((light) => (
            <li key={light.id}>
              <LightRow light={light} />
            </li>
          ))}
        </ul>
      )}

      <div className="gm-row gm-spares">
        <Stepper
          label="Spare torches"
          value={state.spares.torches}
          onChange={(torches) => dispatch({ type: 'set_spares', torches })}
          compact
        />
        <Stepper
          label="Lamp Oil"
          value={state.spares.lampOil}
          onChange={(lampOil) => dispatch({ type: 'set_spares', lampOil })}
          compact
        />
      </div>
      <details className="gm-details">
        <summary>What the book says about light</summary>
        {(Object.keys(LIGHT_RULES) as LightKind[]).map((kind) => (
          <div key={kind} className="gm-rules-block">
            <strong>{LIGHT_RULES[kind].label}</strong>
            <ul>
              <li>
                All heroes, Night Vision included, +{LIGHT_RULES[kind].fearTerror} Fear/Terror; the carrier +
                {LIGHT_RULES[kind].perception} Perception.
              </li>
              {LIGHT_RULES[kind].notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ))}
      </details>
    </Panel>
  );
}

function LightRow({ light }: { light: LightSource }) {
  const { state, dispatch } = useGm();
  const rules = LIGHT_RULES[light.kind];
  const [swing, setSwing] = useState('');
  const out = !light.lit;
  const status = light.destroyed
    ? 'destroyed'
    : light.spent
      ? 'spent'
      : light.lit
        ? 'lit'
        : light.kind !== 'torch' && light.oilHalves <= 0
          ? 'out of oil'
          : 'unlit';
  return (
    <div className={`gm-light${out ? ' out' : ''}`}>
      <div className="gm-light-main">
        <span className={`gm-flame ${light.lit ? 'on' : 'off'}`} aria-hidden="true" />
        <div className="gm-light-text">
          <strong>{rules.label}</strong> <span className="gm-tag">{status}</span>
          {light.kind !== 'torch' && !light.destroyed && (
            <span className="gm-oil" title={`${light.oilHalves} of 2 oil halves left`}>
              oil {'●'.repeat(light.oilHalves)}
              {'○'.repeat(Math.max(0, 2 - light.oilHalves))}
            </span>
          )}
        </div>
        <HeroSelect
          label="Carrier"
          allowNone
          value={light.carrierId}
          onChange={(carrierId) => dispatch({ type: 'light_carrier', id: light.id, carrierId })}
        />
      </div>
      <div className="gm-light-actions">
        {light.lit ? (
          <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'light_set_lit', id: light.id, lit: false })}>
            Goes out
          </button>
        ) : light.destroyed ? null : light.spent || (light.kind !== 'torch' && light.oilHalves <= 0) ? (
          <button
            type="button"
            disabled={(light.kind === 'torch' ? state.spares.torches : state.spares.lampOil) < 1}
            onClick={() => dispatch({ type: 'light_relight', id: light.id })}
          >
            {light.kind === 'torch' ? 'Light a new torch' : 'Refill'}
          </button>
        ) : (
          <button type="button" onClick={() => dispatch({ type: 'light_set_lit', id: light.id, lit: true })}>
            Light it
          </button>
        )}
        {light.kind === 'torch' && light.lit && (
          <form
            className="gm-swing"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(swing);
              if (Number.isInteger(n) && n >= 1 && n <= 100) {
                dispatch({ type: 'light_attack_roll', id: light.id, roll: n });
                setSwing('');
              }
            }}
          >
            <label htmlFor={`swing-${light.id}`} className="sr-only">
              Unmodified attack roll with the torch
            </label>
            <input
              id={`swing-${light.id}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              placeholder="swing roll"
              title="Unmodified attack roll with the torch: 90 or more puts it out"
              value={swing}
              onChange={(e) => setSwing(e.target.value)}
            />
            <button type="submit" className="gm-secondary" disabled={swing.trim() === ''}>
              Swung
            </button>
          </form>
        )}
        {light.kind !== 'torch' && light.lit && light.oilHalves < 2 && (
          <button type="button" className="gm-secondary" disabled={state.spares.lampOil < 1} onClick={() => dispatch({ type: 'light_refill', id: light.id })}>
            Top up
          </button>
        )}
        <button type="button" className="gm-link" onClick={() => dispatch({ type: 'light_remove', id: light.id })}>
          Remove
        </button>
      </div>
    </div>
  );
}

function AddLight({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useGm();
  const [kind, setKind] = useState<LightKind>('torch');
  const [carrier, setCarrier] = useState<string | null>(state.heroes.find((h) => !h.dead)?.id ?? null);
  const [lit, setLit] = useState(true);
  return (
    <form
      className="gm-form gm-inline"
      onSubmit={(e) => {
        e.preventDefault();
        dispatch({ type: 'light_add', kind, carrierId: carrier, lit });
        onDone();
      }}
    >
      <div className="gm-field">
        <label htmlFor="gm-light-kind">Light source</label>
        <select id="gm-light-kind" value={kind} onChange={(e) => setKind(e.target.value as LightKind)}>
          {(Object.keys(LIGHT_RULES) as LightKind[]).map((k) => (
            <option key={k} value={k}>
              {LIGHT_RULES[k].label}
            </option>
          ))}
        </select>
      </div>
      <HeroSelect label="Carrier" allowNone value={carrier} onChange={setCarrier} />
      <label className="gm-check">
        <input type="checkbox" checked={lit} onChange={(e) => setLit(e.target.checked)} />
        Lit now
      </label>
      <button type="submit">Add</button>
      <button type="button" className="gm-link" onClick={onDone}>
        Cancel
      </button>
    </form>
  );
}
