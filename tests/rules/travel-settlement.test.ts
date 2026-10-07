import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (id: string, inputs: State) =>
  runCase({ procedure_id: 'procedure.' + id, inputs } as TestCase, corpus);
const arrival: State = {
  phase: 'arrival',
  settlement: 'silver_city',
  quest_mode: 'random',
  visit_id: 0,
  arrival_visit: -1,
  quests_checked_visit: -1,
  rejected_quests: 0,
  available_quests: 0,
  arrival_roll: 8,
  event_threshold: 8,
  quest_availability_roll: 1,
  side_quest_roll: 2,
  luck_spent: 0,
  campaign_available: false,
  event_forces_departure: false,
  quest_accepted: false,
  side_quest_available: false,
  must_depart: false,
  business_allowed: true,
};
const activity: State = {
  quest_accepted: true,
  quest_departure_day: -1,
  phase: 'activity',
  activity: 'shopping',
  lodging_choice: 'inn',
  day: 0,
  visit_id: 0,
  activity_cost: 1,
  hero_day: 0,
  hero_occupied_until: -1,
  party_occupied_until: -1,
  last_activity_day: -1,
  lodging_day: -1,
  hero_recovery_day: -1,
  hero_visit_id: 0,
  party_visit_id: 0,
  hero_activity_points: 1,
  party_activity_days: 0,
  inn_nights: 0,
  scroll_activities: 0,
  enchant_activities: 0,
  coins: 500,
  inn_price_per_party: 25,
  activity_available: true,
  service_eligible: true,
  leaving_on_quest: false,
  travelling_elsewhere: false,
  estate_owned: false,
  inn_available: true,
  activity_requires_inn: false,
  business_allowed: true,
  must_leave_next_morning: false,
  luck_restored_this_visit: false,
  activity_reserved: false,
  lodging_kind: 'none',
  hit_points: 10,
  mana: 1,
  energy: 1,
  luck: 0,
  maximum_hit_points: 30,
  maximum_mana: 20,
  maximum_energy: 5,
  maximum_luck: 3,
  hp_roll: 7,
  stable_outcome_supplied: false,
  stable_mana_recovery: 0,
  stable_energy_recovery: 0,
  stable_luck_recovery: 0,
};
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
const arrive = (overrides: State = {}) => run('settlement_arrival', { ...arrival, ...overrides });
const act = (overrides: State = {}) =>
  run('settlement_activities_and_overnight', { ...activity, ...overrides });
const shop = (overrides: State = {}) =>
  run('settlement_buy_sell_and_service', { ...service, ...overrides });

const rejectedActivityCases: State[] = [
  { activity_available: false },
  { service_eligible: false },
  { leaving_on_quest: true },
  { business_allowed: false },
  { must_leave_next_morning: true },
];

const rejectedPurchaseCases: State[] = [
  { service_available: false },
  { service_eligible: false },
  { business_allowed: false },
  { leaving_on_quest: true },
  { activity_authorized: false },
  { quote_supplied: false },
  { coins: 99 },
  { activity_completion_day: 2 },
];

describe('arrival and quest accounting — PDF 132–133', () => {
  it.each([
    [7, false],
    [8, true],
    [12, true],
  ])('checks the event threshold at %i', (arrival_roll, expected) => {
    const r = arrive({ arrival_roll });
    expect(r.state.arrival_event_triggered).toBe(expected);
    expect(r.events.some((e) => e.type === 'invoke')).toBe(expected);
    expect(arrive(r.state).events.some((e) => e.type === 'invoke')).toBe(false);
  });
  it.each([
    ['silver_city', 1, 3],
    ['silver_city', 4, 2],
    ['silver_city', 5, 1],
    ['silver_city', 6, 0],
    ['irondale', 1, 2],
    ['irondale', 4, 1],
    ['irondale', 5, 0],
    ['irondale', 6, 0],
  ])('offers %s quests on %i', (settlement, quest_availability_roll, count) => {
    const r = arrive({ ...arrive({ settlement }).state, phase: 'quests', quest_availability_roll });
    expect(r.state.available_quests).toBe(count);
    expect(r.state.side_quest_available).toBe(count > 0);
    expect(arrive({ ...r.state, quest_availability_roll: 1 }).state.available_quests).toBe(count);
  });
  it('rejects Luck modification without generating quests or consuming a check', () => {
    const r = arrive({ ...arrive().state, phase: 'quests', luck_spent: 1 });
    expect(r.state).toMatchObject({ available_quests: 0, quests_checked_visit: -1 });
    expect(r.events).toContainEqual({ type: 'require', satisfied: false });
    expect(r.events.some((e) => e.type === 'invoke')).toBe(false);
  });
  it('counts rejected offers, forces departure, and preserves accepted offers', () => {
    const offers = arrive({ ...arrive({ settlement: 'irondale' }).state, phase: 'quests' });
    const once = arrive({ ...offers.state, phase: 'reject' });
    const twice = arrive({ ...once.state, phase: 'reject' });
    expect(twice.state).toMatchObject({
      rejected_quests: 2,
      available_quests: 0,
      must_depart: true,
    });
    expect(arrive({ ...twice.state, phase: 'accept' }).state.quest_accepted).toBe(false);
    const accepted = arrive({ ...offers.state, phase: 'accept' });
    expect(accepted.state.quest_accepted).toBe(true);
    expect(arrive({ ...accepted.state, phase: 'reject' }).state.rejected_quests).toBe(0);
  });
  it('blocks business for a supplied no-bed event and supports available campaigns', () => {
    const forced = arrive({ event_forces_departure: true });
    expect(forced.state).toMatchObject({ must_depart: true, business_allowed: false });
    const campaign = arrive({
      ...arrive().state,
      phase: 'quests',
      quest_mode: 'campaign',
      campaign_available: true,
    });
    expect(campaign.state.available_quests).toBe(1);
  });
});

