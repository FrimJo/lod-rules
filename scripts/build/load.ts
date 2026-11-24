import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fingerprintInputs } from '../validate/canonical-files.ts';
import { repoRoot } from '../validate/schemas.ts';
import {
  buildCorpus,
  compileCorpus,
  CORPUS_DIR,
  CORPUS_FORMAT_VERSION,
  type Bundle,
  type CorpusManifest,
} from './index.ts';

/** The published bundles of one corpus build. */
export interface CorpusBundles {
  manifest: CorpusManifest;
  /** Reads one bundle by file name, such as `rules.json`. */
  bundle<T>(file: string): Bundle & { records: T[] };
}

function readManifest(dir: string): CorpusManifest | null {
  const path = join(dir, 'manifest.json');
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as CorpusManifest) : null;
}

/**
 * The compiled corpus of `root`. When the published bundles are missing, from another format
 * version, or compiled from inputs other than the current canonical YAML, it builds and
 * publishes them first; `readOnly` compiles in memory instead and writes nothing.
 */
export function loadCorpusBundles(
  root = repoRoot,
  { readOnly = false }: { readOnly?: boolean } = {},
): CorpusBundles {
  const dir = join(root, CORPUS_DIR);
  const published = readManifest(dir);
  const fresh =
    published?.format_version === CORPUS_FORMAT_VERSION &&
    published.input_fingerprint === fingerprintInputs(root);

  let manifest: CorpusManifest;
  let text: (file: string) => string;
  if (fresh || !readOnly) {
    manifest = fresh ? published : buildCorpus({ root, outDir: dir });
    text = (file) => readFileSync(join(dir, file), 'utf8');
  } else {
    const compiled = compileCorpus(root);
    manifest = compiled.manifest;
    text = (file) => {
      const output = compiled.outputs.get(file);
      if (output === undefined) throw new Error(`no corpus bundle named ${file}`);
      return output;
    };
  }
  return {
    manifest,
    bundle: <T>(file: string) => JSON.parse(text(file)) as Bundle & { records: T[] },
  };
}
