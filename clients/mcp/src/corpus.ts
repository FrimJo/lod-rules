import { freshDatabasePath } from '../../../scripts/retrieve/build.ts';
import { Retrieval } from '../../../scripts/retrieve/index.ts';
import { fingerprintInputs } from '../../../scripts/validate/canonical-files.ts';

/** How often a tool call re-hashes the canonical YAML (about 70 ms) to spot corpus edits. */
const CHECK_INTERVAL_MS = 10_000;

/**
 * The retrieval index, kept in step with the canonical YAML. Agents may edit `corpus/` while
 * the server runs; a stale index would answer from the old rules, so a changed corpus
 * fingerprint reopens the built database or compiles the corpus in memory. The server never
 * writes, so it never publishes that compilation to `generated/`.
 */
export class LiveRetrieval {
  private retrieval: Retrieval;
  private fingerprint: string;
  private checkedAt: number;
  private readonly checkIntervalMs: number;

  /** `built`: the `npm run retrieve -- build` database; `memory`: compiled in memory. */
  source: 'built' | 'memory' = 'memory';

  constructor(
    private readonly root?: string,
    { checkIntervalMs = CHECK_INTERVAL_MS }: { checkIntervalMs?: number } = {},
  ) {
    this.checkIntervalMs = checkIntervalMs;
    this.fingerprint = fingerprintInputs(root);
    this.retrieval = this.open();
    this.checkedAt = Date.now();
  }

  current(): Retrieval {
    if (Date.now() - this.checkedAt < this.checkIntervalMs) return this.retrieval;
    this.checkedAt = Date.now();
    const fingerprint = fingerprintInputs(this.root);
    if (fingerprint === this.fingerprint) return this.retrieval;
    // Recorded even on failure: an invalid corpus is not recompiled until it changes again.
    this.fingerprint = fingerprint;
    try {
      const next = this.open();
      this.retrieval.close();
      this.retrieval = next;
    } catch (error) {
      // A corpus mid-edit often fails validation; keep answering from the last valid one.
      console.error(`lod-rules MCP: kept the previous corpus: ${(error as Error).message}`);
    }
    return this.retrieval;
  }

  close(): void {
    this.retrieval.close();
  }

  private open(): Retrieval {
    const database = freshDatabasePath(this.root);
    const retrieval = database
      ? Retrieval.open(database)
      : Retrieval.fromCorpus(this.root, { readOnly: true });
    this.source = database ? 'built' : 'memory';
    return retrieval;
  }
}
