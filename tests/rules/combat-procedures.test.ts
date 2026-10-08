import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const pilot = readPilot();
const run = (id: string, inputs: State) =>
  runCase({ procedure_id: `procedure.${id}`, inputs } as TestCase, pilot);
const prep: State = {
  mode: 'melee',
  action: 'standard',
  adjacent: true,
  doorway_opposite: false,
  reach_valid: false,
  in_los: true,
  outdoors: false,
  enemy_adjacent: false,
  ranged_exception: false,
  loaded: true,
  ammunition_available: true,
  straight_model_block: false,
  large_or_flying: false,
  target_large: false,
  from_behind: false,
  target_prone: false,
  height_advantage: false,
  target_shield: false,
  target_parry: false,
  enemy_power_restriction_resolved: true,
  enemy_to_hit_suppressed: false,
  shield_suppressed: false,
  aim_valid: false,
  charge_path_valid: true,
  target_aiming: false,
  distance: 3,
  skill: 45,
  enemy_to_hit: 10,
  melee_weapon_modifier: 5,
  half_height_obstacles: 0,
  other_modifier: 0,
};
const attack: State = {
  preparation_supplied: true,
  attack_eligible: true,
  is_hero: true,
  target_is_hero: false,
  large_attacker: false,
  use_bloodlust: false,
  power_reroll: false,
  magic_weapon: false,
  defence_supplied: false,
  defence_negates_damage: false,
  passed_models: false,
  incidental_target_supplied: false,
  incidental_target: 'model D',
  action: 'standard',
  mode: 'melee',
  roll: 22,
  threshold: 50,
  damage_roll: 4,
  second_damage_roll: 2,
  maximum_damage: 12,
  durability: 6,
};
const defence: State = {
  incoming_hit: true,
  through_zoc: true,
  power_restriction_resolved: true,
  power_restricted: false,
  parry_stance: true,
  shield_ready: true,
  weapon_ready: true,
  aiming: false,
  fast_weapon: false,
  exact_shield_result_supplied: false,
  exact_shield_success: false,
  defence: 'shield',
  roll: 20,
  cs: 45,
  dodge_skill: 35,
  dodges_remaining: 1,
  parries_remaining: 1,
  talent_modifier: 0,
  incoming_damage: 8,
  shield_def: 6,
  durability: 6,
};
const thrown: State = {
  is_thrown_preparation: true,
  in_los: true,
  nonadjacent_obstacle: false,
  through_door: false,
  in_front_of_door: false,
  adjacent_to_door: false,
  target_large: false,
  scatter_supplied: true,
  centre_under_large: false,
  rs: 50,
  roll: 50,
  centre_damage: 8,
  other_covered_squares: 3,
  scatter_square: 'adjacent target square',
  doorway_scatter_square: 'near door square',
};
const damage: State = {
  hit_resolved: true,
  target_is_hero: true,
  defence_resolved: true,
  armour_resolution_supplied: false,
  quick_slot_resolution_supplied: false,
  weapon_damage: 8,
  damage_bonus: 0,
  natural_armour: 1,
  armour: 2,
  hit_points: 10,
  maximum_hp: 10,
  location_roll: 3,
  armour_durability_loss: 0,
  quick_slot_durability_loss: 0,
  quick_slot_damage: 0,
};
const bleed: State = {
  bleeding_out: true,
  rescue_handoff_processed: false,
  bandage_handoff_processed: false,
  zero_processed: false,
  timer_processed: false,
  dead: false,
  phase: 'initial',
  companion_healing_spell: false,
  own_ready_potion: false,
  adjacent_companion_ready_potion: false,
  battle_over: false,
  standing_companion: true,
  healer_knocked_out: false,
  all_bleeding_out: false,
  means_to_help: true,
  advanced_rule_enabled: false,
  rescue_result_supplied: false,
  hit_points: 0,
  loss: 3,
  selected_value: 40,
  die: 4,
  healed_hp: 0,
  elapsed_turns: 0,
};
describe('combat preparation and resolution: PDF 109–116, 121', () => {
  it('reproduces Variya charge 45+10-10+5=50 and modifier-heavy second target 20 (PDF 124)', () => {
    expect(run('combat_preparation', { ...prep, action: 'charge' }).state.threshold).toBe(50);
    expect(
      run('combat_preparation', {
        ...prep,
        melee_weapon_modifier: 0,
        target_shield: true,
        target_parry: true,
      }).state.threshold,
    ).toBe(20);
  });
  it.each([49, 50, 51, 100])('hit threshold and fumble %i', (roll) => {
    const r = run('combat_attack', { ...attack, roll });
    expect(r.state.hit).toBe(roll <= 50);
    expect(r.state.durability).toBe(roll === 100 ? 5 : 6);
  });
  it('Bloodlust chooses best; Power keeps last except Bloodlust maximizes; enemies ignore Bloodlust', () => {
    expect(
      run('combat_attack', { ...attack, roll: 5, use_bloodlust: true }).state
        .selected_weapon_damage,
    ).toBe(4);
    expect(
      run('combat_attack', { ...attack, action: 'power', power_reroll: true }).state
        .selected_weapon_damage,
    ).toBe(2);
    expect(
      run('combat_attack', { ...attack, action: 'power', roll: 5 }).state.selected_weapon_damage,
    ).toBe(12);
    expect(
      run('combat_attack', { ...attack, is_hero: false, roll: 1, use_bloodlust: true }).state
        .bloodlust,
    ).toBe(false);
    expect(
      run('combat_attack', {
        ...attack,
        is_hero: false,
        large_attacker: true,
        action: 'power',
        power_reroll: true,
      }).state,
    ).toMatchObject({ armour_piercing: 2, selected_weapon_damage: 4 });
  });
  it('applies the ruled enemy fumble and does not invent a successful missing dependency', () => {
    const armed = run('combat_attack', {
      ...attack,
      is_hero: false,
      roll: 100,
      enemy_has_weapon: true,
    });
    expect(armed.state).toMatchObject({ enemy_dropped_weapon: true });
    expect(armed.state.enemy_prone).toBeUndefined();
    expect(armed.unresolved).not.toContain('issue.combat.enemy_fumble');
    const unarmed = run('combat_attack', {
      ...attack,
      is_hero: false,
      roll: 100,
      enemy_has_weapon: false,
    });
    expect(unarmed.state).toMatchObject({ enemy_prone: true });
    expect(unarmed.state.enemy_dropped_weapon).toBeUndefined();
    expect(
      run('combat_attack', { ...attack, preparation_supplied: false }).state.hit,
    ).toBeUndefined();
    expect(() => run('combat_attack', {})).toThrow('Missing input');
  });
  it('checks dungeon range and adjacency; height and large-target bonus do not stack', () => {
    for (const distance of [10, 11])
      expect(
        run('combat_preparation', { ...prep, mode: 'ranged', distance }).state.attack_eligible,
      ).toBe(distance === 10);
    expect(
      run('combat_preparation', { ...prep, mode: 'ranged', enemy_adjacent: true }).state
        .attack_eligible,
    ).toBe(false);
    expect(
      run('combat_preparation', {
        ...prep,
        mode: 'ranged',
        height_advantage: true,
        target_large: true,
      }).state.threshold,
    ).toBe(45);
    expect(
      run('combat_preparation', { ...prep, mode: 'ranged', half_height_obstacles: 2 }).state
        .threshold,
    ).toBe(15);
  });
  it('aim breaks for each printed interruption and needs a Ranged Weapon; Overwatch adds no gate', () => {
    const a = {
      ranged_weapon: true,
      next_action: true,
      same_target: true,
      target_left_los: false,
      model_crossed_los: false,
      lost_hp: false,
    };
    expect(run('combat_aim', a).state.aim_bonus).toBe(10);
    for (const key of ['target_left_los', 'model_crossed_los', 'lost_hp'])
      expect(run('combat_aim', { ...a, [key]: true }).state.aim_bonus).toBe(0);
    expect(run('combat_aim', { ...a, ranged_weapon: false }).state.aim_bonus).toBeUndefined();
    // PDF 107 forbids Perks and Talents for aiming during an Overwatch shot, not the Aim action.
    expect(run('combat_aim', { ...a, overwatch: true }).state.aim_bonus).toBe(10);
  });
  it('91-00 always misses even when modifiers push CS/RS above 90 (PDF 18)', () => {
    expect(run('combat_attack', { ...attack, roll: 90, threshold: 110 }).state.hit).toBe(true);
    for (const roll of [91, 99])
      expect(run('combat_attack', { ...attack, roll, threshold: 110 }).state.hit).toBe(false);
    const fumble = run('combat_attack', { ...attack, roll: 100, threshold: 110 });
    expect(fumble.state).toMatchObject({ hit: false, durability: 5 });
    expect(fumble.trace).toContain('character.durability.fumble');
    expect(run('combat_attack', { ...attack, roll: 100, magic_weapon: true }).unresolved).toEqual([
      'issue.phase4.durability_overlap',
    ]);
  });
  it('100 on a ranged shot past a model returns the shooting-past issue instead of choosing', () => {
    const shot = {
      ...attack,
      mode: 'ranged',
      passed_models: true,
      incidental_target_supplied: true,
    };
    const r = run('combat_attack', { ...shot, roll: 100, threshold: 110 });
    expect(r.unresolved).toContain('issue.combat.shooting_past_fumble');
    expect(r.state.hit).toBe(false);
    expect(r.state.damage_target).toBeUndefined();
    expect(r.trace).toContain('character.durability.fumble');
    const ninetyNine = run('combat_attack', { ...shot, roll: 99, threshold: 110 });
    expect(ninetyNine.unresolved).not.toContain('issue.combat.shooting_past_fumble');
    expect(ninetyNine.state).toMatchObject({ hit: true, damage_target: 'model D' });
    const clear = run('combat_attack', {
      ...shot,
      passed_models: false,
      roll: 100,
      threshold: 110,
    });
    expect(clear.unresolved).not.toContain('issue.combat.shooting_past_fumble');
  });
  it('charge still hands off shove when supplied defence negates all damage', () => {
    const r = run('combat_attack', {
      ...attack,
      action: 'charge',
      target_is_hero: true,
      defence_supplied: true,
      defence_negates_damage: true,
    });
    expect(r.state.charge_shove).toBe(true);
    expect(r.steps).not.toContain('damage');
  });
});
describe('hero defence: PDF 120', () => {
  it('Berthram shield 8-6=2 spills to arm with one shield damage', () => {
    expect(run('hero_defence', defence).state).toMatchObject({
      remaining_damage: 2,
      shield_damage: 1,
      hit_location: 'arms',
    });
    expect(run('hero_defence', { ...defence, incoming_damage: 6 }).state).toMatchObject({
      remaining_damage: 0,
      shield_damage: 0,
      negates_damage: true,
    });
  });
  it('stance modifiers, usage limits, ZOC and Power restrictions', () => {
    expect(run('hero_defence', { ...defence, parry_stance: false }).state.defence_threshold).toBe(
      30,
    );
    expect(run('hero_defence', { ...defence, defence: 'dodge' }).state.defence_threshold).toBe(50);
    for (const patch of [
      { through_zoc: false },
      { power_restricted: true },
      { parries_remaining: 0 },
    ] as State[])
      expect(run('hero_defence', { ...defence, ...patch }).state.defence_eligible).toBe(false);
    expect(
      run('hero_defence', { ...defence, defence: 'weapon', parry_stance: false }).state
        .defence_eligible,
    ).toBe(false);
    expect(
      run('hero_defence', { ...defence, defence: 'dodge', dodges_remaining: 0 }).state
        .defence_eligible,
    ).toBe(false);
  });
  it('weapon 95 damages once, Fast parry outside stance damages on 90-00, 100 overlap unresolved; dodge fumble falls', () => {
    expect(run('hero_defence', { ...defence, defence: 'weapon', roll: 95 }).state.durability).toBe(
      5,
    );
    expect(
      run('hero_defence', { ...defence, defence: 'weapon', roll: 92, fast_weapon: true }).state
        .durability,
    ).toBe(6);
    const fast = { ...defence, defence: 'weapon', parry_stance: false, fast_weapon: true };
    expect(
      run('hero_defence', { ...fast, fast_parries_this_turn: 0, roll: 30 }).state,
    ).toMatchObject({ defence_eligible: true, using_fast_parry: true, defence_succeeded: true });
    expect(
      run('hero_defence', { ...fast, fast_parries_this_turn: 0, roll: 92 }).state.durability,
    ).toBe(5);
    expect(
      run('hero_defence', { ...fast, fast_parries_this_turn: 1, roll: 30 }).state.defence_eligible,
    ).toBe(false);
    expect(
      run('hero_defence', { ...fast, fast_weapon: false, fast_parries_this_turn: 0, roll: 30 })
        .state.defence_eligible,
    ).toBe(false);
    expect(run('hero_defence', { ...defence, defence: 'weapon', roll: 100 }).unresolved).toContain(
      'issue.phase4.durability_overlap',
    );
    expect(run('hero_defence', { ...defence, defence: 'dodge', roll: 100 }).state.hero_prone).toBe(
      true,
    );
    expect(run('hero_defence', { ...defence, roll: 60 }).unresolved).toContain(
      'issue.combat.shield_threshold',
    );
  });
});
describe('thrown preparations: PDF 117', () => {
  it('uses a single obstacle penalty, cumulative doorway penalty, and large bonus', () => {
    expect(
      run('thrown_preparation', {
        ...thrown,
        nonadjacent_obstacle: true,
        through_door: true,
        target_large: true,
      }).state.threshold,
    ).toBe(40);
    expect(
      run('thrown_preparation', { ...thrown, through_door: true, in_front_of_door: true }).state
        .threshold,
    ).toBe(50);
    // adjacent to the door but not in one of the two squares in front of it: the -10 applies
    expect(
      run('thrown_preparation', { ...thrown, through_door: true, adjacent_to_door: true }).state
        .threshold,
    ).toBe(40);
  });
  it('a throw is an RS check: 91-00 always fails (PDF 18)', () => {
    expect(run('thrown_preparation', { ...thrown, rs: 95, roll: 90 }).state.hit).toBe(true);
    expect(run('thrown_preparation', { ...thrown, rs: 95, roll: 91 }).state).toMatchObject({
      hit: false,
      impact_square: 'adjacent target square',
    });
  });
  it('misses scatter beside target except nonadjacent doorway; large area is centre + other covered squares', () => {
    expect(run('thrown_preparation', { ...thrown, roll: 51 }).state.impact_square).toBe(
      'adjacent target square',
    );
    expect(run('thrown_preparation', { ...thrown, through_door: true }).state.impact_square).toBe(
      'near door square',
    );
    expect(
      run('thrown_preparation', { ...thrown, centre_under_large: true }).state.damage_for_large,
    ).toBe(11);
    expect(run('thrown_preparation', { ...thrown, in_los: false }).state.hit).toBeUndefined();
    expect(
      run('thrown_preparation', { ...thrown, roll: 100, scatter_supplied: false }).steps,
    ).not.toContain('resolve');
  });
});
describe('damage and bleeding checkpoints: PDF 121–122', () => {
  it.each([
    [1, 'head'],
    [2, 'arms'],
    [3, 'torso'],
    [4, 'torso'],
    [5, 'torso'],
    [6, 'legs'],
  ] as const)('location %i is %s', (location_roll, location) => {
    const r = run('combat_damage', { ...damage, location_roll });
    expect(r.state.hit_location).toBe(location);
    expect(r.steps.includes('quick_slot')).toBe(location === 'torso');
    expect(r.state.hit_points).toBe(5);
  });
  it('odd-HP wounded boundary and exactly zero; no invented negative damage floor', () => {
    expect(
      run('combat_damage', { ...damage, maximum_hp: 11, hit_points: 11 }).state.action_points,
    ).toBeUndefined();
    expect(
      run('combat_damage', { ...damage, maximum_hp: 11, hit_points: 10 }).state.action_points,
    ).toBeUndefined();
    expect(run('combat_damage', { ...damage, hit_points: 5 }).state).toMatchObject({
      hit_points: 0,
      bleeding_out: true,
      can_act: false,
    });
    expect(run('combat_damage', { ...damage, weapon_damage: 1 }).unresolved).toContain(
      'issue.phase4.damage_floor',
    );
  });
  it('injury once on entry, optional timer isolated, valid rescue requires supplied positive HP', () => {
    expect(run('bleeding_out', bleed).state).toMatchObject({
      selected_value: 37,
      bleeding_out: true,
    });
    expect(run('bleeding_out', bleed).state.turns).toBeUndefined();
    expect(run('bleeding_out', { ...bleed, advanced_rule_enabled: true }).state.turns).toBe(5);
    expect(
      run('bleeding_out', { ...bleed, phase: 'rescue', own_ready_potion: true }).state.hit_points,
    ).toBe(0);
    expect(
      run('bleeding_out', {
        ...bleed,
        phase: 'rescue',
        own_ready_potion: true,
        rescue_result_supplied: true,
        healed_hp: 4,
      }).state,
    ).toMatchObject({ hit_points: 4, bleeding_out: false });
    expect(run('bleeding_out', { ...bleed, all_bleeding_out: true }).state.quest_lost).toBe(true);
    expect(
      run('bleeding_out', { ...bleed, phase: 'after_battle', battle_over: true }).state
        .bandage_allowed,
    ).toBe(true);
    expect(
      run('bleeding_out', {
        ...bleed,
        phase: 'after_battle',
        battle_over: true,
        healer_knocked_out: true,
      }).state.bandage_allowed,
    ).toBe(false);
  });
  it('composes supplied attack to damage exactly once', () => {
    const hit = run('combat_attack', attack);
    expect(hit.state.hit_points).toBeUndefined();
    const resolved = run('combat_damage', {
      ...damage,
      target_is_hero: false,
      weapon_damage: hit.state.selected_weapon_damage!,
      damage_bonus: 2,
      natural_armour: 0,
    });
    expect(resolved.state.hit_points).toBe(6);
    expect(resolved.trace.filter((id) => id === 'character.hit_points.loss')).toHaveLength(1);
  });
  it('an enemy taken below 0 HP dies; negative HP stays an open question only for heroes', () => {
    const enemy = {
      ...damage,
      target_is_hero: false,
      natural_armour: 0,
      armour: 2,
      weapon_damage: 7,
      damage_bonus: 2,
      hit_points: 6,
    };
    const r = run('combat_damage', enemy);
    expect(r.state).toMatchObject({ hit_points: -1, dead: true });
    expect(r.unresolved).not.toContain('issue.phase4.zero_and_negative');
    expect(run('combat_damage', { ...damage, hit_points: 3 }).unresolved).toContain(
      'issue.phase4.zero_and_negative',
    );
  });
});

