# Lifecycle source inventory — Package F

Package F / Phase 6 Batch 7 starts after Package E catalogue acceptance. This is
a mapped starting inventory, not a completed source audit or independent review.
Each pending heading requires direct PDF reconciliation, including run-in headings
and continuation text; later discoveries must extend this inventory. Existing rules,
catalogues and earlier procedures are reused, with stable IDs.

## State ownership and interpreter contract

- Hero state: HP, Mana, Energy, wounds, disease/poison and mental conditions, personal
  quest progress and hero-specific rewards. Distinct heroes require distinct supplied
  state contexts; a party rule must not overwrite every hero through one unowned field.
- Party state: rations, morale, shared quest choices and group-owned resources.
- Quest-instance state: accepted/progress/completion/abandonment checkpoints and
  consumed rewards. A legal repeat starts a distinct instance; duplicate completion
  within one instance must not repeat resource mutations. Personal-quest one-time
  limits must come from the source rather than generic repeatability.
- Visit state: settlement and estate visit checkpoints, completed durations and
  once-per-visit activities; reuse travel/settlement accounting.
- Estate state: ownership, restrictions, furnishing, ghost events and persistent
  quest consequences. Separate persistent estate history from the current visit.

`invoke` records a handoff; it does not execute another object. A failed `require`
stops its current effect list but does not halt later procedure steps. Consequential
steps therefore need explicit guards. Dice, unavailable external outcomes and geometry
remain supplied inputs. Use procedures for ordered actions and state machines only
where the source defines states and legal transitions. Do not introduce a game runtime.

## Starting heading inventory

| Section                                                                              | PDF range | Printed range from source map | Existing quest records                                 | Disposition                                                                                                                                                            |
| ------------------------------------------------------------------------------------ | --------- | ----------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.buying_an_estate`                                                           | 160–166   | 158–164                       | —                                                      | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_dead_rising`                                               | 224–236   | 222–234                       | `quest.dead_rising.campaign`                           | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.lair_of_the_spider_queen`                                      | 237–242   | 235–240                       | `quest.spider_queen.campaign`                          | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.random_quests`                                                 | 243–243   | 241–241                       | —                                                      | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.quests_into_the_ancient_lands`                                 | 263–272   | 261–270                       | —                                                      | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.side_quests`                                                   | 273–279   | 271–277                       | —                                                      | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.1_wanderlust`                                                   | 42–42     | 40–40                         | `quest.background.wanderlust`                          | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.3_fables`                                                       | 42–42     | 40–40                         | `quest.background.fables`                              | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.2_the_well`                                                     | 42–42     | 40–40                         | `quest.background.the_well`                            | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.4_the_heirloom`                                                 | 43–43     | 41–41                         | `quest.background.the_heirloom`                        | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.5_arachnophobia`                                                | 43–43     | 41–41                         | `quest.background.arachnophobia`                       | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.6_the_lost_brother`                                             | 43–44     | 41–42                         | `quest.background.the_lost_brother`                    | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.9_poverty`                                                      | 44–45     | 42–43                         | `quest.background.poverty`                             | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.7_revenge`                                                      | 44–44     | 42–42                         | `quest.background.revenge_bandits`                     | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.11_the_fraud`                                                   | 45–46     | 43–44                         | `quest.background.the_fraud`                           | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.10_proving_your_worth`                                          | 45–45     | 43–43                         | `quest.background.proving_your_worth`                  | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.13_sworn_enemy`                                                 | 47–47     | 45–45                         | `quest.background.sworn_enemy`                         | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.15_troll_slayer`                                                | 47–47     | 45–45                         | `quest.background.troll_slayer`                        | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.16_revenge`                                                     | 47–47     | 45–45                         | `quest.background.revenge_minotaur`                    | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.14_the_family_keep`                                             | 47–47     | 45–45                         | `quest.background.the_family_keep`                     | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.backgrounds.17_a_new_home`                                                  | 47–48     | 45–46                         | `quest.background.a_new_home`                          | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.into_the_dungeons.generating_the_dungeon`                                   | 88–88     | 86–86                         | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.into_the_dungeons.rest`                                                     | 100–100   | 98–98                         | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.into_the_dungeons.rest.bleeding_out_and_poisoned_characters`                | 100–100   | 98–98                         | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.combat.different_kinds_of_damage`                                           | 121–122   | 119–120                       | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.combat.different_kinds_of_damage.acidic_damage`                             | 121–121   | 119–119                       | —                                                      | Covered by cited shared procedure models; see test-owned Package F manifest for object/test/source-limitation references.                                              |
| `section.combat.different_kinds_of_damage.fire_damage`                               | 121–122   | 119–120                       | —                                                      | Covered by cited shared procedure models; see test-owned Package F manifest for object/test/source-limitation references.                                              |
| `section.combat.different_kinds_of_damage.frost_damage`                              | 122–122   | 120–120                       | —                                                      | Covered by cited shared procedure models; see test-owned Package F manifest for object/test/source-limitation references.                                              |
| `section.combat.different_kinds_of_damage.stun`                                      | 122–122   | 120–120                       | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.combat.different_kinds_of_damage.magic_damage`                              | 122–122   | 120–120                       | —                                                      | Bounded ordinary/exception follow-up reconciled; creature-specific numeric details remain supplied.                                                                    |
| `section.combat.different_kinds_of_damage.disease`                                   | 121–121   | 119–119                       | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.combat.different_kinds_of_damage.poison`                                    | 122–122   | 120–120                       | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.combat.bleeding_out`                                                        | 122–122   | 120–120                       | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.travelling_and_skirmishes.rations_and_resting`                              | 126–126   | 124–124                       | —                                                      | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.settlements.cure_disease_and_poison`                                        | 144–144   | 142–142                       | —                                                      | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.psychology.sanity`                                                          | 55–55     | 53–53                         | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.psychology.sanity.conditions`                                               | 55–55     | 53–53                         | `procedure.sanity_condition`                           | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.settlements.treat_mental_conditions`                                        | 147–147   | 145–145                       | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.settlements.rest_and_recuperation`                                          | 147–147   | 145–145                       | —                                                      | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.buying_an_estate.staying_at_the_house`                                      | 160–160   | 158–158                       | —                                                      | Rendered PDF160: owned free lodging, actual completed settlement recovery and sequenced physical-item storage; named regressions bind delayed stay/hero/visit results. |
| `section.buying_an_estate.buying_the_house`                                          | 160–160   | 158–158                       | —                                                      | Rendered PDF160: actual Silver City purchase spends4000c once and persists party key ownership; estate-ownership lifecycle tests.                                      |
| `section.buying_an_estate.furnishing_the_manor`                                      | 161–161   | 159–159                       | —                                                      | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.buying_an_estate.ghostly_events_table`                                      | 162–162   | 160–160                       | —                                                      | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.buying_an_estate.side_quest_the_grieving_mother`                            | 164–165   | 162–163                       | `quest.estate.grieving_mother`                         | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.buying_an_estate.the_dark_gods`                                             | 166–166   | 164–164                       | —                                                      | Nonprocedural setting prose/illustration, rendered PDF166; no lifecycle invented. See manifest.                                                                        |
| `section.quest_book_i.introduction.reading_the_quests`                               | 222–222   | 220–220                       | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.quest_book_i.introduction.first_blood_introductory_quest`                   | 223–223   | 221–221                       | `quest.first_blood`                                    | Bounded procedure evidence reconciled; see test-owned manifest for actual actor/first-turn/arrival tests and dependencies.                                             |
| `section.quest_book_i.the_dead_rising.quest_1_spring_cleaning`                       | 224–226   | 222–224                       | `quest.dead_rising.spring_cleaning`                    | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_dead_rising.quest_2_the_dead_rising`                       | 227–228   | 225–226                       | `quest.dead_rising.the_dead_rising`                    | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_dead_rising.quest_3_highwaymen`                            | 229–230   | 227–228                       | `quest.dead_rising.highwaymen`                         | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_dead_rising.quest_4_the_burning_village`                   | 231–231   | 229–229                       | `quest.dead_rising.burning_village`                    | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_dead_rising.quest_5_the_apprentice`                        | 232–233   | 230–231                       | `quest.dead_rising.apprentice`                         | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_dead_rising.quest_6a_sacrifice`                            | 234–234   | 232–232                       | `quest.dead_rising.sacrifice`                          | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_dead_rising.quest_6b_the_master`                           | 235–236   | 233–234                       | `quest.dead_rising.master`                             | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.lair_of_the_spider_queen.level_1_the_entrance`                 | 238–239   | 236–237                       | `quest.spider_queen.entrance`                          | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.lair_of_the_spider_queen.level_2_the_basement`                 | 239–240   | 237–238                       | `quest.spider_queen.basement`                          | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.lair_of_the_spider_queen.level_3_the_tomb_of_the_spider_queen` | 241–242   | 239–240                       | `quest.spider_queen.tomb`                              | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_lava_river.quest_1_stop_the_heretics`                      | 244–245   | 242–243                       | `quest.lava_river.stop_heretics`                       | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_lava_river.quest_2_the_master_alchemist`                   | 246–246   | 244–244                       | `quest.lava_river.master_alchemist`                    | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_lava_river.quest_3_preventing_a_disaster`                  | 247–248   | 245–246                       | `quest.lava_river.preventing_disaster`                 | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_bandits_hideout.quest_1_rescuing_the_prisoners`            | 249–250   | 247–248                       | `quest.bandits_hideout.rescuing_prisoners`             | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_bandits_hideout.quest_2_the_pleasure_house`                | 251–252   | 249–250                       | `quest.bandits_hideout.pleasure_house`                 | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_fountain_room.quest_1_cleansing_the_water`                 | 253–253   | 251–251                       | `quest.fountain_room.cleansing_water`                  | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_fountain_room.quest_2_baptising`                           | 254–254   | 252–252                       | `quest.fountain_room.baptising`                        | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.the_chamber_of_reverence.quest_1_returning_the_relic`          | 255–255   | 253–253                       | `procedure.returning_relic`                            | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.quest_book_i.the_chamber_of_reverence.quest_2_slaying_the_fiend`            | 256–256   | 254–254                       | `procedure.slaying_fiend`                              | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.quest_book_i.the_chamber_of_reverence.quest_3_closing_the_portal`           | 257–258   | 255–256                       | `procedure.closing_portal_reading_attempt`             | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.quest_book_i.the_great_crypt.quest_1_retrieving_the_family_heirloom`        | 259–260   | 257–258                       | `procedure.family_heirloom`                            | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.quest_book_i.the_great_crypt.quest_2_stopping_the_necromancer`              | 261–261   | 259–259                       | `quest.great_crypt.stopping_necromancer`               | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.quest_book_i.the_great_crypt.quest_3_tomb_raiders`                          | 262–262   | 260–260                       | `quest.great_crypt.tomb_raiders`                       | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.quest_book_i.quests_into_the_ancient_lands.the_pyramid_of_x_nthu`           | 264–265   | 262–263                       | `quest.ancient_lands.pyramid_xanthu`                   | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.quests_into_the_ancient_lands.tomb_of_the_hierophant`          | 266–267   | 264–265                       | `quest.ancient_lands.hierophant`                       | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.quests_into_the_ancient_lands.temple_of_despair`               | 268–269   | 266–267                       | `quest.ancient_lands.temple_despair`                   | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.quests_into_the_ancient_lands.halls_of_amenhotep`              | 270–270   | 268–268                       | `quest.ancient_lands.amenhotep`                        | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.quests_into_the_ancient_lands.crypt_of_khaba`                  | 271–272   | 269–270                       | `quest.ancient_lands.khaba`                            | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.side_quests.side_quest_1_the_missing_brother`                  | 274–274   | 272–272                       | `quest.side.missing_brother`                           | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.side_quests.side_quest_2_slay_the_beast`                       | 275–276   | 273–274                       | `quest.side.slay_beast`                                | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.side_quests.side_quest_3_the_mapmaker`                         | 276–276   | 274–274                       | `quest.side.mapmaker`                                  | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.side_quests.side_quest_4_go_fetch`                             | 277–277   | 275–275                       | `quest.side.go_fetch`                                  | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.side_quests.side_quest_5_manhunt`                              | 278–278   | 276–276                       | `quest.side.manhunt`                                   | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.quest_book_i.side_quests.side_quest_6_mushrooms`                            | 279–279   | 277–277                       | `quest.side.mushrooms`                                 | Pending direct lifecycle source reconciliation; catalogue extraction remains separate.                                                                                 |
| `section.combat.wounded`                                                             | 121–121   | 119–119                       | —                                                      | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.combat.bleeding_out.advanced_rule`                                          | 122–122   | 120–120                       | —                                                      | Guarded optional timer initialization and supplied expiry source-reconciled; elapsed timing supplied.                                                                  |
| `section.psychology.sanity.reducing_insanity`                                        | 55–55     | 53–53                         | `procedure.sanity_recovery`                            | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.psychology.table`                                                           | 57–57     | 55–55                         | Nine condition lifecycles plus trigger-table selection | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.psychology.table_lingering_trauma_table`                                    | 57–57     | 55–55                         | `procedure.trauma_selection`                           | Bounded procedure evidence reconciled; see test-owned Package F manifest for object/test/source-limitation references.                                                 |
| `section.settlements.leaving_on_a_quest`                                             | 133–133   | 131–131                       | `procedure.quest_departure`                            | Actual departure is bound to the accepted party and occurrence; completed settlement accounting and departure day are distinct from site arrival or quest completion.  |

| `section.settlements.taking_on_quests` | 132–132 | 130–130 | — | Quest offers and actual acceptance are reconciled with saved party/offer/visit/occurrence provenance, independent main/side records and pending site ownership. |

| `section.quest_book_i.the_dead_rising.campaign_aftermath` | 236–236 | 234–234 | — | Added by closure inventory reconciliation; own heading behavior remains pending. |

| `section.quest_book_i.introduction` | 222–223 | 220–221 | — | Added by closure inventory reconciliation; own heading behavior remains pending. |

