import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircleIcon, BarChart3Icon, BookOpenIcon, Building2Icon, BoxesIcon, CheckCircle2Icon, ChevronsLeftIcon,
  ChevronsRightIcon, ClipboardCheckIcon, FileTextIcon, InboxIcon, LandmarkIcon, LayoutDashboardIcon, LockIcon,
  MenuIcon, PackageIcon, PieChartIcon, ReceiptIcon, RotateCcwIcon, ShoppingCartIcon, UsersIcon, WalletIcon, XIcon } from
'lucide-react';
import {
  MONTH, STATUS, TODAY, WH, baseOf, dateTH, docStatus, dueOf, monthTH, netOf, num, payTotals, thb, vatOf, whtOf } from
'./data';
import type { AppData, Tone } from './data';
import {
  acctName, aging, ap, apList, ar, arList, bookValue, cash, cashOf, contactName, depMonthly, depPerMonth, draftJournals,
  empName, invValue, ledger, lowStock, overdueList, pendingList, pl, projName, projectPL, series, stockOf, trialBalance,
  unmatchedList, useStore, vatReport, whtRows } from
'./store';
import type { Actions } from './store';
import { Button, Card, CardHead, DataTable, KpiStrip, Panels, cx } from './ui';
import type { Col, FilterSpec, PanelSpec, RowAction, RowData } from './ui';

interface Kpi {label: string;sub?: string;value: string;tone?: Tone;hint?: string;}
interface Mod {
  id: string;th: string;en: string;group: string;desc: string;
  icon: React.ComponentType<{className?: string;}>;
  kpis: (d: AppData) => Kpi[];
  panels?: (d: AppData, a: Actions) => PanelSpec[];
  title?: string;sub?: string;
  cols?: Col[];
  rows?: (d: AppData) => RowData[];
  filters?: (d: AppData) => FilterSpec[];
  actions?: (r: RowData, a: Actions) => RowAction[];
}

const KIND_TH: Record<string, string> = { quote: 'ใบเสนอราคา', invoice: 'ใบแจ้งหนี้', receipt: 'ใบเสร็จรับเงิน', po: 'ใบสั่งซื้อ', bill: 'บิลซื้อ' };
const opts = (vals: string[]) => Array.from(new Set(vals)).map((v) => ({ value: v, label: STATUS[v]?.th ?? v }));
const N = (v: string | number | undefined) => Number(v ?? 0);

const SALES: Col[] = [
{ key: 'no', header: 'เลขที่', fmt: 'mono' },
{ key: 'kindTh', header: 'ประเภท', hide: 'sm' },
{ key: 'contact', header: 'คู่ค้า' },
{ key: 'date', header: 'วันที่', fmt: 'date', hide: 'md' },
{ key: 'due', header: 'ครบกำหนด', fmt: 'date', hide: 'lg' },
{ key: 'base', header: 'ก่อนภาษี', fmt: 'money', right: true, total: true, hide: 'md' },
{ key: 'vat', header: 'VAT 7%', fmt: 'money', right: true, hide: 'lg' },
{ key: 'wht', header: 'หัก ณ ที่จ่าย', fmt: 'money', right: true, hide: 'lg' },
{ key: 'net', header: 'ยอดสุทธิ', fmt: 'money', right: true, total: true },
{ key: 'out', header: 'คงค้าง', fmt: 'money', right: true, total: true, hide: 'sm' },
{ key: 'status', header: 'สถานะ', fmt: 'status' }];


const docRow = (d: AppData, x: AppData['docs'][number]): RowData => ({
  id: x.id, no: x.no, kindTh: KIND_TH[x.kind], contact: contactName(d, x.contactId), date: x.date, due: x.due,
  base: baseOf(x.lines), vat: vatOf(x.lines), wht: whtOf(x.lines, x.wht), net: netOf(x.lines, x.wht),
  out: x.kind === 'invoice' || x.kind === 'bill' ? dueOf(x) : 0,
  status: docStatus(x), kind: x.kind, received: x.received ? 'y' : 'n'
});

