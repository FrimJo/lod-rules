# lod-rules MCP server

A local [Model Context Protocol](https://modelcontextprotocol.io) server that gives Claude
agents read-only access to the _League of Dungeoneers_ rulebook. It is built for agents that
consume the rules, such as those building the LoD helper app. They query it instead of
loading the rulebook PDF or 7 MB of YAML into context.

It is a thin stdio wrapper around `scripts/retrieve/tools.ts`. The tool definitions,
input validation and output projection live there; this package only publishes them over MCP.

## What it exposes

| Kind   | Name             | Purpose                                                                 |
| ------ | ---------------- | ----------------------------------------------------------------------- |
| Tool   | `lod_search`     | Word search over rules, entities, tables, procedures and glossary terms |
| Tool   | `lod_get`        | One record: verbatim text, page citations, links, structured data       |
| Tool   | `lod_resolve`    | Exact name/abbreviation lookup (`AP`, `Molgor`)                         |
| Tool   | `lod_expand`     | Follow typed links (`uses_table`, `depends_on`, …) in or out            |
| Prompt | `rules_question` | Answer a rules question with citations (only when a user invokes it)    |

**Rulebook only.** A connected agent's context holds the four tool definitions and the
rulebook content it asks for, nothing else:

- No server instructions and no resources.
- No review issues.
- No extraction status, confidence or coverage.
- No YAML or PDF file paths, and no ranking scores.

Corpus maintainers get that detail from `npm run retrieve` in the repository root.

All tools are marked read-only and idempotent. The server watches the canonical YAML. When
it changes, the next tool call (at most 10 seconds later) re-indexes, so answers stay current.

## Setup

Node 22.5+ (`node:sqlite`).

```bash
npm install                     # repo root: corpus loaders
npm install --prefix clients/mcp
npm run retrieve -- build       # optional: prebuilt index, faster startup
```

Without a current prebuilt index the server indexes the YAML in memory at startup
(about two seconds).

## Using it from Claude Code

**In this repository** it is registered in the root [`.mcp.json`](../../.mcp.json). It
starts from any subdirectory because it finds the repository root with git. Approve it once
when Claude Code asks; Claude Code does not let a checked-in file approve its own servers.
`.claude/settings.json` pre-allows its tools (`mcp__lod-rules`), so calls don't prompt.
Run `/mcp` to check that `lod-rules` is connected. The prompt is available as
`/mcp__lod-rules__rules_question`.

**In the helper app's repository**, add the server once for your user (adjust the path):

```bash
claude mcp add --scope user lod-rules -- node /path/to/lod-rules/clients/mcp/bin/lod-rules-mcp.mjs
```

Or commit a `.mcp.json` there:

```json
{
  "mcpServers": {
    "lod-rules": {
      "command": "node",
      "args": ["/path/to/lod-rules/clients/mcp/bin/lod-rules-mcp.mjs"]
    }
  }
}
```

The entry point resolves everything relative to itself, so it runs from any working
directory.

## Using it from the Claude Agent SDK

The helper app's own agents can use the same server:

```ts
import { query } from '@anthropic-ai/claude-agent-sdk';

for await (const message of query({
  prompt: 'Can a hero cast a spell while in battle?',
  options: {
    mcpServers: {
      'lod-rules': {
        command: 'node',
        args: ['/path/to/lod-rules/clients/mcp/bin/lod-rules-mcp.mjs'],
      },
    },
    allowedTools: ['mcp__lod-rules__*'],
  },
})) {
  // …
}
```

An app that calls the Messages API directly does not need MCP: import `RETRIEVAL_TOOLS`
and `runRetrievalTool` from `scripts/retrieve/tools.ts`
(see [docs/retrieval.md](../../docs/retrieval.md#wiring-an-llm-client)).

## Development

```bash
npm run typecheck
npm test          # spawns the server over stdio and exercises every capability
npm run inspect   # MCP Inspector UI against the server
```