| `section.quest_book_i.the_lava_river` | 244–248 | 242–246 | — | Added by closure inventory reconciliation; own heading behavior remains pending. |

| `section.quest_book_i.the_bandits_hideout` | 249–252 | 247–250 | — | Added by closure inventory reconciliation; own heading behavior remains pending. |

| `section.quest_book_i.the_fountain_room` | 253–254 | 251–252 | — | Added by closure inventory reconciliation; own heading behavior remains pending. |

| `section.quest_book_i.the_chamber_of_reverence` | 255–258 | 253–256 | — | Added by closure inventory reconciliation; own heading behavior remains pending. |

| `section.quest_book_i.the_great_crypt` | 259–262 | 257–260 | — | Added by closure inventory reconciliation; own heading behavior remains pending. |

## First bounded unit

Rest, PDF100 / printed98: inspect the rendered eleven-step checklist and existing
`procedure.rest`. Guard recovery, brewing and the later ambush check against the
wandering-monster interruption checkpoint. Preserve consumed food and equipment
adjustment before battle. Establish source prerequisites and party/hero ownership,
then test interruption before recovery, completed recovery, later ambush and rejected
rest. Do not change interpreter semantics to simulate a procedure-wide halt.

Package acceptance remains pending: conditions, rest, every quest lifecycle and estate
lifecycle need bounded source evidence and legal/illegal/repeated/exactly-once trace
checks. No pending row is marked extracted or reviewed by this starting inventory.

## Rest interruption checkpoint — PDF100 / printed98

The rendered checklist prints steps1–4 in bold as actions done even when detected
by a Wandering Monster. Food is consumed and equipment may be adjusted before
battle. Detection during the three wandering-monster moves interrupts the rest;
steps6–11 require uninterrupted completion. The existing procedure incorrectly
continued into morale and ambush handling after the battle handoff.

`procedure.rest` now resets `rest_completed` for the current supplied attempt and
sets it true only when the supplied spotting result is false. Each later checklist
step has an explicit completion guard. An early interruption keeps the single food
deduction and gear-adjustment step, hands off to battle and skips morale, hero-recovery
steps, brewing and later ambush. A later ambush occurs after the completed recovery
checkpoint and preserves the printed barred-door initiative distinction. `invoke`
remains a handoff; no interpreter-wide stop or nested execution was introduced.

The party owns food, morale and the attempt completion checkpoint. Hero recovery
remains in existing recovery rules and is not silently executed by these placeholder
steps. Six derived regressions assert steps, events, resource changes and trace:
interruption with either door state, resetting stale completion, completed rest,
and later ambush with either door state. Earlier completed/ambushed YAML fixtures
now include the checkpoint and its applied step. These are derived tests, not source
worked examples or independent review.

This bounded correction does not close Rest or Package F. Follow-up work must guard
entry prerequisites, compose each hero’s recovery/condition checks, enforce the
printed morale cap and protect resource changes against duplicate processing within
one attempt. Source timing of bleeding/poison checks must be inspected and any
undefined interrupted-rest timing recorded as uncertainty rather than guessed.

Rest interruption gate (1 October): validation passes for 403 canonical files;
2488 tests pass with two optional provider tests skipped; coverage regeneration,
lint and diff checks pass. The new rest tests were re-run after fixing their static
fixture type and all six pass. Coverage remains 345/666 extracted (52%), zero
independently reviewed. Next bounded Rest work: entry eligibility and duplicate-
attempt resource protection, followed by per-hero recovery and condition checks.

## Rest entry and attempt accounting — PDF100 / printed98

Rendered source prerequisites require all heroes on the same tile, no enemy on that
tile or adjacent tiles, and the printed one party ration. The procedure now checks
these supplied geometry/resource facts before the checklist. It explicitly guards
every consequential step with `rest_execution_allowed`; failed prerequisites cannot
charge food, increase morale or invoke later handoffs even though procedure walking
continues. Unspecified geometry and a missing attempt marker do not grant entry.

`rest_attempt_processed` is party-owned bookkeeping for one identified attempt,
retained when reprocessing that context. It is not a rulebook limit on later rests.
A distinct legal rest supplies a fresh context with this marker false and its own
`rests_taken` count. Replaying a processed context resets the invocation permission
but preserves food, morale and the completed/interrupted outcome without repeating
wandering movement, brewing, encounter or initiative handoffs. The printed +2 morale
is now capped at the supplied party start value. The rest count remains supplied;
this unit does not increment it again.

Eleven additional derived regressions cover split party, same-tile and adjacent-tile
enemies, no ration, replay of both interrupted/completed attempts, a distinct second
rest with increased risk, three morale cap boundaries and consuming the last ration.
The earlier six interruption regressions and both YAML traces include the entry
checkpoint. State ownership and legal repetition remain explicit. Per-hero recovery,
bleeding/poison checks and recovery outcome timing remain pending; Package F is open.

Rest entry/accounting gate (1 October): validation passes for 403 canonical files;
2499 tests pass (two optional provider skips); all 17 Rest regressions pass again
after static type narrowing; coverage regeneration, lint and diff checks pass.
Coverage remains 345/666 extracted (52%) and zero independently reviewed.

The procedure follows PDF100’s +2 morale checklist. The conflicting +1 short-rest
entry historically retained `issue.phase4.short_rest_morale`; the original unit did not combine the two
values or resolve that source conflict. HP overflow likewise remains
`issue.phase4.recovery_bounds`. Next bounded unit: per-hero HP/Mana recovery and
per-lost-point Energy recovery, reusing existing recovery rules and documenting
hero/attempt/point ownership and explicit composed handoffs. Untreated bleeding
uses its separate source check and 1d4 HP outcome; poisoned heroes take remaining
Poison Tests. Their timing under interruption must be reconciled before full Rest
lifecycle acceptance.

## Hero and lost-point recovery — PDF100 / printed98

The rendered checklist gives one ordinary HP die per hero, one Energy die per lost
point (1–3 replenishes it), and full Mana restoration. Three source-bound helpers
reuse the existing recovery rules: `procedure.rest_hp_recovery`,
`procedure.rest_energy_point_recovery` and `procedure.rest_mana_recovery`. Party
checklist steps7–9 now record those handoffs in order; `invoke` does not execute
children or share a single hero state across the party.

The caller supplies the current party completion checkpoint to each identified hero’s
context. HP and Mana processed markers belong to that hero/attempt. Energy carries
updated hero Energy between distinct point contexts; each point marker belongs to
the original lost-point snapshot and that attempt. Both successful and failed rolls
consume their point calculation, so replay cannot reroll a failure. A new attempt
uses new markers; replay retains them. These are bookkeeping fields, not new game
limits or automatic state-machine transitions.

HP checks overflow against the original HP before applying the ordinary recovery
rule. The existing ambiguity returns unresolved without inventing a maximum clamp;
processing records evaluation even when that source result is unresolved. Ordinary
HP is excluded for untreated bleeding-out heroes and when supplied equipment/talent
modifications make the standard 1d6 result inapplicable. Energy likewise requires
supplied standard applicability. Those separate paths remain pending rather than
silently receiving standard recovery. Mana uses the supplied hero maximum, including
zero, with duplicate restoration protected after later Mana use in the same attempt.

Twenty derived regressions cover die boundaries, failed-point replay, interrupted
recovery, modified/bleeding exclusions, HP maximum/overflow and a two-hero trace.
That trace explicitly resolves HP for each hero, original lost points, then Mana,
while party food and morale change only in the parent procedure. Parent handoffs
alone do not mutate hero resources. Four existing recovery-rule source references
are now marked visually verified after the PDF100 rendering; no independent review
is claimed. The HP overflow and short-rest morale issues link the consuming helpers.
Bleeding/poison checks and their undefined interruption timing remain the next unit.

Hero/point recovery gate (1 October): 404 canonical files validate; 2519 tests pass
(two optional provider skips); the 20 new recovery regressions pass after narrowing
composed state types; coverage regeneration, lint and diff checks pass. Stored
procedures now total 58; no new rules, entities, tables or YAML fixtures were added
by this bounded unit. Coverage remains 345/666 extracted (52%), zero independently
reviewed. Next: Bleeding Out and Poisoned Characters, PDF100 / printed98. That
mechanical passage has not yet been represented in Rest-specific procedures; its
source CON+10 / 1d4 HP and remaining-Poison-Test instructions must not be omitted.

## Bleeding Out and Poisoned Characters — PDF100 / printed98

Rendered source reconciliation found an unmapped run-in heading. Its new stable
child section and coverage row preserve the parent Rest ID and the section/coverage
bijection. `procedure.rest_bleeding_check` and `procedure.rest_poison_checks` represent
the own-heading mechanics; there is no separately printed table, example, glossary
definition or entity catalogue. Procedure ownership carries these facts rather than
duplicating them as new rules. This adds one canonical section; historical denominator
counts remain unchanged. The starting lifecycle inventory now has 76 headings.

An untreated bleeding-out hero takes a CON+10 test. The procedure uses existing
percentile success/failure and automatic-failure rules. Failure sets hero death;
success adds the printed 1d4 HP without equipment/talent HP bonuses. It preserves
the existing above-maximum recovery ambiguity and does not clear bleeding state
or invent a revival transition. Hero/attempt processing prevents replay from
rerolling either a success or failure.

A poisoned hero’s remaining test count is preserved as `poison_tests_due`, with
one explicit handoff to existing `procedure.damage_follow_up` when the count is
positive. Supply that existing procedure’s poison/rest context (`damage_type: poison`,
`phase: rest`, `already_poisoned: true`, `rest_occurs: true`, and the remaining count)
and each returned outcome explicitly. This handoff does not reduce the count,
mutate HP or execute nested procedures automatically. A processed hero/attempt
does not issue the handoff again. Zero remaining tests causes no handoff.

The source says these checks occur “during the rest” but omits them from the
eleven-point checklist. It does not settle early-interruption applicability or
placement relative to ordinary recovery and later ambush. New issue
`issue.rest.condition_check_timing` records that boundary. Completed accepted
rests perform applicable checks; interrupted applicable cases return unresolved
without HP/death/poison outcomes. A rejected rest and heroes without these
conditions do not trigger the timing issue. The parent binds both helpers as
dependencies without inventing an ordered checklist position.

Nineteen derived tests cover all four d4 outcomes, CON+10 boundary and automatic
failure, replay, overflow, unchanged HP bonuses, remaining Poison Tests and the
interruption boundary. An explicit parent/child trace preserves consumed party
food while the affected child’s timing stays unresolved. This is extraction and
regression evidence, not independent review or full Rest/Package F acceptance.

Rest condition-heading gate (1 October): 405 canonical files validate; 2538 tests
pass (two optional provider skips); coverage regeneration, lint and diff checks
pass. The newly mapped child increases canonical sections from 666 to 667; current
coverage is 346/667 extracted (52%), zero independently reviewed. Procedure count
is 60. The 124-entry Package E acceptance scope remains unchanged.

### No-rescue overlap discovered in the next source unit

Rendered PDF121–122 / printed119–120 was inspected to establish the next hero-condition
unit. PDF122’s no-means-to-help death endpoint overlaps the untreated-rest CON+10
possibility on PDF100 without defining their relationship. New issue
`issue.rest.untreated_bleeding_no_rescue` links both instructions and the consuming
Rest helper. That helper represents the PDF100-local instruction; it does not
resolve the combined no-rescue case or create precedence. Both outcomes must remain
visible before full hero-condition composition. Next unit: source-defined bleeding,
rescue, death and replacement checkpoints on PDF122, with this overlap preserved.

No-rescue boundary gate (1 October): 405 canonical files validate; 2538 tests pass
(two optional provider skips); lint and diff checks pass. Coverage generation for
the condition heading passed at its separate unit gate. Current review inventory
has 109 records: 101 unresolved and eight resolved. Printed labels 100→98, 121→119 and
122→120 were confirmed in `pages.yaml`, not derived from an offset.

Next bounded lifecycle unit is Bleeding out, PDF122 / printed120: zero-HP
incapacity, source-listed rescue eligibility, after-battle bandaging restrictions,
party-loss/no-rescue endpoints, permanent injury, optional bleeding timer and
permanent death/replacement. Existing rules are reused; their source-defined
state boundaries and the newly recorded untreated-rest overlap require guarded
composition rather than an inferred priority between passages.

Bleeding entry ownership unit (1 October): rendered PDF122 / printed120 confirms
exact-zero incapacity, supplied d4 permanent loss and the optional d6+1 timer. The
existing `procedure.bleeding_out` now persists `zero_processed` and
`timer_processed` per hero/downing event. Callers supply both markers as false for
a fresh event and carry them forward on replay, with the selected statistic and
turn limit; a distinct later event resets them. An already dead hero cannot enter
these checkpoints. The procedure does not select an injury target or redefine
negative HP: `issue.phase4.zero_and_negative` remains unresolved.

Eleven derived regressions assert rule order, all four injury values, replay, a
distinct later event, exact-zero boundaries, disabled timer and permanent-death
entry rejection. Rescue/bandage permissions, terminal endpoints and replacement
remain pending; this bounded change does not accept the whole bleeding heading.

Bleeding entry replay gate (1 October): 405 canonical files validate; 2549 tests
pass (two optional provider skips); lint and diff checks pass. Eleven new derived
regressions verify per-hero/downing-event injury and optional timer ownership.
Coverage is unchanged at 346/667 extracted, zero independently reviewed. The
existing bleeding procedure remains partially reconciled: next are rescue and
bandage permissions, terminal death endpoints and optional replacement at the
next settlement. Package F and comprehensive Phases 7–12 remain unfinished.

Bleeding rescue/bandage unit (1 October): direct rendered PDF122 / printed120
reconciliation retains all three printed means of rescue during battle: companion
Healing Spell, the hero's own ready-slot Healing Potion, or an adjacent companion's
ready-slot Healing Potion. `procedure.bleeding_out` requires a living, bleeding
target for rescue and bandaging; it clears stale permission flags on every call.
After battle, a standing companion who is not knocked out may bandage.

