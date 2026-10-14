import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (id: string, inputs: State) =>
  runCase({ procedure_id: 'procedure.' + id, inputs } as TestCase, corpus);
const movement: State = {
  day: 0,
  movement_day: -1,
  event_day: 0,
  movement_points: 0,
  hex_index: 0,
  terrain: 'road',
  transport_mode: 'walking',
  all_heroes_have_camels: false,
  route_legal: true,
};
const food: State = {
  has_trees: false,
  phase: 'food',
  food_choice: 'rations',
  terrain: 'road',
  day: 0,
  food_day: -1,
  hero_food_day: -1,
  hero_rest_day: -1,
  forage_day: -1,
  rations_available: 3,
  party_fed: false,
  hunger_morale_active: false,
  hunger_morale_loss: 0,
  // Four characters, no dog: changelog 2.21 entry 166 makes the hunger penalty -1 per character.
  party_member_count: 4,
  dog_count: 0,
  hungry: false,
  constitution: 31,
  hunger_constitution_loss: 0,
  party_morale: 8,
  foraging_skill: 40,
  equipment_foraging_modifier: 0,
  foraging_roll: 30,
  at_settlement: false,
  bedroll: false,
  hp_roll: 3,
  energy_successes: 2,
  hit_points: 12,
  maximum_hit_points: 15,
  energy: 1,
  maximum_energy: 4,
};

