import { describe, expect, it } from 'vitest';
import { createAjv, getValidator } from '../../scripts/validate/schemas.ts';
import {
  checkGlossaryIntegrity,
  type Glossary,
  type SourceMap,
} from '../../scripts/validate/integrity.ts';

const source = { document: 'rulebook', pdf_page: 1, printed_page: 99 };
const term = {
  id: 'term.action_points',
  name: 'Action Points',
  abbreviation: 'AP',
  kind: 'resource',
  definition: 'Action Points.',
  aliases: ['AP'],
  mechanically_significant: true,
  related: [],
  section_id: 'section.glossary',
  source: [source],
};
const map: SourceMap = {
  sections: [{ id: 'section.glossary', title: 'Glossary', kind: 'subsection' }],
  pages: [{ pdf_page: 1, printed_page: 99 }],
  coverage: [],
  externalSourceIds: [],
};
function fixture(): Glossary {
  return structuredClone({
    terms: [term],
    aliases: [
      { form: 'Action Points', term_id: term.id },
      { form: 'AP', term_id: term.id },
    ],
    issues: [
      {
        status: 'unresolved',
        id: 'issue.0001',
        related: [term.id, 'section.glossary'],
        source: [source],
      },
    ],
    documentIds: ['rulebook', 'bestiary'],
    canonicalDocumentId: 'rulebook',
  });
}
const ajv = createAjv();

describe('glossary and issue schemas', () => {
  it('accepts terms, aliases, and unresolved issues', () => {
    expect(getValidator(ajv, 'terms')([term])).toBe(true);
    expect(getValidator(ajv, 'aliases')(fixture().aliases)).toBe(true);
    expect(
      getValidator(
        ajv,
        'issues',
      )([
        { ...fixture().issues[0], type: 'ambiguity', summary: 'Uncertain.', status: 'unresolved' },
      ]),
    ).toBe(true);
  });
  it.each([
    { id: 'section.wrong' },
    { id: 'term.Bad' },
    { kind: 'abbreviation' },
    { source: [] },
    { source: [{}] },
    { definition: '' },
    { related: ['section.wrong'] },
    { section_id: 'term.wrong' },
    { invented: true },
  ])('rejects malformed term fields %j', (override) => {
    expect(getValidator(ajv, 'terms')([{ ...term, ...override }])).toBe(false);
  });
  it('rejects incomplete terms and invented issue resolutions', () => {
    expect(getValidator(ajv, 'terms')([{ id: term.id }])).toBe(false);
    expect(
      getValidator(
        ajv,
        'issues',
      )([{ ...fixture().issues[0], type: 'ambiguity', summary: 'Uncertain.', status: 'resolved' }]),
    ).toBe(false);
    expect(getValidator(ajv, 'aliases')([{ form: 'AP', term_id: 'section.glossary' }])).toBe(false);
  });
});

describe('glossary cross-file integrity', () => {
  it('uses the actual folio map, including non-offset folios', () => {
    expect(checkGlossaryIntegrity(fixture(), map)).toEqual([]);
  });
  it.each([
    ['duplicate form', (g: Glossary) => g.aliases.push({ form: 'ap', term_id: term.id })],
    [
      'conflicting alias',
      (g: Glossary) => g.terms.push({ ...term, id: 'term.other', name: 'Other' }),
    ],
    ['unknown related', (g: Glossary) => g.terms[0]!.related.push('term.missing')],
    ['unknown related', (g: Glossary) => g.issues[0]!.related.push('term.missing')],
    ['term mismatch', (g: Glossary) => g.aliases.push({ form: 'Invented', term_id: term.id })],
    [
      'term mismatch',
      (g: Glossary) => {
        g.aliases[0]!.term_id = 'term.missing';
      },
    ],
    ['missing form', (g: Glossary) => g.aliases.pop()],
    [
      'abbreviation missing',
      (g: Glossary) => {
        g.terms[0]!.aliases = [];
      },
    ],
    [
      'unknown section',
      (g: Glossary) => {
        g.terms[0]!.section_id = 'section.missing';
      },
    ],
    [
      'unknown document',
      (g: Glossary) => {
        g.issues[0]!.source[0]!.document = 'missing';
      },
    ],
    [
      'unknown pdf page',
      (g: Glossary) => {
        g.terms[0]!.source[0]!.pdf_page = 2;
      },
    ],
    [
      'page mismatch',
      (g: Glossary) => {
        g.terms[0]!.source[0]!.printed_page = 1;
      },
    ],
    ['duplicate id', (g: Glossary) => g.terms.push(g.terms[0]!)],
    ['duplicate id', (g: Glossary) => g.issues.push(g.issues[0]!)],
  ])('reports %s', (message, mutate) => {
    const glossary = fixture();
    mutate(glossary);
    expect(checkGlossaryIntegrity(glossary, map).some((error) => error.includes(message))).toBe(
      true,
    );
  });
  it('does not use the rulebook page map for external books', () => {
    const glossary = fixture();
    glossary.issues[0]!.source = [{ document: 'bestiary', pdf_page: 900, printed_page: 899 }];
    expect(checkGlossaryIntegrity(glossary, map)).toEqual([]);
  });
  it('preserves punctuation while ignoring case', () => {
    const glossary = fixture();
    glossary.aliases[1]!.form = 'ap';
    glossary.terms.push({
      ...term,
      id: 'term.armour_piercing',
      name: 'Armour Piercing',
      abbreviation: 'AP(X)',
      aliases: ['AP(X)'],
    });
    glossary.aliases.push(
      { form: 'Armour Piercing', term_id: 'term.armour_piercing' },
      { form: 'AP(X)', term_id: 'term.armour_piercing' },
    );
    expect(checkGlossaryIntegrity(glossary, map)).toEqual([]);
  });
});
