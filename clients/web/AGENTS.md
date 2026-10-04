# AGENTS.md (web client)

TanStack Start (Vite) rules Q&A consumer. It calls the root `scripts/ask` pipeline on the
server and streams OpenAI for the final answer. It is **not** part of the canonical corpus.

## Boundaries

- Never write or modify files under `corpus/`, `schemas/`, or `review/`.
- Root `npm run validate`, `npm test`, and `npm run lint` exclude this package; use this
  package's own checks instead.
- Shared logic lives in `../../scripts/`; import from there rather than duplicating ask
  behavior in the client.

## Commands

From repo root (once): `npm install`. Optional: `npm run retrieve -- build`.

From this directory:

```bash
npm install
OPENAI_API_KEY=sk-... npm run dev    # http://localhost:1234
npm run typecheck
npm test
```

Needs Node 22.5+ (`node:sqlite` on the server). Env: see [.env.example](.env.example) and
[README.md](README.md).

## Stack

TanStack Start, `@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-react`, TanStack Query.
No Convex. Do not add a separate backend under `clients/web/` beyond the Start server routes
unless the user explicitly requests it.

## Docs

- [README.md](README.md) — run, retrieval modes, rulebook viewer
- [../../docs/web-client-static-bundle-plan.md](../../docs/web-client-static-bundle-plan.md) — proposed static/browser-only direction (not implemented)
