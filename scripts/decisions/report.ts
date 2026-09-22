import { CALIBRATION_VERSION, DECISION_SCHEMA_VERSION } from './pins.ts';
import type {
  ConfidenceMeaning,
  DecisionReport,
  DecisionRequest,
  JudgmentId,
  JudgmentOutcome,
  NormalizedJudgment,
  ProviderAttempt,
  ProviderFailure,
  ProviderId,
} from './types.ts';

export function emptyReport(
  request: DecisionRequest,
  provider: ProviderId,
  failure: ProviderFailure | null,
  attempt?: ProviderAttempt,
): DecisionReport {
  const judgments: Partial<Record<JudgmentId, JudgmentOutcome>> = {};
  for (const question of request.questions) {
    judgments[question.id] = {
      disposition: 'unresolved',
      reason: failure?.code ?? 'unavailable',
      result: null,
    };
  }
  return {
    schemaVersion: DECISION_SCHEMA_VERSION,
    calibrationVersion: CALIBRATION_VERSION,
    subjectId: request.subjectId,
    provider,
    model: attempt?.model ?? provider,
    modelRevision: attempt?.modelRevision ?? null,
    runtime: attempt?.runtime ?? provider,
    classifiedAt: new Date().toISOString(),
    judgments,
    attempts: attempt ? [attempt] : [],
    latencyMs: attempt?.latencyMs ?? 0,
    requests: attempt?.requests ?? 0,
    inputTokens: attempt?.inputTokens ?? null,
    outputTokens: attempt?.outputTokens ?? null,
    failure,
    cache: 'miss',
  };
}

/** A provider adapter accepts every well-formed judgment. Cascade policy is applied elsewhere. */
export function acceptAttempt(request: DecisionRequest, attempt: ProviderAttempt): DecisionReport {
  if (attempt.failure) return emptyReport(request, attempt.provider, attempt.failure, attempt);
  const judgments: Partial<Record<JudgmentId, JudgmentOutcome>> = {};
  for (const question of request.questions) {
    const result = attempt.judgments[question.id] ?? null;
    judgments[question.id] = result
      ? { disposition: 'accepted', reason: null, result }
      : { disposition: 'unresolved', reason: 'missing_judgment', result: null };
  }
  return {
    schemaVersion: DECISION_SCHEMA_VERSION,
    calibrationVersion: CALIBRATION_VERSION,
    subjectId: request.subjectId,
    provider: attempt.provider,
    model: attempt.model,
    modelRevision: attempt.modelRevision,
    runtime: attempt.runtime,
    classifiedAt: new Date().toISOString(),
    judgments,
    attempts: [attempt],
    latencyMs: attempt.latencyMs,
    requests: attempt.requests,
    inputTokens: attempt.inputTokens,
    outputTokens: attempt.outputTokens,
    failure: null,
    cache: 'miss',
  };
}

export function choiceResult(
  value: string,
  probabilities: Record<string, number>,
  confidence: number | null,
  confidenceMeaning: ConfidenceMeaning,
  probabilityMeaning: 'model' | 'deterministic',
): NormalizedJudgment {
  return {
    primitive: 'choice',
    value,
    probabilities,
    confidence,
    confidenceMeaning,
    probabilityMeaning,
  };
}

export function noulResult(
  probabilityYes: number,
  probabilityMeaning: 'model' | 'deterministic',
): NormalizedJudgment {
  return {
    primitive: 'noul',
    probabilityYes,
    value: probabilityYes >= 0.5,
    probabilityMeaning,
  };
}

export function deterministicChoice(value: string, options: readonly string[]): NormalizedJudgment {
  const probabilities: Record<string, number> = {};
  for (const option of options) probabilities[option] = option === value ? 1 : 0;
  return choiceResult(value, probabilities, null, 'unavailable', 'deterministic');
}

export function deterministicNoul(value: boolean): NormalizedJudgment {
  return noulResult(value ? 1 : 0, 'deterministic');
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function failure(code: ProviderFailure['code'], message: string): ProviderFailure {
  return { code, message };
}
