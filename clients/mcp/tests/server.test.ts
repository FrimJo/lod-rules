import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

// Spawn the real entry point from outside the repo, as another project's .mcp.json would.
const bin = fileURLToPath(new URL('../bin/lod-rules-mcp.mjs', import.meta.url));
const client = new Client({ name: 'lod-rules-mcp-test', version: '0.0.0' });

const text = (result: { content?: unknown }): string => {
  const [block] = result.content as Array<{ type: string; text?: string }>;
  assert.equal(block?.type, 'text');
  return block.text ?? '';
};

before(async () => {
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [bin],
      cwd: '/',
      stderr: 'ignore',
    }),
  );
});
after(() => client.close());

/** Everything a connected agent can see, before and after calling tools. */
const MAINTENANCE = /corpus|extract|review|issue|yaml|coverage|canonical|unreviewed/i;

describe('lod-rules MCP server', () => {
  it('lists four read-only rulebook tools', async () => {
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name),
      ['lod_search', 'lod_get', 'lod_resolve', 'lod_expand'],
    );
    for (const tool of tools) {
      assert.equal(tool.annotations?.readOnlyHint, true, tool.name);
      assert.equal(tool.inputSchema.type, 'object', tool.name);
    }
  });

  it('puts nothing about corpus maintenance in the agent context', async () => {
    assert.equal(client.getInstructions(), undefined);
    assert.equal(client.getServerCapabilities()?.resources, undefined);
    const { tools } = await client.listTools();
    assert.doesNotMatch(JSON.stringify(tools), MAINTENANCE);
    const { prompts } = await client.listPrompts();
    assert.doesNotMatch(JSON.stringify(prompts), MAINTENANCE);
  });

  it('answers tool calls with rulebook content', async () => {
    const resolved = JSON.parse(
      text(await client.callTool({ name: 'lod_resolve', arguments: { name: 'AP' } })),
    ) as Array<{ id: string }>;
    assert.ok(resolved.some((doc) => doc.id === 'term.action_points'));

    const hits = JSON.parse(
      text(
        await client.callTool({
          name: 'lod_search',
          arguments: { query: 'hit location', kinds: ['table'], limit: 3 },
        }),
      ),
    ) as Array<{ id: string }>;
    assert.ok(hits.some((hit) => hit.id === 'table.combat.hit_location'));

    const raw = text(
      await client.callTool({ name: 'lod_get', arguments: { id: 'table.combat.hit_location' } }),
    );
    const record = JSON.parse(raw) as { text: string; citations: unknown[]; data: unknown };
    assert.match(record.text, /3-5 \| Torso \(check gear\)/);
    assert.ok(record.citations.length > 0);
    assert.doesNotMatch(raw, /review_status|issue_ids|"file"|extraction|\.yaml/);
  });

  it('reports bad input as a tool error', async () => {
    const result = await client
      .callTool({ name: 'lod_expand', arguments: { id: 'term.battle', depth: 9 } })
      .catch((error: unknown) => ({
        isError: true,
        content: [{ type: 'text', text: String(error) }],
      }));
    assert.equal(result.isError, true);
  });

  it('offers the rules_question prompt', async () => {
    const prompt = await client.getPrompt({
      name: 'rules_question',
      arguments: { question: 'How many AP does a hero have?' },
    });
    const [message] = prompt.messages;
    const body = (message?.content as { text: string }).text;
    assert.match(body, /How many AP does a hero have\?/);
    assert.doesNotMatch(body, MAINTENANCE);
  });
});
