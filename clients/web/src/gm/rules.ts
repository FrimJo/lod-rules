/**
 * Rulebook facts the Game Master's table runs on. Every fact carries the page it was read
 * from and, where the corpus has one, the record id. `tests/gm-rules.test.ts` checks these
 * values against the corpus so the table cannot drift from the book. Nothing here is
 * invented: where the corpus has not extracted a rule yet (the Threat tables on p. 89, the
 * effects of darkness) the table says so and asks the Game Master instead.
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
  turnSequence: {
    page: 18,
    pdf: 20,
    heading: 'Turn Sequence',
    recordId: 'procedure.dungeon_turn',
  },
  complexity: {
    page: 19,
    pdf: 21,
    heading: 'Complexity',
    recordId: 'core.optional.scenario_and_threat',
  },
  sanity: { page: 53, pdf: 55, heading: 'Sanity', recordId: 'table.psychology.sanity_losses' },
  sanityConditions: {
    page: 53,
    pdf: 55,
    heading: 'Conditions',
    recordId: 'procedure.sanity_condition',
  },
  miscastRuling: {
    page: 53,
    pdf: 55,
    heading: 'Sanity',
    recordId: 'character.sanity.loss.miscast',
  },
  mentalConditions: {
    page: 55,
    pdf: 57,
    heading: 'Psychology table',
    recordId: 'table.psychology.mental_conditions',
  },
  jumpy: { page: 55, pdf: 57, heading: 'Psychology table', recordId: 'character.condition.jumpy' },
  acuteStress: {
    page: 55,
    pdf: 57,
    heading: 'Mental conditions table',
    recordId: 'procedure.acute_stress',
  },
  partyMorale: {
    page: 56,
    pdf: 58,
    heading: 'Party Morale',
    recordId: 'table.psychology.morale_adjustments',
  },
  moraleWavering: {
    page: 56,
    pdf: 58,
    heading: 'Party Morale',
    recordId: 'character.morale.wavering',
  },
  moraleFlee: { page: 56, pdf: 58, heading: 'Party Morale', recordId: 'character.morale.flee' },
  moraleCalculation: {
    page: 56,
    pdf: 58,
    heading: 'Party Morale',
    recordId: 'character.morale.member_contribution',
  },
  initialSetup: {
    page: 86,
    pdf: 88,
    heading: 'Initial Setup',
    recordId: 'procedure.initial_setup',
  },
  scenarioDie: {
    page: 88,
    pdf: 89,
    heading: 'The Scenario Die',
    recordId: 'procedure.scenario_die',
  },
  threatLevel: {
    page: 88,
    pdf: 89,
    heading: 'The Threat Level',
    recordId: 'procedure.threat_roll',
  },
  threatIncrease: {
    page: 88,
    pdf: 89,
    heading: 'Increasing Threat Level',
    recordId: 'core.threat.increase.battle_won',
  },
  threatDoorOrCobweb: {
    page: 88,
    pdf: 89,
    heading: 'Increasing Threat Level',
    recordId: 'core.threat.increase.door_chest_or_cobweb',
  },
  threatMax: {
    page: 88,
    pdf: 89,
    heading: 'Max Threat Level',
    recordId: 'core.threat.max_level',
  },
  threatTables: {
    page: 89,
    pdf: 91,
    heading: 'Threat Level tables',
    recordId: 'procedure.threat_roll',
  },
  wanderingMonsters: {
    page: 90,
    pdf: 92,
    heading: 'Wandering Monsters',
    recordId: 'procedure.wandering_monster',
  },
  traps: {
    page: 90,
    pdf: 92,
    heading: 'Triggering a Trap',
    recordId: 'procedure.trap_resolution',
  },
  searching: {
    page: 97,
    pdf: 99,
    heading: 'Searching through a Room or Corridor',
    recordId: 'procedure.search_room_or_corridor',
  },
  rest: { page: 98, pdf: 100, heading: 'Rest', recordId: 'procedure.rest' },
  restBleeding: {
    page: 98,
    pdf: 100,
    heading: 'Bleeding Out and Poisoned Characters',
    recordId: 'procedure.rest_bleeding_check',
  },
  restPoison: {
    page: 98,
    pdf: 100,
    heading: 'Bleeding Out and Poisoned Characters',
    recordId: 'procedure.rest_poison_checks',
  },
  openDoor: {
    page: 99,
    pdf: 101,
    heading: 'Opening a Door or Chest',
    recordId: 'procedure.open_door_or_chest',
  },
  lockedDoor: {
    page: 99,
    pdf: 101,
    heading: 'Locked / Closing a door',
    recordId: 'procedure.locked_door_and_close',
  },
  portcullis: {
    page: 101,
    pdf: 103,
    heading: 'Opening a Portcullis',
    recordId: 'procedure.open_portcullis',
  },
  encounters: { page: 104, pdf: 106, heading: 'Encounters', recordId: 'procedure.encounters' },
  initiative: { page: 104, pdf: 106, heading: 'Initiative', recordId: 'state_machine.battle' },
  endOfBattle: {
    page: 107,
    pdf: 109,
    heading: 'End of Battle',
    recordId: 'state_machine.battle',
  },
  wounded: { page: 119, pdf: 121, heading: 'Wounded', recordId: 'character.hit_points.wounded' },
  bleedingOut: {
    page: 120,
    pdf: 122,
    heading: 'Bleeding out',
    recordId: 'procedure.bleeding_out',
  },
  keepCalm: {
    page: 166,
    pdf: 168,
    heading: 'Keep Calm and Carry On!: morale',
    recordId: 'character.perk.keep_calm_and_carry_on.morale',
  },
  godsFavourite: {
    page: 166,
    pdf: 168,
    heading: 'God’s Favourite: threat',
    recordId: 'character.perk.gods_favourite.threat',
  },
  luckyGit: {
    page: 168,
    pdf: 170,
    heading: 'Lucky Git: threat',
    recordId: 'character.perk.lucky_git.threat',
  },
  nightVision: {
    page: 170,
    pdf: 172,
    heading: 'Night Vision',
    recordId: 'character.talent.night_vision.darkness',
  },
  naturalLeader: {
    page: 173,
    pdf: 175,
    heading: 'Natural Leader: party morale',
    recordId: 'character.talent.natural_leader.party_morale',
  },
  consumables: {
    page: 180,
    pdf: 182,
    heading: 'Consumables',
    recordId: 'character.equipment.consumable.dwarven_ale.drink',
  },
  lightSources: {
    page: 181,
    pdf: 183,
    heading: 'Light sources',
    recordId: 'table.equipment.light_sources',
  },
  crowbar: {
    page: 183,
    pdf: 185,
    heading: 'Tools',
    recordId: 'character.equipment.tool.crowbar.force',
  },
  speedSpell: { page: 189, pdf: 191, heading: 'Speed', recordId: 'spell.speed' },
  powerstoneMorale: {
    page: 197,
    pdf: 199,
    heading: 'Powerstone: +2 Party Morale',
    recordId: 'equipment.powerstone.effect_19',
  },
  questThresholds: {
    page: 220,
    pdf: 222,
    heading: 'Triggering Wandering Monsters',
    recordId: 'core.quest_book.threat_threshold_monster',
  },
  threatTableNotInBattle: {
    page: 89,
    pdf: 91,
    heading: 'If the party is not in battle:',
    recordId: 'table.dungeon.threat_not_in_battle',
  },
  threatTableInBattle: {
    page: 89,
    pdf: 91,
    heading: 'If the party is in battle:',
    recordId: 'table.dungeon.threat_in_battle',
  },
  threatNewLevel: {
    page: 88,
    pdf: 89,
    heading: 'The Threat Level',
    recordId: 'core.threat.new_level_reset',
  },
  doorTable: {
    page: 99,
    pdf: 101,
    heading: 'Opening a Door or Chest',
    recordId: 'table.dungeon.door_chest_difficulty',
  },
  chestTable: {
    page: 192,
    pdf: 194,
    heading: 'Chest',
    recordId: 'table.treasure.furniture.chest',
  },
  objectiveChestTable: {
    page: 193,
    pdf: 195,
    heading: 'Objective Chest',
    recordId: 'table.treasure.furniture.objective_chest',
  },
  thiefTreasure: {
    page: 36,
    pdf: 38,
    heading: 'Special',
    recordId: 'character.profession.thief.treasure_choice',
  },
  combatTurn: { page: 112, pdf: 114, heading: 'Combat Turn', recordId: 'procedure.combat_turn' },
  enemyPriority: {
    page: 116,
    pdf: 118,
    heading: 'Activation of Enemies',
    recordId: 'procedure.enemy_priority',
  },
  initiativeTokens: {
    page: 104,
    pdf: 106,
    heading: 'Initiative',
    recordId: 'procedure.initiative',
  },
  permanentInjury: {
    page: 120,
    pdf: 122,
    heading: 'Bleeding out',
    recordId: 'character.hit_points.permanent_injury',
  },
  partyLoss: {
    page: 120,
    pdf: 122,
    heading: 'Bleeding out',
    recordId: 'character.hit_points.party_loss',
  },
  poison: { page: 120, pdf: 122, heading: 'Poison', recordId: 'combat.poison.checks' },
  lingeringTrauma: {
    page: 55,
    pdf: 57,
    heading: 'Lingering Trauma Table',
    recordId: 'table.psychology.lingering_trauma',
  },
} as const satisfies Record<string, Cite>;

/** The five steps of a dungeon turn, as printed. */
export const TURN_SEQUENCE: ReadonlyArray<{ id: string; text: string; sub?: string[] }> = [
  {
    id: 'scenario',
    text: 'Roll the Scenario die.',
    sub: ['Make a Threat Roll if necessary.', 'Remove torches and lanterns if they go out.'],
  },
  { id: 'act', text: 'Act with all heroes and monsters based on their initiative.' },
  { id: 'wandering', text: 'Move Wandering Monsters.' },
  { id: 'threat', text: 'Increase Threat if a battle is won.' },
  { id: 'psychology', text: 'Check for changes in Sanity and Party Morale.' },
];

