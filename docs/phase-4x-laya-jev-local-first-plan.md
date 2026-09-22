# Phase 4.x --- Local-First Semantic Decision Layer with TypeSafe/Jev and Laya

## Purpose

Phases 0--5 of the League of Dungeoneers rules exporter already exist.

**Do not rebuild Phase 4 from scratch.**

The purpose of Phase 4.x is to inspect the current Phase 4
implementation and introduce a provider-independent semantic decision
layer. The initial providers to evaluate are:

- **Laya** --- open-weight/local typed-decision model.
- **TypeSafe/Jev** --- hosted typed-decision model/API.
- **Existing LLM path** --- retained as a benchmark and possible
  escalation/fallback.

The preferred architecture is **local-first, evidence-driven, and
replaceable**. Laya should be evaluated as the first local decision
provider, Jev as a higher-capability/API comparison or escalation
provider, and the existing generative LLM only where open-ended
interpretation is actually required.

The core architectural distinction is:

- **LLM:** extraction, interpretation, decomposition, normalization,
  and generation.
- **Laya/Jev:** typed semantic judgments, classification, scoring,
  verification, reranking, and routing.
- **Deterministic code:** schema validation, integrity checks,
  calculations, transformations, IDs, references, workflow,
  thresholds, and invariants.

The rulebook and canonical extracted rules remain the source of truth.
Laya/Jev outputs are derived/inferred metadata and must never silently
change canonical rule semantics.

---

# 4.0 --- Mandatory Documentation Bootstrap

Before doing provider-specific design or implementation:

## TypeSafe/Jev

1.  Verify that the TypeSafe skill is installed for the current coding
    agent.
2.  Read the installed TypeSafe skill completely.
3.  Follow the skill's instruction to consult the **current live
    TypeSafe documentation**.
4.  Treat the live TypeSafe documentation and installed SDK/types as
    authoritative for version-dependent details.
5.  Do **not** treat example API/SDK code in this plan as authoritative
    if it conflicts with current TypeSafe documentation.

When implementing Jev integration, begin from the live TypeSafe
documentation index:

- `https://docs.typesafe.ai/llms.txt`

Inspect the current documentation relevant to:

- System One programming model
- state
- primitives
- Choice
- Noul
- Score
- confidence / uncertainty
- SDK for this repository's language
- API/authentication
- relevant cookbooks/patterns

Repeat this live-doc check before substantial Jev-specific work if
implementation spans multiple sessions.

## Laya

Before implementing Laya:

1.  Read the current upstream Laya repository/model documentation.
2.  Inspect the current Python package/API if Python is used.
3.  If the exporter is Node.js/TypeScript, evaluate the available local
    ONNX runtime integration rather than introducing Python solely for
    inference unless there is a clear reason.
4.  Pin the selected model/checkpoint and dependency versions for
    reproducibility.
5.  Record the exact checkpoint/revision used by evaluation runs.

Current upstream resources to inspect:

- `https://github.com/NandhaKishorM/laya`
- `https://huggingface.co/convaiinnovations/laya`
- `https://huggingface.co/convaiinnovations/laya-typed-decisions`

For Node.js/TypeScript, also evaluate:

- `https://github.com/receptron/laya`

Do not assume the `laya-typed-decisions` checkpoint is automatically
best for League of Dungeoneers. It is specialized for other workflows
and its own documentation warns that out-of-domain behavior must be
evaluated.

## If documentation is unavailable

Provider-independent architecture work may continue.

Do not invent version-dependent API details.

---

# 4.1 --- Inspect the Existing Phase 4 Implementation

Before changing code, inspect the repository and document how Phase 4
currently works.

Identify:

- Phase 4 entry points
- extraction pipeline
- prompts
- schemas/types
- canonical rule representation
- rule categories/types
- provenance representation
- validation
- confidence/quality metadata
- retry/fallback behavior
- caching
- CLI commands
- tests
- generated artifacts
- downstream assumptions from later phases

