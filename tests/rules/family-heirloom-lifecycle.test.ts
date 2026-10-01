import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot(),
  fixture = corpus.testCases.find((x) => x.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.family_heirloom', inputs }, corpus);
const base: State = {
  phase: 'objective_room',
  instance_quest_id: 'quest.great_crypt.family_heirloom',
  heirloom_owner_matches: true,
  heirloom_setup_processed: false,
  heirloom_threat_initialized: false,
  heirloom_threat_requested: false,
  threat_roll_supplied: true,
  threat_die: 1,
  threat: 7,
  objective_room_entered: true,
  heirloom_objective_processed: false,
  heirloom_card_setup_processed: false,
  heirloom_draw_pending: false,
  heirloom_draw_requested: false,
  heirloom_mummy_requested: false,
  heirloom_reward_processed: false,
  sword_retrieved: false,
  scenario_event_supplied: true,
  actual_scenario_event: 1,
  last_scenario_event: 0,
  scenario_roll: 8,
  heroes_working_together: 2,
  complete_turn_spent: true,
  actual_tomb: 1,
  actual_card: 1,
  card_draw_supplied: true,
  card_classification_resolved: true,
  actual_card_matches_pending_tomb: true,
  actual_card_category: 'Black',
  heroes_back_at_surface: false,
  sword_presented_to_knight: false,
  heirloom_reward_owner_matches: true,
  coins: 700,
  instance_completed: false,
};
const room = () => run(base).state;
const open = (state: State, patch: State = {}) => run({ ...state, phase: 'open_tomb', ...patch });
describe('Retrieving the Family Heirloom owned tomb/card lifecycle — PDF259–260', () => {
  it('a later Black tomb clears only current combat reports, preserving the actual mummy outcome', () => {
    const dressed = open(room(), { actual_card_category: 'Dressed Card' }).state;
    const black = open(
      { ...dressed, current_mummy_alive: true },
      { actual_tomb: 2, actual_card: 2, actual_card_category: 'Black' },
    );
    expect(black.state).toMatchObject({
      commence_combat: false,
      mummy_placement: '',
      current_mummy_alive: true,
      mummified_corpse_found: true,
    });
    expect(black.trace).not.toContain('core.quest.family_heirloom.dressed_card');
  });

  it.each([1, 2, 3, 4])(
    'initial d4 %i preserves printed max18 and corpse override',
    (threat_die) => {
      const first = run({ ...base, phase: 'setup', threat_die });
      expect(first.state).toMatchObject({
        threat: threat_die + 1,
        heirloom_minimum_threat: threat_die + 1,
        heirloom_maximum_threat: 18,
        room_tiles: 'R1B-8B',
        encounters: 'Undead',
        brotherhood_corpses_treated_as: 'dead adventurers',
        ignore_dead_brotherhood_special_rules: true,
        coins: 700,
      });
      expect(run({ ...first.state, threat: 17 }).state.threat).toBe(17);
    },
  );
  it('objective initial no-enemies and positions are not reapplied over later combat', () => {
    const first = room();
    expect(first).toMatchObject({
      tombs: 6,
      initial_enemies: 0,
      hero_position: 'where they were when the door was opened',
      remaining_black: 3,
      remaining_red: 1,
      remaining_dressed: 2,
    });
    expect(run({ ...first, initial_enemies: 1, remaining_black: 2 }).state).toMatchObject({
      initial_enemies: 1,
      remaining_black: 2,
    });
  });
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'actual Scenario%i threshold consumes event once',
    (scenario_roll) => {
      const first = run({ ...base, phase: 'scenario', scenario_roll });
      expect(first.state.scenario_die_triggered).toBe(scenario_roll >= 8);
      expect(run({ ...first.state, scenario_roll: 10 }).state.scenario_die_triggered).toBe(
        scenario_roll >= 8,
      );
      expect(
        run({ ...first.state, actual_scenario_event: 2, scenario_roll: 1 }).state
          .scenario_die_triggered,
      ).toBe(false);
    },
  );
  it.each([
    { heroes_working_together: 1 },
    { heroes_working_together: 3 },
    { complete_turn_spent: false },
    { heirloom_owner_matches: false },
    { instance_quest_id: 'quest.chamber_of_reverence.returning_relic' },
  ] as State[])('invalid source work %j cannot remove lid/draw', (patch) => {
    expect(open(room(), patch).state.tomb_1_opened).toBe(false);
  });
  it.each(['Black', 'Red', 'Dressed Card'])(
    'actual %s draw resolves one distinct card once',
    (actual_card_category) => {
      const result = open(room(), { actual_card_category });
      expect(result.state).toMatchObject({
        tomb_1_opened: true,
        card_1_used: true,
        heirloom_draw_pending: false,
        coins: 700,
      });
      const suffix =
        actual_card_category === 'Black'
          ? 'black_card'
          : actual_card_category === 'Red'
            ? 'red_card'
            : 'dressed_card';
      expect(result.trace).toEqual([
        'procedure.family_heirloom',
        'core.quest.family_heirloom.open_tomb',
        `core.quest.family_heirloom.${suffix}`,
      ]);
      const replay = open(result.state, { actual_card: 2, actual_card_category: 'Red' });
      expect(replay.state.card_2_used).toBe(false);
      expect(replay.trace).toEqual(['procedure.family_heirloom']);
      if (actual_card_category === 'Black')
        expect(result.state).toMatchObject({
          remaining_black: 2,
          mummified_corpse_found: true,
          other_contents_found: false,
          sword_retrieved: false,
        });
      if (actual_card_category === 'Red')
        expect(result.state).toMatchObject({ remaining_red: 0, sword_retrieved: true });
      if (actual_card_category === 'Dressed Card') {
        expect(result.state).toMatchObject({
          remaining_dressed: 1,
          mummy_placement: 'next to the tomb',
          commence_combat: true,
          heirloom_mummy_requested: true,
          initial_enemies: 0,
        });
        expect(result.state.mummy_hp).toBeUndefined();
      }
    },
  );
  it('missing/unclassified card retains pending tomb and cannot open another', () => {
    const first = open(room(), { card_draw_supplied: false });
    expect(first.state).toMatchObject({
      tomb_1_opened: true,
      heirloom_draw_pending: true,
      heirloom_draw_requested: true,
      card_1_used: false,
    });
    expect(open(first.state, { actual_tomb: 2 }).state.tomb_2_opened).toBe(false);
    expect(open(first.state, { card_classification_resolved: false }).state.card_1_used).toBe(
      false,
    );
    expect(open(first.state, { actual_card_matches_pending_tomb: false }).state.card_1_used).toBe(
      false,
    );
    const resolved = open(first.state, { card_draw_supplied: true, actual_card_category: 'Red' });
    expect(resolved.state.sword_retrieved).toBe(true);
    expect(resolved.trace).toEqual([
      'procedure.family_heirloom',
      'core.quest.family_heirloom.red_card',
    ]);
  });
  it.each([0, 1, 2, 3, 4, 5])('actual finite six-card pool, red at position%i', (redPosition) => {
    const cards = ['Black', 'Black', 'Black', 'Dressed Card', 'Dressed Card'];
    cards.splice(redPosition, 0, 'Red');
    let state = room();
    for (let i = 0; i < 6; i++)
      state = open(state, {
        actual_tomb: i + 1,
        actual_card: i + 1,
        actual_card_category: cards[i]!,
      }).state;
    expect(state).toMatchObject({
      remaining_black: 0,
      remaining_red: 0,
      remaining_dressed: 0,
      sword_retrieved: true,
    });
    for (let i = 1; i <= 6; i++) {
      expect(state['tomb_' + i + '_opened']).toBe(true);
      expect(state['card_' + i + '_used']).toBe(true);
    }
    expect(open(state, { actual_tomb: 6, actual_card: 6 }).trace).toEqual([
      'procedure.family_heirloom',
    ]);
  });
  it('same actual card cannot be reused for a new tomb', () => {
    const first = open(room()).state;
    const second = open(first, { actual_tomb: 2, actual_card: 1, actual_card_category: 'Red' });
    expect(second.state).toMatchObject({
      tomb_2_opened: true,
      heirloom_draw_pending: true,
      remaining_red: 1,
      sword_retrieved: false,
    });
  });
  it('printed category counts prevent an extra Red draw', () => {
    const first = open(room(), { actual_card_category: 'Red' }).state;
    const second = open(first, { actual_tomb: 2, actual_card: 2, actual_card_category: 'Red' });
    expect(second.state).toMatchObject({
      remaining_red: 0,
      card_2_used: false,
      heirloom_draw_pending: true,
    });
  });
  it.each([
    { sword_retrieved: false },
    { heroes_back_at_surface: false },
    { sword_presented_to_knight: false },
    { heirloom_reward_owner_matches: false },
    { heirloom_reward_processed: true },
  ] as State[])('reward source guard%j cannot credit coins', (patch) => {
    expect(
      run({
        ...room(),
        phase: 'reward',
        sword_retrieved: true,
        heroes_back_at_surface: true,
        sword_presented_to_knight: true,
        ...patch,
      }).state.coins,
    ).toBe(700);
  });
  it('actual Red sword, surface and presentation credits each owned hero once', () => {
    const red = open(room(), { actual_card_category: 'Red' }).state;
    const paid = run({
      ...red,
      phase: 'reward',
      heroes_back_at_surface: true,
      sword_presented_to_knight: true,
    });
    expect(paid.state).toMatchObject({
      sword_handed_to_knight: true,
      coins: 1000,
      heirloom_reward_processed: true,
      instance_completed: false,
    });
    expect(paid.trace).toEqual(['procedure.family_heirloom', 'core.quest.family_heirloom.reward']);
    expect(run(paid.state).state.coins).toBe(1000);
    expect(
      run({
        ...red,
        phase: 'reward',
        heroes_back_at_surface: true,
        sword_presented_to_knight: true,
        coins: 10,
      }).state.coins,
    ).toBe(310);
    expect(paid.state.objective_chests).toBeUndefined();
  });
});
