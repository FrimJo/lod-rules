import { loadLabels } from '../../../../scripts/ask/labels.ts';
import {
  QUALITY_MODES,
  QUEUE_BUCKETS,
  QUEUE_BUCKET_LABELS,
  currentLabels,
  deleteCaseReview,
  distinctAnswers,
  hash,
  hashLabelledRecords,
  labelProgress,
  loadGradedCases,
  loadReview,
  mergeRecordLabels,
  poolIds,
  recordQueue,
  recordTexts,
  removeRecordLabel,
  reviewStatus,
  saveCaseReview,
  summarizeReview,
  type CaseReview,
  type GradedCase,
  type QualityMode,
  type QueueBucket,
  type QueueItem,
  type ReviewStatus,
  type ReviewedRelevance,
} from '../evaluation/grading-review.ts';
import type { AnswerJudgment, RelevanceJudgment } from '../evaluation/quality.ts';
import { openRetrieval, type EvidenceItem } from './ask-service.ts';
import { bundled } from './data-root.ts';

export type { CaseReview, QualityMode, QueueBucket, ReviewStatus, ReviewedRelevance };

interface EvidenceRecord {
  id: string;
  kind: string;
  type: string;
  title: string;
  text: string;
}

interface CaseFile extends GradedCase {
  evidence: Record<QualityMode, EvidenceRecord[]>;
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
  /** Retrieval steps that selected the record. */
  why: string[];
  /** The reviewer labelled this record, but its text has changed since. */
  staleLabel: boolean;
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

/** Grading reads the repo's labels and generated/ask-quality/, which a data bundle omits. */
function assertRepoCheckout(): void {
  if (bundled)
    throw new Error('Grading review is only available from a repo checkout (npm run dev)');
}

function cases(): CaseFile[] {
  return loadGradedCases() as CaseFile[];
}

export function listGradedCases() {
  assertRepoCheckout();
  const order = new Map(loadLabels().map((label, i) => [label.id, i]));
  const all = cases().sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
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
  assertRepoCheckout();
  const c = cases().find((entry) => entry.id === id);
  if (!c) throw new Error(`No graded case ${id}`);
  const label = loadLabels().find((entry) => entry.id === id);
  const judged = new Map(c.judgment.relevance.map((j) => [j.id, j]));
  const decisions = new Map((c.filter?.decisions ?? []).map((d) => [d.id, d]));
  const saved = loadReview().cases[id];
  const { labels, stale } = currentLabels(saved, recordTexts(c));
  const items = new Map<string, EvidenceRecord>();
  for (const mode of QUALITY_MODES)
    for (const item of c.evidence[mode] ?? []) items.set(item.id, item);

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
      why: decision?.why ?? [],
      staleLabel: stale.includes(recordId),
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
    // Stale labels are left out so the form falls back to the judge's label for them.
    review: saved ? { ...saved, relevance: Object.fromEntries(labels) } : null,
  };
}

export interface QueueRow extends QueueItem {
  /** The record as the answering model saw it, with citations, issues and dependencies. */
  record: EvidenceItem;
  /** Rulebook headings above the record, nearest first: "Charging Magic Items — Wizards' Guild — …". */
  context: string;
  judgeReason: string;
}

export interface RecordQueue {
  buckets: Array<{ id: QueueBucket; label: string; remaining: number }>;
  progress: ReturnType<typeof labelProgress>;
  /** The first `limit` items; the counts above cover the whole queue. */
  items: QueueRow[];
}

/** Records to label next, across cases, most useful to the filter calibration first. */
export function getRecordQueue(
  input: { includeHeldOut?: boolean; limit?: number } = {},
): RecordQueue {
  assertRepoCheckout();
  const all = cases();
  const review = loadReview();
  const queue = recordQueue(all, review, { includeHeldOut: input.includeHeldOut ?? false });
  const byId = new Map(all.map((c) => [c.id, c]));
  const retrieval = openRetrieval();
  const items = queue.slice(0, input.limit ?? 25).flatMap((item): QueueRow[] => {
    const c = byId.get(item.caseId)!;
    let record: EvidenceItem | undefined;
    for (const mode of QUALITY_MODES)
      record ??= (c.evidence[mode] as EvidenceItem[] | undefined)?.find(
        (e) => e.id === item.recordId,
      );
    if (!record) return [];
    const judged = c.judgment.relevance.find((j) => j.id === item.recordId);
    return [
      {
        ...item,
        record: { ...record, why: item.why.length ? item.why : record.why },
        context: retrieval.document(item.recordId)?.context ?? '',
        judgeReason: judged?.reason ?? 'Not classified by the judge.',
      },
    ];
  });
  return {
    buckets: QUEUE_BUCKETS.map((id) => ({
      id,
      label: QUEUE_BUCKET_LABELS[id],
      remaining: queue.filter((item) => item.bucket === id).length,
    })),
    progress: labelProgress(all, review),
    items,
  };
}

export class AlreadyLabelledError extends Error {
  constructor(recordId: string, label: ReviewedRelevance) {
    super(
      `Already labelled ${label} (${recordId}), probably from another tab. Showing the next record.`,
    );
    this.name = 'AlreadyLabelledError';
  }
}

/** Undoes one record label saved from the queue. */
export function removeQueueLabel(input: { caseId: string; recordId: string }): void {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Grading reviews can only be saved from the dev server');
  assertRepoCheckout();
  const existing = loadReview().cases[input.caseId];
  if (!existing?.relevance[input.recordId]) return;
  const next = removeRecordLabel(existing, input.recordId);
  if (next) saveCaseReview(input.caseId, next);
  else deleteCaseReview(input.caseId);
}

/** Saves one record label from the queue into its case review, keeping everything else. */
export function saveRecordLabel(input: {
  caseId: string;
  recordId: string;
  label: ReviewedRelevance;
}): CaseReview {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Grading reviews can only be saved from the dev server');
  assertRepoCheckout();
  if (!RELEVANCE.has(input.label)) throw new Error(`Invalid relevance ${input.label}`);
  const c = cases().find((entry) => entry.id === input.caseId);
  if (!c) throw new Error(`No graded case ${input.caseId}`);
  if (!poolIds(c).includes(input.recordId))
    throw new Error(`${input.recordId} is not in the pool of ${input.caseId}`);
  // The queue only serves unlabelled records; a label here means another tab got there first.
  const existing = currentLabels(loadReview().cases[c.id], recordTexts(c)).labels.get(
    input.recordId,
  );
  if (existing) throw new AlreadyLabelledError(input.recordId, existing);
  const review = mergeRecordLabels(
    loadReview().cases[c.id],
    { [input.recordId]: input.label },
    recordTexts(c),
    hash(c.judgment),
  );
  saveCaseReview(c.id, review);
  return review;
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
  for (const fact of input.wrongFacts)
    if (!facts.has(fact)) throw new Error(`Unknown fact ${fact}`);

  const review: CaseReview = {
    reviewedAt: new Date().toISOString(),
    judgmentHash: detail.judgmentHash,
    wrongFacts: input.wrongFacts,
    relevance: input.relevance,
    recordHashes: hashLabelledRecords(
      input.relevance,
      new Map(detail.records.map((r) => [r.id, r.text])),
    ),
    answers: Object.fromEntries(
      Object.entries(input.answers).map(([key, value]) => [
        key,
        { correct: Boolean(value.correct) },
      ]),
    ),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
  };
  saveCaseReview(id, review);
  return review;
}
