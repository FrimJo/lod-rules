import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffixes: string[], inputs: State = {}) =>
  runCase(
    { rule_ids: suffixes.map((s) => `core.quest.apprentice.${s}`), inputs } as TestCase,
    corpus,
  );
const single = (suffix: string, inputs: State = {}) => run([suffix], inputs);

describe('The Apprentice — rendered PDF 232–233', () => {
  it('preserves location, six corridor/room counts, Undead and Chamber of Reverence', () => {
    expect(single('setup').state).toMatchObject({
      location: 'White 22',
      corridors: 6,
      rooms: 6,
      encounters: 'Undead',
      objective_room: 'The Chamber of Reverence',
    });
  });
  it.each([
    [9, 10, true],
    [11, 10, false],
    [9, 11, false],
  ])('retains directional Threat10: %s → %s', (before, after, triggered) => {
    expect(
      single('threshold', { previous_threat: before, current_threat: after }).trace.length > 0,
    ).toBe(triggered);
  });
  it.each([14, 15, 20, 21])(
    'adds rather than replaces ordinary encounters on 15–20: %s',
    (roll) => {
      const result = single('caretaker_encounter', { encounter_roll: roll });
      const qualifies = roll >= 15 && roll <= 20;
      expect(result.trace.length > 0).toBe(qualifies);
      if (qualifies)
        expect(result.state).toMatchObject({
          caretaker_added: true,
          ordinary_encounter_retained: true,
        });
    },
  );
  it('does not borrow Johann’s once-only rule for Emil', () => {
    const rule = corpus.rules.find((x) => x.id === 'core.quest.apprentice.caretaker_encounter')!;
    expect(rule.issues).toContain('issue.quest.apprentice_caretaker_repeat');
    expect(rule.fields).not.toHaveProperty('johann_encountered');
  });
  it('preserves shovel as Greataxe in all aspects, Armour0, XP110 and T2', () => {
    expect(single('emil_equipment').state).toEqual({
      weapon: 'sharpened shovel',
      counts_as: 'Greataxe in all aspects',
      armour: 0,
      xp: 110,
      treasure_table: 'T2',
    });
  });
  it.each([true, false])('requires Emil dead before finding his bronze key: %s', (dead) => {
    const result = single('bronze_key', { emil_killed: dead });
    expect(result.trace.length > 0).toBe(dead);
    if (dead)
      expect(result.state).toMatchObject({
        bronze_key_found: true,
        bronze_key_location: 'around Emil’s neck',
      });
  });
  it('distinguishes adjacent Armour0 Zombie from unarmed wall Zombies and retains relative geometry', () => {
    expect(single('objective_setup').state).toEqual({
      imgrahil_placement: 'centre of the chalk circle',
      adjacent_zombies: 1,
      adjacent_zombie_placement: 'next to Imgrahil',
      adjacent_zombie_unarmed: true,
      adjacent_zombie_armour: 0,
      wall_zombies_unarmed: true,
      wall_zombie_placement:
        'along the long walls, starting as far away as possible from the heroes, divided evenly between the walls',
    });
  });
  it.each([2, 7, 12])(
    'uses the supplied 2d6 wall Zombie count without invented splitting: %s',
    (count) => {
      expect(single('wall_zombies', { zombie_roll: count }).state.wall_zombies).toBe(count);
    },
  );
  it.each([1, 13])('rejects invalid 2d6 totals %s', (count) => {
    expect(() => single('wall_zombies', { zombie_roll: count })).toThrow();
  });
  it('retains Imgrahil’s spell mastery, poison pointer and T2 dependency', () => {
    expect(single('imgrahil').state).toMatchObject({
      weapon: 'poisoned dagger',
      armour: 1,
      raise_dead_mastered: true,
      healing_mastered: true,
      vampiric_touch_mastered: true,
      mirrored_self_mastered: true,
      dagger_hit_may_poison: true,
      xp: 200,
      treasure_table: 'T2',
    });
    expect(
      corpus.rules
        .find((x) => x.id === 'core.quest.apprentice.imgrahil')
        ?.dependencies?.map((x) => x.object_id),
    ).toEqual([
      'spell.raise_dead',
      'spell.healing',
      'spell.vampiric_touch',
      'spell.mirrored_self',
      'procedure.damage_follow_up',
      'table.treasure.t2',
    ]);
  });
  it('retains advertised 200c per hero', () => {
    expect(single('reward').state.reward_per_hero).toBe(200);
  });
  it.each([
    [false, true, false],
    [true, false, false],
    [true, true, true],
  ])('requires all Zombies down and Imgrahil dead: %s/%s', (zombies, dead, ready) => {
    const result = single('aftermath', { all_zombies_down: zombies, imgrahil_dead: dead });
    expect(result.trace.length > 0).toBe(ready);
    if (ready)
      expect(result.state).toMatchObject({
        notebook_found: true,
        map_with_marked_locations_found: true,
        return_to_silver_city_allowed: false,
        press_on: true,
      });
  });
  it.each([
    ['Apostle', '6A'],
    ['Master', '6B'],
  ])('preserves branch %s → %s', (choice, quest) => {
    const result = run(['choose_apostle', 'choose_master'], {
      all_zombies_down: true,
      imgrahil_dead: true,
      aftermath_choice: choice!,
    });
    expect(result.state.next_quest).toBe(quest);
    expect(result.trace).toHaveLength(1);
    expect(
      run(['choose_apostle', 'choose_master'], {
        all_zombies_down: true,
        imgrahil_dead: false,
        aftermath_choice: choice!,
      }).trace,
    ).toEqual([]);
  });
  it.each([
    ['emil', [45, '-', 0, 1, 30, -10, 40, 4, 14]],
    ['imgrahil', [55, 55, 0, 0, 30, -10, 50, 4, 13]],
  ] as const)('preserves every printed stat cell for %s', (name, values) => {
    const table = corpus.tables.find((x) => x.id === `table.quest.apprentice.${name}`)!;
    expect(table.columns.map((x) => x.label)).toEqual([
      'CS',
      'RS',
      'DMG',
      'NA',
      'DEX',
      'To hit',
      'RES',
      'M',
      'HP',
    ]);
    expect(table.columns.map((x) => table.rows[0]?.cells[x.id]?.printed)).toEqual(
      values.map(String),
    );
    for (const [i, column] of table.columns.entries()) {
      const cell = table.rows[0]?.cells[column.id];
      if (values[i] === '-')
        expect(cell).toMatchObject({ type: 'marker', meaning: 'not_specified' });
      else expect(cell).toMatchObject({ type: 'number', value: values[i], meaning: 'value' });
    }
  });
});
