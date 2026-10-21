import type { RetrievalCorpus } from '../retrieve/load.ts';
import type { Step } from '../validate/pilot-types.ts';

/** Steps with their schema path, depth-first in source order. */
export function flattenSteps(steps: Step[], path = 'steps'): Array<{ step: Step; path: string }> {
  return steps.flatMap((step) => [
    { step, path: `${path}[]` },
    ...flattenSteps(step.substeps ?? [], `${path}[].substeps`),
  ]);
}

export interface QuestResolver {
  /** A record's quest: its own `quest_id`, else the quest whose section contains it. */
  questFor(sectionId: string, explicit?: string): string | undefined;
  /** Whether a section lies in Quest Book I or under a quest's section. */
  isQuestSection(sectionId: string): boolean;
}

/** Quest derivation shared by the graph and retrieval, so both place records alike. */
export function questResolver(corpus: RetrievalCorpus): QuestResolver {
  const sections = new Map(corpus.sections.map((section) => [section.id, section]));
  const questBySection = new Map(
    corpus.pilot.entities
      .filter((entity) => entity.type === 'quest')
      .map((quest) => [quest.section_id, quest.id]),
  );
  const questFor = (sectionId: string, explicit?: string): string | undefined => {
    if (explicit) return explicit;
    for (let id: string | undefined = sectionId; id; id = sections.get(id)?.parent) {
      const quest = questBySection.get(id);
      if (quest) return quest;
    }
    return undefined;
  };
  return {
    questFor,
    isQuestSection: (sectionId) =>
      sectionId.startsWith('section.quest_book_i') || questFor(sectionId) !== undefined,
  };
}
