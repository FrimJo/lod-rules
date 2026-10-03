import { selectedSystems, type QuestionAnalysis } from './analysis.ts';
import type { EvidenceItem } from './evidence.ts';
import { sourceLabel } from '../retrieve/citations.ts';

const INSTRUCTIONS = `You help a game master running League of Dungeoneers (second printing rulebook).
Answer only from the EVIDENCE records below. They preserve the rulebook and explicitly recorded source-backed resolutions.

- Cite every rule you use with its record id in square brackets, e.g. [procedure.rest].
- Use an explicit RESOLUTION for the issue it settles; it takes precedence over the historical conflicting text for that issue only. Otherwise quote numbers and table values exactly as printed.
- Distinguish original printed wording from a correction, and cite the resolution issue id when using it. Do not extend a resolution to other issues.
- If a record has scope "quest", say which quest it belongs to and do not apply it elsewhere.
- Mention unresolved issues when they affect the answer. A resolved historical conflict is not an open ambiguity.
- If evidence depends on an external book (e.g. Bestiary), say that material is not available.
- If the evidence does not answer the question, say so plainly and name what is missing. Do not fill gaps from general knowledge or other games.
- Keep "battle" and "combat" distinct, and use the rulebook's terms.
- Lead with the direct answer, then the explanation. Use short paragraphs or steps.`;

function pages(item: EvidenceItem): string {
  return [...new Set(item.citations.map(sourceLabel))].join('; ');
}

function block(item: EvidenceItem): string {
  const scope =
    item.scope === 'quest'
      ? `quest: ${item.quest_title ?? item.quest_id ?? 'unknown'}`
      : item.scope;
  const lines = [`[${item.id}] ${item.title} (${item.kind}; ${scope}; ${pages(item)})`, item.text];
  for (const issue of item.issues) {
    lines.push(`  ISSUE ${issue.id} (${issue.type}, ${issue.status}): ${issue.summary}`);
    if (issue.resolution)
      lines.push(
        `  RESOLUTION [${issue.id}]: ${issue.resolution.summary}\n  RESOLUTION SOURCES: ${issue.resolution.citations.map(sourceLabel).join('; ')}`,
      );
  }
  for (const dep of item.external_dependencies)
    lines.push(`  EXTERNAL: ${dep.label} — in ${dep.document}, not available`);
  for (const ref of item.unresolved_references) lines.push(`  UNRESOLVED REFERENCE: ${ref}`);
  return lines.join('\n');
}

export function buildPrompt(analysis: QuestionAnalysis, evidence: EvidenceItem[]): string {
  const systems = selectedSystems(analysis).join(', ') || 'none detected';
  return [
    INSTRUCTIONS,
    '',
    `QUESTION: ${analysis.question}`,
    `ANALYSIS: intent=${analysis.intent.value}; systems=${systems}; complexity=${analysis.complexity.value}`,
    '',
    'EVIDENCE:',
    ...evidence.map(block),
  ].join('\n');
}

export interface CitationCheck {
  cited: string[];
  /** Ids cited by the answer that were not in the evidence: likely invented. */
  unknown: string[];
  grounded: boolean;
}

export function checkCitations(answer: string, evidence: EvidenceItem[]): CitationCheck {
  const allowed = new Set(
    evidence.flatMap((item) => [item.id, ...item.issues.map((issue) => issue.id)]),
  );
  const cited = [
    ...new Set([...answer.matchAll(/\[([a-z_]+(?:\.[a-z0-9_]+)+)\]/g)].map((m) => m[1]!)),
  ];
  const unknown = cited.filter((id) => !allowed.has(id));
  return { cited, unknown, grounded: cited.length > 0 && unknown.length === 0 };
}
