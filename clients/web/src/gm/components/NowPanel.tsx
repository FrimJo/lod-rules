import { useState } from 'react';
import { parseDice, rollDice } from '../dice.ts';
import { heroById, type Prompt } from '../engine.ts';
import { LIGHT_RULES, THREAT_SOURCES } from '../rules.ts';
import { CiteChip, DieInput, useGm } from './common.tsx';

/**
 * The follow-ups the book asks for right now: a Threat roll after a 9 or 0, the Threat table
 * after a bad roll, a mental condition at 0 Sanity, a torch to relight. Each card resolves
 * with the roll or choice it needs and then disappears.
 */
export function NowPanel() {
  const { state } = useGm();
  const setupNeeded = state.heroes.length === 0;
  return (
    <section className="gm-now" aria-labelledby="gm-now-title" aria-live="polite">
      <header className="gm-now-head">
        <h2 id="gm-now-title">Resolve now</h2>
        <span className="gm-now-count">
          {state.pending.length === 0 ? 'Nothing pending' : `${state.pending.length} open`}
        </span>
      </header>
      {setupNeeded && state.pending.length === 0 ? (
        <div className="gm-prompt info">
          <div className="gm-prompt-body">
            <h3>Set up the table</h3>
            <p>
              Pick the quest, add the heroes with their RES (Party Morale is computed from it),
              note who carries a torch or lantern and how many spares and rations the party has.
              Then press <kbd>New turn</kbd> whenever a turn starts, and tell the table what
              happens: it rolls out every printed consequence and lists what to resolve here.
            </p>
          </div>
        </div>
      ) : state.pending.length === 0 ? (
        <p className="gm-now-empty muted">Nothing to resolve. Play on.</p>
      ) : (
        <ol className="gm-prompts">
          {state.pending.map((prompt) => (
            <li key={prompt.id}>
              <PromptCard prompt={prompt} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function PromptCard({ prompt }: { prompt: Prompt }) {
  const { state, dispatch } = useGm();
  const dismiss = () => dispatch({ type: 'dismiss_prompt', id: prompt.id });
  return (
    <article className={`gm-prompt ${prompt.severity}`}>
      <div className="gm-prompt-body">
        <h3>
          {prompt.title}
          {prompt.cite && <CiteChip cite={prompt.cite} />}
        </h3>
        {prompt.detail && <p>{prompt.detail}</p>}
        <PromptForm prompt={prompt} />
      </div>
      {prompt.request.kind !== 'confirm' && (
        <button type="button" className="gm-dismiss" onClick={dismiss} aria-label={`Dismiss: ${prompt.title}`}>
          Dismiss
        </button>
      )}
      {prompt.request.kind === 'confirm' && (
        <button type="button" className="gm-dismiss primary" onClick={dismiss}>
          Done
        </button>
      )}
      {prompt.request.kind === 'sanity_condition' && !heroById(state, prompt.request.heroId) && (
        <p className="gm-hint">This hero has left the party.</p>
      )}
    </article>
  );
}

function PromptForm({ prompt }: { prompt: Prompt }) {
  const { state, dispatch } = useGm();
  const request = prompt.request;
  switch (request.kind) {
    case 'scenario_roll':
      return (
        <DieInput sides={10} label="Scenario die" onCommit={(value) => dispatch({ type: 'scenario_roll', value })} />
      );
    case 'threat_roll':
      return (
        <>
          <label className="gm-check">
            <input
              type="checkbox"
              checked={state.inBattle}
              onChange={(event) => dispatch({ type: 'set_in_battle', inBattle: event.target.checked })}
            />
            The party is in battle (1d10 table instead of 1d20)
          </label>
          <DieInput sides={20} label="Threat roll" onCommit={(value) => dispatch({ type: 'threat_roll', value })} />
        </>
      );
    case 'threat_table':
      return <ThreatTableForm inBattle={request.inBattle} />;
    case 'threat_amount':
      return <ThreatAmountForm source={request.source} />;
    case 'threat_start':
      return (
        <DieInput
          dice={request.dice}
          label={`Start Threat (${request.dice})`}
          commitLabel="Set"
          onCommit={(value) => dispatch({ type: 'set_threat', level: value, reason: `rolled ${request.dice}` })}
        />
      );
    case 'sanity_condition':
      return (
        <DieInput
          sides={10}
          label="Mental conditions table (1d10)"
          onCommit={(value) => dispatch({ type: 'sanity_condition_roll', heroId: request.heroId, value })}
        />
      );
    case 'rest_resolve':
      return <RestForm risk={request.risk} />;
    case 'wandering_monster':
      return (
        <div className="gm-actions">
          {request.crossed ? (
            <button type="button" onClick={() => dispatch({ type: 'wm_place' })}>
              Place a Wandering Monster token
            </button>
          ) : (
            <button type="button" onClick={() => dispatch({ type: 'dismiss_prompt', id: prompt.id })}>
              Token placed
            </button>
          )}
          <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'dismiss_prompt', id: prompt.id })}>
            No monster
          </button>
        </div>
      );
    case 'battle_start':
      return (
        <div className="gm-actions">
          <button type="button" onClick={() => dispatch({ type: 'battle_start', demons: false })}>
            Battle begins
          </button>
          <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'battle_start', demons: true })}>
            Battle begins against demons
          </button>
        </div>
      );
    case 'light_relight': {
      const light = state.lights.find((l) => l.id === request.lightId);
      if (!light) return null;
      const torch = light.kind === 'torch';
      const spares = torch ? state.spares.torches : state.spares.lampOil;
      return (
        <div className="gm-actions">
          <button
            type="button"
            disabled={spares < 1}
            onClick={() => dispatch({ type: 'light_relight', id: light.id })}
          >
            {torch ? 'Light a new torch' : `Refill the ${LIGHT_RULES[light.kind].label.toLowerCase()}`}
            {spares < 1 ? ` (none left)` : ''}
          </button>
          <button type="button" className="gm-secondary" onClick={() => dispatch({ type: 'light_remove', id: light.id })}>
            Remove it
          </button>
        </div>
      );
    }
    case 'confirm':
      return null;
  }
}

function ThreatTableForm({ inBattle }: { inBattle: boolean }) {
  const { dispatch } = useGm();
  const [event, setEvent] = useState('');
  const [decrease, setDecrease] = useState('');
  const n = Number(decrease);
  const valid = decrease.trim() !== '' && Number.isInteger(n) && n >= 0;
  return (
    <form
      className="gm-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) dispatch({ type: 'threat_table_result', decrease: n, event });
      }}
    >
      <div className="gm-field">
        <label htmlFor="gm-threat-event">What happened ({inBattle ? '1d10 table' : '1d20 table'})</label>
        <input
          id="gm-threat-event"
          type="text"
          value={event}
          placeholder="e.g. Wandering Monster, trap, portcullis…"
          onChange={(e) => setEvent(e.target.value)}
        />
      </div>
      <div className="gm-field narrow">
        <label htmlFor="gm-threat-decrease">Threat decrease printed beside it</label>
        <input
          id="gm-threat-decrease"
          type="number"
          inputMode="numeric"
          min={0}
          value={decrease}
          onChange={(e) => setDecrease(e.target.value)}
        />
      </div>
      <button type="submit" disabled={!valid}>
        Carry out and lower Threat
      </button>
    </form>
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
      <button type="submit" disabled={!valid}>
        Apply
      </button>
      {info?.dice && (
        <button
          type="button"
          className="gm-secondary"
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
  const { dispatch } = useGm();
  const [interrupted, setInterrupted] = useState(false);
  const [barred, setBarred] = useState(false);
  return (
    <div className="gm-form column">
      <div className="gm-radios" role="radiogroup" aria-label="Was the rest interrupted?">
        <label className="gm-check">
          <input type="radio" name="gm-rest" checked={!interrupted} onChange={() => setInterrupted(false)} />
          The rest was not interrupted
        </label>
        <label className="gm-check">
          <input type="radio" name="gm-rest" checked={interrupted} onChange={() => setInterrupted(true)} />
          A Wandering Monster spotted the party
        </label>
      </div>
      {interrupted ? (
        <button type="button" onClick={() => dispatch({ type: 'rest_resolve', interrupted: true, barred })}>
          Interrupted: to battle
        </button>
      ) : (
        <>
          <label className="gm-check">
            <input type="checkbox" checked={barred} onChange={(e) => setBarred(e.target.checked)} />
            The door was barred (iron wedges or Seal Door)
          </label>
          <DieInput
            sides={100}
            label={`Ambush roll (1d100, ambushed on ${risk} or less)`}
            commitLabel="Resolve rest"
            onCommit={(ambushRoll) => dispatch({ type: 'rest_resolve', interrupted: false, ambushRoll, barred })}
          />
        </>
      )}
    </div>
  );
}
