import { describe, expect, it } from 'vitest';
import {
  buildGraph,
  issueMembers,
  recordIssues,
  type Graph,
  type GraphEdge,
} from '../../scripts/graph/index.ts';

const edge = (source: string, relation: GraphEdge['relation'], target: string): GraphEdge => ({
  source,
  relation,
  target,
  category: relation === 'concerns' || relation === 'issue' ? 'evidence' : 'reference',
  field: 'test',
  provenance: [],
});

describe('issueMembers', () => {
  it('collects the records an issue concerns and the records that list it', () => {
    const graph: Graph = {
      nodes: [],
      edges: [
        edge('issue.a', 'concerns', 'rule.b'),
        edge('issue.a', 'concerns', 'rule.a'),
        edge('rule.c', 'issue', 'issue.a'),
        edge('rule.a', 'issue', 'issue.a'),
        edge('rule.d', 'see_also', 'issue.a'),
        edge('issue.z', 'concerns', 'term.x'),
      ],
    };
    expect(Object.fromEntries(issueMembers(graph))).toEqual({
      'issue.a': ['rule.a', 'rule.b', 'rule.c'],
      'issue.z': ['term.x'],
    });
  });

  it('reads the Skill Test conflict from the corpus graph', () => {
    expect(issueMembers(buildGraph()).get('issue.0005')).toEqual([
      'core.check.automatic_failure',
      'core.check.standard',
      'core.check.success',
      'term.failure',
      'term.skill_test',
      'term.success',
    ]);
  }, 60_000);
});

describe('recordIssues', () => {
  it('lists, per record, the issues that name it through either issue edge', () => {
    const graph: Graph = {
      nodes: [],
      edges: [
        edge('issue.b', 'concerns', 'rule.a'),
        edge('rule.a', 'issue', 'issue.a'),
        edge('rule.a', 'issue', 'issue.b'),
        edge('term.x', 'issue', 'issue.c'),
        edge('rule.d', 'see_also', 'issue.a'),
      ],
    };
    expect(Object.fromEntries(recordIssues(graph))).toEqual({
      'rule.a': ['issue.a', 'issue.b'],
      'term.x': ['issue.c'],
    });
  });
});
