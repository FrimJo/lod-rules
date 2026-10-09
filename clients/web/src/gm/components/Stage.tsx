import { useId, useState, type ReactNode } from 'react';
import { parseDice, rollDice, rollDie } from '../dice.ts';
import {
  ambushRisk,
  treasureDraws,
  encounterChance,
  heroById,
  initiativeBag,
  isWavering,
  lightSummary,
  modeOf,
  type ChestRoll,
  type InitiativeBagInput,
  type Prompt,
} from '../engine.ts';
import {
  CHEST_TABLES,
  CITES,
  COMBAT_ROUND,
  DOOR,
  ENCOUNTER,
  ENEMY_PRIORITY,
  LIGHT_RULES,
  MENTAL_CONDITIONS,
  MORALE_EVENTS,
  REST,
  SEARCH,
  THREAT,
  THREAT_SOURCES,
  THIEF_TREASURE,
  TURN_SEQUENCE,
  threatTableFor,
  type ChestTable,
  type ChestTableRow,
} from '../rules.ts';
import { CiteChip, HeroPicker, STEP_SHORT, Stepper, useGm, useHeroChoice } from './common.tsx';
import { DicePad, DoorDice } from './DicePad.tsx';
import { Prepare } from './Prepare.tsx';

/**
 * The stage shows one thing: the question the table needs answered now. Pending follow-ups
 * come first, oldest on top with the rest queued beneath; when nothing is pending, the card
 * for the current step of the turn takes the stage with the actions that belong to it.
 */
export function Stage() {
  const { state } = useGm();
  const [focusId, setFocusId] = useState<string | null>(null);
  if (modeOf(state) === 'prepare') return <Prepare />;
  const focus = state.pending.find((p) => p.id === focusId) ?? state.pending[0];
  const queue = state.pending.filter((p) => p.id !== focus?.id);
  return (
    <div className="gm-stage-inner">
      {focus ? <PromptCard prompt={focus} /> : <StepCard />}
      {queue.length > 0 && (
        <ol className="gm-queue" aria-label="Also waiting">
          {queue.map((prompt) => (
            <li key={prompt.id}>
              <button
                type="button"
                className={`gm-queue-item ${prompt.severity}`}
                onClick={() => setFocusId(prompt.id)}
              >
                <span className="gm-queue-dot" aria-hidden="true" />
                {prompt.title}
              </button>
            </li>
          ))}
        </ol>
      )}
      {focus && <StepCard muted />}
    </div>
  );
}