describe('travel resource accounting from PDF 126–128', () => {
  it.each([
    ['road', 'walking', 1, 2],
    ['off_road', 'walking', 1.5, 1.5],
    ['desert', 'walking', 2, 1],
    ['road', 'all_riding_horses_or_camels', 1, 5],
    ['road', 'wagon_or_mule', 1, 2],
  ])('derives %s entry for %s', (terrain, transport_mode, cost, remaining) => {
    expect(
      run('travel_daily_movement', { ...movement, terrain, transport_mode }).state,
    ).toMatchObject({
      terrain_cost: cost,
      movement_points: remaining,
      hex_index: 1,
      entered_hex: true,
    });
  });
  it('keys the Desert Hex camel cost to the heroes, not to the riding allowance', () => {
    // "A Desert Hex costs 2 Movement Points, unless all heroes have camels. Then it is 1,5 points
    // per hex." is separate from "A party where all members are riding horses or camels has 6".
    const desert = { ...movement, terrain: 'desert', all_heroes_have_camels: true };
    expect(
      run('travel_daily_movement', { ...desert, transport_mode: 'all_riding_horses_or_camels' })
        .state,
    ).toMatchObject({ terrain_cost: 1.5, movement_points: 4.5, hex_index: 1 });
    expect(
      run('travel_daily_movement', { ...desert, transport_mode: 'wagon_or_mule' }).state,
    ).toMatchObject({ terrain_cost: 1.5, movement_points: 1.5, hex_index: 1 });
    expect(
      run('travel_daily_movement', {
        ...movement,
        terrain: 'desert',
        transport_mode: 'all_riding_horses_or_camels',
      }).state,
    ).toMatchObject({ terrain_cost: 2, movement_points: 4, hex_index: 1 });
    expect(
      run('travel_daily_movement', { ...desert, transport_mode: 'all_camels' }).state.hex_index,
    ).toBe(0);
  });
  it('does not replenish allowance on repeated steps and rejects an unaffordable hex', () => {
    const a = run('travel_daily_movement', { ...movement, terrain: 'off_road' });
    const b = run('travel_daily_movement', a.state);
    const c = run('travel_daily_movement', b.state);
    expect(b.state).toMatchObject({ movement_points: 0, hex_index: 2 });
    expect(c.state).toMatchObject({ movement_points: 0, hex_index: 2, entered_hex: false });
    expect(c.events).toContainEqual({ type: 'require', satisfied: false });
    expect(c.steps).not.toContain('enter_hex');
  });
  it('rejects invalid routes and movement before the daily event check', () => {
    const rejectedInputs: State[] = [
      { route_legal: false },
      { event_day: -1 },
      { terrain: 'invented' },
      { transport_mode: 'invented' },
    ];
    for (const overrides of rejectedInputs) {
      const r = run('travel_daily_movement', { ...movement, ...overrides });
      expect(r.state.hex_index).toBe(0);
      expect(r.state.entered_hex).toBe(false);
    }
    const state = run('travel_daily_movement', movement).state;
    expect(
      run('travel_daily_movement', { ...state, day: 1, event_day: 1 }).state.movement_points,
    ).toBe(2);
  });
  it('requires terrain and rejects out-of-range day input', () => {
    const { terrain: _terrain, ...missing } = movement;
    expect(() => run('travel_daily_movement', missing)).toThrow('Missing input terrain');
    expect(() => run('travel_daily_movement', { ...movement, day: -1 })).toThrow(
      'Input out of range',
    );
  });
  it('consumes one ration for the whole party and cannot eat twice on the same day', () => {
    const r = run('travel_food_and_rest', food);
    expect(r.state).toMatchObject({ food_required: 1, rations_available: 2, party_fed: true });
    expect(run('travel_food_and_rest', r.state).state.rations_available).toBe(2);
  });
  it('requires two rations for the party in Ancient Lands and forbids foraging', () => {
    // Changelog 2.21 entry 167: 'each hero' becomes 'the party'.
    expect(
      run('travel_food_and_rest', { ...food, terrain: 'ancient_lands', rations_available: 10 })
        .state,
    ).toMatchObject({ food_required: 2, rations_available: 8, party_fed: true });
    const rejected = run('travel_food_and_rest', {
      ...food,
      terrain: 'ancient_lands',
      food_choice: 'forage',
    });
    expect(rejected.steps).not.toContain('foraging_attempt');
    expect(rejected.state.food_day).toBe(-1);
    expect(rejected.state.rations_available).toBe(3);
    expect(rejected.events).toContainEqual({ type: 'require', satisfied: false });
  });
  it('surfaces partial Ancient Lands supply without inventing allocation', () => {
    const r = run('travel_food_and_rest', {
      ...food,
      terrain: 'ancient_lands',
      rations_available: 1,
    });
    expect(r.unresolved).toContain('issue.travel.partial_rations');
    expect(r.state).toMatchObject({ rations_available: 1, food_day: -1, party_morale: 8 });
  });
  it.each([
    ['trees', 50, true],
    ['road', 30, false],
    ['off_road', 40, true],
  ])('applies the %s Foraging modifier', (terrain, target, success) => {
    const r = run('travel_food_and_rest', {
      ...food,
      terrain,
      food_choice: 'forage',
      foraging_roll: 40,
    });
    expect(r.state).toMatchObject({
      foraging_target: target,
      party_fed: success,
      rations_available: 3,
      forage_day: 0,
    });
    expect(run('travel_food_and_rest', { ...r.state, foraging_roll: 1 }).steps).not.toContain(
      'foraging_attempt',
    );
  });
  it('keeps tree and road modifiers independent on a wooded road hex', () => {
    const r = run('travel_food_and_rest', {
      ...food,
      food_choice: 'forage',
      terrain: 'road',
      has_trees: true,
      foraging_roll: 40,
    });
    expect(r.state).toMatchObject({ foraging_target: 40, party_fed: true });
  });
  it('a failed Foraging attempt leaves the party without food for that day (PDF126)', () => {
    const failed = run('travel_food_and_rest', {
      ...food,
      food_choice: 'forage',
      terrain: 'road',
      foraging_roll: 31,
    });
    expect(failed.state).toMatchObject({ party_fed: false, party_morale: 4, rations_available: 3 });
    const fallback = run('travel_food_and_rest', { ...failed.state, food_choice: 'rations' });
    expect(fallback.state).toMatchObject({ party_fed: false, rations_available: 3 });
    const hero = run('travel_food_and_rest', { ...fallback.state, phase: 'hero' });
    expect(hero.state).toMatchObject({ constitution: 16, hungry: true });
  });
  it('lowers Party Morale by 1 per character, mercenaries included, not dogs (changelog 2.21 entry 166)', () => {
    // 3 heroes + 1 mercenary + 1 dog travelling with the party.
    const mixed = run('travel_food_and_rest', {
      ...food,
      rations_available: 0,
      party_member_count: 5,
      dog_count: 1,
    });
    expect(mixed.state).toMatchObject({ party_morale: 4, hunger_morale_loss: 4 });
    // Applied inline once; the Party Morale table row is a reference dependency, never invoked.
    expect(mixed.events).not.toContainEqual({
      type: 'invoke',
      dependency: 'character.morale.event.hungry',
    });
    const pair = run('travel_food_and_rest', {
      ...food,
      rations_available: 0,
      party_member_count: 2,
    });
    expect(pair.state).toMatchObject({ party_morale: 6, hunger_morale_loss: 2 });
    const invalid = run('travel_food_and_rest', {
      ...food,
      rations_available: 0,
      party_member_count: 1,
      dog_count: 2,
    });
    expect(invalid.events).toContainEqual({ type: 'require', satisfied: false });
    expect(invalid.state.party_morale).toBe(8);
  });
  it('restores the stored hunger loss even if the party changed while hungry', () => {
    const hungry = run('travel_food_and_rest', {
      ...food,
      rations_available: 0,
      party_member_count: 5,
      dog_count: 1,
    });
    const secondDay = run('travel_food_and_rest', { ...hungry.state, day: 1 });
    expect(secondDay.state.party_morale).toBe(4);
    const fed = run('travel_food_and_rest', {
      ...secondDay.state,
      day: 2,
      rations_available: 1,
      party_member_count: 4,
    });
    expect(fed.state).toMatchObject({ party_morale: 8, hunger_morale_loss: 0 });
  });
  it('applies hunger once and restores only its temporary deltas after eating', () => {
    const party = run('travel_food_and_rest', { ...food, rations_available: 0 });
    expect(party.state.party_morale).toBe(4);
    const hero = run('travel_food_and_rest', { ...party.state, phase: 'hero' });
    expect(hero.state).toMatchObject({
      constitution: 16,
      hunger_constitution_loss: 15,
      hungry: true,
    });
    const tomorrow = run('travel_food_and_rest', { ...hero.state, phase: 'food', day: 1 });
    expect(tomorrow.state.party_morale).toBe(4);
    const stillHungry = run('travel_food_and_rest', { ...tomorrow.state, phase: 'hero' });
    expect(stillHungry.state.constitution).toBe(16);
    const fed = run('travel_food_and_rest', {
      ...stillHungry.state,
      phase: 'food',
      day: 2,
      rations_available: 1,
      constitution: 18,
    });
    const restored = run('travel_food_and_rest', { ...fed.state, phase: 'hero' });
    expect(restored.state).toMatchObject({
      constitution: 33,
      hunger_constitution_loss: 0,
      hungry: false,
      party_morale: 8,
    });
  });
  it('rest restores HP and Energy exactly once per hero per day', () => {
    const r = run('travel_food_and_rest', { ...food, phase: 'rest' });
    expect(r.state).toMatchObject({ hit_points: 15, energy: 3, hero_rest_day: 0 });
    expect(run('travel_food_and_rest', r.state).steps).not.toContain('recover_at_rest');
    expect(
      run('travel_food_and_rest', { ...food, phase: 'rest', bedroll: true }).state.energy,
    ).toBe(4);
    expect(
      run('travel_food_and_rest', { ...food, phase: 'rest', at_settlement: true }).state.hit_points,
    ).toBe(12);
  });
  it('invalid supplied rest outcomes cannot award HP or Energy', () => {
    const r = run('travel_food_and_rest', { ...food, phase: 'rest', energy_successes: 5 });
    expect(r.state).toMatchObject({ hit_points: 12, energy: 1, hero_rest_day: -1 });
    expect(() => run('travel_food_and_rest', { ...food, phase: 'rest', hp_roll: 7 })).toThrow(
      'Input out of range',
    );
  });
  it('an HP roll above maximum stays open but does not block Energy recovery (PDF127)', () => {
    const overflow = run('travel_food_and_rest', { ...food, phase: 'rest', hp_roll: 6 });
    expect(overflow.unresolved).toContain('issue.phase4.recovery_bounds');
    expect(overflow.state).toMatchObject({ hit_points: 12, energy: 3, hero_rest_day: 0 });
    const bedroll = run('travel_food_and_rest', {
      ...food,
      phase: 'rest',
      hp_roll: 6,
      bedroll: true,
    });
    expect(bedroll.state).toMatchObject({ hit_points: 12, energy: 4 });
    expect(run('travel_food_and_rest', overflow.state).state.energy).toBe(3);
  });
  it.each([
    ['off_road', 10, false, 'none'],
    ['off_road', 11, true, 'Wilderness'],
    ['road', 9, false, 'none'],
    ['road', 10, true, 'Road'],
    ['desert', 10, true, 'Desert'],
  ])('checks daily %s event at %i', (terrain, event_roll, event_triggered, event_deck) => {
    const r = run('travel_event_check', {
      terrain,
      event_roll,
      day: 0,
      event_day: -1,
      movement_started: false,
    });
    expect(r.state).toMatchObject({ event_triggered, event_deck, event_day: 0 });
    expect(
      run('travel_event_check', r.state).events.filter((e) => e.type === 'invoke'),
    ).toHaveLength(0);
  });
  it.each([
    ['road_event', 'Roads'],
    ['wilderness_event', 'Wilderness'],
    ['desert_event', 'Desert'],
    ['called_for', 'Village, Camp, Standing Stones, Quest site entrance, City street'],
  ])(
    'uses the outdoor tiles printed for a skirmish initiated by %s (PDF 127–128)',
    (trigger, tiles) => {
      const r = run('travel_skirmish_setup', {
        setup_instructions: 'supplied',
        terrain_map: 'supplied',
        use_3d_terrain: false,
        skirmish_trigger: trigger,
      });
      expect(r.state).toMatchObject({ outdoor_tiles: tiles, distance_unit: 'squares' });
      expect(r.unresolved).toEqual([]);
    },
  );
  it('rejects a skirmish trigger the page does not print', () => {
    const r = run('travel_skirmish_setup', {
      setup_instructions: 'supplied',
      terrain_map: 'supplied',
      use_3d_terrain: false,
      skirmish_trigger: 'dungeon_event',
    });
    expect(r.events).toEqual([{ type: 'require', satisfied: false }]);
    expect(r.state.outdoor_tiles).toBeUndefined();
  });
  it('walks both caption routes of the PDF 126 map hex by hex', () => {
    // Blue: road, road, off-road, off-road (1p, 2p, 3,5p, 5p). Green: off-road, road (1,5p, 2,5p).
    const walk = (transport_mode: string, terrains: string[]) => {
      let state: State = { ...movement, transport_mode };
      for (const terrain of terrains)
        state = run('travel_daily_movement', { ...state, terrain }).state;
      return state;
    };
    const blue = ['road', 'road', 'off_road', 'off_road'];
    expect(walk('all_riding_horses_or_camels', blue)).toMatchObject({
      hex_index: 4,
      movement_points: 1,
    });
    expect(walk('walking', blue)).toMatchObject({ hex_index: 2, entered_hex: false });
    expect(walk('walking', ['off_road', 'road'])).toMatchObject({
      hex_index: 2,
      movement_points: 0.5,
    });
  });
  it('binds obstacles and combat while explicitly disabling dungeon dice', () => {
    const r = run('travel_skirmish_setup', {
      setup_instructions: 'supplied',
      terrain_map: 'supplied',
      use_3d_terrain: true,
      skirmish_trigger: 'road_event',
    });
    expect(r.state).toMatchObject({
      threat_enabled: false,
      scenario_dice_enabled: false,
      distance_unit: 'inches',
      outdoor_tiles: 'Roads',
    });
    // Changelog 2.21 entry 168 (charging with 3d terrain) is recorded, not applied.
    expect(r.unresolved).toEqual(['issue.travel.skirmish_3d_terrain_charging']);
    expect(r.events).toContainEqual({ type: 'invoke', dependency: 'table.travel.obstacles' });
    expect(r.events).toContainEqual({ type: 'invoke', dependency: 'procedure.combat_preparation' });
  });
  it('rejects a skirmish without supplied setup and composes a supplied outdoor attack into damage once', () => {
    const blocked = run('travel_skirmish_setup', {
      setup_instructions: '',
      terrain_map: 'supplied',
      use_3d_terrain: false,
      skirmish_trigger: 'road_event',
    });
    expect(blocked.events.some((e) => e.type === 'invoke')).toBe(false);
    const setup = run('travel_skirmish_setup', {
      setup_instructions: 'Road Event bandits',
      terrain_map: 'supplied',
      use_3d_terrain: false,
      skirmish_trigger: 'road_event',
    });
    expect(setup.events).toContainEqual({
      type: 'invoke',
      dependency: 'procedure.combat_preparation',
    });
    const attack = run('combat_attack', {
      preparation_supplied: true,
      attack_eligible: true,
      is_hero: true,
      target_is_hero: true,
      large_attacker: false,
      use_bloodlust: false,
      power_reroll: false,
      chosen_fast_immunity: false,
      magic_weapon: false,
      defence_supplied: true,
      defence_negates_damage: false,
      passed_models: false,
      incidental_target_supplied: false,
      incidental_target: '',
      action: 'standard',
      mode: 'melee',
      roll: 22,
      threshold: 50,
      damage_roll: 4,
      second_damage_roll: 2,
      maximum_damage: 12,
      durability: 6,
    });
    expect(attack.state.hit).toBe(true);
    const damage = run('combat_damage', {
      hit_resolved: attack.state.hit!,
      target_is_hero: true,
      defence_resolved: true,
      armour_resolution_supplied: false,
      quick_slot_resolution_supplied: false,
      weapon_damage: attack.state.selected_weapon_damage!,
      damage_bonus: 0,
      natural_armour: 1,
      armour: 1,
      hit_points: 10,
      maximum_hp: 10,
      location_roll: 3,
      armour_durability_loss: 0,
      quick_slot_durability_loss: 0,
      quick_slot_damage: 0,
    });
    expect(damage.state.hit_points).toBe(8);
  });
});
