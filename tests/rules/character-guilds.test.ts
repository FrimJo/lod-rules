import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (id: string, inputs: State) =>
  runCase({ procedure_id: `procedure.${id}`, inputs } as TestCase, corpus);
const base: State = {
  settlement: 'silver_city',
  profession: 'ranger',
  guild: 'rangers',
  operation: 'tuition',
  business_allowed: true,
  leaving_on_quest: false,
  access_granted: true,
  activity_authorized: true,
  duration_completed: true,
  coins: 1000,
};

describe('guild access — PDF 145, 148–158', () => {
  it.each([
    ['dark', 'thief'],
    ['dark', 'rogue'],
    ['fighters', 'warrior'],
    ['fighters', 'barbarian'],
    ['wizards', 'wizard'],
    ['alchemists', 'alchemist'],
    ['rangers', 'ranger'],
    ['inner_sanctum', 'warrior_priest'],
  ])('permits %s / %s', (guild, profession) => {
    expect(run('guild_access', { ...base, guild, profession }).state.access_granted).toBe(true);
    expect(
      run('guild_access', { ...base, guild, profession, settlement: 'village' }).state
        .access_granted,
    ).toBe(false);
  });
  it('admits nonwizard recharging visitors without granting unrestricted guild access', () => {
    expect(
      run('guild_access', { ...base, guild: 'wizards', operation: 'recharge' }).state
        .access_granted,
    ).toBe(true);
    expect(
      run('guild_access', { ...base, guild: 'wizards', operation: 'training' }).state
        .access_granted,
    ).toBe(false);
    expect(
      run('guild_access', {
        ...base,
        guild: 'wizards',
        operation: 'recharge',
        leaving_on_quest: true,
      }).state.access_granted,
    ).toBe(false);
  });
});

describe('Ranger tuition — PDF 156', () => {
  const tuition = {
    ...base,
    level: 2,
    last_tuition_level: 0,
    talent: 'skinning',
    already_known: false,
  };
  it.each([
    ['skinning', 250],
    ['butcher', 200],
    ['taxidermist', 350],
  ])('learns %s at its printed fee %i', (talent, cost) => {
    const r = run('ranger_special_talent', { ...tuition, talent });
    expect(r.state).toMatchObject({
      coins: 1000 - Number(cost),
      learned: true,
      last_tuition_level: 2,
    });
    expect(run('ranger_special_talent', r.state).state.coins).toBe(1000 - Number(cost));
  });
  it('requires a level between different talents, including across city visits', () => {
    const first = run('ranger_special_talent', tuition);
    const second = { ...first.state, talent: 'butcher', already_known: false, visit_id: 10 };
    expect(run('ranger_special_talent', second).state.learned).toBe(false);
    expect(run('ranger_special_talent', { ...second, level: 3 }).state).toMatchObject({
      coins: 550,
      learned: true,
      last_tuition_level: 3,
    });
  });
  it.each<State>([
    { profession: 'wizard' },
    { coins: 249 },
    { activity_authorized: false },
    { duration_completed: false },
    { access_granted: false },
    { talent: 'invented' },
  ])('rejects tuition %j', (override) => {
    expect(run('ranger_special_talent', { ...tuition, ...override }).state.learned).toBe(false);
  });
});

