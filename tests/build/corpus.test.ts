import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { parse } from 'yaml';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  buildCorpus,
  CorpusBuildError,
  readGraphBundle,
  type CorpusManifest,
} from '../../scripts/build/index.ts';
import {
  buildGraph,
  traverse,
  type Graph,
  type TraverseOptions,
} from '../../scripts/graph/index.ts';
import { loadRetrievalCorpus } from '../../scripts/retrieve/load.ts';
import { repoRoot } from '../../scripts/validate/schemas.ts';
import { copyCorpusInputs, type CorpusCopy } from '../support/corpus-copy.ts';

interface Bundle {
  records: unknown[];
  files: Record<string, string>;
}

function readBundle(outDir: string, name: string): Bundle {
  return JSON.parse(readFileSync(join(outDir, name), 'utf8')) as Bundle;
}

function readYaml(root: string, path: string): unknown {
  return parse(readFileSync(join(root, path), 'utf8'));
}

/** YAML files under `dir`, by repo-relative path in the order the build documents. */
function yamlFiles(root: string, dir: string): string[] {
  return (readdirSync(join(root, dir), { recursive: true }) as string[])
    .filter((name) => /\.ya?ml$/.test(name))
    .map((name) => `${dir}/${name}`)
    .sort((a, b) => a.localeCompare(b, 'en'));
}

interface Expected {
  paths: (root: string) => string[];
  records: (data: unknown) => unknown[];
  key: (record: unknown) => string;
}

const file = (path: string) => (): string[] => [path];
const tree = (dir: string) => (root: string) => yamlFiles(root, dir);
const asList = (data: unknown): unknown[] => data as unknown[];
const id = (record: unknown): string => (record as { id: string }).id;

/** The oracle: every bundle and the canonical YAML it must reproduce, read straight from disk. */
const expectedBundles: Record<string, Expected> = {
  'source-documents.json': {
    paths: file('source/manifest.yaml'),
    records: (data) => (data as { documents: unknown[] }).documents,
    key: id,
  },
  'external-sources.json': {
    paths: file('source/manifest.yaml'),
    records: (data) => (data as { external_sources: unknown[] }).external_sources,
    key: id,
  },
  'terms.json': { paths: file('corpus/glossary/terms.yaml'), records: asList, key: id },
  'aliases.json': {
    paths: file('corpus/glossary/aliases.yaml'),
    records: asList,
    key: (record) => (record as { form: string }).form,
  },
  'sections.json': { paths: file('corpus/source-map/sections.yaml'), records: asList, key: id },
  'pages.json': {
    paths: file('corpus/source-map/pages.yaml'),
    records: asList,
    key: (record) => String((record as { pdf_page: number }).pdf_page),
  },
  'coverage.json': {
    paths: file('corpus/source-map/coverage.yaml'),
    records: (data) => (data as { sections: unknown[] }).sections,
    key: id,
  },
  'rules.json': { paths: tree('corpus/rules'), records: asList, key: id },
  'entities.json': { paths: tree('corpus/entities'), records: asList, key: id },
  'tables.json': { paths: tree('corpus/tables'), records: asList, key: id },
  'procedures.json': { paths: tree('corpus/procedures'), records: asList, key: id },
  'state-machines.json': { paths: tree('corpus/state-machines'), records: asList, key: id },
  'edges.json': { paths: tree('corpus/graph'), records: asList, key: id },
  'issues.json': { paths: file('review/ambiguities.yaml'), records: asList, key: id },
  'independent-reviews.json': { paths: tree('review/independent'), records: asList, key: id },
  'test-cases.json': { paths: tree('tests/examples'), records: asList, key: id },
};

/** Bundles derived from the canonical records rather than copied from YAML. */
const derivedBundles = ['graph.json'];

/**
 * Traversal samples: a canonical binding edge (`input_from`), a summary and the rule that
 * expands it, and a rule reached by procedure steps, overrides and issues.
 */