`rescue_handoff_processed` and `bandage_handoff_processed` belong to a hero and
a specific attempt. Callers start a distinct attempt with false and persist true
after its handoff. A zero-HP healing result may justify another distinct attempt;
replay of the same attempt produces no duplicate handoff. Handoffs do not spend
potions/bandages or restore HP. A later supplied positive result may clear the
bleeding/knocked-down condition during battle; carrying that resulting condition
forward prevents duplicate healing. Post-battle bandage resolution remains a
separate dependency. Terminal death/no-help/optional-expiry and next-settlement
replacement reconciliation remain pending, including the untreated-rest overlap.
Nineteen derived regressions cover the three means, delayed resolution, replay,
distinct attempts, nonpositive healing, rejected target/timing/party contexts and
bandager restrictions. These are extraction tests, not independent review.

Bleeding rescue/bandage gate (1 October): 405 canonical files validate; 2568 tests
pass (two optional provider skips); lint and diff checks pass. Nineteen new derived
regressions verify the printed rescue methods, living/bleeding target guards,
stale permission clearing, attempt-owned handoffs and delayed supplied healing.
Coverage remains 346/667 extracted with zero independently reviewed. Next bounded
unit: terminal party-loss/no-help/optional timer-expiry endpoints, permanent
death and optional next-settlement replacement, retaining the untreated-rest
source overlap. Package F and comprehensive Phases 7–12 remain unfinished.

Bleeding terminal/removal unit (1 October): rendered PDF122 / printed120
reconciliation guards no-help and optional expiry against a living bleeding
hero. Simultaneous party bleeding sets quest loss and death for each supplied
hero. The proposed PDF100 untreated-rest check in the no-help context produces
`issue.rest.untreated_bleeding_no_rescue` without choosing a death/recovery order.
Timer expiry uses supplied elapsed turns and a persisted supplied d6+1 limit;
this procedure does not invent where the timer starts or decrement it.

A death handoff invokes `procedure.hero_death`; callers explicitly run it for
each dead hero. Its `removed_from_game` marker is permanent and its
`replacement_processed` marker belongs to that original dead hero for life.
The player must choose replacement at the supplied next settlement entry.
The resulting level-1 instruction concerns a distinct new hero; the old hero
remains dead and removed. These markers prevent repeated removal or duplicate
replacement authorization, and no character statistics are generated. Eighteen
new derived tests cover terminal boundaries, healthy-target exclusions, source
overlap, removal/replacement eligibility and explicit composition. Together
with entry/rescue tests, the bounded bleeding lifecycle is source-reconciled;
other component coverage and independent review remain pending.

The no-help sentence does not specify a battle-over prerequisite. An explicit
`phase: no_help` checkpoint therefore accepts supplied absence of means during
or after battle, as well as the existing after-battle checkpoint. A pending
rescue roll alone is not proof of absent means. Two derived boundary regressions
verify both battle states; the same untreated-rest ambiguity guard applies.

Bleeding terminal/removal gate (1 October): 406 canonical files validate; 2586
tests pass (two optional provider skips); coverage generation, lint and diff
checks pass. Eighteen new derived tests source-reconcile no-help/party-loss and
optional expiry, permanent removal, player choice and once-per-dead-hero
replacement at the next settlement. `procedure.hero_death` brings the stored
procedure count to 61. Explicit no-help checkpoints do not add a battle-over
prerequisite. The untreated-rest/no-help overlap remains unresolved. Current
coverage is 346/667 extracted, zero independently reviewed; other component
coverage is not promoted by this bounded lifecycle unit. Next bounded unit:
Poison on PDF122 / printed120, including remaining-roll ownership and rest/death
checkpoints. Package F and comprehensive Phases 7–12 remain unfinished.

Poison remaining-check unit (1 October): direct rendered PDF122 / printed120
reconciliation adds target/poison-episode/check ownership to the existing
`procedure.damage_follow_up` ongoing checkpoint. Supply
`poison_check_processed: false` for one distinct due CON check and persist true
on replay. Outcomes (`con_roll`, `con_success`) and whether the check occurs
during rest remain supplied. Carry the updated `remaining_poison_rolls` forward
for the next check; an ordinary success or failure consumes one, while 01–05
cures and cancels every remaining check. Count exhaustion alone is not asserted
to cure the condition. The procedure does not supply poison modifiers or outcomes.

The accepted check snapshots `poison_starting_hp`; only a failed check reducing
HP from 1 to 0 during rest enters the printed rest-death checkpoint. A replay,
successful check, already-zero HP or exhausted remaining count cannot manufacture
that transition. Poison still continues into negative HP as printed; no HP floor
or generic negative-HP death is introduced. The broader zero/negative-HP source
boundary remains recorded in `issue.phase4.zero_and_negative`.

Initial damaging-hit exposure/episode creation, complete all-remaining-check rest
composition and potion/Chapel cure handoffs remain pending. This bounded
remaining-check change does not accept the entire Poison heading or Package F.

`issue.poison.remaining_check_exhaustion` records the remaining source question:
the finite sequence and explicit cures are defined, but whether ordinary sequence
exhaustion clears the condition for re-poisoning is not separately stated. The
procedure consumes the printed checks without assigning a cured flag or asserting
a perpetual condition; later condition status remains a review boundary.

Source-map loopback for Poison: direct rendered PDF122 corrects the parent
Different Kinds of Damage range to PDF121–122 / printed119–120 and adds its own
Poison child heading. The lifecycle starting inventory now contains 77 headings.
The child remains extracting; procedures are partial and other component
dispositions reflect the actual passage. Parent/child IDs and coverage rows
remain one-to-one, without claiming independent review or full lifecycle acceptance.

Poison remaining-check / source-map loopback gate (1 October): 406 canonical
files validate; 2605 tests pass (two optional provider skips); coverage generation,
lint and diff checks pass. Nineteen new derived regressions verify check-owned
damage/count accounting, 01–05 cancellation, replay and actual zero-reaching
rest death. The newly mapped Poison heading and corrected parent continuation
produce 703 section/coverage rows (668 canonical sections, 35 redirects), with
346/668 extracted (52%) and zero independently reviewed. The lifecycle inventory
has 77 headings. Review inventory: 110 records, 102 unresolved/eight resolved,
including the remaining-sequence condition-status question. Next bounded unit:
Poison initial damaging-hit exposure and episode initialization on PDF122, then
all-remaining-check rest composition and explicit potion/Chapel cure handoffs.
Package F and comprehensive Phases 7–12 remain unfinished.

Poison exposure/episode unit (1 October): rendered PDF122 / printed120 confirms
a damaging poison hit before the modified CON outcome may start an episode,
and forbids being poisoned again until cured. The existing procedure accepts
one eligible target/damaging-hit checkpoint with
`poison_exposure_processed: false`, then persists true even when resisted.
Permission is reset per invocation; unresolved damage, a non-damaging hit,
an already-poisoned target or a dead target cannot initialize another episode.

A failed supplied modified CON outcome outside 01–05 sets the current condition
(`already_poisoned` and `poisoned`) and initializes both remaining/due check counts
to the supplied d10 plus one. The printed sequence is the start of the next turn
and checks for d10 turns after that; no initial-exposure HP loss is invented.
The d10 field now enforces 1–10. Resisted exposure retains zero future checks
instead of a stale prior count. A supplied 01–05 CON result cannot infect through
a contradictory supplied failure. Explicit 01–05 cure clears the current state
so a distinct later damaging hit may create a fresh episode; ordinary sequence
exhaustion still has its linked condition-status review boundary.

Nineteen derived regressions cover d10 bounds/counts, replay of failure and
resistance, all five immune results, eligibility, stale permission/counts,
distinct later exposures and cure-then-reinfection composition. Complete rest
composition and potion/Chapel cure handoffs remain pending; Poison's component
coverage stays partial, with no independent review claimed.

Poison initial-exposure/episode gate (1 October): 406 canonical files validate;
2624 tests pass (two optional provider skips); coverage generation, lint and
diff checks pass. Nineteen new derived regressions verify damaging-hit
eligibility, processed resistant/failed exposures, bounded supplied d10+1
initialization, current-condition persistence, immune results, stale counts and
cure-then-reinfection composition. Poison coverage remains partial; 346/668
canonical sections are extracted and zero independently reviewed. Review
inventory remains 110 records (102 unresolved/eight resolved). Next bounded
unit: all-remaining-check poison rest composition on PDF122 / printed120, then
explicit potion/Chapel cure handoffs. Package F and Phases 7–12 remain unfinished.

Poison rest-sequence unit (1 October): rendered PDF122 / printed120 requires
all remaining CON checks when the party rests in a dungeon, while traveling or
at an inn. The existing `procedure.damage_follow_up` rest checkpoint now accepts
a living poisoned hero with positive remaining count and an actual supplied
rest once per hero/episode/attempt, using `poison_rest_handoff_processed`. This
marker is separate from the outer dungeon-rest marker and each individual
`poison_check_processed` marker. Replay clears transient permission/due output
and cannot start another sequence; a distinct source-eligible context has a
fresh rest marker. The handoff does not mutate HP or consume the remaining count.

Resolve accepted sequences explicitly through the existing ongoing checkpoint,
one supplied CON outcome at a time. Carry HP, remaining count, current condition
and death state forward; each distinct check starts with a fresh check marker.
Stop at count exhaustion, explicit cure or death. A death during rest hands off
to `procedure.hero_death`; the caller executes permanent removal separately.
The interrupted-rest timing issue and post-sequence condition-status issue remain
unresolved, and no generic below-zero HP death or automatic exhaustion cure is
introduced.

Dependency-cycle disposition for `procedure.damage_follow_up`'s
`remaining_poison` self-target: source-defined bounded repetition, not recursive
rest execution. The edge records re-entry into the **ongoing** checkpoint from
the one-time **rest** handoff. Ordinary accepted checks decrement the finite
count; 01–05 cancels it; death/cure reject further checks. `invoke` does not execute
a loop. This origin and its source/guards must remain visible in the Phase 7 graph
audit rather than being discarded as a generic self-cycle.

Seventeen derived regressions cover positive/zero counts, replay, excluded
contexts, supplied context ownership, all three printed rest locations, ordinary
success/failure sequences, mid-sequence cure, death/removal, the eleven-check
maximum initial sequence, rejected replay composition and explicit dungeon-rest
helper composition. Full Poison procedure acceptance still requires the printed
potion/Chapel cures; independent review remains pending.

Poison all-remaining-check rest gate (1 October): 406 canonical files validate;
2641 tests pass (two optional provider skips); coverage generation, lint and
diff checks pass. Seventeen new derived regressions verify rest handoff
accounting/replay, all printed rest contexts, explicit finite CON sequences,
cure/death stopping, permanent-removal handoff and dungeon helper composition.
After the full suite passed, two static array-index accesses in the new test
were narrowed; all 17 targeted tests and lint then passed again. The
remaining_poison self-dependency has a recorded source-defined bounded re-entry
disposition for Phase 7, and invoke still does not execute a loop. Poison's
procedure component remains partial pending explicit potion/Chapel cure
handoffs. Coverage remains 346/668 extracted, zero independently reviewed.
Next bounded unit: those printed cures on PDF122 / printed120 and their existing
equipment/settlement links. Package F and comprehensive Phases 7–12 remain unfinished.

Poison explicit-cure unit (1 October): rendered PDF122 / printed120 and the
existing antidote entry on rendered PDF80 / printed78 source-reconcile
`procedure.poison_cure`. It records a once-per-hero/episode/attempt potion or
Chapel handoff; actual consumption and quality-specific poison-removal outcomes
are supplied from the existing catalogue, while a Chapel visit must actually be
completed back in the city. Replay of a failed consumed Weak potion cannot
replace its result with a successful reroll; a distinct later actual use has
fresh attempt markers. Invoke alone does not consume, pay or cure.

Confirmed removal clears current poison flags and cancels pending checks. It
does not restore prior HP loss, wake a negative-HP hero, revive the dead or charge
completed resources again. The Supreme potion's separate 1d3 HP instruction
remains with its existing item-effect resolver; known poison removal can occur
while that bonus still needs resolution. The bounded condition checkpoint neither
drops nor doubles that separate effect. Nineteen derived tests cover completed
and pending resolution, standard/weak effects, 75/76 boundaries, failed-result
replay, distinct attempts, Supreme metadata/HP preservation, Chapel context and
completion, rejected targets/routes and the parent damage-follow-up handoff.

`issue.poison.chapel_treatment_route` records a direct rendered comparison:
PDF122 names Chapel of Metheia, PDF134's Available Actions row assigns Cure Poison
only to Sick Wards, and PDF144's prose names Sick Ward or Temple of Metheia for
most illnesses at 100 c / one day. Chapel and Temple are not silently equated.
No Chapel location ID, Activity Point cost, price or duration is invented; the
printed completed-visit effect remains representable with an unbound labelled
dependency and original wording in unresolved_references.

The Poison procedure component is extracted within this bounded unit with
exposure, remaining checks, rest sequences and explicit cures. Other component
coverage and independent review remain pending. The heading's previous entity
not-applicable disposition is corrected to not-started: its named antidote links
to existing equipment, while the Chapel needs catalogue/source reconciliation;
no new entity is extracted during this Phase 6 unit.

Settlement treatment integration: the existing
`procedure.settlement_buy_sell_and_service` successful `cure_poison_result`
now carries the same current poison state forward by clearing both poison flags
and cancelling remaining/due checks. The existing service remains the sole
owner of its 100 c fee, activity/visit eligibility and once-per-treatment
accounting; these known service inputs are not applied to the unbound Chapel
route. Three additional derived regressions verify successful treatment then
ignored future damage, failed treatment with retained condition, and an
ineligible attempt with no charge/cure. Other illnesses and prior HP loss remain
unaffected. The explicit-cure test file now has 22 derived regressions.

