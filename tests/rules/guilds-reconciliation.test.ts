// Derived branch fixtures for the guild rules on PDF 148–157 (printed 146–155) and the changelog
// 2.21 rulings applied to them (entries 173, 174, 177, 178, 179).
import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const rule = (id: string, inputs: State) =>
  runCase({ rule_ids: [`character.settlement.${id}`], inputs } as TestCase, corpus);
const fires = (id: string, inputs: State) =>
  rule(id, inputs).trace.includes(`character.settlement.${id}`);
const proc = (id: string, inputs: State) =>
  runCase({ procedure_id: `procedure.${id}`, inputs } as TestCase, corpus);

describe('guild Skill Training applies to the professions each guild names', () => {
  it.each([
    ['guild.dark.training', 'thief', true],
    ['guild.dark.training', 'rogue', true],
    ['guild.dark.training', 'warrior', false],
    ['guild.fighters.training', 'warrior', true],
    ['guild.fighters.training', 'barbarian', true],
    ['guild.fighters.training', 'wizard', false],
    ['guild.wizards.training', 'wizard', true],
    ['guild.wizards.training', 'ranger', false],
    ['guild.rangers.training', 'ranger', true],
    ['guild.rangers.training', 'thief', false],
  ])('%s for %s: %s', (id, profession, expected) => {
    expect(fires(id, { profession })).toBe(expected);
  });
  it('keeps the printed +3 for 300 c, once per skill between two dungeons', () => {
    expect(rule('guild.dark.training', { profession: 'rogue' }).state).toMatchObject({
      trainable_skills: 'CS, RS, Pick Locks, Perception',
      skill_increase: 3,
      cost: 300,
      sessions_per_skill_between_dungeons: 1,
    });
    expect(rule('guild.alchemists.training', {}).state.trainable_skills).toBe(
      'Alchemy, Heal, Perception',
    );
  });
});

describe('Nightstalker armour — PDF 148', () => {
  const darkness = (inputs: State) =>
    runCase(
      {
        rule_ids: [
          'character.settlement.guild.dark.dark_as_the_night',
          'character.settlement.guild.dark.dark_as_the_night_all_zones',
        ],
        inputs,
      } as TestCase,
      corpus,
    );
  it('one to three Dark as the Night parts give -5, not cumulative', () => {
    for (const parts of [1, 2, 3]) {
      const r = darkness({
        dark_as_the_night_parts_worn: parts,
        nightstalker_on_all_hit_zones: false,
      });
      expect(r.state.enemy_strike_or_shoot_modifier).toBe(-5);
    }
  });
  it('Nightstalker on all hit zones gives -10 instead', () => {
    const r = darkness({ dark_as_the_night_parts_worn: 3, nightstalker_on_all_hit_zones: true });
    expect(r.state.enemy_strike_or_shoot_modifier).toBe(-10);
    expect(r.trace).not.toContain('character.settlement.guild.dark.dark_as_the_night');
  });
  it('no Dark as the Night part gives no modifier', () => {
    expect(
      fires('guild.dark.dark_as_the_night', {
        dark_as_the_night_parts_worn: 0,
        nightstalker_on_all_hit_zones: false,
      }),
    ).toBe(false);
  });
  it('counts as Tier 2 leather armour with Durability 8', () => {
    expect(rule('guild.dark.nightstalker', {}).state).toMatchObject({
      armour_tier: 2,
      armour_type: 'leather',
      durability: 8,
    });
  });
});

