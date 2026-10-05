/** Automated, provisional judgments; never canonical rules or independently reviewed labels. */
export interface RelevanceJudgment {
  id: string;
  relevance: 'direct' | 'supporting' | 'irrelevant' | 'uncertain';
  reason: string;
}

export const ANSWER_NAMES = ['A', 'B', 'C', 'D'] as const;
export type AnswerName = (typeof ANSWER_NAMES)[number];

export interface AnswerJudgment {
  name: AnswerName;
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

/** Judge output schema for `count` anonymous answers named A, B, … */
export const qualitySchemaFor = (count: number) =>
  object({
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
      minItems: count,
      maxItems: count,
      items: object({
        name: { enum: ANSWER_NAMES.slice(0, count) },
        covered: strings,
        missing: strings,
        incorrectClaims: strings,
        unsupportedClaims: strings,
        citationErrors: strings,
        explanation: { type: 'string' },
      }),
    },
  });

export const qualitySchema = qualitySchemaFor(2);

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
  names: readonly AnswerName[] = ['A', 'B'],
): void {
  const classified = judgment.relevance.map((r) => r.id);
  if (!sameMembers(classified, evidenceIds)) {
    const missing = evidenceIds.filter((id) => !classified.includes(id));
    const extra = classified.filter(
      (id, i) => !evidenceIds.includes(id) || classified.indexOf(id) !== i,
    );
    throw new Error(
      `Judge must classify each candidate exactly once (missing: ${missing.join(', ') || 'none'}; extra or repeated: ${extra.join(', ') || 'none'})`,
    );
  }
  if (
    !sameMembers(
      judgment.answers.map((a) => a.name),
      [...names],
    )
  )
    throw new Error(`Judge must grade ${names.join(', ')} exactly once`);
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
  name: AnswerName,
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

/**
 * What a mode removed from the full candidate pool (the lexical + Jev union). Required
 * records pruned are the hard safety metric for any filter.
 */
export function prunedMetrics(
  ids: string[],
  pool: string[],
  lexical: string[],
  required: string[],
  judgment: QualityJudgment,
) {
  const kept = new Set(ids);
  const relevance = new Map(judgment.relevance.map((r) => [r.id, r.relevance]));
  const pruned = pool.filter((id) => !kept.has(id));
  return {
    pruned: pruned.length,
    prunedLexical: pruned.filter((id) => lexical.includes(id)).length,
    prunedRequired: pruned.filter((id) => required.includes(id)).length,
    prunedRelevant: pruned.filter((id) => ['direct', 'supporting'].includes(relevance.get(id)!))
      .length,
    prunedIrrelevant: pruned.filter((id) => relevance.get(id) === 'irrelevant').length,
  };
}
