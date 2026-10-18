// Appendix V Legendary Items, rendered PDF 202–215 (printed 200–213) and changelog 2.21 page 27.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const L = 'character.treasure.legendary.';
const run = (ids: string[], inputs: State) =>
  runCase({ rule_ids: ids.map((id) => L + id), inputs } as unknown as TestCase, corpus);
const base = { identified: true, selected: true };
const rule = (id: string) => corpus.rules.find((r) => r.id === L + id)!;
const entity = (id: string) => corpus.entities.find((e) => e.id === 'equipment.legendary.' + id)!;
const changelogRows = (sources: { document: string; locator?: { row?: unknown } }[]) =>
  sources.filter((s) => s.document === 'vonbraus.changelog_2_2x').map((s) => s.locator?.row);
const blocked = (result: ReturnType<typeof run>) =>
  result.events.some((e) => e.type === 'require' && 'satisfied' in e && e.satisfied === false);

const descriptions = corpus.entities.filter(
  (e) =>
    e.id.startsWith('equipment.legendary.') &&
    !['equipment.legendary.belt_of_oakenshield', 'equipment.legendary.the_golden_kopesh'].includes(
      e.id,
    ),
);

describe('verbatim quotations and printed headings', () => {
  const intro =
    'Legendary items are unique, and unless otherwise noted may only be found once. These items can never be sold, as their price is immeasurable. Unlike ordinary magic items, these items can never run out of magic or be damaged, but they need to be identified before use.';
  it('quotes the chapter introduction on PDF 203 in the general restriction', () => {
    expect(rule('general').source_text).toBe(intro);
    expect(rule('general').source[0]).toMatchObject({ pdf_page: 203, heading: 'Legendary Items' });
  });
  it('every item rule quotes only passages of its own item description', () => {
    expect(descriptions).toHaveLength(31);
    for (const e of descriptions) {
      const ruleIds = e.rules.filter((id) => id !== L + 'general');
      expect(ruleIds.length).toBeGreaterThan(0);
      for (const id of ruleIds) {
        const r = corpus.rules.find((x) => x.id === id)!;
        for (const part of r.source_text.split(' ... ')) {
          const passage = part.replace(/^\.\.\. /, '');
          if (passage === '1d6 Result') continue; // the deflection table header
          expect(e.source_text, id).toContain(passage);
        }
      }
    }
  });
  it('cites every page with the printed item name as heading', () => {
    for (const e of descriptions)
      for (const s of e.source.filter((x) => x.document === 'rulebook.second_printing.eng'))
        expect(s.heading).toBe(e.name);
    expect(entity('the_headsmans_axe').source.map((s) => s.pdf_page)).toEqual([207, 208, 27]);
    expect(entity('the_headsmans_axe').source_text).toContain(
      'seemed as though the axe itself had developed a lust for blood.',
    );
  });
  it('keeps the selector-only names as printed selector cells', () => {
    expect(entity('belt_of_oakenshield').source_text).toBe('Belt of Oakenshield');
    expect(entity('the_golden_kopesh').source_text).toBe('The Golden Kopesh');
    expect(entity('the_golden_kopesh').rules).toEqual([]);
  });
});

describe('chapter-wide restrictions (PDF 203, 202)', () => {
  it('may only be found once unless the description says otherwise', () => {
    expect(blocked(run(['found_once'], { already_found: true, repeat_find_noted: false }))).toBe(
      true,
    );
    expect(
      run(['found_once'], { already_found: true, repeat_find_noted: true }).state.may_be_found,
    ).toBe(true);
    expect(
      run(['found_once'], { already_found: false, repeat_find_noted: false }).state.may_be_found,
    ).toBe(true);
    expect(rule('found_once').source.map((s) => s.pdf_page)).toEqual([203, 202]);
  });
  it('needs identification before use and can never be sold', () => {
    expect(blocked(run(['identify_before_use'], { identified: false }))).toBe(true);
    expect(run(['identify_before_use'], { identified: true }).state.may_use).toBe(true);
    expect(blocked(run(['never_sold'], { sale_attempted: true }))).toBe(true);
  });
});

