import { useCallback, useSyncExternalStore } from 'react';
import {
  currentHero,
  initialParty,
  reduceParty,
  reviveState,
  type CharacterEvent,
  type PartyState,
} from './engine.ts';

const STORAGE_KEY = 'lod-rules:character-creator';
const UNDO_LIMIT = 80;

interface Store {
  present: PartyState;
  past: PartyState[];
}

const SERVER: Store = { present: initialParty(), past: [] };
let store: Store | undefined;
const listeners = new Set<() => void>();

function read(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return { present: raw ? reviveState(JSON.parse(raw)) : initialParty(), past: [] };
  } catch {
    return { present: initialParty(), past: [] };
  }
}

function write(next: Store) {
  store = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.present));
  } catch {
    // Private browsing can block storage; the in-memory party still works for the session.
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

/** Moving between stations or heroes changes the view, not a sheet, so Undo skips it. */
const NOT_UNDOABLE = new Set<CharacterEvent['type']>([
  'set_step',
  'hero_select',
  'toggle_copied',
  'clear_copied',
]);

export function dispatch(event: CharacterEvent): void {
  const current = getSnapshot();
  const present = reduceParty(current.present, event);
  if (present === current.present) return;
  if (NOT_UNDOABLE.has(event.type)) {
    write({ present, past: current.past });
    return;
  }
  write({ present, past: [...current.past, current.present].slice(-UNDO_LIMIT) });
}

export function undo(): void {
  const current = getSnapshot();
  const previous = current.past.at(-1);
  if (!previous) return;
  write({ present: previous, past: current.past.slice(0, -1) });
}

/**
 * The party in progress, saved in `localStorage` after every change so a refresh does not lose
 * the dice. Undo history lives in memory for the session.
 */
export function useCharacterStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => SERVER);
  const send = useCallback((event: CharacterEvent) => dispatch(event), []);
  const back = useCallback(() => undo(), []);
  return {
    party: snapshot.present,
    state: currentHero(snapshot.present),
    canUndo: snapshot.past.length > 0,
    dispatch: send,
    undo: back,
  };
}
