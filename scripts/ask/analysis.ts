import type { Retrieval, SearchDocument } from '../retrieve/index.ts';
import { normalize } from '../retrieve/index.ts';

/**
 * Question analysis feeds deterministic retrieval. It never answers the question and
 * never touches canonical data; a wrong analysis only changes which records are fetched.
 */

export const INTENTS = {
  rule_explanation: 'Asks how a rule, procedure or game mechanic works in general',
  situation_ruling:
    'Describes a concrete game situation and asks what happens, what is allowed or how to resolve it',
  value_lookup: 'Asks for a specific number, statistic, cost, reward, duration or table result',
  definition: 'Asks what a term, keyword, condition or ability means',
  quest_running: 'Asks how to set up, run or finish a specific quest or scenario',
  character_building: 'Asks about creating, equipping, training or levelling up a hero',
  no_match: 'None of the other options describes the question',
} as const;
export type IntentId = keyof typeof INTENTS;

/** Each system maps to rulebook chapters (section-id prefixes) used as a retrieval filter. */
export const SYSTEMS = {
  core_rules: {
    question:
      'Is the question about core turn structure, Action Points, line of sight, dice or skill checks?',
    chapters: ['section.introduction', 'section.game_basics'],
  },
  dungeon: {
    question:
      'Is the question about exploring a dungeon: doors, searching, Threat, resting, traps or treasure?',
    chapters: ['section.into_the_dungeons', 'section.treasure'],
  },
  combat: {
    question:
      'Is the question about battle, attacking, damage, weapons specials or enemies fighting?',
    chapters: ['section.combat', 'section.travelling_and_skirmishes'],
  },
  conditions: {
    question:
      'Is the question about hero conditions such as poison, bleeding, disease, stun, wounds, sanity or mental conditions?',
    chapters: ['section.psychology', 'section.combat'],
  },
  magic: {
    question: 'Is the question about spells, mana, prayers, magic items or enchantments?',
    chapters: [
      'section.magic',
      'section.magic_items',
      'section.enchantments',
      'section.prayers',
      'section.appendix_iv_spells',
    ],
  },
  equipment: {
    question:
      'Is the question about equipment, weapons, armour, alchemy, potions or treasure items?',
    chapters: [
      'section.equipment',
      'section.alchemy',
      'section.appendix_iii_equipment',
      'section.appendix_v_treasures',
    ],
  },
  character: {
    question:
      'Is the question about hero creation, professions, backgrounds, talents, perks or levelling up?',
    chapters: [
      'section.character_basics',
      'section.creating_your_character',
      'section.backgrounds',
      'section.levelling_up',
      'section.appendix_i_perks',
      'section.appendix_ii_talents',
    ],
  },
  settlement: {
    question: 'Is the question about travelling, settlements, guilds, shopping or the estate?',
    chapters: [
      'section.travelling_and_skirmishes',
      'section.settlements',
      'section.the_dark_guild',
      'section.fighters_guild',
      'section.wizards_guild',
      'section.alchemists_guild',
      'section.rangers_guild',
      'section.the_inner_sanctum',
      'section.buying_an_estate',
    ],
  },
  quests: {
    question: 'Is the question about a quest, scenario, campaign or quest reward?',
    chapters: ['section.quest_book_i', 'section.embarking_on_your_first_quest'],
  },
} as const;
export type SystemId = keyof typeof SYSTEMS;

export const COMPLEXITY = {
  single_fact: 'Answered by one value or one sentence from one rule',
  single_rule: 'Answered by explaining one rule or one procedure',
  multi_rule: 'Needs several rules that interact or apply in sequence',
  judgment: 'Needs interpretation because rules overlap, conflict or may not cover the case',
} as const;
export type ComplexityId = keyof typeof COMPLEXITY;

export interface ModelQuestion {
  type: 'choice' | 'noul';
  instructions: string;
  criteria: Record<string, string>;
}

/** Raw answers keyed by question id: `{ choice, probabilities }` or `{ noul }`. */
export interface SystemOneModel {
  id: string;
  probabilityMeaning: 'model' | 'deterministic';
  ask(
    state: Record<string, string>,
    questions: Record<string, ModelQuestion>,
  ): Promise<Record<string, unknown>>;
}

export interface EntityRef {
  id: string;
  title: string;
  type: string;
  via: 'alias' | 'model';
}

