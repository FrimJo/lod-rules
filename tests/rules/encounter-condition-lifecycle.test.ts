import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State, id = 'procedure.arachnophobia') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const hero: State = {
  sanity_system_enabled: true,
  arachnophobia_owner_matches: true,
  arachnophobia: true,
  encounter_confirmed: true,
  spider_classification_supplied: true,
  spider_encounter: true,
  arachnophobia_encounter_processed: false,
  arachnophobia_causes_terror: false,
  arachnophobia_classification_request_processed: false,
  encounter_resolution_scope_resolved: true,
  arachnophobia_terror_handoff_processed: false,
  causes_terror: false,
  causes_fear: true,
  sanity: 6,
  hit_points: 23,
  action_points: 2,
  irrational_fear_owner_matches: true,
  irrational_fear: true,
  phase: 'selection',
  faction_selection_supplied: true,
  selected_faction: 'Undead',
  irrational_fear_faction_processed: false,
  irrational_fear_selection_request_processed: false,
  monster_confirmed: true,
  monster_faction_membership_supplied: true,
  matches_faction: true,
  irrational_fear_monster_processed: false,
  irrational_fear_causes_fear: false,
  irrational_fear_membership_request_processed: false,
  irrational_fear_handoff_processed: false,
};
const fear = (inputs: State) => run(inputs, 'procedure.irrational_fear');
describe('Owned encounter condition contributions — PDF57 rows 6/8', () => {
  it('known spider requests Terror once without performing a reaction', () => {
    const first = run(hero);
    expect(first.trace).toEqual(['procedure.arachnophobia']);
    expect(first.events).toEqual([
      { type: 'invoke', dependency: 'Terror resolution for this source-classified encounter' },
    ]);
    expect(first.state).toMatchObject({
      arachnophobia_causes_terror: true,
      arachnophobia_applicability_resolved: true,
      causes_terror: false,
      causes_fear: true,
      sanity: 6,
      hit_points: 23,
      action_points: 2,
    });
    expect(run({ ...first.state, spider_encounter: false }).events).toEqual([]);
    expect(run({ ...first.state, spider_encounter: false }).state.arachnophobia_causes_terror).toBe(
      true,
    );
  });
  it('non-spider scope stays unresolved and unconsumed', () => {
    const result = run({ ...hero, spider_encounter: false });
    expect(result.state).toMatchObject({
      arachnophobia_applicability_resolved: false,
      arachnophobia_encounter_processed: false,
    });
    expect(result.events).not.toContainEqual({
      type: 'invoke',
      dependency: 'Terror resolution for this source-classified encounter',
    });
  });
  it('unknown taxonomy requests input once then accepts actual classification', () => {
    const first = run({ ...hero, spider_classification_supplied: false });
    expect(first.events).toContainEqual({
      type: 'invoke',
      dependency: 'Actual spider/non-spider classification for this owned encounter',
    });
    expect(run(first.state).events).toEqual([]);
    expect(
      run({ ...first.state, spider_classification_supplied: true }).state
        .arachnophobia_causes_terror,
    ).toBe(true);
  });
  it.each([
    { arachnophobia: false },
    { sanity_system_enabled: false },
    { encounter_confirmed: false },
  ] as State[])('inactive context clears only owned contribution %s', (change) => {
    expect(run({ ...hero, arachnophobia_causes_terror: true, ...change }).state).toMatchObject({
      arachnophobia_causes_terror: false,
      causes_fear: true,
      sanity: 6,
    });
  });
  it('wrong owner preserves state and marks context unknown', () => {
    expect(
      run({ ...hero, arachnophobia_owner_matches: false, arachnophobia_causes_terror: true }).state,
    ).toMatchObject({
      arachnophobia_causes_terror: true,
      arachnophobia_applicability_resolved: false,
    });
  });
  it('unresolved reaction context retains raw contribution without invoking', () => {
    const first = run({ ...hero, encounter_resolution_scope_resolved: false });
    expect(first.state.arachnophobia_causes_terror).toBe(true);
    expect(first.state.arachnophobia_terror_handoff_processed).toBe(false);
    expect(
      run({ ...first.state, encounter_resolution_scope_resolved: true }).events,
    ).toContainEqual({
      type: 'invoke',
      dependency: 'Terror resolution for this source-classified encounter',
    });
  });
  it('later diagnosis does not suppress prior active condition', () => {
    expect(
      run({ ...hero, acquired_condition_name: 'Depression', condition_episode_processed: false })
        .state.arachnophobia_causes_terror,
    ).toBe(true);
  });
  it.each(['Orcs and Goblins', 'Beasts', 'Undead', 'Reptiles', 'Dark Elves'])(
    'accepts actual printed faction %s',
    (selected_faction) => {
      expect(fear({ ...hero, selected_faction }).state).toMatchObject({
        irrational_fear_faction: selected_faction,
        irrational_fear_faction_processed: true,
      });
    },
  );
  it('persists actual selected faction against selection replay', () => {
    const selected = fear(hero);
    expect(selected.state.irrational_fear_faction).toBe('Undead');
    expect(selected.events).toEqual([]);
    expect(
      fear({ ...selected.state, selected_faction: 'Humans' }).state.irrational_fear_faction,
    ).toBe('Undead');
  });
  it.each(['', 'Orcs', 'Goblins', 'Demons'])(
    'rejects out-of-list selection %s',
    (selected_faction) => {
      expect(fear({ ...hero, selected_faction }).state.irrational_fear_faction_processed).toBe(
        false,
      );
    },
  );
  it('requests missing randomized result once without choosing', () => {
    const first = fear({ ...hero, faction_selection_supplied: false });
    expect(first.state.irrational_fear_faction_processed).toBe(false);
    expect(first.events.some((e) => e.type === 'invoke')).toBe(true);
    expect(fear(first.state).events).toEqual([]);
  });
  it('actual matching monster hands off once; another monster does not reset reaction context', () => {
    const selected = fear(hero);
    const first = fear({ ...selected.state, phase: 'encounter' });
    expect(first.trace).toEqual(['procedure.irrational_fear']);
    expect(first.state).toMatchObject({
      irrational_fear_causes_fear: true,
      causes_fear: true,
      causes_terror: false,
      sanity: 6,
      hit_points: 23,
      action_points: 2,
    });
    expect(first.events).toEqual([
      { type: 'invoke', dependency: 'Fear resolution for this source-classified monster context' },
    ]);
    expect(fear({ ...first.state, irrational_fear_monster_processed: false }).events).toEqual([]);
    expect(
      fear({
        ...first.state,
        irrational_fear_monster_processed: false,
        irrational_fear_handoff_processed: false,
      }).events,
    ).toHaveLength(1);
  });
  it('known nonmember is consumed without Fear and cannot be changed by replay', () => {
    const selected = fear(hero);
    const first = fear({ ...selected.state, phase: 'encounter', matches_faction: false });
    expect(first.state).toMatchObject({
      irrational_fear_monster_processed: true,
      irrational_fear_causes_fear: false,
      irrational_fear_applicability_resolved: true,
    });
    expect(fear({ ...first.state, matches_faction: true }).state.irrational_fear_causes_fear).toBe(
      false,
    );
  });
  it('unknown membership requests actual input once', () => {
    const selected = fear(hero);
    const first = fear({
      ...selected.state,
      phase: 'encounter',
      monster_faction_membership_supplied: false,
    });
    expect(first.state.irrational_fear_monster_processed).toBe(false);
    expect(first.events.some((e) => e.type === 'invoke')).toBe(true);
    expect(fear(first.state).events).toEqual([]);
    expect(
      fear({ ...first.state, monster_faction_membership_supplied: true }).state
        .irrational_fear_causes_fear,
    ).toBe(true);
  });
});
