import type { SourceReference } from '../validate/integrity.ts';

/** What an edge means for traversal. Queries choose which categories count. */
export const CATEGORIES = [
  'dependency',
  'precedence',
  'reference',
  'structural',
  'external',
  'evidence',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Every relation the graph derives, and its category. */
export const RELATION_CATEGORY = {
  uses_table: 'dependency',
  depends_on: 'dependency',
  step_rule: 'dependency',
  row_rule: 'dependency',
  row_entity: 'dependency',
  enters: 'dependency',
  grants: 'dependency',
  starting_equipment: 'dependency',
  component: 'dependency',
  rule: 'dependency',
  table: 'dependency',
  entity: 'dependency',
  overrides: 'precedence',
  see_also: 'reference',
  term: 'reference',
  timing: 'reference',
  related: 'reference',
  quest: 'reference',
  concerns: 'evidence',
  issue: 'evidence',
  part_of: 'structural',
  external: 'external',
  redirects_to: 'structural',
  cites_section: 'structural',
  tests: 'evidence',
} as const satisfies Record<string, Category>;
export type Relation = keyof typeof RELATION_CATEGORY;

/** Categories the agent tools (`lod_get`, `lod_expand`) may show. */
const TOOL_VISIBLE_CATEGORIES: ReadonlySet<Category> = new Set([
  'dependency',
  'precedence',
  'reference',
  'external',
]);
/** Relations visible despite their category: `part_of` places a section in the book. */
const TOOL_VISIBLE_EXCEPTIONS: ReadonlySet<Relation> = new Set(['part_of']);

/**
 * The single definition of which graph relations reach the agent tools. Structural bookkeeping
 * and evidence stay in the graph.
 */
export function isToolVisible(relation: Relation): boolean {
  return (
    TOOL_VISIBLE_CATEGORIES.has(RELATION_CATEGORY[relation]) ||
    TOOL_VISIBLE_EXCEPTIONS.has(relation)
  );
}

export type NodeKind =
  | 'rule'
  | 'entity'
  | 'table'
  | 'procedure'
  | 'state_machine'
  | 'term'
  | 'issue'
  | 'section'
  | 'document'
  | 'test_case';

export interface GraphNode {
  id: string;
  kind: NodeKind;
  title: string;
  /** Manifest books that the rulebook cites but this repository does not hold. */
  not_present?: true;
}

export interface GraphEdge {
  source: string;
  relation: Relation;
  target: string;
  category: Category;
  /** Schema path of the field the edge was read from, e.g. `steps[].rule_refs`. */
  field: string;
  /** Source references of the record that owns `field`. */
  provenance: SourceReference[];
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** An edge whose target is not a graph node. */
export interface DanglingId {
  source: string;
  relation: Relation;
  target: string;
  field: string;
}

/** A free-text `unresolved_references` entry. Never an edge; never resolved here. */
export interface UnresolvedPointer {
  /** Id of the record or section whose `unresolved_references` holds the entry. */
  owner: string;
  wording: string;
}

/**
 * Elementary cycles over one relation. Each cycle lists its nodes in edge order, starting at its
 * smallest id; the last node points back to the first. A self-reference is a one-node cycle.
 */
export interface RelationCycles {
  relation: Relation;
  cycles: string[][];
}

/** Problems found while deriving the graph. Reported for later dispositions; none is fixed. */
export interface Anomalies {
  dangling: DanglingId[];
  unresolved: UnresolvedPointer[];
  /** Relations with at least one cycle, sorted by relation. Reported, never failing. */
  cycles: RelationCycles[];
}

/** What `buildGraph` returns: the derived graph plus its anomalies. */
export interface AnalysedGraph extends Graph {
  anomalies: Anomalies;
}
