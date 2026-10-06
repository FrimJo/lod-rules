import type { Table } from '../validate/pilot-types.ts';
import {
  printedTableText,
  type Citation,
  type DocumentKind,
  type SearchDocument,
} from './documents.ts';
import type { Retrieval, SearchHit } from './index.ts';

/**
 * Agent tools for reading the rulebook, for consumers such as agents building the LoD
 * helper app. Each definition uses the shape the Claude Messages API expects in `tools`
 * (`name`, `description`, `input_schema` as JSON Schema). No LLM client here: a consumer
 * passes the definitions to its model and routes each call through `runRetrievalTool`.
 *
 * Descriptions and results carry rulebook content only. Corpus bookkeeping (review issues,
 * extraction status and confidence, YAML paths, coverage) is stripped so it never enters a
 * consumer's context. Maintainers see it through `npm run retrieve -- search|get|issues`.
 */
export interface ToolDefinition {
  name: RetrievalToolName;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
}

export type RetrievalToolName = 'lod_search' | 'lod_get' | 'lod_resolve' | 'lod_expand';

/** Raised for malformed tool input; report it to the model as an error tool result. */
export class ToolInputError extends Error {}

const KINDS = ['rule', 'entity', 'table', 'procedure', 'state_machine', 'term'] as const;
const SCOPES = ['global', 'quest', 'settlement', 'character_creation', 'battle', 'dungeon'];

/** Corpus bookkeeping removed from canonical records, at any depth. */
const BOOKKEEPING_KEYS = new Set([
  'status',
  'confidence',
  'completeness',
  'extraction',
  'locator',
  'file',
  'issues',
  'unresolved_references',
]);
/** Top-level record keys that repeat fields `lod_get` already returns, or locate corpus files. */
const REPEATED_KEYS = new Set([
  'id',
  'name',
  'kind',
  'type',
  'aliases',
  'definition',
  'source',
  'source_text',
  'section_id',
]);

const id = {
  type: 'string',
  description: 'Exact record id from an earlier result, e.g. "table.combat.hit_location".',
};

export const RETRIEVAL_TOOLS: ToolDefinition[] = [
  {
    name: 'lod_search',
    description:
      'Search the League of Dungeoneers rulebook: rules, entities, tables, procedures, state ' +
      'machines and glossary terms. Matching is by words, not meaning; if a search misses, ' +
      'retry with rulebook vocabulary ("poison cure" rather than "recover from poison"). Hits ' +
      'are summaries with page citations; call lod_get before relying on a rule or table. ' +
      'Quest-only records rank lower unless the query names the quest or quest_id is set.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search words, or an exact record id.' },
        kinds: {
          type: 'array',
          items: { type: 'string', enum: [...KINDS] },
          description: 'Restrict to these record kinds. Default: all.',
        },
        scope: {
          type: 'string',
          enum: SCOPES,
          description: 'Restrict to one scope. "quest" records apply only inside their quest.',
        },
        quest_id: {
          type: 'string',
          description:
            'Restrict to records of one quest, e.g. "quest.chamber_of_reverence.closing_portal".',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          description: 'Maximum hits. Default 10.',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'lod_get',
    description:
      'Read one record by id: the verbatim rulebook text, PDF and printed page citations, ' +
      'scope (a "quest" record applies only inside quest_id), links to related records, books ' +
      'it depends on that are not available (external_dependencies), and structured data ' +
      '(table columns and rows, effects, conditions, steps, stats).',
    input_schema: {
      type: 'object',
      properties: { id },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'lod_resolve',
    description:
      'Look up records by exact name or abbreviation, ignoring case, accents and a leading ' +
      '"the": "AP", "Molgor", "Potion of Cure Poison". Use lod_search for descriptions.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'A name, title or abbreviation as printed.' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'lod_expand',
    description:
      'Follow links from a record. "out" edges are what it uses or refers to (uses_table, ' +
      'depends_on, see_also, table, rule, entity, quest, …); "in" edges are what refers to it.',
    input_schema: {
      type: 'object',
      properties: {
        id,
        direction: { type: 'string', enum: ['out', 'in', 'both'], description: 'Default "both".' },
        relations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Only follow these link types, e.g. ["uses_table"]. Default: all.',
        },
        depth: { type: 'integer', minimum: 1, maximum: 3, description: 'Hops. Default 1.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
];

interface Summary {
  id: string;
  kind: DocumentKind;
  type: string;
  title: string;
  context: string;
  scope: string;
  quest_id?: string;
  citations: Array<Omit<Citation, 'file' | 'locator'>>;
}

function citations(list: Citation[]): Summary['citations'] {
  return list.map(({ file: _file, locator: _locator, ...citation }) => citation);
}

function summary(doc: SearchDocument | SearchHit): Summary {
  return {
    id: doc.id,
    kind: doc.kind,
    type: doc.type,
    title: doc.title,
    context: doc.context,
    scope: doc.scope,
    ...(doc.quest_id ? { quest_id: doc.quest_id } : {}),
    citations: citations(doc.citations),
  };
}

/** Table snippets come from the printed cells; the index also holds the table's source_text. */
function snippet(retrieval: Retrieval, hit: SearchHit): string {
  if (hit.kind !== 'table') return hit.snippet;
  const table = retrieval.get(hit.id)?.record as Table | undefined;
  return table ? printedTableText(table).slice(0, 200) : '';
}

/** Review issue ids can sit under any key (`issue_id`, `on_missing_issue`, …). */
const isIssueId = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('issue.');

function withoutBookkeeping(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((item) => !isIssueId(item)).map(withoutBookkeeping);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, child]) => !BOOKKEEPING_KEYS.has(key) && !isIssueId(child))
      .map(([key, child]) => [key, withoutBookkeeping(child)]),
  );
}

