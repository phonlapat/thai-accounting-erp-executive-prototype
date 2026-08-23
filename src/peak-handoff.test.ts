import { describe, expect, it } from 'vitest';
import { zeroDataSurface } from './peak-handoff';

describe('PEAK handoff surface', () => {
  it('opens a locked dashboard after the PEAK handoff without inventing data', () => {
    expect(zeroDataSurface(false, false)).toBe('gate');
    expect(zeroDataSurface(false, true)).toBe('waiting-dashboard');
    expect(zeroDataSurface(true, false)).toBe('real-dashboard');
    expect(zeroDataSurface(true, true)).toBe('real-dashboard');
  });
});