describe('Dark Guild traps — PDF 149–150', () => {
  it('only a Rogue or Thief uses the traps', () => {
    expect(fires('guild.dark.traps', { profession: 'rogue' })).toBe(true);
    expect(fires('guild.dark.traps', { profession: 'thief' })).toBe(true);
    expect(fires('guild.dark.traps', { profession: 'ranger' })).toBe(false);
  });
  it.each<[State, boolean]>([
    [{ distance_squares: 2, enemy_adjacent_to_thrower: false }, true],
    [{ distance_squares: 1, enemy_adjacent_to_thrower: false }, true],
    [{ distance_squares: 3, enemy_adjacent_to_thrower: false }, false],
    [{ distance_squares: 2, enemy_adjacent_to_thrower: true }, false],
  ])('Caltrops throw %j: %s', (inputs, expected) => {
    expect(fires('guild.dark.caltrops', inputs)).toBe(expected);
  });
  it.each<[State, boolean]>([
    [{ ongoing_battle: false, in_quick_slot: true }, true],
    [{ ongoing_battle: true, in_quick_slot: true }, false],
    [{ ongoing_battle: false, in_quick_slot: false }, false],
  ])('Tripwire setup %j: %s', (inputs, expected) => {
    expect(fires('guild.dark.tripwire', inputs)).toBe(expected);
  });
  it('the Bear Trap cannot be placed during an ongoing battle', () => {
    expect(fires('guild.dark.bear_trap', { ongoing_battle: false })).toBe(true);
    expect(fires('guild.dark.bear_trap', { ongoing_battle: true })).toBe(false);
  });
});

describe('Fighters’ Guild equipment — PDF 152', () => {
  const addon: State = {
    armour_type: 'leather',
    armour_has_def_in_area: true,
    same_addon_already_worn: false,
  };
  it.each<[State, boolean]>([
    [{}, true],
    [{ armour_type: 'padded' }, true],
    [{ armour_type: 'mail' }, true],
    [{ armour_type: 'plate' }, false],
    [{ armour_has_def_in_area: false }, false],
    [{ same_addon_already_worn: true }, false],
  ])('add-on %j: %s', (override, expected) => {
    expect(fires('guild.fighters.addons', { ...addon, ...override })).toBe(expected);
  });
  it.each<[State, boolean]>([
    [{ edged_weapon: true, at_full_durability: true }, true],
    [{ edged_weapon: false, at_full_durability: true }, false],
    [{ edged_weapon: true, at_full_durability: false }, false],
  ])('Slayer treatment %j: %s', (inputs, expected) => {
    expect(fires('guild.fighters.slayer', inputs)).toBe(expected);
  });
  it('Pain Killer applies only to a hero with a wound status marker', () => {
    expect(fires('guild.fighters.pain_killer', { has_wound_status_marker: true })).toBe(true);
    expect(fires('guild.fighters.pain_killer', { has_wound_status_marker: false })).toBe(false);
  });
});

describe('Wizards’ Guild — PDF 153', () => {
  it('only a wizard learns spells here', () => {
    expect(fires('guild.wizards.learning', { profession: 'wizard' })).toBe(true);
    expect(fires('guild.wizards.learning', { profession: 'warrior_priest' })).toBe(false);
  });
  it('recharges only a broken Magic Item that has been repaired', () => {
    expect(
      rule('guild.wizards.charging', { broken_magic_item_repaired: true }).state,
    ).toMatchObject({ recharge_cost: 250 });
    expect(fires('guild.wizards.charging', { broken_magic_item_repaired: false })).toBe(false);
  });
  it('changelog 2.21 entry 174: automatic success covers only the spell contained in the staff', () => {
    expect(
      rule('guild.wizards.staff_casting', { spell_contained_in_staff: true }).state,
    ).toMatchObject({ casting_automatically_succeeds: true, normal_casting_action_points: 2 });
    expect(fires('guild.wizards.staff_casting', { spell_contained_in_staff: false })).toBe(false);
  });
  const access: State = {
    settlement: 'silver_city',
    profession: 'thief',
    guild: 'wizards',
    business_allowed: true,
    leaving_on_quest: false,
  };
  it('changelog 2.21 entry 173: visitors may enter to recharge or to identify magic items only', () => {
    for (const operation of ['recharge', 'identify'])
      expect(proc('guild_access', { ...access, operation }).state.access_granted).toBe(true);
    for (const operation of ['training', 'learn_spell', 'buy'])
      expect(proc('guild_access', { ...access, operation }).state.access_granted).toBe(false);
  });
});

