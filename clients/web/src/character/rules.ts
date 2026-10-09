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
  creation: {
    page: 27,
    pdf: 29,
    heading: 'Creating your Character',
    recordId: 'procedure.character_creation',
  },
  speciesFirst: {
    page: 27,
    pdf: 29,
    heading: 'Choosing Your Species',
    recordId: 'character.creation.species_first',
  },
  rollStats: {
    page: 27,
    pdf: 29,
    heading: 'Rolling Your Stats',
    recordId: 'character.creation.roll_stats',
  },
  rollAll: { page: 27, pdf: 29, heading: 'Option', recordId: 'character.creation.roll_all_option' },
  reroll: {
    page: 27,
    pdf: 29,
    heading: 'Rolling Your Stats',
    recordId: 'procedure.character_creation_reroll',
  },
  hitPoints: {
    page: 27,
    pdf: 29,
    heading: 'Hit Points',
    recordId: 'character.creation.hit_points',
  },
  specialisation: {
    page: 27,
    pdf: 29,
    heading: 'Specialisation',
    recordId: 'procedure.character_creation_specialisation',
  },
  damageBonus: {
    page: 27,
    pdf: 29,
    heading: 'Damage Bonus and Natural Armour',
    recordId: 'table.character.damage_bonus',
  },
  naturalArmour: {
    page: 27,
    pdf: 29,
    heading: 'Damage Bonus and Natural Armour',
    recordId: 'table.character.natural_armour',
  },
  strengthWeaponClass: {
    page: 27,
    pdf: 29,
    heading: 'Strength and Weapon Class',
    recordId: 'character.creation.strength_weapon_class',
  },
  weaponClassTable: {
    page: 49,
    pdf: 51,
    heading: 'Class',
    recordId: 'table.equipment.weapon_class_strength',
  },
  mana: { page: 27, pdf: 29, heading: 'Mana', recordId: 'character.mana.initial' },
  energy: { page: 27, pdf: 29, heading: 'Energy', recordId: 'character.energy.initial' },
  movement: { page: 25, pdf: 27, heading: 'Movement (M)', recordId: 'character.movement.initial' },
  traitsAreTalents: {
    page: 25,
    pdf: 27,
    heading: 'Traits',
    recordId: 'character.species.traits_are_talents',
  },
  skillBases: {
    page: 26,
    pdf: 28,
    heading: 'Skills List',
    recordId: 'table.character.skill_bases',
  },
  dwarf: { page: 28, pdf: 30, heading: 'Dwarf', recordId: 'species.dwarf' },
  elf: { page: 28, pdf: 30, heading: 'Elf', recordId: 'species.elf' },
  halfling: { page: 29, pdf: 31, heading: 'Halfling', recordId: 'species.halfling' },
  human: { page: 29, pdf: 31, heading: 'Human', recordId: 'species.human' },
  halflingCookingGear: {
    page: 29,
    pdf: 31,
    heading: 'Special',
    recordId: 'character.species.halfling.cooking_gear',
  },
  professionTalents: {
    page: 30,
    pdf: 32,
    heading: 'Profession and Talents',
    recordId: 'character.creation.profession_talents',
  },
  skills: { page: 30, pdf: 32, heading: 'Skills', recordId: 'character.skill.starting_value' },
  skillProcedure: {
    page: 30,
    pdf: 32,
    heading: 'Profession and Talents; Skills; Free Skill',
    recordId: 'procedure.character_creation_skill',
  },
  freeSkill: { page: 30, pdf: 32, heading: 'Free Skill', recordId: 'character.skill.free_skill' },
  spellsAndPrayers: {
    page: 30,
    pdf: 32,
    heading: 'Magic Spells and Prayers',
    recordId: 'character.creation.spells_and_prayers',
  },
  backgroundOptional: {
    page: 30,
    pdf: 32,
    heading: 'Background (optional)',
    recordId: 'character.creation.background_optional',
  },
  startingEquipment: {
    page: 30,
    pdf: 32,
    heading: 'Starting Equipment',
    recordId: 'character.creation.starting_coins',
  },
  buyBeforeGame: {
    page: 30,
    pdf: 32,
    heading: 'Buying Equipment before the Game',
    recordId: 'character.creation.buy_before_game',
  },
  wear: {
    page: 30,
    pdf: 32,
    heading: 'Starting Equipment; Buying Equipment before the Game',
    recordId: 'procedure.character_creation_equipment_wear',
  },
  backpack: {
    page: 30,
    pdf: 32,
    heading: 'Backpack',
    recordId: 'character.creation.small_backpack',
  },
  finalTouches: { page: 31, pdf: 33, heading: 'Final Touches', recordId: 'character.luck.initial' },
  sanity: { page: 31, pdf: 33, heading: 'Sanity', recordId: 'character.creation.starting_sanity' },
  level: { page: 31, pdf: 33, heading: 'Level', recordId: 'character.level.initial' },
  partyMorale: {
    page: 31,
    pdf: 33,
    heading: 'Party Morale',
    recordId: 'character.creation.party_morale',
  },
  alchemist: { page: 32, pdf: 34, heading: 'Alchemist', recordId: 'profession.alchemist' },
  barbarian: { page: 33, pdf: 35, heading: 'Barbarian', recordId: 'profession.barbarian' },
  ranger: { page: 34, pdf: 36, heading: 'Ranger', recordId: 'profession.ranger' },
  rangerBow: {
    page: 34,
    pdf: 36,
    heading: 'Starting Equipment',
    recordId: 'character.profession.ranger.short_arms_starting_bow',
  },
  rogue: { page: 35, pdf: 37, heading: 'Rogue', recordId: 'profession.rogue' },
  thief: { page: 36, pdf: 38, heading: 'Thief', recordId: 'profession.thief' },
  warrior: { page: 37, pdf: 39, heading: 'Warrior', recordId: 'profession.warrior' },
  warriorPriest: {
    page: 38,
    pdf: 40,
    heading: 'Warrior Priest',
    recordId: 'profession.warrior_priest',
  },
  warriorPriestEnergy: {
    page: 38,
    pdf: 40,
    heading: 'Warrior Priest',
    recordId: 'character.profession.warrior_priest.initial_energy',
  },
  wizard: { page: 39, pdf: 41, heading: 'Wizard', recordId: 'profession.wizard' },
  backgrounds: { page: 40, pdf: 42, heading: 'Wanderlust', recordId: 'background.wanderlust' },
  encumbrance: {
    page: 51,
    pdf: 53,
    heading: 'Encumbrance',
    recordId: 'character.encumbrance.limit',
  },
  durability: {
    page: 49,
    pdf: 51,
    heading: 'Durability (DUR)',
    recordId: 'character.durability.standard',
  },
  statMaxima: {
    page: 58,
    pdf: 60,
    heading: 'Stats and Skills Maximum',
    recordId: 'table.character.stat_maxima',
  },
  prayers: { page: 80, pdf: 82, heading: 'Bringer of Light', recordId: 'prayer.bringer_of_light' },
  arcanePerks: { page: 169, pdf: 171, heading: 'arcane Perks', recordId: 'table.perk.arcane' },
  commonPerks: {
    page: 168,
    pdf: 170,
    heading: 'Heroic Force of Will',
    recordId: 'perk.heroic_force_of_will',
  },
  frenzy: { page: 167, pdf: 169, heading: 'Frenzy', recordId: 'perk.frenzy' },
  physicalTalents: {
    page: 170,
    pdf: 172,
    heading: 'Physical Talents',
    recordId: 'table.talent.physical_pilot',
  },
  combatTalents: {
    page: 171,
    pdf: 173,
    heading: 'Combat Talents',
    recordId: 'table.talent.combat_pilot',
  },
  alchemistTalents: {
    page: 172,
    pdf: 174,
    heading: 'alchemist Talents',
    recordId: 'table.talent.alchemist',
  },
  faithTalents: { page: 172, pdf: 174, heading: 'faith Talents', recordId: 'table.talent.faith' },
  commonTalents: {
    page: 173,
    pdf: 175,
    heading: 'common Talents',
    recordId: 'table.talent.common',
  },
  magicTalents: { page: 174, pdf: 176, heading: 'magic Talents', recordId: 'table.talent.magic' },
  sneakyTalents: {
    page: 175,
    pdf: 177,
    heading: 'sneaky Talents',
    recordId: 'table.talent.sneaky',
  },
  mentalTalents: {
    page: 176,
    pdf: 178,
    heading: 'mental Talents',
    recordId: 'table.talent.mental',
  },
  weapons: { page: 177, pdf: 179, heading: 'Weapons', recordId: 'table.equipment.weapons' },
  armour: {
    page: 178,
    pdf: 180,
    heading: 'Armour and Shields',
    recordId: 'table.equipment.armour',
  },
  spellsLevel1: {
    page: 185,
    pdf: 187,
    heading: 'Name / CV / Mana / Upkeep / Special / School / Description and effect',
    recordId: 'table.spells.level_1',
  },
  relics: { page: 194, pdf: 196, heading: 'Table of Relics', recordId: 'table.treasure.relics' },
  mediumBackpack: {
    page: 182,
    pdf: 184,
    heading: 'Miscellaneous',
    recordId: 'character.equipment.general.backpack_medium.capacity',
  },
  abbreviations: {
    page: 14,
    pdf: 16,
    heading: 'Abbreviations and Terminology',
    recordId: 'term.action_points',
  },
  basicStats: {
    page: 24,
    pdf: 26,
    heading: 'Basic Stats',
    recordId: 'character.stat.strength.effects',
  },
  luckRule: { page: 24, pdf: 26, heading: 'Luck (L)', recordId: 'character.luck.reroll' },
  energyRule: { page: 25, pdf: 27, heading: 'Perks', recordId: 'character.energy.perk' },
  sanityRule: { page: 25, pdf: 27, heading: 'Sanity', recordId: 'character.sanity.zero_disorder' },
  hitPointsRule: {
    page: 25,
    pdf: 27,
    heading: 'Hit Points (HP)',
    recordId: 'character.hit_points.definition',
  },
  carrying: {
    page: 50,
    pdf: 52,
    heading: 'Quick Slots',
    recordId: 'character.equipment.quick_slots',
  },
  backpackRule: {
    page: 51,
    pdf: 53,
    heading: 'Backpack',
    recordId: 'character.equipment.backpack',
  },
  stackedArmour: {
    page: 50,
    pdf: 52,
    heading: 'Stacking armour',
    recordId: 'character.equipment.stacked_armour',
  },
  encPenalty: {
    page: 51,
    pdf: 53,
    heading: 'Encumbrance',
    recordId: 'character.encumbrance.penalty',
  },
  weaponClassRule: {
    page: 49,
    pdf: 51,
    heading: 'Class',
    recordId: 'character.equipment.weapon_class.one_hand',
  },
  shields: {
    page: 178,
    pdf: 180,
    heading: 'Armour and Shields',
    recordId: 'table.equipment.shields',
  },
  armourSpecials: {
    page: 178,
    pdf: 180,
    heading: 'Armour',
    recordId: 'character.equipment.armour.stackable',
  },
  weaponSpecials: {
    page: 177,
    pdf: 179,
    heading: 'Weapons',
    recordId: 'combat.weapon.special.bfo_built_for_offence',
  },
  gearEnc: {
    page: 179,
    pdf: 181,
    heading: 'Enc',
    recordId: 'character.equipment.quick_slot_stack',
  },
  hitLocation: {
    page: 119,
    pdf: 121,
    heading: 'Hit Area (Only When Hitting Heroes)',
    recordId: 'table.combat.hit_location',
  },
  relicRule: { page: 80, pdf: 82, heading: 'Relics', recordId: 'character.prayer.relics' },
  standardPotions: {
    page: 195,
    pdf: 197,
    heading: '1,2 / 1d10 / 3 / 1d10 / Cost / Potion',
    recordId: 'table.alchemy.standard',
  },
  ingredients: {
    page: 196,
    pdf: 198,
    heading: '1d20 / Ingredients',
    recordId: 'table.alchemy.ingredients',
  },
  parts: {
    page: 196,
    pdf: 198,
    heading: '1d3 / 1d10 / Ingredients',
    recordId: 'table.alchemy.parts',
  },
  alchemistKit: { page: 32, pdf: 34, heading: 'Alchemist', recordId: 'profession.alchemist' },
  partySize: { page: 17, pdf: 19, heading: 'Difficulty', recordId: 'core.difficulty.party_size' },
  startPlaying: {
    page: 31,
    pdf: 33,
    heading: 'Start Playing or Make More Characters',
    recordId: 'character.creation.repeat_until_party',
  },
  embarking: {
    page: 57,
    pdf: 59,
    heading: 'Embarking on your First Quest',
    recordId: 'core.quest.start_settlement',
  },
  firstQuests: {
    page: 57,
    pdf: 59,
    heading: 'Embarking on your First Quest',
    recordId: 'core.quest.first_quests',
  },
  levelling: {
    page: 58,
    pdf: 60,
    heading: 'Levelling Up',
    recordId: 'table.character.level_progression',
  },
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
      combat_skill: -5,
      alchemy: 10,
      ranged_skill: -5,
      perception: -10,
      dodge: -10,
      arcane_art: NA,
      pick_locks: -20,
      foraging: -20,
      barter: 0,
      battle_prayers: NA,
      heal: 5,
    },
    hitPoints: 0,
    hitPointsPrinted: '±0',
    talents: [{ talentId: 'resistance_to_poison', label: 'Resistance to Poison' }],
    perks: [{ perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' }],
    equipment: [
      { key: 'backpack', label: 'Small backpack', quantity: 1, selection: 'fixed' },
      { key: 'alchemist_tools', label: 'Alchemist tools', quantity: 1, selection: 'fixed' },
      { key: 'alchemist_belt', label: 'Alchemist belt', quantity: 1, selection: 'fixed' },
      {
        key: 'shortsword',
        label: 'Shortsword',
        quantity: 1,
        selection: 'fixed',
        catalogue: { kind: 'weapon', id: 'shortsword' },
      },
      {
        key: 'potions',
        label: 'potions',
        quantity: 3,
        selection: 'choice',
        qualifier: 'standard level',
      },
      { key: 'bag', label: 'bag', quantity: 1, selection: 'fixed' },
      {
        key: 'ingredients',
        label: 'ingredients',
        quantity: 3,
        selection: 'random',
        qualifier: 'in the bag',
      },
      { key: 'parts', label: 'parts', quantity: 3, selection: 'choice' },
      {
        key: 'recipe',
        label: 'recipe',
        quantity: 1,
        selection: 'choice',
        qualifier: 'for a Weak Potion',
      },
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
      combat_skill: 15,
      alchemy: -25,
      ranged_skill: -10,
      perception: -5,
      dodge: 5,
      arcane_art: NA,
      pick_locks: -20,
      foraging: -15,
      barter: -15,
      battle_prayers: NA,
      heal: -10,
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
      {
        key: 'weapon',
        label: 'Weapon of choice',
        quantity: 1,
        selection: 'choice',
        anyWeapon: true,
      },
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
      combat_skill: -5,
      alchemy: -20,
      ranged_skill: 15,
      perception: 0,
      dodge: -5,
      arcane_art: NA,
      pick_locks: -25,
      foraging: 15,
      barter: -20,
      battle_prayers: NA,
      heal: -10,
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
      {
        key: 'longbow',
        label: 'Longbow',
        quantity: 1,
        selection: 'fixed',
        catalogue: { kind: 'weapon', id: 'longbow' },
      },
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
      combat_skill: 0,
      alchemy: -25,
      ranged_skill: 0,
      perception: 0,
      dodge: 0,
      arcane_art: NA,
      pick_locks: 0,
      foraging: 0,
      barter: 5,
      battle_prayers: NA,
      heal: -10,
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
      {
        key: 'padded_jacket',
        label: 'Padded Jacket',
        quantity: 1,
        selection: 'fixed',
        catalogue: { kind: 'armour', id: 'padded_jacket' },
      },
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
      combat_skill: -5,
      alchemy: -30,
      ranged_skill: 5,
      perception: 10,
      dodge: 5,
      arcane_art: NA,
      pick_locks: 10,
      foraging: -20,
      barter: 0,
      battle_prayers: NA,
      heal: -20,
    },
    hitPoints: 0,
    hitPointsPrinted: '±0',
    talents: [{ talentId: 'evaluate', label: 'Evaluate' }],
    perks: [{ perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' }],
    equipment: [
      { key: 'backpack', label: 'Small backpack', quantity: 1, selection: 'fixed' },
      {
        key: 'dagger',
        label: 'Dagger',
        quantity: 1,
        selection: 'fixed',
        catalogue: { kind: 'weapon', id: 'dagger' },
      },
      { key: 'rope', label: 'Rope', quantity: 1, selection: 'fixed' },
      { key: 'lock_picks', label: 'Lock Picks', quantity: 10, selection: 'fixed' },
    ],
    limitations: [
      'A Thief may never use armour heavier than Tier 3 or weapons heavier than Class 2.',
    ],
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
      combat_skill: 10,
      alchemy: -25,
      ranged_skill: 5,
      perception: -10,
      dodge: 0,
      arcane_art: NA,
      pick_locks: -20,
      foraging: -15,
      barter: -15,
      battle_prayers: NA,
      heal: -10,
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
      {
        key: 'leather_jacket',
        label: 'Leather Jacket',
        quantity: 1,
        selection: 'fixed',
        catalogue: { kind: 'armour', id: 'leather_jacket' },
      },
      {
        key: 'weapon',
        label: 'One Weapon of Choice',
        quantity: 1,
        selection: 'choice',
        anyWeapon: true,
      },
    ],
    limitations: [],
  },
  {
    id: 'warrior_priest',
    name: 'Warrior Priest',
    cite: CITES.warriorPriest,
    skillTableId: 'table.character.warrior_priest_skills',
    modifiers: {
      combat_skill: 5,
      alchemy: -15,
      ranged_skill: -5,
      perception: -10,
      dodge: -5,
      arcane_art: NA,
      pick_locks: -20,
      foraging: -20,
      barter: -10,
      battle_prayers: 15,
      heal: 5,
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
      {
        key: 'relic',
        label: 'One Religious Relic of choice',
        quantity: 1,
        selection: 'choice',
        qualifier: 'Choose God and ring or amulet, page 194',
      },
      {
        key: 'weapon',
        label: 'One weapon of choice',
        quantity: 1,
        selection: 'choice',
        anyWeapon: true,
      },
    ],
    limitations: [],
  },
  {
    id: 'wizard',
    name: 'Wizard',
    cite: CITES.wizard,
    skillTableId: 'table.character.wizard_skills',
    modifiers: {
      combat_skill: -5,
      alchemy: -20,
      ranged_skill: -10,
      perception: -10,
      dodge: -10,
      arcane_art: 10,
      pick_locks: -20,
      foraging: -20,
      barter: 5,
      battle_prayers: NA,
      heal: -5,
    },
    hitPoints: 0,
    hitPointsPrinted: '±0',
    talents: [],
    perks: [{ perkId: 'heroic_force_of_will', label: 'Heroic Force of Will' }],
    arcanePerkChoice: true,
    spells: { quantity: 3, level: 1 },
    equipment: [
      { key: 'backpack', label: 'Small backpack', quantity: 1, selection: 'fixed' },
      {
        key: 'staff',
        label: 'Staff',
        quantity: 1,
        selection: 'fixed',
        catalogue: { kind: 'weapon', id: 'staff' },
      },
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
  'physical' | 'combat' | 'mental' | 'sneaky' | 'common' | 'magic' | 'alchemist' | 'faith';

export const TALENT_CATEGORIES: Record<
  TalentCategory,
  { label: string; tableId: string; cite: Cite }
> = {
  physical: {
    label: 'Physical',
    tableId: 'table.talent.physical_pilot',
    cite: CITES.physicalTalents,
  },
  combat: { label: 'Combat', tableId: 'table.talent.combat_pilot', cite: CITES.combatTalents },
  mental: { label: 'Mental', tableId: 'table.talent.mental', cite: CITES.mentalTalents },
  sneaky: { label: 'Sneaky', tableId: 'table.talent.sneaky', cite: CITES.sneakyTalents },
  common: { label: 'Common', tableId: 'table.talent.common', cite: CITES.commonTalents },
  magic: { label: 'Magic', tableId: 'table.talent.magic', cite: CITES.magicTalents },
  alchemist: {
    label: 'Alchemist',
    tableId: 'table.talent.alchemist',
    cite: CITES.alchemistTalents,
  },
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

const t = (
  id: string,
  name: string,
  category: TalentCategory,
  text: string,
  extra: Partial<Talent> = {},
): Talent => ({
  id,
  name,
  category,
  text,
  ...extra,
});

/** Appendix II, every talent, verbatim. The human Jack of all trades rolls on these. */
export const TALENTS: readonly Talent[] = [
  t(
    'catlike',
    'Catlike',
    'physical',
    'Your hero moves with grace and has almost supernatural balance. Your hero gains +5 DEX.',
    { effects: { stats: { dex: 5 } } },
  ),
  t(
    'fast',
    'Fast',
    'physical',
    'Your hero moves unusually fast and gains a permanent +1 bonus to their Movement stat.',
    { effects: { movement: 1 } },
  ),
  t(
    'mule',
    'Mule',
    'physical',
    'Your hero is used to carry heavy equipment during long travels. Your hero can carry 20 ENC more than the STR value would allow.',
    { effects: { carry: 20 } },
  ),
  t(
    'night_vision',
    'Night Vision',
    'physical',
    'Your hero’s species has the natural ability to see in the dark and is not affected by darkness. A hero with Night Vision gets +10 on Perception. This talent can only be given to a newly-created character that has this talent listed in the Species Description.',
    {
      effects: { skills: { perception: 10 } },
      restriction: {
        printed:
          'This talent can only be given to a newly-created character that has this talent listed in the Species Description.',
        speciesTrait: true,
      },
    },
  ),
  t(
    'observant',
    'Observant',
    'physical',
    'Rangers only. Used to camping in dangerous places, a Ranger with this talent will convey a -10 modifier to the risk of an ambush during a rest in a dungeon. Furthermore, all members of the party will always start all battles standing up even if the quest or rules states otherwise. Any extra enemy initiative tokens due to a surprise or ambush is also negated by this talent.',
    {
      restriction: { printed: 'Rangers only.', professions: ['ranger'] },
    },
  ),
  t(
    'perfect_hearing',
    'Perfect Hearing',
    'physical',
    'Your hero’s hearing is exceptionally good, and and you may add 1 hero initiative token to the first round of battle after opening a door and encountering enemies. This cannot be used if the door was broken down. This talent can only be given to a newly created character that has this Talent listed in the Species Description.',
    {
      restriction: {
        printed:
          'This talent can only be given to a newly created character that has this Talent listed in the Species Description.',
        speciesTrait: true,
      },
    },
  ),
  t(
    'resilient',
    'Resilient',
    'physical',
    'Your hero’s brawny physique grants a +5 bonus to the Constitution stat.',
    { effects: { stats: { con: 5 } } },
  ),
  t(
    'resistance_to_disease',
    'Resistance to Disease',
    'physical',
    'Your hero seems to have a natural ability to resist diseases. Your hero gets a +25 bonus on Constitution Tests to resist disease.',
  ),
  t(
    'resistance_to_poison',
    'Resistance to Poison',
    'physical',
    'Your hero seems to have a natural ability to resist poison. Your hero gets a +25 bonus on Constitution Tests to resist poison.',
  ),
  t(
    'strong',
    'Strong',
    'physical',
    'Your hero’s exercises have paid off and your hero gains a +5 bonus to the Strength stat.',
    { effects: { stats: { str: 5 } } },
  ),
  t(
    'strong_build',
    'Strong Build',
    'physical',
    'Your hero gains a +2 bonus to the Hit Points stat.',
    { effects: { hitPoints: 2 } },
  ),
  t(
    'tank',
    'Tank',
    'physical',
    'Wearing heavy armour has little effect on your hero’s ability to move. The hero ignores the Clunky Special Rule.',
  ),

  t(
    'axeman',
    'Axeman',
    'combat',
    'Preferring the balance of a good axe, this hero has become a master of using this weapon. Bloodlust is now triggered on a result of 1-10 when using all kinds of axes.',
  ),
  t(
    'bruiser',
    'Bruiser',
    'combat',
    'The hero excels at fighting with blunt weapons and Bloodlust is now triggered on a result of 1-10 when using all kinds of hammers, flails, staffs, and morning stars.',
  ),
  t(
    'death_lament',
    'Death Lament',
    'combat',
    'When others fall, this hero still stands, refusing to give in. Each time your hero is reduced to 0 Hit Points, roll 1d6: on a result of 1-3, the hero regains 1 Hit Point.',
  ),
  t(
    'disarm',
    'Disarm',
    'combat',
    "This is a special attack, using the target's DEX as a negative modifier to the attack. If the attack succeeds it inflicts no damage, but causes the enemy to drop their weapon. The enemy must spend their next action trying to pick it up. In order to do so, the enemy has to succeed with a DEX Test. The enemy will continue until successful. If the hero’s attack fails, nothing happens. This can only be used on enemies that are carrying weapons.",
  ),
  t(
    'dual_wield',
    'Dual Wield',
    'combat',
    'This talent requires a DEX of 60. Any hero with this talent may use a weapon with the Dual Wield Special Rule in their offhand. The attacks are still done as usual with the main weapon, but any hit will add +X DMG to the target. The X is defined in the Weapon Table. Parrying with two weapons is also easier, and any parry while using two weapons has a +5 modifier.',
    {
      restriction: {
        printed: 'This talent requires a DEX of 60.',
        requiresStat: { stat: 'dex', value: 60 },
      },
    },
  ),
  t(
    'fast_reload',
    'Fast Reload',
    'combat',
    'Years of practice makes your hero faster than most and they can reload in the blink of an eye. Bows and sling can be reloaded in the same action as shooting once per turn. Crossbows can be reloaded in 1 action and fired in the next. An Arbalest can be reloaded in 2 actions, and fired in the next turn.',
  ),
  t(
    'lethal_shot',
    'Lethal shot',
    'combat',
    'Your hero always seems to hit the perfect spot. +2DMG with all ranged weapons.',
  ),
  t(
    'marksman',
    'Marksman',
    'combat',
    'Fighting with ranged weapons comes naturally to your hero. Bloodlust is now triggered on a result of 1-10 when using all kinds of ranged weapons.',
  ),
  t(
    'mighty_blow',
    'Mighty Blow',
    'combat',
    'Your hero is an expert at finding the weak spots of the enemy. Your hero gets a +1 bonus on Damage Rolls with melee weapons.',
  ),
  t(
    'parry_master',
    'Parry Master',
    'combat',
    'Your hero is adept at protection with a weapon. If the hero is in the Parry Stance, they may parry twice with a weapon during one turn.',
  ),
  t(
    'perfect_shot',
    'Perfect Shot',
    'combat',
    'Identifying the weak spots in enemy armour can sometimes make the difference when firing an arrow or bolt from afar. If the Damage Roll is odd, your hero ignores armour (But not NA).',
  ),
  t(
    'riposte_master',
    'Riposte Master',
    'combat',
    'When successfully parrying a strike with a weapon, the hero may automatically cause 2 Points of Damage to that Enemy, ignoring Armour and NA. May only be done with weapons of class 3 or lower.',
  ),
  t(
    'sniper',
    'Sniper',
    'combat',
    'With practised ease, your hero cannot seem to miss when taking careful aim. The aim action gives your hero a +15 modifier instead of +10.',
  ),
  t(
    'swordsman',
    'Swordsman',
    'combat',
    'This hero is very skilled with a blade and Bloodlust is now triggered on a result of 1-10 when using all types of swords.',
  ),
  t(
    'tight_grip',
    'Tight Grip',
    'combat',
    'With unusually strong hands, the hero may add +10 STR when calculating what weapon class they can use.',
    { effects: { weaponClassStrength: 10 } },
  ),
  t(
    'tunnel_fighter',
    'Tunnel Fighter',
    'combat',
    'Your hero is accustomed to fighting in tight spaces. +10 CS when fighting in a corridor.',
  ),

  t(
    'braveheart',
    'Braveheart',
    'mental',
    'Your hero is braver than most. +10 bonus on Fear and Terror Tests.',
  ),
  t(
    'confident',
    'Confident',
    'mental',
    'No enemy or task is too difficult. Your hero gains a +5 bonus to the Resolve stat.',
    { effects: { stats: { res: 5 } } },
  ),
  t(
    'fearless',
    'Fearless',
    'mental',
    'Your hero is completely immune to the effects of fear and treats terror as fear. This talent requires that the hero already has the Braveheart Mental Talent.',
    {
      restriction: {
        printed: 'This talent requires that the hero already has the Braveheart Mental Talent.',
        requiresTalent: 'braveheart',
      },
    },
  ),
  t(
    'hate',
    'Hate',
    'mental',
    'Through personal experience, or through the history of their kin, your hero has grown to hate certain enemies. This hate fuels their fighting, gaining a +5 bonus to CS when attacking those enemies. However, their hatred impairs their ability to parry and dodge (-5 parry/dodge) when struck by those enemies. The hero may choose one enemy to hate. If your hero hates goblins for instance, they hate every enemy with the word ‘Goblin’ in it. This Talent may be taken several times making the hero hate different enemies.',
    { namesEnemy: true },
  ),
  t(
    'strong_minded',
    'Strong-Minded',
    'mental',
    'Your hero is less affected by the horrors of the dungeons than their comrades. The hero gains +1 Sanity Point.',
    { effects: { sanity: 1 } },
  ),
  t(
    'wise',
    'Wise',
    'mental',
    'Your hero has plenty of life experience and may re-roll a failed WIS-test.',
  ),

  t(
    'assassin',
    'Assassin',
    'sneaky',
    'With uncanny precision, the hero automatically hits any target from behind with a class 1 or 2 weapon.',
  ),
  t(
    'backstabber',
    'Backstabber',
    'sneaky',
    'Accustomed to optimising the odds, your hero ignores enemy armour and NA when attacking from behind.',
  ),
  t(
    'cutpurse',
    'Cutpurse',
    'sneaky',
    'Once per visit in a settlement, your hero may try to steal the purse from some unsuspecting victim. This must be done as the first thing when entering a settlement. Roll 1d6. On a result of 1-2 the hero gains 1d100 coins. On a result of 6, the attempt is detected, and the hero is immediately chased out of the settlement. The hero may do nothing until the rest of the party decides to leave the settlement. Rations must be used as normal, and if rations are lacking, the hero becomes hungry. Foraging is allowed while waiting.',
  ),
  t(
    'evaluate',
    'Evaluate',
    'sneaky',
    'Your hero has a good sense for the value of things. A successful Barter Roll will give your hero +15% instead of the usual +10%.',
  ),
  t(
    'lockpicker',
    'Lockpicker',
    'sneaky',
    'No lock seems to hinder this hero. The hero may re-roll a failed lockpick attempt.',
  ),
  t(
    'mechanical_genius',
    'Mechanical Genius',
    'sneaky',
    'Your hero is a master at understanding mechanical contraptions and gains +10 when disarming traps.',
  ),
  t('nimble', 'Nimble', 'sneaky', 'The hero may dodge twice per battle instead of only once.'),
  t(
    'quick_fingers',
    'Quick Fingers',
    'sneaky',
    'Accustomed to working under pressure, your hero has mastered the skill of reading a lock and picking it. Picking a lock now takes 1 AP instead of 2.',
  ),
  t(
    'sharp_eyed',
    'Sharp-eyed',
    'sneaky',
    'Your hero has an extreme sense for details and can easily notice anything out of the ordinary. Your hero gains a +10 bonus on Perception Tests.',
    { effects: { skills: { perception: 10 } } },
  ),
  t(
    'sense_for_gold',
    'Sense for Gold',
    'sneaky',
    'It seems this hero can almost smell their way to treasures. When rolling on the Furniture Table for treasures, the hero may subtract -1 on the roll.',
  ),
  t(
    'shadow_walker',
    'Shadow walker',
    'sneaky',
    'Your hero seems to always blend into the shadows. Moving almost unseen, the hero ignores movement restrictions due to enemy ZOC.',
  ),
  t(
    'streetwise',
    'Streetwise',
    'sneaky',
    'Your hero knows who to ask to acquire the gear they search for. Every roll this hero makes for availability may be modified by -1. This Talent can only be taken by a Rogue.',
    {
      restriction: { printed: 'This Talent can only be taken by a Rogue.', professions: ['rogue'] },
    },
  ),
  t(
    'trapfinder',
    'Trapfinder',
    'sneaky',
    'Your hero is an expert at dealing with traps. Your hero gains a +10 PER bonus when detecting traps. This is cumulative with Sharp-eyed.',
  ),

  t('bard', 'Bard', 'common', 'The hero gets a +10 WIS modifier when using instruments.'),
  t(
    'cartographer',
    'Cartographer',
    'common',
    'The hero is skilled at drawing maps. If the hero passes a WIS test before entering a dungeon, the exploration deck is set up using 2 cards less than noted in the quest. Remove one corridor and one room. No matter how many heroes uses this talent, no more than 2 cards can be removed.',
  ),
  t(
    'charming',
    'Charming',
    'common',
    'This hero seems to get along with everyone and always draws a smile from those to whom he talks. Well aware of this, the party lets this hero negotiate all rewards and gains +5% Reward Bonus on all quests.',
  ),
  t(
    'disciplined',
    'Disciplined',
    'common',
    'Thanks to a military background, this hero has an increased degree of calmness under pressure. This also spreads to the rest of the party. The hero gains +10 RES and the other members of the party gain +5 RES as long as the hero is not knocked out. The effect on the party is not cumulative if other heroes have the same talent. Furthermore, a hero with this talent will not benefit from the effect of this talent from another hero.',
    { effects: { stats: { res: 10 } } },
  ),
  t(
    'hunter',
    'Hunter',
    'common',
    'The hero has a knack for finding wild game and knows how best to hunt them. The hero gains +10 to Foraging.',
    { effects: { skills: { foraging: 10 } } },
  ),
  t(
    'lucky',
    'Lucky',
    'common',
    'Some are just luckier than others. Everything seems to go your way. You gain +1 Luck Point.',
    { effects: { luck: 1 } },
  ),
  t(
    'master_cook',
    'Master Cook',
    'common',
    'During a rest, the party members will regain +2 extra HP if they have rations, due to your hero’s expert cooking skills. This is not cumulative if more than one hero has this Talent.',
  ),
  t(
    'natural_leader',
    'Natural Leader',
    'common',
    'The hero’s natural ability to lead will add +2 to the Party Moral permanently. This is not cumulative if more than one hero has this talent.',
    { effects: { partyMorale: 2 } },
  ),
  t(
    'ringbearer',
    'Ringbearer',
    'common',
    'Somehow, this hero has managed to tame the effect of magic imbued items. Instead of being limited to one ring, your hero can now use two rings simultaneously.',
  ),
  t(
    'survivalist',
    'Survivalist',
    'common',
    'This talent lets your hero forage one ration from any monster in the Beast category (in a dungeon or after a skirmish), as long as the Forage roll is successful.',
  ),
  t(
    'swift_leader',
    'Swift Leader',
    'common',
    'The party may always add one initiative token to the bag. This is only used to increase chance of activation and all heroes may still only act once per turn. This is not a cumulative effect so only 1 token will be added even if more than one hero has this talent.',
  ),
  t(
    'veteran',
    'Veteran',
    'common',
    'Your hero’s your gear is in perfect order, making changes in equipment very easy. You can use equipment from a Quick Slot without spending an Action Point (once per turn).',
  ),
  t(
    'pathfinder',
    'Pathfinder',
    'common',
    'The hero has a knack for finding good shelter during travels. All heroes get +1 HP when resting.',
  ),
  t(
    'pious',
    'Pious',
    'common',
    'Your hero has a strong connection to the Gods. The hero may use relics, even though he or she is not a Warrior Priest. This talent cannot be chosen by a Warrior Priest.',
    {
      restriction: {
        printed: 'This talent cannot be chosen by a Warrior Priest.',
        notProfessions: ['warrior_priest'],
      },
    },
  ),

  t(
    'blood_magic',
    'Blood Magic',
    'magic',
    'The wizard can spend his own life blood to create Mana. For every 2 HP spent, the wizard gains 5 Mana. This transformation can be done for free during the wizard’s turn.',
  ),
  t(
    'conjurer',
    'Conjurer',
    'magic',
    'The wizard is an expert conjurer and gains +5 Arcane Arts whenever casting a Conjuration Spell. Furthermore, the Mana cost for such a spell is reduced by 5.',
  ),
  t(
    'divinator',
    'Divinator',
    'magic',
    'The wizard gets +5 Arcane Arts whenever casting a Divination Spell. Furthermore, the Mana cost for such a spell is reduced by 5.',
  ),
  t(
    'fast_reflexes',
    'Fast Reflexes',
    'magic',
    'With lightning-fast reflexes, your hero can reach out and touch your enemies when casting spells. Your hero gains a +15 Combat Skill Bonus when casting Touch Spells.',
  ),
  t(
    'focused',
    'Focused',
    'magic',
    'Well attuned to the void, your hero is adept at tapping into it to gain maximum power. Your hero gets +15 Arcane Arts when focusing.',
  ),
  t('persistent', 'Persistent', 'magic', 'Your hero gains a permanent +15 Mana.', {
    effects: { mana: 15 },
  }),
  t(
    'restorer',
    'Restorer',
    'magic',
    'Restoration spells are the favourite spells of your hero, and this results in all Healing Spells healing +2 Hit Points in addition to the spell’s normal result. You cannot have this talent at the same time as you have the Necromancer Talent.',
  ),
  t(
    'mystic',
    'Mystic',
    'magic',
    'The wizard is truly skilled with Mysticism Spells and gets +5 Arcane Arts whenever casting a Mysticism Spell. Furthermore, the Mana cost for such a spell is reduced by 5.',
  ),
  t(
    'necromancer',
    'Necromancer',
    'magic',
    'The hero gets +5 Arcane Arts whenever casting a Necromantic Spell. Furthermore, the Mana cost for such a spell is reduced by 5. You cannot have this Talent at the same time as you have the Restorer Talent.',
  ),
  t(
    'powerful_missiles',
    'Powerful Missiles',
    'magic',
    'Your hero has perfected the use of Magic Missiles, knowing where to aim for maximum effect. Magic Missile Spells do +1 Damage.',
  ),
  t(
    'summoner',
    'Summoner',
    'magic',
    'Reaching into other realms and bringing other beings to their aid has become easier with years of practice. Creatures summoned by the Wizard will stay 2 turns longer than normally allowed by the Wizard’s CL.',
  ),
  t('sustainer', 'Sustainer', 'magic', 'Upkeep for the wizard’s spells is reduced by 1.'),
  t('thrifty', 'Thrifty', 'magic', 'The wizard requires 2 less Mana on every spell cast.'),

  t(
    'expert_mixer',
    'Expert Mixer',
    'alchemist',
    'The Alchemist is a master of mixing offensive potions. All throwable potions that cause damage gets a +1DMG on every target.',
  ),
  t(
    'gatherer',
    'Gatherer',
    'alchemist',
    'Finding good ingredients in the wild comes naturally to the hero. +10 Alchemy when searching for ingredients in the wild.',
  ),
  t(
    'harvester',
    'Harvester',
    'alchemist',
    'With precise incisions, the hero can harvest good quality components from fallen enemies. +10 Alchemy when harvesting parts.',
  ),
  t(
    'keen_eye',
    'Keen Eye',
    'alchemist',
    'The Alchemist has a keen eye when it comes to finding ingredients. The hero may reroll the result when rolling to see what has been gathered. The second result stands.',
  ),
  t(
    'master_healer',
    'Master Healer',
    'alchemist',
    'This hero has perfected the art of making Healing Potions. All potions brewed heal +2 Hit Points more than normal.',
  ),
  t(
    'perfect_toss',
    'Perfect Toss',
    'alchemist',
    'The hero has a knack for lobbing bottles in a perfect arc over friends and foes alike. +10 RS when lobbing a potion over the heads of others.',
  ),
  t(
    'poisoner',
    'Poisoner',
    'alchemist',
    'The hero is very adept at making all sorts of poisons. Poisons created by this hero always inflict 2 additional Hit Point per turn.',
  ),
  t(
    'powerful_potions',
    'Powerful Potions',
    'alchemist',
    'The strength of this hero’s potions is remarkable. All basic stat (Not M) enhancing potions grant an additional +5 bonus.',
  ),

  t(
    'devoted',
    'Devoted',
    'faith',
    'The hero gains an extra Energy Point that can only be used for praying.',
  ),
  t(
    'gods_chosen',
    'God’s Chosen',
    'faith',
    'As if by the will of the gods, nothing seems to hurt this priest. +1 Luck.',
    { effects: { luck: 1 } },
  ),
  t(
    'healer',
    'Healer',
    'faith',
    'This priest has tended many wounds and applies bandages with practiced hands. A bandage applied by this priest will heal +1 HP',
  ),
  t(
    'messiah',
    'Messiah',
    'faith',
    'With a confidence that radiates through the room, no one can help but be inspired. All heroes on the same tile as the priest gain +5 Resolve.',
  ),
  t(
    'pure',
    'Pure',
    'faith',
    'The radiance of this priest hurts the eyes of all demons. Any demon trying to attack the priest does so at -10 CS.',
  ),
  t(
    'reliquary',
    'Reliquary',
    'faith',
    'So strong is their faith in the holy relics, that this priest can channel the power of 3 relics, rather than the standard two.',
  ),
];

export const TALENT_BY_ID: ReadonlyMap<string, Talent> = new Map(
  TALENTS.map((talent) => [talent.id, talent]),
);

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
  {
    id: 'dispel_master',
    name: 'Dispel Master',
    effect: 'The wizard is very skilled in the art of countering enemy magic.',
    comment: 'The wizard gets +20 Arcane Arts when rolling to dispel when this Perk is used.',
  },
  {
    id: 'energy_to_mana',
    name: 'Energy to Mana',
    effect:
      'The wizard has the ability to turn energy into Mana. For each Energy Point spent, the wizard gains 20 Mana.',
    comment: 'The wizard may spend any number of Energy Points.',
  },
  {
    id: 'inner_power',
    name: 'Inner Power',
    effect: 'The wizard increases the power of their magic missiles, causing an extra 1d6 Damage.',
    comment: 'Must be declared before the spell is cast.',
  },
  {
    id: 'in_tune_with_the_magic',
    name: 'In Tune with the Magic',
    effect:
      'Caster may use Focus before trying to identify a Magic Item. However, when attuning to the magic in that way, their mind is open enough to risk their sanity.',
    comment:
      'Works just as if casting a spell but introduces miscast to the roll as well. 1 Action of Focus causes a miscast on 95-00. Increase the risk by 5 for each additional action.',
  },
  {
    id: 'quick_focus',
    name: 'Quick Focus',
    effect:
      'The wizard has the ability of extreme Focus, increasing the chance to succeed on a spell. Add +10 Arcane Arts Skill without spending an action on focus. Risk for a miscast is still increased by 5.',
    comment: 'Used at the same time as casting a spell. Only lasts for that spell.',
  },
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
  {
    rowId: 'row_1',
    id: 'fake_death',
    name: 'Fake Death',
    cv: 7,
    mana: 8,
    upkeep: 0,
    special: '',
    school: 'Necromancy',
    effect:
      'Causes the caster to fall to the ground, appearing dead to all around. Enemies will not target the caster for the rest of the battle. The caster may do nothing until the end of the battle.',
  },
  {
    rowId: 'row_2',
    id: 'flare',
    name: 'Flare',
    cv: 8,
    mana: 10,
    upkeep: 0,
    special: 'Q, MM',
    school: 'Destruction',
    effect:
      'A bright flare shoots from the caster’s hand, hissing through the air to strike the target with a large bang. DMG is 1D8.',
  },
  {
    rowId: 'row_3',
    id: 'gust_of_wind',
    name: 'Gust of Wind',
    cv: 12,
    mana: 8,
    upkeep: 1,
    special: '',
    school: 'Alteration',
    effect:
      'Suddenly a powerful wind blows through the dungeon, making arrows fly astray. All Missile Weapons now have a -15 modifier to hit if the arrows pass the room the Wizard is in. The wind lasts for Caster level turns. Upkeep is 1 point of Mana.',
  },
  {
    rowId: 'row_4',
    id: 'hand_of_death',
    name: 'Hand of Death',
    cv: 7,
    mana: 8,
    upkeep: 0,
    special: 'Q, T',
    school: 'Necromancy',
    effect:
      'This is a close combat spell, where the caster touches the enemy and causes them harm through magical energy. The target loses 1d10 Hit Points, which ignores armour.',
  },
  {
    rowId: 'row_5',
    id: 'healing_hand',
    name: 'Healing Hand',
    cv: 6,
    mana: 12,
    upkeep: 0,
    special: 'Q, T',
    school: 'Restoration',
    effect:
      'The caster lays their hand on a comrade and heals 1d8+2 Hit Points. This can be used on the caster as well.',
  },
  {
    rowId: 'row_6',
    id: 'light_healing',
    name: 'Light Healing',
    cv: 5,
    mana: 10,
    upkeep: 0,
    special: 'Q',
    school: 'Restoration',
    effect:
      'The caster can heal one hero (including the caster) within 4 squares and in LOS (intervening models do not matter). It heals 1d6 Hit Points.',
  },
  {
    rowId: 'row_7',
    id: 'protective_shield',
    name: 'Protective Shield',
    cv: 10,
    mana: 10,
    upkeep: 1,
    special: '',
    school: 'Mysticism',
    effect:
      'The caster summons a translucent sphere of blue light around themself or the target (which must be in LOS), protecting it from physical harm. The shield absorbs 1 Point of Damage per Caster level to a maximum of 3. You can cast the spell twice (but not more) on each target, adding together the effect of the spell. The spell lasts the entire battle but costs 1 point of Mana in upkeep per turn.',
  },
  {
    rowId: 'row_8',
    id: 'slip',
    name: 'Slip',
    cv: 10,
    mana: 10,
    upkeep: 0,
    special: '',
    school: 'Hex',
    effect:
      'Causes the target to slip and fall. The target remains prone until its next activation when it will spend its first action standing up.',
  },
];

export interface Prayer {
  id: string;
  recordId: string;
  name: string;
  text: string;
  cite: Cite;
}

export const LEVEL_1_PRAYERS: readonly Prayer[] = [
  {
    id: 'bringer_of_light',
    recordId: 'prayer.bringer_of_light',
    name: 'Bringer of Light',
    text: 'The light of the Gods shines through the priest, causing the Undead to waver. Any Undead trying to attack the Warrior Priest suffers -10 CS.',
    cite: { page: 80, pdf: 82, heading: 'Bringer of Light', recordId: 'prayer.bringer_of_light' },
  },
  {
    id: 'charus_walk_with_us',
    recordId: 'prayer.charus_walk_with_us',
    name: 'Charus, Walk with Us',
    text: 'This prayer goes to Charus and as long as he listens, all heroes regain an Energy Point on any skill roll of 01-10, instead of the normal 01-05. Note that this only affects energy, not the other options you have if you roll 01-05.',
    cite: {
      page: 80,
      pdf: 82,
      heading: 'Charus, Walk with Us',
      recordId: 'prayer.charus_walk_with_us',
    },
  },
  {
    id: 'metheias_ward',
    recordId: 'prayer.metheias_ward',
    name: 'Metheia’s Ward',
    text: 'Under the protection of Metheia, the priest regains 1 lost HP at the start of his activation, for the rest of the battle.',
    cite: { page: 80, pdf: 82, heading: 'Metheia’s Ward', recordId: 'prayer.metheias_ward' },
  },
  {
    id: 'methias_balm',
    recordId: 'prayer.methias_balm',
    name: 'Methia’s Balm',
    text: 'With the power of Metheia, the priest may heal an adjacent hero with 1d6+1 HP. This prayer can also be used to heal the priest. Once the effect has been resolved, the prayer stops.',
    cite: { page: 81, pdf: 83, heading: 'Methia’s Balm', recordId: 'prayer.methias_balm' },
  },
  {
    id: 'power_of_the_gods',
    recordId: 'prayer.power_of_the_gods',
    name: 'Power of the Gods',
    text: 'By channelling the power of the gods and diverting it to a wizard, the priest can help conjure a spell. As long as the prayer is active, any hero wizard gains +10 Arcane Arts.',
    cite: { page: 80, pdf: 82, heading: 'Power of the Gods', recordId: 'prayer.power_of_the_gods' },
  },
  {
    id: 'the_power_of_iphy',
    recordId: 'prayer.the_power_of_iphy',
    name: 'The Power of Iphy',
    text: 'This empowering psalm strengthens your resolve. The party gets +10 RES on any Fear or Terror Test during the battle. If they have already failed these tests, they may retake them with this bonus.',
    cite: { page: 80, pdf: 82, heading: 'The Power of Iphy', recordId: 'prayer.the_power_of_iphy' },
  },
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
  {
    rowId: 'row_2',
    roll: 2,
    name: 'Relic of Metheia',
    effect: 'Adds +1d3 to any form of healing done by the Priest',
  },
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

const bg = (
  number: number,
  id: string,
  name: string,
  page: number,
  text: string,
  extra: Partial<Background> = {},
): Background => ({
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
  bg(
    1,
    'wanderlust',
    'Wanderlust',
    40,
    'Personal Quest: Visit all settlements on the map (A total of 11). Once done, you gain 1500 XP.',
  ),
  bg(
    2,
    'the_well',
    'The Well',
    40,
    'Personal Trait and Quest: You suffer from extreme claustrophobia. (See ‘Psychology’ Chapter). This is not curable at the asylum. Instead, you must face your fears. Once you have fought and survived 5 battles in a corridor, your condition is finally cured. Such is the effect of beating this trauma that you actually turn it into a strength. You gain the Tunnel Fighter Talent.',
  ),
  bg(
    3,
    'fables',
    'Fables',
    40,
    'Personal Quest: Visit 3 Quest Sites in the Ancient Lands. Once you leave the third site, you gain 1500 XP.',
  ),
  bg(
    4,
    'the_heirloom',
    'The Heirloom',
    41,
    'Personal Quest: Find your Great Aunt’s sword. At the start of each quest, roll 1d10. On a roll of 1, the dungeon you are heading to is actually the one that holds the sword. Place a secondary Quest Card in the first half of the Exploration Card pile. The room after the secondary Quest Card will always have enemies. Roll twice on the encounter table. One of the enemies with the highest XP will carry the sword (although will not use it in battle). The fate of your ancestor will never be known, but at least you will now have a chance to get that sword back. The weapon is a silver shortsword that does +1 DMG and has +2 Durability. You may not sell it.',
  ),
  bg(
    5,
    'arachnophobia',
    'Arachnophobia',
    41,
    'Personal Trait and Quest: You suffer from extreme arachnophobia. (See ‘Psychology’ Chapter). This is not curable at the asylum. Instead, you must face your fears. Once you have fought and survived 3 battles with spiders, your condition is finally cured. Such is the effect of beating this trauma that you actually turn it into a strength. You gain +10 CS whenever trying to hit a spider.',
  ),
  bg(
    6,
    'the_lost_brother',
    'The Lost Brother',
    41,
    'Personal Quest: Find your lost brother. For this quest, you need to keep track of how many dungeons you have entered. At the start of each quest, roll 1d10. On a roll of 1, the dungeon you are heading to is the one in which you will find your brother. Place a secondary Quest Card in the pile not containing the Quest Room. The tile you enter next will contain your brother. Once you enter the room, roll 1d100, adding the number of dungeons you have entered. If the result is 60 or higher, you are too late and you find the remains of your dear brother on the floor, dead. It seems that he has been dead for some time. Devastated, you must decide if you will leave him where he is, or bring him out of the dungeon and bury him. In both cases you lose 3 Points of Sanity, but gain 250 XP. If you choose to bury him, you must carry him through the dungeon (of course letting go of him when danger approaches). The downside of this is that you cannot carry anything else you find (you may not search for treasures, or carry anything your comrades find). Once outside, you have a short ceremony and lay him to rest in a nearby meadow. You gain +10 RES permanently. If the result is lower than 60, your brother is alive, but badly wounded. Place him on the tile and you may move him just like the other heroes. Use the civilian Monster Card to represent him. If your brother makes it out alive, he will accompany you to the next settlement where you will part ways. You gain 1500 XP once you reach the settlement. If he dies during the dungeon crawl, revert to ‘result higher than 60’. If he dies in a skirmish, you do not need to carry him further, but the end result is the same.',
  ),
  bg(
    7,
    'revenge_bandits',
    'Revenge',
    42,
    'Personal Trait and Quest: You hate all enemies from the ‘Bandits and Brigands’ faction. Furthermore, for every 5 enemies from that section where you deliver the killing blow, you gain an additional 250 XP.',
    { hate: 'all enemies from the ‘Bandits and Brigands’ faction' },
  ),
  bg(
    8,
    'bad_tempered',
    'Bad Tempered',
    42,
    'Personal Trait: You contribute a permanent -2 modifier to Party Morale. But, on the other hand, always expecting the worst can have its benefits as well. Your maximum Sanity is permanently increased by +2.',
    { sanity: 2, partyMorale: -2 },
  ),
  bg(
    9,
    'poverty',
    'Poverty',
    42,
    'Personal trait and quest: You know the value of each coin, and may never make a purchase, or lend out money, that would leave you with less than 10 c. Furthermore, you must try to accumulate 1000 c for your family. Randomise which village (not Silver City) in which you were born and raised. If you are a dwarf, randomise between the two Dwarven settlements. Once you feel ready to hand over the money to your family, pay them a visit and hand over the money. This can be done by spending one Point of Movement in that village, and it will grant you 2000 XP.',
  ),
  bg(
    10,
    'proving_your_worth',
    'Proving Your Worth',
    43,
    'Personal Quest: Kill an enemy that gives you 450 XP or more. You do not need to strike the final blow, as long as your party makes the kill. Once that is done, return to your father to claim the armour. Randomise which village (not Silver City) you were born and raised in. If you are a dwarf, randomise between the two Dwarven settlements. Gaining the armour can be done by simply spending one Point of Movement in that location. This is the Armour of the Father as described in the ‘Legendary Items’ chapter.',
  ),
  bg(
    11,
    'the_fraud',
    'The Fraud',
    43,
    'Not applicable for wizards. reroll if you are a wizard. Personal Trait: Deduct -10 from CS, RS, and Dodge since you have neither formal training nor experience. Your RES is also reduced with -10 (temporarily, see below). Personal Quest: It is time to go from fraud to the real deal. Once you have improved CS, RS, and Dodge with +10 you can finally believe that you are more than empty words. Once this is achieved, you regain your RES and may increase it with another +10. You also gain an additional 1500XP.',
    { wizardReroll: true },
  ),
  bg(
    12,
    'the_noble',
    'The Noble',
    44,
    'Effect: You were not kicked out without means, and you have managed to retain some of the coins your mother secretly handed you before you parted. You start with 400 c instead of the normal 150 c. However, being accustomed to having money makes it extra hard when you have none. If you ever drop below 150 c, you start questioning if this is really what you should do for a living. Your resolve is reduced with -20 until you have enough money again (150 c).',
    { startingCoins: 400 },
  ),
  bg(
    13,
    'sworn_enemy',
    'Sworn Enemy',
    45,
    'Personal Quest: Whenever you end up in battle with bandits, roll 1d10. On a result of 10, add one Bandit Leader to the encounter. This bandit has both the Hate special rule against the entire party, as well as Frenzy. Once the bandit is killed, you have rid your family of this sworn enemy, and you gain an extra 500 XP.',
  ),
  bg(
    14,
    'the_family_keep',
    'The Family Keep',
    45,
    'Randomize one quest location on the map using the white numbers to situate the ruins of your Keep. Personal Quest: Clear out the Keep. Whether you go there as a part of another quest, or if you decide to go there for this sole purpose, you must clear the entire dungeon. Every tile must be placed on the table and all enemies must be killed. If you go there specifically for this purpose, use the generic Dungeon Generator to create the dungeon. Once the dungeon is cleared, you gain 1500 XP.',
  ),
  bg(
    15,
    'troll_slayer',
    'Troll Slayer',
    45,
    'Personal Quest: You must slay a troll. To rightfully claim the title of Troll Slayer, you must land the killing blow on a troll (of any kind). If you achieve this, you have both honoured your lineage and gained a further +1000 XP.',
  ),
  bg(
    16,
    'revenge_minotaur',
    'Revenge',
    45,
    'Talent: You hate Minotaurs. Personal Quest: Every time you fight a Minotaur, roll 1d6. On a result of 1, you recognize the scar. If you defeat the beast, you gain an additional +.',
    { hate: 'Minotaurs' },
  ),
  bg(
    17,
    'a_new_home',
    'A new home',
    45,
    'Personal Quest: Even though the adventuring lifestyle suits you much better than you had expected, you still yearn for a place to call your own. Once you have acquired the Bergmeister Estate, you gain 1500 XP.',
  ),
  bg(
    18,
    'the_apprentice',
    'The Apprentice',
    46,
    'Personal Traits: Your blacksmithing skills are truly useful while adventuring. Whenever using an armour repair kit or a whetstone, you automatically regain 3 Points of Durability on your gear.',
  ),
  bg(
    19,
    'weak',
    'Weak',
    46,
    'Personal Trait: Whenever rolling for contracting a disease, you suffer an -10 modifier to your CON. However, once you are cured of your 3rd disease, your immune system kicks into overdrive, and you instead get a +10 modifier to your CON when rolling for disease, and you cure yourself on a natural CON roll of 01-10 instead of 01-05.',
  ),
  bg(
    20,
    'afraid_of_heights',
    'Afraid of Heights',
    46,
    'Personal Trait: Whenever you take a Fear Test (but not a Terror Test), you gain a +10 modifier on your RES. However, whenever you are on a bridge your resolve is halved (RDD) and your CS and RS suffer a -20 modifier.',
  ),
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

const w = (
  id: string,
  name: string,
  damage: string,
  enc: number | null,
  weaponClass: number | null,
  special: string,
  costPrinted: string,
  reload = '',
): Weapon => ({
  id,
  name,
  damage,
  enc,
  weaponClass,
  special,
  cost: /^\d+ c$/.test(costPrinted) ? Number(costPrinted.replace(' c', '')) : null,
  costPrinted,
  reload,
  durability: special.includes('Defensive')
    ? CREATION.defensiveWeaponDurability
    : CREATION.standardDurability,
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

export const WEAPON_BY_ID: ReadonlyMap<string, Weapon> = new Map(
  WEAPONS.map((weapon) => [weapon.id, weapon]),
);

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

const a = (
  tier: number,
  id: string,
  name: string,
  def: number,
  enc: number,
  covers: string,
  special: string,
  costPrinted: string,
): Armour => ({
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

export const ARMOUR_BY_ID: ReadonlyMap<string, Armour> = new Map(
  ARMOUR.map((piece) => [piece.id, piece]),
);

/** Printed wording the creator quotes next to the controls. */
export const QUOTES = {
  rollStats:
    'Roll them one at a time and write these stats down temporarily as they will be altered in the next step.',
  rollAll:
    'If you want slightly more powerful heroes, you can roll all stats at once, and then assign the results to the stats in the way you see most favourable.',
  reroll:
    'You may make 2 rerolls in this process, including when rolling for Hit Points. You may never reroll a reroll, but you may choose the highest result.',
  specialisation:
    'Each hero gains an extra 15 points that may be distributed on their stats. However, no stat may have more than 10 points of these 15, so you must divide the points.',
  skills:
    'Each Skill is calculated as the skill’s basic stat plus a profession-specific modifier. ... A Skill Level can never be negative.',
  talentSkills:
    'Some Talents may also add to your Skill Values. In such cases, the Skill Level is increased, but the basic stat remains unchanged.',
  freeSkill:
    'You may choose one skill that has a negative modifier to improve. This Skill Value gains a modifier of +10.',
  mana: 'Mana is only used by wizards, and the starting mana is equal to the wizard’s WISx1,5.',
  damageBonus:
    'If your character has high STR or CON, there is a chance that he or she gains a Bonus to add to their character.',
  coins:
    'Apart from that, your hero starts with a pouch filled with 150 coins. You may choose to buy equipment using these coins before the game starts, or you may save them until after game has begun.',
  wear: 'Roll 1d4 for each piece of equipment and add that damage to the Character Sheet. A piece of equipment will always have at least 1 Point of Durability left.',
  buyBefore:
    'The benefit of doing this is that you do not need to roll on availability. We assume that over time, you have managed to acquire the things you are looking for. The downside is that you will need to roll for damage on all things that could potentially be damaged.',
  backpack: 'All heroes start the game with a small backpack, unless otherwise noted.',
  partyMorale:
    'To calculate the Party Morale (PM) you divide your RES by 10 and then drop the decimal. When all characters have done the same, you add it together to get your PM.',
  sanity: 'Your hero will start with a Sanity Value of 8.',
  luck: 'All non-halfling heroes start the game with 0 Luck.',
  energy: 'All heroes start with 1 point of energy unless otherwise noted.',
  level: 'The Start Level of your hero is 1 (Experience is 0 of course).',
  movement: 'All heroes start with movement of 4, and this is rarely changed.',
  background:
    'If you wish to add some extra spice to your characters, you can roll up a Background as described on page 40 and onwards.',
  durability:
    'This is not indicated in the Weapons Table, but all weapons have a Durability of 6, unless otherwise noted.',
  encumbrance:
    'The limit as to how much your heroes can carry with them equals the hero’s strength. If the total encumbrance exceeds the STR of your character, all skills and stats are at -10.',
  encumbranceCap: 'Your character can never carry more than STR+15 points of encumbrance.',
  rangerBow:
    'Designer ruling (FAQ; changelog 2.22 entry 2): a Dwarf or Halfling Ranger, who cannot use Longbows, takes a Shortbow instead.',
  warriorPriestEnergy: 'The Warrior Priest starts with 2 points of Energy.',
  jackOfAllTrades: 'Jack of all trades (roll for a Random Talent, from a chosen category).',
} as const;

/* ------------------------------------------------------------------------------------------
 * Glossary: the abbreviations and terms the sheet uses, each quoted from the corpus so a
 * player can tap any acronym and read the printed meaning (pinned by character-rules.test.ts).
 * ---------------------------------------------------------------------------------------- */
export interface Term {
  id: string;
  /** What the sheet prints, e.g. "CS". */
  abbr: string;
  name: string;
  text: string;
  cite: Cite;
  recordId: string;
}

const term = (
  id: string,
  abbr: string,
  name: string,
  text: string,
  page: number,
  pdf: number,
  heading: string,
  recordId: string,
): Term => ({
  id,
  abbr,
  name,
  text,
  cite: { page, pdf, heading, recordId },
  recordId,
});

/** Abbreviations and Terminology (pp. 14–15), the Character Basics (pp. 24–26) and the carry rules (p. 50). */
export const TERMS: readonly Term[] = [
  term(
    'ap',
    'AP',
    'Action Points',
    'Everything done inside a dungeon or on a skirmish battle map is performed by spending Action Points. This is true for both heroes and enemies. All models have 2 AP.',
    14,
    16,
    'AP',
    'term.action_points',
  ),
  term(
    'cs',
    'CS',
    'Combat Skill',
    'This is your skill in using close-combat weapons. Some weapons can be wielded one-handed, some only two-handed and some can be used with either one or two hands depending on your strength. Abbreviated CS.',
    26,
    28,
    'Combat Skill (DEX)',
    'character.skill.combat_skill',
  ),
  term('rs', 'RS', 'Ranged Skill', 'Ranged Skill.', 14, 16, 'RS', 'term.ranged_skill'),
  term(
    'dodge',
    'Dodge',
    'Dodge',
    'This is the ability to dodge a strike or an incoming arrow.',
    26,
    28,
    'Dodge (DEX)',
    'term.dodge',
  ),
  term(
    'pl',
    'PL',
    'Pick Locks',
    'This skill is used to open locked doors, chests, and also to disarm traps.',
    26,
    28,
    'Pick Locks (DEX)',
    'term.pick_locks',
  ),
  term(
    'barter',
    'Barter',
    'Barter',
    'This is your skill in making good deals when trading.',
    26,
    28,
    'Barter (WIS)',
    'term.barter',
  ),
  term(
    'heal',
    'Heal',
    'Heal',
    'This is your skill to mend wounds of your comrades.',
    26,
    28,
    'Heal (WIS)',
    'term.heal',
  ),
  term(
    'alch',
    'Alch',
    'Alchemy',
    'Alchemy is the skill to identify and mix potions.',
    26,
    28,
    'Alchemy (WIS)',
    'term.alchemy',
  ),
  term(
    'per',
    'PER',
    'Perception',
    'Perception is used to notice important details, like traps, or to find clues which will help you to solve riddles.',
    26,
    28,
    'Perception (WIS)',
    'term.perception',
  ),
  term(
    'aa',
    'AA',
    'Arcane Art',
    'This is the knowledge of everything magical, and only wizards may learn the Arcane Arts.',
    26,
    28,
    'Arcane Art (WIS)',
    'term.arcane_art',
  ),
  term(
    'forage',
    'Forage',
    'Foraging',
    'Foraging will allow you to gather food and hunt while on your way to a Quest Site (and back again).',
    26,
    28,
    'Foraging (CON)',
    'term.foraging',
  ),
  term(
    'bp',
    'BP',
    'Battle Prayers',
    'This is a special knowledge perfected by the Warrior Priests who call upon the gods to help them in battle.',
    26,
    28,
    'Battle Prayers (RES)',
    'term.battle_prayers',
  ),
  term(
    'hp',
    'HP',
    'Hit Points',
    'Hit Points. The amount of damage a character can sustain before they are knocked out.',
    14,
    16,
    'HP',
    'term.hit_points',
  ),
  term('db', 'DB', 'Damage Bonus', 'Damage Bonus.', 14, 16, 'DB', 'term.damage_bonus'),
  term(
    'na',
    'NA',
    'Natural Armour',
    'Natural Armour. Subtract from Damage.',
    14,
    16,
    'NA',
    'term.natural_armour',
  ),
  term(
    'def',
    'DEF',
    'Armour protection',
    'Armour protection value, including Natural armour.',
    14,
    16,
    'DEF',
    'term.armour_protection',
  ),
  term(
    'enc',
    'ENC',
    'Encumbrance',
    'Encumbrance. Indicates the weight of a piece of equipment.',
    14,
    16,
    'ENC',
    'term.encumbrance',
  ),
  term(
    'dur',
    'DUR',
    'Durability',
    'Durability. Defines the condition of a piece of equipment.',
    14,
    16,
    'DUR',
    'term.durability',
  ),
  term('dmg', 'DMG', 'Damage', 'Damage.', 14, 16, 'DMG', 'term.damage'),
  term('m', 'M', 'Movement', 'Movement in Squares.', 14, 16, 'M', 'term.movement'),
  term(
    'pm',
    'PM',
    'Party Morale',
    'Party Morale. If this reaches zero, your party will flee.',
    14,
    16,
    'PM',
    'term.party_morale',
  ),
  term(
    'xp',
    'XP',
    'Experience Points',
    'Experience Points.',
    15,
    17,
    'XP',
    'term.experience_points',
  ),
  term(
    'luck',
    'L',
    'Luck',
    'A hero can use one Luck Point to reroll a dice roll that directly affects them.',
    24,
    26,
    'Luck (L)',
    'term.luck',
  ),
  term(
    'energy',
    'E',
    'Energy',
    'This energy can be used to activate Perks during quests.',
    24,
    26,
    'Energy (E)',
    'term.energy',
  ),
  term(
    'sanity',
    'Sanity',
    'Sanity',
    'This is the mental status of your hero and as the game progresses, the Sanity of your hero will definitely decrease.',
    25,
    27,
    'Sanity',
    'term.sanity',
  ),
  term(
    'mana',
    'Mana',
    'Mana',
    'Mana is only used by wizards, and the starting mana is equal to the wizard’s WISx1,5.',
    27,
    29,
    'Mana',
    'term.mana',
  ),
  term(
    'cv',
    'CV',
    'Casting Value',
    'Casting Value. A modifier to subtract from a Wizard’s Arcane Arts Skill when casting a particular spell.',
    14,
    16,
    'CV',
    'term.casting_value',
  ),
  term(
    'mm',
    'MM',
    'Magic Missile',
    'Magic Missile. A magic spell emanating from the caster and flying towards the target.',
    14,
    16,
    'MM',
    'term.magic_missile',
  ),
  term(
    'q',
    'Q',
    'Quick Spell',
    'Quick Spell. A spell that only takes 1 AP to cast.',
    14,
    16,
    'Q',
    'term.quick_spell',
  ),
  term(
    't',
    'T',
    'Touch Spell',
    'Touch Spell. Requires the caster to touch its target for the spell to have effect.',
    15,
    17,
    'T',
    'term.touch_spell',
  ),
  term(
    'ml',
    'ML',
    'Magic Level',
    'Magic Level (The level of the caster).',
    14,
    16,
    'ML',
    'term.magic_level',
  ),
  term(
    'los',
    'LOS',
    'Line of Sight',
    'Line of Sight is used to determine if you can see unhindered from point A to point B. LOS is traced from the centre of the viewer’s square to the centre of the target square.',
    14,
    16,
    'LOS',
    'term.line_of_sight',
  ),
  term('zoc', 'ZOC', 'Zone of control', 'Zone of control.', 15, 17, 'ZOC', 'term.zone_of_control'),
  term(
    'apx',
    'AP(X)',
    'Armour Piercing',
    'Armour Piercing. Deduct the value X from the armour.',
    14,
    16,
    'AP(X)',
    'term.armour_piercing',
  ),
  term('tr', 'Tr', 'Throwable Potion', 'Throwable Potion.', 15, 17, 'Tr', 'term.throwable_potion'),
  term('rdd', 'RDD', 'Rounded Down', 'Rounded Down.', 14, 16, 'RDD', 'term.rounded_down'),
  term('rdu', 'RDU', 'Rounded Up', 'Rounded Up.', 14, 16, 'RDU', 'term.rounded_up'),
  term(
    'na_marker',
    'N/A',
    'Not Applicable',
    'Not Applicable.',
    14,
    16,
    'N/A',
    'term.not_applicable',
  ),
  term('c', 'c', 'Coins', 'Coins.', 14, 16, 'C', 'term.coins'),
  term(
    'skill_test',
    'Skill Test',
    'Skill Test',
    'A 1d100 test where a success is lower than or equal to the Skill Value.',
    15,
    17,
    'Skill Test',
    'term.skill_test',
  ),
  term(
    'stat',
    'Stat',
    'Stat',
    'This is an umbrella term for Strength, Dexterity, Wisdom, Resolve, and Constitution',
    15,
    17,
    'Stat',
    'term.stat',
  ),
  term(
    'skill',
    'Skill',
    'Skill',
    'Knowledge that requires a Skill Test to use.',
    15,
    17,
    'Skill',
    'term.skill',
  ),
  term(
    'talent',
    'Talent',
    'Talent',
    'Special Knowledge that is always active.',
    15,
    17,
    'Talent',
    'term.talent',
  ),
  term(
    'perk',
    'Perk',
    'Perk',
    'Special knowledge that requires energy to activate.',
    14,
    16,
    'Perk',
    'term.perk',
  ),
  term(
    'trait',
    'Trait',
    'Trait',
    'Traits are basically talents, but they are tied to a species.',
    25,
    27,
    'Traits',
    'term.trait',
  ),
  term(
    'quick_slot',
    'Quick Slot',
    'Quick Slots',
    'Items that your hero wishes to carry close at hand are said to be in Quick Slots.',
    50,
    52,
    'Carrying Equipment',
    'term.quick_slot',
  ),
];

export const TERM_BY_ABBR: ReadonlyMap<string, Term> = new Map(TERMS.map((t) => [t.abbr, t]));
export const TERM_BY_ID: ReadonlyMap<string, Term> = new Map(TERMS.map((t) => [t.id, t]));

/** What each basic stat is for, from the Character Basics (p. 24). */
export const STAT_EFFECTS: Record<StatKey, { text: string; recordId: string; cite: Cite }> = {
  str: {
    text: 'This is your hero’s physical strength. This affects how much your character can carry. Also, a strong character can deal more damage to their enemies. Strength will also affect what kind of weapons your hero may wield.',
    recordId: 'character.stat.strength.effects',
    cite: {
      page: 24,
      pdf: 26,
      heading: 'Strength (STR)',
      recordId: 'character.stat.strength.effects',
    },
  },
  con: {
    text: 'This symbolises how fit your hero is and how well they can withstand diseases and poison. A high constitution will also allow the hero to take more damage.',
    recordId: 'character.stat.constitution.effects',
    cite: {
      page: 24,
      pdf: 26,
      heading: 'Constitution (CON)',
      recordId: 'character.stat.constitution.effects',
    },
  },
  dex: {
    text: 'As the name implies, this is how dexterous your hero is. The more dexterous, the more likely they will dodge an incoming strike or jump across that chasm that just appeared in the floor.',
    recordId: 'character.stat.dexterity.effects',
    cite: {
      page: 24,
      pdf: 26,
      heading: 'Dexterity (DEX)',
      recordId: 'character.stat.dexterity.effects',
    },
  },
  wis: {
    text: 'Wisdom governs your abilities to analyse things, but is also important for dealing with Magic and Alchemy. Mana is equal to WISx1,5.',
    recordId: 'character.stat.wisdom.effects',
    cite: { page: 24, pdf: 26, heading: 'Wisdom (WIS)', recordId: 'character.stat.wisdom.effects' },
  },
  res: {
    text: 'This is the mental strength of your character, and it is a measure of how well they can handle fear. In addition, it symbolises their faith in the gods.',
    recordId: 'character.stat.resolve.effects',
    cite: {
      page: 24,
      pdf: 26,
      heading: 'Resolve (RES)',
      recordId: 'character.stat.resolve.effects',
    },
  },
};

/* ------------------------------------------------------------------------------------------
 * Equipment special rules, printed under the Weapons and Armour tables.
 * ---------------------------------------------------------------------------------------- */
export interface SpecialRule {
  /** The word as it appears in a Special column, e.g. "BFO". */
  key: string;
  name: string;
  text: string;
  recordId: string;
  cite: Cite;
}

const special = (
  key: string,
  name: string,
  text: string,
  recordId: string,
  page: number,
  pdf: number,
  heading: string,
): SpecialRule => ({
  key,
  name,
  text,
  recordId,
  cite: { page, pdf, heading, recordId },
});

export const WEAPON_SPECIALS: readonly SpecialRule[] = [
  special(
    'AP',
    'AP (X)',
    'Armour piercing. Ignores X points of armour.',
    'combat.weapon.special.ap_x',
    177,
    179,
    'Weapons',
  ),
  special(
    'BFO',
    'BFO (Built for offence)',
    'These are not optimal to parry with and suffer a -5 to CS while parrying. This is cumulative with the Slow Special Rule.',
    'combat.weapon.special.bfo_built_for_offence',
    177,
    179,
    'Weapons',
  ),
  special(
    'Defensive',
    'Defensive',
    'This weapon is easy to use defensively and receives +10 when parrying. However, it cannot withstand as much punishment as a good sword, and therefore can only take 4 Points of Damage before it breaks.',
    'combat.weapon.special.defensive',
    177,
    179,
    'Weapons',
  ),
  special(
    'Dual Wield',
    'Dual wield +X',
    'These weapons can be used in the offhand if your hero has the Dual Wielding Skill. The X indicates the extra DMG caused during a successful attack.',
    'combat.weapon.special.dual_wield_x',
    177,
    179,
    'Weapons',
  ),
  special(
    'Ensnare',
    'Ensnare',
    'If this weapon hits, the target is trapped in the net and must spend 1 action to get free with a successful DEX Test. Until freed, this is the only action it can do. A net can be used once per battle and is retrieved automatically after the battle.',
    'combat.weapon.special.ensnare',
    177,
    179,
    'Weapons',
  ),
  special(
    'Fast',
    'Fast',
    'Weapon may be used to parry once per turn even though the hero did not choose the Parry Stance, but the weapon is damaged on 90-00.',
    'combat.weapon.special.fast',
    177,
    179,
    'Weapons',
  ),
  special(
    'Reach',
    'Reach',
    'May attack at a range of 2 squares, even if there is a friendly character in the square in between.',
    'combat.weapon.special.reach',
    177,
    179,
    'Weapons',
  ),
  special(
    'Secondary Weapon',
    'Secondary Weapon',
    'This weapon may be used in your hero’s offhand while carrying a hand weapon in the primary hand. Firing this weapon may be done in the same action as moving (-10) or at a target adjacent to the firer. It cannot be reloaded while wielded as a secondary weapon.',
    'combat.weapon.special.secondary_weapon',
    177,
    179,
    'Weapons',
  ),
  special(
    'Slow',
    'Slow',
    'Weapon is heavy and difficult to parry with. -5 chance to parry.',
    'combat.weapon.special.slow',
    177,
    179,
    'Weapons',
  ),
  special(
    'Stun',
    'Stun',
    'This weapon has a chance to put the enemy off balance. If you roll an even number when rolling to damage, the enemy loses one action next turn. This does not stack.',
    'combat.weapon.special.stun',
    177,
    179,
    'Weapons',
  ),
  special(
    'Unwieldy',
    'Unwieldy',
    'Wielding these weapons is tiring and the +X damage only applies to the first hit in every battle.',
    'combat.weapon.special.unwieldy',
    177,
    179,
    'Weapons',
  ),
  special(
    'Requires STR',
    'Requires STR 55',
    'Requires STR 55, AP (2)',
    'character.equipment.weapon.arbalest_strength',
    177,
    179,
    'Weapons',
  ),
];

export const ARMOUR_SPECIALS: readonly SpecialRule[] = [
  special(
    'Stackable',
    'Stackable',
    'This armour can be combined with ONE armour of a different tier that also have the stackable special rule. However, this impedes your Dexterity (-10 DEX). This effect on DEX is not cumulative if you stack armour in different hit zones. Cloaks can be worn even if the hero is already using stacked armour (for example a mail shirt on top of a padded jacket). Durability is only subtracted from the outer layer of armour and the highest tier is always the outer layer.',
    'character.equipment.armour.stackable',
    178,
    180,
    'Armour',
  ),
  special(
    'Clunky',
    'Clunky',
    'This armour offers good protection, but moving effectively is difficult, giving your hero a -10 DEX. This is not cumulative with other pieces of armour that are also clunky.',
    'character.equipment.armour.clunky',
    178,
    180,
    'Armour',
  ),
  special(
    'Huge',
    'Huge',
    'This shield is so huge, that it is almost impossible to strike someone behind it. It gives +10 CS when parrying with it against strikes and missiles from Ranged Weapons. Although it’s class 5, it does not require 2 hands.',
    'character.equipment.shield.huge',
    178,
    180,
    'Shields',
  ),
];

export const SPECIAL_BY_KEY: ReadonlyMap<string, SpecialRule> = new Map(
  [...WEAPON_SPECIALS, ...ARMOUR_SPECIALS].map((s) => [s.key, s]),
);

/** Splits a printed Special cell into the rule keys it names, keeping the printed fragments. */
export function specialParts(printed: string): { text: string; rule: SpecialRule | null }[] {
  if (!printed || printed === '-') return [];
  return printed.split(',').map((part) => {
    const text = part.trim();
    const rule = [...SPECIAL_BY_KEY.values()].find((s) => text.startsWith(s.key)) ?? null;
    return { text, rule };
  });
}

/* ------------------------------------------------------------------------------------------
 * Shields (Armour and Shields table 2, p. 178).
 * ---------------------------------------------------------------------------------------- */
export interface Shield {
  /** Row id in table.equipment.shields. */
  id: string;
  name: string;
  def: number;
  shieldClass: number;
  enc: number;
  special: string;
  cost: number;
  costPrinted: string;
  durability: number;
}

const sh = (
  id: string,
  name: string,
  def: number,
  shieldClass: number,
  enc: number,
  special: string,
  costPrinted: string,
): Shield => ({
  id,
  name,
  def,
  shieldClass,
  enc,
  special,
  cost: Number(costPrinted.replace(' c', '')),
  costPrinted,
  durability: CREATION.standardDurability,
});

export const SHIELDS: readonly Shield[] = [
  sh('buckler', 'Buckler', 4, 1, 4, '-', '20 c'),
  sh('heater_shield', 'Heater Shield', 6, 3, 10, '-', '100 c'),
  sh('tower_shield', 'Tower Shield', 8, 5, 15, 'Huge', '200 c'),
];
export const SHIELD_BY_ID: ReadonlyMap<string, Shield> = new Map(SHIELDS.map((s) => [s.id, s]));

/* ------------------------------------------------------------------------------------------
 * General equipment (Appendix III, pp. 179–183): what a hero buys before the first quest.
 * ENC prints as "1", "-", "1/3" or "-/1": the number before the slash is the weight, the number
 * after it is how many fit in one Quick Slot (character.equipment.quick_slot_stack).
 * ---------------------------------------------------------------------------------------- */
export type GearGroup = 'light' | 'consumable' | 'tool' | 'misc' | 'alchemy' | 'jewellery';

export interface Gear {
  /** Row id in the group's table. */
  id: string;
  group: GearGroup;
  name: string;
  encPrinted: string;
  enc: number;
  /** How many fit in one Quick Slot, when the ENC cell prints "/X". */
  stack: number | null;
  durPrinted: string;
  durability: number | null;
  special: string;
  costPrinted: string;
  /** Null when the cell prints two prices; see `costChoices`. */
  cost: number | null;
  costChoices?: { label: string; cost: number }[];
  availability: number;
}

export const GEAR_GROUPS: Record<GearGroup, { label: string; tableId: string; cite: Cite }> = {
  light: {
    label: 'Light sources',
    tableId: 'table.equipment.light_sources',
    cite: {
      page: 181,
      pdf: 183,
      heading: 'Light sources',
      recordId: 'table.equipment.light_sources',
    },
  },
  consumable: {
    label: 'Consumables',
    tableId: 'table.equipment.consumables',
    cite: { page: 180, pdf: 182, heading: 'Consumables', recordId: 'table.equipment.consumables' },
  },
  tool: {
    label: 'Tools',
    tableId: 'table.equipment.tools',
    cite: { page: 183, pdf: 185, heading: 'Tools', recordId: 'table.equipment.tools' },
  },
  misc: {
    label: 'Miscellaneous',
    tableId: 'table.equipment.miscellaneous',
    cite: {
      page: 182,
      pdf: 184,
      heading: 'Miscellaneous',
      recordId: 'table.equipment.miscellaneous',
    },
  },
  alchemy: {
    label: 'Alchemy',
    tableId: 'table.equipment.alchemy',
    cite: { page: 179, pdf: 181, heading: 'Alchemy', recordId: 'table.equipment.alchemy' },
  },
  jewellery: {
    label: 'Jewellery',
    tableId: 'table.equipment.jewellery',
    cite: { page: 180, pdf: 182, heading: 'Jewellery', recordId: 'table.equipment.jewellery' },
  },
};

function parseEnc(printed: string): { enc: number; stack: number | null } {
  const [weight, per] = printed.split('/');
  const enc = weight === undefined || weight === '-' ? 0 : Number(weight);
  const stack = per === undefined ? null : Number(per);
  return {
    enc: Number.isFinite(enc) ? enc : 0,
    stack: stack !== null && Number.isFinite(stack) ? stack : null,
  };
}

const g = (
  group: GearGroup,
  id: string,
  name: string,
  encPrinted: string,
  durPrinted: string,
  special: string,
  costPrinted: string,
  availability: number,
  costChoices?: { label: string; cost: number }[],
): Gear => {
  const { enc, stack } = parseEnc(encPrinted);
  const gear: Gear = {
    id,
    group,
    name,
    encPrinted,
    enc,
    stack,
    durPrinted,
    durability: durPrinted === '-' ? null : Number(durPrinted),
    special,
    costPrinted,
    cost: /^\d+ c$/.test(costPrinted) ? Number(costPrinted.replace(' c', '')) : null,
    availability,
  };
  if (costChoices) gear.costChoices = costChoices;
  return gear;
};

export const GEAR: readonly Gear[] = [
  g('light', 'headlamp', 'Headlamp', '1', '1', '', '150 c', 3),
  g('light', 'lamp_oil', 'Lamp Oil', '-/1', '1', 'Enough oil to refill a lantern once.', '15 c', 5),
  g(
    'light',
    'lantern_filled_with_oil',
    'Lantern (filled with oil)',
    '1',
    '1',
    'The light projected by the lantern helps strengthen the resolve of your party. See separate note on lantern.',
    '100 c',
    4,
  ),
  g(
    'light',
    'torch',
    'Torch',
    '1',
    '1',
    'The light projected by a torch helps strengthen the resolve of your party. See separate note on torch.',
    '15 c',
    5,
  ),

  g(
    'consumable',
    'beef_jerky',
    'Beef Jerky',
    '-/3',
    '1',
    'Eating a snack like this takes 1 AP and heals 1 HP.',
    '10 c',
    5,
  ),
  g(
    'consumable',
    'dwarven_ale',
    'Dwarven Ale',
    '2/1',
    '1',
    'Famous liquid courage. If your hero drinks this, all stat and skill tests are at -10, except RES at +20 for the rest of the quest.',
    '100 c',
    2,
  ),
  g(
    'consumable',
    'ration',
    'Ration',
    '1/1',
    '1',
    'Rations are used during overland travel and during short rests. 1 Ration can sustain the entire party for one day or one rest.',
    '5 c',
    5,
  ),
  g(
    'consumable',
    'tobacco',
    'Tobacco',
    '-/1',
    '-',
    'Tobacco will help calm the nerves, but there is always the risk of becoming addicted. See separate note on tobacco.',
    '50 c',
    4,
  ),

  g(
    'tool',
    'armour_repair_kit',
    'Armour Repair Kit',
    '5',
    '-',
    'This kit can be used to repair armour during a short rest. It will repair 1d3 durability of each of your hero’s equipped pieces of armour. Roll separately. Once done, the kit is exhausted and removed.',
    '200 c',
    4,
  ),
  g(
    'tool',
    'cooking_gear',
    'Cooking Gear',
    '3',
    '-',
    'Cooking gear helps make those rations a bit tastier. Rations cooked using this will heal an additional +3 HP. One set of cooking gear is enough for the entire party.',
    '100 c',
    4,
  ),
  g(
    'tool',
    'crowbar',
    'Crowbar',
    '10',
    '6',
    'Inflicts 8+DB Hit Points when breaking down a door, and only increases Threat Level +1.',
    '55 c',
    3,
  ),
  g(
    'tool',
    'dwarven_pickaxe',
    'Dwarven Pickaxe',
    '8',
    '6',
    'A finely crafted pickaxe. Lighter, yet stronger than ordinary pickaxes.',
    '225 c',
    2,
  ),
  g(
    'tool',
    'fishing_gear',
    'Fishing Gear',
    '3',
    '-',
    'A good fishing rod always makes life better. With this, a hero’s Foraging Skill increases by +5.',
    '40 c',
    5,
  ),
  g(
    'tool',
    'lockpicks_5',
    'Lockpicks (5)',
    '-/10',
    '1',
    'Necessary to use the Pick Lock Skill, but can also be used to disarm traps. If damaged, only 1 pick is destroyed.',
    '30 c',
    3,
  ),
  g('tool', 'pickaxe', 'Pickaxe', '10', '-', 'Can be used to remove rubble.', '175 c', 3),
  g(
    'tool',
    'rope_old',
    'Rope (old)',
    '2/1',
    '1',
    'A piece of rope may help you out of that pit you happened to trip into. When used, roll 1d6. On a result of 5-6, the rope breaks and the hero falls down taking 1d6 wounds.',
    '20 c',
    5,
  ),
  g(
    'tool',
    'rope',
    'Rope',
    '2/1',
    '1',
    'A piece of rope may help you out of that pit you happened to trip into.',
    '50 c',
    4,
  ),
  g(
    'tool',
    'trap_disarming_kit',
    'Trap Disarming Kit',
    '5/1',
    '6',
    '+10 when disarming traps.',
    '200 c',
    3,
  ),
  g(
    'tool',
    'whetstone',
    'Whetstone',
    '1/1',
    '-',
    'During a short rest, you are able to touch up your weapon. Repair close-combat weapons with 1d3 Points of Durability. 3 uses per stone.',
    '100 c',
    4,
  ),

  g(
    'misc',
    'backpack_medium',
    'Backpack - Medium',
    '-',
    '-',
    'This backpack increases the carrying capacity of a hero by 10 ENC points, but decreases DEX by -5.',
    '350 c',
    4,
  ),
  g(
    'misc',
    'backpack_large',
    'Backpack - Large',
    '-',
    '-',
    'This backpack increases the carrying capacity of a hero by 25 ENC points, but decreases DEX by -10.',
    '600 c',
    3,
  ),
  g(
    'misc',
    'bandage_old_rags',
    'Bandage (old rags)',
    '1',
    '1',
    'Necessary when using the Heal Skill. Heals 1d4 Hit Points. This is a bundle with enough rags to bandage 3 times.',
    '15 c',
    5,
  ),
  g(
    'misc',
    'bandage_linen',
    'Bandage (linen)',
    '1/3',
    '1',
    'Necessary when using the Heal Skill. Heals 1d8 Hit Points.',
    '25 c',
    4,
  ),
  g(
    'misc',
    'bandage_herbal_wrap',
    'Bandage (Herbal wrap)',
    '1/3',
    '1',
    'Necessary when using the Heal Skill. Gives Heal skill +15 and heals 1d10 Hit Points.',
    '50 c',
    4,
  ),
  g(
    'misc',
    'bed_roll',
    'Bed Roll',
    '5',
    '-',
    'The short rests you take are way more comfortable with a bed roll. You automatically regain all Energy Points.',
    '200 c',
    3,
  ),
  g(
    'misc',
    'combat_harness',
    'Combat Harness',
    '-',
    '6',
    'This increases your Quick Slots from 3 to 5. Any hit that damages a piece of equipment in the harness also damage the harness.',
    '500 c',
    2,
  ),
  g(
    'misc',
    'extended_battle_belt',
    'Extended Battle Belt',
    '-',
    '6',
    'This increases your Quick Slots from 3 to 4. Any hit that damages a piece of equipment in the belt also damages the belt.',
    '300 c',
    3,
  ),
  g(
    'misc',
    'holy_water',
    'Holy Water',
    '-/1',
    '1',
    'This can be thrown in the same way as throwing a potion, but you can also dip 5 arrows into it. If thrown, it causes 1d3 Hit Points to any undead, but only in the square it hits. Projectiles dipped add +1 DMG to all Undead (treated as non-mundane weapons as well).',
    '25 c',
    3,
  ),
  g(
    'misc',
    'iron_wedges',
    'Iron Wedges',
    '4/1',
    '6',
    'These can be used to block a door and require 1 AP plus 1 AP for closing the door to use. Any enemy (wandering monster or monster already on the table) will need 6 AP to pass the door. Enough for 2 doors. They can also be used to bar a door during rest. See page 98 for rules on this.',
    '50 c',
    4,
  ),
  g('misc', 'parchment', 'Parchment', '-/1', '-', 'Necessary to make magic scrolls.', '50 c', 4),
  g('misc', 'partial_map', 'Partial Map', '-/1', '-', 'See separate description.', '75 c', 4),

  g(
    'alchemy',
    'alchemist_belt',
    'Alchemist Belt',
    '-',
    '6',
    'This lets you store 6 potions or vials in ready slots, on top of the ordinary ready slots. Any hit that strikes a potion in the belt will also damage the belt by 1 point.',
    '300 c',
    3,
  ),
  g(
    'alchemy',
    'alchemist_tool',
    'Alchemist Tool',
    '5/1',
    '6',
    'Necessary to harvest parts and ingredients.',
    '200 c',
    3,
  ),
  g(
    'alchemy',
    'empty_bottle',
    'Empty Bottle',
    '-/1',
    '1',
    'Necessary if you want to mix new potions.',
    '10 c',
    5,
  ),
  g(
    'alchemy',
    'healing_potion',
    'Healing Potion',
    '1/1',
    '1',
    'Available at Weak or Standard level (1d4/1d6 healing)',
    '75/100 c',
    4,
    [
      { label: 'Weak (1d4)', cost: 75 },
      { label: 'Standard (1d6)', cost: 100 },
    ],
  ),
  g(
    'alchemy',
    'potion_of_cure_disease',
    'Potion of Cure Disease',
    '1/1',
    '1',
    'Removes all effects of disease.',
    '125 c',
    3,
  ),
  g(
    'alchemy',
    'potion_of_cure_disease_weak',
    'Potion of Cure Disease (Weak)',
    '1/1',
    '1',
    '75% chance to remove all effects of disease.',
    '90 c',
    3,
  ),
  g(
    'alchemy',
    'potion_of_cure_poison',
    'Potion of Cure Poison',
    '1/1',
    '1',
    'Removes all effects of poison',
    '125 c',
    3,
  ),
  g(
    'alchemy',
    'potion_of_cure_poison_weak',
    'Potion of Cure Poison (Weak)',
    '1/1',
    '1',
    '75% chance to remove all effects of poison',
    '90 c',
    3,
  ),

  g('jewellery', 'necklace', 'Necklace', '-', '-', 'Can be enchanted.', '150 c', 4),
  g(
    'jewellery',
    'religious_relic_necklace',
    'Religious Relic (Necklace)',
    '-',
    '-',
    'Can be used by a Warrior Priest. See table under ‘Treasures’ chapter for variants.',
    '500 c',
    2,
  ),
  g(
    'jewellery',
    'religious_relic_ring',
    'Religious Relic (Ring)',
    '-',
    '-',
    'Can be used by a Warrior Priest. See table under ‘Treasures’ chapter for variants.',
    '500 c',
    2,
  ),
  g('jewellery', 'ring', 'Ring', '-', '-', 'Can be enchanted.', '150 c', 4),
];
export const GEAR_BY_ID: ReadonlyMap<string, Gear> = new Map(GEAR.map((item) => [item.id, item]));

/* ------------------------------------------------------------------------------------------
 * Carrying equipment (pp. 50–51) and the Hit Area table (p. 119) the loadout is drawn from.
 * ---------------------------------------------------------------------------------------- */
export const CARRY = {
  quickSlots: 3,
  quickSlotsText:
    'Each hero has 3 Quick Slots as standard. You may place any item except armour in a Quick Slot, such as a bow, a potion, or a bandage.',
  quickSlotsRecord: 'character.equipment.quick_slots',
  quickAccessText:
    'Accessing these items is quick, and can also be done during battle. However, equipment in the Quick Slots can be damaged during battle.',
  quickAccessRecord: 'character.equipment.quick_access',
  backpackText:
    'Equipment placed in a Backpack cannot be accessed during battle, but on the other hand, this equipment cannot be damaged during the fight either.',
  backpackRecord: 'character.equipment.backpack',
  handsText: 'Objects held in the hands of a hero are always at the ready.',
  handsRecord: 'character.equipment.hands',
  stackText:
    'If a piece of equipment has a /X in the ENC column, your hero can store X number of that piece of equipment in one quick slot.',
  stackRecord: 'character.equipment.quick_slot_stack',
  stackedArmourText:
    'Some armour has the ‘Stackable’ special rule. Two pieces of different tiers may be used on top of each other, with the higher tier worn as the outer layer. The DEF value is then added together. The outer armour is the only one that loses Durability.',
  stackedArmourRecord: 'character.equipment.stacked_armour',
  /** Extra Quick Slots printed on the Miscellaneous table. */
  extraSlots: { extended_battle_belt: 1, combat_harness: 2 } as Record<string, number>,
  /** Carrying capacity and DEX printed on the Miscellaneous table. */
  backpacks: {
    backpack_medium: { capacity: 10, dex: -5 },
    backpack_large: { capacity: 25, dex: -10 },
  } as Record<string, { capacity: number; dex: number }>,
  stackableDex: -10,
  clunkyDex: -10,
  encumbrancePenalty: -10,
} as const;

export type BodyArea = 'head' | 'arms' | 'torso' | 'legs';
export const BODY_AREAS: readonly { id: BodyArea; label: string; roll: string; rowId: string }[] = [
  { id: 'head', label: 'Head', roll: '1', rowId: 'row_1' },
  { id: 'arms', label: 'Arms', roll: '2', rowId: 'row_2' },
  { id: 'torso', label: 'Torso', roll: '3-5', rowId: 'row_3' },
  { id: 'legs', label: 'Legs', roll: '6', rowId: 'row_4' },
];

/** Which Hit Area rows a printed Covers cell names ("Arms, Torso"; "Torso (only back)"; "Dog"). */
export function coveredAreas(covers: string): BodyArea[] {
  const lower = covers.toLowerCase();
  return BODY_AREAS.filter((area) => lower.includes(area.id)).map((area) => area.id);
}

/* ------------------------------------------------------------------------------------------
 * The Alchemist's starting kit draws on three Appendix V tables (pp. 195–196).
 * ---------------------------------------------------------------------------------------- */
export interface Potion {
  /** Row id in table.alchemy.standard. */
  rowId: string;
  name: string;
  cost: number;
}
export const STANDARD_POTIONS: readonly Potion[] = [
  { rowId: 'row_1', name: 'Bottle of Experience', cost: 350 },
  { rowId: 'row_2', name: 'Potion of Constitution', cost: 100 },
  { rowId: 'row_3', name: 'Potion of Courage', cost: 100 },
  { rowId: 'row_4', name: 'Potion of Dexterity', cost: 100 },
  { rowId: 'row_5', name: 'Potion of Energy', cost: 100 },
  { rowId: 'row_6', name: 'Potion of Health', cost: 100 },
  { rowId: 'row_7', name: 'Potion of Mana', cost: 100 },
  { rowId: 'row_8', name: 'Potion of Strength', cost: 100 },
  { rowId: 'row_9', name: 'Potion of Wisdom', cost: 100 },
  { rowId: 'row_10', name: 'Acidic Bomb', cost: 90 },
  { rowId: 'row_11', name: 'Potion of Disorientation', cost: 90 },
  { rowId: 'row_12', name: 'Firebomb', cost: 90 },
  { rowId: 'row_13', name: 'Vial of Invisibility', cost: 100 },
  { rowId: 'row_14', name: 'Vial of Corrosion', cost: 60 },
  { rowId: 'row_15', name: 'Potion of Cure Disease', cost: 100 },
  { rowId: 'row_16', name: 'Potion of Cure Poison', cost: 100 },
  { rowId: 'row_17', name: 'Poison', cost: 80 },
  { rowId: 'row_18', name: 'Liquid Fire', cost: 80 },
  { rowId: 'row_19', name: 'Bottle of the Void', cost: 80 },
  { rowId: 'row_20', name: 'Weapons Oil', cost: 80 },
  { rowId: 'row_21', name: 'Elixir of Speed', cost: 80 },
  { rowId: 'row_22', name: 'Alchemical Dust', cost: 60 },
  { rowId: 'row_23', name: 'Elixir of the Archer', cost: 80 },
  { rowId: 'row_24', name: 'Potion of Rage', cost: 100 },
  { rowId: 'row_25', name: 'Potion of Fire protection', cost: 80 },
  { rowId: 'row_26', name: 'Potion of Dragon Skin', cost: 150 },
  { rowId: 'row_27', name: 'Potion of Restoration', cost: 200 },
  { rowId: 'row_28', name: 'Potion of Dragon Breath', cost: 100 },
  { rowId: 'row_29', name: 'Potion of Smoke', cost: 100 },
];

/** Table of Ingredients, 1d20, in roll order. */
export const INGREDIENTS: readonly string[] = [
  'Lunarberry',
  'Dragon Stalk',
  'Ember bark',
  'Mountain Barberry',
  'Salty Wyrmwood',
  'Ashen Ginger',
  'Spicy Windroot',
  'Wintercress',
  'Sweet Ivy',
  'Monk’s Laurel',
  'Nightshade',
  'Weeping Clover',
  'Snakeberry',
  'Bitterweed',
  'Arching Pokeroot',
  'Toxic Hogweed',
  'Blue Coneflower',
  'Giant Raspberry',
  'Bright Gallberry',
  'Barbed Wormwood',
];

export interface Part {
  rowId: string;
  group: number;
  roll: number;
  name: string;
}
const partNames = [
  'Amphibian skin',
  'Bat wings',
  'Beast heart',
  'Bonemeal',
  'Brain tissue',
  'Chitin',
  'Cyclops eye¹',
  'Dragon blood',
  'Ectoplasm',
  'Elf hair',
  'Feathers',
  'Fur',
  'Ghoul blood',
  'Goblin Eye',
  'Human blood',
  'Medusas eye',
  'Mummy dust',
  'Nails',
  'Ogre teeth',
  'Rat tail',
  'Scales',
  'Shapeshifter blood¹',
  'Slime',
  'Spider fang',
  'Spirit wood',
  'Spores¹',
  'Tongue',
  'Troll blood',
  'Vampire blood',
  'Zombie skin',
];
/** Table of Parts: 1d3 picks the column, 1d10 the row. */
export const PARTS: readonly Part[] = partNames.map((name, i) => ({
  rowId: `row_${i + 1}`,
  group: Math.floor(i / 10) + 1,
  roll: (i % 10) + 1,
  name,
}));

/* ------------------------------------------------------------------------------------------
 * After creation: the party, the first quest and the next level (pp. 17, 57, 58).
 * ---------------------------------------------------------------------------------------- */
export const PARTY = {
  designedSize: 4,
  designedSizeText:
    'The game is designed to be played with 4 characters. You may, of course, go for fewer or more heroes, but that will change the balance of the game accordingly, and you may decide to change some of the game parameters to counter this.',
  designedSizeRecord: 'core.difficulty.party_size',
  repeatText:
    'If you have enough characters, you are now ready to start playing. If so, head to the ‘Embarking on your First Quest’ chapter on page 57. Otherwise, repeat the process until you have enough characters.',
  repeatRecord: 'character.creation.repeat_until_party',
  startSettlementText:
    'When you start the game, you should randomise what settlement the party is in. The eligible ones are:',
  startSettlementRecord: 'core.quest.start_settlement',
  firstQuestsText:
    'If this is the first time you play the game, I would recommend playing the ‘First Blood’ quest first. Then, as the second quest, I would go for ‘Spring Cleaning’, which is the first quest of the Rising Dead Campaign. It is available at any settlement. You will find both these quests in the Quest Book I at the end of this book.',
  firstQuestsRecord: 'core.quest.first_quests',
  /** Level 2 on the Levelling Up table. */
  nextLevelXp: 2000,
  nextLevelRecord: 'table.character.level_progression',
} as const;

/** Start settlement list, numbered 1–8 (the book names no die). */
export const START_SETTLEMENTS: readonly { rowId: string; number: number; name: string }[] = [
  { rowId: 'caelkirk', number: 1, name: 'Caelkirk' },
  { rowId: 'irondale', number: 2, name: 'Irondale' },
  { rowId: 'windfair', number: 3, name: 'Windfair' },
  { rowId: 'whiteport', number: 4, name: 'Whiteport' },
  { rowId: 'rochdale', number: 5, name: 'Rochdale' },
  { rowId: 'coalfell', number: 6, name: 'Coalfell' },
  { rowId: 'freyfell', number: 7, name: 'Freyfell' },
  { rowId: 'reroll', number: 8, name: 'Re-roll.' },
];

/** Where the book is silent; each is shown as a purple gap note, never filled in. */
export const GAPS = {
  randomTalentDie:
    'The book names no die for the random talent. The app picks one entry of the chosen category at random; rolling your own die over the printed table is just as good.',
  randomTalentIneligible:
    'The book does not say what an ineligible random talent means; roll again or agree at the table.',
  manaRounding: 'WIS × 1.5 is not a whole number here. The book does not say how to round it.',
  backgroundDie:
    'The chapter numbers its twenty Backgrounds 1–20. The corpus has not extracted the chapter’s intro, so the die it names is not pinned here; a d20 over the numbered list matches the count.',
  wearScope:
    'The book says “all things that could potentially be damaged”. Weapons, armour and shields always get a wear roll here; other gear with a printed DUR is offered one, and the table decides.',
  thresholds:
    'The Damage Bonus and Natural Armour tables print thresholds only; this helper reads each row as “at or above”. The book does not spell that out.',
  startSettlementDie: 'The list is printed as numbered entries 1 to 8; the book names no die.',
  statMaxima:
    'The Levelling Up table states species maxima for advancement; it does not say creation is capped. Recorded here, not enforced.',
  loadout:
    'Where each item is carried (hands, Quick Slot, backpack) is the player’s call; the suggestion below follows the carry rules and can be changed by tapping an item.',
} as const;
