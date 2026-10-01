import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { discoverPilotFiles, emptyPilot } from '../validate/pilot-files.ts';
import type { Pilot } from '../validate/pilot-types.ts';
import type { Alias, Issue, Section, Term } from '../validate/integrity.ts';
import {
  createAjv,
  formatErrors,
  getValidator,
  repoRoot,
  type SchemaName,
} from '../validate/schemas.ts';

export interface GlossaryTerm extends Term {
  definition?: string;
}

export type ReviewIssue = Issue & { type: string; summary: string };

/** Canonical inputs for retrieval. Examples under tests/ are not retrieval content. */
export interface RetrievalCorpus {
  pilot: Omit<Pilot, 'testCases'>;
  terms: GlossaryTerm[];
  aliases: Alias[];
  issues: ReviewIssue[];
  sections: Section[];
  /** Canonical YAML path for every record id. */
  files: Map<string, string>;
  /** SHA-256 over every input path and its bytes, in sorted path order. */
  fingerprint: string;
}

const singleFiles: Array<{ path: string; schema: SchemaName }> = [
  { path: 'corpus/glossary/terms.yaml', schema: 'terms' },
  { path: 'corpus/glossary/aliases.yaml', schema: 'aliases' },
  { path: 'review/ambiguities.yaml', schema: 'issues' },
  { path: 'corpus/source-map/sections.yaml', schema: 'sections' },
];

export function retrievalInputs(root = repoRoot): Array<{ path: string; schema: SchemaName }> {
  const pilotFiles = discoverPilotFiles(root).filter((file) => file.schema !== 'testCases');
  return [...singleFiles, ...pilotFiles].sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

export function fingerprintInputs(root = repoRoot): string {
  const hash = createHash('sha256');
  for (const { path } of retrievalInputs(root)) {
    hash
      .update(path)
      .update('\0')
      .update(readFileSync(join(root, path)))
      .update('\0');
  }
  return hash.digest('hex');
}

export function loadRetrievalCorpus(root = repoRoot): RetrievalCorpus {
  const ajv = createAjv();
  const pilot = emptyPilot();
  const files = new Map<string, string>();
  const single = new Map<SchemaName, unknown>();
  const hash = createHash('sha256');

  for (const { path, schema } of retrievalInputs(root)) {
    const bytes = readFileSync(join(root, path));
    hash.update(path).update('\0').update(bytes).update('\0');
    const data: unknown = parse(bytes.toString('utf8'));
    const validate = getValidator(ajv, schema);
    if (!validate(data)) throw new Error(`${path}: ${formatErrors(validate).join('; ')}`);

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

  const { testCases: _testCases, ...canonical } = pilot;
  return {
    pilot: canonical,
    terms: single.get('terms') as GlossaryTerm[],
    aliases: single.get('aliases') as Alias[],
    issues: single.get('issues') as ReviewIssue[],
    sections: single.get('sections') as Section[],
    files,
    fingerprint: hash.digest('hex'),
  };
}
