# Phase 8 worked examples

This ledger records Phase 8 of the [completion plan](../corpus-completion-plan.md#phase-8--worked-examples-and-diagrams):
every example the book prints, with provenance and a disposition, and every executable one run as
a `source_example` case through the pilot runner. Spec: GitHub issue #13. Slices: #14 (inventory
and test), #15–#19 (one chapter group each), #20 (close-out).

The inventory is `tests/fixtures/example-inventory.json`, checked by
`tests/regression/example-inventory.test.ts` through `tests/support/example-inventory.ts`. Counts
below are point-in-time.

## Slice 1 — inventory and disposition test — 24 November 2026

Issue #14. No change under `corpus/`, `schemas/` or `review/`, and no re-review: no test case
changed, so no reviewed-object digest moved.

### What was built

- The inventory fixture. Each entry has `id` (no page number), `section_id`, `pdf_page` and
  `printed_page` (checked against `corpus/source-map/pages.yaml`), a verbatim `anchor`, `form`,
  `disposition`, `reason`, and optional `cases`, `issues` and `pending`.
- `unswept_sections`: the allowlist of sections not yet searched for examples. It starts with all
  677 non-redirect sections; each chapter slice removes the sections it sweeps.
- The test. It fails on a missing or unknown disposition or form, an empty reason or anchor, an
  unresolved or redirected section, a printed page that disagrees with the page map, an
  unresolved case or issue, an executable entry with no cases that is not `pending`, a case that
  is not `kind: source_example`, a `source_example` case claimed by no entry or by more than one,
  a `source_conflicted` entry with no issue, an inventoried section whose `examples` coverage is
  `not_applicable`, `pending` on a non-executable entry, and an allowlisted section that is gone
  or a redirect. Each rule is shown firing on a minimal broken copy of the fixture.
  `checkExampleInventory(..., { closed: true })` also fails any `pending` entry or allowlisted
  section; #20 switches the main assertion to it.

### Seeded entries

35 entries in 29 sections claim all 94 existing `source_example` cases, each exactly once. The
seed covers only examples that already had a case or an `examples: extracted` coverage row. No
chapter has been swept yet.

| Form               | Entries |
| ------------------ | ------: |
| `inline_prose`     |      22 |
| `diagram`          |       5 |
| `caption`          |       4 |
| `labelled_example` |       3 |
| `table`            |       1 |

| Disposition           | Entries |
| --------------------- | ------: |
| `executable`          |      30 |
| `source_conflicted`   |       4 |
| `descriptive`         |       1 |
| `missing_information` |       0 |

One executable entry is `pending`: the option 3 explanation in Detailed acting with enemies
(PDF 119), which only the derived case `test.combat.humanoid_behaviour.approach_parry` models.
The four `source_conflicted` entries are the Gameplay Example, the Character Creation Example, the
Combat Example and the Focus example. Each keeps its printed values in its cases and names the
issues that record the disagreement. The one `descriptive` entry is the check-kind example in Skill
and Stat Checks (PDF 20), which names a check but prints no roll or outcome.

### Findings for the chapter slices

