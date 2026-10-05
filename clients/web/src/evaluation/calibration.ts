/**
 * Pure helpers for calibrating the Jev relevance filter against labelled pools: the policy
 * grid, scoring, selection with stated loss bounds, and the inputs a result depends on.
 * `calibrate-filter.ts` does the I/O. See docs/jev-filter-calibration-plan.md.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CandidateSource } from '../../../../scripts/ask/evidence.ts';
import {
  applyFilter,
  type FilterPolicy,
  type RecordJudgment,
} from '../../../../scripts/ask/ranking.ts';
import { fingerprintInputs } from '../../../../scripts/retrieve/load.ts';

export type Label = 'direct' | 'supporting' | 'irrelevant' | 'uncertain' | 'unlabelled';

export interface CalibrationCase {
  id: string;
  split: string;
  candidates: Array<{
    id: string;
    kind?: string;
    why: string[];
    sources: CandidateSource[];
    exact: boolean;
  }>;
  judgments: Map<string, RecordJudgment>;
  capLimit: number;
  required: string[];
  /** Current (non-stale) reviewer labels. */
  human: Map<string, Label>;
  /** The automated judge's labels. */
  judge: Map<string, Label>;
  /** Record text length in characters, for the prompt saving estimate. */
  textLength: Map<string, number>;
}

/** Splits a policy is chosen on; held-out is only reported. */
export const TUNE_SPLITS = ['development', 'validation'] as const;

const isRelevant = (label: Label | undefined): boolean =>
  label === 'direct' || label === 'supporting';

/**
 * One-sided Clopper–Pearson upper bound on a rate after `k` events in `n` trials. With k = 0
 * it is 1 − α^(1/n), close to the rule of three (3/n at α = 0.05).
 */
export function clopperPearsonUpper(k: number, n: number, alpha = 0.05): number {
  if (n === 0) return 1;
  if (k >= n) return 1;
  // P(X ≤ k | n, p) decreases in p; find p where it equals alpha.
  const cdf = (p: number): number => {
    let sum = 0;
    let logChoose = 0;
    for (let i = 0; i <= k; i += 1) {
      if (i > 0) logChoose += Math.log((n - i + 1) / i);
      sum += Math.exp(logChoose + i * Math.log(p) + (n - i) * Math.log1p(-p));
    }
    return sum;
  };
  let lo = k / n;
  let hi = 1;
  for (let step = 0; step < 60; step += 1) {
    const mid = (lo + hi) / 2;
    if (cdf(mid) > alpha) lo = mid;
    else hi = mid;
  }
  return hi;
}

const THRESHOLDS = [0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.98];
const PROTECT_WHY: Array<{ tag: string; prefixes: string[] }> = [
  { tag: '', prefixes: [] },
  { tag: '-structural', prefixes: ['heading:', 'section:'] },
  { tag: '-structural+entity', prefixes: ['heading:', 'section:', 'entity:'] },
];
/** Kinds that read as noise when judged alone, so they get a stricter drop line. */
const LENIENT_KINDS = ['table', 'procedure'];

/** Every policy the sweep scores. Ids name the knobs that differ from the plain threshold. */
export function policyGrid(): FilterPolicy[] {
  const grid: FilterPolicy[] = [];
  for (const dropIrrelevantAt of THRESHOLDS)
    for (const protectExact of [true, false])
      for (const protectLinked of [true, false])
        for (const cap of [false, true])
          for (const why of PROTECT_WHY)
            for (const lenient of [false, true])
              for (const minKept of [0, 3]) {
                const kindAt = Math.min(0.99, dropIrrelevantAt + 0.05);
                if (lenient && kindAt === dropIrrelevantAt) continue;
                const id = [
                  `sweep-${dropIrrelevantAt}`,
                  protectExact ? '' : '-noexact',
                  protectLinked ? '' : '-nolinked',
                  cap ? '-cap' : '',
                  why.tag,
                  lenient ? `-kinds@${kindAt}` : '',
                  minKept ? `-min${minKept}` : '',
                ].join('');
                grid.push({
                  id,
                  dropIrrelevantAt,
                  protectExact,
                  protectLinked,
                  cap,
                  ...(why.prefixes.length ? { protectWhy: why.prefixes } : {}),
                  ...(lenient
                    ? { dropAtByKind: Object.fromEntries(LENIENT_KINDS.map((k) => [k, kindAt])) }
                    : {}),
                  ...(minKept ? { minKept } : {}),
                });
              }
  return grid;
}

