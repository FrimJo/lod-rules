import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
const corpus = readPilot();
// Independent transcription of ALL printed cells, PDF 182–185 (printed 180–183).
// Whitespace is normalized across wrapped lines, but punctuation, slash notation and blanks remain.
const matrices: Record<string, string[]> = {
  consumables: [
    'Beef Jerky|-/3|1|Eating a snack like this takes 1 AP and heals 1 HP.|10 c|5',
    'Dwarven Ale|2/1|1|Famous liquid courage. If your hero drinks this, all stat and skill tests are at -10, except RES at +20 for the rest of the quest.|100 c|2',
    'Ration|1/1|1|Rations are used during overland travel and during short rests. 1 Ration can sustain the entire party for one day or one rest.|5 c|5',
    'Tobacco|-/1|-|Tobacco will help calm the nerves, but there is always the risk of becoming addicted. See separate note on tobacco.|50 c|4',
  ],
  jewellery: [
    'Necklace|-|-|Can be enchanted.|150 c|4',
    'Religious Relic (Necklace)|-|-|Can be used by a Warrior Priest. See table under ‘Treasures’ chapter for variants.|500 c|2',
    'Religious Relic (Ring)|-|-|Can be used by a Warrior Priest. See table under ‘Treasures’ chapter for variants.|500 c|2',
    'Ring|-|-|Can be enchanted.|150 c|4',
  ],
  light_sources: [
    'Headlamp|1|1||150 c|3',
    'Lamp Oil|-/1|1|Enough oil to refill a lantern once.|15 c|5',
    'Lantern (filled with oil)|1|1|The light projected by the lantern helps strengthen the resolve of your party. See separate note on lantern.|100 c|4',
    'Torch|1|1|The light projected by a torch helps strengthen the resolve of your party. See separate note on torch.|15 c|5',
  ],
  miscellaneous: [
    'Backpack - Medium|-|-|This backpack increases the carrying capacity of a hero by 10 ENC points, but decreases DEX by -5.|350 c|4',
    'Backpack - Large|-|-|This backpack increases the carrying capacity of a hero by 25 ENC points, but decreases DEX by -10.|600 c|3',
    'Bandage (old rags)|1|1|Necessary when using the Heal Skill. Heals 1d4 Hit Points. This is a bundle with enough rags to bandage 3 times.|15 c|5',
    'Bandage (linen)|1/3|1|Necessary when using the Heal Skill. Heals 1d8 Hit Points.|25 c|4',
    'Bandage (Herbal wrap)|1/3|1|Necessary when using the Heal Skill. Gives Heal skill +15 and heals 1d10 Hit Points.|50 c|4',
    'Bed Roll|5|-|The short rests you take are way more comfortable with a bed roll. You automatically regain all Energy Points.|200 c|3',
    'Combat Harness|-|6|This increases your Quick Slots from 3 to 5. Any hit that damages a piece of equipment in the harness also damage the harness.|500 c|2',
    'Extended Battle Belt|-|6|This increases your Quick Slots from 3 to 4. Any hit that damages a piece of equipment in the belt also damages the belt.|300 c|3',
    'Holy Water|-/1|1|This can be thrown in the same way as throwing a potion, but you can also dip 5 arrows into it. If thrown, it causes 1d3 Hit Points to any undead, but only in the square it hits. Projectiles dipped add +1 DMG to all Undead (treated as non-mundane weapons as well).|25 c|3',
    'Iron Wedges|4/1|6|These can be used to block a door and require 1 AP plus 1 AP for closing the door to use. Any enemy (wandering monster or monster already on the table) will need 6 AP to pass the door. Enough for 2 doors. They can also be used to bar a door during rest. See page 98 for rules on this.|50 c|4',
    'Parchment|-/1|-|Necessary to make magic scrolls.|50 c|4',
    'Partial Map|-/1|-|See separate description.|75 c|4',
  ],
  tools: [
    'Armour Repair Kit|5|-|This kit can be used to repair armour during a short rest. It will repair 1d3 durability of each of your hero’s equipped pieces of armour. Roll separately. Once done, the kit is exhausted and removed.|200 c|4',
    'Cooking Gear|3|-|Cooking gear helps make those rations a bit tastier. Rations cooked using this will heal an additional +3 HP. One set of cooking gear is enough for the entire party.|100 c|4',
    'Crowbar|10|6|Inflicts 8+DB Hit Points when breaking down a door, and only increases Threat Level +1.|55 c|3',
    'Dwarven Pickaxe|8|6|A finely crafted pickaxe. Lighter, yet stronger than ordinary pickaxes.|225 c|2',
    'Fishing Gear|3|-|A good fishing rod always makes life better. With this, a hero’s Foraging Skill increases by +5.|40 c|5',
    'Lockpicks (5)|-/10|1|Necessary to use the Pick Lock Skill, but can also be used to disarm traps. If damaged, only 1 pick is destroyed.|30 c|3',
    'Pickaxe|10|-|Can be used to remove rubble.|175 c|3',
    'Rope (old)|2/1|1|A piece of rope may help you out of that pit you happened to trip into. When used, roll 1d6. On a result of 5-6, the rope breaks and the hero falls down taking 1d6 wounds.|20 c|5',
    'Rope|2/1|1|A piece of rope may help you out of that pit you happened to trip into.|50 c|4',
    'Trap Disarming Kit|5/1|6|+10 when disarming traps.|200 c|3',
    'Whetstone|1/1|-|During a short rest, you are able to touch up your weapon. Repair close-combat weapons with 1d3 Points of Durability. 3 uses per stone.|100 c|4',
  ],
};
const columns = ['name', 'enc', 'durability', 'special', 'cost', 'availability'];
describe('independent general equipment cell matrices', () => {
  it.each(Object.entries(matrices))('%s preserves every printed cell', (name, lines) => {
    const table = corpus.tables.find((t) => t.id === 'table.equipment.' + name)!;
    expect(table.rows.map((row) => columns.map((column) => row.cells[column]!.printed))).toEqual(
      lines.map((line) => line.split('|')),
    );
  });
  it('preserves the class matrix on PDF 51 and its unavailable one-hand cells', () => {
    const table = corpus.tables.find((t) => t.id === 'table.equipment.weapon_class_strength')!;
    expect(
      table.rows.map((row) =>
        ['weapon_class', 'two_hands', 'one_hand'].map((key) => row.cells[key]!.printed),
      ),
    ).toEqual([
      ['1', '20', '20'],
      ['2', '25', '30'],
      ['3', '30', '40'],
      ['4', '40', '50'],
      ['5', '55', 'N/A'],
      ['6', '20', 'N/A'],
    ]);
  });
});
