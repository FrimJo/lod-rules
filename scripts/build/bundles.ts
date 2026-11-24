/**
 * The compiled corpus layout and its verified reader, shared by the build that writes bundles
 * and every consumer that reads them. Depends on nothing else in `scripts/build/`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Graph } from '../graph/types.ts';
import { sha256 } from '../validate/hash.ts';

export const CORPUS_DIR = 'generated/corpus';
export const CORPUS_FORMAT_VERSION = 1;
export const MANIFEST_FILE = 'manifest.json';
export const GRAPH_BUNDLE = 'graph.json';

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

/** One JSON file per record class: the records as authored plus where each came from. */
export interface Bundle {
  records: unknown[];
  /** Record key (`id`; `form` for aliases; `pdf_page` for pages) to repo-relative YAML path. */
  files: Record<string, string>;
}

/** The bundles of one corpus build, published or still in memory. */
export interface CorpusBundles {
  manifest: CorpusManifest;
  /** Parses one class bundle by file name, such as `rules.json`. */
  bundle<T>(file: string): Bundle & { records: T[] };
}

/** Bundle bytes that are missing from, or disagree with, the manifest that lists them. */
export class BundleMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BundleMismatchError';
  }
}

/** The records the manifest counts in a parsed bundle: a graph's nodes plus edges. */
export function recordCount(file: string, value: unknown): number {
  if (file !== GRAPH_BUNDLE) return (value as Bundle).records.length;
  const { nodes, edges } = value as Graph;
  return nodes.length + edges.length;
}

/**
 * Reads the bytes of every bundle `manifest` lists, up front, and checks each checksum, so the
 * result is one build's output even if the files are replaced afterwards. Bundles are parsed on
 * first use and their record count checked then. Throws {@link BundleMismatchError} on any
 * disagreement; errors from `read` (such as `ENOENT`) propagate.
 */
export function verifiedBundles(
  manifest: CorpusManifest,
  read: (file: string) => string | Buffer,
  files: string[] = Object.keys(manifest.bundles),
): CorpusBundles {
  const bytes = new Map<string, string | Buffer>();
  for (const file of files) {
    const checksum = manifest.bundles[file]?.sha256;
    if (checksum === undefined) throw new BundleMismatchError(`no corpus bundle named ${file}`);
    const content = read(file);
    if (sha256(content) !== checksum) throw new BundleMismatchError(`${file}: checksum mismatch`);
    bytes.set(file, content);
  }
  const parsed = new Map<string, unknown>();
  return {
    manifest,
    bundle<T>(file: string) {
      if (!parsed.has(file)) {
        const content = bytes.get(file);
        if (content === undefined) throw new BundleMismatchError(`no corpus bundle named ${file}`);
        const value: unknown = JSON.parse(content.toString());
        if (recordCount(file, value) !== manifest.bundles[file]?.records) {
          throw new BundleMismatchError(`${file}: record count mismatch`);
        }
        parsed.set(file, value);
      }
      return parsed.get(file) as Bundle & { records: T[] };
    },
  };
}

export const isMissing = (error: unknown): boolean =>
  (error as { code?: unknown }).code === 'ENOENT';

/** The manifest published in `dir`, or `undefined` when there is none or it is not JSON. */
export function readPublishedManifest(dir: string): CorpusManifest | undefined {
  try {
    return JSON.parse(readFileSync(join(dir, MANIFEST_FILE), 'utf8')) as CorpusManifest;
  } catch (error) {
    if (isMissing(error) || error instanceof SyntaxError) return undefined;
    throw error;
  }
}

/**
 * The bundles published in `dir` under `manifest` (all of them unless `files` names some), or
 * `undefined` when a file is missing or from another build: a build replaced the directory
 * while it was read.
 */
export function readPublishedBundles(
  dir: string,
  manifest: CorpusManifest,
  files?: string[],
): CorpusBundles | undefined {
  try {
    return verifiedBundles(manifest, (file) => readFileSync(join(dir, file)), files);
  } catch (error) {
    if (isMissing(error) || error instanceof BundleMismatchError) return undefined;
    throw error;
  }
}
