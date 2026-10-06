import {
  McpServer,
  fromJsonSchema,
  type CallToolResult,
  type JsonSchemaType,
} from '@modelcontextprotocol/server';
import {
  RETRIEVAL_TOOLS,
  ToolInputError,
  runRetrievalTool,
  type RetrievalToolName,
} from '../../../scripts/retrieve/tools.ts';
import type { LiveRetrieval } from './corpus.ts';

const TITLES: Record<RetrievalToolName, string> = {
  lod_search: 'Search the LoD rulebook',
  lod_get: 'Read an LoD rulebook record',
  lod_resolve: 'Look up an LoD name or abbreviation',
  lod_expand: 'Follow LoD rulebook links',
};

const json = (value: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value) }],
});

/**
 * Rulebook-only by design: no server instructions or resources, so a connected agent's
 * context holds just the tool definitions and the rulebook content it asks for.
 */
export function createLodServer(live: LiveRetrieval, version = '0.0.0'): McpServer {
  const server = new McpServer({
    name: 'lod-rules',
    title: 'League of Dungeoneers rulebook',
    version,
  });

  for (const tool of RETRIEVAL_TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: TITLES[tool.name],
        description: tool.description,
        // Plain JSON Schema literals; `tools.ts` stays free of MCP types.
        inputSchema: fromJsonSchema<Record<string, unknown>>(tool.input_schema as JsonSchemaType),
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      (args) => {
        try {
          return json(runRetrievalTool(live.current(), tool.name, args));
        } catch (error) {
          if (!(error instanceof ToolInputError)) throw error;
          return { isError: true, content: [{ type: 'text', text: error.message }] };
        }
      },
    );
  }

  // Enters context only when a user runs /mcp__lod-rules__rules_question.
  server.registerPrompt(
    'rules_question',
    {
      title: 'Answer an LoD rules question',
      description:
        'Answer a League of Dungeoneers rules question from the rulebook, with page citations.',
      argsSchema: fromJsonSchema<{ question: string }>({
        type: 'object',
        properties: { question: { type: 'string', description: 'The rules question.' } },
        required: ['question'],
      }),
    },
    ({ question }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Answer this League of Dungeoneers rules question from the rulebook, using the lod_* tools.

Question: ${question}

Read each record you rely on with lod_get. Answer in the rulebook's own terms, cite PDF/printed pages, and name the quest for quest-only rules. If the rulebook does not say, or defers to a book that is not available, say so.`,
          },
        },
      ],
    }),
  );

  return server;
}
