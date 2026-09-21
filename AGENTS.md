# AGENTS.md

This repository compiles the _League of Dungeoneers_ second-printing English rulebook
into a machine-readable corpus. Treat it as a compiler: the PDF is source, YAML under
`corpus/` is the IR, schemas and tests are the checks, and `generated/` is build output.

There is no application, UI, API server, or game runtime here. Do not introduce one.
Consumers read the corpus; they are not part of it.

Phases 0–3 are complete. Phase 4 core mechanics are extracted and tested; see
[docs/phase-4-core-mechanics.md](docs/phase-4-core-mechanics.md) for the audit and remaining
boundaries. Extraction does not imply independent review. Unresolved issues remain in `review/`.
Do not start Phase 5 catalogues or Phase 6 full procedures without an explicit request. Full plan:
[LOD_RULES_CORPUS_PLAN.md](LOD_RULES_CORPUS_PLAN.md). Remaining work:
[docs/coverage-report.md](docs/coverage-report.md).

## Commands

```bash
npm install
npm run validate          # schema + cross-file integrity of canonical YAML
npm test                  # vitest (schema, integrity, report)
npm run report:coverage   # regenerates docs/coverage-report.md
npm run lint              # eslint + prettier --check + tsc --noEmit
npm run lint:fix
npx tsx scripts/extract/inspect-pdf.ts   # dumps PDF text to generated/extract/
```

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

| Path         | Role                                                  | Hand-edit?             |
| ------------ | ----------------------------------------------------- | ---------------------- |
| `source/`    | Canonical PDF + [manifest.yaml](source/manifest.yaml) | Add/replace only       |
| `corpus/`    | Canonical YAML (the IR)                               | Yes, reviewed          |
| `schemas/`   | JSON Schema for that YAML                             | Yes                    |
| `review/`    | Ambiguities, conflicts, open questions                | Yes                    |
| `scripts/`   | Validate, inspect, report, (later) build              | Yes                    |
| `tests/`     | Schema, integrity, later rule fixtures                | Yes                    |
| `docs/`      | Conventions. `coverage-report.md` is generated        | Yes, except the report |
| `generated/` | Build and extract dumps, gitignored                   | **Never**              |

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
- Claim a section `extracted` or `reviewed` without coverage evidence.
- Apply Convex, React, Next.js, or app-backend patterns. This is YAML + Node
  TypeScript tooling.

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

- [docs/extraction-guide.md](docs/extraction-guide.md) — provenance, pages, uncertainty
- [docs/naming-conventions.md](docs/naming-conventions.md) — id namespaces
- [LOD_RULES_CORPUS_PLAN.md](LOD_RULES_CORPUS_PLAN.md) — phases and data model
- [README.md](README.md) — human overview
