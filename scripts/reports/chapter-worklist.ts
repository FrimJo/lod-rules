/**
 * Read-only Step 2 worklist: groups the coverage gap by chapter and counts the canonical records
 * that cite each section through `section_id`. Pure logic lives here; `chapters.ts` is the CLI.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { discoverPilotFiles } from '../validate/pilot-files.ts';
import type { Pilot } from '../validate/pilot-types.ts';
import { repoRoot } from '../validate/schemas.ts';
import type {
  ComponentStatus,
  CoverageEntry,
  CoverageFile,
  CoverageStatus,
  SectionEntry,
} from './render-coverage.ts';

export const COMPONENTS = [
  'glossary',
  'rules',
  'tables',
  'examples',
  'procedures',
  'entities',
] as const;
export type Component = (typeof COMPONENTS)[number];

export const SECTION_STATUSES: CoverageStatus[] = [
  'not_started',
  'mapped',
  'extracting',
  'extracted',
  'reviewed',
];
/** `unset` means the coverage row has no key for the component at all. */
export type ComponentCell = ComponentStatus | 'unset';
export const COMPONENT_STATUSES: ComponentCell[] = [
  'unset',
  'not_started',
  'mapped',
  'extracting',
  'extracted',
  'reviewed',
  'not_applicable',
];

export const RECORD_KINDS = [
  'rule',
  'table',
  'entity',
  'procedure',
  'state_machine',
  'term',
  'example',
] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

const KIND_LABEL: Record<RecordKind, string> = {
  rule: 'rule',
  table: 'table',
  entity: 'entity',
  procedure: 'proc',
  state_machine: 'sm',
  term: 'term',
  example: 'example',
};

const PILOT_KIND: Record<keyof Pilot, RecordKind> = {
  rules: 'rule',
  tables: 'table',
  entities: 'entity',
  procedures: 'procedure',
  stateMachines: 'state_machine',
  testCases: 'example',
};

/** A section of the book map with the extra fields this report reads. */
export interface WorklistSection extends SectionEntry {
  pdf_start_page?: number | null;
  pdf_end_page?: number | null;
}

export interface CanonicalRecord {
  id: string;
  kind: RecordKind;
  /** Every `section_id` value anywhere in the record; the first is the record's own, if any. */
  sectionIds: string[];
  /** The record's top-level `section_id`, when it has one. */
  primarySectionId?: string;
}

export interface WorklistInput {
  sections: WorklistSection[];
  coverage: CoverageEntry[];
  records: CanonicalRecord[];
}

/**
 * Step 2 dependency order from docs/corpus-completion-plan.md §3. Part nodes sit with the first
 * step that touches their chapters. `embarking_on_your_first_quest` is not named in the plan; it
 * is kept with the other Party Management chapters.
 */
export const CHAPTER_ORDER: ReadonlyArray<{ tier: number; chapters: string[] }> = [
  { tier: 1, chapters: ['introduction', 'game_basics'] },
  {
    tier: 2,
    chapters: [
      'party_management',
      'character_basics',
      'creating_your_character',
      'levelling_up',
      'embarking_on_your_first_quest',
    ],
  },
  { tier: 3, chapters: ['equipment', 'psychology'] },
  {
    tier: 4,
    chapters: ['academic_skills', 'magic', 'magic_items', 'enchantments', 'alchemy', 'prayers'],
  },
  { tier: 5, chapters: ['dungeoneering_and_combat', 'into_the_dungeons', 'treasure', 'combat'] },
  {
    tier: 6,
    chapters: [
      'travel_and_settlements',
      'travelling_and_skirmishes',
      'settlements',
      'the_dark_guild',
      'fighters_guild',
      'wizards_guild',
      'alchemists_guild',
      'rangers_guild',
      'the_inner_sanctum',
      'buying_an_estate',
    ],
  },
  {
    tier: 7,
    chapters: [
      'appendices',
      'appendix_i_perks',
      'appendix_ii_talents',
      'appendix_iii_equipment',
      'appendix_iv_spells',
      'appendix_v_treasures',
      'adding_a_third_dimension',
      'front_matter',
      'back_matter',
    ],
  },
];

/** Quest chapters run in Step 3 and are excluded unless asked for. */
export const QUEST_CHAPTERS: readonly string[] = ['backgrounds', 'quest_book_i'];
/** Parts reported as a single chapter rather than split into their child chapters. */
const PART_GROUPED = new Set(['section.quest_book_i']);

const FINISHED: CoverageStatus[] = ['extracted', 'reviewed'];
const COMPONENT_DONE: ComponentCell[] = ['extracted', 'reviewed', 'not_applicable'];

