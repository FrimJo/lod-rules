import { useEffect, useState } from 'react';
import { parseDice, rollDice } from '../dice.ts';
import { modeOf, type GmEvent } from '../engine.ts';
import {
  CITES,
  MORALE,
  MORALE_EVENTS,
  THREAT_SOURCES,
  type Cite,
  type MoraleEventId,
} from '../rules.ts';
import { CiteChip, HeroPicker, signed, useGm, useHeroChoice } from './common.tsx';

type Moment = 'door' | 'tile' | 'battle' | 'party';

interface Tile {
  id: string;
  label: string;
  /** The printed consequences, as the Game Master would say them. */
  effects: string[];
  cite: Cite;
  quote?: string;
  needsHero?: boolean;
  tone?: 'bad' | 'good';
  hidden?: boolean;
  disabled?: boolean;
  event: (heroId: string | null) => GmEvent | null;
}

const MOMENTS: ReadonlyArray<{ id: Moment; label: string }> = [
  { id: 'door', label: 'At a door' },
  { id: 'tile', label: 'On the tile' },
  { id: 'battle', label: 'In battle' },
  { id: 'party', label: 'The party' },
];

function morale(id: MoraleEventId) {
  return MORALE_EVENTS.find((e) => e.id === id)!;
}

function moraleTile(
  id: MoraleEventId,
  label: string,
  extra: string[] = [],
  tone?: Tile['tone'],
): Tile {
  const row = morale(id);
  const applied = id === 'short_rest' ? MORALE.restBonus : (row.ruled ?? row.effect);
  const effects = [
    `morale ${signed(applied)}${row.ruled !== undefined ? ` (printed ${signed(row.effect)})` : ''}`,
  ];
  if (row.sanity?.kind === 'hero') effects.push(`Sanity −${row.sanity.loss}`);
  if (row.sanity?.kind === 'party') effects.push(`Sanity −${row.sanity.loss} each`);
  if (row.sanity?.kind === 'miscast') effects.push('Miscast table');
  return {
    id,
    label,
    effects: [...effects, ...extra],
    cite: CITES.partyMorale,
    quote: `${row.situation}: ${signed(row.effect)} Party Morale. ${row.flavour}${
      row.ruling ? ` ${row.ruling}` : ''
    }`,
    needsHero: row.perHero,
    tone: tone ?? (applied < 0 ? 'bad' : 'good'),
    event: (heroId) =>
      row.perHero && !heroId
        ? null
        : { type: 'morale_event', event: id, ...(row.perHero && heroId ? { heroId } : {}) },
  };
}

function threatTile(id: (typeof THREAT_SOURCES)[number]['id'], label?: string): Tile {
  const source = THREAT_SOURCES.find((s) => s.id === id)!;
  return {
    id,
    label: label ?? source.label,
    effects: [
      source.delta !== null
        ? `Threat ${signed(source.delta)}`
        : source.dice
          ? `Threat −${source.dice}`
          : 'Threat ±',
    ],
    cite: source.cite,
    quote: source.detail,
    tone:
      source.delta !== null
        ? source.delta > 0
          ? 'bad'
          : 'good'
        : source.dice
          ? 'good'
          : undefined,
    event: () => {
      if (source.dice) {
        const expr = parseDice(source.dice);
        return expr ? { type: 'threat_source', source: id, amount: -rollDice(expr) } : null;
      }
      return { type: 'threat_source', source: id };
    },
  };
}

/**
 * "What happened?": every event the book attaches a consequence to, grouped by the moment at
 * the table it happens in rather than by the tracker it changes. One tap applies all of its
 * printed consequences at once (Threat, Party Morale, Sanity, statuses), so nothing cascades
 * by memory.
 */
