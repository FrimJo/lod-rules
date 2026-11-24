import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { compileGraphBundle, GRAPH_BUNDLE, graphRecords } from './graph-bundle.ts';
import { fingerprintFiles, type CanonicalFile } from '../validate/canonical-files.ts';
import { validateCorpus } from '../validate/corpus.ts';
import { repoRoot, type SchemaName } from '../validate/schemas.ts';

export { readGraphBundle, type GraphBundle } from './graph-bundle.ts';

export const CORPUS_DIR = 'generated/corpus';
export const CORPUS_FORMAT_VERSION = 1;

/**
 * `manifest.json`. Paths are repo-relative POSIX paths; nothing depends on the machine or the
 * time of the build, so identical inputs give identical bytes.
 */
export interface CorpusManifest {
  /** Bumped on any breaking change to the bundle layout or this manifest. */
  format_version: number;
  /** SHA-256 over every input path and its bytes, in path order (as the retrieval loader). */
  input_fingerprint: string;
  /** Canonical YAML input path to the SHA-256 of its bytes, in path order. */
  inputs: Record<string, string>;
  /** Source documents from `source/manifest.yaml`, in manifest order. */
  sources: Array<{ id: string; file: string; sha256: string }>;
  /** Bundle file to its record count and the SHA-256 of its bytes. */
  bundles: Record<string, { records: number; sha256: string }>;
  /** Review evidence that is deliberately not compiled. */
  excluded: Array<{ path: string; reason: string }>;
}

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

/** One JSON file per record class: the records as authored plus where each came from. */
interface Bundle {
  records: unknown[];
  /** Record key (`id`; `form` for aliases; `pdf_page` for pages) to repo-relative YAML path. */
  files: Record<string, string>;
}

interface BundleSpec {
  file: string;
  schema: SchemaName;
  /** The records one file of this class holds. */
  records(data: unknown): unknown[];
  key(record: unknown): string;
}

const list = (data: unknown): unknown[] => (data as unknown[] | null) ?? [];
const field =
  (name: string) =>
  (data: unknown): unknown[] =>
    list((data as Record<string, unknown>)[name]);
const byId = (record: unknown): string => (record as { id: string }).id;
const plain = (file: string, schema: SchemaName): BundleSpec => ({
  file,
  schema,
  records: list,
  key: byId,
});

/**
 * Every bundle the build writes. Records keep source order: files in path order, then the
 * order within each file. Every class is authored in deliberate order (the source map in book
 * order, pages by PDF page, multi-file classes grouped by chapter), so no bundle re-sorts by id.
 * `source/manifest.yaml` holds two record classes and yields two bundles.
 */
