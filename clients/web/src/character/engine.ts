/**
 * The character creator's state and the pure functions that turn it into a filled-in sheet.
 * Every number the sheet shows is derived here from `rules.ts` facts and the player's choices
 * and dice; the components only render. `tests/character-engine.test.ts` covers it.
 */
import {
  ARMOUR_BY_ID,
  BACKGROUNDS,
  CREATION,
  DAMAGE_BONUS,
  NATURAL_ARMOUR,
  PROFESSIONS,
  SKILLS,
  SPECIES,
  STAT_KEYS,
  TALENT_BY_ID,
  WEAPON_BY_ID,
  WEAPON_CLASSES,
  type Armour,
  type Background,
  type CatalogueKind,
  type Profession,
  type ProfessionId,
  type SkillId,
  type Species,
  type SpeciesId,
  type StatKey,
  type Stats,
  type Talent,
  type TalentCategory,
  type Weapon,
} from './rules.ts';

/** One die the player rolled; `reroll` is the replacement die, when one of the two rerolls was spent on it. */
export interface DieRoll {
  value: number | null;
  reroll: number | null;
}

export type RollMode = 'in_order' | 'assign';

export type StepId = 'species' | 'stats' | 'specialise' | 'profession' | 'background' | 'equipment' | 'sheet';
export const STEPS: readonly { id: StepId; label: string }[] = [
  { id: 'species', label: 'Species' },
  { id: 'stats', label: 'Stats' },
  { id: 'specialise', label: 'Specialise' },
  { id: 'profession', label: 'Profession' },
  { id: 'background', label: 'Background' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'sheet', label: 'Sheet' },
];

export interface Purchase {
  key: string;
  kind: CatalogueKind | 'other';
  /** Catalogue id for weapons and armour. */
  id?: string;
  label: string;
  cost: number;
  enc: number;
  quantity: number;
  /** Free-form purchases say whether they can be damaged (and so get a wear roll). */
  damageable: boolean;
}

export interface CharacterState {
  version: 1;
  step: StepId;
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
}

export type CharacterEvent =
  | { type: 'set_step'; step: StepId }
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
  | { type: 'set_cooking_gear'; enabled: boolean }
  | { type: 'reset' };

const emptyRoll = (): DieRoll => ({ value: null, reroll: null });
const zeroStats = (): Stats => ({ str: 0, con: 0, dex: 0, wis: 0, res: 0 });

export function initialState(): CharacterState {
  return {
    version: 1,
    step: 'species',
    name: '',
    species: null,
    rollMode: 'in_order',
    rolls: { str: emptyRoll(), con: emptyRoll(), dex: emptyRoll(), wis: emptyRoll(), res: emptyRoll() },
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
  };
}

/** Accepts a saved state from `localStorage`; anything unrecognised falls back to a fresh sheet. */
export function reviveState(raw: unknown): CharacterState {
  if (!raw || typeof raw !== 'object') return initialState();
  const saved = raw as Partial<CharacterState>;
  if (saved.version !== 1) return initialState();
  return { ...initialState(), ...saved };
}

/** The die the hero keeps: the book lets the player choose the highest of the two. */
export function keptDie(roll: DieRoll): number | null {
  if (roll.value === null) return null;
  return roll.reroll === null ? roll.value : Math.max(roll.value, roll.reroll);
}

export function rerollsUsed(state: CharacterState): number {
  const dice = state.rollMode === 'in_order' ? STAT_KEYS.map((key) => state.rolls[key]) : state.pool;
  return [...dice, state.hitPointsRoll].filter((roll) => roll.reroll !== null).length;
}

export function canReroll(state: CharacterState, roll: DieRoll): boolean {
  return roll.value !== null && roll.reroll === null && rerollsUsed(state) < CREATION.rerolls;
}

function clampDie(value: number, sides: number): number | null {
  return Number.isInteger(value) && value >= 1 && value <= sides ? value : null;
}

