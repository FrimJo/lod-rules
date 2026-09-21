import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
function run(suffix: string, inputs: State, extra: string[] = []) {
  const id = `character.background.${suffix}`;
  const rule = corpus.rules.find((r) => r.id === id)!;
  const fixture: TestCase = {
    id: `test.background.${suffix}`,
    name: suffix,
    section_id: rule.section_id,
    source: rule.source,
    status: 'extracted',
    confidence: 'high',
    source_text: 'Derived boundary case for the cited background rule.',
    kind: 'derived_case',
    rule_ids: [id, ...extra.map((s) => `character.background.${s}`)],
    inputs,
    expected: { state: {}, events: [], trace: [], unresolved: [], steps: [] },
  };
  return runCase(fixture, corpus);
}
describe('Phase 5 personal traits and quest boundaries', () => {
  it.each([10, 11])('Wanderlust counts all eleven distinct settlements: %i', (count) => {
    expect(
      run('wanderlust.reward', {
        distinct_settlements_visited: count,
        all_map_settlements_visited: count === 11,
        reward_already_received: false,
        xp: 0,
      }).state.xp,
    ).toBe(count === 11 ? 1500 : 0);
  });
  it.each([4, 5])('The Well needs five survived corridor battles: %i', (battles) => {
    const result = run('the_well.cure_and_reward', {
      corridor_battles_fought_and_survived: battles,
      reward_already_received: false,
      claustrophobia: true,
    });
    expect(result.state.claustrophobia).toBe(battles < 5);
    expect(result.events).toEqual(
      battles === 5 ? [{ type: 'invoke', dependency: 'Tunnel Fighter Talent' }] : [],
    );
  });
  it.each([false, true])('Fables awards on leaving the third site: %s', (leaving) => {
    expect(
      run('fables.reward', {
        ancient_lands_quest_sites_visited: 3,
        leaving_third_site: leaving,
        reward_already_received: false,
        xp: 0,
      }).state.xp,
    ).toBe(leaving ? 1500 : 0);
  });
  it.each([1, 2, 10])('Heirloom placement only on a one: %i', (roll) => {
    const result = run('the_heirloom.quest_setup', { quest_start_roll: roll });
    if (roll === 1)
      expect(result.state).toMatchObject({
        secondary_card_location: 'first_half_of_exploration_pile',
        next_room_has_enemies: true,
        encounter_rolls: 2,
        sword_carrier_selection: 'one_enemy_with_highest_xp',
        sword_used_by_enemy: false,
      });
    else expect(result.trace).toEqual([]);
  });
  it('retains the heirloom item properties and sale prohibition', () => {
    expect(run('the_heirloom.sword_properties', {}).state).toEqual({
      weapon: 'shortsword',
      material: 'silver',
      damage_modifier: 1,
      durability_modifier: 2,
      sale_allowed: false,
    });
  });
  it.each([2, 3])('Arachnophobia cure threshold: %i', (count) => {
    expect(
      run('arachnophobia.cure', { spider_battles_fought_and_survived: count, arachnophobia: true })
        .state.arachnophobia,
    ).toBe(count < 3);
  });
  it.each([false, true])('spider attack bonus only against spiders: %s', (spider) => {
    expect(
      run('arachnophobia.spider_attack_bonus', {
        spider_bonus_earned: true,
        target_is_spider: spider,
        trying_to_hit: true,
        combat_skill_modifier: 0,
      }).state.combat_skill_modifier,
    ).toBe(spider ? 10 : 0);
  });
  it.each([59, 60, 61])('Lost Brother discovery boundary at %i', (total) => {
    const result = run('the_lost_brother.discovery', { roll: total - 5, dungeons_entered: 5 }, [
      'the_lost_brother.surviving_brother',
    ]);
    expect(result.state.brother_alive).toBe(total < 60);
    expect(result.state.result).toBe(total);
  });
  it('Lost Brother death is -3 Sanity and 250 XP; burial separately adds RES', () => {
    expect(
      run('the_lost_brother.death_consequences', {
        brother_dead: true,
        death_consequences_received: false,
        sanity: 8,
        xp: 0,
      }).state,
    ).toMatchObject({ sanity: 5, xp: 250 });
    expect(
      run('the_lost_brother.bury_outside', {
        buried_brother_outside: true,
        burial_reward_received: false,
        resolve: 30,
      }).state.resolve,
    ).toBe(40);
    expect(
      run('the_lost_brother.skirmish_body_exception', { died_in_skirmish: true }).state
        .must_carry_body,
    ).toBe(false);
  });
  it.each([false, true])('rescue reward waits for next settlement: %s', (reached) => {
    expect(
      run('the_lost_brother.rescue_reward', {
        brother_alive: true,
        reached_next_settlement: reached,
        rescue_reward_received: false,
        xp: 0,
      }).state.xp,
    ).toBe(reached ? 1500 : 0);
  });
  it.each([
    [4, 0, 0],
    [5, 0, 250],
    [10, 1, 250],
    [10, 2, 0],
  ])('Bandit Revenge counts unrewarded groups: %i/%i', (kills, paid, xp) => {
    expect(
      run('revenge_bandits.kill_reward', {
        qualifying_killing_blows: kills,
        previously_rewarded_groups: paid,
        xp: 0,
      }).state.xp,
    ).toBe(xp);
  });
  it('Bad Tempered changes maximum Sanity, not current Sanity', () => {
    expect(
      run('bad_tempered.trait', { party_morale_modifier: 0, maximum_sanity: 8, sanity: 5 }).state,
    ).toMatchObject({ party_morale_modifier: -2, maximum_sanity: 10, sanity: 5 });
  });
  it.each([9, 10])('Poverty reserve boundary: %i', (coins) => {
    expect(run('poverty.coin_reserve', { coins_after_purchase_or_loan: coins }).events).toEqual([
      { type: 'require', satisfied: coins >= 10 },
    ]);
  });
  it.each([999, 1000])('family gift requires 1000 coins: %i', (coins) => {
    expect(
      run('poverty.family_gift', {
        at_family_village: true,
        reward_already_received: false,
        coins,
        movement_points: 1,
        xp: 0,
      }).state,
    ).toMatchObject(
      coins < 1000
        ? { coins, movement_points: 1, xp: 0 }
        : { coins: 0, movement_points: 0, xp: 2000 },
    );
  });
  it.each([449, 450])('Proving Your Worth XP threshold: %i', (xp) => {
    expect(
      run('proving_your_worth.qualifying_kill', { enemy_xp: xp, party_made_kill: true }).state
        .qualified,
    ).toBe(xp >= 450 ? true : undefined);
  });
  it('The Fraud rerolls for wizards and preserves the optional extra RES', () => {
    expect(run('the_fraud.wizard_reroll', { wizard: true }).state.reroll_background).toBe(true);
    for (const extra_resolve of ['accept', 'decline'])
      expect(
        run('the_fraud.reward', {
          cs_improvement: 10,
          rs_improvement: 10,
          dodge_improvement: 10,
          reward_already_received: false,
          extra_resolve,
          resolve: 20,
          xp: 0,
        }).state,
      ).toMatchObject({ resolve: extra_resolve === 'accept' ? 40 : 30, xp: 1500 });
  });
  it.each([149, 150])('The Noble threshold: %i', (coins) => {
    const rule = coins < 150 ? 'low_money_resolve' : 'money_restored';
    expect(run(`the_noble.${rule}`, { coins }).state.noble_resolve_modifier).toBe(
      coins < 150 ? -20 : 0,
    );
  });
  it.each([9, 10])('Sworn Enemy adds one leader on ten: %i', (roll) => {
    expect(
      run('sworn_enemy.bandit_encounter', { battle_with_bandits: true, roll }).state
        .additional_bandit_leaders,
    ).toBe(roll === 10 ? 1 : undefined);
  });
  it('Family Keep requires every tile and every enemy', () => {
    expect(
      run('the_family_keep.reward', {
        at_family_keep: true,
        all_tiles_placed: true,
        all_enemies_killed: false,
        reward_already_received: false,
        xp: 0,
      }).state.xp,
    ).toBe(0);
    expect(
      run('the_family_keep.reward', {
        at_family_keep: true,
        all_tiles_placed: true,
        all_enemies_killed: true,
        reward_already_received: false,
        xp: 0,
      }).state.xp,
    ).toBe(1500);
  });
  it.each([false, true])('Troll Slayer requires the killing blow: %s', (final) => {
    expect(
      run('troll_slayer.reward', {
        target_is_troll: true,
        delivered_killing_blow: final,
        reward_already_received: false,
        xp: 0,
      }).state.xp,
    ).toBe(final ? 1000 : 0);
  });
  it('Minotaur reward stays unresolved without speculative XP', () => {
    const result = run('revenge_minotaur.reward', {
      recognize_scar: true,
      beast_defeated: true,
      xp: 0,
    });
    expect(result.unresolved).toEqual(['issue.phase5.minotaur_reward_missing']);
    expect(result.state.xp).toBe(0);
  });
  it('A new home requires the named estate', () => {
    expect(
      run('a_new_home.reward', {
        bergmeister_estate_acquired: true,
        reward_already_received: false,
        xp: 0,
      }).state.xp,
    ).toBe(1500);
  });
  it.each(['armour_repair_kit', 'whetstone', 'other'])('Apprentice repair with %s', (tool) => {
    expect(run('the_apprentice.repair', { tool, durability: 2 }).state.durability).toBe(
      tool === 'other' ? 2 : 5,
    );
  });
  it.each([2, 3])('Weak changes after the third disease: %i', (cured) => {
    const result = run(
      'weak.initial_vulnerability',
      {
        diseases_cured: cured,
        rolling_to_contract_disease: true,
        rolling_for_disease: true,
        constitution_modifier: 0,
      },
      ['weak.improved_immunity'],
    );
    expect(result.state.constitution_modifier).toBe(cured < 3 ? -10 : 10);
  });
  it.each([10, 11])('Weak natural cure threshold: %i', (roll) => {
    expect(
      run('weak.improved_cure', {
        diseases_cured: 3,
        rolling_for_disease: true,
        natural_constitution_roll: roll,
      }).state.disease_cured,
    ).toBe(roll === 10 ? true : undefined);
  });
  it.each(['fear', 'terror'])('Afraid of Heights distinguishes %s', (test_kind) => {
    expect(
      run('afraid_of_heights.fear_bonus', { test_kind, resolve_modifier: 0 }).state
        .resolve_modifier,
    ).toBe(test_kind === 'fear' ? 10 : 0);
  });
  it('bridge RES rounds down and applies separate CS and RS penalties', () => {
    expect(
      run('afraid_of_heights.bridge_penalties', {
        on_bridge: true,
        resolve_before_bridge: 31,
        combat_skill_modifier: 0,
        ranged_skill_modifier: 0,
      }).state,
    ).toMatchObject({ bridge_resolve: 15, combat_skill_modifier: -20, ranged_skill_modifier: -20 });
  });
});
