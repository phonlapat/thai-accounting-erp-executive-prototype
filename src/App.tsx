import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircleIcon, BarChart3Icon, BookOpenIcon, Building2Icon, BoxesIcon, CheckCircle2Icon, ChevronsLeftIcon,
  ChevronsRightIcon, ClipboardCheckIcon, EyeIcon, EyeOffIcon, FileTextIcon, InboxIcon, LandmarkIcon, LayoutDashboardIcon,
  LogOutIcon, MenuIcon, PackageIcon, PieChartIcon, ReceiptIcon, RotateCcwIcon, ShieldCheckIcon, ShoppingCartIcon, UsersIcon, WalletIcon, XIcon } from
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
import { Button, Card, CardHead, ConfirmDialog, DataTable, KpiStrip, Panels, cx } from './ui';
import type { Col, FilterSpec, PanelSpec, RowAction, RowData } from './ui';

interface Kpi {label: string;sub?: string;value: string;tone?: Tone;hint?: string;}
interface Mod {
  id: string;th: string;en: string;group: string;desc: string;
  icon: React.ComponentType<{className?: string;}>;
  kpis: (d: AppData) => Kpi[];
  panels?: (d: AppData, a: Actions, navigate: (id: string) => void) => PanelSpec[];
  title?: string;sub?: string;
  cols?: Col[];
  rows?: (d: AppData) => RowData[];
  filters?: (d: AppData) => FilterSpec[];
  actions?: (r: RowData, a: Actions) => RowAction[];
}

