# Questions for the designer: printed conflicts

_League of Dungeoneers_, second printing (English). Each question below is a place where two
printed passages disagree, so the rules corpus cannot pick an answer on its own. Quotes are
verbatim from the PDF, with spacing restored. Pages are given as **printed page** (the number at
the foot of the page) followed by the PDF page.

A short answer is enough, for example "the checklist is right, +2" or "both apply". If a passage
is a misprint, saying so is the most useful answer. Answers will be recorded as dated designer
clarifications alongside the original wording; the printed text itself is not changed.

Corpus issue ids are in brackets so answers can be matched back to `review/ambiguities.yaml`.

**Already answered publicly** (see [designer-published-rulings.md](designer-published-rulings.md)):
questions 1, 9, 11, 12 (base reward only) and 14, plus the belt name in question 7. Questions 8
and 10 are marked fixed in the 2.2x changelog, but the fix isn't stated. The remaining questions
(2, 3, 4, 5, 6, the Kopesh spelling in 7, the rest of 12, and 13) have no published answer.

---

## Character and recovery rules

### 1. Short rest: does Party Morale increase by +1 or +2? [`issue.phase4.short_rest_morale`]

- Party Morale table, printed 56 (PDF 58): **Taking a short rest** — "Resting is a good way to
  calm the nerves." Effect: **+1**.
- Checklist when Resting, printed 98 (PDF 100): "6. Increase Party Morale by +2 (up to start
  value)." The Rest text on the same page also says "Party Morale is increased by +2."

**Question:** Which value is correct for a short rest? Do the two ever stack? Does the "up to
start value" cap also apply to the +1 if that is the correct value?

### 2. Maximum Sanity after a condition [`issue.phase4.sanity_maximum`]

Both passages are on printed 53 (PDF 55):

- Conditions: "Once a hero has a condition, the Sanity Level will go back up to 8 minus the
  number of current conditions. That is, if you have two active conditions, your maximum Sanity
  is now 6."
- Reducing Insanity, or Increasing Sanity: "Resting between quests increases the Sanity Level by
  1d3, up to a maximum of 8."

**Question:** For a hero with conditions, is the recovery cap 8, or 8 minus current conditions?
Does the cap rise again when a condition is cured?

### 3. Luck, Energy and Mana when returning to a settlement [`issue.phase4.settlement_recovery`]

- Energy, printed 24 (PDF 26): "Lost energy is regained once back from a quest, or while resting
  during a quest."
- Luck, printed 24–25 (PDF 26–27): "Luck is reset once the hero is back in a settlement. Any luck
  rolls used while in the settlement will not be replenished until the hero returns to a
  settlement once more."
- Rest and Recuperation, printed 145 (PDF 147): "Mana, Luck and energy are automatically restored,
  and each hero regains 2d6 HP per night. … If you cannot afford this, only half (RDD) of each
  stat is regained and 1d6 HP as you sleep in the inn's stable instead."

**Question:** Are Luck and Energy restored for free on arrival (per Character Basics), or only by
paying for Rest and Recuperation? If a party cannot pay, do they get full Luck and Energy on
arrival anyway, or only half?

### 4. When does an "until end of quest" effect end? [`issue.0004`]

- End of the Quest, printed 14 (PDF 16): "This is the moment when you get your reward for a
  finished quest. If an effect lasts 'until the end of the quest', it will last until you get your
  next reward."
- Until end of (next) quest, printed 15 (PDF 17): "This term indicates that the modifier will last
  until the heroes return to the city after a quest, but before beginning any activities in the
  city."
- Collect Your Reward, printed 142 (PDF 144): "If the party is back after a finished quest the
  party will first receive their reward, if any was promised. This can only be done in the
  settlement where you accepted the quest."

**Question:** Do these effects end on returning to any settlement, or only on receiving a reward?
What happens if no reward was promised, the quest failed, or the party returns to a different
settlement from the one where they accepted it?

---

## Equipment and items

### 5. Can a broken magic item be repaired? [`issue.phase4.magic_breakage`]

- Durability, printed 49 (PDF 51): "If a weapon ever reaches 0 Durability, it is broken beyond
  repair." Printed 50 (PDF 52) says the same for armour and shields.
- Dissipating Magic, printed 68 (PDF 70): "Whenever you roll 00 when attacking with a magic weapon,
  the power is suddenly gone, turning the weapon into an ordinary weapon. This includes the
  durability, which immediately drops to a maximum of 6. This can lead to the weapon suddenly
  breaking. … Weapons and armour can be recharged again (if not broken) at the Wizard's Guild …
  If the item is broken, it must first be repaired to at least 1 Point of Durability."

**Question:** Can a magic weapon or armour at 0 Durability be repaired and recharged, or is it
broken beyond repair like ordinary equipment? When durability "drops to a maximum of 6", does the
item keep its current damage? For example, if an item with maximum 10 and current 3 drops to
maximum 6, is it now 3 out of 6, or 0 out of 6 (and broken)?

### 6. Legendary items "can never be damaged", but the Vial can be destroyed [`issue.treasure.vial_destruction`]

