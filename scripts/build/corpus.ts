import { CORPUS_DIR } from './bundles.ts';
import { buildCorpus, CorpusBuildError } from './index.ts';

try {
  const manifest = buildCorpus();
  for (const [file, { records }] of Object.entries(manifest.bundles)) {
    console.log(`  ${file.padEnd(28)} ${records}`);
  }
  console.log(`\nWrote ${Object.keys(manifest.bundles).length} bundles to ${CORPUS_DIR}/.`);
  console.log(`Input fingerprint: ${manifest.input_fingerprint}`);
} catch (error) {
  if (!(error instanceof CorpusBuildError)) throw error;
  console.error(error.message);
  process.exit(1);
}
