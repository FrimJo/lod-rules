/**
 * Independent review evidence (Phase 9).
 *
 * A review record says that a reviewer other than the extractor compared a set of sections
 * with the rendered PDF. The record pins what it examined with a content digest, so any later
 * material edit makes the evidence stale until it is re-reviewed. Coverage may only claim
 * `reviewed` through a current, passing, fresh record.
 *
 * Digest algorithm `lod-review-digest/v1`:
 *
 * 1. Select the examined objects for the scoped sections: each section itself (its
 *    sections.yaml record plus its coverage row), every term, rule, table, entity, procedure,
 *    state machine and test case whose top-level `section_id` is in scope, and every issue
 *    whose `related` list names a scoped section or a selected object.
 * 2. Normalise review bookkeeping so the act of promoting does not invalidate the evidence:
 *    `status: reviewed` becomes `extracted` on objects and coverage rows/components.
 * 3. Object digest = sha256 of canonical JSON of `{ kind, id, content }`. Canonical JSON sorts
 *    object keys by code point at every depth, keeps array order, and has no whitespace, so it
 *    is independent of YAML layout, key order, comments and which file holds the object.
 * 4. Content digest = sha256 of canonical JSON of `{ algorithm, source_sha256, sections, objects }`
 *    where `sections` is the sorted scoped section ids, `objects` is `[id, kind, digest]` sorted
 *    by id, and `source_sha256` is the SHA-256 of the canonical PDF bytes.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { CoverageEntry, Issue, Page, Section, SourceReference, Term } from './integrity.ts';
import { readPilot } from './pilot-files.ts';
import type { Metadata, Pilot } from './pilot-types.ts';
import { repoRoot } from './schemas.ts';

export const DIGEST_ALGORITHM = 'lod-review-digest/v1';
export const reviewRoot = 'review/independent';

export type ExaminedKind =
  | 'section'
  | 'term'
  | 'rule'
  | 'table'
  | 'entity'
  | 'procedure'
  | 'state_machine'
  | 'test_case'
  | 'issue';

export interface ExaminedObject {
  id: string;
  kind: ExaminedKind;
  digest: string;
}

export type Disposition =
  | { status: 'corrected'; change: string }
  | { status: 'recorded_as_issue'; issue_id: string }
  | { status: 'no_change_needed' }
  | { status: 'open'; proposed_correction?: string };

export interface Finding {
  kind: string;
  section_id: string;
  object_id?: string;
  description: string;
  source: SourceReference[];
  disposition: Disposition;
}

/** Mirrors schemas/independent-review.schema.json; only read records after schema validation. */
export interface ReviewRecord {
  id: string;
  reviewer: {
    kind: 'agent' | 'human';
    model?: string;
    run_id?: string;
    name?: string;
    independence: {
      authored_extraction: false;
      used_extraction_ledgers: false;
      statement: string;
    };
  };
  date: string;
  scope: { section_ids: string[]; pages_inspected: SourceReference[] };
  examined_objects: ExaminedObject[];
  digest: { algorithm: string; source_sha256: string; content_digest: string };
  findings: Finding[];
  outcome: 'passed' | 'passed_with_corrections' | 'failed';
  summary: string;
  supporting_evidence?: string[];
}

/** Everything the digest and the review checks read. Built from validated canonical YAML. */
export interface ReviewSnapshot {
  sections: Section[];
  pages: Page[];
  coverage: CoverageEntry[];
  terms: Term[];
  issues: Issue[];
  pilot: Pilot;
  documentIds: string[];
  canonicalDocumentId: string;
  /** `sha256:<hex>` of the canonical PDF bytes. */
  sourceSha256: string;
}

export interface DigestResult {
  sectionIds: string[];
  objects: ExaminedObject[];
  sourceSha256: string;
  contentDigest: string;
}

const pilotKinds: Record<keyof Pilot, ExaminedKind> = {
  rules: 'rule',
  tables: 'table',
  entities: 'entity',
  procedures: 'procedure',
  stateMachines: 'state_machine',
  testCases: 'test_case',
};