export interface QuestionAnalysis {
  question: string;
  analyzer: string;
  probabilityMeaning: 'model' | 'deterministic';
  intent: { value: IntentId; probabilities: Record<string, number> };
  /** Every system with its yes-probability, highest first. */
  systems: Array<{ id: SystemId; probabilityYes: number }>;
  entities: EntityRef[];
  complexity: { value: ComplexityId; probabilities: Record<string, number> };
  /** Set when the model failed and the lexical analyzer answered instead. */
  fallback?: string;
  /**
   * Lexical analysis kept beside an uncalibrated model analysis. Retrieval uses the
   * union of both, so the model can widen retrieval but never narrow it.
   */
  baseline?: QuestionAnalysis;
}

export const SYSTEM_THRESHOLD = 0.5;

export function selectedSystems(analysis: QuestionAnalysis): SystemId[] {
  return analysis.systems.filter((s) => s.probabilityYes >= SYSTEM_THRESHOLD).map((s) => s.id);
}

export function systemOf(doc: SearchDocument): SystemId[] {
  const chapter = doc.chapter ?? '';
  return (Object.keys(SYSTEMS) as SystemId[]).filter((id) =>
    SYSTEMS[id].chapters.some((prefix) => chapter.startsWith(prefix)),
  );
}

/** Exact entity names in the question ("Molgor", "Potion of Cure Poison"), longest first. */
export function aliasEntities(retrieval: Retrieval, question: string): EntityRef[] {
  const words = normalize(question).split(' ').filter(Boolean);
  const found = new Map<string, EntityRef>();
  const covered = new Set<number>();
  for (let size = Math.min(6, words.length); size >= 1; size -= 1) {
    for (let start = 0; start + size <= words.length; start += 1) {
      if ([...Array(size).keys()].some((offset) => covered.has(start + offset))) continue;
      const phrase = words.slice(start, start + size).join(' ');
      if (size === 1 && phrase.length < 4) continue;
      const matches = retrieval.resolve(phrase).filter((doc) => doc.kind === 'entity');
      if (matches.length === 0) continue;
      for (let offset = 0; offset < size; offset += 1) covered.add(start + offset);
      for (const doc of matches) {
        found.set(doc.id, { id: doc.id, title: doc.title, type: doc.type, via: 'alias' });
      }
    }
  }
  return [...found.values()];
}

function choiceAnswer<T extends string>(
  raw: unknown,
  options: readonly T[],
): { value: T; probabilities: Record<string, number> } | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const answer = raw as { choice?: unknown; probabilities?: unknown };
  if (typeof answer.choice !== 'string' || !options.includes(answer.choice as T)) return null;
  const probabilities: Record<string, number> = {};
  if (typeof answer.probabilities === 'object' && answer.probabilities !== null) {
    for (const [key, value] of Object.entries(answer.probabilities)) {
      if (typeof value === 'number') probabilities[key] = value;
    }
  }
  return { value: answer.choice as T, probabilities };
}

function noulAnswer(raw: unknown): number | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const value = (raw as { noul?: unknown }).noul;
  return typeof value === 'number' && value >= 0 && value <= 1 ? value : null;
}

