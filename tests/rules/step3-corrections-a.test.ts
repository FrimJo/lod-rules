import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

// Regression tests for the Step 3 independent-review corrections to Backgrounds (PDF 42–50),
// The Dead Rising (PDF 224–236), Lair of the Spider Queen and The Lava River (PDF 237–248),
// The Bandits' Hideout and The Fountain Room (PDF 249–254).

const corpus = readPilot();
const run = (ids: string[], inputs: State) =>
  runCase({ rule_ids: ids, inputs } as TestCase, corpus);
const proc = (id: string, inputs: State) =>
  runCase({ procedure_id: id, inputs } as TestCase, corpus);
const rule = (id: string) => corpus.rules.find((x) => x.id === id)!;
const entity = (id: string) => corpus.entities.find((x) => x.id === id)!;
const procedure = (id: string) => corpus.procedures.find((x) => x.id === id)!;

type Issue = { id: string; related?: string[] };
const issues = parse(readFileSync('review/ambiguities.yaml', 'utf8')) as Issue[];
type Section = { id: string; title: string };
const sections = parse(readFileSync('corpus/source-map/sections.yaml', 'utf8')) as Section[];

describe('Backgrounds transcription (PDF 45, 47)', () => {
  it.each([
    'character.background.proving_your_worth.qualifying_kill',
    'background.proving_your_worth',
    'quest.background.proving_your_worth',
  ])('%s quotes "fatal blow" as printed', (id) => {
    const record = [...corpus.rules, ...corpus.entities].find((x) => x.id === id)!;
    expect(record.source_text).toContain('You do not need to strike the fatal blow');
    expect(record.source_text).not.toContain('final blow');
  });
  it('uses the printed capital H of "17. A new Home"', () => {
    expect(sections.find((s) => s.id === 'section.backgrounds.17_a_new_home')?.title).toBe(
      '17. A new Home',
    );
    expect(entity('background.a_new_home').name).toBe('A new Home');
    expect(entity('quest.background.a_new_home').name).toBe('A new Home personal quest');
  });
});

describe('Backgrounds one-target personal quests stop once the target is dealt with', () => {
  it.each([
    [false, 1],
    [true, undefined],
  ])('Sworn Enemy: leader killed %s', (killed, leaders) => {
    const state = run(['character.background.sworn_enemy.bandit_encounter'], {
      battle_with_bandits: true,
      roll: 10,
      sworn_enemy_killed: killed,
    }).state;
    expect(state.additional_bandit_leaders).toBe(leaders);
  });
  it.each([
    [false, true, 1500],
    [true, undefined, 0],
  ])('16. Revenge: reward already received %s', (received, recognised, xp) => {
    expect(
      run(['character.background.revenge_minotaur.recognition'], {
        fighting_minotaur: true,
        roll: 1,
        reward_already_received: received,
      }).state.recognize_scar,
    ).toBe(recognised);
    expect(
      run(['character.background.revenge_minotaur.reward'], {
        recognize_scar: true,
        beast_defeated: true,
        reward_already_received: received,
        xp: 0,
      }).state.xp,
    ).toBe(xp);
  });
  it.each([
    [false, 2],
    [true, undefined],
  ])('The Heirloom: sword recovered %s', (recovered, rolls) => {
    expect(
      run(['character.background.the_heirloom.quest_setup'], {
        at_quest_start: true,
        quest_start_roll: 1,
        sword_recovered: recovered,
      }).state.encounter_rolls,
    ).toBe(rolls);
  });
  it.each([
    [false, true],
    [true, undefined],
  ])('The Lost Brother: brother found %s', (found, placed) => {
    expect(
      run(['character.background.the_lost_brother.quest_setup'], {
        at_quest_start: true,
        quest_start_roll: 1,
        brother_found: found,
      }).state.brother_on_next_tile,
    ).toBe(placed);
    expect(procedure('procedure.lost_brother_personal_quest').fields).toHaveProperty(
      'brother_found',
    );
  });
});

describe('The Dead Rising: one encoding of Silver City (PDF 224)', () => {
  it('the start rules and the campaign procedure agree on silver_city', () => {
    const rules = run(
      ['core.quest.dead_rising_campaign.start', 'core.quest.dead_rising_campaign.start_elsewhere'],
      { campaign_quest_number: 2, current_settlement: 'silver_city' },
    );
    expect(rules.trace).toEqual(['core.quest.dead_rising_campaign.start']);
    expect(rules.state.quest_start_allowed).toBe(true);
    const started = proc('procedure.dead_rising_campaign', {
      campaign_id: 'dr-1',
      campaign_owner_id: 'dr-1',
      stage: 'q2',
      next_quest_id: 'quest.dead_rising.the_dead_rising',
      quest_in_progress: false,
      completed_quest_id: '',
      quest_outcome: '',
      campaign_choice: '',
      aftermath_processed: false,
      settlement_return_allowed: true,
      phase: 'start_quest',
      current_settlement: 'silver_city',
    });
    expect(started.events).not.toContainEqual({ type: 'require', satisfied: false });
  });
  it.each([
    ['choose_apostle', 234, 'Quest 6A: Sacrifice', 'Quest Location: White 36.'],
    ['choose_master', 235, 'Quest 6B: The Master', 'Quest Location: White 39.'],
  ])('%s cites the Quest Location it sends the party to', (step, page, heading, quote) => {
    const s = procedure('procedure.dead_rising_campaign').steps.find((x) => x.id === step)!;
    expect(s.source_text).toContain(quote);
    expect(s.source).toContainEqual(expect.objectContaining({ pdf_page: page, heading }));
  });
});

