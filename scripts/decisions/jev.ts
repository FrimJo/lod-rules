import {
  APIConnectionError,
  APITimeoutError,
  AuthenticationError,
  RateLimitError,
  TypeSafeClient,
  TypeSafeError,
  choice,
  noul,
  type Fetch,
} from '@typesafe-ai/sdk';
import { TYPESAFE_DEFAULT_MODEL, TYPESAFE_SDK_VERSION } from './pins.ts';
import type {
  DecisionReport,
  NeutralQuestion,
  NormalizedJudgment,
  ProviderAttempt,
  ProviderFailure,
  SemanticDecisionProvider,
} from './types.ts';
import { acceptAttempt, failure, isRecord } from './report.ts';
import { isFailure, normalizeModelChoice, normalizeModelNoul } from './normalize.ts';

export interface JevProviderOptions {
  /** `null` forces an unauthenticated provider even when the environment has a key. */
  apiKey?: string | null;
  fetch?: Fetch;
  model?: string;
  timeoutMs?: number;
}

export function createJevProvider(options: JevProviderOptions = {}): SemanticDecisionProvider {
  const model = options.model ?? process.env.TYPESAFE_DEFAULT_MODEL ?? TYPESAFE_DEFAULT_MODEL;
  const cacheIdentity = `jev:${model}@typesafe-sdk-${TYPESAFE_SDK_VERSION}`;
  return {
    id: 'jev',
    cacheIdentity,
    async availability() {
      return apiKey(options)
        ? { available: true, reason: null }
        : { available: false, reason: 'TYPESAFE_API_KEY is not set' };
    },
    async decide(request) {
      const started = Date.now();
      const key = apiKey(options);
      if (!key) {
        return failed(
          request,
          model,
          failure('authentication_failure', 'TYPESAFE_API_KEY is not set'),
          started,
        );
      }
      const client = new TypeSafeClient({
        apiKey: key,
        defaultModel: model,
        logLevel: 'off',
        timeout: options.timeoutMs ?? 10_000,
        fetch: options.fetch,
      });
      const questions: Record<string, ReturnType<typeof choice> | ReturnType<typeof noul>> = {};
      for (const question of request.questions) questions[question.id] = toJevQuestion(question);
      try {
        const response = await client.systemOne({
          state: {
            focus: request.state.focus,
            source_text: request.state.source_text,
            term_candidates: request.state.term_candidates ?? null,
          },
          questions,
          model,
        });
        const judgments: ProviderAttempt['judgments'] = {};
        for (const question of request.questions) {
          const normalized = normalizeJevAnswer(question, response.answers[question.id]);
          if (isFailure(normalized)) return failed(request, response.model, normalized, started);
          judgments[question.id] = normalized;
        }
        const attempt: ProviderAttempt = {
          provider: 'jev',
          model: response.model,
          modelRevision: response.model,
          runtime: `typesafe-api sdk@${TYPESAFE_SDK_VERSION}`,
          judgments,
          failure: null,
          latencyMs: Date.now() - started,
          requests: 1,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          escalations: [],
        };
        return acceptAttempt(request, attempt);
      } catch (error) {
        return failed(request, model, classifyJevError(error), started);
      }
    },
  };
}

function apiKey(options: JevProviderOptions): string | null {
  if (options.apiKey === null) return null;
  const value = options.apiKey ?? process.env.TYPESAFE_API_KEY ?? '';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toJevQuestion(
  question: NeutralQuestion,
): ReturnType<typeof choice> | ReturnType<typeof noul> {
  if (question.primitive === 'noul') {
    return noul(question.instructions, {
      true: question.criteria.true ?? null,
      false: question.criteria.false ?? null,
    });
  }
  return choice(question.instructions, question.criteria);
}

function normalizeJevAnswer(
  question: NeutralQuestion,
  answer: unknown,
): NormalizedJudgment | ProviderFailure {
  if (!isRecord(answer))
    return failure('malformed_output', `${question.id}: Jev answer is missing`);
  if (question.primitive === 'noul') return normalizeModelNoul(question, answer.noul);
  return normalizeModelChoice(
    question,
    answer.choice,
    answer.probabilities,
    answer.confidence,
    'distribution_peak',
  );
}

export function classifyJevError(error: unknown): ProviderFailure {
  if (error instanceof AuthenticationError)
    return failure('authentication_failure', 'TypeSafe authentication failed');
  if (error instanceof RateLimitError) return failure('rate_limited', 'TypeSafe rate limit');
  if (error instanceof APITimeoutError) return failure('timeout', 'TypeSafe request timed out');
  if (error instanceof APIConnectionError)
    return failure('unavailable', 'TypeSafe API is unreachable');
  if (error instanceof TypeSafeError)
    return failure('malformed_output', error.message.slice(0, 240));
  return failure('inference_failure', 'TypeSafe request failed');
}

function failed(
  request: Parameters<SemanticDecisionProvider['decide']>[0],
  model: string,
  reason: ProviderFailure,
  started: number,
): DecisionReport {
  const attempt: ProviderAttempt = {
    provider: 'jev',
    model,
    modelRevision: model,
    runtime: `typesafe-api sdk@${TYPESAFE_SDK_VERSION}`,
    judgments: {},
    failure: reason,
    latencyMs: Date.now() - started,
    requests: 0,
    inputTokens: null,
    outputTokens: null,
    escalations: [],
  };
  return acceptAttempt(request, attempt);
}
