import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { repoRoot } from '../validate/schemas.ts';
import { GRAPH_DIR, writeGraphArtifacts } from './build.ts';
import { buildGraph } from './index.ts';
import { GRAPH_REPORT, renderGraphReport } from './report.ts';

const usage = `Usage: npm run graph -- <command>

Commands:
  build   Write ${GRAPH_DIR}/ (nodes.json, edges.json), sorted and deterministic
  report  Write the committed ${GRAPH_REPORT} (edge counts and anomaly lists)`;

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
  case 'report': {
    const graph = buildGraph();
    writeFileSync(join(repoRoot, GRAPH_REPORT), renderGraphReport(graph), 'utf8');
    const { dangling, cycles, unresolved, stepDuplicates } = graph.anomalies;
    console.log(
      JSON.stringify({
        report: GRAPH_REPORT,
        edges: graph.edges.length,
        dangling: dangling.length,
        cycles: cycles.reduce((sum, group) => sum + group.cycles.length, 0),
        unresolved: unresolved.length,
        stepDuplicates: stepDuplicates.length,
      }),
    );
    break;
  }
  default:
    console.error(`Unknown command "${command}".\n\n${usage}`);
    process.exitCode = 1;
}
