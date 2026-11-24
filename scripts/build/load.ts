import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fingerprintInputs } from '../validate/canonical-files.ts';
import { repoRoot } from '../validate/schemas.ts';
import {
  buildCorpus,
  compileCorpus,
  compiledBundles,
  CORPUS_DIR,
  CORPUS_FORMAT_VERSION,
  type Bundle,
  type CorpusBundles,
  type CorpusManifest,
} from './index.ts';

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
  if (readOnly && !fresh) return compiledBundles(compileCorpus(root));
  return {
    manifest: fresh ? published : buildCorpus({ root, outDir: dir }),
    bundle: <T>(file: string) =>
      JSON.parse(readFileSync(join(dir, file), 'utf8')) as Bundle & { records: T[] },
  };
}
