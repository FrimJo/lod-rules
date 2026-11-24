import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../../scripts/validate/schemas.ts';

/**
 * Shared shape of a phase exit checklist (tests/fixtures/acceptance/phases-0-6.json,
 * phase-9.json): each row carries a status, the repo files that evidence it, a dated finding and
 * any remaining work. A checklist is accepted only when every row is verified with nothing left.
 */
export interface ChecklistEvidence {
  status: 'pending' | 'verified';
  evidence: string[];
  finding: string;
  remaining_work: string[];
}

export const nonEmptyString = { type: 'string', minLength: 1 };
export const stringList = { type: 'array', items: nonEmptyString };
/** A JSON Schema object that requires every listed property and allows no others. */
export const strictObject = (properties: Record<string, unknown>) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});
/** JSON Schema properties of a `ChecklistEvidence` row. */
export const evidenceProperties = {
  status: { enum: ['pending', 'verified'] },
  evidence: { ...stringList, minItems: 1 },
  finding: nonEmptyString,
  remaining_work: stringList,
};

/** Why a checklist with this status and these rows is not accepted; empty when it is. */
export const acceptanceErrors = (
  status: 'open' | 'accepted',
  rows: ChecklistEvidence[],
): string[] => [
  ...(status === 'accepted' ? [] : ['Phase closure status is not accepted']),
  ...rows.flatMap((row) =>
    row.status !== 'verified' || row.remaining_work.length ? ['Unfinished phase obligation'] : [],
  ),
];

/** Evidence paths that escape the repo or do not exist, and rows with work left but verified. */
export const evidenceProblems = (rows: ChecklistEvidence[]): string[] =>
  rows.flatMap((row) => [
    ...row.evidence.flatMap((file) =>
      file.startsWith('/') || file.split('/').includes('..')
        ? [`${file}: evidence path leaves the repository`]
        : existsSync(join(repoRoot, file))
          ? []
          : [`${file}: evidence file does not exist`],
    ),
    ...(row.remaining_work.length && row.status !== 'pending'
      ? [`${row.finding.slice(0, 60)}: remaining work but not pending`]
      : []),
  ]);
