import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

// Appendix V Treasures, PDF 197–202 and the Necklace of Deflection table on PDF 213.
const corpus = readPilot();
const run = (ids: string[], inputs: State) =>
  runCase(
    { rule_ids: ids.map((id) => 'character.treasure.' + id), inputs } as unknown as TestCase,
    corpus,
  );
const rule = (id: string) => corpus.rules.find((r) => r.id === 'character.treasure.' + id)!;
const table = (id: string) => corpus.tables.find((t) => t.id === id)!;
const satisfied = (inputs: State, id: string) =>
  run([id], inputs)
    .events.filter((e) => e.type === 'require')
    .every((e) => e.satisfied);

describe('Tables of Potions (PDF 197)', () => {
  it('requires identification of found potions but not of own mixing', () => {
    expect(satisfied({ potion_origin: 'found', identified: false }, 'potions.identify')).toBe(
      false,
    );
    expect(
      run(['potions.identify'], { potion_origin: 'found', identified: true }).state,
    ).toMatchObject({ identification_required: true, may_drink: true });
    expect(run(['potions.identify'], { potion_origin: 'own_mixing' }).state).toMatchObject({
      identification_required: false,
      may_drink: true,
    });
  });
  it('types the 1d3 column roll and the 1d10 potion roll', () => {
    const fields = rule('potions.standard.columns_1_2').fields;
    expect(fields.column_roll!.dice).toEqual({ count: 1, sides: 3 });
    expect(fields.potion_roll!.dice).toEqual({ count: 1, sides: 10 });
    const rows = table('table.alchemy.standard').rows;
    const potion = (column_roll: number, potion_roll: number) => {
      const ids = ['potions.standard.columns_1_2', 'potions.standard.column_3'];
      const row = run(ids, { column_roll, potion_roll }).state.standard_potions_row as number;
      return rows[row - 1]!.cells.potion!.printed;
    };
    expect(potion(1, 1)).toBe('Bottle of Experience');
    expect(potion(2, 1)).toBe('Potion of Disorientation');
    expect(potion(2, 10)).toBe('Weapons Oil');
    expect(potion(3, 8)).toBe('Potion of Dragon Breath');
    expect(rule('potions.standard.column_3').issues).toContain('issue.alchemy.standard_selector');
  });
  it('marks the column-3 Roll again row', () => {
    expect(
      run(['potions.standard.roll_again'], { column_roll: 3, potion_roll: 10 }).state.roll_again,
    ).toBe(true);
    expect(
      run(['potions.standard.roll_again'], { column_roll: 1, potion_roll: 10 }).state.roll_again,
    ).toBeUndefined();
    expect(table('table.alchemy.standard').rows[29]!.rule_refs).toEqual([
      'character.treasure.potions.standard.roll_again',
    ]);
  });
  it('reads Weak/Supreme costs and keeps bold rows as printed provenance', () => {
    expect(run(['potions.weak_supreme'], { potion_roll: 1, quality: 'weak' }).state).toMatchObject({
      weak_supreme_row: 1,
      cost_part: 'value before the slash',
    });
    expect(
      run(['potions.weak_supreme'], { potion_roll: 12, quality: 'supreme' }).state.cost_part,
    ).toBe('value after the slash');
    const bold = table('table.alchemy.standard').rows.slice(10, 20);
    const region = (s: unknown) => (s as { locator?: { region?: string } }).locator?.region;
    expect(bold.every((r) => region(r.source?.[0]) === 'bold d10 number')).toBe(true);
    expect(table('table.alchemy.standard').rows[9]!.source).toBeUndefined();
  });
});

describe('Ingredients and Parts (PDF 198)', () => {
  it('randomises ingredients with 1d20 and parts with 1d3 then 1d10', () => {
    expect(
      run(['ingredients_and_parts.randomise'], { found_kind: 'ingredient', ingredient_roll: 19 })
        .state.ingredients_row,
    ).toBe(19);
    const row = run(['ingredients_and_parts.randomise'], {
      found_kind: 'part',
      group_roll: 3,
      part_roll: 6,
    }).state.parts_row as number;
    expect(table('table.alchemy.parts').rows[row - 1]!.cells.part!.printed).toBe('Spores¹');
    expect(table('table.alchemy.parts').footnotes).toEqual([]);
    expect(table('table.alchemy.parts').issues).toContain(
      'issue.treasure.parts_catalogue_divergence',
    );
  });
});

