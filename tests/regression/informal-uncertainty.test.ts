import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  loadReviewSnapshot,
  readReviewRecords,
  type ReviewRecord,
} from '../../scripts/validate/independent-review.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';
import {
  checkInformalUncertainty,
  families,
  familyCoverageProblems,
  findingCandidates,
  informalUncertaintyContext,
  markdownCandidates,
  rulingKey,
  uninventoriedCandidates,
  yamlNoteCandidates,
  type Family,
  type InformalUncertaintyContext,
  type InformalUncertaintyInventory,
  type InventoryEntry,
} from '../support/informal-uncertainty.ts';

const fixtureDirectory = 'tests/fixtures/informal-uncertainty';
const issueIds = new Set(['issue.known']);
const readFixture = (family: Family): unknown =>
  JSON.parse(readFileSync(join(repoRoot, fixtureDirectory, `${family}.json`), 'utf8'));
const texts = (candidates: { text: string }[]): string[] => candidates.map((c) => c.text);

describe('informal-uncertainty candidate discovery (#22)', () => {
  it('finds markdown blocks by keyword, ignoring backticked values and fenced code', () => {
    const markdown = [
      '# Ledger',
      '## Unit',
      '- The page is unclear about the',
      '  order of the rolls.',
      '- Set `status: unresolved` on the row.',
      '- Nothing to see.',
      '',
      '```',
      'unclear inside a fence',
      '```',
      '| unit | unresolved boundary |',
    ].join('\n');
    const found = markdownCandidates('docs/ledgers/x.md', markdown, 'ledger', issueIds);
    expect(texts(found)).toEqual([
      '- The page is unclear about the\n  order of the rolls.',
      '| unit | unresolved boundary |',
    ]);
    expect(found[0]!.locator).toEqual({ file: 'docs/ledgers/x.md', heading: 'Ledger > Unit' });
  });

  it('takes every block under an anchor heading, and exempts pointers to existing issues', () => {
    const markdown = [
      '## combat (2 open)',
      '- Shield wording.',
      '- Parry wording, now `issue.known`.',
      '- Dodge wording, see `issue.gone`.',
      '## Closed',
      '- Done.',
    ].join('\n');
    expect(texts(markdownCandidates('l.md', markdown, 'ledger', issueIds))).toEqual([
      '- Shield wording.',
      '- Dodge wording, see `issue.gone`.',
    ]);
  });

  it('anchors a list on a lead-in paragraph and keeps checkpoint carry-over pointers', () => {
    const markdown = [
      '## Next unit',
      'Phase 9 next.',
      '',
      'Open carry-overs:',
      '',
      '- Hate citation.',
      '- Activation details, `issue.known`.',
      '',
      'After the list.',
    ].join('\n');
    const checkpoint = markdownCandidates('c.md', markdown, 'checkpoint', issueIds);
    expect(texts(checkpoint)).toEqual(['- Hate citation.', '- Activation details, `issue.known`.']);
    expect(checkpoint[0]!.locator).toEqual({
      file: 'c.md',
      heading: 'Next unit > Open carry-overs',
    });
    expect(texts(markdownCandidates('l.md', markdown, 'ledger', issueIds))).toEqual([
      '- Hate citation.',
    ]);
  });

  it('scans only free-text YAML fields, locating them by record and field path', () => {
    const yaml = [
      {
        id: 'procedure.x',
        source_text: 'The order is unclear.',
        name: 'unclear rolls',
        notes: 'The book does not say when.',
        fields: { cost: { description: 'Its cost is unresolved, not zero.' } },
        steps: [{ id: 'step.a', notes: 'Unclear, see issue.known.' }],
        unresolved_references: ['Timing is not specified.'],
      },
    ];
    expect(yamlNoteCandidates('corpus/p.yaml', yaml, issueIds).map((c) => c.locator)).toEqual([
      { file: 'corpus/p.yaml', record: 'procedure.x', field: 'notes' },
      { file: 'corpus/p.yaml', record: 'procedure.x', field: 'fields.cost.description' },
      { file: 'corpus/p.yaml', record: 'procedure.x', field: 'unresolved_references[0]' },
    ]);
  });

  it('takes no_change_needed findings that state a doubt and cite no existing issue', () => {
    const finding = (
      description: string,
      status: 'no_change_needed' | 'corrected',
      object_id?: string,
    ) => ({
      kind: 'ok_with_note',
      section_id: 'section.x',
      object_id,
      description,
      source: [],
      disposition: status === 'corrected' ? { status, change: 'fixed' } : { status },
    });
    const record = {
      id: 'review.x.1',
      findings: [
        finding('The order is ambiguous.', 'no_change_needed'),
        finding('The order is ambiguous.', 'corrected'),
        finding('Ambiguous; see issue.known.', 'no_change_needed'),
        finding('Matches the page.', 'no_change_needed'),
        finding(
          'New issue; the doubt is unresolved in the book.',
          'no_change_needed',
          'issue.known',
        ),
        finding('The order is ambiguous.', 'no_change_needed', 'issue.missing'),
      ],
    } as unknown as ReviewRecord;
    expect(findingCandidates([record], issueIds).map((c) => c.locator)).toEqual([
      { record: 'review.x.1', finding: 0 },
      { record: 'review.x.1', finding: 5 },
    ]);
  });

  it('assigns every scanned source file to exactly one family', () => {
    expect(familyCoverageProblems()).toEqual([]);
  });
});

