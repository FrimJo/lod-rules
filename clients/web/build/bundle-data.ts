/**
 * Writes the data a production server reads into one directory, laid out like the repo so
 * server code only swaps `repoRoot` for `dataRoot` (src/server/data-root.ts):
 *
 * - generated/retrieval/  the SQLite index, rebuilt first if the corpus changed
 * - source/               manifest.yaml and the documents it lists (rulebook, rulings)
 * - corpus/source-map/    pages.yaml and sections.yaml for the rulebook viewer
 * - pdf-fonts/            pdf.js standard fonts
 * - bundle.json           the marker data-root.ts looks for
 *
 * It reads `corpus/` and `source/` and never writes to them. The Nitro build calls it for the
 * server output (vite.config.ts); `npm run bundle [dir]` runs it on its own.
 */
import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import {
  RETRIEVAL_DIR,
  buildRetrievalArtifacts,
  freshDatabasePath,
  type RetrievalManifest,
} from '../../../scripts/retrieve/build.ts';
import { repoRoot } from '../../../scripts/validate/schemas.ts';
import { DATA_MARKER } from '../src/server/data-root.ts';

const SOURCE_MAP_FILES = ['corpus/source-map/pages.yaml', 'corpus/source-map/sections.yaml'];

function copy(path: string, outDir: string): void {
  mkdirSync(dirname(join(outDir, path)), { recursive: true });
  copyFileSync(join(repoRoot, path), join(outDir, path));
}

export function bundleData(outDir: string): RetrievalManifest {
  if (!freshDatabasePath()) buildRetrievalArtifacts();
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, RETRIEVAL_DIR, 'manifest.json'), 'utf8'),
  ) as RetrievalManifest;

  rmSync(outDir, { recursive: true, force: true });
  copy(join(RETRIEVAL_DIR, 'retrieval.sqlite'), outDir);
  copy(join(RETRIEVAL_DIR, 'manifest.json'), outDir);

  copy('source/manifest.yaml', outDir);
  const sources = parse(readFileSync(join(repoRoot, 'source/manifest.yaml'), 'utf8')) as {
    documents: Array<{ file: string }>;
  };
  for (const { file } of sources.documents) copy(join('source', file), outDir);

  for (const path of SOURCE_MAP_FILES) copy(path, outDir);

  const pdfjs = dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'));
  cpSync(join(pdfjs, 'standard_fonts'), join(outDir, 'pdf-fonts'), { recursive: true });

  writeFileSync(
    join(outDir, DATA_MARKER),
    JSON.stringify(
      {
        input_fingerprint: manifest.input_fingerprint,
        documents: manifest.documents,
        commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        built_at: new Date().toISOString(),
      },
      null,
      2,
    ) + '\n',
  );
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outDir = resolve(process.argv[2] ?? '.output/lod-data');
  const manifest = bundleData(outDir);
  console.log(`Bundled ${manifest.documents} search documents into ${outDir}`);
}
