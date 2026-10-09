import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canReroll,
  currentHero,
  derive,
  deriveParty,
  handsFor,
  initialParty,
  initialState,
  keptDie,
  randomTalentFrom,
  reduce,
  reduceAll,
  reduceParty,
  reviveState,
  rerollsUsed,
  type HeroEvent,
  type CharacterState,
} from '../src/character/engine.ts';
import { TALENTS } from '../src/character/rules.ts';

const dwarfWarrior: HeroEvent[] = [
  { type: 'set_name', name: 'Torvald' },
  { type: 'set_species', species: 'dwarf' },
  { type: 'roll_stat', stat: 'str', value: 10 },
  { type: 'roll_stat', stat: 'con', value: 10 },
  { type: 'roll_stat', stat: 'dex', value: 3 },
  { type: 'roll_stat', stat: 'wis', value: 2 },
  { type: 'roll_stat', stat: 'res', value: 7 },
  { type: 'roll_hit_points', value: 4 },
  { type: 'set_specialisation', stat: 'str', points: 10 },
  { type: 'set_specialisation', stat: 'con', points: 5 },
  { type: 'set_profession', profession: 'warrior' },
  { type: 'set_talent_choice', talentId: 'mighty_blow' },
];

const build = (events: HeroEvent[]): CharacterState => reduceAll(initialState(), events);

test('a dwarf warrior: stats, Hit Points, DB, NA, skills and pools follow the book', () => {
  const state = build(dwarfWarrior);
  const d = derive(state);
  assert.deepEqual(d.rolled, { str: 50, con: 40, dex: 28, wis: 27, res: 37 });
  assert.deepEqual(
    d.stats,
    { str: 60, con: 45, dex: 28, wis: 27, res: 47 },
    'Disciplined adds +10 RES',
  );
  assert.equal(d.hitPoints, 8 + 4 + 3, '1d6+8 plus the Warrior +3');
  assert.equal(d.damageBonus, 2, 'STR 60');
  assert.equal(d.naturalArmour, 0, 'CON 45 is below 50');
  assert.equal(d.mana, null);
  assert.equal(d.energy, 1);
  assert.equal(d.luck, 0);
  assert.equal(d.sanity, 8);
  assert.equal(d.movement, 4);
  assert.equal(d.partyMoraleContribution, 4, 'RES 47 / 10 rounded down');
  const skill = (id: string) => d.skills.find((s) => s.id === id)!;
  assert.equal(skill('combat_skill').value, 28 + 10);
  assert.equal(skill('alchemy').value, 27 - 25);
  assert.equal(skill('pick_locks').value, 28 - 20);
  assert.equal(skill('arcane_art').value, null, 'N/A stays N/A');
  assert.equal(skill('perception').value, 27 - 10 + 10, 'Night Vision adds +10 Perception');
  assert.deepEqual(
    d.talents.map((t) => [t.talent.id, t.qualifier]),
    [
      ['hate', 'Goblins'],
      ['night_vision', undefined],
      ['disciplined', undefined],
      ['mighty_blow', undefined],
    ],
  );
  assert.ok(
    d.complete.species &&
      d.complete.dice &&
      d.complete.specialise &&
      d.complete.profession &&
      d.complete.powers &&
      d.complete.background,
  );
});

test('a skill level can never be negative and the Free Skill only lifts a negative modifier', () => {
  let state = build([...dwarfWarrior, { type: 'set_profession', profession: 'thief' }]);
  let d = derive(state);
  assert.equal(d.skills.find((s) => s.id === 'alchemy')!.value, 0, '27 - 30 floors at 0');
  state = reduce(state, { type: 'set_free_skill', skill: 'combat_skill' });
  assert.equal(derive(state).skills.find((s) => s.id === 'combat_skill')!.value, 28 - 5 + 10);
  state = reduce(state, { type: 'set_free_skill', skill: 'pick_locks' });
  assert.equal(state.freeSkill, 'combat_skill', 'Pick Locks has a positive modifier for a Thief');
  state = reduce(state, { type: 'set_free_skill', skill: 'arcane_art' });
  assert.equal(state.freeSkill, 'combat_skill', 'N/A cannot be the Free Skill');
  d = derive(state);
  assert.equal(d.skills.filter((s) => s.freeSkill).length, 1);
});

