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

export function checkIntegrity(map: SourceMap): string[] {
  return [
    ...checkReferences(map.sections, map.pages, map.externalSourceIds),
    ...checkParentCycles(map.sections),
    ...checkCoverageMatchesSections(map.sections, map.coverage),
    ...checkPageMap(map.pages, map.documentPageCount),
    ...checkPageRanges(map.sections),
  ];
}
