import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

/** The three islands, in the order a session uses them: look up, build the party, run the table. */
const ISLANDS = [
  { to: '/', label: 'Rules', title: 'Search the rulebook' },
  {
    to: '/character',
    label: 'Characters',
    title: 'Build a party through the book’s creation sequence',
  },
  {
    to: '/gm',
    label: 'Game master',
    title: 'Track Threat, light, morale and Sanity at the table',
  },
] as const;

function BookIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        d="M10 5.5C8.3 4.2 6 3.8 3 4v11c3-.2 5.3.2 7 1.5m0-11c1.7-1.3 4-1.7 7-1.5v11c-3-.2-5.3.2-7 1.5m0-11v11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The app bar every island shares. Three zones, always in the same places: where you are (the
 * islands, the current one marked), what this island can do (its own tools, grouped apart from
 * the navigation), and the rulebook, which every island can open beside itself.
 */
export function AppBar({
  tools,
  toolsLabel,
  rulebookOpen,
  onRulebook,
  onHome,
}: {
  /** The island's own actions: undo, drawers, history, settings, reset. */
  tools?: ReactNode;
  toolsLabel?: string;
  rulebookOpen: boolean;
  onRulebook: () => void;
  /** Runs when the brand mark is tapped, after navigating to `/` (the search uses it to clear). */
  onHome?: () => void;
}) {
  return (
    <header className="top">
      <nav className="top-nav" aria-label="League of Dungeoneers">
        <Link to="/" className="brand" title="League of Dungeoneers rules" onClick={onHome}>
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          <span className="sr-only">League of Dungeoneers rules: start page</span>
        </Link>
        <ul className="top-tabs">
          {ISLANDS.map((island) => (
            <li key={island.to}>
              <Link
                to={island.to}
                className="top-tab"
                activeOptions={{ exact: true, includeSearch: false }}
                title={island.title}
              >
                {island.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="top-right">
        {tools && (
          <div className="top-tools" role="group" aria-label={toolsLabel}>
            {tools}
          </div>
        )}
        <button
          type="button"
          className="top-rulebook"
          aria-pressed={rulebookOpen}
          onClick={onRulebook}
          title="Rulebook (R)"
        >
          <BookIcon />
          <span className="top-rulebook-label">Rulebook</span>
        </button>
      </div>
    </header>
  );
}
