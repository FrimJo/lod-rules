import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (ids: string[], inputs: State = {}) =>
  runCase({ rule_ids: ids, inputs } as TestCase, corpus);
describe('Random Quests — rendered PDF243', () => {
  it('keeps every selector rule within quest scope', () => {
    const rules = corpus.rules.filter((rule) =>
      rule.id.startsWith('core.quest_book.random_quests.'),
    );
    expect(rules).toHaveLength(7);
    expect(rules.every((rule) => rule.scope === 'quest')).toBe(true);
  });
  it('preserves two-stage selection and repeatability without inventing difficulty calculations', () => {
    expect(run(['core.quest_book.random_quests.selection_order']).state).toEqual({
      first_select_objective_room: true,
      then_roll_quest_in_corresponding_chapter: true,
      quests_repeatable: true,
      layouts_shift: true,
      difficulty_increases_with_hero_levels: true,
    });
  });
  const expected = [
    'The Lava River',
    'The Bandits’ Hideout',
    'The Fountain Room',
    'The Great Crypt',
    'The Chamber of Reverence',
  ];
  it.each(expected.map((name, i) => [i + 1, name] as const))(
    'selects %s -> %s before the chapter quest roll',
    (roll, name) => {
      const result = run(
        Array.from({ length: 6 }, (_, i) => `core.quest_book.random_quests.result_${i + 1}`),
        { objective_room_roll: roll },
      );
      expect(result.state).toEqual({
        objective_room_roll: roll,
        selected_objective_room: name,
        roll_quest_in_selected_chapter: true,
      });
    },
  );
  it('rerolls on6 without selecting a room or inventing a fallback quest', () => {
    const result = run(
      Array.from({ length: 6 }, (_, i) => `core.quest_book.random_quests.result_${i + 1}`),
      { objective_room_roll: 6 },
    );
    expect(result.state).toEqual({ objective_room_roll: 6, reroll_objective_room: true });
  });
  it('retains all six structured rows and source folio', () => {
    const t = corpus.tables.find((x) => x.id === 'table.quest.random_quests.objective_room');
    expect(t?.rows.map((x) => [x.cells.roll?.printed, x.cells.objective_room?.printed])).toEqual(
      [...expected, 'Roll Again'].map((name, i) => [String(i + 1), name]),
    );
    expect(t?.source[0]).toMatchObject({ pdf_page: 243, printed_page: 241 });
  });
});
