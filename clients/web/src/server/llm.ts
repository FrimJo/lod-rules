import { createOpenaiChat } from '@tanstack/ai-openai';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-6-luna';

type Model = Parameters<typeof createOpenaiChat>[0];

/** OpenRouter model id, e.g. `openai/gpt-6-luna`; not a bare OpenAI model name. */
export function llmModel(): string {
  return process.env.OPENAI_ROUTER_MODEL?.trim() || DEFAULT_MODEL;
}

export function llmApiKey(): string | undefined {
  return process.env.OPENAI_ROUTER_API_KEY?.trim() || undefined;
}

/** OpenAI Responses adapter pointed at OpenRouter's OpenAI-compatible endpoint. */
export function llmAdapter(model = llmModel()) {
  const apiKey = llmApiKey();
  if (!apiKey) throw new Error('OPENAI_ROUTER_API_KEY is not set');
  return createOpenaiChat(model as Model, apiKey, { baseURL: OPENROUTER_BASE_URL });
}