export function reduce(state: CharacterState, event: CharacterEvent): CharacterState {
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
      const pool = state.pool.map((roll, i) => (i === event.index ? { value, reroll: null } : roll));
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
      const fresh = initialState();
      return { ...state, rolls: fresh.rolls, pool: fresh.pool, assignment: fresh.assignment, hitPointsRoll: fresh.hitPointsRoll };
    }
    case 'set_specialisation': {
      const points = Math.max(0, Math.min(CREATION.specialisationMaxPerStat, Math.round(event.points)));
      if (!Number.isFinite(points)) return state;
      const others = STAT_KEYS.filter((key) => key !== event.stat).reduce((sum, key) => sum + state.specialisation[key], 0);
      const capped = Math.min(points, CREATION.specialisationPoints - others);
      return { ...state, specialisation: { ...state.specialisation, [event.stat]: Math.max(0, capped) } };
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
      };
    }
    case 'set_talent_choice':
      return { ...state, talentChoice: event.talentId };
    case 'set_random_talent_category':
      return { ...state, randomTalent: { category: event.category, talentId: null, hateTarget: '' } };
    case 'set_random_talent':
      return { ...state, randomTalent: { ...state.randomTalent, talentId: event.talentId, hateTarget: '' } };
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
      return { ...state, weaponChoice: event.weaponId, wear: withoutKey(state.wear, 'start:weapon') };
    case 'set_option_choice':
      return { ...state, optionChoice: event.id, wear: withoutKey(state.wear, 'start:weapon') };
    case 'set_background_enabled':
      return { ...state, background: { enabled: event.enabled, roll: event.enabled ? state.background.roll : null } };
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
      return { ...state, purchases: [...state.purchases, { ...event.purchase, key }] };
    }
    case 'remove_purchase':
      return { ...state, purchases: state.purchases.filter((p) => p.key !== event.key), wear: withoutKey(state.wear, event.key) };
    case 'set_cooking_gear':
      return { ...state, cookingGear: event.enabled };
    case 'reset':
      return initialState();
    default:
      return state;
  }
}

export function reduceAll(state: CharacterState, events: CharacterEvent[]): CharacterState {
  return events.reduce(reduce, state);
}

function toggle(list: string[], id: string, limit: number): string[] {
  if (list.includes(id)) return list.filter((x) => x !== id);
  if (list.length >= limit) return list;
  return [...list, id];
}

function withoutKey(wear: Record<string, number | null>, key: string): Record<string, number | null> {
  if (!(key in wear)) return wear;
  const next = { ...wear };
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
    if (talent) lines.push({ talent, source: `${species!.name} trait`, qualifier: trait.qualifier });
  }
  if (species?.randomTalent && state.randomTalent.talentId) {
    const talent = TALENT_BY_ID.get(state.randomTalent.talentId);
    if (talent) {
      const line: TalentLine = { talent, source: 'Jack of all trades' };
      if (talent.namesEnemy && state.randomTalent.hateTarget) line.qualifier = state.randomTalent.hateTarget;
      lines.push(line);
    }
  }
  for (const grant of profession?.talents ?? []) {
    const talent = TALENT_BY_ID.get(grant.talentId);
    if (talent) lines.push({ talent, source: profession!.name });
  }
  if (profession?.talentChoice && state.talentChoice) {
    const talent = TALENT_BY_ID.get(state.talentChoice);
    if (talent && profession.talentChoice.some((o) => o.talentId === talent.id)) lines.push({ talent, source: `${profession.name} choice` });
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
  /** Catalogue data when the item is a listed weapon or armour piece. */
  weapon?: Weapon;
  armour?: Armour;
  enc: number | null;
  /** Items the book lets the player damage before play. */
  damageable: boolean;
  durabilityMax: number | null;
  wear: number | null;
  durabilityLeft: number | null;
  note?: string;
  /** Still to be chosen by the player. */
  pending: boolean;
}

export interface WeaponClassUse {
  weaponClass: number;
  twoHands: boolean;
  oneHand: boolean | null;
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
  hitPointsParts: { die: number | null; base: number | null; profession: number | null; talents: number };
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
  coins: { start: number; spent: number; left: number; source: string };
  encumbrance: { carried: number; limit: number | null; hardCap: number | null; extra: { amount: number; source: string }[] };
  warnings: string[];
  complete: Record<StepId, boolean>;
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
  const hitPoints = species && hpDie !== null ? species.hitPointsBase + hpDie + (profession?.hitPoints ?? 0) + hpTalents : null;

