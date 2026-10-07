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
