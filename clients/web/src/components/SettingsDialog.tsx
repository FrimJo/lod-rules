import { useEffect, useRef } from 'react';
import {
  MODES,
  RETRIEVAL_MODES,
  isModeAvailable,
  type RetrievalMode,
  type RetrievalSettings,
} from '../lib/retrieval-modes.ts';

export function SettingsDialog({
  open,
  mode,
  settings,
  isDefault,
  onChange,
  onReset,
  onClose,
}: {
  open: boolean;
  mode: RetrievalMode;
  settings: RetrievalSettings;
  isDefault: boolean;
  onChange: (mode: RetrievalMode) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>('input[name="retrieval-mode"]:checked')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="settings-dialog"
      aria-labelledby="settings-title"
      aria-describedby="settings-intro"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="settings-body">
        <h2 id="settings-title">Retrieval settings</h2>
        <p id="settings-intro" className="muted">
          Every mode searches the rulebook index. Laya and Jev only add related records; they never
          remove what the search found.
        </p>
        <fieldset className="mode-options">
          <legend>Retrieval mode</legend>
          {RETRIEVAL_MODES.map((id) => {
            const info = MODES[id];
            const disabled = !isModeAvailable(id, settings);
            return (
              <label key={id} className={`mode-card${disabled ? ' disabled' : ''}`}>
                <input
                  type="radio"
                  name="retrieval-mode"
                  value={id}
                  checked={mode === id}
                  disabled={disabled}
                  aria-describedby={`mode-${id}-desc${disabled ? ` mode-${id}-reason` : ''}`}
                  onChange={() => onChange(id)}
                />
                <span className="mode-card-body">
                  <span className="mode-card-title">
                    {info.label}
                    {id === settings.defaultMode && <span className="tag default">Default</span>}
                  </span>
                  <span id={`mode-${id}-desc`} className="mode-card-desc">
                    {info.description}
                  </span>
                  <span className="mode-tags">
                    {info.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </span>
                  {disabled && (
                    <span id={`mode-${id}-reason`} className="mode-reason">
                      Needs TYPESAFE_API_KEY on the server
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
        <p className="muted">Applies to your next question.</p>
        <div className="settings-actions">
          <button type="button" className="link" onClick={onReset} disabled={isDefault}>
            Reset to server default
          </button>
          <button type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}
