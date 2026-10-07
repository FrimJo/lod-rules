/**
 * Step 2 chapter worklist (read-only). Usage:
 *   npm run report:chapters -- [--chapter <name|section-id>] [--include-quests] [--json]
 *                              [--out <path>]
 * Writes to stdout unless --out is given. Never writes under docs/ or corpus/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { repoRoot } from '../validate/schemas.ts';
import { buildWorklist, loadWorklistInput, renderWorklistMarkdown } from './chapter-worklist.ts';

const { values } = parseArgs({
  options: {
    chapter: { type: 'string' },
    'include-quests': { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    out: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
});

if (values.help) {
  console.log(
    'Usage: npm run report:chapters -- [--chapter <name|section-id>] [--include-quests] ' +
      '[--json] [--out <path>]',
  );
  process.exit(0);
}

const worklist = buildWorklist(loadWorklistInput(), {
  ...(values.chapter !== undefined ? { chapter: values.chapter } : {}),
  includeQuests: values['include-quests'],
});

if (values.chapter !== undefined && worklist.chapters.length === 0) {
  console.error(`No sections match --chapter ${values.chapter}.`);
  process.exit(1);
}

const output = values.json
  ? `${JSON.stringify(worklist, null, 2)}\n`
  : `${renderWorklistMarkdown(worklist)}\n`;

if (values.out === undefined) {
  process.stdout.write(output);
} else {
  const target = resolve(process.cwd(), values.out);
  const fromRoot = relative(repoRoot, target);
  if (/^(docs|corpus)(\/|$)/.test(fromRoot)) {
    console.error('Refusing to write under docs/ or corpus/; use generated/ or stdout.');
    process.exit(1);
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, output, 'utf8');
  console.error(`Wrote ${fromRoot}`);
}
