import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { parse } from 'yaml';
import { dataRoot } from './data-root.ts';

export interface RulebookPage {
  pdf: number;
  printed: number | null;
  /** Section titles from the outermost part down to the page's own section. */
  trail: string[];
}

export interface RulebookIndex {
  title: string;
  pageCount: number;
  pages: RulebookPage[];
}

interface ManifestDocument {
  id: string;
  title: string;
  file: string;
  canonical?: boolean;
  pages: number;
}

interface SectionRow {
  id: string;
  title: string;
  parent?: string;
}

interface PageRow {
  pdf_page: number;
  printed_page: number | null;
  section_id: string;
}

function readYaml<T>(path: string): T {
  return parse(readFileSync(join(dataRoot, path), 'utf8')) as T;
}

function canonicalDocument(): ManifestDocument {
  const manifest = readYaml<{ documents: ManifestDocument[] }>('source/manifest.yaml');
  const document = manifest.documents.find((doc) => doc.canonical) ?? manifest.documents[0];
  if (!document) throw new Error('source/manifest.yaml declares no documents');
  return document;
}

export function rulebookFile(): { path: string; name: string; size: number; mtimeMs: number } {
  const { file } = canonicalDocument();
  const path = join(dataRoot, 'source', file);
  const { size, mtimeMs } = statSync(path);
  return { path, name: file, size, mtimeMs };
}

let source: Promise<PDFDocument> | null = null;
const PAGE_CACHE_LIMIT = 32;
const pageCache = new Map<number, Promise<Uint8Array>>();

/** Starts parsing the book, so the first page a reader opens does not wait for it. */
export function loadSource(): Promise<PDFDocument> {
  source ??= PDFDocument.load(readFileSync(rulebookFile().path), { updateMetadata: false });
  source.catch(() => {
    source = null;
  });
  return source;
}

/**
 * One rulebook page as a standalone PDF. Opening the full file makes pdf.js walk a flat
 * 286-page tree whose objects are spread over the whole 40 MB, so the viewer asks for
 * single pages instead. The first call parses the book (about 1.5 s); later pages take
 * milliseconds.
 */
export function rulebookPage(pdf: number): Promise<Uint8Array> {
  const hit = pageCache.get(pdf);
  if (hit) {
    pageCache.delete(pdf);
    pageCache.set(pdf, hit);
    return hit;
  }
  const pending = (async () => {
    const book = await loadSource();
    const out = await PDFDocument.create({ updateMetadata: false });
    const [page] = await out.copyPages(book, [pdf - 1]);
    out.addPage(page!);
    return out.save({ useObjectStreams: true });
  })();
  pending.catch(() => pageCache.delete(pdf));
  pageCache.set(pdf, pending);
  if (pageCache.size > PAGE_CACHE_LIMIT) pageCache.delete(pageCache.keys().next().value!);
  return pending;
}

let index: RulebookIndex | null = null;

export function getRulebookIndex(): RulebookIndex {
  if (index) return index;
  const document = canonicalDocument();
  const sections = new Map(
    readYaml<SectionRow[]>('corpus/source-map/sections.yaml').map((s) => [s.id, s]),
  );
  const trail = (id: string): string[] => {
    const titles: string[] = [];
    for (let s = sections.get(id); s; s = s.parent ? sections.get(s.parent) : undefined)
      titles.unshift(s.title);
    return titles;
  };
  const pages = readYaml<PageRow[]>('corpus/source-map/pages.yaml').map((row) => ({
    pdf: row.pdf_page,
    printed: row.printed_page,
    trail: trail(row.section_id),
  }));
  index = { title: document.title, pageCount: document.pages, pages };
  return index;
}
