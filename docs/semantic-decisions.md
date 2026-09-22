# Semantic decisions

Phase 4.x adds a provider-independent layer that judges extracted rules. It does
not extract them, and it does not change them.

The rulebook PDF and the YAML under `corpus/` stay the source of truth. A
decision result is derived metadata. It is written under `generated/decisions/`,
which is gitignored. Nothing in `npm run validate` reads it.

## What Phase 4 actually is

There is no extraction program in this repository. Phase 4 is hand-written YAML
checked by deterministic code:

```text
rulebook PDF
  → human or agent reads the page
  → corpus/rules YAML
  → schema and integrity checks
  → optional semantic decisions, stored beside the corpus
```

`scripts/` does not call an LLM. The only model clients live in
`scripts/decisions/` and run when you invoke `npm run decisions`.

## Responsibilities

| Mechanism          | Owns                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Deterministic code | Schema validity, ids, references, numeric bounds, the mechanics DSL, and the fields already stored on a rule       |
| Laya or Jev        | A bounded judgment over a focus and a quoted passage: one choice, or the probability that a yes/no statement holds |
| A generative model | Open-ended rewriting. This repository does not ship one. The LLM adapter runs only if a caller injects a completer |

Preferred order when more than one mechanism could answer:

```text
deterministic code > local Laya > Jev > generative model
```

That order is a preference. It is not a quality claim. The gold set is how a
later change of order would be justified.

## Judgments

The question set is version `1` (`JUDGMENT_SET_VERSION` in
`scripts/decisions/pins.ts`). Questions are asked together over one state. None
of them sees another question's answer.

The model-visible state is `focus`, `source_text`, and, when a candidate list
was already retrieved, `term_candidates`. It does not include the rule id, the
stored `type`, or the effects. Some passages were split into several rules;
`focus` says which claim to judge.

| Judgment               | Primitive                                                               | Consumer                                                                                  | Uncertain or unavailable                                                            |
| ---------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `rule_type`            | Choice over the existing `rule.type` enum, plus `no_match`              | Shadow comparison with the stored type                                                    | Recorded. The stored type is left alone                                             |
| `conditional`          | Noul                                                                    | Compared with whether the rule has a `when`                                               | Same                                                                                |
| `has_exception`        | Noul                                                                    | Compared with `type: exception`, which only marks rules whose whole point is an exception | Same                                                                                |
| `cites_other_material` | Noul                                                                    | Compared with dependencies, table links, `see_also`, and unresolved references            | Same                                                                                |
| `completeness`         | Choice of `self_contained`, `possibly_incomplete`, `clearly_incomplete` | A review queue. No corpus field answers this                                              | Structural baseline leaves it unresolved on purpose                                 |
| `referenced_term`      | Choice over a supplied candidate list, plus `no_match`                  | Checks a shortlist. It is not asked until candidates exist                                | A list of 20 or more options is a known-weak Laya case and the cascade escalates it |

`referenced_term` is `no_match` when none of the candidates fits, or when
several fit equally. Choice sets stay small on purpose. The gold set includes
one case with 22 candidates so candidate-set size can be measured. Laya's own
documentation treats about 20 options as the point where its option-token budget
collapses labels. That limit is not an accuracy threshold copied from a
benchmark.

Completeness is a Choice rather than a Score because the gold label is one of
three exclusive descriptions, and those descriptions are the criteria.

## Providers

`SemanticDecisionProvider` is the boundary. Adapters only call one backend and
normalize its answer. Cascade policy is `scripts/decisions/cascade.ts`.

| `--provider` | Behavior                                                                             |
| ------------ | ------------------------------------------------------------------------------------ |
| `structural` | Reads fields already on the rule. This is the existing Phase 4 approach              |
| `laya`       | Local ONNX runtime                                                                   |
| `jev`        | TypeSafe API, model pointer `jev-latest` unless `TYPESAFE_DEFAULT_MODEL` is set      |
| `llm`        | Unavailable unless a process injects a completer. There is no default network client |
| `cascade`    | Laya, then Jev, then the LLM slot                                                    |
| `none`       | Canonical commands keep working. Classify reports every judgment unresolved          |

`--offline` skips Jev and the LLM slot. Laya remains local.

### Confidence is not one number

Laya choice confidence is one minus normalized entropy (`confidenceMeaning:
normalized_entropy`). Jev choice confidence summarizes how peaked the
distribution is (`distribution_peak`). A noul has no confidence. Its
`probabilityYes` is the whole answer, and a value near 0.5 means the model is
split between yes and no, not that the claim is middling.

