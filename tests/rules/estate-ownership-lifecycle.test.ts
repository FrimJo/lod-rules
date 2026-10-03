import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';
const corpus = readPilot();
const fixture = corpus.testCases.find((x) => x.procedure_id === 'procedure.rest')!;
const defaults = (id: string): State =>
  Object.fromEntries(
    Object.entries(corpus.procedures.find((x) => x.id === id)!.fields).map(([n, f]) => [
      n,
      f.type === 'boolean' ? false : f.type === 'number' ? (f.minimum ?? 0) : '',
    ]),
  );
const run = (inputs: State, id = 'procedure.estate_ownership') =>
  runCase({ ...fixture, procedure_id: id, inputs }, corpus);
const base: State = {
  ...defaults('procedure.estate_ownership'),
  phase: 'purchase',
  party_id: 'party-a',
  location: 'Silver City',
  coins: 4100,
  actual_purchase: true,
  actual_at_estate: true,
  stay_id: 'stay-a',
  stay_sequence: 1,
  visit_id: 3,
  day: 0,
  hero_id: 'hero-a',
  transfer_sequence: 1,
};
const purchased = () => run(base).state;
const stay = () =>
  run({ ...purchased(), phase: 'stay', actual_stay: true, between_quests: true }).state;
const result = (s: State): State => ({
  ...s,
  phase: 'rest_result',
  rest_completed: true,
  result_party_id: 'party-a',
  result_stay_id: 'stay-a',
  result_hero_id: 'hero-a',
  result_visit_id: 3,
  result_day: 0,
  result_hero_recovery_day: 0,
});
describe('Estate actual party ownership, payment, lodging and storage — PDF160', () => {
  it('pays 4000 once and persists owner; replay cannot charge again', () => {
    const x = run(base);
    expect(x.state).toMatchObject({ coins: 100, estate_key: true, estate_party_id: 'party-a' });
    expect(x.trace).toContain('character.settlement.estate.purchase');
    expect(run(x.state).state.coins).toBe(100);
  });
  it.each<State>([
    { coins: 3999 },
    { location: 'Whiteport' },
    { actual_purchase: false },
    { party_id: '' },
  ] as State[])('rejects invalid purchase %j', (patch) => {
    const x = run({ ...base, ...patch });
    expect(x.state.estate_key).toBe(false);
    expect(x.state.coins).toBe(patch.coins ?? 4100);
  });
  it('persists pending stay and hero; another stay cannot replace unresolved recovery', () => {
    const x = stay();
    expect(x).toMatchObject({
      pending_stay_id: 'stay-a',
      pending_stay_hero: 'hero-a',
      pending_visit_id: 3,
      pending_day: 0,
      coins: 100,
      lodging_completed: false,
    });
    expect(
      run({ ...x, stay_id: 'stay-b', hero_id: 'hero-b', stay_sequence: 2 }).state.pending_stay_id,
    ).toBe('stay-a');
    expect(run(x).events).toEqual([]);
  });
  it.each<State>([
    { result_party_id: 'party-b' },
    { result_stay_id: 'stay-b' },
    { result_hero_id: 'hero-b' },
    { result_visit_id: 4 },
    { result_day: 1 },
    { result_hero_recovery_day: -1 },
    { rest_completed: false },
  ] as State[])('rejects wrong or incomplete actual recovery %j', (patch) => {
    expect(run({ ...result(stay()), ...patch }).state.lodging_completed).toBe(false);
  });
  it('executes actual estate overnight and recovery before consuming the owned completed result', () => {
    const s = stay();
    const id = 'procedure.settlement_activities_and_overnight';
    const night = run(
      {
        ...defaults(id),
        phase: 'overnight',
        party_id: 'party-a',
        hero_id: 'hero-a',
        visit_id: 3,
        hero_visit_id: 3,
        party_visit_id: 3,
        day: 0,
        lodging_day: -1,
        hero_recovery_day: -1,
        estate_owned: true,
        lodging_choice: 'estate',
        coins: 100,
        hit_points: 10,
        maximum_hit_points: 30,
        mana: 1,
        maximum_mana: 20,
        energy: 1,
        maximum_energy: 5,
        luck: 0,
        maximum_luck: 3,
        hp_roll: 7,
      },
      id,
    );
    expect(night.state).toMatchObject({ lodging_kind: 'estate', lodging_day: 0, coins: 100 });
    const recovery = run({ ...night.state, phase: 'recover' }, id);
    expect(recovery.state).toMatchObject({
      hit_points: 17,
      mana: 20,
      energy: 5,
      luck: 3,
      hero_recovery_day: 0,
    });
    const done = run({
      ...result(s),
      result_party_id: recovery.state.party_id!,
      result_hero_id: recovery.state.hero_id!,
      result_visit_id: recovery.state.visit_id!,
      result_day: recovery.state.day!,
      result_hero_recovery_day: recovery.state.hero_recovery_day!,
      hit_points: recovery.state.hit_points!,
      energy: recovery.state.energy!,
    });
    expect(done.state).toMatchObject({
      lodging_completed: true,
      completed_stay_sequence: 1,
      hit_points: 17,
      energy: 5,
      coins: 100,
    });
    expect(run(done.state).state.hit_points).toBe(17);
    expect(run({ ...done.state, phase: 'stay', stay_sequence: 1 }).events).toEqual([]);
  });
  it.each<State>([
    { party_id: 'party-b' },
    { estate_key: false },
    { between_quests: false },
    { actual_stay: false },
    { actual_at_estate: false },
  ] as State[])('rejects invalid lodging %j', (patch) => {
    expect(
      run({ ...purchased(), phase: 'stay', actual_stay: true, between_quests: true, ...patch })
        .events,
    ).toEqual([]);
  });
  it('sequences owned physical-item transfers; old deposits and remote retrieval cannot replay', () => {
    const stored = run({
      ...purchased(),
      phase: 'store',
      between_quests: true,
      actual_storage: true,
      item_id: 'axe-a',
      transaction_id: 'deposit-a',
    }).state;
    expect(stored).toMatchObject({
      item_stored: true,
      storage_item_id: 'axe-a',
      last_transfer_sequence: 1,
    });
    const retrieve = { ...stored, phase: 'retrieve', actual_retrieval: true, transfer_sequence: 2 };
    const invalidTransfers: State[] = [
      { item_id: 'axe-b' },
      { party_id: 'party-b' },
      { actual_at_estate: false },
      { transfer_sequence: 4 },
    ];
    for (const patch of invalidTransfers)
      expect(run({ ...retrieve, ...patch }).state.item_stored).toBe(true);
    const taken = run(retrieve).state;
    expect(taken.item_stored).toBe(false);
    expect(
      run({ ...taken, phase: 'store', actual_storage: true, transfer_sequence: 1 }).state
        .item_stored,
    ).toBe(false);
    expect(
      run({
        ...taken,
        phase: 'store',
        actual_storage: true,
        transfer_sequence: 3,
        item_id: 'axe-b',
      }).state.item_stored,
    ).toBe(false);
    expect(
      run({ ...taken, phase: 'store', actual_storage: true, transfer_sequence: 3 }).state
        .item_stored,
    ).toBe(true);
  });
});
