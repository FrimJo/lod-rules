import { TypeSafeClient, choice, noul } from '@typesafe-ai/sdk';
import type { LayaQuestion } from '../decisions/laya.ts';
import { LAYA_ONNX_REVISION, TYPESAFE_DEFAULT_MODEL } from '../decisions/pins.ts';
import type { ModelQuestion, SystemOneModel } from './analysis.ts';
import { cascadeModel } from './cascade.ts';

export const ANALYZERS = ['lexical', 'laya', 'jev', 'cascade'] as const;
export type AnalyzerName = (typeof ANALYZERS)[number];

/**
 * `cascade` is Laya first, with Jev answering only what Laya was unsure of. Without a
 * `TYPESAFE_API_KEY`, `jev` is null and `cascade` keeps Laya's unsure answers.
 */
export function analyzerModel(name: AnalyzerName): SystemOneModel | null {
  switch (name) {
    case 'lexical':
      return null;
    case 'laya':
      return layaModel();
    case 'jev':
      return jevModel();
    case 'cascade':
      return cascadeModel(layaModel(), jevModel());
  }
}

export function isAnalyzerName(name: string): name is AnalyzerName {
  return (ANALYZERS as readonly string[]).includes(name);
}

/**
 * Local Laya, sharing the pinned ONNX session used by `npm run decisions`. The runtime is
 * imported on first use, so consumers that never pick Laya (the deployed web client) do not
 * load or bundle onnxruntime.
 */
export function layaModel(cacheDir?: string): SystemOneModel {
  return {
    id: `laya@${LAYA_ONNX_REVISION.slice(0, 8)}`,
    probabilityMeaning: 'model',
    async ask(state, questions) {
      const { loadLayaRuntime } = await import('../decisions/laya.ts');
      const runtime = await loadLayaRuntime(cacheDir);
      const converted: Record<string, LayaQuestion> = {};
      for (const [id, question] of Object.entries(questions)) converted[id] = question;
      const result = await runtime.systemOne(state, converted);
      return { answers: result.answers };
    },
  };
}

/** The Jev model `jevModel` would call; set `TYPESAFE_DEFAULT_MODEL` to pin a version. */
export function jevModelName(): string {
  return process.env.TYPESAFE_DEFAULT_MODEL ?? TYPESAFE_DEFAULT_MODEL;
}

/** TypeSafe Jev. Returns null when no API key is configured. */
export function jevModel(apiKey = process.env.TYPESAFE_API_KEY?.trim()): SystemOneModel | null {
  if (!apiKey) return null;
  const model = jevModelName();
  const client = new TypeSafeClient({
    apiKey,
    defaultModel: model,
    logLevel: 'off',
    timeout: 15_000,
  });
  return {
    id: `jev:${model}`,
    probabilityMeaning: 'model',
    async ask(state, questions) {
      const converted: Record<string, ReturnType<typeof choice> | ReturnType<typeof noul>> = {};
      for (const [id, question] of Object.entries(questions)) converted[id] = toJev(question);
      const response = await client.systemOne({ state, questions: converted, model });
      return { answers: response.answers as Record<string, unknown> };
    },
  };
}

function toJev(question: ModelQuestion): ReturnType<typeof choice> | ReturnType<typeof noul> {
  if (question.type === 'noul') {
    return noul(question.instructions, {
      true: question.criteria.true ?? null,
      false: question.criteria.false ?? null,
    });
  }
  return choice(question.instructions, question.criteria);
}
