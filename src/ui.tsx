/* Workbench UI primitives: badges, cards, KPI strip, config-driven table and panels */
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDownIcon, SearchIcon } from 'lucide-react';
import { STATUS, dateTH, num, thb } from './data';
import type { Tone } from './data';

export const cx = (...c: Array<string | false | undefined | null>) => c.filter(Boolean).join(' ');

const TONE: Record<Tone, string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  bad: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  muted: 'bg-slate-100 text-slate-600 border-slate-200'
};
const BAR: Record<Tone, string> = {
  ok: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-rose-500', info: 'bg-blue-600', muted: 'bg-slate-400'
};

export function Badge({ value }: {value: string;}) {
  const s = STATUS[value] ?? { th: value, en: '', tone: 'muted' as Tone };
  return (
    <span className={cx('inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium', TONE[s.tone])}>
      {s.th}
    </span>);

}

export function Button({
  children, onClick, variant = 'ghost', size = 'md', icon: Icon, disabled, className








}: {children?: React.ReactNode;onClick?: () => void;variant?: 'primary' | 'ghost' | 'danger';size?: 'sm' | 'md';icon?: React.ComponentType<{className?: string;}>;disabled?: boolean;className?: string;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2 py-1 text-[11.5px]' : 'px-3 py-1.5 text-[12.5px]',
        variant === 'primary' && 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800',
        variant === 'ghost' && 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        variant === 'danger' && 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50',
        className
      )}>

      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </button>);

}

export function Card({ children, className }: {children: React.ReactNode;className?: string;}) {
  return <section className={cx('overflow-hidden rounded-xl border border-slate-200 bg-white', className)}>{children}</section>;
}

export function CardHead({ title, sub, action }: {title: string;sub?: string;action?: React.ReactNode;}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
      <div className="min-w-0">
        <h3 className="truncate text-[13px] font-semibold text-slate-900">{title}</h3>
        {sub ? <p className="truncate text-[11px] text-slate-500">{sub}</p> : null}
      </div>
      {action}
    </header>);

}

export function KpiStrip({ items }: {items: Array<{label: string;sub?: string;value: string;tone?: Tone;hint?: string;}>;}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((k) =>
      <div key={k.label} className="bg-white px-3.5 py-2.5">
          <p className="truncate text-[10.5px] uppercase tracking-wide text-slate-500">
            {k.label}
            {k.sub ? <span className="ml-1 normal-case text-slate-400">{k.sub}</span> : null}
          </p>
          <p className={cx('mt-0.5 truncate text-[17px] font-semibold tabular-nums',
        k.tone === 'ok' ? 'text-emerald-700' : k.tone === 'bad' ? 'text-rose-700' : k.tone === 'warn' ? 'text-amber-700' : 'text-slate-900')}>
            {k.value}
          </p>
          {k.hint ? <p className="truncate text-[10.5px] text-slate-400">{k.hint}</p> : null}
        </div>
      )}
    </div>);

}

export function Bar({ value, max, tone = 'info' }: {value: number;max: number;tone?: Tone;}) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, max > 0 ? Math.abs(value) / max * 100 : 0)}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cx('h-full rounded-full', BAR[tone])} />

    </div>);

}

export function Row({ label, value, strong }: {label: string;value: string;strong?: boolean;}) {
  return (
    <div className={cx('flex items-baseline justify-between gap-3 py-1', strong && 'border-t border-slate-200 pt-1.5 font-semibold text-slate-900')}>
      <dt className="min-w-0 truncate text-[12px] text-slate-600">{label}</dt>
      <dd className="whitespace-nowrap text-[12.5px] tabular-nums text-slate-900">{value}</dd>
    </div>);

}

/* ---------------- panels ---------------- */
export interface PanelLine {left: string;sub?: string;right?: string;status?: string;tone?: Tone;actions?: Array<{label: string;run: () => void;danger?: boolean;}>;}
export interface PanelBar {label: string;note?: string;value: number;max: number;tone?: Tone;}
export interface PanelSpec {
  title: string;sub?: string;wide?: boolean;note?: string;
  rows?: Array<[string, string, boolean?]>;
  bars?: PanelBar[];
  lines?: PanelLine[];
  action?: {label: string;run: () => void;disabled?: boolean;};
  empty?: string;
}

export function Panels({ items }: {items: PanelSpec[];}) {
  if (!items.length) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((p) =>
      <Card key={p.title} className={p.wide ? 'lg:col-span-2' : undefined}>
          <CardHead
          title={p.title}
          sub={p.sub}
          action={p.action ? <Button variant="primary" size="sm" onClick={p.action.run} disabled={p.action.disabled}>{p.action.label}</Button> : undefined} />

          {p.bars?.length ?
        <ul className="space-y-2.5 px-4 py-3">
              {p.bars.map((b) =>
          <li key={b.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-[12px]">
                    <span className="truncate text-slate-700">{b.label}</span>
                    <span className="whitespace-nowrap tabular-nums text-slate-500">{b.note}</span>
                  </div>
                  <Bar value={b.value} max={b.max} tone={b.tone} />
                </li>
          )}
            </ul> :
        null}
          {p.lines?.length ?
        <ul className="divide-y divide-slate-200">
              {p.lines.map((l) =>
          <li key={l.left + (l.sub ?? '')} className="flex flex-wrap items-center gap-2 px-4 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] text-slate-900">{l.left}</p>
                    {l.sub ? <p className={cx('truncate text-[11px]', l.tone === 'bad' ? 'text-rose-600' : 'text-slate-500')}>{l.sub}</p> : null}
                  </div>
                  {l.right ? <span className="whitespace-nowrap text-[12.5px] font-medium tabular-nums text-slate-900">{l.right}</span> : null}
                  {l.status ? <Badge value={l.status} /> : null}
                  {l.actions?.map((a) =>
            <Button key={a.label} size="sm" variant={a.danger ? 'danger' : 'primary'} onClick={a.run}>{a.label}</Button>
            )}
                </li>
          )}
            </ul> :
        null}
          {p.lines && !p.lines.length ? <p className="px-4 py-6 text-center text-[12px] text-slate-500">{p.empty ?? 'ไม่มีรายการ'}</p> : null}
          {p.rows?.length ?
        <dl className="px-4 py-3">
              {p.rows.map(([label, value, strong]) => <Row key={label} label={label} value={value} strong={strong} />)}
            </dl> :
        null}
          {p.note ? <p className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500">{p.note}</p> : null}
        </Card>
      )}
    </div>);

}

