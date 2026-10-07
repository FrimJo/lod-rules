# Extraction guide

## The PDF is the source of truth

`source/Rulebook-2nd-printing-ENGa.pdf` is authoritative. Everything under `corpus/` is a
compiled interpretation of it. When the two disagree, the PDF wins and the corpus is wrong.

## Every fact carries provenance

A structured rule without a source reference is incomplete. Each extracted object records
at least one source reference matching `schemas/source-reference.schema.json`:

```yaml
source:
  - document: rulebook.second_printing.eng
    file: source/Rulebook-2nd-printing-ENGa.pdf
    printed_page: 18
    pdf_page: null
    section: Game Basics
    heading: Turn Sequence
    extraction:
      method: text
      confidence: high
      visually_verified: false
```

### printed_page is not pdf_page

- `printed_page` is the label printed on the page in the book.
- `pdf_page` is the physical 1-based page index in the PDF file.

They are tracked separately and neither is derived from the other. Either may be `null`
while still unknown.

`corpus/source-map/pages.yaml` holds the numbering map: one entry per physical page, with
the folio the book prints on it. The offset is `printed = pdf - 2` from pdf page 3 onward,
but do not compute it — look it up. Three pages carry a folio the book misprints, several
divider and full-page-art pages print no folio at all, and pdf pages 1–2 sit ahead of the
printed sequence entirely. Each of those pages says so in its `notes`.

## Canonical versus generated

| Layer               | Location                         | Editable by hand            |
| ------------------- | -------------------------------- | --------------------------- |
| Source document     | `source/`                        | No (only added or replaced) |
| Canonical corpus    | `corpus/`, `review/`             | Yes, reviewed               |
| Schemas and tooling | `schemas/`, `scripts/`, `tests/` | Yes, reviewed               |
| Build artifacts     | `generated/`                     | **Never**                   |

`generated/` is gitignored. PDF dumps are reproduced with `inspect-pdf.ts`; corpus build
outputs are deferred until Phase 11 (`npm run build:corpus` is currently a stub).
If a generated file is wrong, fix the canonical input and rebuild. Documentation generated
from canonical data — currently `docs/coverage-report.md` — follows the same rule.

## Uncertainty and evidence-backed resolutions

When the source is unclear:

1. Preserve the original meaning as faithfully as possible.
2. Mark the interpretation as uncertain.
3. Add a record under `review/`.
4. Keep every relevant source reference.
5. Do not "fix" the rule.

The corpus must be able to state that the rulebook does not define something. That is a
valid answer, and it is better than an invented one.

### Official rulings

Published designer rulings can settle an issue. Their sources are archived under `source/`
and declared in `source/manifest.yaml` as non-canonical `official_errata` (the von Braus 2.2x
changelog) or `official_faq` (the official FAQ). Changelog citations give `pdf_page`, the
version as `heading` and the entry number as `locator.row`. FAQ citations give the exact
question as `heading` and no pages.

- Printed `source_text` stays verbatim. The ruling never rewrites the quotation.
- Executable effects follow the ruling. Each changed rule, procedure step or fixture cites
  both the rulebook page and the ruling.
- A ruling that settles the whole issue sets `status: resolved` with a `resolution` citing it.
- A ruling that settles only part of an issue is added to its `source` list and summary; the
  issue stays unresolved, and only the settled effects change.
- A ruling marked "Fixed" without a stated rule settles nothing.

Research notes and applied status are in `review/designer-published-rulings.md`.

## External sources are recorded, never invented

The rulebook defers some material to the Bestiary, the Charts Compendium, Quest Book II,
and the Companions' Compendium. Those are declared in `source/manifest.yaml` with
`status: not_present`, and the sections that cite them carry `external_references`.

Reference them as an external dependency. Never write down enemy statistics, encounter
tables, or chart values that are not in this PDF. If the PDF names a book the manifest does
not list, add it as `not_present` rather than dropping the citation.

## Cross-references inside the book

A section that points elsewhere in the rulebook records the target in `see_also`, using the
id of the section it resolves to. When a pointer cannot be bound to an id — the book cites a
page or appendix that does not line up with anything in the map — record the original
wording in `unresolved_references` instead. Never invent an id to make one go away.

## Working unit

Extract in small, reviewable units — one heading, one table, or a tightly related 1–4 page
range. Validate after each change and commit independently where practical.

## Visual verification

PDF text extraction is not always trustworthy. Render and inspect the page when a table
looks malformed, columns interleave, text order is suspicious, symbols are missing, a
diagram carries rules, or footnotes appear detached. Record the result with
`extraction.visually_verified: true`. OCR is a last resort, not a first choice.

## Independent review

`reviewed` means a reviewer other than the extractor compared the canonical records with the
rendered PDF and recorded the evidence. Nothing becomes `reviewed` without a record.