describe('Table of Powerstones restrictions (PDF 199)', () => {
  const ps = (n: number, inputs: State) =>
    run([`powerstone.${n}`], { powerstone_roll: n, ...inputs });
  it('limits weapon stones to weapons and DEF stones to armour or shields', () => {
    for (const n of [1, 2, 3, 4, 5])
      expect(satisfied({ powerstone_roll: n, item_kind: 'shield' }, `powerstone.${n}`)).toBe(false);
    expect(ps(4, { item_kind: 'weapon' }).state.damage_type).toBe('fire');
    expect(ps(5, { item_kind: 'weapon' }).state.to_hit_modifier).toBe(10);
    expect(ps(12, { item_kind: 'armour' }).state.defence_modifier).toBe(2);
    expect(ps(12, { item_kind: 'shield' }).state.defence_modifier).toBe(2);
    expect(ps(12, { item_kind: 'weapon' }).state.defence_modifier).toBeUndefined();
  });
  it('limits jewellery stones to rings or amulets and models bearer, wearer and carrier', () => {
    for (const n of [6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20])
      expect(rule(`powerstone.${n}`).issues).toContain('issue.treasure.powerstone_amulet_slot');
    expect(
      ps(6, { item_kind: 'ring', borne_by_hero: false }).state.strength_modifier,
    ).toBeUndefined();
    expect(ps(14, { item_kind: 'ring', worn_by_hero: false }).state.luck_modifier).toBeUndefined();
    expect(
      ps(17, { item_kind: 'amulet', failed_fear_or_terror_test: true }).state
        .reroll_failed_fear_terror,
    ).toBe(true);
    expect(
      ps(17, { item_kind: 'amulet', failed_fear_or_terror_test: false }).state
        .reroll_failed_fear_terror,
    ).toBeUndefined();
    expect(
      ps(19, { item_kind: 'ring', heroes_carrying_power: 0 }).state.starting_party_morale_modifier,
    ).toBeUndefined();
    expect(ps(20, { item_kind: 'weapon' }).state.sanity_modifier).toBeUndefined();
  });
  it('row 3 makes only a monster wounded by the weapon lose 1 HP every turn', () => {
    expect(ps(3, { item_kind: 'weapon' }).state).toMatchObject({ poisonous: true });
    expect(ps(3, { item_kind: 'weapon' }).state.monster_hp_loss_each_turn).toBeUndefined();
    const wounded = (monster_wounded_by_weapon: boolean) =>
      run(['powerstone.3.wounded'], {
        powerstone_roll: 3,
        item_kind: 'weapon',
        monster_wounded_by_weapon,
      }).state;
    expect(wounded(true)).toMatchObject({
      monster_hp_loss_each_turn: 1,
      duration: 'until end of battle',
    });
    expect(wounded(false).monster_hp_loss_each_turn).toBeUndefined();
    const row = table('table.treasure.powerstones').rows[2]!;
    expect(row.rule_refs).toContain('character.treasure.powerstone.3.wounded');
  });
  it('the Legendary Items selection names no die for the column', () => {
    const selection = (table('table.treasure.legendary') as { selection?: string[] }).selection!;
    expect(selection.join(' ')).not.toContain('1d6');
    expect(selection.join(' ')).toContain('roll 1d10 within that column');
  });
  it('keeps row 11 without an object restriction and flags it', () => {
    expect(rule('powerstone.11').fields.item_kind).toBeUndefined();
    expect(rule('powerstone.11').issues).toEqual(['issue.treasure.powerstone_fast_reload_object']);
    expect(rule('powerstone.1').fields.powerstone_roll!.dice).toEqual({ count: 1, sides: 20 });
  });
});

