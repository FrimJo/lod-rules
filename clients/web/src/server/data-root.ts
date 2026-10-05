import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot } from '../../../../scripts/validate/schemas.ts';

/** Directory name of the data bundle inside a production server build. */
export const DATA_DIR = 'lod-data';
/** Marker file `bundleData()` writes at the root of every data bundle. */
export const DATA_MARKER = 'bundle.json';

/** The nearest `lod-data/` with a marker above this module, as laid out by the server build. */
function findBundle(): string | null {
  for (let dir = dirname(fileURLToPath(import.meta.url)); ;) {
    const candidate = join(dir, DATA_DIR);
    if (existsSync(join(candidate, DATA_MARKER))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const bundle = process.env.LOD_DATA_DIR?.trim() || findBundle();

/**
 * Whether the server reads a data bundle (see build/bundle-data.ts) rather than the repo
 * checkout. A bundle carries the prebuilt retrieval database but not the corpus.
 */
export const bundled = Boolean(bundle);

/**
 * Root that `source/`, `corpus/source-map/` and `generated/retrieval/` resolve against: the
 * data bundle shipped with the server (or `LOD_DATA_DIR`), else the repo checkout in dev.
 */
export const dataRoot = bundle || repoRoot;
