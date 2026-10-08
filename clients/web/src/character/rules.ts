/**
 * Rulebook facts the character creator runs on. Every fact carries the page it was read from
 * and the corpus record id it came from; `tests/character-rules.test.ts` reads those records
 * back through the agent tools and fails when a value, wording or page drifts from the corpus.
 * Nothing here is invented: where the book is silent (how a random talent is rolled, what an
 * ineligible random talent means, how fractional Mana rounds) the creator says so.
 */
export interface Cite {
  /** Printed folio, or null for an unnumbered page. */
  page: number | null;
  /** 1-based physical page in the PDF. */
  pdf: number;
  heading: string;
  /** Corpus record the fact was read from, when there is one. */
  recordId?: string;
}

export const CITES = {
  creation: { page: 27, pdf: 29, heading: 'Creating your Character', recordId: 'procedure.character_creation' },
  speciesFirst: { page: 27, pdf: 29, heading: 'Choosing Your Species', recordId: 'character.creation.species_first' },
  rollStats: { page: 27, pdf: 29, heading: 'Rolling Your Stats', recordId: 'character.creation.roll_stats' },
  rollAll: { page: 27, pdf: 29, heading: 'Option', recordId: 'character.creation.roll_all_option' },
  reroll: { page: 27, pdf: 29, heading: 'Rolling Your Stats', recordId: 'procedure.character_creation_reroll' },
  hitPoints: { page: 27, pdf: 29, heading: 'Hit Points', recordId: 'character.creation.hit_points' },
  specialisation: { page: 27, pdf: 29, heading: 'Specialisation', recordId: 'procedure.character_creation_specialisation' },
  damageBonus: { page: 27, pdf: 29, heading: 'Damage Bonus and Natural Armour', recordId: 'table.character.damage_bonus' },
  naturalArmour: { page: 27, pdf: 29, heading: 'Damage Bonus and Natural Armour', recordId: 'table.character.natural_armour' },
  strengthWeaponClass: { page: 27, pdf: 29, heading: 'Strength and Weapon Class', recordId: 'character.creation.strength_weapon_class' },
  weaponClassTable: { page: 49, pdf: 51, heading: 'Class', recordId: 'table.equipment.weapon_class_strength' },
  mana: { page: 27, pdf: 29, heading: 'Mana', recordId: 'character.mana.initial' },
  energy: { page: 27, pdf: 29, heading: 'Energy', recordId: 'character.energy.initial' },
  movement: { page: 25, pdf: 27, heading: 'Movement (M)', recordId: 'character.movement.initial' },
  traitsAreTalents: { page: 25, pdf: 27, heading: 'Traits', recordId: 'character.species.traits_are_talents' },
  skillBases: { page: 26, pdf: 28, heading: 'Skills List', recordId: 'table.character.skill_bases' },
  dwarf: { page: 28, pdf: 30, heading: 'Dwarf', recordId: 'species.dwarf' },
  elf: { page: 28, pdf: 30, heading: 'Elf', recordId: 'species.elf' },
  halfling: { page: 29, pdf: 31, heading: 'Halfling', recordId: 'species.halfling' },
  human: { page: 29, pdf: 31, heading: 'Human', recordId: 'species.human' },
  halflingCookingGear: { page: 29, pdf: 31, heading: 'Special', recordId: 'character.species.halfling.cooking_gear' },
  professionTalents: { page: 30, pdf: 32, heading: 'Profession and Talents', recordId: 'character.creation.profession_talents' },
  skills: { page: 30, pdf: 32, heading: 'Skills', recordId: 'character.skill.starting_value' },
  skillProcedure: { page: 30, pdf: 32, heading: 'Profession and Talents; Skills; Free Skill', recordId: 'procedure.character_creation_skill' },
  freeSkill: { page: 30, pdf: 32, heading: 'Free Skill', recordId: 'character.skill.free_skill' },
  spellsAndPrayers: { page: 30, pdf: 32, heading: 'Magic Spells and Prayers', recordId: 'character.creation.spells_and_prayers' },
  backgroundOptional: { page: 30, pdf: 32, heading: 'Background (optional)', recordId: 'character.creation.background_optional' },
  startingEquipment: { page: 30, pdf: 32, heading: 'Starting Equipment', recordId: 'character.creation.starting_coins' },
  buyBeforeGame: { page: 30, pdf: 32, heading: 'Buying Equipment before the Game', recordId: 'character.creation.buy_before_game' },
  wear: { page: 30, pdf: 32, heading: 'Starting Equipment; Buying Equipment before the Game', recordId: 'procedure.character_creation_equipment_wear' },
  backpack: { page: 30, pdf: 32, heading: 'Backpack', recordId: 'character.creation.small_backpack' },
  finalTouches: { page: 31, pdf: 33, heading: 'Final Touches', recordId: 'character.luck.initial' },
  sanity: { page: 31, pdf: 33, heading: 'Sanity', recordId: 'character.creation.starting_sanity' },
  level: { page: 31, pdf: 33, heading: 'Level', recordId: 'character.level.initial' },
  partyMorale: { page: 31, pdf: 33, heading: 'Party Morale', recordId: 'character.creation.party_morale' },
  alchemist: { page: 32, pdf: 34, heading: 'Alchemist', recordId: 'profession.alchemist' },
  barbarian: { page: 33, pdf: 35, heading: 'Barbarian', recordId: 'profession.barbarian' },
  ranger: { page: 34, pdf: 36, heading: 'Ranger', recordId: 'profession.ranger' },
  rangerBow: { page: 34, pdf: 36, heading: 'Starting Equipment', recordId: 'character.profession.ranger.short_arms_starting_bow' },
  rogue: { page: 35, pdf: 37, heading: 'Rogue', recordId: 'profession.rogue' },
  thief: { page: 36, pdf: 38, heading: 'Thief', recordId: 'profession.thief' },
  warrior: { page: 37, pdf: 39, heading: 'Warrior', recordId: 'profession.warrior' },
  warriorPriest: { page: 38, pdf: 40, heading: 'Warrior Priest', recordId: 'profession.warrior_priest' },
  warriorPriestEnergy: { page: 38, pdf: 40, heading: 'Warrior Priest', recordId: 'character.profession.warrior_priest.initial_energy' },
  wizard: { page: 39, pdf: 41, heading: 'Wizard', recordId: 'profession.wizard' },
  backgrounds: { page: 40, pdf: 42, heading: 'Wanderlust', recordId: 'background.wanderlust' },
  encumbrance: { page: 51, pdf: 53, heading: 'Encumbrance', recordId: 'character.encumbrance.limit' },
  durability: { page: 49, pdf: 51, heading: 'Durability (DUR)', recordId: 'character.durability.standard' },
  statMaxima: { page: 58, pdf: 60, heading: 'Stats and Skills Maximum', recordId: 'table.character.stat_maxima' },
  prayers: { page: 80, pdf: 82, heading: 'Bringer of Light', recordId: 'prayer.bringer_of_light' },
  arcanePerks: { page: 169, pdf: 171, heading: 'arcane Perks', recordId: 'table.perk.arcane' },
  commonPerks: { page: 168, pdf: 170, heading: 'Heroic Force of Will', recordId: 'perk.heroic_force_of_will' },
  frenzy: { page: 167, pdf: 169, heading: 'Frenzy', recordId: 'perk.frenzy' },
  physicalTalents: { page: 170, pdf: 172, heading: 'Physical Talents', recordId: 'table.talent.physical_pilot' },
  combatTalents: { page: 171, pdf: 173, heading: 'Combat Talents', recordId: 'table.talent.combat_pilot' },
  alchemistTalents: { page: 172, pdf: 174, heading: 'alchemist Talents', recordId: 'table.talent.alchemist' },
  faithTalents: { page: 172, pdf: 174, heading: 'faith Talents', recordId: 'table.talent.faith' },
  commonTalents: { page: 173, pdf: 175, heading: 'common Talents', recordId: 'table.talent.common' },
  magicTalents: { page: 174, pdf: 176, heading: 'magic Talents', recordId: 'table.talent.magic' },
  sneakyTalents: { page: 175, pdf: 177, heading: 'sneaky Talents', recordId: 'table.talent.sneaky' },
  mentalTalents: { page: 176, pdf: 178, heading: 'mental Talents', recordId: 'table.talent.mental' },
  weapons: { page: 177, pdf: 179, heading: 'Weapons', recordId: 'table.equipment.weapons' },
  armour: { page: 178, pdf: 180, heading: 'Armour and Shields', recordId: 'table.equipment.armour' },
  spellsLevel1: { page: 185, pdf: 187, heading: 'Name / CV / Mana / Upkeep / Special / School / Description and effect', recordId: 'table.spells.level_1' },
  relics: { page: 194, pdf: 196, heading: 'Table of Relics', recordId: 'table.treasure.relics' },
  mediumBackpack: { page: 182, pdf: 184, heading: 'Miscellaneous', recordId: 'character.equipment.general.backpack_medium.capacity' },
} as const satisfies Record<string, Cite>;

/* Constants the creation sequence seeds. */
export const CREATION = {
  startingCoins: 150,
  nobleCoins: 400,
  sanity: 8,
  luck: 0,
  halflingLuck: 1,
  energy: 1,
  warriorPriestEnergy: 2,
  level: 1,
  experience: 0,
  movement: 4,
  specialisationPoints: 15,
  specialisationMaxPerStat: 10,
  rerolls: 2,
  freeSkillBonus: 10,
  manaPerWisdom: 1.5,
  /** Carrying limit before the -10 penalty, and the hard cap. */
  encumbranceHardCapOverStrength: 15,
  standardDurability: 6,
  defensiveWeaponDurability: 4,
  wearDie: 4,
  cookingGearCost: 50,
  mediumBackpackEncumbrance: 10,
  mediumBackpackDexterity: -5,
} as const;

