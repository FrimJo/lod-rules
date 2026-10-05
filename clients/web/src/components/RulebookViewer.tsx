import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { pageLabel, type RulebookTarget } from '../lib/citations.ts';
import { prefetchRulebookPages, RULEBOOK_URL } from '../lib/pdf.ts';
import type { RulebookIndex } from '../server/rulebook.ts';
import { RulebookPage, type HighlightResult } from './RulebookPage.tsx';

const ZOOMS = [0.75, 1, 1.25, 1.5, 2, 3];

function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function RulebookViewer({
  target,
  index,
  onShowRecord,
}: {
  target: RulebookTarget;
  index: RulebookIndex | undefined;
  onShowRecord: (id: string) => void;
}) {
  const [pdf, setPdf] = useState(target.pdf);
  const [shownTarget, setShownTarget] = useState(target);
  const [zoom, setZoom] = useState(1);
  const [highlight, setHighlight] = useState<(HighlightResult & { pdf: number }) | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  if (target !== shownTarget) {
    setShownTarget(target);
    setPdf(target.pdf);
  }

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [target]);

  const pageCount = index?.pageCount ?? Number.POSITIVE_INFINITY;

  useEffect(() => {
    const next = [pdf + 1, pdf - 1, ...(target.record?.pages.map((p) => p.pdf) ?? [])];
    const timer = setTimeout(
      () => prefetchRulebookPages(next.filter((n) => n >= 1 && n <= pageCount && n !== pdf)),
      800,
    );
    return () => clearTimeout(timer);
  }, [pdf, pageCount, target]);
  const page = index?.pages.find((p) => p.pdf === pdf);
  const printed = page ? page.printed : null;
  const record = target.record;
  const cited = record?.pages.find((p) => p.pdf === pdf);
  const zoomIndex = ZOOMS.indexOf(zoom);

  const go = (next: number) => setPdf(Math.min(Math.max(1, next), pageCount));
  const zoomBy = (step: number) =>
    setZoom(ZOOMS[Math.min(Math.max(0, zoomIndex + step), ZOOMS.length - 1)]!);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isTyping(event) || event.metaKey || event.ctrlKey || event.altKey) return;
    const keys: Record<string, () => void> = {
      ArrowLeft: () => go(pdf - 1),
      ArrowRight: () => go(pdf + 1),
      '+': () => zoomBy(1),
      '=': () => zoomBy(1),
      '-': () => zoomBy(-1),
      '0': () => setZoom(1),
    };
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  const pageName = page ? pageLabel(page) : `PDF ${pdf}`;
  const trail = page?.trail ?? [];

  return (
    <section className="viewer" aria-labelledby="viewer-title" onKeyDown={onKeyDown}>
      <header className="viewer-head">
        <div className="viewer-title-row">
          <h3 id="viewer-title" ref={headingRef} tabIndex={-1}>
            {trail.at(-1) ?? index?.title ?? 'Rulebook'}
          </h3>
          <a
            className="icon-button"
            href={`${RULEBOOK_URL}#page=${pdf}`}
            target="_blank"
            rel="noopener"
            title="Open the full PDF in a new tab"
          >
            Open PDF <span aria-hidden="true">↗</span>
          </a>
        </div>
        {trail.length > 1 && (
          <nav aria-label="Section" className="breadcrumb">
            {trail.slice(0, -1).join(' › ')}
          </nav>
        )}

        {record && (
          <div className="viewer-record">
            <span>
              Cited by{' '}
              <button type="button" className="link" onClick={() => onShowRecord(record.id)}>
                {record.title}
              </button>
            </span>
            {record.pages.length > 1 && (
              <div className="viewer-cited" role="group" aria-label="Cited pages">
                {record.pages.map((p) => (
                  <button
                    key={p.pdf}
                    type="button"
                    className="page-chip"
                    aria-current={p.pdf === pdf ? 'page' : undefined}
                    onClick={() => setPdf(p.pdf)}
                  >
                    {pageLabel(p)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="viewer-toolbar" role="toolbar" aria-label="Page controls">
          <div className="group">
            <button
              type="button"
              className="icon-button"
              onClick={() => go(pdf - 1)}
              disabled={pdf <= 1}
              aria-label="Previous page"
              title="Previous page (←)"
            >
              ‹
            </button>
            <span className="page-status">
              <strong>{printed == null ? 'Unnumbered page' : `Page ${printed}`}</strong>
              <span className="muted">
                {' '}
                · PDF {pdf}
                {index ? ` of ${index.pageCount}` : ''}
              </span>
            </span>
            <button
              type="button"
              className="icon-button"
              onClick={() => go(pdf + 1)}
              disabled={pdf >= pageCount}
              aria-label="Next page"
              title="Next page (→)"
            >
              ›
            </button>
          </div>
          <div className="group">
            <button
              type="button"
              className="icon-button"
              onClick={() => zoomBy(-1)}
              disabled={zoomIndex <= 0}
              aria-label="Zoom out"
              title="Zoom out (−)"
            >
              −
            </button>
            <button
              type="button"
              className="icon-button zoom-value"
              onClick={() => setZoom(1)}
              aria-label={`Zoom ${Math.round(zoom * 100)} percent of page width. Reset to fit width`}
              title="Fit to width (0)"
            >
              {zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => zoomBy(1)}
              disabled={zoomIndex >= ZOOMS.length - 1}
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              +
            </button>
          </div>
        </div>
        {highlight &&
          highlight.pdf === pdf &&
          (highlight.matched.length > 0 || highlight.missing.length > 0) && (
            <p className="viewer-heading-note" role="status">
              {highlight.matched.length > 0 && (
                <>
                  <span className="swatch" aria-hidden="true" />
                  Highlighted: {highlight.matched.join(', ')}.
                </>
              )}
              {highlight.missing.length > 0 &&
                ` Cited under “${highlight.missing.join('”, “')}”, which this page does not print word for word.`}
            </p>
          )}
      </header>

      <div className="viewer-scroll" tabIndex={0} role="region" aria-label={`Rulebook ${pageName}`}>
        <RulebookPage
          pdf={pdf}
          zoom={zoom}
          headings={cited?.headings ?? []}
          fallbacks={cited ? (record?.terms ?? []) : []}
          onHighlight={(result) => setHighlight({ pdf, ...result })}
          label={`Rulebook ${pageName}${trail.length ? `, ${trail.at(-1)}` : ''}`}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {pageName}
        {trail.length ? `, ${trail.at(-1)}` : ''}
      </p>
    </section>
  );
}
