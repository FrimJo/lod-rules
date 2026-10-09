import type { RulebookTarget } from '../lib/citations.ts';
import type { RulebookIndex } from '../server/rulebook.ts';
import { RulebookViewer } from './RulebookViewer.tsx';

/** The rulebook beside an island: the same pane, close button and Escape on every route. */
export function RulebookPane({
  target,
  index,
  onClose,
  onShowRecord = () => {},
}: {
  target: RulebookTarget;
  index: RulebookIndex | undefined;
  onClose: () => void;
  onShowRecord?: (id: string) => void;
}) {
  return (
    <aside
      className="viewer-pane"
      aria-label="Rulebook"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="pane-bar">
        <span className="pane-title">Rulebook</span>
        <button
          type="button"
          className="top-btn"
          onClick={onClose}
          aria-label="Close the rulebook"
          title="Close (Esc)"
        >
          <span aria-hidden="true">×</span> Close
        </button>
      </div>
      <RulebookViewer target={target} index={index} onShowRecord={onShowRecord} />
    </aside>
  );
}
