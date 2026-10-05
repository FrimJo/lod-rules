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
  evidence: Record<QualityMode, Array<{ id: string }>>;
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

export function saveCaseReview(id: string, review: CaseReview, path = REVIEW_PATH): GradingReview {
  const all = loadReview(path);
  all.cases[id] = review;
  const sorted = Object.fromEntries(Object.entries(all.cases).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ version: 1, cases: sorted }, null, 2)}\n`);
  return { version: 1, cases: sorted };
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
  const byHash = new Map<string, { hash: string; name: string; text: string; modes: QualityMode[] }>();
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
  const labelled = pool.filter((id) => review.relevance[id]).length;
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
  let labelAgree = 0;
  let relevanceAgree = 0;
  let wrongFacts = 0;
  let facts = 0;
  const statuses: Record<ReviewStatus, number> = { unreviewed: 0, partial: 0, reviewed: 0, stale: 0 };

  for (const c of cases) {
    const r = review.cases[c.id];
    statuses[reviewStatus(c, r)] += 1;
    if (!r) continue;
    for (const answer of distinctAnswers(c)) {
      const human = r.answers[answer.hash];
      if (!human) continue;
      const judge = c.metrics[answer.modes[0]!].answerCorrect;
      answerRows.push({ case: c.id, split: c.split, modes: answer.modes, judge, human: human.correct });
    }
    const judged = new Map(c.judgment.relevance.map((j) => [j.id, j.relevance]));
    for (const [id, human] of Object.entries(r.relevance)) {
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
      exactAgreement: labelled ? labelAgree / labelled : null,
      relevantVsIrrelevantAgreement: labelled ? relevanceAgree / labelled : null,
      /** Rows are the judge's label, columns the reviewer's. */
      confusion,
    },
    facts: { reviewed: facts, wrong: wrongFacts },
  };
}

/** Relevance label to trust for one record: the reviewer's when present, else the judge's. */
export function trustedRelevance(
  c: Pick<GradedCase, 'id' | 'judgment'>,
  review: GradingReview,
): Map<string, { label: string; reviewed: boolean }> {
  const out = new Map(
    c.judgment.relevance.map((j) => [j.id, { label: j.relevance as string, reviewed: false }]),
  );
  for (const [id, label] of Object.entries(review.cases[c.id]?.relevance ?? {}))
    out.set(id, { label, reviewed: true });
  return out;
}
