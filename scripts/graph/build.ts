import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../validate/schemas.ts';
import type { Graph } from './types.ts';

export const GRAPH_DIR = 'generated/graph';

/**
 * Writes `nodes.json` and `edges.json` (already sorted by the graph) into `dir`. Output is
 * staged so a failed write leaves the previous artifacts in place.
 */
export function writeGraphArtifacts(graph: Graph, dir = join(repoRoot, GRAPH_DIR)): void {
  const staging = `${dir}.staging`;
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });
  writeFileSync(join(staging, 'nodes.json'), JSON.stringify(graph.nodes, null, 2) + '\n');
  writeFileSync(join(staging, 'edges.json'), JSON.stringify(graph.edges, null, 2) + '\n');
  rmSync(dir, { recursive: true, force: true });
  renameSync(staging, dir);
}