function Card({
  kicker,
  title,
  cite,
  tone,
  children,
  actions,
  muted = false,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  cite?: Prompt['cite'];
  tone?: Prompt['severity'];
  children?: ReactNode;
  actions?: ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={`card${tone ? ` ${tone}` : ''}${muted ? ' muted' : ''}`}>
      <header className="card-head">
        <div>
          {kicker && <span className="card-kicker">{kicker}</span>}
          <h2 className="card-title">
            {title}
            {cite && <CiteChip cite={cite} />}
          </h2>
        </div>
        {actions && <div className="gm-card-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

function PromptCard({ prompt }: { prompt: Prompt }) {
  const { dispatch } = useGm();
  const dismiss = () => dispatch({ type: 'dismiss_prompt', id: prompt.id });
  const confirm =
    prompt.request.kind === 'confirm' ||
    (prompt.request.kind === 'chest' && prompt.request.rolled !== null);
  return (
    <Card
      kicker="Resolve now"
      title={prompt.title}
      cite={prompt.cite}
      tone={prompt.severity}
      actions={
        <button type="button" className={confirm ? 'btn-primary' : 'btn-ghost'} onClick={dismiss}>
          {confirm ? 'Done' : 'Dismiss'}
        </button>
      }
    >
      {prompt.detail && <p className="gm-card-text">{prompt.detail}</p>}
      <PromptBody prompt={prompt} />
    </Card>
  );
}

function PromptBody({ prompt }: { prompt: Prompt }) {
  const { state, dispatch } = useGm();
  const request = prompt.request;
  switch (request.kind) {
    case 'scenario_roll':
      return (
        <DicePad
          sides={10}
          label="Scenario die"
          onCommit={(value) => dispatch({ type: 'scenario_roll', value })}
          highlight={(v) => (v + state.scenarioBonus >= state.scenarioTrigger ? 'bad' : undefined)}
          hint={`Marked faces call for a Threat roll${state.scenarioBonus ? ` (with the +${state.scenarioBonus})` : ''}.`}
        />
      );
    case 'threat_roll':
      return (
        <>
          <label className="gm-check">
            <input
              type="checkbox"
              checked={state.inBattle}
              onChange={(e) => dispatch({ type: 'set_in_battle', inBattle: e.target.checked })}
            />
            The party is in battle (the 1d10 table applies)
          </label>
          <DicePad
            sides={20}
            label={`Threat roll against ${state.threat.level}`}
            onCommit={(value) => dispatch({ type: 'threat_roll', value })}
            highlight={(v) => (v === 20 ? 'good' : v <= state.threat.level ? 'bad' : undefined)}
            hint={`Marked: at or below ${state.threat.level} something bad happens; 20 lowers Threat by 5. Below ${state.threat.level}, lit torches and lanterns burn.`}
          />
        </>
      );
    case 'threat_table': {
      const table = threatTableFor(request.inBattle);
      return (
        <>
          <ol className="gm-rows" aria-label={`${table.label} table`}>
            {table.rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="gm-row"
                  onClick={() => dispatch({ type: 'threat_table_roll', value: row.roll.min })}
                >
                  <span className="gm-row-roll">{row.printed}</span>
                  <span className="gm-row-text">
                    <strong>{row.short}</strong>
                    <span>{row.result}</span>
                  </span>
                  <span className="gm-row-delta">{row.decrease}</span>
                </button>
              </li>
            ))}
          </ol>
          <DicePad
            sides={table.sides}
            label={`Or tap the ${table.dice} result`}
            compact
            onCommit={(value) => dispatch({ type: 'threat_table_roll', value })}
          />
        </>
      );
    }
    case 'threat_amount':
      return <ThreatAmountForm source={request.source} />;
    case 'threat_start':
      return (
        <DicePad
          dice={request.dice}
          label={`Start Threat (${request.dice})`}
          onCommit={(value) =>
            dispatch({ type: 'set_threat', level: value, reason: `rolled ${request.dice}` })
          }
        />
      );
    case 'sanity_condition': {
      const hero = heroById(state, request.heroId);
      if (!hero) return <p className="hint">This hero has left the party.</p>;
      return (
        <>
          <ol className="gm-rows" aria-label="Mental conditions table">
            {MENTAL_CONDITIONS.map((c) => {
              const has = hero.conditions.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`gm-row${has ? ' had' : ''}`}
                    title={has ? 'Already diagnosed: roll again' : c.effect}
                    onClick={() =>
                      dispatch({
                        type: 'sanity_condition_roll',
                        heroId: hero.id,
                        value: c.roll.min,
                      })
                    }
                  >
                    <span className="gm-row-roll">{c.printed}</span>
                    <span className="gm-row-text">
                      <strong>{c.name}</strong>
                      <span>{c.effect}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <DicePad
            sides={10}
            label="Or tap the 1d10 result"
            compact
            onCommit={(value) =>
              dispatch({ type: 'sanity_condition_roll', heroId: hero.id, value })
            }
          />
        </>
      );
    }
    case 'rest_resolve':
      return <RestForm risk={request.risk} />;
    case 'wandering_monster':
      return (
        <div className="gm-actions">
          {request.crossed ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => dispatch({ type: 'wm_place' })}
            >
              Place a Wandering Monster token
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => dispatch({ type: 'dismiss_prompt', id: prompt.id })}
            >
              Token placed
            </button>
          )}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              // The table already counted the token for a landed threshold; "no monster" takes it back.
              if (!request.crossed) dispatch({ type: 'wm_remove' });
              dispatch({ type: 'dismiss_prompt', id: prompt.id });
            }}
          >
            No monster
          </button>
        </div>
      );
    case 'battle_start':
      return <BattleStartForm reason={request.reason} barred={request.barred === true} />;
    case 'light_relight': {
      const light = state.lights.find((l) => l.id === request.lightId);
      if (!light) return null;
      const torch = light.kind === 'torch';
      const spares = torch ? state.spares.torches : state.spares.lampOil;
      return (
        <div className="gm-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={spares < 1}
            onClick={() => dispatch({ type: 'light_relight', id: light.id })}
          >
            {torch
              ? 'Light a new torch'
              : `Refill the ${LIGHT_RULES[light.kind].label.toLowerCase()}`}
            {spares < 1 ? ' (none left)' : ''}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => dispatch({ type: 'light_remove', id: light.id })}
          >
            Remove it
          </button>
        </div>
      );
    }
    case 'door':
      return <DoorCard chest={request.chest} rolled={request.rolled} />;
    case 'chest':
      return <ChestCard rolled={request.rolled} />;
    case 'trap':
      return <TrapForm source={request.source} />;
    case 'bleeding':
      return <BleedingForm heroIds={request.heroIds} context={request.context} />;
    case 'confirm':
      return null;
  }
}

