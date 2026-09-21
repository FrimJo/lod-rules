# lod-rules

A machine-readable, reviewable, testable rules corpus compiled from the _League of
Dungeoneers_ second-printing English rulebook.

Think of this repository as a compiler project for a rulebook: the PDF is source code, the
canonical YAML is the intermediate representation, validation and example tests are the
compiler checks, and everything in `generated/` is a build artifact.

The player-facing helper app, UI, and any runtime integration are explicitly out of scope.
Consumers read the corpus; they are not part of it.

## Status

Phase 1 (structural map) is complete. `corpus/source-map/` now navigates all 286 pages of
the rulebook: every physical page is mapped to its printed folio, and 582 nodes cover the
chapters, sections, appendices, named tables, worked examples, optional rules, and
quest-local rules. No mechanics have been extracted yet — every node is `mapped` and
nothing is `extracted`. Phase 2 is the glossary. See
[LOD_RULES_CORPUS_PLAN.md](LOD_RULES_CORPUS_PLAN.md) for the full plan and
[docs/coverage-report.md](docs/coverage-report.md) for what remains.

## Commands

```bash
npm install

npm run validate         # schema-check canonical YAML, verify source identity
npm test                 # schema and tooling tests
npm run report:coverage  # regenerate docs/coverage-report.md
npm run lint             # eslint + prettier
npm run build:corpus     # generated/ artifacts (not implemented until Phase 11)

# Dump the PDF outline and per-page text to generated/extract/ for inspection.
# The dump seeds YAML by hand; it is never canonical.
npx tsx scripts/extract/inspect-pdf.ts
```

## Layout

```text
source/        canonical PDF and manifest.yaml (source of truth)
schemas/       JSON Schemas for canonical data
corpus/        canonical, human-reviewed YAML
review/        ambiguities, conflicts, and open questions
scripts/       validation, extraction, build, and report tooling
tests/         schema tests and rule regression fixtures
docs/          conventions and generated reports
generated/     build artifacts — never hand-edited, gitignored
```

## Canonical versus generated

Canonical data lives in `source/`, `corpus/`, and `review/`, and is edited by humans under
review. Everything in `generated/` is reproducible build output and must never be edited by
hand; `docs/coverage-report.md` is likewise generated from `corpus/source-map/`. Details
are in [docs/extraction-guide.md](docs/extraction-guide.md).

## Conventions

- [docs/naming-conventions.md](docs/naming-conventions.md) — stable identifier rules.
- [docs/extraction-guide.md](docs/extraction-guide.md) — provenance, uncertainty handling,
  and external-source policy.

## External sources

The rulebook defers material to the Bestiary, the Charts Compendium, Quest Book II, and the
Companions' Compendium. Those are declared in `source/manifest.yaml` as `not_present`. The
sections that cite them are listed in [docs/coverage-report.md](docs/coverage-report.md).
Their contents are referenced as external dependencies and are never invented here.
