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

| Issue                                   | Ruling                                                                                                                                                                         | Source                 | Status  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ------- |
| `issue.phase4.short_rest_morale`        | "+2 is correct".                                                                                                                                                               | Changelog #39          | applied |
| `issue.phase5.ranger_species_bows`      | "You may take a shortbow instead." 2.22 also "Added Shortbow as possible startweapon for Ranger".                                                                              | FAQ; changelog 2.22 #2 | applied |
| `issue.phase5.heirloom_sword`           | "In The Heirloom, changed 'longsword' into 'shortsword'".                                                                                                                      | Changelog #144         | applied |
| `issue.settlement.ohlnir_temple_name`   | "Temple of Ohlnir: First sentence refers to Charus. Fixed" (Charus is a misprint).                                                                                             | Changelog #82          | applied |
| `issue.treasure.legendary_names` (belt) | "Changed 'Oakenshield' to 'Copperbane'". The Kopesh/Khopesh spelling is not mentioned.                                                                                         | Changelog #193         | partial |
| `issue.quest.prisoner_reward_conflict`  | "Reward listed as 250c per hero but in the Aftermath section references 300c. Fixed. Changed to 250c". Recipient scope of the deduction and a floor at zero are not addressed. | Changelog #106         | partial |

## Acknowledged, but the fix isn't stated

The changelog marks these **Fixed** without saying what the new rule is. The current rulebook
(GF2.25 or v2.56) would show the answer.

| Issue                                       | What the changelog says                                                                                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `issue.phase6.iron_wedges_movement`         | #59, #119 and #122 list the 6 AP, 5–6 roll, 4–6 roll (reference sheet) and "add 3 turns" versions as inconsistent. Status "Fixed See above"; the chosen mechanic isn't given. |
| `issue.settlement.prayer_schedule_duration` | #77: the example shows the Priest learning over several days, but the table says 1 Activity Point. "Fixed".                                                                   |

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

| Issue                          | Ruling                                                                                                                                                                                                                                                     | Source              | Status  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------- |
| `issue.combat.enemy_fumble`    | The enemy sentence under Fumble should be removed. Enemy Fumbles (PDF 120: drops weapon or falls over) is the rule.                                                                                                                                        | Changelog #68, #123 | applied |
| `issue.travel.partial_rations` | Changed "each hero" to "the party": "When travelling in the Ancient Lands, the party requires 2 rations per day".                                                                                                                                          | Changelog #167      | partial |
| `issue.sanity.recovery_scope`  | Tending to those Memories gives 1d3 Sanity once per settlement stay. Further Sanity before the next quest needs the 1d3 × 100 c option, and it becomes available again after a quest. A player (Benman1964) proposed this and von Braus marked it "Fixed". | Changelog #83       | partial |

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
  Changelog #159: a named monster that is also Large adds 3 tokens in total.
- Exquisite components: changelog #45 and #46 ask whether several are cumulative; marked "Fixed",
  answer not given.
- Fishing gear (+5 to Foraging in our PDF) and Wild game traps (+10): changelog #128 says they are
  "Not cumulative".
- Foraging when the party still has rations (#75), searching a room during battle (#60) and the
  timing of Acidic and Fire continuation (#71): all marked "Fixed" without the ruling.

Other FAQ rulings that may matter for later extraction: Ensnare uses DEX (our PDF already does);
Grimoires and scrolls sell for Level × d100, with +20 c per d100 at the Wizards' Guild; and a
missed throw while standing adjacent to a doorway uses the standard missed-throw rules, ignoring
the doorway rules.
