import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const execute = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.slay_beast.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => execute(suffix, inputs).state;
const names = [
  'Giant spider',
  'Cave Monster',
  'Common Troll',
  'Minotaur with Greataxe, Armour 2',
  'Gigantic Snake',
  'Gigantic Spider',
];
const bounds = [
  [1, 3],
  [4, 5],
  [6, 7],
  [8, 8],
  [9, 9],
  [10, 10],
] as const;
const bets = [300, 400, 500, 600, 700, 800];
describe('Slay the Beast — PDF275', () => {
  it('checks all eighteen printed table cells', () => {
    expect(
      corpus.tables
        .find((t) => t.id === 'table.quest.slay_beast.monster_bet')
        ?.rows.map((r) => r.cells),
    ).toEqual(
      names.map((name, i) => {
        const [lo, hi] = bounds[i]!;
        return {
          roll: {
            type: 'range',
            printed: lo === hi ? String(lo) : `${lo}-${hi}`,
            min: lo,
            max: hi,
          },
          monster: { type: 'text', printed: name },
          bet: { type: 'text', printed: `${bets[i]} c` },
        };
      }),
    );
  });
  it('retains inherited location/encounters and the printed Side Quest 1 mismatch', () => {
    expect(run('setup')).toMatchObject({
      location: 'same dungeon as the next quest',
      encounters: 'as defined by the main quest',
    });
    expect(run('deck').printed_card_to_add).toBe('Side Quest 1');
    expect(
      run('decline', { challenge_accepted: false }).main_quest_without_side_quest_allowed,
    ).toBe(true);
    expect(execute('decline', { challenge_accepted: true }).trace).toHaveLength(0);
  });
  it.each([true, false])(
    'draws the next card and adds a door only on side-card draw: %s',
    (drawn) => {
      expect(execute('draw', { printed_side_quest_card_drawn: drawn }).trace).toHaveLength(
        drawn ? 1 : 0,
      );
      if (drawn)
        expect(run('draw', { printed_side_quest_card_drawn: true })).toMatchObject({
          put_side_quest_card_aside: true,
          next_cards_to_draw: 1,
          next_card_leads_to_objective_room: true,
          extra_doors_in_that_room: 1,
          extra_door_destination: 'Side Quest Objective Room',
        });
    },
  );
  it('keeps objective R17 and far-end placement', () =>
    expect(run('objective')).toEqual({
      objective_tile: 'R17',
      monster_placement: 'far end of the room',
    }));
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'selects exactly the source monster and bet for %s',
    (roll) => {
      for (let i = 0; i < 6; i++) {
        const [lo, hi] = bounds[i]!;
        const result = execute(`result_${i + 1}`, { monster_selection_roll: roll });
        expect(result.trace).toHaveLength(roll >= lo && roll <= hi ? 1 : 0);
        if (roll >= lo && roll <= hi)
          expect(result.state).toMatchObject({ selected_monster: names[i], bet_coins: bets[i] });
      }
      if (roll === 8)
        expect(run('result_4', { monster_selection_roll: 8 })).toMatchObject({
          minotaur_weapon: 'Greataxe',
          minotaur_armour: 2,
        });
    },
  );
  it.each([300, 800])('keeps total wager %s separate from per-hero rewards', (bet) => {
    expect(
      run('win', {
        challenge_accepted: true,
        beast_slain: true,
        returned_to_tavern: true,
        beast_head_presented: true,
        bet_coins: bet,
      }),
    ).toMatchObject({ bet_winnings_coins: bet });
    expect(
      run('loss', {
        challenge_accepted: true,
        challenge_failed: true,
        returned_from_quest: true,
        bet_coins: bet,
      }),
    ).toMatchObject({ bet_payment_due_coins: bet });
  });
  it.each(['challenge_accepted', 'beast_slain', 'returned_to_tavern', 'beast_head_presented'])(
    'guards success by %s',
    (missing) => {
      const inputs: State = {
        challenge_accepted: true,
        beast_slain: true,
        returned_to_tavern: true,
        beast_head_presented: true,
        bet_coins: 300,
      };
      inputs[missing] = false;
      expect(execute('win', inputs).trace).toHaveLength(0);
    },
  );
  it.each(['challenge_accepted', 'challenge_failed', 'returned_from_quest'])(
    'guards debt by %s',
    (missing) => {
      const inputs: State = {
        challenge_accepted: true,
        challenge_failed: true,
        returned_from_quest: true,
        bet_coins: 800,
      };
      inputs[missing] = false;
      expect(execute('loss', inputs).trace).toHaveLength(0);
    },
  );
  it.each([true, false])(
    'requires alternate payment only when the lost bet is unaffordable: %s',
    (affordable) => {
      const inputs: State = {
        challenge_accepted: true,
        challenge_failed: true,
        returned_to_tavern: true,
        can_afford_bet: affordable,
      };
      expect(execute('cannot_afford', inputs).trace).toHaveLength(affordable ? 0 : 1);
      if (!affordable)
        expect(run('cannot_afford', inputs).must_try_to_pay_with_what_you_have).toBe(true);
      expect(execute('cannot_afford', { ...inputs, challenge_accepted: false }).trace).toHaveLength(
        0,
      );
      expect(execute('cannot_afford', { ...inputs, returned_to_tavern: false }).trace).toHaveLength(
        0,
      );
    },
  );
});
