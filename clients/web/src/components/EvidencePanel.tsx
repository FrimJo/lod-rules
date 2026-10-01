import { citedPages, pageLabel, targetFor, type RulebookTarget } from '../lib/citations.ts';
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
  return (
    <div>
      <p className="muted">
        Analyzer {summary.analyzer}
        {summary.fallback ? ` (fallback: ${summary.fallback})` : ''} · intent {summary.intent} ·{' '}
        {summary.complexity} · {summary.evidence.length} records
      </p>
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
              <div className="evidence-pages" role="group" aria-label={`Rulebook pages for ${item.title}`}>
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
            <div className="meta">selected by: {item.why.join(', ')}</div>
            {item.issues.map((issue) => (
              <div key={issue.id} className="issue">
                Issue {issue.id} ({issue.type}, {issue.status}): {issue.summary}
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
