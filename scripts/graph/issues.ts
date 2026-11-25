import { compare } from './compare.ts';
import type { Graph } from './types.ts';

/**
 * The records each review issue names, read from the graph's issue edges: the issue's
 * `concerns` edges (its `related` list) and the `issue` edges of records that list it. Ids are
 * sorted; retrieval reads conflict membership here and never from `related` directly.
 */
export function issueMembers(graph: Graph): Map<string, string[]> {
  const members = new Map<string, Set<string>>();
  const add = (issue: string, record: string): void => {
    const set = members.get(issue) ?? new Set<string>();
    set.add(record);
    members.set(issue, set);
  };
  for (const { source, relation, target } of graph.edges) {
    if (relation === 'concerns') add(source, target);
    else if (relation === 'issue') add(target, source);
  }
  return new Map(
    [...members].map(([issue, records]) => [issue, [...records].sort(compare)] as const),
  );
}
