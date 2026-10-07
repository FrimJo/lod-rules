import { Fragment } from 'react';
import type { LogEntry, LogKind } from '../engine.ts';
import { CiteChip, useGm } from './common.tsx';

const KIND_LABEL: Record<LogKind, string> = {
  turn: 'Turn',
  threat: 'Threat',
  light: 'Light',
  morale: 'Morale',
  sanity: 'Sanity',
  hero: 'Hero',
  battle: 'Battle',
  rest: 'Rest',
  explore: 'Explore',
  info: 'Note',
  warn: 'Check',
};

export function LogPanel() {
  const { state } = useGm();
  const entries = [...state.log].reverse();
  return (
    <section className="gm-log" aria-labelledby="gm-log-title">
      <header className="gm-panel-head">
        <h2 id="gm-log-title">Log</h2>
        <span className="muted">{entries.length === 0 ? 'Nothing yet' : `${entries.length} entries, newest first`}</span>
      </header>
      {entries.length > 0 && (
        <ol className="gm-log-list" aria-live="polite">
          {entries.map((entry, i) => {
            const previous = entries[i - 1];
            const turnBreak = !previous || previous.turn !== entry.turn;
            return (
              <Fragment key={entry.id}>
                {turnBreak && (
                  <li className="gm-log-turn" aria-hidden="true">
                    {entry.turn === 0 ? 'Setup' : `Turn ${entry.turn}`}
                  </li>
                )}
                <li className={`gm-log-entry ${entry.kind}`}>
                  <LogLine entry={entry} />
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  return (
    <>
      <span className={`gm-log-kind ${entry.kind}`}>{KIND_LABEL[entry.kind]}</span>
      <span className="gm-log-text">
        {entry.text}
        {entry.cite && (
          <>
            {' '}
            <CiteChip cite={entry.cite} />
          </>
        )}
      </span>
    </>
  );
}
