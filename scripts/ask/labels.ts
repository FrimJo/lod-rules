import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Retrieval } from '../retrieve/index.ts';
import { createAjv, formatErrors, repoRoot } from '../validate/schemas.ts';
import type { ComplexityId, IntentId } from './analysis.ts';

export const LABELS_PATH = join(repoRoot, 'tests/fixtures/ask-questions/cases.yaml');

export type LabelSplit = 'development' | 'validation' | 'held_out';
export const LABEL_SPLITS: readonly LabelSplit[] = ['development', 'validation', 'held_out'];

export interface LabelledQuestion {
  id: string;
  split: LabelSplit;
  question: string;
  expected: { intent: IntentId; complexity: ComplexityId; entity: string | null };
  requiredEvidence: string[];
  notes: string | null;
}

interface RawCase {
  id: string;
  split: LabelSplit;
  question: string;
  expected: LabelledQuestion['expected'];
  required_evidence: string[];
  notes?: string;
}

/** Schema-checks the label file; with a retrieval index, also checks every id resolves. */
export function loadLabels(retrieval?: Retrieval): LabelledQuestion[] {
  const schema = JSON.parse(
    readFileSync(join(repoRoot, 'schemas/ask-question-labels.schema.json'), 'utf8'),
  ) as object;
  const validate = createAjv().compile(schema);
  const raw: unknown = parse(readFileSync(LABELS_PATH, 'utf8'));
  if (!validate(raw)) throw new Error(`ask labels: ${formatErrors(validate).join('; ')}`);

  const seen = new Set<string>();
  return (raw as { cases: RawCase[] }).cases.map((entry) => {
    if (seen.has(entry.id)) throw new Error(`${entry.id}: duplicate label id`);
    seen.add(entry.id);
    if (retrieval) {
      for (const id of entry.required_evidence) {
        if (!retrieval.document(id)) throw new Error(`${entry.id}: unknown evidence ${id}`);
      }
      const entity = entry.expected.entity;
      if (entity && retrieval.document(entity)?.kind !== 'entity') {
        throw new Error(`${entry.id}: ${entity} is not an entity record`);
      }
    }
    return {
      id: entry.id,
      split: entry.split,
      question: entry.question,
      expected: entry.expected,
      requiredEvidence: entry.required_evidence,
      notes: entry.notes ?? null,
    };
  });
}