The normalized report keeps the provider's number and says which statistic it
is. Do not compare a Laya confidence with a Jev confidence as if they were the
same measurement. Do not treat either number as proof the label is correct.

### Escalation

`CALIBRATION_VERSION` is `uncalibrated-0`. While that version is current, a low
probability does not escalate. Escalation happens when a provider fails, when
the answer is outside the supplied options, or when Laya is given a choice set
of 20 or more options.

Floors belong on `EscalationPolicy.choiceConfidenceFloor` and `noulMarginFloor`,
per provider. Set them only after measuring the validation split, then check
them on the held-out split. Do not copy a threshold from a vendor or third-party
benchmark. The development split is for reading question failures. It is not the
calibration set, and it is not the held-out set.

A cascade trace keeps every attempt, including a judgment that was not accepted.
Shadow mode, not the cascade, is what runs providers side by side so a
disagreement is visible.

## Laya

Read the upstream docs before changing the adapter:

- https://github.com/NandhaKishorM/laya
- https://huggingface.co/convaiinnovations/laya
- https://huggingface.co/convaiinnovations/laya-typed-decisions
- https://github.com/receptron/laya

The Node runtime is `@receptron/laya` `0.1.2`, ONNX Runtime, no Python. Weights
are not committed. On first use the package downloads the bundle into
`LAYA_CACHE` or `~/.cache/receptron-laya`.

Pinned bundle:

```text
repo: receptron/laya-onnx
revision: 68f27dfe5a27a54fb2b1fefc432f43f972e90868
checkpoint base: repo root, the English export of convaiinnovations/laya
```

`convaiinnovations/laya-typed-decisions` is a specialist for invoice processing,
security incidents, customer service, and agent-trace workflows. Its own model
card says to expect base-checkpoint behavior, or worse, on anything else.
The pinned ONNX repo did not contain a `typed-decisions` subfolder at that
revision, so `--checkpoint typed-decisions` reports `model_unavailable` instead
of pretending the specialist ran. Do not select a production checkpoint from
published benchmark tables. Select it from this gold set.

Install and run, opt-in:

```bash
npm install @receptron/laya
LAYA_INTEGRATION=1 npm test -- tests/decisions/laya.integration.test.ts
npm run decisions -- evaluate --provider laya --checkpoint base
```

The model is loaded once per process, not once per rule.

## Jev

The TypeSafe skill and the live docs override any sample in the phase plan.
Start at https://docs.typesafe.ai/llms.txt. This adapter was written against
`@typesafe-ai/sdk` `0.6.0`.

The client reads `TYPESAFE_API_KEY` from the environment. `npm run decisions`
also loads `.env.local` if a variable is not already set. The key is not
printed, not written into reports, and not required for `npm test`.

The SDK default model pointer is `jev-latest`. The report stores the model name
the API returns. That pointer can move, so a cached Jev answer should be
rebuilt with `--force` after a model change. The cache key includes the
configured model name, not a content hash of the weights.

```bash
JEV_INTEGRATION=1 TYPESAFE_API_KEY=... npm test -- tests/decisions/jev.integration.test.ts
npm run decisions -- evaluate --provider jev
```

Logs from the SDK are off. Ordinary unit tests inject `fetch` or pass
`apiKey: null` and do not open a connection.

## Gold set

`tests/fixtures/semantic-decisions-gold/cases.yaml` is provider-independent.
Schema: `schemas/semantic-decision-gold.schema.json`. It is not part of corpus
validation.

Twenty-four cases, eight in each of `development`, `validation`, and `held_out`.
Each corpus case stores a sha256 of the rule's `source_text`. A corpus edit that
changes the passage fails the gold test until the case is reviewed and the hash
is stamped again (`stampGoldHashes` in `scripts/decisions/gold.ts`).

The structural baseline disagrees with the gold `rule_type` on seven cases, on
purpose. The gold label follows the quoted text and the question criteria. The
stored type follows the extraction. Those cases are:

- `gold.skill.known`
- `gold.damage_bonus`
- `gold.warrior_priest.energy`
- `gold.skill.base_stat`
- `gold.lost_brother.skirmish`
- `gold.morale.hero_dies`
- `gold.arachnophobia`

`gold.no_rule.credits` is a no-match. It is not a corpus rule.

Do not tune questions or floors against `held_out`. Do not fine-tune Laya until
this zero-shot baseline and the split discipline are still intact. A fine-tune,
if it is ever justified, needs its own checkpoint name. It is not "Laya".

## Commands

