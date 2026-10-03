import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State, id = 'procedure.quest_departure') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
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
const instance: State = {
  phase: 'depart',
  quest_departure_owner_matches: true,
  instance_owner: 'party-a',
  actual_party_id: 'party-a',
  instance_acceptance_processed: true,
  instance_completed: false,
  instance_abandoned: false,
  instance_departure_processed: false,
  instance_departure_request_processed: false,
  quest_departure_scope_resolved: true,
  departed: true,
  leaving_on_quest: true,
  instance_id: 'party-a-main-1',
  departure_instance_id: 'party-a-main-1',
  settlement: 'irondale',
  instance_start_settlement: 'irondale',
  instance_site: 'actual site',
  day: 1,
  quest_departure_day: 1,
  instance_reward_collected: false,
  coins: 700,
  sanity: 6,
  mental_attempt_used: true,
  hit_points: 23,
};
describe('Actual accepted occurrence departure — rendered PDF133', () => {
  it('composes existing actual activity departure with the accepted instance result', () => {
    const accounting = run(
      { ...activity, phase: 'depart', day: 1, leaving_on_quest: true },
      'procedure.settlement_activities_and_overnight',
    );
    const recorded = run({
      ...instance,
      departed: accounting.state.departed === true,
      quest_departure_day:
        typeof accounting.state.quest_departure_day === 'number'
          ? accounting.state.quest_departure_day
          : -1,
    });
    expect([...accounting.trace, ...recorded.trace]).toEqual([
      'procedure.settlement_activities_and_overnight',
      'procedure.quest_departure',
    ]);
    expect(recorded.state.instance_departure_processed).toBe(true);
    expect(recorded.state.mental_attempt_used).toBe(true);
  });
  it('incomplete occupied activity cannot become a recorded instance departure', () => {
    const accounting = run(
      {
        ...activity,
        phase: 'depart',
        day: 1,
        party_occupied_until: 2,
        leaving_on_quest: true,
      },
      'procedure.settlement_activities_and_overnight',
    );
    expect(
      run({
        ...instance,
        departed: accounting.state.departed === true,
        quest_departure_scope_resolved: false,
      }).state.instance_departure_processed,
    ).toBe(false);
  });
  it('records matching actual departure once without inventing site arrival or completion', () => {
    const first = run(instance);
    expect(first.state).toMatchObject({
      instance_departure_processed: true,
      instance_departure_day: 1,
      instance_departure_settlement: 'irondale',
      instance_start_settlement: 'irondale',
      instance_site: 'actual site',
      instance_completed: false,
      instance_reward_collected: false,
      coins: 700,
      sanity: 6,
      mental_attempt_used: true,
      hit_points: 23,
    });
    expect(first.trace).toEqual(['procedure.quest_departure']);
    expect(first.events).toEqual([]);
    const replay = run({
      ...first.state,
      day: 5,
      quest_departure_day: 5,
      settlement: 'silver_city',
    });
    expect(replay.state).toMatchObject({
      instance_departure_day: 1,
      instance_departure_settlement: 'irondale',
    });
  });
  it.each([
    { phase: 'accept' },
    { quest_departure_owner_matches: false },
    { instance_acceptance_processed: false },
    { instance_completed: true },
    { instance_abandoned: true },
    { leaving_on_quest: false },
    { departure_instance_id: 'another-instance' },
  ] as State[])('wrong/ineligible occurrence cannot depart %s', (change) => {
    expect(run({ ...instance, ...change }).state.instance_departure_processed).toBe(false);
  });
  it.each([
    { quest_departure_scope_resolved: false },
    { departed: false, quest_departure_day: -1 },
  ] as State[])('missing actual accounting/scope requests once %s', (change) => {
    const first = run({ ...instance, ...change });
    expect(first.state.instance_departure_processed).toBe(false);
    expect(first.events).toEqual([
      {
        type: 'invoke',
        dependency: 'procedure.settlement_activities_and_overnight',
      },
    ]);
    expect(run(first.state).events).toEqual([]);
    expect(
      run({
        ...first.state,
        quest_departure_scope_resolved: true,
        departed: true,
        quest_departure_day: 1,
      }).state.instance_departure_processed,
    ).toBe(true);
  });
  it('stale departure day has explicit unresolved disposition', () => {
    const r = run({ ...instance, quest_departure_day: 0 });
    expect(r.state.instance_departure_processed).toBe(false);
    expect(r.unresolved).toEqual(['issue.quest.departure_scope']);
  });
  it('main and accompanying side occurrences share actual departure without repeated accounting', () => {
    const main = run(instance);
    const side = run({
      ...instance,
      instance_id: 'party-a-side-1',
      departure_instance_id: 'party-a-side-1',
      instance_slot: 'side',
    });
    expect(main.state.instance_departure_day).toBe(side.state.instance_departure_day);
    expect(side.state.coins).toBe(700);
    expect(side.events).toEqual([]);
    expect(main.state.instance_id).toBe('party-a-main-1');
  });
  it('departure location does not silently replace the accepted origin/site', () => {
    expect(run({ ...instance, settlement: 'silver_city' }).state).toMatchObject({
      instance_departure_settlement: 'silver_city',
      instance_start_settlement: 'irondale',
      instance_site: 'actual site',
    });
  });
});

describe('Departure uses the accepted party identity', () => {
  it('does not accept another party solely from a true ownership assertion', () => {
    const accepted: State = {
      ...instance,
      phase: 'depart',
      quest_departure_owner_matches: true,
      instance_owner: 'party-a',
      actual_party_id: 'party-b',
      instance_acceptance_processed: true,
      instance_departure_processed: false,
      instance_id: 'quest-a',
      departure_instance_id: 'quest-a',
      quest_departure_scope_resolved: true,
      departed: true,
      leaving_on_quest: true,
      day: 1,
      quest_departure_day: 1,
    };
    const result = runCase(
      {
        ...fixture,
        procedure_id: 'procedure.quest_departure',
        inputs: accepted,
      },
      corpus,
    );
    expect(result.state.instance_departure_processed).toBe(false);
  });
});
