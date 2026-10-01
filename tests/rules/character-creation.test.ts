import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const run = (id: string, inputs: State) =>
  runCase({ procedure_id: `procedure.character_creation${id}`, inputs } as TestCase, corpus);
const reroll: State = {
  keep_highest: true,
  creation_open: true,
  already_rerolled: false,
  rerolls_used: 0,
  original_roll: 8,
  replacement_roll: 3,
  die_sides: 10,
  accepted_roll: 8,
};
const allocation: State = {
  creation_open: true,
  specialisation_applied: false,
  str: 35,
  con: 35,
  dex: 35,
  wis: 35,
  res: 35,
  str_points: 10,
  con_points: 5,
  dex_points: 0,
  wis_points: 0,
  res_points: 0,
};
const skill: State = {
  creation_open: true,
  skill_recorded: false,
  free_skill_used: false,
  use_free_skill: true,
  base_stat: 35,
  profession_modifier: -20,
  talent_skill_bonus: 0,
  skill_value: 0,
};
const wear: State = {
  before_game: true,
  damageable: true,
  wear_applied: false,
  maximum_durability: 3,
  wear_roll: 4,
  damage: 0,
  durability_remaining: 3,
};
const hero: State = {
  phase: 'choose_species',
  stage: 'new',
  species: 'human',
  profession: 'warrior',
  species_traits_resolved: true,
  rolls_resolved: true,
  specialisation_applied: true,
  profession_choices_resolved: true,
  equipment_resolved: true,
  creation_complete: false,
  coins: 0,
  sanity: 0,
  luck: 0,
  level: 0,
  experience: 0,
  energy: 0,
  res: 37,
  party_morale: 7,
};

describe('creation rerolls — PDF 29, printed 27', () => {
  it('may retain the original highest roll while spending the reroll', () => {
    const r = run('_reroll', reroll);
    expect(r.state).toMatchObject({ accepted_roll: 8, already_rerolled: true, rerolls_used: 1 });
    expect(r.steps).toEqual(['check_reroll', 'accept_reroll', 'keep_highest']);
  });
  it('may instead accept a lower replacement', () => {
    expect(run('_reroll', { ...reroll, keep_highest: false }).state.accepted_roll).toBe(3);
  });
  it('shares the two-roll budget with HP', () => {
    const first = run('_reroll', reroll);
    const hp = run('_reroll', {
      ...first.state,
      already_rerolled: false,
      original_roll: 2,
      replacement_roll: 6,
      die_sides: 6,
      accepted_roll: 2,
    });
    expect(hp.state).toMatchObject({ accepted_roll: 6, rerolls_used: 2 });
    const third = run('_reroll', { ...hp.state, already_rerolled: false });
    expect(third.state.rerolls_used).toBe(2);
    expect(third.state.reroll_applied).toBe(false);
    expect(third.steps).not.toContain('accept_reroll');
  });
  it.each<State>([
    { already_rerolled: true },
    { creation_open: false },
    { die_sides: 6, original_roll: 8 },
    { die_sides: 6, original_roll: 2, replacement_roll: 7 },
    { die_sides: 8 },
  ])('rejects invalid or repeated rerolls: %j', (override) => {
    const r = run('_reroll', { ...reroll, ...override });
    expect(r.state.rerolls_used).toBe(0);
    expect(r.events).toContainEqual({ type: 'require', satisfied: false });
  });
  it('requires supplied dice', () => {
    const { replacement_roll: _missing, ...inputs } = reroll;
    expect(() => run('_reroll', inputs)).toThrow('Missing input replacement_roll');
  });
});

describe('creation specialisation and skills — PDF 29, 32', () => {
  it('allocates exactly 15 points once', () => {
    const r = run('_specialisation', allocation);
    expect(r.state).toMatchObject({ str: 45, con: 40, specialisation_applied: true });
    expect(run('_specialisation', r.state).state).toEqual(r.state);
  });
  it.each([4, 6])('rejects totals other than 15 (%i CON points)', (con_points) => {
    const r = run('_specialisation', { ...allocation, con_points });
    expect(r.state.str).toBe(35);
    expect(r.steps).not.toContain('allocate');
  });
  it('rejects more than ten on one stat', () => {
    expect(() => run('_specialisation', { ...allocation, str_points: 11, con_points: 4 })).toThrow(
      'Input out of range str_points',
    );
  });
  it('calculates the printed Warrior Pick Locks free-skill example without changing DEX', () => {
    const r = run('_skill', skill);
    expect(r.state).toMatchObject({ skill_value: 25, base_stat: 35, free_skill_used: true });
    expect(r.steps).toEqual(['check_skill', 'calculate_skill', 'free_skill', 'record_skill']);
    expect(run('_skill', r.state).steps).not.toContain('record_skill');
  });
  it.each([0, 10])('rejects Free Skill on a nonnegative modifier (%i)', (profession_modifier) => {
    expect(run('_skill', { ...skill, profession_modifier }).state.skill_recorded).toBe(false);
  });
  it('rejects using the shared Free Skill a second time', () => {
    const first = run('_skill', skill);
    const next = run('_skill', { ...first.state, skill_recorded: false, skill_value: 0 });
    expect(next.state.skill_value).toBe(0);
    expect(next.steps).not.toContain('record_skill');
  });
  it('floors negative skills at zero and leaves basic stats unchanged by talent bonuses', () => {
    expect(
      run('_skill', { ...skill, use_free_skill: false, profession_modifier: -50 }).state
        .skill_value,
    ).toBe(0);
    expect(run('_skill', { ...skill, talent_skill_bonus: 5 }).state).toMatchObject({
      base_stat: 35,
      skill_value: 30,
    });
  });
});

