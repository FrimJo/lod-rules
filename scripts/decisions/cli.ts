import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../validate/schemas.ts';
import { withCache } from './cache.ts';
import { createCascadeProvider } from './cascade.ts';
import { loadLocalEnv } from './env.ts';
import { scoreCase, summarize, type EvaluationReport } from './evaluate.ts';
import { loadGold, rulesById, type GoldCase, type GoldSplit } from './gold.ts';
import { createJevProvider } from './jev.ts';
import { closeLaya, createLayaProvider } from './laya.ts';
import { createLlmProvider } from './llm.ts';
import { observe } from './observe.ts';
import type { LayaCheckpointId } from './pins.ts';
import { createNoneProvider } from './providers.ts';
import { buildQuestions } from './questions.ts';
import { emptyReport, failure } from './report.ts';
import { disagreements, runShadow, uncertain, writeShadow, type ShadowReport } from './shadow.ts';
import { createStructuralProvider } from './structural.ts';
import {
  JUDGMENT_IDS,
  PROVIDER_IDS,
  type DecisionReport,
  type ProviderId,
  type SemanticDecisionProvider,
} from './types.ts';
import type { Rule } from '../validate/pilot-types.ts';

const USAGE = `Usage: npm run decisions -- <command> [options]

Commands:
  classify       Judge one rule. Requires --rule.
  evaluate       Score a provider against the gold set.
  shadow         Run providers without changing the corpus. Writes generated/decisions/shadow/latest.json.
  disagreements  Show labels that disagree in the latest shadow report, or against gold.
  uncertain      Show unresolved shadow rows. --confidence-below is a display filter, not a calibrated threshold.
  benchmark      Evaluate one or more providers and write generated/decisions/evaluations/.

Options:
  --provider <id>          laya, jev, llm, structural, none, or cascade. Default: structural.
  --providers <a,b>        For shadow and benchmark.
  --rule <id>              Corpus rule id.
  --split <name>           development, validation, or held_out.
  --checkpoint <id>        base or typed-decisions. Default: base.
  --confidence-below <n>   Display filter for uncertain.
  --force                  Ignore the decision cache. Also required for a networked --all run.
  --offline                Do not call Jev or an LLM.
  --all                    Shadow every corpus rule with the structural provider. A networked
                           provider over the full corpus also requires --force.
`;

interface CliArgs {
  command: string;
  provider: ProviderId;
  providers: ProviderId[];
  rule: string | null;
  split: GoldSplit | null;
  checkpoint: LayaCheckpointId;
  confidenceBelow: number | null;
  force: boolean;
  offline: boolean;
  all: boolean;
}

async function main(): Promise<void> {
  loadLocalEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.command === 'help') {
    console.log(USAGE);
    return;
  }
  try {
    switch (args.command) {
      case 'classify':
        await classify(args);
        break;
      case 'evaluate':
        await evaluate(args);
        break;
      case 'shadow':
        await shadow(args);
        break;
      case 'disagreements':
        await showDisagreements(args);
        break;
      case 'uncertain':
        await showUncertain(args);
        break;
      case 'benchmark':
        await benchmark(args);
        break;
      default:
        console.error(USAGE);
        process.exit(1);
    }
  } finally {
    await closeLaya();
  }
}

function parseArgs(argv: string[]): CliArgs {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === 'help') {
    return emptyArgs('help');
  }
  const command = argv[0] ?? 'help';
  const args = emptyArgs(command);
  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    switch (flag) {
      case '--provider':
        args.provider = providerId(value);
        index += 1;
        break;
      case '--providers':
        args.providers = (value ?? '')
          .split(',')
          .filter(Boolean)
          .map((item) => providerId(item));
        index += 1;
        break;
      case '--rule':
        args.rule = value ?? null;
        index += 1;
        break;
      case '--split':
        args.split = splitName(value);
        index += 1;
        break;
      case '--checkpoint':
        if (value !== 'base' && value !== 'typed-decisions') {
          throw new Error(`unknown checkpoint ${value ?? ''}`);
        }
        args.checkpoint = value;
        index += 1;
        break;
      case '--confidence-below':
        args.confidenceBelow = Number(value);
        if (Number.isNaN(args.confidenceBelow))
          throw new Error('--confidence-below must be a number');
        index += 1;
        break;
      case '--force':
        args.force = true;
        break;
      case '--offline':
        args.offline = true;
        break;
      case '--all':
        args.all = true;
        break;
      default:
        throw new Error(`unknown argument ${flag ?? ''}`);
    }
  }
  return args;
}

function emptyArgs(command: string): CliArgs {
  return {
    command,
    provider: 'structural',
    providers: [],
    rule: null,
    split: null,
    checkpoint: 'base',
    confidenceBelow: null,
    force: false,
    offline: false,
    all: false,
  };
}

