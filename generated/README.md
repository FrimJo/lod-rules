# Generated artifacts

Everything in this directory is **build output**. It is reproducible from the canonical
YAML under `corpus/` and `source/`.

## Rules

- Never hand-edit files in this directory.
- Never treat a file here as a source of truth.
- Any change must be made to the canonical corpus and then rebuilt.

Files here are gitignored (this README is the only tracked file).

## Expected contents

Produced by `npm run build:corpus` once Phase 11 is implemented:

```text
rules.json
entities.json
tables.json
dependency-graph.json
search-documents.jsonl
lod-rules.sqlite
```
