# Phase 5 — Entities and tables

## Status and boundaries

Phase 5 is in progress, not complete. Records remain extracted, not independently reviewed.
Full procedures, state machines, map geometry, dependency-graph generation and corpus builds
remain deferred. External books are unavailable; their contents are not invented.

Work proceeds in the seven approved batches: character catalogues; talents/perks; equipment
and magic items; spells/prayers/alchemy; treasures; settlements/guilds; quests and remaining
tables. Each extraction unit is one heading, one table, or a related 1–4-page range.

## Evidence ledger

- PDF 30–31: all four species profiles and four initial-stat tables; species restrictions and Halfling benefits. IDs: `species.*`, `table.character.{dwarf,elf,halfling,human}_stats`, `character.species.*`.
- PDF 34–41: all eight professions and skill tables, retaining the pilot Alchemist/Thief records. Alternative talent choices, starting equipment and spell/prayer/perk choices remain distinct; Warrior Priest Energy explicitly overrides the default.
- PDF 42–48: all 20 backgrounds, 15 personal quest records, and their local rules. IDs: `background.*`, `quest.background.*`, `character.background.*`. Full personal-quest procedures remain deferred.
- Independent table matrices, catalogue schema/reference tests, and 51 background boundary scenarios are in the Phase 5 test files. Current gate: 130 canonical files validate; 652 tests pass; lint passes.
- Open issues: Ranger starting Longbow versus species restrictions; Rogue backpacks; heirloom longsword/shortsword wording; Lost Brother skirmish burial reward; missing Minotaur reward.

Batch 1 catalogue extraction and Batch 2 catalogue content are present. Equipment/spell/potion reference binding and exhaustive independently transcribed table matrices remain outstanding. Batches 3–7 remain pending. No Phase 5 completion claim is made.

- PDF 172–178: 88 talents across all eight categories, preserving the original pilot IDs and expanding their tables in place. Rendered pages exposed merged text rows and stray page-number text; canonical cells were checked against the render.
- PDF 168–171: 41 perks across seven categories, with all three printed columns and explicit blank cells. Rules preserve activation costs, variable Energy spending, timing, limits and exceptions. Missing Leader/Arcane/Alchemist table nodes were added; false table splits retain compatibility redirects.
- Thirty derived ability fixtures cover usage, costs, prerequisites, threshold boundaries, duration outputs and exceptions. Five added negative schema/integrity tests cover perk costs, blank cells and quest scope.
- Additional open issues: Sense for Gold’s “subtract -1” sign; Hunter’s Eye bow effect versus sling eligibility. Independent review remains pending.

## Catalogue inventory

The headings below are the catalogue-bearing source areas. Their child entities and embedded
rules must be audited against the PDF; a mapped heading is not extracted catalogue content.

| Section                           | PDF pages | Disposition                                      |
| --------------------------------- | --------- | ------------------------------------------------ |
| `section.quest_book_i`            | 221–279   | Pending; retain existing pilot/core records      |
| `section.creating_your_character` | 29–41     | Catalogue content extracted; final audit pending |
| `section.backgrounds`             | 42–50     | Catalogue content extracted; final audit pending |
| `section.equipment`               | 51–54     | Pending; retain existing pilot/core records      |
| `section.magic`                   | 64–69     | Pending; retain existing pilot/core records      |
| `section.magic_items`             | 70–70     | Pending; retain existing pilot/core records      |
| `section.enchantments`            | 71–71     | Pending; retain existing pilot/core records      |
| `section.alchemy`                 | 72–81     | Pending; retain existing pilot/core records      |
| `section.prayers`                 | 82–84     | Pending; retain existing pilot/core records      |
| `section.settlements`             | 132–147   | Pending; retain existing pilot/core records      |
| `section.the_dark_guild`          | 148–150   | Pending; retain existing pilot/core records      |
| `section.fighters_guild`          | 151–152   | Pending; retain existing pilot/core records      |
| `section.wizards_guild`           | 153–153   | Pending; retain existing pilot/core records      |
| `section.alchemists_guild`        | 154–155   | Pending; retain existing pilot/core records      |
| `section.rangers_guild`           | 156–157   | Pending; retain existing pilot/core records      |
| `section.the_inner_sanctum`       | 158–159   | Pending; retain existing pilot/core records      |
| `section.buying_an_estate`        | 160–166   | Pending; retain existing pilot/core records      |
| `section.appendix_i_perks`        | 168–171   | Catalogue content extracted; final audit pending |
| `section.appendix_ii_talents`     | 172–178   | Catalogue content extracted; final audit pending |
| `section.appendix_iii_equipment`  | 179–186   | Pending; retain existing pilot/core records      |
| `section.appendix_iv_spells`      | 187–192   | Pending; retain existing pilot/core records      |
| `section.appendix_v_treasures`    | 193–215   | Pending; retain existing pilot/core records      |

## Table inventory

All canonical mapped table nodes are listed; compatibility redirects remain in the source map
and are excluded here. Completion means all printed cells and footnotes have been checked,
not merely that a table object exists. Pending nodes require PDF classification before exclusion.

