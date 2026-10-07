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

describe('Random Quest selection order — rendered PDF243', () => {
  const select = (inputs: State) =>
    runCase({ procedure_id: 'procedure.random_quest_selection', inputs } as TestCase, corpus);
  const fresh: State = {
    offer_id: 'visit-3/random-1',
    selection_offer_id: '',
    objective_room_roll: 6,
    room_selected: false,
    selected_objective_room: '',
    quest_selected: false,
    selected_quest_id: '',
    chapter_quest_supplied: false,
    chapter_quest_id: '',
    chapter_quest_room: '',
    acceptance_handoff_processed: false,
  };
  const handoffs = (result: ReturnType<typeof select>) =>
    result.events.filter((e) => e.type === 'invoke');
  it('a 6 rolls again; the first 1–5 room is kept and cannot be replaced', () => {
    const six = select(fresh);
    expect(six.state).toMatchObject({ reroll_objective_room: true, room_selected: false });
    const two = select({ ...six.state, objective_room_roll: 2 });
    expect(two.state).toMatchObject({
      room_selected: true,
      selected_objective_room: 'The Bandits’ Hideout',
      reroll_objective_room: false,
    });
    const later = select({ ...two.state, objective_room_roll: 1 });
    expect(later.state.selected_objective_room).toBe('The Bandits’ Hideout');
  });
  it('the unprinted chapter quest roll stays open until a result from that chapter is supplied', () => {
    const room = select({ ...fresh, objective_room_roll: 2 }).state;
    const open = select(room);
    expect(open.unresolved).toEqual(['issue.quest.random_quest_second_stage']);
    expect(handoffs(open)).toEqual([]);
    const wrongChapter = select({
      ...room,
      chapter_quest_supplied: true,
      chapter_quest_id: 'quest.lava_river.stop_heretics',
      chapter_quest_room: 'The Lava River',
    });
    expect(wrongChapter.state.quest_selected).toBe(false);
    expect(handoffs(wrongChapter)).toEqual([]);
    const chosen = select({
      ...room,
      chapter_quest_supplied: true,
      chapter_quest_id: 'quest.bandits_hideout.pleasure_house',
      chapter_quest_room: 'The Bandits’ Hideout',
    });
    expect(chosen.state).toMatchObject({
      quest_selected: true,
      selected_quest_id: 'quest.bandits_hideout.pleasure_house',
    });
    expect(handoffs(chosen)).toEqual([
      { type: 'invoke', dependency: 'procedure.quest_acceptance' },
    ]);
    expect(handoffs(select(chosen.state))).toEqual([]);
  });
  it('another offer cannot use this selection; a later offer of the same quest starts fresh', () => {
    const room = select({ ...fresh, objective_room_roll: 4 }).state;
    const other = select({ ...room, offer_id: 'visit-3/random-2', objective_room_roll: 1 });
    expect(other.state).toMatchObject({
      owner_matches: false,
      selected_objective_room: 'The Great Crypt',
    });
    const repeat = select({ ...fresh, offer_id: 'visit-9/random-1', objective_room_roll: 4 });
    expect(repeat.state).toMatchObject({
      selection_offer_id: 'visit-9/random-1',
      selected_objective_room: 'The Great Crypt',
    });
  });
});
