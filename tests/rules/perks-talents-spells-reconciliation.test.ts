// Appendix I: Perks (PDF 168–171), Appendix II: Talents (PDF 172–178) and Appendix IV: Spells
// (PDF 187–192): the chapter-root opening paragraphs, typed dice in catalogue text, printed actor
// qualifiers, and changelog 2.21 entry 188 for Ice Tomb.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { repoRoot } from '../../scripts/validate/schemas.ts';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { printedDiceMatches } from '../../scripts/validate/dice.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
function run(id: string, inputs: State) {
  const rule = corpus.rules.find((r) => r.id === id)!;
  const fixture: TestCase = {
    id: `test.${id}`,
    name: id,
    section_id: rule.section_id,
    source: rule.source,
    status: 'extracted',
    confidence: 'high',
    source_text: 'Derived boundary case.',
    kind: 'derived_case',
    rule_ids: [id],
    inputs,
    expected: { state: {}, events: [], trace: [], unresolved: [], steps: [] },
  };
  return runCase(fixture, corpus);
}

describe('chapter-root opening paragraphs', () => {
  it('a Perk costs 1 Energy and no AP, one Perk per Action', () => {
    expect(
      run('character.perk.appendix_use', { energy: 2, perks_used_this_action: 0 }).state,
    ).toMatchObject({ energy: 1, action_point_cost: 0 });
    const second = run('character.perk.appendix_use', { energy: 2, perks_used_this_action: 1 });
    expect(second.events).toContainEqual({ type: 'require', satisfied: false });
    expect(second.state.energy).toBe(2);
  });

  it('every perk activation rule quotes the Appendix I opening paragraph', () => {
    const intro = corpus.rules.find((r) => r.id === 'character.perk.appendix_use')!;
    const activations = corpus.rules.filter(
      (r) =>
        r.id.startsWith('character.perk.') &&
        r.id.endsWith('.activation') &&
        r.id !== 'character.perk.energy_to_mana.activation',
    );
    expect(activations.length).toBe(40);
    for (const rule of activations) expect(rule.source_text).toBe(intro.source_text);
  });

  it('the Talent opening paragraph and the die-roll ambiguity are linked', () => {
    const rule = corpus.rules.find((r) => r.id === 'character.talent.appendix_definition')!;
    expect(rule.section_id).toBe('section.appendix_ii_talents');
    expect(rule.issues).toContain('issue.talent.die_roll_benefit');
  });
});

describe('typed dice printed in perk, talent and spell text', () => {
  const cases: [string, string, string][] = [
    ['character.perk.powerful_blow.damage', 'd6_result', '1d6'],
    ['character.perk.inner_power.missile_damage', 'd6_result', '1d6'],
    ['character.perk.gods_favourite.threat', 'd6_result', '1d6'],
    ['character.talent.death_lament.recover', 'roll', '1d6'],
    ['character.talent.cutpurse.success', 'attempt_roll', '1d6'],
    ['character.talent.cutpurse.success', 'coin_roll', '1d100'],
    ['core.spell.lightning_bolt', 'first_damage_roll', '1d10'],
    ['core.spell.lightning_bolt', 'second_damage_roll', '1d8'],
    ['core.spell.lightning_bolt', 'third_damage_roll', '1d6'],
    ['core.spell.ice_tomb', 'frost_damage_roll', '1d4'],
    ['core.spell.fire_wall', 'duration_roll', '1d4'],
    ['core.spell.fire_wall', 'lower_undead_damage_roll', '1d6'],
    ['core.spell.fireball', 'target_roll', '3d6'],
    ['core.spell.fireball', 'adjacent_roll', '2d6'],
    ['core.spell.summon_demon.mind_loss', 'sanity_roll', '1d3'],
    ['core.spell.summon_greater_demon', 'sanity_roll', '1d6'],
  ];
  it.each(cases)('%s types %s as %s', (id, field, printed) => {
    const rule = corpus.rules.find((r) => r.id === id)!;
    const dice = rule.fields[field]?.dice;
    expect(dice).toBeDefined();
    expect(printedDiceMatches(printed, dice!)).toBe(true);
    expect(rule.source_text.toLowerCase()).toContain(printed.toLowerCase());
  });
});

