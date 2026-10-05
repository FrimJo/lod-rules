/**
 * Offline sweep of the Jev relevance filter against the relevance labels from a previous
 * `run-quality.ts` run: reviewed labels where they exist, otherwise the judge's. Needs only TYPESAFE_API_KEY. Thresholds are chosen on the
 * development split; validation and held-out are reported, never tuned on.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { analyzeQuestion } from '../../../../scripts/ask/analysis.ts';
import { collectCandidates, evidenceItem } from '../../../../scripts/ask/evidence.ts';
import { memoModel } from '../../../../scripts/ask/evaluate.ts';
import { LABEL_SPLITS, loadLabels } from '../../../../scripts/ask/labels.ts';
import { jevModel } from '../../../../scripts/ask/models.ts';
import {
  applyFilter,
  capLimitFor,
  judgeRelevance,
  type FilterPolicy,
} from '../../../../scripts/ask/ranking.ts';
import { loadLocalEnv } from '../../../../scripts/decisions/env.ts';
import { Retrieval } from '../../../../scripts/retrieve/index.ts';
import { repoRoot } from '../../../../scripts/validate/schemas.ts';
import { loadReview, trustedRelevance } from './grading-review.ts';
import type { QualityJudgment } from './quality.ts';

const { values } = parseArgs({
  options: {
    judgments: { type: 'string', default: 'generated/ask-quality' },
    'max-relevant-loss': { type: 'string', default: '0.1' },
  },
});
loadLocalEnv();
const base = jevModel();
if (!base) throw new Error('TYPESAFE_API_KEY is required');
const jev = memoModel(base, join(repoRoot, 'generated/ask-eval/jev-cache'));
const judgmentsDir = join(repoRoot, values.judgments!);
const maxRelevantLoss = Number(values['max-relevant-loss']);
const retrieval = Retrieval.fromCorpus();
const labels = loadLabels(retrieval);

type Label = QualityJudgment['relevance'][number]['relevance'] | 'unlabelled';
const isRelevant = (label: Label): boolean => label === 'direct' || label === 'supporting';
interface Row {
  caseId: string;
  split: string;
  id: string;
  sources: string[];
  exact: boolean;
  why: string[];
  required: boolean;
  judge: Label;
  pIrrelevant: number | null;
}
const cases: Array<{
  id: string;
  split: string;
  candidates: ReturnType<typeof collectCandidates>;
  judgments: Awaited<ReturnType<typeof judgeRelevance>>['judgments'];
  capLimit: number;
  required: string[];
  judge: Map<string, Label>;
}> = [];
const rows: Row[] = [];
const skipped: string[] = [];
const review = loadReview();
const labelCounts = { reviewed: 0, judge: 0 };

for (const label of labels) {
  const path = join(judgmentsDir, `${label.id}.json`);
  if (!existsSync(path)) {
    skipped.push(label.id);
    continue;
  }
  const judged = JSON.parse(readFileSync(path, 'utf8')) as { judgment: QualityJudgment };
  const trusted = trustedRelevance({ id: label.id, judgment: judged.judgment }, review);
  const judge = new Map<string, Label>([...trusted].map(([id, t]) => [id, t.label as Label]));
  for (const t of trusted.values()) labelCounts[t.reviewed ? 'reviewed' : 'judge'] += 1;
  const analysis = await analyzeQuestion(retrieval, label.question, jev);
  if (analysis.fallback) throw new Error(`${label.id}: Jev fallback: ${analysis.fallback}`);
  const candidates = collectCandidates(retrieval, analysis);
  const items = candidates.map((c) => evidenceItem(retrieval, c.id, c.why));
  const { judgments, errors } = await judgeRelevance(jev, label.question, items);
  if (errors.length) console.error(`${label.id}: ${errors.join('; ')}`);
  cases.push({
    id: label.id,
    split: label.split,
    candidates,
    judgments,
    capLimit: capLimitFor(analysis),
    required: label.requiredEvidence,
    judge,
  });
  for (const c of candidates) {
    rows.push({
      caseId: label.id,
      split: label.split,
      id: c.id,
      sources: c.sources,
      exact: c.exact,
      why: c.why,
      required: label.requiredEvidence.includes(c.id),
      judge: judge.get(c.id) ?? 'unlabelled',
      pIrrelevant: judgments.get(c.id)?.probabilities.irrelevant ?? null,
    });
  }
  console.log(`Judged ${label.id}: ${judgments.size}/${candidates.length}`);
}
retrieval.close();

/** Probability that a judge-irrelevant record outscores a judge-relevant one on p(irrelevant). */
function auc(subset: Row[]): number | null {
  const pos = subset.filter((r) => r.judge === 'irrelevant' && r.pIrrelevant !== null);
  const neg = subset.filter((r) => isRelevant(r.judge) && r.pIrrelevant !== null);
  if (!pos.length || !neg.length) return null;
  let wins = 0;
  for (const p of pos)
    for (const n of neg)
      wins += p.pIrrelevant! > n.pIrrelevant! ? 1 : p.pIrrelevant! === n.pIrrelevant! ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}

