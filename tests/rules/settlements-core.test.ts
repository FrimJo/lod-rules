import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { evaluateCondition, runCase } from '../support/pilot-interpreter.ts';

// Settlements core, PDF 132–135 (printed 130–133): Taking on Quests, Rejecting a Quest,
// Available quests, Leaving on a Quest, Activities in a Settlement and Available Actions.
const corpus = readPilot();
const run = (id: string, inputs: State) =>
  runCase({ procedure_id: 'procedure.' + id, inputs } as TestCase, corpus);

const machine = corpus.stateMachines.find((x) => x.id === 'state_machine.quest_dungeon')!;
const transition = (state: string, event: string) => {
  const found = machine.states
    .find((x) => x.id === state)
    ?.transitions?.find((t) => t.event === event);
  if (!found?.when) throw new Error(`missing guarded transition ${state}/${event}`);
  return found;
};
const guard = (state: string, event: string, inputs: State) =>
  evaluateCondition(transition(state, event).when!, inputs);

const offer: State = {
  party_in_settlement: true,
  quest_source: 'random',
  campaign_available: false,
  random_quest_available: true,
  side_quest_available: false,
  quest_in_ancient_lands: false,
  settlement: 'irondale',
  settlement_is_village: true,
  must_move_on: false,
  rejected_quests: 0,
  departure_early_morning: true,
  other_settlement_activities_that_day: 0,
};

