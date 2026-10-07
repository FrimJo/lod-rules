# Phase 3 schema pilot

This is the historical Phase 3 snapshot. Phases 0–3 are complete; current core-mechanics
coverage and additive tooling changes are documented in [Phase 4](phase-4-core-mechanics.md).
The counts and exclusions below describe the pilot, not the current corpus.

The bounded pilot is extracted and tested, not independently reviewed. It contains 26 atomic
rules, eight entities (two professions and six talents), five tables (three complete and two
partial), two procedures, and 74 executable YAML fixtures. One fixture transcribes a book
example; the others are explicitly labeled derived cases. No Phase 4 extraction is included.

The source is `source/Rulebook-2nd-printing-ENGa.pdf`. Page labels below come from the
canonical page map. The rendered pages were inspected, including all selected table rows.
The original pilot preserved glossary entries, aliases, and existing IDs. The subsequent
issue-resolution pass preserves those IDs and original concerns while adding cited
resolutions, compatibility redirects, and one missing dependency heading.

## Extraction audit

| Source section ID                                                               | Printed / PDF | Canonical objects                                                                                                                                                                                                            | Coverage boundary                                                                            |
| ------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `section.introduction.dice_rolling_and_skill_checks`                            | 16 / 18       | `core.check.automatic_failure`, `core.check.modifier`                                                                                                                                                                        | Rules extracted; modifier wording stays unresolved                                           |
| `section.game_basics.skill_and_stat_checks` and its `success_and_failure` child | 18 / 20       | `core.check.standard`, `core.check.success`, `core.check.failure_instruction`                                                                                                                                                | Check rules and the “RES or…” failure instruction; parent remains partial                    |
| `section.game_basics.skill_and_stat_checks.perfect_result`                      | 19 / 21       | `core.check.perfect_result`, `core.check.perfect_rewards`, `core.check.perfect_quota_uncertain`, `core.check.perfect_success_uncertain`                                                                                      | All printed reward choices and limits; unresolved interactions retained                      |
| `section.game_basics.turn_sequence`                                             | 18 / 20       | `procedure.dungeon_turn`                                                                                                                                                                                                     | All five steps and both nested conditional steps                                             |
| `section.levelling_up` and its `table` child                                    | 58 / 60       | `character.level.experience`, `character.level.eligibility`, `table.character.level_progression`                                                                                                                             | Opening context and complete ten-row, five-column progression table; chapter remains partial |
| `section.levelling_up.stats_and_skills_maximum`                                 | 58 / 60       | `character.skill.natural_maximum`, `character.skill.conditional_value`, `test.skill.book_effective_value`                                                                                                                    | Skill-value paragraphs and worked example only; racial stat maxima/table remain unextracted  |
| `section.creating_your_character.alchemist` and its `table_skills` child        | 32 / 34       | `profession.alchemist`, `character.profession.alchemist.equipment_limits`, `table.character.alchemist_skills`                                                                                                                | Complete profession entry and paired Skill/Mod columns                                       |
| `section.creating_your_character.thief` and its `table_skills` child            | 36 / 38       | `profession.thief`, `character.profession.thief.equipment_limits`, `character.profession.thief.treasure_choice`, `character.profession.thief.higher_tier`, `procedure.thief_treasure_choice`, `table.character.thief_skills` | Complete entry, card-choice procedure/exception, and paired Skill/Mod columns                |
| `section.appendix_ii_talents.physical_talents` and its first `table` child      | 170 / 172     | `table.talent.physical_pilot`; talents and rules below                                                                                                                                                                       | Five selected rows only; both table and section remain partial                               |
| `section.appendix_ii_talents.combat_talents` and its first `table` child        | 171 / 173     | `table.talent.combat_pilot`, `talent.axeman`, `character.talent.axeman.bloodlust`                                                                                                                                            | Axeman only; table and section remain partial                                                |

Selected physical talents preserve their complete descriptions and all mechanics:

