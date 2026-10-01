import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.dead_rising.${suffix}`], inputs } as TestCase, corpus);

describe('The Dead Rising second quest — rendered PDF 227–228', () => {
  it('preserves contact objective, Silver City and restricted tile pools', () => {
    expect(run('setup').state).toEqual({
      objective: 'make contact with Ulfric and his Brothers',
      location: 'Silver City',
      corridors: 5,
      excluded_corridor: 'C16',
      rooms: 5,
      room_pool: 'R2B–R8B only, randomised',
      encounters: 'Undead',
      objective_room: 'The Great Crypt',
    });
  });
  it.each([
    [9, 10, true],
    [11, 10, false],
    [10, 10, false],
    [9, 11, false],
  ])('retains directional Threat10 triggering %s → %s', (before, after, triggers) => {
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
  it('preserves six sarcophagi and flanking ordinary skeletons with bronze longswords and shields', () => {
    expect(run('objective_setup').state).toEqual({
      sarcophagi: 6,
      ulfric_placement: 'middle',
      skeletons: 2,
      skeleton_placement: 'on either side of Ulfric',
      skeleton_weapon: 'longsword',
      skeleton_sword_material: 'bronze',
      skeleton_shields: true,
    });
  });
  it('distinguishes printed and practical To Hit without silently correcting the stat block', () => {
    expect(run('ulfric').state).toEqual({
      undead: true,
      weapon: 'Warhammer',
      armour: 2,
      to_hit_printed: -10,
      to_hit_in_practice: -5,
      frenzy: true,
      cause_fear: 3,
      xp: 140,
      treasure_table: 'T2',
    });
    expect(
      corpus.rules.find((x) => x.id === 'core.quest.dead_rising.ulfric')?.dependencies,
    ).toContainEqual({
      key: 'tier_two_treasure',
      label: 'T2 Treasure Table',
      object_id: 'table.treasure.t2',
    });
  });
  it('permits the printed negative To Hit values in their declared output fields', () => {
    const rule = corpus.rules.find((x) => x.id === 'core.quest.dead_rising.ulfric')!;
    for (const key of ['to_hit_printed', 'to_hit_in_practice']) {
      expect(rule.fields[key]?.type).toBe('number');
      expect(rule.fields[key]?.minimum).toBeUndefined();
    }
  });
  it('preserves the per-hero advertised reward and unquantified aftermath promise', () => {
    expect(run('reward').state.reward_per_hero).toBe(150);
    const quest = corpus.entities.find((x) => x.id === 'quest.dead_rising.the_dead_rising')!;
    expect(quest.source_text).toContain('no numerical favour or additional reward is defined');
    expect(quest.rules).toHaveLength(5);
    for (const id of quest.rules)
      expect(corpus.rules.find((x) => x.id === id)).toMatchObject({
        type: 'scenario_rule',
        scope: 'quest',
        quest_id: quest.id,
      });
  });
  it('preserves the full Threat grid and numeric DMG1 in Ulfric’s full stat grid', () => {
    const threat = corpus.tables.find((x) => x.id === 'table.quest.dead_rising.threat')!;
    expect(threat.columns.map((x) => x.label)).toEqual([
      'Start Threat Level',
      'Min Threat Level',
      'Max Threat Level',
    ]);
    expect(threat.rows[0]?.cells).toEqual({
      start: { type: 'number', printed: '4', value: 4, meaning: 'value' },
      min: { type: 'number', printed: '4', value: 4, meaning: 'value' },
      max: { type: 'number', printed: '18', value: 18, meaning: 'value' },
    });
    const stats = corpus.tables.find((x) => x.id === 'table.quest.dead_rising.ulfric')!;
    expect(stats.columns.map((x) => x.label)).toEqual([
      'CS',
      'RS',
      'DMG',
      'NA',
      'DEX',
      'To Hit',
      'RES',
      'M',
      'HP',
    ]);
    expect(stats.rows[0]?.cells).toEqual({
      cs: { type: 'number', printed: '45', value: 45, meaning: 'value' },
      rs: { type: 'marker', printed: '-', meaning: 'not_specified' },
      dmg: { type: 'number', printed: '1', value: 1, meaning: 'value' },
      na: { type: 'number', printed: '1', value: 1, meaning: 'value' },
      dex: { type: 'number', printed: '30', value: 30, meaning: 'value' },
      to_hit: { type: 'number', printed: '-10', value: -10, meaning: 'value' },
      res: { type: 'number', printed: '35', value: 35, meaning: 'value' },
      m: { type: 'number', printed: '4', value: 4, meaning: 'value' },
      hp: { type: 'number', printed: '12', value: 12, meaning: 'value' },
    });
    expect(stats.footnotes).toContain('XP: 140, T2 Treasure Table.');
    expect(stats.source[0]).toMatchObject({ pdf_page: 228, printed_page: 226 });
  });
});