describe('typed dice in item descriptions', () => {
  it.each([
    ['sword_of_lightning.lightning', 'lightning_roll', { count: 1, sides: 6 }],
    ['the_vampires_brooch.restore', 'brooch_roll', { count: 1, sides: 6 }],
    ['the_vampires_brooch.drain', 'drain_roll', { count: 1, sides: 6 }],
    ['the_golden_khopesh.damage', 'damage_roll', { count: 1, sides: 12, modifier: 1 }],
    ['ring_of_regeneration.regenerate', 'regeneration_roll', { count: 1, sides: 3 }],
    ['necklace_of_deflection.roll', 'deflection_roll', { count: 1, sides: 6 }],
  ] as const)('%s types %s', (id, field, dice) => {
    expect(rule(id).fields[field]!.dice).toEqual(dice);
  });
  it('Sword of Lightning: odd hit adds 1d6 wounds, half (RDD) to the closest character', () => {
    const r = run(['sword_of_lightning.lightning'], {
      ...base,
      hit: true,
      hit_roll_odd: true,
      lightning_roll: 5,
    });
    expect(r.state).toMatchObject({
      target_extra_wounds: 5,
      armour_save_allowed: false,
      closest_character_wounds: 2,
    });
    expect(
      run(['sword_of_lightning.lightning'], { ...base, hit: true, hit_roll_odd: false }).trace,
    ).toEqual([]);
    expect(() =>
      run(['sword_of_lightning.lightning'], {
        ...base,
        hit: true,
        hit_roll_odd: true,
        lightning_roll: 7,
      }),
    ).toThrow('Input out of range');
  });
  it('Vampire’s Brooch: 1d6 restore capped by damage dealt; a 6 drains instead', () => {
    const ids = ['the_vampires_brooch.restore', 'the_vampires_brooch.drain'];
    const restored = run(ids, {
      ...base,
      wounded_enemy: true,
      brooch_roll: 4,
      damage_dealt: 2,
      drain_roll: 1,
    });
    expect(restored.trace).toEqual([L + 'the_vampires_brooch.restore']);
    expect(restored.state.owner_hit_points_restored).toBe(2);
    const drained = run(ids, {
      ...base,
      wounded_enemy: true,
      brooch_roll: 6,
      damage_dealt: 5,
      drain_roll: 3,
    });
    expect(drained.trace).toEqual([L + 'the_vampires_brooch.drain']);
    expect(drained.state).toMatchObject({
      owner_hit_points_restored: 0,
      closest_hero_hit_points_lost: 3,
    });
  });
  it('Golden Khopesh: DMG 1d12+1 with no armour or natural armour save', () => {
    expect(
      run(['the_golden_khopesh.damage'], { ...base, hit: true, damage_roll: 13 }).state,
    ).toMatchObject({
      damage_dealt: 13,
      armour_save_allowed: false,
      natural_armour_save_allowed: false,
    });
    expect(() =>
      run(['the_golden_khopesh.damage'], { ...base, hit: true, damage_roll: 1 }),
    ).toThrow('Input out of range');
  });
  it('Ring of Regeneration: 1d3 HP instead of 1d6', () => {
    expect(
      run(['ring_of_regeneration.regenerate'], {
        ...base,
        regeneration_applies: true,
        regeneration_roll: 3,
      }).state.hit_points_regenerated,
    ).toBe(3);
    expect(() =>
      run(['ring_of_regeneration.regenerate'], {
        ...base,
        regeneration_applies: true,
        regeneration_roll: 4,
      }),
    ).toThrow('Input out of range');
  });
  it.each([
    [2, 'Projectile misses completely'],
    [4, 'Hits an arm'],
    [5, 'Hits a leg'],
    [6, 'Hits the head'],
  ])('Necklace of Deflection roll %i reads "%s" from the printed table', (roll, result) => {
    expect(
      run(['necklace_of_deflection.roll'], {
        ...base,
        hit_by_projectile: true,
        chooses_to_roll: true,
        deflection_roll: roll,
      }).state.deflection_result,
    ).toBe(result);
  });
  it('Necklace of Deflection roll is optional', () => {
    expect(
      run(['necklace_of_deflection.roll'], {
        ...base,
        hit_by_projectile: true,
        chooses_to_roll: false,
      }).trace,
    ).toEqual([]);
  });
});

