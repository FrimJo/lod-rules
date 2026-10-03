import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createAjv, formatErrors, repoRoot } from '../../scripts/validate/schemas.ts';
/** Test-owned acceptance contract. It does not mark corpus sections extracted. */
export interface LifecycleSource {
  document: 'rulebook.second_printing.eng';
  file: 'source/Rulebook-2nd-printing-ENGa.pdf';
  pdf_page: number;
  printed_page: number | null;
  heading: string;
}
export interface LifecycleObligation {
  id: string;
  behavior: string;
  disposition: 'implemented' | 'shared_model' | 'nonprocedural' | 'source_limitation' | 'pending';
  canonical_object_ids: string[];
  tests: { file: string; name: string }[];
  source: LifecycleSource[];
  shared_behavior: string;
  limitations: { fact: string; review_id: string }[];
  remaining_work: string[];
}
export type LifecycleDisposition =
  'implemented' | 'covered_by_another_model' | 'nonprocedural' | 'source_limitation' | 'pending';
export interface LifecycleEntry {
  section_id: string;
  disposition: LifecycleDisposition;
  scope: string;
  canonical_object_ids: string[];
  evidence: string[];
  source_limitations: string[];
  remaining_work: string[];
  notes: string;
  source: LifecycleSource[];
  obligations: LifecycleObligation[];
}
export interface LifecycleManifest {
  package: 'F';
  status: 'open' | 'accepted';
  inventory: string;
  entries: LifecycleEntry[];
}
export interface AcceptanceReferences {
  inventoryIds: Set<string>;
  sectionIds: Set<string>;
  canonicalIds: Set<string>;
  reviewIds: Set<string>;
  exists: (path: string) => boolean;
  read: (path: string) => string;
  pages: Map<number, number | null>;
}
const validateShape = createAjv().compile<LifecycleManifest>(
  JSON.parse(
    readFileSync(join(repoRoot, 'tests/fixtures/acceptance/package-f.schema.json'), 'utf8'),
  ),
);
export function parseLifecycleManifest(value: unknown): LifecycleManifest {
  if (!validateShape(value)) throw new Error(formatErrors(validateShape).join('\n'));
  return value;
}
export function lifecycleAcceptanceErrors(
  value: unknown,
  refs: AcceptanceReferences,
  final?: boolean,
): string[] {
  if (!validateShape(value))
    return formatErrors(validateShape).map((x) => `Invalid manifest: ${x}`);
  const manifest = value;
  const accepting = final ?? manifest.status === 'accepted';
  const errors: string[] = [];
  if (accepting && manifest.status !== 'accepted') errors.push('Package F status is not accepted');
  const seen = new Set<string>();
  const validPath = (file: string) =>
    !file.startsWith('/') && !file.split('/').includes('..') && refs.exists(file);
  const sources = (items: LifecycleSource[], id: string) => {
    for (const source of items)
      if (
        !refs.pages.has(source.pdf_page) ||
        refs.pages.get(source.pdf_page) !== source.printed_page
      )
        errors.push(`${id}: source page label does not match page map`);
  };
  if (!refs.exists(manifest.inventory)) errors.push('Missing source inventory');
  for (const row of manifest.entries) {
    const id = row.section_id;
    if (seen.has(id)) errors.push(`${id}: duplicate entry`);
    seen.add(id);
    if (!refs.inventoryIds.has(id)) errors.push(`${id}: outside heading inventory`);
    if (!refs.sectionIds.has(id)) errors.push(`${id}: unknown section`);
    if (!row.scope.trim() || !row.notes.trim())
      errors.push(`${id}: missing scope or disposition evidence`);
    if (!row.evidence.length) errors.push(`${id}: missing evidence`);
    for (const file of row.evidence) {
      if (!validPath(file)) errors.push(`${id}: invalid evidence path ${file}`);
    }
    for (const object of row.canonical_object_ids)
      if (!refs.canonicalIds.has(object)) errors.push(`${id}: unknown canonical object ${object}`);
    for (const issue of row.source_limitations)
      if (!refs.reviewIds.has(issue)) errors.push(`${id}: unknown source limitation ${issue}`);
    if (
      ['implemented', 'covered_by_another_model'].includes(row.disposition) &&
      !row.canonical_object_ids.length
    )
      errors.push(`${id}: implemented disposition needs canonical objects`);
    if (row.disposition === 'source_limitation' && !row.source_limitations.length)
      errors.push(`${id}: source limitation needs a review record`);
    if (row.disposition === 'pending' && !row.remaining_work.length)
      errors.push(`${id}: pending work must be named`);
    sources(row.source, id);
    const obligationIds = new Set<string>();
    for (const obligation of row.obligations) {
      const key = `${id}/${obligation.id}`;
      if (obligationIds.has(obligation.id)) errors.push(`${key}: duplicate obligation`);
      obligationIds.add(obligation.id);
      sources(obligation.source, key);
      for (const object of obligation.canonical_object_ids)
        if (!refs.canonicalIds.has(object) || !row.canonical_object_ids.includes(object))
          errors.push(`${key}: unsupported canonical evidence ${object}`);
      for (const test of obligation.tests)
        if (
          !validPath(test.file) ||
          !test.file.startsWith('tests/') ||
          !refs.read(test.file).includes(test.name)
        )
          errors.push(`${key}: missing regression evidence ${test.file}: ${test.name}`);
      for (const limitation of obligation.limitations)
        if (
          !refs.reviewIds.has(limitation.review_id) ||
          !row.source_limitations.includes(limitation.review_id)
        )
          errors.push(`${key}: unsupported source limitation ${limitation.review_id}`);
      if (
        ['implemented', 'shared_model'].includes(obligation.disposition) &&
        (!obligation.canonical_object_ids.length || !obligation.tests.length)
      )
        errors.push(`${key}: behavior needs canonical and regression evidence`);
      if (obligation.disposition === 'shared_model' && !obligation.shared_behavior.trim())
        errors.push(`${key}: shared model must identify contributed behavior`);
      if (obligation.disposition === 'source_limitation' && !obligation.limitations.length)
        errors.push(`${key}: undefined or unavailable fact needs a review record`);
      if (obligation.disposition === 'pending' && !obligation.remaining_work.length)
        errors.push(`${key}: pending behavior must name implementation work`);
      if (obligation.remaining_work.length && obligation.disposition !== 'pending')
        errors.push(`${key}: implementation gap must remain pending`);
      if (row.disposition !== 'pending' && obligation.disposition === 'pending')
        errors.push(`${key}: unsupported completed heading disposition`);
      if (accepting && (obligation.disposition === 'pending' || obligation.remaining_work.length))
        errors.push(`${key}: pending behavior prevents acceptance`);
    }
    if (
      row.disposition === 'covered_by_another_model' &&
      !row.obligations.some((x) => x.disposition === 'shared_model')
    )
      errors.push(`${id}: shared disposition needs contributed behavior`);
    if (accepting && (row.disposition === 'pending' || row.remaining_work.length))
      errors.push(`${id}: pending extraction prevents acceptance`);
  }
  for (const id of refs.inventoryIds)
    if (!seen.has(id)) errors.push(`${id}: missing inventory disposition`);
  return errors;
}