const KIND_TH: Record<string, string> = { quote: 'ใบเสนอราคา', invoice: 'ใบแจ้งหนี้', receipt: 'ใบเสร็จรับเงิน', po: 'ใบสั่งซื้อ', bill: 'บิลซื้อ' };
const APPROVAL_TH: Record<AppData['approvals'][number]['kind'], string> = { bill: 'บิลซื้อ', expense: 'ค่าใช้จ่าย', payroll: 'เงินเดือน', journal: 'สมุดรายวัน' };
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
  kpis: (d) => {
    const latest = series(d).slice(-1)[0];
    const urgent = overdueList(d).length + lowStock(d).length + (CALENDAR.length ? 1 : 0);
    return [
    { label: 'กำไรล่าสุด', value: latest ? `${latest.profit > 0 ? '+' : ''}${thb(latest.profit, true)}` : '—', tone: latest?.profit && latest.profit < 0 ? 'bad' : 'ok' as Tone },
    { label: 'เงินสด', value: thb(cash(d), true), tone: 'info' as Tone },
    { label: 'เร่งด่วน', value: String(urgent), tone: urgent ? 'bad' : 'ok' as Tone },
    { label: 'รออนุมัติ', value: String(pendingList(d).length), tone: pendingList(d).length ? 'warn' : 'ok' as Tone }];
  },

  panels: (d, a, navigate) => {
    const history = series(d);
    const profit = history.slice(-5);
    const latestProfit = profit[profit.length - 1];
    const previousProfit = profit[profit.length - 2];
    const profitChange = latestProfit && previousProfit ? latestProfit.profit - previousProfit.profit : 0;
    const profitTotal = profit.reduce((sum, item) => sum + item.profit, 0);
    const profitableMonths = profit.filter((item) => item.profit >= 0).length;
    const nextTax = [...CALENDAR].sort((x, y) => x.due.localeCompare(y.due))[0];
    return [
    {
      title: 'ผลประกอบการ 5 เดือน', sub: `${dateTH(`${profit[0]?.month}-01`).split(' ')[1]}–${dateTH(`${latestProfit?.month}-01`).split(' ')[1]} 69 · บาท`, dashboardArea: 'performance' as const,
      performance: latestProfit ? {
        period: dateTH(`${latestProfit.month}-01`).split(' ').slice(1).join(' '),
        revenue: thb(latestProfit.revenue, true), expense: thb(latestProfit.expense, true),
        profit: `${latestProfit.profit > 0 ? '+' : ''}${thb(latestProfit.profit, true)}`, profitValue: latestProfit.profit,
        change: previousProfit ? `${profitChange >= 0 ? '+' : ''}${thb(profitChange, true)}` : undefined,
        changeLabel: previousProfit ? `${profitChange >= 0 ? 'ดีขึ้น' : 'ลดลง'}จาก ${dateTH(`${previousProfit.month}-01`).split(' ')[1]}` : undefined,
        changePositive: profitChange >= 0,
        total: thb(profitTotal, true), totalPositive: profitTotal >= 0,
        profitableMonths: `${profitableMonths} จาก ${profit.length} เดือน`,
        points: profit.map((x, index) => ({ label: dateTH(`${x.month}-01`).split(' ')[1], value: x.profit, note: thb(x.profit, true), current: index === profit.length - 1 }))
      } : undefined
    },
    {
      title: 'รออนุมัติ', dashboardArea: 'approvals' as const,
      lines: pendingList(d).slice(0, 2).map((x) => ({
        left: APPROVAL_TH[x.kind], sub: `${x.refNo} · ${dateTH(x.date)}`, right: thb(x.amount),
        actions: [{ label: 'อนุมัติ', ariaLabel: `อนุมัติ ${x.refNo}`, run: () => a.decide(x.id, true),
          confirm: { title: `อนุมัติ ${x.refNo}?`, description: `ระบบจะอนุมัติยอด ${thb(x.amount)} และปลดล็อกขั้นตอนถัดไป`, confirmLabel: 'ยืนยันอนุมัติ' } }, { label: 'ไม่อนุมัติ', run: () => a.decide(x.id, false), danger: true,
          ariaLabel: `ไม่อนุมัติ ${x.refNo}`,
          confirm: { title: `ไม่อนุมัติ ${x.refNo}?`, description: 'รายการจะถูกส่งกลับและขั้นตอนถัดไปจะไม่ถูกดำเนินการ', confirmLabel: 'ยืนยันไม่อนุมัติ' } }]
      })),
      empty: 'ไม่มีรายการค้างอนุมัติ',
      action: { label: 'ดูทั้งหมด', run: () => navigate('approvals'), variant: 'ghost' as const }
    },
    {
      title: 'ต้องทำวันนี้', dashboardArea: 'urgent' as const,
      lines: [
      ...overdueList(d).slice(0, 2).map((x) => ({
        left: `${x.no} · ลูกหนี้เกินกำหนด`,
        sub: `${Math.floor((Date.parse(TODAY) - Date.parse(x.due)) / 864e5)} วัน · ${contactName(d, x.contactId)}`, tone: 'bad' as Tone, right: thb(dueOf(x)),
        actions: [{ label: 'ดูบิล', ariaLabel: `ดูบิล ${x.no}`, run: () => navigate('sales'), variant: 'ghost' as const }]
      })),
      ...lowStock(d).slice(0, 1).map((p2) => ({
        left: `${p2.code} · สต๊อกต่ำ`, sub: p2.nameTh, tone: 'bad' as Tone, right: `${num(stockOf(p2))} / ${num(p2.reorder)}`,
        actions: [{ label: 'ดูสต๊อก', ariaLabel: `ดูสต๊อก ${p2.code}`, run: () => navigate('inventory'), variant: 'ghost' as const }]
      })),
      ...(nextTax ? [{ left: `${nextTax.form} · ยื่นภาษี`, sub: 'ครบกำหนด', tone: 'warn' as Tone, right: dateTH(nextTax.due), actions: [{ label: 'ดูภาษี', ariaLabel: `ดูภาษี ${nextTax.form}`, run: () => navigate('tax'), variant: 'ghost' as const }] }] : [])],
      empty: 'ไม่มีรายการเร่งด่วน'
    }].sort((left, right) => {
      const order = { urgent: 0, performance: 1, approvals: 2 } as const;
      return order[left.dashboardArea] - order[right.dashboardArea];
    });

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
    if (r.kind === 'quote' && r.status !== 'converted') return [{ label: 'สร้างใบแจ้งหนี้', run: () => a.convertQuote(r.id) }];
    if (r.kind === 'invoice' && N(r.out) > 0.5) return [{ label: 'รับชำระ', run: () => a.receivePayment(r.id),
      confirm: { title: `รับชำระ ${String(r.no)}?`, description: `ระบบจะบันทึกรับเงิน ${thb(N(r.out))} และออกใบเสร็จรับเงิน`, confirmLabel: 'ยืนยันรับชำระ' } }];
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
    if (r.kind === 'po' && r.received === 'n' && r.status !== 'converted') return [{ label: 'รับสินค้า', run: () => a.receivePO(r.id),
      confirm: { title: `รับสินค้าตาม ${String(r.no)}?`, description: 'จำนวนสินค้าจะถูกเพิ่มเข้าคลังตามใบสั่งซื้อนี้', confirmLabel: 'ยืนยันรับสินค้า' } }];
    if (r.kind === 'po' && r.received === 'y' && r.status !== 'converted') return [{ label: 'สร้างบิล', run: () => a.billFromPO(r.id),
      confirm: { title: `สร้างบิลจาก ${String(r.no)}?`, description: 'ระบบจะตั้งหนี้เจ้าหนี้และส่งอนุมัติเมื่อยอดเกินเกณฑ์', confirmLabel: 'ยืนยันสร้างบิล' } }];
    if (r.kind === 'bill' && r.status !== 'pending' && N(r.out) > 0.5) return [{ label: 'จ่ายเงิน', run: () => a.payBill(r.id),
      confirm: { title: `จ่าย ${String(r.no)}?`, description: `ระบบจะบันทึกเงินออก ${thb(N(r.out))} และปิดยอดเจ้าหนี้`, confirmLabel: 'ยืนยันจ่ายเงิน' } }];
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
    if (r.status === 'approved') return [{ label: 'จ่ายคืน', run: () => a.payExpense(r.id),
      confirm: { title: `จ่ายคืน ${String(r.no)}?`, description: `ระบบจะบันทึกเงินออก ${thb(N(r.amount))} จากเงินสดย่อย`, confirmLabel: 'ยืนยันจ่ายคืน' } }];
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
    kindTh: APPROVAL_TH[x.kind]
  })),
  filters: (d) => [{ key: 'status', label: 'สถานะ', options: opts(d.approvals.map((x) => x.status)) }],
  actions: (r, a) => r.status === 'pending' ?
  [{ label: 'อนุมัติ', run: () => a.decide(r.id, true),
    confirm: { title: `อนุมัติ ${String(r.refNo ?? 'รายการนี้')}?`, description: `ระบบจะอนุมัติยอด ${thb(N(r.amount))} และปลดล็อกขั้นตอนถัดไป`, confirmLabel: 'ยืนยันอนุมัติ' } }, { label: 'ไม่อนุมัติ', run: () => a.decide(r.id, false), danger: true,
    confirm: { title: `ไม่อนุมัติ ${String(r.refNo ?? 'รายการนี้')}?`, description: 'รายการจะถูกส่งกลับและขั้นตอนถัดไปจะไม่ถูกดำเนินการ', confirmLabel: 'ยืนยันไม่อนุมัติ' } }] :
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
    title: 'ใบสั่งซื้อรอรับของ', wide: true,
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
    action: { label: `กระทบยอดถึง ${dateTH(TODAY)}`, run: () => a.reconcile(b.id), disabled: d.bankTxns.some((t) => t.accountId === b.id && !t.matched),
      confirm: { title: `กระทบยอด ${b.nameTh}?`, description: 'ระบบจะบันทึกวันที่กระทบยอดเมื่อรายการทั้งหมดถูกจับคู่แล้ว', confirmLabel: 'ยืนยันกระทบยอด' } }
  })),
  title: 'รายการธนาคาร',
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
  [{ label: 'ยกเลิกจับคู่', run: () => a.unmatchTxn(r.id), danger: true,
    confirm: { title: 'ยกเลิกการจับคู่?', description: 'รายการธนาคารนี้จะกลับไปอยู่ในรายการรอตรวจสอบ', confirmLabel: 'ยืนยันยกเลิก' } }] :
  [{ label: 'จับคู่อัตโนมัติ', run: () => a.matchTxn(r.id),
    confirm: { title: 'จับคู่รายการอัตโนมัติ?', description: 'ระบบจะเลือกเอกสารที่มียอดใกล้เคียงที่สุด คุณสามารถยกเลิกการจับคู่ได้ภายหลัง', confirmLabel: 'ยืนยันจับคู่' } }]
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
      title: 'ปิดงวด', sub: `ปิดแล้วถึง ${dateTH(d.settings.closedThrough)}`, wide: true,
      lines: checks.map((c) => ({ left: c.left, sub: c.hint, status: c.ok ? 'posted' : 'pending' })),
      action: { label: `ปิดงวดถึง ${dateTH(TODAY)}`, run: a.closeMonth, disabled: checks.some((c) => !c.ok),
        confirm: { title: 'ปิดงวดบัญชี?', description: 'หลังปิดงวด รายการในช่วงเวลานี้ควรถูกแก้ไขผ่านรายการปรับปรุงเท่านั้น', confirmLabel: 'ยืนยันปิดงวด' } },
      note: 'ต้องเคลียร์รายการค้างให้ครบก่อนจึงจะปิดงวดได้ — เป็นการควบคุมภายในก่อนออกงบการเงิน'
    },
    {
      title: 'งบทดลอง',
      rows: [['ยอดเดบิตรวม', thb(debit)], ['ยอดเครดิตรวม', thb(credit)], ['ผลต่าง', thb(debit - credit), true]] as Array<[string, string, boolean?]>,
      note: 'คำนวณจากยอดยกมาบวกความเคลื่อนไหวของรายการที่ผ่านรายการแล้ว'
    }];

  },
  title: 'สมุดรายวัน',
  cols: [
  { key: 'no', header: 'เลขที่', fmt: 'mono' },
  { key: 'date', header: 'วันที่', fmt: 'date' },
  { key: 'desc', header: 'คำอธิบาย' },
  { key: 'entry', header: 'คู่บัญชี', hide: 'lg' },
  { key: 'source', header: 'ที่มา', hide: 'md' },
  { key: 'amount', header: 'ยอดเดบิตรวม', fmt: 'money', right: true, total: true },
  { key: 'status', header: 'สถานะ', fmt: 'status' }],

  rows: (d) => ledger(d).map((j) => {
    const approval = d.approvals.find((item) => item.refId === j.id);
    return {
      id: j.id, no: j.no, date: j.date, desc: j.desc, source: j.source,
      status: approval && approval.status !== 'approved' ? approval.status : j.status,
      canPost: j.status === 'draft' && !approval ? 'y' : 'n',
      amount: j.lines.reduce((s, l) => s + l.debit, 0),
      entry: j.lines.map((l) => `${l.account} ${l.debit ? 'Dr' : 'Cr'}`).join(' / ')
    };
  }),
  filters: (d) => [
  { key: 'status', label: 'สถานะ', options: opts(ledger(d).map((j) => {
    const approval = d.approvals.find((item) => item.refId === j.id);
    return approval && approval.status !== 'approved' ? approval.status : j.status;
  })) },
  { key: 'source', label: 'ที่มา', options: Array.from(new Set(ledger(d).map((j) => j.source))).map((s) => ({ value: s, label: s })) }],

  actions: (r, a) => r.canPost === 'y' ? [{ label: 'ลงบัญชี', run: () => a.postJournal(r.id),
    confirm: { title: `ลงบัญชี ${String(r.no)}?`, description: 'รายการนี้จะถูกผ่านเข้าบัญชีแยกประเภทและงบทดลอง', confirmLabel: 'ยืนยันลงบัญชี' } }] : []
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
      title: `ภ.พ.30 · ${monthTH(MONTH)}`,
      rows: [
      ['ยอดขายที่ต้องเสียภาษี', thb(v.salesBase)], ['ภาษีขาย (Output VAT)', thb(v.outVat)],
      ['ยอดซื้อที่มีภาษีซื้อ', thb(v.buyBase)], ['ภาษีซื้อ (Input VAT)', thb(v.inVat)],
      [v.net >= 0 ? 'ภาษีที่ต้องชำระ' : 'ภาษีชำระเกิน (ขอคืน)', thb(Math.abs(v.net)), true]] as
      Array<[string, string, boolean?]>,
      note: 'ยื่นภายในวันที่ 15 ของเดือนถัดไป'
    },
    {
      title: 'วันครบกำหนด', wide: true,
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
  title: `ภ.ง.ด.53 · ${monthTH(MONTH)}`,
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

  title: 'งวดเงินเดือน',
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
    if (r.status === 'approved') return [{ label: 'จ่ายเงินเดือน', run: () => a.payPayroll(r.id),
      confirm: { title: `จ่ายเงินเดือน ${String(r.periodTh)}?`, description: `ระบบจะบันทึกเงินออกสุทธิ ${thb(N(r.net))} และผ่านรายการบัญชี`, confirmLabel: 'ยืนยันจ่ายเงินเดือน' } }];
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

  title: 'ทะเบียนสินทรัพย์',
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
  actions: (r, a) => r.status === 'active' ? [{ label: 'บันทึกจำหน่าย', run: () => a.disposeAsset(r.id), danger: true,
    confirm: { title: `จำหน่าย ${String(r.code ?? 'สินทรัพย์')}?`, description: 'สินทรัพย์จะถูกเปลี่ยนเป็นสถานะจำหน่ายและหยุดคำนวณค่าเสื่อมราคา', confirmLabel: 'ยืนยันจำหน่าย' } }] : []
},
{
  id: 'projects', th: 'โครงการและงบประมาณ', en: 'Projects', group: 'ปฏิบัติการ', icon: PieChartIcon,
  desc: 'ติดตามรายได้ ต้นทุน และกำไรขั้นต้นของแต่ละโครงการเทียบงบประมาณ',
  kpis: (d) => [
  { label: 'โครงการที่ดำเนินอยู่', value: `${d.projects.filter((p) => p.status === 'active').length} โครงการ` },
  { label: 'งบประมาณรวม', value: thb(d.projects.reduce((s, p) => s + p.budget, 0), true) },
  { label: 'รายได้ที่รับรู้', value: thb(d.projects.reduce((s, p) => s + projectPL(d, p.id).revenue, 0), true) },
  { label: 'กำไรขั้นต้นรวม', value: thb(d.projects.reduce((s, p) => s + projectPL(d, p.id).margin, 0), true), tone: 'ok' }],

  title: 'โครงการ',
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
      title: 'งบกำไรขาดทุน', sub: `มี.ค. – ${monthTH(MONTH)} 2569`, wide: true,
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
      title: 'ประมาณการเงินสด',
      rows: [
      ['เงินสดและเงินฝากคงเหลือ', thb(cash(d))], ['คาดว่าจะรับจากลูกหนี้', thb(ar(d))],
      ['ภาระจ่ายเจ้าหนี้', thb(-ap(d))], ['เงินเดือนที่ยังไม่จ่าย', thb(-payrollDue)],
      ['ประมาณการเงินสดปลายงวด', thb(cash(d) + ar(d) - ap(d) - payrollDue), true]] as
      Array<[string, string, boolean?]>
    },
    { title: 'อายุลูกหนี้', bars: arB.map((b) => ({ label: b.label, note: thb(b.amount), value: b.amount, max: maxAr, tone: (b.label === 'ยังไม่ครบกำหนด' ? 'info' : 'warn') as Tone })) },
    { title: 'อายุเจ้าหนี้', bars: apB.map((b) => ({ label: b.label, note: thb(b.amount), value: b.amount, max: maxAp, tone: (b.label === 'ยังไม่ครบกำหนด' ? 'info' : 'warn') as Tone })) },
    { title: 'ยอดขายตามลูกค้า', bars: byCustomer.map((c) => ({ label: c.name, note: thb(c.amount), value: c.amount, max: maxCust, tone: 'info' as Tone })) }];

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
const GROUPS = [
  { label: 'หน้าหลัก', ids: ['dashboard', 'approvals'] },
  { label: 'ซื้อและขาย', ids: ['sales', 'purchases', 'expenses'] },
  { label: 'งานประจำ', ids: ['contacts', 'products', 'inventory', 'banking', 'payroll'] },
  { label: 'บัญชีและรายงาน', ids: ['accounting', 'tax', 'assets', 'projects', 'reports'] }
];

