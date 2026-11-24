import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { ruleRepeats } from '../../scripts/graph/duplicates.ts';
import type { RetrievalCorpus } from '../../scripts/retrieve/corpus.ts';
import { loadRetrievalCorpus } from '../../scripts/retrieve/load.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';

interface Disposition {
  rules: [string, string];
  disposition: 'legitimate_repeat';
  reason: string;
}
const fixture = JSON.parse(
  readFileSync(join(repoRoot, 'tests/fixtures/rule-repeat-dispositions.json'), 'utf8'),
) as { entries: Disposition[] };
const key = ({ rules: [a, b] }: { rules: [string, string] }): string => `${a} <-> ${b}`;

let corpus: RetrievalCorpus;
beforeAll(() => {
  corpus = loadRetrievalCorpus(repoRoot);
}, 60_000);

describe('rules repeating printed text across chapters (issue #4 items 22-23)', () => {
  it('has exactly one disposition per pair and none for a pair that is gone', () => {
    expect(ruleRepeats(corpus).map(key)).toEqual(fixture.entries.map(key));
    for (const entry of fixture.entries) expect(entry.reason.length, key(entry)).toBeGreaterThan(0);
  });

  it('drops a pair once a summary_of edge links it', () => {
    const asylum: [string, string] = [
      'character.sanity.asylum_pointer',
      'character.settlement.asylum',
    ];
    expect(ruleRepeats(corpus).map(key)).not.toContain(key({ rules: asylum }));
    const unlinked = structuredClone(corpus);
    unlinked.pilot.edges = unlinked.pilot.edges.filter(
      (e) => e.id !== 'edge.summary.sanity_asylum.asylum',
    );
    expect(ruleRepeats(unlinked).map(key)).toContain(key({ rules: asylum }));
  });

  it('compares only rules from different chapters', () => {
    for (const { rules } of ruleRepeats(corpus)) {
      const [a, b] = rules.map(
        (id) => corpus.pilot.rules.find((r) => r.id === id)?.section_id.split('.')[1],
      );
      expect(a).not.toBe(b);
    }
  });
});