Produce a short implementation map adapted to the actual repository, for
example:

```text
source
  ↓
chunk/section
  ↓
LLM extraction
  ↓
candidate rules
  ↓
normalization
  ↓
validation
  ↓
canonical rule artifact
```

Identify every place Phase 4 currently asks an LLM to make a closed,
bounded, or constrained semantic decision.

Examples:

- Which rule type is this?
- Which domain does this belong to?
- Is this rule conditional?
- Does this rule contain an exception?
- Does it require another rule?
- Is this likely incomplete?
- Which known entity/type does this reference?
- Is this primarily movement/combat/magic/etc.?
- Is a specific extracted field supported by the source evidence?

These are candidates for Laya/Jev.

Do not migrate something merely because a decision model can technically
answer it.

---

# 4.2 --- Establish the Decision Boundary

Classify existing Phase 4 operations into three groups.

## A. Keep with the LLM

Use an LLM when output requires open-ended generation or substantial
semantic reconstruction.

Examples:

- extracting atomic rules from prose
- splitting paragraphs containing several rules
- resolving implicit subjects
- preserving and rewriting complex exceptions
- reconstructing conditions/effects
- interpreting complex natural-language relationships
- generating normalized semantic representations

## B. Candidate for Laya/Jev

Use a typed-decision model when the task can be expressed as a narrow
semantic judgment over known state.

Conceptually:

```text
state + constrained question → typed judgment/probability
```

Good candidates include:

- finite classification
- boolean/probabilistic condition judgments
- ordinal scoring
- semantic routing
- semantic tagging
- completeness assessment
- ambiguity flags
- dependency flags
- evidence verification
- selecting among a small known candidate set
- reranking a small retrieved candidate set

## C. Keep deterministic

Do not use either a decision model or LLM when ordinary code can answer
reliably.

Examples:

- schema validity
- duplicate IDs
- broken references
- missing required fields
- numeric range checks
- referential integrity
- enum validation
- file/path validation
- graph invariants
- exact calculations
- exact lookups

Preferred order when all mechanisms could theoretically solve a problem:

```text
deterministic code > local Laya > Jev > generative LLM
```

This is an architectural preference, not a quality assumption. Benchmark
results may justify a different provider order for a specific judgment.

---

# 4.3 --- Design From Desired Behavior

Before defining model questions, identify what downstream behavior needs
each judgment.

For every proposed judgment, document:

```text
Judgment:
Consumer:
Why it is needed:
What code does with it:
What happens when uncertain:
What happens when unavailable:
Can deterministic code answer it instead:
Candidate-set size:
Required context:
Consequence of a wrong answer:
```

Do not add metadata merely because it is interesting.

Consider patterns such as:

- selecting among known values instead of generating
- verifying extracted fields against evidence
- reranking/relevance judgments
- hierarchical classification
- composite scoring
- extraction/verification cascades
- escalation of uncertain cases
- narrowing a large candidate set before asking a decision model

Choose the smallest useful judgment for the actual behavior.

---

# 4.4 --- Introduce a Provider-Independent Decision Boundary

Do not couple the domain model directly to Jev or Laya.

Use an abstraction appropriate to the existing architecture,
conceptually:

```ts
interface SemanticDecisionProvider {
  decide(input: SemanticDecisionInput): Promise<SemanticDecisionResult>;
}
```

If the existing code naturally separates rule classification from other
decisions, narrower interfaces are acceptable.

Possible implementations:

```text
LayaDecisionProvider
JevDecisionProvider
LLMDecisionProvider
NoOpDecisionProvider
CascadeDecisionProvider
```

The exporter must remain usable without Jev and without Laya.

Configuration should support something conceptually equivalent to:

```text
decisionProvider = laya
decisionProvider = jev
decisionProvider = llm
decisionProvider = cascade
decisionProvider = none
```

