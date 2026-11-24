# Generated artifacts

Everything in this directory is **build output**. It is reproducible from the canonical
YAML under `corpus/` and `source/`.

## Rules

- Never hand-edit files in this directory.
- Never treat a file here as a source of truth.
- Any change must be made to the canonical corpus and then rebuilt.

Files here are gitignored (this README is the only tracked file).

## Expected contents

`npm run build:corpus` validates the canonical corpus and, only if it is valid, writes
`corpus/`: one JSON bundle per record class plus `manifest.json`
([schema](../schemas/corpus-bundle-manifest.schema.json)). Each bundle is
`{ "records": [...], "files": { key: path } }`: the records exactly as authored, in source
order, and each record's canonical YAML path. `graph.json` is the derived dependency graph
(`{ categories, nodes, edges }`, as `scripts/graph/` derives it); `readGraphBundle` in
`scripts/build/` loads it for `scripts/graph/traverse.ts`. Output is staged and verified
before it replaces the previous build, and identical inputs give byte-identical files. The
layout and manifest contract for consumers is [docs/corpus-bundles.md](../docs/corpus-bundles.md).

`npm run retrieve -- build` writes the retrieval index to `retrieval/`
(`search-documents.jsonl`, `retrieval.sqlite`, `manifest.json`) from those bundles,
building them first when they are missing or stale. See
[docs/retrieval.md](../docs/retrieval.md).

`npm run graph -- build` writes the derived dependency graph to `graph/` (`nodes.json`,
`edges.json`). Retrieval reads its relations from the same graph module.
