/**
 * The character creator's state and the pure functions that turn it into a filled-in sheet.
 * A party holds one sheet per hero; every number a sheet shows is derived here from
 * `rules.ts` facts and the player's choices and dice. The components only render.
 * `tests/character-engine.test.ts` covers it.
 */
import {
  ARMOUR_BY_ID,
  BACKGROUNDS,
  BODY_AREAS,
  CARRY,
  CREATION,
  DAMAGE_BONUS,
  GEAR_BY_ID,
  NATURAL_ARMOUR,
  PARTS,
  PROFESSIONS,
  SHIELD_BY_ID,
  SKILLS,
  SPECIES,
  STANDARD_POTIONS,
  STAT_KEYS,
  TALENT_BY_ID,
  WEAPON_BY_ID,
  WEAPON_CLASSES,
  coveredAreas,
  type Armour,
  type Background,
  type BodyArea,
  type CatalogueKind,
  type Cite,
  type Gear,
  type Profession,
  type ProfessionId,
  type Shield,
  type SkillId,
  type Species,
  type SpeciesId,
  type StatKey,
  type Stats,
  type Talent,
  type TalentCategory,
  type Weapon,
} from './rules.ts';
import { CITES } from './rules.ts';

/** One die the player rolled; `reroll` is the replacement die, when one of the two rerolls was spent on it. */
export interface DieRoll {
  value: number | null;
  reroll: number | null;
}

export type RollMode = 'in_order' | 'assign';

/** The stations of the creator, in the book's order. */
export type StationId =
  | 'species'
  | 'dice'
  | 'specialise'
  | 'profession'
  | 'powers'
  | 'background'
  | 'market'
  | 'loadout'
  | 'sheet';

export interface Station {
  id: StationId;
  label: string;
  /** The question the station answers, as a kicker above the card. */
  question: string;
  cite: Cite;
}

export const STATIONS: readonly Station[] = [
  { id: 'species', label: 'Species', question: 'Who is this hero?', cite: CITES.speciesFirst },
  { id: 'dice', label: 'Dice', question: 'What did the dice say?', cite: CITES.rollStats },
  {
    id: 'specialise',
    label: 'Specialise',
    question: 'Where do the 15 points go?',
    cite: CITES.specialisation,
  },
  {
    id: 'profession',
    label: 'Profession',
    question: 'What is their trade?',
    cite: CITES.professionTalents,
  },
  {
    id: 'powers',
    label: 'Powers',
    question: 'Talents, perks, spells and prayers',
    cite: CITES.spellsAndPrayers,
  },
  {
    id: 'background',
    label: 'Background',
    question: 'Extra spice?',
    cite: CITES.backgroundOptional,
  },
  {
    id: 'market',
    label: 'Market',
    question: 'What do 150 coins buy?',
    cite: CITES.startingEquipment,
  },
  {
    id: 'loadout',
    label: 'Loadout',
    question: 'Worn, carried, and how worn out?',
    cite: CITES.wear,
  },
  {
    id: 'sheet',
    label: 'Sheet',
    question: 'Copy it onto the character sheet',
    cite: CITES.finalTouches,
  },
];
export const STATION_BY_ID: ReadonlyMap<StationId, Station> = new Map(
  STATIONS.map((s) => [s.id, s]),
);

/** Kept for callers that still think in the old seven steps. */
export type StepId = StationId;
export const STEPS = STATIONS;

export type PurchaseKind = CatalogueKind | 'shield' | 'gear' | 'other';

export interface Purchase {
  key: string;
  kind: PurchaseKind;
  /** Catalogue id for weapons, armour, shields and general gear. */
  id?: string;
  /** A printed price option, e.g. the Healing Potion's "Standard (1d6)". */
  variant?: string;
  label: string;
  cost: number;
  enc: number;
  quantity: number;
  /** Items the book lets the player damage before play; the table may waive it for gear. */
  damageable: boolean;
}

/** Where a carried item sits; armour is always worn and takes no slot. */
export type Place = 'hands' | 'quick' | 'backpack';

export interface AlchemyKit {
  /** Row ids from the Standard Potions table, up to three. */
  potions: string[];
  /** Three d20 results on the Table of Ingredients. */
  ingredients: (number | null)[];
  /** Row ids from the Table of Parts, up to three. */
  parts: string[];
  /** The Weak Potion the chosen recipe makes. */
  recipe: string;
}

export interface CharacterState {
  id: string;
  step: StationId;
  name: string;
  species: SpeciesId | null;
  rollMode: RollMode;
  /** d10 per stat, used in `in_order` mode. */
  rolls: Record<StatKey, DieRoll>;
  /** Five d10 rolled at once, used in `assign` mode. */
  pool: DieRoll[];
  /** Pool index assigned to each stat in `assign` mode. */
  assignment: Record<StatKey, number | null>;
  hitPointsRoll: DieRoll;
  specialisation: Stats;
  profession: ProfessionId | null;
  /** The talent picked where the profession prints "X or Y". */
  talentChoice: string | null;
  /** Human Jack of all trades: the category chosen and the talent the dice gave. */
  randomTalent: { category: TalentCategory | null; talentId: string | null; hateTarget: string };
  freeSkill: SkillId | null;
  spells: string[];
  prayers: string[];
  arcanePerk: string | null;
  relic: { god: string | null; form: 'ring' | 'amulet' | null };
  /** Weapon of choice (catalogue id) for professions that print one. */
  weaponChoice: string | null;
  /** Shortsword or Rapier for the Rogue. */
  optionChoice: string | null;
  background: { enabled: boolean; roll: number | null };
  /** 1d4 wear result per damageable item key. */
  wear: Record<string, number | null>;
  purchases: Purchase[];
  cookingGear: boolean;
  alchemy: AlchemyKit;
  /** Where the player put an item, when they moved it from the suggested place. */
  placement: Record<string, Place>;
  /** Sheet fields the player has ticked off as copied onto the printed sheet. */
  copied: Record<string, boolean>;
}

export const PARTY_VERSION = 2;

export interface PartyState {
  version: typeof PARTY_VERSION;
  heroes: CharacterState[];
  currentId: string;
  nextId: number;
  /** Settlement rolled for the first quest, as the printed list number. */
  startSettlement: number | null;
}

export type HeroEvent =
  | { type: 'set_step'; step: StationId }
  | { type: 'set_name'; name: string }
  | { type: 'set_species'; species: SpeciesId }
  | { type: 'set_roll_mode'; mode: RollMode }
  | { type: 'roll_stat'; stat: StatKey; value: number }
  | { type: 'reroll_stat'; stat: StatKey; value: number }
  | { type: 'roll_pool'; index: number; value: number }
  | { type: 'reroll_pool'; index: number; value: number }
  | { type: 'assign'; stat: StatKey; index: number | null }
  | { type: 'roll_hit_points'; value: number }
  | { type: 'reroll_hit_points'; value: number }
  | { type: 'clear_rolls' }
  | { type: 'set_specialisation'; stat: StatKey; points: number }
  | { type: 'set_profession'; profession: ProfessionId }
  | { type: 'set_talent_choice'; talentId: string | null }
  | { type: 'set_random_talent_category'; category: TalentCategory | null }
  | { type: 'set_random_talent'; talentId: string | null }
  | { type: 'set_hate_target'; target: string }
  | { type: 'set_free_skill'; skill: SkillId | null }
  | { type: 'toggle_spell'; spellId: string }
  | { type: 'toggle_prayer'; prayerId: string }
  | { type: 'set_arcane_perk'; perkId: string | null }
  | { type: 'set_relic'; god?: string | null; form?: 'ring' | 'amulet' | null }
  | { type: 'set_weapon_choice'; weaponId: string | null }
  | { type: 'set_option_choice'; id: string | null }
  | { type: 'set_background_enabled'; enabled: boolean }
  | { type: 'set_background_roll'; roll: number | null }
  | { type: 'set_wear'; key: string; value: number | null }
  | { type: 'add_purchase'; purchase: Omit<Purchase, 'key'> }
  | { type: 'remove_purchase'; key: string }
  | { type: 'set_purchase_quantity'; key: string; quantity: number }
  | { type: 'set_purchase_damageable'; key: string; damageable: boolean }
  | { type: 'set_cooking_gear'; enabled: boolean }
  | { type: 'toggle_potion'; rowId: string }
  | { type: 'set_ingredient'; index: number; roll: number | null }
  | { type: 'toggle_part'; rowId: string }
  | { type: 'set_recipe'; recipe: string }
  | { type: 'set_placement'; key: string; place: Place | null }
  | { type: 'toggle_copied'; field: string }
  | { type: 'clear_copied' }
  | { type: 'reset' };