test('two rerolls, never a reroll of a reroll, and the highest result is kept', () => {
  let state = build([
    { type: 'set_species', species: 'human' },
    { type: 'roll_stat', stat: 'str', value: 2 },
    { type: 'roll_hit_points', value: 1 },
  ]);
  assert.equal(rerollsUsed(state), 0);
  state = reduce(state, { type: 'reroll_stat', stat: 'str', value: 1 });
  assert.equal(keptDie(state.rolls.str), 2, 'the player may choose the highest');
  assert.equal(rerollsUsed(state), 1);
  const again = reduce(state, { type: 'reroll_stat', stat: 'str', value: 9 });
  assert.equal(again, state, 'a reroll cannot be rerolled');
  state = reduce(state, { type: 'reroll_hit_points', value: 6 });
  assert.equal(keptDie(state.hitPointsRoll), 6);
  assert.equal(rerollsUsed(state), 2);
  state = reduce(state, { type: 'roll_stat', stat: 'con', value: 4 });
  assert.equal(canReroll(state, state.rolls.con), false, 'both rerolls are spent');
  assert.equal(derive(state).rerollsLeft, 0);
  assert.equal(
    reduce(state, { type: 'roll_stat', stat: 'dex', value: 11 }),
    state,
    'a d10 shows at most 10',
  );
});

test('the roll-all option assigns each die to one stat only', () => {
  let state = build([
    { type: 'set_species', species: 'elf' },
    { type: 'set_roll_mode', mode: 'assign' },
    { type: 'roll_pool', index: 0, value: 9 },
    { type: 'roll_pool', index: 1, value: 1 },
    { type: 'assign', stat: 'dex', index: 0 },
    { type: 'assign', stat: 'str', index: 0 },
  ]);
  assert.equal(state.assignment.dex, null, 'moving die 1 to STR frees DEX');
  assert.equal(state.assignment.str, 0);
  assert.equal(derive(state).rolled.str, 25 + 9);
  state = reduce(state, { type: 'reroll_pool', index: 1, value: 7 });
  assert.equal(keptDie(state.pool[1]!), 7);
  assert.equal(rerollsUsed(state), 1);
  state = reduce(state, { type: 'set_roll_mode', mode: 'in_order' });
  assert.equal(rerollsUsed(state), 0, 'the in-order dice are untouched');
});

test('specialisation spends exactly 15 points with no more than 10 on one stat', () => {
  let state = build([{ type: 'set_species', species: 'human' }]);
  state = reduce(state, { type: 'set_specialisation', stat: 'str', points: 12 });
  assert.equal(state.specialisation.str, 10);
  state = reduce(state, { type: 'set_specialisation', stat: 'dex', points: 10 });
  assert.equal(state.specialisation.dex, 5, 'only 5 points were left');
  assert.equal(derive(state).specialisationLeft, 0);
  assert.ok(derive(state).complete.specialise);
});

test('a wizard gets Mana from WIS x 1.5 and three Level 1 spells, no more', () => {
  let state = build([
    { type: 'set_species', species: 'elf' },
    { type: 'roll_stat', stat: 'wis', value: 6 },
    { type: 'set_specialisation', stat: 'wis', points: 10 },
    { type: 'set_specialisation', stat: 'res', points: 5 },
    { type: 'set_profession', profession: 'wizard' },
  ]);
  assert.equal(derive(state).mana, 51 * 1.5);
  state = reduceAll(state, [
    { type: 'toggle_spell', spellId: 'flare' },
    { type: 'toggle_spell', spellId: 'slip' },
    { type: 'toggle_spell', spellId: 'light_healing' },
    { type: 'toggle_spell', spellId: 'fake_death' },
  ]);
  assert.deepEqual(state.spells, ['flare', 'slip', 'light_healing']);
  assert.equal(derive(state).complete.powers, false, 'the Arcane perk is still open');
  state = reduce(state, { type: 'set_arcane_perk', perkId: 'quick_focus' });
  assert.equal(derive(state).skills.find((s) => s.id === 'arcane_art')!.value, 51 + 10);
});

