import { beforeAll, describe, expect, it } from 'vitest';
import {
  assessFreshness,
  canonicalJson,
  checkIndependentReviews,
  computeDigest,
  DIGEST_ALGORITHM,
  governingRecord,
  loadReviewSnapshot,
  readReviewRecords,
  type ReviewRecord,
  type ReviewSnapshot,
} from '../../scripts/validate/independent-review.ts';
import { createAjv, getValidator } from '../../scripts/validate/schemas.ts';
import { emptyPilot } from '../../scripts/validate/pilot-files.ts';
import type { Rule, SummaryOfEdge } from '../../scripts/validate/pilot-types.ts';

const doc = 'rulebook.second_printing.eng';
const source = { document: doc, pdf_page: 10, printed_page: 8 };

/** Synthetic corpus: two sections, one term, one rule, one related issue. */
function snapshot(): ReviewSnapshot {
  const pilot = emptyPilot();
  pilot.rules.push({
    id: 'synthetic.rule.one',
    name: 'Rule one',
    section_id: 'section.alpha.sub',
    source: [{ document: doc, file: 'x.pdf', pdf_page: 11, heading: 'Sub' }],
    status: 'extracted',
    confidence: 'high',
    source_text: 'Roll 1d20.',
  } as unknown as Rule);
  return {
    sections: [
      {
        id: 'section.alpha',
        title: 'Alpha',
        kind: 'chapter',
        pdf_start_page: 10,
        pdf_end_page: 11,
      },
      {
        id: 'section.alpha.sub',
        title: 'Sub',
        kind: 'section',
        parent: 'section.alpha',
        pdf_start_page: 11,
        pdf_end_page: 11,
      },
      { id: 'section.beta', title: 'Beta', kind: 'chapter', pdf_start_page: 12, pdf_end_page: 12 },
    ],
    pages: [
      { pdf_page: 10, printed_page: 8 },
      { pdf_page: 11, printed_page: 9 },
      { pdf_page: 12, printed_page: 10 },
    ],
    coverage: [
      { id: 'section.alpha', status: 'extracted', components: { rules: 'extracted' } },
      { id: 'section.alpha.sub', status: 'extracted', components: { rules: 'extracted' } },
      { id: 'section.beta', status: 'mapped' },
    ],
    terms: [
      {
        id: 'term.alpha',
        name: 'Alpha',
        aliases: [],
        related: [],
        section_id: 'section.alpha',
        source: [source],
        definition: 'First.',
      } as ReviewSnapshot['terms'][number],
    ],
    issues: [
      {
        id: 'issue.9001',
        related: ['synthetic.rule.one'],
        source: [source],
        status: 'unresolved',
        type: 'ambiguity',
        summary: 'Unclear.',
      } as ReviewSnapshot['issues'][number],
    ],
    pilot,
    documentIds: [doc],
    canonicalDocumentId: doc,
    sourceSha256: `sha256:${'a'.repeat(64)}`,
  };
}

const scope = ['section.alpha', 'section.alpha.sub'];

function record(snap: ReviewSnapshot, overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  const digest = computeDigest(snap, scope);
  return {
    id: 'review.alpha.1',
    reviewer: {
      kind: 'agent',
      model: 'claude-test',
      run_id: 'run-1',
      independence: {
        authored_extraction: false,
        used_extraction_ledgers: false,
        statement: 'Did not author the extraction; compared only PDF renders and canonical YAML.',
      },
    },
    date: '2026-10-07',
    scope: {
      section_ids: digest.sectionIds,
      pages_inspected: [
        { document: doc, pdf_page: 10, printed_page: 8 },
        { document: doc, pdf_page: 11, printed_page: 9 },
      ],
    },
    examined_objects: digest.objects,
    digest: {
      algorithm: DIGEST_ALGORITHM,
      source_sha256: digest.sourceSha256,
      content_digest: digest.contentDigest,
    },
    findings: [
      {
        kind: 'ok_with_note',
        section_id: 'section.alpha.sub',
        object_id: 'synthetic.rule.one',
        description: 'Wording matches.',
        source: [{ document: doc, pdf_page: 11, printed_page: 9 }],
        disposition: { status: 'no_change_needed' },
      },
    ],
    outcome: 'passed',
    summary: 'Synthetic review.',
    ...overrides,
  };
}

function markReviewed(snap: ReviewSnapshot): void {
  for (const entry of snap.coverage)
    if (scope.includes(entry.id)) {
      entry.status = 'reviewed';
      entry.components = { rules: 'reviewed' };
    }
}

