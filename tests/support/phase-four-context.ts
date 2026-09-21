import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { repoRoot } from '../../scripts/validate/schemas.ts';
import type { PilotContext } from '../../scripts/validate/pilot.ts';

// Files have been validated by the corpus gate; these are mutation-test inputs only.
const read = (path: string): unknown => parse(readFileSync(join(repoRoot, path), 'utf8'));
const manifest = read('source/manifest.yaml') as {
  documents: PilotContext['documents'];
  external_sources: Array<{ id: string }>;
};
export function phaseFourContext(): PilotContext {
  return {
    map: {
      sections: read('corpus/source-map/sections.yaml') as PilotContext['map']['sections'],
      pages: read('corpus/source-map/pages.yaml') as PilotContext['map']['pages'],
      coverage: (
        read('corpus/source-map/coverage.yaml') as { sections: PilotContext['map']['coverage'] }
      ).sections,
      externalSourceIds: manifest.external_sources.map((d) => d.id),
    },
    terms: read('corpus/glossary/terms.yaml') as PilotContext['terms'],
    issues: read('review/ambiguities.yaml') as PilotContext['issues'],
    documents: manifest.documents,
    externalIds: manifest.external_sources.map((d) => d.id),
  };
}