const specs: BundleSpec[] = [
  { file: 'source-documents.json', schema: 'manifest', records: field('documents'), key: byId },
  {
    file: 'external-sources.json',
    schema: 'manifest',
    records: field('external_sources'),
    key: byId,
  },
  plain('terms.json', 'terms'),
  // Alias forms are unique (case-insensitively) by the glossary integrity check.
  {
    file: 'aliases.json',
    schema: 'aliases',
    records: list,
    key: (record) => (record as { form: string }).form,
  },
  plain('sections.json', 'sections'),
  {
    file: 'pages.json',
    schema: 'pages',
    records: list,
    key: (record) => String((record as { pdf_page: number }).pdf_page),
  },
  { file: 'coverage.json', schema: 'coverage', records: field('sections'), key: byId },
  plain('rules.json', 'rules'),
  plain('entities.json', 'entities'),
  plain('tables.json', 'tables'),
  plain('procedures.json', 'procedures'),
  plain('state-machines.json', 'stateMachines'),
  plain('edges.json', 'edges'),
  plain('issues.json', 'issues'),
  plain('independent-reviews.json', 'independentReviews'),
  plain('test-cases.json', 'testCases'),
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

const MANIFEST_FILE = 'manifest.json';
const json = (value: unknown): string => JSON.stringify(value, null, 2) + '\n';
const sha256 = (bytes: string | Buffer): string => createHash('sha256').update(bytes).digest('hex');

function sourceDocuments(files: CanonicalFile[], root: string): CorpusManifest['sources'] {
  const manifest = files.find((file) => file.schema === 'manifest');
  const documents = (manifest?.data as { documents: Array<{ id: string; file: string }> })
    .documents;
  return documents.map(({ id, file }) => {
    const path = `source/${file}`;
    return { id, file: path, sha256: sha256(readFileSync(join(root, path))) };
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

/** A serialised bundle and how to count the records in its parsed value. */
interface Output {
  text: string;
  recordsIn(value: unknown): number;
}

/** Bundle file name to its output, plus the manifest that describes them. */
interface Compiled {
  outputs: Map<string, Output>;
  manifest: CorpusManifest;
}

const bundleRecords = (value: unknown): number => (value as Bundle).records.length;

function compile(files: CanonicalFile[], root: string): Compiled {
  const manifest: CorpusManifest = {
    format_version: CORPUS_FORMAT_VERSION,
    input_fingerprint: fingerprintFiles(files),
    inputs: Object.fromEntries(files.map(({ path, bytes }) => [path, sha256(bytes)])),
    sources: sourceDocuments(files, root),
    bundles: {},
    excluded,
  };
  const outputs = new Map<string, Output>();
  const emit = (file: string, value: unknown, recordsIn: Output['recordsIn']): void => {
    const text = json(value);
    outputs.set(file, { text, recordsIn });
    manifest.bundles[file] = { records: recordsIn(value), sha256: sha256(text) };
  };
  for (const spec of specs) emit(spec.file, compileBundle(spec, files), bundleRecords);
  emit(GRAPH_BUNDLE, compileGraphBundle(files), graphRecords);
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
  for (const [file, { records, sha256: checksum }] of Object.entries(manifest.bundles)) {
    const bytes = readFileSync(join(staging, file));
    if (sha256(bytes) !== checksum) throw new Error(`staged ${file}: checksum mismatch`);
    const value: unknown = JSON.parse(bytes.toString('utf8'));
    if (outputs.get(file)?.recordsIn(value) !== records) {
      throw new Error(`staged ${file}: record count mismatch`);
    }
  }
}

/**
 * Writes into a sibling staging directory, verifies it, then swaps it in. On any failure the
 * staging directory is removed and the previous output stays as it was.
 */
function publish(outDir: string, compiled: Compiled): void {
  const staging = `${outDir}.staging`;
  const previous = `${outDir}.previous`;
  rmSync(staging, { recursive: true, force: true });
  rmSync(previous, { recursive: true, force: true });
  try {
    mkdirSync(staging, { recursive: true });
    for (const [file, { text }] of compiled.outputs) writeFileSync(join(staging, file), text);
    writeFileSync(join(staging, MANIFEST_FILE), json(compiled.manifest));
    verifyStaged(staging, compiled);

    const hadOutput = existsSync(outDir);
    if (hadOutput) renameSync(outDir, previous);
    try {
      renameSync(staging, outDir);
    } catch (error) {
      if (hadOutput) renameSync(previous, outDir);
      throw error;
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
    rmSync(previous, { recursive: true, force: true });
  }
}

/**
 * Compiles the canonical corpus under `root` into JSON bundles in `outDir` and returns the
 * manifest. Runs the full validator first: if it reports anything, throws a
 * {@link CorpusBuildError} listing every message and writes nothing.
 */
export function buildCorpus({
  root = repoRoot,
  outDir = join(root, CORPUS_DIR),
}: { root?: string; outDir?: string } = {}): CorpusManifest {
  // The validator already parsed every input; compiling from its files reads the corpus once.
  const { errors, files } = validateCorpus(root);
  if (errors.length > 0) throw new CorpusBuildError(errors);
  const compiled = compile(files, root);
  publish(outDir, compiled);
  return compiled.manifest;
}