/* ---------------- modules ---------------- */
const CORE: Mod[] = [
{
  id: 'dashboard', th: 'ภาพรวมผู้บริหาร', en: 'Dashboard', group: 'ภาพรวม', icon: LayoutDashboardIcon,
  desc: 'ฐานะการเงิน งานค้าง และความเคลื่อนไหวขององค์กรในหน้าเดียว',
  kpis: (d) => [
  { label: 'เงินสดและเงินฝาก', sub: 'Cash', value: thb(cash(d), true), tone: 'info' },
  { label: 'ลูกหนี้คงค้าง', sub: 'AR', value: thb(ar(d), true) },
  { label: 'เจ้าหนี้คงค้าง', sub: 'AP', value: thb(ap(d), true), tone: 'warn' },
  { label: 'กำไรสุทธิสะสม', sub: 'Net profit', value: thb(pl(d).net, true), tone: pl(d).net >= 0 ? 'ok' : 'bad' },
  { label: 'งานค้างอนุมัติ', sub: 'Approvals', value: `${pendingList(d).length} รายการ`, tone: pendingList(d).length ? 'warn' : 'ok' }],

  panels: (d, a) => {
    const s = series(d);
    const max = Math.max(...s.map((x) => Math.max(x.revenue, x.expense)), 1);
    const p = pl(d);
    return [
    {
      title: 'รายได้และค่าใช้จ่ายรายเดือน', sub: 'Revenue vs. expense (5 เดือนล่าสุด)', wide: true,
      bars: s.flatMap((x) => [
      { label: `${monthTH(x.month)} · รายได้`, note: thb(x.revenue, true), value: x.revenue, max, tone: 'info' as Tone },
      { label: `${monthTH(x.month)} · ค่าใช้จ่าย`, note: `${thb(x.expense, true)} · กำไร ${thb(x.profit, true)}`, value: x.expense, max, tone: 'warn' as Tone }]
      ),
      rows: [['รายได้รวม', thb(p.totalRev)], ['ต้นทุนและค่าใช้จ่าย', thb(p.cogs + p.totalExp)], ['กำไรสุทธิ', thb(p.net), true]] as Array<[string, string, boolean?]>
    },
    {
      title: 'รอการอนุมัติ', sub: `${pendingList(d).length} รายการในกล่องอนุมัติ`,
      lines: pendingList(d).slice(0, 4).map((x) => ({
        left: x.title, sub: `${x.refNo} · ${x.requester} · ${dateTH(x.date)}`, right: thb(x.amount),
        actions: [{ label: 'อนุมัติ', run: () => a.decide(x.id, true) }, { label: 'ไม่อนุมัติ', run: () => a.decide(x.id, false), danger: true }]
      })),
      empty: 'ไม่มีรายการค้างอนุมัติ'
    },
    {
      title: 'ลูกหนี้เกินกำหนด', sub: 'Overdue receivables',
      lines: overdueList(d).slice(0, 5).map((x) => ({
        left: `${x.no} · ${contactName(d, x.contactId)}`,
        sub: `เกินกำหนด ${Math.floor((Date.parse(TODAY) - Date.parse(x.due)) / 864e5)} วัน`, tone: 'bad' as Tone, right: thb(dueOf(x))
      })),
      empty: 'ไม่มีลูกหนี้เกินกำหนด'
    },
    {
      title: 'เงินสดคงเหลือตามบัญชี', sub: 'Cash & bank balances', wide: true,
      lines: d.bankAccts.map((b) => ({ left: b.nameTh, sub: `${b.bank} · ${b.no}`, right: thb(cashOf(d, b.id)) }))
    },
    {
      title: 'สินค้าต่ำกว่าจุดสั่งซื้อ', sub: 'Reorder alerts',
      lines: lowStock(d).map((p2) => ({ left: `${p2.code} · ${p2.nameTh}`, sub: `คงเหลือ ${num(stockOf(p2))} / จุดสั่งซื้อ ${num(p2.reorder)}`, tone: 'bad' as Tone, status: 'low' })),
      empty: 'สต๊อกทุกรายการอยู่ในระดับปกติ',
      note: `มูลค่าสินค้าคงคลังรวม ${thb(invValue(d))}`
    },
    {
      title: 'ความเคลื่อนไหวล่าสุด', sub: 'Audit trail', wide: true,
      lines: d.activities.slice(0, 6).map((x) => ({ left: x.text, sub: `${x.actor} · ${x.module} · ${x.at}` }))
    }];

  }
},
{
  id: 'sales', th: 'ขายและลูกหนี้', en: 'Sales & AR', group: 'วงจรรายได้', icon: FileTextIcon,
  desc: 'ใบเสนอราคา → ใบแจ้งหนี้ → ใบเสร็จรับเงิน พร้อมภาษีขาย 7% และภาษีถูกหัก ณ ที่จ่าย',
  kpis: (d) => [
  { label: 'ยอดขาย', sub: monthTH(MONTH), value: thb(vatReport(d, MONTH).salesBase, true) },
  { label: 'ลูกหนี้คงค้าง', value: thb(ar(d), true), tone: 'warn' },
  { label: 'เกินกำหนดชำระ', value: thb(overdueList(d).reduce((s, x) => s + dueOf(x), 0), true), tone: 'bad' },
  { label: 'ใบเสนอราคารอปิดการขาย', value: `${d.docs.filter((x) => x.kind === 'quote' && x.status !== 'converted').length} ฉบับ` },
  { label: 'ภาษีขายในงวด', sub: 'Output VAT', value: thb(vatReport(d, MONTH).outVat, true) }],

  title: 'เอกสารขาย', sub: 'กด “แปลงเป็นใบแจ้งหนี้” หรือ “รับชำระ” เพื่อเดินเวิร์กโฟลว์ quote-to-cash',
  cols: SALES,
  rows: (d) => d.docs.filter((x) => x.kind !== 'po' && x.kind !== 'bill').map((x) => docRow(d, x)),
  filters: (d) => [
  { key: 'kindTh', label: 'ประเภท', options: ['quote', 'invoice', 'receipt'].map((k) => ({ value: KIND_TH[k], label: KIND_TH[k] })) },
  { key: 'status', label: 'สถานะ', options: opts(d.docs.filter((x) => x.kind !== 'po' && x.kind !== 'bill').map((x) => docStatus(x))) }],

  actions: (r, a) => {
    if (r.kind === 'quote' && r.status !== 'converted') return [{ label: 'แปลงเป็นใบแจ้งหนี้', run: () => a.convertQuote(r.id) }];
    if (r.kind === 'invoice' && N(r.out) > 0.5) return [{ label: 'รับชำระ', run: () => a.receivePayment(r.id) }];
    return [];
  }
},
{
  id: 'purchases', th: 'จัดซื้อและเจ้าหนี้', en: 'Purchasing & AP', group: 'วงจรรายจ่าย', icon: ShoppingCartIcon,
  desc: 'ใบสั่งซื้อ → รับสินค้าเข้าคลัง → ตั้งหนี้ → จ่ายชำระ พร้อมภาษีซื้อและภาษีหัก ณ ที่จ่าย',
  kpis: (d) => [
  { label: 'เจ้าหนี้คงค้าง', value: thb(ap(d), true), tone: 'warn' },
  { label: 'ใบสั่งซื้อรอรับของ', value: `${d.docs.filter((x) => x.kind === 'po' && !x.received).length} ฉบับ` },
  { label: 'บิลรออนุมัติ', value: `${d.docs.filter((x) => x.kind === 'bill' && x.status === 'pending').length} ฉบับ`, tone: 'warn' },
  { label: 'ภาษีซื้อในงวด', sub: 'Input VAT', value: thb(vatReport(d, MONTH).inVat, true) },
  { label: 'เกณฑ์ต้องอนุมัติ', value: thb(d.settings.threshold, true), hint: 'บิลเกินยอดนี้เข้าอนุมัติ' }],

  title: 'เอกสารจัดซื้อ', sub: 'เวิร์กโฟลว์ procure-to-pay ปรับสต๊อกและเจ้าหนี้ให้อัตโนมัติ',
  cols: SALES,
  rows: (d) => d.docs.filter((x) => x.kind === 'po' || x.kind === 'bill').map((x) => docRow(d, x)),
  filters: (d) => [
  { key: 'kindTh', label: 'ประเภท', options: ['po', 'bill'].map((k) => ({ value: KIND_TH[k], label: KIND_TH[k] })) },
  { key: 'status', label: 'สถานะ', options: opts(d.docs.filter((x) => x.kind === 'po' || x.kind === 'bill').map((x) => x.status)) }],

  actions: (r, a) => {
    if (r.kind === 'po' && r.received === 'n' && r.status !== 'converted') return [{ label: 'รับสินค้าเข้าคลัง', run: () => a.receivePO(r.id) }];
    if (r.kind === 'po' && r.received === 'y' && r.status !== 'converted') return [{ label: 'ตั้งหนี้เป็นบิลซื้อ', run: () => a.billFromPO(r.id) }];
    if (r.kind === 'bill' && r.status !== 'pending' && N(r.out) > 0.5) return [{ label: 'จ่ายชำระ', run: () => a.payBill(r.id) }];
    return [];
  }
},
{
  id: 'expenses', th: 'เบิกค่าใช้จ่าย', en: 'Expenses', group: 'วงจรรายจ่าย', icon: ReceiptIcon,
  desc: 'พนักงานส่งเบิก → ผู้อนุมัติตรวจสอบ → จ่ายคืนจากเงินสดย่อย',
  kpis: (d) => [
  { label: 'ค่าใช้จ่าย', sub: monthTH(MONTH), value: thb(d.expenses.filter((e) => e.date.slice(0, 7) === MONTH && e.status !== 'rejected').reduce((s, e) => s + e.amount, 0), true) },
  { label: 'รออนุมัติ', value: `${d.expenses.filter((e) => e.status === 'pending').length} รายการ`, tone: 'warn' },
  { label: 'รอจ่ายคืน', value: thb(d.expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0), true) },
  { label: 'ภาษีซื้อขอคืนได้', value: thb(d.expenses.filter((e) => e.status !== 'rejected').reduce((s, e) => s + e.vat, 0), true) }],

  title: 'รายการเบิกค่าใช้จ่าย', sub: 'ร่าง → รออนุมัติ → อนุมัติ → จ่ายคืน',
  cols: [
  { key: 'no', header: 'เลขที่', fmt: 'mono' },
  { key: 'employee', header: 'ผู้เบิก' },
  { key: 'category', header: 'หมวดค่าใช้จ่าย', hide: 'sm' },
  { key: 'date', header: 'วันที่', fmt: 'date', hide: 'md' },
  { key: 'amount', header: 'จำนวนเงิน', fmt: 'money', right: true, total: true },
  { key: 'vat', header: 'ภาษีซื้อ', fmt: 'money', right: true, hide: 'lg' },
  { key: 'project', header: 'โครงการ', hide: 'lg' },
  { key: 'status', header: 'สถานะ', fmt: 'status' }],

  rows: (d) => d.expenses.map((e) => ({
    id: e.id, no: e.no, employee: empName(d, e.employeeId), category: e.category, date: e.date,
    amount: e.amount, vat: e.vat, project: e.projectId ? projName(d, e.projectId) : '—', status: e.status
  })),
  filters: (d) => [{ key: 'status', label: 'สถานะ', options: opts(d.expenses.map((e) => e.status)) }],
  actions: (r, a) => {
    if (r.status === 'draft') return [{ label: 'ส่งอนุมัติ', run: () => a.submitExpense(r.id) }];
    if (r.status === 'approved') return [{ label: 'จ่ายคืนพนักงาน', run: () => a.payExpense(r.id) }];
    return [];
  }
},
{
  id: 'approvals', th: 'กล่องอนุมัติ', en: 'Approvals', group: 'ภาพรวม', icon: InboxIcon,
  desc: 'ศูนย์รวมงานรออนุมัติจากทุกโมดูล — บิลซื้อ ค่าใช้จ่าย เงินเดือน และสมุดรายวัน',
  kpis: (d) => [
  { label: 'รออนุมัติ', value: `${pendingList(d).length} รายการ`, tone: pendingList(d).length ? 'warn' : 'ok' },
  { label: 'มูลค่ารออนุมัติ', value: thb(pendingList(d).reduce((s, x) => s + x.amount, 0), true) },
  { label: 'อนุมัติแล้ว', value: `${d.approvals.filter((x) => x.status === 'approved').length} รายการ`, tone: 'ok' },
  { label: 'ไม่อนุมัติ', value: `${d.approvals.filter((x) => x.status === 'rejected').length} รายการ`, tone: 'bad' }],

  title: 'งานรออนุมัติ', sub: 'อนุมัติแล้วระบบจะปลดล็อกขั้นตอนถัดไปของเวิร์กโฟลว์ให้อัตโนมัติ',
  cols: [
  { key: 'refNo', header: 'เลขที่เอกสาร', fmt: 'mono' },
  { key: 'title', header: 'รายการ' },
  { key: 'kindTh', header: 'ประเภท', hide: 'sm' },
  { key: 'requester', header: 'ผู้ขออนุมัติ', hide: 'md' },
  { key: 'date', header: 'วันที่ขอ', fmt: 'date', hide: 'lg' },
  { key: 'amount', header: 'มูลค่า', fmt: 'money', right: true, total: true },
  { key: 'status', header: 'สถานะ', fmt: 'status' }],

  rows: (d) => d.approvals.map((x) => ({
    id: x.id, refNo: x.refNo, title: x.title, requester: x.requester, date: x.date, amount: x.amount, status: x.status,
    kindTh: x.kind === 'bill' ? 'บิลซื้อ' : x.kind === 'expense' ? 'ค่าใช้จ่าย' : x.kind === 'payroll' ? 'เงินเดือน' : 'สมุดรายวัน'
  })),
  filters: (d) => [{ key: 'status', label: 'สถานะ', options: opts(d.approvals.map((x) => x.status)) }],
  actions: (r, a) => r.status === 'pending' ?
  [{ label: 'อนุมัติ', run: () => a.decide(r.id, true) }, { label: 'ไม่อนุมัติ', run: () => a.decide(r.id, false), danger: true }] :
  []
}];