describe('informal-uncertainty checker rules (#22)', () => {
  const ledger = '## Unit\n- The roll order is unclear.\n- The cost is unresolved.\n';
  const context: InformalUncertaintyContext = {
    candidates: {
      ...(Object.fromEntries(Object.keys(families).map((family) => [family, []])) as Record<
        Family,
        never[]
      >),
      'ledger-core': markdownCandidates('docs/ledgers/a.md', ledger, 'ledger', issueIds),
    },
    issueIds,
    reviewIds: new Set(['review.unit.1']),
    rulingDocuments: new Map([
      ['vonbraus.changelog_2_2x', 'official_errata'],
      ['vonbraus.faq_gamefound', 'official_faq'],
    ]),
    citedRulings: new Set([rulingKey('vonbraus.changelog_2_2x', '2.21', 83)]),
  };
  const locator = { file: 'docs/ledgers/a.md', heading: 'Unit' };
  const inventory: InformalUncertaintyInventory = {
    description: 'test',
    entries: [
      {
        id: 'informal.a.order',
        source_kind: 'ledger',
        locator,
        excerpt: 'roll order is unclear',
        disposition: 'recorded',
        issues: ['issue.known'],
      },
      {
        id: 'informal.a.cost',
        source_kind: 'ledger',
        locator,
        excerpt: 'cost is unresolved',
        disposition: 'resolved',
        evidence: [
          { review: 'review.unit.1' },
          { document: 'vonbraus.changelog_2_2x', heading: '2.21', row: 83 },
        ],
      },
    ],
  };
  const check = (value: unknown): string[] =>
    checkInformalUncertainty('ledger-core', value, context);
  const withEntry = (index: number, change: (entry: InventoryEntry) => void): unknown => {
    const copy = structuredClone(inventory);
    change(copy.entries[index]!);
    return copy;
  };
  const fires = (value: unknown, pattern: RegExp): void => {
    const problems = check(value);
    expect(
      problems.some((problem) => pattern.test(problem)),
      problems.join('\n'),
    ).toBe(true);
  };

  it('accepts a complete inventory', () => {
    expect(check(inventory)).toEqual([]);
  });

  it('a candidate that no entry inventories', () => {
    const copy = structuredClone(inventory);
    copy.entries.pop();
    fires(copy, /^not inventoried: .*cost is unresolved/);
    expect(uninventoriedCandidates('ledger-core', copy, context).map((c) => c.text)).toEqual([
      '- The cost is unresolved.',
    ]);
  });

  it('an entry whose note is gone or whose locator is wrong', () => {
    fires(
      withEntry(0, (entry) => (entry.excerpt = 'no longer there')),
      /informal\.a\.order: matches no candidate/,
    );
    fires(
      withEntry(0, (entry) => (entry.locator = { ...locator, heading: 'Other' })),
      /informal\.a\.order: matches no candidate/,
    );
  });

  it('an excerpt that matches several notes', () => {
    fires(
      withEntry(0, (entry) => (entry.excerpt = 'The')),
      /excerpt matches 2 candidates/,
    );
  });

  it('two entries that claim the same note', () => {
    fires(
      withEntry(1, (entry) => (entry.excerpt = 'roll order')),
      /informal\.a\.order, informal\.a\.cost: claim the same note/,
    );
  });

  it('a duplicate id', () => {
    fires(
      withEntry(1, (entry) => (entry.id = 'informal.a.order')),
      /duplicate id/,
    );
  });

  it('an entry in the wrong family', () => {
    fires(
      withEntry(0, (entry) => (entry.source_kind = 'doc')),
      /source_kind doc does not belong in family ledger-core/,
    );
  });

  it('wrong fields for the disposition', () => {
    fires(
      withEntry(0, (entry) => delete entry.issues),
      /inventory .*issues/,
    );
    fires(
      withEntry(0, (entry) => (entry.reason = 'also a reason')),
      /inventory .*reason/,
    );
    fires(
      withEntry(1, (entry) => {
        entry.disposition = 'not_uncertainty';
      }),
      /inventory .*reason/,
    );
  });

  it('a locator of the wrong shape for its source kind', () => {
    fires(
      withEntry(0, (entry) => (entry.locator = { record: 'review.unit.1', finding: 0 })),
      /inventory .*locator/,
    );
  });

  it('an issue id that does not resolve', () => {
    fires(
      withEntry(0, (entry) => (entry.issues = ['issue.gone'])),
      /issue issue\.gone is not in review\/ambiguities\.yaml/,
    );
  });

  it('a review record that does not exist', () => {
    fires(
      withEntry(1, (entry) => (entry.evidence = [{ review: 'review.unit.9' }])),
      /review record review\.unit\.9 does not exist/,
    );
  });

  it('a ruling that is not official, has no changelog row, or is cited nowhere', () => {
    const ruling = (evidence: object) =>
      withEntry(1, (entry) => (entry.evidence = [evidence as never]));
    fires(ruling({ document: 'vonbraus.qrs_2_5', heading: 'Combat' }), /not official_errata/);
    fires(ruling({ document: 'vonbraus.changelog_2_2x', heading: '2.21' }), /names no row/);
    fires(
      ruling({ document: 'vonbraus.changelog_2_2x', heading: '2.21', row: 84 }),
      /2\.21 #84 is cited by no source reference/,
    );
    fires(
      ruling({ document: 'vonbraus.faq_gamefound', heading: 'Is it so?' }),
      /Is it so\? is cited by no source reference/,
    );
  });

  it('an id that encodes a page number', () => {
    fires(
      withEntry(0, (entry) => (entry.id = 'informal.a.p107')),
      /encodes a page number/,
    );
  });
});

