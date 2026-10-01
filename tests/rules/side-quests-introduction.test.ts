import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const execute = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.side_quests.${suffix}`], inputs } as TestCase, corpus);
const names = [
  'The Missing Brother',
  'Slay the Beast',
  'The Mapmaker',
  'Go Fetch!',
  'Manhunt',
  'Mushrooms',
];
describe('Side Quests introduction and selector — PDF273', () => {
  it('retains attachment and both selection methods', () => {
    expect(execute('attachment').state.can_add_to_basically_any_other_quest).toBe(true);
    expect(execute('selection').state.selection_methods).toBe(
      'roll on the 1d6 table or work through quests one by one',
    );
  });
  it.each([true, false])('permits city acceptance without adding to Day Count: %s', (city) => {
    const result = execute('acceptance', { heroes_staying_in_city: city, day_count: 7 });
    expect(result.trace).toHaveLength(city ? 1 : 0);
    expect(result.state.day_count).toBe(7);
    if (city)
      expect(result.state).toMatchObject({
        side_quest_acceptance_allowed: true,
        side_quest_acceptance_day_count_cost: 0,
        arrangements: 'during nights at the inn or meeting someone during the day',
      });
  });
  it('checks all twelve printed table cells and columns', () => {
    const table = corpus.tables.find((t) => t.id === 'table.quest.side_quests.selector');
    expect(table?.columns).toEqual([
      { id: 'roll', label: '1d6', cell_types: ['number'] },
      { id: 'quest', label: 'Quest', cell_types: ['text'] },
    ]);
    expect(table?.rows.map((r) => r.cells)).toEqual(
      names.map((name, i) => ({
        roll: { type: 'number', printed: String(i + 1), value: i + 1, meaning: 'value' },
        quest: { type: 'text', printed: name },
      })),
    );
  });
  it.each([1, 2, 3, 4, 5, 6])('selects exactly the source result %s', (roll) => {
    for (let index = 1; index <= 6; index++) {
      const result = execute(`result_${index}`, { side_quest_selection_roll: roll });
      expect(result.trace).toHaveLength(index === roll ? 1 : 0);
      if (index === roll) expect(result.state.selected_side_quest).toBe(names[roll - 1]);
    }
  });
});
