/**
 * Sweep of Jev relevance-filter policies against the labelled union pools. Reviewer labels
 * from clients/web/evaluation/grading-review.json decide the hard constraints; the judge's
 * labels from a previous `run-quality.ts` run fill in where no reviewer label exists. A policy
 * is chosen on development + validation; held-out is only reported.
 *
 * Jev answers are cached by model, question and record text in generated/ask-eval/jev-cache/,
 * so a rerun over unchanged pools makes no requests. `--check` only reports whether the stored
 * result is stale. See docs/jev-filter-calibration-plan.md.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { analyzeQuestion } from '../../../../scripts/ask/analysis.ts';
import { collectCandidates, evidenceItem } from '../../../../scripts/ask/evidence.ts';
import { memoModel } from '../../../../scripts/ask/evaluate.ts';
import { LABEL_SPLITS, loadLabels } from '../../../../scripts/ask/labels.ts';
import { jevModel, jevModelName } from '../../../../scripts/ask/models.ts';
import { capLimitFor, judgeRelevance } from '../../../../scripts/ask/ranking.ts';
import { loadLocalEnv } from '../../../../scripts/decisions/env.ts';
import { Retrieval } from '../../../../scripts/retrieve/index.ts';
import { repoRoot } from '../../../../scripts/validate/schemas.ts';
import {
  TUNE_SPLITS,
  calibrationInputs,
  choosePolicy,
  isFloatingModel,
  staleReasons,
  sweepPolicies,
  type CalibrationCase,
  type CalibrationInputs,
  type Label,
  type PolicyScore,
} from './calibration.ts';
import { currentLabels, loadGradedCases, loadReview, recordTexts } from './grading-review.ts';
import type { QualityJudgment } from './quality.ts';

const { values } = parseArgs({
  options: {
    judgments: { type: 'string', default: 'generated/ask-quality' },
    'max-supporting-loss': { type: 'string', default: '0.05' },
    check: { type: 'boolean' },
  },
});
loadLocalEnv();
const judgmentsDir = join(repoRoot, values.judgments!);
const reportPath = join(judgmentsDir, 'filter-calibration.json');
const maxSupportingLoss = Number(values['max-supporting-loss']);
const review = loadReview();

/** Reviewer labels still valid against the graded record text, over all cases. */
function humanLabelCount(): number {
  let count = 0;
  for (const c of loadGradedCases(judgmentsDir))
    count += currentLabels(review.cases[c.id], recordTexts(c)).labels.size;
  return count;
}

if (values.check) {
  if (!existsSync(reportPath)) {
    console.log(
      `No calibration at ${values.judgments}/filter-calibration.json; run without --check.`,
    );
    process.exit(1);
  }
  const saved = JSON.parse(readFileSync(reportPath, 'utf8')) as { inputs?: CalibrationInputs };
  if (!saved.inputs) {
    console.log('The stored calibration predates input tracking; rerun it.');
    process.exit(1);
  }
  const reasons = staleReasons(
    saved.inputs,
    calibrationInputs(repoRoot, `jev:${jevModelName()}`, humanLabelCount()),
  );
  console.log(reasons.length ? `Stale: ${reasons.join('; ')}` : 'Calibration is current.');
  process.exit(reasons.length ? 1 : 0);
}

const base = jevModel();
if (!base) throw new Error('TYPESAFE_API_KEY is required');
if (isFloatingModel(base.id))
  console.error(
    `Warning: ${base.id} is a floating alias; cached answers may come from an older model. ` +
      'Set TYPESAFE_DEFAULT_MODEL to a pinned version for a reproducible calibration.',
  );
const jev = memoModel(base, join(repoRoot, 'generated/ask-eval/jev-cache'));
const retrieval = Retrieval.fromCorpus();
const labels = loadLabels(retrieval);

interface Row {
  caseId: string;
  split: string;
  id: string;
  kind: string;
  title: string;
  why: string[];
  required: boolean;
  human: Label | null;
  judge: Label;
  pIrrelevant: number | null;
  textLength: number;
}
const cases: CalibrationCase[] = [];
const rows: Row[] = [];
const skipped: string[] = [];
let humanLabels = 0;
let staleLabels = 0;

for (const label of labels) {
  const path = join(judgmentsDir, `${label.id}.json`);
  if (!existsSync(path)) {
    skipped.push(label.id);
    continue;
  }
  const graded = JSON.parse(readFileSync(path, 'utf8')) as { judgment: QualityJudgment };
  const judge = new Map<string, Label>(graded.judgment.relevance.map((j) => [j.id, j.relevance]));
  const analysis = await analyzeQuestion(retrieval, label.question, jev);
  if (analysis.fallback) throw new Error(`${label.id}: Jev fallback: ${analysis.fallback}`);
  const candidates = collectCandidates(retrieval, analysis);
  const items = candidates.map((c) => evidenceItem(retrieval, c.id, c.why));
  const texts = new Map(items.map((item) => [item.id, item.text]));
  const current = currentLabels(review.cases[label.id], texts);
  const human = new Map<string, Label>(current.labels);
  humanLabels += human.size;
  staleLabels += current.stale.length;
  const { judgments, errors } = await judgeRelevance(jev, label.question, items);
  if (errors.length) console.error(`${label.id}: ${errors.join('; ')}`);
  cases.push({
    id: label.id,
    split: label.split,
    candidates,
    judgments,
    capLimit: capLimitFor(analysis),
    required: label.requiredEvidence,
    human,
    judge,
    textLength: new Map(items.map((item) => [item.id, item.text.length])),
  });
  for (const item of items) {
    const candidate = candidates.find((c) => c.id === item.id)!;
    rows.push({
      caseId: label.id,
      split: label.split,
      id: item.id,
      kind: item.kind,
      title: item.title,
      why: candidate.why,
      required: label.requiredEvidence.includes(item.id),
      human: human.get(item.id) ?? null,
      judge: judge.get(item.id) ?? 'unlabelled',
      pIrrelevant: judgments.get(item.id)?.probabilities.irrelevant ?? null,
      textLength: item.text.length,
    });
  }
  console.log(`Judged ${label.id}: ${judgments.size}/${candidates.length}`);
}
retrieval.close();

