/**
 * Summarizes the human review of the answer-quality grading: how often the judge agrees,
 * and each mode's correctness by the judge and by the reviewer on the reviewed answers.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  GRADED_DIR,
  QUALITY_MODES,
  loadGradedCases,
  loadReview,
  summarizeReview,
} from './grading-review.ts';

const summary = summarizeReview(loadGradedCases(), loadReview());
writeFileSync(join(GRADED_DIR, 'review-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);
const { statuses, answers, relevance, facts } = summary;
console.log(
  `Cases: ${summary.cases} (${statuses.reviewed} reviewed, ${statuses.partial} partial, ${statuses.stale} stale, ${statuses.unreviewed} unreviewed)`,
);
console.log(
  `Answers: judge agrees on ${answers.agreed}/${answers.reviewed} (${pct(answers.agreement)}); too lenient ${answers.judgeTooLenient.length}, too strict ${answers.judgeTooStrict.length}`,
);
console.log(
  `Record labels: ${relevance.labelled} reviewed; exact agreement ${pct(relevance.exactAgreement)}, relevant vs irrelevant ${pct(relevance.relevantVsIrrelevantAgreement)}`,
);
console.log(`Judge facts marked wrong: ${facts.wrong}/${facts.reviewed}`);

console.log('\n| mode | reviewed answers | judge correct | reviewer correct |');
console.log('|---|---|---|---|');
for (const mode of QUALITY_MODES) {
  const m = summary.perMode[mode];
  console.log(`| ${mode} | ${m.reviewed} | ${m.judgeCorrect} | ${m.humanCorrect} |`);
}

console.log('\nJudge label (rows) vs reviewer label (columns):');
for (const [judge, row] of Object.entries(relevance.confusion))
  console.log(`  ${judge.padEnd(10)} direct ${row.direct}  supporting ${row.supporting}  irrelevant ${row.irrelevant}`);

for (const [title, rows] of [
  ['Judge said correct, reviewer said incorrect', answers.judgeTooLenient],
  ['Judge said incorrect, reviewer said correct', answers.judgeTooStrict],
] as const) {
  if (!rows.length) continue;
  console.log(`\n${title}:`);
  for (const row of rows) console.log(`  ${row.case} (${row.split}): ${row.modes.join(', ')}`);
}
