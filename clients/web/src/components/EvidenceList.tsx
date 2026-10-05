import { useState } from 'react';
import { sourceLabel } from '../../../../scripts/retrieve/citations.ts';
import {
  citedPages,
  pageLabel,
  rulingCitations,
  rulingSourceUrl,
  targetFor,
  type RulebookTarget,
} from '../lib/citations.ts';
import { textBlocks } from '../lib/record-text.ts';
import { MODES } from '../lib/retrieval-modes.ts';
import type { AskSummary, EvidenceItem } from '../server/ask-service.ts';

export function evidenceAnchor(id: string): string {
  return `ev-${id.replace(/[^a-z0-9]+/gi, '-')}`;
}

const KINDS: Record<EvidenceItem['kind'], string> = {
  rule: 'Rule',
  entity: 'Entry',
  table: 'Table',
  procedure: 'Procedure',
  state_machine: 'State machine',
  term: 'Glossary term',
  issue: 'Issue',
};

function humanize(value: string): string {
  const words = value.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** `Rule · Modifier`, `Talent`, `Glossary term`: what kind of record the reader is looking at. */
function kindLabel(item: EvidenceItem): string {
  if (item.kind === 'entity') return humanize(item.type);
  const kind = KINDS[item.kind];
  return item.type && item.type !== item.kind && item.kind !== 'term'
    ? `${kind} · ${humanize(item.type)}`
    : kind;
}

const CLAMP_CHARS = 420;
const CLAMP_LINES = 7;

function RecordText({ text }: { text: string }) {
  return textBlocks(text).map((block, i) =>
    block.kind === 'text' ? (
      <p key={i}>{block.lines.join('\n')}</p>
    ) : (
      <div key={i} className="table-scroll" tabIndex={0} role="region" aria-label="Table">
        <table>
          <thead>
            <tr>
              {block.rows[0]!.map((cell, c) => (
                <th key={c} scope="col">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.slice(1).map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  );
}

/** "Settlements › Wizards' Guild": where the record sits, outermost first, minus its own title. */
function ContextTrail({ context, title }: { context: string; title: string }) {
  const trail = context.split(' — ').filter(Boolean);
  if (trail[0]?.toLowerCase() === title.toLowerCase()) trail.shift();
  if (!trail.length) return null;
  return (
    <p className="ev-context">
      <span className="sr-only">In the rulebook under </span>
      {trail.reverse().join(' › ')}
    </p>
  );
}

function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5a.5.5 0 0 0 0 1H20v3H6.5A2.5 2.5 0 0 1 4 19.5v-15Z"
      />
    </svg>
  );
}

/** Retrieval health: shown above the results so a degraded search is never silent. */
export function RetrievalNotices({ summary }: { summary: AskSummary }) {
  const info = MODES[summary.mode];
  return (
    <>
      {summary.fallback && (
        <div className="notice" role="status">
          {info.models ?? 'The model'} failed; showing keyword results only.
          <span className="notice-detail">{summary.fallback}</span>
        </div>
      )}
      {info.filter && !summary.fallback && !summary.filter && (
        <div className="notice" role="status">
          The relevance filter did not run; showing unfiltered results.
        </div>
      )}
      {summary.filter?.fallback && (
        <div className="notice" role="status">
          Jev could not judge the records; showing unfiltered results.
          <span className="notice-detail">{summary.filter.fallback}</span>
        </div>
      )}
    </>
  );
}

export function DroppedRecords({ summary }: { summary: AskSummary }) {
  const dropped = summary.filter?.dropped ?? [];
  if (!dropped.length) return null;
  return (
    <details className="dropped">
      <summary>
        {dropped.length} more {dropped.length === 1 ? 'record was' : 'records were'} found but
        judged irrelevant
      </summary>
      <p className="muted">
        Jev filtered these out ({summary.filter!.policy}). They were not shown and are not sent to
        the AI.
      </p>
      <ul>
        {dropped.map((d) => (
          <li key={d.id}>
            <code>{d.id}</code> · {d.sources.join(' + ')}
            {d.pIrrelevant !== null && <> · irrelevant {Math.round(d.pIrrelevant * 100)}%</>}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function EvidenceList({
  summary,
  highlighted,
  cited,
  onOpenPage,
}: {
  summary: AskSummary;
  highlighted: string | null;
  cited: ReadonlySet<string>;
  onOpenPage: (target: RulebookTarget) => void;
}) {
  return (
    <ol className="evidence-list">
      {summary.evidence.map((item) => (
        <li key={item.id}>
          <EvidenceCard
            item={item}
            highlighted={highlighted === item.id}
            cited={cited.has(item.id) || item.issues.some((issue) => cited.has(issue.id))}
            onOpenPage={onOpenPage}
          />
        </li>
      ))}
    </ol>
  );
}

export function EvidenceCard({
  item,
  highlighted,
  cited,
  onOpenPage,
  context,
  expandText = false,
}: {
  item: EvidenceItem;
  highlighted: boolean;
  cited: boolean;
  onOpenPage: (target: RulebookTarget) => void;
  /** Rulebook headings above the record, nearest first, as `Heading — Parent — Chapter`. */
  context?: string;
  /** Start with long text unclamped, e.g. when the reader must judge the whole record. */
  expandText?: boolean;
}) {
  const [expanded, setExpanded] = useState(expandText);
  const pages = citedPages(item);
  const rulings = rulingCitations(item);
  const text = item.text.trim();
  const long = text.length > CLAMP_CHARS || text.split('\n').length > CLAMP_LINES;
  const titleId = `${evidenceAnchor(item.id)}-title`;
  const textId = `${evidenceAnchor(item.id)}-text`;

  return (
    <article
      id={evidenceAnchor(item.id)}
      className={`ev-card${highlighted ? ' highlighted' : ''}`}
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <header className="ev-head">
        <div className="ev-heading">
          <p className="ev-kicker">
            {kindLabel(item)}
            {item.scope === 'quest' && (
              <span className="tag quest">Quest: {item.quest_title ?? item.quest_id}</span>
            )}
            {cited && <span className="tag cited">Cited in AI answer</span>}
          </p>
          <h3 id={titleId}>{item.title}</h3>
          {context && <ContextTrail context={context} title={item.title} />}
        </div>
        {pages.length > 0 && (
          <div className="ev-pages" role="group" aria-label={`Rulebook pages for ${item.title}`}>
            {pages.map((page) => (
              <button
                key={page.pdf}
                type="button"
                className="page-chip"
                title={`Open ${pageLabel(page)} in the rulebook${page.headings.length ? `: ${page.headings.join(', ')}` : ''}`}
                aria-label={`Open ${pageLabel(page)} in the rulebook`}
                onClick={() => onOpenPage(targetFor(item, page.pdf)!)}
              >
                <BookIcon /> {pageLabel(page)}
              </button>
            ))}
          </div>
        )}
      </header>

      {text && (
        <>
          <div id={textId} className={`ev-text${long && !expanded ? ' clamped' : ''}`}>
            <RecordText text={text} />
          </div>
          {long && (
            <button
              type="button"
              className="link ev-more"
              aria-expanded={expanded}
              aria-controls={textId}
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? 'Show less' : 'Show full text'}
            </button>
          )}
        </>
      )}

      {item.issues.map((issue) => (
        <div key={issue.id} className={`callout ${issue.resolution ? 'resolved' : 'open'}`}>
          <strong>{issue.resolution ? 'Clarified' : 'Open question'}</strong>{' '}
          {issue.resolution?.summary ?? issue.summary}
        </div>
      ))}
      {item.external_dependencies.map((dep) => (
        <div key={dep.label} className="callout external">
          <strong>Refers elsewhere</strong> {dep.label} in {dep.document}, which this tool does not
          have.
        </div>
      ))}
      {rulings.length > 0 && (
        <p className="ev-rulings">
          Ruling source:{' '}
          {rulings.map((citation, i) => (
            <span key={JSON.stringify(citation)}>
              {i > 0 && ', '}
              <a href={rulingSourceUrl(citation)} target="_blank" rel="noreferrer">
                {sourceLabel(citation)}
              </a>
            </span>
          ))}
        </p>
      )}

      <details className="ev-details">
        <summary>Record details</summary>
        <dl>
          <dt>Id</dt>
          <dd>
            <code>{item.id}</code>
          </dd>
          <dt>Found by</dt>
          <dd>{item.why.join(', ')}</dd>
          <dt>Scope</dt>
          <dd>{item.scope}</dd>
          <dt>Status</dt>
          <dd>{item.review_status}</dd>
          {item.issues.map((issue) => (
            <div key={issue.id} className="ev-details-row">
              <dt>Issue</dt>
              <dd>
                <code>{issue.id}</code> ({issue.type}, {issue.status})
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </article>
  );
}
