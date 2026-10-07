import type { AnalyzerName } from '../../../../scripts/ask/models.ts';

/**
 * The `ANALYZERS` from scripts/ask/models.ts that the web client offers, plus `jev_filtered`:
 * the Jev union after Jev drops records it judges irrelevant. Laya and the Laya→Jev cascade are
 * shelved here: onnxruntime and the Laya weights do not fit a Vercel function.
 */
export const RETRIEVAL_MODES = ['jev_filtered', 'jev', 'lexical'] as const;
export type RetrievalMode = (typeof RETRIEVAL_MODES)[number];

export interface RetrievalModeInfo {
  id: RetrievalMode;
  label: string;
  /** Question analyzer passed to `ask()`. */
  analyzer: AnalyzerName;
  /** Whether Jev's relevance filter runs over the retrieved records. */
  filter: boolean;
  /** Models the mode adds to lexical search, as named in a fallback notice. */
  models: string | null;
  description: string;
  needsJev: boolean;
  tags: string[];
}

export const MODES: Record<RetrievalMode, RetrievalModeInfo> = {
  jev_filtered: {
    id: 'jev_filtered',
    label: 'Lexical + Jev, filtered',
    analyzer: 'jev',
    filter: true,
    models: 'Jev',
    description:
      'Adds records chosen by Jev, then lets Jev drop records it judges irrelevant, keyword matches included.',
    needsJev: true,
    tags: ['Cloud', 'Model', 'Filter'],
  },
  jev: {
    id: 'jev',
    label: 'Lexical + Jev',
    analyzer: 'jev',
    filter: false,
    models: 'Jev',
    description: 'Adds records chosen by the TypeSafe Jev model.',
    needsJev: true,
    tags: ['Cloud', 'Model'],
  },
  lexical: {
    id: 'lexical',
    label: 'Lexical only',
    analyzer: 'lexical',
    filter: false,
    models: null,
    description: 'Searches the rulebook index by keywords. Fast and needs no model.',
    needsJev: false,
    tags: ['Local', 'No model'],
  },
};

export interface RetrievalSettings {
  defaultMode: RetrievalMode;
  jevAvailable: boolean;
}

export function isRetrievalMode(value: unknown): value is RetrievalMode {
  return typeof value === 'string' && (RETRIEVAL_MODES as readonly string[]).includes(value);
}

export function isModeAvailable(mode: RetrievalMode, settings: RetrievalSettings): boolean {
  return !MODES[mode].needsJev || settings.jevAvailable;
}

/**
 * `LOD_ANALYZER` when it names an available mode, else unfiltered Jev with a key, else lexical.
 * The filter stays opt-in until a policy calibrated on reviewed labels passes; see
 * docs/ask-quality-evaluation.md#filter-calibration-plan.
 */
export function defaultMode(configured: string | undefined, jevAvailable: boolean): RetrievalMode {
  const settings = { defaultMode: 'lexical' as const, jevAvailable };
  if (isRetrievalMode(configured) && isModeAvailable(configured, settings)) return configured;
  return jevAvailable ? 'jev' : 'lexical';
}
