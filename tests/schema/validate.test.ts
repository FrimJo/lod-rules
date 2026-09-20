import { describe, expect, it } from 'vitest';
import { validateCorpus } from '../../scripts/validate/corpus.ts';
import { renderCoverageReport } from '../../scripts/reports/render-coverage.ts';

describe('corpus validation', () => {
  it('passes with no extracted corpus data', () => {
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
});
