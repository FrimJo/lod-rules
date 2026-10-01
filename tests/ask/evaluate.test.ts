import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  COMPLEXITY,
  INTENTS,
  SYSTEMS,
  analyzeQuestion,
  lexicalAnalysis,
  type ModelQuestion,
  type SystemOneModel,
} from '../../scripts/ask/analysis.ts';
import { cascadeModel, uncertainAnswers } from '../../scripts/ask/cascade.ts';
import { gatherEvidence } from '../../scripts/ask/evidence.ts';
import { memoModel, scoreCase, summarize } from '../../scripts/ask/evaluate.ts';
import { LABEL_SPLITS, loadLabels, type LabelledQuestion } from '../../scripts/ask/labels.ts';
import { Retrieval } from '../../scripts/retrieve/index.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';

let retrieval: Retrieval;
let labels: LabelledQuestion[];
beforeAll(() => {
  retrieval = Retrieval.fromCorpus();
  labels = loadLabels(retrieval);
}, 60_000);
afterAll(() => retrieval.close());

type Answers = (questions: Record<string, ModelQuestion>) => Record<string, unknown>;

function fixtureModel(id: string, answers: Answers): SystemOneModel & { asked: Array<string[]> } {
  const asked: Array<string[]> = [];
  return {
    id,
    probabilityMeaning: 'model',
    asked,
    async ask(_state, questions) {
      asked.push(Object.keys(questions));
      return { answers: answers(questions) };
    },
  };
}

function uniform(
  choice: (id: string, question: ModelQuestion) => [string, number],
  noul: number,
): Answers {
  return (questions) => {
    const out: Record<string, unknown> = {};
    for (const [id, question] of Object.entries(questions)) {
      if (question.type === 'noul') out[id] = { noul };
      else {
        const [option, p] = choice(id, question);
        out[id] = { choice: option, probabilities: { [option]: p } };
      }
    }
    return out;
  };
}

/** Says yes to every system, the widest budget and the first entity option. */
const widest = uniform((id, question) => {
  if (id === 'complexity') return ['judgment', 0.99];
  if (id === 'intent') return ['no_match', 0.99];
  return [Object.keys(question.criteria)[0]!, 0.99];
}, 0.99);

/** Says no to every system, the smallest budget and no entity. */
const narrowest = uniform((id) => [id === 'complexity' ? 'single_fact' : 'no_match', 0.99], 0.01);

describe('labelled question set', () => {
  it('loads, resolves every id and fills every split', () => {
    expect(labels.length).toBeGreaterThanOrEqual(30);
    for (const split of LABEL_SPLITS) {
      expect(labels.filter((label) => label.split === split).length).toBeGreaterThanOrEqual(10);
    }
  });

  it('uses the same intent and complexity options as the analysis', () => {
    const schema = JSON.parse(
      readFileSync(join(repoRoot, 'schemas/ask-question-labels.schema.json'), 'utf8'),
    ) as {
      $defs: {
        case: {
          properties: {
            expected: { properties: Record<string, { enum?: string[] }> };
          };
        };
      };
    };
    const expected = schema.$defs.case.properties.expected.properties;
    expect(expected.intent?.enum).toEqual(Object.keys(INTENTS));
    expect(expected.complexity?.enum).toEqual(Object.keys(COMPLEXITY));
  });
});

describe('model analysis can widen retrieval but never narrow it', () => {
  it.each([
    ['widest', widest],
    ['narrowest', narrowest],
  ])(
    'keeps every lexical record on every labelled question (%s model)',
    async (_name, answers) => {
      const model = fixtureModel('fixture', answers);
      for (const label of labels) {
        const lexical = gatherEvidence(retrieval, lexicalAnalysis(retrieval, label.question));
        const analysis = await analyzeQuestion(retrieval, label.question, model);
        expect(analysis.fallback).toBeUndefined();
        const ids = new Set(gatherEvidence(retrieval, analysis).map((item) => item.id));
        expect(
          lexical.map((item) => item.id).filter((id) => !ids.has(id)),
          label.id,
        ).toEqual([]);
      }
    },
    60_000,
  );
});

