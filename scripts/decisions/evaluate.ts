import type { GoldCase } from './gold.ts';
import { expectedLabel } from './gold.ts';
import type { DecisionReport, JudgmentId, NormalizedJudgment } from './types.ts';

export interface JudgmentScore {
  caseId: string;
  split: GoldCase['split'];
  complexity: string;
  judgment: JudgmentId;
  expected: string | boolean;
  actual: string | boolean | null;
  match: boolean | null;
  probabilityYes: number | null;
  confidence: number | null;
  probabilityMeaning: NormalizedJudgment['probabilityMeaning'] | null;
  choiceSetSize: number | null;
  disposition: string | null;
  latencyMs: number;
}

export interface ClassCounts {
  correct: number;
  answered: number;
  accuracy: number | null;
}

export interface BooleanCounts {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export interface EvaluationReport {
  provider: string;
  model: string;
  modelRevision: string | null;
  cases: number;
  failures: number;
  byJudgment: Record<string, ClassCounts>;
  booleanJudgments: Record<string, BooleanCounts>;
  byChoiceSetSize: Record<string, ClassCounts>;
  byComplexity: Record<string, ClassCounts>;
  bySplit: Record<string, ClassCounts>;
  noulBrier: number | null;
  latencyMs: { mean: number; max: number };
  scores: JudgmentScore[];
}

export function scoreCase(gold: GoldCase, report: DecisionReport): JudgmentScore[] {
  const scores: JudgmentScore[] = [];
  for (const question of gold.request.questions) {
    const expected = expectedLabel(gold.expected, question.id);
    if (expected === null) continue;
    const outcome = report.judgments[question.id];
    const result = outcome?.result ?? null;
    const actual = result ? (result.primitive === 'noul' ? result.value : result.value) : null;
    scores.push({
      caseId: gold.id,
      split: gold.split,
      complexity: gold.complexity,
      judgment: question.id,
      expected,
      actual,
      match: actual === null ? null : actual === expected,
      probabilityYes: result?.primitive === 'noul' ? result.probabilityYes : null,
      confidence: result?.primitive === 'choice' ? result.confidence : null,
      probabilityMeaning: result?.probabilityMeaning ?? null,
      choiceSetSize: question.primitive === 'choice' ? question.optionCount : null,
      disposition: outcome?.disposition ?? null,
      latencyMs: report.latencyMs,
    });
  }
  return scores;
}

export function summarize(
  provider: string,
  model: string,
  modelRevision: string | null,
  cases: number,
  failures: number,
  scores: JudgmentScore[],
): EvaluationReport {
  const latencies = scores.map((score) => score.latencyMs);
  return {
    provider,
    model,
    modelRevision,
    cases,
    failures,
    byJudgment: group(scores, (score) => score.judgment),
    booleanJudgments: booleanCounts(scores),
    byChoiceSetSize: group(
      scores.filter((score) => score.choiceSetSize !== null),
      (score) => choiceBucket(score.choiceSetSize ?? 0),
    ),
    byComplexity: group(scores, (score) => score.complexity),
    bySplit: group(scores, (score) => score.split),
    noulBrier: brier(scores),
    latencyMs: {
      mean:
        latencies.length === 0
          ? 0
          : latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
      max: latencies.length === 0 ? 0 : Math.max(...latencies),
    },
    scores,
  };
}

export function choiceBucket(size: number): string {
  if (size < 10) return 'under_10';
  if (size < 20) return '10_to_19';
  return '20_or_more';
}

function group(
  scores: JudgmentScore[],
  key: (score: JudgmentScore) => string,
): Record<string, ClassCounts> {
  const groups: Record<string, ClassCounts> = {};
  for (const score of scores) {
    const name = key(score);
    const counts = groups[name] ?? { correct: 0, answered: 0, accuracy: null };
    if (score.match !== null) {
      counts.answered += 1;
      if (score.match) counts.correct += 1;
    }
    counts.accuracy = counts.answered === 0 ? null : counts.correct / counts.answered;
    groups[name] = counts;
  }
  return groups;
}

function booleanCounts(scores: JudgmentScore[]): Record<string, BooleanCounts> {
  const counts: Record<string, BooleanCounts> = {};
  for (const score of scores) {
    if (typeof score.expected !== 'boolean' || typeof score.actual !== 'boolean') continue;
    const row = counts[score.judgment] ?? {
      truePositive: 0,
      falsePositive: 0,
      trueNegative: 0,
      falseNegative: 0,
    };
    if (score.expected && score.actual) row.truePositive += 1;
    else if (!score.expected && score.actual) row.falsePositive += 1;
    else if (!score.expected && !score.actual) row.trueNegative += 1;
    else row.falseNegative += 1;
    counts[score.judgment] = row;
  }
  return counts;
}

function brier(scores: JudgmentScore[]): number | null {
  const rows = scores.filter(
    (score) =>
      score.probabilityYes !== null &&
      typeof score.expected === 'boolean' &&
      score.probabilityMeaning === 'model',
  );
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, score) => {
    const target = score.expected === true ? 1 : 0;
    const probability = score.probabilityYes ?? 0;
    return sum + (probability - target) ** 2;
  }, 0);
  return total / rows.length;
}
