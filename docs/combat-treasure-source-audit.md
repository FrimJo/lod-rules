# Combat and treasure source audit — 28 September 2026

This is a source reconciliation and regression checkpoint, not independent review.
The canonical PDF was read and its pages rendered with Poppler. Printed labels below
were checked against `corpus/source-map/pages.yaml`. No external card or Bestiary
contents were inferred. Existing extraction IDs are retained.

## Evidence ledger

| PDF / printed pages      | Inspected material and comparison                                                                                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 109–112 / 107–110        | Combat actions, eligibility, charge, Power Attack, shove, fumble and doorway rules; compared preparation/attack/shove and existing core rules. Geometry remains supplied.                                                           |
| 113 / 111                | Ranged LOS illustration, intervening models, cumulative cover, large/flying exceptions and doorways; compared preparation and incidental-target handoffs.                                                                           |
| 114 / 112                | Rendered combat-turn flowchart, including token removal and remaining hero actions; compared activation and battle records.                                                                                                         |
| 115–116 / 113–114        | Both modifier matrices and attack flowchart. Power Attack last-action/last-turn wording remains an explicit source conflict.                                                                                                        |
| 117 / 115                | Thrown-potion scatter illustration, obstacle/door modifiers and large-target area damage; compared thrown-preparation branches.                                                                                                     |
| 118–119 / 116–117        | Enemy activation, door exceptions and two humanoid behaviour tables; retain example scope and the printed `1d610` mismatch.                                                                                                         |
| 120 / 118                | Defence limits, weapon and shield branches, and Berthram example. Shield threshold equality remains unresolved; spillover is supplied to damage once at the arm.                                                                    |
| 121–122 / 119–120        | Hit-location matrix, damage, Quick Slots, disease, poison, bleeding rescue and optional timer. Corrected disease penalty eligibility and recovery state clearing. Negative non-poison HP and durability overlaps remain unresolved. |
| 124 / 122                | Variya example: charge target 50, damage 4, second-target threshold 20; compared existing source-example fixtures.                                                                                                                  |
| 108 / 106                | T1–T5/Part/no-loot caller selection, furniture adjacency and illustrated Alchemist tools card; no unseen cards extracted.                                                                                                           |
| 193–195 / 191–193        | Room/corridor selectors and complete furniture matrices, nested rolls and water rewards. Compared source-cell fixtures and canonical tables; corridor overflow remains unresolved.                                                  |
| 196 / 194                | T1–T5 geometry and all relic rows/restrictions; compared source-cell fixtures and entity links.                                                                                                                                     |
| 197–198 / 195–196        | Potion, ingredient and part matrices, merged headers, blanks and superscripts. Standard Potion selector disagreement and missing part footnote remain explicit.                                                                     |
| 199–202 / 197–200        | Powerstones, magic powers, curses and three-column legendary selector. Checked first-turn versus unspecified initiative duration, curse rerolls, all selector blanks and name mismatches.                                           |
| 203–206 / 201–204        | Legendary general restrictions and Horn through Priestly Dice. Preserve Vial destruction exception/conflict, Ring of Awareness repeat-find/cap and distinct selector names.                                                         |
| 207–210 / 205–208        | Legendary Elixir through Golden Khopesh. Preserve dice, reset timing, targets, damage caps, equipment identities and selector spelling mismatch.                                                                                    |
| 211–213 / 209–211        | Regeneration through Necklace of Deflection; checked projectile matrix and Armour of the Father's absence from the selector.                                                                                                        |
| 214–215 / mapped 212–213 | Full-page artwork, no printed folios or additional mechanics.                                                                                                                                                                       |

## Regression evidence

Existing combat and treasure tests retain table-cell matrices, selector endpoints,
caller bindings, unresolved choices and missing-input checks. Added source-derived
regressions in `tests/rules/combat-procedures.test.ts` and
`tests/rules/treasures.test.ts` cover:

- Berthram's 8 damage minus 6 shield DEF, then 2 arm armour, with one HP application.
- Disease losses after battle only for an infected hero; odd CON/STR subtract losses
  rounded down, and successful recovery clears infection.
- Zero-HP supplied healing does not wake a hero or repeat permanent injury.
- Fountain 1d4+1 HP / one Energy versus Water Basin 1d6+1 HP / all Energy,
  and successful/failed Alchemical checks on tainted results.

Handoffs remain explicit: invocation records a dependency; a fixture supplies its
result to the next procedure. This audit does not certify a gameplay runtime or
promote any section to independently reviewed.

## Checkpoint gate

On 28 September 2026: 231 canonical files validated; 1,417 tests passed with two
optional provider integrations skipped; coverage regenerated (695 rows / 695 IDs),
lint and `git diff --check` passed. The full suite used two workers. The sandbox
blocks tsx's IPC socket, so validation and coverage ran the same entry points via
`node --import tsx`; the full test suite ran with the approved sandbox escalation.
