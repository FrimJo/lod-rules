import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { createAjv, getValidator, formatErrors, repoRoot } from './schemas.ts';
import type { Pilot } from './pilot-types.ts';

const roots = {
  rules: 'corpus/rules',
  entities: 'corpus/entities',
  tables: 'corpus/tables',
  procedures: 'corpus/procedures',
  stateMachines: 'corpus/state-machines',
  testCases: 'tests/examples',
} as const;
export interface PilotFile {
  path: string;
  schema: keyof Pilot;
}
export function discoverPilotFiles(root = repoRoot): PilotFile[] {
  const files: PilotFile[] = [];
  function walk(path: string, schema: keyof Pilot): void {
    if (!existsSync(join(root, path))) return;
    for (const entry of readdirSync(join(root, path), { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name, 'en'),
    )) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) walk(child, schema);
      else if (entry.isFile() && /\.ya?ml$/.test(entry.name)) files.push({ path: child, schema });
    }
  }
  for (const [schema, path] of Object.entries(roots)) walk(path, schema as keyof Pilot);
  return files;
}
export function emptyPilot(): Pilot {
  return { rules: [], entities: [], tables: [], procedures: [], stateMachines: [], testCases: [] };
}
/** Shape-validated loader for test consumers; full joins are checked by validateCorpus. */
export function readPilot(root = repoRoot): Pilot {
  const pilot = emptyPilot();
  const ajv = createAjv();
  for (const file of discoverPilotFiles(root)) {
    const data: unknown = parse(readFileSync(join(root, file.path), 'utf8'));
    const validate = getValidator(ajv, file.schema);
    if (!validate(data)) throw new Error(`${file.path}: ${formatErrors(validate).join('; ')}`);
    // Schema dispatch narrows the collection at runtime; no unvalidated YAML is exposed.
    (pilot[file.schema] as unknown[]).push(...(data as unknown[]));
  }
  return pilot;
}
