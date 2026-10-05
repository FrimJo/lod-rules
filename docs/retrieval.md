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
question → analysis (lexical | Laya | Jev | Laya→Jev cascade) → deterministic evidence → grounded prompt → LLM → citation check
```

```bash
npm run ask -- "How many hit points does Molgor have?"                  # lexical, prints prompt
npm run ask -- "My hero is poisoned and bleeding out during a rest. What happens?" --analyzer laya
npm run ask -- "…" --analyzer laya --completer-cmd "cd /tmp && cursor-agent -p --trust --output-format text"
npm run ask -- "What happens when a wizard miscasts a spell?" --analyzer jev --filter  # Jev drops noise
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
therefore keeps the lexical analysis as `baseline`, and retrieval uses the union of both.
Each analysis gathers evidence within its own budget. The baseline's records come first,
and the model's records are appended after them. The model can add records but never
remove or displace one the baseline found. An earlier version merged both analyses into
one ranked list and then cut it to a budget. Model additions could then push baseline
records past the cap, which happened on 1–8 records per split of the labelled set.

`--analyzer cascade` asks Laya everything and then asks Jev only the answers Laya was
unsure of (`scripts/ask/cascade.ts`). A choice counts as unsure below a chosen-option
probability of 0.8, and a noul counts as unsure when it lies within 0.4 of 0.5. These floors are
`provisional-1`, chosen on the development split, and are not calibrated. If Jev fails or no
`TYPESAFE_API_KEY` is set, Laya's answers stand. If Laya fails, Jev answers everything.
`analysis.escalations` records each answer that was sent onward, with the reason and the
model whose answer was kept.

### Labelled questions

`tests/fixtures/ask-questions/cases.yaml` holds 102 rules questions in three splits:
development (34), validation (35) and held-out (33). The first 37 (12 / 13 / 12) date from
1 October; the other 65 were added on 5 October across combat, dungeon, treasure,
character building, psychology, settlements, travel, alchemy, magic and quests. The results
below cover the original 37 only. Each question is labelled with its
intent, its complexity, the one entity record it is about (or `null`), and the
`required_evidence` records a correct answer must be able to cite. Labels were drafted from
the canonical records they name and have not been independently reviewed
(`label_review: unreviewed`). Game systems are not labelled. Instead, "chapter coverage"
is measured mechanically: the share of required records whose chapter falls inside the
selected systems.

```bash
npm run ask:evaluate                 # lexical, laya, jev, cascade; writes generated/ask-eval/
npm run ask:evaluate -- --sweep      # also replays the cascade over a grid of floors
```

Jev answers are cached per question in `generated/ask-eval/jev-cache/`. The sweep replays
cascades from those answers, which is exact only because Jev questions in one call cannot
see each other. `--refresh` ignores the cache. `jev-latest` can change behind the cache.

Results on 1 October 2026 (Laya `68f27dfe`, `jev-latest`). Recall is the share of required
records in the evidence, shown as development / validation / held-out:

| Analyzer          | Recall alone   | Recall with lexical union | Intent (dev) | Chapter coverage (dev) |
| ----------------- | -------------- | ------------------------- | ------------ | ---------------------- |
| lexical           | 86 / 79 / 50 % | —                         | 83 %         | 76 %                   |
| laya              | 86 / 42 / 57 % | 90 / 79 / 64 %            | 33 %         | 38 %                   |
| jev               | 71 / 68 / 71 % | 86 / 89 / 79 %            | 92 %         | 95 %                   |
| cascade (0.8/0.4) | 62 / 63 / 64 % | 86 / 89 / 71 %            | 92 %         | 81 %                   |

What this shows:

- Alone, every model analysis drops 38–55 baseline records per split. The lexical union is
  required. With the union, no configuration loses a baseline record, and each one matches
  or beats lexical recall on every split.
- Jev plus lexical is the best measured configuration. It ties lexical on development and
  gains 10 points on validation and 29 on held-out, for about one extra record per question.
