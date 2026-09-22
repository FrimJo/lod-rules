import { describe, expect, it } from 'vitest';
import { createLayaProvider, closeLaya } from '../../scripts/decisions/laya.ts';
import { buildQuestions } from '../../scripts/decisions/questions.ts';
import { JUDGMENT_IDS } from '../../scripts/decisions/types.ts';

const enabled = process.env.LAYA_INTEGRATION === '1';

describe.skipIf(!enabled)('Laya integration', () => {
  it('runs the pinned local checkpoint', async () => {
    const provider = createLayaProvider({ checkpoint: 'base' });
    const state = {
      focus: 'When a roll is a failure.',
      source_text:
        'Any result equal to or lower than the stat or Skill Level is considered a success. Anything above that is considered a failure.',
    };
    const report = await provider.decide({
      subjectId: 'core.check.standard',
      state,
      questions: buildQuestions(state, JUDGMENT_IDS),
    });
    expect(report.failure).toBeNull();
    expect(report.modelRevision).toBeTruthy();
    expect(report.judgments.rule_type?.result?.primitive).toBe('choice');
    await closeLaya();
  }, 180_000);
});
