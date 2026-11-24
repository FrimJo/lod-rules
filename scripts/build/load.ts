import { join } from 'node:path';
import { fingerprintInputs } from '../validate/canonical-files.ts';
import { repoRoot } from '../validate/schemas.ts';
import {
  CORPUS_DIR,
  CORPUS_FORMAT_VERSION,
  readPublishedBundles,
  readPublishedManifest,
  type CorpusBundles,
} from './bundles.ts';
import { compileCorpus, compiledBundles, publishCorpus } from './index.ts';

/** Reads of a published corpus that a concurrent build may replace before giving up on it. */
const READ_ATTEMPTS = 3;

/** The published bundles in `dir` if they were compiled from `fingerprint`, read consistently. */
function readFresh(dir: string, fingerprint: string): CorpusBundles | undefined {
  for (let attempt = 0; attempt < READ_ATTEMPTS; attempt += 1) {
    const manifest = readPublishedManifest(dir);
    if (
      manifest?.format_version !== CORPUS_FORMAT_VERSION ||
      manifest.input_fingerprint !== fingerprint
    ) {
      return undefined;
    }
    const bundles = readPublishedBundles(dir, manifest);
    if (bundles) return bundles;
    // A build replaced the directory mid-read; the next read sees one whole build.
  }
  return undefined;
}

/**
 * The compiled corpus of `root`. Published bundles are used only when they are this format
 * version, compiled from the current canonical YAML, and every file matches the manifest.
 * Otherwise the corpus is compiled and published first; `readOnly` compiles in memory instead
 * and writes nothing.
 */
export function loadCorpusBundles(
  root = repoRoot,
  { readOnly = false }: { readOnly?: boolean } = {},
): CorpusBundles {
  const dir = join(root, CORPUS_DIR);
  const published = readFresh(dir, fingerprintInputs(root));
  if (published) return published;
  const compiled = compileCorpus(root);
  if (!readOnly) publishCorpus(dir, compiled);
  return compiledBundles(compiled);
}
