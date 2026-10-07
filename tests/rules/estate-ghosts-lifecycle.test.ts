import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const run = (id: string, inputs: State) =>
  runCase({ procedure_id: id, inputs } as TestCase, corpus);
const invokes = (r: ReturnType<typeof run>) => r.events.filter((e) => e.type === 'invoke');

describe('Estate ghost contact and Ghostly Events — rendered PDF160–163', () => {
  const ghosts = (state: State, call: State = {}) =>
    run('procedure.estate_ghostly_events', { ...state, ...call });
  const night: State = {
    estate_owned: true,
    ghost_roll_scope: 'estate_night_only',
    owed_event_reading: '',
    crop_rations_holding: 'held_at_estate',
    stayed_at_estate: true,
    interval_id: 'before-quest-3',
    ghost_interval_id: 'before-quest-2',
    forced_ghost_event: 0,
    contact_roll: 7,
    event_roll: 4,
    grieving_mother_succeeded: false,
    grieving_mother_triggered: false,
    wizard_in_party: true,
    estate_crop_rations: 5,
    party_crop_rations: 3,
  };
  it('contact on 7–10 applies one table event once per interval, with no change of plans', () => {
    const first = ghosts(night);
    expect(first.state).toMatchObject({
      ghosts_make_contact: true,
      ghost_event: 4,
      ghost_interval_id: 'before-quest-3',
      must_head_straight_to_world_map: true,
    });
    expect(first.trace).toContain('character.settlement.ghost_event.4');
    const replay = ghosts(first.state, { event_roll: 10 });
    expect(replay.state.ghost_event).toBe(4);
    expect(replay.trace).not.toContain('character.settlement.ghost_event.10');
  });
  it('a contact roll of 6 or less brings no event', () => {
    const quiet = ghosts(night, { contact_roll: 6 });
    expect(quiet.state).toMatchObject({ ghosts_make_contact: false, ghost_event: 0 });
    expect(quiet.trace.filter((t) => t.includes('ghost_event'))).toEqual([]);
  });
  it('event 6 starts The Grieving Mother, or counts as #2 once that quest has succeeded', () => {
    const six = ghosts(night, { event_roll: 6 });
    expect(six.state.grieving_mother_triggered).toBe(true);
    expect(invokes(six)).toEqual([{ type: 'invoke', dependency: 'procedure.grieving_mother' }]);
    const done = ghosts(night, { event_roll: 6, grieving_mother_succeeded: true });
    expect(done.state).toMatchObject({ ghost_event: 2, grieving_mother_triggered: false });
    expect(done.trace).toContain('character.settlement.ghost_event.2');
  });
  it('the Protector is ignored without a wizard', () => {
    expect(ghosts(night, { event_roll: 5, wizard_in_party: false }).state).toMatchObject({
      ghost_event: 0,
      ghosts_make_contact: false,
    });
  });
  it('Angered Ghost loses the crop rations where the caller says they are held', () => {
    const angered = { ...night, event_roll: 7 };
    expect(ghosts(angered).state).toMatchObject({
      estate_crop_rations: 0,
      party_crop_rations: 3,
      crop_rations_lost: 5,
    });
    expect(ghosts(angered, { crop_rations_holding: 'carried_by_party' }).state).toMatchObject({
      estate_crop_rations: 5,
      party_crop_rations: 0,
      crop_rations_lost: 3,
    });
    const unsupplied = ghosts(angered, { crop_rations_holding: '' });
    expect(unsupplied.unresolved).toEqual(['issue.estate.furnishing_usage_boundaries']);
    expect(unsupplied.state).toMatchObject({
      estate_crop_rations: 5,
      party_crop_rations: 3,
      crop_rations_lost: 0,
    });
  });
  it('an owed #8 replaces the rolls or comes in addition, as the caller reads it', () => {
    const owedNight = { ...night, forced_ghost_event: 8, contact_roll: 7, event_roll: 2 };
    const replaced = ghosts(owedNight, { owed_event_reading: 'replaces_rolls' });
    expect(replaced.state).toMatchObject({ ghost_event: 8, forced_ghost_event: 0 });
    expect(replaced.trace).toContain('character.settlement.ghost_event.8');
    expect(replaced.trace).not.toContain('character.settlement.ghost_event.2');
    const added = ghosts(owedNight, { owed_event_reading: 'in_addition' });
    expect(added.state).toMatchObject({
      owed_event_applied: true,
      ghost_event: 2,
      forced_ghost_event: 0,
      must_head_straight_to_world_map: true,
    });
    expect(added.trace).toContain('character.settlement.ghost_event.8');
    expect(added.trace).toContain('character.settlement.ghost_event.2');
    expect(ghosts(added.state).trace).not.toContain('character.settlement.ghost_event.8');
    const unsupplied = ghosts(owedNight);
    expect(unsupplied.unresolved).toEqual(['issue.estate.ghost_contact_scope']);
    expect(unsupplied.state).toMatchObject({
      ghost_interval_id: 'before-quest-2',
      forced_ghost_event: 8,
      ghosts_make_contact: false,
    });
  });
  it('whether a night away still rolls is the caller-supplied scope, and waits without it', () => {
    const away = { ...night, stayed_at_estate: false };
    const nightOnly = ghosts(away);
    expect(nightOnly.unresolved).toEqual([]);
    expect(nightOnly.state).toMatchObject({
      ghost_check_due: false,
      ghost_interval_id: 'before-quest-2',
    });
    expect(ghosts(away, { ghost_roll_scope: 'every_interval' }).state).toMatchObject({
      ghost_check_due: true,
      ghost_event: 4,
      ghost_interval_id: 'before-quest-3',
    });
    const unsupplied = ghosts(night, { ghost_roll_scope: '' });
    expect(unsupplied.unresolved).toEqual(['issue.estate.ghost_contact_scope']);
    expect(unsupplied.state).toMatchObject({
      ghost_check_due: false,
      ghost_interval_id: 'before-quest-2',
    });
  });
});

