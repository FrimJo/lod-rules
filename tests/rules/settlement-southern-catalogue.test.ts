import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

// PDF 136–139 (printed 134–137): The Settlements of the Southern Part of the Kingdom.
const corpus = readPilot();
const run = (id: string, inputs: State = {}) =>
  runCase({ rule_ids: ['character.settlement.' + id], inputs } as TestCase, corpus);
const profiles = corpus.tables.find((table) => table.id === 'table.settlement.profiles')!;

describe('southern settlement catalogue', () => {
  it('keeps the printed closed service list and unchanged default prices', () => {
    expect(run('listed_services').state).toMatchObject({
      services_limited_to_listed: true,
      unlisted_price_percent_modifier: 0,
      unlisted_availability_modifier: 0,
    });
    const rule = corpus.rules.find((entry) => entry.id === 'character.settlement.listed_services')!;
    expect(rule.issues).toContain('issue.settlement.whiteport_gambling_scope');
  });

  it('quotes each Available Services list in its rule and table row', () => {
    expect(profiles.rows).toHaveLength(11);
    for (const row of profiles.rows) {
      const entity = corpus.entities.find((entry) => entry.id === row.entity_refs![0])!;
      expect(entity.table_rows).toContainEqual({ table_id: profiles.id, row_id: row.id });
      const ruleId = entity.rules.find((id) => id.startsWith('character.settlement.profile.'))!;
      const rule = corpus.rules.find((entry) => entry.id === ruleId)!;
      expect(rule.section_id).toBe(entity.section_id);
      expect(rule.source_text.endsWith(String(row.cells.services!.printed))).toBe(true);
    }
  });

  it('records Whiteport gambling as printed and leaves its scope open', () => {
    expect(run('profile.whiteport').state).toMatchObject({
      gambling_opportunities: true,
      blacksmith_available: false,
      party_lodging_per_night: 15,
    });
    const issues = parse(readFileSync('review/ambiguities.yaml', 'utf8')) as {
      id: string;
      status: string;
      related: string[];
    }[];
    const issue = issues.find((entry) => entry.id === 'issue.settlement.whiteport_gambling_scope')!;
    expect(issue.status).toBe('unresolved');
    expect(issue.related).toContain('character.settlement.profile.whiteport');
  });

  it('keeps the Outpost toll qualifiers', () => {
    expect(run('profile.outpost').state).toMatchObject({
      ancient_lands_toll_per_hero: 100,
      ancient_lands_requires_league_membership: true,
      ancient_lands_expeditions_must_start_here: true,
      ancient_lands_quest_sites: 'yellow 1-12',
      toll_recipient: 'the King',
      weapon_availability_modifier: 0,
      weapon_price_percent_modifier: 20,
      armour_price_percent_modifier: 20,
    });
  });

  it('applies the Caelkirk Blacksmith equipment line to weapons and armour', () => {
    expect(run('profile.caelkirk').state).toMatchObject({
      weapon_availability_modifier: -2,
      weapon_price_percent_modifier: 10,
      armour_availability_modifier: -2,
      armour_price_percent_modifier: 10,
      fishing_gear_cost: 50,
      fishing_gear_availability: 6,
      party_lodging_per_night: 35,
    });
  });
});