export interface PolicyScore {
  cases: number;
  pool: number;
  kept: number;
  dropped: number;
  droppedLexical: number;
  droppedRequired: number;
  /** Counts by the trusted label: the reviewer's where present, else the judge's. */
  trusted: LabelCounts;
  /** Counts over records with a current reviewer label only. */
  human: LabelCounts;
  supportingLoss: number;
  humanRelevantLoss: number | null;
  /** 95% upper bound on the human relevant loss rate. */
  humanRelevantLossUpper: number | null;
  irrelevantRemoved: number;
  precisionBefore: number | null;
  precisionAfter: number | null;
  /** Rough prompt tokens removed (4 characters per token). */
  tokensSaved: number;
}

interface LabelCounts {
  pool: Record<'direct' | 'supporting' | 'irrelevant' | 'other', number>;
  dropped: Record<'direct' | 'supporting' | 'irrelevant' | 'other', number>;
}

const emptyCounts = (): LabelCounts => ({
  pool: { direct: 0, supporting: 0, irrelevant: 0, other: 0 },
  dropped: { direct: 0, supporting: 0, irrelevant: 0, other: 0 },
});
const bucket = (label: Label): keyof LabelCounts['pool'] =>
  label === 'direct' || label === 'supporting' || label === 'irrelevant' ? label : 'other';

export function scorePolicy(
  policy: FilterPolicy,
  cases: CalibrationCase[],
  splits: readonly string[] | 'all',
): PolicyScore {
  const subset = cases.filter((c) => splits === 'all' || splits.includes(c.split));
  const trusted = emptyCounts();
  const human = emptyCounts();
  let pool = 0;
  let kept = 0;
  let keptRelevant = 0;
  let droppedLexical = 0;
  let droppedRequired = 0;
  let characters = 0;
  for (const c of subset) {
    for (const d of applyFilter(c.candidates, c.judgments, policy, c.capLimit)) {
      const humanLabel = c.human.get(d.id);
      const label = humanLabel ?? c.judge.get(d.id) ?? 'unlabelled';
      pool += 1;
      trusted.pool[bucket(label)] += 1;
      if (humanLabel) human.pool[bucket(humanLabel)] += 1;
      if (d.kept) {
        kept += 1;
        if (isRelevant(label)) keptRelevant += 1;
        continue;
      }
      trusted.dropped[bucket(label)] += 1;
      if (humanLabel) human.dropped[bucket(humanLabel)] += 1;
      if (d.sources.includes('lexical')) droppedLexical += 1;
      if (c.required.includes(d.id)) droppedRequired += 1;
      characters += c.textLength.get(d.id) ?? 0;
    }
  }
  const humanRelevant = human.pool.direct + human.pool.supporting;
  const humanLost = human.dropped.direct + human.dropped.supporting;
  return {
    cases: subset.length,
    pool,
    kept,
    dropped: pool - kept,
    droppedLexical,
    droppedRequired,
    trusted,
    human,
    supportingLoss: trusted.pool.supporting
      ? trusted.dropped.supporting / trusted.pool.supporting
      : 0,
    humanRelevantLoss: humanRelevant ? humanLost / humanRelevant : null,
    humanRelevantLossUpper: humanRelevant ? clopperPearsonUpper(humanLost, humanRelevant) : null,
    irrelevantRemoved: trusted.pool.irrelevant
      ? trusted.dropped.irrelevant / trusted.pool.irrelevant
      : 0,
    precisionBefore: pool ? (trusted.pool.direct + trusted.pool.supporting) / pool : null,
    precisionAfter: kept ? keptRelevant / kept : null,
    tokensSaved: Math.round(characters / 4),
  };
}

export interface SweepEntry {
  policy: FilterPolicy;
  tune: PolicyScore;
  splits: Record<string, PolicyScore>;
}

