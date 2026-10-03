import { fetchServerSentEvents, useChat, type UIMessage } from '@tanstack/ai-react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState, type KeyboardEvent } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationGroup } from '../components/CitationChip.tsx';
import { EvidencePanel, evidenceAnchor } from '../components/EvidencePanel.tsx';
import { RulebookViewer } from '../components/RulebookViewer.tsx';
import { SettingsDialog } from '../components/SettingsDialog.tsx';
import { linkCitations, type RulebookTarget } from '../lib/citations.ts';
import { MODES, type RetrievalMode } from '../lib/retrieval-modes.ts';
import { useRetrievalMode } from '../lib/use-retrieval-mode.ts';
import { checkAnswer, getEvidence, getRulebook } from '../server/functions.ts';

export const Route = createFileRoute('/')({ component: ChatPage });

type Tab = 'evidence' | 'rulebook';
const TABS: Tab[] = ['evidence', 'rulebook'];

interface Asked {
  question: string;
  mode: RetrievalMode;
}

function textOf(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.content : ''))
    .join('')
    .trim();
}

function useEvidence(asked: Asked | null) {
  return useQuery({
    queryKey: ['evidence', asked?.mode, asked?.question],
    queryFn: () => getEvidence({ data: asked! }),
    enabled: Boolean(asked?.question),
    staleTime: Infinity,
  });
}

function useRulebookIndex() {
  return useQuery({ queryKey: ['rulebook'], queryFn: () => getRulebook(), staleTime: Infinity });
}

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

