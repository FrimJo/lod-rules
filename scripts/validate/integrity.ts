/**
 * Cross-file integrity checks for the source map.
 *
 * Schema validation proves each file is well-formed in isolation. These checks prove the
 * files agree with each other: that ids referenced somewhere actually exist, that coverage
 * tracks exactly the sections that exist, and that the page map covers the whole document.
 */

export interface Section {
  id: string;
  title: string;
  kind: string;
  parent?: string;
  redirect_to?: string;
  printed_start_page?: number | null;
  printed_end_page?: number | null;
  pdf_start_page?: number | null;
  pdf_end_page?: number | null;
  external_references?: string[];
  see_also?: string[];
  unresolved_references?: string[];
  notes?: string;
}

export interface Page {
  pdf_page: number;
  printed_page?: number | null;
  section_id?: string;
  notes?: string;
}

export interface CoverageEntry {
  id: string;
  status: string;
  components?: Record<string, string>;
  notes?: string;
}

export interface SourceMap {
  sections: Section[];
  pages: Page[];
  coverage: CoverageEntry[];
  externalSourceIds: string[];
  /** Page count of the canonical document, from source/manifest.yaml. */
  documentPageCount?: number | null;
}

function checkReferences(sections: Section[], pages: Page[], externalIds: string[]): string[] {
  const errors: string[] = [];
  const ids = new Set(sections.map((section) => section.id));
  const externals = new Set(externalIds);

  for (const section of sections) {
    if (section.parent !== undefined && !ids.has(section.parent)) {
      errors.push(`sections.yaml: "${section.id}" has unknown parent "${section.parent}"`);
    }

    for (const target of section.see_also ?? []) {
      if (!ids.has(target)) {
        errors.push(`sections.yaml: "${section.id}" see_also references unknown "${target}"`);
      }
      if (target === section.id) {
        errors.push(`sections.yaml: "${section.id}" see_also references itself`);
      }
    }

    for (const external of section.external_references ?? []) {
      if (!externals.has(external)) {
        errors.push(
          `sections.yaml: "${section.id}" references external source "${external}" that is not declared in source/manifest.yaml`,
        );
      }
    }
  }

  for (const page of pages) {
    if (page.section_id !== undefined && !ids.has(page.section_id)) {
      errors.push(
        `pages.yaml: pdf page ${page.pdf_page} references unknown section "${page.section_id}"`,
      );
    }
  }

  return errors;
}

function checkParentCycles(sections: Section[]): string[] {
  const byId = new Map(sections.map((section) => [section.id, section]));
  const errors: string[] = [];
  const settled = new Set<string>();

  for (const section of sections) {
    const path: string[] = [];
    const seen = new Set<string>();
    let current: Section | undefined = section;

    while (current && !settled.has(current.id)) {
      if (seen.has(current.id)) {
        errors.push(`sections.yaml: parent cycle ${[...path, current.id].join(' -> ')}`);
        break;
      }
      seen.add(current.id);
      path.push(current.id);
      current = current.parent === undefined ? undefined : byId.get(current.parent);
    }

    for (const id of path) settled.add(id);
  }

  return errors;
}

/**
 * Coverage must track every section and nothing else, otherwise the coverage report can
 * silently omit unprocessed material — the exact failure the coverage gate exists to catch.
 */
function checkCoverageMatchesSections(sections: Section[], coverage: CoverageEntry[]): string[] {
  const sectionIds = new Set(sections.map((section) => section.id));
  const coverageIds = new Set(coverage.map((entry) => entry.id));
  const errors: string[] = [];

  for (const id of sectionIds) {
    if (!coverageIds.has(id)) errors.push(`coverage.yaml: no entry for section "${id}"`);
  }
  for (const id of coverageIds) {
    if (!sectionIds.has(id)) errors.push(`coverage.yaml: entry "${id}" has no matching section`);
  }

  return errors;
}

