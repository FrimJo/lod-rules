import { loadRetrievalCorpus } from '../retrieve/load.ts';
import { repoRoot } from '../validate/schemas.ts';
import { findAnomalies } from './anomalies.ts';
import { deriveGraph } from './derive.ts';
import type { AnalysedGraph } from './types.ts';

export { deriveGraph } from './derive.ts';
export * from './types.ts';
export * from './traverse.ts';
export { issueMembers, recordIssues } from './issues.ts';

/** Loads the canonical corpus and derives its dependency graph and anomalies. */
export function buildGraph(root = repoRoot): AnalysedGraph {
  const corpus = loadRetrievalCorpus(root, { testCases: true });
  const graph = deriveGraph(corpus);
  return { ...graph, anomalies: findAnomalies(graph, corpus) };
}