describe('creation equipment wear — PDF 32, printed 30', () => {
  it('retains one durability and cannot damage the item twice', () => {
    const r = run('_equipment_wear', wear);
    expect(r.state).toMatchObject({ damage: 2, durability_remaining: 1, wear_applied: true });
    expect(run('_equipment_wear', r.state).state).toEqual(r.state);
  });
  it.each<State>([{ damageable: false }, { before_game: false }])(
    'does not damage inapplicable items: %j',
    (override) => expect(run('_equipment_wear', { ...wear, ...override }).state.damage).toBe(0),
  );
  it('handles one-durability equipment and all d4 outcomes', () => {
    expect(run('_equipment_wear', { ...wear, maximum_durability: 1 }).state.damage).toBe(0);
    for (const wear_roll of [1, 2, 3, 4]) {
      expect(
        run('_equipment_wear', { ...wear, wear_roll, maximum_durability: 8 }).state.damage,
      ).toBe(wear_roll);
    }
    expect(() => run('_equipment_wear', { ...wear, wear_roll: 5 })).toThrow('Input out of range');
  });
});

describe('creation sequence and resource ownership — PDF 29–33', () => {
  it.each(['dwarf', 'elf', 'halfling', 'human'])('initializes %s once', (species) => {
    const first = run('', { ...hero, species });
    expect(first.state).toMatchObject({
      coins: 150,
      sanity: 8,
      luck: species === 'halfling' ? 1 : 0,
      energy: 1,
      level: 1,
      experience: 0,
      stage: 'species',
    });
    expect(first.events).toContainEqual({ type: 'invoke', dependency: `species.${species}` });
    expect(run('', { ...first.state, coins: 100 }).state.coins).toBe(100);
  });
  it('rejects unknown species and out-of-order finish', () => {
    expect(run('', { ...hero, species: 'invented' }).state.stage).toBe('new');
    const r = run('', { ...hero, phase: 'finish' });
    expect(r.state.party_morale).toBe(7);
    expect(r.state.creation_complete).toBe(false);
  });
  it('records handoffs without executing them and preserves resolved modifications', () => {
    let r = run('', hero);
    r = run('', { ...r.state, phase: 'rolls' });
    expect(r.events).toContainEqual({
      type: 'invoke',
      dependency: 'procedure.character_creation_reroll',
    });
    r = run('', { ...r.state, phase: 'specialise' });
    r = run('', { ...r.state, phase: 'profession', sanity: 9, energy: 2, coins: 100 });
    expect(r.state).toMatchObject({ stage: 'profession', sanity: 9, energy: 2, coins: 100 });
    expect(r.events).toContainEqual({ type: 'invoke', dependency: 'profession.warrior' });
    r = run('', { ...r.state, phase: 'equipment', coins: 70 });
    r = run('', { ...r.state, phase: 'finish' });
    expect(r.state).toMatchObject({
      creation_complete: true,
      morale_contribution: 3,
      party_morale: 10,
      coins: 70,
      sanity: 9,
      energy: 2,
    });
    expect(r.steps).toContain('finish');
    expect(run('', r.state).state.party_morale).toBe(10);
  });
  it.each([
    ['rolls', 'species', 'rolls_resolved'],
    ['rolls', 'species', 'species_traits_resolved'],
    ['specialise', 'rolled', 'specialisation_applied'],
    ['profession', 'specialised', 'profession_choices_resolved'],
    ['equipment', 'profession', 'equipment_resolved'],
  ])('does not advance %s with incomplete %s / %s', (phase, stage, missing) => {
    const r = run('', { ...hero, phase, stage, [missing]: false });
    expect(r.state.stage).toBe(stage);
    expect(r.events.some((event) => event.type === 'invoke')).toBe(false);
  });
  it('retains source uncertainties and binds wizard mana only for wizard', () => {
    const r = run('', { ...hero, phase: 'profession', stage: 'specialised', profession: 'wizard' });
    expect(r.events).toContainEqual({ type: 'invoke', dependency: 'character.mana.initial' });
    const procedure = corpus.procedures.find((p) => p.id === 'procedure.character_creation');
    expect(procedure?.issues).toEqual(['issue.phase4.mana_rounding', 'issue.phase4.lookup_domain']);
  });
});