function Nav({ active, collapsed, onPick }: {active: string;collapsed: boolean;onPick: (id: string) => void;}) {
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="เมนูโมดูล">
      {GROUPS.map((g) =>
      <div key={g.label} className="mb-4">
          {!collapsed ? <p className="px-2 pb-1.5 text-[11px] font-medium text-slate-500">{g.label}</p> : null}
          <ul className="space-y-0.5">
            {g.ids.map((id) => MODULES.find((m) => m.id === id)).filter((m): m is Mod => Boolean(m)).map((m) => {
            const Icon = m.icon;
            const on = m.id === active;
            return (
              <li key={m.id}>
                  <button
                  type="button"
                  onClick={() => onPick(m.id)}
                  title={collapsed ? m.th : undefined}
                  aria-label={collapsed ? m.th : undefined}
                  aria-current={on ? 'page' : undefined}
                  className={cx('flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                  on ? 'bg-blue-700 text-white' : 'text-blue-100/80 hover:bg-slate-800 hover:text-white',
                  collapsed && 'justify-center px-0')}>

                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed ?
                  <span className="min-w-0 flex-1 truncate">{m.th}</span> :
                  null}
                  </button>
                </li>);

          })}
          </ul>
        </div>
      )}
    </nav>);

}

interface DemoSession { email: string; }

