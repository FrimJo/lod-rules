import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
const corpus = readPilot();
const byId = (id: string) => corpus.tables.find((table) => table.id === id)!;
const matrix = (id: string) => {
  const table = byId(id);
  return table.rows.map((row) =>
    table.columns.map((column) => row.cells[column.id]?.printed ?? ''),
  );
};

describe('settlement and estate source catalogue regressions', () => {
  it('retains every named settlement selector and quest-site die/threshold endpoint', () => {
    expect(matrix('table.settlement.quest_sites')).toEqual([
      ['Caelkirk', '1d4', '10-12', 'Red'],
      ['Coalfell', '1d6', '11-12', 'Green'],
      ['Freyfell', '1d6', '10-12', 'Pink'],
      ['Irondale', '1d6', '11-12', 'Turqois'],
      ['Rochdale', '1d6', '11-12', 'Purple'],
      ['Silver City', '2d20', '8-12', 'White'],
      ['The Outpost', '1d12', '9-12', 'Yellow'],
      ['Windfair', '1d6', '11-12', 'Blue'],
      ['Whiteport', '1d6', '9-12', 'Black'],
    ]);
  });
  it('preserves the activity catalogue including zero and multi-day costs', () => {
    expect(matrix('table.settlement.activities')).toHaveLength(29);
    expect(matrix('table.settlement.activities').filter((row) => row[2]?.startsWith('0'))).toEqual([
      ['Collect Quest Reward', 'Start Settlement of Quest', '0'],
      ['Gamble', 'Inn', '0 (but requires stay at inn)'],
      ['Level Up', 'Any Settlement', '0'],
      ['Rest and Recuperation', 'Inn', '0 (but requires stay at inn)'],
      ['Tend to those Memories', 'Inn', '0 (but requires stay at inn)'],
    ]);
    expect(
      matrix('table.settlement.activities').find((row) => row[0] === 'Learn a Spell')?.[2],
    ).toBe('3');
    expect(
      matrix('table.settlement.activities').find(
        (row) => row[0] === 'Treat Mental Conditions',
      )?.[2],
    ).toBe('5');
  });
  it('keeps the trinket overlap inside event 4', () => {
    const rows = matrix('table.settlement.events');
    expect(rows.map((row) => row[0])).toEqual(
      Array.from({ length: 12 }, (_, index) => String(index + 1)),
    );
    expect(rows[3]?.[1]).toContain('Trinket Salesman');
    expect(rows[4]?.[1]).toContain('Sale');
    expect(matrix('table.settlement.trinket_results')).toEqual([
      ['1-5', 'The trinket is magical.'],
      ['5-11', 'The trinket is useless and cannot be sold.'],
      ['12', 'The trinket is cursed.'],
    ]);
  });
  it('retains all eleven event thresholds including the two without quest dice', () => {
    // Independently transcribed from rendered PDF 132, printed page 130.
    expect(matrix('table.settlement.event_thresholds')).toEqual([
      ['Birnheim', '11-12'],
      ['Caelkirk', '10-12'],
      ['Coalfell', '11-12'],
      ['Durburim', '11-12'],
      ['Freyfell', '10-12'],
      ['Irondale', '11-12'],
      ['Rochdale', '11-12'],
      ['Silver City', '8-12'],
      ['Whiteport', '9-12'],
      ['The Outpost', '9-12'],
      ['Windfair', '11-12'],
    ]);
    expect(matrix('table.settlement.quest_availability')).toEqual([
      ['1', '2 quests', '3 quests'],
      ['2-4', '1 quest', '2 quests'],
      ['5', '-', '1 quest'],
      ['6', '-', '-'],
    ]);
  });
  it('retains bank, race, and guild table endpoints and cells', () => {
    expect(matrix('table.settlement.bank_returns')).toHaveLength(11);
    expect(matrix('table.settlement.bank_returns')[0]).toEqual(['-', '-', '1-2', '30% profit']);
    expect(matrix('table.settlement.bank_returns')[10]).toEqual([
      '20',
      '18-20',
      '19-20',
      'Robbed!',
    ]);
    expect(matrix('table.settlement.racing_awards')).toEqual([
      ['1-2', '1', '1 Wonderful Treasure'],
      ['3-4', '2-3', '1 Fine Treasure'],
      ['5-10', '4-10', 'Nothing extra'],
    ]);
    expect(matrix('table.guild.fighters_bounty')).toHaveLength(99);
    expect(matrix('table.guild.fighters_bounty')[0]).toEqual(['1-2', 'Bandit']);
    expect(matrix('table.guild.fighters_bounty').at(-1)).toEqual(['00', 'Zombie Ogre']);
    expect(matrix('table.guild.crusade').at(-1)).toEqual(['6', 'Reptiles']);
  });
  it('retains all ten ghost outcomes and notable endpoints', () => {
    const rows = matrix('table.estate.ghost_events');
    expect(rows).toHaveLength(10);
    expect(rows[0]?.[0]).toBe('1');
    expect(rows[9]?.[0]).toBe('10');
    expect(rows.map((row) => row[1])).toEqual([
      'The Family Heirlooms',
      'Guardian Spirits',
      'The Hidden Treasure',
      'Spiritual Guides',
      'Protector',
      'The Grieving Mother',
      'Angered Ghost',
      'Restless Night',
      'Lost Item',
      'The Curse',
    ]);
  });
  it('records profiles and catalogue table links without inventing expansion contents', () => {
    for (const id of ['settlement.whiteport', 'settlement.rochdale', 'settlement.windfair'])
      expect(corpus.entities.find((entity) => entity.id === id)?.source_text).not.toContain(
        'transcribed from page',
      );
    expect(corpus.entities.filter((entity) => entity.type === 'settlement')).toHaveLength(11);
    expect(corpus.entities.find((entity) => entity.id === 'settlement.caelkirk')?.tables).toContain(
      'table.settlement.profiles',
    );
    expect(corpus.entities.find((entity) => entity.id === 'guild.rangers')?.tables).toContain(
      'table.guild.rangers_equipment',
    );
  });
});

