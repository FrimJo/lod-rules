import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { repoRoot } from '../validate/schemas.ts';
import { renderCoverageReport, type CoverageFile } from './render-coverage.ts';

const coveragePath = join(repoRoot, 'corpus', 'source-map', 'coverage.yaml');
const reportPath = join(repoRoot, 'docs', 'coverage-report.md');

const coverage = parse(readFileSync(coveragePath, 'utf8')) as CoverageFile;
writeFileSync(reportPath, renderCoverageReport(coverage), 'utf8');

console.log(`Wrote docs/coverage-report.md (${coverage.sections?.length ?? 0} section(s)).`);
