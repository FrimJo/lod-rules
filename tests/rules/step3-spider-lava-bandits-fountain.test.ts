import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

// Step 3 reconciliation of Lair of the Spider Queen, The Lava River, The Bandits' Hideout and
// The Fountain Room (PDF 237–242, 244–254).
const corpus = readPilot();

interface Source {
  document: string;
  pdf_page?: number;
  printed_page?: number | null;
  heading?: string;
  locator?: { row?: number | string; table?: string; paragraph?: string | number };
}
interface Issue {
  id: string;
  status: string;
  related: string[];
  source: Source[];
  resolution?: { source: Source[] };
}
interface CoverageRow {
  id: string;
  status: string;
  components: Record<string, string>;
  notes?: string;
}

const ids = readFileSync('tests/fixtures/step3/ids-qb1_spider_lava_bandits_fountain.txt', 'utf8')
  .split('\n')
  .filter(Boolean);
const sections = new Set(ids);
const coverage = (
  parse(readFileSync('corpus/source-map/coverage.yaml', 'utf8')) as { sections: CoverageRow[] }
).sections;
const issues = parse(readFileSync('review/ambiguities.yaml', 'utf8')) as Issue[];
const records = [
  ...corpus.rules,
  ...corpus.entities,
  ...corpus.tables,
  ...corpus.procedures,
] as unknown as {
  id: string;
  section_id: string;
  source: Source[];
  source_text: string;
  issues?: string[];
}[];
const unit = records.filter((r) => sections.has(r.section_id));
const byId = (id: string) => records.find((r) => r.id === id);
const rule = (id: string, inputs: State = {}) =>
  runCase({ rule_ids: [id], inputs } as TestCase, corpus).state;
const proc = (id: string, inputs: State = {}) =>
  runCase({ procedure_id: id, inputs } as TestCase, corpus);

