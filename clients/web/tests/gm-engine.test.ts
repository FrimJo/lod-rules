import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diceRange, formatDice, parseDice, rollDice } from '../src/gm/dice.ts';
import {
  ambushRisk,
  encounterChance,
  initialState,
  isWavering,
  lightSummary,
  moraleStart,
  reduce,
  reduceAll,
  reviveState,
  type GmEvent,
  type GmState,
} from '../src/gm/engine.ts';

const party: GmEvent[] = [
  { type: 'hero_add', name: 'Maja', resolve: 45, nightVision: false },
  { type: 'hero_add', name: 'Torvald', resolve: 52, nightVision: true },
  { type: 'hero_add', name: 'Ilse', resolve: 38, nightVision: false },
];

function withParty(extra: GmEvent[] = []): GmState {
  return reduceAll(initialState(), [...party, ...extra]);
}

const hero = (state: GmState, name: string) => {
  const found = state.heroes.find((h) => h.name === name);
  assert.ok(found, `hero ${name}`);
  return found;
};
const prompts = (state: GmState) => state.pending.map((p) => p.request.kind);
const lastLog = (state: GmState) => state.log.at(-1)?.text ?? '';

test('dice notation parses, rolls and formats', () => {
  assert.deepEqual(parseDice('1d4+1'), { count: 1, sides: 4, modifier: 1 });
  assert.deepEqual(parseDice('2d6 - 1'), { count: 2, sides: 6, modifier: -1 });
  assert.deepEqual(parseDice('d20'), { count: 1, sides: 20, modifier: 0 });
  assert.equal(parseDice('six'), null);
  const expr = parseDice('1d6')!;
  assert.equal(rollDice(expr, () => 0), 1);
  assert.equal(rollDice(expr, () => 0.999), 6);
  assert.deepEqual(diceRange(parseDice('1d4+2')!), { min: 3, max: 6 });
  assert.equal(formatDice({ count: 1, sides: 4, modifier: 1 }), '1d4+1');
});

test('Party Morale start sums RES/10 rounded down plus the flat bonuses', () => {
  let state = withParty();
  assert.equal(moraleStart(state), 4 + 5 + 3);
  assert.equal(state.morale.current, 12);
  state = reduce(state, { type: 'set_morale', naturalLeader: true, powerstone: true });
  assert.equal(state.morale.start, 16);
  assert.equal(state.morale.current, 16, 'current follows start while untouched');
  state = reduce(state, { type: 'set_morale', startOverride: 10 });
  assert.equal(state.morale.start, 10);
  assert.equal(state.morale.current, 10);
});

test('the Scenario die waits for the first door', () => {
  let state = reduce(withParty(), { type: 'new_turn' });
  assert.equal(state.turn, 1);
  assert.deepEqual(prompts(state), []);
  state = reduceAll(state, [{ type: 'door_open', entrance: true }, { type: 'new_turn' }]);
  assert.equal(state.threat.level, 2, 'the entrance door adds no Threat');
  assert.ok(state.entrancePassed);
  assert.deepEqual(prompts(state), ['scenario_roll']);
});

test('a Scenario roll of 9 or 0 asks for a Threat roll, lower results do not', () => {
  const base = reduceAll(withParty(), [{ type: 'pass_entrance' }, { type: 'new_turn' }]);
  assert.deepEqual(prompts(reduce(base, { type: 'scenario_roll', value: 5 })), []);
  assert.deepEqual(prompts(reduce(base, { type: 'scenario_roll', value: 9 })), ['threat_roll']);
  assert.deepEqual(prompts(reduce(base, { type: 'scenario_roll', value: 10 })), ['threat_roll']);
});

test('a Jumpy hero adds +2 Threat on a Scenario roll of 0', () => {
  let state = reduceAll(withParty(), [{ type: 'pass_entrance' }, { type: 'set_threat', level: 5 }]);
  const maja = hero(state, 'Maja');
  state = reduceAll(state, [
    { type: 'sanity_loss', heroId: maja.id, amount: 8, reason: 'test' },
    { type: 'sanity_condition_roll', heroId: maja.id, value: 7 },
  ]);
  assert.deepEqual(hero(state, 'Maja').conditions, ['jumpy']);
  state = reduce(state, { type: 'scenario_roll', value: 10 });
  assert.equal(state.threat.level, 7);
  assert.equal(reduce(state, { type: 'scenario_roll', value: 4 }).threat.level, 7);
});