export const SCENARIO = {
  /** A d10 result at or above this calls for a Threat roll: the printed 9 or 0 (read as 10). */
  threatTrigger: 9,
  cite: CITES.scenarioDie,
} as const;

export const THREAT = {
  /** The level never drops below 2, or the minimum the quest sets. */
  floor: 2,
  natural20: -5,
  missIncrease: 1,
  /** The party wins a battle. */
  battleWon: 1,
  cite: CITES.threatLevel,
} as const;

export type ThreatSourceId =
  | 'open_door'
  | 'force_lock'
  | 'crowbar'
  | 'portcullis_failed'
  | 'cobweb_cleared'
  | 'battle_won'
  | 'lucky_git'
  | 'gods_favourite'
  | 'custom';

export interface ThreatSource {
  id: ThreatSourceId;
  label: string;
  /** Fixed change, or null when the Game Master supplies it. */
  delta: number | null;
  /** Dice to roll for the change, applied with `sign`. */
  dice?: string;
  detail: string;
  cite: Cite;
}

export const THREAT_SOURCES: ReadonlyArray<ThreatSource> = [
  {
    id: 'open_door',
    label: 'Door or chest opened',
    delta: 1,
    detail:
      'Opening a door or chest costs 1 AP and increases Threat by 1. The stone-side door of the starting tile is the exception.',
    cite: CITES.openDoor,
  },
  {
    id: 'force_lock',
    label: 'Locked door or chest forced',
    delta: 2,
    detail: 'Every attempt to force a locked door or chest adds +2 Threat.',
    cite: CITES.lockedDoor,
  },
  {
    id: 'crowbar',
    label: 'Crowbar used',
    delta: 1,
    detail: 'A crowbar adds +1 Threat and inflicts 8+DB damage on the door or chest.',
    cite: CITES.lockedDoor,
  },
  {
    id: 'portcullis_failed',
    label: 'Portcullis lift failed',
    delta: 1,
    detail: 'A failed STR test to lift a portcullis raises Threat by 1 (the noise when it drops).',
    cite: CITES.portcullis,
  },
  {
    id: 'cobweb_cleared',
    label: 'Cobweb opening cleared',
    delta: 1,
    detail: 'Clearing a cobweb opening (2 AP, weapon or torch) increases Threat by 1.',
    cite: CITES.threatDoorOrCobweb,
  },
  {
    id: 'battle_won',
    label: 'Battle won',
    delta: THREAT.battleWon,
    detail: 'The party wins a battle: increase the Threat Level by 1 (turn step 4).',
    cite: CITES.threatIncrease,
  },
  {
    id: 'lucky_git',
    label: 'Lucky Git perk',
    delta: -2,
    detail: 'Reduce the Threat Level by 2.',
    cite: CITES.luckyGit,
  },
  {
    id: 'gods_favourite',
    label: 'God’s Favourite perk',
    delta: null,
    dice: '1d6',
    detail: 'Decrease the Threat Level by 1d6.',
    cite: CITES.godsFavourite,
  },
  {
    id: 'custom',
    label: 'Other',
    delta: null,
    detail: 'A quest rule, card or event that changes Threat.',
    cite: CITES.threatLevel,
  },
];

export type ThreatTableRowId =
  | 'wandering_monster'
  | 'extra_exploration_card'
  | 'encounter_risk'
  | 'trap'
  | 'scenario_die_bonus'
  | 'disturbance_in_the_void'
  | 'greenish_tint'
  | 'forged_under_pressure'
  | 'healing'
  | 'frenzy'
  | 'disarmed'
  | 'fearsome'
  | 'reinforcements'
  | 'onwards';

/** What the table can carry out on its own when a row comes up; the rest is for the Game Master. */
export type ThreatTableEffect = 'wandering_monster' | 'encounter_risk' | 'trap' | 'scenario_bonus';

export interface ThreatTableRow {
  id: ThreatTableRowId;
  roll: { min: number; max: number };
  printed: string;
  /** Verbatim result text. */
  result: string;
  /** Printed Threat decrease (negative). */
  decrease: number;
  /** Short name for the stage and the log. */
  short: string;
  effect?: ThreatTableEffect;
}

export interface ThreatTable {
  dice: '1d20' | '1d10';
  sides: 20 | 10;
  label: string;
  cite: Cite;
  rows: ReadonlyArray<ThreatTableRow>;
}