| Entity                        | Referenced rule IDs                                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `talent.fast`                 | `character.talent.fast.movement`                                                                                                  |
| `talent.resistance_to_poison` | `character.talent.resistance_to_poison.constitution_test`                                                                         |
| `talent.night_vision`         | `character.talent.night_vision.darkness`, `character.talent.night_vision.perception`, `character.talent.night_vision.eligibility` |
| `talent.tank`                 | `character.talent.tank.clunky`                                                                                                    |
| `talent.perfect_hearing`      | `character.talent.perfect_hearing.initiative`, `character.talent.perfect_hearing.eligibility`                                     |

## Representation decisions

Rules, entities, tables, procedures, and test cases are arrays of records in their matching
canonical directories. The strict schemas reject unknown fields and arbitrary executable
expressions. Shared mechanics support literal/field/sum operands, typed comparisons and
Boolean conditions, explicit effects, choices, ranges, dice, and usage windows. The vocabulary
is deliberately limited to this pilot.

Rule-local field names are declared input, state, or output symbols, not corpus IDs. Values
such as `constitution`, `axe`, and `skill` identify a supplied test context; they do not invent
new glossary or equipment objects. `term_refs` connects existing glossary IDs without treating
Battle and Combat as interchangeable. Inputs are supplied at the rule boundary: for example,
`natural_skill` already includes unconditional talent bonuses, while temporary and conditional
bonuses are separate operands. This does not define a whole character-sheet evaluator.

Percentile results use integers 1–100; the book's printed `00` is represented as 100. Success
uses the supplied effective value. The explicit automatic-failure rule overrides the normal
success/failure rules. The modifier passage has two typed alternatives and an unresolved
result; neither alternative is chosen by default. The separate, explicit worked example on
printed 58 supports adding its stated bonuses without resolving that wording globally.

Perfect Result classification is separate from success. Reward choices retain lost-energy
eligibility, Skill versus basic-stat eligibility, permanent increases, and separate printed
usage limits between settlement visits. A stat reward does not increase a skill. Test inputs
carry already-used allowance flags; they do not implement settlement or quest lifecycle
resets. Cross-attribute allowance questions remain unresolved. `quota_scope_uncertain` is
supplied review context, not a printed game flag, and gates only skill/basic-stat choices.
The energy option can restore one lost energy regardless of that uncertainty or previously
used advancement allowances. The natural skill cap is a
separate constraint; the pilot is not a general interaction/precedence engine.

Entities reference mechanics and tables rather than duplicate numeric skill adjustments.
Profession grants keep their printed references. Resistance to Poison links to the extracted
talent; Evaluate and Heroic Force of Will remain named, section-linked dependencies. Equipment
names and quantities do not imply that their item records have been extracted. Alchemist's
standard-level potions, Weak Potion recipe, random ingredients, and freely chosen parts remain
distinct selections.

Every table retains printed columns and cells alongside typed values. `1` as initial Energy
is distinct from `+1` as an increase. `N/A`, `±0`, and dashes retain their printed form and
meaning. Rows inherit document/page/table provenance from their parent and add `source_row`;
cell column IDs identify the column. The two talent tables explicitly list only selected rows.
No omitted rows are claimed extracted, and source typos such as Perfect Hearing's repeated
“and” remain in the text.

Procedure steps inherit the enclosing source heading/page unless they supply their own source
references. Array order is execution order, including nested steps. Local entry/exit IDs and
rule references are checked. Thief's procedure invokes its two atomic rules; the higher-tier
exception suppresses the two-card choice. Supplied choices must be among the two drawn cards.
The general treasure/deck system is not implemented.