- `test.phase6.scenario_die.trigger` sits in `section.into_the_dungeons.the_scenario_die` but
  quotes the first sentence of the Threat Level example (PDF 89, under Effect of Triggering the
  Threat Level). The Scenario Die section prints no example of its own, yet its `examples`
  coverage is `extracted`. The entry claims the case under `the_threat_level`; nothing was changed
  (comment on #14).
- `section.game_basics.skill_and_stat_checks` has `examples: extracted` but no `source_example`
  case; its examples are descriptive.

## Slice — Equipment, Psychology, Magic, Magic Items, Enchantments, Alchemy, Prayers — 24 November 2026

Issue #17. Swept PDF 51–58 and 64–84 (printed 49–56 and 62–82), every page rendered and read.
135 sections left `unswept_sections` (542 remain). `such as` lists that only name members of a
category (rations and lock picks, Quick Slot items) are not counted as examples; the Hands
sentence is, because the book labels it "Examples".

### Examples found

| Entry                                              | Section                                         | PDF | Form           | Disposition         |
| -------------------------------------------------- | ----------------------------------------------- | --: | -------------- | ------------------- |
| `example.equipment.weapon_class` (seed)            | `equipment.weapon_class`                        |  51 | `inline_prose` | `executable`        |
| `example.equipment.hands_items`                    | `equipment.hands`                               |  52 | `inline_prose` | `descriptive`       |
| `example.equipment.jacket_hit_odds`                | `equipment.what_equipment_to_bring`             |  54 | `inline_prose` | `descriptive`       |
| `example.psychology.sanity_two_conditions` (seed)  | `psychology.sanity.conditions`                  |  55 | `inline_prose` | `executable`        |
| `example.psychology.morale_starting_range`         | `psychology.party_morale`                       |  58 | `inline_prose` | `descriptive`       |
| `example.psychology.morale_two_poisoned` (seed)    | `psychology.party_morale`                       |  58 | `inline_prose` | `executable`        |
| `example.magic.increased_power_miscast`            | `magic.increased_power`                         |  66 | `inline_prose` | `executable`        |
| `example.magic.increased_power_level_cap`          | `magic.increased_power`                         |  66 | `inline_prose` | `executable`        |
| `example.magic.focus_ozmor` (seed)                 | `magic.focus`                                   |  66 | `inline_prose` | `source_conflicted` |
| `example.magic.scroll_magic_bolt` (seed, extended) | `magic.magic_scrolls`                           |  67 | `inline_prose` | `executable`        |
| `example.enchantments.damage_magic_necklace`       | `enchantments.requirements_for_magic_items`     |  71 | `inline_prose` | `descriptive`       |
| `example.alchemy.stat_potions_do_not_stack` (seed) | `alchemy.drinking_potions`                      |  72 | `inline_prose` | `executable`        |
| `example.alchemy.dragons_breath_caption`           | `alchemy.preparations.potion_of_dragons_breath` |  80 | `caption`      | `source_conflicted` |
| `example.prayers.stay_thy_hand_wounded`            | `prayers.stay_thy_hand`                         |  83 | `inline_prose` | `executable`        |

14 examples in scope: 6 seeded, 8 new. The flowcharts (Hero Spell Casting, PDF 68; Making a
potion, PDF 77) and the Common recipes (PDF 78) are rule diagrams and catalogue data, not
examples. Magic Items (PDF 70) prints none.

### Cases added

7 `source_example` cases, 2 `derived_case`:

- `test.core.magic.power_example.miscast_threshold_94`, `.level_4_adds_4`, `.level_6_adds_5`;
  derived `test.core.magic.power.level_4_cannot_add_5`, `.level_6_cannot_add_6`. The level cases
  pin Magic Bolt (Destruction, 14 Mana, PDF 189) because the example names no spell.
- `test.core.magic.scroll_example.magic_bolt_without_scroll` (Arcane Arts 50 − CV 10 = 40),
  now first in `example.magic.scroll_magic_bolt`. Mana is pinned to the listed cost 14, as casting
  presupposes enough Mana.
- `test.alchemy.dragons_breath_caption.spot_and_line` (caption ways 2 and 4).
- `test.character.prayer.stay_thy_hand_example.wounded_enemy`.

No interpreter change was needed.

### Reclassifications and issues

- `example.alchemy.dragons_breath_caption` is `source_conflicted` on the existing
  `issue.alchemy.dragons_breath_geometry` (ways 1 and 3, "2dx1d4"); no case asserts those ways.
  No new issue.
- `examples` coverage flipped to `extracted` on 6 rows: `equipment.hands`,
  `equipment.what_equipment_to_bring`, `magic.increased_power`,
  `enchantments.requirements_for_magic_items`, `alchemy.preparations.potion_of_dragons_breath`,
  `prayers.stay_thy_hand`. Notes updated on those and on `magic.magic_scrolls`.
- The inventory test's allowlist assertion now checks that `unswept_sections` lists only live
  sections, once each, instead of all of them.

### Re-reviews

Five records went stale; one fresh Opus 5.5 `corpus-reviewer` each, all passed with no open
findings and no proposed issues: `review.equipment.5`, `review.magic.5`,
`review.magic_items_enchantments.5`, `review.alchemy_preparations.3`, `review.prayers.4`.
Psychology records stayed fresh (no case or coverage change there).

### Counts after this slice

43 entries claim 100 `source_example` cases.

| Disposition           | Entries |
| --------------------- | ------: |
| `executable`          |      33 |
| `source_conflicted`   |       5 |
| `descriptive`         |       5 |
| `missing_information` |       0 |

## Slice — Travel, Settlements, Guilds, Inner Sanctum, Estate, Appendices — 24 November 2026

Issue #19. Swept PDF 125–220 (Travel and Settlements part, Appendices part including Adding a
third dimension) and PDF 280–286 (back matter). Every page was rendered and read; a text search
for "example", "e.g.", "for instance", "such as" and "for every" only seeded candidates. 229
sections left the allowlist (the redirects were never on it); 313 remain after #17 and #19.