describe('The Grieving Mother lifecycle — rendered PDF164–165', () => {
  const gm = (state: State, call: State = {}) =>
    run('procedure.grieving_mother', { ...state, ...call });
  const fresh: State = {
    occurrence_id: 'gm-1',
    occurrence_owner_id: '',
    grieving_mother_triggered: true,
    next_main_quest_instance_id: 'quest.great_crypt.tomb_raiders#4',
    side_quest_status: '',
    side_card_drawn: false,
    door_slammed: false,
    spiders_dead: false,
    remains_carried: false,
    actor_hero_id: 'hero-2',
    actor_has_action: true,
    wandering_activation_supplied: false,
    back_at_estate: false,
    forced_ghost_event: 0,
    grieving_mother_succeeded: false,
    longsword_awarded: false,
  };
  const through = (...phases: string[]) =>
    phases.reduce((s, phase) => gm(s, { phase }).state, gm(fresh, { phase: 'setup' }).state);
  it('runs card, door slam, spiders and one-action pick-up in order, then rewards once at the estate', () => {
    const early = gm(gm(fresh, { phase: 'setup' }).state, { phase: 'pick_up' });
    expect(early.state.remains_carried).toBe(false);
    const carried = gm(through('card_drawn', 'first_turn_end', 'spiders_beaten'), {
      phase: 'pick_up',
    });
    expect(carried.state).toMatchObject({
      host_quest_instance_id: 'quest.great_crypt.tomb_raiders#4',
      door_slammed: true,
      remains_carried: true,
      carrier_hero_id: 'hero-2',
      action_cost: 1,
      remains_enc: 8,
    });
    const home = gm(gm(carried.state, { phase: 'end_quest' }).state, {
      phase: 'return_estate',
      back_at_estate: true,
    });
    expect(home.state).toMatchObject({
      side_quest_status: 'succeeded',
      grieving_mother_succeeded: true,
      longsword_awarded: true,
      reward_damage_bonus: 2,
    });
    expect(gm(home.state, { phase: 'return_estate' }).trace).not.toContain(
      'core.quest.grieving_mother.success',
    );
  });
  it('ending before the card is drawn fails and owes Ghostly Event #8', () => {
    const failed = gm(gm(fresh, { phase: 'setup' }).state, { phase: 'end_quest' });
    expect(failed.state).toMatchObject({ side_quest_status: 'failed', forced_ghost_event: 8 });
  });
  it('leaving without the remains, and the spider Wandering Monster timing, stay open', () => {
    const left = gm(through('card_drawn'), { phase: 'end_quest' });
    expect(left.unresolved).toEqual(['issue.quest.grieving_mother_outcome_boundaries']);
    expect(left.state.side_quest_status).toBe('active');
    expect(gm(through('card_drawn'), { phase: 'wandering_monster' }).unresolved).toEqual([
      'issue.quest.grieving_mother_wandering_activation',
    ]);
  });
});

