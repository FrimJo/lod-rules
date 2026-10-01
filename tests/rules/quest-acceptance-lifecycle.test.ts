import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.quest_acceptance', inputs }, corpus);
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
const offer: State = {
  phase: 'accept',
  quest_acceptance_owner_matches: true,
  quest_offer_scope_resolved: true,
  quest_choice_supplied: true,
  quest_choice_available: true,
  quest_acceptance_confirmed: true,
  quest_instance_fresh: true,
  side_quest_available: true,
  quest_site_required: true,
  quest_site_supplied: true,
  must_depart: false,
  settlement: 'irondale',
  selected_quest_id: 'quest.chamber_of_reverence.slaying_fiend',
  selected_instance_id: 'party-a-attempt-1',
  quest_slot: 'main',
  quest_family: 'random',
  selected_quest_site: 'actual supplied site',
  instance_acceptance_processed: false,
  quest_choice_request_processed: false,
  quest_site_request_processed: false,
  instance_completed: false,
  instance_abandoned: false,
  instance_reward_collected: false,
  coins: 700,
  sanity: 6,
  mental_attempt_used: true,
  reward_collected: true,
};
describe('Party offered quest and distinct accepted occurrence — PDF132/133', () => {
  it('composes actual settlement acceptance with immutable instance recording', () => {
    const accepted = runCase(
      {
        ...fixture,
        procedure_id: 'procedure.settlement_arrival',
        inputs: {
          ...arrival,
          phase: 'accept',
          settlement: 'irondale',
          arrival_visit: 0,
          available_quests: 1,
        },
      },
      corpus,
    );
    const recorded = run({
      ...offer,
      quest_acceptance_confirmed: accepted.state.quest_accepted === true,
    });
    expect([...accepted.trace, ...recorded.trace]).toEqual([
      'procedure.settlement_arrival',
      'procedure.quest_acceptance',
    ]);
    expect(recorded.state.instance_acceptance_processed).toBe(true);
    expect(run(recorded.state).state.instance_id).toBe('party-a-attempt-1');
  });
  it('persists actual accepted identity, origin, slot and site without resource/reward mutation', () => {
    const r = run(offer);
    expect(r.state).toMatchObject({
      instance_quest_id: offer.selected_quest_id,
      instance_id: 'party-a-attempt-1',
      instance_start_settlement: 'irondale',
      instance_slot: 'main',
      instance_site: 'actual supplied site',
      instance_acceptance_processed: true,
      coins: 700,
      sanity: 6,
      mental_attempt_used: true,
      reward_collected: true,
    });
    expect(r.trace).toEqual(['procedure.quest_acceptance']);
    expect(r.events).toEqual([]);
  });
  it('replay cannot replace provenance or reset completed/paid instance state', () => {
    const r = run(offer);
    const replay = run({
      ...r.state,
      settlement: 'silver_city',
      selected_instance_id: 'changed',
      selected_quest_id: 'changed',
      selected_quest_site: 'changed',
      instance_completed: true,
      instance_reward_collected: true,
    });
    expect(replay.state).toMatchObject({
      instance_id: 'party-a-attempt-1',
      instance_start_settlement: 'irondale',
      instance_site: 'actual supplied site',
      instance_completed: true,
      instance_reward_collected: true,
    });
  });
  it('another source-eligible actual occurrence of the same quest uses a separate fresh record', () => {
    const first = run(offer);
    const second = run({ ...offer, selected_instance_id: 'party-a-attempt-2' });
    expect(first.state.instance_id).toBe('party-a-attempt-1');
    expect(second.state.instance_id).toBe('party-a-attempt-2');
  });
  it('side acceptance is independent of an already accepted main choice', () => {
    const main = run(offer);
    const side = run({
      ...offer,
      quest_slot: 'side',
      selected_quest_id: 'quest.side.mushrooms',
      selected_instance_id: 'party-a-side-1',
      quest_accepted: true,
    });
    expect(side.state.instance_slot).toBe('side');
    expect(main.state.instance_slot).toBe('main');
  });
  it.each([
    { phase: 'complete' },
    { quest_acceptance_owner_matches: false },
    { quest_instance_fresh: false },
    { must_depart: true },
    { quest_choice_available: false },
    { quest_acceptance_confirmed: false },
    { quest_slot: 'side', side_quest_available: false },
  ] as State[])(
    'ineligible/unowned/unconfirmed context does not create an instance %s',
    (change) => {
      expect(run({ ...offer, ...change }).state.instance_acceptance_processed).toBe(false);
    },
  );
  it('Ancient Lands is offered only at The Outpost', () => {
    expect(
      run({ ...offer, quest_family: 'ancient_lands' }).state.instance_acceptance_processed,
    ).toBe(false);
    expect(
      run({ ...offer, quest_family: 'ancient_lands', settlement: 'outpost' }).state
        .instance_acceptance_processed,
    ).toBe(true);
  });
  it.each([{ quest_offer_scope_resolved: false }, { quest_choice_supplied: false }] as State[])(
    'missing actual choice/scope requests once %s',
    (change) => {
      const first = run({ ...offer, ...change });
      expect(first.state.instance_acceptance_processed).toBe(false);
      expect(first.events).toHaveLength(1);
      expect(run(first.state).events).toEqual([]);
      expect(
        run({ ...first.state, quest_offer_scope_resolved: true, quest_choice_supplied: true }).state
          .instance_acceptance_processed,
      ).toBe(true);
    },
  );
  it('missing site requests source resolution once then records actual supplied result', () => {
    const first = run({ ...offer, quest_site_supplied: false });
    expect(first.state.instance_acceptance_processed).toBe(false);
    expect(first.events).toEqual([
      {
        type: 'invoke',
        dependency: 'Actual chosen quest source-fixed location or required site roll/map result',
      },
    ]);
    expect(run(first.state).events).toEqual([]);
    expect(run({ ...first.state, quest_site_supplied: true }).state.instance_site).toBe(
      'actual supplied site',
    );
  });
  it('fixed source site is preserved without inventing a random placement', () => {
    expect(
      run({ ...offer, settlement: 'silver_city', selected_quest_site: 'silver_city' }).state
        .instance_site,
    ).toBe('silver_city');
  });
  it('no acceptance-site prescription requires no invented location input', () => {
    const input: State = { ...offer, quest_site_required: false, quest_site_supplied: false };
    delete input.selected_quest_site;
    expect(run(input).state).toMatchObject({
      instance_site: '',
      instance_acceptance_processed: true,
    });
  });
  it.each([
    { selected_quest_id: '' },
    { selected_instance_id: '' },
    { quest_slot: 'unknown' },
  ] as State[])('invalid supplied identity/slot has an unresolved disposition %s', (change) => {
    const r = run({ ...offer, ...change });
    expect(r.state.instance_acceptance_processed).toBe(false);
    expect(r.unresolved).toContain('issue.quest.acceptance_scope');
  });
  it('an empty required site cannot complete acceptance', () => {
    expect(run({ ...offer, selected_quest_site: '' }).state.instance_acceptance_processed).toBe(
      false,
    );
  });
});
