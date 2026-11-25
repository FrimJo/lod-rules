import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { deriveGraph } from '../../scripts/graph/derive.ts';
import { buildSearchDocuments } from '../../scripts/retrieve/documents.ts';
import { loadRetrievalCorpus } from '../../scripts/retrieve/load.ts';
import { createAjv, repoRoot } from '../../scripts/validate/schemas.ts';
import {
  acceptanceErrors,
  evidenceProblems,
  evidenceProperties,
  nonEmptyString,
  strictObject,
  type ChecklistEvidence,
} from '../support/exit-checklist.ts';
import { CATEGORY_MINIMUMS, type AcceptanceFixture } from '../support/retrieval-acceptance.ts';

type Criterion = ChecklistEvidence & { id: string; requirement: string };
interface Checklist {
  scope: string;
  status: 'open' | 'accepted';
  plan: string;
  criteria: Criterion[];
}

/** The Phase 12 exit rows (spec #31), in fixture order: one per remaining plan bullet. */
const requiredRows = [
  'phase_12.review_status_in_cli',
  'phase_12.conflict_notices',
  'phase_12.unavailable_source_notices',
  'phase_12.agent_tools_rulebook_only',
  'phase_12.complete_tables',
  'phase_12.acceptance_suite',
  'phase_12.ids_aliases_provenance',
  'phase_12.labels_reviewed',
  'phase_12.known_caveats',
  'phase_12.carry_overs_open',
  'phase_12.checkpoint_advanced',
];
/** Open issues Phases 11 and 12 compile as they are (spec #24, "Carry-overs"). */
const carryOvers = [
  'issue.sanity.inn_recovery_stay_limit',
  'issue.guild.alchemist_availability_merged_tables',
];
const ledger = 'docs/ledgers/phase-12-retrieval-corpus.md';

const schema = strictObject({
  scope: { const: 'Phase 12 retrieval corpus' },
  status: { enum: ['open', 'accepted'] },
  plan: nonEmptyString,
  criteria: {
    type: 'array',
    minItems: 1,
    items: strictObject({ ...evidenceProperties, id: nonEmptyString, requirement: nonEmptyString }),
  },
});
const shape = createAjv().compile<Checklist>(schema);
const read = (file: string): string => readFileSync(join(repoRoot, file), 'utf8');
const raw: unknown = JSON.parse(read('tests/fixtures/acceptance/phase-12.json'));
if (!shape(raw)) throw new Error(JSON.stringify(shape.errors));
const checklist = raw;
const row = (id: string): Criterion => {
  const found = checklist.criteria.find((criterion) => criterion.id === id);
  if (!found) throw new Error(id);
  return found;
};
/** The text under a `## heading` of a markdown file, up to the next `## ` heading. */
const sectionOf = (markdown: string, heading: string): string =>
  markdown.split(`\n## ${heading}`)[1]?.split('\n## ')[0] ?? '';

const suite = JSON.parse(read('tests/fixtures/retrieval-acceptance.json')) as AcceptanceFixture;
const casesByCategory = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const entry of suite.cases) counts[entry.category] = (counts[entry.category] ?? 0) + 1;
  return counts;
};
interface LabelFile {
  label_review: { status: string };
  cases: Array<{ review: { outcome: string } }>;
}
const labelFile = parse(read('tests/fixtures/ask-questions/cases.yaml')) as LabelFile;

