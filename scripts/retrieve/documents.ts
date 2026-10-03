import type {
  Cell,
  Effect,
  Entity,
  PilotSource,
  Procedure,
  Rule,
  StateMachine,
  Step,
  Table,
} from '../validate/pilot-types.ts';
import type { SourceReference } from '../validate/integrity.ts';
import type { GlossaryTerm, RetrievalCorpus, ReviewIssue } from './load.ts';

/** Bump whenever the document shape or indexing changes; stale builds are then ignored. */
export const SEARCH_DOCUMENT_VERSION = 4;

export type DocumentKind =
  'rule' | 'entity' | 'table' | 'procedure' | 'state_machine' | 'term' | 'issue';

export interface Citation {
  document: string;
  file?: string;
  locator?: SourceReference['locator'];
  pdf_page: number | null;
  printed_page: number | null;
  heading?: string;
}

export interface Relation {
  relation: string;
  target: string;
}

export interface ExternalDependency {
  label: string;
  document: string;
}

/** Retrieval projection of one canonical record. The YAML record stays authoritative. */
export interface SearchDocument {
  id: string;
  kind: DocumentKind;
  type: string;
  title: string;
  aliases: string[];
  /** Section and parent titles; cleaner wording than some machine-generated rule names. */
  context: string;
  text: string;
  /** `global` or the rulebook scope; `quest` marks quest-local mechanics. */
  scope: string;
  quest_id?: string;
  section_id?: string;
  /** Chapter-level section (a child of a rulebook part, or the part itself). */
  chapter?: string;
  citations: Citation[];
  relations: Relation[];
  issue_ids: string[];
  unresolved_references: string[];
  external_dependencies: ExternalDependency[];
  review_status: 'extracted' | 'reviewed';
  issue_status?: 'unresolved' | 'resolved';
  issue_summary?: string;
  resolution?: { summary: string; citations: Citation[] };
  file: string;
}

function citations(sources: SourceReference[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const source of sources) {
    const citation: Citation = {
      document: source.document,
      ...(source.file ? { file: source.file } : {}),
      ...(source.locator ? { locator: source.locator } : {}),
      pdf_page: source.pdf_page ?? null,
      printed_page: source.printed_page ?? null,
    };
    if (source.heading) citation.heading = source.heading;
    const key = JSON.stringify(citation);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(citation);
  }
  return out;
}

function lookupTables(effects: Effect[] | undefined): string[] {
  const ids: string[] = [];
  for (const effect of effects ?? []) {
    if (effect.type === 'lookup') ids.push(effect.table_id);
    else if (effect.type === 'choice') {
      for (const option of effect.options) ids.push(...lookupTables(option.effects));
    }
  }
  return ids;
}

function flattenSteps(steps: Step[]): Step[] {
  return steps.flatMap((step) => [step, ...flattenSteps(step.substeps ?? [])]);
}

function cellText(cell: Cell): string {
  return cell.printed;
}

function tableText(table: Table): string {
  const header = table.columns.map((column) => column.label).join(' | ');
  const rows = table.rows.map((row) =>
    table.columns
      .map((column) => (row.cells[column.id] ? cellText(row.cells[column.id]!) : ''))
      .join(' | '),
  );
  return [table.source_text, header, ...rows, ...table.footnotes].join('\n');
}

class Builder {
  private relations: Relation[] = [];
  add(relation: string, targets: Array<string | undefined> | undefined): void {
    for (const target of targets ?? []) if (target) this.relations.push({ relation, target });
  }
  done(): Relation[] {
    const unique = new Map(this.relations.map((r) => [`${r.relation}\0${r.target}`, r]));
    return [...unique.values()].sort(
      (a, b) =>
        a.relation.localeCompare(b.relation, 'en') || a.target.localeCompare(b.target, 'en'),
    );
  }
}

