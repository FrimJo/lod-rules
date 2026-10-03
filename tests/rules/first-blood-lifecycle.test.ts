import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const procedure = corpus.procedures.find((x) => x.id === 'procedure.first_blood')!;
const fixture = corpus.testCases.find((x) => x.procedure_id === 'procedure.rest')!;
const defaults: State = Object.fromEntries(
  Object.entries(procedure.fields).map(([n, f]) => [
    n,
    f.type === 'boolean' ? false : f.type === 'number' ? (f.minimum ?? 0) : '',
  ]),
);
const base: State = {
  ...defaults,
  phase: 'setup',
  instance_quest_id: 'quest.first_blood',
  first_blood_owner_matches: true,
  placement_result_owner_matches: true,
  actual_placement_supplied: true,
  approach_edge_randomised: true,
  actual_actor_index: 1,
  actual_approach_edge: 'north',
  distance_roll: 1,
  actual_monster_cards_confirmed: true,
  actual_first_turn: true,
  first_turn: true,
  coins: 81,
  other_initiative_bonus: 3,
};
const run = (inputs: State) => runCase({ ...fixture, procedure_id: procedure.id, inputs }, corpus);
const setup = () => run(base).state;
const ready = () => {
  let state = setup();
  for (let i = 1; i <= 4; i++)
    state = run({ ...state, phase: 'placement', actual_actor_index: i, distance_roll: i }).state;
  return state;
};
describe('First Blood actual encounter/actor/first-turn/arrival checkpoints — PDF223', () => {
  it('source setup and darkness/no-Scenario constraints persist once', () => {
    const first = run(base);
    expect(first.state).toMatchObject({
      bandit_leaders: 1,
      melee_bandits: 2,
      ranged_bandits: 1,
      outdoor_tiles: 4,
      leader_weapon: 'longsword',
      leader_shield: true,
      leader_armour: 1,
      sight_limit: 10,
      shooting_limit: 10,
      scenario_die_used: false,
      coins: 81,
    });
    expect(first.events).toHaveLength(2);
    expect(run({ ...first.state, hero_placement: 'moved', melee_bandits: 1 }).state).toMatchObject({
      hero_placement: 'moved',
      melee_bandits: 1,
    });
    expect(run(first.state).events).toEqual([]);
    expect(first.state.bandit_hp).toBeUndefined();
  });
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'owned actual d10%i placement persists once',
    (distance_roll) => {
      const first = run({ ...setup(), phase: 'placement', distance_roll });
      expect(first.state).toMatchObject({
        bandit_1_placed: true,
        bandit_1_edge: 'north',
        bandit_1_distance: distance_roll,
      });
      expect(
        run({ ...first.state, distance_roll: 10, actual_approach_edge: 'east' }).state,
      ).toMatchObject({ bandit_1_edge: 'north', bandit_1_distance: distance_roll });
      expect(first.trace).toEqual([
        'procedure.first_blood',
        'core.quest.first_blood.enemy_placement',
      ]);
    },
  );
  it.each([
    { first_blood_owner_matches: false },
    { instance_quest_id: 'other' },
    { first_blood_setup_processed: false },
    { placement_result_owner_matches: false },
    { actual_placement_supplied: false },
    { approach_edge_randomised: false },
  ] as State[])('wrong or incomplete placement%j cannot consume actor', (patch) => {
    expect(run({ ...setup(), phase: 'placement', ...patch }).state.bandit_1_placed).toBe(false);
  });
  it('each of four adversaries owns separate edge/distance rather than one shared placement', () => {
    const first = ready();
    for (let i = 1; i <= 4; i++) {
      expect(first['bandit_' + i + '_placed']).toBe(true);
      expect(first['bandit_' + i + '_distance']).toBe(i);
    }
  });
  it.each([
    { bandit_4_placed: false },
    { actual_monster_cards_confirmed: false },
    { actual_first_turn: false },
    { first_turn: false },
  ] as State[])('incomplete or nonfirst turn%j cannot request bonus', (patch) => {
    expect(run({ ...ready(), phase: 'initiative', ...patch }).events).toEqual([]);
  });
  it('first actual turn requests+2 initiative once and preserves unrelated tokens; later reports zero', () => {
    const first = run({ ...ready(), phase: 'initiative' });
    expect(first.state).toMatchObject({
      bandit_initiative_bonus: 2,
      other_initiative_bonus: 3,
      first_blood_initiative_processed: true,
      coins: 81,
    });
    expect(first.events).toEqual([{ type: 'invoke', dependency: 'procedure.initiative' }]);
    expect(run(first.state).events).toEqual([]);
    const later = run({ ...first.state, actual_first_turn: false, first_turn: false });
    expect(later.state.bandit_initiative_bonus).toBe(0);
    expect(later.events).toEqual([]);
  });
  it('actual all-bandits-dead gates once-only arrival handoff without assuming completed arrival', () => {
    expect(run({ ...setup(), phase: 'aftermath' }).state.first_blood_aftermath_processed).toBe(
      false,
    );
    const first = run({ ...ready(), phase: 'aftermath', all_bandits_dead: true });
    expect(first.state).toMatchObject({
      first_blood_aftermath_processed: true,
      arrive_without_further_issues: true,
      settlement_event_required: true,
      first_blood_settlement_arrived: false,
      coins: 81,
    });
    expect(first.events).toEqual([{ type: 'invoke', dependency: 'procedure.settlement_arrival' }]);
    expect(first.trace).toEqual(['procedure.first_blood', 'core.quest.first_blood.aftermath']);
    expect(run(first.state).events).toEqual([]);
  });
  it.each([
    { actual_settlement_arrival_confirmed: false },
    { actual_settlement_event_completed: false },
    { settlement_arrival_result_owner_matches: false },
    { first_blood_owner_matches: false },
  ] as State[])('incomplete or mismatched arrival result%j cannot complete', (patch) => {
    const first = run({ ...ready(), phase: 'aftermath', all_bandits_dead: true }).state;
    expect(
      run({
        ...first,
        actual_settlement_arrival_confirmed: true,
        actual_settlement_event_completed: true,
        settlement_arrival_result_owner_matches: true,
        ...patch,
      }).state.first_blood_settlement_arrived,
    ).toBe(false);
  });
  it('actual matching settlement arrival/event completes once, no invented payment', () => {
    const first = run({ ...ready(), phase: 'aftermath', all_bandits_dead: true }).state;
    const arrived = run({
      ...first,
      actual_settlement_arrival_confirmed: true,
      actual_settlement_event_completed: true,
      settlement_arrival_result_owner_matches: true,
    });
    expect(arrived.state).toMatchObject({ first_blood_settlement_arrived: true, coins: 81 });
    expect(arrived.events).toEqual([]);
    expect(run(arrived.state).events).toEqual([]);
  });
});
