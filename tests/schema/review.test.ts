import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { createAjv, getValidator, repoRoot } from '../../scripts/validate/schemas.ts';
import {
  checkGlossaryIntegrity,
  checkIntegrity,
  type Glossary,
  type Issue,
  type SourceMap,
} from '../../scripts/validate/integrity.ts';
import { checkPilotIntegrity, type PilotContext } from '../../scripts/validate/pilot.ts';
import { readPilot } from '../../scripts/validate/pilot-files.ts';
import { renderCoverageReport } from '../../scripts/reports/render-coverage.ts';

const read = (path: string): unknown => parse(readFileSync(join(repoRoot, path), 'utf8'));
const pilot = readPilot();
const manifest = read('source/manifest.yaml') as {
  documents: PilotContext['documents'];
  external_sources: Array<{ id: string }>;
};
const map: SourceMap = {
  sections: read('corpus/source-map/sections.yaml') as SourceMap['sections'],
  pages: read('corpus/source-map/pages.yaml') as SourceMap['pages'],
  coverage: (read('corpus/source-map/coverage.yaml') as { sections: SourceMap['coverage'] })
    .sections,
  externalSourceIds: manifest.external_sources.map((d) => d.id),
};
const context: PilotContext = {
  map,
  terms: read('corpus/glossary/terms.yaml') as PilotContext['terms'],
  issues: read('review/ambiguities.yaml') as Issue[],
  documents: manifest.documents,
  externalIds: map.externalSourceIds,
};
const glossary: Glossary = {
  terms: context.terms,
  aliases: read('corpus/glossary/aliases.yaml') as Glossary['aliases'],
  issues: context.issues,
  documentIds: [...manifest.documents.map((d) => d.id), ...context.externalIds],
  canonicalDocumentId: 'rulebook.second_printing.eng',
  additionalRelatedIds: Object.values(pilot).flatMap((entries: Array<{ id: string }>) =>
    entries.map((entry) => entry.id),
  ),
};
const resolved = context.issues.find((issue) => issue.id === 'issue.0005')!;
const validate = getValidator(createAjv(), 'issues');

describe('issue resolutions', () => {
  it('retains all eleven IDs, with six evidenced resolutions and five open questions', () => {
    expect(context.issues.map((issue) => issue.id)).toEqual(
      Array.from({ length: 11 }, (_, i) => `issue.${String(i + 1).padStart(4, '0')}`),
    );
    expect(
      context.issues.filter((issue) => issue.status === 'resolved').map((issue) => issue.id),
    ).toEqual(['issue.0002', 'issue.0003', 'issue.0005', 'issue.0007', 'issue.0008', 'issue.0011']);
    expect(validate(context.issues)).toBe(true);
  });
  it.each([
    { resolution: undefined },
    { resolution: { summary: '', source: resolved.source } },
    { resolution: { summary: 'Resolved.', source: [] } },
    { resolution: { summary: 'Resolved.', source: [{}] } },
    { resolution: { summary: 'Resolved.', source: resolved.source, invented: true } },
    { status: 'unresolved' },
    { status: 'closed' },
  ])('rejects invalid resolution structure %j', (change) => {
    expect(validate([{ ...resolved, ...change }])).toBe(false);
  });
  it.each([
    ['document', 'missing', 'unknown document'],
    ['pdf_page', 999, 'unknown pdf page'],
    ['printed_page', 999, 'page mismatch'],
  ])('validates resolution %s provenance', (field, value, error) => {
    const data = structuredClone(glossary);
    const issue = data.issues.find((entry) => entry.id === resolved.id)!;
    if (issue.status !== 'resolved') throw new Error('Expected resolved issue');
    Object.assign(issue.resolution.source[0]!, { [field]: value });
    expect(checkGlossaryIntegrity(data, map).join('\n')).toContain(error);
  });
  it('validates resolution file identity', () => {
    const data = structuredClone(context);
    const issue = data.issues.find((entry) => entry.id === resolved.id)!;
    if (issue.status !== 'resolved') throw new Error('Expected resolved issue');
    issue.resolution.source[0]!.file = 'source/wrong.pdf';
    expect(checkPilotIntegrity(pilot, data).join('\n')).toContain('source file');
  });
  it('allows historical references to resolved issues', () => {
    expect(pilot.rules.find((rule) => rule.id === 'core.check.success')!.issues).toContain(
      resolved.id,
    );
    expect(checkPilotIntegrity(pilot, context)).toEqual([]);
  });
  it.each(['effect', 'aggregation', 'expectation'])('rejects resolved issue in %s', (kind) => {
    const data = structuredClone(pilot);
    if (kind === 'effect') data.rules[0]!.effects = [{ type: 'unresolved', issue_id: resolved.id }];
    if (kind === 'aggregation')
      data.rules.find((rule) => rule.usage_limits)!.usage_limits![0]!.aggregation_issue =
        resolved.id;
    if (kind === 'expectation') data.testCases[0]!.expected.unresolved = [resolved.id];
    expect(checkPilotIntegrity(data, context).join('\n')).toContain('requires an open issue');
  });
});

