import type { Retrieval, SearchDocument } from '../retrieve/index.ts';
import {
  SYSTEMS,
  selectedSystems,
  type ComplexityId,
  type EntityRef,
  type QuestionAnalysis,
} from './analysis.ts';

export interface EvidenceIssue {
  id: string;
  type: string;
  status: string;
  summary: string;
}

export interface EvidenceItem {
  id: string;
  kind: SearchDocument['kind'];
  type: string;
  title: string;
  scope: string;
  quest_id?: string;
  quest_title?: string;
  citations: SearchDocument['citations'];
  text: string;
  issues: EvidenceIssue[];
  external_dependencies: SearchDocument['external_dependencies'];
  unresolved_references: string[];
  review_status: SearchDocument['review_status'];
  file: string;
  /** Which retrieval step selected the record. */
  why: string[];
}

export const BUDGETS: Record<ComplexityId, { limit: number; expand: boolean }> = {
  single_fact: { limit: 5, expand: false },
  single_rule: { limit: 7, expand: false },
  multi_rule: { limit: 11, expand: true },
  judgment: { limit: 13, expand: true },
};

const TEXT_LIMIT = 2_400;

/**
 * Deterministic: the same analysis and corpus always produce the same evidence. With a
 * baseline, each analysis gathers within its own budget and the baseline's records come
 * first, so a model analysis can add records but never displace one the baseline found.
 */
export function gatherEvidence(retrieval: Retrieval, analysis: QuestionAnalysis): EvidenceItem[] {
  const { baseline, ...model } = analysis;
  const picked = baseline ? pick(retrieval, baseline) : new Map<string, string[]>();
  for (const [id, why] of pick(retrieval, model))
    picked.set(id, [...(picked.get(id) ?? []), ...why]);
  return [...picked.entries()].map(([id, why]) => item(retrieval, id, why));
}

function pick(retrieval: Retrieval, analysis: QuestionAnalysis): Map<string, string[]> {
  const { question } = analysis;
  const budget = BUDGETS[analysis.complexity.value];
  const intents = new Set([analysis.intent.value]);
  const systems = selectedSystems(analysis);
  const entities = new Map(analysis.entities.map((e) => [e.id, e]));
  const picked = new Map<string, string[]>();
  const add = (id: string, why: string): void => {
    if (!retrieval.document(id)) return;
    picked.set(id, [...(picked.get(id) ?? []), why]);
  };

  const addEntity = (entity: EntityRef): void => {
    add(entity.id, `entity:${entity.via}`);
    const neighbours = retrieval
      .expand(entity.id, { direction: 'out', relations: ['rule', 'table', 'uses_table'] })
      .filter((edge) => edge.found)
      .slice(0, 4);
    for (const edge of neighbours) add(edge.target, `entity:${edge.relation}`);
    const quest = entity.type === 'quest' ? entity.id : retrieval.document(entity.id)?.quest_id;
    if (quest) {
      for (const hit of retrieval.search(question, { questId: quest, limit: 4 })) {
        add(hit.id, `quest:${quest}`);
      }
    }
  };

  // Exact name matches are strong evidence; model-picked entities wait until after search.
  for (const entity of entities.values()) if (entity.via === 'alias') addEntity(entity);

  if (systems.length > 0) {
    const chapters = [...new Set(systems.flatMap((id) => SYSTEMS[id].chapters))];
    const limit = Math.ceil(budget.limit * 0.6);
    for (const hit of retrieval.search(question, { chapters, limit })) {
      add(hit.id, `systems:${systems.join('+')}`);
    }
  }

  if (intents.has('definition')) {
    for (const hit of retrieval.search(question, { kinds: ['term'], limit: 2 }))
      add(hit.id, 'intent:definition');
  }
  if (intents.has('value_lookup')) {
    for (const hit of retrieval.search(question, { kinds: ['table'], limit: 3 }))
      add(hit.id, 'intent:value_lookup');
  }

  for (const hit of retrieval.search(question, { limit: Math.ceil(budget.limit / 2) }))
    add(hit.id, 'search');

  for (const entity of entities.values()) if (entity.via === 'model') addEntity(entity);

  if (budget.expand) {
    for (const id of [...picked.keys()].slice(0, 4)) {
      const edges = retrieval
        .expand(id, {
          direction: 'out',
          relations: ['see_also', 'uses_table', 'depends_on', 'step_rule'],
        })
        .filter((edge) => edge.found)
        .slice(0, 2);
      for (const edge of edges) add(edge.target, `expand:${edge.relation}`);
    }
  }

  const cap = budget.limit + [...entities.values()].filter((e) => e.via === 'alias').length;
  return new Map([...picked.entries()].slice(0, cap));
}

function item(retrieval: Retrieval, id: string, why: string[]): EvidenceItem {
  const doc = retrieval.document(id)!;
  const evidence: EvidenceItem = {
    id: doc.id,
    kind: doc.kind,
    type: doc.type,
    title: doc.title,
    scope: doc.scope,
    citations: doc.citations,
    text: doc.text.length > TEXT_LIMIT ? `${doc.text.slice(0, TEXT_LIMIT)}…` : doc.text,
    issues: retrieval.issues(id).map((issue) => ({
      id: issue.id,
      type: issue.type,
      status: issue.issue_status ?? 'unresolved',
      summary: issue.text.length > 500 ? `${issue.text.slice(0, 500)}…` : issue.text,
    })),
    external_dependencies: doc.external_dependencies,
    unresolved_references: doc.unresolved_references,
    review_status: doc.review_status,
    file: doc.file,
    why: [...new Set(why)],
  };
  if (doc.quest_id) {
    evidence.quest_id = doc.quest_id;
    const quest = retrieval.document(doc.quest_id);
    if (quest) evidence.quest_title = quest.title;
  }
  return evidence;
}
