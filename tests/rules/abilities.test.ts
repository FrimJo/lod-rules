import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
function run(suffix: string, inputs: State) {
  const id = `character.${suffix}`;
  const rule = corpus.rules.find((r) => r.id === id)!;
  const fixture: TestCase = {
    id: `test.${suffix}`,
    name: suffix,
    section_id: rule.section_id,
    source: rule.source,
    status: 'extracted',
    confidence: 'high',
    source_text: 'Derived catalogue boundary case.',
    kind: 'derived_case',
    rule_ids: [id],
    inputs,
    expected: { state: {}, events: [], trace: [], unresolved: [], steps: [] },
  };
  return runCase(fixture, corpus);
}
describe('source-bounded talent and perk mechanics', () => {
  it.each([1, 2, 3])('Assassin requires class 1 or 2: %i', (weapon_class) => {
    expect(
      run('talent.assassin.automatic_hit', {
        weapon_class,
        from_behind: true,
        automatic_hit: false,
      }).state.automatic_hit,
    ).toBe(weapon_class <= 2);
  });
  it.each([1, 2, 3, 6])('Cutpurse gains only on 1–2: %i', (attempt_roll) => {
    expect(
      run('talent.cutpurse.success', { attempt_roll, coin_roll: 83, coins: 10 }).state.coins,
    ).toBe(attempt_roll <= 2 ? 93 : 10);
  });
  it('Cutpurse detection retains ration and foraging exceptions', () => {
    expect(run('talent.cutpurse.detected', { attempt_roll: 6 }).state).toMatchObject({
      chased_out: true,
      wait_until_party_leaves: true,
      normal_rations_required: true,
      foraging_allowed: true,
    });
  });
  it.each(['fear', 'terror', 'resolve'])('Braveheart distinguishes tests: %s', (test_kind) => {
    expect(
      run('talent.braveheart.fear_terror', { test_kind, check_modifier: 0 }).state.check_modifier,
    ).toBe(test_kind === 'resolve' ? 0 : 10);
  });
  it('Hate penalizes both defences against the chosen enemy', () => {
    expect(
      run('talent.hate.defence', {
        struck_by_hated_enemy: true,
        parry_modifier: 0,
        dodge_modifier: 5,
      }).state,
    ).toMatchObject({ parry_modifier: -5, dodge_modifier: 0 });
  });
  it('Nimble grants two dodges per battle', () => {
    expect(run('talent.nimble.dodge_limit', {}).state.dodges_per_battle).toBe(2);
  });
  it('Trapfinder stacks with Sharp-eyed', () => {
    expect(
      run('talent.trapfinder.detection', { detecting_trap: true, perception_modifier: 10 }).state,
    ).toMatchObject({ perception_modifier: 20, stacks_with_sharp_eyed: true });
  });
  it.each([0, 4, 5])('Keep Calm caps morale at its starting value: %i', (party_morale) => {
    expect(
      run('perk.keep_calm_and_carry_on.morale', { party_morale, starting_morale: 5 }).state
        .party_morale,
    ).toBe(Math.min(party_morale + 2, 5));
  });
  it('activation costs Energy but no AP', () => {
    expect(
      run('perk.healer.activation', { energy: 3, perks_used_this_action: 0 }).state,
    ).toMatchObject({ energy: 2, action_point_cost: 0 });
  });
  it('Energy to Mana spends the chosen amount without a second activation charge', () => {
    expect(
      run('perk.energy_to_mana.activation', {
        energy: 4,
        mana: 5,
        energy_spent: 3,
        perks_used_this_action: 0,
      }).state,
    ).toMatchObject({ energy: 1, mana: 65, action_point_cost: 0 });
  });
  it.each([1, 2, 3])(
    'identification Focus expands the printed miscast range: %i',
    (focus_actions) => {
      expect(
        run('perk.in_tune_with_the_magic.identification_focus', {
          identifying_magic_item: true,
          focus_actions,
        }).state,
      ).toMatchObject({
        focus_allowed: true,
        miscast_min_roll: 95 - 5 * (focus_actions - 1),
        miscast_max_roll: 100,
      });
    },
  );
  it('Frenzy keeps two turns, eight attacks and cumulative armour penetration', () => {
    expect(run('perk.frenzy.limits', { armour_penetration: 2 }).state).toMatchObject({
      armour_penetration: 3,
      duration_turns: 2,
      maximum_attacks: 8,
      only_move_or_attack: true,
    });
  });
  it.each(['medium', 'large', 'x_large'])(
    'Stunning Strike retains size exceptions: %s',
    (target_size) => {
      const suffix = target_size === 'large' ? 'large' : 'other_size';
      expect(
        run(`perk.stunning_strike.${suffix}`, {
          target_size,
          attack_success: true,
          target_next_turn_ap: 2,
        }).state.target_next_turn_ap,
      ).toBe(target_size === 'large' ? 1 : target_size === 'x_large' ? 2 : 0);
    },
  );
  it.each([2, 3])(
    'Hide in the Shadows uses more than two squares: %i',
    (distance_when_enemy_starts_turn) => {
      expect(
        run('perk.hide_in_the_shadows.distant', {
          distance_when_enemy_starts_turn,
          may_target_hero: true,
        }).state.may_target_hero,
      ).toBe(distance_when_enemy_starts_turn <= 2);
    },
  );
  it('Living on Nothing cannot recover its Energy during the same rest', () => {
    expect(run('perk.living_on_nothing.ration', {}).state).toMatchObject({
      counts_as_ration: true,
      energy_recoverable_in_same_rest: false,
    });
  });
  it('Taste for Blood changes the battle range to 01–10', () => {
    expect(
      run('perk.taste_for_blood.range', { used_before_damage_roll: true }).state,
    ).toMatchObject({ bloodlust_hit_roll_min: 1, bloodlust_hit_roll_max: 10, duration_battles: 1 });
  });
});