describe('embedded restrictions', () => {
  it('Horn of Alfheim must be in a Quick Slot (changelog 2.21 entry 189)', () => {
    expect(blocked(run(['horn_of_alfheim'], { ...base, in_quick_slot: false }))).toBe(true);
    expect(
      run(['horn_of_alfheim'], { ...base, in_quick_slot: false }).state.all_heroes_damage_modifier,
    ).toBeUndefined();
    expect(run(['horn_of_alfheim'], { ...base, in_quick_slot: true }).state).toMatchObject({
      quick_slot_required: true,
      full_turn: true,
      energy_cost: 2,
      all_heroes_damage_modifier: 3,
      duration: 'until end of battle',
    });
    expect(rule('horn_of_alfheim').applies_to).toBe('all_heroes');
    expect(rule('horn_of_alfheim').source_text).toContain('ready slot');
    expect(changelogRows(rule('horn_of_alfheim').source)).toEqual([189]);
  });
  it('Stone of Valheir is a wizard’s item with bounded storage and a RES Test per draw', () => {
    const wiz = { identified: true, user_is_wizard: true };
    expect(run(['stone_of_valheir'], { ...base, user_is_wizard: false }).trace).toEqual([]);
    expect(
      blocked(
        run(['stone_of_valheir.store'], {
          ...wiz,
          stored_focus_bonuses: 3,
          between_quests: true,
        }),
      ),
    ).toBe(true);
    expect(
      blocked(
        run(['stone_of_valheir.store'], {
          ...wiz,
          stored_focus_bonuses: 1,
          between_quests: false,
          arcane_arts_roll_succeeded: false,
        }),
      ),
    ).toBe(true);
    expect(
      run(['stone_of_valheir.store'], { ...wiz, stored_focus_bonuses: 2, between_quests: true })
        .state.stored_focus_bonuses_after,
    ).toBe(3);
    expect(
      blocked(
        run(['stone_of_valheir.draw'], { ...wiz, stored_focus_bonuses: 0, res_test_passed: true }),
      ),
    ).toBe(true);
    const failed = run(['stone_of_valheir.draw', 'stone_of_valheir.draw_failed_res'], {
      ...wiz,
      stored_focus_bonuses: 2,
      res_test_passed: false,
    });
    expect(failed.state).toMatchObject({
      stored_focus_bonuses_after: 1,
      increases_miscast_risk: false,
      sanity_lost: 1,
    });
    const passed = run(['stone_of_valheir.draw', 'stone_of_valheir.draw_failed_res'], {
      ...wiz,
      stored_focus_bonuses: 2,
      res_test_passed: true,
    });
    expect(passed.state).toMatchObject({ stored_focus_bonuses_after: 1 });
    expect(passed.state.sanity_lost).toBeUndefined();
    const drawOnly = run(['stone_of_valheir.draw'], { ...wiz, stored_focus_bonuses: 1 });
    expect(drawOnly.state.stored_focus_bonuses_after).toBe(0);
    expect(drawOnly.state.sanity_lost).toBeUndefined();
  });
  it('Crown of Resolve prevents the use of a helmet or cap', () => {
    expect(
      blocked(run(['crown_of_resolve.headgear'], { ...base, wearing_helmet_or_cap: true })),
    ).toBe(true);
    expect(
      run(['crown_of_resolve.headgear'], { ...base, wearing_helmet_or_cap: false }).state
        .crown_worn_validly,
    ).toBe(true);
  });
  it('Necklace of Flight: water, chasms and pits but not lava; uses the necklace slot', () => {
    const terrain = (square_terrain: string) =>
      run(['necklace_of_flight.terrain'], { ...base, square_terrain });
    expect(blocked(terrain('lava'))).toBe(true);
    for (const t of ['water', 'chasm', 'pit'])
      expect(terrain(t).state).toMatchObject({ may_walk_across: true, may_stay_in_square: true });
    expect(run(['necklace_of_flight'], base).state.slot).toBe('necklace');
    expect(changelogRows(rule('necklace_of_flight').source)).toEqual([192]);
  });
  it.each([
    ['ring_of_the_hierophant', 'ring'],
    ['ring_of_awareness', 'ring'],
    ['ring_of_regeneration', 'ring'],
    ['trap_sensing_ring', 'ring'],
    ['the_vampires_brooch', 'necklace'],
    ['necklace_of_flight', 'necklace'],
    ['necklace_of_deflection', 'necklace'],
  ])('%s occupies the %s slot under the jewellery limit', (id, slot) => {
    expect(run([id], base).state.slot).toBe(slot);
    expect(rule(id).dependencies!.map((d) => d.object_id)).toContain(
      'character.magic_item.jewellery_limits',
    );
  });
  it('the amulet is given no slot; its slot stays an open issue', () => {
    expect(run(['amulet_of_haamile'], base).state.slot).toBeUndefined();
    expect(rule('amulet_of_haamile').issues).toContain('issue.treasure.legendary_amulet_slot');
  });
  it('typed conditions for printed qualifiers', () => {
    expect(
      run(['ring_of_the_hierophant.undead_strike'], { ...base, attacker_is_undead: true }).state
        .attacker_cs_modifier,
    ).toBe(-15);
    expect(
      run(['ring_of_the_hierophant.undead_strike'], { ...base, attacker_is_undead: false }).trace,
    ).toEqual([]);
    expect(
      run(['ring_of_awareness.initiative'], {
        identified: true,
        first_round_of_battle: true,
        rings_of_awareness_worn: 5,
      }).state.initiative_tokens_added,
    ).toBe(3);
    expect(
      run(['ring_of_awareness.initiative'], {
        identified: true,
        first_round_of_battle: true,
        rings_of_awareness_worn: 2,
      }).state.initiative_tokens_added,
    ).toBe(2);
    expect(
      run(['the_summoners_staff.conjuring'], {
        identified: true,
        wielding_staff: true,
        spell_school: 'conjuration',
      }).state.arcane_arts_modifier,
    ).toBe(20);
    expect(
      run(['the_summoners_staff.conjuring'], {
        identified: true,
        wielding_staff: true,
        spell_school: 'elementalism',
      }).trace,
    ).toEqual([]);
    expect(
      run(['the_summoners_staff.summoned'], {
        identified: true,
        summoned_with_staff: true,
        summoned_kind: 'demon',
      }).state.extra_initiative_tokens,
    ).toBe(1);
    expect(
      run(['the_headsmans_axe.bonus'], { ...base, consecutive_damaging_hits: 3 }).state
        .damage_bonus,
    ).toBe(6);
    expect(
      run(['ohlnirs_hammer.hit'], { ...base, hit: true, actions_already_lost_this_turn: 1 }).state,
    ).toMatchObject({ enemy_stunned: true, additional_actions_lost: 0 });
    expect(
      run(['the_helmet_of_golgorosh_the_ram.failed_res'], {
        ...base,
        hit_in_head: true,
        res_test_passed: false,
      }).state,
    ).toMatchObject({ stunned: true, action_points_lost: 1 });
    expect(
      run(['the_breastplate_of_rannulf.large_creature'], {
        ...base,
        attacker_is_large_creature: true,
      }).state.double_damage_roll_allowed,
    ).toBe(false);
    expect(
      run(['the_halfling_backpack.object_enc'], { ...base, carried_in_bag: true, object_enc: 5 })
        .state.effective_enc,
    ).toBe(2);
    expect(
      run(['trap_sensing_ring.detect_traps'], {
        identified: true,
        ring_worn_in_party: true,
        rolling_to_detect_traps: true,
      }).state.perception_modifier,
    ).toBe(10);
    expect(
      run(['vial_of_never_ending.potion'], {
        identified: true,
        healing_potion: true,
        originally_mixed_in_vial: false,
      }).trace,
    ).toEqual([]);
    expect(
      run(['bow_of_divine_twilight.bloodlust_shot'], { ...base, bloodlust_triggered: true }).state
        .shot_damage_modifier,
    ).toBe(5);
  });
  it('Armour of the Father: one of four printed armours, +1 DEF', () => {
    expect(
      run(['armour_of_the_father.choice'], { identified: true, chosen_armour: 'chainmail_shirt' })
        .state,
    ).toMatchObject({ base_armour: 'equipment.armour.mail_shirt', defence_modifier: 1 });
    expect(() =>
      run(['armour_of_the_father.choice'], { identified: true, chosen_armour: 'plate_leggings' }),
    ).toThrow('Unknown choice');
  });
});

