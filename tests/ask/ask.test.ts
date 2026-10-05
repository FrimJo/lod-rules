import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  SYSTEMS,
  analyzeQuestion,
  lexicalAnalysis,
  selectedSystems,
  type ModelQuestion,
  type SystemOneModel,
} from '../../scripts/ask/analysis.ts';
import { gatherEvidence } from '../../scripts/ask/evidence.ts';
import { ask } from '../../scripts/ask/index.ts';
import { buildPrompt, checkCitations } from '../../scripts/ask/prompt.ts';
import { Retrieval } from '../../scripts/retrieve/index.ts';

let retrieval: Retrieval;
beforeAll(() => {
  retrieval = Retrieval.fromCorpus();
}, 60_000);
afterAll(() => retrieval.close());

const BLEEDING = 'My hero is poisoned and bleeding out during a rest. What happens?';
const MOLGOR = 'How many hit points does Molgor have?';

/** Replays fixed Laya/Jev-shaped answers and records the questions it was asked. */
function fixtureModel(
  answers: (questions: Record<string, ModelQuestion>) => Record<string, unknown>,
): SystemOneModel & { asked: Array<Record<string, ModelQuestion>> } {
  const asked: Array<Record<string, ModelQuestion>> = [];
  return {
    id: 'fixture',
    probabilityMeaning: 'model',
    asked,
    async ask(_state, questions) {
      asked.push(questions);
      return { answers: answers(questions) };
    },
  };
}

function narrowAnswers(questions: Record<string, ModelQuestion>): Record<string, unknown> {
  const answers: Record<string, unknown> = {
    intent: { choice: 'no_match', probabilities: { no_match: 0.9 } },
    complexity: { choice: 'single_fact', probabilities: { single_fact: 0.9 } },
    entity: { choice: 'no_match', probabilities: { no_match: 0.9 } },
  };
  for (const id of Object.keys(questions))
    if (id.startsWith('system_')) answers[id] = { noul: 0.05 };
  return answers;
}

describe('lexical analysis', () => {
  it('finds exact entity names, including short names', () => {
    const analysis = lexicalAnalysis(retrieval, MOLGOR);
    expect(analysis.entities).toContainEqual(
      expect.objectContaining({ id: 'quest_actor.chamber_of_reverence.molgor', via: 'alias' }),
    );
    expect(analysis.intent.value).toBe('value_lookup');
    expect(analysis.probabilityMeaning).toBe('deterministic');
  });

  it('selects game systems from the chapters of matching records', () => {
    const analysis = lexicalAnalysis(retrieval, BLEEDING);
    expect(selectedSystems(analysis)).toContain('conditions');
    expect(analysis.intent.value).toBe('situation_ruling');
  });
});

describe('model analysis', () => {
  it('asks intent, complexity, entity and one noul per system in a single call', async () => {
    const model = fixtureModel(narrowAnswers);
    await analyzeQuestion(retrieval, MOLGOR, model);
    expect(model.asked).toHaveLength(1);
    const ids = Object.keys(model.asked[0]!);
    expect(ids).toEqual(expect.arrayContaining(['intent', 'complexity', 'entity']));
    for (const system of Object.keys(SYSTEMS)) expect(ids).toContain(`system_${system}`);
    expect(Object.keys(model.asked[0]!.entity!.criteria).length).toBeLessThan(20);
  });

  it('maps the chosen entity option back to its record', async () => {
    const model = fixtureModel((questions) => {
      const entity = Object.entries(questions.entity!.criteria).find(([, label]) =>
        label.startsWith('Slaying the Fiend'),
      );
      return {
        ...narrowAnswers(questions),
        entity: { choice: entity?.[0] ?? 'no_match', probabilities: {} },
      };
    });
    const analysis = await analyzeQuestion(
      retrieval,
      'Molgor quest Slaying the Fiend setup',
      model,
    );
    expect(analysis.entities).toContainEqual(
      expect.objectContaining({ id: 'quest.chamber_of_reverence.slaying_fiend' }),
    );
    expect(analysis.baseline?.analyzer).toBe('lexical');
  });

  it('falls back to lexical analysis when the model output is malformed', async () => {
    const model = fixtureModel(() => ({ intent: { choice: 'not_an_option' } }));
    const analysis = await analyzeQuestion(retrieval, MOLGOR, model);
    expect(analysis.analyzer).toBe('lexical');
    expect(analysis.fallback).toMatch(/^fixture:/);
  });
});