export function sweepPolicies(
  cases: CalibrationCase[],
  splits: readonly string[],
  grid = policyGrid(),
): SweepEntry[] {
  return grid.map((policy) => ({
    policy,
    tune: scorePolicy(policy, cases, TUNE_SPLITS),
    splits: Object.fromEntries(
      ['all', ...splits].map((s) => [s, scorePolicy(policy, cases, s === 'all' ? 'all' : [s])]),
    ),
  }));
}

/** Hard constraints on the tune splits; the soft one bounds trusted supporting loss. */
export function isEligible(entry: SweepEntry, maxSupportingLoss: number): boolean {
  const t = entry.tune;
  return (
    t.droppedRequired === 0 &&
    t.trusted.dropped.direct === 0 &&
    t.human.dropped.direct === 0 &&
    t.supportingLoss <= maxSupportingLoss
  );
}

const knobs = (p: FilterPolicy): number =>
  Number(Boolean(p.protectWhy?.length)) +
  Number(Boolean(p.dropAtByKind)) +
  Number(Boolean(p.minKept));

/** Most noise removed, then most tokens saved, then the simplest policy. */
export function choosePolicy(sweep: SweepEntry[], maxSupportingLoss: number): SweepEntry | null {
  return (
    sweep
      .filter((entry) => isEligible(entry, maxSupportingLoss))
      .sort(
        (a, b) =>
          b.tune.trusted.dropped.irrelevant - a.tune.trusted.dropped.irrelevant ||
          b.tune.tokensSaved - a.tune.tokensSaved ||
          knobs(a.policy) - knobs(b.policy) ||
          b.policy.dropIrrelevantAt - a.policy.dropIrrelevantAt ||
          Number(b.policy.protectExact) - Number(a.policy.protectExact) ||
          Number(b.policy.protectLinked) - Number(a.policy.protectLinked) ||
          Number(a.policy.cap) - Number(b.policy.cap) ||
          a.policy.id.localeCompare(b.policy.id),
      )[0] ?? null
  );
}

/** What a calibration result depends on. A change to any of them makes the result stale. */
export interface CalibrationInputs {
  jev: string;
  corpus: string;
  /** Retrieval, evidence and filter code that shape the pool and what Jev sees. */
  code: string;
  labels: string;
  humanLabels: number;
}

const CODE_FILES = [
  'scripts/ask/evidence.ts',
  'scripts/ask/ranking.ts',
  'scripts/ask/analysis.ts',
  'scripts/retrieve/documents.ts',
  'scripts/retrieve/index.ts',
];

const sha = (parts: Array<string | Buffer>): string => {
  const hash = createHash('sha256');
  for (const part of parts) hash.update(part).update('\0');
  return hash.digest('hex').slice(0, 16);
};

export function calibrationInputs(
  root: string,
  jev: string,
  humanLabels: number,
): CalibrationInputs {
  const read = (path: string): Buffer =>
    existsSync(join(root, path)) ? readFileSync(join(root, path)) : Buffer.from('');
  return {
    jev,
    corpus: fingerprintInputs(root).slice(0, 16),
    code: sha(CODE_FILES.flatMap((path) => [path, read(path)])),
    labels: sha([read('tests/fixtures/ask-questions/cases.yaml')]),
    humanLabels,
  };
}

/** New human labels that justify a rerun even when nothing else changed. */
export const RELABEL_TRIGGER = 100;

/** Why a stored calibration no longer describes the current inputs; empty when it still does. */
export function staleReasons(saved: CalibrationInputs, current: CalibrationInputs): string[] {
  const reasons: string[] = [];
  if (saved.jev !== current.jev) reasons.push(`Jev model changed (${saved.jev} → ${current.jev})`);
  if (saved.corpus !== current.corpus) reasons.push('corpus changed');
  if (saved.code !== current.code) reasons.push('retrieval, evidence or filter code changed');
  if (saved.labels !== current.labels) reasons.push('labelled question set changed');
  if (current.humanLabels - saved.humanLabels >= RELABEL_TRIGGER)
    reasons.push(`${current.humanLabels - saved.humanLabels} new human labels`);
  return reasons;
}

/** `jev-latest` and other aliases can change behind the cache. */
export function isFloatingModel(jev: string): boolean {
  return /latest/i.test(jev);
}
