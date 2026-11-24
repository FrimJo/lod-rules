import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { copyCorpusInputs, type CorpusCopy } from '../../../tests/support/corpus-copy.ts';
import { LiveRetrieval } from '../src/corpus.ts';

/** An unresolved issue that relates to no reviewed record, so adding it keeps the corpus valid. */
const addedIssue = `- id: issue.test.live_retrieval
  type: rulebook_undefined
  summary: Added by the live retrieval test.
  related: []
  source:
    - document: rulebook.second_printing.eng
      file: source/Rulebook-2nd-printing-ENGa.pdf
      pdf_page: 16
      printed_page: 14
      extraction:
        method: text
        confidence: high
  status: unresolved
`;

describe('LiveRetrieval', () => {
  let copy: CorpusCopy;
  let live: LiveRetrieval | undefined;

  beforeEach(() => {
    copy = copyCorpusInputs();
  });
  afterEach(() => {
    live?.close();
    copy.dispose();
  });

  it('indexes a corpus without a build in memory and writes nothing', () => {
    live = new LiveRetrieval(copy.root);
    assert.equal(live.source, 'memory');
    assert.ok(live.current().get('term.adjacent'));
    assert.equal(existsSync(join(copy.root, 'generated')), false);
  });

  it('follows valid edits and keeps the last valid corpus while an edit is invalid', () => {
    live = new LiveRetrieval(copy.root, { checkIntervalMs: 0 });
    copy.edit('review/ambiguities.yaml', (text) => text + addedIssue);
    assert.ok(live.current().get('issue.test.live_retrieval'));

    copy.edit('corpus/glossary/terms.yaml', (text) => text.replace('  name: Adjacent\n', ''));
    assert.ok(live.current().get('issue.test.live_retrieval'));
    assert.ok(live.current().get('term.adjacent'));
    assert.equal(existsSync(join(copy.root, 'generated')), false);
  });
});
