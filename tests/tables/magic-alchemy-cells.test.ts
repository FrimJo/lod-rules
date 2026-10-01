import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
const pilot = readPilot();
// Independently transcribed from rendered PDF 73, 75, 187–192, 197–198.
// Normalise whitespace at wraps (including re- roll) only. No regenerated snapshots.
const normal = (s: string) =>
  s
    .replace(/re-\s+roll/g, 're-roll')
    .replace(/\s+/g, ' ')
    .trim();
const lines = (file: string) =>
  readFileSync(new URL(`./expected/${file}.txt`, import.meta.url), 'utf8')
    .trimEnd()
    .split('\n');
const matrix = (id: string) => {
  const t = pilot.tables.find((t) => t.id === id)!;
  return t.rows.map((r) => t.columns.map((c) => r.cells[c.id]!.printed).join('|'));
};
describe('complete source table cells', () => {
  it('complete miscast and Demon matrices (PDF 65)', () => {
    expect(matrix('table.magic.miscast')).toEqual(lines('miscasts'));
    expect(matrix('table.magic.demons')).toEqual([
      '1|1d3 Lesser Plague Demons|-',
      '2|1d3 Plauge Demons|Randomize weapon by drawing a weapon card. Armour 0.',
      '3|1d3 Blood Demons|Randomize weapon by drawing a weapon card. Armour 1.',
      '4|1 Bloated Demon|2 Support spells, 2 Ranged spells and 2 Close combat spells.',
    ]);
  });
  it('all preparation strength cells (PDF 79–81)', () => {
    expect(matrix('table.alchemy.strengths')).toEqual([
      'Acidic Bomb|1d6|1d10|1d12',
      'Firebomb|1d6|1d10|1d12',
      'Potion of Constitution|+10|+15|+20',
      'Potion of Courage|+10|+15|+20',
      'Potion of Cure Disease|75%|100%|100%; heal 1d3 HP',
      'Potion of Cure Poison|75%|100%|100%; heal 1d3 HP',
      'Potion of Dexterity|+5|+10|+15',
      'Potion of Energy|+1|+2|+3',
      'Potion of Health|1d4|1d6|1d10',
      'Potion of Mana|1d20|2d20|3d20',
      'Potion of Strength|+10|+15|+20',
      'Potion of Wisdom|+10|+15|+20',
    ]);
  });
  it.each([1, 2, 3, 4, 5, 6])('Level %i spell table including every effect and blank', (level) => {
    expect(matrix(`table.spells.level_${level}`).map(normal)).toEqual(
      lines('spells')
        .filter((s) => s.startsWith(`${level}|`))
        .map((s) => normal(s.slice(2))),
    );
    expect(pilot.tables.find((t) => t.id === `table.spells.level_${level}`)!.footnotes).toEqual([]);
  });
  it.each([
    ['habitats', 'habitats'],
    ['harvesting', 'harvesting'],
    ['standard', 'standard-potions'],
  ])('all %s cells', (id, file) =>
    expect(matrix(`table.alchemy.${id}`).map(normal)).toEqual(lines(file!).map(normal)),
  );
  it('all weak/supreme prices and recipes', () => {
    expect(matrix('table.alchemy.weak_supreme')).toEqual([
      '1|60/180|Firebomb',
      '2|75/200|Potion of Constitution',
      '3|75/200|Potion of Courage',
      '4|75/200|Potion of Dexterity',
      '5|75/200|Potion of Energy',
      '6|75/200|Potion of Health',
      '7|75/200|Potion of Mana',
      '8|75/200|Potion of Strength',
      '9|75/200|Potion of Wisdom',
      '10|60/180|Acidic Bomb',
      '11|75/200|Potion of Cure Disease',
      '12|75/200|Potion of Cure Poison',
    ]);
    expect(matrix('table.alchemy.common_recipes')).toEqual([
      'Potion of Health|Human blood|Rat tail|Ashen Ginger',
      'Cure Disease|Zombie Skin|Bat Wings|Monk’s Laurel',
      'Firebomb|Beast Heart|Rat tail|Lunarberry',
      'Cure Poison|Spider Fangs|Snakeberry|Bitterweed',
      'Potion of Experience|Dragon Blood|Sweet Ivy|Nightshade',
      'Potion of Restoration|Vampire Blood|Troll Blood|Ember Bark',
    ]);
    for (const r of pilot.entities.filter((e) => e.type === 'recipe'))
      expect(r.components!.map((c) => c.quantity)).toEqual([1, 1, 1]);
  });
  it('complete random component tables, including merged cells and superscripts', () => {
    const ingredients = [
      'Lunarberry',
      'Dragon Stalk',
      'Ember bark',
      'Mountain Barberry',
      'Salty Wyrmwood',
      'Ashen Ginger',
      'Spicy Windroot',
      'Wintercress',
      'Sweet Ivy',
      'Monk’s Laurel',
      'Nightshade',
      'Weeping Clover',
      'Snakeberry',
      'Bitterweed',
      'Arching Pokeroot',
      'Toxic Hogweed',
      'Blue Coneflower',
      'Giant Raspberry',
      'Bright Gallberry',
      'Barbed Wormwood',
    ];
    expect(matrix('table.alchemy.ingredients')).toEqual(ingredients.map((n, i) => `${i + 1}|${n}`));
    const parts = [
      'Amphibian skin',
      'Bat wings',
      'Beast heart',
      'Bonemeal',
      'Brain tissue',
      'Chitin',
      'Cyclops eye¹',
      'Dragon blood',
      'Ectoplasm',
      'Elf hair',
      'Feathers',
      'Fur',
      'Ghoul blood',
      'Goblin Eye',
      'Human blood',
      'Medusas eye',
      'Mummy dust',
      'Nails',
      'Ogre teeth',
      'Rat tail',
      'Scales',
      'Shapeshifter blood¹',
      'Slime',
      'Spider fang',
      'Spirit wood',
      'Spores¹',
      'Tongue',
      'Troll blood',
      'Vampire blood',
      'Zombie skin',
    ];
    expect(matrix('table.alchemy.parts')).toEqual(
      parts.map((n, i) => `${i % 10 === 0 ? Math.floor(i / 10) + 1 : ''}|${(i % 10) + 1}|${n}`),
    );
  });
  it('preserves footnotes, selector conflict and nonnumeric Mana without interpreting zero', () => {
    expect(pilot.tables.find((t) => t.id === 'table.alchemy.habitats')!.footnotes[0]).toBe(
      'Roll 1d00 and check the result in the column that matches the area you are searching in. Looking for a specific ingredient? The green squares shows where it is most likely to be found!',
    );
    expect(pilot.tables.find((t) => t.id === 'table.alchemy.weak_supreme')!.footnotes).toEqual([
      'The cost should be read as Weak/Supreme.',
    ]);
    expect(pilot.tables.find((t) => t.id === 'table.alchemy.standard')!.issues).toEqual([
      'issue.alchemy.standard_selector',
    ]);
    const scribbles = pilot.tables
      .find((t) => t.id === 'table.spells.level_2')!
      .rows.find((r) => r.cells.name!.printed === 'Magic Scribbles')!;
    expect(scribbles.cells.mana).toEqual({
      type: 'marker',
      printed: '-',
      meaning: 'not_specified',
    });
  });
});
