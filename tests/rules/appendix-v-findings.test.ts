import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

// Appendix V, PDF 193–196 (printed 191–194): rooms and corridors, furniture, defeated enemies and
// relics. Expectations are read from the rendered pages, not from the canonical files.
const corpus = readPilot();
const run = (ids: string[], inputs: State) =>
  runCase(
    { rule_ids: ids.map((id) => 'character.treasure.' + id), inputs } as unknown as TestCase,
    corpus,
  );
const table = (id: string) => corpus.tables.find((t) => t.id === 'table.treasure.' + id)!;
const rule = (id: string) => corpus.rules.find((r) => r.id === 'character.treasure.' + id)!;
const scope = corpus.tables.filter((t) =>
  /^table\.treasure\.(furniture(\..+)?|rooms_corridors|t[1-5]|relics)$/.test(t.id),
);

describe('Appendix V findings: printed dice in text cells are typed', () => {
  const diceRows = scope.flatMap((t) =>
    t.rows.flatMap((row) =>
      Object.values(row.cells)
        .filter((c) => c.type === 'text')
        .flatMap((c) => [...c.printed.matchAll(/(\d+)d(\d+)/g)])
        .map((m) => [t.id, row.id, Number(m[1]), Number(m[2])] as const),
    ),
  );
  it('finds the printed dice rows', () => {
    expect(diceRows.length).toBeGreaterThan(50);
  });
  it.each(diceRows)('%s/%s types %id%i through a linked rule', (tableId, rowId, count, sides) => {
    const row = corpus.tables.find((t) => t.id === tableId)!.rows.find((r) => r.id === rowId)!;
    const fields = (row.rule_refs ?? []).flatMap((id) =>
      Object.values(corpus.rules.find((r) => r.id === id)?.fields ?? {}),
    );
    expect(fields.some((f) => f.dice?.count === count && f.dice.sides === sides)).toBe(true);
  });
});

describe('Appendix V findings: source text and tables', () => {
  it('quotes the printed text instead of extractor summaries and drops invented footnotes', () => {
    for (const t of scope) {
      expect(t.source_text, t.id).not.toMatch(/retained|printed outcomes/);
      expect(t.footnotes, t.id).toEqual([]);
    }
    expect(table('furniture').source_text).toBe(
      'Check the tables on the following pages for the specific furniture you are searching, and ' +
        'then roll 1d10 to see if there is anything of any value. ... Furniture Findings',
    );
    expect(table('furniture.water_basin_drink').source_text).toMatch(
      /^Water Basin If you choose to drink from the fountain: 1-2:/,
    );
    expect(table('t1').source_text).toBe('Table T1 1d10 Object');
  });
  it('keeps the Statue nested result verbatim', () => {
    expect(table('furniture.statue_treasure').rows.map((r) => r.cells.result!.printed)).toEqual([
      'you have found a Wonderful Treasure',
      'a Fine Treasure',
    ]);
  });
  it('records the Water Basin "fountain" wording as an open issue', () => {
    expect(table('furniture.water_basin_drink').issues).toContain(
      'issue.treasure.water_basin_fountain_wording',
    );
  });
});

describe('Appendix V findings: typed furniture rows', () => {
  it.each([
    ['altar.row_2', 4, { coin_roll: 3 }, { coins: 30 }],
    ['treasure_pile.row_1', 2, { coin_roll: 4 }, { coins: 400, wonderful_treasures: 1 }],
    ['treasure_pile.row_2', 5, { coin_roll: 3 }, { coins: 300, fine_treasures: 2 }],
    ['treasure_pile.row_3', 10, { coin_roll: 2 }, { coins: 200, fine_treasures: 1 }],
    ['mine_cart.row_1', 1, { gemstone_value_roll: 200 }, { gemstone_value: 200 }],
    ['mine_cart.row_2', 3, { nugget_roll: 4 }, { nuggets: 4, nuggets_same_kind: true }],
    [
      'armour_rack.row_1',
      4,
      { armour_part_roll: 3, durability_loss_roll: 4 },
      {
        armour_parts_found: 3,
        durability_points_lost: 4,
      },
    ],
    [
      'archery_target.row_1',
      1,
      { ammunition_roll: 10, ammunition_choice: 'bolts' },
      {
        ammunition_found: 10,
        ammunition_kind: 'bolts',
      },
    ],
    ['drawer.row_2', 8, { coin_roll: 40 }, { coins: 40 }],
  ] as const)('%s on a search roll of %i', (id, roll, inputs, expected) => {
    const result = run(['furniture.' + id], { search_roll: roll, ...inputs });
    expect(result.state).toMatchObject(expected);
    expect(result.trace).toEqual(['character.treasure.furniture.' + id]);
  });
  it('applies a row only inside its printed d10 range', () => {
    expect(run(['furniture.altar.row_2'], { search_roll: 8, coin_roll: 3 }).state.coins).toBe(
      undefined,
    );
    expect(() => run(['furniture.altar.row_2'], { search_roll: 4, coin_roll: 7 })).toThrow(
      /out of range/,
    );
  });
  it('Statue result 1 rolls 1d6 on its nested table', () => {
    expect(run(['furniture.statue.row_1'], { search_roll: 1, nested_roll: 5 }).events).toEqual([
      { type: 'invoke', dependency: 'table.treasure.furniture.statue_treasure' },
    ]);
  });
  it('drinking types the healing dice of the Fountain (1d4+1) and Water Basin (1d6+1)', () => {
    expect(rule('drink.fountain.heal').fields.healing_roll!.dice).toEqual({ count: 1, sides: 4 });
    expect(rule('drink.water_basin.heal').fields.healing_roll!.dice).toEqual({
      count: 1,
      sides: 6,
    });
  });
});

