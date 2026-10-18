import { describe, expect, it } from 'vitest';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import type { State, TestCase } from '../../scripts/validate/pilot-types.ts';
import { runCase } from '../support/pilot-interpreter.ts';

const corpus = readPilot();
const rule = (id: string) => corpus.rules.find((x) => x.id === id)!;
const table = (id: string) => corpus.tables.find((x) => x.id === id)!;
const run = (id: string, inputs: State = {}) =>
  runCase({ rule_ids: [id], inputs } as TestCase, corpus);

describe('Quests 1–3 of The Dead Rising — verbatim source and printed headings (PDF 224–230)', () => {
  it.each([
    [
      'core.quest.spring_cleaning.setup',
      'Number of Tiles: 4 corridors (not C16), 4 rooms (Not R17).',
    ],
    [
      'core.quest.dead_rising_campaign.start',
      'but the second quest must be started in Silver City.',
    ],
    [
      'core.quest.spring_cleaning.rest_exception',
      'For this quest only, the party may gain the benefits of the ‘Rest’ rule (page 98) without consuming any food rations.',
    ],
    [
      'core.quest.spring_cleaning.johann_repeat_encounter',
      'If you end up with 31-45 again then place 1d4 Giant Rats and 1 Batswarm.',
    ],
    [
      'core.quest.spring_cleaning.objective_setup',
      'There are 1d10 Rats in the room (placed randomly), and as far away as possible from the player is the Brood Mother.',
    ],
    ['core.quest.dead_rising.setup', '5 rooms (randomised from R2B-R8B only).'],
    ['core.quest.dead_rising.ulfric', 'meaning that his ‘To Hit’ in practice is -5.'],
    ['core.quest.highwaymen.setup', 'Objective room: The Dwarven hall.'],
    ['core.quest.highwaymen.objective_setup', 'Bandits move first.'],
  ])('%s quotes the page', (id, text) => {
    expect(rule(id).source_text).toContain(text);
  });

  it('cites printed headings, never extractor headings', () => {
    const ids = corpus.rules
      .filter((x) => /^core\.quest\.(spring_cleaning|dead_rising|highwaymen)\./.test(x.id))
      .map((x) => x.id);
    expect(ids).toHaveLength(23);
    for (const id of ids)
      for (const s of rule(id).source)
        if (s.document === 'rulebook.second_printing.eng') expect(s.heading).not.toMatch(/—/);
    expect(rule('core.quest.spring_cleaning.reward').source[0]).toMatchObject({
      pdf_page: 224,
      heading: 'Reward',
    });
    expect(rule('core.quest.spring_cleaning.aftermath').source[0]).toMatchObject({
      pdf_page: 226,
      heading: 'Aftermath',
      extraction: { visually_verified: true },
    });
  });

  it('applies changelog 2.21 #103/#194: the Highwaymen objective room is The Throne room', () => {
    const setup = rule('core.quest.highwaymen.setup');
    expect(run(setup.id).state).toMatchObject({
      objective_room: 'The Throne room',
      objective_room_printed: 'The Dwarven hall',
    });
    expect(
      setup.source
        .filter((s) => s.document === 'vonbraus.changelog_2_2x')
        .map((s) => (s as { locator?: { row?: number } }).locator?.row),
    ).toEqual([103, 194]);
    expect(setup.issues).toContain('issue.quest.highwaymen_objective_room_name');
  });

  it('applies the ration-free Rest only to Spring Cleaning', () => {
    const id = 'core.quest.spring_cleaning.rest_exception';
    expect(
      run(id, { current_quest: 'quest.dead_rising.spring_cleaning' }).state.rest_ration_cost,
    ).toBe(0);
    expect(run(id, { current_quest: 'quest.dead_rising.highwaymen' }).trace).toEqual([]);
  });

  it('types every dice quantity printed in the Quest-Specific Encounter Table', () => {
    const t = table('table.quest.spring_cleaning.encounters');
    expect(t.rows.map((r) => r.cells.quantity)).toEqual([
      { type: 'dice', printed: '1d4', dice: { count: 1, sides: 4 }, meaning: 'value' },
      { type: 'blank', printed: '' },
      { type: 'blank', printed: '' },
      { type: 'dice', printed: '1d6', dice: { count: 1, sides: 6 }, meaning: 'value' },
      { type: 'dice', printed: '1d3', dice: { count: 1, sides: 3 }, meaning: 'value' },
      { type: 'dice', printed: '1d2', dice: { count: 1, sides: 2 }, meaning: 'value' },
      { type: 'number', printed: '1', value: 1, meaning: 'value' },
    ]);
    for (const r of t.rows)
      if (r.cells.quantity)
        expect(r.cells.encounter?.printed.startsWith(r.cells.quantity!.printed)).toBe(true);
  });

  it('keeps table footnotes and the ledger entry as printed', () => {
    expect(table('table.quest.spring_cleaning.brood_mother').footnotes[0]).toBe('XP: 115');
    expect(table('table.quest.dead_rising.ulfric').source_text).toBe(
      'CS RS DMG NA DEX To Hit RES M HP',
    );
    expect(
      table('table.quest.highwaymen.plunder_ledger').rows.find((r) => r.id === 'bodies')?.cells
        .entry?.printed,
    ).toBe('3 bodies -150 c (Delivery 13/6)');
  });
});
