import type { Citation } from './documents.ts';

export function sourceLabel(c: Citation): string {
  const page = c.pdf_page == null ? '' : `PDF ${c.pdf_page} / printed ${c.printed_page ?? 'none'}`;
  const locator = Object.entries(c.locator ?? {})
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${key} ${value}`)
    .join(', ');
  return [c.document, page, c.heading, locator].filter(Boolean).join(' — ');
}
