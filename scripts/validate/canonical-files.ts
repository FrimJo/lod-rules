import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import type Ajv2020 from 'ajv/dist/2020.js';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Pilot } from './pilot-types.ts';
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

/**
 * Canonical inputs that live in one fixed file each, keyed by schema. Validator messages name
 * these paths. `generated/` is never an input.
 */
export const canonicalPaths = {
  manifest: 'source/manifest.yaml',
  terms: 'corpus/glossary/terms.yaml',
  aliases: 'corpus/glossary/aliases.yaml',
  issues: 'review/ambiguities.yaml',
  sections: 'corpus/source-map/sections.yaml',
  pages: 'corpus/source-map/pages.yaml',
  coverage: 'corpus/source-map/coverage.yaml',
} as const satisfies Partial<Record<SchemaName, string>>;

const pilotRoots = {
  rules: 'corpus/rules',
  entities: 'corpus/entities',
  tables: 'corpus/tables',
  procedures: 'corpus/procedures',
  stateMachines: 'corpus/state-machines',
  testCases: 'tests/examples',
  edges: 'corpus/graph',
} as const satisfies Record<keyof Pilot, string>;

const reviewRoot = 'review/independent';

const byName = (a: { name: string }, b: { name: string }): number =>
  a.name.localeCompare(b.name, 'en');
const isYaml = (name: string): boolean => /\.ya?ml$/.test(name);

export interface PilotFile extends CanonicalInput {
  schema: keyof Pilot;
}

/** Pilot collection files, each tree walked depth-first in name order. */
export function discoverPilotFiles(root = repoRoot): PilotFile[] {
  const files: PilotFile[] = [];
  function walk(path: string, schema: keyof Pilot): void {
    if (!existsSync(join(root, path))) return;
    for (const entry of readdirSync(join(root, path), { withFileTypes: true }).sort(byName)) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) walk(child, schema);
      else if (entry.isFile() && isYaml(entry.name)) files.push({ path: child, schema });
    }
  }
  for (const [schema, path] of Object.entries(pilotRoots)) walk(path, schema as keyof Pilot);
  return files;
}

/** Review record files, sorted. The directory may not exist before the first review. */
export function discoverReviewFiles(root = repoRoot): string[] {
  const directory = join(root, reviewRoot);
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isYaml(entry.name))
    .map((entry) => `${reviewRoot}/${entry.name}`)
    .sort();
}

const byPath = (a: CanonicalInput, b: CanonicalInput): number => a.path.localeCompare(b.path, 'en');

/** Every canonical YAML input under `root`, sorted by path. */
export function canonicalInputs(root = repoRoot): CanonicalInput[] {
  return [
    ...Object.entries(canonicalPaths).map(([schema, path]) => ({
      path,
      schema: schema as SchemaName,
    })),
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

/**
 * The corpus fingerprint: every canonical input under `root`, hashed without parsing. Equals the
 * corpus manifest's `input_fingerprint` for the same bytes, so staleness checks need no build.
 */
export function fingerprintInputs(root = repoRoot): string {
  return fingerprintFiles(
    canonicalInputs(root).map(({ path }) => ({ path, bytes: readFileSync(join(root, path)) })),
  );
}
