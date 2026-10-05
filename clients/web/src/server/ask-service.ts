import { join } from 'node:path';
import type { SystemOneModel } from '../../../../scripts/ask/analysis.ts';
import type { EvidenceItem } from '../../../../scripts/ask/evidence.ts';
import { ask, type AskResult } from '../../../../scripts/ask/index.ts';
import {
  analyzerModel as createAnalyzer,
  jevModel,
  type AnalyzerName,
} from '../../../../scripts/ask/models.ts';
import { checkCitations, type CitationCheck } from '../../../../scripts/ask/prompt.ts';
import { loadLocalEnv } from '../../../../scripts/decisions/env.ts';
import { RETRIEVAL_DIR, freshDatabasePath } from '../../../../scripts/retrieve/build.ts';
import { Retrieval } from '../../../../scripts/retrieve/index.ts';
import {
  MODES,
  defaultMode,
  isModeAvailable,
  type RetrievalMode,
  type RetrievalSettings,
} from '../lib/retrieval-modes.ts';
import { bundled, dataRoot } from './data-root.ts';

loadLocalEnv();

type Subset<A, B> = [A] extends [B] ? true : false;
const modesAreAnalyzers: Subset<Exclude<RetrievalMode, 'jev_filtered'>, AnalyzerName> = true;
void modesAreAnalyzers;

export type { CitationCheck, EvidenceItem };

export interface FilterSummary {
  policy: string;
  ranker: string;
  fallback?: string;
  /** Records Jev removed, in retrieval order. */
  dropped: Array<{ id: string; sources: string[]; pIrrelevant: number | null; reason: string }>;
}

export interface AskSummary {
  question: string;
  mode: RetrievalMode;
  analyzer: string;
  fallback?: string;
  intent: string;
  complexity: string;
  evidence: EvidenceItem[];
  filter?: FilterSummary;
}

export class ModeUnavailableError extends Error {
  constructor(mode: RetrievalMode) {
    super(`${MODES[mode].label} needs TYPESAFE_API_KEY on the server`);
    this.name = 'ModeUnavailableError';
  }
}

let retrieval: Retrieval | null = null;
const analyzers = new Map<AnalyzerName, SystemOneModel | null>();
let ranker: SystemOneModel | null | undefined;

/**
 * A data bundle ships the database built from the deployed commit and no corpus, so it is
 * opened as is. In the repo checkout, a stale or missing database is rebuilt in memory.
 */
function openRetrieval(): Retrieval {
  if (!retrieval) {
    if (bundled) retrieval = Retrieval.open(join(dataRoot, RETRIEVAL_DIR, 'retrieval.sqlite'));
    else {
      const database = freshDatabasePath();
      retrieval = database ? Retrieval.open(database) : Retrieval.fromCorpus();
    }
  }
  return retrieval;
}

function analyzerModel(name: AnalyzerName): SystemOneModel | null {
  if (!analyzers.has(name)) analyzers.set(name, createAnalyzer(name));
  return analyzers.get(name) ?? null;
}

/** The `ask()` options a mode runs with. */
export function askOptions(mode: RetrievalMode): Parameters<typeof ask>[2] {
  const info = MODES[mode];
  if (info.filter && ranker === undefined) ranker = jevModel();
  return {
    model: analyzerModel(info.analyzer),
    filter: info.filter && ranker ? { ranker } : null,
  };
}

export function getRetrievalSettings(): RetrievalSettings {
  const jevAvailable = Boolean(process.env.TYPESAFE_API_KEY?.trim());
  return { defaultMode: defaultMode(process.env.LOD_ANALYZER?.trim(), jevAvailable), jevAvailable };
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
  const pending = ask(openRetrieval(), trimmed, askOptions(mode));
  pending.catch(() => cache.delete(key));
  cache.set(key, pending);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  return pending;
}

export function summarize(result: AskResult, mode: RetrievalMode): AskSummary {
  const { analysis, evidence, filter } = result;
  return {
    question: analysis.question,
    mode,
    analyzer: analysis.analyzer,
    ...(analysis.fallback ? { fallback: analysis.fallback } : {}),
    intent: analysis.intent.value,
    complexity: analysis.complexity.value,
    evidence,
    ...(filter
      ? {
          filter: {
            policy: filter.policy.id,
            ranker: filter.ranker,
            ...(filter.fallback ? { fallback: filter.fallback } : {}),
            dropped: filter.decisions
              .filter((d) => !d.kept)
              .map((d) => ({
                id: d.id,
                sources: d.sources,
                pIrrelevant: d.judgment?.probabilities.irrelevant ?? null,
                reason: d.reason,
              })),
          },
        }
      : {}),
  };
}

export async function getAskSummary(question: string, mode: RetrievalMode): Promise<AskSummary> {
  return summarize(await getAskResult(question, mode), mode);
}

export async function checkAnswer(
  question: string,
  answer: string,
  mode: RetrievalMode,
): Promise<CitationCheck> {
  const { evidence } = await getAskResult(question, mode);
  return checkCitations(answer, evidence);
}