describe("The Bandits' Hideout and The Fountain Room corrections (PDF 249–254)", () => {
  it('Golfrid is a halfling, not assigned a Halfling Thief profile', () => {
    expect(run(['core.quest.rescuing_prisoners.golfrid'], {}).state.enemy_kind).toBe('halfling');
    expect(rule('core.quest.rescuing_prisoners.golfrid').source_text).toContain(
      'Golfrid is a halfling',
    );
    expect(entity('quest_actor.bandits_hideout.golfrid').rules).toEqual(
      expect.arrayContaining([
        'core.quest.rescuing_prisoners.golfrid_not_cornered',
        'core.quest.rescuing_prisoners.golfrid_movement',
      ]),
    );
  });
  it.each([
    ['core.quest.rescuing_prisoners.threshold', true],
    ['core.quest.cleansing_water.threshold', false],
    ['core.quest.spider_queen_basement.threshold', false],
    ['core.quest.spider_queen_tomb.threshold', false],
  ])('%s outputs the Scenario-die override only where printed', (id, printed) => {
    const r = rule(id);
    expect(r.source_text.includes('regardless of the Scenario die result')).toBe(printed);
    expect(Object.keys(r.fields ?? {}).includes('scenario_result_ignored')).toBe(printed);
    expect(JSON.stringify(r.fields)).not.toContain('special quest monster');
  });
  it.each(['core.quest.rescuing_prisoners.threshold', 'core.quest.cleansing_water.threshold'])(
    '%s links the overshoot issue both ways',
    (id) => {
      expect(rule(id).issues).toContain('issue.quest.threat_threshold_overshoot');
      expect(
        issues.find((i) => i.id === 'issue.quest.threat_threshold_overshoot')?.related,
      ).toContain(id);
    },
  );
});

describe('Issues raised by the Step 3 reviews are linked from the rules they concern', () => {
  it.each([
    ['character.background.revenge_bandits.hate', 'issue.backgrounds.revenge_bandits_hate_scope'],
    ['core.quest.spring_cleaning.objective_setup', 'issue.quest.spring_cleaning_objective_rats'],
    ['core.quest.master.reward', 'issue.quest.master_reward_recipient'],
    ['core.quest.spider_queen_entrance.amburr', 'issue.quest.amburr_weapon_conflict'],
    ['core.quest.baptising.weapon_baptising', 'issue.quest.baptising_weapon_scope'],
  ])('%s lists %s', (id, issueId) => {
    expect(rule(id).issues).toContain(issueId);
    expect(issues.find((i) => i.id === issueId)?.related).toContain(id);
  });
});

describe('Corpus-written text in these quests keeps its spaces', () => {
  const owned = [
    'section.backgrounds',
    'section.quest_book_i.the_dead_rising',
    'section.quest_book_i.lair_of_the_spider_queen',
    'section.quest_book_i.the_lava_river',
    'section.quest_book_i.the_bandits_hideout',
    'section.quest_book_i.the_fountain_room',
  ];
  const glued =
    /SuppliedScenario|Scenario\d|Advertised\d|\d+c per|\+1luck|intoAP|HeroDEX|SuppliedDEX|page\d|Level\d|perhero|OnePotion|\+1Damage|endofnext|SilverCity|\d{3}c offer|\b2AP\b|[a-z],[A-Za-z]|;[a-z]/;
  const text = (value: unknown, key = ''): string[] => {
    if (key === 'source_text') return [];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap((v) => text(v));
    if (value && typeof value === 'object')
      return Object.entries(value).flatMap(([k, v]) => text(v, k));
    return [];
  };
  it('has no glued words in names, labels or descriptions', () => {
    const records = [...corpus.rules, ...corpus.entities, ...corpus.procedures].filter((r) =>
      owned.some((o) => r.section_id === o || r.section_id.startsWith(`${o}.`)),
    );
    expect(records.length).toBeGreaterThan(100);
    for (const r of records) {
      const { name, fields, dependencies } = r as {
        name?: string;
        fields?: unknown;
        dependencies?: unknown;
      };
      for (const t of text({ name, fields, dependencies })) expect(t, r.id).not.toMatch(glued);
    }
  });
});