describe('visually checked settlement pages 132–135', () => {
  it('preserves every activity cell, including caps and overnight restrictions', () => {
    expect(matrix('table.settlement.activities')).toEqual([
      ['Arena Fighting', 'Arena', '1'],
      ['Banking', 'Banks', '1'],
      ['Buy a Dog', 'Kennel', '1'],
      ['Buy a Familiar', 'Alberta’s Magnificent Animals', '1'],
      ['Buy or Sell Armour', 'Blacksmith', '1'],
      ['Buy or Sell Equipment', 'General Store, The Magic Brewery', '1'],
      ['Buy Ingredients', 'Herbalist, Alchemists’ Guild', '1'],
      ['Buy or Sell Weapons', 'Blacksmith', '1'],
      ['Charge a Magic Item', 'Wizards’ Guild', '1'],
      ['Collect Quest Reward', 'Start Settlement of Quest', '0'],
      ['Create a Scroll', 'Inn', '1 per Scroll. Max 2.'],
      ['Cure Disease', 'Sick Wards or Temple of Metheia', '1'],
      ['Cure Poison', 'Sick Wards', '1'],
      ['Enchant Objects', 'Inn', '1. Max once.'],
      ['Gamble', 'Inn', '0 (but requires stay at inn)'],
      ['Guild Business', 'Guilds', '1'],
      ['Horse Racing', 'Horse tracks', '1'],
      ['Identify a Magic Item', 'Scryer or Wizards’ Guild', '1'],
      ['Identify a Potion', 'Alchemist Guild, The Magic Brewery, General Store', '1'],
      ['Learn a Prayer', 'Temple Grounds', '1'],
      ['Learn a Spell', 'Wizards’ Guild', '3'],
      ['Level Up', 'Any Settlement', '0'],
      ['Pray', 'Temple', '1'],
      ['Read your Fortune', 'Fortune Teller', '1'],
      ['Repair Equipment', 'Blacksmith', '1'],
      ['Rest and Recuperation', 'Inn', '0 (but requires stay at inn)'],
      ['Skill Training', 'Guilds', '1'],
      ['Tend to those Memories', 'Inn', '0 (but requires stay at inn)'],
      ['Treat Mental Conditions', 'The Asylum', '5'],
    ]);
  });
  it('retains the example schedule and its conflicting prayer duration', () => {
    expect(matrix('table.settlement.activity_schedule_example')).toEqual([
      [
        'D1',
        'Collects Quest reward. Visits General Store to sell excess equipment.',
        'Collects Quest reward. Visits blacksmith to sell excess weapons and armours.',
        'Collects Quest reward. Visits temple grounds to learn a new prayer.',
        'Collects Quest reward. Visits Wizards’ Guild to learn a new spell.',
      ],
      [
        'N1',
        'Inn (regains 2d6 HP and all Mana, luck, and energy).',
        'Inn (regains 2d6 HP and all Mana, luck, and energy).',
        'Inn (regains 2d6 HP and all Mana, luck, and energy).',
        'Inn (regains 2d6 HP and all Mana, luck and energy).',
      ],
      [
        'D2',
        'Visits The Dark Guild to buy special equipment.',
        'Visits blacksmith to repair the party’s weapons and armour.',
        'Goes to the temple grounds to continue learning the prayer.',
        'Goes to Wizards’ Guild to continue learning the spell.',
      ],
      ['N2', 'Inn (Gambles).', 'Inn.', 'Inn.', 'Inn.'],
      [
        'D3',
        'Does nothing.',
        'Fights in the Arena.',
        'Visits temples for prayers.',
        'Goes to Wizards’ Guild to continue learning the spell.',
      ],
      ['N3', 'Inn.', 'Inn (Gambles).', 'Inn.', 'Inn.'],
      ['D4', 'Leaves on a Quest', 'Leaves on a Quest', 'Leaves on a Quest', 'Leaves on a Quest'],
    ]);
  });
  it('preserves event restrictions omitted by the earlier summaries', () => {
    const rows = matrix('table.settlement.events');
    expect(rows[3]?.[1]).toContain('only allowed to buy 1 per hero');
    expect(rows[3]?.[1]).toContain(
      'In all cases, decide whether the trinket is a ring or necklace.',
    );
    expect(rows[6]?.[1]).toContain('can then only be raised back to the standard level');
    expect(rows[6]?.[1]).toContain('9-12 on 1d12');
    expect(rows[6]?.[1]).toContain('you may claim any quest reward before leaving');
    expect(rows[10]?.[1]).toContain('one hero that is attacked by 1d4 bandits');
    expect(rows[10]?.[1]).toContain('The heroes do not die');
    expect(rows[11]?.[1]).toContain('once and apply the curse to all heroes');
  });
});