/** The two Threat tables on p. 89, in printed order. */
export const THREAT_TABLES: { notInBattle: ThreatTable; inBattle: ThreatTable } = {
  notInBattle: {
    dice: '1d20',
    sides: 20,
    label: 'Party not in battle',
    cite: CITES.threatTableNotInBattle,
    rows: [
      {
        id: 'wandering_monster',
        roll: { min: 1, max: 12 },
        printed: '1-12',
        result: 'A Wandering Monster has appeared.',
        decrease: -5,
        short: 'Wandering Monster',
        effect: 'wandering_monster',
      },
      {
        id: 'extra_exploration_card',
        roll: { min: 13, max: 15 },
        printed: '13-15',
        result: 'Add one extra Exploration Card on top of each pile on the table.',
        decrease: -5,
        short: 'Extra Exploration Cards',
      },
      {
        id: 'encounter_risk',
        roll: { min: 16, max: 17 },
        printed: '16-17',
        result:
          'The risk of encounters goes up by 10 in all rooms and corridors for the rest of the quest. This is cumulative, but max is 70%.',
        decrease: -6,
        short: 'Encounter risk +10',
        effect: 'encounter_risk',
      },
      {
        id: 'trap',
        roll: { min: 18, max: 19 },
        printed: '18-19',
        result: 'A hero has sprung a trap!',
        decrease: -7,
        short: 'Trap sprung',
        effect: 'trap',
      },
      {
        id: 'scenario_die_bonus',
        roll: { min: 20, max: 20 },
        printed: '20',
        result:
          'Add +1 on all Scenario die roll for the remainder of the dungeon. This can only happen once.',
        decrease: -10,
        short: 'Scenario die +1',
        effect: 'scenario_bonus',
      },
    ],
  },
  inBattle: {
    dice: '1d10',
    sides: 10,
    label: 'Party in battle',
    cite: CITES.threatTableInBattle,
    rows: [
      {
        id: 'disturbance_in_the_void',
        roll: { min: 1, max: 1 },
        printed: '1',
        result:
          'A disturbance in the Void. There is a sudden shift in the Void, and this sudden shift leaves any Spell Caster in shock. Spell Casters may do nothing during the coming turn, not even dodge or parry.',
        decrease: -2,
        short: 'A disturbance in the Void',
      },
      {
        id: 'greenish_tint',
        roll: { min: 2, max: 2 },
        printed: '2',
        result:
          'Greenish tint. It suddenly dawns on the heroes that the greenish tint on the blade or claw of the enemies is some kind of poison. The enemy gains the Poisonous Special Rule.',
        decrease: -2,
        short: 'Greenish tint',
      },
      {
        id: 'forged_under_pressure',
        roll: { min: 3, max: 3 },
        printed: '3',
        result:
          'Forged under pressure. While under pressure, some will break, and some will harden. One enemy gain +15 CS until dead.',
        decrease: -3,
        short: 'Forged under pressure',
      },
      {
        id: 'healing',
        roll: { min: 4, max: 5 },
        printed: '4-5',
        result:
          'Healing. One wounded enemy on the table (the one with the highest XP level, or random) will heal 1d10 Hit Points. This may occur through use of a healing potion, by some divine intervention from the gods, or through sheer will.',
        decrease: -3,
        short: 'Healing',
      },
      {
        id: 'frenzy',
        roll: { min: 6, max: 6 },
        printed: '6',
        result:
          'Frenzy. One enemy starts roaring with rage and attacks with renewed strength. The enemy gains the Frenzy Special Rule until dead.',
        decrease: -3,
        short: 'Frenzy',
      },
      {
        id: 'disarmed',
        roll: { min: 7, max: 7 },
        printed: '7',
        result:
          'Disarmed! Whether by a disarming move from one of the enemies or due to clumsiness, one random hero drops his weapon. The hero must manage a DEX Test to retrieve his weapon, spending 1 Action doing so. If they fail, they will have no weapon and cannot fight. They may continue to try to pick it up, spending one AP per try.',
        decrease: -3,
        short: 'Disarmed!',
      },
      {
        id: 'fearsome',
        roll: { min: 8, max: 8 },
        printed: '8',
        result:
          'Fearsome! One enemy seems to grow in its presence, becoming more fearsome by the minute. The enemy gains the Fear Special Rule. There is no level cap for this fear, but Talents for ignoring fear still work.',
        decrease: -4,
        short: 'Fearsome!',
      },
      {
        id: 'reinforcements',
        roll: { min: 9, max: 9 },
        printed: '9',
        result:
          'Reinforcements. Roll on the Encounter Table and place the new encounter just outside a random door, open or not, ready to enter a tile where there are heroes. They will act last in the current turn. If the door was previously unopened, it will henceforth be considered unlocked and not trapped.',
        decrease: -4,
        short: 'Reinforcements',
      },
      {
        id: 'onwards',
        roll: { min: 10, max: 10 },
        printed: '10',
        result:
          'Onwards! One enemy breaks out in a fierce roar, boosting his fellows and making them fight with renewed energy. All enemies gain +10 CS until end of battle.',
        decrease: -6,
        short: 'Onwards!',
      },
    ],
  },
};

export function threatTableFor(inBattle: boolean): ThreatTable {
  return inBattle ? THREAT_TABLES.inBattle : THREAT_TABLES.notInBattle;
}

export function threatTableRow(inBattle: boolean, roll: number): ThreatTableRow | undefined {
  return threatTableFor(inBattle).rows.find((row) => roll >= row.roll.min && roll <= row.roll.max);
}

export interface DoorTableRow {
  id: string;
  roll: { min: number; max: number };
  printed: string;
  locked: boolean;
  /** Printed difficulty: pick-lock modifier and door HP, or null for an open door. */
  difficulty: string | null;
  pickModifier: number | null;
  hp: number | null;
}

/** The Door Table (1d10, 0 read as 10), in printed order. */
export const DOOR_TABLE: ReadonlyArray<DoorTableRow> = [
  {
    id: 'open',
    roll: { min: 1, max: 6 },
    printed: '1-6',
    locked: false,
    difficulty: null,
    pickModifier: null,
    hp: null,
  },
  {
    id: 'locked_7',
    roll: { min: 7, max: 7 },
    printed: '7',
    locked: true,
    difficulty: 'Pick lock: 0, HP 10',
    pickModifier: 0,
    hp: 10,
  },
  {
    id: 'locked_8',
    roll: { min: 8, max: 8 },
    printed: '8',
    locked: true,
    difficulty: 'Pick lock: -10, HP 15',
    pickModifier: -10,
    hp: 15,
  },
  {
    id: 'locked_9',
    roll: { min: 9, max: 9 },
    printed: '9',
    locked: true,
    difficulty: 'Pick lock: -15, HP 20',
    pickModifier: -15,
    hp: 20,
  },
  {
    id: 'locked_0',
    roll: { min: 10, max: 10 },
    printed: '0',
    locked: true,
    difficulty: 'Pick lock: -20, HP 25',
    pickModifier: -20,
    hp: 25,
  },
];

export function doorTableRow(roll: number): DoorTableRow | undefined {
  return DOOR_TABLE.find((row) => roll >= row.roll.min && roll <= row.roll.max);
}

export const DOOR = {
  /** A 6 on the d6 rolled with the door means a trap. */
  trapOn: 6,
  forceThreat: 2,
  crowbarThreat: 1,
  crowbarDamage: '8+DB',
  pickActions: 2,
  cite: CITES.openDoor,
} as const;

