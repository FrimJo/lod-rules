import { UNCALIBRATED_POLICY, escalationsFor, type EscalationPolicy } from './policy.ts';
import { CALIBRATION_VERSION, DECISION_SCHEMA_VERSION } from './pins.ts';
import type {
  DecisionReport,
  JudgmentId,
  JudgmentOutcome,
  ProviderAttempt,
  SemanticDecisionProvider,
} from './types.ts';

/**
 * Cascade policy lives here, not inside provider adapters. Adapters only run
 * one backend and return its judgments.
 */
export function createCascadeProvider(
  providers: readonly SemanticDecisionProvider[],
  policy: EscalationPolicy = UNCALIBRATED_POLICY,
): SemanticDecisionProvider {
  return {
    id: 'cascade',
    cacheIdentity: `cascade:${policy.calibrationVersion}:${providers.map((provider) => provider.cacheIdentity).join('>')}`,
    async availability() {
      const reasons: string[] = [];
      let anyAvailable = false;
      for (const provider of providers) {
        const status = await provider.availability();
        if (status.available) anyAvailable = true;
        else if (status.reason) reasons.push(`${provider.id}: ${status.reason}`);
      }
      return anyAvailable
        ? { available: true, reason: null }
        : { available: false, reason: reasons.join('; ') || 'no cascade provider is available' };
    },
    async decide(request) {
      const started = Date.now();
      const attempts: ProviderAttempt[] = [];
      const judgments: Partial<Record<JudgmentId, JudgmentOutcome>> = {};
      let pending = [...request.questions];
      let requests = 0;
      let inputTokens = 0;
      let outputTokens = 0;
      let sawInput = false;
      let sawOutput = false;

      for (const provider of providers) {
        if (pending.length === 0) break;
        const status = await provider.availability();
        if (!status.available) {
          attempts.push(skippedAttempt(provider, status.reason ?? 'unavailable'));
          continue;
        }
        const report = await provider.decide({ ...request, questions: pending });
        const attempt =
          report.attempts[0] ?? skippedAttempt(provider, report.failure?.message ?? 'no attempt');
        if (report.failure && attempt.failure === null) attempt.failure = report.failure;
        const escalations = report.failure
          ? pending.map((question) => ({
              judgment: question.id,
              reason: report.failure?.code ?? 'unavailable',
            }))
          : escalationsFor(provider.id, attempt.judgments, pending, policy);
        attempt.escalations = escalations;
        attempts.push(attempt);
        requests += report.requests;
        if (report.inputTokens !== null) {
          inputTokens += report.inputTokens;
          sawInput = true;
        }
        if (report.outputTokens !== null) {
          outputTokens += report.outputTokens;
          sawOutput = true;
        }
        const escalated = new Set(escalations.map((item) => item.judgment));
        for (const question of pending) {
          const result = attempt.judgments[question.id];
          if (!escalated.has(question.id) && result) {
            judgments[question.id] = { disposition: 'accepted', reason: null, result };
          }
        }
        pending = pending.filter((question) => judgments[question.id] === undefined);
      }

      for (const question of pending) {
        const reason =
          [...attempts]
            .reverse()
            .flatMap((attempt) => attempt.escalations)
            .find((item) => item.judgment === question.id)?.reason ?? 'fallback_unavailable';
        judgments[question.id] = { disposition: 'unresolved', reason, result: null };
      }

      const lastModel = [...attempts].reverse().find((attempt) => attempt.failure === null);
      return {
        schemaVersion: DECISION_SCHEMA_VERSION,
        calibrationVersion: policy.calibrationVersion || CALIBRATION_VERSION,
        subjectId: request.subjectId,
        provider: 'cascade',
        model: providers.map((provider) => provider.id).join('>'),
        modelRevision: lastModel?.modelRevision ?? null,
        runtime: 'cascade',
        classifiedAt: new Date().toISOString(),
        judgments,
        attempts,
        latencyMs: Date.now() - started,
        requests,
        inputTokens: sawInput ? inputTokens : null,
        outputTokens: sawOutput ? outputTokens : null,
        failure: null,
        cache: 'miss',
      } satisfies DecisionReport;
    },
  };
}

function skippedAttempt(provider: SemanticDecisionProvider, message: string): ProviderAttempt {
  return {
    provider: provider.id,
    model: provider.id,
    modelRevision: null,
    runtime: provider.cacheIdentity,
    judgments: {},
    failure: { code: 'unavailable', message },
    latencyMs: 0,
    requests: 0,
    inputTokens: null,
    outputTokens: null,
    escalations: [],
  };
}
