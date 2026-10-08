import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diceRange, formatDice, parseDice, rollDice } from '../src/gm/dice.ts';
import {
  ambushRisk,
  encounterChance,
  encounterRolled,
  initialState,
  initiativeBag,
  isWavering,
  lightSummary,
  modeOf,
  moraleStart,
  reduce,
  reduceAll,
  reviveState,
  standingEffects,
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
  assert.equal(
    rollDice(expr, () => 0),
    1,
  );
  assert.equal(
    rollDice(expr, () => 0.999),
    6,
  );
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
  assert.ok(
    equal.lights.every((l) => l.lit),
    'equal to Threat is not below Threat',
  );
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
  let state = reduceAll(withParty(), [
    { type: 'light_add', kind: 'torch', carrierId: null, lit: true },
  ]);
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
  let state = reduceAll(withParty(), [
    { type: 'set_quest', questId: 'quest.dead_rising.highwaymen' },
  ]);
  assert.deepEqual(state.threat, {
    enabled: true,
    level: 3,
    start: 3,
    min: 3,
    max: 18,
    thresholds: [10],
  });
  state = reduce(state, { type: 'set_threat', level: 9 });
  state = reduce(state, { type: 'threat_source', source: 'open_door' });
  assert.equal(state.threat.level, 10);
  assert.equal(state.wanderingMonsters, 1);
  assert.ok(
    state.pending.some(
      (p) =>
        p.request.kind === 'wandering_monster' && !('crossed' in p.request && p.request.crossed),
    ),
  );

  const crossed = reduceAll(withParty(), [
    { type: 'set_quest', questId: 'quest.dead_rising.highwaymen' },
    { type: 'set_threat', level: 9 },
    { type: 'threat_source', source: 'force_lock' },
  ]);
  assert.equal(crossed.threat.level, 11);
  assert.equal(crossed.wanderingMonsters, 0, 'crossing without landing is the Game Master’s call');
  assert.ok(
    crossed.pending.some(
      (p) => p.request.kind === 'wandering_monster' && 'crossed' in p.request && p.request.crossed,
    ),
  );

  const down = reduce(state, { type: 'threat_table_result', decrease: 2, event: 'x' });
  const backUp = reduce(down, { type: 'threat_source', source: 'force_lock' });
  assert.equal(backUp.threat.level, 10);
  assert.equal(
    backUp.wanderingMonsters,
    2,
    'decreasing below and increasing back to it places another',
  );
});

test('reaching the quest maximum triggers a Wandering Monster and Threat is held there', () => {
  let state = reduceAll(withParty(), [
    { type: 'set_quest', questId: 'quest.dead_rising.highwaymen' },
    { type: 'set_threat', level: 17 },
    { type: 'threat_source', source: 'force_lock' },
  ]);
  assert.equal(state.threat.level, 18);
  assert.ok(state.log.some((l) => /quest maximum/.test(l.text)));
  assert.equal(state.wanderingMonsters, 1);
  assert.deepEqual(prompts(state), ['wandering_monster']);
  const held = reduce(state, { type: 'threat_source', source: 'open_door' });
  assert.equal(held.wanderingMonsters, 1, 'staying at the max does not trigger again');
  state = reduce(withParty(), { type: 'set_quest', questId: 'quest.dead_rising.burning_village' });
  assert.equal(state.threat.enabled, false);
  assert.equal(
    reduce(state, { type: 'threat_source', source: 'open_door' }).threat.level,
    state.threat.level,
  );
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
  let state = reduce(withParty(), { type: 'threat_source', source: 'custom' });
  assert.deepEqual(prompts(state), ['threat_amount']);
  state = reduce(state, { type: 'threat_source', source: 'custom', amount: 2 });
  assert.equal(state.threat.level, 4);
  assert.deepEqual(prompts(state), []);
});

