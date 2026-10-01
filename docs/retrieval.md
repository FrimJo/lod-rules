# Retrieval

An early Phase 12 slice. It lets an LLM, or any other consumer, look things up in the
corpus without loading 7 MB of YAML into a prompt. It is lexical and local, with no
server, no embeddings and no gameplay runtime.

Retrieval is a projection. The canonical YAML stays authoritative, and every result
points back to its record id, YAML file and PDF pages.

## Commands

```bash
npm run retrieve -- search "how do I open a locked door"
npm run retrieve -- search "threat" --kind table --quest quest.chamber_of_reverence.closing_portal
npm run retrieve -- get table.quest.slaying_fiend.molgor
npm run retrieve -- resolve AP
npm run retrieve -- expand quest_actor.chamber_of_reverence.molgor --direction out
npm run retrieve -- issues term.battle
npm run retrieve -- build
```

Output is JSON. `build` writes `generated/retrieval/`:

| File                     | Content                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `search-documents.jsonl` | One search document per canonical record, sorted by id                     |
| `retrieval.sqlite`       | FTS5 index, documents, full canonical records, aliases and typed relations |
| `manifest.json`          | Format version, input fingerprint and JSONL checksum; no timestamps        |

The CLI uses the built database when its fingerprint matches the current corpus.
Otherwise it indexes the YAML in memory, which takes about two seconds. The build is
staged, so a failed build keeps the previous artifacts.

This is not `build:corpus`. Phase 11 still owns the full compiled bundle.

## Search documents

Each document covers a rule, entity, table, procedure, state machine, glossary term or
review issue. Code lives in `scripts/retrieve/`.

| Field                                   | Meaning                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `id`, `kind`, `type`, `title`           | Stable canonical id and record classification                                  |
| `aliases`                               | Glossary aliases and abbreviations (`AP`)                                      |
| `context`                               | Section and parent titles, which are often clearer than generated rule names   |
| `text`                                  | Source text; tables include every printed cell and footnote                    |
| `scope`, `quest_id`                     | `global`, `quest` or a rulebook scope; quest-local mechanics name their quest  |
| `citations`                             | PDF and printed pages with headings                                            |
| `relations`                             | Typed outgoing references (`see_also`, `uses_table`, `depends_on`, `concerns`) |
| `issue_ids`                             | Review issues that concern the record                                          |
| `unresolved_references`                 | Original wording of pointers the corpus cannot bind                            |
| `external_dependencies`                 | Material in books that are not present (Bestiary and others)                   |
| `review_status`, `issue_status`, `file` | Extraction/review state and canonical YAML path                                |

Search ranks with BM25 over title, aliases, context and text. Results matching more
of the query words get a boost. Quest-local records are demoted unless the query names
their quest (or a word that appears only in quest titles, such as "Molgor"), or a scope
or quest filter is given. Review issues are excluded by default; request them with
`--kind issue` or `issues <id>`.

## Wiring an LLM client

Expose the library (`scripts/retrieve/index.ts`, class `Retrieval`) to the model as
tools in the consuming client:

| Tool                     | Library call                                                  |
| ------------------------ | ------------------------------------------------------------- |
| `search(query, filters)` | `search(query, { kinds, scope, questId, limit })`             |
| `get(id)`                | `get(id)`, which returns the full canonical record and tables |
| `resolve(name)`          | `resolve(name)`                                               |
| `expand(id, direction)`  | `expand(id, { direction, relations, depth })`                 |
| `issues(id)`             | `issues(id)`                                                  |

A client in another language can query `retrieval.sqlite` directly.

Instructions that keep answers grounded:

- Search before stating any rule. Call `get` before quoting numbers or table rows.
- Rephrase with rulebook vocabulary when a search misses ("poison cure" rather than
  "recover from poison"). Search is lexical, not semantic.
- Cite record ids and PDF/printed pages for every claim.
- If a result has `scope: quest`, say which quest it applies to and do not generalise it.
- Report `issue_ids` and `external_dependencies`. "The rulebook does not define this"
  and "that is in the Bestiary, which is not available" are correct answers.
- Treat `review_status: extracted` as unreviewed. No section is independently reviewed yet.

Coverage is partial (see the [coverage report](coverage-report.md)). A missing result
can mean the section has not been extracted yet.

## Ask pipeline

`npm run ask` runs this flow end to end. The code is in `scripts/ask/`.

```text
question → analysis (lexical | Laya | Jev) → deterministic evidence → grounded prompt → LLM → citation check
```

```bash
npm run ask -- "How many hit points does Molgor have?"                  # lexical, prints prompt
npm run ask -- "My hero is poisoned and bleeding out during a rest. What happens?" --analyzer laya
npm run ask -- "…" --analyzer laya --completer-cmd "cd /tmp && cursor-agent -p --trust --output-format text"
```

**Analysis** (`analysis.ts`) asks, in one System One call:

- intent: a choice of seven options;
- complexity: `single_fact`, `single_rule`, `multi_rule` or `judgment`;
- one yes/no question per game system. There are nine systems, and each maps to rulebook chapters;
- the named entity the question is about, chosen from fewer than 20 candidates.

Exact names in the question ("Molgor", "Potion of Cure Poison") are matched
deterministically first. The `lexical` analyser answers the same questions without a
model and serves as the fallback when a model fails.

Laya and Jev are uncalibrated (`CALIBRATION_VERSION = uncalibrated-0`). A model analysis
therefore keeps the lexical analysis as `baseline`, and retrieval uses the union of both:
all selected systems, both intents and the larger budget. Model-only entities rank after
exact names and search results. The model can widen the evidence but never remove what
the baseline found. Review this policy only after measuring a labelled question set.

**Evidence** (`evidence.ts`) is deterministic. It retrieves exact entities and their
rules and tables, then searches the entity's quest, the selected system chapters and
intent-specific kinds (terms for definitions, tables for value lookups), followed by an
unfiltered fallback search. For `multi_rule` and `judgment` it also follows one hop of
`see_also`, `uses_table`, `depends_on` and `step_rule` links. Complexity sets the budget
at 5, 7, 11 or 13 records. Each item records `why` it was selected and carries its
issues, external dependencies and citations.

**Prompt and check** (`prompt.ts`) tell the LLM to answer only from the evidence, to cite
`[record.id]`, to name the quest for quest-scoped records, and to surface issues and
unavailable books. `checkCitations` marks an answer grounded only if it cites at least
one ID and every cited ID is an evidence record or one of its attached issues.

The repository ships no LLM client. `ask()` takes an injected `LlmCompleter`, and the
CLI's `--completer-cmd` pipes the prompt to any local command. Run agent CLIs from an
empty directory so they answer from the prompt rather than reading the corpus. The
analysis result is not written to the corpus.

## Tests

`tests/retrieve/retrieval.test.ts` checks document determinism and provenance, quest
scoping, exact ids and aliases, a fixed set of rulebook questions whose expected record
must appear in the top ten, filters, relations in both directions, review issues and
unavailable external material.

`tests/ask/ask.test.ts` uses a fixture model in place of Laya or Jev. It checks:

- the single-call question shape;
- that a chosen entity maps back to its record;
- the lexical fallback when a model fails;
- deterministic evidence that contains the expected rules;
- that a narrow model analysis cannot remove baseline evidence;
- prompt contents;
- that citations of invented IDs are flagged.

Not yet done: a labelled question set for calibrating Laya and Jev, vector search, semantic-provider calibration, and the full Phase 11
bundle with JSON/SQLite equivalence and repeat-build checksums.