describe('informal-uncertainty inventory against the repository (#22)', () => {
  let context: InformalUncertaintyContext;
  beforeAll(() => {
    context = informalUncertaintyContext(loadReviewSnapshot(), readReviewRecords());
  }, 60_000);

  it('holds only family fixtures and the schema', () => {
    const known = new Set([...Object.keys(families).map((f) => `${f}.json`), 'family.schema.json']);
    const stray = readdirSync(join(repoRoot, fixtureDirectory)).filter((name) => !known.has(name));
    expect(stray).toEqual([]);
  });

  it('cites changelog rulings the corpus already records', () => {
    expect(context.citedRulings.has(rulingKey('vonbraus.changelog_2_2x', '2.21', 83))).toBe(true);
  });

  const audited = (Object.keys(families) as Family[]).filter((family) =>
    existsSync(join(repoRoot, fixtureDirectory, `${family}.json`)),
  );
  // A family is audited once its fixture exists; until then its notes are not checked. To list a
  // family's work, add `<family>.json` with no entries: the failure lists every candidate.
  for (const family of audited)
    it(`family ${family}: every candidate is inventoried and every entry resolves`, () => {
      expect(checkInformalUncertainty(family, readFixture(family), context)).toEqual([]);
    });

  it('uses each entry id once across families', () => {
    const ids = audited.flatMap((family) =>
      (readFixture(family) as InformalUncertaintyInventory).entries.map((entry) => entry.id),
    );
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });
});