describe('Furnishing the Manor — rendered PDF161', () => {
  const furnish = (state: State, call: State = {}) =>
    run('procedure.estate_furnishing', { ...state, ...call });
  const manor: State = {
    phase: 'purchase',
    estate_owned: true,
    staying_at_manor: true,
    interval_id: 'after-quest-3',
    furnishing: 'Training Grounds',
    coins: 1200,
    purchase_interval_id: 'after-quest-1',
    furnishing_owned: false,
    awaiting_dungeon_exit: false,
    chosen_god: '',
    hero_id: 'hero-1',
    hero_is_alchemist: false,
    hero_use_interval_id: '',
    hero_training_facility: '',
    hero_training_interval_id: '',
    furnishing_use_interval_id: '',
    lab_garden_limit_scope: '',
  };
  it('charges every printed table price', () => {
    const table = corpus.tables.find((t) => t.id === 'table.estate.furnishings')!;
    for (const row of table.rows) {
      const name = row.cells.furnishing!.printed;
      const cost = furnish(manor, { furnishing: name }).state.furnishing_cost;
      expect(`${String(cost)} c`).toBe(row.cells.cost!.printed);
    }
  });
  it('one purchase per interval, usable only after leaving the next dungeon', () => {
    const bought = furnish(manor);
    expect(bought.state).toMatchObject({
      coins: 700,
      furnishing_owned: true,
      awaiting_dungeon_exit: true,
    });
    const second = furnish(
      { ...bought.state, furnishing_owned: false, awaiting_dungeon_exit: false },
      { furnishing: 'Garden' },
    );
    expect(second.state.coins).toBe(700);
    expect(furnish(bought.state, { phase: 'use' }).state.use_allowed).toBe(false);
    const after = furnish(bought.state, { phase: 'dungeon_exit' }).state;
    expect(furnish(after, { phase: 'use', interval_id: 'after-quest-4' }).state.use_allowed).toBe(
      true,
    );
  });
  it('trains once per interval at one facility; a later switch of facility stays open', () => {
    const ready: State = { ...manor, phase: 'use', furnishing_owned: true };
    const trained = furnish(ready);
    expect(trained.state).toMatchObject({
      use_allowed: true,
      hero_training_facility: 'Training Grounds',
    });
    expect(furnish(trained.state).state.use_allowed).toBe(false);
    const archerySameInterval = furnish(
      { ...trained.state, hero_use_interval_id: '' },
      { furnishing: 'Archery Range' },
    );
    expect(archerySameInterval.state.use_allowed).toBe(false);
    const archeryLater = furnish(
      { ...trained.state, hero_use_interval_id: '' },
      { furnishing: 'Archery Range', interval_id: 'after-quest-4' },
    );
    expect(archeryLater.unresolved).toEqual(['issue.estate.furnishing_usage_boundaries']);
  });
  it('counts the Lab and Garden limit per facility or per alchemist, as the caller reads it', () => {
    const lab: State = {
      ...manor,
      phase: 'use',
      furnishing_owned: true,
      furnishing: 'Alchemist Lab',
      hero_is_alchemist: true,
    };
    const facility = furnish(lab, { lab_garden_limit_scope: 'per_facility' });
    expect(facility.state).toMatchObject({ use_allowed: true });
    expect(facility.trace).toContain('character.settlement.estate.alchemist_lab');
    const secondAlchemist = { ...facility.state, hero_id: 'hero-2', hero_use_interval_id: '' };
    expect(furnish(secondAlchemist).state.use_allowed).toBe(false);
    const perAlchemist = { ...secondAlchemist, lab_garden_limit_scope: 'per_alchemist' };
    const second = furnish(perAlchemist);
    expect(second.state.use_allowed).toBe(true);
    expect(furnish(second.state).state.use_allowed).toBe(false);
    const unsupplied = furnish({ ...lab, furnishing: 'Garden' });
    expect(unsupplied.unresolved).toEqual(['issue.estate.furnishing_usage_boundaries']);
    expect(unsupplied.state.use_allowed).toBe(false);
  });
  it.each(['Smithy', 'Shrine', 'Crops, Hen House, and Pigsty'])(
    'how often the %s may be used is not stated',
    (name) => {
      const result = furnish({ ...manor, phase: 'use', furnishing_owned: true, furnishing: name });
      expect(result.unresolved).toEqual(['issue.estate.furnishing_usage_boundaries']);
      expect(result.state.use_allowed).toBe(false);
    },
  );
});
