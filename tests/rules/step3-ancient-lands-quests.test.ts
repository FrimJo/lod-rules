import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// Step 3 regression: the five Ancient Lands quests (PDF 264–272) quote the rendered page
// verbatim and cite printed headings, not extractor summaries or invented headings.

interface Source {
  pdf_page: number;
  printed_page: number;
  heading: string;
  locator?: { paragraph?: string; table?: string };
}
interface Rec {
  id: string;
  section_id: string;
  source: Source[];
  source_text: string;
}

const read = (path: string): Rec[] => parse(readFileSync(path, 'utf8')) as Rec[];
const quests = ['pyramid-xanthu', 'hierophant', 'temple-despair', 'amenhotep', 'khaba'];
const files = [
  ...quests.map((q) => `corpus/rules/quests/${q}.yaml`),
  ...quests.map((q) => `corpus/entities/quests/${q}.yaml`),
  ...quests.map((q) => `corpus/tables/quests/${q}.yaml`),
  ...['xanthu', 'djet', 'temple-despair', 'amenhotep-guardians', 'khaba'].map(
    (a) => `corpus/entities/quest-actors/${a}.yaml`,
  ),
  ...['djet-artifacts', 'temple-despair-books', 'sceptre-of-the-queen'].map(
    (e) => `corpus/entities/equipment/${e}.yaml`,
  ),
];
const records = files.flatMap(read);
const byId = new Map(records.map((r) => [r.id, r]));
const text = (id: string): string => {
  const r = byId.get(id);
  if (!r) throw new Error(`missing ${id}`);
  return r.source_text;
};

// Every heading printed on PDF 264–272, as the rendered pages show them.
const printed = new Set([
  'The Pyramid of Xánthu',
  'Special Rules:',
  'Special rules:',
  'Number of Tiles:',
  'Number of tiles:',
  'The Objective Room (Ancient Land tiles)',
  'The Objective Room (Standard tiles)',
  'Objective Room (Ancient Land tiles)',
  'The Objective Room',
  'Special Rule',
  'Setup',
  'Aftermath',
  'Tomb of the Hierophant',
  'Ace of Spades',
  '2 of Spades',
  '3 of Spades',
  'Temple of Despair',
  'Secondary objective',
  'Setup (Ancient Land tiles)',
  'Setup (Standard tiles)',
  'Aftermath (Both sets of tiles)',
  'Halls of Amenhotep',
  'Objective tile (Ancient land tiles)',
  'Objective tile (Standard tiles)',
  'Aftermath (Both set of halls)',
  'Crypt of Khaba',
  'Aftermath (Both set of tiles)',
  'Sceptre of the Queen',
]);

describe('Ancient Lands quests — printed headings and verbatim text (PDF 264–272)', () => {
  it('cites only printed headings with the printed folio', () => {
    expect(records.length).toBeGreaterThan(90);
    for (const r of records) {
      for (const s of r.source) {
        expect(printed.has(s.heading), `${r.id}: ${s.heading}`).toBe(true);
        expect(s.pdf_page, r.id).toBeGreaterThanOrEqual(264);
        expect(s.pdf_page, r.id).toBeLessThanOrEqual(272);
        expect(s.printed_page, r.id).toBe(s.pdf_page - 2);
      }
    }
  });

  it('cites uncaptioned Threat tables through the quest heading and a table locator', () => {
    for (const r of records.filter((x) => x.id.startsWith('table.'))) {
      expect(r.source).toHaveLength(1);
      expect(r.source[0]?.locator?.table).toBe(
        'Start Threat Level | Min Threat Level | Max Threat Level',
      );
    }
  });

  it.each([
    [
      'core.quest.pyramid_xanthu.furniture_reroll',
      'Due to the abundance of treasure, you may re-roll 4 rolls on the Furniture Chart during the quest. A re-roll may never be re-rolled.',
    ],
    [
      'core.quest.pyramid_xanthu.ancient_sarcophagus',
      'This sarcophagus cannot spawn another mummy when searched (just treat such a result as “nothing”).',
    ],
    [
      'core.quest.hierophant.fire_damage',
      'Each hero must make a successful Dodge roll or suffer 1d12 fire DMG.',
    ],
    [
      'core.quest.hierophant.card_deck',
      'Mix a deck of 14 playing cards. Make sure that they are all red, except for the Ace of Spades, 2 of Spades and 3 of Spades.',
    ],
    [
      'core.quest.temple_despair.curse_expiry',
      'These curses will be in effect until the heroes leave their next dungeon.',
    ],
    [
      'core.quest.amenhotep.standard_statue_square',
      'Once they move away from that square, treat the squares with statues as open.',
    ],
    [
      'core.quest.khaba.ancient_queen_sarcophagus',
      'Queen Khabas’ sarcophagus cannot spawn another mummy (just ignore the result) but can contain treasure.',
    ],
  ])('%s quotes the page verbatim', (id, quote) => {
    expect(text(id)).toBe(quote);
  });

  it('keeps the printed spacing slip in the sceptre recharge sentence', () => {
    expect(text('equipment.quest.sceptre_of_the_queen')).toContain(
      'It can only be cast once during each dungeon or skirmish, but never nee ds to be recharged.',
    );
  });

  it('keeps every quoted passage inside the rendered-page text', () => {
    // Passages are joined with " ... "; none may be an extractor summary.
    const forbidden = [
      /\bheroes search the entire room\b/,
      /No (local )?statistics/,
      /;\s+no recharge/,
    ];
    for (const r of records.filter((x) => !x.id.startsWith('table.'))) {
      for (const f of forbidden) expect(r.source_text, r.id).not.toMatch(f);
    }
  });

  it('marks the Ancient Lands quest sections and their Threat nodes extracted', () => {
    const coverage = parse(readFileSync('corpus/source-map/coverage.yaml', 'utf8')) as {
      sections: { id: string; status: string; components: Record<string, string> }[];
    };
    const base = 'section.quest_book_i.quests_into_the_ancient_lands.';
    const ids = [
      'the_pyramid_of_x_nthu',
      'tomb_of_the_hierophant',
      'temple_of_despair',
      'halls_of_amenhotep',
      'crypt_of_khaba',
      'table',
      'tomb_of_the_hierophant.table',
      'temple_of_despair.table',
      'halls_of_amenhotep.table',
      'crypt_of_khaba.table',
    ].map((s) => base + s);
    for (const id of ids) {
      const row = coverage.sections.find((s) => s.id === id);
      expect(['extracted', 'reviewed'], id).toContain(row?.status);
      for (const value of Object.values(row?.components ?? {})) {
        expect(['extracted', 'not_applicable'], id).toContain(value);
      }
    }
  });
});
