import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { createFileRoute } from '@tanstack/react-router';

const fontsDir = join(
  dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json')),
  'standard_fonts',
);

/** pdf.js's substitutes for the standard 14 fonts, for pages that use them without embedding. */
export const Route = createFileRoute('/api/pdf-fonts/$file')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[\w-]+\.(pfb|ttf)$/.test(params.file)) return new Response(null, { status: 404 });
        try {
          const bytes = await readFile(join(fontsDir, params.file));
          return new Response(bytes, {
            headers: {
              'Cache-Control': 'public, max-age=604800, immutable',
              'Content-Type': 'application/octet-stream',
            },
          });
        } catch {
          return new Response(null, { status: 404 });
        }
      },
    },
  },
});
