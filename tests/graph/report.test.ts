import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildGraph, type AnalysedGraph, type GraphEdge } from '../../scripts/graph/index.ts';
import { GRAPH_REPORT, renderGraphReport } from '../../scripts/graph/report.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';

function edge(source: string, relation: GraphEdge['relation'], target: string): GraphEdge {
  return {
    source,
    relation,
    target,
    category: relation === 'see_also' ? 'reference' : 'dependency',
    field: relation,
    provenance: [],
  };
}

/** Two rules that cite each other, a table use, one dangling id and one unresolved pointer. */
function fixture(): AnalysedGraph {
  return {
    nodes: [
      { id: 'rule.a', kind: 'rule', title: 'A' },
      { id: 'rule.b', kind: 'rule', title: 'B' },
      { id: 'table.t', kind: 'table', title: 'T' },
    ],
    edges: [
      edge('rule.a', 'see_also', 'rule.b'),
      edge('rule.a', 'uses_table', 'table.t'),
      edge('rule.b', 'see_also', 'rule.a'),
      edge('rule.b', 'uses_table', 'table.missing'),
    ],
    anomalies: {
      dangling: [
        { source: 'rule.b', relation: 'uses_table', target: 'table.missing', field: 'uses_tables' },
      ],
      cycles: [{ relation: 'see_also', cycles: [['rule.a', 'rule.b']] }],
      unresolved: [{ owner: 'rule.a', wording: 'the Bestiary entry for trolls' }],
      stepDuplicates: [
        {
          procedure: 'procedure.p',
          step: 's',
          field: 'steps[]',
          rule: 'rule.a',
          effects: ['set:x=true'],
        },
      ],
    },
  };
}

describe('graph report', () => {
  const report = renderGraphReport(fixture());

  it('counts edges by relation and by category', () => {
    expect(report).toMatch(/^\| `see_also` +\| reference +\| 2 +\|$/m);
    expect(report).toMatch(/^\| `uses_table` +\| dependency +\| 2 +\|$/m);
    expect(report).toMatch(/^\| dependency +\| 2 +\|$/m);
    expect(report).toMatch(/^\| reference +\| 2 +\|$/m);
    expect(report).toMatch(/^\| precedence +\| 0 +\|$/m);
    expect(report).toContain('3 nodes, 4 edges.');
  });

  it('lists dangling ids with the edge and field that hold them', () => {
    expect(report).toContain('- `rule.b` `uses_table` → `table.missing` (field `uses_tables`)');
  });

  it('lists cycles per relation, closing each back to its first node', () => {
    expect(report).toMatch(/### `see_also` \(1 cycle\)\n\n- `rule.a` → `rule.b` → `rule.a`\n/);
  });

  it('lists unresolved pointers by owner and wording, with no disposition', () => {
    expect(report).toContain('- `rule.a`: the Bestiary entry for trolls');
    expect(report).toContain('- `procedure.p#s` → `rule.a` (`set:x=true`)');
    expect(report).not.toMatch(/disposition:/i);
  });

  it('says so when an anomaly list is empty', () => {
    const clean = fixture();
    clean.anomalies = { dangling: [], cycles: [], unresolved: [], stepDuplicates: [] };
    const text = renderGraphReport(clean);
    expect(text).toContain('No dangling ids.');
    expect(text).toContain('No cycles.');
    expect(text).toContain('No unresolved pointers.');
  });

  it('renders deterministically, ending in one newline', () => {
    expect(renderGraphReport(fixture())).toBe(report);
    expect(report.endsWith('\n')).toBe(true);
    expect(report.endsWith('\n\n')).toBe(false);
  });
});

describe('committed graph report', () => {
  it('equals a fresh render of the real corpus', () => {
    const committed = readFileSync(join(repoRoot, GRAPH_REPORT), 'utf8');
    expect(
      committed === renderGraphReport(buildGraph()),
      `${GRAPH_REPORT} is stale or hand-edited. Run \`npm run graph -- report\` and commit it.`,
    ).toBe(true);
  }, 60_000);
});