Poison explicit-cure / settlement-integration gate (1 October): 407 canonical
files validate; 2663 tests pass (two optional provider skips); coverage
generation, lint and diff checks pass. `procedure.poison_cure` brings the stored
procedure count to 62. The 22 new derived cure regressions cover potion outcomes,
75/76 boundaries, replay, Supreme metadata/HP preservation, completed Chapel
visits, unbound route evidence and successful/failed/ineligible existing
settlement treatment. The service retains its accounting ownership and now
clears both current poison flags and cancels the remaining sequence.

Poison's bounded procedure component is extracted; the section remains
extracting because other components remain pending. Its entity disposition is
corrected to not-started for the named antidote/Chapel evidence. Coverage remains
346/668 extracted, zero independently reviewed. Review inventory: 111 records,
103 unresolved/eight resolved, including Chapel/Temple/Sick Ward routing.
Next bounded unit: Disease, PDF121 / printed119, including exposure, delayed
post-battle stat changes, rest cure and replay/state ownership. Package F and
comprehensive Phases 7–12 remain unfinished.

Disease exposure / rest checkpoint (1 October): rendered PDF121 / printed119
preserves indicated exposure, modified CON resistance, delayed post-battle loss
of half CON and STR rounded down, and an optional rest cure on 01–05.
Episode-owned markers prevent replay from halving adjusted values again; distinct
exposures and rests receive fresh markers. Cure ends modifier applicability
without inventing restoration across unrelated stat changes. Existing settlement
treatment ends that applicability within its own resource accounting.

The newly mapped Disease heading has an extracting procedure component; explicit
potion/Sick Ward cure routing remains the next bounded unit. Other components
and independent review remain pending. issue.disease.concurrent_effects records
unspecified overlapping illnesses and stat-modifier composition. Derived evidence:
tests/rules/disease-lifecycle.test.ts (22 regressions). Package F and
comprehensive Phases 7–12 remain unfinished.

The lifecycle starting inventory now contains 78 headings after the Disease source-map loopback.

Disease exposure / optional-rest gate (1 October): 407 canonical files validate;
2685 tests pass (two optional provider skips). Coverage regeneration, lint and
diff checks pass. Coverage tracks 704 rows: 669 canonical sections and 35
redirects; 346/669 extracted, zero independently reviewed. Review inventory:
112 records, 104 unresolved/eight resolved. Stored procedures remain 62.
Next bounded unit: explicit Disease potion/Sick Ward cure routing. Package F
and comprehensive Phases 7–12 remain unfinished.

Disease explicit-cure checkpoint (1 October): rendered PDF121 / printed119,
PDF80 / printed78 and PDF144 / printed142 confirm the potion and Sick Ward
routes. procedure.disease_cure accepts source-backed completed item/treatment
outcomes, owns hero/episode/cure-attempt handoff/result markers, and clears
disease plus stat-loss applicability only on confirmed success. Weak failures
consume their result, distinct attempts can retry, dead heroes cannot be revived,
and Supreme 1d3 HP stays with the item effect. Existing settlement treatment
retains the 100 c fee, eligible visit/day accounting and illness-specific outcome.
No stat restoration across unrelated modifiers or other illness removal is inferred.

Derived evidence: tests/rules/disease-cure-lifecycle.test.ts (21 regressions),
including composed successful/failed/ineligible service accounting, Weak 75/76,
Standard/Supreme, replay and the parent handoff. The Disease procedure component
is extracted within this bounded unit; other components and independent review
remain pending. Next bounded unit: Fire, Acidic and Frost damage follow-up,
PDF121–122 / printed119–120. Package F and comprehensive Phases 7–12 remain unfinished.

Disease explicit-cure gate (1 October): 408 canonical files validate; 2706 tests
pass (two optional provider skips). Coverage generation, lint and diff checks
pass. The new helper brings stored procedures to 63. Coverage remains 346/669
canonical sections extracted, zero independently reviewed, with 704 mapped rows
including 35 redirects. Review inventory remains 112 records (104 unresolved,
eight resolved). Next bounded unit: Fire, Acidic and Frost damage follow-up,
PDF121–122 / printed119–120. Package F and comprehensive Phases 7–12 remain unfinished.

Elemental hit / continuation checkpoint (1 October): rendered PDF121–122 /
printed119–120 preserves Fire ignoring NA and armour, Acidic ignoring NA, the
1–3 versus 4–6 continuation branches, half rounded down with minimum 1, and
Frost's 50% supplied stun outcome. procedure.damage_follow_up owns a distinct
target/hit initial marker; successful/failed outcomes both consume that check.
Fresh hits use fresh contexts, rather than aggregating unspecified overlapping
effects. procedure.elemental_continuation records one damage handoff on the
actual next turn and ends its pending effect only after supplied completed
damage resolution. Existing damage ownership handles HP/protection/death; no
second HP subtraction or resource mutation is performed by invoke.

issue.damage_follow_up.continuation_basis preserves the source's unspecified
Acidic halving/protection order. The legacy damage_before_protection input is
explicitly a supplied halving basis, rather than an inferred ordering decision.
The three newly mapped run-in headings extend the lifecycle inventory to 81.
Fire/Acidic bounded procedure components are extracted; Frost remains extracting
until next-turn AP consumption is reconciled. Other components and independent
review remain pending. Derived evidence: tests/rules/elemental-lifecycle.test.ts
(32 regressions). Next bounded unit: Stun/Frost next-turn AP consumption,
PDF122 / printed120, then Magic damage exceptions on that page. Package F and
comprehensive Phases 7–12 remain unfinished.

Elemental continuation uses the generic character.hit_points.loss dependency;
it does not infer weapon-hit location or equipment damage. An additional
composed trace asserts the applied rule, one HP subtraction, effect completion
and replay without another handoff.

Elemental hit / continuation final gate (1 October): 409 canonical files
validate; 2738 tests pass (two optional provider skips). Coverage generation,
lint and diff checks pass. Stored procedures: 64. Coverage: 707 mapped rows,
672 canonical sections plus 35 redirects, 346/672 extracted, zero independently
reviewed. Review inventory: 113 records, 105 unresolved/eight resolved. The
32 new derived regressions include generic HP-loss composition with an applied
rule trace and completion/replay without another HP subtraction. Next bounded
unit: Stun/Frost next-turn AP consumption, then Magic damage exceptions.
Package F and comprehensive Phases 7–12 remain unfinished.

Stun/Frost affected-turn checkpoint (1 October): rendered PDF122 / printed120
confirms one AP loss during the target next turn; rendered PDF179 / printed177
confirms the weapon-specific even damage roll and non-stacking exception.
procedure.damage_follow_up preserves supplied actually resolved stun outcomes,
including false outcomes and initial replay markers. procedure.stun_next_turn
requires the actual affected turn and its initialized allowance before applying
one AP loss. Target/affected-turn ownership and consumed markers prevent replay,
previous-turn charging or changes to another target. Pending effect and scheduled
loss are consumed only by the accepted AP mutation. Invoke alone changes no AP.

issue.stun.ap_and_overlap retains zero initialized allowance and mixed-source
aggregation boundaries. The weapon exception is linked to its existing rule,
without promoting it to a universal rule. Unknown scope/zero AP leaves the
pending effect and its marker unchanged. Derived evidence:
tests/rules/stun-lifecycle.test.ts (22 regressions), including Frost composition,
weapon non-stacking composition and the applied weapon-rule trace. The Stun
source-map loopback brings the lifecycle inventory to 82 headings. Stun/Frost
bounded procedure components are extracted; other components and independent
review remain pending. Next bounded unit: Magic Damage exceptions, PDF122 /
printed120. Package F and comprehensive Phases 7–12 remain unfinished.

Stun/Frost affected-turn final gate (1 October): 410 canonical files validate;
2760 tests pass (two optional provider skips). Coverage generation, lint and
diff checks pass. Stored procedures: 65. Coverage tracks 708 mapped rows,
673 canonical sections plus 35 redirects; 346/673 extracted, zero independently
reviewed. Review inventory: 114 records, 106 unresolved/eight resolved. The
22 new derived regressions cover legal/illegal initialized-turn consumption,
replay, distinct target/turn contexts, Frost handoff composition and the
weapon-specific non-stacking rule trace. Next bounded unit: Magic Damage
exceptions, PDF122 / printed120. Package F and comprehensive Phases 7–12
remain unfinished.

Magic Damage follow-up checkpoint (1 October): rendered PDF122 / printed120
preserves spells, prayers, scrolls, magic weapons and items as named magic
sources; the passage's normal path and creature-specific complications remain
distinct. procedure.damage_follow_up accepts one distinct initial event after
base damage is actually resolved. Ordinary source-reconciled targets complete
without an extra HP mutation or handoff. Applicable supplied creature-specific
complications request one handoff; only supplied actual completion marks the
event complete. Unknown applicability remains issue.magic.creature_complications.
The generic passage gives no numeric demon vulnerability, armour bypass or
immunity, and names no external book. No such detail or explicit book pointer
is fabricated; absent Bestiary contents remain unavailable.

Derived evidence: tests/rules/magic-damage-lifecycle.test.ts (15 regressions),
including an applied generic HP-loss trace, ordinary completion, pending/actual
exception completion, replay, separate targets and phase guards. The new run-in
heading extends the lifecycle inventory to 83; its bounded procedure component
is extracted, other components and independent review pending. Next bounded
unit: Wounded condition and AP allowance, PDF121 / printed119. Package F and
comprehensive Phases 7–12 remain unfinished.

Magic Damage follow-up final gate (1 October): 410 canonical files validate;
2775 tests pass (two optional provider skips). Coverage generation, lint and
diff checks pass. Stored procedures remain 65. Coverage tracks 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory: 115 records, 107 unresolved/eight resolved. The
15 new derived regressions preserve normal damage, actual exception outcomes,
unknown source applicability and once-per-event state. Next bounded unit:
Wounded condition and AP allowance, PDF121 / printed119. Package F and
comprehensive Phases 7–12 remain unfinished.

Wounded status / turn-cap checkpoint (1 October): rendered PDF121 / printed119
confirms loss of half maximum HP rounded up and the one-AP-per-turn limit while
that condition remains. procedure.wounded_status recomputes current HP loss
without applying damage/healing, clears the flag above the threshold, and applies
a cap only to an actual fresh initialized unspent allowance of a living acting
positive-HP target. Target/turn markers prevent replay/refilling. Already lower
allowances are preserved; healing does not refund AP in an active turn.

The existing procedure.combat_damage Wounded step now hands off rather than
setting active-turn AP to one. Its stable rule reference remains linked through
the new procedure dependency. character.hit_points.wounded keeps its stable ID
and calculation, gains rendered-source verification and the timing issue link.
issue.wounded.turn_allowance retains mid-turn onset/healing and mixed-modifier
order instead of inventing Wounded/Stun precedence. Derived evidence:
tests/rules/wounded-lifecycle.test.ts (27 regressions), including a post-hit HP
trace with one subtraction and no AP refill, recovery, rounding and Stun-zero
allowance preservation. The own Wounded passage has no entity/table/example;
its bounded procedure component is extracted, other components/review pending.

The hero-condition inventory also lacked Psychology/Sanity. Its existing mapped
PDF55 / printed53 node (page-map verified) is now an explicitly pending entry,
bringing the lifecycle inventory to 84 headings. Next bounded unit: Sanity
loss/threshold procedure, PDF55 / printed53, then the mental-condition outcomes
and existing treatment integration. Package F and comprehensive Phases 7–12
remain unfinished.

Wounded status / turn-cap final gate (1 October): 411 canonical files validate;
2802 tests pass (two optional provider skips). Coverage generation, lint and
diff checks pass. Stored procedures: 66. Coverage remains 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory: 116 records, 108 unresolved/eight resolved. The
27 derived regressions cover threshold/current-status recovery, actual fresh
allowances, replay, incapacity, unresolved timing/order and post-hit HP/AP
composition without duplicate mutation. Next bounded unit: Sanity loss/threshold
procedure, PDF55 / printed53. Its page has now been rendered and inspected as
preliminary next-unit evidence; no Sanity procedure extraction is claimed yet.
Package F and comprehensive Phases 7–12 remain unfinished.

Sanity loss / exact-zero checkpoint (1 October): rendered PDF55 / printed53
and optional-system evidence on rendered PDF21 / printed19 preserve one
hero/distinct-event loss context. procedure.sanity_loss reuses all existing loss
rules and the full structured table, including -2 Terror/trap, -1 head wound,
Fear, each demon battle, reduction to 0 HP, disease contraction and getting
poisoned, plus actual 1d3 miscast loss. Event confirmation and processed markers
prevent repeating one demon battle, counting ongoing disease/poison checks as
new onsets, or applying a loss to every hero through one shared state. Creation
remains owned separately; no event reinitializes Sanity to 8. Disabled Sanity
under Complexity causes neither loss nor condition handoff.

Room events request the existing Exploration Card handoff once while its actual
loss amount is unknown; the numerical result is consumed only after a supplied
source-backed loss amount is applied here once. Exact zero owns one pending
condition-acquisition handoff to the existing Conditions section, with no
invented future procedure ID. This checkpoint does not select/add conditions,
reroll diagnoses or reset Sanity. It blocks further losses while that episode
awaits its separate owner. Overshoot retains its numerical result and existing
issue.phase4.sanity_boundaries without clamp, cascade or diagnosis.

Derived evidence: tests/rules/sanity-loss-lifecycle.test.ts (29 regressions),
asserting numerical outcomes and applied-rule traces for every printed loss
branch, optional/rejected contexts, exact-zero/replay, separate heroes/events,
room-card handoff/resolution and negative-boundary uncertainty. Existing loss
rule IDs gain rendered-source verification; the table remains structured and
unchanged. The bounded Sanity procedure component is extracted; Conditions,
recovery, source-pointer reconciliation and independent review remain pending.
The mapped Conditions child is now a pending inventory entry, bringing the
lifecycle inventory to 85 headings. Next bounded unit: Conditions acquisition,
duplicate rerolls and reset, PDF55 / printed53 with existing table PDF57 /
printed55. Package F and comprehensive Phases 7–12 remain unfinished.

