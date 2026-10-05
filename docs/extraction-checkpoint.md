# Extraction checkpoint (agent session log)

This file holds **moving extraction status**. It is not injected as always-on agent
context. Read it when the task is corpus extraction, Package F acceptance, or continuing
a phased batch. Do not copy this narrative back into [AGENTS.md](../AGENTS.md).

For phase structure and data model, see [LOD_RULES_CORPUS_PLAN.md](../LOD_RULES_CORPUS_PLAN.md).
For generated section/component progress, see [coverage-report.md](coverage-report.md).

## Phase overview

Phases 0–3 are complete. Phase 4 core mechanics are extracted and tested; its
[audit](phase-4-core-mechanics.md) records the historical milestone and boundaries.
Phase 5 Batches 1–6 are extracted within their catalogue scope. Batch 6 source evidence,
rule links and boundaries are recorded in [the completion inventory](package-a-completion-inventory.md).
Phase 6 Batches 1–6 are extracted within their bounded scope. Batch 5 travel and settlement
accounting, supplied inputs and unresolved source boundaries are recorded in
[the accounting ledger](travel-settlement-accounting.md).
The combat/treasure source checkpoint is recorded in
[combat-treasure-source-audit.md](combat-treasure-source-audit.md).
The catalogue follow-up is recorded in
[settlement-source-reconciliation.md](settlement-source-reconciliation.md).
Batch 6 character and guild evidence is recorded in [the procedure inventory](character-guild-procedures.md).
Phase 5 Batch 7 is accepted within catalogue scope; [quest source evidence](quest-scenario-inventory.md) records its completed units and pending work. The Dead Rising and Spider Queen campaigns,
random selector, three Lava River quests, both Bandits’ Hideout quests, both Fountain Room quests and estate side quest are catalogue-extracted. Returning the Relic, Slaying the Fiend and Closing the Portal are extracted within their bounded catalogue units.
All three Great Crypt quests (PDF 259–262) are catalogue-extracted within their bounded units.
Ancient Lands opening, Pyramid of Xánthu, Tomb of the Hierophant Temple of Despair, Halls of Amenhotep and Crypt of Khaba (PDF 263–272) are catalogue-extracted within their bounded units.
The Side Quests introduction and selector (PDF 273) are catalogue-extracted.
The Missing Brother (PDF 274) is catalogue-extracted within its bounded unit.
Slay the Beast (PDF 275–276) is catalogue-extracted within its bounded unit.
The Mapmaker (PDF 276) is catalogue-extracted within its bounded unit.
Go Fetch (PDF 277) is catalogue-extracted, including its newly mapped shield-condition table.
Manhunt (PDF 278) is catalogue-extracted within its bounded unit.
Mushrooms (PDF 279) is catalogue-extracted within its bounded unit.
All fifteen personal quest catalogue records are source-reconciled; lifecycle and independent review remain pending.
Package E acceptance accounts for all 124 inventory entries; its final gate validates 403 canonical files and passes 2482 tests.
Next: Phase 6 Batch 7 — conditions, interrupted rest, quest and estate lifecycle. The [lifecycle starting inventory](lifecycle-procedures.md) maps 87 unique headings with source dispositions; Rest interruption guards have passed a 403-file / 2488-test gate. Rest entry/accounting has passed a 403-file / 2499-test gate. Standard hero/point recovery has passed a 404-file / 2519-test gate. Rest-specific condition checks have passed a 405-file / 2538-test gate, with timing and no-rescue overlap recorded as unresolved. Bleeding entry injury/timer replay guards have passed a 405-file / 2549-test gate. Bleeding rescue/bandage guards have passed a 405-file / 2568-test gate. Bleeding terminal/removal and optional replacement checkpoints have passed a 406-file / 2586-test gate. Poison remaining-check accounting and source-map loopback have passed a 406-file / 2605-test gate. Poison initial exposure/episode initialization has passed a 406-file / 2624-test gate. Poison rest-sequence composition has passed a 406-file / 2641-test gate. Poison explicit cures and settlement state integration have passed a 407-file / 2663-test gate; its bounded procedure component is extracted with routing/source questions retained. Disease exposure, post-battle loss and optional rest cure passed a 407-file / 2685-test gate with 22 derived regressions. Disease explicit potion/Sick Ward cure checkpoints passed a 408-file / 2706-test gate with 21 derived regressions. Fire/Acidic hit and continuation plus Frost initial outcome passed a 409-file / 2738-test gate with 32 derived regressions; Acidic halving/protection order remains unresolved. Stun/Frost affected-turn AP consumption passed a 410-file / 2760-test gate with 22 derived regressions; zero AP and mixed-source overlap remain unresolved. Magic Damage ordinary/exception follow-up passed a 410-file / 2775-test gate with 15 derived regressions and unspecified creature details retained. Wounded current-status/fresh-turn cap passed a 411-file / 2802-test gate with 27 derived regressions, retaining active-turn timing and modifier-order questions. Sanity hero/event loss and exact-zero handoff passed a 412-file / 2831-test gate with 29 derived regressions; no overshoot clamp or automatic diagnosis is inferred. Conditions acquisition, duplicate rerolls and positive reset passed a 413-file / 2860-test gate with 29 derived regressions; historical diagnosis and exhaustion boundaries remain unresolved. Acute Stress owned quest/battle/expiry checkpoints passed a 414-file / 2883-test gate with 23 derived regressions; expiry diagnosis accounting remains unresolved. Lingering Trauma actual table selection/owned next-dungeon activation/departure passed a 415-file / 2917-test gate with 34 derived regressions; recurrence, reminder scope and diagnosis accounting remain unresolved. Jumpy actual Scenario/noise checkpoints and cross-condition ownership passed a 416-file / 2947-test gate, with 29 Jumpy regressions and 116 focused mental-condition checks; simultaneous Threat order/aggregation remains unresolved. Depression actual onset-capacity reduction passed a 417-file / 2974-test gate with 27 derived regressions; onset floor/current-Energy/treatment accounting questions remain unresolved. Fear of the Dark and Claustrophobia owned/contextual modifier checkpoints passed a 418-file / 2999-test gate with 25 derived regressions; individual all-skills/stats scope remains unresolved, and Encumbrance owns a separate contribution. Next bounded unit: Arachnophobia and Irrational Fear encounter applicability/selection, PDF57 / printed55.

