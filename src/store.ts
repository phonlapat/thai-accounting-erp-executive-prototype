/* Selectors, reports and the localStorage-backed store */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MONTHS, TODAY, addDays, baseOf, dueOf, docStatus, monthTH, netOf, nextNo, payItems, payTotals,
  seed, thb, uid, vatOf, whtOf } from
'./data';
import type { AppData, Asset, BankTxn, Doc, Journal, JLine, Product } from './data';

/* ---------------- lookups ---------------- */
export const contactName = (d: AppData, id: string) => d.contacts.find((c) => c.id === id)?.nameTh ?? '—';
export const empName = (d: AppData, id: string) => d.employees.find((e) => e.id === id)?.name ?? '—';
export const acctName = (d: AppData, code: string) => d.accounts.find((a) => a.code === code)?.nameTh ?? code;
export const projName = (d: AppData, id?: string) => d.projects.find((p) => p.id === id)?.nameTh ?? '—';

export const cashOf = (d: AppData, id: string) =>
(d.bankAccts.find((a) => a.id === id)?.opening ?? 0) +
d.bankTxns.filter((t) => t.accountId === id).reduce((s, t) => s + t.amount, 0);
export const cash = (d: AppData) => d.bankAccts.reduce((s, a) => s + cashOf(d, a.id), 0);

export const arList = (d: AppData) => d.docs.filter((x) => x.kind === 'invoice' && dueOf(x) > 0.5);
export const apList = (d: AppData) => d.docs.filter((x) => x.kind === 'bill' && dueOf(x) > 0.5 && x.status !== 'pending');
export const ar = (d: AppData) => arList(d).reduce((s, x) => s + dueOf(x), 0);
export const ap = (d: AppData) => apList(d).reduce((s, x) => s + dueOf(x), 0);
export const overdueList = (d: AppData) => arList(d).filter((x) => docStatus(x) === 'overdue');
export const pendingList = (d: AppData) => d.approvals.filter((a) => a.status === 'pending');
export const unmatchedList = (d: AppData) => d.bankTxns.filter((t) => !t.matched);
export const draftJournals = (d: AppData) => d.journals.filter((j) => j.status === 'draft');

export function cashForecast30(d: AppData) {
  const end = addDays(TODAY, 30);
  const inWindow = (due: string) => due >= TODAY && due <= end;
  const inflow = arList(d).filter((doc) => inWindow(doc.due)).reduce((sum, doc) => sum + dueOf(doc), 0);
  const outflow = d.docs
    .filter((doc) => doc.kind === 'bill' && !['paid', 'rejected'].includes(doc.status) && dueOf(doc) > 0.5 && inWindow(doc.due))
    .reduce((sum, doc) => sum + dueOf(doc), 0);
  const payroll = d.payroll
    .filter((run) => run.status !== 'paid' && inWindow(run.payDate))
    .reduce((sum, run) => sum + payTotals(run).net, 0);
  const opening = cash(d);
  const overdueInflow = arList(d).filter((doc) => doc.due < TODAY).reduce((sum, doc) => sum + dueOf(doc), 0);
  const overdueOutflow = d.docs
    .filter((doc) => doc.kind === 'bill' && !['paid', 'rejected'].includes(doc.status) && dueOf(doc) > 0.5 && doc.due < TODAY)
    .reduce((sum, doc) => sum + dueOf(doc), 0);
  return { opening, inflow, outflow, payroll, overdueInflow, overdueOutflow, end, closing: opening + inflow - outflow - payroll };
}

export interface BankSuggestion {ref: string;label: string;confidence: number;}

export function bankSuggestion(d: AppData, transaction: BankTxn): BankSuggestion | undefined {
  const description = transaction.desc.toLocaleLowerCase('th');
  const referencedNo = transaction.desc.match(/\b(?:IV|BL)\d+\b/i)?.[0]?.toUpperCase();
  const referencedDoc = referencedNo ? d.docs.find((doc) => doc.no === referencedNo) : undefined;
  if (referencedDoc) return { ref: referencedDoc.no, label: `${referencedDoc.no} · ${contactName(d, referencedDoc.contactId)}`, confidence: 99 };
  if (description.includes('ค่าธรรมเนียม')) return { ref: 'ADJ-BANK-FEE', label: 'ค่าธรรมเนียมธนาคาร', confidence: 98 };
  if (description.includes('ดอกเบี้ยรับ')) return { ref: 'ADJ-INTEREST', label: 'ดอกเบี้ยรับ', confidence: 98 };
  if (description.includes('เงินสดย่อย')) return { ref: 'TRF-PETTY-CASH', label: 'โอนเงินสดย่อย', confidence: 96 };

  const candidates = d.docs
    .filter((doc) => doc.kind === 'invoice' || doc.kind === 'bill')
    .map((doc) => {
      const signedAmount = (doc.kind === 'bill' ? -1 : 1) * netOf(doc.lines, doc.wht);
      return { doc, difference: Math.abs(signedAmount - transaction.amount) };
    })
    .sort((left, right) => left.difference - right.difference);
  const best = candidates[0];
  if (!best) return undefined;
  const ratio = best.difference / Math.max(1, Math.abs(transaction.amount));
  if (ratio > 0.02) return undefined;
  return {
    ref: best.doc.no,
    label: `${best.doc.no} · ${contactName(d, best.doc.contactId)}`,
    confidence: ratio <= 0.0001 ? 99 : ratio <= 0.005 ? 94 : 82
  };
}

