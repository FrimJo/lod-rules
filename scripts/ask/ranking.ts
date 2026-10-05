import type { Retrieval } from '../retrieve/index.ts';
import type { ModelQuestion, QuestionAnalysis, SystemOneModel } from './analysis.ts';
import {
  BUDGETS,
  collectCandidates,
  evidenceItem,
  type CandidateSource,
  type EvidenceItem,
} from './evidence.ts';

/**
 * Jev judges each retrieved record against the question, one request per record, so a
 * filter can drop records (lexical ones included) that only share words with the question.
 * Judgments choose what the LLM sees; they never change canonical data.
 */

export const RELEVANCE = {
  direct:
    'The record states a rule, value, procedure step, exception or limitation that answers at least part of the question',
  supporting:
    'The record does not answer the question itself, but defines a term or gives context needed to apply the records that do',
  irrelevant:
    'The record is not needed: it covers a different situation, a same-named but different concept, a quest the question is not about, or only shares words with the question',
} as const;
export type RelevanceId = keyof typeof RELEVANCE;

export const RELEVANCE_QUESTION: ModelQuestion = {
  type: 'choice',
  instructions:
    'A game master asked `question` about the League of Dungeoneers rulebook. Is the rulebook `record` needed to answer it?',
  criteria: { ...RELEVANCE },
};

/** A judgment whose chosen option has less probability than this is reported as uncertain. */
export const UNCERTAIN_BELOW = 0.5;

export interface RecordJudgment {
  id: string;
  relevance: RelevanceId | 'uncertain';
  probabilities: Record<RelevanceId, number>;
}

export interface FilterPolicy {
  id: string;
  /** Drop a record when Jev gives `irrelevant` at least this probability. */
  dropIrrelevantAt: number;
  /** Never drop exact name matches or that entity's own rules and tables. */
  protectExact: boolean;
  /**
   * Never drop a record reached through a dependency link (a table another record uses, a
   * procedure step's rule): judged alone it can look unrelated to the question.
   */
  protectLinked: boolean;
  /**
   * Also cut kept records to the larger complexity budget of the two analyses (plus exact
   * matches), dropping the most likely irrelevant first.
   */
  cap: boolean;
  /**
   * Never drop a record whose `why` starts with one of these prefixes, e.g. `heading:` for
   * records retrieved because the question names their heading.
   */
  protectWhy?: string[];
  /** Per record kind override of `dropIrrelevantAt` (tables and procedures read as noise alone). */
  dropAtByKind?: Partial<Record<string, number>>;
  /** Keep at least this many judged records per question, the least likely irrelevant first. */
  minKept?: number;
}

/**
 * Chosen on the development split only against automated judge labels; see
 * docs/retrieval.md. Exact-match protection mostly shielded alias noise there, so it is off.
 */
export const PROVISIONAL_FILTER: FilterPolicy = {
  id: 'provisional-1',
  dropIrrelevantAt: 0.9,
  protectExact: false,
  protectLinked: true,
  cap: false,
};

const DEPENDENCY_LINK = /^expand:(uses_table|depends_on|step_rule)$/;

export interface FilterDecision {
  id: string;
  sources: CandidateSource[];
  exact: boolean;
  why: string[];
  judgment: RecordJudgment | null;
  kept: boolean;
  reason:
    | 'relevant'
    | 'protected'
    | 'linked'
    | 'structural'
    | 'unjudged'
    | 'irrelevant'
    | 'floor'
    | 'cap';
}

export interface FilteredEvidence {
  policy: FilterPolicy;
  ranker: string;
  evidence: EvidenceItem[];
  /** Every candidate in retrieval order, kept or dropped, so removals can be reviewed. */
  decisions: FilterDecision[];
  /** Set when no record could be judged; the evidence is then the unfiltered pool. */
  fallback?: string;
}

function recordState(question: string, item: EvidenceItem): Record<string, string> {
  const scope =
    item.scope === 'quest' ? `quest only: ${item.quest_title ?? item.quest_id ?? '?'}` : item.scope;
  // The same text the answering LLM sees: a shorter excerpt hid table rows past the cut.
  const text = item.text;
  return {
    game: 'League of Dungeoneers tabletop dungeon crawler',
    question,
    record: JSON.stringify({
      title: item.title,
      kind: item.kind,
      type: item.type,
      scope,
      text,
      ...(item.issues.length
        ? {
            issues: item.issues.map((i) => ({
              status: i.status,
              summary: i.summary,
              ...(i.resolution ? { resolution: i.resolution.summary } : {}),
            })),
          }
        : {}),
      ...(item.external_dependencies.length
        ? { unavailable: item.external_dependencies.map((d) => `${d.label} (${d.document})`) }
        : {}),
    }),
  };
}

function parseJudgment(id: string, raw: unknown): RecordJudgment | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const answer = raw as { choice?: unknown; probabilities?: unknown };
  const options = Object.keys(RELEVANCE) as RelevanceId[];
  if (!options.includes(answer.choice as RelevanceId)) return null;
  const given = (answer.probabilities ?? {}) as Record<string, unknown>;
  const probabilities = Object.fromEntries(
    options.map((option) => [option, typeof given[option] === 'number' ? given[option] : 0]),
  ) as Record<RelevanceId, number>;
  const chosen = answer.choice as RelevanceId;
  return {
    id,
    relevance: probabilities[chosen] < UNCERTAIN_BELOW ? 'uncertain' : chosen,
    probabilities,
  };
}