export interface ChestTableRow {
  id: string;
  roll: { min: number; max: number };
  printed: string;
  /** The Findings cell as printed. */
  result: string;
  fine: number;
  wonderful: number;
}

export interface ChestTable {
  id: 'chest' | 'objective_chest';
  title: string;
  cite: Cite;
  rows: ReadonlyArray<ChestTableRow>;
}

/**
 * The Chest and Objective Chest rows of Treasure found in Furniture (1d10). The treasures
 * themselves are Treasure Cards drawn from the Fine and Wonderful piles; the cards are not in
 * this book, so the table only says how many of each to draw.
 */
export const CHEST_TABLES: Record<ChestTable['id'], ChestTable> = {
  chest: {
    id: 'chest',
    title: 'Chest',
    cite: CITES.chestTable,
    rows: [
      {
        id: 'row_1',
        roll: { min: 1, max: 1 },
        printed: '1',
        result: '1 Wonderful Treasure.',
        fine: 0,
        wonderful: 1,
      },
      {
        id: 'row_2',
        roll: { min: 2, max: 4 },
        printed: '2-4',
        result: '2 Fine Treasures.',
        fine: 2,
        wonderful: 0,
      },
      {
        id: 'row_3',
        roll: { min: 5, max: 8 },
        printed: '5-8',
        result: '1 Fine Treasure.',
        fine: 1,
        wonderful: 0,
      },
      {
        id: 'row_4',
        roll: { min: 9, max: 10 },
        printed: '9-10',
        result: 'Nothing.',
        fine: 0,
        wonderful: 0,
      },
    ],
  },
  objective_chest: {
    id: 'objective_chest',
    title: 'Objective Chest',
    cite: CITES.objectiveChestTable,
    rows: [
      {
        id: 'row_1',
        roll: { min: 1, max: 3 },
        printed: '1-3',
        result: '1 Fine treasure, 2 Wonderful Treasures.',
        fine: 1,
        wonderful: 2,
      },
      {
        id: 'row_2',
        roll: { min: 4, max: 7 },
        printed: '4-7',
        result: '2 Fine treasure, 1 Wonderful Treasure.',
        fine: 2,
        wonderful: 1,
      },
      {
        id: 'row_3',
        roll: { min: 8, max: 10 },
        printed: '8-10',
        result: '3 Fine Treasures.',
        fine: 3,
        wonderful: 0,
      },
    ],
  },
};

export function chestTableRow(table: ChestTable['id'], roll: number): ChestTableRow | undefined {
  return CHEST_TABLES[table].rows.find((row) => roll >= row.roll.min && roll <= row.roll.max);
}

export const THIEF_TREASURE =
  'A thief may always draw two Treasure Cards and keep one. If the card says to draw from a higher tier, the thief draws only one card from that pile.';

/** Enemy activation order, as printed under Activation of Enemies. */
export const ENEMY_PRIORITY: ReadonlyArray<string> = [
  'Magic User or enemy armed with Ranged Weapon.',
  'An enemy adjacent to a hero that could make room for more enemies.',
  'Enemy adjacent to hero.',
  'Enemy closest to a hero and that could charge.',
  'Enemy that has enough space to move its full movement.',
  'Random enemy.',
];

/** The combat turn flowchart on p. 112, one card per branch. */
export const COMBAT_ROUND: ReadonlyArray<{ id: string; title: string; text: string }> = [
  {
    id: 'pull',
    title: 'Pull an initiative token',
    text: 'Draw a token from the bag without looking.',
  },
  {
    id: 'hero',
    title: 'Hero token',
    text: 'Choose a hero or mercenary that has not acted. Remove Stunned, Parry Stance or Power Attack tokens, then perform the chosen actions.',
  },
  {
    id: 'enemy',
    title: 'Enemy token',
    text: 'Check the Quick Reference card to see which enemy acts (the order below). Remove Stunned, Parry Stance or Power Attack tokens, then act according to the Enemy behaviour card.',
  },
  {
    id: 'last',
    title: 'Last token in the bag',
    text: 'Move Wandering Monsters, refill the initiative bag removing tokens for each casualty, then roll the Scenario die. If all heroes or all enemies are dead the sequence ends; heroes that have not acted may then act as normal.',
  },
];

export const INITIATIVE = {
  /** Enemies get this many tokens more than their number when the door was bashed down. */
  bashedDoor: 2,
  /** One extra token per named monster, as long as it is alive. */
  namedMonster: 1,
  /** One extra token for the side with Perfect Hearing on the first turn after a door; none if both have it. */
  perfectHearing: 1,
  /** Enemies ambushing a resting party start with 3 extra tokens. */
  restAmbush: 3,
  cite: CITES.initiativeTokens,
} as const;

export const POISON = {
  /** Printed cadence of the Poison Tests after a poisoning. */
  cadence: 'CON test at the start of the next turn, and 1d10 turns after that.',
  cite: CITES.poison,
} as const;

export const INJURY = {
  /** Reaching 0 HP also costs a permanent 1d4 off a random basic stat or HP. */
  permanent: '1d4 permanent reduction of a basic stat or HP. Randomize which one.',
  cite: CITES.permanentInjury,
} as const;

/** The Lingering Trauma Table (1d6), in printed order. */
export const LINGERING_TRAUMA: ReadonlyArray<{ id: string; printed: string; trigger: string }> = [
  { id: 'trigger_1', printed: '1', trigger: 'A trap is sprung by the party.' },
  { id: 'trigger_2', printed: '2', trigger: 'A portcullis falls down.' },
  { id: 'trigger_3', printed: '3', trigger: 'A companion is reduced to 0 Hit Points.' },
  { id: 'trigger_4', printed: '4', trigger: 'A miscast in the party.' },
  { id: 'trigger_5', printed: '5', trigger: 'Party takes a short break.' },
  { id: 'trigger_6', printed: '6', trigger: 'The party opens a chest.' },
];

export type LightKind = 'torch' | 'lantern' | 'headlamp';

export interface LightRules {
  kind: LightKind;
  label: string;
  /** Bonus to Fear and Terror tests for every hero, Night Vision included. */
  fearTerror: number;
  /** Perception bonus for the carrier. */
  perception: number;
  handsFree: boolean;
  /** Lanterns burn in two halves; each Threat roll below Threat burns one. */
  oilHalves?: number;
  notes: string[];
}

export const LIGHT_RULES: Record<LightKind, LightRules> = {
  torch: {
    kind: 'torch',
    label: 'Torch',
    fearTerror: 5,
    perception: 5,
    handsFree: false,
    notes: [
      'Occupies one hand and excludes shields, bows, crossbows and class 5 weapons.',
      'Swing with CS +15; a hit shoves the enemy 1 square without following.',
      'An unmodified attack result of 90 or more extinguishes and discards it.',
      'A Threat Roll below Threat spends it.',
      'Lighting a new torch from a Quick Slot takes 1 action, never adjacent to an enemy.',
    ],
  },
  lantern: {
    kind: 'lantern',
    label: 'Lantern',
    fearTerror: 5,
    perception: 10,
    handsFree: false,
    oilHalves: 2,
    notes: [
      'Occupies one hand and excludes shields, bows, crossbows and class 5 weapons.',
      'Trolls must pass RES to attack the carrier; failure uses the action to Bellow; once successful, no further test.',
      'Bat swarms inflict half damage (RDU).',
      'Each Threat Roll below Threat consumes half its oil; the second extinguishes it.',
      'Refilling from a Quick Slot takes 1 action. Lamp Oil refills a lantern once.',
    ],
  },
  headlamp: {
    kind: 'headlamp',
    label: 'Headlamp',
    fearTerror: 5,
    perception: 10,
    handsFree: true,
    oilHalves: 2,
    notes: [
      'Follows the lantern rules but leaves both hands free.',
      'If the hero is hit in the head, the lamp is destroyed.',
    ],
  },
};

