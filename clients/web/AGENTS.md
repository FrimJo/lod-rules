# AGENTS.md (web client)

TanStack Start (Vite) rules Q&A consumer. It calls the root `scripts/ask` pipeline on the
server and shows the evidence first; an OpenRouter model writes an answer only when the reader
asks for one (or opts into automatic answers). It is **not** part of the canonical corpus.

## Game master's table (`/gm`)

A second island in the same app: `src/routes/gm.tsx` and `src/gm/`. It tracks a dungeon run
for the Game Master (Threat, light sources, Party Morale, each hero's Sanity and conditions,
rations, rests, Wandering Monster tokens, standing modifiers) and resolves the follow-ups the
book asks for. It is browser-only: state lives in `localStorage`, no server function or LLM is
involved, and the only shared code is the rulebook viewer for page citations. It wears the
app's shared skin (see "Skin" below); `src/gm/gm.css` adds only the table's own parts,
everything scoped under `.gm`.

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

A third island: `src/routes/character.tsx` and `src/character/`. It builds a whole party, one
sheet per hero, through the book's creation sequence as nine **stations** (species, dice,
specialise, profession, powers, background, market, loadout, sheet) and ends with a sheet to
copy onto the printed character sheet. Browser-only, `localStorage`, no server function. It
wears the app's shared skin; `src/character/character.css` adds only the creator's own parts,
everything scoped under `.cc`. It reuses the table's `DicePad` for every die.

- `src/character/rules.ts` holds the rulebook facts with page citations and corpus record ids:
  species tables, profession skill tables, every Appendix II talent, Level 1 spells, level 1
  prayers, Arcane perks, relics, the twenty Backgrounds, the Weapons, Armour and Shield tables,
  the general equipment tables (light, consumables, tools, miscellaneous, alchemy, jewellery),
  the weapon and armour special rules, the carry rules, the Alchemist's kit tables, the
  abbreviation glossary (`TERMS`) and the start-of-game data. `tests/character-rules.test.ts`
  reads them back through `runRetrievalTool` and fails on drift. Change a fact in the corpus
  first.
- `src/character/engine.ts` is a pure reducer plus `derive()` per hero and `deriveParty()`;
  `tests/character-engine.test.ts` covers it. State is a `PartyState` (version 2); a version 1
  single-hero save is migrated. `derive()` also builds the **loadout** (hands, Hit Areas with
  DEF, Quick Slots with `/X` stacking, backpack), the **standing effects** gear carries into
  play (Clunky, stacked armour, backpack DEX, overload) and the **todo** queue of open
  decisions. Keep rules out of the components.
- The screen: a **roster** of the party down the side (completeness ring per hero, Party
  Morale summed from RES), a **stage** with the station strip, the open questions queued
  above the card, and the card for the current station, and a **ghost sheet** that fills in
  as the dice land; every number on it jumps to the station that decides it. The Sheet
  station shows every field as a tile the player ticks off while writing, and hands the
  party to the Game Master's table (`src/character/handoff.ts`, through the table's store).
- Every abbreviation the sheet prints (`CS`, `ENC`, `DB`, `CV`…) is a `Term` chip whose peek
  quotes the printed definition and whose tap opens the page; weapon and armour specials
  (`BFO`, `Stackable`…) are `SpecialChip`s the same way. Citation chips peek the heading and
  the printed words where the data carries them.
- Where the book is silent (the die for a random talent, an ineligible random talent, Mana
  rounding, the Backgrounds die, which non-weapon items take wear, the start settlement die,
  stat maxima at creation, where an item is carried) the creator says so in a purple "the
  book is silent" note (`GAPS` in `rules.ts`) and lets the table decide. Do not fill those
  gaps in the client.

## Skin

The whole app is one dark, lamp-lit skin, built for a tablet or laptop beside the board.
`src/styles.css` (loaded by the root route) holds the tokens on `:root`, the base controls and
every shared piece: the island shell (`.island`, `.top`, `.top-tab`, `.top-tools`, `.top-btn`,
`.top-rulebook`, `.brand`), button
variants (`.btn-primary`, `.btn-ghost`, `.link`, `.btn-mini`, `.btn-x`), cards (`.card`,
`.card-head`, `.card-kicker`, `.card-title`), citation chips and their peeks (`.cite`,
`.page-chip`, `.peek`), the dice pad (`.pad`), evidence cards (`.ev-*`) and the rulebook pane.
Every island renders the same app bar (`src/components/AppBar.tsx`) and rulebook pane
(`src/components/RulebookPane.tsx`). The bar has three fixed zones: the islands as tabs (`/`,
`/character`, `/gm`; the current one marked by `aria-current`), the island's own tools passed
in as `tools` and grouped apart from the navigation, and the Rulebook toggle in the same corner
on every route. Put an island-specific action in its `tools`, never beside the tabs.
Each island loads one more stylesheet from its route and scopes everything under its root
class: `src/search.css` (`.ask`, the rules search at `/`), `src/gm/gm.css` (`.gm`) and
`src/character/character.css` (`.cc`). Add a shared piece to `styles.css`; add an island's own
part to its own file. `/review` is an internal tool outside this look: `src/review.css`
overrides the tokens on its root so it stays on light paper.

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
