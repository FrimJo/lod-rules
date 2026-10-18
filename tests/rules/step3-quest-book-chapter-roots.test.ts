import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';

interface Sourced {
  id: string;
  section_id: string;
  source_text: string;
  source: Array<{ pdf_page?: number; printed_page?: number; heading?: string | null }>;
  steps?: Array<{ id: string; source_text: string; substeps?: Sourced['steps'] }>;
}

const corpus = readPilot();
const all = [...corpus.rules, ...corpus.procedures] as unknown as Sourced[];
const record = (id: string): Sourced => {
  const found = all.find((x) => x.id === id);
  if (!found) throw new Error(`Missing ${id}`);
  return found;
};

const travel =
  'To enter these lands via the Outpost, you must be a member of the League of Dungeoneers (Play the first campaign to become this).';
const reading =
  'These 5 quests each have 2 different objective rooms, depending on if you have access to the Ancient lands tiles or not. Make sure to read the correct one.';

describe('Quests into the Ancient Lands chapter page — verbatim quotes (PDF 263, printed 261)', () => {
  it.each([
    ['core.quest.ancient_lands.outpost_membership', travel, 'Travelling in the Ancient lands'],
    ['core.quest.ancient_lands.outpost_eligibility', travel, 'Travelling in the Ancient lands'],
    [
      'core.quest.ancient_lands.travel_costs',
      'Not only does each hex require 2 Movement Points, but each day also requires 2 Rations to accommodate the extra water supplies needed. Using a camel is preferred when traversing these deserts as it reduces the travel time.',
      'Travelling in the Ancient lands',
    ],
    [
      'core.quest.ancient_lands.travel_event',
      'Furthermore, a Travel Event die roll of 10-12 results in an Event. Use the Desert Event Cards.',
      'Travelling in the Ancient lands',
    ],
    ['core.quest.ancient_lands.ancient_objective', reading, 'Reading these quests'],
    ['core.quest.ancient_lands.standard_objective', reading, 'Reading these quests'],
  ])('%s quotes the page under its printed heading', (id, quote, heading) => {
    const rule = record(id);
    expect(rule.source_text.replace(/\s+/g, ' ')).toContain(quote);
    expect(rule.source[0]).toMatchObject({ pdf_page: 263, printed_page: 261, heading });
  });

  it('procedure.ancient_lands_expedition quotes the page and The Outpost toll, not a summary', () => {
    const proc = record('procedure.ancient_lands_expedition');
    const text = proc.source_text.replace(/\s+/g, ' ');
    expect(text).toContain(travel);
    expect(text).toContain(reading);
    expect(text).toContain(
      'you will have to pay a toll to the King of 100 c per hero first. You must be a member of the league to be allowed to pass.',
    );
    expect(proc.source.map((s) => s.heading)).toEqual([
      'Travelling in the Ancient lands',
      'The Outpost',
      'The Outpost',
      'Reading these quests',
    ]);
    const steps = (proc.steps ?? []).flatMap((s) => [s, ...(s.substeps ?? [])]);
    for (const step of steps) {
      expect(step.source_text).not.toMatch(/fresh expedition|bound one|once per occurrence/);
    }
  });
});

describe('Quest Book I chapter roots of this unit — coverage', () => {
  const coverage = parse(
    readFileSync(join(repoRoot, 'corpus/source-map/coverage.yaml'), 'utf8'),
  ) as { sections: Array<{ id: string; status: string; notes?: string }> };
  const row = (id: string) => coverage.sections.find((r) => r.id === id);
  it.each([
    'section.quest_book_i.the_chamber_of_reverence',
    'section.quest_book_i.the_great_crypt',
    'section.quest_book_i.quests_into_the_ancient_lands',
  ])('%s is extracted with a standalone note', (id) => {
    const r = row(id);
    expect(['extracted', 'reviewed']).toContain(r?.status);
    expect(r?.notes).not.toMatch(/Package|ledger|reconcil|pending|tier/i);
  });
});
