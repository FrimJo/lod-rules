import { loadLabels } from '../../../../scripts/ask/labels.ts';
import {
  QUALITY_MODES,
  distinctAnswers,
  hash,
  loadGradedCases,
  loadReview,
  poolIds,
  reviewStatus,
  saveCaseReview,
  summarizeReview,
  type CaseReview,
  type GradedCase,
  type QualityMode,
  type ReviewStatus,
  type ReviewedRelevance,
} from '../evaluation/grading-review.ts';
import type { AnswerJudgment, RelevanceJudgment } from '../evaluation/quality.ts';

export type { CaseReview, QualityMode, ReviewStatus, ReviewedRelevance };

interface EvidenceRecord {
  id: string;
  kind: string;
  type: string;
  title: string;
  text: string;
}

interface CaseFile extends GradedCase {
  evidence: Record<QualityMode, EvidenceRecord[]>;
  filter?: {
    decisions: Array<{
      id: string;
      kept: boolean;
      reason: string;
      judgment: { probabilities: Record<string, number> } | null;
    }>;
  };
}

export interface GradedCaseRow {
  id: string;
  split: string;
  question: string;
  status: ReviewStatus;
  judgeCorrect: Record<QualityMode, boolean>;
}

export interface ReviewRecord extends EvidenceRecord {
  required: boolean;
  modes: QualityMode[];
  judge: RelevanceJudgment['relevance'];
  judgeReason: string;
  jevIrrelevant: number | null;
  filterReason: string | null;
}

export interface ReviewAnswer {
  hash: string;
  name: string;
  text: string;
  modes: QualityMode[];
  judge: AnswerJudgment & { correct: boolean };
}

export interface GradedCaseDetail {
  id: string;
  split: string;
  question: string;
  notes: string | null;
  required: string[];
  judgmentHash: string;
  facts: Array<{ id: string; claim: string; sources: string[] }>;
  answers: ReviewAnswer[];
  records: ReviewRecord[];
  review: CaseReview | null;
}

function cases(): CaseFile[] {
  return loadGradedCases() as CaseFile[];
}

export function listGradedCases() {
  const order = new Map(loadLabels().map((label, i) => [label.id, i]));
  const all = cases().sort(
    (a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity),
  );
  const review = loadReview();
  const rows: GradedCaseRow[] = all.map((c) => ({
    id: c.id,
    split: c.split,
    question: c.question,
    status: reviewStatus(c, review.cases[c.id]),
    judgeCorrect: Object.fromEntries(
      QUALITY_MODES.map((mode) => [mode, c.metrics[mode]?.answerCorrect ?? false]),
    ) as Record<QualityMode, boolean>,
  }));
  return { rows, summary: summarizeReview(all, review) };
}

export function getGradedCase(id: string): GradedCaseDetail {
  const c = cases().find((entry) => entry.id === id);
  if (!c) throw new Error(`No graded case ${id}`);
  const label = loadLabels().find((entry) => entry.id === id);
  const judged = new Map(c.judgment.relevance.map((j) => [j.id, j]));
  const decisions = new Map((c.filter?.decisions ?? []).map((d) => [d.id, d]));
  const items = new Map<string, EvidenceRecord>();
  for (const mode of QUALITY_MODES) for (const item of c.evidence[mode] ?? []) items.set(item.id, item);

  const records = poolIds(c).map((recordId): ReviewRecord => {
    const item = items.get(recordId)!;
    const decision = decisions.get(recordId);
    return {
      id: item.id,
      kind: item.kind,
      type: item.type,
      title: item.title,
      text: item.text,
      required: c.required.includes(recordId),
      modes: QUALITY_MODES.filter((mode) => c.evidence[mode]?.some((e) => e.id === recordId)),
      judge: judged.get(recordId)?.relevance ?? 'uncertain',
      judgeReason: judged.get(recordId)?.reason ?? 'Not classified by the judge.',
      jevIrrelevant: decision?.judgment?.probabilities.irrelevant ?? null,
      filterReason: decision ? decision.reason : null,
    };
  });

  const answers = distinctAnswers(c).map((answer): ReviewAnswer => {
    const judgment = c.judgment.answers.find((a) => a.name === answer.name)!;
    return {
      ...answer,
      judge: { ...judgment, correct: c.metrics[answer.modes[0]!].answerCorrect },
    };
  });

  return {
    id: c.id,
    split: c.split,
    question: c.question,
    notes: label?.notes ?? null,
    required: c.required,
    judgmentHash: hash(c.judgment),
    facts: c.judgment.facts,
    answers,
    records,
    review: loadReview().cases[id] ?? null,
  };
}

const RELEVANCE = new Set<ReviewedRelevance>(['direct', 'supporting', 'irrelevant']);

export function saveGradingReview(id: string, input: Omit<CaseReview, 'reviewedAt'>): CaseReview {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Grading reviews can only be saved from the dev server');
  const detail = getGradedCase(id);
  const pool = new Set(detail.records.map((r) => r.id));
  const answerHashes = new Set(detail.answers.map((a) => a.hash));
  const facts = new Set(detail.facts.map((f) => f.id));
  for (const [recordId, label] of Object.entries(input.relevance))
    if (!pool.has(recordId) || !RELEVANCE.has(label))
      throw new Error(`Invalid relevance ${recordId}: ${label}`);
  for (const answer of Object.keys(input.answers))
    if (!answerHashes.has(answer)) throw new Error(`Unknown answer ${answer}`);
  for (const fact of input.wrongFacts) if (!facts.has(fact)) throw new Error(`Unknown fact ${fact}`);

  const review: CaseReview = {
    reviewedAt: new Date().toISOString(),
    judgmentHash: detail.judgmentHash,
    wrongFacts: input.wrongFacts,
    relevance: input.relevance,
    answers: Object.fromEntries(
      Object.entries(input.answers).map(([key, value]) => [key, { correct: Boolean(value.correct) }]),
    ),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
  };
  saveCaseReview(id, review);
  return review;
}
