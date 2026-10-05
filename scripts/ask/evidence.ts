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
  resolution?: { summary: string; citations: SearchDocument['citations'] };
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

export type CandidateSource = 'lexical' | 'model';

export interface EvidenceCandidate {
  id: string;
  kind: SearchDocument['kind'];
  why: string[];
  /** Which analyses selected the record: the lexical baseline, the model, or both. */
  sources: CandidateSource[];
  /** An exact name in the question, or that entity's own rule or table. */
  exact: boolean;
}

interface Picked {
  why: string[];
  exact: boolean;
}

/**
 * Deterministic: the same analysis and corpus always produce the same evidence. With a
 * baseline, each analysis gathers within its own budget and the baseline's records come
 * first, so a model analysis can add records but never displace one the baseline found.
 */
export function gatherEvidence(retrieval: Retrieval, analysis: QuestionAnalysis): EvidenceItem[] {
  return collectCandidates(retrieval, analysis).map((c) => evidenceItem(retrieval, c.id, c.why));
}

/** The records `gatherEvidence` returns, in the same order, with where each came from. */
export function collectCandidates(
  retrieval: Retrieval,
  analysis: QuestionAnalysis,
): EvidenceCandidate[] {
  const { baseline, ...model } = analysis;
  const pools: Array<[CandidateSource, Map<string, Picked>]> = baseline
    ? [
        ['lexical', pick(retrieval, baseline)],
        ['model', pick(retrieval, model)],
      ]
    : [[model.analyzer === 'lexical' ? 'lexical' : 'model', pick(retrieval, model)]];
  const out = new Map<string, EvidenceCandidate>();
  for (const [source, picked] of pools) {
    for (const [id, { why, exact }] of picked) {
      const seen = out.get(id);
      if (seen) {
        seen.why = [...seen.why, ...why];
        seen.sources.push(source);
        seen.exact ||= exact;
      } else {
        const kind = retrieval.document(id)!.kind;
        out.set(id, { id, kind, why, sources: [source], exact });
      }
    }
  }
  return [...out.values()];
}

function pick(retrieval: Retrieval, analysis: QuestionAnalysis): Map<string, Picked> {
  const { question } = analysis;
  const budget = BUDGETS[analysis.complexity.value];
  const intents = new Set([analysis.intent.value]);
  const systems = selectedSystems(analysis);
  const entities = new Map(analysis.entities.map((e) => [e.id, e]));
  const picked = new Map<string, Picked>();
  // Records found by heading structure rather than ranking; they ride on top of the budget.
  let structural = 0;
  const add = (id: string, why: string, exact = false): void => {
    if (!retrieval.document(id)) return;
    const seen = picked.get(id);
    picked.set(id, { why: [...(seen?.why ?? []), why], exact: (seen?.exact ?? false) || exact });
  };

  const addEntity = (entity: EntityRef): void => {
    const exact = entity.via === 'alias';
    add(entity.id, `entity:${entity.via}`, exact);
    const neighbours = retrieval
      .expand(entity.id, { direction: 'out', relations: ['rule', 'table', 'uses_table'] })
      .filter((edge) => edge.found)
      .slice(0, 4);
    for (const edge of neighbours) add(edge.target, `entity:${edge.relation}`, exact);
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
    const hits = retrieval.search(question, { chapters, limit });
    for (const hit of hits) add(hit.id, `systems:${systems.join('+')}`);
    // One heading is often split into several records (a miscast, its normal and wounded
    // thresholds); siblings of the top hits rarely share enough words with the question.
    if (budget.expand) {
      for (const hit of hits.slice(0, 2)) {
        const section = retrieval.document(hit.id)?.section_id;
        if (!section) continue;
        const siblings = retrieval
          .search(question, { sections: [section], limit: 3 })
          .filter((sibling) => !picked.has(sibling.id))
          .slice(0, 2);
        for (const sibling of siblings) add(sibling.id, `section:${section}`);
        structural += siblings.length;
      }
    }
  }

  // A heading the question names ("wounded", "stunned") holds the rule that defines it, often
  // in a chapter the system search did not reach.
  const covered = new Set([...picked.keys()].map((id) => retrieval.document(id)?.section_id));
  for (const heading of retrieval.namedHeadings(question).slice(0, 4)) {
    if (covered.has(heading.section_id)) continue;
    const hits = retrieval
      .search(question, { sections: [heading.section_id], limit: 2 })
      .filter((hit) => !picked.has(hit.id));
    for (const hit of hits) add(hit.id, `heading:${heading.section_id}`);
    covered.add(heading.section_id);
    structural += hits.length;
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

  // Exact names and structural records ride on top of the budget rather than crowd out search.
  const cap =
    budget.limit + structural + [...entities.values()].filter((e) => e.via === 'alias').length;
  return new Map([...picked.entries()].slice(0, cap));
}

export function evidenceItem(retrieval: Retrieval, id: string, why: string[]): EvidenceItem {
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
      summary: issue.issue_summary ?? issue.text,
      ...(issue.resolution ? { resolution: issue.resolution } : {}),
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
