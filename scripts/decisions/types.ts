import type { CALIBRATION_VERSION, DECISION_SCHEMA_VERSION } from './pins.ts';

export const PROVIDER_IDS = ['laya', 'jev', 'llm', 'structural', 'none', 'cascade'] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export const JUDGMENT_IDS = [
  'rule_type',
  'conditional',
  'has_exception',
  'cites_other_material',
  'completeness',
  'referenced_term',
] as const;

export type JudgmentId = (typeof JUDGMENT_IDS)[number];

/** Closed set from `schemas/rule.schema.json`, plus an explicit no-match. */
export const RULE_TYPE_OPTIONS = [
  'calculation',
  'constraint',
  'modifier',
  'choice',
  'exception',
  'procedure_rule',
  'resource_change',
  'trigger',
  'override',
  'definition',
  'duration',
  'random_resolution',
  'lookup',
  'scenario_rule',
  'no_match',
] as const;

export type RuleTypeOption = (typeof RULE_TYPE_OPTIONS)[number];

export const COMPLETENESS_OPTIONS = [
  'self_contained',
  'possibly_incomplete',
  'clearly_incomplete',
] as const;

export type CompletenessOption = (typeof COMPLETENESS_OPTIONS)[number];

export const NO_MATCH = 'no_match' as const;

/**
 * What a provider is allowed to see. Canonical type, effects, and ids stay out
 * so a model cannot echo the extracted label.
 */
export interface DecisionState {
  focus: string;
  source_text: string;
  term_candidates?: Array<{ id: string; name: string }>;
}

export interface NeutralQuestion {
  id: JudgmentId;
  primitive: 'choice' | 'noul';
  instructions: string;
  /** Choice: option id to criterion text. Noul: `true` and `false` descriptions. */
  criteria: Record<string, string>;
  optionCount: number;
}

export interface DecisionRequest {
  subjectId: string;
  state: DecisionState;
  questions: NeutralQuestion[];
}

/**
 * Choice confidence is not one statistic. Laya reports one minus normalized
 * entropy. Jev reports how peaked the distribution is. Noul has no confidence;
 * its probability is the whole answer.
 */
export type ConfidenceMeaning = 'normalized_entropy' | 'distribution_peak' | 'unavailable';

export type ProbabilityMeaning = 'model' | 'deterministic';

export interface ChoiceJudgment {
  primitive: 'choice';
  value: string;
  probabilities: Record<string, number>;
  confidence: number | null;
  confidenceMeaning: ConfidenceMeaning;
  probabilityMeaning: ProbabilityMeaning;
}

export interface NoulJudgment {
  primitive: 'noul';
  /** Probability that the answer is yes. A value near 0.5 is uncertainty, not a middle intensity. */
  probabilityYes: number;
  value: boolean;
  probabilityMeaning: ProbabilityMeaning;
}

export type NormalizedJudgment = ChoiceJudgment | NoulJudgment;

export type FailureCode =
  | 'not_installed'
  | 'model_unavailable'
  | 'load_failure'
  | 'unsupported_runtime'
  | 'inference_failure'
  | 'context_too_large'
  | 'malformed_output'
  | 'memory_pressure'
  | 'authentication_failure'
  | 'timeout'
  | 'rate_limited'
  | 'unavailable'
  | 'no_completer';

export interface ProviderFailure {
  code: FailureCode;
  message: string;
}

export interface JudgmentOutcome {
  disposition: 'accepted' | 'unresolved';
  reason: string | null;
  result: NormalizedJudgment | null;
}

export interface ProviderAttempt {
  provider: ProviderId;
  model: string;
  modelRevision: string | null;
  runtime: string;
  judgments: Partial<Record<JudgmentId, NormalizedJudgment>>;
  failure: ProviderFailure | null;
  latencyMs: number;
  requests: number;
  inputTokens: number | null;
  outputTokens: number | null;
  /** Why this attempt did not accept a judgment, when cascade policy ran. */
  escalations: Array<{ judgment: JudgmentId; reason: string }>;
}

export interface DecisionReport {
  schemaVersion: typeof DECISION_SCHEMA_VERSION;
  calibrationVersion: typeof CALIBRATION_VERSION | string;
  subjectId: string;
  provider: ProviderId;
  model: string;
  modelRevision: string | null;
  runtime: string;
  classifiedAt: string;
  judgments: Partial<Record<JudgmentId, JudgmentOutcome>>;
  attempts: ProviderAttempt[];
  latencyMs: number;
  requests: number;
  inputTokens: number | null;
  outputTokens: number | null;
  failure: ProviderFailure | null;
  cache: 'hit' | 'miss';
}

export interface SemanticDecisionProvider {
  readonly id: ProviderId;
  /** Identifies the checkpoint, model pointer, and question set inside a cache key. */
  readonly cacheIdentity: string;
  availability(): Promise<ProviderAvailability>;
  decide(request: DecisionRequest): Promise<DecisionReport>;
}

export interface ProviderAvailability {
  available: boolean;
  reason: string | null;
}
