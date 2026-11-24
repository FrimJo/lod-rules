import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import {
  CORPUS_DIR,
  CORPUS_FORMAT_VERSION,
  GRAPH_BUNDLE,
  isMissing,
  MANIFEST_FILE,
  readPublishedBundles,
  readPublishedManifest,
  recordCount,
  verifiedBundles,
  type Bundle,
  type CorpusBundles,
  type CorpusManifest,
} from './bundles.ts';
import { compileGraphBundle } from './graph-bundle.ts';
import { fingerprintFiles, type CanonicalFile } from '../validate/canonical-files.ts';
import { validateCorpus } from '../validate/corpus.ts';
import { fileSha256, sha256 } from '../validate/hash.ts';
import { repoRoot, type SchemaName } from '../validate/schemas.ts';

/**
 * Checked-in evidence that is not canonical corpus content. Listed so every input is accounted
 * for; a test checks each path still exists.
 */
const excluded: CorpusManifest['excluded'] = [
  {
    path: 'tests/fixtures/acceptance',
    reason: 'phase exit checklists: acceptance evidence about the corpus, not rulebook content',
  },
  {
    path: 'tests/fixtures/example-inventory.json',
    reason: 'Phase 8 example inventory: a test oracle over the corpus, not rulebook content',
  },
];

interface BundleSpec {
  file: string;
  schema: SchemaName;
  /** The records one file of this class holds. */
  records(data: unknown): unknown[];
  key(record: unknown): string;
}

/** The file is a YAML list of records. */
const wholeFile = (data: unknown): unknown[] => (data as unknown[] | null) ?? [];
/** The records are the list under one top-level key of the file. */
const listUnder =
  (key: string) =>
  (data: unknown): unknown[] =>
    wholeFile((data as Record<string, unknown>)[key]);
const byId = (record: unknown): string => (record as { id: string }).id;
/** The common case: files of `schema` are lists of records keyed by `id`. */
const idListBundle = (file: string, schema: SchemaName): BundleSpec => ({
  file,
  schema,
  records: wholeFile,
  key: byId,
});

/**
 * Every bundle the build writes. Records keep source order: files in path order, then the
 * order within each file. Every class is authored in deliberate order (the source map in book
 * order, pages by PDF page, multi-file classes grouped by chapter), so no bundle re-sorts by id.
 * `source/manifest.yaml` holds two record classes and yields two bundles.
 */
const specs: BundleSpec[] = [
  { file: 'source-documents.json', schema: 'manifest', records: listUnder('documents'), key: byId },
  {
    file: 'external-sources.json',
    schema: 'manifest',
    records: listUnder('external_sources'),
    key: byId,
  },
  idListBundle('terms.json', 'terms'),
  // Alias forms are unique (case-insensitively) by the glossary integrity check.
  {
    file: 'aliases.json',
    schema: 'aliases',
    records: wholeFile,
    key: (record) => (record as { form: string }).form,
  },
  idListBundle('sections.json', 'sections'),
  {
    file: 'pages.json',
    schema: 'pages',
    records: wholeFile,
    key: (record) => String((record as { pdf_page: number }).pdf_page),
  },
  { file: 'coverage.json', schema: 'coverage', records: listUnder('sections'), key: byId },
  idListBundle('rules.json', 'rules'),
  idListBundle('entities.json', 'entities'),
  idListBundle('tables.json', 'tables'),
  idListBundle('procedures.json', 'procedures'),
  idListBundle('state-machines.json', 'stateMachines'),
  idListBundle('edges.json', 'edges'),
  idListBundle('issues.json', 'issues'),
  idListBundle('independent-reviews.json', 'independentReviews'),
  idListBundle('test-cases.json', 'testCases'),
];

function compileBundle(spec: BundleSpec, files: CanonicalFile[]): Bundle {
  const bundle: Bundle = { records: [], files: {} };
  for (const file of files.filter((candidate) => candidate.schema === spec.schema)) {
    for (const record of spec.records(file.data)) {
      const key = spec.key(record);
      // Validation guarantees unique keys; a repeat here would silently lose provenance.
      if (key in bundle.files) throw new Error(`${spec.file}: duplicate record key "${key}"`);
      bundle.records.push(record);
      bundle.files[key] = file.path;
    }
  }
  return bundle;
}

const json = (value: unknown): string => JSON.stringify(value, null, 2) + '\n';

function sourceDocuments(files: CanonicalFile[], root: string): CorpusManifest['sources'] {
  const manifest = files.find((file) => file.schema === 'manifest');
  const documents = (manifest?.data as { documents: Array<{ id: string; file: string }> })
    .documents;
  return documents.map(({ id, file }) => {
    const path = `source/${file}`;
    return { id, file: path, sha256: fileSha256(join(root, path)) };
  });
}

