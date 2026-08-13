import { describe, expect, it } from 'vitest';
import { seed } from './data';
import type { PeakSnapshot } from './data';
import { demoDataForStorage, isAppData } from './store';

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
});
