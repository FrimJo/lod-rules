import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const pilot = readPilot();
function run(ids: string[], inputs: State) {
  return runCase({ rule_ids: ids.map((id) => `core.magic.${id}`), inputs } as TestCase, pilot);
}
// Independently calculated boundary cases from PDF 64–67; not independent review.
describe('casting foundations (PDF 64–67)', () => {
  it('rounds Mana and failed/touch costs upward', () => {
    expect(run(['mana'], { wis: 31 }).state.maximum_mana).toBe(47);
    expect(run(['touch.failed'], { touch_succeeded: false, mana_cost: 7 }).state.mana_spent).toBe(
      4,
    );
  });
  it.each([39, 40, 41])('compares casting roll %i inclusively', (roll) => {
    const r = run(['casting.threshold', 'casting.success', 'casting.failure'], {
      arcane_arts: 50,
      casting_value: 10,
      mana: 20,
      mana_cost: 7,
      ordinary_cast: true,
      roll,
    });
    expect(r.state.casting_threshold).toBe(40);
    expect(r.state.mana_spent).toBe(roll <= 40 ? 7 : 4);
  });
  it.each([false, true])('wounded miscast threshold %s', (wounded) => {
    const r = run(['miscast.threshold.normal', 'miscast.threshold.wounded'], {
      wounded,
      power_levels: 2,
      focus_actions: 1,
    });
    expect(r.state.miscast_threshold).toBe(wounded ? 83 : 88);
  });
  it('upkeep waits until the following turn and cancellation until activation', () => {
    for (const turn_after_cast of [false, true])
      for (const wizard_activated of [false, true]) {
        const r = run(['upkeep', 'upkeep.cancel'], {
          turn_after_cast,
          wizard_activated,
          mana: 3,
          upkeep: 4,
        });
        expect(r.state.spell_cancelled).toBe(
          turn_after_cast && wizard_activated ? true : undefined,
        );
      }
    expect(
      run(['upkeep'], { turn_after_cast: true, wizard_activated: true, mana: 4, upkeep: 4 }).state
        .mana_after,
    ).toBe(0);
  });
  it('caps power by wizard level and five; other schools cannot use it', () => {
    for (const [school, power_levels, caster_level, valid] of [
      ['Destruction', 4, 4, true],
      ['Restoration', 5, 6, true],
      ['Destruction', 6, 6, false],
      ['Illusion', 1, 4, false],
    ] as const) {
      const r = run(['power'], { school, power_levels, caster_level, base_mana: 8 });
      expect(r.state.mana_cost).toBe(valid ? 8 + power_levels * 2 : undefined);
    }
  });
  it('focus requires casting next; no invented focus maximum', () => {
    expect(
      run(['focus'], { focus_actions: 3, arcane_arts: 40, cast_next_possible_action: true }).state,
    ).toMatchObject({ focused_arcane_arts: 70, miscast_reduction: 15 });
    expect(
      run(['focus'], { focus_actions: 3, arcane_arts: 40, cast_next_possible_action: false }).state
        .focused_arcane_arts,
    ).toBeUndefined();
  });
  it('perfect cast may exceed the Mana maximum', () => {
    expect(
      run(['perfect'], { roll: 5, choose_mana_gain: true, mana: 50, mana_cost: 15 }).state,
    ).toMatchObject({ mana_after: 65, maximize_damage_healing: true });
  });
  it('scrolls reduce CV to at least zero, cost no Mana, forbid focus and allow any level', () => {
    expect(
      run(['scroll'], { casting_value: 7, focus_actions: 0, quick_slot: true }).state,
    ).toMatchObject({ scroll_cv: 0, mana_spent: 0, upkeep_spent: 0, level_restricted: false });
    expect(
      run(['scroll'], { casting_value: 7, focus_actions: 1, quick_slot: true }).state.scroll_cv,
    ).toBeUndefined();
    expect(
      run(['scroll.skill.other'], { wizard: false, wis: 42, arcane_arts: 0, scroll_cv: 5 }).state
        .casting_threshold,
    ).toBe(37);
  });
  it.each([40, 41, 94, 95])('scroll destruction on %i', (roll) => {
    expect(run(['scroll.destroyed'], { roll, casting_threshold: 40 }).state.scroll_destroyed).toBe(
      roll <= 40 || roll >= 95 ? true : undefined,
    );
  });
  it('dispels round down and expend remaining Mana when insufficient', () => {
    expect(
      run(['dispel'], {
        already_attempted: false,
        spell_succeeded: true,
        damage_calculated: false,
        touch_or_close_combat: false,
        relevant_skill: 51,
        roll: 25,
      }).state.dispel_threshold,
    ).toBe(25);
    expect(
      run(['dispel.cost.sanity'], { enemy_or_mercenary: false, mana: 14, sanity_roll: 3 }).state,
    ).toMatchObject({ mana_spent: 14, sanity_lost: 3 });
  });
});

