import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  analyzeQuestion,
  lexicalAnalysis,
  type ModelQuestion,
  type SystemOneModel,
} from '../../scripts/ask/analysis.ts';
import { collectCandidates, gatherEvidence } from '../../scripts/ask/evidence.ts';
import { ask } from '../../scripts/ask/index.ts';
import {
  CALIBRATED_FILTER,
  PROVISIONAL_FILTER,
  RELEVANCE_QUESTION,
  applyFilter,
  filterEvidence,
  type FilterPolicy,
  type RecordJudgment,
} from '../../scripts/ask/ranking.ts';
import { Retrieval } from '../../scripts/retrieve/index.ts';

let retrieval: Retrieval;
beforeAll(() => {
  retrieval = Retrieval.fromCorpus();
}, 60_000);
afterAll(() => retrieval.close());

const MOLGOR = 'How many hit points does Molgor have?';
const MOLGOR_ID = 'quest_actor.chamber_of_reverence.molgor';

/** Analysis fixture: widest budget, every system, no model entity. */
const analyzer: SystemOneModel = {
  id: 'fixture',
  probabilityMeaning: 'model',
  async ask(_state, questions) {
    const answers: Record<string, unknown> = {
      intent: { choice: 'no_match', probabilities: { no_match: 0.9 } },
      complexity: { choice: 'judgment', probabilities: { judgment: 0.9 } },
      entity: { choice: 'no_match', probabilities: { no_match: 0.9 } },
      table: { choice: 'no_match', probabilities: { no_match: 0.9 } },
    };
    for (const id of Object.keys(questions))
      if (id.startsWith('system_')) answers[id] = { noul: 0.9 };
    return { answers };
  },
};

/** Relevance fixture: answers every record with the same p(irrelevant). */
function ranker(pIrrelevant: number | 'throw' | 'malformed'): SystemOneModel & {
  asked: Array<{ state: Record<string, string>; questions: Record<string, ModelQuestion> }>;
} {
  const asked: Array<{ state: Record<string, string>; questions: Record<string, ModelQuestion> }> =
    [];
  return {
    id: 'ranker',
    probabilityMeaning: 'model',
    asked,
    async ask(state, questions) {
      asked.push({ state, questions });
      if (pIrrelevant === 'throw') throw new Error('503 unavailable');
      if (pIrrelevant === 'malformed') return { answers: { relevance: { choice: 'maybe' } } };
      const relevant = 1 - pIrrelevant;
      return {
        answers: {
          relevance: {
            choice: pIrrelevant >= 0.5 ? 'irrelevant' : 'direct',
            probabilities: { direct: relevant, supporting: 0, irrelevant: pIrrelevant },
          },
        },
      };
    },
  };
}

describe('candidate pool', () => {
  it('returns the same records in the same order as gatherEvidence, with their sources', async () => {
    const analysis = await analyzeQuestion(retrieval, MOLGOR, analyzer);
    const candidates = collectCandidates(retrieval, analysis);
    expect(candidates.map((c) => c.id)).toEqual(
      gatherEvidence(retrieval, analysis).map((e) => e.id),
    );
    const lexicalIds = gatherEvidence(retrieval, lexicalAnalysis(retrieval, MOLGOR)).map(
      (e) => e.id,
    );
    expect(candidates.filter((c) => c.sources.includes('lexical')).map((c) => c.id)).toEqual(
      lexicalIds,
    );
    expect(candidates.find((c) => c.id === MOLGOR_ID)).toMatchObject({ exact: true });
    expect(candidates.some((c) => !c.exact)).toBe(true);
  });

  it('labels a lone lexical analysis lexical and a lone model analysis model', async () => {
    const lexical = collectCandidates(retrieval, lexicalAnalysis(retrieval, MOLGOR));
    expect(lexical.every((c) => c.sources.join() === 'lexical')).toBe(true);
    const { baseline: _baseline, ...alone } = await analyzeQuestion(retrieval, MOLGOR, analyzer);
    expect(collectCandidates(retrieval, alone).every((c) => c.sources.join() === 'model')).toBe(
      true,
    );
  });
});