const MASTER: Mod[] = [
{
  id: 'contacts', th: 'ลูกค้าและผู้ขาย', en: 'Contacts', group: 'ข้อมูลหลัก', icon: UsersIcon,
  desc: 'ทะเบียนผู้ติดต่อพร้อมเลขประจำตัวผู้เสียภาษี ผู้ประสานงาน และเครดิตเทอม',
  kpis: (d) => [
  { label: 'ลูกค้า', value: `${d.contacts.filter((c) => c.type === 'customer').length} ราย` },
  { label: 'ผู้ขาย', value: `${d.contacts.filter((c) => c.type === 'supplier').length} ราย` },
  { label: 'ลูกหนี้คงค้าง', value: thb(ar(d), true), tone: 'warn' },
  { label: 'เจ้าหนี้คงค้าง', value: thb(ap(d), true) }],

  title: 'ทะเบียนผู้ติดต่อ', sub: 'Customers & suppliers',
  cols: [
  { key: 'code', header: 'รหัส', fmt: 'mono' },
  { key: 'nameTh', header: 'ชื่อ (ไทย)' },
  { key: 'nameEn', header: 'ชื่อ (อังกฤษ)', hide: 'lg' },
  { key: 'typeTh', header: 'ประเภท', hide: 'sm' },
  { key: 'taxId', header: 'เลขผู้เสียภาษี', fmt: 'mono', hide: 'md' },
  { key: 'person', header: 'ผู้ประสานงาน', hide: 'lg' },
  { key: 'credit', header: 'เครดิต (วัน)', fmt: 'num', right: true, hide: 'lg' },
  { key: 'balance', header: 'ยอดคงค้าง', fmt: 'money', right: true, total: true }],

  rows: (d) => d.contacts.map((c) => ({
    id: c.id, code: c.code, nameTh: c.nameTh, nameEn: c.nameEn, taxId: c.taxId, person: c.person, credit: c.credit,
    typeTh: c.type === 'customer' ? 'ลูกค้า' : 'ผู้ขาย',
    balance: d.docs.filter((x) => x.contactId === c.id && (x.kind === 'invoice' || x.kind === 'bill')).reduce((s, x) => s + dueOf(x), 0)
  })),
  filters: () => [{ key: 'typeTh', label: 'ประเภท', options: [{ value: 'ลูกค้า', label: 'ลูกค้า' }, { value: 'ผู้ขาย', label: 'ผู้ขาย' }] }]
},
{
  id: 'products', th: 'สินค้าและบริการ', en: 'Products', group: 'ข้อมูลหลัก', icon: PackageIcon,
  desc: 'ราคาขาย ต้นทุน อัตรากำไรขั้นต้น และบัญชีรายได้ของแต่ละรายการ',
  kpis: (d) => [
  { label: 'สินค้า', value: `${d.products.filter((p) => p.kind === 'product').length} รายการ` },
  { label: 'บริการ', value: `${d.products.filter((p) => p.kind === 'service').length} รายการ` },
  { label: 'มูลค่าคงคลัง', value: thb(invValue(d), true) },
  { label: 'กำไรขั้นต้นเฉลี่ย', value: `${Math.round(d.products.reduce((s, p) => s + (p.price ? (p.price - p.cost) / p.price : 0), 0) / d.products.length * 100)}%`, tone: 'ok' }],

  title: 'ทะเบียนสินค้าและบริการ', sub: 'Price list',
  cols: [
  { key: 'code', header: 'รหัส', fmt: 'mono' },
  { key: 'nameTh', header: 'ชื่อรายการ' },
  { key: 'nameEn', header: 'ชื่อ (อังกฤษ)', hide: 'lg' },
  { key: 'kindTh', header: 'ประเภท', hide: 'sm' },
  { key: 'unit', header: 'หน่วย', hide: 'lg' },
  { key: 'price', header: 'ราคาขาย', fmt: 'money', right: true },
  { key: 'cost', header: 'ต้นทุน', fmt: 'money', right: true, hide: 'md' },
  { key: 'margin', header: 'กำไรขั้นต้น', fmt: 'pct', right: true, hide: 'lg' },
  { key: 'acctTh', header: 'บัญชีรายได้', hide: 'lg' }],

  rows: (d) => d.products.map((p) => ({
    id: p.id, code: p.code, nameTh: p.nameTh, nameEn: p.nameEn, unit: p.unit, price: p.price, cost: p.cost,
    kindTh: p.kind === 'product' ? 'สินค้า' : 'บริการ',
    margin: p.price ? (p.price - p.cost) / p.price * 100 : 0,
    acctTh: `${p.acct} ${acctName(d, p.acct)}`
  })),
  filters: () => [{ key: 'kindTh', label: 'ประเภท', options: [{ value: 'สินค้า', label: 'สินค้า' }, { value: 'บริการ', label: 'บริการ' }] }]
},
{
  id: 'inventory', th: 'คลังสินค้า', en: 'Inventory', group: 'ปฏิบัติการ', icon: BoxesIcon,
  desc: 'ยอดคงเหลือแยกคลัง มูลค่าตามต้นทุน และการเติมสต๊อกจากใบสั่งซื้อ',
  kpis: (d) => [
  { label: 'มูลค่าสินค้าคงคลัง', value: thb(invValue(d), true) },
  { label: 'ต่ำกว่าจุดสั่งซื้อ', value: `${lowStock(d).length} รายการ`, tone: lowStock(d).length ? 'bad' : 'ok' },
  { label: 'จำนวนคลัง', value: `${WH.length} คลัง` },
  { label: 'รอรับเข้าคลัง', value: `${d.docs.filter((x) => x.kind === 'po' && !x.received).length} ใบสั่งซื้อ` }],

  title: 'ยอดคงเหลือตามคลัง', sub: 'การรับสินค้าจากใบสั่งซื้อจะเพิ่มยอดคลังทันที',
  cols: [
  { key: 'code', header: 'รหัส', fmt: 'mono' },
  { key: 'nameTh', header: 'สินค้า' },
  { key: 'wh1', header: 'คลังสาทร', fmt: 'num', right: true },
  { key: 'wh2', header: 'คลังบางปะอิน', fmt: 'num', right: true, hide: 'sm' },
  { key: 'total', header: 'รวมคงเหลือ', fmt: 'num', right: true },
  { key: 'reorder', header: 'จุดสั่งซื้อ', fmt: 'num', right: true, hide: 'lg' },
  { key: 'value', header: 'มูลค่าตามต้นทุน', fmt: 'money', right: true, total: true },
  { key: 'status', header: 'สถานะ', fmt: 'status' }],

  rows: (d) => d.products.filter((p) => p.kind === 'product').map((p) => ({
    id: p.id, code: p.code, nameTh: p.nameTh, wh1: p.wh1, wh2: p.wh2, total: stockOf(p), reorder: p.reorder,
    value: stockOf(p) * p.cost, status: stockOf(p) <= p.reorder ? 'low' : 'healthy'
  })),
  filters: () => [{ key: 'status', label: 'สถานะสต๊อก', options: opts(['low', 'healthy']) }],
  panels: (d) => [{
    title: 'ใบสั่งซื้อที่รอรับของ', sub: 'Inbound purchase orders', wide: true,
    lines: d.docs.filter((x) => x.kind === 'po' && !x.received).map((x) => ({
      left: `${x.no} · ${contactName(d, x.contactId)}`,
      sub: `${WH.find((w) => w.id === x.wh)?.name ?? '—'} · ${num(x.qty ?? 0)} หน่วย · ครบกำหนด ${dateTH(x.due)}`,
      right: thb(netOf(x.lines, x.wht)), status: x.status
    })),
    empty: 'ไม่มีใบสั่งซื้อค้างรับ'
  }]
},
{
  id: 'banking', th: 'เงินสดและธนาคาร', en: 'Banking', group: 'ปฏิบัติการ', icon: LandmarkIcon,
  desc: 'จับคู่รายการเดินบัญชีกับเอกสาร แล้วกระทบยอดก่อนปิดงวด',
  kpis: (d) => [
  { label: 'เงินสดและเงินฝากรวม', value: thb(cash(d), true), tone: 'info' },
  { label: 'รายการรอจับคู่', value: `${unmatchedList(d).length} รายการ`, tone: unmatchedList(d).length ? 'warn' : 'ok' },
  { label: 'เงินเข้าเดือนนี้', value: thb(d.bankTxns.filter((t) => t.date.slice(0, 7) === MONTH && t.amount > 0).reduce((s, t) => s + t.amount, 0), true), tone: 'ok' },
  { label: 'เงินออกเดือนนี้', value: thb(d.bankTxns.filter((t) => t.date.slice(0, 7) === MONTH && t.amount < 0).reduce((s, t) => s + t.amount, 0), true), tone: 'bad' }],

  panels: (d, a) => d.bankAccts.map((b) => ({
    title: b.nameTh, sub: `${b.bank} · ${b.no}`,
    rows: [
    ['ยอดคงเหลือ', thb(cashOf(d, b.id)), true],
    ['กระทบยอดถึง', b.reconciled ? dateTH(b.reconciled) : 'ยังไม่เคยกระทบยอด'],
    ['รายการรอจับคู่', `${d.bankTxns.filter((t) => t.accountId === b.id && !t.matched).length} รายการ`]] as
    Array<[string, string, boolean?]>,
    action: { label: `กระทบยอดถึง ${dateTH(TODAY)}`, run: () => a.reconcile(b.id) }
  })),
  title: 'รายการเดินบัญชี', sub: 'Bank reconciliation — จับคู่กับเอกสารที่ยอดใกล้เคียงที่สุด',
  cols: [
  { key: 'date', header: 'วันที่', fmt: 'date' },
  { key: 'account', header: 'บัญชี', hide: 'sm' },
  { key: 'desc', header: 'รายละเอียด' },
  { key: 'ref', header: 'เอกสารอ้างอิง', fmt: 'mono', hide: 'lg' },
  { key: 'amount', header: 'จำนวนเงิน', fmt: 'money', right: true, total: true },
  { key: 'status', header: 'สถานะ', fmt: 'status' }],

  rows: (d) => d.bankTxns.map((t) => ({
    id: t.id, date: t.date, account: d.bankAccts.find((b) => b.id === t.accountId)?.nameTh ?? '—',
    desc: t.desc, ref: t.ref, amount: t.amount, status: t.matched ? 'matched' : 'unmatched'
  })),
  filters: (d) => [
  { key: 'account', label: 'บัญชี', options: d.bankAccts.map((b) => ({ value: b.nameTh, label: b.nameTh })) },
  { key: 'status', label: 'สถานะ', options: opts(['matched', 'unmatched']) }],

  actions: (r, a) => r.status === 'matched' ?
  [{ label: 'ยกเลิกจับคู่', run: () => a.unmatchTxn(r.id) }] :
  [{ label: 'จับคู่เอกสาร', run: () => a.matchTxn(r.id) }]
},
{
  id: 'accounting', th: 'บัญชีแยกประเภท', en: 'Accounting', group: 'บัญชีและภาษี', icon: BookOpenIcon,
  desc: 'สมุดรายวัน งบทดลอง และการปิดงวดบัญชีตามการควบคุมภายใน',
  kpis: (d) => [
  { label: 'รายการในสมุดรายวัน', value: `${ledger(d).length} รายการ` },
  { label: 'ร่างรอผ่านรายการ', value: `${draftJournals(d).length} รายการ`, tone: draftJournals(d).length ? 'warn' : 'ok' },
  { label: 'ปิดงวดถึง', value: dateTH(d.settings.closedThrough), tone: 'info' },
  { label: 'จำนวนบัญชีในผังบัญชี', value: `${d.accounts.length} บัญชี` },
  { label: 'ผลต่างเดบิต–เครดิต', value: thb(trialBalance(d).reduce((s, a) => s + a.debit - a.credit, 0)), tone: 'ok' }],

  panels: (d, a) => {
    const tb = trialBalance(d);
    const debit = tb.reduce((s, x) => s + x.debit, 0);
    const credit = tb.reduce((s, x) => s + x.credit, 0);
    const checks = [
    { left: 'ผ่านรายการสมุดรายวันร่างทั้งหมด', ok: draftJournals(d).length === 0, hint: `${draftJournals(d).length} รายการคงเหลือ` },
    { left: 'จับคู่รายการเดินบัญชีธนาคารครบ', ok: unmatchedList(d).length === 0, hint: `${unmatchedList(d).length} รายการรอจับคู่` },
    { left: 'เคลียร์รายการรออนุมัติ', ok: pendingList(d).length === 0, hint: `${pendingList(d).length} รายการรออนุมัติ` },
    { left: 'เดบิตเท่ากับเครดิต', ok: Math.abs(debit - credit) < 1, hint: `ผลต่าง ${thb(Math.abs(debit - credit))}` }];

    return [
    {
      title: 'ปิดงวดบัญชีประจำเดือน', sub: `Month-end close · ปิดงวดแล้วถึง ${dateTH(d.settings.closedThrough)}`, wide: true,
      lines: checks.map((c) => ({ left: c.left, sub: c.hint, status: c.ok ? 'posted' : 'pending' })),
      action: { label: `ปิดงวดถึง ${dateTH(TODAY)}`, run: a.closeMonth, disabled: checks.some((c) => !c.ok) },
      note: 'ต้องเคลียร์รายการค้างให้ครบก่อนจึงจะปิดงวดได้ — เป็นการควบคุมภายในก่อนออกงบการเงิน'
    },
    {
      title: 'งบทดลองย่อ', sub: 'Trial balance',
      rows: [['ยอดเดบิตรวม', thb(debit)], ['ยอดเครดิตรวม', thb(credit)], ['ผลต่าง', thb(debit - credit), true]] as Array<[string, string, boolean?]>,
      note: 'คำนวณจากยอดยกมาบวกความเคลื่อนไหวของรายการที่ผ่านรายการแล้ว'
    }];

  },
  title: 'สมุดรายวัน', sub: 'General journal — สร้างอัตโนมัติจากเอกสารและบันทึกด้วยมือ',
  cols: [
  { key: 'no', header: 'เลขที่', fmt: 'mono' },
  { key: 'date', header: 'วันที่', fmt: 'date' },
  { key: 'desc', header: 'คำอธิบาย' },
  { key: 'entry', header: 'คู่บัญชี', hide: 'lg' },
  { key: 'source', header: 'ที่มา', hide: 'md' },
  { key: 'amount', header: 'ยอดเดบิตรวม', fmt: 'money', right: true, total: true },
  { key: 'status', header: 'สถานะ', fmt: 'status' }],

  rows: (d) => ledger(d).map((j) => ({
    id: j.id, no: j.no, date: j.date, desc: j.desc, source: j.source, status: j.status,
    amount: j.lines.reduce((s, l) => s + l.debit, 0),
    entry: j.lines.map((l) => `${l.account} ${l.debit ? 'Dr' : 'Cr'}`).join(' / ')
  })),
  filters: (d) => [
  { key: 'status', label: 'สถานะ', options: opts(['draft', 'posted']) },
  { key: 'source', label: 'ที่มา', options: Array.from(new Set(ledger(d).map((j) => j.source))).map((s) => ({ value: s, label: s })) }],

  actions: (r, a) => r.status === 'draft' ? [{ label: 'ผ่านรายการ', run: () => a.postJournal(r.id) }] : []
}];


