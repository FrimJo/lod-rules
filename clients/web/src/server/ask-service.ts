import type { SystemOneModel } from '../../../../scripts/ask/analysis.ts';
import type { EvidenceItem } from '../../../../scripts/ask/evidence.ts';
import { ask, type AskResult } from '../../../../scripts/ask/index.ts';
import { analyzerModel as createAnalyzer, isAnalyzerName } from '../../../../scripts/ask/models.ts';
import { checkCitations, type CitationCheck } from '../../../../scripts/ask/prompt.ts';
import { loadLocalEnv } from '../../../../scripts/decisions/env.ts';
import { freshDatabasePath } from '../../../../scripts/retrieve/build.ts';
import { Retrieval } from '../../../../scripts/retrieve/index.ts';

loadLocalEnv();

export type { CitationCheck, EvidenceItem };

export interface AskSummary {
  question: string;
  analyzer: string;
  fallback?: string;
  intent: string;
  complexity: string;
  evidence: EvidenceItem[];
}

let retrieval: Retrieval | null = null;
let model: SystemOneModel | null | undefined;

function openRetrieval(): Retrieval {
  if (!retrieval) {
    const database = freshDatabasePath();
    retrieval = database ? Retrieval.open(database) : Retrieval.fromCorpus();
  }
  return retrieval;
}

function analyzerModel(): SystemOneModel | null {
  if (model !== undefined) return model;
  const name = process.env.LOD_ANALYZER?.trim() || 'lexical';
  model = isAnalyzerName(name) ? createAnalyzer(name) : null;
  return model;
}

const CACHE_LIMIT = 50;
const cache = new Map<string, Promise<AskResult>>();

/** Memoized so the chat route and the evidence function share one retrieval per question. */
export function getAskResult(question: string): Promise<AskResult> {
  const key = question.trim();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const pending = ask(openRetrieval(), key, { model: analyzerModel() });
  pending.catch(() => cache.delete(key));
  cache.set(key, pending);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  return pending;
}

export async function getAskSummary(question: string): Promise<AskSummary> {
  const { analysis, evidence } = await getAskResult(question);
  return {
    question: analysis.question,
    analyzer: analysis.analyzer,
    ...(analysis.fallback ? { fallback: analysis.fallback } : {}),
    intent: analysis.intent.value,
    complexity: analysis.complexity.value,
    evidence,
  };
}

export async function checkAnswer(question: string, answer: string): Promise<CitationCheck> {
  const { evidence } = await getAskResult(question);
  return checkCitations(answer, evidence);
}