Sanity loss / exact-zero final gate (1 October): 412 canonical files validate;
2831 tests pass (two optional provider skips). Coverage generation, lint and
diff checks pass; the corrected typed test inputs also pass a focused rerun.
Stored procedures: 67. Coverage remains 709 mapped rows, 674 canonical sections
plus 35 redirects; 346/674 extracted, zero independently reviewed. Review
inventory remains 116 records, 108 unresolved/eight resolved. The 29 derived
regressions assert source loss amounts, rule traces, optional/event guards,
exact-zero handoff, replay, room-card resolution and preserved overshoot.
Next bounded unit: Conditions acquisition, duplicate rerolls and reset,
PDF55 / printed53 with existing table PDF57 / printed55. Package F and
comprehensive Phases 7–12 remain unfinished.

## Conditions acquisition and duplicate rerolls — 1 October

Rendered PDF55 / printed53 and PDF57 / printed55 were inspected directly.
`procedure.sanity_condition` reuses the complete structured Mental Conditions
Table, including printed 0 as supplied die 10. A distinct actual draw selects
one name once. Membership is supplied for that selected name; a duplicate
requests another distinct draw without changing the condition count or Sanity.
A new diagnosis increments the hero's count once, resets current and maximum
Sanity to eight minus the new count, and requests the existing condition effect.
The effect handoff does not execute the condition's later lifecycle.

The hero's pending exact-zero episode persists across rerolls and replays.
A later distinct exact-zero episode initializes fresh acquisition markers;
revisiting a pending episode through Sanity loss preserves its consumed draw.
Historical cured-diagnosis policy, exhausted diagnoses, negative Sanity and
nonpositive resets retain the existing review boundaries. No reroll cap,
clamping, diagnosis fallback or external Bestiary content is inferred.

The bounded Conditions procedure component is extracted; condition effect
lifecycles, reducing insanity and independent review remain pending. The
inventory still maps 85 headings. Next bounded unit: Mental Conditions effect
lifecycles, PDF57 / printed55, including its structured Lingering Trauma table.
The 29 derived regressions cover all ten dice, complete applied-rule traces,
duplicate and delayed membership, replay, distinct draws, reset boundaries and
composition with actual Sanity loss. Package F and Phases 7–12 remain unfinished.

Conditions acquisition final gate (1 October): 413 canonical files validate;
2860 tests pass (two optional provider skips). Coverage generation, lint and
`git diff --check` pass. Stored procedures: 68. Coverage remains 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory remains 116 records, 108 unresolved/eight resolved.
Next bounded unit: Mental Conditions effect lifecycles, PDF57 / printed55,
including the structured Lingering Trauma table. Package F and comprehensive
Phases 7–12 remain unfinished.

## Acute Stress current-quest lifecycle — 1 October

Rendered PDF57 / printed55, Mental Conditions Table row 2–3, confirms the
owned Resolve penalty, screaming/alerting during battles, additional +1 Threat
for each battle from diagnosis until quest end, and current-quest duration.
`procedure.acute_stress` applies the existing stable source rule once after an
actual accepted diagnosis. Its fields hold this condition contribution; they
never subtract from or restore total RES or overwrite other condition modifiers.
Each genuinely distinct later battle has its own hero/diagnosis/quest/battle
marker, so turns, hits and replay cannot add extra Threat. A later quest does
not inherit this effect.

The acquisition procedure now hands off to this lifecycle and initializes
fresh owned markers only on actual accepted Acute Stress acquisition. At an
actual source-reconciled quest endpoint, the effect contribution expires once;
unknown endpoint preserves the existing issue.0004 conflict. Objective
completion, dungeon exit or a return request alone cannot substitute for that
checkpoint. No universal quest-end definition is inferred.

`issue.sanity.acute_stress_diagnosis_expiry` records the missing diagnosis/count,
Sanity-maximum and historical-draw accounting at this printed effect expiry.
Expiry does not silently cure, decrement conditions or reset Sanity. The full
Mental Conditions procedure component is mapped, with only Acute Stress
reconciled; the remaining effect lifecycles and independent review are pending.
The starting inventory's duplicated Conditions row was removed and the two
existing PDF57 table nodes added: 86 unique headings now have dispositions.
Earlier 85-row inventory statements are historical row counts, not 85 unique
headings. Next bounded unit: Lingering Trauma selection, next-dungeon trigger
and exit expiry, PDF57 / printed55. Package F and Phases 7–12 remain unfinished.

Acute Stress final gate (1 October): 414 canonical files validate; 2883 tests
pass (two optional provider skips). Coverage generation, lint and
`git diff --check` pass. Stored procedures: 69. Coverage remains 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory is 117 records, 109 unresolved/eight resolved.
The 23 derived regressions check full applied-rule traces, actual diagnosis,
per-battle replay, distinct heroes/quests, owned expiry, endpoint ambiguity and
composition with diagnosis acquisition without repeated count/reset.
Next bounded unit: Lingering Trauma selection, next-dungeon trigger and exit
expiry, PDF57 / printed55. Package F and comprehensive Phases 7–12 are unfinished.

## Lingering Trauma selection and next-dungeon lifecycle — 1 October

Rendered PDF57 / printed55 was inspected directly: Mental Conditions row 4
and all six rows of the Lingering Trauma Table. `procedure.trauma_selection`
reuses the existing complete table and stable lookup rule for an actual supplied
1d6 roll, once per accepted diagnosis. A changed die on replay cannot replace
its persisted trigger. The separate `procedure.lingering_trauma` handoff
requests that selection once and does not invent a roll or apply penalties.
Acquisition initializes fresh owned state only for an actual new Trauma diagnosis.

An actual matching table situation or source-backed reminder must occur in
this hero's next dungeon after diagnosis. The procedure recomputes the event
match; a stale trigger flag, the diagnosis dungeon, another dungeon, an
unconfirmed event or another selected situation cannot activate it. The stable
activation rule applies only the owned -10 Resolve Test and -10 CS contributions
once. Those contributions remain active through other events and replays until
actual departure; the stable expiry rule clears only them once. Total RES/CS,
other condition contributions, diagnosis count and Sanity remain separate.
An untriggered next visit closes without a guessed penalty or cure.

`issue.sanity.trauma_scope` retains unspecified selection time, reminder scope,
later recurrence/rearming and diagnosis/Sanity accounting at departure. Unknown
next-dungeon identity or resemblance does not activate a penalty; unknown
departure identity does not clear an active effect. A later recurrence request
remains unresolved after the owned visit closes. Quest end, an objective,
a room change or a departure request alone cannot replace actual departure.

The six-row table selection procedure component is extracted. The full Mental
Conditions procedure component remains mapped because other effects are pending;
independent review is pending. Inventory remains 86 unique headings. Next bounded
unit: Jumpy actual Scenario-roll Threat accounting, PDF57 / printed55. Package F
and comprehensive Phases 7–12 remain unfinished.

Lingering Trauma final gate (1 October): 415 canonical files validate; 2917 tests
pass (two optional provider skips). Coverage generation, lint and
`git diff --check` pass. Stored procedures: 71. Coverage remains 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory is 118 records, 110 unresolved/eight resolved.
The 34 derived regressions check all six table selections, full selection/
activation/expiry rule traces, owned next-dungeon/event guards, replay, actual
and unresolved departure, no retroactive selection, recurrence boundary and
composition from accepted diagnosis without another count/Sanity reset.
Next bounded unit: Jumpy actual Scenario-roll Threat accounting, PDF57 /
printed55. Package F and comprehensive Phases 7–12 remain unfinished.

## Jumpy actual Scenario/noise lifecycle — 1 October

Rendered PDF57 / printed55, Mental Conditions row 7, confirms +2 Threat for
an actual Scenario roll of 10 and qualitative jump/scream/startle/alert behavior
for unsuspecting noises. Rendered PDF89 was also inspected; pages.yaml confirms
its misprinted folio is 88. Its ordinary Scenario result 9 or 0 requests a
Threat Level roll, with quest-specific threshold changes separately preserved.

`procedure.jumpy` consumes each actual supplied Scenario result once for this
active hero/diagnosis, including 1–9. Replacing a consumed result with 10 does
not add Threat; a genuinely new actual roll has a fresh owned marker. The stable
Jumpy rule adds the printed +2 only to an actual 10 in a resolved contribution
context. No ordinary Threat comparison/decrease, quest-max reaction, reroll,
spawn, action loss, morale loss or Sanity/count mutation is performed here.
A separate actual unsuspecting noise reports the printed behavior once without
an invented numerical Threat increase. Output reports are per-call and do not
reverse previous alerting on replay.

`issue.sanity.jumpy_threat_order` retains unspecified order with the ordinary
Threat roll, quest-maximum interaction and multiple-Jumpy-hero aggregation.
Unknown +2 context remains unconsumed with unchanged supplied Threat. The
ordinary Scenario procedure is an explicit separate dependency; composition
checks its handoff without choosing an order for actual Threat-roll resolution.
The acquisition handoff initializes this accepted diagnosis's active state and
fresh occurrence markers, and alone does not roll or increase Threat.

The condition wrappers also had a concrete ownership defect: a shared latest
acquired name or pending acquisition marker could suppress an earlier active
condition. Jumpy now uses its own actual active diagnosis state; Trauma has a
persisted accepted-diagnosis marker; Acute Stress uses the latest name only for
initialization and its owned state for later battles/expiry. A later diagnosis
or pending acquisition no longer cancels earlier effects. Tests compose an
actual later Jumpy acquisition with the retained earlier Trauma selection and
next-dungeon activation. This does not infer stacking across heroes or a cure.

The whole Mental Conditions procedure component remains mapped, with these
three condition lifecycles reconciled and remaining rows pending. Inventory
remains 86 unique headings and independent review remains pending. Next bounded
unit: Depression once-per-diagnosis Energy-pool reduction and floor boundary,
PDF57 / printed55. Package F and comprehensive Phases 7–12 remain unfinished.

Jumpy and condition-ownership final gate (1 October): 416 canonical files
validate; 2947 tests pass (two optional provider skips). Coverage generation,
lint and `git diff --check` pass. Stored procedures: 72. Coverage remains 709
mapped rows, 674 canonical sections plus 35 redirects; 346/674 extracted, zero
independently reviewed. Review inventory is 119 records, 111 unresolved/eight
resolved. The 29 Jumpy regressions check all ten results, full source-rule traces,
actual occurrence guards, non-10 replay, noise reports, unresolved +2 context,
separate ordinary Scenario handoff and actual diagnosis composition. Expanded
Acute Stress/Trauma ownership checks preserve earlier effects after a later
diagnosis or pending acquisition; the four focused suites pass 116 tests.
Next bounded unit: Depression once-per-diagnosis Energy-pool reduction and
floor boundary, PDF57 / printed55. Package F and Phases 7–12 remain unfinished.

## Depression actual onset-capacity reduction — 1 October

Rendered PDF57 / printed55, Mental Conditions row 0, was inspected directly.
It reduces the Energy pool by two; it does not say to subtract from currently
available Energy. Rendered PDF26 / printed24 confirms the ordinary starting
pool of one, unless otherwise stated, and separate recovery of lost Energy.
The existing floor review evidence for PDF26 is now visually verified.

`procedure.depression` accepts an actual owned active diagnosis, independent
of later diagnosis names or another pending acquisition episode. It captures
one actual supplied unmodified onset capacity and applies the stable -2 rule
once when the capacity is at least two and still matches that source-grounded
snapshot. Rest, spending, growth, replay and another condition cannot subtract
again. The acquisition handoff initializes fresh owned markers only on actual
accepted Depression and alone does not reduce capacity or current Energy.
Missing onset capacity requests actual input once; it never reinitializes a
hero to the ordinary starting value.

A below-two onset remains pending under issue.phase4.energy_floor, with no
clamp or negative-capacity guess. Its captured snapshot persists through later
capacity growth, which cannot silently convert that original diagnosis into a
new legal reduction. `issue.sanity.depression_capacity_context` retains delayed/
already-adjusted capacity, changes from the onset snapshot, available Energy
above reduced capacity and treatment-restoration accounting. A defined capacity
reduction is consumed even if remaining Energy exceeds it; current Energy is
preserved and the missing reconciliation is recorded. Current Energy can also
remain explicitly unsupplied without inventing it. Ordinary recovery remains
separate and uses the actual modified capacity supplied to its existing owner.
No blind capacity restoration or cure/Sanity/count mutation is performed here.

The 27 derived regressions cover defined and below-two capacities, full source
rule traces, replay/growth/rest, missing input, delayed context, owned diagnosis,
remaining-Energy bounds, separate recovery and actual diagnosis composition.
The full table procedure component remains mapped with other rows pending;
independent review is pending. Inventory remains 86 unique headings. Next bounded
unit: Fear of the Dark and Claustrophobia owned/contextual modifier checkpoints,
PDF57 / printed55. Package F and comprehensive Phases 7–12 remain unfinished.

Depression final gate (1 October): 417 canonical files validate; 2974 tests pass
(two optional provider skips). Coverage generation, lint and `git diff --check`
pass. Stored procedures: 73. Coverage remains 709 mapped rows, 674 canonical
sections plus 35 redirects; 346/674 extracted, zero independently reviewed.
Review inventory is 120 records, 112 unresolved/eight resolved. The 27 derived
regressions cover defined onset reduction with full applied-rule trace,
unchanged current Energy, replay/growth/rest, retained below-two snapshots,
missing/delayed capacity, available-Energy overflow, separate return recovery
and actual diagnosis handoff/composition without another Sanity/count reset.
Next bounded unit: Fear of the Dark and Claustrophobia owned/contextual modifier
checkpoints, PDF57 / printed55. Package F and Phases 7–12 remain unfinished.

## Fear of the Dark and Claustrophobia contextual modifiers — 1 October

Rendered PDF57 / printed55, Mental Conditions rows 5 and 9, was inspected
directly. `procedure.fear_of_the_dark` reuses the stable source rule for all
Resolve Tests at -10, with no added darkness-only restriction. It recomputes
only its owned contribution; repeated tests do not accumulate loss. Actual
condition removal or rule omission clears only that contribution. Another owner
cannot overwrite it, and a later diagnosis/pending acquisition does not disable
an earlier actual condition.

