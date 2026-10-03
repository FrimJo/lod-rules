import { createFileRoute } from '@tanstack/react-router';
import { rulingSource } from '../server/ruling-sources.ts';

export const Route = createFileRoute('/api/sources/$document')({
  server: {
    handlers: {
      GET: ({ params }) => rulingSource(params.document),
    },
  },
});
