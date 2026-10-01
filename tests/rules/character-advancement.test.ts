import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (id: string, inputs: State) =>
  runCase({ procedure_id: `procedure.character_${id}`, inputs } as TestCase, corpus);
const level: State = {
  in_settlement: true,
  activity_authorized: true,
  leaving_on_quest: false,
  level: 1,
  target_level: 2,
  experience: 2000,
  hp_roll: 2,
  maximum_hit_points: 12,
  maximum_luck: 0,
  maximum_energy: 1,
  improvement_points: 4,
  session_open: false,
  session_level: 1,
  talent_selected: false,
  perk_selected: false,
};
const improve: State = {
  session_open: true,
  profession: 'warrior',
  race: 'Human',
  subject: 'CS',
  value: 40,
  increased_this_level: 0,
  improvement_points: 15,
  boundary_cost_resolved: false,
  boundary_cost_multiplier: 1,
  hp_limit_resolved: false,
  hp_purchase_limit: 2,
};
const ability: State = {
  session_open: true,
  level: 2,
  profession: 'warrior',
  kind: 'talent',
  selected_id: 'talent.braveheart',
  selected_category: 'Mental',
  catalogue_selection_valid: true,
  talent_selected: false,
  perk_selected: false,
};

describe('level advancement — PDF 60–62', () => {
  it('advances once, carries spare points, and does not spend XP', () => {
    const r = run('level_up', level);
    expect(r.state).toMatchObject({
      level: 2,
      experience: 2000,
      maximum_hit_points: 14,
      maximum_luck: 1,
      maximum_energy: 2,
      improvement_points: 19,
      session_open: true,
    });
    expect(r.steps).toEqual(['lookup_level', 'advance', 'luck', 'energy']);
    const repeat = run('level_up', r.state);
    expect(repeat.state.improvement_points).toBe(19);
    expect(repeat.state.maximum_hit_points).toBe(14);
    expect(repeat.state.advanced).toBe(false);
  });
  it.each<State>([
    { experience: 1999 },
    { in_settlement: false },
    { activity_authorized: false },
    { leaving_on_quest: true },
    { target_level: 3, experience: 5000 },
    { session_open: true },
  ])('rejects ineligible or out-of-order advancement %j', (override) => {
    const r = run('level_up', { ...level, ...override });
    expect(r.state.level).toBe(1);
    expect(r.state.improvement_points).toBe(4);
    expect(r.events).toContainEqual({ type: 'require', satisfied: false });
  });
  it.each([
    [2, 2000, 1, 1],
    [3, 5000, 0, 0],
    [4, 10000, 0, 1],
    [5, 25000, 1, 0],
    [6, 50000, 0, 0],
    [7, 75000, 0, 1],
    [8, 110000, 1, 0],
    [9, 160000, 0, 1],
    [10, 220000, 0, 0],
  ])('preserves level %i threshold and resource increments', (target_level, xp, luck, energy) => {
    const r = run('level_up', { ...level, level: target_level - 1, target_level, experience: xp });
    expect(r.state).toMatchObject({
      level: target_level,
      maximum_luck: luck,
      maximum_energy: energy + 1,
      maximum_hit_points: 14,
    });
    expect(
      run('level_up', { ...level, level: target_level - 1, target_level, experience: xp - 1 }).state
        .advanced,
    ).toBe(false);
  });
  it('rejects out-of-domain and missing dice', () => {
    expect(() => run('level_up', { ...level, hp_roll: 3 })).toThrow('Input out of range');
    const { hp_roll: _missing, ...inputs } = level;
    expect(() => run('level_up', inputs)).toThrow('Missing input hp_roll');
  });
});

