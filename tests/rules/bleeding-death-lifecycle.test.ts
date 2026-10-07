import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((entry) => entry.procedure_id === 'procedure.rest')!;
const run = (id: string, inputs: State) =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const bleed = 'procedure.bleeding_out';
const death = 'procedure.hero_death';
const noHelp: State = {
  phase: 'after_battle',
  battle_over: true,
  standing_companion: true,
  healer_knocked_out: false,
  means_to_help: false,
  all_bleeding_out: false,
  bleeding_out: true,
  dead: false,
  untreated_rest_check_requested: false,
};
const removal: State = {
  dead: true,
  removed_from_game: false,
  replacement_processed: false,
  next_settlement_visit: false,
  replacement_chosen: false,
  can_act: false,
};

describe('Bleeding death and replacement — rendered PDF122', () => {
  it('isolated no-help death invokes the separate removal checkpoint', () => {
    const result = run(bleed, noHelp);
    expect(result.state.dead).toBe(true);
    expect(result.trace).toEqual([bleed, 'character.hit_points.no_rescue']);
    expect(result.events.filter((e) => e.type === 'invoke')).toEqual([
      { type: 'invoke', dependency: death },
    ]);
    expect(result.state.removed_from_game).toBeUndefined();
  });
  it.each([false, true])(
    'explicit no-help death does not invent battle_over=%s as a prerequisite',
    (battleOver) => {
      const result = run(bleed, { ...noHelp, phase: 'no_help', battle_over: battleOver });
      expect(result.state.dead).toBe(true);
      expect(result.trace).toEqual([bleed, 'character.hit_points.no_rescue']);
    },
  );

  it('healthy heroes cannot be killed by the no-help checkpoint', () => {
    const result = run(bleed, { ...noHelp, bleeding_out: false });
    expect(result.state.dead).toBe(false);
    expect(result.steps).not.toContain('no_help');
  });
  it('preserves the proposed untreated-rest overlap instead of choosing death', () => {
    const result = run(bleed, { ...noHelp, untreated_rest_check_requested: true });
    expect(result.unresolved).toEqual(['issue.rest.untreated_bleeding_no_rescue']);
    expect(result.state.dead).toBe(false);
    expect(result.steps).not.toContain('no_help');
    expect(result.steps).not.toContain('death_handoff');
  });
  it('simultaneous party bleeding sets quest loss and death for each supplied hero', () => {
    const result = run(bleed, { ...noHelp, all_bleeding_out: true });
    expect(result.state).toMatchObject({ quest_lost: true, heroes_die: true, dead: true });
    expect(result.trace).toEqual([bleed, 'character.hit_points.party_loss']);
    expect(result.steps).not.toContain('no_help');
  });
  it.each([4, 5, 6])('supplied elapsed turns %i respect the optional limit 5', (elapsed) => {
    const result = run(bleed, {
      phase: 'timer',
      advanced_rule_enabled: true,
      timer_processed: true,
      turns: 5,
      elapsed_turns: elapsed,
      bleeding_out: true,
      dead: false,
      all_bleeding_out: false,
    });
    expect(result.state.dead).toBe(elapsed >= 5);
  });
  const timerExclusions: State[] = [
    { advanced_rule_enabled: false },
    { bleeding_out: false },
    { dead: true },
    { timer_processed: false },
  ];
  it.each(timerExclusions)('does not expire an ineligible timer %j', (override) => {
    const result = run(bleed, {
      phase: 'timer',
      advanced_rule_enabled: true,
      timer_processed: true,
      turns: 5,
      elapsed_turns: 6,
      bleeding_out: true,
      dead: false,
      all_bleeding_out: false,
      ...override,
    });
    expect(result.steps).not.toContain('expired');
  });
  it('removes a dead hero once without creating a replacement before settlement', () => {
    const first = run(death, removal);
    expect(first.state).toMatchObject({ dead: true, removed_from_game: true, can_act: false });
    expect(first.state.replacement_level).toBeUndefined();
    expect(run(death, first.state).steps).toEqual([]);
  });
  it('replacement remains optional at the next settlement entry', () => {
    const result = run(death, { ...removal, next_settlement_visit: true });
    expect(result.state.replacement_level).toBeUndefined();
    expect(result.state.replacement_processed).toBe(false);
  });
  it('choice before next settlement cannot authorize replacement', () => {
    expect(
      run(death, { ...removal, replacement_chosen: true }).state.replacement_level,
    ).toBeUndefined();
  });
  it('one chosen new level 1 hero does not resurrect or replace the old hero state', () => {
    const result = run(death, {
      ...removal,
      next_settlement_visit: true,
      replacement_chosen: true,
    });
    expect(result.state).toMatchObject({
      dead: true,
      removed_from_game: true,
      replacement_level: 1,
      replacement_processed: true,
      can_act: false,
    });
    expect(result.trace).toEqual([death, 'character.death.replacement']);
    expect(run(death, result.state).trace).toEqual([death]);
  });
  it('a living hero cannot be removed or authorize a replacement', () => {
    const result = run(death, {
      ...removal,
      dead: false,
      next_settlement_visit: true,
      replacement_chosen: true,
    });
    expect(result.state.removed_from_game).toBe(false);
    expect(result.state.replacement_level).toBeUndefined();
  });
  it('explicit no-help, removal and chosen settlement replacement composition preserves the corpse', () => {
    const terminal = run(bleed, noHelp);
    const removed = run(death, { ...removal, ...terminal.state });
    const replaced = run(death, {
      ...removed.state,
      next_settlement_visit: true,
      replacement_chosen: true,
    });
    expect(replaced.state).toMatchObject({
      dead: true,
      bleeding_out: true,
      removed_from_game: true,
      replacement_level: 1,
      replacement_processed: true,
    });
    expect(replaced.trace).toEqual([death, 'character.death.replacement']);
  });
});
