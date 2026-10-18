# Extraction checkpoint

Read this when the task is corpus extraction, Package F acceptance or continuing a phased
batch. It holds only the current position and the next unit of work. It is not always-on
agent context; do not copy it into [AGENTS.md](../AGENTS.md).

- Plan, priorities and exit conditions: [corpus-completion-plan.md](corpus-completion-plan.md)
- Section and component progress (generated): [coverage-report.md](coverage-report.md)
- Phase structure and data model: [LOD_RULES_CORPUS_PLAN.md](../LOD_RULES_CORPUS_PLAN.md)

## Current position — 18 October 2026

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
- Step 2 tier 6 is reconciled and independently reviewed (15 October): the Travel and
  Settlements part node (`review.travel_and_settlements.1`), Travelling and Skirmishes
  (`review.travelling_and_skirmishes.2`), Settlements as four units (`review.settlements_core.3`,
  `review.settlements_catalogue.1`, `review.settlements_arena_banking.2`,
  `review.settlements_services.2`), the five guild chapters (`review.guilds.3`) and The Inner
  Sanctum with Buying an Estate (`review.inner_sanctum_and_estate.4`); 98 sections. The Grieving
  Mother side quest stays `extracted` for Step 3. Changelog 2.21 entry 166 (Rations and Resting:
  −1 per character, mercenaries included, not dogs) is applied and resolves
  `issue.psychology.hungry_morale_duration_and_travel_penalty`; 173, 174, 177–179 are applied;
  80, 168–171, 172 and 176 are recorded, not applied. `state_machine.quest_dungeon` now quotes
  PDF 132–133 with typed offer, reject and departure guards (`review.into_the_dungeons_setup.7`).
  `section.travelling_and_skirmishes.table_2` is now a redirect.
- Step 2 tier 7 is reconciled and independently reviewed (17 October): front matter, the
  Appendices part node and Appendices I–V, Adding a Third Dimension and back matter, as twelve
  review units; 137 sections promoted, 21 continuation table nodes stay `mapped`. Changelog 2.2x
  entries 113, 114, 180–193, 89 and 128 are applied. `issue.phase6.iron_wedges_movement` and
  `issue.treasure.legendary_followup` were changed by user decision and the records they froze
  re-reviewed (`review.combat_enemies.3`, `review.into_the_dungeons_setup.8`,
  `review.appendix_v_legendary_b.2`). Step 2 is complete: every non-quest section except
  Backgrounds is `reviewed` or a `mapped` redirect.
- Step 3 is reconciled and independently reviewed (18 October): Quest Book I, Backgrounds and the
  Grieving Mother side quest at catalogue scope, as eight units (`review.quest_book_i.1`,
  `review.quest_book_introduction.2`, `review.backgrounds.2`, `review.the_dead_rising.2`,
  `review.spider_queen_and_lava_river.3`, `review.bandits_hideout_and_fountain_room.2`,
  `review.chamber_of_reverence_and_great_crypt.2`, `review.quests_into_the_ancient_lands.3`,
  `review.side_quests.2`); 132 sections promoted. A quest whose page prints no procedure of its own
  marks `procedures: not_applicable` and names the shared procedures it runs through. Changelog
  2.21 entries 103/194, 111, 142, 143 and 195 are applied; 104, 105, 107–110 and 112 are recorded,
  not applied. Every non-redirect section of the book is now `reviewed` (677); the 38 compatibility
  redirects stay `mapped`.
- The 2.5 Quick Reference Sheet is archived as `source/vonbraus-qrs-2.5.pdf`
  (`official_reference`, later-edition evidence only).
- Coverage: see the generated [coverage report](coverage-report.md); 677 sections reviewed.
  Phases 7–12 are unfinished.

## Next unit

Close the Phase 0–6 exit rows that Phase 10 owns, then start Step 4 (Phase 7). Phase 10's
coverage exit holds (every section reviewed or a redirect), but these rows in
`tests/fixtures/acceptance/phases-0-6.json` are still `pending`:

- `phase_1.criterion_3` (every printed table has exactly one node): confirm from the review records
  and `sections.yaml`, and turn `section.appendix_iii_equipment.general_equipment.table` into a
  redirect if it still duplicates the PDF 186 Sell and Repair table.
- `phase_5.criterion_3` (typed dice): a corpus-wide scan of table text cells still finds about 35
  rows printing a die with neither a dice/composite cell nor a row `rule_refs` (mostly
  `table.settlement.quest_sites`, `table.settlement.events`, `table.magic.miscast`,
  `table.estate.furnishings`, `table.magic.demons`); some may be typed through rules linked
  elsewhere. Most sit in frozen records, so fixes need a re-review of the record that freezes them.
- `phase_5.criterion_5` (embedded restrictions as rules): Steps 2–3 audited each unit; record the
  corpus-wide evidence.
- `phase_6.criterion_2` (procedure/rule duplication) and the Phase 5 Batch 7 and "embarking on a
  quest" rows close with Step 4 as the plan assigns.

Open carry-overs:

- `issue.0004` still lacks `related` links to the Acute Stress rule and procedure (frozen by
  `review.introduction.2`).
- `issue.phase4.magic_breakage` lists only `character.durability.broken` in `related` (frozen
  by `review.equipment.2`).
- `issue.rest.without_ration` still cites entry 124's −4 (frozen by
  `review.into_the_dungeons_actions.3`); entries 148 and 166 supersede it.
- `issue.phase4.recovery_bounds` should say that "only half (RDD)" (PDF 147) settles rounding,
  not the base, and relate `procedure.settlement_activities_and_overnight`.
- `procedure.sanity_recovery` (frozen) has no per-stay field, so the changelog #83 once-per-stay
  limit on `character.sanity.inn_recovery` is recorded but not enforced.
- `table.guild.alchemist_availability` merges the Alchemists' Guild's two printed tables because
  46 frozen `part.*` / `ingredient.*` entities cite its rows; split it when those are next
  reviewed.
- `issue.spell.activation_details` needs heading "Summon Demon" and a PDF 190 source (frozen by
  an earlier tier's record).
- `procedure.hate` cites PDF 178 as heading "Hate", column "Effect"; the page prints "Mental
  Talents", columns Talent and Description (Psychology unit).
- `issue.combat.enemy_fumble_pickup_dex` and `issue.combat.shield_parry_95_durability` should
  relate `combat.action.pick_up_weapon` and `procedure.enemy_attack` (frozen by
  `review.combat_actions.4` and `review.combat_damage.2`).
- Glued words in the summaries of the frozen issues `issue.quest.side_quest_availability`,
  `issue.quest.tomb_raiders_threat_boundary`, `issue.quest.spider_queen_cobweb_mapping` and
  `issue.quest.cleansing_healing_potion_strength`; none misstates the book.
- `issue.sanity.claustrophobia_stat_scope` (frozen) could cite the Character Creation Example's
  "Claustrophobic (-10 CS in corridors)" (PDF 49–50).
- The GM table in `clients/web` still uses a flat −2 for going hungry; the corpus applies −1 per
  hungry character (not dogs), once, until the party eats.

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
| Step 3: Quest Book I and Backgrounds           | [quest-book-reconciliation.md](ledgers/quest-book-reconciliation.md)                         |

The ledgers record extraction, not independent review. Their historical gate counts are
point-in-time and are not updated. Acceptance fixtures and `corpus/source-map/coverage.yaml`
cite these paths, so do not rename or move a ledger without updating them.

Unresolved issues live in `review/`. The optional semantic-decision layer never changes
canonical rules; see [semantic-decisions.md](semantic-decisions.md).