describe('independent review schema', () => {
  const validate = getValidator(createAjv(), 'independentReviews');

  it('accepts a complete record', () => {
    expect(validate([record(snapshot())])).toBe(true);
  });

  it.each([
    ['an agent without a model', (r: ReviewRecord) => delete r.reviewer.model],
    [
      'a reviewer who authored the extraction',
      (r: ReviewRecord) => {
        (r.reviewer.independence as { authored_extraction: boolean }).authored_extraction = true;
      },
    ],
    [
      'a reviewer who used ledgers',
      (r: ReviewRecord) => {
        (r.reviewer.independence as { used_extraction_ledgers: boolean }).used_extraction_ledgers =
          true;
      },
    ],
    ['an id outside review.*', (r: ReviewRecord) => (r.id = 'issue.alpha.1')],
    ['a malformed digest', (r: ReviewRecord) => (r.digest.content_digest = 'abc')],
    [
      'an issue disposition without issue_id',
      (r: ReviewRecord) => {
        r.findings[0]!.disposition = { status: 'recorded_as_issue' } as never;
      },
    ],
    [
      'a corrected disposition without the change',
      (r: ReviewRecord) => {
        r.findings[0]!.disposition = { status: 'corrected' } as never;
      },
    ],
    [
      'an inspected page without pdf_page',
      (r: ReviewRecord) => {
        r.scope.pages_inspected = [{ document: doc, printed_page: 8 }];
      },
    ],
    ['an unknown outcome', (r: ReviewRecord) => ((r as { outcome: string }).outcome = 'ok')],
  ])('rejects %s', (_label, mutate) => {
    const candidate = record(snapshot());
    mutate(candidate);
    expect(validate([candidate])).toBe(false);
  });
});

describe('content digest', () => {
  it('is independent of key order and object order', () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe(
      canonicalJson({ a: [2, { c: 2, d: 1 }], b: 1 }),
    );
    const first = snapshot();
    const second = snapshot();
    second.terms = second.terms.map(
      (term) => Object.fromEntries(Object.entries(term).reverse()) as typeof term,
    );
    second.sections.reverse();
    expect(computeDigest(second, [...scope].reverse())).toEqual(computeDigest(first, scope));
  });

  it('selects scoped sections, their objects and related issues', () => {
    const ids = computeDigest(snapshot(), scope).objects.map((object) => object.id);
    expect(ids).toEqual([
      'issue.9001',
      'section.alpha',
      'section.alpha.sub',
      'synthetic.rule.one',
      'term.alpha',
    ]);
  });

  it('changes when examined content changes and names the object', () => {
    const snap = snapshot();
    const reviewed = record(snap);
    (snap.terms[0] as { definition?: string }).definition = 'Changed.';
    const staleness = assessFreshness(snap, reviewed);
    expect(staleness.fresh).toBe(false);
    expect(staleness.changed).toEqual(['term.alpha']);
  });

  it('reports added objects and a changed source PDF', () => {
    const snap = snapshot();
    const reviewed = record(snap);
    snap.terms.push({ ...snap.terms[0]!, id: 'term.alpha_two' });
    snap.sourceSha256 = `sha256:${'b'.repeat(64)}`;
    const staleness = assessFreshness(snap, reviewed);
    expect(staleness.added).toEqual(['term.alpha_two']);
    expect(staleness.sourceChanged).toBe(true);
  });

  it('ignores promotion to reviewed', () => {
    const snap = snapshot();
    const reviewed = record(snap);
    markReviewed(snap);
    snap.pilot.rules[0]!.status = 'reviewed';
    expect(assessFreshness(snap, reviewed).fresh).toBe(true);
  });
});