describe('Jev relevance filter', () => {
  it('asks one relevance question per record, with the question and record in state', async () => {
    const analysis = await analyzeQuestion(retrieval, MOLGOR, analyzer);
    const model = ranker(0.1);
    const result = await filterEvidence(retrieval, analysis, model);
    expect(model.asked).toHaveLength(result.decisions.length);
    for (const call of model.asked) {
      expect(call.questions).toEqual({ relevance: RELEVANCE_QUESTION });
      expect(call.state.question).toBe(MOLGOR);
      expect(JSON.parse(call.state.record!)).toHaveProperty('text');
    }
    expect(result.evidence.map((e) => e.id)).toEqual(
      gatherEvidence(retrieval, analysis).map((e) => e.id),
    );
  });

  it('drops lexical noise it is sure of; exact protection keeps name matches', async () => {
    const analysis = await analyzeQuestion(retrieval, MOLGOR, analyzer);
    const pool = gatherEvidence(retrieval, analysis).map((e) => e.id);
    const guarded = { ...PROVISIONAL_FILTER, protectExact: true };
    const result = await filterEvidence(retrieval, analysis, ranker(0.99), guarded);
    const kept = result.evidence.map((e) => e.id);
    expect(kept).toContain(MOLGOR_ID);
    expect(kept.every((id) => pool.includes(id))).toBe(true);
    expect(result.decisions.map((d) => d.id)).toEqual(pool);
    const droppedLexical = result.decisions.filter((d) => !d.kept && d.sources.includes('lexical'));
    expect(droppedLexical.length).toBeGreaterThan(0);
    expect(
      result.decisions
        .filter((d) => d.kept)
        .every((d) => ['protected', 'linked'].includes(d.reason)),
    ).toBe(true);

    const open = await filterEvidence(retrieval, analysis, ranker(0.99), {
      ...guarded,
      protectExact: false,
    });
    expect(open.evidence.map((e) => e.id)).not.toContain(MOLGOR_ID);
  });

  it('keeps records reached through a dependency link when protectLinked is on', () => {
    const candidates = [
      { id: 'table.x', why: ['expand:uses_table'], sources: ['lexical' as const], exact: false },
      { id: 'rule.y', why: ['expand:see_also'], sources: ['lexical' as const], exact: false },
    ];
    const sure = (id: string): [string, RecordJudgment] => [
      id,
      { id, relevance: 'irrelevant', probabilities: { direct: 0, supporting: 0, irrelevant: 1 } },
    ];
    const judgments = new Map([sure('table.x'), sure('rule.y')]);
    expect(
      applyFilter(candidates, judgments, PROVISIONAL_FILTER, 10).map((d) => [d.id, d.reason]),
    ).toEqual([
      ['table.x', 'linked'],
      ['rule.y', 'irrelevant'],
    ]);
  });

  it('pins calibrated-1: rules drop at 0.95, tables and procedures at 0.99', () => {
    expect(CALIBRATED_FILTER).toEqual({
      id: 'calibrated-1',
      dropIrrelevantAt: 0.95,
      protectExact: false,
      protectLinked: true,
      cap: false,
      dropAtByKind: { table: 0.99, procedure: 0.99 },
    });
    const candidates = ['rule', 'table', 'procedure'].map((kind) => ({
      id: `${kind}.x`,
      kind,
      why: ['search'],
      sources: ['lexical' as const],
      exact: false,
    }));
    const at = (p: number) =>
      new Map(
        candidates.map((c): [string, RecordJudgment] => [
          c.id,
          {
            id: c.id,
            relevance: 'irrelevant',
            probabilities: { direct: 1 - p, supporting: 0, irrelevant: p },
          },
        ]),
      );
    expect(applyFilter(candidates, at(0.97), CALIBRATED_FILTER, 10).map((d) => d.kept)).toEqual([
      false,
      true,
      true,
    ]);
    expect(applyFilter(candidates, at(0.99), CALIBRATED_FILTER, 10).map((d) => d.kept)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('keeps records below the threshold', async () => {
    const analysis = await analyzeQuestion(retrieval, MOLGOR, analyzer);
    const below = CALIBRATED_FILTER.dropIrrelevantAt - 0.01;
    const result = await filterEvidence(retrieval, analysis, ranker(below));
    expect(result.decisions.every((d) => d.kept)).toBe(true);
  });

  it('keeps every record when the ranker fails or answers malformed', async () => {
    const analysis = await analyzeQuestion(retrieval, MOLGOR, analyzer);
    const pool = gatherEvidence(retrieval, analysis).map((e) => e.id);
    for (const broken of [ranker('throw'), ranker('malformed')]) {
      const result = await filterEvidence(retrieval, analysis, broken);
      expect(result.evidence.map((e) => e.id)).toEqual(pool);
      expect(result.fallback).toMatch(/^ranker: /);
    }
  });

  it('caps open records to the budget, dropping the most likely irrelevant first', () => {
    const candidates = ['a', 'b', 'c', 'd'].map((id) => ({
      id,
      why: ['search'],
      sources: ['lexical' as const],
      exact: id === 'a',
    }));
    const judgment = (id: string, irrelevant: number): [string, RecordJudgment] => [
      id,
      {
        id,
        relevance: 'direct',
        probabilities: { direct: 1 - irrelevant, supporting: 0, irrelevant },
      },
    ];
    const judgments = new Map([
      judgment('a', 0.8),
      judgment('b', 0.3),
      judgment('c', 0.6),
      judgment('d', 0.1),
    ]);
    const policy: FilterPolicy = {
      id: 't',
      dropIrrelevantAt: 0.9,
      protectExact: true,
      protectLinked: true,
      cap: true,
    };
    const decisions = applyFilter(candidates, judgments, policy, 3);
    expect(decisions.map((d) => [d.id, d.kept, d.reason])).toEqual([
      ['a', true, 'protected'],
      ['b', true, 'relevant'],
      ['c', false, 'cap'],
      ['d', true, 'relevant'],
    ]);
    const unprotected = applyFilter(
      candidates,
      judgments,
      { ...policy, protectExact: false, cap: false, dropIrrelevantAt: 0.7 },
      3,
    );
    expect(unprotected.find((d) => d.id === 'a')).toMatchObject({
      kept: false,
      reason: 'irrelevant',
    });
  });
});

describe('calibration knobs', () => {
  const judged = (irrelevant: number): RecordJudgment => ({
    id: '',
    relevance: 'irrelevant',
    probabilities: { direct: 0, supporting: 1 - irrelevant, irrelevant },
  });
  const base: FilterPolicy = {
    id: 't',
    dropIrrelevantAt: 0.9,
    protectExact: false,
    protectLinked: false,
    cap: false,
  };

  it('protects records by how they were retrieved', () => {
    const candidates = [
      { id: 'a', why: ['heading:section.combat.wounded'], sources: ['lexical' as const] },
      { id: 'b', why: ['search'], sources: ['lexical' as const] },
    ].map((c) => ({ ...c, exact: false }));
    const judgments = new Map([
      ['a', judged(1)],
      ['b', judged(1)],
    ]);
    const policy = { ...base, protectWhy: ['heading:'] };
    expect(applyFilter(candidates, judgments, policy, 10).map((d) => d.reason)).toEqual([
      'structural',
      'irrelevant',
    ]);
  });

  it('applies a per-kind threshold and a minimum-kept floor', () => {
    const candidates = [
      { id: 't', kind: 'table' },
      { id: 'r', kind: 'rule' },
      { id: 's', kind: 'rule' },
    ].map((c) => ({ ...c, why: ['search'], sources: ['lexical' as const], exact: false }));
    const judgments = new Map([
      ['t', judged(0.93)],
      ['r', judged(0.95)],
      ['s', judged(0.99)],
    ]);
    const byKind = { ...base, dropAtByKind: { table: 0.97 } };
    expect(applyFilter(candidates, judgments, byKind, 10).map((d) => d.kept)).toEqual([
      true,
      false,
      false,
    ]);
    // The floor restores the least likely irrelevant drop first.
    const floor = { ...byKind, minKept: 2 };
    expect(applyFilter(candidates, judgments, floor, 10).map((d) => d.reason)).toEqual([
      'relevant',
      'floor',
      'irrelevant',
    ]);
  });
});

describe('ask with a filter', () => {
  it('filters a model analysis and records every decision', async () => {
    const result = await ask(retrieval, MOLGOR, {
      model: analyzer,
      filter: { ranker: ranker(0.99) },
    });
    expect(result.filter?.policy).toEqual(CALIBRATED_FILTER);
    expect(result.evidence.map((e) => e.id)).toEqual(
      result.filter!.decisions.filter((d) => d.kept).map((d) => d.id),
    );
    expect(result.prompt).not.toContain(`[${result.filter!.decisions.find((d) => !d.kept)!.id}]`);
  });

  it('does not filter a lexical analysis', async () => {
    const model = ranker(0.99);
    const result = await ask(retrieval, MOLGOR, { filter: { ranker: model } });
    expect(result.filter).toBeUndefined();
    expect(model.asked).toHaveLength(0);
  });
});
