import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {
  GradedCaseDetail,
  GradedCaseRow,
  QualityMode,
  ReviewedRelevance,
} from '../server/grading.ts';
import { getGradedCase, getGradedCases, saveReview } from '../server/functions.ts';

export const Route = createFileRoute('/review')({
  validateSearch: (search: Record<string, unknown>): { case?: string } =>
    typeof search.case === 'string' ? { case: search.case } : {},
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
        {list.data && <ReviewSummary summary={list.data.summary} />}
        {list.isPending && <p className="muted">Loading graded cases…</p>}
        {list.error && <p className="error">{list.error.message}</p>}
        {list.data && rows.length === 0 && (
          <p className="muted">
            No graded cases. Run <code>node --import tsx clients/web/src/evaluation/run-quality.ts</code>.
          </p>
        )}
        <ol className="review-cases">
          {rows.map((row) => (
            <CaseRow key={row.id} row={row} active={row.id === selected} />
          ))}
        </ol>
      </aside>
      <main className="review-main">
        {selected ? (
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
          Judge each answer yourself before reading the judge's verdict. Modes stay hidden until
          you reveal them.
        </p>
        {detail.answers.map((answer) => (
          <article key={answer.hash} className="review-answer">
            <header>
              <h4>
                Answer {answer.name}
                {revealed && (
                  <span className="muted"> · {answer.modes.map((m) => MODE_LABELS[m]).join(', ')}</span>
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
                      onChange={() => setAnswers((current) => ({ ...current, [answer.hash]: correct }))}
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
                  relevance[record.id] && relevance[record.id] !== record.judge ? 'changed' : undefined
                }
              >
                <td>
                  <details>
                    <summary>
                      <code>{record.id}</code>
                      {record.required && <span className="tag default">required</span>}
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
                      Jev irrelevant {Math.round(record.jevIrrelevant * 100)}% ({record.filterReason})
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
        {!complete && <span className="muted">Give every answer a verdict and every record a label.</span>}
        <button type="button" className="button secondary" disabled={save.isPending} onClick={() => save.mutate()}>
          Save
        </button>
        <button type="submit" className="button" disabled={save.isPending}>
          {next ? 'Save and next' : 'Save'}
        </button>
      </footer>
    </form>
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
