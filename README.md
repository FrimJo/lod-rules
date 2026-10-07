# lod-rules

A machine-readable, reviewable, testable rules corpus compiled from the _League of
Dungeoneers_ second-printing English rulebook.

Think of this repository as a compiler project for a rulebook: the PDF is source code, the
canonical YAML is the intermediate representation, validation and example tests are the
compiler checks, and everything in `generated/` is a build artifact.

The player-facing helper app, UI, and any runtime integration are explicitly out of scope.
Consumers read the corpus; they are not part of it.

## Status

As of 7 October 2026:

- Phases 0–3 are complete. Phase 4 core mechanics are extracted and tested across all 21
  priority areas.
- **Phase 5 — entities and tables:** Batches 1–7 are extracted within catalogue scope,
  including every quest, personal-quest and estate catalogue record.
- **Phase 6 — procedures and state machines:** Batches 1–6 are extracted within scope.
  Batch 7 (lifecycle models) is in progress; its
  [acceptance manifest](tests/fixtures/acceptance/package-f.json) has 27 implemented and 64
  pending entries.
- **Phases 7–12:** groundwork only. Nothing is independently reviewed, `build:corpus` is a
  stub, and retrieval (lexical search, agent tools, MCP server, `ask`) is partial Phase 12.
- **Phase 4.x — optional semantic decisions:** adapters and evaluation exist; calibration and
  production-provider selection remain pending.

Coverage records 347 of 675 sections extracted (51%) and zero independently reviewed. Of 138
review records, 17 are resolved. Extraction and passing tests do not imply independent review.

The prioritised remaining work is in the
[completion plan](docs/corpus-completion-plan.md): close Package F at reduced scope, then
reconcile, extract and independently review the core chapters. Live progress is in the
generated [coverage report](docs/coverage-report.md); per-unit evidence is in the
[evidence ledgers](docs/ledgers/). See [docs/README.md](docs/README.md) for a map of the docs.

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
answer from an OpenRouter model, and shows the evidence and citation check. It is a consumer with its own
`package.json` and is excluded from the root checks.

[clients/mcp/](clients/mcp/README.md) is a read-only MCP server. It gives Claude agents
rulebook tools (`lod_search`, `lod_get`, `lod_resolve`, `lod_expand`) that return rulebook
content only,
for example while they build the helper app in another repository. It is registered for
this repository in `.mcp.json`.

## Layout

```text
source/        canonical PDF and manifest.yaml (source of truth)
schemas/       JSON Schemas for canonical data
corpus/        canonical, human-reviewed YAML
review/        ambiguities, conflicts, and open questions
scripts/       validation, extraction, build, and report tooling
tests/         schema tests and rule regression fixtures
docs/          conventions, plan, generated reports; docs/ledgers/ holds extraction evidence
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
