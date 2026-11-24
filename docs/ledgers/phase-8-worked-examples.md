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

## Slice 3 — Into the Dungeons, Treasure, Combat — 24 November 2026

Issue #16. Rendered and read PDF 86-125 (printed 84-122) page by page; a text search found
candidates only. The 82 sections of the three chapters left `unswept_sections` (595 remain).

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
