import type { AnswerEscalation, ModelQuestion, ModelResponse, SystemOneModel } from './analysis.ts';

/**
 * When the first model's answer counts as unsure. These floors are provisional: they were
 * picked on the development split of the labelled question set, which is too small to
 * calibrate them. The lexical union in evidence gathering stays in force regardless.
 */
export interface CascadePolicy {
  id: string;
  /** Escalate a choice whose chosen option has a lower probability than this. */
  choiceFloor: number;
  /** Escalate a noul whose probability lies closer than this to 0.5. */
  noulMargin: number;
}

export const PROVISIONAL_CASCADE: CascadePolicy = {
  id: 'provisional-1',
  choiceFloor: 0.8,
  noulMargin: 0.4,
};

export function uncertainAnswers(
  answers: Record<string, unknown>,
  questions: Record<string, ModelQuestion>,
  policy: CascadePolicy,
): Array<{ question: string; reason: string }> {
  const found: Array<{ question: string; reason: string }> = [];
  for (const [id, question] of Object.entries(questions)) {
    const raw = answers[id];
    const answer = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
    if (question.type === 'noul') {
      const p = answer.noul;
      if (typeof p !== 'number') found.push({ question: id, reason: 'missing noul' });
      else if (Math.abs(p - 0.5) < policy.noulMargin) {
        found.push({ question: id, reason: `noul ${p.toFixed(2)}` });
      }
      continue;
    }
    const choice = answer.choice;
    const probabilities = answer.probabilities;
    const p =
      typeof choice === 'string' && typeof probabilities === 'object' && probabilities !== null
        ? (probabilities as Record<string, unknown>)[choice]
        : undefined;
    if (typeof choice !== 'string' || typeof p !== 'number') {
      found.push({ question: id, reason: 'missing choice probability' });
    } else if (p < policy.choiceFloor) {
      found.push({ question: id, reason: `${choice} ${p.toFixed(2)}` });
    }
  }
  return found;
}

/**
 * Asks `primary` everything, then asks `fallback` only the answers `primary` was unsure of.
 * A fallback failure keeps the primary answer; a primary failure sends every question onward.
 */
export function cascadeModel(
  primary: SystemOneModel,
  fallback: SystemOneModel | null,
  policy: CascadePolicy = PROVISIONAL_CASCADE,
): SystemOneModel {
  return {
    id: `${primary.id}>${fallback?.id ?? 'none'}`,
    probabilityMeaning: 'model',
    async ask(state, questions) {
      let first: ModelResponse;
      try {
        first = await primary.ask(state, questions);
      } catch (error) {
        if (!fallback) throw error;
        const second = await fallback.ask(state, questions);
        const reason = `${primary.id} failed: ${message(error)}`;
        return {
          answers: second.answers,
          escalations: Object.keys(questions).map((question) => ({
            question,
            reason,
            answeredBy: fallback.id,
          })),
        };
      }

      const uncertain = uncertainAnswers(first.answers, questions, policy);
      if (uncertain.length === 0) return { answers: first.answers, escalations: [] };
      if (!fallback) {
        return {
          answers: first.answers,
          escalations: uncertain.map((u) => ({ ...u, answeredBy: primary.id })),
        };
      }

      const subset: Record<string, ModelQuestion> = {};
      for (const { question } of uncertain) subset[question] = questions[question]!;
      let second: ModelResponse | null = null;
      let failure = '';
      try {
        second = await fallback.ask(state, subset);
      } catch (error) {
        failure = `; ${fallback.id} failed: ${message(error)}`;
      }
      const answers = { ...first.answers };
      const escalations: AnswerEscalation[] = uncertain.map(({ question, reason }) => {
        const replacement = second?.answers[question];
        if (replacement === undefined) {
          return { question, reason: `${reason}${failure}`, answeredBy: primary.id };
        }
        answers[question] = replacement;
        return { question, reason, answeredBy: fallback.id };
      });
      return { answers, escalations };
    },
  };
}

function message(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 200);
}
