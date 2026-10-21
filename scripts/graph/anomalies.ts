import type { Anomalies, DanglingId, Graph } from './types.ts';

/** Edges whose target is not a node. The edge list is already sorted, so this is too. */
function danglingIds(graph: Graph): DanglingId[] {
  const ids = new Set(graph.nodes.map((node) => node.id));
  return graph.edges
    .filter((edge) => !ids.has(edge.target))
    .map(({ source, relation, target, field }) => ({ source, relation, target, field }));
}

/** Finds the graph's anomalies. Reports them; resolves none. */
export function findAnomalies(graph: Graph): Anomalies {
  return { dangling: danglingIds(graph) };
}
