/**
 * The Game Master's table as a pure reducer. The state is the whole dungeon run: Threat,
 * light, Party Morale, each hero's Sanity and conditions, rations, rests, Wandering Monster
 * tokens and the log. Events are what the Game Master tells the table ("the Scenario die
 * came up 0", "a door was opened", "Maja failed a Fear test"). The reducer applies every
 * printed consequence it can and leaves the rest as *prompts*: the follow-ups the book asks
 * for next (roll a Threat roll, roll on the Threat table, light a new torch, roll a mental
 * condition). The UI only renders state and dispatches events, so `tests/gm-engine.test.ts`
 * covers the rules without a browser.
 */
import {
  CITES,
  CHEST_TABLES,
  DOOR,
  ENCOUNTER,
  GAPS,
  HERO_STATUSES,
  INITIATIVE,
  INJURY,
  LIGHT_RULES,
  MENTAL_CONDITIONS,
  MORALE,
  MORALE_EVENTS,
  REST,
  SANITY,
  SCENARIO,
  THREAT,
  THREAT_SOURCES,
  TURN_SEQUENCE,
  chestTableRow,
  doorTableRow,
  questById,
  threatTableFor,
  threatTableRow,
  type ChestTable,
  type ChestTableRow,
  type Cite,
  type HeroStatus,
  type LightKind,
  type MentalConditionId,
  type MoraleEventId,
  type ThreatSourceId,
} from './rules.ts';

export const STATE_VERSION = 2;

export interface Hero {
  id: string;
  name: string;
  /** Resolve, for the Party Morale calculation (RES / 10, rounded down). */
  resolve: number;
  nightVision: boolean;
  sanity: number;
  sanityMax: number;
  conditions: MentalConditionId[];
  statuses: HeroStatus[];
  dead: boolean;
}

export interface LightSource {
  id: string;
  kind: LightKind;
  carrierId: string | null;
  lit: boolean;
  /** Lanterns and headlamps: 2 when full, 1 after one Threat roll below Threat, 0 when dry. */
  oilHalves: number;
  /** A torch spent by a Threat roll or an attack roll of 90+; it is discarded. */
  spent: boolean;
  destroyed: boolean;
}

export interface ThreatState {
  enabled: boolean;
  level: number;
  start: number;
  /** Quest minimum; the book's floor of 2 applies when null. */
  min: number | null;
  max: number | null;
  /** Quest values at which a Wandering Monster appears on an increase. */
  thresholds: number[];
}

/** The two dice rolled together when a door or chest is opened, once the Game Master has entered them. */
export interface DoorRoll {
  d10: number;
  d6: number;
  trapped: boolean;
  locked: boolean;
  /** Printed difficulty of a locked door or chest. */
  difficulty: string | null;
}

/** The chest's treasure roll, once the Game Master has entered it. */
export interface ChestRoll {
  table: ChestTable['id'];
  d10: number;
  rowId: string;
}

export type PromptRequest =
  | { kind: 'scenario_roll' }
  | { kind: 'threat_roll' }
  | { kind: 'threat_table'; inBattle: boolean; roll: number }
  | { kind: 'threat_amount'; source: ThreatSourceId }
  | { kind: 'threat_start'; dice: string }
  | { kind: 'sanity_condition'; heroId: string; duplicateOf?: MentalConditionId }
  | { kind: 'rest_resolve'; risk: number }
  | { kind: 'wandering_monster'; threshold: number; crossed: boolean }
  | { kind: 'battle_start'; reason: string; barred?: boolean }
  | { kind: 'light_relight'; lightId: string }
  /** The door or chest checklist: Threat is already up by 1; the rolls and the tile follow. */
  | { kind: 'door'; chest: boolean; rolled: DoorRoll | null }
  /** An open chest: 1d10 on the Chest (or Objective Chest) table says which Treasure Cards to draw. */
  | { kind: 'chest'; rolled: ChestRoll | null }
  /** A trap: from the Threat table a random hero, from a door or chest the opener; say whether it went off. */
  | { kind: 'trap'; source: 'threat_table' | 'door' | 'chest' }
  /** Heroes bleeding out after a battle or during a rest: each is bandaged back up or dies. */
  | { kind: 'bleeding'; heroIds: string[]; context: 'battle' | 'rest' }
  | { kind: 'confirm' };

export interface Prompt {
  id: string;
  /** Prompts with the same key replace each other, so one open question shows once. */
  key: string;
  title: string;
  detail?: string;
  cite?: Cite;
  request: PromptRequest;
  /** Shown as a danger. */
  severity: 'info' | 'warn' | 'danger';
}

export type LogKind =
  | 'turn'
  | 'threat'
  | 'light'
  | 'morale'
  | 'sanity'
  | 'hero'
  | 'battle'
  | 'rest'
  | 'explore'
  | 'info'
  | 'warn';

export interface LogEntry {
  id: string;
  turn: number;
  kind: LogKind;
  text: string;
  cite?: Cite;
}

/** The last tile revealed: what was rolled for enemies and what came of it. */
export interface TileReveal {
  kind: 'room' | 'corridor';
  /** Encounter chance the roll was made against. */
  chance: number;
  /** The 1d100 result, or null when the Game Master declared the outcome without a roll. */
  roll: number | null;
  encounter: boolean;
  turn: number;
}

export interface GmState {
  version: typeof STATE_VERSION;
  questId: string | null;
  turn: number;
  /** Level of a multilevel dungeon; Threat resets when it changes. */
  dungeonLevel: number;
  entrancePassed: boolean;
  scenarioEnabled: boolean;
  scenarioTrigger: number;
  /** +1 on every Scenario die roll after the not-in-battle Threat table result 20 (once). */
  scenarioBonus: number;
  /** Turn in which the Scenario die was last rolled; 0 when never. */
  scenarioTurn: number;
  /** Cumulative +10 to every encounter roll from the Threat table result 16–17. */
  encounterBonus: number;
  /** Dwarven Ale was drunk this quest: all tests −10, RES +20. */
  dwarvenAle: boolean;
  inBattle: boolean;
  resting: boolean;
  /** 0-based index into `TURN_SEQUENCE`: where the Game Master is in the current turn. */
  turnStep: number;
  threat: ThreatState;
  lights: LightSource[];
  spares: { torches: number; lampOil: number };
  heroes: Hero[];
  morale: {
    current: number;
    start: number;
    /** Game Master override of the computed start value. */
    startOverride: number | null;
    naturalLeader: boolean;
    powerstone: boolean;
  };
  rations: number;
  restsTaken: number;
  /** Tiles revealed since the last encounter, for the +10 encounter bonus. */
  encounterStreak: number;
  lastTile: TileReveal | null;
  wanderingMonsters: number;
  pending: Prompt[];
  log: LogEntry[];
  nextId: number;
}

export type GmEvent =
  | { type: 'reset' }
  | { type: 'set_quest'; questId: string | null }
  | {
      type: 'set_threat_bounds';
      start?: number;
      min?: number | null;
      max?: number | null;
      thresholds?: number[];
      enabled?: boolean;
    }
  | { type: 'set_threat'; level: number; reason?: string }
  | { type: 'threat_adjust'; delta: number; reason: string; cite?: Cite }
  | { type: 'threat_source'; source: ThreatSourceId; amount?: number }
  | { type: 'threat_roll'; value: number }
  /** The printed Threat table roll (1d20 not in battle, 1d10 in battle): the table carries the row out. */
  | { type: 'threat_table_roll'; value: number }
  /** A Threat table result entered by hand, for rows the Game Master resolves from the book. */
  | { type: 'threat_table_result'; decrease: number; event: string }
  | { type: 'set_encounter_bonus'; bonus: number }
  | { type: 'pass_entrance' }
  | { type: 'new_turn' }
  | { type: 'new_level' }
  | { type: 'turn_step'; step: number }
  | { type: 'scenario_roll'; value: number }
  /** Brings back a Scenario die prompt that was dismissed unrolled. */
  | { type: 'scenario_request' }
  /** Brings back the mental condition prompt for a hero at 0 Sanity. */
  | { type: 'sanity_condition_request'; heroId: string }
  /** A bleeding hero bandaged or healed back up. */
  | { type: 'hero_recover'; id: string }
  | { type: 'set_in_battle'; inBattle: boolean }
  | { type: 'battle_start'; demons: boolean; bag?: InitiativeBagInput }
  | { type: 'battle_end'; won: boolean }
  | { type: 'door_open'; entrance?: boolean; chest?: boolean }
  /** The 1d10 and 1d6 rolled together for an opened door or chest. */
  | { type: 'door_roll'; d10: number; d6: number }
  /** The 1d10 on the Chest or Objective Chest table for an opened chest. */
  | { type: 'chest_roll'; table: ChestTable['id']; d10: number }
  /** A trap from the Threat table: who sprang it, and whether the Perception roll saved them. */
  | { type: 'trap_resolve'; heroId: string | null; triggered: boolean }
  /** A tile placed: with a 1d100 `roll` the table decides whether enemies appear; otherwise `encounter` says so. */
  | { type: 'tile_revealed'; kind: 'room' | 'corridor'; roll?: number; encounter?: boolean }
  | { type: 'wm_place' }
  | { type: 'wm_remove' }
  | { type: 'light_add'; kind: LightKind; carrierId: string | null; lit: boolean }
  | { type: 'light_remove'; id: string }
  | { type: 'light_set_lit'; id: string; lit: boolean }
  | { type: 'light_relight'; id: string }
  | { type: 'light_attack_roll'; id: string; roll: number }
  | { type: 'light_refill'; id: string }
  | { type: 'light_carrier'; id: string; carrierId: string | null }
  | { type: 'set_spares'; torches?: number; lampOil?: number }
  | { type: 'hero_add'; name: string; resolve: number; nightVision: boolean }
  | {
      type: 'hero_update';
      id: string;
      patch: Partial<Pick<Hero, 'name' | 'resolve' | 'nightVision' | 'sanity' | 'sanityMax'>>;
    }
  | { type: 'hero_remove'; id: string }
  | { type: 'hero_status'; id: string; status: HeroStatus; on: boolean }
  | { type: 'hero_head_wound'; id: string }
  | { type: 'hero_condition_remove'; id: string; condition: MentalConditionId }
  | {
      type: 'morale_event';
      event: MoraleEventId;
      heroId?: string;
      status?: 'poisoned' | 'diseased';
    }
  | { type: 'morale_adjust'; delta: number; reason: string; capAtStart?: boolean; cite?: Cite }
  | {
      type: 'set_morale';
      current?: number;
      startOverride?: number | null;
      naturalLeader?: boolean;
      powerstone?: boolean;
    }
  | { type: 'sanity_loss'; heroId: string; amount: number; reason: string; cite?: Cite }
  | { type: 'sanity_condition_roll'; heroId: string; value: number }
  | { type: 'set_rations'; rations: number }
  | { type: 'rest_begin' }
  | { type: 'rest_resolve'; interrupted: boolean; ambushRoll?: number; barred: boolean }
  | { type: 'dismiss_prompt'; id: string }
  | { type: 'note'; text: string };

