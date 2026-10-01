import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.master_alchemist.${suffix}`], inputs } as TestCase, corpus);
describe('The Master Alchemist — rendered PDF246', () => {
  it('retains magical vial properties and seven rooms/corridors', () => {
    expect(run('setup').state).toMatchObject({
      location: 'Random',
      rooms: 7,
      corridors: 7,
      reward_per_hero: 300,
      vial_prevents_lava_cooling: true,
      vial_cool_to_touch: true,
      vial_carried_in_backpack: true,
    });
  });
  it('retains opposite banks for the two rolls', () => {
    expect(run('objective_setup').state).toEqual({
      encounter_rolls: 2,
      first_encounter_side: 'same side of river as heroes',
      second_encounter_side: 'far side of river',
      hero_entry: 'short side',
    });
  });
  it.each([
    [true, true],
    [false, true],
    [true, false],
  ])('requires vial carrying and adjacency for two actions: %s / %s', (carries, next) => {
    const state = run('filling_attempt', {
      hero_carries_vial: carries,
      hero_next_to_river: next,
    }).state;
    expect(state.filling_cost_actions === 2).toBe(carries && next);
    expect(state).not.toHaveProperty('filling_cost_ap');
  });
  it.each([
    [50, 'filled', true],
    [51, 'filled', false],
    [50, 'burned', true],
    [70, 'burned', true],
    [71, 'burned', false],
    [70, 'dropped', false],
    [71, 'dropped', true],
  ])('preserves literal bounds with supplied selection: %s / %s', (roll, result, allowed) => {
    const state = run(result, {
      valid_filling_attempt_completed: true,
      selected_vial_result: result,
      dex: 50,
      dex_roll: roll,
    }).state;
    const key =
      result === 'filled'
        ? 'vial_filled'
        : result === 'burned'
          ? 'vial_state_after_burn_unspecified'
          : 'vial_dropped';
    expect(state[key] === true).toBe(allowed);
    if (result === 'burned' && allowed) {
      expect(state.fire_damage_dice).toBe('1d4');
      expect(state).not.toHaveProperty('vial_filled');
      expect(state).not.toHaveProperty('retry_allowed');
    }
  });
  it.each([true, false])(
    'requires all creatures defeated for immediate alternative exit: %s',
    (defeated) => {
      expect(
        run('exit', { all_objective_creatures_defeated: defeated }).state.may_leave_immediately ===
          true,
      ).toBe(defeated);
    },
  );
  it.each([true, false])('requires returned lava for payment: %s', (returned) => {
    const state = run('reward', { heroes_returned_with_lava: returned }).state;
    expect(state.reward_per_hero === 300).toBe(returned);
    expect(state).not.toHaveProperty('coins');
  });
  it.each(['filled', 'burned', 'dropped'])(
    'rejects result without the source filling attempt: %s',
    (result) => {
      const state = run(result, {
        valid_filling_attempt_completed: false,
        selected_vial_result: result,
        dex: 50,
        dex_roll: result === 'dropped' ? 71 : 50,
      }).state;
      expect(state).not.toHaveProperty('vial_filled');
      expect(state).not.toHaveProperty('fire_damage_dice');
      expect(state).not.toHaveProperty('vial_dropped');
    },
  );
  it('gives no reward for a dropped vial', () => {
    expect(run('failure', { vial_dropped_into_river: true }).state).toMatchObject({
      reward_per_hero: 0,
      alchemist_scolding: true,
    });
  });
  it('retains all table cells including overlapping bounds, not a silently added lower bound', () => {
    const threat = corpus.tables.find((x) => x.id === 'table.quest.master_alchemist.threat');
    expect(['start', 'min', 'max'].map((x) => threat?.rows[0]?.cells[x]?.printed)).toEqual([
      '5',
      '3',
      '18',
    ]);
    const e = corpus.tables.find((x) => x.id === 'table.quest.master_alchemist.encounters');
    expect(e?.rows.map((x) => [x.cells.roll?.printed, x.cells.dwellers?.printed])).toEqual(
      ['Bandits and Brigands', 'Orcs and Goblins', 'Undead', 'Beast', 'Dark Elves', 'Reptiles'].map(
        (name, i) => [String(i + 1), name],
      ),
    );
    const t = corpus.tables.find((x) => x.id === 'table.quest.master_alchemist.filling');
    expect(t?.rows.map((x) => [x.cells.roll?.printed, x.cells.result?.printed])).toEqual([
      [
        'Less or equal to DEX',
        'After a minute of struggle, the vial is finally filled with its cork back in place.',
      ],
      [
        'Less or equal to DEX+20',
        'In the struggle to dip the vial into the river, the hero reaches too far and burns his hand for 1d4 points of Fire Damage.',
      ],
      [
        'Above DEX+20',
        'The searing heat is too much to handle and the hero drops the vial which sinks into the lava with a hissing sound.',
      ],
    ]);
  });
});