export type PartyEvent =
  | { type: 'hero_new' }
  | { type: 'hero_select'; id: string }
  | { type: 'hero_remove'; id: string }
  | { type: 'set_start_settlement'; roll: number | null }
  | { type: 'party_reset' };

export type CharacterEvent = HeroEvent | PartyEvent;

const PARTY_EVENTS = new Set<CharacterEvent['type']>([
  'hero_new',
  'hero_select',
  'hero_remove',
  'set_start_settlement',
  'party_reset',
]);

export function isPartyEvent(event: CharacterEvent): event is PartyEvent {
  return PARTY_EVENTS.has(event.type);
}

const emptyRoll = (): DieRoll => ({ value: null, reroll: null });
const zeroStats = (): Stats => ({ str: 0, con: 0, dex: 0, wis: 0, res: 0 });

export function initialState(id = 'hero1'): CharacterState {
  return {
    id,
    step: 'species',
    name: '',
    species: null,
    rollMode: 'in_order',
    rolls: {
      str: emptyRoll(),
      con: emptyRoll(),
      dex: emptyRoll(),
      wis: emptyRoll(),
      res: emptyRoll(),
    },
    pool: [emptyRoll(), emptyRoll(), emptyRoll(), emptyRoll(), emptyRoll()],
    assignment: { str: null, con: null, dex: null, wis: null, res: null },
    hitPointsRoll: emptyRoll(),
    specialisation: zeroStats(),
    profession: null,
    talentChoice: null,
    randomTalent: { category: null, talentId: null, hateTarget: '' },
    freeSkill: null,
    spells: [],
    prayers: [],
    arcanePerk: null,
    relic: { god: null, form: null },
    weaponChoice: null,
    optionChoice: null,
    background: { enabled: false, roll: null },
    wear: {},
    purchases: [],
    cookingGear: false,
    alchemy: { potions: [], ingredients: [null, null, null], parts: [], recipe: '' },
    placement: {},
    copied: {},
  };
}

export function initialParty(): PartyState {
  const hero = initialState('hero1');
  return {
    version: PARTY_VERSION,
    heroes: [hero],
    currentId: hero.id,
    nextId: 2,
    startSettlement: null,
  };
}

const STEP_MIGRATION: Record<string, StationId> = { stats: 'dice', equipment: 'market' };

/** Accepts one saved hero; unknown fields are dropped, missing ones filled in. */
export function reviveHero(raw: unknown, id: string): CharacterState {
  const fresh = initialState(id);
  if (!raw || typeof raw !== 'object') return fresh;
  const saved = raw as Partial<CharacterState> & { step?: string };
  const step = saved.step && STEP_MIGRATION[saved.step] ? STEP_MIGRATION[saved.step]! : saved.step;
  const hero: CharacterState = { ...fresh, ...saved, id };
  hero.step = step && STATION_BY_ID.has(step as StationId) ? (step as StationId) : 'species';
  hero.alchemy = { ...fresh.alchemy, ...(saved.alchemy ?? {}) };
  hero.placement = saved.placement ?? {};
  hero.copied = saved.copied ?? {};
  return hero;
}

/**
 * Accepts a saved party from `localStorage`. A version 1 save held a single hero and becomes a
 * party of one; anything unrecognised falls back to a fresh party.
 */
export function reviveState(raw: unknown): PartyState {
  if (!raw || typeof raw !== 'object') return initialParty();
  const saved = raw as {
    version?: unknown;
    heroes?: unknown;
    currentId?: unknown;
    nextId?: unknown;
    startSettlement?: unknown;
  };
  if (saved.version === 1) {
    const hero = reviveHero(raw, 'hero1');
    return {
      version: PARTY_VERSION,
      heroes: [hero],
      currentId: hero.id,
      nextId: 2,
      startSettlement: null,
    };
  }
  if (saved.version !== PARTY_VERSION || !Array.isArray(saved.heroes) || saved.heroes.length === 0)
    return initialParty();
  const heroes = saved.heroes.map((h, i) => {
    const candidate = h as { id?: unknown };
    return reviveHero(h, typeof candidate.id === 'string' ? candidate.id : `hero${i + 1}`);
  });
  const currentId = heroes.some((h) => h.id === saved.currentId)
    ? (saved.currentId as string)
    : heroes[0]!.id;
  const nextId =
    typeof saved.nextId === 'number' && Number.isInteger(saved.nextId)
      ? saved.nextId
      : heroes.length + 1;
  const startSettlement = typeof saved.startSettlement === 'number' ? saved.startSettlement : null;
  return { version: PARTY_VERSION, heroes, currentId, nextId, startSettlement };
}

export function currentHero(party: PartyState): CharacterState {
  return party.heroes.find((h) => h.id === party.currentId) ?? party.heroes[0]!;
}

/** The die the hero keeps: the book lets the player choose the highest of the two. */
export function keptDie(roll: DieRoll): number | null {
  if (roll.value === null) return null;
  return roll.reroll === null ? roll.value : Math.max(roll.value, roll.reroll);
}

export function rerollsUsed(state: CharacterState): number {
  const dice =
    state.rollMode === 'in_order' ? STAT_KEYS.map((key) => state.rolls[key]) : state.pool;
  return [...dice, state.hitPointsRoll].filter((roll) => roll.reroll !== null).length;
}

export function canReroll(state: CharacterState, roll: DieRoll): boolean {
  return roll.value !== null && roll.reroll === null && rerollsUsed(state) < CREATION.rerolls;
}

function clampDie(value: number, sides: number): number | null {
  return Number.isInteger(value) && value >= 1 && value <= sides ? value : null;
}

