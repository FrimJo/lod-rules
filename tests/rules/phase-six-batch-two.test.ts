import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const pilot = readPilot();
// Independently specified boundaries from PDF 92 (printed 90) and PDF 101 (printed 99).
// Invocation records a handoff: composed cases explicitly supply the returned facts.
function run(id: string, inputs: State) {
  const procedure = pilot.procedures.find((p) => p.id === id)!;
  return runCase(
    {
      procedure_id: id,
      inputs:
        id === 'procedure.open_door_or_chest'
          ? { adjacent: true, initial_entrance: false, ...inputs }
          : inputs,
      source: procedure.source,
    } as TestCase,
    pilot,
  );
}
const wander: State = {
  new_token: false,
  heroes_finished: true,
  direction_roll: 2,
  route: 'toward',
  distance: 11,
  heroes_in_los: true,
  entered_room: true,
  closed_door_blocks_los: false,
  door_state: 'open',
  door_roll: 2,
  door_held_previous_turn: false,
  waiting_at_door: false,
  chasm: false,
  cross_chasm: false,
  chasm_held_previous_turn: false,
  crossed_chasm: false,
  cross_back_requested: false,
};
const trap: State = {
  initial_check: true,
  perception_succeeded: true,
  disarm_attempted: false,
  disarm_succeeded: false,
  deliberate_trigger: false,
  trap_detected: false,
  trap_removed: false,
  trap_triggered: false,
  is_mimic: false,
  hero_attacked_mimic: false,
  actor_is_lower_undead: false,
  door_or_chest: false,
  actor_is_enemy: false,
  forced_entry: false,
  enters_trapped_square: false,
  card_data_supplied: false,
  card_effects_resolved: false,
};
const wm = (changes: State = {}) => run('procedure.wandering_monster', { ...wander, ...changes });
const tr = (changes: State = {}) => run('procedure.trap_resolution', { ...trap, ...changes });
describe('wandering monsters: PDF 92', () => {
  it.each([1, 2, 6])('selects direction on %i', (roll) =>
    expect(wm({ direction_roll: roll }).state.direction).toBe(roll === 1 ? 'away' : 'toward'),
  );
  it('places a new token before the heroes finish but does not move it', () => {
    const r = wm({ new_token: true, heroes_finished: false });
    expect(r.state.placement).toBe('start_tile_outside_door');
    expect(r.state.movement_squares).toBeUndefined();
    expect(r.steps).toEqual(['placement']);
  });
  it.each(['closed', 'iron_wedged', 'magically_sealed'])(
    'stops at %s on first contact even with a six',
    (door) => {
      const r = wm({ door_state: door, door_roll: 6 });
      expect(r.state.waiting_at_door).toBe(true);
      expect(r.state.movement_stops).toBe(true);
      expect(r.state.door_state).toBe(door);
    },
  );
  it.each([
    ['closed', 1, false],
    ['closed', 2, true],
    ['closed', 6, true],
    ['iron_wedged', 4, false],
    ['iron_wedged', 5, true],
    ['magically_sealed', 4, false],
    ['magically_sealed', 5, true],
  ] as const)('passes %s on %i: %s', (door, roll, passes) => {
    const r = wm({
      door_state: door,
      door_roll: roll,
      door_held_previous_turn: true,
      waiting_at_door: true,
    });
    expect(r.state.movement_stops).toBe(!passes);
    expect(r.state.waiting_at_door).toBe(!passes);
    expect(r.state.door_state).toBe(passes ? 'open' : door);
    expect(r.steps).not.toContain('choose_direction');
  });
  it('stays blocked over repeated turns and breaks a seal on passage', () => {
    const a = wm({ door_state: 'magically_sealed' });
    const b = wm({ ...a.state, door_held_previous_turn: true, door_roll: 4 });
    const c = wm({ ...b.state, door_roll: 6 });
    expect(b.state.waiting_at_door).toBe(true);
    expect(c.state.seal_broken).toBe(true);
    expect(c.state.waiting_at_door).toBe(false);
  });
  it('stops on arrival, crosses next turn, resumes the following turn and never crosses back', () => {
    const a = wm({ chasm: true });
    const b = wm({ ...a.state, chasm_held_previous_turn: true, cross_chasm: true });
    const c = wm({ ...b.state, chasm: false, cross_chasm: false });
    const d = wm({ ...c.state, cross_back_requested: true });
    expect(a.state.movement_stops).toBe(true);
    expect(b.state.crossed_chasm).toBe(true);
    expect(b.state.movement_stops).toBe(true);
    expect(c.state.movement_stops).toBe(false);
    expect(d.events).toContainEqual({ type: 'require', satisfied: false });
  });
  it.each([
    [10, true, true, false, true],
    [11, true, true, false, false],
    [10, false, true, false, false],
    [10, true, false, false, false],
    [10, true, true, true, false],
  ] as const)('reveal boundary %j %j %j %j', (distance, los, entered, blocked, reveals) => {
    const r = wm({
      distance,
      heroes_in_los: los,
      entered_room: entered,
      closed_door_blocks_los: blocked,
    });
    expect(r.state.reveal_monsters).toBe(reveals);
    expect(r.events.length).toBe(reveals ? 2 : 0);
  });
});
describe('traps: PDF 92 and 101', () => {
  it('selects the random victim or opener and keeps detected traps', () => {
    expect(tr().state).toMatchObject({
      victim_selection: 'random_hero',
      trap_detected: true,
      trap_removed: false,
    });
    expect(tr({ door_or_chest: true }).state).toMatchObject({
      victim_selection: 'opener',
      opening_eligible: false,
    });
  });
  it('failed detection triggers the trap and records missing card data', () => {
    const r = tr({ perception_succeeded: false, door_or_chest: true });
    expect(r.state).toMatchObject({ trap_triggered: true, opening_eligible: true });
    expect(r.unresolved).toEqual(['issue.phase6.trap_resolution_deferred']);
  });
  it.each([true, false])('disarms for 2 AP, success %s', (success) => {
    const r = tr({
      initial_check: false,
      trap_detected: true,
      disarm_attempted: true,
      disarm_succeeded: success,
      door_or_chest: true,
    });
    expect(r.state).toMatchObject({
      action_points_spent: 2,
      trap_removed: success,
      trap_triggered: !success,
      opening_eligible: true,
    });
    expect(r.steps).not.toContain('draw_card');
  });
  it('deliberately triggers door/chest traps for 2 AP but not a general square trap', () => {
    expect(
      tr({
        initial_check: false,
        trap_detected: true,
        door_or_chest: true,
        deliberate_trigger: true,
      }).state,
    ).toMatchObject({ action_points_spent: 2, trap_triggered: true, opening_eligible: true });
    expect(
      tr({ initial_check: false, trap_detected: true, deliberate_trigger: true }).state
        .trap_triggered,
    ).toBe(false);
  });
  it.each([false, true])('detected Mimic attack permission after hero attack: %s', (attacked) => {
    const r = tr({
      initial_check: false,
      trap_detected: true,
      is_mimic: true,
      hero_attacked_mimic: attacked,
      disarm_attempted: true,
    });
    expect(r.state.mimic_can_attack).toBe(attacked);
    expect(r.steps).not.toContain('disarm');
  });
  it.each([
    [true, false, false, false],
    [true, true, false, true],
    [true, false, true, true],
    [false, false, true, true],
  ] as const)('actor enemy %s lower undead %s forced %s', (enemy, lower, forced, triggers) => {
    expect(
      tr({
        initial_check: false,
        trap_detected: true,
        actor_is_enemy: enemy,
        actor_is_lower_undead: lower,
        forced_entry: forced,
        enters_trapped_square: true,
      }).state.trap_triggered,
    ).toBe(triggers);
  });
  it.each([false, true])('uses supplied targets and saving throw exception %s', (save) => {
    const r = tr({
      perception_succeeded: false,
      card_data_supplied: true,
      card_allows_save: save,
      affected_actors: 'opener and adjacent enemy',
    });
    expect(r.unresolved).toEqual([]);
    expect(r.state.resolved_affected_actors).toBe('opener and adjacent enemy');
    expect(r.state.saving_throw_allowed).toBe(save);
  });
  it('composes supplied trap and lock outcomes, with no encounter for a chest', () => {
    const resolved = tr({
      initial_check: false,
      trap_detected: true,
      door_or_chest: true,
      disarm_attempted: true,
      disarm_succeeded: true,
    });
    for (const locked of [true, false])
      for (const is_chest of [true, false]) {
        const r = run('procedure.open_door_or_chest', {
          threat_level: 3,
          d6_roll: 6,
          locked,
          is_chest,
          trap_prevents_opening: !resolved.state.opening_eligible,
        });
        expect(
          r.events.some((e) => e.type === 'invoke' && e.dependency === 'procedure.encounters'),
        ).toBe(!locked && !is_chest);
        expect(r.steps.includes('chest_reveal')).toBe(!locked && is_chest);
      }
  });
  it('never reveals with a surviving detected trap', () => {
    const r = run('procedure.open_door_or_chest', {
      threat_level: 3,
      d6_roll: 6,
      locked: false,
      is_chest: false,
      trap_prevents_opening: true,
    });
    expect(r.steps).not.toContain('door_reveal');
    expect(r.steps).not.toContain('enemies');
  });
});