export type MoraleEventId =
  | 'hero_dies'
  | 'zero_hp'
  | 'demon_battle'
  | 'terror'
  | 'hungry'
  | 'fear'
  | 'poison_or_disease'
  | 'trap'
  | 'miscast'
  | 'portcullis'
  | 'short_rest'
  | 'fine_treasure'
  | 'large_monster'
  | 'dwarven_ale'
  | 'wonderful_treasure';

export type LinkedSanity =
  /** The hero the event happened to loses Sanity. */
  | { kind: 'hero'; loss: number }
  /** Every living hero loses Sanity. */
  | { kind: 'party'; loss: number }
  /** The printed -1d3 is overridden by a designer ruling: roll on the Miscast table instead. */
  | { kind: 'miscast' };

export interface MoraleEvent {
  id: MoraleEventId;
  situation: string;
  effect: number;
  flavour: string;
  /** Whether the event concerns one hero (and so wants a hero picked). */
  perHero: boolean;
  sanity?: LinkedSanity;
  /** Hero status the event switches on. */
  status?: HeroStatus | 'dead';
  /** A published designer ruling that replaces the printed effect; the corpus applies it. */
  ruled?: number;
  /** What the ruling says, for the log and the peek. */
  ruling?: string;
}

/** The Party Morale table, in printed order. */
export const MORALE_EVENTS: ReadonlyArray<MoraleEvent> = [
  {
    id: 'hero_dies',
    situation: 'A hero dies',
    effect: -6,
    ruled: -5,
    ruling: 'Designer ruling (changelog 2.21): -5, not the printed -6.',
    flavour: 'Things suddenly become real…we are all going to die!',
    perHero: true,
    status: 'dead',
  },
  {
    id: 'zero_hp',
    situation: 'A hero reaches 0 Hit Points',
    effect: -4,
    flavour: 'Seeing your friend in a pool of blood is sure to unsettle your nerves.',
    perHero: true,
    sanity: { kind: 'hero', loss: 1 },
    status: 'bleeding_out',
  },
  {
    id: 'demon_battle',
    situation: 'Party is engaged in battle with demons',
    effect: -2,
    flavour:
      'Fighting things that should not be, and things that are a mockery to nature, takes its toll.',
    perHero: false,
    sanity: { kind: 'party', loss: 1 },
  },
  {
    id: 'terror',
    situation: 'A hero fails a Terror Test',
    effect: -2,
    flavour: 'The sheer terror in the eyes of your companion is frightening.',
    perHero: true,
    sanity: { kind: 'hero', loss: 2 },
  },
  {
    id: 'hungry',
    situation: 'Party is hungry',
    effect: -2,
    ruled: -1,
    ruling: 'Designer ruling (changelog 2.21): -1 for each hungry character, not a flat -2.',
    flavour: 'Lack of food is always bad for motivation',
    perHero: true,
  },
  {
    id: 'fear',
    situation: 'A character fails a Fear Test',
    effect: -1,
    flavour: 'Fear spreads like a wildfire.',
    perHero: true,
    sanity: { kind: 'hero', loss: 1 },
  },
  {
    id: 'poison_or_disease',
    situation: 'A hero is poisoned or diseased.',
    effect: -1,
    flavour: 'Succumbing to a disease or poison is not the glorious death of a hero.',
    perHero: true,
    sanity: { kind: 'hero', loss: 1 },
  },
  {
    id: 'trap',
    situation: 'A hero springs a trap',
    effect: -1,
    flavour: 'Few things are so unnerving as sudden, unexpected death.',
    perHero: true,
    sanity: { kind: 'hero', loss: 2 },
  },
  {
    id: 'miscast',
    situation: 'A Miscast',
    effect: -1,
    flavour: 'Even the gods are against us! We are doomed!',
    perHero: true,
    sanity: { kind: 'miscast' },
  },
  {
    id: 'portcullis',
    situation: 'Portcullis falling down and blocking path',
    effect: -1,
    flavour: 'The feeling of being trapped underground is not easy on your mind.',
    perHero: false,
  },
  {
    id: 'short_rest',
    situation: 'Taking a short rest',
    effect: 1,
    ruled: 2,
    ruling: 'The rest checklist on p. 98 gives +2, up to the start value; the corpus follows it.',
    flavour: 'Resting is a good way to calm the nerves.',
    perHero: false,
  },
  {
    id: 'fine_treasure',
    situation: 'Finding a Fine Treasure',
    effect: 1,
    flavour: 'This is good news! Maybe there is more?',
    perHero: false,
  },
  {
    id: 'large_monster',
    situation: 'Slaying a large monster',
    effect: 2,
    flavour: 'Nothing can stop us! Our weapons are guided by the gods!',
    perHero: false,
  },
  {
    id: 'dwarven_ale',
    situation: 'Intoxicating your party with Dwarven ale',
    effect: 3,
    flavour:
      'Dwarven ale is liquid bravery, that is a known fact. Just a pity that the effectiveness of the party diminishes.',
    perHero: false,
  },
  {
    id: 'wonderful_treasure',
    situation: 'Finding a Wonderful Treasure',
    effect: 3,
    flavour: 'Gold! We will be rich!',
    perHero: false,
  },
];

export const MORALE = {
  /**
   * The Party Morale table prints +1 for a short rest; the rest checklist on p. 98 says +2 up
   * to the start value, and the corpus follows the checklist (changelog 2.21).
   */
  restBonus: 2,
  /** Below half of the starting value the party wavers: every hero suffers -20 RES. */
  waveringResolve: -20,
  naturalLeader: 2,
  powerstone: 2,
  keepCalm: 2,
  dwarvenAle: 'All stat and skill tests at -10, except RES at +20, for the rest of the quest.',
} as const;

export type SanityLossId =
  | 'terror'
  | 'trap'
  | 'head_wound'
  | 'fear'
  | 'demon_battle'
  | 'zero_hp'
  | 'disease'
  | 'poison'
  | 'miscast'
  | 'room_event';

export interface SanityLoss {
  id: SanityLossId;
  situation: string;
  /** Points lost; null when a table or card decides (miscast ruling, room events). */
  loss: number | null;
  printed: string;
}

