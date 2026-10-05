import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { closeLaya } from '../decisions/laya.ts';
import { loadLocalEnv } from '../decisions/env.ts';
import type { LlmCompleter } from '../decisions/llm.ts';
import { freshDatabasePath } from '../retrieve/build.ts';
import { Retrieval } from '../retrieve/index.ts';
import { selectedSystems, type SystemOneModel } from './analysis.ts';
import { ask } from './index.ts';
import { analyzerModel, isAnalyzerName, jevModel } from './models.ts';

const usage = `Usage: npm run ask -- "<question>" [options]

  --analyzer lexical|laya|jev|cascade
                                Question analysis (default lexical; laya runs locally;
                                cascade asks Jev only what Laya is unsure of)
  --filter                      Let Jev drop records it judges irrelevant, lexical ones
                                included (experimental; needs a model analyzer and
                                TYPESAFE_API_KEY; exact name matches are kept)
  --completer-cmd "<command>"   Shell command that reads the prompt on stdin and prints
                                the answer, e.g. "claude -p". Without it, prints the prompt.
  --show-prompt                 Print the grounded prompt as well
  --json                        Print the full result as JSON`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    analyzer: { type: 'string', default: 'lexical' },
    'completer-cmd': { type: 'string' },
    filter: { type: 'boolean' },
    'show-prompt': { type: 'boolean' },
    json: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
});

const question = positionals.join(' ').trim();
if (!question || values.help) {
  console.log(usage);
  process.exit(question ? 0 : 1);
}

loadLocalEnv();

function analyzer(name: string): SystemOneModel | null {
  if (!isAnalyzerName(name)) {
    console.error(`Unknown analyzer "${name}"\n\n${usage}`);
    process.exit(1);
  }
  const model = analyzerModel(name);
  if (name === 'jev' && !model) {
    console.error('TYPESAFE_API_KEY is not set; using the lexical analyzer.');
  }
  if (name === 'cascade' && !process.env.TYPESAFE_API_KEY?.trim()) {
    console.error('TYPESAFE_API_KEY is not set; the cascade keeps Laya’s unsure answers.');
  }
  return model;
}

function shellCompleter(command: string): LlmCompleter {
  return {
    id: `cmd:${command}`,
    complete: (prompt) =>
      new Promise((resolve, reject) => {
        const child = spawn('sh', ['-c', command], { stdio: ['pipe', 'pipe', 'inherit'] });
        let output = '';
        child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString('utf8')));
        child.on('error', reject);
        child.on('close', (code) =>
          code === 0
            ? resolve(output.trim())
            : reject(new Error(`${command} exited with ${code}: ${output.trim().slice(0, 300)}`)),
        );
        child.stdin.end(prompt);
      }),
  };
}

const database = freshDatabasePath();
const retrieval = database ? Retrieval.open(database) : Retrieval.fromCorpus();
const command = values['completer-cmd'];
const ranker = values.filter ? jevModel() : null;
if (values.filter && !ranker) console.error('TYPESAFE_API_KEY is not set; not filtering.');
const result = await ask(retrieval, question, {
  model: analyzer(values.analyzer ?? 'lexical'),
  completer: command ? shellCompleter(command) : null,
  filter: ranker ? { ranker } : null,
});
if (values.filter && ranker && !result.filter) {
  console.error('The filter needs a model analysis (--analyzer jev); not filtering.');
}
retrieval.close();
await closeLaya();

if (values.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const { analysis, evidence } = result;
  const pct = (value: number): string => `${Math.round(value * 100)}%`;
  console.log(
    `Analyzer: ${analysis.analyzer}${analysis.fallback ? ` (fallback: ${analysis.fallback})` : ''}`,
  );
  console.log(`Intent: ${analysis.intent.value}   Complexity: ${analysis.complexity.value}`);
  console.log(
    `Systems: ${selectedSystems(analysis).join(', ') || 'none'}   (${analysis.systems
      .slice(0, 4)
      .map((s) => `${s.id} ${pct(s.probabilityYes)}`)
      .join(', ')})`,
  );
  console.log(
    `Entities: ${analysis.entities.map((e) => `${e.title} [${e.via}]`).join(', ') || 'none'}`,
  );
  if (analysis.escalations?.length) {
    console.log(
      `Escalated: ${analysis.escalations
        .map((e) => `${e.question} (${e.reason}) → ${e.answeredBy}`)
        .join(', ')}`,
    );
  }
  console.log(`\nEvidence (${evidence.length}):`);
  for (const item of evidence) {
    const page = item.citations[0] ? `PDF ${item.citations[0].pdf_page}` : '';
    const scope =
      item.scope === 'quest' ? `quest: ${item.quest_title ?? item.quest_id}` : item.scope;
    const flags = [
      item.issues.length ? `${item.issues.length} issue(s)` : '',
      item.external_dependencies.length ? 'external' : '',
    ]
      .filter(Boolean)
      .join(', ');
    console.log(
      `  ${item.id} — ${item.title} (${scope}; ${page})${flags ? ` [${flags}]` : ''}  ← ${item.why.join(', ')}`,
    );
  }
  if (result.filter) {
    const dropped = result.filter.decisions.filter((d) => !d.kept);
    console.log(
      `\nFiltered by ${result.filter.ranker} (${result.filter.policy.id})${
        result.filter.fallback ? `, fallback: ${result.filter.fallback}` : ''
      }: ${dropped.length} dropped`,
    );
    for (const d of dropped) {
      console.log(
        `  ${d.id} [${d.sources.join('+')}] irrelevant ${pct(d.judgment?.probabilities.irrelevant ?? 0)} (${d.reason})`,
      );
    }
  }
  if (values['show-prompt'] || !result.answer) console.log(`\n--- PROMPT ---\n${result.prompt}`);
  if (result.answer) {
    console.log(`\n--- ANSWER ---\n${result.answer}`);
    const check = result.citations!;
    console.log(
      `\nCitations: ${check.cited.length} cited, ${check.unknown.length} not in evidence${
        check.unknown.length ? ` (${check.unknown.join(', ')})` : ''
      } → ${check.grounded ? 'grounded' : 'NOT grounded'}`,
    );
  }
}
