# Core-chapter reconciliation (Step 2)

This ledger records the Step 2 core-chapter loop described in the
[completion plan](../corpus-completion-plan.md#step-2--core-chapter-loop-reconcile-extract-review):
reconcile every section and component against the PDF, extract what is missing, and classify
worked examples. It is the extractor's record, not review evidence. Sections reach `extracted`
here; only an independent review record under `review/independent/` can make them `reviewed`.

The authoritative source is [Rulebook-2nd-printing-ENGa.pdf](../../source/Rulebook-2nd-printing-ENGa.pdf).
Printed/PDF pairs come from [pages.yaml](../../corpus/source-map/pages.yaml).

## 2026-10-07 — Introduction and Game Basics (tier 1)

Scope: the 27 sections under `section.introduction` (11) and `section.game_basics` (16).

### Pages inspected

Every page was rendered and read, not only text-dumped:

| PDF | Printed | Content                                                                           |
| --- | ------- | --------------------------------------------------------------------------------- |
| 12  | 10      | Introduction; A Word on Complexity, Dice Rolling, Mental Health                   |
| 13  | 11      | Game Components: books, monster cards, treasure cards                             |
| 14  | 12      | Game Components continued: exploration, travel event, trap, playing, rule cards   |
| 15  | 13      | Game Components continued: spell/prayer cards, sheets, map, tokens, settlements   |
| 16  | 14      | Abbreviations and Terminology                                                     |
| 17  | 15      | Terminology continued; The League of Dungeoneers sidebar                          |
| 18  | 16      | A Note on Gender; Do I Need to Read…; Dice Rolling and Skill Checks; How to start |
| 19  | 17      | Game Basics: Basic Concept, House Rules, The Tiles, Difficulty, Objects           |
| 20  | 18      | Objects continued, Adjacent, Models, Turn Sequence, Skill and Stat Checks         |
| 21  | 19      | Perfect Result, Action Points, Line of Sight, LOS diagram, Complexity             |
| 22  | 20      | Gameplay Example, Turn 1 to Turn 2                                                |
| 23  | 21      | Gameplay Example, Turn 2 to Turn 3                                                |
| 24  | 22      | Gameplay Example, end                                                             |

To check the Gameplay Example against the rules it uses, these pages were also rendered: PDF 91
(printed 89, Threat tables), PDF 101 (printed 99, Opening a Door or Chest) and PDF 202
(printed 200, Legendary Items). The 2.21 changelog and the FAQ were searched for rulings on
these pages.

### Source-map correction

`section.introduction.game_components` was mapped to PDF 13 only. Its card and component
descriptions run on through PDF 14–15 under their own run-in headings, up to Abbreviations
and Terminology on PDF 16. The span is now PDF 13–15 / printed 11–13.

Chapter pointers that resolve to existing sections are now bound in `see_also`:

- Game Components → Treasure, Into the Dungeons, Travelling and Skirmishes.
- Do I Need to Read… → Party Management, Academic Skills, Dungeoneering and Combat,
  Travelling and Skirmishes.
- How do I start playing? → Creating your Character, and Embarking on your First Quest
  (printed 57, the page the text names). Changelog 2.21 entry 17 keeps the page reference.
- Line of Sight → Combat. Objects on the Tiles → Into the Dungeons.

### Introduction: per-section disposition

All 11 sections are now `extracted`. The entities component is `not_applicable` throughout:
nothing here is a game-world catalogue entry.

| Section                                | Disposition                                                                                                                                                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `section.introduction` (root)          | All components not applicable. The opening paragraph is a narrative overview of quests, experience, danger and the heroes' minds. Child coverage is separate.                                                                                                                                    |
| `.a_word_on_complexity`                | Rules extracted: new `core.optional.marked_rules`. Everything else not applicable.                                                                                                                                                                                                               |
| `.a_word_on_dice_rolling`              | Rules extracted: new `core.dice.combined_rolls` (some dice may be rolled together). The "round of combat … a minute" sentence is pacing guidance.                                                                                                                                                |
| `.a_word_on_mental_health_in_the_game` | All not applicable: the author's statement on depicting mental health. Sanity rules live in Psychology.                                                                                                                                                                                          |
| `.game_components`                     | Rules extracted: new `core.components.treasure_card_return`, which is stated only here. The own-tiles alternative was already `core.dungeon.card_contents`. Glossary not applicable: component names and the QRS abbreviation name play aids. Small-token rules are "not included in this book". |
| `.abbreviations_and_terminology`       | Glossary extracted (47 headwords). Rules moved from `extracting` to `extracted`: each mechanical definition is a short form of a rule extracted where the book states it. The coverage note lists the mapping.                                                                                   |
| `.the_league_of_dungeoneers`           | All not applicable: setting fiction sidebar.                                                                                                                                                                                                                                                     |
| `.a_note_on_gender`                    | All not applicable: a note on pronoun use.                                                                                                                                                                                                                                                       |
| `.dice_rolling_and_skill_checks`       | Glossary and rules extracted (`core.dice.percentile`, `core.check.modifier`, `core.check.automatic_failure`). "(for instance +10)" is a sample value, not a worked example. A check is one rule, not a procedure.                                                                                |
| `.do_i_need_to_read_over_200_pages_…`  | All not applicable: reading-order advice. Pointers bound in `see_also`.                                                                                                                                                                                                                          |
| `.how_do_i_start_playing`              | All not applicable: getting-started advice. Pointers bound in `see_also`.                                                                                                                                                                                                                        |

Mapping of the terminology section's mechanical definitions to their operative rules: AP(X)
`combat.weapon.special.ap_x`; Battle `core.battle.end` (issue.0001); CV
`core.magic.casting.threshold`; End of the Quest and Until end of (next) quest
`core.quest.end_uncertain` (issue.0004); I `core.magic.incantation`; NA `combat.damage.basic`;
PM `character.morale.flee`; Perk `character.energy.perk`; Q `core.magic.quick`; RDU/RDD
`core.rounding.up` / `core.rounding.down`; Skill Test `core.check.standard`; T
`core.magic.touch`; Adjacent `core.spatial.adjacent`; LOS `core.los.trace`.

### Game Basics: per-section disposition

All 16 sections are now `extracted`.

| Section                                      | Disposition                                                                                                                                                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.game_basics` (root)                 | All not applicable. PDF 19 has only the chapter title above the child headings. The examples component was `mapped`; the Gameplay Example has its own row.                                                                                         |
| `.basic_concept`                             | Rules extracted: new `core.overview.threat_level`, a summary linked to `procedure.scenario_die` and `procedure.threat_roll`. Its "below the Threat Level" differs from the detailed "equal to or below": `issue.game_basics.threat_roll_equality`. |
| `.house_rules`                               | Glossary (`term.house_rule`) and rules extracted: new `core.house_rule.uncovered_situation`.                                                                                                                                                       |
| `.the_tiles`                                 | Glossary (`term.tiles`) and rules extracted: new `core.tiles.alternative_terrain` and `core.tiles.square_movement`. "You will find examples of that" refers to pictures.                                                                           |
| `.difficulty`                                | Rules extracted: new `core.difficulty.party_size` and `core.difficulty.encounter_frequency` (linked to `procedure.encounters`). Previously no records.                                                                                             |
| `.turn_sequence`                             | Rules moved to `extracted`: the whole heading is the five-step list in `procedure.dungeon_turn` plus `core.turn.psychology`. The Threat increase for a won battle is a dependency on The Threat Level section.                                     |
| `.skill_and_stat_checks`                     | Rules extracted. Examples extracted and classified (below). Tables, procedures and entities not applicable.                                                                                                                                        |
| `.models`                                    | Glossary and rules extracted (`core.model.footprint`). "(such as a Troll)" is a parenthesis, not a worked example; derived fixtures cover it.                                                                                                      |
| `.action_points_ap`                          | Glossary and rules extracted (`core.action_points.allocation`). Nothing else.                                                                                                                                                                      |
| `.complexity`                                | Rules extracted (`core.optional.*`). The bullet list is the removal order held in those rules. Removing the Threat level leaves Wandering Monsters and light sources to house rules: `issue.game_basics.threat_removal_house_rules`.               |
| `.line_of_sight_los`                         | Glossary, rules and examples extracted (`core.los.*`, diagram fixtures). The diagram sits in the Complexity column on PDF 21 but belongs here.                                                                                                     |
| `.gameplay_example`                          | Examples extracted (classified below, with fixtures and issues). It adds no rule of its own.                                                                                                                                                       |
| `.the_tiles.objects_on_the_tiles`            | Glossary (`term.walls`) and rules extracted: `core.movement.wall` and new `core.tiles.interactable_objects`.                                                                                                                                       |
| `.the_tiles.adjacent`                        | Glossary, rules and examples extracted (`core.spatial.adjacent`, diagram fixtures).                                                                                                                                                                |
| `.skill_and_stat_checks.success_and_failure` | Glossary and rules extracted (`core.check.standard`, `core.check.success`).                                                                                                                                                                        |
| `.skill_and_stat_checks.perfect_result`      | Glossary and rules extracted (`core.check.perfect_*`, issue.0009, issue.0010). The three-way choice is a rule, not an ordered procedure.                                                                                                           |

### New canonical objects

All in [introduction-game-basics.yaml](../../corpus/rules/core/introduction-game-basics.yaml):
`core.optional.marked_rules`, `core.dice.combined_rolls`, `core.components.treasure_card_return`,
`core.overview.threat_level`, `core.house_rule.uncovered_situation`,
`core.tiles.alternative_terrain`, `core.tiles.square_movement`, `core.tiles.interactable_objects`,
`core.difficulty.party_size`, `core.difficulty.encounter_frequency`.

Guidance passages (house rules, alternative terrain, difficulty) are `definition` rules that
keep the wording and add no invented effect. `core.overview.threat_level` is a summary, linked to
the detailed procedures as dependencies rather than duplicating them. No existing record was
changed.

### Examples

| Example                                        | Classification                                                  | Evidence                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Skill and Stat Checks: Perception for search   | Descriptive; agrees with `procedure.search_room_or_corridor`    | —                                                                                         |
| Skill and Stat Checks: Strength for portcullis | Descriptive; agrees with `procedure.open_portcullis` (STR test) | —                                                                                         |
| Skill and Stat Checks: 'RES or…'               | Executable                                                      | existing `test.check.or_failure`, `test.check.or_success`                                 |
| Adjacent diagram                               | Executable                                                      | existing `test.core.spatial.adjacent.diagram_*`                                           |
| LOS A/B/C/D diagram                            | Executable                                                      | existing `test.core.los.*.diagram_*`                                                      |
| Gameplay Example                               | Mixed; step by step below                                       | new [gameplay-example.yaml](../../tests/examples/core/gameplay-example.yaml), 11 fixtures |

Gameplay Example, step by step (PDF 22–24):

| Step                                                           | Classification                                                                                                                | Fixture or issue                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Turn 1 Scenario die 2, quest triggers on 9 or 10               | Executable                                                                                                                    | `test.gameplay_example.turn_1_scenario_die`                                                              |
| Belleck walks and forfeits; Azira moves and opens the chest    | Descriptive. The chest opening adds no Threat in the example, but the procedure adds +1 for a chest                           | `issue.gameplay_example.chest_threat` (unresolved)                                                       |
| Chest d6 6 trapped, d10 3 unlocked                             | Descriptive; agrees with the Door/chest table                                                                                 | —                                                                                                        |
| Perception 56 against 45                                       | Executable: failure                                                                                                           | `test.gameplay_example.azira_perception`                                                                 |
| "Trap Table" roll 1, spike trap 1d4, 3 damage, 9 to 6 HP       | Dependent on missing information: the book has trap cards, not a Trap Table                                                   | `issue.gameplay_example.trap_table` (unresolved)                                                         |
| Trap: Sanity −1                                                | Source-conflicted: the Sanity table gives −2. Resolved by changelog 2.21 entry 22 (−2)                                        | `issue.gameplay_example.trap_sanity` (resolved)                                                          |
| Trap: Party Morale 12 to 11                                    | Executable                                                                                                                    | `test.gameplay_example.trap_party_morale`                                                                |
| Furniture Table chest roll 1: Wonderful Treasure               | Descriptive; agrees with `table.treasure.furniture` (its findings cell is text)                                               | —                                                                                                        |
| Legendary Item: 1d6 3 "left column", 1d12 4, Gauntlets         | Source-conflicted with the Legendary Items table (3-4 column, 1d10)                                                           | `issue.gameplay_example.legendary_roll` (unresolved)                                                     |
| Turn 2 door: Threat 9 to 10, d6 2, d10 8 locked, 15 HP         | Executable (Threat +1, not trapped, locked hand-off)                                                                          | `test.gameplay_example.door_opened_locked`                                                               |
| Belleck forces the door: 9 damage, 6 HP, Threat 12             | Executable                                                                                                                    | `test.gameplay_example.belleck_bashes_door`                                                              |
| Wandering Monster token at Threat 12                           | Dependent on quest-specific information (the quest sets 12)                                                                   | —                                                                                                        |
| Grol breaks the door: 6 damage, Threat +2 (14)                 | Executable                                                                                                                    | `test.gameplay_example.grol_breaks_door`                                                                 |
| Room roll 34, encounter at 50 or below                         | Executable; the procedure also ends the turn on placement                                                                     | `test.gameplay_example.room_encounter`                                                                   |
| Encounter List gives a Giant Spider; 2d6 placement             | Dependent on missing information (quest list, Bestiary)                                                                       | —                                                                                                        |
| 4 hero tokens and 1 spider token; spider acts in the same turn | Source-conflicted with Initiative (bashed door +2) and The Turn (new turn on placement). Resolved by changelog 2.21 entry 27  | `test.gameplay_example.spider_initiative`; `issue.gameplay_example.spider_turn` (resolved)               |
| Spider charge, bite 72 against CS +10                          | Dependent on missing information (Bestiary Combat Skill)                                                                      | —                                                                                                        |
| Wandering Monster moves 4 squares                              | Descriptive; agrees with `procedure.wandering_monster`                                                                        | —                                                                                                        |
| Turn 3 Threat Roll 10, in battle, decrease 3 (14 to 11)        | Executable with the in-battle table result supplied. The table gives 4-5 Healing and 6 Frenzy; the example names Frenzy for 5 | `test.gameplay_example.threat_roll_in_battle`; `issue.gameplay_example.threat_table_result` (unresolved) |
| Giant Spider fear, Fear Test with torch +5                     | Dependent on missing information (Bestiary fear rule, no RES values)                                                          | —                                                                                                        |
| Power Attack: CS 46 +20 −5, needs 61, rolls 53                 | Executable                                                                                                                    | `test.gameplay_example.power_attack_threshold`                                                           |
| Damage 7 less Natural Armour 1 is 6                            | Executable                                                                                                                    | `test.gameplay_example.spider_damage`                                                                    |
| Spider left on 19 HP                                           | Dependent on missing information (Bestiary Hit Points)                                                                        | —                                                                                                        |

The fixtures keep the example's own arithmetic, so the Threat values follow the example even
though `issue.gameplay_example.chest_threat` means they would each be one higher under the
procedure. The two resolved conflicts follow the cited ruling, and their fixtures cite both the
page and the changelog entry.

### Issues raised

Unresolved: `issue.game_basics.threat_roll_equality`,
`issue.game_basics.threat_removal_house_rules`, `issue.gameplay_example.chest_threat`,
`issue.gameplay_example.trap_table`, `issue.gameplay_example.legendary_roll`,
`issue.gameplay_example.threat_table_result`.

Resolved by a published ruling: `issue.gameplay_example.trap_sanity` (changelog 2.21 entry 22)
and `issue.gameplay_example.spider_turn` (changelog 2.21 entry 27).

The review digest picks up an issue only through a `related` object in scope. Every new issue
relates to a rule or fixture in these sections except `issue.gameplay_example.legendary_roll`,
which relates only to `table.treasure.legendary` (Appendix V). A reviewer of this unit has to
look it up by name.

### Tests changed

- `tests/examples/core/gameplay-example.yaml`: 11 new source-example fixtures, run by
  `tests/rules/pilot.test.ts`.
- `tests/schema/review.test.ts`: the resolved-issue list now includes the two new resolved
  issues.
- `tests/reports/chapters.test.ts`: the real-corpus check expected Difficulty to have no
  records. It now expects Difficulty to have left the unfinished list, and keeps the Basic
  Stats check.

### Gates

`npm run validate`, `npm test`, `npm run report:coverage`, `npm run lint`, `git diff --check`
and `npm run review -- digest section.introduction section.game_basics --descendants` were run
at the end of this unit; results are in the session report. No review record was written.

## 2026-10-07 — Into the Dungeons: The Threat Level rules

Scope: `section.into_the_dungeons.the_threat_level` only. Its procedure and example were
already extracted in Phase 6 (`procedure.threat_roll`); the rules under the heading were not.
Prompted by the Game Master's table, which had to ask for the post-battle Threat increase.

### Pages inspected

| PDF | Printed | Content                                                                                    |
| --- | ------- | ------------------------------------------------------------------------------------------ |
| 89  | 88      | The Threat Level; Decreasing, Max and Increasing Threat Level; Effect of Triggering (read) |

Rendered and read, not only text-dumped.

### New canonical objects

[corpus/rules/core/threat-level.yaml](../../corpus/rules/core/threat-level.yaml):

- `core.threat.starting_level`: the quest gives the starting Threat Level.
- `core.threat.new_level_reset`: reset on each new level of a multilevel dungeon. Value
  unresolved: `issue.threat.new_level_reset_value`.
- `core.threat.floor`: never below 2, or the quest minimum.
- `core.threat.max_level`: equalling a quest's max triggers a Wandering Monster. Review:
  `issue.threat.max_level_semantics`.
- `core.threat.increase.battle_won`: +1 when the party wins a battle. Review:
  `issue.threat.battle_won_scope`.
- `core.threat.increase.door_chest_or_cobweb`: +1 the instant a door or chest is opened or a
  cobweb opening is cleared.
- `core.threat.increase.threat_roll_exceeded`: +1 when a Threat Level roll exceeds Threat.
- `core.threat.increase.force_open` and `core.threat.increase.force_open_crowbar`: +2 for
  attempting to force a door or chest, +1 instead with a crowbar.

`procedure.dungeon_turn` step 4 (`increase_threat`) now binds `object_id:
core.threat.increase.battle_won`; the four `test.dungeon.turn_*` fixtures that recorded the
unbound label were updated.

### Tests

- `tests/rules/threat-level.test.ts`: 13 cases over the new rules.
- `tests/examples/core/dungeon-turn.yaml`: invoke trace now names the bound rule.
- `clients/web/tests/gm-rules.test.ts`: the table's fixed Threat sources are checked against
  these rules.

### Gates

`npm run validate`, `npm test`, `npm run lint` and `npm run report:coverage` were run at the
end of this unit; results are in the session report.

## Review corrections — 7 October 2026

Applied the `open` findings of `review.introduction.1` and `review.game_basics.1`. Each was
checked against PDF pages rendered in this session: PDF 16, 17, 18 (printed 14, 15, 16), 20,
21, 22, 23 (printed 18–21) and 101 (printed 99). The review records were not edited. Both are
now stale and need a fresh review.

1. `core.quest.end_uncertain`: `source_text` now quotes the End of the Quest entry in full,
   including "If an effect lasts ‘until the end of the quest’, it will last until you get your
   next reward.", and the full Until end of (next) quest entry ("This term indicates that
   …"). The two passages are joined with "...". The PDF 17 source now has
   `section: Abbreviations and Terminology`. `issue.0004` now quotes both full entries and
   notes that the two headwords use different phrases.
2. Dice Rolling and Skill Checks: `core.check.success` now has a PDF 18 / printed 16 source
   and quotes "A result equal to or less than the skill or stat level will result in a
   success." The coverage note names it. I did not add the source to `core.check.standard`:
   that record models the failure branch, and the PDF 18 sentence only states success.
3. `core.optional.scenario_and_threat`: `source_text` now includes the second Complexity
   paragraph verbatim. The paraphrase was removed from `unresolved_references`, and
   `issues: [issue.game_basics.threat_removal_house_rules]` was added. The Complexity coverage
   note now says the bullets are joined with semicolons.
4. `test.core.los.blocked.diagram_a_to_b`, `test.core.los.obstructed.diagram_a_to_c` and
   `test.core.los.clear.diagram_a_to_d` now quote the printed "Example:" caption instead of
   the rule paragraph. A/B uses the first sentence. A/C and A/D use the second sentence, which
   covers both squares. Their outcomes are unchanged.
5. Gameplay Example fixtures:
   - Added `test.gameplay_example.chest_open_roll`: d10 3 looks up Open, d6 6 is trapped,
     and the chest reveal invokes the Furniture table. It also shows the procedure's +1 Threat
     (9 to 10), which the example leaves out. It is linked to `.chest_threat` and
     `.trap_table`.
   - Added `test.gameplay_example.azira_trap_damage`: `combat.damage.basic` then
     `character.hit_points.loss`, 3 damage with no Natural Armour, 9 to 6 HP. It is linked to
     `.trap_table`.
   - Added `test.gameplay_example.chest_furniture_roll`: Chest roll 1 gives "1 Wonderful
     Treasure.".
   - `test.gameplay_example.door_opened_locked` now looks up d10 8 and gets Locked.

   To make the lookups executable, `procedure.open_door_or_chest` gained a `d10_roll` input
   and a `lookup` on `table.dungeon.door_chest_difficulty` (Door/chest column) in
   `check_locked`. `character.treasure.furniture.chest` gained a `roll` input and a `lookup`
   on `table.treasure.furniture.chest`. The two derived `test.phase6.open_door.*` cases and
   three runs in `tests/rules/phase-six-batch-two.test.ts` now supply `d10_roll`.

   Not done: "Pick lock: -10, HP 15" cannot be looked up. The Difficulty column mixes text
   with a "-" marker, and the lookup vocabulary only returns number or text columns. The door
   HP of 15 is therefore still supplied to `test.gameplay_example.belleck_bashes_door`. The
   coverage note records this.

6. The `section.game_basics.gameplay_example` coverage note was rewritten to stand alone. It
   lists every fixture with its outcome, every non-fixture step with its reason (Trap Table,
   Sanity −1, Legendary rolls, Wandering Monster, random placement and target, Bestiary
   profile, Fear Tests and torch), and the issue ids. The ledger pointer and the claim that
   all executable steps are fixtures were removed.
7. `issue.gameplay_example.legendary_roll`: added `section.game_basics.gameplay_example` to
   `related`. The summary and status are unchanged.

`visually_verified` was set to true only for rules whose sources were on these rendered pages
and whose wording I read: `core.quest.end_uncertain`, `core.dice.percentile`,
`core.rounding.up`, `core.rounding.down`, `core.optional.*` (all five),
`core.action_points.allocation`, `core.movement.wall` and `core.turn.psychology`.
`core.los.trace` and `core.model.footprint` were left unchanged. Each sentence is printed on
the page, but `core.los.trace` joins two sentences from different paragraphs, and
`core.model.footprint` drops the lead-in "The only rule to remember is that".

