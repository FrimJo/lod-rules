/**
 * Human review of the automated answer-quality grading. Reviews are kept in a committed file
 * so they survive reruns; generated case files are not.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { repoRoot } from '../../../../scripts/validate/schemas.ts';
import type { QualityJudgment } from './quality.ts';

export const REVIEW_PATH = join(repoRoot, 'clients/web/evaluation/grading-review.json');
export const GRADED_DIR = join(repoRoot, 'generated/ask-quality');

export const QUALITY_MODES = ['lexical', 'jev_alone', 'union', 'filtered'] as const;
export type QualityMode = (typeof QUALITY_MODES)[number];

export type ReviewedRelevance = 'direct' | 'supporting' | 'irrelevant';

export interface CaseReview {
  reviewedAt: string;
  /** Hash of the judge output the fact flags were made against. */
  judgmentHash: string;
  /** Judge facts the reviewer marked wrong or not essential, by fact id. */
  wrongFacts: string[];
  /** The reviewer's label for every pool record. Stays valid across reruns. */
  relevance: Record<string, ReviewedRelevance>;
  /**
   * `hash` of each labelled record's text when it was labelled. A label whose record text has
   * changed since is stale and no longer trusted. Labels without a hash predate this field.
   */
  recordHashes?: Record<string, string>;
  /** The reviewer's verdict per answer, keyed by `answerHash`, so it follows identical text. */
  answers: Record<string, { correct: boolean }>;
  note?: string;
}

export interface GradingReview {
  version: 1;
  cases: Record<string, CaseReview>;
}

/** The fields of a generated case file that review needs. */
export interface GradedCase {
  id: string;
  split: string;
  question: string;
  required: string[];
  evidence: Record<QualityMode, Array<{ id: string; text?: string }>>;
  /** Jev's filter decisions over the union pool; absent when the filtered mode was not run. */
  filter?: {
    decisions: Array<{
      id: string;
      why: string[];
      kept: boolean;
      reason: string;
      judgment: { probabilities: Record<string, number> } | null;
    }>;
  };
  answers: Partial<Record<QualityMode, string>>;
  identities: Partial<Record<QualityMode, string>>;
  judgment: QualityJudgment;
  metrics: Record<QualityMode, { answerCorrect: boolean }>;
}

export const hash = (value: unknown): string =>
  createHash('sha256')
    .update(typeof value === 'string' ? value : JSON.stringify(value))
    .digest('hex')
    .slice(0, 16);

export function loadReview(path = REVIEW_PATH): GradingReview {
  if (!existsSync(path)) return { version: 1, cases: {} };
  const review = JSON.parse(readFileSync(path, 'utf8')) as GradingReview;
  if (review.version !== 1) throw new Error(`${path}: unsupported review version`);
  return review;
}

/** Record text as the case's modes retrieved it, by id. */
export function recordTexts(c: Pick<GradedCase, 'evidence'>): Map<string, string> {
  const texts = new Map<string, string>();
  for (const mode of QUALITY_MODES)
    for (const item of c.evidence[mode] ?? [])
      if (item.text !== undefined && !texts.has(item.id)) texts.set(item.id, item.text);
  return texts;
}

/**
 * The reviewer's labels that still apply: a label is dropped when its record text has changed
 * since it was given. `texts` is the current text by record id; records it lacks keep their label.
 */
export function currentLabels(
  review: CaseReview | undefined,
  texts: Map<string, string>,
): { labels: Map<string, ReviewedRelevance>; stale: string[] } {
  const labels = new Map<string, ReviewedRelevance>();
  const stale: string[] = [];
  for (const [id, label] of Object.entries(review?.relevance ?? {})) {
    const then = review?.recordHashes?.[id];
    const now = texts.get(id);
    if (then !== undefined && now !== undefined && hash(now) !== then) stale.push(id);
    else labels.set(id, label);
  }
  return { labels, stale };
}

/** Hashes of the current text for every labelled record, for `CaseReview.recordHashes`. */
export function hashLabelledRecords(
  relevance: Record<string, ReviewedRelevance>,
  texts: Map<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.keys(relevance).flatMap((id) => {
      const text = texts.get(id);
      return text === undefined ? [] : [[id, hash(text)]];
    }),
  );
}

