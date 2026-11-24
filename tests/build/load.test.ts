import { readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { CORPUS_DIR, type Bundle } from '../../scripts/build/bundles.ts';
import { buildCorpus } from '../../scripts/build/index.ts';
import { loadCorpusBundles } from '../../scripts/build/load.ts';
import { copyCorpusInputs, type CorpusCopy } from '../support/corpus-copy.ts';

/** What a concurrent build or a crash can leave behind: bundles that disagree with the manifest. */
describe('reading the published corpus', () => {
  let copy: CorpusCopy;
  let dir: string;
  let published: Map<string, Buffer>;
  const files = ['manifest.json', 'rules.json', 'terms.json'];

  beforeAll(() => {
    copy = copyCorpusInputs();
    dir = join(copy.root, CORPUS_DIR);
    buildCorpus({ root: copy.root });
    published = new Map(files.map((file) => [file, readFileSync(join(dir, file))]));
  }, 60_000);
  afterAll(() => copy.dispose());
  afterEach(() => {
    for (const [file, bytes] of published) writeFileSync(join(dir, file), bytes);
  });

  const rules = (): unknown[] =>
    loadCorpusBundles(copy.root, { readOnly: true }).bundle('rules.json').records;
  const authored = (): unknown[] =>
    (JSON.parse(published.get('rules.json')!.toString('utf8')) as Bundle).records;

  it('serves the published bundles when they match the manifest', () => {
    expect(rules()).toEqual(authored());
  });

  it('never serves a bundle from another build', () => {
    const other: Bundle = { records: [], files: {} };
    writeFileSync(join(dir, 'rules.json'), JSON.stringify(other));
    expect(rules()).toEqual(authored());
  }, 60_000);

  it('compiles in memory when a bundle the manifest lists is missing, writing nothing', () => {
    rmSync(join(dir, 'terms.json'));
    expect(loadCorpusBundles(copy.root, { readOnly: true }).bundle('terms.json').records).toEqual(
      (JSON.parse(published.get('terms.json')!.toString('utf8')) as Bundle).records,
    );
    expect(() => statSync(join(dir, 'terms.json'))).toThrow();
  }, 60_000);

  it('republishes a corpus whose bundles disagree with the manifest', () => {
    writeFileSync(join(dir, 'rules.json'), '{}\n');
    expect(loadCorpusBundles(copy.root).bundle('rules.json').records).toEqual(authored());
    expect(readFileSync(join(dir, 'rules.json')).equals(published.get('rules.json')!)).toBe(true);
  }, 60_000);

  it('leaves an identical published corpus in place instead of swapping it', () => {
    const before = statSync(dir).ino;
    buildCorpus({ root: copy.root });
    expect(statSync(dir).ino).toBe(before);
  }, 60_000);
});
