import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { repoRoot } from '../../scripts/validate/schemas.ts';
import { withCache, decisionCacheKey } from '../../scripts/decisions/cache.ts';
import { createCascadeProvider } from '../../scripts/decisions/cascade.ts';
import { summarize, scoreCase } from '../../scripts/decisions/evaluate.ts';
import { loadGold, rulesById } from '../../scripts/decisions/gold.ts';
import { classifyJevError, createJevProvider } from '../../scripts/decisions/jev.ts';
import { createLayaProvider } from '../../scripts/decisions/laya.ts';
import { createLlmProvider } from '../../scripts/decisions/llm.ts';
import { observe } from '../../scripts/decisions/observe.ts';
import { UNCALIBRATED_POLICY, escalationsFor } from '../../scripts/decisions/policy.ts';
import { createFixtureProvider, createNoneProvider } from '../../scripts/decisions/providers.ts';
import { buildQuestions } from '../../scripts/decisions/questions.ts';
import { choiceResult, noulResult } from '../../scripts/decisions/report.ts';
import { disagreements, runShadow, uncertain } from '../../scripts/decisions/shadow.ts';
import { createStructuralProvider } from '../../scripts/decisions/structural.ts';
import {
  JUDGMENT_IDS,
  RULE_TYPE_OPTIONS,
  type DecisionRequest,
  type ProviderAttempt,
} from '../../scripts/decisions/types.ts';
import { AuthenticationError, RateLimitError } from '@typesafe-ai/sdk';

const exec = promisify(execFile);

function request(stateText = 'A roll of 91-00 is always a failure.'): DecisionRequest {
  const state = {
    focus: 'Rolls of 91-00.',
    source_text: stateText,
    term_candidates: [
      { id: 'term.skill_test', name: 'Skill Test' },
      { id: 'term.coins', name: 'Coins' },
    ],
  };
  return {
    subjectId: 'core.check.automatic_failure',
    state,
    questions: buildQuestions(state, JUDGMENT_IDS),
  };
}

function attempt(
  provider: ProviderAttempt['provider'],
  judgments: ProviderAttempt['judgments'],
): ProviderAttempt {
  return {
    provider,
    model: provider,
    modelRevision: 'test',
    runtime: 'test',
    judgments,
    failure: null,
    latencyMs: 1,
    requests: 1,
    inputTokens: null,
    outputTokens: null,
    escalations: [],
  };
}

describe('semantic decision questions', () => {
  it('uses the corpus rule type enum plus no_match', () => {
    const schema = JSON.parse(readFileSync(join(repoRoot, 'schemas/rule.schema.json'), 'utf8')) as {
      items: { properties: { type: { enum: string[] } } };
    };
    expect(RULE_TYPE_OPTIONS.slice(0, -1)).toEqual(schema.items.properties.type.enum);
    expect(RULE_TYPE_OPTIONS.at(-1)).toBe('no_match');
  });

  it('asks independent questions and omits term selection until candidates exist', () => {
    const bare = buildQuestions({ focus: 'A claim.', source_text: 'Text.' }, JUDGMENT_IDS);
    expect(bare.map((question) => question.id)).not.toContain('referenced_term');
    const full = request();
    const ruleType = full.questions.find((question) => question.id === 'rule_type');
    expect(ruleType?.optionCount).toBe(RULE_TYPE_OPTIONS.length);
    expect(ruleType?.optionCount).toBeLessThan(20);
    expect(full.questions.find((question) => question.id === 'referenced_term')?.optionCount).toBe(
      3,
    );
    expect(JSON.stringify(full.state)).not.toContain('"type"');
    for (const question of full.questions) {
      expect(question.instructions).toContain('`focus`');
      expect(question.instructions).not.toContain('calculation');
    }
  });
});

describe('escalation policy', () => {
  it('does not treat an uncalibrated probability as an escalation', () => {
    const questions = request().questions.filter((question) => question.id === 'rule_type');
    const judgments = {
      rule_type: choiceResult(
        'calculation',
        { calculation: 0.4 },
        0.1,
        'distribution_peak',
        'model',
      ),
    };
    expect(escalationsFor('laya', judgments, questions, UNCALIBRATED_POLICY)).toEqual([]);
    expect(escalationsFor('jev', judgments, questions, UNCALIBRATED_POLICY)).toEqual([]);
  });

  it('escalates a large Laya choice set and leaves Jev on the same question', () => {
    const criteria: Record<string, string> = {};
    for (let index = 0; index < 22; index += 1) criteria[`option_${index}`] = `Option ${index}`;
    const question = {
      id: 'referenced_term' as const,
      primitive: 'choice' as const,
      instructions: 'Which one?',
      criteria,
      optionCount: 22,
    };
    const judgments = {
      referenced_term: choiceResult(
        'option_0',
        { option_0: 0.99 },
        0.99,
        'normalized_entropy',
        'model',
      ),
    };
    expect(escalationsFor('laya', judgments, [question], UNCALIBRATED_POLICY)[0]?.reason).toBe(
      'laya_choice_set_at_least_20',
    );
    expect(escalationsFor('jev', judgments, [question], UNCALIBRATED_POLICY)).toEqual([]);
  });

  it('applies a floor only when one has been set for that provider', () => {
    const questions = request().questions.filter((question) => question.id === 'conditional');
    const judgments = { conditional: noulResult(0.5, 'model') };
    const policy = { ...UNCALIBRATED_POLICY, calibrated: true, noulMarginFloor: { jev: 0.1 } };
    expect(escalationsFor('laya', judgments, questions, policy)).toEqual([]);
    expect(escalationsFor('jev', judgments, questions, policy)[0]?.reason).toBe(
      'noul_margin_below_floor',
    );
  });
});