- Laya's system and intent judgments are weak: 5–38 % chapter coverage and 31–33 % intent
  accuracy. Its probabilities do not separate its right answers from its wrong ones.
  The cascade reaches Jev-level judgments only when nearly every answer is escalated. Across
  the sweep (choice floors 0.4–0.9, noul margins 0.1–0.4), it called Jev on 83–100 % of
  questions. At 0.8/0.4 it called Jev on all 37, so it saves no requests and scores below
  Jev alone on the held-out split.
- On the original case, "My hero is poisoned and bleeding out during a rest", Laya says
  `single_fact` at 0.34 and picks the alchemy item Poison. The cascade sends the complexity
  and four system answers to Jev, which gives `multi_rule`. Laya is at least 0.8 sure of
  Poison, though, so the cascade keeps that wrong entity. Jev alone picks no entity. The
  union still retrieves both rest checks either way.

Thirty-seven questions are too few to calibrate any of these numbers. Keep the union and
grow the labelled set before changing the policy.

**Evidence** (`evidence.ts`) is deterministic. It retrieves exact entities and their
rules and tables, then searches the entity's quest, the selected system chapters and
intent-specific kinds (terms for definitions, tables for value lookups), followed by an
unfiltered fallback search. For `multi_rule` and `judgment` it also follows one hop of
`see_also`, `uses_table`, `depends_on` and `step_rule` links. Complexity sets the budget
at 5, 7, 11 or 13 records. Each item records `why` it was selected and carries its
issues, external dependencies and citations.

**Relevance filter** (`ranking.ts`, opt-in with `--filter`) lets Jev remove noise from
the union pool, lexical records included. Jev gets the question and one candidate per
request (the same text the LLM would see, plus its issues and unavailable-book
dependencies) and chooses `direct`, `supporting` or `irrelevant`. Policy
`provisional-1` drops a record when p(irrelevant) ≥ 0.9, except records reached through
a `uses_table`, `depends_on` or `step_rule` link. It never adds a record. A record Jev
fails to judge is kept, and if no record can be judged the pool is used unfiltered.
`AskResult.filter` lists every keep/drop decision with Jev's probabilities. The filter
runs only on a model analysis. Calibration and answer-quality results are in
[ask-quality-evaluation.md](ask-quality-evaluation.md): on the labelled set it dropped no
required record, cut irrelevant evidence by about 70 % and regressed no answer against
the union. It is not the default until a larger reviewed label set confirms that.

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

`tests/ask/evaluate.test.ts` checks:

- that the label file loads and every id resolves;
- that on every labelled question, a model answering as widely as possible and one answering
  as narrowly as possible both keep every lexical record (the earlier merge failed both);
- that the cascade asks the fallback only the unsure answers, skips it when sure, and keeps the
  first answers when the fallback fails;
- per-question answer replay and scoring.

`tests/ask/ranking.test.ts` checks that the candidate pool matches `gatherEvidence` and
labels each record's sources, that the filter asks one relevance question per record,
drops only above its threshold, honours exact and linked protection and the budget cap,
keeps every record when the ranker fails, and that `ask()` filters only model analyses.

Not yet done: independent review of the question labels, a labelled set large enough to calibrate Laya and Jev, vector search,
semantic-provider calibration, and the full Phase 11 bundle with JSON/SQLite equivalence and
repeat-build checksums.

### Official ruling evidence

Source citations retain document identity, file, heading and row/other locators, including separately paginated errata and HTML FAQ headings. Resolved issues expose their historical concern and complete resolution separately. Q&A prompts apply a recorded resolution only to its linked issue, preserving original printed text and other unresolved boundaries. The morale table and short-rest rule both link to the entry-39 correction. The web client opens changelog sources separately from the rulebook viewer and downloads archived HTML FAQ evidence. Search format version 4 invalidates older indexes; the input fingerprint includes the source manifest.