describe('shove and typed follow-ups (PDF 111–112, 121–122)', () => {
  it('strict shove threshold, at most two models, fumble and fatal terrain', () => {
    const s: State = {
      adjacent: true,
      target_large: false,
      automatic_charge_shove: false,
      straight_free: true,
      diagonal_free: false,
      second_model: false,
      second_can_move: false,
      destination_lava_or_chasm: false,
      destination_trap: false,
      displacement_case: 'straight_free',
      roll: 26,
      damage_bonus: 1,
      target_dex: 35,
    };
    expect(run('combat_shove', s).state.models_moved).toBe(1);
    expect(run('combat_shove', { ...s, roll: 25 }).state.shove_succeeded).toBe(false);
    expect(run('combat_shove', { ...s, roll: 100 }).state.shover_prone).toBe(true);
    expect(
      run('combat_shove', { ...s, straight_free: false, displacement_case: 'blocked' }).state
        .target_prone,
    ).toBe(true);
    expect(
      run('combat_shove', {
        ...s,
        straight_free: false,
        second_model: true,
        second_can_move: true,
        displacement_case: 'push_model_behind',
      }).state.models_moved,
    ).toBe(2);
    // the book leaves open whether a free diagonal or the model behind comes first: both are allowed
    const either = {
      ...s,
      straight_free: false,
      diagonal_free: true,
      second_model: true,
      second_can_move: true,
    };
    expect(run('combat_shove', { ...either, displacement_case: 'diagonal' }).state).toMatchObject({
      models_moved: 1,
      destination: 'diagonal_back',
    });
    expect(
      run('combat_shove', { ...either, displacement_case: 'push_model_behind' }).state.models_moved,
    ).toBe(2);
    // a supplied case whose conditions do not hold is rejected and moves nothing
    const rejected = run('combat_shove', {
      ...s,
      straight_free: false,
      displacement_case: 'straight_free',
    });
    expect(rejected.events).toContainEqual({ type: 'require', satisfied: false });
    expect(rejected.state).toMatchObject({ models_moved: 0, destination: 'none' });
    expect(run('combat_shove', { ...s, destination_lava_or_chasm: true }).state).toMatchObject({
      xp_awarded: true,
      loot_allowed: false,
      target_removed: true,
    });
  });
  it('fire/acid continuation uses 4–6, half rounded down minimum one; frost supplied probability', () => {
    const d: State = {
      damage_type: 'fire',
      phase: 'initial',
      damage_resolved: true,
      elemental_hit_processed: false,
      continuation_roll: 3,
      damage_before_protection: 7,
      frost_stun_result: false,
    };
    expect(run('damage_follow_up', d).state.next_turn_damage).toBe(0);
    expect(run('damage_follow_up', { ...d, continuation_roll: 4 }).state.next_turn_damage).toBe(3);
    expect(
      run('damage_follow_up', {
        ...d,
        damage_type: 'acidic',
        continuation_roll: 6,
        damage_before_protection: 1,
      }).state,
    ).toMatchObject({ next_turn_damage: 1, ignore_natural_armour: true, ignore_armour: false });
    expect(
      run('damage_follow_up', { ...d, damage_type: 'frost', frost_stun_result: true }).state
        .next_turn_actions_lost,
    ).toBe(1);
  });
  it('poison fails CON, continues below zero, impeccable cures, and cannot reinfect', () => {
    const p: State = {
      damage_type: 'poison',
      damage_resolved: true,
      phase: 'initial',
      took_damage: true,
      already_poisoned: false,
      con_success: false,
      poison_duration_roll: 4,
      poison_exposure_processed: false,
      con_roll: 50,
      dead: false,
      rest_occurs: false,
    };
    expect(run('damage_follow_up', p).state.poison_rolls_due).toBe(5);
    expect(
      run('damage_follow_up', { ...p, already_poisoned: true }).state.poison_rolls_due,
    ).toBeUndefined();
    const ongoing = {
      ...p,
      phase: 'ongoing',
      already_poisoned: true,
      remaining_poison_rolls: 3,
      poison_check_processed: false,
      dead: false,
      con_roll: 90,
      hit_points: 0,
    };
    expect(run('damage_follow_up', ongoing).state.hit_points).toBe(-1);
    expect(run('damage_follow_up', { ...ongoing, con_roll: 5 }).state).toMatchObject({
      cured: true,
      poison_rolls_due: 0,
    });
  });
  it('Quick Slots only damage occupied slots within available count (PDF 121)', () => {
    const input: State = {
      torso_hit: true,
      roll: 3,
      slot_count: 3,
      slot_has_item: true,
      durability_applicable: true,
      magic_other_item: false,
      durability: 6,
    };
    const go = (patch: State) =>
      runCase(
        {
          rule_ids: ['character.durability.quick_slot_hit'],
          inputs: { ...input, ...patch },
        } as TestCase,
        pilot,
      );
    expect(go({}).state.durability).toBe(5);
    expect(go({ roll: 4 }).state.durability).toBe(6);
    expect(go({ slot_has_item: false }).state.durability).toBe(6);
  });
});

