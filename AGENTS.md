# AGENTS.md

This repository compiles the _League of Dungeoneers_ second-printing English rulebook
into a machine-readable corpus. Treat it as a compiler: the PDF is source, YAML under
`corpus/` is the IR, schemas and tests are the checks, and `generated/` is build output.

There is no application, UI, API server, or game runtime here. Do not introduce one.
Consumers read the corpus; they are not part of it. There are two exceptions, both
self-contained consumers under `clients/` with their own `package.json` and checks. Neither
writes to `corpus/`, and both are excluded from the root gate:

- `clients/web/`: a TanStack Start app that answers rules questions through `scripts/ask`.
  See [clients/web/AGENTS.md](clients/web/AGENTS.md).
- `clients/mcp/`: a read-only stdio MCP server that publishes the retrieval tools to Claude
  agents, including agents building the LoD helper app in another repository. See
  [clients/mcp/AGENTS.md](clients/mcp/AGENTS.md).

Do not add app code anywhere else. The helper app itself lives outside this repository.

## Looking up rules

To answer a rules question, use the `lod-rules` MCP tools (`lod_search`, `lod_resolve`,
`lod_get`, `lod_expand`) instead of grepping or reading YAML. They are registered in
`.mcp.json`; first run `npm install --prefix clients/mcp`. The same tools are available from
the CLI as `npm run retrieve -- call <tool> '<json>'`.

These tools return rulebook content only. They hide review issues, extraction status, YAML
paths and coverage. For corpus work, use `npm run retrieve -- search|get|issues`, which show
all of it, and treat the YAML and the PDF as authoritative.

There is no `convex/` backend in this repository. Ignore Convex-oriented guidance unless
you are explicitly adding a Convex project elsewhere.

## Extraction and progress

Phases 5–6 and Package F are incomplete. Do not extract glossary terms, rules, table rows,
or procedures unless the current task requires it.

When the task is **corpus extraction**, **Package F acceptance**, or **continuing a phased
batch**, read [docs/extraction-checkpoint.md](docs/extraction-checkpoint.md) first. It names
the next unit and the evidence ledger that owns it. Priorities and exit conditions are in
[docs/corpus-completion-plan.md](docs/corpus-completion-plan.md). Record unit evidence in the
owning ledger under `docs/ledgers/`, and update the checkpoint's current position and next
unit. Do not append session narrative here or to the plan.

For plan structure and milestones, see
[LOD_RULES_CORPUS_PLAN.md](LOD_RULES_CORPUS_PLAN.md). For generated progress, see
[docs/coverage-report.md](docs/coverage-report.md). Unresolved issues live in `review/`.
Optional semantic decisions never change canonical rules — see
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
npm run retrieve -- tools # agent tool definitions (lod_search, …) as JSON
npm run retrieve -- call lod_search '{"query":"locked door"}' # run one tool call
npm run ask -- "question" --analyzer laya # analysis → evidence → grounded prompt; LLM injected
npm run ask:evaluate # labelled questions: lexical vs Laya vs Jev vs Laya→Jev cascade
```

`npm run ask` uses Laya/Jev only to choose what to retrieve, as the union with a lexical
baseline while they are uncalibrated. The baseline's records are gathered first, so a model can add
records but never displace them. `tests/ask/evaluate.test.ts` enforces this on every labelled
question. `--filter` (opt-in, experimental) then lets Jev drop records it judges irrelevant from
that pool, lexical ones included; `tests/ask/ranking.test.ts` covers it and
[docs/ask-quality-evaluation.md](docs/ask-quality-evaluation.md) records its calibration.
It never writes judgments into the corpus. The only
LLM client is the consumer in `clients/web/`; `scripts/` stays LLM-client-free.

Agent tool definitions live in `scripts/retrieve/tools.ts`: names, descriptions, JSON Schema
inputs, validation and the output projection. The MCP server, the CLI and direct API clients
all use that file. Change a tool there, never in a consumer. These tools serve agents that
consume the rules, such as those building the helper app. Their descriptions and results
carry rulebook content only, never corpus bookkeeping (review issues, extraction status,
confidence, file paths, coverage). `tests/retrieve/tools.test.ts` checks every record.

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

Published designer rulings (manifest `official_errata` / `official_faq`) may resolve an issue:
printed `source_text` stays verbatim and effects follow the cited ruling. See "Official
rulings" in the extraction guide.

## Layout

| Path           | Role                                                   | Hand-edit?             |
| -------------- | ------------------------------------------------------ | ---------------------- |
| `source/`      | Canonical PDF + [manifest.yaml](source/manifest.yaml)  | Add/replace only       |
| `corpus/`      | Canonical YAML (the IR)                                | Yes, reviewed          |
| `schemas/`     | JSON Schema for that YAML                              | Yes                    |
| `review/`      | Ambiguities, conflicts, open questions                 | Yes                    |
| `scripts/`     | Validate, inspect, report, (later) build               | Yes                    |
| `tests/`       | Schema, integrity, rule and procedure fixtures         | Yes                    |
| `docs/`        | Conventions, plan; `ledgers/` holds evidence           | Yes, except the report |
| `generated/`   | Build and extract dumps, gitignored                    | **Never**              |
| `clients/web/` | Rules Q&A web client over `scripts/ask` (consumer)     | Yes, own checks        |
| `clients/mcp/` | MCP server over `scripts/retrieve/tools.ts` (consumer) | Yes, own checks        |

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
- Apply Convex, React, Next.js, or app-backend patterns repo-wide. Root work is YAML +
  Node TypeScript tooling. React/TanStack belongs only under `clients/web/`; MCP SDK code
  only under `clients/mcp/`.

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

Later object types may cite existing `term.*` ids; preserve the distinctions and unresolved
issues in [docs/ontology.md](docs/ontology.md).

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

- [docs/README.md](docs/README.md) — map of all docs
- [docs/corpus-completion-plan.md](docs/corpus-completion-plan.md) — prioritised remaining work and exit conditions
- [docs/extraction-checkpoint.md](docs/extraction-checkpoint.md) — current position and next unit (read on demand)
- [docs/ledgers/](docs/ledgers/) — per-phase and per-package extraction evidence
- [docs/coverage-report.md](docs/coverage-report.md) — generated section/component progress
- [docs/extraction-guide.md](docs/extraction-guide.md) — provenance, pages, uncertainty
- [docs/naming-conventions.md](docs/naming-conventions.md) — id namespaces
- [LOD_RULES_CORPUS_PLAN.md](LOD_RULES_CORPUS_PLAN.md) — phases and data model
- [README.md](README.md) — human overview
