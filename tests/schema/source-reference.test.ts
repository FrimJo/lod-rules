import { describe, expect, it } from 'vitest';
import { createAjv, getValidator } from '../../scripts/validate/schemas.ts';

const validate = getValidator(createAjv(), 'sourceReference');

describe('source-reference schema', () => {
  it('accepts the full reference shape from the corpus plan', () => {
    expect(
      validate({
        document: 'rulebook.second_printing.eng',
        file: 'source/Rulebook-2nd-printing-ENGa.pdf',
        printed_page: 18,
        pdf_page: null,
        section: 'Game Basics',
        heading: 'Turn Sequence',
        locator: { paragraph: null, table: null, row: null },
        extraction: { method: 'text', confidence: 1.0, visually_verified: false },
      }),
    ).toBe(true);
  });

  it('accepts a reference carrying only the document id', () => {
    expect(validate({ document: 'rulebook.second_printing.eng' })).toBe(true);
  });

  it('accepts a named confidence level', () => {
    expect(
      validate({
        document: 'rulebook.second_printing.eng',
        extraction: { method: 'table', confidence: 'medium', visually_verified: true },
      }),
    ).toBe(true);
  });

  it('rejects a reference without a document', () => {
    expect(validate({ printed_page: 18 })).toBe(false);
  });

  it('rejects a document id that is not a canonical identifier', () => {
    expect(validate({ document: 'Rulebook 2nd Printing' })).toBe(false);
  });

  it('rejects an unknown extraction method', () => {
    expect(
      validate({
        document: 'rulebook.second_printing.eng',
        extraction: { method: 'guess' },
      }),
    ).toBe(false);
  });
});
