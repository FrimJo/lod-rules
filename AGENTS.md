# AGENTS.md

This repository compiles the _League of Dungeoneers_ second-printing English rulebook
into a machine-readable corpus. Treat it as a compiler: the PDF is source, YAML under
`corpus/` is the IR, schemas and tests are the checks, and `generated/` is build output.

There is no application, UI, API server, or game runtime here. Do not introduce one.
Consumers read the corpus; they are not part of it. The one exception is `clients/web/`, a
self-contained TanStack Start consumer that answers rules questions through `scripts/ask`.
It has its own `package.json` and checks, never writes to `corpus/`, and is excluded from
the root gate. Do not add app code anywhere else.

Phases 0–3 are complete. Phase 4 core mechanics are extracted and tested; its
[audit](docs/phase-4-core-mechanics.md) records the historical milestone and boundaries.
Phase 5 Batches 1–6 are extracted within their catalogue scope. Batch 6 source evidence,
rule links and boundaries are recorded in [the completion inventory](docs/package-a-completion-inventory.md).
Phase 6 Batches 1–6 are extracted within their bounded scope. Batch 5 travel and settlement
accounting, supplied inputs and unresolved source boundaries are recorded in
[the accounting ledger](docs/travel-settlement-accounting.md).
The combat/treasure source checkpoint is recorded in
[docs/combat-treasure-source-audit.md](docs/combat-treasure-source-audit.md).
The catalogue follow-up is recorded in
[docs/settlement-source-reconciliation.md](docs/settlement-source-reconciliation.md).
Batch 6 character and guild evidence is recorded in [the procedure inventory](docs/character-guild-procedures.md).
Phase 5 Batch 7 is accepted within catalogue scope; [quest source evidence](docs/quest-scenario-inventory.md) records its completed units and pending work. The Dead Rising and Spider Queen campaigns,
random selector, three Lava River quests, both Bandits’ Hideout quests, both Fountain Room quests and estate side quest are catalogue-extracted. Returning the Relic, Slaying the Fiend and Closing the Portal are extracted within their bounded catalogue units.
All three Great Crypt quests (PDF 259–262) are catalogue-extracted within their bounded units.
Ancient Lands opening, Pyramid of Xánthu, Tomb of the Hierophant Temple of Despair, Halls of Amenhotep and Crypt of Khaba (PDF 263–272) are catalogue-extracted within their bounded units.
The Side Quests introduction and selector (PDF 273) are catalogue-extracted.
The Missing Brother (PDF 274) is catalogue-extracted within its bounded unit.
Slay the Beast (PDF 275–276) is catalogue-extracted within its bounded unit.
The Mapmaker (PDF 276) is catalogue-extracted within its bounded unit.
Go Fetch (PDF 277) is catalogue-extracted, including its newly mapped shield-condition table.
Manhunt (PDF 278) is catalogue-extracted within its bounded unit.
Mushrooms (PDF 279) is catalogue-extracted within its bounded unit.
All fifteen personal quest catalogue records are source-reconciled; lifecycle and independent review remain pending.
Package E acceptance accounts for all 124 inventory entries; its final gate validates 403 canonical files and passes 2482 tests.
Next: Phase 6 Batch 7 — conditions, interrupted rest, quest and estate lifecycle. The [lifecycle starting inventory](docs/lifecycle-procedures.md) maps 87 unique headings with source dispositions; Rest interruption guards have passed a 403-file / 2488-test gate. Rest entry/accounting has passed a 403-file / 2499-test gate. Standard hero/point recovery has passed a 404-file / 2519-test gate. Rest-specific condition checks have passed a 405-file / 2538-test gate, with timing and no-rescue overlap recorded as unresolved. Bleeding entry injury/timer replay guards have passed a 405-file / 2549-test gate. Bleeding rescue/bandage guards have passed a 405-file / 2568-test gate. Bleeding terminal/removal and optional replacement checkpoints have passed a 406-file / 2586-test gate. Poison remaining-check accounting and source-map loopback have passed a 406-file / 2605-test gate. Poison initial exposure/episode initialization has passed a 406-file / 2624-test gate. Poison rest-sequence composition has passed a 406-file / 2641-test gate. Poison explicit cures and settlement state integration have passed a 407-file / 2663-test gate; its bounded procedure component is extracted with routing/source questions retained. Disease exposure, post-battle loss and optional rest cure passed a 407-file / 2685-test gate with 22 derived regressions. Disease explicit potion/Sick Ward cure checkpoints passed a 408-file / 2706-test gate with 21 derived regressions. Fire/Acidic hit and continuation plus Frost initial outcome passed a 409-file / 2738-test gate with 32 derived regressions; Acidic halving/protection order remains unresolved. Stun/Frost affected-turn AP consumption passed a 410-file / 2760-test gate with 22 derived regressions; zero AP and mixed-source overlap remain unresolved. Magic Damage ordinary/exception follow-up passed a 410-file / 2775-test gate with 15 derived regressions and unspecified creature details retained. Wounded current-status/fresh-turn cap passed a 411-file / 2802-test gate with 27 derived regressions, retaining active-turn timing and modifier-order questions. Sanity hero/event loss and exact-zero handoff passed a 412-file / 2831-test gate with 29 derived regressions; no overshoot clamp or automatic diagnosis is inferred. Conditions acquisition, duplicate rerolls and positive reset passed a 413-file / 2860-test gate with 29 derived regressions; historical diagnosis and exhaustion boundaries remain unresolved. Acute Stress owned quest/battle/expiry checkpoints passed a 414-file / 2883-test gate with 23 derived regressions; expiry diagnosis accounting remains unresolved. Lingering Trauma actual table selection/owned next-dungeon activation/departure passed a 415-file / 2917-test gate with 34 derived regressions; recurrence, reminder scope and diagnosis accounting remain unresolved. Jumpy actual Scenario/noise checkpoints and cross-condition ownership passed a 416-file / 2947-test gate, with 29 Jumpy regressions and 116 focused mental-condition checks; simultaneous Threat order/aggregation remains unresolved. Depression actual onset-capacity reduction passed a 417-file / 2974-test gate with 27 derived regressions; onset floor/current-Energy/treatment accounting questions remain unresolved. Fear of the Dark and Claustrophobia owned/contextual modifier checkpoints passed a 418-file / 2999-test gate with 25 derived regressions; individual all-skills/stats scope remains unresolved, and Encumbrance owns a separate contribution. Next bounded unit: Arachnophobia and Irrational Fear encounter applicability/selection, PDF57 / printed55.
Follow the [Phase 5 ledger](docs/phase-5-entities-and-tables.md) and
[Phase 6 ledger](docs/phase-6-procedures-and-state-machines.md). Neither phase is complete.