const LOG_LIMIT = 400;

export function initialState(): GmState {
  return {
    version: STATE_VERSION,
    questId: null,
    turn: 0,
    dungeonLevel: 1,
    entrancePassed: false,
    scenarioEnabled: true,
    scenarioTrigger: SCENARIO.threatTrigger,
    scenarioBonus: 0,
    scenarioTurn: 0,
    encounterBonus: 0,
    dwarvenAle: false,
    inBattle: false,
    resting: false,
    turnStep: 0,
    threat: { enabled: true, level: 2, start: 2, min: null, max: null, thresholds: [] },
    lights: [],
    spares: { torches: 0, lampOil: 0 },
    heroes: [],
    morale: { current: 0, start: 0, startOverride: null, naturalLeader: false, powerstone: false },
    rations: 0,
    restsTaken: 0,
    encounterStreak: 0,
    lastTile: null,
    wanderingMonsters: 0,
    pending: [],
    log: [],
    nextId: 1,
  };
}

// ---------------------------------------------------------------------------------------
// Derived values

/** Party Morale start: each member's RES / 10 (RDD), summed, plus the flat bonuses. */
export function moraleStart(state: GmState): number {
  if (state.morale.startOverride !== null) return state.morale.startOverride;
  const members = state.heroes.filter((hero) => !hero.dead);
  const base = members.reduce((sum, hero) => sum + Math.floor(hero.resolve / 10), 0);
  return (
    base +
    (state.morale.naturalLeader ? MORALE.naturalLeader : 0) +
    (state.morale.powerstone ? MORALE.powerstone : 0)
  );
}

/** Below half of the start value the party wavers. */
export function isWavering(state: GmState): boolean {
  return state.morale.current < Math.floor(state.morale.start / 2);
}

export function threatFloor(threat: ThreatState): number {
  return threat.min ?? THREAT.floor;
}

/** Ambush chance during a rest: (5 + Threat)%, +10% per rest after the first, max 70%. */
export function ambushRisk(threatLevel: number, restsTaken: number): number {
  const later = Math.max(0, restsTaken - 1);
  return Math.min(REST.ambushCap, REST.ambushBase + threatLevel + later * REST.ambushPerLaterRest);
}

/**
 * Encounter chance for the next tile: room 50% or corridor 30%, +10 after four empty tiles,
 * plus the cumulative +10s from the Threat table, never above 70%.
 */
export function encounterChance(kind: 'room' | 'corridor', streak: number, bonus = 0): number {
  const base = kind === 'room' ? ENCOUNTER.room : ENCOUNTER.corridor;
  const streakBonus = streak >= ENCOUNTER.streakTiles ? ENCOUNTER.streakBonus : 0;
  return Math.min(ENCOUNTER.cap, base + streakBonus + bonus);
}

/** A 1d100 result at or under the encounter chance means enemies are on the tile. */
export function encounterRolled(
  kind: 'room' | 'corridor',
  streak: number,
  roll: number,
  bonus = 0,
): boolean {
  return roll <= encounterChance(kind, streak, bonus);
}

/** What the Game Master tells the table about the enemies when a battle starts. */
export interface InitiativeBagInput {
  enemies: number;
  named?: number;
  /** The heroes bashed the door down: enemies get 2 tokens more than their number. */
  bashedDoor?: boolean;
  /** The enemies ambushed a resting party: 3 extra enemy tokens (none if the door was barred). */
  restAmbush?: boolean;
  perfectHearing?: 'none' | 'heroes' | 'enemies' | 'both';
  /** Heroes on Overwatch put no token in the bag. */
  overwatch?: number;
}

export interface InitiativeBag {
  heroTokens: number;
  enemyTokens: number;
  notes: string[];
}

/** The initiative bag for the first turn of a battle, from the printed token rules. */
export function initiativeBag(state: GmState, input: InitiativeBagInput): InitiativeBag {
  const standing = state.heroes.filter((h) => !h.dead && !h.statuses.includes('bleeding_out'));
  const overwatch = Math.min(standing.length, Math.max(0, input.overwatch ?? 0));
  const notes: string[] = [];
  let heroTokens = standing.length - overwatch;
  let enemyTokens =
    Math.max(0, input.enemies) + Math.max(0, input.named ?? 0) * INITIATIVE.namedMonster;
  if (overwatch > 0) notes.push(`${overwatch} on Overwatch: no token.`);
  if ((input.named ?? 0) > 0) notes.push(`+${input.named} for named monsters while they live.`);
  if (input.bashedDoor) {
    enemyTokens += INITIATIVE.bashedDoor;
    notes.push(`Door bashed down: +${INITIATIVE.bashedDoor} enemy tokens, first turn only.`);
  }
  if (input.restAmbush) {
    enemyTokens += INITIATIVE.restAmbush;
    notes.push(`Ambush during the rest: +${INITIATIVE.restAmbush} enemy tokens.`);
  }
  if (input.perfectHearing === 'heroes') {
    heroTokens += INITIATIVE.perfectHearing;
    notes.push('Perfect Hearing: +1 hero token on the first turn.');
  } else if (input.perfectHearing === 'enemies') {
    enemyTokens += INITIATIVE.perfectHearing;
    notes.push('Perfect Hearing: +1 enemy token on the first turn.');
  } else if (input.perfectHearing === 'both') {
    notes.push('Both sides have Perfect Hearing: no extra token.');
  }
  return { heroTokens, enemyTokens, notes };
}

export interface StandingEffect {
  id: string;
  label: string;
  detail: string;
  cite: Cite;
  tone: 'warn' | 'danger' | 'info';
}

/** Modifiers that stay in force until something ends them: the things easiest to forget. */
export function standingEffects(state: GmState): StandingEffect[] {
  const effects: StandingEffect[] = [];
  if (state.encounterBonus > 0)
    effects.push({
      id: 'encounter-bonus',
      label: `Encounter risk +${state.encounterBonus}`,
      detail: 'In all rooms and corridors for the rest of the quest (max 70%).',
      cite: CITES.threatTableNotInBattle,
      tone: 'warn',
    });
  if (state.scenarioBonus > 0)
    effects.push({
      id: 'scenario-bonus',
      label: `Scenario die +${state.scenarioBonus}`,
      detail: 'On every Scenario die roll for the remainder of the dungeon.',
      cite: CITES.threatTableNotInBattle,
      tone: 'warn',
    });
  if (state.morale.start > 0 && state.morale.current === 0)
    effects.push({
      id: 'morale-zero',
      label: 'Party flees',
      detail:
        'Party Morale is 0: the party leaves the dungeon as soon as it is not locked in combat.',
      cite: CITES.moraleFlee,
      tone: 'danger',
    });
  else if (isWavering(state))
    effects.push({
      id: 'wavering',
      label: 'Wavering: −20 RES',
      detail: `Party Morale is below half of ${state.morale.start}. All heroes suffer −20 RES until it rises above that.`,
      cite: CITES.moraleWavering,
      tone: 'danger',
    });
  if (state.dwarvenAle)
    effects.push({
      id: 'dwarven-ale',
      label: 'Dwarven Ale',
      detail: MORALE.dwarvenAle,
      cite: CITES.consumables,
      tone: 'info',
    });
  for (const hero of state.heroes) {
    if (hero.dead) continue;
    for (const id of hero.conditions) {
      const condition = MENTAL_CONDITIONS.find((c) => c.id === id);
      if (!condition?.tracked) continue;
      effects.push({
        id: `${hero.id}-${id}`,
        label: `${hero.name}: ${condition.name}`,
        detail: condition.tracked,
        cite:
          id === 'jumpy'
            ? CITES.jumpy
            : id === 'acute_stress'
              ? CITES.acuteStress
              : CITES.mentalConditions,
        tone: 'warn',
      });
    }
  }
  if (state.questId === 'quest.great_crypt.tomb_raiders')
    effects.push({
      id: 'tomb-raiders',
      label: 'Objective room: Threat roll above Threat also brings a Wandering Monster',
      detail: 'Tomb Raiders quest rule, while at least one hero is in the objective room.',
      cite: { page: 260, pdf: 262, heading: 'Tomb Raiders Threat' },
      tone: 'info',
    });
  return effects;
}

/** Exploring, in battle, or resting: the mode decides which table and which actions apply. */
export type GmMode = 'prepare' | 'explore' | 'battle' | 'rest';

export function modeOf(state: GmState): GmMode {
  if (state.turn === 0) return 'prepare';
  if (state.inBattle) return 'battle';
  if (state.resting) return 'rest';
  return 'explore';
}

export interface LightSummary {
  lit: LightSource[];
  /** Fear/Terror bonus every hero currently has from light. */
  fearTerror: number;
  /** Perception bonus per carrier id. */
  perception: Record<string, number>;
}

