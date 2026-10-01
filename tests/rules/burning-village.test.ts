import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffixes: string[], inputs: State = {}) =>
  runCase(
    { rule_ids: suffixes.map((x) => `core.quest.burning_village.${x}`), inputs } as TestCase,
    corpus,
  );
const single = (suffix: string, inputs: State = {}) => run([suffix], inputs);

describe('The Burning Village — rendered PDF 231', () => {
  it('preserves Rochdale and two random Orc/Goblin encounters on a single board edge', () => {
    expect(single('setup').state).toEqual({
      location: 'Rochdale',
      outdoor_tiles: true,
      initial_encounter_rolls: 2,
      encounter_chart: 'Orcs and Goblins Encounter Chart',
      initial_enemy_placement: 'randomised along one board edge',
      orc_chieftains: 1,
      chieftain_placement: 'in the same way',
      encounters: 'Orcs and Goblins',
      reward_kind: 'Special',
    });
    expect(single('chieftain').state).toEqual({ weapon: 'battleaxe', shield: true, armour: 2 });
  });
  it('permits one pre-battle rest and suppresses Travel Event rolls', () => {
    expect(single('pre_battle_rest').state).toEqual({
      pre_battle_rests_allowed: 1,
      roll_travel_events: false,
    });
  });
  it('uses no Threat but still rolls the Scenario die', () => {
    expect(single('scenario').state).toEqual({ threat_used: false, scenario_die_used: true });
    const table = corpus.tables.find((x) => x.id === 'table.quest.burning_village.threat')!;
    expect(table.rows[0]?.cells).toEqual({
      start: { type: 'marker', printed: 'N/A', meaning: 'unavailable' },
      min: { type: 'marker', printed: 'N/A', meaning: 'unavailable' },
      max: { type: 'marker', printed: 'N/A', meaning: 'unavailable' },
    });
  });
  it.each([1, 8, 9, 10])('reinforces only Scenario rolls 9–10: %s', (roll) => {
    const result = run(['reinforcements', 'no_reinforcements'], { scenario_roll: roll });
    expect(result.state.reinforcements).toBe(roll >= 9);
    if (roll >= 9)
      expect(result.state).toMatchObject({
        additional_encounter_rolls: 1,
        reinforcement_table: 'OaG Table',
        reinforcement_placement: 'cantered along a random table edge',
      });
  });
  it.each([0, 11])('rejects invalid Scenario rolls %s', (roll) => {
    expect(() => single('reinforcements', { scenario_roll: roll })).toThrow();
  });
  it('preserves ambiguous printed reinforcement geometry', () => {
    expect(
      corpus.rules.find((x) => x.id === 'core.quest.burning_village.reinforcements')?.issues,
    ).toContain('issue.quest.burning_village_cantered');
  });
  it.each([0, 1, 5])('requires no living enemies for victory: %s', (remaining) => {
    expect(single('victory', { living_enemies: remaining }).trace.length > 0).toBe(remaining === 0);
  });
  it('permits fleeing by leaving the map and ends the quest', () => {
    expect(single('flee').state).toEqual({
      leaving_map_allowed: true,
      leaving_map_ends_quest: true,
    });
  });
  it.each([true, false])(
    'offers party potions and treasure only in the won aftermath: %s',
    (won) => {
      const result = single('victory_aftermath', { quest_won: won });
      expect(result.trace.length > 0).toBe(won);
      if (won)
        expect(result.state).toMatchObject({
          random_potions: 3,
          fine_treasures: 1,
          body_payment_note_signer: 'Imgrahil',
          next_destination: 'the city',
        });
    },
  );
  it.each([true, false])('preserves the fled aftermath and Silver City destination: %s', (fled) => {
    const result = single('fled_aftermath', { heroes_fled: fled });
    expect(result.trace.length > 0).toBe(fled);
    if (fled)
      expect(result.state).toMatchObject({ next_destination: 'Silver City', village_burned: true });
  });
  it('keeps all ten local rules bound to the quest', () => {
    const quest = corpus.entities.find((x) => x.id === 'quest.dead_rising.burning_village')!;
    expect(quest.rules).toHaveLength(10);
    for (const id of quest.rules)
      expect(corpus.rules.find((x) => x.id === id)).toMatchObject({
        type: 'scenario_rule',
        scope: 'quest',
        quest_id: quest.id,
      });
  });
});
