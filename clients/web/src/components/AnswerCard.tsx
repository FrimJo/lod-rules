import { fetchServerSentEvents, useChat, type UIMessage } from '@tanstack/ai-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useMemo, useRef } from 'react';
import type { Components } from 'react-markdown';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { linkCitations, type RulebookTarget } from '../lib/citations.ts';
import type { RetrievalMode } from '../lib/retrieval-modes.ts';
import type { AskSummary } from '../server/ask-service.ts';
import { checkAnswer, type AnswerSettings } from '../server/functions.ts';
import { CitationGroup } from './CitationChip.tsx';

function textOf(messages: UIMessage[]): string {
  const reply = [...messages].reverse().find((m) => m.role === 'assistant');
  if (!reply) return '';
  return reply.parts
    .map((part) => (part.type === 'text' ? part.content : ''))
    .join('')
    .trim();
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9L12 2.5Zm6.5 11 .9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z"
      />
    </svg>
  );
}

/**
 * The optional AI answer for one question. It sends nothing until the reader asks (or has
 * turned on automatic answers), and it only ever sees the evidence listed below it.
 */
export function AnswerCard({
  question,
  mode,
  summary,
  settings,
  auto,
  onCitation,
  onCited,
}: {
  question: string;
  mode: RetrievalMode;
  summary: AskSummary | undefined;
  settings: AnswerSettings;
  auto: boolean;
  onCitation: (recordId: string, target: RulebookTarget | null) => void;
  onCited: (ids: string[]) => void;
}) {
  const titleId = useId();
  const { messages, sendMessage, isLoading, error, stop, clear } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  });
  const text = textOf(messages);
  const count = summary?.evidence.length ?? 0;
  const started = messages.length > 0;
  const autoStarted = useRef(false);

  const generate = () => {
    clear();
    void sendMessage(question, { body: { mode } });
  };

  useEffect(() => {
    if (!auto || autoStarted.current || started || !summary || count === 0) return;
    autoStarted.current = true;
    void sendMessage(question, { body: { mode } });
  }, [auto, started, summary, count, question, mode, sendMessage]);

  const check = useQuery({
    queryKey: ['check', mode, question, text],
    queryFn: () => checkAnswer({ data: { question, mode, answer: text } }),
    enabled: !isLoading && Boolean(text),
    staleTime: Infinity,
  });
  useEffect(() => {
    onCited(check.data?.cited ?? []);
  }, [check.data, onCited]);

  // Stable renderers, so citation chips keep their DOM (and focus) while the answer streams.
  const openRef = useRef(onCitation);
  openRef.current = onCitation;
  const evidence = summary?.evidence;
  const components = useMemo<Components>(
    () => ({
      table: ({ children }) => (
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Table">
          <table>{children}</table>
        </div>
      ),
      a: ({ href, children }) =>
        href?.startsWith('#cite:') ? (
          <CitationGroup
            ids={href.slice('#cite:'.length).split('+')}
            evidence={evidence}
            onOpen={(id, target) => openRef.current(id, target)}
          />
        ) : (
          <a href={href}>{children}</a>
        ),
    }),
    [evidence],
  );

  if (!summary || count === 0) return null;

  if (!settings.available) {
    return (
      <p className="answer-unavailable muted">
        AI answers are off on this server. Set <code>OPENAI_ROUTER_API_KEY</code> to enable them.
      </p>
    );
  }

  if (!started) {
    return (
      <section className="answer-cta" aria-labelledby={titleId}>
        <span className="answer-icon" aria-hidden="true">
          <SparkIcon />
        </span>
        <div className="answer-cta-text">
          <h2 id={titleId}>Want it in plain words?</h2>
          <p>
            An AI model can read these {count} {count === 1 ? 'record' : 'records'} and write a
            short answer that cites its pages.
          </p>
          <p className="answer-fineprint">
            Sends your question and the records below to <code>{settings.model}</code> through
            OpenRouter.
          </p>
        </div>
        <button type="button" className="answer-button btn-primary" onClick={generate}>
          <SparkIcon /> Summarize with AI
        </button>
      </section>
    );
  }

  const streaming = isLoading;
  return (
    <section className="answer" aria-labelledby={titleId} aria-busy={streaming}>
      <header className="answer-head">
        <h2 id={titleId}>
          <span className="answer-icon" aria-hidden="true">
            <SparkIcon />
          </span>
          AI answer
        </h2>
        <div className="answer-actions">
          {streaming ? (
            <button type="button" className="icon-button" onClick={stop}>
              Stop
            </button>
          ) : (
            <button type="button" className="icon-button" onClick={generate}>
              Regenerate
            </button>
          )}
        </div>
      </header>
      {error ? (
        <p className="error" role="alert">
          The AI answer failed: {error.message}
        </p>
      ) : !text ? (
        <p className="answer-pending muted" role="status">
          <span className="dots" aria-hidden="true" /> Reading {count}{' '}
          {count === 1 ? 'record' : 'records'}…
        </p>
      ) : (
        <div className="answer-body">
          <Markdown remarkPlugins={[remarkGfm]} components={components}>
            {linkCitations(text)}
          </Markdown>
        </div>
      )}
      <footer className="answer-foot">
        {check.data && (
          <span className={`grounding ${check.data.grounded ? 'ok' : 'bad'}`}>
            {check.data.grounded ? '✓ Every citation is in the evidence' : '⚠ Not fully grounded'}
            {check.data.unknown.length > 0 && ` · unknown: ${check.data.unknown.join(', ')}`}
          </span>
        )}
        <span className="muted">
          Written by <code>{settings.model}</code> from the records below. AI can be wrong; check
          the cited pages.
        </span>
      </footer>
    </section>
  );
}
