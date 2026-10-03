/** Automated, provisional judgments; never canonical rules or independently reviewed labels. */
export interface RelevanceJudgment {
  id: string;
  relevance: 'direct' | 'supporting' | 'irrelevant' | 'uncertain';
  reason: string;
}

export interface AnswerJudgment {
  name: 'A' | 'B';
  covered: string[];
  missing: string[];
  incorrectClaims: string[];
  unsupportedClaims: string[];
  citationErrors: string[];
  explanation: string;
}

export interface QualityJudgment {
  facts: Array<{ id: string; claim: string; sources: string[] }>;
  relevance: RelevanceJudgment[];
  answers: AnswerJudgment[];
}

const strings = { type: 'array', items: { type: 'string' }, uniqueItems: true };
const object = (properties: Record<string, unknown>): object => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const qualitySchema = object({
  facts: {
    type: 'array',
    minItems: 1,
    items: object({ id: { type: 'string' }, claim: { type: 'string' }, sources: strings }),
  },
  relevance: {
    type: 'array',
    items: object({
      id: { type: 'string' },
      relevance: { enum: ['direct', 'supporting', 'irrelevant', 'uncertain'] },
      reason: { type: 'string' },
    }),
  },
  answers: {
    type: 'array',
    minItems: 2,
    maxItems: 2,
    items: object({
      name: { enum: ['A', 'B'] },
      covered: strings,
      missing: strings,
      incorrectClaims: strings,
      unsupportedClaims: strings,
      citationErrors: strings,
      explanation: { type: 'string' },
    }),
  },
});

function sameMembers(actual: string[], expected: string[]): boolean {
  return (
    new Set(actual).size === actual.length &&
    actual.length === expected.length &&
    expected.every((id) => actual.includes(id))
  );
}

/** Reject incomplete/duplicate grading instead of silently inflating accuracy. */
export function validateJudgmentCoverage(
  judgment: QualityJudgment,
  evidenceIds: string[],
  sourceIds: string[],
): void {
  if (
    !sameMembers(
      judgment.relevance.map((r) => r.id),
      evidenceIds,
    )
  )
    throw new Error('Judge must classify each candidate exactly once');
  if (
    !sameMembers(
      judgment.answers.map((a) => a.name),
      ['A', 'B'],
    )
  )
    throw new Error('Judge must grade A and B exactly once');
  const facts = judgment.facts.map((f) => f.id);
  if (new Set(facts).size !== facts.length || facts.length === 0)
    throw new Error('Judge facts must be nonempty and unique');
  for (const fact of judgment.facts)
    if (!fact.sources.length || fact.sources.some((id) => !sourceIds.includes(id)))
      throw new Error(`Unknown or missing source for ${fact.id}`);
  for (const answer of judgment.answers)
    if (!sameMembers([...answer.covered, ...answer.missing], facts))
      throw new Error(`Judge must account for every fact exactly once in ${answer.name}`);
}

export function qualityMetrics(
  ids: string[],
  required: string[],
  judgment: QualityJudgment,
  name: 'A' | 'B',
) {
  const relevance = new Map(judgment.relevance.map((r) => [r.id, r.relevance]));
  if (ids.some((id) => !relevance.has(id))) throw new Error('Ungraded evidence');
  const answer = judgment.answers.find((a) => a.name === name);
  if (!answer) throw new Error('Ungraded answer');
  const relevant = ids.filter((id) => ['direct', 'supporting'].includes(relevance.get(id)!)).length;
  const irrelevant = ids.filter((id) => relevance.get(id) === 'irrelevant').length;
  const uncertain = ids.filter((id) => relevance.get(id) === 'uncertain').length;
  const factualPass = answer.incorrectClaims.length === 0 && answer.unsupportedClaims.length === 0;
  return {
    evidence: ids.length,
    required: required.length,
    found: required.filter((id) => ids.includes(id)).length,
    relevant,
    irrelevant,
    uncertain,
    // Bounds leave uncertain relevance unknown rather than forcing it into either class.
    precisionLower: ids.length ? relevant / ids.length : null,
    precisionUpper: ids.length ? (relevant + uncertain) / ids.length : null,
    factCount: judgment.facts.length,
    factCovered: answer.covered.length,
    factualPass,
    answerComplete: answer.missing.length === 0,
    answerCorrect: factualPass && answer.missing.length === 0 && answer.citationErrors.length === 0,
    citationPass: answer.citationErrors.length === 0,
  };
}