Do not copy these exact names if they conflict with repository
conventions.

---

# 4.5 --- Local-First Cascade Architecture

Design for, but do not immediately enable, a cascade:

```text
                         ┌─ usable certainty ──► accept
                         │
Rule/state ──► Laya ─────┤
                         │
                         └─ uncertain / unsupported
                                      │
                                      ▼
                                     Jev
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                    usable result          still uncertain /
                         │                  requires generation
                         ▼                         │
                       accept                      ▼
                                                 LLM
```

The cascade must be implemented as explicit application policy.

Do not hide fallback behavior inside provider adapters.

The `CascadeDecisionProvider` should own:

- provider order
- escalation rules
- per-judgment thresholds
- failure policy
- telemetry
- cost/latency accounting

Provider adapters should only execute provider-specific decisions and
return normalized results.

---

# 4.6 --- Authentication, Local Models, and Secrets

## Jev

Obtain TypeSafe credentials from the runtime environment as TYPESAFE_API_KEY.

Do not:

- hard-code API keys
- commit API keys
- put real credentials in fixtures
- print credentials in logs
- include credentials in generated artifacts
- require a real key for ordinary unit tests

Use the current TypeSafe documentation/SDK convention for
authentication.

## Laya

Laya should run locally after the required model files are available.

Do not commit large model weights to the repository unless there is an
explicit project decision to do so.

Prefer:

- documented model download/bootstrap
- pinned model ID/revision
- configurable local model/cache directory
- offline inference after model acquisition where supported

Record enough information to reproduce an evaluation:

```text
provider
checkpoint
revision/hash
runtime
device/backend
configuration/calibration
```

---

# 4.7 --- Select Initial Laya Checkpoints Empirically

Evaluate at least the relevant available Laya checkpoints rather than
assuming one is best.

Likely initial candidates:

```text
convaiinnovations/laya
convaiinnovations/laya-typed-decisions
```

Use multilingual only if the corpus/query language requires it.

Important constraints to account for during evaluation:

- Laya is a small local model and may be weaker zero-shot on our
  domain.
- The typed-decisions checkpoint is specialized for workflows unlike
  tabletop rules.
- Large choice sets are a known weakness.
- Context is limited compared with general-purpose LLMs.
- Probability calibration must be validated on our own held-out data.

Do not use internet benchmark rankings to choose the production
checkpoint.

Choose based on the League of Dungeoneers gold corpus.

---

# 4.8 --- Define the Derived Decision Contract

Create a versioned derived-metadata schema independent from the
canonical rule schema.

Example conceptual model:

```json
{
  "schemaVersion": 1,
  "ruleId": "movement.example-rule",

  "domain": {
    "value": "movement",
    "confidence": 0.97
  },

  "kind": {
    "value": "modifier",
    "confidence": 0.94
  },

  "conditional": {
    "value": true,
    "probability": 0.99
  },

  "hasException": {
    "value": false,
    "probability": 0.91
  },

  "requiresCrossReference": {
    "value": true,
    "probability": 0.83
  },

  "completeness": {
    "value": "self-contained",
    "confidence": 0.88
  }
}
```

This is conceptual only.

Preserve provider-native probability/confidence semantics rather than
pretending every primitive/provider means exactly the same thing.

The normalized contract should preserve enough raw/typed information to
compare providers.

---

# 4.9 --- Derive the Taxonomy From the Existing Corpus

Do not invent a new taxonomy prematurely.

Inspect:

- existing Phase 4 rule types
- existing ontology
- domains/categories
- tags
- relation types
- validation metadata
- generated Phase 4 corpus

Candidate dimensions may include:

## Domain

```text
movement
combat
equipment
magic
skills
conditions
exploration
character
campaign
enemy
dungeon
general
```

## Rule kind

```text
requirement
permission
restriction
modifier
trigger
effect
exception
definition
procedure
reference
```

## Structural properties