const COLLAPSED_KEY = 'thai-erp-sidebar-collapsed';

function moduleFromLocation() {
  const id = window.location.hash.replace(/^#\/?/, '');
  return MODULES.some((item) => item.id === id) ? id : 'dashboard';
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function Workbench({ session, onSignOut }: {session: DemoSession;onSignOut: () => void;}) {
  const { data, actions, toasts, storageIssue } = useStore();
  const [active, setActive] = useState(moduleFromLocation);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenuRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const pageTitleRef = useRef<HTMLHeadingElement>(null);
  const m = useMemo(() => MODULES.find((x) => x.id === active) ?? MODULES[0], [active]);
  const pending = pendingList(data).length;

  const go = (id: string) => {
    if (!MODULES.some((item) => item.id === id)) return;
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
    setActive(id);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    window.requestAnimationFrame(() => pageTitleRef.current?.focus());
  };

  useEffect(() => {
    const onHistory = () => setActive(moduleFromLocation());
    window.addEventListener('popstate', onHistory);
    window.addEventListener('hashchange', onHistory);
    return () => {
      window.removeEventListener('popstate', onHistory);
      window.removeEventListener('hashchange', onHistory);
    };
  }, []);

  useEffect(() => {
    document.title = `${m.th} | Siam ERP`;
  }, [m.th]);

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, String(collapsed)); } catch { /* preference storage is optional */ }
  }, [collapsed]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeMenuRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const resetDemo = () => {
    actions.reset();
    setConfirmReset(false);
  };

  const brand = (compact: boolean) =>
  <div className="flex items-center gap-2.5 px-3 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-[14px] font-bold text-white shadow-[0_8px_20px_-12px_rgba(37,99,235,0.9)]">ส</span>
      {!compact ?
    <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">Siam ERP</p>
          <p className="truncate text-[10.5px] text-slate-400">{data.company.nameTh.replace(' (ข้อมูลสาธิต)', '')}</p>
        </div> :
    null}
    </div>;


  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      <button type="button" onClick={() => document.getElementById('main-content')?.focus()} className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-lg focus:translate-y-0">ข้ามไปเนื้อหา</button>
      <aside className={cx('sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-950 lg:flex', collapsed ? 'w-[72px]' : 'w-[260px]')}>
        {brand(collapsed)}
        <Nav active={active} collapsed={collapsed} onPick={go} />
        <div className="border-t border-slate-800 p-2">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-[12px] text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">

            {collapsed ? <ChevronsRightIcon className="h-4 w-4" /> : <ChevronsLeftIcon className="h-4 w-4" />}
            {!collapsed ? 'ย่อเมนู' : null}
          </button>
        </div>
      </aside>

      {open ?
        <div className="fixed inset-0 z-50 flex lg:hidden">
            <button
            type="button" aria-label="ปิดเมนู" className="erp-fade-in absolute inset-0 bg-slate-900/50"
            onClick={() => { setOpen(false); window.requestAnimationFrame(() => menuButtonRef.current?.focus()); }} />

            <aside
            ref={drawerRef}
            className="erp-drawer-in relative flex h-full w-[272px] flex-col bg-slate-950 shadow-[18px_0_50px_-28px_rgba(15,23,42,0.9)]"
            role="dialog" aria-modal="true" aria-label="เมนูหลัก"
            >

              <div className="flex items-center justify-between">
                {brand(false)}
                <button ref={closeMenuRef} type="button" onClick={() => { setOpen(false); window.requestAnimationFrame(() => menuButtonRef.current?.focus()); }} aria-label="ปิดเมนู" className="mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <Nav active={active} collapsed={false} onPick={go} />
            </aside>
          </div> :
        null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-4 lg:min-h-16 lg:px-6">
          <button ref={menuButtonRef} type="button" onClick={() => setOpen(true)} aria-label="เปิดเมนู" className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:hidden">
            <MenuIcon className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 ref={pageTitleRef} tabIndex={-1} className="truncate text-[16px] font-semibold tracking-[-0.02em] text-slate-950 outline-none lg:text-[18px]">{m.th}</h1>
            <p className={cx('max-w-[72ch] truncate text-[10.5px] text-slate-500', m.id === 'dashboard' ? 'block' : 'hidden xl:block')}>
              {m.id === 'dashboard' ? `ข้อมูล ${dateTH(TODAY)} · ปิดงวด ${dateTH(data.settings.closedThrough)}` : m.desc}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button" onClick={() => go('approvals')}
              aria-label={`งานรออนุมัติ ${pending} รายการ`}
              className={cx('inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:min-h-9', pending ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-700')}>

              <ClipboardCheckIcon className="h-4 w-4" /><span className="hidden sm:inline">อนุมัติ</span><span className="tabular-nums">{pending}</span>
            </button>
            <Button size="sm" icon={RotateCcwIcon} onClick={() => setConfirmReset(true)} className="hidden sm:inline-flex">รีเซ็ต</Button>
            <Button size="sm" icon={LogOutIcon} onClick={onSignOut} className="min-w-11 px-2 sm:min-w-0 sm:px-2.5" ariaLabel={`ออกจากระบบ ${session.email}`} title={session.email}><span className="hidden sm:inline">ออก</span></Button>
          </div>
        </header>

        {storageIssue ?
        <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-2 text-[12px] text-rose-800 lg:px-6" role="alert">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          <span><strong>บันทึกไม่ได้</strong> · การเปลี่ยนแปลงจะหายเมื่อปิดหน้านี้</span>
        </div> : null}

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 py-4 outline-none lg:px-6 lg:py-5">
          <div key={m.id} className="erp-view-in mx-auto max-w-[1600px] space-y-4">
            <KpiStrip items={m.kpis(data)} />
            {m.panels ? <Panels items={m.panels(data, actions, go)} /> : null}

            {m.cols && m.rows ?
            <Card>
                <CardHead title={m.title ?? m.th} />
                <DataTable
                cols={m.cols}
                rows={m.rows(data)}
                filters={m.filters ? m.filters(data) : []}
                actions={m.actions ? (r) => m.actions ? m.actions(r, actions) : [] : undefined} />

              </Card> :
            null}
          </div>
        </main>

        <footer className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500 lg:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-1.5">
            <span className={storageIssue ? 'font-medium text-rose-700' : undefined}>{storageIssue ? 'ไม่สามารถบันทึกในเบราว์เซอร์ได้' : 'ข้อมูลสาธิต · บันทึกอัตโนมัติในเบราว์เซอร์นี้'}</span>
            <span>ข้อมูล ณ {dateTH(TODAY)} · ปิดงวดถึง {dateTH(data.settings.closedThrough)}</span>
          </div>
        </footer>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) =>
          <div
            key={t.id}
            className={cx('erp-toast-in pointer-events-auto flex items-start gap-2 rounded-xl border bg-white px-3 py-2.5 text-[12.5px] shadow-lg', t.tone === 'ok' ? 'border-emerald-200' : 'border-rose-200')}>

              {t.tone === 'ok' ?
            <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> :
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />}
              <span className="text-slate-900">{t.text}</span>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="คืนค่าข้อมูลสาธิต?"
        description="การเปลี่ยนแปลงทั้งหมดในเบราว์เซอร์นี้จะถูกลบและกลับไปเป็นข้อมูลเริ่มต้น"
        confirmLabel="คืนค่าเริ่มต้น"
        onConfirm={resetDemo}
        onClose={() => setConfirmReset(false)} />
    </div>);

}

