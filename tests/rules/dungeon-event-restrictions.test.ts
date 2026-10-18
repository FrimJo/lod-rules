import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const pilot = readPilot();
const run = (ids: string[], inputs: State) =>
  runCase({ rule_ids: ids, inputs } as TestCase, pilot).state;
const refs = (tableId: string, rowId: string) =>
  pilot.tables.find((t) => t.id === tableId)!.rows.find((r) => r.id === rowId)!.rule_refs;
const rule = (id: string) => pilot.rules.find((r) => r.id === id)!;

// Row-local restrictions printed inside table text cells (PDF 104 row 19, PDF 91 row 7).
describe('Red Levers 19: the floor gives way (PDF 104)', () => {
  const ids = [
    'core.lever.red.floor_gives_way.test_passed',
    'core.lever.red.floor_gives_way.test_failed',
    'core.lever.red.floor_gives_way.climb_out_with_rope',
    'core.lever.red.floor_gives_way.climb_out_without_rope',
  ];
  it('links every row-scoped rule from the row', () => {
    expect(refs('table.dungeon.red_levers', 'floor_gives_way')).toEqual(ids);
    expect(rule(ids[1]!).fields.damage_roll?.dice).toEqual({ count: 1, sides: 10 });
  });
  it('a passed DEX Test places a pit token and still lowers PM by 1', () => {
    expect(run(ids.slice(0, 2), { dex_test_passed: true, damage_roll: 7 })).toMatchObject({
      fell_into_pit: false,
      pit_token_placed: true,
      party_morale_change: -1,
    });
  });
  it('a failed DEX Test drops the hero in for 1d10 without armour but with NA, PM -1, Sanity -2', () => {
    expect(run(ids.slice(0, 2), { dex_test_passed: false, damage_roll: 7 })).toMatchObject({
      fell_into_pit: true,
      damage: 7,
      armour_applies: false,
      natural_armour_applies: true,
      party_morale_change: -1,
      sanity_change: -2,
    });
  });
  it.each([true, false])('climbing out with rope=%s costs the printed 1 AP', (rope) => {
    expect(run(ids.slice(2), { rope_used: rope })).toEqual({
      rope_used: rope,
      ap_cost: 1,
      dex_test_required: !rope,
    });
  });
  it('records the conflict with Climbing Pits instead of choosing', () => {
    for (const id of ids.slice(2))
      expect(rule(id).issues).toContain('issue.lever.floor_gives_way_pit_exit');
  });
});

describe('Threat in battle 7: Disarmed! (PDF 91)', () => {
  const ids = [
    'core.threat.in_battle.disarmed.retrieve_weapon',
    'core.threat.in_battle.disarmed.retry',
  ];
  it('links both rules from the row', () => {
    expect(refs('table.dungeon.threat_in_battle', 'disarmed')).toEqual(ids);
  });
  it.each([true, false])('the first try is a DEX Test spending 1 Action (passed=%s)', (passed) => {
    expect(run(ids, { retry: false, dex_test_passed: passed })).toMatchObject({
      dex_test_required: true,
      actions_spent: 1,
      weapon_retrieved: passed,
    });
  });
  it('each further try spends one AP', () => {
    const state = run(ids, { retry: true, dex_test_passed: true });
    expect(state.ap_spent).toBe(1);
    expect(state.actions_spent).toBeUndefined();
  });
  it('keeps the logged open questions on the rules', () => {
    expect(rule(ids[0]!).issues).toEqual([
      'issue.threat.changelog_disarmed_cannot_fight',
      'issue.threat.disarmed_retry',
    ]);
    expect(rule(ids[1]!).issues).toEqual(['issue.threat.disarmed_retry']);
  });
});
