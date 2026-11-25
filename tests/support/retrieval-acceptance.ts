/**
 * Retrieval acceptance harness (issue #32). One declarative fixture
 * (tests/fixtures/retrieval-acceptance.json) lists the cases; `runAcceptanceCase` runs one
 * through the `Retrieval` library or `runRetrievalTool`, and `checkAcceptanceFixture` rejects
 * a malformed fixture. A new acceptance case is a data change, not a code change.
 */
import {
  DEFAULT_RESULT_LIMIT,
  type Retrieval,
  type SearchDocument,
} from '../../scripts/retrieve/index.ts';
import { runRetrievalTool } from '../../scripts/retrieve/tools.ts';

export const ACCEPTANCE_CATEGORIES = [
  'exact_lookup',
  'terminology',
  'combat_modifiers',
  'optional_rules',
  'service_eligibility',
  'quest_local_exceptions',
  'conflicting_passages',
  'missing_external_material',
] as const;
export type AcceptanceCategory = (typeof ACCEPTANCE_CATEGORIES)[number];

/** Library operations return full documents; `lod_*` operations return agent-tool output. */
export const LIBRARY_OPERATIONS = ['get', 'resolve', 'search'] as const;
export const TOOL_OPERATIONS = ['lod_get', 'lod_resolve', 'lod_search', 'lod_expand'] as const;
export const ACCEPTANCE_OPERATIONS = [...LIBRARY_OPERATIONS, ...TOOL_OPERATIONS] as const;
export type AcceptanceOperation = (typeof ACCEPTANCE_OPERATIONS)[number];

export interface AcceptanceCase {
  id: string;
  category: AcceptanceCategory;
  operation: AcceptanceOperation;
  /**
   * Tool-style input (`id`, `name`, `query`, `kinds`, `scope`, `quest_id`, …) for every
   * operation. Never holds `limit`; that is the case's own field.
   */
  input: Record<string, unknown>;
  /** Record ids that must come back. For a ranked search they must be within the limit. */
  expect_ids: string[];
  /** The id does not exist: `get` returns null, `lod_get` returns `{ found: false, hint }`. */
  expect_missing?: boolean;
  /** Manifest documents (e.g. `bestiary`) the first hit's `external_dependencies` must name. */
  expect_external?: string[];
  /**
   * Review state the first full document must report (library operations only): its own
   * status, its section's coverage status, the governing independent review and its open
   * issue ids by type. Every field given is compared exactly.
   */
  expect_review?: ExpectedReview;
  /** Tighter than the default of 10, never looser. Applies to `search` and `lod_search`. */
  limit?: number;
  /** Names the PDF page that justifies the expectation: `PDF p.101`. */
  note: string;
  /** One of the 14 queries that used to be an `it.each` list in retrieval.test.ts. */
  legacy_top_ten?: boolean;
}

export interface ExpectedReview {
  review_status?: SearchDocument['review_status'];
  section_status?: SearchDocument['section_status'];
  governing_review?: SearchDocument['governing_review'];
  open_issues?: SearchDocument['open_issues'];
}

export interface AcceptanceFixture {
  description: string;
  cases: AcceptanceCase[];
}

/** The slice of `Retrieval` the checker needs. */
export interface AcceptanceContext {
  document(id: string): SearchDocument | null;
}

const NOTE_PAGE = /PDF p\.\s?(\d+)/g;

