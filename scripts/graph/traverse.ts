import { CATEGORIES, type Category, type Graph, type GraphEdge } from './types.ts';

export type Direction = 'forward' | 'reverse' | 'both';

export interface TraverseOptions {
  /** `forward` follows edges source -> target, `reverse` target -> source. Default `forward`. */
  direction?: Direction;
  /** Only edges in these categories are walked. Default: every category. */
  categories?: readonly Category[];
  /** Maximum number of hops from the start. Default: unlimited. */
  depth?: number;
}

/** An edge reached by a traversal, how it was walked and how many hops from the start. */
export interface TraversedEdge extends GraphEdge {
  direction: 'forward' | 'reverse';
  depth: number;
}

/** "What could affect X" walks these categories unless the caller widens it. */
export const AFFECT_CATEGORIES = ['dependency', 'precedence'] as const satisfies Category[];

/**
 * Breadth-first walk from `start`. Each edge is reported once, at the depth it was first
 * reached; in the edge order of the graph within one node.
 */
export function traverse(
  graph: Graph,
  start: string,
  { direction = 'forward', categories = CATEGORIES, depth = Infinity }: TraverseOptions = {},
): TraversedEdge[] {
  const allowed = new Set<Category>(categories);
  const outgoing = new Map<string, GraphEdge[]>();
  const incoming = new Map<string, GraphEdge[]>();
  const index = (map: Map<string, GraphEdge[]>, key: string, edge: GraphEdge): void => {
    const list = map.get(key);
    if (list) list.push(edge);
    else map.set(key, [edge]);
  };
  for (const edge of graph.edges) {
    if (!allowed.has(edge.category)) continue;
    index(outgoing, edge.source, edge);
    index(incoming, edge.target, edge);
  }

  const result: TraversedEdge[] = [];
  const seenEdges = new Set<GraphEdge>();
  const seenNodes = new Set([start]);
  let frontier = [start];
  for (let hop = 1; hop <= depth && frontier.length > 0; hop++) {
    const next: string[] = [];
    const reach = (edge: GraphEdge, way: 'forward' | 'reverse', node: string): void => {
      if (seenEdges.has(edge)) return;
      seenEdges.add(edge);
      result.push({ ...edge, direction: way, depth: hop });
      if (!seenNodes.has(node)) {
        seenNodes.add(node);
        next.push(node);
      }
    };
    for (const node of frontier) {
      if (direction !== 'reverse') {
        for (const edge of outgoing.get(node) ?? []) reach(edge, 'forward', edge.target);
      }
      if (direction !== 'forward') {
        for (const edge of incoming.get(node) ?? []) reach(edge, 'reverse', edge.source);
      }
    }
    frontier = next;
  }
  return result;
}

/**
 * Reverse traversal: the records whose edges lead to `id`. Walks only `dependency` and
 * `precedence` edges unless `categories` widens it.
 */
export function whatCouldAffect(
  graph: Graph,
  id: string,
  options: Omit<TraverseOptions, 'direction'> = {},
): TraversedEdge[] {
  return traverse(graph, id, {
    categories: AFFECT_CATEGORIES,
    ...options,
    direction: 'reverse',
  });
}
