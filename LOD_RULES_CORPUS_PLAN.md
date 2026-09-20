# League of Dungeoneers Rules Corpus — Extraction & Modeling Plan

> **Project goal:** Convert the *League of Dungeoneers* second-printing English rulebook into a machine-readable, reviewable, testable rules corpus.
>
> **Source document:** `sources/Rulebook-2nd-printing-ENGa.pdf`
>
> **Primary focus:** extraction, normalization, modeling, provenance, validation, state machines, rule dependencies, and generated data artifacts.
>
> **Explicitly out of scope:** the player-facing helper application, UI, chat experience, and runtime product integration.

---

## 1. Project objective

The goal is **not** to make an LLM memorize or repeatedly reread the full rulebook.

The goal is to build a **canonical representation of the rules that can later be used by an LLM, deterministic rules engine, CLI, website, test suite, or other software without requiring the entire PDF to be present in model context.**

The final corpus should make it cheap and reliable to answer questions such as:

- What is the definition of a term?
- Which rules apply in a given situation?
- What modifiers apply?
- What exceptions override a general rule?
- Which table row should be used?
- What steps occur in a game procedure?
- What state transitions are legal?
- What is the authoritative source for a result?
- Is a situation actually defined by the rulebook?
- Does the rulebook contain conflicting or ambiguous instructions?

The system should favor **deterministic structured data** over prose wherever the source permits it.

---



## 2. Source-derived observations that shape the design

The rulebook is especially suitable for structured extraction because it contains a mixture of:

- definitions and abbreviations;
- character stats, skills, professions, species, backgrounds, talents, and perks;
- equipment;
- psychology rules;
- progression and level-up tables;
- academic skills;
- magic, magic items, enchantments, alchemy, and prayers;
- dungeon generation and exploration procedures;
- turn sequencing;
- movement, facing, obstacles, searching, doors, traps, and encounters;
- initiative;
- combat;
- damage;
- travel and skirmishes;
- settlements, activities, guilds, estates, and economy;
- large appendices containing reference-heavy data;
- quest-specific rules and scenario-specific exceptions.

The rulebook also explicitly distinguishes concepts whose wording matters mechanically. Examples include distinctions such as **Battle** versus **Combat**, and standard abbreviations such as AP, DEF, DMG, DUR, ENC, LOS, NA, PM, and others.

The book defines a general percentile-check system, but also includes absolute result rules and exceptions. For example, a normal test succeeds when the roll is equal to or below the modified value, while sufficiently high rolls can still fail regardless of the nominal target value. This demonstrates why the corpus must distinguish:

- base values;
- permanent modifications;
- temporary/conditional modifiers;
- effective values;
- absolute overrides;
- special outcomes.

The book also contains explicit procedures such as the dungeon turn sequence. Such material should be modeled as procedures/state machines rather than stored only as prose.

Finally, the source acknowledges that some combinations of game events may not be fully covered and may require a house rule. Therefore the corpus must preserve **undefined and ambiguous states** instead of inventing deterministic answers.

### Important source boundary

The rulebook states that some material is outside this document, notably enemy information and encounter tables in the **Bestiary**, and frequently used charts in a separate **Charts Compendium**.

This repository should therefore support external dependencies explicitly.

Never invent missing material from those books.

---



# 3. Guiding principles



## 3.1 The PDF remains the source of truth

Structured data is a compiled interpretation of the source.

Every extracted fact must retain provenance.

A structured rule without a source reference is incomplete.

---



## 3.2 Prefer structure over embeddings

Use structured representations whenever possible:


| Source material                 | Canonical representation  |
| ------------------------------- | ------------------------- |
| Term or definition              | glossary entry            |
| Numeric lookup                  | table                     |
| Random result chart             | random table              |
| Character/profession/item/spell | entity                    |
| Modifier or restriction         | atomic rule               |
| Multi-step activity             | procedure                 |
| Turn/battle lifecycle           | state machine             |
| Rule interaction                | dependency/override graph |
| Ambiguous prose                 | issue/review record       |
| Worked example                  | test fixture              |


Semantic search/RAG may later be generated from the corpus, but it should not replace structured mechanics.

---



## 3.3 Do not silently interpret uncertain rules

When source material is unclear:

1. preserve the original meaning as faithfully as possible;
2. mark the extracted interpretation as uncertain;
3. create an issue in the review queue;
4. retain all relevant source references;
5. do not "fix" the rule.

The corpus must be able to represent:

- `confirmed`
- `likely`
- `ambiguous`
- `conflicting`
- `missing_reference`
- `possible_typo`
- `external_dependency`
- `rulebook_undefined`

---



## 3.4 Separate canonical source data from generated data

Human-reviewed YAML/JSON is canonical.

Generated artifacts such as SQLite databases, flattened JSON bundles, search indexes, dependency indexes, or embeddings must be reproducible.

Never hand-edit generated output.

---



## 3.5 Preserve rule scope and timing

A modifier is not useful unless we know when it applies.

Rules should explicitly model concepts such as:

- character creation;
- dungeon only;
- skirmish only;
- settlement only;
- during battle;
- once per battle;
- once per turn;
- once between settlement visits;
- until end of turn;
- until end of battle;
- until end of quest;
- permanent;
- optional rule;
- scenario-specific rule.

---



## 3.6 Exceptions are first-class data

Board-game rules often follow the pattern:

> General rule → specific rule → exception → ability that overrides the exception.

Do not bury exception behavior in descriptive text.

Represent it directly.

---



# 4. Proposed repository layout

