/**
 * The Game Master's table carries rulebook facts as data (src/gm/rules.ts). These tests read
 * the same facts back from the corpus through the agent tools, so a corpus fix cannot leave
 * the table quoting a stale value, and every page the table cites is a page the record cites.
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { Retrieval } from '../../../scripts/retrieve/index.ts';
import { runRetrievalTool } from '../../../scripts/retrieve/tools.ts';
import {
  CITES,
  LIGHT_RULES,
  MENTAL_CONDITIONS,
  MORALE_EVENTS,
  QUESTS,
  SANITY_LOSSES,
  type Cite,
} from '../src/gm/rules.ts';

interface Citation {
  pdf_page: number | null;
  printed_page: number | null;
}
interface Cell {
  type: string;
  printed: string;
  value?: number;
}
interface Row {
  id: string;
  cells: Record<string, Cell>;
}
interface ToolRecord {
  found?: false;
  id: string;
  text?: string;
  citations?: Citation[];
  data?: { rows?: Row[] };
}

let retrieval: Retrieval;
before(() => {
  retrieval = Retrieval.fromCorpus();
});
after(() => retrieval.close());

function get(id: string): ToolRecord {
  const record = runRetrievalTool(retrieval, 'lod_get', { id }) as ToolRecord;
  assert.notEqual(record.found, false, `record ${id} exists`);
  return record;
}

function rows(id: string): Row[] {
  const list = get(id).data?.rows;
  assert.ok(list && list.length > 0, `${id} has rows`);
  return list;
}

function citesPage(record: ToolRecord, cite: Cite, label: string): void {
  const match = record.citations?.some(
    (c) => c.pdf_page === cite.pdf && (cite.page === null || c.printed_page === cite.page),
  );
  assert.ok(match, `${label} cites PDF ${cite.pdf} (printed ${cite.page}) as ${record.id} does`);
}

test('every citation in the table points at a page its corpus record cites', () => {
  for (const [name, cite] of Object.entries(CITES)) {
    if (!cite.recordId) continue;
    citesPage(get(cite.recordId), cite, `CITES.${name}`);
  }
});

test('the Party Morale table matches the corpus row for row', () => {
  const table = rows('table.psychology.morale_adjustments');
  assert.deepEqual(
    MORALE_EVENTS.map((e) => e.id),
    table.map((r) => r.id),
  );
  for (const event of MORALE_EVENTS) {
    const row = table.find((r) => r.id === event.id)!;
    assert.equal(row.cells.situation?.printed, event.situation, event.id);
    assert.equal(row.cells.effect?.value, event.effect, `${event.id} effect`);
    assert.equal(row.cells.description?.printed, event.flavour, `${event.id} description`);
  }
});

test('the Sanity loss table matches the corpus row for row', () => {
  const table = rows('table.psychology.sanity_losses');
  assert.deepEqual(
    SANITY_LOSSES.map((e) => e.id),
    table.map((r) => r.id),
  );
  for (const loss of SANITY_LOSSES) {
    const row = table.find((r) => r.id === loss.id)!;
    assert.equal(row.cells.situation?.printed, loss.situation, loss.id);
    assert.equal(row.cells.effect?.printed, loss.printed, `${loss.id} effect`);
    if (loss.loss !== null) assert.equal(row.cells.effect?.value, -loss.loss, `${loss.id} value`);
  }
});

test('the Mental conditions table matches the corpus row for row', () => {
  const table = rows('table.psychology.mental_conditions');
  assert.deepEqual(
    MENTAL_CONDITIONS.map((c) => c.id),
    table.map((r) => r.id),
  );
  for (const condition of MENTAL_CONDITIONS) {
    const row = table.find((r) => r.id === condition.id)!;
    assert.equal(row.cells.condition?.printed, condition.name, condition.id);
    assert.equal(row.cells.roll?.printed, condition.printed, `${condition.id} roll`);
    assert.equal(row.cells.effect?.printed, condition.effect, `${condition.id} effect`);
  }
});

test('light source bonuses match the corpus rules', () => {
  const ids: { [kind: string]: string } = {
    torch: 'character.equipment.light_source.torch.light',
    lantern: 'character.equipment.light_source.lantern_filled_with_oil.light',
    headlamp: 'character.equipment.light_source.headlamp.light',
  };
  for (const [kind, id] of Object.entries(ids)) {
    const rules = LIGHT_RULES[kind as keyof typeof LIGHT_RULES];
    const text = get(id).text ?? '';
    assert.match(text, new RegExp(`\\+${rules.fearTerror} Fear/Terror`), `${kind} Fear/Terror`);
    assert.match(text, new RegExp(`\\+${rules.perception} Perception`), `${kind} Perception`);
  }
  const headlamp = get('character.equipment.light_source.headlamp.destroyed').text ?? '';
  assert.match(headlamp, /hit in the head, the lamp is destroyed/);
  const torch = get('character.equipment.light_source.torch.spent').text ?? '';
  assert.match(torch, />=90 extinguishes/);
  assert.match(torch, /Threat Roll below Threat spends it/);
  const lantern = get('character.equipment.light_source.lantern_filled_with_oil.oil_use').text ?? '';
  assert.match(lantern, /consumes half its oil; the second extinguishes it/);
});

test('quest Threat presets match the quest tables and threshold rules', () => {
  for (const quest of QUESTS) {
    if (quest.records.threat) {
      const record = get(quest.records.threat);
      citesPage(record, quest.cite, quest.id);
      const row = rows(quest.records.threat)[0]!;
      const start = row.cells.start!;
      if (quest.start === null) assert.equal(start.printed, 'N/A', `${quest.id} start`);
      else assert.equal(start.printed, String(quest.start), `${quest.id} start`);
      const min = row.cells.min!;
      if (quest.min === 'start') assert.equal(min.printed, 'Same as start lvl', `${quest.id} min`);
      else if (quest.min === null) assert.equal(min.printed, 'N/A', `${quest.id} min`);
      else assert.equal(min.value, quest.min, `${quest.id} min`);
      const max = row.cells.max!;
      if (quest.max === null) assert.equal(max.printed, 'N/A', `${quest.id} max`);
      else assert.equal(max.value, quest.max, `${quest.id} max`);
    }
    for (const id of quest.records.thresholds ?? []) {
      const text = get(id).text ?? '';
      for (const threshold of quest.thresholds)
        assert.match(text, new RegExp(`\\b${threshold}\\b`), `${quest.id} threshold ${threshold}`);
    }
    if (quest.thresholds.length > 0)
      assert.ok(quest.records.thresholds?.length, `${quest.id} thresholds have a record`);
  }
});