function redirectMap(): SourceMap {
  const canonical = {
    id: 'section.table',
    title: 'Table',
    kind: 'table',
    printed_start_page: 9,
    printed_end_page: 9,
    pdf_start_page: 1,
    pdf_end_page: 1,
  };
  return {
    sections: [canonical, { ...canonical, id: 'section.old', redirect_to: canonical.id }],
    pages: [{ pdf_page: 1, printed_page: 9, section_id: 'section.old' }],
    coverage: [
      { id: canonical.id, status: 'extracting', components: { tables: 'extracting' } },
      {
        id: 'section.old',
        status: 'mapped',
        components: Object.fromEntries(
          ['glossary', 'rules', 'tables', 'examples', 'procedures', 'entities'].map((key) => [
            key,
            'not_applicable',
          ]),
        ),
      },
    ],
    externalSourceIds: [],
    documentPageCount: 1,
  };
}

describe('source-map compatibility redirects', () => {
  it('accepts schema and preserves references to a legacy ID', () => {
    const data = redirectMap();
    expect(getValidator(createAjv(), 'sections')(data.sections)).toBe(true);
    expect(checkIntegrity(data)).toEqual([]);
  });
  const cases: Array<[string, (data: SourceMap) => void, string]> = [
    [
      'missing target',
      (d) => {
        d.sections[1]!.redirect_to = 'section.missing';
      },
      'unknown redirect target',
    ],
    [
      'self redirect',
      (d) => {
        d.sections[1]!.redirect_to = 'section.old';
      },
      'self redirect',
    ],
    [
      'cycle',
      (d) => {
        d.sections[0]!.redirect_to = 'section.old';
      },
      'redirect chain or cycle',
    ],
    [
      'chain',
      (d) => {
        d.sections.push({ ...d.sections[0]!, id: 'section.older', redirect_to: 'section.old' });
      },
      'redirect chain or cycle',
    ],
    [
      'different kind',
      (d) => {
        d.sections[1]!.kind = 'subsection';
      },
      'redirect kind mismatch',
    ],
    [
      'different printed span',
      (d) => {
        d.sections[1]!.printed_end_page = 10;
      },
      'redirect page span mismatch',
    ],
    [
      'different PDF span',
      (d) => {
        d.sections[1]!.pdf_end_page = 2;
      },
      'redirect page span mismatch',
    ],
    [
      'missing coverage',
      (d) => {
        d.coverage.pop();
      },
      'no entry for section',
    ],
    [
      'coverage credit',
      (d) => {
        d.coverage[1]!.status = 'extracted';
      },
      'redirect coverage',
    ],
    [
      'remaining work',
      (d) => {
        d.coverage[1]!.components!.tables = 'mapped';
      },
      'redirect coverage',
    ],
  ];
  it.each(cases)('rejects %s', (_label, mutate, error) => {
    const data = redirectMap();
    mutate(data);
    expect(checkIntegrity(data).join('\n')).toContain(error);
  });
  it('excludes redirects from every progress count and remaining-work list', () => {
    const report = renderCoverageReport(
      {
        sections: [
          { id: 'section.table', status: 'extracting', components: { tables: 'extracting' } },
          { id: 'section.old', status: 'mapped', components: { tables: 'not_applicable' } },
        ],
      },
      [
        { id: 'section.table', title: 'Table', kind: 'table' },
        { id: 'section.old', title: 'Old table', kind: 'table', redirect_to: 'section.table' },
      ],
    );
    expect(report).toContain('| mapped | 1 / 1 | 100% |');
    expect(report).toContain('| table | 1 |');
    expect(report).toContain('| tables | 0 | 1 | 0 |');
    expect(report).toContain('| section.old | section.table |');
    expect(report).not.toContain('| section.old | Old table |');
  });
  it('keeps the canonical pilot tables partial and maps the wandering-monster dependency', () => {
    const redirects = map.sections.filter((section) => section.redirect_to);
    expect(redirects).toHaveLength(3);
    expect(checkIntegrity(map)).toEqual([]);
    for (const section of redirects) {
      expect(
        pilot.tables.find((table) => table.section_id === section.redirect_to)?.completeness,
      ).toBe('partial');
    }
    const procedure = pilot.procedures.find((entry) => entry.id === 'procedure.dungeon_turn')!;
    const target = procedure.dependencies.find(
      (dep) => dep.key === 'wandering_monsters',
    )!.section_id;
    expect(map.sections.find((section) => section.id === target)).toMatchObject({
      title: 'Wandering Monsters',
      printed_start_page: 90,
      pdf_start_page: 92,
    });
    expect(map.coverage.find((entry) => entry.id === target)?.status).toBe('mapped');
  });
});