describe('Phase 12 exit checklist (#37)', () => {
  it('has exactly the Phase 12 exit rows, against the plan', () => {
    expect(checklist.criteria.map((criterion) => criterion.id)).toEqual(requiredRows);
    expect(read(checklist.plan)).toContain('### Phase 12 — Retrieval corpus');
  });

  it('cites evidence files that exist', () => {
    expect(evidenceProblems(checklist.criteria)).toEqual([]);
  });

  it('records the suite size and every category count in the ledger, as the fixture has them', () => {
    const counts = casesByCategory();
    const text = read(ledger);
    for (const [category, minimum] of Object.entries(CATEGORY_MINIMUMS)) {
      expect(counts[category], category).toBeGreaterThanOrEqual(minimum);
      expect(text, category).toMatch(
        new RegExp(`\\| \`${category}\`\\s+\\| +${counts[category]} \\|`),
      );
    }
    expect(Object.keys(counts).sort()).toEqual(Object.keys(CATEGORY_MINIMUMS).sort());
    expect(text).toContain(`${suite.cases.length} cases`);
    expect(row('phase_12.acceptance_suite').finding).toContain(`${suite.cases.length} cases`);
  });

  it('records the label review figures in the ledger, as the label file has them', () => {
    expect(labelFile.label_review.status).toBe('reviewed');
    const outcomes = labelFile.cases.map((label) => label.review.outcome);
    const corrected = outcomes.filter((outcome) => outcome === 'corrected').length;
    const confirmed = outcomes.filter((outcome) => outcome === 'confirmed').length;
    expect(confirmed + corrected).toBe(outcomes.length);
    const text = read(ledger);
    expect(text).toContain(`${outcomes.length} cases`);
    expect(text).toContain(`${confirmed} confirmed`);
    expect(text).toContain(`${corrected} corrected`);
    expect(row('phase_12.labels_reviewed').finding).toContain(`${outcomes.length} cases`);
  });

  it('names each known caveat, and the mapped-section one is still true of the corpus', () => {
    const text = read(ledger);
    expect(sectionOf(text, 'Known caveats')).toMatch(/Simplified Alchemy/);
    expect(sectionOf(text, 'Known caveats')).toMatch(/Bleeding-out/);
    expect(sectionOf(text, 'Known caveats')).toMatch(/`mapped`/);
    const corpus = loadRetrievalCorpus();
    const documents = buildSearchDocuments(corpus, deriveGraph(corpus));
    const mapped = documents.filter((doc) => doc.section_status === 'mapped');
    expect(mapped.map((doc) => doc.id)).toEqual([]);
  });

  it('keeps the carry-overs as open issues, named in the ledger and the checkpoint', () => {
    const issues = parse(read('review/ambiguities.yaml')) as Array<{ id: string; status: string }>;
    const status = (id: string) => issues.find((issue) => issue.id === id)?.status;
    expect(carryOvers.map(status)).toEqual(carryOvers.map(() => 'unresolved'));
    const next = sectionOf(read('docs/extraction-checkpoint.md'), 'Next unit');
    for (const id of carryOvers) {
      expect(read(ledger)).toContain(id);
      expect(next).toContain(id);
    }
  });

  it('reads core Phases 0–12 as done in the checkpoint, the plan and the docs index', () => {
    const checkpoint = read('docs/extraction-checkpoint.md');
    expect(checkpoint).toContain('(../tests/fixtures/acceptance/phase-12.json)');
    expect(checkpoint).toContain('(ledgers/phase-12-retrieval-corpus.md)');
    expect(checkpoint).not.toMatch(/Phase 12 is\s+unfinished/);
    expect(sectionOf(checkpoint, 'Next unit')).toMatch(/core Phases 0–12 are complete/i);
    const plan = read('docs/corpus-completion-plan.md');
    expect(plan).toMatch(/Phases 0–6, Phase 9, Phase 11 and Phase 12 `accepted`/);
    expect(plan).not.toMatch(/Phase 12 remains/);
    expect(plan).toContain('(ledgers/phase-12-retrieval-corpus.md)');
  });

  it('is accepted with every row verified and nothing left', () => {
    expect(acceptanceErrors(checklist.status, checklist.criteria)).toEqual([]);
  });

  it('cannot accept an open row', () => {
    const open = structuredClone(checklist.criteria);
    open[0]!.status = 'pending';
    expect(acceptanceErrors('accepted', open)).toContain('Unfinished phase obligation');
    expect(acceptanceErrors('open', checklist.criteria)).toContain(
      'Phase closure status is not accepted',
    );
  });

  it.each([
    {},
    null,
    { ...checklist, status: 'done' },
    { ...checklist, criteria: [{ id: 'phase_12.extra' }] },
  ])('rejects malformed runtime checklist %#', (value) => expect(shape(value)).toBe(false));
});
