# Plan: a static, browser-only web client

Status: proposed, 3 October 2026. Nothing in this plan is implemented yet.

## Goal

Deploy `clients/web/` as static files. The browser runs the whole evidence pipeline
(analysis, retrieval, evidence, prompt) with no application server. A player who only
wants the evidence gets it without an account or a key. A player who wants an
interpreted answer pastes their own LLM key, and the browser calls the provider
directly.

## Decisions taken

| Topic             | Decision                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| Evidence          | Built at bundle time, shipped with the client, queried in the browser    |
| LLM               | Optional. The user supplies a key; it never reaches a server we run      |
| Rulebook PDF      | Shipped with the deployment                                              |
| Question analysis | Laya runs in the browser. Jev is removed once Laya is good enough alone  |
| Initial load      | A longer first load is acceptable; later visits must come from the cache |

## Current state

Everything except rendering runs on the TanStack Start server today:

| Server piece                                | What it does                                                 |
| ------------------------------------------- | ------------------------------------------------------------ |
| `server/ask-service.ts`, `getEvidence`      | Runs `ask()` over `Retrieval` (`node:sqlite`, FTS5)          |
| `checkAnswer`                               | Runs `checkCitations()` against the cached evidence          |
| `routes/api.chat.ts`                        | Streams OpenAI with a server-side `OPENAI_API_KEY`           |
| `server/rulebook.ts`, `/api/rulebook-page/` | Cuts single pages from the 40 MB PDF with pdf-lib            |
| `getRulebook`                               | Builds the page index from `pages.yaml` and `sections.yaml`  |
| `/api/pdf-fonts/`                           | Serves pdf.js standard fonts from `node_modules`             |
| Analyzer (`LOD_ANALYZER`)                   | Lexical, or Laya via `onnxruntime-node`, or Jev over the API |

`scripts/ask/analysis.ts`, `evidence.ts` and `prompt.ts` are plain TypeScript. Their only
runtime dependency is the `Retrieval` class and `normalize()`. `Retrieval` is the one
piece bound to Node, through `node:sqlite`.

## Measured sizes

| Artifact                                     | Raw     | gzip   | brotli |
| -------------------------------------------- | ------- | ------ | ------ |
| `generated/retrieval/retrieval.sqlite`       | 13.5 MB | 1.8 MB | 1.2 MB |
| `generated/retrieval/search-documents.jsonl` | 2.7 MB  | 360 KB | —      |
| `source/Rulebook-2nd-printing-ENGa.pdf`      | 41.9 MB | —      | —      |
| Laya `laya.onnx` + `laya.onnx.data` (fp32)   | 1.6 GB  | —      | —      |
| Laya `tokenizer/tokenizer.json`              | 3.4 MB  | —      | —      |

The Laya weights are the blocker. At 1.6 GB (about 400M parameters in fp32), they cannot
be part of any initial load and are too large for most phones. Laya has to be
quantized, downloaded only when the user asks for it, and cached.

## Loading tiers

| Tier | Content                                       | When it loads             | Budget (compressed) |
| ---- | --------------------------------------------- | ------------------------- | ------------------- |
| 0    | App shell, pdf.js, UI code                    | First paint               | about 1 MB          |
| 1    | SQLite WASM + `retrieval.sqlite` + page index | First visit, then cached  | about 2 MB          |
| 2    | Single rulebook pages                         | When a page is opened     | per page            |
| 3    | Quantized Laya + tokenizer                    | User opts in, then cached | 100–400 MB          |

Tier 1 is enough for the evidence-only experience, with the lexical analyzer. Tier 3
improves the analysis but is never required. When Laya is missing, still downloading
or fails, the lexical analysis stands. This is the fallback `analyzeQuestion()`
already has.

## Workstreams

### 1. A storage seam under `Retrieval` (root repo)

`Retrieval` calls `db.prepare(sql).get(...)` and `.all(...)` and nothing else.
Introduce a minimal interface with those two methods. Then:

- Move the `node:sqlite` import out of `scripts/retrieve/index.ts` into a Node backend
  module, so the browser build does not pull in `node:sqlite`, `node:fs` or `yaml`.
- Add a WASM backend over `@sqlite.org/sqlite-wasm`. The official build includes FTS5,
  so `bm25()`, `snippet()` and the porter tokenizer behave exactly as they do under Node.
  It opens the shipped file with `sqlite3_deserialize` into an in-memory database.
- Keep `fromCorpus()` and `open()` Node-only. Give the browser a `fromBytes()` entry point.

Acceptance: `tests/retrieve/retrieval.test.ts` and `tests/ask/*.test.ts` pass against
both backends. sqlite-wasm runs in Node for in-memory databases. A parity test checks
that both backends return identical hits, scores and snippets for every labelled
question. A pure-JS search index (MiniSearch, Lunr) was rejected: it would rank
differently, and the recall figures in [retrieval.md](retrieval.md) would no longer
describe the deployed client.

