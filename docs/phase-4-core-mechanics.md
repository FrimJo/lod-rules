# Phase 4 — Reusable core mechanics

Phases 0–3 are complete. Phase 4 is extracted and tested across all 21 priority areas below.
This is an extraction audit, not an independent review: new records remain `extracted`,
and larger source headings retain partial coverage. No runtime or build outputs were added.

The authoritative source is [Rulebook-2nd-printing-ENGa.pdf](../source/Rulebook-2nd-printing-ENGa.pdf).
Printed/PDF pairs below come from [pages.yaml](../corpus/source-map/pages.yaml); notably
The Turn is printed 88 / PDF 89. Existing IDs, compatibility redirects, original review issues,
and pilot records are retained.

## Disposition of all priority areas

Each prefix below denotes existing canonical objects enumerated in the evidence index.
Fixtures are attached to their contributing rule IDs there; a prefix is not a fabricated reference.
The glossary retains character, hero, enemy, battle and combat distinctions and adds only needed
core stat/resource and temporal concepts.

| #   | Priority area                  | Printed / PDF pages                                                   | Canonical objects or prefixes                                                                                                                                          | Disposition and remaining exclusions                                                                                              |
| --- | ------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Dice conventions               | 14, 16 / 16, 18                                                       | `core.dice.`, `core.rounding.`                                                                                                                                         | Percentile 00, bounded results and rounding order. Mana rounding remains unresolved.                                              |
| 2   | Skill and Stat checks          | 16, 18, 58 / 18, 20, 60                                               | `core.check.`, `character.skill.`                                                                                                                                      | Existing check IDs and modifier ambiguity preserved; skill-specific abilities deferred.                                           |
| 3   | Perfect Results                | 19 / 21                                                               | `core.check.perfect`                                                                                                                                                   | Existing success/quota uncertainties and reward restrictions preserved.                                                           |
| 4   | Action Points                  | 19, 88, 107, 119 / 21, 89, 109, 121                                   | `core.action_points.`, `core.turn.`, `character.hit_points.wounded`                                                                                                    | Allocation, spending, action/activation order and wounded override; action resolution deferred.                                   |
| 5   | Adjacency                      | 18 / 20                                                               | `core.spatial.adjacent`                                                                                                                                                | Eight surrounding squares transcribed from the diagram; no pathfinder.                                                            |
| 6   | Line of Sight                  | 19 / 21                                                               | `core.los.`                                                                                                                                                            | Centre-to-centre, model obstruction versus blocking, walls and doorposts; cover resolution deferred.                              |
| 7   | Movement primitives            | 91–92, 107 / 93–94, 109                                               | `core.movement.`, `core.spatial.`, `core.obstacle.half_square`                                                                                                         | Facing, footprints, occupied/diagonal movement, furniture, pits, 50% rule and ZOC; obstacle catalogue deferred.                   |
| 8   | Character/model terminology    | 17–19, 24–27 / 19–21, 26–29                                           | `core.model.footprint`                                                                                                                                                 | Existing glossary distinctions retained; supplied model size is a fixture input, not inferred artwork geometry.                   |
| 9   | Basic stats and derived values | 24–27, 31, 58 / 26–29, 33, 60                                         | `character.stat.`, `character.skill.`, `character.mana.`, `table.character.skill_bases`, `table.character.stat_maxima`                                                 | Five stat definitions, skill relationships, racial maxima and Mana. Existing progression table reused; species profiles deferred. |
| 10  | Hit Points                     | 26, 119–120 / 28, 121–122                                             | `character.hit_points.`, `character.recovery.`                                                                                                                         | Damage, wounded, zero HP, rescue, bleeding, injury and recovery; negative damage/recovery caps remain unresolved.                 |
| 11  | Damage Bonus                   | 27 / 29                                                               | `character.damage_bonus.`, `table.character.damage_bonus`                                                                                                              | Complete separate DB matrix; unprinted intermediate inputs produce unresolved lookup results.                                     |
| 12  | Natural Armour                 | 27 / 29                                                               | `character.natural_armour.`, `table.character.natural_armour`                                                                                                          | Complete separate NA matrix; no interpolation of unprinted values.                                                                |
| 13  | Energy                         | 27, 31, 98, 145 / 29, 33, 100, 147                                    | `character.energy.`, `character.recovery.`, `character.condition.depression`                                                                                           | Initial value, perk spending, passive talents and recovery; undefined floors/reset precedence remain explicit.                    |
| 14  | Luck                           | 27, 145 / 29, 147                                                     | `character.luck.`, `character.recovery.inn_luck`                                                                                                                       | Starting exception, own-activation eligibility, direct effects, accept reroll/no reroll of reroll, settlement reset.              |
| 15  | Movement                       | 27 / 29                                                               | `character.movement.initial`, `character.talent.fast.movement`                                                                                                         | Base four squares plus existing Fast exception; species stat profiles deferred.                                                   |
| 16  | Encumbrance                    | 49–51 / 51–53                                                         | `character.encumbrance.`, `character.equipment.`                                                                                                                       | STR/STR+15 boundaries, hands, Quick Slots, backpack and armour layering; self-referential STR penalty recorded.                   |
| 17  | Durability                     | 49–51, 68, 110, 118–119, 145, 184 / 51–53, 70, 112, 120–121, 147, 186 | `character.durability.`, `character.equipment.`, `table.equipment.sell_and_repair`                                                                                     | Defaults, damage, breakage, magic exceptions, repairs and all 50 price rows; overlap/breakage conflicts unresolved.               |
| 18  | Sanity                         | 53–55, 145 / 55–57, 147                                               | `character.sanity.`, `character.condition.`, `condition.`, `table.psychology.sanity_losses`, `table.psychology.mental_conditions`, `table.psychology.lingering_trauma` | All nine conditions and three tables; duplicate rerolls, treatment, expiry. Missing Bestiary/card content stays dependencies.     |
| 19  | Party Morale                   | 56, 98 / 58, 100                                                      | `character.morale.`, `table.psychology.morale_adjustments`                                                                                                             | Per-hero rounding, cumulative events, threshold, departure and reset; +1/+2 rest and equality unresolved.                         |
| 20  | Timing concepts                | 18–19, 88, 98, 107, 145 / 20–21, 89, 100, 109, 147                    | `core.turn.`, `core.battle.`, `character.recovery.`, `character.condition.trauma_expiry`                                                                               | Turn/activation/battle, rest, departure and settlement terms; procedure.dungeon_turn reused. Full state machines deferred.        |
| 21  | Quest lifecycle concepts       | 27, 31, 56, 88, 145 / 29, 33, 58, 89, 147                             | `core.quest.`, `character.energy.quest_return`, `character.luck.settlement_reset`, `character.morale.`                                                                 | Distinct end/reward/return wording, Silver City restriction, resets and expiry; no invented precedence or full quest procedure.   |

