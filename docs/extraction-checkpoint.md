# Extraction checkpoint

Read this when the task is corpus extraction, Package F acceptance or continuing a phased
batch. It holds only the current position and the next unit of work. It is not always-on
agent context; do not copy it into [AGENTS.md](../AGENTS.md).

- Plan, priorities and exit conditions: [corpus-completion-plan.md](corpus-completion-plan.md)
- Section and component progress (generated): [coverage-report.md](coverage-report.md)
- Phase structure and data model: [LOD_RULES_CORPUS_PLAN.md](../LOD_RULES_CORPUS_PLAN.md)

## Current position — 24 November 2026

- Phases 0–3 are complete. Phase 4 core mechanics are extracted and tested.
- Phase 5 Batches 1–7 are extracted within catalogue scope (Package E).
- Phase 6 Batches 1–7 are complete at documented scope. Package F is `accepted`: 41
  implemented, 10 covered by another model, 1 nonprocedural, 43 `catalogue_scope`.
- Phase 0–6 exit checklist: `accepted` (22 November 2026), 85 of 85 rows verified.
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
- The Phase 10-owned exit rows are closed (issue #3, 18 October): `phase_1.criterion_3` (one node
  per printed table, book-wide), `phase_5.criterion_3` (typed dice), `phase_5.criterion_5`
  (embedded restrictions, 0 unconverted) and Phase 5 Batch 7 (every listed core table reviewed or
  a redirect). `textCellDiceErrors` in `tests/schema/phase-five.test.ts` now fails any table row
  that prints a die in a text cell without a dice cell, row `rule_refs` or a reasoned exemption
  (`tests/fixtures/text-cell-dice-exemptions.json`, 5 rows). The typed dice and restriction
  conversions were re-reviewed fresh and passing: `review.settlements_core.4`, `review.magic.4`,
  `review.inner_sanctum_and_estate.5`, `review.alchemy_preparations.2`, `review.guilds.4`,
  `review.into_the_dungeons_actions.6`, `review.into_the_dungeons_setup.11`,
  `review.travelling_and_skirmishes.4` and `review.appendix_iii_weapons_armour.3`.
  `governingRecord` now orders same-date records by numeric suffix, so `review.x.10` governs over
  `review.x.9`.