describe('Tables of Magic Powers for Items (PDF 200–201)', () => {
  it('rolls 1d10 on the table for the kind of Magic Item found', () => {
    expect(
      run(['magic_powers.roll'], {
        magic_item_found: true,
        item_kind: 'armour_or_shield',
        power_roll: 7,
      }).state,
    ).toMatchObject({
      magic_power_table: 'table.treasure.magic_armours_shields',
      magic_power_row: 7,
    });
  });
  it('requires Arcane Arts or the town service before use', () => {
    expect(satisfied({ identified_by: 'none' }, 'magic_powers.identify')).toBe(false);
    expect(run(['magic_powers.identify'], { identified_by: 'arcane_arts' }).state.can_use).toBe(
      true,
    );
    expect(run(['magic_powers.identify'], { identified_by: 'town_service' }).state.can_use).toBe(
      true,
    );
  });
  it('keeps the simple and diehard roll timings apart', () => {
    expect(
      run(['magic_powers.roll_timing'], { roll_timing: 'on_find', identified: false }).state,
    ).toMatchObject({ roll_power_now: true, can_use: false });
    expect(
      run(['magic_powers.roll_timing'], { roll_timing: 'diehard', identified: false }).state,
    ).toMatchObject({ roll_power_now: false, noted_as: 'Magic Weapon', can_use: false });
  });
  it('splits the CC parry and Ranged Dodge bonuses and the poison-only Constitution bonus', () => {
    expect(run(['magic_weapons.9'], { power_roll: 9, weapon_kind: 'close_combat' }).state).toEqual({
      power_roll: 9,
      weapon_kind: 'close_combat',
      close_combat_parry_modifier: 5,
    });
    expect(
      run(['magic_weapons.9'], { power_roll: 9, weapon_kind: 'ranged' }).state
        .ranged_dodge_modifier,
    ).toBe(5);
    expect(
      run(['magic_armours_shields.6'], { power_roll: 6, poison_resistance_roll: false }).state
        .poison_constitution_modifier,
    ).toBeUndefined();
  });
  it('applies the curse only while the item is wielded or worn', () => {
    expect(
      run(['magic_armours_shields.10'], { power_roll: 10, wearing: false }).state
        .curse_effects_apply,
    ).toBe(false);
  });
});

describe('Curses and Legendary Items selector (PDF 202)', () => {
  it('types the curse roll', () => {
    expect(rule('curses.1').fields.curse_roll!.dice).toEqual({ count: 1, sides: 10 });
    expect(
      run(['curses.1'], { curse_roll: 2, same_benefit: false }).state.hit_points_modifier,
    ).toBeUndefined();
  });
  it('selects the column by 1-2, 3-4 or 5-6 and the row by 1d10, once per object', () => {
    const rows = table('table.treasure.legendary').rows;
    const item = (column_roll: number, item_roll: number) => {
      const r = run(['legendary_selector'], {
        column_roll,
        item_roll,
        already_found: false,
        noted_otherwise: false,
      }).state.legendary_row as number;
      return rows[r - 1]!.cells.item!.printed;
    };
    expect(item(2, 4)).toBe('Gauntlets of Hraefnir');
    expect(item(3, 4)).toBe('Dagger of Vrunior');
    expect(item(6, 10)).toBe('Necklace of Deflection');
    expect(
      satisfied(
        { column_roll: 1, item_roll: 1, already_found: true, noted_otherwise: false },
        'legendary_selector',
      ),
    ).toBe(false);
    expect(rule('legendary_selector').fields.column_roll!.dice).toBeUndefined();
  });
});

describe('verbatim table headers and no invented footnotes', () => {
  it.each([
    ['table.treasure.powerstones', /^Powerstones are mighty magical artifacts/],
    ['table.treasure.curses', /^Roll to see what Curse the piece of equipment may carry\./],
    [
      'table.treasure.legendary',
      /unless noted otherwise\. 1-2 1d10 3-4 1d10 5-6 1d10 Legendary Item$/,
    ],
    ['table.treasure.necklace_deflection', /you may roll on the table below\. 1d6 Result$/],
    ['table.treasure.magic_weapons', /Magic Weapons 1d10 Description Effect$/],
    ['table.alchemy.ingredients', /Table of Ingredients 1d20 Ingredients$/],
  ] as const)('%s', (id, text) => {
    expect(table(id).source_text).toMatch(text);
    expect(table(id).footnotes).toEqual([]);
  });
});