/* ---------------- data table ---------------- */
export type CellFmt = 'text' | 'mono' | 'money' | 'num' | 'date' | 'status' | 'pct';
export interface Col {key: string;header: string;fmt?: CellFmt;right?: boolean;total?: boolean;hide?: 'sm' | 'md' | 'lg';}
export type RowData = Record<string, string | number | undefined> & {id: string;};
export interface RowAction {label: string;run: () => void;danger?: boolean;}
export interface FilterSpec {key: string;label: string;options: Array<{value: string;label: string;}>;}

const HIDE = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };

function fmt(v: string | number | undefined, f: CellFmt = 'text') {
  if (v === undefined || v === null || v === '') return '—';
  if (f === 'money') return thb(Number(v));
  if (f === 'num') return num(Number(v));
  if (f === 'pct') return `${Math.round(Number(v))}%`;
  if (f === 'date') return dateTH(String(v));
  return String(v);
}

export function DataTable({
  cols, rows, filters = [], actions, empty = 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก'






}: {cols: Col[];rows: RowData[];filters?: FilterSpec[];actions?: (r: RowData) => RowAction[];empty?: string;}) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{key: string;dir: 1 | -1;} | null>(null);

  const view = useMemo(() => {
    let out = rows.filter((r) => {
      const okQ = !q || Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q.toLowerCase()));
      const okF = filters.every((f) => !sel[f.key] || String(r[f.key] ?? '') === sel[f.key]);
      return okQ && okF;
    });
    if (sort) {
      const { key, dir } = sort;
      out = [...out].sort((a, b) => {
        const x = a[key] ?? '';
        const y = b[key] ?? '';
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'th')) * dir;
      });
    }
    return out;
  }, [rows, q, sel, filters, sort]);

  const totals = cols.filter((c) => c.total);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2">
        <label className="relative flex min-w-[190px] flex-1 items-center">
          <SearchIcon className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
          <span className="sr-only">ค้นหา</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาเลขที่เอกสาร ชื่อ หรือรายละเอียด…"
            className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2.5 text-[12.5px] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none" />

        </label>
        {filters.map((f) =>
        <label key={f.key} className="flex items-center gap-1.5">
            <span className="sr-only">{f.label}</span>
            <select
            value={sel[f.key] ?? ''}
            onChange={(e) => setSel((s) => ({ ...s, [f.key]: e.target.value }))}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-[12px] text-slate-700 focus:border-blue-600 focus:outline-none">

              <option value="">{f.label}: ทั้งหมด</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        )}
        <span className="ml-auto whitespace-nowrap text-[11.5px] text-slate-500">{view.length} รายการ</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-[12.5px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10.5px] uppercase tracking-wide text-slate-500">
              {cols.map((c) =>
              <th key={c.key} className={cx('px-3 py-2 font-semibold', c.right ? 'text-right' : 'text-left', c.hide && HIDE[c.hide])}>
                  <button
                  type="button"
                  onClick={() => setSort((s) => s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 })}
                  className="inline-flex items-center gap-1 uppercase hover:text-slate-800">

                    {c.header}
                    <ArrowUpDownIcon className={cx('h-3 w-3', sort?.key === c.key ? 'text-blue-700' : 'text-slate-300')} />
                  </button>
                </th>
              )}
              {actions ? <th className="px-3 py-2 text-right font-semibold">การดำเนินการ</th> : null}
            </tr>
          </thead>
          <tbody>
            {view.map((r) =>
            <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                {cols.map((c) =>
              <td key={c.key} className={cx('px-3 py-2', c.right && 'text-right tabular-nums', c.fmt === 'mono' && 'font-medium tabular-nums text-slate-900', c.hide && HIDE[c.hide], c.fmt === 'status' && 'text-center')}>
                    {c.fmt === 'status' ? <Badge value={String(r[c.key] ?? '')} /> : fmt(r[c.key], c.fmt)}
                  </td>
              )}
                {actions ?
              <td className="px-3 py-2">
                    <div className="flex justify-end gap-1.5">
                      {actions(r).map((a) =>
                  <Button key={a.label} size="sm" variant={a.danger ? 'danger' : 'primary'} onClick={a.run}>{a.label}</Button>
                  )}
                    </div>
                  </td> :
              null}
              </tr>
            )}
            {!view.length ?
            <tr><td colSpan={cols.length + (actions ? 1 : 0)} className="px-3 py-10 text-center text-slate-500">{empty}</td></tr> :
            null}
          </tbody>
          {totals.length && view.length ?
          <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                {cols.map((c, i) =>
              <td key={c.key} className={cx('px-3 py-2', c.right && 'text-right tabular-nums', c.hide && HIDE[c.hide])}>
                    {i === 0 ? 'รวม' : c.total ? thb(view.reduce((s, r) => s + Number(r[c.key] ?? 0), 0)) : ''}
                  </td>
              )}
                {actions ? <td /> : null}
              </tr>
            </tfoot> :
          null}
        </table>
      </div>
    </div>);

}