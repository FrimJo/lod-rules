import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import type Ajv2020 from 'ajv/dist/2020.js';
import { join } from 'node:path';
import { parse } from 'yaml';
import { discoverReviewFiles } from './independent-review.ts';
import { discoverPilotFiles } from './pilot-files.ts';
import { createAjv, formatErrors, getValidator, repoRoot, type SchemaName } from './schemas.ts';

export interface CanonicalInput {
  /** Repo-relative POSIX path. */
  path: string;
  schema: SchemaName;
}

/** A canonical YAML file after parsing and schema validation. */
export interface CanonicalFile extends CanonicalInput {
  bytes: Buffer;
  data: unknown;
}

/** Canonical inputs that live in one fixed file each. `generated/` is never an input. */
export const singleFiles: readonly CanonicalInput[] = [
  { path: 'source/manifest.yaml', schema: 'manifest' },
  { path: 'corpus/glossary/terms.yaml', schema: 'terms' },
  { path: 'corpus/glossary/aliases.yaml', schema: 'aliases' },
  { path: 'review/ambiguities.yaml', schema: 'issues' },
  { path: 'corpus/source-map/sections.yaml', schema: 'sections' },
  { path: 'corpus/source-map/pages.yaml', schema: 'pages' },
  { path: 'corpus/source-map/coverage.yaml', schema: 'coverage' },
];

const byPath = (a: CanonicalInput, b: CanonicalInput): number => a.path.localeCompare(b.path, 'en');

/** Every canonical YAML input under `root`, sorted by path. */
export function canonicalInputs(root = repoRoot): CanonicalInput[] {
  return [
    ...singleFiles,
    ...discoverPilotFiles(root),
    ...discoverReviewFiles(root).map((path) => ({ path, schema: 'independentReviews' as const })),
  ].sort(byPath);
}

export type ReadResult =
  | { file: CanonicalFile; errors?: never; missing?: never }
  | { file?: never; errors: string[]; missing: boolean };

/** Reads, parses and schema-validates one input, returning every problem it finds. */
export function readCanonicalFile(
  ajv: Ajv2020,
  input: CanonicalInput,
  root = repoRoot,
): ReadResult {
  const { path, schema } = input;
  const absolute = join(root, path);
  if (!existsSync(absolute)) return { errors: [`${path}: file is missing`], missing: true };

  const bytes = readFileSync(absolute);
  let data: unknown;
  try {
    data = parse(bytes.toString('utf8'));
  } catch (error) {
    return { errors: [`${path}: YAML parse error: ${(error as Error).message}`], missing: false };
  }
  const validate = getValidator(ajv, schema);
  if (!validate(data)) {
    return {
      errors: formatErrors(validate).map((message) => `${path}: ${message}`),
      missing: false,
    };
  }
  return { file: { ...input, bytes, data } };
}

/**
 * Reads `inputs` in order. Throws naming the first file that fails; callers that must report
 * every error use `validateCorpus` instead.
 */
export function readCanonicalFiles(inputs: CanonicalInput[], root = repoRoot): CanonicalFile[] {
  const ajv = createAjv();
  return inputs.map((input) => {
    const result = readCanonicalFile(ajv, input, root);
    if (!result.file) throw new Error(result.errors.join('\n'));
    return result.file;
  });
}

/** SHA-256 over each path and its bytes, in the order given. */
export function fingerprintFiles(files: Iterable<{ path: string; bytes: Buffer }>): string {
  const hash = createHash('sha256');
  for (const { path, bytes } of files) hash.update(path).update('\0').update(bytes).update('\0');
  return hash.digest('hex');
}