function rulebookRecord(retrieval: Retrieval, recordId: string): unknown {
  const found = retrieval.get(recordId);
  if (!found || found.document.kind === 'issue') {
    return {
      found: false,
      id: recordId,
      hint: 'No record has this id. Use lod_search or lod_resolve to find one.',
    };
  }
  const { document, record } = found;
  const data =
    typeof record === 'object' && record !== null
      ? Object.fromEntries(Object.entries(record).filter(([key]) => !REPEATED_KEYS.has(key)))
      : {};
  const links = document.relations.filter((relation) => {
    const target = retrieval.document(relation.target);
    return target !== null && target.kind !== 'issue';
  });
  return {
    ...summary(document),
    ...(document.aliases.length > 0 ? { aliases: document.aliases } : {}),
    // A table's source_text may be a curator note; its cells and footnotes are as printed.
    text: document.kind === 'table' ? printedTableText(record as Table) : document.text,
    ...(links.length > 0 ? { links } : {}),
    ...(document.external_dependencies.length > 0
      ? { external_dependencies: document.external_dependencies }
      : {}),
    data: withoutBookkeeping(data),
  };
}

function record(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    throw new ToolInputError('input must be an object');
  return input as Record<string, unknown>;
}

function string(input: Record<string, unknown>, key: string, required: true): string;
function string(input: Record<string, unknown>, key: string, required?: false): string | undefined;
function string(input: Record<string, unknown>, key: string, required = false): string | undefined {
  const value = input[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || value.trim() === '')
    throw new ToolInputError(`${key} must be a non-empty string`);
  return value;
}

function strings(input: Record<string, unknown>, key: string): string[] | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((v): v is string => typeof v === 'string'))
    throw new ToolInputError(`${key} must be an array of strings`);
  return value;
}

function integer(
  input: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
): number | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    throw new ToolInputError(`${key} must be an integer from ${min} to ${max}`);
  return value;
}

function oneOf<T extends string>(
  input: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = string(input, key);
  if (value === undefined) return undefined;
  if (!(allowed as readonly string[]).includes(value))
    throw new ToolInputError(`${key} must be one of ${allowed.join(', ')}`);
  return value as T;
}

function rejectUnknown(input: Record<string, unknown>, name: RetrievalToolName): void {
  const definition = RETRIEVAL_TOOLS.find((tool) => tool.name === name)!;
  const unknown = Object.keys(input).filter((key) => !(key in definition.input_schema.properties));
  if (unknown.length > 0) throw new ToolInputError(`unknown input: ${unknown.join(', ')}`);
}

export function isRetrievalTool(name: string): name is RetrievalToolName {
  return RETRIEVAL_TOOLS.some((tool) => tool.name === name);
}

/**
 * Runs one tool call and returns a JSON-serialisable result. Throws `ToolInputError` for an
 * unknown tool or malformed input; a missing id is a normal result, not an error.
 */
export function runRetrievalTool(retrieval: Retrieval, name: string, rawInput: unknown): unknown {
  if (!isRetrievalTool(name)) throw new ToolInputError(`unknown tool "${name}"`);
  const input = record(rawInput);
  rejectUnknown(input, name);
  switch (name) {
    case 'lod_search': {
      const kinds = strings(input, 'kinds');
      const invalid = kinds?.filter((kind) => !(KINDS as readonly string[]).includes(kind));
      if (invalid && invalid.length > 0)
        throw new ToolInputError(
          `kinds must be among ${KINDS.join(', ')}; got ${invalid.join(', ')}`,
        );
      return retrieval
        .search(string(input, 'query', true), {
          kinds: (kinds as DocumentKind[] | undefined) ?? [...KINDS],
          scope: oneOf(input, 'scope', SCOPES),
          questId: string(input, 'quest_id'),
          limit: integer(input, 'limit', 1, 50),
        })
        .filter((hit) => hit.kind !== 'issue')
        .map((hit) => ({ ...summary(hit), snippet: snippet(retrieval, hit) }));
    }
    case 'lod_get':
      return rulebookRecord(retrieval, string(input, 'id', true));
    case 'lod_resolve':
      return retrieval
        .resolve(string(input, 'name', true))
        .filter((doc) => doc.kind !== 'issue')
        .map(summary);
    case 'lod_expand': {
      const recordId = string(input, 'id', true);
      if (retrieval.document(recordId)?.kind === 'issue') return [];
      return retrieval
        .expand(recordId, {
          direction: oneOf(input, 'direction', ['out', 'in', 'both'] as const),
          relations: strings(input, 'relations'),
          depth: integer(input, 'depth', 1, 3),
          skipKinds: ['issue'],
        })
        .filter((edge) => edge.found)
        .map(({ found: _found, ...edge }) => edge);
    }
  }
}
