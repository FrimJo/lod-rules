import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createAjv, repoRoot } from '../../scripts/validate/schemas.ts';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import {
  acceptanceErrors,
  evidenceProblems,
  evidenceProperties,
  nonEmptyString,
  strictObject,
  stringList,
  type ChecklistEvidence,
} from '../support/exit-checklist.ts';
interface Candidate extends ChecklistEvidence {
  candidate: string;
  canonical_object_ids: string[];
  source: unknown[];
}
interface Checklist {
  scope: string;
  status: 'open' | 'accepted';
  plan: string;
  phases: {
    phase: number;
    criteria: (ChecklistEvidence & { id: string; requirement: string })[];
  }[];
  batches: (ChecklistEvidence & { phase: number; batch: number })[];
  procedure_candidates: Candidate[];
  state_machine_candidates: Candidate[];
}
const candidate = strictObject({
  ...evidenceProperties,
  candidate: nonEmptyString,
  canonical_object_ids: { ...stringList, minItems: 1 },
  source: { type: 'array' },
});
const schema = strictObject({
  scope: { const: 'Phases 0–6 extraction' },
  status: { enum: ['open', 'accepted'] },
  plan: nonEmptyString,
  phases: {
    type: 'array',
    items: strictObject({
      phase: { type: 'integer', minimum: 0, maximum: 6 },
      criteria: {
        type: 'array',
        minItems: 1,
        items: strictObject({
          ...evidenceProperties,
          id: nonEmptyString,
          requirement: nonEmptyString,
        }),
      },
    }),
  },
  batches: {
    type: 'array',
    items: strictObject({
      ...evidenceProperties,
      phase: { enum: [5, 6] },
      batch: { type: 'integer', minimum: 1, maximum: 7 },
    }),
  },
  procedure_candidates: { type: 'array', items: candidate },
  state_machine_candidates: { type: 'array', items: candidate },
});
const shape = createAjv().compile<Checklist>(schema);
const raw: unknown = JSON.parse(
  readFileSync(join(repoRoot, 'tests/fixtures/acceptance/phases-0-6.json'), 'utf8'),
);
if (!shape(raw)) throw new Error(JSON.stringify(shape.errors));
const checklist = raw;
const allEvidence = (c: Checklist): ChecklistEvidence[] => [
  ...c.phases.flatMap((p) => p.criteria),
  ...c.batches,
  ...c.procedure_candidates,
  ...c.state_machine_candidates,
];
const checklistErrors = (c: Checklist) => acceptanceErrors(c.status, allEvidence(c));
const corpus = readPilot();
const ids = new Set(
  [
    corpus.rules,
    corpus.procedures,
    corpus.stateMachines,
    corpus.tables,
    corpus.entities,
    corpus.edges,
  ]
    .flat()
    .map((x) => x.id),
);
const plan = readFileSync(join(repoRoot, checklist.plan), 'utf8');
describe('Original Phases 0–6 exit contract', () => {
  it('accounts for every original exit criterion in all seven phases', () => {
    expect(checklist.phases.map((x) => x.phase)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (const phase of checklist.phases) {
      const text = plan.split(`## Phase ${phase.phase} —`)[1]!.split('\n## Phase ')[0]!;
      const required = [...text.split('### Exit criteria')[1]!.matchAll(/\[ \] ([^\n]+)/g)].map(
        (x) => x[1],
      );
      expect(phase.criteria.map((x) => x.requirement)).toEqual(required);
    }
  });
  it('accounts for every Phase5/6 batch and original procedure/state-machine candidate', () => {
    expect(checklist.batches.map((x) => `${x.phase}/${x.batch}`)).toEqual(
      [5, 6].flatMap((p) => Array.from({ length: 7 }, (_, i) => `${p}/${i + 1}`)),
    );
    const procedures = [
      ...plan
        .split('### Candidate procedures')[1]!
        .split('### State-machine candidates')[0]!
        .matchAll(/^- (.+)[;.]/gm),
    ].map((x) => x[1]);
    const machines = plan
      .split('### State-machine candidates')[1]!
      .split('```text')[1]!
      .split('```')[0]!
      .trim()
      .split('\n');
    expect(checklist.procedure_candidates.map((x) => x.candidate)).toEqual(procedures);
    expect(checklist.state_machine_candidates.map((x) => x.candidate)).toEqual(machines);
  });
  it('requires resolving evidence and keeps known implementation work pending', () => {
    expect(evidenceProblems(allEvidence(checklist))).toEqual([]);
    for (const row of [...checklist.procedure_candidates, ...checklist.state_machine_candidates])
      for (const id of row.canonical_object_ids) expect(ids.has(id), id).toBe(true);
  });
  it('closes the Phase 10-owned rows and the Step 4 rows, and accepts the checklist', () => {
    const row = (key: string) => {
      const found = [
        ...checklist.phases.flatMap((p) => p.criteria.map((c) => [c.id, c] as const)),
        ...checklist.batches.map((b) => [`batch_${b.phase}.${b.batch}`, b] as const),
        ...checklist.procedure_candidates.map((c) => [c.candidate, c] as const),
      ].find(([k]) => k === key);
      if (!found) throw new Error(key);
      return found[1];
    };
    for (const key of [
      'phase_1.criterion_3',
      'phase_5.criterion_3',
      'phase_5.criterion_5',
      'batch_5.7',
    ])
      expect(row(key).status, key).toBe('verified');
    expect(row('phase_6.criterion_2').status).toBe('verified');
    expect(allEvidence(checklist).filter((r) => r.status === 'pending')).toEqual([]);
    expect(checklist.status).toBe('accepted');
  });
  it('cannot accept an open checklist or hide unfinished obligations behind verified labels', () => {
    if (checklist.status === 'accepted') expect(checklistErrors(checklist)).toEqual([]);
    else expect(checklistErrors(checklist)).toContain('Phase closure status is not accepted');
    const synthetic = structuredClone(checklist);
    synthetic.status = 'accepted';
    for (const row of allEvidence(synthetic)) {
      row.status = 'verified';
      row.remaining_work = [];
    }
    expect(checklistErrors(synthetic)).toEqual([]);
    synthetic.phases[0]!.criteria[0]!.remaining_work = ['Known implementation gap'];
    expect(checklistErrors(synthetic)).toContain('Unfinished phase obligation');
  });
  it.each([
    {},
    null,
    { ...checklist, status: 'done' },
    { ...checklist, batches: [{ phase: 6, batch: 8 }] },
  ])('rejects malformed runtime checklist %#', (value) => expect(shape(value)).toBe(false));
});
