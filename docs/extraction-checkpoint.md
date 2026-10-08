# Extraction checkpoint

Read this when the task is corpus extraction, Package F acceptance or continuing a phased
batch. It holds only the current position and the next unit of work. It is not always-on
agent context; do not copy it into [AGENTS.md](../AGENTS.md).

- Plan, priorities and exit conditions: [corpus-completion-plan.md](corpus-completion-plan.md)
- Section and component progress (generated): [coverage-report.md](coverage-report.md)
- Phase structure and data model: [LOD_RULES_CORPUS_PLAN.md](../LOD_RULES_CORPUS_PLAN.md)

## Current position — 8 October 2026

- Phases 0–3 are complete. Phase 4 core mechanics are extracted and tested.
- Phase 5 Batches 1–7 are extracted within catalogue scope (Package E).
- Phase 6 Batches 1–7 are complete at documented scope. Package F is `accepted`: 41
  implemented, 10 covered by another model, 1 nonprocedural, 43 `catalogue_scope`.
- Phase 0–6 exit checklist: 79 of 85 rows verified; the 6 open rows are assigned to Step 2
  tier 7, Phase 7 and Phase 10 in the plan.
- Step 2 tiers 1–2 are reconciled and independently reviewed: Introduction, Game Basics,
  Character Basics, Creating Your Character, Levelling Up, Embarking on Your First Quest and
  the Party Management part node (90 sections; `review.*.2` records, all passed with
  corrections after a failed first review and a correction pass).
- Step 2 tier 3 is reconciled and independently reviewed: Equipment (18 sections,
  `review.equipment.2`) and Psychology (9 sections, reviewed as three units:
  `review.psychology_sanity.3`, `review.psychology_party_morale.2`,
  `review.psychology_tables.2`). Changelog 2.21 entry 36 (hero dies, Party Morale −5) is
  applied; entry 37 (Arachnophobia) is recorded as evidence only.
- Step 2 tier 4 is reconciled and independently reviewed: the Academic Skills part node,
  Magic (`review.magic.3`), Magic Items and Enchantments, Alchemy (two units) and Prayers;
  109 sections. Changelog 2.21 entry 149 (enemy casters) is recorded, not applied.
- Step 2 tier 5 is reconciled and independently reviewed (8 October): the Dungeoneering and
  Combat part node (`review.dungeoneering_and_combat.1`), Into the Dungeons as three units
  (`review.into_the_dungeons_setup.2`, `review.into_the_dungeons_movement.2`,
  `review.into_the_dungeons_actions.3`), Treasure (`review.treasure.1`) and Combat as three units
  (`review.combat_actions.4`, `review.combat_enemies.2`, `review.combat_damage.2`); 83
  sections, including four new flowchart nodes (Opening a Door or Chest, Combat Turn, Hero
  Attack, Enemy Attack). `section.into_the_dungeons.table_3` is now a redirect. Changelog 2.21
  entries 67, 155 and 160 are applied; 159 (Initiative token stacking), 162, 164 and 165 are
  recorded, not applied.
- The 2.5 Quick Reference Sheet is archived as `source/vonbraus-qrs-2.5.pdf`
  (`official_reference`, later-edition evidence only).
- Coverage: see the generated [coverage report](coverage-report.md); 309 sections reviewed.
  Phases 7–12 are unfinished.

## Next unit

Step 2, tier 6: Travelling and Skirmishes, Settlements, guilds, Inner Sanctum, Buying an Estate
(PDF 125–166). Reconcile with `npm run report:chapters`, then one fresh `corpus-reviewer` per
review unit of at most about 12 pages or 150 objects; failed findings go to a separate
corrector, then fresh re-reviewers; promote only sections whose latest review passed and is
fresh. Open carry-overs:

- `issue.0004` still lacks `related` links to the Acute Stress rule and procedure (frozen by
  `review.introduction.2`).
- `issue.phase4.magic_breakage` lists only `character.durability.broken` in `related` (frozen
  by `review.equipment.2`).
- Going hungry: changelog 2.21 entry 148 (-1 per hungry character) is applied to
  `character.morale.event.hungry` by user decision, superseding entry 124's flat -4.
  `issue.psychology.hungry_morale_duration_and_travel_penalty` (open) asks how it combines with
  Rations and Resting's -4 (PDF 127), which `procedure.travel_food_and_rest` still applies;
  settle it with the Travelling extraction. `issue.rest.without_ration` still cites entry 124's
  -4 (frozen by `review.into_the_dungeons_actions.3`). The GM table in `clients/web` still uses
  a flat -2.
- `state_machine.quest_dungeon` offered/accepted transitions (PDF 132–133) still paraphrase;
  check them in tier 6.

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