describe('state_machine.quest_dungeon offer, rejection and departure guards', () => {
  it('has the printed settlement states before the dungeon and keeps the dungeon states', () => {
    expect(machine.states.map((x) => x.id)).toEqual([
      'offered',
      'rejected',
      'accepted',
      'departed',
      'active',
      'abandoned',
      'accomplished',
      'exited',
    ]);
    expect(machine.states.find((x) => x.id === 'rejected')!.terminal).toBe(true);
    expect(transition('offered', 'party_accepts_offer').to).toBe('accepted');
    expect(transition('offered', 'party_rejects_offer').to).toBe('rejected');
    expect(transition('accepted', 'party_leaves_on_quest').to).toBe('departed');
  });

  it('quotes Taking on Quests, Rejecting a Quest, Available quests and Leaving on a Quest', () => {
    const headings = (state: string, event: string) =>
      transition(state, event).source!.map((s) => [s.pdf_page, s.heading]);
    expect(headings('offered', 'party_accepts_offer')).toEqual([
      [132, 'Taking on Quests'],
      [133, 'Available quests'],
    ]);
    expect(headings('offered', 'party_rejects_offer')).toEqual([[132, 'Rejecting a Quest']]);
    expect(headings('accepted', 'party_leaves_on_quest')).toEqual([[133, 'Leaving on a Quest']]);
    expect(transition('accepted', 'party_leaves_on_quest').source_text).toContain(
      'leaving on a quest is always done early in the morning. No other settlement activities are allowed on that day.',
    );
  });

  it.each([
    ['random quest offered by the roll', {}],
    ['available campaign', { quest_source: 'campaign', campaign_available: true }],
    ['side quest on d8 1-2', { quest_source: 'side', side_quest_available: true }],
    [
      'Ancient Lands quest at The Outpost',
      { quest_in_ancient_lands: true, settlement: 'outpost', settlement_is_village: false },
    ],
  ] as [string, State][])('accepts: %s', (_label, patch) => {
    expect(guard('offered', 'party_accepts_offer', { ...offer, ...patch })).toBe(true);
  });

  it.each([
    ['the party is not in a settlement', { party_in_settlement: false }],
    ['the party must move to another settlement', { must_move_on: true }],
    ['no random quest was offered', { random_quest_available: false }],
    ['the campaign is not available', { quest_source: 'campaign', campaign_available: false }],
    ['no side quest is available', { quest_source: 'side', side_quest_available: false }],
    ['an Ancient Lands quest outside The Outpost', { quest_in_ancient_lands: true }],
  ] as [string, State][])('does not accept when %s', (_label, patch) => {
    expect(guard('offered', 'party_accepts_offer', { ...offer, ...patch })).toBe(false);
  });

  it.each([
    ['village, first rejection', {}, true],
    ['village, second rejection', { rejected_quests: 1 }, true],
    ['village, third rejection', { rejected_quests: 2 }, false],
    [
      'Silver City, third rejection',
      { settlement: 'silver_city', settlement_is_village: false, rejected_quests: 2 },
      true,
    ],
    [
      'Silver City, fourth rejection',
      { settlement: 'silver_city', settlement_is_village: false, rejected_quests: 3 },
      false,
    ],
    ['a settlement not called a village', { settlement_is_village: false }, false],
    ['the party is not in a settlement', { party_in_settlement: false }, false],
  ] as [string, State, boolean][])('rejection guard: %s', (_label, patch, expected) => {
    expect(guard('offered', 'party_rejects_offer', { ...offer, ...patch })).toBe(expected);
  });

  it.each(['durburim', 'birnheim', 'outpost', 'freyfell', 'whiteport'])(
    'lets the party reject at %s through the transition that returns the open limit',
    (settlement) => {
      const rejections = machine.states
        .find((x) => x.id === 'offered')!
        .transitions!.filter((t) => t.event === 'party_rejects_offer');
      expect(rejections).toHaveLength(2);
      const open = rejections.find((t) => t.issues)!;
      expect(open.to).toBe('rejected');
      expect(open.issues).toEqual(['issue.settlement.quest_offer_scope']);
      const inputs = { ...offer, settlement, settlement_is_village: false, rejected_quests: 2 };
      expect(evaluateCondition(open.when!, inputs)).toBe(true);
      expect(guard('offered', 'party_rejects_offer', inputs)).toBe(false);
      expect(evaluateCondition(open.when!, { ...offer })).toBe(false);
      expect(
        evaluateCondition(open.when!, {
          ...offer,
          settlement: 'silver_city',
          settlement_is_village: false,
        }),
      ).toBe(false);
      expect(evaluateCondition(open.when!, { ...inputs, party_in_settlement: false })).toBe(false);
    },
  );

  it('cites the side-quest availability issue on the machine', () => {
    expect(machine.issues).toContain('issue.quest.side_quest_availability');
  });

  it.each([
    [{}, true],
    [{ departure_early_morning: false }, false],
    [{ other_settlement_activities_that_day: 1 }, false],
  ] as [State, boolean][])('departure guard %j', (patch, expected) => {
    expect(guard('accepted', 'party_leaves_on_quest', { ...offer, ...patch })).toBe(expected);
  });
});

const arrival: State = {
  phase: 'arrival',
  settlement: 'irondale',
  quest_mode: 'random',
  visit_id: 0,
  arrival_visit: -1,
  quests_checked_visit: -1,
  rejected_quests: 0,
  available_quests: 0,
  arrival_roll: 1,
  event_threshold: 11,
  quest_availability_roll: 1,
  side_quest_roll: 5,
  luck_spent: 0,
  campaign_available: false,
  event_forces_departure: false,
  quest_accepted: false,
  side_quest_available: false,
  must_depart: false,
  business_allowed: true,
};
const offered = (settlement: string) => {
  const arrived = run('settlement_arrival', { ...arrival, settlement }).state;
  return run('settlement_arrival', { ...arrived, phase: 'quests' }).state;
};