## Representation and dependencies

The additive schema vocabulary supports arithmetic (including explicit floor/ceiling), bounded
supplied dice outcomes, discrete/range table lookups, resource constraints, timing references,
optional-system metadata and condition entities. Printed cells, dice notation, markers and
footnotes remain separate from typed effects. Table rows link only to mechanics that exist.
The skill/base-stat reference table structures prose; it is not falsely credited as a printed table.

The test-only interpreter accepts supplied rolls and spatial facts. It does not roll dice,
recognize models, calculate LOS geometry, find paths, automatically dispatch all matching rules,
or implement a character/game state machine. Rule fields describe a local supplied context;
callers select applicable rules and supply state. Explicit overrides resolve only source-backed
precedence. Failed requirements stop subsequent effects; missing lookup values yield an explicit
unresolved result without retaining speculative rule effects.

Random-table outcomes cover the declared dice domain exactly. Printed `0` is normalized to
10 for d10 tables; percentile `00` is 100. DB/NA lookups use the printed discrete values;
intermediate values are not inferred. Recovery arithmetic does not silently introduce floors,
maximums, rounding or ordering absent from the source. Optional-system records preserve the
book's omission guidance without inventing replacement systems.

Named unextracted mechanics remain section-linked dependencies, including Fear/Terror,
Hate, potion damage, Miscast, Travel and battle resolution. Bestiary membership and missing
Scenario/Threat card instructions are explicit external or supplied-context dependencies.
`procedure.dungeon_turn` now links its psychology dependency to `core.turn.psychology`;
the hook identifies supporting tables without implementing their full procedures.

Entity catalogues beyond the nine mental conditions, full gameplay procedures, dependency-graph
generation and corpus builds remain deferred. Species profiles, skill-specific abilities, obstacle
catalogues and complete combat/rest/travel/quest procedures have not been smuggled into coverage.

## Verification evidence

The corpus contains 204 rules, 17 entities, 14 tables, two procedures and 321 executable YAML
fixtures: additions are 178 rules, nine conditions, nine tables and 247 fixtures. The source map
has 606 canonical sections and three compatibility redirects, with exactly one coverage row per
ID. There are 68 glossary terms and 110 lookup forms. Twenty-two headings were added, including
separate DB and NA table nodes, while old IDs remain valid.

- [Phase 4 table tests](../tests/tables/phase-four.test.ts) independently transcribe the eight
  printed matrices and the prose skill mapping. They check all 50 Sell and Repair rows, signed
  dice losses, printed zero, markers, footnotes, typed links and round-trip preservation.
- [Schema tests](../tests/schema/phase-four.test.ts) reject malformed operations, unknown fields,
  invalid references, unsupported lookup inputs, bad provenance, wrong timing kinds, invalid
  dice/ranges, random-table gaps/overlaps and unresolved effects pointing at closed issues.
- [Interaction tests](../tests/rules/phase-four.test.ts) exercise explicit precedence, rounding,
  AP allocation, magic durability and unresolved boundary interactions against canonical YAML.
- Canonical [fixtures](../tests/examples/) distinguish `source_example` from `derived_case`,
  identify contributing rules, and retain old regressions. They cover check/lookup boundaries,
  resources, Luck restrictions, encumbrance, damage/breakage, every condition/table outcome and
  lifecycle events. Adjacency, LOS and movement diagrams provide source-backed spatial cases;
  rule-derived cases cover additional occupied-square/model-size/wall/doorpost boundaries.

The rendered source pages were inspected for all eight printed tables (PDF 29, 55, 57, 58,
60 and 186) and the spatial diagrams (PDF 20, 21, 93, 94 and 109). Visual credit is attached
only to inspected evidence. The existing progression table remains reused and retains its pilot
verification. Coverage is regenerated from canonical YAML, never edited as Markdown.

Run the existing gates from the repository root:

```bash
node --import tsx scripts/validate/index.ts
npm test
node --import tsx scripts/reports/coverage.ts
npm run lint
```

The direct Node entry points are the documented fallback when the sandbox prevents the
`tsx` CLI from creating its IPC pipe; public commands and `validateCorpus(): ValidationResult`
remain compatible. No commits are part of this implementation.

## Unresolved source questions

All 11 original issues remain present with their previous disposition. Fifteen source-backed
Phase 4 issues were added; none is silently closed by an implementation convention.

