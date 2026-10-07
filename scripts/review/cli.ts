import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { parse, stringify } from 'yaml';
import {
  DIGEST_ALGORITHM,
  assessFreshness,
  checkIndependentReviews,
  computeDigest,
  describeStaleness,
  discoverReviewFiles,
  expandDescendants,
  loadReviewSnapshot,
  type ReviewRecord,
} from '../validate/independent-review.ts';
import { createAjv, formatErrors, getValidator, repoRoot } from '../validate/schemas.ts';

const usage = `Usage: npm run review -- <command> [options]

Commands:
  digest <section-id...>  Examined objects, pages to render and the content digest for a review
                          unit. --descendants adds every subsection of the given sections.
  check                   Validate review/independent/*.yaml and list stale or invalid records.

The digest output is YAML to paste into a record under review/independent/. Compute it last,
after any new issues are written to review/ambiguities.yaml, because related issues are part
of the digest.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    descendants: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
});
const [command, ...rest] = positionals;

function digest(sectionIds: string[]): number {
  if (sectionIds.length === 0) {
    console.error('digest needs at least one section id');
    return 1;
  }
  const snapshot = loadReviewSnapshot();
  const known = new Set(snapshot.sections.map((section) => section.id));
  const unknown = sectionIds.filter((id) => !known.has(id));
  if (unknown.length) {
    console.error(`Unknown section id(s): ${unknown.join(', ')}`);
    return 1;
  }
  const scope = values.descendants ? expandDescendants(snapshot, sectionIds) : sectionIds;
  const result = computeDigest(snapshot, scope);
  const pages = new Map(snapshot.pages.map((page) => [page.pdf_page, page]));
  const toInspect = new Set<number>();
  for (const section of snapshot.sections) {
    if (!result.sectionIds.includes(section.id)) continue;
    const start = section.pdf_start_page;
    const end = section.pdf_end_page ?? start;
    if (typeof start !== 'number' || typeof end !== 'number') continue;
    for (let page = start; page <= end; page += 1) toInspect.add(page);
  }
  console.log(
    stringify({
      scope: {
        section_ids: result.sectionIds,
        pages_inspected: [...toInspect]
          .sort((a, b) => a - b)
          .map((pdfPage) => ({
            document: snapshot.canonicalDocumentId,
            file: 'source/Rulebook-2nd-printing-ENGa.pdf',
            pdf_page: pdfPage,
            printed_page: pages.get(pdfPage)?.printed_page ?? null,
          })),
      },
      examined_objects: result.objects,
      digest: {
        algorithm: DIGEST_ALGORITHM,
        source_sha256: result.sourceSha256,
        content_digest: result.contentDigest,
      },
    }),
  );
  return 0;
}

function check(): number {
  const ajv = createAjv();
  const validate = getValidator(ajv, 'independentReviews');
  const records: ReviewRecord[] = [];
  const problems: string[] = [];
  for (const path of discoverReviewFiles()) {
    const data: unknown = parse(readFileSync(join(repoRoot, path), 'utf8'));
    if (!validate(data)) {
      problems.push(...formatErrors(validate).map((message) => `${path}: ${message}`));
      continue;
    }
    records.push(...((data as ReviewRecord[] | null) ?? []));
  }
  const snapshot = loadReviewSnapshot();
  problems.push(...checkIndependentReviews(snapshot, records));

  for (const record of records) {
    const staleness = assessFreshness(snapshot, record);
    const state = staleness.fresh ? 'fresh' : `stale (${describeStaleness(staleness)})`;
    console.log(`${record.id}  ${record.outcome}  ${record.date}  ${state}`);
  }
  if (records.length === 0) console.log('No independent review records.');
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    return 1;
  }
  return 0;
}

if (values.help || !command) {
  console.log(usage);
  process.exit(command || values.help ? 0 : 1);
}
if (command === 'digest') process.exit(digest(rest));
if (command === 'check') process.exit(check());
console.error(`Unknown command "${command}"\n\n${usage}`);
process.exit(1);