test('Threat roll: 20 lowers by 5 down to the floor, above Threat adds 1, at or below asks for the table', () => {
  const base = reduce(withParty(), { type: 'set_threat', level: 6 });
  const natural = reduce(base, { type: 'threat_roll', value: 20 });
  assert.equal(natural.threat.level, 2, '6 - 5 = 1 is below the floor of 2');
  assert.match(lastLog(natural), /never goes below 2/);
  const miss = reduce(base, { type: 'threat_roll', value: 15 });
  assert.equal(miss.threat.level, 7);
  assert.deepEqual(prompts(miss), []);
  const hit = reduce(base, { type: 'threat_roll', value: 6 });
  assert.equal(hit.threat.level, 6, 'the table decides the decrease');
  assert.deepEqual(prompts(hit), ['threat_table']);
  const resolved = reduce(hit, { type: 'threat_table_result', decrease: 3, event: 'Bats' });
  assert.equal(resolved.threat.level, 3);
  assert.deepEqual(prompts(resolved), []);
});

test('a Threat roll below Threat spends a torch and burns half a lantern; equal to Threat spends nothing', () => {
  const maja = hero(withParty(), 'Maja').id;
  const torvald = hero(withParty(), 'Torvald').id;
  let state = reduceAll(withParty(), [
    { type: 'set_threat', level: 10 },
    { type: 'set_spares', torches: 2, lampOil: 1 },
    { type: 'light_add', kind: 'torch', carrierId: maja, lit: true },
    { type: 'light_add', kind: 'lantern', carrierId: torvald, lit: true },
  ]);
  assert.equal(lightSummary(state).fearTerror, 5);
  assert.deepEqual(lightSummary(state).perception, { [maja]: 5, [torvald]: 10 });

  const equal = reduce(state, { type: 'threat_roll', value: 10 });
  assert.ok(equal.lights.every((l) => l.lit), 'equal to Threat is not below Threat');
  assert.deepEqual(prompts(equal), ['threat_table']);

  state = reduce(state, { type: 'threat_roll', value: 4 });
  const torch = state.lights.find((l) => l.kind === 'torch')!;
  const lantern = state.lights.find((l) => l.kind === 'lantern')!;
  assert.equal(torch.lit, false);
  assert.equal(torch.spent, true);
  assert.equal(lantern.lit, true);
  assert.equal(lantern.oilHalves, 1);
  assert.ok(prompts(state).includes('light_relight'));
  assert.equal(lightSummary(state).fearTerror, 5, 'the lantern still burns');

  state = reduce(state, { type: 'light_relight', id: torch.id });
  assert.equal(state.spares.torches, 1);
  assert.equal(state.lights.find((l) => l.kind === 'torch')!.lit, true);

  state = reduce(state, { type: 'threat_table_result', decrease: 0, event: 'nothing' });
  state = reduce(state, { type: 'threat_roll', value: 3 });
  const dry = state.lights.find((l) => l.kind === 'lantern')!;
  assert.equal(dry.lit, false);
  assert.equal(dry.oilHalves, 0);
  state = reduce(state, { type: 'light_refill', id: dry.id });
  assert.equal(state.spares.lampOil, 0);
  assert.equal(state.lights.find((l) => l.kind === 'lantern')!.oilHalves, 2);
  assert.equal(reduce(state, { type: 'light_refill', id: dry.id }).spares.lampOil, 0);
});

test('an unmodified attack roll of 90 or more puts a torch out; darkness is flagged when nothing burns', () => {
  let state = reduceAll(withParty(), [{ type: 'light_add', kind: 'torch', carrierId: null, lit: true }]);
  const id = state.lights[0]!.id;
  assert.equal(reduce(state, { type: 'light_attack_roll', id, roll: 89 }).lights[0]!.lit, true);
  state = reduce(state, { type: 'light_attack_roll', id, roll: 90 });
  assert.equal(state.lights[0]!.lit, false);
  assert.equal(lightSummary(state).fearTerror, 0);
  assert.match(lastLog(state), /No light source is lit/);
  assert.match(lastLog(reduce(state, { type: 'light_relight', id })), /No spare torches/);
});