| Section                                                                                                        | PDF pages | Table component at phase entry |
| -------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------ |
| `section.front_matter.index_of_art.table`                                                                      | 11–11     | mapped                         |
| `section.buying_an_estate.ghostly_events_table`                                                                | 162–162   | mapped                         |
| `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`                                       | 186–186   | extracted                      |
| `section.appendix_v_treasures.table_of_relics`                                                                 | 196–196   | mapped                         |
| `section.appendix_v_treasures.table_of_powerstones`                                                            | 199–199   | mapped                         |
| `section.creating_your_character.choosing_your_species.table`                                                  | 29–29     | mapped                         |
| `section.creating_your_character.choosing_your_species.table_2`                                                | 29–29     | extracted                      |
| `section.creating_your_character.table`                                                                        | 30–30     | mapped                         |
| `section.creating_your_character.table_2`                                                                      | 30–30     | mapped                         |
| `section.creating_your_character.table_3`                                                                      | 31–31     | mapped                         |
| `section.creating_your_character.table_4`                                                                      | 31–31     | mapped                         |
| `section.creating_your_character.alchemist.table_skills`                                                       | 34–34     | extracted                      |
| `section.creating_your_character.barbarian.table_skills`                                                       | 35–35     | mapped                         |
| `section.creating_your_character.ranger.table_skills`                                                          | 36–36     | mapped                         |
| `section.creating_your_character.rogue.table_skills`                                                           | 37–37     | mapped                         |
| `section.creating_your_character.thief.table_skills`                                                           | 38–38     | extracted                      |
| `section.creating_your_character.warrior.table_skills`                                                         | 39–39     | mapped                         |
| `section.creating_your_character.warrior_priest.table_skills`                                                  | 40–40     | mapped                         |
| `section.creating_your_character.wizard.table_skills`                                                          | 41–41     | mapped                         |
| `section.equipment.coins.table`                                                                                | 51–51     | mapped                         |
| `section.psychology.sanity.table`                                                                              | 55–55     | extracted                      |
| `section.psychology.table`                                                                                     | 57–57     | extracted                      |
| `section.psychology.table_lingering_trauma_table`                                                              | 57–57     | extracted                      |
| `section.psychology.party_morale.table`                                                                        | 58–58     | extracted                      |
| `section.levelling_up.table`                                                                                   | 60–60     | extracted                      |
| `section.levelling_up.stats_and_skills_maximum.table`                                                          | 60–60     | extracted                      |
| `section.levelling_up.increasing_your_skills_and_basic_stats.table`                                            | 61–61     | mapped                         |
| `section.levelling_up.talents_and_perks.table_talents`                                                         | 62–62     | mapped                         |
| `section.levelling_up.talents_and_perks.table_perks`                                                           | 62–62     | mapped                         |
| `section.magic.casting_spells.table`                                                                           | 65–65     | mapped                         |
| `section.magic.casting_spells.table_2`                                                                         | 65–65     | mapped                         |
| `section.magic.casting_spells.table_3`                                                                         | 65–65     | mapped                         |
| `section.alchemy.table`                                                                                        | 73–73     | mapped                         |
| `section.alchemy.table_2`                                                                                      | 75–75     | mapped                         |
| `section.into_the_dungeons.table`                                                                              | 91–91     | mapped                         |
| `section.into_the_dungeons.table_2`                                                                            | 91–91     | mapped                         |
| `section.into_the_dungeons.table_3`                                                                            | 91–91     | mapped                         |
| `section.into_the_dungeons.table_4`                                                                            | 94–98     | mapped                         |
| `section.into_the_dungeons.opening_a_door_or_chest.table`                                                      | 101–101   | mapped                         |
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
| `section.appendix_i_perks.faith_perks.table`                                                                   | 168–168   | mapped                         |
| `section.appendix_i_perks.combat_perks.table`                                                                  | 169–169   | mapped                         |
| `section.appendix_i_perks.combat_perks.table_2`                                                                | 169–169   | mapped                         |
| `section.appendix_i_perks.sneaky_perks.table`                                                                  | 170–170   | mapped                         |
| `section.appendix_i_perks.common_perks.table`                                                                  | 170–170   | mapped                         |
| `section.appendix_i_perks.common_perks.table_2`                                                                | 170–170   | mapped                         |
| `section.appendix_ii_talents.physical_talents.table`                                                           | 172–172   | extracting                     |
| `section.appendix_ii_talents.combat_talents.table`                                                             | 173–173   | extracting                     |
| `section.appendix_ii_talents.faith_talents.table`                                                              | 174–174   | mapped                         |
| `section.appendix_ii_talents.alchemist_talents.table`                                                          | 174–174   | mapped                         |
| `section.appendix_ii_talents.common_talents.table`                                                             | 175–175   | mapped                         |
| `section.appendix_ii_talents.common_talents.table_2`                                                           | 175–175   | mapped                         |
| `section.appendix_ii_talents.common_talents.table_3`                                                           | 175–175   | mapped                         |
| `section.appendix_ii_talents.common_talents.table_4`                                                           | 175–175   | mapped                         |
| `section.appendix_ii_talents.table`                                                                            | 176–176   | mapped                         |
| `section.appendix_ii_talents.table_2`                                                                          | 176–176   | mapped                         |
| `section.appendix_ii_talents.table_3`                                                                          | 176–176   | mapped                         |
| `section.appendix_ii_talents.sneaky_talents.table`                                                             | 177–177   | mapped                         |
| `section.appendix_ii_talents.sneaky_talents.table_2`                                                           | 177–177   | mapped                         |
| `section.appendix_ii_talents.mental_talents.table`                                                             | 178–178   | mapped                         |
| `section.appendix_iii_equipment.weapons.table`                                                                 | 179–179   | mapped                         |
| `section.appendix_iii_equipment.armour_and_shields.table`                                                      | 180–180   | mapped                         |
| `section.appendix_iii_equipment.armour_and_shields.table_2`                                                    | 180–180   | mapped                         |
| `section.appendix_iii_equipment.armour_and_shields.table_3`                                                    | 180–180   | mapped                         |
| `section.appendix_iii_equipment.general_equipment.alchemy.table`                                               | 181–181   | mapped                         |
| `section.appendix_iii_equipment.general_equipment.animals_and_transportation.table`                            | 181–181   | mapped                         |
| `section.appendix_iii_equipment.general_equipment.consumables.table`                                           | 182–182   | mapped                         |
| `section.appendix_iii_equipment.general_equipment.jewellery.table`                                             | 182–182   | mapped                         |
| `section.appendix_iii_equipment.general_equipment.tools.table`                                                 | 185–185   | mapped                         |
| `section.appendix_iii_equipment.general_equipment.table`                                                       | 186–186   | mapped                         |
| `section.appendix_iv_spells.table`                                                                             | 187–187   | mapped                         |
| `section.appendix_iv_spells.table_2`                                                                           | 187–187   | mapped                         |
| `section.appendix_iv_spells.table_3`                                                                           | 187–187   | mapped                         |
| `section.appendix_iv_spells.table_4`                                                                           | 187–187   | mapped                         |
| `section.appendix_iv_spells.table_5`                                                                           | 189–189   | mapped                         |
| `section.appendix_iv_spells.table_6`                                                                           | 189–189   | mapped                         |
| `section.appendix_iv_spells.table_7`                                                                           | 190–190   | mapped                         |
| `section.appendix_iv_spells.table_8`                                                                           | 190–190   | mapped                         |
| `section.appendix_iv_spells.table_9`                                                                           | 191–191   | mapped                         |
| `section.appendix_iv_spells.table_10`                                                                          | 192–192   | mapped                         |
| `section.appendix_v_treasures.treasure_found_in_rooms_and_corridors.table`                                     | 193–193   | mapped                         |
| `section.appendix_v_treasures.table`                                                                           | 194–194   | mapped                         |
| `section.appendix_v_treasures.table_2`                                                                         | 194–194   | mapped                         |
| `section.appendix_v_treasures.table_3`                                                                         | 194–194   | mapped                         |
| `section.appendix_v_treasures.table_4`                                                                         | 195–195   | mapped                         |
| `section.appendix_v_treasures.table_5`                                                                         | 195–195   | mapped                         |
| `section.appendix_v_treasures.table_6`                                                                         | 195–195   | mapped                         |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table_t1`                                     | 196–196   | mapped                         |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table_t4`                                     | 196–196   | mapped                         |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table_t2`                                     | 196–196   | mapped                         |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table_t5`                                     | 196–196   | mapped                         |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table_t3`                                     | 196–196   | mapped                         |
| `section.appendix_v_treasures.treasure_found_on_defeated_enemies.table`                                        | 196–196   | mapped                         |
| `section.appendix_v_treasures.tables_of_potions.table_weak_or_supreme_potions`                                 | 197–197   | mapped                         |
| `section.appendix_v_treasures.ingredients_and_parts.table_of_ingredients`                                      | 198–198   | mapped                         |
| `section.appendix_v_treasures.ingredients_and_parts.table_of_parts`                                            | 198–198   | mapped                         |
| `section.appendix_v_treasures.table_7`                                                                         | 199–199   | mapped                         |
| `section.appendix_v_treasures.tables_of_magic_powers_for_items.table_magic_weapons`                            | 200–200   | mapped                         |
| `section.appendix_v_treasures.table_magic_armours_and_shields`                                                 | 201–201   | mapped                         |
| `section.appendix_v_treasures.table_8`                                                                         | 201–201   | mapped                         |
| `section.appendix_v_treasures.table_magic_item`                                                                | 201–201   | mapped                         |
| `section.appendix_v_treasures.table_9`                                                                         | 202–202   | mapped                         |
| `section.appendix_v_treasures.table_10`                                                                        | 202–202   | mapped                         |
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

## Verification

Baseline: 53 canonical files validate; 546 tests pass.
Each completed unit records its source pages, object IDs, tests and remaining boundaries above.
Run validate, tests and lint after every unit; regenerate coverage when its inputs change.
Do not promote parent section coverage for deferred procedures or unextracted rules.
