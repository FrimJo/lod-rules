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
order, and each record's canonical YAML path. Output is staged and verified before it
replaces the previous build, and identical inputs give byte-identical files.

`npm run retrieve -- build` already writes an early retrieval slice to `retrieval/`
(`search-documents.jsonl`, `retrieval.sqlite`, `manifest.json`). See
[docs/retrieval.md](../docs/retrieval.md).

`npm run graph -- build` writes the derived dependency graph to `graph/` (`nodes.json`,
`edges.json`). Retrieval reads its relations from the same graph module.
