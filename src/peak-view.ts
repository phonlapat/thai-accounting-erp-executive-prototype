import type { PeakBankReconciliationItem, PeakSnapshot } from './data';

export type PeakPeriod = '3' | '6' | 'all';

export const PEAK_PERIOD_KEY = 'siam-erp-peak-period-v1';

export function isPeakPeriod(value: unknown): value is PeakPeriod {
  return value === '3' || value === '6' || value === 'all';
}

export function effectivePeakPeriod(period: PeakPeriod, monthCount: number): PeakPeriod {
  if (period === '3' && monthCount <= 3) return 'all';
  if (period === '6' && monthCount <= 6) return 'all';
  return period;
}

export function availablePeakPeriods(monthCount: number): PeakPeriod[] {
  const periods: PeakPeriod[] = [];
  if (monthCount > 3) periods.push('3');
  if (monthCount > 6) periods.push('6');
  periods.push('all');
  return periods;
}

export function selectPeakMonths<T extends {month: string;}>(months: T[], period: PeakPeriod): T[] {
  const sorted = [...months].sort((left, right) => left.month.localeCompare(right.month));
  if (period === 'all') return sorted;
  return sorted.slice(-Number(period));
}

function shortMonth(month: string): {name: string;year: string;} {
  const parsed = /^(\d{4})-(\d{2})$/.exec(month);
  if (!parsed) return { name: month, year: '' };
  const names = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const monthIndex = Number(parsed[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return { name: month, year: '' };
  return { name: names[monthIndex], year: String(Number(parsed[1]) + 543).slice(-2) };
}

export function peakMonthRange(months: Array<{month: string;}>): string {
  if (!months.length) return '—';
  const sorted = [...months].sort((left, right) => left.month.localeCompare(right.month));
  const first = shortMonth(sorted[0].month);
  const last = shortMonth(sorted[sorted.length - 1].month);
  if (sorted.length === 1) return `${last.name} ${last.year}`.trim();
  if (first.year && first.year === last.year) return `${first.name}–${last.name} ${last.year}`;
  return `${first.name} ${first.year}–${last.name} ${last.year}`.trim();
}

export function peakYearTH(asOf: string): string {
  const year = Number(asOf.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? String(year + 543) : '—';
}

export function peakCashReconciliation(snapshot: PeakSnapshot) {
  const finding = snapshot.qualityFindings.find((item) => item.key === 'cash-totals');
  const difference = snapshot.cashChannels.total - snapshot.financialPosition.cashAndEquivalents;
  const accountEvidence = snapshot.financeAccounts.filter((account) => account.type === 'bank' && account.reconciliationStatus);
  const incompleteAccounts = accountEvidence.filter((account) => account.reconciliationStatus !== 'complete');
  const completeAccounts = accountEvidence.filter((account) => account.reconciliationStatus === 'complete');
  const unmatchedCountKnown = incompleteAccounts.length > 0 && incompleteAccounts.every((account) => account.unmatchedCount !== undefined);
  const unmatchedCount = incompleteAccounts.reduce((sum, account) => sum + (account.unmatchedCount ?? 0), 0);
  return {
    accountEvidence,
    completeAccounts,
    difference,
    finding,
    incompleteAccounts,
    unmatchedCount,
    unmatchedCountKnown,
    required: snapshot.cashChannels.reconciliationRequired || Math.abs(difference) > 0.02 || Boolean(finding) || incompleteAccounts.length > 0
  };
}

export interface PeakBankReviewItem extends PeakBankReconciliationItem {
  accountId: string;
  accountName: string;
  coverage: 'full' | 'sample';
}

export function peakBankReconciliationWorkspace(snapshot: PeakSnapshot) {
  const evidence = snapshot.bankReconciliation ?? [];
  const accounts = new Map(snapshot.financeAccounts.map((account) => [account.id, account]));
  const priority = { high: 0, medium: 1, none: 2 } as const;
  const items: PeakBankReviewItem[] = evidence.flatMap((group) => {
    const account = accounts.get(group.accountId);
    return group.items.map((item) => ({
      ...item,
      accountId: group.accountId,
      accountName: account?.name ?? group.accountId,
      coverage: group.coverage
    }));
  }).sort((left, right) => {
    const leftConfidence = left.candidate?.confidence ?? 'none';
    const rightConfidence = right.candidate?.confidence ?? 'none';
    return priority[leftConfidence] - priority[rightConfidence] || right.date.localeCompare(left.date) || left.id.localeCompare(right.id);
  });
  const highConfidence = items.filter((item) => item.candidate?.confidence === 'high');
  const mediumConfidence = items.filter((item) => item.candidate?.confidence === 'medium');
  const withoutCandidate = items.filter((item) => !item.candidate);
  const amountFor = (direction: PeakBankReviewItem['direction']) => items
    .filter((item) => item.direction === direction)
    .reduce((sum, item) => sum + item.amount, 0);
  return {
    evidence,
    fullCoverageAccounts: evidence.filter((group) => group.coverage === 'full'),
    highConfidence,
    inflowAmount: amountFor('inflow'),
    items,
    mediumConfidence,
    outflowAmount: amountFor('outflow'),
    sampleCoverageAccounts: evidence.filter((group) => group.coverage === 'sample'),
    suggestedItems: [...highConfidence, ...mediumConfidence],
    withoutCandidate
  };
}
