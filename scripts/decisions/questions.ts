import {
  COMPLETENESS_OPTIONS,
  NO_MATCH,
  RULE_TYPE_OPTIONS,
  type DecisionState,
  type JudgmentId,
  type NeutralQuestion,
} from './types.ts';

const RULE_TYPE_CRITERIA: Record<(typeof RULE_TYPE_OPTIONS)[number], string> = {
  calculation: 'The claim states how to compute a result from inputs.',
  constraint: 'The claim forbids or limits what a hero may do or have.',
  modifier: 'The claim adds or subtracts a fixed amount from a number, stat, or roll.',
  choice: 'The claim tells the player to pick among options the text states.',
  exception: 'The point of the claim is an exception to a more general rule.',
  procedure_rule: 'The claim is a step in a sequence of play.',
  resource_change:
    'The claim changes a tracked pool such as experience, energy, sanity, or morale.',
  trigger: 'The claim states that a specific roll or event causes a follow-up.',
  override: 'The claim replaces a value or treatment that another rule would apply.',
  definition: 'The claim defines what a term or spatial relation means.',
  duration: 'The claim states how long an effect lasts, and that is its point.',
  random_resolution: 'The claim resolves an outcome by a random roll, and that roll is its point.',
  lookup: 'The claim tells you to read a value from a table, a list, or a parenthetical source.',
  scenario_rule: 'The claim is a personal-quest or quest-local special case.',
  no_match: 'None of the other options describes the claim.',
};

const COMPLETENESS_CRITERIA: Record<(typeof COMPLETENESS_OPTIONS)[number], string> = {
  self_contained: 'A reader can apply this claim from the quoted text alone.',
  possibly_incomplete:
    'The claim is a real rule, but a number, table, exception, or step it needs is not in the quoted text.',
  clearly_incomplete: 'The quoted text is not enough to apply as a game rule.',
};

/**
 * Questions are independent: none of these instructions refers to another answer.
 * `referenced_term` is omitted unless the state already carries a candidate list.
 */
export function buildQuestions(
  state: DecisionState,
  include: readonly JudgmentId[],
): NeutralQuestion[] {
  const questions: NeutralQuestion[] = [];
  for (const id of include) {
    const question = questionFor(id, state);
    if (question) questions.push(question);
  }
  return questions;
}

export function questionFor(id: JudgmentId, state: DecisionState): NeutralQuestion | null {
  switch (id) {
    case 'rule_type':
      return choice(
        id,
        'Which option describes the claim in `focus`, using only `source_text` as evidence? If the passage states several rules, judge the claim named in `focus`. Prefer scenario_rule only when that claim is a personal-quest or quest-local special case and no more specific option is the point of the claim.',
        RULE_TYPE_CRITERIA,
      );
    case 'conditional':
      return noul(
        id,
        'Does the claim in `focus` apply only in some situations, rather than whenever play reaches this subject? Use only `source_text`.',
      );
    case 'has_exception':
      return noul(
        id,
        'Does `source_text` state an exception to a more general rule as part of the claim in `focus`? A limit that is the whole claim is not an exception unless the text contrasts it with a broader rule.',
      );
    case 'cites_other_material':
      return noul(
        id,
        'Can the claim in `focus` be applied only by consulting another rule, table, section, or named procedure that `source_text` does not itself fully state?',
      );
    case 'completeness':
      return choice(
        id,
        'How complete is `source_text` for applying the claim in `focus`?',
        COMPLETENESS_CRITERIA,
      );
    case 'referenced_term': {
      const candidates = state.term_candidates ?? [];
      if (candidates.length === 0) return null;
      const criteria: Record<string, string> = {};
      for (const candidate of candidates) {
        criteria[candidate.id] = candidate.name;
      }
      criteria[NO_MATCH] =
        'None of the candidates is directly relied on by the claim in `focus`, or several are relied on equally.';
      return choice(
        id,
        'Which entry in `term_candidates` does the claim in `focus` directly rely on? Use only `source_text`. Choose no_match if none applies, or if more than one applies equally.',
        criteria,
      );
    }
    default: {
      const exhausted: never = id;
      return exhausted;
    }
  }
}

function choice(
  id: JudgmentId,
  instructions: string,
  criteria: Record<string, string>,
): NeutralQuestion {
  return {
    id,
    primitive: 'choice',
    instructions,
    criteria,
    optionCount: Object.keys(criteria).length,
  };
}

function noul(id: JudgmentId, instructions: string): NeutralQuestion {
  return {
    id,
    primitive: 'noul',
    instructions,
    criteria: {
      true: 'Yes. The statement in the instructions holds for the claim in `focus`.',
      false: 'No. The statement in the instructions does not hold for the claim in `focus`.',
    },
    optionCount: 2,
  };
}
