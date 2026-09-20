import { validateCorpus } from './corpus.ts';

const { errors, filesChecked } = validateCorpus();

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} error(s):\n`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`Validation passed. ${filesChecked} canonical file(s) checked.`);
