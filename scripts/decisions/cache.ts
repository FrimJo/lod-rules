import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalJson, sha256 } from './hash.ts';
import { CALIBRATION_VERSION, DECISION_SCHEMA_VERSION, JUDGMENT_SET_VERSION } from './pins.ts';
import type { DecisionReport, DecisionRequest, SemanticDecisionProvider } from './types.ts';
import { isRecord } from './report.ts';

const UNCACHED_FAILURES = new Set([
  'not_installed',
  'model_unavailable',
  'load_failure',
  'authentication_failure',
  'timeout',
  'rate_limited',
  'unavailable',
  'unsupported_runtime',
  'memory_pressure',
  'no_completer',
]);

export function withCache(
  provider: SemanticDecisionProvider,
  options: { directory: string; force?: boolean },
): SemanticDecisionProvider {
  return {
    id: provider.id,
    cacheIdentity: provider.cacheIdentity,
    availability: () => provider.availability(),
    async decide(request) {
      const key = decisionCacheKey(provider.cacheIdentity, request);
      const path = join(options.directory, `${key}.json`);
      if (!options.force && existsSync(path)) {
        const stored = readStored(path);
        if (stored) return { ...stored, cache: 'hit' };
      }
      const report = await provider.decide(request);
      if (report.failure && UNCACHED_FAILURES.has(report.failure.code)) return report;
      mkdirSync(options.directory, { recursive: true });
      writeFileSync(path, `${JSON.stringify({ ...report, cache: 'miss' })}\n`);
      return report;
    },
  };
}

export function decisionCacheKey(cacheIdentity: string, request: DecisionRequest): string {
  return sha256(
    canonicalJson({
      schemaVersion: DECISION_SCHEMA_VERSION,
      judgmentSetVersion: JUDGMENT_SET_VERSION,
      calibrationVersion: CALIBRATION_VERSION,
      cacheIdentity,
      state: request.state,
      questions: request.questions,
    }),
  );
}

function readStored(path: string): DecisionReport | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    if (!isRecord(parsed) || parsed.schemaVersion !== DECISION_SCHEMA_VERSION) return null;
    return parsed as unknown as DecisionReport;
  } catch {
    return null;
  }
}
