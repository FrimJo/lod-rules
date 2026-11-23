# Phase 7 dependency graph (Step 4)

This ledger records Step 4 of the [completion plan](../corpus-completion-plan.md#step-4--dependency-graph-and-precedence-phase-7):
the typed dependency graph, its canonical edges and the dispositions of its anomalies. Step 4 runs
as four units (spec: GitHub issue #5):

1. Graph derivation and traversal.
2. Embarking binding: the first canonical edge, which defines the `corpus/graph/` schema.
3. Duplicate/summary detection (closes `phase_6.criterion_2`).
4. Anomaly dispositions.

The generated [graph report](../graph-report.md) is the current anomaly worklist. Counts below
are point-in-time.

## Unit 1 — graph derivation and traversal — 21 October 2026

Issues #6 (graph module, retrieval refactor), #7 (new relations, tool projection), #8
(anomalies, traversal) and #9 (report, ledger, docs), all under spec #5. No change under
`corpus/`, `schemas/` or `review/`; the Phase 0–6 acceptance fixture is unchanged.

### What was derived

`scripts/graph/` loads the canonical corpus (`loadRetrievalCorpus`, extended with test cases)
and returns `buildGraph(): AnalysedGraph`, `{ nodes, edges, anomalies }`.

- **Nodes (4861):** 1929 rules, 669 entities, 224 tables, 125 procedures, 2 state machines,
  117 terms, 331 issues, 715 sections, 10 manifest documents (6 `not_present`) and 739 test
  cases.
- **Edges (15492):** `{ source, relation, target, category, field, provenance }`. `field` is the
  originating schema path (for example `steps[].rule_refs`); `provenance` is the owning record's
  source reference, or the section's own page span for section-owned edges. Edges are not
  deduplicated; one edge per originating field occurrence. Retrieval dedupes per source.
- **Traversal:** forward, reverse and both, with a category filter. The "what could affect X"
  default is reverse over `dependency` and `precedence`.
- **CLI:** `npm run graph -- build` writes sorted `generated/graph/{nodes,edges}.json`;
  `npm run graph -- report` writes the committed [graph-report.md](../graph-report.md). A test
  fails when the committed report differs from a fresh render.

### Relation and category vocabulary

| Category     | Relations                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dependency` | `uses_table`, `depends_on`, `step_rule`, `row_rule`, `row_entity`, `enters`, `grants`, `starting_equipment`, `component`, `rule`, `table`, `entity` |
| `precedence` | `overrides` (`summary_of` and `expanded_by` reserved for unit 3)                                                                                    |
| `reference`  | `see_also`, `term`, `timing`, `related`, `quest`                                                                                                    |
| `structural` | `part_of` (section `parent`), `redirects_to` (`redirect_to`), `cites_section` (`section_id`)                                                        |
| `external`   | `external` (section `external_references`, to manifest documents)                                                                                   |
| `evidence`   | `tests` (test-case refs), `concerns` (issue `related`), `issue` (record `issues`)                                                                   |

Every relation name retrieval emitted before unit 1 is kept, with its derivation. `quest` comes
from an explicit `quest_id` when present, otherwise from the section-ancestor derivation, never
both. Decision: an ancestor-derived `quest` edge carries `field: section_id`; only an explicit
`quest_id` gives `field: quest_id`.

Decision: only `dependency`, `precedence`, `reference` and `external` edges, plus `part_of` as
the single `structural` exception, reach retrieval's relations table and therefore `lod_expand`
and `lod_get` links. `cites_section`, `redirects_to` and every `evidence` edge stay in the graph
and never reach the tools.

### Behaviour preservation

Evidence: before/after dumps of `SELECT source,relation,target FROM relations` from the
retrieval index.

- #6 (graph module, retrieval refactor): identical, 8377 rows.
- #7 (new relations, tool projection): removed only 929 `concerns` and 658 `issue` rows
  (evidence); added only 705 `part_of` and 41 `external` rows.

### Behaviour changes

- `npm run retrieve -- expand` (corpus-work CLI) no longer shows `issue` or `concerns` edges.
  Use `npm run retrieve -- issues <id>`.
- `lod_expand` at depth ≥ 2 can walk through section nodes via `part_of` and `external`.
- `lod_get` links resolve section and manifest-document targets the way `lod_expand` does and
  carry `target_title`. Record links to sections (305 tool-visible edges, mostly `see_also`)
  were dropped before. Issue records still never appear.

### Counts

| Category     | Edges |
| ------------ | ----- |
| `dependency` | 6564  |
| `precedence` | 28    |
| `reference`  | 1168  |
| `structural` | 4548  |
| `external`   | 41    |
| `evidence`   | 3143  |

Per-relation counts are in the [graph report](../graph-report.md#edges-by-relation).

### Anomaly totals (no dispositions; unit 4 owns them)

- Dangling ids: 0. A test fails on any dangling id.
- Cycles: 41. `depends_on` has 28 (26 two-record mutual dependencies and 2 self-references,
  `procedure.damage_follow_up` and `procedure.sanity_condition`); `related` has 13, all mutual
  glossary pairs such as `term.battle` and `term.combat`. Cycles are reported and never fail
  the build. The validator's existing `overrides` cycle check is unchanged; the graph finds no
  `overrides` cycle.
- Unresolved pointers: 222 `unresolved_references` entries, listed by owner and wording. They
  are never edges and none is resolved.

### Gate

`npm run validate` (555 canonical files), `npm test` (165 files passed, 2 skipped; 4795 tests
passed, 2 skipped) and `npm run lint` pass.

### Next

Unit 2: bind `core.quest.start_settlement` to the first `procedure.quest_acceptance` as the first
canonical edge in `corpus/graph/`, defining its schema.

## Unit 2 — embarking binding — 21 October 2026

Issue #10 under spec #5. Decisions came from a grilling session. Vocabulary (**canonical edge**,
**derived edge**, **binding**) is in [CONTEXT.md](../../CONTEXT.md); placement is
[ADR 0001](../adr/0001-canonical-edges-outside-records.md).

### What was added

- `corpus/graph/dependencies.yaml`: `edge.quest.start_settlement.first_acceptance`,
  `procedure.quest_acceptance -input_from-> core.quest.start_settlement`, binding input
  `settlement` ← output `settlement`. Source PDF 59 (printed 57), "Embarking on your First
  Quest"; condition "When you start the game", verbatim. A structural-reading note in
  `unresolved_references` limits it to the party still being in its start settlement, and to a
  final result (8, "Re-roll.", supplies none).
- `schemas/graph-edge.schema.json`. Fields: `id` (`edge.` namespace), the usual metadata,
  `relation` (enum: `input_from`), `from`, `to`, `binding`, `condition` and optional
  `unresolved_references`/`issues`. `from`/`to` name the endpoints because `source` is the
  source reference.
- Edges load as the record kind `edges` (root `corpus/graph/`), so they get global ids, metadata
  and provenance checks, and the examined kind `edge` in review digests. The validator also
  checks that the endpoints are rules or procedures, that `binding.field` is an input of `from`,
  that `binding.from_field` is an output of `to`, and that the two field types match.
- Graph: `input_from` is a `dependency` relation; a canonical edge's `field` is its YAML path,
  its `provenance` its own source, and it carries `condition`. Edge records are graph nodes
  (kind `edge`) with `cites_section` and `issue` edges.
- Retrieval: the relations table gains `condition`; `lod_get` links and `lod_expand` edges show
  it. `SEARCH_DOCUMENT_VERSION` 6.
- `review/ambiguities.yaml`: `issue.embarking.first_quest_settlement_travel` (PDF 59, 132, 133).
  `related` is only the edge and `core.quest.start_settlement`: relating
  `procedure.quest_acceptance` or `procedure.settlement_arrival` would have staled the
  settlement reviews that freeze them.

### Review

The edge's `section_id` is `section.embarking_on_your_first_quest`, so the embarking record
governs it. `review.embarking.3` failed with two `modelling_error` findings: the edge's name
claimed "the first quest acceptance" although Rejecting a Quest (PDF 132) and Available quests
(PDF 133) can move the party first, and the issue overstated the gap. After correction,
`review.embarking.4` passed with corrections (PDF 25–62, 132, 133 inspected; nothing open). Its
optional note on "enters" versus "is in" is a checkpoint carry-over.

### Counts

Graph report: 4863 nodes, 15497 edges (`input_from` 1), 0 dangling ids, 41 cycles,
223 unresolved pointers (the edge's note is the new one). The Phase 0–6 fixture has 84 of 85
rows verified; "embarking on a quest" is `verified`.

### Next

Unit 3: duplicate/summary detection. See the
[extraction checkpoint](../extraction-checkpoint.md#next-unit).

## Unit 3a — procedure steps restating rules — 22 November 2026

Closes `phase_6.criterion_2` ("Procedure steps reference atomic rules rather than duplicate
them"); issue #4, items 4 and 24–27.

### Check

- `scripts/graph/duplicates.ts` (`stepDuplicates`, anomaly list `stepDuplicates`). It flags a
  step that repeats one of a rule's `set`/`add` effects (`type:target=value`, choice options
  included) and also shares at least 2 eight-word shingles with the rule's `source_text`.
- A step cites a rule through its own or an ancestor step's `rule_refs`, or the procedure's
  `dependencies`. A quest procedure is compared with global rules only (quest scope from
  `questResolver`), so restating its own scenario rule is not a finding.
- The effect-only signal alone gave 134 (procedure, rule) pairs, mostly generic field names
  (`hp=0`, `ap_spent=1`); text overlap alone gave 551 steps. The conjunction gave 10 steps.
- `tests/graph/step-duplicates.test.ts` keeps it permanent: every finding needs exactly one
  entry in `tests/fixtures/step-duplicate-dispositions.json` and a stale entry fails. The graph
  report lists the findings.

### Conversion

`rule_refs` execute: the interpreter runs the referenced rule (its `when` against procedure
state, overrides, trace) before the step's own effects, and the validator requires every rule
field in the procedure's `fields`. Adding `rule_refs` alone double-applied effects (Threat +2)
and raised 13 field mismatches. So converting a step means: cite the rule, drop the step's
copy, add the rule's fields, and set any aliased input before the rule runs.

| Step                                                           | Rule                                        | Result                                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `procedure.threat_roll#missed`                                 | `core.threat.increase.threat_roll_exceeded` | converted; fixture trace gains the rule                                                                                             |
| `procedure.character_improve#double_cost`                      | `character.advancement.cost_doubling`       | converted; no new fields                                                                                                            |
| `procedure.settlement_activities_and_overnight#stable_lodging` | `character.recovery.unaffordable`           | converted via substep `stable_departure`; new state field `cannot_afford`                                                           |
| `procedure.combat_shove#success`                               | `combat.action.shove.success`               | converted; split into `shove_roll` (substep `shove_total` cites `combat.action.shove.attempt`), `success`, `charge_success`         |
| `procedure.hero_defence#shield_absorbs`                        | `combat.defence.shield_parry.absorbed`      | converted; field `shield_parry_succeeded`, substep `success.shield_success`                                                         |
| `procedure.hero_defence#spillover`                             | `combat.defence.shield_parry.spillover`     | converted; field `spill_location`                                                                                                   |
| `procedure.hero_defence#dodge_fumble`                          | `combat.fumble.dodge_or_shove`              | converted; field `dodging_or_shoving`                                                                                               |
| `procedure.hero_defence#avoid`, `#success`                     | `combat.defence.weapon_parry`               | legitimate repeat: rule is Parry-Stance-only against plain CS (PDF 118); steps also take Fast parry and talent thresholds (PDF 177) |
| `procedure.combat_attack#large_power`                          | `combat.action.power_attack.enemy`          | legitimate repeat: rule also sets `to_hit_applies` (`issue.combat.power_timing`) and needs `enemy_size` (PDF 115)                   |

Behaviour preservation: the combat conversions were compared old against new over 90,624 input
combinations; the only differences are new fields, new step ids, one satisfied `require` event
from `combat.action.shove.attempt` (which also refuses a negative or fractional `damage_bonus`)
and the rule ids in `trace`. `tests/rules/combat-procedures.test.ts` pins the new traces.

### Review

Fresh, passing re-reviews of the five records the edits staled, same section scope:
`review.into_the_dungeons_setup.13`, `review.levelling_up.3`, `review.settlements_core.5`,
`review.combat_actions.5`, `review.combat_enemies.4`. No findings open, no new issues.

### Counts

Graph report: 4863 nodes, 15506 edges, 0 dangling ids, 41 cycles, 223 unresolved pointers,
3 restating steps (all dispositioned). Phase 0–6 checklist: 85 of 85 rows verified, `accepted`.

### Next

Unit 3b: `summary_of`/`expanded_by`. See the
[extraction checkpoint](../extraction-checkpoint.md#next-unit).

## Unit 3b — summary edges and cross-chapter repeats — 23 November 2026

Issue #4 items 3 and 20–23.

### Relation

- `schemas/graph-edge.schema.json` gains `relation: summary_of`. `binding` and `condition` are
  required for `input_from` only; `summary_of` takes no `binding`. The validator requires the
  edge's `section_id` to be the summarising record's section, rejects a summary of a record in
  the same section, a duplicate pair and a pair recorded both ways.
- The graph derives `expanded_by` (detailed → summary) for every `summary_of`, flagged
  `derived: true`. `summary_of` is `reference`; `expanded_by` is `precedence`, so "what could
  affect" a summary reaches its detailed rule and never the reverse. `lod_expand` follows both
  names.

### Summary passages found

Found by reading every PDF line with "summar", "remind", "described (in detail) in", "explained
in detail", "more details", "as described" and "see page", then keeping a passage only where it
restates a rule briefly and itself points at the full statement. Plain pointers with no
restated content (Combat "Open a Door", PDF 111; Treasure intro "How searching is done…", PDF
108, which no record owns; spell "See page 98" lines) are not summaries.

| Edge (`edge.summary.…`)                                                                  | Summary → detailed                                                                                             | Printed marker (PDF)                                             |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `dungeon_turn.{scenario_die,threat_roll,activation,wandering_monster,battle_won_threat}` | `procedure.dungeon_turn` → the five procedures/rules its steps name                                            | "All of these terms are explained in detail later" (20)          |
| `combat_break_down_door.locked_door`                                                     | `combat.action.break_down_door` → `procedure.locked_door_and_close`                                            | "More details on this are given in the ‘Into the Dungeon’" (110) |
| `combat_cast_spell.{quick,standard}_spell`                                               | `combat.action.cast_spell` → `core.magic.quick` / `core.magic.standard`                                        | "Details for this are described in the ‘Magic’ chapter" (110)    |
| `combat_parry_stance.shield_parry`                                                       | `combat.action.parry_stance` → `combat.defence.shield_parry`                                                   | "as described on page 118" (111)                                 |
| `treasure_furniture_search.action_cost`                                                  | `character.treasure.furniture_search` → `core.searching.furniture_adjacent_action`                             | "as described in the ‘Into the Dungeon’ chapter" (108)           |
| `ancient_lands_travel.{movement,rations}`                                                | `core.quest.ancient_lands.travel_costs` → `procedure.travel_daily_movement` / `procedure.travel_food_and_rest` | "As described in the main rules" (263)                           |
| `activation.enemy_priority`                                                              | `procedure.activation` → `procedure.enemy_priority`                                                            | "as described in the combat chapter" (107)                       |
| `alchemy_throwing.throwing_target`                                                       | `character.alchemy.throwing` → `combat.throwing.target`                                                        | "This is described in the ‘Combat’ chapter" (72)                 |
| `sanity_asylum.asylum`                                                                   | `character.sanity.asylum_pointer` → `character.settlement.asylum`                                              | "See the ‘Settlements’ chapter for details" (55)                 |
| `conditional_skill_value.automatic_failure`                                              | `character.skill.conditional_value` → `core.check.automatic_failure`                                           | "remember that a roll of 91-00 is always a failure" (60)         |

### Cross-chapter repeats

`ruleRepeats` in `scripts/graph/duplicates.ts`: rule pairs from different chapters (first two
section-id segments) sharing at least 2 eight-word shingles of `source_text`; a pair linked by
`summary_of` is dropped. Six-word shingles gave 73 pairs, mostly noise; eight-word gave 27,
with or without a shared effect. Of the 27, 3 became summary edges (throwing, asylum, 91-00)
and 24 are `legitimate_repeat` in `tests/fixtures/rule-repeat-dispositions.json`: 9 guild
training pairs, 8 quest-local side-quest template pairs, the PDF 197 identification reminder
(2), the PDF 29/51 weapon-class paragraph (2), the dissipation quote in
`character.durability.overlap_uncertain`, the bandage action (PDF 100/110) and spell learning
(PDF 146/153). None is an error. `tests/graph/rule-repeats.test.ts` keeps the check permanent.

### Counts

Graph report: 15554 edges (16 derived inverses), 0 dangling ids, 41 cycles, 223 unresolved
pointers, 3 restating steps, 24 cross-chapter repeats (all dispositioned).

### Review

The edges sit in the summary's section, so eight records went stale. Fresh re-reviews, same
scope: `review.game_basics.3`, `review.levelling_up.4`, `review.treasure.2`,
`review.psychology_sanity.4`, `review.alchemy_core.3`, `review.into_the_dungeons_actions.8`,
`review.quests_into_the_ancient_lands.4` passed; `review.combat_actions.6` failed because "a
bonus to parrying as described on page 118" is the shield parry (CS+15 in Parry Stance), not
the weapon parry. The edge became `edge.summary.combat_parry_stance.shield_parry` and
`review.combat_actions.7` passed with that correction. No new issues.
