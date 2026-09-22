# Phase 6 — Procedures and state machines

## Status and boundaries

Phase 6 has started; it is not complete. This document records the approved batch order, the
units extracted so far, and what remains deferred. Extraction does not imply independent
review. Phase 5 catalogue work (equipment and magic items onward) remains pending in its own
ledger and is not a prerequisite for these units: procedures bind to mapped sections, and
dependency targets that do not exist yet are recorded as `unresolved_references` or open
issues instead of being invented.

## Batch plan

| Batch | Scope                                                                              | Status    |
| ----- | ---------------------------------------------------------------------------------- | --------- |
| 1     | Dungeon loop: threat, door/chest, rest, searching                                  | Extracted |
| 2     | Locked doors (force/crowbar/pick), wandering-monster movement, trap resolution     | Pending   |
| 3     | Initiative/activation procedure, encounters, initial setup, dungeon generation     | Pending   |
| 4     | Combat procedures: attack resolution, damage, bleeding out                         | Pending   |
| 5     | Travel, settlement visit, buying/selling, repair, identifying                      | Pending   |
| 6     | Character creation, levelling, learning spells/prayers, training, guild activities | Pending   |
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

- PDF 89 (printed 88, folio misprint noted in `pages.yaml`) and PDF 91 (printed 89):
  `procedure.scenario_die` and `procedure.threat_roll`, including the natural-20 reduction,
  the in-battle/not-in-battle branch, and the table-driven decrease. The threat tables are
  invoked as section-bound dependencies, not extracted as table objects. The worked example
  (threat 9, roll 7, row 16, level down to 3) is a `source_example` fixture. The failed-roll
  case has no general rule text; the example sentence alone is recorded under
  `issue.phase6.failed_threat_roll_increase` and the procedure surfaces it as an unresolved
  effect.
- PDF 101 (printed 99): `procedure.open_door_or_chest` — the printed four-step sequence with
  the trapped branch. Deferred for this heading: locked-door handling (force, crowbar, pick
  lock) and trap-card resolution. Open issues:
  `issue.phase6.door_open_threat_source` (step-1 increase versus the "instant a door is
  opened" list entry), `issue.phase6.trap_resolution_deferred`,
  `issue.phase6.trap_headings_unmapped` (trap headings have no structural nodes),
  `issue.phase6.furniture_treasure_table_location`.
- PDF 100 (printed 98): `procedure.rest` — the printed eleven-point checklist with the
  ambush-risk computation `(5 + Threat level)%, +10% per rest after the first, max 70%`, the
  three wandering-monster moves, and the interruption branch that hands off to
  `state_machine.battle`. Rest-regain quantities stay with the Phase 4 recovery rules; the
  procedure does not restate them. Boundary: interruption halting is not executable in the
  test interpreter (a guard records an unsatisfied `require`; later checklist steps still run),
  so fixtures cover the completed-rest and ambush-at-end paths only.
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

## Verification

Baseline: 177 canonical files validate; 746 tests pass (Phase 5 Batch 3 gate).
Phase 6 Batch 1 gate: 183 canonical files validate; 781 tests pass; lint passes. New tests:
`tests/schema/phase-six.test.ts` (state-machine schema/integrity negatives, fixture coverage)
and `tests/examples/dungeon/phase-six.yaml` (12 fixtures, including the printed threat-roll
example replayed on its printed values).
Each further batch records its source pages, object IDs, tests and remaining boundaries here.
Run validate, tests and lint after every unit; regenerate coverage when its inputs change.
Do not promote parent section coverage for deferred procedures or unextracted rules.
