# lod-rules web client

A search-first browser client for League of Dungeoneers rules questions. It is built with
TanStack Start (Vite), `@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-react` and
TanStack Query.

Each question goes through the same `ask()` pipeline as `npm run ask` (analysis, then
deterministic retrieval) on the server. The results page puts that evidence first: each record
shows its kind, the book's wording (tables as tables), the rulebook pages it cites, any open or
clarified issue, and a collapsed "Record details" with the id and why it was selected.

An AI answer is optional. Above the evidence, a "Summarize with AI" card says how many records
would be sent and to which model. Nothing goes to the model until the reader clicks it, or turns
on "Summarize with AI automatically" under the search box (saved in `localStorage` as
`lod-rules:auto-answer`, off by default). The answer streams from OpenRouter (default model
`openai/gpt-6-luna`) with the grounded prompt as its system prompt, so it sees only the records
on screen. Its citations become page chips, `checkCitations()` reports whether every citation is
in the evidence, and the records it cited are tagged "Cited in AI answer". Each answer is a
single turn; there is no follow-up conversation.

Without `OPENAI_ROUTER_API_KEY` the client still works as an evidence search; the AI card just
says AI answers are off, and `/api/chat` answers 503.

Press `/` to focus the search box. "History" in the top bar returns to earlier questions in the
session, with their evidence and any AI answer intact.

## Run

Needs Node 22.5 or newer (`node:sqlite`) and the root repo's dependencies installed.

```bash
cd ../.. && npm install && npm run retrieve -- build   # optional: prebuilt SQLite index
cd clients/web && npm install
OPENAI_ROUTER_API_KEY=sk-or-... npm run dev            # http://localhost:1234
```

The server reads settings from the process environment first, then the root
`.env.local`. See [.env.example](.env.example) for `OPENAI_ROUTER_API_KEY`, `OPENAI_ROUTER_MODEL`,
`LOD_ANALYZER` and `TYPESAFE_API_KEY`.

## Retrieval modes

The gear button in the top bar, or the "Retrieval" chip under the search box, opens the
retrieval settings. Every mode searches the SQLite lexical index, and a model analyzer adds
records to those results. Only the filtered mode removes any: it runs Jev's relevance filter
(`ask(..., { filter })`, see [docs/retrieval.md](../../docs/retrieval.md)) over the union and
drops records Jev judges irrelevant. A collapsed note under the results lists what was dropped.

| Mode                    | Mode id        | Analyzer  | Needs              |
| ----------------------- | -------------- | --------- | ------------------ |
| Lexical + Jev, filtered | `jev_filtered` | `jev`     | `TYPESAFE_API_KEY` |
| Lexical + Jev           | `jev`          | `jev`     | `TYPESAFE_API_KEY` |
| Lexical only            | `lexical`      | `lexical` | nothing            |

Laya and the Laya→Jev cascade are shelved in the web client: onnxruntime and the model
weights do not fit a Vercel function. They remain available to `npm run ask` in the root repo.

