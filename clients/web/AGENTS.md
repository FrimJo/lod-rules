# AGENTS.md (web client)

TanStack Start (Vite) rules Q&A consumer. It calls the root `scripts/ask` pipeline on the
server and shows the evidence first; an OpenRouter model writes an answer only when the reader
asks for one (or opts into automatic answers). It is **not** part of the canonical corpus.

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
OPENAI_ROUTER_API_KEY=sk-or-... npm run dev    # http://localhost:1234
npm run typecheck
npm test
```

Needs Node 22.5+ (`node:sqlite` on the server). Env: see [.env.example](.env.example) and
[README.md](README.md).

## Deployment

Vercel, through Nitro (`nitro/vite` in [vite.config.ts](vite.config.ts)). Server code reads
data through `dataRoot` from `src/server/data-root.ts`, never `repoRoot`: the deployed server
reads a data bundle (`build/bundle-data.ts`) instead of the checkout. A new file the server
reads at runtime must be added to that bundle. Laya is shelved here; keep onnxruntime out of
the server build. See [README.md](README.md#deploying-to-vercel).

## Stack

TanStack Start, `@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-react`, TanStack Query.
No Convex. Do not add a separate backend under `clients/web/` beyond the Start server routes
unless the user explicitly requests it.

## Docs

- [README.md](README.md) — run, retrieval modes, rulebook viewer
- [../../docs/web-client-static-bundle-plan.md](../../docs/web-client-static-bundle-plan.md) — proposed static/browser-only direction (not implemented)