`procedure.claustrophobia` recomputes the full printed all-skills/stats -10
contribution in an actual supplied corridor, clearing only that contribution
outside corridors or when the actual condition/rule does not apply. A missing
location requests actual input once and tags the previous value unresolved,
rather than claiming a stale corridor penalty is current or guessing a room.
The legacy Claustrophobia and Encumbrance atoms share `skill_stat_modifier` in
separate rule contexts. The procedure therefore uses a dedicated
`claustrophobia_skill_stat_modifier`, setting the same directly cited source
value and retaining the existing rule as a provenance dependency. Its complete
applied trace is the procedure itself; it does not execute the legacy atom
against combined actor state. Existing rule IDs/fields/values are retained.

`issue.sanity.claustrophobia_stat_scope` records unspecified individual target,
pool/derived-stat and floor application for all skills and stats. The full
printed generic contribution is preserved; no roster is invented or actual
HP/Energy/Mana/total stats permanently reduced. Individual-scope requests with
unresolved context keep that question, while all individual mutations remain
separate from this checkpoint.

Rendered PDF42 / printed40 confirms The Well's asylum prohibition and five
fought-and-survived corridor battles for its own cure/Tunnel Fighter reward.
Composition reuses its existing quest-local rule and actual `claustrophobia`
flag; the generic procedure never counts battles, permits asylum treatment,
cures a disorder or grants a reward. Five supplied battles alone do not create
a global cure. This adapter check does not complete The Well's quest lifecycle.

The 25 derived regressions assert complete procedure/applied-rule traces,
light/dark, repeated tests, actual condition/room transitions, missing locations,
owned coexistence with other conditions and Encumbrance, individual-scope bounds,
quest-local cure composition and actual diagnosis handoffs without automatic
numeric application or another Sanity/count reset. Six Mental Conditions rows
now have bounded lifecycle procedures; Hate, Arachnophobia and Irrational Fear
remain pending, so the full table procedure component remains mapped. Inventory
remains 86 unique headings, and independent review is pending. Next bounded unit:
Arachnophobia and Irrational Fear encounter applicability/selection, PDF57 /
printed55. Package F and comprehensive Phases 7–12 remain unfinished.

Contextual mental modifiers final gate (1 October): 418 canonical files validate;
2999 tests pass (two optional provider skips). Coverage generation, lint and
`git diff --check` pass. Stored procedures: 75. Coverage remains 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory is 121 records, 113 unresolved/eight resolved.
The 25 derived regressions cover complete traces, all-Resolve-Test scope,
owned fixed/contextual contributions, actual removal/room transitions,
unresolved location, other conditions/Encumbrance coexistence, individual-scope
bounds, The Well quest-local cure composition and actual diagnosis handoffs.
Next bounded unit: Arachnophobia and Irrational Fear encounter applicability/
selection, PDF57 / printed55. Package F and Phases 7–12 remain unfinished.

## Arachnophobia and Irrational Fear encounter checkpoints — 1 October

Rendered PDF57 / printed55 rows 6 and 8 support two bounded procedures.
Arachnophobia records a known actual spider encounter’s owned Terror contribution;
non-spider scope remains unresolved under the existing all-encounters issue.
Unknown taxonomy requests supplied classification once. Irrational Fear persists
one actual randomized result among the five printed factions per diagnosis, then
classifies each actual monster using supplied membership in that persisted faction.
The book supplies no randomization method or weights; no distribution is invented.

Dedicated contributions preserve natural Fear/Terror and other active conditions.
Classification and reaction-request markers have separate ownership. Replays cannot
change consumed classification or faction selection. Another monster in the same
reaction context does not create an extra test. Known raw contributions hand off
only with supplied source-grounded reaction scope; these procedures do not roll
tests, reduce Sanity, spend AP, cause flight, or mutate HP. Reaction timing, combined
causes, immunity and resolver scope remain explicitly unresolved. Both supporting
legacy atoms retain their IDs and semantics; dependencies cite them without
executing their shared global output fields.

Twenty-three derived regressions cover printed factions, invalid/missing selection,
unknown classification, actual input resumption, replay, inactive/wrong-owner
contexts, later diagnoses, same-context monsters and unchanged numerical state.
The acquisition helper binds both procedure IDs and initializes only the newly
accepted condition’s markers. The whole Mental conditions procedure component
remains mapped: Hate and its source-linked talent lifecycle remain pending.

Next bounded unit: Hate diagnosis selection and its source-linked talent effect.
Package F and Phases 7–12 remain unfinished; independent review remains pending.

Encounter condition final gate (1 October): 419 canonical files validate; 3022 tests pass, with two optional provider skips. Coverage regenerated at 709 rows/sections, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 77 procedures and 123 review records (115 unresolved, eight resolved). No commits made.

## Hate diagnosis and Talent checkpoints — 1 October

Rendered PDF57 / printed55 row 1 fixes the diagnosis target to the type of enemy
last fought and requires its presence in the Bestiary Monster List. Rendered
PDF178 / printed176 supplies the linked Hate Talent: +5 CS against hated enemies,
-5 parry/dodge when struck by them, one chosen enemy, the Goblin name-word
example, and repeat acquisition for different enemies. The diagnosis substitutes
its fixed last-fought target for ordinary Talent choice.

`procedure.hate` snapshots the actual onset type once, requests missing enemy or
Monster List evidence once, and grants the source Talent once only with supplied
eligibility and reconciled ownership. A later fight cannot replace the snapshot.
An empty/ineligible target or overlapping existing Talent remains unresolved;
no alternative, reroll, external creature list or duplicate stacking is invented.
The acquisition helper initializes the new diagnosis markers and hands off to
this procedure. Handoff itself applies no check modifier.

`procedure.hate_talent` records dedicated contributions for actual owned attack,
parry or dodge checks, preserving shared/base stats and other modifiers. Fixed
contributions recompute without accumulating on replay. Matching and check timing
are supplied; unknown input preserves the prior contribution with an unresolved
applicability tag and one input request. The Goblin example does not establish a
general taxonomy or name parser. The supporting stable rule IDs remain unchanged
and are provenance dependencies rather than execution into shared modifier slots.

Condition treatment does not automatically erase the granted Talent: the source
does not settle that relationship. `issue.sanity.hate_target_scope` records these
remaining boundaries. All nine distinct table conditions now have bounded
procedures, but this does not close whole-table lifecycle coverage or independent
review. Treatment and the surrounding Psychology lifecycle remain pending.

Next bounded source unit: Reducing Insanity and its settlement treatment links.
Package F and Phases 7–12 remain unfinished.

Hate final gate (1 October): 420 canonical files validate; 3051 tests pass with two optional provider skips. The 29 new derived regressions cover onset snapshot, pending input, source eligibility, duplicate grant protection, applicability, check contributions and unchanged shared/base state. Coverage regenerated at 709 section/coverage rows, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 79 procedures and 124 review records (116 unresolved, eight resolved). No commits made.

## Sanity recovery and paid indulgence — 1 October

Rendered PDF55 / printed53, Reducing Insanity, or Increasing Sanity, and PDF147 /
printed145, Tending to those Memories, support `procedure.sanity_recovery`.
Ordinary between-quest rest restores actual 1d3 up to 8 in the uncontested
ordinary-capacity/no-active-condition context. At least one actual inn night
restores 1d3 per hero; the number of nights is not a recovery multiplier.
An actual source-grounded indulgence costs actual 1d3 times 100 c and restores
actual 1d6, with payment and recovery applied together exactly once when
affordable and within the uncontested range. Dungeon Rest, HP/point recovery,
condition count and Asylum attempt accounting remain separate.

The hero/actual-completed-rest marker is shared between inn and between-quest
routes for the same occurrence. Overlap and per-night/per-stay frequency are
not silently resolved: actual eligible occasion scope is supplied, and unknown
scope requests input once. Paid occasions have a separate marker and unresolved
repetition scope. Neither requesting a service nor an interrupted/uncompleted
stay can create recovery. A missing roll requests actual input without guessing
a result. Fresh markers represent distinct source-grounded occasions, not route
switches or repeated requests.

Active conditions preserve `issue.phase4.sanity_maximum` without charging or
guessing a cap. Modified capacities, paid overflow and repetition/overlap
boundaries remain under `issue.sanity.recovery_scope`. Herbs, potions, prayers,
spells and Talents are qualitative source dependencies here, with no invented
unnamed value. The two recovery headings have extracted procedure components
within this scope; this does not extract the Asylum treatment lifecycle.

Thirty-nine derived regressions assert all dice ranges, full applied-rule traces,
ordinary cap boundaries, inn qualification, replay/route sharing, legal distinct
occasions, input resumption, interrupted/inapplicable contexts, affordability,
paid numerical atomicity, composition and unresolved branches. Source examples
and independent review remain separate later passes.

Next bounded unit: Treat Mental Conditions, including the owned disorder,
between-quest attempt limit, five-day completion, and effect-removal handoff.
Package F and Phases 7–12 remain unfinished.

Sanity recovery final gate (1 October): 421 canonical files validate; 3090 tests pass with two optional provider skips. Coverage regenerated at 709 section/coverage rows, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 80 procedures and 125 review records (117 unresolved, eight resolved). No commits made.

## Selected disorder and completed Asylum treatment — 1 October

Rendered PDF147 / printed145, Treat Mental Conditions, defines the 1000 c
attempt, one disorder per hero between quests, d6 success on 1–5 and five-day
duration. Existing settlement service/activity procedures own numerical payment,
activity completion, opportunity consumption and the successful count decrement.
`procedure.mental_condition_treatment` snapshots the supplied actual eligible
selected disorder and its active count before service, then consumes the actual
same-attempt completed accounting result once. Requests do not pay or cure.

Successful completed results synchronize the Sanity count to the service’s
already-reduced count, clear only the snapshotted disorder’s active flag, and
request its remaining effect cleanup. Rendered PDF57 / printed55 provides the
condition identities linked to those flags. Failures retain the disorder and
consume the result/opportunity without refund or a fresh roll. Target replay,
changed rolls, new days/visits and another hero cannot create another cure.
Incomplete five-day services, unsupplied results, unknown eligibility and
inconsistent counts do not change the disorder. Quest-specific curability
exceptions remain supplied scope; ordinary Asylum does not cure every trait.

`issue.sanity.mental_treatment_ownership` records roster/selection/accounting
reconciliation and unresolved history, capacity and source-specific effect
restoration. Cure does not erase diagnosis history, increase Sanity/maximum,
restore Depression capacity or remove a granted Hate Talent automatically.
The active flag’s removal is known; numerical/lasting-effect cleanup remains
pending and its handoff is not execution. Forty-two derived regressions
cover all successful/failing die faces, five-day boundary, ownership, missing
inputs, mismatched counts, all nine disorder flags, replay and actual composed
service accounting with full applied traces.

Next bounded unit: reconcile condition-effect cleanup and Psychology procedure
component dispositions, then continue quest acceptance/progression/completion.
Package F and Phases 7–12 remain unfinished; no independent review is implied.

Treatment selection, service and result input handoffs use independent once-only markers. The actual completed d6 result is snapshotted before delayed count reconciliation, so changed replay input cannot substitute a success for a captured failure. Derived regressions cover resumed selection/accounting handoff, missing-roll handoff after service, and failure-roll preservation.

Mental treatment final gate (1 October): 422 canonical files validate; 3132 tests pass with two optional provider skips. The 42 derived treatment regressions include actual composed settlement accounting and all disorder/result branches. Coverage regenerated at 709 section/coverage rows, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 81 procedures and 126 review records (118 unresolved, eight resolved). No commits made.

## Mental-condition cleanup source reconciliation — 1 October

Rendered PDF57/printed55 and PDF147/printed145 support the actual successful
cure’s owned current-contribution cleanup. `procedure.mental_condition_cleanup`
clears only Fear of the Dark, Claustrophobia, Arachnophobia, Irrational Fear or
Jumpy current contributions/reports after the actual snapshotted disorder flag
has been removed. Its marker prevents a replay from erasing a later contribution.
Past Threat/events, natural Fear/Terror, other modifiers, base stats, Sanity/count
and payment remain untouched. Treatment now binds this concrete cleanup handoff;
invocation itself still performs no callback.

The Hate Talent, Depression capacity and cure precedence over Acute Stress’s
current-quest duration or Trauma’s dungeon-departure duration have no settled
restoration rule. `issue.sanity.cure_lasting_effects` retains these explicit
dispositions without automatic deletion, numeric undo or invented precedence.
All nine table conditions and the full trigger table now have bounded procedure
evidence; the Mental conditions table procedure component is extracted, with
source ambiguities retained and no independent-review claim. Package F remains
open for quest and estate lifecycle and broader reconciliation.

Eighteen derived regressions cover every cleanup category, unresolved lasting
effects, cure/ownership guards, replay and preserved other state. Next bounded
unit: quest acceptance and its instance/party ownership checkpoints.

Condition cleanup final gate (1 October): 423 canonical files validate; 3150 tests pass with two optional provider skips. Coverage regenerated at 709 section/coverage rows, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 82 procedures and 127 review records (119 unresolved, eight resolved). No commits made.

## Quest acceptance and immutable occurrence ownership — 1 October

Rendered PDF132/printed130 and PDF133/printed131 support
`procedure.quest_acceptance`. Existing settlement arrival/selector procedures
own availability rolls, Luck prohibition, rejection limits and actual party
acceptance. This checkpoint records the supplied canonical chosen quest and
distinct actual occurrence identity, start settlement, main/side slot and
source-grounded fixed/random site once. Settlement keys follow the existing
catalogue/arrival inputs, including `outpost` for The Outpost restriction.

A side offer may accompany another quest in a separate occurrence record; an
accepted main record is not overwritten. Fresh status initialization applies
only to the actual new record, preserving previous instance completion/payment
and hero between-quest limits. Changed strings, another visit or replay cannot
replace the accepted provenance or reset its consumed statuses. Eligibility
includes supplied actual canonical identity existence and source-specific repeat
policy, rather than a universal repeatability rule. Ancient Lands offers are
guarded to The Outpost. Departure, progression, abandonment, completion and
rewards remain separately source-owned.