`LOD_ANALYZER` sets the server default when it names an available mode. Otherwise the default
is `jev` when `TYPESAFE_API_KEY` is set and `lexical` when it is not. The filtered mode stays
opt-in until a filter policy calibrated on reviewed labels passes
([docs/ask-quality-evaluation.md](../../docs/ask-quality-evaluation.md#filter-calibration-plan)); on
judge-only grades it was within noise of the union
([docs/ask-quality-evaluation.md](../../docs/ask-quality-evaluation.md)).
The browser saves its choice in `localStorage`
(`lod-rules:retrieval-mode`) and sends it with each question. Jev modes are disabled when the
server has no key, and `/api/chat` answers 409 if one is requested anyway. Each question keeps
the mode it was asked with. The results header names that mode, and a model failure shows as a
keyword-only fallback notice above the evidence.

## Rulebook pages

Citations in an answer show as page chips (`p. 98`, `pp. 56, 98`); adjacent citations to the
same page merge into one chip. Hover or focus a chip to preview the records and headings it
points to. Click it, or a page button on an evidence card, to open the rulebook pane beside the
results (a full-screen sheet on narrow screens; Esc or Close returns to the results). The
"Rulebook" button in the top bar opens it at the contents. The pane renders the cited page from `source/` with pdf.js and highlights the cited heading. If the
heading isn't printed word for word, it highlights the record title instead. Page labels and
section breadcrumbs come from `corpus/source-map/pages.yaml` and `sections.yaml`. The viewer
reads ←/→ to change page and +/−/0 to zoom.

The server serves single pages as small standalone PDFs (`/api/rulebook-page/:pdf`, cut with
pdf-lib) because opening the whole book makes pdf.js read most of its 40 MB. `/api/rulebook`
serves the full file with byte-range support for "Open PDF".

## Character creator

`/character` (for example http://localhost:1234/character) walks a player through creating a
hero the way the book does, step by step, and ends with a sheet to copy onto the printed
character sheet. Every step quotes the rule it applies and its page chip opens the rulebook
there.

1. **Species**: the four species with their stat rolls, Hit Points, traits and limitations.
2. **Stats**: 1d10 per stat, one at a time or (the book's option) all five then assigned.
   Dice are typed from the table or rolled by the app. The two creation rerolls are counted,
   a reroll cannot be rerolled, and the higher result is kept. Hit Points are rolled here too.
3. **Specialise**: the 15 extra points, at most 10 on one stat. Damage Bonus and Natural
   Armour update as the stats change.
4. **Profession**: the eight professions with their skill tables; the Free Skill (+10 on one
   negative modifier); the talent choice where the book offers one; the human's Jack of all
   trades random talent, with "Rangers only" and similar restrictions flagged; three Level 1
   spells and the Arcane perk for a Wizard; two level 1 prayers and the relic for a Warrior
   Priest.
5. **Background** (optional): the twenty numbered Backgrounds; the Noble's 400 c and the Bad
   Tempered Sanity and Party Morale changes flow into the sheet.
6. **Equipment**: the profession's starting gear (a Dwarf or Halfling Ranger gets a Shortbow
   under the designer ruling), weapon of choice checked against STR, species and the
   profession's Class and Tier limits, purchases from the Weapons and Armour tables or as
   free-form items, the 1d4 wear roll per weapon and armour piece, coins and encumbrance.
7. **Sheet**: everything to write down, grouped as the character sheet groups it, with a list
   of things to check first and a print view.

The hero is saved in `localStorage` (`lod-rules:character-creator`); `Undo` (⌘Z) steps back
within the session and `New hero` clears it. `src/character/rules.ts` carries the facts with
their page citations and corpus record ids; `tests/character-rules.test.ts` checks them
against the corpus and `tests/character-engine.test.ts` covers the reducer and derivations.
Where the book is silent the page says so in a purple note instead of inventing a rule.

## Game master's table

`/gm` (for example http://localhost:1234/gm) is a tracker for running a dungeon, built from
the same corpus. It exists because the rulebook's bookkeeping is where games go wrong: a torch
is spent by a Threat roll below Threat, the lantern burns half its oil, Party Morale moves on
fifteen different events, Sanity has its own table and resets after a mental condition, a rest
costs a ration and risks an ambush, and a quest may place a Wandering Monster whenever Threat
is increased to a certain value.

Tell the table what happens and it rolls out the printed consequences, keeps a log with page
chips that open the rulebook pane, and lists what to resolve next:

- **Turn**: pick the quest (start, minimum and maximum Threat and the Wandering Monster
  thresholds come from the quest tables); `New turn` (or `N`) asks for the Scenario die once
  the party has passed the first door; a 9 or 0 asks for a Threat roll. The five printed turn
  steps are a click-through: each step shows what the table knows about it and takes the roll
  it calls for, and `Show as list` swaps in the plain list (remembered per browser). Door
  opened; next tile as one action (`Roll for enemies` rolls 1d100 against the room or corridor
  chance, +10 after four empty tiles, and shows the outcome; a physical roll or a result the
  quest dictates can be entered instead); battle begins and ends; short rest (ration,
  recovery, ambush roll against 5 + Threat, +10 per later rest).
- **Threat**: 20 lowers by 5, above Threat adds 1, at or below asks you to roll on the printed
  Threat table and enter its decrease (those tables are not in the corpus yet). Door +1,
  forcing a lock +2, crowbar +1, portcullis failure +1, perks, and a prompt for the
  post-battle increase (also not in the corpus yet). Quest thresholds place a Wandering
  Monster token.
- **Light**: torches, lanterns and headlamps with carriers, spares and Lamp Oil. A Threat roll
  below Threat spends torches and burns half a lantern; an unmodified attack roll of 90 or
  more puts a torch out; a head wound destroys a headlamp. Shows the +5 Fear/Terror and
  carrier Perception bonuses while anything burns, and says plainly that the effects of
  darkness are not in the corpus.
- **Party Morale**: start value from each hero's RES ÷ 10 (plus Natural Leader and the
  Powerstone), every row of the morale table as a button, the linked Sanity losses applied to
  the hero it happened to, wavering below half (−20 RES) and the flight at 0.
- **Heroes**: Sanity dots, mental conditions rolled at 0 Sanity (duplicates roll again, Sanity
  resets to 8 minus conditions), and the conditions that feed back into the table (Acute
  Stress adds Threat per battle, Jumpy adds Threat on a Scenario 0), plus wounded, bleeding
  out, poisoned and diseased reminders that surface during rests and after battles.

State is saved in `localStorage` (`lod-rules:gm-table`); `Undo` (⌘Z) steps back within the
session and `Reset` clears the table. `src/gm/rules.ts` carries the facts with their page
citations and corpus record ids; `tests/gm-rules.test.ts` checks them against the corpus and
`tests/gm-engine.test.ts` covers the reducer.

## Deploying to Vercel

The production build is a [Nitro](https://nitro.build) server. `vite build` picks the preset
from the environment: `vercel` on Vercel, `node-server` locally (`npm run build && npm start`).

**Data bundle.** The built server cannot reach the repo checkout, so the build copies what it
reads into `lod-data/` next to the server (`build/bundle-data.ts`): the SQLite retrieval index
(rebuilt first if the corpus changed), `source/` with the documents its manifest lists,
`pages.yaml` and `sections.yaml`, and the pdf.js standard fonts. `src/server/data-root.ts`
finds the bundle at runtime and falls back to the repo in dev. The bundle has no corpus, so the
deployed index is always the one built from the deployed commit. `npm run bundle [dir]` writes
a bundle on its own for inspection.

**Project settings.** Import the repository and set the Root Directory to `clients/web`.
Keep "Include files outside the root directory" on: the server imports `../../scripts/` and
the build reads `corpus/` and `source/`. [vercel.json](vercel.json) installs the root packages
as well as this one and runs `npm run build`. Use Node 24 (`node:sqlite`).

**Environment variables.**

| Variable                | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `ACCESS_PASSWORD`       | Shared password; every page and API call needs a sign-in       |
| `OPENAI_ROUTER_API_KEY` | AI answers (OpenRouter). Set a credit limit on the key         |
| `OPENAI_ROUTER_MODEL`   | Optional model id                                              |
| `TYPESAFE_API_KEY`      | Jev retrieval modes                                            |
| `LOD_ANALYZER`          | Optional default mode                                          |

**Access.** With `ACCESS_PASSWORD` set, `src/start.ts` sends every server request through
`src/server/access.ts`. Pages redirect to `/login`, and other requests get 401 until the reader
signs in. The sign-in sets an HttpOnly cookie for 30 days. Changing the password signs everyone
out, and `/logout` signs the current browser out. Repeated wrong passwords from one address are
throttled per server instance. Built JS and CSS under `/assets/` are served by the CDN without
the gate; they hold no rulebook content. `src/start.ts` also re-registers Start's CSRF check,
which a custom request middleware list replaces, and extends it to POST routes.

The full rulebook (`/api/rulebook`) streams from the function, which Vercel allows past its
4.5 MB response limit. `/review` works only from a repo checkout.

## Grading review

`/review` (for example http://localhost:1234/review) lets you check the automated grading
from `src/evaluation/run-quality.ts` (see
[docs/ask-quality-evaluation.md](../../docs/ask-quality-evaluation.md)). It reads the case
files in `generated/ask-quality/`. For each question you:

- tick any fact in the judge's list that is wrong or not needed;
- mark each distinct answer correct or incorrect. Answers are labelled A–D as the judge saw
  them, and the retrieval modes stay hidden until you reveal them;
- confirm or change the judge's direct/supporting/irrelevant label for every retrieved
  record. Labels start as the judge's; rows you change are highlighted.

Saving writes `evaluation/grading-review.json`, which is committed. Answer verdicts are keyed
by a hash of the answer text, so they carry over to a rerun that produces the same answer.
Record labels store a hash of the record text: they carry over to reruns until the record's
text changes, after which the label is ignored and the record shows "text changed" for
relabelling. Saving works only from the dev server.

**Record queue** (`/review?view=records`) serves single records across all questions, in the
order that most helps calibrate the Jev filter: possible filter mistakes (dropped, but the judge
calls them relevant), close calls (near the drop line, or Jev and the judge disagree), records
from the heading retrieval steps, then spot checks (a random eighth of the rest). Each task shows
the question, the record as the search page renders it (heading path, rulebook page link, tables,
open questions) and how it was found. Keys 1/2/3 label it direct/supporting/irrelevant, S skips
it for the session and U undoes the last label. The judge's label and Jev's score appear only
after you choose, so they cannot anchor you. Each label is saved straight into that question's
review; a record already labelled in another tab is never overwritten. Held-out questions are
left out unless you include them; label those once, after the policy is chosen. The side panel
tracks progress towards 300 labels and 60 relevant records that Jev doubts.

`npm run typecheck` checks this package. `npm test` runs the ruling citation, source-serving, retrieval-mode, record-text, grading-review, filter-calibration, Game master's table and character creator engine and corpus-consistency regressions using the root-installed `tsx` loader. The root gate ignores `clients/`.
