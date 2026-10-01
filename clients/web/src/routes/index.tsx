import { fetchServerSentEvents, useChat, type UIMessage } from '@tanstack/ai-react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EvidencePanel, evidenceAnchor } from '../components/EvidencePanel.tsx';
import { checkAnswer, getEvidence } from '../server/functions.ts';

export const Route = createFileRoute('/')({ component: ChatPage });

function textOf(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.content : ''))
    .join('')
    .trim();
}

const CITATION = /\[([a-z_]+(?:\.[a-z0-9_]+)+)\]/g;

function useEvidence(question: string | null) {
  return useQuery({
    queryKey: ['evidence', question],
    queryFn: () => getEvidence({ data: { question: question! } }),
    enabled: Boolean(question),
    staleTime: Infinity,
  });
}

function ChatPage() {
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const { messages, sendMessage, isLoading, error, stop } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  });

  const questions = messages.filter((m) => m.role === 'user').map(textOf);
  const activeQuestion = selected ?? questions.at(-1) ?? null;
  const evidence = useEvidence(activeQuestion);

  const submit = () => {
    const question = input.trim();
    if (!question || isLoading) return;
    setSelected(null);
    setHighlighted(null);
    void sendMessage(question);
    setInput('');
  };

  const showCitation = (question: string, id: string) => {
    setSelected(question);
    setHighlighted(id);
    requestAnimationFrame(() =>
      document.getElementById(evidenceAnchor(id))?.scrollIntoView({ block: 'center' }),
    );
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
                <div key={message.id} className="message user" onClick={() => setSelected(text)}>
                  {text}
                </div>
              );
            }
            const streaming = isLoading && index === messages.length - 1;
            return (
              <AssistantMessage
                key={message.id}
                question={lastQuestion}
                text={text}
                streaming={streaming}
                onCitation={showCitation}
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
      <aside className="panel">
        <h2>Evidence</h2>
        {activeQuestion && <p className="question">{activeQuestion}</p>}
        {evidence.isLoading && <p className="muted">Retrieving...</p>}
        {evidence.error && <p className="error">{evidence.error.message}</p>}
        <EvidencePanel summary={evidence.data} highlighted={highlighted} />
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
  onCitation: (question: string, id: string) => void;
}) {
  const check = useQuery({
    queryKey: ['check', question, text],
    queryFn: () => checkAnswer({ data: { question, answer: text } }),
    enabled: !streaming && Boolean(question && text),
    staleTime: Infinity,
  });
  const linked = text.replace(CITATION, (_match, id: string) => `[${id}](#cite:${id})`);

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
              <button
                type="button"
                className="chip"
                onClick={() => onCitation(question, href.slice('#cite:'.length))}
              >
                {children}
              </button>
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
