# Extraction checkpoint

Read this when the task is corpus extraction, Package F acceptance or continuing a phased
batch. It holds only the current position and the next unit of work. It is not always-on
agent context; do not copy it into [AGENTS.md](../AGENTS.md).

- Plan, priorities and exit conditions: [corpus-completion-plan.md](corpus-completion-plan.md)
- Section and component progress (generated): [coverage-report.md](coverage-report.md)
- Phase structure and data model: [LOD_RULES_CORPUS_PLAN.md](../LOD_RULES_CORPUS_PLAN.md)

## Current position — 22 November 2026

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
- The 2.5 Quick Reference Sheet is archived as `source/vonbraus-qrs-2.5.pdf`
  (`official_reference`, later-edition evidence only).
- Coverage: see the generated [coverage report](coverage-report.md); 677 sections reviewed.
  Phases 7–12 are unfinished.

## Next unit

Step 4 (Phase 7) unit 3b, summary detection: canonical `summary_of` edges in `corpus/graph/`
(extend the `relation` enum in `schemas/graph-edge.schema.json`; `expanded_by` is derived as the
inverse, `precedence` category), added only where the PDF presents one passage as a summary or
reminder of another, never inferred from position or detail. Also report rule pairs that look
duplicated across chapters (same effect, different sections) and disposition each as a summary,
a legitimate repeat or an error (issue #4 items 3 and 20–23). Edges need `corpus-reviewer` review
by the record that governs their `section_id`. Evidence goes in
[phase-7-dependency-graph.md](ledgers/phase-7-dependency-graph.md).

Then (plan in [corpus-completion-plan.md](corpus-completion-plan.md), Step 4):

- Unit 4, anomaly dispositions: a disposition for every dangling id, cycle and unresolved pointer
  in the [graph report](graph-report.md), absorbing the carry-overs below where they fit.

Open carry-overs:

- `issue.0004` still lacks `related` links to the Acute Stress rule and procedure (frozen by
  `review.introduction.2`).
- `issue.phase4.magic_breakage` lists only `character.durability.broken` in `related` (frozen
  by `review.equipment.2`).
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
- `issue.embarking.first_quest_settlement_travel` (frozen by `review.embarking.4`) groups the
  available-quests roll with Settlement Events under "enters"; only Settlement Events prints
  "Whenever the party enters a settlement", the quest roll is "Whenever the party is in a
  settlement" (PDF 132).
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
| Step 4 (Phase 7): dependency graph             | [phase-7-dependency-graph.md](ledgers/phase-7-dependency-graph.md)                           |

The ledgers record extraction, not independent review. Their historical gate counts are
point-in-time and are not updated. Acceptance fixtures and `corpus/source-map/coverage.yaml`
cite these paths, so do not rename or move a ledger without updating them.

Unresolved issues live in `review/`. The optional semantic-decision layer never changes
canonical rules; see [semantic-decisions.md](semantic-decisions.md).