const traversals: Array<{ id: string; options: TraverseOptions }> = [
  { id: 'core.quest.start_settlement', options: { direction: 'both' } },
  { id: 'procedure.quest_acceptance', options: { depth: 2 } },
  { id: 'combat.action.parry_stance', options: { direction: 'both', depth: 2 } },
  { id: 'combat.defence.shield_parry', options: { direction: 'reverse' } },
  { id: 'core.check.standard', options: { direction: 'reverse', categories: ['dependency'] } },
];

/** Every file under `dir` by name, with its bytes. */
function snapshot(dir: string): Map<string, Buffer> {
  return new Map(readdirSync(dir).map((name) => [name, readFileSync(join(dir, name))]));
}

function buildErrors(root: string, outDir: string): string[] {
  try {
    buildCorpus({ root, outDir });
  } catch (error) {
    if (error instanceof CorpusBuildError) return error.errors;
    throw error;
  }
  throw new Error('build succeeded on invalid input');
}

describe('a successful corpus build', () => {
  let copy: CorpusCopy;
  let outDir: string;
  let repeatDir: string;
  let manifest: CorpusManifest;

  beforeAll(() => {
    copy = copyCorpusInputs();
    outDir = join(copy.root, 'out', 'a');
    repeatDir = join(copy.root, 'out', 'b');
    manifest = buildCorpus({ root: copy.root, outDir });
    buildCorpus({ root: copy.root, outDir: repeatDir });
  }, 60_000);
  afterAll(() => copy.dispose());

  it('writes exactly the documented bundles', () => {
    const bundles = [...Object.keys(expectedBundles), ...derivedBundles];
    expect(Object.keys(manifest.bundles).sort()).toEqual(bundles.sort());
    expect(readdirSync(outDir).sort()).toEqual([...bundles, 'manifest.json'].sort());
  });

  describe('the graph bundle', () => {
    let bundled: Graph;
    let fresh: Graph;

    beforeAll(() => {
      bundled = readGraphBundle(outDir);
      fresh = buildGraph(copy.root);
    }, 60_000);

    it.each(traversals)(
      'traverses from $id as the freshly derived graph does',
      ({ id, options }) => {
        const edges = traverse(bundled, id, options);
        expect(edges.length).toBeGreaterThan(0);
        expect(edges).toEqual(traverse(fresh, id, options));
      },
    );

    it('samples canonical, summary and derived expansion edges', () => {
      const relations = new Set(
        traversals
          .flatMap(({ id, options }) => traverse(bundled, id, options))
          .map((e) => e.relation),
      );
      expect([...relations]).toEqual(
        expect.arrayContaining(['input_from', 'summary_of', 'expanded_by', 'step_rule']),
      );
    });

    it('holds the nodes and edges of the derived graph, counted in the manifest', () => {
      expect(bundled.nodes).toEqual(fresh.nodes);
      expect(bundled.edges).toEqual(fresh.edges);
      expect(manifest.bundles['graph.json']?.records).toBe(fresh.nodes.length + fresh.edges.length);
    });
  });

  it.each(Object.entries(expectedBundles))(
    '%s holds every record as authored, in path then file order, mapped to its file',
    (name, expected) => {
      const records: unknown[] = [];
      const files: Record<string, string> = {};
      for (const path of expected.paths(copy.root)) {
        for (const record of expected.records(readYaml(copy.root, path))) {
          records.push(record);
          files[expected.key(record)] = path;
        }
      }
      const bundle = readBundle(outDir, name);
      expect(records.length).toBeGreaterThan(0);
      expect(bundle.records).toEqual(records);
      expect(bundle.files).toEqual(files);
    },
  );

  it("maps ids to the same files as the retrieval loader's map", () => {
    const loaded = loadRetrievalCorpus(copy.root);
    const compiled = Object.keys(expectedBundles).flatMap((name) =>
      Object.entries(readBundle(outDir, name).files).filter(([key]) => loaded.files.has(key)),
    );
    expect(new Map(compiled)).toEqual(loaded.files);
  });

  it('keeps uncertainty and missing-book markers', () => {
    const text = readFileSync(join(outDir, 'issues.json'), 'utf8');
    expect(text).toContain('"id": "issue.sanity.inn_recovery_stay_limit"');
    expect(text).toContain('"id": "issue.guild.alchemist_availability_merged_tables"');
    const corpusText = Object.keys(expectedBundles)
      .map((name) => readFileSync(join(outDir, name), 'utf8'))
      .join('');
    expect(corpusText).toContain('"unresolved_references"');
    expect(corpusText).toContain('"external_references"');
    expect(readFileSync(join(outDir, 'external-sources.json'), 'utf8')).toContain(
      '"status": "not_present"',
    );
  });

  it('writes byte-identical files when built twice from the same inputs', () => {
    expect(readdirSync(repeatDir).sort()).toEqual(readdirSync(outDir).sort());
    for (const name of readdirSync(outDir)) {
      const same = readFileSync(join(repeatDir, name)).equals(readFileSync(join(outDir, name)));
      expect(same, name).toBe(true);
    }
  });

  it('returns the manifest it publishes', () => {
    expect(JSON.parse(readFileSync(join(outDir, 'manifest.json'), 'utf8'))).toEqual(manifest);
  });

  it('records each bundle with its record count and the SHA-256 of its bytes', () => {
    for (const [name, entry] of Object.entries(manifest.bundles)) {
      const bytes = readFileSync(join(outDir, name));
      expect(entry.sha256, name).toBe(createHash('sha256').update(bytes).digest('hex'));
      // The graph bundle's count is checked with the graph.
      if (name in expectedBundles) {
        expect(entry.records, name).toBe(readBundle(outDir, name).records.length);
      }
    }
  });

  it('hashes every canonical YAML input by repo-relative path', () => {
    const paths = [
      'source/manifest.yaml',
      ...Object.values(expectedBundles).flatMap((expected) => expected.paths(copy.root)),
    ];
    expect(Object.keys(manifest.inputs).sort()).toEqual([...new Set(paths)].sort());
    const sha = (path: string): string =>
      createHash('sha256')
        .update(readFileSync(join(copy.root, path)))
        .digest('hex');
    expect(manifest.inputs['corpus/glossary/terms.yaml']).toBe(sha('corpus/glossary/terms.yaml'));
    expect(manifest.input_fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it('ties the build to each source document by id and file hash', () => {
    const { documents } = readYaml(copy.root, 'source/manifest.yaml') as {
      documents: Array<{ id: string; file: string }>;
    };
    expect(manifest.sources.map((source) => source.id)).toEqual(documents.map((doc) => doc.id));
    const rulebook = manifest.sources.find(
      (source) => source.id === 'rulebook.second_printing.eng',
    );
    expect(rulebook?.file).toBe('source/Rulebook-2nd-printing-ENGa.pdf');
    expect(rulebook?.sha256).toBe(
      createHash('sha256')
        .update(readFileSync(join(copy.root, 'source/Rulebook-2nd-printing-ENGa.pdf')))
        .digest('hex'),
    );
  });

  it('lists the review evidence it does not compile, and each listed path exists', () => {
    expect(manifest.excluded.map((entry) => entry.path)).toEqual(
      expect.arrayContaining([
        'tests/fixtures/acceptance',
        'tests/fixtures/example-inventory.json',
      ]),
    );
    for (const { path, reason } of manifest.excluded) {
      expect(existsSync(join(repoRoot, path)), path).toBe(true);
      expect(reason.length).toBeGreaterThan(0);
    }
  });

  it('publishes a manifest that matches its JSON Schema', () => {
    const schema: unknown = JSON.parse(
      readFileSync(join(repoRoot, 'schemas/corpus-bundle-manifest.schema.json'), 'utf8'),
    );
    const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema as object);
    const published: unknown = JSON.parse(readFileSync(join(outDir, 'manifest.json'), 'utf8'));
    expect(validate(published), JSON.stringify(validate.errors)).toBe(true);
  });

  it('contains no absolute paths, backslashes or timestamps', () => {
    const text = readFileSync(join(outDir, 'manifest.json'), 'utf8');
    expect(text).not.toContain(copy.root);
    expect(text).not.toContain(repoRoot);
    expect(text).not.toContain('\\');
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(text.endsWith('}\n')).toBe(true);
    const paths = [
      ...Object.keys(manifest.inputs),
      ...manifest.sources.map((source) => source.file),
      ...manifest.excluded.map((entry) => entry.path),
    ];
    for (const path of paths) expect(path, path).toMatch(/^(?!\/)[^\\]+$/);
  });

  // Shares the build above: the copy is broken one way per test and restored afterwards.
  describe('then a build from invalid input', () => {
    let published: Map<string, Buffer>;
    let restore: (() => void) | undefined;

    beforeAll(() => {
      published = snapshot(outDir);
    });
    afterEach(() => {
      restore?.();
      restore = undefined;
    });

    function breakFile(path: string, transform: (text: string) => string): void {
      const original = readFileSync(join(copy.root, path), 'utf8');
      copy.edit(path, transform);
      restore = () => copy.edit(path, () => original);
    }

    function expectPreviousOutputKept(): void {
      const kept = snapshot(outDir);
      expect([...kept.keys()]).toEqual([...published.keys()]);
      for (const [name, bytes] of published) {
        expect(kept.get(name)?.equals(bytes), name).toBe(true);
      }
      expect(readdirSync(join(copy.root, 'out')).sort()).toEqual(['a', 'b']);
    }

    it.each([
      {
        name: 'a schema violation',
        path: 'corpus/glossary/terms.yaml',
        transform: (text: string) => text.replace('  name: Adjacent\n', ''),
        error: /^corpus\/glossary\/terms\.yaml: \/0 must have required property 'name'$/,
      },
      {
        name: 'a duplicate id',
        path: 'corpus/glossary/terms.yaml',
        transform: (text: string) =>
          text.replace('- id: term.action_points\n', '- id: term.adjacent\n'),
        error: /^corpus\/glossary\/terms\.yaml: duplicate id "term\.adjacent"$/,
      },
      {
        name: 'a dangling see_also',
        path: 'corpus/source-map/sections.yaml',
        transform: (text: string) =>
          text.replace('  see_also:\n', '  see_also:\n    - section.nowhere\n'),
        error: /^sections\.yaml: ".+" see_also references unknown "section\.nowhere"$/,
      },
      {
        name: 'a coverage row without a section',
        path: 'corpus/source-map/coverage.yaml',
        transform: (text: string) =>
          text.replace(
            'sections:\n',
            'sections:\n  - id: section.nowhere\n    status: not_started\n',
          ),
        error: /^coverage\.yaml: entry "section\.nowhere" has no matching section$/,
      },
      {
        name: 'a YAML parse error',
        path: 'review/independent/alchemy-core.yaml',
        transform: (text: string) => `${text}\n- id: [unclosed\n`,
        error: /^review\/independent\/alchemy-core\.yaml: YAML parse error: /,
      },
    ])(
      'rejects $name naming the file and keeps the previous output',
      ({ path, transform, error }) => {
        breakFile(path, transform);
        expect(buildErrors(copy.root, outDir)).toContainEqual(expect.stringMatching(error));
        expectPreviousOutputKept();
      },
    );

    it('reports every error and creates no output where there was none', () => {
      breakFile('corpus/glossary/terms.yaml', (text) =>
        text.replace('  name: Adjacent\n', '').replace('  name: Action Points\n', ''),
      );
      const errors = buildErrors(copy.root, join(copy.root, 'fresh', 'corpus'));
      expect(errors).toContain("corpus/glossary/terms.yaml: /0 must have required property 'name'");
      expect(errors).toContain("corpus/glossary/terms.yaml: /1 must have required property 'name'");
      expect(existsSync(join(copy.root, 'fresh'))).toBe(false);
    });
  });
});
