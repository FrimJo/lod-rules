# AGENTS.md (web client)

TanStack Start (Vite) rules Q&A consumer. It calls the root `scripts/ask` pipeline on the
server and shows the evidence first; an OpenRouter model writes an answer only when the reader
asks for one (or opts into automatic answers). It is **not** part of the canonical corpus.

## Game master's table (`/gm`)

A second island in the same app: `src/routes/gm.tsx` and `src/gm/`. It tracks a dungeon run
for the Game Master (Threat, light sources, Party Morale, each hero's Sanity and conditions,
rations, rests, Wandering Monster tokens, standing modifiers) and resolves the follow-ups the
book asks for. It is browser-only: state lives in `localStorage`, no server function or LLM is
involved, and the only shared code is the rulebook viewer for page citations. It has its own
skin (`src/gm/gm.css`, everything scoped under `.gm`); the rest of the app's look does not
apply.

- `src/gm/rules.ts` holds the rulebook facts it runs on, each with a page citation and the
  corpus record id: the two Threat tables, the Door Table, morale, Sanity and mental
  condition tables, light rules, initiative token rules, enemy activation order, quest
  presets. `tests/gm-rules.test.ts` reads those records back through `runRetrievalTool` and
  fails when a value or page drifts from the corpus. Change a fact in the corpus first; never
  make the table "know" something the corpus does not. Where the corpus applies a designer
  ruling instead of the printed value (a hero's death −5, hunger −1 per hungry character, the
  rest's +2), the row keeps the printed `effect` and carries the applied value in `ruled`.
- `src/gm/engine.ts` is a pure reducer plus derived views (`modeOf`, `standingEffects`,
  `initiativeBag`, `encounterChance`); `tests/gm-engine.test.ts` covers it. Keep rules out of
  the components. State is versioned (`STATE_VERSION`); `reviveState` migrates older saved
  tables rather than discarding them.
- The screen is built as a cockpit, not a page: a **rim** of gauges (turn dial with the five
  printed steps, Threat track, light, Party Morale, the party as tokens, standing effects),
  a **stage** that shows one thing to resolve (pending prompts first, then the card for the
  current turn step), a **"What happened?" palette** grouped by moment at the table (door,
  tile, battle, party) where one tap applies every printed consequence, and **drawers** for
  the details. Dice are entered on pads showing the die's faces (`DicePad.tsx`); tables the
  book makes the Game Master roll on (Threat tables, mental conditions, Door Table) are shown
  as tappable rows. Every citation chip peeks the heading and, where the data carries it,
  the printed words, and opens the rulebook pane.
- Where the book is silent (the general effects of darkness, the value Threat resets to on a
  new dungeon level, a second Scenario-die +1, a quest threshold crossed without landing on
  it) the table says so in `GAPS` and asks the Game Master. Do not fill those gaps in the
  client; extract them into the corpus.

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