```text
.
├── README.md
├── RULES_CORPUS_PLAN.md
├── AGENTS.md
│
├── source/
│   ├── Rulebook-2nd-printing-ENGa.pdf
│   └── manifest.yaml
│
├── schemas/
│   ├── common.schema.json
│   ├── source-reference.schema.json
│   ├── glossary.schema.json
│   ├── rule.schema.json
│   ├── entity.schema.json
│   ├── table.schema.json
│   ├── procedure.schema.json
│   ├── state-machine.schema.json
│   ├── dependency.schema.json
│   ├── issue.schema.json
│   └── test-case.schema.json
│
├── corpus/
│   ├── glossary/
│   │   ├── terms.yaml
│   │   └── aliases.yaml
│   │
│   ├── rules/
│   │   ├── core/
│   │   ├── characters/
│   │   ├── equipment/
│   │   ├── psychology/
│   │   ├── magic/
│   │   ├── alchemy/
│   │   ├── prayers/
│   │   ├── dungeon/
│   │   ├── combat/
│   │   ├── travel/
│   │   ├── settlements/
│   │   └── quests/
│   │
│   ├── entities/
│   │   ├── species/
│   │   ├── professions/
│   │   ├── backgrounds/
│   │   ├── talents/
│   │   ├── perks/
│   │   ├── equipment/
│   │   ├── spells/
│   │   ├── prayers/
│   │   ├── potions/
│   │   ├── conditions/
│   │   ├── settlements/
│   │   └── treasures/
│   │
│   ├── tables/
│   │   ├── character/
│   │   ├── equipment/
│   │   ├── psychology/
│   │   ├── magic/
│   │   ├── alchemy/
│   │   ├── dungeon/
│   │   ├── combat/
│   │   ├── travel/
│   │   ├── settlement/
│   │   └── treasure/
│   │
│   ├── procedures/
│   │   ├── core/
│   │   ├── character/
│   │   ├── dungeon/
│   │   ├── combat/
│   │   ├── travel/
│   │   └── settlement/
│   │
│   ├── state-machines/
│   │   ├── dungeon-turn.yaml
│   │   ├── battle.yaml
│   │   ├── hero-activation.yaml
│   │   ├── enemy-activation.yaml
│   │   ├── travel.yaml
│   │   └── quest-lifecycle.yaml
│   │
│   ├── graph/
│   │   ├── dependencies.yaml
│   │   ├── overrides.yaml
│   │   └── references.yaml
│   │
│   └── source-map/
│       ├── sections.yaml
│       ├── pages.yaml
│       └── coverage.yaml
│
├── review/
│   ├── ambiguities.yaml
│   ├── conflicts.yaml
│   ├── possible-typos.yaml
│   ├── missing-references.yaml
│   ├── external-dependencies.yaml
│   └── review-queue.yaml
│
├── tests/
│   ├── schema/
│   ├── examples/
│   ├── rules/
│   ├── procedures/
│   └── regression/
│
├── scripts/
│   ├── validate/
│   ├── extract/
│   ├── build/
│   └── reports/
│
├── generated/
│   ├── rules.json
│   ├── tables.json
│   ├── entities.json
│   ├── dependency-graph.json
│   ├── search-documents.jsonl
│   └── lod-rules.sqlite
│
└── docs/
    ├── ontology.md
    ├── extraction-guide.md
    ├── naming-conventions.md
    ├── precedence-model.md
    ├── coverage-report.md
    └── known-issues.md
```

`AGENTS.md` is intentionally listed even though it is not part of the first deliverable. Once the conventions stabilize, it should contain concise operating instructions for Codex/agents working in the repository.

---



# 5. Canonical data model

The following is the intended conceptual model. Exact schemas should be finalized during the pilot phase rather than frozen prematurely.

---



## 5.1 Source reference

Every meaningful extracted object should contain one or more source references.

```yaml
source:
  document: rulebook.second_printing.eng
  file: source/Rulebook-2nd-printing-ENGa.pdf

  printed_page: 18
  pdf_page: null

  section: Game Basics
  heading: Turn Sequence

  locator:
    paragraph: null
    table: null
    row: null

  extraction:
    method: text
    confidence: 1.0
    visually_verified: false
```



### Notes

- `printed_page` means the page label shown in the rulebook.
- `pdf_page` means the physical page index in the PDF.
- Do not assume they are identical.
- Either may be temporarily unknown.
- Tables may additionally identify row/column or region.
- Page images should be checked when PDF text extraction is unreliable.

---



## 5.2 Glossary term

```yaml
id: term.battle
name: Battle
type: temporal_scope

definition: >
  Canonical normalized definition.

aliases: []

mechanically_significant: true

related:
  - term.combat

source:
  - ...
```

Possible term types:

```text
abbreviation
concept
resource
stat
skill
temporal_scope
spatial_concept
action_type
damage_type
item_property
spell_property
rule_keyword
```

---



## 5.3 Atomic rule

```yaml
id: core.check.standard
name: Standard Skill or Stat Check

category: core
type: procedure_rule

scope:
  modes:
    - global

trigger:
  event: check_requested

inputs:
  - target_value
  - modifier
  - roll

conditions: []

effects:
  - type: compute
    target: effective_target
    expression: target_value + modifier

resolution:
  - id: automatic_failure
    priority: absolute
    when: roll >= 91
    result: failure

  - id: normal_success
    priority: normal
    when: roll <= effective_target
    result: success

  - id: normal_failure
    priority: fallback
    result: failure

exceptions: []
overridden_by: []
references: []

source:
  - ...

status: extracted
review:
  confidence: high
```

---



## 5.4 Rule types

At minimum, support:

```text
definition
constraint
calculation
modifier
trigger
reaction
procedure_rule
choice
duration
exception
override
resource_change
random_resolution
lookup
entity_property
state_transition
special_rule
optional_rule
scenario_rule
```

A rule may contain more than one mechanism, but splitting into atomic rules is preferable when the pieces have independent triggers or scopes.

---



## 5.5 Entity

Entities represent named game objects rather than general rules.

```yaml
id: profession.alchemist
type: profession
name: Alchemist

properties:
  ...

starting_equipment:
  ...

skill_modifiers:
  ...

granted:
  talents: []
  perks: []

constraints:
  ...

rules:
  - ...

source:
  - ...
```

Likely entity types:

```text
species
profession
background
talent
perk
weapon
armour
equipment
tool
consumable
spell
prayer
potion
ingredient
condition
settlement
guild
treasure
quest
scenario
```