describe('rendered arena and bank matrices (PDF 141–143)', () => {
  it('retains every arena modifier and odds cell', () => {
    expect(matrix('table.settlement.arena_modifiers')).toEqual([
      ['Hit Points', '<10', '-5'],
      ['Hit Points', '10-15', '0'],
      ['Hit Points', '>15', '+5'],
      ['STR', '<40', '-5'],
      ['STR', '40-50', '0'],
      ['STR', '>50', '+5'],
      ['Level', 'Group', '-10'],
      ['Level', 'Semi', '-15'],
      ['Level', 'Final', '-20'],
    ]);
    expect(matrix('table.settlement.arena_odds')).toEqual([
      ['10', '1,1', '1,3', '1,5'],
      ['9', '1,2', '1,4', '1,6'],
      ['8', '1,3', '1,5', '1,7'],
      ['7', '1,4', '1,6', '1,8'],
      ['6', '1,5', '1,7', '1,9'],
      ['5', '1,6', '1,8', '2,0'],
      ['4', '1,7', '1,9', '2,1'],
      ['3', '1,8', '2,0', '2,2'],
      ['2', '1,9', '2,1', '2,3'],
      ['1', '2,0', '2,2', '2,4'],
    ]);
    expect(matrix('table.settlement.arena_awards')).toEqual([
      ['1', '1 Wonderful Treasure'],
      ['2-4', '1 Fine Treasure'],
      ['5-10', 'Nothing extra'],
    ]);
  });
  it('retains every bank selector, dash, and return cell', () => {
    expect(matrix('table.settlement.bank_returns')).toEqual([
      ['-', '-', '1-2', '30% profit'],
      ['1-4', '-', '3-4', '20% profit'],
      ['5-7', '1-2', '5', '15% profit'],
      ['8-10', '3-4', '6', '10% profit'],
      ['11', '5-9', '7', '5% profit'],
      ['12', '10-14', '8-10', 'No change'],
      ['13-14', '15-16', '11-14', '5 % loss'],
      ['15-17', '17', '15-16', '10% loss'],
      ['18-19', '-', '17', '20% loss'],
      ['-', '-', '18', '30% loss'],
      ['20', '18-20', '19-20', 'Robbed!'],
    ]);
  });
});