describe('printed actor qualifiers', () => {
  it.each([
    [
      'character.perk.dispel_master.dispel',
      'wizard',
      { rolling_to_dispel: true, arcane_arts_modifier: 0 },
    ],
    [
      'character.perk.connoisseur.identify',
      'alchemist',
      { identifying_potion: true, alchemy_modifier: 0 },
    ],
    ['character.perk.fate_forger.reroll', 'warrior_priest', { scenario_die_just_rolled: true }],
  ] as [string, string, State][])('%s applies only to a %s', (id, profession, inputs) => {
    const ok = run(id, { ...inputs, profession });
    expect(ok.events).not.toContainEqual({ type: 'require', satisfied: false });
    const other = run(id, { ...inputs, profession: 'thief' });
    expect(other.events).toContainEqual({ type: 'require', satisfied: false });
  });
});

describe('Ice Tomb, changelog 2.21 entry 188', () => {
  it('keeps the printed cells and applies the exchanged CV and Mana', () => {
    const table = corpus.tables.find((t) => t.id === 'table.spells.level_4')!;
    const row = table.rows.find((r) => r.cells.name!.printed === 'Ice Tomb')!;
    expect(row.cells.cv!.printed).toBe('20');
    expect(row.cells.mana!.printed).toBe('25');
    expect(row.rule_refs).toContain('core.spell.ice_tomb.casting_cost');
    const rule = corpus.rules.find((r) => r.id === 'core.spell.ice_tomb.casting_cost')!;
    expect(rule.source.map((s) => s.document)).toContain('vonbraus.changelog_2_2x');
    expect(run(rule.id, {}).state).toMatchObject({ casting_value: 25, mana_cost: 20 });
  });
});

describe('Energy to Mana quotes the opening paragraph once and guards once', () => {
  it('quotes the paragraph and the row, with a single one-Perk-per-Action guard', () => {
    const intro = corpus.rules.find((r) => r.id === 'character.perk.appendix_use')!;
    const rule = corpus.rules.find((r) => r.id === 'character.perk.energy_to_mana.activation')!;
    expect(rule.source_text.startsWith(intro.source_text)).toBe(true);
    expect(rule.source_text).toContain('For each Energy Point spent, the wizard gains 20 Mana.');
    const guards = rule.effects.filter(
      (e) => e.type === 'require' && JSON.stringify(e).includes('perks_used_this_action'),
    );
    expect(guards).toHaveLength(1);
  });
});

