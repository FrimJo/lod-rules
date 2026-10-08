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

## Tier 2 — Character Basics, Creating Your Character, Levelling Up — 7 October 2026

Scope: the 63 sections under `section.party_management` (the part node, PDF 25), `section.character_basics`
(16), `section.creating_your_character` (34), `section.levelling_up` (11) and
`section.embarking_on_your_first_quest` (1). All 63 are now
`extracted`. None is `reviewed`.

### Pages inspected

Every page was rendered and read, not only text-dumped:

| PDF   | Printed | Content                                                                                                    |
| ----- | ------- | ---------------------------------------------------------------------------------------------------------- |
| 25    | (none)  | Party Management divider                                                                                   |
| 26    | 24      | Character Basics; The Character; Basic Stats; DB; NA; Energy; Luck                                         |
| 27    | 25      | Luck (end); Movement; Sanity; Species and Traits; HP; Profession; Skills; Perks; Talents                   |
| 28    | 26      | Skills List                                                                                                |
| 29    | 27      | Choosing Your Species; Strength and Weapon Class table and example; DB/NA tables; Hit Points; Mana; Energy |
| 30–31 | 28–29   | Dwarf, Elf, Halfling, Human                                                                                |
| 32    | 30      | Profession and Talents; Free Skill example; Starting Equipment                                             |
| 33    | 31      | Final Touches; Wilbur example                                                                              |
| 34–41 | 32–39   | The eight professions and their skill tables                                                               |
| 59    | 57      | Embarking on your First Quest                                                                              |
| 60    | 58      | Levelling Up table; Stats and Skills Maximum, example and table                                            |
| 61    | 59      | Increasing your Skills and Basic Stats table; Elves box                                                    |
| 62    | 60      | Talents and Perks tables; Halflings box                                                                    |

To check cross-references, these were also rendered: PDF 51 (printed 49, the Equipment copy of
the weapon class table) and changelog page 23 (2.21 entries 135–149). Text was compared, not
rendered, for PDF 64 (Mana, RDU), PDF 70 (Identifying), PDF 126 (Rations and Resting), PDF 134
and 146 (Level Up activity) and PDF 144 (Buying and Selling). The FAQ has no entry for these pages
beyond the existing Ranger bow ruling.

### Per-section disposition

Character Basics:

| Section                                  | Disposition                                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.party_management`               | All not applicable: divider page.                                                                                                                                         |
| `section.character_basics`               | Rules: new `character.party.composition`. The Companions’ Expansion is now `external_references: companions_compendium`.                                                  |
| `.the_character`                         | All not applicable: two introductory sentences.                                                                                                                           |
| `.basic_stats`                           | Glossary (five stat terms). Rules: new `character.stat.basic_stats` and `character.stat.{strength,constitution,dexterity,wisdom,resolve}.effects`.                        |
| `.damage_bonus_db`, `.natural_armour_na` | Rules: new `character.damage_bonus.definition`, `character.natural_armour.definition`. Glossary: tier 1 terms (see below).                                                |
| `.energy_e`, `.luck_l`, `.movement_m`    | Already represented. `character.energy.initial` now also cites the Energy run-in on PDF 29.                                                                               |
| `.sanity`                                | Rules: new `character.sanity.zero_disorder`. "page 53" bound to `section.psychology.sanity`.                                                                              |
| `.species`                               | Glossary: new `term.trait`. Rules: new `character.species.choice`, `character.species.traits_are_talents`. Entities not applicable (catalogued under their own headings). |
| `.hit_points_hp`                         | Rules: new `character.hit_points.definition`.                                                                                                                             |
| `.profession`                            | Rules: new `character.profession.adjustments`. Glossary and entities not applicable.                                                                                      |
| `.skills`                                | Rules: new `character.skill.profession_levels`; existing `.stat_independence`, `.known`.                                                                                  |
| `.perks`, `.talents`                     | Rules: new `character.perk.acquisition`, `character.talent.acquisition`, `character.ability.kinds_summary` (the boxed summary). Page pointers bound to Appendix I and II. |
| `.skills_list`                           | Glossary: nine new skill terms. Rules: 19 new `character.skill.*` rules, one or more per skill entry. Table already extracted.                                            |

Creating your Character:

| Section                                                                                     | Disposition                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `section.creating_your_character`                                                           | Rules: new `character.creation.hit_points` for the Hit Points run-in. The Energy run-in is a second source of `character.energy.initial`. Tables are the species stat rows.                                                    |
| `.choosing_your_species`                                                                    | Rules: new `character.creation.species_first`, `.roll_stats`, `.roll_all_option`, `.strength_weapon_class`. Examples: four new fixtures.                                                                                       |
| `.choosing_your_species.table`                                                              | Represented by `table.equipment.weapon_class_strength`, which now also cites PDF 29 (same six rows as PDF 51). It had no record before.                                                                                        |
| `.choosing_your_species.table_2`, `.damage_bonus_and_natural_armour(.natural_armour_table)` | Already represented. Parent tables component set to extracted (child rows).                                                                                                                                                    |
| `.mana`                                                                                     | Already represented; issue updated (below).                                                                                                                                                                                    |
| `.profession_and_talents`                                                                   | Rules: new `character.creation.profession_talents`, `character.skill.starting_value`, `character.skill.free_skill`, `character.creation.spells_and_prayers`, `character.creation.background_optional`. Example: new fixture.   |
| `.starting_equipment`                                                                       | Rules: new `character.creation.starting_coins`, `.small_backpack`, `.buy_before_game`, `.buy_after_start`.                                                                                                                     |
| `.final_touches`                                                                            | Rules: new `character.creation.starting_sanity` (links `character.sanity.initial`, which already exists in Psychology), `character.level.initial`, `character.creation.party_morale`, `character.creation.repeat_until_party`. |
| Species, profession and table rows                                                          | Already extracted. Notes rewritten to stand alone. Rules set to not applicable for Elf, Human and Warrior, whose pages have no rule paragraph.                                                                                 |

Levelling Up:

| Section                                   | Disposition                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `section.levelling_up`                    | Already represented (`character.level.*`, table, procedure). Rules and tables moved from extracting to extracted.             |
| `.stats_and_skills_maximum`               | Already represented, including the CS 80 example fixture. `character.stat.maximum_*` quote "However, there is…" verbatim now. |
| `.increasing_your_skills_and_basic_stats` | Rules: new `character.advancement.improvement_points`, `.increase_limits`, `.cost_doubling`, `.save_points`.                  |
| `.talents_and_perks`                      | Rules: new `character.advancement.talent_and_perk_choice`.                                                                    |
| `.elves`, `.halflings`                    | All not applicable: setting fiction boxes.                                                                                    |

Most new rules on these pages are `definition` records: the paragraph names a mechanic whose
operative rule is elsewhere (Damage Bonus, Hit Points, weapon class, Party Morale). They quote the
text and link the operative record as a dependency, as tier 1 did for `core.overview.threat_level`.
Executable new rules: Sanity zero, Dodge, Arcane Arts learning and identification limits, Barter,
Heal, Foraging, Pick Locks (five rules), Perception, Battle Prayers, starting skill, Free Skill,
starting coins, backpack, buying before and after the game, starting level, Improvement Points,
increase limits and cost doubling.

Embarking on your First Quest (added to this unit on request; PDF 59 / printed 57 per
`pages.yaml`, one section with no children):

| Section                                 | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.embarking_on_your_first_quest` | Table: new `table.settlement.start_settlement` (the eight numbered start settlements, 8 = Re-roll.; no die named: `issue.embarking.start_settlement_die`). Rules: new `core.quest.start_settlement`, `core.quest.first_quests`, `core.quest.locations_listed`, `core.quest.return_for_reward`; existing `core.quest.location`, `core.quest.travel`. The ‘Entering the Dungeon’ pointer has no matching chapter and is kept in `unresolved_references`. Derived fixtures `test.core.quest.start_settlement.windfair` and `.reroll`. |

### Changed existing records

- Procedures `procedure.character_creation*` (5) and `procedure.character_level_up`,
  `.character_improve`, `.character_level_ability`, `.character_finish_advancement`: every
  `source_text` (top level and steps) now quotes the page; paraphrases were replaced. Effects
  were not changed. The species-choice steps also cite PDF 29.
