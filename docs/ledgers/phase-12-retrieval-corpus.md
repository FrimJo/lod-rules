# Phase 12 retrieval corpus

This ledger records Phase 12 of the [completion plan](../corpus-completion-plan.md#phase-12--retrieval-corpus):
make the compiled corpus usable for retrieval, with review status for corpus work, visible
conflict and unavailable-source notices for agents, complete tables, a fixed acceptance query
suite and reviewed labels. Spec: GitHub issue #31 (tickets #32–#37). Counts below are
point-in-time (25 November 2026, integration head `38a8362`).

The retrieval reference is [retrieval.md](../retrieval.md). The exit checklist is
`tests/fixtures/acceptance/phase-12.json`, checked by `tests/schema/phase-12-acceptance.test.ts`.
No canonical YAML changed in Phase 12, and no review issue was added: the label review found no
corpus defect.

## Acceptance suite — #32, #34

`tests/fixtures/retrieval-acceptance.json` holds 62 cases, run by
`tests/retrieve/acceptance.test.ts` through `Retrieval` and `runRetrievalTool` over the corpus
compiled from the bundles. It replaced the 14 hard-coded top-ten queries and alias lookups.
The default result limit is 10 (`DEFAULT_RESULT_LIMIT`); a case may tighten it, never loosen
it. Every category has at least the 5 cases `CATEGORY_MINIMUMS` requires.

| Category                    | Cases |
| --------------------------- | ----: |
| `exact_lookup`              |    12 |
| `terminology`               |     9 |
| `combat_modifiers`          |     6 |
| `quest_local_exceptions`    |    10 |
| `missing_external_material` |     6 |
| `service_eligibility`       |     6 |
| `optional_rules`            |     6 |
| `conflicting_passages`      |     7 |

The checker rejects an unknown category, a duplicate id, an expected id that is not in the
corpus, a limit above 10, a note that names no PDF page cited by an expected record, and each
category's own check (unavailable books must be `not_present`, quest-local cases check scope or
ranking, optional rules check the marker). Every hit must cite a PDF page.

Ticket #34 also proved that tables survive retrieval whole: for each of the 224 table records,
`lod_get` returns the bundled columns, rows and footnotes unchanged, and table search hits name
their table and snippet its printed cells. A ranking fix there stopped a quest-only title match
escaping the quest penalty when the query uses an inflected global word ("fleeing" via "flee");
lexical `ask:evaluate` figures were unchanged by it.

## Conflict notices — #36

`lod_get` gains `conflicts_with` (the other passages of an open `conflicting` issue, with
title and citations) and `rulings` (the official errata or FAQ citations that replace an open
conflict). `lod_search` summaries carry `conflicting_passages: true`. Membership comes from the
graph's issue edges (`issueMembers`); issue search documents store it as `issue_members`. No
issue id, status, summary or resolution text reaches tool output. The suite's 7
`conflicting_passages` cases cover a cross-record conflict, an in-record conflict, an
FAQ-settled conflict and one the rulebook settles itself.

## Review status in the CLI — #35

Full search documents (`retrieve search|get|issues`) report `review_status` (the record's own
status), `section_status`, `governing_review` (`{ id, outcome, date }`, chosen by the
validator's `governingRecord`) and `open_issues` by type; search hits carry
`open_issue_counts`; `--issue-type` filters issue results. Agent tools show none of it.
`SEARCH_DOCUMENT_VERSION` is 8.

## Label review — #33

The labelled ask question set has 103 cases. An independent review, not by the labels' author,
checked all of them: 92 confirmed, 11 corrected, each correction with a reason. Splits and
question text did not change. Required-record recall, development / validation / held-out, on
the same code, corpus and cached Jev answers:

| Configuration | Old labels     | Reviewed labels |
| ------------- | -------------- | --------------- |
| lexical       | 81 / 86 / 78 % | 78 / 85 / 78 %  |
| jev           | 79 / 82 / 76 % | 78 / 83 / 76 %  |
| jev + lexical | 91 / 93 / 84 % | 86 / 91 / 84 %  |

The old labels overstated recall by up to 5 points on development and validation. Full
method and the corrections are in [ask-quality-evaluation.md](../ask-quality-evaluation.md#label-review).

## Known caveats

- **No record sits in a `mapped` section.** `section_status` can be `reviewed` or `mapped`
  (a compatibility redirect), but none of the 38 redirect sections holds a canonical record,
  so no real document reports `mapped`. The value is proved by a synthetic test that moves
  `term.skill_test` into a redirect section (`tests/retrieve/retrieval.test.ts`), and the
  exit test asserts that no real document reports it, so this caveat fails loudly if it
  stops being true.
- **Optional-rule marker gap.** An agent learns that a rule is optional only from its
  `optional_system` or an "optional" title or section (`identifiesAsOptional`). The
  Simplified Alchemy rules (`character.alchemy.simplified.*`, PDF p. 76, printed 74) and the
  Bleeding-out Advanced Rule (`character.hit_points.bleeding_time`, PDF p. 122, printed 120)
  carry neither, so `lod_get` gives no sign they are optional. The
  `optional_rules` cases do not exercise them. Fixing it needs a canonical change
  (`optional_system` on those records), not a retrieval change.
- **Labels still missed.** Three corrected ask cases are missed by every configuration
  because the record a correct answer needs is not retrieved: when a torch goes out
  (`torch`), the failed-casting Mana rule (`miscast_failed_spell`) and the casting procedure
  (`claustrophobic_wizard_corridor`).

## Carry-overs

Phase 12 changed no canonical record, so neither issue moved. Both remain open:

- `issue.sanity.inn_recovery_stay_limit`: the frozen `procedure.sanity_recovery` has no
  per-stay field, so the changelog #83 once-per-stay inn recovery limit is recorded, not
  enforced.
- `issue.guild.alchemist_availability_merged_tables`: `table.guild.alchemist_availability`
  merges two printed Alchemists' Guild tables because 46 frozen records cite its rows.

## Gate

25 November 2026: `npm run validate` passes (563 canonical files); `npm test` passes (5,108, 2
optional provider tests skipped); `npm run lint` passes. `npm run report:coverage` and `npm run
graph -- report` regenerate the committed reports unchanged: no canonical input changed. The
exit checklist test also moved the informal-uncertainty checkpoint fixture's heading to the
checkpoint's new date and made the Phase 11 checklist test stop requiring Phase 12 as the next
unit.