export function chapterName(chapterId: string): string {
  return chapterId.replace(/^section\./, '');
}

/** The chapter a section belongs to, from the `parent` structure in sections.yaml. */
export function chapterOf(sectionId: string, byId: Map<string, WorklistSection>): string {
  const chain: WorklistSection[] = [];
  const seen = new Set<string>();
  let current = byId.get(sectionId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current);
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  const root = chain[0];
  if (!root) return sectionId;
  if (PART_GROUPED.has(root.id)) return root.id;
  const chapter = chain.find((node) => node.kind === 'chapter' || node.kind === 'appendix');
  return (chapter ?? root).id;
}

/** Tier is the Step 2 position (1–7); null for quests and for chapters the plan does not name. */
function chapterRank(name: string): { tier: number | null; index: number } {
  let index = 0;
  for (const { tier, chapters } of CHAPTER_ORDER) {
    const at = chapters.indexOf(name);
    if (at >= 0) return { tier, index: index + at };
    index += chapters.length;
  }
  const questAt = QUEST_CHAPTERS.indexOf(name);
  // Chapters the plan does not name sort after the listed core chapters, before quests.
  if (questAt < 0) return { tier: null, index };
  return { tier: null, index: index + 1 + questAt };
}

export interface RecordCounts {
  total: number;
  /** Records whose own top-level `section_id` is this section. */
  primary: number;
  byKind: Partial<Record<RecordKind, number>>;
}

export interface WorklistSectionRow {
  id: string;
  title: string;
  kind: string;
  pdfPages: string;
  printedPages: string;
  status: CoverageStatus;
  /** Components not yet extracted, reviewed or not_applicable, with their status. */
  openComponents: Array<{ component: Component; status: ComponentCell }>;
  records: RecordCounts;
  /** No canonical record cites this section: likely genuine missing extraction. */
  noRecords: boolean;
  /** Only glossary terms cite this section: definitions exist, mechanics may not. */
  termsOnly: boolean;
}

export interface ChapterSummary {
  chapter: string;
  id: string;
  title: string;
  /** Step 2 dependency tier (1–7); null for quest chapters (plan Step 3) and unlisted ones. */
  tier: number | null;
  quest: boolean;
  sections: number;
  unfinished: number;
  noRecords: number;
  sectionStatus: Record<CoverageStatus, number>;
  componentStatus: Record<Component, Record<ComponentCell, number>>;
  unfinishedSections: WorklistSectionRow[];
}

export interface Worklist {
  redirectsExcluded: number;
  filter: string | null;
  includeQuests: boolean;
  chapters: ChapterSummary[];
}

export interface WorklistOptions {
  /** Chapter name (`combat`), chapter id (`section.combat`) or any section id (subtree). */
  chapter?: string;
  includeQuests?: boolean;
}

function range(start: number | null | undefined, end: number | null | undefined): string {
  if (start == null && end == null) return '—';
  if (start == null) return `?–${end}`;
  if (end == null || end === start) return `${start}`;
  return `${start}–${end}`;
}

function emptyCounts<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
}

/** Collect every string under a `section_id` key, depth first, in document order. */
export function collectSectionIds(value: unknown, into: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectSectionIds(item, into);
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'section_id' && typeof child === 'string') into.push(child);
      else collectSectionIds(child, into);
    }
  }
  return into;
}

export function toCanonicalRecord(raw: unknown, kind: RecordKind): CanonicalRecord | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const { id, section_id: primary } = raw as { id?: unknown; section_id?: unknown };
  if (typeof id !== 'string') return undefined;
  return {
    id,
    kind,
    sectionIds: collectSectionIds(raw),
    ...(typeof primary === 'string' ? { primarySectionId: primary } : {}),
  };
}

export function countCitations(records: CanonicalRecord[]): Map<string, RecordCounts> {
  const counts = new Map<string, RecordCounts>();
  for (const record of records) {
    for (const sectionId of new Set(record.sectionIds)) {
      const entry = counts.get(sectionId) ?? { total: 0, primary: 0, byKind: {} };
      entry.total += 1;
      if (record.primarySectionId === sectionId) entry.primary += 1;
      entry.byKind[record.kind] = (entry.byKind[record.kind] ?? 0) + 1;
      counts.set(sectionId, entry);
    }
  }
  return counts;
}

