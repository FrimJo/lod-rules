import { describe, expect, it } from 'vitest';
import {
  prunedMetrics,
  qualityMetrics,
  qualitySchema,
  qualitySchemaFor,
  validateJudgmentCoverage,
  type QualityJudgment,
} from '../../clients/web/src/evaluation/quality.ts';
import { createAjv } from '../../scripts/validate/schemas.ts';

const fixture = (): QualityJudgment => ({
  facts: [{ id: 'f1', claim: 'The answer requires this fact.', sources: ['rule.required'] }],
  relevance: [
    { id: 'rule.required', relevance: 'direct', reason: 'Answers the question.' },
    { id: 'rule.context', relevance: 'supporting', reason: 'Explains a needed term.' },
    { id: 'rule.other', relevance: 'irrelevant', reason: 'Different quest.' },
    { id: 'rule.unknown', relevance: 'uncertain', reason: 'Insufficient text.' },
  ],
  answers: [
    {
      name: 'A',
      covered: ['f1'],
      missing: [],
      incorrectClaims: [],
      unsupportedClaims: [],
      citationErrors: [],
      explanation: 'Complete and supported.',
    },
    {
      name: 'B',
      covered: [],
      missing: ['f1'],
      incorrectClaims: [],
      unsupportedClaims: [],
      citationErrors: [],
      explanation: 'Safe abstention, incomplete.',
    },
  ],
});
const ids = ['rule.required', 'rule.context', 'rule.other', 'rule.unknown'];

describe('provisional evidence and answer quality scoring', () => {
  it('does not count unlabelled but useful context as irrelevant', () => {
    const metrics = qualityMetrics(ids, ['rule.required'], fixture(), 'A');
    expect(metrics).toMatchObject({
      relevant: 2,
      irrelevant: 1,
      uncertain: 1,
      precisionLower: 0.5,
      precisionUpper: 0.75,
      required: 1,
      found: 1,
      answerCorrect: true,
    });
  });

  it('separates safe abstention from a correct and complete answer', () => {
    expect(qualityMetrics(ids, ['rule.required'], fixture(), 'B')).toMatchObject({
      factualPass: true,
      answerComplete: false,
      answerCorrect: false,
    });
  });

  it.each(['incorrectClaims', 'unsupportedClaims', 'citationErrors'] as const)(
    'does not pass an otherwise complete answer with %s',
    (field) => {
      const judgment = fixture();
      judgment.answers[0]![field] = ['A concrete error'];
      expect(qualityMetrics(ids, ['rule.required'], judgment, 'A').answerCorrect).toBe(false);
    },
  );

  it('rejects malformed shapes, omitted classifications and duplicated classifications', () => {
    const validate = createAjv().compile(qualitySchema);
    expect(validate(fixture())).toBe(true);
    expect(validate({ ...fixture(), answers: [] })).toBe(false);
    const omitted = fixture();
    omitted.relevance.pop();
    expect(() => validateJudgmentCoverage(omitted, ids, ids)).toThrow(/each candidate/);
    const duplicate = fixture();
    duplicate.relevance[3] = duplicate.relevance[0]!;
    expect(() => validateJudgmentCoverage(duplicate, ids, ids)).toThrow(/each candidate/);
  });

  it('rejects unknown fact sources and incomplete or double-counted fact coverage', () => {
    expect(() => validateJudgmentCoverage(fixture(), ids, ids)).not.toThrow();
    const source = fixture();
    source.facts[0]!.sources = ['invented'];
    expect(() => validateJudgmentCoverage(source, ids, ids)).toThrow(/source/);
    const missing = fixture();
    missing.answers[0]!.covered = [];
    expect(() => validateJudgmentCoverage(missing, ids, ids)).toThrow(/every fact/);
    const duplicate = fixture();
    duplicate.answers[0]!.missing = ['f1'];
    expect(() => validateJudgmentCoverage(duplicate, ids, ids)).toThrow(/every fact/);
  });

  it('grades as many answers as were sent, each exactly once', () => {
    const three = fixture();
    three.answers.push({ ...three.answers[1]!, name: 'C' });
    const validate = createAjv().compile(qualitySchemaFor(3));
    expect(validate(three)).toBe(true);
    expect(validate(fixture())).toBe(false);
    expect(() => validateJudgmentCoverage(three, ids, ids, ['A', 'B', 'C'])).not.toThrow();
    expect(() => validateJudgmentCoverage(fixture(), ids, ids, ['A', 'B', 'C'])).toThrow(
      /A, B, C exactly once/,
    );
  });

  it('names omitted and extra candidates when coverage fails', () => {
    const omitted = fixture();
    omitted.relevance.pop();
    expect(() => validateJudgmentCoverage(omitted, ids, ids)).toThrow(/missing: rule\.unknown/);
  });

  it('counts what a mode pruned from the candidate pool', () => {
    expect(
      prunedMetrics(
        ['rule.required'],
        ids,
        ['rule.required', 'rule.other'],
        ['rule.required'],
        fixture(),
      ),
    ).toEqual({
      pruned: 3,
      prunedLexical: 1,
      prunedRequired: 0,
      prunedRelevant: 1,
      prunedIrrelevant: 1,
    });
  });
});