describe('per-hero activities and shared lodging — PDF 133–134, 147, 160', () => {
  it('spends the hero budget once while allowing zero-point actions', () => {
    const one = act();
    expect(one.state).toMatchObject({
      hero_activity_points: 0,
      activity_reserved: true,
      party_occupied_until: 0,
    });
    expect(act(one.state).state.activity_reserved).toBe(false);
    const zero = act({ ...one.state, activity_cost: 0 });
    expect(zero.state.activity_reserved).toBe(true);
    expect(zero.state.hero_activity_points).toBe(0);
  });
  it('does not replenish budgets by repeatedly starting the same day', () => {
    const spent = act().state;
    expect(act({ ...spent, phase: 'start_day' }).state.hero_activity_points).toBe(0);
    expect(act({ ...spent, phase: 'start_day', day: 1 }).state.hero_activity_points).toBe(1);
  });
  it('enforces multi-day exclusivity even against zero-point actions', () => {
    const long = act({ activity_cost: 3 });
    expect(long.state).toMatchObject({ hero_occupied_until: 2, party_occupied_until: 2 });
    const next = act({ ...long.state, day: 1, phase: 'start_day' });
    expect(next.state.hero_activity_points).toBe(0);
    expect(
      act({ ...next.state, phase: 'activity', activity_cost: 0 }).state.activity_reserved,
    ).toBe(false);
    expect(act({ ...long.state, day: 3, phase: 'start_day' }).state.hero_activity_points).toBe(1);
  });
  it.each(rejectedActivityCases)(
    'rejects ineligible activity without spending points: %o',
    (overrides) => {
      const r = act(overrides);
      expect(r.state).toMatchObject({
        hero_activity_points: 1,
        activity_reserved: false,
        coins: 500,
      });
    },
  );
  it('enforces the inn stay restriction on zero-point activities', () => {
    expect(
      act({ activity_cost: 0, activity_requires_inn: true, inn_available: false }).state
        .activity_reserved,
    ).toBe(false);
    expect(act({ activity_cost: 0, activity_requires_inn: true }).state.activity_reserved).toBe(
      true,
    );
  });
  it('honours scroll and enchantment caps without blocking the last allowed action', () => {
    expect(act({ activity: 'create_scroll', scroll_activities: 1 }).state).toMatchObject({
      activity_reserved: true,
      scroll_activities: 2,
    });
    expect(act({ activity: 'create_scroll', scroll_activities: 2 }).state.activity_reserved).toBe(
      false,
    );
    expect(act({ activity: 'enchant' }).state.enchant_activities).toBe(1);
    expect(act({ activity: 'enchant', enchant_activities: 1 }).state.activity_reserved).toBe(false);
  });
  it('charges once per party night when multiple heroes share the stay', () => {
    const first = act({ phase: 'overnight' });
    const second = act(first.state);
    expect(first.state).toMatchObject({ coins: 475, inn_nights: 1, lodging_day: 0 });
    expect(second.state).toMatchObject({ coins: 475, inn_nights: 1 });
    expect(act({ ...second.state, day: 1 }).state).toMatchObject({ coins: 450, inn_nights: 2 });
  });
  it('recovers each hero once per night and Luck only once per visit', () => {
    const paid = act({ phase: 'overnight' });
    const recovered = act({ ...paid.state, phase: 'recover' });
    expect(recovered.state).toMatchObject({ hit_points: 17, mana: 20, energy: 5, luck: 3 });
    expect(act(recovered.state).state.hit_points).toBe(17);
    const secondNight = act({ ...recovered.state, phase: 'overnight', day: 1, luck: 1 });
    expect(act({ ...secondNight.state, phase: 'recover' }).state).toMatchObject({
      hit_points: 24,
      luck: 1,
    });
    const otherHero = act({
      ...paid.state,
      phase: 'recover',
      hit_points: 3,
      hero_recovery_day: -1,
    });
    expect(otherHero.state.hit_points).toBe(10);
    expect(otherHero.state.coins).toBe(475);
  });
  it('a hero at full HP still regains Mana, Energy and Luck at a paid inn (PDF147)', () => {
    const paid = act({ phase: 'overnight' });
    const full = act({ ...paid.state, phase: 'recover', hit_points: 30, hp_roll: 7 });
    expect(full.unresolved).toContain('issue.phase4.recovery_bounds');
    expect(full.state).toMatchObject({
      hit_points: 30,
      mana: 20,
      energy: 5,
      luck: 3,
      hero_recovery_day: 0,
    });
    const replay = act({ ...full.state, mana: 0, hit_points: 20 });
    expect(replay.state).toMatchObject({ mana: 0, hit_points: 20 });
  });
  it('uses estate lodging without a charge and rejects ownership-free use', () => {
    const home = act({ phase: 'overnight', lodging_choice: 'estate', estate_owned: true });
    expect(home.state).toMatchObject({ coins: 500, inn_nights: 0, lodging_kind: 'estate' });
    expect(act({ ...home.state, phase: 'recover' }).state.hit_points).toBe(17);
    expect(act({ phase: 'overnight', lodging_choice: 'estate' }).state.lodging_day).toBe(-1);
  });
  it('requires morning departure after an unaffordable inn and preserves half-stat ambiguity', () => {
    const stable = act({ phase: 'overnight', coins: 0 });
    expect(stable.state).toMatchObject({
      lodging_kind: 'stable',
      must_leave_next_morning: true,
      coins: 0,
    });
    const unresolved = act({ ...stable.state, phase: 'recover', hp_roll: 4 });
    expect(unresolved.unresolved).toContain('issue.phase4.recovery_bounds');
    expect(unresolved.state.hit_points).toBe(10);
    const supplied = act({
      ...stable.state,
      phase: 'recover',
      hp_roll: 4,
      stable_outcome_supplied: true,
      stable_mana_recovery: 9,
      stable_energy_recovery: 2,
      stable_luck_recovery: 1,
    });
    expect(supplied.state).toMatchObject({ hit_points: 14, mana: 10, energy: 3, luck: 1 });
    expect(act({ ...supplied.state, phase: 'activity', day: 1 }).state.activity_reserved).toBe(
      false,
    );
    expect(
      act({ ...supplied.state, phase: 'depart', day: 1, travelling_elsewhere: true }).state
        .departed,
    ).toBe(true);
  });
  it('keeps overlapping heroes separate while sharing the longest stay', () => {
    const wizard = act({ activity_cost: 3 });
    const warrior = act({
      party_occupied_until: wizard.state.party_occupied_until!,
      party_activity_days: wizard.state.party_activity_days!,
    });
    expect(warrior.state).toMatchObject({ hero_occupied_until: -1, party_occupied_until: 2 });
    const paid = act({ ...warrior.state, phase: 'overnight' });
    const dayOne = act({ ...paid.state, phase: 'start_day', day: 1 });
    const warriorDayOne = act({ ...dayOne.state, phase: 'activity' });
    expect(warriorDayOne.state.activity_reserved).toBe(true);
    expect(warriorDayOne.state.coins).toBe(475);
    const wizardDayOne = act({ ...wizard.state, phase: 'start_day', day: 1 });
    expect(
      act({ ...wizardDayOne.state, phase: 'activity', activity_cost: 0 }).state.activity_reserved,
    ).toBe(false);
  });
  it('requires an accepted quest and remembers the departure day even if a later request clears its flag', () => {
    expect(
      act({ phase: 'depart', day: 1, leaving_on_quest: true, quest_accepted: false }).state
        .departed,
    ).toBe(false);
    const departed = act({ phase: 'depart', day: 1, leaving_on_quest: true });
    const attempted = act({
      ...departed.state,
      phase: 'activity',
      hero_day: 1,
      leaving_on_quest: false,
    });
    expect(attempted.state.activity_reserved).toBe(false);
    expect(shop({ quest_departure_day: 1, day: 1 }).state.service_completed).toBe(false);
  });
  it('rejects departure while activities or their lodging obligations remain', () => {
    const long = act({ activity_cost: 3 });
    expect(
      act({ ...long.state, phase: 'depart', day: 1, leaving_on_quest: true }).state.departed,
    ).toBe(false);
    expect(
      act({ ...long.state, phase: 'depart', day: 3, leaving_on_quest: true }).state.departed,
    ).toBe(false);
    expect(
      act({ ...long.state, phase: 'depart', day: 3, lodging_day: 2, leaving_on_quest: true }).state
        .departed,
    ).toBe(true);
  });
});