---



## 5.6 Table

Tables must remain tables.

Do not convert tabular source material into prose.

```yaml
id: table.character.level_progression
name: Level progression
type: lookup_table

columns:
  - id: level
    type: integer

  - id: xp_requirement
    type: integer

  - id: hit_point_increase
    type: dice_or_integer

rows:
  - level: 1
    xp_requirement: 0
    hit_point_increase: 0

  - level: 2
    xp_requirement: 2000
    hit_point_increase:
      dice: 1d2

source:
  - ...

status: extracted
```



### Table categories

Support at least:

```text
lookup_table
random_table
progression_table
price_table
modifier_table
encounter_table
equipment_table
result_table
cross_reference_table
```

---



## 5.7 Procedure

Procedures model ordered instructions.

```yaml
id: procedure.dungeon_turn
name: Dungeon Turn

steps:
  - id: scenario
    order: 1
    action: roll_scenario_die
    substeps:
      - conditional_threat_roll
      - resolve_light_sources

  - id: activations
    order: 2
    action: resolve_actors_by_initiative

  - id: wandering_monsters
    order: 3
    action: move_wandering_monsters

  - id: post_battle
    order: 4
    condition: battle_won_this_turn
    action: increase_threat

  - id: psychology
    order: 5
    actions:
      - check_sanity
      - check_party_morale

source:
  - ...
```

Procedures may reference atomic rules rather than duplicating them.

---



## 5.8 State machine

Use state machines where legality or transitions depend on current state.

Example conceptual structure:

```yaml
id: state_machine.battle
initial: not_in_battle

states:
  not_in_battle:
    transitions:
      - event: enemy_spotted
        to: battle_started

  battle_started:
    enter:
      - establish_initiative
    transitions:
      - event: initiative_resolved
        to: active

  active:
    transitions:
      - event: no_enemies_remaining
        to: battle_ended

  battle_ended:
    terminal: true
```

Do not force every procedure into a state machine. Use the simpler representation when ordering is enough.

---



## 5.9 Dependency and override graph

Rules frequently depend on or modify other rules.

Represent relationships explicitly.

```yaml
- from: combat.attack
  relation: requires
  to: core.check.standard

- from: talent.example
  relation: modifies
  to: combat.some_rule

- from: ability.example
  relation: overrides
  to: movement.some_restriction
```

Recommended relation types:

```text
requires
references
modifies
overrides
ignores
prevents
triggers
enables
disables
uses_table
uses_entity
starts_procedure
ends_procedure
applies_during
```

---



## 5.10 Issue / ambiguity record

```yaml
id: issue.0042
type: ambiguity

summary: >
  Short description of the problem.

related:
  - rule.some_rule
  - rule.other_rule

source:
  - ...
  - ...

observations:
  - ...

candidate_interpretations:
  - ...
  - ...

status: unresolved

resolution: null
```

The purpose is not to force a ruling.

The purpose is to preserve uncertainty transparently.

---



# 6. Rule precedence model

A precedence system will be required, but it must be **derived from the source**, not invented globally.

Until the rulebook establishes otherwise, use a neutral structural model:

```text
general rule
    ↓
context-specific rule
    ↓
entity-specific rule
    ↓
explicit exception
    ↓
explicit override
```

This is a modeling framework, not automatically a game rule.

Each actual override relationship must be supported by source text.

The corpus must be capable of representing:

- an exception that changes a general rule;
- an ability that explicitly ignores a restriction;
- an effect that only modifies one step of a procedure;
- an absolute rule that dominates ordinary modifiers;
- multiple unresolved rules with no source-defined precedence.

---



# 7. Status model

Every canonical object should have an extraction/review status.

Recommended states:

```text
discovered
extracted
schema_valid
cross_referenced
visually_verified
reviewed
confirmed
```

Issue-like states:

```text
ambiguous
conflicting
missing_reference
possible_typo
external_dependency
rulebook_undefined
```

A useful implementation is to separate:

```yaml
status:
  extraction: extracted
  schema: valid
  review: pending
```

rather than forcing all concerns into one enum.

---



# 8. Confidence model

Use confidence conservatively.

Suggested values:

```text
high
medium
low
```



### High

- clear prose;
- clean table;
- unambiguous heading;
- exact numerical value;
- visually verified when extraction was difficult.



### Medium

- meaning appears clear but depends on another unresolved rule;
- layout creates minor uncertainty;
- interpretation requires combining nearby paragraphs.



### Low

- ambiguous grammar;
- conflicting text;
- damaged/misaligned extraction;
- unclear table relationships;
- rule appears to rely on missing material.

Confidence is **not** a substitute for review status.

---



# 9. Naming conventions

IDs should be stable, descriptive, lowercase, and semantic.

Examples:

```text
term.line_of_sight
term.battle

core.check.standard
core.check.perfect_result

character.encumbrance.limit
character.level.maximum_skill

profession.alchemist
profession.thief

talent.night_vision

equipment.weapon.longsword

combat.attack.hero
combat.damage.resolve

procedure.dungeon_turn
procedure.open_door

table.character.level_progression

state_machine.battle
```

Avoid page numbers in canonical IDs.

Page locations can change between editions; concepts should remain identifiable.

---



# 10. Extraction strategy

Do not run one giant "convert the book to JSON" prompt.

The book should be compiled incrementally.

Each extraction unit should be:

- small enough to inspect;
- large enough to preserve context;
- associated with its chapter/heading;
- validated immediately;
- committed independently where practical.

Recommended unit:

```text
1 heading or
1 table or
1 tightly-related 1–4 page range
```

For complex mechanics, extract a complete logical subsection even if it spans more pages.

---



# 11. Phase plan

---



## Phase 0 — Repository bootstrap



### Goal

Create a reproducible repository before extracting rules.

### Tasks