function DoorCard({
  chest,
  rolled,
}: {
  chest: boolean;
  rolled: {
    d10: number;
    d6: number;
    trapped: boolean;
    locked: boolean;
    difficulty: string | null;
  } | null;
}) {
  const { state, dispatch } = useGm();
  return (
    <div className="gm-checklist">
      <div className="gm-check-step done">
        <span className="gm-check-n">1</span>
        <span>
          {state.threat.enabled
            ? 'Threat +1 applied.'
            : 'Threat +1 (this quest uses no Threat Level, so nothing changed).'}
        </span>
      </div>
      <div className={`gm-check-step${rolled ? ' done' : ' current'}`}>
        <span className="gm-check-n">2</span>
        {rolled ? (
          <span>
            d6 {rolled.d6}
            {rolled.trapped ? <strong className="bad"> trapped</strong> : ' no trap'} · d10{' '}
            {rolled.d10 === 10 ? '0' : rolled.d10}
            {rolled.locked ? (
              <>
                <strong className="bad"> locked</strong> ({rolled.difficulty}){' '}
                <CiteChip
                  cite={CITES.lockedDoor}
                  quote={`Force: 1 AP, +${DOOR.forceThreat} Threat each attempt. Crowbar: +${DOOR.crowbarThreat} Threat, ${DOOR.crowbarDamage} damage per turn. Pick: ${DOOR.pickActions} AP, no Threat; a failed pick breaks, a fumble jams the lock.`}
                />
              </>
            ) : (
              ' open'
            )}
            {rolled.trapped && (
              <>
                {' '}
                <CiteChip
                  cite={CITES.traps}
                  quote="The opener makes a Perception roll with the card's modifier. Success finds the trap without setting it off; it can then be disarmed (2 AP, Pick Locks) or set off deliberately. Failure triggers it."
                />
                <span className="hint inline"> The trap is resolved from the queue below.</span>
              </>
            )}
          </span>
        ) : (
          <DoorDice onCommit={(d10, d6) => dispatch({ type: 'door_roll', d10, d6 })} />
        )}
      </div>
      {rolled && rolled.locked && (
        <div className="gm-check-step current">
          <span className="gm-check-n">→</span>
          <span className="gm-actions inline">
            <span>Getting past the lock:</span>
            <button
              type="button"
              className="gm-chip bad"
              onClick={() => dispatch({ type: 'threat_source', source: 'force_lock' })}
            >
              <b>+{DOOR.forceThreat}</b> Forced (each attempt)
            </button>
            <button
              type="button"
              className="gm-chip bad"
              onClick={() => dispatch({ type: 'threat_source', source: 'crowbar' })}
            >
              <b>+{DOOR.crowbarThreat}</b> Crowbar
            </button>
            <span className="hint inline">Picking the lock adds no Threat.</span>
          </span>
        </div>
      )}
      {rolled && !chest && (
        <div className="gm-check-step current">
          <span className="gm-check-n">3</span>
          <div className="gm-check-body">
            <span>Flip the top Exploration Card, place the tile, then roll for enemies.</span>
            <NextTile />
          </div>
        </div>
      )}
    </div>
  );
}

function chestMorale(row: ChestTableRow): number {
  const effect = (id: string) => MORALE_EVENTS.find((m) => m.id === id)?.effect ?? 0;
  return row.fine * effect('fine_treasure') + row.wonderful * effect('wonderful_treasure');
}

