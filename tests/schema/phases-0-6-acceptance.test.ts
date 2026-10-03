import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createAjv, repoRoot } from '../../scripts/validate/schemas.ts';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
interface Evidence {
  status: 'pending' | 'verified';
  evidence: string[];
  finding: string;
  remaining_work: string[];
}
interface Candidate extends Evidence {
  candidate: string;
  canonical_object_ids: string[];
  source: unknown[];
}
interface Checklist {
  scope: string;
  status: 'open' | 'accepted';
  plan: string;
  phases: { phase: number; criteria: (Evidence & { id: string; requirement: string })[] }[];
  batches: (Evidence & { phase: number; batch: number })[];
  procedure_candidates: Candidate[];
  state_machine_candidates: Candidate[];
}
const string = { type: 'string', minLength: 1 };
const strings = { type: 'array', items: string };
const object = (properties: Record<string, unknown>) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});
const evidence = {
  status: { enum: ['pending', 'verified'] },
  evidence: { ...strings, minItems: 1 },
  finding: string,
  remaining_work: strings,
};
const candidate = object({
  ...evidence,
  candidate: string,
  canonical_object_ids: { ...strings, minItems: 1 },
  source: { type: 'array' },
});
const schema = object({
  scope: { const: 'Phases 0–6 extraction' },
  status: { enum: ['open', 'accepted'] },
  plan: string,
  phases: {
    type: 'array',
    items: object({
      phase: { type: 'integer', minimum: 0, maximum: 6 },
      criteria: {
        type: 'array',
        minItems: 1,
        items: object({ ...evidence, id: string, requirement: string }),
      },
    }),
  },
  batches: {
    type: 'array',
    items: object({
      ...evidence,
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
const allEvidence = (c: Checklist): Evidence[] => [
  ...c.phases.flatMap((p) => p.criteria),
  ...c.batches,
  ...c.procedure_candidates,
  ...c.state_machine_candidates,
];
const acceptanceErrors = (c: Checklist) => [
  ...(c.status === 'accepted' ? [] : ['Phase closure status is not accepted']),
  ...allEvidence(c).flatMap((row) =>
    row.status !== 'verified' || row.remaining_work.length ? ['Unfinished phase obligation'] : [],
  ),
];
const corpus = readPilot();
const ids = new Set(
  [corpus.rules, corpus.procedures, corpus.stateMachines, corpus.tables, corpus.entities]
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
    for (const row of allEvidence(checklist)) {
      for (const file of row.evidence) {
        expect(file.startsWith('/') || file.split('/').includes('..')).toBe(false);
        expect(existsSync(join(repoRoot, file)), file).toBe(true);
      }
      if (row.remaining_work.length) expect(row.status).toBe('pending');
    }
    for (const row of [...checklist.procedure_candidates, ...checklist.state_machine_candidates])
      for (const id of row.canonical_object_ids) expect(ids.has(id), id).toBe(true);
  });
  it('cannot accept an open checklist or hide unfinished obligations behind verified labels', () => {
    if (checklist.status === 'accepted') expect(acceptanceErrors(checklist)).toEqual([]);
    else expect(acceptanceErrors(checklist)).toContain('Phase closure status is not accepted');
    const synthetic = structuredClone(checklist);
    synthetic.status = 'accepted';
    for (const row of allEvidence(synthetic)) {
      row.status = 'verified';
      row.remaining_work = [];
    }
    expect(acceptanceErrors(synthetic)).toEqual([]);
    synthetic.phases[0]!.criteria[0]!.remaining_work = ['Known implementation gap'];
    expect(acceptanceErrors(synthetic)).toContain('Unfinished phase obligation');
  });
  it.each([
    {},
    null,
    { ...checklist, status: 'done' },
    { ...checklist, batches: [{ phase: 6, batch: 8 }] },
  ])('rejects malformed runtime checklist %#', (value) => expect(shape(value)).toBe(false));
});