function ChatPage() {
  const [input, setInput] = useState('');
  /** Index of the user message whose evidence is shown; null follows the latest question. */
  const [selected, setSelected] = useState<number | null>(null);
  const [askedModes, setAskedModes] = useState<RetrievalMode[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('evidence');
  const [target, setTarget] = useState<RulebookTarget | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const { messages, sendMessage, isLoading, error, stop } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  });
  const rulebook = useRulebookIndex();
  const retrieval = useRetrievalMode();

  const asked: Asked[] = messages
    .filter((m) => m.role === 'user')
    .map((m, i) => ({ question: textOf(m), mode: askedModes[i] ?? retrieval.mode }));
  const activeIndex = selected ?? (asked.length ? asked.length - 1 : null);
  const active = activeIndex === null ? null : (asked[activeIndex] ?? null);
  const evidence = useEvidence(active);

  const submit = () => {
    const question = input.trim();
    if (!question || isLoading || !retrieval.ready) return;
    const mode = retrieval.mode;
    setSelected(null);
    setHighlighted(null);
    setTab('evidence');
    setAskedModes((modes) => [...modes.slice(0, asked.length), mode]);
    void sendMessage(question, { body: { mode } });
    setInput('');
  };

  /** On the stacked mobile layout the panel sits below the chat, out of view. */
  const revealPanel = () => {
    if (window.matchMedia('(max-width: 900px)').matches)
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showRecord = (id: string) => {
    setHighlighted(id);
    setTab('evidence');
    revealPanel();
    requestAnimationFrame(() =>
      document.getElementById(evidenceAnchor(id))?.scrollIntoView({ block: 'center' }),
    );
  };

  const openPage = (next: RulebookTarget) => {
    if (next.record) setHighlighted(next.record.id);
    setTarget(next);
    setTab('rulebook');
    revealPanel();
  };

  const openCitation = (questionIndex: number, recordId: string, next: RulebookTarget | null) => {
    setSelected(questionIndex);
    if (next) openPage(next);
    else showRecord(recordId);
  };

  const selectTab = (next: Tab) => {
    if (next === 'rulebook' && !target) {
      const contents = rulebook.data?.pages.find((p) => p.trail.at(-1) === 'Contents');
      setTarget({ pdf: contents?.pdf ?? 1 });
    }
    setTab(next);
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = TABS[(TABS.indexOf(tab) + step + TABS.length) % TABS.length]!;
    selectTab(next);
    tabRefs.current[next]?.focus();
  };

  const modeLabel = MODES[retrieval.mode].label;
  let userIndex = -1;
  return (
    <main className="layout">
      <section className="chat">
        <header className="chat-header">
          <h1>League of Dungeoneers rules</h1>
          <button
            type="button"
            className="icon-button"
            aria-label="Retrieval settings"
            aria-haspopup="dialog"
            title="Retrieval settings"
            onClick={() => setSettingsOpen(true)}
          >
            <GearIcon />
          </button>
        </header>
        <div className="messages">
          {messages.map((message, index) => {
            const text = textOf(message);
            if (message.role === 'user') {
              userIndex += 1;
              const i = userIndex;
              const isActive = i === activeIndex;
              return (
                <button
                  key={message.id}
                  type="button"
                  className={`message user${isActive ? ' active' : ''}`}
                  aria-pressed={isActive}
                  title="Show the evidence for this question"
                  onClick={() => {
                    setSelected(i);
                    setTab('evidence');
                  }}
                >
                  {text}
                </button>
              );
            }
            const streaming = isLoading && index === messages.length - 1;
            const i = userIndex;
            return (
              <AssistantMessage
                key={message.id}
                asked={asked[i] ?? null}
                text={text}
                streaming={streaming}
                onCitation={(recordId, next) => openCitation(i, recordId, next)}
              />
            );
          })}
          {isLoading && messages.at(-1)?.role === 'user' && (
            <div className="message assistant muted">Looking up the rules...</div>
          )}
        </div>
        {error && <div className="error">Error: {error.message}</div>}
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="composer-field">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask a rules question, e.g. How does resting work?"
              aria-label="Rules question"
              rows={2}
            />
            <button
              type="button"
              className="mode-chip"
              aria-haspopup="dialog"
              aria-label={`Retrieval mode: ${modeLabel}. Change`}
              onClick={() => setSettingsOpen(true)}
            >
              <span className="mode-chip-key">Retrieval</span> {modeLabel}
            </button>
          </div>
          {isLoading ? (
            <button type="button" onClick={stop}>
              Stop
            </button>
          ) : (
            <button type="submit" disabled={!input.trim() || !retrieval.ready}>
              Ask
            </button>
          )}
        </form>
      </section>
      <aside className="panel" ref={panelRef}>
        <div className="tabs" role="tablist" aria-label="Sources" onKeyDown={onTabKeyDown}>
          {TABS.map((name) => (
            <button
              key={name}
              ref={(el) => {
                tabRefs.current[name] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${name}`}
              aria-controls={`panel-${name}`}
              aria-selected={tab === name}
              tabIndex={tab === name ? 0 : -1}
              className="tab"
              onClick={() => selectTab(name)}
            >
              {name === 'evidence' ? 'Evidence' : 'Rulebook'}
              {name === 'evidence' && evidence.data && (
                <span className="count">{evidence.data.evidence.length}</span>
              )}
            </button>
          ))}
        </div>
        <div
          id="panel-evidence"
          role="tabpanel"
          aria-labelledby="tab-evidence"
          className="tab-panel scroll"
          hidden={tab !== 'evidence'}
        >
          {active && <p className="question">{active.question}</p>}
          {evidence.isLoading && active && (
            <p className="muted">Retrieving with {MODES[active.mode].label}...</p>
          )}
          {evidence.error && <p className="error">{evidence.error.message}</p>}
          <EvidencePanel summary={evidence.data} highlighted={highlighted} onOpenPage={openPage} />
        </div>
        <div
          id="panel-rulebook"
          role="tabpanel"
          aria-labelledby="tab-rulebook"
          className="tab-panel"
          hidden={tab !== 'rulebook'}
        >
          {target ? (
            <RulebookViewer target={target} index={rulebook.data} onShowRecord={showRecord} />
          ) : (
            <p className="muted">Pick a page reference in an answer to open the rulebook.</p>
          )}
        </div>
      </aside>
      <SettingsDialog
        open={settingsOpen}
        mode={retrieval.mode}
        settings={retrieval.settings}
        isDefault={retrieval.isDefault}
        onChange={retrieval.setMode}
        onReset={retrieval.reset}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
  );
}

function AssistantMessage({
  asked,
  text,
  streaming,
  onCitation,
}: {
  asked: Asked | null;
  text: string;
  streaming: boolean;
  onCitation: (id: string, target: RulebookTarget | null) => void;
}) {
  const evidence = useEvidence(asked);
  const check = useQuery({
    queryKey: ['check', asked?.mode, asked?.question, text],
    queryFn: () => checkAnswer({ data: { ...asked!, answer: text } }),
    enabled: !streaming && Boolean(asked?.question && text),
    staleTime: Infinity,
  });
  const linked = linkCitations(text);

  return (
    <div className="message assistant">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="table-scroll" tabIndex={0} role="region" aria-label="Table">
              <table>{children}</table>
            </div>
          ),
          a: ({ href, children }) =>
            href?.startsWith('#cite:') ? (
              <CitationGroup
                ids={href.slice('#cite:'.length).split('+')}
                evidence={evidence.data?.evidence}
                onOpen={onCitation}
              />
            ) : (
              <a href={href}>{children}</a>
            ),
        }}
      >
        {linked}
      </Markdown>
      {check.data && asked && (
        <div className={`badge ${check.data.grounded ? 'ok' : 'bad'}`}>
          <span className="badge-mode">{MODES[asked.mode].label}</span> ·{' '}
          {check.data.grounded ? 'Grounded' : 'NOT grounded'} · {check.data.cited.length} cited
          {check.data.unknown.length ? ` · not in evidence: ${check.data.unknown.join(', ')}` : ''}
        </div>
      )}
    </div>
  );
}
