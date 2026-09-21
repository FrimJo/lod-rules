import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse, stringify } from 'yaml';
import { describe, expect, it } from 'vitest';
import { createAjv, getValidator, repoRoot } from '../../scripts/validate/schemas.ts';
import { discoverPilotFiles, readPilot } from '../../scripts/validate/pilot-files.ts';
import { checkPilotIntegrity, type PilotContext } from '../../scripts/validate/pilot.ts';
import type {
  Pilot,
  Rule,
  Table,
  Procedure,
  TestCase,
} from '../../scripts/validate/pilot-types.ts';
import { renderCoverageReport } from '../../scripts/reports/render-coverage.ts';

const pilot = readPilot();
const ajv = createAjv();
const read = (file: string): unknown => parse(readFileSync(join(repoRoot, file), 'utf8'));
const manifest = read('source/manifest.yaml') as {
  documents: PilotContext['documents'];
  external_sources: Array<{ id: string }>;
};
const context: PilotContext = {
  map: {
    sections: read('corpus/source-map/sections.yaml') as PilotContext['map']['sections'],
    pages: read('corpus/source-map/pages.yaml') as PilotContext['map']['pages'],
    coverage: (
      read('corpus/source-map/coverage.yaml') as { sections: PilotContext['map']['coverage'] }
    ).sections,
    externalSourceIds: manifest.external_sources.map((d) => d.id),
  },
  terms: read('corpus/glossary/terms.yaml') as PilotContext['terms'],
  issues: read('review/ambiguities.yaml') as PilotContext['issues'],
  documents: manifest.documents,
  externalIds: manifest.external_sources.map((d) => d.id),
};
const firstRule = () => structuredClone(pilot.rules[0] as Rule);
const firstTable = () =>
  structuredClone(pilot.tables.find((t) => t.id === 'table.character.level_progression') as Table);
const firstProcedure = () =>
  structuredClone(pilot.procedures.find((p) => p.id === 'procedure.dungeon_turn') as Procedure);

describe('strict pilot schemas', () => {
  it.each(Object.keys(pilot) as Array<keyof Pilot>)('validates all %s files', (kind) => {
    expect(getValidator(ajv, kind)(pilot[kind])).toBe(true);
  });
  it.each([
    { source: [] },
    { source: [{ document: 'rulebook.second_printing.eng' }] },
    { effects: [{ type: 'eval', expression: 'target + 10' }] },
    { effects: [{ type: 'set', target: 'x', value: { type: 'literal', value: null } }] },
    { invented: true },
    { status: 'confirmed' },
    { fields: { x: { type: 'number', role: 'input' } } },
  ])('rejects invalid or prose-only mechanics %j', (change) => {
    expect(getValidator(ajv, 'rules')([{ ...firstRule(), ...change }])).toBe(false);
  });
  it('requires precise nested provenance when a step overrides inheritance', () => {
    const procedure = firstProcedure();
    procedure.steps[0]!.source = [];
    expect(getValidator(ajv, 'procedures')([procedure])).toBe(false);
  });
  it('rejects invalid dice and absent partial-table selection', () => {
    const table = firstTable();
    table.rows[1]!.cells.hit_point_increase = {
      type: 'dice',
      printed: '+0d2',
      dice: { count: 0, sides: 2 },
      meaning: 'increase',
    };
    expect(getValidator(ajv, 'tables')([table])).toBe(false);
    const partial = { ...firstTable(), completeness: 'partial' };
    expect(getValidator(ajv, 'tables')([partial])).toBe(false);
  });
  it('requires exactly one fixture execution target and explicit expectation structure', () => {
    const fixture = structuredClone(pilot.testCases[0]) as TestCase;
    fixture.procedure_id = 'procedure.dungeon_turn';
    expect(getValidator(ajv, 'testCases')([fixture])).toBe(false);
    delete fixture.rule_ids;
    expect(getValidator(ajv, 'testCases')([fixture])).toBe(true);
    delete fixture.procedure_id;
    expect(getValidator(ajv, 'testCases')([fixture])).toBe(false);
  });
});