### Inventory

11 entries in scope: the 3 seeded (map caption, Irondale, Silver City) and 8 new.

| Entry                                                        | PDF | Form           | Disposition           | Cases |
| ------------------------------------------------------------ | --: | -------------- | --------------------- | ----: |
| `example.travelling_and_skirmishes.map_arrows` (seeded)      | 126 | `caption`      | `executable`          |     4 |
| `example.settlements.irondale_quest_site` (seeded)           | 132 | `inline_prose` | `executable`          |     1 |
| `example.settlements.silver_city_activities` (reclassified)  | 133 | `table`        | `source_conflicted`   |     1 |
| `example.fighters_guild.shield_padding_durability`           | 152 | `inline_prose` | `executable`          |     2 |
| `example.appendix_i_perks.frenzy_eight_attacks`              | 169 | `table`        | `executable`          |     1 |
| `example.appendix_ii_talents.hate_goblins`                   | 178 | `table`        | `descriptive`         |     0 |
| `example.appendix_iii_equipment.cloak_over_stacked_armour`   | 180 | `inline_prose` | `executable`          |     1 |
| `example.appendix_iii_equipment.torch_fire_fear`             | 183 | `inline_prose` | `missing_information` |     0 |
| `example.appendix_v_treasures.magic_weapon_durability_total` | 200 | `table`        | `executable`          |     1 |
| `example.appendix_v_treasures.magic_armour_durability_total` | 201 | `table`        | `executable`          |     1 |
| `example.appendix_v_treasures.stone_of_valheir_focus`        | 204 | `inline_prose` | `executable`          |     1 |

- Reclassified: the Silver City schedule is `source_conflicted` with the existing
  `issue.settlement.prayer_schedule_duration` (the Priest learns one prayer over D1 and D2
  against a cost of 1 Activity Point). Its Wizard case is unchanged; no case asserts either
  Priest reading. No new issue.
- 7 new `source_example` cases (`tests/examples/settlements/guild-examples.yaml`,
  `tests/examples/appendices/printed-examples.yaml`). To keep the printed totals from being
  restated literals, four rules now compute them: `character.settlement.equipment.shield_padding`
  adds its +1 to `maximum_durability`; `character.treasure.magic_weapons.7` and
  `character.treasure.magic_armours_shields.4` add +2 / +1 to it after
  `character.durability.magic`; `character.perk.frenzy.limits` derives 8 from two turns, 2 AP,
  1-AP Standard Attacks and one free attack per damaging attack.
- Examples coverage flipped to `extracted` on 8 sections; coverage report regenerated.
- Considered and not inventoried (rule statements, restatements or category lists, no instance):
  Outdoor Setup scatter list and "(1d6, 1d8, 1d10, etc.)" (PDF 128), the Obstacles table's
  "Example" art column (PDF 128–130), the Arena bracket (PDF 141), Pain Killer "meaning you can
  move or attack" (PDF 152), staff charges "cast three times" (PDF 153), the Warrior Priest
  trophy rate (PDF 159), Blood Magic's rate (PDF 176), In Tune with the Magic's threshold
  (PDF 171), Enchant Item "such as a weapon" (PDF 189), the Standard Potions 1d3 column choice
  (PDF 197), the Headsman's Axe (PDF 208) and Ohlnir's Hammer (PDF 208). Adding a third
  dimension (PDF 216–220) is photos with captions; back matter is backers, index and art.

### Re-reviews

Eight runs, one fresh Opus 5.5 `corpus-reviewer` per stale record, each with the previous
record's scope:

