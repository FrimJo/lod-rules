import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_RESULT_LIMIT, Retrieval } from '../../scripts/retrieve/index.ts';
import { runRetrievalTool } from '../../scripts/retrieve/tools.ts';
import { printedTableText } from '../../scripts/retrieve/documents.ts';
import type { Table } from '../../scripts/validate/pilot-types.ts';
import type { RetrievalCorpus } from '../../scripts/retrieve/corpus.ts';
import { loadRetrievalCorpus } from '../../scripts/retrieve/load.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';
import {
  ACCEPTANCE_CATEGORIES,
  acceptanceContext,
  type AcceptanceContext,
  CATEGORY_MINIMUMS,
  checkAcceptanceFixture,
  identifiesAsOptional,
  runAcceptanceCase,
  type AcceptanceCase,
  type AcceptanceFixture,
} from '../support/retrieval-acceptance.ts';
import { expectRulebookOnly } from '../support/rulebook-only.ts';

const fixture = JSON.parse(
  readFileSync(join(repoRoot, 'tests/fixtures/retrieval-acceptance.json'), 'utf8'),
) as AcceptanceFixture;

let retrieval: Retrieval;
let corpus: RetrievalCorpus;
let context: AcceptanceContext;
beforeAll(() => {
  retrieval = Retrieval.fromCorpus();
  corpus = loadRetrievalCorpus();
  context = acceptanceContext(retrieval, corpus.manifest);
}, 60_000);
afterAll(() => retrieval.close());

/** A copy of the fixture with one case changed, so each rule is shown to fire on its own. */
function withCase(id: string, change: (entry: AcceptanceCase) => void): AcceptanceFixture {
  const copy = structuredClone(fixture);
  const entry = copy.cases.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`fixture has no case ${id}`);
  change(entry);
  return copy;
}

