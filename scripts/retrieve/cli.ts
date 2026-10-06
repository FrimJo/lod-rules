import { parseArgs } from 'node:util';
import type { DocumentKind } from './documents.ts';
import { buildRetrievalArtifacts, freshDatabasePath } from './build.ts';
import { Retrieval } from './index.ts';
import { RETRIEVAL_TOOLS, ToolInputError, runRetrievalTool } from './tools.ts';

const usage = `Usage: npm run retrieve -- <command> [options]

Commands:
  search <query...>   Lexical search. --kind rule,table  --scope global|quest  --quest <id>  --limit N
  get <id>            Exact id: search document plus canonical record
  resolve <name>      Exact title or alias match (e.g. AP, "Molgor")
  expand <id>         Related records. --direction out|in|both  --relation see_also,uses_table  --depth N
  issues <id>         Review issues attached to a record
  tools               Rulebook tool definitions for agents (lod_search, lod_get, …)
  call <tool> <json>  Run one tool call (rulebook content only), e.g. call lod_search '{"query":"locked door"}'
  build               Write generated/retrieval/ (search-documents.jsonl, retrieval.sqlite, manifest.json)

Output is JSON. Uses generated/retrieval/retrieval.sqlite when it matches the corpus;
otherwise indexes the canonical YAML in memory.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    kind: { type: 'string' },
    scope: { type: 'string' },
    quest: { type: 'string' },
    limit: { type: 'string' },
    direction: { type: 'string' },
    relation: { type: 'string' },
    depth: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
});

const [command, ...rest] = positionals;
const argument = rest.join(' ');
const print = (value: unknown): void => console.log(JSON.stringify(value, null, 2));
const list = (value: string | undefined): string[] | undefined =>
  value?.split(',').map((v) => v.trim());
const int = (value: string | undefined): number | undefined =>
  value ? Number.parseInt(value, 10) : undefined;

if (!command || values.help) {
  console.log(usage);
  process.exit(command ? 0 : 1);
}

if (command === 'build') {
  print(buildRetrievalArtifacts());
  process.exit(0);
}

if (command === 'tools') {
  print(RETRIEVAL_TOOLS);
  process.exit(0);
}

if (!argument) {
  console.error(`${command}: missing argument\n\n${usage}`);
  process.exit(1);
}

const database = freshDatabasePath();
const retrieval = database ? Retrieval.open(database) : Retrieval.fromCorpus();

switch (command) {
  case 'search':
    print(
      retrieval.search(argument, {
        kinds: list(values.kind) as DocumentKind[] | undefined,
        scope: values.scope,
        questId: values.quest,
        limit: int(values.limit),
      }),
    );
    break;
  case 'get': {
    const result = retrieval.get(argument);
    if (!result) {
      console.error(
        `No record with id "${argument}". Try: npm run retrieve -- search "${argument}"`,
      );
      process.exitCode = 1;
    } else print(result);
    break;
  }
  case 'resolve':
    print(retrieval.resolve(argument));
    break;
  case 'expand':
    print(
      retrieval.expand(argument, {
        direction: values.direction as 'out' | 'in' | 'both' | undefined,
        relations: list(values.relation),
        depth: int(values.depth),
      }),
    );
    break;
  case 'call': {
    const [tool = '', json = '{}'] = rest;
    try {
      print(runRetrievalTool(retrieval, tool, JSON.parse(json) as unknown));
    } catch (error) {
      if (!(error instanceof ToolInputError || error instanceof SyntaxError)) throw error;
      print({ error: error.message });
      process.exitCode = 1;
    }
    break;
  }
  case 'issues':
    print(retrieval.issues(argument));
    break;
  default:
    console.error(`Unknown command "${command}"\n\n${usage}`);
    process.exitCode = 1;
}
retrieval.close();
