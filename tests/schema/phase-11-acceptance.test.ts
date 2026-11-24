import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { createAjv, repoRoot } from '../../scripts/validate/schemas.ts';
import {
  acceptanceErrors,
  evidenceProblems,
  evidenceProperties,
  nonEmptyString,
  strictObject,
  type ChecklistEvidence,
} from '../support/exit-checklist.ts';

type Criterion = ChecklistEvidence & { id: string; requirement: string };
interface Checklist {
  scope: string;
  status: 'open' | 'accepted';
  plan: string;
  criteria: Criterion[];
}

/** The Phase 11 exit rows (spec #24), in fixture order. */
const requiredRows = [
  'phase_11.build_validates',
  'phase_11.class_bundles',
  'phase_11.manifest_contract',
  'phase_11.preserves_provenance',
  'phase_11.graph_bundle',
  'phase_11.staged_publish',
  'phase_11.repeat_build_in_ci',
  'phase_11.consumers_read_bundles',
  'phase_11.layout_documented',
  'phase_11.carry_overs_open',
  'phase_11.checkpoint_advanced',
];
/** Open issues Phase 11 compiles as they are and hands to Phase 12 (spec #24, "Carry-overs"). */
const carryOvers = [
  'issue.sanity.inn_recovery_stay_limit',
  'issue.guild.alchemist_availability_merged_tables',
];
const ledger = 'docs/ledgers/phase-11-deterministic-compilation.md';
const layoutDoc = 'docs/corpus-bundles.md';
/** Docs that described `build:corpus` before Phase 11 and must no longer call it a stub. */
const buildDocs = [
  'AGENTS.md',
  'README.md',
  'LOD_RULES_CORPUS_PLAN.md',
  'docs/corpus-completion-plan.md',
  'docs/extraction-checkpoint.md',
  'docs/extraction-guide.md',
];

const schema = strictObject({
  scope: { const: 'Phase 11 deterministic compilation' },
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
const raw: unknown = JSON.parse(read('tests/fixtures/acceptance/phase-11.json'));
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

describe('Phase 11 exit checklist (#24)', () => {
  it('has exactly the Phase 11 exit rows, against the plan', () => {
    expect(checklist.criteria.map((criterion) => criterion.id)).toEqual(requiredRows);
    expect(read(checklist.plan)).toContain('### Phase 11 — Deterministic compilation');
  });

  it('cites evidence files that exist', () => {
    expect(evidenceProblems(checklist.criteria)).toEqual([]);
  });

  it('runs the repeat-build checksum test in the gate, on a pinned Node and lockfile', () => {
    const workflow = read('.github/workflows/gate.yml');
    expect(workflow).toMatch(/node-version: \d+/);
    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm test');
    expect(read('tests/build/corpus.test.ts')).toContain(
      'writes byte-identical files when built twice from the same inputs',
    );
    expect(row('phase_11.repeat_build_in_ci').evidence).toEqual(
      expect.arrayContaining(['.github/workflows/gate.yml', 'tests/build/corpus.test.ts']),
    );
  });

  it('documents the bundle layout and its format-version policy for consumers', () => {
    const doc = read(layoutDoc);
    expect(doc).toContain('format_version');
    expect(read('docs/README.md')).toContain('(corpus-bundles.md)');
    expect(row('phase_11.layout_documented').evidence).toContain(layoutDoc);
  });

  it('keeps the carry-overs as open issues and names them in the ledger', () => {
    const issues = parse(read('review/ambiguities.yaml')) as Array<{ id: string; status: string }>;
    const status = (id: string) => issues.find((issue) => issue.id === id)?.status;
    expect(carryOvers.map(status)).toEqual(carryOvers.map(() => 'unresolved'));
    for (const id of carryOvers) expect(read(ledger)).toContain(id);
  });

  it('advances the checkpoint to Phase 12 and drops the stub wording', () => {
    const next = sectionOf(read('docs/extraction-checkpoint.md'), 'Next unit');
    expect(next).toMatch(/^\s*Phase 12\b/);
    for (const id of carryOvers) expect(next).toContain(id);
    for (const file of buildDocs) {
      const stubLines = read(file)
        .split('\n')
        .filter((line) => line.includes('build:corpus') && /\bstub\b/.test(line));
      expect(stubLines, file).toEqual([]);
    }
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
    { ...checklist, criteria: [{ id: 'phase_11.extra' }] },
  ])('rejects malformed runtime checklist %#', (value) => expect(shape(value)).toBe(false));
});