const CALENDAR = [
{ form: 'ภ.พ.30', desc: 'แบบแสดงรายการภาษีมูลค่าเพิ่ม (VAT return)', due: '2026-08-15' },
{ form: 'ภ.ง.ด.53', desc: 'ภาษีหัก ณ ที่จ่าย นิติบุคคล', due: '2026-08-07' },
{ form: 'ภ.ง.ด.1', desc: 'ภาษีหัก ณ ที่จ่าย เงินเดือน', due: '2026-08-07' },
{ form: 'สปส.1-10', desc: 'เงินสมทบประกันสังคม', due: '2026-08-15' },
{ form: 'ภ.ง.ด.51', desc: 'ภาษีเงินได้นิติบุคคลครึ่งปี', due: '2026-08-31' }];


const FINANCE: Mod[] = [
{
  id: 'tax', th: 'ภาษีและการยื่นแบบ', en: 'Tax', group: 'บัญชีและภาษี', icon: ClipboardCheckIcon,
  desc: 'ภ.พ.30 ภ.ง.ด.53 ภ.ง.ด.1 และปฏิทินการยื่นแบบประจำเดือน',
  kpis: (d) => [
  { label: 'ภาษีขาย', sub: monthTH(MONTH), value: thb(vatReport(d, MONTH).outVat, true) },
  { label: 'ภาษีซื้อ', sub: monthTH(MONTH), value: thb(vatReport(d, MONTH).inVat, true) },
  { label: 'ภาษีที่ต้องชำระ', sub: 'ภ.พ.30', value: thb(vatReport(d, MONTH).net, true), tone: vatReport(d, MONTH).net >= 0 ? 'warn' : 'ok' },
  { label: 'ภาษีหัก ณ ที่จ่ายนำส่ง', value: thb(whtRows(d, MONTH).reduce((s, r) => s + r.amount, 0), true) },
  { label: 'กำหนดยื่น ภ.พ.30', value: dateTH('2026-08-15'), tone: 'info' }],

  panels: (d) => {
    const v = vatReport(d, MONTH);
    const run = d.payroll.find((p) => p.period === MONTH);
    const t = run ? payTotals(run) : { wht: 0, sso: 0, gross: 0, net: 0 };
    return [
    {
      title: `ภาษีมูลค่าเพิ่ม ${monthTH(MONTH)}`, sub: 'ภ.พ.30 · VAT 7%',
      rows: [
      ['ยอดขายที่ต้องเสียภาษี', thb(v.salesBase)], ['ภาษีขาย (Output VAT)', thb(v.outVat)],
      ['ยอดซื้อที่มีภาษีซื้อ', thb(v.buyBase)], ['ภาษีซื้อ (Input VAT)', thb(v.inVat)],
      [v.net >= 0 ? 'ภาษีที่ต้องชำระ' : 'ภาษีชำระเกิน (ขอคืน)', thb(Math.abs(v.net)), true]] as
      Array<[string, string, boolean?]>,
      note: 'ยื่นภายในวันที่ 15 ของเดือนถัดไป'
    },
    {
      title: 'ปฏิทินภาษีและนำส่งเงินสมทบ', sub: 'Filing calendar', wide: true,
      lines: CALENDAR.map((c) => ({ left: `${c.form} — ${c.desc}`, sub: `กำหนดยื่น ${dateTH(c.due)}`, status: 'pending' }))
    },
    {
      title: 'ภาษีและเงินสมทบจากเงินเดือน', sub: `งวด ${monthTH(MONTH)}`,
      rows: [
      ['ภาษีหัก ณ ที่จ่าย (ภ.ง.ด.1)', thb(t.wht)],
      ['ประกันสังคม ลูกจ้าง 5%', thb(t.sso)],
      ['ประกันสังคม นายจ้างสมทบ', thb(t.sso)],
      ['รวมนำส่งหน่วยงานรัฐ', thb(t.wht + t.sso * 2), true]] as
      Array<[string, string, boolean?]>,
      note: 'อัตราประกันสังคม 5% ของค่าจ้าง สูงสุด 750 บาท/คน/เดือน'
    }];

  },
  title: `ภาษีหัก ณ ที่จ่าย — ภ.ง.ด.53 งวด ${monthTH(MONTH)}`, sub: 'Withholding tax certificates',
  cols: [
  { key: 'no', header: 'เอกสารอ้างอิง', fmt: 'mono' },
  { key: 'payee', header: 'ผู้ถูกหักภาษี' },
  { key: 'taxId', header: 'เลขผู้เสียภาษี', fmt: 'mono', hide: 'md' },
  { key: 'type', header: 'ประเภทเงินได้', hide: 'sm' },
  { key: 'base', header: 'ฐานภาษี', fmt: 'money', right: true, total: true },
  { key: 'rate', header: 'อัตรา (%)', fmt: 'num', right: true },
  { key: 'amount', header: 'ภาษีที่หัก', fmt: 'money', right: true, total: true }],

  rows: (d) => whtRows(d, MONTH).map((r) => ({ id: r.no, ...r }))
},
{
  id: 'payroll', th: 'เงินเดือน', en: 'Payroll', group: 'ปฏิบัติการ', icon: WalletIcon,
  desc: 'งวดเงินเดือน ประกันสังคม 5% และภาษีหัก ณ ที่จ่ายพนักงาน',
  kpis: (d) => [
  { label: 'พนักงาน', value: `${d.employees.length} คน` },
  { label: 'ค่าจ้างต่อเดือน', value: thb(d.employees.reduce((s, e) => s + e.salary + e.allowance, 0), true) },
  { label: 'ประกันสังคมต่องวด', value: thb(payTotals(d.payroll[d.payroll.length - 1]).sso, true) },
  { label: 'ภาษีหัก ณ ที่จ่ายต่องวด', value: thb(payTotals(d.payroll[d.payroll.length - 1]).wht, true) },
  { label: 'งวดรออนุมัติ/จ่าย', value: `${d.payroll.filter((p) => p.status !== 'paid').length} งวด`, tone: 'warn' }],

  title: 'งวดเงินเดือน', sub: 'ร่าง → รออนุมัติ → อนุมัติ → จ่ายแล้ว',
  cols: [
  { key: 'periodTh', header: 'งวด' },
  { key: 'payDate', header: 'วันที่จ่าย', fmt: 'date', hide: 'sm' },
  { key: 'headcount', header: 'พนักงาน', fmt: 'num', right: true, hide: 'md' },
  { key: 'gross', header: 'ค่าจ้างรวม', fmt: 'money', right: true, total: true },
  { key: 'sso', header: 'ประกันสังคม', fmt: 'money', right: true, hide: 'lg' },
  { key: 'wht', header: 'ภาษีหัก ณ ที่จ่าย', fmt: 'money', right: true, hide: 'lg' },
  { key: 'net', header: 'จ่ายสุทธิ', fmt: 'money', right: true, total: true },
  { key: 'status', header: 'สถานะ', fmt: 'status' }],

  rows: (d) => d.payroll.map((p) => {
    const t = payTotals(p);
    return { id: p.id, periodTh: monthTH(p.period), payDate: p.payDate, headcount: p.items.length, gross: t.gross, sso: t.sso, wht: t.wht, net: t.net, status: p.status };
  }),
  filters: (d) => [{ key: 'status', label: 'สถานะ', options: opts(d.payroll.map((p) => p.status)) }],
  actions: (r, a) => {
    if (r.status === 'draft') return [{ label: 'ส่งอนุมัติ', run: () => a.submitPayroll(r.id) }];
    if (r.status === 'approved') return [{ label: 'จ่ายเงินเดือน', run: () => a.payPayroll(r.id) }];
    return [];
  },
  panels: (d, a) => [{
    title: 'รายละเอียดพนักงานในงวดล่าสุด', sub: `${monthTH(d.payroll[d.payroll.length - 1].period)} · ${d.employees.length} คน`, wide: true,
    lines: d.payroll[d.payroll.length - 1].items.map((i) => ({
      left: `${empName(d, i.employeeId)} — ${d.employees.find((e) => e.id === i.employeeId)?.position ?? ''}`,
      sub: `เงินเดือน ${thb(i.gross)} · เงินเพิ่ม ${thb(i.allowance)} · ปกส. ${thb(i.sso)} · ภาษี ${thb(i.wht)}`,
      right: thb(i.net)
    })),
    action: { label: 'สร้างงวด ส.ค. 2569', run: a.newPayrollRun }
  }]
},
{
  id: 'assets', th: 'สินทรัพย์ถาวร', en: 'Fixed assets', group: 'ปฏิบัติการ', icon: Building2Icon,
  desc: 'ทะเบียนสินทรัพย์ ค่าเสื่อมราคาแบบเส้นตรง และมูลค่าตามบัญชี',
  kpis: (d) => [
  { label: 'ราคาทุนรวม', value: thb(d.assets.reduce((s, x) => s + x.cost, 0), true) },
  { label: 'มูลค่าตามบัญชี', value: thb(d.assets.filter((x) => x.status === 'active').reduce((s, x) => s + bookValue(x), 0), true) },
  { label: 'ค่าเสื่อมราคาต่อเดือน', value: thb(depMonthly(d), true), tone: 'warn' },
  { label: 'สินทรัพย์ใช้งาน', value: `${d.assets.filter((x) => x.status === 'active').length} รายการ` }],

  title: 'ทะเบียนสินทรัพย์', sub: 'Straight-line depreciation',
  cols: [
  { key: 'code', header: 'รหัส', fmt: 'mono' },
  { key: 'name', header: 'สินทรัพย์' },
  { key: 'category', header: 'หมวด', hide: 'sm' },
  { key: 'date', header: 'วันที่ได้มา', fmt: 'date', hide: 'md' },
  { key: 'cost', header: 'ราคาทุน', fmt: 'money', right: true, total: true },
  { key: 'life', header: 'อายุ (ปี)', fmt: 'num', right: true, hide: 'lg' },
  { key: 'perMonth', header: 'ค่าเสื่อม/เดือน', fmt: 'money', right: true, hide: 'lg' },
  { key: 'book', header: 'มูลค่าตามบัญชี', fmt: 'money', right: true, total: true },
  { key: 'status', header: 'สถานะ', fmt: 'status' }],

  rows: (d) => d.assets.map((x) => ({
    id: x.id, code: x.code, name: x.name, category: x.category, date: x.date, cost: x.cost, life: x.life,
    perMonth: depPerMonth(x), book: x.status === 'active' ? bookValue(x) : 0, status: x.status
  })),
  filters: () => [{ key: 'status', label: 'สถานะ', options: opts(['active', 'disposed']) }],
  actions: (r, a) => r.status === 'active' ? [{ label: 'บันทึกจำหน่าย', run: () => a.disposeAsset(r.id), danger: true }] : []
},
{
  id: 'projects', th: 'โครงการและงบประมาณ', en: 'Projects', group: 'ปฏิบัติการ', icon: PieChartIcon,
  desc: 'ติดตามรายได้ ต้นทุน และกำไรขั้นต้นของแต่ละโครงการเทียบงบประมาณ',
  kpis: (d) => [
  { label: 'โครงการที่ดำเนินอยู่', value: `${d.projects.filter((p) => p.status === 'active').length} โครงการ` },
  { label: 'งบประมาณรวม', value: thb(d.projects.reduce((s, p) => s + p.budget, 0), true) },
  { label: 'รายได้ที่รับรู้', value: thb(d.projects.reduce((s, p) => s + projectPL(d, p.id).revenue, 0), true) },
  { label: 'กำไรขั้นต้นรวม', value: thb(d.projects.reduce((s, p) => s + projectPL(d, p.id).margin, 0), true), tone: 'ok' }],

  title: 'โครงการ', sub: 'Project profitability',
  cols: [
  { key: 'code', header: 'รหัส', fmt: 'mono' },
  { key: 'nameTh', header: 'โครงการ' },
  { key: 'owner', header: 'ผู้รับผิดชอบ', hide: 'md' },
  { key: 'budget', header: 'งบประมาณ', fmt: 'money', right: true, total: true },
  { key: 'revenue', header: 'รายได้', fmt: 'money', right: true, total: true, hide: 'sm' },
  { key: 'cost', header: 'ต้นทุน', fmt: 'money', right: true, total: true, hide: 'lg' },
  { key: 'margin', header: 'กำไรขั้นต้น', fmt: 'money', right: true, total: true },
  { key: 'progress', header: 'ความคืบหน้า', fmt: 'pct', right: true, hide: 'lg' },
  { key: 'status', header: 'สถานะ', fmt: 'status' }],

  rows: (d) => d.projects.map((p) => {
    const f = projectPL(d, p.id);
    return { id: p.id, code: p.code, nameTh: p.nameTh, owner: p.owner, budget: p.budget, revenue: f.revenue, cost: f.cost, margin: f.margin, progress: p.progress, status: p.status };
  }),
  filters: () => [{ key: 'status', label: 'สถานะ', options: opts(['active', 'planning']) }]
},
{
  id: 'reports', th: 'รายงานผู้บริหาร', en: 'Reports', group: 'บัญชีและภาษี', icon: BarChart3Icon,
  desc: 'งบกำไรขาดทุน อายุลูกหนี้–เจ้าหนี้ กระแสเงินสด และยอดขายตามลูกค้า',
  kpis: (d) => [
  { label: 'รายได้รวม', value: thb(pl(d).totalRev, true) },
  { label: 'ต้นทุนและค่าใช้จ่าย', value: thb(pl(d).cogs + pl(d).totalExp, true), tone: 'warn' },
  { label: 'กำไรสุทธิ', value: thb(pl(d).net, true), tone: pl(d).net >= 0 ? 'ok' : 'bad' },
  { label: 'อัตรากำไรสุทธิ', value: `${pl(d).totalRev ? Math.round(pl(d).net / pl(d).totalRev * 100) : 0}%`, tone: 'info' },
  { label: 'เงินสดคงเหลือ', value: thb(cash(d), true) }],

  panels: (d) => {
    const p = pl(d);
    const arB = aging(arList(d).map((x) => ({ due: x.due, amount: dueOf(x) })));
    const apB = aging(apList(d).map((x) => ({ due: x.due, amount: dueOf(x) })));
    const maxAr = Math.max(...arB.map((b) => b.amount), 1);
    const maxAp = Math.max(...apB.map((b) => b.amount), 1);
    const byCustomer = d.contacts.filter((c) => c.type === 'customer').map((c) => ({
      name: c.nameTh,
      amount: d.docs.filter((x) => x.kind === 'invoice' && x.contactId === c.id).reduce((s, x) => s + baseOf(x.lines), 0)
    })).sort((a, b) => b.amount - a.amount);
    const maxCust = Math.max(...byCustomer.map((c) => c.amount), 1);
    const payrollDue = d.payroll.filter((x) => x.status !== 'paid').reduce((s, x) => s + payTotals(x).net, 0);
    return [
    {
      title: 'งบกำไรขาดทุน', sub: `Profit & loss · มี.ค. – ${monthTH(MONTH)} 2569`, wide: true,
      rows: [
      ...p.rev.map((r) => [`${r.code} ${r.name}`, thb(r.amount)] as [string, string]),
      ['รวมรายได้', thb(p.totalRev), true] as [string, string, boolean],
      ['ต้นทุนขาย (COGS)', thb(p.cogs)] as [string, string],
      ['กำไรขั้นต้น', thb(p.gross), true] as [string, string, boolean],
      ...p.exp.map((r) => [`${r.code} ${r.name}`, thb(r.amount)] as [string, string]),
      ['รวมค่าใช้จ่ายดำเนินงาน', thb(p.totalExp), true] as [string, string, boolean],
      ['กำไรสุทธิ', thb(p.net), true] as [string, string, boolean]]

    },
    {
      title: 'สถานะเงินสดและประมาณการ', sub: 'Cash position & outlook',
      rows: [
      ['เงินสดและเงินฝากคงเหลือ', thb(cash(d))], ['คาดว่าจะรับจากลูกหนี้', thb(ar(d))],
      ['ภาระจ่ายเจ้าหนี้', thb(-ap(d))], ['เงินเดือนที่ยังไม่จ่าย', thb(-payrollDue)],
      ['ประมาณการเงินสดปลายงวด', thb(cash(d) + ar(d) - ap(d) - payrollDue), true]] as
      Array<[string, string, boolean?]>
    },
    { title: 'อายุลูกหนี้', sub: 'AR aging', bars: arB.map((b) => ({ label: b.label, note: thb(b.amount), value: b.amount, max: maxAr, tone: (b.label === 'ยังไม่ครบกำหนด' ? 'info' : 'warn') as Tone })) },
    { title: 'อายุเจ้าหนี้', sub: 'AP aging', bars: apB.map((b) => ({ label: b.label, note: thb(b.amount), value: b.amount, max: maxAp, tone: (b.label === 'ยังไม่ครบกำหนด' ? 'info' : 'warn') as Tone })) },
    { title: 'ยอดขายตามลูกค้า', sub: 'Revenue by customer (ไม่รวม VAT)', bars: byCustomer.map((c) => ({ label: c.name, note: thb(c.amount), value: c.amount, max: maxCust, tone: 'info' as Tone })) }];

  },
  title: 'ผลการดำเนินงานตามโครงการ', sub: 'Project margin summary',
  cols: [
  { key: 'nameTh', header: 'โครงการ' },
  { key: 'owner', header: 'ผู้รับผิดชอบ', hide: 'md' },
  { key: 'budget', header: 'งบประมาณ', fmt: 'money', right: true, total: true },
  { key: 'revenue', header: 'รายได้', fmt: 'money', right: true, total: true },
  { key: 'cost', header: 'ต้นทุน', fmt: 'money', right: true, total: true, hide: 'sm' },
  { key: 'margin', header: 'กำไรขั้นต้น', fmt: 'money', right: true, total: true },
  { key: 'status', header: 'สถานะ', fmt: 'status' }],

  rows: (d) => d.projects.map((p) => {
    const f = projectPL(d, p.id);
    return { id: p.id, nameTh: p.nameTh, owner: p.owner, budget: p.budget, revenue: f.revenue, cost: f.cost, margin: f.margin, status: p.status };
  })
}];