test('opening a door adds Threat and the encounter chance rises after four empty tiles', () => {
  let state = reduce(withParty(), { type: 'door_open' });
  assert.equal(state.threat.level, 3);
  assert.deepEqual(prompts(state), ['door']);
  for (let i = 0; i < 4; i += 1)
    state = reduce(state, { type: 'tile_revealed', kind: 'corridor', encounter: false });
  assert.equal(state.encounterStreak, 4);
  assert.equal(encounterChance('room', state.encounterStreak), 60);
  assert.equal(encounterChance('corridor', state.encounterStreak), 40);
  assert.equal(encounterChance('room', 0), 50);
  state = reduce(state, { type: 'tile_revealed', kind: 'room', encounter: true });
  assert.equal(state.encounterStreak, 0);
  assert.deepEqual(prompts(state), ['battle_start']);
});

test('a tile roll at or under the encounter chance means enemies, and the outcome is kept', () => {
  assert.equal(encounterRolled('room', 0, 50), true);
  assert.equal(encounterRolled('room', 0, 51), false);
  assert.equal(encounterRolled('corridor', 4, 40), true);
  let state = reduce(withParty(), { type: 'tile_revealed', kind: 'corridor', roll: 72 });
  assert.deepEqual(state.lastTile, {
    kind: 'corridor',
    chance: 30,
    roll: 72,
    encounter: false,
    turn: 0,
  });
  assert.equal(state.encounterStreak, 1);
  assert.match(lastLog(state), /rolled 72 against 30%/);
  state = reduce(state, { type: 'tile_revealed', kind: 'room', roll: 50 });
  assert.equal(state.lastTile?.encounter, true);
  assert.equal(state.encounterStreak, 0);
  assert.deepEqual(prompts(state), ['battle_start']);
  state = reduce(state, { type: 'tile_revealed', kind: 'room', encounter: true });
  assert.equal(state.lastTile?.roll, null, 'a declared outcome records no roll');
});

test('the turn sequence step is clamped and resets on a new turn', () => {
  let state = reduce(withParty(), { type: 'new_turn' });
  assert.equal(state.turnStep, 0);
  const logBefore = state.log.length;
  state = reduce(state, { type: 'turn_step', step: 3 });
  assert.equal(state.turnStep, 3);
  assert.equal(state.log.length, logBefore, 'stepping is not logged');
  state = reduce(state, { type: 'turn_step', step: 99 });
  assert.equal(state.turnStep, 4);
  state = reduce(state, { type: 'turn_step', step: -1 });
  assert.equal(state.turnStep, 0);
  const same = reduce(state, { type: 'turn_step', step: 0 });
  assert.equal(same, state, 'no change returns the same state');
  state = reduce(reduce(state, { type: 'turn_step', step: 4 }), { type: 'new_turn' });
  assert.equal(state.turn, 2);
  assert.equal(state.turnStep, 0);
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
  state = reduce(state, {
    type: 'morale_event',
    event: 'poison_or_disease',
    heroId: maja,
    status: 'poisoned',
  });
  assert.ok(hero(state, 'Maja').statuses.includes('poisoned'));
  const miscast = reduce(state, { type: 'morale_event', event: 'miscast', heroId: maja });
  assert.equal(miscast.morale.current, 5);
  assert.equal(
    hero(miscast, 'Maja').sanity,
    1,
    'the designer ruling moves the loss to the Miscast table',
  );
  assert.ok(miscast.pending.some((p) => /Miscast table/.test(p.title)));
});

