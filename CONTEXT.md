# League of Dungeoneers rules corpus

A machine-readable compilation of the _League of Dungeoneers_ second-printing rulebook. This
glossary covers the corpus's own vocabulary; rulebook terms live in `docs/ontology.md`.

## Language

### Dependency graph

**Derived edge**:
A relation between two corpus records that is read out of a field one of them already carries.
_Avoid_: implicit edge, computed link

**Canonical edge**:
A hand-authored, independently reviewed relation between two corpus records that neither record
states, kept apart from both records.
_Avoid_: manual edge, graph override

**Binding**:
A canonical edge stating that a field of one record takes its value from a field of another
record, under a quoted source condition.
_Avoid_: wiring, mapping, link