test('a halfling starts with 1 Luck, a Warrior Priest with 2 Energy, the Noble with 400 c', () => {
  const halfling = derive(build([{ type: 'set_species', species: 'halfling' }]));
  assert.equal(halfling.luck, 1);
  const priest = build([
    { type: 'set_species', species: 'human' },
    { type: 'set_profession', profession: 'warrior_priest' },
  ]);
  assert.equal(derive(priest).energy, 2);
  const noble = reduceAll(priest, [
    { type: 'set_background_enabled', enabled: true },
    { type: 'set_background_roll', roll: 12 },
  ]);
  assert.equal(derive(noble).coins.start, 400);
  const badTempered = reduce(noble, { type: 'set_background_roll', roll: 8 });
  assert.equal(derive(badTempered).sanity, 10);
  assert.deepEqual(derive(badTempered).partyMoraleNotes, [{ amount: -2, source: 'Bad Tempered' }]);
  assert.equal(
    reduce(noble, { type: 'set_background_roll', roll: 21 }),
    noble,
    'there are twenty Backgrounds',
  );
});

test('starting equipment, the dwarf ranger ruling, wear and coins', () => {
  let state = build([
    ...dwarfWarrior,
    { type: 'set_profession', profession: 'ranger' },
    { type: 'set_talent_choice', talentId: 'hunter' },
  ]);
  let d = derive(state);
  const bow = d.equipment.find((line) => line.key === 'start:longbow')!;
  assert.equal(
    bow.weapon?.id,
    'shortbow',
    'a Dwarf Ranger takes a Shortbow under the designer ruling',
  );
  assert.equal(bow.durabilityMax, 6);
  assert.equal(d.complete.loadout, false, 'wear is still to roll');
  assert.ok(d.todo.some((t) => t.station === 'loadout' && t.label.startsWith('Roll 1d4 wear')));
  state = reduce(state, { type: 'set_wear', key: 'start:longbow', value: 4 });
  d = derive(state);
  assert.equal(d.equipment.find((line) => line.key === 'start:longbow')!.durabilityLeft, 2);
  assert.ok(d.complete.loadout);
  assert.ok(d.complete.market);
  assert.equal(
    d.skills.find((s) => s.id === 'foraging')!.value,
    45 + 15 + 10,
    'Hunter adds +10 Foraging',
  );

  state = reduce(state, {
    type: 'add_purchase',
    purchase: {
      kind: 'armour',
      id: 'mail_shirt',
      label: 'Mail Shirt',
      cost: 600,
      enc: 6,
      quantity: 1,
      damageable: true,
    },
  });
  d = derive(state);
  assert.equal(d.coins.left, 150 - 600);
  assert.ok(d.warnings.some((w) => w.includes('cost more than the starting coins')));
  assert.equal(d.complete.market, false);
  assert.ok(d.todo.some((t) => t.id === 'coins' && t.severity === 'warn'));
  const key = state.purchases[0]!.key;
  state = reduce(state, { type: 'set_wear', key, value: 4 });
  assert.equal(derive(state).equipment.find((line) => line.key === key)!.durabilityLeft, 2);
  state = reduce(state, { type: 'remove_purchase', key });
  assert.equal(derive(state).coins.left, 150);
  assert.ok(!(key in state.wear));
});

test('a Staff keeps at least 1 Durability after a wear roll of 4', () => {
  const state = build([
    { type: 'set_species', species: 'human' },
    { type: 'set_profession', profession: 'wizard' },
    { type: 'set_wear', key: 'start:staff', value: 4 },
  ]);
  const staff = derive(state).equipment.find((line) => line.key === 'start:staff')!;
  assert.equal(staff.durabilityMax, 4);
  assert.equal(staff.durabilityLeft, 1);
});

