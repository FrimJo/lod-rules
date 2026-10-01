import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (ids: string[], inputs: State) =>
  runCase(
    { rule_ids: ids.map((id) => 'character.treasure.' + id), inputs } as unknown as TestCase,
    corpus,
  );
const one = (id: string, inputs: State = { selected: true, identified: true }) => run([id], inputs);
const roomIds = corpus.rules
  .filter((r) => r.id.startsWith('character.treasure.room_roll'))
  .map((r) => r.id.replace('character.treasure.', ''));

describe('treasure catalogue effects and supplied handoffs', () => {
  it.each([
    [1, 2],
    [2, 3],
  ])('Powerstone %i has +%i damage', (n, damage) =>
    expect(one(`powerstone.${n}`).state.damage_modifier).toBe(damage),
  );
  it('preserves Powerstone poison, reload exception and first-turn timing', () => {
    expect(one('powerstone.3').state).toMatchObject({
      poisonous: true,
      monster_hp_loss_each_turn: 1,
      duration: 'until end of battle',
      trigger: 'monster wounded',
    });
    expect(one('powerstone.11').state).toMatchObject({
      reload_action_reduction: 1,
      with_fast_reload_first_action_shots: 2,
      with_fast_reload_second_action_shots: 1,
    });
    expect(one('powerstone.16').state.duration).toBe('first turn of combat');
    expect(one('magic_items.9').state.hero_initiative_tokens).toBe(1);
    expect(one('magic_items.9').state.duration).toBeUndefined();
  });
  it.each([
    ['6', 'strength'],
    ['7', 'constitution'],
    ['8', 'wisdom'],
    ['9', 'resolve'],
    ['10', 'dexterity'],
  ])('Powerstone %s preserves +5 %s and jewellery restriction', (id, stat) => {
    expect(one('powerstone.' + id).state).toMatchObject({
      [stat + '_modifier']: 5,
      applicable_to: 'ring or amulet',
    });
  });
  it.each([
    ['12', 'defence_modifier', 2],
    ['13', 'energy_modifier', 1],
    ['14', 'luck_modifier', 1],
    ['15', 'detect_traps_modifier', 10],
    ['18', 'starting_hit_points_modifier', 2],
    ['19', 'starting_party_morale_modifier', 2],
    ['20', 'sanity_modifier', 2],
  ] as const)('Powerstone %s numerical effect', (id, key, value) =>
    expect(one('powerstone.' + id).state[key]).toBe(value),
  );
  it('magic effects preserve floors, rounding, armour-wide immunity and identification boundary', () => {
    expect(one('magic_weapons.6').state).toMatchObject({
      enc_modifier: -5,
      class_modifier: -1,
      minimum_class: 1,
    });
    expect(one('magic_armours_shields.3').state).toMatchObject({
      enc_multiplier: 0.5,
      rounding: 'up',
    });
    expect(one('magic_armours_shields.5').state).toMatchObject({
      ignore_fire_effects: true,
      all_hit_locations: true,
    });
    expect(
      one('legendary.horn_of_alfheim', { selected: true, identified: false }).state
        .all_heroes_damage_modifier,
    ).toBeUndefined();
    expect(one('legendary.general', { identified: false }).state.can_use).toBe(false);
  });
  it.each(['magic_weapons', 'magic_armours_shields', 'magic_items'])(
    '%s curse result rerolls positive power and hands off curse exactly once',
    (id) => {
      const result = one(id + '.10');
      expect(result.state).toMatchObject({ cursed: true, reroll_positive_effect: true });
      expect(result.events).toEqual([{ type: 'invoke', dependency: 'table.treasure.curses' }]);
    },
  );
  it.each([
    ['1', 'hit_points_modifier', -2],
    ['2', 'wisdom_modifier', -5],
    ['3', 'constitution_modifier', -5],
    ['4', 'strength_modifier', -5],
    ['5', 'dexterity_modifier', -5],
    ['6', 'hit_points_modifier', -3],
    ['7', 'resolve_modifier', -10],
    ['8', 'random_skill_modifier', -5],
    ['9', 'luck_modifier', -1],
    ['10', 'energy_modifier', -1],
  ] as const)('curse %s applies only when not matching benefit', (n, key, value) => {
    expect(one('curses.' + n, { selected: true, same_benefit: false }).state[key]).toBe(value);
    expect(one('curses.' + n, { selected: true, same_benefit: true }).state[key]).toBeUndefined();
    expect(one('curse_reroll', { same_benefit: true }).state.reroll).toBe(true);
  });
  it('relic restrictions, healing die and per-quest Luck remain distinct', () => {
    expect(
      one('relic.charus', { is_warrior_priest: true, relic_slot_valid: true }).state
        .energy_modifier,
    ).toBe(1);
    expect(
      one('relic.charus', { is_warrior_priest: false, relic_slot_valid: true }).state
        .energy_modifier,
    ).toBeUndefined();
    expect(
      one('relic.charus', { is_warrior_priest: true, relic_slot_valid: false }).state
        .energy_modifier,
    ).toBeUndefined();
    expect(
      one('relic.metheia', { is_warrior_priest: true, relic_slot_valid: true }).state.healing_dice,
    ).toBe('1d3');
    expect(
      one('relic.rhidnir', { is_warrior_priest: true, relic_slot_valid: true }).state.duration,
    ).toBe('each quest');
  });
  it('nested furniture bindings reuse the actual tables and alchemy identities', () => {
    for (const [id, key, target] of [
      ['statue', 'nested', 'table.treasure.furniture.statue_treasure'],
      ['well', 'chest', 'table.treasure.furniture.chest'],
      ['alchemist_table', 'ingredients', 'table.alchemy.ingredients'],
      ['fountain', 'drink', 'table.treasure.furniture.fountain_drink'],
    ])
      expect(
        corpus.rules
          .find((r) => r.id === 'character.treasure.furniture.' + id)!
          .dependencies!.find((d) => d.key === key)!.object_id,
      ).toBe(target);
  });
  it.each([1, 2])('fountain roll %i heals 1d4+1; basin heals 1d6+1 and all Energy', (roll) => {
    expect(
      one('drink.fountain.heal', {
        choose_to_drink: true,
        alchemical_success: false,
        roll,
        healing_roll: 4,
      }).state,
    ).toMatchObject({ hit_points_restored: 5, energy_restored: '1' });
    expect(
      one('drink.water_basin.heal', {
        choose_to_drink: true,
        alchemical_success: false,
        roll,
        healing_roll: 6,
      }).state,
    ).toMatchObject({ hit_points_restored: 7, energy_restored: 'all' });
  });
  it.each([9, 10])(
    'drinking roll %i uses one supplied party test, with optional refusal',
    (roll) => {
      for (const place of ['fountain', 'water_basin']) {
        const input = { choose_to_drink: true, alchemical_success: false, roll, healing_roll: 1 };
        expect(one('drink.' + place + '.disease', input).state.diseased).toBe(true);
        expect(
          one('drink.' + place + '.disease', { ...input, alchemical_success: true }).state.diseased,
        ).toBeUndefined();
        expect(
          one('drink.' + place + '.disease', { ...input, choose_to_drink: false }).state.diseased,
        ).toBeUndefined();
      }
    },
  );
  it('corridor overflow stays unresolved, R10 in-use rerolls without inventing a room', () => {
    expect(run(roomIds, { roll: 90, corridor: true }).state.adjusted_roll).toBe(100);
    const overflow = run(roomIds, { roll: 91, corridor: true });
    expect(overflow.unresolved).toEqual(['issue.treasure.corridor_overflow']);
    expect(overflow.events).toEqual([]);
    expect(
      run(['room_secret_door', 'room_secret_door.branch_1'], {
        adjusted_roll: 15,
        r10_in_use: true,
      }).state,
    ).toMatchObject({ reroll: true });
    expect(
      run(['room_secret_door', 'room_secret_door.branch_1'], {
        adjusted_roll: 15,
        r10_in_use: true,
      }).state.chamber_tile,
    ).toBeUndefined();
    expect(
      run(['room_secret_door', 'room_secret_door.branch_1'], {
        adjusted_roll: 1,
        r10_in_use: false,
      }).state.chamber_tile,
    ).toContain('R10');
  });
  it('composes successful search → findings as a handoff without generating loot', () => {
    const search = runCase(
      {
        procedure_id: 'procedure.search_room_or_corridor',
        inputs: { per_value: 50, helpers: 1, search_succeeded: true },
      } as unknown as TestCase,
      corpus,
    );
    expect(search.events).toContainEqual({
      type: 'invoke',
      dependency: 'table.treasure.rooms_corridors',
    });
    expect(search.state).toMatchObject({ effective_target: 60 });
    expect(search.state.loot).toBeUndefined();
    const findings = run(roomIds, { roll: 40, corridor: false });
    expect(findings.events).toEqual([
      { type: 'invoke', dependency: 'table.treasure.rooms_corridors' },
    ]);
    expect(findings.state.loot).toBeUndefined();
    const blocked = runCase(
      {
        procedure_id: 'procedure.search_furniture',
        inputs: { already_searched: true, enemies_in_los: false },
      } as unknown as TestCase,
      corpus,
    );
    expect(blocked.events.some((e) => e.type === 'invoke')).toBe(false);
  });
  it('all legendary descriptions have source-backed effects; selector-only identities have none', () => {
    const descriptions = corpus.entities.filter(
      (e) =>
        e.id.startsWith('equipment.legendary.') &&
        ![
          'equipment.legendary.belt_of_oakenshield',
          'equipment.legendary.the_golden_kopesh',
        ].includes(e.id),
    );
    expect(descriptions).toHaveLength(31);
    for (const e of descriptions) {
      expect(e.rules).toHaveLength(2);
      expect(corpus.rules.find((r) => r.id === e.rules![1])!.source.length).toBeGreaterThan(0);
    }
    expect(one('legendary.general', { identified: true }).state).toMatchObject({
      unique_by_default: true,
      can_sell: false,
      can_run_out_of_magic: false,
      can_be_damaged: false,
    });
    for (const id of ['vial_of_never_ending', 'ring_of_awareness', 'legendary_elixir'])
      expect(one('legendary.' + id).state.repeat_find_allowed).toBe(true);
    expect(one('legendary.ring_of_awareness').state).toMatchObject({
      first_round_initiative_tokens: 1,
      initiative_cumulative_cap: 3,
      detect_traps_perception_modifier: 15,
    });
    expect(one('legendary.vial_of_never_ending').state).toMatchObject({
      poured_potion_qualifies: false,
      reusable: true,
      destroyed_if_hit_in_battle: true,
    });
  });
  it('keeps attack, damage, slot and flight restrictions rather than broad generic buffs', () => {
    expect(one('legendary.bow_of_divine_twilight').state).toMatchObject({
      bloodlust_chance_modifier: 5,
      bloodlust_shot_damage_modifier: 5,
      stacks_with_talents_perks: true,
    });
    expect(one('legendary.the_headsmans_axe').state).toMatchObject({
      damage_modifier_per_consecutive_damaging_hit: 2,
      reset_on_miss_or_no_damage: true,
      reset_after_battle: true,
    });
    expect(one('legendary.sword_of_lightning').state).toMatchObject({
      odd_hit_extra_damage: '1d6',
      secondary_damage_multiplier: 0.5,
      secondary_rounding: 'down',
    });
    expect(one('legendary.the_vampires_brooch').state).toMatchObject({
      slot: 'necklace',
      healing_capped_by_damage_dealt: true,
      drain_instead_on: 6,
    });
    expect(one('legendary.the_golden_khopesh').state).toMatchObject({
      ignore_armour: true,
      ignore_natural_armour: true,
      weapon_class: 4,
      encumbrance: 10,
    });
    expect(one('legendary.necklace_of_flight').state).toMatchObject({
      immune_to_pit_traps: true,
      walk_across_lava: false,
      remain_in_those_squares: true,
    });
    expect(one('legendary.crown_of_resolve').state).toMatchObject({
      resolve_modifier: 15,
      helmet_allowed: false,
      cap_allowed: false,
    });
  });
  it('Stone of Valheir preserves storage checks, risk and focus combination', () => {
    expect(one('legendary.stone_of_valheir').state).toMatchObject({
      maximum_focus_bonuses: 3,
      bonus_per_focus: 10,
      maximum_stored_focus_modifier: 30,
      increases_miscast_risk: false,
      combines_with_normal_focus: true,
      storage_full_turn_per_bonus: true,
      storage_arcane_arts_test: true,
      between_quests_refill_without_roll: true,
      draw_res_test: true,
      failed_draw_sanity_loss: 1,
    });
  });
  it('missing inputs never fabricate a selected power or successful search', () => {
    expect(() => one('powerstone.1', {})).toThrow('Missing input');
    expect(() => one('legendary.horn_of_alfheim', { selected: true })).toThrow('Missing input');
    expect(() =>
      runCase(
        {
          procedure_id: 'procedure.search_room_or_corridor',
          inputs: { per_value: 50, helpers: 0 },
        } as unknown as TestCase,
        corpus,
      ),
    ).toThrow('Missing input');
  });
});