/** Deterministic baseline: keyword intent, search-hit chapters, alias entities. */
export function lexicalAnalysis(retrieval: Retrieval, question: string): QuestionAnalysis {
  const q = ` ${normalize(question)} `;
  const has = (pattern: RegExp): boolean => pattern.test(q);
  const entities = aliasEntities(retrieval, question);

  const hits = retrieval.search(question, { limit: 10 });
  const counts = new Map<SystemId, number>();
  for (const hit of hits) {
    const doc = retrieval.document(hit.id);
    for (const id of doc ? systemOf(doc) : []) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const systems = (Object.keys(SYSTEMS) as SystemId[])
    .map((id) => ({ id, probabilityYes: Math.min(1, (counts.get(id) ?? 0) / 6) }))
    .sort((a, b) => b.probabilityYes - a.probabilityYes || a.id.localeCompare(b.id, 'en'));
  if (systems[0] && systems[0].probabilityYes > 0 && systems[0].probabilityYes < SYSTEM_THRESHOLD) {
    systems[0] = { ...systems[0], probabilityYes: SYSTEM_THRESHOLD };
  }

  let intent: IntentId = 'rule_explanation';
  if (has(/ (mean|meaning|define|definition) /) || has(/^ what (is|are) (a |an |the )?\w+ $/)) {
    intent = 'definition';
  } else if (has(/ how (much|many) | stat(istic)?s? | cost | reward | hit points | hp /)) {
    intent = 'value_lookup';
  } else if (entities.some((e) => e.type === 'quest') || has(/ quest /)) {
    intent = 'quest_running';
  } else if (has(/ (create|creating|level up|levelling|starting|start with|buy|train) /)) {
    intent = 'character_building';
  } else if (has(/ (if|my|while|during) | can (i|a|my|the|he|she|they) /)) {
    intent = 'situation_ruling';
  }

  const active = systems.filter((s) => s.probabilityYes >= SYSTEM_THRESHOLD).length;
  let complexity: ComplexityId = 'single_rule';
  if (intent === 'value_lookup' || intent === 'definition') complexity = 'single_fact';
  if (active >= 2 || has(/ (and|while|same time|both) /)) complexity = 'multi_rule';
  if (intent === 'situation_ruling' && complexity === 'multi_rule') complexity = 'judgment';

  return {
    question,
    analyzer: 'lexical',
    probabilityMeaning: 'deterministic',
    intent: { value: intent, probabilities: { [intent]: 1 } },
    systems,
    entities,
    complexity: { value: complexity, probabilities: { [complexity]: 1 } },
  };
}

/** Asks intent, systems, primary entity and complexity of a Laya or Jev model in one call. */
export async function modelAnalysis(
  retrieval: Retrieval,
  model: SystemOneModel,
  question: string,
): Promise<QuestionAnalysis> {
  const aliasMatches = aliasEntities(retrieval, question);
  const candidates = new Map<string, SearchDocument>();
  for (const ref of aliasMatches) {
    const doc = retrieval.document(ref.id);
    if (doc) candidates.set(doc.id, doc);
  }
  for (const hit of retrieval.search(question, { kinds: ['entity'], limit: 8 })) {
    if (candidates.size >= 12) break;
    const doc = retrieval.document(hit.id);
    if (doc) candidates.set(doc.id, doc);
  }
  const entityOptions = [...candidates.values()];
  const entityCriteria: Record<string, string> = {};
  entityOptions.forEach((doc, index) => {
    entityCriteria[`e${index}`] = `${doc.title} (${doc.type.replace(/_/g, ' ')})`;
  });
  entityCriteria.no_match =
    'The question does not depend on any one of these specific game elements';

  const questions: Record<string, ModelQuestion> = {
    intent: {
      type: 'choice',
      instructions: 'What is the game master asking for?',
      criteria: { ...INTENTS },
    },
    complexity: {
      type: 'choice',
      instructions: 'How much of the rulebook is needed to answer the question?',
      criteria: { ...COMPLEXITY },
    },
    entity: {
      type: 'choice',
      instructions: 'Which specific named game element is the question about?',
      criteria: entityCriteria,
    },
  };
  for (const [id, system] of Object.entries(SYSTEMS)) {
    questions[`system_${id}`] = {
      type: 'noul',
      instructions: system.question,
      criteria: { true: 'Yes, this game system is involved', false: 'No, it is not involved' },
    };
  }

  const answers = await model.ask(
    { game: 'League of Dungeoneers tabletop dungeon crawler', question },
    questions,
  );

  const intent = choiceAnswer(answers.intent, Object.keys(INTENTS) as IntentId[]);
  const complexity = choiceAnswer(answers.complexity, Object.keys(COMPLEXITY) as ComplexityId[]);
  const entity = choiceAnswer(answers.entity, Object.keys(entityCriteria));
  const systems: QuestionAnalysis['systems'] = [];
  for (const id of Object.keys(SYSTEMS) as SystemId[]) {
    const probability = noulAnswer(answers[`system_${id}`]);
    if (probability === null) throw new Error(`${model.id}: system_${id} answer is malformed`);
    systems.push({ id, probabilityYes: probability });
  }
  if (!intent || !complexity || !entity) throw new Error(`${model.id}: choice answer is malformed`);
  systems.sort((a, b) => b.probabilityYes - a.probabilityYes || a.id.localeCompare(b.id, 'en'));

  const entities = [...aliasMatches];
  if (entity.value !== 'no_match') {
    const doc = entityOptions[Number(entity.value.slice(1))];
    if (doc && !entities.some((e) => e.id === doc.id)) {
      entities.push({ id: doc.id, title: doc.title, type: doc.type, via: 'model' });
    }
  }

  return {
    question,
    analyzer: model.id,
    probabilityMeaning: model.probabilityMeaning,
    intent,
    systems,
    entities,
    complexity,
  };
}

/** Model analysis with a lexical fallback, so a missing model never blocks retrieval. */
export async function analyzeQuestion(
  retrieval: Retrieval,
  question: string,
  model: SystemOneModel | null,
): Promise<QuestionAnalysis> {
  if (!model) return lexicalAnalysis(retrieval, question);
  try {
    const analysis = await modelAnalysis(retrieval, model, question);
    return { ...analysis, baseline: lexicalAnalysis(retrieval, question) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ...lexicalAnalysis(retrieval, question),
      fallback: `${model.id}: ${reason.slice(0, 240)}`,
    };
  }
}
