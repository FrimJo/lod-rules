import { createServerFn } from '@tanstack/react-start';
import { isRetrievalMode, type RetrievalMode } from '../lib/retrieval-modes.ts';
import { checkAnswer as check, getAskSummary, getRetrievalSettings as settings } from './ask-service.ts';
import { getRulebookIndex, loadSource } from './rulebook.ts';

function retrievalMode(mode: unknown): RetrievalMode {
  if (!isRetrievalMode(mode)) throw new Error(`Unknown retrieval mode: ${String(mode)}`);
  return mode;
}

export const getRulebook = createServerFn({ method: 'GET' }).handler(() => {
  void loadSource().catch(() => {});
  return getRulebookIndex();
});

export const getRetrievalSettings = createServerFn({ method: 'GET' }).handler(() => settings());

export const getEvidence = createServerFn({ method: 'POST' })
  .validator((data: { question: string; mode: RetrievalMode }) => ({
    question: data.question,
    mode: retrievalMode(data.mode),
  }))
  .handler(({ data }) => getAskSummary(data.question, data.mode));

export const checkAnswer = createServerFn({ method: 'POST' })
  .validator((data: { question: string; answer: string; mode: RetrievalMode }) => ({
    question: data.question,
    answer: data.answer,
    mode: retrievalMode(data.mode),
  }))
  .handler(({ data }) => check(data.question, data.answer, data.mode));
