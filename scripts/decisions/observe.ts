import type { ShadowReport } from './shadow.ts';

export interface ProviderObservation {
  rows: number;
  requests: number;
  failures: number;
  cacheHits: number;
  latencyMs: number;
  accepted: number;
  unresolved: number;
  escalations: number;
}

export interface RunObservation {
  rulesJudged: number;
  byProvider: Record<string, ProviderObservation>;
}

export function observe(report: ShadowReport): RunObservation {
  const subjects = new Set(report.rows.map((row) => row.subjectId));
  const byProvider: Record<string, ProviderObservation> = {};
  for (const row of report.rows) {
    const current = byProvider[row.provider] ?? {
      rows: 0,
      requests: 0,
      failures: 0,
      cacheHits: 0,
      latencyMs: 0,
      accepted: 0,
      unresolved: 0,
      escalations: 0,
    };
    current.rows += 1;
    current.requests += row.requests;
    current.latencyMs += row.latencyMs;
    if (row.failure) current.failures += 1;
    if (row.cache === 'hit') current.cacheHits += 1;
    for (const outcome of Object.values(row.judgments)) {
      if (!outcome) continue;
      if (outcome.disposition === 'accepted') current.accepted += 1;
      else current.unresolved += 1;
    }
    for (const attempt of row.attempts) current.escalations += attempt.escalations.length;
    byProvider[row.provider] = current;
  }
  return { rulesJudged: subjects.size, byProvider };
}
