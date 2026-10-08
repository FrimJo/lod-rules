import { createFileRoute } from '@tanstack/react-router';
import { CharacterCreator } from '../character/components/CharacterCreator.tsx';
import creatorStyles from '../character/character.css?url';

export const Route = createFileRoute('/character')({
  head: () => ({
    meta: [{ title: 'Character creator · League of Dungeoneers' }],
    links: [{ rel: 'stylesheet', href: creatorStyles }],
  }),
  component: CharacterCreator,
});