function providerId(value: string | undefined): ProviderId {
  if (!value || !PROVIDER_IDS.includes(value as ProviderId)) {
    throw new Error(`unknown provider ${value ?? ''}`);
  }
  return value as ProviderId;
}

function splitName(value: string | undefined): GoldSplit {
  if (value !== 'development' && value !== 'validation' && value !== 'held_out') {
    throw new Error(`unknown split ${value ?? ''}`);
  }
  return value;
}

function buildProvider(
  id: ProviderId,
  args: CliArgs,
  rules: Map<string, Rule>,
): SemanticDecisionProvider {
  if (args.offline && (id === 'jev' || id === 'llm')) {
    return blocked(id, 'offline mode skips this provider');
  }
  switch (id) {
    case 'none':
      return createNoneProvider();
    case 'structural':
      return createStructuralProvider((subjectId) => rules.get(subjectId));
    case 'laya':
      return createLayaProvider({ checkpoint: args.checkpoint });
    case 'jev':
      return createJevProvider();
    case 'llm':
      return createLlmProvider(null);
    case 'cascade':
      return createCascadeProvider([
        buildProvider('laya', args, rules),
        ...(args.offline
          ? []
          : [buildProvider('jev', args, rules), buildProvider('llm', args, rules)]),
      ]);
    default: {
      const exhausted: never = id;
      return exhausted;
    }
  }
}

function blocked(id: ProviderId, reason: string): SemanticDecisionProvider {
  return {
    id,
    cacheIdentity: `${id}:blocked`,
    async availability() {
      return { available: false, reason };
    },
    async decide(request) {
      return emptyReport(request, id, failure('unavailable', reason));
    },
  };
}

function cached(provider: SemanticDecisionProvider, args: CliArgs): SemanticDecisionProvider {
  return withCache(provider, {
    directory: join(repoRoot, 'generated/decisions/cache'),
    force: args.force,
  });
}

async function classify(args: CliArgs): Promise<void> {
  if (!args.rule) {
    console.error('classify requires --rule <id>');
    process.exit(1);
  }
  const rules = rulesById();
  const rule = rules.get(args.rule);
  if (!rule) {
    console.error(`unknown rule ${args.rule}`);
    process.exit(1);
  }
  const gold = loadGold().find((entry) => entry.ruleId === args.rule);
  const provider = cached(buildProvider(args.provider, args, rules), args);
  const request = gold?.request ?? {
    subjectId: rule.id,
    state: { focus: rule.name, source_text: rule.source_text },
    questions: buildQuestions({ focus: rule.name, source_text: rule.source_text }, JUDGMENT_IDS),
  };
  const report = await provider.decide(request);
  printReport(report);
}

async function evaluate(args: CliArgs): Promise<void> {
  const cases = selectedCases(args);
  const rules = rulesById();
  const provider = cached(buildProvider(args.provider, args, rules), args);
  const report = await evaluateProvider(provider, cases);
  printEvaluation(report);
}

async function shadow(args: CliArgs): Promise<void> {
  const ids: ProviderId[] =
    args.providers.length > 0 ? args.providers : ['structural', 'laya', 'jev'];
  // Offline mode keeps Jev in the report as skipped rather than dropping the row.
  const networked = ids.some((id) => id === 'jev' || id === 'llm' || id === 'cascade');
  if (args.all && networked && !args.force) {
    console.error('A networked shadow of every rule requires --force.');
    process.exit(1);
  }
  const rules = rulesById();
  const providers = ids.map((id) => cached(buildProvider(id, args, rules), args));
  const cases = args.all ? casesForEveryRule(rules) : selectedCases(args);
  console.log(`Shadowing ${cases.length} case(s) with ${ids.join(', ')}.`);
  const report = await runShadow(cases, providers);
  const path = writeShadow(report);
  const summary = observe(report);
  console.log(`Wrote ${path}. ${summary.rulesJudged} subject(s).`);
  for (const [provider, stats] of Object.entries(summary.byProvider)) {
    console.log(
      `  ${provider}: rows ${stats.rows}, failures ${stats.failures}, cache hits ${stats.cacheHits}, unresolved ${stats.unresolved}, escalations ${stats.escalations}`,
    );
  }
}

async function showDisagreements(args: CliArgs): Promise<void> {
  const report = await loadOrBuildShadow(args);
  const rows = disagreements(report);
  if (rows.length === 0) {
    console.log('No disagreements.');
    return;
  }
  for (const row of rows) {
    const values = Object.entries(row.values)
      .map(([provider, value]) => `${provider}=${String(value)}`)
      .join(' ');
    console.log(`${row.goldCaseId} ${row.judgment}: ${values}`);
  }
  console.log(`${rows.length} disagreement(s). Cause labels are a review step, not assigned here.`);
}