- `issue.phase4.lookup_domain`: The printed tables do not supply every possible input or a universal interpolation/extrapolation policy. An absent key must not silently select another row. DB/NA thresholds between or beyond listed values, and repair values absent from the grid, require source review.
- `issue.phase4.mana_rounding`: Mana is WISx1,5, but the inspected definition does not prescribe rounding for an odd WIS. Preserve the exact multiplication; do not silently floor or ceil a fractional initial pool.
- `issue.phase4.damage_floor`: Dealing Damage gives Wpn DMG + DB - NA - Armour, without specifying the result when protection exceeds damage. Do not turn negative damage into healing or invent a zero/minimum-damage rule.
- `issue.phase4.zero_and_negative`: The source states reaches 0 HP and gives a special negative-HP poison rule. These passages do not define every overshoot, stacking, or minimum-value interaction. The injury target selection method is unspecified. Do not infer a universal floor or generic death-at-negative-HP rule.
- `issue.phase4.durability_overlap`: Weapon parry 95–00 loses one point; general attack/parry fumble at 100 also loses one. The source does not explicitly say whether these losses combine. Magic dissipation at 00 also overlaps a fumble. Resolve each printed instruction independently, but combined loss requires review.
- `issue.phase4.magic_breakage`: Equipment at zero durability is broken beyond repair, but Dissipating Magic says a broken magic item must first be repaired to at least 1 durability before recharging. It also says dropping maximum durability to 6 can break the weapon without specifying current-versus-lost durability accounting. Preserve these passages without selecting a repair or breakage interpretation.
- `issue.phase4.sanity_maximum`: Conditions resets Sanity to 8 minus current conditions and calls that the maximum, while recovery says up to a maximum of 8. Do not select a cap when the two affect the same recovery.
- `issue.phase4.sanity_boundaries`: The text says reaches 0 Sanity but does not define overshooting zero, a nonpositive condition-adjusted maximum, exhausted distinct conditions, or whether a cured historical diagnosis remains excluded by already has been diagnosed with. No automatic clamp, cascading diagnoses, or repeated-diagnosis policy is supplied.
- `issue.phase4.arachnophobia_scope`: Arachnophobia describes spiders but then says Treat all encounters as causing Terror. The scope of all is not explicit; do not silently restrict it to spiders or extend it to every encounter.
- `issue.phase4.energy_floor`: Depression reduces the energy pool by 2, while a starting hero can have only 1. The source does not define negative capacity or a floor; do not silently clamp it or change current energy as well.
- `issue.phase4.short_rest_morale`: The Party Morale table gives Taking a short rest +1, while Rest and its checklist give +2 (up to start value). No precedence is stated. Preserve both values and return an unresolved outcome for the combined short-rest morale effect.
- `issue.phase4.morale_threshold`: Reaching Half Morale (RDD) says the penalty begins below half and is removed above this threshold. Exactly the threshold is not assigned a transition; do not use <= or >= to silently settle it. Recalculation from RES after a morale-induced RES penalty, overlapping events, below-zero morale, and values above initial morale also lack a universal policy.
- `issue.phase4.settlement_recovery`: Character Basics says Luck resets on returning to a settlement and Energy on returning from a quest; Rest and Recuperation restores Mana/Luck/Energy through paid lodging, or half (RDD) if unaffordable. These are different triggers and amounts with no explicit combined precedence. Preserve passage-local results; do not apply both as a global reset policy.
- `issue.phase4.recovery_bounds`: HP recovery passages specify amounts but do not explicitly state a universal maximum-HP clamp. Applying recovery above the recorded maximum needs review. Rest and Recuperation also does not specify whether half of each stat means half of the maximum or of the missing amount.
- `issue.phase4.encumbrance_feedback`: Encumbrance uses STR for carrying thresholds but also penalizes all stats by -10 when overloaded. The text does not say whether that penalty recalculates its own carrying threshold. Use supplied pre-penalty STR for the isolated printed rule; combined feedback is unresolved.

## Canonical evidence index

This index lists every added object, its exact source section, page references, fixture IDs,
and unresolved/dependency links. Source examples for existing check/perfect rules and the
progression table remain indexed by the [Phase 3 audit](phase-3-pilot.md). The glossary and
alias additions are canonical in [terms.yaml](../corpus/glossary/terms.yaml) and
[aliases.yaml](../corpus/glossary/aliases.yaml).

### [corpus/rules/characters/core-stats.yaml](../corpus/rules/characters/core-stats.yaml)

- `character.skill.stat_independence` — `section.character_basics.the_character.skills`; printed/PDF 25/27. Fixtures: `test.character.skill.stat_independence.stat_increase`.
- `character.skill.known` — `section.character_basics.the_character.skills`; printed/PDF 25/27. Fixtures: `test.character.skill.known.ordinary`.
- `character.skill.base_stat` — `section.character_basics.the_character.skills_list`; printed/PDF 26/28. Fixtures: `test.character.skill.base_stat.combat`, `test.character.skill.base_stat.foraging`. Review: `issue.phase4.lookup_domain`.
- `character.damage_bonus.lookup` — `section.creating_your_character.damage_bonus_and_natural_armour`; printed/PDF 27/29. Fixtures: `test.character.damage_bonus.lookup.listed`, `test.character.damage_bonus.lookup.unlisted`. Review: `issue.phase4.lookup_domain`.
- `character.natural_armour.lookup` — `section.creating_your_character.damage_bonus_and_natural_armour`; printed/PDF 27/29. Fixtures: `test.character.natural_armour.lookup.listed`, `test.character.natural_armour.lookup.unlisted`. Review: `issue.phase4.lookup_domain`.
- `character.stat.maximum_str` — `section.levelling_up.stats_and_skills_maximum`; printed/PDF 58/60. Fixtures: `test.character.stat.maximum_str.human`. Review: `issue.phase4.lookup_domain`.
- `character.stat.maximum_dex` — `section.levelling_up.stats_and_skills_maximum`; printed/PDF 58/60. Fixtures: `test.character.stat.maximum_dex.human`. Review: `issue.phase4.lookup_domain`.
- `character.stat.maximum_wis` — `section.levelling_up.stats_and_skills_maximum`; printed/PDF 58/60. Fixtures: `test.character.stat.maximum_wis.human`. Review: `issue.phase4.lookup_domain`.
- `character.stat.maximum_res` — `section.levelling_up.stats_and_skills_maximum`; printed/PDF 58/60. Fixtures: `test.character.stat.maximum_res.human`. Review: `issue.phase4.lookup_domain`.
- `character.stat.maximum_con` — `section.levelling_up.stats_and_skills_maximum`; printed/PDF 58/60. Fixtures: `test.character.stat.maximum_con.human`. Review: `issue.phase4.lookup_domain`.
- `character.mana.initial` — `section.creating_your_character.mana`; printed/PDF 27/29. Fixtures: `test.character.mana.initial.even`, `test.character.mana.initial.odd_exact`. Review: `issue.phase4.mana_rounding`.
- `character.energy.initial` — `section.character_basics.the_character.energy_e`; printed/PDF 24/26. Fixtures: `test.character.energy.initial.default`, `test.character.energy.initial.exception`.
- `character.energy.perk` — `section.character_basics.the_character.perks`; printed/PDF 25/27. Fixtures: `test.character.energy.perk.spend`, `test.character.energy.perk.outside_activation`.
- `character.talent.passive` — `section.character_basics.the_character.talents`; printed/PDF 25/27. Fixtures: `test.character.talent.passive.no_cost`.
- `character.luck.reroll` — `section.character_basics.the_character.luck_l`; printed/PDF 24/26. Fixtures: `test.character.luck.reroll.worse_must_accept`, `test.character.luck.reroll.no_second_reroll`.
- `character.movement.initial` — `section.character_basics.the_character.movement_m`; printed/PDF 25/27. Fixtures: `test.character.movement.initial.default`.
- `character.luck.initial` — `section.creating_your_character.final_touches`; printed/PDF 31/33. Fixtures: `test.character.luck.initial.non_halfling`.

