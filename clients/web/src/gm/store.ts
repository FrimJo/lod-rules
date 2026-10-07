import { useCallback, useSyncExternalStore } from 'react';
import { initialState, reduce, reviveState, type GmEvent, type GmState } from './engine.ts';

const STORAGE_KEY = 'lod-rules:gm-table';
const UNDO_LIMIT = 60;

interface Store {
  present: GmState;
  past: GmState[];
}

const SERVER: Store = { present: initialState(), past: [] };
let store: Store | undefined;
const listeners = new Set<() => void>();

function read(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return { present: raw ? reviveState(JSON.parse(raw)) : initialState(), past: [] };
  } catch {
    return { present: initialState(), past: [] };
  }
}

function write(next: Store) {
  store = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.present));
  } catch {
    // Private browsing can block storage; the in-memory table still works for the session.
  }
  for (const listener of listeners) listener();
}

function getSnapshot(): Store {
  if (!store) store = read();
  return store;
}

function subscribe(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || event.newValue === null) return;
    try {
      store = { present: reviveState(JSON.parse(event.newValue)), past: store?.past ?? [] };
      listener();
    } catch {
      // Ignore a malformed value written by another tab.
    }
  };
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function dispatch(event: GmEvent): void {
  const current = getSnapshot();
  const present = reduce(current.present, event);
  if (present === current.present) return;
  write({ present, past: [...current.past, current.present].slice(-UNDO_LIMIT) });
}

export function undo(): void {
  const current = getSnapshot();
  const previous = current.past.at(-1);
  if (!previous) return;
  write({ present: previous, past: current.past.slice(0, -1) });
}

/**
 * The Game Master's table, saved in `localStorage` after every event so a refresh or a
 * closed laptop lid does not lose the dungeon. Undo history lives in memory for the session.
 */
export function useGmStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => SERVER);
  const send = useCallback((event: GmEvent) => dispatch(event), []);
  const back = useCallback(() => undo(), []);
  return { state: snapshot.present, canUndo: snapshot.past.length > 0, dispatch: send, undo: back };
}
