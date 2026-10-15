import { describe, expect, it } from 'vitest';
import { createAjv, getValidator } from '../../scripts/validate/schemas.ts';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity } from '../../scripts/validate/pilot.ts';
import type {
  StateMachine,
  StateMachineTransition,
  Table,
} from '../../scripts/validate/pilot-types.ts';
import { phaseFourContext } from '../support/phase-four-context.ts';

const pilot = readPilot();
const ajv = createAjv();
const context = phaseFourContext();

const questDungeon = (): StateMachine =>
  structuredClone(
    pilot.stateMachines.find((m) => m.id === 'state_machine.quest_dungeon') as StateMachine,
  );
const transitions = (machine: StateMachine): StateMachineTransition[] =>
  machine.states.flatMap((state) => state.transitions ?? []);
const guarded = (machine: StateMachine): StateMachineTransition =>
  transitions(machine).find((t) => t.when) as StateMachineTransition;
const withIssues = (machine: StateMachine): StateMachineTransition =>
  transitions(machine).find((t) => t.issues) as StateMachineTransition;
const errorsFor = (machine: StateMachine): string =>
  checkPilotIntegrity(
    {
      ...pilot,
      stateMachines: pilot.stateMachines.map((m) => (m.id === machine.id ? machine : m)),
    },
    context,
  ).join('\n');

describe('state machine transition guards', () => {
  it('accepts typed fields, transition guards and transition issues', () => {
    const machine = questDungeon();
    expect(machine.fields).toBeDefined();
    expect(guarded(machine)).toBeDefined();
    expect(withIssues(machine)).toBeDefined();
    expect(getValidator(ajv, 'stateMachines')([machine])).toBe(true);
    expect(errorsFor(machine)).toBe('');
  });

  it('rejects a guard that reads a field the machine does not declare', () => {
    const machine = questDungeon();
    guarded(machine).when = {
      type: 'compare',
      operator: 'eq',
      left: { type: 'field', name: 'invented_field' },
      right: { type: 'literal', value: true },
    };
    expect(errorsFor(machine)).toContain('undeclared field invented_field');
  });

  it('rejects a guard when the machine declares no fields', () => {
    const machine = questDungeon();
    delete machine.fields;
    expect(errorsFor(machine)).toContain('undeclared field');
  });

  it('rejects a transition issue that does not exist', () => {
    const machine = questDungeon();
    withIssues(machine).issues = ['issue.invented.transition'];
    expect(errorsFor(machine)).toContain('unknown reference issue.invented.transition');
  });

  it('rejects a transition issue that is already resolved', () => {
    const resolved = context.issues.find((issue) => issue.status === 'resolved');
    expect(resolved).toBeDefined();
    const machine = questDungeon();
    withIssues(machine).issues = [resolved!.id];
    expect(errorsFor(machine)).toContain('executable unresolved reference requires an open issue');
  });

  it('rejects an empty transition issue list in the schema', () => {
    const machine = questDungeon();
    withIssues(machine).issues = [];
    expect(getValidator(ajv, 'stateMachines')([machine])).toBe(false);
  });
});

describe('printed range cells', () => {
  const bounty = (): Table =>
    structuredClone(pilot.tables.find((t) => t.id === 'table.guild.fighters_bounty') as Table);
  const hundredCell = (table: Table) =>
    table.rows
      .flatMap((row) => Object.values(row.cells))
      .find((cell) => cell.type === 'range' && cell.min === 100 && cell.max === 100);
  const errorsFor = (table: Table): string =>
    checkPilotIntegrity(
      { ...pilot, tables: pilot.tables.map((t) => (t.id === table.id ? table : t)) },
      context,
    ).join('\n');

  it('accepts "00" as the printed form of a 100 range', () => {
    const table = bounty();
    expect(hundredCell(table)?.printed).toBe('00');
    expect(errorsFor(table)).not.toContain('invalid printed range');
  });

  it('rejects a printed form that does not match the range', () => {
    const table = bounty();
    const cell = hundredCell(table)!;
    cell.printed = '01';
    expect(errorsFor(table)).toContain('table.guild.fighters_bounty');
    expect(errorsFor(table)).toContain('invalid printed range');
  });
});
