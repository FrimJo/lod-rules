import { describe, expect, it } from 'vitest';
import { createJevProvider } from '../../scripts/decisions/jev.ts';
import { buildQuestions } from '../../scripts/decisions/questions.ts';
import { JUDGMENT_IDS } from '../../scripts/decisions/types.ts';

const enabled =
  process.env.JEV_INTEGRATION === '1' && Boolean(process.env.TYPESAFE_API_KEY?.trim());

describe.skipIf(!enabled)('Jev integration', () => {
  it('calls the TypeSafe API with the runtime key', async () => {
    const provider = createJevProvider();
    const state = {
      focus: 'Rolls of 91-00.',
      source_text:
        'A roll of 91-00 is always a failure, no matter what your skill level or modifiers are.',
    };
    const report = await provider.decide({
      subjectId: 'core.check.automatic_failure',
      state,
      questions: buildQuestions(
        state,
        JUDGMENT_IDS.filter((id) => id !== 'referenced_term'),
      ),
    });
    expect(report.failure).toBeNull();
    expect(report.model.length).toBeGreaterThan(0);
    expect(report.requests).toBe(1);
  }, 60_000);
});