for (const fixture of pilot.testCases.filter((fixture) => fixture.id.startsWith('test.combat.'))) {
  it(fixture.name, () => {
    const r = runCase(fixture, pilot);
    expect(r.state).toMatchObject(fixture.expected.state ?? {});
    if (fixture.expected.steps) expect(r.steps).toEqual(fixture.expected.steps);
    if (fixture.expected.unresolved) expect(r.unresolved).toEqual(fixture.expected.unresolved);
  });
}

it('composes activation → preparation → attack → damage with supplied results once', () => {
  const activation = run('activation', {
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
  });
  expect(activation.state.activation_granted).toBe(true);
  expect(
    pilot.procedures
      .find((p) => p.id === 'procedure.activation')!
      .dependencies.find((d) => d.key === 'combat_attack')!.object_id,
  ).toBe('procedure.combat_attack');
  const prepared = run('combat_preparation', prep);
  const resolved = run('combat_attack', {
    ...attack,
    threshold: prepared.state.threshold!,
    attack_eligible: prepared.state.attack_eligible!,
  });
  expect(resolved.state.hit).toBe(true);
  expect(resolved.events).toContainEqual({ type: 'invoke', dependency: 'procedure.combat_damage' });
  expect(resolved.state.hit_points).toBeUndefined();
  const hurt = run('combat_damage', {
    ...damage,
    target_is_hero: false,
    hit_resolved: resolved.state.hit!,
    weapon_damage: resolved.state.selected_weapon_damage!,
  });
  expect(hurt.state.hit_points).toBe(9); // 4 weapon - 1 Natural Armour - 2 armour, applied once.
  expect(hurt.trace.filter((id) => id === 'character.hit_points.loss')).toHaveLength(1);
});