const SESSION_KEY = 'thai-erp-demo-session';

function SignIn({ onEnter }: {onEnter: (email: string) => void;}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = 'เข้าสู่ระบบสาธิต | Siam ERP';
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.includes('@')) {
      setError('กรุณาตรวจสอบอีเมลแล้วลองอีกครั้ง');
      return;
    }
    if (password.length < 4) {
      setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    onEnter(email.trim());
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col" aria-label="Siam ERP">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-base font-bold shadow-[0_12px_30px_-16px_rgba(37,99,235,0.9)]">ส</span>
          <div><p className="text-[15px] font-semibold">Siam ERP</p><p className="text-[11px] text-slate-400">ระบบบัญชีและการดำเนินงาน</p></div>
        </div>
        <div className="my-auto max-w-xl pb-16">
          <p className="text-balance text-[clamp(2rem,3.8vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.035em]">เห็นภาพการเงิน<br />ตัดสินใจได้ทันที</p>
          <p className="mt-5 max-w-[52ch] text-[15px] leading-7 text-slate-300">ยอดขาย กระแสเงินสด ภาษี และงานอนุมัติ เชื่อมอยู่ในพื้นที่ทำงานเดียว</p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-slate-400"><ShieldCheckIcon className="h-4 w-4 text-blue-400" />ข้อมูลบนหน้านี้เป็นข้อมูลสาธิต</div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8" aria-labelledby="sign-in-title">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-base font-bold text-white">ส</span>
            <div><p className="font-semibold text-slate-950">Siam ERP</p><p className="text-[12px] text-slate-500">ระบบสาธิต</p></div>
          </div>
          <h1 id="sign-in-title" className="text-[28px] font-semibold tracking-[-0.03em] text-slate-950">เข้าสู่ระบบสาธิต</h1>
          <p className="mt-1 text-[13px] text-slate-600">กรอกบัญชีทดลอง หรือเข้าใช้ทันที</p>

          <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-slate-700">อีเมล</span>
            <input
              type="email" inputMode="email" autoComplete="email" value={email} required aria-invalid={Boolean(error && !email.includes('@'))} aria-describedby={error ? 'sign-in-error' : undefined}
              onChange={(event) => { setEmail(event.target.value); if (error) setError(''); }} placeholder="name@company.com"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 sm:text-[14px]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-slate-700">รหัสผ่าน</span>
            <span className="relative block">
              <input
                type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} required aria-invalid={Boolean(error && password.length < 4)} aria-describedby={error ? 'sign-in-error' : undefined}
                onChange={(event) => { setPassword(event.target.value); if (error) setError(''); }}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-12 text-base text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100 sm:text-[14px]"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </span>
          </label>
          {error ? <p id="sign-in-error" className="flex items-center gap-2 text-[12.5px] text-rose-700" role="alert"><AlertCircleIcon className="h-4 w-4 shrink-0" />{error}</p> : null}
          <button type="submit" className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
            เข้าสู่ระบบ
          </button>
        </form>
        <div className="my-6 flex items-center gap-3 text-[11px] text-slate-400" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200" />หรือ<span className="h-px flex-1 bg-slate-200" />
        </div>
        <button
          type="button" onClick={() => onEnter('demo@sample.local')}
          className="flex min-h-14 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
          <span><span className="block text-sm font-semibold text-slate-900">ทดลองใช้ทันที</span><span className="block text-[11.5px] text-slate-500">ไม่ต้องกรอกข้อมูล</span></span>
          <ChevronsRightIcon className="h-4 w-4 text-slate-500" />
        </button>
        <p className="mt-6 text-center text-[11px] leading-5 text-slate-500">ระบบสาธิต · ไม่ควรใช้กับข้อมูลจริง</p>
        </div>
      </section>
    </main>
  );
}