describe('Alchemists’ Guild — PDF 154', () => {
  it('changelog 2.21 entry 177: no listed part is withheld from sale', () => {
    expect(rule('guild.alchemists.purchases', {}).state).toMatchObject({
      component_cost: 15,
      listed_parts_withheld: false,
      weak_always_available: true,
      standard_availability: 5,
      supreme_availability: 4,
    });
    const table = corpus.tables.find((t) => t.id === 'table.guild.alchemist_availability')!;
    expect(table.rows.some((row) => row.cells.component?.printed === 'Human blood')).toBe(true);
  });
});

describe('Rangers’ Guild — PDF 156–157', () => {
  it('special talents are for a ranger', () => {
    expect(fires('guild.rangers.talents', { profession: 'ranger' })).toBe(true);
    expect(fires('guild.rangers.talents', { profession: 'warrior' })).toBe(false);
  });
  const skinning: State = {
    talent_known: true,
    animal_caught: true,
    has_skinning_knife: true,
    skinning_roll_succeeded: true,
  };
  it.each<[State, boolean]>([
    [{}, true],
    [{ talent_known: false }, false],
    [{ animal_caught: false }, false],
    [{ has_skinning_knife: false }, false],
    [{ skinning_roll_succeeded: false }, false],
  ])('Skinning %j: %s', (override, expected) => {
    expect(fires('guild.rangers.skinning', { ...skinning, ...override })).toBe(expected);
  });
  it.each([
    [61, 29, true],
    [61, 30, false],
    [60, 29, true],
    [60, 30, false],
  ])(
    'Butcher: skill %i, roll %i gives 2 rations: %s',
    (foraging_skill, foraging_roll, expected) => {
      expect(
        fires('guild.rangers.butcher', { talent_known: true, foraging_skill, foraging_roll }),
      ).toBe(expected);
    },
  );
  const trophy: State = {
    talent_known: true,
    party_killed_large_creature: true,
    foraging_roll_succeeded: true,
    trophy_taken_this_quest: false,
  };
  it.each<[State, boolean]>([
    [{}, true],
    [{ party_killed_large_creature: false }, false],
    [{ foraging_roll_succeeded: false }, false],
    [{ trophy_taken_this_quest: true }, false],
  ])('Taxidermist trophy %j: %s', (override, expected) => {
    expect(fires('guild.rangers.taxidermist', { ...trophy, ...override })).toBe(expected);
  });
  it('one sale attempt per settlement', () => {
    expect(fires('guild.rangers.trophy_sale', { sale_attempted_in_settlement: false })).toBe(true);
    expect(fires('guild.rangers.trophy_sale', { sale_attempted_in_settlement: true })).toBe(false);
  });
  it('a settlement with no printed column leaves the sale unresolved and unsold', () => {
    const r = proc('ranger_trophy_sale', {
      settlement_type: 'port',
      profession: 'ranger',
      taxidermist_known: true,
      trophy_available: true,
      sale_attempted_here: false,
      activity_authorized: true,
      reserved_activity_points: 1,
      duration_completed: true,
      business_allowed: true,
      leaving_on_quest: false,
      sale_roll: 20,
      creature_xp: 500,
      coins: 100,
    });
    expect(r.unresolved).toContain('issue.guild.trophy_sale_settlement_column');
    expect(r.state).toMatchObject({ coins: 100, sold: false, trophy_available: true });
  });
  it('changelog 2.21 entries 178/179: barbed ammunition has 0 ENC and the Compass DUR 1', () => {
    for (const id of ['barbed_arrows', 'barbed_bolts'])
      expect(rule(`equipment.${id}`, { selected: true }).state.encumbrance).toBe(0);
    expect(rule('equipment.compass', { selected: true }).state.durability).toBe(1);
    const table = corpus.tables.find((t) => t.id === 'table.guild.rangers_equipment')!;
    expect(table.rows[1]?.cells.enc?.printed).toBe('1');
  });
});
