import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const run = (rule_ids: string[], inputs: State = {}) =>
  runCase({ rule_ids, inputs } as TestCase, corpus);
const first = (suffix: string, inputs: State = {}) =>
  run([`core.quest.first_blood.${suffix}`], inputs);

describe('Quest Book I introduction — PDF 222–223', () => {
  it('retains the two campaigns and objective-room grouping without inventing Quest Book II data', () => {
    expect(run(['core.quest_book.catalogue_structure']).state).toEqual({
      campaigns_in_this_book: 2,
      individual_quest_grouping: 'which objective room is used',
    });
  });
  it.each([
    [false, false, false, false],
    [true, false, true, false],
    [true, true, true, true],
  ])(
    'preserves reading borders for room=%s, complete=%s',
    (room, complete, roomText, aftermath) => {
      expect(
        run(['core.quest_book.reading_boundaries'], {
          quest_room_reached: room,
          quest_complete: complete,
        }).state,
      ).toMatchObject({ quest_room_text_readable: roomText, aftermath_readable: aftermath });
    },
  );
  it('permits off-table aftermath loot without trap or lock checks', () => {
    expect(
      run(['core.quest_book.aftermath_looting'], { found_in_aftermath: true }).state,
    ).toMatchObject({ off_table_looting: true, check_traps: false, check_locks: false });
    expect(run(['core.quest_book.aftermath_looting'], { found_in_aftermath: false }).trace).toEqual(
      [],
    );
  });
  it.each([
    [11, 12, true],
    [13, 12, false],
    [12, 12, false],
    [11, 13, false],
    [0, 12, true],
  ])('checks direction and exact threshold %s → %s', (previous, current, trigger) => {
    const result = run(
      [
        'core.quest_book.threat_threshold_monster',
        'core.quest_book.threat_threshold_monster_otherwise',
      ],
      { previous_threat: previous, current_threat: current, quest_threshold: 12 },
    );
    expect(result.state.wandering_monster_triggered).toBe(trigger);
    expect(result.state.current_threat).toBe(current);
    if (trigger) expect(result.state.threat_reduction_on_placement).toBe(0);
  });
  it('retains each printed enemy loadout and board setup', () => {
    expect(first('setup').state).toMatchObject({
      bandit_leaders: 1,
      melee_bandits: 2,
      ranged_bandits: 1,
      leader_weapon: 'longsword',
      leader_shield: true,
      leader_armour: 1,
      melee_weapon: 'shortsword',
      ranged_weapon: 'shortbow',
      ranged_backup: 'dagger',
      bandit_armour: 0,
      outdoor_tiles: 4,
      tile_kind: 'wilderness outdoor open ground',
      hero_placement: 'centre, adjacent to each other',
    });
  });
  it.each([1, 10])('uses supplied per-bandit d10 placement %s', (distance) => {
    expect(
      first('enemy_placement', { approach_edge_randomised: true, distance_roll: distance }).state
        .distance_from_edge,
    ).toBe(distance);
  });
  it('rejects unrandomised edges and missing distance rolls', () => {
    expect(
      first('enemy_placement', { approach_edge_randomised: false, distance_roll: 4 }).trace,
    ).toEqual([]);
    expect(() => first('enemy_placement', { approach_edge_randomised: true })).toThrow(
      'Missing input distance_roll',
    );
  });
  it.each([0, 11])('rejects invalid d10 distance %s', (distance) => {
    expect(() =>
      first('enemy_placement', { approach_edge_randomised: true, distance_roll: distance }),
    ).toThrow();
  });
  it.each([
    [true, 2],
    [false, 0],
  ] as const)('limits surprise bonus to the first turn %s', (turn, bonus) => {
    expect(
      run(['core.quest.first_blood.surprise', 'core.quest.first_blood.surprise_otherwise'], {
        first_turn: turn,
      }).state.bandit_initiative_bonus,
    ).toBe(bonus);
  });
  it('retains darkness limits and disables Scenario die', () => {
    expect(first('darkness_and_scenario').state).toMatchObject({
      sight_limit: 10,
      shooting_limit: 10,
      scenario_die_used: false,
    });
  });
  it('hands off to settlement arrival only after all bandits are dead', () => {
    const success = first('aftermath', { all_bandits_dead: true });
    expect(success.state).toMatchObject({
      arrive_without_further_issues: true,
      settlement_event_required: true,
    });
    expect(success.events).toContainEqual({
      type: 'invoke',
      dependency: 'procedure.settlement_arrival',
    });
    expect(first('aftermath', { all_bandits_dead: false }).events).toEqual([]);
  });
  it('keeps every First Blood mechanic scenario-scoped with a real quest target', () => {
    const quest = corpus.entities.find((x) => x.id === 'quest.first_blood');
    expect(quest?.rules).toHaveLength(6);
    for (const id of quest?.rules ?? []) {
      expect(corpus.rules.find((x) => x.id === id)).toMatchObject({
        type: 'scenario_rule',
        scope: 'quest',
        quest_id: 'quest.first_blood',
      });
    }
  });
});