test('a hit to the head costs 1 Sanity and destroys a headlamp', () => {
  let state = withParty();
  const torvald = hero(state, 'Torvald').id;
  state = reduce(state, { type: 'light_add', kind: 'headlamp', carrierId: torvald, lit: true });
  state = reduce(state, { type: 'hero_head_wound', id: torvald });
  assert.equal(hero(state, 'Torvald').sanity, 7);
  assert.equal(state.lights[0]!.destroyed, true);
  assert.equal(state.lights[0]!.lit, false);
});

test('quest thresholds place a Wandering Monster when Threat is increased to them', () => {
  let state = reduceAll(withParty(), [{ type: 'set_quest', questId: 'quest.dead_rising.highwaymen' }]);
  assert.deepEqual(state.threat, { enabled: true, level: 3, start: 3, min: 3, max: 18, thresholds: [10] });
  state = reduce(state, { type: 'set_threat', level: 9 });
  state = reduce(state, { type: 'threat_source', source: 'open_door' });
  assert.equal(state.threat.level, 10);
  assert.equal(state.wanderingMonsters, 1);
  assert.ok(state.pending.some((p) => p.request.kind === 'wandering_monster' && !('crossed' in p.request && p.request.crossed)));

  const crossed = reduceAll(withParty(), [
    { type: 'set_quest', questId: 'quest.dead_rising.highwaymen' },
    { type: 'set_threat', level: 9 },
    { type: 'threat_source', source: 'force_lock' },
  ]);
  assert.equal(crossed.threat.level, 11);
  assert.equal(crossed.wanderingMonsters, 0, 'crossing without landing is the Game Master’s call');
  assert.ok(crossed.pending.some((p) => p.request.kind === 'wandering_monster' && 'crossed' in p.request && p.request.crossed));

  const down = reduce(state, { type: 'threat_table_result', decrease: 2, event: 'x' });
  const backUp = reduce(down, { type: 'threat_source', source: 'force_lock' });
  assert.equal(backUp.threat.level, 10);
  assert.equal(backUp.wanderingMonsters, 2, 'decreasing below and increasing back to it places another');
});

test('Threat is capped at the quest maximum and a quest without Threat ignores changes', () => {
  let state = reduceAll(withParty(), [
    { type: 'set_quest', questId: 'quest.dead_rising.highwaymen' },
    { type: 'set_threat', level: 17 },
    { type: 'threat_source', source: 'force_lock' },
  ]);
  assert.equal(state.threat.level, 18);
  assert.match(lastLog(state), /quest maximum/);
  state = reduce(withParty(), { type: 'set_quest', questId: 'quest.dead_rising.burning_village' });
  assert.equal(state.threat.enabled, false);
  assert.equal(reduce(state, { type: 'threat_source', source: 'open_door' }).threat.level, state.threat.level);
});

test('a dice start Threat asks for the roll and the minimum follows it', () => {
  let state = reduce(withParty(), { type: 'set_quest', questId: 'quest.great_crypt.tomb_raiders' });
  assert.deepEqual(prompts(state), ['threat_start']);
  state = reduce(state, { type: 'set_threat', level: 4, reason: 'rolled 4' });
  assert.equal(state.threat.min, 4);
  assert.equal(state.threat.level, 4);
  assert.deepEqual(prompts(state), []);
  assert.equal(reduce(state, { type: 'threat_roll', value: 20 }).threat.level, 4);
});

test('sources without a printed amount ask the Game Master for it', () => {
  let state = reduce(withParty(), { type: 'threat_source', source: 'battle_won' });
  assert.deepEqual(prompts(state), ['threat_amount']);
  state = reduce(state, { type: 'threat_source', source: 'battle_won', amount: 2 });
  assert.equal(state.threat.level, 4);
  assert.deepEqual(prompts(state), []);
});

