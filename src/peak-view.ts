import { peakSnapshotFreshness } from './data';
import type { PeakBankReconciliationItem, PeakSnapshot, PeakStatementEntry, PeakStatementMetric, Tone } from './data';

export type PeakPeriod = '3' | '6' | '12' | 'all';

export const PEAK_PERIOD_KEY = 'siam-erp-peak-period-v1';

export function isPeakPeriod(value: unknown): value is PeakPeriod {
  return value === '3' || value === '6' || value === '12' || value === 'all';
}

export function effectivePeakPeriod(period: PeakPeriod, monthCount: number): PeakPeriod {
  if (period !== 'all' && monthCount <= Number(period)) return 'all';
  return period;
}

export function availablePeakPeriods(monthCount: number): PeakPeriod[] {
  const periods: PeakPeriod[] = [];
  if (monthCount > 3) periods.push('3');
  if (monthCount > 6) periods.push('6');
  if (monthCount > 12) periods.push('12');
  periods.push('all');
  return periods;
}

export function selectPeakMonths<T extends {month: string;}>(months: T[], period: PeakPeriod): T[] {
  const sorted = [...months].sort((left, right) => left.month.localeCompare(right.month));
  if (period === 'all') return sorted;
  return sorted.slice(-Number(period));
}

interface PeakProfitMonth {month: string;profit: number;partial?: boolean;}

export interface PeakProfitPoint {
  key: string;
  value: number;
  partial: boolean;
  monthCount: number;
}

export interface PeakProfitSeries {
  grain: 'month' | 'year';
  points: PeakProfitPoint[];
}

function monthIndex(month: string): number | undefined {
  const parsed = /^(\d{4})-(\d{2})$/.exec(month);
  if (!parsed) return undefined;
  const year = Number(parsed[1]);
  const monthNumber = Number(parsed[2]);
  if (!Number.isInteger(year) || monthNumber < 1 || monthNumber > 12) return undefined;
  return year * 12 + monthNumber - 1;
}

function isContiguous(months: PeakProfitMonth[]): boolean {
  return months.every((item, index) => {
    if (index === 0) return monthIndex(item.month) !== undefined;
    const current = monthIndex(item.month);
    const previous = monthIndex(months[index - 1].month);
    return current !== undefined && previous !== undefined && current === previous + 1;
  });
}

/** Compare two equal, contiguous, closed periods. Missing or open months stay unknown. */
export function peakPeriodComparison(months: PeakProfitMonth[], period: PeakPeriod) {
  if (period === 'all') return undefined;
  const size = Number(period);
  const sorted = [...months].sort((left, right) => left.month.localeCompare(right.month));
  if (sorted.length < size * 2) return undefined;
  const window = sorted.slice(-size * 2);
  if (!isContiguous(window) || window.some((item) => item.partial)) return undefined;
  const previous = window.slice(0, size).reduce((sum, item) => sum + item.profit, 0);
  const current = window.slice(size).reduce((sum, item) => sum + item.profit, 0);
  const difference = current - previous;
  return {
    current,
    previous,
    difference,
    changePct: previous === 0 ? undefined : difference / Math.abs(previous) * 100
  };
}

