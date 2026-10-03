import type { EvidenceItem } from '../../../../scripts/ask/evidence.ts';
import type { Citation } from '../../../../scripts/retrieve/documents.ts';

/** One physical rulebook page a record cites, with the headings it names there. */
export interface CitedPage {
  pdf: number;
  printed: number | null;
  headings: string[];
}

/** What the rulebook viewer should open: a page, and the record that sent the reader there. */
export interface RulebookTarget {
  pdf: number;
  record?: {
    id: string;
    title: string;
    pages: CitedPage[];
    /** Record titles, highlighted when a page does not print the cited heading verbatim. */
    terms: string[];
  };
}

const ID = '[a-z_]+(?:\\.[a-z0-9_]+)+';
export const CITATION = new RegExp(`\\[(${ID})\\]`, 'g');
/** Adjacent citations, optionally separated by commas or semicolons: `[a] [b], [c]`. */
export const CITATION_RUN = new RegExp(`\\[${ID}\\](?:[ \\t]*[,;]?[ \\t]*\\[${ID}\\])*`, 'g');

/** Rewrites each citation run as one Markdown link, `#cite:a+b+c`, for the renderer to pick up. */
export function linkCitations(text: string): string {
  return text.replace(CITATION_RUN, (run) => {
    const ids = [...run.matchAll(CITATION)].map((match) => match[1]!);
    return `[cite](#cite:${ids.join('+')})`;
  });
}

export function citedPages(item: EvidenceItem): CitedPage[] {
  const pages = new Map<number, CitedPage>();
  for (const citation of item.citations) {
    if (citation.document !== 'rulebook.second_printing.eng' || citation.pdf_page == null) continue;
    const page = pages.get(citation.pdf_page) ?? {
      pdf: citation.pdf_page,
      printed: citation.printed_page,
      headings: [],
    };
    if (citation.heading && !page.headings.includes(citation.heading))
      page.headings.push(citation.heading);
    pages.set(citation.pdf_page, page);
  }
  return [...pages.values()].sort((a, b) => a.pdf - b.pdf);
}

export function pageLabel(page: { pdf: number; printed: number | null }): string {
  return page.printed == null ? `PDF ${page.pdf}` : `p. ${page.printed}`;
}

/** Compact label for a set of pages: `p. 55`, `pp. 55–57`, `pp. 55, 60, 72…`. */
export function pagesLabel(pages: CitedPage[]): string {
  const first = pages[0];
  const last = pages.at(-1);
  if (!first || !last) return 'no page';
  if (pages.length === 1) return pageLabel(first);
  const printed = pages.every((page) => page.printed != null);
  const number = (page: CitedPage) => (printed ? page.printed! : page.pdf);
  const prefix = printed ? 'pp.' : 'PDF';
  const contiguous = pages.every((page, i) => i === 0 || page.pdf === pages[i - 1]!.pdf + 1);
  if (contiguous) return `${prefix} ${number(first)}–${number(last)}`;
  const shown = pages.slice(0, 3).map(number).join(', ');
  return `${prefix} ${shown}${pages.length > 3 ? '…' : ''}`;
}

export function targetFor(item: EvidenceItem, pdf?: number): RulebookTarget | null {
  const pages = citedPages(item);
  const page = pages.find((p) => p.pdf === pdf) ?? pages[0];
  if (!page) return null;
  return { pdf: page.pdf, record: { id: item.id, title: item.title, pages, terms: [item.title] } };
}

/** The evidence record a citation id points at; issue ids resolve to the record that carries them. */
export function resolveCitation(
  evidence: EvidenceItem[] | undefined,
  id: string,
): { item: EvidenceItem; issue: boolean } | null {
  if (!evidence) return null;
  const item = evidence.find((e) => e.id === id);
  if (item) return { item, issue: false };
  const owner = evidence.find((e) => e.issues.some((issue) => issue.id === id));
  return owner ? { item: owner, issue: true } : null;
}

/** Ruling sources are separate from pages in the rulebook viewer. */
export function rulingCitations(item: EvidenceItem): Citation[] {
  const citations = [
    ...item.citations,
    ...item.issues.flatMap((issue) => issue.resolution?.citations ?? []),
  ];
  return [
    ...new Map(
      citations
        .filter((citation) => citation.document !== 'rulebook.second_printing.eng')
        .map((citation) => [JSON.stringify(citation), citation]),
    ).values(),
  ];
}

export function rulingSourceUrl(citation: Citation): string {
  const page = citation.pdf_page == null ? '' : `#page=${citation.pdf_page}`;
  return `/api/sources/${encodeURIComponent(citation.document)}${page}`;
}
