import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { readPilot } from '../validate/pilot-files.ts';
import { createAjv, formatErrors, repoRoot } from '../validate/schemas.ts';
import type { Rule } from '../validate/pilot-types.ts';
import { sha256 } from './hash.ts';
import { buildQuestions } from './questions.ts';
import { JUDGMENT_IDS, type DecisionRequest, type JudgmentId } from './types.ts';

export const GOLD_PATH = join(repoRoot, 'tests/fixtures/semantic-decisions-gold/cases.yaml');

export type GoldSplit = 'development' | 'validation' | 'held_out';

export interface GoldExpected {
  rule_type: string;
  conditional: boolean;
  has_exception: boolean;
  cites_other_material: boolean;
  completeness: string;
  referenced_term?: string;
}

export interface GoldCase {
  id: string;
  split: GoldSplit;
  complexity: string;
  focus: string;
  ruleId: string | null;
  sourceText: string;
  termCandidates: string[];
  notes: string | null;
  expected: GoldExpected;
  request: DecisionRequest;
}

interface RawCase {
  id: string;
  split: GoldSplit;
  complexity: string;
  focus: string;
  rule_id?: string;
  source_text?: string;
  source_text_sha256: string;
  term_candidates?: string[];
  notes?: string;
  expected: GoldExpected;
}

export function loadGold(checkHashes = true): GoldCase[] {
  const ajv = createAjv();
  const schema = JSON.parse(
    readFileSync(join(repoRoot, 'schemas/semantic-decision-gold.schema.json'), 'utf8'),
  ) as object;
  const validate = ajv.compile(schema);
  const raw: unknown = parse(readFileSync(GOLD_PATH, 'utf8'));
  if (!validate(raw)) {
    throw new Error(`semantic-decision gold: ${formatErrors(validate).join('; ')}`);
  }
  const document = raw as { cases: RawCase[] };
  const rules = new Map(readPilot().rules.map((rule) => [rule.id, rule]));
  const names = termNames();
  const seen = new Set<string>();
  return document.cases.map((entry) => {
    if (seen.has(entry.id)) throw new Error(`${entry.id}: duplicate gold id`);
    seen.add(entry.id);
    if (entry.rule_id && entry.source_text) {
      throw new Error(`${entry.id}: a corpus case must not copy source_text; the hash binds it`);
    }
    if (!entry.rule_id && !entry.source_text)
      throw new Error(`${entry.id}: needs a rule_id or source_text`);
    if (
      entry.term_candidates &&
      entry.term_candidates.length > 0 &&
      !entry.expected.referenced_term
    ) {
      throw new Error(`${entry.id}: term candidates require expected.referenced_term`);
    }
    const rule = entry.rule_id ? rules.get(entry.rule_id) : undefined;
    if (entry.rule_id && !rule) throw new Error(`${entry.id}: unknown rule ${entry.rule_id}`);
    const sourceText = rule?.source_text ?? entry.source_text ?? '';
    if (!sourceText) throw new Error(`${entry.id}: missing source text`);
    if (checkHashes && sha256(sourceText) !== entry.source_text_sha256) {
      throw new Error(`${entry.id}: source_text_sha256 does not match the corpus text`);
    }
    const termCandidates = (entry.term_candidates ?? []).map((id) => {
      const name = names.get(id);
      if (!name) throw new Error(`${entry.id}: unknown term ${id}`);
      return { id, name };
    });
    const state = {
      focus: entry.focus,
      source_text: sourceText,
      ...(termCandidates.length > 0 ? { term_candidates: termCandidates } : {}),
    };
    return {
      id: entry.id,
      split: entry.split,
      complexity: entry.complexity,
      focus: entry.focus,
      ruleId: entry.rule_id ?? null,
      sourceText,
      termCandidates: entry.term_candidates ?? [],
      notes: entry.notes ?? null,
      expected: entry.expected,
      request: {
        subjectId: entry.rule_id ?? entry.id,
        state,
        questions: buildQuestions(state, JUDGMENT_IDS),
      },
    };
  });
}

export function rulesById(): Map<string, Rule> {
  return new Map(readPilot().rules.map((rule) => [rule.id, rule]));
}

/** Rewrites stored hashes from the current corpus text. Not part of the public CLI. */
export function stampGoldHashes(): void {
  const cases = loadGold(false);
  let text = readFileSync(GOLD_PATH, 'utf8');
  for (const entry of cases) {
    const pattern = new RegExp(
      `(id: ${entry.id.replaceAll('.', '\\.')}(?:\\n.*?)*?source_text_sha256: )"?[a-f0-9]{64}"?`,
    );
    const next = text.replace(pattern, `$1"${sha256(entry.sourceText)}"`);
    if (next === text) throw new Error(`${entry.id}: could not stamp source_text_sha256`);
    text = next;
  }
  writeFileSync(GOLD_PATH, text);
}

export function expectedLabel(
  expected: GoldExpected,
  judgment: JudgmentId,
): string | boolean | null {
  switch (judgment) {
    case 'rule_type':
      return expected.rule_type;
    case 'conditional':
      return expected.conditional;
    case 'has_exception':
      return expected.has_exception;
    case 'cites_other_material':
      return expected.cites_other_material;
    case 'completeness':
      return expected.completeness;
    case 'referenced_term':
      return expected.referenced_term ?? null;
    default: {
      const exhausted: never = judgment;
      return exhausted;
    }
  }
}

function termNames(): Map<string, string> {
  const terms = parse(readFileSync(join(repoRoot, 'corpus/glossary/terms.yaml'), 'utf8')) as Array<{
    id: string;
    name: string;
  }>;
  return new Map(terms.map((term) => [term.id, term.name]));
}