Missing actual choice/scope and site use independent handoff markers. Site
resolution requests the actual chosen fixed location or required roll/map
result; the settlement dice table is a separate provenance dependency rather
than a forced reroll for fixed-site quests. Empty instance site records no
acceptance-site prescription when none is required; no location is invented.
`issue.quest.acceptance_scope` retains unspecified generic eligibility/identity
and repeat scope. Twenty-two derived regressions cover accepted provenance,
replay, legal distinct records, side/main coexistence, Ancient Lands restriction,
missing-input resumption, fixed/no-site cases, invalid inputs and actual composed
settlement acceptance with full trace.

Next bounded unit: actual quest departure and quest-instance progression, then
source-specific completion/abandonment and reward gates. Package F and
Phases 7–12 remain unfinished; independent review remains pending.

Quest acceptance final gate (1 October): 424 canonical files validate; 3172 tests pass with two optional provider skips. The 22 acceptance regressions include actual composed settlement acceptance and guarded main/side provenance. Coverage regenerated at 709 section/coverage rows, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 83 procedures and 128 review records (120 unresolved, eight resolved). No commits made.

## Actual quest departure and heading loopback — 1 October

Rendered PDF133/printed131 includes Leaving on a Quest: depart early in the
morning and perform no other settlement activities that day. The heading was
absent as a separate source-map node. Added stable
`section.settlements.leaving_on_a_quest` and its matching coverage row; the
procedure component is extracted, rule component mapped and independent review
pending. This is a source-map loopback, not an independently reviewed omission
closure. The lifecycle inventory now contains 87 unique headings.

`procedure.quest_departure` consumes only an actual matching accepted
party/occurrence/day departure from the existing settlement activity and lodging
accounting. It persists the departure day/settlement once, preserving immutable
accepted origin/site, completed/payment state, hero resources and between-quest
attempt limits. Requests hand off once without departing. Inconsistent recorded
days remain unresolved under `issue.quest.departure_scope`. Main and accompanying
side records can share the actual party departure without repeated accounting.
Departure does not imply quest-site arrival, objective success or completion.

Fifteen derived regressions cover matching result, replay, owned/accepted/status
guards, missing accounting/scope resumption, stale day, main/side coexistence,
unchanged accepted origin and composed actual settlement departure, including
rejection while occupied activities are incomplete. Next bounded unit: Slaying
the Fiend source-specific progression, defeat-gated aftermath and loot ownership,
followed by Closing the Portal. Generic abandonment remains source-bound rather
than invented. Package F and Phases 7–12 remain unfinished.

Quest departure final gate (1 October): 425 canonical files validate; 3187 tests pass with two optional provider skips. Coverage regenerated at 710 section/coverage rows, 346/675 canonical sections extracted and zero independently reviewed. The inventory has 87 unique headings after the rendered departure-heading loopback. Lint and whitespace checks pass. There are 84 procedures and 129 review records (121 unresolved, eight resolved). No commits made.

## Slaying the Fiend ordered occurrence — 1 October

Rendered PDF256/printed254 supports `procedure.slaying_fiend`. Its source-owned
setup preserves Random location, eight corridors/eight rooms, Beast encounters,
the Special Rules dash, Reward None and Molgor’s printed equipment/named
abilities. Initial Threat is actual d4+2, minimum equal to the actual start and
maximum20, initialized once without replay reseeding. Canonical actor/statistics
and structured source tables remain dependencies; unavailable ability mechanics
are not replaced with hero perk costs or invented Bestiary details.

At actual objective entry, snapshot the initial d6 wound-table selection before
a secondary result can be delayed. Apply only its valid branch once to initial
45 HP. Branch6’s fixed1 requires no additional die. A conflicting supplied amount
or out-of-branch result is unresolved rather than accepted; source wound/placement
requests alone cannot report readiness. Actual hero d3/Molgor d6 placement occurs
once, preserving door/idol/direction distinctions. Both preparations and resolved
initial Threat precede battle readiness, which is not an executed battle.

Actual supplied fiend-down outcome unlocks the gold find and two unlocked,
untrapped objective chests once. Request their actual Treasure Table outcomes
once; invocation does not collect contents, credit unspecified gold, mark a
generic quest complete or pay a promised settlement reward. Reward None remains
distinct from loot. `issue.quest.molgor_gold_quantity` and
`issue.quest.fiend_lifecycle_scope` retain source/dependency boundaries. Actual
battle HP/result, chest collection and unsupported generic abandonment/completion
remain separately owned. A fresh source-eligible occurrence has independent
markers; changing input on the existing occurrence cannot reseed them.

Thirty derived regressions cover all initial Threat faces, every legal prior
wound amount across all six branches, fixed1, selection resumption, invalid
amounts, placement boundaries, missing inputs, wrong quest/owner, replay and
composed defeat/aftermath trace with unchanged resources. Procedure component
extracted within this unit; independent review remains pending. Next bounded
unit: Closing the Portal ritual progression/interruption/spawn and distinct
closure, remaining-demon defeat, loot and outside-payment gates. Package F and
Phases 7–12 remain unfinished.

Slaying the Fiend uses distinct supplied d6/secondary-result inputs and owned working values for legacy rule execution. The fixed1 branch sets owned resolved state without changing the supplied-input flag. The canonical validator verifies these field roles; input preservation is asserted in the fixed-row regression.

Slaying the Fiend lifecycle final gate (1 October): 426 canonical files validate; 3217 tests pass with two optional provider skips. The 30 derived lifecycle regressions cover initial Threat, every wound branch/result, placement, replay/input resumption, scope and defeat-gated aftermath. Coverage regenerated at 710 section/coverage rows, 346/675 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 85 procedures and 130 review records (122 unresolved, eight resolved). No commits made.

Closing the Portal bounded reading checkpoint (1 October): `procedure.closing_portal_reading_attempt` cites visually inspected PDF257/printed255. It snapshots initial actual d6+1 duration once for an owned reader/quest occurrence, requires supplied eligibility and stationary objective-room presence, and resets progress/stops reading on every printed interruption or movement. Replay cannot restart or reseed an attempt. The existing ritual-boundaries issue retains undefined eligibility and restart dice policy. Procedure coverage remains mapped: actual restart, turn progression/closure, spawning, initial groups/Threat, defeat/chests and outside reward remain next units. No independent review; Package F and Phases 7–12 remain unfinished.

Closing the Portal reading checkpoint final gate (1 October): 427 canonical files validate; 3236 tests pass with two optional provider skips, including 19 new derived reading/interruption regressions. Coverage regenerated at 710 rows; extraction/review section totals are unchanged. All lint and whitespace checks pass. There are now 86 procedures; review dispositions are unchanged. No commits made. Next bounded work remains actual ritual restart and turn progression/closure, followed by source-scoped demon spawning and aftermath.

Closing the Portal reading progression (1 October): the same `procedure.closing_portal_reading_attempt` now handles actual new start-over events with supplied 2..7 duration context, preserving unresolved retain/reroll policy. It counts actual completed chronological reading turns once, consumes interrupted completed turns without progress, checks all interruptions before advancement and closes only at the required uninterrupted duration. Closure stops reading and requires killing all remaining demons; it does not spawn, collect or pay. Fifty source-derived regressions include every duration, completion-turn interruption, actual restart, chronological/replay guards, unresolved context and applied source-rule traces. Visually inspected PDF257/printed255. Procedure coverage stays mapped pending initial Threat/groups, encounter replacement, spawning and aftermath/payment. No independent review; Package F and Phases 7–12 remain unfinished.

Closing the Portal reading progression final gate (1 October): 427 canonical files validate; 3267 tests pass with two optional provider skips. The expanded reading fixture contains 50 tests (31 added this unit). Coverage regenerated at 710 rows, with this quest procedure component corrected from not_started to mapped to reflect bounded work; the 18 source-map/report tests pass again after that correction. Whole-suite, lint and whitespace gates pass. There are 86 procedures and 130 review records (122 unresolved, eight resolved); zero independently reviewed sections. No commits made. Next source unit: Closing the Portal initial Threat/objective groups and encounter replacement, then schedule-supplied single-demon spawning and separate defeat/treasure/outside payment.

Closing the Portal preparation and groups (1 October): `procedure.closing_portal_preparation` and `procedure.closing_portal_demon_group` cite visually inspected PDF257/printed255. Quest setup preserves Silver City,8+8 tiles, supplied ritual scroll and advertised300c without crediting coins. Initial actual d6 Threat initializes once, minimum=start and maximum20. Actual objective entry preserves portal/hero geometry and separately requests two initial groups plus actual random placement once. The group procedure accepts actual first/second initial ownership or a multiple10 replacement encounter, snapshots type before delayed quantity, and checks d6/d3 bounds before selected source-rule execution. Each actual group owns separate state; later one-demon spawns cannot use group quantities. Source statistics/Cursed Weapons, actual coordinate placement and battle remain explicit dependencies. Reading lifecycle stays separate. Procedure coverage remains mapped pending schedule-supplied single spawns and distinct final-demon/treasure/outside-payment gates. No independent review; Package F and Phases 7–12 remain unfinished.

Closing the Portal preparation/groups final gate (1 October): 428 canonical files validate; 3336 tests pass with two optional provider skips, including 69 new preparation/group regressions. Coverage regenerated at 710 rows; this quest remains procedure-mapped pending spawning/aftermath/payment, and section extraction/review totals are unchanged. All lint and whitespace gates pass. There are 88 procedures and 130 review records (122 unresolved, eight resolved). No commits made. Next source unit: actual schedule-supplied single-demon spawning, then final-demon/treasure and outside-payment gates.

Closing the Portal spawning and aftermath (1 October): visually inspected PDF257/printed255 and PDF258/printed256. `procedure.closing_portal_single_spawn` requires actual supplied every-other-turn schedule and event ordering, consumes each chronological emergence once, resolves type-only d6 and ignores group quantities. Pending already-emerged type may resolve after closure without another spawn; later events cannot overwrite pending earlier ones. `procedure.closing_portal_aftermath` separately gates two unlocked/untrapped objective-chest handoffs on actual closure and final-demon death, and credits300c once to each actual owned hero back outside. Twenty-seven derived regressions cover all six types, pending resolution/replay/closed/unknown order, final-demon/loot/payment guards, independent hero and party markers, and composed reading-closure/treasure/reward trace. Together with preparation/groups and reading, this source-local lifecycle component is extracted within supplied-context boundaries. Remaining source dispositions: first spawn phase, same-turn order, restart duration/eligibility, actual random coordinates and unavailable statistics/Cursed Weapons/battle, actual chest content/collection, missing/dead/replacement hero entitlement and unspecified generic completion/abandonment. The latter aftermath boundary is recorded in `issue.quest.portal_aftermath_scope`; existing ritual ambiguity remains unresolved. No independent review; Package F and Phases 7–12 remain unfinished. Next quest lifecycle source unit: Returning the Relic (PDF255).

Closing the Portal bounded lifecycle final gate (1 October): 429 canonical files validate; 3363 tests pass with two optional provider skips, including27 new spawn/aftermath tests. Three composed-fixture state reads were narrowed explicitly to booleans for strict TypeScript; all27 affected tests and lint pass after that repair. Coverage regenerated at710 rows; the quest lifecycle component is now extracted within its explicit source/supplied-context boundaries. Section extraction totals remain346/675 and independently reviewed remains0. There are90 procedures and131 review records (123 unresolved, eight resolved). All validation, coverage, test, lint and whitespace gates pass. No commits made. Next bounded Package F source unit: Returning the Relic, PDF255/printed253.

Returning the Relic lifecycle (1 October): `procedure.returning_relic` cites visually inspected PDF255/printed253. It preserves Random/8+8 setup, actual initial d4+1 Threat/minimum=start/max20 once, quest-owned Luck nullification until actual stone return without changing numeric Luck, and actual distinct Scenario8–10 handoffs. Actual objective entry records short-side heroes/far-end statue and requests two encounters/random placement once. Refit requires all enemies dead, actual hero in front, actual distinct turn and supplied unresolved party/hero opportunity scope. Pending actual DEX result cannot be replaced by a later turn or mismatched owner; success returns stone and ends only its nullification, failure consumes opportunity and raises Threat1 once below20. At maximum20 raw+1 remains pending source accounting. Actual home arrival after return credits300c once per actual owned hero. Thirty-two derived regressions cover setup faces, all Scenario faces, objective handoff, failed/successful/pending/replayed/mismatched attempts, maximum boundary, unchanged Luck/other curses and independent home payments. `issue.quest.relic_lifecycle_scope` preserves scope, maximum, failed/abandoned-quest curse expiry, generic completion and hero-entitlement ambiguities. No source-local chests/XP invented; no independent review. Lifecycle component extracted within those bounded source/supplied-context dispositions; Package F and Phases 7–12 remain unfinished. Next source unit: Retrieving the Family Heirloom, PDF259–260.

Returning the Relic lifecycle final gate (1 October):430 canonical files validate;3395 tests pass with two optional provider skips, including32 new source-derived lifecycle regressions. Coverage regenerated at710 rows; this quest procedure component is extracted within explicit supplied-context/source-boundary dispositions, with no independent review. There are91 procedures and132 review records (124 unresolved, eight resolved). All validation, coverage, full-suite, lint and whitespace gates pass. No commits made. Next Package F source unit: Retrieving the Family Heirloom, PDF259–260/printed257–258.

