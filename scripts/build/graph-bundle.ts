import { deriveGraph } from '../graph/derive.ts';
import { CATEGORIES, type Category, type Graph } from '../graph/types.ts';
import { retrievalCorpusFrom } from '../retrieve/corpus.ts';
import {
  GRAPH_BUNDLE,
  readPublishedBundles,
  readPublishedManifest,
  type CorpusBundles,
} from './bundles.ts';

/**
 * `graph.json`: the dependency graph exactly as `deriveGraph` returns it (nodes, then canonical
 * and derived edges, each edge with its category), plus the categories traversal can filter on.
 */
export interface GraphBundle extends Graph {
  categories: readonly Category[];
}

/** Derives the graph from the compiled class bundles; relations come only from scripts/graph/. */
export function compileGraphBundle(corpus: CorpusBundles): GraphBundle {
  const { nodes, edges } = deriveGraph(retrievalCorpusFrom(corpus, { testCases: true }));
  return { categories: CATEGORIES, nodes, edges };
}

/**
 * Loads the graph bundle from a `build:corpus` output directory, checked against its manifest,
 * for traversal with `scripts/graph/traverse.ts`.
 */
export function readGraphBundle(corpusDir: string): Graph {
  const manifest = readPublishedManifest(corpusDir);
  const bundles = manifest && readPublishedBundles(corpusDir, manifest, [GRAPH_BUNDLE]);
  if (!bundles) throw new Error(`${corpusDir}: no ${GRAPH_BUNDLE} that matches its manifest`);
  const { nodes, edges } = bundles.bundle(GRAPH_BUNDLE) as unknown as GraphBundle;
  return { nodes, edges };
}