/** The chest's 1d10: the table is on screen, the roll lights its row and names the cards to draw. */
function ChestCard({ rolled }: { rolled: ChestRoll | null }) {
  const { dispatch } = useGm();
  const [choice, setChoice] = useState<ChestTable['id']>('chest');
  const name = useId();
  const table = CHEST_TABLES[rolled?.table ?? choice];
  const hit = rolled ? table.rows.find((row) => row.id === rolled.rowId) : undefined;
  const draws = hit ? treasureDraws(hit) : null;
  return (
    <div className="gm-form column">
      {!rolled && (
        <div className="gm-segment" role="radiogroup" aria-label="Which chest table">
          {Object.values(CHEST_TABLES).map((option) => (
            <label
              key={option.id}
              className={`gm-segment-option${choice === option.id ? ' on' : ''}`}
            >
              <input
                type="radio"
                name={name}
                checked={choice === option.id}
                onChange={() => setChoice(option.id)}
              />
              {option.title}
            </label>
          ))}
        </div>
      )}
      <ol className="gm-rows" aria-label={`${table.title} table`}>
        {table.rows.map((row) => {
          const morale = chestMorale(row);
          return (
            <li key={row.id}>
              <div
                className={`gm-row${hit ? (hit.id === row.id ? ' hit' : ' had') : ''}`}
                aria-current={hit?.id === row.id ? 'true' : undefined}
              >
                <span className="gm-row-roll">{row.printed}</span>
                <span className="gm-row-text">
                  <strong>{row.result}</strong>
                </span>
                {morale > 0 && <span className="gm-row-delta">+{morale} morale</span>}
              </div>
            </li>
          );
        })}
      </ol>
      {rolled && hit ? (
        <p className="gm-card-text">
          d10 {rolled.d10 === 10 ? '0' : rolled.d10}:{' '}
          {draws ? (
            <>
              draw <strong>{draws}</strong>. Party Morale +{chestMorale(hit)} applied.{' '}
              <span className="hint inline">A thief draws two cards and keeps one.</span>{' '}
              <CiteChip cite={CITES.thiefTreasure} quote={THIEF_TREASURE} />
            </>
          ) : (
            'the chest is empty.'
          )}
        </p>
      ) : (
        <DicePad
          sides={10}
          label={`d10 · ${table.title} table`}
          onCommit={(d10) => dispatch({ type: 'chest_roll', table: table.id, d10 })}
        />
      )}
    </div>
  );
}

function TrapForm({ source }: { source: 'threat_table' | 'door' | 'chest' }) {
  const { dispatch } = useGm();
  const [heroId, setHeroId] = useHeroChoice();
  const random = source === 'threat_table';
  return (
    <div className="gm-form column">
      <HeroPicker
        value={heroId}
        onChange={setHeroId}
        random={random}
        label={random ? 'Randomise who sprang it' : 'The hero opening it'}
      />
      <div className="gm-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={!heroId}
          onClick={() => dispatch({ type: 'trap_resolve', heroId, triggered: true })}
        >
          Trap went off: −1 morale, −2 Sanity
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => dispatch({ type: 'trap_resolve', heroId, triggered: false })}
        >
          Perception passed: not triggered
        </button>
      </div>
    </div>
  );
}

