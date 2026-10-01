import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const result = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.tomb_raiders.${suffix}`], inputs } as TestCase, corpus);
const run = (suffix: string, inputs: State = {}) => result(suffix, inputs).state;
describe('Tomb Raiders — PDF262', () => {
  it('preserves White38, R1B-8B and loot-only reward', () => {
    expect(run('setup')).toMatchObject({
      location: 'White 38',
      special_rules_printed: '-',
      corridors: 7,
      rooms: 5,
      room_tiles: 'R1B-8B',
      reward_printed: 'Any loot found',
      encounters: 'Undead',
      keep_any_loot_found: true,
    });
    expect(run('setup')).not.toHaveProperty('reward_per_hero');
    expect(run('objective_setup')).toMatchObject({
      hero_position: 'where they stood when the door was opened',
      room_contents: 'tombs',
      initial_room_movement: false,
    });
  });
  it('checks all Threat cells', () => {
    const table = corpus.tables.find((x) => x.id === 'table.quest.tomb_raiders.threat');
    expect(table?.rows[0]?.cells).toEqual({
      start: { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'initial' },
      min: { type: 'text', printed: 'Same as start lvl' },
      max: { type: 'number', printed: '20', value: 20, meaning: 'value' },
    });
  });
  it.each([
    [1, true],
    [2, false],
    [2, true],
  ])('guards tomb opening and single findings handoff: %s/%s', (heroes, complete) => {
    const state = result('open_tomb', {
      heroes_working_together: heroes,
      complete_turn_spent: complete,
    });
    expect(state.state.lid_removed === true).toBe(heroes === 2 && complete);
    expect(state.events).toEqual(
      heroes === 2 && complete
        ? [{ type: 'invoke', dependency: 'character.treasure.furniture.sarcophagus' }]
        : [],
    );
    expect(state.state).not.toHaveProperty('wonderful_treasures');
  });
  it.each([
    [0, 11, 10],
    [1, 9, 10],
    [1, 10, 10],
    [1, 11, 10],
    [2, 20, 19],
    [1, 20, 20],
  ])('requires a hero and strictly above Threat: %s/%s/%s', (heroes, roll, threat) => {
    const state = run('objective_threat', {
      heroes_in_objective_room: heroes,
      threat_roll: roll,
      current_threat_level: threat,
    });
    expect(state.wandering_monster_required === true).toBe(heroes >= 1 && roll > threat);
    expect(state.threat_increase_required === true).toBe(heroes >= 1 && roll > threat);
    expect(state.current_threat_level).toBe(threat);
    expect(state).not.toHaveProperty('threat_increase_amount');
  });
  it('preserves result20 conflict and the local printed typo', () => {
    const rule = corpus.rules.find((x) => x.id === 'core.quest.tomb_raiders.objective_threat');
    expect(rule?.issues).toContain('issue.quest.tomb_raiders_threat_boundary');
    expect(rule?.source_text).toContain('at least on hero');
    expect(rule?.dependencies?.find((x) => x.key === 'ordinary_threat')?.object_id).toBe(
      'procedure.threat_roll',
    );
  });
});
