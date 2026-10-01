import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const pilot = readPilot();
const run = (ids: string[], inputs: State) => runCase({ rule_ids: ids, inputs } as TestCase, pilot);
const alchemy = (id: string, inputs: State) => run([`character.alchemy.${id}`], inputs);
const prayer = (id: string, inputs: State) => run([`character.prayer.${id}`], inputs);
describe('ordinary and explicitly optional alchemy (PDF 72–81)', () => {
  it.each([
    ['weak', 1, 1, true],
    ['weak', 2, 0, false],
    ['standard', 2, 1, true],
    ['standard', 1, 2, true],
    ['standard', 3, 0, false],
    ['supreme', 1, 3, true],
    ['supreme', 2, 2, true],
    ['supreme', 4, 0, false],
  ] as const)(
    '%s accepts %i parts and %i ingredients: %s',
    (quality, parts, ingredients, valid) => {
      const r = alchemy(`ordinary.${quality}`, {
        simplified: false,
        quality,
        parts,
        ingredients,
        empty_bottle: true,
      });
      expect(r.state.components_required).toBe(valid ? parts + ingredients : undefined);
    },
  );
  it.each([
    ['weak', 4],
    ['standard', 6],
    ['supreme', 8],
  ] as const)('simplified %s requires %i unique components', (quality, count) => {
    expect(
      alchemy(`simplified.${quality}`, {
        simplified: true,
        quality,
        component_count: count,
        unique_count: count,
      }).state,
    ).toMatchObject({
      components_required: count,
      exquisite_modifier: 0,
      success_selection: 'free choice',
    });
    expect(
      alchemy(`simplified.${quality}`, {
        simplified: true,
        quality,
        component_count: count,
        unique_count: count - 1,
      }).state.components_required,
    ).toBeUndefined();
    expect(alchemy(`ordinary.${quality}`, { simplified: true, quality }).trace).toEqual([]);
  });
  it('exquisite +10 does not stack and is ignored in simplified mode; recipes add +10', () => {
    for (const exquisite_count of [1, 4])
      expect(
        alchemy('mix.exquisite_bonus', { simplified: false, exquisite_count }).state
          .exquisite_modifier,
      ).toBe(10);
    expect(
      alchemy('mix.exquisite_bonus', { simplified: true, exquisite_count: 4 }).state
        .exquisite_modifier,
    ).toBeUndefined();
    expect(
      alchemy('mix.recipe_bonus', { simplified: false, has_recipe: true }).state.recipe_modifier,
    ).toBe(10);
    expect(alchemy('mix.failure', { succeeded: false }).state).toMatchObject({
      components_lost: true,
      bottle_kept: true,
    });
  });
  it('ordinary random result differs from simplified free selection', () => {
    expect(
      alchemy('mix.success.random', { simplified: false, succeeded: true, has_recipe: false }).state
        .result_selection,
    ).toBe('random_potions_table');
    expect(
      alchemy('mix.success.recipe', { simplified: false, succeeded: true, has_recipe: true }).state
        .result_selection,
    ).toBe('recipe');
    expect(
      alchemy('simplified.experience', { simplified: true, experience_potions_since_quest: 1 })
        .events,
    ).toEqual([{ type: 'require', satisfied: false }]);
  });
  it.each([
    ['potion_of_health', ['1d4', '1d6', '1d10']],
    ['potion_of_mana', ['1d20', '2d20', '3d20']],
    ['firebomb', ['1d6', '1d10', '1d12']],
  ] as const)('strengths for %s', (name, dice) => {
    for (const [i, quality] of ['weak', 'standard', 'supreme'].entries())
      expect(
        alchemy(`quality_effect.${name}.${quality}`, { quality: quality!, effect_roll: 3 }).state
          .effect_dice,
      ).toBe(dice[i]);
  });
  it('stat potion values, duration exceptions and non-stacking', () => {
    expect(
      alchemy('quality_effect.potion_of_dexterity.supreme', { quality: 'supreme' }).state
        .stat_bonus,
    ).toBe(15);
    expect(alchemy('preparation.potion_of_dexterity', {}).state).toMatchObject({
      affects_based_skills: true,
      duration: 'current_or_next_battle',
    });
    expect(alchemy('preparation.potion_of_smoke', {}).state).toMatchObject({
      duration_turns: 4,
      cs_modifier: -20,
      shooting_through_allowed: false,
    });
    expect(alchemy('preparation.potion_of_dragon_skin', {}).state).toMatchObject({
      duration_turns: 3,
      exceptions: 'spells or poison',
      armour_damage_allowed: true,
    });
    expect(
      alchemy('drink', { same_stat_potion_active: true }).state.stat_effect_applied,
    ).toBeUndefined();
    expect(alchemy('drink', { same_stat_potion_active: false }).state).toMatchObject({
      stat_effect_applied: true,
      default_duration_turns: 5,
      keep_bottle: true,
    });
  });
  it('cure potency and Frenzy handoff are explicit', () => {
    expect(
      alchemy('quality_effect.potion_of_cure_poison.weak', { quality: 'weak' }).state
        .success_chance,
    ).toBe(75);
    expect(
      alchemy('quality_effect.potion_of_cure_disease.supreme', { quality: 'supreme' }).state,
    ).toMatchObject({ success_chance: 100, bonus_healing_dice: '1d3' });
    expect(alchemy('preparation.potion_of_rage', {}).events).toEqual([
      { type: 'invoke', dependency: 'perk.frenzy' },
    ]);
  });
});
describe('prayers (PDF 82–83)', () => {
  it('free action costs Energy except impeccable roll', () => {
    expect(
      run(['character.prayer.activation', 'character.prayer.impeccable'], { roll: 5 }).state,
    ).toMatchObject({ action_points_spent: 0, energy_spent: 0 });
    expect(
      run(['character.prayer.activation', 'character.prayer.impeccable'], { roll: 6 }).state
        .energy_spent,
    ).toBe(1);
    expect(prayer('success', { roll: 50, battle_prayer: 50 }).state.prayer_succeeded).toBe(true);
    expect(
      prayer('success', { roll: 51, battle_prayer: 50 }).state.prayer_succeeded,
    ).toBeUndefined();
  });
  it.each(['stunned', 'fallen_over', 'zero_hp', 'terror_failed'])(
    '%s interrupts chanting and suppresses effect',
    (cause) => {
      const input = {
        prayer_active: true,
        stunned: cause === 'stunned',
        fallen_over: cause === 'fallen_over',
        hp: cause === 'zero_hp' ? 0 : 5,
        terror_failed: cause === 'terror_failed',
      };
      const r = run(['character.prayer.interruption', 'character.prayer.warriors_of_ramos'], input);
      expect(r.state.prayer_active).toBe(false);
      expect(r.state.cs_bonus).toBeUndefined();
    },
  );
  it('one active prayer; between-battle duration is four turns', () => {
    expect(prayer('duration', { active_prayers: 1 }).state).toMatchObject({
      maximum_active_prayers: 1,
      between_battles_turns: 4,
    });
    expect(prayer('duration', { active_prayers: 2 }).events).toEqual([
      { type: 'require', satisfied: false },
    ]);
  });
  it('Stay Thy Hand cannot stack action loss, including wounded enemies', () => {
    const input = {
      prayer_active: true,
      distance: 4,
      at_turn_start: true,
      res_succeeded: false,
      other_action_loss: false,
      wounded: false,
      is_enemy: true,
    };
    expect(prayer('stay_thy_hand', input).state.actions_lost).toBe(1);
    for (const change of [
      { distance: 5 },
      { wounded: true },
      { other_action_loss: true },
      { res_succeeded: true },
    ])
      expect(prayer('stay_thy_hand', { ...input, ...change }).state.actions_lost).toBeUndefined();
  });
  it('Balm stops after healing; Verse has a per-hero/quest limit; champion rounds down', () => {
    expect(
      prayer('methias_balm', { prayer_active: true, adjacent_or_self: true, healing_roll: 6 })
        .state,
    ).toMatchObject({ hp_regained: 7, prayer_stops: true });
    expect(
      prayer('verse_of_the_sane', { prayer_active: true, uses_this_hero_quest: 1, sanity_roll: 3 })
        .state.sanity_regained,
    ).toBeUndefined();
    expect(
      prayer('gods_champion.after_battle.constitution', {
        battle_ended: true,
        energy: 0,
        constitution: 31,
      }).state.constitution_after,
    ).toBe(15);
  });
  it('relic restrictions require priest, one ring and one necklace', () => {
    for (const input of [
      { warrior_priest: false, rings: 1, necklaces: 1 },
      { warrior_priest: true, rings: 2, necklaces: 0 },
    ])
      expect(prayer('relics', input).events).toContainEqual({ type: 'require', satisfied: false });
  });
});

describe('Batch 4 source audit: self-mixed identification (PDF 76 and 197)', () => {
  it.each(['random', 'recipe'])(
    '%s retains the explicit appendix exception and its source',
    (mode) => {
      const id = `character.alchemy.mix.success.${mode}`;
      const rule = pilot.rules.find((rule) => rule.id === id)!;
      expect(rule.source.map((source) => source.pdf_page)).toEqual([76, 197]);
      expect(
        run([id], { simplified: false, succeeded: true, has_recipe: mode === 'recipe' }).state
          .identification_required,
      ).toBe(false);
      expect(
        run([id], { simplified: false, succeeded: false, has_recipe: mode === 'recipe' }).state
          .identification_required,
      ).toBeUndefined();
    },
  );
});
