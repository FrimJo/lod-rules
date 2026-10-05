import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  currentLabels,
  distinctAnswers,
  hash,
  labelProgress,
  loadReview,
  mergeRecordLabels,
  queueBucket,
  recordQueue,
  recordTexts,
  poolIds,
  reviewStatus,
  saveCaseReview,
  summarizeReview,
  trustedRelevance,
  type CaseReview,
  type GradedCase,
} from '../src/evaluation/grading-review.ts';

const judgment = {
  facts: [{ id: 'f1', claim: 'Claim', sources: ['rule.a'] }],
  relevance: [
    { id: 'rule.a', relevance: 'direct' as const, reason: '' },
    { id: 'rule.b', relevance: 'irrelevant' as const, reason: '' },
    { id: 'rule.c', relevance: 'uncertain' as const, reason: '' },
  ],
  answers: [],
};

/** Lexical and union share one answer; jev_alone and filtered have their own. */
const graded: GradedCase = {
  id: 'askq.fixture',
  split: 'development',
  question: 'Question?',
  required: ['rule.a'],
  evidence: {
    lexical: [{ id: 'rule.a' }, { id: 'rule.b' }],
    jev_alone: [{ id: 'rule.c' }],
    union: [{ id: 'rule.a' }, { id: 'rule.b' }],
    filtered: [{ id: 'rule.a' }],
  },
  answers: { lexical: 'shared', union: 'shared', jev_alone: 'jev', filtered: 'filtered' },
  identities: { lexical: 'B', union: 'B', jev_alone: 'A', filtered: 'C' },
  judgment,
  metrics: {
    lexical: { answerCorrect: true },
    union: { answerCorrect: true },
    jev_alone: { answerCorrect: false },
    filtered: { answerCorrect: true },
  },
};

const fullReview: CaseReview = {
  reviewedAt: '2026-10-05T00:00:00.000Z',
  judgmentHash: hash(judgment),
  wrongFacts: ['f1'],
  relevance: { 'rule.a': 'direct', 'rule.b': 'supporting', 'rule.c': 'irrelevant' },
  answers: {
    [hash('shared')]: { correct: false },
    [hash('jev')]: { correct: false },
    [hash('filtered')]: { correct: true },
  },
};

test('identical answers are reviewed once and the pool covers every mode', () => {
  const answers = distinctAnswers(graded);
  assert.deepEqual(
    answers.map((a) => [a.name, a.modes]),
    [
      ['A', ['jev_alone']],
      ['B', ['lexical', 'union']],
      ['C', ['filtered']],
    ],
  );
  assert.deepEqual(poolIds(graded), ['rule.a', 'rule.b', 'rule.c']);
});

test('status needs every answer and record; a changed judgment with gaps is stale', () => {
  assert.equal(reviewStatus(graded, undefined), 'unreviewed');
  assert.equal(reviewStatus(graded, fullReview), 'reviewed');
  const { [hash('jev')]: _dropped, ...partialAnswers } = fullReview.answers;
  assert.equal(reviewStatus(graded, { ...fullReview, answers: partialAnswers }), 'partial');
  assert.equal(
    reviewStatus(graded, { ...fullReview, answers: partialAnswers, judgmentHash: 'old' }),
    'stale',
  );
});

test('agreement counts the judge against the reviewer on reviewed items only', () => {
  const summary = summarizeReview([graded], { version: 1, cases: { [graded.id]: fullReview } });
  assert.equal(summary.answers.reviewed, 3);
  assert.equal(summary.answers.agreed, 2);
  assert.deepEqual(
    summary.answers.judgeTooLenient.map((r) => r.modes),
    [['lexical', 'union']],
  );
  assert.deepEqual(summary.perMode.union, { reviewed: 1, judgeCorrect: 1, humanCorrect: 0 });
  assert.deepEqual(summary.perMode.filtered, { reviewed: 1, judgeCorrect: 1, humanCorrect: 1 });
  assert.equal(summary.relevance.labelled, 3);
  assert.equal(summary.relevance.exactAgreement, 1 / 3);
  assert.equal(summary.relevance.relevantVsIrrelevantAgreement, 1 / 3);
  assert.deepEqual(summary.facts, { reviewed: 1, wrong: 1 });
});

