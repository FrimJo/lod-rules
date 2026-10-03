# Evidence relevance and answer quality evaluation

This offline consumer experiment compares lexical retrieval with the existing
lexical-plus-Jev union on the 37 questions in
`tests/fixtures/ask-questions/cases.yaml`. It does not modify production retrieval,
canonical rules, or the benchmark labels.

Run from the repository root:

```bash
node --import tsx clients/web/src/evaluation/run-quality.ts
# A one-question smoke run:
node --import tsx clients/web/src/evaluation/run-quality.ts --limit 1
```

The runner uses the web client's installed TanStack/OpenAI adapter and the configured
`OPENAI_MODEL` (default `gpt-5.5`). It requires `OPENAI_API_KEY` and
`TYPESAFE_API_KEY`, loading the root `.env.local` without printing credentials.
Questions and corpus excerpts are sent to these providers. All LLM client code stays
in `clients/web/`; the corpus tooling continues to use an injected client interface.

## Method

- Build an in-memory SQLite index from the current canonical corpus.
- Retrieve lexical and lexical-plus-Jev evidence for the same question. Reuse exact
  cached Jev judgments when available. Reject a Jev fallback rather than silently
  measuring lexical retrieval twice.
- Generate one answer per condition with the same answer model and production prompt
  builder. The analysis header is retained, so this measures the complete existing
  pipeline, not an evidence-only intervention.
- Present answers under counterbalanced anonymous A/B labels to a separate judge
  request using the same model. The judge gets the union's delivered evidence and
  untruncated reference documents for every candidate and labelled required record.
- Ask the judge to derive essential facts with source IDs, classify every candidate's
  relevance, and assess each answer's coverage, false claims, unsupported claims, and
  citation support. It may use only each answer's own delivered evidence when checking
  whether its claims are supported.
- Reject malformed, omitted, duplicate, or unresolvable judgments. Failed cases are
  reported separately and cause a nonzero exit; they are never counted as passes.

`generated/ask-quality/report.json` contains aggregate and paired results. Each
`askq.*.json` preserves the question, analyses, evidence, exact prompts, answers,
anonymous identity mapping, judge explanations, and metrics. The `cache/` directory
preserves exact model requests and outputs keyed by model and prompt content. Reruns
reuse these outputs; `--out generated/ask-quality-new-run` selects a fresh answer/judge
cache. Jev retains the existing per-question cache. The report records corpus and
label fingerprints, model names, request counts, and incomplete cases. A model alias
can change behind either cache.

## Metrics and limits

Required-record recall is separate from relevance. A record not named in
`required_evidence` may still provide useful context. The judge classifies delivered
records as direct, supporting, irrelevant, or uncertain. Precision counts direct and
supporting records as relevant, with lower/upper bounds for uncertain judgments.
Record counts and prompt character counts measure the added context burden; characters
are not token usage or cost. Relevance is measured per record, not per sentence.

An answer passes the strict correctness check only when all essential facts are
covered and the judge finds no incorrect claims, unsupported claims, or citation
errors. A safe abstention can pass factual safety but fail completeness. The existing
deterministic citation-ID check is also saved; passing it alone does not establish
that a citation supports the claim.

These are provisional automated grades, not independently reviewed accuracy labels.
The answer and judge share a model family, the judge sees both answers while deriving
the fact rubric, and there is only one answer per condition. The existing 37-question
benchmark is small and its held-out split has already been inspected in prior work.
No new thresholds are tuned here. Corpus-based grading does not independently verify
the original PDF or close unresolved source issues. Differences can reflect answer
sampling as well as evidence and analysis changes. This experiment alone cannot
establish that a reranker or filter would improve the deployed system.

## Execution status — 3 October 2026

The runner and seven scoring regressions are implemented. Local scoring tests, root
lint, canonical validation (440 files), and a client type check using the root
TypeScript compiler passed. The full suite passed 3692 tests with two provider
integration tests skipped after a retry permitting the existing CLI tests' local IPC
sockets. Concurrent unrelated corpus edits were present during the local checks;
the evaluation records its loaded snapshot fingerprint and detects changes during
loading. The API evaluation has not run: automatic approval review
requires explicit authorization to send questions and corpus excerpts to the configured
external providers. No answer-quality or relevance accuracy result is claimed yet.

An offline replay found exact Jev cache misses on five of the 37 current questions.
Its mixed fallback output is not a valid full Jev evaluation. For the motivating
poison/bleeding/rest question, lexical retrieval does not include the alchemy Poison
entity; the cached Jev union adds no evidence records and both include all three
labelled required records.
