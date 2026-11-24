import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
import type { InformalUncertaintyInventory } from '../support/informal-uncertainty.ts';

type Criterion = ChecklistEvidence & { id: string; requirement: string };
interface Checklist {
  scope: string;
  status: 'open' | 'accepted';
  plan: string;
  criteria: Criterion[];
}

/** The Phase 9 exit rows (spec #22, "Phase 9 exit checklist"), in fixture order. */
const requiredRows = [
  'phase_9.review_units_fresh',
  'phase_9.review_check_clean',
  'phase_9.inventory_test_passes',
  'phase_9.carry_overs_dispositioned',
  'phase_9.extraction_guide_updated',
  'phase_9.graph_edges_covered',
];

const schema = strictObject({
  scope: { const: 'Phase 9 independent review and uncertainty audit' },
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
const raw: unknown = JSON.parse(read('tests/fixtures/acceptance/phase-9.json'));
if (!shape(raw)) throw new Error(JSON.stringify(shape.errors));
const checklist = raw;
const row = (id: string): Criterion => {
  const found = checklist.criteria.find((criterion) => criterion.id === id);
  if (!found) throw new Error(id);
  return found;
};

describe('Phase 9 exit checklist (#22)', () => {
  it('has exactly the Phase 9 exit rows, against the plan', () => {
    expect(checklist.criteria.map((criterion) => criterion.id)).toEqual(requiredRows);
    expect(read(checklist.plan)).toContain(
      '### Phase 9 — Independent review and uncertainty audit',
    );
  });

  it('cites evidence files that exist', () => {
    expect(evidenceProblems(checklist.criteria)).toEqual([]);
  });

  it('records the review check at a date and a revision', () => {
    const { finding } = row('phase_9.review_check_clean');
    expect(finding).toMatch(/\b\d{1,2} [A-Z][a-z]+ \d{4}\b/);
    expect(finding).toMatch(/\b[0-9a-f]{7,40}\b/);
  });

  it('dispositions every checkpoint carry-over by citing its issue', () => {
    const checkpoint = JSON.parse(
      read('tests/fixtures/informal-uncertainty/checkpoint.json'),
    ) as InformalUncertaintyInventory;
    const carryOvers = checkpoint.entries.filter(
      (entry) => 'heading' in entry.locator && entry.locator.heading.endsWith('> Open carry-overs'),
    );
    expect(carryOvers.filter((entry) => entry.disposition !== 'recorded')).toEqual([]);
  });

  it('documents the uncertainty rule and its inventory test in the extraction guide', () => {
    const guide = read('docs/extraction-guide.md');
    expect(guide).toContain('tests/regression/informal-uncertainty.test.ts');
    expect(row('phase_9.extraction_guide_updated').evidence).toContain('docs/extraction-guide.md');
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
    { ...checklist, criteria: [{ id: 'phase_9.extra' }] },
  ])('rejects malformed runtime checklist %#', (value) => expect(shape(value)).toBe(false));
});
