import { describe, expect, it } from 'vitest';
import { validateCorpus } from '../../scripts/validate/corpus.ts';
import { renderCoverageReport } from '../../scripts/reports/render-coverage.ts';

describe('corpus validation', () => {
  it('passes against the committed source map', () => {
    const { errors, filesChecked } = validateCorpus();
    expect(errors).toEqual([]);
    expect(filesChecked).toBe(4);
  });
});

describe('coverage report', () => {
  it('reports zero coverage when no sections are tracked', () => {
    const report = renderCoverageReport({ sections: [] });
    expect(report).toContain('| mapped | 0 / 0 | 0% |');
    expect(report).toContain('No sections are tracked yet.');
  });

  it('counts a reviewed section toward mapped and extracted as well', () => {
    const report = renderCoverageReport({
      sections: [
        { id: 'section.game_basics', status: 'reviewed' },
        { id: 'section.combat', status: 'not_started' },
      ],
    });
    expect(report).toContain('| mapped | 1 / 2 | 50% |');
    expect(report).toContain('| extracted | 1 / 2 | 50% |');
    expect(report).toContain('| reviewed | 1 / 2 | 50% |');
    expect(report).toContain('- section.combat');
  });

  it('counts nodes by kind from the section tree', () => {
    const report = renderCoverageReport(
      {
        sections: [
          { id: 'section.combat', status: 'mapped' },
          { id: 'section.combat.hit_table', status: 'mapped' },
        ],
      },
      [
        { id: 'section.combat', title: 'Combat', kind: 'chapter' },
        { id: 'section.combat.hit_table', title: 'Hit table', kind: 'table' },
      ],
    );
    expect(report).toContain('| chapter | 1 |');
    expect(report).toContain('| table | 1 |');
  });

  it('lists tables and examples whose contents are still unextracted', () => {
    const report = renderCoverageReport(
      {
        sections: [
          {
            id: 'section.combat.hit_table',
            status: 'mapped',
            components: { tables: 'mapped' },
          },
          {
            id: 'section.combat.worked_example',
            status: 'mapped',
            components: { examples: 'extracted' },
          },
        ],
      },
      [
        {
          id: 'section.combat.hit_table',
          title: 'Hit table',
          kind: 'table',
          printed_start_page: 110,
          printed_end_page: 111,
        },
        { id: 'section.combat.worked_example', title: 'Combat example', kind: 'example' },
      ],
    );
    expect(report).toContain('| section.combat.hit_table | Hit table | 110-111 |');
    expect(report).not.toContain('| section.combat.worked_example |');
  });

  it('lists the sections that cite external sources', () => {
    const report = renderCoverageReport(
      { sections: [{ id: 'section.combat', status: 'mapped' }] },
      [
        {
          id: 'section.combat',
          title: 'Combat',
          kind: 'chapter',
          external_references: ['bestiary'],
        },
      ],
    );
    expect(report).toContain('| section.combat | bestiary |');
  });
});