```text
conditional
contains_numeric_effect
contains_exception
requires_cross_reference
references_entity
changes_game_state
```

## Quality/completeness

```text
self_contained
possibly_incomplete
clearly_incomplete
```

Only introduce dimensions with a concrete downstream use.

---

# 4.10 --- Keep Choice Sets Small

This is especially important for Laya.

Do not ask a local decision model to select directly among very large
taxonomies/entity lists when the candidate set can be narrowed first.

Preferred pattern:

```text
all entities/rules
      ↓
deterministic / lexical / embedding / graph retrieval
      ↓
small candidate set
      ↓
Laya or Jev typed decision
```

For example, instead of:

```text
Which of 150 entities is referenced?
```

prefer:

```text
retrieve 5–10 plausible entities
      ↓
Which of these candidates is referenced?
```

During evaluation, explicitly measure accuracy against candidate-set
size.

Treat approximately 20+ options as a warning point for Laya unless our
own benchmarks demonstrate acceptable behavior.

---

# 4.11 --- Design Typed Questions Carefully

For Jev, follow current TypeSafe primitive guidance.

For Laya, use the compatible typed-decision concepts supported by the
selected runtime/checkpoint.

Conceptually:

- **Choice** --- one option from a defined competing set.
- **Noul** --- whether a condition holds / probability of yes.
- **Score** --- degree along a clearly described ordered dimension.

For each question:

- ask one narrow judgment,
- include enough relevant state,
- keep state compact,
- define possible answers clearly,
- include a no-match outcome where appropriate,
- ensure all candidate values are supplied,
- avoid requiring hidden multi-step reasoning,
- avoid excessive choice cardinality.

Do not assume question IDs communicate semantics. The
instructions/criteria must carry the meaning.

---

# 4.12 --- Implement Provider Adapters

## Laya adapter

Responsibilities:

- load/configure the selected local checkpoint
- map canonical/candidate rule data into Laya state/questions
- execute local inference
- normalize typed outputs
- preserve distributions/confidence
- expose checkpoint/runtime metadata
- handle model-load/inference errors
- support deterministic testing via mocks/fixtures

Keep model loading outside hot per-rule paths.

Where practical, preload once per process/job.

## Jev adapter

Responsibilities:

- map rule data into TypeSafe state/questions
- execute current SDK/API calls
- normalize typed outputs
- preserve primitive-specific uncertainty
- handle errors/timeouts/rate limits
- expose provider/model metadata

## LLM adapter

Use only as an existing baseline or explicit fallback/escalation
provider.

Do not force generative LLM output into the primary decision path if
Laya/Jev can solve the bounded judgment reliably.

---

# 4.13 --- Batch Independent Judgments Over Shared State

Where supported, ask independent questions over the same state together.

Conceptually:

```text
STATE

Canonical rule text
Source context
Known entities
Existing ontology metadata
Nearby rule context when necessary
```

Possible questions:

```text
Q1 → domain
Q2 → rule kind
Q3 → conditional?
Q4 → exception?
Q5 → cross-reference required?
Q6 → completeness
```

Do not make later questions implicitly depend on earlier answers if they
are submitted together.

If an earlier answer is required to retrieve evidence or narrow
candidates, use a second stage/request.

Measure actual latency and throughput for both Laya and Jev.

---

# 4.14 --- Preserve Decision Provenance

Derived judgments must be distinguishable from rulebook-derived facts.

Store metadata conceptually similar to:

```json
{
  "classification": {
    "provider": "laya",
    "model": "convaiinnovations/laya",
    "modelRevision": "...",
    "runtime": "...",
    "schemaVersion": 1,
    "classifiedAt": "...",
    "results": {}
  }
}
```

or:

```json
{
  "classification": {
    "provider": "typesafe",
    "model": "jev",
    "modelVersion": "...",
    "schemaVersion": 1,
    "classifiedAt": "...",
    "results": {}
  }
}
```