export type StatKey = 'str' | 'con' | 'dex' | 'wis' | 'res';
export type Stats = Record<StatKey, number>;
export const STAT_KEYS: readonly StatKey[] = ['str', 'con', 'dex', 'wis', 'res'];
export const STAT_NAMES: Record<StatKey, { abbr: string; name: string }> = {
  str: { abbr: 'STR', name: 'Strength' },
  con: { abbr: 'CON', name: 'Constitution' },
  dex: { abbr: 'DEX', name: 'Dexterity' },
  wis: { abbr: 'WIS', name: 'Wisdom' },
  res: { abbr: 'RES', name: 'Resolve' },
};

export type SpeciesId = 'dwarf' | 'elf' | 'halfling' | 'human';

export interface SpeciesTrait {
  talentId: string;
  label: string;
  /** Dwarves hate Goblins: the qualifier printed with the trait. */
  qualifier?: string;
}

export interface Species {
  id: SpeciesId;
  name: string;
  cite: Cite;
  statsTableId: string;
  /** The fixed part of each `N+1d10` stat roll. */
  base: Stats;
  /** The fixed part of the `1d6+N` Hit Point roll. */
  hitPointsBase: number;
  hitPointsPrinted: string;
  traits: SpeciesTrait[];
  /** Jack of all trades: roll for a Random Talent from a chosen category. */
  randomTalent: boolean;
  startingLuck: number;
  limitations: string[];
  special?: string;
  /** Row id in table.character.stat_maxima. */
  maxima: Stats;
}

export const SPECIES: readonly Species[] = [
  {
    id: 'dwarf',
    name: 'Dwarf',
    cite: CITES.dwarf,
    statsTableId: 'table.character.dwarf_stats',
    base: { str: 40, con: 30, dex: 25, wis: 25, res: 30 },
    hitPointsBase: 8,
    hitPointsPrinted: '1d6+8',
    traits: [
      { talentId: 'hate', label: 'Hate Goblins', qualifier: 'Goblins' },
      { talentId: 'night_vision', label: 'Night Vision' },
    ],
    randomTalent: false,
    startingLuck: 0,
    limitations: ['Due to their height, Dwarf characters cannot use Longbows or Elven bows.'],
    maxima: { str: 80, dex: 60, wis: 80, res: 80, con: 70 },
  },
  {
    id: 'elf',
    name: 'Elf',
    cite: CITES.elf,
    statsTableId: 'table.character.elf_stats',
    base: { str: 25, con: 20, dex: 40, wis: 35, res: 30 },
    hitPointsBase: 6,
    hitPointsPrinted: '1d6+6',
    traits: [
      { talentId: 'perfect_hearing', label: 'Perfect Hearing' },
      { talentId: 'night_vision', label: 'Night Vision' },
    ],
    randomTalent: false,
    startingLuck: 0,
    limitations: [],
    maxima: { str: 60, dex: 80, wis: 80, res: 80, con: 65 },
  },
  {
    id: 'halfling',
    name: 'Halfling',
    cite: CITES.halfling,
    statsTableId: 'table.character.halfling_stats',
    base: { str: 20, con: 20, dex: 40, wis: 30, res: 40 },
    hitPointsBase: 5,
    hitPointsPrinted: '1d6+5',
    traits: [{ talentId: 'lucky', label: 'Lucky (Starts with 1 Point of Luck).' }],
    randomTalent: false,
    startingLuck: 1,
    limitations: ['Due to their height, Halfling characters cannot use Longbows or Elven bows.'],
    special: 'A Halfling may purchase Cooking gear for 50 c before start of the game.',
    maxima: { str: 40, dex: 80, wis: 80, res: 80, con: 60 },
  },
  {
    id: 'human',
    name: 'Human',
    cite: CITES.human,
    statsTableId: 'table.character.human_stats',
    base: { str: 30, con: 30, dex: 30, wis: 30, res: 30 },
    hitPointsBase: 7,
    hitPointsPrinted: '1d6+7',
    traits: [],
    randomTalent: true,
    startingLuck: 0,
    limitations: [],
    maxima: { str: 70, dex: 70, wis: 80, res: 80, con: 65 },
  },
];

export type SkillId =
  | 'combat_skill'
  | 'ranged_skill'
  | 'dodge'
  | 'pick_locks'
  | 'barter'
  | 'heal'
  | 'alchemy'
  | 'perception'
  | 'arcane_art'
  | 'foraging'
  | 'battle_prayers';

export interface Skill {
  id: SkillId;
  name: string;
  abbr: string;
  stat: StatKey;
  /** Row id in table.character.skill_bases. */
  rowId: string;
}

/** The Skills List on p. 26, in the book's order; the base stat is printed in parenthesis. */
export const SKILLS: readonly Skill[] = [
  { id: 'combat_skill', name: 'Combat Skill', abbr: 'CS', stat: 'dex', rowId: 'skill_0' },
  { id: 'ranged_skill', name: 'Ranged Skill', abbr: 'RS', stat: 'dex', rowId: 'skill_1' },
  { id: 'dodge', name: 'Dodge', abbr: 'Dodge', stat: 'dex', rowId: 'skill_2' },
  { id: 'arcane_art', name: 'Arcane Art', abbr: 'AA', stat: 'wis', rowId: 'skill_3' },
  { id: 'barter', name: 'Barter', abbr: 'Barter', stat: 'wis', rowId: 'skill_4' },
  { id: 'heal', name: 'Heal', abbr: 'Heal', stat: 'wis', rowId: 'skill_5' },
  { id: 'foraging', name: 'Foraging', abbr: 'Forage', stat: 'con', rowId: 'skill_6' },
  { id: 'pick_locks', name: 'Pick Locks', abbr: 'PL', stat: 'dex', rowId: 'skill_7' },
  { id: 'alchemy', name: 'Alchemy', abbr: 'Alch', stat: 'wis', rowId: 'skill_8' },
  { id: 'perception', name: 'Perception', abbr: 'PER', stat: 'wis', rowId: 'skill_9' },
  { id: 'battle_prayers', name: 'Battle Prayers', abbr: 'BP', stat: 'res', rowId: 'skill_10' },
];

export type ProfessionId =
  | 'alchemist'
  | 'barbarian'
  | 'ranger'
  | 'rogue'
  | 'thief'
  | 'warrior'
  | 'warrior_priest'
  | 'wizard';

export type CatalogueKind = 'weapon' | 'armour';

export interface StartingItem {
  key: string;
  label: string;
  quantity: number;
  selection: 'fixed' | 'choice' | 'random';
  /** Catalogue entry when the item is a weapon or armour piece the book lists. */
  catalogue?: { kind: CatalogueKind; id: string };
  /** Catalogue options for a printed either/or choice. */
  options?: { kind: CatalogueKind; id: string }[];
  /** "Weapon of choice": any weapon from the catalogue. */
  anyWeapon?: boolean;
  qualifier?: string;
}

export interface ProfessionTalentOption {
  talentId: string;
  label: string;
}

export interface Profession {
  id: ProfessionId;
  name: string;
  cite: Cite;
  skillTableId: string;
  /** Profession modifier per skill; null where the table prints N/A. */
  modifiers: Record<SkillId, number | null>;
  hitPoints: number;
  hitPointsPrinted: string;
  /** Talents every member starts with. */
  talents: ProfessionTalentOption[];
  /** One talent to pick from these, when the book says "X or Y". */
  talentChoice?: ProfessionTalentOption[];
  perks: { perkId: string; label: string }[];
  /** "One Arcane perk of choice". */
  arcanePerkChoice?: boolean;
  spells?: { quantity: number; level: number };
  prayers?: { quantity: number; level: number };
  startingEnergy?: number;
  equipment: StartingItem[];
  limitations: string[];
  /** Highest armour Tier the profession may wear, when limited. */
  maxArmourTier?: number;
  /** Highest weapon Class the profession may use, when limited. */
  maxWeaponClass?: number;
  special?: string[];
}

const NA = null;