const trusted = (row: Row): Label => row.human ?? row.judge;
const relevant = (label: Label): boolean => label === 'direct' || label === 'supporting';

/** Probability that an irrelevant record outscores a relevant one on p(irrelevant). */
function auc(subset: Row[], labelOf: (row: Row) => Label | null): number | null {
  const scored = subset.filter((r) => r.pIrrelevant !== null);
  const pos = scored.filter((r) => labelOf(r) === 'irrelevant');
  const neg = scored.filter((r) => {
    const label = labelOf(r);
    return label !== null && relevant(label);
  });
  if (!pos.length || !neg.length) return null;
  let wins = 0;
  for (const p of pos)
    for (const n of neg)
      wins += p.pIrrelevant! > n.pIrrelevant! ? 1 : p.pIrrelevant! === n.pIrrelevant! ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}

const splitRows = (s: string): Row[] => rows.filter((r) => s === 'all' || r.split === s);
const sweep = sweepPolicies(cases, LABEL_SPLITS);
const chosen = choosePolicy(sweep, maxSupportingLoss);

// Relevant records Jev is sure are irrelevant: no threshold keeps them, so diagnose each one.
const misses = rows
  .filter((r) => relevant(trusted(r)) && (r.pIrrelevant ?? 0) >= 0.9)
  .map((r) => ({ ...r, labelSource: r.human ? 'reviewer' : 'judge' }));

const report = {
  version: 3,
  runAt: new Date().toISOString(),
  inputs: calibrationInputs(repoRoot, jev.id, humanLabels),
  judgmentsFrom: values.judgments,
  labelCounts: { human: humanLabels, staleHuman: staleLabels, rows: rows.length },
  selection: `${TUNE_SPLITS.join(' + ')}: no required, judge-direct or reviewer-direct record dropped; trusted supporting loss <= ${maxSupportingLoss}; most irrelevant removed, then most tokens saved, then fewest knobs`,
  cases: cases.length,
  skipped,
  jevRequests: jev.calls(),
  auc: Object.fromEntries(
    ['all', ...LABEL_SPLITS].map((s) => [
      s,
      { trusted: auc(splitRows(s), trusted), human: auc(splitRows(s), (r) => r.human) },
    ]),
  ),
  chosen,
  misses,
  sweep,
  rows,
};
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');

const pct = (v: number | null): string => (v === null ? '—' : `${Math.round(v * 100)}%`);
const line = (name: string, s: PolicyScore): string =>
  `| ${name} | ${s.pool} | ${s.dropped} | ${s.droppedRequired} | ${s.trusted.dropped.direct}/${s.human.dropped.direct} | ${s.trusted.dropped.supporting}/${s.human.dropped.supporting} | ${s.trusted.dropped.irrelevant} | ${pct(s.supportingLoss)} | ${pct(s.humanRelevantLoss)} (≤ ${pct(s.humanRelevantLossUpper)}) | ${pct(s.irrelevantRemoved)} | ${s.tokensSaved} |`;

console.log(`\nAUC of p(irrelevant):`, JSON.stringify(report.auc));
console.log(
  `Labels: ${humanLabels} reviewer (${staleLabels} stale, ignored), the rest from the judge.`,
);
const header =
  '| split | pool | dropped | required | direct (trusted/human) | supporting (trusted/human) | irrelevant | supporting loss | human relevant loss (95% bound) | noise removed | tokens saved |';
const show = (title: string, entry: (typeof sweep)[number]) => {
  console.log(`\n${title}: ${entry.policy.id}\n${header}\n|${'---|'.repeat(11)}`);
  console.log(line('tune', entry.tune));
  for (const split of LABEL_SPLITS) console.log(line(split, entry.splits[split]!));
};
const provisional = sweep.find((e) => e.policy.id === 'sweep-0.9-noexact');
if (provisional) show('provisional-1 equivalent', provisional);
const calibrated = sweep.find((e) => e.policy.id === 'sweep-0.95-noexact-kinds@0.99');
if (calibrated) show('calibrated-1 equivalent', calibrated);
if (chosen) show('Chosen', chosen);
else console.log(`\nNo policy is eligible on ${TUNE_SPLITS.join(' + ')}.`);
console.log(
  `\n${misses.length} relevant records with p(irrelevant) ≥ 0.9 (see "misses"); ${sweep.length} policies swept. Jev requests: ${jev.calls()}. Report: ${values.judgments}/filter-calibration.json`,
);