export const stockOf = (p: Product) => p.wh1 + p.wh2;
export const invValue = (d: AppData) =>
d.products.filter((p) => p.kind === 'product').reduce((s, p) => s + stockOf(p) * p.cost, 0);
export const lowStock = (d: AppData) => d.products.filter((p) => p.kind === 'product' && stockOf(p) <= p.reorder);

export const depPerMonth = (a: Asset) => (a.cost - a.salvage) / (a.life * 12);
export const depMonthly = (d: AppData) => d.assets.filter((a) => a.status === 'active').reduce((s, a) => s + depPerMonth(a), 0);
export function bookValue(a: Asset) {
  const months = (2026 - Number(a.date.slice(0, 4))) * 12 + (7 - Number(a.date.slice(5, 7)));
  return Math.max(a.salvage, a.cost - depPerMonth(a) * Math.max(0, months));
}

/* ---------------- reports ---------------- */
export function aging(rows: Array<{due: string;amount: number;}>) {
  const b = [
  { label: 'ยังไม่ครบกำหนด', amount: 0 }, { label: '1–30 วัน', amount: 0 },
  { label: '31–60 วัน', amount: 0 }, { label: '61–90 วัน', amount: 0 }, { label: 'เกิน 90 วัน', amount: 0 }];

  rows.forEach((r) => {
    const n = Math.floor((Date.parse(TODAY) - Date.parse(r.due)) / 864e5);
    b[n <= 0 ? 0 : n <= 30 ? 1 : n <= 60 ? 2 : n <= 90 ? 3 : 4].amount += r.amount;
  });
  return b;
}

export function pl(d: AppData, month?: string) {
  const inM = (iso: string) => !month || iso.slice(0, 7) === month;
  const lines = d.docs.filter((x) => x.kind === 'invoice' && inM(x.date) && x.status !== 'draft').flatMap((x) => x.lines);
  const rev = ['4100', '4200'].map((code) => ({
    code, name: acctName(d, code),
    amount: lines.filter((l) => l.acct === code).reduce((s, l) => s + l.qty * l.price, 0)
  }));
  const cogs = lines.reduce((s, l) => {
    const p = d.products.find((x) => x.id === l.pid);
    return s + (p && p.kind === 'product' ? l.qty * p.cost : 0);
  }, 0);
  const map = new Map<string, number>();
  const add = (code: string, amt: number) => map.set(code, (map.get(code) ?? 0) + amt);
  d.docs.filter((x) => x.kind === 'bill' && inM(x.date) && x.status !== 'pending').
  forEach((x) => x.lines.filter((l) => l.acct.startsWith('5')).forEach((l) => add(l.acct, l.qty * l.price)));
  d.expenses.filter((e) => inM(e.date) && (e.status === 'approved' || e.status === 'paid')).
  forEach((e) => add(e.acct, e.amount - e.vat));
  d.payroll.filter((p) => p.status === 'paid' && inM(p.payDate)).forEach((p) => add('5200', payTotals(p).gross));
  d.journals.filter((j) => j.status === 'posted' && inM(j.date)).
  forEach((j) => j.lines.filter((l) => l.account.startsWith('5')).forEach((l) => add(l.account, l.debit)));
  const exp = [...map.entries()].map(([code, amount]) => ({ code, name: acctName(d, code), amount })).sort((a, b) => b.amount - a.amount);
  const totalRev = rev.reduce((s, r) => s + r.amount, 0);
  const totalExp = exp.reduce((s, r) => s + r.amount, 0);
  return { rev, cogs, exp, totalRev, totalExp, gross: totalRev - cogs, net: totalRev - cogs - totalExp };
}

export const series = (d: AppData) => MONTHS.map((m) => {
  const p = pl(d, m);
  return { month: m, revenue: p.totalRev, expense: p.cogs + p.totalExp, profit: p.net };
});