/** Thrown when the corpus is invalid. `errors` holds every validation message. */
export class CorpusBuildError extends Error {
  constructor(readonly errors: string[]) {
    super(
      `Corpus build failed with ${errors.length} error(s):\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
    this.name = 'CorpusBuildError';
  }
}

/** Serialised bundles by file name, plus the manifest that describes them. */
export interface Compiled {
  outputs: Map<string, string>;
  manifest: CorpusManifest;
}

/** Reads bundles straight from compiled output, before (or instead of) publishing it. */
export function compiledBundles({ outputs, manifest }: Compiled): CorpusBundles {
  return verifiedBundles(manifest, (file) => outputs.get(file) ?? '');
}

function compile(files: CanonicalFile[], root: string): Compiled {
  const manifest: CorpusManifest = {
    format_version: CORPUS_FORMAT_VERSION,
    input_fingerprint: fingerprintFiles(files),
    inputs: Object.fromEntries(files.map(({ path, bytes }) => [path, sha256(bytes)])),
    sources: sourceDocuments(files, root),
    bundles: {},
    excluded,
  };
  const outputs = new Map<string, string>();
  const emit = (file: string, value: unknown): void => {
    const text = json(value);
    outputs.set(file, text);
    manifest.bundles[file] = { records: recordCount(file, value), sha256: sha256(text) };
  };
  for (const spec of specs) emit(spec.file, compileBundle(spec, files));
  // Derived from the class bundles just compiled, through the model retrieval loads them into.
  emit(GRAPH_BUNDLE, compileGraphBundle(compiledBundles({ outputs, manifest })));
  return { outputs, manifest };
}

/** Re-reads what was staged and checks it against the manifest before anything is published. */
function verifyStaged(staging: string, { outputs, manifest }: Compiled): void {
  const expected = [...outputs.keys(), MANIFEST_FILE].sort();
  const staged = readdirSync(staging).sort();
  if (staged.join('\n') !== expected.join('\n')) {
    throw new Error(`staged files ${staged.join(', ')} differ from ${expected.join(', ')}`);
  }
  if (readFileSync(join(staging, MANIFEST_FILE), 'utf8') !== json(manifest)) {
    throw new Error(`staged ${MANIFEST_FILE} differs from the manifest`);
  }
  const bundles = verifiedBundles(manifest, (file) => readFileSync(join(staging, file)));
  // Parsing checks each record count.
  for (const file of outputs.keys()) bundles.bundle(file);
}

/** Whether `outDir` already holds exactly this build, every bundle intact. */
function isPublished(outDir: string, { manifest }: Compiled): boolean {
  const published = readPublishedManifest(outDir);
  return (
    published !== undefined &&
    json(published) === json(manifest) &&
    readPublishedBundles(outDir, manifest) !== undefined
  );
}

/**
 * Writes into a sibling staging directory, verifies it, then renames it into place. On any
 * failure the staging directory is removed and the previous output stays as it was.
 *
 * A directory cannot be renamed over a non-empty one, so the swap is two renames and `outDir`
 * is absent between them. Readers cope: they read every bundle up front and check it against
 * the manifest, retrying or compiling in memory when a file is missing or from another build.
 * To keep that window rare, a build that is already published intact is left in place.
 * Concurrent builds each stage under a unique name; the loser of the swap accepts the winner's
 * output when it is identical.
 */
export function publishCorpus(outDir: string, compiled: Compiled): void {
  if (isPublished(outDir, compiled)) return;
  mkdirSync(dirname(outDir), { recursive: true });
  const staging = mkdtempSync(`${outDir}.staging-`);
  const previous = `${staging}.previous`;
  try {
    for (const [file, text] of compiled.outputs) writeFileSync(join(staging, file), text);
    writeFileSync(join(staging, MANIFEST_FILE), json(compiled.manifest));
    verifyStaged(staging, compiled);

    let moved = false;
    try {
      renameSync(outDir, previous);
      moved = true;
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
    try {
      renameSync(staging, outDir);
    } catch (error) {
      // Builds are deterministic: an identical manifest means identical bundles.
      if (isPublished(outDir, compiled)) return;
      if (moved && !existsSync(outDir)) renameSync(previous, outDir);
      throw error;
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
    rmSync(previous, { recursive: true, force: true });
  }
}

/**
 * Compiles the canonical corpus under `root` in memory, exactly as {@link buildCorpus} would
 * publish it. Runs the full validator first: if it reports anything, throws a
 * {@link CorpusBuildError} listing every message.
 */
export function compileCorpus(root = repoRoot): Compiled {
  // The validator already parsed every input; compiling from its files reads the corpus once.
  const { errors, files } = validateCorpus(root);
  if (errors.length > 0) throw new CorpusBuildError(errors);
  return compile(files, root);
}

/**
 * Compiles the canonical corpus under `root` into JSON bundles in `outDir` and returns the
 * manifest. On a validation error it throws {@link CorpusBuildError} and writes nothing.
 */
export function buildCorpus({
  root = repoRoot,
  outDir = join(root, CORPUS_DIR),
}: { root?: string; outDir?: string } = {}): CorpusManifest {
  const compiled = compileCorpus(root);
  publishCorpus(outDir, compiled);
  return compiled.manifest;
}
