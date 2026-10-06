import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { buildSearchDocuments, type DocumentKind, type SearchDocument } from './documents.ts';
import { loadRetrievalCorpus, type RetrievalCorpus } from './load.ts';

export type { SearchDocument } from './documents.ts';

export interface SearchOptions {
  kinds?: DocumentKind[];
  scope?: string;
  questId?: string;
  /** Section-id prefixes; a document matches when its chapter starts with any of them. */
  chapters?: string[];
  /** Exact section ids; a document matches when it sits directly under one of them. */
  sections?: string[];
  limit?: number;
}

export interface SearchHit {
  id: string;
  kind: DocumentKind;
  type: string;
  title: string;
  context: string;
  scope: string;
  quest_id?: string;
  score: number;
  snippet: string;
  citations: SearchDocument['citations'];
  issue_ids: string[];
  review_status: SearchDocument['review_status'];
  file: string;
}

/** `source` is the expanded record; `target` is the neighbour. For `in` edges the neighbour holds the reference. */
export interface Edge {
  source: string;
  relation: string;
  target: string;
  direction: 'out' | 'in';
  /** False when the target is a section or other id without a retrieval document. */
  found: boolean;
  target_title?: string;
}

export interface ExpandOptions {
  direction?: 'out' | 'in' | 'both';
  relations?: string[];
  depth?: number;
  /** Neither report nor traverse edges to records of these kinds (e.g. `issue`). */
  skipKinds?: DocumentKind[];
}

const STOPWORDS = new Set(
  'a an and are as at be by can do does for from has have how i in is it its of on or the to what when where which who why with'.split(
    ' ',
  ),
);

/** Quest-local records rank below global rules unless the query or filters point at that quest. */
const QUEST_PENALTY = 0.5;
const DEFAULT_KINDS: DocumentKind[] = [
  'rule',
  'entity',
  'table',
  'procedure',
  'state_machine',
  'term',
];

export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Alias key: normalized and without a leading article ("The Pyramid of Xánthu"). */
function aliasKey(text: string): string {
  return normalize(text).replace(/^(the|a|an) /, '');
}