describe('providers', () => {
  it('keeps canonical extraction independent of a missing provider', async () => {
    const report = await createNoneProvider().decide(request());
    expect(report.failure?.code).toBe('unavailable');
    expect(
      Object.values(report.judgments).every((outcome) => outcome?.disposition === 'unresolved'),
    ).toBe(true);
  });

  it('does not call Jev without a key', async () => {
    let called = false;
    const provider = createJevProvider({
      apiKey: null,
      fetch: () => {
        called = true;
        throw new Error('network');
      },
    });
    expect((await provider.availability()).available).toBe(false);
    const report = await provider.decide(request());
    expect(called).toBe(false);
    expect(report.failure?.code).toBe('authentication_failure');
  });

  it('normalizes a Jev response and classifies transport errors', async () => {
    const sample = request();
    const kept = sample.questions.filter(
      (question) => question.id === 'rule_type' || question.id === 'conditional',
    );
    const provider = createJevProvider({
      apiKey: 'test-key',
      fetch: async () =>
        new Response(
          JSON.stringify({
            model: 'jev-test',
            answers: {
              rule_type: {
                type: 'choice',
                choice: 'exception',
                confidence: 0.7,
                probabilities: { exception: 0.7, calculation: 0.3 },
              },
              conditional: { type: 'noul', noul: 0.2 },
            },
            usage: { input_tokens: 12, output_tokens: 3 },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    });
    const report = await provider.decide({ ...sample, questions: kept });
    expect(report.failure).toBeNull();
    expect(report.model).toBe('jev-test');
    expect(report.judgments.rule_type?.result).toMatchObject({
      value: 'exception',
      confidenceMeaning: 'distribution_peak',
      probabilityMeaning: 'model',
    });
    expect(report.judgments.conditional?.result).toMatchObject({ primitive: 'noul', value: false });
    expect(
      classifyJevError(new AuthenticationError(401, undefined, new Headers(), 'no')),
    ).toMatchObject({
      code: 'authentication_failure',
    });
    expect(classifyJevError(new RateLimitError(429, undefined, new Headers(), 'no'))).toMatchObject(
      {
        code: 'rate_limited',
      },
    );
  });

  it('normalizes Laya answers from an injected runtime', async () => {
    const provider = createLayaProvider({
      runtime: {
        async systemOne() {
          return {
            model: 'convaiinnovations/laya',
            answers: {
              conditional: { type: 'noul', noul: 0.91 },
              rule_type: {
                type: 'choice',
                choice: 'not-an-option',
                confidence: 0.4,
                probabilities: { exception: 1 },
              },
            },
            usage: { input_tokens: 4, output_tokens: 1 },
          };
        },
        async close() {},
      },
    });
    const sample = request();
    const report = await provider.decide({
      ...sample,
      questions: sample.questions.filter(
        (question) => question.id === 'rule_type' || question.id === 'conditional',
      ),
    });
    expect(report.failure?.code).toBe('malformed_output');
  });

  it('rejects a malformed LLM payload', async () => {
    const provider = createLlmProvider({ id: 'test-llm', complete: async () => 'not json' });
    const report = await provider.decide(request());
    expect(report.failure?.code).toBe('malformed_output');
    expect((await createLlmProvider(null).availability()).available).toBe(false);
  });
});

describe('cascade', () => {
  it('keeps the local answer when it is usable and records an escalated attempt', async () => {
    const sample = request();
    const laya = createFixtureProvider('laya', () =>
      attempt('laya', {
        rule_type: choiceResult(
          'exception',
          { exception: 0.2 },
          0.2,
          'normalized_entropy',
          'model',
        ),
        conditional: noulResult(0.95, 'model'),
      }),
    );
    const jev = createFixtureProvider('jev', (incoming) => {
      const judgments: ProviderAttempt['judgments'] = {};
      for (const question of incoming.questions) {
        judgments[question.id] = choiceResult(
          'calculation',
          { calculation: 1 },
          0.8,
          'distribution_peak',
          'model',
        );
      }
      return attempt('jev', judgments);
    });
    const policy = {
      ...UNCALIBRATED_POLICY,
      choiceConfidenceFloor: { laya: 0.5 },
    };
    const report = await createCascadeProvider([laya, jev], policy).decide(sample);
    expect(report.judgments.conditional?.disposition).toBe('accepted');
    expect(report.judgments.conditional?.result).toMatchObject({ probabilityMeaning: 'model' });
    expect(report.attempts[0]?.escalations.map((item) => item.judgment)).toContain('rule_type');
    expect(report.attempts[1]?.provider).toBe('jev');
    expect(report.attempts[1]?.judgments.rule_type?.value).toBe('calculation');
    expect(report.judgments.rule_type?.result).toMatchObject({ value: 'calculation' });
  });

  it('leaves the judgment unresolved when every provider fails', async () => {
    const broken = createFixtureProvider('laya', () => ({
      ...attempt('laya', {}),
      failure: { code: 'inference_failure', message: 'boom' },
    }));
    const report = await createCascadeProvider([broken]).decide(request());
    expect(report.judgments.rule_type?.disposition).toBe('unresolved');
    expect(report.attempts[0]?.judgments).toEqual({});
  });
});

describe('decision cache', () => {
  it('changes key when the claim changes and skips caching an authentication failure', async () => {
    const first = request('first');
    const second = request('second');
    expect(decisionCacheKey('structural', first)).not.toBe(decisionCacheKey('structural', second));
    expect(decisionCacheKey('structural', first)).toBe(
      decisionCacheKey('structural', request('first')),
    );
    const directory = mkdtempSync(join(tmpdir(), 'lod-decisions-'));
    const provider = withCache(
      createJevProvider({ apiKey: null, fetch: async () => new Response('no') }),
      { directory },
    );
    await provider.decide(first);
    await provider.decide(first);
    expect(readdirSync(directory)).toEqual([]);
  });
});

describe('gold set', () => {
  const cases = loadGold();

  it('covers every split and includes a no-match and a large choice set', () => {
    for (const split of ['development', 'validation', 'held_out'] as const) {
      expect(cases.filter((entry) => entry.split === split).length).toBeGreaterThanOrEqual(8);
    }
    expect(cases.some((entry) => entry.expected.rule_type === 'no_match')).toBe(true);
    expect(
      cases.some((entry) =>
        entry.request.questions.some(
          (question) => question.primitive === 'choice' && question.optionCount >= 20,
        ),
      ),
    ).toBe(true);
    const ids = cases.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('scores the structural baseline without treating completeness as known', async () => {
    const rules = rulesById();
    const provider = createStructuralProvider((id) => rules.get(id));
    const scores = [];
    for (const gold of cases) scores.push(...scoreCase(gold, await provider.decide(gold.request)));
    const report = summarize('structural', 'corpus-fields', null, cases.length, 0, scores);
    expect(report.byJudgment.completeness?.answered).toBe(0);
    const typeMismatches = scores
      .filter((score) => score.judgment === 'rule_type' && score.match === false)
      .map((score) => score.caseId)
      .sort();
    expect(typeMismatches).toEqual(
      [
        'gold.arachnophobia',
        'gold.damage_bonus',
        'gold.lost_brother.skirmish',
        'gold.morale.hero_dies',
        'gold.skill.base_stat',
        'gold.skill.known',
        'gold.warrior_priest.energy',
      ].sort(),
    );
    expect(report.byChoiceSetSize['20_or_more']).toBeDefined();
  });
});

describe('shadow comparison', () => {
  it('lists provider disagreements and unresolved rows', async () => {
    const [gold] = loadGold().filter((entry) => entry.id === 'gold.check.automatic_failure');
    if (!gold) throw new Error('missing gold case');
    const structural = createStructuralProvider((id) => rulesById().get(id));
    const other = createFixtureProvider('laya', () =>
      attempt('laya', {
        rule_type: choiceResult(
          'calculation',
          { calculation: 1 },
          null,
          'unavailable',
          'deterministic',
        ),
      }),
    );
    const report = await runShadow([gold], [structural, other]);
    const rows = disagreements(report);
    expect(rows.some((row) => row.judgment === 'rule_type')).toBe(true);
    const summary = observe(report);
    expect(summary.rulesJudged).toBe(1);
    expect(uncertain(report, null).length).toBeGreaterThan(0);
  });
});

describe('decision CLI', () => {
  it('classifies with no provider and still exits successfully', async () => {
    const result = await exec(
      'npx',
      [
        'tsx',
        'scripts/decisions/cli.ts',
        'classify',
        '--provider',
        'none',
        '--rule',
        'core.check.standard',
      ],
      { cwd: repoRoot },
    );
    expect(result.stdout).toContain('core.check.standard');
    expect(result.stdout).toContain('unavailable');
  });
});