test('Party Morale at 0 tells the party to flee; a hero death applies the ruled -5 and keeps the start value', () => {
  let state = reduce(withParty(), { type: 'set_morale', current: 5 });
  const ilse = hero(state, 'Ilse').id;
  state = reduce(state, { type: 'morale_event', event: 'hero_dies', heroId: ilse });
  assert.equal(state.morale.current, 0);
  assert.ok(hero(state, 'Ilse').dead);
  assert.equal(state.morale.start, 12, 'the start value is given once; the book does not lower it');
  assert.ok(state.log.some((l) => /changelog 2.21\): -5, not the printed -6/.test(l.text)));
  assert.ok(state.pending.some((p) => /flees/.test(p.title)));
  const full = reduce(withParty(), { type: 'morale_event', event: 'hero_dies', heroId: ilse });
  assert.equal(full.morale.current, 7, '12 - 5');
  assert.ok(
    isWavering(reduce(full, { type: 'morale_adjust', delta: -2, reason: 'x' })),
    'wavering is judged against the kept start',
  );
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

test('battles: demons cost morale and Sanity, Acute Stress adds Threat, a win adds 1 Threat', () => {
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
  assert.equal(state.threat.level, 4, 'the party wins a battle: +1 Threat');
  assert.deepEqual(prompts(state), []);
  assert.equal(
    reduce(reduce(state, { type: 'battle_start', demons: false }), {
      type: 'battle_end',
      won: false,
    }).threat.level,
    5,
  );
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
  state = reduce(state, {
    type: 'rest_resolve',
    interrupted: false,
    ambushRoll: 13,
    barred: false,
  });
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

test('the Threat table roll carries the row out: Wandering Monster, encounter risk, trap, Scenario bonus', () => {
  const base = reduceAll(withParty(), [
    { type: 'set_threat', level: 12 },
    { type: 'threat_roll', value: 10 },
  ]);
  assert.deepEqual(prompts(base), ['threat_table']);

  const monster = reduce(base, { type: 'threat_table_roll', value: 7 });
  assert.equal(monster.wanderingMonsters, 1);
  assert.equal(monster.threat.level, 7, '12 - 5');
  assert.deepEqual(prompts(monster), ['confirm']);
  assert.ok(monster.log.some((l) => /A Wandering Monster has appeared/.test(l.text)));

  const risk = reduce(base, { type: 'threat_table_roll', value: 16 });
  assert.equal(risk.encounterBonus, 10);
  assert.equal(risk.threat.level, 6, '12 - 6');
  assert.equal(encounterChance('room', 0, risk.encounterBonus), 60);
  assert.equal(encounterChance('corridor', 4, 30), 70, 'capped at 70');
  const twice = reduceAll(risk, [
    { type: 'threat_roll', value: 1 },
    { type: 'threat_table_roll', value: 17 },
  ]);
  assert.equal(twice.encounterBonus, 20, 'cumulative');

  let trap = reduce(base, { type: 'threat_table_roll', value: 18 });
  assert.deepEqual(prompts(trap), ['trap']);
  assert.equal(trap.threat.level, 5, '12 - 7');
  const maja = hero(trap, 'Maja');
  trap = reduce(trap, { type: 'trap_resolve', heroId: maja.id, triggered: true });
  assert.deepEqual(prompts(trap), []);
  assert.equal(trap.morale.current, 11, 'springing a trap: -1 Party Morale');
  assert.equal(hero(trap, 'Maja').sanity, 6, 'springing a trap: -2 Sanity');
  const avoided = reduce(reduce(base, { type: 'threat_table_roll', value: 19 }), {
    type: 'trap_resolve',
    heroId: maja.id,
    triggered: false,
  });
  assert.equal(avoided.morale.current, 12);
  assert.match(lastLog(avoided), /not set off/);

  let bonus = reduce(base, { type: 'threat_table_roll', value: 20 });
  assert.equal(bonus.scenarioBonus, 1);
  assert.equal(bonus.threat.level, 2, '12 - 10');
  bonus = reduceAll(bonus, [
    { type: 'pass_entrance' },
    { type: 'set_threat', level: 12 },
    { type: 'new_turn' },
  ]);
  assert.deepEqual(
    prompts(reduce(bonus, { type: 'scenario_roll', value: 8 })),
    ['threat_roll'],
    '8 + 1 = 9 triggers',
  );
  assert.deepEqual(prompts(reduce(bonus, { type: 'scenario_roll', value: 7 })), []);
  const again = reduceAll(bonus, [
    { type: 'threat_roll', value: 2 },
    { type: 'threat_table_roll', value: 20 },
  ]);
  assert.equal(again.scenarioBonus, 1, 'only once');
  assert.ok(again.log.some((l) => /can only happen once/.test(l.text)));
});

test('in battle the 1d10 table applies the decrease and asks the Game Master to carry the text out', () => {
  let state = reduceAll(withParty(), [
    { type: 'set_threat', level: 10 },
    { type: 'battle_start', demons: false },
    { type: 'threat_roll', value: 5 },
  ]);
  const open = state.pending.find((p) => p.request.kind === 'threat_table')!;
  assert.equal(open.request.kind === 'threat_table' && open.request.inBattle, true);
  assert.equal(
    reduce(state, { type: 'threat_table_roll', value: 11 }).threat.level,
    10,
    'off the 1d10 table: nothing happens',
  );
  state = reduce(state, { type: 'threat_table_roll', value: 9 });
  assert.equal(state.threat.level, 6, '10 - 4 for Reinforcements');
  assert.deepEqual(prompts(state), ['confirm']);
  assert.match(state.pending[0]!.title, /Reinforcements/);
  assert.match(state.pending[0]!.detail ?? '', /Roll on the Encounter Table/);
});

test('a door roll reads the d6 for a trap and the d10 on the Door Table; a chest ends with the treasure table', () => {
  let state = reduce(withParty(), { type: 'door_open' });
  state = reduce(state, { type: 'door_roll', d10: 8, d6: 6 });
  const door = state.pending.find((p) => p.request.kind === 'door')!;
  assert.ok(door.request.kind === 'door');
  assert.deepEqual(door.request.rolled, {
    d10: 8,
    d6: 6,
    trapped: true,
    locked: true,
    difficulty: 'Pick lock: -10, HP 15',
  });
  assert.ok(state.log.some((l) => /Trapped door/.test(l.text)));
  assert.ok(state.log.some((l) => /\+2 Threat per attempt/.test(l.text)));
  assert.deepEqual(prompts(state), ['door', 'trap'], 'a trapped door asks for the Perception roll');
  state = reduce(state, { type: 'trap_resolve', heroId: null, triggered: false });
  state = reduce(state, { type: 'tile_revealed', kind: 'room', encounter: false });
  assert.deepEqual(prompts(state), [], 'placing the tile closes the door card');

  let chest = reduce(withParty(), { type: 'door_open', chest: true });
  assert.equal(chest.threat.level, 3);
  chest = reduce(chest, { type: 'door_roll', d10: 3, d6: 2 });
  assert.deepEqual(prompts(chest), ['chest']);
  assert.match(chest.pending[0]!.detail ?? '', /Chest table/);
});

test('a chest roll reads the Chest table, names the Treasure Cards and lifts Party Morale per treasure', () => {
  let chest = reduce(withParty(), { type: 'door_open', chest: true });
  chest = reduce(chest, { type: 'door_roll', d10: 3, d6: 2 });
  const morale = chest.morale.current;
  chest = reduce(chest, { type: 'chest_roll', table: 'chest', d10: 3 });
  const card = chest.pending.find((p) => p.request.kind === 'chest')!;
  assert.ok(card.request.kind === 'chest');
  assert.deepEqual(card.request.rolled, { table: 'chest', d10: 3, rowId: 'row_2' });
  assert.match(card.title, /2 Fine Treasure Cards/);
  assert.equal(chest.morale.current, morale + 2, 'two Fine Treasures, +1 each');
  assert.ok(chest.log.some((l) => /Chest: d10 3: 2 Fine Treasures\./.test(l.text)));
  const again = reduce(chest, { type: 'chest_roll', table: 'chest', d10: 1 });
  assert.equal(again, chest, 'a chest is rolled once');

  let empty = reduce(withParty(), { type: 'door_open', chest: true });
  empty = reduce(empty, { type: 'door_roll', d10: 3, d6: 2 });
  const before = empty.morale.current;
  empty = reduce(empty, { type: 'chest_roll', table: 'chest', d10: 10 });
  assert.equal(empty.morale.current, before);
  assert.match(empty.pending.find((p) => p.request.kind === 'chest')!.title, /empty/);

  let objective = reduce(withParty(), { type: 'door_open', chest: true });
  objective = reduce(objective, { type: 'door_roll', d10: 3, d6: 2 });
  const start = objective.morale.current;
  objective = reduce(objective, { type: 'chest_roll', table: 'objective_chest', d10: 2 });
  assert.match(
    objective.pending.find((p) => p.request.kind === 'chest')!.title,
    /1 Fine Treasure Card and 2 Wonderful Treasure Cards/,
  );
  assert.equal(objective.morale.current, start + 1 + 2 * 3);
});

test('the initiative bag counts hero and enemy tokens from the printed bonuses', () => {
  let state = withParty();
  assert.deepEqual(initiativeBag(state, { enemies: 3 }), {
    heroTokens: 3,
    enemyTokens: 3,
    notes: [],
  });
  const bashed = initiativeBag(state, {
    enemies: 3,
    bashedDoor: true,
    named: 1,
    perfectHearing: 'enemies',
    overwatch: 1,
  });
  assert.equal(bashed.heroTokens, 2);
  assert.equal(bashed.enemyTokens, 3 + 1 + 2 + 1);
  assert.equal(initiativeBag(state, { enemies: 2, restAmbush: true }).enemyTokens, 5);
  assert.equal(initiativeBag(state, { enemies: 2, perfectHearing: 'both' }).heroTokens, 3);
  const maja = hero(state, 'Maja');
  state = reduce(state, { type: 'hero_status', id: maja.id, status: 'bleeding_out', on: true });
  assert.equal(
    initiativeBag(state, { enemies: 1 }).heroTokens,
    2,
    'a knocked-out hero puts no token in',
  );
  state = reduce(state, {
    type: 'battle_start',
    demons: false,
    bag: { enemies: 4, bashedDoor: true },
  });
  assert.ok(state.log.some((l) => /2 hero tokens and 6 enemy tokens/.test(l.text)));
  assert.equal(state.turnStep, 1, 'a battle starts in the acting step');
});

test('in battle a new turn is a combat round and the Scenario die is rolled when the bag is empty', () => {
  let state = reduceAll(withParty(), [
    { type: 'pass_entrance' },
    { type: 'battle_start', demons: false },
  ]);
  assert.deepEqual(prompts(state), [], 'no Scenario die when the enemies are placed');
  state = reduce(state, { type: 'new_turn' });
  assert.deepEqual(prompts(state), ['scenario_roll']);
  assert.match(state.pending[0]!.title, /Last token drawn/);
  assert.equal(modeOf(state), 'battle');
  assert.equal(modeOf(reduce(state, { type: 'battle_end', won: true })), 'explore');
  assert.equal(modeOf(withParty()), 'prepare');
});

test('reaching 0 HP also asks for the permanent injury and warns when everyone is down', () => {
  let state = withParty();
  const [maja, torvald, ilse] = state.heroes.map((h) => h.id);
  state = reduce(state, { type: 'morale_event', event: 'zero_hp', heroId: maja });
  assert.ok(state.pending.some((p) => /permanent injury/.test(p.title)));
  assert.ok(!state.log.some((l) => /quest is lost/.test(l.text)));
  state = reduceAll(state, [
    { type: 'morale_event', event: 'zero_hp', heroId: torvald! },
    { type: 'morale_event', event: 'zero_hp', heroId: ilse! },
  ]);
  assert.ok(state.log.some((l) => /quest is lost/.test(l.text)));
});

test('a new dungeon level resets Threat to the start value and says the book leaves the value open', () => {
  let state = reduceAll(withParty(), [
    { type: 'set_quest', questId: 'quest.dead_rising.highwaymen' },
    { type: 'set_threat', level: 11 },
  ]);
  state = reduce(state, { type: 'new_level' });
  assert.equal(state.dungeonLevel, 2);
  assert.equal(state.threat.level, 11, 'set_threat makes 11 the start; nothing to reset');
  state = reduceAll(state, [
    { type: 'threat_source', source: 'force_lock' },
    { type: 'new_level' },
  ]);
  assert.equal(state.dungeonLevel, 3);
  assert.equal(state.threat.level, 11);
  assert.match(lastLog(state), /not to what value/);
});

test('standing effects list the modifiers that are easy to forget', () => {
  let state = withParty();
  assert.deepEqual(standingEffects(state), []);
  state = reduceAll(state, [
    { type: 'set_threat', level: 12 },
    { type: 'threat_roll', value: 1 },
    { type: 'threat_table_roll', value: 16 },
    { type: 'morale_event', event: 'dwarven_ale' },
    { type: 'set_morale', current: 3 },
  ]);
  const ids = standingEffects(state).map((e) => e.id);
  assert.deepEqual(ids, ['encounter-bonus', 'wavering', 'dwarven-ale']);
  const maja = hero(state, 'Maja');
  state = reduceAll(state, [
    { type: 'sanity_loss', heroId: maja.id, amount: 8, reason: 'test' },
    { type: 'sanity_condition_roll', heroId: maja.id, value: 2 },
  ]);
  assert.ok(standingEffects(state).some((e) => e.label === 'Maja: Acute Stress'));
});

test('a version 1 table carries over with the new fields at their defaults', () => {
  const old = { ...withParty(), version: 1 } as unknown as { [key: string]: unknown };
  delete old['encounterBonus'];
  delete old['scenarioBonus'];
  delete old['dungeonLevel'];
  const revived = reviveState(JSON.parse(JSON.stringify(old)));
  assert.equal(revived.version, 2);
  assert.equal(revived.heroes.length, 3);
  assert.equal(revived.encounterBonus, 0);
  assert.equal(revived.scenarioBonus, 0);
  assert.equal(revived.dungeonLevel, 1);
});

test('dismissing the rest prompt leaves rest mode; "No quest" restores the book defaults', () => {
  let state = reduceAll(withParty(), [{ type: 'set_rations', rations: 2 }, { type: 'rest_begin' }]);
  assert.equal(modeOf(reduce(state, { type: 'new_turn' })), 'rest');
  const rest = state.pending.find((p) => p.request.kind === 'rest_resolve')!;
  state = reduce(state, { type: 'dismiss_prompt', id: rest.id });
  assert.equal(state.resting, false);
  assert.equal(modeOf(reduce(state, { type: 'new_turn' })), 'explore');

  let quest = reduce(withParty(), {
    type: 'set_quest',
    questId: 'quest.dead_rising.burning_village',
  });
  assert.equal(quest.threat.enabled, false);
  quest = reduce(quest, { type: 'set_quest', questId: null });
  assert.deepEqual(quest.threat, {
    ...quest.threat,
    enabled: true,
    min: null,
    max: null,
    thresholds: [],
  });
  assert.equal(quest.scenarioEnabled, true);
});

test('Jumpy and the Speed note read the die itself, not the result after the +1', () => {
  let state = reduceAll(withParty(), [
    { type: 'pass_entrance' },
    { type: 'set_threat', level: 12 },
    { type: 'threat_roll', value: 1 },
    { type: 'threat_table_roll', value: 20 },
  ]);
  assert.equal(state.scenarioBonus, 1);
  const maja = hero(state, 'Maja').id;
  state = reduceAll(state, [
    { type: 'sanity_loss', heroId: maja, amount: 8, reason: 'test' },
    { type: 'sanity_condition_roll', heroId: maja, value: 7 },
    { type: 'new_turn' },
  ]);
  const before = state.threat.level;
  const nine = reduce(state, { type: 'scenario_roll', value: 9 });
  assert.equal(nine.threat.level, before, 'a 9 that reads 10 with the bonus is not a 0 face');
  assert.deepEqual(prompts(nine), ['threat_roll']);
  const zero = reduce(state, { type: 'scenario_roll', value: 10 });
  assert.equal(zero.threat.level, before + 2);
  assert.match(
    zero.log.find((l) => /Scenario die: 0/.test(l.text))?.text ?? '',
    /Speed spell ends/,
  );
  assert.equal(zero.scenarioTurn, zero.turn);
  const dismissed = reduce(state, { type: 'dismiss_prompt', id: state.pending[0]!.id });
  assert.notEqual(dismissed.scenarioTurn, dismissed.turn);
  assert.deepEqual(prompts(reduce(dismissed, { type: 'scenario_request' })), ['scenario_roll']);
});

test("a trapped door asks for the opener's Perception roll and carries the trap out", () => {
  let state = reduceAll(withParty(), [{ type: 'door_open' }, { type: 'door_roll', d10: 2, d6: 6 }]);
  assert.deepEqual(prompts(state), ['door', 'trap']);
  const trap = state.pending.find((p) => p.request.kind === 'trap')!;
  assert.equal(trap.request.kind === 'trap' && trap.request.source, 'door');
  const maja = hero(state, 'Maja').id;
  state = reduce(state, { type: 'trap_resolve', heroId: maja, triggered: true });
  assert.equal(hero(state, 'Maja').sanity, 6);
  assert.equal(state.morale.current, 11);
  assert.deepEqual(prompts(state), ['door']);
});

test('bleeding heroes after a battle or rest are bandaged back up or die; a barred rest ambush says so', () => {
  let state = withParty();
  const [maja, torvald] = state.heroes.map((h) => h.id) as [string, string, string];
  state = reduceAll(state, [
    { type: 'battle_start', demons: false },
    { type: 'morale_event', event: 'zero_hp', heroId: maja },
    { type: 'morale_event', event: 'zero_hp', heroId: torvald },
    { type: 'battle_end', won: true },
  ]);
  const bleeding = state.pending.find((p) => p.request.kind === 'bleeding')!;
  assert.deepEqual(bleeding.request.kind === 'bleeding' && bleeding.request.heroIds, [
    maja,
    torvald,
  ]);
  state = reduce(state, { type: 'hero_recover', id: maja });
  assert.ok(!hero(state, 'Maja').statuses.includes('bleeding_out'));
  const left = state.pending.find((p) => p.request.kind === 'bleeding')!;
  assert.deepEqual(left.request.kind === 'bleeding' && left.request.heroIds, [torvald]);
  state = reduce(state, { type: 'morale_event', event: 'hero_dies', heroId: torvald });
  assert.ok(hero(state, 'Torvald').dead);

  let rest = reduceAll(withParty(), [
    { type: 'set_rations', rations: 1 },
    { type: 'morale_event', event: 'zero_hp', heroId: maja },
    { type: 'set_threat', level: 20 },
    { type: 'rest_begin' },
    { type: 'rest_resolve', interrupted: false, ambushRoll: 1, barred: true },
  ]);
  assert.ok(
    rest.pending.some((p) => p.request.kind === 'bleeding' && p.request.context === 'rest'),
  );
  const ambush = rest.pending.find((p) => p.request.kind === 'battle_start')!;
  assert.equal(ambush.request.kind === 'battle_start' && ambush.request.barred, true);
  assert.equal(initiativeBag(rest, { enemies: 2, restAmbush: false }).enemyTokens, 2);
});

test('a dismissed mental condition prompt can be asked for again while Sanity is 0', () => {
  let state = withParty();
  const ilse = hero(state, 'Ilse').id;
  state = reduce(state, { type: 'sanity_loss', heroId: ilse, amount: 8, reason: 'horror' });
  state = reduce(state, { type: 'dismiss_prompt', id: state.pending[0]!.id });
  assert.deepEqual(prompts(state), []);
  state = reduce(state, { type: 'sanity_condition_request', heroId: ilse });
  assert.deepEqual(prompts(state), ['sanity_condition']);
  assert.equal(
    reduce(state, { type: 'sanity_condition_request', heroId: ilse }),
    state,
    'no duplicate prompt',
  );
});
