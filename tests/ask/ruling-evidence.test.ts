import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ask } from '../../scripts/ask/index.ts';
import { Retrieval } from '../../scripts/retrieve/index.ts';

let retrieval: Retrieval;
beforeAll(() => {
  retrieval = Retrieval.fromCorpus();
}, 60_000);
afterAll(() => retrieval.close());

describe('official short-rest resolution', () => {
  it('keeps the printed table while supplying a complete, separately sourced resolution', async () => {
    const result = await ask(
      retrieval,
      'How much party morale do we regain by taking a short rest?',
      { model: null },
    );
    const table = result.evidence.find(
      (item) => item.id === 'table.psychology.morale_adjustments',
    )!;
    expect(table.text).toContain(
      'Taking a short rest | Resting is a good way to calm the nerves. | +1',
    );
    const issue = table.issues.find((entry) => entry.id === 'issue.phase4.short_rest_morale')!;
    expect(issue.status).toBe('resolved');
    expect(issue.resolution?.summary).toContain('up to the start value');
    expect(issue.resolution?.citations).toContainEqual(
      expect.objectContaining({
        document: 'vonbraus.changelog_2_2x',
        pdf_page: 4,
        locator: { row: 39 },
      }),
    );
    expect(result.prompt).toContain('RESOLUTION [issue.phase4.short_rest_morale]');
    expect(result.prompt).toContain('"+2 is correct"');
    expect(result.prompt).toContain(
      'takes precedence over the historical conflicting text for that issue only',
    );
  });
});
