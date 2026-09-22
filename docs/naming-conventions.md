# Naming conventions

Identifiers are the stable join keys of the corpus. Once an id is referenced by a rule,
table, or dependency edge, renaming it is a breaking change.

## Rules for ids

- Lowercase, ASCII, dot-separated.
- Words within a segment use underscores: `term.line_of_sight`.
- Semantic and descriptive, not positional.
- **Never encode page numbers.** Pages move between printings; concepts do not.
- Prefix by object kind so the namespace is self-describing.

Machine-checked pattern (`schemas/common.schema.json`):

```text
^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$
```

## Namespaces

| Kind               | Prefix              | Example                                            |
| ------------------ | ------------------- | -------------------------------------------------- |
| Glossary term      | `term.`             | `term.battle`, `term.line_of_sight`                |
| Core mechanic      | `core.`             | `core.check.standard`, `core.check.perfect_result` |
| Character rule     | `character.`        | `character.encumbrance.limit`                      |
| Profession         | `profession.`       | `profession.alchemist`                             |
| Talent / perk      | `talent.` / `perk.` | `talent.night_vision`                              |
| Equipment          | `equipment.`        | `equipment.weapon.longsword`                       |
| Combat rule        | `combat.`           | `combat.attack.hero`, `combat.damage.resolve`      |
| Procedure          | `procedure.`        | `procedure.dungeon_turn`, `procedure.open_door`    |
| Table              | `table.`            | `table.character.level_progression`                |
| State machine      | `state_machine.`    | `state_machine.battle`                             |
| Structural section | `section.`          | `section.game_basics`                              |
| Test fixture       | `test.`             | `test.check.equal`                                 |
| Issue record       | `issue.`            | `issue.0042`                                       |
| Gold decision case | `gold.`             | `gold.check.failure`                               |

Source documents use their own namespace in `source/manifest.yaml`, for example
`rulebook.second_printing.eng` and `bestiary`.

`gold.` ids live in `tests/fixtures/semantic-decisions-gold/` and are not corpus
objects. They are not registered in the global id table.

## File naming

- Canonical data files are `kebab-case.yaml`.
- Schemas are `kebab-case.schema.json`.
- A file's directory reflects the object kind (`corpus/tables/combat/...`), and the id
  should stay consistent with that placement.

## Preserving rulebook wording

Terminology that the rulebook distinguishes must stay distinguished in ids. `term.battle`
and `term.combat` are separate entries. Do not collapse them because they look like
synonyms in other games.