function readSession(): DemoSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    return typeof parsed?.email === 'string' && parsed.email.trim() ? { email: parsed.email } : null;
  } catch {
    return null;
  }
}

function AppContent() {
  const [session, setSession] = useState<DemoSession | null>(() => readSession());

  const enter = (email: string) => {
    const next = { email: email.trim() };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); } catch { /* session still works in memory */ }
    setSession(next);
  };

  const leave = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* session still ends in memory */ }
    setSession(null);
  };

  return session ? <Workbench session={session} onSignOut={leave} /> : <SignIn onEnter={enter} />;
}

interface ErrorBoundaryState {failed: boolean;}

class ErrorBoundary extends React.Component<{children: React.ReactNode;}, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };
  static getDerivedStateFromError(): ErrorBoundaryState { return { failed: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('Siam ERP render error', error, info); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-[0_18px_55px_-30px_rgba(15,23,42,0.35)] sm:p-8" aria-labelledby="app-error-title">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><AlertCircleIcon className="h-5 w-5" /></span>
        <h1 id="app-error-title" className="mt-4 text-xl font-semibold text-slate-950">เปิดหน้านี้ไม่สำเร็จ</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">ลองโหลดหน้าใหม่ หรือคืนค่าข้อมูลหากไฟล์ที่บันทึกในเบราว์เซอร์เสียหาย</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">โหลดใหม่</button>
          <button type="button" onClick={() => { try { localStorage.removeItem('siam-erp-th-v1'); } catch { /* continue with reload */ } window.location.reload(); }} className="h-11 rounded-xl border border-rose-200 bg-white px-5 text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2">คืนค่าข้อมูล</button>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">การคืนค่าจะลบการเปลี่ยนแปลงสาธิตในเครื่องนี้</p>
      </section>
    </main>;
  }
}

export function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}
