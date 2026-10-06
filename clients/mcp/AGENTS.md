# AGENTS.md (MCP server)

A stdio MCP server that publishes the root retrieval tools (`scripts/retrieve/tools.ts`) to
Claude agents. It is a consumer, **not** part of the canonical corpus. See
[README.md](README.md) for what it exposes and how to connect it.

## Boundaries

- Read-only. Never write or modify files under `corpus/`, `schemas/`, `review/` or
  `generated/`. Every tool keeps `readOnlyHint: true`.
- Rulebook content only. Connected agents consume the rules (for example, while building
  the helper app); they do not maintain the corpus. Do not add server instructions,
  resources, tools or prompt text about review issues, extraction status, coverage, YAML
  files or other corpus bookkeeping. `tests/server.test.ts` checks this.
- Tool names, descriptions, input schemas and validation belong in
  `scripts/retrieve/tools.ts`. Change them there (with `tests/retrieve/tools.test.ts`), not
  here, so the MCP server, the CLI (`npm run retrieve -- tools|call`) and direct API clients
  stay identical.
- No LLM client here. The server answers tool calls; the agent owns the model.
- stdout carries the protocol. Log only to stderr.
- Root `npm run validate`, `npm test` and `npm run lint` exclude this package. Use its own
  checks.

## Commands

From repo root (once): `npm install`, then `npm install --prefix clients/mcp`.

From this directory:

```bash
npm run typecheck
npm test
npm run inspect
```

After changing a tool in `scripts/retrieve/tools.ts`, run the root gate and this package's
`npm test`, then reconnect the server (`/mcp` in Claude Code) to pick up the new definitions.
