import { chat, toServerSentEventsResponse, type ModelMessage } from '@tanstack/ai';
import { createFileRoute } from '@tanstack/react-router';
import { isRetrievalMode } from '../lib/retrieval-modes.ts';
import { ModeUnavailableError, getAskResult, getRetrievalSettings } from '../server/ask-service.ts';
import { llmAdapter, llmApiKey } from '../server/llm.ts';

function messageText(message: ModelMessage): string {
  if (typeof message.content === 'string') return message.content;
  if (!Array.isArray(message.content)) return '';
  return message.content
    .map((part) => (part.type === 'text' ? part.content : ''))
    .join(' ')
    .trim();
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, forwardedProps } = (await request.json()) as {
          messages: ModelMessage[];
          forwardedProps?: { mode?: unknown };
        };
        const latest = [...messages].reverse().find((message) => message.role === 'user');
        const question = latest ? messageText(latest) : '';
        if (!question) return new Response('No question in request', { status: 400 });
        const mode = forwardedProps?.mode ?? getRetrievalSettings().defaultMode;
        if (!isRetrievalMode(mode)) {
          return new Response(`Unknown retrieval mode: ${String(mode)}`, { status: 400 });
        }
        if (!llmApiKey()) {
          return new Response('OPENAI_ROUTER_API_KEY is not set on the server', { status: 503 });
        }

        let prompt: string;
        try {
          ({ prompt } = await getAskResult(question, mode));
        } catch (error) {
          if (error instanceof ModeUnavailableError) {
            return new Response(error.message, { status: 409 });
          }
          throw error;
        }
        const abortController = new AbortController();
        const stream = chat({
          adapter: llmAdapter(),
          messages,
          systemPrompts: [prompt],
          abortController,
        });
        return toServerSentEventsResponse(stream, { abortController });
      },
    },
  },
});