function matchesFilter(
  sectionId: string,
  chapterId: string,
  filter: string,
  byId: Map<string, WorklistSection>,
): boolean {
  if (chapterName(chapterId) === filter || chapterId === filter) return true;
  if (!filter.startsWith('section.')) return false;
  const seen = new Set<string>();
  let current: string | undefined = sectionId;
  while (current && !seen.has(current)) {
    if (current === filter) return true;
    seen.add(current);
    current = byId.get(current)?.parent;
  }
  return false;
}

export function buildWorklist(input: WorklistInput, options: WorklistOptions = {}): Worklist {
  const byId = new Map(input.sections.map((section) => [section.id, section]));
  const coverageById = new Map(input.coverage.map((entry) => [entry.id, entry]));
  const citations = countCitations(input.records);
  const filter = options.chapter?.trim() || null;
  const redirects = input.sections.filter((section) => section.redirect_to !== undefined);
  const chapters = new Map<string, ChapterSummary>();

  for (const section of input.sections) {
    if (section.redirect_to !== undefined) continue;
    const chapterId = chapterOf(section.id, byId);
    const name = chapterName(chapterId);
    const quest = QUEST_CHAPTERS.includes(name);
    if (filter) {
      if (!matchesFilter(section.id, chapterId, filter, byId)) continue;
    } else if (quest && !options.includeQuests) continue;

    let chapter = chapters.get(chapterId);
    if (!chapter) {
      chapter = {
        chapter: name,
        id: chapterId,
        title: byId.get(chapterId)?.title ?? name,
        tier: chapterRank(name).tier,
        quest,
        sections: 0,
        unfinished: 0,
        noRecords: 0,
        sectionStatus: emptyCounts(SECTION_STATUSES),
        componentStatus: Object.fromEntries(
          COMPONENTS.map((component) => [component, emptyCounts(COMPONENT_STATUSES)]),
        ) as Record<Component, Record<ComponentCell, number>>,
        unfinishedSections: [],
      };
      chapters.set(chapterId, chapter);
    }

    const coverage = coverageById.get(section.id);
    const status: CoverageStatus = coverage?.status ?? 'not_started';
    chapter.sections += 1;
    chapter.sectionStatus[status] += 1;
    const openComponents: WorklistSectionRow['openComponents'] = [];
    for (const component of COMPONENTS) {
      const cell: ComponentCell = coverage?.components?.[component] ?? 'unset';
      chapter.componentStatus[component][cell] += 1;
      if (!COMPONENT_DONE.includes(cell)) openComponents.push({ component, status: cell });
    }

    if (FINISHED.includes(status)) continue;
    const records = citations.get(section.id) ?? { total: 0, primary: 0, byKind: {} };
    const noRecords = records.total === 0;
    chapter.unfinished += 1;
    if (noRecords) chapter.noRecords += 1;
    chapter.unfinishedSections.push({
      id: section.id,
      title: section.title,
      kind: section.kind,
      pdfPages: range(section.pdf_start_page, section.pdf_end_page),
      printedPages: range(section.printed_start_page, section.printed_end_page),
      status,
      openComponents,
      records: { ...records, byKind: { ...records.byKind } },
      noRecords,
      termsOnly: !noRecords && records.byKind.term === records.total,
    });
  }

  const ordered = [...chapters.values()].sort(
    (a, b) =>
      chapterRank(a.chapter).index - chapterRank(b.chapter).index ||
      a.chapter.localeCompare(b.chapter, 'en'),
  );

  return {
    redirectsExcluded: redirects.length,
    filter,
    includeQuests: Boolean(options.includeQuests),
    chapters: ordered,
  };
}

export function formatRecordCounts(counts: RecordCounts): string {
  if (counts.total === 0) return '—';
  const parts = RECORD_KINDS.filter((kind) => counts.byKind[kind]).map(
    (kind) => `${KIND_LABEL[kind]} ${counts.byKind[kind]}`,
  );
  const nested = counts.total - counts.primary;
  return nested > 0 ? `${parts.join(', ')} (${nested} nested)` : parts.join(', ');
}

function formatOpen(open: WorklistSectionRow['openComponents']): string {
  if (open.length === 0) return '—';
  return open
    .map(({ component, status }) =>
      status === 'not_started' ? component : `${component} (${status})`,
    )
    .join(', ');
}

function tierLabel(chapter: ChapterSummary): string {
  if (chapter.quest) return 'quest';
  return chapter.tier === null ? '?' : String(chapter.tier);
}

function cell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

