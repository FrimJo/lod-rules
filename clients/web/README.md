# lod-rules web client

A browser chat for League of Dungeoneers rules questions. It is built with TanStack Start
(Vite), `@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-react` and TanStack Query.

Each question goes through the same `ask()` pipeline as `npm run ask` (analysis, then
deterministic retrieval, then the grounded prompt). That runs on the server. The prompt
becomes the system prompt for an OpenAI chat stream. The UI shows the answer, the evidence
records (scope, pages, issues, external books) and the `checkCitations()` result.

## Run

Needs Node 22.5 or newer (`node:sqlite`) and the root repo's dependencies installed.

```bash
cd ../.. && npm install && npm run retrieve -- build   # optional: prebuilt SQLite index
cd clients/web && npm install
OPENAI_API_KEY=sk-... npm run dev                      # http://localhost:3000
```

The server reads settings from the process environment first, then the root
`.env.local`. See [.env.example](.env.example) for `OPENAI_API_KEY`, `OPENAI_MODEL` and
`LOD_ANALYZER`.

Retrieval uses only the latest question; earlier turns go to the model as conversation
history. `npm run typecheck` checks this package. The root gate ignores `clients/`.