function BleedingForm({ heroIds, context }: { heroIds: string[]; context: 'battle' | 'rest' }) {
  const { state, dispatch } = useGm();
  const heroes = heroIds.map((id) => heroById(state, id)).filter((h) => h !== undefined);
  return (
    <ul className="gm-plain">
      {heroes.map((hero) => (
        <li key={hero.id}>
          <strong>{hero.name}</strong>
          <span className="gm-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => dispatch({ type: 'hero_recover', id: hero.id })}
            >
              {context === 'rest' ? 'Passed the test: back up (+1d4 HP)' : 'Bandaged: back up'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                dispatch({ type: 'morale_event', event: 'hero_dies', heroId: hero.id })
              }
            >
              Died
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

function ThreatAmountForm({ source }: { source: (typeof THREAT_SOURCES)[number]['id'] }) {
  const { dispatch } = useGm();
  const [amount, setAmount] = useState('');
  const info = THREAT_SOURCES.find((s) => s.id === source);
  const n = Number(amount);
  const valid = amount.trim() !== '' && Number.isInteger(n) && n !== 0;
  return (
    <form
      className="gm-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) dispatch({ type: 'threat_source', source, amount: n });
      }}
    >
      <div className="gm-field narrow">
        <label htmlFor={`gm-amount-${source}`}>Threat change (negative lowers)</label>
        <input
          id={`gm-amount-${source}`}
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary" disabled={!valid}>
        Apply
      </button>
      {info?.dice && (
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            const expr = parseDice(info.dice!);
            if (expr) dispatch({ type: 'threat_source', source, amount: -rollDice(expr) });
          }}
        >
          Roll {info.dice} for me
        </button>
      )}
    </form>
  );
}

function RestForm({ risk }: { risk: number }) {
  const { state, dispatch } = useGm();
  const [interrupted, setInterrupted] = useState(false);
  const [barred, setBarred] = useState(false);
  const name = useId();
  const threatOn = state.threat.enabled;
  return (
    <div className="gm-form column">
      <ol className="gm-list">
        <li>Move each Wandering Monster token {REST.wanderingMoves} times.</li>
        <li>
          Not interrupted: Party Morale +2 (up to the start value), each hero +{REST.hitPoints} HP,
          lost Energy back on 1–3, Mana refilled, potions may be brewed.
        </li>
        <li>Then roll 1d100 for an ambush.</li>
      </ol>
      <div className="gm-segment" role="radiogroup" aria-label="Was the rest interrupted?">
        <label className={`gm-segment-option${!interrupted ? ' on' : ''}`}>
          <input
            type="radio"
            name={name}
            checked={!interrupted}
            onChange={() => setInterrupted(false)}
          />
          Not interrupted
        </label>
        <label className={`gm-segment-option${interrupted ? ' on' : ''}`}>
          <input
            type="radio"
            name={name}
            checked={interrupted}
            onChange={() => setInterrupted(true)}
          />
          A Wandering Monster spotted the party
        </label>
      </div>
      {interrupted ? (
        <button
          type="button"
          className="btn-primary"
          onClick={() => dispatch({ type: 'rest_resolve', interrupted: true, barred })}
        >
          Interrupted: to battle
        </button>
      ) : (
        <>
          <label className="gm-check">
            <input type="checkbox" checked={barred} onChange={(e) => setBarred(e.target.checked)} />
            The door was barred (iron wedges or Seal Door)
          </label>
          <DicePad
            sides={100}
            label={
              threatOn
                ? `Ambush roll: ambushed on ${risk} or less`
                : 'Ambush roll: the book’s risk is 5 + Threat, and this quest has no Threat Level; decide the chance yourself'
            }
            onCommit={(ambushRoll) =>
              dispatch({ type: 'rest_resolve', interrupted: false, ambushRoll, barred })
            }
            highlight={threatOn ? (v) => (v <= risk ? 'bad' : undefined) : undefined}
          />
        </>
      )}
    </div>
  );
}

function BattleStartForm({ reason, barred }: { reason: string; barred: boolean }) {
  const { state, dispatch } = useGm();
  const [input, setInput] = useState<InitiativeBagInput>({
    enemies: 1,
    named: 0,
    bashedDoor: false,
    restAmbush: /ambush/i.test(reason) && !barred,
    perfectHearing: 'none',
    overwatch: 0,
  });
  const bag = initiativeBag(state, input);
  const set = (patch: Partial<InitiativeBagInput>) => setInput((v) => ({ ...v, ...patch }));
  return (
    <div className="gm-form column">
      {barred && (
        <p className="gm-card-text">
          The door was barred: all heroes start standing and the enemies get only their normal
          tokens.
        </p>
      )}
      <div className="gm-bag">
        <div className="gm-bag-inputs">
          <Stepper
            label="Enemies on the table"
            value={input.enemies}
            min={0}
            onChange={(enemies) => set({ enemies })}
          />
          <Stepper
            label="Named monsters"
            value={input.named ?? 0}
            min={0}
            onChange={(named) => set({ named })}
          />
          <Stepper
            label="Heroes on Overwatch"
            value={input.overwatch ?? 0}
            min={0}
            onChange={(overwatch) => set({ overwatch })}
          />
          <label className="gm-check">
            <input
              type="checkbox"
              checked={input.bashedDoor ?? false}
              onChange={(e) => set({ bashedDoor: e.target.checked })}
            />
            The door was bashed down (+2 enemy tokens)
          </label>
          <label className="gm-check">
            <input
              type="checkbox"
              checked={input.restAmbush ?? false}
              onChange={(e) => set({ restAmbush: e.target.checked })}
            />
            Ambush during a rest, door not barred (+3 enemy tokens)
          </label>
          <div className="gm-field">
            <label htmlFor="gm-hearing">Perfect Hearing</label>
            <select
              id="gm-hearing"
              value={input.perfectHearing ?? 'none'}
              onChange={(e) =>
                set({ perfectHearing: e.target.value as InitiativeBagInput['perfectHearing'] })
              }
            >
              <option value="none">Nobody</option>
              <option value="heroes">A hero (+1 hero token)</option>
              <option value="enemies">The enemies (+1 enemy token)</option>
              <option value="both">Both sides (no extra token)</option>
            </select>
          </div>
        </div>
        <div className="gm-bag-result">
          <span className="gm-bag-count">
            <b>{bag.heroTokens}</b> hero
          </span>
          <span className="gm-bag-count enemy">
            <b>{bag.enemyTokens}</b> enemy
          </span>
          <span className="hint">
            tokens in the bag <CiteChip cite={CITES.initiativeTokens} />
          </span>
        </div>
      </div>
      <div className="gm-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => dispatch({ type: 'battle_start', demons: false, bag: input })}
        >
          Battle begins
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => dispatch({ type: 'battle_start', demons: true, bag: input })}
        >
          Battle begins against demons (−2 morale, −1 Sanity each)
        </button>
      </div>
    </div>
  );
}

