import type { RetrievalCorpus } from '../retrieve/load.ts';
import type {
  Anomalies,
  DanglingId,
  Graph,
  Relation,
  RelationCycles,
  UnresolvedPointer,
} from './types.ts';
import { compare } from './compare.ts';
import { stepDuplicates } from './duplicates.ts';

/** Edges whose target is not a node. The edge list is already sorted, so this is too. */
function danglingIds(graph: Graph): DanglingId[] {
  const ids = new Set(graph.nodes.map((node) => node.id));
  return graph.edges
    .filter((edge) => !ids.has(edge.target))
    .map(({ source, relation, target, field }) => ({ source, relation, target, field }));
}

/**
 * Every `unresolved_references` entry, by owner id and then in the order the owner lists them.
 * Covers every record kind the corpus loads (`pilot`), test cases and sections; terms and issues have no
 * such field.
 */
function unresolvedPointers(corpus: RetrievalCorpus): UnresolvedPointer[] {
  const owners: Array<{ id: string; unresolved_references?: string[] }> = [
    ...Object.values(corpus.pilot).flat(),
    ...(corpus.testCases ?? []),
    ...corpus.sections,
  ];
  return owners
    .sort((a, b) => compare(a.id, b.id))
    .flatMap((owner) =>
      (owner.unresolved_references ?? []).map((wording) => ({ owner: owner.id, wording })),
    );
}

/** Strongly connected component index of every node (Tarjan). */
function components(adjacency: Map<string, string[]>): Map<string, number> {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const component = new Map<string, number>();
  const stack: string[] = [];
  let counter = 0;
  let next = 0;
  const visit = (v: string): void => {
    index.set(v, counter);
    low.set(v, counter++);
    stack.push(v);
    for (const w of adjacency.get(v) ?? []) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (!component.has(w)) low.set(v, Math.min(low.get(v)!, index.get(w)!));
    }
    if (low.get(v) === index.get(v)) {
      for (let w = stack.pop(); w !== undefined; w = w === v ? undefined : stack.pop()) {
        component.set(w, next);
      }
      next++;
    }
  };
  for (const v of adjacency.keys()) if (!index.has(v)) visit(v);
  return component;
}

/**
 * Every elementary cycle of one relation, each found once from its smallest id. The search stays
 * inside one strongly connected component, so acyclic parts of the graph cost nothing.
 */
function relationCycles(adjacency: Map<string, string[]>): string[][] {
  const component = components(adjacency);
  const cycles: string[][] = [];
  for (const start of [...adjacency.keys()].sort(compare)) {
    const path = [start];
    const onPath = new Set(path);
    const walk = (v: string): void => {
      for (const w of adjacency.get(v) ?? []) {
        if (w === start) cycles.push([...path]);
        else if (
          !onPath.has(w) &&
          compare(w, start) > 0 &&
          component.get(w) === component.get(start)
        ) {
          path.push(w);
          onPath.add(w);
          walk(w);
          onPath.delete(w);
          path.pop();
        }
      }
    };
    walk(start);
  }
  return cycles;
}

/** Cycles per relation; relations without any are omitted. */
function cyclesByRelation(graph: Graph): RelationCycles[] {
  const byRelation = new Map<Relation, Map<string, Set<string>>>();
  for (const { relation, source, target } of graph.edges) {
    const adjacency = byRelation.get(relation) ?? new Map<string, Set<string>>();
    adjacency.set(source, (adjacency.get(source) ?? new Set()).add(target));
    byRelation.set(relation, adjacency);
  }
  return [...byRelation]
    .sort(([a], [b]) => compare(a, b))
    .map(([relation, targets]) => {
      const adjacency = new Map(
        [...targets].map(([source, set]) => [source, [...set].sort(compare)] as const),
      );
      return { relation, cycles: relationCycles(adjacency) };
    })
    .filter((group) => group.cycles.length > 0);
}

/** Finds the graph's anomalies. Reports them; resolves none. */
export function findAnomalies(graph: Graph, corpus: RetrievalCorpus): Anomalies {
  return {
    dangling: danglingIds(graph),
    unresolved: unresolvedPointers(corpus),
    cycles: cyclesByRelation(graph),
    stepDuplicates: stepDuplicates(corpus),
  };
}