async function showUncertain(args: CliArgs): Promise<void> {
  const report = await loadOrBuildShadow(args);
  const rows = uncertain(report, args.confidenceBelow);
  for (const row of rows) {
    console.log(
      `${row.goldCaseId ?? row.provider} ${row.provider} ${row.judgment}: ${row.reason ?? 'low display score'}`,
    );
  }
  console.log(`${rows.length} uncertain row(s).`);
}

async function benchmark(args: CliArgs): Promise<void> {
  const ids = args.providers.length > 0 ? args.providers : [args.provider];
  const cases = selectedCases(args);
  const rules = rulesById();
  const directory = join(repoRoot, 'generated/decisions/evaluations');
  mkdirSync(directory, { recursive: true });
  for (const id of ids) {
    const provider = cached(buildProvider(id, args, rules), args);
    const status = await provider.availability();
    if (!status.available) {
      console.log(`${id}: unavailable (${status.reason ?? 'unknown'}).`);
      continue;
    }
    const report = await evaluateProvider(provider, cases);
    const path = join(directory, `${id}.json`);
    writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Wrote ${path}.`);
    printEvaluation(report);
  }
}

async function evaluateProvider(
  provider: SemanticDecisionProvider,
  cases: readonly GoldCase[],
): Promise<EvaluationReport> {
  const scores = [];
  let failures = 0;
  let model = provider.cacheIdentity;
  let modelRevision: string | null = null;
  for (const gold of cases) {
    const report = await provider.decide(gold.request);
    if (report.failure) failures += 1;
    model = report.model;
    modelRevision = report.modelRevision;
    scores.push(...scoreCase(gold, report));
  }
  return summarize(provider.id, model, modelRevision, cases.length, failures, scores);
}

function selectedCases(args: CliArgs): GoldCase[] {
  return loadGold().filter((entry) => (args.split ? entry.split === args.split : true));
}

function casesForEveryRule(rules: Map<string, Rule>): GoldCase[] {
  return [...rules.values()].map((rule) => {
    const state = { focus: rule.name, source_text: rule.source_text };
    return {
      id: `gold.ad_hoc.${rule.id.replaceAll('.', '_')}`,
      split: 'development' as const,
      complexity: 'simple',
      focus: rule.name,
      ruleId: rule.id,
      sourceText: rule.source_text,
      termCandidates: [],
      notes: null,
      expected: {
        rule_type: rule.type,
        conditional: rule.when !== undefined,
        has_exception: rule.type === 'exception',
        cites_other_material: false,
        completeness: 'self_contained',
      },
      request: {
        subjectId: rule.id,
        state,
        questions: buildQuestions(state, [
          'rule_type',
          'conditional',
          'has_exception',
          'cites_other_material',
          'completeness',
        ]),
      },
    };
  });
}

function printReport(report: DecisionReport): void {
  console.log(
    `${report.subjectId} provider=${report.provider} model=${report.model} cache=${report.cache}`,
  );
  if (report.failure) console.log(`  failure: ${report.failure.code}`);
  for (const [id, outcome] of Object.entries(report.judgments)) {
    if (!outcome) continue;
    const value = outcome.result
      ? outcome.result.primitive === 'noul'
        ? `${outcome.result.value} p=${outcome.result.probabilityYes}`
        : `${outcome.result.value}`
      : 'unresolved';
    console.log(
      `  ${id}: ${value} (${outcome.disposition}${outcome.reason ? ` ${outcome.reason}` : ''})`,
    );
  }
}

function printEvaluation(report: EvaluationReport): void {
  console.log(
    `${report.provider} model=${report.model} cases=${report.cases} failures=${report.failures} meanLatencyMs=${report.latencyMs.mean.toFixed(1)}`,
  );
  for (const [judgment, counts] of Object.entries(report.byJudgment)) {
    const accuracy = counts.accuracy === null ? 'n/a' : counts.accuracy.toFixed(3);
    console.log(`  ${judgment}: ${counts.correct}/${counts.answered} accuracy=${accuracy}`);
  }
  for (const [bucket, counts] of Object.entries(report.byChoiceSetSize)) {
    const accuracy = counts.accuracy === null ? 'n/a' : counts.accuracy.toFixed(3);
    console.log(
      `  choice set ${bucket}: ${counts.correct}/${counts.answered} accuracy=${accuracy}`,
    );
  }
}

async function loadOrBuildShadow(args: CliArgs): Promise<ShadowReport> {
  const { existsSync, readFileSync } = await import('node:fs');
  const path = join(repoRoot, 'generated/decisions/shadow/latest.json');
  if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8')) as ShadowReport;
  const rules = rulesById();
  const provider = cached(buildProvider('structural', args, rules), args);
  return runShadow(selectedCases(args), [provider]);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'decision command failed';
  console.error(message);
  process.exit(1);
});
