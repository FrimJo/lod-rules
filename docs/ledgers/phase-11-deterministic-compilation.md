# Phase 11 deterministic compilation

This ledger records Phase 11 of the [completion plan](../corpus-completion-plan.md#phase-11--deterministic-compilation):
compile the canonical corpus into validated, reproducible JSON bundles that every consumer
reads. Spec: GitHub issue #24 (tickets #25–#29). Counts below are point-in-time (24 November
2026, input fingerprint `d721c6f9…`).

The consumer contract is [corpus-bundles.md](../corpus-bundles.md). The exit checklist is
`tests/fixtures/acceptance/phase-11.json`, checked by `tests/schema/phase-11-acceptance.test.ts`.
No canonical YAML changed; the only new schema is `schemas/corpus-bundle-manifest.schema.json`.

## Validation on any root — #25

`validateCorpus` takes a root (default: the repository), so the build and tests validate a
temporary copy. `scripts/validate/canonical-files.ts` is the one canonical YAML reader for
validation, the build and retrieval. `tests/schema/validate-root.test.ts` breaks a copy one
way per case (schema, duplicate id, dangling `see_also`, coverage row without a section, YAML
parse error) and checks the offending file is named.

## Bundles and manifest — #26

`buildCorpus` in `scripts/build/index.ts` validates, compiles one bundle per record class with
a record-to-file map, writes the manifest, stages, verifies and swaps in. `npm run
build:corpus` wraps it. `tests/build/corpus.test.ts` drives it on a temporary copy: provenance
round trip against the YAML, manifest contract and schema, repeat build byte for byte, invalid
input rejected with every error, failed build keeping the previous output and no staging
directory left.

| Bundle                     | Records |
| -------------------------- | ------: |
| `source-documents.json`    |       4 |
| `external-sources.json`    |       6 |
| `terms.json`               |     117 |
| `aliases.json`             |     183 |
| `sections.json`            |     715 |
| `pages.json`               |     286 |
| `coverage.json`            |     715 |
| `rules.json`               |   1,929 |
| `entities.json`            |     669 |
| `tables.json`              |     224 |
| `procedures.json`          |     125 |
| `state-machines.json`      |       2 |
| `edges.json`               |      17 |
| `issues.json`              |     343 |
| `independent-reviews.json` |     239 |
| `test-cases.json`          |     787 |
| `graph.json`               |  20,710 |

`graph.json` holds 4,938 nodes and 15,772 edges. `issues.json` holds 295 records with
`status: unresolved` and 48 resolved. The manifest lists two checked-in evidence paths as
excluded: the acceptance checklists and the Phase 8 example inventory.

## Graph bundle — #27

`graph.json` serialises `deriveGraph` over the compiled class bundles, through the same typed
model retrieval loads; relations are never re-derived outside `scripts/graph/`. The build test
compares traversal over the bundle with traversal over a freshly derived graph for five ids,
including a canonical `input_from` binding, a summary and its expansion.

## Consumers read the bundles — #28

`loadCorpusBundles` (`scripts/build/load.ts`) returns the published bundles, building them
first when missing, of another format version, or stale against `fingerprintInputs`. Retrieval
(`npm run retrieve -- build`) and the web client's data bundle go through it; the retrieval
manifest records the corpus fingerprint. Read-only consumers (the MCP server, the web request
path) compile a stale corpus in memory and write nothing. `tests/retrieve/retrieval.test.ts`
and `tests/retrieve/tools.test.ts` pass unchanged; `tests/retrieve/bundles.test.ts` and
`clients/mcp/tests/corpus.test.ts` cover staleness and read-only loading.

## Docs and exit — #29

The bundle layout, record order, provenance maps, manifest and `format_version` policy are in
[corpus-bundles.md](../corpus-bundles.md). The repeat-build test runs in CI's gate job
(`npm ci` from the lockfile, Node 24, `npm test`). The checkpoint now points at Phase 12.

## Carry-overs into Phase 12

- `issue.sanity.inn_recovery_stay_limit`: the frozen `procedure.sanity_recovery` has no
  per-stay field, so the changelog #83 once-per-stay inn recovery limit is recorded, not
  enforced. Compiled as is, `status: unresolved` in `issues.json`.
- `issue.guild.alchemist_availability_merged_tables`: `table.guild.alchemist_availability`
  merges two printed Alchemists' Guild tables because 46 frozen records cite its rows.
  Compiled as is, `status: unresolved` in `issues.json`.

## Gate

24 November 2026: `npm run validate` passes (563 canonical files); `npm test` passes (5,010,
2 optional provider tests skipped); `npm run lint` passes. The web client's own tests (`clients/web`, `npm test`) fail 3 of 108 on
this branch, on `main` (0ebfe9f) and on the integration head before this ticket (8fd121d)
alike: `character-rules.test.ts` (Backgrounds, starting perks) and `gm-rules.test.ts` (light
sources) expect corpus wording that has since changed. They predate Phase 11 and are not
caused by it.
