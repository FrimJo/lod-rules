import type { DecisionRequest, ProviderAttempt, SemanticDecisionProvider } from './types.ts';
import { acceptAttempt, failure } from './report.ts';

export function createNoneProvider(): SemanticDecisionProvider {
  return {
    id: 'none',
    cacheIdentity: 'none',
    async availability() {
      return { available: true, reason: null };
    },
    async decide(request) {
      const attempt: ProviderAttempt = {
        provider: 'none',
        model: 'none',
        modelRevision: null,
        runtime: 'none',
        judgments: {},
        failure: failure('unavailable', 'decision provider is none'),
        latencyMs: 0,
        requests: 0,
        inputTokens: null,
        outputTokens: null,
        escalations: [],
      };
      return acceptAttempt(request, attempt);
    },
  };
}

/** Replays judgments supplied by the caller. Used by unit tests. */
export function createFixtureProvider(
  id: SemanticDecisionProvider['id'],
  answer: (request: DecisionRequest) => ProviderAttempt,
): SemanticDecisionProvider {
  return {
    id,
    cacheIdentity: `fixture:${id}`,
    async availability() {
      return { available: true, reason: null };
    },
    async decide(request) {
      return acceptAttempt(request, answer(request));
    },
  };
}
