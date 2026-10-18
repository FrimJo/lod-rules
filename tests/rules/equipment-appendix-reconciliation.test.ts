// Appendix III: Equipment, PDF 179–186 (printed 177–184): catalogue completeness, the Sell and
// Repair redirect, the notes printed below the General Equipment tables and the Warrior Priest
// restriction typed from the Religious Relic rows.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const G = 'section.appendix_iii_equipment.general_equipment';

interface SectionNode {
  id: string;
  redirect_to?: string;
}
const nodes = parse(readFileSync('corpus/source-map/sections.yaml', 'utf8')) as SectionNode[];

describe('General Equipment catalogue', () => {
  const tableIds = [
    'alchemy',
    'animals_and_transportation',
    'consumables',
    'jewellery',
    'light_sources',
    'miscellaneous',
    'tools',
  ];

  it.each(tableIds)(
    'every %s row resolves to an entity that links back with a printed cost',
    (id) => {
      const table = corpus.tables.find((t) => t.id === `table.equipment.${id}`)!;
      expect(table.section_id).toBe(`${G}.${id}.table`);
      for (const row of table.rows) {
        expect(row.cells.cost!.printed).toMatch(/^\d+(\/\d+)? c$/);
        const entity = corpus.entities.find((e) => e.id === row.entity_refs?.[0])!;
        expect(entity.table_rows).toContainEqual({ table_id: table.id, row_id: row.id });
      }
    },
  );

  it('keeps one Sell and Repair node: the duplicate PDF 186 node is a redirect nothing cites', () => {
    const duplicate = nodes.find((n) => n.id === `${G}.table`)!;
    expect(duplicate.redirect_to).toBe(`${G}.sell_and_repair_table`);
    const citing = [...corpus.rules, ...corpus.tables, ...corpus.entities].filter(
      (o) => o.section_id === `${G}.table`,
    );
    expect(citing).toEqual([]);
    expect(corpus.tables.find((t) => t.id === 'table.equipment.sell_and_repair')!.section_id).toBe(
      `${G}.sell_and_repair_table`,
    );
  });
});

describe('notes printed below the General Equipment tables', () => {
  it.each([
    ['character.equipment.consumable.tobacco.bonus', 'consumables', 'Tobacco'],
    ['character.equipment.light_source.lantern_filled_with_oil.bats', 'light_sources', 'Lantern'],
    ['character.equipment.light_source.headlamp.destroyed', 'light_sources', 'Headlamp'],
    ['character.equipment.light_source.torch.light_new', 'light_sources', 'Torch'],
    ['character.equipment.general.partial_map.use', 'miscellaneous', 'Partial Map'],
  ])('%s cites the %s heading and its run-in heading %s', (id, section, heading) => {
    const rule = corpus.rules.find((r) => r.id === id)!;
    expect(rule.section_id).toBe(`${G}.${section}`);
    expect(rule.source.map((s) => s.heading)).toContain(heading);
  });

  it('quotes the printed sentences rather than a summary', () => {
    const text = (id: string) => corpus.rules.find((r) => r.id === id)!.source_text;
    expect(text('character.equipment.consumable.tobacco.withdrawal')).toBe(
      'If addicted, the hero must bring a kit of tobacco on every quest or suffer a -10 modifier to RES instead.',
    );
    expect(text('character.equipment.light_source.torch.shove')).toContain(
      'except the hero may not follow the enemy and occupy the enemy’s square.',
    );
    expect(text('character.equipment.light_source.headlamp.bats')).toMatch(
      /^Follows the same rules as a lantern but allows the hero to use both hands\. \.\.\. Bat swarms/,
    );
  });
});

describe('Religious Relic rows: "Can be used by a Warrior Priest."', () => {
  const run = (id: string, is_warrior_priest: boolean) => {
    const inputs: State = { is_warrior_priest };
    return runCase(
      { rule_ids: [`character.equipment.jewellery.${id}.use`], inputs } as TestCase,
      corpus,
    );
  };
  it.each(['religious_relic_necklace', 'religious_relic_ring'])(
    '%s is usable by a Warrior Priest only',
    (id) => {
      expect(run(id, true).state.warrior_priest_can_use).toBe(true);
      expect(run(id, true).events).toContainEqual({ type: 'require', satisfied: true });
      expect(run(id, false).state.warrior_priest_can_use).toBeUndefined();
      expect(run(id, false).events).toContainEqual({ type: 'require', satisfied: false });
    },
  );
});

describe('Appendix III review corrections', () => {
  const table = (id: string) => corpus.tables.find((t) => t.id === `table.equipment.${id}`)!;

  it('types every DUR "-" in the General Equipment tables as durability not applicable', () => {
    const cells = [
      ...['consumables', 'jewellery', 'miscellaneous', 'tools'].flatMap((id) =>
        table(id).rows.map((row) => row.cells.durability!),
      ),
      ...table('animals_and_transportation').rows.map((row) => row.cells.dur!),
    ].filter((cell) => cell.printed === '-');
    expect(cells).toHaveLength(20);
    for (const cell of cells)
      expect(cell).toMatchObject({ type: 'marker', meaning: 'not_applicable' });
  });

  it('uses the printed headings, not invented captions', () => {
    expect(table('miscellaneous').name).toBe('Miscellaneous table');
    expect(table('light_sources').name).toBe('Light sources table');
    const locators = corpus.entities
      .filter(
        (e) => e.id.startsWith('equipment.general.') || e.id.startsWith('equipment.light_source.'),
      )
      .flatMap((e) => e.source.map((s) => (s as { locator?: { table?: string } }).locator?.table))
      .filter((t): t is string => t !== undefined);
    expect(locators).not.toContain('Miscellaneous Equipment');
    expect(locators).not.toContain('Light Sources');
  });

  it('records the "Lost points of durability" header of the Sell and Repair Table', () => {
    expect(table('sell_and_repair').source_text).toMatch(
      /^Lost points of durability 0 1 2 3 4 5\+\/Repair/,
    );
  });

  it('lets an unlit lantern still force the troll RES test (issue.equipment.lantern_troll_unlit)', () => {
    for (const source of ['lantern_filled_with_oil', 'headlamp']) {
      const id = `character.equipment.light_source.${source}.troll_failure`;
      const inputs: State = { troll_previously_passed_res: false, troll_res_succeeded: false };
      expect(runCase({ rule_ids: [id], inputs } as TestCase, corpus).state.troll_action).toBe(
        'bellow',
      );
      expect(corpus.rules.find((r) => r.id === id)!.issues).toContain(
        'issue.equipment.lantern_troll_unlit',
      );
    }
  });
});