test('opening a door adds Threat and the encounter chance rises after four empty tiles', () => {
  let state = reduce(withParty(), { type: 'door_open' });
  assert.equal(state.threat.level, 3);
  assert.deepEqual(prompts(state), ['confirm']);
  for (let i = 0; i < 4; i += 1) state = reduce(state, { type: 'tile_revealed', kind: 'corridor', encounter: false });
  assert.equal(state.encounterStreak, 4);
  assert.equal(encounterChance('room', state.encounterStreak), 60);
  assert.equal(encounterChance('corridor', state.encounterStreak), 40);
  assert.equal(encounterChance('room', 0), 50);
  state = reduce(state, { type: 'tile_revealed', kind: 'room', encounter: true });
  assert.equal(state.encounterStreak, 0);
  assert.deepEqual(prompts(state), ['battle_start']);
});

test('morale events apply their printed effect and the linked Sanity loss', () => {
  let state = withParty();
  const maja = hero(state, 'Maja').id;
  state = reduce(state, { type: 'morale_event', event: 'fear', heroId: maja });
  assert.equal(state.morale.current, 11);
  assert.equal(hero(state, 'Maja').sanity, 7);
  state = reduce(state, { type: 'morale_event', event: 'terror', heroId: maja });
  assert.equal(state.morale.current, 9);
  assert.equal(hero(state, 'Maja').sanity, 5);
  state = reduce(state, { type: 'morale_event', event: 'trap', heroId: maja });
  assert.equal(hero(state, 'Maja').sanity, 3);
  state = reduce(state, { type: 'morale_event', event: 'zero_hp', heroId: maja });
  assert.equal(state.morale.current, 4);
  assert.deepEqual(hero(state, 'Maja').statuses, ['bleeding_out']);
  assert.equal(hero(state, 'Maja').sanity, 2);
  assert.ok(isWavering(state), '4 is below half of 12');
  state = reduce(state, { type: 'morale_event', event: 'wonderful_treasure' });
  assert.equal(state.morale.current, 7);
  assert.ok(!isWavering(state));
  state = reduce(state, { type: 'morale_event', event: 'poison_or_disease', heroId: maja, status: 'poisoned' });
  assert.ok(hero(state, 'Maja').statuses.includes('poisoned'));
  const miscast = reduce(state, { type: 'morale_event', event: 'miscast', heroId: maja });
  assert.equal(miscast.morale.current, 5);
  assert.equal(hero(miscast, 'Maja').sanity, 1, 'the designer ruling moves the loss to the Miscast table');
  assert.ok(miscast.pending.some((p) => /Miscast table/.test(p.title)));
});

test('Party Morale at 0 tells the party to flee; a hero death lowers the start value', () => {
  let state = reduce(withParty(), { type: 'set_morale', current: 5 });
  const ilse = hero(state, 'Ilse').id;
  state = reduce(state, { type: 'morale_event', event: 'hero_dies', heroId: ilse });
  assert.equal(state.morale.current, 0);
  assert.ok(hero(state, 'Ilse').dead);
  assert.equal(state.morale.start, 9, 'the dead hero no longer contributes');
  assert.ok(state.pending.some((p) => /flees/.test(p.title)));
});

test('reaching 0 Sanity asks for a mental condition; duplicates roll again and Sanity resets to 8 minus conditions', () => {
  let state = withParty();
  const ilse = hero(state, 'Ilse').id;
  state = reduce(state, { type: 'sanity_loss', heroId: ilse, amount: 9, reason: 'horror' });
  assert.equal(hero(state, 'Ilse').sanity, 0);
  assert.match(lastLog(state), /stops at 0/);
  assert.deepEqual(prompts(state), ['sanity_condition']);
  state = reduce(state, { type: 'sanity_condition_roll', heroId: ilse, value: 2 });
  assert.deepEqual(hero(state, 'Ilse').conditions, ['acute_stress']);
  assert.equal(hero(state, 'Ilse').sanity, 7);
  assert.equal(hero(state, 'Ilse').sanityMax, 7);
  assert.deepEqual(prompts(state), []);
  state = reduce(state, { type: 'sanity_loss', heroId: ilse, amount: 7, reason: 'more horror' });
  state = reduce(state, { type: 'sanity_condition_roll', heroId: ilse, value: 3 });
  assert.deepEqual(prompts(state), ['sanity_condition'], 'Acute Stress again: roll again');
  state = reduce(state, { type: 'sanity_condition_roll', heroId: ilse, value: 10 });
  assert.deepEqual(hero(state, 'Ilse').conditions, ['acute_stress', 'depression']);
  assert.equal(hero(state, 'Ilse').sanity, 6);
});