If a cascade escalates, preserve the decision trace:

```text
Laya result
why escalation occurred
Jev result
optional LLM fallback result
final policy decision
```

Do not silently discard provider disagreement.

---

# 4.15 --- Confidence, Calibration, and Escalation Policy

Do not treat confidence as correctness.

Do not copy a threshold such as `0.60` from an external benchmark.

Thresholds must be learned/evaluated on our League of Dungeoneers
validation data.

Evaluate separately by:

- provider
- primitive
- taxonomy
- choice-set size
- difficulty/ambiguity
- downstream consequence

Possible policy:

```text
Laya sufficiently reliable/certain
  → accept locally

Laya uncertain or known-weak case
  → escalate to Jev

Jev uncertain / task requires generation
  → escalate to LLM or manual review
```

Also evaluate whether **provider disagreement itself** is a useful
escalation signal.

Calibration work for Laya should use held-out LoD data if we intend to
use probability thresholds operationally.

Never calibrate and evaluate on the same examples.

---

# 4.16 --- Build a League of Dungeoneers Gold Evaluation Set

This is mandatory before replacing existing behavior.

Select a representative sample of existing rules.

Include:

- simple rules
- conditional rules
- exceptions
- cross-references
- nested rules
- numeric modifiers
- definitions
- procedures
- ambiguous wording
- rules spanning paragraphs
- rules depending on tables
- rules referencing other sections
- no-match cases
- small and larger candidate sets

Manually establish expected judgments.

Store this as a version-controlled provider-independent fixture.

Example:

```text
test/fixtures/semantic-decisions-gold/
```

Split the data conceptually into:

```text
development/tuning set
validation/calibration set
final held-out evaluation set
```

Do not tune thresholds or fine-tune Laya against the final held-out set.

---

# 4.17 --- Benchmark All Providers

Run the same gold corpus through:

```text
existing Phase 4 approach
Laya base/general checkpoint
Laya typed-decisions checkpoint
Jev
```

Where appropriate, also test:

```text
Laya → Jev cascade
Laya → Jev → LLM cascade
```

Measure:

- overall accuracy
- per-class accuracy
- precision/recall
- false positives/negatives
- score error
- probability/calibration quality
- accuracy by confidence bucket
- accuracy by choice-set size
- accuracy by rule complexity
- latency
- throughput
- memory usage
- cold-start time
- API requests
- token/request usage where applicable
- actual/estimated cost
- escalation rate
- failure rate

Do not declare a provider "better" from aggregate accuracy alone.

The important question is which provider/policy gives acceptable quality
for each LoD judgment at acceptable local resource/API cost.

---

# 4.18 --- Shadow Mode First

Initially, neither Laya nor Jev should change canonical output.

Pipeline:

```text
Phase 4 extraction
       │
       ├──────────────► existing behavior
       │
       ├──────────────► Laya shadow decisions
       │
       └──────────────► Jev shadow decisions
                              │
                              ▼
                       diagnostic artifacts
```

Generate comparisons containing:

```text
rule ID
gold/expected result when available
existing result
Laya result + probability/confidence
Jev result + probability/confidence
provider agreement/disagreement
candidate-set size
latency
```

---

# 4.19 --- Disagreement Analysis

Prioritize cases where:

```text
Laya != Jev
Laya != existing result
Jev != existing result
provider != gold
```

Classify the cause:

```text
Laya error
Jev error
existing classifier error
taxonomy ambiguity
bad extraction
insufficient state/evidence
bad question definition
missing candidate
choice set too large
context truncation
gold-set error
code mapping error
calibration problem
```

Fix systematic problems in:

- taxonomy
- state construction
- question wording
- retrieval/candidate narrowing
- extraction
- calibration
- provider policy

Do not patch individual rules unless the underlying rule data itself is
wrong.

---

# 4.20 --- Evaluate Verification as Well as Classification

Typed decision models may be more useful for targeted verification than
for some zero-shot classifications.