describe('retrieval acceptance fixture (issue #32)', () => {
  it('passes its own checker', () => {
    expect(checkAcceptanceFixture(fixture, context)).toEqual([]);
  });

  it('requires at least 5 cases in each category issue #34 fills', () => {
    expect(CATEGORY_MINIMUMS).toEqual({
      exact_lookup: 5,
      terminology: 5,
      combat_modifiers: 5,
      optional_rules: 5,
      service_eligibility: 5,
      quest_local_exceptions: 5,
      missing_external_material: 5,
    });
  });

  it('documents a default result limit of 10', () => {
    expect(DEFAULT_RESULT_LIMIT).toBe(10);
  });

  it('names all eight categories of the parent spec', () => {
    expect([...ACCEPTANCE_CATEGORIES].sort()).toEqual([
      'combat_modifiers',
      'conflicting_passages',
      'exact_lookup',
      'missing_external_material',
      'optional_rules',
      'quest_local_exceptions',
      'service_eligibility',
      'terminology',
    ]);
  });

  it('holds the 14 queries that used to be an it.each list', () => {
    const lexical = fixture.cases.filter(
      (entry) => entry.operation === 'search' && entry.legacy_top_ten,
    );
    expect(lexical).toHaveLength(14);
  });

  describe('fails on a minimal broken copy', () => {
    const fires = (broken: AcceptanceFixture, pattern: RegExp): void => {
      const problems = checkAcceptanceFixture(broken, context);
      expect(
        problems.some((problem) => pattern.test(problem)),
        problems.join('\n'),
      ).toBe(true);
    };
    const firstId = fixture.cases[0]!.id;

    it('an unknown category', () => {
      fires(
        withCase(firstId, (entry) => {
          entry.category = 'vibes' as AcceptanceCase['category'];
        }),
        /unknown category/,
      );
    });

    it('a duplicate case id', () => {
      const copy = structuredClone(fixture);
      copy.cases.push(structuredClone(copy.cases[0]!));
      fires(copy, /duplicate case id/);
    });

    it('an expected id that is not in the corpus', () => {
      fires(
        withCase(firstId, (entry) => {
          entry.expect_ids = ['rule.not_a_real_record'];
        }),
        /not in the corpus/,
      );
    });

    it('a limit looser than the default', () => {
      const search = fixture.cases.find((entry) => entry.operation === 'search')!;
      fires(
        withCase(search.id, (entry) => {
          entry.limit = DEFAULT_RESULT_LIMIT + 1;
        }),
        /looser than/,
      );
    });

    it('a note that names no PDF page', () => {
      fires(
        withCase(firstId, (entry) => {
          entry.note = 'seems right';
        }),
        /PDF page/,
      );
    });

    it('a note that names a page none of the expected records cite', () => {
      fires(
        withCase(firstId, (entry) => {
          entry.note = 'PDF p.286';
        }),
        /PDF page/,
      );
    });

    it('a category below its minimum case count', () => {
      const copy = structuredClone(fixture);
      const dropped = copy.cases.findIndex((entry) => entry.category === 'combat_modifiers');
      const kept = copy.cases.filter((entry) => entry.category === 'combat_modifiers');
      copy.cases = copy.cases.filter((entry) => entry.category !== 'combat_modifiers');
      copy.cases.splice(dropped, 0, ...kept.slice(0, CATEGORY_MINIMUMS.combat_modifiers! - 1));
      fires(copy, /combat_modifiers has \d+ cases; needs at least 5/);
    });

    it('a missing-external-material case that names no book', () => {
      const external = fixture.cases.find(
        (entry) => entry.category === 'missing_external_material',
      )!;
      fires(
        withCase(external.id, (entry) => {
          delete entry.expect_external;
        }),
        /must name the unavailable book/,
      );
    });

    it('a missing-external-material case that names a book that is present', () => {
      const external = fixture.cases.find(
        (entry) => entry.category === 'missing_external_material',
      )!;
      fires(
        withCase(external.id, (entry) => {
          entry.expect_external = ['rulebook.second_printing.eng'];
        }),
        /not a not_present book/,
      );
    });

    it('an optional-rule case that does not check the optional marker', () => {
      const optional = fixture.cases.find((entry) => entry.category === 'optional_rules')!;
      fires(
        withCase(optional.id, (entry) => {
          delete entry.expect_optional;
        }),
        /expect_optional/,
      );
    });

    it('a quest-local case that checks neither scope nor ranking', () => {
      const quest = fixture.cases.find((entry) => entry.category === 'quest_local_exceptions')!;
      fires(
        withCase(quest.id, (entry) => {
          delete entry.expect_quest_id;
          delete entry.expect_outranks_quest;
        }),
        /expect_quest_id or expect_outranks_quest/,
      );
    });

    it('a ranking check on an operation that does not rank', () => {
      fires(
        withCase(firstId, (entry) => {
          entry.expect_outranks_quest = true;
        }),
        /expect_outranks_quest needs a search/,
      );
    });

    it('a missing-id case whose id exists', () => {
      const missing = fixture.cases.find((entry) => entry.expect_missing)!;
      fires(
        withCase(missing.id, (entry) => {
          entry.input = { id: 'term.battle' };
        }),
        /exists/,
      );
    });
  });
});

