import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const pilot = readPilot();
function run(id: string, inputs: State) {
  return runCase({ procedure_id: `procedure.${id}`, inputs } as TestCase, pilot);
}
// Source: PDF 86–88, 106–107, 118, and explicitly cited spell entries.
const encounter: State = {
  tile_kind: 'room',
  empty_streak: 0,
  streak_bonus_supplied: 0,
  room_modifier: 0,
  roll: 50,
  highest_level: 1,
  monster_roll: 7,
  quest_override: false,
  quest_result: 'quest supplied',
  monster_data_supplied: true,
  monster_result: 'supplied encounter',
  placement_supplied: true,
  melee_distance_valid: true,
  melee_randomized: true,
  ranged_farthest_in_los: true,
  facing_valid: true,
};
const bag: State = {
  enemies_placed: true,
  first_turn: true,
  eligible_heroes: 4,
  eligible_enemies: 3,
  named_monsters_alive: 1,
  bashed_room_door: false,
  door_encounter: true,
  hero_perfect_hearing: false,
  enemy_perfect_hearing: false,
  use_hearing_bonus: true,
  overwatch_heroes: 0,
  supplied_hero_bonus: 0,
  supplied_enemy_bonus: 0,
};
const activation: State = {
  alive: true,
  knocked_out: false,
  token_matches_model: true,
  withheld_for_overwatch: false,
  already_activated: false,
  is_hero: true,
  time_freeze_granted: false,
  time_freeze_used: false,
  summon_ready: true,
  enemy_priority_resolved: false,
  controlled_undead: false,
  control_succeeded: false,
  held_creature: false,
  hold_res_succeeded: false,
  all_models_acted: false,
  all_tokens_drawn: false,
};
const overwatch: State = {
  mode: 'enter',
  after_first_battle_turn: true,
  all_tokens_drawn: true,
  alive: true,
  knocked_out: false,
  loaded_ranged: true,
  hand_weapon_ready: false,
  on_overwatch: false,
  response_used: false,
  energy: 2,
  enemy_moves_in_los: true,
  enemy_enters_or_moves_in_zoc: false,
  attack_outcome_supplied: true,
  strike_hit: true,
  enemy_charging: false,
};
describe('setup and generation (PDF 86–88)', () => {
  it('entrance suppresses Scenario Dice until passed, grass side exits', () => {
    expect(
      run('initial_setup', { entrance_passed: false, leaves_grass_side: false }).state,
    ).toMatchObject({
      entrance_locked: false,
      entrance_threat_increase: 0,
      scenario_die_allowed: false,
    });
    expect(
      run('initial_setup', { entrance_passed: true, leaves_grass_side: false }).state
        .scenario_die_allowed,
    ).toBe(true);
    expect(
      run('initial_setup', { entrance_passed: true, leaves_grass_side: true }).state,
    ).toMatchObject({ scenario_die_allowed: false, location: 'world_map' });
  });
  it('composes the starting-door exception with opening and turn handoffs', () => {
    const opening = run('open_door_or_chest', {
      initial_entrance: true,
      adjacent: true,
      locked: true,
      is_chest: false,
      trap_prevents_opening: false,
      d6_roll: 1,
      threat_level: 3,
    });
    expect(opening.state.threat_level).toBe(3);
    expect(opening.steps).not.toContain('check_locked');
    expect(opening.events).toContainEqual({ type: 'invoke', dependency: 'procedure.encounters' });
    const turn = run('dungeon_turn', {
      entrance_passed: false,
      threat_roll_necessary: true,
      lights_went_out: true,
      battle_won: false,
    });
    expect(turn.steps).not.toContain('scenario');
    expect(turn.steps).not.toContain('threat_roll');
  });
  it('places objective in bottom shuffled half; odd allocation and B eligibility remain unresolved', () => {
    const base = {
      quest_data_supplied: true,
      card_eligibility_resolved: true,
      equal_piles_possible: true,
      room_count: 4,
      corridor_count: 4,
      objective_card: 'objective',
      prepared_order: 'A B C D E objective F G H',
      orders_supplied: true,
      b_cards_requested: false,
      quest_specifies_b: false,
    };
    expect(run('dungeon_generation', base).state.minimum_tiles_before_objective).toBe(4);
    const odd = run('dungeon_generation', { ...base, room_count: 5 });
    expect(odd.unresolved).toContain('issue.phase6.generation_odd_pile');
    expect(odd.state.deck_order).toBeUndefined();
    const b = run('dungeon_generation', {
      ...base,
      b_cards_requested: true,
      card_eligibility_resolved: false,
    });
    expect(b.unresolved).toContain('issue.phase6.b_cards');
    expect(b.state.deck_order).toBeUndefined();
  });
  it('deals branches from bottom and relocates dead-end cards below existing routes', () => {
    const inputs = {
      mode: 'branch',
      cards_remaining: 7,
      outgoing_doors: 3,
      distribution_supplied: true,
      redistributed_order: 'supplied stacks',
      other_routes_available: true,
      secret_room_appropriate: true,
      tile_geometry_valid: true,
      quest_placement_valid: true,
      top_card: 'R1',
    };
    expect(run('dungeon_route', inputs).state).toMatchObject({
      deal_from: 'bottom',
      branch_min_cards: 2,
      branch_max_cards: 3,
    });
    expect(run('dungeon_route', { ...inputs, mode: 'partial_dead_end' }).state.placement).toBe(
      'bottom of existing route piles',
    );
    expect(
      run('dungeon_route', { ...inputs, mode: 'total_dead_end', other_routes_available: false })
        .state.secret_door_placed,
    ).toBe(true);
    expect(run('dungeon_route', { ...inputs, cards_remaining: 0 }).state).toMatchObject({
      turn_back: true,
      ignore_unopened_doors: true,
    });
    expect(
      run('dungeon_route', { ...inputs, mode: 'reveal', tile_geometry_valid: false }).state
        .revealed_card,
    ).toBeUndefined();
  });
});
describe('encounters (PDF 106)', () => {
  it.each([
    ['room', 50, true],
    ['room', 51, false],
    ['corridor', 30, true],
    ['corridor', 31, false],
  ] as const)('checks %s roll %s', (tile_kind, roll, found) => {
    const r = run('encounters', { ...encounter, tile_kind, roll });
    expect(r.state.encounter_present).toBe(found);
    expect(r.state.streak_after).toBe(found ? 0 : 1);
  });
  it('first streak bonus, cap, room modifiers, level and quest selection remain distinct', () => {
    const r = run('encounters', {
      ...encounter,
      empty_streak: 4,
      streak_bonus_supplied: 10,
      room_modifier: 5,
      roll: 65,
      highest_level: 4,
    });
    expect(r.state).toMatchObject({
      encounter_chance: 65,
      monster_table_result: 37,
      streak_after: 0,
      turn_ended: true,
    });
    expect(
      run('encounters', { ...encounter, empty_streak: 12, streak_bonus_supplied: 30 }).state
        .encounter_chance,
    ).toBe(70);
    const q = run('encounters', { ...encounter, quest_override: true });
    expect(q.state.selected_monsters).toBe('quest supplied');
    expect(q.state.monster_table_result).toBeUndefined();
  });
  it.each([
    'placement_supplied',
    'melee_distance_valid',
    'melee_randomized',
    'ranged_farthest_in_los',
    'facing_valid',
  ])('does not start initiative with failed %s', (key) => {
    const r = run('encounters', { ...encounter, [key]: false });
    expect(r.state.enemies_placed).toBe(false);
    expect(r.events).not.toContainEqual({ type: 'invoke', dependency: 'procedure.initiative' });
  });
  it('missing Bestiary outcome remains unresolved, never fabricates placement', () => {
    const r = run('encounters', { ...encounter, monster_data_supplied: false });
    expect(r.unresolved).toEqual(['issue.phase6.monster_inputs']);
    expect(r.state.selected_monsters).toBeUndefined();
    expect(r.state.enemies_placed).toBe(false);
  });
  it('handoff records invocation; explicit supplied results prepare the bag', () => {
    const r = run('encounters', encounter);
    expect(r.trace).toEqual(['procedure.encounters']);
    expect(r.state.hero_tokens).toBeUndefined();
    expect(
      run('initiative', { ...bag, enemies_placed: r.state.enemies_placed! }).state.hero_tokens,
    ).toBe(4);
  });
});
describe('initiative and activation (PDF 106–107, 118)', () => {
  it('first-turn bonuses expire, named tokens persist, Overwatch withholds and no tokens add actions', () => {
    const first = run('initiative', { ...bag, bashed_room_door: true, hero_perfect_hearing: true });
    expect(first.state).toMatchObject({ hero_tokens: 5, enemy_tokens: 6, extra_activations: 0 });
    const next = run('initiative', {
      ...bag,
      first_turn: false,
      bashed_room_door: true,
      hero_perfect_hearing: true,
      overwatch_heroes: 1,
    });
    expect(next.state).toMatchObject({ hero_tokens: 3, enemy_tokens: 4, extra_activations: 0 });
    expect(
      run('initiative', { ...bag, hero_perfect_hearing: true, enemy_perfect_hearing: true }).state,
    ).toMatchObject({ hero_tokens: 4, enemy_tokens: 4 });
    expect(
      run('initiative', { ...bag, first_turn: false, named_monsters_alive: 0 }).state.enemy_tokens,
    ).toBe(3);
  });
  it.each(['alive', 'knocked_out', 'already_activated', 'withheld_for_overwatch', 'summon_ready'])(
    'respects model eligibility %s',
    (key) => {
      const r = run('activation', { ...activation, [key]: !activation[key] });
      expect(r.state.activation_granted).toBeUndefined();
    },
  );
  it('Time Freeze grants an additional hero activation exactly once', () => {
    const r = run('activation', {
      ...activation,
      already_activated: true,
      time_freeze_granted: true,
    });
    expect(r.state.activation_granted).toBe(true);
    expect(r.state.time_freeze_used).toBe(true);
    expect(
      run('activation', {
        ...activation,
        already_activated: true,
        time_freeze_granted: true,
        time_freeze_used: true,
      }).state.activation_granted,
    ).toBeUndefined();
    expect(
      run('activation', {
        ...activation,
        already_activated: true,
        time_freeze_granted: true,
        is_hero: false,
      }).state.activation_granted,
    ).toBeUndefined();
  });
  it('controlled undead retains enemy order; Hold Creature still gets its token', () => {
    expect(
      run('activation', {
        ...activation,
        is_hero: false,
        enemy_priority_resolved: true,
        controlled_undead: true,
        control_succeeded: true,
      }).state.controller,
    ).toBe('wizard');
    expect(
      run('activation', {
        ...activation,
        is_hero: false,
        enemy_priority_resolved: true,
        held_creature: true,
      }).state,
    ).toMatchObject({ activation_granted: true, can_move_or_fight: false });
    expect(
      run('activation', { ...activation, all_models_acted: true, all_tokens_drawn: true }).state
        .tokens_return_ready,
    ).toBe(true);
  });
  it.each([1, 2, 3, 4, 5, 6])('selects priority %i with randomized ties', (priority) => {
    const names = [
      'magic_or_ranged',
      'adjacent_and_makes_room',
      'adjacent',
      'closest_and_can_charge',
      'full_movement_space',
    ];
    const flags = Object.fromEntries(names.map((n, i) => [n, i + 1 >= priority]));
    const r = run('enemy_priority', {
      ...flags,
      lowest_remaining_priority: priority,
      tie_count: 2,
      random_index: 2,
      candidate_index: 2,
      candidate_alive: true,
      candidate_knocked_out: false,
      candidate_acted: false,
    });
    expect(r.state).toMatchObject({ priority, selected: true });
    expect(
      run('enemy_priority', {
        ...flags,
        lowest_remaining_priority: priority,
        tie_count: 2,
        random_index: 2,
        candidate_index: 1,
        candidate_alive: true,
        candidate_knocked_out: false,
        candidate_acted: false,
      }).state.selected,
    ).toBeUndefined();
  });
});
describe('Overwatch (PDF 107)', () => {
  it('requires completed first turn, drawn bag and ready weapon', () => {
    expect(run('overwatch', overwatch).state.withhold_token).toBe(true);
    for (const changes of [
      { after_first_battle_turn: false },
      { all_tokens_drawn: false },
      { loaded_ranged: false },
      { alive: false },
    ] as State[])
      expect(run('overwatch', { ...overwatch, ...changes }).state.withhold_token).toBeUndefined();
  });
  it('ranged pauses movement, resolves supplied attack, resumes then reloads or idles', () => {
    const r = run('overwatch', { ...overwatch, mode: 'ranged', on_overwatch: true });
    expect(r.state).toMatchObject({
      energy_spent: 1,
      enemy_movement_paused: true,
      enemy_movement_resumes: true,
      aiming_allowed: false,
      perks_talents_allowed: true,
      second_action: 'reload or idle',
      response_used: true,
    });
    expect(
      run('overwatch', {
        ...overwatch,
        mode: 'ranged',
        on_overwatch: true,
        attack_outcome_supplied: false,
      }).state.enemy_movement_resumes,
    ).toBeUndefined();
    expect(
      run('overwatch', { ...overwatch, mode: 'ranged', on_overwatch: true, energy: 0 }).state
        .energy_spent,
    ).toBeUndefined();
  });
  it.each([true, false])('melee charging interaction with supplied hit %s', (strike_hit) => {
    const r = run('overwatch', {
      ...overwatch,
      mode: 'melee',
      on_overwatch: true,
      hand_weapon_ready: true,
      enemy_enters_or_moves_in_zoc: true,
      enemy_charging: true,
      strike_hit,
    });
    expect(r.state).toMatchObject({
      energy_spent: 1,
      standard_strike: true,
      charge_automatic_hit: !strike_hit,
      response_used: true,
    });
    expect(r.state.second_action).toBeUndefined();
  });
});
