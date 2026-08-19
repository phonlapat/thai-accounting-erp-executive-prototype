import { describe, expect, it } from 'vitest';
import type { PeakSnapshot } from './data';
import { availablePeakPeriods, effectivePeakPeriod, isPeakPeriod, peakBankReconciliationWorkspace, peakCashReconciliation, peakMonthRange, peakPeriodComparison, peakProfitSeries, peakSnapshotAssurance, peakYearTH, selectPeakMonths } from './peak-view';

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
    expect(availablePeakPeriods(13)).toEqual(['3', '6', '12', 'all']);
    expect(effectivePeakPeriod('6', 5)).toBe('all');
    expect(effectivePeakPeriod('12', 12)).toBe('all');
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
    expect(isPeakPeriod('12')).toBe(true);
    expect(isPeakPeriod('24')).toBe(false);
    expect(isPeakPeriod(null)).toBe(false);
  });

  it('compares only equal contiguous closed periods', () => {
    const history = Array.from({ length: 24 }, (_, index) => {
      const date = new Date(Date.UTC(2024, 8 + index, 1));
      return {
        month: date.toISOString().slice(0, 7),
        profit: index < 12 ? 10 : 15
      };
    });
    expect(peakPeriodComparison(history, '12')).toEqual({
      current: 180,
      previous: 120,
      difference: 60,
      changePct: 50
    });
    expect(peakPeriodComparison(history, 'all')).toBeUndefined();

    const withGap = [{ month: '2024-08', profit: 10 }, ...history.filter((item) => item.month !== '2025-09')];
    expect(peakPeriodComparison(withGap, '12')).toBeUndefined();
    expect(peakPeriodComparison(history.map((item, index) => index === 23 ? { ...item, partial: true } : item), '12')).toBeUndefined();
  });

  it('keeps short views monthly and aggregates long history by calendar year without mutation', () => {
    const history = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(Date.UTC(2025, 6 + index, 1));
      return {
        month: date.toISOString().slice(0, 7),
        profit: index < 6 ? 1 : 2,
        ...(index === 13 ? { partial: true } : {})
      };
    }).reverse();
    const original = structuredClone(history);
    const series = peakProfitSeries(history);
    expect(series).toEqual({
      grain: 'year',
      points: [
        { key: '2025', value: 6, partial: true, monthCount: 6 },
        { key: '2026', value: 16, partial: true, monthCount: 8 }
      ]
    });
    expect(peakProfitSeries(history.slice(0, 12)).grain).toBe('month');
    expect(history).toEqual(original);
  });

  it('summarizes snapshot freshness and coverage without inventing a score', () => {
    const now = Date.parse('2026-08-20T03:00:00+07:00');
    const snapshot = {
      asOf: '2026-08-20T02:00:00+07:00',
      monthlyPL: [{ month: '2026-06' }, { month: '2026-07' }, { month: '2026-08' }],
      recentIncomeRows: [{ id: 'income' }], recentExpenseRows: [{ id: 'expense' }],
      sources: [
        { key: 'income', asOf: '2026-08-20T02:00:00+07:00' },
        { key: 'expense', asOf: '2026-08-20T01:00:00+07:00' },
        { key: 'finance', asOf: '2026-08-20T00:00:00+07:00' }
      ],
      qualityFindings: [],
      bankReconciliation: [{ accountId: 'bank', coverage: 'full', items: [{ id: 'bank-item' }] }]
    } as unknown as PeakSnapshot;

    expect(peakSnapshotAssurance(snapshot, now)).toMatchObject({
      status: 'ok', label: 'พร้อมเปิด', historyCount: 3, historyRange: 'มิ.ย.–ส.ค. 69',
      missingMonths: 0, recordCount: 2, sourceCount: 3, agingSources: 0, staleSources: 0,
      fullBankAccounts: 1, sampleBankAccounts: 0, bankCoverageLabel: '1 ครบ', bankItemCount: 1
    });
  });

  it('flags history gaps, stale sources, partial evidence, and high-risk findings explicitly', () => {
    const now = Date.parse('2026-08-20T03:00:00+07:00');
    const snapshot = {
      asOf: '2026-08-20T02:00:00+07:00',
      monthlyPL: [{ month: '2026-05' }, { month: '2026-08' }],
      recentIncomeRows: [], recentExpenseRows: [],
      sources: [
        { key: 'income', asOf: '2026-08-20T02:00:00+07:00' },
        { key: 'expense', asOf: '2026-08-18T02:00:00+07:00' },
        { key: 'finance', asOf: '2026-08-16T02:00:00+07:00' }
      ],
      qualityFindings: [],
      bankReconciliation: [{ accountId: 'bank', coverage: 'sample', items: [] }]
    } as unknown as PeakSnapshot;
    expect(peakSnapshotAssurance(snapshot, now)).toMatchObject({
      status: 'warn', label: 'เปิดได้ · ควรตรวจ', reason: 'ประวัติขาด 2 เดือน',
      missingMonths: 2, agingSources: 1, staleSources: 1, sampleBankAccounts: 1, bankCoverageLabel: '1 ตัวอย่าง'
    });

    snapshot.qualityFindings = [{ key: 'cash', severity: 'bad', title: 'ยอดต่าง', detail: 'ตรวจสอบ' }];
    expect(peakSnapshotAssurance(snapshot, now)).toMatchObject({
      status: 'bad', label: 'เปิดได้ · เสี่ยงสูง', reason: 'ความเสี่ยงสูง 1 จุด', highRiskFindings: 1
    });
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

  it('prioritizes source-backed match candidates and preserves coverage', () => {
    const snapshot = {
      financeAccounts: [
        { id: 'bank-a', type: 'bank', name: 'ธนาคาร ก' },
        { id: 'bank-b', type: 'bank', name: 'ธนาคาร ข' }
      ],
      bankReconciliation: [
        {
          accountId: 'bank-a', coverage: 'full', items: [
            { id: 'none', date: '2026-08-12', description: 'ยังไม่มีคู่', direction: 'outflow', amount: 20 },
            {
              id: 'high', date: '2026-08-10', description: 'พบคู่ชัดเจน', direction: 'inflow', amount: 100,
              candidate: { confidence: 'high' }
            }
          ]
        },
        {
          accountId: 'bank-b', coverage: 'sample', items: [{
            id: 'medium', date: '2026-08-11', description: 'ควรตรวจ', direction: 'outflow', amount: 30,
            candidate: { confidence: 'medium' }
          }]
        }
      ]
    } as unknown as PeakSnapshot;

    const review = peakBankReconciliationWorkspace(snapshot);
    expect(review.items.map((item) => item.id)).toEqual(['high', 'medium', 'none']);
    expect(review.items[0]).toMatchObject({ accountName: 'ธนาคาร ก', coverage: 'full' });
    expect(review).toMatchObject({
      inflowAmount: 100,
      outflowAmount: 50
    });
    expect(review.highConfidence).toHaveLength(1);
    expect(review.mediumConfidence).toHaveLength(1);
    expect(review.withoutCandidate).toHaveLength(1);
    expect(review.fullCoverageAccounts).toHaveLength(1);
    expect(review.sampleCoverageAccounts).toHaveLength(1);
    expect(snapshot.bankReconciliation?.[0].items.map((item) => item.id)).toEqual(['none', 'high']);
  });
});