  const damageBonus = stats.str !== undefined ? lookupBonus(DAMAGE_BONUS, stats.str) : null;
  const naturalArmour = stats.con !== undefined ? lookupBonus(NATURAL_ARMOUR, stats.con) : null;
  const manaTalents = talents.reduce((sum, line) => sum + (line.talent.effects?.mana ?? 0), 0);
  const mana = profession?.id === 'wizard' && stats.wis !== undefined ? stats.wis * CREATION.manaPerWisdom + manaTalents : null;

  const energy = profession?.startingEnergy ?? CREATION.energy;
  const luck = (species?.startingLuck ?? CREATION.luck) + talents.filter((l) => l.source !== `${species?.name} trait` || l.talent.id !== 'lucky').reduce((sum, l) => sum + (l.talent.effects?.luck ?? 0), 0);
  const sanity = CREATION.sanity + talents.reduce((sum, l) => sum + (l.talent.effects?.sanity ?? 0), 0) + (background?.sanity ?? 0);
  const movement = CREATION.movement + talents.reduce((sum, l) => sum + (l.talent.effects?.movement ?? 0), 0);

  const partyMoraleContribution = stats.res !== undefined ? Math.floor(stats.res / 10) : null;
  const partyMoraleNotes: { amount: number; source: string }[] = [];
  for (const line of talents) if (line.talent.effects?.partyMorale) partyMoraleNotes.push({ amount: line.talent.effects.partyMorale, source: line.talent.name });
  if (background?.partyMorale) partyMoraleNotes.push({ amount: background.partyMorale, source: background.name });

  const skills: SkillLine[] = SKILLS.map((skill) => {
    const base = stats[skill.stat] ?? null;
    const modifier = profession ? profession.modifiers[skill.id] : null;
    const freeSkill = state.freeSkill === skill.id && modifier !== null && modifier < 0 ? CREATION.freeSkillBonus : 0;
    const talentBonus = talents.reduce((sum, l) => sum + (l.talent.effects?.skills?.[skill.id] ?? 0), 0);
    const available = profession !== null && modifier !== null;
    const value = available && base !== null ? Math.max(0, base + modifier + freeSkill + talentBonus) : null;
    return { id: skill.id, name: skill.name, abbr: skill.abbr, stat: skill.stat, base, modifier: profession ? modifier : null, freeSkill, talentBonus, value };
  });

  const classStrengthBonus = talents.reduce((sum, l) => sum + (l.talent.effects?.weaponClassStrength ?? 0), 0);
  const weaponClassStrength = stats.str !== undefined ? stats.str + classStrengthBonus : null;
  const weaponClasses: WeaponClassUse[] = WEAPON_CLASSES.map((row) => ({
    weaponClass: row.weaponClass,
    twoHands: weaponClassStrength !== null && weaponClassStrength >= row.twoHands,
    oneHand: row.oneHand === null ? null : weaponClassStrength !== null && weaponClassStrength >= row.oneHand,
  }));

  const equipment = equipmentLines(state, species, profession);
  for (const line of equipment) if (line.note && line.note.startsWith('!')) warnings.push(line.note.slice(1));

  const coinsStart = background?.startingCoins ?? CREATION.startingCoins;
  const spent = state.purchases.reduce((sum, p) => sum + p.cost * p.quantity, 0) + (state.cookingGear ? CREATION.cookingGearCost : 0);
  const coins = { start: coinsStart, spent, left: coinsStart - spent, source: background?.startingCoins ? background.name : 'Starting Equipment' };
  if (coins.left < 0) warnings.push('The purchases cost more than the starting coins.');

  const carried = equipment.reduce((sum, line) => sum + (line.enc ?? 0) * line.quantity, 0);
  const extra: { amount: number; source: string }[] = [];
  for (const line of talents) if (line.talent.effects?.carry) extra.push({ amount: line.talent.effects.carry, source: line.talent.name });
  if (equipment.some((line) => line.key === 'start:medium_backpack')) extra.push({ amount: CREATION.mediumBackpackEncumbrance, source: 'Medium backpack' });
  const limit = stats.str !== undefined ? stats.str + extra.reduce((sum, e) => sum + e.amount, 0) : null;
  const hardCap = stats.str !== undefined ? stats.str + CREATION.encumbranceHardCapOverStrength : null;
  if (limit !== null && carried > limit) warnings.push(`Encumbrance ${carried} exceeds the STR limit of ${limit}: all skills and stats are at -10.`);
  if (hardCap !== null && carried > hardCap) warnings.push(`Encumbrance ${carried} exceeds the hard cap of STR+15 (${hardCap}).`);

