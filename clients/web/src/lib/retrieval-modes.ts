/** Mirrors `ANALYZERS` in scripts/ask/models.ts; ask-service.ts checks the two stay equal. */
export const RETRIEVAL_MODES = ['lexical', 'laya', 'jev', 'cascade'] as const;
export type RetrievalMode = (typeof RETRIEVAL_MODES)[number];

export interface RetrievalModeInfo {
  id: RetrievalMode;
  label: string;
  /** Models the mode adds to lexical search, as named in a fallback notice. */
  models: string | null;
  description: string;
  needsJev: boolean;
  tags: string[];
}

export const MODES: Record<RetrievalMode, RetrievalModeInfo> = {
  lexical: {
    id: 'lexical',
    label: 'Lexical only',
    models: null,
    description: 'Searches the rulebook index by keywords. Fast and needs no model.',
    needsJev: false,
    tags: ['Local', 'No model'],
  },
  laya: {
    id: 'laya',
    label: 'Lexical + Laya',
    models: 'Laya',
    description:
      'Adds records chosen by the local Laya model. The first question can be slow while it loads.',
    needsJev: false,
    tags: ['Local', 'Model'],
  },
  jev: {
    id: 'jev',
    label: 'Lexical + Jev',
    models: 'Jev',
    description: 'Adds records chosen by the TypeSafe Jev model.',
    needsJev: true,
    tags: ['Cloud', 'Model'],
  },
  cascade: {
    id: 'cascade',
    label: 'Lexical + Laya + Jev',
    models: 'Laya + Jev',
    description: 'Laya answers first, and Jev re-answers only what Laya was unsure about.',
    needsJev: true,
    tags: ['Local', 'Cloud', 'Model'],
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
