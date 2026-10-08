# AGENTS.md (web client)

TanStack Start (Vite) rules Q&A consumer. It calls the root `scripts/ask` pipeline on the
server and shows the evidence first; an OpenRouter model writes an answer only when the reader
asks for one (or opts into automatic answers). It is **not** part of the canonical corpus.

## Game master's table (`/gm`)

A second island in the same app: `src/routes/gm.tsx` and `src/gm/`. It tracks a dungeon run
for the Game Master (Threat, light sources, Party Morale, each hero's Sanity and conditions,
rations, rests, Wandering Monster tokens) and lists the follow-ups the book asks for. It is
browser-only: state lives in `localStorage`, no server function or LLM is involved, and the
only shared code is the rulebook viewer for page citations.

- `src/gm/rules.ts` holds the rulebook facts it runs on, each with a page citation and the
  corpus record id. `tests/gm-rules.test.ts` reads those records back through
  `runRetrievalTool` and fails when a value or page drifts from the corpus. Change a fact in
  the corpus first; never make the table "know" something the corpus does not.
- `src/gm/engine.ts` is a pure reducer; `tests/gm-engine.test.ts` covers it. Keep rules out
  of the components.
- Where the corpus has not extracted a rule yet (the Threat tables on p. 89, the post-battle
  Threat increase, the effects of darkness) the table says so and asks the Game Master. Do
  not fill those gaps in the client; extract them into the corpus.

## Character creator (`/character`)

A third island: `src/routes/character.tsx` and `src/character/`. It walks a player through
the book's creation sequence (species, stat rolls with the two rerolls, 15-point
specialisation, profession with talents, spells, prayers and the Arcane perk, optional
Background, starting equipment with the 1d4 wear rolls, final touches) and ends with a sheet
to copy onto the printed character sheet. Browser-only, `localStorage`, no server function.

- `src/character/rules.ts` holds the rulebook facts with page citations and corpus record ids:
  species tables, profession skill tables, every Appendix II talent, Level 1 spells, level 1
  prayers, Arcane perks, relics, the twenty Backgrounds, the Weapons and Armour tables.
  `tests/character-rules.test.ts` reads them back through `runRetrievalTool` and fails on
  drift. Change a fact in the corpus first.
- `src/character/engine.ts` is a pure reducer plus `derive()`; `tests/character-engine.test.ts`
  covers it. Keep rules out of the components.
- Where the book is silent (the die for a random talent, an ineligible random talent, Mana
  rounding, the Backgrounds die, which non-weapon items take wear) the creator says so in a
  purple "gap" note and lets the player decide. Do not fill those gaps in the client.

## Boundaries

- Never write or modify files under `corpus/`, `schemas/`, or `review/`.
- Root `npm run validate`, `npm test`, and `npm run lint` exclude this package; use this
  package's own checks instead.
- Shared logic lives in `../../scripts/`; import from there rather than duplicating ask
  behavior in the client.
- `src/gm/` and `src/character/` read rulebook content only from their `rules.ts`, which the
  corpus-consistency tests pin to corpus records.

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
- [docs/static-bundle-plan.md](docs/static-bundle-plan.md) — proposed static/browser-only direction (not implemented)
