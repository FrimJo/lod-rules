# Complete the rulebook corpus through Phase 12

## 1. Goal and completion standard

Finish the remaining extraction, independently review the source coverage, and compile a
reproducible corpus with usable retrieval tooling.

Completion means:

- Every source section and applicable component has extraction evidence or a justified exclusion.
- Every mechanically meaningful passage has structured representation, including explicit
  uncertainty where the source cannot determine an answer.
- Independent review has checked that representation against the PDF.
- Internal references resolve; unavailable external material remains identified.
- Generated artifacts reproduce the validated corpus without losing provenance.

The target is **zero unexplained omissions or integrity failures**, not zero unresolved
rulebook ambiguities.

**Chosen defaults:** core Phases 0–12 are required. Independent review uses a different human
or agent from the extractor, with recorded evidence. Preserve existing work and IDs; do not
commit unless requested. Optional work is listed in [§6](#6-optional-and-deferred-work).

This file holds the plan and a single dated status snapshot; it is not a session log.
Per-unit evidence and historical gate counts live in the [evidence ledgers](ledgers/); the
current position and next unit are in [extraction-checkpoint.md](extraction-checkpoint.md).

## 2. Status — 8 October 2026

| Measure                              | Value                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Canonical files (`npm run validate`) | 512, passing                                                                                            |
| Tests (`npm test`)                   | 4,134 passing, 2 optional provider tests skipped                                                        |
| Sections extracted / reviewed        | 504 / 679 extracted (74%), 309 independently reviewed (46%); 36 compatibility redirects excluded        |
| Unfinished non-quest sections        | 115, of which 43 have no citing record (`npm run report:chapters`); tiers 1–5 are closed                |
| Procedures / state machines          | 113 / 2                                                                                                 |
| Review records                       | 221: 196 unresolved, 25 resolved (most by published designer rulings)                                   |
| Independent review records           | 24 fresh passing records under `review/independent/` (`npm run review -- check`)                        |
| Package F manifest                   | `accepted`: 41 implemented, 10 covered by another model, 1 nonprocedural, 43 catalogue scope            |
| Phase 11 build                       | `build:corpus` is a stub; `corpus/graph/` is empty                                                      |
| Phase 12 retrieval                   | Lexical retrieval, agent tools, MCP server and `ask` pipeline exist ([§5](#phase-12--retrieval-corpus)) |

Live progress lives in the generated [coverage report](coverage-report.md) and the
[Package F acceptance manifest](../tests/fixtures/acceptance/package-f.json). Update this table
when a step below closes, not after every unit.

**Done within documented scope:** Phases 0–3; Phase 4 core mechanics; Phase 5 Batches 1–7
(catalogues, including all quest, personal-quest and estate catalogue records); Phase 6
Batches 1–7 (Packages A–F); Step 2 tiers 1–5 (Introduction through Combat, reconciled and
independently reviewed). Published designer rulings are applied per the
[extraction guide](extraction-guide.md).

### Why the order changed

Until 3 October the plan finished Package F (per-quest ordered lifecycles) before anything
else. That has stopped paying for itself:

- Each quest lifecycle so far has cost one bespoke procedure and 15–70 derived regressions,
  mostly modelling supplied-outcome bookkeeping (once-only markers, replay guards). The 55
  remaining quest and personal-quest entries would add thousands of such tests. They verify
  the model against itself, not against the PDF.
- Quest catalogues (setup, Threat, special rules, rewards, local entities and tables) are
  already extracted and are what rules lookups and the helper app consume.
- Core chapters are much weaker. 267 non-quest sections are unfinished. Most of the gap is
  undispositioned components (`not_started` rather than extracted or `not_applicable`), but
  some is missing extraction: Basic Stats, The Tiles and Difficulty have no records citing them.
- Nothing has been independently reviewed. Every answer the retrieval tools give rests on
  unchecked extraction.

So the work below reconciles and reviews core chapters first. Per-quest lifecycles become
optional ([§6](#6-optional-and-deferred-work)).

## 3. Prioritised work

Run these in order. Each step has an exit condition; shared gates are in
[§7](#7-shared-gates-and-final-closure).

### Step 1 — Close Package F at reduced scope (done 7 October)

Package F (Phase 6 Batch 7) stays required for shared lifecycle models and becomes optional for
per-quest ordered lifecycles.

1. **Done 7 October.** Add the `catalogue_scope` disposition to the acceptance manifest schema
   and checker (`shared_lifecycle_rows`, `deferred_work`). It may close a quest or
   personal-quest row only when:
   - its catalogue records exist and resolve;
   - the shared lifecycle models it relies on are `implemented` (quest acceptance, departure,
     shared dungeon progression, Threat events, reading, aftermath);
   - the row names its ordered-lifecycle work as deferred, so the gap stays discoverable.

   This records reduced scope; it is not a claim that the lifecycle was modelled.

2. Finish the five audit rows. These are composition audits of existing procedures, not new
   models: Magic Damage, Bleeding Out's advanced rule, Rations and Resting, Cure Disease and
   Poison, Rest and Recuperation.
3. Finish the shared quest rows the campaigns depend on: Random Quests selector, campaign parent
   progression (The Dead Rising, Lair of the Spider Queen, Ancient Lands, Side Quests).
4. Finish the estate lifecycle (PDF 160–166): purchase, furnishing, Ghostly Events Table and The
   Grieving Mother. Estate restrictions are rules players apply at the table.
5. Disposition the remaining Quest Book I and personal-quest rows as `catalogue_scope`.
6. Run the Phase 5/6 exit reconciliation the ledgers name, including the candidate-loop audit.

**Exit:** the manifest has no `pending` rows; final acceptance passes; Phase 6 Batch 7 is marked
complete at the documented scope in the [Phase 6 ledger](ledgers/phase-6-procedures-and-state-machines.md).

**Outcome:** Package F is `accepted` (41 implemented, 10 covered by another model, 1
nonprocedural, 43 `catalogue_scope`). The estate's source-silent readings are caller-supplied
inputs. The Phase 0–6 exit checklist (`tests/fixtures/acceptance/phases-0-6.json`) has 79 of 85
rows verified; the 6 still pending are assigned below and close with the steps that own them.

### Step 2 — Core-chapter loop: reconcile, extract, review

This brings Phase 10 forward for the core book and runs Phases 8 and 9 alongside it, one chapter
at a time. Work in dependency order:

1. Introduction and Game Basics
2. Character Basics, Creating Your Character, Levelling Up, Embarking on Your First Quest
   (its starting-settlement roll on PDF 59 has no record)
3. Equipment, Psychology
4. Magic, Magic Items, Enchantments, Alchemy, Prayers
5. Into the Dungeons, Treasure, Combat (done 8 October; closed the exit rows for Healing PDF 100,
   Identifying Items and Potions PDF 100, optional Dungeon Events PDF 107, and the table nodes on
   PDF 91/94–98/104/105/115/119/121)
6. Travelling and Skirmishes, Settlements, guilds, Inner Sanctum, Buying an Estate
7. Appendices I–V, Adding a Third Dimension, front and back matter

For each chapter:

1. **Reconcile.** For every section and component, determine from the PDF whether it is
   - already represented, so coverage is wrong;
   - genuinely missing, so extract it; or
   - not mechanical, so mark it `not_applicable` with a reason.

   Do not reach 100% by marking unfinished extraction `not_applicable`.

2. **Extract** omissions in bounded units (one heading, one table, or 1–4 pages).
3. **Examples** (Phase 8, below) found in the chapter: classify each one, and turn the
   executable ones into fixtures.
4. **Independent review** (Phase 9, below) of the chapter by someone other than the extractor,
   recorded as review evidence. Only then may its sections become `reviewed`.

Tooling (in place since 7 October):

- `npm run report:chapters -- --chapter <name>` lists each chapter's unfinished sections, open
  components and citing records. "No records" sections are a reconcile list, not confirmed
  gaps: many are part, chapter-root or front/back-matter nodes, and a generated table may be
  cited through its parent heading.
- Independent review uses the `corpus-reviewer` agent (`.claude/agents/corpus-reviewer.md`),
  review records under `review/independent/`, and `npm run review -- digest|check`. The format,
  digest and staleness rules are in the [extraction guide](extraction-guide.md#independent-review).
- Only an `extracted` section can be promoted to `reviewed`, so reconcile a section to
  `extracted` before reviewing it. The reviewer reports findings; the extraction side applies
  corrections and a new review run confirms them.

Prioritise review of the chapters players consult most: Combat, Into the Dungeons, Settlements,
Character Basics.

**Exit:** every non-quest section is `extracted` or has justified exclusions, and has
independent-review evidence.

### Step 3 — Quest Book I and personal quests: reconcile and review

Apply the Step 2 loop to Quest Book I, backgrounds and the estate side quest at catalogue scope.
Their catalogue inventory is already accepted (Package E), so this step is mainly component
disposition and independent review. Quest rules remain scenario-scoped.

**Exit:** Phase 10's full-book exit holds ([§4](#phase-10--full-book-reconciliation)).

### Step 4 — Dependency graph and precedence (Phase 7)

Run after Steps 2–3 so the graph covers the reconciled corpus. Omissions it exposes go back
through the Step 2 loop. This step also closes the Phase 6 exit row "procedure steps reference
rules rather than duplicate them", which needs a duplication check.

The remaining open Phase 0–6 exit rows close in Phase 10 (Steps 2–3): a page-by-page table
inventory (including turning the duplicate PDF 186 table node into a redirect), typed dice for
the 63 table rows that print dice only in text, and an audit that printed restrictions are
rules.

### Step 5 — Compile (Phase 11), then complete retrieval (Phase 12)

See [§5](#5-compile-and-make-the-corpus-retrievable).

## 4. Comprehensive passes

These phases form a correction loop. Omissions found later return to extraction, dependency
checks, examples and independent review before closure.

### Phase 7 — Dependencies and precedence

- Derive a typed graph from existing references, dependencies, table/entity links and overrides.
- Add source-backed canonical relationships for distinctions not currently expressible,
  particularly `summary_of` and `expanded_by`. Do not duplicate relationships already encoded.
- Preserve edge direction, relationship type, originating object/field and provenance.
- Report dangling references, unresolved pointers, cycles, duplicate candidates and potentially
  conflicting relationships. Classify legitimate reference cycles separately from problematic
  execution or precedence cycles. The `remaining_poison` bounded re-entry already has a recorded
  disposition.
- Provide forward and reverse traversal so tooling can answer "what could affect this rule?".
  `lod_expand` already traverses recorded relations; the graph should become its source.
- Never infer that later text overrides earlier text only because it is later or more detailed.

**Exit:** every unresolved pointer and graph anomaly has a recorded disposition; internal ID
references resolve; overrides and external boundaries are discoverable.

### Phase 8 — Worked examples and diagrams

- Inventory examples throughout prose, captions, tables and diagrams, not only nodes already
  labelled `example`.
- Classify each as executable, descriptive, source-conflicted or dependent on missing information.
- Convert executable examples into fixtures asserting both outcome and applied-rule trace.
- Keep source examples distinct from derived boundary cases. Preserve contradictory example
  results as review evidence rather than adjusting expected values to match the implementation.

**Exit:** every identified example has provenance and a disposition; all executable examples
have passing outcome-and-trace checks.

### Phase 9 — Independent review and uncertainty audit

- First, add schema-validated review records: reviewer, source scope, examined object IDs,
  findings, disposition, and the reviewed corpus revision or content digest.
- Require a reviewer distinct from the extractor to compare directly with the PDF. Tests and
  prior extraction audits are supporting evidence, not substitutes.
- Correct transcription and modelling errors, and verify the repairs independently.
- Retain genuine ambiguity, contradictory text, typos, undefined behaviour and absent-source
  dependencies. Published designer rulings may resolve an issue as the extraction guide describes.
- Permit `reviewed` status only when review evidence exists. Later material edits invalidate the
  affected evidence until rechecked; a test should enforce this through the digest.

**Exit:** every completed review unit has evidence; no known uncertainty exists only in informal
notes. An unresolved source issue may remain after successful review.

### Phase 10 — Full-book reconciliation

- Audit all 286 pages and every canonical section, including front matter, appendices,
  captions, optional rules and quest material.
- Reconcile each component against actual objects. A "remaining table" may be a missing
  extraction, an already represented table with incorrect coverage, or non-mechanical content;
  determine which from the PDF.
- Record explicit reasons for non-applicable components and exclusions. Preserve
  section/coverage bijection and compatibility redirects.
- Extract omissions in bounded units, then repeat the affected Phase 7–9 checks.

Steps 2–3 carry out this phase chapter by chapter.

**Exit:** no unexplained coverage gaps remain, and every applicable component has extraction
and independent-review evidence.

## 5. Compile and make the corpus retrievable

### Phase 11 — Deterministic compilation

Replace the `build:corpus` stub only after the completeness gate.

- Reuse schema-validated loading and integrity checks across the entire corpus: mechanics,
  terms, aliases, sources, sections, issues, relationships, review evidence and fixtures.
- Generate JSON bundles per record class (including procedures, state machines and supporting
  records, so no canonical class disappears) and the Phase 7 dependency graph.
- Produce a versioned manifest with input fingerprints, record counts and output checksums.
  Exclude wall-clock timestamps and machine-specific paths from deterministic payloads.
- Preserve canonical IDs, source order where meaningful, unresolved issues and external
  dependency markers.
- Validate before publishing. Build into staging, verify the complete set, and keep the
  previous successful artifacts if generation fails.
- Make the retrieval index (`npm run retrieve -- build`) and the web client's bundled corpus
  read these bundles instead of loading YAML separately.

**Tests:** repeat-build checksum equality in the pinned environment; provenance round trips;
graph traversal; invalid-input rejection; failed build preserving previous output.

SQLite output is optional ([§6](#6-optional-and-deferred-work)).

### Phase 12 — Retrieval corpus

**Already built** (see [retrieval.md](retrieval.md)):

- `scripts/retrieve/`: lexical retrieval over all canonical records with provenance, quest
  scope, relations, review issues and external dependencies (`npm run retrieve`).
- `scripts/retrieve/tools.ts`: agent tools (`lod_search`, `lod_resolve`, `lod_get`,
  `lod_expand`) shared by the CLI, `clients/mcp/` and direct API clients. They return
  rulebook content only, never corpus bookkeeping.
- `scripts/ask/`: question analysis, evidence gathering and grounded prompts. Its labelled
  question set is evaluated with `npm run ask:evaluate`.
- `clients/web/`: a consumer that answers rules questions. It is not a Phase 12 deliverable.

**Remaining:**

- Generate retrieval documents from the Phase 11 bundles, not directly from YAML.
- Expose review status and uncertainty in the corpus-work CLI (`retrieve search|get|issues`).
  Agent tools keep hiding bookkeeping, but must keep conflicting rules and unavailable-source
  notices visible.
- Keep complete tables in structured artifacts; retrieval summaries point back to those records.
- Add a fixed acceptance query suite covering terminology, combat modifiers, optional rules,
  service eligibility, quest-local exceptions, conflicting passages and missing external
  material. Exact IDs and aliases must resolve reliably; lexical cases must return their
  expected records within a documented result limit; every hit must keep provenance. Review
  and reuse the existing labelled questions (their labels are currently unreviewed).

No application, API server, gameplay runtime or embedding service is required. Consumers stay
under `clients/` and outside the root gate.

## 6. Optional and deferred work

These are not needed to complete the corpus. Do them only when a consumer needs them.

- **Per-quest ordered lifecycles** for the Quest Book I and personal-quest rows closed as
  `catalogue_scope` in Step 1. The seven quests already modelled (First Blood, Returning the
  Relic, Slaying the Fiend, Closing the Portal, Retrieving the Family Heirloom, Stopping the
  Necromancer, Tomb Raiders) and the shared quest procedures stay as they are. Take on more only when a
  consumer, such as the helper app, needs ordered state for a specific quest, and keep each to
  its source heading.
- **SQLite output** from Phase 11. Add it if a consumer needs indexed queries; retrieval works
  without it.
- **Vector indexing** for retrieval.
- **Semantic-provider calibration** and production-provider selection
  ([semantic-decisions.md](semantic-decisions.md)). This includes the Laya/Jev union in `ask`.

## 7. Shared gates and final closure

After every extraction or tooling unit:

1. Run `npm run validate`, `npm test`, `npm run report:coverage` when coverage changes,
   `npm run lint` and `git diff --check`.
2. Record source scope, delivered objects, unresolved boundaries and gate results in the
   relevant ledger or [extraction-checkpoint.md](extraction-checkpoint.md), not in this file.
3. Advance only when the step's inventory is complete. Passing tests alone do not close
   extraction.

Constraints carried over from Package F:

- Preserve the test interpreter's meaning: `invoke` records a handoff; a failed `require` does
  not halt a procedure. Guard consequential steps explicitly.
- Keep hero, party, visit, quest and estate state ownership as documented in
  [lifecycle-procedures.md](ledgers/lifecycle-procedures.md).
- Supply dice, geometry and unavailable external outcomes explicitly.
- Add schema capabilities only when a demonstrated source requirement cannot fit the existing
  model; update types, validators and fixtures together.

For final release readiness:

- Run the complete validation, example, review-evidence and coverage checks.
- Build twice from identical inputs and compare artifacts.
- Run representative queries and the retrieval acceptance suite against the built artifacts.
- Verify that the documented commands reproduce the outputs in a clean checkout with the
  declared toolchain.
- Update this plan to separate completed core phases from optional deferred work and remaining
  genuine source uncertainties.
