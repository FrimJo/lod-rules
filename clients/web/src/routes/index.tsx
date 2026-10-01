import { fetchServerSentEvents, useChat, type UIMessage } from '@tanstack/ai-react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState, type KeyboardEvent } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationGroup } from '../components/CitationChip.tsx';
import { EvidencePanel, evidenceAnchor } from '../components/EvidencePanel.tsx';
import { RulebookViewer } from '../components/RulebookViewer.tsx';
import { linkCitations, type RulebookTarget } from '../lib/citations.ts';
import { checkAnswer, getEvidence, getRulebook } from '../server/functions.ts';

export const Route = createFileRoute('/')({ component: ChatPage });

type Tab = 'evidence' | 'rulebook';
const TABS: Tab[] = ['evidence', 'rulebook'];

function textOf(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.content : ''))
    .join('')
    .trim();
}

function useEvidence(question: string | null) {
  return useQuery({
    queryKey: ['evidence', question],
    queryFn: () => getEvidence({ data: { question: question! } }),
    enabled: Boolean(question),
    staleTime: Infinity,
  });
}

function useRulebookIndex() {
  return useQuery({ queryKey: ['rulebook'], queryFn: () => getRulebook(), staleTime: Infinity });
}

function ChatPage() {
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('evidence');
  const [target, setTarget] = useState<RulebookTarget | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const { messages, sendMessage, isLoading, error, stop } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  });
  const rulebook = useRulebookIndex();

  const questions = messages.filter((m) => m.role === 'user').map(textOf);
  const activeQuestion = selected ?? questions.at(-1) ?? null;
  const evidence = useEvidence(activeQuestion);

  const submit = () => {
    const question = input.trim();
    if (!question || isLoading) return;
    setSelected(null);
    setHighlighted(null);
    setTab('evidence');
    void sendMessage(question);
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

  const openCitation = (question: string, recordId: string, next: RulebookTarget | null) => {
    setSelected(question);
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

  let lastQuestion = '';
  return (
    <main className="layout">
      <section className="chat">
        <h1>League of Dungeoneers rules</h1>
        <div className="messages">
          {messages.map((message, index) => {
            const text = textOf(message);
            if (message.role === 'user') {
              lastQuestion = text;
              return (
                <button
                  key={message.id}
                  type="button"
                  className={`message user${text === activeQuestion ? ' active' : ''}`}
                  aria-pressed={text === activeQuestion}
                  title="Show the evidence for this question"
                  onClick={() => {
                    setSelected(text);
                    setTab('evidence');
                  }}
                >
                  {text}
                </button>
              );
            }
            const streaming = isLoading && index === messages.length - 1;
            return (
              <AssistantMessage
                key={message.id}
                question={lastQuestion}
                text={text}
                streaming={streaming}
                onCitation={openCitation}
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
          {isLoading ? (
            <button type="button" onClick={stop}>
              Stop
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()}>
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
          {activeQuestion && <p className="question">{activeQuestion}</p>}
          {evidence.isLoading && <p className="muted">Retrieving...</p>}
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
    </main>
  );
}

function AssistantMessage({
  question,
  text,
  streaming,
  onCitation,
}: {
  question: string;
  text: string;
  streaming: boolean;
  onCitation: (question: string, id: string, target: RulebookTarget | null) => void;
}) {
  const evidence = useEvidence(question || null);
  const check = useQuery({
    queryKey: ['check', question, text],
    queryFn: () => checkAnswer({ data: { question, answer: text } }),
    enabled: !streaming && Boolean(question && text),
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
                onOpen={(recordId, target) => onCitation(question, recordId, target)}
              />
            ) : (
              <a href={href}>{children}</a>
            ),
        }}
      >
        {linked}
      </Markdown>
      {check.data && (
        <div className={`badge ${check.data.grounded ? 'ok' : 'bad'}`}>
          {check.data.grounded ? 'Grounded' : 'NOT grounded'} · {check.data.cited.length} cited
          {check.data.unknown.length ? ` · not in evidence: ${check.data.unknown.join(', ')}` : ''}
        </div>
      )}
    </div>
  );
}