function checkPageMap(pages: Page[], documentPageCount?: number | null): string[] {
  const errors: string[] = [];
  if (pages.length === 0) return errors;

  const seen = new Set<number>();
  for (const page of pages) {
    if (seen.has(page.pdf_page)) {
      errors.push(`pages.yaml: duplicate entry for pdf page ${page.pdf_page}`);
    }
    seen.add(page.pdf_page);
  }

  const expected = documentPageCount ?? Math.max(...pages.map((page) => page.pdf_page));
  for (let pdfPage = 1; pdfPage <= expected; pdfPage += 1) {
    if (!seen.has(pdfPage)) errors.push(`pages.yaml: missing entry for pdf page ${pdfPage}`);
  }
  for (const pdfPage of seen) {
    if (pdfPage > expected) {
      errors.push(`pages.yaml: pdf page ${pdfPage} is beyond the document's ${expected} pages`);
    }
  }

  return errors;
}

function checkPageRanges(sections: Section[]): string[] {
  const errors: string[] = [];

  for (const section of sections) {
    const pairs: Array<[string, number | null | undefined, number | null | undefined]> = [
      ['printed', section.printed_start_page, section.printed_end_page],
      ['pdf', section.pdf_start_page, section.pdf_end_page],
    ];

    for (const [label, start, end] of pairs) {
      if (typeof start === 'number' && typeof end === 'number' && end < start) {
        errors.push(
          `sections.yaml: "${section.id}" has ${label} pages ending (${end}) before starting (${start})`,
        );
      }
    }
  }

  return errors;
}

/** Redirects retain stable IDs but carry no independent extraction work. */
function checkRedirects(map: SourceMap): string[] {
  const errors: string[] = [];
  const sections = new Map(map.sections.map((section) => [section.id, section]));
  const coverage = new Map(map.coverage.map((entry) => [entry.id, entry]));
  const span = [
    'printed_start_page',
    'printed_end_page',
    'pdf_start_page',
    'pdf_end_page',
  ] as const;
  const components = ['glossary', 'rules', 'tables', 'examples', 'procedures', 'entities'];
  for (const section of map.sections) {
    if (section.redirect_to === undefined) continue;
    const target = sections.get(section.redirect_to);
    if (!target) errors.push(`${section.id}: unknown redirect target ${section.redirect_to}`);
    else {
      if (target.id === section.id) errors.push(`${section.id}: self redirect`);
      if (target.redirect_to !== undefined) errors.push(`${section.id}: redirect chain or cycle`);
      if (target.kind !== section.kind) errors.push(`${section.id}: redirect kind mismatch`);
      if (span.some((key) => target[key] !== section[key]))
        errors.push(`${section.id}: redirect page span mismatch`);
    }
    const entry = coverage.get(section.id);
    if (
      entry?.status !== 'mapped' ||
      components.some((key) => entry.components?.[key] !== 'not_applicable')
    )
      errors.push(
        `${section.id}: redirect coverage must be mapped with all components not_applicable`,
      );
  }
  return errors;
}

export function checkIntegrity(map: SourceMap): string[] {
  return [
    ...checkReferences(map.sections, map.pages, map.externalSourceIds),
    ...checkRedirects(map),
    ...checkParentCycles(map.sections),
    ...checkCoverageMatchesSections(map.sections, map.coverage),
    ...checkPageMap(map.pages, map.documentPageCount),
    ...checkPageRanges(map.sections),
  ];
}

export interface SourceReference {
  document: string;
  file?: string;
  pdf_page?: number | null;
  printed_page?: number | null;
}

export interface Term {
  kind?: string;
  id: string;
  name: string;
  abbreviation?: string;
  aliases: string[];
  related: string[];
  section_id: string;
  source: SourceReference[];
}

export interface Alias {
  form: string;
  term_id: string;
}

export type Issue = {
  id: string;
  related: string[];
  source: SourceReference[];
} & (
  | { status: 'unresolved'; resolution?: never }
  | { status: 'resolved'; resolution: { summary: string; source: SourceReference[] } }
);

