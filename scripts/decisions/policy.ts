import { LAYA_CHOICE_SET_WARNING } from './pins.ts';
import type { JudgmentId, NeutralQuestion, NormalizedJudgment, ProviderId } from './types.ts';

/**
 * Floors stay unset until they are fit on the validation split and checked on
 * the held-out split. Cookbook thresholds are not copied in here.
 */
export interface EscalationPolicy {
  calibrationVersion: string;
  calibrated: boolean;
  choiceConfidenceFloor: Partial<Record<ProviderId, number>>;
  /** Smallest accepted distance of a noul probability from 0.5. */
  noulMarginFloor: Partial<Record<ProviderId, number>>;
  /** Laya choice questions at or above this size escalate. Jev is not subject to it. */
  layaLargeChoiceSet: number;
}

export const UNCALIBRATED_POLICY: EscalationPolicy = {
  calibrationVersion: 'uncalibrated-0',
  calibrated: false,
  choiceConfidenceFloor: {},
  noulMarginFloor: {},
  layaLargeChoiceSet: LAYA_CHOICE_SET_WARNING,
};

export interface Escalation {
  judgment: JudgmentId;
  reason: string;
}

export function escalationsFor(
  provider: ProviderId,
  judgments: Partial<Record<JudgmentId, NormalizedJudgment>>,
  questions: readonly NeutralQuestion[],
  policy: EscalationPolicy,
): Escalation[] {
  const found: Escalation[] = [];
  for (const question of questions) {
    const judgment = judgments[question.id];
    if (!judgment) {
      found.push({ judgment: question.id, reason: 'missing_judgment' });
      continue;
    }
    if (judgment.primitive === 'choice' && judgment.value !== null) {
      if (!(judgment.value in question.criteria)) {
        found.push({ judgment: question.id, reason: 'unknown_option' });
        continue;
      }
    }
    if (
      provider === 'laya' &&
      question.primitive === 'choice' &&
      question.optionCount >= policy.layaLargeChoiceSet
    ) {
      found.push({
        judgment: question.id,
        reason: `laya_choice_set_at_least_${policy.layaLargeChoiceSet}`,
      });
      continue;
    }
    const choiceFloor = policy.choiceConfidenceFloor[provider];
    if (
      judgment.primitive === 'choice' &&
      choiceFloor !== undefined &&
      (judgment.confidence === null || judgment.confidence < choiceFloor)
    ) {
      found.push({ judgment: question.id, reason: 'choice_confidence_below_floor' });
      continue;
    }
    const noulFloor = policy.noulMarginFloor[provider];
    if (judgment.primitive === 'noul' && noulFloor !== undefined) {
      if (Math.abs(judgment.probabilityYes - 0.5) < noulFloor) {
        found.push({ judgment: question.id, reason: 'noul_margin_below_floor' });
      }
    }
  }
  return found;
}