/** The enemy roll for a newly placed tile: pick room or corridor, read the chance, roll. */
export function NextTile() {
  const { state, dispatch } = useGm();
  const [kind, setKind] = useState<'room' | 'corridor'>('room');
  const [manual, setManual] = useState(false);
  const name = useId();
  const chance = encounterChance(kind, state.encounterStreak, state.encounterBonus);
  const streak = state.encounterStreak >= ENCOUNTER.streakTiles;
  const last = state.lastTile;
  return (
    <div className="gm-nexttile">
      <div className="gm-tile-row">
        <div className="gm-segment" role="radiogroup" aria-label="Tile type">
          {(['room', 'corridor'] as const).map((option) => (
            <label key={option} className={`gm-segment-option${kind === option ? ' on' : ''}`}>
              <input
                type="radio"
                name={name}
                value={option}
                checked={kind === option}
                onChange={() => setKind(option)}
              />
              {option === 'room' ? 'Room' : 'Corridor'}
              <span className="gm-segment-chance">
                {encounterChance(option, state.encounterStreak, state.encounterBonus)}%
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => dispatch({ type: 'tile_revealed', kind, roll: rollDie(100) })}
          title={`Rolls 1d100: ${chance} or less means enemies`}
        >
          Roll for enemies
        </button>
        <button
          type="button"
          className="link"
          aria-expanded={manual}
          onClick={() => setManual((v) => !v)}
        >
          {manual ? 'Hide my roll' : 'Enter my roll'}
        </button>
        <CiteChip
          cite={CITES.encounters}
          quote={`A room has a 50% chance of enemies (01-50). A corridor has a 30% chance (01-30). After 4 tiles without encounters +10 until one is triggered (max 70%).${state.encounterBonus ? ` Threat table: +${state.encounterBonus} for the rest of the quest.` : ''}`}
        />
      </div>
      <span className="hint">
        {state.encounterStreak} encounter-free tile{state.encounterStreak === 1 ? '' : 's'} in a row
        {streak ? ` (+${ENCOUNTER.streakBonus})` : ''}
        {state.encounterBonus ? ` · Threat table +${state.encounterBonus}` : ''}. Enemies end the
        turn at once.
      </span>
      {manual && (
        <div className="gm-manual">
          <DicePad
            sides={100}
            label={`Enemy roll (enemies on ${chance} or less)`}
            compact
            onCommit={(roll) => dispatch({ type: 'tile_revealed', kind, roll })}
            highlight={(v) => (v <= chance ? 'bad' : undefined)}
          />
          <div className="gm-actions">
            <span className="hint inline">The quest decides:</span>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => dispatch({ type: 'tile_revealed', kind, encounter: true })}
            >
              Enemies
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => dispatch({ type: 'tile_revealed', kind, encounter: false })}
            >
              Empty
            </button>
          </div>
        </div>
      )}
      {last && last.turn === state.turn && (
        <p className={`gm-outcome ${last.encounter ? 'bad' : 'good'}`} role="status">
          <strong>{last.encounter ? 'Enemies!' : 'Empty.'}</strong>{' '}
          {last.kind === 'room' ? 'Room' : 'Corridor'}
          {last.roll !== null
            ? `, rolled ${last.roll} against ${last.chance}%`
            : ` (chance was ${last.chance}%)`}
          .
        </p>
      )}
    </div>
  );
}

