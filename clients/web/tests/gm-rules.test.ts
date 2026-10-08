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
  CHEST_TABLES,
  CITES,
  COMBAT_ROUND,
  DOOR_TABLE,
  ENEMY_PRIORITY,
  INITIATIVE,
  INJURY,
  LIGHT_RULES,
  LINGERING_TRAUMA,
  MENTAL_CONDITIONS,
  MORALE_EVENTS,
  QUESTS,
  SANITY_LOSSES,
  THREAT_SOURCES,
  THREAT_TABLES,
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
    const ruled = get(`character.morale.event.${event.id}`) as ToolRecord & {
      data?: { effects?: unknown };
    };
    const literals = JSON.stringify(ruled.data?.effects ?? []).match(/"value":(-?\d+)/g) ?? [];
    const applied = literals.map((m) => Number(m.slice(8)));
    assert.ok(
      applied.includes(event.ruled ?? event.effect),
      `${event.id} applies ${event.ruled ?? event.effect} as the corpus does`,
    );
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
  const lantern =
    get('character.equipment.light_source.lantern_filled_with_oil.oil_use').text ?? '';
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

test('fixed Threat sources from Increasing Threat Level match the corpus rules', () => {
  const printed: { [source: string]: [string, RegExp] } = {
    battle_won: [
      'core.threat.increase.battle_won',
      /Increase Threat Level by 1:\s*- The party wins a battle\./,
    ],
    cobweb_cleared: [
      'core.threat.increase.door_chest_or_cobweb',
      /Increase Threat Level by 1:[^]*a cobweb opening is cleared/,
    ],
    open_door: [
      'core.threat.increase.door_chest_or_cobweb',
      /Increase Threat Level by 1:[^]*a door or chest is opened/,
    ],
    force_lock: [
      'core.threat.increase.force_open',
      /Increase Threat Level by 2:[^]*force open a door or chest/,
    ],
    crowbar: [
      'core.threat.increase.force_open_crowbar',
      /using a crowbar in which case the Threat\s+Level is increased by 1/,
    ],
  };
  for (const [id, [recordId, text]] of Object.entries(printed)) {
    const source = THREAT_SOURCES.find((s) => s.id === id)!;
    assert.match(get(recordId).text ?? '', text, `${id} wording`);
    const amount = Number(/Increase Threat Level by (\d)/.exec(get(recordId).text ?? '')?.[1]);
    assert.equal(source.delta, id === 'crowbar' ? 1 : amount, `${id} amount`);
  }
  assert.match(
    get('core.threat.max_level').text ?? '',
    /equals that value, it will trigger a Wandering Monster/,
  );
});

test('the two Threat tables on p. 89 match the corpus row for row', () => {
  const tables = [
    [THREAT_TABLES.notInBattle, 'table.dungeon.threat_not_in_battle'],
    [THREAT_TABLES.inBattle, 'table.dungeon.threat_in_battle'],
  ] as const;
  for (const [table, id] of tables) {
    const record = get(id);
    citesPage(record, table.cite, id);
    const corpus = rows(id);
    assert.deepEqual(
      table.rows.map((r) => r.id),
      corpus.map((r) => r.id),
      `${id} rows`,
    );
    for (const row of table.rows) {
      const printed = corpus.find((r) => r.id === row.id)!;
      assert.equal(printed.cells.roll?.printed, row.printed, `${row.id} roll`);
      assert.equal(printed.cells.result?.printed, row.result, `${row.id} result`);
      assert.equal(printed.cells.decrease?.value, row.decrease, `${row.id} decrease`);
    }
  }
});

