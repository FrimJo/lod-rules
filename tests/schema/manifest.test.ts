import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { createAjv, getValidator, repoRoot } from '../../scripts/validate/schemas.ts';

const validate = getValidator(createAjv(), 'manifest');

const validDocument = {
  id: 'rulebook.second_printing.eng',
  title: 'League of Dungeoneers Rulebook',
  edition: 'second_printing',
  language: 'eng',
  file: 'Rulebook-2nd-printing-ENGa.pdf',
  canonical: true,
};

describe('manifest schema', () => {
  it('accepts the committed manifest', () => {
    const manifest = parse(readFileSync(join(repoRoot, 'source', 'manifest.yaml'), 'utf8'));
    expect(validate(manifest)).toBe(true);
  });

  it('requires at least one document', () => {
    expect(validate({ documents: [] })).toBe(false);
  });

  it('requires a file path on every document', () => {
    const { file: _file, ...withoutFile } = validDocument;
    expect(validate({ documents: [withoutFile] })).toBe(false);
  });

  it('records external sources as absent rather than omitting them', () => {
    expect(
      validate({
        documents: [validDocument],
        external_sources: [{ id: 'bestiary', status: 'not_present' }],
      }),
    ).toBe(true);
  });

  it('rejects an unknown external source status', () => {
    expect(
      validate({
        documents: [validDocument],
        external_sources: [{ id: 'bestiary', status: 'unknown' }],
      }),
    ).toBe(false);
  });
});
