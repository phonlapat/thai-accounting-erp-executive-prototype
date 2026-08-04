/* Workbench UI primitives: badges, cards, KPI strip, config-driven table and panels */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangleIcon, ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon, XIcon } from 'lucide-react';
import { STATUS, dateTH, num, thb } from './data';
import type { Tone } from './data';

// eslint-disable-next-line react-refresh/only-export-components
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
  children, onClick, variant = 'ghost', size = 'md', icon: Icon, disabled, className, ariaLabel, title, buttonRef








}: {children?: React.ReactNode;onClick?: () => void;variant?: 'primary' | 'ghost' | 'danger' | 'dangerSolid';size?: 'sm' | 'md';icon?: React.ComponentType<{className?: string;}>;disabled?: boolean;className?: string;ariaLabel?: string;title?: string;buttonRef?: React.Ref<HTMLButtonElement>;}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'min-h-11 px-3 py-1 text-[13px] sm:min-h-9 sm:px-2.5 sm:text-[12px]' : 'min-h-11 px-3 py-1.5 text-[14px] sm:min-h-10 sm:text-[13px]',
        variant === 'primary' && 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800',
        variant === 'ghost' && 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        variant === 'danger' && 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50',
        variant === 'dangerSolid' && 'border-rose-700 bg-rose-700 text-white hover:bg-rose-800',
        className
      )}>

      {Icon ? <Icon className="h-4 w-4" /> : null}
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
        <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-slate-900">{title}</h2>
        {sub ? <p className="line-clamp-2 text-[11px] leading-4 text-slate-500 sm:truncate">{sub}</p> : null}
      </div>
      {action}
    </header>);

}

export function KpiStrip({ items }: {items: Array<{label: string;sub?: string;value: string;tone?: Tone;hint?: string;}>;}) {
  return (
    <div className={cx('grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200', items.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3 lg:grid-cols-5')}>
      {items.map((k, index) =>
      <div key={k.label} className={cx('min-w-0 bg-white px-3.5 py-3', items.length % 2 === 1 && index === items.length - 1 && 'col-span-2 sm:col-span-2 lg:col-span-1')}>
          <p className="truncate text-[11.5px] font-medium text-slate-600">
            {k.label}
          </p>
          <p className={cx('mt-0.5 truncate text-[19px] font-semibold tracking-[-0.02em] tabular-nums sm:text-[18px]',
        k.tone === 'ok' ? 'text-emerald-700' : k.tone === 'bad' ? 'text-rose-700' : k.tone === 'warn' ? 'text-amber-700' : 'text-slate-900')}>
            {k.value}
          </p>
          {k.sub || k.hint ? <p className="truncate text-[10.5px] text-slate-500">{k.sub ?? k.hint}</p> : null}
        </div>
      )}
    </div>);

}

export function Bar({ value, max, tone = 'info' }: {value: number;max: number;tone?: Tone;}) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        style={{ width: `${Math.min(100, max > 0 ? Math.abs(value) / max * 100 : 0)}%` }}
        className={cx('erp-progress h-full rounded-full transition-[width] duration-300 ease-out', BAR[tone])} />

    </div>);

}

export function Row({ label, value, strong }: {label: string;value: string;strong?: boolean;}) {
  return (
    <div className={cx('flex items-baseline justify-between gap-3 py-1', strong && 'border-t border-slate-200 pt-1.5 font-semibold text-slate-900')}>
      <dt className="min-w-0 truncate text-[12px] text-slate-600">{label}</dt>
      <dd className="whitespace-nowrap text-[12.5px] tabular-nums text-slate-900">{value}</dd>
    </div>);

}

/* ---------------- protected actions ---------------- */
export interface ConfirmSpec {title: string;description: string;confirmLabel?: string;}
export interface ActionSpec {label: string;ariaLabel?: string;run: () => void;danger?: boolean;confirm?: ConfirmSpec;variant?: 'primary' | 'ghost';disabled?: boolean;}