describe('procedure.settlement_arrival rejection limits (Rejecting a Quest, PDF 132)', () => {
  it.each(['durburim', 'birnheim', 'outpost', 'freyfell', 'whiteport'])(
    'returns the open issue for %s instead of applying the village limit',
    (settlement) => {
      const first = run('settlement_arrival', { ...offered(settlement), phase: 'reject' });
      expect(first.unresolved).toEqual(['issue.settlement.quest_offer_scope']);
      expect(first.state.rejected_quests).toBe(1);
      expect(first.state.must_depart).toBe(false);
      const second = run('settlement_arrival', { ...first.state, phase: 'reject' });
      expect(second.state).toMatchObject({ rejected_quests: 2, available_quests: 0 });
      // No quest is left, so the party must move on whatever the limit is.
      expect(second.state.must_depart).toBe(true);
    },
  );
  it('keeps the village limit of two in Irondale', () => {
    const first = run('settlement_arrival', { ...offered('irondale'), phase: 'reject' });
    expect(first.unresolved).toEqual([]);
    expect(first.state).toMatchObject({ rejected_quests: 1, rejection_limit: 2 });
  });
  it('returns the open issue instead of forcing departure when the roll offers no quest', () => {
    const arrived = run('settlement_arrival', arrival).state;
    const none = run('settlement_arrival', {
      ...arrived,
      phase: 'quests',
      quest_availability_roll: 6,
    });
    expect(none.unresolved).toEqual(['issue.settlement.quest_availability_repeat']);
    expect(none.state).toMatchObject({ available_quests: 0, must_depart: false });
  });
  it('returns the open issue on a second quest roll in the same visit without rerolling', () => {
    const first = offered('irondale');
    expect(first.available_quests).toBe(2);
    const again = run('settlement_arrival', { ...first, quest_availability_roll: 6 });
    expect(again.unresolved).toEqual(['issue.settlement.quest_availability_repeat']);
    expect(again.state.available_quests).toBe(2);
  });
  it('forces departure once every offered quest is rejected, without the issue', () => {
    const arrived = run('settlement_arrival', arrival).state;
    const one = run('settlement_arrival', {
      ...arrived,
      phase: 'quests',
      quest_availability_roll: 3,
    }).state;
    const rejected = run('settlement_arrival', { ...one, phase: 'reject' });
    expect(rejected.unresolved).toEqual([]);
    expect(rejected.state).toMatchObject({
      rejected_quests: 1,
      available_quests: 0,
      must_depart: true,
    });
  });
});

const activity: State = {
  quest_accepted: true,
  quest_departure_day: -1,
  phase: 'activity',
  activity: 'create_scroll',
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
const act = (patch: State) => run('settlement_activities_and_overnight', { ...activity, ...patch });

describe('Create a Scroll and Enchant Objects limits (PDF 134 with Enchantments Take Time, PDF 71)', () => {
  it('allows two scroll attempts or one object, not both, between quests', () => {
    expect(act({ scroll_activities: 1 }).state).toMatchObject({
      activity_reserved: true,
      scroll_activities: 2,
    });
    expect(act({ enchant_activities: 1 }).state.activity_reserved).toBe(false);
    expect(act({ activity: 'enchant', scroll_activities: 1 }).state.activity_reserved).toBe(false);
    expect(act({ activity: 'enchant' }).state).toMatchObject({
      activity_reserved: true,
      enchant_activities: 1,
    });
  });
  it('keeps the counters on a new settlement visit and resets them when leaving on a quest', () => {
    expect(
      act({ phase: 'new_visit', visit_id: 1, scroll_activities: 2, enchant_activities: 0 }).state
        .scroll_activities,
    ).toBe(2);
    const departed = act({
      phase: 'depart',
      day: 1,
      leaving_on_quest: true,
      scroll_activities: 2,
      enchant_activities: 0,
    });
    expect(departed.state).toMatchObject({
      departed: true,
      quest_departure_day: 1,
      scroll_activities: 0,
      enchant_activities: 0,
    });
    const elsewhere = act({
      phase: 'depart',
      day: 1,
      travelling_elsewhere: true,
      scroll_activities: 2,
    });
    expect(elsewhere.state).toMatchObject({ departed: true, scroll_activities: 2 });
  });
});