- `review.guilds.6`, `review.appendix_i_perks.3`, `review.appendix_ii_talents.3`,
  `review.appendix_iii_general_equipment_b.4`, `review.appendix_v_legendary_a.4` and
  `review.appendix_v_tables.5`: passed.
- `review.appendix_iii_weapons_armour.4` failed on one `coverage_error`: the parent
  `section.appendix_iii_equipment.armour_and_shields` note still said no example is printed. The
  note now points the Stackable example to `.table`; `review.appendix_iii_weapons_armour.5`
  passed with that correction.

No reviewer proposed a new issue. Notes left as `no_change_needed`: the shield-padding
`maximum_durability` description says "before padding" although the field holds the padded total
after the add; the Stone of Valheir case does not assert the 10-30 amount, because the draw rule
outputs no bonus value.

## Slice #18 — Quest Book I and Backgrounds — 24 November 2026

Issue #18. Swept PDF 42–50 (Backgrounds), 164–165 (Side Quest: The Grieving Mother) and 221–279
(Quest Book I), rendering every page. 132 sections left `unswept_sections`.

### Examples found

| Entry                                                | Section (PDF)                          | Form               | Disposition           | Cases |
| ---------------------------------------------------- | -------------------------------------- | ------------------ | --------------------- | ----: |
| `example.backgrounds.character_creation_example`     | `character_creation_example` (49–50)   | `labelled_example` | `source_conflicted`   |    19 |
| `example.quest_book_i.wandering_monster_threshold`   | `reading_the_quests` (222)             | `inline_prose`     | `executable`          |     3 |
| `example.quest_book_i.ulfric_to_hit_in_practice`     | `quest_2_the_dead_rising` (228)        | `inline_prose`     | `source_conflicted`   |     0 |
| `example.quest_book_i.secondary_quest_card_anywhere` | `level_2_the_basement` (239)           | `inline_prose`     | `descriptive`         |     0 |
| `example.quest_book_i.prisoner_reward_none`          | `quest_1_rescuing_the_prisoners` (250) | `inline_prose`     | `descriptive`         |     0 |
| `example.quest_book_i.gaul_fountain_damage`          | `quest_2_baptising` (254)              | `inline_prose`     | `missing_information` |     0 |
| `example.quest_book_i.closing_portal_even_tens`      | `quest_3_closing_the_portal` (257)     | `inline_prose`     | `executable`          |     3 |

- Cases added: 14. Eleven extend the Character Creation Example in printed order (Sanity 8,
  Movement 4, Warrior Priest Energy 2, and the eight sheet skills that match the Warrior Priest
  table); three run Closing the Portal's "(10, 20, 30…)".
- Reclassification: Sanity, Movement and Energy were "restated starting values, not executable"
  in the coverage notes; they are now cases. The skill values were checked only in
  `tests/rules/backgrounds.test.ts`; they are now also `source_example` cases.
- Considered, not inventoried: "(A total of 11)" settlements in 1. Wanderlust (a count, not an
  example), the Highwaymen plunder ledger (a quest handout), card-deck compositions (setup, not
  examples). The Grieving Mother pages print no example.
- Coverage: `examples` → `extracted` on the five quest sections above.

### Issues

- `issue.quest.ulfric_to_hit_in_practice` (resolved): the printed "in practice is -5" against
  the Slow and BFO rows (+5 each) gives 0; changelog 2.21 entry 102 rules 0.
  `core.quest.dead_rising.ulfric` now sets `to_hit_in_practice` 0 and keeps the quotation and
  `to_hit_printed` -10; row added to `review/designer-published-rulings.md`.
- `issue.backgrounds.creation_example_relic_of_ramos` (unresolved): the example's Relic of Ramos
  +5 CS against the Table of Relics +5 STR.
- `issue.quest.brood_mother_card_res_loot` (unresolved): raised by `review.the_dead_rising.3`;
  changelog entry 100 gives the card's RES 40 and Loot Part. No executable object carries them.

### Re-reviews (Opus 5.5, one fresh agent each)

`review.the_dead_rising.3` failed (Brood Mother, pre-existing); after the issue was added,
`review.the_dead_rising.4` passed with corrections. Also fresh: `review.backgrounds.3`,
`review.bandits_hideout_and_fountain_room.3`, `review.chamber_of_reverence_and_great_crypt.3`,
`review.spider_queen_and_lava_river.4`. Six reviews in all.

