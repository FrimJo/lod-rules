import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_RESULT_LIMIT, Retrieval } from '../../scripts/retrieve/index.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';
import {
  ACCEPTANCE_CATEGORIES,
  checkAcceptanceFixture,
  runAcceptanceCase,
  type AcceptanceCase,
  type AcceptanceFixture,
} from '../support/retrieval-acceptance.ts';
import { expectRulebookOnly } from '../support/rulebook-only.ts';

const fixture = JSON.parse(
  readFileSync(join(repoRoot, 'tests/fixtures/retrieval-acceptance.json'), 'utf8'),
) as AcceptanceFixture;

let retrieval: Retrieval;
beforeAll(() => {
  retrieval = Retrieval.fromCorpus();
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
    expect(checkAcceptanceFixture(fixture, retrieval)).toEqual([]);
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
      const problems = checkAcceptanceFixture(broken, retrieval);
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
