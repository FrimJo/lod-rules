import { createRequire } from 'node:module';
import {
  LAYA_CHECKPOINTS,
  LAYA_ONNX_REPO,
  LAYA_ONNX_REVISION,
  LAYA_PACKAGE,
  type LayaCheckpointId,
} from './pins.ts';
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

const require = createRequire(import.meta.url);

interface LayaQuestion {
  type: 'choice' | 'noul';
  instructions: string;
  criteria?: Record<string, string | null> | string[];
}

interface LayaRuntime {
  systemOne(
    state: unknown,
    questions: Record<string, LayaQuestion>,
  ): Promise<{
    model: string;
    answers: Record<string, unknown>;
    usage?: { input_tokens?: number; output_tokens?: number };
  }>;
  close(): Promise<void>;
}

export interface LayaProviderOptions {
  checkpoint?: LayaCheckpointId;
  /** Injected runtime for tests. Skips package import and model loading. */
  runtime?: LayaRuntime;
  cacheDir?: string;
}

const sessions = new Map<string, Promise<LayaRuntime>>();

export function createLayaProvider(options: LayaProviderOptions = {}): SemanticDecisionProvider {
  const checkpointId = options.checkpoint ?? 'base';
  const checkpoint = LAYA_CHECKPOINTS[checkpointId];
  const cacheIdentity = `laya:${checkpoint.huggingface}@${LAYA_ONNX_REVISION}`;
  return {
    id: 'laya',
    cacheIdentity,
    async availability() {
      if (options.runtime) return { available: true, reason: null };
      if (!packageInstalled()) {
        return { available: false, reason: `${LAYA_PACKAGE} is not installed` };
      }
      if (checkpointId === 'typed-decisions') {
        return {
          available: false,
          reason: `no ONNX bundle for ${checkpoint.huggingface} at ${LAYA_ONNX_REPO}@${LAYA_ONNX_REVISION}`,
        };
      }
      return { available: true, reason: null };
    },
    async decide(request) {
      const started = Date.now();
      let runtime: LayaRuntime;
      try {
        runtime = options.runtime ?? (await loadCheckpoint(checkpointId, options.cacheDir));
      } catch (error) {
        return failed(request, cacheIdentity, classifyLoadError(error), started);
      }
      const questions: Record<string, LayaQuestion> = {};
      for (const question of request.questions) questions[question.id] = toLayaQuestion(question);
      try {
        const result = await runtime.systemOne(
          {
            focus: request.state.focus,
            source_text: request.state.source_text,
            term_candidates: request.state.term_candidates,
          },
          questions,
        );
        const judgments: ProviderAttempt['judgments'] = {};
        for (const question of request.questions) {
          const normalized = normalizeLayaAnswer(question, result.answers[question.id]);
          if (isFailure(normalized))
            return failed(request, result.model || cacheIdentity, normalized, started);
          judgments[question.id] = normalized;
        }
        const attempt: ProviderAttempt = {
          provider: 'laya',
          model: result.model || checkpoint.huggingface,
          modelRevision: LAYA_ONNX_REVISION,
          runtime: `onnxruntime-node ${cacheIdentity}`,
          judgments,
          failure: null,
          latencyMs: Date.now() - started,
          requests: 1,
          inputTokens: result.usage?.input_tokens ?? null,
          outputTokens: result.usage?.output_tokens ?? null,
          escalations: [],
        };
        return acceptAttempt(request, attempt);
      } catch (error) {
        return failed(request, cacheIdentity, classifyInferenceError(error), started);
      }
    },
  };
}

export async function closeLaya(): Promise<void> {
  const closing = [...sessions.values()];
  sessions.clear();
  for (const pending of closing) {
    const runtime = await pending.catch(() => null);
    if (runtime) await runtime.close();
  }
}

function packageInstalled(): boolean {
  try {
    require.resolve(LAYA_PACKAGE);
    return true;
  } catch {
    return false;
  }
}

function loadCheckpoint(
  checkpointId: LayaCheckpointId,
  cacheDir: string | undefined,
): Promise<LayaRuntime> {
  const checkpoint = LAYA_CHECKPOINTS[checkpointId];
  const key = `${checkpointId}@${LAYA_ONNX_REVISION}`;
  const existing = sessions.get(key);
  if (existing) return existing;
  const specifier: string = LAYA_PACKAGE;
  const loading = import(specifier).then((loaded) => {
    const module = loaded as { Laya?: { load: (opts?: object) => Promise<LayaRuntime> } };
    if (!module.Laya) throw new Error(`${LAYA_PACKAGE} did not export Laya`);
    return module.Laya.load({
      repo: LAYA_ONNX_REPO,
      revision: LAYA_ONNX_REVISION,
      subfolder: checkpoint.subfolder,
      cacheDir: cacheDir ?? process.env.LAYA_CACHE,
    });
  });
  sessions.set(key, loading);
  loading.catch(() => sessions.delete(key));
  return loading;
}

function toLayaQuestion(question: NeutralQuestion): LayaQuestion {
  if (question.primitive === 'noul') {
    return {
      type: 'noul',
      instructions: question.instructions,
      criteria: { true: question.criteria.true ?? null, false: question.criteria.false ?? null },
    };
  }
  return { type: 'choice', instructions: question.instructions, criteria: question.criteria };
}

function normalizeLayaAnswer(
  question: NeutralQuestion,
  answer: unknown,
): NormalizedJudgment | ProviderFailure {
  if (!isRecord(answer))
    return failure('malformed_output', `${question.id}: Laya answer is missing`);
  if (question.primitive === 'noul') return normalizeModelNoul(question, answer.noul);
  return normalizeModelChoice(
    question,
    answer.choice,
    answer.probabilities,
    answer.confidence,
    'normalized_entropy',
  );
}

function classifyLoadError(error: unknown): ProviderFailure {
  const message = shortMessage(error);
  if (/not found|404|entry not found|subfolder/i.test(message))
    return failure('model_unavailable', message);
  if (/cannot find package|module not found/i.test(message))
    return failure('not_installed', message);
  if (/out of memory|enomem/i.test(message)) return failure('memory_pressure', message);
  return failure('load_failure', message);
}

function classifyInferenceError(error: unknown): ProviderFailure {
  const message = shortMessage(error);
  if (/head_max|max_len|too long|context length|token/i.test(message)) {
    return failure('context_too_large', message);
  }
  if (/out of memory|enomem/i.test(message)) return failure('memory_pressure', message);
  return failure('inference_failure', message);
}

function shortMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Laya failed';
  return message.replace(/\s+/g, ' ').slice(0, 240);
}

function failed(
  request: Parameters<SemanticDecisionProvider['decide']>[0],
  model: string,
  reason: ProviderFailure,
  started: number,
): DecisionReport {
  const attempt: ProviderAttempt = {
    provider: 'laya',
    model,
    modelRevision: LAYA_ONNX_REVISION,
    runtime: 'onnxruntime-node',
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