export function vatReport(d: AppData, month: string) {
  const inv = d.docs.filter((x) => x.kind === 'invoice' && x.date.slice(0, 7) === month);
  const bills = d.docs.filter((x) => x.kind === 'bill' && x.date.slice(0, 7) === month);
  const exp = d.expenses.filter((e) => e.date.slice(0, 7) === month && e.status !== 'rejected' && e.status !== 'draft');
  const salesBase = inv.reduce((s, x) => s + baseOf(x.lines), 0);
  const outVat = inv.reduce((s, x) => s + vatOf(x.lines), 0);
  const buyBase = bills.reduce((s, x) => s + baseOf(x.lines), 0) + exp.reduce((s, e) => s + e.amount - e.vat, 0);
  const inVat = bills.reduce((s, x) => s + vatOf(x.lines), 0) + exp.reduce((s, e) => s + e.vat, 0);
  return { salesBase, outVat, buyBase, inVat, net: outVat - inVat };
}

export const whtRows = (d: AppData, month: string) =>
d.docs.filter((x) => x.kind === 'bill' && x.wht > 0 && x.date.slice(0, 7) === month).map((x) => {
  const c = d.contacts.find((y) => y.id === x.contactId);
  return {
    no: x.no, payee: c?.nameTh ?? '—', taxId: c?.taxId ?? '—',
    type: x.wht === 1 ? 'ค่าขนส่ง มาตรา 40(8)' : 'ค่าบริการ มาตรา 40(8)',
    base: baseOf(x.lines), rate: x.wht, amount: whtOf(x.lines, x.wht)
  };
});

export function projectPL(d: AppData, id: string) {
  const revenue = d.docs.filter((x) => x.kind === 'invoice' && x.projectId === id).reduce((s, x) => s + baseOf(x.lines), 0);
  const cost = d.docs.filter((x) => x.kind === 'bill' && x.projectId === id).reduce((s, x) => s + baseOf(x.lines), 0) +
  d.expenses.filter((e) => e.projectId === id && e.status !== 'rejected').reduce((s, e) => s + e.amount - e.vat, 0);
  return { revenue, cost, margin: revenue - cost };
}

/** double-entry ledger: auto entries derived from documents plus manual journals */
export function ledger(d: AppData): Journal[] {
  const out: Journal[] = [];
  d.docs.filter((x) => x.kind === 'invoice' && x.status !== 'draft').forEach((x, i) => {
    const lines: JLine[] = [{ account: '1030', debit: netOf(x.lines, x.wht), credit: 0, memo: 'ลูกหนี้การค้า' }];
    if (x.wht) lines.push({ account: '1060', debit: whtOf(x.lines, x.wht), credit: 0, memo: `ภาษีถูกหัก ${x.wht}%` });
    ['4100', '4200'].forEach((a) => {
      const amt = x.lines.filter((l) => l.acct === a).reduce((s, l) => s + l.qty * l.price, 0);
      if (amt) lines.push({ account: a, debit: 0, credit: amt, memo: acctName(d, a) });
    });
    lines.push({ account: '2020', debit: 0, credit: vatOf(x.lines), memo: 'ภาษีขาย 7%' });
    out.push({ id: `L-i${i}`, no: `JV-${x.no}`, date: x.date, desc: `ขาย/ให้บริการ ${x.no} — ${contactName(d, x.contactId)}`, lines, status: 'posted', source: 'ขาย' });
  });
  d.docs.filter((x) => x.kind === 'bill' && x.status !== 'pending').forEach((x, i) => {
    const lines: JLine[] = x.lines.map((l) => ({ account: l.acct, debit: l.qty * l.price, credit: 0, memo: acctName(d, l.acct) }));
    lines.push({ account: '1050', debit: vatOf(x.lines), credit: 0, memo: 'ภาษีซื้อ 7%' });
    if (x.wht) lines.push({ account: '2030', debit: 0, credit: whtOf(x.lines, x.wht), memo: `ภาษีหัก ณ ที่จ่าย ${x.wht}%` });
    lines.push({ account: '2010', debit: 0, credit: netOf(x.lines, x.wht), memo: 'เจ้าหนี้การค้า' });
    out.push({ id: `L-b${i}`, no: `JV-${x.no}`, date: x.date, desc: `ซื้อ/ค่าใช้จ่าย ${x.no} — ${contactName(d, x.contactId)}`, lines, status: 'posted', source: 'จัดซื้อ' });
  });
  d.expenses.filter((e) => e.status === 'approved' || e.status === 'paid').forEach((e, i) => {
    out.push({
      id: `L-x${i}`, no: `JV-${e.no}`, date: e.date, desc: `ค่าใช้จ่าย ${e.no} ${e.category}`, status: 'posted', source: 'ค่าใช้จ่าย',
      lines: [
      { account: e.acct, debit: e.amount - e.vat, credit: 0, memo: e.category },
      ...(e.vat ? [{ account: '1050', debit: e.vat, credit: 0, memo: 'ภาษีซื้อ' }] : []),
      { account: e.status === 'paid' ? '1010' : '2010', debit: 0, credit: e.amount, memo: e.status === 'paid' ? 'จ่ายเงินสดย่อย' : 'ค้างจ่ายพนักงาน' }]

    });
  });
  d.payroll.filter((p) => p.status === 'paid').forEach((p, i) => {
    const t = payTotals(p);
    out.push({
      id: `L-p${i}`, no: `JV-PAY-${p.period}`, date: p.payDate, desc: `บันทึกเงินเดือนงวด ${monthTH(p.period)}`, status: 'posted', source: 'เงินเดือน',
      lines: [
      { account: '5200', debit: t.gross, credit: 0, memo: 'เงินเดือนและค่าแรง' },
      { account: '2040', debit: 0, credit: t.sso, memo: 'ประกันสังคม 5%' },
      { account: '2030', debit: 0, credit: t.wht, memo: 'ภ.ง.ด.1' },
      { account: '1020', debit: 0, credit: t.net, memo: 'จ่ายผ่านธนาคาร' }]

    });
  });
  return [...out, ...d.journals].sort((a, b) => a.date < b.date ? 1 : -1);
}

