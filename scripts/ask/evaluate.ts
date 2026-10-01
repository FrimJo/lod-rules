import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalJson, sha256 } from '../decisions/hash.ts';
import type { Retrieval } from '../retrieve/index.ts';
import {
  selectedSystems,
  systemOf,
  type ModelQuestion,
  type QuestionAnalysis,
  type SystemOneModel,
} from './analysis.ts';
import { BUDGETS, gatherEvidence } from './evidence.ts';
import type { LabelledQuestion } from './labels.ts';

export interface EvidenceScore {
  ids: string[];
  /** Required records absent from the evidence. */
  missing: string[];
  /** Records the lexical baseline retrieved that this evidence lacks. */
  dropped: string[];
}

export interface CaseScore {
  id: string;
  split: LabelledQuestion['split'];
  analyzer: string;
  fallback: string | null;
  required: number;
  intent: boolean;
  complexity: boolean;
  /** Predicted complexity has a smaller evidence budget than the labelled one. */
  underBudget: boolean;
  entity: boolean;
  /** Required records whose chapters no selected system covers. */
  chapterMissed: string[];
  chapterTotal: number;
  /** Selected systems that cover no required record. */
  extraSystems: number;
  escalated: string[];
  /** Evidence from this analysis alone, without the lexical union. */
  alone: EvidenceScore;
  /** Evidence the pipeline actually uses: the union with the lexical baseline. */
  union: EvidenceScore | null;
}

export function scoreCase(
  retrieval: Retrieval,
  label: LabelledQuestion,
  analysis: QuestionAnalysis,
  lexicalEvidence: string[],
): CaseScore {
  const evidence = (view: QuestionAnalysis): EvidenceScore => {
    const ids = gatherEvidence(retrieval, view).map((item) => item.id);
    const found = new Set(ids);
    return {
      ids,
      missing: label.requiredEvidence.filter((id) => !found.has(id)),
      dropped: lexicalEvidence.filter((id) => !found.has(id)),
    };
  };
  const { baseline: _baseline, ...alone } = analysis;
  const systems = new Set(selectedSystems(alone));
  const required = label.requiredEvidence
    .map((id) => ({ id, systems: systemOf(retrieval.document(id)!) }))
    .filter((entry) => entry.systems.length > 0);
  const expected = label.expected.entity;

  return {
    id: label.id,
    split: label.split,
    analyzer: analysis.analyzer,
    fallback: analysis.fallback ?? null,
    required: label.requiredEvidence.length,
    intent: analysis.intent.value === label.expected.intent,
    complexity: analysis.complexity.value === label.expected.complexity,
    underBudget:
      BUDGETS[analysis.complexity.value].limit < BUDGETS[label.expected.complexity].limit,
    entity: expected
      ? analysis.entities.some((e) => e.id === expected)
      : !analysis.entities.some((e) => e.via === 'model'),
    chapterMissed: required
      .filter((entry) => !entry.systems.some((id) => systems.has(id)))
      .map((entry) => entry.id),
    chapterTotal: required.length,
    extraSystems: [...systems].filter((id) => !required.some((entry) => entry.systems.includes(id)))
      .length,
    escalated: (analysis.escalations ?? []).map((e) => e.question),
    alone: evidence(alone),
    union: analysis.baseline ? evidence(analysis) : null,
  };
}

export interface Summary {
  config: string;
  split: string;
  cases: number;
  /** Required records found / required records. */
  recall: number;
  /** Cases with every required record found. */
  complete: number;
  meanEvidence: number;
  /** Lexical-baseline records lost, summed over cases. Must be 0 for a union. */
  dropped: number;
  intent: number;
  complexity: number;
  underBudget: number;
  entity: number;
  chapterRecall: number;
  extraSystems: number;
  /** Answers the first model of a cascade was unsure of, per case. */
  escalated: number;
  /** Cases where the cascade sent at least one answer onward, i.e. made a fallback request. */
  escalatedCases: number;
  fallbacks: number;
}

export function summarize(
  config: string,
  split: string,
  scores: CaseScore[],
  view: 'alone' | 'union',
): Summary {
  const n = scores.length || 1;
  const share = (pick: (s: CaseScore) => boolean): number => scores.filter(pick).length / n;
  const evidence = (s: CaseScore): EvidenceScore => (view === 'union' ? s.union : null) ?? s.alone;
  const required = scores.reduce((sum, s) => sum + s.required, 0);
  const missing = scores.reduce((sum, s) => sum + evidence(s).missing.length, 0);
  const chapters = scores.reduce((sum, s) => sum + s.chapterTotal, 0);
  return {
    config,
    split,
    cases: scores.length,
    recall: required ? (required - missing) / required : 1,
    complete: share((s) => evidence(s).missing.length === 0),
    meanEvidence: scores.reduce((sum, s) => sum + evidence(s).ids.length, 0) / n,
    dropped: scores.reduce((sum, s) => sum + evidence(s).dropped.length, 0),
    intent: share((s) => s.intent),
    complexity: share((s) => s.complexity),
    underBudget: share((s) => s.underBudget),
    entity: share((s) => s.entity),
    chapterRecall: chapters
      ? 1 - scores.reduce((sum, s) => sum + s.chapterMissed.length, 0) / chapters
      : 1,
    extraSystems: scores.reduce((sum, s) => sum + s.extraSystems, 0) / n,
    escalated: scores.reduce((sum, s) => sum + s.escalated.length, 0) / n,
    escalatedCases: share((s) => s.escalated.length > 0),
    fallbacks: scores.filter((s) => s.fallback !== null).length,
  };
}

/**
 * Remembers answers one question at a time, optionally on disk, so a cascade replaying a
 * subset reuses earlier calls. Serving a subset from answers given in a larger call is only
 * exact when questions in one call cannot see each other, which TypeSafe documents for Jev.
 */
export function memoModel(
  model: SystemOneModel,
  directory?: string,
): SystemOneModel & { calls: () => number } {
  const memory = new Map<string, unknown>();
  let calls = 0;
  const keyOf = (state: Record<string, string>, id: string, question: ModelQuestion): string =>
    sha256(canonicalJson({ model: model.id, state, id, question }));
  const read = (key: string): unknown => {
    if (memory.has(key)) return memory.get(key);
    const path = directory ? join(directory, `${key}.json`) : null;
    if (!path || !existsSync(path)) return undefined;
    const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
    memory.set(key, value);
    return value;
  };
  return {
    id: model.id,
    probabilityMeaning: model.probabilityMeaning,
    calls: () => calls,
    async ask(state, questions) {
      const answers: Record<string, unknown> = {};
      const missing: Record<string, ModelQuestion> = {};
      for (const [id, question] of Object.entries(questions)) {
        const hit = read(keyOf(state, id, question));
        if (hit === undefined) missing[id] = question;
        else answers[id] = hit;
      }
      if (Object.keys(missing).length > 0) {
        calls += 1;
        const response = await model.ask(state, missing);
        if (directory) mkdirSync(directory, { recursive: true });
        for (const [id, question] of Object.entries(missing)) {
          const answer = response.answers[id];
          if (answer === undefined) continue;
          answers[id] = answer;
          const key = keyOf(state, id, question);
          memory.set(key, answer);
          if (directory)
            writeFileSync(join(directory, `${key}.json`), `${JSON.stringify(answer)}\n`);
        }
      }
      return { answers };
    },
  };
}
