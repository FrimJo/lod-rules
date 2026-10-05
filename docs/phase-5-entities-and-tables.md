# Phase 5 — Entities and tables

## Status and boundaries

Phase 5 is in progress, not complete. Records remain extracted, not independently reviewed.
Procedures and state machines are tracked separately in the active
[Phase 6 ledger](phase-6-procedures-and-state-machines.md). Quest mechanical geometry
is bounded and source-evidenced; comprehensive map audits, dependency-graph generation
and corpus builds remain deferred. External books are unavailable; their contents
are not invented. See [current project status](../README.md#status) for corpus-wide counts.

Work proceeds in the seven approved batches: character catalogues; talents/perks; equipment
and magic items; spells/prayers/alchemy; treasures; settlements/guilds; quests and remaining
tables. Each extraction unit is one heading, one table, or a related 1–4-page range.

## Evidence ledger

- PDF 30–31: all four species profiles and four initial-stat tables; species restrictions and Halfling benefits. IDs: `species.*`, `table.character.{dwarf,elf,halfling,human}_stats`, `character.species.*`.
- PDF 34–41: all eight professions and skill tables, retaining the pilot Alchemist/Thief records. Alternative talent choices, starting equipment and spell/prayer/perk choices remain distinct; Warrior Priest Energy explicitly overrides the default.
- PDF 42–48: all 20 backgrounds, 15 personal quest records, and their local rules. IDs: `background.*`, `quest.background.*`, `character.background.*`. Full personal-quest procedures remain deferred.
- Independent table matrices, catalogue schema/reference tests, and 51 background boundary scenarios are in the Phase 5 test files. Historical Batch 1 gate: 130 canonical files validate; 652 tests pass; lint passes.
- Open issues: Rogue backpacks; Lost Brother skirmish burial reward; missing Minotaur reward. Resolved by designer rulings: Ranger starting Longbow versus species restrictions (Dwarf and Halfling Rangers take a Shortbow) and heirloom longsword/shortsword wording (shortsword).

Batches 1–7 are extracted within their bounded catalogue scope. Package E acceptance
is recorded in the [quest inventory](quest-scenario-inventory.md); comprehensive
full-book reconciliation and independent review remain pending. The [Package A inventory](package-a-completion-inventory.md) records
settlement/guild/estate rules, entities, table links and explicit source boundaries.
The estate side quest on PDF 164–165 is catalogue-extracted; estate lifecycle procedures
remain Package F.

- PDF 172–178: 88 talents across all eight categories, preserving the original pilot IDs and expanding their tables in place. Rendered pages exposed merged text rows and stray page-number text; canonical cells were checked against the render.
- PDF 168–171: 41 perks across seven categories, with all three printed columns and explicit blank cells. Rules preserve activation costs, variable Energy spending, timing, limits and exceptions. Missing Leader/Arcane/Alchemist table nodes were added; false table splits retain compatibility redirects.
- Thirty derived ability fixtures cover usage, costs, prerequisites, threshold boundaries, duration outputs and exceptions. Five added negative schema/integrity tests cover perk costs, blank cells and quest scope.
- Additional open issues: Sense for Gold’s “subtract -1” sign; Hunter’s Eye bow effect versus sling eligibility. Independent review remains pending.

### Batch 3 — equipment and magic items (complete within scope)

All five approved units have source evidence. The authoritative pages were read and rendered;
this audit and the independently transcribed fixtures are not independent review.

| Unit                            | Source / evidence                                                                                                                                                                                                                               | Verification and boundaries                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weapons and armour              | PDF 179–180, printed 177–178. `table.equipment.weapons`, `.armour`, `.shields`; all 14 original definition IDs retained and made mechanical, with supporting rules under `combat.weapon.special.*` and `character.equipment.{armour,shield}.*`. | Complete cell matrices in `phase-five-equipment.test.ts`; sourced outcomes in `tests/examples/equipment/batch-three.yaml`. AP feeds `combat.damage.basic`; Dual Wield feeds existing talent damage; stacking reuses core defence/outer-layer damage; Fast overrides ordinary parry/fumble damage. Net use includes misses. Constant modifier channels keep Clunky and stacked-zone penalties non-cumulative. Undefined Specials remain `issue.phase5.weapons_undefined_specials`; Arbalest's literal STR 55 requirement is extracted without inventing a broader definition. |
| Alchemy equipment and transport | PDF 181, printed 179. Eight alchemy rows and five transport rows; `character.equipment.alchemy.*`, `.transport.*`, and `quick_slot_stack`.                                                                                                      | Potion dice/75% boundary, belt capacity/damage, mount prerequisites and storage capacities are structured. Recipes and exact travel-speed procedures remain later dependencies. Table costs and slash notation stay unchanged.                                                                                                                                                                                                                                                                                                                                               |
| General equipment               | PDF 182–185, printed 180–183. Consumables, Jewellery, Light Sources, Miscellaneous, Tools; associated `character.equipment.*` rules in `catalogue-effects.yaml`.                                                                                | `phase-five-general-cells.test.ts` independently checks every cell of all 35 rows, including complete Special text. Corrected Holy Water's omitted undead restriction and restored Combat Harness's printed “also damage” wording. Fixtures cover tobacco limits/addiction, quest duration, light expiry and exceptions, capacities, consumable uses and repair dice. Monster characteristics, potion throwing and treasure variants remain supplied dependencies.                                                                                                           |
| Equipment chapter and repair    | PDF 51–54 and 186, printed 49–52 and 184. `chapter-audit.yaml`, existing `encumbrance-durability.yaml`, and `table.equipment.weapon_class_strength`.                                                                                            | Rendered PDF 51 proves the legacy `section.equipment.coins.table` is the Class/Strength table. Its ID is retained, title corrected and parent set to `section.equipment.weapon_class`. Added optional Quiver heading/rule, reload and enemy-stat scope, Mithril and initial sale value. Existing repair table and core rules are reused, including sale eligibility and price composition. PDF 54 is selection advice, with a 66% jacket illustration; its full printed-example conversion remains Phase 8. No extra mechanic is inferred from that advice.                  |
| Magic items and enchantments    | PDF 70–71, printed 68–69. `character.magic_item.*` in `magic-items-enchantments.yaml`; existing magical durability/dissipation rules retained.                                                                                                  | Identification attempt/use restrictions, Legendary-inclusive jewellery limits, recharge of unbroken items, prerequisites, success/failure, scroll focus/parchment and between-quest/time limits have fixtures. Spell, Powerstone, treasure and settlement-service catalogues remain dependencies. Powerstone consumption on success is not stated here. Broken-magic repair stays `issue.phase4.magic_breakage`.                                                                                                                                                             |

At the Batch 3 milestone, the catalogue had 98 equipment entities linked to **ten catalogue tables** (Weapons, Armour,
Shields, Alchemy, Animals/transportation, Consumables, Jewellery, Light Sources, Miscellaneous,
Tools). Including the existing Sell and Repair table and the new Class/Strength reference,
there are **12 equipment tables**. Tier bands are structural rows, never equipment entities.
Starting equipment binds only where identity is unambiguous. Validation rejects non-reciprocal
entity/row links, invalid or absent categories, unknown references and tier bands with entities.

Composition boundaries are explicit: each item rule is applied only to that item/context;
rule inputs carry the printed parameter or supplied roll. Modifier channels such as
`stacking_dex_modifier` and `clunky_dex_modifier` represent distinct sources and are not repeatedly
added for each hit zone/piece. Light bonuses end with that light; multi-light aggregation is not
invented. Invocations record handoffs and never recursively execute another procedure. Optional
quivers require `optional_quiver_enabled`; no quiver behavior is imposed when disabled. Armour
repair-kit dice are supplied separately for each equipped piece before discarding the kit.

Retained limitations: crowbar AP timing, the Iron Wedges 6 AP versus wandering-token 5–6
contradiction, undefined weapon Specials, magical breakage, missing card/monster content and
later travel procedures (spell/recipe bindings were added in Batch 4; treasure/Powerstone bindings in Batch 5). Neither these dependencies nor passing
tests imply an independently reviewed section. Parent coverage can remain partial for later
procedure, glossary or full-book example work even though this batch's equipment scope is done.

### Batch 4 — spells, prayers and alchemy (complete within scope)

Each unit was checked against the canonical PDF, including rendered tables and recipes.
Printed folios come from `pages.yaml`. False spell-table splits keep compatibility redirects;
Level 2 and missing rule headings are mapped. This is extraction and regression verification,
not independent review.

| Unit                           | Source and extracted IDs                                                                                           | Evidence and limits                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Magic foundations              | PDF 64–67, printed 62–65; `core.magic.*`, `table.magic.miscast`, `table.magic.demons`                              | Mana/upkeep, Standard/Quick/Incantation, MM/Touch, costs, thresholds, adjacent enemies, all miscasts, power, perfect casts, focus, dispelling and scroll exceptions. Focus example and wounded-scroll conflicts remain review issues. Learning execution stays Batch 6.                                                                                  |
| Spell catalogue                | PDF 187–192, printed 185–190; `spell.*`, `core.spell.*`, `table.spells.level_1` through `.level_6`                 | 54 spells; all seven columns and complete effect text, blank Special cells and nonnumeric Mana. Independent full-cell matrices in `tests/tables/expected/spells.txt`. Healing’s `1d/+2`, Earth Elemental’s `ML` and unspecified summon/control timing stay explicit limitations.                                                                         |
| Components and mixing          | PDF 72–76, printed 70–74; `ingredient.*`, `part.*`, `character.alchemy.*`, `table.alchemy.habitats`, `.harvesting` | 20 ingredients and 32 parts; all 88 harvest rows, six habitat columns with typed percentile ranges, unavailable markers and source green-cell annotations. Ordinary versus optional simplified mixing, quantities, exquisite bonus, recipe bonus, failure and non-stacking remain separate. Travel gathering execution and settlement services deferred. |
| Recipes and preparations       | PDF 78–81, printed 76–79; `recipe.*`, `equipment.alchemy.*`, `table.alchemy.common_recipes`, `.strengths`          | All six recipes retain printed result/component names and unit quantities. All 29 described preparations have effects; existing cure identities are reused. Differently named treasure/recipe/equipment preparations are not silently merged. PDF 77 is artwork, with no rule/table to extract. Thrown attacks remain combat handoffs.                   |
| Treasure alchemy tables        | PDF 197–198, printed 195–196; `table.alchemy.weak_supreme`, `.standard`, `.ingredients`, `.parts`                  | Complete price/selector matrices, merged-cell blanks and superscript markers. Standard Potions prose and headings disagree; table is preserved without fabricated probabilities. Part footnote `1` has no explanation on the page. Reuse in Batch 5.                                                                                                     |
| Prayers and relic restrictions | PDF 82–83, printed 80–81; `prayer.*`, `character.prayer.*`                                                         | All 18 prayers across levels 1–4; free activation, Energy, impeccable rolls, duration, interruption, targets, limits and effects. Methia’s Balm remains level 1 across the page break. Learning execution remains a later batch; Batch 5 now supplies the relic catalogue.                                                                               |

Schemas add typed spell/prayer levels, schools, potion qualities and recipe components/results.
Reciprocal row validation covers the new catalogue types; structural rows reject entity links,
and equipment-table restrictions remain. Existing equipment, Frenzy, enchantment and dungeon
records are linked where identity is established. No generic property bag or runtime was added.

Tests: `magic-foundations.test.ts`, `alchemy-prayers.test.ts`, `magic-alchemy.test.ts` and
`magic-alchemy-cells.test.ts`, with independent matrices under `tests/tables/expected/`.
They cover invalid kinds/levels/qualities/references, all spell/ingredient/harvest/price/recipe
cells, miscasts/demons, rounding and thresholds, upkeep, focus/power, scrolls, prayer
interruptions, potion potency/durations, non-stacking and both alchemy branches.

Additional source limits are `issue.magic.*`, `issue.spell.*` and `issue.alchemy.*` in
`review/ambiguities.yaml`. Bestiary statistics and card contents remain unavailable. Source
examples and learning/travel/service/attack sequences outside this batch are not claimed as
executable. Both Phase 5 and independent review remain unfinished.

## Catalogue inventory

The headings below are the catalogue-bearing source areas. Their child entities and embedded
rules must be audited against the PDF; a mapped heading is not extracted catalogue content.

| Section                           | PDF pages | Disposition                                                                  |
| --------------------------------- | --------- | ---------------------------------------------------------------------------- |
| `section.quest_book_i`            | 221–279   | Pending; retain existing pilot/core records                                  |
| `section.creating_your_character` | 29–41     | Catalogue content extracted; final audit pending                             |
| `section.backgrounds`             | 42–50     | Catalogue content extracted; final audit pending                             |
| `section.equipment`               | 51–54     | Batch 3 equipment audit complete within scope                                |
| `section.magic`                   | 64–69     | PDF 64–67 extracted in Batch 4; later material remains scoped separately     |
| `section.magic_items`             | 70–70     | Batch 3 rules extracted; dependencies explicit                               |
| `section.enchantments`            | 71–71     | Batch 3 rules extracted; dependencies explicit                               |
| `section.alchemy`                 | 72–81     | Batch 4 extracted; travel/settlement procedures deferred                     |
| `section.prayers`                 | 82–84     | Batch 4 prayers and relic restrictions extracted; learning deferred          |
| `section.settlements`             | 132–147   | Batch 6 tables and service profiles extracted; procedures bounded separately |
| `section.the_dark_guild`          | 148–150   | Equipment catalogue extracted; training execution deferred                   |
| `section.fighters_guild`          | 151–152   | Equipment and bounty tables extracted; activities deferred                   |
| `section.wizards_guild`           | 153–153   | Staff catalogue extracted; activities deferred                               |
| `section.alchemists_guild`        | 154–155   | Availability tables extracted; activities deferred                           |
| `section.rangers_guild`           | 156–157   | Equipment and trophy-sale tables extracted; activities deferred              |
| `section.the_inner_sanctum`       | 158–159   | Equipment and crusade tables extracted; activities deferred                  |
| `section.buying_an_estate`        | 160–166   | Furnishings and ghost events extracted; side quest and lifecycle deferred    |
| `section.appendix_i_perks`        | 168–171   | Catalogue content extracted; final audit pending                             |
| `section.appendix_ii_talents`     | 172–178   | Catalogue content extracted; final audit pending                             |
| `section.appendix_iii_equipment`  | 179–186   | Batch 3 tables and item rules extracted                                      |
| `section.appendix_iv_spells`      | 187–192   | Batch 4 all six level tables and effects extracted                           |
| `section.appendix_v_treasures`    | 193–215   | Batches 4–5 extracted; PDF 214–215 artwork only                              |

## Table inventory

All canonical mapped table nodes are listed; compatibility redirects remain in the source map
and are excluded here. Completion means all printed cells and footnotes have been checked,
not merely that a table object exists. Pending nodes require PDF classification before exclusion.

| Section                                                                                                        | PDF pages | Table component at phase entry |
| -------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------ |
| `section.front_matter.index_of_art.table`                                                                      | 11–11     | mapped                         |
| `section.buying_an_estate.ghostly_events_table`                                                                | 162–162   | mapped                         |
| `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`                                       | 186–186   | extracted                      |
| `section.appendix_v_treasures.table_of_relics`                                                                 | 196–196   | extracted                      |
| `section.appendix_v_treasures.table_of_powerstones`                                                            | 199–199   | extracted                      |
| `section.creating_your_character.choosing_your_species.table`                                                  | 29–29     | mapped                         |
| `section.creating_your_character.choosing_your_species.table_2`                                                | 29–29     | extracted                      |
| `section.creating_your_character.table`                                                                        | 30–30     | extracted                      |
| `section.creating_your_character.table_2`                                                                      | 30–30     | extracted                      |
| `section.creating_your_character.table_3`                                                                      | 31–31     | extracted                      |
| `section.creating_your_character.table_4`                                                                      | 31–31     | extracted                      |
| `section.creating_your_character.alchemist.table_skills`                                                       | 34–34     | extracted                      |
| `section.creating_your_character.barbarian.table_skills`                                                       | 35–35     | extracted                      |
| `section.creating_your_character.ranger.table_skills`                                                          | 36–36     | extracted                      |
| `section.creating_your_character.rogue.table_skills`                                                           | 37–37     | extracted                      |
| `section.creating_your_character.thief.table_skills`                                                           | 38–38     | extracted                      |
| `section.creating_your_character.warrior.table_skills`                                                         | 39–39     | extracted                      |
| `section.creating_your_character.warrior_priest.table_skills`                                                  | 40–40     | extracted                      |
| `section.creating_your_character.wizard.table_skills`                                                          | 41–41     | extracted                      |
| `section.equipment.coins.table`                                                                                | 51–51     | extracted                      |
| `section.psychology.sanity.table`                                                                              | 55–55     | extracted                      |
| `section.psychology.table`                                                                                     | 57–57     | extracted                      |
| `section.psychology.table_lingering_trauma_table`                                                              | 57–57     | extracted                      |
| `section.psychology.party_morale.table`                                                                        | 58–58     | extracted                      |
| `section.levelling_up.table`                                                                                   | 60–60     | extracted                      |
| `section.levelling_up.stats_and_skills_maximum.table`                                                          | 60–60     | extracted                      |
| `section.levelling_up.increasing_your_skills_and_basic_stats.table`                                            | 61–61     | mapped                         |
| `section.levelling_up.talents_and_perks.table_talents`                                                         | 62–62     | mapped                         |
| `section.levelling_up.talents_and_perks.table_perks`                                                           | 62–62     | mapped                         |
| `section.magic.casting_spells.table`                                                                           | 65–65     | extracted                      |
| `section.magic.casting_spells.table_2`                                                                         | 65–65     | extracted                      |
| `section.magic.casting_spells.table_3`                                                                         | 65–65     | compatibility redirect         |
| `section.alchemy.table`                                                                                        | 73–73     | extracted                      |
| `section.alchemy.table_2`                                                                                      | 75–75     | extracted                      |
| `section.into_the_dungeons.table`                                                                              | 91–91     | mapped                         |
| `section.into_the_dungeons.table_2`                                                                            | 91–91     | mapped                         |
| `section.into_the_dungeons.table_3`                                                                            | 91–91     | mapped                         |
| `section.into_the_dungeons.table_4`                                                                            | 94–98     | mapped                         |
| `section.into_the_dungeons.opening_a_door_or_chest.table`                                                      | 101–101   | extracted                      |
| `section.into_the_dungeons.table_red_levers`                                                                   | 104–104   | mapped                         |
| `section.into_the_dungeons.table_5`                                                                            | 105–105   | mapped                         |
| `section.combat.hero_attacking.table`                                                                          | 115–115   | mapped                         |
| `section.combat.detailed_acting_with_enemies.table`                                                            | 119–119   | mapped                         |
| `section.combat.detailed_acting_with_enemies.table_2`                                                          | 119–119   | mapped                         |
| `section.combat.different_kinds_of_damage.table`                                                               | 121–121   | mapped                         |
| `section.travelling_and_skirmishes.table`                                                                      | 128–128   | mapped                         |
| `section.travelling_and_skirmishes.table_2`                                                                    | 130–130   | mapped                         |
| `section.settlements.general.table`                                                                            | 132–132   | mapped                         |
| `section.settlements.general.table_2`                                                                          | 132–132   | mapped                         |
| `section.settlements.table`                                                                                    | 133–133   | mapped                         |
| `section.settlements.activities_in_a_settlement.table`                                                         | 133–133   | mapped                         |
| `section.settlements.table_2`                                                                                  | 134–134   | mapped                         |
| `section.settlements.settlement_events.table`                                                                  | 135–135   | mapped                         |
| `section.settlements.settlement_events.table_2`                                                                | 135–135   | mapped                         |
| `section.settlements.settlement_events.table_3`                                                                | 135–135   | mapped                         |
| `section.settlements.settlement_events.table_4`                                                                | 135–135   | mapped                         |
| `section.settlements.arena_fighting.table`                                                                     | 141–141   | mapped                         |
| `section.settlements.arena_fighting.table_2`                                                                   | 141–141   | mapped                         |
| `section.settlements.arena_fighting.table_3`                                                                   | 141–141   | mapped                         |
| `section.settlements.arena_fighting.table_4`                                                                   | 141–141   | mapped                         |
| `section.settlements.arena_fighting.table_5`                                                                   | 141–141   | mapped                         |
| `section.settlements.table_3`                                                                                  | 142–142   | mapped                         |
| `section.settlements.table_4`                                                                                  | 142–142   | mapped                         |
| `section.settlements.banking.table`                                                                            | 143–143   | mapped                         |
| `section.settlements.fortune_teller.table`                                                                     | 145–145   | mapped                         |
| `section.settlements.gambling.table`                                                                           | 145–145   | mapped                         |
| `section.settlements.learn_a_spell_or_prayer.table`                                                            | 146–146   | mapped                         |
| `section.settlements.level_up.table`                                                                           | 146–146   | mapped                         |
| `section.the_dark_guild.buying_special_equipment.table`                                                        | 148–148   | mapped                         |
| `section.the_dark_guild.buying_special_equipment.table_2`                                                      | 148–148   | mapped                         |
| `section.the_dark_guild.table`                                                                                 | 149–149   | mapped                         |
| `section.fighters_guild.table`                                                                                 | 151–151   | mapped                         |
| `section.fighters_guild.buying_special_equipment.table`                                                        | 152–152   | mapped                         |
| `section.wizards_guild.table`                                                                                  | 153–153   | mapped                         |
| `section.alchemists_guild.table`                                                                               | 154–154   | mapped                         |
| `section.rangers_guild.table`                                                                                  | 156–156   | mapped                         |
| `section.the_inner_sanctum.buying_special_equipment.table`                                                     | 158–158   | mapped                         |
| `section.the_inner_sanctum.crusades.table`                                                                     | 159–159   | mapped                         |
| `section.appendix_i_perks.faith_perks.table`                                                                   | 168–168   | extracted                      |
| `section.appendix_i_perks.combat_perks.table`                                                                  | 169–169   | extracted                      |
| `section.appendix_i_perks.combat_perks.table_2`                                                                | 169–169   | compatibility redirect         |
| `section.appendix_i_perks.sneaky_perks.table`                                                                  | 170–170   | extracted                      |
| `section.appendix_i_perks.common_perks.table`                                                                  | 170–170   | extracted                      |
| `section.appendix_i_perks.common_perks.table_2`                                                                | 170–170   | compatibility redirect         |
| `section.appendix_ii_talents.physical_talents.table`                                                           | 172–172   | extracting                     |
| `section.appendix_ii_talents.combat_talents.table`                                                             | 173–173   | extracting                     |
| `section.appendix_ii_talents.faith_talents.table`                                                              | 174–174   | extracted                      |
| `section.appendix_ii_talents.alchemist_talents.table`                                                          | 174–174   | extracted                      |
| `section.appendix_ii_talents.common_talents.table`                                                             | 175–175   | extracted                      |
| `section.appendix_ii_talents.common_talents.table_2`                                                           | 175–175   | compatibility redirect         |
| `section.appendix_ii_talents.common_talents.table_3`                                                           | 175–175   | compatibility redirect         |
| `section.appendix_ii_talents.common_talents.table_4`                                                           | 175–175   | compatibility redirect         |
| `section.appendix_ii_talents.table`                                                                            | 176–176   | extracted                      |
| `section.appendix_ii_talents.table_2`                                                                          | 176–176   | compatibility redirect         |
| `section.appendix_ii_talents.table_3`                                                                          | 176–176   | compatibility redirect         |
| `section.appendix_ii_talents.sneaky_talents.table`                                                             | 177–177   | extracted                      |
| `section.appendix_ii_talents.sneaky_talents.table_2`                                                           | 177–177   | compatibility redirect         |
| `section.appendix_ii_talents.mental_talents.table`                                                             | 178–178   | extracted                      |
| `section.appendix_iii_equipment.weapons.table`                                                                 | 179–179   | extracted                      |
| `section.appendix_iii_equipment.armour_and_shields.table`                                                      | 180–180   | extracted                      |
| `section.appendix_iii_equipment.armour_and_shields.table_2`                                                    | 180–180   | extracted                      |
| `section.appendix_iii_equipment.armour_and_shields.table_3`                                                    | 180–180   | compatibility redirect         |
| `section.appendix_iii_equipment.general_equipment.alchemy.table`                                               | 181–181   | extracted                      |
| `section.appendix_iii_equipment.general_equipment.animals_and_transportation.table`                            | 181–181   | extracted                      |
| `section.appendix_iii_equipment.general_equipment.consumables.table`                                           | 182–182   | extracted                      |
| `section.appendix_iii_equipment.general_equipment.jewellery.table`                                             | 182–182   | extracted                      |
| `section.appendix_iii_equipment.general_equipment.tools.table`                                                 | 185–185   | extracted                      |
| `section.appendix_iii_equipment.general_equipment.table`                                                       | 186–186   | mapped                         |
| `section.appendix_iv_spells.table`                                                                             | 187–187   | compatibility redirect         |
| `section.appendix_iv_spells.table_2`                                                                           | 187–187   | compatibility redirect         |
| `section.appendix_iv_spells.table_3`                                                                           | 187–187   | compatibility redirect         |
| `section.appendix_iv_spells.table_4`                                                                           | 187–187   | compatibility redirect         |
| `section.appendix_iv_spells.table_5`                                                                           | 189–189   | compatibility redirect         |
| `section.appendix_iv_spells.table_6`                                                                           | 189–189   | compatibility redirect         |
| `section.appendix_iv_spells.table_7`                                                                           | 190–190   | compatibility redirect         |
| `section.appendix_iv_spells.table_8`                                                                           | 190–190   | compatibility redirect         |
| `section.appendix_iv_spells.table_9`                                                                           | 191–191   | compatibility redirect         |
| `section.appendix_iv_spells.table_10`                                                                          | 192–192   | compatibility redirect         |
| `section.appendix_v_treasures.treasure_found_in_rooms_and_corridors.table`                                     | 193–193   | extracted                      |
| `section.appendix_v_treasures.table`                                                                           | 194–195   | extracted                      |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table_t1`                                     | 196–196   | extracted                      |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table_t4`                                     | 196–196   | extracted                      |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table_t2`                                     | 196–196   | extracted                      |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table_t5`                                     | 196–196   | extracted                      |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table_t3`                                     | 196–196   | extracted                      |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table`                                        | 196–196   | extracted                      |
| `section.appendix_v_treasures.tables_of_potions.table_weak_or_supreme_potions`                                 | 197–197   | extracted                      |
| `section.appendix_v_treasures.ingredients_and_parts.table_of_ingredients`                                      | 198–198   | extracted                      |
| `section.appendix_v_treasures.ingredients_and_parts.table_of_parts`                                            | 198–198   | extracted                      |
| `section.appendix_v_treasures.table_7`                                                                         | 199–199   | extracted                      |
| `section.appendix_v_treasures.tables_of_magic_powers_for_items.table_magic_weapons`                            | 200–200   | extracted                      |
| `section.appendix_v_treasures.table_magic_armours_and_shields`                                                 | 201–201   | extracted                      |
| `section.appendix_v_treasures.table_magic_item`                                                                | 201–201   | extracted                      |
| `section.appendix_v_treasures.table_9`                                                                         | 202–202   | extracted                      |
| `section.appendix_v_treasures.table_10`                                                                        | 202–202   | extracted                      |
| `section.appendix_v_treasures.legendary_items.necklace_of_deflection.table`                                    | 213–213   | extracted                      |
| `section.quest_book_i.the_dead_rising.quest_1_spring_cleaning.table`                                           | 224–224   | mapped                         |
| `section.quest_book_i.the_dead_rising.table_quest_specific_encounter_table`                                    | 225–225   | mapped                         |
| `section.quest_book_i.the_dead_rising.table`                                                                   | 225–225   | mapped                         |
| `section.quest_book_i.the_dead_rising.quest_2_the_dead_rising.table`                                           | 227–227   | mapped                         |
| `section.quest_book_i.the_dead_rising.table_2`                                                                 | 228–228   | mapped                         |
| `section.quest_book_i.the_dead_rising.quest_3_highwaymen.table`                                                | 229–229   | mapped                         |
| `section.quest_book_i.the_dead_rising.quest_4_the_burning_village.table`                                       | 231–231   | mapped                         |
| `section.quest_book_i.the_dead_rising.quest_5_the_apprentice.table`                                            | 232–232   | mapped                         |
| `section.quest_book_i.the_dead_rising.quest_5_the_apprentice.table_emil_the_caretaker`                         | 232–232   | mapped                         |
| `section.quest_book_i.the_dead_rising.table_imgrahil_the_apprentice`                                           | 233–233   | mapped                         |
| `section.quest_book_i.the_dead_rising.quest_6a_sacrifice.table`                                                | 234–234   | mapped                         |
| `section.quest_book_i.the_dead_rising.quest_6b_the_master.table`                                               | 235–235   | mapped                         |
| `section.quest_book_i.the_dead_rising.table_the_master`                                                        | 236–236   | mapped                         |
| `section.quest_book_i.lair_of_the_spider_queen.level_1_the_entrance.table`                                     | 238–238   | mapped                         |
| `section.quest_book_i.lair_of_the_spider_queen.level_2_the_basement.table`                                     | 239–239   | mapped                         |
| `section.quest_book_i.lair_of_the_spider_queen.table`                                                          | 240–240   | mapped                         |
| `section.quest_book_i.lair_of_the_spider_queen.level_3_the_tomb_of_the_spider_queen.table`                     | 241–241   | mapped                         |
| `section.quest_book_i.lair_of_the_spider_queen.level_3_the_tomb_of_the_spider_queen.table_belua`               | 241–241   | mapped                         |
| `section.quest_book_i.random_quests.table`                                                                     | 243–243   | mapped                         |
| `section.quest_book_i.the_lava_river.quest_1_stop_the_heretics.table`                                          | 244–244   | mapped                         |
| `section.quest_book_i.the_lava_river.quest_1_stop_the_heretics.table_2`                                        | 244–244   | mapped                         |
| `section.quest_book_i.the_lava_river.quest_1_stop_the_heretics.table_3`                                        | 244–244   | mapped                         |
| `section.quest_book_i.the_lava_river.quest_2_the_master_alchemist.table`                                       | 246–246   | mapped                         |
| `section.quest_book_i.the_lava_river.quest_2_the_master_alchemist.table_2`                                     | 246–246   | mapped                         |
| `section.quest_book_i.the_lava_river.quest_2_the_master_alchemist.table_3`                                     | 246–246   | mapped                         |
| `section.quest_book_i.the_lava_river.quest_3_preventing_a_disaster.table`                                      | 247–247   | mapped                         |
| `section.quest_book_i.the_bandits_hideout.quest_1_rescuing_the_prisoners.table_briggo`                         | 249–249   | mapped                         |
| `section.quest_book_i.the_bandits_hideout.quest_1_rescuing_the_prisoners.table_gorm`                           | 249–249   | mapped                         |
| `section.quest_book_i.the_bandits_hideout.table`                                                               | 250–250   | mapped                         |
| `section.quest_book_i.the_bandits_hideout.quest_2_the_pleasure_house.table`                                    | 251–251   | mapped                         |
| `section.quest_book_i.the_bandits_hideout.quest_2_the_pleasure_house.table_madame_isabelle`                    | 251–251   | mapped                         |
| `section.quest_book_i.the_fountain_room.quest_1_cleansing_the_water.table`                                     | 253–253   | mapped                         |
| `section.quest_book_i.the_fountain_room.quest_2_baptising.table`                                               | 254–254   | mapped                         |
| `section.quest_book_i.the_fountain_room.quest_2_baptising.table_gaul_the_mauler`                               | 254–254   | mapped                         |
| `section.quest_book_i.the_chamber_of_reverence.quest_1_returning_the_relic.table`                              | 255–255   | mapped                         |
| `section.quest_book_i.the_chamber_of_reverence.quest_1_returning_the_relic.table_2`                            | 255–255   | mapped                         |
| `section.quest_book_i.the_chamber_of_reverence.quest_2_slaying_the_fiend.table`                                | 256–256   | mapped                         |
| `section.quest_book_i.the_chamber_of_reverence.quest_2_slaying_the_fiend.table_2`                              | 256–256   | mapped                         |
| `section.quest_book_i.the_chamber_of_reverence.quest_2_slaying_the_fiend.table_molgor_the_fiend_of_summerhall` | 256–256   | mapped                         |
| `section.quest_book_i.the_chamber_of_reverence.quest_3_closing_the_portal.table`                               | 257–257   | mapped                         |
| `section.quest_book_i.the_chamber_of_reverence.quest_3_closing_the_portal.table_2`                             | 257–257   | mapped                         |
| `section.quest_book_i.the_chamber_of_reverence.quest_3_closing_the_portal.table_3`                             | 257–257   | mapped                         |
| `section.quest_book_i.the_great_crypt.table`                                                                   | 259–259   | mapped                         |
| `section.quest_book_i.the_great_crypt.quest_2_stopping_the_necromancer.table`                                  | 261–261   | mapped                         |
| `section.quest_book_i.the_great_crypt.quest_2_stopping_the_necromancer.table_ragnalf_the_mad`                  | 261–261   | mapped                         |
| `section.quest_book_i.the_great_crypt.quest_3_tomb_raiders.table`                                              | 262–262   | mapped                         |
| `section.quest_book_i.quests_into_the_ancient_lands.table`                                                     | 264–264   | mapped                         |
| `section.quest_book_i.quests_into_the_ancient_lands.tomb_of_the_hierophant.table`                              | 266–266   | mapped                         |
| `section.quest_book_i.quests_into_the_ancient_lands.temple_of_despair.table`                                   | 268–268   | mapped                         |
| `section.quest_book_i.quests_into_the_ancient_lands.halls_of_amenhotep.table`                                  | 270–270   | mapped                         |
| `section.quest_book_i.quests_into_the_ancient_lands.crypt_of_khaba.table`                                      | 271–271   | mapped                         |
| `section.quest_book_i.side_quests.table`                                                                       | 273–273   | mapped                         |
| `section.quest_book_i.side_quests.side_quest_2_slay_the_beast.table`                                           | 275–275   | mapped                         |
| `section.quest_book_i.side_quests.side_quest_3_the_mapmaker.table_the_mapmaker`                                | 276–276   | mapped                         |
| `section.quest_book_i.side_quests.side_quest_5_manhunt.table`                                                  | 278–278   | mapped                         |
| `section.creating_your_character.damage_bonus_and_natural_armour.natural_armour_table`                         | 29–29     | extracted                      |
| `section.appendix_iv_spells.level_1`                                                                           | 187–187   | extracted                      |
| `section.appendix_iv_spells.level_2`                                                                           | 188–188   | extracted                      |
| `section.appendix_iv_spells.level_3`                                                                           | 189–189   | extracted                      |
| `section.appendix_iv_spells.level_4`                                                                           | 190–190   | extracted                      |
| `section.appendix_iv_spells.level_5`                                                                           | 191–191   | extracted                      |
| `section.appendix_iv_spells.level_6`                                                                           | 192–192   | extracted                      |

## Verification

Batch 4 completion gate: 209 canonical files validate; 1,107 tests pass with two optional
provider integration tests skipped; lint passes. Coverage was regenerated from YAML. No
independent review or commit is claimed.

Historical Batch 3 completion gate: 196 canonical files validate; 980 tests pass with two optional provider
integration tests skipped; lint passes. Equipment outcomes include 94 sourced YAML fixtures;
complete cell matrices and negative integrity tests are additional checks. The generated coverage
report is rebuilt from YAML. No commit was made. Historical Batch 1 counts above remain historical.

## Source-audit checkpoint — 28 September 2026

This is a source audit of Batch 4, not independent review. Records remain `extracted`.

| Unit                             | Disposition                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Magic foundations, PDF 64–67     | Checked casting costs, upkeep, miscast table, perfect casts, focus, dispelling and scroll exceptions against the PDF and typed effects. Existing focus-example and wounded-scroll issues remain unresolved.                                                                                       |
| Spell catalogue, PDF 187–192     | Checked all six rendered tables against the full-cell matrices and spell effects: costs, upkeep, blank Specials, durations, targeting and summon/activation exceptions. Retain Healing's printed `1d/+2`, Earth Elemental's `ML`, and recorded summon/control timing uncertainties.               |
| Components and mixing, PDF 72–76 | Checked habitat and harvest matrices, quantities, exquisite modifiers, ordinary and optional recipes. Added missing PDF 197 provenance to both successful-mixing rules: the identification exemption is stated there, not on PDF 76. Regression cases check both successful branches and failure. |
| Preparations, PDF 77–81          | PDF 77 has no mechanical extraction. Checked recipes, all preparation descriptions, potency, durations, poison projectiles and non-stacking. Fire Protection wording and preparation/recipe naming differences remain recorded issues.                                                            |
| Prayers, PDF 82–83               | Checked all 18 entries, level boundary across pages, interruption, impeccable-roll Energy exception, durations, targeting and relic restrictions. No new interpretation chosen.                                                                                                                   |
| Treasure alchemy, PDF 197–198    | Checked rendered selectors, costs, merged blanks, ingredient/part names and unexplained superscripts. Standard Potions prose/column mismatch remains open; these tables are reused by Batch 5.                                                                                                    |

Rendered tables inspected in this checkpoint: PDF 65, 73–76, 187–192 and 197–198.
Existing source text and test matrices retain printed distinctions. The provenance correction
changes no mechanic or interpreter behavior. Gate results are recorded with the final verification below.

## Batch 5 — treasures (complete within scope)

| Unit                                 | Source and evidence                                                                                                                 | Boundaries and findings                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Treasure chapter                     | PDF 108; T1–T5, Part and dash indicators; searchable adjacent furniture costs 1 AP; visible example-card cells                      | The erroneous Appendix III citation is retained with an actual Appendix V binding. Unseen cards remain supplied.                                                                                                                                                                                            |
| Room/corridor and furniture findings | PDF 193–195; `table.treasure.rooms_corridors`, `.furniture`, all 35 named furniture entries, drinking and Statue subrolls           | Complete original cells plus structured roll ranges. R10 rerolls, tile removal, monster placements, random quantities, Well-to-Chest, and party Alchemical checks preserved. Corridor totals above 100 are unresolved.                                                                                      |
| Enemy loot and relics                | PDF 196; five T tables, six relic entities and rules                                                                                | Relics require Warrior Priest/valid supplied slot; existing ring/necklace and Reliquary restrictions reused. Spell/potion results bind existing catalogues where specified.                                                                                                                                 |
| Alchemy appendix reuse               | PDF 197–198; existing Batch 4 tables                                                                                                | Rechecked in the source audit; no duplicate potion, ingredient or part tables. Existing selector/naming/superscript issues remain.                                                                                                                                                                          |
| Powerstones and magic powers         | PDF 199–202; 20 Powerstone identities, three 10-row power matrices and 10 curses                                                    | Description/effect columns, permitted objects, first-turn versus unqualified Initiative, Fast Reload exception, rounding and curse rerolls stay distinct. Powers expose typed parameters; applying them to a live inventory is outside this catalogue.                                                      |
| Legendary selector and descriptions  | PDF 202–213; 30 selector rows with 60 blank cells, 31 described objects, two separate selector-only identities; projectile subtable | Belt and Kopesh/Khopesh names are not silently equated. Armour of the Father has no invented selector probability. Uniqueness exceptions, identification, sale restriction, slots, quantities, damage and conditional effects are recorded. Vial destruction conflicts with the general damage prohibition. |
| Artwork                              | Rendered PDF 214–215                                                                                                                | Artwork only; no mechanical extraction or reviewed-section claim.                                                                                                                                                                                                                                           |

Tests in `tests/tables/treasures.test.ts` reconstruct every printed cell from source matrices,
check all random outcomes and endpoints, all selector blanks, naming gaps, and invalid/nonreciprocal
links. `tests/rules/treasures.test.ts` checks typed effect parameters, limits, nested dependencies,
rerolls, missing inputs and composed search handoffs. These fixtures are source-audit regressions,
not independent review. `tests/fixtures/treasures/README.md` records their provenance.

Search, opening, Thief, enchantment, prayers and existing equipment/parts now reference actual
catalogue targets. The pre-existing furniture search trace used to invoke a findings dependency
after a failed requirement; its consequential handoff is now guarded and its fixture corrected.
This does not alter interpreter semantics. General loot execution, random card contents, geometry,
full special-rule execution and unspecified random-choice distributions remain supplied or deferred.

Six false table splits retain their IDs as compatibility redirects. The embedded projectile table
adds one mapped node; section/coverage rows remain a bijection. Source-audit checkpoint gate:
209 canonical files, 1,109 passing tests, two optional provider tests skipped, coverage regenerated,
lint and diff checks passed. Final Batch 5 gate is recorded below.

Final Batch 5 gate: 223 canonical files validate; 1,366 tests pass with two optional provider
integrations skipped; coverage regenerated with 695 rows for 695 section IDs (666 canonical
sections and 29 compatibility redirects); lint and `git diff --check` pass. No commit or
independent review is claimed.

## Batch 6 — settlement, guild and estate catalogues

PDF 132–163 adds 11 settlement profile entities, six guild/Inner Sanctum records, and one Bergmeister
estate record, with structured tables for quest selectors and availability, settlement events, Activity
Points, services, arena awards, bank returns, fortune telling, gambling, horse racing, guild equipment,
bounties, crusades, ingredient/part availability, wizard staves, estate furnishings and all ten ghost
events. The trinket event's 1–5 / 5–11 overlap and the separate event result 5 are preserved.

Six catalogue regression tests cover selector endpoints, profile/entity links, event overlap and estate
ghost-event boundaries. External Companions’ Compendium contents and the estate side quest are not
invented. Table cells were transcribed from extracted PDF text and have not been visually verified
against rendered pages; entity source summaries do not claim full prose-rule extraction. Guild activity
execution and estate lifecycle mechanics remain subsequent procedure scope.

Historical Batch 6 integration gate: 231 canonical files validate; 1,412 tests pass with two optional provider
integrations skipped; coverage regenerated for 695 rows/sections; lint and `git diff --check` pass.
Batch 6 is extracted within these limits, not independently reviewed.

### Batch 6 reconciliation — Package A

The earlier Batch 6 integration counts are historical. Package A adds the associated
service, guild, equipment, furnishing and event rules and reciprocal entity/table links. See
[settlement-source-reconciliation.md](settlement-source-reconciliation.md) for
page-level evidence. PDF 132–147 tables and profiles have now been visually checked;
the missing schedule, separate event thresholds and nested trinket selector are
represented. The outer trinket event is 4, with overlap only in its nested 1–5 / 5–11
selector. PDF 148–151 exposed incorrect Nightstalker cap/bracer specials and an
omitted Dark Guild tools table; both are corrected. All requested PDF 132–163 pages have now been visually inspected. Later units restored
missing trophy/tool tables, footnotes, blank cells and service restrictions. Associated rules and entity links are now present. Complete staff, fortune, furnishing
and profile regressions are in `tests/fixtures/settlements/catalogue-cells.yaml`.
See the heading-by-heading [completion inventory](package-a-completion-inventory.md).

The combat/treasure prerequisite checkpoint is recorded in
[combat-treasure-source-audit.md](combat-treasure-source-audit.md). This does not
constitute independent review.

Package B also extracts the 22-row outdoor obstacle matrix on PDF 128–130, with all
110 textual cells checked and Example artwork retained as supplied geometry. Its source
map continuation includes PDF 129. See the travel accounting ledger for the executable scope.

Packages B/C now consume the catalogue through guarded travel and settlement accounting.
Their completion does not execute guild training or estate lifecycle ahead of the planned
batches, and does not mark any material independently reviewed.

## Batch 7 — Quest and scenario catalogues (accepted within scope)

The [heading-level inventory](quest-scenario-inventory.md) lists every mapped Quest
Book I heading and existing personal quest IDs. The introduction and First Blood,
the full Dead Rising and Spider Queen campaigns, the Random Quest selector, all three
Lava River quests, both Bandits’ Hideout and Fountain Room quests, Returning the Relic, Slaying the Fiend, Closing the Portal, all three Great Crypt quests, the Ancient Lands opening and all five quests, the Side Quests opening and selector, The Missing Brother, Slay the Beast, The Mapmaker, Go Fetch, Manhunt, Mushrooms, and The Grieving Mother estate
side quest are extracted within their bounded units. Printed enemy statistics stay
structured, local rules stay scenario-scoped, and unresolved source classification
and timing remain in review. Batch 7 is accepted within catalogue scope by the final
acceptance below; independent review remains unfinished.

The historical Relic unit gate validated 333 canonical files and passed 2,116 tests
with two optional provider tests skipped. Fresh subsequent unit gates are recorded
in the quest inventory. Those catalogue reconciliations are now complete; next is Package F.
Package F and comprehensive Phases 7–12 remain required.

30 September quest checkpoint: 341 canonical files validate; 2,178 tests pass
(two optional provider tests skipped). Coverage regeneration, lint and diff
checks pass. Coverage is325/665 extracted and0 independently reviewed.

Great Crypt checkpoint: 352 canonical files validate; 2,233 tests pass (two optional
provider tests skipped). All three bounded quest units separately pass validation,
coverage regeneration, full tests, lint and diff checks. Coverage is329/665
extracted and0 independently reviewed. The quest inventory records all four tables,
the Family Heirloom continuation, source exceptions and unresolved boundaries.

Ancient Lands checkpoint through Temple of Despair: 367 canonical files validate;
2,310 tests pass (two optional provider tests skipped). Opening/Pyramid, Hierophant
and Temple units separately passed validation, coverage regeneration, full tests,
lint and diff checks. Coverage is 332/665 extracted and zero independently reviewed.
Halls of Amenhotep and Crypt of Khaba remain next, followed by Side Quests and
remaining introduction/parent/personal-quest reconciliation.

1 October Amenhotep checkpoint: 371 canonical files validate; 2,326 tests pass
(two optional provider tests skipped), with coverage regeneration, lint and diff
checks passing. Coverage is 333/665 extracted and zero independently reviewed.
Next catalogue unit: Crypt of Khaba, PDF 271–272.

1 October Khaba checkpoint: 376 canonical files validate; 2,348 tests pass
(two optional provider tests skipped), with coverage regeneration, lint and diff
checks passing. Coverage is 334/665 extracted and zero independently reviewed.
Next: Side Quests introduction and selector, PDF 273, then its six catalogue units.

1 October Side Quests checkpoint: introduction/selector and The Missing Brother
are catalogue-extracted within separate source units. The latest gate validates
381 canonical files and passes 2,377 tests (two optional provider tests skipped),
with coverage regeneration, lint and diff checks passing. Coverage is 335/665
extracted and zero independently reviewed. Next: Slay the Beast, PDF 275.

1 October Slay the Beast checkpoint: 384 canonical files validate; 2,404 tests pass
(two optional provider tests skipped), with coverage regeneration, lint and diff
checks passing. Coverage is 336/665 extracted and zero independently reviewed.
The bounded unit includes PDF275–276, all Monster/Bet cells and the failure
continuation. Next: The Mapmaker, PDF276.

1 October Mapmaker checkpoint: 388 canonical files validate; 2,410 tests pass
(two optional provider tests skipped), with coverage regeneration, lint and diff
checks passing. Coverage is 337/665 extracted and zero independently reviewed.
Next: Go Fetch, PDF277, including its currently unmapped shield-condition table.

1 October Go Fetch checkpoint: 392 canonical files validate; 2,434 tests pass
(two optional provider tests skipped), with coverage regeneration, lint and diff
checks passing. Coverage is 338/666 extracted and zero independently reviewed.
The newly discovered shield-condition table adds one canonical section; historical
checkpoint denominators remain unchanged. Next: Manhunt, PDF278.

1 October final Side Quest checkpoint: Manhunt and Mushrooms individually passed
bounded extraction gates. The latest gate validates399canonical files and
passes2,465tests (two optional provider tests skipped), with coverage regeneration,
lint and diff checks passing. Coverage is339/666extracted and zero independently
reviewed. All six Side Quest units are catalogue-extracted. Package E remains open
for introduction/parent/personal-quest reconciliation; Package F follows that gate.

1 October introduction/parent checkpoint: PDF221–223opening reconciliation and
the Chamber of Reverence grouping heading onPDF255passed separate bounded gates.
Latest:399canonical files validate;2,466tests pass (two optional provider tests
skipped); coverage regeneration, lint and diff checks pass. Coverage is340/666
extracted and zero independently reviewed. Other parent component applicability
and fifteen existing background personal quest IDs still require reconciliation.

1 October additional parent checkpoint: the Great Crypt grouping heading on PDF259
and the Fountain Room grouping heading on PDF253 passed separate bounded gates.
Each validates 399 canonical files and passes 2,466 tests (two optional provider
tests skipped), with coverage regeneration, lint and diff checks passing. Latest
coverage is 342/666 extracted and zero independently reviewed. These dispositions
cover only the own heading; child lifecycle and review remain separate.

1 October Lava River parent checkpoint: rendered PDF244 identifies a grouping
heading immediately followed by Stop the Heretics. Its own components are
inapplicable; all three child quest units keep their records. The bounded gate
validates 399 canonical files and passes 2,466 tests (two optional provider tests
skipped); coverage regeneration, lint and diff checks pass. Coverage is 343/666
extracted and zero independently reviewed. Other parent components and personal
quests still require reconciliation before Package E closes.

1 October Bandits’ Hideout parent checkpoint: rendered PDF249 confirms an own
grouping heading with no separate mechanics. Its two child quests retain their
records. The bounded gate validates 399 canonical files and passes 2,466 tests
(two optional provider tests skipped), with coverage regeneration, lint and diff
checks passing. Coverage is 344/666 extracted and zero independently reviewed.

1 October personal-quest checkpoint: rendered PDF42 (printed40) reconciles
Wanderlust, The Well and Fables with their existing entities and local rules.
No duplicate records or mechanics were added. The bounded gate validates 399
canonical files and passes 2,466 tests (two optional provider tests skipped),
with coverage regeneration, lint and diff checks passing. Coverage remains
344/666 extracted and zero independently reviewed. Twelve personal quest records
still require catalogue reconciliation; all personal lifecycle accounting remains
Package F. Next personal source unit: The Heirloom and Arachnophobia, PDF43.

1 October PDF43 personal-quest checkpoint: The Heirloom and Arachnophobia
are catalogue-reconciled against the rendered page. A missing quest-bound Great
Aunt’s sword equipment record now links the existing setup/property rules and
existing longsword/shortsword conflict; no statistics or unavailable material
were invented. The gate validates 400 canonical files and passes 2,466 tests
(two optional provider tests skipped), with coverage regeneration, lint and diff
checks passing. Coverage remains 344/666 extracted and zero independently
reviewed. Ten personal quest records remain to reconcile. Next: The Lost Brother,
PDF43–44, preserving the existing skirmish/burial ambiguity. Package F follows
a complete Package E inventory.

1 October Lost Brother checkpoint: rendered PDF43–44 reconciles the personal
quest, preserving all branches and the existing skirmish/burial ambiguity. A
quest actor and explicit body-release-at-danger rule fill catalogue gaps. The
gate validates 401 canonical files and passes 2,467 tests (two optional provider
tests skipped), with coverage regeneration, lint and diff checks passing.
Coverage remains 344/666 extracted and zero independently reviewed. Nine personal
quest records remain. Next: Bandit Revenge and Poverty, PDF44–45. Ordered
lifecycle and exact reward consumption remain Package F.

1 October PDF44–46 personal catalogue checkpoints: Bandit Revenge/Poverty
passed a bounded gate with 401 validated files and 2,472 passing tests; Proving
Your Worth/The Fraud passed a separate gate with 401 validated files and 2,476
passing tests. Two optional provider tests are skipped. Coverage regeneration,
lint and diff checks pass. The Proving Your Worth section now correctly ends on
PDF45, where its armour sentence continues in the right column; erroneous PDF46
references were removed. Coverage remains 344/666 extracted and zero independently
reviewed. Five personal quest records remain: Sworn Enemy, The Family Keep,
Troll Slayer, Minotaur Revenge and A New Home, PDF47–48. Package F remains next
after all Package E parent/catalogue dispositions are complete.

1 October final personal catalogue checkpoint: Sworn Enemy, The Family Keep,
Troll Slayer, Minotaur Revenge and A New Home were reconciled against rendered
PDF47–48. Two quest enemies now have source-bound actor records and A New Home
links the existing Bergmeister Estate catalogue. Minotaur reward amount/resource
remain absent and unresolved. The gate validates 402 canonical files and passes
2,480 tests (two optional provider tests skipped); coverage regeneration, lint
and diff checks pass. Fresh inventory has 1,530 rules and 668 entities. All fifteen
personal catalogue records are reconciled. Coverage remains 344/666 extracted
and zero independently reviewed. Package E still needs remaining parent component
applicability dispositions; Package F lifecycle and Phases7–12 follow.

1 October campaign parent component checkpoints: The Dead Rising’s PDF224
opening reuses the linked campaign entity/setup rule and explicitly dispositions
its own table/glossary/example components. Its gate validates 402 files and
passes 2,480 tests. The Spider Queen’s PDF237 opening reuses its opening rule
and campaign entity and adds the missing elderly-wizard actor; its gate validates
403 files and passes 2,480 tests. Two optional provider tests are skipped. Coverage
regeneration, lint and diff checks pass. Both parents remain extracting because
ordered lifecycle is pending; no child mechanics were duplicated. Coverage remains
344/666 extracted and zero independently reviewed. Remaining parent dispositions
include the divider/introduction, Random Quests, Ancient Lands and Side Quests.

1 October divider/introduction and Random Quests component checkpoints: two
bounded gates each validate 403 canonical files and pass 2,481 tests (two optional
provider tests skipped), with coverage regeneration, lint and diff checks passing.
Rendered PDF221 has no printed folio; its page label and part printed start are
now null, with a regression check. Its own title/artwork heading is extracted,
while child scope remains separate. The introduction’s remaining catalogue
components are explicitly inapplicable. Random Quests retains the separately
structured child selector and logs its unspecified second-stage die/mapping.
Coverage is 345/666 extracted (52%) and zero independently reviewed. Review has
107 records:99unresolved and8resolved. Remaining Package E parent units: Ancient
Lands PDF263 and Side Quests PDF273, followed by catalogue acceptance.

1 October Ancient Lands/Side Quests parent component checkpoints: separate
bounded gates each validate 403 canonical files and pass 2,481 tests (two optional
provider tests skipped), with coverage regeneration, lint and diff checks passing.
All remaining chapter parent dispositions are reconciled. Coverage remains
345/666 extracted (52%) and zero independently reviewed. The Package E acceptance
audit confirms108canonical Quest Book I sections in124inventory rows including
the fifteen personal quests and estate quest, but identifies stale component
flags on existing quest/table rows. Next: reconcile that coverage bookkeeping
against canonical ownership and bounded source evidence, then close Package E
only after its acceptance gate. Package F remains required.

Package E acceptance (1 October): all 124 inventory entries have bounded catalogue
dispositions, including 108 canonical Quest Book I sections, fifteen personal quests
and the estate side quest. Coverage bookkeeping now matches own-heading rule/table/entity
ownership. The Random Quests selector scope defect is corrected and regression-tested.
Scoped catalogue records: 437 rules, 59 complete rendered-source tables, 129 entities.
The final gate validates 403 canonical files and passes 2482 tests (two optional provider
skips), coverage regeneration, lint and diff checks. Coverage remains 345/666 extracted
and zero independently reviewed. Batch 7 is accepted within catalogue scope; Package F
and comprehensive Phases 7–12 remain required.

Package F follow-up (3 October): Package E's124 catalogue dispositions remain
accepted within scope. The new test-owned Package F87-heading manifest and
Necromancer/Tomb Raiders/shared dungeon/First Blood procedure units do not imply
Phase5 exit acceptance or independent review. Phase5's seven-batch exit audit remains
required before its live status can become complete. See [lifecycle evidence](lifecycle-procedures.md).