Follow the [Phase 5 ledger](phase-5-entities-and-tables.md) and
[Phase 6 ledger](phase-6-procedures-and-state-machines.md). Neither phase is complete.

Extraction does not imply independent review. Unresolved issues remain in `review/`, and
coverage currently records no independently reviewed sections. Phases 7–9 have references,
tests and review groundwork, but their comprehensive passes remain unfinished. Phases 10–12
remain pending. See the [plan status](../LOD_RULES_CORPUS_PLAN.md#current-status--28-september-2026)
and generated [coverage report](coverage-report.md) for current progress.
Phase 4.x has an optional semantic-decision layer beside the corpus; calibration and
production-provider selection remain pending. It does not change canonical rules. See
[semantic-decisions.md](semantic-decisions.md).

## Package F session log

Arachnophobia and Irrational Fear now have bounded encounter classification/selection and reaction handoffs; source scope and randomization remain unresolved. Next bounded Package F unit: Hate and its source-linked talent lifecycle.

Hate diagnosis and linked Talent now have bounded once-only target/grant and owned check procedures, with absent Bestiary eligibility supplied and source uncertainties retained. Next Package F source unit: Reducing Insanity and settlement treatment links.

Sanity recovery/paid indulgence now has an owned actual-event procedure across PDF55/147; the two recovery headings have extracted procedure components with cap/overlap/frequency ambiguities retained. Next Package F unit: Treat Mental Conditions and disorder effect-removal handoff.

Mental-condition treatment now has selected-disorder and actual completed-result checkpoints composed with existing settlement accounting. Successful cures clear only the actual disorder flag; source-specific effect/capacity/history restoration remains unresolved. Next: reconcile Psychology cleanup/component dispositions, then quest lifecycle.

Mental-table bounded procedure evidence is reconciled, including current-contribution cure cleanup and explicit lasting-effect ambiguities. Next Package F unit: quest acceptance and quest-instance/party ownership. Phase 6 Batch 7 and Phases 7–12 remain unfinished.

Quest acceptance now has actual party/offer/distinct-occurrence ownership, main/side coexistence, immutable accepted provenance and supplied repeat/site eligibility. Next Package F source unit: quest departure and instance progression, then completion/abandonment/reward gates.

Actual quest departure now has a source-bound occurrence checkpoint and the previously unmapped Leaving on a Quest heading has a bijective source-map/coverage row. Next Package F unit: Slaying the Fiend progression/aftermath/loot, followed by Closing the Portal.

Slaying the Fiend now has bounded source-owned setup, persisted wounds, placement and defeat-gated aftermath/treasure handoff lifecycle evidence. Next Package F unit: Closing the Portal ritual, spawn/interruption and distinct closure/defeat/loot/payment gates.

Closing the Portal now has bounded source-owned preparation/groups, reading/restart/interruption/closure, actual schedule-supplied type-only spawning and distinct final-demon/treasure/outside hero-payment lifecycle evidence. Source ambiguities and external/supplied outcomes remain explicit, with no independent review. Next Package F source unit: Returning the Relic (PDF255). Phase 6 Batch 7 and Phases 7–12 remain unfinished.

Returning the Relic now has bounded source-owned setup/Threat, Luck nullification/expiry, Scenario events, objective requests, actual owned once-per-turn pending DEX refit and per-hero home payment. Scope, maximum20 interaction and unresolved consequences remain explicit; no independent review. Next Package F source unit: Retrieving the Family Heirloom, PDF259–260. Phase 6 Batch 7 and Phases 7–12 remain unfinished.

An early Phase 12 retrieval slice (`scripts/retrieve/`, `npm run retrieve`, [retrieval.md](retrieval.md)) indexes all canonical records lexically with provenance, quest scope, relations, review issues and external dependencies. It is a projection, not canonical data, and does not implement `build:corpus`. A 102-question labelled set (`tests/fixtures/ask-questions/`, labels unreviewed) measures question analysis. Jev plus lexical beats lexical recall on validation and held-out. Laya's judgments are weak, and the provisional Laya→Jev cascade escalated on every question. Results are in [retrieval.md](retrieval.md#labelled-questions). Package F (in progress; Family Heirloom lifecycle evidence is recorded in its bounded ledger entry) and comprehensive Phases 7–12 remain unfinished.

Retrieving the Family Heirloom now has bounded source-owned setup/Threat/Scenario, corpse-search override, objective six-tomb/card pool, actual unique opening/draw/outcomes and per-hero surface payment lifecycle evidence in the ledger. Card classification, supplied mummy/search outcomes, escape and unresolved consequences remain explicit; no independent review. Next Package F source unit: Stopping the Necromancer, PDF261/printed259. Phase 6 Batch 7 and comprehensive Phases7–12 remain unfinished.

Current Package F checkpoint (3 October): Stopping the Necromancer, Tomb Raiders,
shared resumable dungeon progression/reading/aftermath/Threat events and First Blood
have bounded lifecycle procedures and source-derived regressions. The test-owned
`tests/fixtures/acceptance/package-f.json` records all87 headings:24 implemented,
3 shared-model,1 narrative-only and59 pending. Final acceptance rejects pending
extraction and named implementation gaps. Dark Gods is narrative-only; no procedure
is invented. Next: remaining quest selectors/campaigns, estate and personal-quest
lifecycle, travel/settlement rest reconciliation, original candidate-loop audit and
Phase5/6 exit reconciliation. Package F, Phase6 Batch7 and comprehensive Phases7–12
remain unfinished; no independent review or commits are implied by extraction.