### 2. A bundle step (`clients/web`)

Add `npm run bundle` in `clients/web/`, run before `vite build`. It writes ignored build
output into `clients/web/public/data/`:

- `retrieval.sqlite` and `manifest.json` from `npm run retrieve -- build`, under a
  directory named after the input fingerprint, so caches invalidate when the corpus changes;
- `rulebook-index.json`, which is the current `getRulebookIndex()` output;
- `rulebook/pages/NNN.pdf`, all 286 single-page PDFs, cut at build time with the code
  in `server/rulebook.ts`;
- `rulebook/Rulebook-2nd-printing-ENGa.pdf` for "Open PDF" (static hosts serve byte ranges);
- pdf.js `standard_fonts/`.

The bundle step reads `corpus/` and `source/` but never writes to them. Measure the
total size of the split pages: each page carries its own font subsets, so the sum can
exceed 42 MB. That only affects deploy size, not what a user downloads.

### 3. The pipeline in a Web Worker

One worker owns SQLite, the analyzer and `ask()`:

- On start, it reads the database from Cache Storage by fingerprint, or fetches and stores it.
- Messages: `ask(question) → { analysis, evidence, prompt }` and
  `check(question, answer) → CitationCheck`.
- It keeps the existing 50-question memo from `ask-service.ts`.

The UI shows a progress state ("Loading rules index…") only on the first visit.

### 4. Evidence-first UI

- The default response to a question is the evidence panel: records, scope, quest,
  pages, review issues and unavailable books. The UI already renders these through
  `EvidencePanel`.
- "Interpret with AI" appears once a key is set. Without one, the button opens key settings.
- Add "Copy prompt", so a user can paste the grounded prompt into any assistant they already use.

### 5. Bring-your-own LLM key

- Providers: OpenAI and Anthropic first. Both accept browser calls, Anthropic with the
  `anthropic-dangerous-direct-browser-access` header. OpenRouter would cover other
  models with one key.
- The system prompt stays `buildPrompt()`. `checkCitations()` runs locally on the finished answer.
- Key storage: memory by default, `sessionStorage` with "remember for this tab", and
  `localStorage` only behind an explicit "remember on this device".
- Set a Content Security Policy whose `connect-src` allows only our origin and the
  chosen provider hosts, and load no third-party scripts. A key in the browser is
  exposed to any script on the page, so the page must run only our code.
- Check whether `@tanstack/ai` can drive a provider adapter in the browser with a
  runtime key. If not, call the provider SDKs or `fetch` with streaming directly.

### 6. Laya in the browser

The Node package `@receptron/laya` (MIT) uses `onnxruntime-node`, `node:fs` and a
disk cache. Its sequence building (`dist/sequence.js`, about 100 lines) is
runtime-independent. Plan:

1. **Port the runtime.** Use `onnxruntime-web` (WebGPU, falling back to WASM) and a
   browser tokenizer (`@huggingface/tokenizers` if it runs in browsers, otherwise
   transformers.js), and reuse `sequence.js`. Run it in the same worker.
2. **Quantize.** Export int8, and try 4-bit weight-only quantization. Pin the output by
   checksum, as `LAYA_ONNX_REVISION` pins the fp32 export.
3. **Gate on the labelled set.** Add browser-runtime Laya as an analyzer in
   `npm run ask:evaluate`. Ship a quantized model only when its judgments match fp32 Laya
   on the labelled questions within an agreed tolerance, and its union with lexical loses no
   baseline record. `tests/ask/evaluate.test.ts` already enforces the second condition.
4. **Download on request.** A settings toggle shows the size, downloads with progress,
   stores the model in Cache Storage or OPFS, and checks `navigator.deviceMemory` and
   WebGPU availability first. Warn on phones.
5. **Hosting.** Serve the weights from our origin or from Hugging Face at a pinned
   revision. Confirm the licence of the `convaiinnovations/laya` weights before
   redistributing them.

Multithreaded WASM needs `SharedArrayBuffer`, which requires cross-origin isolation
(`Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`). CORS `fetch` calls to
LLM providers still work under COEP. The static host must be able to set these headers.

### 7. Labels and a task-specific analyzer

The analysis always asks the same questions: intent (7 options), complexity (4), nine
yes/no game-system questions and one entity choice. Laya is a general model that can
answer any question, which the client does not need. With enough labels, a small
encoder trained with one output per question could be more accurate than Laya, tens of
megabytes instead of hundreds, and fast enough for WASM-only phones. This workstream
builds the labels once and uses them for every option below.

**Label sources.**

