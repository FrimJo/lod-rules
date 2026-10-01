import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.mental_condition_cleanup', inputs }, corpus);
const hero: State = {
  sanity_system_enabled: true,
  mental_treatment_owner_matches: true,
  mental_treatment_result_processed: true,
  mental_treatment_succeeded: true,
  mental_treatment_trait_removal_processed: true,
  mental_treatment_removal_pending: true,
  mental_treatment_cleanup_processed: false,
  mental_treatment_disorder: 'Fear of the Dark',
  fear_of_the_dark: false,
  claustrophobia: false,
  arachnophobia: false,
  irrational_fear: false,
  jumpy_active: false,
  resolve_test_modifier: -10,
  claustrophobia_skill_stat_modifier: -10,
  arachnophobia_causes_terror: true,
  irrational_fear_causes_fear: true,
  jumpy_scream_this_call: true,
  jumpy_startle_this_call: true,
  jumpy_alert_this_call: true,
  threat: 9,
  causes_terror: true,
  causes_fear: true,
  sanity: 6,
  current_conditions: 1,
  coins: 500,
  energy_pool: 3,
  hate_talent_owned: true,
  trauma_resolve_modifier: -10,
  resolve_modifier: -10,
  combat_skill: 51,
};
describe('Cured condition current contributions — PDF57/147', () => {
  it.each([
    ['Fear of the Dark', 'resolve_test_modifier', 0],
    ['Claustrophobia', 'claustrophobia_skill_stat_modifier', 0],
    ['Arachnophobia', 'arachnophobia_causes_terror', false],
    ['Irrational Fear', 'irrational_fear_causes_fear', false],
    ['Jumpy', 'jumpy_scream_this_call', false],
  ] as const)(
    'clears only the owned current %s contribution',
    (mental_treatment_disorder, key, value) => {
      const r = run({ ...hero, mental_treatment_disorder });
      expect(r.state[key]).toBe(value);
      expect(r.state).toMatchObject({
        mental_treatment_cleanup_processed: true,
        mental_treatment_removal_pending: false,
        threat: 9,
        causes_terror: true,
        causes_fear: true,
        sanity: 6,
        current_conditions: 1,
        coins: 500,
        energy_pool: 3,
        hate_talent_owned: true,
        trauma_resolve_modifier: -10,
        resolve_modifier: -10,
        combat_skill: 51,
      });
      expect(r.trace).toEqual(['procedure.mental_condition_cleanup']);
      expect(r.events).toEqual([]);
      expect(run({ ...r.state, [key]: value }).state).toEqual(r.state);
    },
  );
  it.each(['Hate', 'Depression', 'Acute Stress', 'Lingering Trauma'])(
    'lasting %s cure effects stay unresolved',
    (mental_treatment_disorder) => {
      const r = run({ ...hero, mental_treatment_disorder });
      expect(r.state).toEqual({ ...hero, mental_treatment_disorder });
      expect(r.unresolved).toEqual(['issue.sanity.cure_lasting_effects']);
    },
  );
  it.each([
    'sanity_system_enabled',
    'mental_treatment_owner_matches',
    'mental_treatment_result_processed',
    'mental_treatment_succeeded',
    'mental_treatment_trait_removal_processed',
    'mental_treatment_removal_pending',
  ])('missing actual cure guard %s cannot clear a contribution', (field) => {
    expect(run({ ...hero, [field]: false }).state.resolve_test_modifier).toBe(-10);
  });
  it('still active disorder is not cleared on a cleanup request', () => {
    expect(run({ ...hero, fear_of_the_dark: true }).state.resolve_test_modifier).toBe(-10);
  });
  it('consumed cleanup does not erase a later distinct contribution', () => {
    const first = run(hero);
    expect(run({ ...first.state, resolve_test_modifier: -7 }).state.resolve_test_modifier).toBe(-7);
  });
  it('another disorder contribution is preserved', () => {
    expect(run(hero).state.claustrophobia_skill_stat_modifier).toBe(-10);
  });
});