type Mutation = (data: Pilot) => void;
const badCases: Array<[string, Mutation, string]> = [
  [
    'duplicate global IDs',
    (data) => data.rules.push(structuredClone(data.rules[0]!)),
    'duplicate global id',
  ],
  [
    'dangling section',
    (data) => {
      data.rules[0]!.section_id = 'section.missing';
    },
    'unknown reference',
  ],
  [
    'mistyped entity rule',
    (data) => {
      data.entities[0]!.rules = ['term.battle'];
    },
    'wrong reference kind',
  ],
  [
    'wrong document file',
    (data) => {
      data.rules[0]!.source[0]!.file = 'source/wrong.pdf';
    },
    'source file',
  ],
  [
    'mismatched folio',
    (data) => {
      data.rules[0]!.source[0]!.printed_page = 999;
    },
    'printed/pdf page mismatch',
  ],
  [
    'missing physical page',
    (data) => {
      data.rules[0]!.source[0]!.pdf_page = 999;
    },
    'unknown pdf page',
  ],
  [
    'external book as extracted evidence',
    (data) => {
      data.rules[0]!.source[0]!.document = 'bestiary';
    },
    'unavailable source',
  ],
  [
    'undeclared target',
    (data) => {
      data.rules[0]!.effects = [
        { type: 'set', target: 'missing', value: { type: 'literal', value: 1 } },
      ];
    },
    'undeclared field',
  ],
  [
    'undeclared operand',
    (data) => {
      data.rules[0]!.effects = [
        { type: 'set', target: 'outcome', value: { type: 'field', name: 'missing' } },
      ];
    },
    'undeclared field',
  ],
  [
    'effect type mismatch',
    (data) => {
      data.rules[0]!.effects = [
        { type: 'set', target: 'outcome', value: { type: 'literal', value: 1 } },
      ];
    },
    'effect operand type mismatch',
  ],
  [
    'input writes',
    (data) => {
      data.rules[0]!.effects = [
        { type: 'set', target: 'roll', value: { type: 'literal', value: 1 } },
      ];
      data.rules[0]!.fields.roll = { type: 'number', role: 'input', description: 'roll' };
    },
    'cannot write input',
  ],
  [
    'missing dependency',
    (data) => {
      data.rules[0]!.effects = [{ type: 'ignore', dependency: 'missing' }];
    },
    'unknown dependency key',
  ],
  [
    'reversed effect range',
    (data) => {
      const r = data.rules.find((r) => r.id === 'character.talent.axeman.bloodlust')!;
      r.effects = [{ type: 'replace_range', dependency: 'bloodlust', range: { min: 10, max: 1 } }];
    },
    'reversed range',
  ],
  [
    'override cycle',
    (data) => {
      data.rules[0]!.overrides = [data.rules[1]!.id];
      data.rules[1]!.overrides = [data.rules[0]!.id];
    },
    'override cycle',
  ],
  [
    'unknown usage issue',
    (data) => {
      data.rules[0]!.usage_limits = [
        {
          count: 1,
          window: 'between_settlement_visits',
          subject: 'skill_increase',
          aggregation_issue: 'issue.missing',
        },
      ];
    },
    'unknown reference',
  ],
  [
    'untyped sum',
    (data) => {
      data.rules[0]!.effects = [
        {
          type: 'set',
          target: 'outcome',
          value: {
            type: 'sum',
            values: [
              { type: 'literal', value: 'x' },
              { type: 'literal', value: 1 },
            ],
          },
        },
      ];
    },
    'sum requires numbers',
  ],
  [
    'missing cell',
    (data) => {
      delete data.tables.find((t) => t.id === 'table.character.alchemist_skills')!.rows[0]!.cells
        .left_skill;
    },
    'incorrect columns',
  ],
  [
    'extra cell',
    (data) => {
      data.tables.find(
        (t) => t.id === 'table.character.alchemist_skills',
      )!.rows[0]!.cells.invented = { type: 'text', printed: 'x' };
    },
    'incorrect columns',
  ],
  [
    'wrong column type',
    (data) => {
      data.tables.find(
        (t) => t.id === 'table.character.alchemist_skills',
      )!.rows[0]!.cells.left_skill = {
        type: 'number',
        printed: '1',
        value: 1,
        meaning: 'value',
      };
    },
    'invalid cell type',
  ],
  [
    'changed printed value',
    (data) => {
      data.tables.find(
        (t) => t.id === 'table.character.alchemist_skills',
      )!.rows[0]!.cells.left_modifier = {
        type: 'number',
        printed: '-5',
        value: 5,
        meaning: 'modifier',
      };
    },
    'printed numeric value mismatch',
  ],
  [
    'changed printed dice',
    (data) => {
      data.tables.find(
        (t) => t.id === 'table.character.level_progression',
      )!.rows[1]!.cells.hit_point_increase = {
        type: 'dice',
        printed: '+1d6',
        dice: { count: 1, sides: 2 },
        meaning: 'increase',
      };
    },
    'printed dice mismatch',
  ],
  [
    'incorrect unavailable marker',
    (data) => {
      data.tables.find(
        (t) => t.id === 'table.character.alchemist_skills',
      )!.rows[0]!.cells.left_modifier = {
        type: 'marker',
        printed: 'N/A',
        meaning: 'no_increase',
      };
    },
    'marker meaning mismatch',
  ],
  [
    'incomplete partial selection',
    (data) => {
      const table = data.tables.find((t) => t.id === 'table.character.alchemist_skills')!;
      table.completeness = 'partial';
      table.selection = [];
    },
    'partial selection',
  ],
  [
    'invalid local step',
    (data) => {
      data.procedures[0]!.entry_step = 'missing';
    },
    'invalid entry/exit',
  ],
  [
    'duplicate nested step',
    (data) => {
      const p = data.procedures.find((p) => p.id === 'procedure.dungeon_turn')!;
      p.steps[0]!.substeps![0]!.id = p.steps[0]!.id;
    },
    'duplicate local id',
  ],
  [
    'wrong step rule kind',
    (data) => {
      data.procedures[0]!.steps[0]!.rule_refs = ['term.battle'];
    },
    'wrong reference kind',
  ],
  [
    'unknown fixture step',
    (data) => {
      data.testCases[0]!.expected.steps = ['missing'];
    },
    'unknown expected step',
  ],
  [
    'wrong fixture input type',
    (data) => {
      data.testCases[0]!.inputs.armour_tier = 'three';
    },
    'fixture field type mismatch',
  ],
  [
    'unknown fixture input',
    (data) => {
      data.testCases[0]!.inputs.invented = 1;
    },
    'undeclared fixture field',
  ],
];
describe('pilot integrity', () => {
  it('accepts the canonical pilot', () => expect(checkPilotIntegrity(pilot, context)).toEqual([]));
  it.each(badCases)('rejects %s', (_name, mutate, error) => {
    const data = structuredClone(pilot);
    mutate(data);
    expect(checkPilotIntegrity(data, context).join('\n')).toContain(error);
  });
  it('checks file identity on pre-existing glossary provenance too', () => {
    const altered = structuredClone(context);
    Object.assign(altered.terms[0]!.source[0]!, { file: 'source/wrong.pdf' });
    expect(checkPilotIntegrity(pilot, altered).join('\n')).toContain('source file');
  });
});

