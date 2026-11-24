import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CORPUS_DIR, type CorpusManifest } from '../../scripts/build/index.ts';
import { buildRetrievalArtifacts, freshDatabasePath } from '../../scripts/retrieve/build.ts';
import { loadRetrievalCorpus } from '../../scripts/retrieve/load.ts';
import { fingerprintInputs } from '../../scripts/validate/canonical-files.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';
import { copyCorpusInputs, type CorpusCopy } from '../support/corpus-copy.ts';

function corpusManifest(root: string): CorpusManifest {
  return JSON.parse(
    readFileSync(join(root, CORPUS_DIR, 'manifest.json'), 'utf8'),
  ) as CorpusManifest;
}

/** An unresolved issue that relates to no reviewed record, so adding it keeps the corpus valid. */
const addedIssue = `- id: issue.test.bundle_freshness
  type: rulebook_undefined
  summary: Added by the bundle freshness test.
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

const hasIssue = (root: string, id: string): boolean =>
  loadRetrievalCorpus(root).issues.some((issue) => issue.id === id);

describe('retrieval over the compiled corpus', () => {
  let copy: CorpusCopy;

  beforeEach(() => {
    copy = copyCorpusInputs();
  });
  afterEach(() => copy.dispose());

  it('builds the corpus bundles when they are missing', () => {
    expect(existsSync(join(copy.root, CORPUS_DIR))).toBe(false);
    const corpus = loadRetrievalCorpus(copy.root);
    const manifest = corpusManifest(copy.root);
    expect(corpus.fingerprint).toBe(manifest.input_fingerprint);
    expect(fingerprintInputs(copy.root)).toBe(manifest.input_fingerprint);
  }, 60_000);

  it('compiles a missing corpus in memory, writing nothing, when read-only', () => {
    const corpus = loadRetrievalCorpus(copy.root, { readOnly: true });
    expect(existsSync(join(copy.root, 'generated'))).toBe(false);
    expect(corpus.fingerprint).toBe(fingerprintInputs(copy.root));
    expect(corpus.pilot.rules.length).toBeGreaterThan(0);
  }, 60_000);

  it('survives concurrent loaders building the same stale corpus', async () => {
    const tsx = join(repoRoot, 'node_modules/.bin/tsx');
    const loader = join(repoRoot, 'scripts/retrieve/load.ts');
    const script = `import { loadRetrievalCorpus } from ${JSON.stringify(loader)};
      loadRetrievalCorpus(${JSON.stringify(copy.root)});`;
    const run = () => promisify(execFile)(tsx, ['--eval', script]);
    await Promise.all([run(), run(), run()]);
    expect(corpusManifest(copy.root).input_fingerprint).toBe(fingerprintInputs(copy.root));
    expect(readdirSync(join(copy.root, 'generated'))).toEqual(['corpus']);
  }, 120_000);
});

// One copy through a build, an edit and a rebuild. Separate steps keep each synchronous build
// short enough for the vitest worker to stay responsive.
describe('an input change', () => {
  let copy: CorpusCopy;
  let built: string;

  beforeAll(() => {
    copy = copyCorpusInputs();
  });
  afterAll(() => copy.dispose());

  it('starts from a fresh retrieval index built from the corpus bundles', () => {
    built = buildRetrievalArtifacts(copy.root).input_fingerprint;
    expect(built).toBe(corpusManifest(copy.root).input_fingerprint);
    expect(freshDatabasePath(copy.root)).not.toBeNull();
  }, 60_000);

  it('makes the retrieval index stale', () => {
    copy.edit('review/ambiguities.yaml', (text) => text + addedIssue);
    expect(freshDatabasePath(copy.root)).toBeNull();
  });

  it('rebuilds the stale bundles when retrieval loads', () => {
    expect(hasIssue(copy.root, 'issue.test.bundle_freshness')).toBe(true);
    expect(corpusManifest(copy.root).input_fingerprint).toBe(fingerprintInputs(copy.root));
    expect(corpusManifest(copy.root).input_fingerprint).not.toBe(built);
  }, 60_000);

  it('gives a fresh retrieval index again once rebuilt', () => {
    expect(buildRetrievalArtifacts(copy.root).input_fingerprint).toBe(fingerprintInputs(copy.root));
    expect(freshDatabasePath(copy.root)).not.toBeNull();
  }, 60_000);
});