test('reviews round-trip through the file, and reviewed labels override the judge', () => {
  const dir = mkdtempSync(join(tmpdir(), 'grading-review-'));
  const path = join(dir, 'nested', 'grading-review.json');
  try {
    assert.deepEqual(loadReview(path), { version: 1, cases: {} });
    saveCaseReview(graded.id, fullReview, path);
    const review = loadReview(path);
    assert.deepEqual(review.cases[graded.id], fullReview);
    const trusted = trustedRelevance(graded, review);
    assert.deepEqual(trusted.get('rule.b'), { label: 'supporting', reviewed: true });
    const untouched = trustedRelevance(graded, { version: 1, cases: {} });
    assert.deepEqual(untouched.get('rule.b'), { label: 'irrelevant', reviewed: false });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a label whose record text changed is stale and falls back to the judge', () => {
  const texts = new Map([
    ['rule.a', 'A text'],
    ['rule.b', 'B text, edited'],
  ]);
  const review: CaseReview = {
    ...fullReview,
    recordHashes: { 'rule.a': hash('A text'), 'rule.b': hash('B text') },
  };
  const { labels, stale } = currentLabels(review, texts);
  assert.deepEqual(stale, ['rule.b']);
  // rule.c has no stored hash: labels from before hashing stay trusted.
  assert.deepEqual([...labels.keys()], ['rule.a', 'rule.c']);
  const trusted = trustedRelevance(graded, { version: 1, cases: { [graded.id]: review } }, texts);
  assert.deepEqual(trusted.get('rule.b'), { label: 'irrelevant', reviewed: false });
});

test('a queue label merges into the case review and keeps answer verdicts', () => {
  const texts = new Map([['rule.b', 'B text']]);
  const merged = mergeRecordLabels(fullReview, { 'rule.b': 'direct' }, texts, 'new', 'now');
  assert.equal(merged.relevance['rule.b'], 'direct');
  assert.equal(merged.relevance['rule.a'], 'direct');
  assert.deepEqual(merged.answers, fullReview.answers);
  assert.equal(merged.judgmentHash, fullReview.judgmentHash);
  assert.deepEqual(merged.recordHashes, { 'rule.b': hash('B text') });
  const fresh = mergeRecordLabels(undefined, { 'rule.a': 'irrelevant' }, texts, 'new', 'now');
  assert.deepEqual(fresh.answers, {});
  assert.equal(fresh.judgmentHash, 'new');
});

test('the queue serves filter mistakes first and skips labelled and held-out records', () => {
  const at = (p: number | null, extra: Partial<Parameters<typeof queueBucket>[0]> = {}) =>
    queueBucket({
      caseId: 'c',
      recordId: 'r',
      judge: 'supporting',
      pIrrelevant: p,
      kept: true,
      why: ['search'],
      ...extra,
    });
  assert.equal(at(0.95, { kept: false }), 'dropped_relevant');
  assert.equal(at(0.7), 'threshold_band');
  assert.equal(at(0.2, { judge: 'irrelevant' }), 'threshold_band');
  assert.equal(at(0.1, { why: ['heading:section.x'] }), 'new_step');
  // A record Jev and the judge agree on is at most sampled.
  assert.ok([null, 'sample'].includes(at(0.02, { judge: 'direct' })));

  const withFilter: GradedCase = {
    ...graded,
    evidence: {
      ...graded.evidence,
      union: [
        { id: 'rule.a', text: 'A' },
        { id: 'rule.b', text: 'B' },
      ],
    },
    filter: {
      decisions: [
        {
          id: 'rule.a',
          why: ['search'],
          kept: false,
          reason: 'irrelevant',
          judgment: { probabilities: { irrelevant: 0.95 } },
        },
        {
          id: 'rule.b',
          why: ['search'],
          kept: true,
          reason: 'relevant',
          judgment: { probabilities: { irrelevant: 0.7 } },
        },
      ],
    },
  };
  const empty = { version: 1 as const, cases: {} };
  const queue = recordQueue([withFilter], empty);
  assert.deepEqual(
    queue.slice(0, 2).map((i) => [i.recordId, i.bucket]),
    [
      ['rule.a', 'dropped_relevant'],
      ['rule.b', 'threshold_band'],
    ],
  );
  const labelled = {
    version: 1 as const,
    cases: {
      [graded.id]: mergeRecordLabels(
        undefined,
        { 'rule.a': 'direct' },
        recordTexts(withFilter),
        'h',
      ),
    },
  };
  assert.ok(!recordQueue([withFilter], labelled).some((i) => i.recordId === 'rule.a'));
  assert.equal(recordQueue([{ ...withFilter, split: 'held_out' }], empty).length, 0);
  assert.ok(
    recordQueue([{ ...withFilter, split: 'held_out' }], empty, { includeHeldOut: true }).length > 0,
  );
  assert.deepEqual(labelProgress([withFilter], labelled), {
    total: 1,
    relevantInBand: 1,
    targets: { total: 300, relevantInBand: 60 },
  });
});
