# lod-rules

A machine-readable, reviewable, testable rules corpus compiled from the _League of
Dungeoneers_ second-printing English rulebook.

Think of this repository as a compiler project for a rulebook: the PDF is source code, the
canonical YAML is the intermediate representation, validation and example tests are the
compiler checks, and everything in `generated/` is a build artifact.

The player-facing helper app, UI, and any runtime integration are explicitly out of scope.
Consumers read the corpus; they are not part of it.

## Status

As of 3 October 2026, Phases 0–3 are complete and Phase 4 reusable core mechanics are
extracted and tested across all 21 priority areas. Phases 5 and 6 are in progress:

- **Phase 5 — entities and tables:** Batches 1–6 are extracted within scope. Settlement,
  guild and estate evidence and source boundaries are in the
  [Package A inventory](docs/package-a-completion-inventory.md). Batch 7 is accepted within catalogue scope; [quest/scenario source evidence](docs/quest-scenario-inventory.md) records all 124 inventory dispositions.
- **Phase 6 — procedures and state machines:** Batches 1–6 are extracted within scope.
  [Travel and settlement accounting](docs/travel-settlement-accounting.md) records the
  composed effects and unresolved source boundaries. [Character and guild procedures](docs/character-guild-procedures.md) records Batch 6. Batch 7 is in progress; the [test-owned acceptance manifest](tests/fixtures/acceptance/package-f.json) records 24 implemented, three shared-model, one nonprocedural and 59 pending lifecycle headings.
- **Phase 4.x — optional semantic decisions:** provider adapters, evaluation, caching and
  shadow comparisons exist. Calibration and production-provider selection remain pending.
- **Phases 7–12:** references, executable examples and review records provide groundwork for
  Phases 7–9. The full graph, full-book example/review/coverage passes, compiled artifacts and
  retrieval corpus remain unfinished. `build:corpus` is still a stub.

The current corpus contains 1,533 rules, 669 entities, 213 tables, 97 procedures, two state
machines and 475 executable YAML fixtures. The glossary contains 68 terms and 110 lookup forms.
The source map covers all 286 pages and tracks 675 canonical sections plus 35 compatibility
redirects. Coverage records 346 sections extracted (51%) and zero independently reviewed;
component extraction can be partial within other sections. Of 135 review records, nine are
resolved and 126 remain unresolved. Extraction and passing tests do not imply independent review.

Next: remaining Package F quest/campaign/estate lifecycle, travel/settlement rest reconciliation and original candidate-loop audit. Stopping the Necromancer, Tomb Raiders, shared resumable dungeon progression/reading/Threat checkpoints and First Blood now have bounded procedure evidence. Phase 5/6 exit acceptance remains open.
Packages A–D are implemented within their documented source boundaries.
The [settlement catalogue reconciliation](docs/settlement-source-reconciliation.md) records Package A. The
[combat/treasure source checkpoint](docs/combat-treasure-source-audit.md) is complete;
independent review remains separate.

See the [phase status and next steps](LOD_RULES_CORPUS_PLAN.md#current-status--28-september-2026),
[Phase 5 ledger](docs/phase-5-entities-and-tables.md),
[Phase 6 ledger](docs/phase-6-procedures-and-state-machines.md), and generated
[coverage report](docs/coverage-report.md). The [Phase 4 audit](docs/phase-4-core-mechanics.md)
and [Phase 3 pilot audit](docs/phase-3-pilot.md) preserve historical milestone counts;
[ontology](docs/ontology.md) records the Phase 2 scope.

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

# Score the gold set against fields already stored on each rule.
npm run decisions -- evaluate --provider structural

# Early Phase 12 retrieval: search, exact ids, aliases, relations, review issues.
npm run retrieve -- search "how do I open a locked door"
npm run retrieve -- build   # generated/retrieval/ (JSONL, SQLite, manifest)

# Question → Laya/Jev analysis → evidence → grounded LLM prompt (LLM injected).
npm run ask -- "How many hit points does Molgor have?" --analyzer laya
```

[docs/retrieval.md](docs/retrieval.md) explains how an LLM client should query the corpus.

[clients/web/](clients/web/README.md) is a TanStack Start web client that answers rules
questions in a browser. It runs the same `ask()` pipeline on the server, streams an
OpenAI answer, and shows the evidence and citation check. It is a consumer with its own
`package.json` and is excluded from the root checks.

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

Semantic decisions are derived metadata. They are described in
[docs/semantic-decisions.md](docs/semantic-decisions.md) and are written under
`generated/decisions/`, not into `corpus/rules/`.

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
