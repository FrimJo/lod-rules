import type { SystemOneModel } from '../../../../scripts/ask/analysis.ts';
import type { EvidenceItem } from '../../../../scripts/ask/evidence.ts';
import { ask, type AskResult } from '../../../../scripts/ask/index.ts';
import { analyzerModel as createAnalyzer, type AnalyzerName } from '../../../../scripts/ask/models.ts';
import { checkCitations, type CitationCheck } from '../../../../scripts/ask/prompt.ts';
import { loadLocalEnv } from '../../../../scripts/decisions/env.ts';
import { freshDatabasePath } from '../../../../scripts/retrieve/build.ts';
import { Retrieval } from '../../../../scripts/retrieve/index.ts';
import {
  MODES,
  isModeAvailable,
  isRetrievalMode,
  type RetrievalMode,
  type RetrievalSettings,
} from '../lib/retrieval-modes.ts';

loadLocalEnv();

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const modesMatchAnalyzers: Same<RetrievalMode, AnalyzerName> = true;
void modesMatchAnalyzers;

export type { CitationCheck, EvidenceItem };

export interface AskSummary {
  question: string;
  mode: RetrievalMode;
  analyzer: string;
  fallback?: string;
  intent: string;
  complexity: string;
  evidence: EvidenceItem[];
}

export class ModeUnavailableError extends Error {
  constructor(mode: RetrievalMode) {
    super(`${MODES[mode].label} needs TYPESAFE_API_KEY on the server`);
    this.name = 'ModeUnavailableError';
  }
}

let retrieval: Retrieval | null = null;
const models = new Map<RetrievalMode, SystemOneModel | null>();

function openRetrieval(): Retrieval {
  if (!retrieval) {
    const database = freshDatabasePath();
    retrieval = database ? Retrieval.open(database) : Retrieval.fromCorpus();
  }
  return retrieval;
}

function analyzerModel(mode: RetrievalMode): SystemOneModel | null {
  if (!models.has(mode)) models.set(mode, createAnalyzer(mode));
  return models.get(mode) ?? null;
}

export function getRetrievalSettings(): RetrievalSettings {
  const jevAvailable = Boolean(process.env.TYPESAFE_API_KEY?.trim());
  const configured = process.env.LOD_ANALYZER?.trim();
  const defaultMode =
    isRetrievalMode(configured) && isModeAvailable(configured, { defaultMode: 'lexical', jevAvailable })
      ? configured
      : 'lexical';
  return { defaultMode, jevAvailable };
}

export function assertModeAvailable(mode: RetrievalMode): void {
  if (!isModeAvailable(mode, getRetrievalSettings())) throw new ModeUnavailableError(mode);
}

const CACHE_LIMIT = 50;
const cache = new Map<string, Promise<AskResult>>();

/** Memoized so the chat route and the evidence function share one retrieval per mode and question. */
export function getAskResult(question: string, mode: RetrievalMode): Promise<AskResult> {
  assertModeAvailable(mode);
  const trimmed = question.trim();
  const key = `${mode}\n${trimmed}`;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const pending = ask(openRetrieval(), trimmed, { model: analyzerModel(mode) });
  pending.catch(() => cache.delete(key));
  cache.set(key, pending);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  return pending;
}

export async function getAskSummary(question: string, mode: RetrievalMode): Promise<AskSummary> {
  const { analysis, evidence } = await getAskResult(question, mode);
  return {
    question: analysis.question,
    mode,
    analyzer: analysis.analyzer,
    ...(analysis.fallback ? { fallback: analysis.fallback } : {}),
    intent: analysis.intent.value,
    complexity: analysis.complexity.value,
    evidence,
  };
}

export async function checkAnswer(
  question: string,
  answer: string,
  mode: RetrievalMode,
): Promise<CitationCheck> {
  const { evidence } = await getAskResult(question, mode);
  return checkCitations(answer, evidence);
}