describe('designer rulings (changelog 2.21, page 27)', () => {
  it('cites entries 189–193 on the objects they correct', () => {
    expect(changelogRows(entity('amulet_of_haamile').source)).toEqual([190]);
    expect(entity('amulet_of_haamile').source_text).toContain('his wit began to diminish');
    for (const id of ['the_headsmans_axe', 'sword_of_lightning', 'ohlnirs_hammer']) {
      expect(changelogRows(rule(id).source)).toEqual([191]);
      expect(rule(id).source_text).toContain('in all other respects considered a');
    }
    expect(changelogRows(entity('belt_of_copperbane').source)).toEqual([193]);
    expect(changelogRows(entity('belt_of_oakenshield').source)).toEqual([193]);
    expect(entity('belt_of_oakenshield').rules).toContain(L + 'belt_of_copperbane');
    expect(entity('necklace_of_flight').source_text).not.toContain('necklace slot');
  });
  it('records the resolved and open issues with printed headings', () => {
    const issues = parse(readFileSync('review/ambiguities.yaml', 'utf8')) as {
      id: string;
      status: string;
      source: { heading?: string }[];
    }[];
    const find = (id: string) => issues.find((i) => i.id === 'issue.treasure.' + id)!;
    expect(find('horn_ready_slot').status).toBe('resolved');
    expect(find('necklace_of_flight_slot').status).toBe('resolved');
    for (const id of [
      'legendary_names',
      'vial_destruction',
      'legendary_followup',
      'father_selector',
      'legendary_amulet_slot',
      'legendary_base_names',
    ])
      expect(find(id).status).toBe('unresolved');
    for (const id of [
      'horn_ready_slot',
      'necklace_of_flight_slot',
      'legendary_names',
      'vial_destruction',
      'legendary_followup',
      'father_selector',
      'legendary_amulet_slot',
      'legendary_base_names',
    ])
      for (const s of find(id).source) expect(s.heading).not.toBe('Treasures');
  });
});
