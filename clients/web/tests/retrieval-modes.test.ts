import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { SystemOneModel } from '../../../scripts/ask/analysis.ts';
import { ask } from '../../../scripts/ask/index.ts';
import { Retrieval } from '../../../scripts/retrieve/index.ts';
import { MODES, RETRIEVAL_MODES, defaultMode } from '../src/lib/retrieval-modes.ts';
import { askOptions, getRetrievalSettings, summarize } from '../src/server/ask-service.ts';

let retrieval: Retrieval;
before(() => {
  retrieval = Retrieval.fromCorpus();
});
after(() => retrieval.close());

const MOLGOR = 'How many hit points does Molgor have?';

/** Analysis fixture: widest budget, every system, no model entity. */
const analyzer: SystemOneModel = {
  id: 'fixture',
  probabilityMeaning: 'model',
  async ask(_state, questions) {
    const answers: Record<string, unknown> = {
      intent: { choice: 'no_match', probabilities: { no_match: 0.9 } },
      complexity: { choice: 'judgment', probabilities: { judgment: 0.9 } },
      entity: { choice: 'no_match', probabilities: { no_match: 0.9 } },
    };
    for (const id of Object.keys(questions))
      if (id.startsWith('system_')) answers[id] = { noul: 0.9 };
    return { answers };
  },
};

/** Relevance fixture: judges every record irrelevant. */
const ranker: SystemOneModel = {
  id: 'ranker',
  probabilityMeaning: 'model',
  async ask() {
    return {
      answers: {
        relevance: {
          choice: 'irrelevant',
          probabilities: { direct: 0.01, supporting: 0, irrelevant: 0.99 },
        },
      },
    };
  },
};

function withEnv(env: Record<string, string | undefined>, run: () => void) {
  const saved = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  const apply = (values: Record<string, string | undefined>) => {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  apply(env);
  try {
    run();
  } finally {
    apply(saved);
  }
}

test('the default is unfiltered Jev with a key, lexical without, and LOD_ANALYZER wins when usable', () => {
  assert.equal(defaultMode(undefined, true), 'jev');
  assert.equal(defaultMode(undefined, false), 'lexical');
  assert.equal(defaultMode('bogus', true), 'jev');
  assert.equal(defaultMode('jev_filtered', true), 'jev_filtered');
  assert.equal(defaultMode('jev_filtered', false), 'lexical');
  assert.equal(defaultMode('lexical', true), 'lexical');
  assert.equal(defaultMode('laya', false), 'lexical');

  withEnv({ TYPESAFE_API_KEY: 'test-key', LOD_ANALYZER: undefined }, () =>
    assert.deepEqual(getRetrievalSettings(), { defaultMode: 'jev', jevAvailable: true }),
  );
  withEnv({ TYPESAFE_API_KEY: undefined, LOD_ANALYZER: 'jev_filtered' }, () =>
    assert.deepEqual(getRetrievalSettings(), { defaultMode: 'lexical', jevAvailable: false }),
  );
});

test('only the filtered mode passes a ranker to ask(), and it uses the Jev analyzer', () => {
  assert.deepEqual(
    RETRIEVAL_MODES.filter((mode) => MODES[mode].filter),
    ['jev_filtered'],
  );
  withEnv({ TYPESAFE_API_KEY: 'test-key' }, () => {
    const filtered = askOptions('jev_filtered');
    assert.match(filtered?.model?.id ?? '', /^jev/);
    assert.match(filtered?.filter?.ranker.id ?? '', /^jev/);
    assert.equal(askOptions('jev')?.filter, null);
    assert.match(askOptions('jev')?.model?.id ?? '', /^jev/);
    assert.deepEqual(askOptions('lexical'), { model: null, filter: null });
  });
});

test('the evidence summary lists the records the filter dropped', async () => {
  const result = await ask(retrieval, MOLGOR, { model: analyzer, filter: { ranker } });
  const summary = summarize(result, 'jev_filtered');
  const dropped = result.filter!.decisions.filter((d) => !d.kept).map((d) => d.id);
  assert.ok(dropped.length > 0);
  assert.deepEqual(
    summary.filter?.dropped.map((d) => d.id),
    dropped,
  );
  assert.ok(summary.filter?.dropped.every((d) => d.pIrrelevant === 0.99));
  assert.deepEqual(
    summary.evidence.map((e) => e.id),
    result.evidence.map((e) => e.id),
  );

  const unfiltered = summarize(await ask(retrieval, MOLGOR, { model: analyzer }), 'jev');
  assert.equal(unfiltered.filter, undefined);
});
