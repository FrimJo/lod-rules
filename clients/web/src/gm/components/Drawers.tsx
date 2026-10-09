import { Fragment, useState } from 'react';
import { parseDice, rollDice } from '../dice.ts';
import {
  heroById,
  isWavering,
  lightSummary,
  threatFloor,
  type Hero,
  type LightSource,
  type LogEntry,
  type LogKind,
} from '../engine.ts';
import {
  CITES,
  GAPS,
  HERO_STATUSES,
  LIGHT_RULES,
  LINGERING_TRAUMA,
  MENTAL_CONDITIONS,
  MORALE,
  MORALE_EVENTS,
  SANITY,
  SANITY_LOSSES,
  THREAT_SOURCES,
  THREAT_TABLES,
  questById,
  type HeroStatus,
} from '../rules.ts';
import { CiteChip, Drawer, Stepper, signed, useGm, type DrawerId } from './common.tsx';
import { DicePad } from './DicePad.tsx';
import { AddHero, AddLight, QuestPicker } from './Prepare.tsx';

/** Renders whichever drawer is open. */
export function Drawers() {
  const { drawer, openDrawer } = useGm();
  if (!drawer) return null;
  const close = () => openDrawer(null);
  switch (drawer.kind) {
    case 'threat':
      return <ThreatDrawer onClose={close} />;
    case 'light':
      return <LightDrawer onClose={close} />;
    case 'morale':
      return <MoraleDrawer onClose={close} />;
    case 'party':
      return <PartyDrawer onClose={close} />;
    case 'hero':
      return <HeroDrawer heroId={drawer.heroId} onClose={close} />;
    case 'quest':
      return <QuestDrawer onClose={close} />;
    case 'log':
      return <LogDrawer onClose={close} />;
  }
}

function ThreatDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useGm();
  const { threat } = state;
  const quest = questById(state.questId);
  const floor = threatFloor(threat);
  const [rolling, setRolling] = useState(false);
  if (!threat.enabled)
    return (
      <Drawer title="Threat" cite={CITES.threatLevel} onClose={onClose}>
        <p className="gm-card-text">
          This quest uses no Threat Level{quest ? ` (${quest.title})` : ''}.
          {state.scenarioEnabled ? ' The Scenario die is still rolled.' : ''}
        </p>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => dispatch({ type: 'set_threat_bounds', enabled: true })}
        >
          Use Threat anyway
        </button>
      </Drawer>
    );
  return (
    <Drawer title="Threat" cite={CITES.threatLevel} onClose={onClose}>
      <div className="gm-big-row">
        <span className="gm-big">{threat.level}</span>
        <span className="gm-big-label">
          min {floor}
          {threat.max !== null ? ` · max ${threat.max}` : ''} · start {threat.start}
          {threat.thresholds.length > 0 && (
            <>
              <br />
              Wandering Monster when increased to {threat.thresholds.join(' or ')}{' '}
              <CiteChip cite={CITES.questThresholds} />
            </>
          )}
        </span>
        <span className="gm-row-actions">
          <button
            type="button"
            className="btn-mini"
            aria-label="Lower Threat by 1"
            disabled={threat.level <= floor}
            onClick={() =>
              dispatch({ type: 'threat_adjust', delta: -1, reason: 'set by the Game Master' })
            }
          >
            −
          </button>
          <button
            type="button"
            className="btn-mini"
            aria-label="Raise Threat by 1"
            onClick={() =>
              dispatch({ type: 'threat_adjust', delta: 1, reason: 'set by the Game Master' })
            }
          >
            +
          </button>
        </span>
      </div>

      <h3 className="subhead">Threat roll</h3>
      {rolling ? (
        <>
          <label className="gm-check">
            <input
              type="checkbox"
              checked={state.inBattle}
              onChange={(e) => dispatch({ type: 'set_in_battle', inBattle: e.target.checked })}
            />
            In battle (1d10 table)
          </label>
          <DicePad
            sides={20}
            label={`1d20 against ${threat.level}`}
            compact
            onCommit={(value) => {
              setRolling(false);
              dispatch({ type: 'threat_roll', value });
            }}
            highlight={(v) => (v === 20 ? 'good' : v <= threat.level ? 'bad' : undefined)}
          />
        </>
      ) : (
        <button type="button" className="btn-ghost" onClick={() => setRolling(true)}>
          Make a Threat roll (1d20)
        </button>
      )}

      <h3 className="subhead">Threat changes</h3>
      <ul className="gm-chips" aria-label="Threat changes">
        {THREAT_SOURCES.map((source) => (
          <li key={source.id}>
            <button
              type="button"
              className={`gm-chip${source.delta !== null && source.delta < 0 ? ' good' : source.dice ? ' good' : source.delta !== null ? ' bad' : ''}`}
              title={source.detail}
              onClick={() => {
                if (source.dice) {
                  const expr = parseDice(source.dice);
                  if (expr)
                    dispatch({ type: 'threat_source', source: source.id, amount: -rollDice(expr) });
                  return;
                }
                dispatch({ type: 'threat_source', source: source.id });
              }}
            >
              <b>
                {source.delta !== null
                  ? signed(source.delta)
                  : source.dice
                    ? `−${source.dice}`
                    : '±'}
              </b>
              {source.label}
            </button>
          </li>
        ))}
      </ul>

      <h3 className="subhead">On the board</h3>
      <div className="gm-plainrow">
        <div className="gm-stepper">
          <span className="gm-stepper-label">Wandering Monster tokens</span>
          <div className="gm-stepper-controls">
            <button
              type="button"
              className="btn-mini"
              aria-label="Remove a Wandering Monster token"
              disabled={state.wanderingMonsters === 0}
              onClick={() => dispatch({ type: 'wm_remove' })}
            >
              −
            </button>
            <span className="gm-stepper-value" aria-live="polite">
              {state.wanderingMonsters}
            </span>
            <button
              type="button"
              className="btn-mini"
              aria-label="Place a Wandering Monster token"
              onClick={() => dispatch({ type: 'wm_place' })}
            >
              +
            </button>
          </div>
        </div>
        <Stepper
          label="Encounter risk bonus"
          value={state.encounterBonus}
          step={10}
          onChange={(bonus) => dispatch({ type: 'set_encounter_bonus', bonus })}
          hint="From the Threat table, +10 at a time."
        />
      </div>
      <p className="hint">
        Wandering Monster tokens move 4 squares after the heroes act; 1d6: 1 away, 2–6 towards.{' '}
        <CiteChip cite={CITES.wanderingMonsters} />
      </p>

      <details className="gm-details">
        <summary>
          The Threat tables <CiteChip cite={CITES.threatTableNotInBattle} />
        </summary>
        {[THREAT_TABLES.notInBattle, THREAT_TABLES.inBattle].map((table) => (
          <div key={table.dice} className="gm-ref">
            <strong>
              {table.label} ({table.dice})
            </strong>
            <table className="gm-table">
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="num">{row.printed}</td>
                    <td>{row.result}</td>
                    <td className="num">{row.decrease}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </details>
      <p className="hint">{GAPS.maxLevel}</p>
    </Drawer>
  );
}

function LightDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useGm();
  const summary = lightSummary(state);
  const dark = summary.lit.length === 0;
  return (
    <Drawer title="Light" cite={CITES.lightSources} onClose={onClose}>
      <div className={`gm-status ${dark ? 'bad' : 'good'}`}>
        {dark ? (
          <>
            <strong>No light source is lit.</strong>
            <p>
              No Fear/Terror or Perception bonus from light. {GAPS.darkness}{' '}
              <CiteChip cite={CITES.nightVision} />
            </p>
          </>
        ) : (
          <>
            <strong>
              All heroes +{summary.fearTerror} on Fear and Terror tests
              {state.heroes.some((h) => h.nightVision) ? ' (Night Vision included)' : ''}.
            </strong>
            <p>
              {Object.entries(summary.perception).length > 0
                ? Object.entries(summary.perception)
                    .map(
                      ([id, bonus]) =>
                        `${heroById(state, id)?.name ?? 'Carrier'} +${bonus} Perception`,
                    )
                    .join(' · ')
                : 'Set the carrier on each light to track their Perception bonus.'}
            </p>
          </>
        )}
      </div>
      {state.lights.length > 0 && (
        <ul className="gm-lights">
          {state.lights.map((light) => (
            <li key={light.id}>
              <LightRow light={light} />
            </li>
          ))}
        </ul>
      )}
      <h3 className="subhead">Add a light source</h3>
      <AddLight />
      <h3 className="subhead">Spares</h3>
      <div className="gm-plainrow">
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
      </div>
      <details className="gm-details">
        <summary>What the book says about light</summary>
        {(Object.keys(LIGHT_RULES) as Array<keyof typeof LIGHT_RULES>).map((kind) => (
          <div key={kind} className="gm-ref">
            <strong>{LIGHT_RULES[kind].label}</strong>
            <ul className="gm-list">
              <li>
                All heroes, Night Vision included, +{LIGHT_RULES[kind].fearTerror} Fear/Terror; the
                carrier +{LIGHT_RULES[kind].perception} Perception.
              </li>
              {LIGHT_RULES[kind].notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ))}
      </details>
    </Drawer>
  );
}

function LightRow({ light }: { light: LightSource }) {
  const { state, dispatch } = useGm();
  const rules = LIGHT_RULES[light.kind];
  const [swinging, setSwinging] = useState(false);
  const living = state.heroes.filter((h) => !h.dead);
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
    <div className={`gm-lightrow${light.lit ? '' : ' out'}`}>
      <div className="gm-lightrow-main">
        <span className={`gm-flame ${light.lit ? 'on' : 'off'} ${light.kind}`} aria-hidden="true" />
        <strong>{rules.label}</strong>
        <span className="gm-tag">{status}</span>
        {light.kind !== 'torch' && !light.destroyed && (
          <span className="gm-oil" title={`${light.oilHalves} of 2 oil halves left`}>
            oil {'●'.repeat(light.oilHalves)}
            {'○'.repeat(Math.max(0, 2 - light.oilHalves))}
          </span>
        )}
        <select
          aria-label="Carrier"
          value={light.carrierId ?? ''}
          onChange={(e) =>
            dispatch({ type: 'light_carrier', id: light.id, carrierId: e.target.value || null })
          }
        >
          <option value="">Nobody</option>
          {living.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>
      <div className="gm-actions">
        {light.lit ? (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => dispatch({ type: 'light_set_lit', id: light.id, lit: false })}
          >
            Goes out
          </button>
        ) : light.destroyed ? null : light.spent ||
          (light.kind !== 'torch' && light.oilHalves <= 0) ? (
          <button
            type="button"
            className="btn-primary"
            disabled={(light.kind === 'torch' ? state.spares.torches : state.spares.lampOil) < 1}
            onClick={() => dispatch({ type: 'light_relight', id: light.id })}
          >
            {light.kind === 'torch' ? 'Light a new torch' : 'Refill'}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={() => dispatch({ type: 'light_set_lit', id: light.id, lit: true })}
          >
            Light it
          </button>
        )}
        {light.kind === 'torch' && light.lit && (
          <button
            type="button"
            className="btn-ghost"
            aria-expanded={swinging}
            onClick={() => setSwinging((v) => !v)}
          >
            Swung at an enemy
          </button>
        )}
        {light.kind !== 'torch' && light.lit && light.oilHalves < 2 && (
          <button
            type="button"
            className="btn-ghost"
            disabled={state.spares.lampOil < 1}
            onClick={() => dispatch({ type: 'light_refill', id: light.id })}
          >
            Top up
          </button>
        )}
        <button
          type="button"
          className="link"
          onClick={() => dispatch({ type: 'light_remove', id: light.id })}
        >
          Remove
        </button>
      </div>
      {swinging && (
        <DicePad
          sides={100}
          label="Unmodified attack roll (90 or more puts it out)"
          compact
          onCommit={(roll) => {
            setSwinging(false);
            dispatch({ type: 'light_attack_roll', id: light.id, roll });
          }}
          highlight={(v) => (v >= 90 ? 'bad' : undefined)}
        />
      )}
    </div>
  );
}

function MoraleDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useGm();
  const { morale } = state;
  const wavering = isWavering(state);
  const half = Math.floor(morale.start / 2);
  const [override, setOverride] = useState('');
  return (
    <Drawer title="Party Morale" cite={CITES.partyMorale} onClose={onClose}>
      <div className="gm-big-row">
        <span className="gm-big">{morale.current}</span>
        <span className="gm-big-label">
          started at {morale.start}
          <br />
          {morale.start === 0 ? (
            'Add heroes with their RES to compute the start value.'
          ) : morale.current === 0 ? (
            <span className="bad">
              0: the party flees the dungeon as soon as it is not locked in combat.{' '}
              <CiteChip cite={CITES.moraleFlee} />
            </span>
          ) : wavering ? (
            <span className="bad">
              Wavering: all heroes −20 RES until morale is back to {half}.{' '}
              <CiteChip cite={CITES.moraleWavering} />
            </span>
          ) : (
            `Steady. Wavers below ${half}.`
          )}
        </span>
        <span className="gm-row-actions">
          <button
            type="button"
            className="btn-mini"
            aria-label="Lower morale by 1"
            disabled={morale.current <= 0}
            onClick={() =>
              dispatch({ type: 'morale_adjust', delta: -1, reason: 'set by the Game Master' })
            }
          >
            −
          </button>
          <button
            type="button"
            className="btn-mini"
            aria-label="Raise morale by 1"
            onClick={() =>
              dispatch({ type: 'morale_adjust', delta: 1, reason: 'set by the Game Master' })
            }
          >
            +
          </button>
        </span>
      </div>

      <h3 className="subhead">Start value</h3>
      <p className="hint">
        Each hero’s RES ÷ 10 rounded down, summed <CiteChip cite={CITES.moraleCalculation} />, plus:
      </p>
      <label className="gm-check">
        <input
          type="checkbox"
          checked={morale.naturalLeader}
          onChange={(e) => dispatch({ type: 'set_morale', naturalLeader: e.target.checked })}
        />
        Natural Leader in the party (+{MORALE.naturalLeader}, not cumulative){' '}
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
          dispatch({
            type: 'set_morale',
            startOverride: override.trim() === '' ? null : Math.max(0, Math.round(n)),
          });
          setOverride('');
        }}
      >
        <div className="gm-field narrow">
          <label htmlFor="gm-morale-start">Override the start</label>
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
        <button type="submit" className="btn-ghost">
          {override.trim() === '' ? 'Use the computed value' : 'Set'}
        </button>
      </form>

      <details className="gm-details">
        <summary>The Party Morale table</summary>
        <table className="gm-table">
          <tbody>
            {MORALE_EVENTS.map((row) => (
              <tr key={row.id}>
                <td>{row.situation}</td>
                <td className="num">
                  {row.id === 'short_rest' ? `+${MORALE.restBonus}*` : signed(row.effect)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">
          * The table prints +1 for a short rest; the rest checklist on p. 98 gives +
          {MORALE.restBonus} up to the start value, which the corpus follows.{' '}
          <CiteChip cite={CITES.rest} />
        </p>
      </details>
      <details className="gm-details">
        <summary>
          The Sanity table <CiteChip cite={CITES.sanity} />
        </summary>
        <table className="gm-table">
          <tbody>
            {SANITY_LOSSES.map((row) => (
              <tr key={row.id}>
                <td>{row.situation}</td>
                <td className="num">{row.printed}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">{SANITY.miscastRuling}</p>
      </details>
    </Drawer>
  );
}

function PartyDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch, openDrawer } = useGm();
  return (
    <Drawer title="Party and supplies" cite={CITES.sanity} onClose={onClose}>
      <AddHero autoFocus />
      {state.heroes.length > 0 && (
        <ul className="gm-plain">
          {state.heroes.map((hero) => (
            <li key={hero.id}>
              <button
                type="button"
                className="link strong"
                onClick={() => openDrawer({ kind: 'hero', heroId: hero.id })}
              >
                {hero.name}
              </button>
              <span className="muted">
                RES {hero.resolve} · Sanity {hero.sanity}/{hero.sanityMax}
                {hero.dead ? ' · dead' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      <h3 className="subhead">Supplies</h3>
      <div className="gm-plainrow">
        <Stepper
          label="Rations"
          value={state.rations}
          onChange={(rations) => dispatch({ type: 'set_rations', rations })}
          hint="A short rest costs one."
        />
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
      </div>
      <p className="hint">
        {state.restsTaken} rest{state.restsTaken === 1 ? '' : 's'} taken this dungeon.{' '}
        <CiteChip cite={CITES.rest} />
      </p>
      <button type="button" className="link" onClick={() => openDrawer({ kind: 'quest' })}>
        Change the quest
      </button>
    </Drawer>
  );
}

function HeroDrawer({ heroId, onClose }: { heroId: string; onClose: () => void }) {
  const { state, dispatch } = useGm();
  const hero = heroById(state, heroId);
  if (!hero)
    return (
      <Drawer title="Hero" onClose={onClose}>
        <p className="hint">This hero has left the party.</p>
      </Drawer>
    );
  return (
    <Drawer title={hero.name} cite={CITES.sanity} onClose={onClose}>
      <EditHero hero={hero} />
      <h3 className="subhead">Sanity</h3>
      <div className="gm-big-row">
        <span className="gm-big">{hero.sanity}</span>
        <span className="gm-big-label">
          of {hero.sanityMax}
          {hero.sanityMax < SANITY.start
            ? ` (8 minus ${hero.conditions.length} condition${hero.conditions.length === 1 ? '' : 's'})`
            : ''}
          <br />
          At 0 a mental condition is rolled.
          {!hero.dead &&
            hero.sanity === 0 &&
            !state.pending.some(
              (p) => p.request.kind === 'sanity_condition' && p.request.heroId === hero.id,
            ) && (
              <>
                {' '}
                <button
                  type="button"
                  className="link"
                  onClick={() => dispatch({ type: 'sanity_condition_request', heroId: hero.id })}
                >
                  Roll the mental condition
                </button>
              </>
            )}
        </span>
        <span className="gm-row-actions">
          <button
            type="button"
            className="btn-mini"
            aria-label="Loses 1 Sanity"
            disabled={hero.dead || hero.sanity === 0}
            onClick={() =>
              dispatch({ type: 'sanity_loss', heroId: hero.id, amount: 1, reason: 'event' })
            }
          >
            −
          </button>
          <button
            type="button"
            className="btn-mini"
            aria-label="Regains 1 Sanity"
            disabled={hero.dead || hero.sanity >= hero.sanityMax}
            onClick={() =>
              dispatch({ type: 'hero_update', id: hero.id, patch: { sanity: hero.sanity + 1 } })
            }
          >
            +
          </button>
        </span>
      </div>
      {hero.conditions.length > 0 && (
        <ul className="gm-plain">
          {hero.conditions.map((id) => {
            const condition = MENTAL_CONDITIONS.find((c) => c.id === id)!;
            return (
              <li key={id} className="column">
                <span>
                  <strong>{condition.name}</strong>{' '}
                  <CiteChip cite={CITES.mentalConditions} quote={condition.effect} />
                  <button
                    type="button"
                    className="link"
                    aria-label={`Remove ${condition.name}`}
                    onClick={() =>
                      dispatch({ type: 'hero_condition_remove', id: hero.id, condition: id })
                    }
                  >
                    cured
                  </button>
                </span>
                <span className="muted">{condition.effect}</span>
                {id === 'lingering_trauma' && (
                  <span className="muted">
                    Trigger (1d6, next dungeon):{' '}
                    {LINGERING_TRAUMA.map((t) => `${t.printed} ${t.trigger}`).join(' ')}{' '}
                    <CiteChip cite={CITES.lingeringTrauma} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!hero.dead && (
        <>
          <h3 className="subhead">Status</h3>
          <div className="gm-chips">
            {(Object.keys(HERO_STATUSES) as HeroStatus[]).map((status) => {
              const on = hero.statuses.includes(status);
              return (
                <label
                  key={status}
                  className={`gm-toggle${on ? ' on' : ''}`}
                  title={HERO_STATUSES[status].reminder}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) =>
                      dispatch({ type: 'hero_status', id: hero.id, status, on: e.target.checked })
                    }
                  />
                  {HERO_STATUSES[status].label}
                </label>
              );
            })}
            <button
              type="button"
              className="gm-chip bad"
              onClick={() => dispatch({ type: 'hero_head_wound', id: hero.id })}
            >
              <b>−1</b> Wound to the head
            </button>
          </div>
          {hero.statuses.length > 0 && (
            <ul className="gm-list">
              {hero.statuses.map((status) => (
                <li key={status}>
                  {HERO_STATUSES[status].reminder} <CiteChip cite={HERO_STATUSES[status].cite} />
                </li>
              ))}
            </ul>
          )}
          <p className="hint">
            0 HP, death, Fear and Terror, poison and disease go in through “What happened?”, so
            morale and Sanity follow.
          </p>
        </>
      )}
      <button
        type="button"
        className="link"
        onClick={() => dispatch({ type: 'hero_remove', id: hero.id })}
      >
        Remove {hero.name} from the party
      </button>
    </Drawer>
  );
}

function EditHero({ hero }: { hero: Hero }) {
  const { dispatch } = useGm();
  const [name, setName] = useState(hero.name);
  const [resolve, setResolve] = useState(String(hero.resolve));
  const changed = name.trim() !== hero.name || Number(resolve) !== hero.resolve;
  return (
    <form
      className="gm-form"
      onSubmit={(e) => {
        e.preventDefault();
        const res = Number(resolve);
        dispatch({
          type: 'hero_update',
          id: hero.id,
          patch: {
            name: name.trim() || hero.name,
            ...(Number.isInteger(res) && res >= 0 ? { resolve: res } : {}),
          },
        });
      }}
    >
      <div className="gm-field grow">
        <label htmlFor={`gm-edit-name-${hero.id}`}>Name</label>
        <input
          id={`gm-edit-name-${hero.id}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="gm-field narrow">
        <label htmlFor={`gm-edit-res-${hero.id}`}>RES</label>
        <input
          id={`gm-edit-res-${hero.id}`}
          type="number"
          inputMode="numeric"
          min={0}
          value={resolve}
          onChange={(e) => setResolve(e.target.value)}
        />
      </div>
      <label className="gm-check">
        <input
          type="checkbox"
          checked={hero.nightVision}
          onChange={(e) =>
            dispatch({ type: 'hero_update', id: hero.id, patch: { nightVision: e.target.checked } })
          }
        />
        Night Vision
      </label>
      <button type="submit" className="btn-ghost" disabled={!changed}>
        Save
      </button>
    </form>
  );
}

function QuestDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useGm();
  return (
    <Drawer title="Quest" cite={CITES.questThresholds} onClose={onClose}>
      <QuestPicker />
      <h3 className="subhead">Dungeon level {state.dungeonLevel}</h3>
      <p className="hint">
        {GAPS.newLevelValue} <CiteChip cite={CITES.threatNewLevel} />
      </p>
      <button type="button" className="btn-ghost" onClick={() => dispatch({ type: 'new_level' })}>
        The party takes the stairs: level {state.dungeonLevel + 1}
      </button>
    </Drawer>
  );
}

const KIND_LABEL: Record<LogKind, string> = {
  turn: 'Turn',
  threat: 'Threat',
  light: 'Light',
  morale: 'Morale',
  sanity: 'Sanity',
  hero: 'Hero',
  battle: 'Battle',
  rest: 'Rest',
  explore: 'Explore',
  info: 'Note',
  warn: 'Check',
};

export function LogLine({ entry }: { entry: LogEntry }) {
  return (
    <>
      <span className={`gm-log-kind ${entry.kind}`}>{KIND_LABEL[entry.kind]}</span>
      <span className="gm-log-text">
        {entry.text}
        {entry.cite && (
          <>
            {' '}
            <CiteChip cite={entry.cite} />
          </>
        )}
      </span>
    </>
  );
}

function LogDrawer({ onClose }: { onClose: () => void }) {
  const { state } = useGm();
  const entries = [...state.log].reverse();
  return (
    <Drawer
      title={`Log · ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`}
      onClose={onClose}
      wide
    >
      {entries.length === 0 ? (
        <p className="hint">Nothing yet.</p>
      ) : (
        <ol className="gm-log">
          {entries.map((entry, i) => {
            const previous = entries[i - 1];
            const turnBreak = !previous || previous.turn !== entry.turn;
            return (
              <Fragment key={entry.id}>
                {turnBreak && (
                  <li className="gm-log-turn">
                    {entry.turn === 0 ? 'Setup' : `Turn ${entry.turn}`}
                  </li>
                )}
                <li className={`gm-log-entry ${entry.kind}`}>
                  <LogLine entry={entry} />
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}
    </Drawer>
  );
}

export type { DrawerId };