  // Profession and species limitations on chosen and bought gear.
  for (const line of equipment) {
    if (line.weapon && profession?.maxWeaponClass && line.weapon.weaponClass !== null && line.weapon.weaponClass > profession.maxWeaponClass)
      warnings.push(`${line.weapon.name} is Class ${line.weapon.weaponClass}; a ${profession.name} may never use weapons heavier than Class ${profession.maxWeaponClass}.`);
    if (line.armour && profession?.maxArmourTier && line.armour.tier > profession.maxArmourTier)
      warnings.push(`${line.armour.name} is Tier ${line.armour.tier}; a ${profession.name} may never use armour heavier than Tier ${profession.maxArmourTier}.`);
    if (line.weapon && species && (species.id === 'dwarf' || species.id === 'halfling') && (line.weapon.id === 'longbow' || line.weapon.id === 'elven_bow') && line.key !== 'start:longbow')
      warnings.push(`${species.name} characters cannot use Longbows or Elven bows.`);
    if (line.weapon && line.weapon.weaponClass !== null && weaponClassStrength !== null) {
      const use = weaponClasses.find((c) => c.weaponClass === line.weapon!.weaponClass);
      if (use && !use.twoHands) warnings.push(`${line.weapon.name} is Class ${line.weapon.weaponClass}; STR ${weaponClassStrength} is below the ${WEAPON_CLASSES[line.weapon.weaponClass - 1]!.twoHands} needed even with two hands.`);
    }
  }
  if (background?.wizardReroll && profession?.id === 'wizard') warnings.push('The Fraud is not applicable for wizards: reroll the Background.');

  // Random talent eligibility, flagged rather than blocked: the book does not say what an ineligible roll means.
  const random = state.randomTalent.talentId ? TALENT_BY_ID.get(state.randomTalent.talentId) : undefined;
  if (random?.restriction) {
    const r = random.restriction;
    const have = new Set(talents.map((l) => l.talent.id));
    let eligible = true;
    if (r.professions && (!profession || !r.professions.includes(profession.id))) eligible = false;
    if (r.notProfessions && profession && r.notProfessions.includes(profession.id)) eligible = false;
    if (r.speciesTrait && !species?.traits.some((trait) => trait.talentId === random.id)) eligible = false;
    if (r.requiresTalent && !have.has(r.requiresTalent)) eligible = false;
    if (r.requiresStat && (stats[r.requiresStat.stat] ?? 0) < r.requiresStat.value) eligible = false;
    if (!eligible) warnings.push(`${random.name}: "${r.printed}" The book does not say what an ineligible random talent means; roll again or agree at the table.`);
  }
  if (random?.namesEnemy && !state.randomTalent.hateTarget) warnings.push('Hate: name the enemy the hero hates.');
  const randomCount = talents.filter((l) => l.source === 'Jack of all trades').length;
  if (random && randomCount && talents.filter((l) => l.talent.id === random.id).length > 1 && !random.namesEnemy)
    warnings.push(`${random.name} is already granted by the species or profession; the book does not say whether a duplicate random talent is rerolled.`);

  const complete: Record<StepId, boolean> = {
    species: species !== null,
    stats: species !== null && STAT_KEYS.every((key) => statDie(state, key) !== null) && hpDie !== null,
    specialise: specialisationLeft === 0,
    profession: professionComplete(state, profession, species),
    background: profession !== null && (!state.background.enabled || background !== null),
    equipment: profession !== null && equipment.every((line) => !line.pending && (!line.damageable || line.wear !== null)) && coins.left >= 0,
    sheet: false,
  };
  complete.sheet = complete.species && complete.stats && complete.specialise && complete.profession && complete.background && complete.equipment;

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
    hitPointsParts: { die: hpDie, base: species?.hitPointsBase ?? null, profession: profession?.hitPoints ?? null, talents: hpTalents },
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
    coins,
    encumbrance: { carried, limit, hardCap, extra },
    warnings,
    complete,
  };
}