function tokens(text: string): string[] {
  return [...new Set(normalize(text).split(' '))].filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function text(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') throw new Error(`retrieval: column ${key} is not text`);
  return value;
}

function decode(json: string): SearchDocument {
  return JSON.parse(json) as SearchDocument;
}

export function createRetrievalDatabase(
  documents: SearchDocument[],
  records: Map<string, unknown>,
  path = ':memory:',
): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE documents (id TEXT PRIMARY KEY, kind TEXT NOT NULL, scope TEXT NOT NULL,
      quest_id TEXT, chapter TEXT, json TEXT NOT NULL);
    CREATE TABLE records (id TEXT PRIMARY KEY, json TEXT NOT NULL);
    CREATE TABLE aliases (form TEXT NOT NULL, id TEXT NOT NULL, PRIMARY KEY (form, id));
    CREATE TABLE relations (source TEXT NOT NULL, relation TEXT NOT NULL, target TEXT NOT NULL,
      PRIMARY KEY (source, relation, target));
    CREATE INDEX relations_target ON relations (target);
    CREATE VIRTUAL TABLE fts USING fts5(id UNINDEXED, title, aliases, context, text,
      tokenize = 'porter unicode61 remove_diacritics 2');
  `);
  const insert = {
    doc: db.prepare('INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?)'),
    record: db.prepare('INSERT INTO records VALUES (?, ?)'),
    alias: db.prepare('INSERT OR IGNORE INTO aliases VALUES (?, ?)'),
    relation: db.prepare('INSERT OR IGNORE INTO relations VALUES (?, ?, ?)'),
    fts: db.prepare('INSERT INTO fts VALUES (?, ?, ?, ?, ?)'),
  };
  db.exec('BEGIN');
  for (const doc of documents) {
    insert.doc.run(
      doc.id,
      doc.kind,
      doc.scope,
      doc.quest_id ?? null,
      doc.chapter ?? null,
      JSON.stringify(doc),
    );
    insert.record.run(doc.id, JSON.stringify(records.get(doc.id) ?? null));
    // "Molgor, the Fiend of Summerhall" is also "Molgor".
    const shortName = doc.kind === 'entity' ? doc.title.split(/,| — | \(/)[0]!.trim() : '';
    const forms = [doc.title, ...doc.aliases, ...(shortName.length >= 4 ? [shortName] : [])];
    for (const form of forms) {
      const key = aliasKey(form);
      if (key) insert.alias.run(key, doc.id);
    }
    for (const relation of doc.relations)
      insert.relation.run(doc.id, relation.relation, relation.target);
    const headings = doc.citations.map((citation) => citation.heading ?? '');
    const idWords = doc.id.split('.').slice(1).join(' ').replace(/_/g, ' ');
    insert.fts.run(
      doc.id,
      doc.title,
      doc.aliases.join(' '),
      [doc.context, idWords, ...new Set(headings)].join(' '),
      doc.text,
    );
  }
  db.exec('COMMIT');
  return db;
}

export function canonicalRecords(corpus: RetrievalCorpus): Map<string, unknown> {
  const { pilot } = corpus;
  const all: Array<{ id: string }> = [
    ...pilot.rules,
    ...pilot.entities,
    ...pilot.tables,
    ...pilot.procedures,
    ...pilot.stateMachines,
    ...corpus.terms,
    ...corpus.issues,
  ];
  return new Map(all.map((record) => [record.id, record]));
}

export class Retrieval {
  constructor(private readonly db: DatabaseSync) {}

  /** Builds an in-memory index from the canonical YAML. */
  static fromCorpus(root?: string): Retrieval {
    const corpus = loadRetrievalCorpus(root);
    return new Retrieval(
      createRetrievalDatabase(buildSearchDocuments(corpus), canonicalRecords(corpus)),
    );
  }

  /** Opens a database written by `npm run retrieve -- build`. */
  static open(path: string): Retrieval {
    return new Retrieval(new DatabaseSync(path, { readOnly: true }));
  }

  close(): void {
    this.db.close();
  }

  document(id: string): SearchDocument | null {
    const row = this.db.prepare('SELECT json FROM documents WHERE id = ?').get(id);
    return row ? decode(text(row, 'json')) : null;
  }

  /** Exact id lookup. `record` is the canonical YAML record as loaded. */
  get(id: string): { document: SearchDocument; record: unknown } | null {
    const document = this.document(id);
    if (!document) return null;
    const row = this.db.prepare('SELECT json FROM records WHERE id = ?').get(id);
    return { document, record: row ? (JSON.parse(text(row, 'json')) as unknown) : null };
  }

  /** Exact, normalized title or alias match (e.g. "AP", "Xanthu"). */
  resolve(name: string): SearchDocument[] {
    return this.db
      .prepare(
        'SELECT d.json FROM aliases a JOIN documents d ON d.id = a.id WHERE a.form = ? ORDER BY d.id',
      )
      .all(aliasKey(name))
      .map((row) => decode(text(row, 'json')));
  }

  search(query: string, options: SearchOptions = {}): SearchHit[] {
    const trimmed = query.trim();
    const limit = options.limit ?? 10;
    const exact = this.document(trimmed);
    const terms = tokens(trimmed);
    if (terms.length === 0) return exact ? [this.hit(exact, 0, exact.text.slice(0, 200))] : [];

    const kinds = options.kinds ?? DEFAULT_KINDS;
    const where = ['fts MATCH ?', `d.kind IN (${kinds.map(() => '?').join(', ')})`];
    const params: SQLInputValue[] = [terms.map((t) => `"${t}"`).join(' OR '), ...kinds];
    if (options.scope) {
      where.push('d.scope = ?');
      params.push(options.scope);
    }
    if (options.chapters && options.chapters.length > 0) {
      where.push(`(${options.chapters.map(() => "d.chapter LIKE ? || '%'").join(' OR ')})`);
      params.push(...options.chapters);
    }
    if (options.sections && options.sections.length > 0) {
      where.push(
        `json_extract(d.json, '$.section_id') IN (${options.sections.map(() => '?').join(', ')})`,
      );
      params.push(...options.sections);
    }
    if (options.questId) {
      where.push('d.quest_id = ?');
      params.push(options.questId);
    }

    const rows = this.db
      .prepare(
        `SELECT d.json, bm25(fts, 10.0, 8.0, 3.0, 1.0) AS score,
           snippet(fts, 4, '«', '»', '…', 24) AS snippet
         FROM fts JOIN documents d ON d.id = fts.id
         WHERE ${where.join(' AND ')} ORDER BY score LIMIT 200`,
      )
      .all(...params);

    // Words that never name a global record (Molgor, Xanthu, portal) signal quest intent.
    const global = this.globalVocabulary();
    const distinctive = terms.filter((t) => !global.has(t));
    const scoped = options.scope !== undefined || options.questId !== undefined;
    const questIntent = (doc: SearchDocument): boolean => {
      const named = tokens(
        [
          doc.title,
          doc.context,
          doc.quest_id ? (this.document(doc.quest_id)?.title ?? '') : '',
        ].join(' '),
      );
      return distinctive.some((t) => named.includes(t));
    };

    const hits = rows.map((row) => {
      const doc = decode(text(row, 'json'));
      const haystack = ` ${normalize([doc.title, ...doc.aliases, doc.context, doc.text].join(' '))}`;
      const matched = terms.filter((t) =>
        haystack.includes(` ${t.slice(0, Math.max(4, t.length - 2))}`),
      );
      let score = -Number(row.score) * (0.5 + matched.length / terms.length);
      if (doc.scope === 'quest' && !scoped && !questIntent(doc)) score *= QUEST_PENALTY;
      return this.hit(doc, score, text(row, 'snippet'));
    });
    hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id, 'en'));
    if (!exact) return hits.slice(0, limit);
    const rest = hits.filter((hit) => hit.id !== exact.id);
    return [this.hit(exact, Number.MAX_SAFE_INTEGER, exact.text.slice(0, 200)), ...rest].slice(
      0,
      limit,
    );
  }

  /** Typed relation traversal. `in` edges answer "what points at this record?". */
  expand(id: string, options: ExpandOptions = {}): Edge[] {
    const direction = options.direction ?? 'both';
    const depth = options.depth ?? 1;
    const wanted = options.relations ? new Set(options.relations) : null;
    const edges: Edge[] = [];
    const seen = new Set([id]);
    let frontier = [id];
    for (let level = 0; level < depth && frontier.length > 0; level += 1) {
      const next: string[] = [];
      for (const node of frontier) {
        const found: Array<Omit<Edge, 'found' | 'target_title'>> = [];
        if (direction !== 'in') {
          for (const row of this.db
            .prepare('SELECT relation, target FROM relations WHERE source = ?')
            .all(node)) {
            found.push({
              source: node,
              relation: text(row, 'relation'),
              target: text(row, 'target'),
              direction: 'out',
            });
          }
        }
        if (direction !== 'out') {
          for (const row of this.db
            .prepare('SELECT source, relation FROM relations WHERE target = ?')
            .all(node)) {
            found.push({
              source: node,
              relation: text(row, 'relation'),
              target: text(row, 'source'),
              direction: 'in',
            });
          }
        }
        for (const edge of found) {
          if (wanted && !wanted.has(edge.relation)) continue;
          const target = this.document(edge.target);
          if (target && options.skipKinds?.includes(target.kind)) continue;
          edges.push({
            ...edge,
            found: target !== null,
            ...(target ? { target_title: target.title } : {}),
          });
          if (target && !seen.has(edge.target)) {
            seen.add(edge.target);
            next.push(edge.target);
          }
        }
      }
      frontier = next;
    }
    return edges;
  }

  /** Review issues attached to a record: open ambiguities, conflicts and undefined rules. */
  issues(id: string): SearchDocument[] {
    const doc = this.document(id);
    if (!doc) return [];
    return doc.issue_ids
      .map((issueId) => this.document(issueId))
      .filter((d): d is SearchDocument => d !== null);
  }

  private vocabulary: Set<string> | null = null;
  private headings: Array<{ section_id: string; title: string }> | null = null;
  /**
   * Rulebook headings the text names, longest title first. A heading word also matches an
   * inflected form ("Stun" in "stunned"). Chapters and quest-only headings are skipped: they
   * are too broad, or demoted unless the quest is named.
   */
  namedHeadings(text: string): Array<{ section_id: string; title: string }> {
    const words = normalize(text).split(' ');
    const wordMatches = (heading: string, word: string | undefined): boolean =>
      word === heading ||
      (word !== undefined &&
        heading.length >= 4 &&
        word.startsWith(heading) &&
        word.length - heading.length <= 3);
    const named = (title: string): boolean => {
      const heading = normalize(title).split(' ');
      if (heading.every((w) => STOPWORDS.has(w) || /^\d+$/.test(w))) return false;
      for (let i = 0; i + heading.length <= words.length; i += 1) {
        if (heading.every((w, j) => wordMatches(w, words[i + j]))) return true;
      }
      return false;
    };
    return this.headingTitles()
      .filter((heading) => named(heading.title))
      .sort((a, b) => b.title.length - a.title.length || a.section_id.localeCompare(b.section_id));
  }

  private headingTitles(): Array<{ section_id: string; title: string }> {
    if (!this.headings) {
      const seen = new Map<string, string>();
      for (const row of this.db
        .prepare("SELECT json FROM documents WHERE scope <> 'quest' ORDER BY id")
        .all()) {
        const doc = decode(text(row, 'json'));
        if (!doc.section_id || doc.section_id === doc.chapter || seen.has(doc.section_id)) continue;
        // `context` starts with the record's own section title.
        const title = doc.context.split(' — ')[0];
        if (title) seen.set(doc.section_id, title);
      }
      this.headings = [...seen].map(([section_id, title]) => ({ section_id, title }));
    }
    return this.headings;
  }

  private globalVocabulary(): Set<string> {
    if (!this.vocabulary) {
      this.vocabulary = new Set();
      for (const row of this.db
        .prepare("SELECT json FROM documents WHERE scope <> 'quest'")
        .all()) {
        const doc = decode(text(row, 'json'));
        for (const t of tokens([doc.title, ...doc.aliases, doc.context].join(' ')))
          this.vocabulary.add(t);
      }
    }
    return this.vocabulary;
  }

  private hit(doc: SearchDocument, score: number, snippet: string): SearchHit {
    const hit: SearchHit = {
      id: doc.id,
      kind: doc.kind,
      type: doc.type,
      title: doc.title,
      context: doc.context,
      scope: doc.scope,
      score,
      snippet,
      citations: doc.citations,
      issue_ids: doc.issue_ids,
      review_status: doc.review_status,
      file: doc.file,
    };
    if (doc.quest_id) hit.quest_id = doc.quest_id;
    return hit;
  }
}
