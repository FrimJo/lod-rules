import type { RetrievalCorpus } from '../retrieve/load.ts';
import type { Anomalies, DanglingId, Graph, UnresolvedPointer } from './types.ts';

const compare = (a: string, b: string): number => a.localeCompare(b, 'en');

/** Edges whose target is not a node. The edge list is already sorted, so this is too. */
function danglingIds(graph: Graph): DanglingId[] {
  const ids = new Set(graph.nodes.map((node) => node.id));
  return graph.edges
    .filter((edge) => !ids.has(edge.target))
    .map(({ source, relation, target, field }) => ({ source, relation, target, field }));
}

/**
 * Every `unresolved_references` entry, by owner id and then in the order the owner lists them.
 * Covers every record kind the corpus loads (`pilot`) and sections; terms and issues have no
 * such field.
 */
function unresolvedPointers(corpus: RetrievalCorpus): UnresolvedPointer[] {
  const owners: Array<{ id: string; unresolved_references?: string[] }> = [
    ...Object.values(corpus.pilot).flat(),
    ...corpus.sections,
  ];
  return owners
    .sort((a, b) => compare(a.id, b.id))
    .flatMap((owner) =>
      (owner.unresolved_references ?? []).map((wording) => ({ owner: owner.id, wording })),
    );
}

/** Finds the graph's anomalies. Reports them; resolves none. */
export function findAnomalies(graph: Graph, corpus: RetrievalCorpus): Anomalies {
  return { dangling: danglingIds(graph), unresolved: unresolvedPointers(corpus) };
}
