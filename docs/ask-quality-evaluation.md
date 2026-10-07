# Evidence relevance and answer quality evaluation

This offline consumer experiment compares four retrieval modes on the 102 questions in
`tests/fixtures/ask-questions/cases.yaml`. It does not modify production retrieval,
canonical rules, or the benchmark labels.

| Mode        | Evidence                                                                 | Web client mode |
| ----------- | ------------------------------------------------------------------------ | --------------- |
| `lexical`   | Lexical analysis only                                                    | `lexical`       |
| `jev_alone` | Jev analysis without the lexical baseline                                | —               |
| `union`     | Lexical plus Jev; `npm run ask` without `--filter`                       | `jev`           |
| `filtered`  | The union pool after Jev drops records it judges irrelevant (`--filter`) | `jev_filtered`  |

Run from the repository root:

```bash
node --import tsx clients/web/src/evaluation/run-quality.ts
# A one-question smoke run, or a subset of modes:
node --import tsx clients/web/src/evaluation/run-quality.ts --limit 1
node --import tsx clients/web/src/evaluation/run-quality.ts --modes lexical,union
# Try another filter threshold or the budget cap (recorded as an override policy):
node --import tsx clients/web/src/evaluation/run-quality.ts --drop-at 0.95 --cap
# Sweep filter policies against an earlier run's judge relevance labels (Jev only):
node --import tsx clients/web/src/evaluation/calibrate-filter.ts --judgments generated/ask-quality-v1
```

The runner uses the web client's TanStack/OpenAI adapter against OpenRouter and the
configured `OPENAI_ROUTER_MODEL` (default `openai/gpt-6-luna`) for both answers and judge.
It requires `OPENAI_ROUTER_API_KEY` and
`TYPESAFE_API_KEY`, loading the root `.env.local` without printing credentials.
Questions and corpus excerpts are sent to these providers. All LLM client code stays
in `clients/web/`; the corpus tooling continues to use an injected client interface.

## Method

- Build an in-memory SQLite index from the current canonical corpus.
- Retrieve the union pool once. Every mode's evidence is a subset of it, and the run
  aborts if one is not, if the union loses a lexical record, or if Jev falls back.
  Exact cached Jev judgments are reused.
- Generate one answer per distinct prompt with the same answer model and production
  prompt builder. Modes whose prompts are identical share one answer and are graded
  once. The analysis header is retained, so this measures the complete pipeline.
- Present the distinct answers under rotated anonymous names (A–D) to one judge
  request using the same model. The judge gets the union pool and untruncated
  reference documents for every candidate and labelled required record, and grades all
  answers against one set of essential facts.
- Ask the judge to derive essential facts with source IDs, classify every candidate's
  relevance, and assess each answer's coverage, false claims, unsupported claims, and
  citation support. It may use only each answer's own delivered evidence when checking
  whether its claims are supported.
- Reject malformed, omitted, duplicate, or unresolvable judgments. A rejected judgment
  is retried once with the rejection reason attached; a second rejection fails the case.
  Failed cases are reported separately and cause a nonzero exit.

`generated/ask-quality/report.json` contains aggregate results, the filter policy, and
paired buckets for `union_vs_lexical`, `filtered_vs_union`, `filtered_vs_lexical` and
`jev_alone_vs_lexical`. Each `askq.*.json` preserves the question, analyses, evidence
per mode, every filter keep/drop decision with Jev's probabilities, exact prompts,
answers, the anonymous identity mapping, judge explanations, and metrics. The `cache/`
directory preserves exact model requests and outputs keyed by model and prompt content.
Reruns reuse these outputs; `--out generated/ask-quality-new-run` selects a fresh
answer/judge cache. Jev retains its per-question cache. A model alias can change behind
either cache.

## Metrics and limits

Required-record recall is separate from relevance. A record not named in
`required_evidence` may still provide useful context. The judge classifies delivered
records as direct, supporting, irrelevant, or uncertain. Precision counts direct and
supporting records as relevant, with lower/upper bounds for uncertain judgments.
`pruned*` counts what a mode removed from the union pool: lexical records, required
records (the hard safety metric), and judge-relevant and judge-irrelevant records.
Prompt character counts measure the context burden; they are not token usage or cost.