- Add the source PDF.
- Create `source/manifest.yaml`.
- Create the directory structure.
- Add JSON Schema tooling.
- Add YAML/JSON validation scripts.
- Add formatting/linting.
- Add a test runner.
- Add a coverage-report skeleton.
- Establish naming conventions.
- Establish provenance conventions.
- Establish generated-vs-canonical file rules.



### `source/manifest.yaml`

Suggested initial shape:

```yaml
documents:
  - id: rulebook.second_printing.eng
    title: League of Dungeoneers Rulebook
    edition: second_printing
    language: eng
    file: Rulebook-2nd-printing-ENGa.pdf
    canonical: true

external_sources:
  - id: bestiary
    status: not_present

  - id: charts_compendium
    status: not_present

  - id: quest_book_ii
    status: not_present
```



### Deliverables

- repository layout;
- manifest;
- validation command;
- test command;
- contributor/agent conventions.



### Exit criteria

```text
[ ] Repository validates with no corpus data.
[ ] Generated folders are clearly marked.
[ ] Source document identity is recorded.
[ ] Canonical/generated boundaries are documented.
```

---



## Phase 1 — Structural map of the rulebook



### Goal

Build a complete navigational model before extracting detailed mechanics.

### Extract

- chapters;
- sections;
- subsections;
- appendices;
- tables;
- examples;
- optional rules;
- scenario rules;
- cross references;
- external-book references.



### Important chapter areas identified from the source

The rulebook contents include major sections covering:

- Introduction
- Game Basics
- Party Management
- Character Basics
- Creating Your Character
- Backgrounds
- Equipment
- Psychology
- Embarking on Your First Quest
- Levelling Up
- Academic Skills
- Magic
- Magic Items
- Enchantments
- Alchemy
- Prayers
- Dungeoneering and Combat
- Into the Dungeons
- Combat
- Travelling and Skirmishes
- settlements and settlement activities
- guilds
- estates
- appendices for Perks, Talents, Equipment, Spells, and Treasures
- quests



### Files

```text
corpus/source-map/sections.yaml
corpus/source-map/pages.yaml
corpus/source-map/coverage.yaml
```



### `sections.yaml`

```yaml
- id: section.game_basics
  title: Game Basics
  printed_start_page: 17

- id: section.combat
  title: Combat
  printed_start_page: 107
```

The table of contents is a starting point only.

Headings found in the body should be reconciled against it.

### Coverage states

Each structural node should have:

```text
not_started
mapped
extracting
extracted
reviewed
```



### Exit criteria

```text
[ ] Every chapter is represented.
[ ] Every major appendix is represented.
[ ] Every known table has an inventory entry.
[ ] Every explicit external reference is catalogued.
[ ] Coverage report can identify unprocessed sections.
```

---



## Phase 2 — Glossary and ontology



### Goal

Define the game's vocabulary before modeling complex rules.

### First extraction target

Start with the rulebook's **Abbreviations and Terminology** section.

This section gives us high-value primitives such as:

```text
Adjacent
AP
Armour Piercing
Battle
Combat
CS
DB
DEF
DMG
DUR
ENC
End of the Quest
Enemies
Heroes
HP
LOS
Movement
Model
Monster
NA
Party Morale
Perk
Skill
Skill Test
Stat
Talent
XP
ZOC
```



### Tasks

- Extract every glossary term.
- Create aliases.
- Mark synonyms.
- Separate abbreviations from concepts.
- Identify temporal concepts.
- Identify spatial concepts.
- Identify resources and stats.
- Identify terms that have mechanically meaningful differences.



### Special attention

Preserve distinctions such as:

```text
Battle != Combat
Character ~= Model
Enemy ~= Monster
```

Do not flatten these into one term unless the rulebook explicitly states equivalence.

### Deliverables

```text
corpus/glossary/terms.yaml
corpus/glossary/aliases.yaml
docs/ontology.md
```



### Exit criteria

```text
[ ] All explicit glossary entries are represented.
[ ] Aliases resolve deterministically.
[ ] Mechanically significant distinctions are preserved.
[ ] Other corpus objects can reference glossary IDs.
```

---



## Phase 3 — Schema pilot on representative rules



### Goal

Stress-test the schemas before bulk extraction.

Do **not** proceed to the entire rulebook until this phase survives review.

### Representative pilot set

Use material that exercises different modeling needs.

#### A. Core percentile checks

Model:

- normal Skill/Stat check;
- modifiers;
- automatic failure range;
- perfect results;
- permanent versus temporary changes.



#### B. Dungeon turn sequence

Model as both:

- an ordered procedure;
- a candidate state-machine relationship where appropriate.



#### C. Level progression

Extract a real structured progression table.

#### D. One profession

Recommended: Alchemist.

Why:

- skill modifiers;
- starting equipment;
- talent/perk references;
- equipment restriction;
- cross references into another chapter.



#### E. One profession with procedural special rule

Recommended: Thief.

Why:

- hard equipment limits;
- Treasure Card procedure modification.



#### F. Several talents

Choose examples that exercise:

- simple stat bonus;
- conditional modifier;
- creation-time restriction;
- ignored special rule;
- initiative modification;
- changed trigger range.



### What this phase should reveal

- whether rule schemas are too generic;
- whether conditions/effects are expressive enough;
- whether typed dice expressions are adequate;
- whether source references are sufficiently precise;
- whether exceptions require their own schema;
- whether entity rules should be embedded or referenced;
- whether state machines are being overused.



### Exit criteria

```text
[ ] All pilot material validates.
[ ] No pilot rule requires arbitrary prose-only escape hatches for its main mechanic.
[ ] Provenance is sufficient to locate the source.
[ ] Exceptions can be represented directly.
[ ] Tables round-trip without losing information.
[ ] Pilot examples can become executable tests.
```

---



## Phase 4 — Core mechanics



### Goal

Extract the reusable foundation on which later rules depend.

### Priority areas

1. Dice conventions
2. Skill and Stat checks
3. Perfect results
4. Action Points
5. adjacency
6. Line of Sight
7. movement primitives
8. character/model terminology
9. basic stats and derived values
10. Hit Points
11. Damage Bonus
12. Natural Armour
13. Energy
14. Luck
15. Movement
16. encumbrance
17. durability
18. sanity
19. Party Morale
20. timing concepts
21. quest lifecycle concepts