describe('guarded purchases and distinct services — PDF 144, 146–147', () => {
  it('a successful purchase charges and grants exactly one item', () => {
    expect(shop().state).toMatchObject({
      coins: 400,
      inventory_count: 1,
      item_locked_until_return: false,
      service_completed: true,
    });
  });
  it.each(rejectedPurchaseCases)(
    'rejected purchase has no charge, grant or availability lock: %o',
    (overrides) => {
      const r = shop({ ...overrides, availability_roll: 6 });
      expect(r.state.coins).toBe(overrides.coins ?? 500);
      expect(r.state).toMatchObject({
        inventory_count: 0,
        item_locked_until_return: false,
        purchase_attempted: false,
        service_completed: false,
      });
    },
  );
  it('shares a failed item lock across heroes and releases it only on a later return', () => {
    const failed = shop({ availability_roll: 4 });
    expect(failed.state).toMatchObject({
      coins: 500,
      inventory_count: 0,
      item_locked_until_return: true,
      item_lock_visit: 0,
    });
    expect(shop({ ...failed.state, availability_roll: 1 }).state.purchase_attempted).toBe(false);
    const returnVisit = shop({ ...failed.state, visit_id: 1, availability_roll: 1 });
    expect(returnVisit.state).toMatchObject({
      coins: 400,
      inventory_count: 1,
      item_locked_until_return: false,
    });
  });
  it.each([
    [0, 1, false],
    [1, 1, true],
    [3, 3, true],
    [3, 4, false],
    [6, 6, true],
    [8, 6, true],
  ])('availability %i at %i succeeds: %s', (item_availability, availability_roll, success) => {
    expect(shop({ item_availability, availability_roll }).state.service_completed).toBe(success);
  });
  it('derives individual local/event prices and keeps overlapping modifiers explicit', () => {
    expect(
      shop({ base_purchase_price: 230, local_price_modifier: 10, coins: 253 }).state,
    ).toMatchObject({ purchase_price: 253, coins: 0, inventory_count: 1 });
    expect(shop({ local_price_modifier: 20 }).state).toMatchObject({
      purchase_price: 120,
      coins: 380,
    });
    expect(shop({ event_price_modifier: -20 }).state).toMatchObject({
      purchase_price: 80,
      coins: 420,
    });
    expect(shop({ event_price_delta: -20 }).state).toMatchObject({
      purchase_price: 80,
      coins: 420,
    });
    const unresolved = shop({ local_price_modifier: 20, event_price_modifier: 10 });
    expect(unresolved.unresolved).toContain('issue.settlement.price_modifier_combination');
    expect(unresolved.state).toMatchObject({
      coins: 500,
      inventory_count: 0,
      purchase_attempted: false,
    });
    expect(
      shop({
        local_price_modifier: 20,
        event_price_modifier: 10,
        combined_price_resolved: true,
        quoted_purchase_price: 132,
      }).state.coins,
    ).toBe(368);
  });
  it('sales ignore local price changes but apply an explicitly supplied event factor', () => {
    const r = shop({
      operation: 'sale',
      inventory_count: 1,
      local_price_modifier: 90,
      event_sale_multiplier: 0.8,
    });
    expect(r.state).toMatchObject({
      coins: 540,
      inventory_count: 0,
      item_locked_until_return: false,
    });
    expect(shop({ operation: 'sale', inventory_count: 0 }).state.coins).toBe(500);
  });
  it.each([
    ['identify_magic', 150],
    ['identify_potion', 25],
  ])('%s uses its own source price', (operation, price) => {
    const r = shop({ operation });
    expect(r.state).toMatchObject({
      identified: true,
      coins: 500 - Number(price),
      item_locked_until_return: false,
    });
    expect(shop(r.state).state.coins).toBe(r.state.coins);
  });
  it('repairs charge the Repair Column quote, without buying or identifying anything', () => {
    const r = shop({ operation: 'repair' });
    expect(r.state).toMatchObject({
      durability: 6,
      coins: 490,
      identified: false,
      inventory_count: 0,
    });
    expect(shop(r.state).state.coins).toBe(490);
  });
  it('illness treatment charges once per day and applies only its supplied successful outcome', () => {
    const cured = shop({ operation: 'cure_disease' });
    expect(cured.state).toMatchObject({
      coins: 400,
      diseased: false,
      poisoned: true,
      last_treatment_day: 0,
    });
    expect(shop(cured.state).state.coins).toBe(400);
    const poison = shop({ ...cured.state, operation: 'cure_poison' });
    expect(poison.state).toMatchObject({ coins: 400, poisoned: true });
    const nextDay = shop({ ...cured.state, operation: 'cure_poison', day: 1 });
    expect(nextDay.state).toMatchObject({ coins: 300, poisoned: false });
  });
  it('an unsuccessful illness treatment is not source-defined, so nothing is charged or cured (PDF144)', () => {
    const failed = shop({ operation: 'cure_disease', treatment_succeeds: false });
    expect(failed.unresolved).toContain('issue.settlement.illness_treatment_limits');
    expect(failed.state).toMatchObject({
      coins: 500,
      diseased: true,
      last_treatment_day: -1,
      service_completed: false,
    });
  });
  it.each([
    [5, 1],
    [6, 2],
  ])(
    'mental treatment result %i leaves %i disorders and consumes the attempt',
    (treatment_roll, remaining) => {
      const r = shop({
        operation: 'treat_mental',
        coins: 1500,
        treatment_roll,
        day: 4,
        activity_completion_day: 4,
      });
      expect(r.state).toMatchObject({
        coins: 500,
        mental_conditions: remaining,
        mental_attempt_used: true,
      });
      expect(shop({ ...r.state, day: 5, coins: 1500 }).state.coins).toBe(1500);
    },
  );
  it('collects a promised reward once at the starting settlement even when a no-bed event forbids business', () => {
    const r = shop({
      operation: 'collect_reward',
      business_allowed: false,
      activity_authorized: false,
    });
    expect(r.state).toMatchObject({ coins: 700, reward_collected: true, inventory_count: 0 });
    expect(shop(r.state).state.coins).toBe(700);
    expect(
      shop({ operation: 'collect_reward', at_quest_start_settlement: false }).state.coins,
    ).toBe(500);
  });
  it('rejects missing price and invalid availability inputs', () => {
    const { base_purchase_price: _price, ...missing } = service;
    expect(() => run('settlement_buy_sell_and_service', missing)).toThrow(
      'Missing input base_purchase_price',
    );
    expect(() => shop({ availability_roll: 7 })).toThrow('Input out of range');
  });
});

