import { describe, expect, it } from 'vitest';
import {
  checkIntegrity,
  type CoverageEntry,
  type Page,
  type Section,
  type SourceMap,
} from '../../scripts/validate/integrity.ts';

function section(id: string, overrides: Partial<Section> = {}): Section {
  return { id, title: id, kind: 'chapter', ...overrides };
}

function coverageFor(sections: Section[]): CoverageEntry[] {
  return sections.map((entry) => ({ id: entry.id, status: 'mapped' }));
}

function pagesUpTo(count: number): Page[] {
  return Array.from({ length: count }, (_, index) => ({ pdf_page: index + 1 }));
}

function sourceMap(overrides: Partial<SourceMap> = {}): SourceMap {
  const sections = overrides.sections ?? [section('section.combat')];
  return {
    sections,
    pages: pagesUpTo(1),
    coverage: coverageFor(sections),
    externalSourceIds: ['bestiary'],
    ...overrides,
  };
}

describe('reference checks', () => {
  it('passes when every reference resolves', () => {
    const sections = [
      section('section.combat', {
        see_also: ['section.equipment'],
        external_references: ['bestiary'],
      }),
      section('section.equipment', { parent: 'section.combat' }),
    ];
    expect(
      checkIntegrity(
        sourceMap({
          sections,
          coverage: coverageFor(sections),
          pages: [{ pdf_page: 1, section_id: 'section.combat' }],
        }),
      ),
    ).toEqual([]);
  });

  it('reports an unknown parent', () => {
    const sections = [section('section.combat', { parent: 'section.nowhere' })];
    const errors = checkIntegrity(sourceMap({ sections, coverage: coverageFor(sections) }));
    expect(errors).toContain(
      'sections.yaml: "section.combat" has unknown parent "section.nowhere"',
    );
  });

  it('reports an unknown see_also target', () => {
    const sections = [section('section.combat', { see_also: ['section.nowhere'] })];
    const errors = checkIntegrity(sourceMap({ sections, coverage: coverageFor(sections) }));
    expect(errors).toContain(
      'sections.yaml: "section.combat" see_also references unknown "section.nowhere"',
    );
  });

  it('reports a section that points at itself', () => {
    const sections = [section('section.combat', { see_also: ['section.combat'] })];
    const errors = checkIntegrity(sourceMap({ sections, coverage: coverageFor(sections) }));
    expect(errors).toContain('sections.yaml: "section.combat" see_also references itself');
  });

  it('reports an external source missing from the manifest', () => {
    const sections = [section('section.combat', { external_references: ['grimoire'] })];
    const errors = checkIntegrity(sourceMap({ sections, coverage: coverageFor(sections) }));
    expect(errors).toEqual([
      'sections.yaml: "section.combat" references external source "grimoire" that is not declared in source/manifest.yaml',
    ]);
  });

  it('reports a page pointing at a section that does not exist', () => {
    const errors = checkIntegrity(
      sourceMap({ pages: [{ pdf_page: 1, section_id: 'section.gone' }] }),
    );
    expect(errors).toEqual(['pages.yaml: pdf page 1 references unknown section "section.gone"']);
  });

  // An unresolved reference is free text by design, so it must never be treated as an id.
  it('ignores unresolved references', () => {
    const sections = [section('section.combat', { unresolved_references: ['see Appendix IX'] })];
    expect(checkIntegrity(sourceMap({ sections, coverage: coverageFor(sections) }))).toEqual([]);
  });
});

describe('parent cycles', () => {
  it('reports a cycle', () => {
    const sections = [
      section('section.a', { parent: 'section.b' }),
      section('section.b', { parent: 'section.a' }),
    ];
    const errors = checkIntegrity(sourceMap({ sections, coverage: coverageFor(sections) }));
    expect(errors.some((error) => error.startsWith('sections.yaml: parent cycle'))).toBe(true);
  });

  it('accepts a deep chain', () => {
    const sections = [
      section('section.a'),
      section('section.a.b', { parent: 'section.a' }),
      section('section.a.b.c', { parent: 'section.a.b' }),
    ];
    expect(checkIntegrity(sourceMap({ sections, coverage: coverageFor(sections) }))).toEqual([]);
  });
});

describe('coverage bijection', () => {
  it('reports a section with no coverage row', () => {
    const sections = [section('section.combat'), section('section.equipment')];
    const errors = checkIntegrity(
      sourceMap({ sections, coverage: [{ id: 'section.combat', status: 'mapped' }] }),
    );
    expect(errors).toEqual(['coverage.yaml: no entry for section "section.equipment"']);
  });

  it('reports a coverage row with no section', () => {
    const sections = [section('section.combat')];
    const errors = checkIntegrity(
      sourceMap({
        sections,
        coverage: [...coverageFor(sections), { id: 'section.ghost', status: 'mapped' }],
      }),
    );
    expect(errors).toEqual(['coverage.yaml: entry "section.ghost" has no matching section']);
  });
});

describe('page map', () => {
  it('reports a gap against the document page count', () => {
    const errors = checkIntegrity(
      sourceMap({ pages: [{ pdf_page: 1 }, { pdf_page: 3 }], documentPageCount: 3 }),
    );
    expect(errors).toEqual(['pages.yaml: missing entry for pdf page 2']);
  });

  it('reports a duplicate pdf page', () => {
    const errors = checkIntegrity(
      sourceMap({ pages: [{ pdf_page: 1 }, { pdf_page: 1 }], documentPageCount: 1 }),
    );
    expect(errors).toEqual(['pages.yaml: duplicate entry for pdf page 1']);
  });

  it('reports a page past the end of the document', () => {
    const errors = checkIntegrity(
      sourceMap({ pages: [{ pdf_page: 1 }, { pdf_page: 2 }], documentPageCount: 1 }),
    );
    expect(errors).toEqual(["pages.yaml: pdf page 2 is beyond the document's 1 pages"]);
  });
});

describe('page ranges', () => {
  it('reports a range that ends before it starts', () => {
    const sections = [
      section('section.combat', { printed_start_page: 120, printed_end_page: 107 }),
    ];
    const errors = checkIntegrity(sourceMap({ sections, coverage: coverageFor(sections) }));
    expect(errors).toEqual([
      'sections.yaml: "section.combat" has printed pages ending (107) before starting (120)',
    ]);
  });

  // Front matter has a null printed label but a real pdf range, so half-known pairs are fine.
  it('accepts a range whose printed start is unknown', () => {
    const sections = [
      section('section.front_matter', {
        printed_start_page: null,
        printed_end_page: 9,
        pdf_start_page: 1,
        pdf_end_page: 11,
      }),
    ];
    expect(checkIntegrity(sourceMap({ sections, coverage: coverageFor(sections) }))).toEqual([]);
  });
});
