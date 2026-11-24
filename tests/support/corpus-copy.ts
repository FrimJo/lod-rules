import {
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from '../../scripts/validate/schemas.ts';

/** Input trees copied byte for byte. Together with `source/` they are everything validation reads. */
const copiedTrees = ['corpus', 'review', 'tests/examples'] as const;
/** The one `source/` file a test may edit; the documents it names are linked, not copied. */
const sourceManifest = 'source/manifest.yaml';

/** A disposable copy of the corpus inputs in the OS temp directory. Paths are repo-relative. */
export interface CorpusCopy {
  root: string;
  /** Rewrites a copied file. Throws when the edit changes nothing, so a break never silently misses. */
  edit(path: string, transform: (text: string) => string): void;
  /** Removes a copied file or the link to a source document; never the linked document itself. */
  remove(path: string): void;
  /** Undoes every edit and removal, so tests can share one copy instead of copying per test. */
  reset(): void;
  dispose(): void;
}

/**
 * Copies the corpus inputs to a fresh temp root so a test can break them without touching the
 * real tree. Source documents are symlinked because the canonical PDF alone is ~40 MB.
 */
export function copyCorpusInputs(from = repoRoot): CorpusCopy {
  const root = mkdtempSync(join(tmpdir(), 'lod-corpus-'));
  for (const tree of copiedTrees) cpSync(join(from, tree), join(root, tree), { recursive: true });
  mkdirSync(join(root, 'source'));
  for (const name of readdirSync(join(from, 'source'))) {
    const path = `source/${name}`;
    if (path === sourceManifest) cpSync(join(from, path), join(root, path));
    else symlinkSync(join(from, path), join(root, path));
  }

  const local = (path: string): string => {
    const absolute = join(root, path);
    if (lstatSync(absolute).isSymbolicLink()) {
      throw new Error(`${path} links into the real tree; remove it instead of editing it`);
    }
    return absolute;
  };

  /** How to put back each changed path, recorded on its first change. */
  const undo = new Map<string, () => void>();
  const remember = (path: string): void => {
    if (undo.has(path)) return;
    const absolute = join(root, path);
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) {
      const target = readlinkSync(absolute);
      undo.set(path, () => {
        rmSync(absolute, { force: true });
        symlinkSync(target, absolute);
      });
    } else if (stat.isFile()) {
      const bytes = readFileSync(absolute);
      undo.set(path, () => writeFileSync(absolute, bytes));
    } else throw new Error(`${path}: only files and links can be changed`);
  };

  return {
    root,
    edit(path, transform) {
      const absolute = local(path);
      const before = readFileSync(absolute, 'utf8');
      const after = transform(before);
      if (after === before) throw new Error(`${path}: edit changed nothing`);
      remember(path);
      writeFileSync(absolute, after);
    },
    remove(path) {
      remember(path);
      // rmSync on a symlink unlinks it and leaves the target alone.
      rmSync(join(root, path));
    },
    reset() {
      for (const restore of undo.values()) restore();
      undo.clear();
    },
    dispose() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}