/** JSON with keys sorted by code point at every depth. `undefined` members are dropped. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, member]) => member !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member)}`).join(',')}}`;
}

export function sha256(text: string | Buffer): string {
  return `sha256:${createHash('sha256').update(text).digest('hex')}`;
}

const unreviewed = (status: string | undefined): string | undefined =>
  status === 'reviewed' ? 'extracted' : status;

function normaliseCoverage(entry: CoverageEntry | undefined): unknown {
  if (!entry) return null;
  return {
    status: unreviewed(entry.status),
    components: entry.components
      ? Object.fromEntries(
          Object.entries(entry.components).map(([key, value]) => [key, unreviewed(value)]),
        )
      : undefined,
    notes: entry.notes,
  };
}

export function objectDigest(kind: ExaminedKind, id: string, content: unknown): string {
  return sha256(canonicalJson({ kind, id, content }));
}

/** Combines per-object digests; also used to check a record against its own object list. */
export function combineDigest(
  sectionIds: string[],
  objects: ExaminedObject[],
  sourceSha256: string,
): string {
  const sortedObjects = [...objects]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((object) => [object.id, object.kind, object.digest]);
  return sha256(
    canonicalJson({
      algorithm: DIGEST_ALGORITHM,
      source_sha256: sourceSha256,
      sections: [...new Set(sectionIds)].sort(),
      objects: sortedObjects,
    }),
  );
}

/** Section ids plus every descendant, in sections.yaml order. */
export function expandDescendants(snapshot: ReviewSnapshot, sectionIds: string[]): string[] {
  const wanted = new Set(sectionIds);
  let grew = true;
  while (grew) {
    grew = false;
    for (const section of snapshot.sections) {
      if (section.parent && wanted.has(section.parent) && !wanted.has(section.id)) {
        wanted.add(section.id);
        grew = true;
      }
    }
  }
  return snapshot.sections.map((section) => section.id).filter((id) => wanted.has(id));
}

/** Examined objects for the given sections. Unknown section ids are skipped; callers check. */
export function computeDigest(snapshot: ReviewSnapshot, sectionIds: string[]): DigestResult {
  const scope = new Set(sectionIds);
  const objects: ExaminedObject[] = [];
  const add = (kind: ExaminedKind, id: string, content: unknown): void => {
    objects.push({ id, kind, digest: objectDigest(kind, id, content) });
  };
  const coverage = new Map(snapshot.coverage.map((entry) => [entry.id, entry]));

  for (const section of snapshot.sections) {
    if (!scope.has(section.id)) continue;
    add('section', section.id, {
      section,
      coverage: normaliseCoverage(coverage.get(section.id)),
    });
  }
  for (const term of snapshot.terms) {
    if (scope.has(term.section_id)) add('term', term.id, term);
  }
  for (const [key, kind] of Object.entries(pilotKinds) as Array<[keyof Pilot, ExaminedKind]>) {
    for (const entry of snapshot.pilot[key] as Metadata[]) {
      if (!scope.has(entry.section_id)) continue;
      add(kind, entry.id, { ...entry, status: unreviewed(entry.status) });
    }
  }
  const selected = new Set([...scope, ...objects.map((object) => object.id)]);
  for (const issue of snapshot.issues) {
    if (issue.related.some((id) => selected.has(id))) add('issue', issue.id, issue);
  }

  objects.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const sorted = [...scope].sort();
  return {
    sectionIds: sorted,
    objects,
    sourceSha256: snapshot.sourceSha256,
    contentDigest: combineDigest(sorted, objects, snapshot.sourceSha256),
  };
}

export interface Staleness {
  fresh: boolean;
  added: string[];
  removed: string[];
  changed: string[];
  sourceChanged: boolean;
}

/** Compares a record with the current corpus and names what moved. */
export function assessFreshness(snapshot: ReviewSnapshot, record: ReviewRecord): Staleness {
  const current = computeDigest(snapshot, record.scope.section_ids);
  const recorded = new Map(record.examined_objects.map((object) => [object.id, object.digest]));
  const now = new Map(current.objects.map((object) => [object.id, object.digest]));
  return {
    fresh:
      record.digest.algorithm === DIGEST_ALGORITHM &&
      current.contentDigest === record.digest.content_digest,
    added: [...now.keys()].filter((id) => !recorded.has(id)),
    removed: [...recorded.keys()].filter((id) => !now.has(id)),
    changed: [...now]
      .filter(([id, digest]) => recorded.has(id) && recorded.get(id) !== digest)
      .map(([id]) => id),
    sourceChanged: record.digest.source_sha256 !== snapshot.sourceSha256,
  };
}

export function describeStaleness(staleness: Staleness): string {
  const parts: string[] = [];
  if (staleness.sourceChanged) parts.push('source PDF changed');
  if (staleness.changed.length) parts.push(`changed: ${staleness.changed.join(', ')}`);
  if (staleness.added.length) parts.push(`added: ${staleness.added.join(', ')}`);
  if (staleness.removed.length) parts.push(`removed: ${staleness.removed.join(', ')}`);
  return parts.length ? parts.join('; ') : 'digest mismatch';
}

