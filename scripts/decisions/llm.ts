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

/**
 * There is no extraction LLM in this repository. This adapter runs only when a
 * caller injects a completer, which is how cascade tests and an operator-supplied
 * fallback reach it. It does not open a network connection by itself.
 */
export interface LlmCompleter {
  id: string;
  complete(prompt: string): Promise<string>;
}

export function createLlmProvider(completer: LlmCompleter | null): SemanticDecisionProvider {
  const cacheIdentity = completer ? `llm:${completer.id}` : 'llm:unconfigured';
  return {
    id: 'llm',
    cacheIdentity,
    async availability() {
      return completer
        ? { available: true, reason: null }
        : { available: false, reason: 'no LLM completer is configured' };
    },
    async decide(request) {
      const started = Date.now();
      if (!completer) {
        return failed(
          request,
          failure('no_completer', 'no LLM completer is configured'),
          started,
          cacheIdentity,
        );
      }
      let text: string;
      try {
        text = await completer.complete(promptFor(request.state, request.questions));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'LLM completer failed';
        return failed(
          request,
          failure('inference_failure', message.slice(0, 240)),
          started,
          cacheIdentity,
        );
      }
      const parsed = parseJsonObject(text);
      if (!parsed) {
        return failed(
          request,
          failure('malformed_output', 'LLM response was not a JSON object'),
          started,
          cacheIdentity,
        );
      }
      const judgments: ProviderAttempt['judgments'] = {};
      for (const question of request.questions) {
        const normalized = normalizeLlmAnswer(question, parsed[question.id]);
        if (isFailure(normalized)) return failed(request, normalized, started, cacheIdentity);
        judgments[question.id] = normalized;
      }
      const attempt: ProviderAttempt = {
        provider: 'llm',
        model: completer.id,
        modelRevision: completer.id,
        runtime: 'injected-completer',
        judgments,
        failure: null,
        latencyMs: Date.now() - started,
        requests: 1,
        inputTokens: null,
        outputTokens: null,
        escalations: [],
      };
      return acceptAttempt(request, attempt);
    },
  };
}

function promptFor(
  state: {
    focus: string;
    source_text: string;
    term_candidates?: Array<{ id: string; name: string }>;
  },
  questions: readonly NeutralQuestion[],
): string {
  return [
    'Answer every question about the state. Return one JSON object and no other text.',
    'For a choice question, use {"value":"<option>","probabilities":{"<option>":0.0},"confidence":0.0}.',
    'For a noul question, use {"probability_yes":0.0}.',
    'Probabilities for one choice question must sum to 1. probability_yes must be between 0 and 1.',
    `State: ${JSON.stringify(state)}`,
    `Questions: ${JSON.stringify(questions)}`,
  ].join('\n');
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeLlmAnswer(
  question: NeutralQuestion,
  answer: unknown,
): NormalizedJudgment | ProviderFailure {
  if (!isRecord(answer))
    return failure('malformed_output', `${question.id}: LLM answer is missing`);
  if (question.primitive === 'noul') return normalizeModelNoul(question, answer.probability_yes);
  return normalizeModelChoice(
    question,
    answer.value,
    answer.probabilities,
    answer.confidence,
    'unavailable',
  );
}

function failed(
  request: Parameters<SemanticDecisionProvider['decide']>[0],
  reason: ProviderFailure,
  started: number,
  model: string,
): DecisionReport {
  const attempt: ProviderAttempt = {
    provider: 'llm',
    model,
    modelRevision: null,
    runtime: 'injected-completer',
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
