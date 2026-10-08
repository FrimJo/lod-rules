import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canReroll, derive, initialState, keptDie, randomTalentFrom, reduce, reduceAll, reviveState, rerollsUsed, type CharacterEvent, type CharacterState } from '../src/character/engine.ts';
import { TALENTS } from '../src/character/rules.ts';

const dwarfWarrior: CharacterEvent[] = [
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

const build = (events: CharacterEvent[]): CharacterState => reduceAll(initialState(), events);

test('a dwarf warrior: stats, Hit Points, DB, NA, skills and pools follow the book', () => {
  const state = build(dwarfWarrior);
  const d = derive(state);
  assert.deepEqual(d.rolled, { str: 50, con: 40, dex: 28, wis: 27, res: 37 });
  assert.deepEqual(d.stats, { str: 60, con: 45, dex: 28, wis: 27, res: 47 }, 'Disciplined adds +10 RES');
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
  assert.ok(d.complete.species && d.complete.stats && d.complete.specialise && d.complete.profession && d.complete.background);
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
  let state = build([{ type: 'set_species', species: 'human' }, { type: 'roll_stat', stat: 'str', value: 2 }, { type: 'roll_hit_points', value: 1 }]);
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
  assert.equal(reduce(state, { type: 'roll_stat', stat: 'dex', value: 11 }), state, 'a d10 shows at most 10');
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
  assert.equal(derive(state).complete.profession, false, 'the Arcane perk is still open');
  state = reduce(state, { type: 'set_arcane_perk', perkId: 'quick_focus' });
  assert.equal(derive(state).skills.find((s) => s.id === 'arcane_art')!.value, 51 + 10);
});

test('a halfling starts with 1 Luck, a Warrior Priest with 2 Energy, the Noble with 400 c', () => {
  const halfling = derive(build([{ type: 'set_species', species: 'halfling' }]));
  assert.equal(halfling.luck, 1);
  const priest = build([{ type: 'set_species', species: 'human' }, { type: 'set_profession', profession: 'warrior_priest' }]);
  assert.equal(derive(priest).energy, 2);
  const noble = reduceAll(priest, [{ type: 'set_background_enabled', enabled: true }, { type: 'set_background_roll', roll: 12 }]);
  assert.equal(derive(noble).coins.start, 400);
  const badTempered = reduce(noble, { type: 'set_background_roll', roll: 8 });
  assert.equal(derive(badTempered).sanity, 10);
  assert.deepEqual(derive(badTempered).partyMoraleNotes, [{ amount: -2, source: 'Bad Tempered' }]);
  assert.equal(reduce(noble, { type: 'set_background_roll', roll: 21 }), noble, 'there are twenty Backgrounds');
});

test('starting equipment, the dwarf ranger ruling, wear and coins', () => {
  let state = build([...dwarfWarrior, { type: 'set_profession', profession: 'ranger' }, { type: 'set_talent_choice', talentId: 'hunter' }]);
  let d = derive(state);
  const bow = d.equipment.find((line) => line.key === 'start:longbow')!;
  assert.equal(bow.weapon?.id, 'shortbow', 'a Dwarf Ranger takes a Shortbow under the designer ruling');
  assert.equal(bow.durabilityMax, 6);
  assert.equal(d.complete.equipment, false, 'wear is still to roll');
  state = reduce(state, { type: 'set_wear', key: 'start:longbow', value: 4 });
  d = derive(state);
  assert.equal(d.equipment.find((line) => line.key === 'start:longbow')!.durabilityLeft, 2);
  assert.ok(d.complete.equipment);
  assert.equal(d.skills.find((s) => s.id === 'foraging')!.value, 45 + 15 + 10, 'Hunter adds +10 Foraging');

  state = reduce(state, { type: 'add_purchase', purchase: { kind: 'armour', id: 'mail_shirt', label: 'Mail Shirt', cost: 600, enc: 6, quantity: 1, damageable: true } });
  d = derive(state);
  assert.equal(d.coins.left, 150 - 600);
  assert.ok(d.warnings.some((w) => w.includes('cost more than the starting coins')));
  assert.equal(d.complete.equipment, false);
  const key = state.purchases[0]!.key;
  state = reduce(state, { type: 'set_wear', key, value: 4 });
  assert.equal(derive(state).equipment.find((line) => line.key === key)!.durabilityLeft, 2);
  state = reduce(state, { type: 'remove_purchase', key });
  assert.equal(derive(state).coins.left, 150);
  assert.ok(!(key in state.wear));
});

test('a Staff keeps at least 1 Durability after a wear roll of 4', () => {
  const state = build([{ type: 'set_species', species: 'human' }, { type: 'set_profession', profession: 'wizard' }, { type: 'set_wear', key: 'start:staff', value: 4 }]);
  const staff = derive(state).equipment.find((line) => line.key === 'start:staff')!;
  assert.equal(staff.durabilityMax, 4);
  assert.equal(staff.durabilityLeft, 1);
});

test('a weapon of choice is checked against STR, species and the profession limit', () => {
  let state = build([...dwarfWarrior, { type: 'set_weapon_choice', weaponId: 'greatsword' }]);
  assert.deepEqual(derive(state).warnings, [], 'STR 60 wields a Class 5 weapon with two hands');
  state = reduce(state, { type: 'set_weapon_choice', weaponId: 'longbow' });
  assert.ok(derive(state).warnings.some((w) => w.includes('cannot use Longbows')));
  state = build([...dwarfWarrior, { type: 'set_profession', profession: 'thief' }, { type: 'add_purchase', purchase: { kind: 'weapon', id: 'longsword', label: 'Longsword', cost: 100, enc: 10, quantity: 1, damageable: true } }]);
  assert.ok(derive(state).warnings.some((w) => w.includes('heavier than Class 2')));
  const weak = build([{ type: 'set_species', species: 'halfling' }, { type: 'roll_stat', stat: 'str', value: 1 }, { type: 'set_profession', profession: 'barbarian' }, { type: 'set_weapon_choice', weaponId: 'greataxe' }]);
  assert.ok(derive(weak).warnings.some((w) => w.includes('STR 21 is below the 55')));
});

test('the human random talent is flagged, not blocked, when the book restricts it', () => {
  let state = build([{ type: 'set_species', species: 'human' }, { type: 'set_profession', profession: 'warrior' }, { type: 'set_talent_choice', talentId: 'braveheart' }, { type: 'set_random_talent_category', category: 'physical' }]);
  assert.equal(derive(state).complete.profession, false, 'the random talent is still to roll');
  state = reduce(state, { type: 'set_random_talent', talentId: 'observant' });
  assert.ok(derive(state).warnings.some((w) => w.startsWith('Observant: "Rangers only."')));
  state = reduce(state, { type: 'set_random_talent', talentId: 'strong_build' });
  const d = derive(state);
  assert.deepEqual(d.warnings, []);
  assert.ok(d.complete.profession);
  state = reduce(state, { type: 'set_random_talent', talentId: 'hate' });
  assert.equal(derive(state).complete.profession, false, 'Hate needs an enemy');
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
  const revived = reviveState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(revived, state);
  assert.deepEqual(reviveState({ version: 0 }), initialState());
  assert.deepEqual(reduce(state, { type: 'reset' }), initialState());
});
