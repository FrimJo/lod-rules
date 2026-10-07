import { createFileRoute } from '@tanstack/react-router';
import { GmTable } from '../gm/components/GmTable.tsx';
import gmStyles from '../gm/gm.css?url';

export const Route = createFileRoute('/gm')({
  head: () => ({
    meta: [{ title: 'Game master’s table · League of Dungeoneers' }],
    links: [{ rel: 'stylesheet', href: gmStyles }],
  }),
  component: GmTable,
});