function score(policy: FilterPolicy, split: string) {
  const subset = cases.filter((c) => split === 'all' || c.split === split);
  const t = {
    cases: subset.length,
    pool: 0,
    kept: 0,
    dropped: 0,
    droppedLexical: 0,
    droppedRequired: 0,
    droppedDirect: 0,
    droppedSupporting: 0,
    droppedIrrelevant: 0,
    droppedUncertain: 0,
    poolRelevant: 0,
    poolIrrelevant: 0,
    keptRelevant: 0,
  };
  for (const c of subset) {
    for (const d of applyFilter(c.candidates, c.judgments, policy, c.capLimit)) {
      const judge = c.judge.get(d.id) ?? 'unlabelled';
      t.pool += 1;
      if (isRelevant(judge)) t.poolRelevant += 1;
      if (judge === 'irrelevant') t.poolIrrelevant += 1;
      if (d.kept) {
        t.kept += 1;
        if (isRelevant(judge)) t.keptRelevant += 1;
        continue;
      }
      t.dropped += 1;
      if (d.sources.includes('lexical')) t.droppedLexical += 1;
      if (c.required.includes(d.id)) t.droppedRequired += 1;
      if (judge === 'direct') t.droppedDirect += 1;
      if (judge === 'supporting') t.droppedSupporting += 1;
      if (judge === 'irrelevant') t.droppedIrrelevant += 1;
      if (judge === 'uncertain') t.droppedUncertain += 1;
    }
  }
  const relevantDropped = t.droppedDirect + t.droppedSupporting;
  return {
    ...t,
    poolPrecision: t.pool ? t.poolRelevant / t.pool : null,
    keptPrecision: t.kept ? t.keptRelevant / t.kept : null,
    relevantLoss: t.poolRelevant ? relevantDropped / t.poolRelevant : 0,
    irrelevantRemoved: t.poolIrrelevant ? t.droppedIrrelevant / t.poolIrrelevant : 0,
  };
}

const grid: FilterPolicy[] = [];
for (const dropIrrelevantAt of [0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.98])
  for (const protectExact of [true, false])
    for (const protectLinked of [true, false])
      for (const cap of [false, true])
        grid.push({
          id: `sweep-${dropIrrelevantAt}${protectExact ? '' : '-noexact'}${protectLinked ? '' : '-nolinked'}${cap ? '-cap' : ''}`,
          dropIrrelevantAt,
          protectExact,
          protectLinked,
          cap,
        });
const sweep = grid.map((policy) => ({
  policy,
  splits: Object.fromEntries(['all', ...LABEL_SPLITS].map((s) => [s, score(policy, s)])),
}));

// Development only: no required or direct record lost, bounded supporting loss, most noise removed.
const eligible = sweep.filter((s) => {
  const dev = s.splits.development!;
  return (
    dev.droppedRequired === 0 && dev.droppedDirect === 0 && dev.relevantLoss <= maxRelevantLoss
  );
});
const chosen =
  [...eligible].sort(
    (a, b) =>
      b.splits.development!.droppedIrrelevant - a.splits.development!.droppedIrrelevant ||
      a.splits.development!.droppedSupporting - b.splits.development!.droppedSupporting ||
      b.policy.dropIrrelevantAt - a.policy.dropIrrelevantAt ||
      Number(b.policy.protectExact) - Number(a.policy.protectExact) ||
      Number(b.policy.protectLinked) - Number(a.policy.protectLinked) ||
      Number(a.policy.cap) - Number(b.policy.cap),
  )[0] ?? null;

const report = {
  version: 2,
  runAt: new Date().toISOString(),
  jev: jev.id,
  judgmentsFrom: values.judgments,
  labels: labelCounts.reviewed
    ? 'reviewed relevance where clients/web/evaluation/grading-review.json has it, else the automated judge'
    : 'automated judge relevance; unreviewed',
  labelCounts,
  selection: `development: droppedRequired = 0, droppedDirect = 0, relevantLoss <= ${maxRelevantLoss}; maximise droppedIrrelevant`,
  cases: cases.length,
  skipped,
  jevRequests: jev.calls(),
  auc: Object.fromEntries(
    ['all', ...LABEL_SPLITS].map((s) => [s, auc(rows.filter((r) => s === 'all' || r.split === s))]),
  ),
  chosen,
  sweep,
  rows,
};
writeFileSync(
  join(judgmentsDir, 'filter-calibration.json'),
  JSON.stringify(report, null, 2) + '\n',
);

const pct = (v: number | null): string => (v === null ? '—' : `${Math.round(v * 100)}%`);
console.log(`\nAUC p(irrelevant), judge irrelevant vs relevant:`, report.auc);
console.log(
  '\n| policy | split | pool | dropped | lexical | required | direct | supporting | irrelevant | relevant loss | noise removed | precision before → after |',
);
console.log(`|${'---|'.repeat(12)}`);
for (const entry of sweep) {
  for (const split of LABEL_SPLITS) {
    const s = entry.splits[split]!;
    console.log(
      `| ${entry.policy.id}${entry === chosen ? ' (chosen)' : ''} | ${split} | ${s.pool} | ${s.dropped} | ${s.droppedLexical} | ${s.droppedRequired} | ${s.droppedDirect} | ${s.droppedSupporting} | ${s.droppedIrrelevant} | ${pct(s.relevantLoss)} | ${pct(s.irrelevantRemoved)} | ${pct(s.poolPrecision)} → ${pct(s.keptPrecision)} |`,
    );
  }
}
console.log(
  `\nChosen on development: ${chosen?.policy.id ?? 'none eligible'}. Jev requests: ${jev.calls()}. Report: ${values.judgments}/filter-calibration.json`,
);
