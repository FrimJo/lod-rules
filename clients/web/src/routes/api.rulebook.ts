import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { createFileRoute } from '@tanstack/react-router';
import { rulebookFile } from '../server/rulebook.ts';

/** Parses a single `bytes=` range. Returns null for a malformed or unsatisfiable one. */
function parseRange(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, from = '', to = ''] = match;
  if (!from && !to) return null;
  const start = from ? Number(from) : Math.max(0, size - Number(to));
  const end = from && to ? Math.min(Number(to), size - 1) : size - 1;
  return start <= end && start < size ? { start, end } : null;
}

function serve(request: Request, includeBody: boolean): Response {
  const file = rulebookFile();
  const etag = `"${file.size.toString(16)}-${Math.floor(file.mtimeMs).toString(16)}"`;
  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
    'Content-Disposition': `inline; filename="${file.name}"`,
    'Content-Type': 'application/pdf',
    ETag: etag,
  });
  if (request.headers.get('if-none-match') === etag)
    return new Response(null, { status: 304, headers });

  const header = request.headers.get('range');
  const ifRange = request.headers.get('if-range');
  const range =
    header && (!ifRange || ifRange === etag) ? parseRange(header, file.size) : undefined;
  if (range === null) {
    headers.set('Content-Range', `bytes */${file.size}`);
    return new Response(null, { status: 416, headers });
  }

  const { start, end } = range ?? { start: 0, end: file.size - 1 };
  headers.set('Content-Length', String(end - start + 1));
  if (range) headers.set('Content-Range', `bytes ${start}-${end}/${file.size}`);
  const body = includeBody
    ? (Readable.toWeb(createReadStream(file.path, { start, end })) as ReadableStream<Uint8Array>)
    : null;
  return new Response(body, { status: range ? 206 : 200, headers });
}

export const Route = createFileRoute('/api/rulebook')({
  server: {
    handlers: {
      GET: ({ request }) => serve(request, true),
      HEAD: ({ request }) => serve(request, false),
    },
  },
});