describe('Step 3 — Spider Queen, Lava River, Bandits’ Hideout, Fountain Room', () => {
  it('closes every owned section as extracted with stand-alone notes', () => {
    for (const id of ids) {
      const row = coverage.find((r) => r.id === id);
      expect(['extracted', 'reviewed'], id).toContain(row?.status);
      for (const value of Object.values(row?.components ?? {}))
        expect(['extracted', 'not_applicable'], id).toContain(value);
      expect(row?.notes ?? '', id).not.toMatch(
        /Package [A-F]|ledger|reconcil|Phase \d|\btier\b|pending/i,
      );
    }
  });

  it('cites only printed headings, never extractor headings', () => {
    expect(unit.length).toBeGreaterThan(90);
    for (const r of unit)
      for (const s of r.source.filter((x) => x.document === 'rulebook.second_printing.eng')) {
        expect(s.heading, r.id).not.toMatch(/—|statistics|Threat levels|Continuation|;/);
        expect(s.printed_page, r.id).toBe((s.pdf_page ?? 0) - 2);
      }
  });

  it('applies changelog 2.21 entry 195: Belua causes Terror 10, the page still quotes Terror 5', () => {
    expect(rule('core.quest.spider_queen_tomb.belua').terror).toBe(10);
    const belua = byId('core.quest.spider_queen_tomb.belua');
    expect(belua?.source_text).toContain('Causes Terror 5');
    expect(belua?.source.find((s) => s.document === 'vonbraus.changelog_2_2x')?.locator?.row).toBe(
      195,
    );
    const table = corpus.tables.find((t) => t.id === 'table.quest.spider_queen_tomb.belua');
    expect(table?.footnotes).toContain('Causes Terror 5, Poison, Large (not wall-climbing)');
    const issue = issues.find((i) => i.id === 'issue.quest.belua_terror');
    expect(issue?.status).toBe('resolved');
    expect(issue?.resolution?.source[0]?.locator?.row).toBe(195);
    for (const rel of issue?.related ?? []) expect(byId(rel)?.issues, rel).toContain(issue?.id);
  });

  it('records changelog entry 108 (ogre card values) as unresolved and keeps the printed values', () => {
    const issue = issues.find((i) => i.id === 'issue.quest.bandits_hideout_ogre_card_values');
    expect(issue?.status).toBe('unresolved');
    expect(issue?.source.map((s) => s.locator?.row).filter(Boolean)).toEqual([108]);
    for (const rel of issue?.related ?? []) expect(byId(rel)?.issues, rel).toContain(issue?.id);
    expect(rule('core.quest.rescuing_prisoners.briggo').xp).toBe(350);
    expect(rule('core.quest.rescuing_prisoners.gorm').xp).toBe(350);
    const gorm = corpus.tables.find((t) => t.id === 'table.quest.rescuing_prisoners.gorm');
    expect(gorm?.rows[0]?.cells.m?.printed).toBe('4');
  });

  it('quotes the printed "The find him" wording (entry 107) and cites the entry', () => {
    const r = byId('core.quest.rescuing_prisoners.objective_setup');
    expect(r?.source_text).toContain('The find him standing at the far end of the room');
    expect(r?.source.some((s) => s.locator?.row === 107)).toBe(true);
  });

  it('types every printed die in the unit', () => {
    expect(
      rule('core.quest.spider_queen_tomb.encounter_odd', {
        encounter_die_odd: true,
        giant_spider_roll: 3,
      }).giant_spiders,
    ).toBe(3);
    expect(
      rule('core.quest.spider_queen_tomb.aftermath', {
        belua_and_children_slain: true,
        coin_roll: 400,
      }).coins_found,
    ).toBe(400);
    const dice = (ruleId: string, field: string) =>
      corpus.rules.find((r) => r.id === ruleId)?.fields?.[field]?.dice;
    expect(dice('core.quest.spider_queen_tomb.encounter_odd', 'giant_spider_roll')).toEqual({
      count: 1,
      sides: 3,
    });
    expect(dice('core.quest.spider_queen_tomb.aftermath', 'coin_roll')).toEqual({
      count: 4,
      sides: 100,
    });
    expect(dice('core.quest.master_alchemist.burned', 'fire_damage_roll')).toEqual({
      count: 1,
      sides: 4,
    });
    expect(dice('core.quest.preventing_disaster.flood_damage', 'fire_damage_roll')).toEqual({
      count: 1,
      sides: 6,
    });
    for (const k of ['secrecy_choice', 'blessing', 'payment', 'priest_refusal', 'curse'])
      expect(dice(`core.quest.pleasure_house.${k}`, 'aftermath_roll'), k).toEqual({
        count: 1,
        sides: 6,
      });
    const demons = corpus.tables.find((t) => t.id === 'table.quest.stop_heretics.demons');
    expect(demons?.rows.map((r) => r.cells.quantity)).toEqual([
      { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'value' },
      { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'value' },
      { type: 'number', printed: '1', value: 1, meaning: 'value' },
    ]);
    expect(demons?.rows.map((r) => r.cells.armour?.printed)).toEqual(['', '1', '2']);
    const filling = corpus.tables.find((t) => t.id === 'table.quest.master_alchemist.filling');
    expect(filling?.rows.find((r) => r.id === 'burned')?.cells.fire_damage).toMatchObject({
      type: 'dice',
      printed: '1d4',
      dice: { count: 1, sides: 4 },
    });
  });

  it('runs the Belua summoning chain only after a 5-6 and a successful CS test', () => {
    const ok = proc('procedure.belua_summoning', {
      behaviour_roll: 6,
      belua_cs_test_succeeded: true,
    });
    expect(ok.steps).toEqual(['behaviour_roll', 'place_spider']);
    expect(ok.state.summoned_giant_spiders).toBe(1);
    const low = proc('procedure.belua_summoning', {
      behaviour_roll: 4,
      belua_cs_test_succeeded: true,
    });
    expect(low.steps).toEqual(['behaviour_roll']);
    expect(low.state).not.toHaveProperty('summoned_giant_spiders');
  });

  it('runs the tremor chain: Scenario 1-2, DEX test, toppled hero standing up', () => {
    const r = proc('procedure.preventing_disaster_tremors', {
      tremors_active: true,
      in_objective_room: true,
      scenario_roll: 2,
      hero_failed_tremor_dex_test: true,
      hero_still_lying: true,
    });
    expect(r.steps).toEqual(['scenario_die', 'toppled', 'standing_up']);
    expect(r.state).toMatchObject({ hero_toppled: true, standing_attempts_per_turn: 2 });
    const calm = proc('procedure.preventing_disaster_tremors', {
      tremors_active: true,
      in_objective_room: true,
      scenario_roll: 3,
      hero_failed_tremor_dex_test: true,
    });
    expect(calm.steps).toEqual(['scenario_die']);
  });

  it('runs the vial, ritual and secrecy chains in printed order', () => {
    const vial = proc('procedure.master_alchemist_vial_filling', {
      hero_carries_vial: true,
      hero_next_to_river: true,
      valid_filling_attempt_completed: true,
      selected_vial_result: 'burned',
      dex: 40,
      dex_roll: 55,
      fire_damage_roll: 2,
    });
    expect(vial.steps).toEqual(['reach_down', 'consult_table']);
    expect(vial.state).toMatchObject({ filling_cost_actions: 2, fire_damage: 2 });
    const ritual = proc('procedure.stop_heretics_ritual', { ritual_succeeded: true });
    expect(ritual.state).toMatchObject({ turn_limit: 10, caster_out_of_battle: true });
    const secret = proc('procedure.pleasure_house_secrecy', {
      guards_and_isabelle_defeated: true,
      keep_secrecy_promise: true,
      aftermath_roll: 6,
    });
    expect(secret.steps).toEqual(['daughter_recognised', 'keep_promise', 'aftermath_table']);
    expect(secret.state).toMatchObject({
      max_hp_modifier: -1,
      priests_collectively_refuse_rewards: true,
    });
  });
});
