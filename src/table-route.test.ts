import { describe, expect, it } from 'vitest';
import { buildTableHash, parseTableRoute, safeWorkbenchModuleId } from './table-route';

describe('table route state', () => {
  it('round-trips a search and deterministic filters', () => {
    const hash = buildTableHash('peak-income', 'บริษัท ไทย', { type: 'invoice', status: 'overdue' });
    expect(hash).toBe('#peak-income?q=%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%A9%E0%B8%B1%E0%B8%97+%E0%B9%84%E0%B8%97%E0%B8%A2&status=overdue&type=invoice');
    expect(parseTableRoute(hash)).toEqual({
      query: 'บริษัท ไทย',
      filters: { status: 'overdue', type: 'invoice' }
    });
  });

  it('ignores empty filters and keeps an empty route clean', () => {
    expect(buildTableHash('peak-finance', '', { type: '', q: 'ignored' })).toBe('#peak-finance');
    expect(parseTableRoute('#peak-finance')).toEqual({ query: '', filters: {} });
  });

  it('falls back before a cleared private module can render', () => {
    const available = ['dashboard', 'peak-income', 'peak-expenses'];

    expect(safeWorkbenchModuleId('peak-income', true, available)).toBe('peak-income');
    expect(safeWorkbenchModuleId('peak-income', false, available)).toBe('dashboard');
    expect(safeWorkbenchModuleId('peak-ledger', true, available)).toBe('dashboard');
  });
});
