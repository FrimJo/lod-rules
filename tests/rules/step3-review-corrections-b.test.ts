import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

interface Source {
  pdf_page?: number;
  heading?: string | null;
  locator?: { paragraph?: string | number | null } | null;
}
interface Step {
  id: string;
  source?: Source[];
}
interface Issue {
  id: string;
  summary: string;
  related: string[];
}
interface Record {
  id: string;
  issues?: string[];
  category?: string;
  steps?: Step[];
}

const load = <T>(path: string) => parse(readFileSync(path, 'utf8')) as T;
const issues = load<Issue[]>('review/ambiguities.yaml');
const issue = (id: string) => issues.find((x) => x.id === id);
const records = (path: string) => load<Record[]>(path);
const record = (path: string, id: string) => records(path).find((r) => r.id === id);

const flatSteps = (value: unknown): Step[] => {
  if (Array.isArray(value)) return value.flatMap(flatSteps);
  if (!value || typeof value !== 'object') return [];
  const children = Object.entries(value)
    .filter(([key]) => key !== 'source')
    .flatMap(([, v]) => flatSteps(v));
  return 'id' in value ? [value as Step, ...children] : children;
};

describe('Step 3 review corrections (Chamber/Crypt, Ancient Lands, Side Quests)', () => {
  it.each([
    [
      'issue.quest.portal_reader_hold_still',
      [
        [
          'corpus/rules/quests/closing-portal.yaml',
          'core.quest.closing_portal.ritual_interruption',
        ],
        ['corpus/rules/quests/closing-portal.yaml', 'core.quest.closing_portal.ritual_start'],
        [
          'corpus/procedures/quests/closing-portal-reading.yaml',
          'procedure.closing_portal_reading_attempt',
        ],
      ],
    ],
    [
      'issue.quest.temple_despair_curse_duration',
      [
        ['corpus/rules/quests/temple-despair.yaml', 'core.quest.temple_despair.curse'],
        ['corpus/rules/quests/temple-despair.yaml', 'core.quest.temple_despair.curse_expiry'],
      ],
    ],
    [
      'issue.quest.grieving_mother_slammed_door_inside',
      [
        ['corpus/rules/quests/grieving-mother.yaml', 'core.quest.grieving_mother.door_access'],
        [
          'corpus/rules/quests/grieving-mother.yaml',
          'core.quest.grieving_mother.door_access_blocked',
        ],
        ['corpus/rules/quests/grieving-mother.yaml', 'core.quest.grieving_mother.door_slam'],
      ],
    ],
  ] as const)('links %s from every related rule', (id, owners) => {
    for (const [path, oid] of owners) {
      expect(issue(id)?.related).toContain(oid);
      expect(record(path, oid)?.issues, oid).toContain(id);
    }
  });

  it('cites the Outpost opening paragraph, not Special:, for the start-from-the-outpost law', () => {
    const procedure = record(
      'corpus/procedures/quests/ancient-lands-expedition.yaml',
      'procedure.ancient_lands_expedition',
    );
    const steps = flatSteps(procedure?.steps);
    const outpost = (id: string) =>
      steps
        .find((s) => s.id === id)
        ?.source?.filter((s) => s.pdf_page === 138)
        .map((s) => s.locator?.paragraph);
    for (const id of ['check_owner', 'bind', 'owner', 'at_outpost'])
      expect(outpost(id), id).toEqual(['Opening description beside the map inset']);
    expect(outpost('depart_from_outpost')).toEqual([
      'Opening description beside the map inset',
      'Special',
    ]);
    for (const id of ['pay_toll', 'league_check']) expect(outpost(id), id).toEqual(['Special']);
  });

  it('titles the Pyramid of Xánthu Threat table node after its enclosing section', () => {
    const sections = load<{ id: string; title: string; notes?: string }[]>(
      'corpus/source-map/sections.yaml',
    );
    const node = (id: string) => sections.find((s) => s.id === id);
    expect(node('section.quest_book_i.quests_into_the_ancient_lands.table')?.title).toBe(
      'The Pyramid of Xánthu table',
    );
    expect(
      node('section.quest_book_i.side_quests.side_quest_4_go_fetch.table_shield_condition')?.notes,
    ).toMatch(/prints no caption/);
  });

  it('types the Go Fetch shield and the Alchemist’s potion by their printed kind', () => {
    expect(
      record('corpus/entities/equipment/go-fetch-shield.yaml', 'equipment.quest.go_fetch_shield')
        ?.category,
    ).toBe('shield');
    expect(
      record('corpus/entities/equipment/mushrooms.yaml', 'equipment.quest.mushrooms_healing_potion')
        ?.category,
    ).toBe('consumable');
  });

  it('keeps spaces between words and numbers in the unit’s issue summaries', () => {
    for (const id of [
      'issue.quest.hierophant_tome_boundaries',
      'issue.quest.slay_beast_boundaries',
      'issue.quest.manhunt_proof_boundary',
      'issue.quest.mushrooms_boundaries',
      'issue.quest.portal_aftermath_scope',
      'issue.quest.relic_lifecycle_scope',
      'issue.quest.heirloom_lifecycle_scope',
      'issue.quest.necromancer_lifecycle_scope',
    ]) {
      expect(issue(id)?.summary, id).not.toMatch(
        /\b(?:[A-Za-z]{2,}\d+[a-z]*|\d+[a-z]{3,}\w*)\b|\d+c\b|\dd\d+HP/,
      );
    }
  });
});