export function lightSummary(state: GmState): LightSummary {
  const lit = state.lights.filter((light) => light.lit && !light.spent && !light.destroyed);
  const perception: Record<string, number> = {};
  for (const light of lit) {
    if (!light.carrierId || !heroById(state, light.carrierId)) continue;
    const rules = LIGHT_RULES[light.kind];
    perception[light.carrierId] = Math.max(perception[light.carrierId] ?? 0, rules.perception);
  }
  return { lit, fearTerror: lit.length > 0 ? 5 : 0, perception };
}

export function heroById(state: GmState, id: string | undefined | null): Hero | undefined {
  return id ? state.heroes.find((hero) => hero.id === id) : undefined;
}

export function conditionForRoll(value: number) {
  return MENTAL_CONDITIONS.find((c) => value >= c.roll.min && value <= c.roll.max);
}

// ---------------------------------------------------------------------------------------
// Internal helpers (each returns a new state)

/** "2 Fine Treasure Cards and 1 Wonderful Treasure Card", or null for an empty chest. */
export function treasureDraws(row: ChestTableRow): string | null {
  const part = (n: number, tier: string) =>
    n > 0 ? `${n} ${tier} Treasure Card${n === 1 ? '' : 's'}` : null;
  const parts = [part(row.fine, 'Fine'), part(row.wonderful, 'Wonderful')].filter(
    (p): p is string => p !== null,
  );
  return parts.length > 0 ? parts.join(' and ') : null;
}

function nextId(state: GmState, prefix: string): [GmState, string] {
  return [{ ...state, nextId: state.nextId + 1 }, `${prefix}${state.nextId}`];
}

function log(state: GmState, kind: LogKind, text: string, cite?: Cite): GmState {
  const [next, id] = nextId(state, 'log');
  const entry: LogEntry = { id, turn: next.turn, kind, text, ...(cite ? { cite } : {}) };
  const entries = [...next.log, entry];
  return { ...next, log: entries.length > LOG_LIMIT ? entries.slice(-LOG_LIMIT) : entries };
}

function prompt(
  state: GmState,
  key: string,
  title: string,
  request: PromptRequest,
  options: { detail?: string; cite?: Cite; severity?: Prompt['severity'] } = {},
): GmState {
  const [next, id] = nextId(state, 'p');
  const entry: Prompt = {
    id,
    key,
    title,
    request,
    severity: options.severity ?? 'info',
    ...(options.detail ? { detail: options.detail } : {}),
    ...(options.cite ? { cite: options.cite } : {}),
  };
  return { ...next, pending: [...next.pending.filter((p) => p.key !== key), entry] };
}

function dropPrompts(state: GmState, predicate: (p: Prompt) => boolean): GmState {
  const pending = state.pending.filter((p) => !predicate(p));
  return pending.length === state.pending.length ? state : { ...state, pending };
}

function updateHero(state: GmState, id: string, patch: (hero: Hero) => Hero): GmState {
  return { ...state, heroes: state.heroes.map((hero) => (hero.id === id ? patch(hero) : hero)) };
}

function updateLight(
  state: GmState,
  id: string,
  patch: (light: LightSource) => LightSource,
): GmState {
  return {
    ...state,
    lights: state.lights.map((light) => (light.id === id ? patch(light) : light)),
  };
}