describe('reviewed status requires evidence', () => {
  it('accepts reviewed coverage and objects backed by a fresh passing record', () => {
    const snap = snapshot();
    const reviewed = record(snap);
    markReviewed(snap);
    snap.pilot.rules[0]!.status = 'reviewed';
    expect(checkIndependentReviews(snap, [reviewed])).toEqual([]);
  });

  it('rejects reviewed coverage without a record', () => {
    const snap = snapshot();
    markReviewed(snap);
    expect(checkIndependentReviews(snap, [])).toContain(
      'coverage.yaml: "section.alpha" is reviewed but no independent review record covers it',
    );
  });

  it('rejects a reviewed component and object without a record', () => {
    const snap = snapshot();
    snap.coverage[2]!.components = { rules: 'reviewed' };
    snap.pilot.rules[0]!.status = 'reviewed';
    const errors = checkIndependentReviews(snap, []);
    expect(errors).toContain(
      'coverage.yaml: "section.beta" has reviewed component(s) rules but no independent review record covers it',
    );
    expect(errors.some((error) => error.startsWith('synthetic.rule.one: rule is reviewed'))).toBe(
      true,
    );
  });

  it('rejects a record with an open finding', () => {
    const snap = snapshot();
    const reviewed = record(snap);
    reviewed.findings[0]!.disposition = { status: 'open', proposed_correction: 'Fix wording.' };
    markReviewed(snap);
    const errors = checkIndependentReviews(snap, [reviewed]);
    expect(errors).toContain(
      'review.alpha.1: outcome passed requires no open or corrected findings',
    );
    expect(errors).toContain(
      'coverage.yaml: "section.alpha" is reviewed but latest review "review.alpha.1" has 1 open finding(s)',
    );
  });

  it('rejects a failed latest review even when an older one passed', () => {
    const snap = snapshot();
    const passed = record(snap, { date: '2026-10-01' });
    const failed = record(snap, { id: 'review.alpha.2', outcome: 'failed' });
    markReviewed(snap);
    expect(checkIndependentReviews(snap, [passed, failed])).toContain(
      'coverage.yaml: "section.alpha" is reviewed but latest review "review.alpha.2" failed',
    );
  });

  it('orders same-date records by numeric suffix, so .10 governs over .9', () => {
    const snap = snapshot();
    const older = record(snap, { id: 'review.alpha.9' });
    const latest = record(snap, { id: 'review.alpha.10', outcome: 'failed' });
    markReviewed(snap);
    expect(governingRecord([older, latest], 'section.alpha')?.id).toBe('review.alpha.10');
    expect(governingRecord([latest, older], 'section.alpha')?.id).toBe('review.alpha.10');
    expect(checkIndependentReviews(snap, [older, latest])).toContain(
      'coverage.yaml: "section.alpha" is reviewed but latest review "review.alpha.10" failed',
    );
  });

  it('falls back to string order when same-date ids differ in prefix or suffix', () => {
    const snap = snapshot();
    const a = record(snap, { id: 'review.alpha.10' });
    const b = record(snap, { id: 'review.beta.9' });
    const c = record(snap, { id: 'review.alpha.x' });
    expect(governingRecord([a, b], 'section.alpha')?.id).toBe('review.beta.9');
    expect(governingRecord([a, c], 'section.alpha')?.id).toBe('review.alpha.x');
  });

  it('rejects a stale digest, naming the section and the changed object', () => {
    const snap = snapshot();
    const reviewed = record(snap);
    markReviewed(snap);
    snap.pilot.rules[0]!.source_text = 'Roll 2d20.';
    expect(checkIndependentReviews(snap, [reviewed])).toContain(
      'coverage.yaml: "section.alpha.sub" is reviewed but latest review "review.alpha.1" is stale (changed: synthetic.rule.one); re-review required',
    );
  });

  it('explains that only rows reviewed as extracted may be promoted', () => {
    const snap = snapshot();
    snap.coverage[0]!.status = 'mapped';
    const reviewed = record(snap);
    markReviewed(snap);
    const hint =
      'is stale (changed: section.alpha; a scoped section or coverage row differs from the reviewed one, and only rows reviewed as extracted may be promoted); re-review required';
    expect(checkIndependentReviews(snap, [reviewed])).toEqual([
      `coverage.yaml: "section.alpha" is reviewed but latest review "review.alpha.1" ${hint}`,
      `coverage.yaml: "section.alpha.sub" is reviewed but latest review "review.alpha.1" ${hint}`,
    ]);
  });

  it('treats a stale record that backs nothing as history, not an error', () => {
    const snap = snapshot();
    const reviewed = record(snap);
    snap.pilot.rules[0]!.source_text = 'Roll 2d20.';
    expect(checkIndependentReviews(snap, [reviewed])).toEqual([]);
  });

  it('rejects unresolved and inconsistent ids', () => {
    const snap = snapshot();
    const reviewed = record(snap);
    reviewed.scope.section_ids.push('section.missing');
    reviewed.findings.push(
      {
        kind: 'uncertainty_not_recorded',
        section_id: 'section.beta',
        object_id: 'term.unknown',
        description: 'Outside scope.',
        source: [{ document: 'unknown.book' }],
        disposition: { status: 'recorded_as_issue', issue_id: 'issue.0000_missing' },
      },
      {
        kind: 'missing_extraction',
        section_id: 'section.alpha',
        description: 'A modifier is not extracted.',
        source: [source],
        disposition: { status: 'corrected', change: 'Added rule.' },
      },
    );
    const errors = checkIndependentReviews(snap, [reviewed, reviewed]);
    expect(errors).toEqual(
      expect.arrayContaining([
        'review/independent: duplicate id "review.alpha.1"',
        'review.alpha.1: unknown section "section.missing"',
        'review.alpha.1: content_digest does not match its examined_objects; regenerate with `npm run review`',
        'review.alpha.1: finding 2 section "section.beta" is outside the review scope',
        'review.alpha.1: finding 2 object "term.unknown" is not among examined_objects',
        'review.alpha.1: finding 2 issue "issue.0000_missing" is not in review/ambiguities.yaml',
        'review.alpha.1: finding 2 unknown document "unknown.book"',
        'review.alpha.1: outcome passed requires no open or corrected findings',
      ]),
    );
  });

  it('requires a passing review to inspect every page of its sections', () => {
    const snap = snapshot();
    const reviewed = record(snap);
    reviewed.scope.pages_inspected = [{ document: doc, pdf_page: 10, printed_page: 7 }];
    expect(checkIndependentReviews(snap, [reviewed])).toEqual([
      'review.alpha.1: printed/pdf page mismatch at pdf page 10; use pages.yaml',
      'review.alpha.1: section "section.alpha" pdf page(s) 11 not inspected',
      'review.alpha.1: section "section.alpha.sub" pdf page(s) 11 not inspected',
    ]);
  });

  it('requires passed_with_corrections to record a verified correction', () => {
    const snap = snapshot();
    expect(
      checkIndependentReviews(snap, [record(snap, { outcome: 'passed_with_corrections' })]),
    ).toEqual([
      'review.alpha.1: outcome passed_with_corrections requires at least one corrected finding',
    ]);
  });
});