test('battles: demons cost morale and Sanity, Acute Stress adds Threat, a win asks for the increase', () => {
  let state = withParty();
  const ilse = hero(state, 'Ilse').id;
  state = reduceAll(state, [
    { type: 'sanity_loss', heroId: ilse, amount: 8, reason: 'x' },
    { type: 'sanity_condition_roll', heroId: ilse, value: 2 },
  ]);
  const turn = state.turn;
  state = reduce(state, { type: 'battle_start', demons: true });
  assert.equal(state.inBattle, true);
  assert.equal(state.turn, turn + 1, 'enemies placed: a new turn starts');
  assert.equal(state.threat.level, 3, 'Acute Stress: +1 Threat per battle');
  assert.equal(state.morale.current, 10);
  assert.equal(hero(state, 'Maja').sanity, 7);
  assert.equal(hero(state, 'Ilse').sanity, 6);
  state = reduce(state, { type: 'battle_end', won: true });
  assert.equal(state.inBattle, false);
  assert.deepEqual(prompts(state), ['threat_amount']);
});

test('a short rest costs a ration, heals morale up to the start value and risks an ambush', () => {
  let state = reduceAll(withParty(), [
    { type: 'pass_entrance' },
    { type: 'set_threat', level: 8 },
    { type: 'set_morale', current: 11 },
  ]);
  assert.match(lastLog(reduce(state, { type: 'rest_begin' })), /has none/);
  state = reduce(state, { type: 'set_rations', rations: 2 });
  state = reduce(state, { type: 'rest_begin' });
  assert.equal(state.rations, 1);
  assert.equal(state.restsTaken, 1);
  assert.equal(ambushRisk(8, 1), 13);
  const pending = state.pending.find((p) => p.request.kind === 'rest_resolve');
  assert.ok(pending && pending.request.kind === 'rest_resolve' && pending.request.risk === 13);
  state = reduce(state, { type: 'rest_resolve', interrupted: false, ambushRoll: 13, barred: false });
  assert.equal(state.morale.current, 12, '+2 capped at the start value of 12');
  assert.ok(prompts(state).includes('battle_start'), 'ambushed on a roll at or below the risk');
  assert.ok(prompts(state).includes('scenario_roll'), 'a rest also rolls the Scenario die');
  assert.equal(ambushRisk(8, 2), 23);
  assert.equal(ambushRisk(60, 3), 70);

  const interrupted = reduce(
    reduce(reduce(withParty(), { type: 'set_rations', rations: 1 }), { type: 'rest_begin' }),
    { type: 'rest_resolve', interrupted: true, barred: false },
  );
  assert.equal(interrupted.rations, 0, 'the food is still eaten');
  assert.deepEqual(prompts(interrupted), ['battle_start']);
});

test('a rest reminds the Game Master about bleeding and poisoned heroes', () => {
  let state = reduce(withParty(), { type: 'set_rations', rations: 1 });
  const maja = hero(state, 'Maja').id;
  const ilse = hero(state, 'Ilse').id;
  state = reduceAll(state, [
    { type: 'hero_status', id: maja, status: 'bleeding_out', on: true },
    { type: 'hero_status', id: ilse, status: 'poisoned', on: true },
    { type: 'rest_begin' },
    { type: 'rest_resolve', interrupted: false, ambushRoll: 99, barred: true },
  ]);
  assert.ok(state.pending.some((p) => /CON\+10/.test(p.title)));
  assert.ok(state.pending.some((p) => /Poison Tests/.test(p.title)));
});

test('Wandering Monster tokens are moved each new turn', () => {
  let state = reduceAll(withParty(), [{ type: 'wm_place' }, { type: 'new_turn' }]);
  assert.ok(state.pending.some((p) => p.key === 'wm-move'));
  state = reduce(state, { type: 'wm_remove' });
  assert.equal(state.wanderingMonsters, 0);
  assert.ok(!state.pending.some((p) => p.key === 'wm-move'));
});

test('persisted state is revived only when the shape matches', () => {
  const state = withParty();
  assert.deepEqual(reviveState(JSON.parse(JSON.stringify(state))), state);
  assert.deepEqual(reviveState({ version: 99 }), initialState());
  assert.deepEqual(reviveState('nonsense'), initialState());
});
