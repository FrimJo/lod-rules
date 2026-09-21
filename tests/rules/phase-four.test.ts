import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
function run(ruleIds: string[], inputs: State) {
  const fixture = structuredClone(corpus.testCases[0]!);
  delete fixture.procedure_id;
  fixture.rule_ids = ruleIds;
  fixture.inputs = inputs;
  return runCase(fixture, corpus);
}
describe('Phase 4 reusable rule interactions', () => {
  it('expires only the Lingering Trauma contribution when leaving the dungeon', () => {
    const active = run(['character.condition.lingering_trauma'], {
      next_dungeon: true,
      trigger_occurred: true,
      other_resolve_modifier: -20,
    });
    expect(active.state.trauma_resolve_modifier).toBe(-10);
    const expired = run(['character.condition.trauma_expiry'], {
      ...active.state,
      leaves_dungeon: true,
    });
    expect(expired.state.trauma_resolve_modifier).toBe(0);
    expect(expired.state.trauma_combat_skill_modifier).toBe(0);
    expect(expired.state.active_until_dungeon_exit).toBe(false);
    expect(expired.state.other_resolve_modifier).toBe(-20);
  });
  it('wounded overrides the ordinary AP allocation for an odd maximum HP', () => {
    const result = run(['core.action_points.allocation', 'character.hit_points.wounded'], {
      mode: 'dungeon',
      maximum_hp: 9,
      hit_points: 4,
    });
    expect(result.state.action_points).toBe(1);
    expect(result.trace).toEqual(['character.hit_points.wounded']);
  });
  it('retains two AP just above the wounded threshold', () => {
    expect(
      run(['core.action_points.allocation', 'character.hit_points.wounded'], {
        mode: 'dungeon',
        maximum_hp: 9,
        hit_points: 5,
      }).state.action_points,
    ).toBe(2);
  });
  it('does not double-charge overlapping parry and fumble damage', () => {
    const result = run(
      [
        'character.durability.fumble',
        'character.durability.weapon_parry',
        'character.durability.overlap_uncertain',
      ],
      {
        roll: 100,
        attacking_or_parrying: true,
        durability: 6,
        weapon_parry: true,
        magic_weapon_attack: false,
      },
    );
    expect(result.state.durability).toBe(6);
    expect(result.unresolved).toEqual(['issue.phase4.durability_overlap']);
    expect(result.trace).toEqual(['character.durability.overlap_uncertain']);
  });
  it('applies the ordinary parry loss at 95 without a fumble loss', () => {
    const result = run(
      [
        'character.durability.fumble',
        'character.durability.weapon_parry',
        'character.durability.overlap_uncertain',
      ],
      {
        roll: 95,
        attacking_or_parrying: true,
        durability: 6,
        weapon_parry: true,
        magic_weapon_attack: false,
      },
    );
    expect(result.state.durability).toBe(5);
    expect(result.unresolved).toEqual([]);
  });
  it('uses the explicit magic durability exception', () => {
    const result = run(['character.durability.standard', 'character.durability.magic'], {
      otherwise_noted: false,
      weapon_armour_or_shield: true,
      magical: true,
    });
    expect(result.state.maximum_durability).toBe(8);
    expect(result.trace).toEqual(['character.durability.magic']);
  });
  it('does not invoke Hate when the missing Bestiary membership requirement is false', () => {
    const result = run(['character.condition.hate'], { last_enemy_in_bestiary: false });
    expect(result.events).toEqual([{ type: 'require', satisfied: false }]);
  });
  it('does not calculate stacked DEF for invalid layers', () => {
    const result = run(['character.equipment.stacked_armour'], {
      stackable: true,
      outer_tier: 1,
      inner_tier: 1,
      outer_def: 4,
      inner_def: 2,
    });
    expect(result.events).toEqual([{ type: 'require', satisfied: false }]);
    expect(result.state.defence).toBeUndefined();
  });
  it('rest recovery leaves the competing morale amounts unresolved', () => {
    const result = run(['character.morale.event.short_rest'], { morale: 4 });
    expect(result.state.morale).toBe(4);
    expect(result.unresolved).toEqual(['issue.phase4.short_rest_morale']);
  });
  it('can restore Mana and Energy on later nights without restoring spent Luck', () => {
    const result = run(['character.recovery.inn_resources', 'character.recovery.inn_luck'], {
      paid_lodging: true,
      first_restore_this_visit: false,
      mana_maximum: 60,
      energy_maximum: 3,
      luck_maximum: 2,
      mana: 10,
      energy: 0,
      luck: 0,
    });
    expect(result.state).toMatchObject({ mana: 60, energy: 3, luck: 0 });
  });
  it('requires a new settlement visit to restore spent Luck', () => {
    expect(
      run(['character.luck.settlement_reset'], {
        new_settlement_arrival: false,
        luck_maximum: 2,
        luck: 0,
      }).state.luck,
    ).toBe(0);
    expect(
      run(['character.luck.settlement_reset'], {
        new_settlement_arrival: true,
        luck_maximum: 2,
        luck: 0,
      }).state.luck,
    ).toBe(2);
  });
  it('preserves the exact Mana formula while exposing unresolved fractional capacity', () => {
    const result = run(['character.mana.initial', 'character.mana.fractional_pool_uncertain'], {
      wis: 41,
      wizard: true,
    });
    expect(result.state.mana).toBe(61.5);
    expect(result.unresolved).toEqual(['issue.phase4.mana_rounding']);
  });
  it('does not infer when non-kill battles or differing quest endpoints end', () => {
    expect(
      run(['core.battle.nonkill_end_uncertain'], { encounter_ended_without_all_dead: true })
        .unresolved,
    ).toEqual(['issue.0001']);
    expect(
      run(['core.quest.end_uncertain'], { reward_and_return_do_not_coincide: true }).unresolved,
    ).toEqual(['issue.0004']);
  });
  it('keeps the dungeon procedure linked to typed psychology dependencies without simulating a lifecycle', () => {
    const procedure = corpus.procedures.find((p) => p.id === 'procedure.dungeon_turn')!;
    expect(procedure.dependencies.find((d) => d.key === 'psychology')?.object_id).toBe(
      'core.turn.psychology',
    );
    expect(run(['core.turn.psychology'], {}).events).toEqual([
      { type: 'invoke', dependency: 'table.psychology.sanity_losses' },
      { type: 'invoke', dependency: 'table.psychology.morale_adjustments' },
    ]);
  });
});
