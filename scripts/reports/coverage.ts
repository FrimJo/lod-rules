import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { repoRoot } from '../validate/schemas.ts';
import { renderCoverageReport, type CoverageFile, type SectionEntry } from './render-coverage.ts';

const sourceMap = join(repoRoot, 'corpus', 'source-map');
const reportPath = join(repoRoot, 'docs', 'coverage-report.md');

const coverage = parse(readFileSync(join(sourceMap, 'coverage.yaml'), 'utf8')) as CoverageFile;
const sections = (parse(readFileSync(join(sourceMap, 'sections.yaml'), 'utf8')) ??
  []) as SectionEntry[];

writeFileSync(reportPath, renderCoverageReport(coverage, sections), 'utf8');

console.log(
  `Wrote docs/coverage-report.md (${coverage.sections?.length ?? 0} coverage row(s), ` +
    `${sections.length} section(s)).`,
);
