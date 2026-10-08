import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffixes: string[], inputs: State = {}) =>
  runCase({ rule_ids: suffixes.map((s) => `core.threat.${s}`), inputs } as TestCase, corpus);
describe('The Threat Level — rendered PDF89, printed88', () => {
  it('starts at the level the quest gives', () => {
    expect(run(['starting_level'], { quest_start_threat_level: 5 }).state).toMatchObject({
      threat_level: 5,
    });
  });
  it.each([
    [true, 6],
    [false, 5],
  ])('a won battle adds 1: %s', (won, level) => {
    const state = run(['increase.battle_won'], { party_won_battle: won, threat_level: 5 }).state;
    expect(state.threat_level).toBe(level);
  });
  it.each([
    [true, false, 6],
    [false, true, 6],
    [false, false, 5],
  ])('a door or chest opened (%s) or cobweb cleared (%s) adds 1', (door, cobweb, level) => {
    const state = run(['increase.door_chest_or_cobweb'], {
      door_or_chest_opened: door,
      cobweb_opening_cleared: cobweb,
      threat_level: 5,
    }).state;
    expect(state.threat_level).toBe(level);
  });
  it.each([
    [6, 6],
    [5, 5],
  ])('a Threat roll of %s against Threat 5 leaves %s', (roll, level) => {
    const state = run(['increase.threat_roll_exceeded'], { threat_roll: roll, threat_level: 5 });
    expect(state.state.threat_level).toBe(level);
  });
  it.each([
    [false, 7],
    [true, 6],
  ])('forcing a door or chest adds 2, or 1 with a crowbar: crowbar %s', (crowbar, level) => {
    const state = run(['increase.force_open', 'increase.force_open_crowbar'], {
      force_open_attempted: true,
      using_crowbar: crowbar,
      threat_level: 5,
    }).state;
    expect(state.threat_level).toBe(level);
  });
  it.each([
    [9, true],
    [8, false],
  ])('Threat %s against a quest max of 9 triggers a Wandering Monster: %s', (level, fired) => {
    const state = run(['max_level'], { threat_level: level, quest_max_threat_level: 9 }).state;
    expect(state.wandering_monster_triggered === true).toBe(fired);
  });
  it('binds the dungeon turn step 4 to the battle-won rule', () => {
    const turn = corpus.procedures.find((x) => x.id === 'procedure.dungeon_turn');
    expect(turn?.dependencies?.find((d) => d.key === 'increase_threat')?.object_id).toBe(
      'core.threat.increase.battle_won',
    );
  });
});

describe('Threat tables — rendered PDF91, printed89', () => {
  const table = (id: string) => corpus.tables.find((t) => t.id === id)!;
  const decrease = (id: string, roll: number): number | undefined => {
    const row = table(id).rows.find((r) => {
      const cell = r.cells.roll;
      return cell?.type === 'range' && roll >= cell.min && roll <= cell.max;
    });
    const cell = row?.cells.decrease;
    return cell?.type === 'number' ? cell.value : undefined;
  };
  it('cover 1-20 out of battle and 1-10 in battle with one row per roll', () => {
    for (let roll = 1; roll <= 20; roll++)
      expect(decrease('table.dungeon.threat_not_in_battle', roll)).toBeDefined();
    for (let roll = 1; roll <= 10; roll++)
      expect(decrease('table.dungeon.threat_in_battle', roll)).toBeDefined();
  });
  it('gives the -6 the worked example supplies for a table roll of 16', () => {
    const example = corpus.testCases.find((t) => t.id === 'test.phase6.threat_roll.example')!;
    expect(decrease('table.dungeon.threat_not_in_battle', 16)).toBe(example.inputs.threat_decrease);
  });
  it('prints -3 for both the Healing (4-5) and Frenzy (6) rows the Gameplay Example mixes up', () => {
    expect(decrease('table.dungeon.threat_in_battle', 5)).toBe(-3);
    expect(decrease('table.dungeon.threat_in_battle', 6)).toBe(-3);
  });
});
