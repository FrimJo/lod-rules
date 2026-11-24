import { expect } from 'vitest';

/** Corpus bookkeeping that must never reach a consumer agent's context. */
const BOOKKEEPING_KEYS = [
  'status',
  'confidence',
  'completeness',
  'extraction',
  'locator',
  'file',
  'issues',
  'issue_id',
  'issue_ids',
  'issue_status',
  'unresolved_references',
  'review_status',
  'score',
  'found',
];

function keysOf(value: unknown, into = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) keysOf(item, into);
  else if (typeof value === 'object' && value !== null)
    for (const [key, child] of Object.entries(value)) {
      into.add(key);
      keysOf(child, into);
    }
  return into;
}

/** The bookkeeping-free projection check for agent-tool output (issue #32 universal checks). */
export function expectRulebookOnly(value: unknown, label: string): void {
  const keys = keysOf(value);
  for (const key of BOOKKEEPING_KEYS) expect(keys.has(key), `${label}: ${key}`).toBe(false);
  const json = JSON.stringify(value);
  expect(json, label).not.toMatch(/"(corpus|review|source)\/[^"]*\.(yaml|pdf|html)"/);
  expect(json, label).not.toMatch(/"issue\./);
}
