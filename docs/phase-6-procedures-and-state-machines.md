# Phase 6 — Procedures and state machines

## Status and boundaries

Phase 6 has started; it is not complete. This document records the approved batch order, the
units extracted so far, and what remains deferred. Extraction does not imply independent
review. Phase 5 Batches 1–6 are extracted in their own
ledger; later catalogue work is not a prerequisite for these units: procedures bind to mapped sections, and
dependency targets that do not exist yet are recorded as `unresolved_references` or open
issues instead of being invented.

## Batch plan

| Batch | Scope                                                                              | Status    |
| ----- | ---------------------------------------------------------------------------------- | --------- |
| 1     | Dungeon loop: threat, door/chest, rest, searching                                  | Extracted |
| 2     | Locked doors (force/crowbar/pick), wandering-monster movement, trap resolution     | Extracted |
| 3     | Initiative/activation procedure, encounters, initial setup, dungeon generation     | Extracted |
| 4     | Combat procedures: attack resolution, damage, bleeding out                         | Extracted |
| 5     | Travel, settlement visit, buying/selling, repair, identifying                      | Extracted |
| 6     | Character creation, levelling, learning spells/prayers, training, guild activities | Extracted |
| 7     | State machines: hero condition, rest interruption semantics, quest lifecycle       | Pending   |

State machines are added only where the source genuinely governs transitions by current state;
every other candidate stays a plain procedure. `procedure.dungeon_turn` and
`procedure.thief_treasure_choice` predate this phase (Phase 3 pilot).

## Schemas and tooling added

- `schemas/state-machine.schema.json` — state machines with per-transition `source_text`
  (documented triggers) and optional per-transition provenance. Registered as the
  `stateMachines` schema root; loaded from `corpus/state-machines/`.
- `scripts/validate/pilot.ts` — state-machine integrity: namespace, unique states, resolvable
  initial state and transition targets, reachability from the initial state, terminal states
  without outgoing transitions, `enter` bindings, provenance. Procedure dependencies may now
  bind `object_id` to a state machine.
- No interpreter changes: state machines are structural records, not executed.

## Evidence ledger

- Batches 1–4 are complete within their approved extraction scope, with explicit source
  limitations retained below. Batch 5 covers travel and bounded settlement workflows. Phase 6 remains in progress.
- PDF 101 (printed 99), rendered: all ten numeric Door Table outcomes preserve printed 0 as 10.
  `procedure.locked_door_and_close` handles force/crowbar damage, Threat, exact/excess HP,
  picking success/failure/fumble, jammed locks and door-only closing. Crowbar effects occur before
  the unresolved AP marker; no zero AP cost is invented. Fumbles also break the pick. Explicit
  guards prevent invalid branches and prevent zero HP from reopening a just-closed door.
- `procedure.open_door_or_chest` records the 1 AP cost, requires supplied adjacency, invokes
  the trap and lock handoffs, and guards reveal against surviving locks/traps. Encounters are
  door-only. Fixtures explicitly pass successful dependency outcomes; invocation does not run
  a dependency. Existing opening, rest, scenario-die and dungeon-turn targets are bound, with
  obsolete trap-heading/locked-procedure unresolved references removed.
- PDF 92 (printed 90), rendered: `procedure.wandering_monster` records initial start-tile
  placement, post-hero timing and supplied direction/route geometry. Closed doors retain the
  token until an ordinary 2–6 or sealed/wedged 5–6 passage succeeds. Successful magical passage
  breaks its seal. Chasm arrival, next-turn crossing and following-turn movement are distinct;
  crossing back is forbidden. Reveal requires room entry, LOS unobstructed by a closed door,
  and distance at most ten. Four squares is an allowance, not an invented geometric path length.
- PDF 92 and 101, rendered: `procedure.trap_resolution` distinguishes random Threat/Search
  victims from openers, persists detected traps, spends 2 AP on disarming or deliberate door/chest
  triggering, and reports opening eligibility separately from locks. Mimic attack restrictions,
  Lower Undead, forced square entry, card-supplied affected actors and saving-throw exceptions
  are explicit. Resolved card consequences are not applied again on later entries.
- Verification: thirteen Batch 2 YAML trace fixtures plus 51 independent outcome/trace tests in
  `tests/rules/phase-six-batch-two.test.ts`. These include every Door Table outcome, thresholds,
  repeated blocked turns, all chasm stages, LOS/distance boundaries, traps, Mimics, missing data
  and composed opening with supplied results. Tests are source-backed derived cases, not independent review.
- Retained source limitations: `issue.phase6.crowbar_action_cost`,
  `issue.phase6.iron_wedges_movement`, and `issue.phase6.trap_resolution_deferred` (now scoped to
  unavailable card content and undefined card interactions). Detected-Mimic device-style
  disarming/deliberate-trigger behavior is not inferred. Monster selection and initiative remain
  handoffs; route geometry and dice are supplied. Interrupted-rest execution remains outside
  Batch 2, and the interpreter semantics are unchanged.