- Legendary items, printed 201 (PDF 203): "Unlike ordinary magic items, these items can never run
  out of magic or be damaged, but they need to be identified before use."
- Vial of Never Ending, printed 203 (PDF 205): "You may find this several times, and the vial can
  be reused as well. However, if it is hit during battle is be destroyed."

**Question:** Is the Vial a deliberate exception to the legendary rule? What does "if it is hit"
mean: when the bearer takes a hit, or only on a specific roll or location?

### 7. Legendary item names that differ between table and description [`issue.treasure.legendary_names`]

- The Legendary table on printed 200 (PDF 202) lists **Belt of Oakenshield**, but the description
  on printed 202 (PDF 204) is **Belt of Copperbane** ("Thane Copperbane, Dwarf of the High
  Mountains…").
- The same table lists **The Golden Kopesh**, but the description on printed 208 (PDF 210) is
  **The Golden Khopesh**.

**Question:** Are these the same items, so that one spelling is a misprint? If so, which name is
correct?

### 8. Iron Wedges: 6 AP, or a roll of 5–6? [`issue.phase6.iron_wedges_movement`]

- Iron Wedges, printed 182 (PDF 184): "… (table) will need 6 AP to pass the door. Enough for 2
  doors. They can also be used to bar a door during rest."
- Wandering Monsters, printed 90 (PDF 92): "A magically sealed door or Iron Wedged door will stop
  the token for that turn, and it must roll 5-6 to continue through the door next turn, instead of
  the normal 2-6."

**Question:** Is the 6 AP rule for enemies on the table and the 5–6 roll only for wandering
monster tokens? Or does one rule replace the other?

### 9. Rangers who are Dwarves or Halflings [`issue.phase5.ranger_species_bows`]

- Ranger Starting Equipment, printed 34 (PDF 36): "Small backpack, Longbow and 10 arrows."
- Dwarf, printed 28 (PDF 30), and Halfling, printed 29 (PDF 31): "Due to their height, Dwarf
  [Halfling] characters cannot use Longbows or Elven bows."

**Question:** Can a Dwarf or Halfling be a Ranger? If so, what do they start with instead of the
Longbow: a shortbow, a crossbow, or a Longbow they carry but cannot use?

---

## Settlements

### 10. Learning a prayer: one day or two? [`issue.settlement.prayer_schedule_duration`]

- In the Silver City example schedule, printed 131 (PDF 133), the Priest "Visits temple grounds to
  learn a new prayer" on D1 and "Goes to the temple grounds to continue learning the prayer" on
  D2.
- The Available Actions table, printed 132 (PDF 134), lists Learn a Prayer (Temple Grounds) at an
  Activity Point cost of 1, and "Each hero may perform activities worth one Activity Point per
  day".

**Question:** Does learning a prayer take one day or two? The example's Wizard also "continues
learning the spell" on D2. Does the same answer apply to learning spells?

### 11. Temple of Ohlnir or Temple of Charus? [`issue.settlement.ohlnir_temple_name`]

- Temple of Ohlnir, printed 145 (PDF 147): "At the temple of Charus, your heroes may pray for
  guidance of their weapons, so they always strike true. If Ohlnir hears their prayer, they will
  get +5 CS/RS …"

**Question:** Is "Charus" a misprint for Ohlnir, or is Charus another name for the same god or
temple?

---

## Quests and cross-references

### 12. Rescuing Prisoners reward: 250 c or 300 c? [`issue.quest.prisoner_reward_conflict`]

- Reward, printed 247 (PDF 249): "Reward: 250 c per hero."
- Aftermath, printed 248 (PDF 250): "If all prisoners are alive, the Jarl unexpectedly pays an
  extra 100 c to each hero. However, for each prisoner dead, he deducts 50 c from the initial
  promised 300 c. This means that the heroes may end up without a reward."

**Questions:**

- Is the base reward 250 c or 300 c?
- Is it per hero or for the whole party?
- Is the 50 c deduction taken per hero or from the party total?
- Does the reward stop at 0, or can deductions cost the heroes money?

### 13. Furniture Treasure Table location [`issue.phase6.furniture_treasure_table_location`]

- Searching Furniture, printed 97 (PDF 99): "… just go to chapter III: 'Treasures' and roll on the
  Furniture Table."
- Searching Furniture in the Treasure chapter, printed 106 (PDF 108): "… roll on the Furniture
  Treasure Table in Appendix III …"
- The furniture treasure tables are actually printed in Appendix V, printed 192–193 (PDF 194–195).

**Question:** Please confirm the Appendix V table is the one meant by both references, so that
both cross-references are misprints.

### 14. The Heirloom: longsword or shortsword? [`issue.phase5.heirloom_sword`]

The Heirloom background, printed 41 (PDF 43):

- The story says: "… she returned with a wonderful longsword. Perfectly balanced and adorned with
  jewels …"
- The Personal Quest says: "The weapon is a silver shortsword that does +1 DMG and has +2
  Durability. You may not sell it."

**Question:** Is the heirloom a longsword or a shortsword? Should it use the base stats of that
weapon plus +1 DMG and +2 Durability?
