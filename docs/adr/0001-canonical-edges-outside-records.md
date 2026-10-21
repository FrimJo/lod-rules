# Canonical edges live in `corpus/graph/`, not on records

A relation that neither record states (first: the PDF 59 start-settlement roll supplying the
first quest acceptance's `settlement`) is a hand-authored canonical edge in `corpus/graph/`,
with its own schema, source reference and independent review. It is not a new entry in either
record's `dependencies[]` or `see_also`. The relation belongs to neither endpoint, and editing
an endpoint would stale the independent review that freezes it. The graph module merges
canonical edges with derived ones, so consumers see one graph.

## Considered options

- **Inline `dependencies[]` on the consuming record.** This reuses an existing field, but every
  binding would reopen a frozen record's review. A plain `object_id` also can't express a
  field-level binding or a quoted condition.