### Why first

Later systems reference these repeatedly.

If core mechanics are unstable, extracting combat/magic will duplicate or contradict them.

### Exit criteria

```text
[ ] Common rule primitives are reusable references.
[ ] Later rules do not need to redefine basic check logic.
[ ] Timing terms have canonical IDs.
[ ] Resource/stat modifications are typed.
```

---



## Phase 5 — Entities and tables



### Goal

Convert data-heavy parts of the book into normalized machine-readable objects.

### Entity extraction order

Recommended:

1. species
2. professions
3. backgrounds
4. talents
5. perks
6. equipment
7. magic items
8. spells
9. prayers
10. alchemical data
11. treasures
12. settlements/guild-related entities
13. quest/scenario entities



### Table extraction

Every meaningful table should become a typed object.

Examples may include:

- level progression;
- racial/stat limits;
- profession skill modifiers;
- equipment properties;
- prices;
- durability;
- spell data;
- potion/alchemy results;
- random result tables;
- treasure tables;
- settlement tables;
- quest-specific tables.



### Dice expressions

Do not leave expressions such as:

```text
1d4
2d6+3
1d100
```

as arbitrary prose.

Use a typed representation, for example:

```yaml
dice:
  count: 2
  sides: 6
  modifier: 3
```

Human-readable source text can be retained alongside it.

### Range expressions

For random tables:

```yaml
range:
  min: 3
  max: 5
```

Do not store `3-5` as the only representation.

### Exit criteria

```text
[ ] Every extracted table preserves all rows and columns.
[ ] Every row has stable meaning.
[ ] Dice expressions are typed.
[ ] Entity references resolve.
[ ] Embedded restrictions are converted into rules where appropriate.
```

---



## Phase 6 — Procedures and state machines



### Goal

Model multi-step gameplay mechanics.

### Candidate procedures

At minimum investigate:

- character creation;
- embarking on a quest;
- dungeon turn;
- dungeon generation;
- exploration-card resolution;
- threat handling;
- opening doors/chests;
- opening portcullises;
- searching;
- encounters;
- initiative;
- hero activation;
- enemy activation;
- attack resolution;
- thrown potion resolution;
- damage resolution;
- bleeding out;
- healing;
- rest;
- travel;
- events;
- skirmishes;
- settlement visit;
- buying/selling;
- repair;
- identifying items;
- leveling;
- learning spells/prayers;
- training;
- guild activities.



### State-machine candidates

Use state machines only when current state governs legal transitions.

Likely candidates:

```text
dungeon turn
battle lifecycle
hero activation
enemy activation
quest lifecycle
travel lifecycle
settlement visit
bleeding/knockout/death-like states
temporary effect durations
```



### Procedure vs state machine rule

Use:

```text
procedure
```

when the source is mainly an ordered sequence.

Use:

```text
state machine
```

when:

- transitions depend on current state;
- different events cause branching;
- legal actions change by state;
- effects persist across multiple steps;
- terminal states matter.



### Exit criteria

```text
[ ] Major game loops are explicitly modeled.
[ ] Procedure steps reference atomic rules rather than duplicate them.
[ ] State-machine transitions have documented triggers.
[ ] Branches and terminal states are source-backed.
```

---



## Phase 7 — Rule dependency graph and precedence



### Goal

Make interactions discoverable.

### Build relationships

For every rule/entity/procedure:

- what does it reference?
- what does it require?
- what can modify it?
- what can override it?
- which table does it use?
- which state/procedure invokes it?
- which temporal scope applies?



### Example conceptual graph

```text
hero attack
  ├── requires → combat skill/ranged skill check
  ├── uses → attack modifiers
  ├── references → LOS
  ├── references → range
  ├── on success → damage procedure
  └── may trigger → special weapon/talent rules
```



### Detect

- dangling references;
- unknown glossary terms;
- circular dependencies;
- potential contradictory rules;
- rules that appear duplicated in multiple chapters;
- summary rule versus detailed rule relationships.



### Important extraction rule

A short summary in an early chapter must not silently override a more detailed rule later.

Record explicit relationships such as:

```text
summary_of
expanded_by
```

where appropriate.

### Exit criteria

```text
[ ] No unexplained internal references remain.
[ ] External references are marked external.
[ ] Override relationships are explicit.
[ ] Dependency graph can answer "what could affect this rule?"
```

---



## Phase 8 — Examples as executable tests



### Goal

Turn examples in the rulebook into regression tests.

The rulebook's examples are particularly valuable because they reveal intended interactions.

### Test categories

```text
skill/stat checks
movement
LOS
combat
damage
equipment
spells
alchemy
psychology
initiative
treasure
travel
settlements
quest-specific mechanics
```



### Test shape

```yaml
id: example.core.check.001
source:
  ...

given:
  target_value: 80
  modifiers:
    - 10
    - 20

when:
  roll: 95

expect:
  result: failure
  applied_rules:
    - core.check.automatic_failure
```



### Test requirements

Tests should verify both:

1. **result**
2. **rule trace**

A result can accidentally be correct for the wrong reason.

### Exit criteria

```text
[ ] Every useful worked example has been considered for conversion.
[ ] Tests validate both outcome and applied rules.
[ ] Refactors can detect semantic regressions.
```

---



## Phase 9 — Ambiguity, conflict, and external-dependency review



### Goal

Create a corpus that knows what it does **not** know.

### Review sources

Flag:

- apparent contradictions;
- unclear pronouns;
- unclear timing;
- unspecified rounding;
- overlapping modifier rules;
- undefined ordering;
- inconsistent terminology;
- likely typographical errors;
- tables that do not match descriptive text;
- references to books not present in the repository;
- quest-specific exceptions that interact with global rules.



### Classification

Every unresolved situation should become one of:

