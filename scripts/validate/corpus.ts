import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { discoverPilotFiles, emptyPilot } from './pilot-files.ts';
import { checkPilotIntegrity } from './pilot.ts';
import { createAjv, formatErrors, getValidator, repoRoot, type SchemaName } from './schemas.ts';
import {
  checkIntegrity,
  checkGlossaryIntegrity,
  type CoverageEntry,
  type Page,
  type Section,
  type Term,
  type Alias,
  type Issue,
} from './integrity.ts';

/** Canonical files loaded by the validator. `generated/` is never scanned. */
const canonicalFiles: Array<{ path: string; schema: SchemaName }> = [
  { path: 'source/manifest.yaml', schema: 'manifest' },
  { path: 'corpus/glossary/terms.yaml', schema: 'terms' },
  { path: 'corpus/glossary/aliases.yaml', schema: 'aliases' },
  { path: 'review/ambiguities.yaml', schema: 'issues' },
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
  pages?: number;
}

interface Manifest {
  documents: ManifestDocument[];
  external_sources?: Array<{ id: string; status: string }>;
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
  const loaded = new Map<SchemaName, unknown>();
  const pilot = emptyPilot();
  const pilotFiles = discoverPilotFiles();
  let validFiles = 0;

  for (const { path, schema } of [...canonicalFiles, ...pilotFiles]) {
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

    validFiles += 1;
    if (schema in pilot) {
      (pilot[schema as keyof typeof pilot] as unknown[]).push(...(data as unknown[]));
    } else loaded.set(schema, data);

    if (schema === 'coverage') {
      errors.push(...findDuplicateIds((data as { sections: unknown }).sections, path));
    } else if (schema !== 'manifest') {
      errors.push(...findDuplicateIds(data, path));
    } else {
      errors.push(...findDuplicateIds((data as Manifest).documents, path));
      errors.push(...findDuplicateIds((data as Manifest).external_sources, path));
      errors.push(...checkDocumentFilesExist(data));
    }
  }

  // Cross-file checks only make sense once every file parsed and matched its schema.
  if (validFiles === canonicalFiles.length + pilotFiles.length) {
    const manifest = loaded.get('manifest') as Manifest;
    const canonicalDocument = manifest.documents.find((document) => document.canonical);

    const sourceMap = {
      sections: loaded.get('sections') as Section[],
      pages: loaded.get('pages') as Page[],
      coverage: (loaded.get('coverage') as { sections: CoverageEntry[] }).sections,
      externalSourceIds: (manifest.external_sources ?? []).map((source) => source.id),
      documentPageCount: canonicalDocument?.pages,
    };
    errors.push(...checkIntegrity(sourceMap));
    errors.push(
      ...checkGlossaryIntegrity(
        {
          terms: loaded.get('terms') as Term[],
          aliases: loaded.get('aliases') as Alias[],
          issues: loaded.get('issues') as Issue[],
          documentIds: [
            ...manifest.documents.map((document) => document.id),
            ...(manifest.external_sources ?? []).map((source) => source.id),
          ],
          canonicalDocumentId: canonicalDocument?.id ?? '',
          additionalRelatedIds: Object.values(pilot).flatMap((entries: Array<{ id: string }>) =>
            entries.map((entry) => entry.id),
          ),
        },
        sourceMap,
      ),
    );
    errors.push(
      ...checkPilotIntegrity(pilot, {
        map: sourceMap,
        terms: loaded.get('terms') as Term[],
        issues: loaded.get('issues') as Issue[],
        documents: manifest.documents,
        externalIds: sourceMap.externalSourceIds,
      }),
    );
  }

  return { errors, filesChecked };
}