/** The Sanity table, in printed order. */
export const SANITY_LOSSES: ReadonlyArray<SanityLoss> = [
  { id: 'terror', situation: 'Failing a Terror Test', loss: 2, printed: '-2' },
  { id: 'trap', situation: 'Springing a trap', loss: 2, printed: '-2' },
  { id: 'head_wound', situation: 'Character suffers a wound to the head', loss: 1, printed: '-1' },
  { id: 'fear', situation: 'Failing a Fear Test', loss: 1, printed: '-1' },
  { id: 'demon_battle', situation: 'Each battle with a demon', loss: 1, printed: '-1' },
  { id: 'zero_hp', situation: 'Being reduced to 0 Hit Points', loss: 1, printed: '-1' },
  { id: 'disease', situation: 'Contracting a disease', loss: 1, printed: '-1' },
  { id: 'poison', situation: 'Getting poisoned', loss: 1, printed: '-1' },
  { id: 'miscast', situation: 'Miscasting a spell', loss: null, printed: '-1d3' },
  {
    id: 'room_event',
    situation: 'Certain room events',
    loss: null,
    printed: 'See Exploration Card',
  },
];

export const SANITY = {
  start: 8,
  cite: CITES.sanity,
  miscastRuling:
    'Designer ruling: a miscast does not cost -1d3 Sanity; roll on the Miscast table instead, and the table owns any Sanity loss.',
} as const;

export type MentalConditionId =
  | 'hate'
  | 'acute_stress'
  | 'lingering_trauma'
  | 'fear_of_the_dark'
  | 'arachnophobia'
  | 'jumpy'
  | 'irrational_fear'
  | 'claustrophobia'
  | 'depression';

export interface MentalCondition {
  id: MentalConditionId;
  name: string;
  roll: { min: number; max: number };
  printed: string;
  effect: string;
  /** What the table tracks for the Game Master while this condition is active. */
  tracked?: string;
}

/** The Mental conditions table (1d10, 0 read as 10), in printed order. */
export const MENTAL_CONDITIONS: ReadonlyArray<MentalCondition> = [
  {
    id: 'hate',
    name: 'Hate',
    roll: { min: 1, max: 1 },
    printed: '1',
    effect:
      'The hero gains the Hate Talent against the type of enemy last fought. This creature must appear in the Monster List of the Bestiary.',
  },
  {
    id: 'acute_stress',
    name: 'Acute Stress',
    roll: { min: 2, max: 3 },
    printed: '2-3',
    effect:
      'RES reduced by 10 for the rest of the quest. The hero will scream uncontrollably during all battles, alerting every single soul in the dungeon. Threat Level is increased by an additional +1 for each battle from now until the end of the quest. This only lasts for the current quest.',
    tracked: '+1 Threat at the start of every battle this quest; RES -10.',
  },
  {
    id: 'lingering_trauma',
    name: 'Lingering Trauma',
    roll: { min: 4, max: 4 },
    printed: '4',
    effect:
      'The effect of this condition will not be evident until your next dungeon and only during a specific situation that in some way resembles or reminds the character of the situation that triggered the syndrome. See separate table below. Once the trauma kicks in, all Resolve Tests are at -10 and CS is at -10. Once triggered, it will last until you leave the dungeon.',
    tracked: 'Roll on the Lingering Trauma table; the trigger waits for the next dungeon.',
  },
  {
    id: 'fear_of_the_dark',
    name: 'Fear of the Dark',
    roll: { min: 5, max: 5 },
    printed: '5',
    effect:
      'The hero has developed an irrational fear of the dark and all Resolve Tests are at -10.',
    tracked: 'All Resolve Tests at -10.',
  },
  {
    id: 'arachnophobia',
    name: 'Arachnophobia',
    roll: { min: 6, max: 6 },
    printed: '6',
    effect:
      'The hero finds all kinds of spiders terrifying. Treat all encounters as causing Terror.',
    tracked: 'Spiders cause Terror for this hero.',
  },
  {
    id: 'jumpy',
    name: 'Jumpy',
    roll: { min: 7, max: 7 },
    printed: '7',
    effect:
      'Every unsuspecting noise makes the hero jump and scream, startling the companions and alerting all dungeon dwellers to their presence. A Scenario roll of 10 means something has spooked the hero and the scream causes the Threat Level to increase by 2.',
    tracked: 'A Scenario roll of 0 (10) adds +2 Threat.',
  },
  {
    id: 'irrational_fear',
    name: 'Irrational Fear',
    roll: { min: 8, max: 8 },
    printed: '8',
    effect:
      'The hero becomes irrationally afraid of a specific type of monster. Randomise between Orcs and Goblins, Beasts, Undead, Reptiles, or Dark Elves. All monsters from that faction will now cause fear to the hero.',
    tracked: 'Randomise the faction; its monsters cause Fear for this hero.',
  },
  {
    id: 'claustrophobia',
    name: 'Claustrophobia',
    roll: { min: 9, max: 9 },
    printed: '9',
    effect:
      'The hero is troubled by tight spaces and becomes less effective. All skills and stats are at -10 in corridors.',
    tracked: 'All skills and stats at -10 in corridors.',
  },
  {
    id: 'depression',
    name: 'Depression',
    roll: { min: 10, max: 10 },
    printed: '0',
    effect:
      'The hero is slowly worn down by the reoccurring horrors and falls into a state of depression. As a result, the energy pool of the character is reduced by 2.',
    tracked: 'Energy pool reduced by 2.',
  },
];

export const REST = {
  rationCost: 1,
  wanderingMoves: 3,
  hitPoints: '1d6',
  /** Each lost Energy Point comes back on a d6 result of 1–3. */
  energyRegain: '1–3 on 1d6 per lost point',
  ambushBase: 5,
  ambushPerLaterRest: 10,
  ambushCap: 70,
  ambushEnemyTokens: 3,
  cite: CITES.rest,
} as const;

export const ENCOUNTER = {
  room: 50,
  corridor: 30,
  /** After this many encounter-free tiles the chance rises by `streakBonus`, capped. */
  streakTiles: 4,
  streakBonus: 10,
  cap: 70,
  cite: CITES.encounters,
} as const;

export const SEARCH = {
  oneHelper: 10,
  moreHelpers: 5,
  cite: CITES.searching,
} as const;

export type HeroStatus = 'wounded' | 'bleeding_out' | 'poisoned' | 'diseased';

export const HERO_STATUSES: Record<HeroStatus, { label: string; reminder: string; cite: Cite }> = {
  wounded: {
    label: 'Wounded',
    reminder: 'Has lost 50% of their HP (RDU): only 1 Action Point per turn while it lasts.',
    cite: CITES.wounded,
  },
  bleeding_out: {
    label: 'Bleeding out',
    reminder:
      'Knocked down and unable to act. In battle a companion’s spell or a ready potion can rescue them; after battle a standing companion may bandage; with no means of help they die. During a rest: CON+10 test or die, success regains 1d4 HP.',
    cite: CITES.bleedingOut,
  },
  poisoned: {
    label: 'Poisoned',
    reminder:
      'CON test at the start of the next turn, and 1d10 turns after that; remaining Poison Tests are made during a rest.',
    cite: CITES.poison,
  },
  diseased: {
    label: 'Diseased',
    reminder: 'Cure Disease is a settlement activity; see Disease on p. 119.',
    cite: { page: 119, pdf: 121, heading: 'Disease' },
  },
};