it.each([
  ['gauntlets_of_hraefnir', 'strength_modifier', 15],
  ['belt_of_copperbane', 'constitution_modifier', 20],
  ['ring_of_the_hierophant', 'undead_attacker_cs_modifier', -15],
  ['amulet_of_haamile', 'wisdom_modifier', 15],
  ['boots_of_stability', 'cannot_fall', true],
  ['cloak_of_elsewhyr', 'dodge_modifier', 15],
  ['priestly_dice', 'luck_modifier', 2],
  ['legendary_elixir', 'random_basic_stat_modifier', 10],
  ['dagger_of_vrunior', 'all_attacks_from_behind', true],
  ['the_summoners_staff', 'conjuring_arcane_arts_modifier', 20],
  ['ohlnirs_hammer', 'maximum_actions_lost_per_turn', 1],
  ['the_helmet_of_golgorosh_the_ram', 'defence', 6],
  ['the_breastplate_of_rannulf', 'defence', 8],
  ['ring_of_regeneration', 'regeneration_hp', '1d3'],
  ['boots_of_energy', 'energy_modifier', 2],
  ['the_goblin_scimitar', 'frenzy_perk', true],
  ['the_halfling_backpack', 'contained_object_enc_multiplier', 0.5],
  ['trap_sensing_ring', 'party_detect_traps_perception_modifier', 10],
  ['armour_of_the_father', 'resolve_modifier', 15],
  ['necklace_of_deflection', 'optional_deflection_roll', true],
] as const)('legendary source effect %s: %s', (id, key, value) => {
  expect(one('legendary.' + id).state[key]).toBe(value);
});