describe('rendered gambling and racing matrices (PDF 145–146)', () => {
  it('retains the modified gambling lower range and full outcomes', () => {
    expect(matrix('table.settlement.gambling')).toEqual([
      ['<=1', 'Grand slam! You win 2 times your bet.'],
      ['2-3', 'Win! You go home with 1,5 times the bet (RDU)'],
      ['4-9', 'You lose all your bets.'],
      [
        '10',
        'The others around the table are certain you have cheated, and you end up getting a good beating and being robbed of an additional 100 c.',
      ],
    ]);
  });
  it('retains racing thresholds, level multipliers, and both award selectors', () => {
    expect(matrix('table.settlement.horse_racing')).toEqual([
      ['<= DEX/2 (RDD)', 'Win!'],
      ['<= DEX-10', '2nd place!'],
      ['> DEX-10', 'You lose…'],
      ['>=95', 'Catastrophe strikes!'],
    ]);
    expect(matrix('table.settlement.racing_winnings')).toEqual([
      ['1', '3', '2,5'],
      ['2', '2,9', '2,4'],
      ['3', '2,8', '2,3'],
      ['4', '2,7', '2,2'],
      ['5', '2,6', '2,1'],
      ['6', '2,5', '2,0'],
      ['7', '2,4', '1,9'],
      ['8', '2,3', '1,8'],
      ['9', '2,2', '1,7'],
      ['10', '2,1', '1,6'],
    ]);
    expect(matrix('table.settlement.racing_awards')).toEqual([
      ['1-2', '1', '1 Wonderful Treasure'],
      ['3-4', '2-3', '1 Fine Treasure'],
      ['5-10', '4-10', 'Nothing extra'],
    ]);
  });
});

describe('rendered Dark and Fighters Guild tables (PDF 148–151)', () => {
  it('does not grant Dark as the Night to the cap or bracers', () => {
    expect(matrix('table.guild.dark_equipment')).toEqual([
      ['Nightstalker Cap', '4', '1', 'Head', 'High Quality', '230 c', '3'],
      ['Nightstalker Vest', '4', '3', 'Torso', 'Dark as the Night, High Quality', '650 c', '3'],
      [
        'Nightstalker Jacket',
        '4',
        '4',
        'Arms, Torso',
        'Dark as the Night, High Quality',
        '1000 c',
        '3',
      ],
      ['Nightstalker Pants', '4', '3', 'Legs', 'Dark as the Night, High Quality', '900 c', '3'],
      ['Nightstalker Bracers', '4', '3', 'Arms', 'High Quality', '150 c', '3'],
    ]);
  });
  it('retains all ninety-nine bounty outcomes from the four-column source matrix', () => {
    // Read down each of the four selector/enemy pairs on PDF 151.
    const names = [
      'Bandit',
      'Bandit Leader',
      'Banshee',
      'Beastman',
      'Beastman Chieftain',
      'Beastman Guard',
      'Berserker',
      'Bloated Demon',
      'Blood Demon',
      'Cave Bear',
      'Cave Goblin',
      'Centaur',
      'Cockatrice',
      'Common Troll',
      'Dark Elf',
      'Dark Elf Assassin',
      'Dark Elf Captain',
      'Dark Elf Sniper',
      'Dark Elf Warlock',
      'Dire Wolf',
      'Drider',
      'Earth Elemental',
      'Ettin',
      'Fallen Knight',
      'Fire Elemental',
      'Frogling',
      'Gargoyle',
      'Gecko',
      'Gecko Assassin',
      'Ghost',
      'Ghoul',
      'Giant',
      'Bat Swarm',
      'Giant Centipede',
      'Giant Leach',
      'Giant Pox Rat',
      'Giant Rat',
      'Giant Scorpion',
      'Giant Snake',
      'Giant Spider',
      'Giant Toad',
      'Giant Wolf',
      'Gigantic Snake',
      'Gigantic Spider',
      'Gnoll',
      'Gnoll Sergeant',
      'Gnoll Shaman',
      'Goblin',
      'Goblin Shaman',
      'Greater Demon',
      'Griffon',
      'Harpy',
      'Hydra',
      'Lesser Plague Demon',
      'Lurker',
      'Medusa',
      'Mimic',
      'Mind Flayer',
      'Minotaur',
      'Minotaur Skeleton',
      'Mummy',
      'Mummy Priest',
      'Mummy Queen',
      'Naga',
      'Necromancer',
      'Ogre',
      'Ogre Berserker',
      'Ogre Chieftain',
      'Orc',
      'Orc Brute',
      'Orc Chieftain',
      'Orc Shaman',
      'Plague Demon',
      'Raptor',
      'River Troll',
      'Salamander',
      'Satyr',
      'Saurian',
      'Saurian Elite',
      'Saurian Priest',
      'Saurian Warchief',
      'Shambler',
      'Skeleton',
      'Slime',
      'Sphinx',
      'Stone Golem',
      'Stone Troll',
      'Tomb Guardian',
      'Vampire',
      'Vampire Fledgling',
      'Warlock',
      'Water Elemental',
      'Werewolf',
      'Wight',
      'Wind Elemental',
      'Wraiths',
      'Wyvern',
      'Zombie',
      'Zombie Ogre',
    ];
    expect(matrix('table.guild.fighters_bounty')).toEqual(
      names.map((name, i) => [i === 0 ? '1-2' : i === 98 ? '00' : String(i + 2), name]),
    );
  });
  it('retains the omitted tools table, dashes and full special cells', () => {
    expect(matrix('table.guild.dark_tools')).toEqual([
      ['Bear Trap', '5', '2', 'See Special Note.', '200'],
      ['Caltrops Trap', '-', '-', 'See Special Note.', '50'],
      [
        'Door Mirror',
        '-',
        '1',
        'By spending 1 turn before opening a door, you can slide the mirror underneath the door and get a grip of the room on the other side. You may draw the Exploration Card and roll for an Encounter before opening the door. The party may add 2 hero initiative tokens to the bag if there is an encounter behind the door.',
        '300',
      ],
      [
        'Superior Lock Picks (5)',
        '-',
        '1',
        'These lock picks are Dwarven-made with extreme precision. They give +5 Lock picking skill.',
        '75',
      ],
      [
        'Superior Sling Stones (10)',
        '-',
        '-',
        'This ammo is cast metal bullets rather than the normal stones. Gives +5 RS with slings and +1 DMG.',
        '25',
      ],
      [
        'Superior Trap Disarming Kit',
        '4',
        '6',
        'A Dwarven-made kit with perfect tolerances and smooth surfaces. Gives a +15 modifier to any attempt to disarm a trap.',
        '250',
      ],
      ['Tripwire with Darts Trap', '2', '1', 'See Special Note.', '150'],
    ]);
  });
});