it('charge-derived shove spends no additional AP; party loss prevents rescue', () => {
  const shove = run('combat_shove', {
    adjacent: true,
    target_large: false,
    automatic_charge_shove: true,
    roll: 20,
    damage_bonus: 0,
    target_dex: 60,
    straight_free: true,
    diagonal_free: false,
    second_model: false,
    second_can_move: false,
    destination_lava_or_chasm: false,
    destination_trap: false,
    displacement_case: 'straight_free',
  });
  expect(shove.state.action_points_spent).toBe(0);
  const rescued = run('bleeding_out', {
    ...bleed,
    phase: 'rescue',
    all_bleeding_out: true,
    own_ready_potion: true,
    rescue_result_supplied: true,
    healed_hp: 5,
  });
  expect(rescued.state.rescue_allowed).toBe(false);
  expect(rescued.state.hit_points).toBe(0);
});

// Expectations transcribed from rendered PDF 120–122 (printed 118–120).
describe('rendered source audit: defence and condition composition', () => {
  it('Berthram shield spillover reaches arm armour without applying damage twice', () => {
    const parried = run('hero_defence', defence);
    expect(parried.state).toMatchObject({
      remaining_damage: 2,
      shield_damage: 1,
      hit_location: 'arms',
    });
    expect(parried.state.hit_points).toBeUndefined();
    const hurt = run('combat_damage', {
      ...damage,
      weapon_damage: parried.state.remaining_damage!,
      natural_armour: 0,
      armour: 2,
      location_roll: 2,
    });
    expect(hurt.state.hit_points).toBe(10);
    expect(hurt.state.hit_location).toBe('arms');
    expect(hurt.steps).not.toContain('quick_slot');
    expect(hurt.trace.filter((id) => id === 'character.hit_points.loss')).toHaveLength(1);
  });
  it('disease penalties wait until battle ends and subtract rounded-down losses', () => {
    const input: State = {
      damage_type: 'disease',
      dead: false,
      disease_penalty_processed: false,
      disease_rest_check_chosen: true,
      disease_rest_processed: false,
      damage_resolved: true,
      diseased: true,
      phase: 'after_battle',
      disease_exposed: true,
      con_success: false,
      in_battle: true,
      constitution: 35,
      strength: 41,
      rest_occurs: false,
    };
    expect(run('damage_follow_up', input).state.constitution_after).toBeUndefined();
    expect(
      run('damage_follow_up', { ...input, phase: 'rest', rest_occurs: true, con_roll: 5 }).state,
    ).toMatchObject({ diseased: false, cured: true });
    expect(run('damage_follow_up', { ...input, in_battle: false }).state).toMatchObject({
      constitution_after: 18,
      strength_after: 21,
    });
    expect(
      run('damage_follow_up', { ...input, in_battle: false, diseased: false }).state
        .constitution_after,
    ).toBeUndefined();
  });
  it('a supplied rescue of zero HP does not wake the hero or apply injury again', () => {
    const result = run('bleeding_out', {
      ...bleed,
      phase: 'rescue',
      own_ready_potion: true,
      rescue_result_supplied: true,
      healed_hp: 0,
    });
    expect(result.state.hit_points).toBe(0);
    expect(result.state.selected_value).toBe(40);
    expect(result.steps).not.toContain('healed');
    expect(result.trace).not.toContain('character.hit_points.permanent_injury');
  });
});