Evaluate questions such as:

- Does the extracted condition appear supported by the cited source
  span?
- Does the extracted effect match the evidence?
- Is this candidate rule self-contained enough for downstream use?
- Does this candidate reference another rule/entity?
- Which of several retrieved entities is being referenced?

Potential architecture:

```text
extract/generate with LLM
        ↓
verify bounded claims with Laya
        ↓
uncertain / high-impact cases
        ↓
Jev
        ↓
optional LLM/manual review
```

Do not add verification stages unless the gold evaluation shows useful
signal.

---

# 4.21 --- Evaluate Local-Only Mode

Explicitly test whether the exporter can operate acceptably with:

```text
Laya + deterministic code + existing extraction LLM
```

and no Jev calls.

This mode matters for:

- offline development
- reproducibility
- privacy
- cost control
- future local player-helper deployment

Report the quality delta between:

```text
local-only
```

and:

```text
local-first cascade with Jev
```

Do not assume the quality delta is acceptable; measure it.

---

# 4.22 --- Fine-Tuning Laya: Optional Later Stage

Do **not** fine-tune Laya before establishing the zero-shot/local
baseline and a trustworthy gold corpus.

Consider fine-tuning only if:

- Laya is promising but consistently misses domain-specific patterns,
- enough reviewed LoD decisions exist,
- the task/taxonomy is stable,
- local deployment has meaningful value.

If fine-tuning is pursued:

```text
reviewed LoD decisions
      ↓
train/dev split
      ↓
Laya fine-tuning
      ↓
calibration on separate held-out data
      ↓
final untouched evaluation set
```

Record:

- base checkpoint
- training dataset version
- training configuration
- calibration procedure
- resulting checkpoint hash/version
- evaluation metrics

Name the resulting model/project checkpoint explicitly,
e.g. conceptually:

```text
laya-lod-v1
```

Do not overwrite or ambiguously refer to it as generic Laya.

A domain-fine-tuned Laya model must still be compared against Jev and
the existing approach.

---

# 4.23 --- Decision Cache

Cache decisions based on something equivalent to:

```text
hash(
  relevant canonical state
  + question/judgment schema version
  + provider
  + model/checkpoint revision
  + calibration/config version
)
```

Changing unrelated exporter code should not invalidate decisions.

Changing semantic inputs, question meaning, checkpoint, or calibration
should.

For local Laya, caching may be less important for cost but still useful
for reproducibility and avoiding repeated work.

---

# 4.24 --- CLI Support

Extend the existing CLI rather than introducing a parallel tool.

Useful capabilities may include:

```text
classify corpus
classify specific rule
reclassify
compare providers
evaluate gold set
show disagreements
show uncertain results
run shadow mode
run local-only mode
run cascade mode
benchmark latency/throughput
```

Potential filters/options:

```text
--provider laya
--provider jev
--provider cascade
--rule <id>
--domain <domain>
--confidence-below <x>
--force
--offline
```

Only add flags that fit the repository's existing UX.

---

# 4.25 --- Failure Behavior

Decision providers must not become a single point of failure for
canonical extraction.

Define explicit behavior for:

## Laya

- model unavailable/not downloaded
- model load failure
- unsupported runtime/device
- inference failure
- context/options too large
- malformed output
- memory pressure

## Jev

- API unavailable
- timeout
- rate limiting
- authentication failure
- malformed/unexpected response

## General

- uncertain result
- unknown enum/candidate
- provider disagreement
- fallback unavailable

Preferred invariant:

```text
Canonical extraction remains possible
even if all optional semantic-decision providers are unavailable.
```

---

# 4.26 --- Tests

## Unit tests

Test:

- state/input mapping
- question construction
- result normalization
- provider-specific uncertainty mapping
- enum/candidate mapping
- malformed responses
- cascade/escalation policy
- cache keys
- model metadata/provenance