export function ConfirmDialog({ open, title, description, confirmLabel = 'ยืนยัน', tone = 'danger', onConfirm, onClose }: {
  open: boolean;title: string;description: string;confirmLabel?: string;tone?: 'danger' | 'primary';onConfirm: () => void;onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const committingRef = useRef(false);
  const [committing, setCommitting] = useState(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      committingRef.current = false;
      setCommitting(false);
      return;
    }
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    const previousRootHidden = appRoot?.getAttribute('aria-hidden') ?? null;
    const previousRootInert = appRoot?.inert ?? false;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();
    if (appRoot) {
      appRoot.inert = true;
      appRoot.setAttribute('aria-hidden', 'true');
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (appRoot) {
        appRoot.inert = previousRootInert;
        if (previousRootHidden === null) appRoot.removeAttribute('aria-hidden');
        else appRoot.setAttribute('aria-hidden', previousRootHidden);
      }
      window.removeEventListener('keydown', onKey);
      window.requestAnimationFrame(() => previouslyFocused?.focus());
    };
  }, [open]);

  if (!open) return null;
  const commit = () => {
    if (committingRef.current) return;
    committingRef.current = true;
    setCommitting(true);
    onConfirm();
    onClose();
  };
  return createPortal(
    <div className="erp-fade-in fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-3 sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" className="erp-dialog-in w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.55)] sm:p-6">
        <div className="flex items-start gap-3">
          <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone === 'danger' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700')}>
            <AlertTriangleIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-title" className="text-[17px] font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
            <p id="confirm-description" className="mt-1 text-[13px] leading-5 text-slate-600">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button buttonRef={cancelRef} className="w-full sm:w-auto" onClick={onClose}>ยกเลิก</Button>
          <Button className="w-full sm:w-auto" variant={tone === 'danger' ? 'dangerSolid' : 'primary'} disabled={committing} onClick={commit}>{confirmLabel}</Button>
        </div>
      </div>
    </div>, document.body
  );
}