1. **Questions generated from the corpus.** For each canonical rule, table, entity,
   procedure and term, an LLM writes a few questions a player might ask about it. The
   source record becomes `required_evidence`, its chapter gives the game system, and
   its kind suggests the intent (a table suggests a value lookup, a term a definition).
   Two to three thousand records can yield several thousand examples.
2. **Jev as a teacher.** Jev labels the generated questions for intent and complexity
   (92 % intent accuracy on development). The cached answers in
   `generated/ask-eval/jev-cache/` cover the existing labelled questions.
3. **Human review.** A reviewed sample of generated labels measures their error rate
   and catches systematic mistakes before training. Reviewed examples are committed
   beside `tests/fixtures/ask-questions/`. Bulk generated data stays in `generated/`,
   rebuilt from pinned inputs.

**Leakage rules.** The hand-labelled held-out split is never used for training,
wording or threshold choices. Generated questions are split by source record, and
held-out chapters are reserved, so a model cannot pass by recognizing a record it was
trained on.

**Uses, cheapest first.**

| Use                          | Needs                                        | Expected effect                         |
| ---------------------------- | -------------------------------------------- | --------------------------------------- |
| Tune Laya's question wording | Current 37 questions plus a few hundred more | Modest accuracy gains, no size change   |
| Calibrate Laya               | Hundreds of labelled questions               | Trustworthy confidence; same accuracy   |
| Fine-tune Laya               | Trainable weights and code, GPU, thousands   | Better accuracy; still hundreds of MB   |
| Small task-specific encoder  | Thousands of labels, GPU for training        | Likely best accuracy per MB; tens of MB |

Try the small encoder before fine-tuning Laya. If it wins on the labelled questions,
it replaces Laya in workstream 6 and the opt-in download becomes small enough to load
with tier 1.

**Constraints.**

- `scripts/` stays free of LLM clients. Question generation uses an injected completer,
  as `npm run ask -- --completer-cmd` does, or lives outside the root package.
- Training code (likely Python) does not belong in the root TypeScript tooling. Decide
  between a separate repository and a self-contained directory with its own checks,
  as `clients/web/` has.
- Labels and model outputs are judgments. They are never written into `corpus/`.
- Any analyzer, trained or not, keeps the lexical union and the
  `tests/ask/evaluate.test.ts` guarantee that no baseline record is lost.

### 8. Retire Jev and the server routes

Do this only after the browser analyzer (Laya or the task-specific encoder) passes its
gate:

- Remove Jev from `scripts/ask/models.ts`, `cascade.ts` and the evaluation, and update
  [retrieval.md](retrieval.md) and [semantic-decisions.md](semantic-decisions.md).
  This is a root-repo change and needs the full gate.
- Keep the lexical union. The analyzer stays uncalibrated until the labelled set is large
  enough to calibrate it, and the union is what keeps a wrong answer from removing evidence.
- Delete `server/`, `routes/api.*` and `createServerFn` usage, and switch TanStack Start
  to static (SPA/prerender) output, or move to plain Vite if Start adds nothing.

## Order

1. Storage seam and backend parity tests.
2. Bundle step and the pipeline worker, with the lexical analyzer only. Evidence-only
   static deploy works at this point.
3. Evidence-first UI and bring-your-own key. Feature parity with today's server mode,
   minus Laya/Jev.
4. Generated-question labels, with a reviewed sample, and Laya wording tuned against them.
5. Small task-specific encoder, compared with quantized browser Laya on the same gate.
6. Opt-in download of whichever analyzer wins.
7. Retire Jev and the server.

Steps 1–3 do not depend on any model and are useful on their own. Step 4 can run in
parallel with them.

## Open questions and risks

- **Publishing.** The deployment ships the full rulebook PDF, and the corpus keeps
  rulebook wording by design. If the site is public, both are redistributed. Decide
  whether the deployment is public, password-protected or private before going live.
- **Laya quality.** On the labelled set, Laya alone has 31–33 % intent accuracy and
  5–38 % chapter coverage (see [retrieval.md](retrieval.md#labelled-questions)).
  Removing Jev assumes this improves substantially. Quantization can only make it worse.
- **Laya size and speed.** Even quantized, the model is hundreds of megabytes, and one
  question runs a dozen or more 512-token passes. WASM-only devices may take several
  seconds per question. Measure on a mid-range phone before deciding the default.
- **Generated labels.** Questions written from a record may be easier and more literal
  than real player questions. Measure every model on the hand-labelled questions, not
  only on generated ones, and grow the hand-labelled set from real questions over time.
- **Weights licence.** The `@receptron/laya` package is MIT. The licence of the
  upstream weights still needs checking.
- **Static headers.** The host must set COOP/COEP (for threaded ONNX), long-lived
  caching for fingerprinted data and brotli compression.
