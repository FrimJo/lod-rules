/**
 * Pinned provider coordinates. These are the revisions this repository was
 * written against. They are not a claim that either checkpoint has been
 * selected for League of Dungeoneers use.
 */
export const DECISION_SCHEMA_VERSION = 1 as const;

/** Bump when question wording or option meaning changes. Invalidates caches. */
export const JUDGMENT_SET_VERSION = 1 as const;

/**
 * Calibration has not been fit on held-out League of Dungeoneers data.
 * Escalation does not threshold on probability while this version is current.
 */
export const CALIBRATION_VERSION = 'uncalibrated-0' as const;

export const TYPESAFE_SDK_VERSION = '0.6.0' as const;

/** SDK default when `TYPESAFE_DEFAULT_MODEL` is unset. The response names the model actually used. */
export const TYPESAFE_DEFAULT_MODEL = 'jev-latest' as const;

export const LAYA_PACKAGE = '@receptron/laya' as const;
export const LAYA_PACKAGE_VERSION = '0.1.2' as const;

/** ONNX bundle published for the Node runtime. Weights are not committed. */
export const LAYA_ONNX_REPO = 'receptron/laya-onnx' as const;

/**
 * Commit of `receptron/laya-onnx` inspected while writing this adapter.
 * The repo root is the English checkpoint exported from `convaiinnovations/laya`.
 * `typed-decisions` and `multilingual` subfolders were not in that tree.
 */
export const LAYA_ONNX_REVISION = '68f27dfe5a27a54fb2b1fefc432f43f972e90868' as const;

export const LAYA_CHECKPOINTS = {
  base: {
    id: 'base',
    huggingface: 'convaiinnovations/laya',
    subfolder: undefined,
    contextTokens: 512,
    headMaxTokens: 192,
  },
  'typed-decisions': {
    id: 'typed-decisions',
    huggingface: 'convaiinnovations/laya-typed-decisions',
    subfolder: 'typed-decisions',
    contextTokens: 1024,
    headMaxTokens: 256,
  },
} as const;

export type LayaCheckpointId = keyof typeof LAYA_CHECKPOINTS;

/**
 * Laya's own documentation treats choice sets of about 20 options as the point
 * where the fixed option-token budget starts to collapse labels. This is a
 * model-capacity limit, not an accuracy threshold copied from a benchmark.
 */
export const LAYA_CHOICE_SET_WARNING = 20 as const;
