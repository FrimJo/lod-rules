import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (ids: string[], inputs: State = {}) =>
  runCase({ rule_ids: ids, inputs } as TestCase, corpus);
const sacrifice = (suffix: string, inputs: State = {}) =>
  run([`core.quest.sacrifice.${suffix}`], inputs);
const master = (suffix: string, inputs: State = {}) => run([`core.quest.master.${suffix}`], inputs);

describe('Sacrifice — rendered PDF 234', () => {
  it('preserves White36, tile exclusions and dash reward without interpreting it as zero', () => {
    expect(sacrifice('setup').state).toMatchObject({
      location: 'White 36',
      corridors: 7,
      excluded_corridor: 'C16',
      rooms: 7,
      encounters: 'Undead',
      objective_room: 'The Lava River',
      special_rules_printed: '-',
      reward_printed: '-',
    });
  });
  it('preserves precise hero/Wight/Apostle/chest geometry and first movement', () => {
    expect(sacrifice('objective_setup').state).toEqual({
      hero_entry: 'short side opposite the altar',
      wights: 4,
      wight_placement: 'on the heroes’ side, as close to the river as possible',
      wight_weapon: 'cursed longsword',
      wight_shields: true,
      apostle_placement: 'dais',
      first_to_move: 'heroes',
      objective_chests: 2,
      chest_placement: 'next to the altar',
      chests_locked: false,
      chests_trapped: false,
    });
  });
  it('retains narrative civilians and skeletons without inventing their count or converting all into Wights', () => {
    expect(sacrifice('objective_civilians').state).toEqual({
      civilians_location: 'bank of the lava river',
      civilians_surrounded_by: 'skeletons clad in rusty old armour',
      civilian_count_unspecified: true,
    });
  });
  it('retains Vampire Fledgling equipment without absent statistics', () => {
    expect(sacrifice('apostle').state).toEqual({
      enemy_kind: 'Vampire Fledgling',
      weapon: 'longsword',
      armour: 2,
    });
    expect(corpus.entities.find((x) => x.id === 'quest_actor.dead_rising.apostle')?.tables).toEqual(
      [],
    );
  });
  it.each([true, false])('requires civilian liberation for direct onward travel: %s', (freed) => {
    const result = sacrifice('aftermath', { civilians_liberated: freed });
    expect(result.trace.length > 0).toBe(freed);
    if (freed)
      expect(result.state).toMatchObject({
        civilians_sent_on_their_way: true,
        next_destination: 'White 39',
        head_straight_to_master: true,
      });
  });
});