```text
ambiguous
conflicting
possible_typo
missing_reference
external_dependency
rulebook_undefined
```



### Rulebook-undefined is important

If the book intentionally expects players to make a house ruling for unusual cases, the corpus must not hallucinate a canonical result.

### Exit criteria

```text
[ ] No known ambiguity exists only in someone's notes.
[ ] Every conflict has source references.
[ ] External-book requirements are explicit.
[ ] Undefined scenarios can be represented as undefined.
```

---



## Phase 10 — Full-book coverage pass



### Goal

Systematically process all remaining source sections.

### Method

Work chapter by chapter.

For each section:

```text
1. map headings
2. identify terms
3. identify entities
4. identify tables
5. extract atomic rules
6. extract procedures
7. record exceptions
8. resolve references
9. add tests/examples
10. update coverage
11. validate
12. review
```



### Recommended order

A dependency-friendly order is:

```text
Game Basics
→ Party/Character Basics
→ Character Creation
→ Backgrounds
→ Equipment
→ Psychology
→ Levelling
→ Academic Skills
→ Magic
→ Magic Items
→ Enchantments
→ Alchemy
→ Prayers
→ Into the Dungeons
→ Combat
→ Travel/Skirmishes
→ Settlements/Guilds/Estate
→ Appendices
→ Quests
```

Appendices may be extracted earlier if their data is required by a chapter.

### Exit criteria

```text
[ ] Every mapped section is extracted or explicitly excluded.
[ ] Coverage report contains no unknown gaps.
[ ] All corpus files validate.
[ ] All internal references resolve.
```

---



## Phase 11 — Build generated artifacts



### Goal

Compile human-reviewed canonical data into formats useful for future software.

### Generated outputs

```text
generated/rules.json
generated/entities.json
generated/tables.json
generated/dependency-graph.json
generated/search-documents.jsonl
generated/lod-rules.sqlite
```



### SQLite purpose

SQLite is not the canonical source.

It is a compiled artifact that makes later usage simple and cheap.

Possible tables:

```text
rules
rule_conditions
rule_effects
rule_relations
entities
entity_properties
tables
table_rows
procedures
procedure_steps
state_machines
state_transitions
terms
aliases
source_refs
issues
tests
```



### Build requirement

Running:

```bash
make build
```

or equivalent should recreate all generated artifacts from canonical source files.

### Exit criteria

```text
[ ] Build is deterministic.
[ ] No generated file needs manual edits.
[ ] SQLite contains source references.
[ ] Dependency graph can be queried.
```

---



## Phase 12 — Semantic retrieval corpus



### Goal

Generate an LLM-friendly retrieval layer **from the canonical corpus**.

This phase still belongs to the corpus project; it is not the helper application.

### Generate retrieval documents for

- individual rules;
- entities;
- procedures;
- tables;
- glossary terms;
- unresolved issues.

Example generated document:

```json
{
  "id": "combat.attack.hero",
  "title": "Hero attacking",
  "text": "...normalized retrieval text...",
  "tags": ["combat", "attack", "hero"],
  "depends_on": ["core.check.standard"],
  "sources": [...]
}
```



### Retrieval design

Prefer hybrid retrieval later:

```text
ID lookup
+ graph expansion
+ metadata filtering
+ lexical search
+ vector similarity
```

Vector similarity should be the fallback for fuzzy language, not the only means of finding a rule.

### Exit criteria

```text
[ ] Retrieval text is generated.
[ ] Canonical IDs remain available.
[ ] Source provenance survives generation.
[ ] No semantic index becomes the source of truth.
```

---



# 12. Quality gates

No phase should be considered complete merely because files exist.

Use the following gates.

---



## 12.1 Schema gate

All canonical YAML/JSON validates.

---



## 12.2 Provenance gate

Every mechanically significant fact has a source reference.

---



## 12.3 Referential-integrity gate

Every internal ID reference resolves.

---



## 12.4 Table-integrity gate

Tables preserve:

- columns;
- row ordering where meaningful;
- ranges;
- units;
- dice expressions;
- footnotes;
- special cases.

---



## 12.5 Rule-trace gate

Computed/example outcomes can identify which rules contributed.

---



## 12.6 Ambiguity gate

Uncertain interpretations are marked instead of silently normalized.

---



## 12.7 Coverage gate

Every source section has a known extraction status.

---



# 13. Coverage tracking

Maintain a machine-readable coverage file.

Example:

```yaml
sections:
  - id: section.game_basics
    status: extracting

    components:
      glossary: reviewed
      rules: reviewed
      tables: not_applicable
      procedures: extracted
      examples: extracted

  - id: section.combat
    status: not_started
```

Generate `docs/coverage-report.md` from this file.

The report should answer:

```text
What percentage of the book is mapped?
What percentage is extracted?
What percentage is reviewed?
Which sections have unresolved issues?
Which tables remain?
Which examples remain?
```

Do not estimate completion from Git commits.

---



# 14. Visual verification policy

PDF text extraction will not always be trustworthy.

Visually inspect the rendered page when:

- a table appears malformed;
- columns appear interleaved;
- text order is suspicious;
- symbols are missing;
- a diagram carries rules;
- ranges are unclear;
- footnotes are detached;
- page text extraction contradicts nearby content.

Record:

```yaml
extraction:
  visually_verified: true
```

when this has been done.

Do not use OCR as the first choice when normal PDF text and page rendering are sufficient.

---



# 15. Tables and illustrations

Not every illustration is mechanically relevant.

Classify visual content as:

```text
decorative
example_diagram
rules_diagram
table
map
reference_card
```

Only mechanically meaningful visuals need structured extraction.

Examples:

- an adjacency diagram may confirm spatial interpretation;
- LOS diagrams may define edge cases;
- maps may be scenario data;
- decorative character art does not need semantic extraction.

---



# 16. Optional rules

The book explicitly marks some mechanics as optional or removable for reduced complexity.

Optionality must be preserved.

Example shape:

```yaml
scope:
  optional: true

feature_flag: durability
```

