import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { loadRulebookPage } from '../lib/pdf.ts';

/** Canvas pixels are capped so a zoomed page on a HiDPI screen stays within memory limits. */
const MAX_CANVAS_PIXELS = 16_000_000;

function fold(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Finds each heading in the page's text runs. A heading may span several runs, and its
 * words may also occur in body text, so the match set in the largest type wins.
 */
function headingRuns(
  items: TextItem[],
  headings: string[],
): { runs: Set<number>; matched: string[] } {
  let text = '';
  const owner: number[] = [];
  items.forEach((item, index) => {
    const folded = fold(item.str);
    text += folded;
    for (let i = 0; i < folded.length; i++) owner.push(index);
  });
  const size = (index: number) => {
    const t = items[index]!.transform;
    return Math.hypot(t[2] ?? 0, t[3] ?? 0);
  };

  const marked = new Set<number>();
  const matched: string[] = [];
  for (const heading of headings) {
    const needle = fold(heading);
    if (needle.length < 3) continue;
    let best: number[] | null = null;
    let bestSize = -1;
    for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + 1)) {
      const runs = [...new Set(owner.slice(at, at + needle.length))];
      const runSize = Math.max(...runs.map(size));
      if (runSize > bestSize) [best, bestSize] = [runs, runSize];
    }
    if (!best) continue;
    matched.push(heading);
    for (const run of best) marked.add(run);
  }
  return { runs: marked, matched };
}

export interface HighlightResult {
  /** Strings found and marked on the page. */
  matched: string[];
  /** Cited headings that are not printed verbatim on the page. */
  missing: string[];
}

export function RulebookPage({
  pdf,
  zoom,
  headings,
  fallbacks,
  label,
  onHighlight,
}: {
  pdf: number;
  /** Multiplier on the fit-to-width scale. */
  zoom: number;
  headings: string[];
  /** Tried only when no heading is found, e.g. the citing record's title. */
  fallbacks: string[];
  label: string;
  onHighlight: (result: HighlightResult) => void;
}) {
  const onHighlightRef = useRef(onHighlight);
  useLayoutEffect(() => {
    onHighlightRef.current = onHighlight;
  });
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const scrolledFor = useRef<string | null>(null);
  const headingKey = `${headings.join('\n')}\0${fallbacks.join('\n')}`;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A hidden tab panel measures 0; keep the last width so the page is not re-rendered.
    const measure = () => frame.clientWidth > 0 && setWidth(Math.floor(frame.clientWidth));
    measure();
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, 120);
    });
    observer.observe(frame);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!width) return;
    let cancelled = false;
    let cleanup = () => {};
    setStatus((current) => (current === 'ready' ? current : 'loading'));

    void (async () => {
      try {
        const { pdfjs, doc } = await loadRulebookPage(pdf);
        const page = await doc.getPage(1);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const scale = (width / base.width) * zoom;
        const viewport = page.getViewport({ scale });
        setSize({ width: viewport.width, height: viewport.height });

        const ratio = Math.min(
          window.devicePixelRatio || 1,
          Math.sqrt(MAX_CANVAS_PIXELS / (viewport.width * viewport.height)),
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.setAttribute('aria-hidden', 'true');
        const render = page.render({
          canvas,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        });
        const textContent: TextContent = await page.getTextContent();
        const textLayerDiv = document.createElement('div');
        textLayerDiv.className = 'textLayer';
        const textLayer = new pdfjs.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport,
        });
        cleanup = () => {
          render.cancel();
          textLayer.cancel();
        };
        await Promise.all([render.promise, textLayer.render()]);
        if (cancelled) return;

        const items = textContent.items.filter((item): item is TextItem => 'str' in item);
        let found = headingRuns(items, headings);
        if (found.matched.length === 0) found = headingRuns(items, fallbacks);
        textLayer.textDivs.forEach((div, index) => {
          if (found.runs.has(index)) div.classList.add('rb-mark');
        });

        const stage = stageRef.current;
        if (!stage) return;
        stage.style.setProperty('--total-scale-factor', String(scale));
        stage.replaceChildren(canvas, textLayerDiv);
        setStatus('ready');
        onHighlightRef.current({
          matched: found.matched,
          missing: headings.filter((h) => !found.matched.includes(h)),
        });

        const key = `${pdf}\n${headingKey}`;
        const first = textLayerDiv.querySelector('.rb-mark');
        if (first && scrolledFor.current !== key) {
          scrolledFor.current = key;
          first.scrollIntoView({ block: 'center', inline: 'nearest' });
        }
      } catch (error) {
        if (cancelled || (error instanceof Error && error.name === 'RenderingCancelledException'))
          return;
        console.error(error);
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
    // headingKey stands in for headings, whose array identity changes every render.
  }, [pdf, width, zoom, headingKey]);

  return (
    <div ref={frameRef} className="rb-frame">
      <div
        ref={stageRef}
        className={`rb-page${status === 'loading' ? ' is-loading' : ''}`}
        role="document"
        aria-label={label}
        aria-busy={status === 'loading'}
        style={
          size
            ? { width: size.width, height: size.height }
            : { width: '100%', aspectRatio: '1 / 1.414' }
        }
      />
      {status === 'loading' && (
        <div className="rb-overlay" aria-hidden="true">
          <span className="spinner" />
        </div>
      )}
      {status === 'error' && (
        <div className="rb-overlay error" role="alert">
          Could not load this page of the rulebook.
        </div>
      )}
    </div>
  );
}