```bash
npm run decisions -- classify --provider structural --rule core.check.standard
npm run decisions -- evaluate --provider structural
npm run decisions -- evaluate --provider structural --split validation
npm run decisions -- shadow --offline
npm run decisions -- disagreements
npm run decisions -- uncertain
npm run decisions -- benchmark --providers structural
npm run decisions -- benchmark --provider laya --checkpoint base
```

`--confidence-below` on `uncertain` is a display filter. It is not an
escalation policy.

`--all` shadows every corpus rule. A networked `--all` also requires `--force`,
so a casual command does not call Jev once per rule.

`evaluate` and `benchmark` write under `generated/decisions/evaluations/`.
`shadow` writes `generated/decisions/shadow/latest.json`. The cache is
`generated/decisions/cache/`. The cache key is a hash of the state, the
questions, the judgment-set version, the calibration version, and the provider
identity. Editing an unrelated script does not invalidate it. Changing a
question, the passage, the checkpoint revision, or the calibration version does.

Provider failure does not fail corpus validation. `classify` still exits 0 when
the provider is `none` or unavailable. `evaluate` exits 0 even when accuracy is
low. It exits 1 when the gold file itself is invalid.

## Tests

`tests/decisions/decisions.test.ts` covers question shape, escalation, cascade
traces, cache keys, malformed output, the gold hashes, and the structural
baseline. It does not need a network connection, an API key, or model weights.

`tests/decisions/laya.integration.test.ts` runs only when `LAYA_INTEGRATION=1`.
`tests/decisions/jev.integration.test.ts` runs only when `JEV_INTEGRATION=1`
and `TYPESAFE_API_KEY` is set.

Probabilistic output is not a CI assertion. The structural baseline is
deterministic, and its known disagreements are asserted exactly.

## What this layer does not do

It does not migrate stored rule types. It does not add a verification stage to
extraction. It does not implement the future player helper. A local helper that
routes a question to rule families, then retrieves evidence, then optionally
escalates, is the reason Laya is in the evaluation. The exporter does not grow
that runtime here.

No provider has been selected for production use. Published Laya and Jev
benchmarks are not evidence about these rules. Run the gold set, read the
disagreements, and only then change policy.

## Observed run

On 21 September 2026 the gold file was scored once, all three splits together.
That pass is a smoke benchmark. It is not a calibration, and it must not be
used to edit questions or floors, because the held-out split was included.

`structural` (`corpus-fields`) missed the synthetic no-rule case, so most of
its denominators are 23. Completeness is unanswered. `rule_type` 16/23,
`conditional` 19/23, `has_exception` 20/23, `cites_other_material` 15/23,
`referenced_term` 2/4.

`jev` returned model `jev-1.13.0`, with no request failures, mean latency about
319 ms. `rule_type` 17/24, `conditional` 18/24, `has_exception` 20/24,
`cites_other_material` 16/24, `completeness` 16/24, `referenced_term` 3/4.
The single choice set of 20 or more options was wrong (0/1).

Laya (`base` via `@receptron/laya` `0.1.2`, pinned ONNX revision
`68f27dfe5a27a54fb2b1fefc432f43f972e90868`) was scored in the same pass after the
weights were downloaded into the local cache. No failures, mean latency about
2883 ms per case, model loaded once per process. `rule_type` 7/24,
`conditional` 19/24, `has_exception` 13/24, `cites_other_material` 12/24,
`completeness` 14/24, `referenced_term` 2/4. By choice-set size:
`under_10` 16/27, `10_to_19` 7/24, `20_or_more` 0/1. The `rule_type` weakness is
concentrated in the 10–19-option set, which is where the plan warned Laya
weakens.

The `cascade` run (`laya>jev>llm`) equals the Laya numbers exactly. With
`CALIBRATION_VERSION = uncalibrated-0`, low confidence does not escalate, and
Laya had no failures and no 20+-option case that accepted a wrong answer
cheaply, so nothing reached Jev. This run shows the cascade machinery works; it
does not yet show a quality gain. Floors and confidence-based escalation stay
off until the validation split is measured separately.

`shadow` was run over the gold set with all three providers. 88 disagreement
rows, listed by `npm run decisions -- disagreements`. Laya and Jev agree with
each other on `rule_type` in most of the seven cases where the structural
baseline deliberately differs from the gold label. Cases where Laya and Jev
disagree (`gold.lost_brother.setup`, `gold.night_vision.perception`,
`gold.heirloom.sword`, `gold.lost_brother.skirmish`, `gold.morale.hero_dies`,
`gold.check.success`, `gold.arachnophobia`) are the review priority.

The typed-decisions checkpoint has no bundle at the pinned ONNX revision, so
it was not scored either.
