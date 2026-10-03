# lod-rules web client

A browser chat for League of Dungeoneers rules questions. It is built with TanStack Start
(Vite), `@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-react` and TanStack Query.

Each question goes through the same `ask()` pipeline as `npm run ask` (analysis, then
deterministic retrieval, then the grounded prompt). That runs on the server. The prompt
becomes the system prompt for an OpenAI chat stream. The UI shows the answer, the evidence
records (scope, pages, issues, external books) and the `checkCitations()` result.

## Run

Needs Node 22.5 or newer (`node:sqlite`) and the root repo's dependencies installed.

```bash
cd ../.. && npm install && npm run retrieve -- build   # optional: prebuilt SQLite index
cd clients/web && npm install
OPENAI_API_KEY=sk-... npm run dev                      # http://localhost:1234
```

The server reads settings from the process environment first, then the root
`.env.local`. See [.env.example](.env.example) for `OPENAI_API_KEY`, `OPENAI_MODEL`,
`LOD_ANALYZER` and `TYPESAFE_API_KEY`.

## Retrieval modes

The gear button next to the title, or the mode chip under the question box, opens the
retrieval settings. Every mode searches the SQLite lexical index. A model can only add records
to those results, never remove them:

| Mode                 | Analyzer  | Needs              |
| -------------------- | --------- | ------------------ |
| Lexical only         | `lexical` | nothing            |
| Lexical + Laya       | `laya`    | local ONNX model   |
| Lexical + Jev        | `jev`     | `TYPESAFE_API_KEY` |
| Lexical + Laya + Jev | `cascade` | `TYPESAFE_API_KEY` |

`LOD_ANALYZER` sets the server default. The browser saves its choice in `localStorage`
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

Retrieval uses only the latest question; earlier turns go to the model as conversation
history. `npm run typecheck` checks this package. `npm test` runs the ruling citation and source-serving regressions using the root-installed `tsx` loader. The root gate ignores `clients/`.
