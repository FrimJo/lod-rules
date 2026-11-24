import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, statSync } from 'node:fs';

/** Hex SHA-256 of `bytes` (strings as UTF-8). */
export function sha256(bytes: string | Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

const fileHashes = new Map<string, string>();

/**
 * Hex SHA-256 of a file's bytes. The source PDFs are ~40 MB and every validation and build
 * hashes them, so a hash is reused within the process while the file's real path, size and
 * modification time are unchanged.
 */
export function fileSha256(path: string): string {
  const real = realpathSync(path);
  const { size, mtimeMs } = statSync(real);
  const key = `${real}\0${size}\0${mtimeMs}`;
  let hash = fileHashes.get(key);
  if (hash === undefined) {
    hash = sha256(readFileSync(real));
    fileHashes.set(key, hash);
  }
  return hash;
}