const MODULES: Mod[] = [...CORE, ...MASTER, ...FINANCE];
const GROUPS = ['ภาพรวม', 'วงจรรายได้', 'วงจรรายจ่าย', 'ข้อมูลหลัก', 'ปฏิบัติการ', 'บัญชีและภาษี'];

function Nav({ active, collapsed, onPick }: {active: string;collapsed: boolean;onPick: (id: string) => void;}) {
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="เมนูโมดูล">
      {GROUPS.map((g) =>
      <div key={g} className="mb-3">
          {!collapsed ? <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{g}</p> : null}
          <ul className="space-y-0.5">
            {MODULES.filter((m) => m.group === g).map((m) => {
            const Icon = m.icon;
            const on = m.id === active;
            return (
              <li key={m.id}>
                  <button
                  type="button"
                  onClick={() => onPick(m.id)}
                  title={collapsed ? `${m.th} · ${m.en}` : undefined}
                  aria-current={on ? 'page' : undefined}
                  className={cx('flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors',
                  on ? 'bg-blue-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  collapsed && 'justify-center px-0')}>

                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed ?
                  <span className="min-w-0 flex-1 truncate">
                        {m.th}
                        <span className={cx('ml-1.5 text-[10.5px]', on ? 'text-white/70' : 'text-slate-500')}>{m.en}</span>
                      </span> :
                  null}
                  </button>
                </li>);

          })}
          </ul>
        </div>
      )}
    </nav>);

}

