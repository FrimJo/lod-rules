import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (id: string, inputs: State) =>
  runCase({ procedure_id: `procedure.${id}`, inputs } as TestCase, corpus);
const learning: State = {
  settlement: 'silver_city',
  profession: 'wizard',
  business_allowed: true,
  leaving_on_quest: false,
  activity_authorized: true,
  reserved_activity_points: 3,
  completed_activity_days: 3,
  coins: 500,
  hero_level: 3,
  chosen_level: 2,
  chosen_id: 'spell.magic_bolt',
  catalogue_selection_valid: true,
  known: false,
  learned_since_boundary: false,
  grimoire_for_this_spell: false,
};
const training: State = {
  settlement: 'silver_city',
  profession: 'warrior',
  business_allowed: true,
  leaving_on_quest: false,
  activity_authorized: true,
  reserved_activity_points: 1,
  completed_activity_days: 1,
  coins: 500,
  guild: 'fighters',
  skill: 'cs',
  natural_skill: 74,
  trained_since_dungeon: false,
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

describe('learning spell/prayer fees and completed duration — PDF 66, 82, 146, 153, 158', () => {
  it('learns one spell for the exact price after three completed days', () => {
    const r = run('learn_spell', learning);
    expect(r.state).toMatchObject({
      coins: 200,
      known: true,
      learned: true,
      learned_since_boundary: true,
    });
    expect(r.steps).toEqual(['quote', 'check_learning', 'learn']);
    expect(r.events).toContainEqual({
      type: 'invoke',
      dependency: 'procedure.settlement_activities_and_overnight',
    });
    const repeated = run('learn_spell', r.state);
    expect(repeated.state).toMatchObject({ coins: 200, learned: false });
    expect(
      run('learn_spell', { ...r.state, known: false, chosen_id: 'another_spell' }).state.learned,
    ).toBe(false);
  });
  it.each([0, 1, 2])(
    'does not grant or charge a spell after only %i days',
    (completed_activity_days) => {
      const r = run('learn_spell', { ...learning, completed_activity_days });
      expect(r.state).toMatchObject({ coins: 500, known: false, learned_since_boundary: false });
      expect(r.steps).not.toContain('learn');
    },
  );
  it('a matching Grimoire waives the fee but not duration or level restrictions', () => {
    const free = { ...learning, coins: 0, grimoire_for_this_spell: true };
    expect(run('learn_spell', free).state).toMatchObject({
      coins: 0,
      learning_cost: 0,
      learned: true,
    });
    expect(run('learn_spell', { ...free, completed_activity_days: 2 }).state.learned).toBe(false);
    expect(run('learn_spell', { ...free, chosen_level: 4 }).state.learned).toBe(false);
  });
  it.each<State>([
    { profession: 'warrior' },
    { settlement: 'oakheim' },
    { business_allowed: false },
    { leaving_on_quest: true },
    { activity_authorized: false },
    { reserved_activity_points: 1 },
    { catalogue_selection_valid: false },
    { chosen_id: '' },
    { known: true },
    { coins: 299 },
    { chosen_level: 4 },
  ])('rejects ineligible learning %j', (override) => {
    const r = run('learn_spell', { ...learning, ...override });
    expect(r.state.coins).toBe(override.coins ?? 500);
    expect(r.state.learned).toBe(false);
    expect(r.events).toContainEqual({ type: 'require', satisfied: false });
  });
  it('a priest needs one complete day and retains the schedule conflict', () => {
    const prayer = {
      ...learning,
      profession: 'warrior_priest',
      reserved_activity_points: 1,
      completed_activity_days: 1,
      chosen_id: 'prayer.bringer_of_light',
      chosen_level: 1,
    };
    expect(run('learn_prayer', prayer).state).toMatchObject({
      coins: 300,
      known: true,
      learned: true,
    });
    expect(run('learn_prayer', { ...prayer, completed_activity_days: 0 }).state.known).toBe(false);
    expect(
      run('learn_prayer', { ...prayer, grimoire_for_this_spell: true }).state.learning_cost,
    ).toBe(200);
    expect(corpus.procedures.find((p) => p.id === 'procedure.learn_prayer')?.issues).toContain(
      'issue.settlement.prayer_schedule_duration',
    );
  });
  it('a completed later boundary permits another selection; a new visit alone does not', () => {
    const first = run('learn_spell', learning);
    const nextVisit = { ...first.state, known: false, coins: 500, visit_id: 9 };
    expect(run('learn_spell', nextVisit).state.learned).toBe(false);
    expect(run('learn_spell', { ...nextVisit, learned_since_boundary: false }).state.learned).toBe(
      true,
    );
  });
});

describe('guild skill sessions — PDF 134, 148, 151, 153, 154, 156, 158', () => {
  it.each([
    ['dark', 'thief', ['cs', 'rs', 'pick_locks', 'perception']],
    ['dark', 'rogue', ['cs', 'rs', 'pick_locks', 'perception']],
    ['fighters', 'warrior', ['cs', 'heal', 'dodge']],
    ['fighters', 'barbarian', ['cs', 'heal', 'dodge']],
    ['wizards', 'wizard', ['arcane_arts', 'perception', 'heal']],
    ['alchemists', 'alchemist', ['alchemy', 'heal', 'perception']],
    ['rangers', 'ranger', ['cs', 'rs', 'dodge', 'heal', 'foraging']],
    ['inner_sanctum', 'warrior_priest', ['cs', 'dodge', 'battle_prayers']],
  ])('accepts only %s / %s listed skills', (guild, profession, skills) => {
    for (const skill of skills) {
      const r = run('guild_skill_training', { ...training, guild, profession, skill });
      expect(r.state).toMatchObject({ coins: 200, natural_skill: 77, trained_since_dungeon: true });
      expect(run('guild_skill_training', r.state).state.coins).toBe(200);
    }
    expect(
      run('guild_skill_training', { ...training, guild, profession, skill: 'invented' }).state
        .trained,
    ).toBe(false);
  });
  it.each<State>([
    { profession: 'wizard' },
    { trained_since_dungeon: true },
    { coins: 299 },
    { completed_activity_days: 0 },
    { reserved_activity_points: 0 },
    { natural_skill: 78 },
    { natural_skill: 79 },
    { natural_skill: 80 },
    { activity_authorized: false },
  ])('rejects training without a legal full +3 session %j', (override) => {
    const r = run('guild_skill_training', { ...training, ...override });
    expect(r.state.coins).toBe(override.coins ?? 500);
    expect(r.state.natural_skill).toBe(override.natural_skill ?? 74);
    expect(r.state.trained).toBe(false);
  });
  it('reaches exactly 80 without clamping or buying partial training', () => {
    expect(
      run('guild_skill_training', { ...training, natural_skill: 77 }).state.natural_skill,
    ).toBe(80);
  });
});

describe('composed settlement duration and learning accounting', () => {
  it('reserves three days once, completes them, and charges fee plus party lodging exactly once', () => {
    let visit = run('settlement_activities_and_overnight', {
      ...activity,
      activity: 'learn_spell',
      activity_cost: 3,
      coins: 1000,
    });
    expect(visit.state).toMatchObject({
      activity_reserved: true,
      hero_activity_points: 0,
      hero_occupied_until: 2,
      party_occupied_until: 2,
      coins: 1000,
    });
    const pending = run('learn_spell', {
      ...learning,
      coins: 1000,
      activity_authorized: visit.state.activity_reserved!,
      completed_activity_days: 0,
    });
    expect(pending.state.known).toBe(false);
    for (const day of [0, 1, 2]) {
      visit = run('settlement_activities_and_overnight', {
        ...visit.state,
        phase: 'overnight',
        day,
      });
    }
    expect(visit.state.coins).toBe(925);
    const learned = run('learn_spell', {
      ...learning,
      coins: visit.state.coins!,
      completed_activity_days: 3,
      hero_activity_points: visit.state.hero_activity_points!,
      inn_nights: visit.state.inn_nights!,
    });
    expect(learned.state).toMatchObject({
      coins: 625,
      known: true,
      hero_activity_points: 0,
      inn_nights: 3,
    });
    const repeated = run('learn_spell', learned.state);
    expect(repeated.state).toMatchObject({ coins: 625, hero_activity_points: 0, inn_nights: 3 });
  });
});
