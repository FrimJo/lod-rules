import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const quests = [
  'section.quest_book_i.side_quests',
  'section.quest_book_i.side_quests.side_quest_1_the_missing_brother',
  'section.quest_book_i.side_quests.side_quest_2_slay_the_beast',
  'section.quest_book_i.side_quests.side_quest_3_the_mapmaker',
  'section.quest_book_i.side_quests.side_quest_4_go_fetch',
  'section.quest_book_i.side_quests.side_quest_5_manhunt',
  'section.quest_book_i.side_quests.side_quest_6_mushrooms',
  'section.buying_an_estate.side_quest_the_grieving_mother',
];
const tableNodes = [
  'section.quest_book_i.side_quests.table',
  'section.quest_book_i.side_quests.side_quest_2_slay_the_beast.table',
  'section.quest_book_i.side_quests.side_quest_3_the_mapmaker.table_the_mapmaker',
  'section.quest_book_i.side_quests.side_quest_4_go_fetch.table_shield_condition',
  'section.quest_book_i.side_quests.side_quest_5_manhunt.table',
];
const owned = new Set([...quests, ...tableNodes]);

interface Source {
  document: string;
  pdf_page?: number;
  heading?: string | null;
  locator?: { table?: string | null; row?: string | number | null };
  extraction?: { visually_verified?: boolean };
}
interface QuestRecord {
  id: string;
  section_id?: string;
  source?: Source[];
  source_text?: string;
  issues?: string[];
}
const records = [
  ...corpus.rules,
  ...corpus.entities,
  ...corpus.tables,
  ...corpus.procedures,
].filter((r) => owned.has((r as QuestRecord).section_id ?? '')) as QuestRecord[];
const byId = (id: string) => records.find((r) => r.id === id);

/** Headings printed on PDF 164–165 and 273–279, run-in headings included. */
const printed: Record<number, string[]> = {
  133: ['Available quests'],
  164: [
    'Side Quest: The Grieving Mother',
    'Location:',
    'Special Rules:',
    'Reward:',
    'Encounters:',
    'Objective Room:',
    'The Hidden Door',
  ],
  165: [
    'Entering the Side Objective Room',
    'Aftermath – If You Fail',
    'Aftermath – If You Bring Back the Remains',
  ],
  273: ['Side Quests'],
  274: [
    'Side Quest 1: The missing brother',
    'Quest Location:',
    'Special Rules:',
    'Reward:',
    'Encounters:',
    'Objective room:',
    'The Objective Room',
    'Aftermath: Found him!',
    'Aftermath: Didn’t find him!',
  ],
  275: [
    'Side Quest 2: Slay the beast!',
    'Quest Location:',
    'Special rules:',
    'Reward:',
    'Encounters:',
    'The Objective Room',
    'Setup',
    'Aftermath: Slayed the Beast!',
  ],
  276: [
    'Aftermath: Failed to Slay the Beast!',
    'Side quest 3: The Mapmaker',
    'Quest Location:',
    'Special Rules:',
    'Reward:',
    'Encounters:',
    'Objective room:',
    'The Mapmaker',
  ],
  277: [
    'Side Quest 4: Go Fetch!',
    'Quest Location:',
    'Special Rules:',
    'Reward:',
    'Encounters:',
    'Objective room:',
    'The Objective Room',
    'Aftermath: Back with the Shield',
    'Aftermath: Shield is Broken or was Not Found',
  ],
  278: [
    'Side Quest 5: Manhunt',
    'Quest Location:',
    'Special Rules:',
    'Reward:',
    'Encounters:',
    'Objective room:',
    'The Bandit',
    'Aftermath',
  ],
  279: [
    'Side Quest 6: Mushrooms',
    'Quest Location:',
    'Special Rules:',
    'Reward:',
    'Encounters:',
    'Objective room:',
    'Aftermath: Found it!',
  ],
};