/** Original concerns and their resolution evidence share the same provenance checks. */
export function reviewSources(entry: Term | Issue): SourceReference[] {
  return 'resolution' in entry && entry.resolution
    ? [...entry.source, ...entry.resolution.source]
    : entry.source;
}

export interface Glossary {
  terms: Term[];
  aliases: Alias[];
  issues: Issue[];
  documentIds: string[];
  canonicalDocumentId: string;
  additionalRelatedIds?: string[];
}

/** Case is ignored for lookup; punctuation (notably AP/AP(X) and NA/N/A) is not. */
export function checkGlossaryIntegrity(glossary: Glossary, map: SourceMap): string[] {
  const errors: string[] = [];
  const terms = new Map(glossary.terms.map((term) => [term.id, term]));
  const sections = new Set(map.sections.map((section) => section.id));
  const documents = new Set(glossary.documentIds);
  const relatedIds = new Set([
    ...terms.keys(),
    ...(glossary.additionalRelatedIds ?? []),
    ...sections,
    ...glossary.issues.map((issue) => issue.id),
  ]);
  const pages = new Map(map.pages.map((page) => [page.pdf_page, page]));
  const expected = new Map<string, string>();
  const actual = new Map<string, string>();

  for (const [label, entries] of [
    ['terms', glossary.terms],
    ['issues', glossary.issues],
  ] as const) {
    const seen = new Set<string>();
    for (const entry of entries) {
      if (seen.has(entry.id)) errors.push(`${label}: duplicate id "${entry.id}"`);
      seen.add(entry.id);
      for (const target of entry.related) {
        if (!(label === 'terms' ? terms.has(target) : relatedIds.has(target))) {
          errors.push(`${entry.id}: unknown related "${target}"`);
        }
      }
      for (const source of reviewSources(entry)) {
        if (!documents.has(source.document)) {
          errors.push(`${entry.id}: unknown document "${source.document}"`);
        }
        // The page map belongs only to the canonical rulebook, never an external book.
        if (source.document !== glossary.canonicalDocumentId) continue;
        if (typeof source.pdf_page === 'number') {
          const page = pages.get(source.pdf_page);
          if (!page) errors.push(`${entry.id}: unknown pdf page ${source.pdf_page}`);
          else if (source.printed_page !== undefined && source.printed_page !== page.printed_page) {
            errors.push(`${entry.id}: printed/pdf page mismatch at pdf page ${source.pdf_page}`);
          }
        } else if (
          typeof source.printed_page === 'number' &&
          !map.pages.some((page) => page.printed_page === source.printed_page)
        ) {
          errors.push(`${entry.id}: unknown printed page ${source.printed_page}`);
        }
      }
    }
  }

  for (const term of glossary.terms) {
    if (!sections.has(term.section_id))
      errors.push(`${term.id}: unknown section "${term.section_id}"`);
    const forms = [term.name, ...(term.abbreviation ? [term.abbreviation] : []), ...term.aliases];
    if (term.abbreviation && !term.aliases.includes(term.abbreviation)) {
      errors.push(`${term.id}: abbreviation missing from aliases`);
    }
    for (const form of forms) {
      const key = form.toLowerCase();
      const owner = expected.get(key);
      if (owner && owner !== term.id) errors.push(`terms: conflicting alias "${form}"`);
      expected.set(key, term.id);
    }
  }
  for (const alias of glossary.aliases) {
    const key = alias.form.toLowerCase();
    if (actual.has(key)) errors.push(`aliases: duplicate form "${alias.form}"`);
    actual.set(key, alias.term_id);
    if (!terms.has(alias.term_id)) errors.push(`aliases: unknown term "${alias.term_id}"`);
    if (expected.get(key) !== alias.term_id)
      errors.push(`aliases: term mismatch for "${alias.form}"`);
  }
  for (const [form, owner] of expected) {
    if (actual.get(form) !== owner) errors.push(`aliases: missing form "${form}" for ${owner}`);
  }
  return errors;
}
