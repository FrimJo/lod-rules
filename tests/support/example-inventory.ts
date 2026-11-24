/**
 * Checks the Phase 8 example inventory (tests/fixtures/example-inventory.json) against the
 * pilot test cases, the source map and review/ (issues #13, #14). Returns one message per
 * problem, so a test can show each rule firing on a minimal broken copy.
 */
import type { ReviewSnapshot } from '../../scripts/validate/independent-review.ts';

export const forms = ['labelled_example', 'inline_prose', 'caption', 'table', 'diagram'] as const;
export const dispositions = [
  'executable',
  'descriptive',
  'source_conflicted',
  'missing_information',
] as const;

export interface InventoryEntry {
  id: string;
  section_id: string;
  pdf_page: number;
  printed_page: number | null;
  anchor: string;
  form: (typeof forms)[number];
  disposition: (typeof dispositions)[number];
  reason: string;
  cases?: string[];
  issues?: string[];
  pending?: boolean;
}
export interface ExampleInventory {
  description: string;
  /**
   * Sections not yet swept for examples. The chapter slices (#15–#19) shrank it and #20 deleted
   * it; under `closed` any listed section fails.
   */
  unswept_sections?: string[];
  entries: InventoryEntry[];
}
export interface InventoryContext {
  /** Section id → true when the section only redirects to another. */
  sections: Map<string, boolean>;
  /** PDF page → printed page, from corpus/source-map/pages.yaml. */
  printedPage: Map<number, number | null>;
  /** Section id → its `examples` coverage component. */
  examplesCoverage: Map<string, string | undefined>;
  issueIds: Set<string>;
  caseKinds: Map<string, string>;
}

export function inventoryContext(snapshot: ReviewSnapshot): InventoryContext {
  return {
    sections: new Map(snapshot.sections.map((section) => [section.id, !!section.redirect_to])),
    printedPage: new Map(snapshot.pages.map((page) => [page.pdf_page, page.printed_page ?? null])),
    examplesCoverage: new Map(snapshot.coverage.map((row) => [row.id, row.components?.examples])),
    issueIds: new Set(snapshot.issues.map((issue) => issue.id)),
    caseKinds: new Map(snapshot.pilot.testCases.map((testCase) => [testCase.id, testCase.kind])),
  };
}

/** `closed` is the Phase 8 exit (#20): no pending entry and no unswept section. */
export function checkExampleInventory(
  inventory: ExampleInventory,
  context: InventoryContext,
  { closed = false }: { closed?: boolean } = {},
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const claims = new Map<string, number>();

  for (const entry of inventory.entries) {
    const at = (message: string): void => void problems.push(`${entry.id}: ${message}`);
    if (seen.has(entry.id)) at('duplicate id');
    seen.add(entry.id);
    if (/\.p\d+(\.|$)/.test(entry.id)) at('id encodes a page number');

    if (!(dispositions as readonly string[]).includes(entry.disposition))
      at(`disposition "${String(entry.disposition)}" is not one of ${dispositions.join(', ')}`);
    if (!(forms as readonly string[]).includes(entry.form))
      at(`form "${String(entry.form)}" is not one of ${forms.join(', ')}`);
    if (!entry.reason?.trim()) at('empty reason');
    if (!entry.anchor?.trim()) at('empty anchor');

    const redirected = context.sections.get(entry.section_id);
    if (redirected === undefined) at(`section ${entry.section_id} does not resolve`);
    else if (redirected) at(`section ${entry.section_id} is a redirect`);
    else if (
      (context.examplesCoverage.get(entry.section_id) ?? 'not_applicable') === 'not_applicable'
    )
      at(`section ${entry.section_id} has examples coverage not_applicable`);

    if (!context.printedPage.has(entry.pdf_page))
      at(`pdf_page ${entry.pdf_page} is not in the page map`);
    else if (context.printedPage.get(entry.pdf_page) !== entry.printed_page)
      at(
        `printed_page ${String(entry.printed_page)} disagrees with the page map (${String(context.printedPage.get(entry.pdf_page))})`,
      );

    for (const id of entry.cases ?? []) {
      claims.set(id, (claims.get(id) ?? 0) + 1);
      const kind = context.caseKinds.get(id);
      if (kind === undefined) at(`case ${id} does not resolve`);
      else if (kind !== 'source_example') at(`case ${id} is ${kind}, not a source_example`);
    }
    for (const id of entry.issues ?? [])
      if (!context.issueIds.has(id)) at(`issue ${id} is not in review/ambiguities.yaml`);

    if (entry.pending !== undefined) {
      if (entry.disposition !== 'executable') at('pending is only for executable entries');
      else if (entry.pending !== true) at('pending must be true or absent');
      else if (entry.cases?.length) at('pending entry already names cases');
      if (closed) at('still pending after the Phase 8 close-out');
    }
    if (entry.disposition === 'executable' && !entry.pending && !entry.cases?.length)
      at('executable entry has no cases');
    if (entry.disposition === 'source_conflicted' && !entry.issues?.length)
      at('source_conflicted entry names no issue');
  }

  for (const [id, kind] of context.caseKinds) {
    if (kind !== 'source_example') continue;
    const count = claims.get(id) ?? 0;
    if (count === 0) problems.push(`${id}: source_example claimed by no entry`);
    else if (count > 1) problems.push(`${id}: source_example claimed by ${count} entries`);
  }

  const unswept = new Set<string>();
  for (const id of inventory.unswept_sections ?? []) {
    if (unswept.has(id)) problems.push(`allowlisted section ${id} is listed twice`);
    unswept.add(id);
    const redirected = context.sections.get(id);
    if (redirected === undefined) problems.push(`allowlisted section ${id} does not exist`);
    else if (redirected) problems.push(`allowlisted section ${id} is a redirect`);
    if (closed)
      problems.push(`allowlisted section ${id} still unswept after the Phase 8 close-out`);
  }
  return problems;
}
