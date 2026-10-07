import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const run = (id: string, inputs: State) =>
  runCase({ procedure_id: id, inputs } as TestCase, corpus);
const issue = 'issue.quest.campaign_progression_boundaries';

describe('The Dead Rising campaign order — rendered PDF224–236', () => {
  const dr = (state: State, call: State) =>
    run('procedure.dead_rising_campaign', { ...state, ...call });
  const fresh: State = {
    campaign_id: 'dr-1',
    campaign_owner_id: '',
    stage: '',
    next_quest_id: '',
    quest_in_progress: false,
    completed_quest_id: '',
    quest_outcome: '',
    current_settlement: 'rochdale',
    campaign_choice: '',
    aftermath_processed: false,
    settlement_return_allowed: true,
  };
  const play = (state: State, quest: string, settlement = 'rochdale', outcome = 'completed') => {
    const started = dr(state, { phase: 'start_quest', current_settlement: settlement }).state;
    return dr(started, { phase: 'complete', completed_quest_id: quest, quest_outcome: outcome });
  };
  const toChoice = () => {
    let s = dr(fresh, { phase: 'start' }).state;
    s = play(s, 'quest.dead_rising.spring_cleaning').state;
    s = play(s, 'quest.dead_rising.the_dead_rising', 'silver_city').state;
    s = play(s, 'quest.dead_rising.highwaymen').state;
    s = play(s, 'quest.dead_rising.burning_village', 'rochdale', 'fled').state;
    return play(s, 'quest.dead_rising.apprentice').state;
  };
  it('runs the quests in printed order; the Apostle path plays 6A and then 6B', () => {
    const choice = toChoice();
    expect(choice).toMatchObject({ stage: 'choice', settlement_return_allowed: false });
    const apostle = dr(choice, { phase: 'choose', campaign_choice: 'apostle' }).state;
    expect(apostle).toMatchObject({
      next_quest_id: 'quest.dead_rising.sacrifice',
      chose_to_stop_sacrifice: true,
    });
    const after6a = play(apostle, 'quest.dead_rising.sacrifice').state;
    expect(after6a).toMatchObject({
      next_quest_id: 'quest.dead_rising.master',
      next_destination: 'White 39',
      chose_to_stop_sacrifice: true,
    });
    const back = play(after6a, 'quest.dead_rising.master').state;
    expect(back).toMatchObject({ stage: 'return', next_destination: 'Silver City' });
    const aftermath = dr(back, { phase: 'return', current_settlement: 'silver_city' });
    expect(aftermath.state).toMatchObject({
      stage: 'complete',
      reward_per_hero: 1000,
      league_member: true,
      aftermath_processed: true,
    });
    expect(aftermath.trace).toContain('core.quest.dead_rising_campaign.aftermath');
    const replay = dr(aftermath.state, { phase: 'return', current_settlement: 'silver_city' });
    expect(replay.trace).not.toContain('core.quest.dead_rising_campaign.aftermath');
  });
  it('the Master choice goes straight to 6B without the harder encounters', () => {
    const master = dr(toChoice(), { phase: 'choose', campaign_choice: 'master' }).state;
    expect(master).toMatchObject({
      stage: 'q6b',
      next_quest_id: 'quest.dead_rising.master',
      chose_to_stop_sacrifice: false,
    });
  });
  it('the second quest must be started in Silver City', () => {
    const s = play(dr(fresh, { phase: 'start' }).state, 'quest.dead_rising.spring_cleaning').state;
    expect(s).toMatchObject({ stage: 'q2', next_destination: 'Silver City' });
    const elsewhere = dr(s, { phase: 'start_quest', current_settlement: 'rochdale' });
    expect(elsewhere.state.quest_in_progress).toBe(false);
    expect(elsewhere.events).toContainEqual({ type: 'require', satisfied: false });
    expect(dr(s, { phase: 'start_quest', current_settlement: 'silver_city' }).state).toMatchObject({
      quest_in_progress: true,
    });
  });
  it('a failed quest, the wrong quest or flight outside Quest 4 does not advance the campaign', () => {
    const started = dr(dr(fresh, { phase: 'start' }).state, { phase: 'start_quest' }).state;
    const failed = dr(started, {
      phase: 'complete',
      completed_quest_id: 'quest.dead_rising.spring_cleaning',
      quest_outcome: 'failed',
    });
    expect(failed.unresolved).toEqual([issue]);
    expect(failed.state.stage).toBe('q1');
    for (const call of [
      { completed_quest_id: 'quest.dead_rising.highwaymen', quest_outcome: 'completed' },
      { completed_quest_id: 'quest.dead_rising.spring_cleaning', quest_outcome: 'fled' },
    ])
      expect(dr(started, { phase: 'complete', ...call }).state.stage).toBe('q1');
  });
  it('another campaign instance cannot advance this one', () => {
    const s = dr(dr(fresh, { phase: 'start' }).state, { phase: 'start_quest' }).state;
    const other = dr(s, {
      campaign_id: 'dr-2',
      phase: 'complete',
      completed_quest_id: 'quest.dead_rising.spring_cleaning',
      quest_outcome: 'completed',
    });
    expect(other.state).toMatchObject({ owner_matches: false, stage: 'q1' });
  });
});