describe('rendered guild tables (PDF 152–154)', () => {
  it('preserves the empty Poleyns durability cell separately from dashes', () => {
    expect(matrix('table.guild.fighters_equipment')).toEqual([
      ['Gauntlets', '1', '-', 'Increases arm armour +1', '5', '50 c'],
      ['Gorget', '1', '-', 'Increases head armour +1', '4', '50 c'],
      ['Pain Killer', '-', '1', 'Remove wound marker until end of battle', '3', '50 c'],
      ['Poleyns (metal knee pads)', '1', '', 'Increases leg armour +1', '5', '50 c'],
      ['Shield Padding', '1', '-', 'Increases the durability of a shield by +1', '4', '15 c'],
      ['Shoulder Pads', '1', '-', 'Increases torso armour +1', '5', '50 c'],
      [
        'Slayer Weapon Treatment',
        '-',
        '-',
        'Increases sharpness of an edged weapon.',
        '6',
        '100 c',
      ],
    ]);
    expect(byId('table.guild.fighters_equipment').rows[3]?.cells.dur?.type).toBe('blank');
  });
  it('retains all part and ingredient availability cells and the expansion footnote', () => {
    expect(matrix('table.guild.alchemist_availability')).toEqual([
      ['Amphibian skin', '4'],
      ['Bat wings', '5'],
      ['Beast heart', '3'],
      ['Bonemeal', '5'],
      ['Brain tissue', '4'],
      ['Chitin', '3'],
      ['Cyclops eye¹', '2'],
      ['Dragon blood', '1'],
      ['Ectoplasm', '3'],
      ['Elf hair', '4'],
      ['Feathers', '5'],
      ['Fur', '5'],
      ['Ghoul blood', '4'],
      ['Goblin Eye', '5'],
      ['Human blood', '5'],
      ['Medusas eye', '2'],
      ['Mummy dust', '3'],
      ['Nails', '4'],
      ['Ogre teeth', '3'],
      ['Rat tail', '5'],
      ['Scales', '4'],
      ['Shapeshifter blood¹', '3'],
      ['Slime', '4'],
      ['Spider fang', '4'],
      ['Spirit wood', '3'],
      ['Spores¹', '3'],
      ['Tongue', '4'],
      ['Troll blood', '3'],
      ['Vampire blood', '2'],
      ['Zombie skin', '4'],
      ['Lunarberry', '5'],
      ['Arching Pokeroot', '4'],
      ['Ashen Ginger', '5'],
      ['Barbed Wormwood', '1'],
      ['Bitterweed', '4'],
      ['Blue Coneflower', '5'],
      ['Bright Gallberry', '3'],
      ['Dragon Stalk', '4'],
      ['Ember Bark', '5'],
      ['Giant Raspberry', '5'],
      ['Monk’s Laurel', '1'],
      ['Mountain Barberry', '3'],
      ['Nightshade', '5'],
      ['Salty Wyrmwood', '2'],
      ['Snakeberry', '3'],
      ['Spicy Windroot', '5'],
      ['Sweet Ivy', '3'],
      ['Toxic Hogweed', '3'],
      ['Weeping Clover', '4'],
      ['Wintercress', '4'],
    ]);
    expect(byId('table.guild.alchemist_availability').footnotes).toEqual([
      '¹ Introduced with the False Prophet expansion but may still be bought.',
    ]);
  });
  it('preserves wizard staff availability, price and distinct expiration timing', () => {
    const rows = matrix('table.guild.wizard_staves');
    expect(rows.map(([staff, , availability, cost]) => [staff, availability, cost])).toEqual([
      ['Arcane Staff', '4', '400 c'],
      ['Fire Staff', '3', '400 c'],
      ['Major Mana Staff', '2', '800 c'],
      ['Mana Staff', '3', '500 c'],
      ['Minor Mana Staff', '4', '300 c'],
      ['Staff of Illumination', '4', '300 c'],
      ['Staff of Slow', '3', '400 c'],
      ['Staff of the Bolt', '3', '500 c'],
      ['Staff of the Heart', '4', '350 c'],
    ]);
    expect(rows[0]?.[1]).toContain('When leaving a dungeon, roll 1d10. On a result of 9-10');
    expect(rows[8]?.[1]).toContain('Between each quest, roll 1d10. On a result of 10');
    expect(rows[5]?.[1]).toContain('It will not go out due to any other reason.');
    for (const [index, capacity] of [
      [2, 30],
      [3, 20],
      [4, 10],
    ]) {
      expect(rows[index!]?.[1]).toContain(`This stores ${capacity} points of Mana.`);
      expect(rows[index!]?.[1]).toContain('in a settlement while resting at the inn');
    }
  });
});

