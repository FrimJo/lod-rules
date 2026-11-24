# Compiled corpus bundles

`npm run build:corpus` compiles the canonical YAML into JSON under `generated/corpus/`. This
page is the contract for consumers, such as the helper app, that read the corpus without
parsing YAML or repeating the integrity checks. The bundles are build output: gitignored,
never edited, and rebuilt from `corpus/`, `review/`, `tests/examples/` and `source/`.

Code: `scripts/build/` (`buildCorpus`, `compileCorpus`, `loadCorpusBundles`,
`readGraphBundle`). Manifest schema:
[corpus-bundle-manifest.schema.json](../schemas/corpus-bundle-manifest.schema.json).

## Guarantees

- The build first runs every check `npm run validate` runs (schemas, duplicate ids,
  cross-file integrity, independent-review evidence, dice). If any fails, it exits non-zero,
  prints every error and writes nothing.
- Output is staged in a sibling directory, re-read and checked against the manifest (file
  set, counts, checksums), then swapped in. A failed build leaves the previous output as it
  was.
- Identical inputs give byte-identical files. Nothing depends on the clock or the machine:
  no timestamps, no absolute paths, POSIX separators only.
- Records are copied exactly as authored. Canonical ids, `source` references,
  `unresolved_references`, `external_references`, review issues of every status and the
  `not_present` books all survive compilation.

## Layout

Every class bundle has the same shape:

```json
{ "records": [ ... ], "files": { "<key>": "<repo-relative YAML path>" } }
```

`records` holds the records in source order: input files in path order, then file order.
Every class is authored in a deliberate order (sections in book order, pages by PDF page,
multi-file classes grouped by chapter), so no bundle re-sorts by id. `files` maps each
record's key to the YAML file it came from. It sits beside the records, so the records stay
exactly as authored. The key is `id`, except where noted.

| File                       | Records                                         | From                               |
| -------------------------- | ----------------------------------------------- | ---------------------------------- |
| `source-documents.json`    | Source documents (rulebook, official rulings)   | `source/manifest.yaml` `documents` |
| `external-sources.json`    | Books the rulebook cites, with their status     | `source/manifest.yaml`             |
| `terms.json`               | Glossary terms                                  | `corpus/glossary/terms.yaml`       |
| `aliases.json`             | Aliases; keyed by `form`                        | `corpus/glossary/aliases.yaml`     |
| `sections.json`            | Section map nodes, including redirects          | `corpus/source-map/sections.yaml`  |
| `pages.json`               | PDF-to-printed page labels; keyed by `pdf_page` | `corpus/source-map/pages.yaml`     |
| `coverage.json`            | Coverage rows, one per section                  | `corpus/source-map/coverage.yaml`  |
| `rules.json`               | Rules                                           | `corpus/rules/`                    |
| `entities.json`            | Entities                                        | `corpus/entities/`                 |
| `tables.json`              | Tables, with every row and footnote             | `corpus/tables/`                   |
| `procedures.json`          | Procedures                                      | `corpus/procedures/`               |
| `state-machines.json`      | State machines                                  | `corpus/state-machines/`           |
| `edges.json`               | Canonical graph edges and summaries             | `corpus/graph/`                    |
| `issues.json`              | Review issues, any status                       | `review/ambiguities.yaml`          |
| `independent-reviews.json` | Independent review records                      | `review/independent/`              |
| `test-cases.json`          | Worked-example test cases                       | `tests/examples/`                  |
| `graph.json`               | The derived dependency graph                    | the bundles above                  |
| `manifest.json`            | What was built from what                        | the build                          |

`external-sources.json` reads the `external_sources` list of the source manifest.

`graph.json` is `{ categories, nodes, edges }`, exactly as `scripts/graph/` derives it from the
compiled class bundles: nodes (`id`, `kind`, `title`, `not_present` for absent books), then
canonical and derived edges (`source`, `relation`, `target`, `category`, `field`,
`provenance`, plus `condition` and `derived` where set). Traversal over it
(`scripts/graph/traverse.ts`) gives the same results as over a freshly derived graph. Its
record count in the manifest is nodes plus edges.

## Manifest

`manifest.json` holds no timestamps, so it is byte-identical across identical builds.

| Field               | Meaning                                                                         |
| ------------------- | ------------------------------------------------------------------------------- |
| `format_version`    | Version of this layout and manifest (currently `1`)                             |
| `input_fingerprint` | SHA-256 over every input, as below                                              |
| `inputs`            | Canonical YAML path to the SHA-256 of its bytes, in fingerprint order           |
| `sources`           | Source documents by `id`, `file` and SHA-256: the exact PDF edition and rulings |
| `bundles`           | Bundle file to `{ records, sha256 }`: record count and SHA-256 of its bytes     |
| `excluded`          | Checked-in review evidence that is deliberately not compiled, with a reason     |

`input_fingerprint` hashes, for each key of `inputs` in the listed order, the path, a NUL
byte, the file's bytes and a NUL byte. `fingerprintInputs` in
`scripts/validate/canonical-files.ts` recomputes it from a checkout without building, which is
how `loadCorpusBundles` and the retrieval index detect stale bundles.

### Format version policy

`format_version` is bumped on any breaking change to the bundle layout or the manifest: a
bundle renamed or removed, a change to the `{ records, files }` shape, the graph shape, a
record key or the fingerprint scheme. Adding a bundle or an optional manifest field is not
breaking. Changes to canonical record schemas follow the corpus schemas in `schemas/`, not
this version. A reader should reject a `format_version` it does not know; `loadCorpusBundles`
rebuilds when the version differs from `CORPUS_FORMAT_VERSION`.

## Checking a copy

A consumer that copies the bundles can check them without the build:

1. Read `manifest.json` and check `format_version`.
2. For each entry of `bundles`, hash the file's bytes and compare with `sha256`; the parsed
   `records` length (nodes plus edges for `graph.json`) equals `records`.
3. To tell whether the copy matches a checkout, compare `input_fingerprint` with
   `fingerprintInputs` over that checkout.

Retrieval (`npm run retrieve -- build`) reads these bundles and records the same fingerprint
in its own manifest; see [retrieval.md](retrieval.md).
