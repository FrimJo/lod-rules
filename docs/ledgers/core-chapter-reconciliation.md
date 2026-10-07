# Core-chapter reconciliation (Step 2)

This ledger records the Step 2 core-chapter loop described in the
[completion plan](../corpus-completion-plan.md#step-2--core-chapter-loop-reconcile-extract-review):
reconcile every section and component against the PDF, extract what is missing, and classify
worked examples. It is the extractor's record, not review evidence. Sections reach `extracted`
here; only an independent review record under `review/independent/` can make them `reviewed`.

The authoritative source is [Rulebook-2nd-printing-ENGa.pdf](../../source/Rulebook-2nd-printing-ENGa.pdf).
Printed/PDF pairs come from [pages.yaml](../../corpus/source-map/pages.yaml).

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

