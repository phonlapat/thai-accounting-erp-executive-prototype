import { DEMO_STORAGE_KEY, PEAK_SESSION_DEADLINE_KEY, PEAK_SESSION_KEY } from './store';

interface RecoveryStorage {
  removeItem: (key: string) => void;
}

type StorageProvider = () => RecoveryStorage;

function removeKeys(provider: StorageProvider, keys: readonly string[]) {
  let storage: RecoveryStorage;
  try {
    storage = provider();
  } catch {
    return false;
  }

  let cleared = true;
  for (const key of keys) {
    try {
      storage.removeItem(key);
    } catch {
      cleared = false;
    }
  }
  return cleared;
}

export function clearRecoveryState(
  localStorageProvider: StorageProvider = () => window.localStorage,
  sessionStorageProvider: StorageProvider = () => window.sessionStorage,
) {
  const localCleared = removeKeys(localStorageProvider, [DEMO_STORAGE_KEY]);
  const privateSessionCleared = removeKeys(sessionStorageProvider, [PEAK_SESSION_KEY, PEAK_SESSION_DEADLINE_KEY]);
  return localCleared && privateSessionCleared;
}
