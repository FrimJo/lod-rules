import { Link, useLocation } from '@tanstack/react-router';

export function NotFound() {
  const { pathname } = useLocation();
  return (
    <main className="not-found" aria-labelledby="not-found-title">
      <p className="not-found-code" aria-hidden="true">
        404
      </p>
      <h1 id="not-found-title">This page is not in the rulebook</h1>
      <p className="muted">
        Nothing lives at <code className="chip">{pathname}</code>. The link may be outdated or
        mistyped.
      </p>
      <div className="not-found-actions">
        <Link to="/" className="button">
          Ask a rules question
        </Link>
        <button type="button" className="button secondary" onClick={() => window.history.back()}>
          Go back
        </button>
      </div>
    </main>
  );
}
