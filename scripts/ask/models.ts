import { TypeSafeClient, choice, noul } from '@typesafe-ai/sdk';
import { loadLayaRuntime, type LayaQuestion } from '../decisions/laya.ts';
import { LAYA_ONNX_REVISION, TYPESAFE_DEFAULT_MODEL } from '../decisions/pins.ts';
import type { ModelQuestion, SystemOneModel } from './analysis.ts';

/** Local Laya, sharing the pinned ONNX session used by `npm run decisions`. */
export function layaModel(cacheDir?: string): SystemOneModel {
  return {
    id: `laya@${LAYA_ONNX_REVISION.slice(0, 8)}`,
    probabilityMeaning: 'model',
    async ask(state, questions) {
      const runtime = await loadLayaRuntime(cacheDir);
      const converted: Record<string, LayaQuestion> = {};
      for (const [id, question] of Object.entries(questions)) converted[id] = question;
      const result = await runtime.systemOne(state, converted);
      return result.answers;
    },
  };
}

/** TypeSafe Jev. Returns null when no API key is configured. */
export function jevModel(apiKey = process.env.TYPESAFE_API_KEY?.trim()): SystemOneModel | null {
  if (!apiKey) return null;
  const model = process.env.TYPESAFE_DEFAULT_MODEL ?? TYPESAFE_DEFAULT_MODEL;
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
      return response.answers as Record<string, unknown>;
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
