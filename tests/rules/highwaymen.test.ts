import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.highwaymen.${suffix}`], inputs } as TestCase, corpus);

describe('Highwaymen — rendered PDF 229–230', () => {
  it('preserves location, tile count, encounter category and Objective Room', () => {
    expect(run('setup').state).toEqual({
      objective: 'deal with the bandits',
      location: 'White 34',
      corridors: 6,
      rooms: 6,
      encounters: 'Bandits and Brigands',
      objective_room: 'The Dwarven hall',
    });
  });
  it.each([
    [9, 10, true],
    [11, 10, false],
    [10, 10, false],
    [9, 11, false],
  ])('triggers only an increase to 10: %s → %s', (before, after, triggers) => {
    const result = run('threshold', { previous_threat: before, current_threat: after });
    expect(result.trace.length > 0).toBe(triggers);
    if (triggers)
      expect(result.state).toMatchObject({
        quest_threshold: 10,
        wandering_monster_triggered: true,
        scenario_result_ignored: true,
        threat_reduction_on_placement: 0,
      });
  });
  it('preserves two encounter rolls, relative placement, short-side entry and Bandits moving first', () => {
    expect(run('objective_setup').state).toEqual({
      graup_placement: 'by the throne',
      encounter_table_rolls: 2,
      encounter_table: 'Bandits and Brigands Table',
      bodyguard_placement: 'randomly around the Ogre, as close as possible',
      hero_entry: 'short side of the room',
      first_to_move: 'Bandits',
    });
  });
  it('preserves only Graup’s printed equipment without inventing ordinary Ogre stats', () => {
    expect(run('graup').state).toEqual({
      enemy_kind: 'ordinary Ogre',
      weapon: 'longsword',
      armour: 1,
    });
    const actor = corpus.entities.find((x) => x.id === 'quest_actor.dead_rising.graup')!;
    expect(actor.unresolved_references).toContain(
      'Ordinary Ogre statistics are not printed in this quest.',
    );
    expect(actor.tables).toEqual([]);
  });
  it('keeps per-hero reward, two aftermath chests and two days of party rations distinct', () => {
    expect(run('reward').state.reward_per_hero).toBe(200);
    expect(run('aftermath_loot').state).toEqual({
      aftermath_chests: 2,
      aftermath_ledger: true,
      ledger_lists_wagon_crews_as_plunder: true,
    });
    expect(run('aftermath_travel').state).toEqual({
      rations_days_supplied: 2,
      travel_direction: 'north through the forest',
      next_destination: 'Rochdale',
      travel_without_event: true,
      use_bandit_stash_rations: true,
      smoke_sighted: 'mid-day on the second day',
    });
  });
  it('retains the Threat grid and each illustrated ledger entry in source order', () => {
    const threat = corpus.tables.find((x) => x.id === 'table.quest.highwaymen.threat')!;
    expect(threat.rows[0]?.cells).toEqual({
      start: { type: 'number', printed: '3', value: 3, meaning: 'value' },
      min: { type: 'number', printed: '3', value: 3, meaning: 'value' },
      max: { type: 'number', printed: '18', value: 18, meaning: 'value' },
    });
    const ledger = corpus.tables.find((x) => x.id === 'table.quest.highwaymen.plunder_ledger')!;
    expect(ledger.rows.map((x) => x.cells.entry?.printed)).toEqual([
      '12/6',
      '2 rolls of linen (~350 c)',
      '2 kegs of Dwarven Ale (~400 c)',
      '1 bag of spice (~500 c)',
      '373 c',
      '3 bodies - 150 c (Delivery 13/6)',
      '16/6',
      '3 sacks of potatoes (~50 c)',
    ]);
    expect(
      ledger.rows.filter((x) => x.row_kind === 'structural').map((x) => x.cells.entry?.printed),
    ).toEqual(['12/6', '16/6']);
    expect(ledger.source_text).toContain('not treated as item prices or present reward contents');
    expect(ledger.source[0]).toMatchObject({ pdf_page: 230, printed_page: 228 });
  });
  it('keeps all seven local rules bound to Highwaymen', () => {
    const quest = corpus.entities.find((x) => x.id === 'quest.dead_rising.highwaymen')!;
    expect(quest.rules).toHaveLength(7);
    for (const id of quest.rules)
      expect(corpus.rules.find((x) => x.id === id)).toMatchObject({
        type: 'scenario_rule',
        scope: 'quest',
        quest_id: quest.id,
      });
  });
});
