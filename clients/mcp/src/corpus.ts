import { freshDatabasePath } from '../../../scripts/retrieve/build.ts';
import { Retrieval } from '../../../scripts/retrieve/index.ts';
import { fingerprintInputs } from '../../../scripts/retrieve/load.ts';

/** How often a tool call re-hashes the canonical YAML (about 70 ms) to spot corpus edits. */
const CHECK_INTERVAL_MS = 10_000;

/**
 * The retrieval index, kept in step with the canonical YAML. Agents may edit `corpus/` while
 * the server runs; a stale index would answer from the old rules, so a changed fingerprint
 * reopens the built database or re-indexes the YAML in memory.
 */
export class LiveRetrieval {
  private retrieval: Retrieval;
  private fingerprint: string;
  private checkedAt: number;

  constructor(private readonly root?: string) {
    this.fingerprint = fingerprintInputs(root);
    this.retrieval = this.open();
    this.checkedAt = Date.now();
  }

  /** `built`: the `npm run retrieve -- build` database; `memory`: indexed from YAML. */
  source: 'built' | 'memory' = 'memory';

  current(): Retrieval {
    if (Date.now() - this.checkedAt < CHECK_INTERVAL_MS) return this.retrieval;
    this.checkedAt = Date.now();
    const fingerprint = fingerprintInputs(this.root);
    if (fingerprint !== this.fingerprint) {
      this.retrieval.close();
      this.fingerprint = fingerprint;
      this.retrieval = this.open();
    }
    return this.retrieval;
  }

  close(): void {
    this.retrieval.close();
  }

  private open(): Retrieval {
    const database = freshDatabasePath(this.root);
    this.source = database ? 'built' : 'memory';
    return database ? Retrieval.open(database) : Retrieval.fromCorpus(this.root);
  }
}