### [corpus/rules/characters/hit-points.yaml](../corpus/rules/characters/hit-points.yaml)

- `combat.damage.basic` — `section.combat.dealing_damage`; printed/PDF 119/121. Fixtures: `test.combat.damage.basic.protected`, `test.combat.damage.basic.exact_protection`.
- `combat.damage.negative_uncertain` — `section.combat.dealing_damage`; printed/PDF 119/121. Fixtures: `test.combat.damage.negative_uncertain.excess_protection`. Review: `issue.phase4.damage_floor`.
- `character.hit_points.loss` — `section.combat.dealing_damage`; printed/PDF 119/121. Fixtures: `test.character.hit_points.loss.loss`.
- `combat.enemy.zero_hp` — `section.combat.dealing_damage`; printed/PDF 119/121. Fixtures: `test.combat.enemy.zero_hp.zero`.
- `character.hit_points.wounded` — `section.combat.wounded`; printed/PDF 119/121. Fixtures: `test.character.hit_points.wounded.odd_threshold`, `test.character.hit_points.wounded.above_threshold`.
- `character.hit_points.zero` — `section.combat.bleeding_out`; printed/PDF 120/122. Fixtures: `test.character.hit_points.zero.zero`.
- `character.hit_points.rescue` — `section.combat.bleeding_out`; printed/PDF 120/122. Fixtures: `test.character.hit_points.rescue.self_potion`.
- `character.hit_points.after_battle_bandage` — `section.combat.bleeding_out`; printed/PDF 120/122. Fixtures: `test.character.hit_points.after_battle_bandage.cannot_self_bandage`.
- `character.hit_points.party_loss` — `section.combat.bleeding_out`; printed/PDF 120/122. Fixtures: `test.character.hit_points.party_loss.party_down`.
- `character.hit_points.no_rescue` — `section.combat.bleeding_out`; printed/PDF 120/122. Fixtures: `test.character.hit_points.no_rescue.no_means`.
- `character.hit_points.permanent_injury` — `section.combat.bleeding_out`; printed/PDF 120/122. Fixtures: `test.character.hit_points.permanent_injury.selected_stat`. Review: `issue.phase4.zero_and_negative`.
- `character.hit_points.bleeding_time` — `section.combat.bleeding_out.advanced_rule`; printed/PDF 120/122. Fixtures: `test.character.hit_points.bleeding_time.optional`, `test.character.hit_points.bleeding_time.disabled`.
- `character.death.replacement` — `section.combat.bleeding_out`; printed/PDF 120/122. Fixtures: `test.character.death.replacement.next_visit`.

### [corpus/rules/core/actions-timing-recovery.yaml](../corpus/rules/core/actions-timing-recovery.yaml)

- `core.action_points.allocation` — `section.game_basics.action_points_ap`; printed/PDF 19/21. Fixtures: `test.core.action_points.allocation.hero_dungeon`, `test.core.action_points.allocation.enemy_skirmish`.
- `core.action_points.spend` — `section.into_the_dungeons.the_turn`; printed/PDF 88/89. Fixtures: `test.core.action_points.spend.one_action`, `test.core.action_points.spend.insufficient`.
- `core.turn.action_order` — `section.into_the_dungeons.the_turn`; printed/PDF 88/89. Fixtures: `test.core.turn.action_order.unfinished`.
- `core.turn.hero_order` — `section.into_the_dungeons.the_turn`; printed/PDF 88/89. Fixtures: `test.core.turn.hero_order.empty_table`.
- `core.turn.enemy_order` — `section.into_the_dungeons.the_turn`; printed/PDF 88/89. Fixtures: `test.core.turn.enemy_order.order`.
- `core.turn.enemies_placed` — `section.into_the_dungeons.the_turn`; printed/PDF 88/89. Fixtures: `test.core.turn.enemies_placed.interrupt`.
- `core.battle.end` — `section.combat.end_of_battle`; printed/PDF 107/109. Fixtures: `test.core.battle.end.remaining`. Review: `issue.0001`.
- `core.battle.nonkill_end_uncertain` — `section.combat.end_of_battle`; printed/PDF 107/109. Fixtures: `test.core.battle.nonkill_end_uncertain.escape`. Review: `issue.0001`.
- `core.quest.end_uncertain` — `section.introduction.abbreviations_and_terminology`; printed/PDF 14/16, 15/17. Fixtures: `test.core.quest.end_uncertain.different_endpoints`. Review: `issue.0004`.
- `core.quest.reward` — `section.settlements.collect_your_reward`; printed/PDF 142/144. Fixtures: `test.core.quest.reward.claim`, `test.core.quest.reward.elsewhere`.
- `core.quest.location` — `section.embarking_on_your_first_quest`; printed/PDF 57/59. Fixtures: `test.core.quest.location.random`.
- `core.quest.travel` — `section.embarking_on_your_first_quest`; printed/PDF 57/59. Fixtures: `test.core.quest.travel.local`.
- `character.luck.settlement_reset` — `section.character_basics.the_character.luck_l`; printed/PDF 24/26, 25/27. Fixtures: `test.character.luck.settlement_reset.arrival`, `test.character.luck.settlement_reset.same_visit`. Review: `issue.phase4.settlement_recovery`.
- `character.energy.quest_return` — `section.character_basics.the_character.energy_e`; printed/PDF 24/26. Fixtures: `test.character.energy.quest_return.return`. Review: `issue.phase4.settlement_recovery`.
- `character.recovery.short_rest_energy` — `section.into_the_dungeons.rest`; printed/PDF 98/100. Fixtures: `test.character.recovery.short_rest_energy.three`, `test.character.recovery.short_rest_energy.four`, `test.character.recovery.short_rest_energy.interrupted`.
- `character.recovery.short_rest_mana` — `section.into_the_dungeons.rest`; printed/PDF 98/100. Fixtures: `test.character.recovery.short_rest_mana.mana`.
- `character.recovery.short_rest_hp` — `section.into_the_dungeons.rest`; printed/PDF 98/100. Fixtures: `test.character.recovery.short_rest_hp.heal`. Review: `issue.phase4.recovery_bounds`.
- `character.recovery.hp_overflow` — `section.into_the_dungeons.rest`; printed/PDF 98/100. Fixtures: `test.character.recovery.hp_overflow.overflow`. Review: `issue.phase4.recovery_bounds`.
- `character.recovery.inn_resources` — `section.settlements.rest_and_recuperation`; printed/PDF 145/147. Fixtures: `test.character.recovery.inn_resources.paid`. Review: `issue.phase4.settlement_recovery`.
- `character.recovery.inn_hp` — `section.settlements.rest_and_recuperation`; printed/PDF 145/147. Fixtures: `test.character.recovery.inn_hp.night`. Review: `issue.phase4.recovery_bounds`.
- `character.recovery.unaffordable` — `section.settlements.rest_and_recuperation`; printed/PDF 145/147. Fixtures: `test.character.recovery.unaffordable.stable`. Review: `issue.phase4.recovery_bounds`, `issue.phase4.settlement_recovery`.
- `character.recovery.half_uncertain` — `section.settlements.rest_and_recuperation`; printed/PDF 145/147. Fixtures: `test.character.recovery.half_uncertain.half`. Review: `issue.phase4.recovery_bounds`.
- `character.recovery.settlement_overlap` — `section.settlements.rest_and_recuperation`; printed/PDF 145/147. Fixtures: `test.character.recovery.settlement_overlap.combined`. Review: `issue.phase4.settlement_recovery`.
- `core.optional.encumbrance` — `section.game_basics.complexity`; printed/PDF 19/21. Fixtures: `test.core.optional.encumbrance.guidance`.
- `core.optional.party_morale` — `section.game_basics.complexity`; printed/PDF 19/21. Fixtures: `test.core.optional.party_morale.guidance`.
- `core.optional.durability` — `section.game_basics.complexity`; printed/PDF 19/21. Fixtures: `test.core.optional.durability.guidance`.
- `core.optional.sanity` — `section.game_basics.complexity`; printed/PDF 19/21. Fixtures: `test.core.optional.sanity.guidance`.
- `core.optional.scenario_and_threat` — `section.game_basics.complexity`; printed/PDF 19/21. Fixtures: `test.core.optional.scenario_and_threat.guidance`.