test('a weapon of choice is checked against STR, species and the profession limit', () => {
  let state = build([...dwarfWarrior, { type: 'set_weapon_choice', weaponId: 'greatsword' }]);
  assert.deepEqual(derive(state).warnings, [], 'STR 60 wields a Class 5 weapon with two hands');
  state = reduce(state, { type: 'set_weapon_choice', weaponId: 'longbow' });
  assert.ok(derive(state).warnings.some((w) => w.includes('cannot use Longbows')));
  state = build([
    ...dwarfWarrior,
    { type: 'set_profession', profession: 'thief' },
    {
      type: 'add_purchase',
      purchase: {
        kind: 'weapon',
        id: 'longsword',
        label: 'Longsword',
        cost: 100,
        enc: 10,
        quantity: 1,
        damageable: true,
      },
    },
  ]);
  assert.ok(derive(state).warnings.some((w) => w.includes('heavier than Class 2')));
  const weak = build([
    { type: 'set_species', species: 'halfling' },
    { type: 'roll_stat', stat: 'str', value: 1 },
    { type: 'set_profession', profession: 'barbarian' },
    { type: 'set_weapon_choice', weaponId: 'greataxe' },
  ]);
  assert.ok(derive(weak).warnings.some((w) => w.includes('STR 21 is below the 55')));
});

test('the human random talent is flagged, not blocked, when the book restricts it', () => {
  let state = build([
    { type: 'set_species', species: 'human' },
    { type: 'set_profession', profession: 'warrior' },
    { type: 'set_talent_choice', talentId: 'braveheart' },
    { type: 'set_random_talent_category', category: 'physical' },
  ]);
  assert.equal(derive(state).complete.powers, false, 'the random talent is still to roll');
  state = reduce(state, { type: 'set_random_talent', talentId: 'observant' });
  assert.ok(derive(state).warnings.some((w) => w.startsWith('Observant: "Rangers only."')));
  state = reduce(state, { type: 'set_random_talent', talentId: 'strong_build' });
  const d = derive(state);
  assert.deepEqual(d.warnings, []);
  assert.ok(d.complete.powers);
  state = reduce(state, { type: 'set_random_talent', talentId: 'hate' });
  assert.equal(derive(state).complete.powers, false, 'Hate needs an enemy');
  state = reduce(state, { type: 'set_hate_target', target: 'Orcs' });
  assert.deepEqual(derive(state).talents.find((t) => t.talent.id === 'hate')?.qualifier, 'Orcs');
  const picked = randomTalentFrom('sneaky', TALENTS, () => 0);
  assert.equal(picked.id, 'assassin');
  assert.equal(randomTalentFrom('sneaky', TALENTS, () => 0.999).id, 'trapfinder');
});

test('changing species keeps the dice, changing profession clears its choices, and saves revive', () => {
  let state = build(dwarfWarrior);
  state = reduce(state, { type: 'set_species', species: 'elf' });
  assert.equal(keptDie(state.rolls.str), 10);
  assert.equal(derive(state).rolled.str, 25 + 10);
  state = reduce(state, { type: 'set_profession', profession: 'rogue' });
  assert.equal(state.talentChoice, null);
  const party = { ...initialParty(), heroes: [state], currentId: state.id };
  const revived = reviveState(JSON.parse(JSON.stringify(party)));
  assert.deepEqual(revived, party);
  assert.deepEqual(reviveState({ version: 0 }), initialParty());
  assert.deepEqual(reduce(state, { type: 'reset' }), initialState(state.id));
  // A version 1 save held one hero under the old step names and becomes a party of one.
  const old = { ...JSON.parse(JSON.stringify(state)), version: 1, step: 'equipment' } as Record<
    string,
    unknown
  >;
  delete old.id;
  delete old.alchemy;
  delete old.placement;
  delete old.copied;
  const migrated = reviveState(old);
  assert.equal(migrated.heroes.length, 1);
  assert.equal(migrated.heroes[0]!.step, 'market');
  assert.equal(migrated.heroes[0]!.profession, 'rogue');
  assert.deepEqual(migrated.heroes[0]!.alchemy, initialState().alchemy);
});

