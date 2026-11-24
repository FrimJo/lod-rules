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

## Slice 2 — Game Basics through Embarking — 24 November 2026

Issue #15. Swept front matter, Introduction, Game Basics (with the Gameplay Example), the Party
Management part divider, Character Basics, Creating Your Character, Embarking on Your First Quest
and Levelling Up: PDF 1–41 and 59–62, every page rendered and read. 98 sections left the unswept
allowlist (677 → 579).

### Examples found

All 15 examples in scope are inventoried. Eight were already seeded by #14. Seven are new:

| Entry                                         | PDF | Form           | Disposition           |
| --------------------------------------------- | --: | -------------- | --------------------- |
| `example.introduction.doors_rule_card`        |  14 | `inline_prose` | `descriptive`         |
| `example.introduction.modifier_for_instance`  |  18 | `inline_prose` | `descriptive`         |
| `example.game_basics.other_tiles_and_terrain` |  19 | `inline_prose` | `descriptive`         |
| `example.game_basics.adjacent_wording`        |  20 | `inline_prose` | `descriptive`         |
| `example.game_basics.res_or_notation`         |  20 | `inline_prose` | `descriptive`         |
| `example.game_basics.large_troll`             |  20 | `inline_prose` | `missing_information` |
| `example.levelling_up.barbarian_thief_costs`  |  61 | `inline_prose` | `descriptive`         |

The Troll example needs Bestiary data (`not_present`). Not inventoried: front-matter backer lists,
contents and art index; component pictures and captions (PDF 13–15); the species and profession
tables; the pointer to the Character Creation Example (PDF 33), which #18 owns.

### Cases added

Five `source_example` cases, appended in printed order to existing entries:

- Gameplay Example: `test.gameplay_example.wandering_monster_trigger` (Threat 10 → 12 meets the
  quest's 12) and `test.gameplay_example.turn_3_scenario_die` (10 requires a Threat Roll).
- Warrior CS 80 example: `test.skill.book_example.cs_80_cannot_increase`,
  `test.skill.book_example.still_miss_91` and `test.skill.book_example.still_miss_00` (both ends of
  the printed 91–00 range).

No interpreter change was needed.

### Reclassifications and issues

No new issue. The Gameplay Example entry (`source_conflicted`) now also names
`issue.gameplay_example.trap_sanity`, `issue.gameplay_example.legendary_roll` and
`issue.gameplay_example.torch_after_threat_roll`. Its reason lists the steps left unexecuted:
conflicted steps keep their printed values, and the spider's bite, remaining Hit Points and fear
level (Bestiary), the Fear Test rolls and the 2d6 placement are missing information.

Coverage: `examples` flipped to `extracted` for `section.introduction.game_components`,
`section.introduction.dice_rolling_and_skill_checks`, `section.game_basics.the_tiles`,
`section.game_basics.models` and `section.levelling_up.increasing_your_skills_and_basic_stats`;
the notes of those rows and of `the_tiles.adjacent` and `skill_and_stat_checks` name their entries.

The inventory test no longer asserts that the allowlist equals every live section; it asserts
that every allowlisted section is live.

### Reviews

- `review.game_basics.4` failed: the Wandering Monster case cited only PDF 23, and the ‘RES or…’
  illustration had no entry. Both were fixed. `review.game_basics.5` passed.
- `review.introduction.4` passed.
- `review.levelling_up.5` passed.

Inventory now: 42 entries claiming 99 cases; 30 `executable` (1 `pending`, #16), 4
`source_conflicted`, 7 `descriptive`, 1 `missing_information`.
