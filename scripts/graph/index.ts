import { loadRetrievalCorpus } from '../retrieve/load.ts';
import { repoRoot } from '../validate/schemas.ts';
import { deriveGraph } from './derive.ts';
import type { Graph } from './types.ts';

export { deriveGraph } from './derive.ts';
export * from './types.ts';

/** Loads the canonical corpus and derives its dependency graph. */
export function buildGraph(root = repoRoot): Graph {
  return deriveGraph(loadRetrievalCorpus(root, { testCases: true }));
}
