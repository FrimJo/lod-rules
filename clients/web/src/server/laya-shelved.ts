/**
 * Stands in for scripts/decisions/laya.ts in the web build (vite.config.ts). Laya is shelved
 * in the web client: onnxruntime and the model weights do not fit a Vercel function, and no
 * retrieval mode offered here selects it.
 */
export function loadLayaRuntime(): never {
  throw new Error('Laya is not available in the web client');
}