export function saveCaseReview(id: string, review: CaseReview, path = REVIEW_PATH): GradingReview {
  const all = loadReview(path);
  all.cases[id] = review;
  const sorted = Object.fromEntries(
    Object.entries(all.cases).sort(([a], [b]) => a.localeCompare(b)),
  );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ version: 1, cases: sorted }, null, 2)}\n`);
  return { version: 1, cases: sorted };
}

/** Deletes a case's review, e.g. after undoing its only label. */
export function deleteCaseReview(id: string, path = REVIEW_PATH): GradingReview {
  const all = loadReview(path);
  delete all.cases[id];
  writeFileSync(path, `${JSON.stringify(all, null, 2)}\n`);
  return all;
}

export function loadGradedCases(dir = GRADED_DIR): GradedCase[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => /^askq\..+\.json$/.test(file))
    .sort()
    .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')) as GradedCase)
    .filter((c) => c.judgment);
}

/** Pool records in union order, then any records only another mode retrieved. */
export function poolIds(c: GradedCase): string[] {
  const ids: string[] = [];
  for (const mode of ['union', ...QUALITY_MODES] as const)
    for (const item of c.evidence[mode] ?? []) if (!ids.includes(item.id)) ids.push(item.id);
  return ids;
}

/** Each distinct answer once, with every mode that produced it. */
export function distinctAnswers(c: GradedCase) {
  const byHash = new Map<
    string,
    { hash: string; name: string; text: string; modes: QualityMode[] }
  >();
  for (const mode of QUALITY_MODES) {
    const text = c.answers[mode];
    const name = c.identities[mode];
    if (text === undefined || !name) continue;
    const key = hash(text);
    const entry = byHash.get(key) ?? { hash: key, name, text, modes: [] };
    entry.modes.push(mode);
    byHash.set(key, entry);
  }
  return [...byHash.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type ReviewStatus = 'unreviewed' | 'partial' | 'reviewed' | 'stale';

export function reviewStatus(c: GradedCase, review: CaseReview | undefined): ReviewStatus {
  if (!review) return 'unreviewed';
  const answers = distinctAnswers(c);
  const pool = poolIds(c);
  const answered = answers.filter((a) => review.answers[a.hash]).length;
  const { labels } = currentLabels(review, recordTexts(c));
  const labelled = pool.filter((id) => labels.has(id)).length;
  if (review.judgmentHash !== hash(c.judgment) && answered < answers.length) return 'stale';
  return answered === answers.length && labelled === pool.length ? 'reviewed' : 'partial';
}

const isRelevant = (label: string | undefined) => label === 'direct' || label === 'supporting';

/** How far the judge agrees with the reviewer, over reviewed answers and records only. */
export function summarizeReview(cases: GradedCase[], review: GradingReview) {
  const answerRows: Array<{
    case: string;
    split: string;
    modes: QualityMode[];
    judge: boolean;
    human: boolean;
  }> = [];
  const confusion: Record<string, Record<ReviewedRelevance, number>> = {};
  let labelled = 0;
  let staleLabels = 0;
  let labelAgree = 0;
  let relevanceAgree = 0;
  let wrongFacts = 0;
  let facts = 0;
  const statuses: Record<ReviewStatus, number> = {
    unreviewed: 0,
    partial: 0,
    reviewed: 0,
    stale: 0,
  };

  for (const c of cases) {
    const r = review.cases[c.id];
    statuses[reviewStatus(c, r)] += 1;
    if (!r) continue;
    for (const answer of distinctAnswers(c)) {
      const human = r.answers[answer.hash];
      if (!human) continue;
      const judge = c.metrics[answer.modes[0]!].answerCorrect;
      answerRows.push({
        case: c.id,
        split: c.split,
        modes: answer.modes,
        judge,
        human: human.correct,
      });
    }
    const judged = new Map(c.judgment.relevance.map((j) => [j.id, j.relevance]));
    const { labels, stale } = currentLabels(r, recordTexts(c));
    staleLabels += stale.length;
    for (const [id, human] of labels) {
      const judge = judged.get(id) ?? 'unlabelled';
      if (judge === 'unlabelled') continue;
      labelled += 1;
      if (judge === human) labelAgree += 1;
      if (judge !== 'uncertain' && isRelevant(judge) === isRelevant(human)) relevanceAgree += 1;
      confusion[judge] ??= { direct: 0, supporting: 0, irrelevant: 0 };
      confusion[judge][human] += 1;
    }
    if (r.judgmentHash === hash(c.judgment)) {
      facts += c.judgment.facts.length;
      wrongFacts += r.wrongFacts.length;
    }
  }

  const perMode = Object.fromEntries(
    QUALITY_MODES.map((mode) => {
      const rows = answerRows.filter((row) => row.modes.includes(mode));
      return [
        mode,
        {
          reviewed: rows.length,
          judgeCorrect: rows.filter((row) => row.judge).length,
          humanCorrect: rows.filter((row) => row.human).length,
        },
      ];
    }),
  ) as Record<QualityMode, { reviewed: number; judgeCorrect: number; humanCorrect: number }>;

  const agreed = answerRows.filter((row) => row.judge === row.human).length;
  return {
    cases: cases.length,
    statuses,
    answers: {
      reviewed: answerRows.length,
      agreed,
      agreement: answerRows.length ? agreed / answerRows.length : null,
      judgeTooLenient: answerRows.filter((row) => row.judge && !row.human),
      judgeTooStrict: answerRows.filter((row) => !row.judge && row.human),
    },
    perMode,
    relevance: {
      labelled,
      /** Labels whose record text changed since review; they are ignored until relabelled. */
      stale: staleLabels,
      exactAgreement: labelled ? labelAgree / labelled : null,
      relevantVsIrrelevantAgreement: labelled ? relevanceAgree / labelled : null,
      /** Rows are the judge's label, columns the reviewer's. */
      confusion,
    },
    facts: { reviewed: facts, wrong: wrongFacts },
  };
}

/**
 * Relevance label to trust for one record: the reviewer's when present and not stale, else the
 * judge's. `texts` is the current record text by id (see `currentLabels`).
 */
export function trustedRelevance(
  c: Pick<GradedCase, 'id' | 'judgment'>,
  review: GradingReview,
  texts: Map<string, string> = new Map(),
): Map<string, { label: string; reviewed: boolean }> {
  const out = new Map(
    c.judgment.relevance.map((j) => [j.id, { label: j.relevance as string, reviewed: false }]),
  );
  for (const [id, label] of currentLabels(review.cases[c.id], texts).labels)
    out.set(id, { label, reviewed: true });
  return out;
}

/** Why a record is in the review queue, in the order the queue serves them. */
export const QUEUE_BUCKETS = ['dropped_relevant', 'threshold_band', 'new_step', 'sample'] as const;
export type QueueBucket = (typeof QUEUE_BUCKETS)[number];

export const QUEUE_BUCKET_LABELS: Record<QueueBucket, string> = {
  dropped_relevant: 'Dropped by the filter, relevant to the judge',
  threshold_band: 'Near the drop line, or Jev and the judge disagree',
  new_step: 'Added by the heading or same-heading retrieval steps',
  sample: 'Random sample of the rest',
};

/** p(irrelevant) band in which every candidate drop threshold lies. */
export const THRESHOLD_BAND = [0.6, 0.97] as const;
/** Share of the remaining records sampled into the queue (by a stable hash). */
export const SAMPLE_RATE = 1 / 8;

export interface QueueItem {
  caseId: string;
  split: string;
  question: string;
  recordId: string;
  bucket: QueueBucket;
  judge: string;
  pIrrelevant: number | null;
  kept: boolean | null;
  filterReason: string | null;
  why: string[];
  required: boolean;
}

const SPLIT_ORDER = ['development', 'validation', 'held_out'];

/** The bucket a record falls in, or null when reviewing it would barely move the policy. */
export function queueBucket(input: {
  caseId: string;
  recordId: string;
  judge: string;
  pIrrelevant: number | null;
  kept: boolean | null;
  why: string[];
}): QueueBucket | null {
  const judgeRelevant = input.judge !== 'irrelevant';
  const p = input.pIrrelevant;
  if (input.kept === false && judgeRelevant) return 'dropped_relevant';
  if (p !== null) {
    const inBand = p >= THRESHOLD_BAND[0] && p <= THRESHOLD_BAND[1];
    const disagree = judgeRelevant ? p >= 0.5 : p < 0.5;
    if (inBand || disagree) return 'threshold_band';
  }
  if (input.why.some((w) => w.startsWith('heading:') || w.startsWith('section:')))
    return 'new_step';
  return parseInt(hash(`${input.caseId}:${input.recordId}`).slice(0, 4), 16) / 0x10000 < SAMPLE_RATE
    ? 'sample'
    : null;
}

/**
 * Records worth a human label, most useful to the filter calibration first. Records with a
 * current human label are left out. Held-out cases are excluded unless asked for: they are
 * labelled once, after the policy is chosen.
 */
export function recordQueue(
  cases: GradedCase[],
  review: GradingReview,
  options: { includeHeldOut?: boolean } = {},
): QueueItem[] {
  const items: QueueItem[] = [];
  for (const c of cases) {
    if (c.split === 'held_out' && !options.includeHeldOut) continue;
    const { labels } = currentLabels(review.cases[c.id], recordTexts(c));
    const judged = new Map(c.judgment.relevance.map((j) => [j.id, j.relevance as string]));
    const decisions = new Map((c.filter?.decisions ?? []).map((d) => [d.id, d]));
    for (const recordId of poolIds(c)) {
      if (labels.has(recordId)) continue;
      const decision = decisions.get(recordId);
      const entry = {
        caseId: c.id,
        recordId,
        judge: judged.get(recordId) ?? 'uncertain',
        pIrrelevant: decision?.judgment?.probabilities.irrelevant ?? null,
        kept: decision ? decision.kept : null,
        why: decision?.why ?? [],
      };
      const bucket = queueBucket(entry);
      if (!bucket) continue;
      items.push({
        ...entry,
        split: c.split,
        question: c.question,
        bucket,
        filterReason: decision?.reason ?? null,
        required: c.required.includes(recordId),
      });
    }
  }
  return items.sort(
    (a, b) =>
      QUEUE_BUCKETS.indexOf(a.bucket) - QUEUE_BUCKETS.indexOf(b.bucket) ||
      SPLIT_ORDER.indexOf(a.split) - SPLIT_ORDER.indexOf(b.split) ||
      (b.pIrrelevant ?? 0) - (a.pIrrelevant ?? 0) ||
      a.caseId.localeCompare(b.caseId) ||
      a.recordId.localeCompare(b.recordId),
  );
}

/** Calibration targets from the plan: total human labels, and relevant ones Jev doubts. */
export const LABEL_TARGETS = { total: 300, relevantInBand: 60 } as const;

/** Progress towards `LABEL_TARGETS` over development and validation cases. */
export function labelProgress(cases: GradedCase[], review: GradingReview) {
  let total = 0;
  let relevantInBand = 0;
  for (const c of cases) {
    if (c.split === 'held_out') continue;
    const { labels } = currentLabels(review.cases[c.id], recordTexts(c));
    const decisions = new Map((c.filter?.decisions ?? []).map((d) => [d.id, d]));
    for (const [id, label] of labels) {
      total += 1;
      const p = decisions.get(id)?.judgment?.probabilities.irrelevant;
      if (label !== 'irrelevant' && p !== undefined && p >= THRESHOLD_BAND[0]) relevantInBand += 1;
    }
  }
  return { total, relevantInBand, targets: LABEL_TARGETS };
}

/**
 * Merge record labels into a case's review without touching its answer verdicts, fact flags or
 * note. A new review starts with no answers and the current judgment hash.
 */
export function mergeRecordLabels(
  existing: CaseReview | undefined,
  labels: Record<string, ReviewedRelevance>,
  texts: Map<string, string>,
  judgmentHash: string,
  now = new Date().toISOString(),
): CaseReview {
  return {
    reviewedAt: now,
    judgmentHash: existing?.judgmentHash ?? judgmentHash,
    wrongFacts: existing?.wrongFacts ?? [],
    relevance: { ...existing?.relevance, ...labels },
    recordHashes: { ...existing?.recordHashes, ...hashLabelledRecords(labels, texts) },
    answers: existing?.answers ?? {},
    ...(existing?.note ? { note: existing.note } : {}),
  };
}

/**
 * Undo one record label. Returns null when nothing else is left in the review, so the caller
 * can delete it rather than keep an empty entry.
 */
export function removeRecordLabel(existing: CaseReview, recordId: string): CaseReview | null {
  const { [recordId]: _label, ...relevance } = existing.relevance;
  const { [recordId]: _hash, ...recordHashes } = existing.recordHashes ?? {};
  const empty =
    Object.keys(relevance).length === 0 &&
    Object.keys(existing.answers).length === 0 &&
    existing.wrongFacts.length === 0 &&
    !existing.note;
  if (empty) return null;
  return { ...existing, relevance, recordHashes };
}