export function reduce(state: CharacterState, event: HeroEvent): CharacterState {
  switch (event.type) {
    case 'set_step':
      return state.step === event.step ? state : { ...state, step: event.step };
    case 'set_name':
      return { ...state, name: event.name };
    case 'set_species': {
      if (state.species === event.species) return state;
      // Dice are kept: they do not depend on the species. Choices that do are cleared.
      return {
        ...state,
        species: event.species,
        randomTalent: { category: null, talentId: null, hateTarget: '' },
        weaponChoice: null,
        cookingGear: false,
        wear: {},
      };
    }
    case 'set_roll_mode':
      return state.rollMode === event.mode ? state : { ...state, rollMode: event.mode };
    case 'roll_stat': {
      const value = clampDie(event.value, 10);
      if (value === null) return state;
      return { ...state, rolls: { ...state.rolls, [event.stat]: { value, reroll: null } } };
    }
    case 'reroll_stat': {
      const roll = state.rolls[event.stat];
      const value = clampDie(event.value, 10);
      if (value === null || !canReroll(state, roll)) return state;
      return { ...state, rolls: { ...state.rolls, [event.stat]: { ...roll, reroll: value } } };
    }
    case 'roll_pool': {
      const value = clampDie(event.value, 10);
      if (value === null || event.index < 0 || event.index >= state.pool.length) return state;
      const pool = state.pool.map((roll, i) =>
        i === event.index ? { value, reroll: null } : roll,
      );
      return { ...state, pool };
    }
    case 'reroll_pool': {
      const roll = state.pool[event.index];
      const value = clampDie(event.value, 10);
      if (!roll || value === null || !canReroll(state, roll)) return state;
      const pool = state.pool.map((r, i) => (i === event.index ? { ...r, reroll: value } : r));
      return { ...state, pool };
    }
    case 'assign': {
      const assignment = { ...state.assignment };
      // One die goes to one stat: taking it from another stat frees that stat.
      if (event.index !== null) {
        for (const key of STAT_KEYS) if (assignment[key] === event.index) assignment[key] = null;
      }
      assignment[event.stat] = event.index;
      return { ...state, assignment };
    }
    case 'roll_hit_points': {
      const value = clampDie(event.value, 6);
      if (value === null) return state;
      return { ...state, hitPointsRoll: { value, reroll: null } };
    }
    case 'reroll_hit_points': {
      const value = clampDie(event.value, 6);
      if (value === null || !canReroll(state, state.hitPointsRoll)) return state;
      return { ...state, hitPointsRoll: { ...state.hitPointsRoll, reroll: value } };
    }
    case 'clear_rolls': {
      const fresh = initialState(state.id);
      return {
        ...state,
        rolls: fresh.rolls,
        pool: fresh.pool,
        assignment: fresh.assignment,
        hitPointsRoll: fresh.hitPointsRoll,
      };
    }
    case 'set_specialisation': {
      const points = Math.max(
        0,
        Math.min(CREATION.specialisationMaxPerStat, Math.round(event.points)),
      );
      if (!Number.isFinite(points)) return state;
      const others = STAT_KEYS.filter((key) => key !== event.stat).reduce(
        (sum, key) => sum + state.specialisation[key],
        0,
      );
      const capped = Math.min(points, CREATION.specialisationPoints - others);
      return {
        ...state,
        specialisation: { ...state.specialisation, [event.stat]: Math.max(0, capped) },
      };
    }
    case 'set_profession': {
      if (state.profession === event.profession) return state;
      return {
        ...state,
        profession: event.profession,
        talentChoice: null,
        randomTalent: { ...state.randomTalent },
        freeSkill: null,
        spells: [],
        prayers: [],
        arcanePerk: null,
        relic: { god: null, form: null },
        weaponChoice: null,
        optionChoice: null,
        wear: {},
        purchases: [],
        alchemy: initialState(state.id).alchemy,
        placement: {},
      };
    }
    case 'set_talent_choice':
      return { ...state, talentChoice: event.talentId };
    case 'set_random_talent_category':
      return {
        ...state,
        randomTalent: { category: event.category, talentId: null, hateTarget: '' },
      };
    case 'set_random_talent':
      return {
        ...state,
        randomTalent: { ...state.randomTalent, talentId: event.talentId, hateTarget: '' },
      };
    case 'set_hate_target':
      return { ...state, randomTalent: { ...state.randomTalent, hateTarget: event.target } };
    case 'set_free_skill': {
      const profession = professionOf(state);
      if (event.skill !== null) {
        const modifier = profession?.modifiers[event.skill];
        if (modifier === undefined || modifier === null || modifier >= 0) return state;
      }
      return { ...state, freeSkill: event.skill };
    }
    case 'toggle_spell': {
      const profession = professionOf(state);
      const limit = profession?.spells?.quantity ?? 0;
      return { ...state, spells: toggle(state.spells, event.spellId, limit) };
    }
    case 'toggle_prayer': {
      const profession = professionOf(state);
      const limit = profession?.prayers?.quantity ?? 0;
      return { ...state, prayers: toggle(state.prayers, event.prayerId, limit) };
    }
    case 'set_arcane_perk':
      return { ...state, arcanePerk: event.perkId };
    case 'set_relic':
      return {
        ...state,
        relic: {
          god: event.god === undefined ? state.relic.god : event.god,
          form: event.form === undefined ? state.relic.form : event.form,
        },
      };
    case 'set_weapon_choice':
      return {
        ...state,
        weaponChoice: event.weaponId,
        wear: withoutKey(state.wear, 'start:weapon'),
      };
    case 'set_option_choice':
      return { ...state, optionChoice: event.id, wear: withoutKey(state.wear, 'start:weapon') };
    case 'set_background_enabled':
      return {
        ...state,
        background: { enabled: event.enabled, roll: event.enabled ? state.background.roll : null },
      };
    case 'set_background_roll': {
      if (event.roll !== null && clampDie(event.roll, BACKGROUNDS.length) === null) return state;
      return { ...state, background: { ...state.background, roll: event.roll } };
    }
    case 'set_wear': {
      if (event.value !== null && clampDie(event.value, CREATION.wearDie) === null) return state;
      return { ...state, wear: { ...state.wear, [event.key]: event.value } };
    }
    case 'add_purchase': {
      const key = `buy:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      // Buying a second lot of the same catalogue line raises its quantity instead.
      const same = state.purchases.find(
        (p) =>
          p.kind !== 'other' &&
          p.kind === event.purchase.kind &&
          p.id === event.purchase.id &&
          p.variant === event.purchase.variant,
      );
      if (same) {
        return {
          ...state,
          purchases: state.purchases.map((p) =>
            p.key === same.key ? { ...p, quantity: p.quantity + event.purchase.quantity } : p,
          ),
        };
      }
      return { ...state, purchases: [...state.purchases, { ...event.purchase, key }] };
    }
    case 'remove_purchase':
      return {
        ...state,
        purchases: state.purchases.filter((p) => p.key !== event.key),
        wear: withoutKey(state.wear, event.key),
        placement: withoutPlace(state.placement, event.key),
      };
    case 'set_purchase_quantity': {
      const quantity = Math.round(event.quantity);
      if (!Number.isFinite(quantity) || quantity < 1)
        return reduce(state, { type: 'remove_purchase', key: event.key });
      return {
        ...state,
        purchases: state.purchases.map((p) => (p.key === event.key ? { ...p, quantity } : p)),
      };
    }
    case 'set_purchase_damageable':
      return {
        ...state,
        purchases: state.purchases.map((p) =>
          p.key === event.key ? { ...p, damageable: event.damageable } : p,
        ),
        wear: event.damageable ? state.wear : withoutKey(state.wear, event.key),
      };
    case 'set_cooking_gear':
      return { ...state, cookingGear: event.enabled };
    case 'toggle_potion':
      return {
        ...state,
        alchemy: { ...state.alchemy, potions: toggle(state.alchemy.potions, event.rowId, 3, true) },
      };
    case 'set_ingredient': {
      if (event.index < 0 || event.index > 2) return state;
      if (event.roll !== null && clampDie(event.roll, 20) === null) return state;
      const ingredients = state.alchemy.ingredients.map((r, i) =>
        i === event.index ? event.roll : r,
      );
      return { ...state, alchemy: { ...state.alchemy, ingredients } };
    }
    case 'toggle_part':
      return {
        ...state,
        alchemy: { ...state.alchemy, parts: toggle(state.alchemy.parts, event.rowId, 3, true) },
      };
    case 'set_recipe':
      return { ...state, alchemy: { ...state.alchemy, recipe: event.recipe } };
    case 'set_placement': {
      if (event.place === null)
        return { ...state, placement: withoutPlace(state.placement, event.key) };
      return { ...state, placement: { ...state.placement, [event.key]: event.place } };
    }
    case 'toggle_copied':
      return { ...state, copied: { ...state.copied, [event.field]: !state.copied[event.field] } };
    case 'clear_copied':
      return { ...state, copied: {} };
    case 'reset':
      return initialState(state.id);
    default:
      return state;
  }
}

export function reduceParty(party: PartyState, event: CharacterEvent): PartyState {
  if (isPartyEvent(event)) {
    switch (event.type) {
      case 'hero_new': {
        const hero = initialState(`hero${party.nextId}`);
        return {
          ...party,
          heroes: [...party.heroes, hero],
          currentId: hero.id,
          nextId: party.nextId + 1,
        };
      }
      case 'hero_select':
        return party.heroes.some((h) => h.id === event.id) && party.currentId !== event.id
          ? { ...party, currentId: event.id }
          : party;
      case 'hero_remove': {
        if (!party.heroes.some((h) => h.id === event.id)) return party;
        const heroes = party.heroes.filter((h) => h.id !== event.id);
        if (heroes.length === 0) {
          const hero = initialState(`hero${party.nextId}`);
          return { ...party, heroes: [hero], currentId: hero.id, nextId: party.nextId + 1 };
        }
        const currentId = party.currentId === event.id ? heroes[0]!.id : party.currentId;
        return { ...party, heroes, currentId };
      }
      case 'set_start_settlement':
        if (event.roll !== null && clampDie(event.roll, 8) === null) return party;
        return { ...party, startSettlement: event.roll };
      case 'party_reset':
        return initialParty();
    }
  }
  const hero = currentHero(party);
  const next = reduce(hero, event);
  if (next === hero) return party;
  return { ...party, heroes: party.heroes.map((h) => (h.id === hero.id ? next : h)) };
}

export function reduceAll(state: CharacterState, events: HeroEvent[]): CharacterState {
  return events.reduce(reduce, state);
}

/** Toggles membership; `swap` replaces the oldest pick when the list is full instead of refusing. */
function toggle(list: string[], id: string, limit: number, swap = false): string[] {
  if (list.includes(id)) return list.filter((x) => x !== id);
  if (list.length >= limit) return swap ? [...list.slice(1), id] : list;
  return [...list, id];
}

function withoutKey(
  wear: Record<string, number | null>,
  key: string,
): Record<string, number | null> {
  if (!(key in wear)) return wear;
  const next = { ...wear };
  delete next[key];
  return next;
}

function withoutPlace(placement: Record<string, Place>, key: string): Record<string, Place> {
  if (!(key in placement)) return placement;
  const next = { ...placement };
  delete next[key];
  return next;
}

export function speciesOf(state: CharacterState): Species | null {
  return SPECIES.find((s) => s.id === state.species) ?? null;
}

export function professionOf(state: CharacterState): Profession | null {
  return PROFESSIONS.find((p) => p.id === state.profession) ?? null;
}

export function backgroundOf(state: CharacterState): Background | null {
  if (!state.background.enabled || state.background.roll === null) return null;
  return BACKGROUNDS.find((b) => b.number === state.background.roll) ?? null;
}

/** The d10 the hero keeps for a stat, in either roll mode. */
export function statDie(state: CharacterState, stat: StatKey): number | null {
  if (state.rollMode === 'in_order') return keptDie(state.rolls[stat]);
  const index = state.assignment[stat];
  if (index === null) return null;
  const roll = state.pool[index];
  return roll ? keptDie(roll) : null;
}

export interface TalentLine {
  talent: Talent;
  /** Where it came from: species trait, profession, chosen, or the human's random roll. */
  source: string;
  qualifier?: string;
}

export function talentsOf(state: CharacterState): TalentLine[] {
  const lines: TalentLine[] = [];
  const species = speciesOf(state);
  const profession = professionOf(state);
  for (const trait of species?.traits ?? []) {
    const talent = TALENT_BY_ID.get(trait.talentId);
    if (talent)
      lines.push({ talent, source: `${species!.name} trait`, qualifier: trait.qualifier });
  }
  if (species?.randomTalent && state.randomTalent.talentId) {
    const talent = TALENT_BY_ID.get(state.randomTalent.talentId);
    if (talent) {
      const line: TalentLine = { talent, source: 'Jack of all trades' };
      if (talent.namesEnemy && state.randomTalent.hateTarget)
        line.qualifier = state.randomTalent.hateTarget;
      lines.push(line);
    }
  }
  for (const grant of profession?.talents ?? []) {
    const talent = TALENT_BY_ID.get(grant.talentId);
    if (talent) lines.push({ talent, source: profession!.name });
  }
  if (profession?.talentChoice && state.talentChoice) {
    const talent = TALENT_BY_ID.get(state.talentChoice);
    if (talent && profession.talentChoice.some((o) => o.talentId === talent.id))
      lines.push({ talent, source: `${profession.name} choice` });
  }
  return lines;
}

export interface SkillLine {
  id: SkillId;
  name: string;
  abbr: string;
  stat: StatKey;
  base: number | null;
  modifier: number | null;
  freeSkill: number;
  talentBonus: number;
  /** null where the profession prints N/A. */
  value: number | null;
}

export interface EquipmentLine {
  key: string;
  label: string;
  quantity: number;
  /** Catalogue data when the item is a listed weapon, armour piece, shield or general gear. */
  weapon?: Weapon;
  armour?: Armour;
  shield?: Shield;
  gear?: Gear;
  /** Per unit. */
  enc: number | null;
  /** How many fit in one Quick Slot. */
  stack: number | null;
  /** Items the book lets the player damage before play. */
  damageable: boolean;
  /** Printed DUR, when the item has one even if wear is not rolled. */
  durabilityMax: number | null;
  wear: number | null;
  durabilityLeft: number | null;
  note?: string;
  /** Still to be chosen by the player. */
  pending: boolean;
  /** Starting gear ("start:") or a purchase. */
  origin: 'start' | 'bought' | 'special';
}

export interface WeaponClassUse {
  weaponClass: number;
  twoHands: boolean;
  oneHand: boolean | null;
}

export type Placed = Place | 'worn';

export interface PlacedLine {
  line: EquipmentLine;
  place: Placed;
  /** For hands: 1 or 2; for quick slots: slots taken; otherwise 0. */
  takes: number;
  /** The place the rules suggest, before any override. */
  suggested: Placed;
  /** Where this item may go. */
  options: Placed[];
}

export interface ArmourWorn {
  line: EquipmentLine;
  armour: Armour;
  /** Printed "Torso (only back)" cloak: allowed on top of a stack. */
  cloak: boolean;
}

export interface Loadout {
  items: PlacedLine[];
  hands: { used: number; capacity: 2; lines: PlacedLine[] };
  quick: { used: number; capacity: number; lines: PlacedLine[]; extraFrom: string[] };
  backpack: PlacedLine[];
  shield: PlacedLine | null;
  /** Armour per Hit Area with the DEF the pieces add up to. */
  areas: Record<BodyArea, { pieces: ArmourWorn[]; def: number }>;
  warnings: string[];
}

export interface Effect {
  id: string;
  label: string;
  detail: string;
  tone: 'warn' | 'danger' | 'info';
  cite: Cite;
}

export interface Todo {
  id: string;
  station: StationId;
  label: string;
  severity: 'open' | 'warn';
}

export interface Derived {
  species: Species | null;
  profession: Profession | null;
  background: Background | null;
  talents: TalentLine[];
  rolled: Partial<Stats>;
  /** After specialisation and talent stat bonuses. */
  stats: Partial<Stats>;
  statBonuses: Partial<Record<StatKey, { amount: number; source: string }[]>>;
  specialisationLeft: number;
  rerollsLeft: number;
  hitPoints: number | null;
  hitPointsParts: {
    die: number | null;
    base: number | null;
    profession: number | null;
    talents: number;
  };
  damageBonus: number | null;
  naturalArmour: number | null;
  mana: number | null;
  energy: number;
  luck: number;
  sanity: number;
  movement: number;
  level: number;
  experience: number;
  partyMoraleContribution: number | null;
  partyMoraleNotes: { amount: number; source: string }[];
  skills: SkillLine[];
  weaponClasses: WeaponClassUse[];
  /** STR used for the weapon class lookup, with Tight Grip. */
  weaponClassStrength: number | null;
  equipment: EquipmentLine[];
  loadout: Loadout;
  effects: Effect[];
  coins: { start: number; spent: number; left: number; source: string };
  encumbrance: {
    carried: number;
    limit: number | null;
    hardCap: number | null;
    extra: { amount: number; source: string }[];
  };
  warnings: string[];
  todo: Todo[];
  complete: Record<StationId, boolean>;
}

function lookupBonus(table: readonly { stat: number; bonus: number }[], value: number): number {
  let bonus = 0;
  for (const row of table) if (value >= row.stat) bonus = row.bonus;
  return bonus;
}

export function derive(state: CharacterState): Derived {
  const species = speciesOf(state);
  const profession = professionOf(state);
  const background = backgroundOf(state);
  const talents = talentsOf(state);
  const warnings: string[] = [];

  const rolled: Partial<Stats> = {};
  const stats: Partial<Stats> = {};
  const statBonuses: Derived['statBonuses'] = {};
  for (const key of STAT_KEYS) {
    const die = statDie(state, key);
    if (species && die !== null) {
      rolled[key] = species.base[key] + die;
      let total = rolled[key]! + state.specialisation[key];
      const bonuses: { amount: number; source: string }[] = [];
      for (const line of talents) {
        const amount = line.talent.effects?.stats?.[key];
        if (amount) {
          bonuses.push({ amount, source: line.talent.name });
          total += amount;
        }
      }
      if (bonuses.length) statBonuses[key] = bonuses;
      stats[key] = total;
    }
  }
  const specialisationSpent = STAT_KEYS.reduce((sum, key) => sum + state.specialisation[key], 0);
  const specialisationLeft = CREATION.specialisationPoints - specialisationSpent;

  const hpDie = keptDie(state.hitPointsRoll);
  const hpTalents = talents.reduce((sum, line) => sum + (line.talent.effects?.hitPoints ?? 0), 0);
  const hitPoints =
    species && hpDie !== null
      ? species.hitPointsBase + hpDie + (profession?.hitPoints ?? 0) + hpTalents
      : null;

  const damageBonus = stats.str !== undefined ? lookupBonus(DAMAGE_BONUS, stats.str) : null;
  const naturalArmour = stats.con !== undefined ? lookupBonus(NATURAL_ARMOUR, stats.con) : null;
  const manaTalents = talents.reduce((sum, line) => sum + (line.talent.effects?.mana ?? 0), 0);
  const mana =
    profession?.id === 'wizard' && stats.wis !== undefined
      ? stats.wis * CREATION.manaPerWisdom + manaTalents
      : null;

  const energy = profession?.startingEnergy ?? CREATION.energy;
  const luck =
    (species?.startingLuck ?? CREATION.luck) +
    talents
      .filter((l) => l.source !== `${species?.name} trait` || l.talent.id !== 'lucky')
      .reduce((sum, l) => sum + (l.talent.effects?.luck ?? 0), 0);
  const sanity =
    CREATION.sanity +
    talents.reduce((sum, l) => sum + (l.talent.effects?.sanity ?? 0), 0) +
    (background?.sanity ?? 0);
  const movement =
    CREATION.movement + talents.reduce((sum, l) => sum + (l.talent.effects?.movement ?? 0), 0);

  const partyMoraleContribution = stats.res !== undefined ? Math.floor(stats.res / 10) : null;
  const partyMoraleNotes: { amount: number; source: string }[] = [];
  for (const line of talents)
    if (line.talent.effects?.partyMorale)
      partyMoraleNotes.push({ amount: line.talent.effects.partyMorale, source: line.talent.name });
  if (background?.partyMorale)
    partyMoraleNotes.push({ amount: background.partyMorale, source: background.name });

  const skills: SkillLine[] = SKILLS.map((skill) => {
    const base = stats[skill.stat] ?? null;
    const modifier = profession ? profession.modifiers[skill.id] : null;
    const freeSkill =
      state.freeSkill === skill.id && modifier !== null && modifier < 0
        ? CREATION.freeSkillBonus
        : 0;
    const talentBonus = talents.reduce(
      (sum, l) => sum + (l.talent.effects?.skills?.[skill.id] ?? 0),
      0,
    );
    const available = profession !== null && modifier !== null;
    const value =
      available && base !== null ? Math.max(0, base + modifier + freeSkill + talentBonus) : null;
    return {
      id: skill.id,
      name: skill.name,
      abbr: skill.abbr,
      stat: skill.stat,
      base,
      modifier: profession ? modifier : null,
      freeSkill,
      talentBonus,
      value,
    };
  });

  const classStrengthBonus = talents.reduce(
    (sum, l) => sum + (l.talent.effects?.weaponClassStrength ?? 0),
    0,
  );
  const weaponClassStrength = stats.str !== undefined ? stats.str + classStrengthBonus : null;
  const weaponClasses: WeaponClassUse[] = WEAPON_CLASSES.map((row) => ({
    weaponClass: row.weaponClass,
    twoHands: weaponClassStrength !== null && weaponClassStrength >= row.twoHands,
    oneHand:
      row.oneHand === null
        ? null
        : weaponClassStrength !== null && weaponClassStrength >= row.oneHand,
  }));

  const equipment = equipmentLines(state, species, profession);
  for (const line of equipment)
    if (line.note && line.note.startsWith('!')) warnings.push(line.note.slice(1));

  const coinsStart = background?.startingCoins ?? CREATION.startingCoins;
  const spent =
    state.purchases.reduce((sum, p) => sum + p.cost * p.quantity, 0) +
    (state.cookingGear ? CREATION.cookingGearCost : 0);
  const coins = {
    start: coinsStart,
    spent,
    left: coinsStart - spent,
    source: background?.startingCoins ? background.name : 'Starting Equipment',
  };
  if (coins.left < 0) warnings.push('The purchases cost more than the starting coins.');

  const carried = equipment.reduce((sum, line) => sum + (line.enc ?? 0) * line.quantity, 0);
  const extra: { amount: number; source: string }[] = [];
  for (const line of talents)
    if (line.talent.effects?.carry)
      extra.push({ amount: line.talent.effects.carry, source: line.talent.name });
  for (const line of equipment) {
    const pack = line.gear ? CARRY.backpacks[line.gear.id] : undefined;
    if (pack) extra.push({ amount: pack.capacity, source: line.gear!.name });
  }
  const limit =
    stats.str !== undefined ? stats.str + extra.reduce((sum, e) => sum + e.amount, 0) : null;
  const hardCap =
    stats.str !== undefined ? stats.str + CREATION.encumbranceHardCapOverStrength : null;
  if (limit !== null && carried > limit)
    warnings.push(
      `Encumbrance ${carried} exceeds the STR limit of ${limit}: all skills and stats are at -10.`,
    );
  if (hardCap !== null && carried > hardCap)
    warnings.push(`Encumbrance ${carried} exceeds the hard cap of STR+15 (${hardCap}).`);

  // Profession and species limitations on chosen and bought gear.
  for (const line of equipment) {
    if (
      line.weapon &&
      profession?.maxWeaponClass &&
      line.weapon.weaponClass !== null &&
      line.weapon.weaponClass > profession.maxWeaponClass
    )
      warnings.push(
        `${line.weapon.name} is Class ${line.weapon.weaponClass}; a ${profession.name} may never use weapons heavier than Class ${profession.maxWeaponClass}.`,
      );
    if (line.armour && profession?.maxArmourTier && line.armour.tier > profession.maxArmourTier)
      warnings.push(
        `${line.armour.name} is Tier ${line.armour.tier}; a ${profession.name} may never use armour heavier than Tier ${profession.maxArmourTier}.`,
      );
    if (
      line.weapon &&
      species &&
      (species.id === 'dwarf' || species.id === 'halfling') &&
      (line.weapon.id === 'longbow' || line.weapon.id === 'elven_bow') &&
      line.key !== 'start:longbow'
    )
      warnings.push(`${species.name} characters cannot use Longbows or Elven bows.`);
    if (line.weapon && line.weapon.weaponClass !== null && weaponClassStrength !== null) {
      const use = weaponClasses.find((c) => c.weaponClass === line.weapon!.weaponClass);
      if (use && !use.twoHands)
        warnings.push(
          `${line.weapon.name} is Class ${line.weapon.weaponClass}; STR ${weaponClassStrength} is below the ${WEAPON_CLASSES[line.weapon.weaponClass - 1]!.twoHands} needed even with two hands.`,
        );
    }
    if (line.weapon?.id === 'arbalest' && stats.str !== undefined && stats.str < 55)
      warnings.push(`Arbalest requires STR 55; STR is ${stats.str}.`);
  }
  if (background?.wizardReroll && profession?.id === 'wizard')
    warnings.push('The Fraud is not applicable for wizards: reroll the Background.');

  // Random talent eligibility, flagged rather than blocked: the book does not say what an ineligible roll means.
  const random = state.randomTalent.talentId
    ? TALENT_BY_ID.get(state.randomTalent.talentId)
    : undefined;
  if (random?.restriction) {
    const r = random.restriction;
    const have = new Set(talents.map((l) => l.talent.id));
    let eligible = true;
    if (r.professions && (!profession || !r.professions.includes(profession.id))) eligible = false;
    if (r.notProfessions && profession && r.notProfessions.includes(profession.id))
      eligible = false;
    if (r.speciesTrait && !species?.traits.some((trait) => trait.talentId === random.id))
      eligible = false;
    if (r.requiresTalent && !have.has(r.requiresTalent)) eligible = false;
    if (r.requiresStat && (stats[r.requiresStat.stat] ?? 0) < r.requiresStat.value)
      eligible = false;
    if (!eligible)
      warnings.push(
        `${random.name}: "${r.printed}" The book does not say what an ineligible random talent means; roll again or agree at the table.`,
      );
  }
  if (random?.namesEnemy && !state.randomTalent.hateTarget)
    warnings.push('Hate: name the enemy the hero hates.');
  const randomCount = talents.filter((l) => l.source === 'Jack of all trades').length;
  if (
    random &&
    randomCount &&
    talents.filter((l) => l.talent.id === random.id).length > 1 &&
    !random.namesEnemy
  )
    warnings.push(
      `${random.name} is already granted by the species or profession; the book does not say whether a duplicate random talent is rerolled.`,
    );

  const loadout = buildLoadout(state, equipment, weaponClasses);
  warnings.push(...loadout.warnings);
  const effects = standingEffects(loadout, equipment, carried, limit);

  const alchemistKitDone =
    profession?.id !== 'alchemist' ||
    (state.alchemy.potions.length === 3 &&
      state.alchemy.ingredients.every((r) => r !== null) &&
      state.alchemy.parts.length === 3 &&
      state.alchemy.recipe.trim() !== '');

  const complete: Record<StationId, boolean> = {
    species: species !== null,
    dice:
      species !== null && STAT_KEYS.every((key) => statDie(state, key) !== null) && hpDie !== null,
    specialise: specialisationLeft === 0,
    profession: profession !== null,
    powers: professionComplete(state, profession, species) && alchemistKitDone,
    background: profession !== null && (!state.background.enabled || background !== null),
    market: profession !== null && equipment.every((line) => !line.pending) && coins.left >= 0,
    loadout:
      profession !== null &&
      equipment.every((line) => !line.damageable || line.wear !== null) &&
      loadout.warnings.length === 0,
    sheet: false,
  };
  complete.sheet =
    complete.species &&
    complete.dice &&
    complete.specialise &&
    complete.profession &&
    complete.powers &&
    complete.background &&
    complete.market &&
    complete.loadout;

  const todo = buildTodo(
    state,
    species,
    profession,
    equipment,
    loadout,
    coins,
    complete,
    specialisationLeft,
    hpDie,
    random,
    alchemistKitDone,
  );

  return {
    species,
    profession,
    background,
    talents,
    rolled,
    stats,
    statBonuses,
    specialisationLeft,
    rerollsLeft: CREATION.rerolls - rerollsUsed(state),
    hitPoints,
    hitPointsParts: {
      die: hpDie,
      base: species?.hitPointsBase ?? null,
      profession: profession?.hitPoints ?? null,
      talents: hpTalents,
    },
    damageBonus,
    naturalArmour,
    mana,
    energy,
    luck,
    sanity,
    movement,
    level: CREATION.level,
    experience: CREATION.experience,
    partyMoraleContribution,
    partyMoraleNotes,
    skills,
    weaponClasses,
    weaponClassStrength,
    equipment,
    loadout,
    effects,
    coins,
    encumbrance: { carried, limit, hardCap, extra },
    warnings,
    todo,
    complete,
  };
}

function professionComplete(
  state: CharacterState,
  profession: Profession | null,
  species: Species | null,
): boolean {
  if (!profession) return false;
  if (profession.talentChoice && !state.talentChoice) return false;
  if (profession.spells && state.spells.length !== profession.spells.quantity) return false;
  if (profession.prayers && state.prayers.length !== profession.prayers.quantity) return false;
  if (profession.arcanePerkChoice && !state.arcanePerk) return false;
  if (profession.id === 'warrior_priest' && (!state.relic.god || !state.relic.form)) return false;
  if (species?.randomTalent && !state.randomTalent.talentId) return false;
  const random = state.randomTalent.talentId
    ? TALENT_BY_ID.get(state.randomTalent.talentId)
    : undefined;
  if (random?.namesEnemy && !state.randomTalent.hateTarget) return false;
  return true;
}

const left = (max: number, wear: number | null): number | null =>
  wear === null ? null : max - Math.min(wear, max - 1);

function equipmentLines(
  state: CharacterState,
  species: Species | null,
  profession: Profession | null,
): EquipmentLine[] {
  const lines: EquipmentLine[] = [];
  const wearOf = (key: string): number | null => state.wear[key] ?? null;

  for (const item of profession?.equipment ?? []) {
    const key = `start:${item.key}`;
    let weapon: Weapon | undefined;
    let armour: Armour | undefined;
    let gear: Gear | undefined;
    let label = item.quantity > 1 ? `${item.quantity} × ${item.label}` : item.label;
    let note: string | undefined;
    let pending = false;
    if (item.catalogue?.kind === 'weapon') weapon = WEAPON_BY_ID.get(item.catalogue.id);
    if (item.catalogue?.kind === 'armour') armour = ARMOUR_BY_ID.get(item.catalogue.id);
    if (
      item.key === 'longbow' &&
      species &&
      (species.id === 'dwarf' || species.id === 'halfling')
    ) {
      weapon = WEAPON_BY_ID.get('shortbow');
      label = 'Shortbow (instead of the printed Longbow)';
      note =
        'Designer ruling (FAQ; changelog 2.22 entry 2): a Dwarf or Halfling Ranger takes a Shortbow instead.';
    }
    if (item.anyWeapon) {
      weapon = state.weaponChoice ? WEAPON_BY_ID.get(state.weaponChoice) : undefined;
      if (weapon) label = `${weapon.name} (${item.label.toLowerCase()})`;
      else pending = true;
    }
    if (item.options) {
      const chosen = item.options.find((o) => o.id === state.optionChoice);
      if (chosen) {
        if (chosen.kind === 'weapon') weapon = WEAPON_BY_ID.get(chosen.id);
        if (chosen.kind === 'armour') armour = ARMOUR_BY_ID.get(chosen.id);
        label = weapon?.name ?? armour?.name ?? label;
      } else pending = true;
    }
    if (item.key === 'relic') {
      if (state.relic.god && state.relic.form) label = `${state.relic.god} (${state.relic.form})`;
      else pending = true;
    }
    // Starting gear printed with a general-equipment name takes that row's ENC and stacking.
    if (item.key === 'rope') gear = GEAR_BY_ID.get('rope');
    if (item.key === 'lock_picks') gear = GEAR_BY_ID.get('lockpicks_5');
    if (item.key === 'medium_backpack') gear = GEAR_BY_ID.get('backpack_medium');
    if (item.key === 'alchemist_tools') gear = GEAR_BY_ID.get('alchemist_tool');
    if (item.key === 'alchemist_belt') gear = GEAR_BY_ID.get('alchemist_belt');
    if (item.key === 'potions' && profession?.id === 'alchemist') {
      const names = state.alchemy.potions.map(
        (rowId) => STANDARD_POTIONS.find((p) => p.rowId === rowId)?.name ?? rowId,
      );
      if (names.length === 3) label = names.join(', ');
      else pending = true;
    }
    if (item.key === 'ingredients' && profession?.id === 'alchemist') {
      const rolled = state.alchemy.ingredients.filter((r): r is number => r !== null);
      if (rolled.length === 3) label = rolled.map((r) => ingredientName(r)).join(', ');
      else pending = true;
    }
    if (item.key === 'parts' && profession?.id === 'alchemist') {
      const names = state.alchemy.parts.map(
        (rowId) => PARTS.find((p) => p.rowId === rowId)?.name ?? rowId,
      );
      if (names.length === 3) label = names.join(', ');
      else pending = true;
    }
    if (item.key === 'recipe' && profession?.id === 'alchemist') {
      if (state.alchemy.recipe.trim()) label = `Recipe: ${state.alchemy.recipe.trim()} (Weak)`;
      else pending = true;
    }
    if (item.qualifier && !note) note = item.qualifier;
    const damageable = Boolean(weapon || armour);
    const durabilityMax = weapon?.durability ?? armour?.durability ?? gear?.durability ?? null;
    const wear = damageable ? wearOf(key) : null;
    const line: EquipmentLine = {
      key,
      label,
      quantity: item.quantity,
      enc: weapon?.enc ?? armour?.enc ?? gear?.enc ?? null,
      stack: gear?.stack ?? null,
      damageable,
      durabilityMax,
      wear,
      durabilityLeft: damageable && durabilityMax !== null ? left(durabilityMax, wear) : null,
      pending,
      origin: 'start',
    };
    if (weapon) line.weapon = weapon;
    if (armour) line.armour = armour;
    if (gear) line.gear = gear;
    if (note) line.note = note;
    lines.push(line);
  }

  for (const purchase of state.purchases) {
    const weapon =
      purchase.kind === 'weapon' && purchase.id ? WEAPON_BY_ID.get(purchase.id) : undefined;
    const armour =
      purchase.kind === 'armour' && purchase.id ? ARMOUR_BY_ID.get(purchase.id) : undefined;
    const shield =
      purchase.kind === 'shield' && purchase.id ? SHIELD_BY_ID.get(purchase.id) : undefined;
    const gear = purchase.kind === 'gear' && purchase.id ? GEAR_BY_ID.get(purchase.id) : undefined;
    const damageable = purchase.damageable;
    const printedDur =
      weapon?.durability ?? armour?.durability ?? shield?.durability ?? gear?.durability ?? null;
    const durabilityMax = damageable ? (printedDur ?? CREATION.standardDurability) : printedDur;
    const wear = damageable ? wearOf(purchase.key) : null;
    const label = purchase.variant ? `${purchase.label} · ${purchase.variant}` : purchase.label;
    const line: EquipmentLine = {
      key: purchase.key,
      label: purchase.quantity > 1 ? `${purchase.quantity} × ${label}` : label,
      quantity: purchase.quantity,
      enc: purchase.enc,
      stack: gear?.stack ?? null,
      damageable,
      durabilityMax,
      wear,
      durabilityLeft: damageable && durabilityMax !== null ? left(durabilityMax, wear) : null,
      pending: false,
      note: `Bought for ${purchase.cost * purchase.quantity} c`,
      origin: 'bought',
    };
    if (weapon) line.weapon = weapon;
    if (armour) line.armour = armour;
    if (shield) line.shield = shield;
    if (gear) line.gear = gear;
    lines.push(line);
  }

  if (state.cookingGear && species?.id === 'halfling') {
    const gear = GEAR_BY_ID.get('cooking_gear');
    const line: EquipmentLine = {
      key: 'cooking_gear',
      label: 'Cooking gear',
      quantity: 1,
      enc: gear?.enc ?? null,
      stack: null,
      damageable: false,
      durabilityMax: null,
      wear: null,
      durabilityLeft: null,
      pending: false,
      note: 'Bought for 50 c (Halfling special)',
      origin: 'special',
    };
    if (gear) line.gear = gear;
    lines.push(line);
  }
  return lines;
}

export function ingredientName(roll: number): string {
  return INGREDIENT_NAMES[roll - 1] ?? `Ingredient ${roll}`;
}
import { INGREDIENTS as INGREDIENT_NAMES } from './rules.ts';

/** Hands a weapon needs for this hero: two when the class needs it or the STR for one hand is lacking. */
export function handsFor(weapon: Weapon, classes: WeaponClassUse[]): 1 | 2 {
  if (weapon.weaponClass === null) return 1;
  const use = classes.find((c) => c.weaponClass === weapon.weaponClass);
  if (!use) return 1;
  if (use.oneHand === null) return 2;
  return use.oneHand ? 1 : 2;
}

const BACKPACK_FIRST = new Set(['start:bag', 'start:ingredients', 'start:parts', 'start:recipe']);

function slotsFor(line: EquipmentLine): number {
  const per = line.stack ?? 1;
  return Math.max(1, Math.ceil(line.quantity / per));
}

function buildLoadout(
  state: CharacterState,
  equipment: EquipmentLine[],
  classes: WeaponClassUse[],
): Loadout {
  const warnings: string[] = [];
  const extraFrom: string[] = [];
  let quickCapacity: number = CARRY.quickSlots;
  for (const line of equipment) {
    const extra = line.gear ? CARRY.extraSlots[line.gear.id] : undefined;
    if (extra) {
      quickCapacity += extra;
      extraFrom.push(line.gear!.name);
    }
  }
  const areas: Loadout['areas'] = {
    head: { pieces: [], def: 0 },
    arms: { pieces: [], def: 0 },
    torso: { pieces: [], def: 0 },
    legs: { pieces: [], def: 0 },
  };
  const items: PlacedLine[] = [];
  let handsUsed = 0;
  let quickUsed = 0;
  let shield: PlacedLine | null = null;

  // Weapons first (hands), then shields, then the rest, so the suggested places are stable.
  const order = (line: EquipmentLine) => (line.weapon ? 0 : line.shield ? 1 : line.armour ? 2 : 3);
  const sorted = [...equipment].sort((a, b) => order(a) - order(b));
  for (const line of sorted) {
    if (line.pending && !line.weapon && !line.armour) {
      items.push({ line, place: 'backpack', takes: 0, suggested: 'backpack', options: [] });
      continue;
    }
    if (line.armour) {
      const cloak = line.armour.covers.toLowerCase().includes('only back');
      for (const area of coveredAreas(line.armour.covers)) {
        areas[area].pieces.push({ line, armour: line.armour, cloak });
        areas[area].def += line.armour.def;
      }
      if (coveredAreas(line.armour.covers).length === 0)
        warnings.push(
          `${line.armour.name} covers "${line.armour.covers}", which is not a hero's Hit Area.`,
        );
      items.push({ line, place: 'worn', takes: 0, suggested: 'worn', options: ['worn'] });
      continue;
    }
    const override = state.placement[line.key];
    if (line.shield) {
      const suggested: Placed = handsUsed + 1 <= 2 ? 'hands' : 'backpack';
      const place = override ?? suggested;
      const takes = place === 'hands' ? 1 : place === 'quick' ? slotsFor(line) : 0;
      if (place === 'hands') handsUsed += 1;
      if (place === 'quick') quickUsed += takes;
      const placed: PlacedLine = {
        line,
        place,
        takes,
        suggested,
        options: ['hands', 'quick', 'backpack'],
      };
      if (place === 'hands') shield = placed;
      items.push(placed);
      continue;
    }
    if (line.weapon) {
      const hands = handsFor(line.weapon, classes);
      const suggested: Placed =
        line.quantity === 1 && line.weapon.weaponClass !== null && handsUsed + hands <= 2
          ? 'hands'
          : quickUsed + slotsFor(line) <= quickCapacity
            ? 'quick'
            : 'backpack';
      const place = override ?? suggested;
      const takes = place === 'hands' ? hands : place === 'quick' ? slotsFor(line) : 0;
      if (place === 'hands') handsUsed += hands;
      if (place === 'quick') quickUsed += takes;
      items.push({ line, place, takes, suggested, options: ['hands', 'quick', 'backpack'] });
      continue;
    }
    // Backpacks and belts are worn, not carried in a slot.
    if (
      line.key === 'start:backpack' ||
      (line.gear &&
        (CARRY.backpacks[line.gear.id] ||
          CARRY.extraSlots[line.gear.id] ||
          line.gear.id === 'alchemist_belt' ||
          line.gear.group === 'jewellery'))
    ) {
      items.push({ line, place: 'worn', takes: 0, suggested: 'worn', options: ['worn'] });
      continue;
    }
    const slots = slotsFor(line);
    // The Alchemist's bag of ingredients, parts and the recipe travel in the backpack unless moved.
    const packed = BACKPACK_FIRST.has(line.key);
    const suggested: Placed = !packed && quickUsed + slots <= quickCapacity ? 'quick' : 'backpack';
    const place = override ?? suggested;
    const takes = place === 'quick' ? slots : place === 'hands' ? 1 : 0;
    if (place === 'quick') quickUsed += takes;
    if (place === 'hands') handsUsed += 1;
    items.push({ line, place, takes, suggested, options: ['hands', 'quick', 'backpack'] });
  }

  if (handsUsed > 2)
    warnings.push(`The hands hold ${handsUsed} hands' worth of gear; a hero has two.`);
  if (quickUsed > quickCapacity)
    warnings.push(`${quickUsed} Quick Slots are in use; the hero has ${quickCapacity}.`);
  for (const area of BODY_AREAS) {
    const pieces = areas[area.id].pieces.filter((p) => !p.cloak);
    if (pieces.length > 1) {
      const tiers = new Set(pieces.map((p) => p.armour.tier));
      const allStackable = pieces.every((p) => p.armour.special.includes('Stackable'));
      if (pieces.length > 2 || !allStackable || tiers.size !== pieces.length)
        warnings.push(
          `${area.label}: ${pieces.map((p) => p.armour.name).join(' and ')} cannot be worn together; only two Stackable pieces of different tiers stack.`,
        );
    }
  }
  const shieldLine = shield as PlacedLine | null;
  if (shieldLine && shieldLine.line.shield && !shieldLine.line.shield.special.includes('Huge')) {
    const twoHanded = items.some(
      (p) => p.place === 'hands' && p.line.weapon && handsFor(p.line.weapon, classes) === 2,
    );
    if (twoHanded) warnings.push('A two-handed weapon and a shield cannot both be in the hands.');
  }
  const order2 = (p: PlacedLine) => equipment.indexOf(p.line);
  items.sort((a, b) => order2(a) - order2(b));
  return {
    items,
    hands: { used: handsUsed, capacity: 2, lines: items.filter((p) => p.place === 'hands') },
    quick: {
      used: quickUsed,
      capacity: quickCapacity,
      lines: items.filter((p) => p.place === 'quick'),
      extraFrom,
    },
    backpack: items.filter((p) => p.place === 'backpack'),
    shield: shieldLine,
    areas,
    warnings,
  };
}