- Step 4 (Phase 7) unit 1 is done (21 October, issues #5–#9): `scripts/graph/` derives the typed
  dependency graph (4861 nodes, 15492 edges, six categories) that retrieval and `lod_expand` now
  read. `npm run graph -- report` regenerates the committed [graph report](graph-report.md): 0
  dangling ids, 41 cycles (`depends_on` 28, `related` 13), 222 unresolved pointers, none with a
  disposition yet. No canonical change; evidence in
  [phase-7-dependency-graph.md](ledgers/phase-7-dependency-graph.md).
- Step 4 (Phase 7) unit 2 is done (21 October, issue #10): `corpus/graph/dependencies.yaml`
  holds the first canonical edge, `edge.quest.start_settlement.first_acceptance`
  (`procedure.quest_acceptance -input_from-> core.quest.start_settlement`, binding `settlement`,
  condition "When you start the game"), under the new `schemas/graph-edge.schema.json` and
  [ADR 0001](adr/0001-canonical-edges-outside-records.md). The new open issue is
  `issue.embarking.first_quest_settlement_travel`. Reviewed as `review.embarking.4`
  (`passed_with_corrections`, after `review.embarking.3` failed on the edge's name and the issue's
  scope). The "embarking on a quest" candidate is `verified`.
- Step 4 (Phase 7) unit 3a is done (22 November, issue #4): `scripts/graph/duplicates.ts` flags
  procedure steps that repeat a rule's effect and quote its text without citing it. Of the 10
  found, 7 now delegate through `rule_refs` (`threat_roll#missed`, `character_improve#double_cost`,
  `settlement_activities_and_overnight#stable_lodging`, `combat_shove#success`,
  `hero_defence#shield_absorbs`/`#spillover`/`#dodge_fumble`); 3 are legitimate repeats in
  `tests/fixtures/step-duplicate-dispositions.json`. Re-reviewed fresh and passing:
  `review.into_the_dungeons_setup.13`, `review.levelling_up.3`, `review.settlements_core.5`,
  `review.combat_actions.5`, `review.combat_enemies.4`. Closes `phase_6.criterion_2`.
- Step 4 (Phase 7) unit 3b is done (23 November, issue #4): `summary_of` is a canonical
  relation (`corpus/graph/summaries.yaml`, 16 edges, each where the PDF itself points from a
  short restatement to the full rule); the graph derives `expanded_by` (`precedence`) as its
  inverse and `lod_expand` follows both. `ruleRepeats` flags rule pairs quoting the same text
  across chapters: of 27, 3 became summary edges and 24 are legitimate repeats in
  `tests/fixtures/rule-repeat-dispositions.json`; none is an error. Re-reviewed fresh:
  `review.game_basics.3`, `review.levelling_up.4`, `review.combat_actions.7` (after `.6` failed
  on the Parry Stance target, now `combat.defence.shield_parry`), `review.treasure.2`,
  `review.psychology_sanity.4`, `review.alchemy_core.3`, `review.into_the_dungeons_actions.8`,
  `review.quests_into_the_ancient_lands.4`.
- Step 4 (Phase 7) unit 4 is done (23 November, issue #11): every graph anomaly has a
  disposition in `tests/fixtures/graph-anomaly-dispositions.json`, checked by
  `tests/graph/anomaly-dispositions.test.ts`. 41 cycles: 13 `reference_cycle`, 26
  `mutual_dependency`, 2 `bounded_reentry`, none ill-defined. Unresolved pointers: of 223, 5
  were bound (the Furniture Treasure Table pointers to `table.treasure.furniture` / Appendix V,
  "the dungeon objects table" to `table.dungeon.obstacles`); the 218 left are
  `modelling_note`, `book_undefined`, `external_book` or `external_component`. Six frozen issues
  gained `related` links or wording fixes. Re-reviewed fresh: `review.combat_actions.8`,
  `review.combat_damage.3`, `review.combat_enemies.5`, `review.embarking.5`, `review.equipment.4`
  (after `.3` failed on the PDF 153 charging rule), `review.guilds.5`,
  `review.into_the_dungeons_actions.9`, `review.introduction.3`,
  `review.magic_items_enchantments.4`, `review.psychology_tables.5`, `review.settlements_core.6`,
  `review.settlements_services.3`, `review.treasure.3`. Step 4 is complete.
- Phase 8 slice 1 is done (24 November, issue #14, spec #13): the example inventory
  `tests/fixtures/example-inventory.json`, checked by `tests/regression/example-inventory.test.ts`.
  35 entries in 29 sections claim all 94 `source_example` cases: 30 `executable` (1 `pending`),
  4 `source_conflicted`, 1 `descriptive`. All 677 non-redirect sections are on the unswept
  allowlist. No corpus change and no re-review; evidence in
  [phase-8-worked-examples.md](ledgers/phase-8-worked-examples.md).
- The 2.5 Quick Reference Sheet is archived as `source/vonbraus-qrs-2.5.pdf`
  (`official_reference`, later-edition evidence only).
- Coverage: see the generated [coverage report](coverage-report.md); 677 sections reviewed.
  Phases 7–12 are unfinished.

## Next unit

Phase 8 chapter slices, which can run in parallel: sweep one chapter group each, inventory and
convert its examples, shrink `unswept_sections`, update coverage and re-review what goes stale.

- #15 Game Basics through Embarking
- #16 Into the Dungeons, Treasure, Combat
- #17 Equipment, Psychology, Magic, Magic Items, Alchemy, Prayers — done (24 November): 8 new
  entries, 7 `source_example` cases, re-reviews `review.equipment.5`, `review.magic.5`,
  `review.magic_items_enchantments.5`, `review.alchemy_preparations.3`, `review.prayers.4`;
  evidence in [phase-8-worked-examples.md](ledgers/phase-8-worked-examples.md)
- #19 Travel, Settlements, Guilds, Inner Sanctum, Estate, Appendices
- #18 Quest Book I, Backgrounds — done (24 November): 5 new entries, 14 `source_example` cases,
  3 new issues, re-reviews `review.the_dead_rising.4`, `review.backgrounds.3`,
  `review.bandits_hideout_and_fountain_room.3`, `review.chamber_of_reverence_and_great_crypt.3`,
  `review.spider_queen_and_lava_river.4`; evidence in
  [phase-8-worked-examples.md](ledgers/phase-8-worked-examples.md)

Then #20 closes Phase 8 (no `pending`, empty allowlist) and moves this checkpoint to Phase 9
(uncertainty audit), Phase 11 (`build:corpus`) and Phase 12 (retrieval).

Open carry-overs:

- `procedure.sanity_recovery` (frozen) has no per-stay field, so the changelog #83 once-per-stay
  limit on `character.sanity.inn_recovery` is recorded but not enforced.
- `table.guild.alchemist_availability` merges the Alchemists' Guild's two printed tables because
  46 frozen `part.*` / `ingredient.*` entities cite its rows; split it when those are next
  reviewed.
- `issue.spell.activation_details` needs heading "Summon Demon" and a PDF 190 source (frozen by
  an earlier tier's record).
- `procedure.hate` cites PDF 178 as heading "Hate", column "Effect"; the page prints "Mental
  Talents", columns Talent and Description (Psychology unit).
- Glued words in the summaries of the frozen issues `issue.quest.side_quest_availability`,
  `issue.quest.tomb_raiders_threat_boundary`, `issue.quest.spider_queen_cobweb_mapping` and
  `issue.quest.cleansing_healing_potion_strength`; none misstates the book.
- `issue.sanity.claustrophobia_stat_scope` (frozen) could cite the Character Creation Example's
  "Claustrophobic (-10 CS in corridors)" (PDF 49–50).
- `issue.0004` could also relate `condition.acute_stress` and
  `character.equipment.consumable.dwarven_ale.drink` ("for the rest of the quest", PDF 182) and
  cite the PDF 57 Acute Stress row (optional, raised by `review.introduction.3`).
- `procedure.enemy_attack.issues` and `combat.action.pick_up_weapon` do not list
  `issue.combat.enemy_fumble_pickup_dex` / `issue.combat.shield_parry_95_durability` back
  (one-way links, raised by `review.combat_damage.3`).

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
| Step 4 (Phase 7): dependency graph             | [phase-7-dependency-graph.md](ledgers/phase-7-dependency-graph.md)                           |
| Phase 8: worked examples                       | [phase-8-worked-examples.md](ledgers/phase-8-worked-examples.md)                             |

The ledgers record extraction, not independent review. Their historical gate counts are
point-in-time and are not updated. Acceptance fixtures and `corpus/source-map/coverage.yaml`
cite these paths, so do not rename or move a ledger without updating them.

Unresolved issues live in `review/`. The optional semantic-decision layer never changes
canonical rules; see [semantic-decisions.md](semantic-decisions.md).
