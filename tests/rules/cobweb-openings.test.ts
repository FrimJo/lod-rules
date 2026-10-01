import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.cobweb_opening.${suffix}`], inputs } as TestCase, corpus);
describe('Cobweb Covered Openings — rendered PDF103, printed101', () => {
  it('retains door placement and movement blocking', () => {
    expect(run('placement').state).toEqual({
      placed_like_door: true,
      blocks_movement_like_door: true,
    });
  });
  it.each(['weapon', 'torch', 'lockpick', 'force'])(
    'permits only weapon or torch attacks: %s',
    (implement) => {
      const state = run('clearing', { clearing_implement: implement }).state;
      const allowed = implement === 'weapon' || implement === 'torch';
      expect(state.clearing_automatically_succeeds === true).toBe(allowed);
      if (allowed)
        expect(state).toMatchObject({
          clearing_cost_ap: 2,
          threat_increase: 1,
          alert_roll_required: true,
        });
      expect(state).not.toHaveProperty('ap');
    },
  );
  it.each([
    [true, 8, false],
    [true, 9, true],
    [true, 10, true],
    [false, 10, false],
  ])('requires clearing and alert9–10: %s / %s', (cleared, roll, alerted) => {
    const state = run('alert', { clearing_completed: cleared, alert_roll: roll }).state;
    expect(state.spiders_alerted === true).toBe(alerted);
    if (alerted)
      expect(state).toMatchObject({
        spider_count_dice: '1d2',
        placement_tiles: 'tile being left or tile being entered',
        individual_placement_rolls: true,
      });
    expect(state).not.toHaveProperty('arrival_turn_action_ban');
  });
  it('binds the quest pointer to source rules with mapped provenance', () => {
    const rule = corpus.rules.find((x) => x.id === 'core.quest.spider_queen_tomb.doors');
    expect(rule?.dependencies?.map((x) => x.object_id)).toEqual([
      'core.cobweb_opening.placement',
      'core.cobweb_opening.clearing',
      'core.cobweb_opening.alert',
    ]);
    expect(corpus.rules.find((x) => x.id === 'core.cobweb_opening.alert')?.source[0]).toMatchObject(
      { pdf_page: 103, printed_page: 101 },
    );
  });
});
