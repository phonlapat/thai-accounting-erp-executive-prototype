import { describe, expect, it } from 'vitest';
import {
  PEAK_HANDOFF_KEY,
  PEAK_HANDOFF_TTL_MS,
  forgetPeakHandoff,
  readPeakHandoff,
  rememberPeakHandoff,
  zeroDataSurface
} from './peak-handoff';
import type { PeakHandoffStorage } from './peak-handoff';

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(PEAK_HANDOFF_KEY, initial);
  const storage: PeakHandoffStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); }
  };
  return { storage, values };
}

describe('PEAK handoff surface', () => {
  it('opens a locked dashboard after the PEAK handoff without inventing data', () => {
    expect(zeroDataSurface(false, false)).toBe('gate');
    expect(zeroDataSurface(false, true)).toBe('handoff-workspace');
    expect(zeroDataSurface(true, false)).toBe('real-dashboard');
    expect(zeroDataSurface(true, true)).toBe('real-dashboard');
  });

  it('keeps a recent handoff inside the same browser tab', () => {
    const now = 1_800_000_000_000;
    const { storage } = memoryStorage(JSON.stringify({ startedAt: now - 5_000 }));
    expect(readPeakHandoff(storage, now)).toBe(true);
  });

  it('removes expired and malformed handoff markers', () => {
    const now = 1_800_000_000_000;
    const expired = memoryStorage(JSON.stringify({ startedAt: now - PEAK_HANDOFF_TTL_MS - 1 }));
    expect(readPeakHandoff(expired.storage, now)).toBe(false);
    expect(expired.values.has(PEAK_HANDOFF_KEY)).toBe(false);

    const malformed = memoryStorage('{');
    expect(readPeakHandoff(malformed.storage, now)).toBe(false);
    expect(malformed.values.has(PEAK_HANDOFF_KEY)).toBe(false);
  });

  it('remembers and clears only the handoff timestamp', () => {
    const now = 1_800_000_000_000;
    const { storage, values } = memoryStorage();
    expect(rememberPeakHandoff(storage, now)).toBe(true);
    expect(values.get(PEAK_HANDOFF_KEY)).toBe(JSON.stringify({ startedAt: now }));
    expect(forgetPeakHandoff(storage)).toBe(true);
    expect(values.has(PEAK_HANDOFF_KEY)).toBe(false);
  });

  it('fails safely when browser storage is unavailable', () => {
    const unavailable: PeakHandoffStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); }
    };
    expect(readPeakHandoff(unavailable)).toBe(false);
    expect(rememberPeakHandoff(unavailable)).toBe(false);
    expect(forgetPeakHandoff(unavailable)).toBe(false);
  });
});
