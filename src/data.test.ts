import { describe, expect, it } from 'vitest';
import { isPeakSnapshot, peakSnapshotFreshness, sanitizePeakSnapshot } from './data';
import type { PeakSnapshot } from './data';

function validSnapshot(): PeakSnapshot {
  return {
    schemaVersion: 3,
    source: 'PEAK',
    companyName: 'บริษัท ตัวอย่าง จำกัด',
    asOf: '2026-08-12T17:00:00+07:00',
    capturedAt: '2026-08-12T17:30:00+07:00',
    currency: 'THB',
    ytd: { revenue: 1000, expenses: 700, profit: 300 },
    income: {
      issued: 1000, paid: 800, overdue: 200, overdueCount: 1,
      currentMonthSales: 300, currentMonthSalesChangePct: 10,
      expiredQuotation: 0, expiredQuotationCount: 0
    },
    expense: {
      recorded: 700, paid: 600, overdue: 100, overdueCount: 1,
      currentMonthRecorded: 200, currentMonthCount: 2,
      overdueActionAmount: 100, overdueActionCount: 1
    },
    taxes: { pp30: 10, pnd1: 5, pnd3: 2, pnd53: 3 },
    salesMix: { product: 200, service: 100 },
    topCustomers: [{ name: 'ลูกค้า ก', amount: 200 }, { name: 'ลูกค้า ข', amount: 100 }],
    monthlyPL: [
      { month: '2026-07', revenue: 500, expenses: 300, profit: 200 },
      { month: '2026-08', revenue: 500, expenses: 400, profit: 100, partial: true }
    ],
    financialPosition: {
      totalAssets: 1000, currentAssets: 800, nonCurrentAssets: 200,
      totalLiabilities: 300, currentLiabilities: 200, equity: 700,
      currentRatio: 4, debtToEquity: 0.43, debtRatioPct: 30,
      cashAndEquivalents: 600, shortTermLoans: 0, inventory: 100, otherCurrentAssets: 100
    },
    cashChannels: { total: 600, cash: 100, bank: 450, eWallet: 50, reconciliationRequired: false },
    financeAccounts: [
      { id: 'cash', type: 'cash', name: 'เงินสด', balance: 100 },
      { id: 'bank', type: 'bank', name: 'ธนาคาร •••• 1234', balance: 450 },
      { id: 'wallet', type: 'ewallet', name: 'กระเป๋าเงิน', balance: 50 }
    ],
    recentIncomeRows: [],
    recentExpenseRows: [],
    sources: [
      { key: 'income', label: 'รายรับ', asOf: '2026-08-12T17:00:00+07:00', scope: 'รายรับปีปัจจุบัน' },
      { key: 'expense', label: 'รายจ่าย', asOf: '2026-08-12T17:00:00+07:00', scope: 'รายจ่ายปีปัจจุบัน' },
      { key: 'finance', label: 'การเงิน', asOf: '2026-08-12T17:00:00+07:00', scope: 'ยอดเงินคงเหลือ' }
    ],
    insights: {
      quotationAwaitingAmount: 0, quotationAwaitingCount: 0,
      invoiceAlertAmount: 200, invoiceAlertCount: 1
    },
    qualityFindings: [],
    notes: ['ตัวอย่างสำหรับการทดสอบเท่านั้น']
  };
}

describe('PEAK snapshot boundary', () => {
  it('accepts a balanced schema v3 snapshot', () => {
    expect(isPeakSnapshot(validSnapshot())).toBe(true);
  });

  it('removes unknown top-level and nested fields', () => {
    const input = validSnapshot() as PeakSnapshot & { accessToken?: string };
    input.accessToken = 'must-not-survive';
    (input.ytd as PeakSnapshot['ytd'] & { privateMemo?: string }).privateMemo = 'must-not-survive';

    const clean = sanitizePeakSnapshot(input);

    expect(clean).toBeDefined();
    expect(clean).not.toHaveProperty('accessToken');
    expect(clean?.ytd).not.toHaveProperty('privateMemo');
    expect(input).toHaveProperty('accessToken');
  });

  it('rejects an unmasked bank account number', () => {
    const input = validSnapshot();
    input.financeAccounts[1].name = 'ธนาคาร 1234567890';
    expect(sanitizePeakSnapshot(input)).toBeUndefined();
  });

  it('rejects inconsistent financial arithmetic', () => {
    const input = validSnapshot();
    input.ytd.profit = 999;
    expect(isPeakSnapshot(input)).toBe(false);
  });
});

describe('snapshot freshness', () => {
  const capturedAt = '2026-08-12T00:00:00.000Z';

  it('marks snapshots within 24 hours as fresh', () => {
    expect(peakSnapshotFreshness(capturedAt, Date.parse('2026-08-12T23:59:00.000Z')).status).toBe('fresh');
  });

  it('marks snapshots between 24 and 72 hours as aging', () => {
    expect(peakSnapshotFreshness(capturedAt, Date.parse('2026-08-14T00:00:00.000Z')).status).toBe('aging');
  });

  it('marks snapshots older than 72 hours as stale', () => {
    expect(peakSnapshotFreshness(capturedAt, Date.parse('2026-08-16T00:00:00.000Z')).status).toBe('stale');
  });
});
