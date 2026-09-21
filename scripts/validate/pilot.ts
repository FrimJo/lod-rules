import { reviewSources } from './integrity.ts';
import type { SourceMap, Term, Issue } from './integrity.ts';
import type {
  Pilot,
  Metadata,
  Fields,
  Operand,
  Condition,
  Effect,
  Dependency,
  Step,
  PilotSource,
} from './pilot-types.ts';

export interface PilotContext {
  map: SourceMap;
  terms: Term[];
  issues: Issue[];
  documents: Array<{ id: string; file: string }>;
  externalIds: string[];
}

/** Schema checks structure; this checks joins, local symbols, provenance, and table semantics. */
export function checkPilotIntegrity(pilot: Pilot, context: PilotContext): string[] {
  const errors: string[] = [];
  const registry = new Map<string, string>();
  function register(id: string, kind: string): void {
    if (registry.has(id)) errors.push(`${id}: duplicate global id`);
    registry.set(id, kind);
  }
  for (const [kind, entries] of Object.entries(pilot))
    for (const entry of entries as Metadata[]) register(entry.id, kind);
  for (const term of context.terms) register(term.id, 'terms');
  for (const issue of context.issues) register(issue.id, 'issues');
  for (const section of context.map.sections) register(section.id, 'sections');
  for (const document of context.documents) register(document.id, 'documents');
  for (const id of context.externalIds) register(id, 'documents');
  function link(owner: string, target: string, kinds?: string[]): void {
    const kind = registry.get(target);
    if (!kind) errors.push(`${owner}: unknown reference ${target}`);
    else if (kinds && !kinds.includes(kind))
      errors.push(`${owner}: wrong reference kind ${target}; expected ${kinds.join('/')}`);
  }
  const issues = new Map(context.issues.map((issue) => [issue.id, issue]));
  function openIssue(owner: string, target: string): void {
    link(owner, target, ['issues']);
    if (issues.get(target)?.status === 'resolved')
      errors.push(`${owner}: executable unresolved reference requires an open issue: ${target}`);
  }
  const docs = new Map(context.documents.map((d) => [d.id, d.file]));
  const pages = new Map(context.map.pages.map((p) => [p.pdf_page, p]));
  function provenance(owner: string, sources: PilotSource[]): void {
    for (const source of sources) {
      const file = docs.get(source.document);
      if (!file) {
        errors.push(`${owner}: unavailable source document ${source.document}`);
        continue;
      }
      if (source.file !== `source/${file}`)
        errors.push(`${owner}: source file does not match document`);
      // All present pilot evidence is from the mapped rulebook. External dependencies are not evidence.
      const page = pages.get(source.pdf_page);
      if (!page) errors.push(`${owner}: unknown pdf page ${source.pdf_page}`);
      else if (page.printed_page !== source.printed_page)
        errors.push(`${owner}: printed/pdf page mismatch`);
    }
  }
  function metadata(entry: Metadata): void {
    link(entry.id, entry.section_id, ['sections']);
    provenance(entry.id, entry.source);
    for (const id of entry.see_also ?? []) link(entry.id, id, ['sections']);
    for (const id of entry.issues ?? []) link(entry.id, id, ['issues']);
  }
  function unique(owner: string, ids: string[]): void {
    if (new Set(ids).size !== ids.length) errors.push(`${owner}: duplicate local id`);
  }
  function mechanics(
    owner: string,
    fields: Fields,
    dependencies: Dependency[],
    condition?: Condition,
    effects: Effect[] = [],
  ): void {
    for (const [key, definition] of Object.entries(fields)) {
      if (
        (definition.minimum !== undefined ||
          definition.maximum !== undefined ||
          definition.integer) &&
        definition.type !== 'number'
      )
        errors.push(`${owner}: nonnumeric field range ${key}`);
      if (
        definition.minimum !== undefined &&
        definition.maximum !== undefined &&
        definition.minimum > definition.maximum
      )
        errors.push(`${owner}: reversed field range ${key}`);
    }
    unique(
      owner,
      dependencies.map((d) => d.key),
    );
    const keys = new Set(dependencies.map((d) => d.key));
    for (const dep of dependencies) {
      if (dep.object_id)
        link(owner, dep.object_id, ['rules', 'entities', 'tables', 'procedures', 'terms']);
      if (dep.section_id) link(owner, dep.section_id, ['sections']);
      if (dep.external_document && !context.externalIds.includes(dep.external_document))
        errors.push(`${owner}: unknown external document ${dep.external_document}`);
    }
    function field(name: string): string | undefined {
      if (!fields[name]) errors.push(`${owner}: undeclared field ${name}`);
      return fields[name]?.type;
    }
    function operand(value: Operand): string | undefined {
      if (value.type === 'literal') return typeof value.value;
      if (value.type === 'field') return field(value.name);
      for (const item of value.values)
        if (operand(item) !== 'number') errors.push(`${owner}: sum requires numbers`);
      return 'number';
    }
    function predicate(value: Condition): void {
      if (value.type === 'compare') {
        const left = operand(value.left);
        const right = operand(value.right);
        if (left !== right) errors.push(`${owner}: comparison type mismatch`);
        if (!['eq', 'ne'].includes(value.operator) && left !== 'number')
          errors.push(`${owner}: ordered comparison requires numbers`);
      } else if (value.type === 'not') predicate(value.condition);
      else for (const item of value.conditions) predicate(item);
    }
    function effect(value: Effect): void {
      if (value.type === 'set' || value.type === 'add') {
        const target = field(value.target);
        const input = operand(value.value);
        if (target !== input || (value.type === 'add' && target !== 'number'))
          errors.push(`${owner}: effect operand type mismatch`);
        if (fields[value.target]?.role === 'input')
          errors.push(`${owner}: cannot write input ${value.target}`);
      } else if (value.type === 'require') predicate(value.condition);
      else if (value.type === 'unresolved') openIssue(owner, value.issue_id);
      else if (value.type === 'choice') {
        if (field(value.selection) !== 'string')
          errors.push(`${owner}: choice selection must be string`);
        unique(
          owner,
          value.options.map((o) => o.id),
        );
        for (const option of value.options) {
          if (option.when) predicate(option.when);
          option.effects.forEach(effect);
        }
      } else if (value.type === 'select_card') {
        if (operand(value.choice) !== 'string') errors.push(`${owner}: card choice must be string`);
        for (const option of value.options)
          if (operand(option) !== 'string') errors.push(`${owner}: card option must be string`);
      } else if (
        value.type === 'invoke' ||
        value.type === 'ignore' ||
        value.type === 'replace_range'
      ) {
        if (!keys.has(value.dependency))
          errors.push(`${owner}: unknown dependency key ${value.dependency}`);
        if (value.type === 'replace_range' && value.range.min > value.range.max)
          errors.push(`${owner}: reversed range`);
      }
    }
    if (condition) predicate(condition);
    effects.forEach(effect);
  }
  for (const entries of Object.values(pilot))
    for (const entry of entries as Metadata[]) metadata(entry);
  for (const rule of pilot.rules) {
    if (!/^(core|character|combat)\./.test(rule.id))
      errors.push(`${rule.id}: invalid rule namespace`);
    mechanics(rule.id, rule.fields, rule.dependencies ?? [], rule.when, rule.effects);
    for (const alternative of rule.alternatives ?? [])
      mechanics(rule.id, rule.fields, rule.dependencies ?? [], undefined, alternative.effects);
    for (const target of rule.overrides ?? []) {
      link(rule.id, target, ['rules']);
      if (target === rule.id) errors.push(`${rule.id}: self override`);
    }
    for (const target of rule.uses_tables ?? []) link(rule.id, target, ['tables']);
    for (const target of rule.term_refs ?? []) link(rule.id, target, ['terms']);
    for (const limit of rule.usage_limits ?? [])
      if (limit.aggregation_issue) openIssue(rule.id, limit.aggregation_issue);
  }
  for (const entity of pilot.entities) {
    if (entity.type === 'talent' && (!entity.category || entity.activation !== 'passive'))
      errors.push(`${entity.id}: missing talent classification`);
    if (!entity.id.startsWith(`${entity.type}.`))
      errors.push(`${entity.id}: invalid entity namespace`);
    for (const id of entity.rules) link(entity.id, id, ['rules']);
    for (const id of entity.tables) link(entity.id, id, ['tables']);
    for (const grant of entity.grants ?? []) {
      if (grant.object_id) {
        link(entity.id, grant.object_id, ['entities']);
        if (!grant.object_id.startsWith(`${grant.kind}.`))
          errors.push(`${entity.id}: grant kind mismatch`);
      }
      if (grant.section_id) link(entity.id, grant.section_id, ['sections']);
    }
  }
  for (const table of pilot.tables) {
    if (!table.id.startsWith('table.')) errors.push(`${table.id}: invalid table namespace`);
    unique(
      table.id,
      table.columns.map((c) => c.id),
    );
    unique(
      table.id,
      table.rows.map((r) => r.id),
    );
    if (
      table.completeness === 'partial' &&
      (table.selection?.length !== table.rows.length ||
        table.rows.some((row) => !table.selection?.includes(row.source_row)))
    )
      errors.push(`${table.id}: partial selection does not match source rows`);
    for (const row of table.rows) {
      const columns = new Set(table.columns.map((c) => c.id));
      if (
        Object.keys(row.cells).length !== columns.size ||
        Object.keys(row.cells).some((key) => !columns.has(key))
      )
        errors.push(`${table.id}/${row.id}: incorrect columns`);
      for (const column of table.columns) {
        const cell = row.cells[column.id];
        if (!cell || !column.cell_types.includes(cell.type)) {
          errors.push(`${table.id}/${row.id}: invalid cell type for ${column.id}`);
          continue;
        }
        if (cell.type === 'number' && Number(cell.printed.replace('±', '')) !== cell.value)
          errors.push(`${table.id}/${row.id}: printed numeric value mismatch`);
        if (cell.type === 'dice' && cell.printed !== `+${cell.dice.count}d${cell.dice.sides}`)
          errors.push(`${table.id}/${row.id}: printed dice mismatch`);
        if (cell.type === 'marker' && (cell.printed === 'N/A') !== (cell.meaning === 'unavailable'))
          errors.push(`${table.id}/${row.id}: marker meaning mismatch`);
      }
    }
  }
  for (const procedure of pilot.procedures) {
    if (!procedure.id.startsWith('procedure.'))
      errors.push(`${procedure.id}: invalid procedure namespace`);
    const ids: string[] = [];
    function walk(steps: Step[]): void {
      for (const step of steps) {
        ids.push(step.id);
        if (step.source) provenance(`${procedure.id}/${step.id}`, step.source);
        mechanics(
          `${procedure.id}/${step.id}`,
          procedure.fields,
          procedure.dependencies,
          step.when,
          step.effects,
        );
        for (const id of step.rule_refs ?? []) {
          link(procedure.id, id, ['rules']);
          for (const [field, definition] of Object.entries(
            pilot.rules.find((rule) => rule.id === id)?.fields ?? {},
          )) {
            if (procedure.fields[field]?.type !== definition.type)
              errors.push(`${procedure.id}: referenced rule field mismatch ${field}`);
          }
        }
        walk(step.substeps ?? []);
      }
    }
    walk(procedure.steps);
    unique(procedure.id, ids);
    if (
      procedure.entry_step !== procedure.steps[0]?.id ||
      procedure.exit_step !== procedure.steps.at(-1)?.id
    )
      errors.push(`${procedure.id}: invalid entry/exit step`);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string): void {
    if (visiting.has(id)) {
      errors.push(`${id}: override cycle`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const target of pilot.rules.find((rule) => rule.id === id)?.overrides ?? []) visit(target);
    visiting.delete(id);
    visited.add(id);
  }
  for (const rule of pilot.rules) visit(rule.id);
  for (const entry of [...context.terms, ...context.issues]) {
    for (const source of reviewSources(entry)) {
      const file = source.file;
      if (
        file !== undefined &&
        docs.has(source.document) &&
        file !== `source/${docs.get(source.document)}`
      )
        errors.push(`${entry.id}: source file does not match document`);
    }
  }
  for (const fixture of pilot.testCases) {
    if (!fixture.id.startsWith('test.')) errors.push(`${fixture.id}: invalid test namespace`);
    for (const id of fixture.rule_ids ?? []) link(fixture.id, id, ['rules']);
    if (fixture.procedure_id) link(fixture.id, fixture.procedure_id, ['procedures']);
    for (const id of fixture.expected.trace) link(fixture.id, id, ['rules', 'procedures']);
    for (const id of fixture.expected.unresolved) openIssue(fixture.id, id);
    const objects = fixture.procedure_id
      ? pilot.procedures.filter((p) => p.id === fixture.procedure_id)
      : pilot.rules.filter((r) => fixture.rule_ids?.includes(r.id));
    const stepIds = new Set<string>();
    function collect(steps: Step[]): void {
      for (const step of steps) {
        stepIds.add(step.id);
        collect(step.substeps ?? []);
      }
    }
    if (fixture.procedure_id)
      collect(pilot.procedures.find((p) => p.id === fixture.procedure_id)?.steps ?? []);
    for (const id of fixture.expected.steps)
      if (!stepIds.has(id)) errors.push(`${fixture.id}: unknown expected step ${id}`);
    const fields: Fields = {};
    for (const object of objects)
      for (const [key, value] of Object.entries(object.fields)) {
        if (fields[key] && fields[key]?.type !== value.type)
          errors.push(`${fixture.id}: incompatible field declarations ${key}`);
        fields[key] = value;
      }
    for (const [key, value] of [
      ...Object.entries(fixture.inputs),
      ...Object.entries(fixture.expected.state),
    ]) {
      if (!fields[key]) errors.push(`${fixture.id}: undeclared fixture field ${key}`);
      else if (typeof value !== fields[key]?.type)
        errors.push(`${fixture.id}: fixture field type mismatch ${key}`);
      else if (typeof value === 'number') {
        const definition = fields[key];
        if (
          (definition?.minimum !== undefined && value < definition.minimum) ||
          (definition?.maximum !== undefined && value > definition.maximum) ||
          (definition?.integer && !Number.isInteger(value))
        )
          errors.push(`${fixture.id}: fixture value out of range ${key}`);
      }
    }
  }
  return errors;
}
