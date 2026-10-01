import type { LlmCompleter } from '../decisions/llm.ts';
import type { Retrieval } from '../retrieve/index.ts';
import { analyzeQuestion, type QuestionAnalysis, type SystemOneModel } from './analysis.ts';
import { gatherEvidence, type EvidenceItem } from './evidence.ts';
import { buildPrompt, checkCitations, type CitationCheck } from './prompt.ts';

export interface AskResult {
  analysis: QuestionAnalysis;
  evidence: EvidenceItem[];
  prompt: string;
  answer?: string;
  citations?: CitationCheck;
}

/**
 * Question → Laya/Jev analysis → deterministic retrieval → LLM answer with citations.
 * Without a completer the result stops at the grounded prompt; the caller supplies the LLM.
 */
export async function ask(
  retrieval: Retrieval,
  question: string,
  options: { model?: SystemOneModel | null; completer?: LlmCompleter | null } = {},
): Promise<AskResult> {
  const analysis = await analyzeQuestion(retrieval, question, options.model ?? null);
  const evidence = gatherEvidence(retrieval, analysis);
  const prompt = buildPrompt(analysis, evidence);
  if (!options.completer) return { analysis, evidence, prompt };
  const answer = await options.completer.complete(prompt);
  return { analysis, evidence, prompt, answer, citations: checkCitations(answer, evidence) };
}
