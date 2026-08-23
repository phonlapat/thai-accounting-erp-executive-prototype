export const PEAK_HANDOFF_KEY = 'siam-erp-peak-handoff-v1';
export const PEAK_HANDOFF_TTL_MS = 30 * 60 * 1000;

const MAX_CLOCK_SKEW_MS = 60 * 1000;

export type PeakHandoffStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type ZeroDataSurface = 'gate' | 'handoff-workspace' | 'real-dashboard';

function browserSessionStorage(): PeakHandoffStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function readPeakHandoff(
  storage: PeakHandoffStorage | undefined = browserSessionStorage(),
  now = Date.now()
): boolean {
  if (!storage) return false;
  try {
    const raw = storage.getItem(PEAK_HANDOFF_KEY);
    if (!raw) return false;
    const value = JSON.parse(raw) as {startedAt?: unknown;};
    const startedAt = value?.startedAt;
    const valid = typeof startedAt === 'number' && Number.isFinite(startedAt) && startedAt >= 0 &&
      startedAt <= now + MAX_CLOCK_SKEW_MS && now - startedAt <= PEAK_HANDOFF_TTL_MS;
    if (!valid) storage.removeItem(PEAK_HANDOFF_KEY);
    return valid;
  } catch {
    try { storage.removeItem(PEAK_HANDOFF_KEY); } catch { /* session storage is optional */ }
    return false;
  }
}

export function rememberPeakHandoff(
  storage: PeakHandoffStorage | undefined = browserSessionStorage(),
  now = Date.now()
): boolean {
  if (!storage || !Number.isFinite(now) || now < 0) return false;
  try {
    storage.setItem(PEAK_HANDOFF_KEY, JSON.stringify({ startedAt: now }));
    return true;
  } catch {
    return false;
  }
}

export function forgetPeakHandoff(storage: PeakHandoffStorage | undefined = browserSessionStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(PEAK_HANDOFF_KEY);
    return true;
  } catch {
    return false;
  }
}

export function zeroDataSurface(hasSnapshot: boolean, handoffStarted: boolean): ZeroDataSurface {
  if (hasSnapshot) return 'real-dashboard';
  return handoffStarted ? 'handoff-workspace' : 'gate';
}
