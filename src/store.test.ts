import { describe, expect, it } from 'vitest';
import { seed } from './data';
import type { PeakSnapshot } from './data';
import { demoDataForStorage, isAppData, isPeakSnapshotMeta, peakMetaFromSnapshot } from './store';

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
  });
});