Retrieving the Family Heirloom lifecycle (3 October): `procedure.family_heirloom` cites visually inspected PDF259/printed257 and PDF260/printed258. It preserves settlement/8+8/R1B-8B/Undead setup, quest-local dead-Brotherhood corpse-search exception and once-only actual d4+1 Threat/minimum=start/max18. Each actual Scenario8–10 event hands off Threat resolution once. Actual objective entry initializes six tombs/no enemies/current positions and the shuffled3Black/1Red/2Dressed pool once. Each actual unopened tomb requires exactly2heroes and a complete turn, followed by one actual unused card. Pending draws block a second opening; supplied classification resolves category once, consumes that actual card and decrements its printed category count atomically. Black records corpse/nothing else, Red retrieves sword, and Dressed places mummy next to tomb and hands off combat without invented statistics or outcome. A later tomb clears only current draw reports, preserving existing mummy/combat state. Actual surface return plus sword presentation transfers sword and credits300c once per actual owned hero. Thirty-nine derived regressions cover all Threat/Scenario faces, work guards, all categories, all six Red positions in a finite pool, pending/unclassified/mismatched draws, duplicate-card/tomb replay, category exhaustion, current-versus-past reports and independent surface payments. Existing card-category ambiguity remains unresolved; `issue.quest.heirloom_lifecycle_scope` records missing combat/escape/entitlement/completion/abandonment boundaries. Canonical YAML uses simple source anchors and explicit branch guards under unchanged parser protections; no numeric mummy content, extra chests or XP invented. Procedure component extracted within this bounded source/supplied-context scope; independent review, Package F and comprehensive Phases7–12 remain unfinished. Next quest lifecycle source unit: Stopping the Necromancer, PDF261/printed259.

Retrieving the Family Heirloom lifecycle final gate (3 October):431 canonical files validate;3485 tests pass with two optional provider skips, including39 Family Heirloom lifecycle regressions and the current retrieval/ask suites. Coverage regenerated at710 rows; procedure component is extracted within the documented source/supplied-context boundaries, with zero independently reviewed sections. Current review inventory is133 records (124 unresolved, nine resolved); there are92 procedures. Full root lint and whitespace checks pass after narrowly excluding the two tool-managed Intent hooks from ESLint and those hooks plus `.claude/settings.json` from Prettier. Hook/settings contents are unchanged; consumer app checks remain separate. No commits made. Next Package F source unit: Stopping the Necromancer, PDF261/printed259. Comprehensive Phases7–12 and Package F remain unfinished.

## Stopping the Necromancer owned lifecycle — 3 October

Rendered PDF261 / source-map printed259 reconciles `procedure.stopping_necromancer`.
Actual party/occurrence setup and initial d6/minimum=start/maximum20 are once-only.
Actual objective entry places Ragnalf, six longsword Zombies and short-side heroes
once. Zombie/statistics/spell/poison outcomes are explicit handoffs. Hero room
contributions preserve separate unrelated modifiers and never accumulate. Actual
chronological To Hit90+ owns the next-action requirement; pending getting-up DEX
belongs to that hero and attempt, and failure preserves fallen status. Further
retry and timing are not defined by this source. Ragnalf's actual death consumes
zombie-death/floor-movement consequences once without inventing modifier expiry.
Battle/XP200/T4 resolution stays a handoff; each actual eligible returned hero
receives300c once in a separate hero/occurrence context. Generic completion and
entitlement for absent/dead heroes are not inferred. Review issue
`issue.quest.necromancer_lifecycle_scope` preserves these source questions.

Twenty-nine derived regressions cover initial Threat faces, incomplete/wrong
ownership, entry replay, separate modifier contributions, To Hit89/90/100,
failed/successful and delayed DEX, nonactual actions, actual death traces and
independent hero payment/replay. Procedure component extracted within this bounded
unit. Package F remains open; independent review and comprehensive Phases7–12 remain.

Stopping the Necromancer fresh unit gate (3 October): 432 canonical files validate;
3514 tests pass, two optional provider tests skip; lint and whitespace checks pass.
Coverage regenerated from YAML at710 rows; no independent review or commits.

## Tomb Raiders owned lifecycle — 3 October

Rendered PDF262 / source-map printed260 reconciles `procedure.tomb_raiders`.
Actual occurrence setup preserves White38, seven corridors/five rooms/R1B-8B,
Undead, any loot found and initial d6/minimum=start/maximum20 once. Actual room
entry preserves hero positions once. Each distinct actual tomb has independent
opening state, requiring two heroes working together and a complete turn; its
standard sarcophagus findings are a handoff, never invented contents or cash.
The source supplies no tomb count and no special completion/payment condition;
the surface aftermath is narrative. A separate actual Threat-event context
snapshots current Threat before comparing the supplied roll. At least one hero
in the objective room and roll above the snapshot requests a Wandering Monster
and Threat increase once, including20. The source supplies neither increase
amount nor precedence over ordinary20; `issue.quest.tomb_raiders_threat_boundary`
retains both. No guessed arithmetic is applied. Other results request ordinary
Threat resolution without executing it. Distinct quest occurrence, visit, tomb
and Threat-event contexts remain caller-owned and cannot share consumed markers.

Twenty-seven derived regressions cover initial die faces, incomplete inputs,
entry/opening replay, actual two-hero work, independent tombs and standard
sarcophagus traces, Threat below/equal/above including20, room occupancy, wrong
ownership, snapshots and fresh events. This closes the bounded Great Crypt quest
procedure units; Package F acceptance remains open.

## Test-owned Package F acceptance checklist — 3 October

`tests/fixtures/acceptance/package-f.json` accounts for all87 starting headings.
It records explicit canonical candidates, bounded implemented procedure evidence,
source issue IDs and remaining work. Pending catalogue-only headings remain
pending. `tests/schema/lifecycle-acceptance.test.ts` checks heading bijection and
all section/object/review/file references. The final-acceptance check rejects every
pending disposition and every nonempty implementation gap, even if relabelled as
source uncertainty. The manifest stays open until the full inventory, Phase5 exit
criteria and Phase6 candidate loops are reconciled; passing its structural tests
is not Package F acceptance. Coverage and independent-review flags remain distinct.

Tomb Raiders/acceptance-manifest fresh unit gate (3 October): 433 canonical files
validate; 3546 tests pass, two optional provider tests skip. Lint and whitespace
checks pass; coverage regenerated from YAML at710 rows, zero independently
reviewed sections. No commits made.

## Shared resumable dungeon quest lifecycle — 3 October

Rendered PDF88 / printed86 now supplies three atomic `core.quest_lifecycle.*`
rules, `procedure.quest_dungeon_lifecycle` and structural
`state_machine.quest_dungeon`. The procedure composes existing immutable party
acceptance and actual initial departure. Initial entry, abandonment, pending
return, actual repopulation, task accomplishment and actual exit have explicit
owned guards. Abandonment requires the recorded actual layout; a delayed
recording cannot replace the accepted occurrence, party or layout. Returning
binds a distinct chronological visit to the same saved layout and requests
repopulation once; only its supplied completed result resumes. Fresh locked-door
and encounter checks remain per-visit requirements. Nothing reshuffles the saved
layout, resets source-specific progress or rewards, or creates a newly accepted
quest. Later abandonment/return uses a new visit; a legal repeat owns a new
accepted occurrence. Actual source task achievement permits leaving without
retracing; permission is distinct from actual exit and payment. This source unit
is dungeon-scoped, with wilderness/personal quest policies separately pending.

Rendered PDF222 / printed220 supplies `procedure.quest_reading_and_events`.
Actual objective reach and actual completion govern reading boundaries.
Each actual aftermath finding owns a separate off-table/no-trap/no-lock handoff;
request does not collect or credit treasure. Actual chronological Threat changes
trigger a Wandering Monster only on upward arrival at exactXX; decreasing toXX
fails, while decreasing below then increasing back triggers again. Placement
never reduces Threat. `invoke` remains a handoff and the structural machine does
not execute resources. Thirty-nine derived regressions cover illegal ownership,
incomplete/replayed actions, pending return resumption, second return versus
fresh repeat, separate completion/exit, reading, findings and repeated thresholds.
`issue.quest.shared_lifecycle_boundaries` retains source-specific reset boundaries.

The manifest now reconciles23 implemented headings and3 child headings covered by
shared models;61 headings retain explicit pending work. Existing bounded condition
unit evidence corrects stale damage/Wounded and other completed inventory rows.
Full remaining quest, estate, travel/settlement rest reconciliation, original
candidate-loop audit and Phase5/6 exit acceptance are still required. These gaps
are not classified as source ambiguities or deferred to independent review.

Shared dungeon/reading lifecycle fresh unit gate (3 October): 437 canonical files
validate; 3585 tests pass, two optional provider tests skip. Lint and whitespace
checks pass. Coverage regenerated at710 rows; zero independently reviewed sections.
No commits made.

## First Blood introductory encounter — 3 October

Rendered PDF223 / printed221 reconciles `procedure.first_blood`. Actual occurrence
setup preserves the printed four adversaries/equipment, four open-ground tiles,
adjacent centre heroes, sight/shooting10 and no Scenario die once. Each actual
adversary separately persists randomized edge and d10 distance; source geometry
and unavailable corresponding monster/equipment card values are supplied.
Only all four actual placements plus confirmed cards and the actual first turn
request the+2 bandit initiative once. A later-turn report is zero; unrelated token
contributions remain separate. Actual all-bandits-dead requests no-further-issues
settlement arrival once, and only a matching completed arrival/event result
closes the handoff. Invocation does not execute settlement accounting or credit
cash/XP/treasure. No repeat eligibility is inferred for this introductory quest.

Twenty-nine derived regressions cover all ten distances, four independent actor
placements, wrong/incomplete ownership, setup/placement/initiative replay,
first/later-turn separation and actual death/request/completed-arrival gates.
The manifest now accounts for24 implemented headings,3 shared-model dispositions
and60 pending headings. Package F and Phase6 Batch7 remain open; Phase5 exit
reconciliation and comprehensive Phases7–12 also remain required.

First Blood fresh unit gate (3 October): 438 canonical files validate; 3614 tests
pass, two optional provider tests skip. Lint and whitespace checks pass; coverage
regenerated at710 rows with zero independently reviewed sections. No commits.

## Narrative disposition and delayed-action refinement — 3 October

Rendered PDF166 / source-map printed164 confirms The Dark Gods is illustration
and setting prose about forbidden worship and Kheros; it defines no lifecycle
trigger, action, cost or outcome. The manifest records `nonprocedural` and only
its procedure coverage becomes `not_applicable`; no lore extraction or independent
review is claimed. The checklist now has24 implemented,3 shared-model,
1 nonprocedural and59 pending dispositions.

Stopping the Necromancer's pending DEX result now restores the owned working
spent-action report from its already accepted attempt, rather than depending on
a later supplied action flag. A delayed success cannot consume a different action
or rewrite its inputs. The additional source-derived regression verifies this
composition and applied-rule trace; the lifecycle fixture now has30 tests.

Current continuation final gate (3 October):438 canonical files validate;3615 tests
pass with2 optional provider skips, including130 added derived/acceptance checks.
`npm run validate`, `npm test`, `npm run lint` and `git diff --check` pass.
Coverage regenerated from YAML at710 rows,675 canonical sections and35 redirects;
346 sections extracted, zero independently reviewed. Inventory:1533 rules,669
entities,213 tables,97 procedures,2 structural state machines and475 executable
YAML fixtures. The canonical review inventory has135 records (126 unresolved,
9 resolved). No consumer changes, calibration or commits were made by this work.
Source/manifest and supplemental review-document changes appearing concurrently
were preserved and are not this continuation's extraction evidence.

Package F remains open with59 pending heading dispositions. The next source units
are quest selectors/campaign progression, followed by remaining individual and
Ancient Lands/Side Quests; estate lifecycle must precede closing estate-dependent
personal quests. Travel/settlement rest reconciliation, original candidate-loop
audit and Phase5/6 exit checks remain required. The requested comprehensive
Phases0–6 completion handoff has not been reached.

## Closure reconciliation — original Phase 6 candidate: Opening a Portcullis

Rendered PDF103 / mapped printed101 revealed an original candidate with a mapped
heading but no procedure. `procedure.open_portcullis` now records a physical gate
owned by party and dungeon visit. An adjacent hero spends1AP for an actual STR
attempt, snapshotting STR plus10 for the other same-side adjacent hero and up to
two opposite-side helpers. Pending actor/action identities prevent replacement,
wrong-result resolution and repeated cost. Existing ordinary/automatic-failure
check rules resolve the actual roll. Success opens the gate; failure adds1Threat
once and allows another paid attempt. Twenty-five derived regressions cover all
helper configurations, exact success, delayed inputs, wrong ownership, replay,
insufficient AP, unavailable adjacency and retries. No independent review.

### Official short-rest morale resolution (3 October 2026)

Changelog 2.21 entry 39 (physical PDF page 4) resolves the historical +1/+2 conflict in favor of +2. The Rest checklist supplies the starting-value cap. The printed table is retained, the linked rule implements the resolved amount, and retrieval carries the explicit resolution and document identity. This resolves only that issue; interrupted-rest timing and other recovery boundaries remain unchanged.

## Estate purchase, lodging and storage closure unit — PDF160 / printed158

`procedure.estate_ownership` applies the actual4000c Silver City purchase once to
its party and persists the key. Lodging saves stay, hero, visit and day identities;
pending recovery cannot be replaced by another stay or consumed by another hero.
The composition regression executes actual estate overnight and hero recovery in
`procedure.settlement_activities_and_overnight` before accepting the completed
receipt. Equipment storage uses a permanent physical-item identity and chronological
transfer sequence, rejecting old deposits after retrieval and transfers away from
the estate. Twenty derived regressions; no independent review. Furnishing, ghost
contact/events and Grieving Mother remain separate units.

## Acceptance/departure ownership reconciliation — PDF132–133

Earlier acceptance stored quest/site/origin but relied on a supplied ownership
boolean. It now requires concrete saved party/offer/visit identifiers to match
actual inputs, persists them on the accepted occurrence, and binds a delayed
site result to its pending quest/occurrence. Departure compares the actual party
against that saved owner. Main/side records and eligible repeats remain distinct;
no universal repeat or completion rule is inferred. Source availability and map
geometry remain supplied, with the existing review boundaries preserved. The
omitted Taking on Quests heading is included in the reconciled inventory.
