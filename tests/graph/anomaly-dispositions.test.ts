import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildGraph, type AnalysedGraph } from '../../scripts/graph/index.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';

interface CycleDisposition {
  relation: string;
  nodes: string[];
  disposition: 'reference_cycle' | 'mutual_dependency' | 'bounded_reentry';
  reason: string;
  issues?: string[];
}
interface PointerDisposition {
  owner: string;
  wording: string;
  disposition:
    'modelling_note' | 'external_book' | 'external_component' | 'book_undefined' | 'now_resolvable';
  reason: string;
  target?: string;
  issues?: string[];
}
const fixture = JSON.parse(
  readFileSync(join(repoRoot, 'tests/fixtures/graph-anomaly-dispositions.json'), 'utf8'),
) as { cycles: CycleDisposition[]; unresolved: PointerDisposition[] };

const cycleKey = (relation: string, nodes: string[]): string => `${relation}: ${nodes.join(' → ')}`;
const pointerKey = ({ owner, wording }: { owner: string; wording: string }): string =>
  `${owner}: ${wording}`;

let graph: AnalysedGraph;
let nodeIds: Set<string>;
beforeAll(() => {
  graph = buildGraph();
  nodeIds = new Set(graph.nodes.map((node) => node.id));
}, 60_000);

describe('graph anomaly dispositions (issue #11)', () => {
  it('has exactly one disposition per cycle and none for a cycle that is gone', () => {
    const found = graph.anomalies.cycles.flatMap(({ relation, cycles }) =>
      cycles.map((nodes) => cycleKey(relation, nodes)),
    );
    expect(found).toEqual(fixture.cycles.map((entry) => cycleKey(entry.relation, entry.nodes)));
  });

  it('has exactly one disposition per unresolved pointer and none for a pointer that is gone', () => {
    expect(graph.anomalies.unresolved.map(pointerKey)).toEqual(fixture.unresolved.map(pointerKey));
  });

  it('gives every entry a reason, and every named issue exists', () => {
    for (const entry of [...fixture.cycles, ...fixture.unresolved]) {
      const key = 'owner' in entry ? pointerKey(entry) : cycleKey(entry.relation, entry.nodes);
      expect(entry.reason.trim().length, key).toBeGreaterThan(0);
      for (const issue of entry.issues ?? [])
        expect(nodeIds.has(issue), `${key} ${issue}`).toBe(true);
    }
  });

  it('names a resolving target for every now_resolvable pointer, and only for those', () => {
    for (const entry of fixture.unresolved) {
      if (entry.disposition === 'now_resolvable') {
        expect(entry.target && nodeIds.has(entry.target), pointerKey(entry)).toBe(true);
      } else expect(entry.target, pointerKey(entry)).toBeUndefined();
    }
  });
});
