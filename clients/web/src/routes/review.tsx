import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState, type RefObject } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import reviewStyles from '../review.css?url';
import { EvidenceCard } from '../components/EvidenceList.tsx';
import { RulebookViewer } from '../components/RulebookViewer.tsx';
import type { RulebookTarget } from '../lib/citations.ts';
import { describeRetrieval } from '../lib/retrieval-steps.ts';
import type {
  GradedCaseDetail,
  GradedCaseRow,
  QualityMode,
  QueueBucket,
  ReviewedRelevance,
} from '../server/grading.ts';
import {
  getGradedCase,
  getGradedCases,
  getReviewQueue,
  getRulebook,
  saveQueueLabel,
  saveReview,
  undoQueueLabel,
} from '../server/functions.ts';

interface ReviewSearch {
  case?: string;
  view?: 'records';
}

export const Route = createFileRoute('/review')({
  head: () => ({
    meta: [{ title: 'Grading review · League of Dungeoneers' }],
    links: [{ rel: 'stylesheet', href: reviewStyles }],
  }),
  validateSearch: (search: Record<string, unknown>): ReviewSearch => ({
    ...(typeof search.case === 'string' ? { case: search.case } : {}),
    ...(search.view === 'records' ? { view: 'records' as const } : {}),
  }),
  component: ReviewPage,
});

const MODE_LABELS: Record<QualityMode, string> = {
  lexical: 'Lexical',
  jev_alone: 'Jev alone',
  union: 'Union',
  filtered: 'Filtered',
};
const RELEVANCE: ReviewedRelevance[] = ['direct', 'supporting', 'irrelevant'];
const STATUS_LABEL = { unreviewed: '○', partial: '◐', reviewed: '●', stale: '!' } as const;
const percent = (value: number | null) => (value === null ? '–' : `${Math.round(value * 100)}%`);

function ReviewPage() {
  const search = Route.useSearch();
  return search.view === 'records' ? <RecordQueuePage /> : <CasesPage selectedCase={search.case} />;
}

function ReviewHeader({ view }: { view: 'cases' | 'records' }) {
  return (
    <>
      <header className="review-list-head">
        <h1>Grading review</h1>
        <Link to="/" className="link">
          Back to questions
        </Link>
      </header>
      <nav className="review-views" aria-label="Review views">
        <Link
          to="/review"
          search={{}}
          className={view === 'cases' ? 'active' : undefined}
          aria-current={view === 'cases' ? 'page' : undefined}
        >
          Questions
        </Link>
        <Link
          to="/review"
          search={{ view: 'records' }}
          className={view === 'records' ? 'active' : undefined}
          aria-current={view === 'records' ? 'page' : undefined}
        >
          Record queue
        </Link>
      </nav>
    </>
  );
}

function CasesPage({ selectedCase }: { selectedCase: string | undefined }) {
  const list = useQuery({
    queryKey: ['graded-cases'],
    queryFn: () => getGradedCases(),
  });
  const rows = list.data?.rows ?? [];
  const selected = selectedCase ?? rows[0]?.id;

  return (
    <div className="review-layout">
      <aside className="review-list">
        <ReviewHeader view="cases" />
        {list.data && <ReviewSummary summary={list.data.summary} />}
        {list.isPending && <p className="muted">Loading graded cases…</p>}
        {list.error && <p className="error">{list.error.message}</p>}
        {list.data && rows.length === 0 && (
          <p className="muted">
            No graded cases. Run{' '}
            <code>node --import tsx clients/web/src/evaluation/run-quality.ts</code>.
          </p>
        )}
        <ol className="review-cases">
          {rows.map((row) => (
            <CaseRow key={row.id} row={row} active={row.id === selected} />
          ))}
        </ol>
      </aside>
      <main className="review-main">
        {selected ? <CaseView id={selected} rows={rows} /> : <p className="muted">Pick a case.</p>}
      </main>
    </div>
  );
}