describe('retrieval acceptance suite (issue #32)', () => {
  it.each(fixture.cases.map((entry) => [entry.id, entry] as const))('%s', (_id, entry) => {
    const outcome = runAcceptanceCase(retrieval, entry);
    const limit = entry.limit ?? DEFAULT_RESULT_LIMIT;

    if (entry.expect_missing) {
      expect(outcome.missing, 'a missing id is a normal miss').toBe(true);
      if (outcome.tool) {
        expect(outcome.output).toMatchObject({ found: false, id: entry.input.id });
        expect((outcome.output as { hint?: string }).hint).toBeTruthy();
      }
      return;
    }
    expect(outcome.missing).toBe(false);

    // Expected records appear, within the limit where the operation ranks.
    expect(outcome.ids, entry.id).toEqual(expect.arrayContaining(entry.expect_ids));
    if (entry.operation === 'search' || entry.operation === 'lod_search')
      expect(outcome.ids.length).toBeLessThanOrEqual(limit);
    if (entry.expect_review) {
      const document = outcome.documents[0];
      const shown = Object.fromEntries(
        Object.keys(entry.expect_review).map((key) => [
          key,
          document?.[key as keyof typeof entry.expect_review],
        ]),
      );
      expect(shown, `${entry.id}: review state`).toEqual(entry.expect_review);
    }
    if (entry.expect_quest_id)
      for (const id of entry.expect_ids)
        expect(
          runRetrievalTool(retrieval, 'lod_get', { id }),
          `${id}: lod_get keeps the record inside its quest`,
        ).toMatchObject({ scope: 'quest', quest_id: entry.expect_quest_id });
    if (entry.expect_outranks_quest) {
      const firstQuest = outcome.ids.findIndex((id) => retrieval.document(id)?.scope === 'quest');
      for (const id of entry.expect_ids) {
        const rank = outcome.ids.indexOf(id);
        expect(
          firstQuest === -1 || rank < firstQuest,
          `${id} (rank ${rank + 1}) must outrank the first quest-only hit ${outcome.ids[firstQuest]}`,
        ).toBe(true);
      }
    }
    if (entry.expect_optional)
      for (const id of entry.expect_ids)
        expect(
          identifiesAsOptional(runRetrievalTool(retrieval, 'lod_get', { id })),
          `${id}: lod_get identifies the rule as optional`,
        ).toBe(true);
    for (const documentName of entry.expect_external ?? [])
      expect(outcome.externalDocuments, entry.id).toContain(documentName);

    // Universal checks on every hit.
    for (const hit of outcome.hits) {
      expect(
        hit.citations.some((citation) => typeof citation.pdf_page === 'number'),
        `${hit.id}: a citation with a PDF page`,
      ).toBe(true);
    }
    for (const document of outcome.documents) {
      expect(document.file, `${document.id}: file`).toBeTruthy();
      expect(document.section_id, `${document.id}: section`).toBeTruthy();
    }
    if (outcome.tool) expectRulebookOnly(outcome.output, entry.id);
  });
});

describe('tables survive retrieval whole (issue #34)', () => {
  interface ToolTable {
    id: string;
    kind: string;
    data: {
      columns: unknown;
      rows: Array<{ id: string; source_row: string; row_kind?: string; cells: unknown }>;
      footnotes: unknown;
    };
  }
  const tables = (): Table[] => corpus.pilot.tables;

  it('lod_get returns every printed column, row, cell and footnote of every table', () => {
    expect(tables().length).toBeGreaterThan(0);
    for (const table of tables()) {
      const output = runRetrievalTool(retrieval, 'lod_get', { id: table.id }) as ToolTable;
      expect(output.kind, table.id).toBe('table');
      expect(output.data.columns, `${table.id}: columns`).toEqual(table.columns);
      expect(
        output.data.rows.map(({ id, source_row, row_kind, cells }) => ({
          id,
          source_row,
          row_kind,
          cells,
        })),
        `${table.id}: rows`,
      ).toEqual(
        table.rows.map(({ id, source_row, row_kind, cells }) => ({
          id,
          source_row,
          row_kind,
          cells,
        })),
      );
      expect(output.data.footnotes, `${table.id}: footnotes`).toEqual(table.footnotes);
    }
  });

  it('table search hits name their table and snippet its printed cells', () => {
    const byId = new Map(tables().map((table) => [table.id, table]));
    for (const table of tables()) {
      const hits = runRetrievalTool(retrieval, 'lod_search', {
        query: table.id,
        kinds: ['table'],
      }) as Array<{ id: string; kind: string; snippet: string }>;
      expect(hits[0]?.id, `${table.id}: an exact id ranks first`).toBe(table.id);
      for (const hit of hits) {
        const hitTable = byId.get(hit.id);
        expect(hitTable, `${hit.id}: a table hit names a table record`).toBeDefined();
        expect(hit.kind).toBe('table');
        expect(hit.snippet, `${hit.id}: snippet`).toBe(printedTableText(hitTable!).slice(0, 200));
      }
    }
  });
});