### [corpus/rules/core/core-boundaries.yaml](../corpus/rules/core/core-boundaries.yaml)

- `character.sanity.indulgence_cap_uncertain` — `section.psychology.sanity.reducing_insanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.indulgence_cap_uncertain.above_eight`. Review: `issue.phase4.sanity_maximum`.
- `character.condition.trauma_expiry` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.trauma_expiry.exit`.
- `character.mana.fractional_pool_uncertain` — `section.creating_your_character.mana`; printed/PDF 27/29. Fixtures: `test.character.mana.fractional_pool_uncertain.odd`. Review: `issue.phase4.mana_rounding`.
- `character.recovery.inn_luck` — `section.settlements.rest_and_recuperation`; printed/PDF 145/147. Fixtures: `test.character.recovery.inn_luck.first`, `test.character.recovery.inn_luck.later`. Review: `issue.phase4.settlement_recovery`.
- `character.recovery.stable_hp` — `section.settlements.rest_and_recuperation`; printed/PDF 145/147. Fixtures: `test.character.recovery.stable_hp.stable`. Review: `issue.phase4.recovery_bounds`.
- `core.movement.pit_exit` — `section.into_the_dungeons.obstacles.climbing_pits`; printed/PDF 91/93. Fixtures: `test.core.movement.pit_exit.exit`.
- `core.action_points.move` — `section.combat.different_combat_actions`; printed/PDF 107/109. Fixtures: `test.core.action_points.move.move`.
- `character.encumbrance.feedback_uncertain` — `section.equipment.encumbrance`; printed/PDF 51/53. Fixtures: `test.character.encumbrance.feedback_uncertain.feedback`. Review: `issue.phase4.encumbrance_feedback`.

### [corpus/rules/core/dependency-links.yaml](../corpus/rules/core/dependency-links.yaml)

- `core.turn.psychology` — `section.game_basics.turn_sequence`; printed/PDF 18/20. Fixtures: `test.core.turn.psychology.references`. Dependencies: `table.psychology.sanity_losses` (Check applicable Sanity changes); `table.psychology.morale_adjustments` (Check applicable Party Morale changes).
- `character.condition.arachnophobia_other_encounters` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.arachnophobia_other_encounters.not_spider`. Review: `issue.phase4.arachnophobia_scope`.

### [corpus/rules/core/dice-conventions.yaml](../corpus/rules/core/dice-conventions.yaml)

- `core.rounding.up` — `section.introduction.abbreviations_and_terminology`; printed/PDF 14/16. Fixtures: `test.core.rounding.up.fraction`, `test.core.rounding.up.integer`.
- `core.rounding.down` — `section.introduction.abbreviations_and_terminology`; printed/PDF 14/16. Fixtures: `test.core.rounding.down.fraction`, `test.core.rounding.down.integer`.
- `core.dice.percentile` — `section.introduction.dice_rolling_and_skill_checks`; printed/PDF 16/18. Fixtures: `test.core.dice.percentile.printed_double_zero`.

### [corpus/rules/core/spatial-primitives.yaml](../corpus/rules/core/spatial-primitives.yaml)

