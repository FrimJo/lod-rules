import type { RetrievalCorpus } from '../retrieve/load.ts';
import type { Section, SourceReference } from '../validate/integrity.ts';
import type {
  Dependency,
  Effect,
  Entity,
  Procedure,
  Rule,
  StateMachine,
  Step,
  Table,
} from '../validate/pilot-types.ts';
import {
  RELATION_CATEGORY,
  type Graph,
  type GraphEdge,
  type GraphNode,
  type Relation,
} from './types.ts';

type Target = { target: string | undefined; field: string };

const compare = (a: string, b: string): number => a.localeCompare(b, 'en');

/** Table lookups in `effects`, recursing into choice options. */
function lookupTables(effects: Effect[] | undefined, path: string): Target[] {
  const out: Target[] = [];
  for (const effect of effects ?? []) {
    if (effect.type === 'lookup')
      out.push({ target: effect.table_id, field: `${path}[].table_id` });
    else if (effect.type === 'choice') {
      for (const option of effect.options) {
        out.push(...lookupTables(option.effects, `${path}[].options[].effects`));
      }
    }
  }
  return out;
}

/** Steps with their schema path, depth-first in source order. */
function flattenSteps(steps: Step[], path = 'steps'): Array<{ step: Step; path: string }> {
  return steps.flatMap((step) => [
    { step, path: `${path}[]` },
    ...flattenSteps(step.substeps ?? [], `${path}[].substeps`),
  ]);
}

const many = (targets: Array<string | undefined> | undefined, field: string): Target[] =>
  (targets ?? []).map((target) => ({ target, field }));

function dependencyTargets(dependencies: Dependency[] | undefined): Target[] {
  return (dependencies ?? []).map((dependency) =>
    dependency.object_id
      ? { target: dependency.object_id, field: 'dependencies[].object_id' }
      : { target: dependency.section_id, field: 'dependencies[].section_id' },
  );
}

