import { useQuery } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';
import { getRetrievalSettings } from '../server/functions.ts';
import {
  isModeAvailable,
  isRetrievalMode,
  type RetrievalMode,
  type RetrievalSettings,
} from './retrieval-modes.ts';

const STORAGE_KEY = 'lod-rules:retrieval-mode';
const FALLBACK_SETTINGS: RetrievalSettings = { defaultMode: 'lexical', jevAvailable: false };

const listeners = new Set<() => void>();
/** Kept in memory too, so the choice still applies when storage is blocked. */
let stored: RetrievalMode | null | undefined;

function readStorage(): RetrievalMode | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isRetrievalMode(value) ? value : null;
  } catch {
    return null;
  }
}

function getSnapshot(): RetrievalMode | null {
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

function writeStored(mode: RetrievalMode | null) {
  stored = mode;
  try {
    if (mode) window.localStorage.setItem(STORAGE_KEY, mode);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing can block storage; the in-memory choice still applies.
  }
  for (const listener of listeners) listener();
}

export function useRetrievalMode() {
  const query = useQuery({
    queryKey: ['retrieval-settings'],
    queryFn: () => getRetrievalSettings(),
    staleTime: Infinity,
  });
  const settings = query.data ?? FALLBACK_SETTINGS;
  const chosen = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const mode = chosen && isModeAvailable(chosen, settings) ? chosen : settings.defaultMode;

  const setMode = useCallback((next: RetrievalMode) => writeStored(next), []);
  const reset = useCallback(() => writeStored(null), []);

  return {
    mode,
    settings,
    /** False until the server reports which modes it can run. */
    ready: !query.isPending,
    isDefault: chosen === null || mode === settings.defaultMode,
    setMode,
    reset,
  };
}
