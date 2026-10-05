import type { LlmCompleter } from '../decisions/llm.ts';
import type { Retrieval } from '../retrieve/index.ts';
import { analyzeQuestion, type QuestionAnalysis, type SystemOneModel } from './analysis.ts';
import { gatherEvidence, type EvidenceItem } from './evidence.ts';
import { buildPrompt, checkCitations, type CitationCheck } from './prompt.ts';
import { filterEvidence, type FilterPolicy, type FilteredEvidence } from './ranking.ts';

export interface AskResult {
  analysis: QuestionAnalysis;
  evidence: EvidenceItem[];
  /** Present when a relevance filter ran: its policy and every keep/drop decision. */
  filter?: Omit<FilteredEvidence, 'evidence'>;
  prompt: string;
  answer?: string;
  citations?: CitationCheck;
}

/**
 * Question → Laya/Jev analysis → deterministic retrieval → optional Jev relevance filter →
 * LLM answer with citations. Without a completer the result stops at the grounded prompt.
 * The filter only runs on a model analysis; a lexical or fallback analysis is unfiltered.
 */
export async function ask(
  retrieval: Retrieval,
  question: string,
  options: {
    model?: SystemOneModel | null;
    completer?: LlmCompleter | null;
    filter?: { ranker: SystemOneModel; policy?: FilterPolicy } | null;
  } = {},
): Promise<AskResult> {
  const analysis = await analyzeQuestion(retrieval, question, options.model ?? null);
  let evidence: EvidenceItem[];
  let filter: AskResult['filter'];
  if (options.filter && analysis.baseline) {
    const { evidence: kept, ...audit } = await filterEvidence(
      retrieval,
      analysis,
      options.filter.ranker,
      options.filter.policy,
    );
    evidence = kept;
    filter = audit;
  } else evidence = gatherEvidence(retrieval, analysis);
  const prompt = buildPrompt(analysis, evidence);
  const base = { analysis, evidence, ...(filter ? { filter } : {}), prompt };
  if (!options.completer) return base;
  const answer = await options.completer.complete(prompt);
  return { ...base, answer, citations: checkCitations(answer, evidence) };
}