test('the Door Table matches the corpus row for row', () => {
  const corpus = rows('table.dungeon.door_chest_difficulty');
  assert.deepEqual(
    DOOR_TABLE.map((r) => r.id),
    corpus.map((r) => r.id),
  );
  for (const row of DOOR_TABLE) {
    const printed = corpus.find((r) => r.id === row.id)!;
    assert.equal(printed.cells.result?.printed, row.printed, `${row.id} roll`);
    assert.equal(
      printed.cells.door_chest?.printed,
      row.locked ? 'Locked' : 'Open',
      `${row.id} lock`,
    );
    if (row.difficulty)
      assert.equal(printed.cells.difficulty?.printed, row.difficulty, `${row.id} difficulty`);
  }
  const text = get('procedure.open_door_or_chest').text ?? '';
  assert.match(text, /If the d6 ends up a 6, the door or chest is trapped/);
  const locked = get('procedure.locked_door_and_close').text ?? '';
  assert.match(locked, /Add \+2 Threat Level for each attempt/);
  assert.match(
    locked,
    /crowbar will increase the Threat Level \+1, but only inflicts 8\+DB Damage/,
  );
  assert.match(locked, /pick the lock which takes 2 AP/);
});

test('the Chest and Objective Chest tables match the corpus row for row', () => {
  for (const table of Object.values(CHEST_TABLES)) {
    const corpus = rows(table.cite.recordId!);
    assert.deepEqual(
      table.rows.map((r) => r.id),
      corpus.map((r) => r.id),
      table.id,
    );
    for (const row of table.rows) {
      const printed = corpus.find((r) => r.id === row.id)!;
      assert.equal(printed.cells.roll?.printed, row.printed, `${table.id} ${row.id} roll`);
      assert.equal(printed.cells.result?.printed, row.result, `${table.id} ${row.id} result`);
      const count = (tier: string) => {
        const match = new RegExp(`(\\d+) ${tier} treasure`, 'i').exec(row.result);
        return match ? Number(match[1]) : 0;
      };
      assert.equal(row.fine, count('Fine'), `${table.id} ${row.id} fine`);
      assert.equal(row.wonderful, count('Wonderful'), `${table.id} ${row.id} wonderful`);
    }
  }
  const thief = get('character.profession.thief.treasure_choice').text ?? '';
  assert.match(thief, /a thief may always draw two cards and choose which one to keep/);
});

test('enemy activation order, initiative tokens and the combat round match the corpus', () => {
  const priority = get('procedure.enemy_priority').text ?? '';
  ENEMY_PRIORITY.forEach((line, i) =>
    assert.ok(priority.includes(`${i + 1}. ${line}`), `priority ${i + 1}`),
  );
  const initiative = get('procedure.initiative').text ?? '';
  assert.match(
    initiative,
    new RegExp(`the enemy will get ${INITIATIVE.bashedDoor} more tokens than there are enemies`),
  );
  assert.match(initiative, /add another token per named monster/);
  assert.match(initiative, /one extra token of the corresponding type/);
  assert.match(initiative, /A hero on Overwatch will not contribute with a token/);
  assert.match(
    get('procedure.rest').text ?? '',
    new RegExp(`The enemies start with ${INITIATIVE.restAmbush} extra initiative tokens`),
  );
  const round = get('procedure.combat_turn').text ?? '';
  assert.match(
    round,
    /Move wandering monster\(s\)\. Refill initiative bag, removing tokens for each casualty\. Roll scenario die\./,
  );
  assert.match(round, /Remove Stunned, Parry Stance or Power Attack tokens/);
  assert.equal(COMBAT_ROUND.length, 4);
});

test('poison cadence, the permanent injury and the Lingering Trauma triggers match the corpus', () => {
  assert.match(
    get('combat.poison.checks').text ?? '',
    /at the start of its next turn, and 1d10 turns after that/,
  );
  assert.equal(
    get('character.hit_points.permanent_injury').text,
    `A hero that reaches 0 Hit Points also suffers ${INJURY.permanent}`,
  );
  assert.match(
    get('character.hit_points.party_loss').text ?? '',
    /the quest is lost and the heroes die/,
  );
  const trauma = rows('table.psychology.lingering_trauma');
  assert.deepEqual(
    LINGERING_TRAUMA.map((r) => r.id),
    trauma.map((r) => r.id),
  );
  for (const row of LINGERING_TRAUMA) {
    const printed = trauma.find((r) => r.id === row.id)!;
    assert.equal(printed.cells.roll?.printed, row.printed);
    assert.equal(printed.cells.trigger?.printed, row.trigger);
  }
  assert.match(get('core.threat.new_level_reset').text ?? '', /reset on a new level/);
});