test('a party holds several heroes, switches between them and sums their Party Morale', () => {
  let party = initialParty();
  party = reduceParty(party, { type: 'set_name', name: 'Torvald' });
  for (const event of dwarfWarrior.slice(1)) party = reduceParty(party, event);
  party = reduceParty(party, { type: 'hero_new' });
  assert.equal(party.heroes.length, 2);
  assert.equal(currentHero(party).id, 'hero2');
  party = reduceParty(party, { type: 'set_name', name: 'Ilse' });
  party = reduceParty(party, { type: 'set_species', species: 'halfling' });
  party = reduceParty(party, { type: 'roll_stat', stat: 'res', value: 10 });
  party = reduceParty(party, { type: 'set_specialisation', stat: 'res', points: 10 });
  party = reduceParty(party, { type: 'set_profession', profession: 'rogue' });
  const d = deriveParty(party);
  assert.deepEqual(d.moraleParts, [
    { name: 'Torvald', amount: 4 },
    { name: 'Ilse', amount: 6 },
  ]);
  assert.equal(d.morale, 10);
  party = reduceParty(party, { type: 'hero_select', id: 'hero1' });
  assert.equal(currentHero(party).name, 'Torvald');
  party = reduceParty(party, { type: 'hero_remove', id: 'hero1' });
  assert.equal(party.heroes.length, 1);
  assert.equal(currentHero(party).name, 'Ilse');
  party = reduceParty(party, { type: 'hero_remove', id: 'hero2' });
  assert.equal(party.heroes.length, 1, 'removing the last hero leaves a fresh sheet');
  assert.equal(currentHero(party).name, '');
  assert.equal(
    reduceParty(party, { type: 'set_start_settlement', roll: 9 }),
    party,
    'the list has eight entries',
  );
  assert.equal(reduceParty(party, { type: 'set_start_settlement', roll: 3 }).startSettlement, 3);
});

test('the loadout puts weapons in hands, armour on the body, gear in Quick Slots then the backpack', () => {
  let state = build([...dwarfWarrior, { type: 'set_weapon_choice', weaponId: 'greatsword' }]);
  let d = derive(state);
  const sword = d.loadout.items.find((p) => p.line.key === 'start:weapon')!;
  assert.equal(sword.place, 'hands');
  assert.equal(sword.takes, 2, 'Class 5 needs two hands');
  assert.equal(
    handsFor(d.equipment.find((l) => l.key === 'start:weapon')!.weapon!, d.weaponClasses),
    2,
  );
  assert.equal(d.loadout.areas.torso.def, 3, 'the Leather Jacket covers the torso');
  assert.equal(d.loadout.areas.arms.def, 3);
  assert.equal(d.loadout.areas.head.def, 0);
  state = reduce(state, {
    type: 'add_purchase',
    purchase: {
      kind: 'shield',
      id: 'heater_shield',
      label: 'Heater Shield',
      cost: 100,
      enc: 10,
      quantity: 1,
      damageable: true,
    },
  });
  d = derive(state);
  const shieldKey = state.purchases[0]!.key;
  assert.equal(
    d.loadout.items.find((p) => p.line.key === shieldKey)!.suggested,
    'backpack',
    'both hands hold the greatsword',
  );
  assert.deepEqual(d.loadout.warnings, []);
  state = reduce(state, { type: 'set_placement', key: shieldKey, place: 'hands' });
  d = derive(state);
  assert.ok(d.loadout.warnings.some((w) => w.includes('two-handed weapon and a shield')));
  assert.ok(d.todo.some((t) => t.station === 'loadout' && t.severity === 'warn'));
  state = reduce(state, { type: 'set_placement', key: shieldKey, place: null });
  d = derive(state);
  assert.deepEqual(d.loadout.warnings, []);
  assert.equal(d.loadout.backpack.length, 1);

  state = reduce(state, {
    type: 'add_purchase',
    purchase: {
      kind: 'gear',
      id: 'ration',
      label: 'Ration',
      cost: 5,
      enc: 1,
      quantity: 4,
      damageable: false,
    },
  });
  state = reduce(state, {
    type: 'add_purchase',
    purchase: {
      kind: 'gear',
      id: 'ration',
      label: 'Ration',
      cost: 5,
      enc: 1,
      quantity: 2,
      damageable: false,
    },
  });
  assert.equal(state.purchases.length, 2, 'the same line is bought once more, not listed twice');
  assert.equal(state.purchases[1]!.quantity, 6);
  state = reduce(state, {
    type: 'add_purchase',
    purchase: {
      kind: 'gear',
      id: 'torch',
      label: 'Torch',
      cost: 15,
      enc: 1,
      quantity: 2,
      damageable: false,
    },
  });
  d = derive(state);
  assert.equal(d.loadout.quick.capacity, 3);
  assert.equal(
    d.loadout.quick.used,
    2,
    'the two torches take a slot each; six rations (1/1) do not fit',
  );
  assert.equal(d.loadout.backpack.length, 2, 'what does not fit goes to the backpack');
  assert.equal(d.loadout.items.find((p) => p.line.key === 'start:backpack')!.place, 'worn');
  state = reduce(state, {
    type: 'add_purchase',
    purchase: {
      kind: 'gear',
      id: 'extended_battle_belt',
      label: 'Extended Battle Belt',
      cost: 300,
      enc: 0,
      quantity: 1,
      damageable: true,
    },
  });
  d = derive(state);
  assert.equal(d.loadout.quick.capacity, 4);
  assert.equal(
    d.encumbrance.carried,
    4 + 20 + 6 + 2 + 10,
    'jacket 4, greatsword 20, rations 6, torches 2; the shield in the backpack still weighs 10',
  );
});