/** Modifiers the gear carries into play, shown on the sheet so nobody forgets them. */
function standingEffects(
  loadout: Loadout,
  equipment: EquipmentLine[],
  carried: number,
  limit: number | null,
): Effect[] {
  const effects: Effect[] = [];
  const stacked = BODY_AREAS.some(
    (area) => loadout.areas[area.id].pieces.filter((p) => !p.cloak).length === 2,
  );
  if (stacked)
    effects.push({
      id: 'stackable',
      label: '−10 DEX while stacked armour is worn',
      detail: CARRY.stackedArmourText,
      tone: 'warn',
      cite: CITES.armourSpecials,
    });
  if (equipment.some((line) => line.armour?.special.includes('Clunky')))
    effects.push({
      id: 'clunky',
      label: '−10 DEX from Clunky armour',
      detail:
        'This armour offers good protection, but moving effectively is difficult, giving your hero a -10 DEX. This is not cumulative with other pieces of armour that are also clunky.',
      tone: 'warn',
      cite: CITES.armourSpecials,
    });
  for (const line of equipment) {
    const pack = line.gear ? CARRY.backpacks[line.gear.id] : undefined;
    if (pack)
      effects.push({
        id: `pack:${line.gear!.id}`,
        label: `${pack.dex} DEX from the ${line.gear!.name}`,
        detail: line.gear!.special,
        tone: 'warn',
        cite: CITES.mediumBackpack,
      });
  }
  if (limit !== null && carried > limit)
    effects.push({
      id: 'encumbered',
      label: '−10 to all skills and stats: over the carrying limit',
      detail:
        'The limit as to how much your heroes can carry with them equals the hero’s strength. If the total encumbrance exceeds the STR of your character, all skills and stats are at -10.',
      tone: 'danger',
      cite: CITES.encPenalty,
    });
  const defensive = equipment.find((line) => line.weapon?.special.includes('Defensive'));
  if (defensive)
    effects.push({
      id: 'defensive',
      label: `+10 to parry with the ${defensive.weapon!.name}`,
      detail:
        'This weapon is easy to use defensively and receives +10 when parrying. However, it cannot withstand as much punishment as a good sword, and therefore can only take 4 Points of Damage before it breaks.',
      tone: 'info',
      cite: CITES.weaponSpecials,
    });
  return effects;
}

