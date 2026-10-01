# Travel and settlement accounting

## Package B — travel

PDF 126–130 were read and rendered; PDF 131 is setting text about Kredelia with no
quantified boon to extract. `table.travel.obstacles` preserves all 110 textual cells
on PDF 128–130. Its Example artwork remains in the PDF; geometry is explicitly supplied.
No reviewed status is claimed.

- `procedure.travel_daily_movement` takes one entering-hex step. `movement_day`
  establishes the 3/6 allowance once; `event_day` requires the daily event check first.
  Costs come from terrain and supplied transport eligibility, not a caller-supplied cost.
  Legal entries deduct 1, 1.5 or 2 points and advance position. Repeated and rejected
  entries cannot replenish the allowance. Geometry remains supplied.
- `procedure.travel_food_and_rest` retains its stable ID with three explicit phases.
  `food` owns party ration consumption, the daily Foraging attempt and temporary Party
  Morale changes. `hero` applies that shared food result to one hero’s Constitution;
  `rest` applies one hero’s daily recovery. Pass separate hero state and shared party
  state when composing. Saved hunger losses preserve unrelated Constitution changes.
  The ordinary requirement is one ration **per party**, not per hero. Ancient Lands
  requires two per hero and disallows Foraging. Partial Ancient Lands allocation is
  undefined in the source and surfaces `issue.travel.partial_rations` without mutation.
- Rest applies supplied HP and successful Energy dice outcomes, or full Energy from
  Bed Roll. HP recovery above the recorded maximum retains the existing unresolved
  `issue.phase4.recovery_bounds` instead of choosing a cap. Settlement lodging is separate. Each hero’s rest-day
  marker prevents repeated recovery. Dice are supplied; no random runtime is introduced.
- `procedure.travel_event_check` runs once before movement, retaining road/desert and
  wilderness thresholds and deck distinctions. Outdoor setup binds the full obstacle
  matrix, disables Threat/Scenario Dice and hands supplied combat outcomes onward.

Source-derived regressions: `tests/rules/travel-accounting.test.ts` and
`tests/tables/travel-obstacles.test.ts`. These cover rejected/repeated movement,
missing inputs, daily food and rest limits, hunger and restoration, incomplete supply,
event thresholds, supplied setup and an attack-to-damage composition.

Package B gate (29 September 2026): 242 canonical files validate; 1,466 tests pass
with two optional integrations skipped. Coverage, lint and diff checks pass.

## Package C — implemented settlement accounting

The three existing settlement procedure IDs are preserved. PDF 132–134 supplies
arrival, quest and activity rules; service citations now correctly use PDF 144 for
buying/selling, 146 for identification and 147 for repairs/recovery/treatments.
PDF 160 supplies owned-estate lodging. Catalogue dependencies bind real IDs.

- Arrival establishes counters once per genuine return, conditionally invokes events,
  derives random quest counts and eligible side quests, rejects Luck modification,
  and counts acceptance/rejection without allowing repeated availability rolls.
  Campaign availability, quest choices, map sites and resolved event consequences
  are supplied. A no-bed event blocks business but retains its reward exception.
- Activity state belongs to one hero: daily points, occupied-through day and recovery
  day. Shared party state records the longest occupied period, last activity day,
  lodging day and payer balance. Multi-day activities exclude even zero-point actions;
  inn-dependent zero-point activities require an inn stay. Scroll/enchantment caps
  are checked before reserving the last permitted activity. Shopping authorizes a
  shop visit, not a separate Activity Point for every item bought or repaired.
- Overnight charging is once per party/night, with consecutive-night accounting.
  Recovery is once per hero/night. Mana/Energy restore at paid inn/estate lodging;
  Luck only restores once per visit. Stable lodging charges nothing and requires
  morning departure. Its ambiguous half-stat recovery requires explicitly supplied
  amounts, and above-maximum HP recovery retains the existing unresolved issue.
  These are passage-local lodging effects; the conflicting Character Basics reset
  is not also applied.
- Purchases separately guard service, eligibility, activity completion, item lock,
  quote, funds and availability. Only a real failed availability attempt locks the
  item for the whole party. Successful attempts charge and grant one piece. Store
  each lock by item and settlement; a monotonic genuine-return visit ID releases it.
  Individual local/event price adjustments execute arithmetically. Simultaneous
  local/event adjustments require a supplied combined quote because the book gives
  no stacking order (`issue.settlement.price_modifier_combination`). Sales ignore
  local price variations and accept the explicitly supplied event factor.
- Sales, repairs, magic/potion identification, disease/poison treatment, mental
  treatment and quest rewards have separate guarded effects and prices. Treatment
  completion must be supplied only after the reserved duration; failed mental
  treatment still consumes its between-quest attempt. Guild learning/training and
  full estate/quest lifecycle execution remain their scheduled later batches.
- Quest departure requires acceptance, finished activity days, paid/fulfilled lodging
  obligations and no activity that morning. Its stored day prevents later calls
  from bypassing the prohibition by merely changing the departure flag.

The caller supplies actual service eligibility from the catalogues, correct activity
completion, item-specific state, and external outcomes. These are explicit composition
inputs, not automatically executed `invoke` calls. Scalar hero records and shared party
records must remain distinct; no gameplay runtime was added.

`tests/rules/travel-settlement.test.ts` checks the composed travel → arrival → activity
→ purchase → lodging → recovery → departure trace and rejection paths. It also covers
multiple heroes sharing lodging while their activities overlap, exhaustion and repeated
calls, source prices, availability boundaries, later-return locks and treatment limits.

Final Packages A–C gate (29 September 2026): 242 canonical files validate;
1,522 tests pass with two optional provider integrations skipped. Coverage regeneration
reports 696 sections and 696 coverage rows. Lint (ESLint, Prettier and TypeScript)
and `git diff --check` pass. This completes extraction for Phase 5 Batch 6 and
Phase 6 Batch 5; it does not constitute independent review or completion of later phases.
