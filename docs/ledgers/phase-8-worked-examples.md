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

### Inventory after this slice (merged with #17)

48 entries in 40 sections claim 114 `source_example` cases; 410 sections remain unswept.
Dispositions: 34 `executable` (1 `pending`, #16), 6 `source_conflicted`, 7 `descriptive`,
1 `missing_information`.