function buildTodo(
  state: CharacterState,
  species: Species | null,
  profession: Profession | null,
  equipment: EquipmentLine[],
  loadout: Loadout,
  coins: Derived['coins'],
  complete: Record<StationId, boolean>,
  specialisationLeft: number,
  hpDie: number | null,
  random: Talent | undefined,
  alchemistKitDone: boolean,
): Todo[] {
  const todo: Todo[] = [];
  const open = (
    id: string,
    station: StationId,
    label: string,
    severity: Todo['severity'] = 'open',
  ) => todo.push({ id, station, label, severity });
  if (!species) open('species', 'species', 'Choose a species');
  else {
    const missing = STAT_KEYS.filter((key) => statDie(state, key) === null);
    if (missing.length)
      open(
        'dice',
        'dice',
        `Roll ${missing.length === 5 ? 'the five stat dice' : `the die for ${missing.map((k) => k.toUpperCase()).join(', ')}`}`,
      );
    if (hpDie === null) open('hp', 'dice', 'Roll 1d6 for Hit Points');
    if (specialisationLeft > 0 && !missing.length)
      open(
        'specialise',
        'specialise',
        `Place ${specialisationLeft} specialisation point${specialisationLeft === 1 ? '' : 's'}`,
      );
  }
  if (!profession) open('profession', 'profession', 'Choose a profession');
  else {
    if (profession.talentChoice && !state.talentChoice)
      open(
        'talent_choice',
        'powers',
        `Choose a talent: ${profession.talentChoice.map((o) => o.label).join(' or ')}`,
      );
    if (species?.randomTalent && !state.randomTalent.talentId)
      open('random_talent', 'powers', 'Roll the Jack of all trades talent');
    if (random?.namesEnemy && !state.randomTalent.hateTarget)
      open('hate', 'powers', 'Hate: name the enemy');
    if (profession.spells && state.spells.length < profession.spells.quantity)
      open(
        'spells',
        'powers',
        `Pick ${profession.spells.quantity - state.spells.length} more Level 1 spell${profession.spells.quantity - state.spells.length === 1 ? '' : 's'}`,
      );
    if (profession.prayers && state.prayers.length < profession.prayers.quantity)
      open(
        'prayers',
        'powers',
        `Pick ${profession.prayers.quantity - state.prayers.length} more level 1 prayer${profession.prayers.quantity - state.prayers.length === 1 ? '' : 's'}`,
      );
    if (profession.arcanePerkChoice && !state.arcanePerk)
      open('arcane', 'powers', 'Choose the Arcane perk');
    if (profession.id === 'warrior_priest' && (!state.relic.god || !state.relic.form))
      open('relic', 'powers', 'Choose the Religious Relic: god, ring or amulet');
    if (!alchemistKitDone)
      open('alchemy', 'powers', 'Fill the Alchemist’s bag: potions, ingredients, parts, recipe');
    if (state.background.enabled && !complete.background)
      open('background', 'background', 'Roll the Background');
    for (const line of equipment)
      if (line.pending && (line.weapon !== undefined || line.key === 'start:weapon'))
        open(`choose:${line.key}`, 'market', `Choose the ${line.label.toLowerCase()}`);
    if (coins.left < 0) open('coins', 'market', `Over budget by ${-coins.left} c`, 'warn');
    const unrolled = equipment.filter(
      (line) => line.damageable && line.wear === null && !line.pending,
    );
    if (unrolled.length)
      open(
        'wear',
        'loadout',
        `Roll 1d4 wear for ${unrolled.length} item${unrolled.length === 1 ? '' : 's'}`,
      );
    for (const warning of loadout.warnings) open(`loadout:${warning}`, 'loadout', warning, 'warn');
  }
  return todo;
}

