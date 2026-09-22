import type { Rule } from '../validate/pilot-types.ts';
import { NO_MATCH, RULE_TYPE_OPTIONS } from './types.ts';
import type {
  DecisionRequest,
  JudgmentId,
  NormalizedJudgment,
  ProviderAttempt,
  SemanticDecisionProvider,
} from './types.ts';
import { acceptAttempt, deterministicChoice, deterministicNoul } from './report.ts';

const RULE_TYPES = new Set<string>(RULE_TYPE_OPTIONS);

/**
 * The existing Phase 4 approach: read the fields a person already encoded.
 * Completeness is not among those fields, so this provider leaves it unresolved.
 */
export function createStructuralProvider(
  lookup: (subjectId: string) => Rule | undefined,
): SemanticDecisionProvider {
  return {
    id: 'structural',
    cacheIdentity: 'structural',
    async availability() {
      return { available: true, reason: null };
    },
    async decide(request) {
      const started = Date.now();
      const rule = lookup(request.subjectId);
      const judgments: Partial<Record<JudgmentId, NormalizedJudgment>> = {};
      if (rule) {
        for (const question of request.questions) {
          const judgment = structuralJudgment(rule, question.id, request);
          if (judgment) judgments[question.id] = judgment;
        }
      }
      const attempt: ProviderAttempt = {
        provider: 'structural',
        model: 'corpus-fields',
        modelRevision: null,
        runtime: 'deterministic',
        judgments,
        failure: rule
          ? null
          : { code: 'unavailable', message: `no corpus rule for ${request.subjectId}` },
        latencyMs: Date.now() - started,
        requests: 0,
        inputTokens: null,
        outputTokens: null,
        escalations: [],
      };
      const report = acceptAttempt(request, attempt);
      const completeness = report.judgments.completeness;
      if (completeness?.reason === 'missing_judgment')
        completeness.reason = 'structural_cannot_judge';
      return report;
    },
  };
}

export function structuralJudgment(
  rule: Rule,
  id: JudgmentId,
  request: DecisionRequest,
): NormalizedJudgment | null {
  switch (id) {
    case 'rule_type':
      return deterministicChoice(
        RULE_TYPES.has(rule.type) ? rule.type : NO_MATCH,
        RULE_TYPE_OPTIONS,
      );
    case 'conditional':
      return deterministicNoul(rule.when !== undefined);
    case 'has_exception':
      return deterministicNoul(rule.type === 'exception');
    case 'cites_other_material':
      return deterministicNoul(citesOtherMaterial(rule));
    case 'completeness':
      return null;
    case 'referenced_term': {
      const question = request.questions.find((item) => item.id === 'referenced_term');
      if (!question) return null;
      const candidates = new Set(
        request.state.term_candidates?.map((candidate) => candidate.id) ?? [],
      );
      const hits = (rule.term_refs ?? []).filter((termId) => candidates.has(termId));
      const value = hits.length === 1 ? hits[0] : NO_MATCH;
      return deterministicChoice(value ?? NO_MATCH, Object.keys(question.criteria));
    }
    default: {
      const exhausted: never = id;
      return exhausted;
    }
  }
}

function citesOtherMaterial(rule: Rule): boolean {
  return (
    (rule.dependencies?.length ?? 0) > 0 ||
    (rule.uses_tables?.length ?? 0) > 0 ||
    (rule.unresolved_references?.length ?? 0) > 0 ||
    (rule.see_also?.length ?? 0) > 0
  );
}
