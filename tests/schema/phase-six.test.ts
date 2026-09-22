import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { createAjv, getValidator, repoRoot } from '../../scripts/validate/schemas.ts';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity, type PilotContext } from '../../scripts/validate/pilot.ts';
import type { StateMachine, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const pilot = readPilot();
const ajv = createAjv();
const read = (file: string): unknown => parse(readFileSync(join(repoRoot, file), 'utf8'));
const manifest = read('source/manifest.yaml') as {
  documents: PilotContext['documents'];
  external_sources: Array<{ id: string }>;
};
const context: PilotContext = {
  map: {
    sections: read('corpus/source-map/sections.yaml') as PilotContext['map']['sections'],
    pages: read('corpus/source-map/pages.yaml') as PilotContext['map']['pages'],
    coverage: (
      read('corpus/source-map/coverage.yaml') as { sections: PilotContext['map']['coverage'] }
    ).sections,
    externalSourceIds: manifest.external_sources.map((d) => d.id),
  },
  terms: read('corpus/glossary/terms.yaml') as PilotContext['terms'],
  issues: read('review/ambiguities.yaml') as PilotContext['issues'],
  documents: manifest.documents,
  externalIds: manifest.external_sources.map((d) => d.id),
};

const battle = () =>
  structuredClone(pilot.stateMachines.find((m) => m.id === 'state_machine.battle') as StateMachine);

describe('phase 6 state machines', () => {
  it('validates the battle lifecycle against the schema and integrity checks', () => {
    expect(getValidator(ajv, 'stateMachines')(pilot.stateMachines)).toBe(true);
    expect(checkPilotIntegrity(pilot, context)).toEqual([]);
  });

  it('models battle start, activation, and end with documented triggers', () => {
    const machine = battle();
    expect(machine.initial).toBe('not_in_battle');
    expect(machine.states.map((state) => state.id)).toEqual([
      'not_in_battle',
      'battle_setup',
      'battle_active',
      'battle_ended',
    ]);
    const ended = machine.states.find((state) => state.id === 'battle_ended');
    expect(ended?.terminal).toBe(true);
    for (const state of machine.states)
      for (const transition of state.transitions ?? [])
        expect(transition.source_text.length).toBeGreaterThan(0);
  });

  it('rejects a transition into an unknown state', () => {
    const machine = battle();
    machine.states[0]!.transitions![0]!.to = 'nowhere';
    expect(
      checkPilotIntegrity({ ...pilot, stateMachines: [machine] }, context).join('\n'),
    ).toContain('unknown transition target');
  });

  it('rejects a terminal state with outgoing transitions', () => {
    const machine = battle();
    const ended = machine.states.find((state) => state.id === 'battle_ended')!;
    ended.transitions = [
      {
        event: 'enemies_return',
        to: 'battle_active',
        source_text: 'Invented re-entry; not printed.',
      },
    ];
    const errors = checkPilotIntegrity({ ...pilot, stateMachines: [machine] }, context);
    expect(errors.join('\n')).toContain('terminal state has outgoing transitions');
  });

  it('rejects a state unreachable from the initial state', () => {
    const machine = battle();
    machine.states[0]!.transitions = [];
    expect(
      checkPilotIntegrity({ ...pilot, stateMachines: [machine] }, context).join('\n'),
    ).toContain('unreachable');
  });

  it('rejects an invented state machine namespace', () => {
    const machine = battle();
    machine.id = 'sm.battle';
    expect(getValidator(ajv, 'stateMachines')([machine])).toBe(true);
    expect(
      checkPilotIntegrity({ ...pilot, stateMachines: [machine] }, context).join('\n'),
    ).toContain('invalid state machine namespace');
  });
});

describe('phase 6 procedure fixtures', () => {
  const fixtures = parse(
    readFileSync(join(repoRoot, 'tests/examples/dungeon/phase-six.yaml'), 'utf8'),
  ) as TestCase[];

  it('covers every phase 6 procedure with at least one fixture', () => {
    const targets = new Set(fixtures.map((fixture) => fixture.procedure_id));
    expect(targets).toEqual(
      new Set([
        'procedure.scenario_die',
        'procedure.threat_roll',
        'procedure.open_door_or_chest',
        'procedure.rest',
        'procedure.search_room_or_corridor',
        'procedure.search_furniture',
      ]),
    );
  });

  it.each(fixtures.map((fixture) => [fixture.id, fixture] as const))(
    '%s replays exactly as expected',
    (_id, fixture) => {
      const result = runCase(fixture, pilot);
      expect(result.state).toEqual({ ...fixture.inputs, ...fixture.expected.state });
      expect(result.events).toEqual(fixture.expected.events);
      expect(result.trace).toEqual(fixture.expected.trace);
      expect(result.unresolved).toEqual(fixture.expected.unresolved);
      expect(result.steps).toEqual(fixture.expected.steps);
    },
  );

  it('keeps the book example on the printed values', () => {
    const example = fixtures.find((fixture) => fixture.id === 'test.phase6.threat_roll.example')!;
    const result = runCase(example, pilot);
    expect(result.state.threat_level).toBe(3);
    expect(result.steps).toContain('not_in_battle');
  });
});