export const PROFESSIONS: readonly Profession[] = [
  {
    id: 'alchemist',
    name: 'Alchemist',
    cite: CITES.alchemist,
    skillTableId: 'table.character.alchemist_skills',
    modifiers: {
      combat_skill: -5, alchemy: 10, ranged_skill: -5, perception: -10, dodge: -10, arcane_art: NA,
      pick_locks: -20, foraging: -20, barter: 0, battle_prayers: NA, heal: 5,
    },
    hitPoints: 0,
    hitPointsPrinted: '±0',
    talents: [{ talentId: 'resistance_to_poison', label: 'Resistance to Poison' }],
    perks: [{ perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' }],
    equipment: [
      { key: 'backpack', label: 'Small backpack', quantity: 1, selection: 'fixed' },
      { key: 'alchemist_tools', label: 'Alchemist tools', quantity: 1, selection: 'fixed' },
      { key: 'alchemist_belt', label: 'Alchemist belt', quantity: 1, selection: 'fixed' },
      { key: 'shortsword', label: 'Shortsword', quantity: 1, selection: 'fixed', catalogue: { kind: 'weapon', id: 'shortsword' } },
      { key: 'potions', label: 'potions', quantity: 3, selection: 'choice', qualifier: 'standard level' },
      { key: 'bag', label: 'bag', quantity: 1, selection: 'fixed' },
      { key: 'ingredients', label: 'ingredients', quantity: 3, selection: 'random', qualifier: 'in the bag' },
      { key: 'parts', label: 'parts', quantity: 3, selection: 'choice' },
      { key: 'recipe', label: 'recipe', quantity: 1, selection: 'choice', qualifier: 'for a Weak Potion' },
    ],
    limitations: ['Alchemists may never use armour heavier than Tier 3.'],
    maxArmourTier: 3,
  },
  {
    id: 'barbarian',
    name: 'Barbarian',
    cite: CITES.barbarian,
    skillTableId: 'table.character.barbarian_skills',
    modifiers: {
      combat_skill: 15, alchemy: -25, ranged_skill: -10, perception: -5, dodge: 5, arcane_art: NA,
      pick_locks: -20, foraging: -15, barter: -15, battle_prayers: NA, heal: -10,
    },
    hitPoints: 2,
    hitPointsPrinted: '+2',
    talents: [],
    perks: [
      { perkId: 'frenzy', label: 'Frenzy' },
      { perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' },
    ],
    equipment: [
      { key: 'backpack', label: 'Small backpack', quantity: 1, selection: 'fixed' },
      { key: 'weapon', label: 'Weapon of choice', quantity: 1, selection: 'choice', anyWeapon: true },
    ],
    limitations: ['Barbarians may never use armour heavier than Tier 3.'],
    maxArmourTier: 3,
  },
  {
    id: 'ranger',
    name: 'Ranger',
    cite: CITES.ranger,
    skillTableId: 'table.character.ranger_skills',
    modifiers: {
      combat_skill: -5, alchemy: -20, ranged_skill: 15, perception: 0, dodge: -5, arcane_art: NA,
      pick_locks: -25, foraging: 15, barter: -20, battle_prayers: NA, heal: -10,
    },
    hitPoints: 0,
    hitPointsPrinted: '±0',
    talents: [{ talentId: 'observant', label: 'Observant' }],
    talentChoice: [
      { talentId: 'marksman', label: 'Marksman' },
      { talentId: 'hunter', label: 'Hunter' },
    ],
    perks: [{ perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' }],
    equipment: [
      { key: 'backpack', label: 'Small backpack', quantity: 1, selection: 'fixed' },
      { key: 'longbow', label: 'Longbow', quantity: 1, selection: 'fixed', catalogue: { kind: 'weapon', id: 'longbow' } },
      { key: 'arrows', label: 'arrows', quantity: 10, selection: 'fixed' },
    ],
    limitations: ['Rangers may never use armour heavier than Tier 3.'],
    maxArmourTier: 3,
  },
  {
    id: 'rogue',
    name: 'Rogue',
    cite: CITES.rogue,
    skillTableId: 'table.character.rogue_skills',
    modifiers: {
      combat_skill: 0, alchemy: -25, ranged_skill: 0, perception: 0, dodge: 0, arcane_art: NA,
      pick_locks: 0, foraging: 0, barter: 5, battle_prayers: NA, heal: -10,
    },
    hitPoints: 1,
    hitPointsPrinted: '+1',
    talents: [
      { talentId: 'backstabber', label: 'Backstabber' },
      { talentId: 'streetwise', label: 'Streetwise' },
    ],
    perks: [{ perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' }],
    equipment: [
      { key: 'backpack', label: 'Small Backpack', quantity: 1, selection: 'fixed' },
      {
        key: 'weapon',
        label: 'Shortsword or Rapier',
        quantity: 1,
        selection: 'choice',
        options: [
          { kind: 'weapon', id: 'shortsword' },
          { kind: 'weapon', id: 'rapier' },
        ],
      },
      { key: 'padded_jacket', label: 'Padded Jacket', quantity: 1, selection: 'fixed', catalogue: { kind: 'armour', id: 'padded_jacket' } },
      { key: 'lock_picks', label: 'Lock Picks', quantity: 10, selection: 'fixed' },
      { key: 'medium_backpack', label: 'Medium backpack', quantity: 1, selection: 'fixed' },
    ],
    limitations: ['A Rogue may never use armour heavier than Tier 3.'],
    maxArmourTier: 3,
  },
  {
    id: 'thief',
    name: 'Thief',
    cite: CITES.thief,
    skillTableId: 'table.character.thief_skills',
    modifiers: {
      combat_skill: -5, alchemy: -30, ranged_skill: 5, perception: 10, dodge: 5, arcane_art: NA,
      pick_locks: 10, foraging: -20, barter: 0, battle_prayers: NA, heal: -20,
    },
    hitPoints: 0,
    hitPointsPrinted: '±0',
    talents: [{ talentId: 'evaluate', label: 'Evaluate' }],
    perks: [{ perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' }],
    equipment: [
      { key: 'backpack', label: 'Small backpack', quantity: 1, selection: 'fixed' },
      { key: 'dagger', label: 'Dagger', quantity: 1, selection: 'fixed', catalogue: { kind: 'weapon', id: 'dagger' } },
      { key: 'rope', label: 'Rope', quantity: 1, selection: 'fixed' },
      { key: 'lock_picks', label: 'Lock Picks', quantity: 10, selection: 'fixed' },
    ],
    limitations: ['A Thief may never use armour heavier than Tier 3 or weapons heavier than Class 2.'],
    maxArmourTier: 3,
    maxWeaponClass: 2,
    special: [
      'Whenever it is time to draw a Treasure Card, a thief may always draw two cards and choose which one to keep. If the card drawn indicates that you should draw a new Treasure Card from a higher tier of treasures, the Thief may only draw one card from that pile.',
    ],
  },
  {
    id: 'warrior',
    name: 'Warrior',
    cite: CITES.warrior,
    skillTableId: 'table.character.warrior_skills',
    modifiers: {
      combat_skill: 10, alchemy: -25, ranged_skill: 5, perception: -10, dodge: 0, arcane_art: NA,
      pick_locks: -20, foraging: -15, barter: -15, battle_prayers: NA, heal: -10,
    },
    hitPoints: 3,
    hitPointsPrinted: '+3',
    talents: [{ talentId: 'disciplined', label: 'Disciplined' }],
    talentChoice: [
      { talentId: 'mighty_blow', label: 'Mighty Blow' },
      { talentId: 'braveheart', label: 'Braveheart' },
    ],
    perks: [{ perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' }],
    equipment: [
      { key: 'backpack', label: 'Small backpack', quantity: 1, selection: 'fixed' },
      { key: 'leather_jacket', label: 'Leather Jacket', quantity: 1, selection: 'fixed', catalogue: { kind: 'armour', id: 'leather_jacket' } },
      { key: 'weapon', label: 'One Weapon of Choice', quantity: 1, selection: 'choice', anyWeapon: true },
    ],
    limitations: [],
  },
  {
    id: 'warrior_priest',
    name: 'Warrior Priest',
    cite: CITES.warriorPriest,
    skillTableId: 'table.character.warrior_priest_skills',
    modifiers: {
      combat_skill: 5, alchemy: -15, ranged_skill: -5, perception: -10, dodge: -5, arcane_art: NA,
      pick_locks: -20, foraging: -20, barter: -10, battle_prayers: 15, heal: 5,
    },
    hitPoints: 1,
    hitPointsPrinted: '+1',
    talents: [],
    talentChoice: [
      { talentId: 'braveheart', label: 'Braveheart' },
      { talentId: 'confident', label: 'Confident' },
    ],
    perks: [{ perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' }],
    prayers: { quantity: 2, level: 1 },
    startingEnergy: 2,
    equipment: [
      { key: 'backpack', label: 'Small backpack', quantity: 1, selection: 'fixed' },
      { key: 'relic', label: 'One Religious Relic of choice', quantity: 1, selection: 'choice', qualifier: 'Choose God and ring or amulet, page 194' },
      { key: 'weapon', label: 'One weapon of choice', quantity: 1, selection: 'choice', anyWeapon: true },
    ],
    limitations: [],
  },
  {
    id: 'wizard',
    name: 'Wizard',
    cite: CITES.wizard,
    skillTableId: 'table.character.wizard_skills',
    modifiers: {
      combat_skill: -5, alchemy: -20, ranged_skill: -10, perception: -10, dodge: -10, arcane_art: 10,
      pick_locks: -20, foraging: -20, barter: 5, battle_prayers: NA, heal: -5,
    },
    hitPoints: 0,
    hitPointsPrinted: '±0',
    talents: [],
    perks: [{ perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' }],
    arcanePerkChoice: true,
    spells: { quantity: 3, level: 1 },
    equipment: [
      { key: 'backpack', label: 'Small backpack', quantity: 1, selection: 'fixed' },
      { key: 'staff', label: 'Staff', quantity: 1, selection: 'fixed', catalogue: { kind: 'weapon', id: 'staff' } },
    ],
    limitations: ['A wizard may never use armour heavier than Tier 2.'],
    maxArmourTier: 2,
  },
];

/** The two lookup tables under Damage Bonus and Natural Armour, p. 27. */
export const DAMAGE_BONUS: readonly { stat: number; bonus: number }[] = [
  { stat: 50, bonus: 1 },
  { stat: 60, bonus: 2 },
  { stat: 70, bonus: 3 },
];
export const NATURAL_ARMOUR: readonly { stat: number; bonus: number }[] = [
  { stat: 50, bonus: 1 },
  { stat: 55, bonus: 2 },
  { stat: 60, bonus: 3 },
  { stat: 65, bonus: 4 },
  { stat: 70, bonus: 5 },
];

export interface WeaponClassRow {
  weaponClass: number;
  twoHands: number;
  /** null where the table prints N/A. */
  oneHand: number | null;
}
export const WEAPON_CLASSES: readonly WeaponClassRow[] = [
  { weaponClass: 1, twoHands: 20, oneHand: 20 },
  { weaponClass: 2, twoHands: 25, oneHand: 30 },
  { weaponClass: 3, twoHands: 30, oneHand: 40 },
  { weaponClass: 4, twoHands: 40, oneHand: 50 },
  { weaponClass: 5, twoHands: 55, oneHand: null },
  { weaponClass: 6, twoHands: 20, oneHand: null },
];

export type TalentCategory =
  | 'physical'
  | 'combat'
  | 'mental'
  | 'sneaky'
  | 'common'
  | 'magic'
  | 'alchemist'
  | 'faith';

export const TALENT_CATEGORIES: Record<TalentCategory, { label: string; tableId: string; cite: Cite }> = {
  physical: { label: 'Physical', tableId: 'table.talent.physical_pilot', cite: CITES.physicalTalents },
  combat: { label: 'Combat', tableId: 'table.talent.combat_pilot', cite: CITES.combatTalents },
  mental: { label: 'Mental', tableId: 'table.talent.mental', cite: CITES.mentalTalents },
  sneaky: { label: 'Sneaky', tableId: 'table.talent.sneaky', cite: CITES.sneakyTalents },
  common: { label: 'Common', tableId: 'table.talent.common', cite: CITES.commonTalents },
  magic: { label: 'Magic', tableId: 'table.talent.magic', cite: CITES.magicTalents },
  alchemist: { label: 'Alchemist', tableId: 'table.talent.alchemist', cite: CITES.alchemistTalents },
  faith: { label: 'Faith', tableId: 'table.talent.faith', cite: CITES.faithTalents },
};

export interface TalentEffects {
  stats?: Partial<Stats>;
  skills?: Partial<Record<SkillId, number>>;
  hitPoints?: number;
  sanity?: number;
  luck?: number;
  movement?: number;
  mana?: number;
  /** Extra carrying capacity in ENC. */
  carry?: number;
  /** Added to STR when working out the usable weapon Class. */
  weaponClassStrength?: number;
  partyMorale?: number;
}

export interface TalentRestriction {
  /** What the book prints, verbatim, about who may take it. */
  printed: string;
  professions?: ProfessionId[];
  notProfessions?: ProfessionId[];
  /** Only a newly created character whose species lists it. */
  speciesTrait?: boolean;
  requiresTalent?: string;
  requiresStat?: { stat: StatKey; value: number };
}

export interface Talent {
  id: string;
  name: string;
  category: TalentCategory;
  text: string;
  effects?: TalentEffects;
  restriction?: TalentRestriction;
  /** The hero names an enemy to hate. */
  namesEnemy?: boolean;
}

const t = (id: string, name: string, category: TalentCategory, text: string, extra: Partial<Talent> = {}): Talent => ({
  id,
  name,
  category,
  text,
  ...extra,
});

/** Appendix II, every talent, verbatim. The human Jack of all trades rolls on these. */
export const TALENTS: readonly Talent[] = [
  t('catlike', 'Catlike', 'physical', 'Your hero moves with grace and has almost supernatural balance. Your hero gains +5 DEX.', { effects: { stats: { dex: 5 } } }),
  t('fast', 'Fast', 'physical', 'Your hero moves unusually fast and gains a permanent +1 bonus to their Movement stat.', { effects: { movement: 1 } }),
  t('mule', 'Mule', 'physical', 'Your hero is used to carry heavy equipment during long travels. Your hero can carry 20 ENC more than the STR value would allow.', { effects: { carry: 20 } }),
  t('night_vision', 'Night Vision', 'physical', 'Your hero’s species has the natural ability to see in the dark and is not affected by darkness. A hero with Night Vision gets +10 on Perception. This talent can only be given to a newly-created character that has this talent listed in the Species Description.', {
    effects: { skills: { perception: 10 } },
    restriction: { printed: 'This talent can only be given to a newly-created character that has this talent listed in the Species Description.', speciesTrait: true },
  }),
  t('observant', 'Observant', 'physical', 'Rangers only. Used to camping in dangerous places, a Ranger with this talent will convey a -10 modifier to the risk of an ambush during a rest in a dungeon. Furthermore, all members of the party will always start all battles standing up even if the quest or rules states otherwise. Any extra enemy initiative tokens due to a surprise or ambush is also negated by this talent.', {
    restriction: { printed: 'Rangers only.', professions: ['ranger'] },
  }),
  t('perfect_hearing', 'Perfect Hearing', 'physical', 'Your hero’s hearing is exceptionally good, and and you may add 1 hero initiative token to the first round of battle after opening a door and encountering enemies. This cannot be used if the door was broken down. This talent can only be given to a newly created character that has this Talent listed in the Species Description.', {
    restriction: { printed: 'This talent can only be given to a newly created character that has this Talent listed in the Species Description.', speciesTrait: true },
  }),
  t('resilient', 'Resilient', 'physical', 'Your hero’s brawny physique grants a +5 bonus to the Constitution stat.', { effects: { stats: { con: 5 } } }),
  t('resistance_to_disease', 'Resistance to Disease', 'physical', 'Your hero seems to have a natural ability to resist diseases. Your hero gets a +25 bonus on Constitution Tests to resist disease.'),
  t('resistance_to_poison', 'Resistance to Poison', 'physical', 'Your hero seems to have a natural ability to resist poison. Your hero gets a +25 bonus on Constitution Tests to resist poison.'),
  t('strong', 'Strong', 'physical', 'Your hero’s exercises have paid off and your hero gains a +5 bonus to the Strength stat.', { effects: { stats: { str: 5 } } }),
  t('strong_build', 'Strong Build', 'physical', 'Your hero gains a +2 bonus to the Hit Points stat.', { effects: { hitPoints: 2 } }),
  t('tank', 'Tank', 'physical', 'Wearing heavy armour has little effect on your hero’s ability to move. The hero ignores the Clunky Special Rule.'),

  t('axeman', 'Axeman', 'combat', 'Preferring the balance of a good axe, this hero has become a master of using this weapon. Bloodlust is now triggered on a result of 1-10 when using all kinds of axes.'),
  t('bruiser', 'Bruiser', 'combat', 'The hero excels at fighting with blunt weapons and Bloodlust is now triggered on a result of 1-10 when using all kinds of hammers, flails, staffs, and morning stars.'),
  t('death_lament', 'Death Lament', 'combat', 'When others fall, this hero still stands, refusing to give in. Each time your hero is reduced to 0 Hit Points, roll 1d6: on a result of 1-3, the hero regains 1 Hit Point.'),
  t('disarm', 'Disarm', 'combat', "This is a special attack, using the target's DEX as a negative modifier to the attack. If the attack succeeds it inflicts no damage, but causes the enemy to drop their weapon. The enemy must spend their next action trying to pick it up. In order to do so, the enemy has to succeed with a DEX Test. The enemy will continue until successful. If the hero’s attack fails, nothing happens. This can only be used on enemies that are carrying weapons."),
  t('dual_wield', 'Dual Wield', 'combat', 'This talent requires a DEX of 60. Any hero with this talent may use a weapon with the Dual Wield Special Rule in their offhand. The attacks are still done as usual with the main weapon, but any hit will add +X DMG to the target. The X is defined in the Weapon Table. Parrying with two weapons is also easier, and any parry while using two weapons has a +5 modifier.', {
    restriction: { printed: 'This talent requires a DEX of 60.', requiresStat: { stat: 'dex', value: 60 } },
  }),
  t('fast_reload', 'Fast Reload', 'combat', 'Years of practice makes your hero faster than most and they can reload in the blink of an eye. Bows and sling can be reloaded in the same action as shooting once per turn. Crossbows can be reloaded in 1 action and fired in the next. An Arbalest can be reloaded in 2 actions, and fired in the next turn.'),
  t('lethal_shot', 'Lethal shot', 'combat', 'Your hero always seems to hit the perfect spot. +2DMG with all ranged weapons.'),
  t('marksman', 'Marksman', 'combat', 'Fighting with ranged weapons comes naturally to your hero. Bloodlust is now triggered on a result of 1-10 when using all kinds of ranged weapons.'),
  t('mighty_blow', 'Mighty Blow', 'combat', 'Your hero is an expert at finding the weak spots of the enemy. Your hero gets a +1 bonus on Damage Rolls with melee weapons.'),
  t('parry_master', 'Parry Master', 'combat', 'Your hero is adept at protection with a weapon. If the hero is in the Parry Stance, they may parry twice with a weapon during one turn.'),
  t('perfect_shot', 'Perfect Shot', 'combat', 'Identifying the weak spots in enemy armour can sometimes make the difference when firing an arrow or bolt from afar. If the Damage Roll is odd, your hero ignores armour (But not NA).'),
  t('riposte_master', 'Riposte Master', 'combat', 'When successfully parrying a strike with a weapon, the hero may automatically cause 2 Points of Damage to that Enemy, ignoring Armour and NA. May only be done with weapons of class 3 or lower.'),
  t('sniper', 'Sniper', 'combat', 'With practised ease, your hero cannot seem to miss when taking careful aim. The aim action gives your hero a +15 modifier instead of +10.'),
  t('swordsman', 'Swordsman', 'combat', 'This hero is very skilled with a blade and Bloodlust is now triggered on a result of 1-10 when using all types of swords.'),
  t('tight_grip', 'Tight Grip', 'combat', 'With unusually strong hands, the hero may add +10 STR when calculating what weapon class they can use.', { effects: { weaponClassStrength: 10 } }),
  t('tunnel_fighter', 'Tunnel Fighter', 'combat', 'Your hero is accustomed to fighting in tight spaces. +10 CS when fighting in a corridor.'),

  t('braveheart', 'Braveheart', 'mental', 'Your hero is braver than most. +10 bonus on Fear and Terror Tests.'),
  t('confident', 'Confident', 'mental', 'No enemy or task is too difficult. Your hero gains a +5 bonus to the Resolve stat.', { effects: { stats: { res: 5 } } }),
  t('fearless', 'Fearless', 'mental', 'Your hero is completely immune to the effects of fear and treats terror as fear. This talent requires that the hero already has the Braveheart Mental Talent.', {
    restriction: { printed: 'This talent requires that the hero already has the Braveheart Mental Talent.', requiresTalent: 'braveheart' },
  }),
  t('hate', 'Hate', 'mental', 'Through personal experience, or through the history of their kin, your hero has grown to hate certain enemies. This hate fuels their fighting, gaining a +5 bonus to CS when attacking those enemies. However, their hatred impairs their ability to parry and dodge (-5 parry/dodge) when struck by those enemies. The hero may choose one enemy to hate. If your hero hates goblins for instance, they hate every enemy with the word ‘Goblin’ in it. This Talent may be taken several times making the hero hate different enemies.', { namesEnemy: true }),
  t('strong_minded', 'Strong-Minded', 'mental', 'Your hero is less affected by the horrors of the dungeons than their comrades. The hero gains +1 Sanity Point.', { effects: { sanity: 1 } }),
  t('wise', 'Wise', 'mental', 'Your hero has plenty of life experience and may re-roll a failed WIS-test.'),

  t('assassin', 'Assassin', 'sneaky', 'With uncanny precision, the hero automatically hits any target from behind with a class 1 or 2 weapon.'),
  t('backstabber', 'Backstabber', 'sneaky', 'Accustomed to optimising the odds, your hero ignores enemy armour and NA when attacking from behind.'),
  t('cutpurse', 'Cutpurse', 'sneaky', 'Once per visit in a settlement, your hero may try to steal the purse from some unsuspecting victim. This must be done as the first thing when entering a settlement. Roll 1d6. On a result of 1-2 the hero gains 1d100 coins. On a result of 6, the attempt is detected, and the hero is immediately chased out of the settlement. The hero may do nothing until the rest of the party decides to leave the settlement. Rations must be used as normal, and if rations are lacking, the hero becomes hungry. Foraging is allowed while waiting.'),
  t('evaluate', 'Evaluate', 'sneaky', 'Your hero has a good sense for the value of things. A successful Barter Roll will give your hero +15% instead of the usual +10%.'),
  t('lockpicker', 'Lockpicker', 'sneaky', 'No lock seems to hinder this hero. The hero may re-roll a failed lockpick attempt.'),
  t('mechanical_genius', 'Mechanical Genius', 'sneaky', 'Your hero is a master at understanding mechanical contraptions and gains +10 when disarming traps.'),
  t('nimble', 'Nimble', 'sneaky', 'The hero may dodge twice per battle instead of only once.'),
  t('quick_fingers', 'Quick Fingers', 'sneaky', 'Accustomed to working under pressure, your hero has mastered the skill of reading a lock and picking it. Picking a lock now takes 1 AP instead of 2.'),
  t('sharp_eyed', 'Sharp-eyed', 'sneaky', 'Your hero has an extreme sense for details and can easily notice anything out of the ordinary. Your hero gains a +10 bonus on Perception Tests.', { effects: { skills: { perception: 10 } } }),
  t('sense_for_gold', 'Sense for Gold', 'sneaky', 'It seems this hero can almost smell their way to treasures. When rolling on the Furniture Table for treasures, the hero may subtract -1 on the roll.'),
  t('shadow_walker', 'Shadow walker', 'sneaky', 'Your hero seems to always blend into the shadows. Moving almost unseen, the hero ignores movement restrictions due to enemy ZOC.'),
  t('streetwise', 'Streetwise', 'sneaky', 'Your hero knows who to ask to acquire the gear they search for. Every roll this hero makes for availability may be modified by -1. This Talent can only be taken by a Rogue.', {
    restriction: { printed: 'This Talent can only be taken by a Rogue.', professions: ['rogue'] },
  }),
  t('trapfinder', 'Trapfinder', 'sneaky', 'Your hero is an expert at dealing with traps. Your hero gains a +10 PER bonus when detecting traps. This is cumulative with Sharp-eyed.'),

  t('bard', 'Bard', 'common', 'The hero gets a +10 WIS modifier when using instruments.'),
  t('cartographer', 'Cartographer', 'common', 'The hero is skilled at drawing maps. If the hero passes a WIS test before entering a dungeon, the exploration deck is set up using 2 cards less than noted in the quest. Remove one corridor and one room. No matter how many heroes uses this talent, no more than 2 cards can be removed.'),
  t('charming', 'Charming', 'common', 'This hero seems to get along with everyone and always draws a smile from those to whom he talks. Well aware of this, the party lets this hero negotiate all rewards and gains +5% Reward Bonus on all quests.'),
  t('disciplined', 'Disciplined', 'common', 'Thanks to a military background, this hero has an increased degree of calmness under pressure. This also spreads to the rest of the party. The hero gains +10 RES and the other members of the party gain +5 RES as long as the hero is not knocked out. The effect on the party is not cumulative if other heroes have the same talent. Furthermore, a hero with this talent will not benefit from the effect of this talent from another hero.', { effects: { stats: { res: 10 } } }),
  t('hunter', 'Hunter', 'common', 'The hero has a knack for finding wild game and knows how best to hunt them. The hero gains +10 to Foraging.', { effects: { skills: { foraging: 10 } } }),
  t('lucky', 'Lucky', 'common', 'Some are just luckier than others. Everything seems to go your way. You gain +1 Luck Point.', { effects: { luck: 1 } }),
  t('master_cook', 'Master Cook', 'common', 'During a rest, the party members will regain +2 extra HP if they have rations, due to your hero’s expert cooking skills. This is not cumulative if more than one hero has this Talent.'),
  t('natural_leader', 'Natural Leader', 'common', 'The hero’s natural ability to lead will add +2 to the Party Moral permanently. This is not cumulative if more than one hero has this talent.', { effects: { partyMorale: 2 } }),
  t('ringbearer', 'Ringbearer', 'common', 'Somehow, this hero has managed to tame the effect of magic imbued items. Instead of being limited to one ring, your hero can now use two rings simultaneously.'),
  t('survivalist', 'Survivalist', 'common', 'This talent lets your hero forage one ration from any monster in the Beast category (in a dungeon or after a skirmish), as long as the Forage roll is successful.'),
  t('swift_leader', 'Swift Leader', 'common', 'The party may always add one initiative token to the bag. This is only used to increase chance of activation and all heroes may still only act once per turn. This is not a cumulative effect so only 1 token will be added even if more than one hero has this talent.'),
  t('veteran', 'Veteran', 'common', 'Your hero’s your gear is in perfect order, making changes in equipment very easy. You can use equipment from a Quick Slot without spending an Action Point (once per turn).'),
  t('pathfinder', 'Pathfinder', 'common', 'The hero has a knack for finding good shelter during travels. All heroes get +1 HP when resting.'),
  t('pious', 'Pious', 'common', 'Your hero has a strong connection to the Gods. The hero may use relics, even though he or she is not a Warrior Priest. This talent cannot be chosen by a Warrior Priest.', {
    restriction: { printed: 'This talent cannot be chosen by a Warrior Priest.', notProfessions: ['warrior_priest'] },
  }),

  t('blood_magic', 'Blood Magic', 'magic', 'The wizard can spend his own life blood to create Mana. For every 2 HP spent, the wizard gains 5 Mana. This transformation can be done for free during the wizard’s turn.'),
  t('conjurer', 'Conjurer', 'magic', 'The wizard is an expert conjurer and gains +5 Arcane Arts whenever casting a Conjuration Spell. Furthermore, the Mana cost for such a spell is reduced by 5.'),
  t('divinator', 'Divinator', 'magic', 'The wizard gets +5 Arcane Arts whenever casting a Divination Spell. Furthermore, the Mana cost for such a spell is reduced by 5.'),
  t('fast_reflexes', 'Fast Reflexes', 'magic', 'With lightning-fast reflexes, your hero can reach out and touch your enemies when casting spells. Your hero gains a +15 Combat Skill Bonus when casting Touch Spells.'),
  t('focused', 'Focused', 'magic', 'Well attuned to the void, your hero is adept at tapping into it to gain maximum power. Your hero gets +15 Arcane Arts when focusing.'),
  t('persistent', 'Persistent', 'magic', 'Your hero gains a permanent +15 Mana.', { effects: { mana: 15 } }),
  t('restorer', 'Restorer', 'magic', 'Restoration spells are the favourite spells of your hero, and this results in all Healing Spells healing +2 Hit Points in addition to the spell’s normal result. You cannot have this talent at the same time as you have the Necromancer Talent.'),
  t('mystic', 'Mystic', 'magic', 'The wizard is truly skilled with Mysticism Spells and gets +5 Arcane Arts whenever casting a Mysticism Spell. Furthermore, the Mana cost for such a spell is reduced by 5.'),
  t('necromancer', 'Necromancer', 'magic', 'The hero gets +5 Arcane Arts whenever casting a Necromantic Spell. Furthermore, the Mana cost for such a spell is reduced by 5. You cannot have this Talent at the same time as you have the Restorer Talent.'),
  t('powerful_missiles', 'Powerful Missiles', 'magic', 'Your hero has perfected the use of Magic Missiles, knowing where to aim for maximum effect. Magic Missile Spells do +1 Damage.'),
  t('summoner', 'Summoner', 'magic', 'Reaching into other realms and bringing other beings to their aid has become easier with years of practice. Creatures summoned by the Wizard will stay 2 turns longer than normally allowed by the Wizard’s CL.'),
  t('sustainer', 'Sustainer', 'magic', 'Upkeep for the wizard’s spells is reduced by 1.'),
  t('thrifty', 'Thrifty', 'magic', 'The wizard requires 2 less Mana on every spell cast.'),

  t('expert_mixer', 'Expert Mixer', 'alchemist', 'The Alchemist is a master of mixing offensive potions. All throwable potions that cause damage gets a +1DMG on every target.'),
  t('gatherer', 'Gatherer', 'alchemist', 'Finding good ingredients in the wild comes naturally to the hero. +10 Alchemy when searching for ingredients in the wild.'),
  t('harvester', 'Harvester', 'alchemist', 'With precise incisions, the hero can harvest good quality components from fallen enemies. +10 Alchemy when harvesting parts.'),
  t('keen_eye', 'Keen Eye', 'alchemist', 'The Alchemist has a keen eye when it comes to finding ingredients. The hero may reroll the result when rolling to see what has been gathered. The second result stands.'),
  t('master_healer', 'Master Healer', 'alchemist', 'This hero has perfected the art of making Healing Potions. All potions brewed heal +2 Hit Points more than normal.'),
  t('perfect_toss', 'Perfect Toss', 'alchemist', 'The hero has a knack for lobbing bottles in a perfect arc over friends and foes alike. +10 RS when lobbing a potion over the heads of others.'),
  t('poisoner', 'Poisoner', 'alchemist', 'The hero is very adept at making all sorts of poisons. Poisons created by this hero always inflict 2 additional Hit Point per turn.'),
  t('powerful_potions', 'Powerful Potions', 'alchemist', 'The strength of this hero’s potions is remarkable. All basic stat (Not M) enhancing potions grant an additional +5 bonus.'),

  t('devoted', 'Devoted', 'faith', 'The hero gains an extra Energy Point that can only be used for praying.'),
  t('gods_chosen', 'God’s Chosen', 'faith', 'As if by the will of the gods, nothing seems to hurt this priest. +1 Luck.', { effects: { luck: 1 } }),
  t('healer', 'Healer', 'faith', 'This priest has tended many wounds and applies bandages with practiced hands. A bandage applied by this priest will heal +1 HP'),
  t('messiah', 'Messiah', 'faith', 'With a confidence that radiates through the room, no one can help but be inspired. All heroes on the same tile as the priest gain +5 Resolve.'),
  t('pure', 'Pure', 'faith', 'The radiance of this priest hurts the eyes of all demons. Any demon trying to attack the priest does so at -10 CS.'),
  t('reliquary', 'Reliquary', 'faith', 'So strong is their faith in the holy relics, that this priest can channel the power of 3 relics, rather than the standard two.'),
];

export const TALENT_BY_ID: ReadonlyMap<string, Talent> = new Map(TALENTS.map((talent) => [talent.id, talent]));

export interface Perk {
  id: string;
  name: string;
  text: string;
  cite: Cite;
  recordId: string;
}

export const PERKS: readonly Perk[] = [
  {
    id: 'heroic_force_of_will',
    name: 'Heroic Force of Will',
    text: 'The hero may add +10 to any Skill or Stat for a single check of any kind.',
    cite: CITES.commonPerks,
    recordId: 'perk.heroic_force_of_will',
  },
  {
    id: 'frenzy',
    name: 'Frenzy',
    text: 'Working into a frenzy, your hero flails wildly at their enemies. For each standard attack that damages the enemy, the hero may make one more standard attack for free. This attack does not have to be at the same target. While frenzied, all attacks have AP (1) which is cumulative with any other AP bonus. The hero may only move or attack and may do nothing else, including parrying, dodging or using potions. Barbarians only. Lasts for two turns. That means a maximum of 8 attacks can be done over the two Frenzied turns.',
    cite: CITES.frenzy,
    recordId: 'perk.frenzy',
  },
];

export interface ArcanePerk {
  id: string;
  name: string;
  effect: string;
  comment: string;
}

export const ARCANE_PERKS: readonly ArcanePerk[] = [
  { id: 'dispel_master', name: 'Dispel Master', effect: 'The wizard is very skilled in the art of countering enemy magic.', comment: 'The wizard gets +20 Arcane Arts when rolling to dispel when this Perk is used.' },
  { id: 'energy_to_mana', name: 'Energy to Mana', effect: 'The wizard has the ability to turn energy into Mana. For each Energy Point spent, the wizard gains 20 Mana.', comment: 'The wizard may spend any number of Energy Points.' },
  { id: 'inner_power', name: 'Inner Power', effect: 'The wizard increases the power of their magic missiles, causing an extra 1d6 Damage.', comment: 'Must be declared before the spell is cast.' },
  { id: 'in_tune_with_the_magic', name: 'In Tune with the Magic', effect: 'Caster may use Focus before trying to identify a Magic Item. However, when attuning to the magic in that way, their mind is open enough to risk their sanity.', comment: 'Works just as if casting a spell but introduces miscast to the roll as well. 1 Action of Focus causes a miscast on 95-00. Increase the risk by 5 for each additional action.' },
  { id: 'quick_focus', name: 'Quick Focus', effect: 'The wizard has the ability of extreme Focus, increasing the chance to succeed on a spell. Add +10 Arcane Arts Skill without spending an action on focus. Risk for a miscast is still increased by 5.', comment: 'Used at the same time as casting a spell. Only lasts for that spell.' },
];

export interface Spell {
  /** Row id in table.spells.level_1. */
  rowId: string;
  id: string;
  name: string;
  cv: number;
  mana: number;
  upkeep: number;
  special: string;
  school: string;
  effect: string;
}

export const LEVEL_1_SPELLS: readonly Spell[] = [
  { rowId: 'row_1', id: 'fake_death', name: 'Fake Death', cv: 7, mana: 8, upkeep: 0, special: '', school: 'Necromancy', effect: 'Causes the caster to fall to the ground, appearing dead to all around. Enemies will not target the caster for the rest of the battle. The caster may do nothing until the end of the battle.' },
  { rowId: 'row_2', id: 'flare', name: 'Flare', cv: 8, mana: 10, upkeep: 0, special: 'Q, MM', school: 'Destruction', effect: 'A bright flare shoots from the caster’s hand, hissing through the air to strike the target with a large bang. DMG is 1D8.' },
  { rowId: 'row_3', id: 'gust_of_wind', name: 'Gust of Wind', cv: 12, mana: 8, upkeep: 1, special: '', school: 'Alteration', effect: 'Suddenly a powerful wind blows through the dungeon, making arrows fly astray. All Missile Weapons now have a -15 modifier to hit if the arrows pass the room the Wizard is in. The wind lasts for Caster level turns. Upkeep is 1 point of Mana.' },
  { rowId: 'row_4', id: 'hand_of_death', name: 'Hand of Death', cv: 7, mana: 8, upkeep: 0, special: 'Q, T', school: 'Necromancy', effect: 'This is a close combat spell, where the caster touches the enemy and causes them harm through magical energy. The target loses 1d10 Hit Points, which ignores armour.' },
  { rowId: 'row_5', id: 'healing_hand', name: 'Healing Hand', cv: 6, mana: 12, upkeep: 0, special: 'Q, T', school: 'Restoration', effect: 'The caster lays their hand on a comrade and heals 1d8+2 Hit Points. This can be used on the caster as well.' },
  { rowId: 'row_6', id: 'light_healing', name: 'Light Healing', cv: 5, mana: 10, upkeep: 0, special: 'Q', school: 'Restoration', effect: 'The caster can heal one hero (including the caster) within 4 squares and in LOS (intervening models do not matter). It heals 1d6 Hit Points.' },
  { rowId: 'row_7', id: 'protective_shield', name: 'Protective Shield', cv: 10, mana: 10, upkeep: 1, special: '', school: 'Mysticism', effect: 'The caster summons a translucent sphere of blue light around themself or the target (which must be in LOS), protecting it from physical harm. The shield absorbs 1 Point of Damage per Caster level to a maximum of 3. You can cast the spell twice (but not more) on each target, adding together the effect of the spell. The spell lasts the entire battle but costs 1 point of Mana in upkeep per turn.' },
  { rowId: 'row_8', id: 'slip', name: 'Slip', cv: 10, mana: 10, upkeep: 0, special: '', school: 'Hex', effect: 'Causes the target to slip and fall. The target remains prone until its next activation when it will spend its first action standing up.' },
];

export interface Prayer {
  id: string;
  recordId: string;
  name: string;
  text: string;
  cite: Cite;
}

export const LEVEL_1_PRAYERS: readonly Prayer[] = [
  { id: 'bringer_of_light', recordId: 'prayer.bringer_of_light', name: 'Bringer of Light', text: 'The light of the Gods shines through the priest, causing the Undead to waver. Any Undead trying to attack the Warrior Priest suffers -10 CS.', cite: { page: 80, pdf: 82, heading: 'Bringer of Light', recordId: 'prayer.bringer_of_light' } },
  { id: 'charus_walk_with_us', recordId: 'prayer.charus_walk_with_us', name: 'Charus, Walk with Us', text: 'This prayer goes to Charus and as long as he listens, all heroes regain an Energy Point on any skill roll of 01-10, instead of the normal 01-05. Note that this only affects energy, not the other options you have if you roll 01-05.', cite: { page: 80, pdf: 82, heading: 'Charus, Walk with Us', recordId: 'prayer.charus_walk_with_us' } },
  { id: 'metheias_ward', recordId: 'prayer.metheias_ward', name: 'Metheia’s Ward', text: 'Under the protection of Metheia, the priest regains 1 lost HP at the start of his activation, for the rest of the battle.', cite: { page: 80, pdf: 82, heading: 'Metheia’s Ward', recordId: 'prayer.metheias_ward' } },
  { id: 'methias_balm', recordId: 'prayer.methias_balm', name: 'Methia’s Balm', text: 'With the power of Metheia, the priest may heal an adjacent hero with 1d6+1 HP. This prayer can also be used to heal the priest. Once the effect has been resolved, the prayer stops.', cite: { page: 81, pdf: 83, heading: 'Methia’s Balm', recordId: 'prayer.methias_balm' } },
  { id: 'power_of_the_gods', recordId: 'prayer.power_of_the_gods', name: 'Power of the Gods', text: 'By channelling the power of the gods and diverting it to a wizard, the priest can help conjure a spell. As long as the prayer is active, any hero wizard gains +10 Arcane Arts.', cite: { page: 80, pdf: 82, heading: 'Power of the Gods', recordId: 'prayer.power_of_the_gods' } },
  { id: 'the_power_of_iphy', recordId: 'prayer.the_power_of_iphy', name: 'The Power of Iphy', text: 'This empowering psalm strengthens your resolve. The party gets +10 RES on any Fear or Terror Test during the battle. If they have already failed these tests, they may retake them with this bonus.', cite: { page: 80, pdf: 82, heading: 'The Power of Iphy', recordId: 'prayer.the_power_of_iphy' } },
];

export interface Relic {
  /** Row id in table.treasure.relics. */
  rowId: string;
  roll: number;
  name: string;
  effect: string;
}

export const RELICS: readonly Relic[] = [
  { rowId: 'row_1', roll: 1, name: 'Relic of Charus', effect: 'Grants +1 Energy Point.' },
  { rowId: 'row_2', roll: 2, name: 'Relic of Metheia', effect: 'Adds +1d3 to any form of healing done by the Priest' },
  { rowId: 'row_3', roll: 3, name: 'Relic of Iphy', effect: 'Grants +5 Resolve' },
  { rowId: 'row_4', roll: 4, name: 'Relic of Rhidnir', effect: 'Grants +1 Luck during each quest' },
  { rowId: 'row_5', roll: 5, name: 'Relic of Ohlnir', effect: 'Grants +5 CS' },
  { rowId: 'row_6', roll: 6, name: 'Relic of Ramos', effect: 'Grants +5 STR' },
];

export interface Background {
  number: number;
  id: string;
  recordId: string;
  name: string;
  text: string;
  cite: Cite;
  /** Creation effects the sheet can apply. */
  startingCoins?: number;
  sanity?: number;
  partyMorale?: number;
  wizardReroll?: boolean;
  hate?: string;
}

const bg = (number: number, id: string, name: string, page: number, text: string, extra: Partial<Background> = {}): Background => ({
  number,
  id,
  recordId: `background.${id}`,
  name,
  text,
  cite: { page, pdf: page + 2, heading: name, recordId: `background.${id}` },
  ...extra,
});

/** The twenty numbered Backgrounds, pp. 40–46; the book calls the chapter optional. */
export const BACKGROUNDS: readonly Background[] = [
  bg(1, 'wanderlust', 'Wanderlust', 40, 'Personal Quest: Visit all settlements on the map (A total of 11). Once done, you gain 1500 XP.'),
  bg(2, 'the_well', 'The Well', 40, 'Personal Trait and Quest: You suffer from extreme claustrophobia. (See ‘Psychology’ Chapter). This is not curable at the asylum. Instead, you must face your fears. Once you have fought and survived 5 battles in a corridor, your condition is finally cured. Such is the effect of beating this trauma that you actually turn it into a strength. You gain the Tunnel Fighter Talent.'),
  bg(3, 'fables', 'Fables', 40, 'Personal Quest: Visit 3 Quest Sites in the Ancient Lands. Once you leave the third site, you gain 1500 XP.'),
  bg(4, 'the_heirloom', 'The Heirloom', 41, 'Personal Quest: Find your Great Aunt’s sword. At the start of each quest, roll 1d10. On a roll of 1, the dungeon you are heading to is actually the one that holds the sword. Place a secondary Quest Card in the first half of the Exploration Card pile. The room after the secondary Quest Card will always have enemies. Roll twice on the encounter table. One of the enemies with the highest XP will carry the sword (although will not use it in battle). The fate of your ancestor will never be known, but at least you will now have a chance to get that sword back. The weapon is a silver shortsword that does +1 DMG and has +2 Durability. You may not sell it.'),
  bg(5, 'arachnophobia', 'Arachnophobia', 41, 'Personal Trait and Quest: You suffer from extreme arachnophobia. (See ‘Psychology’ Chapter). This is not curable at the asylum. Instead, you must face your fears. Once you have fought and survived 3 battles with spiders, your condition is finally cured. Such is the effect of beating this trauma that you actually turn it into a strength. You gain +10 CS whenever trying to hit a spider.'),
  bg(6, 'the_lost_brother', 'The Lost Brother', 41, 'Personal Quest: Find your lost brother. For this quest, you need to keep track of how many dungeons you have entered. At the start of each quest, roll 1d10. On a roll of 1, the dungeon you are heading to is the one in which you will find your brother. Place a secondary Quest Card in the pile not containing the Quest Room. The tile you enter next will contain your brother. Once you enter the room, roll 1d100, adding the number of dungeons you have entered. If the result is 60 or higher, you are too late and you find the remains of your dear brother on the floor, dead. It seems that he has been dead for some time. Devastated, you must decide if you will leave him where he is, or bring him out of the dungeon and bury him. In both cases you lose 3 Points of Sanity, but gain 250 XP. If you choose to bury him, you must carry him through the dungeon (of course letting go of him when danger approaches). The downside of this is that you cannot carry anything else you find (you may not search for treasures, or carry anything your comrades find). Once outside, you have a short ceremony and lay him to rest in a nearby meadow. You gain +10 RES permanently. If the result is lower than 60, your brother is alive, but badly wounded. Place him on the tile and you may move him just like the other heroes. Use the civilian Monster Card to represent him. If your brother makes it out alive, he will accompany you to the next settlement where you will part ways. You gain 1500 XP once you reach the settlement. If he dies during the dungeon crawl, revert to ‘result higher than 60’. If he dies in a skirmish, you do not need to carry him further, but the end result is the same.'),
  bg(7, 'revenge_bandits', 'Revenge', 42, 'Personal Trait and Quest: You hate all enemies from the ‘Bandits and Brigands’ faction. Furthermore, for every 5 enemies from that section where you deliver the killing blow, you gain an additional 250 XP.', { hate: 'all enemies from the ‘Bandits and Brigands’ faction' }),
  bg(8, 'bad_tempered', 'Bad Tempered', 42, 'Personal Trait: You contribute a permanent -2 modifier to Party Morale. But, on the other hand, always expecting the worst can have its benefits as well. Your maximum Sanity is permanently increased by +2.', { sanity: 2, partyMorale: -2 }),
  bg(9, 'poverty', 'Poverty', 42, 'Personal trait and quest: You know the value of each coin, and may never make a purchase, or lend out money, that would leave you with less than 10 c. Furthermore, you must try to accumulate 1000 c for your family. Randomise which village (not Silver City) in which you were born and raised. If you are a dwarf, randomise between the two Dwarven settlements. Once you feel ready to hand over the money to your family, pay them a visit and hand over the money. This can be done by spending one Point of Movement in that village, and it will grant you 2000 XP.'),
  bg(10, 'proving_your_worth', 'Proving Your Worth', 43, 'Personal Quest: Kill an enemy that gives you 450 XP or more. You do not need to strike the final blow, as long as your party makes the kill. Once that is done, return to your father to claim the armour. Randomise which village (not Silver City) you were born and raised in. If you are a dwarf, randomise between the two Dwarven settlements. Gaining the armour can be done by simply spending one Point of Movement in that location. This is the Armour of the Father as described in the ‘Legendary Items’ chapter.'),
  bg(11, 'the_fraud', 'The Fraud', 43, 'Not applicable for wizards. reroll if you are a wizard. Personal Trait: Deduct -10 from CS, RS, and Dodge since you have neither formal training nor experience. Your RES is also reduced with -10 (temporarily, see below). Personal Quest: It is time to go from fraud to the real deal. Once you have improved CS, RS, and Dodge with +10 you can finally believe that you are more than empty words. Once this is achieved, you regain your RES and may increase it with another +10. You also gain an additional 1500XP.', { wizardReroll: true }),
  bg(12, 'the_noble', 'The Noble', 44, 'Effect: You were not kicked out without means, and you have managed to retain some of the coins your mother secretly handed you before you parted. You start with 400 c instead of the normal 150 c. However, being accustomed to having money makes it extra hard when you have none. If you ever drop below 150 c, you start questioning if this is really what you should do for a living. Your resolve is reduced with -20 until you have enough money again (150 c).', { startingCoins: 400 }),
  bg(13, 'sworn_enemy', 'Sworn Enemy', 45, 'Personal Quest: Whenever you end up in battle with bandits, roll 1d10. On a result of 10, add one Bandit Leader to the encounter. This bandit has both the Hate special rule against the entire party, as well as Frenzy. Once the bandit is killed, you have rid your family of this sworn enemy, and you gain an extra 500 XP.'),
  bg(14, 'the_family_keep', 'The Family Keep', 45, 'Randomize one quest location on the map using the white numbers to situate the ruins of your Keep. Personal Quest: Clear out the Keep. Whether you go there as a part of another quest, or if you decide to go there for this sole purpose, you must clear the entire dungeon. Every tile must be placed on the table and all enemies must be killed. If you go there specifically for this purpose, use the generic Dungeon Generator to create the dungeon. Once the dungeon is cleared, you gain 1500 XP.'),
  bg(15, 'troll_slayer', 'Troll Slayer', 45, 'Personal Quest: You must slay a troll. To rightfully claim the title of Troll Slayer, you must land the killing blow on a troll (of any kind). If you achieve this, you have both honoured your lineage and gained a further +1000 XP.'),
  bg(16, 'revenge_minotaur', 'Revenge', 45, 'Talent: You hate Minotaurs. Personal Quest: Every time you fight a Minotaur, roll 1d6. On a result of 1, you recognize the scar. If you defeat the beast, you gain an additional +.', { hate: 'Minotaurs' }),
  bg(17, 'a_new_home', 'A new home', 45, 'Personal Quest: Even though the adventuring lifestyle suits you much better than you had expected, you still yearn for a place to call your own. Once you have acquired the Bergmeister Estate, you gain 1500 XP.'),
  bg(18, 'the_apprentice', 'The Apprentice', 46, 'Personal Traits: Your blacksmithing skills are truly useful while adventuring. Whenever using an armour repair kit or a whetstone, you automatically regain 3 Points of Durability on your gear.'),
  bg(19, 'weak', 'Weak', 46, 'Personal Trait: Whenever rolling for contracting a disease, you suffer an -10 modifier to your CON. However, once you are cured of your 3rd disease, your immune system kicks into overdrive, and you instead get a +10 modifier to your CON when rolling for disease, and you cure yourself on a natural CON roll of 01-10 instead of 01-05.'),
  bg(20, 'afraid_of_heights', 'Afraid of Heights', 46, 'Personal Trait: Whenever you take a Fear Test (but not a Terror Test), you gain a +10 modifier on your RES. However, whenever you are on a bridge your resolve is halved (RDD) and your CS and RS suffer a -20 modifier.'),
];

export interface Weapon {
  /** Row id in table.equipment.weapons. */
  id: string;
  name: string;
  damage: string;
  enc: number | null;
  weaponClass: number | null;
  special: string;
  cost: number | null;
  costPrinted: string;
  /** Bows, crossbows and slings reload; the printed Reload column. */
  reload: string;
  /** Printed with the Defensive rule: breaks after 4 Points of Damage. */
  durability: number;
}

const w = (id: string, name: string, damage: string, enc: number | null, weaponClass: number | null, special: string, costPrinted: string, reload = ''): Weapon => ({
  id,
  name,
  damage,
  enc,
  weaponClass,
  special,
  cost: /^\d+ c$/.test(costPrinted) ? Number(costPrinted.replace(' c', '')) : null,
  costPrinted,
  reload,
  durability: special.includes('Defensive') ? CREATION.defensiveWeaponDurability : CREATION.standardDurability,
});

export const WEAPONS: readonly Weapon[] = [
  w('dagger', 'Dagger', '1d6', 5, 1, 'Dual Wield +1', '10 c'),
  w('rapier', 'Rapier', '1d6+1', 5, 1, 'Fast, Dual Wield +2', '130 c'),
  w('javelin', 'Javelin', '1d10', 10, 2, 'Reach, BFO, AP (1)', '100 c'),
  w('shortsword', 'Shortsword', '1d6+2', 7, 2, 'Dual Wield +2', '70 c'),
  w('staff', 'Staff', '1d8', 5, 2, 'Defensive', '5 c'),
  w('battle_hammer', 'Battle Hammer', '1d10', 10, 3, 'Stun, BFO', '100 c'),
  w('broadsword', 'Broadsword', '1d8+2', 8, 3, '', '90 c'),
  w('battleaxe', 'Battleaxe', '1d10+1', 10, 4, 'BFO, AP (1)', '100 c'),
  w('longsword', 'Longsword', '1d12', 10, 4, '', '100 c'),
  w('morning_star', 'Morning Star', '1d8+4', 10, 4, 'Unwieldy, BFO, Stun', '150 c'),
  w('flail', 'Flail', '1d10+4', 20, 5, 'Unwieldy, BFO, Stun', '150 c'),
  w('greataxe', 'Greataxe', '1d12+2', 20, 5, 'Slow, BFO, AP (2)', '200 c'),
  w('greatsword', 'Greatsword', '2d6', 20, 5, 'Slow', '200 c'),
  w('halberd', 'Halberd', '1d12', 20, 5, 'Reach, AP (1)', '150 c'),
  w('warhammer', 'Warhammer', '2d6', 20, 5, 'Slow, BFO, Stun', '200 c'),
  w('arbalest', 'Arbalest', '3d6', 20, 6, 'Requires STR 55, AP (2)', '400 c', '3'),
  w('crossbow', 'Crossbow', '1d10+3', 15, 6, 'AP (1)', '250 c', '2'),
  w('crossbow_pistol', 'Crossbow Pistol', '1d8+1', 5, 2, 'Secondary Weapon', '350 c', '2'),
  w('elven_bow', 'Elven bow', '1d10+2', 7, 6, 'AP (1)', '700 c', '1'),
  w('longbow', 'Longbow', '1d10', 10, 6, 'AP (1)', '100 c', '1'),
  w('shortbow', 'Shortbow', '1d8', 5, 6, '', '100 c', '1'),
  w('sling', 'Sling', '1d6', 1, 6, 'Unlimited Ammo', '40 c', '1'),
  w('arrow_bolt_5', 'Arrow/Bolt (5)', '-', null, null, '-', '5 c', '-'),
  w('net', 'Net', '-', 2, 2, 'Ensnare, Dual Wield +0', '100 c', '-'),
];

export const WEAPON_BY_ID: ReadonlyMap<string, Weapon> = new Map(WEAPONS.map((weapon) => [weapon.id, weapon]));

export interface Armour {
  /** Row id in table.equipment.armour. */
  id: string;
  name: string;
  tier: number;
  def: number;
  enc: number;
  covers: string;
  special: string;
  cost: number;
  costPrinted: string;
  durability: number;
}

const a = (tier: number, id: string, name: string, def: number, enc: number, covers: string, special: string, costPrinted: string): Armour => ({
  id,
  name,
  tier,
  def,
  enc,
  covers,
  special,
  cost: Number(costPrinted.replace(' c', '')),
  costPrinted,
  durability: CREATION.standardDurability,
});

export const ARMOUR: readonly Armour[] = [
  a(1, 'padded_cap', 'Padded Cap', 2, 1, 'Head', '', '30 c'),
  a(1, 'padded_vest', 'Padded Vest', 2, 3, 'Torso', 'Stackable', '60 c'),
  a(1, 'padded_jacket', 'Padded Jacket', 2, 5, 'Arms, Torso', 'Stackable', '120 c'),
  a(1, 'padded_pants', 'Padded Pants', 2, 4, 'Legs', 'Stackable', '100 c'),
  a(1, 'padded_coat', 'Padded Coat', 2, 6, 'Arms, Torso, Legs', '', '200 c'),
  a(1, 'cloak', 'Cloak', 1, 1, 'Torso (only back)', 'Stackable', '50 c'),
  a(1, 'padded_dog_armour', 'Padded Dog Armour', 2, 1, 'Dog', '', '60 c'),
  a(2, 'leather_cap', 'Leather Cap', 3, 1, 'Head', '', '50 c'),
  a(2, 'leather_vest', 'Leather Vest', 3, 3, 'Torso', '', '80 c'),
  a(2, 'leather_jacket', 'Leather Jacket', 3, 4, 'Torso, Arms', '', '140 c'),
  a(2, 'leather_leggings', 'Leather Leggings', 3, 3, 'Legs', '', '120 c'),
  a(2, 'leather_bracers', 'Leather Bracers', 3, 3, 'Arms', 'Stackable', '120 c'),
  a(2, 'leather_dog_armour', 'Leather Dog Armour', 3, 3, 'Dog', '', '120 c'),
  a(3, 'mail_coif', 'Mail Coif', 4, 4, 'Head', 'Stackable', '200 c'),
  a(3, 'mail_shirt', 'Mail Shirt', 4, 6, 'Torso', 'Stackable', '600 c'),
  a(3, 'sleeved_mail_shirt', 'Sleeved Mail Shirt', 4, 7, 'Arms, Torso', 'Stackable', '950 c'),
  a(3, 'mail_coat', 'Mail Coat', 4, 8, 'Torso, Legs', 'Stackable', '750 c'),
  a(3, 'sleeved_mail_coat', 'Sleeved Mail Coat', 4, 10, 'Arms, Torso, Legs', 'Stackable', '1300 c'),
  a(3, 'mail_leggings', 'Mail Leggings', 4, 5, 'Legs', 'Stackable', '200 c'),
  a(4, 'helmet', 'Helmet', 5, 5, 'Head', 'Clunky, Stackable', '300 c'),
  a(4, 'breastplate', 'Breastplate', 5, 7, 'Torso', 'Clunky, Stackable', '700 c'),
  a(4, 'plate_bracers', 'Plate Bracers', 5, 4, 'Arms', 'Stackable', '600 c'),
  a(4, 'plate_leggings', 'Plate Leggings', 5, 6, 'Legs', 'Clunky, Stackable', '700 c'),
];

export const ARMOUR_BY_ID: ReadonlyMap<string, Armour> = new Map(ARMOUR.map((piece) => [piece.id, piece]));

/** Printed wording the creator quotes next to the controls. */
export const QUOTES = {
  rollStats: 'Roll them one at a time and write these stats down temporarily as they will be altered in the next step.',
  rollAll: 'If you want slightly more powerful heroes, you can roll all stats at once, and then assign the results to the stats in the way you see most favourable.',
  reroll: 'You may make 2 rerolls in this process, including when rolling for Hit Points. You may never reroll a reroll, but you may choose the highest result.',
  specialisation: 'Each hero gains an extra 15 points that may be distributed on their stats. However, no stat may have more than 10 points of these 15, so you must divide the points.',
  skills: 'Each Skill is calculated as the skill’s basic stat plus a profession-specific modifier. ... A Skill Level can never be negative.',
  talentSkills: 'Some Talents may also add to your Skill Values. In such cases, the Skill Level is increased, but the basic stat remains unchanged.',
  freeSkill: 'You may choose one skill that has a negative modifier to improve. This Skill Value gains a modifier of +10.',
  mana: 'Mana is only used by wizards, and the starting mana is equal to the wizard’s WISx1,5.',
  damageBonus: 'If your character has high STR or CON, there is a chance that he or she gains a Bonus to add to their character.',
  coins: 'Apart from that, your hero starts with a pouch filled with 150 coins. You may choose to buy equipment using these coins before the game starts, or you may save them until after game has begun.',
  wear: 'Roll 1d4 for each piece of equipment and add that damage to the Character Sheet. A piece of equipment will always have at least 1 Point of Durability left.',
  buyBefore: 'The benefit of doing this is that you do not need to roll on availability. We assume that over time, you have managed to acquire the things you are looking for. The downside is that you will need to roll for damage on all things that could potentially be damaged.',
  backpack: 'All heroes start the game with a small backpack, unless otherwise noted.',
  partyMorale: 'To calculate the Party Morale (PM) you divide your RES by 10 and then drop the decimal. When all characters have done the same, you add it together to get your PM.',
  sanity: 'Your hero will start with a Sanity Value of 8.',
  luck: 'All non-halfling heroes start the game with 0 Luck.',
  energy: 'All heroes start with 1 point of energy unless otherwise noted.',
  level: 'The Start Level of your hero is 1 (Experience is 0 of course).',
  movement: 'All heroes start with movement of 4, and this is rarely changed.',
  background: 'If you wish to add some extra spice to your characters, you can roll up a Background as described on page 40 and onwards.',
  durability: 'This is not indicated in the Weapons Table, but all weapons have a Durability of 6, unless otherwise noted.',
  encumbrance: 'The limit as to how much your heroes can carry with them equals the hero’s strength. If the total encumbrance exceeds the STR of your character, all skills and stats are at -10.',
  encumbranceCap: 'Your character can never carry more than STR+15 points of encumbrance.',
  rangerBow: 'Designer ruling (FAQ; changelog 2.22 entry 2): a Dwarf or Halfling Ranger, who cannot use Longbows, takes a Shortbow instead.',
  warriorPriestEnergy: 'The Warrior Priest starts with 2 points of Energy.',
  jackOfAllTrades: 'Jack of all trades (roll for a Random Talent, from a chosen category).',
} as const;
