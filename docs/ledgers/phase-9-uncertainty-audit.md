# Phase 9 uncertainty audit

This ledger records Phase 9 of the [completion plan](../corpus-completion-plan.md#phase-9--independent-review-and-uncertainty-audit):
confirm that every completed review unit has evidence, and that no known uncertainty about the
rulebook lives only in informal notes. Spec: GitHub issue #22. Counts below are point-in-time
(24 November 2026).

The inventory is one fixture per source family under `tests/fixtures/informal-uncertainty/`,
checked by `tests/regression/informal-uncertainty.test.ts` through
`tests/support/informal-uncertainty.ts`. The exit checklist is
`tests/fixtures/acceptance/phase-9.json`, checked by `tests/schema/phase-9-acceptance.test.ts`.

## Inventory checker — T1

The checker finds candidate notes in ledgers, the checkpoint, other docs, corpus YAML note
fields and `no_change_needed` review findings, by anchor headings plus a fixed keyword list
(named constants in the support module). A note that cites an existing `issue.*` id is a pointer,
not a candidate, except checkpoint carry-over bullets, which are always candidates. Each entry has
a locator, a verbatim excerpt and a disposition: `recorded` (issue ids), `resolved` (a review
record or a cited published ruling) or `not_uncertainty` (a reason). Every scanned file belongs to
exactly one family; AGENTS.md and the two generated reports are listed as unscanned. Each checker
rule is shown firing on a minimal broken copy. T12 made all eight families mandatory.

## Graph edge evidence — T13

`tests/schema/independent-review.test.ts` ("committed canonical edges") requires every edge and
summary in `corpus/graph/` to sit in a reviewed section whose governing record is fresh, passing
and examined it. All 17 were covered. The check is `edgeEvidenceGaps` in
`scripts/validate/independent-review.ts`.

## Checkpoint list triage — T2, T3

Eight bullets in the checkpoint's list were triaged:

| Bullet                                              | Outcome                                                   |
| --------------------------------------------------- | --------------------------------------------------------- |
| Sanity once-per-stay limit (changelog 2.21 #83)     | New `issue.sanity.inn_recovery_stay_limit`                |
| Merged Alchemists' Guild availability table         | New `issue.guild.alchemist_availability_merged_tables`    |
| `issue.spell.activation_details` source             | Corrected: PDF 190 "Summon Demon" row source added        |
| `procedure.hate` citation                           | Corrected: heading "Mental Talents", column "Description" |
| Glued words in four quest issues                    | Corrected; meaning unchanged                              |
| `issue.sanity.claustrophobia_stat_scope` enrichment | Applied: PDF 49 Character Creation Example source         |
| `issue.0004` enrichment                             | Dismissed: the Acute Stress link already exists           |
| One-way combat issue links                          | Dismissed: the graph derives the reverse `concerns` edges |

The checkpoint list now holds two bullets, each citing its issue.

## Family inventories — T3 to T10

| Family             | Ticket | Sources                                               | Entries | recorded | resolved | not_uncertainty |
| ------------------ | ------ | ----------------------------------------------------- | ------: | -------: | -------: | --------------: |
| `checkpoint`       | T3     | docs/extraction-checkpoint.md                         |       6 |        2 |        0 |               4 |
| `ledger-core`      | T4     | core-chapter-reconciliation                           |      37 |        4 |        1 |              32 |
| `ledger-lifecycle` | T5     | lifecycle, character-guild, travel-settlement ledgers |      52 |       20 |        0 |              32 |
| `ledger-phases`    | T6     | phase-\* ledgers, package-a-completion-inventory      |      85 |       41 |        1 |              43 |
| `ledger-quest`     | T7     | quest-book-reconciliation, quest-scenario-inventory   |      22 |        3 |        2 |              17 |
| `corpus_note`      | T8     | corpus/\*\*/\*.yaml, tests/examples/\*\*/\*.yaml      |      81 |       65 |        0 |              16 |
| `review_finding`   | T9     | review/independent/\*.yaml                            |      36 |       13 |        0 |              23 |
| `doc`              | T10    | other docs, plans, README, CONTEXT                    |      48 |        3 |        0 |              45 |

Total 367 entries. `review_finding` fell from 62 to 36 when the checker began treating a finding
whose `object_id` is an existing issue as a pointer (T11).

Recurring `not_uncertainty` reasons: point-in-time review-inventory counts; state words for input
not yet supplied or a cure attempt still pending; applied review corrections listed under
"N open" headings; unbound pointers to external components or `not_present` books, dispositioned
in `tests/fixtures/graph-anomaly-dispositions.json`; policy and method text.

New issues raised by the inventories, each with rendered-page source references:

- `issue.magic.broken_shield_magic_scope` (T4, PDF 70)
- `issue.quest.kraghul_antidote_strength` (T8, PDF 240)
- `issue.embarking.entering_the_dungeon_pointer` (T8, PDF 59)
- `issue.alchemy.same_stat_potion_second_drink` (T9, PDF 72)
- `issue.equipment.tobacco_addiction_test_scope` (T9, PDF 182)
- `issue.settlement.arena_fee_unaffordable` (review fixes, PDF 141)

With the two from T2, Phase 9 added 8 issues: `review/ambiguities.yaml` holds 343 (48 resolved).

## Re-reviews — T11

The frozen edits and new issue relations above staled 16 review records. Each was superseded by
a fresh `corpus-reviewer` record (20 records written):

`review.alchemy_core.4`, `review.appendix_iii_general_equipment_a.6`, `review.appendix_iv_spells.3`
(failed: headings were row names) and `.4`, `review.bandits_hideout_and_fountain_room.4`,
`review.chamber_of_reverence_and_great_crypt.4`, `review.embarking.6`, `review.guilds.8`,
`review.into_the_dungeons_actions.10` and `.11`, `review.into_the_dungeons_setup.15`,
`review.magic_items_enchantments.6`, `review.psychology_sanity.5` and `.6`,
`review.psychology_tables.6`, `review.settlements_core.7`, `review.settlements_services.4` and
`.5`, `review.side_quests.3`, `review.spider_queen_and_lava_river.5`.

Correction `aabc3fd` cited the Level 4/6 Magic headings and corrected
`issue.sanity.inn_recovery_stay_limit`'s description of `procedure.sanity_recovery` (a per-stay
marker but no post-quest reset point).

Optional follow-ups the reviewers suggested, not applied because they would stale frozen records:

- `review.guilds.8`: `issue.guild.alchemist_availability_merged_tables` could also quote the
  singular "the table below".
- `review.settlements_services.5`: `character.sanity.inn_recovery` notes still say the procedure
  "carries no per-stay recovery state"; `issue.sanity.inn_recovery_stay_limit` holds the gap.

## Close-out — T12

- Every family fixture is mandatory; a missing one fails the inventory test.
- The extraction guide states the rule: uncertainty lives in `review/`; other notes may point at
  issue ids and the inventory test enforces it.
- `npm run review -- check` on 24 November 2026 at `c2e1899`: 237 records, 0 invalid; each of
  the 53 review units' governing record is fresh and passing; no stale record backs `reviewed`.
- The exit checklist is `accepted` with six rows verified. The checkpoint moves to Phase 11.

## Review fixes

Code review of the integration branch changed these:

- Code: the edge-evidence check moved into the validator module and returns structured gaps.
  The inventory reads manifest source classes from the review snapshot instead of parsing the
  manifest again. A test keeps the TS source-kind and disposition lists equal to the fixture
  schema. The checker header records where it deviates from the spec.
- `docs/naming-conventions.md` lists the `informal.` and `phase_9.` prefixes.
- Re-judged against the rendered PDF: the Embarking "Entering the Dungeon" finding is now
  `recorded` (`issue.embarking.entering_the_dungeon_pointer`). The Arena "cannot pay" finding is
  `recorded` against the new `issue.settlement.arena_fee_unaffordable`. The Psychology
  "inferences" finding stays `not_uncertainty`: the page prints both readings.
- `procedure.rest_energy_point_recovery` and `procedure.rest_mana_recovery` had processed-marker
  descriptions copied from the HP helper. They are corrected, so their two inventory entries are
  gone. The HP helper also loses its stray "(and Energy point …)" phrase.
- These edits staled `review.into_the_dungeons_actions.11` and
  `review.settlements_arena_banking.2`, which need re-review. The `review_check_clean` row of the
  exit checklist must then be refreshed to the new revision.
