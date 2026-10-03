import { readFileSync } from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { repoRoot } from '../../../../scripts/validate/schemas.ts';

/** Serve only present ruling documents explicitly declared in the manifest. */
export function rulingSource(documentId: string): Response {
  const manifest = parse(readFileSync(join(repoRoot, 'source/manifest.yaml'), 'utf8')) as {
    documents: Array<{ id: string; file: string; source_class?: string }>;
  };
  const document = manifest.documents.find(
    (entry) =>
      entry.id === documentId &&
      ['official_errata', 'official_faq'].includes(entry.source_class ?? ''),
  );
  if (!document) return new Response('Unknown ruling source', { status: 404 });
  const directory = resolve(repoRoot, 'source');
  const path = resolve(directory, document.file);
  if (!path.startsWith(`${directory}${sep}`))
    return new Response('Invalid source path', { status: 400 });
  const pdf = path.endsWith('.pdf');
  return new Response(readFileSync(path), {
    headers: {
      'Content-Type': pdf ? 'application/pdf' : 'application/octet-stream',
      'Content-Disposition': `${pdf ? 'inline' : 'attachment'}; filename="${basename(path)}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
