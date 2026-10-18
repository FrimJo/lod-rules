import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';

const corpus = readPilot();
const quests = [
  'section.quest_book_i.the_great_crypt.quest_1_retrieving_the_family_heirloom',
  'section.quest_book_i.the_great_crypt.quest_2_stopping_the_necromancer',
  'section.quest_book_i.the_great_crypt.quest_3_tomb_raiders',
];
const tableNodes = [
  'section.quest_book_i.the_great_crypt.table',
  'section.quest_book_i.the_great_crypt.quest_2_stopping_the_necromancer.table',
  'section.quest_book_i.the_great_crypt.quest_2_stopping_the_necromancer.table_ragnalf_the_mad',
  'section.quest_book_i.the_great_crypt.quest_3_tomb_raiders.table',
];
const owned = new Set([...quests, ...tableNodes]);

interface Source {
  pdf_page?: number;
  section?: string | null;
  heading?: string | null;
}
interface QuestRecord {
  id: string;
  section_id?: string;
  source?: Source[];
  source_text?: string;
  issues?: string[];
}
const records: QuestRecord[] = [
  ...corpus.rules,
  ...corpus.entities,
  ...corpus.tables,
  ...corpus.procedures,
].filter((r) => owned.has((r as QuestRecord).section_id ?? '')) as QuestRecord[];
const byId = (id: string) => records.find((r) => r.id === id);

const printedHeadings = new Set([
  'The Great Crypt',
  'Quest 1: Retrieving the Family Heirloom',
  'Quest 2: Stopping the Necromancer',
  'Quest 3: Tomb Raiders',
  'Quest Location:',
  'Special Rules:',
  'Special rules:',
  'Number of Tiles:',
  'Number of tiles:',
  'Reward:',
  'Encounters:',
  'The Objective Room',
  'Setup',
  'Special Rules',
  'Aftermath',
  'Ragnalf the Mad',
]);

describe('Great Crypt quests (PDF 259–262): Step 3 citations', () => {
  it('cites only printed headings on PDF 259–262', () => {
    expect(records.length).toBeGreaterThan(25);
    for (const record of records) {
      for (const source of record.source ?? []) {
        expect(printedHeadings, record.id).toContain(source.heading);
        expect(printedHeadings, record.id).toContain(source.section);
        expect([259, 260, 261, 262], record.id).toContain(source.pdf_page);
      }
    }
  });

  it('keeps the printed wording of corrected quotations', () => {
    expect(byId('core.quest.family_heirloom.open_tomb')?.source_text).toContain(
      'Opening a tomb will take a complete turn for 2 heroes working together',
    );
    expect(byId('core.quest.family_heirloom.red_card')?.source_text).toBe(
      'Red: Lying on top of a mummified corpse is a shining sword with intricate details. The mummy has been placed with its hands on the sword’s hilt, and it is as if it took grip after its demise. With a crunching sound, the heroes break the mummy’s fingers, slowly forcing the sword from its grip.',
    );
    expect(byId('core.quest.family_heirloom.dressed_card')?.source_text).toContain(
      'Before the heroes react, the mummy has climbed out of the tomb. Place the mummy next to the tomb and commence combat.',
    );
    expect(byId('core.quest.family_heirloom.objective_setup')?.source_text).toContain(
      'Your heroes are where they were when the door was opened (on the short side of the room)',
    );
    expect(byId('core.quest.tomb_raiders.objective_setup')?.source_text).toContain(
      'The heroes remain were they stood when the door was opened.',
    );
    expect(byId('core.quest.stopping_necromancer.fall')?.source_text).toContain(
      'Any ‘To Hit’ roll of 90 or more means that hero loses his balance and falls.',
    );
    expect(byId('table.quest.stopping_necromancer.ragnalf')?.source_text).toBe(
      'Ragnalf the Mad ... CS | RS | DMG | NA | DEX ... 45 | 60 | 0 | 0 | 50 ... To hit | RES | M | HP ... -5 | 50 | 4 | 16',
    );
  });

  it('quotes the Great Crypt Threat tables in printed order and marks the setup gap', () => {
    for (const [id, start, max] of [
      ['table.quest.family_heirloom.threat', '1d4+1', 18],
      ['table.quest.stopping_necromancer.threat', '1d6', 20],
      ['table.quest.tomb_raiders.threat', '1d6', 20],
    ] as const) {
      expect(byId(id)?.source_text).toBe(
        `Start Threat Level | Min Threat Level | Max Threat Level ... ${start} | Same as start lvl | ${max}`,
      );
    }
    expect(byId('core.quest.family_heirloom.setup')?.source_text).toContain(
      'Quest Location: In the settlement. ... Number of Tiles: 8 corridors',
    );
  });

  it('records the 10% reduction reading as an open issue', () => {
    expect(byId('core.quest.stopping_necromancer.corpse_floor')?.issues).toContain(
      'issue.quest.necromancer_cs_rs_reduction',
    );
    const issues = parse(readFileSync('review/ambiguities.yaml', 'utf8')) as {
      id: string;
      status: string;
      related: string[];
    }[];
    const issue = issues.find((x) => x.id === 'issue.quest.necromancer_cs_rs_reduction');
    expect(issue?.status).toBe('unresolved');
    expect(issue?.related).toContain('core.quest.stopping_necromancer.corpse_floor');
  });

  it('dispositions every component of the quests and their table nodes', () => {
    const coverage = parse(readFileSync('corpus/source-map/coverage.yaml', 'utf8')) as {
      sections: { id: string; status: string; components: Record<string, string>; notes: string }[];
    };
    for (const id of owned) {
      const row = coverage.sections.find((x) => x.id === id);
      expect(['extracted', 'reviewed'], id).toContain(row?.status);
      for (const value of Object.values(row?.components ?? {})) {
        expect(['extracted', 'not_applicable'], id).toContain(value);
      }
      expect(row?.notes, id).not.toMatch(/Package|ledger|reconcil|tier|batch/i);
    }
  });
});