- `core.spatial.adjacent` — `section.game_basics.the_tiles.adjacent`; printed/PDF 18/20. Fixtures: `test.core.spatial.adjacent.orthogonal`, `test.core.spatial.adjacent.diagonal`, `test.core.spatial.adjacent.same`, `test.core.spatial.adjacent.distant`, `test.core.spatial.adjacent.diagram_north_west`, `test.core.spatial.adjacent.diagram_north`, `test.core.spatial.adjacent.diagram_north_east`, `test.core.spatial.adjacent.diagram_west`, `test.core.spatial.adjacent.diagram_east`, `test.core.spatial.adjacent.diagram_south_west`, `test.core.spatial.adjacent.diagram_south`, `test.core.spatial.adjacent.diagram_south_east`.
- `core.model.footprint` — `section.game_basics.models`; printed/PDF 18/20. Fixtures: `test.core.model.footprint.large`, `test.core.model.footprint.normal`.
- `core.los.trace` — `section.game_basics.line_of_sight_los`; printed/PDF 19/21. Fixtures: `test.core.los.trace.centres`.
- `core.los.blocked` — `section.game_basics.line_of_sight_los`; printed/PDF 19/21. Fixtures: `test.core.los.blocked.diagram_a_to_b`.
- `core.los.obstructed` — `section.game_basics.line_of_sight_los`; printed/PDF 19/21. Fixtures: `test.core.los.obstructed.diagram_a_to_c`.
- `core.los.clear` — `section.game_basics.line_of_sight_los`; printed/PDF 19/21. Fixtures: `test.core.los.clear.diagram_a_to_d`.
- `core.movement.wall` — `section.game_basics.the_tiles.objects_on_the_tiles`; printed/PDF 18/20. Fixtures: `test.core.movement.wall.wall`.
- `core.movement.distance` — `section.into_the_dungeons.moving_and_facing`; printed/PDF 91/93. Fixtures: `test.core.movement.distance.limit`.
- `core.movement.facing` — `section.into_the_dungeons.moving_and_facing`; printed/PDF 91/93. Fixtures: `test.core.movement.facing.side`.
- `core.movement.diagonal_models` — `section.into_the_dungeons.moving_and_facing`; printed/PDF 91/93. Fixtures: `test.core.movement.diagonal_models.a_to_1`, `test.core.movement.diagonal_models.a_to_2`, `test.core.movement.diagonal_models.a_to_3`, `test.core.movement.diagonal_models.a_to_4_without_b`, `test.core.movement.diagonal_models.large_between_friends`.
- `core.movement.occupied` — `section.into_the_dungeons.moving_and_facing`; printed/PDF 91/93. Fixtures: `test.core.movement.occupied.occupied`, `test.core.movement.occupied.exception`.
- `core.movement.diagonal_border` — `section.into_the_dungeons.moving_and_facing`; printed/PDF 91/93. Fixtures: `test.core.movement.diagonal_border.diagram_a_to_b`.
- `core.movement.furniture` — `section.into_the_dungeons.obstacles.climbing_furniture`; printed/PDF 91/93. Fixtures: `test.core.movement.furniture.climb`.
- `core.movement.pit.up_without_rope` — `section.into_the_dungeons.obstacles.climbing_pits`; printed/PDF 91/93. Fixtures: `test.core.movement.pit.up_without_rope.cost`.
- `core.movement.pit.up_with_rope` — `section.into_the_dungeons.obstacles.climbing_pits`; printed/PDF 91/93. Fixtures: `test.core.movement.pit.up_with_rope.cost`.
- `core.movement.pit.down` — `section.into_the_dungeons.obstacles.climbing_pits`; printed/PDF 91/93. Fixtures: `test.core.movement.pit.down.cost`.
- `core.movement.pit_failure` — `section.into_the_dungeons.obstacles.climbing_pits`; printed/PDF 91/93. Fixtures: `test.core.movement.pit_failure.fall`. Dependencies: `pit_damage` (Damage on the exploration or trap card).
- `core.obstacle.half_square` — `section.into_the_dungeons.obstacles.rule_of_fifty_percent`; printed/PDF 92/94. Fixtures: `test.core.obstacle.half_square.over_half`, `test.core.obstacle.half_square.exact_half`.
- `core.movement.zone_of_control` — `section.combat.zone_of_control_zoc`; printed/PDF 107/109. Fixtures: `test.core.movement.zone_of_control.within`, `test.core.movement.zone_of_control.enter`.
- `core.spatial.zone_of_control` — `section.combat.zone_of_control_zoc`; printed/PDF 107/109. Fixtures: `test.core.spatial.zone_of_control.front_diagonal`, `test.core.spatial.zone_of_control.rear`.

### [corpus/rules/equipment/encumbrance-durability.yaml](../corpus/rules/equipment/encumbrance-durability.yaml)

- `character.encumbrance.penalty` — `section.equipment.encumbrance`; printed/PDF 51/53. Fixtures: `test.character.encumbrance.penalty.at_strength`, `test.character.encumbrance.penalty.over_strength`, `test.character.encumbrance.penalty.at_hard_limit`.
- `character.encumbrance.limit` — `section.equipment.encumbrance`; printed/PDF 51/53. Fixtures: `test.character.encumbrance.limit.limit`, `test.character.encumbrance.limit.exceeded`.
- `character.equipment.quick_slots` — `section.equipment.carrying_equipment`; printed/PDF 50/52. Fixtures: `test.character.equipment.quick_slots.armour_rejected`.
- `character.equipment.hands` — `section.equipment.hands`; printed/PDF 50/52. Fixtures: `test.character.equipment.hands.ready`.
- `character.equipment.quick_access` — `section.equipment.carrying_equipment`; printed/PDF 50/52. Fixtures: `test.character.equipment.quick_access.exposed`.
- `character.equipment.backpack` — `section.equipment.backpack`; printed/PDF 51/53. Fixtures: `test.character.equipment.backpack.protected`.
- `character.equipment.stacked_armour` — `section.equipment.stacking_armour`; printed/PDF 50/52, 51/53. Fixtures: `test.character.equipment.stacked_armour.two_tiers`.
- `character.durability.standard` — `section.equipment.weapon_durability`; printed/PDF 49/51, 50/52. Fixtures: `test.character.durability.standard.ordinary`.
- `character.durability.gear_marker` — `section.equipment.general_equipment_durability`; printed/PDF 50/52. Fixtures: `test.character.durability.gear_marker.dash`.
- `character.durability.armour_damage` — `section.equipment.armour_and_shield_durability`; printed/PDF 50/52. Fixtures: `test.character.durability.armour_damage.outer`, `test.character.durability.armour_damage.inner_protected`.
- `character.durability.broken` — `section.equipment.weapon_durability`; printed/PDF 49/51, 50/52. Fixtures: `test.character.durability.broken.zero`.
- `character.durability.fumble` — `section.combat.fumble`; printed/PDF 110/112. Fixtures: `test.character.durability.fumble.fumble`, `test.character.durability.fumble.not_fumble`.
- `character.durability.weapon_parry` — `section.combat.parry_with_a_weapon`; printed/PDF 118/120. Fixtures: `test.character.durability.weapon_parry.lower_bound`, `test.character.durability.weapon_parry.below`.
- `character.durability.overlap_uncertain` — `section.combat.parry_with_a_weapon`; printed/PDF 118/120. Fixtures: `test.character.durability.overlap_uncertain.combined`. Review: `issue.phase4.durability_overlap`.
- `character.durability.quick_slot_hit` — `section.combat.quick_slots_and_damage`; printed/PDF 119/121. Fixtures: `test.character.durability.quick_slot_hit.slot_three`, `test.character.durability.quick_slot_hit.miss_slots`.
- `character.durability.potion_hit` — `section.combat.quick_slots_and_damage`; printed/PDF 119/121. Fixtures: `test.character.durability.potion_hit.potion`. Dependencies: `section.alchemy` (Damage from the struck potion).
- `character.durability.magic` — `section.magic_items.durability_of_magic_items`; printed/PDF 68/70. Fixtures: `test.character.durability.magic.magic_weapon`.
- `character.durability.magic_gear` — `section.magic_items.durability_of_magic_items`; printed/PDF 68/70. Fixtures: `test.character.durability.magic_gear.other_item`.
- `character.durability.dissipation` — `section.magic_items.dissipating_magic`; printed/PDF 68/70. Fixtures: `test.character.durability.dissipation.magic_lost`. Review: `issue.phase4.magic_breakage`, `issue.phase4.durability_overlap`.
- `character.durability.magic_repair_uncertain` — `section.magic_items.dissipating_magic`; printed/PDF 68/70. Fixtures: `test.character.durability.magic_repair_uncertain.broken_magic`. Review: `issue.phase4.magic_breakage`.
- `character.durability.broken_magic_lost` — `section.magic_items.dissipating_magic`; printed/PDF 68/70. Fixtures: `test.character.durability.broken_magic_lost.break`.
- `character.durability.repair_price` — `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`; printed/PDF 184/186. Fixtures: `test.character.durability.repair_price.two_points`, `test.character.durability.repair_price.unlisted_price`. Review: `issue.phase4.lookup_domain`.
- `character.equipment.sell_eligibility` — `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`; printed/PDF 184/186. Fixtures: `test.character.equipment.sell_eligibility.broken`.
- `character.equipment.sell_price_0` — `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`; printed/PDF 184/186. Fixtures: `test.character.equipment.sell_price_0.price_100`. Review: `issue.phase4.lookup_domain`.
- `character.equipment.sell_price_1` — `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`; printed/PDF 184/186. Fixtures: `test.character.equipment.sell_price_1.price_100`. Review: `issue.phase4.lookup_domain`.
- `character.equipment.sell_price_2` — `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`; printed/PDF 184/186. Fixtures: `test.character.equipment.sell_price_2.price_100`. Review: `issue.phase4.lookup_domain`.
- `character.equipment.sell_price_3` — `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`; printed/PDF 184/186. Fixtures: `test.character.equipment.sell_price_3.price_100`. Review: `issue.phase4.lookup_domain`.
- `character.equipment.sell_price_4` — `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`; printed/PDF 184/186. Fixtures: `test.character.equipment.sell_price_4.price_100`. Review: `issue.phase4.lookup_domain`.
- `character.equipment.sell_price_5` — `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`; printed/PDF 184/186. Fixtures: `test.character.equipment.sell_price_5.price_100`. Review: `issue.phase4.lookup_domain`.
- `character.equipment.combine_price_rows` — `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`; printed/PDF 184/186. Fixtures: `test.character.equipment.combine_price_rows.final_row`.
- `character.durability.repair_location` — `section.settlements.repair_equipment`; printed/PDF 145/147. Fixtures: `test.character.durability.repair_location.blacksmith`.

