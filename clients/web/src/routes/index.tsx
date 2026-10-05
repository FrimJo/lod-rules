import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AnswerCard } from '../components/AnswerCard.tsx';
import {
  DroppedRecords,
  EvidenceList,
  RetrievalNotices,
  evidenceAnchor,
} from '../components/EvidenceList.tsx';
import { RulebookViewer } from '../components/RulebookViewer.tsx';
import { SettingsDialog } from '../components/SettingsDialog.tsx';
import type { RulebookTarget } from '../lib/citations.ts';
import { MODES, type RetrievalMode } from '../lib/retrieval-modes.ts';
import { useAnswerPreference } from '../lib/use-answer-preference.ts';
import { useRetrievalMode } from '../lib/use-retrieval-mode.ts';
import { getEvidence, getRulebook, type AnswerSettings } from '../server/functions.ts';

export const Route = createFileRoute('/')({ component: RulesPage });

interface Search {
  id: number;
  question: string;
  mode: RetrievalMode;
}

const HISTORY_LIMIT = 12;
const EXAMPLES = [
  'How does resting work?',
  'What happens when a wizard miscasts a spell?',
  'How do I check line of sight, and what blocks it?',
  'How many hit points does Molgor have?',
];

function useEvidence(search: Search) {
  return useQuery({
    queryKey: ['evidence', search.mode, search.question],
    queryFn: () => getEvidence({ data: { question: search.question, mode: search.mode } }),
    staleTime: Infinity,
  });
}

function useRulebookIndex() {
  return useQuery({ queryKey: ['rulebook'], queryFn: () => getRulebook(), staleTime: Infinity });
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(
    el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)),
  );
}

const narrow = () => window.matchMedia('(max-width: 900px)').matches;

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.05.24.25.42.5.42h3.84c.25 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
      />
    </svg>
  );
}

