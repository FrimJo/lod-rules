# lod-rules web client

A browser chat for League of Dungeoneers rules questions. It is built with TanStack Start
(Vite), `@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-react` and TanStack Query.

Each question goes through the same `ask()` pipeline as `npm run ask` (analysis, then
deterministic retrieval, then the grounded prompt). That runs on the server. The prompt
becomes the system prompt for a chat stream through OpenRouter (default model
`openai/gpt-6-luna`). The UI shows the answer, the evidence
records (scope, pages, issues, external books) and the `checkCitations()` result.

## Run

Needs Node 22.5 or newer (`node:sqlite`) and the root repo's dependencies installed.

```bash
cd ../.. && npm install && npm run retrieve -- build   # optional: prebuilt SQLite index
cd clients/web && npm install
OPENAI_ROUTER_API_KEY=sk-or-... npm run dev            # http://localhost:1234
```

The server reads settings from the process environment first, then the root
`.env.local`. See [.env.example](.env.example) for `OPENAI_ROUTER_API_KEY`, `OPENAI_ROUTER_MODEL`,
`LOD_ANALYZER` and `TYPESAFE_API_KEY`.

## Retrieval modes

The gear button next to the title, or the mode chip under the question box, opens the
retrieval settings. Every mode searches the SQLite lexical index, and a model analyzer adds
records to those results. Only the filtered mode removes any: it runs Jev's relevance filter
(`ask(..., { filter })`, see [docs/retrieval.md](../../docs/retrieval.md)) over the union and
drops records Jev judges irrelevant. The evidence panel lists what was dropped.

| Mode                    | Mode id        | Analyzer  | Needs              |
| ----------------------- | -------------- | --------- | ------------------ |
| Lexical + Jev, filtered | `jev_filtered` | `jev`     | `TYPESAFE_API_KEY` |
| Lexical + Jev           | `jev`          | `jev`     | `TYPESAFE_API_KEY` |
| Lexical only            | `lexical`      | `lexical` | nothing            |
| Lexical + Laya          | `laya`         | `laya`    | local ONNX model   |
| Lexical + Laya + Jev    | `cascade`      | `cascade` | `TYPESAFE_API_KEY` |

`LOD_ANALYZER` sets the server default when it names an available mode. Otherwise the default
is `jev_filtered` when `TYPESAFE_API_KEY` is set and `lexical` when it is not. The filtered
mode scored best in [docs/ask-quality-evaluation.md](../../docs/ask-quality-evaluation.md).
The browser saves its choice in `localStorage`
(`lod-rules:retrieval-mode`) and sends it with each question. Jev modes are disabled when the
server has no key, and `/api/chat` answers 409 if one is requested anyway. Each question keeps
the mode it was asked with. The evidence panel and answer badge name that mode, and a model
failure shows as a lexical-only fallback notice.

## Rulebook pages

Citations in an answer show as page chips (`p. 98`, `pp. 56, 98`); adjacent citations to the
same page merge into one chip. Hover or focus a chip to preview the records and headings it
points to. Click it, or a page button on an evidence card, to open the Rulebook tab. That tab
renders the cited page from `source/` with pdf.js and highlights the cited heading. If the
heading isn't printed word for word, it highlights the record title instead. Page labels and
section breadcrumbs come from `corpus/source-map/pages.yaml` and `sections.yaml`. The viewer
reads ←/→ to change page and +/−/0 to zoom.

The server serves single pages as small standalone PDFs (`/api/rulebook-page/:pdf`, cut with
pdf-lib) because opening the whole book makes pdf.js read most of its 40 MB. `/api/rulebook`
serves the full file with byte-range support for "Open PDF".

## Grading review

`/review` (for example http://localhost:1234/review) lets you check the automated grading
from `src/evaluation/run-quality.ts` (see
[docs/ask-quality-evaluation.md](../../docs/ask-quality-evaluation.md)). It reads the case
files in `generated/ask-quality/`. For each question you:

- tick any fact in the judge's list that is wrong or not needed;
- mark each distinct answer correct or incorrect. Answers are labelled A–D as the judge saw
  them, and the retrieval modes stay hidden until you reveal them;
- confirm or change the judge's direct/supporting/irrelevant label for every retrieved
  record. Labels start as the judge's; rows you change are highlighted.

Saving writes `evaluation/grading-review.json`, which is committed. Answer verdicts are keyed
by a hash of the answer text, so they carry over to a rerun that produces the same answer.
Record labels carry over regardless. Saving works only from the dev server.
`node --import tsx clients/web/src/evaluation/review-report.ts` prints how often the judge
agrees with you. `calibrate-filter.ts` uses your record labels in place of the judge's
wherever they exist.

Retrieval uses only the latest question; earlier turns go to the model as conversation
history. `npm run typecheck` checks this package. `npm test` runs the ruling citation, source-serving, retrieval-mode and grading-review regressions using the root-installed `tsx` loader. The root gate ignores `clients/`.