describe('rendered Ranger and Sanctum tables (PDF 156–159)', () => {
  it('retains all trophy sale modifier cells', () => {
    expect(matrix('table.guild.taxidermy_sale')).toEqual([
      ['1', '-500', '-300'],
      ['2-3', '-400', '-200'],
      ['4-5', '-300', '-100'],
      ['6-8', '-150', '-50'],
      ['9-14', '0', '0'],
      ['15-17', '50', '100'],
      ['18-19', '100', '200'],
      ['20', '200', '300'],
    ]);
  });
  it('preserves the Health heading and the scope of Ranger equipment benefits', () => {
    expect(byId('table.guild.rangers_equipment').columns[2]?.label).toBe('Health');
    expect(matrix('table.guild.rangers_equipment')).toEqual([
      [
        'Aim Attachment',
        '-',
        '-',
        'This can be added to a shortbow, bow, or any form of crossbow to make it easier to aim. When using an Aim Action, you get +15 instead of +10.',
        '3',
        '200 c',
      ],
      ['Barbed Arrows (5)', '1', '-', 'Increased DMG + 1', '4', '25 c'],
      ['Barbed Bolts (5)', '1', '-', 'Increased DMG + 1', '4', '25 c'],
      [
        'Compass',
        '-',
        '1',
        'This rather unique item will allow the party to reroll one Travel Event per travel. It must be carried in a Quick Slot.',
        '3',
        '300 c',
      ],
      [
        'Elven Skinning Knife',
        '1',
        '-',
        'This slender blade is razor sharp and will make the skinning process much easier. It grants a +10 modifier to Foraging only while skinning. Can be kept in the backpack all the time.',
        '3',
        '250 c',
      ],
      [
        'Skinning Knife',
        '1',
        '-',
        'This will allow a Ranger to skin animals. Can be kept in the backpack all the time.',
        '5',
        '100 c',
      ],
      [
        'Taxidermist tools',
        '3',
        '-',
        'This grants a +10 modifier to Foraging only while rolling for a Trophy.',
        '3',
        '150 c',
      ],
      [
        'Wild game traps',
        '3',
        '-',
        'These traps make catching animals much easier and confer a +10 modifier when making a Foraging roll to catch animals. Can be kept in the backpack all the time.',
        '5',
        '150 c',
      ],
    ]);
  });
  it('preserves incense quick-slot requirements and all crusade selectors', () => {
    expect(matrix('table.guild.sanctum_equipment')).toEqual([
      [
        'Religious Relic (Necklace)',
        '-',
        '1',
        'See table under ‘Treasures’ chapter for variants.',
        '500 c',
        '4',
      ],
      [
        'Religious Relic (Ring)',
        '-',
        '1',
        'See table under ‘Treasures’ chapter for variants.',
        '500 c',
        '4',
      ],
      [
        'Incense',
        '-',
        '1',
        'Increases the Prayer skill with +5. Enough for 1 skirmish or 1 dungeon. May be lit in a quick slot during skirmish setup or before entering a dungeon.',
        '40 c',
        '4',
      ],
    ]);
    expect(matrix('table.guild.crusade')).toEqual([
      ['1', 'Undead'],
      ['2', 'Bandits'],
      ['3', 'Orcs and Goblins'],
      ['4', 'Beasts'],
      ['5', 'Dark Elves'],
      ['6', 'Reptiles'],
    ]);
  });
});

