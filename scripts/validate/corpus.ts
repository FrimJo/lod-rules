import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { createAjv, formatErrors, getValidator, repoRoot, type SchemaName } from './schemas.ts';

/** Canonical files loaded by the validator. `generated/` is never scanned. */
const canonicalFiles: Array<{ path: string; schema: SchemaName }> = [
  { path: 'source/manifest.yaml', schema: 'manifest' },
  { path: 'corpus/source-map/sections.yaml', schema: 'sections' },
  { path: 'corpus/source-map/pages.yaml', schema: 'pages' },
  { path: 'corpus/source-map/coverage.yaml', schema: 'coverage' },
];

export interface ValidationResult {
  errors: string[];
  filesChecked: number;
}

interface ManifestDocument {
  id: string;
  file: string;
  canonical: boolean;
}

interface Manifest {
  documents: ManifestDocument[];
}

function findDuplicateIds(entries: unknown, path: string): string[] {
  if (!Array.isArray(entries)) return [];

  const seen = new Set<string>();
  const errors: string[] = [];

  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) continue;
    const id = (entry as { id?: unknown }).id;
    if (typeof id !== 'string') continue;

    if (seen.has(id)) {
      errors.push(`${path}: duplicate id "${id}"`);
    }
    seen.add(id);
  }

  return errors;
}

/** The manifest records source identity, so a missing file invalidates all provenance. */
function checkDocumentFilesExist(manifest: unknown): string[] {
  const documents = (manifest as Manifest | null)?.documents;
  if (!Array.isArray(documents)) return [];

  return documents
    .filter((document) => !existsSync(join(repoRoot, 'source', document.file)))
    .map(
      (document) =>
        `source/manifest.yaml: document "${document.id}" references missing file source/${document.file}`,
    );
}

export function validateCorpus(): ValidationResult {
  const ajv = createAjv();
  const errors: string[] = [];
  let filesChecked = 0;

  for (const { path, schema } of canonicalFiles) {
    const absolutePath = join(repoRoot, path);

    if (!existsSync(absolutePath)) {
      errors.push(`${path}: file is missing`);
      continue;
    }

    filesChecked += 1;

    let data: unknown;
    try {
      data = parse(readFileSync(absolutePath, 'utf8'));
    } catch (error) {
      errors.push(`${path}: YAML parse error: ${(error as Error).message}`);
      continue;
    }

    const validate = getValidator(ajv, schema);
    if (!validate(data)) {
      errors.push(...formatErrors(validate).map((message) => `${path}: ${message}`));
      continue;
    }

    if (schema === 'coverage') {
      errors.push(...findDuplicateIds((data as { sections: unknown }).sections, path));
    } else if (schema !== 'manifest') {
      errors.push(...findDuplicateIds(data, path));
    } else {
      errors.push(...findDuplicateIds((data as Manifest).documents, path));
      errors.push(...checkDocumentFilesExist(data));
    }
  }

  return { errors, filesChecked };
}
