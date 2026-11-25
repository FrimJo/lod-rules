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
  /** The independent label review's verdict on this case, once reviewed. */
  review: CaseReview | null;
}

export interface CaseReview {
  outcome: 'confirmed' | 'corrected';
  reason?: string;
}

/** The file-level review status: `unreviewed`, or the review that checked every case. */
export type LabelReview =
  { status: 'unreviewed' } | { status: 'reviewed'; review: string; reviewer: string; date: string };

interface RawCase {
  id: string;
  split: LabelSplit;
  question: string;
  expected: LabelledQuestion['expected'];
  required_evidence: string[];
  notes?: string;
  review?: CaseReview;
}

interface RawLabels {
  label_review:
    'unreviewed' | { status: 'reviewed'; review: string; reviewer: string; date: string };
  cases: RawCase[];
}

function readLabels(): RawLabels {
  const schema = JSON.parse(
    readFileSync(join(repoRoot, 'schemas/ask-question-labels.schema.json'), 'utf8'),
  ) as object;
  const validate = createAjv().compile(schema);
  const raw: unknown = parse(readFileSync(LABELS_PATH, 'utf8'));
  if (!validate(raw)) throw new Error(`ask labels: ${formatErrors(validate).join('; ')}`);
  return raw as RawLabels;
}

/** Who reviewed the label file, if anyone. */
export function loadLabelReview(): LabelReview {
  const review = readLabels().label_review;
  return review === 'unreviewed' ? { status: 'unreviewed' } : review;
}

/** Schema-checks the label file; with a retrieval index, also checks every id resolves. */
export function loadLabels(retrieval?: Retrieval): LabelledQuestion[] {
  const raw = readLabels();
  const seen = new Set<string>();
  return raw.cases.map((entry) => {
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
      review: entry.review ?? null,
    };
  });
}
