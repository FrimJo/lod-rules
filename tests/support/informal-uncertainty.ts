/**
 * The Phase 9 informal-uncertainty inventory (issue #22). Every informal note that states a doubt
 * about the rulebook is listed once in a per-family fixture under
 * tests/fixtures/informal-uncertainty/, with a disposition: `recorded` (the `issue.*` ids that hold
 * it), `resolved` (the review record or published ruling that settled it) or `not_uncertainty`
 * (why it is not one). `checkInformalUncertainty` returns one message per problem.
 *
 * Candidates (what must be inventoried):
 *
 * - Markdown (`ledger`, `checkpoint`, `doc`): one block (a list item with its wrapped lines, a
 *   table row, or a paragraph; fenced code skipped) under an `anchorPattern` heading or one-line
 *   `…:` lead-in, or whose prose matches a keyword. Prose drops inline code: backticked text is
 *   identifiers and values (`status: unresolved`), not statements.
 * - Corpus YAML (`corpus_note`): strings under a `noteFields` key that match a keyword.
 *   `source_text`, `definition` and `footnotes` are the book's wording; identifier and data keys
 *   hold values. Descriptions, labels and `unresolved_references` are scanned because most of
 *   their hits are real doubts ("the book does not say where the tutor fee is paid"); the few
 *   state-word hits are cheaper to dismiss with a reason than to hide behind a narrower rule.
 * - Review findings (`review_finding`): `no_change_needed` findings that match a keyword.
 *
 * Pointer exemption: a note citing an `issue.*` id that exists already points at the formal record,
 * so it is no candidate (a nonexistent id exempts nothing). Every checkpoint carry-over bullet is a
 * candidate anyway, so that list always has a checked disposition (spec "Checkpoint rule").
 *
 * Deliberate deviations from spec #22:
 *
 * - Locators are heading-level (or field- and finding-level), not per note, so several notes
 *   share one. A note's identity is locator + excerpt: an entry must match exactly one candidate,
 *   and the spec's "two entries claim the same locator" is enforced as "no note claimed twice".
 * - Corpus notes and findings need a keyword hit. Only headings, lead-ins and checkpoint
 *   carry-overs act as structural anchors; taking every note field or finding would flood the
 *   inventory with plain commentary.
 * - A finding whose `object_id` is an existing issue is about that issue (typically confirming it
 *   on the page), so it is a pointer.
 */
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import {
  canonicalJson,
  type ReviewRecord,
  type ReviewSnapshot,
} from '../../scripts/validate/independent-review.ts';
import { createAjv, formatErrors, repoRoot } from '../../scripts/validate/schemas.ts';

export const sourceKinds = [
  'ledger',
  'checkpoint',
  'corpus_note',
  'review_finding',
  'doc',
] as const;
export const dispositions = ['recorded', 'resolved', 'not_uncertainty'] as const;
export type SourceKind = (typeof sourceKinds)[number];
type MarkdownKind = 'ledger' | 'checkpoint' | 'doc';

/** Headings and list lead-ins whose blocks are candidates whatever their wording. */
export const anchorPattern = /\bunresolved\b|\bopen\b|\bcarry-?overs?\b/i;
/** Anchors whose bullets in the checkpoint get no pointer exemption. */
export const carryOverPattern = /\bcarry-?overs?\b/i;
/** The fixed keyword list (spec #22). Matched against prose, case-insensitively. */
export const keywordPatterns: readonly RegExp[] = [
  /\bunresolved\b/i,
  /\bunclear\b/i,
  /\bambiguous\b/i,
  /\bdoes not (?:say|state|define)\b/i,
  /\bnot specified\b/i,
  /\buncertain\b/i,
  /\bopen questions?\b/i,
];
/** Free-text YAML keys scanned for `corpus_note` candidates. */
export const noteFields = [
  'notes',
  'note',
  'reason',
  'description',
  'label',
  'unresolved_references',
] as const;
export const checkpointFile = 'docs/extraction-checkpoint.md';