/**
 * Canonical edges and summaries (`corpus/graph/`) that no fresh, passing review examined: each
 * must lie in a `reviewed` section whose governing record could back `reviewed` for it. Reuses
 * the validator's promotion rule by claiming every edge `reviewed` (the digest hashes that as
 * `extracted`, so freshness is unchanged) and keeping only the edge messages.
 */
function edgeEvidenceGaps(snap: ReviewSnapshot, records: ReviewRecord[]): string[] {
  const edges = snap.pilot.edges;
  const reviewedSections = new Set(
    snap.coverage.filter((entry) => entry.status === 'reviewed').map((entry) => entry.id),
  );
  const claimed: ReviewSnapshot = {
    ...snap,
    pilot: { ...snap.pilot, edges: edges.map((edge) => ({ ...edge, status: 'reviewed' })) },
  };
  const blockers = checkIndependentReviews(claimed, records);
  return edges.flatMap((edge) => [
    ...(reviewedSections.has(edge.section_id)
      ? []
      : [`${edge.id}: section "${edge.section_id}" is not reviewed`]),
    ...blockers.filter((message) => message.startsWith(`${edge.id}: `)),
  ]);
}

function summaryEdge(sectionId: string): SummaryOfEdge {
  return {
    id: 'edge.summary.synthetic',
    name: 'Alpha summarises the rule',
    section_id: sectionId,
    source: [{ document: doc, file: 'x.pdf', pdf_page: 11, heading: 'Sub' }],
    status: 'extracted',
    confidence: 'high',
    source_text: 'See the rule.',
    relation: 'summary_of',
    from: 'section.alpha',
    to: 'synthetic.rule.one',
  } as unknown as SummaryOfEdge;
}

describe('canonical edges need review evidence', () => {
  it('accepts an edge examined by the fresh passing record of its reviewed section', () => {
    const snap = snapshot();
    snap.pilot.edges.push(summaryEdge('section.alpha.sub'));
    const reviewed = record(snap);
    markReviewed(snap);
    expect(edgeEvidenceGaps(snap, [reviewed])).toEqual([]);
  });

  it('rejects an edge added after its section was reviewed', () => {
    const snap = snapshot();
    const reviewed = record(snap);
    markReviewed(snap);
    snap.pilot.edges.push(summaryEdge('section.alpha.sub'));
    expect(edgeEvidenceGaps(snap, [reviewed])).toEqual([
      'edge.summary.synthetic: edge is reviewed but section "section.alpha.sub" latest review "review.alpha.1" is stale (added: edge.summary.synthetic); re-review required',
    ]);
  });

  it('rejects an edge whose section no record covers or is not reviewed', () => {
    const snap = snapshot();
    snap.pilot.edges.push(summaryEdge('section.beta'));
    expect(edgeEvidenceGaps(snap, [record(snap)])).toEqual([
      'edge.summary.synthetic: section "section.beta" is not reviewed',
      'edge.summary.synthetic: edge is reviewed but section "section.beta" no independent review record covers it',
    ]);
  });
});

/**
 * Edges T11 (Phase 9) must have re-reviewed. Empty: the 2026-11-24 audit found every canonical
 * edge and summary examined by a fresh passing record.
 */
const PENDING_EDGE_REVIEWS: string[] = [];

describe('committed canonical edges', () => {
  let gaps: string[];
  beforeAll(() => {
    gaps = edgeEvidenceGaps(loadReviewSnapshot(), readReviewRecords());
  }, 60_000);

  it('are each examined by a fresh passing review, apart from the pending list', () => {
    const uncovered = [...new Set(gaps.map((gap) => gap.slice(0, gap.indexOf(':'))))];
    expect(uncovered).toEqual(PENDING_EDGE_REVIEWS);
  });
});