/** Uniform pick from a talent category; the book says "roll for a Random Talent" without naming the die. */
export function randomTalentFrom(
  category: TalentCategory,
  talents: readonly Talent[],
  rng: () => number = Math.random,
): Talent {
  const pool = talents.filter((talent) => talent.category === category);
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[index]!;
}

/* ---------------------------------------------------------------------------------------- */

export interface PartyDerived {
  heroes: { hero: CharacterState; derived: Derived }[];
  /** Sum of each hero's RES / 10, as the book calculates the starting Party Morale. */
  morale: number;
  moraleParts: { name: string; amount: number | null }[];
  /** Talent and Background modifiers the party applies on top, once each where the book says so. */
  moraleNotes: { amount: number; source: string }[];
  heroesComplete: number;
  designedSize: number;
}

export function deriveParty(party: PartyState): PartyDerived {
  const heroes = party.heroes.map((hero) => ({ hero, derived: derive(hero) }));
  const moraleParts = heroes.map(({ hero, derived }) => ({
    name: heroName(hero, party),
    amount: derived.partyMoraleContribution,
  }));
  const morale = moraleParts.reduce((sum, part) => sum + (part.amount ?? 0), 0);
  const moraleNotes: { amount: number; source: string }[] = [];
  const seenTalent = new Set<string>();
  for (const { derived } of heroes) {
    for (const note of derived.partyMoraleNotes) {
      // Natural Leader prints "not cumulative if more than one hero has this talent".
      if (note.source === 'Natural Leader') {
        if (seenTalent.has(note.source)) continue;
        seenTalent.add(note.source);
      }
      moraleNotes.push(note);
    }
  }
  return {
    heroes,
    morale,
    moraleParts,
    moraleNotes,
    heroesComplete: heroes.filter(({ derived }) => derived.complete.sheet).length,
    designedSize: 4,
  };
}

export function heroName(hero: CharacterState, party: PartyState): string {
  if (hero.name.trim()) return hero.name.trim();
  const index = party.heroes.findIndex((h) => h.id === hero.id);
  return `Hero ${index + 1}`;
}
