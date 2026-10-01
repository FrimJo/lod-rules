import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.damage_follow_up', inputs }, corpus);
const exposure: State = {
  damage_type: 'disease',
  phase: 'initial',
  disease_exposed: true,
  dead: false,
  diseased: false,
  disease_exposure_processed: false,
  con_success: false,
  in_battle: true,
  constitution: 35,
  strength: 41,
  rest_occurs: false,
};
const rest: State = {
  damage_type: 'disease',
  phase: 'rest',
  diseased: true,
  dead: false,
  rest_occurs: true,
  disease_rest_check_chosen: true,
  disease_rest_processed: false,
  disease_penalty_active: true,
  con_roll: 5,
};

describe('Disease exposure, delayed loss and optional rest — rendered PDF121', () => {
  it('a failed exposure during battle defers stat loss until the battle ends', () => {
    const infected = run(exposure);
    expect(infected.state).toMatchObject({
      diseased: true,
      disease_penalty_active: false,
      disease_penalty_processed: false,
    });
    expect(infected.state.constitution_after).toBeUndefined();
    const ended = run({ ...infected.state, phase: 'after_battle', in_battle: false });
    expect(ended.state).toMatchObject({
      constitution_after: 18,
      strength_after: 21,
      disease_penalty_active: true,
      disease_penalty_processed: true,
    });
    expect(ended.steps).toContain('disease_penalty');
  });
  it('a failed exposure outside any ongoing battle applies the loss immediately', () => {
    expect(run({ ...exposure, in_battle: false }).state).toMatchObject({
      constitution_after: 18,
      strength_after: 21,
    });
  });
  it('replay cannot halve already-adjusted supplied values again', () => {
    const first = run({ ...exposure, in_battle: false });
    const repeat = run({ ...first.state, phase: 'after_battle', constitution: 18, strength: 21 });
    expect(repeat.state).toMatchObject({ constitution_after: 18, strength_after: 21 });
    expect(repeat.steps).not.toContain('disease_penalty');
  });
  it('ordinary successful resistance is processed once and causes no new sickness', () => {
    const first = run({ ...exposure, con_success: true });
    expect(first.state).toMatchObject({ diseased: false, disease_exposure_processed: true });
    expect(run({ ...first.state, con_success: false }).state.diseased).toBe(false);
  });
  it('a distinct later exposure can infect a previously resistant hero', () => {
    const first = run({ ...exposure, con_success: true });
    expect(
      run({ ...first.state, disease_exposure_processed: false, con_success: false }).state.diseased,
    ).toBe(true);
  });
  it('another failed exposure while diseased preserves the episode and records unresolved stacking', () => {
    const first = run({ ...exposure, in_battle: false });
    const another = run({ ...first.state, disease_exposure_processed: false });
    expect(another.unresolved).toEqual(['issue.disease.concurrent_effects']);
    expect(another.state).toMatchObject({
      constitution_after: 18,
      strength_after: 21,
      disease_penalty_processed: true,
    });
    expect(another.steps).not.toContain('disease');
    expect(another.steps).not.toContain('disease_penalty');
  });
  it('successful resistance to another exposure preserves an existing illness without inventing stacking', () => {
    const first = run({ ...exposure, in_battle: false });
    const another = run({ ...first.state, disease_exposure_processed: false, con_success: true });
    expect(another.unresolved).toEqual([]);
    expect(another.state.diseased).toBe(true);
  });
  const rejected: State[] = [{ dead: true }, { disease_exposed: false }];
  it.each(rejected)('rejects ineligible exposure %j', (override) => {
    expect(run({ ...exposure, ...override }).state.diseased).toBe(false);
  });
  it('even values lose an exact half', () => {
    expect(
      run({ ...exposure, in_battle: false, constitution: 36, strength: 40 }).state,
    ).toMatchObject({ constitution_after: 18, strength_after: 20 });
  });
  it.each([1, 2, 3, 4, 5])('chosen rest CON %i cures and ends modifier applicability', (roll) => {
    const result = run({ ...rest, con_roll: roll });
    expect(result.state).toMatchObject({
      diseased: false,
      cured: true,
      disease_penalty_active: false,
      disease_rest_processed: true,
    });
    expect(result.trace).toEqual(['procedure.damage_follow_up']);
  });
  it('roll 6 fails to cure and replay cannot substitute another result', () => {
    const first = run({ ...rest, con_roll: 6 });
    expect(first.state).toMatchObject({
      diseased: true,
      disease_rest_processed: true,
      disease_penalty_active: true,
    });
    expect(run({ ...first.state, con_roll: 5 }).state.diseased).toBe(true);
  });
  it('a distinct later rest can cure after a failed prior check', () => {
    const first = run({ ...rest, con_roll: 6 });
    expect(run({ ...first.state, disease_rest_processed: false, con_roll: 5 }).state.diseased).toBe(
      false,
    );
  });
  const noRestCheck: State[] = [
    { disease_rest_check_chosen: false },
    { rest_occurs: false },
    { diseased: false },
    { dead: true },
  ];
  it.each(noRestCheck)('does not consume an unchosen or ineligible rest check %j', (override) => {
    const result = run({ ...rest, ...override });
    expect(result.state.disease_rest_processed).toBe(false);
    expect(result.steps).not.toContain('disease_recovery');
  });
  it('cure disables the modifier without guessing restoration across unrelated stat changes', () => {
    const result = run({
      ...rest,
      constitution: 29,
      strength: 39,
      constitution_after: 18,
      strength_after: 21,
    });
    expect(result.state).toMatchObject({
      constitution: 29,
      strength: 39,
      constitution_after: 18,
      strength_after: 21,
      disease_penalty_active: false,
    });
  });
});
