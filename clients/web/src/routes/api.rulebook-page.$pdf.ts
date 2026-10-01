import { createFileRoute } from '@tanstack/react-router';
import { getRulebookIndex, rulebookFile, rulebookPage } from '../server/rulebook.ts';

export const Route = createFileRoute('/api/rulebook-page/$pdf')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const pdf = Number(params.pdf);
        if (!Number.isInteger(pdf) || pdf < 1 || pdf > getRulebookIndex().pageCount)
          return new Response('No such rulebook page', { status: 404 });

        const file = rulebookFile();
        const etag = `"${file.size.toString(16)}-${Math.floor(file.mtimeMs).toString(16)}-p${pdf}"`;
        const headers = new Headers({
          'Cache-Control': 'private, max-age=86400',
          'Content-Type': 'application/pdf',
          ETag: etag,
        });
        if (request.headers.get('if-none-match') === etag)
          return new Response(null, { status: 304, headers });

        const bytes = await rulebookPage(pdf);
        headers.set('Content-Length', String(bytes.byteLength));
        return new Response(bytes as Uint8Array<ArrayBuffer>, { status: 200, headers });
      },
    },
  },
});
