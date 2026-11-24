import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateCorpus } from '../../scripts/validate/corpus.ts';
import { copyCorpusInputs, type CorpusCopy } from '../support/corpus-copy.ts';

describe('validateCorpus on an injected root', () => {
  let copy: CorpusCopy;
  beforeEach(() => {
    copy = copyCorpusInputs();
  });
  afterEach(() => copy.dispose());

  it('passes on an unmodified copy of the corpus inputs', () => {
    expect(validateCorpus(copy.root).errors).toEqual([]);
  });

  it('names the file that violates its schema', () => {
    copy.edit('corpus/glossary/terms.yaml', (text) => text.replace('  name: Adjacent\n', ''));
    expect(validateCorpus(copy.root).errors).toContain(
      "corpus/glossary/terms.yaml: /0 must have required property 'name'",
    );
  });

  it('names the file that repeats an id', () => {
    copy.edit('corpus/glossary/terms.yaml', (text) =>
      text.replace('- id: term.action_points\n', '- id: term.adjacent\n'),
    );
    expect(validateCorpus(copy.root).errors).toContain(
      'corpus/glossary/terms.yaml: duplicate id "term.adjacent"',
    );
  });

  // Cross-file errors keep the validator's existing file labels (`sections.yaml`, `coverage.yaml`).
  it('names the section map when a see_also target does not exist', () => {
    copy.edit('corpus/source-map/sections.yaml', (text) =>
      text.replace('  see_also:\n', '  see_also:\n    - section.nowhere\n'),
    );
    expect(validateCorpus(copy.root).errors).toContainEqual(
      expect.stringMatching(
        /^sections\.yaml: ".+" see_also references unknown "section\.nowhere"$/,
      ),
    );
  });

  it('names the coverage file when a row has no section', () => {
    copy.edit('corpus/source-map/coverage.yaml', (text) =>
      text.replace('sections:\n', 'sections:\n  - id: section.nowhere\n    status: not_started\n'),
    );
    expect(validateCorpus(copy.root).errors).toContain(
      'coverage.yaml: entry "section.nowhere" has no matching section',
    );
  });

  it('names the file that is not valid YAML', () => {
    copy.edit('review/independent/alchemy-core.yaml', (text) => `${text}\n- id: [unclosed\n`);
    expect(validateCorpus(copy.root).errors).toContainEqual(
      expect.stringMatching(/^review\/independent\/alchemy-core\.yaml: YAML parse error: /),
    );
  });

  it('checks source documents under the injected root', () => {
    copy.remove('source/vonbraus-qrs-2.5.pdf');
    expect(validateCorpus(copy.root).errors).toContain(
      'source/manifest.yaml: document "vonbraus.qrs_2_5" references missing file source/vonbraus-qrs-2.5.pdf',
    );
  });
});
