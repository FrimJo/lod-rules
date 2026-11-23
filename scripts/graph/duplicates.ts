import type { RetrievalCorpus } from '../retrieve/load.ts';
import type { Effect, Operand, Procedure, Rule, Step } from '../validate/pilot-types.ts';
import { compare } from './compare.ts';
import { flattenSteps, questResolver } from './records.ts';
import type { RuleRepeat, StepDuplicate } from './types.ts';

/** Words per printed-text shingle, and shared shingles a step needs to count as quoting a rule. */
const SHINGLE_WORDS = 8;
const MIN_SHARED_SHINGLES = 2;

const operand = (value: Operand): string =>
  value.type === 'literal' ? JSON.stringify(value.value) : JSON.stringify(value);

/** `set`/`add` effects, including those nested in choice options, as `type:target=value`. */
function effectSignatures(effects: Effect[]): string[] {
  return effects.flatMap((effect): string[] => {
    if (effect.type === 'set' || effect.type === 'add')
      return [`${effect.type}:${effect.target}=${operand(effect.value)}`];
    if (effect.type === 'choice')
      return effect.options.flatMap((option) => effectSignatures(option.effects));
    return [];
  });
}

function ruleSignatures(rule: Rule): Set<string> {
  return new Set([
    ...effectSignatures(rule.effects),
    ...(rule.alternatives ?? []).flatMap((alternative) => effectSignatures(alternative.effects)),
  ]);
}

function shingles(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const result = new Set<string>();
  for (let i = 0; i + SHINGLE_WORDS <= words.length; i++)
    result.add(words.slice(i, i + SHINGLE_WORDS).join(' '));
  return result;
}

/** Steps with the rule ids they and their ancestor steps cite. */
function stepsWithCitations(
  procedure: Procedure,
): Array<{ step: Step; path: string; cited: Set<string> }> {
  const inherited = new Set(procedure.dependencies.flatMap((d) => d.object_id ?? []));
  const walk = (
    steps: Step[],
    cited: Set<string>,
  ): Array<{ step: Step; path: string; cited: Set<string> }> =>
    steps.flatMap((step) => {
      const own = new Set([...cited, ...(step.rule_refs ?? [])]);
      return [{ step, path: '', cited: own }, ...walk(step.substeps ?? [], own)];
    });
  const paths = flattenSteps(procedure.steps).map((entry) => entry.path);
  return walk(procedure.steps, inherited).map((entry, i) => ({ ...entry, path: paths[i] ?? '' }));
}

/**
 * Procedure steps that restate a rule they do not cite (`phase_6.criterion_2`): the step both
 * repeats one of the rule's `set`/`add` effects and quotes its printed text. A step cites a rule
 * through its own or an ancestor step's `rule_refs`, or the procedure's `dependencies`. A
 * quest procedure is compared with global rules only; restating its own scenario rule is not a
 * finding, and another quest's rules are out of scope.
 */
export function stepDuplicates(corpus: RetrievalCorpus): StepDuplicate[] {
  const { questFor, isQuestSection } = questResolver(corpus);
  const rules = corpus.pilot.rules.map((rule) => ({
    rule,
    quest: rule.scope === 'quest' ? questFor(rule.section_id, rule.quest_id) : rule.quest_id,
    signatures: ruleSignatures(rule),
    shingles: shingles(rule.source_text),
  }));
  const found: StepDuplicate[] = [];
  for (const procedure of corpus.pilot.procedures) {
    const questProcedure = isQuestSection(procedure.section_id);
    for (const { step, path, cited } of stepsWithCitations(procedure)) {
      const signatures = new Set(effectSignatures(step.effects));
      if (signatures.size === 0) continue;
      const text = shingles(step.source_text);
      for (const candidate of rules) {
        if (cited.has(candidate.rule.id)) continue;
        if (questProcedure && candidate.quest !== undefined) continue;
        const effects = [...signatures].filter((s) => candidate.signatures.has(s)).sort(compare);
        if (effects.length === 0) continue;
        let shared = 0;
        for (const shingle of text) if (candidate.shingles.has(shingle)) shared++;
        if (shared < MIN_SHARED_SHINGLES) continue;
        found.push({
          procedure: procedure.id,
          step: step.id,
          field: path,
          rule: candidate.rule.id,
          effects,
        });
      }
    }
  }
  return found.sort(
    (a, b) =>
      compare(a.procedure, b.procedure) || compare(a.step, b.step) || compare(a.rule, b.rule),
  );
}

/** The chapter of a section: the first two segments of its id (`section.combat`). */
const chapterOf = (sectionId: string): string => sectionId.split('.').slice(0, 2).join('.');

/**
 * Rule pairs from different chapters that quote the same printed text: at least
 * `MIN_SHARED_SHINGLES` shared eight-word shingles of `source_text` (issue #4 item 22). A pair
 * already linked by a canonical `summary_of` edge, either way, is explained and not reported.
 * Each pair is reported once, its ids sorted.
 */
export function ruleRepeats(corpus: RetrievalCorpus): RuleRepeat[] {
  const linked = new Set(
    corpus.pilot.edges
      .filter((edge) => edge.relation === 'summary_of')
      .flatMap((edge) => [`${edge.from} ${edge.to}`, `${edge.to} ${edge.from}`]),
  );
  const rules = [...corpus.pilot.rules]
    .sort((a, b) => compare(a.id, b.id))
    .map((rule) => ({
      rule,
      chapter: chapterOf(rule.section_id),
      signatures: ruleSignatures(rule),
      shingles: shingles(rule.source_text),
    }));
  const found: RuleRepeat[] = [];
  for (let i = 0; i < rules.length; i++) {
    const a = rules[i]!;
    for (let j = i + 1; j < rules.length; j++) {
      const b = rules[j]!;
      if (a.chapter === b.chapter || linked.has(`${a.rule.id} ${b.rule.id}`)) continue;
      let shared = 0;
      for (const shingle of a.shingles) if (b.shingles.has(shingle)) shared++;
      if (shared < MIN_SHARED_SHINGLES) continue;
      found.push({
        rules: [a.rule.id, b.rule.id],
        shared,
        effects: [...a.signatures].filter((s) => b.signatures.has(s)).sort(compare),
      });
    }
  }
  return found;
}