**Records** live in `review/independent/<chapter>.yaml` as YAML arrays, validated by
`schemas/independent-review.schema.json`. Each record has an id `review.<unit>.<n>`; a
`reviewer` (`agent` with `model` and `run_id`, or `human` with `name`) whose `independence`
states it did not author the extraction and did not use extraction ledgers as evidence; a
`date`; a `scope` of section ids plus every PDF page actually rendered (with its printed page
from `pages.yaml`); the `examined_objects` with per-object digests; the `digest`; `findings`;
an `outcome`; and a `summary`. Each finding names its section, optionally an examined object,
a kind, a description, a source reference and a disposition: `corrected` (the verified change),
`recorded_as_issue` (an `issue.*` id in `review/ambiguities.yaml`), `no_change_needed`, or
`open` (with a proposed correction). `passed` allows no open or corrected findings,
`passed_with_corrections` needs at least one verified correction and none open, and `failed`
needs at least one finding. A passing record must inspect every PDF page of its sections.

**Digest** (`lod-review-digest/v1`, `scripts/validate/independent-review.ts`). The examined
objects are the scoped sections (their `sections.yaml` and coverage rows), every term, rule,
table, entity, procedure, state machine and test case whose `section_id` is in scope, and every
issue related to one of those. Each object is hashed as SHA-256 over canonical JSON of
`{ kind, id, content }`: keys sorted at every depth, array order kept, no whitespace, so YAML
layout, comments and file placement do not matter. `status: reviewed` is hashed as `extracted`
so promotion does not invalidate the evidence. The content digest hashes the algorithm name,
the SHA-256 of the canonical PDF, the sorted section ids and the sorted `[id, kind, digest]`
list.

**Staleness.** `npm run validate` allows a coverage row, a coverage component or an object to be
`reviewed` only if the latest record covering its section (by date, then id) passed, has no
open findings, and its digest still matches the corpus. Any material edit, added or removed
object, related-issue change or replaced PDF makes it stale; the error names the section and the
changed, added or removed objects. Because promotion hashes as `extracted`, only rows and
components that were `extracted` (or `not_applicable`) when reviewed can be promoted. A stale
record that backs nothing is history, not an error.

```bash
npm run review -- digest section.combat --descendants   # scope, pages, objects, digest
npm run review -- check                                 # fresh / stale / invalid records
```

**Agent protocol.** The reviewer is the `corpus-reviewer` subagent
(`.claude/agents/corpus-reviewer.md`), run in a fresh context on one bounded unit. It renders
every page itself, reads only the PDF, the canonical YAML and `pages.yaml` (never
`docs/ledgers/` or the extraction checkpoint; tests are supporting evidence only), and writes
only its review record and new unresolved issues.

**Correct, then re-review.** The reviewer does not fix the corpus. Errors become `open` findings
with proposed corrections, and the record fails. The extraction side applies the corrections
(which also makes the record stale), then a new review run checks them against the page and
writes a new record whose findings are `corrected`. Only that record can back `reviewed`.

## Before finishing a change

```bash
npm run validate
npm test
npm run report:coverage
npm run lint
```

## Phase 2 glossary status

The scoped Phase 2 extraction is complete, with unresolved issues and no independent
review claim. See [ontology.md](ontology.md) for source units, excerpts, exclusions, and
classification conventions. Later objects may cite existing `term.*` ids. The bounded Phase 3 rules, tables,
procedures, entities, and fixtures are documented in [phase-3-pilot.md](ledgers/phase-3-pilot.md);
further extraction still requires its authorized phase.

Terms and review issues require source references. Validation checks document membership,
section and related ids, unique case-insensitive alias lookup, and agreement with the
canonical page map. External-book page numbers are not checked against the rulebook map.
Use `review/ambiguities.yaml` for uncertainty, with an `issue.*` id, type, summary, related
ids, source references, and `status: unresolved`. Preserve conflicting quotations there;
never make a glossary definition silently settle a rules question.

Keep issue IDs and original concerns after resolving them. A resolved issue uses
`status: resolved` and requires `resolution: { summary, source }`; its evidence uses the
same source-reference schema and document/file/page checks as the original concern.
Unresolved records have no `resolution` field. Historical `issues` metadata may link to
either status, but executable unresolved effects, usage-limit aggregation issues, and
fixture expectations must reference an unresolved issue. Closing a review issue does not
promote corpus objects or the pilot to independently `reviewed`.

A source-map compatibility record may use `redirect_to` to preserve an erroneous duplicate
ID. Its target must exist, be nonredirecting, and have the same kind and printed/PDF page
span. Self-links, chains, and cycles are invalid. Keep one coverage row for every ID,
including redirects: redirect rows stay `mapped` with all six components `not_applicable`.
Coverage reports list redirects separately and exclude them from extraction counts and
remaining work. New extraction uses the canonical target. A mapped heading or a repaired
link does not claim that its mechanics have been extracted.

## Phase 3 pilot conventions

See [phase-3-pilot.md](ledgers/phase-3-pilot.md) for scope, source evidence, and review status.
New canonical collections and `tests/examples/` are discovered recursively and validated.
Objects require precise source references and extraction status; all current pilot objects
are `extracted`, not independently reviewed. Table rows inherit source provenance and add
`source_row`; procedure steps inherit their parent's provenance unless explicitly overridden.

Use typed conditions/effects for mechanics and keep source wording alongside them. Unextracted
named dependencies may link to existing sections, but must not use nonexistent object IDs.
Optional `entities` coverage records only audited applicability. Partial tables list their
selected source rows and remain `extracting` in coverage. The small interpreter is test-only;
never promote it to a game runtime or infer missing dependency behavior from its fixtures.