- PDF 89 (printed 88, folio misprint noted in `pages.yaml`) and PDF 91 (printed 89):
  `procedure.scenario_die` and `procedure.threat_roll`, including the natural-20 reduction,
  the in-battle/not-in-battle branch, and the table-driven decrease. The threat tables are
  invoked as section-bound dependencies, not extracted as table objects. The worked example
  (threat 9, roll 7, row 16, level down to 3) is a `source_example` fixture. A roll above the
  level raises it by 1, per the Increasing Threat Level list ("If a Threat Level roll exceeds
  the current Threat Level"); `issue.phase6.failed_threat_roll_increase` is resolved on that
  text.
- PDF 101 (printed 99): `procedure.open_door_or_chest` — the printed four-step sequence with
  the trapped branch. Trap-card resolution remains dependency-bound. Open issues:
  `issue.phase6.door_open_threat_source` (step-1 increase versus the "instant a door is
  opened" list entry), `issue.phase6.trap_resolution_deferred`,
  `issue.phase6.furniture_treasure_table_location`.
- PDF 100 (printed 98): `procedure.rest` — the printed eleven-point checklist with the
  ambush-risk computation `(5 + Threat level)%, +10% per rest after the first, max 70%`, the
  three wandering-monster moves, and the interruption branch that hands off to
  `state_machine.battle`. Rest-regain quantities stay with the Phase 4 recovery rules; the
  procedure does not restate them. The original extraction left interruption guards incomplete;
  Package F now explicitly guards checklist steps6–11 with a current-attempt completion
  checkpoint. Entry eligibility, attempt accounting and standard hero/point recovery are
  now guarded and trace-tested. Interpreter semantics remain unchanged. Bleeding/poison
  condition checks and modified recovery remain pending in the lifecycle inventory.
- PDF 99 (printed 97): `procedure.search_room_or_corridor` (+10 first helper, +5 each
  additional, roll on the highest PER, once per room) and `procedure.search_furniture` (one
  action, no roll, once only, not with enemies in LOS). The Perception Roll invokes
  `core.check.standard`. The Furniture Table binding stays section-level; see
  `issue.phase6.furniture_treasure_table_location`.
- PDF 106–107 and PDF 109 (printed 104–107): `state_machine.battle` —
  `not_in_battle → battle_setup → battle_active → battle_ended` with initiation, token-bag
  setup, the activation loop, and the printed all-enemies-dead end condition. Only the
  all-enemies-dead end condition is printed on the extracted pages; other end conditions
  (fleeing, quest endpoints) are recorded as an unresolved reference rather than invented.
  This overlaps `core.battle.end` (Phase 4) deliberately: the rule states the end condition,
  the state machine places it as a transition. `issue.0001` (dungeon-turn battle endpoints)
  remains open for independent review against this record.

## Batch 3 evidence

| Unit                      | Source and IDs                                                                                                | Verification and boundaries                                                                                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout and cards          | PDF 86–87, printed 84–85; `core.dungeon.*` in `dungeon-setup.yaml`                                            | Tile alignment, furniture-free doors, quest overrides, card fields and alternative playing cards. Missing card contents/room lookup are supplied inputs. B-card guidance conflicts across PDF 87–88 and remains unresolved.                                                                                                             |
| Generation and routes     | PDF 88, printed 86; `procedure.dungeon_generation`, `.dungeon_route`                                          | Separate selection, objective in shuffled bottom half, bottom-dealt branches, partial/total dead ends and exhausted routes. Card order and geometry supplied. Odd initial pile split remains unresolved rather than rounded arbitrarily. Abandoning/Finishing Quest text stays quest-lifecycle scope.                                   |
| Initial setup             | PDF 88; `procedure.initial_setup`                                                                             | Starting tile, unlocked/no-Threat entrance, Scenario Dice delayed until passing door, grass-side World Map exit. Opening and dungeon-turn procedures explicitly bind these exceptions; traps are not silently exempted.                                                                                                                 |
| Encounters                | PDF 106, printed 104; `procedure.encounters`                                                                  | Inclusive room/corridor thresholds, first +10 streak increase, cap 70, supplied room modifiers and highest-party-level encounter modifier. Quest selection overrides, supplied Bestiary outcome, placement constraints and immediate turn ending. Frequency of later streak increases is not explicit; require supplied interpretation. |
| Initiative and activation | PDF 106–107 and activation-order heading on PDF 118; `procedure.initiative`, `.activation`, `.enemy_priority` | Hidden bag/card order, first-turn bashing/hearing bonuses and cancellation, persistent named-monster tokens, hero choice, six enemy priorities and random ties. Dead/knocked-out/already-acted models cannot gain ordinary activations. Time Freeze explicitly permits an extra hero activation; extra tokens alone never do.           |
| Overwatch                 | PDF 107, printed 105; `procedure.overwatch`                                                                   | Eligibility, token withholding, Energy, ranged interruption/resumption and reload/idle restriction, melee ZOC response and charge result. Attack outcome is supplied. Unspecified repeat-response/melee second-action policy remains a review issue.                                                                                    |

Six sourced YAML traces are in `tests/examples/dungeon/batch-three.yaml`; additional independent
outcome/trace boundaries are in `tests/rules/dungeon-batch-three.test.ts`. Spell exceptions are
also checked in `magic-foundations.test.ts`. Composed tests supply dependency outcomes explicitly:
invocation remains a recorded handoff. Requirements do not halt a whole procedure, so consequential
steps have their own eligibility guards. The interpreter was not made a gameplay runtime.

Existing opening, wandering-monster, rest, dungeon-turn and `state_machine.battle` IDs are
preserved. Battle setup/active states bind initiative/activation, but the state machine remains
structural. Rest supplies its printed three extra enemy tokens (zero with a barred door);
rest interruption execution stays deferred. Combat attacks are added in Batch 4 below. Full enemy behaviour, optional
dungeon-event tables and quest lifecycle execution remain later batches. No independent review
or whole-phase completion is claimed.

## Verification

Batch 3 completion gate: 209 canonical files validate; 1,107 tests pass with two optional
provider integration tests skipped; lint passes. Coverage was regenerated from YAML. No commit
or independent review is claimed.

Historical Batch 2 completion gate: 196 canonical files validate; 980 tests pass with two optional provider
integration tests skipped; lint passes. The generated coverage report was rebuilt. No independent
review or Phase 6 completion is claimed, and no commit was made.

Historical Batch 1 gate: 183 canonical files validate; 781 tests pass; lint passes. Its
state-machine and initial dungeon-loop fixtures remain in `tests/schema/phase-six.test.ts` and
`tests/examples/dungeon/phase-six.yaml`; Batch 2 extends the checks without changing interpreter
semantics or executing interrupted rests.

## Batch 3 source-audit checkpoint — 28 September 2026

All six ledger units were checked against PDF 86–88, 106–107 and the activation-order
heading on PDF 118. This is a source audit, not independent review; records remain extracted.

| Unit                  | Disposition                                                                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout/cards          | Rendered PDF 86–87 confirms aligned squares, furniture-free doors, quest overrides and card fields. B-card inclusion conflict retained.                                                                  |
| Generation/routes     | Rendered PDF 88 confirms separately selected cards, bottom-half objective, bottom-dealt branches and dead-end routes. Odd pile size remains unresolved.                                                  |
| Initial setup         | PDF 88 confirms unlocked/no-Threat entrance and Scenario Dice delayed until entry; opening and dungeon-turn guards preserve the exception without inventing a trap exemption.                            |
| Encounters            | PDF 106 confirms 50/30 thresholds, four-empty-tile +10, 70 cap, room modifiers, highest-party-level selection and immediate turn end. Later streak frequency remains supplied rather than inferred.      |
| Initiative/activation | PDF 106–107 and 118 confirm first-turn bashing/hearing, persistent named tokens, one ordinary activation and six priorities. Time Freeze retains its separate spell-backed exception.                    |
| Overwatch             | PDF 107 confirms token withholding, loaded/ready weapon, Energy, no aim, ranged resume/reload-or-idle, and charge hit/miss consequences. Repeated-response and melee completion ambiguities remain open. |

Integration check: opening binds encounters; wandering reveal binds initiative; rest supplies
three extra enemy tokens or zero behind a barred door; battle setup/active states bind
initiative/activation. Dependency invocations remain recorded handoffs with supplied outcomes.
No new Batch 3 mechanical discrepancy was identified. Interrupted-rest execution, unavailable
cards/Bestiary and geometry remain outside scope. Existing boundary/composition tests are rerun
at the checkpoint gate; their passing does not establish independent review.

## Batch 4 — combat resolution

| Unit                              | Source and evidence                                                                                                      | Boundaries                                                                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attack preparation, aim and shove | PDF 109–116; `procedure.combat_preparation`, `combat_aim`, `combat_shove`, `combat_attack`; both PDF 115 modifier tables | Supplied geometry, stats, weapon/talent modifiers and Power Attack restriction resolution. Behind/prone, range, cumulative cover, aim interruptions, strict shove threshold, Bloodlust and Power reroll/maximization are separate branches. |
| Hero defence                      | PDF 112, 120; `procedure.hero_defence`                                                                                   | ZOC, usage limits, stance, shield arm spillover, Fast and fumble overlap. Exact shield-threshold wording is unresolved rather than silently made inclusive.                                                                                 |
| Thrown preparations               | PDF 117; `procedure.thrown_preparation`                                                                                  | LOS, one obstacle penalty, doorway exception/scatter and large-area centre-plus-covered-squares. Supplied impact geometry; no invented range or random-direction distribution.                                                              |
| Damage                            | PDF 121–122; `procedure.combat_damage`, `damage_follow_up`, `table.combat.hit_location`                                  | Existing damage/HP/durability rules reused; Quick Slots and armour remain recorded handoffs. Fire/acid continuation, Frost stun probability, disease, poison and magic consequences use supplied checkpoints; no full condition runtime.    |
| Bleeding out                      | PDF 122; `procedure.bleeding_out`                                                                                        | Initial injury, supplied rescue, post-battle bandage, party loss and separately enabled timer. Existing unresolved negative-HP and injury-selection semantics retained.                                                                     |
| Worked example                    | PDF 124; `tests/examples/combat/worked-example.yaml`                                                                     | Charge threshold 50, damage 4 and final threshold 20 are source-example fixtures. Behavior, wounded, Frenzy and negative-HP conflicts remain `issue.combat.example_conflicts`.                                                              |

`tests/rules/combat-procedures.test.ts` supplies outcomes explicitly and checks numerical boundaries,
invalid eligibility, missing inputs, shield/weapon consequences, scatter, Quick Slots, rescue and
single application of damage. Activation exposes a combat dependency; both Overwatch attack
handoffs and thrown-alchemy rules bind actual procedures. Existing IDs and interpreter semantics
are unchanged. Enemy decision-making, unavailable stats/cards, pathfinding and condition lifecycle
remain deferred. Reviewed sections remain zero. Source-audit gate: 209 files validated, 1,109 tests
passed (two optional provider tests skipped), regenerated coverage, lint and diff checks passed.

Batch 4 checkpoint gate: 214 canonical files validated; 1,150 tests passed with two optional
provider integrations skipped; coverage regenerated; lint and diff checks passed. The full suite
used two workers to avoid an unrelated provider-test timeout. Later Batch 5 integration also adds
an activation → preparation → attack → damage composition test with exactly one HP loss, a
zero-extra-AP charge shove check, and a party-loss guard against rescue. Attack dependencies are
recorded handoffs, not automatically executed. No interpreter or schema extension was needed.

Final integration gate with Phase 5 Batch 5: 223 canonical files validate; 1,366 tests pass
with two optional provider integrations skipped; coverage, lint and diff checks pass.

## Historical Batch 5 — initial travel and settlement workflows

- PDF 126–131: `procedure.travel_daily_movement`, `travel_food_and_rest`,
  `travel_event_check` and `travel_skirmish_setup` preserve fractional terrain costs, transport
  eligibility handoffs, food/foraging and hunger exceptions, daily event thresholds, structured
  obstacle-table dependency and skirmish setup. Routes, map geometry, event cards, adversaries and
  combat outcomes remain supplied. Skirmishes explicitly exclude Threat and Scenario Dice.
- PDF 132–147: `procedure.settlement_arrival`, `settlement_activities_and_overnight` and
  `settlement_buy_sell_and_service` preserve arrival/quest choices, rejection limits, per-hero
  Activity Point budgets, multi-day occupancy, party-wide overnight charges, service guards,
  availability failure locks, local/event price handling and catalogue-backed repair/identification
  handoffs. Existing recovery, Sanity and equipment repair rules remain the effect records; these
  procedures do not apply them again.
- Source-audit findings: combat PDF 109–122 and 124 matched existing extraction and caller bindings;
  source conflicts remain in review. Treasure PDF 108 and 193–215 matched existing findings, nested
  rolls, caller bindings, legendary restrictions and naming gaps; the printed overlap at settlement
  event result 5 is preserved in the table rather than normalized.
- Sixteen boundary/composition cases are in `tests/rules/travel-settlement.test.ts`. The existing
  `tests/tables/phase-five-settlement-catalogues.test.ts` checks catalogue endpoints and overlap.
  Calls remain handoffs; no interpreter or gameplay runtime behavior was added.
- Limitations: settlement tables were transcribed from PDF text extraction and were not visually
  checked against rendered pages in this increment. Full execution of settlement services, daily
  lodging payment/recovery arithmetic, skirmish geometry/card contents, and estate lifecycle remain
  bounded dependencies or later work.

Historical Batch 5 verification: 231 canonical files validate; 1,412 tests pass with two optional provider
integrations skipped; coverage regenerated for 695 rows/sections; lint and `git diff --check` pass.
No independent review or Phase 6 completion is claimed.

### Batch 5 reconciliation — Packages B/C

The original checkpoint contained placeholder movement, food, activity/lodging and
purchase-lock effects. Packages B/C replace those with actual guarded arithmetic,
daily/visit markers and composed traces. See [the accounting ledger](travel-settlement-accounting.md)
for state ownership, source evidence and unresolved boundaries. Batch 5 is extracted
within this bounded scope; independent review and later lifecycle work remain pending.

The [combat/treasure source checkpoint](combat-treasure-source-audit.md) includes
rendered-page evidence and corrected disease eligibility/recovery, with 1,417 tests
passing at that checkpoint. The settlement trinket overlap belongs to the nested
selector inside event 4; outer event 5 is Sale. Neither this audit nor passing tests
marks material independently reviewed.

### Package B travel accounting

Travel now applies movement, food, hunger and rest resource changes with daily markers
and independently guarded steps. The complete outdoor obstacle matrix is extracted.
See [travel-settlement-accounting.md](travel-settlement-accounting.md) for state ownership,
regressions and the retained HP-overflow/partial-ration boundaries. Package C completes settlement accounting within the documented scope.

## Batch 6 — Character and guild procedures

The [heading-level source inventory](character-guild-procedures.md) records all Batch 6
dispositions, 20 added procedures, three advancement matrices, supplied outcomes and
state ownership. Creation, advancement, learning and guild activities have guarded
prerequisites, attempt limits, completed durations and exact resource accounting.
Five new source ambiguities remain explicit. Supporting independent source checks
do not establish formal Phase 9 review status.

Package D gate: 248 canonical files validate; 1,697 tests pass with two optional
provider tests skipped; coverage regeneration, lint and diff checks pass. Phase 6
remains incomplete; quest and estate lifecycle work follows Package E.

## Batch 7 — Lifecycle models (in progress)

Package E catalogue acceptance is recorded in the quest inventory: all 124 catalogue
entries have source dispositions, with 403 canonical files validated and 2482 passing
tests (two optional provider skips). Batch 7 starts with a heading-level lifecycle
inventory for hero conditions, interrupted rest, quest acceptance/progression/
completion/abandonment and estate lifecycle. Ordered actions use procedures; state
machines require source-defined transitions. Preserve the existing `invoke` handoff
and failed-`require` semantics; guard consequential steps and exactly-once mutations.
Hero, party, quest-instance, visit and estate ownership must be documented before
composing resource changes. No Batch 7 lifecycle is declared complete by this handoff.

The [lifecycle starting inventory](lifecycle-procedures.md) maps 75 pending headings
and documents hero, party, quest-instance, visit and estate ownership. It does not
claim a completed source audit. First bounded unit: Rest, PDF100 / printed98, with
explicit interruption guards and preserved interpreter semantics.

Package F Rest interruption unit: rendered PDF100 / printed98 preserves food and
equipment adjustments before early interruption and guards the later checklist.
The [lifecycle inventory](lifecycle-procedures.md) documents the source boundary and
remaining Rest work. Six new derived trace regressions cover early interruption,
stale completion and completed recovery before a later ambush.

Rest interruption gate (1 October): validation passes for 403 canonical files;
2488 tests pass with two optional provider tests skipped; coverage regeneration,
lint and diff checks pass. The new rest tests were re-run after fixing their static
fixture type and all six pass. Coverage remains 345/666 extracted (52%), zero
independently reviewed. Next bounded Rest work: entry eligibility and duplicate-
attempt resource protection, followed by per-hero recovery and condition checks.

Rest entry/accounting unit gate (1 October): 403 canonical files validate; 2499 tests
pass (two optional provider skips); coverage regeneration, lint and diff checks pass.
Source prerequisites and attempt-owned duplicate protection now guard every checklist
step, with the supplied start-value morale cap. The existing +1/+2 morale conflict
remains unresolved. Next: per-hero recovery, per-lost-point Energy and condition checks.

Rest standard hero/point recovery gate (1 October): 404 canonical files validate;
2519 tests pass (two optional provider skips); coverage regeneration, lint and diff
checks pass. Three new procedures raise the stored procedure count to 58. Twenty
new derived regressions and the existing party traces preserve explicit handoffs,
hero/attempt/point ownership and exactly-once resource changes. HP overflow and
short-rest morale conflicts remain linked unresolved issues. Next bounded source
unit: PDF100’s Bleeding Out and Poisoned Characters passage, including its timing
under interrupted rest. Rest and Package F remain incomplete.

Rest-specific condition passage gate (1 October): rendered PDF100 / printed98
adds the previously unmapped Bleeding Out and Poisoned Characters child heading,
two procedures and 19 derived tests. The heading’s own component extraction is
complete with source timing uncertainty retained; full Rest/lifecycle acceptance
remains pending. A follow-up rendered PDF122 comparison records the unresolved
no-rescue/untreated-rest overlap. Both bounded gates validate 405 canonical files
and pass 2538 tests (two optional provider skips), lint and diff checks; coverage
regeneration passes for the new mapping. Current coverage: 346/667 extracted (52%),
zero independently reviewed. Next unit: Bleeding out, PDF122 / printed120.

Bleeding entry replay gate (1 October): 405 canonical files validate; 2549 tests
pass (two optional provider skips); lint and diff checks pass. Eleven new derived
regressions verify per-hero/downing-event injury and optional timer ownership.
Coverage is unchanged at 346/667 extracted, zero independently reviewed. The
existing bleeding procedure remains partially reconciled: next are rescue and
bandage permissions, terminal death endpoints and optional replacement at the
next settlement. Package F and comprehensive Phases 7–12 remain unfinished.

Bleeding rescue/bandage gate (1 October): 405 canonical files validate; 2568 tests
pass (two optional provider skips); lint and diff checks pass. Nineteen new derived
regressions verify the printed rescue methods, living/bleeding target guards,
stale permission clearing, attempt-owned handoffs and delayed supplied healing.
Coverage remains 346/667 extracted with zero independently reviewed. Next bounded
unit: terminal party-loss/no-help/optional timer-expiry endpoints, permanent
death and optional next-settlement replacement, retaining the untreated-rest
source overlap. Package F and comprehensive Phases 7–12 remain unfinished.

Bleeding terminal/removal gate (1 October): 406 canonical files validate; 2586
tests pass (two optional provider skips); coverage generation, lint and diff
checks pass. Eighteen new derived tests source-reconcile no-help/party-loss and
optional expiry, permanent removal, player choice and once-per-dead-hero
replacement at the next settlement. `procedure.hero_death` brings the stored
procedure count to 61. Explicit no-help checkpoints do not add a battle-over
prerequisite. The untreated-rest/no-help overlap remains unresolved. Current
coverage is 346/667 extracted, zero independently reviewed; other component
coverage is not promoted by this bounded lifecycle unit. Next bounded unit:
Poison on PDF122 / printed120, including remaining-roll ownership and rest/death
checkpoints. Package F and comprehensive Phases 7–12 remain unfinished.

Poison remaining-check / source-map loopback gate (1 October): 406 canonical
files validate; 2605 tests pass (two optional provider skips); coverage generation,
lint and diff checks pass. Nineteen new derived regressions verify check-owned
damage/count accounting, 01–05 cancellation, replay and actual zero-reaching
rest death. The newly mapped Poison heading and corrected parent continuation
produce 703 section/coverage rows (668 canonical sections, 35 redirects), with
346/668 extracted (52%) and zero independently reviewed. The lifecycle inventory
has 77 headings. Review inventory: 110 records, 102 unresolved/eight resolved,
including the remaining-sequence condition-status question. Next bounded unit:
Poison initial damaging-hit exposure and episode initialization on PDF122, then
all-remaining-check rest composition and explicit potion/Chapel cure handoffs.
Package F and comprehensive Phases 7–12 remain unfinished.

Poison initial-exposure/episode gate (1 October): 406 canonical files validate;
2624 tests pass (two optional provider skips); coverage generation, lint and
diff checks pass. Nineteen new derived regressions verify damaging-hit
eligibility, processed resistant/failed exposures, bounded supplied d10+1
initialization, current-condition persistence, immune results, stale counts and
cure-then-reinfection composition. Poison coverage remains partial; 346/668
canonical sections are extracted and zero independently reviewed. Review
inventory remains 110 records (102 unresolved/eight resolved). Next bounded
unit: all-remaining-check poison rest composition on PDF122 / printed120, then
explicit potion/Chapel cure handoffs. Package F and Phases 7–12 remain unfinished.

Poison all-remaining-check rest gate (1 October): 406 canonical files validate;
2641 tests pass (two optional provider skips); coverage generation, lint and
diff checks pass. Seventeen new derived regressions verify rest handoff
accounting/replay, all printed rest contexts, explicit finite CON sequences,
cure/death stopping, permanent-removal handoff and dungeon helper composition.
After the full suite passed, two static array-index accesses in the new test
were narrowed; all 17 targeted tests and lint then passed again. The
remaining_poison self-dependency has a recorded source-defined bounded re-entry
disposition for Phase 7, and invoke still does not execute a loop. Poison's
procedure component remains partial pending explicit potion/Chapel cure
handoffs. Coverage remains 346/668 extracted, zero independently reviewed.
Next bounded unit: those printed cures on PDF122 / printed120 and their existing
equipment/settlement links. Package F and comprehensive Phases 7–12 remain unfinished.

Poison explicit-cure / settlement-integration gate (1 October): 407 canonical
files validate; 2663 tests pass (two optional provider skips); coverage
generation, lint and diff checks pass. `procedure.poison_cure` brings the stored
procedure count to 62. The 22 new derived cure regressions cover potion outcomes,
75/76 boundaries, replay, Supreme metadata/HP preservation, completed Chapel
visits, unbound route evidence and successful/failed/ineligible existing
settlement treatment. The service retains its accounting ownership and now
clears both current poison flags and cancels the remaining sequence.

Poison's bounded procedure component is extracted; the section remains
extracting because other components remain pending. Its entity disposition is
corrected to not-started for the named antidote/Chapel evidence. Coverage remains
346/668 extracted, zero independently reviewed. Review inventory: 111 records,
103 unresolved/eight resolved, including Chapel/Temple/Sick Ward routing.
Next bounded unit: Disease, PDF121 / printed119, including exposure, delayed
post-battle stat changes, rest cure and replay/state ownership. Package F and
comprehensive Phases 7–12 remain unfinished.

Disease exposure / rest checkpoint (1 October): rendered PDF121 / printed119
preserves indicated exposure, modified CON resistance, delayed post-battle loss
of half CON and STR rounded down, and an optional rest cure on 01–05.
Episode-owned markers prevent replay from halving adjusted values again; distinct
exposures and rests receive fresh markers. Cure ends modifier applicability
without inventing restoration across unrelated stat changes. Existing settlement
treatment ends that applicability within its own resource accounting.

The newly mapped Disease heading has an extracting procedure component; explicit
potion/Sick Ward cure routing remains the next bounded unit. Other components
and independent review remain pending. issue.disease.concurrent_effects records
unspecified overlapping illnesses and stat-modifier composition. Derived evidence:
tests/rules/disease-lifecycle.test.ts (22 regressions). Package F and
comprehensive Phases 7–12 remain unfinished.

Disease exposure / optional-rest gate (1 October): 407 canonical files validate;
2685 tests pass (two optional provider skips). Coverage regeneration, lint and
diff checks pass. Coverage tracks 704 rows: 669 canonical sections and 35
redirects; 346/669 extracted, zero independently reviewed. Review inventory:
112 records, 104 unresolved/eight resolved. Stored procedures remain 62.
Next bounded unit: explicit Disease potion/Sick Ward cure routing. Package F
and comprehensive Phases 7–12 remain unfinished.

Disease explicit-cure checkpoint (1 October): rendered PDF121 / printed119,
PDF80 / printed78 and PDF144 / printed142 confirm the potion and Sick Ward
routes. procedure.disease_cure accepts source-backed completed item/treatment
outcomes, owns hero/episode/cure-attempt handoff/result markers, and clears
disease plus stat-loss applicability only on confirmed success. Weak failures
consume their result, distinct attempts can retry, dead heroes cannot be revived,
and Supreme 1d3 HP stays with the item effect. Existing settlement treatment
retains the 100 c fee, eligible visit/day accounting and illness-specific outcome.
No stat restoration across unrelated modifiers or other illness removal is inferred.

Derived evidence: tests/rules/disease-cure-lifecycle.test.ts (21 regressions),
including composed successful/failed/ineligible service accounting, Weak 75/76,
Standard/Supreme, replay and the parent handoff. The Disease procedure component
is extracted within this bounded unit; other components and independent review
remain pending. Next bounded unit: Fire, Acidic and Frost damage follow-up,
PDF121–122 / printed119–120. Package F and comprehensive Phases 7–12 remain unfinished.

Disease explicit-cure gate (1 October): 408 canonical files validate; 2706 tests
pass (two optional provider skips). Coverage generation, lint and diff checks
pass. The new helper brings stored procedures to 63. Coverage remains 346/669
canonical sections extracted, zero independently reviewed, with 704 mapped rows
including 35 redirects. Review inventory remains 112 records (104 unresolved,
eight resolved). Next bounded unit: Fire, Acidic and Frost damage follow-up,
PDF121–122 / printed119–120. Package F and comprehensive Phases 7–12 remain unfinished.

Elemental hit / continuation checkpoint (1 October): rendered PDF121–122 /
printed119–120 preserves Fire ignoring NA and armour, Acidic ignoring NA, the
1–3 versus 4–6 continuation branches, half rounded down with minimum 1, and
Frost's 50% supplied stun outcome. procedure.damage_follow_up owns a distinct
target/hit initial marker; successful/failed outcomes both consume that check.
Fresh hits use fresh contexts, rather than aggregating unspecified overlapping
effects. procedure.elemental_continuation records one damage handoff on the
actual next turn and ends its pending effect only after supplied completed
damage resolution. Existing damage ownership handles HP/protection/death; no
second HP subtraction or resource mutation is performed by invoke.

issue.damage_follow_up.continuation_basis preserves the source's unspecified
Acidic halving/protection order. The legacy damage_before_protection input is
explicitly a supplied halving basis, rather than an inferred ordering decision.
The three newly mapped run-in headings extend the lifecycle inventory to 81.
Fire/Acidic bounded procedure components are extracted; Frost remains extracting
until next-turn AP consumption is reconciled. Other components and independent
review remain pending. Derived evidence: tests/rules/elemental-lifecycle.test.ts
(32 regressions). Next bounded unit: Stun/Frost next-turn AP consumption,
PDF122 / printed120, then Magic damage exceptions on that page. Package F and
comprehensive Phases 7–12 remain unfinished.

Elemental continuation uses the generic character.hit_points.loss dependency;
it does not infer weapon-hit location or equipment damage. An additional
composed trace asserts the applied rule, one HP subtraction, effect completion
and replay without another handoff.

Elemental hit / continuation final gate (1 October): 409 canonical files
validate; 2738 tests pass (two optional provider skips). Coverage generation,
lint and diff checks pass. Stored procedures: 64. Coverage: 707 mapped rows,
672 canonical sections plus 35 redirects, 346/672 extracted, zero independently
reviewed. Review inventory: 113 records, 105 unresolved/eight resolved. The
32 new derived regressions include generic HP-loss composition with an applied
rule trace and completion/replay without another HP subtraction. Next bounded
unit: Stun/Frost next-turn AP consumption, then Magic damage exceptions.
Package F and comprehensive Phases 7–12 remain unfinished.

Stun/Frost affected-turn checkpoint (1 October): rendered PDF122 / printed120
confirms one AP loss during the target next turn; rendered PDF179 / printed177
confirms the weapon-specific even damage roll and non-stacking exception.
procedure.damage_follow_up preserves supplied actually resolved stun outcomes,
including false outcomes and initial replay markers. procedure.stun_next_turn
requires the actual affected turn and its initialized allowance before applying
one AP loss. Target/affected-turn ownership and consumed markers prevent replay,
previous-turn charging or changes to another target. Pending effect and scheduled
loss are consumed only by the accepted AP mutation. Invoke alone changes no AP.

issue.stun.ap_and_overlap retains zero initialized allowance and mixed-source
aggregation boundaries. The weapon exception is linked to its existing rule,
without promoting it to a universal rule. Unknown scope/zero AP leaves the
pending effect and its marker unchanged. Derived evidence:
tests/rules/stun-lifecycle.test.ts (22 regressions), including Frost composition,
weapon non-stacking composition and the applied weapon-rule trace. The Stun
source-map loopback brings the lifecycle inventory to 82 headings. Stun/Frost
bounded procedure components are extracted; other components and independent
review remain pending. Next bounded unit: Magic Damage exceptions, PDF122 /
printed120. Package F and comprehensive Phases 7–12 remain unfinished.

Stun/Frost affected-turn final gate (1 October): 410 canonical files validate;
2760 tests pass (two optional provider skips). Coverage generation, lint and
diff checks pass. Stored procedures: 65. Coverage tracks 708 mapped rows,
673 canonical sections plus 35 redirects; 346/673 extracted, zero independently
reviewed. Review inventory: 114 records, 106 unresolved/eight resolved. The
22 new derived regressions cover legal/illegal initialized-turn consumption,
replay, distinct target/turn contexts, Frost handoff composition and the
weapon-specific non-stacking rule trace. Next bounded unit: Magic Damage
exceptions, PDF122 / printed120. Package F and comprehensive Phases 7–12
remain unfinished.

Magic Damage follow-up checkpoint (1 October): rendered PDF122 / printed120
preserves spells, prayers, scrolls, magic weapons and items as named magic
sources; the passage's normal path and creature-specific complications remain
distinct. procedure.damage_follow_up accepts one distinct initial event after
base damage is actually resolved. Ordinary source-reconciled targets complete
without an extra HP mutation or handoff. Applicable supplied creature-specific
complications request one handoff; only supplied actual completion marks the
event complete. Unknown applicability remains issue.magic.creature_complications.
The generic passage gives no numeric demon vulnerability, armour bypass or
immunity, and names no external book. No such detail or explicit book pointer
is fabricated; absent Bestiary contents remain unavailable.

Derived evidence: tests/rules/magic-damage-lifecycle.test.ts (15 regressions),
including an applied generic HP-loss trace, ordinary completion, pending/actual
exception completion, replay, separate targets and phase guards. The new run-in
heading extends the lifecycle inventory to 83; its bounded procedure component
is extracted, other components and independent review pending. Next bounded
unit: Wounded condition and AP allowance, PDF121 / printed119. Package F and
comprehensive Phases 7–12 remain unfinished.

Magic Damage follow-up final gate (1 October): 410 canonical files validate;
2775 tests pass (two optional provider skips). Coverage generation, lint and
diff checks pass. Stored procedures remain 65. Coverage tracks 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory: 115 records, 107 unresolved/eight resolved. The
15 new derived regressions preserve normal damage, actual exception outcomes,
unknown source applicability and once-per-event state. Next bounded unit:
Wounded condition and AP allowance, PDF121 / printed119. Package F and
comprehensive Phases 7–12 remain unfinished.

Wounded status / turn-cap checkpoint (1 October): rendered PDF121 / printed119
confirms loss of half maximum HP rounded up and the one-AP-per-turn limit while
that condition remains. procedure.wounded_status recomputes current HP loss
without applying damage/healing, clears the flag above the threshold, and applies
a cap only to an actual fresh initialized unspent allowance of a living acting
positive-HP target. Target/turn markers prevent replay/refilling. Already lower
allowances are preserved; healing does not refund AP in an active turn.

The existing procedure.combat_damage Wounded step now hands off rather than
setting active-turn AP to one. Its stable rule reference remains linked through
the new procedure dependency. character.hit_points.wounded keeps its stable ID
and calculation, gains rendered-source verification and the timing issue link.
issue.wounded.turn_allowance retains mid-turn onset/healing and mixed-modifier
order instead of inventing Wounded/Stun precedence. Derived evidence:
tests/rules/wounded-lifecycle.test.ts (27 regressions), including a post-hit HP
trace with one subtraction and no AP refill, recovery, rounding and Stun-zero
allowance preservation. The own Wounded passage has no entity/table/example;
its bounded procedure component is extracted, other components/review pending.

The hero-condition inventory also lacked Psychology/Sanity. Its existing mapped
PDF55 / printed53 node (page-map verified) is now an explicitly pending entry,
bringing the lifecycle inventory to 84 headings. Next bounded unit: Sanity
loss/threshold procedure, PDF55 / printed53, then the mental-condition outcomes
and existing treatment integration. Package F and comprehensive Phases 7–12
remain unfinished.

Wounded status / turn-cap final gate (1 October): 411 canonical files validate;
2802 tests pass (two optional provider skips). Coverage generation, lint and
diff checks pass. Stored procedures: 66. Coverage remains 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory: 116 records, 108 unresolved/eight resolved. The
27 derived regressions cover threshold/current-status recovery, actual fresh
allowances, replay, incapacity, unresolved timing/order and post-hit HP/AP
composition without duplicate mutation. Next bounded unit: Sanity loss/threshold
procedure, PDF55 / printed53. Its page has now been rendered and inspected as
preliminary next-unit evidence; no Sanity procedure extraction is claimed yet.
Package F and comprehensive Phases 7–12 remain unfinished.

Sanity loss / exact-zero checkpoint (1 October): rendered PDF55 / printed53
and optional-system evidence on rendered PDF21 / printed19 preserve one
hero/distinct-event loss context. procedure.sanity_loss reuses all existing loss
rules and the full structured table, including -2 Terror/trap, -1 head wound,
Fear, each demon battle, reduction to 0 HP, disease contraction and getting
poisoned, plus actual 1d3 miscast loss. Event confirmation and processed markers
prevent repeating one demon battle, counting ongoing disease/poison checks as
new onsets, or applying a loss to every hero through one shared state. Creation
remains owned separately; no event reinitializes Sanity to 8. Disabled Sanity
under Complexity causes neither loss nor condition handoff.

Room events request the existing Exploration Card handoff once while its actual
loss amount is unknown; the numerical result is consumed only after a supplied
source-backed loss amount is applied here once. Exact zero owns one pending
condition-acquisition handoff to the existing Conditions section, with no
invented future procedure ID. This checkpoint does not select/add conditions,
reroll diagnoses or reset Sanity. It blocks further losses while that episode
awaits its separate owner. Overshoot retains its numerical result and existing
issue.phase4.sanity_boundaries without clamp, cascade or diagnosis.

Derived evidence: tests/rules/sanity-loss-lifecycle.test.ts (29 regressions),
asserting numerical outcomes and applied-rule traces for every printed loss
branch, optional/rejected contexts, exact-zero/replay, separate heroes/events,
room-card handoff/resolution and negative-boundary uncertainty. Existing loss
rule IDs gain rendered-source verification; the table remains structured and
unchanged. The bounded Sanity procedure component is extracted; Conditions,
recovery, source-pointer reconciliation and independent review remain pending.
The mapped Conditions child is now a pending inventory entry, bringing the
lifecycle inventory to 85 headings. Next bounded unit: Conditions acquisition,
duplicate rerolls and reset, PDF55 / printed53 with existing table PDF57 /
printed55. Package F and comprehensive Phases 7–12 remain unfinished.

Sanity loss / exact-zero final gate (1 October): 412 canonical files validate;
2831 tests pass (two optional provider skips). Coverage generation, lint and
diff checks pass; the corrected typed test inputs also pass a focused rerun.
Stored procedures: 67. Coverage remains 709 mapped rows, 674 canonical sections
plus 35 redirects; 346/674 extracted, zero independently reviewed. Review
inventory remains 116 records, 108 unresolved/eight resolved. The 29 derived
regressions assert source loss amounts, rule traces, optional/event guards,
exact-zero handoff, replay, room-card resolution and preserved overshoot.
Next bounded unit: Conditions acquisition, duplicate rerolls and reset,
PDF55 / printed53 with existing table PDF57 / printed55. Package F and
comprehensive Phases 7–12 remain unfinished.

## Conditions acquisition and duplicate rerolls — 1 October

Rendered PDF55 / printed53 and PDF57 / printed55 were inspected directly.
`procedure.sanity_condition` reuses the complete structured Mental Conditions
Table, including printed 0 as supplied die 10. A distinct actual draw selects
one name once. Membership is supplied for that selected name; a duplicate
requests another distinct draw without changing the condition count or Sanity.
A new diagnosis increments the hero's count once, resets current and maximum
Sanity to eight minus the new count, and requests the existing condition effect.
The effect handoff does not execute the condition's later lifecycle.

The hero's pending exact-zero episode persists across rerolls and replays.
A later distinct exact-zero episode initializes fresh acquisition markers;
revisiting a pending episode through Sanity loss preserves its consumed draw.
Historical cured-diagnosis policy, exhausted diagnoses, negative Sanity and
nonpositive resets retain the existing review boundaries. No reroll cap,
clamping, diagnosis fallback or external Bestiary content is inferred.

The bounded Conditions procedure component is extracted; condition effect
lifecycles, reducing insanity and independent review remain pending. The
inventory still maps 85 headings. Next bounded unit: Mental Conditions effect
lifecycles, PDF57 / printed55, including its structured Lingering Trauma table.
The 29 derived regressions cover all ten dice, complete applied-rule traces,
duplicate and delayed membership, replay, distinct draws, reset boundaries and
composition with actual Sanity loss. Package F and Phases 7–12 remain unfinished.

Conditions acquisition final gate (1 October): 413 canonical files validate;
2860 tests pass (two optional provider skips). Coverage generation, lint and
`git diff --check` pass. Stored procedures: 68. Coverage remains 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory remains 116 records, 108 unresolved/eight resolved.
Next bounded unit: Mental Conditions effect lifecycles, PDF57 / printed55,
including the structured Lingering Trauma table. Package F and comprehensive
Phases 7–12 remain unfinished.

## Acute Stress current-quest lifecycle — 1 October

Rendered PDF57 / printed55, Mental Conditions Table row 2–3, confirms the
owned Resolve penalty, screaming/alerting during battles, additional +1 Threat
for each battle from diagnosis until quest end, and current-quest duration.
`procedure.acute_stress` applies the existing stable source rule once after an
actual accepted diagnosis. Its fields hold this condition contribution; they
never subtract from or restore total RES or overwrite other condition modifiers.
Each genuinely distinct later battle has its own hero/diagnosis/quest/battle
marker, so turns, hits and replay cannot add extra Threat. A later quest does
not inherit this effect.

The acquisition procedure now hands off to this lifecycle and initializes
fresh owned markers only on actual accepted Acute Stress acquisition. At an
actual source-reconciled quest endpoint, the effect contribution expires once;
unknown endpoint preserves the existing issue.0004 conflict. Objective
completion, dungeon exit or a return request alone cannot substitute for that
checkpoint. No universal quest-end definition is inferred.

`issue.sanity.acute_stress_diagnosis_expiry` records the missing diagnosis/count,
Sanity-maximum and historical-draw accounting at this printed effect expiry.
Expiry does not silently cure, decrement conditions or reset Sanity. The full
Mental Conditions procedure component is mapped, with only Acute Stress
reconciled; the remaining effect lifecycles and independent review are pending.
The starting inventory's duplicated Conditions row was removed and the two
existing PDF57 table nodes added: 86 unique headings now have dispositions.
Earlier 85-row inventory statements are historical row counts, not 85 unique
headings. Next bounded unit: Lingering Trauma selection, next-dungeon trigger
and exit expiry, PDF57 / printed55. Package F and Phases 7–12 remain unfinished.

Acute Stress final gate (1 October): 414 canonical files validate; 2883 tests
pass (two optional provider skips). Coverage generation, lint and
`git diff --check` pass. Stored procedures: 69. Coverage remains 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory is 117 records, 109 unresolved/eight resolved.
The 23 derived regressions check full applied-rule traces, actual diagnosis,
per-battle replay, distinct heroes/quests, owned expiry, endpoint ambiguity and
composition with diagnosis acquisition without repeated count/reset.
Next bounded unit: Lingering Trauma selection, next-dungeon trigger and exit
expiry, PDF57 / printed55. Package F and comprehensive Phases 7–12 are unfinished.

## Lingering Trauma selection and next-dungeon lifecycle — 1 October

Rendered PDF57 / printed55 was inspected directly: Mental Conditions row 4
and all six rows of the Lingering Trauma Table. `procedure.trauma_selection`
reuses the existing complete table and stable lookup rule for an actual supplied
1d6 roll, once per accepted diagnosis. A changed die on replay cannot replace
its persisted trigger. The separate `procedure.lingering_trauma` handoff
requests that selection once and does not invent a roll or apply penalties.
Acquisition initializes fresh owned state only for an actual new Trauma diagnosis.

An actual matching table situation or source-backed reminder must occur in
this hero's next dungeon after diagnosis. The procedure recomputes the event
match; a stale trigger flag, the diagnosis dungeon, another dungeon, an
unconfirmed event or another selected situation cannot activate it. The stable
activation rule applies only the owned -10 Resolve Test and -10 CS contributions
once. Those contributions remain active through other events and replays until
actual departure; the stable expiry rule clears only them once. Total RES/CS,
other condition contributions, diagnosis count and Sanity remain separate.
An untriggered next visit closes without a guessed penalty or cure.

`issue.sanity.trauma_scope` retains unspecified selection time, reminder scope,
later recurrence/rearming and diagnosis/Sanity accounting at departure. Unknown
next-dungeon identity or resemblance does not activate a penalty; unknown
departure identity does not clear an active effect. A later recurrence request
remains unresolved after the owned visit closes. Quest end, an objective,
a room change or a departure request alone cannot replace actual departure.

The six-row table selection procedure component is extracted. The full Mental
Conditions procedure component remains mapped because other effects are pending;
independent review is pending. Inventory remains 86 unique headings. Next bounded
unit: Jumpy actual Scenario-roll Threat accounting, PDF57 / printed55. Package F
and comprehensive Phases 7–12 remain unfinished.

Lingering Trauma final gate (1 October): 415 canonical files validate; 2917 tests
pass (two optional provider skips). Coverage generation, lint and
`git diff --check` pass. Stored procedures: 71. Coverage remains 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory is 118 records, 110 unresolved/eight resolved.
The 34 derived regressions check all six table selections, full selection/
activation/expiry rule traces, owned next-dungeon/event guards, replay, actual
and unresolved departure, no retroactive selection, recurrence boundary and
composition from accepted diagnosis without another count/Sanity reset.
Next bounded unit: Jumpy actual Scenario-roll Threat accounting, PDF57 /
printed55. Package F and comprehensive Phases 7–12 remain unfinished.

## Jumpy actual Scenario/noise lifecycle — 1 October

Rendered PDF57 / printed55, Mental Conditions row 7, confirms +2 Threat for
an actual Scenario roll of 10 and qualitative jump/scream/startle/alert behavior
for unsuspecting noises. Rendered PDF89 was also inspected; pages.yaml confirms
its misprinted folio is 88. Its ordinary Scenario result 9 or 0 requests a
Threat Level roll, with quest-specific threshold changes separately preserved.

`procedure.jumpy` consumes each actual supplied Scenario result once for this
active hero/diagnosis, including 1–9. Replacing a consumed result with 10 does
not add Threat; a genuinely new actual roll has a fresh owned marker. The stable
Jumpy rule adds the printed +2 only to an actual 10 in a resolved contribution
context. No ordinary Threat comparison/decrease, quest-max reaction, reroll,
spawn, action loss, morale loss or Sanity/count mutation is performed here.
A separate actual unsuspecting noise reports the printed behavior once without
an invented numerical Threat increase. Output reports are per-call and do not
reverse previous alerting on replay.

`issue.sanity.jumpy_threat_order` retains unspecified order with the ordinary
Threat roll, quest-maximum interaction and multiple-Jumpy-hero aggregation.
Unknown +2 context remains unconsumed with unchanged supplied Threat. The
ordinary Scenario procedure is an explicit separate dependency; composition
checks its handoff without choosing an order for actual Threat-roll resolution.
The acquisition handoff initializes this accepted diagnosis's active state and
fresh occurrence markers, and alone does not roll or increase Threat.

The condition wrappers also had a concrete ownership defect: a shared latest
acquired name or pending acquisition marker could suppress an earlier active
condition. Jumpy now uses its own actual active diagnosis state; Trauma has a
persisted accepted-diagnosis marker; Acute Stress uses the latest name only for
initialization and its owned state for later battles/expiry. A later diagnosis
or pending acquisition no longer cancels earlier effects. Tests compose an
actual later Jumpy acquisition with the retained earlier Trauma selection and
next-dungeon activation. This does not infer stacking across heroes or a cure.

The whole Mental Conditions procedure component remains mapped, with these
three condition lifecycles reconciled and remaining rows pending. Inventory
remains 86 unique headings and independent review remains pending. Next bounded
unit: Depression once-per-diagnosis Energy-pool reduction and floor boundary,
PDF57 / printed55. Package F and comprehensive Phases 7–12 remain unfinished.

Jumpy and condition-ownership final gate (1 October): 416 canonical files
validate; 2947 tests pass (two optional provider skips). Coverage generation,
lint and `git diff --check` pass. Stored procedures: 72. Coverage remains 709
mapped rows, 674 canonical sections plus 35 redirects; 346/674 extracted, zero
independently reviewed. Review inventory is 119 records, 111 unresolved/eight
resolved. The 29 Jumpy regressions check all ten results, full source-rule traces,
actual occurrence guards, non-10 replay, noise reports, unresolved +2 context,
separate ordinary Scenario handoff and actual diagnosis composition. Expanded
Acute Stress/Trauma ownership checks preserve earlier effects after a later
diagnosis or pending acquisition; the four focused suites pass 116 tests.
Next bounded unit: Depression once-per-diagnosis Energy-pool reduction and
floor boundary, PDF57 / printed55. Package F and Phases 7–12 remain unfinished.

## Depression actual onset-capacity reduction — 1 October

Rendered PDF57 / printed55, Mental Conditions row 0, was inspected directly.
It reduces the Energy pool by two; it does not say to subtract from currently
available Energy. Rendered PDF26 / printed24 confirms the ordinary starting
pool of one, unless otherwise stated, and separate recovery of lost Energy.
The existing floor review evidence for PDF26 is now visually verified.

`procedure.depression` accepts an actual owned active diagnosis, independent
of later diagnosis names or another pending acquisition episode. It captures
one actual supplied unmodified onset capacity and applies the stable -2 rule
once when the capacity is at least two and still matches that source-grounded
snapshot. Rest, spending, growth, replay and another condition cannot subtract
again. The acquisition handoff initializes fresh owned markers only on actual
accepted Depression and alone does not reduce capacity or current Energy.
Missing onset capacity requests actual input once; it never reinitializes a
hero to the ordinary starting value.

A below-two onset remains pending under issue.phase4.energy_floor, with no
clamp or negative-capacity guess. Its captured snapshot persists through later
capacity growth, which cannot silently convert that original diagnosis into a
new legal reduction. `issue.sanity.depression_capacity_context` retains delayed/
already-adjusted capacity, changes from the onset snapshot, available Energy
above reduced capacity and treatment-restoration accounting. A defined capacity
reduction is consumed even if remaining Energy exceeds it; current Energy is
preserved and the missing reconciliation is recorded. Current Energy can also
remain explicitly unsupplied without inventing it. Ordinary recovery remains
separate and uses the actual modified capacity supplied to its existing owner.
No blind capacity restoration or cure/Sanity/count mutation is performed here.

The 27 derived regressions cover defined and below-two capacities, full source
rule traces, replay/growth/rest, missing input, delayed context, owned diagnosis,
remaining-Energy bounds, separate recovery and actual diagnosis composition.
The full table procedure component remains mapped with other rows pending;
independent review is pending. Inventory remains 86 unique headings. Next bounded
unit: Fear of the Dark and Claustrophobia owned/contextual modifier checkpoints,
PDF57 / printed55. Package F and comprehensive Phases 7–12 remain unfinished.

Depression final gate (1 October): 417 canonical files validate; 2974 tests pass
(two optional provider skips). Coverage generation, lint and `git diff --check`
pass. Stored procedures: 73. Coverage remains 709 mapped rows, 674 canonical
sections plus 35 redirects; 346/674 extracted, zero independently reviewed.
Review inventory is 120 records, 112 unresolved/eight resolved. The 27 derived
regressions cover defined onset reduction with full applied-rule trace,
unchanged current Energy, replay/growth/rest, retained below-two snapshots,
missing/delayed capacity, available-Energy overflow, separate return recovery
and actual diagnosis handoff/composition without another Sanity/count reset.
Next bounded unit: Fear of the Dark and Claustrophobia owned/contextual modifier
checkpoints, PDF57 / printed55. Package F and Phases 7–12 remain unfinished.

## Fear of the Dark and Claustrophobia contextual modifiers — 1 October

Rendered PDF57 / printed55, Mental Conditions rows 5 and 9, was inspected
directly. `procedure.fear_of_the_dark` reuses the stable source rule for all
Resolve Tests at -10, with no added darkness-only restriction. It recomputes
only its owned contribution; repeated tests do not accumulate loss. Actual
condition removal or rule omission clears only that contribution. Another owner
cannot overwrite it, and a later diagnosis/pending acquisition does not disable
an earlier actual condition.

`procedure.claustrophobia` recomputes the full printed all-skills/stats -10
contribution in an actual supplied corridor, clearing only that contribution
outside corridors or when the actual condition/rule does not apply. A missing
location requests actual input once and tags the previous value unresolved,
rather than claiming a stale corridor penalty is current or guessing a room.
The legacy Claustrophobia and Encumbrance atoms share `skill_stat_modifier` in
separate rule contexts. The procedure therefore uses a dedicated
`claustrophobia_skill_stat_modifier`, setting the same directly cited source
value and retaining the existing rule as a provenance dependency. Its complete
applied trace is the procedure itself; it does not execute the legacy atom
against combined actor state. Existing rule IDs/fields/values are retained.

`issue.sanity.claustrophobia_stat_scope` records unspecified individual target,
pool/derived-stat and floor application for all skills and stats. The full
printed generic contribution is preserved; no roster is invented or actual
HP/Energy/Mana/total stats permanently reduced. Individual-scope requests with
unresolved context keep that question, while all individual mutations remain
separate from this checkpoint.

Rendered PDF42 / printed40 confirms The Well's asylum prohibition and five
fought-and-survived corridor battles for its own cure/Tunnel Fighter reward.
Composition reuses its existing quest-local rule and actual `claustrophobia`
flag; the generic procedure never counts battles, permits asylum treatment,
cures a disorder or grants a reward. Five supplied battles alone do not create
a global cure. This adapter check does not complete The Well's quest lifecycle.

The 25 derived regressions assert complete procedure/applied-rule traces,
light/dark, repeated tests, actual condition/room transitions, missing locations,
owned coexistence with other conditions and Encumbrance, individual-scope bounds,
quest-local cure composition and actual diagnosis handoffs without automatic
numeric application or another Sanity/count reset. Six Mental Conditions rows
now have bounded lifecycle procedures; Hate, Arachnophobia and Irrational Fear
remain pending, so the full table procedure component remains mapped. Inventory
remains 86 unique headings, and independent review is pending. Next bounded unit:
Arachnophobia and Irrational Fear encounter applicability/selection, PDF57 /
printed55. Package F and comprehensive Phases 7–12 remain unfinished.

Contextual mental modifiers final gate (1 October): 418 canonical files validate;
2999 tests pass (two optional provider skips). Coverage generation, lint and
`git diff --check` pass. Stored procedures: 75. Coverage remains 709 mapped rows,
674 canonical sections plus 35 redirects; 346/674 extracted, zero independently
reviewed. Review inventory is 121 records, 113 unresolved/eight resolved.
The 25 derived regressions cover complete traces, all-Resolve-Test scope,
owned fixed/contextual contributions, actual removal/room transitions,
unresolved location, other conditions/Encumbrance coexistence, individual-scope
bounds, The Well quest-local cure composition and actual diagnosis handoffs.
Next bounded unit: Arachnophobia and Irrational Fear encounter applicability/
selection, PDF57 / printed55. Package F and Phases 7–12 remain unfinished.

## Arachnophobia and Irrational Fear encounter checkpoints — 1 October

Rendered PDF57 / printed55 rows 6 and 8 support two bounded procedures.
Arachnophobia records a known actual spider encounter’s owned Terror contribution;
non-spider scope remains unresolved under the existing all-encounters issue.
Unknown taxonomy requests supplied classification once. Irrational Fear persists
one actual randomized result among the five printed factions per diagnosis, then
classifies each actual monster using supplied membership in that persisted faction.
The book supplies no randomization method or weights; no distribution is invented.

Dedicated contributions preserve natural Fear/Terror and other active conditions.
Classification and reaction-request markers have separate ownership. Replays cannot
change consumed classification or faction selection. Another monster in the same
reaction context does not create an extra test. Known raw contributions hand off
only with supplied source-grounded reaction scope; these procedures do not roll
tests, reduce Sanity, spend AP, cause flight, or mutate HP. Reaction timing, combined
causes, immunity and resolver scope remain explicitly unresolved. Both supporting
legacy atoms retain their IDs and semantics; dependencies cite them without
executing their shared global output fields.

Twenty-three derived regressions cover printed factions, invalid/missing selection,
unknown classification, actual input resumption, replay, inactive/wrong-owner
contexts, later diagnoses, same-context monsters and unchanged numerical state.
The acquisition helper binds both procedure IDs and initializes only the newly
accepted condition’s markers. The whole Mental conditions procedure component
remains mapped: Hate and its source-linked talent lifecycle remain pending.

Next bounded unit: Hate diagnosis selection and its source-linked talent effect.
Package F and Phases 7–12 remain unfinished; independent review remains pending.

Encounter condition final gate (1 October): 419 canonical files validate; 3022 tests pass, with two optional provider skips. Coverage regenerated at 709 rows/sections, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 77 procedures and 123 review records (115 unresolved, eight resolved). No commits made.

## Hate diagnosis and Talent checkpoints — 1 October

Rendered PDF57 / printed55 row 1 fixes the diagnosis target to the type of enemy
last fought and requires its presence in the Bestiary Monster List. Rendered
PDF178 / printed176 supplies the linked Hate Talent: +5 CS against hated enemies,
-5 parry/dodge when struck by them, one chosen enemy, the Goblin name-word
example, and repeat acquisition for different enemies. The diagnosis substitutes
its fixed last-fought target for ordinary Talent choice.

`procedure.hate` snapshots the actual onset type once, requests missing enemy or
Monster List evidence once, and grants the source Talent once only with supplied
eligibility and reconciled ownership. A later fight cannot replace the snapshot.
An empty/ineligible target or overlapping existing Talent remains unresolved;
no alternative, reroll, external creature list or duplicate stacking is invented.
The acquisition helper initializes the new diagnosis markers and hands off to
this procedure. Handoff itself applies no check modifier.

`procedure.hate_talent` records dedicated contributions for actual owned attack,
parry or dodge checks, preserving shared/base stats and other modifiers. Fixed
contributions recompute without accumulating on replay. Matching and check timing
are supplied; unknown input preserves the prior contribution with an unresolved
applicability tag and one input request. The Goblin example does not establish a
general taxonomy or name parser. The supporting stable rule IDs remain unchanged
and are provenance dependencies rather than execution into shared modifier slots.

Condition treatment does not automatically erase the granted Talent: the source
does not settle that relationship. `issue.sanity.hate_target_scope` records these
remaining boundaries. All nine distinct table conditions now have bounded
procedures, but this does not close whole-table lifecycle coverage or independent
review. Treatment and the surrounding Psychology lifecycle remain pending.

Next bounded source unit: Reducing Insanity and its settlement treatment links.
Package F and Phases 7–12 remain unfinished.

Hate final gate (1 October): 420 canonical files validate; 3051 tests pass with two optional provider skips. The 29 new derived regressions cover onset snapshot, pending input, source eligibility, duplicate grant protection, applicability, check contributions and unchanged shared/base state. Coverage regenerated at 709 section/coverage rows, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 79 procedures and 124 review records (116 unresolved, eight resolved). No commits made.

## Sanity recovery and paid indulgence — 1 October

Rendered PDF55 / printed53, Reducing Insanity, or Increasing Sanity, and PDF147 /
printed145, Tending to those Memories, support `procedure.sanity_recovery`.
Ordinary between-quest rest restores actual 1d3 up to 8 in the uncontested
ordinary-capacity/no-active-condition context. At least one actual inn night
restores 1d3 per hero; the number of nights is not a recovery multiplier.
An actual source-grounded indulgence costs actual 1d3 times 100 c and restores
actual 1d6, with payment and recovery applied together exactly once when
affordable and within the uncontested range. Dungeon Rest, HP/point recovery,
condition count and Asylum attempt accounting remain separate.

The hero/actual-completed-rest marker is shared between inn and between-quest
routes for the same occurrence. Overlap and per-night/per-stay frequency are
not silently resolved: actual eligible occasion scope is supplied, and unknown
scope requests input once. Paid occasions have a separate marker and unresolved
repetition scope. Neither requesting a service nor an interrupted/uncompleted
stay can create recovery. A missing roll requests actual input without guessing
a result. Fresh markers represent distinct source-grounded occasions, not route
switches or repeated requests.

Active conditions preserve `issue.phase4.sanity_maximum` without charging or
guessing a cap. Modified capacities, paid overflow and repetition/overlap
boundaries remain under `issue.sanity.recovery_scope`. Herbs, potions, prayers,
spells and Talents are qualitative source dependencies here, with no invented
unnamed value. The two recovery headings have extracted procedure components
within this scope; this does not extract the Asylum treatment lifecycle.

Thirty-nine derived regressions assert all dice ranges, full applied-rule traces,
ordinary cap boundaries, inn qualification, replay/route sharing, legal distinct
occasions, input resumption, interrupted/inapplicable contexts, affordability,
paid numerical atomicity, composition and unresolved branches. Source examples
and independent review remain separate later passes.

Next bounded unit: Treat Mental Conditions, including the owned disorder,
between-quest attempt limit, five-day completion, and effect-removal handoff.
Package F and Phases 7–12 remain unfinished.

Sanity recovery final gate (1 October): 421 canonical files validate; 3090 tests pass with two optional provider skips. Coverage regenerated at 709 section/coverage rows, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 80 procedures and 125 review records (117 unresolved, eight resolved). No commits made.

## Selected disorder and completed Asylum treatment — 1 October

Rendered PDF147 / printed145, Treat Mental Conditions, defines the 1000 c
attempt, one disorder per hero between quests, d6 success on 1–5 and five-day
duration. Existing settlement service/activity procedures own numerical payment,
activity completion, opportunity consumption and the successful count decrement.
`procedure.mental_condition_treatment` snapshots the supplied actual eligible
selected disorder and its active count before service, then consumes the actual
same-attempt completed accounting result once. Requests do not pay or cure.

Successful completed results synchronize the Sanity count to the service’s
already-reduced count, clear only the snapshotted disorder’s active flag, and
request its remaining effect cleanup. Rendered PDF57 / printed55 provides the
condition identities linked to those flags. Failures retain the disorder and
consume the result/opportunity without refund or a fresh roll. Target replay,
changed rolls, new days/visits and another hero cannot create another cure.
Incomplete five-day services, unsupplied results, unknown eligibility and
inconsistent counts do not change the disorder. Quest-specific curability
exceptions remain supplied scope; ordinary Asylum does not cure every trait.

`issue.sanity.mental_treatment_ownership` records roster/selection/accounting
reconciliation and unresolved history, capacity and source-specific effect
restoration. Cure does not erase diagnosis history, increase Sanity/maximum,
restore Depression capacity or remove a granted Hate Talent automatically.
The active flag’s removal is known; numerical/lasting-effect cleanup remains
pending and its handoff is not execution. Forty-two derived regressions
cover all successful/failing die faces, five-day boundary, ownership, missing
inputs, mismatched counts, all nine disorder flags, replay and actual composed
service accounting with full applied traces.

Next bounded unit: reconcile condition-effect cleanup and Psychology procedure
component dispositions, then continue quest acceptance/progression/completion.
Package F and Phases 7–12 remain unfinished; no independent review is implied.

Treatment selection, service and result input handoffs use independent once-only markers. The actual completed d6 result is snapshotted before delayed count reconciliation, so changed replay input cannot substitute a success for a captured failure. Derived regressions cover resumed selection/accounting handoff, missing-roll handoff after service, and failure-roll preservation.

Mental treatment final gate (1 October): 422 canonical files validate; 3132 tests pass with two optional provider skips. The 42 derived treatment regressions include actual composed settlement accounting and all disorder/result branches. Coverage regenerated at 709 section/coverage rows, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 81 procedures and 126 review records (118 unresolved, eight resolved). No commits made.

## Mental-condition cleanup source reconciliation — 1 October

Rendered PDF57/printed55 and PDF147/printed145 support the actual successful
cure’s owned current-contribution cleanup. `procedure.mental_condition_cleanup`
clears only Fear of the Dark, Claustrophobia, Arachnophobia, Irrational Fear or
Jumpy current contributions/reports after the actual snapshotted disorder flag
has been removed. Its marker prevents a replay from erasing a later contribution.
Past Threat/events, natural Fear/Terror, other modifiers, base stats, Sanity/count
and payment remain untouched. Treatment now binds this concrete cleanup handoff;
invocation itself still performs no callback.

The Hate Talent, Depression capacity and cure precedence over Acute Stress’s
current-quest duration or Trauma’s dungeon-departure duration have no settled
restoration rule. `issue.sanity.cure_lasting_effects` retains these explicit
dispositions without automatic deletion, numeric undo or invented precedence.
All nine table conditions and the full trigger table now have bounded procedure
evidence; the Mental conditions table procedure component is extracted, with
source ambiguities retained and no independent-review claim. Package F remains
open for quest and estate lifecycle and broader reconciliation.

Eighteen derived regressions cover every cleanup category, unresolved lasting
effects, cure/ownership guards, replay and preserved other state. Next bounded
unit: quest acceptance and its instance/party ownership checkpoints.

Condition cleanup final gate (1 October): 423 canonical files validate; 3150 tests pass with two optional provider skips. Coverage regenerated at 709 section/coverage rows, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 82 procedures and 127 review records (119 unresolved, eight resolved). No commits made.

## Quest acceptance and immutable occurrence ownership — 1 October

Rendered PDF132/printed130 and PDF133/printed131 support
`procedure.quest_acceptance`. Existing settlement arrival/selector procedures
own availability rolls, Luck prohibition, rejection limits and actual party
acceptance. This checkpoint records the supplied canonical chosen quest and
distinct actual occurrence identity, start settlement, main/side slot and
source-grounded fixed/random site once. Settlement keys follow the existing
catalogue/arrival inputs, including `outpost` for The Outpost restriction.

A side offer may accompany another quest in a separate occurrence record; an
accepted main record is not overwritten. Fresh status initialization applies
only to the actual new record, preserving previous instance completion/payment
and hero between-quest limits. Changed strings, another visit or replay cannot
replace the accepted provenance or reset its consumed statuses. Eligibility
includes supplied actual canonical identity existence and source-specific repeat
policy, rather than a universal repeatability rule. Ancient Lands offers are
guarded to The Outpost. Departure, progression, abandonment, completion and
rewards remain separately source-owned.

Missing actual choice/scope and site use independent handoff markers. Site
resolution requests the actual chosen fixed location or required roll/map
result; the settlement dice table is a separate provenance dependency rather
than a forced reroll for fixed-site quests. Empty instance site records no
acceptance-site prescription when none is required; no location is invented.
`issue.quest.acceptance_scope` retains unspecified generic eligibility/identity
and repeat scope. Twenty-two derived regressions cover accepted provenance,
replay, legal distinct records, side/main coexistence, Ancient Lands restriction,
missing-input resumption, fixed/no-site cases, invalid inputs and actual composed
settlement acceptance with full trace.

Next bounded unit: actual quest departure and quest-instance progression, then
source-specific completion/abandonment and reward gates. Package F and
Phases 7–12 remain unfinished; independent review remains pending.

Quest acceptance final gate (1 October): 424 canonical files validate; 3172 tests pass with two optional provider skips. The 22 acceptance regressions include actual composed settlement acceptance and guarded main/side provenance. Coverage regenerated at 709 section/coverage rows, 346/674 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 83 procedures and 128 review records (120 unresolved, eight resolved). No commits made.

## Actual quest departure and heading loopback — 1 October

Rendered PDF133/printed131 includes Leaving on a Quest: depart early in the
morning and perform no other settlement activities that day. The heading was
absent as a separate source-map node. Added stable
`section.settlements.leaving_on_a_quest` and its matching coverage row; the
procedure component is extracted, rule component mapped and independent review
pending. This is a source-map loopback, not an independently reviewed omission
closure. The lifecycle inventory now contains 87 unique headings.

`procedure.quest_departure` consumes only an actual matching accepted
party/occurrence/day departure from the existing settlement activity and lodging
accounting. It persists the departure day/settlement once, preserving immutable
accepted origin/site, completed/payment state, hero resources and between-quest
attempt limits. Requests hand off once without departing. Inconsistent recorded
days remain unresolved under `issue.quest.departure_scope`. Main and accompanying
side records can share the actual party departure without repeated accounting.
Departure does not imply quest-site arrival, objective success or completion.

Fifteen derived regressions cover matching result, replay, owned/accepted/status
guards, missing accounting/scope resumption, stale day, main/side coexistence,
unchanged accepted origin and composed actual settlement departure, including
rejection while occupied activities are incomplete. Next bounded unit: Slaying
the Fiend source-specific progression, defeat-gated aftermath and loot ownership,
followed by Closing the Portal. Generic abandonment remains source-bound rather
than invented. Package F and Phases 7–12 remain unfinished.

Quest departure final gate (1 October): 425 canonical files validate; 3187 tests pass with two optional provider skips. Coverage regenerated at 710 section/coverage rows, 346/675 canonical sections extracted and zero independently reviewed. The inventory has 87 unique headings after the rendered departure-heading loopback. Lint and whitespace checks pass. There are 84 procedures and 129 review records (121 unresolved, eight resolved). No commits made.

## Slaying the Fiend ordered occurrence — 1 October

Rendered PDF256/printed254 supports `procedure.slaying_fiend`. Its source-owned
setup preserves Random location, eight corridors/eight rooms, Beast encounters,
the Special Rules dash, Reward None and Molgor’s printed equipment/named
abilities. Initial Threat is actual d4+2, minimum equal to the actual start and
maximum20, initialized once without replay reseeding. Canonical actor/statistics
and structured source tables remain dependencies; unavailable ability mechanics
are not replaced with hero perk costs or invented Bestiary details.

At actual objective entry, snapshot the initial d6 wound-table selection before
a secondary result can be delayed. Apply only its valid branch once to initial
45 HP. Branch6’s fixed1 requires no additional die. A conflicting supplied amount
or out-of-branch result is unresolved rather than accepted; source wound/placement
requests alone cannot report readiness. Actual hero d3/Molgor d6 placement occurs
once, preserving door/idol/direction distinctions. Both preparations and resolved
initial Threat precede battle readiness, which is not an executed battle.

Actual supplied fiend-down outcome unlocks the gold find and two unlocked,
untrapped objective chests once. Request their actual Treasure Table outcomes
once; invocation does not collect contents, credit unspecified gold, mark a
generic quest complete or pay a promised settlement reward. Reward None remains
distinct from loot. `issue.quest.molgor_gold_quantity` and
`issue.quest.fiend_lifecycle_scope` retain source/dependency boundaries. Actual
battle HP/result, chest collection and unsupported generic abandonment/completion
remain separately owned. A fresh source-eligible occurrence has independent
markers; changing input on the existing occurrence cannot reseed them.

Thirty derived regressions cover all initial Threat faces, every legal prior
wound amount across all six branches, fixed1, selection resumption, invalid
amounts, placement boundaries, missing inputs, wrong quest/owner, replay and
composed defeat/aftermath trace with unchanged resources. Procedure component
extracted within this unit; independent review remains pending. Next bounded
unit: Closing the Portal ritual progression/interruption/spawn and distinct
closure, remaining-demon defeat, loot and outside-payment gates. Package F and
Phases 7–12 remain unfinished.

Slaying the Fiend uses distinct supplied d6/secondary-result inputs and owned working values for legacy rule execution. The fixed1 branch sets owned resolved state without changing the supplied-input flag. The canonical validator verifies these field roles; input preservation is asserted in the fixed-row regression.

Slaying the Fiend lifecycle final gate (1 October): 426 canonical files validate; 3217 tests pass with two optional provider skips. The 30 derived lifecycle regressions cover initial Threat, every wound branch/result, placement, replay/input resumption, scope and defeat-gated aftermath. Coverage regenerated at 710 section/coverage rows, 346/675 canonical sections extracted and zero independently reviewed. Lint and whitespace checks pass. There are 85 procedures and 130 review records (122 unresolved, eight resolved). No commits made.

Closing the Portal bounded reading checkpoint (1 October): `procedure.closing_portal_reading_attempt` cites visually inspected PDF257/printed255. It snapshots initial actual d6+1 duration once for an owned reader/quest occurrence, requires supplied eligibility and stationary objective-room presence, and resets progress/stops reading on every printed interruption or movement. Replay cannot restart or reseed an attempt. The existing ritual-boundaries issue retains undefined eligibility and restart dice policy. Procedure coverage remains mapped: actual restart, turn progression/closure, spawning, initial groups/Threat, defeat/chests and outside reward remain next units. No independent review; Package F and Phases 7–12 remain unfinished.

Closing the Portal reading progression (1 October): the same `procedure.closing_portal_reading_attempt` now handles actual new start-over events with supplied 2..7 duration context, preserving unresolved retain/reroll policy. It counts actual completed chronological reading turns once, consumes interrupted completed turns without progress, checks all interruptions before advancement and closes only at the required uninterrupted duration. Closure stops reading and requires killing all remaining demons; it does not spawn, collect or pay. Fifty source-derived regressions include every duration, completion-turn interruption, actual restart, chronological/replay guards, unresolved context and applied source-rule traces. Visually inspected PDF257/printed255. Procedure coverage stays mapped pending initial Threat/groups, encounter replacement, spawning and aftermath/payment. No independent review; Package F and Phases 7–12 remain unfinished.

Closing the Portal preparation and groups (1 October): `procedure.closing_portal_preparation` and `procedure.closing_portal_demon_group` cite visually inspected PDF257/printed255. Quest setup preserves Silver City,8+8 tiles, supplied ritual scroll and advertised300c without crediting coins. Initial actual d6 Threat initializes once, minimum=start and maximum20. Actual objective entry preserves portal/hero geometry and separately requests two initial groups plus actual random placement once. The group procedure accepts actual first/second initial ownership or a multiple10 replacement encounter, snapshots type before delayed quantity, and checks d6/d3 bounds before selected source-rule execution. Each actual group owns separate state; later one-demon spawns cannot use group quantities. Source statistics/Cursed Weapons, actual coordinate placement and battle remain explicit dependencies. Reading lifecycle stays separate. Procedure coverage remains mapped pending schedule-supplied single spawns and distinct final-demon/treasure/outside-payment gates. No independent review; Package F and Phases 7–12 remain unfinished.

Closing the Portal spawning and aftermath (1 October): visually inspected PDF257/printed255 and PDF258/printed256. `procedure.closing_portal_single_spawn` requires actual supplied every-other-turn schedule and event ordering, consumes each chronological emergence once, resolves type-only d6 and ignores group quantities. Pending already-emerged type may resolve after closure without another spawn; later events cannot overwrite pending earlier ones. `procedure.closing_portal_aftermath` separately gates two unlocked/untrapped objective-chest handoffs on actual closure and final-demon death, and credits300c once to each actual owned hero back outside. Twenty-seven derived regressions cover all six types, pending resolution/replay/closed/unknown order, final-demon/loot/payment guards, independent hero and party markers, and composed reading-closure/treasure/reward trace. Together with preparation/groups and reading, this source-local lifecycle component is extracted within supplied-context boundaries. Remaining source dispositions: first spawn phase, same-turn order, restart duration/eligibility, actual random coordinates and unavailable statistics/Cursed Weapons/battle, actual chest content/collection, missing/dead/replacement hero entitlement and unspecified generic completion/abandonment. The latter aftermath boundary is recorded in `issue.quest.portal_aftermath_scope`; existing ritual ambiguity remains unresolved. No independent review; Package F and Phases 7–12 remain unfinished. Next quest lifecycle source unit: Returning the Relic (PDF255).

Returning the Relic lifecycle (1 October): `procedure.returning_relic` cites visually inspected PDF255/printed253. It preserves Random/8+8 setup, actual initial d4+1 Threat/minimum=start/max20 once, quest-owned Luck nullification until actual stone return without changing numeric Luck, and actual distinct Scenario8–10 handoffs. Actual objective entry records short-side heroes/far-end statue and requests two encounters/random placement once. Refit requires all enemies dead, actual hero in front, actual distinct turn and supplied unresolved party/hero opportunity scope. Pending actual DEX result cannot be replaced by a later turn or mismatched owner; success returns stone and ends only its nullification, failure consumes opportunity and raises Threat1 once below20. At maximum20 raw+1 remains pending source accounting. Actual home arrival after return credits300c once per actual owned hero. Thirty-two derived regressions cover setup faces, all Scenario faces, objective handoff, failed/successful/pending/replayed/mismatched attempts, maximum boundary, unchanged Luck/other curses and independent home payments. `issue.quest.relic_lifecycle_scope` preserves scope, maximum, failed/abandoned-quest curse expiry, generic completion and hero-entitlement ambiguities. No source-local chests/XP invented; no independent review. Lifecycle component extracted within those bounded source/supplied-context dispositions; Package F and Phases 7–12 remain unfinished. Next source unit: Retrieving the Family Heirloom, PDF259–260.

Retrieving the Family Heirloom lifecycle (3 October): `procedure.family_heirloom` cites visually inspected PDF259/printed257 and PDF260/printed258. It preserves settlement/8+8/R1B-8B/Undead setup, quest-local dead-Brotherhood corpse-search exception and once-only actual d4+1 Threat/minimum=start/max18. Each actual Scenario8–10 event hands off Threat resolution once. Actual objective entry initializes six tombs/no enemies/current positions and the shuffled3Black/1Red/2Dressed pool once. Each actual unopened tomb requires exactly2heroes and a complete turn, followed by one actual unused card. Pending draws block a second opening; supplied classification resolves category once, consumes that actual card and decrements its printed category count atomically. Black records corpse/nothing else, Red retrieves sword, and Dressed places mummy next to tomb and hands off combat without invented statistics or outcome. A later tomb clears only current draw reports, preserving existing mummy/combat state. Actual surface return plus sword presentation transfers sword and credits300c once per actual owned hero. Thirty-nine derived regressions cover all Threat/Scenario faces, work guards, all categories, all six Red positions in a finite pool, pending/unclassified/mismatched draws, duplicate-card/tomb replay, category exhaustion, current-versus-past reports and independent surface payments. Existing card-category ambiguity remains unresolved; `issue.quest.heirloom_lifecycle_scope` records missing combat/escape/entitlement/completion/abandonment boundaries. Canonical YAML uses simple source anchors and explicit branch guards under unchanged parser protections; no numeric mummy content, extra chests or XP invented. Procedure component extracted within this bounded source/supplied-context scope; independent review, Package F and comprehensive Phases7–12 remain unfinished. Next quest lifecycle source unit: Stopping the Necromancer, PDF261/printed259.