it('preserves the visible example card without claiming any unseen Treasure Cards', () => {
  const t = corpus.tables.find((t) => t.id === 'table.treasure.example_card')!;
  expect(t.rows.map((r) => Object.values(r.cells).map((c) => c.printed))).toEqual([
    [
      'Alchemist tools',
      'Fine Treasure',
      'All you need to harvest and store both parts and ingredients for potions. 1 Set of Alchemist tools. These tools are needed to make a successful harvest of parts or gathering of ingredients.',
      '1',
      '1d4',
      '200',
      '5',
    ],
  ]);
  expect(t.footnotes[0]).toContain('state of the equipment');
  expect(t.source[0]!.pdf_page).toBe(108);
});

// Independently read from the rendered Fountain and Water Basin rows, PDF 194–195.
it.each([
  ['fountain', 4, 5, '1'],
  ['water_basin', 6, 7, 'all'],
] as const)('rendered %s healing and disease branches remain distinct', (name, die, hp, energy) => {
  const ids = [`drink.${name}.heal`, `drink.${name}.disease`];
  const healed = run(ids, {
    choose_to_drink: true,
    roll: 2,
    healing_roll: die,
    alchemical_success: false,
  });
  expect(healed.state).toMatchObject({ hit_points_restored: hp, energy_restored: energy });
  expect(healed.state.diseased).toBeUndefined();
  const safe = run(ids, {
    choose_to_drink: true,
    roll: 9,
    healing_roll: die,
    alchemical_success: true,
  });
  expect(safe.state.diseased).toBeUndefined();
  expect(safe.state.hit_points_restored).toBeUndefined();
  expect(
    run(ids, { choose_to_drink: true, roll: 10, healing_roll: die, alchemical_success: false })
      .state.diseased,
  ).toBe(true);
});
