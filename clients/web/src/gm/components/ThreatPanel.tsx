import { useState } from 'react';
import { parseDice, rollDice } from '../dice.ts';
import { threatFloor } from '../engine.ts';
import { CITES, THREAT_SOURCES, questById } from '../rules.ts';
import { CiteChip, DieInput, Panel, signed, useGm } from './common.tsx';

export function ThreatPanel() {
  const { state, dispatch } = useGm();
  const { threat } = state;
  const quest = questById(state.questId);
  const [rolling, setRolling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState('');
  const floor = threatFloor(threat);
  const max = threat.max ?? 20;
  const span = Math.max(1, max - floor);
  const pct = (value: number) => `${Math.min(100, Math.max(0, ((value - floor) / span) * 100))}%`;
  const pendingRoll = state.pending.some((p) => p.request.kind === 'threat_roll');

  if (!threat.enabled) {
    return (
      <Panel title="Threat" cite={CITES.threatLevel}>
        <p className="muted">
          This quest uses no Threat Level{quest ? ` (${quest.title})` : ''}.
          {state.scenarioEnabled ? ' The Scenario die is still rolled.' : ''}
        </p>
        <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'set_threat_bounds', enabled: true })}>
          Use Threat anyway
        </button>
      </Panel>
    );
  }

  return (
    <Panel
      title="Threat"
      cite={CITES.threatLevel}
      tone={pendingRoll ? 'warn' : undefined}
      aside={
        <label className="gm-check">
          <input
            type="checkbox"
            checked={state.inBattle}
            onChange={(e) => dispatch({ type: 'set_in_battle', inBattle: e.target.checked })}
          />
          In battle
        </label>
      }
    >
      <div className="gm-threat-top">
        <div className="gm-big" aria-live="polite">
          <span className="gm-big-value">{threat.level}</span>
          <span className="gm-big-label">
            Threat Level
            <br />
            <span className="muted">
              min {floor}
              {threat.max !== null ? ` · max ${threat.max}` : ''} · start {threat.start}
            </span>
          </span>
        </div>
        <div className="gm-threat-actions">
          <button type="button" onClick={() => setRolling((v) => !v)} aria-expanded={rolling}>
            Threat roll (1d20)
          </button>
          <button type="button" className="gm-secondary" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            Set level
          </button>
        </div>
      </div>

      <div className="gm-gauge" role="img" aria-label={`Threat ${threat.level} of ${max}`}>
        <div className="gm-gauge-fill" style={{ width: pct(threat.level) }} />
        {threat.thresholds.map((t) => (
          <span
            key={t}
            className="gm-gauge-mark"
            style={{ left: pct(t) }}
            title={`Wandering Monster when Threat is increased to ${t}`}
          >
            <span className="gm-gauge-mark-label">{t}</span>
          </span>
        ))}
      </div>
      {threat.thresholds.length > 0 && (
        <p className="gm-hint">
          Wandering Monster every time Threat is increased to {threat.thresholds.join(' or ')}{' '}
          <CiteChip cite={CITES.questThresholds} />
        </p>
      )}

      {rolling && (
        <div className="gm-inline">
          <DieInput
            sides={20}
            label={`Threat roll against ${threat.level}${state.inBattle ? ' (in battle)' : ''}`}
            onCommit={(value) => {
              setRolling(false);
              dispatch({ type: 'threat_roll', value });
            }}
          />
          <p className="gm-hint">
            20 lowers Threat by 5. At or below Threat: roll on the Threat table. Above: Threat +1. Lit
            torches and lanterns burn on a roll below Threat.
          </p>
        </div>
      )}

      {editing && (
        <form
          className="gm-inline gm-form"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(custom);
            if (Number.isInteger(n)) {
              dispatch({ type: 'set_threat', level: n, reason: 'set by the Game Master' });
              setCustom('');
              setEditing(false);
            }
          }}
        >
          <div className="gm-field narrow">
            <label htmlFor="gm-threat-set">New Threat Level</label>
            <input
              id="gm-threat-set"
              type="number"
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>
          <button type="submit" disabled={custom.trim() === ''}>
            Set
          </button>
        </form>
      )}

      <h3 className="gm-subhead">Threat changes</h3>
      <ul className="gm-chips" aria-label="Threat changes">
        {THREAT_SOURCES.filter((s) => s.id !== 'custom').map((source) => (
          <li key={source.id}>
            <button
              type="button"
              className={`gm-chip${source.delta !== null && source.delta < 0 ? ' good' : source.dice ? ' good' : ''}`}
              title={source.detail}
              onClick={() => {
                if (source.dice) {
                  const expr = parseDice(source.dice);
                  if (expr) dispatch({ type: 'threat_source', source: source.id, amount: -rollDice(expr) });
                  return;
                }
                dispatch({ type: 'threat_source', source: source.id });
              }}
            >
              <span className="gm-chip-delta">
                {source.delta !== null ? signed(source.delta) : source.dice ? `−${source.dice}` : '?'}
              </span>
              {source.label}
            </button>
          </li>
        ))}
        <li>
          <button type="button" className="gm-chip" onClick={() => dispatch({ type: 'threat_source', source: 'custom' })}>
            <span className="gm-chip-delta">±</span>Other
          </button>
        </li>
      </ul>

      <div className="gm-row gm-wm">
        <span>
          <strong>{state.wanderingMonsters}</strong> Wandering Monster token{state.wanderingMonsters === 1 ? '' : 's'}{' '}
          <CiteChip cite={CITES.wanderingMonsters} />
        </span>
        <span className="gm-row-actions">
          <button type="button" className="gm-mini" aria-label="Remove a Wandering Monster token" disabled={state.wanderingMonsters === 0} onClick={() => dispatch({ type: 'wm_remove' })}>
            −
          </button>
          <button type="button" className="gm-mini" aria-label="Place a Wandering Monster token" onClick={() => dispatch({ type: 'wm_place' })}>
            +
          </button>
        </span>
      </div>
    </Panel>
  );
}
