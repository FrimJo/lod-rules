import { discoverPilotFiles, readCanonicalFiles } from './canonical-files.ts';
import { repoRoot } from './schemas.ts';
import type { Pilot } from './pilot-types.ts';

export function emptyPilot(): Pilot {
  return {
    rules: [],
    entities: [],
    tables: [],
    procedures: [],
    stateMachines: [],
    testCases: [],
    edges: [],
  };
}

/** Shape-validated loader for test consumers; full joins are checked by validateCorpus. */
export function readPilot(root = repoRoot): Pilot {
  const pilot = emptyPilot();
  for (const { schema, data } of readCanonicalFiles(discoverPilotFiles(root), root)) {
    // Schema dispatch narrows the collection at runtime; no unvalidated YAML is exposed.
    (pilot[schema as keyof Pilot] as unknown[]).push(...(data as unknown[]));
  }
  return pilot;
}
