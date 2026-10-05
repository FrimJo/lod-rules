import {
  citedPages,
  pageLabel,
  targetFor,
  rulingCitations,
  rulingSourceUrl,
  type RulebookTarget,
} from '../lib/citations.ts';
import { sourceLabel } from '../../../../scripts/retrieve/citations.ts';
import { MODES } from '../lib/retrieval-modes.ts';
import type { AskSummary } from '../server/ask-service.ts';

export function evidenceAnchor(id: string): string {
  return `ev-${id.replace(/[^a-z0-9]+/gi, '-')}`;
}

export function EvidencePanel({
  summary,
  highlighted,
  onOpenPage,
}: {
  summary: AskSummary | undefined;
  highlighted: string | null;
  onOpenPage: (target: RulebookTarget) => void;
}) {
  if (!summary) return <p className="muted">Ask a question to see the rulebook evidence.</p>;
  const info = MODES[summary.mode];
  return (
    <div>
      <p className="muted">
        <strong className="mode-label">{info.label}</strong>
        {!summary.fallback && summary.analyzer !== 'lexical' && (
          <code className="model-id">{summary.analyzer}</code>
        )}{' '}
        · intent {summary.intent} · {summary.complexity} · {summary.evidence.length} records
      </p>
      {summary.fallback && (
        <div className="notice" role="status">
          {info.models ?? 'The model'} failed; lexical results only.
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
      {summary.filter && summary.filter.dropped.length > 0 && (
        <details className="meta">
          <summary>
            Jev dropped {summary.filter.dropped.length} record
            {summary.filter.dropped.length === 1 ? '' : 's'} as irrelevant ({summary.filter.policy})
          </summary>
          <ul>
            {summary.filter.dropped.map((d) => (
              <li key={d.id}>
                <code>{d.id}</code> · {d.sources.join(' + ')}
                {d.pIrrelevant !== null && <> · irrelevant {Math.round(d.pIrrelevant * 100)}%</>}
              </li>
            ))}
          </ul>
        </details>
      )}
      {summary.evidence.map((item) => {
        const pages = citedPages(item);
        return (
          <article
            key={item.id}
            id={evidenceAnchor(item.id)}
            className={`evidence${highlighted === item.id ? ' highlighted' : ''}`}
          >
            <header>
              <code>{item.id}</code>
              <strong>{item.title}</strong>
            </header>
            <div className="meta">
              {item.kind} ·{' '}
              {item.scope === 'quest' ? `quest: ${item.quest_title ?? item.quest_id}` : item.scope}
            </div>
            {pages.length > 0 && (
              <div
                className="evidence-pages"
                role="group"
                aria-label={`Rulebook pages for ${item.title}`}
              >
                {pages.map((page) => {
                  const target = targetFor(item, page.pdf)!;
                  return (
                    <button
                      key={page.pdf}
                      type="button"
                      className="page-chip"
                      title={`Open ${pageLabel(page)} (PDF ${page.pdf})${page.headings.length ? `: ${page.headings.join(', ')}` : ''}`}
                      onClick={() => onOpenPage(target)}
                    >
                      {pageLabel(page)}
                    </button>
                  );
                })}
              </div>
            )}
            {rulingCitations(item).map((citation) => (
              <div key={JSON.stringify(citation)} className="meta">
                <a href={rulingSourceUrl(citation)} target="_blank" rel="noreferrer">
                  {sourceLabel(citation)}
                </a>
              </div>
            ))}
            <div className="meta">selected by: {item.why.join(', ')}</div>
            {item.issues.map((issue) => (
              <div key={issue.id} className="issue">
                {issue.resolution ? 'Resolved issue' : 'Issue'} {issue.id} ({issue.type},{' '}
                {issue.status}): {issue.resolution?.summary ?? issue.summary}
              </div>
            ))}
            {item.external_dependencies.map((dep) => (
              <div key={dep.label} className="issue">
                External: {dep.label} in {dep.document}, not available
              </div>
            ))}
            <details>
              <summary>Record text</summary>
              <pre>{item.text}</pre>
            </details>
          </article>
        );
      })}
    </div>
  );
}