type Summary = NonNullable<Awaited<ReturnType<typeof getGradedCases>>>['summary'];

function ReviewSummary({ summary }: { summary: Summary }) {
  return (
    <div className="review-summary">
      <p>
        {summary.statuses.reviewed} of {summary.cases} reviewed
        {summary.statuses.partial ? `, ${summary.statuses.partial} partial` : ''}
        {summary.statuses.stale ? `, ${summary.statuses.stale} stale` : ''}
      </p>
      {summary.relevance.stale > 0 && (
        <p>
          {summary.relevance.stale} record label{summary.relevance.stale === 1 ? '' : 's'} need
          relabelling: the record text changed.
        </p>
      )}
      <p>
        Judge agrees on {percent(summary.answers.agreement)} of {summary.answers.reviewed} answers
        and {percent(summary.relevance.exactAgreement)} of {summary.relevance.labelled} record
        labels.
      </p>
    </div>
  );
}

function CaseRow({ row, active }: { row: GradedCaseRow; active: boolean }) {
  return (
    <li>
      <Link
        to="/review"
        search={{ case: row.id }}
        className={`review-case${active ? ' active' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        <span className={`review-status ${row.status}`} title={row.status}>
          {STATUS_LABEL[row.status]}
        </span>
        <span className="review-case-text">
          <span className="review-case-question">{row.question}</span>
          <span className="muted">
            {row.split} · judge correct:{' '}
            {(Object.keys(row.judgeCorrect) as QualityMode[])
              .filter((mode) => row.judgeCorrect[mode])
              .map((mode) => MODE_LABELS[mode])
              .join(', ') || 'none'}
          </span>
          {row.staleLabels > 0 && (
            <span
              className="tag review-case-stale"
              title="Labels for older text of these records; open the case to relabel them"
            >
              {row.staleLabels} text changed
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

function CaseView({ id, rows }: { id: string; rows: GradedCaseRow[] }) {
  const detail = useQuery({
    queryKey: ['graded-case', id],
    queryFn: () => getGradedCase({ data: id }),
  });
  if (detail.isPending) return <p className="muted">Loading {id}…</p>;
  if (detail.error) return <p className="error">{detail.error.message}</p>;
  return <CaseForm key={`${id}:${detail.data.judgmentHash}`} detail={detail.data} rows={rows} />;
}

function CaseForm({ detail, rows }: { detail: GradedCaseDetail; rows: GradedCaseRow[] }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const saved = detail.review;
  const [answers, setAnswers] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      detail.answers
        .filter((a) => saved?.answers[a.hash])
        .map((a) => [a.hash, saved!.answers[a.hash]!.correct]),
    ),
  );
  const [relevance, setRelevance] = useState<Record<string, ReviewedRelevance>>(() =>
    Object.fromEntries(
      detail.records.flatMap((r) => {
        const label = saved?.relevance[r.id] ?? (r.judge === 'uncertain' ? null : r.judge);
        return label ? [[r.id, label]] : [];
      }),
    ),
  );
  const [wrongFacts, setWrongFacts] = useState<string[]>(() =>
    saved?.judgmentHash === detail.judgmentHash ? saved.wrongFacts : [],
  );
  const [note, setNote] = useState(saved?.note ?? '');
  const [revealed, setRevealed] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      saveReview({
        data: {
          id: detail.id,
          review: {
            judgmentHash: detail.judgmentHash,
            wrongFacts,
            relevance,
            answers: Object.fromEntries(
              Object.entries(answers).map(([key, correct]) => [key, { correct }]),
            ),
            note,
          },
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['graded-cases'] });
      await queryClient.invalidateQueries({ queryKey: ['graded-case', detail.id] });
    },
  });

  const complete =
    detail.answers.every((a) => a.hash in answers) &&
    detail.records.every((r) => r.id in relevance);
  const index = rows.findIndex((row) => row.id === detail.id);
  const next =
    rows.slice(index + 1).find((row) => row.status !== 'reviewed') ??
    rows.find((row) => row.status !== 'reviewed' && row.id !== detail.id);

  const saveAndNext = async () => {
    await save.mutateAsync();
    if (next) await navigate({ to: '/review', search: { case: next.id } });
  };

  return (
    <form
      className="review-case-form"
      onSubmit={(event) => {
        event.preventDefault();
        void saveAndNext();
      }}
    >
      <header className="review-case-head">
        <p className="muted">
          {detail.id} · {detail.split}
        </p>
        <h2>{detail.question}</h2>
        <p>
          Required evidence:{' '}
          {detail.required.map((id) => (
            <code key={id} className="review-chip">
              {id}
            </code>
          ))}
        </p>
        {detail.notes && <p className="muted">Label note: {detail.notes}</p>}
      </header>

      <section className="review-section">
        <h3>Facts the judge expects</h3>
        <p className="muted">Tick a fact if it is wrong or not needed to answer the question.</p>
        <ul className="review-facts">
          {detail.facts.map((fact) => (
            <li key={fact.id}>
              <label>
                <input
                  type="checkbox"
                  checked={wrongFacts.includes(fact.id)}
                  onChange={(event) =>
                    setWrongFacts((current) =>
                      event.target.checked
                        ? [...current, fact.id]
                        : current.filter((f) => f !== fact.id),
                    )
                  }
                />{' '}
                <strong>{fact.id}</strong> {fact.claim}{' '}
                <span className="muted">({fact.sources.join(', ')})</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="review-section">
        <div className="review-section-head">
          <h3>Answers</h3>
          <button type="button" className="button secondary" onClick={() => setRevealed((r) => !r)}>
            {revealed ? 'Hide modes' : 'Reveal modes'}
          </button>
        </div>
        <p className="muted">
          Judge each answer yourself before reading the judge's verdict. Modes stay hidden until you
          reveal them.
        </p>
        {detail.answers.map((answer) => (
          <article key={answer.hash} className="review-answer">
            <header>
              <h4>
                Answer {answer.name}
                {revealed && (
                  <span className="muted">
                    {' '}
                    · {answer.modes.map((m) => MODE_LABELS[m]).join(', ')}
                  </span>
                )}
              </h4>
              <fieldset className="review-verdict">
                <legend className="sr-only">Your verdict on answer {answer.name}</legend>
                {[true, false].map((correct) => (
                  <label key={String(correct)}>
                    <input
                      type="radio"
                      name={`answer-${answer.hash}`}
                      checked={answers[answer.hash] === correct}
                      onChange={() =>
                        setAnswers((current) => ({ ...current, [answer.hash]: correct }))
                      }
                    />{' '}
                    {correct ? 'Correct' : 'Incorrect'}
                  </label>
                ))}
              </fieldset>
            </header>
            <div className="review-answer-text">
              <Markdown remarkPlugins={[remarkGfm]}>{answer.text}</Markdown>
            </div>
            <details>
              <summary>
                Judge: {answer.judge.correct ? 'correct' : 'incorrect'}
                {answer.hash in answers && answers[answer.hash] !== answer.judge.correct && (
                  <strong> · you disagree</strong>
                )}
              </summary>
              <p>{answer.judge.explanation}</p>
              <JudgeList title="Missing facts" items={answer.judge.missing} />
              <JudgeList title="Incorrect claims" items={answer.judge.incorrectClaims} />
              <JudgeList title="Unsupported claims" items={answer.judge.unsupportedClaims} />
              <JudgeList title="Citation errors" items={answer.judge.citationErrors} />
            </details>
          </article>
        ))}
      </section>

      <section className="review-section">
        <h3>Retrieved records</h3>
        <p className="muted">
          Pre-filled with the judge's label. Change any you disagree with; uncertain ones need a
          label.
        </p>
        <table className="review-records">
          <thead>
            <tr>
              <th>Record</th>
              <th>Retrieved by</th>
              <th>Judge</th>
              <th>Your label</th>
            </tr>
          </thead>
          <tbody>
            {detail.records.map((record) => (
              <tr
                key={record.id}
                className={
                  relevance[record.id] && relevance[record.id] !== record.judge
                    ? 'changed'
                    : undefined
                }
              >
                <td>
                  <details>
                    <summary>
                      <code>{record.id}</code>
                      {record.required && <span className="tag default">required</span>}
                      {record.staleLabel && (
                        <span
                          className="tag"
                          title="Your label was for an older text of this record"
                        >
                          text changed
                        </span>
                      )}
                      <span className="muted"> {record.title}</span>
                    </summary>
                    <pre className="review-record-text">{record.text}</pre>
                  </details>
                </td>
                <td className="muted">
                  {record.modes.map((m) => MODE_LABELS[m]).join(', ')}
                  {record.jevIrrelevant !== null && (
                    <>
                      <br />
                      Jev irrelevant {Math.round(record.jevIrrelevant * 100)}% (
                      {record.filterReason})
                    </>
                  )}
                </td>
                <td title={record.judgeReason}>{record.judge}</td>
                <td>
                  <select
                    aria-label={`Your label for ${record.id}`}
                    value={relevance[record.id] ?? ''}
                    onChange={(event) =>
                      setRelevance((current) => ({
                        ...current,
                        [record.id]: event.target.value as ReviewedRelevance,
                      }))
                    }
                  >
                    <option value="" disabled>
                      choose…
                    </option>
                    {RELEVANCE.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="review-section">
        <label className="review-note">
          Note
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
        </label>
      </section>

      <footer className="review-actions">
        {save.error && <span className="error">{save.error.message}</span>}
        {save.isSuccess && !save.isPending && <span className="badge ok">Saved</span>}
        {!complete && (
          <span className="muted">Give every answer a verdict and every record a label.</span>
        )}
        <button
          type="button"
          className="button secondary"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          Save
        </button>
        <button type="submit" className="button" disabled={save.isPending}>
          {next ? 'Save and next' : 'Save'}
        </button>
      </footer>
    </form>
  );
}

type QueueData = Awaited<ReturnType<typeof getReviewQueue>>;
type QueueRowData = QueueData['items'][number];

const CHOICES: Array<{ label: ReviewedRelevance; key: string; title: string; hint: string }> = [
  {
    label: 'direct',
    key: '1',
    title: 'Direct',
    hint: 'Answers part of the question: a rule, value, step, exception or limit.',
  },
  {
    label: 'supporting',
    key: '2',
    title: 'Supporting',
    hint: 'Doesn’t answer it, but defines a term or gives context needed to apply the answer.',
  },
  {
    label: 'irrelevant',
    key: '3',
    title: 'Irrelevant',
    hint: 'Not needed: a different situation or concept, another quest, or shared words only.',
  },
];
const CHOICE_TITLE = Object.fromEntries(CHOICES.map((c) => [c.label, c.title])) as Record<
  ReviewedRelevance,
  string
>;

const BUCKETS: Record<QueueBucket, { title: string; detail: string }> = {
  dropped_relevant: {
    title: 'Possible filter mistakes',
    detail: 'The filter dropped these, but the judge thinks they matter.',
  },
  threshold_band: {
    title: 'Close calls',
    detail: 'Jev was unsure, or Jev and the judge disagree.',
  },
  new_step: {
    title: 'New retrieval steps',
    detail: 'Found by the heading lookups added on 5 October.',
  },
  sample: {
    title: 'Spot checks',
    detail: 'A random eighth of the rest, to measure mistakes on easy records.',
  },
};

const keyOf = (row: { caseId: string; recordId: string }) => `${row.caseId}\u0000${row.recordId}`;

/**
 * Labels one record at a time, across questions, in the order that most helps calibrate the
 * Jev filter. Each label is saved into that question's review straight away and can be undone.
 * The judge's label and Jev's score are shown only after the reader decides, to avoid anchoring.
 */
function RecordQueuePage() {
  const queryClient = useQueryClient();
  const [includeHeldOut, setIncludeHeldOut] = useState(false);
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const [last, setLast] = useState<{ row: QueueRowData; label: ReviewedRelevance } | null>(null);
  const [target, setTarget] = useState<RulebookTarget | null>(null);
  const taskRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const queue = useQuery({
    queryKey: ['review-queue', includeHeldOut],
    queryFn: () => getReviewQueue({ data: { includeHeldOut } }),
  });
  const rulebook = useQuery({
    queryKey: ['rulebook'],
    queryFn: () => getRulebook(),
    staleTime: Infinity,
    enabled: target !== null,
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    void queryClient.invalidateQueries({ queryKey: ['graded-cases'] });
  };

  const items = queue.data?.items ?? [];
  const pending = items.filter((row) => !done.has(keyOf(row)));
  const current = pending.find((row) => !skipped.has(keyOf(row)));

  const save = useMutation({
    mutationFn: (input: { row: QueueRowData; label: ReviewedRelevance }) =>
      saveQueueLabel({
        data: { caseId: input.row.caseId, recordId: input.row.recordId, label: input.label },
      }),
    onError: (error, input) => {
      // Labelled in another tab: move on and refresh, keeping the message visible. Any other
      // error keeps the record so the label can be retried.
      if (!error.message.startsWith('Already labelled')) return;
      setDone((prev) => new Set(prev).add(keyOf(input.row)));
      refresh();
    },
    onSuccess: (_review, input) => {
      setDone((prev) => new Set(prev).add(keyOf(input.row)));
      setLast(input);
      setTarget(null);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ['graded-case', input.row.caseId] });
    },
  });
  const undo = useMutation({
    mutationFn: (row: QueueRowData) =>
      undoQueueLabel({ data: { caseId: row.caseId, recordId: row.recordId } }),
    onSuccess: (_result, row) => {
      setDone((prev) => {
        const next = new Set(prev);
        next.delete(keyOf(row));
        return next;
      });
      setSkipped((prev) => {
        const next = new Set(prev);
        next.delete(keyOf(row));
        return next;
      });
      setLast(null);
      refresh();
      void queryClient.invalidateQueries({ queryKey: ['graded-case', row.caseId] });
    },
  });

  const busy = save.isPending || undo.isPending;
  const choose = (label: ReviewedRelevance) => {
    if (current && !busy) save.mutate({ row: current, label });
  };
  const skip = () => {
    if (current) setSkipped((prev) => new Set(prev).add(keyOf(current)));
  };

  // A new record: back to the top, and move focus so screen readers announce the question.
  const currentKey = current ? keyOf(current) : null;
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    if (currentKey) taskRef.current?.focus({ preventScroll: true });
  }, [currentKey]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target as HTMLElement | null;
      if (el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable))
        return;
      const choice = CHOICES.find((c) => c.key === event.key);
      if (choice) choose(choice.label);
      else if (event.key === 's') skip();
      else if (event.key === 'u' && last && !busy) undo.mutate(last.row);
      else if (event.key === 'Escape') setTarget(null);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const progress = queue.data?.progress;
  const remaining = queue.data
    ? queue.data.buckets.reduce((sum, b) => sum + b.remaining, 0) -
      items.filter((row) => done.has(keyOf(row))).length
    : 0;

  return (
    <div className={`review-layout queue-layout${target ? ' with-viewer' : ''}`}>
      <aside className="review-list queue-rail">
        <ReviewHeader view="records" />
        {progress && (
          <section className="queue-panel" aria-labelledby="queue-progress">
            <h2 id="queue-progress">Progress</h2>
            <Meter label="Labels" value={progress.total} max={progress.targets.total} />
            <Meter
              label="Relevant records Jev doubts"
              value={progress.relevantInBand}
              max={progress.targets.relevantInBand}
            />
            <p className="muted">
              Calibration needs both targets. Counts cover development and validation questions.
            </p>
          </section>
        )}
        {queue.data && (
          <section className="queue-panel" aria-labelledby="queue-order">
            <h2 id="queue-order">Queue order</h2>
            <ol className="queue-buckets">
              {queue.data.buckets.map((bucket) => (
                <li
                  key={bucket.id}
                  aria-current={current?.bucket === bucket.id ? 'step' : undefined}
                >
                  <span className="queue-bucket-title">
                    {BUCKETS[bucket.id].title}
                    <span className="count">{bucket.remaining}</span>
                  </span>
                  <span className="muted">{BUCKETS[bucket.id].detail}</span>
                </li>
              ))}
            </ol>
            <label className="queue-toggle">
              <input
                type="checkbox"
                checked={includeHeldOut}
                onChange={(event) => setIncludeHeldOut(event.target.checked)}
              />
              <span>
                Include held-out questions
                <span className="muted"> Label these once, after the policy is chosen.</span>
              </span>
            </label>
          </section>
        )}
        <section className="queue-panel" aria-labelledby="queue-keys">
          <h2 id="queue-keys">Keyboard</h2>
          <dl className="queue-keys">
            {CHOICES.map((c) => (
              <div key={c.key}>
                <dt>
                  <kbd>{c.key}</kbd>
                </dt>
                <dd>{c.title}</dd>
              </div>
            ))}
            <div>
              <dt>
                <kbd>S</kbd>
              </dt>
              <dd>Skip for now</dd>
            </div>
            <div>
              <dt>
                <kbd>U</kbd>
              </dt>
              <dd>Undo the last label</dd>
            </div>
          </dl>
        </section>
      </aside>

      <main className="review-main queue-main" ref={mainRef}>
        <div className="queue-status" role="status" aria-live="polite">
          {last && (
            <LastLabel last={last} undoing={undo.isPending} onUndo={() => undo.mutate(last.row)} />
          )}
          {(save.error ?? undo.error) && (
            <p className="error">{(save.error ?? undo.error)!.message}</p>
          )}
        </div>
        {queue.isPending && <p className="muted">Loading the record queue…</p>}
        {queue.error && <p className="error">{queue.error.message}</p>}
        {queue.data &&
          (current ? (
            <QueueTask
              key={keyOf(current)}
              row={current}
              remaining={remaining}
              taskRef={taskRef}
              busy={busy}
              onChoose={choose}
              onSkip={skip}
              onOpenPage={setTarget}
            />
          ) : pending.length > 0 ? (
            <div className="queue-empty">
              <h2>You skipped the rest of this batch</h2>
              <button type="button" className="button" onClick={() => setSkipped(new Set())}>
                Show skipped records again
              </button>
            </div>
          ) : remaining > 0 ? (
            <p className="muted">Loading the next records…</p>
          ) : (
            <div className="queue-empty">
              <h2>The queue is empty</h2>
              <p className="muted">
                Every record in the queue has a label. Run{' '}
                <code>node --import tsx clients/web/src/evaluation/calibrate-filter.ts</code>.
              </p>
            </div>
          ))}
      </main>

      {target && (
        <aside className="viewer-pane" aria-label="Rulebook">
          <div className="pane-bar">
            <span className="pane-title">Rulebook</span>
            <button
              type="button"
              className="icon-button"
              onClick={() => setTarget(null)}
              aria-label="Close the rulebook"
              title="Close (Esc)"
            >
              <span aria-hidden="true">×</span> Close
            </button>
          </div>
          {rulebook.data ? (
            <RulebookViewer target={target} index={rulebook.data} onShowRecord={() => {}} />
          ) : (
            <p className="muted queue-viewer-loading">
              {rulebook.error ? rulebook.error.message : 'Loading the rulebook…'}
            </p>
          )}
        </aside>
      )}
    </div>
  );
}

function Meter({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="meter">
      <div className="meter-label">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <progress
        value={Math.min(value, max)}
        max={max}
        aria-label={`${label}: ${value} of ${max}`}
      />
    </div>
  );
}

function QueueTask({
  row,
  remaining,
  taskRef,
  busy,
  onChoose,
  onSkip,
  onOpenPage,
}: {
  row: QueueRowData;
  remaining: number;
  taskRef: RefObject<HTMLElement | null>;
  busy: boolean;
  onChoose: (label: ReviewedRelevance) => void;
  onSkip: () => void;
  onOpenPage: (target: RulebookTarget) => void;
}) {
  const foundBy = describeRetrieval(row.record.why);
  return (
    <article className="queue-task" ref={taskRef} tabIndex={-1} aria-labelledby="queue-question">
      <p className="queue-reason">
        <span className="tag">{BUCKETS[row.bucket].title}</span>
        <span className="muted">
          {BUCKETS[row.bucket].detail} {remaining} left.
        </span>
      </p>

      <section className="queue-block">
        <p className="queue-step">Question</p>
        <h2 id="queue-question" className="queue-question">
          {row.question}
        </h2>
        <p className="muted">
          {row.split === 'held_out' ? 'Held-out' : row.split.replace(/^./, (c) => c.toUpperCase())}{' '}
          question ·{' '}
          <Link to="/review" search={{ case: row.caseId }} className="link">
            See its answers and other records
          </Link>
        </p>
      </section>

      <section className="queue-block">
        <p className="queue-step">Record</p>
        <EvidenceCard
          item={row.record}
          context={row.context}
          highlighted={false}
          cited={false}
          onOpenPage={onOpenPage}
          expandText
        />
        {foundBy.length > 0 && (
          <p className="queue-found muted">
            Found by: {foundBy.join('; ')}.
            {row.required && ' It is one of this question’s required records.'}
          </p>
        )}
      </section>

      <section className="queue-block" aria-labelledby="queue-ask">
        <h3 id="queue-ask" className="queue-ask">
          Would a game master need this record to answer the question?
        </h3>
        <div className="queue-choices">
          {CHOICES.map((choice) => (
            <button
              key={choice.label}
              type="button"
              className={`queue-choice ${choice.label}`}
              disabled={busy}
              aria-keyshortcuts={choice.key}
              onClick={() => onChoose(choice.label)}
            >
              <span className="queue-choice-head">
                <kbd aria-hidden="true">{choice.key}</kbd> {choice.title}
              </span>
              <span className="queue-choice-hint">{choice.hint}</span>
            </button>
          ))}
        </div>
        <button type="button" className="link queue-skip" onClick={onSkip} aria-keyshortcuts="s">
          Not sure? Skip for now
        </button>
      </section>
    </article>
  );
}

/** Confirms the saved label, then shows how the judge and Jev saw the same record. */
function LastLabel({
  last,
  undoing,
  onUndo,
}: {
  last: { row: QueueRowData; label: ReviewedRelevance };
  undoing: boolean;
  onUndo: () => void;
}) {
  const { row, label } = last;
  const jev =
    row.pIrrelevant === null
      ? 'Jev did not score it'
      : `Jev gave ${Math.round(row.pIrrelevant * 100)}% irrelevant${row.kept === false ? ' and the filter dropped it' : row.kept ? ' and the filter kept it' : ''}`;
  const relevant = label !== 'irrelevant';
  const jevSaysRelevant = row.pIrrelevant !== null && row.pIrrelevant < 0.5;
  return (
    <div className="queue-last">
      <p>
        <strong>
          Saved “{row.record.title}” as {CHOICE_TITLE[label].toLowerCase()}.
        </strong>{' '}
        The judge said {row.judge}; {jev}.
        {row.pIrrelevant !== null && relevant !== jevSaysRelevant && (
          <> You disagree with Jev, which is what calibration needs to know.</>
        )}
      </p>
      <button type="button" className="button secondary" onClick={onUndo} disabled={undoing}>
        Undo <kbd aria-hidden="true">U</kbd>
      </button>
    </div>
  );
}

function JudgeList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <>
      <p className="review-judge-title">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}
