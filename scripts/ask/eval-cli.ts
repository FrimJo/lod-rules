import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { closeLaya } from '../decisions/laya.ts';
import { loadLocalEnv } from '../decisions/env.ts';
import { freshDatabasePath } from '../retrieve/build.ts';
import { Retrieval } from '../retrieve/index.ts';
import { repoRoot } from '../validate/schemas.ts';
import { analyzeQuestion, lexicalAnalysis, type SystemOneModel } from './analysis.ts';
import { PROVISIONAL_CASCADE, cascadeModel, type CascadePolicy } from './cascade.ts';
import { gatherEvidence } from './evidence.ts';
import { memoModel, scoreCase, summarize, type CaseScore, type Summary } from './evaluate.ts';
import { LABEL_SPLITS, loadLabels, type LabelledQuestion } from './labels.ts';
import { jevModel, layaModel } from './models.ts';

const usage = `Usage: npm run ask:evaluate -- [options]

Scores question analysis and retrieval on the labelled question set
(tests/fixtures/ask-questions/cases.yaml) for lexical, Laya, Jev and the Laya→Jev cascade.
Each model is scored alone and as the union with the lexical baseline that retrieval uses.

  --analyzers lexical,laya,jev,cascade   Which to run (default all; jev/cascade need TYPESAFE_API_KEY)
  --sweep                                Also replay the cascade over a grid of uncertainty floors
  --refresh                              Ignore cached Jev answers in generated/ask-eval/jev-cache/

Writes generated/ask-eval/report.json and prints summary tables.`;

const { values } = parseArgs({
  options: {
    analyzers: { type: 'string', default: 'lexical,laya,jev,cascade' },
    sweep: { type: 'boolean' },
    refresh: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
});
if (values.help) {
  console.log(usage);
  process.exit(0);
}

loadLocalEnv();
const outDir = join(repoRoot, 'generated/ask-eval');
const wanted = new Set((values.analyzers ?? '').split(',').map((v) => v.trim()));
const database = freshDatabasePath();
const retrieval = database ? Retrieval.open(database) : Retrieval.fromCorpus();
const labels = loadLabels(retrieval);

const laya = wanted.has('laya') || wanted.has('cascade') ? memoModel(layaModel()) : null;
const jevBase = jevModel();
const jev = jevBase
  ? memoModel(jevBase, values.refresh ? undefined : join(outDir, 'jev-cache'))
  : null;
if (!jev && (wanted.has('jev') || wanted.has('cascade'))) {
  console.error('TYPESAFE_API_KEY is not set; skipping jev and cascade.');
}

const scores = new Map<string, CaseScore[]>();
const record = (config: string, score: CaseScore): void => {
  scores.set(config, [...(scores.get(config) ?? []), score]);
};

async function run(config: string, model: SystemOneModel | null): Promise<void> {
  for (const label of labels) {
    const lexical = lexicalAnalysis(retrieval, label.question);
    const lexicalIds = gatherEvidence(retrieval, lexical).map((item) => item.id);
    const analysis = model ? await analyzeQuestion(retrieval, label.question, model) : lexical;
    record(config, scoreCase(retrieval, label, analysis, lexicalIds));
  }
}

if (wanted.has('lexical')) await run('lexical', null);
if (wanted.has('laya') && laya) await run('laya', laya);
if (wanted.has('jev') && jev) await run('jev', jev);
if (wanted.has('cascade') && laya && jev) {
  await run('cascade', cascadeModel(laya, jev, PROVISIONAL_CASCADE));
}

const sweep: Array<{ policy: CascadePolicy; summaries: Summary[] }> = [];
if (values.sweep && laya && jev) {
  for (const choiceFloor of [0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
    for (const noulMargin of [0.1, 0.2, 0.3, 0.4]) {
      const policy = { id: `sweep-${choiceFloor}-${noulMargin}`, choiceFloor, noulMargin };
      const config = `cascade ${choiceFloor}/${noulMargin}`;
      await run(config, cascadeModel(laya, jev, policy));
      sweep.push({ policy, summaries: summariesFor(config, ['development', 'validation']) });
      scores.delete(config);
    }
  }
}

retrieval.close();
await closeLaya();

function summariesFor(config: string, splits: readonly string[]): Summary[] {
  const all = scores.get(config) ?? [];
  const out: Summary[] = [];
  for (const split of splits) {
    const subset = all.filter((s) => s.split === split);
    out.push(summarize(config, split, subset, 'alone'));
    if (subset.some((s) => s.union))
      out.push(summarize(`${config} + lexical`, split, subset, 'union'));
  }
  return out;
}

const summaries = [...scores.keys()].flatMap((config) => summariesFor(config, LABEL_SPLITS));
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'report.json'),
  `${JSON.stringify(
    {
      labels: labels.length,
      cascadePolicy: PROVISIONAL_CASCADE,
      jevCalls: jev?.calls() ?? 0,
      summaries,
      sweep,
      cases: Object.fromEntries(scores),
    },
    null,
    2,
  )}\n`,
);

const pct = (v: number): string => `${Math.round(v * 100)}%`;
const header =
  '| config | recall | complete | evidence | dropped | intent | complexity | under-budget | entity | chapters | extra sys | escalated |';
const row = (s: Summary): string =>
  `| ${s.config}${s.fallbacks ? ` (${s.fallbacks} fallback)` : ''} | ${pct(s.recall)} | ${pct(s.complete)} | ${s.meanEvidence.toFixed(1)} | ${s.dropped} | ${pct(s.intent)} | ${pct(s.complexity)} | ${pct(s.underBudget)} | ${pct(s.entity)} | ${pct(s.chapterRecall)} | ${s.extraSystems.toFixed(1)} | ${s.escalated.toFixed(1)} (${pct(s.escalatedCases)}) |`;
for (const split of LABEL_SPLITS) {
  const rows = summaries.filter((s) => s.split === split);
  console.log(
    `\n### ${split} (${rows[0]?.cases ?? 0} questions)\n\n${header}\n|${'---|'.repeat(12)}`,
  );
  for (const s of rows) console.log(row(s));
}
if (sweep.length > 0) {
  console.log(
    `\n### cascade sweep (choice floor / noul margin)\n\n${header}\n|${'---|'.repeat(12)}`,
  );
  for (const entry of sweep) for (const s of entry.summaries) console.log(row(s));
}

const misses = (config: string, view: 'alone' | 'union'): LabelledQuestion['id'][] =>
  (scores.get(config) ?? [])
    .filter((s) => ((view === 'union' ? s.union : null) ?? s.alone).missing.length > 0)
    .map((s) => s.id);
console.log('\nQuestions with missing required evidence:');
for (const config of scores.keys()) {
  console.log(`  ${config}: ${misses(config, 'alone').join(', ') || 'none'}`);
  if (config !== 'lexical') {
    console.log(`  ${config} + lexical: ${misses(config, 'union').join(', ') || 'none'}`);
  }
}
console.log(`\nJev requests: ${jev?.calls() ?? 0}. Report: generated/ask-eval/report.json`);
