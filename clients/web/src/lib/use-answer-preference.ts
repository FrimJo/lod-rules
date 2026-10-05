import { useQuery } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';
import { getAnswerSettings, type AnswerSettings } from '../server/functions.ts';

const STORAGE_KEY = 'lod-rules:auto-answer';
const FALLBACK: AnswerSettings = { available: false, model: '' };

const listeners = new Set<() => void>();
/** Kept in memory too, so the choice still applies when storage is blocked. */
let stored: boolean | undefined;

function readStorage(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function getSnapshot(): boolean {
  if (stored === undefined) stored = readStorage();
  return stored;
}

function subscribe(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    stored = readStorage();
    listener();
  };
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function writeStored(on: boolean) {
  stored = on;
  try {
    if (on) window.localStorage.setItem(STORAGE_KEY, 'on');
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing can block storage; the in-memory choice still applies.
  }
  for (const listener of listeners) listener();
}

/**
 * Whether the server can write AI answers, and whether this browser wants one written as
 * soon as the evidence arrives. Off by default: the evidence is the answer until the reader
 * asks for a summary, so nothing goes to the model without a click.
 */
export function useAnswerPreference() {
  const query = useQuery({
    queryKey: ['answer-settings'],
    queryFn: () => getAnswerSettings(),
    staleTime: Infinity,
  });
  const settings = query.data ?? FALLBACK;
  const chosen = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const setAuto = useCallback((on: boolean) => writeStored(on), []);
  return { settings, auto: settings.available && chosen, setAuto };
}