describe('bounty and crusade rewards — PDF 151, 159', () => {
  const bounty: State = {
    ...base,
    profession: 'warrior',
    guild: 'fighters',
    operation: 'bounty',
    phase: 'assign',
    offer_initialized: false,
    five_rolls_resolved: true,
    offered_enemy: 'Bandit',
    enemy_was_offered: true,
    killed_on_next_quest: true,
    claim_window_valid: true,
    kind_claimed: false,
  };
  it('assigns five resolved rolls once and pays one reward per kind rather than per duplicate slot', () => {
    const assigned = run('fighters_bounty', bounty);
    expect(assigned.state.offer_initialized).toBe(true);
    expect(run('fighters_bounty', assigned.state).events).toEqual([]);
    const claimed = run('fighters_bounty', { ...assigned.state, phase: 'claim' });
    expect(claimed.state).toMatchObject({ coins: 1250, kind_claimed: true, claimed: true });
    expect(run('fighters_bounty', claimed.state).state).toMatchObject({
      coins: 1250,
      claimed: false,
    });
  });
  it.each<State>([
    { enemy_was_offered: false },
    { killed_on_next_quest: false },
    { claim_window_valid: false },
    { duration_completed: false },
  ])('rejects invalid bounty %j', (override) => {
    expect(
      run('fighters_bounty', { ...bounty, phase: 'claim', offer_initialized: true, ...override })
        .state.coins,
    ).toBe(1000);
  });
  const crusade: State = {
    ...base,
    profession: 'warrior_priest',
    guild: 'inner_sanctum',
    operation: 'crusade',
    phase: 'assign',
    assigned: false,
    crusade_roll: 3,
    target: '',
    eligible_trophies: 7,
    next_dungeon_left: false,
    trophy_count_resolved: true,
    next_sanctum_visit: true,
    paid: false,
  };
  it('sets the target once, counts any party killer, and pays once after leaving the next dungeon', () => {
    const assigned = run('sanctum_crusade', crusade);
    expect(assigned.state.target).toBe('Orcs and Goblins');
    expect(run('sanctum_crusade', { ...assigned.state, crusade_roll: 1 }).state.target).toBe(
      'Orcs and Goblins',
    );
    expect(run('sanctum_crusade', { ...assigned.state, phase: 'collect' }).state.coins).toBe(1000);
    const collected = run('sanctum_crusade', {
      ...assigned.state,
      phase: 'collect',
      next_dungeon_left: true,
    });
    expect(collected.state).toMatchObject({ coins: 1175, reward: 175, paid: true });
    expect(run('sanctum_crusade', collected.state).state.coins).toBe(1175);
  });
  it('does not pay from unresolved target/quest counts', () => {
    expect(
      run('sanctum_crusade', {
        ...crusade,
        phase: 'collect',
        assigned: true,
        next_dungeon_left: true,
        trophy_count_resolved: false,
      }).state.coins,
    ).toBe(1000);
  });
});

describe('guild item service fees — PDF 153, 158', () => {
  const item: State = {
    ...base,
    guild: 'wizards',
    operation: 'recharge',
    service_completed: false,
    item_kind: 'magic_item',
    item_present: true,
    repaired: true,
    needs_recharge: true,
    purchase_price: 400,
    staff_capacity: 3,
    charges: 0,
    magic_active: false,
    blessing_active: false,
    temporary_durability_bonus: 0,
    undead_demon_damage_bonus: 0,
    expires_at: '',
  };
  it('recharges a repaired item for 250, once', () => {
    const r = run('guild_item_service', item);
    expect(r.state).toMatchObject({ coins: 750, magic_active: true, needs_recharge: false });
    expect(run('guild_item_service', r.state).state.coins).toBe(750);
  });
  it('recharges a staff for half its catalogue price', () => {
    expect(run('guild_item_service', { ...item, item_kind: 'staff' }).state).toMatchObject({
      coins: 800,
      charges: 3,
      magic_active: true,
    });
  });
  it.each<State>([
    { repaired: false },
    { duration_completed: false },
    { item_present: false },
    { access_granted: false },
    { coins: 249 },
  ])('rejects ineligible item service %j', (override) => {
    expect(run('guild_item_service', { ...item, ...override }).state.performed).toBe(false);
  });
  it('blesses one armour piece or weapon with a separately owned temporary effect', () => {
    const priest = {
      ...item,
      profession: 'warrior_priest',
      guild: 'inner_sanctum',
      operation: 'bless',
    };
    const armour = run('guild_item_service', { ...priest, item_kind: 'armour' });
    expect(armour.state).toMatchObject({
      coins: 975,
      temporary_durability_bonus: 1,
      blessing_active: true,
      expires_at: 'leave_next_dungeon',
    });
    const weapon = run('guild_item_service', { ...priest, item_kind: 'weapon' });
    expect(weapon.state).toMatchObject({
      coins: 925,
      undead_demon_damage_bonus: 2,
      blessing_active: true,
      expires_at: 'leave_next_dungeon',
    });
    expect(run('guild_item_service', weapon.state).state.coins).toBe(925);
  });
});