The corpus should eventually support querying:

```text
"Which rules depend on the Durability subsystem?"
```

That requires dependency edges, not just an `optional: true` flag.

---



# 17. Scenario- and quest-specific rules

Quest rules often override normal assumptions locally.

Represent them separately from global rules.

```yaml
id: quest.example.special_rule.001

scope:
  quest: quest.example

type: scenario_rule

overrides:
  - ...

source:
  - ...
```

Never promote a quest-specific mechanic into a global rule.

---



# 18. External dependencies

Create explicit placeholder objects for referenced material not present in the repo.

Example:

```yaml
id: external.bestiary.encounter_tables
type: external_dependency
document: bestiary
status: unavailable

referenced_by:
  - procedure.encounter.generate
```

This allows extraction to remain complete without pretending the dependency is resolved.

---



# 19. Rulebook corrections and errata

Do not mix unofficial corrections into canonical extraction.

If official errata is added later:

```text
source/
  Rulebook-2nd-printing-ENGa.pdf
  official-errata.pdf
```

Then model provenance and precedence explicitly.

Suggested source classes:

```text
rulebook
official_errata
official_faq
supplement
house_rule
community_interpretation
```

House rules and community rulings must never silently replace official source material.

---



# 20. Canonical versus interpretive layers

Consider three layers.

## Layer A — Source-faithful

What the book explicitly states.

```text
corpus/
```



## Layer B — Resolution

Documented interpretation of ambiguous interactions.

```text
resolutions/
```

This layer should not exist until needed.

## Layer C — House rules

User/project-specific decisions.

```text
house-rules/
```

Keeping these separate prevents interpretation from corrupting source extraction.

---



# 21. Suggested validation tooling

Language choice is flexible.

For a TypeScript-oriented repository, a practical toolchain is:

```text
TypeScript
Node.js
Ajv or Zod
yaml
Vitest
SQLite
```

Possible commands:

```bash
npm run validate
npm run test
npm run build:corpus
npm run report:coverage
npm run lint:refs
npm run lint:source
```

Useful validations:

```text
schema validity
duplicate IDs
dangling IDs
missing source refs
invalid dice expressions
overlapping random-table ranges
gaps in random-table ranges
duplicate table ranges
impossible state transitions
unreachable states
unknown glossary aliases
invalid page references
```

---



# 22. Suggested first implementation sprint

This is the recommended starting work for Codex.

---



## Sprint 1A — Skeleton

Create:

```text
source/manifest.yaml
schemas/
corpus/glossary/
corpus/rules/core/
corpus/tables/character/
corpus/procedures/core/
corpus/source-map/
review/
tests/
scripts/
generated/
docs/
```

Add the source PDF under `source/`.

---



## Sprint 1B — Minimal schemas

Implement first versions of:

```text
source-reference.schema.json
glossary.schema.json
rule.schema.json
table.schema.json
procedure.schema.json
issue.schema.json
test-case.schema.json
```

Do not attempt to perfect every future field.

---



## Sprint 1C — Structural map

Populate the table-of-contents hierarchy.

Create:

```text
corpus/source-map/sections.yaml
corpus/source-map/coverage.yaml
```

---



## Sprint 1D — Glossary seed

Extract the complete "Abbreviations and Terminology" section.

This becomes the first real corpus data.

---



## Sprint 1E — Core-check fixture

Extract:

```text
skill/stat checks
success/failure
automatic failure
perfect result
```

Use these to validate the rule schema.

---



## Sprint 1F — Procedure fixture

Extract the dungeon turn sequence.

---



## Sprint 1G — Table fixture

Extract the level-progression table.

---



## Sprint 1H — Entity fixture

Extract:

```text
Alchemist
Thief
```

These expose:

- starting equipment;
- modifiers;
- talent/perk references;
- equipment restrictions;
- special procedural behavior.

---



## Sprint 1I — Talent fixtures

Extract a small varied set of talents.

Choose examples representing:

```text
simple modifier
conditional modifier
restriction
ignore-rule effect
initiative change
trigger-range modification
```

---



## Sprint 1J — Validation report

At the end of Sprint 1, produce:

```text
docs/ontology.md
docs/coverage-report.md
docs/known-issues.md
```

Only after this pilot is stable should bulk extraction begin.

---



# 23. Per-section extraction checklist

For every source subsection, perform this checklist.

```text
[ ] Heading recorded in structural map.
[ ] Terms identified.
[ ] Aliases identified.
[ ] Entities identified.
[ ] Tables identified.
[ ] Atomic rules extracted.
[ ] Conditions typed.
[ ] Effects typed.
[ ] Durations typed.
[ ] Exceptions extracted.
[ ] Overrides linked.
[ ] Procedures extracted.
[ ] State transitions considered.
[ ] Cross references resolved.
[ ] External references recorded.
[ ] Examples converted to candidate tests.
[ ] Visual verification performed if needed.
[ ] Ambiguities logged.
[ ] Coverage status updated.
[ ] Schemas validate.
```

---



# 24. Per-rule Definition of Done

A rule is not finished until:

```text
[ ] It has a stable ID.
[ ] It has a human-readable name.
[ ] Its category is known.
[ ] Its scope is known.
[ ] Its trigger is explicit when applicable.
[ ] Its conditions are explicit when applicable.
[ ] Its effects are typed.
[ ] Its timing/duration is explicit when applicable.
[ ] Its exceptions are linked.
[ ] Its overrides are linked.
[ ] Its references resolve.
[ ] Its source location is recorded.
[ ] Its extraction confidence is recorded.
[ ] It validates against schema.
[ ] Any ambiguity is recorded separately.
```

---



# 25. Per-table Definition of Done

```text
[ ] Table has a stable ID.
[ ] Table purpose/type is known.
[ ] All columns are represented.
[ ] All rows are represented.
[ ] Ranges are normalized.
[ ] Dice expressions are typed.
[ ] Units are explicit.
[ ] Footnotes/special rules are preserved.
[ ] Source is recorded.
[ ] Visual verification is complete when necessary.
[ ] Table validates.
[ ] Range gaps/overlaps are intentionally explained.
```