describe('Lair of the Spider Queen campaign order — rendered PDF237–242', () => {
  const sq = (state: State, call: State) =>
    run('procedure.spider_queen_campaign', { ...state, ...call });
  const fresh: State = {
    campaign_id: 'sq-1',
    campaign_owner_id: '',
    stage: '',
    next_quest_id: '',
    quest_in_progress: false,
    completed_quest_id: '',
    quest_outcome: 'completed',
    location: 'whiteport',
    reward_processed: false,
    sarcophagus_findings_done: true,
  };
  const complete = (state: State, quest: string) =>
    sq(state, { phase: 'complete', completed_quest_id: quest });
  it('starts in Whiteport, is accepted at White 40 and runs the three levels in a row', () => {
    const started = sq(fresh, { phase: 'start' }).state;
    expect(sq(started, { phase: 'accept', location: 'whiteport' }).state.stage).toBe(
      'travel_to_site',
    );
    const l1 = sq(started, { phase: 'accept', location: 'white_40' }).state;
    expect(l1).toMatchObject({ stage: 'l1', quest_in_progress: true });
    const l2 = complete(l1, 'quest.spider_queen.entrance').state;
    expect(l2).toMatchObject({ stage: 'l2', quest_in_progress: true });
    const l3 = complete(l2, 'quest.spider_queen.basement').state;
    expect(l3).toMatchObject({ stage: 'l3', next_quest_id: 'quest.spider_queen.tomb' });
    const out = complete(l3, 'quest.spider_queen.tomb');
    expect(out.state).toMatchObject({
      stage: 'return',
      dungeon_exit_without_retracing: true,
      overland_travel_required: true,
    });
    expect(sq(out.state, { phase: 'return', location: 'silver_city' }).state.reward_processed).toBe(
      false,
    );
    const paid = sq(out.state, { phase: 'return', location: 'whiteport' });
    expect(paid.state).toMatchObject({ reward_per_hero: 1200, stage: 'complete' });
    expect(paid.trace).toContain('core.quest.spider_queen_tomb.reward');
    expect(sq(paid.state, { phase: 'return' }).trace).not.toContain(
      'core.quest.spider_queen_tomb.reward',
    );
  });
  it('the campaign does not start outside Whiteport, and a failed level stays open', () => {
    expect(sq({ ...fresh, location: 'silver_city' }, { phase: 'start' }).state.stage).toBe('');
    const l1 = sq(sq(fresh, { phase: 'start' }).state, {
      phase: 'accept',
      location: 'white_40',
    }).state;
    const failed = sq(l1, {
      phase: 'complete',
      completed_quest_id: 'quest.spider_queen.entrance',
      quest_outcome: 'abandoned',
    });
    expect(failed.unresolved).toEqual([issue]);
    expect(failed.state.stage).toBe('l1');
  });
});