describe('Door Table and opening boundaries: PDF 101', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])('preserves Door Table result %i', (roll) => {
    const table = pilot.tables.find((t) => t.id === 'table.dungeon.door_chest_difficulty')!;
    const rows = table.rows.filter((row) => {
      const cell = row.cells.result!;
      return cell.type === 'number'
        ? cell.value === roll
        : cell.type === 'range' && cell.min <= roll && roll <= cell.max;
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.cells.door_chest!.printed).toBe(roll <= 6 ? 'Open' : 'Locked');
    expect(rows[0]!.cells.difficulty!.printed).toBe(
      roll <= 6
        ? '-'
        : (
            {
              7: 'Pick lock: 0, HP 10',
              8: 'Pick lock: -10, HP 15',
              9: 'Pick lock: -15, HP 20',
              10: 'Pick lock: -20, HP 25',
            } as Record<number, string>
          )[roll],
    );
    if (roll === 10) expect(rows[0]!.cells.result!.printed).toBe('0');
  });
  it('guards every consequential opening branch when the model is not adjacent', () => {
    const r = run('procedure.open_door_or_chest', {
      adjacent: false,
      threat_level: 5,
      d6_roll: 6,
      locked: false,
      is_chest: false,
      trap_prevents_opening: false,
    });
    expect(r.state.threat_level).toBe(5);
    expect(r.state.action_points_spent).toBeUndefined();
    expect(r.steps).toEqual(['spend']);
    expect(r.events).toEqual([{ type: 'require', satisfied: false }]);
  });
  it('uses a supplied successful lock resolution without recursively invoking it', () => {
    const lock = run('procedure.locked_door_and_close', {
      approach: 'pick',
      is_locked: true,
      is_open: false,
      door_hp: 15,
      pick_succeeded: true,
      pick_fumbled: false,
      lock_jammed: false,
    });
    const opened = run('procedure.open_door_or_chest', {
      threat_level: 5,
      d6_roll: 1,
      locked: lock.state.is_locked!,
      is_chest: false,
      trap_prevents_opening: false,
    });
    expect(lock.state.action_points_spent).toBe(2);
    expect(opened.state.action_points_spent).toBe(1);
    expect(opened.steps).toContain('door_reveal');
    expect(opened.trace).toEqual(['procedure.open_door_or_chest']);
  });
  it('does not close a chest', () => {
    const r = run('procedure.locked_door_and_close', {
      approach: 'close',
      is_chest: true,
      is_open: true,
      is_locked: false,
      door_hp: 10,
    });
    expect(r.state.is_open).toBe(true);
    expect(r.state.action_points_spent).toBeUndefined();
  });
  it('an undetected Mimic can attack', () =>
    expect(tr({ initial_check: false, is_mimic: true }).state.mimic_can_attack).toBe(true));
});

it('a trap persists until handled, then does not apply its card again (PDF 92)', () => {
  const detected = tr({ initial_check: false, trap_detected: true });
  expect(detected.state.trap_removed).toBe(false);
  expect(detected.state.trap_triggered).toBe(false);
  const triggered = tr({
    ...detected.state,
    enters_trapped_square: true,
    card_data_supplied: true,
    card_allows_save: false,
    affected_actors: 'entrant',
  });
  expect(triggered.state.card_effects_resolved).toBe(true);
  const later = tr({ ...triggered.state });
  expect(later.steps).not.toContain('square_entry');
  expect(later.steps).not.toContain('card_consequences');
});