/** Latest record (by date, then id) whose scope includes the section. */
export function governingRecord(
  records: ReviewRecord[],
  sectionId: string,
): ReviewRecord | undefined {
  return records
    .filter((record) => record.scope.section_ids.includes(sectionId))
    .sort((a, b) =>
      a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.id < b.id ? 1 : a.id > b.id ? -1 : 0,
    )[0];
}

/** Why a record cannot back `reviewed` for a section, or undefined when it can. */
function reviewBlocker(
  snapshot: ReviewSnapshot,
  records: ReviewRecord[],
  sectionId: string,
): string | undefined {
  const record = governingRecord(records, sectionId);
  if (!record) return 'no independent review record covers it';
  if (record.outcome === 'failed') return `latest review "${record.id}" failed`;
  const open = record.findings.filter((finding) => finding.disposition.status === 'open');
  if (open.length) return `latest review "${record.id}" has ${open.length} open finding(s)`;
  const staleness = assessFreshness(snapshot, record);
  if (!staleness.fresh) {
    // Promotion hashes as `extracted`, so a row reviewed while mapped/extracting differs here.
    const hint = staleness.changed.some((id) => record.scope.section_ids.includes(id))
      ? '; a scoped section or coverage row differs from the reviewed one, and only rows reviewed as extracted may be promoted'
      : '';
    return `latest review "${record.id}" is stale (${describeStaleness(staleness)}${hint}); re-review required`;
  }
  return undefined;
}

function checkRecord(snapshot: ReviewSnapshot, record: ReviewRecord): string[] {
  const errors: string[] = [];
  const at = (message: string): void => void errors.push(`${record.id}: ${message}`);
  const sections = new Map(snapshot.sections.map((section) => [section.id, section]));
  const pages = new Map(snapshot.pages.map((page) => [page.pdf_page, page]));
  const issues = new Set(snapshot.issues.map((issue) => issue.id));
  const documents = new Set(snapshot.documentIds);
  const examined = new Set<string>();

  for (const id of record.scope.section_ids) {
    if (!sections.has(id)) at(`unknown section "${id}"`);
  }
  for (const object of record.examined_objects) {
    if (examined.has(object.id)) at(`duplicate examined object "${object.id}"`);
    examined.add(object.id);
  }
  for (const id of record.scope.section_ids) {
    if (sections.has(id) && !examined.has(id)) at(`examined_objects omits section "${id}"`);
  }
  const selfDigest = combineDigest(
    record.scope.section_ids,
    record.examined_objects,
    record.digest.source_sha256,
  );
  if (selfDigest !== record.digest.content_digest)
    at('content_digest does not match its examined_objects; regenerate with `npm run review`');

  const inspected = new Set<number>();
  for (const page of record.scope.pages_inspected) {
    if (page.document !== snapshot.canonicalDocumentId) {
      at(`inspected page must cite the canonical document, not "${page.document}"`);
      continue;
    }
    if (typeof page.pdf_page !== 'number') continue;
    inspected.add(page.pdf_page);
    const known = pages.get(page.pdf_page);
    if (!known) at(`unknown pdf page ${page.pdf_page}`);
    else if ((page.printed_page ?? null) !== (known.printed_page ?? null))
      at(`printed/pdf page mismatch at pdf page ${page.pdf_page}; use pages.yaml`);
  }
  if (record.outcome !== 'failed') {
    for (const id of record.scope.section_ids) {
      const section = sections.get(id);
      const start = section?.pdf_start_page;
      const end = section?.pdf_end_page ?? start;
      if (typeof start !== 'number' || typeof end !== 'number') continue;
      const missing: number[] = [];
      for (let page = start; page <= end; page += 1) if (!inspected.has(page)) missing.push(page);
      if (missing.length) at(`section "${id}" pdf page(s) ${missing.join(', ')} not inspected`);
    }
  }

  const statuses = record.findings.map((finding) => finding.disposition.status);
  const scope = new Set(record.scope.section_ids);
  record.findings.forEach((finding, index) => {
    const label = `finding ${index + 1}`;
    if (!scope.has(finding.section_id))
      at(`${label} section "${finding.section_id}" is outside the review scope`);
    if (finding.object_id !== undefined && !examined.has(finding.object_id))
      at(`${label} object "${finding.object_id}" is not among examined_objects`);
    if (
      finding.disposition.status === 'recorded_as_issue' &&
      !issues.has(finding.disposition.issue_id)
    )
      at(`${label} issue "${finding.disposition.issue_id}" is not in review/ambiguities.yaml`);
    for (const source of finding.source) {
      if (!documents.has(source.document)) at(`${label} unknown document "${source.document}"`);
    }
  });
  if (record.outcome === 'passed' && statuses.some((s) => s === 'open' || s === 'corrected'))
    at('outcome passed requires no open or corrected findings');
  if (record.outcome === 'passed_with_corrections') {
    if (statuses.includes('open')) at('outcome passed_with_corrections requires no open findings');
    if (!statuses.includes('corrected'))
      at('outcome passed_with_corrections requires at least one corrected finding');
  }
  if (record.outcome === 'failed' && record.findings.length === 0)
    at('outcome failed requires at least one finding');
  return errors;
}

