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

## Slice — Travel, Settlements, Guilds, Inner Sanctum, Estate, Appendices — 24 November 2026

Issue #19. Swept PDF 125–220 (Travel and Settlements part, Appendices part including Adding a
third dimension) and PDF 280–286 (back matter). Every page was rendered and read; a text search
for "example", "e.g.", "for instance", "such as" and "for every" only seeded candidates. 229
sections left the allowlist (the redirects were never on it).

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
