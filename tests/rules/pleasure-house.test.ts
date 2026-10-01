import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.pleasure_house.${suffix}`], inputs } as TestCase, corpus);
describe('The Pleasure House — PDF251–252', () => {
  it('retains the printed dash alongside later Scenario8–10 rules', () => {
    expect(run('setup').state).toEqual({
      location: 'Silver City',
      corridors: 8,
      rooms: 6,
      encounters: 'Bandits and Brigands',
      reward_per_hero: 250,
      first_special_rules_printed: '-',
    });
  });
  it.each([7, 8, 9, 10])('triggers Scenario only on8–10: %s', (roll) => {
    const inputs: State = { scenario_roll: roll };
    expect(
      runCase(
        {
          rule_ids: [
            'core.quest.pleasure_house.scenario_trigger',
            'core.quest.pleasure_house.scenario_no_trigger',
          ],
          inputs,
        } as TestCase,
        corpus,
      ).state.scenario_triggered,
    ).toBe(roll >= 8);
  });
  it('spreads two rolls along walls, archers first at far end and Isabelle by bed', () => {
    expect(run('objective_setup').state).toMatchObject({
      encounter_rolls: 2,
      enemy_placement: 'evenly spread along walls',
      archer_placement_priority: 'start at far end with any Archers',
      isabelle_position: 'far end by the bed',
    });
    expect(run('isabelle').state).toEqual({
      seduction_special_rule: true,
      weapon: 'Longsword',
      armour: 1,
      xp: 140,
      treasure_table: 'T3',
    });
  });
  it.each([true, false])(
    'requires both guards and Isabelle defeated for the secrecy offer: %s',
    (defeated) => {
      const state = run('aftermath_offer', { guards_and_isabelle_defeated: defeated }).state;
      expect(state.secrecy_offer_party_coins === 400).toBe(defeated);
      if (defeated) expect(state.visitor_identity).toBe('daughter of the High Priest of Metheia');
    },
  );
  it.each([
    [true, true],
    [true, false],
    [false, true],
  ])('requires defeat and secrecy choice for aftermath roll: %s / %s', (defeated, secret) => {
    expect(
      run('secrecy_choice', {
        guards_and_isabelle_defeated: defeated,
        keep_secrecy_promise: secret,
      }).state.aftermath_table_required === true,
    ).toBe(defeated && secret);
  });
  const results = ['blessing', 'payment', 'priest_refusal', 'curse'];
  const outcomes = (roll: number, defeated = true, secret = true) =>
    runCase(
      {
        rule_ids: results.map((x) => 'core.quest.pleasure_house.' + x),
        inputs: {
          guards_and_isabelle_defeated: defeated,
          keep_secrecy_promise: secret,
          aftermath_roll: roll,
        } as State,
      } as TestCase,
      corpus,
    ).state;
  it.each([1, 2, 3, 4, 5, 6])(
    'preserves each outcome without invented daughter-payment cancellation: %s',
    (roll) => {
      const state = outcomes(roll);
      if (roll <= 3) expect(state.party_coins_from_daughter).toBe(400);
      else {
        expect(state).not.toHaveProperty('party_coins_from_daughter');
        expect(state).toMatchObject({
          high_priest_refuses_payment: true,
          priests_collectively_refuse_rewards: true,
        });
      }
      if (roll === 1 || roll === 6)
        expect(state).toMatchObject({
          max_hp_modifier: roll === 1 ? 1 : -1,
          max_hp_duration: 'until the end of the next quest',
        });
      else expect(state).not.toHaveProperty('max_hp_modifier');
      expect(state).not.toHaveProperty('coins');
      expect(state).not.toHaveProperty('hp');
    },
  );
  it.each([
    [false, true],
    [true, false],
  ])('cannot apply outcomes without source prerequisites: %s / %s', (defeated, secret) => {
    expect(outcomes(1, defeated, secret)).not.toHaveProperty('party_coins_from_daughter');
    expect(outcomes(6, defeated, secret)).not.toHaveProperty('max_hp_modifier');
  });
  it('transcribes Threat and all nine Isabelle cells including dashRS', () => {
    const t = corpus.tables.find((x) => x.id === 'table.quest.pleasure_house.threat');
    expect(['start', 'min', 'max'].map((x) => t?.rows[0]?.cells[x]?.printed)).toEqual([
      '1d4+1',
      'Same as start lvl',
      '20',
    ]);
    const stats = corpus.tables.find((x) => x.id === 'table.quest.pleasure_house.isabelle');
    expect(
      ['cs', 'rs', 'dmg', 'na', 'dex', 'to_hit', 'res', 'm', 'hp'].map(
        (x) => stats?.rows[0]?.cells[x]?.printed,
      ),
    ).toEqual(['45', '-', '0', '0', '50', '-10', '50', '4', '14']);
  });
  it('retains all four complete aftermath rows with literal wounds and duration wording', () => {
    const t = corpus.tables.find((x) => x.id === 'table.quest.pleasure_house.aftermath');
    expect(t?.rows.map((x) => [x.cells.roll?.printed, x.cells.result?.printed])).toEqual([
      [
        '1',
        'The girl holds fast to her word and the party gains 400 c. Furthermore, Metheia smiles upon your action and you gain +1 Max HP wounds until the end of the next quest.',
      ],
      ['2-3', 'The girl holds fast to her word and the party gains 400 c.'],
      [
        '4-5',
        'The priest manages to find out that you have withheld information and refuses to pay. Gaining the sympathy of the other priests, they collectively decide not to pay any rewards to the heroes.',
      ],
      [
        '6',
        'The priest manages to find out that you have withheld information and refuses to pay. Gaining the sympathy of the other priests, they collectively decide not to pay any rewards at all to the heroes. Furthermore, Metheia is not pleased with the hero’s actions and reduces your max Hit Points by 1, until the end of the next quest.',
      ],
    ]);
  });
});