test('stacked and Clunky armour, the Medium backpack and overload show as standing effects', () => {
  let state = build([...dwarfWarrior, { type: 'set_weapon_choice', weaponId: 'dagger' }]);
  state = reduce(state, {
    type: 'add_purchase',
    purchase: {
      kind: 'armour',
      id: 'mail_shirt',
      label: 'Mail Shirt',
      cost: 600,
      enc: 6,
      quantity: 1,
      damageable: true,
    },
  });
  let d = derive(state);
  assert.ok(
    d.loadout.warnings.some((w) => w.startsWith('Torso:')),
    'a Leather Jacket is not Stackable',
  );
  state = reduce(state, { type: 'remove_purchase', key: state.purchases[0]!.key });
  state = reduce(state, {
    type: 'add_purchase',
    purchase: {
      kind: 'armour',
      id: 'helmet',
      label: 'Helmet',
      cost: 300,
      enc: 5,
      quantity: 1,
      damageable: true,
    },
  });
  state = reduce(state, {
    type: 'add_purchase',
    purchase: {
      kind: 'gear',
      id: 'backpack_medium',
      label: 'Backpack - Medium',
      cost: 350,
      enc: 0,
      quantity: 1,
      damageable: false,
    },
  });
  d = derive(state);
  assert.deepEqual(d.loadout.warnings, []);
  assert.deepEqual(
    d.effects.map((e) => e.id),
    ['clunky', 'pack:backpack_medium'],
  );
  assert.equal(d.encumbrance.limit, 60 + 10);
  const rogue = build([
    { type: 'set_species', species: 'halfling' },
    { type: 'roll_stat', stat: 'str', value: 1 },
    { type: 'set_profession', profession: 'rogue' },
    { type: 'set_option_choice', id: 'rapier' },
  ]);
  const rd = derive(rogue);
  assert.equal(rd.encumbrance.limit, 21 + 10, 'the printed Medium backpack adds 10');
  assert.ok(rd.effects.some((e) => e.id === 'pack:backpack_medium'));
  const over = reduce(rogue, {
    type: 'add_purchase',
    purchase: {
      kind: 'weapon',
      id: 'warhammer',
      label: 'Warhammer',
      cost: 200,
      enc: 20,
      quantity: 2,
      damageable: true,
    },
  });
  assert.ok(derive(over).effects.some((e) => e.id === 'encumbered'));
});

