import { Fragment, useEffect, useId, useRef } from 'react';
import {
  citedPages,
  pageLabel,
  pagesLabel,
  resolveCitation,
  type CitedPage,
  type RulebookTarget,
} from '../lib/citations.ts';
import type { EvidenceItem } from '../server/ask-service.ts';

const OPEN_DELAY = 300;
const CLOSE_DELAY = 120;
const GAP = 8;

interface Entry {
  id: string;
  item: EvidenceItem;
  issue: boolean;
  pages: CitedPage[];
}

type OnOpen = (recordId: string, target: RulebookTarget | null) => void;

function place(anchor: HTMLElement, popover: HTMLElement): void {
  const a = anchor.getBoundingClientRect();
  const p = popover.getBoundingClientRect();
  const above = a.top - p.height - GAP;
  const top = above >= GAP ? above : Math.min(a.bottom + GAP, innerHeight - p.height - GAP);
  const left = Math.max(
    GAP,
    Math.min(a.left + a.width / 2 - p.width / 2, innerWidth - p.width - GAP),
  );
  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
}

/** One page in the viewer collects the headings of every record in the chip. */
function mergedTarget(entries: Entry[]): RulebookTarget | null {
  const first = entries[0]!;
  const pages = first.pages.map((page) => ({
    ...page,
    headings: [
      ...new Set(entries.flatMap((e) => e.pages.find((p) => p.pdf === page.pdf)?.headings ?? [])),
    ],
  }));
  const start = pages[0];
  if (!start) return null;
  const title =
    entries.length > 1 ? `${first.item.title} and ${entries.length - 1} more` : first.item.title;
  const terms = entries.map((e) => e.item.title);
  return { pdf: start.pdf, record: { id: first.item.id, title, pages, terms } };
}

/**
 * Renders a run of adjacent citations. Records that share the same pages collapse into
 * one chip, so `[a] [b] [c]` on page 98 reads as a single `p. 98`.
 */
export function CitationGroup({
  ids,
  evidence,
  onOpen,
}: {
  ids: string[];
  evidence: EvidenceItem[] | undefined;
  onOpen: OnOpen;
}) {
  const chips: Array<{ key: string; entries: Entry[] } | { key: string; unknown: string }> = [];
  for (const id of [...new Set(ids)]) {
    const resolved = resolveCitation(evidence, id);
    if (!resolved) {
      chips.push({ key: id, unknown: id });
      continue;
    }
    const pages = citedPages(resolved.item);
    const key = `${resolved.issue ? 'issue:' : ''}${pages.map((p) => p.pdf).join(',')}`;
    const entry = { id, ...resolved, pages };
    const chip = chips.find((c) => c.key === key && 'entries' in c);
    if (chip && 'entries' in chip && pages.length) chip.entries.push(entry);
    else chips.push({ key: pages.length ? key : id, entries: [entry] });
  }
  return (
    <>
      {chips.map((chip, index) => (
        <Fragment key={chip.key}>
          {index > 0 && ' '}
          {'unknown' in chip ? (
            <span
              className={`cite ${evidence ? 'unknown' : 'pending'}`}
              title={evidence ? 'This id is not in the retrieved evidence.' : 'Loading evidence…'}
            >
              {chip.unknown}
            </span>
          ) : (
            <CitationChip entries={chip.entries} onOpen={onOpen} />
          )}
        </Fragment>
      ))}
    </>
  );
}

function CitationChip({ entries, onOpen }: { entries: Entry[]; onOpen: OnOpen }) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const popoverId = useId();
  useEffect(() => () => clearTimeout(timer.current), []);

  const first = entries[0]!;
  const { pages, issue } = first;
  const label = pages.length ? pagesLabel(pages) : 'no page';
  const titles = entries.map((e) => e.item.title).join('; ');

  const show = (delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const anchor = anchorRef.current;
      const popover = popoverRef.current;
      if (!anchor || !popover || popover.matches(':popover-open')) return;
      popover.showPopover();
      place(anchor, popover);
    }, delay);
  };
  const hide = (delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const popover = popoverRef.current;
      if (popover?.matches(':popover-open')) popover.hidePopover();
    }, delay);
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={`cite${issue ? ' issue' : ''}`}
        aria-label={`${issue ? 'Issue on ' : ''}${titles}, ${pages.length ? label : 'no page reference'}. ${pages.length ? 'Open in the rulebook.' : 'Show the evidence record.'}`}
        aria-describedby={popoverId}
        onPointerEnter={(event) => event.pointerType === 'mouse' && show(OPEN_DELAY)}
        onPointerLeave={() => hide(CLOSE_DELAY)}
        onFocus={(event) => event.currentTarget.matches(':focus-visible') && show(0)}
        onBlur={() => hide(0)}
        onKeyDown={(event) => event.key === 'Escape' && hide(0)}
        onClick={() => {
          hide(0);
          onOpen(first.item.id, mergedTarget(entries));
        }}
      >
        {issue && <span className="cite-flag">Issue</span>}
        {label}
        {entries.length > 1 && <span className="cite-count">×{entries.length}</span>}
      </button>
      <span
        ref={popoverRef}
        id={popoverId}
        popover="manual"
        role="tooltip"
        className="cite-preview"
      >
        {entries.slice(0, 4).map((entry) => (
          <span key={entry.id} className="cite-preview-entry">
            <span className="cite-preview-kind">
              {entry.item.kind}
              {entry.item.scope === 'quest'
                ? ` · quest: ${entry.item.quest_title ?? entry.item.quest_id}`
                : ''}
            </span>
            <span className="cite-preview-title">{entry.item.title}</span>
            {entry.issue && (
              <span className="cite-preview-issue">Cites an open issue recorded on this rule.</span>
            )}
            {entry.pages.slice(0, 4).map((page) => (
              <span key={page.pdf} className="cite-preview-page">
                <strong>{pageLabel(page)}</strong>
                {page.headings.length > 0 && ` · ${page.headings.join(', ')}`}
              </span>
            ))}
            {entry.pages.length > 4 && (
              <span className="cite-preview-page">and {entry.pages.length - 4} more pages</span>
            )}
            <code className="cite-preview-id">{entry.id}</code>
          </span>
        ))}
        {entries.length > 4 && (
          <span className="cite-preview-page">and {entries.length - 4} more records</span>
        )}
        <span className="cite-preview-hint">
          {pages.length ? 'Click to open the rulebook page' : 'Click to show the evidence record'}
        </span>
      </span>
    </>
  );
}
