import { describe, expect, it } from 'vitest';
import {
  buildWorklist,
  chapterOf,
  collectSectionIds,
  countCitations,
  loadWorklistInput,
  renderWorklistMarkdown,
  toCanonicalRecord,
  type CanonicalRecord,
  type WorklistInput,
  type WorklistSection,
} from '../../scripts/reports/chapter-worklist.ts';
import type { CoverageEntry } from '../../scripts/reports/render-coverage.ts';

function section(
  id: string,
  kind: WorklistSection['kind'],
  parent?: string,
  extra: Partial<WorklistSection> = {},
): WorklistSection {
  return {
    id,
    title: id.split('.').at(-1) ?? id,
    kind,
    ...(parent ? { parent } : {}),
    printed_start_page: 17,
    printed_end_page: 17,
    pdf_start_page: 19,
    pdf_end_page: 19,
    ...extra,
  };
}

function coverage(id: string, status: CoverageEntry['status']): CoverageEntry {
  return {
    id,
    status,
    components: { glossary: 'not_applicable', rules: 'not_started', tables: 'extracted' },
  };
}

function record(id: string, kind: CanonicalRecord['kind'], sectionId: string): CanonicalRecord {
  return { id, kind, sectionIds: [sectionId], primarySectionId: sectionId };
}

/** A miniature book: two parts, three chapters, quests, and one redirect. */
function fixture(): WorklistInput {
  const sections: WorklistSection[] = [
    section('section.game_basics', 'chapter'),
    section('section.game_basics.difficulty', 'section', 'section.game_basics'),
    section('section.game_basics.tiles', 'section', 'section.game_basics', {
      printed_start_page: null,
      printed_end_page: null,
      pdf_start_page: 19,
      pdf_end_page: 20,
    }),
    section('section.dungeoneering_and_combat', 'part'),
    section('section.combat', 'chapter', 'section.dungeoneering_and_combat'),
    section('section.combat.hits', 'subsection', 'section.combat'),
    section('section.combat.hits.table', 'table', 'section.combat.hits'),
    section('section.combat.hits.table_2', 'table', 'section.combat.hits', {
      redirect_to: 'section.combat.hits.table',
    }),
    section('section.introduction', 'chapter'),
    section('section.quest_book_i', 'part'),
    section('section.quest_book_i.lava', 'chapter', 'section.quest_book_i'),
    section('section.quest_book_i.lava.rule', 'scenario_rule', 'section.quest_book_i.lava'),
    section('section.party_management', 'part'),
    section('section.backgrounds', 'chapter', 'section.party_management'),
  ];
  return {
    sections,
    coverage: [
      coverage('section.game_basics', 'mapped'),
      coverage('section.game_basics.difficulty', 'mapped'),
      coverage('section.game_basics.tiles', 'extracting'),
      coverage('section.dungeoneering_and_combat', 'mapped'),
      coverage('section.combat', 'extracted'),
      coverage('section.combat.hits', 'extracting'),
      coverage('section.combat.hits.table', 'extracted'),
      coverage('section.combat.hits.table_2', 'mapped'),
      coverage('section.introduction', 'mapped'),
      coverage('section.quest_book_i', 'extracted'),
      coverage('section.quest_book_i.lava', 'mapped'),
      coverage('section.quest_book_i.lava.rule', 'mapped'),
      coverage('section.party_management', 'mapped'),
      coverage('section.backgrounds', 'mapped'),
    ],
    records: [
      record('term.tile', 'term', 'section.game_basics.tiles'),
      record('rule.hit', 'rule', 'section.combat.hits'),
      record('rule.hit2', 'rule', 'section.combat.hits'),
      record('table.hits', 'table', 'section.combat.hits.table'),
      {
        id: 'procedure.attack',
        kind: 'procedure',
        sectionIds: ['section.combat', 'section.combat.hits', 'section.combat.hits'],
        primarySectionId: 'section.combat',
      },
      record('example.hit', 'example', 'section.combat.hits'),
    ],
  };
}

describe('chapter grouping', () => {
  const byId = new Map(fixture().sections.map((entry) => [entry.id, entry]));

  it('uses the nearest chapter ancestor, the part itself for part nodes', () => {
    expect(chapterOf('section.combat.hits.table', byId)).toBe('section.combat');
    expect(chapterOf('section.dungeoneering_and_combat', byId)).toBe(
      'section.dungeoneering_and_combat',
    );
    expect(chapterOf('section.backgrounds', byId)).toBe('section.backgrounds');
  });

  it('groups Quest Book I as one chapter', () => {
    expect(chapterOf('section.quest_book_i.lava.rule', byId)).toBe('section.quest_book_i');
  });

  it('counts sections per chapter and excludes compatibility redirects', () => {
    const worklist = buildWorklist(fixture());
    expect(worklist.redirectsExcluded).toBe(1);
    const combat = worklist.chapters.find((chapter) => chapter.chapter === 'combat');
    expect(combat?.sections).toBe(3);
    expect(combat?.unfinished).toBe(1);
    expect(combat?.sectionStatus).toMatchObject({ extracted: 2, extracting: 1, mapped: 0 });
    expect(combat?.componentStatus.rules.not_started).toBe(3);
    expect(combat?.componentStatus.entities.unset).toBe(3);
    const ids = worklist.chapters.flatMap((chapter) => chapter.unfinishedSections.map((s) => s.id));
    expect(ids).not.toContain('section.combat.hits.table_2');
  });
});

