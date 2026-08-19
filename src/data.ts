/* Thai accounting + ERP prototype — types, THB/VAT math, status vocabulary */

export const TODAY = '2026-07-31';
export const MONTH = '2026-07';
export const MONTHS = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
export const WH = [
{ id: 'wh1', name: 'คลังสาทร (สำนักงานใหญ่)' },
{ id: 'wh2', name: 'คลังบางปะอิน' }];


export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'muted';
export type DocKind = 'quote' | 'invoice' | 'receipt' | 'po' | 'bill';

export interface Line {desc: string;qty: number;unit: string;price: number;vat: number;acct: string;pid?: string;}
export interface Doc {
  id: string;no: string;kind: DocKind;contactId: string;date: string;due: string;
  lines: Line[];wht: number;status: string;paid: number;
  ref?: string;projectId?: string;pid?: string;qty?: number;wh?: string;received?: boolean;
  reminderCount?: number;lastReminderAt?: string;
}
export interface Contact {
  id: string;code: string;type: 'customer' | 'supplier';nameTh: string;nameEn: string;
  taxId: string;person: string;phone: string;credit: number;
}
export interface Product {
  id: string;code: string;nameTh: string;nameEn: string;kind: 'product' | 'service';
  unit: string;price: number;cost: number;reorder: number;wh1: number;wh2: number;acct: string;
}
export interface Expense {
  id: string;no: string;employeeId: string;category: string;acct: string;date: string;
  amount: number;vat: number;status: string;projectId?: string;note?: string;
}
export interface BankAcct {id: string;nameTh: string;bank: string;no: string;opening: number;reconciled?: string;}
export interface BankTxn {id: string;accountId: string;date: string;desc: string;amount: number;matched: boolean;ref?: string;}
export interface JLine {account: string;debit: number;credit: number;memo?: string;}
export interface Journal {id: string;no: string;date: string;desc: string;lines: JLine[];status: 'draft' | 'posted';source: string;}
export interface Account {code: string;nameTh: string;type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';opening: number;}
export interface Employee {id: string;code: string;name: string;position: string;dept: string;salary: number;allowance: number;whtRate: number;}
export interface PayItem {employeeId: string;gross: number;allowance: number;sso: number;wht: number;net: number;}
export interface PayRun {id: string;period: string;payDate: string;status: string;items: PayItem[];}
export interface Asset {id: string;code: string;name: string;category: string;date: string;cost: number;salvage: number;life: number;location: string;status: string;}
export interface Project {id: string;code: string;nameTh: string;owner: string;budget: number;status: string;progress: number;}
export interface Approval {id: string;kind: 'bill' | 'expense' | 'payroll' | 'journal';refId: string;refNo: string;title: string;amount: number;requester: string;date: string;status: string;note?: string;}
export interface Activity {id: string;at: string;actor: string;text: string;module: string;}

/** A private, browser-local executive snapshot imported from PEAK. */
export type PeakRecordStatus = 'paid' | 'voided' | 'outstanding' | 'overdue' | 'await_receipt';
export type PeakBankReconciliationStatus = 'not_started' | 'partial' | 'complete';
export type PeakBankDirection = 'inflow' | 'outflow';
export type PeakMatchConfidence = 'high' | 'medium';
export type PeakMatchSignal = 'amount' | 'date' | 'reference' | 'party';
export interface PeakRecordRow {
  id: string;documentNo: string;party: string;issueDate: string;amount: number;
  status: PeakRecordStatus;activity: string;activityAt: string;
}
export interface PeakFinanceAccount {
  id: string;type: 'cash' | 'bank' | 'ewallet';name: string;balance: number;
  reconciliationStatus?: PeakBankReconciliationStatus;unmatchedCount?: number;lastReconciledAt?: string;
}
export interface PeakMatchCandidate {
  kind: 'income' | 'expense' | 'journal';documentNo: string;party?: string;issueDate: string;
  amount: number;confidence: PeakMatchConfidence;signals: PeakMatchSignal[];
}
export interface PeakBankReconciliationItem {
  id: string;date: string;description: string;direction: PeakBankDirection;amount: number;
  reference?: string;candidate?: PeakMatchCandidate;
}
export interface PeakBankReconciliationEvidence {
  accountId: string;coverage: 'full' | 'sample';items: PeakBankReconciliationItem[];
}
export interface PeakSourceFreshness {
  key: string;label: string;asOf: string;scope: string;
}
export type PeakFreshnessStatus = 'fresh' | 'aging' | 'stale';
export interface PeakFreshness {
  status: PeakFreshnessStatus;ageHours: number;label: string;
}
export interface PeakSnapshot {
  schemaVersion: 3;
  source: 'PEAK';
  companyName: string;
  asOf: string;
  capturedAt: string;
  currency: 'THB';
  ytd: {revenue: number;expenses: number;profit: number;};
  income: {
    issued: number;paid: number;overdue: number;overdueCount: number;
    currentMonthSales: number;currentMonthSalesChangePct: number;
    expiredQuotation: number;expiredQuotationCount: number;
  };
  expense: {
    recorded: number;paid: number;overdue: number;overdueCount: number;
    currentMonthRecorded: number;currentMonthCount: number;
    overdueActionAmount: number;overdueActionCount: number;
  };
  taxes: {pp30: number;pnd1: number;pnd3: number;pnd53: number;};
  salesMix: {product: number;service: number;};
  topCustomers: Array<{name: string;amount: number;}>;
  monthlyPL: Array<{month: string;revenue: number;expenses: number;profit: number;partial?: boolean;}>;
  financialPosition: {
    totalAssets: number;currentAssets: number;nonCurrentAssets: number;
    totalLiabilities: number;currentLiabilities: number;equity: number;
    currentRatio: number;debtToEquity: number;debtRatioPct: number;
    cashAndEquivalents: number;shortTermLoans: number;inventory: number;otherCurrentAssets: number;
  };
  cashChannels: {
    total: number;cash: number;bank: number;eWallet: number;reconciliationRequired: boolean;
  };
  financeAccounts: PeakFinanceAccount[];
  bankReconciliation?: PeakBankReconciliationEvidence[];
  recentIncomeRows: PeakRecordRow[];
  recentExpenseRows: PeakRecordRow[];
  sources: PeakSourceFreshness[];
  insights: {
    quotationAwaitingAmount: number;quotationAwaitingCount: number;
    invoiceAlertAmount: number;invoiceAlertCount: number;
  };
  qualityFindings: Array<{
    key: string;severity: 'warn' | 'bad';title: string;detail: string;
  }>;
  notes?: string[];
}

export interface AppData {
  company: {nameTh: string;nameEn: string;taxId: string;address: string;};
  contacts: Contact[];products: Product[];docs: Doc[];expenses: Expense[];
  bankAccts: BankAcct[];bankTxns: BankTxn[];journals: Journal[];accounts: Account[];
  employees: Employee[];payroll: PayRun[];assets: Asset[];projects: Project[];
  approvals: Approval[];activities: Activity[];
  settings: {closedThrough: string;threshold: number;};
  peakSnapshot?: PeakSnapshot;
}

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const nonNegative = (value: unknown) => finite(value) && value >= 0;
const wholeNonNegative = (value: unknown) => Number.isInteger(value) && Number(value) >= 0;
const near = (left: number, right: number) => Math.abs(left - right) <= 0.02;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/** Validate imported PEAK snapshots before they reach application state. */
export function isPeakSnapshot(value: unknown, now = Date.now()): value is PeakSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<PeakSnapshot>;
  if (snapshot.schemaVersion !== 3 || snapshot.source !== 'PEAK' || snapshot.currency !== 'THB') return false;
  if (typeof snapshot.companyName !== 'string' || !snapshot.companyName.trim() || snapshot.companyName.length > 120) return false;
  if (typeof snapshot.asOf !== 'string' || !Number.isFinite(Date.parse(snapshot.asOf))) return false;
  if (typeof snapshot.capturedAt !== 'string' || !Number.isFinite(Date.parse(snapshot.capturedAt))) return false;
  const asOfTime = Date.parse(snapshot.asOf);
  const capturedTime = Date.parse(snapshot.capturedAt);
  const capturedDayTH = new Date(capturedTime + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (asOfTime > now + MAX_CLOCK_SKEW_MS || capturedTime > now + MAX_CLOCK_SKEW_MS) return false;
  if (asOfTime > capturedTime + MAX_CLOCK_SKEW_MS) return false;
  if (!snapshot.ytd || !snapshot.income || !snapshot.expense || !snapshot.taxes || !snapshot.salesMix ||
    !snapshot.financialPosition || !snapshot.cashChannels || !snapshot.insights) return false;
  const nonNegativeMeasures = [
    snapshot.ytd.revenue, snapshot.ytd.expenses,
    snapshot.income.issued, snapshot.income.paid, snapshot.income.overdue,
    snapshot.income.currentMonthSales, snapshot.income.expiredQuotation,
    snapshot.expense.recorded, snapshot.expense.paid, snapshot.expense.overdue,
    snapshot.expense.currentMonthRecorded, snapshot.expense.overdueActionAmount,
    snapshot.taxes.pp30, snapshot.taxes.pnd1, snapshot.taxes.pnd3, snapshot.taxes.pnd53,
    snapshot.salesMix.product, snapshot.salesMix.service
  ];
  if (!nonNegativeMeasures.every(nonNegative) || !finite(snapshot.ytd.profit) || !finite(snapshot.income.currentMonthSalesChangePct)) return false;
  const counts = [snapshot.income.overdueCount, snapshot.income.expiredQuotationCount, snapshot.expense.overdueCount, snapshot.expense.currentMonthCount, snapshot.expense.overdueActionCount];
  if (!counts.every(wholeNonNegative)) return false;
  if (!near(snapshot.ytd.revenue - snapshot.ytd.expenses, snapshot.ytd.profit)) return false;
  if (!near(snapshot.income.issued - snapshot.income.paid, snapshot.income.overdue)) return false;
  if (!near(snapshot.expense.recorded - snapshot.expense.paid, snapshot.expense.overdue)) return false;
  if (!near(snapshot.salesMix.product + snapshot.salesMix.service, snapshot.income.currentMonthSales)) return false;
  if (!Array.isArray(snapshot.topCustomers) || snapshot.topCustomers.length > 20 || !snapshot.topCustomers.every((customer) =>
    Boolean(customer && typeof customer.name === 'string' && customer.name.trim() && customer.name.length <= 160 && nonNegative(customer.amount))
  )) return false;
  if (!near(snapshot.topCustomers.reduce((sum, customer) => sum + customer.amount, 0), snapshot.income.currentMonthSales)) return false;
  if (!Array.isArray(snapshot.monthlyPL) || snapshot.monthlyPL.length < 2 || snapshot.monthlyPL.length > 60) return false;
  if (!snapshot.monthlyPL.every((month) => Boolean(month && /^\d{4}-\d{2}$/.test(month.month) &&
    nonNegative(month.revenue) && nonNegative(month.expenses) && finite(month.profit) &&
    near(month.revenue - month.expenses, month.profit) &&
    (month.partial === undefined || typeof month.partial === 'boolean')))) return false;
  if (new Set(snapshot.monthlyPL.map((month) => month.month)).size !== snapshot.monthlyPL.length) return false;
  const positionNonNegative = [
    snapshot.financialPosition.totalAssets, snapshot.financialPosition.currentAssets,
    snapshot.financialPosition.nonCurrentAssets, snapshot.financialPosition.totalLiabilities,
    snapshot.financialPosition.currentLiabilities, snapshot.financialPosition.equity,
    snapshot.financialPosition.currentRatio, snapshot.financialPosition.debtToEquity,
    snapshot.financialPosition.debtRatioPct, snapshot.financialPosition.shortTermLoans,
    snapshot.financialPosition.inventory, snapshot.financialPosition.otherCurrentAssets
  ];
  if (!positionNonNegative.every(nonNegative) || !finite(snapshot.financialPosition.cashAndEquivalents)) return false;
  if (!near(snapshot.financialPosition.currentAssets + snapshot.financialPosition.nonCurrentAssets, snapshot.financialPosition.totalAssets)) return false;
  if (!near(snapshot.financialPosition.totalLiabilities + snapshot.financialPosition.equity, snapshot.financialPosition.totalAssets)) return false;
  const channelMeasures = [snapshot.cashChannels.total, snapshot.cashChannels.cash, snapshot.cashChannels.bank, snapshot.cashChannels.eWallet];
  if (!channelMeasures.every(finite) || typeof snapshot.cashChannels.reconciliationRequired !== 'boolean') return false;
  if (!near(snapshot.cashChannels.cash + snapshot.cashChannels.bank + snapshot.cashChannels.eWallet, snapshot.cashChannels.total)) return false;
  if (!Array.isArray(snapshot.financeAccounts) || snapshot.financeAccounts.length < 3 || snapshot.financeAccounts.length > 20) return false;
  const financeAccounts = snapshot.financeAccounts;
  if (!financeAccounts.every((account) => Boolean(account && typeof account.id === 'string' && account.id.length <= 60 &&
    (account.type === 'cash' || account.type === 'bank' || account.type === 'ewallet') &&
    typeof account.name === 'string' && account.name.trim() && account.name.length <= 120 && finite(account.balance)))) return false;
  if (financeAccounts.some((account) => {
    const hasReconciliationEvidence = account.reconciliationStatus !== undefined || account.unmatchedCount !== undefined || account.lastReconciledAt !== undefined;
    if (!hasReconciliationEvidence) return false;
    if (account.type !== 'bank' || !['not_started', 'partial', 'complete'].includes(account.reconciliationStatus ?? '')) return true;
    if (account.unmatchedCount !== undefined && !wholeNonNegative(account.unmatchedCount)) return true;
    if (account.reconciliationStatus === 'complete' && account.unmatchedCount !== undefined && account.unmatchedCount !== 0) return true;
    if (account.lastReconciledAt !== undefined) {
      const reconciledTime = Date.parse(account.lastReconciledAt);
      if (!Number.isFinite(reconciledTime) || reconciledTime > capturedTime + MAX_CLOCK_SKEW_MS || account.reconciliationStatus === 'not_started') return true;
    }
    return false;
  })) return false;
  if (financeAccounts.some((account) => account.type === 'bank' && /\d{6,}/.test(account.name))) return false;
  if (new Set(financeAccounts.map((account) => account.id)).size !== financeAccounts.length) return false;
  if (!near(financeAccounts.reduce((sum, account) => sum + account.balance, 0), snapshot.cashChannels.total)) return false;
  const accountTypeTotal = (type: PeakFinanceAccount['type']) => financeAccounts.filter((account) => account.type === type).reduce((sum, account) => sum + account.balance, 0);
  if (!near(accountTypeTotal('cash'), snapshot.cashChannels.cash) || !near(accountTypeTotal('bank'), snapshot.cashChannels.bank) || !near(accountTypeTotal('ewallet'), snapshot.cashChannels.eWallet)) return false;
  if (snapshot.bankReconciliation !== undefined) {
    if (!Array.isArray(snapshot.bankReconciliation) || snapshot.bankReconciliation.length > 20) return false;
    if (new Set(snapshot.bankReconciliation.map((evidence) => evidence?.accountId)).size !== snapshot.bankReconciliation.length) return false;
    const allItemIds: string[] = [];
    let itemCount = 0;
    for (const evidence of snapshot.bankReconciliation) {
      if (!evidence || typeof evidence.accountId !== 'string' || !['full', 'sample'].includes(evidence.coverage) || !Array.isArray(evidence.items)) return false;
      const account = financeAccounts.find((candidate) => candidate.id === evidence.accountId);
      if (!account || account.type !== 'bank' || !account.reconciliationStatus || account.reconciliationStatus === 'complete') return false;
      if (evidence.items.length > 200) return false;
      itemCount += evidence.items.length;
      if (itemCount > 200) return false;
      if (evidence.coverage === 'full' && (account.unmatchedCount === undefined || account.unmatchedCount !== evidence.items.length)) return false;
      if (evidence.coverage === 'sample' && account.unmatchedCount !== undefined && evidence.items.length > account.unmatchedCount) return false;
      for (const item of evidence.items) {
        if (!item || typeof item.id !== 'string' || !item.id.trim() || item.id.length > 100 ||
          !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || item.date > capturedDayTH ||
          typeof item.description !== 'string' || !item.description.trim() || item.description.length > 200 ||
          !['inflow', 'outflow'].includes(item.direction) || !finite(item.amount) || item.amount <= 0 ||
          (item.reference !== undefined && (typeof item.reference !== 'string' || !item.reference.trim() || item.reference.length > 100))) return false;
        allItemIds.push(item.id);
        if (item.candidate !== undefined) {
          const candidate = item.candidate;
          if (!candidate || !['income', 'expense', 'journal'].includes(candidate.kind) ||
            typeof candidate.documentNo !== 'string' || !candidate.documentNo.trim() || candidate.documentNo.length > 80 ||
            (candidate.party !== undefined && (typeof candidate.party !== 'string' || !candidate.party.trim() || candidate.party.length > 200)) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(candidate.issueDate) || candidate.issueDate > capturedDayTH ||
            !finite(candidate.amount) || candidate.amount <= 0 || !['high', 'medium'].includes(candidate.confidence) ||
            !Array.isArray(candidate.signals) || candidate.signals.length < 2 || candidate.signals.length > 4 ||
            !candidate.signals.every((signal) => ['amount', 'date', 'reference', 'party'].includes(signal)) ||
            new Set(candidate.signals).size !== candidate.signals.length ||
            (candidate.confidence === 'high' && candidate.signals.length < 3) ||
            (candidate.signals.includes('amount') && !near(candidate.amount, item.amount)) ||
            (candidate.signals.includes('reference') && item.reference === undefined) ||
            (candidate.signals.includes('party') && candidate.party === undefined)) return false;
        }
      }
    }
    if (new Set(allItemIds).size !== allItemIds.length) return false;
  }
  const validRecordRows = (rows: PeakRecordRow[] | undefined) => Array.isArray(rows) && rows.length <= 50 && rows.every((row) => Boolean(
    row && typeof row.id === 'string' && row.id.length <= 100 && typeof row.documentNo === 'string' && row.documentNo.trim() && row.documentNo.length <= 80 &&
    typeof row.party === 'string' && row.party.trim() && row.party.length <= 200 && /^\d{4}-\d{2}-\d{2}$/.test(row.issueDate) &&
    nonNegative(row.amount) && ['paid', 'voided', 'outstanding', 'overdue', 'await_receipt'].includes(row.status) &&
    typeof row.activity === 'string' && row.activity.trim() && row.activity.length <= 120 &&
    typeof row.activityAt === 'string' && Number.isFinite(Date.parse(row.activityAt)) && Date.parse(row.activityAt) <= capturedTime + MAX_CLOCK_SKEW_MS
  )) && new Set(rows.map((row) => row.id)).size === rows.length;
  if (!validRecordRows(snapshot.recentIncomeRows) || !validRecordRows(snapshot.recentExpenseRows)) return false;
  if (!Array.isArray(snapshot.sources) || snapshot.sources.length < 3 || snapshot.sources.length > 12 || !snapshot.sources.every((source) => Boolean(
    source && typeof source.key === 'string' && source.key.length <= 60 && typeof source.label === 'string' && source.label.trim() && source.label.length <= 120 &&
    typeof source.asOf === 'string' && Number.isFinite(Date.parse(source.asOf)) && Date.parse(source.asOf) <= capturedTime + MAX_CLOCK_SKEW_MS &&
    typeof source.scope === 'string' && source.scope.trim() && source.scope.length <= 240
  ))) return false;
  if (new Set(snapshot.sources.map((source) => source.key)).size !== snapshot.sources.length) return false;
  const insightMeasures = [snapshot.insights.quotationAwaitingAmount, snapshot.insights.invoiceAlertAmount];
  const insightCounts = [snapshot.insights.quotationAwaitingCount, snapshot.insights.invoiceAlertCount];
  if (!insightMeasures.every(nonNegative) || !insightCounts.every(wholeNonNegative)) return false;
  if (!Array.isArray(snapshot.qualityFindings) || snapshot.qualityFindings.length > 8 || !snapshot.qualityFindings.every((finding) =>
    Boolean(finding && typeof finding.key === 'string' && finding.key.length <= 60 &&
      (finding.severity === 'warn' || finding.severity === 'bad') &&
      typeof finding.title === 'string' && finding.title.trim() && finding.title.length <= 120 &&
      typeof finding.detail === 'string' && finding.detail.trim() && finding.detail.length <= 500)
  )) return false;
  return snapshot.notes === undefined || (Array.isArray(snapshot.notes) && snapshot.notes.length <= 12 && snapshot.notes.every((note) => typeof note === 'string' && note.length <= 500));
}

/** Keep only audited fields so unknown or accidental private data never persists. */
export function sanitizePeakSnapshot(value: unknown): PeakSnapshot | undefined {
  if (!isPeakSnapshot(value)) return undefined;
  return {
    schemaVersion: 3,
    source: 'PEAK',
    companyName: value.companyName,
    asOf: value.asOf,
    capturedAt: value.capturedAt,
    currency: 'THB',
    ytd: { revenue: value.ytd.revenue, expenses: value.ytd.expenses, profit: value.ytd.profit },
    income: {
      issued: value.income.issued, paid: value.income.paid, overdue: value.income.overdue,
      overdueCount: value.income.overdueCount, currentMonthSales: value.income.currentMonthSales,
      currentMonthSalesChangePct: value.income.currentMonthSalesChangePct,
      expiredQuotation: value.income.expiredQuotation, expiredQuotationCount: value.income.expiredQuotationCount
    },
    expense: {
      recorded: value.expense.recorded, paid: value.expense.paid, overdue: value.expense.overdue,
      overdueCount: value.expense.overdueCount, currentMonthRecorded: value.expense.currentMonthRecorded,
      currentMonthCount: value.expense.currentMonthCount, overdueActionAmount: value.expense.overdueActionAmount,
      overdueActionCount: value.expense.overdueActionCount
    },
    taxes: { pp30: value.taxes.pp30, pnd1: value.taxes.pnd1, pnd3: value.taxes.pnd3, pnd53: value.taxes.pnd53 },
    salesMix: { product: value.salesMix.product, service: value.salesMix.service },
    topCustomers: value.topCustomers.map((customer) => ({ name: customer.name, amount: customer.amount })),
    monthlyPL: value.monthlyPL.map((month) => ({
      month: month.month, revenue: month.revenue, expenses: month.expenses, profit: month.profit,
      ...(month.partial === undefined ? {} : { partial: month.partial })
    })),
    financialPosition: {
      totalAssets: value.financialPosition.totalAssets, currentAssets: value.financialPosition.currentAssets,
      nonCurrentAssets: value.financialPosition.nonCurrentAssets, totalLiabilities: value.financialPosition.totalLiabilities,
      currentLiabilities: value.financialPosition.currentLiabilities, equity: value.financialPosition.equity,
      currentRatio: value.financialPosition.currentRatio, debtToEquity: value.financialPosition.debtToEquity,
      debtRatioPct: value.financialPosition.debtRatioPct, cashAndEquivalents: value.financialPosition.cashAndEquivalents,
      shortTermLoans: value.financialPosition.shortTermLoans, inventory: value.financialPosition.inventory,
      otherCurrentAssets: value.financialPosition.otherCurrentAssets
    },
    cashChannels: {
      total: value.cashChannels.total, cash: value.cashChannels.cash, bank: value.cashChannels.bank,
      eWallet: value.cashChannels.eWallet, reconciliationRequired: value.cashChannels.reconciliationRequired
    },
    financeAccounts: value.financeAccounts.map((account) => ({
      id: account.id, type: account.type, name: account.name, balance: account.balance,
      ...(account.reconciliationStatus === undefined ? {} : { reconciliationStatus: account.reconciliationStatus }),
      ...(account.unmatchedCount === undefined ? {} : { unmatchedCount: account.unmatchedCount }),
      ...(account.lastReconciledAt === undefined ? {} : { lastReconciledAt: account.lastReconciledAt })
    })),
    ...(value.bankReconciliation === undefined ? {} : {
      bankReconciliation: value.bankReconciliation.map((evidence) => ({
        accountId: evidence.accountId,
        coverage: evidence.coverage,
        items: evidence.items.map((item) => ({
          id: item.id, date: item.date, description: item.description, direction: item.direction, amount: item.amount,
          ...(item.reference === undefined ? {} : { reference: item.reference }),
          ...(item.candidate === undefined ? {} : {
            candidate: {
              kind: item.candidate.kind, documentNo: item.candidate.documentNo,
              ...(item.candidate.party === undefined ? {} : { party: item.candidate.party }),
              issueDate: item.candidate.issueDate, amount: item.candidate.amount,
              confidence: item.candidate.confidence, signals: item.candidate.signals.slice()
            }
          })
        }))
      }))
    }),
    recentIncomeRows: value.recentIncomeRows.map((row) => ({
      id: row.id, documentNo: row.documentNo, party: row.party, issueDate: row.issueDate,
      amount: row.amount, status: row.status, activity: row.activity, activityAt: row.activityAt
    })),
    recentExpenseRows: value.recentExpenseRows.map((row) => ({
      id: row.id, documentNo: row.documentNo, party: row.party, issueDate: row.issueDate,
      amount: row.amount, status: row.status, activity: row.activity, activityAt: row.activityAt
    })),
    sources: value.sources.map((source) => ({
      key: source.key, label: source.label, asOf: source.asOf, scope: source.scope
    })),
    insights: {
      quotationAwaitingAmount: value.insights.quotationAwaitingAmount,
      quotationAwaitingCount: value.insights.quotationAwaitingCount,
      invoiceAlertAmount: value.insights.invoiceAlertAmount,
      invoiceAlertCount: value.insights.invoiceAlertCount
    },
    qualityFindings: value.qualityFindings.map((finding) => ({
      key: finding.key, severity: finding.severity, title: finding.title, detail: finding.detail
    })),
    notes: value.notes?.slice()
  };
}

export function peakSnapshotFreshness(dataAsOf: string, now = Date.now()): PeakFreshness {
  const observed = Date.parse(dataAsOf);
  const ageHours = Number.isFinite(observed) ? Math.max(0, (now - observed) / 3_600_000) : Number.POSITIVE_INFINITY;
  if (ageHours <= 24) return { status: 'fresh', ageHours, label: 'อัปเดตภายใน 24 ชม.' };
  const days = Math.max(1, Math.floor(ageHours / 24));
  if (ageHours <= 72) return { status: 'aging', ageHours, label: `ข้อมูล ${days} วันก่อน` };
  return { status: 'stale', ageHours, label: Number.isFinite(ageHours) ? `ข้อมูลเก่า ${days} วัน` : 'ไม่ทราบเวลาอัปเดต' };
}

const TM = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TMF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export function thb(v: number, compact = false): string {
  const s = v < 0 ? '-' : '';
  const a = Math.abs(v);
  if (compact && a >= 1e6) return `${s}฿${(a / 1e6).toFixed(2)}M`;
  if (compact && a >= 1e4) return `${s}฿${Math.round(a / 1e3)}K`;
  return `${s}฿${a.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
export const num = (v: number) => v.toLocaleString('en-US');
export function dateTH(iso?: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso ?? '—';
  return `${d} ${TM[m - 1]} ${String(y + 543).slice(2)}`;
}
export function dateTimeTH(iso?: string): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return '—';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok'
  }).format(new Date(iso)).replace(/ (\d{2}:\d{2})$/, ' · $1');
}
export const monthTH = (m: string) => `${TMF[Number(m.slice(5, 7)) - 1]} ${Number(m.slice(0, 4)) + 543}`;
export const daysLate = (due: string) => Math.floor((Date.parse(TODAY) - Date.parse(due)) / 864e5);
export const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
export const nextNo = (p: string, list: string[]) =>
`${p}69${String(list.filter((n) => n.startsWith(p)).reduce((a, n) => Math.max(a, Number(n.slice(p.length + 2)) || 0), 0) + 1).padStart(4, '0')}`;

export const baseOf = (ls: Line[]) => ls.reduce((s, l) => s + l.qty * l.price, 0);
export const vatOf = (ls: Line[]) => ls.reduce((s, l) => s + l.qty * l.price * l.vat / 100, 0);
export const whtOf = (ls: Line[], r: number) => baseOf(ls) * r / 100;
export const netOf = (ls: Line[], r: number) => baseOf(ls) + vatOf(ls) - whtOf(ls, r);
export const dueOf = (d: Doc) => Math.max(0, netOf(d.lines, d.wht) - d.paid);
export function docStatus(d: Doc): string {
  if (d.kind !== 'invoice' || d.status === 'draft') return d.status;
  if (dueOf(d) <= 0.5) return 'paid';
  if (d.paid > 0) return 'partial';
  return daysLate(d.due) > 0 ? 'overdue' : 'open';
}

export const STATUS: Record<string, {th: string;en: string;tone: Tone;}> = {
  draft: { th: 'ร่าง', en: 'Draft', tone: 'muted' },
  pending: { th: 'รออนุมัติ', en: 'Pending', tone: 'warn' },
  approved: { th: 'อนุมัติแล้ว', en: 'Approved', tone: 'info' },
  rejected: { th: 'ไม่อนุมัติ', en: 'Rejected', tone: 'bad' },
  sent: { th: 'ส่งให้ลูกค้าแล้ว', en: 'Sent', tone: 'info' },
  open: { th: 'ค้างชำระ', en: 'Open', tone: 'info' },
  partial: { th: 'ชำระบางส่วน', en: 'Partial', tone: 'warn' },
  paid: { th: 'ชำระแล้ว', en: 'Paid', tone: 'ok' },
  overdue: { th: 'เกินกำหนด', en: 'Overdue', tone: 'bad' },
  voided: { th: 'ยกเลิกแล้ว', en: 'Voided', tone: 'muted' },
  outstanding: { th: 'คงค้าง', en: 'Outstanding', tone: 'warn' },
  await_receipt: { th: 'รอใบเสร็จ', en: 'Await receipt', tone: 'warn' },
  received: { th: 'รับของแล้ว', en: 'Received', tone: 'ok' },
  converted: { th: 'แปลงเอกสารแล้ว', en: 'Converted', tone: 'info' },
  posted: { th: 'ผ่านรายการ', en: 'Posted', tone: 'ok' },
  matched: { th: 'จับคู่แล้ว', en: 'Matched', tone: 'ok' },
  unmatched: { th: 'รอจับคู่', en: 'Unmatched', tone: 'warn' },
  reconcile_not_started: { th: 'ยังไม่เริ่ม', en: 'Not started', tone: 'bad' },
  reconcile_partial: { th: 'บางส่วน', en: 'Partial', tone: 'warn' },
  reconcile_complete: { th: 'ครบแล้ว', en: 'Complete', tone: 'ok' },
  match_high: { th: 'น่าจะตรง', en: 'Likely match', tone: 'ok' },
  match_medium: { th: 'ควรตรวจ', en: 'Review', tone: 'warn' },
  match_none: { th: 'ยังไม่มีคู่', en: 'No match', tone: 'muted' },
  active: { th: 'ใช้งาน', en: 'Active', tone: 'ok' },
  planning: { th: 'เตรียมงาน', en: 'Planning', tone: 'muted' },
  disposed: { th: 'จำหน่ายแล้ว', en: 'Disposed', tone: 'muted' },
  low: { th: 'ต่ำกว่าจุดสั่งซื้อ', en: 'Reorder', tone: 'bad' },
  healthy: { th: 'ปกติ', en: 'Healthy', tone: 'ok' }
};

/* ---------------- master data ---------------- */

const P = (id: string, code: string, nameTh: string, nameEn: string, kind: 'product' | 'service', unit: string, price: number, cost: number, reorder: number, wh1: number, wh2: number): Product => (
{ id, code, nameTh, nameEn, kind, unit, price, cost, reorder, wh1, wh2, acct: kind === 'product' ? '4100' : '4200' });

export const products: Product[] = [
P('p1', 'HW-1001', 'เครื่องอ่าน RFID รุ่น TX-200', 'RFID Reader TX-200', 'product', 'เครื่อง', 18500, 11800, 10, 24, 8),
P('p2', 'HW-1002', 'แท็ก RFID UHF (แพ็ค 100 ชิ้น)', 'UHF RFID Tags', 'product', 'แพ็ค', 2400, 1380, 40, 96, 32),
P('p3', 'HW-1003', 'เครื่องพิมพ์บาร์โค้ด BP-9', 'Barcode Printer BP-9', 'product', 'เครื่อง', 32800, 21400, 6, 4, 1),
P('p4', 'HW-1004', 'สแกนเนอร์มือถือ HandyScan H5', 'HandyScan H5', 'product', 'เครื่อง', 14200, 8900, 12, 31, 14),
P('p5', 'SV-2001', 'ค่าบริการติดตั้งระบบ WMS', 'WMS Installation', 'service', 'งาน', 85000, 42000, 0, 0, 0),
P('p6', 'SV-2002', 'ค่าบริการดูแลระบบรายเดือน (MA)', 'Monthly Maintenance', 'service', 'เดือน', 24000, 9600, 0, 0, 0)];


const C = (id: string, code: string, type: 'customer' | 'supplier', nameTh: string, nameEn: string, taxId: string, person: string, phone: string, credit: number): Contact => (
{ id, code, type, nameTh, nameEn, taxId, person, phone, credit });

export const contacts: Contact[] = [
C('c1', 'CUS-0001', 'customer', 'บริษัท เจริญกิจ ลอจิสติกส์ จำกัด', 'Charoenkij Logistics', 'DEMO-TAX-C001', 'คุณสมชาย (ตัวอย่าง)', '02-000-0001', 30),
C('c2', 'CUS-0002', 'customer', 'บริษัท ไทยฟู้ด อินโนเวชั่น จำกัด', 'Thai Food Innovation', 'DEMO-TAX-C002', 'คุณอรวรรณ (ตัวอย่าง)', '02-000-0002', 45),
C('c3', 'CUS-0003', 'customer', 'บริษัท เอเชีย รีเทล กรุ๊ป จำกัด (มหาชน)', 'Asia Retail Group PCL.', 'DEMO-TAX-C003', 'คุณธนกร (ตัวอย่าง)', '02-000-0003', 60),
C('c4', 'CUS-0004', 'customer', 'หจก. นครพัฒนาวิศวกรรม', 'Nakorn Pattana Engineering', 'DEMO-TAX-C004', 'คุณวิชัย (ตัวอย่าง)', '02-000-0004', 30),
C('c5', 'CUS-0005', 'customer', 'บริษัท บลูเวฟ ดิจิทัล จำกัด', 'BlueWave Digital', 'DEMO-TAX-C005', 'คุณณัฐพล (ตัวอย่าง)', '02-000-0005', 15),
C('s1', 'SUP-0001', 'supplier', 'บริษัท ทีเอ็นซี ฮาร์ดแวร์ ซัพพลาย จำกัด', 'TNC Hardware Supply', 'DEMO-TAX-S001', 'คุณกิตติศักดิ์ (ตัวอย่าง)', '02-000-0101', 30),
C('s2', 'SUP-0002', 'supplier', 'บริษัท คลาวด์เน็ต เซอร์วิสเซส จำกัด', 'CloudNet Services', 'DEMO-TAX-S002', 'คุณศิริพร (ตัวอย่าง)', '02-000-0102', 15),
C('s3', 'SUP-0003', 'supplier', 'บริษัท สินมั่นคง ขนส่ง จำกัด', 'Sinmankong Transport', 'DEMO-TAX-S003', 'คุณประเสริฐ (ตัวอย่าง)', '02-000-0103', 30)];

function productById(pid: string): Product {
  const product = products.find((item) => item.id === pid);
  if (!product) throw new Error(`Unknown product: ${pid}`);
  return product;
}

export function li(pid: string, qty: number): Line {
  const p = productById(pid);
  return { desc: p.nameTh, qty, unit: p.unit, price: p.price, vat: 7, acct: p.acct, pid };
}
export function lc(pid: string, qty: number): Line {
  const p = productById(pid);
  return { desc: `${p.nameTh} (ต้นทุน)`, qty, unit: p.unit, price: p.cost, vat: 7, acct: '1040', pid };
}
export const lx = (desc: string, price: number, acct: string): Line => ({ desc, qty: 1, unit: 'งาน', price, vat: 7, acct });

const A = (code: string, nameTh: string, type: Account['type'], opening = 0): Account => ({ code, nameTh, type, opening });
export const accounts: Account[] = [
A('1010', 'เงินสดย่อย', 'asset', 50000),
A('1020', 'เงินฝากธนาคาร - กระแสรายวัน', 'asset', 2450000),
A('1021', 'เงินฝากธนาคาร - ออมทรัพย์', 'asset', 1180000),
A('1030', 'ลูกหนี้การค้า', 'asset'),
A('1040', 'สินค้าคงเหลือ', 'asset', 1850000),
A('1050', 'ภาษีซื้อ', 'asset'),
A('1060', 'ภาษีถูกหัก ณ ที่จ่าย', 'asset'),
A('1510', 'อุปกรณ์และยานพาหนะ', 'asset', 2810000),
A('1590', 'ค่าเสื่อมราคาสะสม', 'asset', -820000),
A('2010', 'เจ้าหนี้การค้า', 'liability'),
A('2020', 'ภาษีขาย', 'liability'),
A('2030', 'ภาษีหัก ณ ที่จ่ายค้างจ่าย', 'liability'),
A('2040', 'ประกันสังคมค้างจ่าย', 'liability'),
A('3010', 'ทุนจดทะเบียนชำระแล้ว', 'equity', 5000000),
A('4100', 'รายได้จากการขายสินค้า', 'revenue'),
A('4200', 'รายได้จากการให้บริการ', 'revenue'),
A('5100', 'ต้นทุนขาย', 'expense'),
A('5200', 'เงินเดือนและค่าแรง', 'expense'),
A('5210', 'ค่าเช่าสำนักงาน', 'expense'),
A('5220', 'ค่าสาธารณูปโภค', 'expense'),
A('5230', 'ค่าขนส่งและโลจิสติกส์', 'expense'),
A('5240', 'ค่าบริการคลาวด์และซอฟต์แวร์', 'expense'),
A('5250', 'ค่าเดินทางและที่พัก', 'expense'),
A('5260', 'ค่ารับรองและการตลาด', 'expense'),
A('5270', 'ค่าวัสดุสำนักงาน', 'expense'),
A('5280', 'ค่าเสื่อมราคา', 'expense')];


const E = (id: string, code: string, name: string, position: string, dept: string, salary: number, allowance: number, whtRate: number): Employee => (
{ id, code, name, position, dept, salary, allowance, whtRate });

export const employees: Employee[] = [
E('e1', 'EMP-001', 'สมชาย ธนกิจพัฒนา', 'กรรมการผู้จัดการ', 'บริหาร', 150000, 15000, 12),
E('e2', 'EMP-002', 'อรพรรณ ศรีวิชัย', 'ผู้จัดการฝ่ายบัญชี', 'บัญชีและการเงิน', 78000, 5000, 8),
E('e3', 'EMP-003', 'ณัฐวุฒิ ประเสริฐผล', 'วิศวกรระบบอาวุโส', 'เทคนิค', 65000, 6000, 7),
E('e4', 'EMP-004', 'ปิยะดา แก้วเพชร', 'เจ้าหน้าที่บัญชี', 'บัญชีและการเงิน', 32000, 2500, 2),
E('e5', 'EMP-005', 'ธีรภัทร ชูเกียรติ', 'ผู้จัดการฝ่ายขาย', 'ขายและการตลาด', 72000, 12000, 8),
E('e6', 'EMP-006', 'กมลชนก อินทะพันธ์', 'เจ้าหน้าที่คลังสินค้า', 'คลังและโลจิสติกส์', 26000, 2000, 0)];


export const payItems = (emps: Employee[]): PayItem[] =>
emps.map((e) => {
  const sso = Math.min(750, Math.round(e.salary * 5 / 100));
  const wht = Math.round((e.salary + e.allowance) * e.whtRate / 100);
  return { employeeId: e.id, gross: e.salary, allowance: e.allowance, sso, wht, net: e.salary + e.allowance - sso - wht };
});
export const payTotals = (r: PayRun) => ({
  gross: r.items.reduce((s, i) => s + i.gross + i.allowance, 0),
  sso: r.items.reduce((s, i) => s + i.sso, 0),
  wht: r.items.reduce((s, i) => s + i.wht, 0),
  net: r.items.reduce((s, i) => s + i.net, 0)
});

/* ---------------- transactional seed ---------------- */

const D = (id: string, no: string, kind: DocKind, contactId: string, date: string, due: string, lines: Line[], wht: number, status: string, extra: Partial<Doc> = {}): Doc => (
{ id, no, kind, contactId, date, due, lines, wht, status, paid: 0, ...extra });

const rawDocs: Doc[] = [
D('q1', 'QO690012', 'quote', 'c5', '2026-07-22', '2026-08-21', [li('p4', 8), li('p5', 1)], 3, 'sent'),
D('q2', 'QO690013', 'quote', 'c3', '2026-07-28', '2026-08-27', [li('p1', 12)], 0, 'sent'),
D('i1', 'IV690101', 'invoice', 'c1', '2026-03-12', '2026-04-11', [li('p1', 4), li('p5', 1)], 3, 'paid', { projectId: 'pj1' }),
D('i2', 'IV690102', 'invoice', 'c2', '2026-04-08', '2026-05-23', [li('p2', 20)], 0, 'paid'),
D('i3', 'IV690103', 'invoice', 'c3', '2026-04-24', '2026-06-23', [li('p3', 3), li('p5', 1)], 3, 'paid', { projectId: 'pj2' }),
D('i4', 'IV690099', 'invoice', 'c4', '2026-04-30', '2026-05-30', [li('p4', 9)], 0, 'open', { reminderCount: 2, lastReminderAt: '2026-07-24' }),
D('i5', 'IV690104', 'invoice', 'c4', '2026-05-16', '2026-06-15', [li('p4', 6)], 0, 'paid'),
D('i6', 'IV690105', 'invoice', 'c5', '2026-05-28', '2026-06-12', [li('p6', 1)], 3, 'paid', { projectId: 'pj3' }),
D('i7', 'IV690106', 'invoice', 'c2', '2026-06-11', '2026-07-26', [li('p1', 3)], 0, 'open'),
D('i8', 'IV690107', 'invoice', 'c1', '2026-06-26', '2026-07-26', [li('p2', 30)], 0, 'partial', { projectId: 'pj1' }),
D('i9', 'IV690108', 'invoice', 'c3', '2026-07-09', '2026-09-07', [li('p1', 6), li('p5', 1)], 3, 'open', { projectId: 'pj2' }),
D('i10', 'IV690109', 'invoice', 'c4', '2026-07-18', '2026-08-17', [li('p3', 2)], 0, 'open'),
D('i11', 'IV690110', 'invoice', 'c5', '2026-07-24', '2026-08-08', [li('p6', 1)], 3, 'open', { projectId: 'pj3' }),
D('r1', 'RE690055', 'receipt', 'c4', '2026-06-03', '2026-06-03', [li('p4', 6)], 0, 'paid', { ref: 'IV690104' }),
D('r2', 'RE690056', 'receipt', 'c5', '2026-06-10', '2026-06-10', [li('p6', 1)], 3, 'paid', { ref: 'IV690105' }),
D('o1', 'PO690021', 'po', 's1', '2026-07-20', '2026-08-19', [lc('p1', 10)], 0, 'approved', { wh: 'wh1', pid: 'p1', qty: 10, received: false }),
D('o2', 'PO690022', 'po', 's1', '2026-07-27', '2026-08-26', [lc('p3', 4)], 0, 'approved', { wh: 'wh1', pid: 'p3', qty: 4, received: false }),
D('b1', 'BL690201', 'bill', 's1', '2026-03-18', '2026-04-17', [lc('p1', 20)], 0, 'paid', { wh: 'wh1', projectId: 'pj1' }),
D('b2', 'BL690202', 'bill', 's2', '2026-04-05', '2026-04-20', [lx('ค่าบริการคลาวด์และโฮสติ้งรายเดือน', 48000, '5240')], 3, 'paid'),
D('b3', 'BL690203', 'bill', 's3', '2026-05-09', '2026-06-08', [lx('ค่าขนส่งและกระจายสินค้า', 36000, '5230')], 1, 'paid', { projectId: 'pj2' }),
D('b4', 'BL690204', 'bill', 's1', '2026-06-14', '2026-07-14', [lc('p2', 40)], 0, 'paid', { wh: 'wh2' }),
D('b5', 'BL690205', 'bill', 's2', '2026-07-05', '2026-07-20', [lx('ค่าบริการคลาวด์และโฮสติ้งรายเดือน', 52000, '5240')], 3, 'pending'),
D('b6', 'BL690206', 'bill', 's3', '2026-07-21', '2026-08-20', [lx('ค่าขนส่งและกระจายสินค้า', 41000, '5230')], 1, 'open', { projectId: 'pj2' }),
D('b7', 'BL690207', 'bill', 's1', '2026-07-26', '2026-08-25', [lc('p1', 12)], 0, 'open', { wh: 'wh1' })];


export function seed(): AppData {
  const docs: Doc[] = rawDocs.map((d) => ({
    ...d,
    paid: d.status === 'paid' ? netOf(d.lines, d.wht) : d.status === 'partial' ? Math.round(netOf(d.lines, d.wht) * 0.45) : 0
  }));
  const payroll: PayRun[] = [
  { id: 'pay-2026-06', period: '2026-06', payDate: '2026-06-28', status: 'paid', items: payItems(employees) },
  { id: 'pay-2026-07', period: '2026-07', payDate: '2026-07-28', status: 'pending', items: payItems(employees) }];

  const bankTxns: BankTxn[] = [
  ...docs.filter((d) => (d.kind === 'invoice' || d.kind === 'bill') && d.paid > 0).map((d, i) => {
    const date = addDays(d.date, d.kind === 'invoice' ? 18 : 14);
    const c = contacts.find((x) => x.id === d.contactId);
    return {
      id: `bt${i}`, accountId: 'ba1', date,
      desc: `${d.kind === 'invoice' ? 'รับชำระจาก' : 'จ่ายชำระ'} ${c?.nameEn ?? ''} (${d.no})`,
      amount: d.kind === 'invoice' ? d.paid : -d.paid,
      matched: date <= '2026-06-30',
      ref: date <= '2026-06-30' ? d.no : undefined
    };
  }),
  { id: 'btp', accountId: 'ba1', date: '2026-06-28', desc: 'จ่ายเงินเดือนพนักงานงวด มิ.ย. 2569', amount: -payTotals(payroll[0]).net, matched: true, ref: 'PAY-2026-06' },
  { id: 'btf', accountId: 'ba1', date: '2026-07-01', desc: 'ค่าธรรมเนียมบริการธนาคารรายเดือน', amount: -1284, matched: false },
  { id: 'bti', accountId: 'ba2', date: '2026-06-30', desc: 'ดอกเบี้ยรับเงินฝากออมทรัพย์', amount: 3120, matched: false },
  { id: 'btc', accountId: 'ba3', date: '2026-07-20', desc: 'เบิกเงินสดย่อยสำหรับค่าใช้จ่ายสำนักงาน', amount: -12000, matched: false },
  { id: 'btx', accountId: 'ba1', date: '2026-07-29', desc: 'รับโอนเงินจากลูกค้า ยังไม่ระบุเอกสารอ้างอิง', amount: 106465, matched: false }].
  sort((a, b) => a.date < b.date ? 1 : -1);

  const expenses: Expense[] = [
  { id: 'x1', no: 'EX690031', employeeId: 'e3', category: 'ค่าเดินทางและที่พัก', acct: '5250', date: '2026-06-18', amount: 8560, vat: 560, status: 'paid', projectId: 'pj1' },
  { id: 'x2', no: 'EX690032', employeeId: 'e5', category: 'ค่ารับรองและการตลาด', acct: '5260', date: '2026-07-08', amount: 12840, vat: 840, status: 'approved' },
  { id: 'x3', no: 'EX690033', employeeId: 'e4', category: 'ค่าวัสดุสำนักงาน', acct: '5270', date: '2026-07-15', amount: 4280, vat: 280, status: 'pending' },
  { id: 'x4', no: 'EX690034', employeeId: 'e6', category: 'ค่าขนส่งและโลจิสติกส์', acct: '5230', date: '2026-07-20', amount: 2140, vat: 140, status: 'draft' },
  { id: 'x5', no: 'EX690035', employeeId: 'e3', category: 'ค่าสาธารณูปโภค', acct: '5220', date: '2026-07-22', amount: 18190, vat: 1190, status: 'pending', projectId: 'pj2' },
  { id: 'x6', no: 'EX690036', employeeId: 'e5', category: 'ค่ารับรองและการตลาด', acct: '5260', date: '2026-06-28', amount: 6420, vat: 0, status: 'rejected', note: 'ไม่มีใบกำกับภาษีเต็มรูปแบบ' }];

  const journals: Journal[] = [
  { id: 'j1', no: 'JV690301', date: '2026-06-30', desc: 'ค่าเสื่อมราคาประจำเดือนมิถุนายน 2569', source: 'สินทรัพย์ถาวร', status: 'posted', lines: [{ account: '5280', debit: 40158, credit: 0 }, { account: '1590', debit: 0, credit: 40158 }] },
  { id: 'j2', no: 'JV690302', date: '2026-07-31', desc: 'ค่าเสื่อมราคาประจำเดือนกรกฎาคม 2569', source: 'สินทรัพย์ถาวร', status: 'draft', lines: [{ account: '5280', debit: 40158, credit: 0 }, { account: '1590', debit: 0, credit: 40158 }] },
  { id: 'j3', no: 'JV690303', date: '2026-07-31', desc: 'ตั้งค้างจ่ายค่าเช่าสำนักงานเดือนกรกฎาคม 2569', source: 'บันทึกด้วยมือ', status: 'draft', lines: [{ account: '5210', debit: 120000, credit: 0 }, { account: '2010', debit: 0, credit: 120000 }] }];

  const pendingBill = rawDocs.find((doc) => doc.id === 'b5');
  if (!pendingBill) throw new Error('Missing demo bill b5');

  const approvals: Approval[] = [
  { id: 'a1', kind: 'bill', refId: 'b5', refNo: 'BL690205', title: 'บิลซื้อ — คลาวด์เน็ต เซอร์วิสเซส', amount: netOf(pendingBill.lines, 3), requester: 'ปิยะดา แก้วเพชร', date: '2026-07-05', status: 'pending' },
  { id: 'a2', kind: 'expense', refId: 'x3', refNo: 'EX690033', title: 'ค่าวัสดุสำนักงาน — ปิยะดา แก้วเพชร', amount: 4280, requester: 'ปิยะดา แก้วเพชร', date: '2026-07-15', status: 'pending' },
  { id: 'a3', kind: 'expense', refId: 'x5', refNo: 'EX690035', title: 'ค่าสาธารณูปโภค — ณัฐวุฒิ ประเสริฐผล', amount: 18190, requester: 'ณัฐวุฒิ ประเสริฐผล', date: '2026-07-22', status: 'pending' },
  { id: 'a4', kind: 'payroll', refId: 'pay-2026-07', refNo: 'PAY-2026-07', title: 'อนุมัติจ่ายเงินเดือนงวดกรกฎาคม 2569', amount: payTotals(payroll[1]).net, requester: 'อรพรรณ ศรีวิชัย', date: '2026-07-26', status: 'pending' },
  { id: 'a5', kind: 'journal', refId: 'j2', refNo: 'JV690302', title: 'สมุดรายวันค่าเสื่อมราคาเดือนกรกฎาคม', amount: 40158, requester: 'อรพรรณ ศรีวิชัย', date: '2026-07-31', status: 'pending' }];

  return {
    company: {
      nameTh: 'บริษัท สยาม เทคปาร์ค จำกัด (ข้อมูลสาธิต)', nameEn: 'Siam TechPark Demo Co., Ltd.', taxId: 'DEMO-TAX-0001',
      address: '99/9 อาคารตัวอย่าง ถนนสาธิต กรุงเทพฯ 10000'
    },
    contacts, products, accounts, employees, docs, expenses, journals, approvals, bankTxns, payroll,
    bankAccts: [
    { id: 'ba1', nameTh: 'บัญชีกระแสรายวันหลัก', bank: 'ธนาคารตัวอย่าง A', no: 'XXX-X-00001-X', opening: 2450000, reconciled: '2026-06-30' },
    { id: 'ba2', nameTh: 'บัญชีออมทรัพย์สำรอง', bank: 'ธนาคารตัวอย่าง B', no: 'XXX-X-00002-X', opening: 1180000, reconciled: '2026-05-31' },
    { id: 'ba3', nameTh: 'เงินสดย่อยสำนักงาน', bank: 'เงินสด', no: '—', opening: 50000 }],

    assets: [
    { id: 'f1', code: 'FA-0001', name: 'รถตู้ส่งของ Toyota Commuter', category: 'ยานพาหนะ', date: '2023-05-15', cost: 1450000, salvage: 145000, life: 5, location: 'สำนักงานใหญ่ สาทร', status: 'active' },
    { id: 'f2', code: 'FA-0002', name: 'ชุดเซิร์ฟเวอร์และอุปกรณ์เครือข่าย', category: 'อุปกรณ์คอมพิวเตอร์', date: '2024-09-20', cost: 620000, salvage: 20000, life: 3, location: 'ห้องเซิร์ฟเวอร์ ชั้น 12', status: 'active' },
    { id: 'f3', code: 'FA-0003', name: 'รถยกไฟฟ้า 1.5 ตัน', category: 'เครื่องจักร', date: '2025-01-28', cost: 740000, salvage: 74000, life: 8, location: 'คลังบางปะอิน', status: 'active' },
    { id: 'f4', code: 'FA-0004', name: 'เครื่องปรับอากาศระบบรวม (เดิม)', category: 'อุปกรณ์สำนักงาน', date: '2020-03-11', cost: 260000, salvage: 10000, life: 5, location: 'สำนักงานใหญ่ สาทร', status: 'disposed' }],

    projects: [
    { id: 'pj1', code: 'PRJ-2026-01', nameTh: 'ติดตั้งระบบ WMS เจริญกิจ ลาดกระบัง', owner: 'ณัฐวุฒิ ประเสริฐผล', budget: 1850000, status: 'active', progress: 72 },
    { id: 'pj2', code: 'PRJ-2026-02', nameTh: 'ยกระดับคลังสินค้า เอเชีย รีเทล วังน้อย', owner: 'ธีรภัทร ชูเกียรติ', budget: 2600000, status: 'active', progress: 48 },
    { id: 'pj3', code: 'PRJ-2026-03', nameTh: 'สัญญาบำรุงรักษาระบบ MA ปี 2569', owner: 'อรพรรณ ศรีวิชัย', budget: 640000, status: 'active', progress: 58 },
    { id: 'pj4', code: 'PRJ-2026-04', nameTh: 'โครงการนำร่องภูเก็ต รีสอร์ท', owner: 'ธีรภัทร ชูเกียรติ', budget: 480000, status: 'planning', progress: 8 }],

    activities: [
    { id: 'g1', at: '31 ก.ค. 69 09:14', actor: 'ปิยะดา แก้วเพชร', text: 'สร้างใบแจ้งหนี้ IV690110 ให้ บลูเวฟ ดิจิทัล', module: 'ขาย' },
    { id: 'g2', at: '30 ก.ค. 69 16:42', actor: 'อรพรรณ ศรีวิชัย', text: 'ส่งสมุดรายวัน JV690302 เข้าอนุมัติ', module: 'บัญชี' },
    { id: 'g3', at: '29 ก.ค. 69 11:08', actor: 'กมลชนก อินทะพันธ์', text: 'ตรวจนับสินค้าคลังบางปะอินประจำสัปดาห์', module: 'คลังสินค้า' },
    { id: 'g4', at: '28 ก.ค. 69 15:20', actor: 'ธีรภัทร ชูเกียรติ', text: 'เสนอราคา QO690012 ให้ บลูเวฟ ดิจิทัล', module: 'ขาย' },
    { id: 'g5', at: '27 ก.ค. 69 10:05', actor: 'สมชาย ธนกิจพัฒนา', text: 'อนุมัติใบสั่งซื้อ PO690021 เพื่อเติมสต๊อก', module: 'จัดซื้อ' }],

    settings: { closedThrough: '2026-06-30', threshold: 50000 }
  };
}