export interface QuestPreset {
  id: string;
  title: string;
  chapter: string;
  /** Start Threat: a number, dice to roll, or null when the quest uses no Threat. */
  start: number | string | null;
  /** Minimum Threat: a number, 'start' for "Same as start lvl", or null. */
  min: number | 'start' | null;
  max: number | null;
  /** Threat values at which a Wandering Monster appears (every time Threat is increased to it). */
  thresholds: number[];
  /** Quest switches the Scenario die off. */
  noScenarioDie?: boolean;
  notes: string[];
  cite: Cite;
  /** Corpus records the preset was read from. */
  records: { threat?: string; thresholds?: string[] };
}

export const QUESTS: ReadonlyArray<QuestPreset> = [
  {
    id: 'quest.first_blood',
    title: 'First Blood (introductory quest)',
    chapter: 'Introduction',
    start: null,
    min: null,
    max: null,
    thresholds: [],
    noScenarioDie: true,
    notes: [
      'Due to the darkness, no one can see or shoot further than 10 squares. The Scenario die is not used.',
    ],
    cite: { page: 221, pdf: 223, heading: 'First Blood — darkness and Scenario die' },
    records: { thresholds: ['core.quest.first_blood.darkness_and_scenario'] },
  },
  {
    id: 'quest.dead_rising.spring_cleaning',
    title: 'Quest 1: Spring Cleaning',
    chapter: 'The Dead Rising',
    start: 2,
    min: 2,
    max: 18,
    thresholds: [12],
    notes: [],
    cite: { page: 222, pdf: 224, heading: 'Spring Cleaning Threat' },
    records: {
      threat: 'table.quest.spring_cleaning.threat',
      thresholds: ['core.quest.spring_cleaning.threshold'],
    },
  },
  {
    id: 'quest.dead_rising.the_dead_rising',
    title: 'Quest 2: The Dead Rising',
    chapter: 'The Dead Rising',
    start: 4,
    min: 4,
    max: 18,
    thresholds: [10],
    notes: [],
    cite: { page: 225, pdf: 227, heading: 'The Dead Rising Threat' },
    records: {
      threat: 'table.quest.dead_rising.threat',
      thresholds: ['core.quest.dead_rising.threshold'],
    },
  },
  {
    id: 'quest.dead_rising.highwaymen',
    title: 'Quest 3: Highwaymen',
    chapter: 'The Dead Rising',
    start: 3,
    min: 3,
    max: 18,
    thresholds: [10],
    notes: [],
    cite: { page: 227, pdf: 229, heading: 'Quest Threat levels' },
    records: {
      threat: 'table.quest.highwaymen.threat',
      thresholds: ['core.quest.highwaymen.threshold'],
    },
  },
  {
    id: 'quest.dead_rising.burning_village',
    title: 'Quest 4: The Burning Village',
    chapter: 'The Dead Rising',
    start: null,
    min: null,
    max: null,
    thresholds: [],
    notes: ['No Threat Level is used during this quest. The Scenario die should still be rolled.'],
    cite: { page: 229, pdf: 231, heading: 'Quest Threat levels' },
    records: {
      threat: 'table.quest.burning_village.threat',
      thresholds: ['core.quest.burning_village.scenario'],
    },
  },
  {
    id: 'quest.dead_rising.apprentice',
    title: 'Quest 5: The Apprentice',
    chapter: 'The Dead Rising',
    start: 4,
    min: 4,
    max: 18,
    thresholds: [10],
    notes: [],
    cite: { page: 230, pdf: 232, heading: 'Quest Threat levels' },
    records: {
      threat: 'table.quest.apprentice.threat',
      thresholds: ['core.quest.apprentice.threshold'],
    },
  },
  {
    id: 'quest.dead_rising.sacrifice',
    title: 'Quest 6A: Sacrifice',
    chapter: 'The Dead Rising',
    start: 6,
    min: 6,
    max: 18,
    thresholds: [],
    notes: [],
    cite: { page: 232, pdf: 234, heading: 'Quest Threat levels' },
    records: { threat: 'table.quest.sacrifice.threat' },
  },
  {
    id: 'quest.dead_rising.master',
    title: 'Quest 6B: The Master',
    chapter: 'The Dead Rising',
    start: 6,
    min: 6,
    max: 18,
    thresholds: [],
    notes: [],
    cite: { page: 233, pdf: 235, heading: 'Quest Threat levels' },
    records: { threat: 'table.quest.master.threat' },
  },
  {
    id: 'quest.spider_queen.entrance',
    title: 'Level 1: The Entrance',
    chapter: 'Lair of the Spider Queen',
    start: 4,
    min: 4,
    max: 18,
    thresholds: [],
    notes: [],
    cite: { page: 236, pdf: 238, heading: 'Quest Threat levels' },
    records: { threat: 'table.quest.spider_queen_entrance.threat' },
  },
  {
    id: 'quest.spider_queen.basement',
    title: 'Level 2: The Basement',
    chapter: 'Lair of the Spider Queen',
    start: 4,
    min: 4,
    max: 18,
    thresholds: [10, 16],
    notes: [],
    cite: { page: 237, pdf: 239, heading: 'Quest Threat levels' },
    records: {
      threat: 'table.quest.spider_queen_basement.threat',
      thresholds: ['core.quest.spider_queen_basement.threshold'],
    },
  },
  {
    id: 'quest.spider_queen.tomb',
    title: 'Level 3: The Tomb of the Spider Queen',
    chapter: 'Lair of the Spider Queen',
    start: 6,
    min: 6,
    max: 20,
    thresholds: [12],
    notes: [],
    cite: { page: 239, pdf: 241, heading: 'Quest Threat levels' },
    records: {
      threat: 'table.quest.spider_queen_tomb.threat',
      thresholds: ['core.quest.spider_queen_tomb.threshold'],
    },
  },
  {
    id: 'quest.lava_river.stop_heretics',
    title: 'Quest 1: Stop the Heretics',
    chapter: 'The Lava River',
    start: '1d4',
    min: 'start',
    max: 18,
    thresholds: [10],
    notes: [],
    cite: { page: 242, pdf: 244, heading: 'Stop the Heretics Threat' },
    records: {
      threat: 'table.quest.stop_heretics.threat',
      thresholds: ['core.quest.stop_heretics.threshold'],
    },
  },
  {
    id: 'quest.lava_river.master_alchemist',
    title: 'Quest 2: The Master Alchemist',
    chapter: 'The Lava River',
    start: 5,
    min: 3,
    max: 18,
    thresholds: [12],
    notes: [],
    cite: { page: 244, pdf: 246, heading: 'Quest Threat levels' },
    records: {
      threat: 'table.quest.master_alchemist.threat',
      thresholds: ['core.quest.master_alchemist.threshold'],
    },
  },
  {
    id: 'quest.lava_river.preventing_disaster',
    title: 'Quest 3: Preventing a Disaster',
    chapter: 'The Lava River',
    start: 6,
    min: 5,
    max: 20,
    thresholds: [12],
    notes: [],
    cite: { page: 245, pdf: 247, heading: 'Quest Threat levels' },
    records: {
      threat: 'table.quest.preventing_disaster.threat',
      thresholds: ['core.quest.preventing_disaster.threshold'],
    },
  },
  {
    id: 'quest.bandits_hideout.rescuing_prisoners',
    title: 'Quest 1: Rescuing the Prisoners',
    chapter: 'The Bandits’ Hideout',
    start: '1d4+1',
    min: 'start',
    max: 20,
    thresholds: [14],
    notes: [],
    cite: { page: 247, pdf: 249, heading: 'Rescuing the Prisoners Threat' },
    records: {
      threat: 'table.quest.rescuing_prisoners.threat',
      thresholds: ['core.quest.rescuing_prisoners.threshold'],
    },
  },
  {
    id: 'quest.bandits_hideout.pleasure_house',
    title: 'Quest 2: The Pleasure House',
    chapter: 'The Bandits’ Hideout',
    start: '1d4+1',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: [],
    cite: { page: 249, pdf: 251, heading: 'The Pleasure House Threat' },
    records: { threat: 'table.quest.pleasure_house.threat' },
  },
  {
    id: 'quest.fountain_room.cleansing_water',
    title: 'Quest 1: Cleansing the Water',
    chapter: 'The Fountain Room',
    start: 2,
    min: 2,
    max: 18,
    thresholds: [14],
    notes: [],
    cite: { page: 251, pdf: 253, heading: 'Quest Threat levels' },
    records: {
      threat: 'table.quest.cleansing_water.threat',
      thresholds: ['core.quest.cleansing_water.threshold'],
    },
  },
  {
    id: 'quest.fountain_room.baptising',
    title: 'Quest 2: Baptising',
    chapter: 'The Fountain Room',
    start: 4,
    min: 4,
    max: 18,
    thresholds: [],
    notes: [],
    cite: { page: 252, pdf: 254, heading: 'Quest Threat levels' },
    records: { threat: 'table.quest.baptising.threat' },
  },
  {
    id: 'quest.chamber_of_reverence.returning_relic',
    title: 'Quest 1: Returning the Relic',
    chapter: 'The Chamber of Reverence',
    start: '1d4+1',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: ['A failed attempt to refit the relic increases Threat by 1.'],
    cite: { page: 253, pdf: 255, heading: 'Returning the Relic Threat' },
    records: {
      threat: 'table.quest.returning_relic.threat',
      thresholds: ['core.quest.returning_relic.refit_failure'],
    },
  },
  {
    id: 'quest.chamber_of_reverence.slaying_fiend',
    title: 'Quest 2: Slaying the Fiend',
    chapter: 'The Chamber of Reverence',
    start: '1d4+2',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: [],
    cite: { page: 254, pdf: 256, heading: 'Slaying the Fiend Threat' },
    records: { threat: 'table.quest.slaying_fiend.threat' },
  },
  {
    id: 'quest.chamber_of_reverence.closing_portal',
    title: 'Quest 3: Closing the Portal',
    chapter: 'The Chamber of Reverence',
    start: '1d6',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: [],
    cite: { page: 255, pdf: 257, heading: 'Closing the Portal Threat' },
    records: { threat: 'table.quest.closing_portal.threat' },
  },
  {
    id: 'quest.great_crypt.family_heirloom',
    title: 'Quest 1: Retrieving the Family Heirloom',
    chapter: 'The Great Crypt',
    start: '1d4+1',
    min: 'start',
    max: 18,
    thresholds: [],
    notes: [],
    cite: { page: 257, pdf: 259, heading: 'Retrieving the Family Heirloom Threat' },
    records: { threat: 'table.quest.family_heirloom.threat' },
  },
  {
    id: 'quest.great_crypt.stopping_necromancer',
    title: 'Quest 2: Stopping the Necromancer',
    chapter: 'The Great Crypt',
    start: '1d6',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: [],
    cite: { page: 259, pdf: 261, heading: 'Stopping the Necromancer Threat' },
    records: { threat: 'table.quest.stopping_necromancer.threat' },
  },
  {
    id: 'quest.great_crypt.tomb_raiders',
    title: 'Quest 3: Tomb Raiders',
    chapter: 'The Great Crypt',
    start: '1d6',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: [
      'While at least one hero is in the objective room, a Threat roll above the current Threat level results in a Wandering Monster as well as the increase of the Threat level.',
    ],
    cite: { page: 260, pdf: 262, heading: 'Tomb Raiders Threat' },
    records: {
      threat: 'table.quest.tomb_raiders.threat',
      thresholds: ['core.quest.tomb_raiders.objective_threat'],
    },
  },
  {
    id: 'quest.ancient_lands.pyramid_xanthu',
    title: 'The Pyramid of Xánthu',
    chapter: 'Quests into the Ancient Lands',
    start: '1d6',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: [],
    cite: { page: 262, pdf: 264, heading: 'Pyramid of Xánthu Threat' },
    records: { threat: 'table.quest.pyramid_xanthu.threat' },
  },
  {
    id: 'quest.ancient_lands.hierophant',
    title: 'Tomb of the Hierophant',
    chapter: 'Quests into the Ancient Lands',
    start: '1d6',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: [],
    cite: { page: 264, pdf: 266, heading: 'Tomb of the Hierophant Threat' },
    records: { threat: 'table.quest.hierophant.threat' },
  },
  {
    id: 'quest.ancient_lands.temple_despair',
    title: 'Temple of Despair',
    chapter: 'Quests into the Ancient Lands',
    start: '1d6',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: [],
    cite: { page: 266, pdf: 268, heading: 'Temple of Despair Threat' },
    records: { threat: 'table.quest.temple_despair.threat' },
  },
  {
    id: 'quest.ancient_lands.amenhotep',
    title: 'Halls of Amenhotep',
    chapter: 'Quests into the Ancient Lands',
    start: '1d6',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: [],
    cite: { page: 268, pdf: 270, heading: 'Halls of Amenhotep Threat' },
    records: { threat: 'table.quest.amenhotep.threat' },
  },
  {
    id: 'quest.ancient_lands.khaba',
    title: 'Crypt of Khaba',
    chapter: 'Quests into the Ancient Lands',
    start: '1d6',
    min: 'start',
    max: 20,
    thresholds: [],
    notes: [],
    cite: { page: 269, pdf: 271, heading: 'Crypt of Khaba Threat' },
    records: { threat: 'table.quest.khaba.threat' },
  },
];