export function renderWorklistMarkdown(worklist: Worklist): string {
  const lines: string[] = ['# Step 2 chapter worklist', ''];
  const scope = worklist.filter
    ? `Filter: \`${worklist.filter}\`.`
    : worklist.includeQuests
      ? 'All chapters, quests included.'
      : 'Core chapters; Quest Book I and backgrounds excluded (`--include-quests`).';
  lines.push(
    `${scope} ${worklist.redirectsExcluded} compatibility redirects excluded. ` +
      'Unfinished means section status is not `extracted` or `reviewed`. ' +
      '**no records**: no canonical record cites the section (likely missing extraction); ' +
      '"terms only": only glossary terms cite it. Counts are records with a matching ' +
      '`section_id` anywhere in the record; "nested" ones cite it below the top level.',
    '',
  );

  if (worklist.chapters.length === 0) {
    lines.push('No sections match.', '');
    return lines.join('\n');
  }

  const sum = (pick: (chapter: ChapterSummary) => number): number =>
    worklist.chapters.reduce((total, chapter) => total + pick(chapter), 0);
  lines.push(
    '| Tier | Chapter | Sections | Unfinished | No records | mapped | extracting | extracted | reviewed |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  );
  for (const chapter of worklist.chapters) {
    const status = chapter.sectionStatus;
    lines.push(
      `| ${tierLabel(chapter)} | ${chapter.chapter} | ${chapter.sections} | ${chapter.unfinished} | ` +
        `${chapter.noRecords} | ${status.mapped + status.not_started} | ${status.extracting} | ` +
        `${status.extracted} | ${status.reviewed} |`,
    );
  }
  lines.push(
    `| | **total** | ${sum((c) => c.sections)} | ${sum((c) => c.unfinished)} | ` +
      `${sum((c) => c.noRecords)} | ` +
      `${sum((c) => c.sectionStatus.mapped + c.sectionStatus.not_started)} | ` +
      `${sum((c) => c.sectionStatus.extracting)} | ${sum((c) => c.sectionStatus.extracted)} | ` +
      `${sum((c) => c.sectionStatus.reviewed)} |`,
    '',
    'The mapped column includes any `not_started` sections.',
    '',
  );

  for (const chapter of worklist.chapters) {
    lines.push(
      `## ${tierLabel(chapter)}. ${chapter.title} (\`${chapter.chapter}\`)`,
      '',
      `${chapter.unfinished} of ${chapter.sections} sections unfinished; ` +
        `${chapter.noRecords} with no records.`,
      '',
    );
    const shown = COMPONENT_STATUSES.filter((status) =>
      COMPONENTS.some((component) => chapter.componentStatus[component][status] > 0),
    );
    lines.push(
      `| Component | ${shown.join(' | ')} |`,
      `| --- | ${shown.map(() => '---').join(' | ')} |`,
      ...COMPONENTS.map(
        (component) =>
          `| ${component} | ${shown.map((status) => chapter.componentStatus[component][status]).join(' | ')} |`,
      ),
      '',
    );
    if (chapter.unfinishedSections.length === 0) {
      lines.push('No unfinished sections.', '');
      continue;
    }
    lines.push(
      '| Section | Title | PDF | Printed | Status | Open components | Citing records |',
      '| --- | --- | --- | --- | --- | --- | --- |',
    );
    for (const row of chapter.unfinishedSections) {
      const records = row.noRecords
        ? '**no records**'
        : `${formatRecordCounts(row.records)}${row.termsOnly ? ' (terms only)' : ''}`;
      lines.push(
        `| ${row.id} | ${cell(row.title)} | ${row.pdfPages} | ${row.printedPages} | ` +
          `${row.status} | ${formatOpen(row.openComponents)} | ${records} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

function readYaml(root: string, path: string): unknown {
  return parse(readFileSync(join(root, path), 'utf8'));
}

/** Load the real corpus. Shape is checked by `npm run validate`, not here. */
export function loadWorklistInput(root = repoRoot): WorklistInput {
  const sections = (readYaml(root, 'corpus/source-map/sections.yaml') ?? []) as WorklistSection[];
  const coverage = (readYaml(root, 'corpus/source-map/coverage.yaml') as CoverageFile | null)
    ?.sections;
  const records: CanonicalRecord[] = [];
  const add = (data: unknown, kind: RecordKind): void => {
    if (!Array.isArray(data)) return;
    for (const raw of data) {
      const record = toCanonicalRecord(raw, kind);
      if (record) records.push(record);
    }
  };
  add(readYaml(root, 'corpus/glossary/terms.yaml'), 'term');
  for (const file of discoverPilotFiles(root))
    add(readYaml(root, file.path), PILOT_KIND[file.schema]);
  return { sections, coverage: coverage ?? [], records };
}
