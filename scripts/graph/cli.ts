import { parseArgs } from 'node:util';
import { GRAPH_DIR, writeGraphArtifacts } from './build.ts';
import { buildGraph } from './index.ts';

const usage = `Usage: npm run graph -- <command>

Commands:
  build   Write ${GRAPH_DIR}/ (nodes.json, edges.json), sorted and deterministic`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { help: { type: 'boolean', short: 'h' } },
});

const [command] = positionals;

if (values.help || !command) {
  console.log(usage);
  process.exit(command || values.help ? 0 : 1);
}

switch (command) {
  case 'build': {
    const graph = buildGraph();
    writeGraphArtifacts(graph);
    console.log(
      JSON.stringify({ dir: GRAPH_DIR, nodes: graph.nodes.length, edges: graph.edges.length }),
    );
    break;
  }
  default:
    console.error(`Unknown command "${command}".\n\n${usage}`);
    process.exitCode = 1;
}