export function Palette() {
  const { state, dispatch, openDrawer } = useGm();
  const mode = modeOf(state);
  const [moment, setMoment] = useState<Moment>(mode === 'battle' ? 'battle' : 'tile');
  const [heroId, setHeroId] = useHeroChoice();
  const [chosenByHand, setChosenByHand] = useState(false);
  const [folded, setFolded] = useFolded();
  useEffect(() => {
    if (!chosenByHand) setMoment(mode === 'battle' ? 'battle' : 'tile');
  }, [mode, chosenByHand]);
  const inBattle = state.inBattle;

  const tiles: Record<Moment, Tile[]> = {
    door: [
      {
        id: 'entrance',
        label: 'Entrance door passed',
        effects: ['no Threat', 'Scenario die from next turn'],
        cite: CITES.initialSetup,
        hidden: state.entrancePassed,
        event: () => ({ type: 'door_open', entrance: true }),
      },
      {
        id: 'door',
        label: 'Door opened',
        effects: ['Threat +1', 'checklist'],
        cite: CITES.openDoor,
        tone: 'bad',
        event: () => ({ type: 'door_open' }),
      },
      {
        id: 'chest',
        label: 'Chest opened',
        effects: ['Threat +1', 'checklist'],
        cite: CITES.openDoor,
        tone: 'bad',
        event: () => ({ type: 'door_open', chest: true }),
      },
      threatTile('force_lock', 'Lock forced (each attempt)'),
      threatTile('crowbar', 'Crowbar used'),
      threatTile('cobweb_cleared', 'Cobweb opening cleared'),
      threatTile('portcullis_failed', 'Portcullis lift failed'),
      moraleTile('portcullis', 'Portcullis fell, blocking the path'),
    ],
    tile: [
      moraleTile('trap', 'A hero springs a trap'),
      moraleTile('fine_treasure', 'Fine Treasure found'),
      moraleTile('wonderful_treasure', 'Wonderful Treasure found'),
      {
        id: 'rest',
        label: 'Short rest',
        effects: ['1 ration', `morale +${MORALE.restBonus}`, 'ambush roll'],
        cite: CITES.rest,
        disabled: inBattle || state.resting || state.rations < 1,
        event: () => ({ type: 'rest_begin' }),
      },
      {
        id: 'wm',
        label: 'Wandering Monster token placed',
        effects: ['token +1'],
        cite: CITES.wanderingMonsters,
        event: () => ({ type: 'wm_place' }),
      },
      {
        id: 'wm-off',
        label: 'Wandering Monster revealed or gone',
        effects: ['token −1'],
        cite: CITES.wanderingMonsters,
        disabled: state.wanderingMonsters === 0,
        event: () => ({ type: 'wm_remove' }),
      },
      {
        id: 'level',
        label: 'Stairs: new dungeon level',
        effects: ['Threat reset'],
        cite: CITES.threatNewLevel,
        quote: 'In a multilevel dungeon the Threat level is always reset on a new level.',
        event: () => ({ type: 'new_level' }),
      },
    ],
    battle: [
      {
        id: 'battle',
        label: 'Enemies placed: battle begins',
        effects: ['new turn', 'initiative bag'],
        cite: CITES.initiative,
        hidden: inBattle,
        tone: 'bad',
        event: () => ({ type: 'battle_start', demons: false }),
      },
      {
        id: 'demons',
        label: 'Battle with demons begins',
        effects: ['morale −2', 'Sanity −1 each'],
        cite: CITES.partyMorale,
        hidden: inBattle,
        tone: 'bad',
        event: () => ({ type: 'battle_start', demons: true }),
      },
      {
        id: 'won',
        label: 'Battle won',
        effects: ['Threat +1', 'continue the turn'],
        cite: CITES.threatIncrease,
        hidden: !inBattle,
        event: () => ({ type: 'battle_end', won: true }),
      },
      {
        id: 'over',
        label: 'Battle over, not won',
        effects: ['continue the turn'],
        cite: CITES.endOfBattle,
        hidden: !inBattle,
        event: () => ({ type: 'battle_end', won: false }),
      },
      moraleTile('large_monster', 'Large monster slain'),
      moraleTile('fear', 'Fear Test failed'),
      moraleTile('terror', 'Terror Test failed'),
      moraleTile('zero_hp', 'Hero at 0 HP', ['bleeding out', 'permanent injury']),
      moraleTile('hero_dies', 'Hero dies', ['start value kept']),
      {
        id: 'head',
        label: 'Wound to the head',
        effects: ['Sanity −1', 'headlamp destroyed'],
        cite: CITES.sanity,
        needsHero: true,
        tone: 'bad',
        event: (heroId) => (heroId ? { type: 'hero_head_wound', id: heroId } : null),
      },
      moraleTile('miscast', 'A spell miscast'),
      {
        id: 'poisoned',
        label: 'Hero poisoned',
        effects: ['morale −1', 'Sanity −1', 'Poison Tests'],
        cite: CITES.poison,
        needsHero: true,
        tone: 'bad',
        event: (heroId) =>
          heroId
            ? { type: 'morale_event', event: 'poison_or_disease', heroId, status: 'poisoned' }
            : null,
      },
      {
        id: 'diseased',
        label: 'Hero diseased',
        effects: ['morale −1', 'Sanity −1'],
        cite: CITES.partyMorale,
        needsHero: true,
        tone: 'bad',
        event: (heroId) =>
          heroId
            ? { type: 'morale_event', event: 'poison_or_disease', heroId, status: 'diseased' }
            : null,
      },
      {
        id: 'torch',
        label: 'Torch swung at 90+',
        effects: ['torch out'],
        cite: CITES.lightSources,
        quote: 'An unmodified attack result of 90 or more extinguishes and discards the torch.',
        event: () => null,
      },
    ],
    party: [
      moraleTile('hungry', 'A hero is hungry'),
      moraleTile('short_rest', 'Rest taken elsewhere (morale only)', [], 'good'),
      moraleTile('dwarven_ale', 'Dwarven Ale shared', [MORALE.dwarvenAle]),
      {
        id: 'keep-calm',
        label: 'Keep Calm and Carry On!',
        effects: [`morale +${MORALE.keepCalm}`, 'not above start'],
        cite: CITES.keepCalm,
        tone: 'good',
        event: () => ({
          type: 'morale_adjust',
          delta: MORALE.keepCalm,
          reason: 'Keep Calm and Carry On!',
          capAtStart: true,
          cite: CITES.keepCalm,
        }),
      },
      threatTile('lucky_git'),
      threatTile('gods_favourite'),
      threatTile('custom', 'Other Threat change'),
      {
        id: 'sanity-1',
        label: 'Sanity −1 (other cause)',
        effects: ['Sanity −1'],
        cite: CITES.sanity,
        needsHero: true,
        tone: 'bad',
        event: (heroId) =>
          heroId ? { type: 'sanity_loss', heroId, amount: 1, reason: 'event' } : null,
      },
    ],
  };

  const list = tiles[moment].filter((t) => !t.hidden);
  const needsHero = list.some((t) => t.needsHero);

  return (
    <section className={`gm-palette${folded ? ' folded' : ''}`} aria-label="What happened?">
      <div className="gm-palette-bar">
        <span className="gm-palette-title">What happened?</span>
        <div className="gm-moments">
          {MOMENTS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={moment === m.id}
              className={`gm-moment${moment === m.id ? ' on' : ''}`}
              onClick={() => {
                setMoment(m.id);
                setChosenByHand(true);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="gm-link"
          aria-expanded={!folded}
          onClick={() => setFolded(!folded)}
        >
          {folded ? 'Show' : 'Hide'}
        </button>
      </div>
      {!folded && (
        <div className="gm-tray">
          {needsHero && (
            <HeroPicker
              value={heroId}
              onChange={setHeroId}
              random
              label={heroId ? 'It happened to' : 'Pick who it happened to'}
            />
          )}
          <ul className="gm-tiles">
            {list.map((tile) => (
              <li key={tile.id}>
                <button
                  type="button"
                  className={`gm-tile${tile.tone ? ` ${tile.tone}` : ''}${tile.needsHero ? ' hero' : ''}`}
                  disabled={tile.disabled || (tile.needsHero && !heroId)}
                  title={tile.needsHero && !heroId ? 'Pick the hero first' : undefined}
                  onClick={() => {
                    if (tile.id === 'torch') {
                      openDrawer({ kind: 'light' });
                      return;
                    }
                    const event = tile.event(heroId);
                    if (!event) return;
                    dispatch(event);
                    if (tile.needsHero) setHeroId(null);
                  }}
                >
                  <span className="gm-tile-label">{tile.label}</span>
                  <span className="gm-tile-effects">
                    {tile.effects.map((e) => (
                      <span key={e} className="gm-fx">
                        {e}
                      </span>
                    ))}
                  </span>
                </button>
                <CiteChip cite={tile.cite} quote={tile.quote} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const FOLD_KEY = 'lod-rules:gm-table:palette-folded';

/** Whether the tray is folded away: a device preference, not table state. */
function useFolded(): [boolean, (next: boolean) => void] {
  const [folded, setFolded] = useState(false);
  useEffect(() => {
    try {
      setFolded(window.localStorage.getItem(FOLD_KEY) === '1');
    } catch {
      // Storage blocked: the tray simply starts open.
    }
  }, []);
  const set = (next: boolean) => {
    setFolded(next);
    try {
      window.localStorage.setItem(FOLD_KEY, next ? '1' : '0');
    } catch {
      // Ignore; the choice lasts for the visit.
    }
  };
  return [folded, set];
}
