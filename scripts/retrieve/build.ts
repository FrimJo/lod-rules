import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../validate/schemas.ts';
import { buildSearchDocuments, SEARCH_DOCUMENT_VERSION } from './documents.ts';
import { canonicalRecords, createRetrievalDatabase } from './index.ts';
import { fingerprintInputs, loadRetrievalCorpus } from './load.ts';

export const RETRIEVAL_DIR = 'generated/retrieval';

export interface RetrievalManifest {
  format_version: number;
  input_fingerprint: string;
  documents: number;
  outputs: Record<string, string>;
}

/**
 * Writes search documents, the SQLite index and a manifest. Output is staged so a failed
 * build leaves the previous successful artifacts in place.
 */
export function buildRetrievalArtifacts(root = repoRoot): RetrievalManifest {
  const corpus = loadRetrievalCorpus(root);
  const documents = buildSearchDocuments(corpus);
  const target = join(root, RETRIEVAL_DIR);
  const staging = `${target}.staging`;
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });

  const jsonl = documents.map((doc) => JSON.stringify(doc)).join('\n') + '\n';
  writeFileSync(join(staging, 'search-documents.jsonl'), jsonl);
  createRetrievalDatabase(
    documents,
    canonicalRecords(corpus),
    join(staging, 'retrieval.sqlite'),
  ).close();

  const manifest: RetrievalManifest = {
    format_version: SEARCH_DOCUMENT_VERSION,
    input_fingerprint: corpus.fingerprint,
    documents: documents.length,
    outputs: {
      'search-documents.jsonl': createHash('sha256').update(jsonl).digest('hex'),
    },
  };
  writeFileSync(join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  rmSync(target, { recursive: true, force: true });
  renameSync(staging, target);
  return manifest;
}

/** The built database, if it exists and matches the current canonical inputs. */
export function freshDatabasePath(root = repoRoot): string | null {
  const manifestPath = join(root, RETRIEVAL_DIR, 'manifest.json');
  const databasePath = join(root, RETRIEVAL_DIR, 'retrieval.sqlite');
  if (!existsSync(manifestPath) || !existsSync(databasePath)) return null;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as RetrievalManifest;
  const current =
    manifest.format_version === SEARCH_DOCUMENT_VERSION &&
    manifest.input_fingerprint === fingerprintInputs(root);
  return current ? databasePath : null;
}