export function App() {
  const { data, actions, toasts } = useStore();
  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const m = useMemo(() => MODULES.find((x) => x.id === active) ?? MODULES[0], [active]);
  const pending = pendingList(data).length;

  const go = (id: string) => {
    setActive(id);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const brand =
  <div className="flex items-center gap-2.5 px-3 py-3.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-[13px] font-bold text-white">ส</span>
      {!collapsed ?
    <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold text-white">{data.company.nameTh}</p>
          <p className="truncate text-[10.5px] text-slate-400">{data.company.nameEn} · {data.company.taxId}</p>
        </div> :
    null}
    </div>;


  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      <aside className={cx('sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-900 lg:flex', collapsed ? 'w-[68px]' : 'w-[250px]')}>
        {brand}
        <Nav active={active} collapsed={collapsed} onPick={go} />
        <div className="border-t border-slate-800 p-2">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-[12px] text-slate-300 hover:bg-slate-800 hover:text-white">

            {collapsed ? <ChevronsRightIcon className="h-4 w-4" /> : <ChevronsLeftIcon className="h-4 w-4" />}
            {!collapsed ? 'ย่อเมนู' : null}
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {open ?
        <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.button
            type="button" aria-label="ปิดเมนู" className="absolute inset-0 bg-slate-900/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />

            <motion.aside
            className="relative flex h-full w-[258px] flex-col bg-slate-900"
            initial={{ x: -24, opacity: 0.6 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}>

              <div className="flex items-center justify-between">
                {brand}
                <button type="button" onClick={() => setOpen(false)} aria-label="ปิดเมนู" className="mr-2 rounded-lg p-1.5 text-slate-300 hover:bg-slate-800">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <Nav active={active} collapsed={false} onPick={go} />
            </motion.aside>
          </div> :
        null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
          <button type="button" onClick={() => setOpen(true)} aria-label="เปิดเมนู" className="rounded-lg border border-slate-200 p-1.5 text-slate-700 lg:hidden">
            <MenuIcon className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-slate-900">{m.th} <span className="font-normal text-slate-400">/ {m.en}</span></p>
            <p className="truncate text-[11px] text-slate-500">ปีบัญชี 2569 · ข้อมูล ณ {dateTH(TODAY)} · สกุลเงินบาท (THB)</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 sm:inline-flex">
              <LockIcon className="h-3 w-3" /> ปิดงวดถึง {dateTH(data.settings.closedThrough)}
            </span>
            <button
              type="button" onClick={() => go('approvals')}
              className={cx('rounded-full border px-2.5 py-1 text-[11px] font-medium', pending ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-500')}>

              รออนุมัติ {pending}
            </button>
            <Button size="sm" icon={RotateCcwIcon} onClick={actions.reset}>คืนค่าข้อมูล</Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 space-y-4 px-4 py-4 lg:px-6 lg:py-5">
          <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="space-y-4">
            <div>
              <h1 className="text-[19px] font-semibold tracking-tight text-slate-900">
                {m.th} <span className="ml-1 text-[13px] font-normal text-slate-400">{m.en}</span>
              </h1>
              <p className="mt-0.5 max-w-3xl text-[12.5px] text-slate-500">{m.desc}</p>
            </div>

            <KpiStrip items={m.kpis(data)} />
            {m.panels ? <Panels items={m.panels(data, actions)} /> : null}

            {m.cols && m.rows ?
            <Card>
                <CardHead title={m.title ?? m.th} sub={m.sub} />
                <DataTable
                cols={m.cols}
                rows={m.rows(data)}
                filters={m.filters ? m.filters(data) : []}
                actions={m.actions ? (r) => m.actions ? m.actions(r, actions) : [] : undefined} />

              </Card> :
            null}
          </motion.div>
        </main>

        <footer className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-400 lg:px-6">
          ต้นแบบระบบบัญชีและ ERP ภาษาไทย · ข้อมูลตัวอย่างบันทึกในเบราว์เซอร์ (localStorage) · VAT 7% และภาษีหัก ณ ที่จ่ายตามแนวปฏิบัติไทย
        </footer>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) =>
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            className={cx('pointer-events-auto flex items-start gap-2 rounded-xl border bg-white px-3 py-2.5 text-[12.5px] shadow-lg', t.tone === 'ok' ? 'border-emerald-200' : 'border-rose-200')}>

              {t.tone === 'ok' ?
            <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> :
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />}
              <span className="text-slate-900">{t.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>);

}