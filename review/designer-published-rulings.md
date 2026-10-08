# Published designer rulings found online

Searched 3 October 2026. This file records what Michael Lundstedt / von Braus Publishing has
already published about issues in our rulebook PDF. The changelog and FAQ snapshots are declared in the source manifest. Rulings marked **applied** below resolve their issue in `review/ambiguities.yaml`. Rulings marked **partial** are cited on an issue that stays unresolved, and only the settled effects changed. Printed wording is preserved as `source_text`; executable effects follow the ruling. The policy is in `docs/extraction-guide.md` ("Official rulings").

## Sources

| Source                 | URL                                                                                                    | Author                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Official FAQ           | <https://vonbraus.se/games/league-of-dungeoneers/faq-lod-gamefound-edition-and-the-false-prophet-tfp/> | Lundstedt (first person)                     |
| Changelog 2.2x (PDF)   | <https://vonbraus.se/wp-content/uploads/2025/06/Changleog-LoD-2.2x.pdf>                                | Player reports with von Braus status/comment |
| Changelog 2.5 (PDF)    | <https://vonbraus.se/wp-content/uploads/2026/08/Changelog-2.5.pdf>                                     | von Braus                                    |
| Free rulebook download | <https://vonbraus.se/download/rulebook-english/> (GF2.25, updated 11 August 2025)                      | von Braus                                    |
| Paid rulebook PDF      | <https://vonbraus.se/product/league-of-dungeoneers-rulebook-pdf/> (v2.56)                              | von Braus                                    |

Community sources checked: r/leagueofdungeoneers, BoardGameGeek (the forum API needs
authentication, so threads were only reachable through search results) and the Esoteric Order of
Gamers summary. None of these contained designer answers to our issues.

## Our PDF predates most of these fixes

`source/Rulebook-2nd-printing-ENGa.pdf` has no printed version number. Its metadata says it was
created 15 January 2024 and modified 13 April 2024. It already contains some 2.22 changes, such as
Longbow class 6 and Ensnare escape by DEX test. But it still contains many errors that the 2.2x
changelog marks as **Fixed**. So it sits between the original second printing and 2.21.

Version 2.5 is a near-total rewrite. The changelog says the chapter structure changed and that
"Almost every paragraph has been rewritten". It also changes rules, for example level-up costs,
the HP gain per level, Focus being limited to 2 AP, and a completed quest now being needed between
levels. Adopting 2.5 would mean recompiling the corpus, not patching it.

## Rulings that settle conflicts on the question sheet

