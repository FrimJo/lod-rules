/**
 * Throwaway PDF inspector used to seed the structural map.
 *
 * Output under generated/extract/ is a build artifact, never canonical data. It exists so
 * the section tree and page map can be drafted from real text instead of guesswork, and
 * every line it produces must still be reconciled against the rendered page.
 *
 * Usage:
 *   tsx scripts/extract/inspect-pdf.ts            # dump every page
 *   tsx scripts/extract/inspect-pdf.ts 12 40      # dump a pdf page range, inclusive
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { repoRoot } from '../validate/schemas.ts';

const pdfPath = join(repoRoot, 'source', 'Rulebook-2nd-printing-ENGa.pdf');
const outputDir = join(repoRoot, 'generated', 'extract');

/** A run of text items sharing a baseline, with the largest glyph height on that line. */
export interface Line {
  text: string;
  /** Font height in PDF units; the main signal for telling headings from body text. */
  size: number;
  /** Baseline y in PDF units, measured from the bottom of the page. */
  y: number;
  /** Leftmost x in PDF units. Two-column pages separate cleanly on this. */
  x: number;
  /** Font of the first item on the line. Bold faces mark run-in headings. */
  font: string;
}

export interface PageDump {
  pdf_page: number;
  lines: Line[];
}

export interface OutlineEntry {
  title: string;
  depth: number;
  pdf_page: number | null;
}

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

interface RawOutlineNode {
  title: string;
  dest: string | unknown[] | null;
  items: RawOutlineNode[];
}

/** Baselines within this many PDF units are treated as the same line. */
const LINE_TOLERANCE = 2.5;

/**
 * Horizontal gap that ends a line. The book is laid out in two columns, so items sharing a
 * baseline across the gutter are separate lines; without this, column headings merge into
 * nonsense like "Basic ConceptHouse Rules".
 */
const COLUMN_GAP = 18;

interface OpenLine extends Line {
  right: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function groupIntoLines(items: TextItem[]): Line[] {
  const positioned = items
    .filter((item) => item.str.trim() !== '')
    .map((item) => {
      // A PDF text matrix is always six numbers: [a, b, c, d, e, f].
      const [, , , verticalScale, x, y] = item.transform as [
        number,
        number,
        number,
        number,
        number,
        number,
      ];
      return {
        str: item.str,
        x,
        y,
        width: item.width,
        font: item.fontName,
        // The vertical scale tracks font size more reliably than item.height for the
        // display-face headings used throughout this rulebook.
        size: Math.abs(verticalScale) || item.height,
      };
    })
    .sort((a, b) => (Math.abs(a.y - b.y) <= LINE_TOLERANCE ? a.x - b.x : b.y - a.y));

  const lines: OpenLine[] = [];

  for (const item of positioned) {
    const previous = lines.at(-1);
    const sameBaseline = previous && Math.abs(previous.y - item.y) <= LINE_TOLERANCE;

    if (sameBaseline && item.x - previous.right <= COLUMN_GAP) {
      previous.text += item.str;
      previous.size = Math.max(previous.size, item.size);
      previous.right = Math.max(previous.right, item.x + item.width);
    } else {
      lines.push({
        text: item.str,
        size: item.size,
        y: item.y,
        x: item.x,
        font: item.font,
        right: item.x + item.width,
      });
    }
  }

  return lines
    .map(({ text, size, y, x, font }) => ({
      text: text.replace(/\s+/g, ' ').trim(),
      size: round(size),
      y: round(y),
      x: round(x),
      font,
    }))
    .filter((line) => line.text !== '');
}

async function readOutline(pdf: PDFDocumentProxy): Promise<OutlineEntry[]> {
  const outline = (await pdf.getOutline()) as RawOutlineNode[] | null;
  if (!outline) return [];

  const entries: OutlineEntry[] = [];

  async function walk(nodes: RawOutlineNode[], depth: number): Promise<void> {
    for (const node of nodes) {
      let pdfPage: number | null = null;
      try {
        const dest =
          typeof node.dest === 'string' ? await pdf.getDestination(node.dest) : node.dest;
        if (Array.isArray(dest) && dest[0]) {
          pdfPage = (await pdf.getPageIndex(dest[0] as never)) + 1;
        }
      } catch {
        pdfPage = null;
      }

      entries.push({ title: node.title, depth, pdf_page: pdfPage });
      if (node.items?.length) await walk(node.items, depth + 1);
    }
  }

  await walk(outline, 0);
  return entries;
}

export async function dumpPdf(firstPage?: number, lastPage?: number) {
  const loadingTask = getDocument({
    data: new Uint8Array(readFileSync(pdfPath)),
    // Page images are irrelevant here; only the text layer is being harvested.
    disableFontFace: true,
    standardFontDataUrl: join(repoRoot, 'node_modules', 'pdfjs-dist', 'standard_fonts/'),
  });
  const pdf = await loadingTask.promise;

  const start = firstPage ?? 1;
  const end = Math.min(lastPage ?? pdf.numPages, pdf.numPages);

  const pages: PageDump[] = [];
  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push({
      pdf_page: pageNumber,
      lines: groupIntoLines(content.items as TextItem[]),
    });
    page.cleanup();
  }

  const outline = await readOutline(pdf);
  const numPages = pdf.numPages;
  await loadingTask.destroy();

  return { numPages, outline, pages };
}

/** Lines worth surfacing in the console when scanning for structure. */
const INTERESTING = /\b(optional|example|see page|see p\.|bestiary|chart|appendix|table)\b/i;

function renderText(pages: PageDump[]): string {
  return pages
    .map((page) => {
      const body = page.lines
        .map(
          (line) =>
            `  [${line.size.toFixed(1)} @${line.x.toFixed(0)},${line.y.toFixed(0)}] ${line.text}`,
        )
        .join('\n');
      return `=== pdf_page ${page.pdf_page} ===\n${body}`;
    })
    .join('\n\n');
}

async function main(): Promise<void> {
  const [firstArg, secondArg] = process.argv.slice(2);
  const firstPage = firstArg ? Number(firstArg) : undefined;
  const lastPage = secondArg ? Number(secondArg) : firstPage;

  const { numPages, outline, pages } = await dumpPdf(firstPage, lastPage);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'pages.json'), `${JSON.stringify(pages, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'pages.txt'), `${renderText(pages)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'outline.json'), `${JSON.stringify(outline, null, 2)}\n`, 'utf8');

  console.log(`Pages in document: ${numPages}`);
  console.log(`Pages dumped: ${pages.length} (${pages[0]?.pdf_page}..${pages.at(-1)?.pdf_page})`);
  console.log(`Outline entries: ${outline.length}${outline.length === 0 ? ' (no bookmarks)' : ''}`);

  for (const entry of outline) {
    console.log(`${'  '.repeat(entry.depth)}- ${entry.title} (pdf ${entry.pdf_page ?? '?'})`);
  }

  console.log('\nLines of interest:');
  for (const page of pages) {
    const hits = page.lines.filter((line) => INTERESTING.test(line.text));
    if (hits.length === 0) continue;
    console.log(`  pdf ${page.pdf_page}: ${hits.map((line) => line.text).join(' | ')}`);
  }

  console.log('\nWrote generated/extract/{pages.json,pages.txt,outline.json}');
}

await main();