function GuardedAction({ action, className }: {action: ActionSpec;className?: string;}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmation = action.confirm ?? (action.danger ? {
    title: `${action.label}รายการนี้?`,
    description: 'โปรดตรวจสอบรายการก่อนยืนยัน การดำเนินการนี้จะเปลี่ยนสถานะของเอกสาร',
    confirmLabel: action.label
  } : undefined);
  return (
    <>
      <Button buttonRef={triggerRef} className={className} size="sm" variant={action.danger ? 'danger' : action.variant ?? 'primary'} disabled={action.disabled} ariaLabel={action.ariaLabel} onClick={() => confirmation ? setOpen(true) : action.run()}>{action.label}</Button>
      {confirmation ? <ConfirmDialog open={open} title={confirmation.title} description={confirmation.description} confirmLabel={confirmation.confirmLabel} tone={action.danger ? 'danger' : 'primary'} onConfirm={action.run} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/* ---------------- panels ---------------- */
export interface PanelLine {left: string;sub?: string;right?: string;status?: string;tone?: Tone;actions?: ActionSpec[];}
export interface PanelBar {label: string;note?: string;value: number;max: number;tone?: Tone;}
export interface PanelPerformance {
  period: string;periodState: string;revenue: string;expense: string;profit: string;profitValue: number;
  change?: string;changeLabel?: string;changePositive?: boolean;
  interpretation: string;
  total: string;totalPositive: boolean;profitableMonths: string;
  points: Array<{label: string;value: number;note: string;current?: boolean;open?: boolean;}>
}
export interface PanelSpec {
  title: string;sub?: string;wide?: boolean;full?: boolean;dashboardArea?: 'performance' | 'urgent' | 'approvals';note?: string;
  rows?: Array<[string, string, boolean?]>;
  bars?: PanelBar[];
  lines?: PanelLine[];
  performance?: PanelPerformance;
  action?: ActionSpec;
  collapseAfter?: number;
  empty?: string;
}

function PerformanceOverview({ data, title }: {data: PanelPerformance;title: string;}) {
  const currentStatus = data.profitValue > 0 ? 'กำไร' : data.profitValue < 0 ? 'ขาดทุน' : 'คุ้มทุน';
  const minValue = Math.min(0, ...data.points.map((point) => point.value));
  const maxValue = Math.max(0, ...data.points.map((point) => point.value));
  const domainMin = minValue < 0 ? minValue * 1.08 : 0;
  const domainMax = maxValue > 0 ? maxValue * 1.08 : 1;
  const range = domainMax - domainMin || 1;
  const zero = -domainMin / range * 100;
  const zeroOffset = 3.3 * (1 - zero / 100) - 6.25 * zero / 100;
  const zeroPosition = `calc(${zero}% + ${zeroOffset.toFixed(3)}rem)`;
  const aria = `${title}: ${data.period} ${data.periodState} ${currentStatus} ${data.profit}. ${data.interpretation}. ${data.points.map((item) => `${item.label} ${item.open ? 'ยังไม่ปิดงวด ' : ''}${item.value > 0 ? 'กำไร' : item.value < 0 ? 'ขาดทุน' : 'คุ้มทุน'} ${item.note}`).join(', ')}. รวม ${data.total}. มีกำไร ${data.profitableMonths}`;
  return (
    <section aria-label={aria} className="flex flex-1 flex-col">
      <div className="grid flex-1 min-[720px]:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.28fr)]">
        <div className="bg-blue-50/60 px-4 py-4 min-[720px]:border-r min-[720px]:border-slate-200 min-[720px]:px-5 min-[900px]:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[12px] font-medium text-slate-600">{data.period}</p>
            <span className="rounded-md border border-slate-200 bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{data.periodState}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <p className={cx('text-[30px] font-semibold leading-none tracking-[-0.025em] tabular-nums', data.profitValue > 0 ? 'text-blue-700' : data.profitValue < 0 ? 'text-amber-700' : 'text-slate-900')}>{data.profit}</p>
          </div>
          <p className="mt-2 text-[11.5px] text-slate-600">
            {currentStatus}เดือนล่าสุด
          </p>
          {data.change ? <p className="mt-3 border-t border-blue-100 pt-3 text-[11.5px] text-slate-600">
            {data.changeLabel ?? 'เทียบเดือนก่อน'} <strong className={cx('ml-1 font-semibold tabular-nums', data.changePositive ? 'text-blue-700' : 'text-amber-700')}>{data.change}</strong>
          </p> : null}
          <p className="mt-3 max-w-[34ch] text-[12px] leading-5 text-slate-700">{data.interpretation}</p>
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-blue-100 pt-3">
            <div>
              <dt className="text-[11px] text-slate-500">รายได้</dt>
              <dd className="text-[14px] font-semibold tabular-nums text-slate-900">{data.revenue}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">ค่าใช้จ่าย</dt>
              <dd className="text-[14px] font-semibold tabular-nums text-slate-900">{data.expense}</dd>
            </div>
          </dl>
        </div>

        <div className="min-w-0 px-4 py-3.5 min-[720px]:px-5 min-[900px]:py-4">
          <div className="relative mb-1.5 grid grid-cols-[2.8rem_minmax(0,1fr)_5.75rem] gap-x-2 text-[10.5px] text-slate-500" aria-hidden="true">
            <div className="col-start-2 flex items-center justify-between"><span>ขาดทุน</span><span>กำไร</span></div>
            <span className="absolute -translate-x-1/2 bg-white px-0.5 text-[9.5px] font-medium text-slate-500" style={{ left: zeroPosition }}>0</span>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-slate-400" style={{ left: zeroPosition }} aria-hidden="true" />
            <ol className="space-y-1">
              {data.points.map((point) => {
              const positive = point.value > 0;
              const negative = point.value < 0;
              const signedNote = positive ? `+${point.note}` : point.note;
              const valuePosition = (point.value - domainMin) / range * 100;
              const left = positive ? zero : valuePosition;
              const width = Math.max(1.5, Math.abs(valuePosition - zero));
              const status = positive ? 'กำไร' : negative ? 'ขาดทุน' : 'คุ้มทุน';
              return (
                <li key={point.label} aria-label={`${point.label} ${point.open ? 'ยังไม่ปิดงวด ' : ''}${status} ${signedNote}${point.current ? ' เดือนปัจจุบัน' : ''}`} className={cx('grid min-h-11 grid-cols-[2.8rem_minmax(0,1fr)_5.75rem] items-center gap-2', negative && 'bg-amber-50/60')}>
                  <span className={cx('pl-1 text-[11px] font-medium leading-4', point.current ? 'text-slate-950' : 'text-slate-600')}>
                    {point.label}{point.open ? <small className="block text-[9px] font-normal text-slate-500">ยังไม่ปิด</small> : null}
                  </span>
                  <span className="relative block h-7" aria-hidden="true">
                    <span
                      className={cx('absolute top-2 h-3 rounded-sm', negative ? 'bg-amber-500' : point.current ? 'bg-blue-700' : 'bg-blue-300')}
                      style={{ left: `${left}%`, width: `${width}%` }} />
                  </span>
                  <span className={cx('pr-1 text-right text-[12px] font-semibold tabular-nums', negative ? 'text-amber-700' : point.current ? 'text-blue-700' : 'text-slate-900')}>
                    {signedNote}
                  </span>
                </li>
              );
              })}
            </ol>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 border-t border-slate-200 px-4 py-3 min-[720px]:px-5">
        <div>
          <dt className="text-[10.5px] text-slate-500">รวม 5 เดือน</dt>
          <dd className={cx('text-[13px] font-semibold tabular-nums', data.totalPositive ? 'text-blue-700' : 'text-amber-700')}>{data.totalPositive ? 'กำไร' : 'ขาดทุน'} {data.total}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[10.5px] text-slate-500">มีกำไร</dt>
          <dd className="text-[13px] font-semibold tabular-nums text-slate-900">{data.profitableMonths}</dd>
        </div>
      </dl>
    </section>
  );
}

function PanelLineItem({ line, className }: {line: PanelLine;className?: string;}) {
  return (
    <li className={cx('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex sm:flex-wrap sm:gap-2 sm:py-2', className)}>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] leading-5 text-slate-900 sm:truncate sm:text-[12.5px] sm:leading-normal">{line.left}</p>
        {line.sub ? <p className={cx('line-clamp-2 text-[11.5px] leading-4 sm:truncate sm:text-[11px]', line.tone === 'bad' ? 'text-rose-600' : 'text-slate-500')}>{line.sub}</p> : null}
      </div>
      {line.right ? <span className="whitespace-nowrap text-[12.5px] font-medium tabular-nums text-slate-900">{line.right}</span> : null}
      {line.status ? <Badge value={line.status} /> : null}
      {line.actions?.length ? <div className="col-span-2 flex justify-end gap-2 sm:contents">
        {line.actions.map((action) => <GuardedAction key={action.label} action={action} className="w-fit flex-none" />)}
      </div> : null}
    </li>
  );
}

export function Panels({ items }: {items: PanelSpec[];}) {
  if (!items.length) return null;
  const dashboardLayout = items.some((item) => item.dashboardArea);
  return (
    <div className={cx('grid gap-4', dashboardLayout ? 'min-[900px]:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]' : 'min-[900px]:grid-cols-3')}>
      {items.map((p) =>
      <Card key={p.title} className={cx(
        'flex min-h-0 flex-col',
        p.wide && 'min-[900px]:col-span-2',
        p.full && 'min-[900px]:col-span-3',
        p.dashboardArea === 'performance' && 'min-[900px]:col-start-1 min-[900px]:row-start-1 min-[900px]:row-span-2',
        p.dashboardArea === 'urgent' && 'min-[900px]:col-start-2 min-[900px]:row-start-1',
        p.dashboardArea === 'approvals' && 'min-[900px]:col-start-2 min-[900px]:row-start-2'
      )}>
          <CardHead
          title={p.title}
          sub={p.sub}
          action={p.action ? <GuardedAction action={p.action} /> : undefined} />

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
          {p.lines?.length ? <>
            <ul className="divide-y divide-slate-200">
              {p.lines.map((line, index) => <PanelLineItem key={line.left + (line.sub ?? '')} line={line} className={p.collapseAfter && index >= p.collapseAfter ? '!hidden min-[900px]:!grid' : undefined} />)}
            </ul>
            {p.collapseAfter && p.lines.length > p.collapseAfter ?
              <details className="group border-t border-slate-200 min-[900px]:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center px-4 text-[12px] font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 [&::-webkit-details-marker]:hidden">
                  ดูอีก {p.lines.length - p.collapseAfter} รายการ
                </summary>
                <ul className="divide-y divide-slate-200 border-t border-slate-200">
                  {p.lines.slice(p.collapseAfter).map((line) => <PanelLineItem key={`more-${line.left}-${line.sub ?? ''}`} line={line} />)}
                </ul>
              </details> : null}
          </> : null}
          {p.lines && !p.lines.length ? <p className="px-4 py-6 text-center text-[12px] text-slate-500">{p.empty ?? 'ไม่มีรายการ'}</p> : null}
          {p.performance ? <PerformanceOverview data={p.performance} title={p.title} /> : null}
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
export type RowAction = ActionSpec;
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
  cols, rows, filters = [], actions, empty = 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก', initialQuery = ''






}: {cols: Col[];rows: RowData[];filters?: FilterSpec[];actions?: (r: RowData) => RowAction[];empty?: string;initialQuery?: string;}) {
  const [q, setQ] = useState(initialQuery);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{key: string;dir: 1 | -1;} | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => window.matchMedia('(max-width: 767px)').matches ? 8 : 12);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setPageSize(media.matches ? 8 : 12);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => setQ(initialQuery), [initialQuery]);

  const view = useMemo(() => {
    let out = rows.filter((r) => {
      const query = q.trim().toLocaleLowerCase('th');
      const okQ = !query || Object.entries(r).some(([key, value]) => {
        const column = cols.find((item) => item.key === key);
        const translatedStatus = STATUS[String(value ?? '')]?.th ?? '';
        return [String(value ?? ''), fmt(value, column?.fmt), translatedStatus]
          .some((text) => text.toLocaleLowerCase('th').includes(query));
      });
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
  }, [rows, q, sel, filters, sort, cols]);

  const pageCount = Math.max(1, Math.ceil(view.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = view.slice(pageStart, pageStart + pageSize);

  useEffect(() => setPage(1), [q, sel, sort, pageSize]);
  useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);

  const totals = cols.filter((c) => c.total);
  const filtering = Boolean(q || Object.values(sel).some(Boolean));
  const mobileCols = cols.filter((c) => !c.hide);
  const primaryCol = mobileCols[0] ?? cols[0];
  const statusCol = mobileCols.find((c) => c.fmt === 'status');
  const valueCol = mobileCols.find((c) => c.right && c.total) ?? mobileCols.find((c) => c.right);
  const secondaryCol = mobileCols.find((c) => c.key !== primaryCol?.key && c.key !== statusCol?.key && c.key !== valueCol?.key && !c.right);
  const detailCols = mobileCols.filter((c) => ![primaryCol?.key, secondaryCol?.key, statusCol?.key, valueCol?.key].includes(c.key)).slice(0, 2);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-3 sm:py-2.5">
        <label className="relative flex w-full min-w-[190px] flex-1 items-center sm:w-auto">
          <SearchIcon className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
          <span className="sr-only">ค้นหา</span>
          <input
            type="search"
            inputMode="search"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา…"
            className="h-11 w-full rounded-lg border border-slate-300 pl-8 pr-2.5 text-base text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:h-10 sm:text-[13px]" />

        </label>
        {filters.map((f) =>
        <label key={f.key} className="flex items-center gap-1.5">
            <span className="sr-only">{f.label}</span>
            <select
            value={sel[f.key] ?? ''}
            onChange={(e) => setSel((s) => ({ ...s, [f.key]: e.target.value }))}
            className="h-11 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 text-base text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:h-10 sm:text-[12.5px]">

              <option value="">{f.label}ทั้งหมด</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        )}
        {filtering ?
        <button type="button" onClick={() => { setQ(''); setSel({}); }} className="min-h-10 rounded-lg px-2.5 text-[12px] font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            ล้าง
          </button> : null}
        <span className="ml-auto whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600" aria-live="polite">{view.length} รายการ</span>
      </div>

      <div className="md:hidden">
        {view.length ? <ul className="divide-y divide-slate-200">
          {pageRows.map((r) => {
            const rowActions = actions ? actions(r) : [];
            return <li key={r.id} className="px-4 py-3.5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold tabular-nums text-slate-950">{fmt(r[primaryCol.key], primaryCol.fmt)}</p>
                  {secondaryCol ? <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-slate-600">{fmt(r[secondaryCol.key], secondaryCol.fmt)}</p> : null}
                </div>
                <div className="text-right">
                  {valueCol ? <p className="whitespace-nowrap text-[13px] font-semibold tabular-nums text-slate-950">{fmt(r[valueCol.key], valueCol.fmt)}</p> : null}
                  {statusCol ? <div className="mt-1"><Badge value={String(r[statusCol.key] ?? '')} /></div> : null}
                </div>
                {detailCols.length ? <dl className="col-span-2 mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-slate-100 pt-2">
                  {detailCols.map((c) => <div key={c.key} className="min-w-0"><dt className="text-[10.5px] text-slate-500">{c.header}</dt><dd className="truncate text-[12px] text-slate-800">{fmt(r[c.key], c.fmt)}</dd></div>)}
                </dl> : null}
              </div>
              {rowActions.length ? <div className="mt-3 flex justify-end gap-2">{rowActions.map((a) => <GuardedAction key={a.label} action={a} className="min-w-24" />)}</div> : null}
            </li>;
          })}
        </ul> : <div className="px-4 py-10 text-center">
          <SearchIcon className="mx-auto h-5 w-5 text-slate-400" />
          <p className="mt-2 text-[13px] font-medium text-slate-700">{empty}</p>
          {filtering ? <Button className="mt-4" onClick={() => { setQ(''); setSel({}); }}>ล้างตัวกรอง</Button> : null}
        </div>}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[620px] text-[12.5px]">
          <caption className="sr-only">รายการข้อมูล {view.length} รายการ หน้า {safePage} จาก {pageCount}</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600">
              {cols.map((c) =>
              <th key={c.key} aria-sort={sort?.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={cx('px-3 py-2.5 font-semibold', c.right ? 'text-right' : 'text-left', c.hide && HIDE[c.hide])}>
                  <button
                  type="button"
                  onClick={() => setSort((s) => s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 })}
                  className="inline-flex min-h-8 items-center gap-1 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">

                    {c.header}
                    <ArrowUpDownIcon className={cx('h-3 w-3', sort?.key === c.key ? 'text-blue-700' : 'text-slate-300')} />
                  </button>
                </th>
              )}
              {actions ? <th className="px-3 py-2.5 text-right font-semibold">จัดการ</th> : null}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) =>
            <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                {cols.map((c) =>
              <td key={c.key} className={cx('px-3 py-2.5', c.right && 'text-right tabular-nums', c.fmt === 'mono' && 'font-medium tabular-nums text-slate-900', c.hide && HIDE[c.hide], c.fmt === 'status' && 'text-center')}>
                    {c.fmt === 'status' ? <Badge value={String(r[c.key] ?? '')} /> : fmt(r[c.key], c.fmt)}
                  </td>
              )}
                {actions ?
              <td className="px-3 py-2">
                    <div className="flex justify-end gap-1.5">
                      {actions(r).map((a) => <GuardedAction key={a.label} action={a} />)}
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

      {pageCount > 1 ?
      <nav className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2.5" aria-label="เปลี่ยนหน้ารายการ">
        <span className="text-[12px] tabular-nums text-slate-500">{pageStart + 1}–{Math.min(pageStart + pageSize, view.length)} จาก {view.length}</span>
        <div className="flex items-center gap-2">
          <Button icon={ChevronLeftIcon} size="sm" className="min-w-11 px-0 sm:min-w-9" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} ariaLabel="หน้าก่อนหน้า" />
          <span className="min-w-10 text-center text-[12px] font-medium tabular-nums text-slate-700">{safePage}/{pageCount}</span>
          <Button icon={ChevronRightIcon} size="sm" className="min-w-11 px-0 sm:min-w-9" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} ariaLabel="หน้าถัดไป" />
        </div>
      </nav> : null}
    </div>);

}
