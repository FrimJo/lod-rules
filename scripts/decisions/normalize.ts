import type {
  ConfidenceMeaning,
  NeutralQuestion,
  NormalizedJudgment,
  ProviderFailure,
} from './types.ts';
import { failure, isRecord } from './report.ts';

export function normalizeModelChoice(
  question: NeutralQuestion,
  value: unknown,
  probabilities: unknown,
  confidence: unknown,
  confidenceMeaning: ConfidenceMeaning,
): NormalizedJudgment | ProviderFailure {
  if (typeof value !== 'string' || !(value in question.criteria)) {
    return failure('malformed_output', `${question.id}: choice is outside the supplied options`);
  }
  const parsed = numericRecord(probabilities);
  if (!parsed || parsed[value] === undefined) {
    return failure('malformed_output', `${question.id}: choice probabilities are missing`);
  }
  if (confidence !== null && confidence !== undefined && typeof confidence !== 'number') {
    return failure('malformed_output', `${question.id}: confidence is not a number`);
  }
  return {
    primitive: 'choice',
    value,
    probabilities: parsed,
    confidence: typeof confidence === 'number' ? confidence : null,
    confidenceMeaning: typeof confidence === 'number' ? confidenceMeaning : 'unavailable',
    probabilityMeaning: 'model',
  };
}

export function normalizeModelNoul(
  question: NeutralQuestion,
  probabilityYes: unknown,
): NormalizedJudgment | ProviderFailure {
  if (typeof probabilityYes !== 'number' || probabilityYes < 0 || probabilityYes > 1) {
    return failure('malformed_output', `${question.id}: noul probability is outside 0..1`);
  }
  return {
    primitive: 'noul',
    probabilityYes,
    value: probabilityYes >= 0.5,
    probabilityMeaning: 'model',
  };
}

export function isFailure(value: NormalizedJudgment | ProviderFailure): value is ProviderFailure {
  return 'code' in value;
}

function numericRecord(value: unknown): Record<string, number> | null {
  if (!isRecord(value)) return null;
  const probabilities: Record<string, number> = {};
  for (const [key, probability] of Object.entries(value)) {
    if (typeof probability !== 'number') return null;
    probabilities[key] = probability;
  }
  return probabilities;
}