An answer passes the strict correctness check only when all essential facts are
covered and the judge finds no incorrect claims, unsupported claims, or citation
errors. A safe abstention can pass factual safety but fail completeness. The existing
deterministic citation-ID check is also saved; passing it alone does not establish
that a citation supports the claim.

These are provisional automated grades until a person reviews them (see
[Human review](#human-review)). The answer and judge share a model family, the judge
sees every answer while deriving the fact rubric, and there is one answer per prompt.
The original 37 questions had been inspected before the filter work; the 65 added on
5 October had not, but their labels were drafted from the corpus records they name and
are unreviewed too. Corpus-based grading does not independently verify the original PDF
or close unresolved source issues. Differences can reflect answer sampling as well as
evidence changes.

## Human review

The web client's `/review` page (run `npm run dev` in `clients/web`) shows one graded
question at a time:

- the judge's essential facts, each of which you can mark as wrong or not needed;
- the distinct answers under the judge's anonymous names A–D. You mark each one correct
  or incorrect. The judge's verdict is folded away and the modes behind each answer stay
  hidden until you reveal them, so you can grade blind;
- every record in the union pool, with the modes that delivered it, Jev's p(irrelevant)
  and filter decision, and the judge's label. You confirm or change the label.

Saving writes `clients/web/evaluation/grading-review.json`. This file is committed and
is the only place where human judgments are kept. Record labels are keyed by record id
and store a hash of the record text. They survive reruns until the record text changes;
after that they are ignored and the record is shown for relabelling. The record queue
(`/review?view=records`) serves single records in the order that most helps the filter
calibration; see [Filter calibration plan](#filter-calibration-plan). Answer verdicts are keyed by a hash of the answer text, so they carry
over when a rerun produces the same answer. If the judge's output changes and some
answers are still unreviewed, the question is marked stale (`!`).

```bash
# Judge-versus-human agreement, per-mode correctness and the label confusion matrix:
node --import tsx clients/web/src/evaluation/review-report.ts   # → generated/ask-quality/review-summary.json
# Recalibrate the filter; reviewed record labels replace the judge's where present:
node --import tsx clients/web/src/evaluation/calibrate-filter.ts
# Is the stored calibration still current (Jev model, corpus, retrieval code, labels)?
node --import tsx clients/web/src/evaluation/calibrate-filter.ts --check
```

Since 5 October the sweep chooses on development + validation, requires that no
reviewer-direct record is dropped, bounds trusted supporting loss at 5 % and reports the
reviewer-only relevant loss with a 95 % upper bound. Besides the threshold it varies
protection by retrieval step (`protectWhy`), a stricter line for tables and procedures
(`dropAtByKind`) and a minimum-kept floor (`minKept`). The report lists every relevant
record Jev scored ≥ 0.9 under `misses`, for diagnosis.

The report counts a judge label of "uncertain" as disagreement whenever the reviewer
chose a definite label. Review the cases in the paired `regressed` and `improved` buckets
first, because those are the cases that decide between modes.

## Filter calibration — 5 October 2026

`calibrate-filter.ts` replays the union pool for each question, asks Jev the relevance
question for every candidate, and scores a grid of policies against the judge's
relevance labels from the 4 October lexical-vs-union run (preserved in
`generated/ask-quality-v1/`). It needs only `TYPESAFE_API_KEY`. The policy is chosen on
the development split alone: no required record and no judge-direct record dropped,
at most 10 % of judge-relevant records dropped, then the most judge-irrelevant records
removed.

Jev's p(irrelevant) separates the judge's irrelevant records from relevant ones with an
AUC of 0.87 (development), 0.95 (validation) and 0.95 (held-out). Two defects found
during calibration were fixed before choosing the policy:

- Jev saw a 1,500-character excerpt while the answering LLM sees 2,400. The
  Claustrophobia row of `table.psychology.mental_conditions` sat past the cut, so Jev
  judged the answer record irrelevant. Jev now sees the same text as the LLM, plus the
  record's issue summaries and unavailable-book dependencies.
- A table reached only through another record's link (`table.magic.demons`, used by the
  Miscast table) looks unrelated when judged alone. `protectLinked` keeps records
  retrieved through `uses_table`, `depends_on` and `step_rule` links.

Chosen policy `provisional-1`: drop at p(irrelevant) ≥ 0.9, protect linked records, no
exact-match protection, no budget cap. Exact-match protection mostly shielded alias
noise: at that threshold, 26 of 27 exact matches Jev scored as irrelevant were also
judge-irrelevant (for example the Wizard profession's equipment limits for a Miscast
question). The cap never improved a split. Against the v1 judge labels:

| Split       | Pool | Dropped | Required lost | Direct lost | Supporting lost | Noise removed | Precision   |
| ----------- | ---- | ------- | ------------- | ----------- | --------------- | ------------- | ----------- |
| development | 127  | 54      | 0             | 0           | 5               | 73 %          | 47 % → 75 % |
| validation  | 137  | 49      | 0             | 0           | 1               | 71 %          | 50 % → 77 % |
| held-out    | 107  | 35      | 0             | 0           | 0               | 64 %          | 49 % → 72 % |

This calibration used only the original 37 questions. The 65 questions added later are
therefore an untouched test of `provisional-1`.

## Results — 5 October 2026

All 102 cases completed with no errors (corpus `b9aefd73`, `gpt-5.5` answer and judge,
`jev-latest`, filter `provisional-1`). These grades use the original judge rubric and are
automated; see the next section for the reviewed batch and the revised rubric. Correct
means strictly correct as defined above.

| Split       | Mode      | Correct  | Fact coverage | Recall | Evidence | Precision | Irrelevant | Prompt chars |
| ----------- | --------- | -------- | ------------- | ------ | -------- | --------- | ---------- | ------------ |
| all         | lexical   | 75 / 102 | 86 %          | 80 %   | 8.5      | 51 %      | 425        | 8,536        |
| all         | jev_alone | 62 / 102 | 81 %          | 75 %   | 6.2      | 60 %      | 253        | 7,333        |
| all         | union     | 79 / 102 | 92 %          | 86 %   | 9.5      | 50 %      | 489        | 9,995        |
| all         | filtered  | 75 / 102 | 90 %          | 86 %   | 6.2      | 74 %      | 167        | 7,688        |
| development | lexical   | 26 / 34  | 92 %          | 82 %   | 8.8      | 52 %      | 143        | 8,661        |
| development | union     | 23 / 34  | 89 %          | 82 %   | 9.5      | 51 %      | 157        | 9,372        |
| development | filtered  | 22 / 34  | 89 %          | 82 %   | 6.3      | 73 %      | 58         | 7,261        |
| validation  | lexical   | 28 / 35  | 85 %          | 82 %   | 8.4      | 48 %      | 151        | 8,522        |
| validation  | union     | 30 / 35  | 91 %          | 89 %   | 9.5      | 47 %      | 177        | 10,263       |
| validation  | filtered  | 28 / 35  | 89 %          | 89 %   | 5.9      | 74 %      | 55         | 7,815        |
| held-out    | lexical   | 21 / 33  | 82 %          | 73 %   | 8.3      | 52 %      | 131        | 8,424        |
| held-out    | union     | 26 / 33  | 95 %          | 86 %   | 9.7      | 51 %      | 155        | 10,353       |
| held-out    | filtered  | 25 / 33  | 93 %          | 86 %   | 6.5      | 75 %      | 54         | 7,992        |

Correct answers, original versus added questions:

| Questions   | lexical | jev_alone | union | filtered |
| ----------- | ------- | --------- | ----- | -------- |
| original 37 | 26      | 22        | 28    | 30       |
| added 65    | 49      | 40        | 51    | 45       |

What this shows:

- The original 37 reproduce the earlier run, in which the filter came out ahead. On the 65
  questions the filter was never tuned on, it comes out behind the union (45 against 51).
  Over all 102, the union has 79 correct and the filter 75.
- The filter is still safe on evidence. It removed 338 of 974 union records (291 of them
  lexical) and no required record. The judge called 322 of those irrelevant and 16
  relevant. Precision rose from 50 % to 74 % and prompts are 23 % shorter.
- Against the union, the filter improved 3 answers and regressed 7, all 7 among the
  added questions. Only `shared_experience` lost evidence: the filter dropped
  `background.troll_slayer`, which the judge rated direct. In five more cases
  (`enemy_activation_order`, `line_of_sight`, `wandering_monster`, `dual_wield`,
  `encounter_chance`), the filtered answer had the same relevant evidence and failed
  only for leaving out a caveat the judge counted as essential, such as "the records do
  not define an obstacle". `aim_bonus` failed on a single misstated claim. These are the
  calls that human review should settle first.
- The union beats lexical on 11 questions and loses on 7. Jev alone is still the worst
  mode, with 23 regressions against lexical.

### First human review and judge rubric sensitivity

The first reviewed batch covered the 10 questions where union and filtered disagreed
(39 distinct answers). The rejected judge facts were mostly source-limitation caveats
("the records do not define an obstacle", "needs supplied game-state inputs") and one
personal-quest reward. Two rewrites of the fact rule were then tried, each followed by a
regrade of all 102 questions from the same cached answers:

| Judge fact rule                                                             | Agrees with reviewer | Too strict | Too lenient | lexical | union | filtered |
| --------------------------------------------------------------------------- | -------------------- | ---------- | ----------- | ------- | ----- | -------- |
| Original: include uncertainty and unavailable-book limits                   | 31 / 39              | 8          | 0           | 75      | 79    | 75       |
| Limits only when unanswerable; skip quest rewards, rare items               | 34 / 39              | 0          | 5           | 76      | 85    | 83       |
| As above, plus cover thresholds, costs, cancellation and equipment variants | 30 / 39              | 9          | 0           | 65      | 76    | 68       |
| Reviewer, the 10 questions only                                             | —                    | —          | —           | 9       | 8     | 8        |

The judge's strictness moves with small rubric changes by as much as the gap between
modes, so correctness differences of a few answers are not meaningful yet. The order is
stable, though: the union beat lexical and the filter under every rubric, and the
filter's losses against the union are mostly judgment calls rather than lost evidence. On
the reviewed questions, union and filter tie. The second rubric was dropping facts the
reviewer counts as essential (the Aim Attachment +15, re-checking Wounded after healing,
the 91–00 automatic failure), but the third swung back to rejecting answers the reviewer
accepted, so it agreed least. `run-quality.ts` keeps the second rubric, which agrees most,
and `generated/ask-quality/` holds its grades. The original-rubric run is preserved in
`generated/ask-quality-v2/` and the second in `generated/ask-quality-v3/`; the third
exists only as cached judge outputs.

Recalibrating with the reviewed record labels left no policy eligible on development.
`provisional-1` drops 2 judge-direct records: `character.treasure.curse_reroll`
(`curses`) and `character.settlement.guild.wizards.charging` (`guild_access`, p = 1.00),
and every policy in the sweep drops at least one of them.

Until reviewed grades confirm one or the other, the union (`jev` in the web client) and
the filter (`jev_filtered`, the web default until 5 October; the default is now `jev`) are within sampling noise of each
other on correctness. The filter costs less context; the union has the better unreviewed
score.

## Filter calibration on reviewed labels — 6 October 2026

The record queue produced 395 reviewer relevance labels (67 direct, 62 supporting, 266
irrelevant). Four are stale because their record text has since changed, which leaves 391,
almost all from development and validation. `calibrate-filter.ts` swept 768 policies over
the 103 current pools (corpus `a05504b7`, `jev:jev-latest`, 0 new Jev requests). Judge
labels fill in where no reviewer label exists. Jev's p(irrelevant) separates relevant
records from irrelevant ones with an AUC of 0.93 against these combined labels, and 0.82
against reviewer labels alone (development 0.77, validation 0.89).

`provisional-1` fails on reviewer labels. On development it drops one reviewer-direct
record and 15 % of supporting records (8 records).

Adopted policy `calibrated-1` (`CALIBRATED_FILTER` in `scripts/ask/ranking.ts`, the default
for `--filter` and `jev_filtered`): drop at p(irrelevant) ≥ 0.95, or ≥ 0.99 for tables and
procedures, with linked records protected, no exact-match protection and no cap.

| Split       | Pool | Dropped | Required lost | Direct lost | Supporting lost | Reviewer-relevant loss (95 % bound) | Noise removed | Precision   |
| ----------- | ---- | ------- | ------------- | ----------- | --------------- | ----------------------------------- | ------------- | ----------- |
| development | 361  | 99      | 0             | 0           | 3               | 4 % (≤ 10 %)                        | 47 %          | 44 % → 59 % |
| validation  | 350  | 111     | 0             | 0           | 1               | 2 % (≤ 9 %)                         | 54 %          | 42 % → 61 % |
| held-out    | 324  | 83      | 0             | 0           | 1 (judge)       | — (no reviewer labels yet)          | 46 %          | 45 % → 61 % |

It drops these supporting records: `character.hit_points.party_loss` (`poison_bleeding_rest`),
`character.hit_points.wounded` (`molgor_hit_points`),
`character.profession.warrior_priest.initial_energy` (`prayer_use`),
`background.troll_slayer` (`shared_experience`) and, in held-out,
`quest.great_crypt.stopping_necromancer` (`ragnalf_stats`).

The selection rule actually chose `sweep-0.98-noexact-cap-kinds@0.99`, a policy that
removes 52 % of noise against `calibrated-1`'s 51 % on development + validation. Most of
its losses come from the cap, which cuts records Jev scores below any threshold. The
simpler policy without a cap was adopted. That choice was made after held-out results had
been seen, but held-out had no reviewer labels yet. The held-out reviewer labels collected
next are the test of `calibrated-1`.

Still to do: label held-out, then regrade answers under `calibrated-1`. The web default
stays `jev` (the union) until both are done.

## Filter calibration plan

Status: tooling implemented 5 October 2026. Development and validation were labelled and
`calibrated-1` was adopted on 6 October 2026. Still to do: held-out labels, an answer
regrade, and the web default switch. Results so far are in the sections above; the filter
is described in [retrieval.md](retrieval.md#ask-pipeline).

### Goal

Replace `provisional-1` (drop at p(irrelevant) ≥ 0.9, linked records protected) with a
policy chosen on human relevance labels. Its loss bound must be stated, and it must be
re-checked whenever its inputs change. The filter may only remove noise. A record a reviewer
calls `direct` must never be dropped, and the chance of dropping a `supporting` record must
be measured rather than assumed.

### Where we are

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

### Phase 1: make labels and scores replayable

1. **Cache Jev relevance judgments.** Key each one by Jev model id, question, and a hash of
   the record text Jev saw (`recordState`). This works like the analysis cache in
   `generated/ask-eval/jev-cache/`. Calibration then replays offline and is reproducible.
   Changing the model id or the text invalidates the entry instead of mixing versions.
2. **Pin labels to record text.** Store the hash of the record's search text next to each
   human relevance label, as `judgmentHash` already does for answers. A label whose record
   text has changed is reported as stale, not silently reused.
3. **Regrade the current pools.** Run `run-quality.ts` again so the judge labels the records
   the new retrieval steps add. Do this before any review.

### Phase 2: review records, not cases

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

### Phase 3: choose the policy

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

### Phase 4: adopt and keep it calibrated

- Put the chosen policy in `ranking.ts` under a new id (`calibrated-1`) and pin it in
  `tests/ask/ranking.test.ts`. Record in this document: Jev model id, label
  counts per split and source, AUC, losses with bounds, and held-out results.
- The web default stays `jev` (union) until the policy passes on validation and held-out.
  After that, switch the default back to `jev_filtered`.
- Recalibrate when the Jev model changes, `recordState` or search-document text changes,
  `evidence.ts` gains or changes a retrieval step, or about 100 new human labels exist.
  The calibration file should list these inputs, so a stale result can be detected the way
  the retrieval index fingerprint is.

### Implementation status

| Item                    | State                                                                                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 Jev relevance cache | Already in place: `memoModel` keys on model id, question, record text and prompt. `calibrate-filter.ts` warns when the model id is a floating alias such as `jev-latest`; set `TYPESAFE_DEFAULT_MODEL` to pin one.     |
| 1.2 Label text hashes   | `CaseReview.recordHashes`; stale labels are ignored by calibration and flagged in `/review`. Labels saved before this have no hash and stay trusted.                                                                   |
| 1.3 Regrade             | Rerun `run-quality.ts` with the current retrieval. The previous grades are in `generated/ask-quality-2026-10-05-before-heading/`.                                                                                      |
| 2 Record queue          | `/review?view=records`, buckets as above, progress against the targets.                                                                                                                                                |
| 3 Policy choice         | Done 6 October: 391 reviewer labels, `calibrated-1` (0.95; tables and procedures 0.99; linked protected; no cap). See [Filter calibration on reviewed labels](#filter-calibration-on-reviewed-labels--6-october-2026). |
| 4 Adopt                 | `CALIBRATED_FILTER` in `ranking.ts`, pinned in `tests/ask/ranking.test.ts`. Web default stays `jev` until held-out is labelled and answers are regraded. `calibrate-filter.ts --check` detects a stale result.         |
