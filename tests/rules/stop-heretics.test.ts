import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.stop_heretics.${suffix}`], inputs } as TestCase, corpus);
describe('Stop the Heretics — PDF244–245', () => {
  it('retains random location and six rooms/corridors', () => {
    expect(run('setup').state).toMatchObject({
      location: 'Random',
      corridors: 6,
      rooms: 6,
      reward_per_hero: 250,
    });
  });
  it('retains random initial Threat with linked minimum, rather than treating each as an independent roll', () => {
    const t = corpus.tables.find((x) => x.id === 'table.quest.stop_heretics.threat');
    expect(t?.rows[0]?.cells.start).toMatchObject({
      type: 'dice',
      printed: '1d4',
      dice: { count: 1, sides: 4 },
    });
    expect(t?.rows[0]?.cells.min).toEqual({ type: 'text', printed: 'Same as start lvl' });
    expect(t?.rows[0]?.cells.max?.printed).toBe('18');
  });
  it('transcribes all six encounter-family rows and three Demon outcomes', () => {
    const e = corpus.tables.find((x) => x.id === 'table.quest.stop_heretics.encounters');
    expect(e?.rows.map((x) => [x.cells.roll?.printed, x.cells.dwellers?.printed])).toEqual(
      ['Bandits and Brigands', 'Orcs and Goblins', 'Undead', 'Beast', 'Dark Elves', 'Reptiles'].map(
        (name, i) => [String(i + 1), name],
      ),
    );
    const d = corpus.tables.find((x) => x.id === 'table.quest.stop_heretics.demons');
    expect(d?.rows.map((x) => [x.cells.roll?.printed, x.cells.demon?.printed])).toEqual([
      ['1-2', '1d6 Lesser Plague Demons'],
      ['3-5', '1d6 Blood Demons (Battleaxes, Armour 1)'],
      ['6', '1 Greater Demon (Greataxe, Armour 2)'],
    ]);
  });
  it('preserves guard side, far-end altar and entire-list Magic User selection', () => {
    expect(run('objective_setup').state).toEqual({
      hero_entry: 'short side opposite the altar',
      guard_encounter_rolls: 2,
      guards_side: 'heroes’ side of river',
      guard_placement: 'as close to the lava river as possible',
      caster_side: 'other side of river',
      caster_position: 'by the altar on the dais at the far end',
      caster_kind: 'Magic User from encountered race',
      caster_selection: 'randomise among those available on the entire encounter list',
    });
  });
  it('does not end caster preoccupation merely because he is attacked', () => {
    expect(run('caster_occupied').state).toEqual({
      caster_notices_battle: false,
      being_attacked_does_not_end_ritual_preoccupation: true,
    });
    expect(run('deadline').state.turn_limit).toBe(10);
  });
  it.each([true, false])(
    'requires successful ritual for collapse and river Demon placements: %s',
    (success) => {
      const state = run('ritual_completed', { ritual_succeeded: success }).state;
      expect(state.caster_collapses === true).toBe(success);
      if (success)
        expect(state).toMatchObject({
          caster_out_of_battle: true,
          demon_table_roll_required: true,
          demon_placement: 'random squares along the river',
        });
    },
  );
  it.each([true, false])(
    'requires all Objective Room creatures defeated for the immediate exit: %s',
    (defeated) => {
      expect(
        run('exit', { all_objective_creatures_defeated: defeated }).state.may_leave_immediately ===
          true,
      ).toBe(defeated);
    },
  );
  it.each([
    [true, true, 250],
    [true, false, 125],
    [false, true, undefined],
    [false, false, undefined],
  ])(
    'gates full or half reward: defeated%s / portal prevented%s',
    (defeated, prevented, reward) => {
      const inputs: State = {
        all_objective_creatures_defeated: defeated,
        caster_killed_before_portal: prevented,
      };
      const state = runCase(
        {
          rule_ids: [
            'core.quest.stop_heretics.full_reward',
            'core.quest.stop_heretics.half_reward',
          ],
          inputs,
        } as TestCase,
        corpus,
      ).state;
      expect(state.reward_per_hero).toBe(reward);
      if (defeated) expect(state.portal_open).toBe(!prevented);
      expect(state).not.toHaveProperty('coins');
    },
  );
  it.each([
    [9, 10, true],
    [11, 10, false],
    [10, 10, false],
  ])('triggers only upward to Threat10: %s -> %s', (previous, current, triggered) => {
    expect(
      run('threshold', { previous_threat: previous, current_threat: current }).state
        .wandering_monster_triggered === true,
    ).toBe(triggered);
  });
});