export interface Toast {id: string;text: string;tone: 'ok' | 'bad';}

const KEY = 'siam-erp-th-v1';

const ARRAY_FIELDS: Array<keyof AppData> = [
  'products', 'contacts', 'docs', 'expenses', 'bankAccts', 'bankTxns', 'journals', 'accounts',
  'employees', 'payroll', 'assets', 'projects', 'approvals', 'activities'
];

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AppData>;
  return ARRAY_FIELDS.every((key) => Array.isArray(candidate[key])) &&
    Boolean(candidate.company && typeof candidate.company === 'object') &&
    Boolean(candidate.settings && typeof candidate.settings === 'object');
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (isAppData(parsed)) return parsed;
    }
  } catch {

    /* ignore corrupt storage */}
  return seed();
}

export function useStore(actor = 'ผู้ใช้เดโม') {
  const [data, setData] = useState<AppData>(load);
  const dataRef = useRef(data);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [storageIssue, setStorageIssue] = useState(false);
  const toastTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      setStorageIssue(false);
    } catch {
      setStorageIssue(true);
    }
  }, [data]);

  useEffect(() => () => toastTimers.current.forEach((timer) => clearTimeout(timer)), []);

  const notify = useCallback((text: string, tone: 'ok' | 'bad' = 'ok') => {
    const id = uid('t');
    setToasts((t) => [...t, { id, text, tone }]);
    const timer = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
      toastTimers.current = toastTimers.current.filter((item) => item !== timer);
    }, 4200);
    toastTimers.current.push(timer);
  }, []);

  const actions = useMemo(() => {
    const log = (d: AppData, text: string, module: string): AppData => ({
      ...d,
      activities: [{ id: uid('g'), at: `${dateStamp()} น.`, actor, text, module }, ...d.activities].slice(0, 40)
    });
    /* Keep a synchronous snapshot so rapid consecutive actions cannot overwrite each other. */
    const mut = (fn: (d: AppData) => AppData) => {
      const next = fn(dataRef.current);
      dataRef.current = next;
      setData(next);
    };

    return {
      /* 1 — quote to cash */
      convertQuote: (id: string) =>
      mut((d) => {
        const q = d.docs.find((x) => x.id === id);
        if (!q || q.kind !== 'quote' || q.status === 'converted') {
          notify('ใบเสนอราคานี้ถูกดำเนินการแล้ว', 'bad');
          return d;
        }
        const c = d.contacts.find((x) => x.id === q.contactId);
        const no = nextNo('IV', d.docs.map((x) => x.no));
        const inv: Doc = {
          ...q, id: uid('iv'), no, kind: 'invoice', date: TODAY,
          due: addDays(TODAY, c?.credit ?? 30), status: 'open', paid: 0, ref: q.no
        };
        notify(`แปลงใบเสนอราคา ${q.no} เป็นใบแจ้งหนี้ ${no} แล้ว`);
        return log({ ...d, docs: [inv, ...d.docs.map((x) => x.id === id ? { ...x, status: 'converted' } : x)] }, `แปลง ${q.no} เป็นใบแจ้งหนี้ ${no}`, 'ขาย');
      }),

      receivePayment: (id: string) =>
      mut((d) => {
        const inv = d.docs.find((x) => x.id === id);
        if (!inv || inv.kind !== 'invoice' || dueOf(inv) <= 0.5) {
          notify('ใบแจ้งหนี้นี้ไม่มียอดให้รับชำระ', 'bad');
          return d;
        }
        const amount = dueOf(inv);
        const no = nextNo('RE', d.docs.map((x) => x.no));
        const receipt: Doc = { ...inv, id: uid('re'), no, kind: 'receipt', date: TODAY, due: TODAY, status: 'paid', paid: netOf(inv.lines, inv.wht), ref: inv.no };
        notify(`รับชำระ ${inv.no} จำนวน ${amount.toLocaleString()} บาท และออกใบเสร็จ ${no}`);
        return log({
          ...d,
          docs: [receipt, ...d.docs.map((x) => x.id === id ? { ...x, paid: netOf(x.lines, x.wht), status: 'paid' } : x)],
          bankTxns: [{ id: uid('bt'), accountId: 'ba1', date: TODAY, desc: `รับชำระตามใบแจ้งหนี้ ${inv.no}`, amount, matched: true, ref: inv.no }, ...d.bankTxns]
        }, `รับชำระใบแจ้งหนี้ ${inv.no}`, 'การเงิน');
      }),

      recordPaymentReminder: (id: string) =>
      mut((d) => {
        const invoice = d.docs.find((doc) => doc.id === id);
        if (!invoice || invoice.kind !== 'invoice' || docStatus(invoice) !== 'overdue') {
          notify('รายการนี้ไม่ใช่ใบแจ้งหนี้เกินกำหนด', 'bad');
          return d;
        }
        const count = (invoice.reminderCount ?? 0) + 1;
        notify(`บันทึกการเตือนชำระ ${invoice.no} แล้ว (สาธิต)`);
        return log({
          ...d,
          docs: d.docs.map((doc) => doc.id === id ? { ...doc, reminderCount: count, lastReminderAt: TODAY } : doc)
        }, `บันทึกการเตือนชำระ ${invoice.no} ครั้งที่ ${count} (สาธิต)`, 'ขาย');
      }),

      /* 2 — procure to pay */
      receivePO: (id: string) =>
      mut((d) => {
        const po = d.docs.find((x) => x.id === id);
        if (!po || po.kind !== 'po' || po.received || po.status === 'converted') {
          notify('ใบสั่งซื้อนี้รับสินค้าแล้ว', 'bad');
          return d;
        }
        notify(`รับสินค้าตามใบสั่งซื้อ ${po.no} เข้าคลังแล้ว`);
        return log({
          ...d,
          docs: d.docs.map((x) => x.id === id ? { ...x, received: true, status: 'received' } : x),
          products: d.products.map((p) =>
          p.id === po.pid ?
          po.wh === 'wh2' ? { ...p, wh2: p.wh2 + (po.qty ?? 0) } : { ...p, wh1: p.wh1 + (po.qty ?? 0) } :
          p)
        }, `รับสินค้าเข้าคลังตาม ${po.no}`, 'คลังสินค้า');
      }),

      billFromPO: (id: string) =>
      mut((d) => {
        const po = d.docs.find((x) => x.id === id);
        if (!po || po.kind !== 'po' || !po.received || po.status === 'converted') {
          notify('ใบสั่งซื้อนี้ยังสร้างบิลไม่ได้', 'bad');
          return d;
        }
        const c = d.contacts.find((x) => x.id === po.contactId);
        const no = nextNo('BL', d.docs.map((x) => x.no));
        const amount = netOf(po.lines, po.wht);
        const needs = amount >= d.settings.threshold;
        const bill: Doc = { ...po, id: uid('bl'), no, kind: 'bill', date: TODAY, due: addDays(TODAY, c?.credit ?? 30), status: needs ? 'pending' : 'open', paid: 0, ref: po.no };
        notify(needs ? `ตั้งหนี้ ${no} และส่งเข้าอนุมัติ (เกินเกณฑ์ ${thb(d.settings.threshold)})` : `ตั้งหนี้ ${no} เรียบร้อย`);
        return log({
          ...d,
          docs: [bill, ...d.docs.map((x) => x.id === id ? { ...x, status: 'converted' } : x)],
          approvals: needs ?
          [{ id: uid('ap'), kind: 'bill' as const, refId: bill.id, refNo: no, title: `บิลซื้อ — ${c?.nameTh ?? ''}`, amount, requester: 'ปิยะดา แก้วเพชร', date: TODAY, status: 'pending' }, ...d.approvals] :
          d.approvals
        }, `ตั้งหนี้ ${no} จากใบสั่งซื้อ ${po.no}`, 'จัดซื้อ');
      }),

      payBill: (id: string) =>
      mut((d) => {
        const bill = d.docs.find((x) => x.id === id);
        if (!bill || bill.kind !== 'bill' || ['pending', 'rejected', 'paid'].includes(bill.status) || dueOf(bill) <= 0.5) {
          notify('บิลนี้ยังจ่ายไม่ได้หรือชำระแล้ว', 'bad');
          return d;
        }
        const amount = dueOf(bill);
        notify(`จ่ายชำระ ${bill.no} จำนวน ${amount.toLocaleString()} บาท`);
        return log({
          ...d,
          docs: d.docs.map((x) => x.id === id ? { ...x, paid: netOf(x.lines, x.wht), status: 'paid' } : x),
          bankTxns: [{ id: uid('bt'), accountId: 'ba1', date: TODAY, desc: `จ่ายชำระเจ้าหนี้ตามบิล ${bill.no}`, amount: -amount, matched: true, ref: bill.no }, ...d.bankTxns]
        }, `จ่ายชำระบิล ${bill.no}`, 'การเงิน');
      }),

      /* 3 — expense approval */
      submitExpense: (id: string) =>
      mut((d) => {
        const e = d.expenses.find((x) => x.id === id);
        if (!e || e.status !== 'draft') {
          notify('รายการเบิกนี้ส่งอนุมัติแล้ว', 'bad');
          return d;
        }
        notify(`ส่งรายการเบิก ${e.no} เข้าอนุมัติแล้ว`);
        return log({
          ...d,
          expenses: d.expenses.map((x) => x.id === id ? { ...x, status: 'pending' } : x),
          approvals: [{ id: uid('ap'), kind: 'expense' as const, refId: e.id, refNo: e.no, title: `${e.category} — ${empName(d, e.employeeId)}`, amount: e.amount, requester: empName(d, e.employeeId), date: TODAY, status: 'pending' }, ...d.approvals]
        }, `ส่งรายการเบิก ${e.no} เข้าอนุมัติ`, 'ค่าใช้จ่าย');
      }),

      payExpense: (id: string) =>
      mut((d) => {
        const e = d.expenses.find((x) => x.id === id);
        if (!e || e.status !== 'approved') {
          notify('รายการเบิกนี้ยังจ่ายคืนไม่ได้หรือจ่ายแล้ว', 'bad');
          return d;
        }
        notify(`จ่ายคืนพนักงานตามรายการ ${e.no} แล้ว`);
        return log({
          ...d,
          expenses: d.expenses.map((x) => x.id === id ? { ...x, status: 'paid' } : x),
          bankTxns: [{ id: uid('bt'), accountId: 'ba3', date: TODAY, desc: `จ่ายคืนค่าใช้จ่ายพนักงาน ${e.no}`, amount: -e.amount, matched: true, ref: e.no }, ...d.bankTxns]
        }, `จ่ายคืนค่าใช้จ่าย ${e.no}`, 'ค่าใช้จ่าย');
      }),

      decide: (id: string, ok: boolean) =>
      mut((d) => {
        const a = d.approvals.find((x) => x.id === id);
        if (!a || a.status !== 'pending') {
          notify('รายการนี้ถูกตัดสินแล้ว', 'bad');
          return d;
        }
        let next: AppData = { ...d, approvals: d.approvals.map((x) => x.id === id ? { ...x, status: ok ? 'approved' : 'rejected' } : x) };
        if (a.kind === 'bill') next = { ...next, docs: next.docs.map((x) => x.id === a.refId ? { ...x, status: ok ? 'open' : 'rejected' } : x) };
        if (a.kind === 'expense') next = { ...next, expenses: next.expenses.map((x) => x.id === a.refId ? { ...x, status: ok ? 'approved' : 'rejected' } : x) };
        if (a.kind === 'payroll') next = { ...next, payroll: next.payroll.map((p) => p.id === a.refId ? { ...p, status: ok ? 'approved' : 'rejected' } : p) };
        if (a.kind === 'journal') next = { ...next, journals: next.journals.map((j) => j.id === a.refId ? { ...j, status: ok ? 'posted' : 'draft' } : j) };
        notify(ok ? `อนุมัติ ${a.refNo} เรียบร้อย` : `ไม่อนุมัติ ${a.refNo}`, ok ? 'ok' : 'bad');
        return log(next, `${ok ? 'อนุมัติ' : 'ไม่อนุมัติ'}รายการ ${a.refNo}`, 'อนุมัติ');
      }),

      payPayroll: (id: string) =>
      mut((d) => {
        const run = d.payroll.find((p) => p.id === id);
        if (!run || run.status !== 'approved') {
          notify('งวดเงินเดือนนี้ยังจ่ายไม่ได้หรือจ่ายแล้ว', 'bad');
          return d;
        }
        const t = payTotals(run);
        notify(`จ่ายเงินเดือนงวด ${monthTH(run.period)} เรียบร้อย`);
        return log({
          ...d,
          payroll: d.payroll.map((p) => p.id === id ? { ...p, status: 'paid' } : p),
          bankTxns: [{ id: uid('bt'), accountId: 'ba1', date: TODAY, desc: `จ่ายเงินเดือนพนักงานงวด ${run.period}`, amount: -t.net, matched: true, ref: `PAY-${run.period}` }, ...d.bankTxns]
        }, `จ่ายเงินเดือนงวด ${run.period}`, 'เงินเดือน');
      }),

      newPayrollRun: () =>
      mut((d) => {
        const period = '2026-08';
        if (d.payroll.some((p) => p.period === period)) {
          notify('มีงวดเงินเดือนสิงหาคม 2569 อยู่แล้ว', 'bad');
          return d;
        }
        notify('สร้างงวดเงินเดือนสิงหาคม 2569 เป็นร่างแล้ว');
        return log({ ...d, payroll: [...d.payroll, { id: `pay-${period}`, period, payDate: `${period}-28`, status: 'draft', items: payItems(d.employees) }] }, 'สร้างงวดเงินเดือนสิงหาคม 2569', 'เงินเดือน');
      }),

      submitPayroll: (id: string) =>
      mut((d) => {
        const run = d.payroll.find((p) => p.id === id);
        if (!run || run.status !== 'draft') {
          notify('งวดเงินเดือนนี้ส่งอนุมัติแล้ว', 'bad');
          return d;
        }
        notify(`ส่งงวดเงินเดือน ${monthTH(run.period)} เข้าอนุมัติ`);
        return log({
          ...d,
          payroll: d.payroll.map((p) => p.id === id ? { ...p, status: 'pending' } : p),
          approvals: [{ id: uid('ap'), kind: 'payroll' as const, refId: id, refNo: `PAY-${run.period}`, title: `อนุมัติจ่ายเงินเดือนงวด ${monthTH(run.period)}`, amount: payTotals(run).net, requester: 'อรพรรณ ศรีวิชัย', date: TODAY, status: 'pending' }, ...d.approvals]
        }, `ส่งงวดเงินเดือน ${run.period} เข้าอนุมัติ`, 'เงินเดือน');
      }),

      /* 4 — bank reconciliation */
      matchTxn: (id: string) =>
      mut((d) => {
        const t = d.bankTxns.find((x) => x.id === id);
        if (!t || t.matched) {
          notify('รายการธนาคารนี้จับคู่แล้ว', 'bad');
          return d;
        }
        const suggestion = bankSuggestion(d, t);
        if (!suggestion) {
          notify('ยังไม่มีคำแนะนำที่มั่นใจสำหรับรายการนี้', 'bad');
          return d;
        }
        const ref = suggestion.ref;
        notify(`จับคู่รายการเดินบัญชีกับเอกสาร ${ref} แล้ว`);
        return log({ ...d, bankTxns: d.bankTxns.map((x) => x.id === id ? { ...x, matched: true, ref } : x) }, `จับคู่รายการธนาคารกับ ${ref}`, 'ธนาคาร');
      }),

      matchSuggestedTxns: () =>
      mut((d) => {
        const suggestions = d.bankTxns
          .filter((transaction) => !transaction.matched)
          .map((transaction) => ({ transaction, suggestion: bankSuggestion(d, transaction) }))
          .filter((item): item is {transaction: BankTxn;suggestion: BankSuggestion;} => Boolean(item.suggestion));
        if (!suggestions.length) {
          notify('ไม่มีคำแนะนำใหม่ให้จับคู่', 'bad');
          return d;
        }
        const byId = new Map(suggestions.map((item) => [item.transaction.id, item.suggestion.ref]));
        notify(`จับคู่รายการที่แนะนำแล้ว ${suggestions.length} รายการ`);
        return log({
          ...d,
          bankTxns: d.bankTxns.map((transaction) => byId.has(transaction.id) ? { ...transaction, matched: true, ref: byId.get(transaction.id) } : transaction)
        }, `ยืนยันคำแนะนำจับคู่ธนาคาร ${suggestions.length} รายการ`, 'ธนาคาร');
      }),

      unmatchTxn: (id: string) =>
      mut((d) => {
        const transaction = d.bankTxns.find((x) => x.id === id);
        if (!transaction?.matched) {
          notify('รายการธนาคารนี้ไม่ได้ถูกจับคู่', 'bad');
          return d;
        }
        notify('ยกเลิกการจับคู่แล้ว');
        return log({ ...d, bankTxns: d.bankTxns.map((x) => x.id === id ? { ...x, matched: false, ref: undefined } : x) }, 'ยกเลิกการจับคู่รายการธนาคาร', 'ธนาคาร');
      }),

      reconcile: (accountId: string) =>
      mut((d) => {
        const left = d.bankTxns.filter((t) => t.accountId === accountId && !t.matched).length;
        if (left) {
          notify(`ยังมี ${left} รายการที่ยังไม่จับคู่ในบัญชีนี้`, 'bad');
          return d;
        }
        notify('กระทบยอดบัญชีเรียบร้อย');
        return log({ ...d, bankAccts: d.bankAccts.map((a) => a.id === accountId ? { ...a, reconciled: TODAY } : a) }, 'กระทบยอดบัญชีธนาคาร', 'ธนาคาร');
      }),

      /* 5 — month-end close */
      postJournal: (id: string) =>
      mut((d) => {
        const j = d.journals.find((x) => x.id === id);
        const approval = d.approvals.find((item) => item.refId === id);
        if (!j || j.status !== 'draft' || approval) {
          notify(approval?.status === 'pending' ? 'สมุดรายวันนี้ยังรออนุมัติ' : 'สมุดรายวันนี้ลงบัญชีแล้วหรือไม่พร้อมลงบัญชี', 'bad');
          return d;
        }
        notify(`ผ่านรายการสมุดรายวัน ${j?.no ?? ''} แล้ว`);
        return log({
          ...d,
          journals: d.journals.map((x) => x.id === id ? { ...x, status: 'posted' as const } : x),
          approvals: d.approvals.map((a) => a.refId === id ? { ...a, status: 'approved' } : a)
        }, `ผ่านรายการสมุดรายวัน ${j?.no ?? ''}`, 'บัญชี');
      }),

      closeMonth: () =>
      mut((d) => {
        const blockers: string[] = [];
        if (draftJournals(d).length) blockers.push(`สมุดรายวันร่าง ${draftJournals(d).length} รายการ`);
        if (unmatchedList(d).length) blockers.push(`รายการธนาคารรอจับคู่ ${unmatchedList(d).length} รายการ`);
        if (pendingList(d).length) blockers.push(`รายการรออนุมัติ ${pendingList(d).length} รายการ`);
        if (blockers.length) {
          notify(`ยังปิดงวดไม่ได้: ${blockers.join(' · ')}`, 'bad');
          return d;
        }
        notify('ปิดงวดบัญชีเดือนกรกฎาคม 2569 เรียบร้อย');
        return log({ ...d, settings: { ...d.settings, closedThrough: TODAY } }, 'ปิดงวดบัญชีประจำเดือนกรกฎาคม 2569', 'บัญชี');
      }),

      disposeAsset: (id: string) =>
      mut((d) => {
        const asset = d.assets.find((item) => item.id === id);
        if (!asset || asset.status !== 'active') {
          notify('สินทรัพย์นี้ถูกจำหน่ายแล้ว', 'bad');
          return d;
        }
        notify('บันทึกการจำหน่ายสินทรัพย์แล้ว');
        return log({ ...d, assets: d.assets.map((a) => a.id === id ? { ...a, status: 'disposed' } : a) }, 'จำหน่ายสินทรัพย์ถาวร', 'สินทรัพย์');
      }),

      reset: () => {
        try {
          localStorage.removeItem(KEY);
        } catch {

          /* ignore */}
        const next = seed();
        dataRef.current = next;
        setData(next);
        notify('คืนค่าข้อมูลตัวอย่างเรียบร้อย');
      }
    };
  }, [actor, notify]);

  return { data, actions, toasts, storageIssue };
}

export type Actions = ReturnType<typeof useStore>['actions'];

function dateStamp() {
  return `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`;
}

export function trialBalance(d: AppData) {
  const map = new Map<string, number>();
  d.accounts.forEach((a) => map.set(a.code, a.opening));
  ledger(d).filter((j) => j.status === 'posted').forEach((j) =>
  j.lines.forEach((l) => map.set(l.account, (map.get(l.account) ?? 0) + l.debit - l.credit))
  );
  return d.accounts.map((a) => {
    const v = map.get(a.code) ?? 0;
    const debitSide = a.type === 'asset' || a.type === 'expense';
    return { ...a, debit: debitSide ? Math.max(0, v) : Math.max(0, -v), credit: debitSide ? Math.max(0, -v) : Math.max(0, v) };
  });
}