### [corpus/rules/psychology/party-morale.yaml](../corpus/rules/psychology/party-morale.yaml)

- `character.morale.member_contribution` — `section.psychology.party_morale`; printed/PDF 56/58, 31/33. Fixtures: `test.character.morale.member_contribution.wilbur`, `test.character.morale.member_contribution.round_before_sum`.
- `character.morale.sum_contributions` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.sum_contributions.second_member`.
- `character.morale.event.hero_dies` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.hero_dies.once`.
- `character.morale.event.zero_hp` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.zero_hp.once`.
- `character.morale.event.demon_battle` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.demon_battle.once`.
- `character.morale.event.terror` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.terror.once`.
- `character.morale.event.hungry` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.hungry.once`.
- `character.morale.event.fear` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.fear.once`.
- `character.morale.event.poison_or_disease` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.poison_or_disease.once`, `test.character.morale.event.poison_or_disease.two_heroes`.
- `character.morale.event.trap` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.trap.once`.
- `character.morale.event.miscast` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.miscast.once`.
- `character.morale.event.portcullis` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.portcullis.once`.
- `character.morale.event.short_rest` — `section.psychology.party_morale`; printed/PDF 56/58, 98/100. Fixtures: `test.character.morale.event.short_rest.conflict`. Review: `issue.phase4.short_rest_morale`.
- `character.morale.event.fine_treasure` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.fine_treasure.once`.
- `character.morale.event.large_monster` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.large_monster.once`.
- `character.morale.event.dwarven_ale` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.dwarven_ale.once`.
- `character.morale.event.wonderful_treasure` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.event.wonderful_treasure.once`.
- `character.morale.wavering` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.wavering.below`.
- `character.morale.recovered` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.recovered.above`.
- `character.morale.threshold_uncertain` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.threshold_uncertain.equal`. Review: `issue.phase4.morale_threshold`.
- `character.morale.flee` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.flee.leave`, `test.character.morale.flee.combat_delays`. Dependencies: `section.travelling_and_skirmishes` (Travel Events for the travel home).
- `character.morale.retry_quest` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.retry_quest.must_visit`.
- `character.morale.reset` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.reset.exit`.
- `character.morale.outside_bounds` — `section.psychology.party_morale`; printed/PDF 56/58. Fixtures: `test.character.morale.outside_bounds.negative`. Review: `issue.phase4.morale_threshold`.

### [corpus/rules/psychology/sanity.yaml](../corpus/rules/psychology/sanity.yaml)

- `character.sanity.initial` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.initial.initial`.
- `character.sanity.loss.terror` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.loss.terror.event`.
- `character.sanity.loss.trap` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.loss.trap.event`.
- `character.sanity.loss.head_wound` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.loss.head_wound.event`.
- `character.sanity.loss.fear` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.loss.fear.event`.
- `character.sanity.loss.demon_battle` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.loss.demon_battle.event`.
- `character.sanity.loss.zero_hp` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.loss.zero_hp.event`.
- `character.sanity.loss.disease` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.loss.disease.event`.
- `character.sanity.loss.poison` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.loss.poison.event`.
- `character.sanity.loss.miscast` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.loss.miscast.maximum_loss`.
- `character.sanity.loss.room_event` — `section.psychology.sanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.loss.room_event.card_required`. Dependencies: `exploration_card` (Sanity effect on the Exploration Card).
- `character.sanity.draw_condition` — `section.psychology.sanity.conditions`; printed/PDF 53/55. Fixtures: `test.character.sanity.draw_condition.roll_1`, `test.character.sanity.draw_condition.roll_2`, `test.character.sanity.draw_condition.roll_3`, `test.character.sanity.draw_condition.roll_4`, `test.character.sanity.draw_condition.roll_5`, `test.character.sanity.draw_condition.roll_6`, `test.character.sanity.draw_condition.roll_7`, `test.character.sanity.draw_condition.roll_8`, `test.character.sanity.draw_condition.roll_9`, `test.character.sanity.draw_condition.roll_10`. Review: `issue.phase4.sanity_boundaries`.
- `character.sanity.duplicate_condition` — `section.psychology.sanity.conditions`; printed/PDF 53/55. Fixtures: `test.character.sanity.duplicate_condition.duplicate`.
- `character.sanity.acquire_condition` — `section.psychology.sanity.conditions`; printed/PDF 53/55. Fixtures: `test.character.sanity.acquire_condition.second_condition`.
- `character.sanity.boundary_uncertain` — `section.psychology.sanity.conditions`; printed/PDF 53/55. Fixtures: `test.character.sanity.boundary_uncertain.overshoot`. Review: `issue.phase4.sanity_boundaries`.
- `character.condition.hate` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.hate.external_dependency`. Dependencies: `section.appendix_ii_talents.mental_talents` (Hate Talent against the type of enemy last fought); `monster_list` (Monster List).
- `character.condition.acute_stress` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.acute_stress.current_quest`. Review: `issue.0004`.
- `character.condition.lingering_trauma` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.lingering_trauma.triggered`, `test.character.condition.lingering_trauma.not_yet`.
- `character.condition.fear_of_the_dark` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.fear_of_the_dark.all_resolve_tests`.
- `character.condition.arachnophobia` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.arachnophobia.spiders`. Review: `issue.phase4.arachnophobia_scope`.
- `character.condition.jumpy` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.jumpy.ten`, `test.character.condition.jumpy.nine`.
- `character.condition.irrational_fear` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.irrational_fear.faction`.
- `character.condition.claustrophobia` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.claustrophobia.corridor`, `test.character.condition.claustrophobia.room`.
- `character.condition.depression` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.depression.pool`. Review: `issue.phase4.energy_floor`.
- `character.condition.depression_floor` — `section.psychology.table`; printed/PDF 55/57. Fixtures: `test.character.condition.depression_floor.low_pool`. Review: `issue.phase4.energy_floor`.
- `character.sanity.trauma_trigger` — `section.psychology.table_lingering_trauma_table`; printed/PDF 55/57. Fixtures: `test.character.sanity.trauma_trigger.roll_1`, `test.character.sanity.trauma_trigger.roll_2`, `test.character.sanity.trauma_trigger.roll_3`, `test.character.sanity.trauma_trigger.roll_4`, `test.character.sanity.trauma_trigger.roll_5`, `test.character.sanity.trauma_trigger.roll_6`. Review: `issue.phase4.sanity_boundaries`.
- `character.sanity.recovery` — `section.psychology.sanity.reducing_insanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.recovery.cap`.
- `character.sanity.recovery_uncertain` — `section.psychology.sanity.reducing_insanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.recovery_uncertain.condition_cap`. Review: `issue.phase4.sanity_maximum`.
- `character.sanity.indulgence` — `section.psychology.sanity.reducing_insanity`; printed/PDF 53/55. Fixtures: `test.character.sanity.indulgence.indulge`.
- `character.sanity.inn_recovery` — `section.settlements.tending_to_those_memories`; printed/PDF 145/147, 53/55. Fixtures: `test.character.sanity.inn_recovery.inn`.
- `character.sanity.treatment` — `section.settlements.treat_mental_conditions`; printed/PDF 145/147. Fixtures: `test.character.sanity.treatment.attempt_cost`, `test.character.sanity.treatment.limit`.
- `character.sanity.treatment_success` — `section.settlements.treat_mental_conditions`; printed/PDF 145/147. Fixtures: `test.character.sanity.treatment_success.five`, `test.character.sanity.treatment_success.six`.