/** One request per record; a failed or malformed answer leaves that record unjudged. */
export async function judgeRelevance(
  ranker: SystemOneModel,
  question: string,
  items: EvidenceItem[],
  concurrency = 6,
): Promise<{ judgments: Map<string, RecordJudgment>; errors: string[] }> {
  const judgments = new Map<string, RecordJudgment>();
  const errors: string[] = [];
  for (let start = 0; start < items.length; start += concurrency) {
    const batch = items.slice(start, start + concurrency);
    const settled = await Promise.allSettled(
      batch.map((item) =>
        ranker.ask(recordState(question, item), { relevance: RELEVANCE_QUESTION }),
      ),
    );
    settled.forEach((result, i) => {
      const id = batch[i]!.id;
      if (result.status === 'rejected') {
        const reason = result.reason instanceof Error ? result.reason.message : result.reason;
        errors.push(`${id}: ${String(reason).slice(0, 200)}`);
        return;
      }
      const judgment = parseJudgment(id, result.value.answers.relevance);
      if (judgment) judgments.set(id, judgment);
      else errors.push(`${id}: malformed relevance answer`);
    });
  }
  return { judgments, errors };
}

/** Pure policy over judged candidates; never adds a record that retrieval did not find. */
export function applyFilter(
  candidates: Array<{
    id: string;
    kind?: string;
    why: string[];
    sources: CandidateSource[];
    exact: boolean;
  }>,
  judgments: Map<string, RecordJudgment>,
  policy: FilterPolicy,
  capLimit: number,
): FilterDecision[] {
  const decisions: FilterDecision[] = candidates.map((c) => {
    const judgment = judgments.get(c.id) ?? null;
    const base = { id: c.id, sources: c.sources, exact: c.exact, why: c.why, judgment };
    if (policy.protectExact && c.exact) return { ...base, kept: true, reason: 'protected' };
    if (policy.protectLinked && c.why.some((w) => DEPENDENCY_LINK.test(w)))
      return { ...base, kept: true, reason: 'linked' };
    const structural = policy.protectWhy ?? [];
    if (c.why.some((w) => structural.some((prefix) => w.startsWith(prefix))))
      return { ...base, kept: true, reason: 'structural' };
    if (!judgment) return { ...base, kept: true, reason: 'unjudged' };
    const dropAt =
      (c.kind === undefined ? undefined : policy.dropAtByKind?.[c.kind]) ?? policy.dropIrrelevantAt;
    if (judgment.probabilities.irrelevant >= dropAt)
      return { ...base, kept: false, reason: 'irrelevant' };
    return { ...base, kept: true, reason: 'relevant' };
  });
  const minKept = policy.minKept ?? 0;
  const judgedKept = decisions.filter((d) => d.kept && d.judgment).length;
  if (judgedKept < minKept) {
    const restore = decisions
      .filter((d) => !d.kept)
      .sort((a, b) => a.judgment!.probabilities.irrelevant - b.judgment!.probabilities.irrelevant)
      .slice(0, minKept - judgedKept);
    for (const d of restore) {
      d.kept = true;
      d.reason = 'floor';
    }
  }
  if (policy.cap) {
    const fixed = (d: FilterDecision) =>
      d.reason === 'protected' || d.reason === 'linked' || d.reason === 'structural';
    const protectedCount = decisions.filter((d) => d.kept && fixed(d)).length;
    const open = decisions
      .filter((d) => d.kept && !fixed(d))
      .sort(
        (a, b) =>
          (b.judgment?.probabilities.irrelevant ?? 0) - (a.judgment?.probabilities.irrelevant ?? 0),
      );
    const excess = open.length - Math.max(0, capLimit - protectedCount);
    for (const d of open.slice(0, Math.max(0, excess))) {
      d.kept = false;
      d.reason = 'cap';
    }
  }
  return decisions;
}

/** The larger evidence budget of the model analysis and its lexical baseline. */
export function capLimitFor(analysis: QuestionAnalysis): number {
  const limits = [analysis, analysis.baseline]
    .filter((a): a is QuestionAnalysis => a !== undefined)
    .map((a) => BUDGETS[a.complexity.value].limit);
  return Math.max(...limits);
}

/** Retrieve the usual candidate pool for `analysis`, then let `ranker` remove noise from it. */
export async function filterEvidence(
  retrieval: Retrieval,
  analysis: QuestionAnalysis,
  ranker: SystemOneModel,
  policy: FilterPolicy = PROVISIONAL_FILTER,
): Promise<FilteredEvidence> {
  const candidates = collectCandidates(retrieval, analysis);
  const items = new Map(candidates.map((c) => [c.id, evidenceItem(retrieval, c.id, c.why)]));
  const { judgments, errors } = await judgeRelevance(ranker, analysis.question, [
    ...items.values(),
  ]);
  const decisions = applyFilter(candidates, judgments, policy, capLimitFor(analysis));
  return {
    policy,
    ranker: ranker.id,
    evidence: decisions.filter((d) => d.kept).map((d) => items.get(d.id)!),
    decisions,
    ...(judgments.size === 0 && candidates.length > 0
      ? { fallback: `${ranker.id}: ${errors[0] ?? 'no judgments'}` }
      : {}),
  };
}