The dungeon turn calls named dependencies for Scenario/Threat, lights, initiative, Wandering
Monsters, and psychology. These calls demonstrate order and conditional inclusion, not the
execution of those unextracted mechanics. A future dungeon lifecycle can invoke this procedure;
no standalone state machine was justified by this passage's ordering alone. The procedure
links to The Turn and the newly mapped Wandering Monsters heading (printed 90 / PDF 92).
`battle_won` remains caller-supplied; issue.0001 records unresolved non-kill endpoints.
Link repairs do not extract dependency mechanics.

## Validation and executable evidence

`validateCorpus(): ValidationResult` and the existing commands are preserved. New collections
are discovered recursively and deterministically, then aggregated across files before checking
IDs and references. Fixture YAML under `tests/examples/` is validated with the corpus. Public
validators remain under `scripts/validate/`; the interpreter exists only under `tests/support/`.

The checks cover schema structure, source/file/page agreement, duplicate global IDs, typed
references, declared operands, nested provenance, table cells, local step references, override
cycles, and fixture contracts. Glossary alias rules still apply independently. The optional
`entities` coverage component is set only where audited. An absent component contributes to
remaining/unassessed coverage, never a completion claim. Coverage remains one row per section.

Fixtures read the actual YAML. They verify check/range boundaries, reward choices and rejection,
permanent changes, the source example's value of 110, profession limits, both treasure paths,
all six talents, and all eight dungeon condition combinations. Results expose contributing
rule/procedure IDs. Unsupported operations and invalid supplied inputs fail explicitly;
unresolved rules produce issue IDs without committing speculative effects. Dependency effects
such as ignoring Clunky or replacing Bloodlust's range are inspected structurally rather than
simulating the missing target mechanic.

Independent expected matrices check every progression/profession cell. Round-trip tests preserve
all table information. Negative fixtures check malformed schemas, dice, references, local symbols,
source locations, cells, ranges, and aggregation across multiple files. Derived cases are not
misrepresented as book examples or used to promote example coverage elsewhere.

## Review handoff and remaining limits

All pilot objects remain `extracted`, not `reviewed`. Confidence describes extraction fidelity;
it does not settle an ambiguity. All eleven issue IDs remain, with six evidence-backed
resolutions (0002, 0003, 0005, 0007, 0008, 0011). Five questions remain unresolved:

- `issue.0001`: battle endpoints when enemies are not all killed; End of Battle corroborates only the killed-enemies case.
- `issue.0004`: quest endpoints when reward collection and returning to a city do not coincide; Collect Your Reward narrows but does not eliminate the gap.
- `issue.0006`: the general modifier passage names both the roll and skill level; the explicit worked example does not correct that passage globally.
- `issue.0009`: whether a Perfect Result overrides failure when the roll exceeds the checked value.
- `issue.0010`: how skill/stat allowances aggregate across attributes and together; energy recovery is independent of these allowances.

Each resolved issue retains its original concern and adds a resolution summary and source
evidence. Historical issue links remain valid; executable unresolved results and allowance
aggregation references must point to open issues. Issue closure is not independent review
of the entire pilot.

The first table node on each talent page anchors the partial pilot rows. Physical Talents
`table_2` and Combat Talents `table_2`/`table_3` now redirect to their respective `table`
nodes. All IDs and coverage rows remain; redirect components are `not_applicable` and the
report excludes redirects from extraction totals and remaining work. The two canonical
tables remain partial. Later definitions cited in resolutions are evidence, not new
mechanics extraction.

The pilot meets the structural, provenance, table round-trip, and executable-example gates.
Independent source and schema review is still required before bulk extraction. Review should
check the audit boundaries, every printed table cell, each exception/choice, and the unresolved
interpretations above. Later work must not assume that passing tests resolved them.

Run `npm run validate`, `npm test`, `npm run report:coverage`, and `npm run lint` after changes.
If the sandbox prevents the `tsx` CLI's IPC socket, invoke the same validation/report scripts
with `node --import tsx`. Build artifacts, full dependency resolution, and broader rule execution
remain deferred. Phase 4 requires an explicit request; no commits are made by this phase alone.
