import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  canonicalInputs,
  fingerprintFiles,
  readCanonicalFiles,
  type CanonicalFile,
  type CanonicalInput,
} from '../validate/canonical-files.ts';
import { emptyPilot } from '../validate/pilot-files.ts';
import type { Pilot, TestCase } from '../validate/pilot-types.ts';
import type { Alias, Issue, Section, Term } from '../validate/integrity.ts';
import { repoRoot, type SchemaName } from '../validate/schemas.ts';

export interface GlossaryTerm extends Term {
  definition?: string;
}

export type ReviewIssue = Issue & { type: string; summary: string };

/** `source/manifest.yaml`: documents in this repository and books that are not. */
export interface SourceManifest {
  documents: Array<{ id: string; title: string; canonical?: boolean }>;
  external_sources?: Array<{ id: string; title: string; status: string }>;
}

/** Canonical inputs for retrieval. Test cases under tests/examples/ are never retrieval content. */
export interface RetrievalCorpus {
  pilot: Omit<Pilot, 'testCases'>;
  /**
   * Test cases under tests/examples/, loaded only on request (`{ testCases: true }`) so the graph
   * can derive `tests` edges. Never indexed, searched or returned by the tools.
   */
  testCases?: TestCase[];
  terms: GlossaryTerm[];
  aliases: Alias[];
  issues: ReviewIssue[];
  sections: Section[];
  manifest: SourceManifest;
  /** Canonical YAML path for every record id. */
  files: Map<string, string>;
  /** SHA-256 over every input path and its bytes, in sorted path order. */
  fingerprint: string;
}

/** Classes retrieval reads. Test cases join only on request and never enter the fingerprint. */
const retrievalSchemas = new Set<SchemaName>([
  'manifest',
  'terms',
  'aliases',
  'issues',
  'sections',
  'rules',
  'entities',
  'tables',
  'procedures',
  'stateMachines',
  'edges',
]);

export function retrievalInputs(root = repoRoot): CanonicalInput[] {
  return canonicalInputs(root).filter((input) => retrievalSchemas.has(input.schema));
}

export function fingerprintInputs(root = repoRoot): string {
  return fingerprintFiles(
    retrievalInputs(root).map(({ path }) => ({ path, bytes: readFileSync(join(root, path)) })),
  );
}

export function loadRetrievalCorpus(
  root = repoRoot,
  options: { testCases?: boolean } = {},
): RetrievalCorpus {
  const inputs = canonicalInputs(root).filter(
    (input) =>
      retrievalSchemas.has(input.schema) || (options.testCases && input.schema === 'testCases'),
  );
  return retrievalCorpusFrom(readCanonicalFiles(inputs, root), options);
}

/**
 * Assembles the retrieval model from already-validated canonical files (in path order). Files
 * of classes retrieval does not read are ignored, so a caller holding the whole corpus can
 * pass it as is.
 */
export function retrievalCorpusFrom(
  canonical: CanonicalFile[],
  options: { testCases?: boolean } = {},
): RetrievalCorpus {
  const pilot = emptyPilot();
  const files = new Map<string, string>();
  const single = new Map<SchemaName, unknown>();
  const inputs = canonical.filter((file) => retrievalSchemas.has(file.schema));

  for (const { path, schema, data } of canonical) {
    if (schema === 'testCases') {
      if (options.testCases) pilot.testCases.push(...(data as TestCase[]));
      continue;
    }
    if (!retrievalSchemas.has(schema)) continue;

    if (schema in pilot) {
      const entries = data as Array<{ id: string }>;
      (pilot[schema as keyof Pilot] as unknown[]).push(...entries);
      for (const entry of entries) files.set(entry.id, path);
    } else {
      single.set(schema, data);
      if (schema === 'terms' || schema === 'issues') {
        for (const entry of data as Array<{ id: string }>) files.set(entry.id, path);
      }
    }
  }

  const { testCases, ...rest } = pilot;
  return {
    pilot: rest,
    ...(options.testCases ? { testCases } : {}),
    terms: single.get('terms') as GlossaryTerm[],
    aliases: single.get('aliases') as Alias[],
    issues: single.get('issues') as ReviewIssue[],
    sections: single.get('sections') as Section[],
    manifest: single.get('manifest') as SourceManifest,
    files,
    fingerprint: fingerprintFiles(inputs),
  };
}
