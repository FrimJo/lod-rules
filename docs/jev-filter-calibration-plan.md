# Plan: calibrating the Jev relevance filter with human grading

Status: tooling implemented 5 October 2026. Development + validation were labelled and
`calibrated-1` was adopted on 6 October 2026. Still to do: held-out labels, an answer
regrade, and the web default switch. Results so far are in
[ask-quality-evaluation.md](ask-quality-evaluation.md); the filter is described in
[retrieval.md](retrieval.md#ask-pipeline).

## Goal

Replace `provisional-1` (drop at p(irrelevant) ≥ 0.9, linked records protected) with a
policy chosen on human relevance labels. Its loss bound must be stated, and it must be
re-checked whenever its inputs change. The filter may only remove noise. A record a reviewer
calls `direct` must never be dropped, and the chance of dropping a `supporting` record must
be measured rather than assumed.

## Where we are

- The `/review` page in `clients/web/` saves case reviews to
  `clients/web/evaluation/grading-review.json`. Each review holds per-record relevance,
  answer correctness and wrong facts. `calibrate-filter.ts` already prefers a reviewer's
  label over the judge's (`trustedRelevance`).
- 116 records have both a human label and a Jev p(irrelevant), all from 11 cases (32
  direct, 18 supporting, 66 irrelevant). The 102 graded cases hold 974 filter decisions.
- On the binary question (relevant or not), human and judge labels agree 95% of the time.
  Where they disagree, the judge leans towards "irrelevant": 3 of the 57 records the judge
  called irrelevant were supporting to the reviewer. One example is
  `character.perk.quick_focus.spell` in `askq.wounded_wizard_miscast`, which Jev scored at
  p(irrelevant) = 0.86. That is 0.04 below the drop line.
- No policy in the current sweep is eligible on reviewed labels. Two records the judge
  called direct were dropped: `character.treasure.curse_reroll` and
  `character.settlement.guild.wizards.charging`. The second has p = 1.00, which no threshold
  can save.
- `generated/ask-quality/filter-calibration.json` predates the review and has no chosen
  policy. Calibration calls Jev live, so `jev-latest` can drift between runs.
- Retrieval changed on 5 October: the same-heading sibling and named-heading steps were added
  to `evidence.ts`. Graded pools from before that date lack the records those steps add, so
  those records have no labels yet.

## Phase 1: make labels and scores replayable

1. **Cache Jev relevance judgments.** Key each one by Jev model id, question, and a hash of
   the record text Jev saw (`recordState`). This works like the analysis cache in
   `generated/ask-eval/jev-cache/`. Calibration then replays offline and is reproducible.
   Changing the model id or the text invalidates the entry instead of mixing versions.
2. **Pin labels to record text.** Store the hash of the record's search text next to each
   human relevance label, as `judgmentHash` already does for answers. A label whose record
   text has changed is reported as stale, not silently reused.
3. **Regrade the current pools.** Run `run-quality.ts` again so the judge labels the records
   the new retrieval steps add. Do this before any review.

## Phase 2: review records, not cases

Reviewer time is the scarce input, and whole-case review spends most of it on easy records
(p < 0.3 or p > 0.98 with an obvious label). Add a record queue to `/review`, ordered by how
much a label would change the policy:

1. records dropped by the current policy that the judge calls relevant;
2. records the judge and Jev disagree on, or where p(irrelevant) is between 0.6 and 0.97,
   the band where every candidate threshold lies;
3. records added by the heading and sibling steps, which have no labels yet;
4. a small random sample from the rest, to estimate the error on easy cases.

Saving a label from the queue should still write the per-case review, so the existing
summary and the answer-grading flow keep working.

Target before choosing a policy: about 300 human-labelled records, at least 60 of them
relevant with p(irrelevant) ≥ 0.6. Spread them over development and validation. Label
held-out records last, once, after the policy is fixed.

## Phase 3: choose the policy

Extend `calibrate-filter.ts` rather than writing a new tool.

- **Labels.** Human labels decide the hard constraints. Judge labels are used only where no
  human label exists, and results are reported for the human-only subset as well.
- **Hard constraints on development and validation.** Zero human-direct drops and zero
  required-evidence drops.
- **Soft constraint.** Supporting loss ≤ 5% of human-supporting records, reported with its
  upper bound. With n relevant labels and zero losses, the 95% upper bound is about 3/n; at
  n = 60 that is 5%.
- **Objective.** Among the eligible policies, remove the most human-irrelevant records, with
  prompt tokens saved as a secondary measure.
- **Policy dimensions.** Add knobs to the sweep beyond the threshold, because p = 1.00
  errors cannot be fixed by a threshold:
  - protect records by provenance (`why`): named heading, same-heading sibling, alias
    entity, linked;
  - a per-kind threshold (tables and procedures vs single rules);
  - a minimum-kept floor per case.
- **Diagnose before tuning.** For each human-relevant record Jev scores ≥ 0.9, record why it
  failed. If the cause is what Jev saw (title, missing context, text cut off), fix
  `recordState`, not the threshold.

## Phase 4: adopt and keep it calibrated

- Put the chosen policy in `ranking.ts` under a new id (`calibrated-1`) and pin it in
  `tests/ask/ranking.test.ts`. Record in `ask-quality-evaluation.md`: Jev model id, label
  counts per split and source, AUC, losses with bounds, and held-out results.
- The web default stays `jev` (union) until the policy passes on validation and held-out.
  After that, switch the default back to `jev_filtered`.
- Recalibrate when the Jev model changes, `recordState` or search-document text changes,
  `evidence.ts` gains or changes a retrieval step, or about 100 new human labels exist.
  The calibration file should list these inputs, so a stale result can be detected the way
  the retrieval index fingerprint is.

## Implementation status

| Item                    | State                                                                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 Jev relevance cache | Already in place: `memoModel` keys on model id, question, record text and prompt. `calibrate-filter.ts` warns when the model id is a floating alias such as `jev-latest`; set `TYPESAFE_DEFAULT_MODEL` to pin one.                  |
| 1.2 Label text hashes   | `CaseReview.recordHashes`; stale labels are ignored by calibration and flagged in `/review`. Labels saved before this have no hash and stay trusted.                                                                                |
| 1.3 Regrade             | Rerun `run-quality.ts` with the current retrieval. The previous grades are in `generated/ask-quality-2026-10-05-before-heading/`.                                                                                                   |
| 2 Record queue          | `/review?view=records`, buckets as above, progress against the targets.                                                                                                                                                             |
| 3 Policy choice         | Done 6 October: 391 reviewer labels, `calibrated-1` (0.95; tables and procedures 0.99; linked protected; no cap). See [ask-quality-evaluation.md](ask-quality-evaluation.md#filter-calibration-on-reviewed-labels--6-october-2026). |
| 4 Adopt                 | `CALIBRATED_FILTER` in `ranking.ts`, pinned in `tests/ask/ranking.test.ts`. Web default stays `jev` until held-out is labelled and answers are regraded. `calibrate-filter.ts --check` detects a stale result.                      |

## First steps

1. Add the relevance-judgment cache and label text hashes (Phase 1, items 1–2).
2. Regrade the 102 cases with the current retrieval (Phase 1, item 3).
3. Build the record queue in `/review` (Phase 2).
4. After about 150 labels, run a first sweep to check that the provenance knobs fix the
   p = 1.00 cases before the full target is reached.