function RulesPage() {
  const [query, setQuery] = useState('');
  const [searches, setSearches] = useState<Search[]>([]);
  /** The search on screen; null shows the start page. */
  const [activeId, setActiveId] = useState<number | null>(null);
  const [target, setTarget] = useState<RulebookTarget | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  /** Where focus goes back to when the rulebook pane closes. */
  const opener = useRef<HTMLElement | null>(null);
  const retrieval = useRetrievalMode();
  const answer = useAnswerPreference();
  const rulebook = useRulebookIndex();

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== '/' || isTyping(event.target) || event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const show = (id: number | null) => {
    setActiveId(id);
    setHighlighted(null);
    resultsRef.current?.scrollTo({ top: 0 });
    const search = searches.find((s) => s.id === id);
    if (search) setQuery(search.question);
  };

  const submit = (text = query) => {
    const question = text.trim();
    if (!question || !retrieval.ready) return;
    const mode = retrieval.mode;
    setQuery(question);
    setHighlighted(null);
    resultsRef.current?.scrollTo({ top: 0 });
    const existing = searches.find((s) => s.question === question && s.mode === mode);
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    const id = nextId.current++;
    setSearches((list) => [...list, { id, question, mode }].slice(-HISTORY_LIMIT));
    setActiveId(id);
  };

  const closeViewer = () => {
    setTarget(null);
    // The opener may have re-rendered away (a chip in a streaming answer); fall back to its card.
    const back = opener.current?.isConnected
      ? opener.current
      : highlighted
        ? document.getElementById(evidenceAnchor(highlighted))
        : inputRef.current;
    back?.focus({ preventScroll: true });
    opener.current = null;
  };

  const openPage = (next: RulebookTarget) => {
    if (!target) opener.current = document.activeElement as HTMLElement | null;
    if (next.record) setHighlighted(next.record.id);
    setTarget(next);
  };

  const showRecord = (id: string) => {
    setHighlighted(id);
    if (narrow()) setTarget(null);
    requestAnimationFrame(() => {
      const card = document.getElementById(evidenceAnchor(id));
      card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      card?.focus({ preventScroll: true });
    });
  };

  const openCitation = (recordId: string, next: RulebookTarget | null) =>
    next ? openPage(next) : showRecord(recordId);

  const openContents = () => {
    const contents = rulebook.data?.pages.find((p) => p.trail.at(-1) === 'Contents');
    openPage({ pdf: contents?.pdf ?? 1 });
  };

  const searchForm = (
    <SearchForm
      inputRef={inputRef}
      value={query}
      onChange={setQuery}
      onSubmit={() => submit()}
      ready={retrieval.ready}
      modeLabel={MODES[retrieval.mode].label}
      onOpenSettings={() => setSettingsOpen(true)}
      answer={answer.settings}
      auto={answer.auto}
      onAutoChange={answer.setAuto}
    />
  );

  return (
    <div className={`app${target ? ' with-viewer' : ''}`}>
      <a className="skip-link" href="#results">
        Skip to results
      </a>
      <header className="topbar">
        <button type="button" className="brand" onClick={() => show(null)}>
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          <span>League of Dungeoneers rules</span>
        </button>
        <div className="topbar-actions">
          {searches.length > 0 && (
            <>
              <button
                type="button"
                className="icon-button"
                popoverTarget="history-menu"
                aria-haspopup="true"
              >
                History <span className="count">{searches.length}</span>
              </button>
              <div ref={historyRef} id="history-menu" popover="auto" className="history-menu">
                <p className="history-title">Recent questions</p>
                <ul>
                  {[...searches].reverse().map((search) => (
                    <li key={search.id}>
                      <button
                        type="button"
                        aria-current={search.id === activeId ? 'true' : undefined}
                        onClick={() => {
                          show(search.id);
                          historyRef.current?.hidePopover();
                        }}
                      >
                        <span className="history-question">{search.question}</span>
                        <span className="history-mode">{MODES[search.mode].label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          <button
            type="button"
            className="icon-button"
            aria-pressed={Boolean(target)}
            onClick={() => (target ? closeViewer() : openContents())}
          >
            Rulebook
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Search settings"
            aria-haspopup="dialog"
            title="Search settings"
            onClick={() => setSettingsOpen(true)}
          >
            <GearIcon />
          </button>
        </div>
      </header>

      <main className="results" id="results" ref={resultsRef} tabIndex={-1}>
        {activeId === null ? (
          <section className="home" aria-labelledby="home-title">
            <h1 id="home-title">What does the rulebook say?</h1>
            <p className="home-lede">
              Search the second printing of the League of Dungeoneers rulebook. Every result is the
              book's own wording, with the page it comes from.
            </p>
            {searchForm}
            <div className="examples">
              <p className="muted">Try one of these</p>
              <ul>
                {EXAMPLES.map((example) => (
                  <li key={example}>
                    <button
                      type="button"
                      className="example"
                      disabled={!retrieval.ready}
                      onClick={() => submit(example)}
                    >
                      {example}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : (
          <div className="search-bar">{searchForm}</div>
        )}
        {searches.map((search) => (
          <ResultView
            key={search.id}
            search={search}
            hidden={search.id !== activeId}
            answer={answer.settings}
            auto={answer.auto}
            highlighted={highlighted}
            onOpenPage={openPage}
            onCitation={openCitation}
          />
        ))}
      </main>

      {target && (
        <aside
          className="viewer-pane"
          aria-label="Rulebook"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              closeViewer();
            }
          }}
        >
          <div className="pane-bar">
            <span className="pane-title">Rulebook</span>
            <button
              type="button"
              className="icon-button"
              onClick={closeViewer}
              aria-label="Close the rulebook"
              title="Close (Esc)"
            >
              <span aria-hidden="true">×</span> Close
            </button>
          </div>
          <RulebookViewer target={target} index={rulebook.data} onShowRecord={showRecord} />
        </aside>
      )}

      <SettingsDialog
        open={settingsOpen}
        mode={retrieval.mode}
        settings={retrieval.settings}
        isDefault={retrieval.isDefault}
        onChange={retrieval.setMode}
        onReset={retrieval.reset}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

function SearchForm({
  inputRef,
  value,
  onChange,
  onSubmit,
  ready,
  modeLabel,
  onOpenSettings,
  answer,
  auto,
  onAutoChange,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  ready: boolean;
  modeLabel: string;
  onOpenSettings: () => void;
  answer: AnswerSettings;
  auto: boolean;
  onAutoChange: (on: boolean) => void;
}) {
  return (
    <form
      className="search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="search-field">
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask a rules question, e.g. How does resting work?"
          aria-label="Rules question"
          aria-keyshortcuts="/"
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="submit" disabled={!value.trim() || !ready}>
          Search
        </button>
      </div>
      <div className="search-options">
        <button
          type="button"
          className="mode-chip"
          aria-haspopup="dialog"
          aria-label={`Retrieval: ${modeLabel}. Change`}
          onClick={onOpenSettings}
        >
          <span className="mode-chip-key">Retrieval</span> {modeLabel}
        </button>
        {answer.available && (
          <label
            className="switch"
            title={`Send the evidence to ${answer.model} as soon as it is found`}
          >
            <input
              type="checkbox"
              role="switch"
              checked={auto}
              onChange={(event) => onAutoChange(event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true" />
            Summarize with AI automatically
          </label>
        )}
      </div>
    </form>
  );
}

function ResultView({
  search,
  hidden,
  answer,
  auto,
  highlighted,
  onOpenPage,
  onCitation,
}: {
  search: Search;
  hidden: boolean;
  answer: AnswerSettings;
  auto: boolean;
  highlighted: string | null;
  onOpenPage: (target: RulebookTarget) => void;
  onCitation: (recordId: string, target: RulebookTarget | null) => void;
}) {
  const evidence = useEvidence(search);
  const [cited, setCited] = useState<ReadonlySet<string>>(() => new Set());
  const onCited = useCallback((ids: string[]) => setCited(new Set(ids)), []);
  const titleId = `result-${search.id}`;
  const summary = evidence.data;
  const count = summary?.evidence.length ?? 0;

  let body: ReactNode;
  if (evidence.isPending) {
    body = (
      <div className="skeletons" aria-hidden="true">
        {[0, 1, 2].map((n) => (
          <div key={n} className="skeleton" />
        ))}
      </div>
    );
  } else if (evidence.error) {
    body = (
      <p className="error" role="alert">
        The search failed: {evidence.error.message}
      </p>
    );
  } else if (summary) {
    body = (
      <>
        <RetrievalNotices summary={summary} />
        {count === 0 ? (
          <div className="empty">
            <h2>Nothing in the rulebook matched</h2>
            <p className="muted">
              Try the book's own terms (for example “battle” rather than “combat”), name the
              thing you are asking about, or switch retrieval mode.
            </p>
          </div>
        ) : (
          <>
            <AnswerCard
              question={search.question}
              mode={search.mode}
              summary={summary}
              settings={answer}
              auto={auto}
              onCitation={onCitation}
              onCited={onCited}
            />
            <h2 className="section-label">From the rulebook</h2>
            <EvidenceList
              summary={summary}
              highlighted={highlighted}
              cited={cited}
              onOpenPage={onOpenPage}
            />
          </>
        )}
        <DroppedRecords summary={summary} />
      </>
    );
  }

  return (
    <section className="result" aria-labelledby={titleId} hidden={hidden}>
      <header className="result-head">
        <h1 id={titleId}>{search.question}</h1>
        <p className="result-meta" role="status">
          {evidence.isPending
            ? `Searching the rulebook with ${MODES[search.mode].label}…`
            : summary &&
              `${count} ${count === 1 ? 'record' : 'records'} · ${MODES[search.mode].label}`}
        </p>
      </header>
      {body}
    </section>
  );
}