test('the Alchemist fills a bag of three potions, three rolled ingredients, three parts and a recipe', () => {
  let state = build([
    { type: 'set_species', species: 'human' },
    { type: 'set_profession', profession: 'alchemist' },
  ]);
  let d = derive(state);
  assert.ok(d.todo.some((t) => t.id === 'alchemy'));
  state = reduceAll(state, [
    { type: 'toggle_potion', rowId: 'row_6' },
    { type: 'toggle_potion', rowId: 'row_2' },
    { type: 'toggle_potion', rowId: 'row_3' },
    { type: 'toggle_potion', rowId: 'row_4' },
  ]);
  assert.deepEqual(
    state.alchemy.potions,
    ['row_2', 'row_3', 'row_4'],
    'a fourth potion replaces the oldest pick',
  );
  state = reduceAll(state, [
    { type: 'set_ingredient', index: 0, roll: 1 },
    { type: 'set_ingredient', index: 1, roll: 20 },
    { type: 'set_ingredient', index: 2, roll: 21 },
  ]);
  assert.equal(state.alchemy.ingredients[2], null, 'a d20 shows at most 20');
  state = reduce(state, { type: 'set_ingredient', index: 2, roll: 10 });
  state = reduceAll(state, [
    { type: 'toggle_part', rowId: 'row_1' },
    { type: 'toggle_part', rowId: 'row_11' },
    { type: 'toggle_part', rowId: 'row_21' },
  ]);
  state = reduce(state, { type: 'set_recipe', recipe: 'Potion of Health' });
  d = derive(state);
  assert.equal(
    d.equipment.find((l) => l.key === 'start:ingredients')!.label,
    'Lunarberry, Barbed Wormwood, Monk’s Laurel',
  );
  assert.equal(
    d.equipment.find((l) => l.key === 'start:parts')!.label,
    'Amphibian skin, Feathers, Scales',
  );
  assert.equal(
    d.equipment.find((l) => l.key === 'start:potions')!.label,
    'Potion of Constitution, Potion of Courage, Potion of Dexterity',
  );
  assert.ok(!d.todo.some((t) => t.id === 'alchemy'));
  assert.ok(d.complete.market);
});

test('the todo queue names what is still open, in the order of the book', () => {
  const d = derive(
    build([
      { type: 'set_species', species: 'human' },
      { type: 'set_profession', profession: 'warrior_priest' },
    ]),
  );
  assert.deepEqual(
    d.todo.map((t) => t.id),
    [
      'dice',
      'hp',
      'random_talent',
      'talent_choice',
      'prayers',
      'relic',
      'choose:start:weapon',
    ].sort((a, b) => d.todo.findIndex((t) => t.id === a) - d.todo.findIndex((t) => t.id === b)),
  );
  assert.equal(d.todo[0]!.station, 'dice');
  assert.equal(d.todo.find((t) => t.id === 'prayers')!.label, 'Pick 2 more level 1 prayers');
});

test('copying ticks persist per hero and a purchase can opt out of wear', () => {
  let state = build([...dwarfWarrior, { type: 'toggle_copied', field: 'stat:str' }]);
  assert.equal(state.copied['stat:str'], true);
  state = reduce(state, { type: 'toggle_copied', field: 'stat:str' });
  assert.equal(state.copied['stat:str'], false);
  state = reduce(state, {
    type: 'add_purchase',
    purchase: {
      kind: 'gear',
      id: 'crowbar',
      label: 'Crowbar',
      cost: 55,
      enc: 10,
      quantity: 1,
      damageable: true,
    },
  });
  const key = state.purchases[0]!.key;
  assert.equal(derive(state).equipment.find((l) => l.key === key)!.durabilityMax, 6);
  state = reduce(state, { type: 'set_wear', key, value: 2 });
  state = reduce(state, { type: 'set_purchase_damageable', key, damageable: false });
  const line = derive(state).equipment.find((l) => l.key === key)!;
  assert.equal(line.damageable, false);
  assert.equal(line.wear, null);
  assert.equal(line.durabilityMax, 6, 'the printed DUR still shows');
  state = reduce(state, { type: 'set_purchase_quantity', key, quantity: 0 });
  assert.equal(state.purchases.length, 0, 'quantity 0 removes the line');
});
