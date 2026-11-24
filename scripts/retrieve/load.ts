import { loadCorpusBundles } from '../build/load.ts';
import { repoRoot } from '../validate/schemas.ts';
import { retrievalCorpusFrom, type RetrievalCorpus } from './corpus.ts';

export interface LoadOptions {
  testCases?: boolean;
  /** Compile a missing or stale corpus in memory instead of publishing it to `generated/`. */
  readOnly?: boolean;
}

/**
 * Reads the compiled corpus of `root`, building it first when it is missing or stale, so
 * retrieval always sees the corpus version `npm run build:corpus` would publish.
 */
export function loadRetrievalCorpus(root = repoRoot, options: LoadOptions = {}): RetrievalCorpus {
  return retrievalCorpusFrom(loadCorpusBundles(root, options), options);
}
