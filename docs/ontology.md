# Phase 2 glossary and ontology

Phase 2 is extracted, not independently reviewed. The corpus contains 55 term records,
90 reverse-index forms, and eight unresolved issues. The authoritative source is the
second-printing English rulebook; PDF 12–24 were inspected for this scoped pass.

## Definitions and boundaries

All 47 headwords in Abbreviations and Terminology are represented, including its
continuation on printed 15 / PDF 17. Eight additional definitions come from Dice Rolling
and Skill Checks and Game Basics. Action Points and Line of Sight use the longer Game
Basics wording with both source references. Adjacent retains the glossary wording and
cites the later corroborating definition. Whitespace from PDF extraction is normalized;
wording, capitalization, and punctuation of definition excerpts are preserved.

Names use the expanded book wording when a headword is an abbreviation. The abbreviation
is also an alias and the source heading records the original headword. DEF has no explicit
expanded name, so its name remains DEF. Definitions consisting only of expansions stay
that way: Damage Bonus, Natural Armour, Hit Points, and similar headwords are included
from the glossary, without harvesting Character Basics or any later chapter.

The definition field is a quotation, not an executable rule or a guarantee of completeness.
In particular, the Skill Test threshold has a 91–00 exception in the introduction, recorded
in issue.0005. LOS obstruction rules and the rewards for a Perfect Result remain for the
rules phase. No rules, tables, procedures, or worked examples have been modeled here.

## Kinds

| Kind            | Intended use                                                            |
| --------------- | ----------------------------------------------------------------------- |
| resource        | Spendable or tracked quantities such as AP, HP, coins, and Party Morale |
| stat            | Numerical attributes or values such as Movement and Damage Bonus        |
| skill           | Named skills such as Combat Skill and Ranged Skill                      |
| temporal_scope  | Battle and the two quest-ending formulations                            |
| spatial_concept | Adjacent, LOS, tiles, walls, and ZOC                                    |
| action_type     | Combat and Close combat                                                 |
| damage_type     | Reserved for explicitly defined types; none harvested in this scope     |
| item_property   | Armour Piercing, Durability, Encumbrance, and Throwable Potion          |
| spell_property  | Casting Value and the glossary's spell categories                       |
| rule_keyword    | Tests, result labels, rounding, and modifiers                           |
| concept         | Other vocabulary, including Skill and Stat themselves                   |

Kinds are corpus classifications, not new rules. Abbreviation is never a kind.
`mechanically_significant` marks terminology whose identity matters to later rule work;
it does not assert that every related term has a different mechanic.

## Alias lookup and related terms

`aliases.yaml` indexes each name, abbreviation, and declared alternate surface form.
Lookup ignores case but retains punctuation: AP and AP(X), and NA and N/A, are different.
Each form maps to exactly one term. Repeated forms within one record (for example DEF as
both name and abbreviation) produce a single index row. The index accepts case variants
of a declared form; it rejects unknown forms, omissions, duplicate lookup keys, and forms
owned by another term. An abbreviation must also occur in the term's aliases list.

`related` points to existing terms; it is not a synonym or substitution operator. Future
objects may reference stable `term.*` ids, with reference validation added to their own
schemas and integrity checks when those object types are introduced.

- Battle and Combat remain distinct: the former measures duration, the latter is fighting.
- Characters and Model explicitly equate living creatures in the glossary. Both headwords
  retain their own quotations and related ids. The Models section also uses the physical
  representation sense, recorded in issue.0002. No automatic substitution is inferred.
- Enemies and Monster explicitly state synonymy. Both headwords retain their quotations
  and related ids; issue.0003 tracks the still-unreviewed scope of later usage. Their
  separate records do not assert different game mechanics.
- End of the Quest and Until end of (next) quest give different endpoints. Neither wins;
  both remain separate and issue.0004 records the conflict.
- Perk requires energy to activate; Talent is always active. These stay distinct.

## Extraction audit

| Source unit                                                 | Result                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| Abbreviations and Terminology, PDF 16–17                    | All 47 headwords; visually checked both columns and continuations         |
| A Word on Complexity / Dice Rolling, PDF 12                 | Guidance; no standalone definition                                        |
| Game Components, PDF 13–15                                  | Component inventory outside the attached glossary scope; left unextracted |
| Dice Rolling and Skill Checks, PDF 18                       | Percentile dice and modifier; additional check provenance and uncertainty |
| Basic Concept, PDF 19                                       | Narrative and Threat mechanics; no standalone definition harvested        |
| House Rules / The Tiles, PDF 19                             | Contextual house-rule definition and tile definition                      |
| Objects on the Tiles / Adjacent, PDF 19–20                  | Wall definition and corroborating adjacency definition                    |
| Difficulty / Complexity, PDF 19 / 21                        | Balancing and optional-rule guidance; no standalone definition            |
| Turn Sequence, PDF 20                                       | Ordered procedure, no separate turn definition; issue.0007                |
| Skill and Stat Checks, PDF 20–21                            | Success, failure, and Perfect Result from named child headings            |
| Models, PDF 20                                              | Additional source for Model's representation sense; issue.0002            |
| Action Points / Line of Sight, PDF 21                       | Expanded definitions, retaining glossary sources                          |
| Fiction, gender/mental-health notes, reading/start guidance | Excluded from glossary extraction                                         |
| Gameplay Example, PDF 22–24                                 | Example only; no new non-example headings on PDF 23–24                    |

The source map now includes Objects on the Tiles, Adjacent, Success and Failure, and
Perfect Result. Its existing terminology, tile, checks, and example ranges have been
extended to their verified continuations. Coverage remains a bijection with section ids.
Only the terminology section is wholly extracted; other applicable components remain
unextracted. Parent chapters are not promoted because a child contributed definitions.

Uncertainties live in `review/ambiguities.yaml`. “Undefined” there means undefined within
this inspected scope, not a claim about the entire rulebook. Later chapters and external
books have not been harvested to fill gaps.
