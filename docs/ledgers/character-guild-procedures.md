# Package D — character and guild procedures

## Status

Phase 6 Batch 6 is extracted within the inventory below and its package gate has passed.
Package E is next. This is not a claim of
Phase 6 completion or Phase 9 independently reviewed coverage.

The user’s [completion plan](../corpus-completion-plan.md) requires D → E → F, then the
comprehensive Phases 7–10 passes before compilation/retrieval. No later gate is bypassed.

## Heading inventory

Page labels are read from pages.yaml. Existing catalogue IDs and compatibility redirects
are retained. The three missing advancement matrices were extracted as a bounded source
correction required by these procedures; other tables are reused. IDs in the disposition
column omit the `procedure.` prefix where unambiguous.

| Section                                                                                | Heading                                      | PDF / printed start | Disposition                                                                                                                                                       |
| -------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.creating_your_character`                                                      | Creating your Character                      | 29 / 27             | `procedure.character_creation`: ordered, guarded stages; species/profession/background effects supplied from existing catalogues                                  |
| `section.levelling_up`                                                                 | Levelling Up                                 | 60 / 58             | `character_level_up`; cumulative XP and next-level guard; existing progression table                                                                              |
| `section.the_dark_guild`                                                               | The Dark Guild                               | 148 / 146           | `guild_access`, `guild_skill_training`, `guild_purchase_authorization`; trap use stays with existing dungeon-effect rules                                         |
| `section.fighters_guild`                                                               | Fighters’ Guild                              | 151 / 149           | Access, training, `fighters_bounty`, purchase authorization; five supplied table outcomes, one reward per enemy kind                                              |
| `section.wizards_guild`                                                                | Wizards’ Guild                               | 153 / 151           | Access including recharge visitors; training, `learn_spell`, item recharging and purchase authorization; staff usage reuses catalogue effects                     |
| `section.alchemists_guild`                                                             | Alchemists’ Guild                            | 154 / 152           | Access, training, purchase authorization; parts/ingredients and potion grade offerings reuse structured catalogue                                                 |
| `section.rangers_guild`                                                                | Rangers’ Guild                               | 156 / 154           | Access, training, `ranger_special_talent`, `ranger_trophy_sale`, purchase authorization; hunting/skinning/butchering/trophy capture remain existing-rule handoffs |
| `section.the_inner_sanctum`                                                            | The Inner Sanctum                            | 158 / 156           | Access, training, prayer learning, prayer attempt, blessings, purchase authorization and crusades                                                                 |
| `section.creating_your_character.choosing_your_species`                                | Choosing Your Species                        | 29 / 27             | Creation coordinator plus reroll and specialisation procedures; optional roll assignment is a supplied choice                                                     |
| `section.creating_your_character.profession_and_talents`                               | Profession and Talents                       | 32 / 30             | Creation coordinator, `character_creation_skill`; existing profession grants and ability effects                                                                  |
| `section.creating_your_character.starting_equipment`                                   | Starting Equipment                           | 32 / 30             | Creation coordinator and per-item `character_creation_equipment_wear`; purchases/lending/pooling supplied                                                         |
| `section.creating_your_character.final_touches`                                        | Final Touches                                | 33 / 31             | Creation coordinator seeds baselines before modifiers; adds final RES contribution once; Wilbur source example fixture                                            |
| `section.creating_your_character.alchemist`                                            | Alchemist                                    | 34 / 32             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.barbarian`                                            | Barbarian                                    | 35 / 33             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.ranger`                                               | Ranger                                       | 36 / 34             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.rogue`                                                | Rogue                                        | 37 / 35             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.thief`                                                | Thief                                        | 38 / 36             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.warrior`                                              | Warrior                                      | 39 / 37             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.warrior_priest`                                       | Warrior Priest                               | 40 / 38             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.wizard`                                               | Wizard                                       | 41 / 39             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.levelling_up.stats_and_skills_maximum`                                        | Stats and Skills Maximum                     | 60 / 58             | `character_improve` and `guild_skill_training`; existing racial table and natural-cap rule                                                                        |
| `section.levelling_up.increasing_your_skills_and_basic_stats`                          | Increasing your Skills and Basic Stats       | 61 / 59             | `character_improve` and `character_finish_advancement`; +5 limits, saved points, explicit crossing/HP uncertainties                                               |
| `section.levelling_up.elves`                                                           | Elves                                        | 61 / 59             | Lore: no ordered action or mechanical procedure; text remains mapped                                                                                              |
| `section.levelling_up.talents_and_perks`                                               | Talents and Perks                            | 62 / 60             | `character_level_ability`; exact profession/level category and once-per-session choice                                                                            |
| `section.levelling_up.halflings`                                                       | Halflings                                    | 62 / 60             | Lore: no ordered action or mechanical procedure; text remains mapped                                                                                              |
| `section.magic.learning_new_spells`                                                    | Learning New Spells                          | 66 / 64             | `learn_spell`; Wizard, level, Silver City, 3 completed days, Grimoire fee waiver, quest limit                                                                     |
| `section.prayers.learning_new_prayers`                                                 | Learning New Prayers                         | 82 / 80             | `learn_prayer`; Warrior Priest, level, Silver City, 1 completed day, dungeon-visit limit                                                                          |
| `section.settlements.guilds`                                                           | Guilds                                       | 145 / 143           | `guild_access` / `guild_purchase_authorization`; no printed membership enrolment/fee/rank to invent                                                               |
| `section.settlements.learn_a_spell_or_prayer`                                          | Learn a Spell or Prayer                      | 146 / 144           | `learn_spell` / `learn_prayer`; shared fee/duration text; example contradiction retained                                                                          |
| `section.settlements.level_up`                                                         | Level Up                                     | 146 / 144           | `character_level_up`; zero-point action authorized by settlement accounting                                                                                       |
| `section.settlements.skills_training`                                                  | Skills Training                              | 147 / 145           | `guild_skill_training`; correct guild/profession/skill, completed day, fee and per-skill limit                                                                    |
| `section.the_dark_guild.skill_training`                                                | Skill training                               | 148 / 146           | `guild_skill_training`; CS/RS/Pick Locks/Perception                                                                                                               |
| `section.the_dark_guild.buying_special_equipment`                                      | Buying Special Equipment                     | 148 / 146           | `guild_purchase_authorization` → existing settlement purchase procedure; item effects stay with catalogue rules                                                   |
| `section.fighters_guild.buying_special_equipment`                                      | Buying Special Equipment                     | 152 / 150           | `guild_purchase_authorization` → existing settlement purchase procedure; item effects stay with catalogue rules                                                   |
| `section.alchemists_guild.life_in_the_kingdom`                                         | Life in the Kingdom                          | 155 / 153           | Lore: no ordered action or mechanical procedure; text remains mapped                                                                                              |
| `section.the_inner_sanctum.blessing_your_armour_and_weapons`                           | Blessing Your Armour and Weapons             | 158 / 156           | `guild_item_service`; per-item fees and separately owned temporary bonuses; expiry enforcement belongs to Package F                                               |
| `section.the_inner_sanctum.praying_in_the_inner_sanctum`                               | Praying in the Inner Sanctum.                | 158 / 156           | `sanctum_prayer`; one god, 1–5, fee/duration; same-god retry and Trickster penalty remain unresolved                                                              |
| `section.the_inner_sanctum.practicing_skills`                                          | Practicing Skills                            | 158 / 156           | `guild_skill_training`; CS/Dodge/Battle Prayers                                                                                                                   |
| `section.the_inner_sanctum.learning_a_new_prayer`                                      | Learning a New Prayer                        | 158 / 156           | `learn_prayer`; one prayer between dungeon visits, one full day, level-dependent fee                                                                              |
| `section.the_inner_sanctum.buying_special_equipment`                                   | Buying Special Equipment                     | 158 / 156           | `guild_purchase_authorization` → existing settlement purchase procedure; item effects stay with catalogue rules                                                   |
| `section.the_inner_sanctum.crusades`                                                   | Crusades                                     | 159 / 157           | `sanctum_crusade`; target table, automatic trophies, 25 c each, once-only payment and early-return uncertainty                                                    |
| `section.creating_your_character.choosing_your_species.table`                          | Choosing Your Species table                  | 29 / 27             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.choosing_your_species.table_2`                        | Damage Bonus table                           | 29 / 27             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.table`                                                | Creating your Character table                | 30 / 28             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.table_2`                                              | Creating your Character table 2              | 30 / 28             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.table_3`                                              | Creating your Character table 3              | 31 / 29             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.table_4`                                              | Creating your Character table 4              | 31 / 29             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.alchemist.table_skills`                               | Skills                                       | 34 / 32             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.barbarian.table_skills`                               | Skills                                       | 35 / 33             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.ranger.table_skills`                                  | Skills                                       | 36 / 34             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.rogue.table_skills`                                   | Skills                                       | 37 / 35             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.thief.table_skills`                                   | Skills                                       | 38 / 36             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.warrior.table_skills`                                 | Skills                                       | 39 / 37             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.warrior_priest.table_skills`                          | Skills                                       | 40 / 38             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.wizard.table_skills`                                  | Skills                                       | 41 / 39             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.levelling_up.table`                                                           | Levelling Up table                           | 60 / 58             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.levelling_up.stats_and_skills_maximum.table`                                  | Stats and Skills Maximum table               | 60 / 58             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.levelling_up.increasing_your_skills_and_basic_stats.table`                    | Increasing your Skills and Basic Stats table | 61 / 59             | New `table.character.improvement_costs`; full matrix, PDF61                                                                                                       |
| `section.levelling_up.talents_and_perks.table_talents`                                 | Talents                                      | 62 / 60             | New `table.character.talent_progression`; full matrix, PDF62                                                                                                      |
| `section.levelling_up.talents_and_perks.table_perks`                                   | Perks                                        | 62 / 60             | New `table.character.perk_progression`; full matrix, PDF62                                                                                                        |
| `section.the_dark_guild.buying_special_equipment.table`                                | Buying Special Equipment table               | 148 / 146           | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.the_dark_guild.buying_special_equipment.table_2`                              | Buying Special Equipment table 2             | 148 / 146           | Compatibility redirect retained: `section.the_dark_guild.buying_special_equipment.table`                                                                          |
| `section.the_dark_guild.table`                                                         | The Dark Guild table                         | 149 / 147           | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.fighters_guild.table`                                                         | Fighters’ Guild table                        | 151 / 149           | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.fighters_guild.buying_special_equipment.table`                                | Buying Special Equipment table               | 152 / 150           | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.wizards_guild.table`                                                          | Wizards’ Guild table                         | 153 / 151           | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.alchemists_guild.table`                                                       | Alchemists’ Guild table                      | 154 / 152           | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.rangers_guild.table`                                                          | Rangers’ Guild table                         | 156 / 154           | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.the_inner_sanctum.buying_special_equipment.table`                             | Buying Special Equipment table               | 158 / 156           | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.the_inner_sanctum.crusades.table`                                             | Crusades table                               | 159 / 157           | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.mana`                                                 | Mana                                         | 29 / 27             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.damage_bonus_and_natural_armour`                      | Damage Bonus and Natural Armour              | 29 / 27             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.damage_bonus_and_natural_armour.natural_armour_table` | Natural Armour table                         | 29 / 27             | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |
| `section.creating_your_character.dwarf`                                                | Dwarf                                        | 30 / 28             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.elf`                                                  | Elf                                          | 30 / 28             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.halfling`                                             | Halfling                                     | 31 / 29             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.creating_your_character.human`                                                | Human                                        | 31 / 29             | Reuse existing species/profession/stat catalogue through creation coordinator; modifiers supplied once                                                            |
| `section.rangers_guild.equipment_table`                                                | Rangers’ Guild special equipment table       | 157 / 155           | Reuse existing structured table through species/profession/guild catalogue or progression dependency; no duplicate extraction                                     |

## Run-in headings and source units

- PDF 29 (printed 27): Rolling Your Stats, Option, Specialisation, Strength and Weapon
  Class, Damage Bonus and Natural Armour, Hit Points, Mana and Energy. Rerolls and point
  allocation execute; rolled species values, optional assignment and catalogue modifiers
  are supplied. Weapon, DB/NA and mana rules remain linked; lookup/mana uncertainties stay.
- PDF 30–31: species stats, HP, traits, limitations, Halfling cooking gear and Human
  random talent reuse the existing species catalogues. No profession or background
  modifier is overwritten by late initialization.
- PDF 32: Skills, Free Skill, Magic Spells and Prayers, Background (optional), Backpack,
  Buying Equipment before the Game and Buying Equipment After the Game Starts. Skills
  and wear execute; existing catalogue grants/equipment/spell/prayer/background selections
  are confirmed handoffs. Before-game availability is waived but wear is required;
  ordinary after-start purchases use the existing settlement procedure.
- PDF 33: Sanity, Luck, Level, Party Morale, Start Playing or Make More Characters and
  Character creation example. Baselines seed once before modifiers. RES contribution
  applies once; Wilbur’s actual RES37 → PM3 example is a sourced outcome-and-trace fixture.
  The pointer to the longer creation example on PDF49 is retained for the Phase 8 pass.
- PDF 60–62: progression, maxima, Improvement Point costs, Talents and Perks. All three
  newly extracted matrices have an independently transcribed 315-cell regression test.
  Elves and Halflings sidebars are lore, not progression procedures.
- PDF 66/82, 134/146/147, 153/158: level eligibility, service location, fees, Grimoire,
  training and learning limits/durations compose with settlement activity accounting.
- PDF 148–159 guild units: access, training, offerings, bounty, spell learning, charging,
  staff purchase/recharge, Alchemist components/potions, ranger tuition and trophy sale,
  Sanctum prayers/prayer learning/blessings/relic offerings and crusades all have a
  procedure or an explicit existing-catalogue handoff. Nightstalker armour, traps, Pain
  Killer, Shield Padding, armour add-ons, Slayer Weapons, staff casting/storage, ranger
  hunting talents and equipment use retain their existing source-backed rules. Those are
  equipment/adventure effects, not extra settlement costs. Guild shopping composes with
  ordinary availability locks and a single purchase; the complete tables remain canonical.

## State ownership and supplied inputs

Creation stage, reroll budget, Free Skill selection, resources and advancement session
are hero-owned. Original-roll reroll flags and equipment wear belong to their individual
roll/item. Improvement counters are keyed by hero, session level and subject; spare points
are shared across that hero’s subjects and can be spent only in an open level session.
Level increases change capacities; current recovery remains in the existing rest procedure.

Training attempts are keyed by hero and skill across all visits until another dungeon.
Spell learning uses the quest boundary; prayer learning uses the dungeon-visit boundary.
Ranger tuition remembers the previous tuition level. Bounty claims belong to the offered
list and enemy kind, merging duplicate rolled slots. Crusade payment belongs to one hero
and assignment. Trophy sale attempts belong to trophy and settlement, not a fresh visit.
Item service receipts, charges and blessings belong to that item. Prayer god choice belongs
to the hero’s between-quest interval. Package F must supply real lifecycle boundaries and
expire temporary effects; changing a visit ID cannot reset these limits by itself.

Hero activity reservations and completed days come from the existing settlement procedure.
Party lodging and payer balance remain shared. These procedures charge only their stated
service/tuition fee; no second Activity Point or lodging charge occurs. `invoke` remains a
recorded dependency handoff and failed `require` does not halt execution. Consequential
steps have explicit guards. Dice, catalogue choice/eligibility, HP purchase interpretation,
geometry, actual quest outcomes and unavailable Bestiary-derived XP remain supplied.
A supplied-completion flag is a contract for a genuinely completed matching reservation,
not an alternative time-advancement engine.

## Uncertainty and independent checking

New source issues: `issue.character.improvement_seventy_boundary`,
`issue.character.level_hit_point_limit`, `issue.guild.training_near_cap`,
`issue.guild.crusade_early_payment`, and `issue.guild.same_god_prayer_retry`. Existing
mana rounding, absent lookup domains, conflicting prayer-example duration, Ohlnir naming
and unspecified Trickster deduction remain visible. No missing-book statistics are added.

A separate agent directly inspected rendered creation, advancement and guild source
pages, independently transcribed the advancement matrices, and checked procedure guards.
Its findings corrected the mandatory-highest reroll, YAML alias-expansion failure,
training-cap handling, early crusade-payment handling and same-god prayer retries.
This supporting review is not schema-validated Phase 9 review evidence; coverage remains
extracted rather than reviewed. Formal revision-bound review records remain pending.

## Verification

New regressions are in `tests/rules/character-{creation,advancement,learning-training,guilds}.test.ts`,
`tests/tables/character-advancement.test.ts`, and `tests/examples/character/creation.yaml`.
They cover successful/rejected/repeated/incomplete operations, printed thresholds,
unavailable matrix cells, source ambiguities, exact fees, full-duration completion,
three-day learning plus three party lodging nights, and access → shopping → purchase.
The existing pilot negative-type test now selects its known fixture by stable ID, because
adding source fixtures must not change what that test mutates through file ordering.

Final package gate: 248 canonical files validate; 1,697 tests pass with two optional
provider tests skipped; coverage regeneration, lint and `git diff --check` pass. The
corpus now contains 1,131 rules, 570 entities, 154 tables, 55 procedures, one state
machine and 472 YAML fixtures. Coverage records 280 extracted sections and zero
independently reviewed sections. There are 77 uncertainty records, 70 unresolved.
