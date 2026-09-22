import { createHash } from 'node:crypto';

export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Stable encoding for cache keys. Key order does not affect the digest. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(order(value));
}

function order(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(order);
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right, 'en'),
    );
    return Object.fromEntries(entries.map(([key, child]) => [key, order(child)]));
  }
  return value;
}
