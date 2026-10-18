# Quest Book I, Backgrounds and the Grieving Mother reconciliation (Step 3)

This ledger records Step 3 of the [completion plan](../corpus-completion-plan.md#step-3--quest-book-i-and-personal-quests-reconcile-and-review-done-18-october):
the Step 2 loop applied to Quest Book I (PDF 221–279), Backgrounds (PDF 42–50) and the Grieving
Mother side quest (PDF 164–165) at catalogue scope. It is the extractor's record, not review
evidence. Sections reach `extracted` here; only an independent review record under
`review/independent/` can make them `reviewed`.

Coverage convention for this step: per-quest ordered lifecycles are optional work outside catalogue
scope (plan §6). A quest or background whose page prints no ordered procedure of its own marks
`procedures: not_applicable` and names the shared procedures it runs through; a page that prints
one has it extracted.

The authoritative source is [Rulebook-2nd-printing-ENGa.pdf](../../source/Rulebook-2nd-printing-ENGa.pdf).
Printed/PDF pairs come from [pages.yaml](../../corpus/source-map/pages.yaml).

## Step 3 — Backgrounds (PDF 42–50) — 18 October 2026

### Pages inspected

Rendered PDF 42–50 (printed 40–48) from `generated/review/step3/pN.png`, re-rendered at 4× into
`generated/review/step3/bg/hi/` and cropped where punctuation mattered (The Well and
Arachnophobia pointers, Revenge faction quote, Lost Brother "+ 10 RES", Weak "overdrive and",
the example's skills sheet). Changelog 2.2x PDF page 23 rendered (`bg/cl/p23.png`) for entries
142–144. The FAQ snapshot has no entry on these pages.

### Per-section disposition (all 23 rows now `extracted`)

| Section                                         | glossary | entities  | rules     | tables | procedures                                                                                          | examples  |
| ----------------------------------------------- | -------- | --------- | --------- | ------ | --------------------------------------------------------------------------------------------------- | --------- |
| `section.backgrounds` (root, PDF 42 title only) | n/a      | n/a       | n/a       | n/a    | n/a                                                                                                 | n/a       |
| 1–5, 7–20 (each background)                     | n/a      | extracted | extracted | n/a    | n/a (no own ordered procedure; taken in `procedure.character_creation`'s optional Background stage) | n/a       |
| `6_the_lost_brother`                            | n/a      | extracted | extracted | n/a    | **extracted** (`procedure.lost_brother_personal_quest`)                                             | n/a       |
| `dwarfs` (fiction sidebar, was `mapped`)        | n/a      | n/a       | n/a       | n/a    | n/a                                                                                                 | n/a       |
| `character_creation_example` (PDF 49–50)        | n/a      | n/a       | n/a       | n/a    | n/a                                                                                                 | extracted |

Procedure decision: only 6. The Lost Brother prints a multi-step "roll → place → enter → roll →
branch → later death reverts" chain; the others are one conditional rule or a roll plus a reward
(Heirloom, Sworn Enemy, 16. Revenge), whose order the rule conditions already carry.

Section map: `section.backgrounds.character_creation_example` now spans PDF 49–50 (printed
47–48). `see_also`/`external_references` added on 2, 4, 5, 6, 7, 10, 13, 14, 16, 17 and the
example (Psychology, talents, encounters, Dungeon Generator, Armour of the Father, Buying an
Estate, Embarking on your First Quest; `bestiary`).

### Changed objects (58 existing YAML files, all background-owned, none frozen)

- Every rulebook source in `corpus/entities/backgrounds/*`, `corpus/entities/quests/background-*`,
  `corpus/rules/characters/background-*`, `corpus/entities/quest-actors/background-*` and
  `equipment.quest.great_aunt_sword`: invented headings ("Wanderlust: reward", "… personal quest")
  replaced by `section: Backgrounds`, the printed heading ("1. Wanderlust" … "20. Afraid of
  Heights", "17. A new Home") and `locator.paragraph` with the run-in label (Personal Quest,
  Personal Trait and Quest, Personal trait and quest, Personal Trait(s), Effect, Talent).
- Verbatim quotes fixed: Arachnophobia "(See Psychology Chapter)" ×4; The Well/Arachnophobia
  initial traits (dropped pointer); Revenge "Bandits and Brigands’ faction" ×3 and re-capitalised
  kill reward; Poverty coin reserve and family gift; Proving claim armour; Fraud entity/quest
  (missing "..."); Noble low-money stitch; Family Keep entity/quest/reward; Weak entity
  ("overdrive and"), improved immunity, improved cure; Afraid of Heights bridge; Lost Brother
  "+ 10 RES" ×3, carrying restrictions, discovery. Extractor summaries replaced by verbatim text
  in `equipment.quest.great_aunt_sword`, `quest_actor.background.lost_brother`, `.sworn_enemy`,
  `.scarred_minotaur`.
- Modelling: `character.background.the_heirloom.quest_setup` and `…the_lost_brother.quest_setup`
  gain the printed "At the start of each quest" qualifier (`at_quest_start`);
  `…the_lost_brother.discovery` no longer sets `brother_alive: false` unconditionally and now
  requires the brother tile and room entry; `…death_after_rescue` requires a living brother and
  sets `brother_dead` (revert to the dead result); `…surviving_brother` follows changelog #142;
  `…revenge_minotaur.reward` follows changelog #143; `background.the_lost_brother.rules` now lists
  `release_body_at_danger`.

### New objects

- `character.background.the_lost_brother.remains_found` (60 or higher: dead, leave/bury choice).
- `procedure.lost_brother_personal_quest` (`corpus/procedures/quests/lost-brother.yaml`), nine
  steps over the eleven Lost Brother rules.
- Fixtures `tests/examples/characters/creation-example.yaml`: `test.backgrounds.creation_example.`
  `specialisation`, `class_3_one_hand`, `class_4_two_hands`, `morning_star_one_hand`,
  `morning_star_wear`, `night_vision`, `the_well`, `party_morale` (all `source_example`).
- Tests `tests/rules/backgrounds.test.ts` (21): printed headings on every background source,
  quote regressions, Lost Brother procedure paths (dead + burial, dead + leave, alive + rescue,
  alive then dies), Bandit Monster Card, example skills computed from the Warrior Priest Skills
  and Skill List tables (9 of 10 match; CS 47 vs printed 42), Leather Jacket coins, standard
  Durability 6 feeding the wear fixture, Holy Water quick-slot break. Updated
  `tests/rules/phase-five.test.ts` (Heirloom qualifier, discovery split, Minotaur 1500 XP).

### Examples

Character Creation Example: executable parts are the eight fixtures above plus the derived
catalogue checks. Not executable: stat and HP rolls (results not printed as rolls), Sanity 8 /
Movement 4 / Energy 2 restatements, Braveheart, prayer and relic choices, bonus-column
bookkeeping, naming. No other "Example:" is printed on PDF 42–48.

### Typed dice and restrictions

No background table rows in `text-dice-rows.tsv`. Dice in background source_text are all typed:
Heirloom and Lost Brother 1d10 (`quest_start_roll`), Lost Brother 1d100 (`roll`), Sworn Enemy
1d10, 16. Revenge 1d6, Weak natural CON 01-10 (1d100). Restrictions checked: "You may not sell
it" (sale_allowed false), "Not applicable for wizards" (wizard_reroll + initial_penalties guard),
"less than 10 c" (require), "not Silver City" (pool), "cannot carry anything else / may not
search" (outputs), "but not a Terror Test" (test_kind fear), "of any kind", "although will not
use it in battle", "At the start of each quest" (added), "Whenever … battle with bandits",
"Every time you fight a Minotaur", "temporarily" (while_condition), one-time rewards (guards).

### Issues

- New `issue.backgrounds.background_roll_die` (rulebook_undefined): no die is named for rolling
  a background.
- New `issue.backgrounds.creation_example_values` (conflicting): CS 42 vs 47, "Prayers (WIS)" vs
  RES base, 30 c vs 10 c after the 140 c Leather Jacket, Power of Iphy +20 vs +10 RES.
- New `issue.backgrounds.lost_brother_monster_card`, resolved by changelog #142.
- `issue.phase5.minotaur_reward_missing` resolved by changelog #143 (related += reward rule).
- `issue.phase5.heirloom_sword`, `issue.phase5.brother_skirmish_result`: printed headings.

### Rulings

#142 applied (Bandit Monster Card), #143 applied (1500 XP), #144 already applied (unchanged).
Two rows added to `review/designer-published-rulings.md`. Changelog #37 not duplicated.

### Frozen objects needed

None edited. Note for the coordinator: the example's "Claustrophobic (-10 CS in corridors)"
is evidence for frozen `issue.sanity.claustrophobia_stat_scope`; it is cited only from the new
example issue. `tests/fixtures/acceptance/package-f.json` then still said the Lost Brother ordered
lifecycle was deferred; on 18 October the row became `implemented` over
`procedure.lost_brother_personal_quest`, with `issue.phase5.brother_skirmish_result` as its
source limitation.

### Gates

`npm run lint:fix`; `npm run validate` passes (546 files); `npm run lint` passes; `npm test`:
4683 passed, 1 failing — `tests/schema/review.test.ts` resolved-issue list, where only the
position of `issue.quest.belua_terror` (another unit's issue, edited concurrently) differs; this
unit's two resolved ids were added to that list. An earlier run failed on another unit's YAML
parse error in `review/ambiguities.yaml` (since fixed by its owner). `report:coverage` was run,
which regenerated `docs/coverage-report.md`.

## Step 3 — Quest Book I introduction, The Dead Rising, Random Quests (PDF 221–236, 243) — 18 October 2026

### Pages inspected

Rendered PDF 221 (no folio), 222–236 (printed 220–234) and 243 (printed 241), from
generated/review/step3/pN.png. Enlarged crops: PDF 230 (plunder ledger, 5x), PDF 232, 233, 236
stat grids (2x). Changelog 2.2x PDF 17 and 27 rendered for entries 103–105 and 194. Text layer
dumped per page (full-width and two-column views) to
generated/review/step3/qb1_intro_dead_rising/pages*.txt to copy exact characters; every quote was
confirmed on the PNG.

### Per-section disposition (all 29 owned ids now `extracted`; none `reviewed`)

| Section                                      | glossary | rules                                              | tables                     | examples   | procedures                                     | entities                   |
| -------------------------------------------- | -------- | -------------------------------------------------- | -------------------------- | ---------- | ---------------------------------------------- | -------------------------- |
| section.quest_book_i (divider)               | n/a      | n/a                                                | n/a                        | n/a        | n/a                                            | n/a                        |
| .introduction                                | n/a      | catalogue_structure                                | n/a                        | n/a        | n/a                                            | n/a                        |
| .introduction.reading_the_quests             | n/a      | 5 core.quest_book.*                                | n/a                        | 3 fixtures | procedure.quest_reading_and_events             | n/a                        |
| .introduction.first_blood_introductory_quest | n/a      | 6 core.quest.first_blood.*                         | n/a                        | n/a        | procedure.first_blood                          | quest.first_blood          |
| .the_dead_rising (campaign root)             | n/a      | dead_rising_campaign.start, .start_elsewhere (new) | n/a                        | n/a        | procedure.dead_rising_campaign                 | quest.dead_rising.campaign |
| quest_1 … quest_6b (7 quest rows)            | n/a      | scenario rules                                     | n/a (owned by table nodes) | n/a        | n/a (shared quest procedures + campaign order) | quest, actors, items       |
| campaign_aftermath                           | n/a      | dead_rising_campaign.aftermath                     | n/a                        | n/a        | campaign_aftermath step                        | n/a                        |
| 13 table nodes                               | n/a      | n/a                                                | extracted                  | n/a        | n/a                                            | n/a                        |
| .random_quests                               | n/a      | selection_order, result_1–6                        | n/a (table node)           | n/a        | procedure.random_quest_selection               | n/a                        |

Coverage notes for all 29 rows were rewritten to stand alone (no ledger/package/phase jargon).

### Section tree

Five table nodes were parented to the chapter instead of their printed quest heading; re-parented
(ids unchanged): table_quest_specific_encounter_table and .table (Brood Mother) → quest_1;
table_2 (Ulfric) → quest_2; table_imgrahil_the_apprentice → quest_5; table_the_master → quest_6b.
Titles of .table → "The Brood Mother" and table_2 → "Ulfric the Warrior Priest" (notes say why).
"Triggering Wandering Monsters" is a smaller subheading inside Reading the Quests; its rules and
the "Ex:" fixtures now cite section.quest_book_i.introduction.reading_the_quests (no new node).

### Corrections (non-frozen objects only)

- Every source_text in the unit's rules, entities, tables, procedures (including step level) and
  example fixtures was a summary; all are now verbatim quotes joined with " ... ". Extractor
  commentary moved to unresolved_references / field descriptions.
- Invented "X — Y" headings replaced by printed headings (quest title + locator.paragraph for the
  header block; run-ins Setup, Special Rules / Special rules, Reward, Aftermath, Objective Room /
  The Objective Room, Victory Condition, If The Heroes Won…/Fled…, named actor headings).
- Table source_text = printed header row; footnotes verbatim ("1 Batswarm", "XP: 115",
  "XP: 140, T2 Treasure Table", "3 Close combat Spells", no added full stops).
- Plunder ledger line corrected to "3 bodies -150 c (Delivery 13/6)" (5x crop).
- core.quest.master.harder_encounter no longer asserts a d100 Encounter Table.
- The campaign-root sentence ("This campaign starts wherever the heroes are, but the second quest
  must be started in Silver City.") had no rule on the root: new core.quest.dead_rising_campaign.start
  / .start_elsewhere; removed the duplicate campaign fields/effects from
  core.quest.spring_cleaning.setup; procedure.dead_rising_campaign depends on the new rule.
- Reading the Quests does NOT explain the quest headings (Quest Location, Special Rules, Number of
  Tiles, Reward, Encounters, Objective Room, Threat table); PDF 222 prints no such key. No rule was
  invented; the coverage note says so.

### Examples

PDF 222 "Ex:" (Threat Level 12 increase / decrease / decrease-below-then-increase) is executable:
test.quest_book.threat_increase, _decrease, _increase_again quote it verbatim and assert outcome and
rule trace. No other "Example"/"Ex:" is printed on PDF 221–236 or 243.

### Typed dice and restrictions

- table.quest.spring_cleaning.encounters: new `quantity` column with dice cells for rows 1, 4, 5, 6
  (1d4, 1d6, 1d3, 1d2) and a number for row 7; text cells unchanged (closes text-dice-rows.tsv rows
  1, 4, 5; row 6 1d2 was missed by the scanner's regex).
- Checked: First Blood 1d10 placement, +2 initiative first turn only, 10-square darkness; Spring
  Cleaning "For this quest only" (now requires current quest = Spring Cleaning), Johann once only,
  1d10 Rats, 1d4 Giant Rats replacement, not C16 / Not R17; Dead Rising "randomised from R2B-R8B
  only" (typed first/last room + exclusive flag); Bandits move first; Burning Village no Threat,
  Scenario 9 or 10, "If at any time"; Apprentice 15-20 caretaker, "Once Emil is killed", 2d6
  Zombies; Master events 8 through 10, higher-of-two only if the sacrifice was stopped, R10 chest
  only with the bronze key, R10 in top 7 cards, tombs looted on the table, randomised Grimoire
  spell; Random Quests reroll on 6.

### Issues (review/ambiguities.yaml, appended)

- issue.quest.highwaymen_objective_room_name — resolved by changelog 2.21 #103/#194.
- issue.quest.imgrahil_loot_card_conflict — #104, unresolved (recorded, not applied).
- issue.quest.apostle_vampire_fledgling_hp — #105, unresolved (Bestiary/card not present).
- issue.quest.sacrifice_skeletons_and_civilians — described skeletons vs 4 Wights in Setup;
  civilian count not printed.

### Rulings (review/designer-published-rulings.md rows added)

- Applied: #103/#194 — core.quest.highwaymen.setup keeps "Objective room: The Dwarven hall" in
  source_text and objective_room_printed; objective_room = "The Throne room" (the name this book
  uses, PDF 270); both changelog entries cited.
- Recorded, not applied: #104 (Imgrahil loot T2 vs card T4; our page already prints XP 200),
  #105 (Apostle HP). Nothing else in the changelog or FAQ touches PDF 221–236 or 243.

### Frozen objects

None edited. Referenced only: procedure.quest_acceptance, procedure.quest_departure,
procedure.quest_dungeon_lifecycle, procedure.settlement_arrival, core.quest.first_quests,
issue.embarking.campaign_name, issue.quest.shared_lifecycle_boundaries,
issue.quest.ancient_lands_quest_selection. No frozen object needs a change.

### Tests

Updated: tests/rules/{quest-introduction,first-blood-lifecycle,random-quests,spring-cleaning,
dead-rising,highwaymen,dead-rising-finals}.test.ts, tests/schema/review.test.ts (resolved-issue list gains issue.quest.highwaymen_objective_room_name, appended last),
tests/tables/spring-cleaning.test.ts, tests/examples/quests/introduction.yaml. New:
tests/rules/qb1-step3-intro-random.test.ts, tests/rules/qb1-step3-quests-1-3.test.ts,
tests/rules/qb1-step3-quests-4-6.test.ts (verbatim quotes, printed headings, typed dice, ruling
effect, new campaign rule, re-cited sections).

### Gates

- npm run lint:fix: ran. npm run lint: prettier clean; tsc errors only in tests/rules/backgrounds.test.ts and tests/rules/step3-side-quests.test.ts (other units); my qb1-step3 files are clean.
- npm run validate (live tree): fails on YAML parse errors in other units in-progress edits (review/ambiguities.yaml line 3328 and 3413, Rescuing the Prisoners issues; corpus/source-map/sections.yaml Spider Queen table notes near lines 5061 and 5184). Re-run, same result.
- Scratch copy with those lines quoted: validate reports 4 errors, all other units (procedure.master_alchemist_vial_filling, procedure.pleasure_house_secrecy, procedure.stop_heretics_ritual, procedure.grieving_mother). npm test there: all unit test files pass (254 tests in the 14 quest files); the 11 failures are whole-corpus checks driven by those 4 errors, other units resolved issues missing from tests/schema/review.test.ts (minotaur_reward_missing, belua_terror, lost_brother_monster_card), and tests/ask/quality.test.ts (clients/ not copied to scratch).

## Step 3 — Spider Queen, Lava River, Bandits' Hideout, Fountain Room (PDF 237–254) — 18 October 2026

### Pages inspected

Rendered PDF 237–242 and 244–254 (printed 235–240 and 242–252; printed = PDF − 2 on every page,
confirmed in `pages.yaml`). Changelog 2.2x PDF 17 (entries 103–112) and PDF 27 (entries 188–199)
rendered and read. Every stat grid (Kraghul, Belua, Briggo, Gorm, Golfrid, Madame Isabelle, Gaul)
and every Threat, encounter, Demon, DEX Test and aftermath table re-read cell by cell against the
render; all cells matched the existing transcription. All rewritten `source_text` was checked
mechanically against the PDF text layer (every sentence segment found verbatim, modulo
whitespace).

### Per-section disposition (all 36 owned ids now `extracted`)

| Section                                                                      | glossary | rules     | tables            | examples | procedures                                          | entities  |
| ---------------------------------------------------------------------------- | -------- | --------- | ----------------- | -------- | --------------------------------------------------- | --------- |
| lair_of_the_spider_queen (root, PDF 237)                                     | n/a      | extracted | n/a               | n/a      | extracted (procedure.spider_queen_campaign)         | extracted |
| the_lava_river / the_bandits_hideout / the_fountain_room (grouping headings) | n/a      | n/a       | n/a               | n/a      | n/a                                                 | n/a       |
| level_1_the_entrance, level_2_the_basement                                   | n/a      | extracted | n/a (table nodes) | n/a      | n/a                                                 | extracted |
| level_3_the_tomb_of_the_spider_queen                                         | n/a      | extracted | n/a               | n/a      | extracted (procedure.belua_summoning)               | extracted |
| quest_1_stop_the_heretics                                                    | n/a      | extracted | n/a               | n/a      | extracted (procedure.stop_heretics_ritual)          | extracted |
| quest_2_the_master_alchemist                                                 | n/a      | extracted | n/a               | n/a      | extracted (procedure.master_alchemist_vial_filling) | extracted |
| quest_3_preventing_a_disaster                                                | n/a      | extracted | n/a               | n/a      | extracted (procedure.preventing_disaster_tremors)   | extracted |
| quest_1_rescuing_the_prisoners                                               | n/a      | extracted | n/a               | n/a      | n/a                                                 | extracted |
| quest_2_the_pleasure_house                                                   | n/a      | extracted | n/a               | n/a      | extracted (procedure.pleasure_house_secrecy)        | extracted |
| quest_1_cleansing_the_water, quest_2_baptising                               | n/a      | extracted | n/a               | n/a      | n/a                                                 | extracted |
| 22 table nodes                                                               | n/a      | n/a       | extracted         | n/a      | n/a                                                 | n/a       |

No term cites these sections and the pages define none (named NPCs, monsters and items are quest
records). No page prints an "Example:". Every table node already existed; no duplicate or missing
table node. All coverage notes rewritten to stand alone (Package E / lifecycle / review jargon
removed). Four `sections.yaml` table-node notes rewritten without process narrative (Kraghul grid,
Golfrid grid, prisoners Threat table, Pleasure House aftermath table).

### Changed objects

- Verbatim `source_text` and printed headings (run-in headings via `locator.paragraph`, uncaptioned
  tables via `locator.table`) for every rule, entity, table and procedure of the unit: 97 scenario
  rules, 11 quests, 13 quest actors, 6 items and 22 tables in `corpus/rules|tables|entities/quests`, `quest-actors`,
  `equipment` (spider-amulet, kraghul-antidotes, araneae-sceptre, lava-vial,
  rhidnir-incantation-scrolls, ramos-water-bottle) and `procedure.spider_queen_campaign` (source
  text, anchored source headings and step texts; bookkeeping steps marked "Corpus bookkeeping; no
  printed wording"). Previously every one was an extractor summary or carried an invented heading
  ("The Tomb — odd encounter roll", "Quest Threat levels", "Continuation", …).
- Stat-table footnotes now verbatim (were glued paraphrases).
- Threshold rules now quote their own printed run-in or bullet (the Tomb's "A Threat Level of 12
  triggers a Wandering Monster." no longer claims the "regardless of the Scenario die" wording it
  does not print; that comes from the PDF 222 source it already cites).
- `core.quest.rescuing_prisoners.setup` cites the Objective Room Special Rules for its 10 prisoners.
- `issues` back-links added on rules/items that the existing quest issues relate to.

### New objects

- `procedure.belua_summoning`, `procedure.stop_heretics_ritual`,
  `procedure.master_alchemist_vial_filling`, `procedure.preventing_disaster_tremors`,
  `procedure.pleasure_house_secrecy` (files under `corpus/procedures/quests/`): the printed
  if-then-roll chains, each step quoting the page and running the existing rules.
- `issue.quest.belua_terror` (resolved), `issue.quest.bandits_hideout_ogre_card_values`
  (unresolved).

### Examples

None printed in the unit (all sections `examples: not_applicable`).

### Typed dice and restrictions

- `table.quest.stop_heretics.demons` rows `lesser_plague`, `blood` (and `greater`): new
  `quantity` (dice 1d6 / number 1), `weapon` and `armour` columns, blank where unprinted (Closing
  the Portal precedent).
- `table.quest.master_alchemist.filling` row `burned`: new `fire_damage` dice column (1d4).
- Rules: Tomb odd encounter 1d3 (`giant_spider_roll` → `giant_spiders`), sarcophagus 4d100 c
  (`coin_roll` → `coins_found`), vial burn 1d4 (`fire_damage_roll` → `fire_damage`), flood 1d6
  (`fire_damage_roll` → `hit_points_lost`), Pleasure House aftermath 1d6 (`aftermath_roll` with
  dice on all five rules). The string outputs `encounter_count_dice`, `coin_roll_expression`,
  `fire_damage_dice`, `hit_point_loss_dice`, `aftermath_die` are gone.
- Threat 1d4 / 1d4+1 and Belua DMG 1d10+3 were already dice cells.
- Restrictions checked, all already typed: Treasure Pile not in play; tile exclusions (C16, R17,
  R1, R9, "using the tiles R1B-8B"); spider "may not act on the turn it arrives"; Antidotes used
  without identification; "unless they have already been killed"; Golfrid "will not engage in close
  combat until cornered"; "only one needs to be read"; "only get half"; stand-up "once per action
  (that is twice per turn)"; Undead unaffected; chests "unlocked and not trapped"; "+1 Damage until
  the end of the next quest"; Max HP ±1 "until the end of the next quest"; "No travel necessary";
  Scenario die "triggered on a result of 8-10"; "no need to walk all the way through the dungeon".

### Issues

- New: `issue.quest.belua_terror`, `issue.quest.bandits_hideout_ogre_card_values`.
- Edited (not frozen): `issue.quest.heretics_deadline_phase`, `issue.quest.alchemist_vial_results`,
  `issue.quest.prisoner_reward_conflict` (summary de-glued; changelog source now visually
  verified), `issue.quest.prisoner_ogre_repeat` (invented "Special Rules; Setup" heading split into
  two printed headings), `issue.quest.pleasure_house_aftermath_scope` (summary and heading).

### Rulings

- #195 (Belua Terror 10): applied. Quotes and table footnote keep "Terror 5";
  `core.quest.spider_queen_tomb.belua` sets 10 and cites PDF 241 + changelog PDF 27 row 195;
  issue resolved; row added to designer-published-rulings.md (applied).
- #106 (250 c vs 300 c): already partial on `issue.quest.prisoner_reward_conflict` (not frozen);
  unchanged in substance, the reward rules cite the entry.
- #107 ("The find him" → "They"; "Unclear / Can't find this"): not applied; wording only, quoted
  verbatim in `core.quest.rescuing_prisoners.objective_setup`, which cites the entry; "(no issue)"
  row added.
- #108 (Briggo/Gorm card EP and M): "Fixed" without a stated rule and card-only values → recorded,
  not applied (`issue.quest.bandits_hideout_ogre_card_values`); row added.
- No other changelog or FAQ entry concerns these pages (searched by topic words).

### Frozen objects

`issue.quest.spider_queen_cobweb_mapping` and `issue.quest.cleansing_healing_potion_strength` are
untouched; the latter is now listed under `core.quest.cleansing_water.reward.issues` (allowed).
No frozen object needs to change.

### Tests

- New `tests/rules/step3-spider-lava-bandits-fountain.test.ts` (coverage closure, printed-heading
  check, #195/#108/#107 handling, typed dice, the five new procedures).
- Updated `tests/rules/spider-queen-tomb.test.ts` (Terror 10, typed 1d3 / 4d100),
  `master-alchemist.test.ts` (typed 1d4), `preventing-disaster.test.ts` (typed 1d6).

### Gates

- `npm run lint:fix`: ran.
- `npm run validate`: 1 error, not this unit: `procedure.grieving_mother: referenced rule field
mismatch reward` (Grieving Mother unit, in progress).
- `npm test`: 4682 passed, 2 failed, neither from this unit. `tests/schema/validate.test.ts` fails on
  the same Grieving Mother error. `tests/schema/review.test.ts` (resolved-issue list) now includes
  `issue.quest.belua_terror` and still fails on other units' new resolved issues
  (`issue.phase5.minotaur_reward_missing`, `issue.backgrounds.lost_brother_monster_card`).
  All 10 quest rule suites and the new step3 suite pass.
- `npm run lint`: eslint and prettier clean; tsc errors only in other units' tests
  (`tests/rules/backgrounds.test.ts`, `tests/rules/step3-side-quests.test.ts`).

## Step 3 — Chamber of Reverence, Great Crypt, Ancient Lands (PDF 255–272) — 18 October 2026

Scope: 31 section ids (three chapter roots, eleven quests, seventeen table nodes), PDF 255–272
(printed 253–270; folios read from the shields agree with pages.yaml). Every section is now
`extracted`; none is `reviewed`.

### Chapter roots

**Pages inspected:** rendered PDF 255, 259, 263; PDF 138 (The Outpost, printed 136) text layer for
the toll quotation, checked against the settlement records already citing it.

| Section                       | Status                     | Components                                                                                                                                                                          |
| ----------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the_chamber_of_reverence      | extracted                  | all n/a: heading printed directly above Quest 1, no text of its own                                                                                                                 |
| the_great_crypt               | extracted                  | all n/a: heading printed directly above Quest 1, no text of its own                                                                                                                 |
| quests_into_the_ancient_lands | extracted (was extracting) | rules extracted (6 core.quest.ancient_lands.*), procedures extracted (procedure.ancient_lands_expedition); glossary, tables, examples, entities n/a (Outpost is settlement.outpost) |

**Changed objects:**

- core.quest.ancient_lands.{outpost_membership, outpost_eligibility, travel_costs, travel_event,
  ancient_objective, standard_objective}: invented headings ("Ancient Lands — …") replaced by the
  printed run-in headings "Travelling in the Ancient lands" / "Reading these quests"; paraphrased
  source_text (eligibility, travel costs, travel event, both objective rules) replaced by verbatim
  quotations. Effects unchanged.
- procedure.ancient_lands_expedition: procedure and step source_text now verbatim (PDF 263 plus
  The Outpost "Special:" toll paragraph on PDF 138); sources split into "Travelling in the Ancient
  lands", "The Outpost" (locator.paragraph Special) and "Reading these quests"; the former summary
  moved to procedure-level `unresolved_references` ("Structural reading, not printed text: …").
  Logic unchanged; campaign-progression tests pass.
- Coverage notes for the three roots rewritten to stand alone.

**Typed dice / restrictions (root):** Travel Event 10-12 typed as a range on travel_event_roll
(1–12); the die itself belongs to procedure.travel_event_check. Membership restriction typed
(via_outpost ∧ league_member). Nothing new to convert.

**Tests:** tests/rules/step3-quest-book-chapter-roots.test.ts (verbatim quotes and printed headings
for the six rules and the procedure; coverage rows extracted with standalone notes).

### The Chamber of Reverence quests (PDF 255–258, printed 253–256)

**Pages inspected:** rendered PDF 255, 256, 257, 258 (generated/review/step3/pN.png); text located with
a pdfjs dump in /tmp (not evidence). Changelog 2.2x PDF 17 rendered for entry 109.

**Per-section disposition (all `extracted`; no `reviewed`):**

| Section                                                  | glossary      | rules                | tables                                 | examples           | procedures                            | entities                                 |
| -------------------------------------------------------- | ------------- | -------------------- | -------------------------------------- | ------------------ | ------------------------------------- | ---------------------------------------- |
| quest_1_returning_the_relic                              | n/a (no term) | extracted (9 rules)  | n/a (.table, .table_2 own)             | n/a (none printed) | extracted (procedure.returning_relic) | extracted (quest + polished black stone) |
| quest_2_slaying_the_fiend                                | n/a           | extracted (10 rules) | n/a (.table, .table_2, .table_molgor…) | n/a                | extracted (procedure.slaying_fiend)   | extracted (quest + Molgor)               |
| quest_3_closing_the_portal                               | n/a           | extracted (15 rules) | n/a (.table, .table_2, .table_3)       | n/a                | extracted (5 procedures)              | extracted (quest + ritual scroll)        |
| six .table nodes + .table_molgor_the_fiend_of_summerhall | n/a           | n/a                  | extracted                              | n/a                | n/a                                   | n/a                                      |

Coverage notes rewritten as standalone page descriptions (no ledger/package/process jargon).

**Corrections (all non-frozen):**

- Every rule, entity, table and procedure citing these sections had paraphrased `source_text` and
  invented headings ("Returning the Relic — setup", "Molgor — prior wounds result 1",
  "Once the portal is closed, all demons must be killed." as a heading, etc.). All now quote the
  page verbatim (passages joined with "...") and cite the printed run-in heading (`Quest Location:`,
  `Special Rules:`, `Number of Tiles:`, `Reward:`, `Encounters:`, `The Objective Room`, `Setup`,
  `Special Rules`, `Aftermath`, `Molgor, the Fiend of Summerhall`) with `section: 'Quest N: …'`;
  uncaptioned tables add `locator.table`, Demons/wounds rows add `locator.row`.
- Procedures (returning_relic, slaying_fiend, closing_portal_preparation, closing_portal_demon_group,
  closing_portal_reading_attempt, closing_portal_single_spawn, closing_portal_aftermath): procedure
  and step `source_text` now verbatim; the former structural summaries moved to procedure-level
  `unresolved_references` ("Structural reading, not printed text: …", plus per-step notes). The
  aftermath reward step cites `Reward:` (PDF 257) and `Aftermath` (PDF 258). Citations otherwise
  matched the page; `procedures: extracted` kept.
- core.quest.returning_relic.objective_setup: enemy placement value "randomly in the room, between
  the statue and heroes" (merged narrative) → "randomise the placement of enemies" (printed Setup).
- core.quest.returning_relic.curse_ends: extractor remark removed from source_text, kept as an
  unresolved_reference (no new Luck Point amount printed).
- Issues issue.quest.relic_lifecycle_scope, fiend_lifecycle_scope, portal_aftermath_scope,
  molgor_gold_quantity, portal_ritual_boundaries: invented source headings replaced with printed ones.
- Closing-portal Objective Room: "a large shimmering bubble suspended in the air" (was "a shimmering
  bubble"); scroll sentence comma restored.

**Typed dice and restrictions:** table.quest.closing_portal.demons rows result_1–3 verified: quantity
cells typed dice 1d6/1d3/1d3 with the full printed cell kept. Rule fields already typed: Molgor
wound roll 1d6 and per-branch 2d6/1d10/1d6+1/1d4/1d3 (6 = fixed 1), placement 1d3/1d6, demon type
1d6, group quantities 1d6/1d3, reading duration 1d6 (+1 by effect). Threat starts are typed in the
three Threat tables. Restrictions checked: "once per turn" refit (refit_attempts_this_turn = 0),
"Once all enemies are dead", "standing in front of the statue", "until they have returned the
stone", "Every other turn", "They must hold still while reading it", "Once the portal is closed,
all demons must be killed", "even 10s" — all already typed in when/fields; none converted anew.
No "for this quest only" clause on these pages.

**Examples:** none printed on PDF 255–258.

**Issues:** new issue.quest.molgor_card_ep_loot (unresolved; PDF 256 Molgor heading + changelog
2.2x PDF 17, heading 2.21, row 109); returned by quest_actor.chamber_of_reverence.molgor and
table.quest.slaying_fiend.molgor. Its summary deliberately does not start with "Molgor": issue titles
feed the retrieval global vocabulary, which would otherwise demote Molgor's quest records.

**Rulings:** #109 (Molgor no EP/Loot; card EP=450, Loot=T4) is card data the PDF does not print:
recorded, not applied; row added to review/designer-published-rulings.md ("Acknowledged, but the fix
isn't stated"). No other changelog/FAQ entry concerns these pages.

**Frozen objects needed:** none.

**Tests:** tests/rules/step3-chamber-of-reverence.test.ts (verbatim quotes, printed headings/pages,
Molgor columns + issue + changelog row 109, typed dice). Existing quest tests, tests/retrieve and
tests/ask pass.

### The Great Crypt quests (PDF 259–262, printed 257–260)

Pages inspected: rendered PDF 259, 260, 261, 262 (generated/review/step3/pN.png), with PDFKit text of the same pages to confirm characters (curly quotes, "were they stood", "at least on hero").

Per-section disposition (all `extracted`, none `reviewed`):

| Section                                     | glossary      | rules     | tables                                            | examples                 | procedures                                 | entities  |
| ------------------------------------------- | ------------- | --------- | ------------------------------------------------- | ------------------------ | ------------------------------------------ | --------- |
| quest_1_retrieving_the_family_heirloom      | n/a (no term) | extracted | n/a (owned by `.the_great_crypt.table`)           | n/a (no example printed) | extracted (procedure.family_heirloom)      | extracted |
| quest_2_stopping_the_necromancer            | n/a           | extracted | n/a (owned by `.table`, `.table_ragnalf_the_mad`) | n/a                      | extracted (procedure.stopping_necromancer) | extracted |
| quest_3_tomb_raiders                        | n/a           | extracted | n/a (owned by `.table`)                           | n/a                      | extracted (procedure.tomb_raiders)         | extracted |
| the_great_crypt.table (parented to quest 1) | n/a           | n/a       | extracted                                         | n/a                      | n/a                                        | n/a       |
| quest_2…table                               | n/a           | n/a       | extracted                                         | n/a                      | n/a                                        | n/a       |
| quest_2…table_ragnalf_the_mad               | n/a           | n/a       | extracted                                         | n/a                      | n/a                                        | n/a       |
| quest_3…table                               | n/a           | n/a       | extracted                                         | n/a                      | n/a                                        | n/a       |

Coverage notes for all seven rows rewritten to stand alone (no Package/ledger/process wording).

Line-by-line check: Quest Location, Special Rules, Number of Tiles, Reward, Encounters, Objective Room, Setup, Special Rules, Aftermath and Threat tables all match the page. Ragnalf stat block (9 columns) re-verified: CS 45, RS 60, DMG 0, NA 0, DEX 50, To hit -5, RES 50, M 4, HP 16, footnotes kept. No value or modelling error in effects/conditions found.

Changed objects (citations and quotations; no id changes):

- Every rule, entity, table and procedure citing these sections had invented headings ("Retrieving the Family Heirloom — setup", "… Threat", "Stopping the Necromancer; Setup; …"). All now cite printed headings: section = quest title / "The Objective Room", heading = run-in ("Quest Location:", "Special Rules:", "Number of Tiles:", "Reward:", "Encounters:") or "Setup" / "Special Rules" / "Aftermath" / "Ragnalf the Mad"; card results use `locator.paragraph` ("Black:", "Red:", "Dressed Card:"); uncaptioned Threat tables cite the quest heading with `locator.table`, method `table`.
- Paraphrased source_text replaced by verbatim quotations (joined with "..."): all core.quest.family_heirloom._, core.quest.stopping_necromancer._, core.quest.tomb_raiders.*; quest.great_crypt.{family_heirloom,stopping_necromancer,tomb_raiders}; equipment.quest.family_heirloom_sword; quest_actor.great_crypt.ragnalf; the four tables. Wording corrections of note: "Opening a tomb will take…" (Q1, was "takes"); full Red and Dressed Card texts; "(on the short side of the room)" without final full stop; "The heroes remain were they stood…" (Q3 typo kept).
- procedure.family_heirloom, procedure.stopping_necromancer, procedure.tomb_raiders: kept; top-level source lists now cite every printed heading they implement (previously PDF 259 "Reward" plus an invented PDF 260 heading for Heirloom, a stitched heading for the others); top-level and step/substep source_text replaced by the verbatim sentences each step implements (summary prose removed). Logic untouched; all 96 existing lifecycle tests pass.
- issue.quest.heirloom_lifecycle_scope and issue.quest.necromancer_lifecycle_scope: sources now cite printed headings (Reward:, Special Rules, Aftermath).

Typed dice and restrictions: Threat starts 1d4+1 / 1d6 / 1d6 typed as dice cells; Scenario 8-10 typed as range condition; To Hit "90 or more" typed (1–100 input, gte 90); "2 heroes working together … complete turn" typed in both tomb rules; "while at least on hero is in the objective room" typed (heroes_in_objective_room ≥ 1); "for the heroes" in the Objective Room modelled by hero_in_objective_room; "If Ragnalf dies" typed. No text-dice rows from text-dice-rows.tsv fall in these quests. Nothing new to convert.

Issues: new issue.quest.necromancer_cs_rs_reduction ("reduced by 10%": 10 points vs a tenth; related core.quest.stopping_necromancer.corpse_floor, procedure.stopping_necromancer, both now return it). Existing: issue.quest.heirloom_card_categories, issue.quest.heirloom_lifecycle_scope, issue.quest.ragnalf_unspecified_spells_poison, issue.quest.necromancer_lifecycle_scope, issue.quest.tomb_raiders_threat_boundary (frozen, referenced only).

Rulings: changelog and FAQ searched for crypt, mummy, tomb, sarcophagus, necromancer, Ragnalf, zombie, Brotherhood, Logan, heirloom, dressed/playing card. Only #144 matches "Heirloom"; it changes the background "The Heirloom" weapon (longsword → shortsword) and does not touch this quest, whose sword has no printed type. Nothing applied.

Frozen objects needed: none edited; issue.quest.tomb_raiders_threat_boundary and procedure.threat_roll referenced only.

Tests: new tests/rules/step3-great-crypt.test.ts (printed headings only on PDF 259–262, verbatim corrected quotations, Ragnalf table transcription, new issue linkage, coverage rows). Existing family-heirloom / stopping-necromancer / tomb-raiders tests (147) pass. `npm run validate` passes.

### Ancient Lands quests (PDF 264–272, printed 262–270)

**Pages inspected.** Rendered p264–p272 read in full; the PDF text layer was dumped with PDFKit
(`/tmp/u3c/text.swift`) only to transcribe quotations, and every quotation was checked against the
rendered page. Folios match printed = PDF − 2 on all nine pages (read from the shield).

**Per-section disposition.**

| Section                                                                          | Status    | Components                                                            |
| -------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| …the_pyramid_of_x_nthu                                                           | extracted | rules, entities extracted; glossary, tables, examples, procedures n/a |
| …tomb_of_the_hierophant                                                          | extracted | same                                                                  |
| …temple_of_despair                                                               | extracted | same                                                                  |
| …halls_of_amenhotep                                                              | extracted | same                                                                  |
| …crypt_of_khaba                                                                  | extracted | same                                                                  |
| …quests_into_the_ancient_lands.table (Pyramid) and the four quest `.table` nodes | extracted | tables extracted, rest n/a                                            |

Glossary n/a: the pages define no game term; named places, undead and artefacts are quest
entities. Examples n/a: no printed "Example:". Procedures n/a: no ordered procedure of its own
(the card-flip paragraphs are single conditional rules); the quests run through
procedure.quest_acceptance, procedure.quest_departure, procedure.ancient_lands_expedition and
procedure.quest_dungeon_lifecycle. Tables n/a on quest headings: each Threat table has its own
node. Coverage notes rewritten without process jargon.

**Changed objects (no new ids).** All 96 records citing these sections had extractor-summary
`source_text` and invented headings ("X — setup", "Pyramid of Xánthu Threat", "Objective Rooms
and aftermath", "Djet’s grimoire", …). Each now quotes the page verbatim (passages joined with
"...") and cites the printed heading: the quest title with `locator.paragraph` for the
information-block run-ins, "Special Rules:"/"Special rules:", "Number of Tiles:"/"Number of
tiles:", the Objective Room / Objective tile variant headings, "Special Rule", "Setup" (with the
variant heading as `locator.paragraph`), "Aftermath …", "Ace/2/3 of Spades", "Secondary
objective", "Sceptre of the Queen". Uncaptioned Threat tables cite the quest heading with
`locator.table`. Rules where both tile variants print the same text (Hierophant bonuses and tome,
Temple encounter/replacement, Amenhotep dormancy) now cite both. Files:
corpus/rules/quests/{pyramid-xanthu,hierophant,temple-despair,amenhotep,khaba}.yaml,
corpus/entities/quests/ (same five), quest-actors/{xanthu,djet,temple-despair,amenhotep-guardians,khaba}.yaml,
equipment/{djet-artifacts,temple-despair-books,sceptre-of-the-queen}.yaml,
corpus/tables/quests/ (same five). The sceptre keeps the printed "never nee ds to be recharged"
(present in the text layer and the rendered page). Effects, conditions and fields were already
correct against the page and are unchanged.

Issue sources corrected (headings only; summaries/related unchanged):
issue.quest.hierophant_tome_boundaries (both "Aftermath" variants),
issue.quest.temple_despair_boundaries ("Secondary objective", "Aftermath (Both sets of tiles)"),
issue.quest.amenhotep_boundaries (quest heading Reward: + both "Setup"),
issue.quest.khaba_boundaries (Reward:, Ace of Spades, both Setups, Sceptre of the Queen).

**Typed dice and restrictions.** Dice: Threat start 1d6 is a typed dice cell in all five
tables; Hierophant "1d12 fire DMG" is typed by `fire_damage_roll` (dice 1d12, 1–12) in
core.quest.hierophant.fire_damage. No other die is printed. Restrictions checked, all already
typed conditions: four Furniture re-rolls "during the quest" and "A re-roll may never be
re-rolled" (five quests); "(not R22)", "(Not R33)" exclusions; Hierophant R1B absent from its
standard pool as printed; "cannot spawn another mummy"/"without risk of awakening another mummy"
(Pyramid, Hierophant, Khaba, each variant); "Ignore the dead adventurer … cannot be searched";
"If this is the last card in a pile"; curse "until the heroes leave their next dungeon"; "the
fifth time the bag is reloaded" and "win the fight before then"; Standard-only vacated statue
squares; "If the party has not yet met Queen Khaba"; sceptre "cannot be sold" and "only be cast
once during each dungeon or skirmish". Nothing converted.

**Issues.** None new; existing xanthu/hierophant_tome/temple_despair/amenhotep/khaba boundary
issues still hold.

**Rulings.** Changelog 2.2x (full PDF text) and the FAQ snapshot searched for Xánthu, Djet,
Hierophant, Despair, Amenhotep, Khaba, sceptre, Tomb Guardian, mummy, wraith, wight: no entry for
these pages (the Wights note in the changelog is "Q6A", another quest).

**Frozen objects.** None needed; issue.quest.ancient_lands_quest_selection untouched.

**Tests.** tests/rules/step3-ancient-lands-quests.test.ts (12 tests): printed-heading allowlist
and folio for every record, table locator, seven verbatim quotations, the sceptre spacing slip,
no summary phrases, coverage rows extracted. Existing pyramid-xanthu, hierophant,
temple-despair, amenhotep, khaba, appendix-v-legendary and campaign-progression tests pass.
`npm run validate` passes.

### Unit summary

- **Issues:** new issue.quest.molgor_card_ep_loot (changelog #109, recorded, not applied) and
  issue.quest.necromancer_cs_rs_reduction ("reduced by 10%"). Existing quest issues on these pages
  had their invented source headings replaced; summaries and `related` unchanged.
- **Rulings:** #109 recorded, not applied (row in review/designer-published-rulings.md). #144 does
  not touch the Great Crypt sword. No other changelog/FAQ entry concerns PDF 255–272.
- **text-dice-rows.tsv:** table.quest.closing_portal.demons result_1–3 confirmed typed (1d6/1d3/1d3)
  with the printed cell text kept. No other listed row is in this unit.
- **Frozen objects:** none edited, none needing change. issue.quest.ancient_lands_quest_selection,
  issue.quest.tomb_raiders_threat_boundary and procedure.threat_roll are referenced only.

## Step 3 — Side Quests and the Grieving Mother (PDF 273–279, 164–165) — 18 October 2026

### Pages inspected

Rendered PDF 273–279 (printed 271–277) and PDF 164–165 (printed 162–163) from
`generated/review/step3/pN.png`, plus PDF 133 (printed 131) for the arrival d8 quoted by
`procedure.side_quest_selection`. Changelog 2.2x PDF 17 rendered for entries 103–112. A pdfjs text
layer of the same pages was used only to check quotes character by character against the render
(every `source_text` fragment between `...` now matches the page text; 77 rules, 13 entities, 2
procedures checked).

### Per-section disposition (all now `extracted`)

| Section                                                                              | glossary | rules     | tables             | examples | procedures                                 | entities  |
| ------------------------------------------------------------------------------------ | -------- | --------- | ------------------ | -------- | ------------------------------------------ | --------- |
| section.quest_book_i.side_quests                                                     | n/a      | extracted | n/a (table node)   | n/a      | extracted (procedure.side_quest_selection) | n/a       |
| …side_quest_1_the_missing_brother                                                    | n/a      | extracted | n/a (none printed) | n/a      | n/a                                        | extracted |
| …side_quest_2_slay_the_beast                                                         | n/a      | extracted | n/a (table node)   | n/a      | n/a                                        | extracted |
| …side_quest_3_the_mapmaker                                                           | n/a      | extracted | n/a (table node)   | n/a      | n/a                                        | extracted |
| …side_quest_4_go_fetch                                                               | n/a      | extracted | n/a (table node)   | n/a      | n/a                                        | extracted |
| …side_quest_5_manhunt                                                                | n/a      | extracted | n/a (table node)   | n/a      | n/a                                        | extracted |
| …side_quest_6_mushrooms                                                              | n/a      | extracted | n/a (none printed) | n/a      | n/a                                        | extracted |
| section.buying_an_estate.side_quest_the_grieving_mother                              | n/a      | extracted | n/a (none printed) | n/a      | extracted (procedure.grieving_mother)      | extracted |
| five table nodes (selector, Monster/Bet, The Mapmaker, shield condition, The Bandit) | n/a      | n/a       | extracted          | n/a      | n/a                                        | n/a       |

No term is defined on these pages and no "Example" is printed. The six side quests print no ordered
procedure of their own; they run through procedure.quest_acceptance, procedure.quest_departure,
procedure.quest_dungeon_lifecycle and procedure.side_quest_selection. All 13 coverage notes were
rewritten to stand alone (no Package/lifecycle/pending wording).

### Corrections (non-frozen records)

- Every rule, entity, table and procedure citing the unit had an invented heading
  (`"<Quest> — setup"` etc.) and a summarised `source_text`. All now cite the printed heading,
  including run-in headings (`Quest Location:`, `Special Rules:` / `Special rules:` as printed on
  PDF 275, `Reward:`, `Encounters:`, `Objective room:`, `The Objective Room`, `Setup`, each
  `Aftermath…` heading, `The Hidden Door`, `Entering the Side Objective Room`) and quote verbatim,
  joining separated passages with `...`. Uncaptioned tables cite the enclosing heading plus
  `locator.table` (`Uncaptioned table (1d6 / Quest)`, `(1d10 / Monster / Bet)`,
  `(1d6 / Result)`) and row.
- Extractor commentary removed from `core.quest.slay_beast.deck` ("The printed quest is Side Quest 2,
  …"); the mismatch stays in issue.quest.slay_beast_boundaries.
- `procedure.grieving_mother`: procedure and step quotes verbatim; unprinted bookkeeping steps use
  "Corpus bookkeeping; no printed wording: …". `procedure.side_quest_selection` step
  `attach_and_hand_off` quote re-ordered to page order.
- `core.quest.grieving_mother.setup` now models the printed "Reward: As told in the aftermath – wait
  and see." (`reward` output; procedure field added).
- `table.quest.mapmaker.statistics` (CS, RS, DMG/NA) and `table.quest.manhunt.bandit_statistics`
  (RS, DMG/NA): printed dashes typed as `marker` / `not_specified` instead of text.
- Row `rule_refs` added: selector rows → core.quest.side_quests.result_1..6; Monster/Bet rows →
  core.quest.slay_beast.result_1..6; shield-condition rows → untouched / damaged + wear / missing.
- Issue source headings fixed (printed headings only) in issue.quest.slay_beast_boundaries,
  .mapmaker_reward_boundary, .go_fetch_shield_boundaries (process sentence removed from summary),
  .manhunt_proof_boundary, .mushrooms_boundaries, .grieving_mother_wandering_activation,
  .grieving_mother_outcome_boundaries.
- sections.yaml: note of section.quest_book_i.side_quests.side_quest_5_manhunt.table says the grid
  sits under the heading The Bandit.

Line-by-line re-check found no transcription error in values (rewards 100 c per hero, 350/500/250/250
c; R9, R17; Dodge (45); both stat blocks; Bet table cells; Door Table 10; ENC 8; 1d2; 2d6; #8; +2 DMG).

### Typed dice and restrictions

- text-dice-rows.tsv row `table.quest.go_fetch.shield_condition / damaged`: the row now links
  `core.quest.go_fetch.wear`, whose `shield_wear_roll` is typed 1d4 and sets the wear removed.
- Scenario-rule dice: 1d6 selector and 1d10 Monster/Bet (typed in the result rules), 1d4 wear
  (`.wear`), 1d2 Giant spiders (`core.quest.grieving_mother.wandering_spiders`), 2d6 HP
  (`core.quest.mushrooms.consume`). All typed.
- Restrictions checked, each already a rule or typed condition: unseen extra Room Card; one section
  at a time; enemies only target heroes; Archers not in the 2 squares by the door; may back out;
  must keep the map maker alive; may not fight or interact but may dodge; strives to stay within 2
  squares; R9 must be in the pile; usable "if they feel like it"; "No shield – No money"; kill and
  prove it; search draw regardless of roll success; do not read until triggered; door-slam paragraph
  only after the first turn of combat; door not openable from inside until the spiders are dead.

### Issues

New (unresolved): issue.quest.mapmaker_profile_card (conflicting; changelog #110),
issue.quest.manhunt_bandit_xp_loot (rulebook_undefined; changelog #111, #112). Both are listed in
`issues` of the actor and the stat table they concern.

### Rulings

- #110: "Fixed", no values, concerns a card not in the repository → recorded, not applied.
- #111 ("XP 250, Loot T4"): recorded, not applied. PDF 278 prints no XP or Loot field for The Bandit,
  so the entry adds data this printing does not print rather than correcting a printed value (unlike
  #106, which settled two conflicting printed rewards). No XP/Loot is modelled.
- #112: "Fixed", no values, card not present → recorded, not applied.
- Rows added to review/designer-published-rulings.md ("Acknowledged, but the fix isn't stated").
  No other changelog or FAQ entry concerns these pages (FAQ "mushrooms" is about mine tiles).

### Frozen objects

Referred to, not edited: issue.quest.side_quest_availability, procedure.estate_ghostly_events
(Ghostly Event 6 invokes procedure.grieving_mother; reads `forced_ghost_event` and
`grieving_mother_succeeded`, unchanged), procedure.quest_acceptance. No frozen object needs a change.
procedure.side_quest_selection is not frozen.

### Tests

New `tests/rules/step3-side-quests.test.ts` (9 tests): printed headings only, verbatim quotes,
table locators, 1d4 wear typing, row rule_refs, dash markers, changelog 110–112 recorded with
related records, no XP/Loot for The Bandit, Grieving Mother Reward line, coverage dispositions.
Updated `tests/rules/mapmaker.test.ts` and `tests/rules/manhunt.test.ts` for dash markers.

### Gates

- `npm run lint:fix`: done.
- `npm run validate`: passed (546 files) after other units fixed a transient YAML parse error in
  review/ambiguities.yaml (Rescuing the Prisoners issue).
- `npm test`: 4683 passed, 1 failed — tests/schema/review.test.ts expects a fixed list of resolved
  issues; other units resolved issue.phase5.minotaur_reward_missing, issue.quest.belua_terror and
  issue.backgrounds.lost_brother_monster_card. Not from this unit (it resolves nothing).
- `npm run lint`: eslint and prettier clean; tsc errors only in tests/rules/backgrounds.test.ts
  (backgrounds unit, in progress).
- `npm run report:coverage` not run (generated report is coordinator-owned in this step).

## Step 3 review corrections (A) — 18 October 2026

Pages re-checked on renders: PDF 45, 47 (Backgrounds), 234, 235 (Quest 6A/6B), 239, 241 (Spider
Queen Levels 2–3), 245 (Stop the Heretics Aftermath), 250 (Golfrid the Short), 253 (Cleansing the
Water). No frozen object was edited.

### review.backgrounds.1 (9 open, all applied)

- Proving Your Worth "final blow" → "fatal blow" in source_text of
  character.background.proving_your_worth.qualifying_kill, background.proving_your_worth,
  quest.background.proving_your_worth (3 findings).
- 17. A new Home: section title "17. A new Home"; background.a_new_home name "A new Home";
      quest.background.a_new_home "A new Home personal quest"; also the rule name
      character.background.a_new_home.reward ("A new Home: reward") and the acceptance fixture
      heading in tests/fixtures/acceptance/package-f.json (2 findings).
- character.background.sworn_enemy.bandit_encounter: input sworn_enemy_killed, when eq false.
- 16. Revenge: reward_already_received input and eq false on both .recognition and .reward
      (reward_already_received rather than beast_defeated on .recognition, since beast_defeated
      already means "this fight was won" on .reward).
- character.background.the_heirloom.quest_setup: sword_recovered input, when eq false.
- character.background.the_lost_brother.quest_setup: brother_found input, when eq false; the
  field also added to procedure.lost_brother_personal_quest.
- recorded_as_issue: issue.backgrounds.revenge_bandits_hate_scope linked from
  character.background.revenge_bandits.hate and background.revenge_bandits (both already in
  its related).

### review.the_dead_rising.1 (2 open, applied)

- Silver City encoding: core.quest.dead_rising_campaign.start and .start_elsewhere now compare
  current_settlement to silver_city (field descriptions say so), matching
  procedure.dead_rising_campaign and the settlement ids used elsewhere. required_start_settlement
  and next_destination display values stay "Silver City".
- choose_apostle / choose_master steps cite PDF 234 'Quest 6A: Sacrifice' and PDF 235
  'Quest 6B: The Master' (locator Quest Location) and append "... Quest Location: White 36." /
  "... Quest Location: White 39." to source_text.
- recorded_as_issue: issue.quest.spring_cleaning_objective_rats linked from
  core.quest.spring_cleaning.objective_setup; issue.quest.master_reward_recipient from
  core.quest.master.reward.

### review.spider_queen_and_lava_river.1 (3 open, applied)

- core.quest.stop_heretics.full_reward / .half_reward: all_objective_creatures_defeated field and
  condition removed; reward depends only on caster_killed_before_portal (PDF 245 confirms). The
  alternative exit stays in core.quest.stop_heretics.exit.
- Glue (all listed labels restored): see glue list below.
- recorded_as_issue: issue.quest.amburr_weapon_conflict linked from
  core.quest.spider_queen_entrance.amburr and quest_actor.spider_queen.amburr.
- Consistency fix beyond the record: core.quest.spider_queen_basement.threshold (PDF 239, "A
  Wandering Monster appears when the Threat Level reaches 10 and 16.") and
  core.quest.spider_queen_tomb.threshold (PDF 241, "A Threat Level of 12 triggers a Wandering
  Monster.") also output scenario_result_ignored, a clause neither page prints; removed, and the
  "special quest monster" / "special placement" descriptions reworded as for the Fountain Room.
  Re-reviewer should confirm.

### review.bandits_hideout_and_fountain_room.1 (6 open, applied)

- core.quest.rescuing_prisoners.golfrid: enemy_kind "halfling"; source_text now begins "Golfrid is
  a halfling with fiery red hair and a patch over his left eye. ..."; quest_actor
  bandits_hideout.golfrid lists .golfrid_not_cornered and .golfrid_movement.
- core.quest.rescuing_prisoners.threshold: descriptions "A Wandering Monster appears." and "The
  Threat Level is not decreased when the Wandering Monster is placed."; issues lists
  issue.quest.threat_threshold_overshoot.
- core.quest.cleansing_water.threshold: scenario_result_ignored removed (PDF 253 has no
  "regardless" clause); same descriptions; overshoot issue linked.
- issue.quest.threat_threshold_overshoot related += both threshold rules (summary/sources
  untouched, per coordinator).
- Pleasure House and Fountain glue findings applied (below).
- recorded_as_issue: issue.quest.baptising_weapon_scope linked from
  core.quest.baptising.weapon_baptising.

### Glue fixes (corpus-written text only)

"Supplied Scenario die result." (procedure.preventing_disaster_tremors,
core.quest.preventing_disaster.tremor_event, core.quest.rescuing_prisoners.prisoner_death,
core.quest.pleasure_house.scenario_trigger / .scenario_no_trigger); "Preventing a Disaster —
Scenario 1–2 tremor"; "The Pleasure House — Scenario 8–10"; "Advertised 300 c per hero."; "+1 luck
on the next quest, no current-quest mutation."; "Hero DEX." / "Supplied DEX Test result." /
"not silently converted into AP." (procedure.master_alchemist_vial_filling and
core.quest.master_alchemist.filling_attempt / .filled / .burned / .dropped); "300 c per hero,
catalogue amount." (master_alchemist.reward); "Half of 250 c: 125 c per hero." and "250 c per
hero." (stop_heretics); "Level 3: The Tomb of the Spider Queen"; "Cobweb Covered Openings, page
101"; "2 AP clearing and Threat cost" (spider_queen_tomb.doors); "400 c offer to the party."
(pleasure_house.aftermath_offer, procedure.pleasure_house_secrecy); "300 c per hero.", "One
Potion of Healing per hero.", "Healing Potion catalogue; the quest leaves the strength
unspecified", "All reptiles, including the Assassins, are dead.", "+1 Damage for the dipped
weapon.", "Until the end of the next quest, not merely the current battle.", "Silver City."
(fountain-quests); "R10 is mixed in among the top 7 cards." (master.setup); "Close combat Spells
known." (master.master). Scanned every owned object with the brief's patterns plus a dictionary
pass; remaining hits are dice, ids, enum values or verbatim changelog quotations ("1500XP").

Frozen, not edited: issue.quest.spider_queen_cobweb_mapping ("page101", "placement,clearing") and
issue.quest.cleansing_healing_potion_strength ("strengths,so") keep glued summaries. Not owned:
section.into_the_dungeons.cobweb_covered_openings notes "page101 ... PDF103".

### Tests

New tests/rules/step3-corrections-a.test.ts (28 cases: transcription, once-only guards, Silver
City encoding across rule and procedure, 6A/6B Quest Location sources, Golfrid, threshold
override only where printed, issue links both ways, glue absence). Updated
tests/rules/stop-heretics.test.ts (reward on the portal alone), spider-queen-basement.test.ts,
qb1-step3-quests-4-6.test.ts (silver_city / rochdale), phase-five.test.ts and
backgrounds.test.ts (new guard inputs).

### Gates

lint:fix, validate (555 files), test (4723 passed, 2 skipped) and lint all pass on the final run.
An earlier run had one transient failure in tests/rules/step3-quest-book-chapter-roots.test.ts
(procedure.ancient_lands_expedition, the other corrector's unit); it passed on re-run.

## Step 3 review corrections (B) — 18 October 2026

Pages checked: PDF 138, 259, 261, 278 and changelog PDF 17 (rendered; 138 and changelog 17 in
generated/review/step3/corrB/), plus the existing step3 renders for the other findings.

### review.chamber_of_reverence_and_great_crypt.1

- zombie_protection (PDF 261): applied. New input `zombie_next_to_ragnalf` ("This zombie stands next
  to Ragnalf.") required true in `core.quest.stopping_necromancer.zombie_protection` and in
  `procedure.stopping_necromancer` step `protect_ragnalf` (field added to the procedure too).
  Tests: stopping-necromancer.test.ts (negative case), stopping-necromancer-lifecycle.test.ts (fixture
  supplies the input; new case where no zombie stands next to him).
- family_heirloom.setup (PDF 259): applied. source_text now "Quest Location: In the settlement. ...
  Number of Tiles: ...". Test in step3-great-crypt.test.ts.
- printed-order quotations (PDF 259/261/262): applied. table.quest.stopping_necromancer.ragnalf
  "Ragnalf the Mad ... CS | RS | DMG | NA | DEX ... 45 | 60 | 0 | 0 | 50 ... To hit | RES | M | HP ...
  -5 | 50 | 4 | 16"; the three Great Crypt Threat tables and the initial_threat / request_threat steps
  of procedure.family_heirloom, .stopping_necromancer, .tomb_raiders now quote "Start Threat Level |
  Min Threat Level | Max Threat Level ... <start> | Same as start lvl | <max>". Test updated/added in
  step3-great-crypt.test.ts.

### review.quests_into_the_ancient_lands.1

- Pyramid table node: applied. section.quest_book_i.quests_into_the_ancient_lands.table retitled "The
  Pyramid of Xánthu table" (id kept).
- procedure.ancient_lands_expedition sources (PDF 138): applied. New source anchor (PDF 138, The
  Outpost, paragraph "Opening description beside the map inset", image, verified) cited by
  check_owner/bind/owner, at_outpost and (with Special) depart_from_outpost; pay_toll and
  league_check keep the "Special" locator.
- core.quest.temple_despair.curse: applied. temple_curse_duration = "until the heroes leave their
  next dungeon"; issue.quest.temple_despair_curse_duration added to curse and curse_expiry;
  hero_left_next_dungeon described as the supplied per-hero reading of the open question.
  temple-despair.test.ts updated.
- core.quest.khaba.ace_encounter: applied. Output party_has_met_queen_khaba set true on the Ace of
  Spades; no Wights added to objective Setup. khaba.test.ts: Ace then objective Queen rule does not
  fire, both variants.
- issue.quest.hierophant_tome_boundaries "for200c": applied ("for 200 c"), status unchanged.

### review.side_quests.1

- core.quest.grieving_mother.reading: applied by removing the always-false door_slam_text_readable
  effect (and the now unused first_turn_finished input); the permission is owned only by
  reading_door_slam (quest triggered and first turn finished). The interpreter has no per-effect
  guard, so the guard option was not available. grieving-mother.test.ts updated.
- #111 Manhunt (coordinator decision): applied. New core.quest.manhunt.bandit_xp_loot (PDF 278 The
  Bandit + changelog PDF 17 row 111; verbatim printed Bandit sentence; sets xp 250, treasure_table
  T4, dependency table.treasure.t4), listed on quest_actor.side.manhunt_bandit. Printed table
  unchanged (no XP/Loot cells). Issue split: issue.quest.manhunt_bandit_xp_loot resolved citing row
  111 (related adds the new rule); new unresolved issue.quest.manhunt_bandit_profile_card holds #112
  (profile vs card), linked from the actor and table. designer-published-rulings.md: #111 row moved to
  the applied table, #112 recorded-not-applied row added. Coverage notes of side_quest_5_manhunt and
  its .table node updated. Tests: step3-side-quests.test.ts (rewritten 110–112 case),
  tests/schema/review.test.ts resolved list (file order, after dwarven_pickaxe_rubble).
- Equipment categories: applied (go_fetch_shield → shield, mushrooms_healing_potion → consumable).
- Go Fetch shield-condition node: applied (sections.yaml note: no printed caption, sits under The
  Objective Room, title supplied).
- Issue-summary glue: applied to mushrooms_boundaries ("Reward 250 c", "its 2d6 HP"),
  manhunt_proof_boundary ("Reward 250 c"), slay_beast_boundaries ("PDF 276").
  issue.quest.side_quest_availability is frozen: not touched ("PDF133", "PDF273" remain).

### New issues linked

- issue.quest.portal_reader_hold_still → core.quest.closing_portal.ritual_interruption, .ritual_start,
  procedure.closing_portal_reading_attempt.
- issue.quest.temple_despair_curse_duration → core.quest.temple_despair.curse, .curse_expiry.
- issue.quest.grieving_mother_slammed_door_inside → core.quest.grieving_mother.door_access,
  .door_access_blocked, .door_slam.
  Each issue's related list already named exactly these objects.

### Glue fixes (corpus-written text only; no source_text, ids or enums)

- Issues: portal_aftermath_scope ("awards 300 c"), necromancer_lifecycle_scope ("PDF 261", "To Hit
  90+", "to 300 c"), relic_lifecycle_scope ("Threat by 1", "maximum 20"), heirloom_lifecycle_scope
  ("a 3 Black / 1 Red / 2 Dressed"), hierophant_tome_boundaries, slay_beast_boundaries,
  manhunt_proof_boundary, mushrooms_boundaries.
- Procedures: closing-portal-preparation ("advertised 300 c", "maximum 20", "multiple of 10",
  "types 1–4", "for 5/6"), closing-portal-spawn-aftermath ("starts at 0", "Armour 0", "add 300",
  "promised 300 c"), closing-portal-reading ("at 0", "initially 0"), returning-relic ("initially 0",
  "credited 300", "maximum 20", "location, 8+8", "trigger 8–10", "records +1", "below 20", "hero 300 c",
  "300 c per", "start 1d4+1", "quest 8–10", "printed +1", "raw +1"), slaying-fiend ("row 6", "fixed 1",
  "maximum 20"), stopping-necromancer ("XP 200"), family-heirloom ("add 300"), tomb-raiders
  ("unresolved 20").
- Rules, entities, tables and coverage/section notes of the unit: scanned, no glue left.

### Frozen

- issue.quest.side_quest_availability (glued "PDF133", "PDF273"): left as is.
- issue.quest.tomb_raiders_threat_boundary (glued "result20", "by5", "at20", ...): frozen, left as is;
  needs a coordinator decision.

### Tests

New tests/rules/step3-review-corrections-b.test.ts (issue links, Outpost citations, node title and
note, equipment categories, issue-summary spacing); updated the quest tests listed above.
Also updated tests/rules/step3-quest-book-chapter-roots.test.ts (the expedition procedure now has two
The Outpost sources). docs/coverage-report.md regenerated (node retitle).

### Gates

npm run lint:fix; npm run validate (555 files, pass); npm test (159 files, 4723 passed, 2 skipped);
npm run lint (pass).

## Step 3 review closure and promotion — 18 October 2026

Scope: Quest Book I (PDF 221–279), Backgrounds (PDF 42–50) and the Grieving Mother side quest
(PDF 164–165), 132 sections, reviewed as eight units by fresh `corpus-reviewer` agents (Claude
Opus 5.5; Sonnet 5.5 for the part node and the third-round re-reviews). Every failed finding went to
one of two separate correctors or, for one-line fixes, to the coordinator, followed by a fresh
re-reviewer.

Records (latest, all fresh): `review.quest_book_i.1`, `review.quest_book_introduction.2`,
`review.backgrounds.2`, `review.the_dead_rising.2`, `review.spider_queen_and_lava_river.3`,
`review.bandits_hideout_and_fountain_room.2`, `review.chamber_of_reverence_and_great_crypt.2`,
`review.quests_into_the_ancient_lands.3`, `review.side_quests.2`.

Coordinator corrections: `issue.quest.temple_despair_boundaries` no longer states the curse
duration as per hero (PDF 269 prints "until the heroes leave their next dungeon"; the question is
held in `issue.quest.temple_despair_curse_duration`); the Lava River threshold rules describe an
ordinary Wandering Monster; `procedure.spider_queen_campaign` lists only its own phases.

Changelog 2.21 rulings: 103/194, 142, 143 and 195 applied; 111 (The Bandit: XP 250, Loot T4)
applied by coordinator decision, consistent with 143, which likewise supplies a value the printing
omits; the printed Bandit table stays verbatim. 104, 105, 107, 108, 109, 110 and 112 are recorded,
not applied (card or Bestiary values, or "Fixed" without a stated rule). 106 stays partial.

New unresolved issues from extraction and review include
`issue.quest.threat_threshold_overshoot`, `issue.quest.spring_cleaning_objective_rats`,
`issue.quest.master_reward_recipient`, `issue.quest.sacrifice_skeletons_and_civilians`,
`issue.quest.amburr_weapon_conflict`, `issue.quest.baptising_weapon_scope`,
`issue.quest.necromancer_cs_rs_reduction`, `issue.quest.portal_reader_hold_still`,
`issue.quest.temple_despair_curse_duration`, `issue.quest.grieving_mother_slammed_door_inside`,
`issue.backgrounds.background_roll_die`, `issue.backgrounds.creation_example_values` and
`issue.backgrounds.revenge_bandits_hate_scope`.

Promoted: all 132 sections. Every non-redirect section of the book is now `reviewed` (677); the 38
compatibility redirects stay `mapped`.

Carry-overs, blocked by frozen objects (follow-ups for a later review of their units):

- `issue.quest.side_quest_availability` ("PDF133", "PDF273"),
  `issue.quest.tomb_raiders_threat_boundary` ("result20", "by5"),
  `issue.quest.spider_queen_cobweb_mapping` (glued words and process wording; frozen by
  `review.into_the_dungeons_actions.3`) and `issue.quest.cleansing_healing_potion_strength` have
  glued words in their summaries. None misstates the book.
- `issue.sanity.claustrophobia_stat_scope` could cite the Character Creation Example's
  "Claustrophobic (-10 CS in corridors)" (PDF 49–50) as evidence.
- Closed 18 October: the `tests/fixtures/acceptance/package-f.json` Lost Brother row is now
  `implemented` over `procedure.lost_brother_personal_quest` (it had named the lifecycle as
  deferred `catalogue_scope`).

Gates: `npm run validate` passes (555 files); `npm test` passes (4723 tests, 2 skipped); `npm run
lint` passes; `git diff --check` is clean.