describe('The Master — rendered PDF 235–236', () => {
  it('retains R10 within the top seven cards without substituting a different card pool', () => {
    expect(master('setup').state).toEqual({
      location: 'White 39',
      corridors: 7,
      rooms: 7,
      r10_in_top_seven_cards: true,
      encounters: 'Undead',
      objective_room: 'The Great Crypt',
    });
  });
  it.each([1, 7, 8, 10])('triggers a Scenario event only on 8–10: %s', (roll) => {
    expect(
      run(['core.quest.master.scenario_event', 'core.quest.master.scenario_no_event'], {
        scenario_roll: roll,
      }).state.event_triggered,
    ).toBe(roll >= 8);
  });
  it.each([
    [1, 100, 100],
    [100, 1, 100],
    [55, 55, 55],
  ])('selects the higher encounter result %s/%s', (a, b, selected) => {
    expect(
      master('harder_encounter', { chose_to_stop_sacrifice: true, first_roll: a, second_roll: b })
        .state,
    ).toMatchObject({ encounter_rolls_required: 2, selected_encounter_roll: selected });
  });
  it('depends on choice of the sacrifice path, rather than its success', () => {
    expect(
      master('harder_encounter', {
        chose_to_stop_sacrifice: true,
        sacrifice_succeeded: false,
        first_roll: 20,
        second_roll: 70,
      }).state.selected_encounter_roll,
    ).toBe(70);
    expect(
      master('harder_encounter', {
        chose_to_stop_sacrifice: false,
        first_roll: 20,
        second_roll: 70,
      }).trace,
    ).toEqual([]);
  });
  it('restricts the middle R10 chest to the actual Quest5 bronze key', () => {
    expect(master('key_chest').state).toEqual({
      chest_tile: 'R10',
      chest_position: 'middle',
      chest_locked: true,
      opening_method: 'bronze key from Quest 5 only',
      chest_contents: 'The Vanquisher',
    });
    for (const hasKey of [true, false])
      expect(
        run(['core.quest.master.key_opening', 'core.quest.master.key_missing'], {
          has_emil_bronze_key: hasKey,
          other_key: true,
          force_succeeded: true,
          lockpick_succeeded: true,
        }).state.middle_chest_opening_allowed,
      ).toBe(hasKey);
  });
  it('retains Vanquisher material, perfect condition8, standard stats and explicit sale400', () => {
    expect(master('vanquisher_properties').state).toEqual({
      blade_material: 'pure silver',
      magical: true,
      initial_condition: 8,
      condition_description: 'perfect condition',
      standard_weapon: 'longsword',
      sale_coins: 400,
    });
  });
  it.each([true, false])('limits Vanquisher damage bonus to Undead: %s', (undead) => {
    expect(
      run(['core.quest.master.vanquisher_undead', 'core.quest.master.vanquisher_other'], {
        target_is_undead: undead,
      }).state.vanquisher_damage_bonus,
    ).toBe(undead ? 2 : 0);
  });
  it('preserves two Ogres, doorway hero positions, first movement and six on-table tombs', () => {
    expect(master('objective_setup').state).toEqual({
      hero_entry: 'short side',
      hero_placement: 'remain where they were when opening the door',
      zombie_ogres: 2,
      ogre_placement: 'far end of the room',
      master_placement: 'between the two Ogres',
      first_to_move: 'heroes',
      lootable_tombs: 6,
      tomb_looting_on_table: true,
    });
  });
  it('does not invent the Master’s seven unnamed spell identities', () => {
    expect(master('master').state).toEqual({
      weapon: 'poisoned dagger',
      armour: 1,
      raise_dead_known: true,
      closecombat_spells: 3,
      ranged_spells: 4,
      xp: 200,
      treasure_table: 'T4',
    });
    expect(
      corpus.rules.find((x) => x.id === 'core.quest.master.master')?.unresolved_references,
    ).toContain(
      'Three Closecombat Spells and four Ranged Spells: the source does not name them or state a selection method.',
    );
  });
  it.each([true, false])('requires Master fallen before aftermath findings: %s', (fallen) => {
    const result = master('aftermath', { master_fallen: fallen });
    expect(result.trace.length > 0).toBe(fallen);
    if (fallen)
      expect(result.state).toMatchObject({
        master_body_disappears: true,
        grimoire_found: true,
        grimoire_spells: 1,
        spell_selection: 'randomise which spell can be learned',
        engraved_dagger_found: true,
        next_destination: 'Silver City',
      });
  });
  it('distinguishes advertised 1000c from the explicit per-hero campaign presentation', () => {
    expect(master('reward').state).toEqual({
      advertised_reward_coins: 1000,
      advertised_recipient: 'not specified in this heading',
    });
    const result = run(['core.quest.dead_rising_campaign.aftermath']);
    expect(result.state).toMatchObject({
      dagger_taken_for_investigation: true,
      dagger_symbol_origin: 'Ancient Lands',
      reward_per_hero: 1000,
      reward_presentation: 'small box during dinner with the Jarl',
      league_enlistment_requested: true,
      requesting_king: 'High King Logan III',
    });
    expect(result.events).toEqual([]);
    expect(result.state).not.toHaveProperty('coins');
  });
  it('binds both Apprentice branches and Sacrifice onward travel to real quests', () => {
    for (const [rule, target] of [
      ['core.quest.apprentice.choose_apostle', 'quest.dead_rising.sacrifice'],
      ['core.quest.apprentice.choose_master', 'quest.dead_rising.master'],
      ['core.quest.sacrifice.aftermath', 'quest.dead_rising.master'],
    ]) {
      const record = corpus.rules.find((x) => x.id === rule)!;
      expect(record.unresolved_references).toBeUndefined();
      expect(record.dependencies?.some((x) => x.object_id === target)).toBe(true);
      expect(corpus.entities.find((x) => x.id === target)?.type).toBe('quest');
    }
  });
  it('retains all nine Master stat cells, including numeric zeros and To Hit -10', () => {
    const table = corpus.tables.find((x) => x.id === 'table.quest.master.necromancer')!;
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
    const values = [55, 70, 0, 0, 30, -10, 60, 4, 18];
    for (const [i, column] of table.columns.entries())
      expect(table.rows[0]?.cells[column.id]).toMatchObject({
        type: 'number',
        printed: String(values[i]),
        value: values[i],
        meaning: 'value',
      });
    expect(table.footnotes).toContain('XP: 200, T4 Treasure Table.');
    for (const suffix of ['sacrifice', 'master']) {
      const threat = corpus.tables.find((x) => x.id === `table.quest.${suffix}.threat`)!;
      expect(['start', 'min', 'max'].map((c) => threat.rows[0]?.cells[c]?.printed)).toEqual([
        '6',
        '6',
        '18',
      ]);
    }
  });
});