describe('citing records', () => {
  it('collects nested section_id values', () => {
    expect(
      collectSectionIds({
        id: 'x',
        section_id: 'section.a',
        steps: [{ dependencies: [{ section_id: 'section.b' }] }],
      }),
    ).toEqual(['section.a', 'section.b']);
    expect(toCanonicalRecord({ id: 'x', section_id: 'section.a' }, 'rule')).toEqual({
      id: 'x',
      kind: 'rule',
      sectionIds: ['section.a'],
      primarySectionId: 'section.a',
    });
    expect(toCanonicalRecord({ name: 'no id' }, 'rule')).toBeUndefined();
  });

  it('counts each record once per section, split by kind and primary/nested', () => {
    const counts = countCitations(fixture().records).get('section.combat.hits');
    expect(counts).toEqual({
      total: 4,
      primary: 3,
      byKind: { rule: 2, procedure: 1, example: 1 },
    });
  });

  it('flags unfinished sections with zero citing records, and terms-only sections', () => {
    const rows = buildWorklist(fixture()).chapters.flatMap((c) => c.unfinishedSections);
    const byId = new Map(rows.map((row) => [row.id, row]));
    expect(byId.get('section.game_basics.difficulty')?.noRecords).toBe(true);
    expect(byId.get('section.game_basics.tiles')).toMatchObject({
      noRecords: false,
      termsOnly: true,
      printedPages: '—',
      pdfPages: '19–20',
    });
    expect(byId.get('section.combat.hits')).toMatchObject({ noRecords: false, termsOnly: false });
    expect(byId.get('section.game_basics.difficulty')?.openComponents).toEqual([
      { component: 'rules', status: 'not_started' },
      { component: 'examples', status: 'unset' },
      { component: 'procedures', status: 'unset' },
      { component: 'entities', status: 'unset' },
    ]);
    const markdown = renderWorklistMarkdown(buildWorklist(fixture()));
    expect(markdown).toMatch(/\| section\.game_basics\.difficulty \|.*\*\*no records\*\* \|/);
    expect(markdown).toMatch(
      /\| section\.combat\.hits \|.*rule 2, proc 1, example 1 \(1 nested\) \|/,
    );
  });
});

describe('chapter ordering and filters', () => {
  const names = (input: WorklistInput, options = {}): string[] =>
    buildWorklist(input, options).chapters.map((chapter) => chapter.chapter);

  it('follows the Step 2 dependency order and excludes quests by default', () => {
    expect(names(fixture())).toEqual([
      'introduction',
      'game_basics',
      'party_management',
      'dungeoneering_and_combat',
      'combat',
    ]);
  });

  it('puts quest chapters last when included', () => {
    expect(names(fixture(), { includeQuests: true }).slice(-2)).toEqual([
      'backgrounds',
      'quest_book_i',
    ]);
  });

  it('filters by chapter name, chapter id or section subtree', () => {
    expect(names(fixture(), { chapter: 'combat' })).toEqual(['combat']);
    expect(names(fixture(), { chapter: 'section.quest_book_i' })).toEqual(['quest_book_i']);
    const subtree = buildWorklist(fixture(), { chapter: 'section.combat.hits' });
    expect(subtree.chapters[0]?.sections).toBe(2);
    expect(names(fixture(), { chapter: 'nothing' })).toEqual([]);
  });

  it('renders deterministically', () => {
    expect(renderWorklistMarkdown(buildWorklist(fixture()))).toBe(
      renderWorklistMarkdown(buildWorklist(fixture())),
    );
  });
});

describe('real corpus', () => {
  const worklist = buildWorklist(loadWorklistInput());
  const rows = worklist.chapters.flatMap((chapter) => chapter.unfinishedSections);
  const byId = new Map(rows.map((row) => [row.id, row]));

  it('excludes quests and redirects, and orders Introduction first', () => {
    expect(worklist.redirectsExcluded).toBe(35);
    expect(worklist.chapters[0]?.chapter).toBe('introduction');
    const chapterNames = worklist.chapters.map((chapter) => chapter.chapter);
    expect(chapterNames).not.toContain('quest_book_i');
    expect(chapterNames).not.toContain('backgrounds');
    expect(chapterNames.indexOf('game_basics')).toBeLessThan(chapterNames.indexOf('combat'));
  });

  it('drops reconciled Difficulty and flags Basic Stats as terms only', () => {
    // Difficulty had no records until the Step 2 pilot extracted it.
    expect(byId.has('section.game_basics.difficulty')).toBe(false);
    expect(byId.get('section.character_basics.the_character.basic_stats')?.termsOnly).toBe(true);
  });
});
