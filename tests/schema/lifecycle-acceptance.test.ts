import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';
import {
  lifecycleAcceptanceErrors,
  parseLifecycleManifest,
} from '../support/lifecycle-acceptance.ts';
import type { LifecycleManifest, AcceptanceReferences } from '../support/lifecycle-acceptance.ts';
const load = (path: string): unknown => parse(readFileSync(join(repoRoot, path), 'utf8'));
const manifest = parseLifecycleManifest(load('tests/fixtures/acceptance/package-f.json'));
const sections = load('corpus/source-map/sections.yaml') as { id: string }[];
const reviews = load('review/ambiguities.yaml') as { id: string }[];
const pages = load('corpus/source-map/pages.yaml') as {
  pdf_page: number;
  printed_page: number | null;
}[];
const pilot = readPilot();
const inventory = readFileSync(join(repoRoot, manifest.inventory), 'utf8');
const inventoryIds = new Set(
  [...inventory.matchAll(/^\| `(section\.[^`]+)`\s*\|/gm)].map((x) => x[1]!),
);
const refs: AcceptanceReferences = {
  inventoryIds,
  sectionIds: new Set(sections.map((x) => x.id)),
  canonicalIds: new Set(
    [pilot.procedures, pilot.rules, pilot.entities, pilot.tables, pilot.stateMachines]
      .flat()
      .map((x) => x.id),
  ),
  reviewIds: new Set(reviews.map((x) => x.id)),
  exists: (file) => existsSync(join(repoRoot, file)),
  read: (file) => readFileSync(join(repoRoot, file), 'utf8'),
  pages: new Map(pages.map((x) => [x.pdf_page, x.printed_page])),
};
const source = [
  {
    document: 'rulebook.second_printing.eng' as const,
    file: 'source/Rulebook-2nd-printing-ENGa.pdf' as const,
    pdf_page: 122,
    printed_page: 120,
    heading: 'Magic Damage',
  },
];
const synthetic = (): LifecycleManifest => ({
  package: 'F',
  status: 'accepted',
  inventory: 'docs/inventory.md',
  entries: [
    {
      section_id: 'section.example',
      disposition: 'implemented',
      scope: 'Actual event ownership and once-only recovery.',
      canonical_object_ids: ['procedure.example'],
      evidence: ['tests/example.test.ts'],
      source_limitations: ['issue.example'],
      remaining_work: [],
      notes: 'Synthetic acceptance fixture, never canonical evidence.',
      source,
      obligations: [
        {
          id: 'recovery',
          behavior: 'Apply actual recovery once for its owner.',
          disposition: 'implemented',
          canonical_object_ids: ['procedure.example'],
          tests: [{ file: 'tests/example.test.ts', name: 'does not recover twice' }],
          source,
          shared_behavior: '',
          limitations: [],
          remaining_work: [],
        },
      ],
    },
  ],
});
const syntheticRefs: AcceptanceReferences = {
  inventoryIds: new Set(['section.example']),
  sectionIds: new Set(['section.example']),
  canonicalIds: new Set(['procedure.example']),
  reviewIds: new Set(['issue.example']),
  exists: (file) => ['docs/inventory.md', 'tests/example.test.ts'].includes(file),
  read: () => "it('does not recover twice', () => {})",
  pages: new Map([[122, 120]]),
};
const questSection = 'section.quest_book_i.example_campaign.quest_1_example';
const catalogueScope = (): LifecycleManifest => {
  const manifest = synthetic();
  manifest.entries.push({
    section_id: questSection,
    disposition: 'catalogue_scope',
    scope: 'Quest catalogue records over closed shared lifecycle models.',
    canonical_object_ids: ['quest.example', 'core.example'],
    evidence: ['tests/example.test.ts'],
    source_limitations: [],
    remaining_work: [],
    shared_lifecycle_rows: ['section.example'],
    deferred_work: ['Ordered occurrence setup, objective triggers and branch outcomes.'],
    notes: 'Synthetic reduced-scope fixture; the ordered lifecycle is not modelled.',
    source,
    obligations: [
      {
        id: 'heading_behavior',
        behavior: 'Catalogue the quest objective and rewards.',
        disposition: 'catalogue_scope',
        canonical_object_ids: ['quest.example'],
        tests: [],
        source,
        shared_behavior: '',
        limitations: [],
        remaining_work: [],
      },
    ],
  });
  return manifest;
};
const catalogueRefs: AcceptanceReferences = {
  ...syntheticRefs,
  inventoryIds: new Set(['section.example', questSection]),
  sectionIds: new Set(['section.example', questSection, 'section.combat.example']),
  canonicalIds: new Set(['procedure.example', 'quest.example', 'core.example']),
};
describe('Package F source heading acceptance manifest', () => {
  it('accounts for the reconciled heading inventory with resolving behavior evidence', () => {
    expect(manifest.entries).toHaveLength(inventoryIds.size);
    expect(lifecycleAcceptanceErrors(manifest, refs)).toEqual([]);
  });
  it('final acceptance requires an accepted status and every behavior closed', () => {
    const finalErrors = lifecycleAcceptanceErrors(manifest, refs, true);
    if (manifest.status === 'accepted') expect(finalErrors).toEqual([]);
    else expect(finalErrors).toContain('Package F status is not accepted');
    expect(lifecycleAcceptanceErrors(synthetic(), syntheticRefs, true)).toEqual([]);
  });
  it.each([null, {}, { package: 'F', status: 'accepted', entries: [] }])(
    'rejects malformed runtime input %j',
    (value) => {
      expect(lifecycleAcceptanceErrors(value, syntheticRefs).length).toBeGreaterThan(0);
      expect(() => parseLifecycleManifest(value)).toThrow();
    },
  );
  it('rejects unrecognized dispositions before trusting their status', () => {
    const changed = synthetic();
    const value: unknown = {
      ...changed,
      entries: [{ ...changed.entries[0], disposition: 'done' }],
    };
    expect(lifecycleAcceptanceErrors(value, syntheticRefs)[0]).toContain('Invalid manifest');
  });
  it('rejects pending behavior independently of the real inventory progress', () => {
    const changed = synthetic();
    const row = changed.entries[0]!;
    const obligation = row.obligations[0]!;
    row.disposition = 'pending';
    row.remaining_work = ['Bind delayed result to owner'];
    obligation.disposition = 'pending';
    obligation.remaining_work = [...row.remaining_work];
    expect(lifecycleAcceptanceErrors(changed, syntheticRefs)).toContain(
      'section.example: pending extraction prevents acceptance',
    );
    row.disposition = 'source_limitation';
    obligation.disposition = 'source_limitation';
    obligation.limitations = [
      { fact: 'The book omits modifier order.', review_id: 'issue.example' },
    ];
    expect(lifecycleAcceptanceErrors(changed, syntheticRefs)).toContain(
      'section.example/recovery: implementation gap must remain pending',
    );
  });
  it('requires specific shared behavior and a review record for source limitations', () => {
    const changed = synthetic();
    const row = changed.entries[0]!;
    const obligation = row.obligations[0]!;
    row.disposition = 'covered_by_another_model';
    obligation.disposition = 'shared_model';
    expect(lifecycleAcceptanceErrors(changed, syntheticRefs)).toContain(
      'section.example/recovery: shared model must identify contributed behavior',
    );
    row.disposition = 'source_limitation';
    obligation.disposition = 'source_limitation';
    expect(lifecycleAcceptanceErrors(changed, syntheticRefs)).toContain(
      'section.example/recovery: undefined or unavailable fact needs a review record',
    );
  });
  it('rejects missing headings, duplicate rows and unsupported completed labels', () => {
    const changed = synthetic();
    changed.entries = [];
    expect(lifecycleAcceptanceErrors(changed, syntheticRefs).length).toBeGreaterThan(0);
    changed.entries = synthetic().entries;
    changed.entries.push(structuredClone(changed.entries[0]!));
    expect(lifecycleAcceptanceErrors(changed, syntheticRefs)).toContain(
      'section.example: duplicate entry',
    );
    changed.entries[0]!.obligations[0]!.disposition = 'pending';
    expect(lifecycleAcceptanceErrors(changed, syntheticRefs)).toContain(
      'section.example/recovery: unsupported completed heading disposition',
    );
  });
  it('rejects invalid references, page labels and absent named regression evidence', () => {
    const changed = synthetic();
    const row = changed.entries[0]!;
    row.canonical_object_ids = ['procedure.missing'];
    row.source_limitations = ['issue.missing'];
    row.evidence = ['../secret'];
    row.obligations[0]!.tests[0]!.name = 'imaginary regression';
    row.source = [{ ...source[0]!, printed_page: 121 }];
    const errors = lifecycleAcceptanceErrors(changed, syntheticRefs);
    expect(errors).toContain('section.example: unknown canonical object procedure.missing');
    expect(errors).toContain('section.example: unknown source limitation issue.missing');
    expect(errors).toContain('section.example: invalid evidence path ../secret');
    expect(errors).toContain('section.example: source page label does not match page map');
    expect(errors).toContain(
      'section.example/recovery: missing regression evidence tests/example.test.ts: imaginary regression',
    );
  });
});
describe('Package F catalogue scope disposition', () => {
  const quest = (manifest: LifecycleManifest) => manifest.entries[1]!;
  it('accepts a quest heading closed at catalogue scope over closed shared rows', () => {
    expect(lifecycleAcceptanceErrors(catalogueScope(), catalogueRefs, true)).toEqual([]);
    const personal = catalogueScope();
    personal.entries[1]!.section_id = 'section.backgrounds.1_example';
    const refs = {
      ...catalogueRefs,
      inventoryIds: new Set(['section.example', 'section.backgrounds.1_example']),
      sectionIds: new Set(['section.example', 'section.backgrounds.1_example']),
    };
    expect(lifecycleAcceptanceErrors(personal, refs, true)).toEqual([]);
  });
  it('rejects catalogue scope outside quest and personal-quest headings', () => {
    const changed = catalogueScope();
    quest(changed).section_id = 'section.combat.example';
    const refs = {
      ...catalogueRefs,
      inventoryIds: new Set(['section.example', 'section.combat.example']),
    };
    expect(lifecycleAcceptanceErrors(changed, refs)).toEqual([
      'section.combat.example: catalogue scope is limited to quest and personal-quest headings',
    ]);
  });
  it.each([
    ['missing', [], []],
    [
      'unresolvable',
      ['quest.missing'],
      [
        'section.quest_book_i.example_campaign.quest_1_example: unknown canonical object quest.missing',
      ],
    ],
    ['non-quest', ['core.example'], []],
  ])('rejects %s quest catalogue records', (_label, ids, extra) => {
    const changed = catalogueScope();
    quest(changed).canonical_object_ids = ids;
    quest(changed).obligations[0]!.canonical_object_ids = [];
    quest(changed).obligations[0]!.disposition = 'nonprocedural';
    expect(lifecycleAcceptanceErrors(changed, catalogueRefs)).toEqual([
      ...extra,
      `${questSection}: catalogue scope needs a resolving quest catalogue record`,
    ]);
  });
  it('rejects shared lifecycle rows that are missing, unnamed or still pending', () => {
    const changed = catalogueScope();
    quest(changed).shared_lifecycle_rows = ['section.missing'];
    expect(lifecycleAcceptanceErrors(changed, catalogueRefs)).toEqual([
      `${questSection}: unknown shared lifecycle row section.missing`,
    ]);
    quest(changed).shared_lifecycle_rows = [questSection];
    expect(lifecycleAcceptanceErrors(changed, catalogueRefs)).toEqual([
      `${questSection}: unknown shared lifecycle row ${questSection}`,
    ]);
    delete quest(changed).shared_lifecycle_rows;
    expect(lifecycleAcceptanceErrors(changed, catalogueRefs)).toEqual([
      `${questSection}: catalogue scope must name its shared lifecycle rows`,
    ]);
    quest(changed).shared_lifecycle_rows = ['section.example'];
    const shared = changed.entries[0]!;
    shared.disposition = 'pending';
    shared.remaining_work = ['Model the shared lifecycle'];
    shared.obligations[0]!.disposition = 'pending';
    shared.obligations[0]!.remaining_work = [...shared.remaining_work];
    expect(lifecycleAcceptanceErrors(changed, catalogueRefs, false)).toEqual([
      `${questSection}: shared lifecycle row section.example is pending`,
    ]);
  });
  it('requires named deferred ordered-lifecycle work', () => {
    const changed = catalogueScope();
    quest(changed).deferred_work = [];
    expect(lifecycleAcceptanceErrors(changed, catalogueRefs)).toEqual([
      `${questSection}: catalogue scope must name its deferred ordered-lifecycle work`,
    ]);
    quest(changed).deferred_work = ['  '];
    expect(lifecycleAcceptanceErrors(changed, catalogueRefs)).toEqual([
      `${questSection}: catalogue scope must name its deferred ordered-lifecycle work`,
    ]);
    delete quest(changed).deferred_work;
    expect(lifecycleAcceptanceErrors(changed, catalogueRefs)).toEqual([
      `${questSection}: catalogue scope must name its deferred ordered-lifecycle work`,
    ]);
  });
  it('keeps remaining work pending instead of closing at catalogue scope', () => {
    const changed = catalogueScope();
    quest(changed).remaining_work = ['Reconcile branch outcomes'];
    expect(lifecycleAcceptanceErrors(changed, catalogueRefs)).toEqual([
      `${questSection}: catalogue scope cannot carry remaining work; keep the row pending`,
      `${questSection}: pending extraction prevents acceptance`,
    ]);
  });
  it('confines catalogue scope fields and behavior to catalogue scope headings', () => {
    const changed = catalogueScope();
    const shared = changed.entries[0]!;
    shared.deferred_work = ['Not a catalogue row'];
    shared.obligations[0]!.disposition = 'catalogue_scope';
    const errors = lifecycleAcceptanceErrors(changed, catalogueRefs);
    expect(errors).toContain('section.example: deferred lifecycle fields require catalogue scope');
    expect(errors).toContain(
      'section.example/recovery: catalogue scope behavior requires a catalogue scope heading',
    );
  });
});