describe('file discovery and entity coverage', () => {
  it('discovers nested files in stable order and aggregates a schema across files', () => {
    const root = mkdtempSync(join(tmpdir(), 'lod-pilot-test-'));
    try {
      mkdirSync(join(root, 'corpus/rules/nested'), { recursive: true });
      writeFileSync(join(root, 'corpus/rules/z.yaml'), stringify([pilot.rules[0]]));
      writeFileSync(join(root, 'corpus/rules/nested/a.yaml'), stringify([pilot.rules[1]]));
      expect(discoverPilotFiles(root).map((f) => f.path)).toEqual([
        'corpus/rules/nested/a.yaml',
        'corpus/rules/z.yaml',
      ]);
      expect(readPilot(root).rules.map((r) => r.id)).toEqual([
        pilot.rules[1]!.id,
        pilot.rules[0]!.id,
      ]);
      writeFileSync(join(root, 'corpus/rules/nested/b.yaml'), '[{}]');
      expect(() => readPilot(root)).toThrow('nested/b.yaml');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
  it('reports completed, partial, and unassessed entity components conservatively', () => {
    const report = renderCoverageReport({
      sections: [
        { id: 'section.a', status: 'extracted', components: { entities: 'extracted' } },
        { id: 'section.b', status: 'extracting', components: { entities: 'extracting' } },
        { id: 'section.c', status: 'mapped' },
      ],
    });
    expect(report).toContain('| entities | 1 | 2 | 0 |');
  });
});

describe('fixture and procedure contract boundaries', () => {
  it('does not let an expected output hide an invalid input of the same name', () => {
    const data = structuredClone(pilot);
    const fixture = data.testCases.find((t) => t.id === 'test.check.equal')!;
    fixture.inputs.roll = 'fifty';
    fixture.expected.state.roll = 50;
    expect(checkPilotIntegrity(data, context).join('\n')).toContain(
      'fixture field type mismatch roll',
    );
  });
  it('validates procedure fields needed by referenced rules', () => {
    const data = structuredClone(pilot);
    delete data.procedures.find((p) => p.id === 'procedure.thief_treasure_choice')!.fields
      .chosen_card;
    expect(checkPilotIntegrity(data, context).join('\n')).toContain(
      'referenced rule field mismatch chosen_card',
    );
  });
});