Mock provider boundaries.

Normal unit tests must not require:

- network access
- a TypeSafe account
- a TypeSafe API key
- downloading Laya model weights

## Laya integration tests

Keep separate from ordinary unit tests.

Require an explicit opt-in and a configured local model.

Test the actual pinned checkpoint/runtime.

## Jev integration tests

Keep separate from ordinary unit tests.

Require explicit opt-in and a real API key.

## Corpus evaluation tests

Run the gold set and calculate metrics.

Do not necessarily fail CI on exact probabilistic output unless
reproducibility/tolerances are understood.

---

# 4.27 --- Observability

Capture enough information to understand provider behavior.

Useful metrics:

```text
rules judged
provider used
requests/inferences
latency
cold-start time
failures
retries
cache hits
confidence/probability distributions
classification distributions
provider disagreements
escalation count/rate
local acceptance rate
Jev call rate
LLM fallback rate
```

For Laya also capture:

```text
checkpoint
runtime/backend
device class where useful
memory usage where practical
```

Never log API keys.

Prefer rule IDs/hashes over unnecessary full copyrighted source text in
logs.

---

# 4.28 --- Prepare for Future Player-Helper Runtime Routing

The future helper app is a major reason to evaluate Laya.

Potential runtime:

```text
player question
      ↓
Laya local typed decisions
      ↓
identify relevant domains/entities/rule families
      ↓
deterministic/search/graph retrieval
      ↓
relevant evidence
      ↓
optional Jev escalation
      ↓
reasoning LLM
      ↓
answer + rule citations
```

Potential local Laya uses:

- query intent/domain routing
- deciding which rule families to retrieve
- reranking a small set of candidate rules
- deciding whether multiple rule systems are involved
- identifying whether character/equipment/campaign state is required
- simple guardrails
- bounded answer-evidence verification

If a future player helper must work offline, keep that constraint
visible during Phase 4.x evaluation.

Do not prematurely implement player-helper runtime features in the
exporter.

---

# 4.29 --- Documentation

Document:

- why the semantic decision layer exists
- deterministic vs Laya/Jev vs LLM responsibilities
- provider-independent architecture
- TypeSafe skill installation/read requirement
- live TypeSafe documentation requirement
- Laya model/bootstrap instructions
- selected/pinned Laya checkpoint and runtime
- Jev credential setup without exposing secrets
- how to run without Jev
- how to run without Laya
- how to run local-only mode
- how to run shadow mode
- how to run cascade mode
- how to run provider benchmarks
- how to regenerate decisions
- how probability/confidence is interpreted
- how escalation thresholds were selected
- how to update providers/checkpoints safely

Avoid copying large external documentation into the repository. Link to
upstream docs and document project-specific decisions.

---

# 4.30 --- Definition of Done

Phase 4.x is complete when:

- the current TypeSafe skill has been read
- current live TypeSafe documentation was consulted for Jev
  implementation
- current Laya upstream/model documentation was consulted
- existing Phase 4 behavior has been documented
- generative, semantic-decision, and deterministic responsibilities
  are clearly separated
- a provider-independent decision boundary exists
- Laya is implemented behind that boundary
- Jev is implemented behind that boundary
- an explicit cascade policy can compose providers
- TypeSafe credentials are loaded securely at runtime
- Laya runs locally using a pinned/reproducible checkpoint
- canonical rules do not depend on either provider being available
- inferred data is clearly separated from source-derived facts
- provider/model provenance is preserved
- a representative LoD gold corpus exists
- Laya checkpoints, Jev, and the existing approach have been
  benchmarked on the same corpus
- local-only quality is measured
- local-first cascade quality/cost/latency is measured
- shadow-mode comparison exists
- disagreements can be inspected
- uncertain results can be found
- candidate-set-size effects are measured
- thresholds are based on LoD validation data rather than external
  benchmarks