describe('Improvement Point purchases — PDF 61', () => {
  it('buys at most five increments per subject in a session', () => {
    let r = run('improve', improve);
    for (let i = 1; i < 6; i++) r = run('improve', r.state);
    expect(r.state).toMatchObject({
      value: 45,
      increased_this_level: 5,
      improvement_points: 10,
      improved: false,
    });
  });
  it('separates basic stat changes from skills and respects racial maxima', () => {
    const r = run('improve', {
      ...improve,
      subject: 'STR',
      race: 'Halfling',
      value: 39,
      skill: 40,
    });
    expect(r.state).toMatchObject({ value: 40, skill: 40, improvement_points: 13 });
    expect(run('improve', r.state).state.improved).toBe(false);
  });
  it('doubles above 70 and refuses to invent the crossing cost', () => {
    expect(run('improve', { ...improve, value: 71 }).state.improvement_points).toBe(13);
    const unresolved = run('improve', { ...improve, value: 70 });
    expect(unresolved.unresolved).toContain('issue.character.improvement_seventy_boundary');
    expect(unresolved.state).toMatchObject({ value: 70, improvement_points: 15, improved: false });
    for (const boundary_cost_multiplier of [1, 2]) {
      const r = run('improve', {
        ...improve,
        value: 70,
        boundary_cost_resolved: true,
        boundary_cost_multiplier,
      });
      expect(r.state).toMatchObject({
        value: 71,
        improvement_points: 15 - boundary_cost_multiplier,
      });
    }
  });
  it.each<State>([
    { session_open: false },
    { improvement_points: 0 },
    { value: 80 },
    { subject: 'Arcane Arts' },
    { subject: 'Battle Prayers' },
    { profession: 'invented' },
    { subject: 'invented' },
  ])('rejects unsupported or unaffordable improvements %j', (override) => {
    const r = run('improve', { ...improve, ...override });
    expect(r.state.value).toBe(override.value ?? 40);
    expect(r.state.improved).toBe(false);
  });
  it('keeps purchased HP subject to an explicitly supplied limit', () => {
    const pending = run('improve', { ...improve, subject: 'Hit points +1', value: 12 });
    expect(pending.unresolved).toContain('issue.character.level_hit_point_limit');
    expect(pending.state.improvement_points).toBe(15);
    const one = run('improve', { ...pending.state, hp_limit_resolved: true });
    const two = run('improve', one.state);
    const three = run('improve', two.state);
    expect(three.state).toMatchObject({
      value: 14,
      improvement_points: 5,
      increased_this_level: 2,
      improved: false,
    });
  });
  it('executes every numeric source cost and rejects every marker', () => {
    const table = corpus.tables.find((t) => t.id === 'table.character.improvement_costs')!;
    for (const row of table.rows)
      for (const col of table.columns.slice(1)) {
        const cell = row.cells[col.id]!;
        const r = run('improve', {
          ...improve,
          profession: col.id,
          subject: row.source_row,
          hp_limit_resolved: true,
          value: 30,
        });
        if (cell.type === 'number')
          expect(r.state).toMatchObject({
            cost: cell.value,
            value: 31,
            improvement_points: 15 - cell.value,
          });
        else expect(r.state).toMatchObject({ value: 30, improved: false });
      }
  });
});

describe('advancement choices and closure — PDF 62', () => {
  it('grants one matching talent and one permitted perk', () => {
    const talent = run('level_ability', ability);
    expect(talent.state).toMatchObject({
      granted: true,
      granted_id: 'talent.braveheart',
      talent_selected: true,
    });
    expect(run('level_ability', talent.state).state.granted).toBe(false);
    const perk = run('level_ability', {
      ...talent.state,
      kind: 'perk',
      selected_category: 'Leader',
      selected_id: 'perk.encouragement',
    });
    expect(perk.state).toMatchObject({ perk_selected: true, granted: true });
  });
  it.each<State>([
    { level: 3, kind: 'perk' },
    { selected_category: 'Combat' },
    { catalogue_selection_valid: false },
    { session_open: false },
    { profession: 'invented' },
  ])('rejects invalid ability selection %j', (override) => {
    expect(run('level_ability', { ...ability, ...override }).state.granted).toBe(false);
  });
  it('closes the session and carries saved points to the next level', () => {
    const first = run('level_up', level);
    const closed = run('finish_advancement', { ...first.state, finish: true });
    expect(closed.state).toMatchObject({ session_open: false, improvement_points: 19 });
    expect(run('improve', { ...improve, ...closed.state }).state.improved).toBe(false);
    expect(
      run('level_up', { ...closed.state, target_level: 3, experience: 5000 }).state,
    ).toMatchObject({ level: 3, improvement_points: 34, session_open: true });
  });
});