describe('Side Quest offer, selection and attachment — rendered PDF273 / 133', () => {
  const side = (state: State, call: State = {}) =>
    run('procedure.side_quest_selection', { ...state, ...call });
  const offer: State = {
    offer_id: 'visit-4/side',
    offer_owner_id: '',
    offer_basis: 'arrival_d8',
    side_quest_available: true,
    selection_method: 'roll',
    side_quest_selection_roll: 3,
    side_quests_worked: 0,
    selected_side_quest: '',
    side_quest_selected: false,
    main_quest_instance_id: 'quest.great_crypt.tomb_raiders#2',
    acceptance_handoff_processed: false,
  };
  const handoffs = (r: ReturnType<typeof side>) => r.events.filter((e) => e.type === 'invoke');
  it('a rolled side quest is kept, attached to the main quest at no day cost and handed off once', () => {
    const first = side(offer);
    expect(first.state).toMatchObject({
      selected_side_quest: 'The Mapmaker',
      attached_main_quest_instance_id: 'quest.great_crypt.tomb_raiders#2',
      day_count_cost: 0,
    });
    expect(handoffs(first)).toEqual([{ type: 'invoke', dependency: 'procedure.quest_acceptance' }]);
    const replay = side(first.state, { side_quest_selection_roll: 6 });
    expect(replay.state.selected_side_quest).toBe('The Mapmaker');
    expect(handoffs(replay)).toEqual([]);
  });
  it('working through them one by one takes the next side quest in printed order', () => {
    const next = side(offer, { selection_method: 'in_order', side_quests_worked: 3 });
    expect(next.state).toMatchObject({ selected_side_quest: 'Go Fetch!', side_quests_worked: 4 });
  });
  it('a side quest needs the arrival d8 result and another quest to join', () => {
    const stay = side(offer, { offer_basis: 'stay_choice' });
    expect(stay.unresolved).toEqual(['issue.quest.side_quest_availability']);
    expect(stay.state.side_quest_selected).toBe(false);
    const alone = side(offer, { main_quest_instance_id: '' });
    expect(alone.state.selected_side_quest).toBe('The Mapmaker');
    expect(handoffs(alone)).toEqual([]);
    expect(alone.state.acceptance_handoff_processed).toBe(false);
  });
});

describe('Ancient Lands expedition entry — rendered PDF263 / 138', () => {
  const go = (state: State, call: State = {}) =>
    run('procedure.ancient_lands_expedition', { ...state, ...call });
  const party: State = {
    expedition_id: 'quest.ancient_lands.khaba#1',
    expedition_owner_id: '',
    phase: 'depart',
    ancient_quest_id: 'quest.ancient_lands.khaba',
    current_settlement: 'outpost',
    league_member: true,
    hero_count: 4,
    coins: 900,
    toll_paid: false,
    ancient_tiles_available: false,
    objective_variant_fixed: false,
  };
  it('League members leaving The Outpost pay 100 c per hero once and travel under Ancient Lands costs', () => {
    const left = go(party);
    expect(left.state).toMatchObject({
      coins: 500,
      toll_paid: true,
      movement_points_per_hex: 2,
      rations_per_day_printed: 2,
    });
    expect(left.trace).toContain('core.quest.ancient_lands.outpost_eligibility');
    expect(go(left.state).state.coins).toBe(500);
    const objective = go(left.state, { phase: 'objective' }).state;
    expect(objective).toMatchObject({ objective_room_variant: 'Standard tiles' });
    expect(
      go(objective, { phase: 'objective', ancient_tiles_available: true }).state,
    ).toMatchObject({ objective_room_variant: 'Standard tiles' });
  });
  it.each<State>([{ league_member: false }, { current_settlement: 'silver_city' }, { coins: 399 }])(
    'no toll is taken and no travel starts for %j',
    (override) => {
      const blocked = go(party, override);
      expect(blocked.state.toll_paid).toBe(false);
      expect(blocked.state.coins).toBe(override.coins ?? 900);
      expect(blocked.events.filter((e) => e.type === 'invoke')).toEqual([]);
    },
  );
  it('which Ancient Lands quest is offered is not printed', () => {
    const open = go(party, { ancient_quest_id: '' });
    expect(open.unresolved).toEqual(['issue.quest.ancient_lands_quest_selection']);
    expect(open.state.toll_paid).toBe(false);
  });
});
