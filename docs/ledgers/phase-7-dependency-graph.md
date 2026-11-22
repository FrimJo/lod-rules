# Phase 7 dependency graph (Step 4)

This ledger records Step 4 of the [completion plan](../corpus-completion-plan.md#step-4--dependency-graph-and-precedence-phase-7):
the typed dependency graph, its canonical edges and the dispositions of its anomalies. Step 4 runs
as four units (spec: GitHub issue #5):

1. Graph derivation and traversal.
2. Embarking binding: the first canonical edge, which defines the `corpus/graph/` schema.
3. Duplicate/summary detection (closes `phase_6.criterion_2`).
4. Anomaly dispositions.

The generated [graph report](../graph-report.md) is the current anomaly worklist. Counts below
are point-in-time.

## Unit 1 — graph derivation and traversal — 21 October 2026

Issues #6 (graph module, retrieval refactor), #7 (new relations, tool projection), #8
(anomalies, traversal) and #9 (report, ledger, docs), all under spec #5. No change under
`corpus/`, `schemas/` or `review/`; the Phase 0–6 acceptance fixture is unchanged.

### What was derived

`scripts/graph/` loads the canonical corpus (`loadRetrievalCorpus`, extended with test cases)
and returns `buildGraph(): AnalysedGraph`, `{ nodes, edges, anomalies }`.

- **Nodes (4861):** 1929 rules, 669 entities, 224 tables, 125 procedures, 2 state machines,
  117 terms, 331 issues, 715 sections, 10 manifest documents (6 `not_present`) and 739 test
  cases.
- **Edges (15492):** `{ source, relation, target, category, field, provenance }`. `field` is the
  originating schema path (for example `steps[].rule_refs`); `provenance` is the owning record's
  source reference, or the section's own page span for section-owned edges. Edges are not
  deduplicated; one edge per originating field occurrence. Retrieval dedupes per source.
- **Traversal:** forward, reverse and both, with a category filter. The "what could affect X"
  default is reverse over `dependency` and `precedence`.
- **CLI:** `npm run graph -- build` writes sorted `generated/graph/{nodes,edges}.json`;
  `npm run graph -- report` writes the committed [graph-report.md](../graph-report.md). A test
  fails when the committed report differs from a fresh render.

### Relation and category vocabulary

| Category     | Relations                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dependency` | `uses_table`, `depends_on`, `step_rule`, `row_rule`, `row_entity`, `enters`, `grants`, `starting_equipment`, `component`, `rule`, `table`, `entity` |
| `precedence` | `overrides` (`summary_of` and `expanded_by` reserved for unit 3)                                                                                    |
| `reference`  | `see_also`, `term`, `timing`, `related`, `quest`                                                                                                    |
| `structural` | `part_of` (section `parent`), `redirects_to` (`redirect_to`), `cites_section` (`section_id`)                                                        |
| `external`   | `external` (section `external_references`, to manifest documents)                                                                                   |
| `evidence`   | `tests` (test-case refs), `concerns` (issue `related`), `issue` (record `issues`)                                                                   |

Every relation name retrieval emitted before unit 1 is kept, with its derivation. `quest` comes
from an explicit `quest_id` when present, otherwise from the section-ancestor derivation, never
both. Decision: an ancestor-derived `quest` edge carries `field: section_id`; only an explicit
`quest_id` gives `field: quest_id`.

Decision: only `dependency`, `precedence`, `reference` and `external` edges, plus `part_of` as
the single `structural` exception, reach retrieval's relations table and therefore `lod_expand`
and `lod_get` links. `cites_section`, `redirects_to` and every `evidence` edge stay in the graph
and never reach the tools.

### Behaviour preservation

Evidence: before/after dumps of `SELECT source,relation,target FROM relations` from the
retrieval index.

- #6 (graph module, retrieval refactor): identical, 8377 rows.
- #7 (new relations, tool projection): removed only 929 `concerns` and 658 `issue` rows
  (evidence); added only 705 `part_of` and 41 `external` rows.

### Behaviour changes

- `npm run retrieve -- expand` (corpus-work CLI) no longer shows `issue` or `concerns` edges.
  Use `npm run retrieve -- issues <id>`.
- `lod_expand` at depth ≥ 2 can walk through section nodes via `part_of` and `external`.
- `lod_get` links resolve section and manifest-document targets the way `lod_expand` does and
  carry `target_title`. Record links to sections (305 tool-visible edges, mostly `see_also`)
  were dropped before. Issue records still never appear.

### Counts

| Category     | Edges |
| ------------ | ----- |
| `dependency` | 6564  |
| `precedence` | 28    |
| `reference`  | 1168  |
| `structural` | 4548  |
| `external`   | 41    |
| `evidence`   | 3143  |

Per-relation counts are in the [graph report](../graph-report.md#edges-by-relation).

### Anomaly totals (no dispositions; unit 4 owns them)

- Dangling ids: 0. A test fails on any dangling id.
- Cycles: 41. `depends_on` has 28 (26 two-record mutual dependencies and 2 self-references,
  `procedure.damage_follow_up` and `procedure.sanity_condition`); `related` has 13, all mutual
  glossary pairs such as `term.battle` and `term.combat`. Cycles are reported and never fail
  the build. The validator's existing `overrides` cycle check is unchanged; the graph finds no
  `overrides` cycle.
- Unresolved pointers: 222 `unresolved_references` entries, listed by owner and wording. They
  are never edges and none is resolved.

### Gate

`npm run validate` (555 canonical files), `npm test` (165 files passed, 2 skipped; 4795 tests
passed, 2 skipped) and `npm run lint` pass.

### Next

Unit 2: bind `core.quest.start_settlement` to the first `procedure.quest_acceptance` as the first
canonical edge in `corpus/graph/`, defining its schema.

## Unit 2 — embarking binding — 21 October 2026

Issue #10 under spec #5. Decisions came from a grilling session. Vocabulary (**canonical edge**,
**derived edge**, **binding**) is in [CONTEXT.md](../../CONTEXT.md); placement is
[ADR 0001](../adr/0001-canonical-edges-outside-records.md).

### What was added

- `corpus/graph/dependencies.yaml`: `edge.quest.start_settlement.first_acceptance`,
  `procedure.quest_acceptance -input_from-> core.quest.start_settlement`, binding input
  `settlement` ← output `settlement`. Source PDF 59 (printed 57), "Embarking on your First
  Quest"; condition "When you start the game", verbatim. A structural-reading note in
  `unresolved_references` limits it to the party still being in its start settlement, and to a
  final result (8, "Re-roll.", supplies none).
- `schemas/graph-edge.schema.json`. Fields: `id` (`edge.` namespace), the usual metadata,
  `relation` (enum: `input_from`), `from`, `to`, `binding`, `condition` and optional
  `unresolved_references`/`issues`. `from`/`to` name the endpoints because `source` is the
  source reference.
- Edges load as the record kind `edges` (root `corpus/graph/`), so they get global ids, metadata
  and provenance checks, and the examined kind `edge` in review digests. The validator also
  checks that the endpoints are rules or procedures, that `binding.field` is an input of `from`,
  that `binding.from_field` is an output of `to`, and that the two field types match.
- Graph: `input_from` is a `dependency` relation; a canonical edge's `field` is its YAML path,
  its `provenance` its own source, and it carries `condition`. Edge records are graph nodes
  (kind `edge`) with `cites_section` and `issue` edges.
- Retrieval: the relations table gains `condition`; `lod_get` links and `lod_expand` edges show
  it. `SEARCH_DOCUMENT_VERSION` 6.
- `review/ambiguities.yaml`: `issue.embarking.first_quest_settlement_travel` (PDF 59, 132, 133).
  `related` is only the edge and `core.quest.start_settlement`: relating
  `procedure.quest_acceptance` or `procedure.settlement_arrival` would have staled the
  settlement reviews that freeze them.

### Review

The edge's `section_id` is `section.embarking_on_your_first_quest`, so the embarking record
governs it. `review.embarking.3` failed with two `modelling_error` findings: the edge's name
claimed "the first quest acceptance" although Rejecting a Quest (PDF 132) and Available quests
(PDF 133) can move the party first, and the issue overstated the gap. After correction,
`review.embarking.4` passed with corrections (PDF 25–62, 132, 133 inspected; nothing open). Its
optional note on "enters" versus "is in" is a checkpoint carry-over.

### Counts

Graph report: 4863 nodes, 15497 edges (`input_from` 1), 0 dangling ids, 41 cycles,
223 unresolved pointers (the edge's note is the new one). The Phase 0–6 fixture has 84 of 85
rows verified; "embarking on a quest" is `verified`.

### Next

Unit 3: duplicate/summary detection. See the
[extraction checkpoint](../extraction-checkpoint.md#next-unit).