describe('Sanctum prayer — PDF 146–147, 158', () => {
  const prayer: State = {
    ...base,
    profession: 'warrior_priest',
    guild: 'inner_sanctum',
    operation: 'pray',
    god: 'charus',
    prayer_roll: 5,
    prayed_since_quest: false,
    chosen_god: '',
    reserved_activity_points: 1,
    completed_activity_days: 1,
    ohlnir_choice: 'cs',
    boon: '',
    expires_at: '',
  };
  it('charges one completed prayer and grants the source boon, without executing the handoff twice', () => {
    const r = run('sanctum_prayer', prayer);
    expect(r.state).toMatchObject({
      coins: 950,
      prayed_since_quest: true,
      boon_granted: true,
      boon: '+1 Energy that cannot be regained through resting',
      expires_at: 'leave_next_dungeon',
    });
    expect(r.events).toContainEqual({
      type: 'invoke',
      dependency: 'character.settlement.temple.charus',
    });
    const retry = run('sanctum_prayer', r.state);
    expect(retry.unresolved).toContain('issue.guild.same_god_prayer_retry');
    expect(retry.state.coins).toBe(950);
    expect(run('sanctum_prayer', { ...r.state, god: 'ramos' }).state).toMatchObject({
      coins: 950,
      boon_granted: false,
    });
  });
  it('failed prayers consume the choice and fee; Trickster penalty remains unresolved', () => {
    const failed = run('sanctum_prayer', { ...prayer, prayer_roll: 6 });
    expect(failed.state).toMatchObject({
      coins: 950,
      prayed_since_quest: true,
      boon_granted: false,
    });
    const trickster = run('sanctum_prayer', { ...prayer, prayer_roll: 6, god: 'rhidnir', luck: 3 });
    expect(trickster.unresolved).toContain('issue.settlement.trickster_deduction');
    expect(trickster.state).toMatchObject({ coins: 950, luck: 3, prayed_since_quest: true });
  });
  it('cannot pray before completing the full day', () => {
    expect(run('sanctum_prayer', { ...prayer, completed_activity_days: 0 }).state.coins).toBe(1000);
    expect(
      run('sanctum_prayer', { ...prayer, god: 'ohlnir', ohlnir_choice: 'both' }).state.coins,
    ).toBe(1000);
  });
});