function lightName(state: GmState, light: LightSource): string {
  const carrier = heroById(state, light.carrierId);
  return `${LIGHT_RULES[light.kind].label}${carrier ? ` (${carrier.name})` : ''}`;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/** Recomputes the morale start from the heroes and keeps the current value in range. */
function syncMoraleStart(state: GmState): GmState {
  const start = moraleStart(state);
  if (start === state.morale.start) return state;
  const wasAtStart = state.morale.current === state.morale.start;
  const current = wasAtStart || state.morale.current > start ? start : state.morale.current;
  return { ...state, morale: { ...state.morale, start, current } };
}

function changeThreat(
  state: GmState,
  delta: number,
  reason: string,
  cite: Cite = CITES.threatLevel,
): GmState {
  if (!state.threat.enabled) {
    return log(
      state,
      'warn',
      `Threat is not used in this quest; ignored ${signed(delta)} (${reason}).`,
    );
  }
  const prev = state.threat.level;
  const floor = threatFloor(state.threat);
  let next = Math.max(floor, prev + delta);
  let note = '';
  if (prev + delta < floor && delta < 0)
    note = ` The Threat Level never goes below ${floor}${state.threat.min !== null ? ' (quest minimum)' : ''}.`;
  if (state.threat.max !== null && next > state.threat.max) {
    next = state.threat.max;
    note += ` Capped at the quest maximum of ${state.threat.max}.`;
  }
  let result: GmState = { ...state, threat: { ...state.threat, level: next } };
  result = log(
    result,
    'threat',
    next === prev
      ? `Threat stays at ${prev} (${reason}).${note}`
      : `Threat ${prev} → ${next} (${reason}).${note}`,
    cite,
  );
  if (next > prev && state.threat.max !== null && next === state.threat.max) {
    result = { ...result, wanderingMonsters: result.wanderingMonsters + 1 };
    result = log(
      result,
      'explore',
      `Threat reached the quest max of ${next}: a Wandering Monster is triggered. Token placed.`,
      CITES.threatMax,
    );
    result = prompt(
      result,
      `wm-max-${result.nextId}`,
      `Wandering Monster appears: Threat reached the quest max of ${next}`,
      { kind: 'wandering_monster', threshold: next, crossed: false },
      {
        detail: `Place the token on the start tile, just outside the door. ${GAPS.maxLevel}`,
        cite: CITES.threatMax,
        severity: 'danger',
      },
    );
  }
  if (next > prev) {
    for (const threshold of state.threat.thresholds) {
      if (next === threshold) {
        result = { ...result, wanderingMonsters: result.wanderingMonsters + 1 };
        result = log(
          result,
          'explore',
          `Threat reached ${threshold}: a Wandering Monster appears (quest rule). Token placed; Threat is not decreased for it.`,
          CITES.questThresholds,
        );
        result = prompt(
          result,
          `wm-${threshold}-${result.nextId}`,
          `Wandering Monster appears: Threat reached ${threshold}`,
          { kind: 'wandering_monster', threshold, crossed: false },
          {
            detail:
              'Place the token on the start tile, just outside the door. Threat is not decreased when this monster is placed.',
            cite: CITES.wanderingMonsters,
            severity: 'danger',
          },
        );
      } else if (prev < threshold && threshold < next) {
        result = prompt(
          result,
          `wm-crossed-${threshold}-${result.nextId}`,
          `Threat went from ${prev} to ${next}, past the quest threshold ${threshold}`,
          { kind: 'wandering_monster', threshold, crossed: true },
          { detail: GAPS.thresholdCrossed, cite: CITES.questThresholds, severity: 'warn' },
        );
      }
    }
  }
  return result;
}

function applyMorale(
  state: GmState,
  delta: number,
  reason: string,
  options: { capAtStart?: boolean; cite?: Cite } = {},
): GmState {
  const prev = state.morale.current;
  let next = Math.max(0, prev + delta);
  let note = '';
  if (options.capAtStart && next > state.morale.start) {
    next = Math.max(prev, state.morale.start);
    note = ' (not above the start value)';
  }
  let result: GmState = { ...state, morale: { ...state.morale, current: next } };
  result = log(
    result,
    'morale',
    `Party Morale ${prev} → ${next} (${reason}${note}).`,
    options.cite ?? CITES.partyMorale,
  );
  const wasWavering = isWavering(state);
  const nowWavering = isWavering(result);
  if (nowWavering && !wasWavering) {
    result = log(
      result,
      'warn',
      `Party Morale is below half of ${result.morale.start}: the party wavers. All heroes suffer -20 RES until it rises above the threshold.`,
      CITES.moraleWavering,
    );
  } else if (wasWavering && !nowWavering) {
    result = log(
      result,
      'morale',
      'Party Morale is back above half: the -20 RES from wavering is removed.',
      CITES.moraleWavering,
    );
  }
  if (next === 0 && prev > 0) {
    result = prompt(
      result,
      'morale-zero',
      'Party Morale is 0: the party flees',
      { kind: 'confirm' },
      {
        detail:
          'The party leaves the dungeon as soon as they are not locked in combat and heads for civilization. Do not move the heroes out; go straight to Travel Events for the journey home.',
        cite: CITES.moraleFlee,
        severity: 'danger',
      },
    );
  } else if (next > 0) {
    result = dropPrompts(result, (p) => p.key === 'morale-zero');
  }
  return result;
}

function loseSanity(
  state: GmState,
  heroId: string,
  amount: number,
  reason: string,
  cite: Cite = CITES.sanity,
): GmState {
  const hero = heroById(state, heroId);
  if (!hero) return log(state, 'warn', `No hero to apply the Sanity loss to (${reason}).`);
  if (hero.dead) return state;
  const prev = hero.sanity;
  const next = Math.max(0, prev - amount);
  let result = updateHero(state, heroId, (h) => ({ ...h, sanity: next }));
  const overshoot =
    prev - amount < 0 ? ' The book does not define Sanity below 0; it stops at 0.' : '';
  result = log(
    result,
    'sanity',
    `${hero.name}: Sanity ${prev} → ${next} (${reason}).${overshoot}`,
    cite,
  );
  if (next === 0 && prev > 0) {
    result = prompt(
      result,
      `sanity-zero-${heroId}`,
      `${hero.name} is at 0 Sanity: roll a mental condition`,
      { kind: 'sanity_condition', heroId },
      {
        detail:
          'Roll 1d10 on the Mental conditions table. A condition the hero already has is rolled again. Sanity then returns to 8 minus the number of conditions.',
        cite: CITES.sanityConditions,
        severity: 'danger',
      },
    );
  }
  return result;
}

function setStatus(state: GmState, heroId: string, status: HeroStatus, on: boolean): GmState {
  const hero = heroById(state, heroId);
  if (!hero) return state;
  const has = hero.statuses.includes(status);
  if (has === on) return state;
  let result = updateHero(state, heroId, (h) => ({
    ...h,
    statuses: on ? [...h.statuses, status] : h.statuses.filter((s) => s !== status),
  }));
  const info = HERO_STATUSES[status];
  result = log(
    result,
    'hero',
    on
      ? `${hero.name} is ${info.label.toLowerCase()}. ${info.reminder}`
      : `${hero.name} is no longer ${info.label.toLowerCase()}.`,
    info.cite,
  );
  return result;
}

function battleStart(
  state: GmState,
  demons: boolean,
  reason: string,
  bag?: InitiativeBagInput,
): GmState {
  let result: GmState = {
    ...state,
    inBattle: true,
    resting: false,
    turn: state.turn + 1,
    turnStep: 1,
  };
  result = dropPrompts(
    result,
    (p) => p.request.kind === 'battle_start' || p.request.kind === 'door',
  );
  result = log(
    result,
    'battle',
    `Battle begins (${reason}). Remaining hero actions are lost and a new turn starts: turn ${result.turn}.`,
    CITES.initiative,
  );
  if (bag) {
    const tokens = initiativeBag(result, bag);
    result = log(
      result,
      'battle',
      `Initiative bag: ${tokens.heroTokens} hero token${tokens.heroTokens === 1 ? '' : 's'} and ${tokens.enemyTokens} enemy token${tokens.enemyTokens === 1 ? '' : 's'} (${bag.enemies} enem${bag.enemies === 1 ? 'y' : 'ies'}).${tokens.notes.length ? ` ${tokens.notes.join(' ')}` : ''}`,
      CITES.initiativeTokens,
    );
  } else {
    result = log(
      result,
      'battle',
      'Put every hero token in the bag with as many enemy tokens as there are enemies (named monsters, a bashed door, Perfect Hearing and a rest ambush add tokens).',
      CITES.initiativeTokens,
    );
  }
  result = log(
    result,
    'info',
    `Each round: pull a token, act, repeat. When the last token is drawn: move Wandering Monsters, refill the bag minus casualties, roll the Scenario die. ${GAPS.battleScenarioStart}`,
    CITES.combatTurn,
  );
  for (const hero of result.heroes) {
    if (!hero.dead && hero.conditions.includes('acute_stress')) {
      result = changeThreat(
        result,
        1,
        `${hero.name} has Acute Stress and screams`,
        CITES.acuteStress,
      );
    }
  }
  if (demons) {
    result = applyMorale(result, -2, 'battle with demons');
    for (const hero of result.heroes) {
      if (!hero.dead) result = loseSanity(result, hero.id, 1, 'battle with a demon');
    }
  }
  return result;
}

// ---------------------------------------------------------------------------------------
// Reducer

export function reduce(state: GmState, event: GmEvent): GmState {
  switch (event.type) {
    case 'reset':
      return initialState();

    case 'note':
      return log(state, 'info', event.text);

    case 'dismiss_prompt': {
      const dismissed = state.pending.find((p) => p.id === event.id);
      let result = dropPrompts(state, (p) => p.id === event.id);
      if (dismissed?.request.kind === 'rest_resolve' && result.resting) {
        result = { ...result, resting: false };
        result = log(
          result,
          'rest',
          'Rest set aside without resolving it; the party is exploring again.',
          CITES.rest,
        );
      }
      return result;
    }

    case 'set_quest': {
      const quest = questById(event.questId);
      let result: GmState = { ...state, questId: event.questId };
      if (!quest) {
        if (state.questId === null) return result;
        result = {
          ...result,
          threat: { ...state.threat, enabled: true, min: null, max: null, thresholds: [] },
          scenarioEnabled: true,
        };
        result = dropPrompts(result, (p) => p.key === 'threat-start');
        return log(
          result,
          'info',
          'No quest chosen: the book’s defaults apply. Threat never below 2, no maximum, no Wandering Monster thresholds, Scenario die on.',
          CITES.threatLevel,
        );
      }
      const threat: ThreatState = {
        enabled: quest.start !== null,
        level: typeof quest.start === 'number' ? quest.start : state.threat.level,
        start: typeof quest.start === 'number' ? quest.start : state.threat.start,
        min:
          quest.min === 'start'
            ? typeof quest.start === 'number'
              ? quest.start
              : null
            : quest.min,
        max: quest.max,
        thresholds: [...quest.thresholds],
      };
      result = { ...result, threat, scenarioEnabled: !quest.noScenarioDie };
      result = log(
        result,
        'info',
        `Quest: ${quest.title} (${quest.chapter}). Threat ${
          quest.start === null
            ? 'not used'
            : `starts at ${quest.start}, minimum ${quest.min === 'start' ? 'the start value' : quest.min}, maximum ${quest.max}`
        }${quest.thresholds.length ? `; Wandering Monster at ${quest.thresholds.join(' and ')}` : ''}.`,
        quest.cite,
      );
      for (const note of quest.notes) result = log(result, 'info', note, quest.cite);
      if (typeof quest.start === 'string') {
        result = prompt(
          result,
          'threat-start',
          `Roll the start Threat Level: ${quest.start}`,
          { kind: 'threat_start', dice: quest.start },
          {
            detail: 'The minimum Threat Level for this quest is the same as the start level.',
            cite: quest.cite,
          },
        );
      } else {
        result = dropPrompts(result, (p) => p.key === 'threat-start');
      }
      return result;
    }

    case 'set_threat_bounds': {
      const threat: ThreatState = {
        ...state.threat,
        ...(event.enabled !== undefined ? { enabled: event.enabled } : {}),
        ...(event.start !== undefined ? { start: event.start } : {}),
        ...(event.min !== undefined ? { min: event.min } : {}),
        ...(event.max !== undefined ? { max: event.max } : {}),
        ...(event.thresholds !== undefined ? { thresholds: [...event.thresholds] } : {}),
      };
      return { ...state, threat };
    }

    case 'set_threat': {
      const quest = questById(state.questId);
      const min = quest?.min === 'start' ? event.level : state.threat.min;
      let result: GmState = {
        ...state,
        threat: { ...state.threat, level: event.level, start: event.level, min, enabled: true },
      };
      result = dropPrompts(result, (p) => p.key === 'threat-start');
      return log(
        result,
        'threat',
        `Threat set to ${event.level}${event.reason ? ` (${event.reason})` : ''}.`,
        CITES.threatLevel,
      );
    }

    case 'threat_adjust':
      return changeThreat(state, event.delta, event.reason, event.cite);

    case 'threat_source': {
      const source = THREAT_SOURCES.find((s) => s.id === event.source);
      if (!source) return state;
      const amount = source.delta ?? event.amount;
      if (amount === undefined) {
        return prompt(
          state,
          `threat-amount-${source.id}`,
          `${source.label}: how much does Threat change?`,
          { kind: 'threat_amount', source: source.id },
          { detail: source.detail, cite: source.cite, severity: 'warn' },
        );
      }
      let result = dropPrompts(state, (p) => p.key === `threat-amount-${source.id}`);
      result = changeThreat(result, amount, source.label.toLowerCase(), source.cite);
      return result;
    }

    case 'threat_roll': {
      const roll = event.value;
      if (!state.threat.enabled) return log(state, 'warn', 'Threat is not used in this quest.');
      const level = state.threat.level;
      let result = dropPrompts(state, (p) => p.request.kind === 'threat_roll');
      result = log(
        result,
        'threat',
        `Threat roll: ${roll} against Threat ${level}${state.inBattle ? ' (in battle)' : ''}.`,
        CITES.threatLevel,
      );
      if (roll === 20) {
        result = changeThreat(result, THREAT.natural20, 'natural 20 on the Threat roll');
      } else if (roll <= level) {
        const table = threatTableFor(state.inBattle);
        result = prompt(
          result,
          'threat-table',
          `Threat roll ${roll} is at or below Threat ${level}: something bad happens`,
          { kind: 'threat_table', inBattle: state.inBattle, roll },
          {
            detail: `Roll ${table.dice} on the "${table.label}" table. The table carries the result out and lowers Threat by the printed amount.`,
            cite: table.cite,
            severity: 'danger',
          },
        );
      } else {
        result = changeThreat(result, THREAT.missIncrease, `Threat roll ${roll} above Threat`);
        if (state.questId === 'quest.great_crypt.tomb_raiders') {
          result = log(
            result,
            'warn',
            'Tomb Raiders: while a hero is in the objective room, a Threat roll above Threat also brings a Wandering Monster.',
            { page: 260, pdf: 262, heading: 'Tomb Raiders — Objective Room Threat exception' },
          );
        }
      }
      // Light sources burn on a Threat roll below Threat.
      const lit = state.lights.filter((l) => l.lit && !l.spent && !l.destroyed);
      if (roll < level && lit.length > 0) {
        for (const light of lit) {
          const name = lightName(result, light);
          if (light.kind === 'torch') {
            result = updateLight(result, light.id, (l) => ({ ...l, lit: false, spent: true }));
            result = log(
              result,
              'light',
              `${name} is spent by the Threat roll below Threat and discarded.`,
              CITES.lightSources,
            );
            result = prompt(
              result,
              `relight-${light.id}`,
              `${name} went out`,
              { kind: 'light_relight', lightId: light.id },
              {
                detail: `Remove it. Lighting a new torch from a Quick Slot takes 1 action, never adjacent to an enemy. Spare torches: ${result.spares.torches}.`,
                cite: CITES.lightSources,
                severity: 'warn',
              },
            );
          } else {
            const halves = light.oilHalves - 1;
            const out = halves <= 0;
            result = updateLight(result, light.id, (l) => ({
              ...l,
              oilHalves: Math.max(0, halves),
              lit: !out,
            }));
            result = log(
              result,
              'light',
              out
                ? `${name} burns its last oil and goes out.`
                : `${name} burns half its oil (one half left).`,
              CITES.lightSources,
            );
            if (out) {
              result = prompt(
                result,
                `relight-${light.id}`,
                `${name} went out`,
                { kind: 'light_relight', lightId: light.id },
                {
                  detail: `Remove it. Refilling from a Quick Slot takes 1 action. Lamp Oil left: ${result.spares.lampOil}.`,
                  cite: CITES.lightSources,
                  severity: 'warn',
                },
              );
            }
          }
        }
        if (lightSummary(result).lit.length === 0) {
          result = log(
            result,
            'warn',
            `No light source is lit. ${GAPS.darkness}`,
            CITES.nightVision,
          );
        }
      } else if (roll === level && lit.length > 0) {
        result = log(
          result,
          'info',
          'The Threat roll equals Threat: the table is rolled, but the light rules say "below Threat", so no torch or lantern is spent.',
          CITES.lightSources,
        );
      }
      return result;
    }

    case 'threat_table_result': {
      let result = dropPrompts(state, (p) => p.key === 'threat-table');
      result = log(
        result,
        'threat',
        `Threat table: ${event.event.trim() || 'event carried out'}.`,
        CITES.threatTables,
      );
      if (event.decrease !== 0)
        result = changeThreat(
          result,
          -Math.abs(event.decrease),
          'Threat table decrease',
          CITES.threatTables,
        );
      return result;
    }

    case 'threat_table_roll': {
      const open = state.pending.find((p) => p.request.kind === 'threat_table');
      const inBattle =
        open && open.request.kind === 'threat_table' ? open.request.inBattle : state.inBattle;
      const table = threatTableFor(inBattle);
      const row = threatTableRow(inBattle, event.value);
      if (!row)
        return log(
          state,
          'warn',
          `${event.value} is not a result on the ${table.dice} Threat table.`,
          table.cite,
        );
      let result = dropPrompts(state, (p) => p.key === 'threat-table');
      result = log(
        result,
        'threat',
        `Threat table (${table.dice}) ${event.value}: ${row.result}`,
        table.cite,
      );
      switch (row.effect) {
        case 'wandering_monster':
          result = { ...result, wanderingMonsters: result.wanderingMonsters + 1 };
          result = prompt(
            result,
            `wm-table-${result.nextId}`,
            'A Wandering Monster has appeared',
            { kind: 'confirm' },
            {
              detail:
                'Token placed. Put it on the start tile, just outside the door; it moves 4 squares after the heroes have acted.',
              cite: CITES.wanderingMonsters,
              severity: 'danger',
            },
          );
          break;
        case 'encounter_risk':
          result = { ...result, encounterBonus: result.encounterBonus + ENCOUNTER.streakBonus };
          result = log(
            result,
            'explore',
            `Encounter risk is now +${result.encounterBonus} in every room and corridor for the rest of the quest (max ${ENCOUNTER.cap}%).`,
            table.cite,
          );
          break;
        case 'trap':
          result = prompt(
            result,
            `trap-${result.nextId}`,
            'A hero has sprung a trap!',
            { kind: 'trap', source: 'threat_table' },
            {
              detail:
                'Draw a trap card and randomise who triggered it. That hero may still avoid it with a Perception roll; if it fails, the trap goes off.',
              cite: CITES.traps,
              severity: 'danger',
            },
          );
          break;
        case 'scenario_bonus':
          if (result.scenarioBonus > 0) {
            result = log(result, 'warn', GAPS.scenarioBonusAgain, table.cite);
          } else {
            result = { ...result, scenarioBonus: 1 };
            result = log(
              result,
              'turn',
              'Every Scenario die roll is now +1 for the remainder of the dungeon.',
              table.cite,
            );
          }
          break;
        default:
          result = prompt(
            result,
            `threat-event-${result.nextId}`,
            row.short,
            { kind: 'confirm' },
            { detail: row.result, cite: table.cite, severity: 'danger' },
          );
      }
      result = changeThreat(result, row.decrease, `Threat table: ${row.short}`, table.cite);
      return result;
    }

    case 'trap_resolve': {
      let result = dropPrompts(state, (p) => p.request.kind === 'trap');
      const hero = heroById(state, event.heroId);
      if (!event.triggered) {
        return log(
          result,
          'explore',
          `${hero ? hero.name : 'The hero'} passed the Perception roll: the trap is found but not set off. Mark the square or the door with a trap token.`,
          CITES.traps,
        );
      }
      if (!hero)
        return log(
          result,
          'warn',
          'Pick the hero who sprang the trap to apply the Party Morale and Sanity losses.',
          CITES.traps,
        );
      result = reduce(result, { type: 'morale_event', event: 'trap', heroId: hero.id });
      return result;
    }

    case 'set_encounter_bonus': {
      const bonus = Math.max(0, Math.trunc(event.bonus));
      if (bonus === state.encounterBonus) return state;
      return log(
        { ...state, encounterBonus: bonus },
        'explore',
        bonus === 0 ? 'Encounter risk bonus cleared.' : `Encounter risk bonus set to +${bonus}.`,
        CITES.threatTableNotInBattle,
      );
    }

    case 'new_level': {
      const level = state.dungeonLevel + 1;
      let result: GmState = { ...state, dungeonLevel: level, inBattle: false, resting: false };
      result = log(result, 'turn', `Dungeon level ${level}.`, CITES.threatNewLevel);
      if (state.threat.enabled && state.threat.level !== state.threat.start) {
        result = {
          ...result,
          threat: {
            ...result.threat,
            level: Math.max(threatFloor(result.threat), result.threat.start),
          },
        };
        result = log(
          result,
          'threat',
          `Threat ${state.threat.level} → ${result.threat.level}: reset for the new level. ${GAPS.newLevelValue}`,
          CITES.threatNewLevel,
        );
      } else if (state.threat.enabled) {
        result = log(
          result,
          'threat',
          `Threat stays at the start value ${state.threat.start}. ${GAPS.newLevelValue}`,
          CITES.threatNewLevel,
        );
      }
      return result;
    }

    case 'pass_entrance': {
      if (state.entrancePassed) return state;
      let result: GmState = { ...state, entrancePassed: true };
      return log(
        result,
        'explore',
        'The party passed the stone-side door of the starting tile. It is unlocked and adds no Threat; the Scenario die is rolled from the next turn on.',
        CITES.initialSetup,
      );
    }

    case 'turn_step': {
      const step = Math.min(TURN_SEQUENCE.length - 1, Math.max(0, Math.trunc(event.step)));
      return step === state.turnStep ? state : { ...state, turnStep: step };
    }

    case 'new_turn': {
      let result: GmState = { ...state, turn: state.turn + 1, turnStep: 0 };
      result = log(
        result,
        'turn',
        state.inBattle ? `Turn ${result.turn} (combat round).` : `Turn ${result.turn}.`,
        state.inBattle ? CITES.combatTurn : CITES.turnSequence,
      );
      if (!state.scenarioEnabled) {
        result = log(result, 'info', 'This quest does not use the Scenario die.');
      } else if (!state.entrancePassed) {
        result = log(
          result,
          'info',
          'No Scenario die yet: it is rolled once the party has passed the first door.',
          CITES.scenarioDie,
        );
      } else {
        const bonus = state.scenarioBonus > 0 ? ` (+${state.scenarioBonus} applies)` : '';
        result = prompt(
          result,
          'scenario',
          state.inBattle
            ? 'Last token drawn: roll the Scenario die (1d10)'
            : 'Roll the Scenario die (1d10)',
          { kind: 'scenario_roll' },
          {
            detail: state.inBattle
              ? `Move Wandering Monsters, refill the bag minus casualties, then roll. On a 9 or 0 a Threat roll follows${bonus}.`
              : `On a 9 or 0 a Threat roll follows${bonus}. Some quests change this level.`,
            cite: state.inBattle ? CITES.combatTurn : CITES.scenarioDie,
          },
        );
      }
      if (state.wanderingMonsters > 0) {
        result = prompt(
          result,
          'wm-move',
          `Move ${state.wanderingMonsters === 1 ? 'the Wandering Monster token' : `${state.wanderingMonsters} Wandering Monster tokens`} after the heroes act`,
          { kind: 'confirm' },
          {
            detail:
              'Each token moves 4 squares. Roll 1d6: on a 1 it moves back or through a random door away from the heroes; on 2–6 towards them. Closed doors and chasms stop it. Entering a room with heroes in LOS within 10 squares reveals the quest monsters.',
            cite: CITES.wanderingMonsters,
          },
        );
      }
      return result;
    }

    case 'scenario_roll': {
      const raw = event.value;
      const value = raw + state.scenarioBonus;
      let result = dropPrompts(state, (p) => p.key === 'scenario');
      if (!state.entrancePassed)
        result = log(
          result,
          'warn',
          'The Scenario die is not rolled before the party passes the first door.',
          CITES.scenarioDie,
        );
      result = { ...result, scenarioTurn: state.turn };
      result = log(
        result,
        'turn',
        `Scenario die: ${raw === 10 ? '0 (10)' : raw}${state.scenarioBonus > 0 ? ` +${state.scenarioBonus} = ${value}` : ''}.${raw >= 9 ? ' Any active Speed spell ends on a 9 or 0.' : ''}`,
        CITES.scenarioDie,
      );
      if (value >= state.scenarioTrigger && state.threat.enabled) {
        result = prompt(
          result,
          'threat-roll',
          'Make a Threat roll (1d20)',
          { kind: 'threat_roll' },
          {
            detail: `20 lowers Threat by 5. A result at or below Threat (${state.threat.level}) means something bad happens. Above it, Threat rises by 1. Lit torches and lanterns burn on a result below Threat.`,
            cite: CITES.threatLevel,
            severity: 'warn',
          },
        );
      }
      // Jumpy reads the die itself: the printed 0 face, not the result after the table's +1.
      if (raw === 10) {
        for (const hero of state.heroes) {
          if (!hero.dead && hero.conditions.includes('jumpy'))
            result = changeThreat(
              result,
              2,
              `${hero.name} is Jumpy and screams at the noise`,
              CITES.jumpy,
            );
        }
      }
      return result;
    }

    case 'scenario_request': {
      if (!state.scenarioEnabled || !state.entrancePassed || state.turn === 0) return state;
      if (state.pending.some((p) => p.request.kind === 'scenario_roll')) return state;
      return prompt(
        state,
        'scenario',
        'Roll the Scenario die (1d10)',
        { kind: 'scenario_roll' },
        { detail: 'On a 9 or 0 a Threat roll follows.', cite: CITES.scenarioDie },
      );
    }

    case 'sanity_condition_request': {
      const hero = heroById(state, event.heroId);
      if (!hero || hero.dead || hero.sanity !== 0) return state;
      if (
        state.pending.some(
          (p) => p.request.kind === 'sanity_condition' && p.request.heroId === hero.id,
        )
      )
        return state;
      return prompt(
        state,
        `sanity-zero-${hero.id}`,
        `${hero.name} is at 0 Sanity: roll a mental condition`,
        { kind: 'sanity_condition', heroId: hero.id },
        {
          detail:
            'Roll 1d10 on the Mental conditions table. A condition the hero already has is rolled again. Sanity then returns to 8 minus the number of conditions.',
          cite: CITES.sanityConditions,
          severity: 'danger',
        },
      );
    }

    case 'hero_recover': {
      const hero = heroById(state, event.id);
      if (!hero || !hero.statuses.includes('bleeding_out')) return state;
      let result = updateHero(state, event.id, (h) => ({
        ...h,
        statuses: h.statuses.filter((s) => s !== 'bleeding_out'),
      }));
      result = {
        ...result,
        pending: result.pending
          .map((p) =>
            p.request.kind === 'bleeding'
              ? {
                  ...p,
                  request: {
                    ...p.request,
                    heroIds: p.request.heroIds.filter((id) => id !== event.id),
                  },
                }
              : p,
          )
          .filter((p) => p.request.kind !== 'bleeding' || p.request.heroIds.length > 0),
      };
      return log(result, 'hero', `${hero.name} is back on their feet.`, CITES.bleedingOut);
    }

    case 'set_in_battle': {
      if (state.inBattle === event.inBattle) return state;
      return log(
        { ...state, inBattle: event.inBattle },
        'battle',
        event.inBattle ? 'Marked as in battle.' : 'Marked as not in battle.',
      );
    }

    case 'battle_start':
      return battleStart(
        state,
        event.demons,
        event.demons ? 'demons' : 'enemies placed',
        event.bag,
      );

    case 'battle_end': {
      let result: GmState = { ...state, inBattle: false };
      result = log(
        result,
        'battle',
        `Battle ends${event.won ? ', won' : ''}. The heroes continue the turn with their remaining actions.`,
        CITES.endOfBattle,
      );
      if (event.won && state.threat.enabled)
        result = changeThreat(result, THREAT.battleWon, 'battle won', CITES.threatIncrease);
      const bleeding = result.heroes.filter((h) => !h.dead && h.statuses.includes('bleeding_out'));
      if (bleeding.length > 0) {
        result = prompt(
          result,
          'bandage',
          `Bleeding out after the battle: ${bleeding.map((h) => h.name).join(', ')}`,
          { kind: 'bleeding', heroIds: bleeding.map((h) => h.id), context: 'battle' },
          {
            detail:
              'A standing companion who is not knocked out may bandage a bleeding hero. With standing companions but no means of help, the hero dies.',
            cite: CITES.bleedingOut,
            severity: 'danger',
          },
        );
      }
      return result;
    }

    case 'door_open': {
      if (event.entrance) return reduce(state, { type: 'pass_entrance' });
      const chest = event.chest === true;
      let result = changeThreat(state, 1, chest ? 'chest opened' : 'door opened', CITES.openDoor);
      result = prompt(
        result,
        'door',
        chest ? 'Chest opened' : 'Door opened',
        { kind: 'door', chest, rolled: null },
        {
          detail: `Threat is up by 1. Now roll 1d10 and 1d6 together: a ${DOOR.trapOn} on the d6 means a trap, the d10 reads the Door Table.`,
          cite: CITES.openDoor,
        },
      );
      return result;
    }

    case 'door_roll': {
      const open = state.pending.find((p) => p.request.kind === 'door');
      if (!open || open.request.kind !== 'door') return state;
      const chest = open.request.chest;
      const row = doorTableRow(event.d10);
      if (!row) return state;
      const trapped = event.d6 === DOOR.trapOn;
      const rolled: DoorRoll = {
        d10: event.d10,
        d6: event.d6,
        trapped,
        locked: row.locked,
        difficulty: row.difficulty,
      };
      const thing = chest ? 'chest' : 'door';
      let result = log(
        state,
        'explore',
        `${chest ? 'Chest' : 'Door'}: d6 ${event.d6}${trapped ? ' (trapped!)' : ''}, d10 ${event.d10 === 10 ? '0' : event.d10}: ${row.locked ? `locked, ${row.difficulty}` : 'open'}.`,
        CITES.doorTable,
      );
      if (trapped) {
        result = log(
          result,
          'warn',
          `Trapped ${thing}: draw a trap card. The opener makes a Perception roll with the card's modifier; the ${thing} cannot be opened until the trap is dealt with (disarm: 2 AP with Pick Locks).`,
          CITES.traps,
        );
        result = prompt(
          result,
          `trap-${result.nextId}`,
          `Trapped ${thing}: the opener's Perception roll`,
          { kind: 'trap', source: chest ? 'chest' : 'door' },
          {
            detail: `Draw a trap card. The hero opening the ${thing} rolls Perception with the card's modifier: success finds the trap without setting it off (disarm it for 2 AP with Pick Locks, or set it off deliberately); failure triggers it.`,
            cite: CITES.traps,
            severity: 'danger',
          },
        );
      }
      if (row.locked)
        result = log(
          result,
          'explore',
          `Locked ${thing} (${row.difficulty}): force it (1 AP, +${DOOR.forceThreat} Threat per attempt), use a crowbar (+${DOOR.crowbarThreat} Threat, ${DOOR.crowbarDamage} damage per turn), or pick the lock (${DOOR.pickActions} AP, no Threat; a failed pick breaks, a fumble jams the lock).`,
          CITES.lockedDoor,
        );
      const detail = chest
        ? `${trapped ? 'Deal with the trap, then ' : ''}${row.locked ? `${trapped ? 'g' : 'G'}et past the lock, then ` : ''}${trapped || row.locked ? 'r' : 'R'}oll 1d10 on the Chest table (the Objective Chest table for an objective chest) for the contents.`
        : `${trapped ? 'Deal with the trap. ' : ''}${row.locked ? 'Get past the lock. ' : ''}Then flip the top Exploration Card, place the tile and roll for enemies.`;
      result = {
        ...result,
        pending: result.pending.map((p) =>
          p.id === open.id ? { ...p, detail, request: { kind: 'door', chest, rolled } } : p,
        ),
      };
      if (chest) {
        // A chest ends with the treasure roll; the tile step is only for doors.
        result = dropPrompts(result, (p) => p.id === open.id);
        result = prompt(
          result,
          'chest',
          'Chest: roll for the contents',
          { kind: 'chest', rolled: null },
          {
            detail,
            cite: CITES.chestTable,
            severity: trapped || row.locked ? 'warn' : 'info',
          },
        );
      }
      return result;
    }

    case 'chest_roll': {
      const open = state.pending.find((p) => p.request.kind === 'chest');
      if (!open || open.request.kind !== 'chest' || open.request.rolled) return state;
      const table = CHEST_TABLES[event.table];
      const row = chestTableRow(event.table, event.d10);
      if (!row) return state;
      let result = log(
        state,
        'explore',
        `${table.title}: d10 ${event.d10 === 10 ? '0' : event.d10}: ${row.result}`,
        table.cite,
      );
      // Each treasure found is its own Party Morale event.
      for (let i = 0; i < row.wonderful; i += 1)
        result = reduce(result, { type: 'morale_event', event: 'wonderful_treasure' });
      for (let i = 0; i < row.fine; i += 1)
        result = reduce(result, { type: 'morale_event', event: 'fine_treasure' });
      const draws = treasureDraws(row);
      return {
        ...result,
        pending: result.pending.map((p) =>
          p.id === open.id
            ? {
                ...p,
                title: draws ? `Chest: draw ${draws}` : 'Chest: empty',
                detail: draws
                  ? `Draw ${draws} from the Treasure Card piles.`
                  : 'Nothing of value inside.',
                cite: table.cite,
                request: {
                  kind: 'chest',
                  rolled: { table: event.table, d10: event.d10, rowId: row.id },
                },
              }
            : p,
        ),
      };
    }

    case 'tile_revealed': {
      const chance = encounterChance(event.kind, state.encounterStreak, state.encounterBonus);
      const encounter =
        event.roll !== undefined
          ? encounterRolled(event.kind, state.encounterStreak, event.roll, state.encounterBonus)
          : event.encounter === true;
      const rolled =
        event.roll !== undefined
          ? `rolled ${event.roll} against ${chance}%`
          : `chance was ${chance}%`;
      let result = dropPrompts(state, (p) => p.key === 'door');
      result = {
        ...result,
        lastTile: {
          kind: event.kind,
          chance,
          roll: event.roll ?? null,
          encounter,
          turn: state.turn,
        },
      };
      if (encounter) {
        result = { ...result, encounterStreak: 0 };
        result = log(
          result,
          'explore',
          `${event.kind === 'room' ? 'Room' : 'Corridor'} revealed with enemies (${rolled}). The turn ends immediately.`,
          CITES.encounters,
        );
        result = prompt(
          result,
          'battle-start',
          'Enemies placed: start the battle',
          { kind: 'battle_start', reason: 'encounter' },
          {
            detail:
              'Put the hero tokens in the bag with as many enemy tokens as there are enemies, then start a new turn. Tell the table if the enemies are demons.',
            cite: CITES.initiative,
            severity: 'warn',
          },
        );
      } else {
        const streak = state.encounterStreak + 1;
        result = { ...result, encounterStreak: streak };
        result = log(
          result,
          'explore',
          `${event.kind === 'room' ? 'Room' : 'Corridor'} revealed, empty (${rolled}). ${streak} encounter-free tile${streak === 1 ? '' : 's'} in a row${
            streak >= ENCOUNTER.streakTiles ? ': the next encounter roll gets +10 (max 70%)' : ''
          }.`,
          CITES.encounters,
        );
      }
      return result;
    }

    case 'wm_place': {
      let result: GmState = { ...state, wanderingMonsters: state.wanderingMonsters + 1 };
      result = dropPrompts(result, (p) => p.request.kind === 'wandering_monster');
      return log(
        result,
        'explore',
        'Wandering Monster token placed on the start tile, just outside the door.',
        CITES.wanderingMonsters,
      );
    }

    case 'wm_remove': {
      if (state.wanderingMonsters === 0) return state;
      let result: GmState = { ...state, wanderingMonsters: state.wanderingMonsters - 1 };
      if (result.wanderingMonsters === 0) result = dropPrompts(result, (p) => p.key === 'wm-move');
      return log(result, 'explore', 'Wandering Monster token removed.', CITES.wanderingMonsters);
    }

    case 'light_add': {
      const [next, id] = nextId(state, 'light');
      const rules = LIGHT_RULES[event.kind];
      const light: LightSource = {
        id,
        kind: event.kind,
        carrierId: event.carrierId,
        lit: event.lit,
        oilHalves: rules.oilHalves ?? 0,
        spent: false,
        destroyed: false,
      };
      let result: GmState = { ...next, lights: [...next.lights, light] };
      return log(
        result,
        'light',
        `${lightName(result, light)} added${event.lit ? ', lit' : ''}.`,
        CITES.lightSources,
      );
    }

    case 'light_remove': {
      const light = state.lights.find((l) => l.id === event.id);
      if (!light) return state;
      let result: GmState = { ...state, lights: state.lights.filter((l) => l.id !== event.id) };
      result = dropPrompts(result, (p) => p.key === `relight-${event.id}`);
      return log(result, 'light', `${lightName(state, light)} removed.`);
    }

    case 'light_set_lit': {
      const light = state.lights.find((l) => l.id === event.id);
      if (!light || light.lit === event.lit) return state;
      if (
        event.lit &&
        (light.spent || light.destroyed || (light.kind !== 'torch' && light.oilHalves <= 0))
      )
        return reduce(state, { type: 'light_relight', id: event.id });
      let result = updateLight(state, event.id, (l) => ({ ...l, lit: event.lit }));
      result = log(
        result,
        'light',
        `${lightName(state, light)} ${event.lit ? 'lit' : 'put out'}.`,
        CITES.lightSources,
      );
      if (!event.lit && lightSummary(result).lit.length === 0)
        result = log(result, 'warn', `No light source is lit. ${GAPS.darkness}`, CITES.nightVision);
      return result;
    }

    case 'light_relight': {
      const light = state.lights.find((l) => l.id === event.id);
      if (!light) return state;
      const name = lightName(state, light);
      if (light.kind === 'torch') {
        if (state.spares.torches < 1)
          return log(state, 'warn', `No spare torches to light for ${name}.`, CITES.lightSources);
        let result: GmState = {
          ...state,
          spares: { ...state.spares, torches: state.spares.torches - 1 },
        };
        result = updateLight(result, event.id, (l) => ({ ...l, lit: true, spent: false }));
        result = dropPrompts(result, (p) => p.key === `relight-${event.id}`);
        return log(
          result,
          'light',
          `New torch lit for ${name} (1 action, not adjacent to an enemy). Spare torches left: ${result.spares.torches}.`,
          CITES.lightSources,
        );
      }
      return reduce(state, { type: 'light_refill', id: event.id });
    }

    case 'light_refill': {
      const light = state.lights.find((l) => l.id === event.id);
      if (!light || light.kind === 'torch') return state;
      const name = lightName(state, light);
      if (light.destroyed)
        return log(state, 'warn', `${name} is destroyed and cannot be refilled.`);
      if (state.spares.lampOil < 1)
        return log(state, 'warn', `No Lamp Oil left to refill ${name}.`, CITES.lightSources);
      let result: GmState = {
        ...state,
        spares: { ...state.spares, lampOil: state.spares.lampOil - 1 },
      };
      result = updateLight(result, event.id, (l) => ({ ...l, oilHalves: 2, lit: true }));
      result = dropPrompts(result, (p) => p.key === `relight-${event.id}`);
      return log(
        result,
        'light',
        `${name} refilled and lit (1 action from a Quick Slot). Lamp Oil left: ${result.spares.lampOil}.`,
        CITES.lightSources,
      );
    }

    case 'light_attack_roll': {
      const light = state.lights.find((l) => l.id === event.id);
      if (!light || light.kind !== 'torch' || !light.lit) return state;
      if (event.roll < 90)
        return log(
          state,
          'light',
          `${lightName(state, light)} swung (roll ${event.roll}): still burning.`,
          CITES.lightSources,
        );
      let result = updateLight(state, event.id, (l) => ({ ...l, lit: false, spent: true }));
      result = log(
        result,
        'light',
        `${lightName(state, light)}: unmodified attack roll ${event.roll} extinguishes it; discard it.`,
        CITES.lightSources,
      );
      result = prompt(
        result,
        `relight-${event.id}`,
        `${lightName(state, light)} went out`,
        { kind: 'light_relight', lightId: event.id },
        {
          detail: `Lighting a new torch from a Quick Slot takes 1 action, never adjacent to an enemy. Spare torches: ${result.spares.torches}.`,
          cite: CITES.lightSources,
          severity: 'warn',
        },
      );
      if (lightSummary(result).lit.length === 0)
        result = log(result, 'warn', `No light source is lit. ${GAPS.darkness}`, CITES.nightVision);
      return result;
    }

    case 'light_carrier':
      return updateLight(state, event.id, (l) => ({ ...l, carrierId: event.carrierId }));

    case 'set_spares':
      return {
        ...state,
        spares: {
          torches: Math.max(0, event.torches ?? state.spares.torches),
          lampOil: Math.max(0, event.lampOil ?? state.spares.lampOil),
        },
      };

    case 'hero_add': {
      const [next, id] = nextId(state, 'hero');
      const hero: Hero = {
        id,
        name: event.name.trim() || `Hero ${next.heroes.length + 1}`,
        resolve: event.resolve,
        nightVision: event.nightVision,
        sanity: SANITY.start,
        sanityMax: SANITY.start,
        conditions: [],
        statuses: [],
        dead: false,
      };
      let result: GmState = { ...next, heroes: [...next.heroes, hero] };
      result = syncMoraleStart(result);
      return log(result, 'hero', `${hero.name} joins the party (RES ${hero.resolve}).`);
    }

    case 'hero_update': {
      const hero = heroById(state, event.id);
      if (!hero) return state;
      let result = updateHero(state, event.id, (h) => ({ ...h, ...event.patch }));
      if (event.patch.resolve !== undefined) result = syncMoraleStart(result);
      return result;
    }

    case 'hero_remove': {
      const hero = heroById(state, event.id);
      if (!hero) return state;
      let result: GmState = {
        ...state,
        heroes: state.heroes.filter((h) => h.id !== event.id),
        lights: state.lights.map((l) => (l.carrierId === event.id ? { ...l, carrierId: null } : l)),
      };
      result = dropPrompts(
        result,
        (p) => p.request.kind === 'sanity_condition' && p.request.heroId === event.id,
      );
      result = syncMoraleStart(result);
      return log(result, 'hero', `${hero.name} leaves the party.`);
    }

    case 'hero_status':
      return setStatus(state, event.id, event.status, event.on);

    case 'hero_head_wound': {
      const hero = heroById(state, event.id);
      if (!hero) return state;
      let result = loseSanity(state, event.id, 1, 'wound to the head');
      for (const light of state.lights) {
        if (light.kind === 'headlamp' && light.carrierId === event.id && !light.destroyed) {
          result = updateLight(result, light.id, (l) => ({ ...l, destroyed: true, lit: false }));
          result = log(
            result,
            'light',
            `${hero.name}’s headlamp is destroyed by the hit to the head.`,
            CITES.lightSources,
          );
        }
      }
      if (lightSummary(result).lit.length === 0 && lightSummary(state).lit.length > 0)
        result = log(result, 'warn', `No light source is lit. ${GAPS.darkness}`, CITES.nightVision);
      return result;
    }

    case 'hero_condition_remove': {
      const hero = heroById(state, event.id);
      if (!hero || !hero.conditions.includes(event.condition)) return state;
      const condition = MENTAL_CONDITIONS.find((c) => c.id === event.condition);
      let result = updateHero(state, event.id, (h) => ({
        ...h,
        conditions: h.conditions.filter((c) => c !== event.condition),
      }));
      return log(result, 'sanity', `${hero.name}: ${condition?.name ?? event.condition} removed.`);
    }

    case 'morale_event': {
      const row = MORALE_EVENTS.find((m) => m.id === event.event);
      if (!row) return state;
      const hero = heroById(state, event.heroId);
      const who = hero ? hero.name : row.perHero ? 'a hero' : 'the party';
      // The table prints +1 for a short rest; the rest checklist (p. 98) gives +2 up to the start
      // value and the corpus follows it, so the rest flow and this row agree.
      const delta = row.ruled ?? row.effect;
      let result = applyMorale(
        state,
        delta,
        `${hero && row.perHero ? `${row.situation}: ${who}` : row.situation}${row.ruling ? `; ${row.ruling}` : ''}`,
        {
          capAtStart: row.id === 'short_rest',
          ...(row.id === 'short_rest' ? { cite: CITES.rest } : {}),
        },
      );
      if (row.sanity) {
        if (row.sanity.kind === 'party') {
          for (const h of result.heroes)
            if (!h.dead)
              result = loseSanity(result, h.id, row.sanity.loss, row.situation.toLowerCase());
        } else if (row.sanity.kind === 'hero') {
          if (hero)
            result = loseSanity(result, hero.id, row.sanity.loss, row.situation.toLowerCase());
          else
            result = log(
              result,
              'warn',
              `Pick the hero to apply the ${row.sanity.loss} Sanity loss (${row.situation}).`,
              CITES.sanity,
            );
        } else {
          result = prompt(
            result,
            `miscast-${result.nextId}`,
            `${who} miscast a spell: roll on the Miscast table`,
            { kind: 'confirm' },
            { detail: SANITY.miscastRuling, cite: CITES.miscastRuling, severity: 'warn' },
          );
        }
      }
      if (hero) {
        if (row.status === 'dead') {
          result = updateHero(result, hero.id, (h) => ({ ...h, dead: true }));
          result = {
            ...result,
            lights: result.lights.map((l) => (l.carrierId === hero.id ? { ...l, lit: false } : l)),
          };
          result = log(
            result,
            'hero',
            `${hero.name} dies. ${GAPS.deathStartValue}`,
            CITES.bleedingOut,
          );
        } else if (row.status) {
          result = setStatus(result, hero.id, row.status, true);
        } else if (row.id === 'poison_or_disease' && event.status) {
          result = setStatus(result, hero.id, event.status, true);
        }
        if (row.id === 'zero_hp') {
          result = prompt(
            result,
            `injury-${hero.id}-${result.nextId}`,
            `${hero.name} at 0 HP: roll the permanent injury`,
            { kind: 'confirm' },
            {
              detail: `${INJURY.permanent} Knocked down and bleeding out: a companion's spell or a ready potion can bring them back during the battle; afterwards a standing companion may bandage them.`,
              cite: INJURY.cite,
              severity: 'danger',
            },
          );
          const living = result.heroes.filter((h) => !h.dead);
          if (living.length > 0 && living.every((h) => h.statuses.includes('bleeding_out')))
            result = log(
              result,
              'warn',
              'Every hero is bleeding out at the same time: the quest is lost and the heroes die.',
              CITES.partyLoss,
            );
        }
      }
      if (row.id === 'dwarven_ale') {
        result = { ...result, dwarvenAle: true };
        result = log(result, 'info', `Dwarven Ale: ${MORALE.dwarvenAle}`, CITES.consumables);
      }
      return result;
    }

    case 'morale_adjust':
      return applyMorale(state, event.delta, event.reason, {
        ...(event.capAtStart !== undefined ? { capAtStart: event.capAtStart } : {}),
        ...(event.cite ? { cite: event.cite } : {}),
      });

    case 'set_morale': {
      let result: GmState = {
        ...state,
        morale: {
          ...state.morale,
          ...(event.startOverride !== undefined ? { startOverride: event.startOverride } : {}),
          ...(event.naturalLeader !== undefined ? { naturalLeader: event.naturalLeader } : {}),
          ...(event.powerstone !== undefined ? { powerstone: event.powerstone } : {}),
        },
      };
      result = syncMoraleStart(result);
      if (event.current !== undefined)
        result = { ...result, morale: { ...result.morale, current: Math.max(0, event.current) } };
      return result;
    }

    case 'sanity_loss':
      return loseSanity(state, event.heroId, event.amount, event.reason, event.cite);

    case 'sanity_condition_roll': {
      const hero = heroById(state, event.heroId);
      const condition = conditionForRoll(event.value);
      if (!hero || !condition) return state;
      let result = dropPrompts(state, (p) => p.key === `sanity-zero-${hero.id}`);
      if (hero.conditions.includes(condition.id)) {
        result = log(
          result,
          'sanity',
          `${hero.name} rolled ${condition.printed}: ${condition.name}, already diagnosed. Roll again.`,
          CITES.sanityConditions,
        );
        return prompt(
          result,
          `sanity-zero-${hero.id}`,
          `${hero.name}: ${condition.name} is a duplicate, roll again`,
          { kind: 'sanity_condition', heroId: hero.id, duplicateOf: condition.id },
          { cite: CITES.sanityConditions, severity: 'danger' },
        );
      }
      const conditions = [...hero.conditions, condition.id];
      const reset = SANITY.start - conditions.length;
      result = updateHero(result, hero.id, (h) => ({
        ...h,
        conditions,
        sanity: Math.max(0, reset),
        sanityMax: Math.max(0, reset),
      }));
      result = log(
        result,
        'sanity',
        `${hero.name} rolled ${condition.printed}: ${condition.name}. ${condition.effect} Sanity resets to ${reset} (8 minus ${conditions.length} condition${conditions.length === 1 ? '' : 's'}).`,
        CITES.mentalConditions,
      );
      if (reset <= 0)
        result = log(
          result,
          'warn',
          'The book does not define a Sanity reset of 0 or less.',
          CITES.sanityConditions,
        );
      return result;
    }

    case 'set_rations':
      return { ...state, rations: Math.max(0, event.rations) };

    case 'rest_begin': {
      if (state.inBattle)
        return log(
          state,
          'warn',
          'The party cannot rest with enemies on their tile or an adjacent tile.',
          CITES.rest,
        );
      if (state.rations < REST.rationCost)
        return log(
          state,
          'warn',
          'A short rest costs one ration of food, and the party has none.',
          CITES.rest,
        );
      const restsTaken = state.restsTaken + 1;
      let result: GmState = {
        ...state,
        rations: state.rations - REST.rationCost,
        restsTaken,
        resting: true,
      };
      const risk = ambushRisk(state.threat.level, restsTaken);
      result = log(
        result,
        'rest',
        `Short rest ${restsTaken} begins: 1 ration eaten (${result.rations} left). Arrange the heroes on the tile, bar the door if you wish, rearrange gear, then move each Wandering Monster token 3 times.`,
        CITES.rest,
      );
      result = prompt(
        result,
        'rest',
        'Resolve the rest',
        { kind: 'rest_resolve', risk },
        {
          detail: `Was the rest interrupted by a Wandering Monster spotting the party? If not: Party Morale +2 (up to the start value), every hero regains 1d6 HP, each lost Energy Point returns on a 1–3, Mana is refilled and alchemists may brew. Then roll 1d100: ambush on ${risk}% or less (5 + Threat ${state.threat.level}${restsTaken > 1 ? ` + ${(restsTaken - 1) * 10} for rest ${restsTaken}` : ''}).`,
          cite: CITES.rest,
          severity: 'warn',
        },
      );
      return result;
    }

    case 'rest_resolve': {
      const risk = ambushRisk(state.threat.level, state.restsTaken);
      let result: GmState = dropPrompts({ ...state, resting: false }, (p) => p.key === 'rest');
      if (event.interrupted) {
        result = log(
          result,
          'rest',
          'The rest is interrupted: a Wandering Monster spotted the party. The food is still eaten and the party may freely adjust its equipment before the battle.',
          CITES.rest,
        );
        return prompt(
          result,
          'battle-start',
          'Rest interrupted: start the battle',
          { kind: 'battle_start', reason: 'rest interrupted' },
          { cite: CITES.rest, severity: 'warn' },
        );
      }
      result = applyMorale(result, MORALE.restBonus, 'short rest', {
        capAtStart: true,
        cite: CITES.rest,
      });
      result = log(
        result,
        'rest',
        'Rest completed: each hero regains 1d6 HP, each lost Energy Point returns on a 1–3 on 1d6, Mana is fully regained, gear may be rearranged and alchemists may mix potions.',
        CITES.rest,
      );
      for (const hero of result.heroes) {
        if (hero.dead) continue;
        if (hero.statuses.includes('bleeding_out'))
          result = prompt(
            result,
            `rest-bleeding-${hero.id}`,
            `${hero.name} is bleeding out untreated: CON+10 test or die`,
            { kind: 'bleeding', heroIds: [hero.id], context: 'rest' },
            {
              detail: 'If the test succeeds, the hero regains 1d4 HP.',
              cite: CITES.restBleeding,
              severity: 'danger',
            },
          );
        if (hero.statuses.includes('poisoned'))
          result = prompt(
            result,
            `rest-poison-${hero.id}`,
            `${hero.name} is poisoned: make the remaining Poison Tests`,
            { kind: 'confirm' },
            { cite: CITES.restPoison, severity: 'warn' },
          );
      }
      if (event.ambushRoll !== undefined) {
        if (event.ambushRoll <= risk) {
          result = log(
            result,
            'rest',
            `Ambush roll ${event.ambushRoll} against ${risk}%: the party is ambushed!`,
            CITES.rest,
          );
          result = prompt(
            result,
            'battle-start',
            'Ambushed during the rest: start the battle',
            { kind: 'battle_start', reason: 'ambush', barred: event.barred },
            {
              detail: `Roll on the encounter table and place the enemies just outside the door the heroes came through. ${
                event.barred
                  ? 'The door was barred: it still opens, but all heroes start standing and the enemies have only their normal initiative tokens.'
                  : 'Randomise one hero who is awake and ready; the others start prone. The enemies get 3 extra initiative tokens.'
              }`,
              cite: CITES.rest,
              severity: 'danger',
            },
          );
        } else {
          result = log(
            result,
            'rest',
            `Ambush roll ${event.ambushRoll} against ${risk}%: no ambush.`,
            CITES.rest,
          );
        }
      } else {
        result = log(
          result,
          'warn',
          `Roll 1d100 for an ambush: ${risk}% or less means the party is ambushed.`,
          CITES.rest,
        );
      }
      if (state.scenarioEnabled && state.entrancePassed) {
        result = prompt(
          result,
          'scenario',
          'Roll the Scenario die for the rest (1d10)',
          { kind: 'scenario_roll' },
          {
            detail: 'The Scenario die is rolled when the party takes a short rest.',
            cite: CITES.scenarioDie,
          },
        );
      }
      return result;
    }
  }
}

/** Applies several events in order. */
export function reduceAll(state: GmState, events: GmEvent[]): GmState {
  return events.reduce(reduce, state);
}

/** Restores a persisted state, or starts fresh when the shape is unknown. Version 1 tables carry over. */
export function reviveState(value: unknown): GmState {
  if (typeof value !== 'object' || value === null) return initialState();
  const candidate = value as Partial<Omit<GmState, 'version'>> & { version?: unknown };
  if (!Array.isArray(candidate.heroes)) return initialState();
  if (candidate.version === 1) {
    const { version: _old, ...rest } = candidate;
    void _old;
    return { ...initialState(), ...rest, version: STATE_VERSION };
  }
  if (candidate.version !== STATE_VERSION) return initialState();
  return { ...initialState(), ...candidate, version: STATE_VERSION };
}
