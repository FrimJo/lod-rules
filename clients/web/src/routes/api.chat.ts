import { chat, toServerSentEventsResponse, type ModelMessage } from '@tanstack/ai';
import { openaiText } from '@tanstack/ai-openai';
import { createFileRoute } from '@tanstack/react-router';
import { getAskResult } from '../server/ask-service.ts';

type OpenAIModel = Parameters<typeof openaiText>[0];

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
        const { messages } = (await request.json()) as { messages: ModelMessage[] };
        const latest = [...messages].reverse().find((message) => message.role === 'user');
        const question = latest ? messageText(latest) : '';
        if (!question) return new Response('No question in request', { status: 400 });
        if (!process.env.OPENAI_API_KEY) {
          return new Response('OPENAI_API_KEY is not set on the server', { status: 500 });
        }

        const { prompt } = await getAskResult(question);
        const abortController = new AbortController();
        const stream = chat({
          adapter: openaiText((process.env.OPENAI_MODEL || 'gpt-5.5') as OpenAIModel),
          messages,
          systemPrompts: [prompt],
          abortController,
        });
        return toServerSentEventsResponse(stream, { abortController });
      },
    },
  },
});
