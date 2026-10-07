# Extraction checkpoint

Read this when the task is corpus extraction, Package F acceptance or continuing a phased
batch. It holds only the current position and the next unit of work. It is not always-on
agent context; do not copy it into [AGENTS.md](../AGENTS.md).

- Plan, priorities and exit conditions: [corpus-completion-plan.md](corpus-completion-plan.md)
- Section and component progress (generated): [coverage-report.md](coverage-report.md)
- Phase structure and data model: [LOD_RULES_CORPUS_PLAN.md](../LOD_RULES_CORPUS_PLAN.md)

## Current position — 7 October 2026

- Phases 0–3 are complete. Phase 4 core mechanics are extracted and tested.
- Phase 5 Batches 1–7 are extracted within catalogue scope, including every Quest Book I,
  personal-quest and estate catalogue record (Package E).
- Phase 6 Batches 1–6 are extracted within bounded scope (Packages A–D). Batch 7 (Package F,
  lifecycle models) is in progress: the
  [acceptance manifest](../tests/fixtures/acceptance/package-f.json) has 95 entries, 27
  implemented, 3 shared-model, 1 narrative-only and 64 pending.
- No section is independently reviewed. Phases 7–12 are unfinished; retrieval is partial
  Phase 12 groundwork and `build:corpus` is a stub.

## Next unit

Step 1 of the [prioritised plan](corpus-completion-plan.md#3-prioritised-work): close
Package F at reduced scope.

1. Done: the `catalogue_scope` disposition (`shared_lifecycle_rows`, `deferred_work`) is in
   the acceptance schema and checker. No real rows use it yet.
2. Next: the five condition/rest audit rows, then the shared quest selector and campaign rows,
   then the estate lifecycle (PDF 160–166).
3. Then close the remaining Quest Book I and personal-quest rows as `catalogue_scope` and run
   the Phase 5/6 exit reconciliation.

Step 2 can start in parallel: its tooling (`npm run report:chapters`, `npm run review`, the
`corpus-reviewer` agent) exists. Pilot on Introduction and Game Basics.

## Evidence ledgers

Per-unit source evidence, regressions and unresolved boundaries live in
[`ledgers/`](ledgers/). Append a short entry to the ledger that owns the unit, then update
the "Current position" and "Next unit" sections above. Do not keep a running log here.

| Scope                                          | Ledger                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Phase 3 schema pilot (historical)              | [phase-3-pilot.md](ledgers/phase-3-pilot.md)                                                 |
| Phase 4 core mechanics                         | [phase-4-core-mechanics.md](ledgers/phase-4-core-mechanics.md)                               |
| Phase 5 entities and tables, all batches       | [phase-5-entities-and-tables.md](ledgers/phase-5-entities-and-tables.md)                     |
| Phase 6 procedures, all batches                | [phase-6-procedures-and-state-machines.md](ledgers/phase-6-procedures-and-state-machines.md) |
| Package A: settlement catalogues               | [package-a-completion-inventory.md](ledgers/package-a-completion-inventory.md)               |
| Packages B/C: travel and settlement accounting | [travel-settlement-accounting.md](ledgers/travel-settlement-accounting.md)                   |
| Package D: character and guild procedures      | [character-guild-procedures.md](ledgers/character-guild-procedures.md)                       |
| Package E: quest and scenario catalogues       | [quest-scenario-inventory.md](ledgers/quest-scenario-inventory.md)                           |
| Package F: lifecycle models                    | [lifecycle-procedures.md](ledgers/lifecycle-procedures.md)                                   |

The ledgers record extraction, not independent review. Their historical gate counts are
point-in-time and are not updated. Acceptance fixtures and `corpus/source-map/coverage.yaml`
cite these paths, so do not rename or move a ledger without updating them.

Unresolved issues live in `review/`. The optional semantic-decision layer never changes
canonical rules; see [semantic-decisions.md](semantic-decisions.md).
