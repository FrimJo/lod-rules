import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalInputs, readCanonicalFile, type CanonicalFile } from './canonical-files.ts';
import { emptyPilot } from './pilot-files.ts';
import { checkPilotIntegrity } from './pilot.ts';
import {
  checkIndependentReviews,
  sourceClassesOf,
  sourceFingerprint,
  type ReviewRecord,
} from './independent-review.ts';
import { createAjv, repoRoot, type SchemaName } from './schemas.ts';
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

export interface ValidationResult {
  errors: string[];
  filesChecked: number;
  /** Every input that parsed and matched its schema, in path order. Complete when `errors` is empty. */
  files: CanonicalFile[];
}

interface ManifestDocument {
  id: string;
  file: string;
  canonical: boolean;
  source_class?: string;
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
function checkDocumentFilesExist(manifest: unknown, root: string): string[] {
  const documents = (manifest as Manifest | null)?.documents;
  if (!Array.isArray(documents)) return [];

  return documents
    .filter((document) => !existsSync(join(root, 'source', document.file)))
    .map(
      (document) =>
        `source/manifest.yaml: document "${document.id}" references missing file source/${document.file}`,
    );
}

/**
 * Validates the corpus inputs under `root`. Schemas always come from this repository's
 * `schemas/`: they are the validator's contract, not an input of the tree being checked.
 */
export function validateCorpus(root = repoRoot): ValidationResult {
  const ajv = createAjv();
  const errors: string[] = [];
  let filesChecked = 0;
  const loaded = new Map<SchemaName, unknown>();
  const pilot = emptyPilot();
  const inputs = canonicalInputs(root);
  const files: CanonicalFile[] = [];
  const reviewRecords: ReviewRecord[] = [];

  for (const input of inputs) {
    const result = readCanonicalFile(ajv, input, root);
    if (!result.missing) filesChecked += 1;
    if (!result.file) {
      errors.push(...result.errors);
      continue;
    }

    const { path, schema, data } = result.file;
    files.push(result.file);
    if (schema === 'independentReviews') {
      // Ids are checked across all review files by checkIndependentReviews.
      reviewRecords.push(...((data as ReviewRecord[] | null) ?? []));
      continue;
    }
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
      errors.push(...checkDocumentFilesExist(data, root));
    }
  }

  // Cross-file checks only make sense once every file parsed and matched its schema.
  if (files.length === inputs.length) {
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
    errors.push(
      ...checkIndependentReviews(
        {
          sections: sourceMap.sections,
          pages: sourceMap.pages,
          coverage: sourceMap.coverage,
          terms: loaded.get('terms') as Term[],
          issues: loaded.get('issues') as Issue[],
          pilot,
          documentIds: [
            ...manifest.documents.map((document) => document.id),
            ...sourceMap.externalSourceIds,
          ],
          documentSourceClasses: sourceClassesOf(manifest.documents),
          canonicalDocumentId: canonicalDocument?.id ?? '',
          // Hashing the 40 MB PDF only matters once a record can be compared against it.
          sourceSha256:
            canonicalDocument && reviewRecords.length > 0
              ? sourceFingerprint(join(root, 'source', canonicalDocument.file))
              : '',
        },
        reviewRecords,
      ),
    );
  }

  return { errors, filesChecked, files };
}