export function buildSearchDocuments(corpus: RetrievalCorpus): SearchDocument[] {
  const sections = new Map(corpus.sections.map((section) => [section.id, section]));
  const quests = corpus.pilot.entities.filter((entity) => entity.type === 'quest');
  const questBySection = new Map(quests.map((quest) => [quest.section_id, quest.id]));
  const issuesFor = new Map<string, string[]>();
  for (const issue of corpus.issues) {
    for (const id of issue.related) issuesFor.set(id, [...(issuesFor.get(id) ?? []), issue.id]);
  }
  const aliasesFor = new Map<string, string[]>();
  for (const alias of corpus.aliases) {
    aliasesFor.set(alias.term_id, [...(aliasesFor.get(alias.term_id) ?? []), alias.form]);
  }

  const context = (sectionId: string | undefined): string => {
    const titles: string[] = [];
    let section = sectionId ? sections.get(sectionId) : undefined;
    for (let depth = 0; section && depth < 3; depth += 1) {
      titles.push(section.title);
      section = section.parent ? sections.get(section.parent) : undefined;
    }
    return titles.join(' — ');
  };

  const chapterOf = (sectionId: string | undefined): string | undefined => {
    let section = sectionId ? sections.get(sectionId) : undefined;
    while (section?.parent) {
      const parent = sections.get(section.parent);
      if (!parent?.parent) return section.id;
      section = parent;
    }
    return section?.id;
  };

  const withChapter = (doc: SearchDocument): SearchDocument => {
    const chapter = chapterOf(doc.section_id);
    return chapter ? { ...doc, chapter } : doc;
  };

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

  const base = (
    record: {
      id: string;
      name: string;
      section_id: string;
      source: PilotSource[];
      status: 'extracted' | 'reviewed';
      see_also?: string[];
      issues?: string[];
      unresolved_references?: string[];
    },
    kind: DocumentKind,
    type: string,
    scope: string,
    questId: string | undefined,
    text: string,
    relations: Builder,
    external: ExternalDependency[] = [],
  ): SearchDocument => {
    relations.add('see_also', record.see_also);
    relations.add('issue', record.issues);
    relations.add('quest', [questId === record.id ? undefined : questId]);
    const issueIds = [
      ...new Set([...(record.issues ?? []), ...(issuesFor.get(record.id) ?? [])]),
    ].sort();
    const doc: SearchDocument = {
      id: record.id,
      kind,
      type,
      title: record.name,
      aliases: [],
      context: context(record.section_id),
      text,
      scope,
      section_id: record.section_id,
      citations: citations(record.source),
      relations: relations.done(),
      issue_ids: issueIds,
      unresolved_references: record.unresolved_references ?? [],
      external_dependencies: external,
      review_status: record.status,
      file: corpus.files.get(record.id) ?? '',
    };
    if (questId) doc.quest_id = questId;
    return doc;
  };

  const dependencyRelations = (
    builder: Builder,
    dependencies: Rule['dependencies'] | Procedure['dependencies'],
  ): ExternalDependency[] => {
    const external: ExternalDependency[] = [];
    for (const dependency of dependencies ?? []) {
      builder.add('depends_on', [dependency.object_id ?? dependency.section_id]);
      if (dependency.external_document) {
        external.push({ label: dependency.label, document: dependency.external_document });
      }
    }
    return external;
  };

  const rule = (r: Rule): SearchDocument => {
    const b = new Builder();
    b.add('uses_table', [...(r.uses_tables ?? []), ...lookupTables(r.effects)]);
    b.add('overrides', r.overrides);
    b.add('term', r.term_refs);
    b.add('timing', r.timing_refs);
    b.add('entity', [r.entity_id]);
    const external = dependencyRelations(b, r.dependencies);
    const questId = questFor(r.section_id, r.quest_id);
    return base(
      r,
      'rule',
      r.type,
      r.scope,
      r.scope === 'quest' ? questId : r.quest_id,
      r.source_text,
      b,
      external,
    );
  };

  const entity = (e: Entity): SearchDocument => {
    const b = new Builder();
    b.add('rule', e.rules);
    b.add('table', [...e.tables, ...(e.table_rows ?? []).map((row) => row.table_id)]);
    b.add('component', [...(e.components ?? []).map((c) => c.entity_id), e.result?.entity_id]);
    b.add('grants', [
      ...(e.grants ?? []).map((g) => g.object_id),
      ...(e.grant_choices ?? []).flatMap((choice) => choice.options.map((g) => g.object_id)),
    ]);
    b.add(
      'starting_equipment',
      (e.starting_equipment ?? []).flatMap((item) => [
        item.object_id,
        ...(item.options ?? []).map((option) => option.object_id),
      ]),
    );
    const questId = e.type === 'quest' ? e.id : questFor(e.section_id, e.quest_id);
    // A background links to its personal quest but is chosen at character creation.
    const questBound = e.quest_id !== undefined && e.type !== 'background';
    const scope = e.type === 'quest' || e.type === 'quest_actor' || questBound ? 'quest' : 'global';
    const text = [e.category, e.school, e.source_text].filter(Boolean).join('\n');
    return base(e, 'entity', e.type, scope, questId, text, b);
  };

  const table = (t: Table): SearchDocument => {
    const b = new Builder();
    b.add(
      'row_rule',
      t.rows.flatMap((row) => row.rule_refs ?? []),
    );
    b.add(
      'row_entity',
      t.rows.flatMap((row) => row.entity_refs ?? []),
    );
    const quest = isQuestSection(t.section_id);
    const doc = base(
      t,
      'table',
      t.type,
      quest ? 'quest' : 'global',
      quest ? questFor(t.section_id) : undefined,
      tableText(t),
      b,
    );
    doc.citations = citations([...t.source, ...t.rows.flatMap((row) => row.source ?? [])]);
    return doc;
  };

  const procedure = (p: Procedure): SearchDocument => {
    const b = new Builder();
    const steps = flattenSteps(p.steps);
    b.add(
      'step_rule',
      steps.flatMap((step) => step.rule_refs ?? []),
    );
    b.add(
      'uses_table',
      steps.flatMap((step) => lookupTables(step.effects)),
    );
    const external = dependencyRelations(b, p.dependencies);
    const quest = isQuestSection(p.section_id);
    const text = [p.source_text, ...steps.map((step) => step.source_text)].join('\n');
    const doc = base(
      p,
      'procedure',
      'procedure',
      quest ? 'quest' : 'global',
      quest ? questFor(p.section_id) : undefined,
      text,
      b,
      external,
    );
    doc.citations = citations([...p.source, ...steps.flatMap((step) => step.source ?? [])]);
    return doc;
  };

  const stateMachine = (m: StateMachine): SearchDocument => {
    const b = new Builder();
    b.add(
      'enters',
      m.states.flatMap((state) => (state.enter ?? []).map((e) => e.object_id)),
    );
    const text = [
      m.source_text,
      ...m.states.flatMap((state) => [
        state.source_text ?? '',
        ...(state.transitions ?? []).map((t) => `${t.event}: ${t.source_text}`),
      ]),
    ].join('\n');
    return base(m, 'state_machine', 'state_machine', 'global', undefined, text, b);
  };

  const term = (t: GlossaryTerm): SearchDocument => {
    const b = new Builder();
    b.add('related', t.related);
    const issueIds = [...new Set(issuesFor.get(t.id) ?? [])].sort();
    b.add('issue', issueIds);
    return {
      id: t.id,
      kind: 'term',
      type: t.kind ?? 'term',
      title: t.name,
      aliases: [
        ...new Set([
          ...t.aliases,
          ...(t.abbreviation ? [t.abbreviation] : []),
          ...(aliasesFor.get(t.id) ?? []),
        ]),
      ]
        .filter((alias) => alias !== t.name)
        .sort(),
      context: context(t.section_id),
      text: t.definition ?? '',
      scope: 'global',
      section_id: t.section_id,
      citations: citations(t.source),
      relations: b.done(),
      issue_ids: issueIds,
      unresolved_references: [],
      external_dependencies: [],
      review_status: 'extracted',
      file: corpus.files.get(t.id) ?? '',
    };
  };

  const issue = (i: ReviewIssue): SearchDocument => {
    const b = new Builder();
    b.add('concerns', i.related);
    const resolution = i.status === 'resolved' ? i.resolution.summary : '';
    return {
      id: i.id,
      kind: 'issue',
      type: i.type,
      title: i.summary.length > 100 ? `${i.summary.slice(0, 97)}…` : i.summary,
      aliases: [],
      context: '',
      text: [i.summary, resolution].filter(Boolean).join('\n'),
      scope: 'review',
      citations: citations(
        i.status === 'resolved' ? [...i.source, ...i.resolution.source] : i.source,
      ),
      relations: b.done(),
      issue_ids: [],
      unresolved_references: [],
      external_dependencies: [],
      review_status: 'extracted',
      issue_status: i.status,
      issue_summary: i.summary,
      ...(i.status === 'resolved'
        ? {
            resolution: {
              summary: i.resolution.summary,
              citations: citations(i.resolution.source),
            },
          }
        : {}),
      file: corpus.files.get(i.id) ?? '',
    };
  };

  const { pilot } = corpus;
  return [
    ...pilot.rules.map(rule),
    ...pilot.entities.map(entity),
    ...pilot.tables.map(table),
    ...pilot.procedures.map(procedure),
    ...pilot.stateMachines.map(stateMachine),
    ...corpus.terms.map(term),
    ...corpus.issues.map(issue),
  ]
    .map(withChapter)
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));
}
