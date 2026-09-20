import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020.js';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const schemaFiles = [
  'common.schema.json',
  'source-reference.schema.json',
  'manifest.schema.json',
  'source-map.schema.json',
] as const;

/**
 * Roots addressable by name. The source map keeps three shapes in one schema file,
 * so they are exposed through JSON pointers rather than separate files.
 */
export const schemaRefs = {
  manifest: 'https://lod-rules/schemas/manifest.schema.json',
  sourceReference: 'https://lod-rules/schemas/source-reference.schema.json',
  sections: 'https://lod-rules/schemas/source-map.schema.json#/$defs/sections',
  pages: 'https://lod-rules/schemas/source-map.schema.json#/$defs/pages',
  coverage: 'https://lod-rules/schemas/source-map.schema.json#/$defs/coverage',
} as const;

export type SchemaName = keyof typeof schemaRefs;

export function createAjv(): Ajv2020 {
  // Union types are allowed because source locators are genuinely either an index
  // or a printed label (for example row 3 versus row "2-5").
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });

  for (const file of schemaFiles) {
    const path = join(repoRoot, 'schemas', file);
    ajv.addSchema(JSON.parse(readFileSync(path, 'utf8')));
  }

  return ajv;
}

export function getValidator(ajv: Ajv2020, name: SchemaName): ValidateFunction {
  const validate = ajv.getSchema(schemaRefs[name]);
  if (!validate) {
    throw new Error(`Schema not found: ${schemaRefs[name]}`);
  }
  return validate;
}

export function formatErrors(validate: ValidateFunction): string[] {
  return (validate.errors ?? []).map(
    (error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`,
  );
}
