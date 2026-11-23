import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { stepDuplicates } from '../../scripts/graph/duplicates.ts';
import { loadRetrievalCorpus, type RetrievalCorpus } from '../../scripts/retrieve/load.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';

interface Disposition {
  procedure: string;
  step: string;
  rule: string;
  disposition: 'legitimate_repeat';
  reason: string;
}
const fixture = JSON.parse(
  readFileSync(join(repoRoot, 'tests/fixtures/step-duplicate-dispositions.json'), 'utf8'),
) as { entries: Disposition[] };
const key = (f: { procedure: string; step: string; rule: string }): string =>
  `${f.procedure}#${f.step} -> ${f.rule}`;

let corpus: RetrievalCorpus;
beforeAll(() => {
  corpus = loadRetrievalCorpus(repoRoot);
}, 60_000);

describe('procedure steps restating a rule (phase_6.criterion_2)', () => {
  it('has exactly one disposition per finding and none for a finding that is gone', () => {
    const found = stepDuplicates(corpus).map(key);
    expect(found).toEqual(fixture.entries.map(key));
    for (const entry of fixture.entries) expect(entry.reason.length, key(entry)).toBeGreaterThan(0);
  });

  it('flags a step that repeats a rule effect and quotes it, unless the step cites the rule', () => {
    const hit = stepDuplicates(corpus).find(
      (f) => f.procedure === 'procedure.hero_defence' && f.step === 'avoid',
    );
    expect(hit).toMatchObject({
      rule: 'combat.defence.weapon_parry',
      effects: ['set:negates_damage=true'],
    });
    const cited = structuredClone(corpus);
    const procedure = cited.pilot.procedures.find((p) => p.id === 'procedure.hero_defence');
    const step = procedure?.steps.find((s) => s.id === 'avoid');
    if (!step) throw new Error('procedure.hero_defence#avoid not found');
    step.rule_refs = ['combat.defence.weapon_parry'];
    expect(stepDuplicates(cited).map(key)).not.toContain(
      'procedure.hero_defence#avoid -> combat.defence.weapon_parry',
    );
  });

  it('does not count a quest procedure restating its own scenario rule', () => {
    // procedure.closing_portal_reading_attempt#restart quotes and repeats this quest rule.
    expect(stepDuplicates(corpus).map((f) => f.rule)).not.toContain(
      'core.quest.closing_portal.ritual_interruption',
    );
  });
});