/** Derives nodes and edges from the canonical corpus. Pure; output is sorted. */
export function deriveGraph(corpus: RetrievalCorpus): Graph {
  const sections = new Map(corpus.sections.map((section) => [section.id, section]));
  const quests = corpus.pilot.entities.filter((entity) => entity.type === 'quest');
  const questBySection = new Map(quests.map((quest) => [quest.section_id, quest.id]));

  // A record's quest: its own `quest_id`, else the quest whose section contains it.
  const questFor = (sectionId: string, explicit?: string): string | undefined => {
    if (explicit) return explicit;
    for (let id: string | undefined = sectionId; id; id = sections.get(id)?.parent) {
      const quest = questBySection.get(id);
      if (quest) return quest;
    }
    return undefined;
  };
  const isQuestSection = (sectionId: string): boolean =>
    sectionId.startsWith('section.quest_book_i') || questFor(sectionId) !== undefined;

  const edges: GraphEdge[] = [];
  const add = (
    source: string,
    relation: Relation,
    targets: Target[],
    provenance: SourceReference[],
  ): void => {
    for (const { target, field } of targets) {
      if (!target) continue;
      edges.push({
        source,
        relation,
        target,
        category: RELATION_CATEGORY[relation],
        field,
        provenance,
      });
    }
  };

  const common = (
    record: {
      id: string;
      source: SourceReference[];
      see_also?: string[];
      issues?: string[];
      quest_id?: string;
    },
    questId: string | undefined,
  ): void => {
    add(record.id, 'see_also', many(record.see_also, 'see_also'), record.source);
    add(record.id, 'issue', many(record.issues, 'issues'), record.source);
    if (questId !== record.id) {
      // Explicit `quest_id`, else derived from the quest that owns the record's section.
      const field = record.quest_id ? 'quest_id' : 'section_id';
      add(record.id, 'quest', [{ target: questId, field }], record.source);
    }
  };

  const rule = (r: Rule): void => {
    add(
      r.id,
      'uses_table',
      [...many(r.uses_tables, 'uses_tables'), ...lookupTables(r.effects, 'effects')],
      r.source,
    );
    add(r.id, 'overrides', many(r.overrides, 'overrides'), r.source);
    add(r.id, 'term', many(r.term_refs, 'term_refs'), r.source);
    add(r.id, 'timing', many(r.timing_refs, 'timing_refs'), r.source);
    add(r.id, 'entity', [{ target: r.entity_id, field: 'entity_id' }], r.source);
    add(r.id, 'depends_on', dependencyTargets(r.dependencies), r.source);
    common(r, r.scope === 'quest' ? questFor(r.section_id, r.quest_id) : r.quest_id);
  };

  const entity = (e: Entity): void => {
    add(e.id, 'rule', many(e.rules, 'rules'), e.source);
    add(
      e.id,
      'table',
      [
        ...many(e.tables, 'tables'),
        ...many(
          (e.table_rows ?? []).map((row) => row.table_id),
          'table_rows[].table_id',
        ),
      ],
      e.source,
    );
    add(
      e.id,
      'component',
      [
        ...many(
          (e.components ?? []).map((c) => c.entity_id),
          'components[].entity_id',
        ),
        { target: e.result?.entity_id, field: 'result.entity_id' },
      ],
      e.source,
    );
    add(
      e.id,
      'grants',
      [
        ...many(
          (e.grants ?? []).map((g) => g.object_id),
          'grants[].object_id',
        ),
        ...many(
          (e.grant_choices ?? []).flatMap((choice) => choice.options.map((g) => g.object_id)),
          'grant_choices[].options[].object_id',
        ),
      ],
      e.source,
    );
    add(
      e.id,
      'starting_equipment',
      (e.starting_equipment ?? []).flatMap((item) => [
        { target: item.object_id, field: 'starting_equipment[].object_id' },
        ...many(
          (item.options ?? []).map((option) => option.object_id),
          'starting_equipment[].options[].object_id',
        ),
      ]),
      e.source,
    );
    common(e, e.type === 'quest' ? e.id : questFor(e.section_id, e.quest_id));
  };

  const table = (t: Table): void => {
    add(
      t.id,
      'row_rule',
      many(
        t.rows.flatMap((row) => row.rule_refs ?? []),
        'rows[].rule_refs',
      ),
      t.source,
    );
    add(
      t.id,
      'row_entity',
      many(
        t.rows.flatMap((row) => row.entity_refs ?? []),
        'rows[].entity_refs',
      ),
      t.source,
    );
    common(t, isQuestSection(t.section_id) ? questFor(t.section_id) : undefined);
  };

  const procedure = (p: Procedure): void => {
    const steps = flattenSteps(p.steps);
    add(
      p.id,
      'step_rule',
      steps.flatMap(({ step, path }) => many(step.rule_refs, `${path}.rule_refs`)),
      p.source,
    );
    add(
      p.id,
      'uses_table',
      steps.flatMap(({ step, path }) => lookupTables(step.effects, `${path}.effects`)),
      p.source,
    );
    add(p.id, 'depends_on', dependencyTargets(p.dependencies), p.source);
    common(p, isQuestSection(p.section_id) ? questFor(p.section_id) : undefined);
  };

  const stateMachine = (m: StateMachine): void => {
    add(
      m.id,
      'enters',
      many(
        m.states.flatMap((state) => (state.enter ?? []).map((e) => e.object_id)),
        'states[].enter[].object_id',
      ),
      m.source,
    );
    common(m, undefined);
  };

  const { pilot } = corpus;
  pilot.rules.forEach(rule);
  pilot.entities.forEach(entity);
  pilot.tables.forEach(table);
  pilot.procedures.forEach(procedure);
  pilot.stateMachines.forEach(stateMachine);
  for (const term of corpus.terms)
    add(term.id, 'related', many(term.related, 'related'), term.source);
  // Glossary terms carry no `issues` field; the issue's `related` links back to them.
  const terms = new Set(corpus.terms.map((term) => term.id));
  for (const issue of corpus.issues) {
    add(issue.id, 'concerns', many(issue.related, 'related'), issue.source);
    for (const id of issue.related) {
      if (terms.has(id))
        add(id, 'issue', [{ target: issue.id, field: 'issue.related' }], issue.source);
    }
  }

  const testCases = corpus.testCases ?? [];
  for (const test of testCases) {
    add(
      test.id,
      'tests',
      [
        ...many(test.rule_ids, 'rule_ids'),
        { target: test.procedure_id, field: 'procedure_id' },
        ...many(test.expected.trace, 'expected.trace'),
      ],
      test.source,
    );
  }
  for (const record of [
    ...pilot.rules,
    ...pilot.entities,
    ...pilot.tables,
    ...pilot.procedures,
    ...pilot.stateMachines,
    ...corpus.terms,
    ...testCases,
  ]) {
    const target = { target: record.section_id, field: 'section_id' };
    add(record.id, 'cites_section', [target], record.source);
  }

  // Sections carry page spans, not source references; cite the canonical rulebook's pages.
  const rulebook = corpus.manifest.documents.find((d) => d.canonical)?.id ?? 'unknown';
  const sectionSource = (section: Section): SourceReference[] => {
    const pages = [
      { pdf_page: section.pdf_start_page, printed_page: section.printed_start_page },
      { pdf_page: section.pdf_end_page, printed_page: section.printed_end_page },
    ].filter((page, i) => i === 0 || page.pdf_page !== section.pdf_start_page);
    return pages.map((page) => ({
      document: rulebook,
      ...(page.pdf_page != null ? { pdf_page: page.pdf_page } : {}),
      ...(page.printed_page != null ? { printed_page: page.printed_page } : {}),
    }));
  };
  for (const section of corpus.sections) {
    const source = sectionSource(section);
    add(section.id, 'part_of', [{ target: section.parent, field: 'parent' }], source);
    add(
      section.id,
      'redirects_to',
      [{ target: section.redirect_to, field: 'redirect_to' }],
      source,
    );
    add(section.id, 'external', many(section.external_references, 'external_references'), source);
  }

  const nodes: GraphNode[] = [
    ...pilot.rules.map((r) => ({ id: r.id, kind: 'rule' as const, title: r.name })),
    ...pilot.entities.map((e) => ({ id: e.id, kind: 'entity' as const, title: e.name })),
    ...pilot.tables.map((t) => ({ id: t.id, kind: 'table' as const, title: t.name })),
    ...pilot.procedures.map((p) => ({ id: p.id, kind: 'procedure' as const, title: p.name })),
    ...pilot.stateMachines.map((m) => ({
      id: m.id,
      kind: 'state_machine' as const,
      title: m.name,
    })),
    ...corpus.terms.map((t) => ({ id: t.id, kind: 'term' as const, title: t.name })),
    ...testCases.map((t) => ({ id: t.id, kind: 'test_case' as const, title: t.name })),
    ...corpus.issues.map((i) => ({ id: i.id, kind: 'issue' as const, title: i.summary })),
    ...corpus.sections.map((s) => ({ id: s.id, kind: 'section' as const, title: s.title })),
    ...corpus.manifest.documents.map((d) => ({
      id: d.id,
      kind: 'document' as const,
      title: d.title,
    })),
    ...(corpus.manifest.external_sources ?? []).map((d): GraphNode => ({
      id: d.id,
      kind: 'document',
      title: d.title,
      ...(d.status === 'not_present' ? { not_present: true as const } : {}),
    })),
  ];

  return {
    nodes: nodes.sort((a, b) => compare(a.id, b.id)),
    edges: edges.sort(
      (a, b) =>
        compare(a.source, b.source) ||
        compare(a.relation, b.relation) ||
        compare(a.target, b.target) ||
        compare(a.field, b.field),
    ),
  };
}