### [corpus/entities/conditions/sanity.yaml](../corpus/entities/conditions/sanity.yaml)

- `condition.hate` — `section.psychology.table`; printed/PDF 55/57.
- `condition.acute_stress` — `section.psychology.table`; printed/PDF 55/57.
- `condition.lingering_trauma` — `section.psychology.table`; printed/PDF 55/57.
- `condition.fear_of_the_dark` — `section.psychology.table`; printed/PDF 55/57.
- `condition.arachnophobia` — `section.psychology.table`; printed/PDF 55/57.
- `condition.jumpy` — `section.psychology.table`; printed/PDF 55/57.
- `condition.irrational_fear` — `section.psychology.table`; printed/PDF 55/57.
- `condition.claustrophobia` — `section.psychology.table`; printed/PDF 55/57.
- `condition.depression` — `section.psychology.table`; printed/PDF 55/57.

### [corpus/tables/character/core-stats.yaml](../corpus/tables/character/core-stats.yaml)

- `table.character.skill_bases` — `section.character_basics.the_character.skills_list`; printed/PDF 26/28.
- `table.character.damage_bonus` — `section.creating_your_character.choosing_your_species.table_2`; printed/PDF 27/29.
- `table.character.natural_armour` — `section.creating_your_character.damage_bonus_and_natural_armour.natural_armour_table`; printed/PDF 27/29.
- `table.character.stat_maxima` — `section.levelling_up.stats_and_skills_maximum.table`; printed/PDF 58/60.

### [corpus/tables/equipment/encumbrance-durability.yaml](../corpus/tables/equipment/encumbrance-durability.yaml)

- `table.equipment.sell_and_repair` — `section.appendix_iii_equipment.general_equipment.sell_and_repair_table`; printed/PDF 184/186.

### [corpus/tables/psychology/party-morale.yaml](../corpus/tables/psychology/party-morale.yaml)

- `table.psychology.morale_adjustments` — `section.psychology.party_morale.table`; printed/PDF 56/58.

### [corpus/tables/psychology/sanity.yaml](../corpus/tables/psychology/sanity.yaml)

- `table.psychology.sanity_losses` — `section.psychology.sanity.table`; printed/PDF 53/55.
- `table.psychology.mental_conditions` — `section.psychology.table`; printed/PDF 55/57.
- `table.psychology.lingering_trauma` — `section.psychology.table_lingering_trauma_table`; printed/PDF 55/57.