describe('Laya → Jev cascade', () => {
  const questions: Record<string, ModelQuestion> = {
    intent: { type: 'choice', instructions: 'i', criteria: { a: 'A', b: 'B' } },
    complexity: { type: 'choice', instructions: 'c', criteria: { x: 'X', y: 'Y' } },
    system_magic: { type: 'noul', instructions: 'm', criteria: { true: 'y', false: 'n' } },
    system_combat: { type: 'noul', instructions: 'b', criteria: { true: 'y', false: 'n' } },
  };
  const policy = { id: 'test', choiceFloor: 0.6, noulMargin: 0.3 };
  const unsure = (): Record<string, unknown> => ({
    intent: { choice: 'a', probabilities: { a: 0.9, b: 0.1 } },
    complexity: { choice: 'x', probabilities: { x: 0.4, y: 0.35 } },
    system_magic: { noul: 0.97 },
    system_combat: { noul: 0.55 },
  });
  const jevAnswers = (): Record<string, unknown> => ({
    complexity: { choice: 'y', probabilities: { y: 0.8 } },
    system_combat: { noul: 0.1 },
  });

  it('flags low-probability choices and nouls near 0.5', () => {
    expect(uncertainAnswers(unsure(), questions, policy).map((u) => u.question)).toEqual([
      'complexity',
      'system_combat',
    ]);
  });

  it('asks the fallback only the unsure answers and keeps the rest', async () => {
    const laya = fixtureModel('laya', unsure);
    const jev = fixtureModel('jev', jevAnswers);
    const response = await cascadeModel(laya, jev, policy).ask({}, questions);
    expect(jev.asked).toEqual([['complexity', 'system_combat']]);
    expect(response.answers).toMatchObject({
      intent: { choice: 'a' },
      complexity: { choice: 'y' },
      system_magic: { noul: 0.97 },
      system_combat: { noul: 0.1 },
    });
    expect(response.escalations?.map((e) => [e.question, e.answeredBy])).toEqual([
      ['complexity', 'jev'],
      ['system_combat', 'jev'],
    ]);
  });

  it('does not call the fallback when the first model is sure', async () => {
    const sure = fixtureModel('laya', () => ({
      ...unsure(),
      complexity: { choice: 'x', probabilities: { x: 0.9 } },
      system_combat: { noul: 0.02 },
    }));
    const jev = fixtureModel('jev', jevAnswers);
    const response = await cascadeModel(sure, jev, policy).ask({}, questions);
    expect(jev.asked).toEqual([]);
    expect(response.escalations).toEqual([]);
  });

  it('keeps the first answers when the fallback fails or is missing', async () => {
    const broken: SystemOneModel = {
      id: 'jev',
      probabilityMeaning: 'model',
      ask: () => Promise.reject(new Error('401 unauthorized')),
    };
    for (const fallback of [broken, null]) {
      const response = await cascadeModel(fixtureModel('laya', unsure), fallback, policy).ask(
        {},
        questions,
      );
      expect(response.answers).toEqual(unsure());
      expect(response.escalations?.every((e) => e.answeredBy === 'laya')).toBe(true);
    }
    const failed = await cascadeModel(fixtureModel('laya', unsure), broken, policy).ask(
      {},
      questions,
    );
    expect(failed.escalations?.[0]?.reason).toMatch(/jev failed: 401/);
  });

  it('sends every question to the fallback when the first model fails', async () => {
    const broken: SystemOneModel = {
      id: 'laya',
      probabilityMeaning: 'model',
      ask: () => Promise.reject(new Error('onnx load failed')),
    };
    const jev = fixtureModel('jev', unsure);
    const response = await cascadeModel(broken, jev, policy).ask({}, questions);
    expect(jev.asked).toEqual([Object.keys(questions)]);
    expect(response.escalations).toHaveLength(Object.keys(questions).length);
  });

  it('records escalations on the question analysis', async () => {
    const laya = fixtureModel('laya', (qs) => ({
      ...uniform(() => ['no_match', 0.99], 0.01)(qs),
      complexity: { choice: 'single_fact', probabilities: { single_fact: 0.34 } },
    }));
    const jev = fixtureModel('jev', () => ({
      complexity: { choice: 'multi_rule', probabilities: { multi_rule: 0.54 } },
    }));
    const analysis = await analyzeQuestion(
      retrieval,
      labels[0]!.question,
      cascadeModel(laya, jev, policy),
    );
    expect(analysis.analyzer).toBe('laya>jev');
    expect(analysis.complexity.value).toBe('multi_rule');
    expect(analysis.escalations).toEqual([
      { question: 'complexity', reason: 'single_fact 0.34', answeredBy: 'jev' },
    ]);
  });
});

describe('evaluation', () => {
  it('replays answers per question, so a subset costs no new request', async () => {
    const inner = fixtureModel(
      'jev',
      uniform(() => ['a', 0.9], 0.2),
    );
    const memo = memoModel(inner);
    const questions: Record<string, ModelQuestion> = {
      one: { type: 'choice', instructions: '1', criteria: { a: 'A' } },
      two: { type: 'noul', instructions: '2', criteria: {} },
    };
    await memo.ask({ q: 'x' }, questions);
    const replay = await memo.ask({ q: 'x' }, { two: questions.two! });
    expect(inner.asked).toEqual([['one', 'two']]);
    expect(replay.answers).toEqual({ two: { noul: 0.2 } });
    await memo.ask({ q: 'other' }, { two: questions.two! });
    expect(memo.calls()).toBe(2);
  });

  it('scores required evidence, dropped baseline records and judgments', async () => {
    const label = labels.find((l) => l.id === 'askq.poison_bleeding_rest')!;
    const lexical = lexicalAnalysis(retrieval, label.question);
    const lexicalIds = gatherEvidence(retrieval, lexical).map((item) => item.id);
    expect(scoreCase(retrieval, label, lexical, lexicalIds)).toMatchObject({
      required: 3,
      alone: { missing: [], dropped: [] },
      union: null,
      intent: true,
    });

    const narrow = await analyzeQuestion(
      retrieval,
      label.question,
      fixtureModel('fixture', narrowest),
    );
    const score = scoreCase(retrieval, label, narrow, lexicalIds);
    expect(score.underBudget).toBe(true);
    expect(score.chapterMissed).toEqual(label.requiredEvidence);
    expect(score.alone.dropped.length).toBeGreaterThan(0);
    expect(score.union).toMatchObject({ missing: [], dropped: [] });
    const summary = summarize('fixture + lexical', 'development', [score], 'union');
    expect(summary).toMatchObject({ recall: 1, complete: 1, dropped: 0, underBudget: 1 });
    expect(Object.keys(SYSTEMS)).toContain('conditions');
  });
});