describe('Step 3 — Side Quests (PDF 273–279) and The Grieving Mother (PDF 164–165)', () => {
  it('cites only printed headings on the rendered pages', () => {
    expect(records.length).toBeGreaterThan(90);
    for (const record of records) {
      for (const source of record.source ?? []) {
        if (source.document !== 'rulebook.second_printing.eng') continue;
        expect(printed[source.pdf_page ?? 0], `${record.id} ${source.heading}`).toContain(
          source.heading,
        );
        expect(source.extraction?.visually_verified, record.id).toBe(true);
      }
    }
  });

  it('quotes the page rather than summarising it', () => {
    const quotes: Record<string, string> = {
      'core.quest.side_quests.acceptance':
        'The heroes may choose to accept a Side Quest at any time during their stay in the city, and it does not add to the Day Count. This is something that they arrange during the nights at the inn, or maybe because they run into someone during the day that requires their services.',
      'core.quest.side_quests.selection':
        'Either you roll on the table, or you work your way through them one by one.',
      'core.quest.side_quests.result_4': '4 Go Fetch!',
      'core.quest.slay_beast.deck': 'Special rules: Add Side Quest 1 card to the pile.',
      'core.quest.slay_beast.result_4': '8 Minotaur with Greataxe, Armour 2 600 c',
      'core.quest.mapmaker.dodge': 'Skills: Dodge (45)',
      'core.quest.go_fetch.no_reward':
        'He sighs, lowers his head and walks away. No shield – No money.',
      'core.quest.manhunt.profile':
        'The Bandit is equipped with a battle-axe and a shield. He has Armour 3.',
      'core.quest.mushrooms.consume':
        'The potion is actually very potent and heals 2d6 HP once consumed.',
      'core.quest.grieving_mother.hidden_door':
        'Roll if locked or trapped as usual, but apart from that, treat it as a regular door.',
      'core.quest.grieving_mother.failure':
        'There will automatically be a Ghostly Event before the next quest, and that will be #8.',
    };
    for (const [id, text] of Object.entries(quotes)) expect(byId(id)?.source_text, id).toBe(text);
    expect(byId('core.quest.grieving_mother.door_slam')?.source_text).toContain(
      'The door is now locked as though you had rolled 10 on the Door Table',
    );
    expect(byId('procedure.grieving_mother')?.source_text).toContain(
      'Each Wandering Monster will be 1d2 Giant spiders.',
    );
  });

  it('cites uncaptioned tables by enclosing heading and table locator', () => {
    expect(byId('table.quest.side_quests.selector')?.source?.[0]).toMatchObject({
      heading: 'Side Quests',
      locator: { table: 'Uncaptioned table (1d6 / Quest)' },
    });
    expect(byId('core.quest.slay_beast.result_1')?.source?.[0]).toMatchObject({
      heading: 'Side Quest 2: Slay the beast!',
      locator: { table: 'Uncaptioned table (1d10 / Monster / Bet)', row: '1-3' },
    });
    expect(byId('table.quest.go_fetch.shield_condition')?.source?.[0]).toMatchObject({
      heading: 'The Objective Room',
      locator: { table: 'Uncaptioned table (1d6 / Result)' },
    });
  });

  it('types the 1d4 wear of the Go Fetch damaged row through its linked rule', () => {
    const table = corpus.tables.find((t) => t.id === 'table.quest.go_fetch.shield_condition');
    const row = table?.rows.find((r) => r.id === 'damaged');
    expect(row?.rule_refs).toEqual(['core.quest.go_fetch.damaged', 'core.quest.go_fetch.wear']);
    const wear = corpus.rules.find((r) => r.id === 'core.quest.go_fetch.wear');
    expect(wear?.fields?.shield_wear_roll?.dice).toEqual({ count: 1, sides: 4 });
    for (const roll of [1, 4]) {
      const result = runCase(
        {
          rule_ids: ['core.quest.go_fetch.wear'],
          inputs: { objective_fight_over: true, shield_search_roll: 5, shield_wear_roll: roll },
        } as unknown as TestCase,
        corpus,
      );
      expect(result.state.shield_wear_points_to_remove).toBe(roll);
    }
  });

  it('links every selector and Monster/Bet row to its result rule', () => {
    for (const [tableId, prefix] of [
      ['table.quest.side_quests.selector', 'core.quest.side_quests'],
      ['table.quest.slay_beast.monster_bet', 'core.quest.slay_beast'],
    ] as const) {
      const table = corpus.tables.find((t) => t.id === tableId);
      expect(table?.rows.map((r) => r.rule_refs)).toEqual(
        [1, 2, 3, 4, 5, 6].map((n) => [`${prefix}.result_${n}`]),
      );
    }
  });

  it('keeps printed stat-block dashes as markers, not zeros', () => {
    for (const [id, cols] of [
      ['table.quest.mapmaker.statistics', ['cs', 'rs', 'dmg_na']],
      ['table.quest.manhunt.bandit_statistics', ['rs', 'dmg_na']],
    ] as const) {
      const cells = corpus.tables.find((t) => t.id === id)?.rows[0]?.cells ?? {};
      for (const col of cols) {
        expect(cells[col], `${id}.${col}`).toEqual({
          type: 'marker',
          printed: '-',
          meaning: 'not_specified',
        });
      }
    }
  });

  it('records changelog entries 110 and 112 as unresolved and applies entry 111', () => {
    const issues = parse(readFileSync('review/ambiguities.yaml', 'utf8')) as {
      id: string;
      status: string;
      related: string[];
      source: Source[];
      resolution?: { source: Source[] };
    }[];
    const rows = (id: string) =>
      issues
        .find((x) => x.id === id)
        ?.source.filter((s) => s.document === 'vonbraus.changelog_2_2x')
        .map((s) => s.locator?.row);
    expect(rows('issue.quest.mapmaker_profile_card')).toEqual([110]);
    expect(rows('issue.quest.manhunt_bandit_profile_card')).toEqual([112]);
    for (const id of [
      'issue.quest.mapmaker_profile_card',
      'issue.quest.manhunt_bandit_profile_card',
    ]) {
      const issue = issues.find((x) => x.id === id);
      expect(issue?.status).toBe('unresolved');
      for (const rel of issue?.related ?? []) expect(byId(rel)?.issues, rel).toContain(id);
    }
    const xpLoot = issues.find((x) => x.id === 'issue.quest.manhunt_bandit_xp_loot');
    expect(xpLoot?.status).toBe('resolved');
    expect(xpLoot?.resolution?.source.map((s) => s.locator?.row)).toEqual([111]);
    // Entry 111 is applied as effects only: the printed Bandit table gains no XP or Loot cell.
    const rule = byId('core.quest.manhunt.bandit_xp_loot') as unknown as {
      source: Source[];
      source_text: string;
    };
    expect(rule.source.map((s) => [s.document, s.pdf_page])).toEqual([
      ['rulebook.second_printing.eng', 278],
      ['vonbraus.changelog_2_2x', 17],
    ]);
    expect(rule.source_text).toBe(
      'The Bandit is equipped with a battle-axe and a shield. He has Armour 3.',
    );
    expect(
      runCase({ rule_ids: ['core.quest.manhunt.bandit_xp_loot'], inputs: {} } as TestCase, corpus)
        .state,
    ).toEqual({ xp: 250, treasure_table: 'T4' });
    const table = byId('table.quest.manhunt.bandit_statistics') as unknown as {
      columns: { id: string }[];
    };
    expect(JSON.stringify(table.columns)).not.toMatch(/\b(xp|loot|ep)\b/i);
  });

  it('sets the printed Grieving Mother Reward line', () => {
    const result = runCase(
      { rule_ids: ['core.quest.grieving_mother.setup'], inputs: {} } as TestCase,
      corpus,
    );
    expect(result.state.reward).toBe('as told in the aftermath');
  });

  it('dispositions every component of the unit', () => {
    const coverage = parse(readFileSync('corpus/source-map/coverage.yaml', 'utf8')) as {
      sections: { id: string; status: string; components: Record<string, string>; notes: string }[];
    };
    for (const id of owned) {
      const row = coverage.sections.find((x) => x.id === id);
      expect(['extracted', 'reviewed'], id).toContain(row?.status);
      for (const value of Object.values(row?.components ?? {})) {
        expect(['extracted', 'not_applicable'], id).toContain(value);
      }
      expect(row?.notes, id).not.toMatch(/Package|ledger|reconcil|tier|batch|pending/i);
    }
  });
});