/**
 * Record integrity plus the promotion rule: a coverage row, coverage component or canonical
 * object may be `reviewed` only through a fresh, passing review record without open findings.
 * A stale record is not an error on its own; it just stops backing `reviewed`.
 */
export function checkIndependentReviews(
  snapshot: ReviewSnapshot,
  records: ReviewRecord[],
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) errors.push(`review/independent: duplicate id "${record.id}"`);
    seen.add(record.id);
    errors.push(...checkRecord(snapshot, record));
  }

  for (const entry of snapshot.coverage) {
    const components = Object.entries(entry.components ?? {}).filter(
      ([, status]) => status === 'reviewed',
    );
    if (entry.status !== 'reviewed' && components.length === 0) continue;
    const claim =
      entry.status === 'reviewed'
        ? 'is reviewed'
        : `has reviewed component(s) ${components.map(([key]) => key).join(', ')}`;
    const blocker = reviewBlocker(snapshot, records, entry.id);
    if (blocker) errors.push(`coverage.yaml: "${entry.id}" ${claim} but ${blocker}`);
  }

  for (const [key, kind] of Object.entries(pilotKinds) as Array<[keyof Pilot, ExaminedKind]>) {
    for (const entry of snapshot.pilot[key] as Metadata[]) {
      if (entry.status !== 'reviewed') continue;
      const blocker = reviewBlocker(snapshot, records, entry.section_id);
      if (blocker) {
        errors.push(
          `${entry.id}: ${kind} is reviewed but section "${entry.section_id}" ${blocker}`,
        );
        continue;
      }
      const record = governingRecord(records, entry.section_id);
      if (!record?.examined_objects.some((object) => object.id === entry.id))
        errors.push(`${entry.id}: ${kind} is reviewed but "${record?.id}" did not examine it`);
    }
  }
  return errors;
}

export function sourceFingerprint(path: string): string {
  return sha256(readFileSync(path));
}

/** Review record files, sorted. The directory may not exist before the first review. */
export function discoverReviewFiles(root = repoRoot): string[] {
  const directory = join(root, reviewRoot);
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
    .map((entry) => `${reviewRoot}/${entry.name}`)
    .sort();
}

interface ManifestShape {
  documents: Array<{ id: string; file: string; canonical: boolean }>;
  external_sources?: Array<{ id: string }>;
}

/** Snapshot for the CLI. Pilot collections are schema-validated by readPilot. */
export function loadReviewSnapshot(root = repoRoot): ReviewSnapshot {
  const read = (path: string): unknown => parse(readFileSync(join(root, path), 'utf8'));
  const manifest = read('source/manifest.yaml') as ManifestShape;
  const canonical = manifest.documents.find((document) => document.canonical);
  if (!canonical) throw new Error('source/manifest.yaml declares no canonical document');
  return {
    sections: read('corpus/source-map/sections.yaml') as Section[],
    pages: read('corpus/source-map/pages.yaml') as Page[],
    coverage: (read('corpus/source-map/coverage.yaml') as { sections: CoverageEntry[] }).sections,
    terms: read('corpus/glossary/terms.yaml') as Term[],
    issues: read('review/ambiguities.yaml') as Issue[],
    pilot: readPilot(root),
    documentIds: [
      ...manifest.documents.map((document) => document.id),
      ...(manifest.external_sources ?? []).map((source) => source.id),
    ],
    canonicalDocumentId: canonical.id,
    sourceSha256: sourceFingerprint(join(root, 'source', canonical.file)),
  };
}

export function readReviewRecords(root = repoRoot): ReviewRecord[] {
  return discoverReviewFiles(root).flatMap(
    (path) => (parse(readFileSync(join(root, path), 'utf8')) as ReviewRecord[] | null) ?? [],
  );
}
