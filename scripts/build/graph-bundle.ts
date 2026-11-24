import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deriveGraph } from '../graph/derive.ts';
import { CATEGORIES, type Category, type Graph } from '../graph/types.ts';
import type { CanonicalFile } from '../validate/canonical-files.ts';
import { retrievalCorpusFrom } from '../retrieve/load.ts';

export const GRAPH_BUNDLE = 'graph.json';

/**
 * `graph.json`: the dependency graph exactly as `deriveGraph` returns it (nodes, then canonical
 * and derived edges, each edge with its category), plus the categories traversal can filter on.
 */
export interface GraphBundle extends Graph {
  categories: readonly Category[];
}

/** Derives the graph from the validated canonical files; relations come only from scripts/graph/. */
export function compileGraphBundle(files: CanonicalFile[]): GraphBundle {
  const { nodes, edges } = deriveGraph(retrievalCorpusFrom(files, { testCases: true }));
  return { categories: CATEGORIES, nodes, edges };
}

/** The manifest counts a graph's nodes and edges as its records. */
export function graphRecords(value: unknown): number {
  const { nodes, edges } = value as Graph;
  return nodes.length + edges.length;
}

/** Loads the graph bundle from a `build:corpus` output directory for `scripts/graph/traverse.ts`. */
export function readGraphBundle(corpusDir: string): Graph {
  const path = join(corpusDir, GRAPH_BUNDLE);
  const { nodes, edges } = JSON.parse(readFileSync(path, 'utf8')) as Partial<GraphBundle>;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new Error(`${path}: not a graph bundle (expected nodes and edges arrays)`);
  }
  return { nodes, edges };
}
