import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const run = (suffix: string, inputs: State = {}) =>
  runCase({ rule_ids: [`core.quest.spider_queen_tomb.${suffix}`], inputs } as TestCase, corpus);
describe('Spider Queen Tomb — PDF241–242', () => {
  it('preserves the different room exclusions, C8 cobweb opening and Great Crypt', () => {
    expect(run('setup').state).toEqual({
      starting_tile: 'C8',
      starting_opening: 'Cobweb Opening at the far end',
      hero_positions: 'as you see fit',
      rooms: 7,
      excluded_rooms: 'R1, R9, R17',
      corridors: 7,
      excluded_corridor: 'C16',
      objective_room: 'The Great Crypt',
    });
  });
  it.each([true, false])(
    'selects mutually exclusive encounters from supplied parity without assuming die size: %s',
    (odd) => {
      const inputs: State = { encounter_die_odd: odd };
      const result = runCase(
        {
          rule_ids: [
            'core.quest.spider_queen_tomb.encounter_odd',
            'core.quest.spider_queen_tomb.encounter_even',
          ],
          inputs,
        } as TestCase,
        corpus,
      );
      expect(result.state.encounter_kind === 'Giant Spiders').toBe(odd);
      expect(result.state.encounter_list === 'Undead Encounter List').toBe(!odd);
      if (odd) expect(result.state.encounter_count_dice).toBe('1d3');
    },
  );
  it.each([
    [11, 12, true],
    [13, 12, false],
    [12, 12, false],
    [11, 13, false],
  ])('triggers only on an increase exactly to 12: %s -> %s', (previous, current, triggered) => {
    expect(
      run('threshold', { previous_threat: previous, current_threat: current }).state
        .wandering_monster_triggered === true,
    ).toBe(triggered);
  });
  it('places Belua beside the sarcophagus, short-side hero entry and cobweb doors', () => {
    expect(run('objective_setup').state).toEqual({
      belua_position: 'next to the sarcophagus',
      sarcophagus_position: 'far end of the room',
      hero_entry: 'short side of the room',
      sarcophagus_access_requires_belua_dead: true,
    });
    expect(run('doors').state.all_doors_cobweb_covered_openings).toBe(true);
  });
  it('transcribes every Belua cell including real dice damage and numeric RS0', () => {
    const t = corpus.tables.find((x) => x.id === 'table.quest.spider_queen_tomb.belua');
    expect(
      ['cs', 'rs', 'dmg', 'na', 'dex', 'to_hit', 'res', 'm', 'hp'].map(
        (x) => t?.rows[0]?.cells[x]?.printed,
      ),
    ).toEqual(['55', '0', '1d10+3', '3', '45', '-10', '55', '6', '85']);
    expect(t?.rows[0]?.cells.dmg).toMatchObject({
      type: 'dice',
      dice: { count: 1, sides: 10, modifier: 3 },
    });
    expect(run('belua').state).toEqual({
      enemy_kind: 'Gigantic Spider',
      terror: 5,
      poison: true,
      large: true,
      wall_climbing: false,
      xp: 1100,
      loot_printed: 'Part',
    });
  });
  it.each([4, 5, 6])('attempts CS55 summoning only on behaviour5–6: %s', (roll) => {
    const state = run('summon_attempt', { behaviour_roll: roll }).state;
    expect(state.summoning_attempt === true).toBe(roll >= 5);
    if (roll >= 5) expect(state.cs_test_value).toBe(55);
  });
  it.each([
    [4, true],
    [5, false],
    [5, true],
    [6, true],
  ])('requires behaviour and successful CS before summoning: %s / %s', (roll, success) => {
    const state = run('summon_success', {
      behaviour_roll: roll,
      belua_cs_test_succeeded: success,
    }).state;
    expect(state.summoned_giant_spiders === 1).toBe(roll >= 5 && success);
    if (roll >= 5 && success)
      expect(state).toMatchObject({
        summoned_spider_position: 'randomly in the room',
        summoned_spider_may_act_on_arrival_turn: false,
      });
  });
  it.each([true, false])(
    'requires Belua and every child slain for party sarcophagus findings: %s',
    (slain) => {
      const state = run('aftermath', { belua_and_children_slain: slain }).state;
      expect(state.sceptre_found === true).toBe(slain);
      if (slain)
        expect(state).toMatchObject({ coin_roll_expression: '4d100', wonderful_treasures: 3 });
      expect(state).not.toHaveProperty('coins');
    },
  );
  it.each([true, false])(
    'waives dungeon traversal after findings but still requires overland travel: %s',
    (done) => {
      const state = run('return', { sarcophagus_findings_done: done }).state;
      expect(state.dungeon_return_eventless === true).toBe(done);
      if (done)
        expect(state).toMatchObject({
          retrace_dungeon_not_required: true,
          overland_travel_required: true,
          reward_location: 'Whiteport',
        });
    },
  );
  it.each([true, false])(
    'requires completed Whiteport return for per-hero reward: %s',
    (returned) => {
      const state = run('reward', { campaign_return_completed_in_whiteport: returned }).state;
      expect(state.reward_per_hero === 1200).toBe(returned);
      expect(state).not.toHaveProperty('coins');
    },
  );
});