describe('Taxidermist trophy selling — PDF 156', () => {
  const trophy: State = {
    settlement_type: 'village',
    profession: 'ranger',
    taxidermist_known: true,
    trophy_available: true,
    sale_attempted_here: false,
    activity_authorized: true,
    reserved_activity_points: 1,
    duration_completed: true,
    business_allowed: true,
    leaving_on_quest: false,
    sale_roll: 1,
    creature_xp: 500,
    coins: 100,
  };
  it('zero means no buyer and consumes the settlement attempt without consuming the trophy', () => {
    const r = run('ranger_trophy_sale', trophy);
    expect(r.state).toMatchObject({
      coins: 100,
      sale_value: 0,
      sale_attempted_here: true,
      trophy_available: true,
    });
    const repeat = run('ranger_trophy_sale', { ...r.state, sale_roll: 20, visit_id: 5 });
    expect(repeat.state.coins).toBe(100);
    expect(repeat.state.sold).toBe(false);
  });
  it('a different settlement supplies a distinct attempt record and can buy the retained trophy', () => {
    const r = run('ranger_trophy_sale', { ...trophy, settlement_type: 'silver_city' });
    expect(r.state).toMatchObject({
      coins: 300,
      sale_value: 200,
      trophy_available: false,
      sold: true,
    });
    expect(run('ranger_trophy_sale', r.state).state.coins).toBe(300);
  });
  it.each([
    [1, -500, -300],
    [2, -400, -200],
    [3, -400, -200],
    [4, -300, -100],
    [5, -300, -100],
    [6, -150, -50],
    [8, -150, -50],
    [9, 0, 0],
    [14, 0, 0],
    [15, 50, 100],
    [17, 50, 100],
    [18, 100, 200],
    [19, 100, 200],
    [20, 200, 300],
  ])('uses printed sale modifiers at roll %i', (sale_roll, village, city) => {
    expect(run('ranger_trophy_sale', { ...trophy, sale_roll }).state.sale_modifier).toBe(village);
    expect(
      run('ranger_trophy_sale', { ...trophy, sale_roll, settlement_type: 'silver_city' }).state
        .sale_modifier,
    ).toBe(city);
  });
  it.each<State>([
    { duration_completed: false },
    { reserved_activity_points: 0 },
    { trophy_available: false },
    { profession: 'wizard' },
    { leaving_on_quest: true },
  ])('cannot sell without a completed eligible activity %j', (override) => {
    const r = run('ranger_trophy_sale', { ...trophy, ...override, sale_roll: 20 });
    expect(r.state.coins).toBe(100);
    expect(r.state.attempted).toBe(false);
  });
});
const service: State = {
  base_purchase_price: 100,
  quoted_purchase_price: 100,
  event_price_modifier: 0,
  event_price_delta: 0,
  combined_price_resolved: false,
  quest_departure_day: -1,
  quest_completed: true,
  reward_promised: true,
  at_quest_start_settlement: true,
  reward_collected: false,
  reward_value: 200,
  operation: 'purchase',
  visit_id: 0,
  item_lock_visit: -1,
  availability_roll: 3,
  item_availability: 3,
  item_locked_until_return: false,
  service_available: true,
  service_eligible: true,
  business_allowed: true,
  leaving_on_quest: false,
  activity_authorized: true,
  quote_supplied: true,
  item_present: true,
  treatment_succeeds: true,
  purchase_price: 100,
  sale_value: 50,
  repair_price: 10,
  event_sale_multiplier: 1,
  local_price_modifier: 0,
  coins: 500,
  inventory_count: 0,
  durability: 3,
  maximum_durability: 6,
  identified: false,
  diseased: true,
  poisoned: true,
  mental_attempt_used: false,
  mental_conditions: 2,
  treatment_roll: 5,
  day: 0,
  activity_completion_day: 0,
  last_treatment_day: -1,
};

describe('composed guild shopping handoff — PDF 144, 148', () => {
  it('uses access and authorization before a single ordinary purchase', () => {
    const access = run('guild_access', {
      ...base,
      profession: 'thief',
      guild: 'dark',
      operation: 'purchase',
    });
    const authorized = run('guild_purchase_authorization', {
      ...access.state,
      item_catalogue_resolved: true,
    });
    expect(authorized.state.coins).toBe(1000);
    expect(authorized.state.service_eligible).toBe(true);
    expect(authorized.events).toContainEqual({
      type: 'invoke',
      dependency: 'procedure.settlement_buy_sell_and_service',
    });
    const purchase = run('settlement_buy_sell_and_service', {
      ...service,
      service_eligible: authorized.state.service_eligible!,
      coins: authorized.state.coins!,
      base_purchase_price: 230,
      quoted_purchase_price: 230,
      purchase_price: 230,
      item_availability: 3,
      availability_roll: 3,
    });
    expect(purchase.state).toMatchObject({ coins: 770, inventory_count: 1 });
  });
  it('refuses an unverified catalogue offering without spending', () => {
    const r = run('guild_purchase_authorization', { ...base, item_catalogue_resolved: false });
    expect(r.state).toMatchObject({ coins: 1000, service_eligible: false });
    expect(r.events.some((event) => event.type === 'invoke')).toBe(false);
  });
});