describe('composed travel → arrival → shop → overnight → departure', () => {
  it('accounts for each resource exactly once across supplied dependency results', () => {
    const event = run('travel_event_check', {
      day: 0,
      event_day: -1,
      movement_started: false,
      terrain: 'road',
      event_roll: 1,
    });
    const moved = run('travel_daily_movement', {
      ...event.state,
      movement_day: -1,
      movement_points: 0,
      hex_index: 0,
      route_legal: true,
      transport_mode: 'walking',
    });
    expect(moved.state).toMatchObject({ movement_points: 2, hex_index: 1 });
    const arrived = arrive({ arrival_roll: 1 });
    const offered = arrive({ ...arrived.state, phase: 'quests' });
    const accepted = arrive({ ...offered.state, phase: 'accept' });
    expect(accepted.state.quest_accepted).toBe(true);
    const reserved = act({ business_allowed: arrived.state.business_allowed! });
    const bought = shop({
      coins: reserved.state.coins!,
      activity_authorized: reserved.state.activity_reserved!,
    });
    const lodged = act({ ...reserved.state, coins: bought.state.coins!, phase: 'overnight' });
    const recovered = act({ ...lodged.state, phase: 'recover' });
    const departure = act({ ...recovered.state, phase: 'depart', day: 1, leaving_on_quest: true });
    expect(departure.state).toMatchObject({
      coins: 375,
      inn_nights: 1,
      hit_points: 17,
      mana: 20,
      energy: 5,
      luck: 3,
      departed: true,
    });
    expect(bought.state.inventory_count).toBe(1);
    expect(recovered.steps.filter((s) => s === 'paid_recovery')).toHaveLength(1);
    expect(act({ ...departure.state, phase: 'activity' }).state.activity_reserved).toBe(false);
  });
});
