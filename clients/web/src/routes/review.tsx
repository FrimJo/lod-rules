import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  saveQueueLabel,
  saveReview,
} from '../server/functions.ts';

interface ReviewSearch {
  case?: string;
  view?: 'records';
}

export const Route = createFileRoute('/review')({
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
  const list = useQuery({
    queryKey: ['graded-cases'],
    queryFn: () => getGradedCases(),
  });
  const rows = list.data?.rows ?? [];
  const selected = search.case ?? rows[0]?.id;

  return (
    <div className="review-layout">
      <aside className="review-list">
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
            className={search.view ? 'link' : 'link active'}
            aria-current={search.view ? undefined : 'page'}
          >
            Cases
          </Link>
          <Link
            to="/review"
            search={{ view: 'records' }}
            className={search.view === 'records' ? 'link active' : 'link'}
            aria-current={search.view === 'records' ? 'page' : undefined}
          >
            Record queue
          </Link>
        </nav>
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
        {search.view === 'records' ? (
          <RecordQueueView />
        ) : selected ? (
          <CaseView id={selected} rows={rows} />
        ) : (
          <p className="muted">Pick a case.</p>
        )}
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

const LABEL_KEYS: Record<string, ReviewedRelevance> = {
  '1': 'direct',
  '2': 'supporting',
  '3': 'irrelevant',
};

/**
 * One record at a time, across cases, in the order that most helps calibrate the Jev filter.
 * Each label is saved into that case's review straight away.
 */
function RecordQueueView() {
  const queryClient = useQueryClient();
  const [includeHeldOut, setIncludeHeldOut] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const queue = useQuery({
    queryKey: ['review-queue', includeHeldOut],
    queryFn: () => getReviewQueue({ data: { includeHeldOut } }),
  });
  const item = queue.data?.items[0];
  const save = useMutation({
    mutationFn: (label: ReviewedRelevance) =>
      saveQueueLabel({ data: { caseId: item!.caseId, recordId: item!.recordId, label } }),
    onSuccess: async () => {
      setRevealed(false);
      await queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      await queryClient.invalidateQueries({ queryKey: ['graded-cases'] });
      await queryClient.invalidateQueries({ queryKey: ['graded-case', item?.caseId] });
    },
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const label = LABEL_KEYS[event.key];
      if (label && item && !save.isPending) save.mutate(label);
      if (event.key === 'j') setRevealed((r) => !r);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, save]);

  if (queue.isPending) return <p className="muted">Loading the record queue…</p>;
  if (queue.error) return <p className="error">{queue.error.message}</p>;
  const { buckets, progress } = queue.data;
  const remaining = buckets.reduce((sum, b) => sum + b.remaining, 0);

  return (
    <div className="review-case-form">
      <header className="review-case-head">
        <h2>Record queue</h2>
        <p>
          {progress.total} of {progress.targets.total} labels · {progress.relevantInBand} of{' '}
          {progress.targets.relevantInBand} relevant records that Jev doubts (p(irrelevant) ≥ 0.6) ·
          development and validation only
        </p>
        <ul className="review-buckets">
          {buckets.map((bucket) => (
            <li key={bucket.id} className={item?.bucket === bucket.id ? 'active' : undefined}>
              <strong>{bucket.remaining}</strong> {bucket.label}
            </li>
          ))}
        </ul>
        <label className="muted">
          <input
            type="checkbox"
            checked={includeHeldOut}
            onChange={(event) => setIncludeHeldOut(event.target.checked)}
          />{' '}
          Include held-out questions (label these once, after the policy is chosen)
        </label>
      </header>

      {!item ? (
        <p className="muted">Nothing left in the queue.</p>
      ) : (
        <section className="review-section review-queue-item">
          <p className="muted">
            {QUEUE_LABELS[item.bucket]} · {remaining} left ·{' '}
            <Link to="/review" search={{ case: item.caseId }} className="link">
              {item.caseId}
            </Link>{' '}
            · {item.split}
          </p>
          <h3>{item.question}</h3>
          <p>
            <code>{item.recordId}</code> <span className="muted">{item.kind}</span>
            {item.required && <span className="tag default">required</span>}
          </p>
          <p>
            <strong>{item.title}</strong>
          </p>
          <pre className="review-record-text">{item.text}</pre>
          <p className="muted">Retrieved by: {item.why.join(', ') || 'unknown'}</p>
          <div className="review-queue-actions">
            {RELEVANCE.map((label, i) => (
              <button
                key={label}
                type="button"
                className="button"
                disabled={save.isPending}
                onClick={() => save.mutate(label)}
              >
                {i + 1} · {label}
              </button>
            ))}
            <button
              type="button"
              className="button secondary"
              onClick={() => setRevealed((r) => !r)}
            >
              {revealed ? 'Hide' : 'Show'} judge and Jev (j)
            </button>
          </div>
          {revealed && (
            <p className="muted">
              Judge: <strong>{item.judge}</strong>, {item.judgeReason} · Jev p(irrelevant):{' '}
              {item.pIrrelevant === null ? '–' : `${Math.round(item.pIrrelevant * 100)}%`}
              {item.kept !== null && ` (${item.kept ? 'kept' : 'dropped'}: ${item.filterReason})`}
            </p>
          )}
          {save.error && <p className="error">{save.error.message}</p>}
        </section>
      )}
    </div>
  );
}

const QUEUE_LABELS: Record<QueueBucket, string> = {
  dropped_relevant: 'Dropped, judge says relevant',
  threshold_band: 'Near the drop line',
  new_step: 'New retrieval step',
  sample: 'Sample',
};

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
