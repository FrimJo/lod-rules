/** The retrieval model of the corpus, assembled from compiled bundles. */

import type { CorpusBundles } from '../build/bundles.ts';
import type { Pilot, TestCase } from '../validate/pilot-types.ts';
import type { ReviewRecord } from '../validate/independent-review.ts';
import type { Alias, CoverageEntry, Issue, Section, Term } from '../validate/integrity.ts';

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
  /** Section coverage rows: `reviewed`, or `mapped` for a compatibility redirect. */
  coverage: CoverageEntry[];
  /** Independent review records (`review.*.N`); the validator's rule picks a section's governing one. */
  reviews: ReviewRecord[];
  manifest: SourceManifest;
  /** Canonical YAML path for every record id. */
  files: Map<string, string>;
  /** The corpus manifest's `input_fingerprint`: the canonical inputs this corpus came from. */
  fingerprint: string;
}

/** The class bundle that holds each pilot collection. */
const pilotCollectionBundles = {
  rules: 'rules.json',
  entities: 'entities.json',
  tables: 'tables.json',
  procedures: 'procedures.json',
  stateMachines: 'state-machines.json',
  edges: 'edges.json',
} as const satisfies Record<keyof RetrievalCorpus['pilot'], string>;

/** Assembles the retrieval model from compiled bundles, published or still in memory. */
export function retrievalCorpusFrom(
  corpus: CorpusBundles,
  options: { testCases?: boolean } = {},
): RetrievalCorpus {
  const files = new Map<string, string>();
  /** Records of one bundle; `traced` ones also map their ids to their YAML files. */
  const read = <T>(file: string, traced = false): T[] => {
    const bundle = corpus.bundle<T>(file);
    if (traced) for (const [id, path] of Object.entries(bundle.files)) files.set(id, path);
    return bundle.records;
  };

  const pilot = Object.fromEntries(
    Object.entries(pilotCollectionBundles).map(([key, file]) => [key, read(file, true)]),
  ) as RetrievalCorpus['pilot'];
  return {
    pilot,
    ...(options.testCases ? { testCases: read<TestCase>('test-cases.json') } : {}),
    terms: read<GlossaryTerm>('terms.json', true),
    aliases: read<Alias>('aliases.json'),
    issues: read<ReviewIssue>('issues.json', true),
    sections: read<Section>('sections.json'),
    coverage: read<CoverageEntry>('coverage.json'),
    reviews: read<ReviewRecord>('independent-reviews.json'),
    manifest: {
      documents: read<SourceManifest['documents'][number]>('source-documents.json'),
      external_sources:
        read<NonNullable<SourceManifest['external_sources']>[number]>('external-sources.json'),
    },
    files,
    fingerprint: corpus.manifest.input_fingerprint,
  };
}