---



# 26. Per-procedure Definition of Done

```text
[ ] Start condition is known.
[ ] End condition is known.
[ ] Ordered steps are explicit.
[ ] Conditional branches are explicit.
[ ] Referenced atomic rules are linked.
[ ] Resource/state changes are explicit.
[ ] Failure/abort paths are represented.
[ ] Repetition/loop rules are represented.
[ ] Source references are recorded.
[ ] Example tests exist where the book provides examples.
```

---



# 27. Rules for extraction agents / Codex

These rules should later be copied into `AGENTS.md`.

## Agent MUST

- treat the PDF as authoritative;
- preserve terminology;
- retain source references;
- work in bounded sections;
- validate after changes;
- update coverage;
- record uncertainty;
- keep generated files reproducible;
- inspect page rendering when text extraction is unreliable;
- preserve external dependencies.



## Agent MUST NOT

- invent missing Bestiary data;
- silently resolve contradictions;
- convert tables to prose-only summaries;
- drop exceptions;
- normalize away meaningful terminology differences;
- create global rules from quest-only mechanics;
- assume an interpretation merely because it is common in other games;
- hand-edit generated artifacts;
- claim a section is complete without coverage evidence.

---



# 28. Commit strategy

Prefer small, reviewable commits.

Examples:

```text
chore: bootstrap corpus structure

schema: add source and glossary models

extract: map rulebook table of contents

extract: add terminology glossary

extract: model standard percentile checks

extract: add dungeon turn procedure

extract: add level progression table

extract: add alchemist profession

test: add core check examples

review: flag unresolved combat timing ambiguity
```

Avoid commits such as:

```text
extract half the rulebook
```

Small commits make extraction errors much easier to locate.

---



# 29. Pull request / review checklist

```text
[ ] Does every new mechanic have provenance?
[ ] Does every referenced ID resolve?
[ ] Was source wording interpreted conservatively?
[ ] Were tables kept structured?
[ ] Were exceptions modeled?
[ ] Were ambiguous cases logged?
[ ] Was coverage updated?
[ ] Did validation pass?
[ ] Did tests pass?
[ ] Are generated files reproducible?
```

---



# 30. Expected final state

When the corpus project is complete, a consumer should be able to ask the data layer things such as:

```text
get rule combat.attack.hero

find all rules that modify combat.attack.hero

get all rules active during battle

get all Talents that modify initiative

look up a result in table X

get procedure open_door

get legal transitions from state battle.active

show every source passage contributing to this result

show unresolved ambiguities involving LOS

show all mechanics that depend on the optional Durability subsystem
```

without requiring an LLM to reread the whole PDF.

---



# 31. Long-term architecture

The intended flow is:

```text
                         SOURCE
                           │
                           ▼
                 ┌─────────────────┐
                 │ Rulebook PDF    │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Structural Map  │
                 └────────┬────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │ Human-reviewable Canonical Data │
        │                                 │
        │ glossary                        │
        │ rules                           │
        │ entities                        │
        │ tables                          │
        │ procedures                      │
        │ state machines                  │
        │ issues                          │
        └──────────────┬──────────────────┘
                       │
              validation + tests
                       │
                       ▼
        ┌─────────────────────────────────┐
        │ Generated Corpus                │
        │                                 │
        │ JSON                            │
        │ SQLite                          │
        │ dependency graph                │
        │ retrieval documents             │
        └─────────────────────────────────┘
```

A future helper app or LLM agent becomes a **consumer** of this corpus.

It is not part of this project.

---



# 32. Project success criteria

The project should be considered successful when:

1. The entire source rulebook has a structural coverage map.
2. Every mechanically meaningful rule has a stable machine-readable representation or an explicit unresolved issue.
3. Every important table exists as structured data.
4. Important gameplay procedures are explicit.
5. State-dependent systems have machine-readable transitions where appropriate.
6. Exceptions and overrides are first-class relationships.
7. Internal cross references resolve.
8. External dependencies are explicit.
9. Source provenance is preserved.
10. Worked examples form a regression-test suite where feasible.
11. The corpus can be compiled reproducibly into JSON and SQLite.
12. Semantic retrieval documents can be generated from canonical data.
13. No LLM is required to infer basic deterministic mechanics from raw prose at runtime.
14. The corpus can truthfully answer "the rulebook does not define this" when that is the correct result.

---



# 33. Immediate next action

After adding this file and the PDF to the repository, instruct Codex to begin **Phase 0 and Phase 1 only**.

Recommended first prompt:

```text
Read RULES_CORPUS_PLAN.md and treat it as the project plan.

The canonical source is:
source/Rulebook-2nd-printing-ENGa.pdf

Start with Phase 0 and Phase 1 only.

1. Bootstrap the repository structure.
2. Create source/manifest.yaml.
3. Add initial JSON schemas for source references and source-map entries.
4. Build a structural map of the rulebook from the table of contents and body headings.
5. Create corpus/source-map/sections.yaml and coverage.yaml.
6. Add validation tooling and tests for the files you create.
7. Do not begin bulk rule extraction yet.
8. Do not invent content that is not in the PDF.
9. Record external references such as the Bestiary instead of filling them in.
10. Commit or summarize the work in small logical units.

At the end, report:
- files created;
- structural sections discovered;
- unresolved source-layout questions;
- validation/test status;
- what you recommend for the Phase 2 glossary extraction.
```

The reason for limiting the first Codex task is deliberate: the schemas and repository conventions should be allowed to settle before hundreds of rules depend on them.

---



# 34. Final principle

Treat this repository as a **compiler project for a rulebook**.

The PDF is source code.

The canonical YAML/JSON corpus is the intermediate representation.

Validation and example tests are the compiler checks.

SQLite/JSON/search documents are build artifacts.

An LLM can help compile, review, search, and explain the rules, but it should never become the only place where the game's mechanics exist.