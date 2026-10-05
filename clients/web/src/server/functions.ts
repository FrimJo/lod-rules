import { createServerFn } from '@tanstack/react-start';
import { isRetrievalMode, type RetrievalMode } from '../lib/retrieval-modes.ts';
import { checkAnswer as check, getAskSummary, getRetrievalSettings as settings } from './ask-service.ts';
import {
  getGradedCase as gradedCase,
  listGradedCases,
  saveGradingReview,
  type CaseReview,
} from './grading.ts';
import { llmApiKey, llmModel } from './llm.ts';
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

export interface AnswerSettings {
  /** Whether the server can send evidence to an LLM at all. */
  available: boolean;
  /** OpenRouter model id the answer would come from. */
  model: string;
}

export const getAnswerSettings = createServerFn({ method: 'GET' }).handler(
  (): AnswerSettings => ({ available: Boolean(llmApiKey()), model: llmModel() }),
);

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

export const getGradedCases = createServerFn({ method: 'GET' }).handler(() => listGradedCases());

export const getGradedCase = createServerFn({ method: 'GET' })
  .validator((id: string) => {
    if (typeof id !== 'string' || !/^askq\.[a-z0-9_.]+$/.test(id))
      throw new Error(`Invalid case id: ${String(id)}`);
    return id;
  })
  .handler(({ data }) => gradedCase(data));

export const saveReview = createServerFn({ method: 'POST' })
  .validator((data: { id: string; review: Omit<CaseReview, 'reviewedAt'> }) => {
    if (!/^askq\.[a-z0-9_.]+$/.test(data.id)) throw new Error(`Invalid case id: ${data.id}`);
    return data;
  })
  .handler(({ data }) => saveGradingReview(data.id, data.review));