describe('rendered estate restrictions (PDF 160–163)', () => {
  it('retains all furnishing prices and delayed use', () => {
    expect(matrix('table.estate.furnishings').map(([name, cost]) => [name, cost])).toEqual([
      ['Training Grounds', '500 c'],
      ['Wizard’s Study', '500 c'],
      ['Alchemist Lab', '500 c'],
      ['Shrine', '350 c'],
      ['Smithy', '350 c'],
      ['Archery Range', '500 c'],
      ['Crops, Hen House, and Pigsty', '200 c'],
      ['Garden', '200 c'],
      ['Kennel', '75 c'],
    ]);
    expect(byId('table.estate.furnishings').footnotes).toEqual([
      'Only one thing may be bought in between every quest, and it cannot be used until after leaving the next dungeon.',
    ]);
    const rows = matrix('table.estate.furnishings');
    expect(rows[5]?.[2]).toContain('either at archery range OR at the training grounds');
    expect(rows[6]?.[2]).toContain('1d8+the number of spent days');
    expect(rows[7]?.[2]).toContain('once between each quest');
  });
  it('retains all ten ghost effect cells including the rations selection unit', () => {
    expect(matrix('table.estate.ghost_events').map((row) => row[2])).toEqual([
      'The heroes may roll twice on the Wonderful Treasure Chart. However, the lack of sleep will deprive each hero of 1 Point of Energy.',
      '+1 Luck for all heroes during the coming quest.',
      'Add a Side Quest Card to the first half of the pile when setting up the Dungeon Cards. When you draw the Side Quest Card, you remove it and immediately draw the next card. On this card, you add 1 extra door leading to the R10 tile. This door is considered a normal door in all aspects as the ghost’s explanation makes it easy to find. It can still be locked and trapped but there are no encounters inside.',
      'All Heroes get +5 CS/+5 RS during the quest.',
      'Any wizard in the party will only miscast on 97-00 during the coming quest. If there are no wizards in the party, ignore this and head out on your quest without any ghostly events.',
      'See the Grieving Mother Side Quest. If you already have succeeded in this quest, ignore this and treat it as if you rolled #2. If you have tried and failed, you may try again.',
      'Any rations from the crops, hen house, and pigsty are lost.',
      'The heroes have a tough time getting a good night’s sleep. All heroes start the next quest with -2 Energy (minimum 0). This can be regained as usual after the quest has started through the usual means.',
      'First randomise which hero is affected. Then randomise between all weapons, all pieces of armour and all rations (All rations are considered a single item for this purpose). This item is left back at the estate and cannot be used until you have left the next dungeon.',
      'Every hero suffers an individual curse from the Curse Table in the Rulebook that cannot be lifted until they are back in the city again.',
    ]);
  });
});