| Issue                                       | Ruling                                                                                                                                                                                                                                                                                                                                                                                                                       | Source                           | Status  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------- |
| `issue.phase4.short_rest_morale`            | "+2 is correct".                                                                                                                                                                                                                                                                                                                                                                                                             | Changelog #39                    | applied |
| `issue.psychology.hero_dies_morale_penalty` | "QRS is correct" (the Quick Reference Sheet's -5, not the printed -6).                                                                                                                                                                                                                                                                                                                                                       | Changelog #36                    | applied |
| `issue.psychology.hungry_morale_penalty`    | "-1/char.", cumulative ("A character is hungry"), applied by user decision over #124's "Minus 4 is correct" (flat -4 from Rations and Resting). The 2.5 Quick Reference Sheet ("per member -2") is later-edition evidence, not applied.                                                                                                                                                                                      | Changelog #148 (supersedes #124) | applied |
| `issue.phase5.ranger_species_bows`          | "You may take a shortbow instead." 2.22 also "Added Shortbow as possible startweapon for Ranger".                                                                                                                                                                                                                                                                                                                            | FAQ; changelog 2.22 #2           | applied |
| `issue.phase5.heirloom_sword`               | "In The Heirloom, changed 'longsword' into 'shortsword'".                                                                                                                                                                                                                                                                                                                                                                    | Changelog #144                   | applied |
| `issue.settlement.ohlnir_temple_name`       | "Temple of Ohlnir: First sentence refers to Charus. Fixed" (Charus is a misprint).                                                                                                                                                                                                                                                                                                                                           | Changelog #82                    | applied |
| `issue.treasure.legendary_names` (belt)     | "Changed 'Oakenshield' to 'Copperbane'". The Kopesh/Khopesh spelling is not mentioned.                                                                                                                                                                                                                                                                                                                                       | Changelog #193                   | partial |
| `issue.quest.prisoner_reward_conflict`      | "Reward listed as 250c per hero but in the Aftermath section references 300c. Fixed. Changed to 250c". Recipient scope of the deduction and a floor at zero are not addressed.                                                                                                                                                                                                                                               | Changelog #106                   | partial |
| `issue.combat.change_facing_timing`         | "Page 108 Changed wording: Change Facing: This can be done freely at any point in a model's activation." PDF 110 (printed 108) prints "at the start of a model’s actions or when all its actions are done"; `combat.action.change_facing` keeps that quotation and now allows a facing change at any point in the activation, until the player starts moving another model.                                                  | Changelog #160                   | applied |
| `issue.combat.charge_move_wording`          | Answer column: "You may move (up to your max M) adjacent to the enemy (any of the 3 squares in front of the enemy) and perform a standard attack." PDF 110 (printed 108) prints "You must move"; `combat.action.charge.requirements` keeps that quotation. Its requirements are the same under "may" (at least 1 empty square between, straight or strict diagonal line, end in one of the 3 squares in front of the enemy). | Changelog #67                    | applied |

## Acknowledged, but the fix isn't stated

The changelog marks these **Fixed** without saying what the new rule is. The current rulebook
(GF2.25 or v2.56) would show the answer.

| Issue                                         | What the changelog says                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `issue.phase6.iron_wedges_movement`           | #59, #119 and #122 list the 6 AP, 5–6 roll, 4–6 roll (reference sheet) and "add 3 turns" versions as inconsistent (the last is printed in our PDF on 118, Enemies and doors, now a source on the issue). Status "Fixed See above"; the chosen mechanic isn't given.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `issue.settlement.prayer_schedule_duration`   | #77: the example shows the Priest learning over several days, but the table says 1 Activity Point. "Fixed".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `issue.phase4.arachnophobia_scope`            | #37: Description of "Arachnophobia" should probably mention spiders in 2nd sentence. i.e., "Sll encounters against Spiders cause Terror." Marked "Fixed" with an empty answer column. Status: recorded, not applied. A reader suggestion marked Fixed without a stated designer rule settles nothing; the printed "Treat all encounters as causing Terror." stays verbatim, `character.condition.arachnophobia_other_encounters` and `procedure.arachnophobia` keep returning the unresolved issue for non-spider encounters, and the entry is cited on the issue's source list and summary as evidence only.                                                                                                                                                                                      |
| `issue.magic.enemy_caster_casting`            | #149: Page 63 Made ‘wounded’ in Bold font. Added ‘Enemy Magic User casting spells. Enemy Magic Users use RS for casting Spells. They do not miscast, they simply fail casting the spell. All their spells take 1AP to cast, unless otherwise stated. (See mini Spell Cards).’ Marked "Fixed" with an empty answer column. Status: recorded, not applied. The rendered PDF 65 (printed 63) prints neither the bold "wounded" nor the paragraph, so the second printing has no enemy-casting rule to quote; adding one from the changelog would invent canonical text. The entry is cited as evidence on the issue, `core.magic.miscast` and `procedure.hero_spell_casting` keep returning the unresolved issue for enemy casters, and the printed Miscast and Dispelling Magic text stays verbatim. |
| `issue.combat.stand_up_prone`                 | #162: "Page 110 added ‘prone’ to Stand Up." Marked "Fixed" without the new text. Status: recorded, not applied. The entry is a terminology change that states no mechanical rule, so it settles nothing, unlike #160 and #67, which state their corrected rule and are applied. PDF 112 (printed 110) prints "If a model is lying down it can spend 1 AP to stand up in the same square."; `combat.action.stand_up` keeps "lying down" and returns the issue rather than equating it with "prone".                                                                                                                                                                                                                                                                                                 |
| `issue.initiative.named_large_token_stacking` | FAQ: "Large creatures get +1 Initiative tokens and so do named monsters. Do they stack? **Yes!**" #159: "Page 104, Changed layout of page to add in ‘Named Monsters‘, If the Named Monster is also Large than a total of 3 tokens are added." Marked "Fixed". Status: recorded, not applied. The rendered PDF 106 (printed 104) prints Named Monsters (one token per living named monster) but no Large token and not the #159 sentence; the Large token belongs to the Bestiary, which is not present. Both sources are cited on the issue; `procedure.initiative` keeps the named-monster token additive with caller-supplied enemy bonus tokens and models no Large token.                                                                                                                      |
| `issue.combat.enemy_poison_damage`            | #165: Page 120 Poison has an added comment: “Enemies, once poisoned take 1HP DMG every turn. See Poison page 120.” Marked "Fixed" with an empty answer column. Status: recorded, not applied. The rendered PDF 122 (printed 120) Poison paragraph does not print the sentence; it opens with "a hero or enemy" but describes CON tests and HP loss only for "the hero". The entry is cited as evidence on the issue; `combat.poison.exposure` and `combat.poison.checks` keep the printed text.                                                                                                                                                                                                                                                                                                    |
| `issue.combat.behaviour_card_naming`          | #164: Page 116 Changed ‘Behaviour Card’ into ‘Monster Card’ to prevent confusion. Marked "Fixed". Status: recorded, not applied. The rendered PDF 118 (printed 116) Activation of Enemies prints "Consult their Behaviour Card"; the quotation stays verbatim and the naming question stays open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `issue.damage_follow_up.continuation_basis`   | #71: Acidic and Fire Damage, "On a roll of 4-6, the acid/the fire will continue to damage the character next turn" — "When? At the start of the next turn, at the start of the target next turn/activation?" Marked "Fixed" without an answer. Status: recorded, not applied; cited as evidence on the issue, `combat.damage.acidic.continues` and `combat.damage.fire.continues`.                                                                                                                                                                                                                                                                                                                                                                                                                 |

## No published answer found

- `issue.0004`: when "until end of quest" effects end.
- `issue.phase4.magic_breakage`: repairing broken magic items, and durability after dissipation.
- `issue.phase4.sanity_maximum`: Sanity cap of 8, or 8 minus current conditions.
- `issue.phase4.settlement_recovery`: Luck and Energy on arrival, or through paid Rest and
  Recuperation.
- `issue.treasure.vial_destruction`: the Vial of Never Ending against "never damaged".
- `issue.phase6.furniture_treasure_table_location`: changelog #60 adds the Appendix V table
  reference for room searching, not for furniture.
- `issue.0001`: when a battle ends. Changelog #49 and #53 unify the wording of potion and prayer
  durations ("end of the battle"), but don't define the end of a battle.

## Rulings on issues we already have that aren't on the sheet

| Issue                                       | Ruling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Source              | Status  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | ------- |
| `issue.combat.enemy_fumble`                 | The enemy sentence under Fumble should be removed. Enemy Fumbles (PDF 120: drops weapon or falls over) is the rule.                                                                                                                                                                                                                                                                                                                                                                                          | Changelog #68, #123 | applied |
| `issue.travel.partial_rations`              | Changed "each hero" to "the party": "When travelling in the Ancient Lands, the party requires 2 rations per day".                                                                                                                                                                                                                                                                                                                                                                                            | Changelog #167      | partial |
| `issue.sanity.recovery_scope`               | Tending to those Memories gives 1d3 Sanity once per settlement stay. Further Sanity before the next quest needs the 1d3 × 100 c option, and it becomes available again after a quest. A player (Benman1964) proposed this and von Braus marked it "Fixed".                                                                                                                                                                                                                                                   | Changelog #83       | partial |
| `issue.character_basics.perks_at_level_one` | "Page 25 changed and added 'All heroes get the "Heroic Force of Will" perk at the start.'" Every hero starts with that Perk, as the eight profession entries already grant.                                                                                                                                                                                                                                                                                                                                  | Changelog #140      | applied |
| `issue.phase6.door_open_threat_source`      | "Page 88 Changed wording to: The instant a door or chest is **checked**, or a cobweb opening is cleared. (As we agreed that a door (or chest for that matter) can be left unlocked but still closed, wording needs changing not to interfere with Threat.)" The Threat Level rises once, when the door or chest is checked, which is step 1 of Opening a Door or Chest. The printed "opened" stays verbatim; no effect changed, because `procedure.open_door_or_chest` already adds the single +1 at step 1. | Changelog #155      | applied |

## Conflicts recorded from these rulings

Each of these is present in our PDF, and the designer has ruled on it. Each is now logged as a
`conflicting` issue and resolved (**applied**): `issue.sanity.miscast_loss`,
`issue.movement.pit_down_test` and `issue.traps.disarm_lockpick`.

1. **Miscast Sanity loss.** The Sanity loss table on printed 53 (PDF 55) gives "Miscasting a spell
   −1d3". Miscast on printed 63 (PDF 65) says "the caster must roll on the table below". FAQ:
   "There are two different mentions about the effect of miscast. One is -1d3 Sanity and one is to
   roll on the table. Which one is correct? **The table.**" Changelog #146 says the same.
2. **Climbing down into a pit.** Climbing Pits on printed 91 (PDF 93): "there is no need of a DEX
   Test. It takes 1AP … If the test fails, the hero falls into the pit". FAQ: "Does a hero have to
   make a DEX test to climb DOWN into a pit? The text in the rulebook contradicts itself. **No Dex
   test is needed.**"
3. **Disarming traps without lock picks.** Disarming a Trap on printed 90 (PDF 92): "No Lock Picks
   are needed." Pick Locks on printed 26 (PDF 28) and Lockpicks on printed 183 (PDF 185) say lock
   picks or a trap disarming kit are used. Changelog #121: "**Lock pick or trap disarm kit
   needed.**"

These may be worth checking in our PDF; the designer has ruled on them, but I haven't confirmed
the conflict is present:

- Large creatures and named monsters both add Initiative tokens. FAQ: "Do they stack? **Yes!**"
  Changelog #159: a named monster that is also Large adds 3 tokens in total. Checked 8 October:
  our PDF prints no Large token, so this is recorded, not applied
  (`issue.initiative.named_large_token_stacking`).
- Exquisite components: changelog #45 and #46 ask whether several are cumulative; marked "Fixed",
  answer not given.
- Fishing gear (+5 to Foraging in our PDF) and Wild game traps (+10): changelog #128 says they are
  "Not cumulative".
- Foraging when the party still has rations (#75), searching a room during battle (#60) and the
  timing of Acidic and Fire continuation (#71): all marked "Fixed" without the ruling.

Checked and already printed in our PDF, so no issue is needed:

- Furniture "Dead Adventurer" armour: changelog #126 ("Missing Information … equipped with a
  longsword and armour.(...) <--What armour?", marked "Fixed" without a stated rule). Our PDF 194
  (printed 192) already prints the completed row, "10: It’s a Zombie, armed with a longsword and
  armour 1.", as `table.treasure.furniture.dead_adventurer` and the `dead_adventurer` row of
  `table.treasure.furniture`. Nothing to apply.

- Shove cost: changelog #161 ("Page 109: Shove, added ‘At a cost of 1AP…..’", marked "Fixed").
  The Shove paragraph on PDF 111 does not repeat the cost, but the 1 AP list on PDF 109 prints
  "Shove." `combat.action.shove.attempt` cites the paragraph, the list and the entry. Nothing to
  apply.
- Attacking from behind with RS: changelog #163 ("Page 110 added RS at Attacking from Behind.",
  marked "Fixed"). The prose on PDF 112 says "+20 to the CS of the attacker", but the "Factor when
  shooting" table on PDF 115 already prints "Attacking from the back (also loses its ‘To Hit’
  value) +20". `combat.principles.attacking_from_behind` cites the prose, the table and the entry.
- "Monster Card": changelog #164 ("Page 116 Changed ‘Behaviour Card’ into ‘Monster Card’"). The
  Hero Attacking footnote on PDF 115 already reads "on the Monster Card". (#164's own page, later
  edition 116, is the Activation of Enemies text.)
- Missed throw beside a doorway: the FAQ answer above agrees with Throwing Through a Door Opening
  on PDF 117 ("If not adjacent to the door, and the toss is a failure…"); `combat.throwing.door_miss`
  applies only when the hero is not adjacent to the door.

Other FAQ rulings that may matter for later extraction: Ensnare uses DEX (our PDF already does);
Grimoires and scrolls sell for Level × d100, with +20 c per d100 at the Wizards' Guild; and a
missed throw while standing adjacent to a doorway uses the standard missed-throw rules, ignoring
the doorway rules.