function professionComplete(state: CharacterState, profession: Profession | null, species: Species | null): boolean {
  if (!profession) return false;
  if (profession.talentChoice && !state.talentChoice) return false;
  if (profession.spells && state.spells.length !== profession.spells.quantity) return false;
  if (profession.prayers && state.prayers.length !== profession.prayers.quantity) return false;
  if (profession.arcanePerkChoice && !state.arcanePerk) return false;
  if (species?.randomTalent && !state.randomTalent.talentId) return false;
  const random = state.randomTalent.talentId ? TALENT_BY_ID.get(state.randomTalent.talentId) : undefined;
  if (random?.namesEnemy && !state.randomTalent.hateTarget) return false;
  return true;
}

function equipmentLines(state: CharacterState, species: Species | null, profession: Profession | null): EquipmentLine[] {
  const lines: EquipmentLine[] = [];
  const wearOf = (key: string): number | null => state.wear[key] ?? null;
  const left = (max: number, wear: number | null): number | null => (wear === null ? null : max - Math.min(wear, max - 1));

  for (const item of profession?.equipment ?? []) {
    const key = `start:${item.key}`;
    let weapon: Weapon | undefined;
    let armour: Armour | undefined;
    let label = item.quantity > 1 ? `${item.quantity} × ${item.label}` : item.label;
    let note: string | undefined;
    let pending = false;
    if (item.catalogue?.kind === 'weapon') weapon = WEAPON_BY_ID.get(item.catalogue.id);
    if (item.catalogue?.kind === 'armour') armour = ARMOUR_BY_ID.get(item.catalogue.id);
    if (item.key === 'longbow' && species && (species.id === 'dwarf' || species.id === 'halfling')) {
      weapon = WEAPON_BY_ID.get('shortbow');
      label = 'Shortbow (instead of the printed Longbow)';
      note = 'Designer ruling (FAQ; changelog 2.22 entry 2): a Dwarf or Halfling Ranger takes a Shortbow instead.';
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
    if (item.qualifier && !note) note = item.qualifier;
    const damageable = Boolean(weapon || armour);
    const durabilityMax = weapon?.durability ?? armour?.durability ?? null;
    const wear = damageable ? wearOf(key) : null;
    const line: EquipmentLine = {
      key,
      label,
      quantity: item.quantity,
      enc: weapon?.enc ?? armour?.enc ?? null,
      damageable,
      durabilityMax,
      wear,
      durabilityLeft: durabilityMax !== null ? left(durabilityMax, wear) : null,
      pending,
    };
    if (weapon) line.weapon = weapon;
    if (armour) line.armour = armour;
    if (note) line.note = note;
    lines.push(line);
  }

  for (const purchase of state.purchases) {
    const weapon = purchase.kind === 'weapon' && purchase.id ? WEAPON_BY_ID.get(purchase.id) : undefined;
    const armour = purchase.kind === 'armour' && purchase.id ? ARMOUR_BY_ID.get(purchase.id) : undefined;
    const damageable = purchase.damageable;
    const durabilityMax = damageable ? (weapon?.durability ?? armour?.durability ?? CREATION.standardDurability) : null;
    const wear = damageable ? wearOf(purchase.key) : null;
    const line: EquipmentLine = {
      key: purchase.key,
      label: purchase.quantity > 1 ? `${purchase.quantity} × ${purchase.label}` : purchase.label,
      quantity: purchase.quantity,
      enc: purchase.enc,
      damageable,
      durabilityMax,
      wear,
      durabilityLeft: durabilityMax !== null ? left(durabilityMax, wear) : null,
      pending: false,
      note: `Bought for ${purchase.cost * purchase.quantity} c`,
    };
    if (weapon) line.weapon = weapon;
    if (armour) line.armour = armour;
    lines.push(line);
  }

  if (state.cookingGear && species?.id === 'halfling') {
    lines.push({ key: 'cooking_gear', label: 'Cooking gear', quantity: 1, enc: null, damageable: false, durabilityMax: null, wear: null, durabilityLeft: null, pending: false, note: 'Bought for 50 c (Halfling special)' });
  }
  return lines;
}

/** Uniform pick from a talent category; the book says "roll for a Random Talent" without naming the die. */
export function randomTalentFrom(category: TalentCategory, talents: readonly Talent[], rng: () => number = Math.random): Talent {
  const pool = talents.filter((talent) => talent.category === category);
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[index]!;
}
