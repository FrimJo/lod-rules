/**
 * The character creator carries rulebook facts as data (src/character/rules.ts). These tests
 * read the same facts back from the corpus through the agent tools, so a corpus fix cannot
 * leave the creator quoting a stale value, and every page it cites is a page the record cites.
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { Retrieval } from '../../../scripts/retrieve/index.ts';
import { runRetrievalTool } from '../../../scripts/retrieve/tools.ts';
import {
  ARCANE_PERKS,
  ARMOUR,
  BACKGROUNDS,
  CITES,
  CREATION,
  DAMAGE_BONUS,
  LEVEL_1_PRAYERS,
  LEVEL_1_SPELLS,
  NATURAL_ARMOUR,
  PERKS,
  PROFESSIONS,
  QUOTES,
  RELICS,
  SKILLS,
  SPECIES,
  STAT_KEYS,
  TALENTS,
  TALENT_CATEGORIES,
  WEAPONS,
  WEAPON_CLASSES,
  TERMS,
  STAT_EFFECTS,
  STAT_KEYS as STAT_KEY_LIST,
  WEAPON_SPECIALS,
  ARMOUR_SPECIALS,
  SHIELDS,
  GEAR,
  GEAR_GROUPS,
  CARRY,
  BODY_AREAS,
  STANDARD_POTIONS,
  INGREDIENTS,
  PARTS,
  PARTY,
  START_SETTLEMENTS,
  type GearGroup,
  type Cite,
  type SkillId,
  type TalentCategory,
} from '../src/character/rules.ts';

interface Citation {
  pdf_page: number | null;
  printed_page: number | null;
}
interface Cell {
  type: string;
  printed: string;
  value?: number;
  dice?: { count: number; sides: number; modifier?: number };
}
interface Row {
  id: string;
  cells: Record<string, Cell>;
}
interface Grant {
  kind: string;
  label: string;
  object_id?: string;
  qualifier?: string;
}
interface ToolRecord {
  found?: false;
  id: string;
  text?: string;
  citations?: Citation[];
  data?: {
    rows?: Row[];
    grants?: Grant[];
    grant_choices?: { quantity: number; options: Grant[] }[];
    initial_hit_points?: { printed: string; dice: { modifier: number } };
    starting_equipment?: { label: string; quantity: number; selection: string }[];
    starting_abilities?: { kind: string; quantity: number; level?: number }[];
    background_number?: number;
    level?: number;
    activation_cost?: { energy: number };
    talent_selection?: { selection: string };
  };
}

let retrieval: Retrieval;
before(() => {
  retrieval = Retrieval.fromCorpus();
});
after(() => retrieval.close());

function get(id: string): ToolRecord {
  const record = runRetrievalTool(retrieval, 'lod_get', { id }) as ToolRecord;
  assert.notEqual(record.found, false, `record ${id} exists`);
  return record;
}

function rows(id: string): Row[] {
  const list = get(id).data?.rows;
  assert.ok(list && list.length > 0, `${id} has rows`);
  return list;
}

function citesPage(record: ToolRecord, cite: Cite, label: string): void {
  const match = record.citations?.some(
    (c) => c.pdf_page === cite.pdf && (cite.page === null || c.printed_page === cite.page),
  );
  assert.ok(match, `${label} cites PDF ${cite.pdf} (printed ${cite.page}) as ${record.id} does`);
}

test('every citation in the creator points at a page its corpus record cites', () => {
  for (const [name, cite] of Object.entries(CITES)) {
    if (!cite.recordId) continue;
    citesPage(get(cite.recordId), cite, `CITES.${name}`);
  }
  for (const species of SPECIES) citesPage(get(species.cite.recordId!), species.cite, species.id);
  for (const profession of PROFESSIONS)
    citesPage(get(profession.cite.recordId!), profession.cite, profession.id);
  for (const background of BACKGROUNDS)
    citesPage(get(background.recordId), background.cite, background.id);
  for (const prayer of LEVEL_1_PRAYERS) citesPage(get(prayer.recordId), prayer.cite, prayer.id);
  for (const perk of PERKS) citesPage(get(perk.recordId), perk.cite, perk.id);
});

test('species stat tables, Hit Points, traits and limitations match the corpus', () => {
  for (const species of SPECIES) {
    const row = rows(species.statsTableId)[0]!;
    for (const key of STAT_KEYS) {
      const cell = row.cells[key]!;
      assert.equal(cell.printed, `${species.base[key]}+1d10`, `${species.id} ${key}`);
      assert.equal(cell.dice?.modifier, species.base[key], `${species.id} ${key} modifier`);
    }
    const record = get(`species.${species.id}`);
    assert.equal(
      record.data?.initial_hit_points?.printed,
      species.hitPointsPrinted,
      `${species.id} HP`,
    );
    assert.equal(
      record.data?.initial_hit_points?.dice.modifier,
      species.hitPointsBase,
      `${species.id} HP base`,
    );
    const grants = record.data?.grants ?? [];
    assert.deepEqual(
      grants.map((g) => g.object_id),
      species.traits.map((t) => `talent.${t.talentId}`),
      `${species.id} traits`,
    );
    for (const trait of species.traits) {
      const grant = grants.find((g) => g.object_id === `talent.${trait.talentId}`)!;
      if (trait.qualifier)
        assert.equal(grant.qualifier, trait.qualifier, `${species.id} ${trait.talentId} qualifier`);
    }
    assert.equal(
      Boolean(record.data?.talent_selection),
      species.randomTalent,
      `${species.id} random talent`,
    );
    for (const line of species.limitations)
      assert.ok(record.text?.includes(line), `${species.id} limitation: ${line}`);
    if (species.special) assert.ok(record.text?.includes(species.special), `${species.id} special`);
  }
  const maxima = rows('table.character.stat_maxima');
  for (const species of SPECIES) {
    const row = maxima.find((r) => r.id === species.id)!;
    for (const key of STAT_KEYS)
      assert.equal(row.cells[key]?.value, species.maxima[key], `${species.id} max ${key}`);
  }
  assert.equal(
    get('character.species.halfling.initial_luck').text,
    'Lucky (Starts with 1 Point of Luck).',
  );
  assert.match(get('character.species.halfling.cooking_gear').text ?? '', /Cooking gear for 50 c/);
});

test('the Skills List base stats match the corpus', () => {
  const table = rows('table.character.skill_bases');
  assert.deepEqual(
    SKILLS.map((s) => s.rowId),
    table.map((r) => r.id),
  );
  for (const skill of SKILLS) {
    const row = table.find((r) => r.id === skill.rowId)!;
    assert.equal(row.cells.skill?.printed, skill.name);
    assert.equal(row.cells.base_stat?.printed, skill.stat.toUpperCase(), skill.id);
  }
});

const SKILL_BY_NAME = new Map(SKILLS.map((s) => [s.name, s.id] as [string, SkillId]));

test('profession skill tables, Hit Points, talents, perks and equipment match the corpus', () => {
  for (const profession of PROFESSIONS) {
    const table = rows(profession.skillTableId);
    const seen = new Set<string>();
    let hitPoints: Cell | undefined;
    for (const row of table) {
      for (const side of ['left', 'right'] as const) {
        const name = row.cells[`${side}_skill`]!.printed;
        const cell = row.cells[`${side}_modifier`]!;
        if (name === 'Hit Points') {
          hitPoints = cell;
          continue;
        }
        const id = SKILL_BY_NAME.get(name);
        assert.ok(id, `${profession.id}: skill ${name}`);
        seen.add(id);
        const expected = profession.modifiers[id];
        if (cell.type === 'marker') assert.equal(expected, null, `${profession.id} ${id} is N/A`);
        else assert.equal(cell.value, expected, `${profession.id} ${id}`);
      }
    }
    assert.equal(seen.size, SKILLS.length, `${profession.id} covers every skill`);
    assert.equal(hitPoints?.value, profession.hitPoints, `${profession.id} HP`);
    assert.equal(hitPoints?.printed, profession.hitPointsPrinted, `${profession.id} HP printed`);

    const record = get(`profession.${profession.id}`);
    const grants = record.data?.grants ?? [];
    assert.deepEqual(
      grants.filter((g) => g.kind === 'talent').map((g) => g.object_id),
      profession.talents.map((t) => `talent.${t.talentId}`),
      `${profession.id} fixed talents`,
    );
    assert.deepEqual(
      grants.filter((g) => g.kind === 'perk').map((g) => g.object_id),
      profession.perks.map((p) => `perk.${p.perkId}`),
      `${profession.id} perks`,
    );
    const choices = record.data?.grant_choices ?? [];
    if (profession.talentChoice) {
      assert.equal(choices.length, 1, `${profession.id} has one talent choice`);
      assert.deepEqual(
        choices[0]!.options.map((o) => o.object_id),
        profession.talentChoice.map((t) => `talent.${t.talentId}`),
        `${profession.id} talent options`,
      );
    } else assert.equal(choices.length, 0, `${profession.id} has no talent choice`);

    const equipment = record.data?.starting_equipment ?? [];
    assert.deepEqual(
      equipment.map((e) => [e.label, e.quantity, e.selection]),
      profession.equipment.map((e) => [e.label, e.quantity, e.selection]),
      `${profession.id} starting equipment`,
    );
    const abilities = record.data?.starting_abilities ?? [];
    const spells = abilities.find((a) => a.kind === 'spell');
    const prayers = abilities.find((a) => a.kind === 'prayer');
    const arcane = abilities.find((a) => a.kind === 'perk');
    assert.deepEqual(
      spells ? { quantity: spells.quantity, level: spells.level } : undefined,
      profession.spells,
      `${profession.id} spells`,
    );
    assert.deepEqual(
      prayers ? { quantity: prayers.quantity, level: prayers.level } : undefined,
      profession.prayers,
      `${profession.id} prayers`,
    );
    assert.equal(
      Boolean(arcane),
      Boolean(profession.arcanePerkChoice),
      `${profession.id} arcane perk`,
    );
    for (const line of profession.limitations)
      assert.ok(record.text?.includes(line), `${profession.id} limitation: ${line}`);
    for (const line of profession.special ?? [])
      assert.ok(record.text?.includes(line), `${profession.id} special`);
    if (profession.startingEnergy)
      assert.match(
        get('character.profession.warrior_priest.initial_energy').text ?? '',
        new RegExp(`starts with ${profession.startingEnergy} points of Energy`),
      );
  }
});

test('Damage Bonus, Natural Armour and Weapon Class tables match the corpus', () => {
  const db = rows('table.character.damage_bonus');
  assert.deepEqual(
    db.map((r) => [r.cells.stat?.value, r.cells.bonus?.value]),
    DAMAGE_BONUS.map((r) => [r.stat, r.bonus]),
  );
  const na = rows('table.character.natural_armour');
  assert.deepEqual(
    na.map((r) => [r.cells.stat?.value, r.cells.bonus?.value]),
    NATURAL_ARMOUR.map((r) => [r.stat, r.bonus]),
  );
  const classes = rows('table.equipment.weapon_class_strength');
  assert.deepEqual(
    classes.map((r) => [
      r.cells.weapon_class?.value,
      r.cells.two_hands?.value,
      r.cells.one_hand?.type === 'marker' ? null : r.cells.one_hand?.value,
    ]),
    WEAPON_CLASSES.map((r) => [r.weaponClass, r.twoHands, r.oneHand]),
  );
});

test('every talent in Appendix II matches its table row, and every row is in the creator', () => {
  for (const [category, meta] of Object.entries(TALENT_CATEGORIES) as [
    TalentCategory,
    { tableId: string },
  ][]) {
    const table = rows(meta.tableId);
    const ours = TALENTS.filter((t) => t.category === category);
    assert.deepEqual(
      ours.map((t) => t.id),
      table.map((r) => r.id),
      `${category} talents in table order`,
    );
    for (const talent of ours) {
      const row = table.find((r) => r.id === talent.id)!;
      assert.equal(row.cells.talent?.printed, talent.name, talent.id);
      assert.equal(row.cells.description?.printed, talent.text, `${talent.id} text`);
      if (talent.restriction)
        assert.ok(
          talent.text.includes(talent.restriction.printed),
          `${talent.id} restriction is printed`,
        );
    }
  }
});

test('starting perks, Arcane perks, Level 1 spells, prayers and relics match the corpus', () => {
  for (const perk of PERKS) {
    const record = get(perk.recordId);
    assert.ok(record.text?.includes(perk.text), perk.id);
    assert.equal(record.data?.activation_cost?.energy, 1, `${perk.id} costs 1 Energy`);
  }
  const arcane = rows('table.perk.arcane');
  assert.deepEqual(
    arcane.map((r) => [
      r.id,
      r.cells.perk?.printed,
      r.cells.effect?.printed,
      r.cells.comment?.printed,
    ]),
    ARCANE_PERKS.map((p) => [p.id, p.name, p.effect, p.comment]),
  );
  const spells = rows('table.spells.level_1');
  assert.deepEqual(
    spells.map((r) => [
      r.id,
      r.cells.name?.printed,
      r.cells.cv?.value,
      r.cells.mana?.value,
      r.cells.upkeep?.value,
      r.cells.special?.printed,
      r.cells.school?.printed,
      r.cells.effect?.printed,
    ]),
    LEVEL_1_SPELLS.map((s) => [
      s.rowId,
      s.name,
      s.cv,
      s.mana,
      s.upkeep,
      s.special,
      s.school,
      s.effect,
    ]),
  );
  for (const prayer of LEVEL_1_PRAYERS) {
    const record = get(prayer.recordId);
    assert.equal(record.data?.level, 1, `${prayer.id} is level 1`);
    assert.equal(record.text, prayer.text, prayer.id);
  }
  const hits = runRetrievalTool(retrieval, 'lod_search', {
    query: 'prayer',
    kinds: ['entity'],
    limit: 50,
  }) as { id: string }[];
  const levelOne = hits
    .filter((h) => h.id.startsWith('prayer.'))
    .filter((h) => get(h.id).data?.level === 1)
    .map((h) => h.id)
    .sort();
  assert.deepEqual(
    levelOne,
    LEVEL_1_PRAYERS.map((p) => p.recordId).sort(),
    'every level 1 prayer is offered',
  );
  const relics = rows('table.treasure.relics');
  assert.deepEqual(
    relics.map((r) => [r.id, r.cells.relic?.printed, r.cells.effect?.printed]),
    RELICS.map((r) => [r.rowId, r.name, r.effect]),
  );
});

test('the twenty Backgrounds match the corpus number for number', () => {
  for (const background of BACKGROUNDS) {
    const record = get(background.recordId);
    assert.equal(record.data?.background_number, background.number, background.id);
    assert.equal(record.text, background.text, `${background.id} text`);
  }
  assert.match(
    get('character.background.the_noble.initial_coins').text ?? '',
    /400 c instead of the normal 150 c/,
  );
  assert.match(
    get('character.background.bad_tempered.trait').text ?? '',
    /-2 modifier to Party Morale[^]*\+2/,
  );
});

test('the Weapons and Armour tables match the corpus row for row', () => {
  const weapons = rows('table.equipment.weapons');
  assert.deepEqual(
    weapons.map((r) => [
      r.id,
      r.cells.name?.printed,
      r.cells.damage?.printed,
      r.cells.enc?.type === 'marker' ? null : r.cells.enc?.value,
      r.cells.weapon_class?.type === 'marker' ? null : r.cells.weapon_class?.value,
      r.cells.special?.printed,
      r.cells.cost?.printed,
      r.cells.reload?.printed,
    ]),
    WEAPONS.map((w) => [
      w.id,
      w.name,
      w.damage,
      w.enc,
      w.weaponClass,
      w.special,
      w.costPrinted,
      w.reload,
    ]),
  );
  const armour = rows('table.equipment.armour').filter((r) => !r.id.startsWith('tier_'));
  assert.deepEqual(
    armour.map((r) => [
      r.id,
      r.cells.name?.printed,
      r.cells.def?.value,
      r.cells.enc?.value,
      r.cells.covers?.printed,
      r.cells.special?.printed,
      r.cells.cost?.printed,
    ]),
    ARMOUR.map((p) => [p.id, p.name, p.def, p.enc, p.covers, p.special, p.costPrinted]),
  );
  const tiers = rows('table.equipment.armour');
  let tier = 0;
  for (const row of tiers) {
    if (row.id.startsWith('tier_')) tier = Number(row.id.slice(5));
    else assert.equal(ARMOUR.find((p) => p.id === row.id)?.tier, tier, `${row.id} tier`);
  }
  assert.match(
    get('character.durability.standard').text ?? '',
    /all weapons have a Durability of 6/,
  );
  assert.match(
    get('combat.weapon.special.defensive.durability').text ?? '',
    /only take 4 Points of Damage before it breaks/,
  );
  assert.equal(
    WEAPONS.find((w) => w.id === 'staff')?.durability,
    CREATION.defensiveWeaponDurability,
  );
});

test('creation constants and quoted wording match the corpus', () => {
  const text = (id: string) => get(id).text ?? '';
  assert.match(text('character.creation.starting_coins'), /150 coins/);
  assert.equal(CREATION.startingCoins, 150);
  assert.match(text('character.creation.starting_sanity'), /Sanity Value of 8/);
  assert.equal(CREATION.sanity, 8);
  assert.match(text('character.luck.initial'), /0 Luck/);
  assert.match(text('character.energy.initial'), /1 point of energy/);
  assert.match(text('character.level.initial'), /Start Level of your hero is 1 \(Experience is 0/);
  assert.match(text('character.movement.initial'), /movement of 4/);
  assert.match(
    text('procedure.character_creation_specialisation'),
    /extra 15 points[^]*no stat may have more than 10/,
  );
  assert.match(
    text('procedure.character_creation_reroll'),
    /2 rerolls[^]*never reroll a reroll, but you may choose the highest/,
  );
  assert.match(text('character.skill.free_skill'), /modifier of \+10/);
  assert.match(text('character.mana.initial'), /WISx1,5/);
  assert.match(text('character.encumbrance.limit'), /STR\+15/);
  assert.match(
    text('procedure.character_creation_equipment_wear'),
    /Roll 1d4 for each piece[^]*at least 1 Point of Durability/,
  );
  assert.match(
    text('character.equipment.general.backpack_medium.capacity'),
    /by 10 ENC points, but decreases DEX by -5/,
  );
  assert.match(
    text('character.profession.ranger.short_arms_starting_bow'),
    /Longbow and 10 arrows/,
  );

  const quoted: [keyof typeof QUOTES, string][] = [
    ['rollStats', 'character.creation.roll_stats'],
    ['rollAll', 'character.creation.roll_all_option'],
    ['reroll', 'procedure.character_creation_reroll'],
    ['specialisation', 'procedure.character_creation_specialisation'],
    ['freeSkill', 'character.skill.free_skill'],
    ['mana', 'character.mana.initial'],
    ['damageBonus', 'character.damage_bonus.lookup'],
    ['coins', 'character.creation.starting_coins'],
    ['wear', 'procedure.character_creation_equipment_wear'],
    ['buyBefore', 'character.creation.buy_before_game'],
    ['backpack', 'character.creation.small_backpack'],
    ['partyMorale', 'character.creation.party_morale'],
    ['sanity', 'character.creation.starting_sanity'],
    ['luck', 'character.luck.initial'],
    ['energy', 'character.energy.initial'],
    ['level', 'character.level.initial'],
    ['movement', 'character.movement.initial'],
    ['background', 'character.creation.background_optional'],
    ['durability', 'character.durability.standard'],
    ['encumbrance', 'character.encumbrance.penalty'],
    ['encumbranceCap', 'character.encumbrance.limit'],
    ['warriorPriestEnergy', 'character.profession.warrior_priest.initial_energy'],
    ['jackOfAllTrades', 'species.human'],
  ];
  for (const [key, id] of quoted)
    assert.ok(text(id).includes(QUOTES[key]), `QUOTES.${key} is printed in ${id}`);
  assert.match(
    text('procedure.character_creation_skill'),
    /Some Talents may also add to your Skill Values/,
  );
});

test('every glossary term, stat description and special rule is quoted verbatim from the corpus', () => {
  for (const term of TERMS) {
    const record = get(term.recordId);
    assert.equal(record.text, term.text, `term ${term.abbr}`);
    citesPage(record, term.cite, `term ${term.abbr}`);
  }
  for (const key of STAT_KEY_LIST) {
    const effect = STAT_EFFECTS[key];
    const record = get(effect.recordId);
    assert.equal(record.text, effect.text, `stat ${key}`);
    citesPage(record, effect.cite, `stat ${key}`);
  }
  for (const rule of [...WEAPON_SPECIALS, ...ARMOUR_SPECIALS]) {
    const record = get(rule.recordId);
    assert.equal(record.text, rule.text, `special ${rule.key}`);
    citesPage(record, rule.cite, `special ${rule.key}`);
  }
  const weaponSpecials = new Set(
    rows('table.equipment.weapons')
      .flatMap((r) => (r.cells.special?.printed ?? '').split(','))
      .map((s) => s.trim())
      .filter((s) => s && s !== '-'),
  );
  // "Unlimited Ammo" (Sling) has no rule record of its own: the table prints no explanation.
  for (const printed of weaponSpecials)
    if (printed !== 'Unlimited Ammo')
      assert.ok(
        WEAPON_SPECIALS.some((rule) => printed.startsWith(rule.key)),
        `special rule for "${printed}" is explained`,
      );
});

test('the Shield table and every general equipment table match the corpus row for row', () => {
  const shields = rows('table.equipment.shields');
  assert.deepEqual(
    shields.map((r) => [
      r.id,
      r.cells.name?.printed,
      r.cells.def?.value,
      r.cells.shield_class?.value,
      r.cells.enc?.value,
      r.cells.special?.printed,
      r.cells.cost?.printed,
    ]),
    SHIELDS.map((s) => [s.id, s.name, s.def, s.shieldClass, s.enc, s.special, s.costPrinted]),
  );
  for (const [group, meta] of Object.entries(GEAR_GROUPS) as [
    GearGroup,
    { tableId: string; cite: Cite },
  ][]) {
    const table = rows(meta.tableId);
    citesPage(get(meta.tableId), meta.cite, `gear group ${group}`);
    const ours = GEAR.filter((item) => item.group === group);
    assert.deepEqual(
      table.map((r) => [
        r.id,
        r.cells.name?.printed,
        r.cells.enc?.printed,
        (r.cells.durability ?? r.cells.dur)?.printed,
        r.cells.special?.printed,
        r.cells.cost?.printed,
        r.cells.availability?.value,
      ]),
      ours.map((item) => [
        item.id,
        item.name,
        item.encPrinted,
        item.durPrinted,
        item.special,
        item.costPrinted,
        item.availability,
      ]),
      `${group} rows`,
    );
  }
  const healing = GEAR.find((item) => item.id === 'healing_potion')!;
  assert.deepEqual(
    healing.costChoices?.map((c) => c.cost),
    [75, 100],
  );
  assert.match(get('character.equipment.alchemy.healing_potion.weak').text ?? '', /1d4/);
});

test('carrying rules, the Hit Area table and the backpack and slot upgrades match the corpus', () => {
  const text = (id: string) => get(id).text ?? '';
  assert.equal(text(CARRY.quickSlotsRecord), CARRY.quickSlotsText);
  assert.equal(text(CARRY.quickAccessRecord), CARRY.quickAccessText);
  assert.equal(text(CARRY.backpackRecord), CARRY.backpackText);
  assert.equal(text(CARRY.handsRecord), CARRY.handsText);
  assert.equal(text(CARRY.stackRecord), CARRY.stackText);
  assert.equal(text(CARRY.stackedArmourRecord), CARRY.stackedArmourText);
  assert.match(text('character.equipment.general.combat_harness.slots'), /from 3 to 5/);
  assert.match(text('character.equipment.general.extended_battle_belt.slots'), /from 3 to 4/);
  assert.equal(CARRY.extraSlots.combat_harness, 2);
  assert.equal(CARRY.extraSlots.extended_battle_belt, 1);
  assert.match(
    text('character.equipment.general.backpack_large.capacity'),
    /by 25 ENC points, but decreases DEX by -10/,
  );
  assert.deepEqual(CARRY.backpacks.backpack_large, { capacity: 25, dex: -10 });
  assert.deepEqual(CARRY.backpacks.backpack_medium, { capacity: 10, dex: -5 });
  assert.match(text('character.equipment.armour.stackable'), /-10 DEX/);
  assert.match(text('character.equipment.armour.clunky'), /-10 DEX/);
  assert.match(text('character.encumbrance.penalty'), /all skills and stats are at -10/);
  const areas = rows('table.combat.hit_location');
  assert.deepEqual(
    areas.map((r) => [r.id, r.cells.roll?.printed]),
    BODY_AREAS.map((a) => [a.rowId, a.roll]),
  );
  for (const area of BODY_AREAS)
    assert.ok(
      areas.find((r) => r.id === area.rowId)!.cells.location?.printed.startsWith(area.label),
      area.id,
    );
});

test('the Alchemist kit tables match the corpus', () => {
  const potions = rows('table.alchemy.standard').filter(
    (r) => r.cells.potion?.printed !== 'Roll again',
  );
  assert.deepEqual(
    potions.map((r) => [r.id, r.cells.potion?.printed, r.cells.cost?.value]),
    STANDARD_POTIONS.map((p) => [p.rowId, p.name, p.cost]),
  );
  assert.deepEqual(
    rows('table.alchemy.ingredients').map((r) => r.cells.ingredient?.printed),
    [...INGREDIENTS],
  );
  const parts = rows('table.alchemy.parts');
  let group = 0;
  assert.deepEqual(
    parts.map((r) => {
      if (r.cells.group?.type === 'number') group = r.cells.group.value!;
      return [r.id, group, r.cells.roll?.value, r.cells.part?.printed];
    }),
    PARTS.map((p) => [p.rowId, p.group, p.roll, p.name]),
  );
  assert.match(
    get('profession.alchemist').text ?? '',
    /3 potions of choice \(standard level\), a bag with 3 random ingredients and 3 freely chosen parts\. 1 freely chosen recipe for a Weak Potion/,
  );
});

test('party size, the start settlement list, the first quests and the next level match the corpus', () => {
  const text = (id: string) => get(id).text ?? '';
  assert.equal(text(PARTY.designedSizeRecord), PARTY.designedSizeText);
  assert.equal(text(PARTY.repeatRecord), PARTY.repeatText);
  assert.equal(text(PARTY.startSettlementRecord), PARTY.startSettlementText);
  assert.equal(text(PARTY.firstQuestsRecord), PARTY.firstQuestsText);
  assert.deepEqual(
    rows('table.settlement.start_settlement').map((r) => [
      r.id,
      r.cells.number?.printed,
      r.cells.settlement?.printed,
    ]),
    START_SETTLEMENTS.map((s) => [s.rowId, String(s.number), s.name]),
  );
  const levels = rows(PARTY.nextLevelRecord);
  assert.equal(
    levels.find((r) => r.id === 'level_2')!.cells.xp_requirement?.value,
    PARTY.nextLevelXp,
  );
});
