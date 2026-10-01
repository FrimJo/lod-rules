import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State, procedure_id = 'procedure.hate') =>
  runCase({ ...fixture, procedure_id, inputs }, corpus);
const hero: State = {
  sanity_system_enabled: true,
  hate_owner_matches: true,
  hate: true,
  phase: 'acquisition',
  last_enemy_type_supplied: true,
  last_enemy_type: 'Goblin',
  hate_enemy_snapshot_processed: false,
  hate_enemy_request_processed: false,
  hate_bestiary_membership_supplied: true,
  last_enemy_in_bestiary: true,
  hate_bestiary_request_processed: false,
  hate_grant_scope_resolved: true,
  hate_grant_processed: false,
  hate_talent_owned: false,
  sanity: 6,
  current_conditions: 2,
  combat_skill: 51,
  hit_points: 23,
  hate_talent_owner_matches: true,
  hate_check_confirmed: true,
  hate_match_supplied: true,
  enemy_matches_chosen_enemy: true,
  struck_by_hated_enemy: true,
  hate_check_scope_resolved: true,
  hate_check_request_processed: false,
  hate_combat_skill_modifier: 0,
  hate_parry_modifier: 0,
  hate_dodge_modifier: 0,
  combat_skill_modifier: -10,
  parry_modifier: 3,
  dodge_modifier: 2,
};
const talent = (inputs: State) => run(inputs, 'procedure.hate_talent');
describe('Hate diagnosis and Talent — rendered PDF57/178', () => {
  it('persists onset target and grants once, handoff performs no modifiers', () => {
    const first = run(hero);
    expect(first.trace).toEqual(['procedure.hate']);
    expect(first.events).toEqual([{ type: 'invoke', dependency: 'procedure.hate_talent' }]);
    expect(first.state).toMatchObject({
      hate_enemy_type: 'Goblin',
      hate_talent_enemy_type: 'Goblin',
      hate_talent_owned: true,
      hate_grant_processed: true,
      combat_skill_modifier: -10,
      sanity: 6,
      current_conditions: 2,
    });
    const replay = run({ ...first.state, last_enemy_type: 'Skeleton' });
    expect(replay.state.hate_talent_enemy_type).toBe('Goblin');
    expect(replay.events).toEqual([]);
  });
  it('missing onset type requests once, does not choose or grant', () => {
    const first = run({ ...hero, last_enemy_type_supplied: false });
    expect(first.events).toEqual([
      { type: 'invoke', dependency: 'Actual enemy type last fought at this diagnosis onset' },
    ]);
    expect(first.state.hate_grant_processed).toBe(false);
    expect(run(first.state).events).toEqual([]);
    expect(run({ ...first.state, last_enemy_type_supplied: true }).state.hate_talent_owned).toBe(
      true,
    );
  });
  it('missing Bestiary eligibility preserves snapshot against a later enemy', () => {
    const first = run({ ...hero, hate_bestiary_membership_supplied: false });
    expect(first.state.hate_enemy_type).toBe('Goblin');
    expect(first.events).toEqual([
      { type: 'invoke', dependency: 'Actual persisted enemy eligibility in Monster List' },
    ]);
    expect(run({ ...first.state, last_enemy_type: 'Dragon' }).events).toEqual([]);
    const resumed = run({
      ...first.state,
      last_enemy_type: 'Dragon',
      hate_bestiary_membership_supplied: true,
    });
    expect(resumed.state.hate_talent_enemy_type).toBe('Goblin');
  });
  it.each([
    { last_enemy_in_bestiary: false },
    { hate_grant_scope_resolved: false },
    { last_enemy_type: '' },
  ] as State[])('unresolved/ineligible grant cannot mutate Talent %s', (change) => {
    const r = run({ ...hero, ...change });
    expect(r.state.hate_grant_processed).toBe(false);
    expect(r.state.hate_talent_owned).toBe(false);
    expect(r.events).not.toContainEqual({ type: 'invoke', dependency: 'procedure.hate_talent' });
  });
  it.each([
    { sanity_system_enabled: false },
    { hate_owner_matches: false },
    { hate: false },
    { phase: 'rest' },
  ] as State[])('inapplicable checkpoint cannot snapshot or grant %s', (change) => {
    const r = run({ ...hero, ...change });
    expect(r.state.hate_enemy_snapshot_processed).toBe(false);
    expect(r.state.hate_grant_processed).toBe(false);
    expect(r.events).toEqual([]);
  });
  it('later diagnosis does not suppress still-pending owned Hate', () => {
    expect(
      run({ ...hero, acquired_condition_name: 'Jumpy', condition_episode_processed: false }).state
        .hate_talent_owned,
    ).toBe(true);
  });
  it('condition removal does not silently delete an already granted Talent', () => {
    const first = run(hero);
    expect(run({ ...first.state, hate: false }).state.hate_talent_owned).toBe(true);
  });
  it.each([
    ['attack', 5, 0, 0],
    ['parry', 0, -5, 0],
    ['dodge', 0, 0, -5],
  ] as const)('actual %s gets only its fixed owned contribution', (phase, cs, parry, dodge) => {
    const r = talent({ ...run(hero).state, phase });
    expect(r.trace).toEqual(['procedure.hate_talent']);
    expect(r.state).toMatchObject({
      hate_combat_skill_modifier: cs,
      hate_parry_modifier: parry,
      hate_dodge_modifier: dodge,
      combat_skill_modifier: -10,
      parry_modifier: 3,
      dodge_modifier: 2,
      combat_skill: 51,
      hit_points: 23,
      sanity: 6,
    });
    expect(talent(r.state).state).toEqual(r.state);
  });
  it.each(['attack', 'parry', 'dodge'])('nonmatching enemy has no %s contribution', (phase) => {
    expect(
      talent({ ...hero, hate_talent_owned: true, phase, enemy_matches_chosen_enemy: false }).state,
    ).toMatchObject({
      hate_combat_skill_modifier: 0,
      hate_parry_modifier: 0,
      hate_dodge_modifier: 0,
      hate_check_applicability_resolved: true,
    });
  });
  it.each(['parry', 'dodge'])('defence requires actual struck eligibility %s', (phase) => {
    expect(
      talent({ ...hero, hate_talent_owned: true, phase, struck_by_hated_enemy: false }).state,
    ).toMatchObject({ hate_parry_modifier: 0, hate_dodge_modifier: 0 });
  });
  it.each([{ hate_match_supplied: false }, { hate_check_scope_resolved: false }] as State[])(
    'unknown context preserves owned contribution until actual input %s',
    (change) => {
      const first = talent({
        ...hero,
        hate_talent_owned: true,
        phase: 'attack',
        hate_combat_skill_modifier: 5,
        ...change,
      });
      expect(first.state).toMatchObject({
        hate_combat_skill_modifier: 5,
        hate_check_applicability_resolved: false,
      });
      expect(first.events).toHaveLength(1);
      expect(talent(first.state).events).toEqual([]);
      expect(
        talent({
          ...first.state,
          hate_match_supplied: true,
          hate_check_scope_resolved: true,
          enemy_matches_chosen_enemy: false,
        }).state.hate_combat_skill_modifier,
      ).toBe(0);
    },
  );
  it('wrong Talent owner cannot erase another contribution', () => {
    expect(
      talent({ ...hero, hate_talent_owner_matches: false, hate_combat_skill_modifier: 5 }).state,
    ).toMatchObject({ hate_combat_skill_modifier: 5, hate_check_applicability_resolved: false });
  });
  it.each([
    { hate_talent_owned: false },
    { hate_check_confirmed: false },
    { phase: 'rest' },
  ] as State[])('inactive/unrelated check clears only owned values %s', (change) => {
    expect(
      talent({
        ...hero,
        hate_talent_owned: true,
        phase: 'attack',
        hate_combat_skill_modifier: 5,
        ...change,
      }).state,
    ).toMatchObject({
      hate_combat_skill_modifier: 0,
      hate_parry_modifier: 0,
      hate_dodge_modifier: 0,
      combat_skill_modifier: -10,
      parry_modifier: 3,
    });
  });
  it('independent owned Talent does not depend on optional Sanity applicability', () => {
    expect(
      talent({ ...hero, hate_talent_owned: true, phase: 'attack', sanity_system_enabled: false })
        .state.hate_combat_skill_modifier,
    ).toBe(5);
  });
  it('another actual check has its own missing-input request marker', () => {
    const first = talent({
      ...hero,
      hate_talent_owned: true,
      phase: 'attack',
      hate_match_supplied: false,
    });
    expect(talent({ ...first.state, hate_check_request_processed: false }).events).toHaveLength(1);
  });
  it('attack then defence recomputes, does not carry attack CS into parry', () => {
    const first = talent({ ...hero, hate_talent_owned: true, phase: 'attack' });
    expect(talent({ ...first.state, phase: 'parry' }).state).toMatchObject({
      hate_combat_skill_modifier: 0,
      hate_parry_modifier: -5,
    });
  });
});
