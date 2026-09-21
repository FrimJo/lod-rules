import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { runCase, evaluateOperand } from '../support/pilot-interpreter.ts';
import type { Operand } from '../../scripts/validate/pilot-types.ts';

const pilot = readPilot();
describe('canonical pilot examples', () => {
  it.each(pilot.testCases)('$id', (fixture) => {
    const result = runCase(fixture, pilot);
    expect(result.state).toEqual({ ...fixture.inputs, ...fixture.expected.state });
    expect(result.events).toEqual(fixture.expected.events);
    expect(result.trace).toEqual(fixture.expected.trace);
    expect(result.unresolved).toEqual(fixture.expected.unresolved);
    expect(result.steps).toEqual(fixture.expected.steps);
  });
  it('rejects unknown operations rather than silently succeeding', () => {
    expect(() => evaluateOperand({ type: 'invented' } as unknown as Operand, {})).toThrow(
      'Unsupported operand',
    );
  });
});

describe('pilot execution safeguards', () => {
  it.each([0, 1.5, 101])('rejects out-of-domain percentile input %s', (roll) => {
    const fixture = structuredClone(pilot.testCases.find((t) => t.id === 'test.check.equal')!);
    fixture.inputs.roll = roll;
    expect(() => runCase(fixture, pilot)).toThrow('Input out of range roll');
  });
  it('rejects a choice that was not one of the two drawn cards', () => {
    const fixture = structuredClone(
      pilot.testCases.find((t) => t.id === 'test.profession.thief.choose_card')!,
    );
    fixture.inputs.chosen_card = 'not_drawn';
    expect(() => runCase(fixture, pilot)).toThrow('Chosen card was not drawn');
  });
  it('checks Axeman range boundaries without inventing Bloodlust resolution', () => {
    const fixture = pilot.testCases.find((t) => t.id === 'test.talent.axeman_axe')!;
    const event = runCase(fixture, pilot).events[0];
    if (event?.type !== 'replace_range') throw new Error('Missing range effect');
    expect(
      [0, 1, 5, 10, 11].map((roll) => roll >= event.range.min && roll <= event.range.max),
    ).toEqual([false, true, true, true, false]);
  });
  it('preserves separate reward allowances and their unresolved aggregation', () => {
    const rule = pilot.rules.find((r) => r.id === 'core.check.perfect_rewards')!;
    expect(rule.usage_limits).toEqual([
      {
        count: 1,
        window: 'between_settlement_visits',
        subject: 'skill_increase',
        aggregation_issue: 'issue.0010',
      },
      {
        count: 1,
        window: 'between_settlement_visits',
        subject: 'basic_stat_increase',
        aggregation_issue: 'issue.0010',
      },
    ]);
  });
  it('marks the XP award as applying equally to all heroes', () => {
    expect(pilot.rules.find((r) => r.id === 'character.level.experience')?.applies_to).toBe(
      'all_heroes',
    );
  });
});