/**
 * Which sources each family fixture covers. A fixture `<family>.json` checks exactly the
 * candidates found in its family's files. `files` are globs relative to the repo root.
 */
export const families = {
  checkpoint: { kind: 'checkpoint', files: [checkpointFile] },
  'ledger-core': { kind: 'ledger', files: ['docs/ledgers/core-chapter-reconciliation.md'] },
  'ledger-lifecycle': {
    kind: 'ledger',
    files: [
      'docs/ledgers/lifecycle-procedures.md',
      'docs/ledgers/character-guild-procedures.md',
      'docs/ledgers/travel-settlement-accounting.md',
    ],
  },
  'ledger-phases': {
    kind: 'ledger',
    files: ['docs/ledgers/phase-*.md', 'docs/ledgers/package-a-completion-inventory.md'],
  },
  'ledger-quest': {
    kind: 'ledger',
    files: [
      'docs/ledgers/quest-book-reconciliation.md',
      'docs/ledgers/quest-scenario-inventory.md',
    ],
  },
  corpus_note: { kind: 'corpus_note', files: ['corpus/**/*.yaml', 'tests/examples/**/*.yaml'] },
  review_finding: { kind: 'review_finding', files: ['review/independent/*.yaml'] },
  doc: {
    kind: 'doc',
    files: [
      'docs/*.md',
      'docs/adr/*.md',
      'docs/agents/*.md',
      'LOD_RULES_CORPUS_PLAN.md',
      'README.md',
      'CONTEXT.md',
    ],
    exclude: [checkpointFile],
  },
} as const satisfies Record<
  string,
  { kind: SourceKind; files: readonly string[]; exclude?: readonly string[] }
>;
export type Family = keyof typeof families;

/** Files in the scanned scope that no family covers, and why. */
export const unscannedFiles: Record<string, string> = {
  'AGENTS.md': 'agent instructions, not a record of what the book leaves unclear',
  'docs/coverage-report.md': 'generated by report:coverage from corpus/source-map/',
  'docs/graph-report.md':
    'generated by the graph script; its anomalies are dispositioned in graph-anomaly-dispositions.json',
};
/** Every file here must belong to exactly one family or be listed in `unscannedFiles`. */
export const scannedScope = [
  '*.md',
  'docs/**/*.md',
  'corpus/**/*.yaml',
  'tests/examples/**/*.yaml',
  'review/independent/*.yaml',
];

export type Locator =
  /** ledger, checkpoint, doc: heading path joined with " > " (lead-ins count as headings). */
  | { file: string; heading: string }
  /** corpus_note: outermost record with an id, and the field path below it. */
  | { file: string; record: string; field: string }
  /** review_finding: record id and zero-based finding index. */
  | { record: string; finding: number };

export type Evidence =
  | { review: string }
  /** A published ruling: changelog `heading` is its version ('2.21') and `row` its Number. */
  | { document: string; heading: string; row?: number | string };

export interface InventoryEntry {
  id: string;
  source_kind: SourceKind;
  locator: Locator;
  excerpt: string;
  disposition: (typeof dispositions)[number];
  issues?: string[];
  evidence?: Evidence[];
  reason?: string;
}
export interface InformalUncertaintyInventory {
  description: string;
  entries: InventoryEntry[];
}

export interface Candidate {
  source_kind: SourceKind;
  locator: Locator;
  text: string;
}

export interface InformalUncertaintyContext {
  candidates: Record<Family, Candidate[]>;
  issueIds: Set<string>;
  reviewIds: Set<string>;
  /** Manifest document id → source class, for `official_errata` and `official_faq` only. */
  rulingDocuments: Map<string, 'official_errata' | 'official_faq'>;
  /** `rulingKey` of every ruling cited by a source reference in corpus/ or review/. */
  citedRulings: Set<string>;
}

