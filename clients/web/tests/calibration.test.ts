import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RecordJudgment } from '../../../scripts/ask/ranking.ts';
import {
  choosePolicy,
  clopperPearsonUpper,
  isFloatingModel,
  policyGrid,
  scorePolicy,
  staleReasons,
  sweepPolicies,
  type CalibrationCase,
  type CalibrationInputs,
  type Label,
} from '../src/evaluation/calibration.ts';

test('the loss bound matches the rule of three with no losses', () => {
  assert.ok(Math.abs(clopperPearsonUpper(0, 60) - (1 - 0.05 ** (1 / 60))) < 1e-6);
  assert.ok(clopperPearsonUpper(0, 60) < 0.05);
  assert.ok(clopperPearsonUpper(1, 60) > clopperPearsonUpper(0, 60));
  assert.equal(clopperPearsonUpper(0, 0), 1);
});

test('the grid has unique ids and includes the provisional policy', () => {
  const grid = policyGrid();
  assert.equal(new Set(grid.map((p) => p.id)).size, grid.length);
  const provisional = grid.find((p) => p.id === 'sweep-0.9-noexact');
  assert.deepEqual(provisional, {
    id: 'sweep-0.9-noexact',
    dropIrrelevantAt: 0.9,
    protectExact: false,
    protectLinked: true,
    cap: false,
  });
});

const judged = (irrelevant: number): RecordJudgment => ({
  id: '',
  relevance: 'irrelevant',
  probabilities: { direct: 1 - irrelevant, supporting: 0, irrelevant },
});

function fixture(split: string): CalibrationCase {
  const ids = ['noise', 'wounded', 'useful'];
  return {
    id: `askq.${split}`,
    split,
    candidates: ids.map((id) => ({
      id,
      kind: 'rule',
      why: id === 'wounded' ? ['heading:section.combat.wounded'] : ['search'],
      sources: ['lexical' as const],
      exact: false,
    })),
    judgments: new Map([
      ['noise', judged(0.97)],
      ['wounded', judged(1)],
      ['useful', judged(0.2)],
    ]),
    capLimit: 10,
    required: [],
    human: new Map<string, Label>([['wounded', 'direct']]),
    judge: new Map<string, Label>([
      ['noise', 'irrelevant'],
      ['wounded', 'irrelevant'],
      ['useful', 'direct'],
    ]),
    textLength: new Map([['noise', 400]]),
  };
}

test('reviewer labels override the judge, and a structural protection rescues a sure miss', () => {
  const cases = [fixture('development'), fixture('validation')];
  const plain = {
    id: 'p',
    dropIrrelevantAt: 0.9,
    protectExact: false,
    protectLinked: true,
    cap: false,
  };
  const score = scorePolicy(plain, cases, ['development']);
  assert.equal(score.human.dropped.direct, 1);
  assert.equal(score.trusted.dropped.direct, 1);
  assert.equal(score.trusted.dropped.irrelevant, 1);
  assert.equal(score.tokensSaved, 100);

  const chosen = choosePolicy(sweepPolicies(cases, ['development', 'validation']), 0.05);
  assert.ok(chosen);
  assert.equal(chosen.tune.human.dropped.direct, 0);
  assert.equal(chosen.tune.trusted.dropped.irrelevant, 2);
  assert.deepEqual(chosen.policy.protectWhy, ['heading:', 'section:']);
});

test('a stored calibration goes stale when what it depends on changes', () => {
  const saved: CalibrationInputs = {
    jev: 'jev:a',
    corpus: 'c',
    code: 'x',
    labels: 'l',
    humanLabels: 10,
  };
  assert.deepEqual(staleReasons(saved, { ...saved }), []);
  assert.deepEqual(staleReasons(saved, { ...saved, humanLabels: 109 }), []);
  assert.equal(staleReasons(saved, { ...saved, humanLabels: 110 }).length, 1);
  assert.match(staleReasons(saved, { ...saved, jev: 'jev:b', code: 'y' }).join('; '), /Jev.*code/);
  assert.ok(isFloatingModel('jev:jev-latest'));
  assert.ok(!isFloatingModel('jev:jev-2026-09'));
});