describe('Appendix V findings: rooms and corridors', () => {
  const roomIds = corpus.rules
    .filter((r) => r.id.startsWith('character.treasure.room_roll'))
    .map((r) => r.id.replace('character.treasure.', ''));
  it('a corridor roll of 36 becomes 46 and finds 4d20 c.', () => {
    const result = run(roomIds, { roll: 36, corridor: true, coin_roll: 57 });
    expect(result.state).toMatchObject({ adjusted_roll: 46, coins: 57 });
    expect(result.trace).toContain('character.treasure.room_roll.row_5');
  });
  it('a room roll of 51 finds no coins', () => {
    expect(run(roomIds, { roll: 51, corridor: false, coin_roll: 57 }).state.coins).toBeUndefined();
  });
});

describe('Appendix V findings: Treasure Found on Defeated Enemies', () => {
  const ids = [1, 2, 3, 4, 5].map((n) => `defeated_enemy_tables.t${n}`);
  it.each([1, 2, 3, 4, 5])('an enemy with loot table T%i consults Table T%i', (n) => {
    const result = run(ids, { indicator: `T${n}` });
    expect(result.trace).toEqual([`character.treasure.defeated_enemy_tables.t${n}`]);
    expect(result.events).toEqual([{ type: 'invoke', dependency: `table.treasure.t${n}` }]);
  });
  it('cites the printed selector sentence and section', () => {
    expect(rule('defeated_enemy_tables.t1').section_id).toBe(
      'section.appendix_v_treasures.treasure_found_on_defeated_enemies',
    );
    expect(rule('defeated_enemy_tables.t1').source_text).toMatch(
      /^Based on what kind of enemy you have defeated, consult the tables below see what you have found\./,
    );
  });
  it('Table T1 result 1 loses 1d4 DUR from the enemy weapon', () => {
    expect(
      run(['defeated_enemy_tables.t1.row_1'], { loot_roll: 1, durability_loss_roll: 3 }).state,
    ).toMatchObject({ enemy_weapon_found: true, durability_points_lost: 3 });
    expect(
      run(['defeated_enemy_tables.t1.row_1'], { loot_roll: 2, durability_loss_roll: 3 }).state
        .durability_points_lost,
    ).toBeUndefined();
  });
  it('Table T4 result 4 gives 1d2 potions', () => {
    expect(
      run(['defeated_enemy_tables.t4.row_3'], { loot_roll: 4, potion_roll: 2 }).state.potions,
    ).toBe(2);
  });
});

describe('Appendix V findings: Table of Relics restrictions', () => {
  const restrict = (inputs: State) => run(['relic.restrictions'], inputs);
  it('only Warrior Priests can use relics', () => {
    expect(
      restrict({ is_warrior_priest: false, relics_in_use: 1, has_reliquary_talent: false }).events,
    ).toEqual([{ type: 'require', satisfied: false }]);
  });
  it('only two at a time unless the Warrior Priest has Reliquary', () => {
    expect(
      restrict({ is_warrior_priest: true, relics_in_use: 3, has_reliquary_talent: false }).events,
    ).toEqual([
      { type: 'require', satisfied: true },
      { type: 'require', satisfied: false },
    ]);
    const reliquary = restrict({
      is_warrior_priest: true,
      relics_in_use: 3,
      has_reliquary_talent: true,
    });
    expect(reliquary.events.every((e) => e.type === 'require' && e.satisfied)).toBe(true);
    expect(reliquary.state.counts_as_magic_item).toBe(true);
    expect(rule('relic.restrictions').dependencies!.map((d) => d.object_id)).toEqual(
      expect.arrayContaining([
        'character.talent.reliquary.relic_limit',
        'character.magic_item.jewellery_limits',
      ]),
    );
  });
  it('Relic of Metheia adds 1d3 to healing done by the Priest', () => {
    const base = { is_warrior_priest: true, relic_slot_valid: true, healing_bonus_roll: 2 };
    expect(
      run(['relic.metheia.healing_bonus'], { ...base, healing_done_by_priest: true }).state
        .healing_modifier,
    ).toBe(2);
    expect(
      run(['relic.metheia.healing_bonus'], { ...base, healing_done_by_priest: false }).state
        .healing_modifier,
    ).toBeUndefined();
  });
  it('every relic row links its entity, its effect rule and the restrictions', () => {
    for (const row of table('relics').rows) {
      expect(row.rule_refs).toContain('character.treasure.relic.restrictions');
      expect(row.entity_refs!.some((id) => id.startsWith('equipment.relic.'))).toBe(true);
    }
  });
});