### Inventory after this slice (on its own branch, with #17)

Superseded by the combined totals at the end of this ledger.

## Slice — Into the Dungeons, Treasure, Combat — 24 November 2026

Issue #16. Rendered and read PDF 86-125 (printed 84-122) page by page; a text search found
candidates only. The 82 sections of the three chapters left `unswept_sections` (460 remain after merging #17).

### Examples found

9 new entries, and the seeded `example.combat.humanoid_option_3` converted. The seeded entries in
these chapters (tile placement, eight-card dungeon, Threat roll, diagonal moves, tile border, rule
of 50%, Belleck, shove, shoving caption, shooting, humanoid options 1, 2 and 4, Berthram, Combat
Example) were re-read and left unchanged.

| Entry                                                | Form           | Disposition | Cases |
| ---------------------------------------------------- | -------------- | ----------- | ----: |
| `example.into_the_dungeons.exploration_card_anatomy` | `diagram`      | descriptive |     0 |
| `example.into_the_dungeons.obstacle_pictures`        | `table`        | descriptive |     0 |
| `example.treasure.treasure_card_anatomy`             | `diagram`      | descriptive |     0 |
| `example.combat.zoc_diagram`                         | `diagram`      | executable  |     4 |
| `example.combat.change_gear_healing_potion`          | `inline_prose` | executable  |     1 |
| `example.combat.charge_directions`                   | `diagram`      | executable  |     2 |
| `example.combat.doorway_caption`                     | `caption`      | executable  |     2 |
| `example.combat.failed_throw_door`                   | `caption`      | executable  |     1 |
| `example.combat.quick_slot_roll`                     | `inline_prose` | executable  |     2 |
| `example.combat.humanoid_option_3` (was `pending`)   | `inline_prose` | executable  |     1 |

Cases: 12 new `source_example` cases in `tests/examples/combat/chapter-examples.yaml`, and
`test.combat.humanoid_behaviour.approach_parry` reclassified from `derived_case` to
`source_example` (verbatim italic text; the unprinted roll 1 from 1-2 is an
`unresolved_references` entry). Every case passes the pilot runner with its printed outcome and
trace; no interpreter change was needed. Unprinted inputs (ZOC facing, charge distances, Quick Slot
count and durability, thrower distance from the door) are recorded as `unresolved_references`.

Not entries: the flowcharts (Start of Turn, Opening a door or a chest, Combat Turn, Hero Attack,
Enemy Attack) are procedures, not examples; the counterfactual sentences in the Threat Level,
shooting and Berthram examples belong to their existing entries.

### Reclassifications and coverage

- `test.phase6.scenario_die.trigger` moved from `the_scenario_die` to `the_threat_level`, where its
  quoted sentence is printed (finding from #14). `the_scenario_die` `examples` is now
  `not_applicable`.
- `examples: extracted` set for `reading_the_exploration_cards`, `table_4`, `section.treasure`,
  `zone_of_control_zoc`, `throwing_potions` and `quick_slots_and_damage`; notes that called these
  examples non-executable or derived were corrected.
- No contradiction found: no new `source_conflicted` entry and no new issue.

### Re-reviews

Eight fresh `corpus-reviewer` runs (Claude Opus 5.5), six records left fresh and passing:

- `review.combat_actions.9` failed on two coverage notes still calling the Charge example and the
  doorway caption non-executable; fixed, then `review.combat_actions.10` passed with corrections.
- `review.combat_enemies.6` passed; the option 3 coverage note was then corrected, and
  `review.combat_enemies.7` passed.
- `review.combat_damage.4`, `review.into_the_dungeons_movement.3`,
  `review.into_the_dungeons_setup.14` and `review.treasure.4` passed.

No reviewer proposed a new issue.

## Combined totals after #14, #16, #17, #18 and #19

65 entries in 54 sections claim 134 `source_example` cases; 100 sections remain unswept (the #15
chapters). No entry is `pending`.

| Disposition           | Entries |
| --------------------- | ------: |
| `executable`          |      45 |
| `source_conflicted`   |       7 |
| `descriptive`         |      11 |
| `missing_information` |       2 |