const issueIdPattern = /\bissue\.[a-z0-9_]+(?:\.[a-z0-9_]+)*/g;
const normalise = (text: string): string => text.replace(/\s+/g, ' ').trim();
const prose = (text: string): string => text.replace(/`[^`]*`/g, ' ');
const hasKeyword = (text: string): boolean =>
  keywordPatterns.some((pattern) => pattern.test(prose(text)));
const isPointer = (text: string, issueIds: Set<string>): boolean =>
  [...text.matchAll(issueIdPattern)].some(([id]) => issueIds.has(id));
export const locatorKey = (locator: Locator): string => canonicalJson(locator);
export const rulingKey = (document: string, heading: string, row?: number | string): string =>
  canonicalJson([document, heading, row === undefined ? null : String(row)]);

export function markdownCandidates(
  file: string,
  text: string,
  kind: MarkdownKind,
  issueIds: Set<string>,
): Candidate[] {
  const candidates: Candidate[] = [];
  const headings: { level: number; text: string }[] = [];
  let leadIn: string | undefined;
  let block: string[] = [];
  let blockIsList = false;
  let fence = false;

  const flush = (): void => {
    if (!block.length) return;
    const body = block.join('\n');
    if (!blockIsList) leadIn = undefined;
    const lead = /^([^\n]+):$/.exec(body)?.[1];
    if (!blockIsList && lead && anchorPattern.test(prose(lead))) leadIn = lead;
    else {
      const path = [...headings.map((heading) => heading.text), ...(leadIn ? [leadIn] : [])];
      const anchored = path.some((label) => anchorPattern.test(prose(label)));
      const carryOver =
        kind === 'checkpoint' &&
        blockIsList &&
        path.some((label) => carryOverPattern.test(prose(label)));
      if (carryOver || ((anchored || hasKeyword(body)) && !isPointer(body, issueIds)))
        candidates.push({
          source_kind: kind,
          locator: { file, heading: path.join(' > ') },
          text: body,
        });
    }
    block = [];
  };

  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      flush();
      fence = !fence;
      continue;
    }
    if (fence) continue;
    const heading = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) {
      flush();
      leadIn = undefined;
      const level = heading[1]!.length;
      while (headings.length && headings.at(-1)!.level >= level) headings.pop();
      headings.push({ level, text: heading[2]! });
    } else if (!line.trim()) flush();
    else if (/^\s*\|/.test(line)) {
      flush();
      if (!/^\s*\|[\s|:-]+\|\s*$/.test(line)) {
        block = [line];
        blockIsList = true;
        flush();
      }
    } else if (/^\s*(?:[-*+]|\d+[.)])\s+/.test(line)) {
      flush();
      block = [line];
      blockIsList = true;
    } else {
      if (!block.length) blockIsList = false;
      block.push(line);
    }
  }
  flush();
  return candidates;
}

/**
 * `corpus_note` candidates in one parsed YAML file. `record` is the outermost object with an id
 * (`(file)` when none has one); `field` is the path below it, array items shown by id or index.
 */
export function yamlNoteCandidates(
  file: string,
  data: unknown,
  issueIds: Set<string>,
): Candidate[] {
  const candidates: Candidate[] = [];
  const fields: readonly string[] = noteFields;
  const visit = (value: unknown, record: string | undefined, path: string, key?: string): void => {
    if (typeof value === 'string') {
      if (key && fields.includes(key) && hasKeyword(value) && !isPointer(value, issueIds))
        candidates.push({
          source_kind: 'corpus_note',
          locator: { file, record: record ?? '(file)', field: path },
          text: value,
        });
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, record, `${path}[${idOf(item) ?? index}]`, key));
      return;
    }
    const id = idOf(value);
    if (!record && id) [record, path] = [id, ''];
    for (const [child, item] of Object.entries(value))
      visit(item, record, path ? `${path}.${child}` : child, child);
  };
  visit(data, undefined, '');
  return candidates;
}
const idOf = (value: unknown): string | undefined =>
  value && typeof value === 'object' && 'id' in value && typeof value.id === 'string'
    ? value.id
    : undefined;

/** `review_finding` candidates across all review records. */
export function findingCandidates(records: ReviewRecord[], issueIds: Set<string>): Candidate[] {
  return records.flatMap((record) =>
    record.findings.flatMap((finding, index) =>
      finding.disposition.status === 'no_change_needed' &&
      hasKeyword(finding.description) &&
      !isPointer(finding.description, issueIds) &&
      !(finding.object_id !== undefined && issueIds.has(finding.object_id))
        ? [
            {
              source_kind: 'review_finding' as const,
              locator: { record: record.id, finding: index },
              text: finding.description,
            },
          ]
        : [],
    ),
  );
}

export function familyFiles(family: Family, root = repoRoot): string[] {
  const { files, exclude = [] } = families[family] as {
    files: readonly string[];
    exclude?: readonly string[];
  };
  return [...new Set(globSync([...files], { cwd: root }))]
    .filter((file) => !exclude.includes(file) && !(file in unscannedFiles))
    .sort();
}

/** Scope files claimed by no family or by several, and unscanned entries that are gone. */
export function familyCoverageProblems(root = repoRoot): string[] {
  const claims = new Map<string, Family[]>();
  for (const family of Object.keys(families) as Family[])
    for (const file of familyFiles(family, root))
      claims.set(file, [...(claims.get(file) ?? []), family]);
  const scope = new Set(globSync(scannedScope, { cwd: root }));
  const problems: string[] = [];
  for (const file of [...scope].sort()) {
    // familyFiles never returns an unscanned file, so the two cases cannot overlap.
    const owners = claims.get(file) ?? [];
    if (!owners.length && !(file in unscannedFiles)) problems.push(`${file}: no family covers it`);
    if (owners.length > 1) problems.push(`${file}: claimed by ${owners.join(', ')}`);
  }
  for (const file of Object.keys(unscannedFiles))
    if (!scope.has(file)) problems.push(`${file}: listed in unscannedFiles but not in scope`);
  return problems;
}

/** Context for the real repository. Reuses the review snapshot's issues and manifest, and the review records. */
export function informalUncertaintyContext(
  snapshot: ReviewSnapshot,
  records: ReviewRecord[],
  root = repoRoot,
): InformalUncertaintyContext {
  const issueIds = new Set(snapshot.issues.map((issue) => issue.id));
  const read = (file: string): string => readFileSync(join(root, file), 'utf8');
  const rulingDocuments = new Map(
    Object.entries(snapshot.documentSourceClasses).flatMap(([id, sourceClass]) =>
      sourceClass === 'official_errata' || sourceClass === 'official_faq'
        ? [[id, sourceClass] as const]
        : [],
    ),
  );
  const yaml = new Map(
    familyFiles('corpus_note', root).map((file) => [file, parse(read(file)) as unknown]),
  );
  const citedRulings = new Set<string>();
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') {
      const { document, heading, locator } = value as Record<string, unknown>;
      if (
        typeof document === 'string' &&
        rulingDocuments.has(document) &&
        typeof heading === 'string'
      ) {
        const row = (locator as { row?: number | string } | undefined)?.row;
        citedRulings.add(rulingKey(document, heading, row));
      }
      Object.values(value).forEach(collect);
    }
  };
  [...yaml.values(), snapshot.issues, records].forEach(collect);

  const candidates = Object.fromEntries(
    (Object.keys(families) as Family[]).map((family) => {
      const { kind } = families[family];
      const found =
        kind === 'corpus_note'
          ? familyFiles(family, root).flatMap((file) =>
              yamlNoteCandidates(file, yaml.get(file), issueIds),
            )
          : kind === 'review_finding'
            ? findingCandidates(records, issueIds)
            : familyFiles(family, root).flatMap((file) =>
                markdownCandidates(file, read(file), kind, issueIds),
              );
      return [family, found];
    }),
  ) as Record<Family, Candidate[]>;

  return {
    candidates,
    issueIds,
    reviewIds: new Set(records.map((record) => record.id)),
    rulingDocuments,
    citedRulings,
  };
}

const validateShape = createAjv().compile<InformalUncertaintyInventory>(
  JSON.parse(
    readFileSync(join(repoRoot, 'tests/fixtures/informal-uncertainty/family.schema.json'), 'utf8'),
  ),
);

const matches = (entry: InventoryEntry, candidate: Candidate): boolean =>
  entry.source_kind === candidate.source_kind &&
  locatorKey(entry.locator) === locatorKey(candidate.locator) &&
  normalise(candidate.text).includes(normalise(entry.excerpt));

const show = (candidate: Candidate): string =>
  `${locatorKey(candidate.locator)} "${normalise(candidate.text).slice(0, 100)}"`;

/** Candidates of `family` that no entry of `inventory` claims: the work list for its audit. */
export function uninventoriedCandidates(
  family: Family,
  inventory: InformalUncertaintyInventory,
  context: InformalUncertaintyContext,
): Candidate[] {
  return context.candidates[family].filter(
    (candidate) => !inventory.entries.some((entry) => matches(entry, candidate)),
  );
}

export function checkInformalUncertainty(
  family: Family,
  value: unknown,
  context: InformalUncertaintyContext,
): string[] {
  if (!validateShape(value))
    return formatErrors(validateShape).map((error) => `inventory ${error}`);
  const inventory = value;
  const problems: string[] = [];
  const seen = new Set<string>();
  const claims = new Map<Candidate, string[]>();

  for (const entry of inventory.entries) {
    const at = (message: string): void => void problems.push(`${entry.id}: ${message}`);
    if (seen.has(entry.id)) at('duplicate id');
    seen.add(entry.id);
    if (/\.p\d+(\.|$)/.test(entry.id)) at('id encodes a page number');
    if (entry.source_kind !== families[family].kind)
      at(`source_kind ${entry.source_kind} does not belong in family ${family}`);

    for (const id of entry.issues ?? [])
      if (!context.issueIds.has(id)) at(`issue ${id} is not in review/ambiguities.yaml`);
    for (const evidence of entry.evidence ?? []) {
      if ('review' in evidence) {
        if (!context.reviewIds.has(evidence.review))
          at(`review record ${evidence.review} does not exist`);
        continue;
      }
      const sourceClass = context.rulingDocuments.get(evidence.document);
      if (!sourceClass)
        at(`ruling document ${evidence.document} is not official_errata or official_faq`);
      else if (sourceClass === 'official_errata' && evidence.row === undefined)
        at(`changelog ruling under ${evidence.heading} names no row`);
      else if (
        !context.citedRulings.has(rulingKey(evidence.document, evidence.heading, evidence.row))
      )
        at(
          `ruling ${evidence.document} ${evidence.heading}${evidence.row === undefined ? '' : ` #${evidence.row}`} is cited by no source reference`,
        );
    }

    const matched = context.candidates[family].filter((candidate) => matches(entry, candidate));
    if (!matched.length) at('matches no candidate note (gone, or locator/excerpt wrong)');
    else if (matched.length > 1)
      at(`excerpt matches ${matched.length} candidates under its locator; quote more`);
    else claims.set(matched[0]!, [...(claims.get(matched[0]!) ?? []), entry.id]);
  }

  for (const [candidate, ids] of claims)
    if (ids.length > 1) problems.push(`${ids.join(', ')}: claim the same note ${show(candidate)}`);
  for (const candidate of uninventoriedCandidates(family, inventory, context))
    problems.push(`not inventoried: ${show(candidate)}`);
  return problems;
}