export function checkAcceptanceFixture(
  fixture: AcceptanceFixture,
  context: AcceptanceContext,
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const entry of fixture.cases) {
    const at = (message: string): void => void problems.push(`${entry.id}: ${message}`);
    if (seen.has(entry.id)) problems.push(`duplicate case id ${entry.id}`);
    seen.add(entry.id);
    if (!(ACCEPTANCE_CATEGORIES as readonly string[]).includes(entry.category))
      at(`unknown category "${entry.category}"`);
    if (!(ACCEPTANCE_OPERATIONS as readonly string[]).includes(entry.operation))
      at(`unknown operation "${entry.operation}"`);
    if ('limit' in entry.input) at('input.limit belongs in the case limit field');
    if (entry.limit !== undefined) {
      if (!Number.isInteger(entry.limit) || entry.limit < 1) at(`limit ${entry.limit} is invalid`);
      else if (entry.limit > DEFAULT_RESULT_LIMIT)
        at(`limit ${entry.limit} is looser than the default of ${DEFAULT_RESULT_LIMIT}`);
    }
    for (const id of entry.expect_ids)
      if (!context.document(id)) at(`expected id ${id} is not in the corpus`);

    if (entry.expect_missing) {
      if (entry.operation !== 'get' && entry.operation !== 'lod_get')
        at('expect_missing needs a get or lod_get operation');
      if (entry.expect_ids.length > 0) at('expect_missing and expect_ids are exclusive');
      const asked = entry.input.id;
      if (typeof asked === 'string' && context.document(asked))
        at(`id ${asked} exists, so it cannot be a missing-id case`);
      if (!entry.note.trim()) at('note is empty');
      continue;
    }
    if (entry.expect_ids.length === 0) at('expect_ids is empty');
    if (entry.expect_review && !(LIBRARY_OPERATIONS as readonly string[]).includes(entry.operation))
      at('expect_review needs a library operation; agent tools never show review state');

    const cited = new Set(
      entry.expect_ids.flatMap(
        (id) => context.document(id)?.citations.flatMap((c) => c.pdf_page ?? []) ?? [],
      ),
    );
    const pages = [...entry.note.matchAll(NOTE_PAGE)].map((match) => Number(match[1]));
    if (!pages.some((page) => cited.has(page)))
      at(
        `note must name a PDF page that an expected record cites ("PDF p.N"); got "${entry.note}"`,
      );
  }
  return problems;
}

export interface AcceptanceHit {
  id: string;
  citations: Array<{ pdf_page?: number | null }>;
}

export interface AcceptanceOutcome {
  /** Ids returned, in order. */
  ids: string[];
  missing: boolean;
  /** True for `lod_*` operations: `output` is the agent-tool result. */
  tool: boolean;
  /** Raw agent-tool output (tool operations only). */
  output: unknown;
  /** Every returned record that carries citations. */
  hits: AcceptanceHit[];
  /** Full search documents behind the hits (library operations only). */
  documents: SearchDocument[];
  externalDocuments: string[];
}

const stringList = (value: unknown): string[] | undefined =>
  Array.isArray(value) ? (value as string[]) : undefined;

export function runAcceptanceCase(retrieval: Retrieval, entry: AcceptanceCase): AcceptanceOutcome {
  const { input } = entry;
  const limit = entry.limit ?? DEFAULT_RESULT_LIMIT;
  const library = (documents: SearchDocument[]): AcceptanceOutcome => ({
    ids: documents.map((doc) => doc.id),
    missing: documents.length === 0,
    tool: false,
    output: undefined,
    hits: documents,
    documents,
    externalDocuments: (documents[0]?.external_dependencies ?? []).map((dep) => dep.document),
  });

  switch (entry.operation) {
    case 'get': {
      const found = retrieval.get(String(input.id));
      return library(found ? [found.document] : []);
    }
    case 'resolve':
      return library(retrieval.resolve(String(input.name)));
    case 'search':
      return library(
        retrieval
          .search(String(input.query), {
            kinds: stringList(input.kinds) as SearchDocument['kind'][] | undefined,
            scope: input.scope as string | undefined,
            questId: input.quest_id as string | undefined,
            limit,
          })
          .flatMap((hit) => retrieval.document(hit.id) ?? []),
      );
  }

  const withLimit = entry.operation === 'lod_search' ? { ...input, limit } : input;
  const output = runRetrievalTool(retrieval, entry.operation, withLimit);
  const toolOutcome = (partial: Partial<AcceptanceOutcome>): AcceptanceOutcome => ({
    ids: [],
    missing: false,
    tool: true,
    output,
    hits: [],
    documents: [],
    externalDocuments: [],
    ...partial,
  });
  if (entry.operation === 'lod_expand') {
    const edges = output as Array<{ target: string }>;
    return toolOutcome({ ids: edges.map((edge) => edge.target) });
  }
  const records = (Array.isArray(output) ? output : [output]) as Array<{
    id: string;
    found?: boolean;
    citations?: AcceptanceHit['citations'];
    external_dependencies?: Array<{ document: string }>;
  }>;
  if (!Array.isArray(output) && records[0]?.found === false) return toolOutcome({ missing: true });
  return toolOutcome({
    ids: records.map((record) => record.id),
    hits: records.map((record) => ({ id: record.id, citations: record.citations ?? [] })),
    externalDocuments: (records[0]?.external_dependencies ?? []).map((dep) => dep.document),
  });
}
