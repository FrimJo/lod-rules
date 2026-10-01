import { createServerFn } from '@tanstack/react-start';
import { checkAnswer as check, getAskSummary } from './ask-service.ts';
import { getRulebookIndex, loadSource } from './rulebook.ts';

export const getRulebook = createServerFn({ method: 'GET' }).handler(() => {
  void loadSource().catch(() => {});
  return getRulebookIndex();
});

export const getEvidence = createServerFn({ method: 'POST' })
  .validator((data: { question: string }) => data)
  .handler(({ data }) => getAskSummary(data.question));

export const checkAnswer = createServerFn({ method: 'POST' })
  .validator((data: { question: string; answer: string }) => data)
  .handler(({ data }) => check(data.question, data.answer));
