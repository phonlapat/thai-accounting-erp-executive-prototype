import { describe, expect, it } from 'vitest';
import type { PeakSnapshot } from './data';
import { availablePeakPeriods, effectivePeakPeriod, isPeakPeriod, peakCashReconciliation, peakMonthRange, peakYearTH, selectPeakMonths } from './peak-view';

describe('PEAK executive period view', () => {
  const months = [
    { month: '2026-08', value: 8 },
    { month: '2026-03', value: 3 },
    { month: '2026-07', value: 7 },
    { month: '2026-04', value: 4 },
    { month: '2026-06', value: 6 },
    { month: '2026-05', value: 5 },
    { month: '2025-12', value: 12 }
  ];

  it('sorts history and selects the latest requested months without mutating input', () => {
    const original = [...months];
    expect(selectPeakMonths(months, '3').map((item) => item.month)).toEqual(['2026-06', '2026-07', '2026-08']);
    expect(selectPeakMonths(months, '6').map((item) => item.month)).toEqual(['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08']);
    expect(months).toEqual(original);
  });

  it('offers only ranges that reveal a different view', () => {
    expect(availablePeakPeriods(2)).toEqual(['all']);
    expect(availablePeakPeriods(5)).toEqual(['3', 'all']);
    expect(availablePeakPeriods(8)).toEqual(['3', '6', 'all']);
    expect(effectivePeakPeriod('6', 5)).toBe('all');
    expect(effectivePeakPeriod('3', 5)).toBe('3');
  });

  it('formats compact Thai month ranges and the Buddhist year', () => {
    expect(peakMonthRange([{ month: '2026-03' }, { month: '2026-08' }])).toBe('มี.ค.–ส.ค. 69');
    expect(peakMonthRange([{ month: '2025-12' }, { month: '2026-02' }])).toBe('ธ.ค. 68–ก.พ. 69');
    expect(peakMonthRange([])).toBe('—');
    expect(peakYearTH('2026-08-20T00:00:00+07:00')).toBe('2569');
  });

  it('rejects unknown stored preferences', () => {
    expect(isPeakPeriod('3')).toBe(true);
    expect(isPeakPeriod('12')).toBe(false);
    expect(isPeakPeriod(null)).toBe(false);
  });

  it('only requires cash reconciliation when the source evidence does', () => {
    const snapshot = {
      cashChannels: { total: 100, reconciliationRequired: false },
      financialPosition: { cashAndEquivalents: 100 },
      financeAccounts: [],
      qualityFindings: []
    } as unknown as PeakSnapshot;
    expect(peakCashReconciliation(snapshot)).toMatchObject({ required: false, difference: 0 });

    snapshot.financialPosition.cashAndEquivalents = 90;
    expect(peakCashReconciliation(snapshot)).toMatchObject({ required: true, difference: 10 });

    snapshot.financialPosition.cashAndEquivalents = 100;
    snapshot.qualityFindings = [{ key: 'cash-totals', severity: 'warn', title: 'ยอดต่าง', detail: 'ตรวจช่วงวันที่' }];
    expect(peakCashReconciliation(snapshot)).toMatchObject({ required: true, difference: 0, finding: snapshot.qualityFindings[0] });
  });

  it('summarizes optional bank reconciliation work without guessing missing counts', () => {
    const snapshot = {
      cashChannels: { total: 100, reconciliationRequired: false },
      financialPosition: { cashAndEquivalents: 100 },
      financeAccounts: [
        { id: 'cash', type: 'cash', name: 'เงินสด', balance: 10 },
        { id: 'bank-a', type: 'bank', name: 'ธนาคาร ก', balance: 60, reconciliationStatus: 'partial', unmatchedCount: 4 },
        { id: 'bank-b', type: 'bank', name: 'ธนาคาร ข', balance: 30, reconciliationStatus: 'not_started' }
      ],
      qualityFindings: []
    } as unknown as PeakSnapshot;

    expect(peakCashReconciliation(snapshot)).toMatchObject({
      required: true,
      unmatchedCount: 4,
      unmatchedCountKnown: false
    });
    expect(peakCashReconciliation(snapshot).incompleteAccounts).toHaveLength(2);

    snapshot.financeAccounts[2].unmatchedCount = 2;
    expect(peakCashReconciliation(snapshot)).toMatchObject({ unmatchedCount: 6, unmatchedCountKnown: true });

    snapshot.financeAccounts.forEach((account) => {
      if (account.type === 'bank') {
        account.reconciliationStatus = 'complete';
        account.unmatchedCount = 0;
      }
    });
    expect(peakCashReconciliation(snapshot)).toMatchObject({ required: false, unmatchedCount: 0, unmatchedCountKnown: false });
  });
});