/**
 * The card for the current step of the turn, with the actions that belong to it. While a
 * prompt holds the stage the card is a summary only, so the same action never shows twice.
 */
function StepCard({ muted = false }: { muted?: boolean }) {
  const { state, dispatch } = useGm();
  const mode = modeOf(state);
  const current = Math.min(state.turnStep, TURN_SEQUENCE.length - 1);
  const step = TURN_SEQUENCE[current]!;
  const last = current === TURN_SEQUENCE.length - 1;
  const nav = (
    <div className="gm-card-nav">
      <button
        type="button"
        className="btn-ghost"
        disabled={current === 0}
        onClick={() => dispatch({ type: 'turn_step', step: current - 1 })}
      >
        ‹ {current > 0 ? STEP_SHORT[current - 1] : ''}
      </button>
      {last ? (
        <button
          type="button"
          className="btn-primary big"
          onClick={() => dispatch({ type: 'new_turn' })}
          title="Shortcut: N"
        >
          {mode === 'battle' ? 'Next round' : 'Next turn'} <kbd>N</kbd>
        </button>
      ) : (
        <button
          type="button"
          className="btn-primary"
          onClick={() => dispatch({ type: 'turn_step', step: current + 1 })}
        >
          {STEP_SHORT[current + 1]} ›
        </button>
      )}
    </div>
  );
  return (
    <Card
      kicker={`${mode === 'battle' ? 'Combat round' : mode === 'rest' ? 'Resting' : 'Turn'} ${state.turn} · step ${current + 1} of ${TURN_SEQUENCE.length}`}
      title={step.text}
      cite={mode === 'battle' ? CITES.combatTurn : CITES.turnSequence}
      muted={muted}
      actions={nav}
    >
      {muted ? (
        <p className="hint">Resolve what is above first; this step’s actions come back here.</p>
      ) : (
        <StepBody id={step.id} />
      )}
    </Card>
  );
}