Extraction does not imply independent review. Unresolved issues remain in `review/`, and
coverage currently records no independently reviewed sections. Phases 7–9 have references,
tests and review groundwork, but their comprehensive passes remain unfinished. Phases 10–12
remain pending. See the [plan status](LOD_RULES_CORPUS_PLAN.md#current-status--28-september-2026)
and generated [coverage report](docs/coverage-report.md) for current progress.
Phase 4.x has an optional semantic-decision layer beside the corpus; calibration and
production-provider selection remain pending. It does not change canonical rules. See
[docs/semantic-decisions.md](docs/semantic-decisions.md).

## Commands

```bash
npm install
npm run validate          # schema + cross-file integrity of canonical YAML
npm test                  # vitest (schema, integrity, report)
npm run report:coverage   # regenerates docs/coverage-report.md
npm run lint              # eslint + prettier --check + tsc --noEmit
npm run lint:fix
npx tsx scripts/extract/inspect-pdf.ts   # dumps PDF text to generated/extract/
npm run decisions -- evaluate --provider structural
npm run retrieve -- search "query" # early Phase 12 retrieval; see docs/retrieval.md
npm run retrieve -- build # generated/retrieval/ (not build:corpus)
npm run ask -- "question" --analyzer laya # analysis → evidence → grounded prompt; LLM injected
npm run ask:evaluate # labelled questions: lexical vs Laya vs Jev vs Laya→Jev cascade
```

`npm run ask` uses Laya/Jev only to choose what to retrieve, as the union with a lexical
baseline while they are uncalibrated. The baseline's records are gathered first, so a model can add
records but never displace them. `tests/ask/evaluate.test.ts` enforces this on every labelled
question. It never writes judgments into the corpus. The only
LLM client is the consumer in `clients/web/`; `scripts/` stays LLM-client-free.

`npm run build:corpus` is a stub until Phase 11. Do not invent its outputs.

After any change that touches `corpus/`, `source/`, `schemas/`, `scripts/`, or `review/`, run
`validate`, `test`, and `lint`. If coverage or sections changed, also run
`report:coverage` and commit the regenerated report.

## Source of truth

`source/Rulebook-2nd-printing-ENGa.pdf` is authoritative. When YAML and the PDF
disagree, the PDF wins and the corpus is wrong.

Look up page labels in [corpus/source-map/pages.yaml](corpus/source-map/pages.yaml).
Do not compute `printed = pdf - 2`. That offset holds from PDF page 3 onward except
where the book misprints the folio, omits it, or the page sits ahead of the printed
sequence. Each of those pages says so in its `notes`.

- `printed_page` — the number in the shield at the foot of the page (or `null`)
- `pdf_page` — 1-based physical page in the PDF (1–286)

Details: [docs/extraction-guide.md](docs/extraction-guide.md).

## Layout

| Path           | Role                                                  | Hand-edit?             |
| -------------- | ----------------------------------------------------- | ---------------------- |
| `source/`      | Canonical PDF + [manifest.yaml](source/manifest.yaml) | Add/replace only       |
| `corpus/`      | Canonical YAML (the IR)                               | Yes, reviewed          |
| `schemas/`     | JSON Schema for that YAML                             | Yes                    |
| `review/`      | Ambiguities, conflicts, open questions                | Yes                    |
| `scripts/`     | Validate, inspect, report, (later) build              | Yes                    |
| `tests/`       | Schema, integrity, rule and procedure fixtures        | Yes                    |
| `docs/`        | Conventions. `coverage-report.md` is generated        | Yes, except the report |
| `generated/`   | Build and extract dumps, gitignored                   | **Never**              |
| `clients/web/` | Rules Q&A web client over `scripts/ask` (consumer)    | Yes, own checks        |

`docs/coverage-report.md` is generated from `corpus/source-map/`. Fix the YAML, then
rebuild the report. Never patch the markdown.

## Must

- Preserve the rulebook's wording and distinctions (`battle` is not `combat`).
- Give every extracted fact a source reference
  ([schemas/source-reference.schema.json](schemas/source-reference.schema.json)).
- Work in a small unit: one heading, one table, or a tightly related 1–4 page range.
- Record uncertainty in `review/` instead of guessing. "The book does not define this"
  is a valid answer.
- Keep quest-local mechanics as `scenario_rule` (or later, quest-scoped rules). Never
  promote them to a global chapter.
- If the PDF names a book not in the manifest, add it as `status: not_present`. Cite it
  from the section with `external_references`. Never invent its contents.
- Bind an internal pointer to `see_also` only when the target id exists. Otherwise put
  the original wording in `unresolved_references`. Never invent an id to close one.
- Inspect a rendered page when extraction looks glued, column-scrambled, or a table
  geometry is in doubt. Mark `extraction.visually_verified: true` only after that.
- Keep ids stable. Renaming a referenced id is a breaking change.

## Must not

- Invent Bestiary stats, Charts Compendium values, Quest Book II material, or
  Companions' Compendium content. Those books are `not_present`.
- Silently "fix" contradictions, typos, or missing rules.
- Convert a table into a prose summary. Tables stay structured.
- Drop exceptions, footnotes, or special cases.
- Collapse terminology because another game treats the words as synonyms.
- Encode page numbers in ids (`section.p107` is forbidden).
- Hand-edit `generated/` or treat an inspect-pdf dump as canonical.
- Write a semantic-decision result back into a canonical rule. Judgments stay in
  `generated/decisions/`.
- Claim a section `extracted` or `reviewed` without coverage evidence.
- Apply Convex, React, Next.js, or app-backend patterns. This is YAML + Node
  TypeScript tooling. (`clients/web/` is the sole React/TanStack consumer.)

## Extraction workflow

1. Find the node in [corpus/source-map/sections.yaml](corpus/source-map/sections.yaml).
   Coverage rows must stay a bijection with section ids.
2. Confirm printed vs PDF pages in `pages.yaml`.
3. Dump or render the page if needed (`inspect-pdf.ts`; dumps land in
   `generated/extract/`, which is gitignored).
4. Write canonical YAML under the matching `corpus/` directory. Ids follow
   [docs/naming-conventions.md](docs/naming-conventions.md): lowercase, ASCII,
   dot-separated, prefixed by kind (`term.`, `section.`, `table.`, …).
5. Set coverage `status` / component flags to match what was actually done.
   Phase 2 extracted glossary components only; use `docs/ontology.md` for scope evidence.
6. Log leftover uncertainty under `review/`.
7. Run the command gate above.

Do not extract glossary terms, rules, table rows, or procedures unless the current
task is that phase. Structural mapping and scoped Phase 2 extraction are finished. Later object types may cite
existing `term.*` ids; preserve the distinctions and unresolved issues in `docs/ontology.md`.

## Tooling conventions

- TypeScript strict, ESM (`"type": "module"`). Import with `.ts` extensions.
- No `any`. Prefer `unknown` plus narrowing.
- Await every promise. Public validators live in `scripts/validate/`.
- Prettier: single quotes, print width 100, trailing commas.
- Canonical data files are `kebab-case.yaml`; schemas are `kebab-case.schema.json`.
- Prefer small, reviewable commits (`extract: …`, `schema: …`, `review: …`,
  `test: …`). Do not commit unless asked.

## Code review

Flag any of the following. Do not nitpick formatting; `npm run lint` owns that.

- A new mechanic, table row, or term without a source reference.
- An id, `parent`, `see_also`, or `section_id` that does not resolve.
- Coverage rows that do not match section ids one-for-one.
- Invented external-book content, or a dropped citation.
- A quest/scenario rule folded into a global chapter.
- A generated file that was hand-edited, or `coverage-report.md` edited directly.
- An interpretation that "fixes" the book rather than recording the uncertainty.
- A table reduced to prose.

## Pointers

- [docs/phase-5-entities-and-tables.md](docs/phase-5-entities-and-tables.md) — catalogue batches and evidence
- [docs/phase-6-procedures-and-state-machines.md](docs/phase-6-procedures-and-state-machines.md) — procedure batches and boundaries
- [docs/coverage-report.md](docs/coverage-report.md) — generated section/component progress
- [docs/extraction-guide.md](docs/extraction-guide.md) — provenance, pages, uncertainty
- [docs/naming-conventions.md](docs/naming-conventions.md) — id namespaces
- [LOD_RULES_CORPUS_PLAN.md](LOD_RULES_CORPUS_PLAN.md) — phases and data model
- [README.md](README.md) — human overview

Arachnophobia and Irrational Fear now have bounded encounter classification/selection and reaction handoffs; source scope and randomization remain unresolved. Next bounded Package F unit: Hate and its source-linked talent lifecycle.

Hate diagnosis and linked Talent now have bounded once-only target/grant and owned check procedures, with absent Bestiary eligibility supplied and source uncertainties retained. Next Package F source unit: Reducing Insanity and settlement treatment links.

Sanity recovery/paid indulgence now has an owned actual-event procedure across PDF55/147; the two recovery headings have extracted procedure components with cap/overlap/frequency ambiguities retained. Next Package F unit: Treat Mental Conditions and disorder effect-removal handoff.

Mental-condition treatment now has selected-disorder and actual completed-result checkpoints composed with existing settlement accounting. Successful cures clear only the actual disorder flag; source-specific effect/capacity/history restoration remains unresolved. Next: reconcile Psychology cleanup/component dispositions, then quest lifecycle.

Mental-table bounded procedure evidence is reconciled, including current-contribution cure cleanup and explicit lasting-effect ambiguities. Next Package F unit: quest acceptance and quest-instance/party ownership. Phase 6 Batch 7 and Phases 7–12 remain unfinished.

Quest acceptance now has actual party/offer/distinct-occurrence ownership, main/side coexistence, immutable accepted provenance and supplied repeat/site eligibility. Next Package F source unit: quest departure and instance progression, then completion/abandonment/reward gates.

Actual quest departure now has a source-bound occurrence checkpoint and the previously unmapped Leaving on a Quest heading has a bijective source-map/coverage row. Next Package F unit: Slaying the Fiend progression/aftermath/loot, followed by Closing the Portal.

Slaying the Fiend now has bounded source-owned setup, persisted wounds, placement and defeat-gated aftermath/treasure handoff lifecycle evidence. Next Package F unit: Closing the Portal ritual, spawn/interruption and distinct closure/defeat/loot/payment gates.

Closing the Portal now has bounded source-owned preparation/groups, reading/restart/interruption/closure, actual schedule-supplied type-only spawning and distinct final-demon/treasure/outside hero-payment lifecycle evidence. Source ambiguities and external/supplied outcomes remain explicit, with no independent review. Next Package F source unit: Returning the Relic (PDF255). Phase 6 Batch 7 and Phases 7–12 remain unfinished.

Returning the Relic now has bounded source-owned setup/Threat, Luck nullification/expiry, Scenario events, objective requests, actual owned once-per-turn pending DEX refit and per-hero home payment. Scope, maximum20 interaction and unresolved consequences remain explicit; no independent review. Next Package F source unit: Retrieving the Family Heirloom, PDF259–260. Phase 6 Batch 7 and Phases 7–12 remain unfinished.

An early Phase 12 retrieval slice (`scripts/retrieve/`, `npm run retrieve`, [docs/retrieval.md](docs/retrieval.md)) indexes all canonical records lexically with provenance, quest scope, relations, review issues and external dependencies. It is a projection, not canonical data, and does not implement `build:corpus`. A 37-question labelled set (`tests/fixtures/ask-questions/`, labels unreviewed) measures question analysis. Jev plus lexical beats lexical recall on validation and held-out. Laya's judgments are weak, and the provisional Laya→Jev cascade escalated on every question. Results are in [docs/retrieval.md](docs/retrieval.md#labelled-questions). Package F (in progress: Family Heirloom lifecycle files exist without a ledger entry) and comprehensive Phases 7–12 remain unfinished.