describe('changelog 2.21 entries 180, 181, 182 and 187', () => {
  const cites = (id: string, row: number) =>
    corpus.rules
      .find((r) => r.id === id)!
      .source.some(
        (s) =>
          s.document === 'vonbraus.changelog_2_2x' &&
          (s as { locator?: { row?: number } }).locator?.row === row,
      );

  it('Hide in the Shadows lasts for the turn the Perk is used in (#180)', () => {
    for (const id of [
      'character.perk.hide_in_the_shadows.distant',
      'character.perk.hide_in_the_shadows.adjacent',
    ])
      expect(cites(id, 180)).toBe(true);
    expect(
      run('character.perk.hide_in_the_shadows.distant', { distance_when_enemy_starts_turn: 3 })
        .state,
    ).toMatchObject({ may_target_hero: false, duration: 'turn the Perk is used in' });
    expect(
      run('character.perk.hide_in_the_shadows.adjacent', {
        hero_adjacent: true,
        other_model_adjacent: true,
      }).state,
    ).toMatchObject({ attack_other_adjacent_model: true, duration: 'turn the Perk is used in' });
    expect(
      run('character.perk.hide_in_the_shadows.distant', { distance_when_enemy_starts_turn: 2 })
        .state.duration,
    ).toBeUndefined();
  });

  it('Surgeon acquires an exquisite part and works on two enemies per Energy Point (#181)', () => {
    expect(cites('character.perk.surgeon.harvest', 181)).toBe(true);
    const rule = corpus.rules.find((r) => r.id === 'character.perk.surgeon.harvest')!;
    expect(rule.source_text).toContain('The alchemist may choose what part to harvest.');
    expect(run(rule.id, { profession: 'alchemist' }).state).toMatchObject({
      acquires_exquisite_part: true,
      enemies_per_energy: 2,
    });
    expect(run(rule.id, { profession: 'wizard' }).events).toContainEqual({
      type: 'require',
      satisfied: false,
    });
  });

  it('Perfect Hearing eligibility cites "(or Trait)" and keeps the printed row (#182)', () => {
    const id = 'character.talent.perfect_hearing.eligibility';
    expect(cites(id, 182)).toBe(true);
    expect(corpus.rules.find((r) => r.id === id)!.source_text).toContain(
      'has this Talent listed in the Species Description.',
    );
    expect(run(id, { new_character: true, listed_for_species: true }).events).not.toContainEqual({
      type: 'require',
      satisfied: false,
    });
  });

  it('Healing keeps the printed 1d/+2 and heals 1d8+2 (#187)', () => {
    const rule = corpus.rules.find((r) => r.id === 'core.spell.healing')!;
    expect(cites(rule.id, 187)).toBe(true);
    expect(rule.source_text).toContain('1d/+2');
    expect(printedDiceMatches('1d8', rule.fields.healing_roll!.dice!)).toBe(true);
    const table = corpus.tables.find((t) => t.id === 'table.spells.level_3')!;
    const row = table.rows.find((r) => r.cells.name!.printed === 'Healing')!;
    expect(row.cells.effect!.printed).toContain('1d/+2');
    for (const healing_roll of [1, 8])
      expect(run(rule.id, { healing_roll, in_los: true, distance: 4 }).state).toMatchObject({
        hp_regained: healing_roll + 2,
        healing_dice: '1d8+2',
      });
    expect(run(rule.id, { healing_roll: 5, in_los: true, distance: 5 }).events).toContainEqual({
      type: 'require',
      satisfied: false,
    });
    const issues = parse(readFileSync(join(repoRoot, 'review/ambiguities.yaml'), 'utf8')) as {
      id: string;
      status: string;
    }[];
    expect(issues.find((i) => i.id === 'issue.spell.healing')!.status).toBe('resolved');
  });
});

describe('Appendix IV corrections', () => {
  it('Ice Tomb strength is an untyped variable-count roll linked to its issue', () => {
    const rule = corpus.rules.find((r) => r.id === 'core.spell.ice_tomb')!;
    expect(rule.fields.tomb_strength_roll).toMatchObject({ integer: true, minimum: 1 });
    expect(rule.fields.tomb_strength_roll!.dice).toBeUndefined();
    expect(rule.issues).toContain('issue.spell.ice_tomb_strength');
  });
  it('Enchant Item keeps its unbound Crafting pointer', () => {
    const rule = corpus.rules.find((r) => r.id === 'core.spell.enchant_item')!;
    expect(rule.unresolved_references).toEqual(['See chapter on Crafting.']);
    expect(rule.issues).toContain('issue.spell.enchant_item_crafting_pointer');
  });
});

describe('Magic Talent schools match the spell catalogue', () => {
  it.each([
    ['conjurer', 'Conjuration'],
    ['divinator', 'Divination'],
    ['mystic', 'Mysticism'],
    ['necromancer', 'Necromancy'],
  ])('%s fires for a %s spell', (talent, school) => {
    expect(corpus.entities.some((e) => e.school === school)).toBe(true);
    const id = `character.talent.${talent}.school_spell`;
    expect(
      run(id, { spell_school: school.toLowerCase(), arcane_arts_modifier: 0, mana_cost: 20 }).state,
    ).toMatchObject({ arcane_arts_modifier: 5, mana_cost: 15 });
    expect(
      run(id, { spell_school: 'destruction', arcane_arts_modifier: 0, mana_cost: 20 }).state,
    ).toMatchObject({ arcane_arts_modifier: 0, mana_cost: 20 });
  });
});