/** Keep monthly detail for short views and aggregate long history to compact yearly marks. */
export function peakProfitSeries(months: PeakProfitMonth[]): PeakProfitSeries {
  const sorted = [...months].sort((left, right) => left.month.localeCompare(right.month));
  if (sorted.length <= 12) {
    return {
      grain: 'month',
      points: sorted.map((item) => ({
        key: item.month,
        value: item.profit,
        partial: Boolean(item.partial),
        monthCount: 1
      }))
    };
  }
  const byYear = new Map<string, PeakProfitMonth[]>();
  sorted.forEach((item) => {
    const year = item.month.slice(0, 4);
    byYear.set(year, [...(byYear.get(year) ?? []), item]);
  });
  return {
    grain: 'year',
    points: Array.from(byYear, ([key, rows]) => ({
      key,
      value: rows.reduce((sum, item) => sum + item.profit, 0),
      partial: rows.length < 12 || rows.some((item) => item.partial),
      monthCount: rows.length
    }))
  };
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

export interface PeakSnapshotAssurance {
  status: Extract<Tone, 'ok' | 'warn' | 'bad'>;
  label: string;
  reason: string;
  freshness: ReturnType<typeof peakSnapshotFreshness>;
  historyCount: number;
  historyRange: string;
  missingMonths: number;
  recordCount: number;
  sourceCount: number;
  agingSources: number;
  staleSources: number;
  findingCount: number;
  highRiskFindings: number;
  fullBankAccounts: number;
  sampleBankAccounts: number;
  bankCoverageLabel: string;
  bankItemCount: number;
  fullStatementLines: number;
  sampleStatementLines: number;
  statementCoverageLabel: string;
  statementEntryCount: number;
}

/** Summarize objective snapshot coverage without turning missing evidence into a score. */
export function peakSnapshotAssurance(snapshot: PeakSnapshot, now = Date.now()): PeakSnapshotAssurance {
  const months = [...snapshot.monthlyPL].sort((left, right) => left.month.localeCompare(right.month));
  const missingMonths = months.slice(1).reduce((sum, item, index) => {
    const current = monthIndex(item.month);
    const previous = monthIndex(months[index].month);
    return current === undefined || previous === undefined ? sum : sum + Math.max(0, current - previous - 1);
  }, 0);
  const sourceFreshness = snapshot.sources.map((source) => peakSnapshotFreshness(source.asOf, now));
  const agingSources = sourceFreshness.filter((item) => item.status === 'aging').length;
  const staleSources = sourceFreshness.filter((item) => item.status === 'stale').length;
  const fullBankAccounts = (snapshot.bankReconciliation ?? []).filter((group) => group.coverage === 'full').length;
  const sampleBankAccounts = (snapshot.bankReconciliation ?? []).filter((group) => group.coverage === 'sample').length;
  const bankCoverageLabel = [
    fullBankAccounts ? `${fullBankAccounts} ครบ` : '',
    sampleBankAccounts ? `${sampleBankAccounts} ตัวอย่าง` : ''
  ].filter(Boolean).join(' · ');
  const bankItemCount = (snapshot.bankReconciliation ?? []).reduce((sum, group) => sum + group.items.length, 0);
  const fullStatementLines = (snapshot.statementEvidence ?? []).filter((group) => group.coverage === 'full').length;
  const sampleStatementLines = (snapshot.statementEvidence ?? []).filter((group) => group.coverage === 'sample').length;
  const statementCoverageLabel = [
    fullStatementLines ? `${fullStatementLines} ครบ` : '',
    sampleStatementLines ? `${sampleStatementLines} ตัวอย่าง` : ''
  ].filter(Boolean).join(' · ');
  const statementEntryCount = (snapshot.statementEvidence ?? []).reduce((sum, group) => sum + group.entries.length, 0);
  const freshness = peakSnapshotFreshness(snapshot.asOf, now);
  const highRiskFindings = snapshot.qualityFindings.filter((finding) => finding.severity === 'bad').length;
  const findingCount = snapshot.qualityFindings.length;
  const status: PeakSnapshotAssurance['status'] = highRiskFindings > 0 || freshness.status === 'stale'
    ? 'bad'
    : findingCount > 0 || freshness.status === 'aging' || missingMonths > 0 || agingSources > 0 || staleSources > 0 || sampleBankAccounts > 0 || sampleStatementLines > 0
      ? 'warn'
      : 'ok';
  const reason = highRiskFindings > 0 ? `ความเสี่ยงสูง ${highRiskFindings} จุด`
    : freshness.status !== 'fresh' ? freshness.label
      : findingCount > 0 ? `ต้องตรวจ ${findingCount} จุด`
        : missingMonths > 0 ? `ประวัติขาด ${missingMonths} เดือน`
          : staleSources > 0 || agingSources > 0 ? `แหล่งข้อมูลช้า ${staleSources + agingSources} หน้า`
            : sampleBankAccounts > 0 ? `หลักฐานธนาคารบางส่วน ${sampleBankAccounts} บัญชี`
              : sampleStatementLines > 0 ? `ที่มางบบางส่วน ${sampleStatementLines} บรรทัด`
              : 'โครงสร้างและตัวเลขผ่านการตรวจ';
  return {
    status,
    label: status === 'ok' ? 'พร้อมเปิด' : status === 'bad' ? 'เปิดได้ · เสี่ยงสูง' : 'เปิดได้ · ควรตรวจ',
    reason,
    freshness,
    historyCount: months.length,
    historyRange: peakMonthRange(months),
    missingMonths,
    recordCount: snapshot.recentIncomeRows.length + snapshot.recentExpenseRows.length,
    sourceCount: snapshot.sources.length,
    agingSources,
    staleSources,
    findingCount,
    highRiskFindings,
    fullBankAccounts,
    sampleBankAccounts,
    bankCoverageLabel,
    bankItemCount,
    fullStatementLines,
    sampleStatementLines,
    statementCoverageLabel,
    statementEntryCount
  };
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

const STATEMENT_METRIC_ORDER: Record<PeakStatementMetric, number> = {
  ytd_revenue: 0,
  ytd_expenses: 1,
  cash_and_equivalents: 2,
  total_assets: 3,
  total_liabilities: 4,
  equity: 5
};

export interface PeakStatementReviewItem extends PeakStatementEntry {
  lineId: string;
  lineLabel: string;
  metric: PeakStatementMetric;
  periodStart?: string;
  periodEnd: string;
  lineAmount: number;
  coverage: 'full' | 'sample';
}

/** Flatten only inspected statement evidence while preserving statement-line grain and coverage. */
export function peakStatementWorkspace(snapshot: PeakSnapshot) {
  const evidence = [...(snapshot.statementEvidence ?? [])].sort((left, right) =>
    STATEMENT_METRIC_ORDER[left.metric] - STATEMENT_METRIC_ORDER[right.metric] || left.id.localeCompare(right.id)
  );
  const items: PeakStatementReviewItem[] = evidence.flatMap((group) => group.entries.map((entry) => ({
    ...entry,
    lineId: group.id,
    lineLabel: group.label,
    metric: group.metric,
    ...(group.periodStart === undefined ? {} : { periodStart: group.periodStart }),
    periodEnd: group.periodEnd,
    lineAmount: group.amount,
    coverage: group.coverage
  }))).sort((left, right) =>
    STATEMENT_METRIC_ORDER[left.metric] - STATEMENT_METRIC_ORDER[right.metric] ||
    right.date.localeCompare(left.date) || left.journalNo.localeCompare(right.journalNo) || left.id.localeCompare(right.id)
  );
  return {
    evidence,
    items,
    fullLines: evidence.filter((group) => group.coverage === 'full'),
    sampleLines: evidence.filter((group) => group.coverage === 'sample')
  };
}
