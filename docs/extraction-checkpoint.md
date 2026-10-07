# Extraction checkpoint

Read this when the task is corpus extraction, Package F acceptance or continuing a phased
batch. It holds only the current position and the next unit of work. It is not always-on
agent context; do not copy it into [AGENTS.md](../AGENTS.md).

- Plan, priorities and exit conditions: [corpus-completion-plan.md](corpus-completion-plan.md)
- Section and component progress (generated): [coverage-report.md](coverage-report.md)
- Phase structure and data model: [LOD_RULES_CORPUS_PLAN.md](../LOD_RULES_CORPUS_PLAN.md)

## Current position — 7 October 2026

- Phases 0–3 are complete. Phase 4 core mechanics are extracted and tested.
- Phase 5 Batches 1–7 are extracted within catalogue scope (Package E).
- Phase 6 Batches 1–7 are complete at documented scope. Package F is `accepted`: 41
  implemented, 10 covered by another model, 1 nonprocedural, 43 `catalogue_scope`.
- Phase 0–6 exit checklist: 76 of 85 rows verified; the 9 open rows are assigned to Step 2
  tiers 2, 5 and 7, Phase 7 and Phase 10 in the plan.
- Step 2 tiers 1–2 are reconciled and independently reviewed: Introduction, Game Basics,
  Character Basics, Creating Your Character, Levelling Up, Embarking on Your First Quest and
  the Party Management part node (90 sections; `review.*.2` records, all passed with
  corrections after a failed first review and a correction pass).
- Coverage: see the generated [coverage report](coverage-report.md); 90 sections reviewed.
  Phases 7–12 are unfinished.

## Next unit

Step 2, tier 3: Equipment and Psychology. Reconcile with `npm run report:chapters`, then one
fresh `corpus-reviewer` per chapter; failed findings go to a separate corrector, then fresh
re-reviewers; promote only sections whose latest review passed and is fresh.

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
| Step 2: core-chapter reconciliation            | [core-chapter-reconciliation.md](ledgers/core-chapter-reconciliation.md)                     |

The ledgers record extraction, not independent review. Their historical gate counts are
point-in-time and are not updated. Acceptance fixtures and `corpus/source-map/coverage.yaml`
cite these paths, so do not rename or move a ledger without updating them.

Unresolved issues live in `review/`. The optional semantic-decision layer never changes
canonical rules; see [semantic-decisions.md](semantic-decisions.md).
