# Docs

Start with the [completion plan](corpus-completion-plan.md) for what remains, then the
[extraction checkpoint](extraction-checkpoint.md) for the next unit of work.

## Plan and status

| Doc                                                        | Purpose                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [corpus-completion-plan.md](corpus-completion-plan.md)     | Prioritised remaining work, phase exit conditions, dated status |
| [extraction-checkpoint.md](extraction-checkpoint.md)       | Current position, next unit, and which ledger owns it           |
| [coverage-report.md](coverage-report.md)                   | Generated section/component progress; never edit by hand        |
| [../LOD_RULES_CORPUS_PLAN.md](../LOD_RULES_CORPUS_PLAN.md) | Original phase design and data model                            |

## Conventions

| Doc                                            | Purpose                                                |
| ---------------------------------------------- | ------------------------------------------------------ |
| [extraction-guide.md](extraction-guide.md)     | Provenance, page labels, uncertainty, official rulings |
| [naming-conventions.md](naming-conventions.md) | Id namespaces and stability                            |
| [ontology.md](ontology.md)                     | Glossary scope and terminology distinctions            |

## Consumers of the corpus

| Doc                                                    | Purpose                                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| [retrieval.md](retrieval.md)                           | Lexical retrieval, agent tools, `ask` pipeline, labelled questions   |
| [ask-quality-evaluation.md](ask-quality-evaluation.md) | Evidence relevance and answer-quality evaluation, filter calibration |
| [semantic-decisions.md](semantic-decisions.md)         | Optional Laya/Jev judgment layer; never changes canonical rules      |

Client-specific docs live with each client: [`clients/web/`](../clients/web/README.md) and
[`clients/mcp/`](../clients/mcp/README.md).

## Evidence ledgers

[`ledgers/`](ledgers/) holds per-phase and per-package extraction evidence: source units,
regressions, unresolved boundaries and historical gate counts. The
[extraction checkpoint](extraction-checkpoint.md#evidence-ledgers) maps each scope to its
ledger. Ledgers are append-only records; acceptance fixtures and
`corpus/source-map/coverage.yaml` cite their paths.