- caching exists where useful
- failure behavior is tested
- ordinary tests require no network/API key/model download
- provider integration/evaluation tests are explicitly opt-in
- documentation explains when each provider should and should not be
  used

---

# Important Constraints

1.  **Do not rewrite working Phase 4 code unnecessarily.**

2.  **Inspect before implementing.** Adapt this plan to the repository
    rather than forcing the repository to match this document.

3.  **Read the installed TypeSafe skill before Jev-specific
    implementation and follow its live-doc requirement.**

4.  **Read current Laya upstream/model documentation before
    Laya-specific implementation.**

5.  **Current provider docs/SDK contracts override sample API syntax in
    this plan.**

6.  **Canonical rule semantics must not depend on probabilistic
    decisions.**

7.  **Do not move generative extraction work to Laya/Jev merely to
    reduce cost.**

8.  **Do not use a model for things deterministic code can establish
    reliably.**

9.  **Do not treat confidence/probability as correctness.**

10. **Do not copy escalation thresholds from internet benchmarks.**

11. **Do not assume the Laya typed-decisions checkpoint is best out of
    domain. Benchmark it.**

12. **Avoid large Laya Choice sets. Narrow candidates before model
    selection where possible.**

13. **Do not create duplicate taxonomies if equivalent concepts already
    exist.**

14. **Keep provider-specific code behind adapters.**

15. **Keep cascade/fallback policy outside provider adapters.**

16. **Never commit or expose the TypeSafe API key.**

17. **Do not commit model weights by default. Pin model IDs/revisions
    instead.**

18. **Normal unit tests must not require real credentials, network
    access, or model downloads.**

19. **Benchmark against the actual League of Dungeoneers corpus before
    replacing existing behavior.**

20. **Keep code in control of workflow, policy, calculations,
    thresholds, and side effects. Use decision models only for bounded
    semantic judgment.**

21. **Do not fine-tune Laya until the zero-shot baseline and
    gold/evaluation methodology are trustworthy.**

---

# Recommended Implementation Order

Work incrementally:

```text
1. Verify/read TypeSafe skill + current Jev docs
       ↓
2. Read current Laya docs/checkpoint limitations
       ↓
3. Inspect existing Phase 4
       ↓
4. Map current semantic decision points
       ↓
5. Identify useful decisions and their consumers
       ↓
6. Separate deterministic / decision-model / generative responsibilities
       ↓
7. Define provider-independent contract
       ↓
8. Build provider-independent LoD gold corpus
       ↓
9. Implement Laya adapter
       ↓
10. Implement Jev adapter
       ↓
11. Add multi-provider shadow mode
       ↓
12. Benchmark Laya checkpoints vs Jev vs existing approach
       ↓
13. Analyze disagreements and candidate-set effects
       ↓
14. Tune state/questions/taxonomy/retrieval
       ↓
15. Calibrate/evaluate uncertainty on held-out LoD data
       ↓
16. Implement and benchmark Laya → Jev cascade
       ↓
17. Decide which existing decisions, if any, should migrate
       ↓
18. Evaluate targeted verification opportunities
       ↓
19. Evaluate local-only mode
       ↓
20. Add caching / CLI / observability
       ↓
21. Consider LoD-specific Laya fine-tuning only if justified
       ↓
22. Document architecture and update workflow
```

Do not skip directly to migration or fine-tuning.

---

# Final Design Principle

The goal is **not**:

> Replace Jev with Laya, or use decision models everywhere.

The goal is:

> Keep exact rules and workflow in deterministic code. Use generative
> models where open-ended understanding or reconstruction is required.
> Use Laya locally for bounded semantic judgments where it demonstrates
> sufficient League of Dungeoneers quality. Escalate to Jev where the
> local model is uncertain or demonstrably weaker, and use an LLM only
> when the task genuinely requires generative reasoning.

The final provider policy must be chosen from **our own League of
Dungeoneers evaluation results**, not from vendor or third-party
benchmark claims.