- `species.dwarf`, `.elf`, `.halfling`, `.human`: `source_text` now matches the page ("Hit
  Points: 1d6+8" has no full stop) and marks the gap to Limitations and Special with "...". The
  species rules and fixtures now cite the printed headings (Limitations, Special, Halfling)
  instead of invented ones.
- `test.character.wilbur_morale_example` now quotes the example itself.
- `table.equipment.weapon_class_strength` gained the PDF 29 source.
- `visually_verified: true` on the in-scope rules and terms whose wording was read.
- Sections: `see_also` bindings for the page pointers listed in the coverage notes, and
  `external_references: [companions_compendium]` on Character Basics.

### Examples

| Example                                   | Classification | Fixture                                                                                                               |
| ----------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Weapon class 3, 5 and 6 (PDF 29)          | Executable     | `test.character.creation.weapon_class_example.{class_3_two_hands,class_3_one_hand,class_5_one_hand,class_6_one_hand}` |
| Warrior Free Skill on Pick Locks (PDF 32) | Executable     | `test.character.creation.free_skill_example` (-20 becomes -10)                                                        |
| Wilbur RES 37 (PDF 33)                    | Executable     | existing `test.character.wilbur_morale_example`, text corrected                                                       |
| Warrior CS 80 (PDF 60)                    | Executable     | existing `test.skill.book_effective_value`                                                                            |

The "Character creation example" pointer on PDF 33 refers to the example after Backgrounds
(`section.backgrounds.character_creation_example`), which is outside this scope.

### Issues

New, unresolved: `issue.embarking.start_settlement_die`, `issue.character_basics.identify_attempts` (one try per wizard per quest on PDF
28, one per party and object on PDF 70), `issue.character_basics.foraging_travel` (once during
travel for 1 Ration on PDF 28, once per day feeding everyone on PDF 126),
`issue.character_basics.barter_terms` (whether the selling premium covers only parts; no
rounding).

Updated: `issue.phase4.mana_rounding`. Changelog 2.21 entries 139 and 141 add RDD to the Wisdom
and Mana lines, but the Magic chapter (PDF 64) prints RDU and no entry changes it. The issue
stays unresolved and no effect changed. Changelog 2.21 entry 140 adds "All heroes get the
"Heroic Force of Will" perk at the start." to printed page 25; every profession already grants
it, so nothing changed.

### Tier 1 records left unchanged

`term.damage_bonus`, `term.natural_armour`, `term.hit_points`, `term.movement`, `term.skill`,
`term.perk` and `term.talent` belong to the reviewed Abbreviations and Terminology section. They
could cite the matching Character Basics page as a second source; that would make the
Introduction review stale, so it is left for the review follow-up. `term.hit_points` says
"knocked out" where PDF 27 says "bleeding out".

### Tests

- `tests/examples/characters/character-basics.yaml`: 19 derived cases for the new skill and
  Sanity rules.
- `tests/examples/character/creation-and-levelling.yaml`: 5 source-example fixtures and 9
  derived cases.
- `tests/reports/chapters.test.ts`: Basic Stats is no longer terms-only; the real-corpus check
  now uses Coins (no records).

### Gates

`npm run validate`, `npm test`, `npm run report:coverage`, `npm run lint`, `git diff --check`
and `npm run review -- digest <chapter> --descendants` for the three chapters were run at the
end of this unit; results are in the session report. Digest `section.party_management` without
`--descendants`, or it pulls in Backgrounds, Equipment and Psychology. No review record was
written.

## Tier 2 review corrections — 7 October 2026

Extraction-side corrections for the open findings of `review.embarking.1`,
`review.character_basics.1`, `review.levelling_up.1` and `review.creating_your_character.1`.
Each finding was checked against PDF pages rendered with PDFKit (PDF 21, 26–27, 29–31, 35–41,
59–62 and 147, plus changelog PDF 23). The review records were not edited and nothing was set
`reviewed`; the four records are now stale and need a new review run.

### Embarking on your First Quest

- `core.quest.travel` (PDF 59): `source_text` now ends with the printed clause "…to reach their
  Quest Site, according to the description given in the ‘Travelling and Skirmishes’ chapter."
  The pointer is bound in `see_also` and as a dependency on `section.travelling_and_skirmishes`.

### Character Basics

- `section.character_basics.the_character.luck_l`: the section row ends on printed 25 / PDF 27,
  where the Luck paragraph ends.
- `term.settlement_visit`: the id and name are kept because rules use the term as a timing
  reference. The definition now quotes both printed sentences that bound the period (PDF 26–27)
  and cites both pages. The glossary schema has no field for a corpus-coined label, so the
  label status is recorded in the new unresolved `issue.character_basics.settlement_visit_label`
  and in the `luck_l` coverage note. The reviewer suggested that the book never names a
  settlement visit. That is not quite right: Perfect Result (PDF 21) prints "once between each
  settlement visit" and Rest and Recuperation (PDF 147) prints "the next visit to a
  settlement". The issue says that the phrase is printed but never defined, and that the Luck
  paragraph does not use it. It links no Game Basics object, so `review.game_basics.2` stays
  fresh.
- `character.perk.acquisition`: now links `issue.character_basics.perks_at_level_one`. Changelog
  2.21 entry 140 ("Page 25 changed and added 'All heroes get the "Heroic Force of Will" perk at
  the start.'") states the rule outright, so the issue is resolved under the official-rulings
  convention. The printed sentence stays verbatim. No effect changes, because every profession
  already grants `perk.heroic_force_of_will`. The perks coverage note,
  `review/designer-published-rulings.md` and the resolved-issue list in
  `tests/schema/review.test.ts` were updated to match.

### Levelling Up

- `table.character.improvement_costs`: the paraphrased footnote is removed (`footnotes: []`).
  PDF 61 prints no footnote, and the paragraph is quoted by the `character.advancement.*` rules.
- `table.character.stat_maxima`: the heading is now "Stats and Skills Maximum", the method is
  `table`, `locator.table` is "Uncaptioned stat maxima table", and `source_text` is the full
  printed sentence "However, there is a maximum value for each stat depending on their race."
- Coverage notes for `section.levelling_up.table` (PDF 60, `table.character.level_progression`),
  `…increasing_your_skills_and_basic_stats.table` (PDF 61, `table.character.improvement_costs`),
  `…talents_and_perks.table_talents` and `…table_perks` (PDF 62,
  `table.character.talent_progression` / `perk_progression`) were rewritten to stand alone,
  each naming its single page and its table id.
- `issue.character.improvement_seventy_boundary`: the PDF 60 source is dropped, and
  `character.advancement.cost_doubling` is added to `related`.

### Creating your Character

- Headings now match the printed run-in headings. The four profession `equipment_limits` rules
  (Barbarian, Ranger, Rogue, Wizard) use "Limitations", and so do the 8 matching source
  headings in `tests/examples/characters/profession-catalogue.yaml`. The six profession skill
  tables use "Skills", with `locator.table` "<Profession> Skills" as Alchemist already does.
  The species stat tables use "Dwarf", "Elf", "Halfling" and "Human".
  `table.character.damage_bonus` and `.natural_armour` use "Damage Bonus and Natural Armour".
  Every heading was checked on PDF 29–31 and 35–41.
- `character.profession.thief.treasure_choice`: the extractor note in
  `unresolved_references` is removed. The page has no unbound pointer, and `see_also` still
  binds `section.treasure`.
- `species.dwarf`: the Hate Goblins grant is bound to `talent.hate`, and its qualifier stays
  Goblins.
- `species.halfling`: added a `talent.lucky` grant ("Lucky (Starts with 1 Point of Luck).").
  `character.species.halfling.initial_luck` is kept. The pages do not say whether the trait's
  starting Luck and the talent's +1 stack, so the new unresolved
  `issue.creating_your_character.halfling_lucky_stacking` records that, and the rule links it.
- Reviewer's minor note: the Alchemist and Thief rows now mark `tables: not_applicable`, as the
  other six professions do, because each skill table is its own `.table_skills` row.
- The Dwarf and Halfling coverage notes now mention the bindings and the new issue.

## Tier 3 — Psychology — 7 October 2026

Scope: the 9 sections under `section.psychology` (PDF 55–58, printed 53–56 per `pages.yaml`; PDF 56 /
printed 54 is full-page art). All 9 are now `extracted`. None is `reviewed`. This unit was mostly
disposition and verification of the Phase 4 and Package F records; the new records are the pointer
and definition paragraphs the earlier passes left out.

### Pages inspected

| PDF | Printed | Content                                                                                                      |
| --- | ------- | ------------------------------------------------------------------------------------------------------------ |
| 55  | 53      | Psychology intro; Sanity and its loss table; Conditions; Reducing Insanity, or Increasing Sanity; The Asylum |
| 56  | 54      | Full-page art, no folio text                                                                                 |
| 57  | 55      | Uncaptioned 1d10 condition table; Lingering Trauma Table                                                     |
| 58  | 56      | Party Morale; Calculating; Adjusting (table); Reaching Half Morale (RDD); Reaching 0 Morale; Resetting       |

The rendered pages were read, not only text-dumped. The text dump (`inspect-pdf.ts 55 58`) was used
only to confirm spelling ("Randomise", "the priests the at the asylum").

### Per-section disposition

| Section                                | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.psychology`                   | All not applicable: the opening paragraph is narrative. Child rows hold the mechanics.                                                                                                                                                                                                                                                                                                                                                   |
| `.sanity`                              | Rules already represented (`character.sanity.initial`, `character.sanity.loss.*`). Glossary n/a (`term.sanity`, Character Basics). Tables n/a: `table.psychology.sanity_losses` is on `.sanity.table`. Examples and entities n/a. `external_references: bestiary` removed (the Bestiary is named on PDF 57, not here); "See Exploration Card" kept as an unresolved reference.                                                           |
| `.sanity.conditions`                   | Rules already represented. Example "two active conditions … maximum Sanity is now 6" is executable: `test.character.sanity.acquire_condition.second_condition`. Entities n/a: the nine `condition.*` cite `section.psychology.table` where the rows are printed. `see_also: section.psychology.table` for "the table on page 55".                                                                                                        |
| `.sanity.reducing_insanity`            | Rules: new `character.sanity.recovery_routes` (the list of routes, generic mentions in `unresolved_references`) and `character.sanity.asylum_pointer` (The Asylum, bound to `section.settlements.treat_mental_conditions` and `character.settlement.asylum`). The old note's claim that The Asylum was pending is closed. Tables, examples, entities n/a.                                                                                |
| `.party_morale`                        | Rules: new `character.morale.definition` and `character.morale.adjustment`; the rest already represented. Examples: "if two heroes are poisoned, you suffer a -2 modifier" is `test.character.morale.event.poison_or_disease.two_heroes`; "between 8 to 12" is descriptive. Procedures n/a (single-step adjustments and a flee hand-off, no printed sequence). `see_also: section.travelling_and_skirmishes.events` for ‘Travel Events’. |
| `.sanity.table`, `.party_morale.table` | Already extracted; notes rewritten, headings corrected (below).                                                                                                                                                                                                                                                                                                                                                                          |
| `.table`                               | Already extracted; note rewritten. `condition.hate` now binds `talent.hate` in `grants`.                                                                                                                                                                                                                                                                                                                                                 |
| `.table_lingering_trauma_table`        | Already extracted; `rules` set to extracted because `character.sanity.trauma_trigger` cites this row. Note rewritten.                                                                                                                                                                                                                                                                                                                    |

### Quote and heading corrections

- Headings. The PDF 57 condition table prints no heading. The invented "Psychology table" and
  "Mental conditions table" headings (57 sources in rules, entities, tables, procedures and
  fixtures, including `character.condition.trauma_expiry` and
  `.arachnophobia_other_encounters` in `corpus/rules/core/`) now cite the chapter heading
  "Psychology" (the table node's parent) with `locator.table: Uncaptioned mental conditions
table`. `heading` must be a non-empty string under `mechanics.schema.json`, so `null` was not an
  option. `table.psychology.sanity_losses` cites "Sanity" (locator "Uncaptioned Sanity loss
  table") instead of "Sanity table"; `table.psychology.morale_adjustments` cites "Adjusting the
  Morale" (locator "Uncaptioned Party Morale adjustment table") instead of "Party Morale table".
- Party Morale rules and fixtures now cite their printed run-in headings: Calculating Party
  Morale (`member_contribution`, `sum_contributions`), Adjusting the Morale (`event.*`, with a
  row locator), Reaching Half Morale (RDD) (`wavering`, `recovered`, `threshold_uncertain`),
  Reaching 0 Morale (`flee`, `retry_quest`, `outside_bounds`), Resetting the Morale (`reset`).
  Their PDF 58 sources are now `visually_verified: true`.
- `character.morale.event.*` `source_text` now quotes the row cells in printed order joined with
  " / " (Situation / Description / Effect) instead of the reordered "Situation: effect.
  Description" form. `character.sanity.loss.miscast` and `.room_event` likewise ("Miscasting a
  spell / -1d3", "Certain room events / See Exploration Card").
- `character.sanity.initial` quotes the whole sentence "This is referred to as Sanity, and all
  heroes start with 8 Points of Sanity." (the old quote re-capitalised "all").
- `character.morale.flee` and `.threshold_uncertain` mark the skipped sentence with "...";
  `character.morale.outside_bounds` quotes the full first sentence.
- "Randomize" → "Randomise" (printed spelling) in `table.psychology.mental_conditions`,
  `condition.irrational_fear`, `character.condition.irrational_fear` and
  `procedure.irrational_fear`.
- `character.morale.flee`'s Travel Events dependency now points at
  `section.travelling_and_skirmishes.events`.
- `character.morale.event.dwarven_ale` links `character.equipment.consumable.dwarven_ale.drink`
  as a dependency: the row's "effectiveness of the party diminishes" is the item's own -10 rule.
- `issue.*` sources still say "Psychology table"; issue records were not edited.

### Examples

| Example                                              | Classification | Fixture                                                                                                                                                           |
| ---------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two active conditions, maximum Sanity 6 (PDF 55)     | Executable     | `test.character.sanity.acquire_condition.second_condition` (quote fixed)                                                                                          |
| Two heroes poisoned, -2 modifier (PDF 58)            | Executable     | `test.character.morale.event.poison_or_disease.two_heroes` (quote fixed)                                                                                          |
| Starting party Party Morale between 8 to 12 (PDF 58) | Descriptive    | none                                                                                                                                                              |
| Wilbur RES 37 → 3 (PDF 33, not this chapter)         | Executable     | frozen `test.character.wilbur_morale_example`; `test.character.morale.member_contribution.wilbur` is now a `derived_case` instead of claiming to quote an example |

### Issues

No new issues. Existing unresolved issues are named in the coverage notes. `issue.gameplay_example.trap_sanity` is frozen and untouched.

### Frozen objects

`term.sanity`, `term.party_morale`, `core.optional.*`, `core.turn.psychology`,
`character.creation.party_morale`, `character.creation.starting_sanity`,
`character.sanity.zero_disorder` and their fixtures were referred to but not edited. All six `.2`
review records stayed `fresh`.

### Tests

Fixture edits only (`tests/examples/psychology/*.yaml`, `tests/examples/core/*.yaml` headings).
`gold.morale.hero_dies` in `tests/fixtures/semantic-decisions-gold/cases.yaml` got a new
`source_text_sha256` for the re-quoted `character.morale.event.hero_dies`; its expected labels are
unchanged. No TypeScript test changed; `tests/reports/chapters.test.ts` has no Psychology assertion.

### Gates

`npm run validate`, `npm test`, `npm run lint`, `npm run report:coverage`, `npm run review -- check`
and `git diff --check` were run at the end of this unit; results are in the session report
(validate and test failures present at that time came from the concurrent Equipment unit).

## Tier 3 — Equipment — 7 October 2026

Scope: the 18 sections under `section.equipment` (PDF 51–54, printed 49–52 per `pages.yaml`).
All 18 are now `extracted`. None is `reviewed`.

### Pages inspected

Every page was rendered and read, not only text-dumped:

| PDF | Printed | Content                                                                                                                                                                          |
| --- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 51  | 49      | Equipment banner; Coins; Different Kind of Equipment; Weapons; DMG; ENC; Class, table and Example; Special; Reload; Durability (DUR); Armours and Shields                        |
| 52  | 50      | Defence (DEF); ENC; Covers; Special; Durability (DUR); Tier; General Equipment; ENC; Durability; Carrying Equipment; Hands; Quick Slots; Quiver (Optional rule); Stacking armour |
| 53  | 51      | Stacking armour (end); Backpack; Encumbrance; Buying and Selling equipment; Repairing Equipment; Mithril                                                                         |
| 54  | 52      | What Equipment to Bring?                                                                                                                                                         |
| 29  | 27      | Strength and Weapon Class: the second printing of the class table and example (no footnote under either copy)                                                                    |

### Per-section disposition

| Section                                                                                | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.equipment`                                                                    | All not applicable: the root owns only the banner; every paragraph belongs to a subsection.                                                                                                                                                                                                                                                                                                                                                                                      |
| `.coins`                                                                               | Glossary: `term.coins` (frozen, cites PDF 16 only). Everything else not applicable: one paragraph of currency flavour, no table (the class table under Class keeps the legacy node id `.coins.table`, parent `.weapon_class`). Extracted with zero records.                                                                                                                                                                                                                      |
| `.different_kind_of_equipment`                                                         | Span extended to PDF 52. Rules: new `character.equipment.weapon_damage.definition`, `.encumbrance.definition` (three ENC run-ins), `.special_rules.definition` (both Special run-ins), `.defence.definition`, `.covers.definition`, `.armour_tier.definition`; re-homed `character.equipment.reload` and `.enemy_weapon_stats`. Glossary: new `term.reload`, `term.covers`, `term.tier`; DMG/ENC/DEF/DUR are frozen tier 1 terms. Tables and examples belong to `.weapon_class`. |
| `.weapon_class` (Class)                                                                | Rules: `character.equipment.weapon_class.one_hand`, `.two_hands` (verbatim Class paragraph, second source PDF 29, Huge shield exception linked as a dependency), `character.equipment.weapon.arbalest_strength` (now the printed Special cell). Glossary: new `term.weapon_class`. Tables: own node. Examples: frozen `test.character.creation.weapon_class_example.*` (see gap below).                                                                                          |
| `.coins.table`                                                                         | `table.equipment.weapon_class_strength`: invented footnote removed, `locator.table` and `method: table` on both sources.                                                                                                                                                                                                                                                                                                                                                         |
| `.weapon_durability`, `.armour_and_shield_durability`, `.general_equipment_durability` | Already represented by `character.durability.standard`, `.armour_damage`, `.gear_marker`, `.broken`. Headings corrected to the printed "Durability (DUR)" / "Durability" with `section` disambiguating; `standard` and `broken` now quote each printing and `broken` cites all three. Glossary: `term.durability` (frozen). Page pointers bound.                                                                                                                                 |
| `.carrying_equipment`                                                                  | Rules: `character.equipment.quick_slots` (full sentence now), `.quick_access`; headings "Quick Slots". Glossary: new `term.quick_slot`. Procedures not applicable (marking slots 1–3 is bookkeeping).                                                                                                                                                                                                                                                                            |
| `.hands`, `.backpack`, `.quiver`                                                       | Already represented; quiver now quotes the paragraph under the printed heading "Quiver (Optional rule)". Other components not applicable with page reasons.                                                                                                                                                                                                                                                                                                                      |
| `.stacking_armour`                                                                     | `character.equipment.stacked_armour` already quotes the whole paragraph (PDF 52–53); now depends on `character.equipment.armour.stackable` and `character.durability.armour_damage`.                                                                                                                                                                                                                                                                                             |
| `.encumbrance`                                                                         | `character.encumbrance.penalty` now also quotes "The limit … equals the hero's strength."; `.limit` and `.feedback_uncertain` unchanged apart from `visually_verified`. Glossary: `term.encumbrance` (frozen).                                                                                                                                                                                                                                                                   |
| `.buying_and_selling_equipment`, `.repairing_equipment`, `.mithril`                    | `character.equipment.settlement_trade`, `.settlement_repair`, `.mithril.weapon`, `.mithril.armour_or_shield` now quote the printed sentences under the printed headings; ‘Settlements’ chapter bound to `section.settlements` and its Buying and Selling / Repair Equipment subsections.                                                                                                                                                                                         |
| `.what_equipment_to_bring`                                                             | All not applicable: advice; the 66% jacket sentence illustrates hit-location odds. Pointers (Heal Skill, Rations, Healing/Rest, light, lock picks) bound in `see_also`. Extracted with zero records.                                                                                                                                                                                                                                                                             |

### New and changed objects

- New rules (`corpus/rules/equipment/different-kind-of-equipment.yaml`): the six
  `character.equipment.*.definition` records above, each a `definition` with dependencies on the
  operative rule (`combat.damage.basic`, `character.damage_bonus.lookup`,
  `character.hit_points.loss`, `character.encumbrance.*`, `table.combat.hit_location`,
  `table.equipment.armour`, `table.equipment.shields`, `table.equipment.weapons`, the six
  `character.profession.*.equipment_limits`).
- New terms: `term.weapon_class` (Class; cites PDF 51 and 29), `term.reload`, `term.covers`,
  `term.tier`, `term.quick_slot`, with alias forms in `aliases.yaml`.
- Changed: `chapter-audit.yaml` (verbatim `source_text`, printed headings, `section_id` of reload
  and enemy_weapon_stats, see_also to Settlements and Appendix III Weapons);
  `encumbrance-durability.yaml` (headings, quotations, `visually_verified: true`, stacked armour
  dependencies); `core-boundaries.yaml` (`character.encumbrance.feedback_uncertain`
  `visually_verified: true`); `weapon-class-strength.yaml` (footnote removed, locators).
- Sections: `.different_kind_of_equipment` ends on PDF 52; `see_also` bindings and notes on
  eight Equipment nodes.
- Fixture headings in `tests/examples/equipment/*.yaml` now match the printed headings
  ("Class", "Weapons", "Quiver (Optional rule)", "Mithril", "Durability (DUR)", "Durability",
  "Quick Slots"). No fixture logic changed.

### Examples

| Example                                 | Classification | Fixture                                                                                                                                       |
| --------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Class 3 / Class 5 (PDF 51, under Class) | Executable     | Frozen `test.character.creation.weapon_class_example.{class_3_two_hands,class_3_one_hand,class_5_one_hand,class_6_one_hand}` (PDF 29 wording) |
| 66% jacket (PDF 54)                     | Illustration   | None; not a rule                                                                                                                              |

Known gap: the four frozen fixtures cite PDF 29 only, so the PDF 51 printing of the example has
no fixture citation. They belong to the reviewed Creating your Character digest and were not
edited; the `.weapon_class` coverage note records the gap.

### Issues

No new issues. Existing unresolved issues named in the notes: `issue.phase4.encumbrance_feedback`,
`issue.phase5.rogue_backpacks` (frozen). Nothing on PDF 51–54 contradicts another page: "See page
177" and "(page 178)" match the Appendix III Weapons and Armour and Shields pages in `pages.yaml`.

### Frozen objects

`term.coins`, `term.damage`, `term.durability`, `term.encumbrance`, `term.armour_protection`,
`core.optional.durability`, `core.optional.encumbrance`, `character.creation.strength_weapon_class`,
`character.creation.small_backpack`, `character.creation.starting_coins`,
`character.profession.*.equipment_limits` and `test.character.creation.weapon_class_example.*`
were referred to but not edited. All six `.2` review records stayed `fresh`.

### Tests

`tests/reports/chapters.test.ts`: the real-corpus no-records assertion moved from Coins (now
reconciled) to `section.into_the_dungeons.levers` (PDF 103, printed 101), and the test now
asserts that Coins is no longer unfinished.

### Gates

`npm run validate` (passed), `npm run lint` (passed), `npm run report:coverage` (regenerated),
`npm run review -- check` (six `.2` records fresh) and `git diff --check` (clean) were run at the
end of this unit. `npm test`: 3869 passed, one suite failed on `gold.morale.hero_dies`, whose
`source_text_sha256` no longer matches `character.morale.event.hero_dies` after the concurrent
Psychology unit changed that rule's `source_text`; no Equipment object is involved.

## Tier 3 review corrections — 7 October 2026

Extraction-side corrections for the open findings of `review.equipment.1`,
`review.psychology_sanity.1` and `review.psychology_party_morale.1`, plus one official ruling the
Party Morale reviewer surfaced. Each finding was checked against the rendered pages (PDF 51–53, 55
and 58, plus changelog PDF 4). The review records were not edited and nothing was set `reviewed`;
the three records are now stale and need a new review run. Nothing in
`generated/review/frozen-ids.txt` was touched, and the six `.2` records stayed `fresh`.

### Equipment

- `section.equipment.weapon_class`, examples (PDF 51): the printed Example under the class table
  reads "Example: A Class 3 weapon requires a minimum strength of 30 to use with two hands and a
  strength of 40 to use with one hand. However, a Class 5 weapon can never be used with only one
  hand." It is now quoted verbatim by three new `source_example` fixtures in
  `tests/examples/equipment/weapon-class-example.yaml`:
  `test.equipment.weapon_class_example.class_3_two_hands` (STR 30 with two hands; the required 30
  is read from `table.equipment.weapon_class_strength` by the lookup in
  `character.equipment.weapon_class.two_hands`, not supplied as an input),
  `.class_3_one_hand` (STR 40 with one hand satisfies `character.equipment.weapon_class.one_hand`)
  and `.class_5_one_hand` (one hand is refused at any strength). Each cites printed 49 / PDF 51,
  heading Class, locator paragraph Example. The frozen
  `test.character.creation.weapon_class_example.*` fixtures (PDF 29 wording) were not edited.
  The coverage note names the new fixtures and keeps examples `extracted`.
- `sections.yaml` parents (PDF 51–53): Class and the three Durability run-ins are printed under
  Different Kind of Equipment (Class and Durability (DUR) under Weapons on PDF 51; Durability
  (DUR) under Armours and Shields and Durability under General Equipment on PDF 52), so
  `section.equipment.weapon_class`, `.weapon_durability`, `.armour_and_shield_durability` and
  `.general_equipment_durability` now have `parent: section.equipment.different_kind_of_equipment`.
  Hands, Quick Slots, Quiver (Optional rule), Stacking armour (PDF 52) and Backpack (PDF 53) are
  printed under Carrying Equipment, so `section.equipment.hands`, `.quiver`, `.stacking_armour`
  and `.backpack` now have `parent: section.equipment.carrying_equipment`. Ids, titles and spans
  are unchanged; `section.equipment.coins.table` keeps `parent: section.equipment.weapon_class`.
  No test asserted the old tree (`tests/reports/chapters.test.ts` only checks Coins), and the
  `--descendants` membership of `section.equipment` is the same 18 sections.

### Psychology — Sanity

- `character.sanity.boundary_uncertain` (PDF 55): "Once you have 0 points, you will develop a
  mental health problem." is the end of the second Sanity paragraph in the left column, and "Once
  a hero has a condition, the Sanity Level will go back up to 8 minus the number of current
  conditions." is under Conditions. The rule now cites both headings (Sanity first, then
  Conditions; method text, visually verified) and the two sentences are joined with "..." because
  they are not contiguous on the page.

### Psychology — Party Morale

- `section.psychology.party_morale` coverage row: glossary is `extracted`, because
  `term.dungeon_departure` has this `section_id`; the note names the term and keeps
  `term.party_morale` as the headword.
- `term.dungeon_departure` (PDF 58): the quoted sentence "PM is reset as soon as the party leaves
  the dungeon." is printed in the right column under the run-in heading Resetting the Morale, so
  the source heading is now "Resetting the Morale" with `visually_verified: true`.
- `issue.phase4.morale_threshold`: `related` now lists `character.morale.wavering`,
  `.recovered`, `.threshold_uncertain`, `.outside_bounds`,
  `test.character.morale.threshold_uncertain.equal` and
  `test.character.morale.outside_bounds.negative`, all of which exist, so the issue enters the
  review digest.

### Official ruling — A hero dies

Changelog 2.21 entry 36 (`source/vonbraus-changelog-2.2x.pdf`, PDF 4) quotes the printed cell
"A Hero dies -> Effect: -6", asks whether the Quest Sheet's -5 is right, and answers "QRS is
correct" (Fixed). Applied under the official-rulings convention, following the entry 39 precedent
on the short-rest row:

- `character.morale.event.hero_dies`: `source_text` keeps the printed "-6"; the effect multiplies
  -5 by occurrences; a second source cites the changelog (PDF 4, heading '2.21', row 36); the
  rule links `issue.psychology.hero_dies_morale_penalty`.
- `test.character.morale.event.hero_dies.once`: morale 10 becomes 5; both sources cited.
- `table.psychology.morale_adjustments`: the hero_dies cell stays printed -6 / value -6, exactly
  as the short_rest row stays +1. The table carries no row-level ruling annotation in either
  case; the issue's `related` list binds it.
- `issue.psychology.hero_dies_morale_penalty`: `status: resolved` with a `resolution` citing the
  changelog entry, in the shape of `issue.phase4.short_rest_morale`; summary and ids unchanged.
- `review/designer-published-rulings.md`: new row "Changelog #36, applied".
- `tests/schema/review.test.ts`: the issue is appended to the resolved-issue list.
- `gold.morale.hero_dies` in `tests/fixtures/semantic-decisions-gold/cases.yaml` is unchanged:
  its `source_text_sha256` still matches the rule's unchanged `source_text`, and the decisions
  test passes.
- Not changed: `clients/web/src/gm/rules.ts` pins `hero_dies` at -6 and
  `clients/web/tests/gm-engine.test.ts` relies on it (5 - 6 clamps to 0). The consumer is outside
  the corpus gate and is reported for the coordinator.

### Pushed back

Nothing. Every open finding was confirmed on the page and applied as proposed.

### Gates

`npm run validate` (469 files), `npm test` (3889 passed, 2 skipped), `npm run report:coverage`
(regenerated), `npm run review -- check` (six `.2` records fresh; the three `.1` records stale)
and `git diff --check` (clean). `npm run lint` passes on every tracked file; Prettier still warns
on the untracked `review/independent/equipment.yaml` and `psychology-party-morale.yaml`, which
the reviewer wrote and which were left unedited.

### Psychology table nodes — 7 October 2026

Extraction-side corrections for the three open findings of `review.psychology_tables.1`
(`section.psychology.table`, `.table_lingering_trauma_table`, `.sanity.table`,
`.party_morale.table`). Each finding was checked against rendered rulebook PDF 57 (printed 55)
and changelog 2.2x PDF 4. The review record was not edited and nothing was set `reviewed`; the
record is now stale and needs a new review run. Nothing in `generated/review/frozen-ids.txt` was
touched, and the six tier 1–2 `.2` records, `review.equipment.2` and
`review.psychology_party_morale.2` stayed `fresh`. `review.psychology_sanity.2` went stale on
`issue.sanity.acute_stress_diagnosis_expiry` (see below), which was expected: its sections are
`extracted` again and are due for re-review.

#### Changelog 2.21 entry 37 — Arachnophobia (not applied)

Rendered changelog PDF 4 prints entry 37 as: Description of "Arachnophobia" should probably
mention spiders in 2nd sentence. i.e., "Sll encounters against Spiders cause Terror." / Fixed.
The answer column is empty, unlike entries 36 ("QRS is correct.") and 39 ("+2 is correct") on the
same page. Under the official-rulings convention a "Fixed" mark without a stated designer rule
settles nothing, and the second printing (PDF 57, row 6 Arachnophobia) still prints "Treat all
encounters as causing Terror." Decision: the entry is recorded as evidence, not applied.

- `issue.phase4.arachnophobia_scope`: stays `unresolved`. The summary gains the entry's wording,
  that it is marked Fixed without a stated rule, that the printed sentence is unchanged and that
  the question stays open. A second source cites the changelog (`vonbraus.changelog_2_2x`, PDF 4,
  heading '2.21', row 37, method image, visually verified).
- `review/designer-published-rulings.md`: new row for Changelog #37 in the "Acknowledged, but
  the fix isn't stated" table, status recorded, not applied, with the reason.
- Not changed: `character.condition.arachnophobia`, `character.condition.arachnophobia_other_encounters`,
  `procedure.arachnophobia`, `condition.arachnophobia`, `table.psychology.mental_conditions` and
  `test.character.condition.arachnophobia_other_encounters.not_spider`. Non-spider encounters
  keep returning the unresolved issue.

#### Issue source headings on PDF 57

PDF 57 prints no heading above the 1d10 / Condition / Effect table; the canonical rules, entities,
procedures and fixtures on that page cite the chapter heading Psychology with
`locator.table: Uncaptioned mental conditions table`. The twelve issues below cited the page with
the corpus's own names instead. Every PDF 57 source entry now reads `heading: Psychology`,
`locator.table: Uncaptioned mental conditions table`, and keeps or gains the printed row label
(verified on the rendered page: 1 Hate, 2-3 Acute Stress, 4 Lingering Trauma, 6 Arachnophobia,
7 Jumpy, 8 Irrational Fear, 9 Claustrophobia, 0 Depression). Source entries on other pages
(Conditions on PDF 55, Energy on PDF 26, Treat Mental Conditions on PDF 147, Hate on PDF 178,
The Scenario Die; The Threat Level on PDF 89, Lingering Trauma Table on PDF 57) are unchanged.

- "Psychology table" / "Mental conditions table" → Psychology / Uncaptioned mental conditions
  table, rows kept: `issue.sanity.claustrophobia_stat_scope` (9 Claustrophobia),
  `issue.sanity.condition_encounter_resolution` (6 Arachnophobia and, through the shared source
  entry, 8 Irrational Fear), `issue.sanity.depression_capacity_context` (0 Depression),
  `issue.sanity.hate_target_scope` (1 Hate), `issue.sanity.irrational_fear_selection`
  (8 Irrational Fear), `issue.sanity.jumpy_threat_order` (7 Jumpy), `issue.sanity.trauma_scope`
  (4 Lingering Trauma).
- `issue.sanity.cure_lasting_effects`: heading Psychology and the table locator; no row added,
  because the issue spans the Hate, Acute Stress, Lingering Trauma and Depression rows.
- `issue.sanity.acute_stress_diagnosis_expiry`: heading "Mental conditions table" → Psychology;
  row locator "2–3 Acute Stress" (en dash) → "2-3 Acute Stress" (the printed hyphen).
- `issue.phase4.arachnophobia_scope`: heading "Arachnophobia" → Psychology, locator table and
  row 6 Arachnophobia, column Effect added.
- `issue.phase4.energy_floor`: PDF 57 heading "Depression" → Psychology, locator table and row
  0 Depression added; the PDF 26 Energy entry is unchanged.
- `issue.phase4.sanity_boundaries`: PDF 57 heading "Condition table" → Psychology with the table
  locator; no row, because the issue concerns the whole table (exhausted distinct conditions).
- Same en-dash normalisation on the two canonical row locators in scope:
  `character.condition.acute_stress` (`corpus/rules/psychology/sanity.yaml`) and
  `procedure.acute_stress` (`corpus/procedures/psychology/acute-stress.yaml`) now cite
  "2-3 Acute Stress". `condition.acute_stress` and the fixtures already used the hyphen. The
  describe-string "row 2–3" in `tests/rules/acute-stress-lifecycle.test.ts` and its copy in
  `tests/fixtures/acceptance/package-f.json` are test names, not source references, and were
  left alone.

#### Issue `related` lists

- `issue.phase4.sanity_boundaries`: `related` was `[]`. It is now `procedure.acute_stress`
  (`section.psychology.table`; lists the issue under `issues`) and
  `character.sanity.trauma_trigger` (`section.psychology.table_lingering_trauma_table`;
  `on_missing_issue`). Those are the only objects in the four table nodes that reference it:
  `character.condition.acute_stress` references `issue.0004`, not this issue. Objects in other
  sections that reference it (`character.sanity.draw_condition`, `character.sanity.boundary_uncertain`,
  `test.character.sanity.boundary_uncertain.overshoot`, `procedure.sanity_condition`,
  `procedure.sanity_loss`, `procedure.sanity_recovery`, `procedure.mental_condition_treatment`)
  were deliberately not added, so the issue does not enter another unit's digest. The issue now
  enters the table-node digest, as the stale report for `review.psychology_tables.1` shows
  ("added: issue.phase4.sanity_boundaries").

#### Deferred

- `issue.0004` is frozen (backed by `review.introduction.2`). Its `related` list still lacks
  `character.condition.acute_stress` and `procedure.acute_stress`; this is deferred until the
  Introduction unit is next reviewed. Nothing else was deferred.

#### Pushed back

Nothing. All three open findings were confirmed on the page and applied; entry 37 was applied in
the "not a ruling" branch of the proposed correction.

#### Gates

`npm run validate` (470 files), `npm test` (3889 passed, 2 skipped), `npm run lint` (after
`lint:fix`), `npm run report:coverage` (regenerated; the diff is the earlier session's coverage
changes, no coverage row changed here), `npm run review -- check` (the six tier 1–2 `.2`
records, `review.equipment.2` and `review.psychology_party_morale.2` fresh;
`review.psychology_tables.1` and `review.psychology_sanity.2` stale as expected) and
`git diff --check` (clean).

## Tier 4 — Magic Items and Enchantments — 7 October 2026

Scope: `section.magic_items` (5 sections, PDF 70, printed 68) and `section.enchantments` (4
sections, PDF 71, printed 69) per `pages.yaml`. All 9 are now `extracted`. None is `reviewed`.

### Pages inspected

Both pages were rendered (`generated/review/tier4/p70.png`, `p71.png`) and read, not only
text-dumped.

| PDF | Printed | Content                                                                                                                                                          |
| --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 70  | 68      | Magic Items banner and intro; Identifying; Durability of Magic Items; Carrying Magic Items (continues in the right column); Dissipating Magic (three paragraphs) |
| 71  | 69      | Enchantments banner and intro ("It cannot be done while travelling."); Requirements for Magic Items; Making a Magic Scroll; Enchantments Take Time; photograph   |

Neither page prints a table, a labelled "Example:", a numbered step sequence or a catalogue entry.

### Per-section disposition

| Section                         | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `section.magic_items`           | Glossary: new `term.magic_item` quotes the intro paragraph. Everything else not applicable: descriptive intro only.                                                                                                                                                                                                                                                                                                                              |
| `.identifying`                  | Rules: `character.magic_item.identify`, `.use` now quote the paragraph verbatim under "Identifying"; the ‘Settlements’ pointer became a dependency on `character.settlement.identification` and `see_also` to Settlements, its Identifying Items and Potions service, the PDF 100 Identifying Items and Potions page (tier 5 exit row, linked not extracted) and the skills list. `issue.character_basics.identify_attempts` listed on the rule. |
| `.durability_of_magic_items`    | Already represented by `character.durability.magic`, `.magic_gear` (verbatim; now `visually_verified: true`). Glossary not applicable (Durability, Quick Slots, Magic Items cited elsewhere).                                                                                                                                                                                                                                                    |
| `.carrying_magic_items`         | `character.magic_item.jewellery_limits` now quotes the whole paragraph under "Carrying Magic Items".                                                                                                                                                                                                                                                                                                                                             |
| `.dissipating_magic`            | `character.durability.dissipation` (now also quotes "This can lead to the weapon suddenly breaking."), `.broken_magic_lost`, `.magic_repair_uncertain` (all `visually_verified: true`); `character.magic_item.recharge` quotes both sentences verbatim, lists `issue.phase4.magic_breakage` and depends on `character.settlement.guild.wizards.charging`.                                                                                        |
| `section.enchantments`          | Rules: the intro's "It cannot be done while travelling." is quoted (joined with "...") and cited under "Enchantments" by the four enchant/scroll rules, which already required `travelling: false`. Other components not applicable.                                                                                                                                                                                                             |
| `.requirements_for_magic_items` | `character.magic_item.enchant.success`, `.failure` quote all three paragraphs verbatim. Glossary: new `term.powerstone`. Examples not applicable: the inline "For example…necklace" is an illustration without values. Tables: Table of Powerstones (Appendix V) linked in `see_also`.                                                                                                                                                           |
| `.making_a_magic_scroll`        | `character.magic_item.scroll.success`, `.failure` verbatim. Procedures not applicable: one spell cast with two outcomes, not a step sequence. `see_also` ↔ `section.magic.magic_scrolls` and `section.settlements.create_magic_scrolls` (the Magic side of the cross-link is the Magic agent's).                                                                                                                                                 |
| `.enchantments_take_time`       | `character.magic_item.time.object`, `.time.scroll` verbatim ("time-consuming": the line-break hyphen in the dump).                                                                                                                                                                                                                                                                                                                               |

### New and changed objects

- New terms: `term.magic_item` (Magic Items; aliases Magic Item, Magic Object(s)) and
  `term.powerstone` (Powerstone(s)), with alias forms in `aliases.yaml`.
- Changed: `corpus/rules/equipment/magic-items-enchantments.yaml` (all ten rules: verbatim
  `source_text`, printed headings replacing lowercase ones, second source "Enchantments" on the four
  rules encoding the travelling restriction, dependencies and `see_also` on identify and recharge,
  empty `unresolved_references` removed); `encumbrance-durability.yaml` (five magic durability
  rules `visually_verified: true`, dissipation quote extended).
- Fixtures: the 16 `test.equipment.batch_three.{identify_*,unidentified_unusable,jewellery_*,enchant_*,scroll_*,second_scroll,third_scroll_blocked,object_excludes_scroll,scroll_excludes_object}`
  headings now match the printed headings; the five `test.character.durability.{magic,magic_gear,dissipation,magic_repair_uncertain,broken_magic_lost}.*`
  fixtures `visually_verified: true`. No fixture logic changed; all are derived cases, since the
  pages print no worked example.
- Sections: `see_also` bindings on six subsections; a note on `.identifying`.
- Coverage: all nine rows rewritten with page-justified dispositions; `entities` set.

### Examples

| Example                                                                                   | Classification | Fixture                                                         |
| ----------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------- |
| "For example, there is no point in adding damage enhancing magic to a necklace." (PDF 71) | Illustration   | None; suitability is an input of the enchant rules, not a value |

No other "Example" is printed on either page.

### Issues

No new issues. `issue.phase4.durability_overlap` (not frozen) now lists
`character.durability.dissipation` in `related`, which already returned it. Changelog entries
171–173 (pages 142, 144, 151) are marked "Fixed" and state no rule for PDF 70–71 (172 is cut off
mid-sentence), so nothing was applied and no rulings row was added.

### Frozen objects

`issue.phase4.magic_breakage` is frozen. Its `related` lists only `character.durability.broken`,
although `character.durability.dissipation`, `character.durability.magic_repair_uncertain` and
`character.magic_item.recharge` cite it; its sources use the printed headings already. The
`related` list should gain those three ids once the Equipment digest is re-reviewed.
`issue.character_basics.identify_attempts` is frozen and already lists
`character.magic_item.identify`; changelog 172 could be added to its sources as evidence.
`term.durability`, `term.quick_slot`, `term.arcane_art`, `character.durability.standard`,
`character.durability.broken` were referred to, not edited.

### Tests

No test code changed.

### Gates

Recorded in the report for this unit: `npm run validate`, `npm run lint` (after `lint:fix`),
`npm run report:coverage` (regenerated), `npm run review -- check` (no record newly stale),
`git diff --check`, `npm test`.

## Tier 4 — Prayers — 7 October 2026

Scope: the 29 sections under `section.prayers` (PDF 82–84, printed 80–82 per `pages.yaml`).
All 29 are now `extracted`. None is `reviewed`.

### Pages inspected

Every page was rendered and read (`generated/review/tier4/p82.png`, `p83.png`, `p84.png`), not
only text-dumped:

| PDF | Printed | Content                                                                                                                                                                                                                                                                                                    |
| --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 82  | 80      | Prayers banner; About Prayers; Will the Gods Listen?; Duration; Interruption; Learning New Prayers; Relics; Level 1 prayers (Bringer of Light, The Power of Iphy, Charus, Walk with Us, Metheia’s Ward, Power of the Gods)                                                                                 |
| 83  | 81      | Methia’s Balm (level 1); Level 2 prayers (Litany of Metheia, Power of Faith, Smite The Heretics!, Verse of The Sane, Shield of the Gods); Level 3 prayers (Strengths of Ohlnir, Warriors of Ramos, Stay Thy Hand!, Be Gone!, Providence of Metheia); Level 4 prayers (We Shalt Not Falter, God’s Champion) |
| 84  | 82      | Unheaded narrative about the Milwood tundra, the Grey Ocean, the Old Mountains and the Ancient Lands above a landscape picture; no rule                                                                                                                                                                    |

No table and no printed "Example:" appears on any of the three pages.

### Per-section disposition

| Section                                 | Disposition                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.prayers`                       | All not applicable: the root owns the banner and the unheaded PDF 84 narrative; every paragraph on PDF 82–83 belongs to a child heading. `profession.warrior_priest` cites the chapter for its two starting prayers. `sections.yaml` gains a note on PDF 84.                                                                           |
| `.about_prayers`                        | Glossary: new `term.prayer`. Rules: `character.prayer.activation` now quotes the free-action and 1 Point of Energy sentences under the printed heading About Prayers. Procedures: owned by `procedure.offer_prayer` (Will the Gods Listen?), which cites this heading.                                                                 |
| `.will_the_gods_listen`                 | Glossary: new `term.impeccable`. Rules: `character.prayer.success`, `.impeccable` (verbatim). Procedures: new `procedure.offer_prayer`.                                                                                                                                                                                                |
| `.duration`, `.interruption`            | Rules verbatim under the printed headings. Procedures not applicable: both are dependencies of `procedure.offer_prayer`, which cites them. Glossary not applicable (Battle, Turn, Stun, Terror Test defined elsewhere).                                                                                                                |
| `.learning_new_prayers`                 | Rules: new `character.prayer.learning_restriction` (level ≤ priest's level; Inner Sanctum in Silver City). Procedures: `procedure.learn_prayer` now quotes PDF 82 and PDF 158 verbatim (joined with "..."), PDF 82 `visually_verified: true`, `see_also` to the Inner Sanctum, dependency on the new rule. `extracting` → `extracted`. |
| `.relics`                               | Glossary: new `term.relic`. Rules: `character.prayer.relics` verbatim. Tables and entities not applicable: the Table of Relics (`table.treasure.relics`) and the six `equipment.relic.*` entities live on `section.appendix_v_treasures.table_of_relics` (PDF 196). `see_also` bound to that node and Buying Special Equipment.        |
| `.level_1_prayers` … `.level_4_prayers` | Rules and entities already represented; headings and `source_text` verified. Glossary, tables, examples, procedures not applicable with page reasons.                                                                                                                                                                                  |
| The 18 prayer run-in sections           | Each `prayer.*` entity now quotes its whole printed paragraph; each `character.prayer.*` rule quotes the mechanical sentence(s) verbatim under the printed run-in heading with `section: Level N prayers`. Components dispositioned (glossary: the name is an entity, stats are terms citing Character Basics / Game Basics).          |

### New and changed objects

- New: `procedure.offer_prayer` (`corpus/procedures/character/prayers.yaml`): offer (one active
  prayer, free action), roll_check (≤ Battle Prayers), pay_energy with substep impeccable (01-05,
  no Energy, invokes `core.check.perfect_result`), take_effect (invokes interruption). Steps after
  `offer` are gated on `offered`.
- New: `character.prayer.learning_restriction` (`corpus/rules/prayers/catalogue.yaml`), type
  constraint, scope settlement; depends on `character.settlement.guild.inner_sanctum.learning` and
  `procedure.learn_prayer`.
- New terms: `term.prayer`, `term.impeccable`, `term.relic`, with alias forms (Prayer, Prayers,
  Impeccable, Relic, Relics, Religious Relic).
- Changed: all 26 pre-existing `character.prayer.*` rules (verbatim `source_text`; printed headings
  replace the lowercase invented ones such as "activation", "success", "constitution"); all 18
  `prayer.*` entities (verbatim paragraphs); `procedure.learn_prayer` (above). No rule or entity
  field, effect or condition changed; the existing prayer tests still pass unchanged.
- Sections: `section.prayers` note; `see_also` on `.learning_new_prayers` and `.relics`.
- Coverage: all 29 rows rewritten with standalone page-justified notes; the former "Batch
  extraction evidence" / "Package D" notes are gone.

### Examples

None printed on PDF 82–84. No fixture added.

### Issues

- No new issue. The impeccable 01-05 and the Perfect Result 01-05 (Game Basics) compose rather
  than conflict (Charus, Walk with Us confirms the "other options you have if you roll 01-05"
  still apply), so no issue was recorded; `procedure.offer_prayer` invokes `core.check.perfect_result`.
- `issue.settlement.prayer_schedule_duration` (not frozen) gains `procedure.learn_prayer` in
  `related`, which lists it under `issues`. PDF 82 says where prayers are learned (Inner Sanctum in
  Silver City) but nothing about duration; changelog 2.2x entry 77 is "Fixed" without a stated
  rule and settles nothing. The issue's sources were not extended (PDF 133–134 belong to the
  Settlements unit); `review/designer-published-rulings.md` already has the #77 row.

### Rulings

None applied. Entry 77 is the only changelog entry touching prayers (see above).

### Frozen objects

`term.battle_prayers`, `character.creation.spells_and_prayers`,
`character.skill.battle_prayers.learning`, `test.character.skill.battle_prayers.learning.wizard`,
`issue.0001`, `core.check.perfect_result` were referred to, not edited. The Warrior Priest
profession entity was not edited.

### Tests

`tests/rules/alchemy-prayers.test.ts`: two new cases — the offering procedure (success, failure,
impeccable, second prayer refused) and the learning restriction (level and Silver City).

### Gates

Final run at the end of this unit: `npm run validate` (passed, 475 files), `npm test` (3897
passed, 2 skipped), `npm run lint` (passed after `prettier --write` on this unit's files),
`npm run report:coverage` (regenerated), `npm run review -- check` (the tier 1–3 `.2`/`.3`
records unchanged; no prayers record exists yet). Earlier runs during the session failed only on
concurrent Magic/Alchemy work in progress (`section.magic.*` coverage and issue references,
PDF 77 on `character.alchemy.mix.success.*`); no error named a prayers object.

## Tier 4 — Alchemy Preparations — 7 October 2026

Scope: `section.alchemy.preparations` and its 29 children (PDF 79–81, printed 77–79 per
`pages.yaml`). All 30 were already `extracted`; this unit verified every entry against the
rendered pages, repaired provenance and dispositioned every component. Nothing is `reviewed`.
Objects whose `section_id` is outside `.preparations`, and the root `section.alchemy` row, were
not edited (the two Appendix III cure-potion entities gained a second source only).

### Pages inspected

| PDF | Printed | Content                                                                                                                                                                                                                                    |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 79  | 77      | Acidic Bomb (Tr); Alchemical Dust; Bottle of Experience; Bottle of the Void; Elixir of Speed; Elixir of the Archer; Firebomb (Tr); Liquid Fire; Poison; Potion of Constitution; Potion of Courage (continues on PDF 80)                    |
| 80  | 78      | Potion of Courage (end); Potion of Cure Disease; Potion of Cure Poison (Antidote); Potion of Disorientation (Tr); Potion of Dexterity; Potion of Dragon’s Breath with four-way figure and caption; Potion of Dragon Skin; Potion of Energy |
| 81  | 79      | Potion of Fire Protection; Potion of Health; Potion of Mana; Vial of Invisibility; Potion of Rage; Potion of Restoration; Potion of Strength; Potion of Wisdom; Vial of Corrosion; Potion of Smoke (Tr); Weapon Oil                        |

No page prints a table, an "Example:", a footnote or a collective heading. Every number, die,
duration and range in the 29 rules and 27 chapter entities matched the page; what was wrong was
provenance (see below). `generated/extract/changelog.txt` has no entry about printed 77–79
(entry 71, Acidic and Fire Damage, concerns the Combat chapter and is marked Fixed without a
rule). No ruling applied.

### Per-section disposition

| Section                                             | Disposition                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `section.alchemy.preparations`                      | Grouping node, no printed heading. Tables: `extracted` (`table.alchemy.strengths`, a compiled matrix; the book prints no table). Rules now `not_applicable`: the 36 quality-effect rules were re-homed to the children. Glossary, examples, procedures, entities not applicable.                                                                                   |
| 29 children                                         | Rules `extracted` (`character.alchemy.preparation.<key>`, plus `.quality_effect.<key>.weak/.standard/.supreme` for the 12 graded preparations). Entities `extracted` (`equipment.alchemy.<key>`; Cure Disease / Cure Poison use the Appendix III entities, which now also cite PDF 80). Glossary, tables, examples, procedures `not_applicable` with page reasons. |
| `.potion_of_cure_disease`, `.potion_of_cure_poison` | Entities component was unset; now `extracted`. Procedures note names `procedure.disease_cure` / `procedure.poison_cure` (Combat), which cite these sections as the potion route.                                                                                                                                                                                   |
| `.potion_of_strength`, `.potion_of_wisdom`          | Both print two durations in one paragraph; new `issue.alchemy.stat_potion_duration`.                                                                                                                                                                                                                                                                               |
| `.potion_of_dragons_breath`                         | Caption adds sideways and diagonal shapes and prints "2dx1d4"; new `issue.alchemy.dragons_breath_geometry`. Rule quotes paragraph and caption joined with "...", second source entry is the figure (`method: image`).                                                                                                                                              |
| `.potion_of_fire_protection`                        | `issue.alchemy.fire_protection` now also relates to the rule that lists it.                                                                                                                                                                                                                                                                                        |

### Provenance repaired (content unchanged)

- `source_text`: every preparation rule and entity (29 + 27) quoted a paraphrase; all now quote
  the printed paragraph verbatim (including "DEX bases skills", "1HP", "Dragon’s"). The 36
  quality-effect rules quoted "Weak / Standard / Supreme: … Values from X"; they now quote the
  printed sentence that states the values, cite the preparation's heading and page, and carry
  the child's `section_id`.
- Headings: lower-cased headings ("acidic bomb"), the invented "weak"/"standard"/"supreme"
  headings, and "Potion of Courage (continued)" are replaced by the printed run-in headings,
  including the printed qualifiers "(Tr)" and "(Antidote)". The PDF 80 continuation of Potion of
  Courage keeps heading "Potion of Courage" with `locator.region`.
- `table.alchemy.strengths`: heading "Preparation qualities" (not printed) replaced by twelve
  source entries, one per contributing run-in heading, each with `locator.region` stating that
  no table is printed; `source_text` is the twelve value sentences joined with "...". Rows and
  cells unchanged (`tests/tables/magic-alchemy-cells.test.ts` still passes).
- `sections.yaml`: titles of `.acidic_bomb`, `.firebomb`, `.potion_of_disorientation`,
  `.potion_of_smoke`, `.potion_of_cure_poison` now carry the printed qualifiers. Spans and
  parents verified: only Potion of Courage spans two pages (79–80); the print order of the
  children on each page matches the file order.
- The four (Tr) rules bind `see_also: section.alchemy.throwing_potions`.
- Coverage notes for the 30 rows rewritten without batch jargon.

### Examples

None printed on PDF 79–81. The Dragon’s Breath figure is a diagram, not an Example; it is
quoted by the rule and recorded in the geometry issue. No fixtures were added; the existing
behavioural assertions in `tests/rules/alchemy-prayers.test.ts` (strength dice, stat bonuses,
smoke, dragon skin, cure potency, Frenzy handoff) still pass.

### Issues

New (`review/ambiguities.yaml`): `issue.alchemy.stat_potion_duration` (conflicting; related
`character.alchemy.preparation.potion_of_strength`, `.potion_of_wisdom`),
`issue.alchemy.dragons_breath_geometry` (conflicting; related
`character.alchemy.preparation.potion_of_dragons_breath`). Changed:
`issue.alchemy.fire_protection` gains `character.alchemy.preparation.potion_of_fire_protection`
in `related`. `issue.alchemy.preparation_names` (Common recipes) was left to the owner of PDF 78.

### Frozen objects

`term.alchemy` and `term.throwable_potion` are named in coverage notes but not edited. No
frozen object needs changing.

### Tests

No test files edited. `tests/tables/magic-alchemy-cells.test.ts` and the alchemy cases in
`tests/rules/alchemy-prayers.test.ts` pass against the edited objects.

### Gates

`npm run validate` passed (475 files). `npm run report:chapters -- --chapter alchemy`: 52 of 52
sections extracted, 0 unfinished. `npm test`: the first run hit a transient YAML parse error in a
file another agent was writing; on re-run, every failure outside this unit's files traced to
concurrent edits elsewhere (`tests/rules/alchemy-prayers.test.ts` mid-edit at line 290 with a
`[76, 77, 197]` expectation for `character.alchemy.mix.success.*`, and the Magic unit's
`core.magic.miscast` retrieval case); the ten tier 1–3 `.2`/`.3` review records that were
fresh stayed fresh. `npm run lint` fails only on that same in-flight test file. Prettier was run on
every file this unit edited.

## Tier 4 — Alchemy core — 7 October 2026

Scope: the 22 `section.alchemy*` ids outside `section.alchemy.preparations` (PDF 72–78, printed
70–76 per `pages.yaml`). All 22 are now `extracted`; none is `reviewed`. The Preparations subtree
(PDF 79–81) was reconciled separately. Most of this unit was provenance repair: the Phase 4 rules
were mechanically right but quoted paraphrases under invented headings.

### Pages inspected

| PDF | Printed | Content                                                                                                                            |
| --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 72  | 70      | Alchemy intro; Identifying Potions; Alchemist Belt; Drinking Potions; Throwing Potions; Components for Potions                     |
| 73  | 71      | Gathering Ingredients; Habitats for ingredients (Roadside … Site); uncaptioned Ingredients Table with printed note                 |
| 74  | 72      | Harvesting parts; run-ins Quantity and Quality; full-page art below                                                                |
| 75  | 73      | Uncaptioned full-page Monster / Part / Quantity table                                                                              |
| 76  | 74      | Quality (Weak/Standard/Supreme Potion); Making a recipe; Mixing Potions (Exquisite …, Failed Alchemy test); Simplified Alchemy box |
| 77  | 75      | Making a potion flowchart (no body text; the dump is empty)                                                                        |
| 78  | 76      | Common recipes; six recipe scrolls                                                                                                 |

The rendered pages were read. The text dump located wording only; the flowchart was read from the
image. `section.alchemy.table` (PDF 73) and `.table_2` (PDF 75) hold the tables the page actually
prints, so no span changed.

### Per-section disposition

| Section                                                                                     | Disposition                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.alchemy`                                                                           | Intro paragraph descriptive. Tables n/a naming the two table nodes and their tables. Procedures: new `procedure.alchemy_making_a_potion` (PDF 77 flowchart). Glossary n/a (`term.alchemy` cites PDF 28, frozen).                                                                         |
| `.alchemist_belt`                                                                           | Was `mapped`, no records. New `character.alchemy.alchemist_belt` (verbatim PDF 72; `entity_id: equipment.alchemy.alchemist_belt`, dependency on frozen `character.equipment.quick_slots`, `term_refs: term.quick_slot`). The entity already cited PDF 72, so entities `extracted`.       |
| `.identifying_potions`, `.drinking_potions`, `.throwing_potions`, `.components_for_potions` | Rules already represented; quotes and headings fixed; `see_also` bound to `section.settlements.identifying_items_and_potions`, `section.combat.throwing_potions`, `section.alchemists_guild`. Drinking: the unlabelled dexterity/strength illustration is now two fixtures.              |
| `.gathering_ingredients`                                                                    | Rules already represented; the extractor sentence "Travel procedure remains deferred" removed from the quote. Which roll the 01-10 refers to is new `issue.alchemy.gathering_exquisite_roll`.                                                                                            |
| `.habitats`                                                                                 | Six run-in definitions already represented; now cite `section: Habitats for ingredients` with their printed run-in headings.                                                                                                                                                             |
| `.harvesting_parts`                                                                         | `character.alchemy.harvest` quote trimmed to the printed paragraph; new `character.alchemy.harvest.quantity` (run-in Quantity); `.harvest.exquisite` cites run-in Quality. The PDF 74 run-ins were not given section nodes (consistent with every other run-in in the chapter).          |
| `.table`, `.table_2`                                                                        | Already extracted; retitled Ingredients Table / Harvesting parts table (notes explain); sources now cite the enclosing printed heading with `locator.table`; `source_text` quotes the printed note / introducing sentence; the harvesting extractor footnote removed (now a rule).       |
| `.quality`                                                                                  | Three strength rules already represented; new `character.alchemy.quality.strengths` for the lead-in. Each strength rule also cites its PDF 77 flowchart box.                                                                                                                             |
| `.making_a_recipe`, `.mixing_potions`, `.simplified`                                        | Rules already represented; quotes and headings fixed; mixing rules also cite the flowchart; `section.into_the_dungeons.rest` and `section.appendix_v_treasures.tables_of_potions` bound.                                                                                                 |
| `.common_recipes` and the six recipe sections                                               | Catalogue-style, verified not re-extracted. `table.alchemy.common_recipes` cites "Common recipes" with a locator; the `recipe.*` quote their scroll verbatim with `locator.region: recipe scroll`. Entities `extracted` on each scroll section, tables `extracted` on `.common_recipes`. |

### Quote and heading corrections

- All 28 pre-existing core rules in `corpus/rules/alchemy/catalogue.yaml` now quote the printed
  text verbatim (separated passages joined with "...") under the printed heading; run-ins carry
  `section:` with their parent heading. Invented headings replaced: identify, drink, components,
  throwing, gathering, exquisite, roadside … site, harvest, weak/standard/supreme, recipe, mix,
  recipe bonus, exquisite bonus, failure, random, experience.
- 48 `ingredient.*`/`part.*` entities cited their own name as heading; they now cite "Habitats for
  ingredients" / "Harvesting parts" with `locator.table` and `row` (parts also `column: Part`).
- PDF 77 citations use `method: image`.
- `table.alchemy.habitats`' second footnote (green shading) is kept but marked as a transcription,
  not a printed footnote.

### Examples

| Example                                                           | Classification         | Fixture                                                                                             |
| ----------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| "drinking 2 potions of dexterity … acquire both bonuses" (PDF 72) | Executable, unlabelled | `test.character.alchemy.drink.two_dexterity`, `test.character.alchemy.drink.strength_and_dexterity` |

No "Example:" paragraph is printed on PDF 72–78.

### Issues

New: `issue.alchemy.gathering_exquisite_roll` (related `character.alchemy.gathering.exquisite`) and
`issue.alchemy.flowchart_recipe_record` (related `character.alchemy.mix.success.random`,
`procedure.alchemy_making_a_potion`). Existing `issue.alchemy.parts_footnote` and
`issue.alchemy.preparation_names` are named in the coverage notes and unchanged.

### Rulings

The changelog has no entry for printed pages 70–76 (its only Quick Slot entry concerns page 201).
`review/designer-published-rulings.md` unchanged.

### Frozen objects

`term.alchemy`, `term.quick_slot`, `character.equipment.quick_slots` referred to only. Nothing
frozen needs changing.

### Tests

`tests/rules/alchemy-prayers.test.ts`: the source-page assertion for `character.alchemy.mix.success.*`
now expects `[76, 77, 197]`. New fixtures under `tests/examples/alchemy/`.

### Gates

`npm run validate` reports no alchemy error (the remaining errors at run time belonged to the
concurrent Magic unit). `npm test`: alchemy suites pass; the only failures were the same Magic
work in progress. `npm run lint` after prettier on the edited files.

## Tier 4 — Academic Skills and Magic — 7 October 2026

Scope: `section.academic_skills` (part divider, PDF 63, printed 61 per `pages.yaml`, no folio) and
the Magic chapter (`section.magic`, PDF 64–69, printed 62–67). Magic now has 18 section nodes plus
the redirect `section.magic.casting_spells.table_3`; all 18 are `extracted`, none is `reviewed`.
The new node `section.magic.hero_spell_casting` covers the full-page flowchart on PDF 68, which no
section owned before.

### Pages inspected

Every page was rendered (`generated/review/tier4/p63.png` … `p69.png`) and read; the text dump was
used only to confirm spelling. Changelog 2.2x PDF 23 was rendered to
`generated/review/tier4-magic/p23.png` for entries 146 and 149.

| PDF | Printed | Content                                                                                                                                           |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 63  | 61      | Academic Skills part divider, one sentence, no folio                                                                                              |
| 64  | 62      | Magic intro; Mana; Upkeep; Difficulty of Spells; Different Types of Spells (Standard, Quick (Q), Incantations (I)); Spell Characteristics (MM, T) |
| 65  | 63      | Casting Spells; Adjacent Enemies; Miscast; uncaptioned 1d10 / Effect table; uncaptioned 1d4 / Demons / Equipment table                            |
| 66  | 64      | Increased Power; Perfect Cast; Focus and its Example; Dispelling Magic; Learning New Spells                                                       |
| 67  | 65      | Magic Scrolls and its Example; art                                                                                                                |
| 68  | 66      | Hero Spell Casting flowchart with footnotes *Miscast Threshold and **Enemy spell caster can dispel if                                             |
| 69  | 67      | Full-page art, no folio; narrative box Magic in the Kingdom                                                                                       |

### Per-section disposition

| Section                      | Disposition                                                                                                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `section.academic_skills`    | All six components not applicable (part divider, one sentence), status `extracted`, same pattern as `section.party_management`.                                                                                                                                                                        |
| `section.magic`              | All not applicable: the opening paragraph (PDF 64) and Magic in the Kingdom (PDF 69) are narrative. Node note records PDF 68 and 69.                                                                                                                                                                   |
| `.mana`                      | Rules `core.magic.mana` (verbatim paragraph). Glossary n/a: `term.mana` (frozen, Creating your Character). `issue.phase4.mana_rounding` named.                                                                                                                                                         |
| `.upkeep`                    | Rules `core.magic.upkeep`, `.upkeep.cancel` (heading "Upkeep", not "cancel"). Glossary: new `term.upkeep`.                                                                                                                                                                                             |
| `.spell_characteristics`     | Rules `core.magic.missile`, `.touch`, `.touch.failed` now cite the run-in headings "Magic Missiles (MM)" / "Touch Spells (T)" with `section`. Glossary n/a: frozen `term.magic_missile`, `term.touch_spell`.                                                                                           |
| `.difficulty_of_spells`      | Rules `core.magic.level`, which now also cites Learning New Spells (PDF 66). Glossary n/a: frozen `term.casting_value`.                                                                                                                                                                                |
| `.different_types_of_spells` | Rules `core.magic.standard`, `.quick`, `.incantation` under "Standard Spells" / "Quick spells (Q)" / "Incantations (I)". Glossary: new `term.standard_spell`; Q and I are frozen terms.                                                                                                                |
| `.casting_spells`            | Rules `core.magic.casting.threshold`, `.success`, `.failure` each quote their own printed sentence. Tables n/a naming `.table` / `.table_2` and the `.table_3` redirect. `see_also: section.appendix_iv_spells` for "the Spells Listing".                                                              |
| `.adjacent_enemies`          | Rules `core.magic.adjacent`. Nothing else printed.                                                                                                                                                                                                                                                     |
| `.miscast`                   | Rules `core.magic.miscast.threshold.normal`, `.wounded`, `core.magic.miscast` (verbatim, heading "Miscast", `section: Casting Spells`). Glossary: new `term.miscast`. Entry 146 agreement checked (below). `see_also` to both table nodes.                                                             |
| `.casting_spells.table`      | `table.magic.miscast` and the eleven `core.magic.miscast.outcome_*` rules now cite heading "Miscast" with `locator.table: Uncaptioned miscast table (1d10 / Effect)` and the row; table `source_text` is the calling sentence; `method: table`. Note rewritten.                                        |
| `.casting_spells.table_2`    | `table.magic.demons` cites heading "Miscast", `locator.table: Uncaptioned Demon table (1d4 / Demons / Equipment)`; the "-" marker is `not_specified` (was `no_increase`). Rules n/a, entities n/a (Bestiary enemies).                                                                                  |
| `.increased_power`           | Rules `core.magic.power` (whole paragraph). Glossary: new `term.power_level`. The 94-100 and Level 4 / Level 6 sentences are inline illustrations, not an Example.                                                                                                                                     |
| `.perfect_cast`              | Rules `core.magic.perfect`, `.perfect.maximize`. Glossary: new `term.perfect_cast` (general rule is frozen `term.perfect_result`).                                                                                                                                                                     |
| `.focus`                     | Rules `core.magic.focus`. Glossary: new `term.focus`. Examples: `test.core.magic.focus_example.ozmor`.                                                                                                                                                                                                 |
| `.dispelling_magic`          | Rules `core.magic.dispel`, `.dispel.success`, `.dispel.cost.mana`, `.dispel.cost.sanity` (verbatim). Glossary: new `term.dispel`. Bestiary external reference kept.                                                                                                                                    |
| `.learning_new_spells`       | Status `extracting` → `extracted`. Rules: `core.magic.level` cites this heading. Procedures: `procedure.learn_spell` (unchanged). `see_also`: `section.settlements`, `.settlements.learn_a_spell_or_prayer`, `section.wizards_guild`.                                                                  |
| `.magic_scrolls`             | Rules `core.magic.scroll` and five sub-rules (verbatim, heading "Magic Scrolls"). Glossary: new `term.magic_scroll`. Examples: `test.core.magic.scroll_example.magic_bolt_scroll`. `see_also: section.enchantments.making_a_magic_scroll`; no Enchantments object edited.                              |
| `.hero_spell_casting` (new)  | Rules: new `core.magic.dispel.enemy_conditions` (** footnote); the * footnote and chart boxes are second sources on the threshold, casting, focus, perfect, dispel and miscast rules. Procedures: new `procedure.hero_spell_casting` with two derived cases. Glossary, tables, examples, entities n/a. |

### New and changed objects

- New section node `section.magic.hero_spell_casting` (subsection of `section.magic`, PDF 68) and
  its coverage row; `see_also` and notes on `section.magic`, `.casting_spells`, `.miscast`,
  `.learning_new_spells`, `.magic_scrolls`.
- New rule `core.magic.dispel.enemy_conditions` (`corpus/rules/magic/foundations.yaml`): the
  flowchart footnote "Enemy spell caster can dispel if • not busy casting another spell • not
  adjacent to a hero", dependency on `core.magic.dispel`, Bestiary pointer as an unresolved
  reference.
- New procedure `procedure.hero_spell_casting` (`corpus/procedures/magic/hero-spell-casting.yaml`):
  threshold → spell type (ranged / touch / incantation) → focus → casting roll → perfect cast →
  enemy dispel (invokes `core.magic.dispel`) → miscast (invokes `table.magic.miscast`) → end of
  turn, composed from the existing `core.magic.*` rules. Confidence `medium` because the chart and
  the prose disagree (`issue.magic.flowchart_prose_conflicts`).
- New terms `term.upkeep`, `term.standard_spell`, `term.miscast`, `term.power_level`,
  `term.perfect_cast`, `term.focus`, `term.dispel`, `term.magic_scroll`, with alias forms in
  `aliases.yaml`. No frozen term was edited.
- Changed: every `core.magic.*` rule in `foundations.yaml` now has a verbatim `source_text`
  (separated passages joined with "..."), the printed heading (run-in headings with `section`),
  and, for the eleven outcome rules, the table locator and row. Second sources added: PDF 66
  Learning New Spells on `core.magic.level`; PDF 68 Hero Spell Casting (method `image`, region
  locator) on `core.magic.casting.threshold`, `.success`, `.failure`, `core.magic.miscast`,
  `.miscast.threshold.normal`, `.wounded`, `core.magic.focus`, `core.magic.perfect`,
  `core.magic.dispel`. `issues` lists added where a rule returns or cites an issue.
- `corpus/tables/magic/miscasts.yaml`: headings, locators, `source_text`, `method: table`, the
  Demon table marker meaning.
- `tests/retrieve/retrieval.test.ts`: the exact-section filter for `section.magic.miscast` now
  expects `term.miscast` as well.

### Examples

| Example                                       | Classification | Fixture                                                                                                                                                                                              |
| --------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ozmor focuses for 2 actions (PDF 66, Focus)   | Executable     | `test.core.magic.focus_example.ozmor`: 73 Arcane Arts, miscast threshold 85. "Chance of success of 48", the Summoner Talent +5 and the 25 Mana are not asserted; `issue.magic.focus_example` listed. |
| Magic Bolt from a scroll (PDF 67)             | Executable     | `test.core.magic.scroll_example.magic_bolt_scroll`: CV 10-10 = 0, threshold 50. The non-scroll "roll 40" half needs a Mana check the example does not state; the non-wizard WIS case gives no value. |
| 94-100 at power level 1; Level 4 / 6 (PDF 66) | Illustration   | None; quoted in `core.magic.power`.                                                                                                                                                                  |
| Flowchart (PDF 68)                            | Derived cases  | `test.procedure.hero_spell_casting.ranged_focus_success`, `.miscast_ends_turn` (`tests/examples/magic/foundations.yaml`).                                                                            |

### Issues

- New `issue.magic.enemy_caster_casting` (rulebook_undefined): enemy casting skill, miscast and AP
  are undefined in the printed chapter; changelog 2.21 entry 149 cited as evidence only.
  Related: `core.magic.miscast`, `procedure.hero_spell_casting`.
- New `issue.magic.flowchart_prose_conflicts` (conflicting): the flowchart's miscast and
  failed-incantation Mana deduction, "Enemy's RS" without halving, and "injured" for wounded
  differ from PDF 65–66. Related: `core.magic.miscast`, `.casting.failure`, `.dispel`,
  `.dispel.enemy_conditions`, `.miscast.threshold.wounded`, `procedure.hero_spell_casting`.
- `issue.magic.focus_example`: unprinted heading "Focus example" → "Focus" with
  `locator.paragraph: Example`; `related` gains `core.magic.focus` and the fixture.
- `issue.magic.scroll_wounded`: `related` gains `core.magic.scroll.destroyed` and
  `core.magic.miscast.threshold.wounded`; second source Miscast (PDF 65).
- `issue.sanity.miscast_loss` (resolved, entry 146): checked, not edited. `character.sanity.loss.miscast`
  invokes `core.magic.miscast`; `core.magic.miscast` spends half Mana, ends the turn and uses
  `table.magic.miscast`; Sanity is charged only by rows 4 and 8. The two sides agree.

### Rulings

- Entry 146: already applied; agreement confirmed above.
- Entry 149: the rendered changelog page 23 prints the full text. PDF 65 prints neither the bold
  "wounded" nor the enemy-caster paragraph, so nothing was applied. Row added to the
  "Acknowledged, but the fix isn't stated" table in `review/designer-published-rulings.md`
  (recorded, not applied).

### Frozen objects

`term.mana`, `term.magic_level`, `term.magic_missile`, `term.quick_spell`, `term.touch_spell`,
`term.casting_value`, `term.incantation`, `term.arcane_art`, `term.perfect_result`,
`term.quick_slot`, `character.mana.initial`, `issue.phase4.mana_rounding` and the
Enchantments objects were referred to but not edited. Nothing frozen needs to change: the Magic
pages re-print the CV, Q, I, MM and T definitions, but each frozen term already defines the
headword from Abbreviations and Terminology.

### Tests

`tests/examples/magic/foundations.yaml` (new, 4 fixtures); `tests/retrieve/retrieval.test.ts`
(one expectation). No other TypeScript test changed.

### Gates

`npm run validate` (475 files), `npm test` (3897 passed, 2 skipped), `npm run lint` (after
`lint:fix`), `npm run report:coverage` (regenerated) and `git diff --check` (clean) all passed at
the end of the unit. Restored by the coordinator from the extractor's final report after a
concurrent ledger edit overwrote the original paragraph.

## Tier 4 review corrections — 7 October 2026

Applied every `disposition: open` finding in `review.magic.1`, `review.magic_items_enchantments.1`,
`review.alchemy_core.1` and `review.prayers.1`, each checked against the rendered page first
(PDF 66, 68, 70, 73, 82 and 83; PDF 73 also rendered at 5x and the Ingredients Table cropped and
colour-sampled cell by cell). No review record under `review/independent/` was edited. None of the
objects touched is in `generated/review/frozen-ids.txt`, and none belongs to the passing records
`review.academic_skills.1` or `review.alchemy_preparations.1`.

### Corrections

- `review.magic.1` / `core.magic.perfect` (PDF 66 Perfect Cast; PDF 68 chart "‘01-05’ on AA roll?
  → no! → Subtract mana cost for spell from mana pool"): added `core.magic.perfect.decline`
  (section.magic.perfect_cast, both sources cited, printed sentences joined with "..."), firing on
  roll 01-05 with `choose_mana_gain == false` and setting `mana_spent = mana_cost`. Cited from
  `procedure.hero_spell_casting` step `perfect_cast` (whose source_text now carries the chart's
  no! branch; the `choose_mana_gain` description names the rule). Derived fixture
  `test.procedure.hero_spell_casting.perfect_declined_gain` (roll 03, gain declined → mana_spent 7,
  maximize_damage_healing true).
- `review.magic.1` / `procedure.hero_spell_casting` step `enemy_dispel` (PDF 68: the dispel
  question hangs only off "Success? yes!"): `when` is now `all [enemy_caster_present == true,
roll <= casting_threshold, roll < miscast_threshold]`. Derived fixture
  `test.procedure.hero_spell_casting.failed_roll_no_dispel` (enemy caster present, roll 60 against
  threshold 40 → half Mana spent, no `enemy_dispel` step, no dispel invocation). The chart routes
  only the Ranged branch to the dispel question; the Touch exclusion stays with core.magic.dispel
  and was not added to the step, as the finding did not ask for it.
- `review.magic_items_enchantments.1` / `character.durability.dissipation` (PDF 70 "when attacking
  with a magic weapon"): `when` is now `all [attack_roll == 100, magical == true]`; `magical` stays
  a state field. `test.character.durability.dissipation.magic_lost` now supplies `magical: true`;
  new sibling `test.character.durability.dissipation.ordinary_weapon` (00 with `magical: false`,
  expects no effects and an empty trace).
- `review.magic_items_enchantments.1` / `character.durability.broken_magic_lost` and
  `character.magic_item.recharge` (PDF 70 "If a magic weapon or armour breaks" / "Weapons and
  armour can be recharged"): boolean input `weapon_or_armour` added to both; required in
  broken_magic_lost's `when` and in recharge's `require`. Both carry an `unresolved_references`
  note that the page does not say whether a broken magic shield or other magic object loses its
  magic or can be recharged. `test.character.durability.broken_magic_lost.break` supplies
  `weapon_or_armour: true`. The `magical == true` guard the finding mentioned in passing was not
  added (the effect is idempotent and the proposal did not ask for it).
- `review.alchemy_core.1` / `table.alchemy.habitats` (PDF 73): footnotes[1] now lists the six
  additional green cells confirmed on the 5x crop and by background sampling: Ashen Ginger—Woods
  and Highland; Bitterweed—Roadside and Plains; Giant Raspberry—Roadside and Plains; Monk’s
  Laurel—Woods and Water; Snakeberry—Water and Site; Wintercress—Water and Highland. The other
  fourteen rows were re-sampled and match the existing footnote. The optional cell-level marker
  was not added: the range-cell schema has `additionalProperties: false`, so it would need a
  schema change.
- `review.alchemy_core.1` / `character.alchemy.gathering` (PDF 73 Gathering Ingredients): inputs
  `attempts_today` (integer ≥ 0) and `alchemy_is_party_highest` (boolean) with `require`
  conditions `attempts_today == 0` and `alchemy_is_party_highest == true`, mirroring
  `character.alchemy.identify`. source_text unchanged. `usage_limits` was considered and rejected:
  its `window`/`subject` enums are Levelling Up specific.
- `review.prayers.1` / coverage row `section.prayers.will_the_gods_listen` (PDF 83 Litany of
  Metheia: "Every hero that passes a RES test ... regains 1 HP"): the opposed-Resolve list now
  names Smite The Heretics!, Stay Thy Hand! and Be Gone! only, and states that Litany of Metheia
  is a hero RES test, not an enemy test to avoid the effect.

Coverage notes for `section.magic.perfect_cast` and `section.magic.hero_spell_casting` name the
new rule and the two new fixtures.

### Pushbacks

None. Every finding was supported by the rendered page.

### Gates

`npm run validate` (481 files passed), `npm test` (3900 passed, 2 skipped; +3 fixtures),
`npm run lint` after `lint:fix` (clean), `git diff --check` (clean), `npm run report:coverage`
(regenerated). `npm run review -- check`: the ten tier 1–3 `.2`/`.3` records plus
`review.academic_skills.1` and `review.alchemy_preparations.1` remain fresh; `review.magic.1`,
`review.magic_items_enchantments.1`, `review.alchemy_core.1` and `review.prayers.1` are stale as
expected. `review.psychology_sanity.2` reports stale on `issue.sanity.acute_stress_diagnosis_expiry`,
which this unit did not touch.

## Tier 4 review corrections, round 2 — 7 October 2026

Applied by the coordinator for the one residual open finding of `review.magic.2`, checked against
rendered PDF 68 (printed 66) and PDF 66 (printed 64). The review record was not edited and nothing
was set `reviewed`; `review.magic.2` is now stale and a third review run follows.

- `procedure.hero_spell_casting`, step `enemy_dispel`: the `when` now also requires
  `spell_type == ranged`. On the chart the dispel box hangs only off the Ranged? branch; the
  Touch? branch runs AA → CS+20 → Execute effect of spell and the Incantation? branch runs
  Success? → Execute effect of spell, and Dispelling Magic prints "Touch spells or Close Combat
  Spells cannot be dispelled." The explanation is recorded in the procedure's
  `unresolved_references` (step objects have no notes field in the schema).
- New derived fixture `test.procedure.hero_spell_casting.touch_spell_no_dispel`
  (`tests/examples/magic/foundations.yaml`): touch spell, enemy target, CS 45, Arcane Arts 50,
  roll 30, enemy caster present and able to dispel; expects touch threshold 65, Mana spent 7, no
  `enemy_dispel` step and no dispel invocation. Cites the chart region and Dispelling Magic.
- `section.magic.hero_spell_casting` coverage note names the fixture and the Ranged-only gate.

Gates: `npm run validate` (481 files), `npm test` (3901 passed, 2 skipped), `npm run lint`,
`git diff --check` clean; 15 records fresh including every tier 1–3 record,
`review.academic_skills.1`, `review.alchemy_preparations.1`, `review.magic_items_enchantments.2`,
`review.alchemy_core.2` and `review.prayers.2`.

## Tier 5 — Treasure — 8 October 2026

Units: `section.treasure`, `section.treasure.searching_furniture`. Nothing set `reviewed`.

Pages inspected (rendered): PDF 108 (printed 106), with enlarged crops of the Example of Treasure
Card (front and back) in `generated/review/tier5-treasure/`; PDF 99 (printed 97) for the related
Searching Furniture text; PDF 193–195 (printed 191–193) for the Appendix V furniture tables, with an
enlarged crop of the Dead Adventurer row; changelog 2.2x PDF page 21 (entries 123–128).

Per-section disposition:

- `section.treasure`: `extracted`. Glossary `not_applicable` (no term defined in the introduction
  or the Looting run-in). Rules `extracted` (`character.treasure.enemy_loot.branch_1`–`branch_7`).
  Tables `extracted` (`table.treasure.example_card`). Examples `not_applicable` (the Example of
  Treasure Card is an annotated card picture, not a worked example). Procedures `not_applicable`
  (one table lookup chosen by the indicator; the corpse-search procedure is under Searching
  Corpses). Entities `not_applicable` (the card's Alchemist tools is
  `equipment.alchemy.alchemist_tool`, now linked from the example row).
- `section.treasure.searching_furniture`: `extracted`. Glossary `extracted` (new
  `term.furniture`). Rules `extracted` (`character.treasure.furniture_search`). Tables
  `not_applicable` (no table printed; the cited table is `table.treasure.furniture`, owned by
  Appendix V). Examples, procedures and entities `not_applicable` (none printed; the step sequence
  is `procedure.search_furniture`, owned by `section.into_the_dungeons.searching_furniture`, whose
  coverage row was not touched).

Changed objects:

- `character.treasure.enemy_loot.branch_1`–`branch_7`: `source_text` replaced with the verbatim
  Looting paragraph (it was a paraphrase); heading changed from the invented "Enemy loot
  indicators" to the printed run-in "Looting the Corpses of Your Enemies"; the Quick Reference
  Sheet pointer recorded in `unresolved_references`. Effects unchanged.
- `character.treasure.furniture_search`: verbatim `source_text` (it was a paraphrase with an
  extractor note); `unresolved_references` reduced to the printed wording; `see_also`
  `section.into_the_dungeons` for "as described in the ‘Into the Dungeon’ chapter".
- `table.treasure.example_card`, verified cell by cell on enlarged crops: the type cell is printed
  "Fine treasure" (was "Fine Treasure"); the description reads "1 Set of alchemist tools" (was
  "Alchemist tools." with an added full stop); the invented "Quantity" column was removed (the card
  has no such callout, and the line stays in the description); `source_text` is now the card text
  and footnote verbatim; extraction method `image`; `entity_refs`
  `equipment.alchemy.alchemist_tool`; the "See: ‘Selling Equipment’" pointer is unresolved (no
  heading with that title; the nearest is Buying and Selling equipment, PDF 53). No shading or
  markers on the card. Values (1d4, 200, 5) agree with Appendix III's Alchemist Tool row (200 c,
  Enc 5).
- `equipment.alchemy.alchemist_tool`: PDF 108 citation plus a reciprocal table row link to the
  example card.
- `section.treasure`: `see_also` `section.into_the_dungeons` (the "‘Into the Dungeons’ chapter
  on page 84" pointer; the chapter starts on printed 84) and unresolved "The tables can be found on
  the Quick Reference Sheet."; `section.treasure.searching_furniture`: `see_also`
  `section.into_the_dungeons`, and the extractor gloss dropped from its unresolved reference.

New objects: `term.furniture` (definition verbatim from PDF 108; also cites PDF 99) and its alias
row.

Examples: none printed in either section. New derived regressions in
`tests/rules/treasures.test.ts` (Looting branches T1–T5, ‘Part’, ‘-‘; furniture search with and
without adjacency or searchability); the example-card test now asserts the corrected cells and
the entity link.

Issues:

- `issue.phase6.furniture_treasure_table_location` (reviewed, still unresolved): summary rewritten
  to stand alone (it named "Batch 5") and to record that Appendix III is Equipment and that PDF 99
  also says "Furniture Table"; `character.treasure.furniture_search` added to `related` (it returns
  the issue); the PDF 194/195 sources now cite the printed heading "Treasure found in Furniture"
  with a table locator instead of the unprinted "Furniture continued".
- `issue.treasure.vial_destruction` (reviewed, unchanged): both statements confirmed in the text
  dump of PDF 203 ("can never run out of magic or be damaged") and PDF 205 ("if it is hit during
  battle is be destroyed"); no changelog entry addresses it. It concerns Appendix V, not PDF 108.

Rulings: changelog #126 (Dead Adventurer, "What armour?", "Fixed" with no stated rule). The
rendered PDF 194 row is complete: "10: It’s a Zombie, armed with a longsword and armour 1.", and
`table.treasure.furniture.dead_adventurer` and the `dead_adventurer` row of
`table.treasure.furniture` already match it. No issue opened; recorded as "already printed" in
`review/designer-published-rulings.md`. No other changelog or FAQ entry concerns PDF 108.

Frozen objects: none edited; none need changing.

## Tier 5 — Into the Dungeons (b) movement and obstacles — 8 October 2026

Pages inspected: PDF 93–98 (printed 91–96; labels from `pages.yaml`, no folio anomalies on these
pages). Rendered at 2x (`generated/review/tier5/`) and re-rendered at 4x with enlarged crops of
every table band and both movement diagrams (`generated/review/tier5-itdb/`).

Section tree: `section.into_the_dungeons.obstacles.rule_of_fifty_percent` was parented to the
chapter; it is a run-in heading under Obstacles and is now parented to
`section.into_the_dungeons.obstacles`. `section.into_the_dungeons.table_4` is reparented to
Obstacles and retitled "List of Obstacles" after the run-in heading that introduces it (the table
itself has no caption). Obstacles now spans PDF 93–98 (printed 91–96) to cover its run-in headings
and the table.

Per-section disposition (all now `extracted`):

- `moving_and_facing`: glossary extracted (`term.facing`, new); rules extracted (the five
  `core.movement.*` constraints); examples extracted; tables, procedures, entities
  `not_applicable`.
- `obstacles`: rules extracted (`core.obstacle.square_effects`, new); glossary, tables (owned by
  `table_4`), examples, procedures, entities `not_applicable`.
- `obstacles.climbing_furniture`: rules extracted (`core.movement.furniture`); everything else
  `not_applicable` (no printed example; the existing fixture is a derived case).
- `obstacles.climbing_pits`: rules extracted (`core.movement.pit.up_without_rope`,
  `core.movement.pit.up_with_rope`, `core.movement.pit_exit`, `core.movement.pit.down`,
  `core.movement.pit_failure`); everything else `not_applicable`.
- `obstacles.rule_of_fifty_percent`: rules extracted (`core.obstacle.half_square`); examples
  extracted; others `not_applicable`.
- `table_4`: tables extracted (`table.dungeon.obstacles`, new); others `not_applicable`.

New objects:

- `table.dungeon.obstacles` (`corpus/tables/dungeon/obstacles.yaml`): all 35 rows, Altar to Well,
  each row citing its own page; columns Square, Moving, LOS/Shooting, Height advantage, Special.
  Cells verbatim, including the printed inconsistencies "No effect" without a full stop (Chair,
  Open, Stairs), "1x." (Chest), "No Entry"/"No entry"/"No entry." and "Can’t". `-` is a
  `not_specified` marker and `N/A` an `unavailable` marker. The Example column is artwork only and
  is not transcribed; the alternating parchment/grey row shading is decorative banding, checked on
  enlarged crops. `rule_refs` link the climbable rows to `core.movement.furniture`, the
  more-than-50% rows to `core.obstacle.half_square` and Pit to the Climbing Pits rules.
  `source_text` is the List of Obstacles introduction verbatim.
- `core.obstacle.square_effects`: the Obstacles paragraph and List of Obstacles introduction joined
  with "..."; `uses_tables` the new table; "as outlined in the Room Description" is unresolved (no
  Room Description heading exists in the book).
- `term.facing` and its alias row.
- Fixtures: `test.core.movement.occupied.a_straight_blocked` (the last sentence of the blue and
  yellow squares example), `test.core.obstacle.half_square.torture_rack_white_square` and
  `torture_rack_other_squares` (the torture rack example; the more-than-half and less-than-half
  fractions are read from the diagram).

Changed objects:

- `core.movement.facing`: `source_text` was stitched without "..."; now the full three sentences.
- `core.movement.pit.up_without_rope`, `core.movement.pit.up_with_rope`, `core.movement.pit.down`:
  all three quoted the same reworded text ("Climbing Pits: ... Climbing down: there is no need");
  each now quotes its own printed passage verbatim. `rope_available` now states the printed
  qualifier "the hero or any friend adjacent to the pit has a rope".
- `core.obstacle.half_square`: `source_text` skipped the middle sentence; now the full paragraph.
- Rulebook sources of the movement and pit rules, and `core.movement.pit_exit`, marked
  `visually_verified: true`.
- `test.core.movement.diagonal_models.a_to_1`, `a_to_2`, `a_to_3`, `a_to_4_without_b` quoted the
  rule paragraph; they now quote the printed example. `test.core.movement.diagonal_border.diagram_a_to_b`
  now quotes the printed A-to-B example, and its locator names that diagram.

Examples: PDF 93 prints two (blue and yellow squares; A to B across the tile border) and PDF 94 one
(torture rack). All are executable and have fixtures; the torture rack's LOS sentence needs
supplied geometry and has none.

Issues: new `issue.movement.rope_climb_action` (unresolved; "Climbing with a rope takes 1 Action"
does not say whether that is 1 AP; returned by `core.movement.pit.up_with_rope`).
`issue.movement.pit_down_test` stays resolved by the FAQ ruling, unchanged.

Rulings: FAQ "No Dex test is needed" for climbing down stays applied. Changelog #122 (iron wedges,
"Fixed" only) concerns Wandering Monsters, Enemies and doors and Iron Wedges, not these pages;
`issue.phase6.iron_wedges_movement` is unchanged. Changelog #160–162 cite the later edition's
Combat action entries (Change Facing, Shove, Stand Up), not Moving and Facing; PDF 93 already
prints "Changing facing is a free action." with no timing restriction. No rows were added to
`review/designer-published-rulings.md`. Changelog #170 ("Statue" into "Huge Statue") sits with
#169's Fishing Pier and Water entries on the outdoor Obstacles Table, not this list.

Frozen objects: none edited; none need changing.

Gates: `validate`, `test` and `lint` fail only on files other units are editing in parallel
(Threat, Levers, Opening a Door or Chest flowchart, `table_3` redirect, combat Change Facing issue,
`chapters.test.ts` Levers assertion, prettier on combat and dungeon files). No error names an
object or file from this unit; every `core.movement.*` and `core.obstacle.*` fixture passes in
`tests/rules/pilot.test.ts`.

Gates: `npm run validate` passes for this unit's files. The full run currently fails only on
other units' in-progress work: `table.dungeon.*_levers` domain errors, combat rules citing
`term.*` ids not yet added, and a `rules/core/dungeon-setup.yaml` heading. `npm test`:
`tests/rules/treasures.test.ts` passes (74 tests, including 13 new). The remaining failures come
from the same in-progress units (Threat-roll fixtures, battle state machine, levers, and the
chapters report's redirect count of 36 against the expected 35). None involves a Treasure object.
`npm run lint`: prettier is clean on every file this unit touched, eslint and `tsc --noEmit` are
clean, and the remaining prettier warnings are in other units' dungeon files. `git diff --check`
is clean.

## Tier 5 — Into the Dungeons (a) setup, turn, Threat, traps — 8 October 2026

Scope: `general_dungeon_layout`, `doors_and_placement`, `reading_the_exploration_cards`,
`what_cards_to_include`, `generating_the_dungeon`, `initial_setup`, `the_turn`,
`the_scenario_die`, `the_threat_level`, `the_brotherhood_of_ohlnir`, `table`, `table_2`,
`table_3`, `wandering_monsters`, `triggering_a_trap`, `disarming_a_trap`, `mimics_as_traps`
(all `section.into_the_dungeons.*`). The chapter root was not touched.

### Pages inspected

| PDF | Printed | Content                                                                                  |
| --- | ------- | ---------------------------------------------------------------------------------------- |
| 86  | 84      | General Dungeon Layout, Rooms and Corridors, Placing Tiles, Doors and Placement, caption |
| 87  | 85      | Reading the Exploration Cards, card diagram, Dungeoneers Playing Cards, What cards       |
| 88  | 86      | Generating the Dungeon (steps, dead ends, abandoning, finishing), Initial Setup          |
| 89  | 88      | The Turn, The Scenario Die, The Threat Level and its run-in headings, example start      |
| 90  | 89      | Example end, Start of Turn sequence chart, The Brotherhood of Ohlnir sidebar             |
| 91  | 89      | The two Threat tables (not in battle 1d20, in battle 1d10)                               |
| 92  | 90      | Wandering Monsters, Triggering a Trap, Mimics as Traps, Disarming a Trap                 |
| 101 | 99      | Traps in Doors and Chests (quoted by `procedure.trap_resolution`; row owned elsewhere)   |

All rendered and read from `generated/review/tier5/pN.png`; the text dump was used only to
locate words. Changelog entries 121 (applied) and 122 (Fixed only) checked; the FAQ has nothing
on these pages.

### Section tree

- `the_threat_level` now spans PDF 89–92 (printed 88–90): the example ends and the Start of Turn
  sequence chart is on PDF 90. `table`, `table_2`, `table_3`, `wandering_monsters` and
  `triggering_a_trap` are re-parented to it (Wandering Monsters and Triggering a Trap use the
  same sub-heading style as Decreasing Threat Level); `mimics_as_traps` and `disarming_a_trap`
  (italic) are re-parented to `triggering_a_trap`.
- `table_3` is a compatibility redirect to `table_2`: PDF 91 prints two tables.
  `tests/reports/chapters.test.ts` redirect count 35 → 36.

### Per-section disposition

All listed sections are `extracted` except `table_3` (`mapped`, redirect). Every component is
dispositioned in the coverage note; `entities` is `not_applicable` everywhere (no catalogue entry
on these pages).

| Section                                                                  | Glossary  | Rules     | Tables    | Examples  | Procedures |
| ------------------------------------------------------------------------ | --------- | --------- | --------- | --------- | ---------- |
| general_dungeon_layout                                                   | n/a       | extracted | n/a       | extracted | n/a        |
| doors_and_placement                                                      | n/a       | extracted | n/a       | n/a       | n/a        |
| reading_the_exploration_cards                                            | n/a       | extracted | n/a       | n/a       | n/a        |
| what_cards_to_include                                                    | n/a       | extracted | n/a       | n/a       | n/a        |
| generating_the_dungeon                                                   | n/a       | extracted | n/a       | extracted | extracted  |
| initial_setup                                                            | n/a       | n/a       | n/a       | n/a       | extracted  |
| the_turn                                                                 | extracted | extracted | n/a       | n/a       | n/a        |
| the_scenario_die                                                         | extracted | n/a       | n/a       | extracted | extracted  |
| the_threat_level                                                         | extracted | extracted | n/a       | extracted | extracted  |
| the_brotherhood_of_ohlnir                                                | n/a       | n/a       | n/a       | n/a       | n/a        |
| table / table_2                                                          | n/a       | n/a       | extracted | n/a       | n/a        |
| wandering_monsters, triggering_a_trap, mimics_as_traps, disarming_a_trap | n/a       | n/a       | n/a       | n/a       | extracted  |

### New objects

- `corpus/tables/dungeon/threat.yaml`: `table.dungeon.threat_not_in_battle` (5 rows, 1d20) and
  `table.dungeon.threat_in_battle` (9 rows, 1d10), verbatim cells, decrease as numbers.
- `term.threat_level`, `term.scenario_die` (+ aliases Threat Level, Scenario die, Scenario
  Dice); `term.turn` and `term.hero_activation` now `visually_verified: true`.
- Fixtures: `test.core.dungeon.tile_placement.caption_upper` / `caption_lower` (new
  `tests/examples/core/dungeon-setup.yaml`), `test.batch_three.generation_example`,
  `test.phase6.threat_roll.in_battle`. `tests/rules/threat-level.test.ts` gains three table
  checks (full roll domain; row 16 gives the example's -6; rows 5 and 6 both print -3).
- Issues: `issue.threat.once_only_repeat`, `issue.threat.natural_twenty_high_level`,
  `issue.wandering.door_roll`. `issue.phase6.iron_wedges_movement` gains changelog entry 122 as
  a source.

### Changed objects

Threat and Wandering Monster objects (imported by the GM table):

- `core.threat.*` (9 rules): verified against PDF 89, unchanged.
- `procedure.threat_roll`: interface unchanged (inputs `threat_level`, `threat_roll`,
  `in_battle`, `threat_decrease`; same steps and effects). Added sources (Effect of Triggering the
  Threat Level, the Start of Turn chart on PDF 90, step sources for the tables and Decreasing /
  Increasing Threat Level); the PDF 91 source heading "Threat Level tables" (invented) became
  The Threat Level with a table locator; top-level source_text joined with "..."; the two table
  substeps now quote `If the party is (not) in battle:` instead of a paraphrase; step `missed`
  no longer stitches the example sentence; new dependencies `not_in_battle_rows` /
  `in_battle_rows` (table objects) and `threat_floor` (`core.threat.floor`); new issue
  `issue.threat.natural_twenty_high_level`.
- `procedure.scenario_die`: logic unchanged; added chart and table-row sources, the
  `threat_trigger` description now says the +1 from the table's row 20 is supplied as a trigger
  one lower; issue `issue.threat.once_only_repeat`.
- `procedure.wandering_monster`: logic unchanged; top-level and all 15 step source_texts now
  verbatim (were paraphrases); new issue `issue.wandering.door_roll`; see_also the_threat_level
  and table.

The frozen fixtures `test.gameplay_example.turn_1_scenario_die` and
`test.gameplay_example.threat_roll_in_battle` pin the input interface of both procedures (exact
state, the supplied `threat_decrease`, the dependency labels), so `procedure.threat_roll` cannot
look the decrease up from the new tables, and no floor clamp or Scenario die bonus input could be
added, without editing them.

Other changed objects: `procedure.trap_resolution` (all source_texts verbatim from PDF 92/101,
Mimics as Traps source, PDF 101 source on the disarm step, ruling note); `procedure.dungeon_generation`,
`procedure.dungeon_route`, `procedure.initial_setup` (verbatim source_texts, printed headings,
run-in heading sources); `core.dungeon.tile_placement`, `core.dungeon.door_placement`,
`core.dungeon.card_contents`, `core.dungeon.card_eligibility` (verbatim, printed headings,
extractor commentary moved out); `state_machine.quest_dungeon` (three PDF 88 transition quotes
verbatim); `core.quest_lifecycle.return_checks` (verbatim); fixture headings of
`test.batch_three.entrance`, `grass_exit`, `odd_pile`, `branch`; `test.phase6.threat_roll.*`
and `test.phase6.scenario_die.trigger` sources/quotes (the example quotes the printed text in
full; `missed` is now a source example).

### Examples

PDF 86 placement caption: executable, two fixtures. PDF 88 "For example, 4 Room Cards and 4
Corridor Cards ... at least 4 tiles": executable, fixture. PDF 89–90 worked example: executable
(`test.phase6.threat_roll.example`, with the Scenario die part in
`test.phase6.scenario_die.trigger`); "Had the result ... above 9": executable
(`test.phase6.threat_roll.missed`); "Had the party been in battle": not executable (no table
roll). No other printed example on PDF 86–92.

### Rulings

121 applied (already on `issue.traps.disarm_lockpick`; printed text stays quoted). 122 "Fixed"
only: cited as evidence on `issue.phase6.iron_wedges_movement`.

### Frozen objects

None edited. Would need changing to let `procedure.threat_roll` look up the decrease and apply
the floor: `test.gameplay_example.threat_roll_in_battle` and
`test.gameplay_example.turn_1_scenario_die`.

### Gates

`npm run validate`: no error names an object or section of this unit (remaining errors belong to
in-progress combat, levers and door-table units). `npm test`: 4032 passed, 2 failed in
`tests/ask/ask.test.ts` (combat hit-location and Wounded evidence, not this unit). `npm run lint`:
clean. `clients/web` `gm-rules.test.ts`: every Threat check passes (the one failure is the Mental
conditions spelling, not this unit). `git diff --check`: clean.

### Not changed

`procedure.quest_dungeon_lifecycle` (Package F composition model) keeps descriptive step texts
rather than verbatim quotes; left for review.

## Tier 5 — Into the Dungeons (c) root, searching, rest, doors, levers, encounters, events — 8 October 2026

Pages inspected (rendered): PDF 86 (chapter root), 91, 99–108; changelog PDF 24–25 (entries
150–173) re-rendered because the text dump drops entries 150–159.

### Per-section disposition (all now `extracted`; none `reviewed`)

| Section                                                   | Disposition                                                                                                                                                    |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.into_the_dungeons`                               | Root prints only the banner title; all components `not_applicable`, tables owned by the child table nodes.                                                     |
| `.picking_things_up`                                      | New rules `core.searching.arranging_found_items`, `.pick_up_dropped_weapon`; Belleck example is a source fixture.                                              |
| `.searching_furniture`                                    | New rule `core.searching.furniture_adjacent_action`; `procedure.search_furniture` verified (now lists the rule as a dependency).                               |
| `.searching_through_a_room_or_corridor`                   | New rule `core.searching.room_or_corridor_limits` (entire turn, once per room); `procedure.search_room_or_corridor` verified.                                  |
| `.rearranging_your_gear`                                  | New rules `core.gear.backpack_to_quick_slot_or_hands`, `core.gear.trading`.                                                                                    |
| `.searching_corpses`                                      | New rules `core.searching.corpses`, `.corpses_hardcore`, `.corpses_streamlined` (cites issue.0001).                                                            |
| `.identifying_items_and_potions`                          | New rules `core.identify.before_use`, `.when_found`; page pointers bound to `section.magic_items.identifying` and `section.alchemy.identifying_potions`.       |
| `.healing`                                                | New rules `core.healing.bandage_adjacent_hero`, `.bandage_self`, `.bandage_single_use`.                                                                        |
| `.rest`                                                   | Verified `procedure.rest` and the recovery procedures against the paragraph and Checklist when Resting; rules component closed on the existing recovery rules. |
| `.rest.bleeding_out_and_poisoned_characters`              | Verified; note rewritten without process narrative.                                                                                                            |
| `.opening_a_door_or_chest`                                | Verified `procedure.open_door_or_chest`, `procedure.locked_door_and_close`; rules procedure-owned.                                                             |
| `.opening_a_door_or_chest.flowchart`                      | **New section node** for the unowned PDF 102 flowchart "Opening a door or a chest"; second source on `procedure.open_door_or_chest`.                           |
| `.opening_a_door_or_chest.table`                          | Verified `table.dungeon.door_chest_difficulty`.                                                                                                                |
| `.traps_in_doors_and_chests`                              | Verified `procedure.trap_resolution` (PDF 101 source).                                                                                                         |
| `.opening_a_portcullis`                                   | Verified `procedure.open_portcullis`.                                                                                                                          |
| `.levers`                                                 | New rules `core.lever.optional`, `.deck`, `.activate`, `.red_card`, `.black_card`.                                                                             |
| `.cobweb_covered_openings`                                | Existing three rules fixed; procedures `not_applicable` (single action typed by rules).                                                                        |
| `.table_red_levers`                                       | New `table.dungeon.red_levers` (1d20, 10 rows).                                                                                                                |
| `.table_5`                                                | New `table.dungeon.black_levers` (1d8, 8 rows); node retitled **Black Levers** (id unchanged): the page is captioned and is not the dungeon events table.      |
| `.encounters`, `.initiative`, `.activation`, `.overwatch` | Verified `procedure.encounters`, `.initiative`, `.activation`, `.overwatch`; new terms `term.initiative_token`, `term.overwatch`.                              |
| `.dungeon_events_optional_rule`                           | New rules `core.dungeon_event.eligible_room`, `.trigger_roll`, `.once_per_room`, `.resolve`; its table is not printed.                                         |

`entities` dispositioned `not_applicable` on every row (no catalogue entry on PDF 99–107;
Giant Spiders and encounter enemies are Bestiary material).

### Changed existing objects

- `procedure.encounters`, `procedure.initiative`, `procedure.activation`, `procedure.overwatch`:
  every procedure-level and step `source_text` on PDF 106–107 replaced with verbatim quotes
  (they were summaries); headings `encounters`/`overwatch` corrected to the printed case, the
  invented "Activation and Overwatch" heading replaced by Activation; run-in heading sources
  added (Placing Enemies; Initiation, Setup, Bashing Down Doors, Perfect Hearing, Named Monsters;
  Activation of Enemies; Overwatch with Ranged Weapons, Overwatch with Close-Combat Weapon). The
  interpretive part of the old encounters summary moved to `unresolved_references`. Spell-page
  steps of `procedure.activation` (Time Freeze, Control Undead, Hold Creature) left as they were.
- `procedure.locked_door_and_close`, `procedure.open_portcullis`: verbatim source_texts; the
  stitched heading "Locked / Closing a door" split into Locked plus a Closing a door source;
  portcullis attempt-pairing reasoning moved to `unresolved_references`.
- `procedure.open_door_or_chest`: PDF 102 flowchart source (image); `locked_handoff` quote verbatim.
- `procedure.rest`: Checklist when Resting source; `ambush_initiative` quote verbatim.
- `procedure.search_furniture`, `procedure.search_room_or_corridor`: dependencies on the new
  searching rules (execution unchanged, so `tests/rules/treasures.test.ts` inputs still hold).
- `core.cobweb_opening.placement`, `.clearing`, `.alert`: source_texts were paraphrases, now
  verbatim; invented headings ("Cobweb Covered Openings — placement" etc.) now the printed heading.
- `table.dungeon.door_chest_difficulty`: unprinted footnote removed, locator names the uncaptioned
  Door Table, the Open row's "-" marker typed `not_specified` (was `no_increase`).
- `tests/reports/chapters.test.ts`: the Levers no-records assertion now asserts Levers is
  finished and moves the no-records check to
  `section.travelling_and_skirmishes.kredelia_the_goddess_of_travellers` (PDF 131).
- `tests/fixtures/acceptance/phases-0-6.json`: candidates healing, events and identifying items
  verified; the batch 5/7 table row notes table_red_levers and table_5 extracted and corrects
  "table_5 (PDF105 dungeon events)".

### Examples

PDF 99 "Example: Belleck spends 1 AP examining a fallen enemy ..." is executable:
`test.core.searching.arranging_found_items.belleck_leather_cap`. No other printed example on
PDF 99–107. 27 derived cases in `tests/examples/dungeon/into-the-dungeons-actions.yaml` cover
each new rule's branches.

### Issues

New: `issue.dungeon_events.table_not_printed` (rulebook_undefined), `issue.levers.count_and_deck`
(ambiguity), `issue.healing.enemies_adjacent_scope` (ambiguity),
`issue.initiative.named_large_token_stacking` (rulebook_undefined, ruling recorded).

### Rulings

- FAQ "Large creatures ... named monsters. Do they stack? Yes!" and changelog 2.21 entry 159
  (adds "If the Named Monster is also Large than a total of 3 tokens are added"): PDF 106 prints
  Named Monsters but no Large token, so recorded, not applied, on
  `issue.initiative.named_large_token_stacking`, with a row in
  `review/designer-published-rulings.md`.
- 124 (going hungry, "Minus 4 is correct"): Rest on PDF 100 prints only the ration cost, no
  going-hungry penalty. The −2 vs −4 conflict sits between Party Morale (PDF 55,
  `character.morale.event.hungry`, frozen) and Rations and Resting in Travelling (PDF 126–127).
  No issue records it. Not applied here; needs the frozen morale object changed.
- 158 (later layout adds an "Ambush" sub-head under Rest): layout only, no rule.

### Frozen objects

None edited. `character.morale.event.hungry` would need its −2 changed to follow changelog 124.
Cited only: `character.skill.heal.bandage`, `character.magic_item.identify`,
`character.alchemy.identify`, `issue.character_basics.identify_attempts`,
`character.morale.event.short_rest`, `.trap`, `.portcullis`, `character.sanity.loss.trap`.

## Tier 5 — Dungeoneering and Combat part node, Combat (a) — 8 October 2026

Unit: `section.dungeoneering_and_combat` and Combat PDF 109–117 (`section.combat` root,
`who_can_fight`, `different_combat_actions`, `zone_of_control_zoc`, `end_of_battle`,
`general_principles_of_combat`, `fumble`, `hero_attacking`, `hero_attacking.table`,
`throwing_potions`, and the new flowchart nodes `combat_turn` and `hero_attack`). Combat (b),
PDF 118–124, is a separate unit.

### Pages inspected

Rendered PDF 85 and 109–124 (`generated/review/tier5/`), and changelog pages 10 and 25
(`generated/review/tier5-combat-a/`). Folios on PDF 109–124 are PDF − 2 per `pages.yaml`; PDF 85
prints none.

### Section tree

- `different_combat_actions` now spans PDF 109–112 (its run-in headings end with Standard
  Attack on PDF 112); `general_principles_of_combat` spans PDF 112–113.
- `section.combat.fumble` is reparented from the chapter to `general_principles_of_combat`, its
  printed parent heading.
- New nodes for the two unowned flowcharts: `section.combat.combat_turn` (PDF 114, Combat Turn)
  and `section.combat.hero_attack` (PDF 116, Hero Attack), each with a coverage row.

### Per-section disposition (all `extracted`)

| Section                        | Disposition                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dungeoneering_and_combat`     | Part divider, PDF 85: every component `not_applicable`.                                                                                                |
| `combat`                       | Root, PDF 109–124: no text of its own; every component `not_applicable`, owned by children.                                                            |
| `who_can_fight`                | Rules 4 new; procedure `procedure.combat_preparation`.                                                                                                 |
| `different_combat_actions`     | Rules 37 new (plus `core.action_points.move`); examples (Shove example, Shoving caption); procedures `procedure.combat_aim`, `procedure.combat_shove`. |
| `zone_of_control_zoc`          | Rules `core.spatial.zone_of_control`, `core.movement.zone_of_control`; rest `not_applicable`.                                                          |
| `end_of_battle`                | Rules `core.battle.end`, `core.battle.nonkill_end_uncertain`; procedures `state_machine.battle`, `procedure.combat_turn`.                              |
| `general_principles_of_combat` | Rules 15 new; shooting example fixtures; procedure `procedure.combat_attack`.                                                                          |
| `fumble`                       | Rules `character.durability.fumble` plus 2 new; procedures `procedure.combat_attack`, `procedure.hero_defence`.                                        |
| `combat_turn`                  | Procedure `procedure.combat_turn` (new) with 6 derived cases.                                                                                          |
| `hero_attacking`               | Rules 3 new; tables on the `.table` node.                                                                                                              |
| `hero_attacking.table`         | `table.combat.melee_modifiers`, `table.combat.ranged_modifiers`.                                                                                       |
| `hero_attack`                  | Procedures `procedure.combat_preparation`, `procedure.combat_attack`, `procedure.combat_shove` (each now cites PDF 116).                               |
| `throwing_potions`             | Rules 7 new; procedure `procedure.thrown_preparation`.                                                                                                 |

Glossary is `not_applicable` on every row: the headwords (Battle, Combat, ZOC, Tr, Quick Slot,
Reload, Dodge, CS, RS) are terms citing other chapters, and these pages define none. Entities
are `not_applicable`: no catalogue entry is printed.

### New and changed objects

- New rule files: `corpus/rules/combat/combat-actions.yaml` (41 rules, `combat.who_can_fight.*`
  and `combat.action.*`), `general-principles.yaml` (17: `combat.principles.*`,
  `combat.fumble.*`), `hero-attacking.yaml` (3: `combat.hero_attacking.*`),
  `throwing-potions.yaml` (7: `combat.throwing.*`). Every source_text is verbatim from the
  rendered page, and every source cites the printed run-in heading.
- New procedure `procedure.combat_turn` (`corpus/procedures/combat/combat-turn.yaml`).
- `combat.fumble.enemy` quotes the PDF 112 sentence and, by changelog 68/123, invokes the Combat
  (b) rules `combat.enemy.fumble.drops_weapon` and `combat.enemy.fumble.falls_over` instead of
  duplicating them.
- `procedure.combat_preparation`, `procedure.combat_attack`, `procedure.combat_aim`,
  `procedure.combat_shove`, `procedure.thrown_preparation` and three PDF 112 steps of
  `procedure.hero_defence`: invented step headings ("requirements", "eligible", "power", …)
  replaced by printed headings (Who Can Fight?, Aim, Power Attack, Charge Attack, Shove, Shoving
  into Lava or a Chasm, Lobbing Over a Model or Obstacle, Hero Attack, Enemy Fumbles, …), and
  inspected pages marked `visually_verified`. `combat_shove.charge_cost` now cites Charge Attack
  on PDF 110, not PDF 111. `combat_aim` cites Aim on both pages.
- `table.combat.melee_modifiers` / `ranged_modifiers`: heading Hero Attacking with
  `locator.table` (was "hero attacking.table"), names are the printed column captions, and the
  line under both tables is now source_text and footnote (it was missing). Cells re-checked
  against the render; the shading is decorative striping.
- `visually_verified: true` on `core.action_points.move`, `core.battle.end`,
  `core.battle.nonkill_end_uncertain`, `core.movement.zone_of_control`,
  `core.spatial.zone_of_control`, `character.durability.fumble`.
- Existing issues: `issue.combat.power_timing` (headings Power Attack / Hero Attacking; related
  adds `combat.action.power_attack.hero_exposure`, `.enemy`, `combat.hero_attacking.to_hit`),
  `issue.combat.enemy_fumble` (heading Fumble; related adds `combat.fumble.enemy`),
  `issue.combat.shield_threshold` (heading General Principles of Combat).

### Examples

- Charge Attack example (PDF 110): not executable; it marks reachable squares on a diagram and
  straight/diagonal geometry is a caller input.
- Shove example (PDF 112): `test.combat.shove_example_success` (26 + 10 > 35) and derived
  boundary `test.combat.shove_example_25_fails`.
- Shoving caption (PDF 112): `test.combat.shove_caption_wizard_diagonal`,
  `.shove_caption_fighter_pushes_back_gnoll`, `.shove_caption_fighter_blocked_falls`.
- Shooting example (PDF 113): `test.combat.shooting_example_a_cannot_fire`,
  `.shooting_example_b_minus_10`, `.shooting_example_c_minus_20`,
  `.shooting_example_b_90_hits_d`, derived `.shooting_example_b_89_hits_target`.
- Shooting Through Doorways caption (PDF 113) and the throwing photograph caption (PDF 117): not
  executable (diagram geometry, random square).
- `procedure.combat_turn`: 6 derived cases in `tests/examples/combat/combat-turn.yaml`.

### Issues

New: `issue.combat.change_facing_timing` (conflicting, changelog 160 recorded),
`issue.combat.stand_up_prone` (ambiguity, changelog 162 recorded),
`issue.combat.charge_move_wording` (conflicting, changelog 67 recorded),
`issue.combat.long_range_weapons` (rulebook_undefined), `issue.combat.shove_displacement_order`
(ambiguity). `procedure.combat_turn` lists `issue.0001` (frozen, not edited): the Combat Turn
footer ends the sequence when all heroes or all enemies are dead, which does not settle it.

### Rulings

- 67: our PDF already has "in front of the enemy" but keeps "You must move"; the "may" wording
  is recorded, not applied.
- 68/123: already applied on `issue.combat.enemy_fumble`; `combat.fumble.enemy` follows it.
- 160 (Change Facing at any point) and 162 ("prone" under Stand Up): not printed; recorded, not
  applied.
- 161 (Shove costs 1 AP): printed in the 1 AP list on PDF 109; cited normally.
- 163 (RS at Attacking from Behind): the "Factor when shooting" table on PDF 115 prints +20;
  `combat.principles.attacking_from_behind` cites prose, table and entry.
- 164 ("Monster Card"): PDF 115 already prints Monster Card. The entry's own page (Activation of
  Enemies, PDF 118) belongs to Combat (b).
- FAQ missed throw beside a doorway agrees with the printed Throwing Through a Door Opening text.
- Rows added to `review/designer-published-rulings.md`.

### Frozen objects

None edited. Cited only: `issue.0001`, `term.battle`, `term.combat`, `term.zone_of_control`,
`term.throwable_potion`, `character.equipment.quick_slots` (via its section), `core.los.trace`
(via its section). `term.zone_of_control` still defines ZOC only as "Zone of control."; the
geometry is in `core.spatial.zone_of_control`.

### Tests and gates

16 new fixtures (`tests/examples/combat/combat-actions.yaml`, `combat-turn.yaml`), all passing.
`npm run validate` passes. `npm run lint` passes. `npm test`: 4032 passed and 2 failed, both in
`tests/ask/ask.test.ts`, and both caused by Combat (b) edits made in parallel:
`table.combat.hit_location` was renamed "1d6 / Hit location", so the test's `startsWith('hit
location')` misses it, and the `section.combat.wounded` heading evidence changed. Neither
touches this unit's records.

### Gates

`npm run validate` passes (502 files). `npm test`: 4032 passed, 2 failed, both in
`tests/ask/ask.test.ts` and both about Combat objects (`table.combat.hit_location`,
`section.combat.wounded`) that the parallel Combat unit is changing; the touched suites
(`pilot`, `phase-six`, `treasures`, `phases-0-6-acceptance`, `reports/chapters`) pass.
`npm run lint`: eslint passes; prettier flags only Combat-unit files and their coverage rows;
`tsc --noEmit` passes when run on its own.

## Tier 5 — Combat (b) — 8 October 2026

Scope: 21 Combat sections on PDF 118–124 (printed 116–122) plus the new node
`section.combat.enemy_attack`. All 22 are `extracted`; none is `reviewed`. The chapter root and
Combat (a) (PDF 109–117) belong to another unit and were not edited.

### Pages inspected

Rendered PNGs `generated/review/tier5/p118.png` … `p124.png` were read in full. PDF 119 (tables)
and PDF 123 (flowchart) were re-rendered at 4× into `generated/review/tier5-combat-b/` and cropped
to check row shading and arrow routing. Changelog 2.2x PDF 10 and 25 were rendered for entries 71,
164 and 165.

| PDF | Printed | Content                                                                                                                                                                                         |
| --- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 118 | 116     | Acting with Enemies; Activation of Enemies (1–6 order); run-ins Basic Rules, Enemies and doors                                                                                                  |
| 119 | 117     | Detailed acting with enemies; Humanoid with Close-Combat Weapon options 1–4 with italic explanations; two uncaptioned 1d10 / Action tables (alternating shading, no meaning) and the * footnote |
| 120 | 118     | Run-ins Choosing Targets, Enemy Fumbles, Parrying or Dodging, If Not in a Parry Stance, If in Parry Stance, Dodge, Parry with a Weapon, Parry with a Shield, its Example; summary box           |
| 121 | 119     | Dealing Damage with formula box; run-ins Bloodlust, Hit Area (1d6 table), Quick Slots and Damage, Wounded; Different Kinds of Damage; Acidic Damage, Disease, Fire Damage                       |
| 122 | 120     | Fire Damage continued; Frost Damage; Magic Damage; Poison; Stun; Bleeding out; Advanced Rule                                                                                                    |
| 123 | 121     | Full-page Enemy Attack flowchart                                                                                                                                                                |
| 124 | 122     | Combat Example (Round 1, Round 2), map image and photo caption                                                                                                                                  |

### Section tree

- `section.combat.detailed_acting_with_enemies` now spans PDF 119–120: PDF 120 prints no new
  chapter-level heading, so its run-ins continue that section.
- `section.combat.parry_with_a_weapon` reparented to `.detailed_acting_with_enemies`;
  `section.combat.wounded` and `.quick_slots_and_damage` reparented to `.dealing_damage` (their
  printed parent heading).
- `section.combat.different_kinds_of_damage.table` holds the Hit Area table printed under Dealing
  Damage: reparented to `.dealing_damage`, retitled "Hit Area table", legacy id kept.
- New node `section.combat.enemy_attack` (PDF 123) and its coverage row; no section owned the
  flowchart before.
- Run-in headings without nodes (Basic Rules, Enemies and doors, Choosing Targets, Enemy Fumbles,
  Parrying or Dodging, If Not / If in a Parry Stance, Dodge, Parry with a Shield, Bloodlust, Hit
  Area) are cited by `heading` with `section`, as in earlier tiers.

### Per-section disposition

| Section                            | Disposition                                                                                                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.acting_with_enemies`             | Glossary `term.behaviour_roll`. Rules: behaviour roll, 11 Basic Rules, 8 Enemies and doors. Procedures n/a (standing constraints). Entities n/a (creature categories).                                                                     |
| `.activation_of_enemies`           | Was `extracted` with components `not_started`. Rules `combat.enemy.activation_order`; procedure `procedure.enemy_priority` (verbatim source text and steps, heading fixed).                                                                |
| `.detailed_acting_with_enemies`    | Glossary `term.parry`. Rules for options 1–4, top-down rule, Choosing Targets, Enemy Fumbles, Parrying or Dodging, the two stance run-ins, Dodge, Parry with a Shield. Tables n/a naming both table nodes. Examples and procedure (below). |
| `.table`, `.table_2`               | `table.combat.humanoid_close_combat.attack` (with footnote) and `.approach`, typed 1d10 ranges.                                                                                                                                            |
| `.parry_with_a_weapon`             | Rules `combat.defence.weapon_parry` plus the two durability rules; procedure `procedure.hero_defence`.                                                                                                                                     |
| `.dealing_damage`                  | Glossary `term.bloodlust`. Rules `combat.damage.roll`, `.bloodlust`, `.bloodlust.enemies`, `.hit_area` added; existing damage rules kept. Procedure `procedure.combat_damage`.                                                             |
| `.wounded`                         | Glossary `term.wounded`; status `extracted`.                                                                                                                                                                                               |
| `.quick_slots_and_damage`          | Rules existing; inline "For example" is an illustration; procedures n/a (steps of `procedure.combat_damage` and `procedure.enemy_attack`).                                                                                                 |
| `.different_kinds_of_damage`       | Intro sentence descriptive; glossary, rules, tables n/a; procedures existing.                                                                                                                                                              |
| `.different_kinds_of_damage.table` | `table.combat.hit_location` now typed: ranges, `random_table`, roll domain 1–6, printed heading, locator and calling sentence.                                                                                                             |
| Acidic, Fire, Frost, Stun, Magic   | One term each; rules `combat.damage.acidic(.negated/.continues)`, `.fire(.extinguished/.continues)`, `.frost`, `.stun`, `.magic(.complications)`.                                                                                          |
| Poison                             | `term.poison`; nine `combat.poison.*` rules. Procedures `procedure.damage_follow_up`, `procedure.poison_cure` verified and cited, not duplicated.                                                                                          |
| Disease                            | `term.disease`; four `combat.disease.*` rules. `procedure.disease_cure` verified and cited.                                                                                                                                                |
| `.bleeding_out`, `.advanced_rule`  | `term.bleeding_out`; existing rules and procedures; tables, examples, entities n/a.                                                                                                                                                        |
| `.combat_example`                  | Examples `extracted` (below).                                                                                                                                                                                                              |
| `.enemy_attack` (new)              | Rules `combat.enemy.attack_threshold.standard`, `.power`; procedure `procedure.enemy_attack`.                                                                                                                                              |

### New and changed objects

- New files: `corpus/rules/combat/acting-with-enemies.yaml` (45 rules),
  `corpus/rules/combat/different-kinds-of-damage.yaml` (27 rules),
  `corpus/tables/combat/enemy-behaviour.yaml` (2 tables),
  `corpus/procedures/combat/humanoid-close-combat-behaviour.yaml`,
  `corpus/procedures/combat/enemy-attack.yaml`, `tests/examples/combat/enemy-behaviour.yaml`,
  `tests/examples/combat/enemy-attack.yaml`.
- 12 new terms (`term.behaviour_roll`, `.parry`, `.bloodlust`, `.wounded`, `.acidic_damage`,
  `.fire_damage`, `.frost_damage`, `.magic_damage`, `.stun`, `.poison`, `.disease`,
  `.bleeding_out`) with 15 alias forms.
- Changed: `procedure.hero_defence`, `procedure.combat_damage`, `procedure.bleeding_out` top-level
  `source_text` now verbatim; every PDF 118–124 source heading in the combat procedures, the
  hit-point and durability rules and their fixtures now names the printed heading (invented
  headings like "start", "location head", "poison rest" replaced); `visually_verified` set where
  the page was inspected. Step-level `source_text` in those large procedures remains a modelling
  summary. `character.durability.overlap_uncertain` and `.quick_slot_hit` quotes now use "...";
  `character.hit_points.zero` gains the Dealing Damage source.

### Examples

| Example                                         | Classification                                            | Fixture                                                                                                                                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Option 1 italic explanation (PDF 119)           | Executable                                                | `test.combat.humanoid_behaviour.make_room`                                                                                                                                                                                       |
| Option 2 italic explanation                     | Executable via the Combat Example                         | `test.combat.gnoll_standard_then_parry`                                                                                                                                                                                          |
| Option 3 italic explanation                     | Derived (no roll printed)                                 | `test.combat.humanoid_behaviour.approach_parry`                                                                                                                                                                                  |
| Option 4 italic explanation                     | Executable                                                | `test.combat.humanoid_behaviour.advance`                                                                                                                                                                                         |
| Parry with a Shield Example, Berthram (PDF 120) | Executable except the padded-jacket step (no DEF printed) | `test.combat.shield_parry_example.berthram`                                                                                                                                                                                      |
| Quick Slots "For example" (PDF 121)             | Illustration                                              | none                                                                                                                                                                                                                             |
| Combat Example (PDF 124)                        | 9 executable steps                                        | `test.combat.variya_charge`, `.variya_hit`, `.variya_damage`, `.gnoll_power_behaviour`, `.gnoll_power_attack_dodged`, `.gnoll_standard_then_parry`, `.gnoll_second_roll_parry`, `.variya_frenzy_damage`, `.variya_second_target` |

The three existing Combat Example fixtures now quote the printed text verbatim. Non-executable
steps are listed in the coverage note. Derived cases: 8 more for the humanoid procedure (every
branch) and 11 for `procedure.enemy_attack` (every branch).

### Issues

- New: `issue.combat.enemy_poison_damage` (entry 165, recorded, not applied),
  `issue.combat.behaviour_card_naming` (entry 164, recorded, not applied),
  `issue.combat.door_turns_and_ap`, `issue.combat.humanoid_behaviour_text` ("1d610", "In unable"),
  `issue.combat.enemy_attack_flowchart` (spillover routing, NA missing from DMG − DEF).
- Updated: `issue.phase6.iron_wedges_movement` (PDF 118 third version, summary),
  `issue.damage_follow_up.continuation_basis` (entry 71 as evidence; headings),
  `issue.combat.example_conflicts` (summary corrected: the roll-2 Standard Attack matches the
  footnote; the second roll is the tension; headings; related fixtures), `issue.phase4.damage_floor`
  (related was empty), PDF 120 headings on `issue.combat.power_timing`, `.enemy_fumble`,
  `.shield_threshold`; related lists of the poison, disease, stun, magic and zero-HP issues.

### Rulings

- 68/123: already applied on `issue.combat.enemy_fumble`; the new fumble rules cite both entries.
- 71, 122: "Fixed" only; cited as evidence.
- 164, 165: our PDF does not print the changed text; new issues and "recorded, not applied" rows in
  `review/designer-published-rulings.md`.
- 69 (grammar of "requires") and 70 (placement of Enemies and doors): our PDF already has the
  separate Enemies and doors heading; no rule change.

### Frozen objects

Referred to, not edited: `character.equipment.quick_slots`, `character.durability.armour_damage`,
`character.sanity.loss.head_wound`, `character.damage_bonus.lookup`, `term.dodge`,
`term.quick_slot`, the Alchemy cure preparations, `issue.phase4.durability_overlap`. Nothing
frozen needs to change.

### Tests

New: `tests/examples/combat/enemy-behaviour.yaml` (11 cases) and
`tests/examples/combat/enemy-attack.yaml` (11 derived cases). `tests/examples/combat/worked-example.yaml`
now has 9 fixtures (3 rewritten, 6 new). `tests/ask/ask.test.ts`: the hit-location label test now
matches the printed table name "1d6 / Hit location", and the Wounded heading test accepts
`term.wounded`, which now ranks with `procedure.wounded_status` in that heading's two slots and
quotes the same defining sentence.

### Gates

`npm run validate` (502 files), `npm test` (4034 passed, 2 skipped) and `npm run lint` passed at the
end of the unit. A first full test run under concurrent load timed out two decision-CLI tests; they
pass alone and in the final full run.

## Tier 5 review corrections — Into the Dungeons (a), (b), (c) — 8 October 2026

Records: `review.into_the_dungeons_setup.1` (4 open), `review.into_the_dungeons_movement.1` (1 open),
`review.into_the_dungeons_actions.1` (7 open). Each finding was checked against the rendered
rulebook page (PDF 88, 92, 99, 101, 107) and, for the ruling, the rendered changelog page 24.

### Setup record

- `procedure.quest_dungeon_lifecycle` (transcription): applied. The procedure `source_text` is now
  the two printed paragraphs of PDF 88 (Abandoning your Quest, Finishing your Quest), joined by
  "...". Each step quotes the printed sentence it executes (`request_layout` and `abandon`: the
  abandon sentence; `return_begin`, `request_repopulation` and `resume`: the repopulation
  sentence; `accomplished`: the first Finishing sentence; `exit`: both Finishing sentences).
  `first_entry` is re-cited to Leaving on a Quest (PDF 133, printed 131) and Initial Setup (PDF 88,
  printed 86) with printed wording. The structural reading moved to the procedure's
  `unresolved_references` (procedures have no notes field).
- `state_machine.quest_dungeon` (transcription): applied. Top-level `source_text` is the printed
  PDF 88 paragraphs; the structural summary and a statement that the offered and accepted
  transition wording (PDF 132, 133) is an unverified paraphrase moved to `unresolved_references`.
  Verifying those two quotations against PDF 132-133 stays with the Embarking/Quests unit.
- `procedure.wandering_monster` (modelling): applied after checking PDF 92. "A magically sealed
  door or Iron Wedged door will stop the token ... The seal is then broken" covers both door kinds.
  Step `break_seal` now fires for `door_state` magically_sealed or iron_wedged (with the door held
  the previous turn and a roll of 5 or more), and its `source_text` quotes the whole sentence.
  Behaviour change for consumers: only the `seal_broken` output. A token passing an Iron Wedged
  door on a 5-6 now returns `seal_broken: true`; before it stayed unset. `door_state` (set to open),
  `waiting_at_door`, `movement_stops` and every other output are unchanged, and nothing changes for
  closed or magically sealed doors. New fixture
  `test.phase6.wandering.iron_wedged_door_seal_broken`; `tests/rules/phase-six-batch-two.test.ts`
  gains a four-row table (iron_wedged 5 and 4, magically_sealed 5, closed 6).
- `test.phase6.trap.disarm_fails` (source reference): applied. It now cites changelog 2.21 row 121
  (PDF 19) next to PDF 92. New derived fixture `test.phase6.trap.disarm_needs_tool`
  (`has_disarm_tool` false skips the disarm step, so the trap is neither removed nor set off).

### Movement record

- `test.core.obstacle.half_square.torture_rack_white_square` and `.torture_rack_other_squares`
  (modelling): applied. The locator region now says the 0.75 and 0.25 values are estimates read off
  the diagram and that the book prints only the outcome; confidence lowered to medium.
- Not an open finding, done as requested: `core.movement.pit.up_without_rope` and
  `core.movement.pit_failure` now list `issue.movement.pit_climb_up_failure` in `issues`.

### Actions record

- `core.dungeon_event.*` (four rules, modelling): applied. New boolean input
  `dungeon_events_rule_in_use`; trigger_roll and resolve require it in their `when`, and
  eligible_room and once_per_room gain a `when` on it. Existing fixtures supply it as true; new
  negative fixtures `test.core.dungeon_event.trigger_roll.nine_rule_not_in_use` and
  `test.core.dungeon_event.eligible_room.objective_room_rule_not_in_use`.
- `core.gear.trading` and `core.gear.backpack_to_quick_slot_or_hands` (modelling): applied. New
  input `in_battle`; both rules apply only when it is false ("In between battles"). trading quotes
  the framing sentences joined to the trading sentence by "...". Both `see_also`
  `section.combat.different_combat_actions` (Exchanging Gear, PDF 111). New fixtures
  `test.core.gear.trading.in_battle` and
  `test.core.gear.backpack_to_quick_slot_or_hands.in_battle`; existing ones supply `in_battle:
false`.
- `procedure.rest` (modelling): applied. New outputs `awake_hero_randomised` and
  `other_heroes_start_prone`: the ambushed step sets both true; the barred-door step sets
  `other_heroes_start_prone` false (all heroes start the fight standing up). Fixture
  `test.phase6.rest.ambushed` expects them; new `test.phase6.rest.ambushed_barred_door`;
  `tests/rules/rest-lifecycle.test.ts` asserts the posture for both branches.
- `issue.phase6.door_open_threat_source` (source reference): applied after rendering changelog
  page 24. Entry 155 states the corrected wording ("The instant a door or chest is checked, or a
  cobweb opening is cleared", because a door or chest can be left unlocked but still closed), so
  it is a stated rule and applies under the rulings policy. The issue is resolved with the entry as
  source; `procedure.open_door_or_chest` (procedure and step `increase_threat`) and
  `core.threat.increase.door_chest_or_cobweb` cite it. No effect changed: the procedure already adds
  one +1 at step 1 (the check) and the rule keeps its input names, so a consumer importing the Threat
  procedures sees no difference. Row added to `review/designer-published-rulings.md` as applied.
  The printed "opened" text stays verbatim.
- `state_machine.battle` (source reference): applied. Source for PDF 89 (The Turn) added; the
  battle_active enter `source_text` now reads "Continue to draw tokens until all have been taken
  and all models have been activated."
- `table.dungeon.door_chest_difficulty` (transcription): applied. Row `open` `source_row` is
  "1-6 Open -".
- `test.phase6.search_room.with_helpers` (modelling): applied. Renamed to "three searching heroes
  stack +15 on the highest PER"; values unchanged.

Coverage notes updated for wandering_monsters, disarming_a_trap, rule_of_fifty_percent,
rearranging_your_gear, rest and dungeon_events_optional_rule. No coverage status changed. No new
issues. No frozen object needed a change.

## Tier 5 review corrections — Combat (a), (b1), (b2) — 8 October 2026

Corrector for `review.combat_actions.1` (13 open), `review.combat_enemies.1` (9 open) and
`review.combat_damage.1` (5 open). Every finding was checked against the rendered pages before
editing: PDF 107, 109–124 (existing renders), PDF 18, 70 and 179, and changelog pages 10 and 25
(rendered for this pass). Review records were not edited.

### Rulings

- Changelog 2.21 #160 (Change Facing "at any point in a model's activation") states its rule, so it
  is applied: `combat.action.change_facing` keeps the printed quotation; its requirement is now
  "during the activation" plus the printed "not after moving on to another model".
  `issue.combat.change_facing_timing` resolved citing #160.
- Changelog 2.21 #67 ("You may move ...") states its sentence, so it is applied consistently:
  `combat.action.charge.requirements` keeps the printed quotation and its requirements are
  unchanged under "may" (1 empty square, straight or strict diagonal line, end in one of the 3
  squares in front of the enemy). `issue.combat.charge_move_wording` resolved citing #67.
- Changelog 2.21 #162 ("added ‘prone’ to Stand Up") is a terminology change that states no rule:
  kept as recorded evidence; `issue.combat.stand_up_prone` summary now says why.
- `review/designer-published-rulings.md`: #160 and #67 moved to the applied table; #162 row
  explains why it stays recorded.

### combat_actions (13 open)

- 91-00 on attack (procedure.combat_attack): applied. Hit step needs `roll lte 90`, cites PDF 18
  (Dice Rolling and Skill Checks names hitting in combat). The intervening-model step (unmodified
  ≥90) is unchanged, as the reviewer advised.
- 91-00 on throw (procedure.thrown_preparation): applied, same change, PDF 18 cited.
  `issue.combat.shove_automatic_failure` (new from the review) kept consistent: its summary now says
  attack and throw apply the automatic failure; shove (roll-over test) stays open, and
  `combat.action.shove.success` and `procedure.combat_shove` return it.
- Door modifier (procedure.thrown_preparation): applied. New input `in_front_of_door` gates the -10;
  `adjacent_to_door` only routes a failed toss.
- Shove order (procedure.combat_shove): applied. New input `displacement_case` (straight_free,
  push_model_behind, diagonal, blocked) with the rule's branch conditions; a new step
  `displacement_case_check` rejects a case whose conditions do not hold. The procedure returns
  `issue.combat.shove_displacement_order` and is in its `related` list.
- Actor and weapon qualifiers: applied. `is_hero` required on `combat.action.pick_lock`,
  `.break_down_door`, `.search`, `.apply_bandage.self`; `ranged_weapon` on `combat.action.aim`;
  `actor_is_priest` and `during_priests_turn` on `combat.action.prayer`.
- Who Can Fight?: applied. `combat.who_can_fight.missile_range` applies only when
  `weapon_is_missile_weapon`; `.long_range_adjacent` only when `weapon_is_long_range_weapon`
  (supplied, the category stays undefined under `issue.combat.long_range_weapons`).
- Fumble actor: applied. `is_hero` in the `when` of `combat.fumble.dodge_or_shove` and
  `character.durability.fumble`; procedure.hero_defence sets `is_hero` true at its start step.
- Shooting at Large-Sized Monsters: applied. `shooter_is_hero` and `shooting` added.
- Area of effect: applied. `combat.throwing.area_large_enemy` needs `area_effect_potion` and
  `hits_square_covered_by_large_or_x_large`.
- Changelog #160: applied (see Rulings).
- Aim and Overwatch (procedure.combat_aim): applied after rendering PDF 107. Overwatch with Ranged
  Weapons only says "Perks and Talents may be used during this shot, but not for aiming"; it does
  not forbid aiming. The `overwatch` input, gate and text were removed and the reading recorded as
  a procedure-level unresolved reference.
- Fumble step sources (procedure.combat_attack): partly applied, partly pushed back. magic_fumble
  now cites Dissipating Magic (PDF 70). No page prints a Fast-weapon exception to attack fumbles
  (Fast, PDF 179, concerns parrying), so the uncited `chosen_fast_immunity` gate was removed rather
  than cited. Pushed back on adding a durability effect to fumble_durability: its `rule_refs`
  executes `character.durability.fumble` (-1), and an effect would deduct twice; a test now asserts
  durability 6 → 5 at 100.
- Step source_text (five procedures): applied. Every step and procedure-level `source_text` of
  procedure.combat_preparation, .combat_attack, .combat_aim, .combat_shove and
  .thrown_preparation now quotes printed sentences or Hero Attack chart labels joined by "...",
  with each step citing the pages it quotes (PDF 18, 70, 109–117).

### combat_enemies (9 open)

- `combat.defence.through_zoc`: applied. ZOC is required on its own; a second requirement allows
  arrows or strikes unless `talent_or_perk_forbids`.
- `combat.enemy.door.iron_wedges`: applied. `creature_kind ne ethereal`; source_text adds the
  Ethereal sentence.
- `combat.enemy.choosing_targets`: applied. Split: the existing id keeps the untargeted-target
  preference (first sentence); new `combat.enemy.choosing_targets.stick_with_target` fixes the
  target for the turn and re-evaluates next turn, with no condition on untargeted targets.
- `character.durability.weapon_parry`: applied. Needs `weapon_parry`; procedure.hero_defence sets
  it in the weapon steps.
- `character.durability.overlap_uncertain`: applied. Cites Fumble (PDF 112) and Dissipating Magic
  (PDF 70) and quotes the overlapping sentences.
- procedure.hero_defence step source_text: applied (PDF 120 and 112 sentences).
- procedure.hero_defence qualifiers: applied. The dodge step cites Aim (PDF 109–110, "An aiming
  model cannot dodge"). New steps `fast_weapon_parry` (once per turn outside Parry Stance,
  `rule_refs` combat.weapon.special.fast) and `fast_weapon_damage` (90-00,
  combat.weapon.special.fast.damage), citing Weapons (PDF 179). The old "Fast exempts" at 95 had no
  source and is gone. New issue `issue.combat.fast_parry_in_stance` (does 90-00 also apply to a Fast
  weapon parrying in Parry Stance?).
- procedure.enemy_priority: applied by citation. The select step cites Activation (PDF 107: one
  activation per model; tokens returned for models alive/not knocked out); the field description
  now reads "could make room for more enemies".
- Option 2 italic explanation: applied. Quoted with a second source on
  `combat.enemy_behaviour.humanoid_close_combat.parry_with_two_ap`; new source_example
  `test.combat.humanoid_behaviour.parry_first_action_two_ap`.

### combat_damage (5 open)

- `combat.poison.rest_death`: applied. Needs `hp_lost_to_poison_roll`.
- `combat.enemy.zero_hp`: applied. `hit_points lte 0`; procedure.combat_damage's negative_hp step
  now applies to heroes only; `test.combat.variya_frenzy_damage` asserts the printed death (6 HP −
  7 = −1, dead); the "below 0" clause left `issue.combat.example_conflicts`.
- `character.hit_points.no_rescue`: applied. Needs `bleeding_out`.
- `character.death.replacement`: applied. Needs `replacement_chosen`.
- `issue.combat.example_conflicts`: applied. The Gnoll's 10 HP is derived (4 damage + "6 Hit
  Points left"); 4 of 10 is below the 50% (RDU) Wounded threshold, yet the example says "the
  wounded Gnoll". Status stays unresolved.

### Tests

New fixture files `tests/examples/combat/qualifier-guards.yaml` (34 derived cases, positive and
negative for each new guard) and `tests/examples/combat/damage-guards.yaml`; new cases in
`tests/examples/characters/hit-points.yaml`, `tests/examples/equipment/encumbrance-durability.yaml`
and `tests/examples/combat/enemy-behaviour.yaml`. Existing fixtures supply the new inputs.
`tests/rules/combat-procedures.test.ts` covers 91-00 on attack and throw, the door squares, the
shove cases (either order, rejected case), the Fast parry, aim without an Overwatch gate and enemy
overkill. `tests/schema/review.test.ts` lists the two newly resolved issues.

Coverage notes updated for who_can_fight, different_combat_actions, general_principles_of_combat,
throwing_potions, detailed_acting_with_enemies, combat_example, parry_with_a_weapon,
activation_of_enemies, bleeding_out, dealing_damage and different_kinds_of_damage.poison. No
coverage status changed. New issue: `issue.combat.fast_parry_in_stance`. No frozen object needed a
change (core.check.automatic_failure and issue.phase4.durability_overlap are cited only).

## Tier 5 review corrections, round 2 — Into the Dungeons (c) — 8 October 2026

Record `review.into_the_dungeons_actions.2`: three open findings, all applied. PDF 189–191 and 193
were rendered and read (`generated/review/tier5-corr2/`); each proposed quotation matches the page.
Logic (`when`, effects, transitions) is unchanged.

- `state_machine.battle` top-level `source_text`: replaced with three printed sentences joined by
  "..." ("If enemies are placed on the table, ..." from PDF 89; "As soon as enemies are placed on
  the board these rules are activated." from PDF 107; "Once all enemies are dead, ..." from PDF
  109). The structural summary moved to `unresolved_references`, as on `state_machine.quest_dungeon`.
- `procedure.activation` steps `time_freeze` (PDF 191, printed 189), `controlled` (PDF 189, printed 187) and `held` (PDF 190, printed 188): `source_text` is now the printed spell text, and each step
  carries its own `source`. Effects unchanged.
- `procedure.search_room_or_corridor` step `treasure_handoff`: `source_text` is now "Roll on this
  table to see if the party has discovered anything of interest when searching a tile." (PDF 193).
  The "supplied successful search" framing stays in the step's `when`.

New issues: none. Rulings: none. Fixtures: none needed (no condition changed). No frozen object
needed a change; no Combat object was touched.

## Tier 5 review corrections, round 2 — Combat (a) — 8 October 2026

Record `review.combat_actions.2`: two open findings on `procedure.combat_attack`, both applied. PDF
113, 116 and 120 were read on the rendered pages (`generated/review/tier5/`).

- Enemy fumble steps `enemy_fumble` and `enemy_fumble_falls_over`: `source_text` is now the
  printed Enemy Fumbles sentence (PDF 120, printed 118) "An enemy that rolls 100 when attacking
  drops its weapon, if it has one, or falls over." in both. Conditions and effects unchanged
  (changelog entries 68 and 123 still govern them).
- Step `intervening` is unchanged and keeps 90-99. New step `intervening_fumble_unresolved` fires
  on a ranged shot past a model (`passed_models`) with roll 100 and returns
  `issue.combat.shooting_past_fumble` (PDF 113 and 116) instead of choosing between hit and miss.
  The hero fumble durability step still runs, as Fumble applies to any hero 100. The issue is added
  to the procedure's `issues` and to `combat.principles.shooting_past_model`'s `issues`; the issue's
  `related` already listed both and its summary now describes the new step.

New issues: none. Rulings: none. Fixture: a new case in `tests/rules/combat-procedures.test.ts`
covers 100 (issue returned, no hit, durability fumble), 99 (hits the model, no issue) and 100 with
no model passed (no issue). Existing fixtures unchanged. No frozen object needed a change; no Into
the Dungeons object was touched.

## Tier 5 review corrections, round 3 — Combat (a) — 8 October 2026

Applied by the coordinator: the single `disposition: open` finding in `review.combat_actions.3`
(coverage_error). The `section.combat.general_principles_of_combat` coverage note now names the
attempt, hit, intervening (rolls of 90-99) and intervening_fumble_unresolved steps of
`procedure.combat_attack`, and lists `issue.combat.shooting_past_fumble` as open. Status and
components unchanged; no corpus object other than that coverage row changed.

## Changelog 2.21 entry 124 (going hungry) applied — 8 October 2026

At the user's request: `character.morale.event.hungry` now lowers Party Morale by 4 per
occurrence (was 2). The printed table row "Party is hungry / ... / -2" (PDF 58) stays quoted; the
rule and `test.character.morale.event.hungry.once` (10 → 6) also cite changelog 2.21 entry 124
(changelog PDF 21), which quotes the Rations and Resting sentence "Party Morale is also lowered by
4" (PDF 126–127, verified on the rendered pages) against the table row and answers "Minus 4 is
correct". New resolved issue `issue.psychology.hungry_morale_penalty`; entry 148 ("-1/char.") and
the 2.5 Quick Reference Sheet ("A Party member is hungry (per member) -2") are recorded as
later-edition evidence only. The QRS was added as `source/vonbraus-qrs-2.5.pdf`
(`vonbraus.qrs_2_5`, new manifest class `official_reference`, documented in the extraction
guide). The Rations and Resting rule itself (duration, non-cumulation) is still tier 6 work.
`section.psychology.party_morale` and the four sections backed by `review.psychology_tables.2`
were set back to `extracted` for re-review.

Revised the same day after `review.psychology_party_morale.3` (failed: entry 148 sits in the same
2.21 table as entry 124 and states a rule, so it is not later-edition evidence). By user decision,
changelog 2.21 entry 148 is applied instead of entry 124: `character.morale.event.hungry` now takes
`hungry_characters` and lowers Party Morale by 1 per hungry character (cumulative across party
members, mercenaries included); it cites changelog PDF 23 row 148. Fixtures:
`test.character.morale.event.hungry.once` (three characters, 10 → 7) and new
`.single_character` (10 → 9). `issue.psychology.hungry_morale_penalty` stays resolved, now citing
entry 148, with entry 124 recorded as superseded and QRS 2.5 as later-edition evidence; its summary
notes that entry 148 does not say whether it overrides PDF 127's "This is not cumulative" across
days. The rulings row is updated. Party Morale and Psychology tables go to fresh re-review.

Applied the one open finding of `review.psychology_party_morale.4`: `character.morale.event.hungry`
and `procedure.travel_food_and_rest` now list the reviewer's new unresolved issue
`issue.psychology.hungry_morale_duration_and_travel_penalty` (entry 148 gives no duration and does
not say how it combines with Rations and Resting's -4 on PDF 127). The optional pointer edit to
`issue.psychology.hungry_morale_penalty` was not made, to keep `review.psychology_tables.4` fresh;
`issue.rest.without_ration` still cites entry 124's -4 and is left for the next review of its unit.
