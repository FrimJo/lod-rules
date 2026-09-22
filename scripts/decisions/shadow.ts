import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../validate/schemas.ts';
import type { GoldCase } from './gold.ts';
import type { DecisionReport, ProviderAttempt, SemanticDecisionProvider } from './types.ts';

export interface ShadowRow {
  subjectId: string;
  goldCaseId: string | null;
  provider: string;
  model: string;
  failure: string | null;
  judgments: DecisionReport['judgments'];
  latencyMs: number;
  requests: number;
  cache: DecisionReport['cache'];
  attempts: ProviderAttempt[];
}

export interface ShadowReport {
  generatedAt: string;
  rows: ShadowRow[];
}

export async function runShadow(
  cases: readonly GoldCase[],
  providers: readonly SemanticDecisionProvider[],
): Promise<ShadowReport> {
  const rows: ShadowRow[] = [];
  for (const gold of cases) {
    for (const provider of providers) {
      const status = await provider.availability();
      if (!status.available) {
        rows.push({
          subjectId: gold.request.subjectId,
          goldCaseId: gold.id,
          provider: provider.id,
          model: provider.cacheIdentity,
          failure: status.reason,
          judgments: {},
          latencyMs: 0,
          requests: 0,
          cache: 'miss',
          attempts: [],
        });
        continue;
      }
      const report = await provider.decide(gold.request);
      rows.push({
        subjectId: report.subjectId,
        goldCaseId: gold.id,
        provider: report.provider,
        model: report.model,
        failure: report.failure?.code ?? null,
        judgments: report.judgments,
        latencyMs: report.latencyMs,
        requests: report.requests,
        cache: report.cache,
        attempts: report.attempts,
      });
    }
  }
  return { generatedAt: new Date().toISOString(), rows };
}

export function writeShadow(
  report: ShadowReport,
  directory = join(repoRoot, 'generated/decisions/shadow'),
): string {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, 'latest.json');
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
  return path;
}

export interface Disagreement {
  goldCaseId: string;
  judgment: string;
  values: Record<string, string | boolean | null>;
}

/** Compares accepted labels. Does not assign a cause; that is a review step. */
export function disagreements(report: ShadowReport): Disagreement[] {
  const byCase = new Map<string, ShadowRow[]>();
  for (const row of report.rows) {
    if (!row.goldCaseId) continue;
    const rows = byCase.get(row.goldCaseId) ?? [];
    rows.push(row);
    byCase.set(row.goldCaseId, rows);
  }
  const found: Disagreement[] = [];
  for (const [goldCaseId, rows] of byCase) {
    const judgments = new Set<string>();
    for (const row of rows) for (const id of Object.keys(row.judgments)) judgments.add(id);
    for (const judgment of judgments) {
      const values: Record<string, string | boolean | null> = {};
      for (const row of rows) {
        const result = row.judgments[judgment as keyof typeof row.judgments]?.result;
        values[row.provider] = result
          ? result.primitive === 'noul'
            ? result.value
            : result.value
          : null;
      }
      const distinct = new Set(Object.values(values).map((value) => JSON.stringify(value)));
      if (distinct.size > 1) found.push({ goldCaseId, judgment, values });
    }
  }
  return found;
}

export interface UncertainRow {
  goldCaseId: string | null;
  provider: string;
  judgment: string;
  reason: string | null;
  probabilityYes: number | null;
  confidence: number | null;
}

export function uncertain(report: ShadowReport, confidenceBelow: number | null): UncertainRow[] {
  const rows: UncertainRow[] = [];
  for (const row of report.rows) {
    for (const [judgment, outcome] of Object.entries(row.judgments)) {
      if (!outcome) continue;
      const result = outcome.result;
      const lowChoice =
        confidenceBelow !== null &&
        result?.primitive === 'choice' &&
        result.confidence !== null &&
        result.confidence < confidenceBelow;
      const lowNoul =
        confidenceBelow !== null &&
        result?.primitive === 'noul' &&
        Math.abs(result.probabilityYes - 0.5) < confidenceBelow;
      if (outcome.disposition === 'unresolved' || lowChoice || lowNoul) {
        rows.push({
          goldCaseId: row.goldCaseId,
          provider: row.provider,
          judgment,
          reason: outcome.reason,
          probabilityYes: result?.primitive === 'noul' ? result.probabilityYes : null,
          confidence: result?.primitive === 'choice' ? result.confidence : null,
        });
      }
    }
    if (row.failure) {
      rows.push({
        goldCaseId: row.goldCaseId,
        provider: row.provider,
        judgment: '*',
        reason: row.failure,
        probabilityYes: null,
        confidence: null,
      });
    }
  }
  return rows;
}
