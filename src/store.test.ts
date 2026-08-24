import { describe, expect, it, vi } from 'vitest';
import { seed } from './data';
import type { PeakSnapshot } from './data';
import {
  PEAK_IDLE_TIMEOUT_MS, PEAK_IDLE_WARNING_MS, PEAK_SESSION_DEADLINE_KEY, PEAK_SESSION_KEY,
  clearPrivateSessionStorage, demoDataForStorage, isAppData, isPeakSessionDeadline, isPeakSnapshotMeta,
  peakMetaFromSnapshot, peakSessionRemainingLabel, peakSessionStatus
} from './store';

describe('browser storage boundary', () => {
  it('never serializes a private PEAK snapshot with demo data', () => {
    const data = { ...seed(), peakSnapshot: { companyName: 'private' } as PeakSnapshot };
    const serialized = JSON.stringify(demoDataForStorage(data));

    expect(serialized).not.toContain('peakSnapshot');
    expect(serialized).not.toContain('private');
  });

  it('recognizes seeded demo data and rejects invalid settings', () => {
    expect(isAppData(seed())).toBe(true);
    expect(isAppData({ ...seed(), settings: { closedThrough: 'invalid', threshold: Number.NaN } })).toBe(false);
  });

  it('keeps only privacy-safe PEAK freshness metadata between sessions', () => {
    const snapshot = {
      asOf: '2026-08-17T16:00:00+07:00',
      capturedAt: '2026-08-17T16:02:00+07:00',
      companyName: 'Private Company',
      income: { total: 123456 }
    } as unknown as PeakSnapshot;
    const meta = peakMetaFromSnapshot(snapshot);

    expect(meta).toEqual({ asOf: snapshot.asOf, capturedAt: snapshot.capturedAt });
    expect(JSON.stringify(meta)).not.toContain('Private Company');
    expect(JSON.stringify(meta)).not.toContain('123456');
    expect(isPeakSnapshotMeta(meta)).toBe(true);
    expect(isPeakSnapshotMeta({ asOf: 'invalid', capturedAt: snapshot.capturedAt })).toBe(false);
    expect(isPeakSnapshotMeta({ asOf: '2026-08-18T16:02:00+07:00', capturedAt: snapshot.capturedAt })).toBe(false);
    expect(isPeakSnapshotMeta({ asOf: snapshot.asOf, capturedAt: '2099-08-17T16:02:00+07:00' })).toBe(false);
  });

  it('uses a bounded inactivity deadline and warns before deleting private session data', () => {
    const now = Date.parse('2026-08-20T03:00:00+07:00');
    const deadline = now + PEAK_IDLE_TIMEOUT_MS;

    expect(isPeakSessionDeadline(deadline, now)).toBe(true);
    expect(isPeakSessionDeadline(now + PEAK_IDLE_TIMEOUT_MS + 5 * 60 * 1000 + 1, now)).toBe(false);
    expect(isPeakSessionDeadline(Number.NaN, now)).toBe(false);
    expect(peakSessionStatus(deadline, now)).toBe('active');
    expect(peakSessionStatus(now + PEAK_IDLE_WARNING_MS, now)).toBe('warning');
    expect(peakSessionStatus(now, now)).toBe('expired');
    expect(peakSessionStatus(undefined, now)).toBe('expired');
  });

  it('formats the pre-lock countdown without exposing data', () => {
    expect(peakSessionRemainingLabel(120_000)).toBe('2:00');
    expect(peakSessionRemainingLabel(61_001)).toBe('1:02');
    expect(peakSessionRemainingLabel(-1)).toBe('0:00');
  });

  it('removes and verifies both private session keys', () => {
    const values = new Map<string, string>([
      [PEAK_SESSION_KEY, 'session-value'],
      [PEAK_SESSION_DEADLINE_KEY, 'deadline-value']
    ]);
    const storage = {
      removeItem: vi.fn((key: string) => values.delete(key)),
      getItem: vi.fn((key: string) => values.get(key) ?? null)
    };

    expect(clearPrivateSessionStorage(storage)).toBe(true);
    expect(storage.removeItem).toHaveBeenCalledWith(PEAK_SESSION_KEY);
    expect(storage.removeItem).toHaveBeenCalledWith(PEAK_SESSION_DEADLINE_KEY);
    expect(storage.getItem).toHaveBeenCalledWith(PEAK_SESSION_KEY);
    expect(storage.getItem).toHaveBeenCalledWith(PEAK_SESSION_DEADLINE_KEY);
  });

  it.each([PEAK_SESSION_KEY, PEAK_SESSION_DEADLINE_KEY])(
    'reports failure for %s while still attempting both private keys',
    (failedKey) => {
      const values = new Map<string, string>([
        [PEAK_SESSION_KEY, 'session-value'],
        [PEAK_SESSION_DEADLINE_KEY, 'deadline-value']
      ]);
      const storage = {
        removeItem: vi.fn((key: string) => {
          if (key === failedKey) throw new Error('storage unavailable');
          values.delete(key);
        }),
        getItem: vi.fn((key: string) => values.get(key) ?? null)
      };

      expect(clearPrivateSessionStorage(storage)).toBe(false);
      expect(storage.removeItem).toHaveBeenCalledWith(PEAK_SESSION_KEY);
      expect(storage.removeItem).toHaveBeenCalledWith(PEAK_SESSION_DEADLINE_KEY);
      expect(storage.getItem).toHaveBeenCalledWith(PEAK_SESSION_KEY);
      expect(storage.getItem).toHaveBeenCalledWith(PEAK_SESSION_DEADLINE_KEY);
      const otherKey = failedKey === PEAK_SESSION_KEY ? PEAK_SESSION_DEADLINE_KEY : PEAK_SESSION_KEY;
      expect(values.has(otherKey)).toBe(false);
    }
  );
});