describe('evidence', () => {
  it('is deterministic and carries provenance', () => {
    const analysis = lexicalAnalysis(retrieval, BLEEDING);
    const first = gatherEvidence(retrieval, analysis);
    expect(gatherEvidence(retrieval, analysis)).toEqual(first);
    for (const item of first) {
      expect(item.citations.length).toBeGreaterThan(0);
      expect(item.why.length).toBeGreaterThan(0);
    }
  });

  it('includes the rules a game master needs for the question', () => {
    const ids = gatherEvidence(retrieval, lexicalAnalysis(retrieval, BLEEDING)).map((i) => i.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'procedure.bleeding_out',
        'procedure.rest_bleeding_check',
        'procedure.rest_poison_checks',
      ]),
    );
    const molgor = gatherEvidence(retrieval, lexicalAnalysis(retrieval, MOLGOR));
    expect(molgor[0]?.id).toBe('quest_actor.chamber_of_reverence.molgor');
    expect(molgor.map((i) => i.id)).toContain('table.quest.slaying_fiend.molgor');
    expect(molgor.find((i) => i.id === 'table.quest.slaying_fiend.molgor')).toMatchObject({
      scope: 'quest',
      quest_title: 'Slaying the Fiend',
    });
  });

  it('keeps records from the same heading as a top hit together', () => {
    const question = 'For a wizard, how does miscast and failing a spell relate?';
    const evidence = gatherEvidence(retrieval, lexicalAnalysis(retrieval, question));
    const wounded = evidence.find((i) => i.id === 'core.magic.miscast.threshold.wounded');
    expect(wounded?.why).toContain('section:section.magic.miscast');
    // Siblings sit on top of the budget, so the miscast table the rule uses still fits.
    expect(evidence.map((i) => i.id)).toEqual(
      expect.arrayContaining(['core.magic.miscast', 'table.magic.miscast']),
    );
  });

  it('brings in the rule behind a heading the question names, from any chapter', () => {
    const question = 'Can a wounded wizard still cast spells, and is a miscast more likely?';
    const evidence = gatherEvidence(retrieval, lexicalAnalysis(retrieval, question));
    const wounded = evidence.find((i) => i.id === 'character.hit_points.wounded');
    expect(wounded?.why).toContain('heading:section.combat.wounded');
  });

  it('lets an uncalibrated model widen retrieval but never narrow it', async () => {
    const narrow = await analyzeQuestion(retrieval, BLEEDING, fixtureModel(narrowAnswers));
    expect(selectedSystems(narrow)).toEqual([]);
    const baseline = gatherEvidence(retrieval, lexicalAnalysis(retrieval, BLEEDING)).map(
      (i) => i.id,
    );
    const ids = gatherEvidence(retrieval, narrow).map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(baseline));
  });
});

describe('prompt and citations', () => {
  it('puts every evidence id, scope and issue into the prompt', () => {
    const analysis = lexicalAnalysis(retrieval, BLEEDING);
    const evidence = gatherEvidence(retrieval, analysis);
    const prompt = buildPrompt(analysis, evidence);
    for (const item of evidence) expect(prompt).toContain(`[${item.id}]`);
    expect(prompt).toContain('ISSUE issue.');
    expect(prompt).toContain(`QUESTION: ${BLEEDING}`);
  });

  it('accepts citations of evidence records and their issues, and flags anything else', () => {
    const evidence = gatherEvidence(retrieval, lexicalAnalysis(retrieval, BLEEDING));
    const record = evidence.find((item) => item.issues.length > 0)!;
    const issue = record.issues[0]!.id;
    expect(checkCitations(`See [${record.id}] and [${issue}].`, evidence)).toMatchObject({
      unknown: [],
      grounded: true,
    });
    expect(checkCitations('See [procedure.invented_rule].', evidence)).toMatchObject({
      unknown: ['procedure.invented_rule'],
      grounded: false,
    });
    expect(checkCitations('No citations at all.', evidence).grounded).toBe(false);
  });

  it('runs the whole pipeline with an injected completer', async () => {
    let received = '';
    const result = await ask(retrieval, MOLGOR, {
      completer: {
        id: 'fake',
        async complete(prompt) {
          received = prompt;
          return 'Molgor has 45 HP [table.quest.slaying_fiend.molgor].';
        },
      },
    });
    expect(received).toContain('45');
    expect(result.citations).toMatchObject({
      cited: ['table.quest.slaying_fiend.molgor'],
      grounded: true,
    });
  });
});
