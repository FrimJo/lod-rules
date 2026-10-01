import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';

export type PdfJs = typeof import('pdfjs-dist');

/** The whole book, for the browser's own viewer. */
export const RULEBOOK_URL = '/api/rulebook';

const pageUrl = (pdf: number) => `/api/rulebook-page/${pdf}`;
const DOC_CACHE_LIMIT = 6;

let pdfjsPending: Promise<PdfJs> | null = null;
const docs = new Map<number, PDFDocumentLoadingTask>();

function loadPdfJs(): Promise<PdfJs> {
  pdfjsPending ??= (async () => {
    const [pdfjs, worker] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  })();
  pdfjsPending.catch(() => {
    pdfjsPending = null;
  });
  return pdfjsPending;
}

/**
 * Opens one rulebook page, served by the app as its own small PDF. Browser-only. Recently
 * used pages stay open; older ones are destroyed to release their worker memory.
 */
export async function loadRulebookPage(
  pdf: number,
): Promise<{ pdfjs: PdfJs; doc: PDFDocumentProxy }> {
  const pdfjs = await loadPdfJs();
  let task = docs.get(pdf);
  if (task) {
    docs.delete(pdf);
  } else {
    task = pdfjs.getDocument({ url: pageUrl(pdf), standardFontDataUrl: '/api/pdf-fonts/' });
    task.promise.catch(() => docs.delete(pdf));
  }
  docs.set(pdf, task);
  for (const [old, stale] of docs) {
    if (docs.size <= DOC_CACHE_LIMIT) break;
    docs.delete(old);
    void stale.destroy();
  }
  return { pdfjs, doc: await task.promise };
}

/** Warms the HTTP cache for pages the reader is likely to open next. */
export function prefetchRulebookPages(pages: number[]): void {
  for (const pdf of pages) {
    if (!docs.has(pdf)) void fetch(pageUrl(pdf)).catch(() => {});
  }
}