describe('specific spell exceptions and miscast outcomes', () => {
  it('miscast rows that print a die link a rule typing it (PDF 65)', () => {
    const table = pilot.tables.find((t) => t.id === 'table.magic.miscast')!;
    const refs = (row: string) => table.rows.find((r) => r.id === row)!.rule_refs;
    const dice = (id: string, field: string) =>
      pilot.rules.find((r) => r.id === `core.magic.miscast.${id}`)!.fields![field]!.dice;
    expect(refs('row_4')).toEqual(['core.magic.miscast.outcome_4']);
    expect(refs('row_7')).toEqual(['core.magic.miscast.outcome_7']);
    expect(refs('row_8')).toEqual(['core.magic.miscast.outcome_8']);
    expect(refs('row_10')).toEqual(['core.magic.miscast.outcome_10']);
    expect(dice('outcome_4', 'sanity_roll')).toEqual({ count: 1, sides: 3 });
    expect(dice('outcome_7', 'hp_roll')).toEqual({ count: 1, sides: 6 });
    expect(dice('outcome_8', 'friendly_sanity_roll')).toEqual({ count: 1, sides: 8 });
    expect(dice('outcome_8', 'wizard_sanity_roll')).toEqual({ count: 1, sides: 3 });
    expect(dice('outcome_10', 'damage_roll')).toEqual({ count: 1, sides: 10 });
    expect(
      run(['miscast.outcome_8'], {
        miscast_result: 8,
        friendly_sanity_roll: 8,
        wizard_sanity_roll: 3,
      }).state,
    ).toMatchObject({ friendly_sanity_lost: 8, wizard_sanity_lost: 3 });
    expect(() => run(['miscast.outcome_4'], { miscast_result: 4, sanity_roll: 4 })).toThrow(
      'Input out of range sanity_roll',
    );
  });
  const spell = (name: string, inputs: State) =>
    runCase({ rule_ids: [`core.spell.${name}`], inputs } as TestCase, pilot);
  it('miscast Mana overrides preserve full/triple/half costs', () => {
    expect(run(['miscast.outcome_2'], { miscast_result: 2, mana_cost: 7 }).state.mana_spent).toBe(
      7,
    );
    expect(run(['miscast.outcome_3'], { miscast_result: 3, mana_cost: 7 }).state.mana_spent).toBe(
      21,
    );
    expect(run(['miscast.outcome_6'], { miscast_result: 6, mana_cost: 7 }).state).toMatchObject({
      mana_spent: 4,
      spell_unavailable_until: 'rest in tavern',
    });
  });
  it('Open Lock uses HP as CV and Shield caps absorption and number of casts', () => {
    expect(
      spell('open_lock', { lock_hp: 25, can_touch_lock: true, target_locked_door_or_chest: true })
        .state.casting_value,
    ).toBe(25);
    expect(
      spell('protective_shield', { caster_level: 6, casts_on_target: 1, in_los_or_self: true })
        .state.damage_absorbed,
    ).toBe(3);
    expect(
      spell('protective_shield', { caster_level: 6, casts_on_target: 2, in_los_or_self: true })
        .state.damage_absorbed,
    ).toBeUndefined();
  });
  it('Time Freeze has a once-per-battle limit while Second Sight only adds tokens', () => {
    expect(
      spell('time_freeze', { already_cast_this_battle: false }).state.additional_activation,
    ).toBe(true);
    expect(
      spell('time_freeze', { already_cast_this_battle: true }).state.additional_activation,
    ).toBeUndefined();
    expect(spell('second_sight', {}).state).toMatchObject({ hero_tokens_if_encounter: 2 });
    expect(spell('second_sight', {}).state.additional_activation).toBeUndefined();
  });
  it('summons preserve different readiness and control timing without invented stats', () => {
    expect(spell('summon_lesser_demon', {}).state).toMatchObject({
      hero_tokens_added: 1,
      acts_as_part_of_heroes_next_turn: true,
    });
    expect(
      spell('summon_lesser_demon.upkeep_and_control', {
        start_of_turn: true,
        caster_resolve_failed: true,
      }).state,
    ).toMatchObject({ mana_upkeep: 4, demon_breaks_free: true });
    expect(spell('summon_demon', {}).state).toMatchObject({
      hero_tokens_added: 1,
      token_timing: 'immediate',
      upkeep: 0,
    });
    expect(spell('summon_earth_elemental', {}).state.printed_duration).toBe('ML number of turns');
    expect(
      spell('healing', { in_los: true, distance: 4, healing_roll: 3 }).state.printed_healing,
    ).toBe('1d/+2');
  });
});
