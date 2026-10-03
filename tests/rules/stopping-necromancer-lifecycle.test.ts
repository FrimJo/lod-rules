import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((x) => x.procedure_id === 'procedure.rest')!;
const procedure = corpus.procedures.find((x) => x.id === 'procedure.stopping_necromancer')!;
const defaults: State = Object.fromEntries(
  Object.entries(procedure.fields).map(([key, field]) => [
    key,
    field.type === 'boolean' ? false : field.type === 'number' ? (field.minimum ?? 0) : '',
  ]),
);
const base: State = {
  ...defaults,
  phase: 'setup',
  instance_quest_id: 'quest.great_crypt.stopping_necromancer',
  necro_owner_matches: true,
  necro_hero_owner_matches: true,
  threat_roll_supplied: true,
  threat_die: 1,
  threat: 9,
  objective_room_entered: true,
  hero_in_objective_room: true,
  hit_result_supplied: true,
  actual_hit_event: 1,
  to_hit_roll: 89,
  next_action_is_actual: true,
  actual_next_action_spent_getting_up: true,
  actual_getting_up_attempt: 1,
  dex_result_matches_pending_attempt: true,
  reward_hero_eligible: true,
  coins: 100,
};
const run = (inputs: State) => runCase({ ...fixture, procedure_id: procedure.id, inputs }, corpus);
const room = () => run({ ...run(base).state, phase: 'objective_room' }).state;
describe('Stopping the Necromancer actual occurrence/hero checkpoints — PDF261', () => {
  it.each([1, 2, 3, 4, 5, 6])('initial d6%i is persisted once with source bounds', (threat_die) => {
    const first = run({ ...base, threat_die });
    expect(first.state).toMatchObject({
      threat: threat_die,
      necro_minimum_threat: threat_die,
      necro_maximum_threat: 20,
      location: 'No travel necessary',
      corridors: 7,
      rooms: 7,
      encounters: 'Undead',
      coins: 100,
    });
    expect(run({ ...first.state, threat: 18, threat_die: 6 }).state.threat).toBe(18);
  });
  it('missing initial die requests once, then resumes without reseeding setup', () => {
    const first = run({ ...base, threat_roll_supplied: false });
    expect(first.state.threat).toBe(9);
    expect(first.state.necro_threat_requested).toBe(true);
    expect(run(first.state).events).toEqual([]);
    expect(run({ ...first.state, threat_roll_supplied: true, threat_die: 4 }).state.threat).toBe(4);
  });
  it.each([
    { necro_owner_matches: false },
    { instance_quest_id: 'quest.great_crypt.family_heirloom' },
    { objective_room_entered: false },
    { necro_setup_processed: false },
    { necro_threat_processed: false },
  ] as State[])('wrong/incomplete actual room %j cannot place actors', (patch) => {
    expect(run({ ...run(base).state, phase: 'objective_room', ...patch }).state.zombies).toBe(0);
  });
  it('actual entry places once and requests external values without inventing them', () => {
    const state = room();
    expect(state).toMatchObject({
      ragnalf_position: 'far end of the room',
      zombies: 6,
      zombie_weapon: 'longswords',
      hero_entry: 'short side',
      zombie_formation: 'circle to protect Ragnalf',
      zombies_advance_toward_heroes: false,
      xp: 200,
      treasure_table: 'T4',
    });
    expect(run({ ...state, zombies: 3, ragnalf_position: 'moved' }).state).toMatchObject({
      zombies: 3,
      ragnalf_position: 'moved',
    });
    expect(state.zombie_hp).toBeUndefined();
  });
  it('source-owned modifier reports replay without accumulating or touching unrelated modifiers', () => {
    const first = run({ ...room(), phase: 'modifiers', other_cs_modifier: 7, total_cs: 80 });
    expect(first.state).toMatchObject({ necro_cs_contribution: -10, necro_rs_contribution: -10 });
    expect(run(first.state).state).toMatchObject({
      necro_cs_contribution: -10,
      other_cs_modifier: 7,
      total_cs: 80,
    });
    expect(run({ ...first.state, hero_in_objective_room: false }).state.necro_cs_contribution).toBe(
      0,
    );
  });
  it.each([89, 90, 100])('actual To Hit%i produces only source fall', (to_hit_roll) => {
    const hit = run({ ...room(), phase: 'hit', to_hit_roll });
    expect(hit.state.hero_fallen).toBe(to_hit_roll >= 90);
    expect(hit.state.next_action_getting_up_required).toBe(to_hit_roll >= 90);
    expect(run({ ...hit.state, hero_fallen: false, to_hit_roll: 100 }).state.hero_fallen).toBe(
      false,
    );
  });
  it.each([true, false])(
    'owned DEX success%s resolves once, failure stays fallen',
    (dex_test_succeeded) => {
      const fallen = run({ ...room(), phase: 'hit', to_hit_roll: 90 }).state;
      const result = run({
        ...fallen,
        phase: 'getting_up',
        dex_result_supplied: true,
        dex_test_succeeded,
      });
      expect(result.state).toMatchObject({
        hero_fallen: !dex_test_succeeded,
        getting_up_succeeded: dex_test_succeeded,
        necro_getting_up_pending: false,
        next_action_getting_up_required: false,
      });
      expect(run({ ...result.state, dex_test_succeeded: true }).state.hero_fallen).toBe(
        !dex_test_succeeded,
      );
    },
  );
  it('pending DEX cannot resolve for another hero/attempt or a delayed unrelated outcome', () => {
    const fallen = run({ ...room(), phase: 'hit', to_hit_roll: 100 }).state;
    const pending = run({ ...fallen, phase: 'getting_up' });
    expect(pending.state.necro_getting_up_pending).toBe(true);
    for (const patch of [
      { actual_getting_up_attempt: 2 },
      { necro_hero_owner_matches: false },
      { dex_result_matches_pending_attempt: false },
    ] as State[]) {
      expect(
        run({ ...pending.state, dex_result_supplied: true, dex_test_succeeded: true, ...patch })
          .state.hero_fallen,
      ).toBe(true);
    }
    expect(
      run({ ...pending.state, dex_result_supplied: true, dex_test_succeeded: true }).state
        .hero_fallen,
    ).toBe(false);
  });
  it('delayed DEX resolves the persisted spent action without rewriting a later action input', () => {
    const fallen = run({ ...room(), phase: 'hit', to_hit_roll: 90 }).state;
    const pending = run({ ...fallen, phase: 'getting_up' }).state;
    const result = run({
      ...pending,
      actual_next_action_spent_getting_up: false,
      next_action_is_actual: false,
      dex_result_supplied: true,
      dex_test_succeeded: true,
    });
    expect(result.state).toMatchObject({
      hero_fallen: false,
      getting_up_succeeded: true,
      actual_next_action_spent_getting_up: false,
      next_action_is_actual: false,
      next_action_spent_getting_up: false,
      necro_getting_up_pending: false,
    });
    expect(result.trace).toEqual([
      'procedure.stopping_necromancer',
      'core.quest.stopping_necromancer.zombie_protection',
      'core.quest.stopping_necromancer.getting_up_success',
    ]);
  });

  it('nonactual/incomplete next action cannot begin a getting-up test', () => {
    const fallen = run({ ...room(), phase: 'hit', to_hit_roll: 90 }).state;
    for (const patch of [
      { next_action_is_actual: false },
      { actual_next_action_spent_getting_up: false },
    ] as State[]) {
      expect(run({ ...fallen, phase: 'getting_up', ...patch }).state.necro_getting_up_pending).toBe(
        false,
      );
    }
  });
  it('actual death consequences and battle/XP/T4 handoff happen once without payment or inferred cleanup', () => {
    const first = run({
      ...room(),
      phase: 'death',
      ragnalf_dead: true,
      necro_cs_contribution: -10,
    });
    expect(first.state).toMatchObject({
      all_zombies_dead: true,
      corpse_floor_movement_stopped: true,
      coins: 100,
      necro_cs_contribution: -10,
    });
    expect(first.trace).toEqual([
      'procedure.stopping_necromancer',
      'core.quest.stopping_necromancer.ragnalf_death',
    ]);
    expect(first.events.filter((event) => event.type === 'invoke')).toHaveLength(1);
    expect(run(first.state).events).toEqual([]);
    expect(run(first.state).trace).toEqual(['procedure.stopping_necromancer']);
  });
  it.each([
    { ragnalf_dead: false },
    { necro_death_processed: false },
    { heroes_back_in_town: false },
    { reward_hero_eligible: false },
    { necro_hero_owner_matches: false },
    { necro_reward_processed: true },
  ] as State[])('payment rejects incomplete or replayed context%j', (patch) => {
    expect(
      run({
        ...room(),
        phase: 'reward',
        ragnalf_dead: true,
        necro_death_processed: true,
        heroes_back_in_town: true,
        ...patch,
      }).state.coins,
    ).toBe(100);
  });
  it('each actual eligible returned hero is paid once independently', () => {
    const dead = run({ ...room(), phase: 'death', ragnalf_dead: true }).state;
    const paid = run({ ...dead, phase: 'reward', heroes_back_in_town: true });
    expect(paid.state.coins).toBe(400);
    expect(paid.trace).toEqual([
      'procedure.stopping_necromancer',
      'core.quest.stopping_necromancer.reward',
    ]);
    expect(run(paid.state).state.coins).toBe(400);
    expect(
      run({ ...dead, phase: 'reward', heroes_back_in_town: true, coins: 20 }).state.coins,
    ).toBe(320);
  });
});
