# Settlement catalogue reconciliation

This work completes omissions in the existing Phase 5 Batch 6 extraction. It does
not mark material independently reviewed or close the batch prematurely.

## Evidence recorded on 28 September 2026

| PDF / printed     | Source evidence and changes                                                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 132 / 130         | Rendered both selector tables. Added all eleven event thresholds, including Birnheim and Durburim; retained the nine quest dice and printed colour `Turqois`. Corrected the quest table's section binding.                                                                                  |
| 133 / 131         | Rendered quest availability and all 35 schedule cells. Added the missing schedule and recorded its two-day prayer example versus the one-point activity entry.                                                                                                                              |
| 134 / 132         | Rendered and checked all 87 activity cells, zero-point overnight restrictions, scroll/enchantment caps and multi-day costs. Corrected the activity table's section binding.                                                                                                                 |
| 135 / 133         | Rendered all twelve events. Replaced abbreviated outcomes with source wording. Outer trinket result is 4; nested ranges 1–5 and 5–11 overlap. Added the nested selector and an unresolved issue. Preserved feast recovery limits, no-bed exception, bandit battle setup and curse duration. |
| 136–139 / 134–137 | Rendered all eleven profiles. Checked service lists, prices, availability modifiers, party lodging rates, Dwarven durability and Outpost restrictions. Added row-level provenance to the profile table; retained missing Companions’ Compendium contents as unavailable.                    |

Regression evidence is in `tests/tables/phase-five-settlement-catalogues.test.ts`.
It includes complete activity, schedule, quest-availability and event-threshold
matrices and nested-selector checks. The source map now binds each of those tables
to the correct existing section. No stable object IDs were renamed.

Additional rendered units:

- PDF 140 (mapped printed 138): illustrated Silver City map, no numerical table.
- PDF 141–143 / printed 139–141: all arena modifiers, odds, awards and bank cells
  checked with complete matrix regressions. Printed `5 % loss` retained.
- PDF 144–147 / printed 142–145: service prose and all fortune, gambling and racing
  tables inspected. Restored gambling `<=1`, full fortune/gambling outcomes and
  complete racing matrix tests. Buying and Selling begins on PDF 144, identification
  is on 146 and repair on 147; existing procedure citations still need correction.
- PDF 148–151 / printed 146–149: Dark Guild armour and tools, trap prose and the
  four-pair bounty table inspected. Corrected cap/bracer special cells, added the
  omitted tools matrix and full source-derived regressions for its cells and all 99
  bounty outcomes. Trap-rule extraction and equipment entity links remain pending.

- PDF 152–155 / printed 150–153: Fighters equipment, wizard staves and alchemy
  matrices inspected. Restored the blank Poleyns durability cell, full staff effects,
  superscript markers and the False Prophet footnote. Registered that unavailable
  expansion in the manifest and section references. PDF 155 is setting fiction.
- PDF 156–159 / printed 154–157: added the omitted trophy-sale matrix; restored
  full Ranger and Sanctum equipment text, the printed Health heading and Incense
  quick-slot requirement. Checked all crusade outcomes. Added the missing source-map
  node for the distinct Ranger equipment table on PDF 157 without renaming existing IDs.
- PDF 160–163 / printed 158–161: checked estate purchase/lodging, all furnishings
  and ghost effects. Restored delayed furnishing use, between-quest Garden timing,
  all-rations-as-one-item selection and ghost departure restrictions.

## Package A completion — 29 September 2026

Package A adds 154 rules, 48 equipment/furnishing entities and three Ranger talents;
existing alchemy parts and ingredients are reused. Reciprocal row links bind all guild
equipment, furnishings and alchemy availability rows. Complete source-cell fixtures now
cover staff effects, fortune outcomes, furnishings and profiles. Six false table splits
retain compatibility redirects, and racing table parents are corrected with stable IDs.

The [completion inventory](package-a-completion-inventory.md) records each source heading,
canonical evidence and remaining source boundaries. Catalogue rules expose parameters;
Packages B/C still own actual travel and settlement accounting. Guild activities, quest
catalogues and estate lifecycle remain the scheduled later batches. No independent review
is claimed.

## Historical integration gate

28 September 2026: validation passed for 231 canonical files; the full suite passed
1,441 tests with two optional provider integrations skipped. Coverage regenerated
from YAML with 696 rows for 696 section IDs (667 canonical sections and 29 redirects),
277 extracted sections and zero independently reviewed sections. Lint and
`git diff --check` passed. These results validate the current corrections; they do
not close the outstanding catalogue rules or procedure accounting work.

## Package A gate

29 September 2026: 241 canonical files validate; 1,451 tests pass and two optional
provider integrations are skipped. Coverage regenerated for 696 section IDs: 661
canonical sections and 35 compatibility redirects, with 277 sections extracted and
zero reviewed. Lint and `git diff --check` pass. The full suite ran with two workers;
the existing tsx CLI integration required its local IPC socket outside the sandbox.
