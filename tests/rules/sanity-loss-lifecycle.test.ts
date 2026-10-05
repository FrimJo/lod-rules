import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((e) => e.procedure_id === 'procedure.rest')!;
const run = (inputs: State) =>
  runCase({ ...fixture, procedure_id: 'procedure.sanity_loss', inputs }, corpus);
const event: State = {
  sanity: 8,
  sanity_system_enabled: true,
  event_kind: 'terror',
  event_confirmed: true,
  sanity_loss_processed: false,
  sanity_room_handoff_processed: false,
  sanity_condition_pending: false,
  sanity_condition_handoff_processed: false,
};
describe('Hero/event Sanity loss / exact-zero handoff — rendered PDF55 / 21', () => {
  it.each([
    ['terror', 2],
    ['trap', 2],
    ['head_wound', 1],
    ['fear', 1],
    ['demon_battle', 1],
    ['zero_hp', 1],
    ['disease', 1],
    ['poison', 1],
  ] as const)('%s applies source loss %i once with its rule trace', (event_kind, loss) => {
    const first = run({ ...event, event_kind });
    expect(first.state.sanity).toBe(8 - loss);
    expect(first.trace).toEqual(['procedure.sanity_loss', 'character.sanity.loss.' + event_kind]);
    expect(first.state.sanity_loss_processed).toBe(true);
    const replay = run(first.state);
    expect(replay.state.sanity).toBe(8 - loss);
    expect(replay.trace).toEqual(['procedure.sanity_loss']);
  });
  it('miscast defers to the Miscast table instead of the printed -1d3, once', () => {
    // FAQ and changelog 2.21 entry 146: the Miscast table is correct.
    const first = run({ ...event, event_kind: 'miscast' });
    expect(first.state.sanity).toBe(8);
    expect(first.state.sanity_loss_processed).toBe(true);
    expect(first.trace).toEqual(['procedure.sanity_loss', 'character.sanity.loss.miscast']);
    expect(first.events).toContainEqual({ type: 'invoke', dependency: 'core.magic.miscast' });
    expect(run(first.state).trace).toEqual(['procedure.sanity_loss']);
  });
  const rejected: State[] = [
    { sanity_system_enabled: false },
    { event_confirmed: false },
    { event_kind: 'unprinted' },
    { sanity_loss_processed: true },
  ];
  it.each(rejected)('does not charge rejected event %j', (override) => {
    const r = run({ ...event, ...override });
    expect(r.state.sanity).toBe(8);
    expect(r.trace).toEqual(['procedure.sanity_loss']);
    expect(r.events).toEqual([]);
  });
  it('does not reseed a hero to initial 8 Sanity', () => {
    expect(run({ ...event, sanity: 5, event_kind: 'fear' }).state.sanity).toBe(4);
  });
  it('distinct demon battles use distinct markers, repeated checks of one battle do not', () => {
    const first = run({ ...event, event_kind: 'demon_battle' });
    expect(run(first.state).state.sanity).toBe(7);
    expect(run({ ...first.state, sanity_loss_processed: false }).state.sanity).toBe(6);
  });
  it('poison onset is one event; later ongoing checks do not invent another onset', () => {
    const first = run({ ...event, event_kind: 'poison' });
    expect(
      run({ ...first.state, sanity_loss_processed: false, event_confirmed: false }).state.sanity,
    ).toBe(7);
  });
  it('different hero contexts retain separate Sanity', () => {
    const a = run(event);
    const b = run({ ...event, sanity: 4, event_kind: 'fear' });
    expect(a.state.sanity).toBe(6);
    expect(b.state.sanity).toBe(3);
    expect(event.sanity).toBe(8);
  });
  it('exact zero hands off once without adding a condition or resetting Sanity', () => {
    const first = run({ ...event, sanity: 2, current_conditions: 1 });
    expect(first.state).toMatchObject({
      sanity: 0,
      sanity_condition_pending: true,
      sanity_condition_handoff_processed: true,
      current_conditions: 1,
    });
    expect(first.events).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
    expect(run(first.state).state.sanity).toBe(0);
  });
  it('pending diagnosis blocks a different source event until separately resolved', () => {
    const first = run({ ...event, sanity: 2 });
    const r = run({ ...first.state, event_kind: 'fear', sanity_loss_processed: false });
    expect(r.state.sanity).toBe(0);
    expect(r.trace).toEqual(['procedure.sanity_loss']);
    expect(r.events).toEqual([]);
  });
  it('already exact-zero state can request its missing acquisition handoff', () => {
    const r = run({ ...event, sanity: 0, event_confirmed: false });
    expect(r.state.sanity_condition_pending).toBe(true);
    expect(r.events).toHaveLength(1);
    expect(r.state.sanity_loss_processed).toBe(false);
  });
  it('overshoot preserves numerical loss and uncertainty without clamp or diagnosis', () => {
    const r = run({ ...event, sanity: 1 });
    expect(r.state).toMatchObject({
      sanity: -1,
      sanity_loss_processed: true,
      sanity_condition_pending: false,
    });
    expect(r.unresolved).toContain('issue.phase4.sanity_boundaries');
    expect(r.events).toEqual([]);
    expect(run(r.state).state.sanity).toBe(-1);
  });
  it('disabled system does not request a diagnosis even from supplied zero', () => {
    const r = run({ ...event, sanity: 0, sanity_system_enabled: false });
    expect(r.state.sanity_condition_pending).toBe(false);
    expect(r.events).toEqual([]);
  });
  const room: State = { ...event, event_kind: 'room_event', room_loss_amount_supplied: false };
  it('unknown actual room-card loss requests its existing rule once without invented amount', () => {
    const first = run(room);
    expect(first.trace).toEqual(['procedure.sanity_loss', 'character.sanity.loss.room_event']);
    expect(first.events).toHaveLength(1);
    expect(first.state).toMatchObject({
      sanity: 8,
      sanity_loss_processed: false,
      sanity_room_handoff_processed: true,
    });
    expect(run(first.state).events).toEqual([]);
  });
  it('later supplied card amount applies once after its request', () => {
    const first = run(room);
    const r = run({ ...first.state, room_loss_amount_supplied: true, room_sanity_loss: 3 });
    expect(r.state).toMatchObject({ sanity: 5, sanity_loss_processed: true });
    expect(r.events).toEqual([]);
    expect(run(r.state).state.sanity).toBe(5);
  });
  it('supplied zero card loss consumes only its event result', () => {
    expect(
      run({ ...room, room_loss_amount_supplied: true, room_sanity_loss: 0 }).state,
    ).toMatchObject({ sanity: 8, sanity_loss_processed: true });
  });
  it('supplied card loss can produce exact-zero condition handoff', () => {
    const r = run({ ...room, sanity: 3, room_loss_amount_supplied: true, room_sanity_loss: 3 });
    expect(r.state).toMatchObject({ sanity: 0, sanity_condition_pending: true });
    expect(r.events).toHaveLength(1);
  });
  it('condition dependency binds the source-reconciled acquisition procedure', () => {
    const p = corpus.procedures.find((e) => e.id === 'procedure.sanity_loss')!;
    const d = p.dependencies.find((e) => e.key === 'condition_resolution')!;
    expect(d.section_id).toBe('section.psychology.sanity.conditions');
    expect(d.object_id).toBe('procedure.sanity_condition');
  });
});