function StepBody({ id }: { id: string }) {
  const { state, dispatch } = useGm();
  const mode = modeOf(state);
  const living = state.heroes.filter((h) => !h.dead);
  switch (id) {
    case 'scenario': {
      const lit = lightSummary(state).lit.length;
      const rolled = state.scenarioTurn === state.turn;
      return (
        <div className="gm-step-body">
          {!state.scenarioEnabled ? (
            <p className="gm-card-text">This quest does not use the Scenario die.</p>
          ) : !state.entrancePassed ? (
            <>
              <p className="gm-card-text">
                Not yet: the Scenario die starts once the party has passed the first door.{' '}
                <CiteChip
                  cite={CITES.initialSetup}
                  quote="This door is always unlocked and does not increase the Threat Level. The party will not roll the Scenario Dice until they have passed this door."
                />
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => dispatch({ type: 'door_open', entrance: true })}
              >
                Entrance door opened
              </button>
            </>
          ) : rolled ? (
            <p className="gm-card-text good">Rolled this turn.</p>
          ) : (
            <>
              <p className="gm-card-text">Not rolled this turn.</p>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => dispatch({ type: 'scenario_request' })}
              >
                Roll it now
              </button>
            </>
          )}
          <p className="gm-card-text">
            {lit === 0
              ? 'No light source is lit.'
              : `${lit} light source${lit === 1 ? '' : 's'} lit.`}
          </p>
        </div>
      );
    }
    case 'act':
      if (mode === 'battle')
        return (
          <div className="gm-step-body">
            <ol className="gm-round">
              {COMBAT_ROUND.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ol>
            <details className="gm-details">
              <summary>
                Which enemy acts first <CiteChip cite={CITES.enemyPriority} />
              </summary>
              <ol className="gm-list">
                {ENEMY_PRIORITY.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <p className="hint">Randomise between enemies that could act at the same time.</p>
            </details>
            <div className="gm-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => dispatch({ type: 'battle_end', won: true })}
              >
                Battle won (+{THREAT.battleWon} Threat)
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => dispatch({ type: 'battle_end', won: false })}
              >
                Battle over, not won
              </button>
            </div>
          </div>
        );
      if (mode === 'rest')
        return <p className="gm-card-text">The party is resting; finish the rest above.</p>;
      return (
        <div className="gm-step-body">
          <div className="gm-actions">
            {!state.entrancePassed && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => dispatch({ type: 'door_open', entrance: true })}
              >
                Entrance door opened
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={() => dispatch({ type: 'door_open' })}
            >
              Door opened <b>+1</b>
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => dispatch({ type: 'door_open', chest: true })}
            >
              Chest opened <b>+1</b>
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={state.rations < REST.rationCost || living.length === 0}
              title={
                state.rations < REST.rationCost
                  ? 'A rest costs one ration'
                  : `Ambush risk ${state.threat.enabled ? `${ambushRisk(state.threat.level, state.restsTaken + 1)}%` : 'n/a'}`
              }
              onClick={() => dispatch({ type: 'rest_begin' })}
            >
              Short rest{' '}
              <span className="hint inline">
                1 ration
                {state.threat.enabled
                  ? ` · ${ambushRisk(state.threat.level, state.restsTaken + 1)}% ambush`
                  : ''}
              </span>
            </button>
          </div>
          <NextTile />
          <p className="hint">
            Searching a room takes the whole turn and happens once per room: highest PER, +
            {SEARCH.oneHelper} with a second searcher, +{SEARCH.moreHelpers} for each after that.{' '}
            <CiteChip cite={CITES.searching} />
          </p>
        </div>
      );
    case 'wandering': {
      const move = state.pending.find((p) => p.key === 'wm-move');
      return (
        <div className="gm-step-body">
          {state.wanderingMonsters === 0 ? (
            <p className="gm-card-text good">No Wandering Monster tokens on the board.</p>
          ) : (
            <>
              <p className="gm-card-text">
                {state.wanderingMonsters === 1 ? 'One token' : `${state.wanderingMonsters} tokens`}:
                each moves 4 squares. Roll 1d6: on a 1 it moves away (back, or through a random door
                away from the heroes), on 2–6 towards them. A closed door stops it for the turn (a
                sealed or wedged door needs 5–6 next turn); a chasm stops it. Entering a room with
                heroes in line of sight within 10 squares reveals the quest monsters.{' '}
                <CiteChip cite={CITES.wanderingMonsters} />
              </p>
              {move && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => dispatch({ type: 'dismiss_prompt', id: move.id })}
                >
                  Moved
                </button>
              )}
            </>
          )}
          <div className="gm-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => dispatch({ type: 'wm_place' })}
            >
              + token
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={state.wanderingMonsters === 0}
              onClick={() => dispatch({ type: 'wm_remove' })}
            >
              − token (revealed or gone)
            </button>
          </div>
        </div>
      );
    }
    case 'threat':
      return (
        <p className="gm-card-text">
          {!state.threat.enabled
            ? 'This quest does not use Threat.'
            : state.inBattle
              ? `When the battle is won, press Battle won: Threat +${THREAT.battleWon}.`
              : `Applied by Battle won (+${THREAT.battleWon}). Nothing else to do here.`}{' '}
          <CiteChip
            cite={CITES.threatIncrease}
            quote="Increase Threat Level by 1: the party wins a battle."
          />
        </p>
      );
    case 'psychology': {
      const wavering = isWavering(state);
      const zero = state.heroes.filter((h) => !h.dead && h.sanity === 0);
      return (
        <div className="gm-step-body">
          <p
            className={`gm-card-text${wavering || (state.morale.current === 0 && state.morale.start > 0) ? ' bad' : ''}`}
          >
            Party Morale {state.morale.current} (start {state.morale.start})
            {state.morale.start > 0 && state.morale.current === 0
              ? ': the party flees.'
              : wavering
                ? ': wavering, −20 RES.'
                : '.'}
          </p>
          {living.length > 0 && (
            <p className="gm-card-text">
              Sanity: {living.map((h) => `${h.name} ${h.sanity}/${h.sanityMax}`).join(' · ')}
            </p>
          )}
          {zero.length > 0 && (
            <p className="gm-card-text bad">
              {zero.map((h) => h.name).join(', ')} at 0 Sanity: roll the mental condition (open the
              hero’s token).
            </p>
          )}
          <p className="hint">
            Anything that happened this turn goes in through “What happened?” below; this step is
            the check that nothing was missed.
          </p>
        </div>
      );
    }
    default:
      return null;
  }
}
