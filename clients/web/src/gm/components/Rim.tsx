import { isWavering, lightSummary, modeOf, standingEffects, threatFloor } from '../engine.ts';
import { HERO_STATUSES, LIGHT_RULES, MENTAL_CONDITIONS, SANITY, TURN_SEQUENCE } from '../rules.ts';
import { CiteChip, STEP_SHORT, useGm } from './common.tsx';

/**
 * The rim: the handful of numbers a Game Master glances at between everything else, laid
 * out like the physical components they stand for (a turn dial, the Threat track, the
 * flames, the morale banner, the party's tokens). Each is a button into its drawer.
 */
export function Rim() {
  const { state } = useGm();
  const mode = modeOf(state);
  return (
    <div className={`gm-rim mode-${mode}`}>
      <TurnDial />
      <ThreatTrack />
      <LightGauge />
      <MoraleGauge />
    </div>
  );
}

const R = 26;
const C = 2 * Math.PI * R;
const SEG = C / TURN_SEQUENCE.length;
const GAP = 5;

function TurnDial() {
  const { state, dispatch } = useGm();
  const mode = modeOf(state);
  const started = state.turn > 0;
  const current = Math.min(state.turnStep, TURN_SEQUENCE.length - 1);
  const label =
    mode === 'prepare'
      ? 'Before the first turn'
      : mode === 'battle'
        ? `Combat round · turn ${state.turn}`
        : mode === 'rest'
          ? `Resting · turn ${state.turn}`
          : `Exploring${state.dungeonLevel > 1 ? ` · level ${state.dungeonLevel}` : ''}`;
  return (
    <div className="gm-cell gm-turn">
      <svg className="gm-dial" viewBox="0 0 64 64" aria-hidden="true">
        {TURN_SEQUENCE.map((step, i) => (
          <circle
            key={step.id}
            className={`gm-dial-arc${!started ? '' : i < current ? ' done' : i === current ? ' current' : ''}`}
            cx="32"
            cy="32"
            r={R}
            fill="none"
            strokeWidth="6"
            strokeDasharray={`${SEG - GAP} ${C - SEG + GAP}`}
            transform={`rotate(${-90 + (360 / TURN_SEQUENCE.length) * i} 32 32)`}
            onClick={() => started && dispatch({ type: 'turn_step', step: i })}
          />
        ))}
        <text
          x="32"
          y="32"
          textAnchor="middle"
          dominantBaseline="central"
          className="gm-dial-number"
        >
          {started ? state.turn : '–'}
        </text>
      </svg>
      <div className="gm-cell-text">
        <span className="gm-cell-kicker">{label}</span>
        <ol className="gm-stepstrip" aria-label="Turn steps">
          {TURN_SEQUENCE.map((step, i) => (
            <li key={step.id}>
              <button
                type="button"
                className={`gm-step${!started ? '' : i < current ? ' done' : i === current ? ' current' : ''}`}
                aria-current={started && i === current ? 'step' : undefined}
                disabled={!started}
                title={step.text}
                onClick={() => dispatch({ type: 'turn_step', step: i })}
              >
                <span className="gm-step-n">{i + 1}</span>
                <span className="gm-step-t">{STEP_SHORT[i]}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ThreatTrack() {
  const { state, openDrawer } = useGm();
  const { threat } = state;
  const floor = threatFloor(threat);
  const top = threat.max ?? 20;
  const cells: number[] = [];
  for (let v = floor; v <= top; v += 1) cells.push(v);
  const pendingRoll = state.pending.some(
    (p) => p.request.kind === 'threat_roll' || p.request.kind === 'threat_table',
  );
  if (!threat.enabled)
    return (
      <button
        type="button"
        className="gm-cell gm-threat off"
        onClick={() => openDrawer({ kind: 'threat' })}
      >
        <span className="gm-cell-kicker">Threat</span>
        <span className="gm-cell-big muted">off</span>
        <span className="gm-cell-sub">This quest uses no Threat Level</span>
      </button>
    );
  return (
    <button
      type="button"
      className={`gm-cell gm-threat${pendingRoll ? ' alert' : ''}`}
      onClick={() => openDrawer({ kind: 'threat' })}
      aria-label={`Threat ${threat.level}, minimum ${floor}${threat.max !== null ? `, maximum ${threat.max}` : ''}. Open the Threat drawer.`}
    >
      <span className="gm-cell-kicker">
        Threat
        {state.wanderingMonsters > 0 && (
          <span className="gm-wm-count" title="Wandering Monster tokens on the board">
            ☠ ×{state.wanderingMonsters}
          </span>
        )}
      </span>
      <span className="gm-threat-row">
        <span className="gm-cell-big">{threat.level}</span>
        <span className="gm-track" aria-hidden="true">
          {cells.map((v) => {
            const threshold = threat.thresholds.includes(v);
            const isMax = threat.max !== null && v === threat.max;
            return (
              <span
                key={v}
                className={`gm-track-cell${v === threat.level ? ' now' : v < threat.level ? ' past' : ''}${threshold ? ' threshold' : ''}${isMax ? ' max' : ''}`}
                title={
                  threshold
                    ? `Wandering Monster when Threat is increased to ${v}`
                    : isMax
                      ? `Quest maximum ${v}`
                      : `${v}`
                }
              >
                {threshold ? '☠' : v}
              </span>
            );
          })}
        </span>
      </span>
      <span className="gm-cell-sub">
        {pendingRoll
          ? 'Threat roll pending'
          : `min ${floor}${threat.max !== null ? ` · max ${threat.max}` : ''} · start ${threat.start}`}
      </span>
    </button>
  );
}

function LightGauge() {
  const { state, openDrawer } = useGm();
  const summary = lightSummary(state);
  const dark = summary.lit.length === 0;
  const spares = `${state.spares.torches} torch${state.spares.torches === 1 ? '' : 'es'} · ${state.spares.lampOil} oil`;
  return (
    <button
      type="button"
      className={`gm-cell gm-light${dark ? ' dark' : ''}`}
      onClick={() => openDrawer({ kind: 'light' })}
      aria-label={
        dark
          ? 'No light source is lit. Open the light drawer.'
          : `${summary.lit.length} light sources lit. Open the light drawer.`
      }
    >
      <span className="gm-cell-kicker">Light</span>
      <span className="gm-flames" aria-hidden="true">
        {dark ? (
          <span className="gm-flame off" />
        ) : (
          summary.lit.map((light) => (
            <span
              key={light.id}
              className={`gm-flame on ${light.kind}`}
              title={LIGHT_RULES[light.kind].label}
            />
          ))
        )}
      </span>
      <span className="gm-cell-big small">{dark ? 'Dark' : `+${summary.fearTerror}`}</span>
      <span className="gm-cell-sub">
        {dark
          ? state.lights.length
            ? 'Nothing is lit'
            : 'No light source'
          : 'Fear/Terror for all'}{' '}
        · {spares}
      </span>
    </button>
  );
}

function MoraleGauge() {
  const { state, openDrawer } = useGm();
  const { morale } = state;
  const wavering = isWavering(state);
  const fled = morale.start > 0 && morale.current === 0;
  // Morale may rise above its start value (only Keep Calm and Carry On! is capped), so the
  // banner fills at the start value and the label says "start", never "of".
  const pct =
    morale.start > 0 ? Math.min(100, Math.round((morale.current / morale.start) * 100)) : 0;
  return (
    <button
      type="button"
      className={`gm-cell gm-morale${fled ? ' danger' : wavering ? ' alert' : ''}`}
      onClick={() => openDrawer({ kind: 'morale' })}
      aria-label={`Party Morale ${morale.current}, started at ${morale.start}. Open the morale drawer.`}
    >
      <span className="gm-cell-kicker">Party Morale</span>
      <span className="gm-morale-row">
        <span className="gm-cell-big">{morale.current}</span>
        <span className="gm-banner" aria-hidden="true">
          <span className="gm-banner-fill" style={{ width: `${pct}%` }} />
          <span className="gm-banner-half" />
        </span>
      </span>
      <span className="gm-cell-sub">
        {morale.start === 0
          ? 'Add heroes with their RES'
          : fled
            ? 'At 0: the party flees'
            : wavering
              ? 'Wavering: −20 RES'
              : `start ${morale.start} · wavers below ${Math.floor(morale.start / 2)}`}
      </span>
    </button>
  );
}

/** The party as tokens: who they are, how much Sanity is left, what hangs over them. */
export function PartyStrip() {
  const { state, openDrawer } = useGm();
  const perception = lightSummary(state).perception;
  return (
    <div className="gm-party">
      <ul className="gm-tokens" aria-label="Party">
        {state.heroes.map((hero) => {
          const badges = [
            ...hero.conditions.map((id) => MENTAL_CONDITIONS.find((c) => c.id === id)?.name ?? id),
            ...hero.statuses.map((s) => HERO_STATUSES[s].label),
          ];
          return (
            <li key={hero.id}>
              <button
                type="button"
                className={`gm-token${hero.dead ? ' dead' : badges.length ? ' flagged' : ''}`}
                onClick={() => openDrawer({ kind: 'hero', heroId: hero.id })}
                aria-label={`${hero.name}: Sanity ${hero.sanity} of ${hero.sanityMax}${badges.length ? `, ${badges.join(', ')}` : ''}${hero.dead ? ', dead' : ''}. Open.`}
              >
                <span className="gm-token-name">
                  {hero.name}
                  {perception[hero.id] ? (
                    <span
                      className="gm-token-per"
                      title="Perception bonus from the light they carry"
                    >
                      +{perception[hero.id]} PER
                    </span>
                  ) : null}
                </span>
                <span className="gm-pips" aria-hidden="true">
                  {Array.from({ length: SANITY.start }, (_, i) => (
                    <span
                      key={i}
                      className={`gm-pip${i < hero.sanity ? ' full' : i < hero.sanityMax ? '' : ' gone'}`}
                    />
                  ))}
                </span>
                {hero.dead ? (
                  <span className="gm-token-badges">dead</span>
                ) : (
                  badges.length > 0 && <span className="gm-token-badges">{badges.join(' · ')}</span>
                )}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className="gm-token add"
            onClick={() => openDrawer({ kind: 'party' })}
          >
            {state.heroes.length === 0 ? 'Add the heroes' : '+ hero · rations'}
          </button>
        </li>
      </ul>
      <EffectsStrip />
    </div>
  );
}

function EffectsStrip() {
  const { state } = useGm();
  const effects = standingEffects(state);
  if (effects.length === 0) return null;
  return (
    <ul className="gm-effects" aria-label="Standing effects">
      {effects.map((effect) => (
        <li key={effect.id} className={`gm-effect ${effect.tone}`} title={effect.detail}>
          <span>{effect.label}</span>
          <CiteChip cite={effect.cite} quote={effect.detail} />
        </li>
      ))}
    </ul>
  );
}
