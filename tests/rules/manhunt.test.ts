import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const execute = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.manhunt.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => execute(suffix, inputs).state;
describe('Manhunt — PDF278', () => {
  it('checks every statistics cell and both header bands', () => {
    const table = corpus.tables.find((t) => t.id === 'table.quest.manhunt.bandit_statistics');
    expect(table?.columns.map((c) => c.label)).toEqual([
      'CS',
      'RS',
      'DEX',
      'RES',
      'DMG/NA',
      'To hit',
      'Luck',
      'M',
      'HP',
      'Energy',
    ]);
    expect(table?.rows[0]?.cells).toEqual({
      cs: { type: 'number', printed: '60', value: 60, meaning: 'value' },
      rs: { type: 'text', printed: '-' },
      dex: { type: 'number', printed: '45', value: 45, meaning: 'value' },
      res: { type: 'number', printed: '35', value: 35, meaning: 'value' },
      dmg_na: { type: 'text', printed: '-' },
      to_hit: { type: 'number', printed: '-10', value: -10, meaning: 'value' },
      luck: { type: 'number', printed: '0', value: 0, meaning: 'value' },
      m: { type: 'number', printed: '4', value: 4, meaning: 'value' },
      hp: { type: 'number', printed: '15', value: 15, meaning: 'value' },
      energy: { type: 'number', printed: '0', value: 0, meaning: 'value' },
    });
  });
  it('retains inherited quest setup, equipment and identifying features', () => {
    expect(run('setup')).toMatchObject({
      location: 'same dungeon as the next quest',
      advertised_reward_coins: 250,
      encounters: 'as defined by the main quest',
      objective_room: 'No specific Objective Room',
    });
    expect(run('identification')).toEqual({ bandit_missing_eye: true, bandit_missing_ear: true });
    expect(run('profile')).toEqual({
      bandit_weapon: 'battle-axe',
      bandit_has_shield: true,
      bandit_armour: 3,
    });
  });
  it.each([1, 12, 18])(
    'copies the ordinary deck count %s without adding an extra bandit card',
    (count) => {
      expect(run('deck', { dungeon_deck_done: true, dungeon_deck_cards: count })).toMatchObject({
        auxiliary_deck_cards: count,
        chosen_bandit_cards: 1,
        mix_auxiliary_deck: true,
        auxiliary_deck_next_to_ordinary: true,
      });
      expect(
        execute('deck', { dungeon_deck_done: false, dungeon_deck_cards: count }).trace,
      ).toHaveLength(0);
    },
  );
  it.each([true, false])('draws on door opening: %s', (opened) =>
    expect(execute('door_draw', { door_opened: opened }).trace).toHaveLength(opened ? 1 : 0),
  );
  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('adds the Bandit after ordinary encounters only on his card: %s/%s', (opened, card) => {
    const result = execute('found', { door_opened: opened, drawn_card_represents_bandit: card });
    expect(result.trace).toHaveLength(opened && card ? 1 : 0);
    if (opened && card)
      expect(result.state).toMatchObject({
        bandit_found: true,
        roll_encounters_as_usual: true,
        bandit_placement: 'far end of the room',
        bandit_placed_after_encounter_roll: true,
      });
  });
  it.each(['bandit_killed', 'kill_proven', 'back_in_city'])('requires %s for reward', (missing) => {
    const inputs: State = { bandit_killed: true, kill_proven: true, back_in_city: true };
    expect(run('reward', inputs).reward_coins).toBe(250);
    inputs[missing] = false;
    expect(execute('reward', inputs).trace).toHaveLength(0);
  });
});