export function questById(id: string | null | undefined): QuestPreset | undefined {
  return id ? QUESTS.find((quest) => quest.id === id) : undefined;
}

/** What the rulebook does not say, so the table never pretends it does. */
export const GAPS = {
  scenarioBonusAgain:
    'The table says the +1 on Scenario die rolls can only happen once, and it already applies. The printed Threat decrease is applied here; undo it if you rule otherwise.',
  newLevelValue:
    'The book says the Threat Level is reset on a new level of a multilevel dungeon, but not to what value. The table resets it to the quest start value.',
  deathStartValue:
    'The book gives the Party Morale start value once, from the heroes who set out; it does not say the start value changes when a hero dies, so the table keeps it.',
  battleScenarioStart:
    'The combat turn flowchart rolls the Scenario die when the last initiative token is drawn, not when enemies are first placed.',
  maxLevel:
    'The book says reaching the quest max triggers a Wandering Monster. It does not say whether Threat can rise past the max or whether staying at it triggers again; the table holds Threat at the max.',
  darkness:
    'The corpus records what a lit light source gives (+5 Fear/Terror for all, +5/+10 Perception for the carrier) and that Night Vision ignores darkness. It does not yet record what darkness does to everyone else; check the rulebook.',
  thresholdCrossed:
    'The book says a Wandering Monster appears every time Threat is increased to the threshold. Threat passed the threshold without landing on it; decide whether that counts.',
} as const;
