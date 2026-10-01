import type { AskSummary, EvidenceItem } from '../server/ask-service.ts';

function pages(item: EvidenceItem): string {
  return item.citations
    .map((c) => `PDF ${c.pdf_page ?? '?'} / printed ${c.printed_page ?? 'none'}`)
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, 3)
    .join('; ');
}

export function evidenceAnchor(id: string): string {
  return `ev-${id.replace(/[^a-z0-9]+/gi, '-')}`;
}

export function EvidencePanel({
  summary,
  highlighted,
}: {
  summary: AskSummary | undefined;
  highlighted: string | null;
}) {
  if (!summary) return <p className="muted">Ask a question to see the rulebook evidence.</p>;
  return (
    <div>
      <p className="muted">
        Analyzer {summary.analyzer}
        {summary.fallback ? ` (fallback: ${summary.fallback})` : ''} · intent {summary.intent} ·{' '}
        {summary.complexity} · {summary.evidence.length} records
      </p>
      {summary.evidence.map((item) => (
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
            {item.scope === 'quest' ? `quest: ${item.quest_title ?? item.quest_id}` : item.scope} ·{' '}
            {pages(item)}
          </div>
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
      ))}
    </div>
  );
}
