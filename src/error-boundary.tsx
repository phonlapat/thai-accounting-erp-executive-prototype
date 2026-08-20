import React from 'react';
import { clearRecoveryState } from './recovery-storage';

interface RecoveryScreenProps {
  clearFailed: boolean;
  headingRef?: React.RefObject<HTMLHeadingElement>;
  onReload: () => void;
  onClear: () => void;
}

export function RecoveryScreen({ clearFailed, headingRef, onReload, onClear }: RecoveryScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <section className="w-full max-w-lg border-y border-slate-800 py-8" aria-labelledby="recovery-title" role="alert">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-base font-bold shadow-[0_12px_30px_-16px_rgba(37,99,235,0.9)]" aria-hidden="true">ส</span>
        <h1 ref={headingRef} tabIndex={-1} id="recovery-title" className="mt-8 text-[clamp(2rem,8vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] outline-none">ระบบหยุดทำงาน</h1>
        {clearFailed ? <>
          <p className="mt-4 max-w-[42ch] text-[15px] leading-6 text-rose-200">เบราว์เซอร์ไม่ยอมลบข้อมูล ปิดแท็บนี้เพื่อจบเซสชัน</p>
          <button type="button" onClick={onClear} className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-white px-4 text-[15px] font-semibold text-slate-950 transition-colors hover:bg-slate-100 active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto sm:min-w-44">ลองลบอีกครั้ง</button>
        </> : <>
          <p className="mt-4 max-w-[42ch] text-[15px] leading-6 text-slate-300">โหลดหน้าใหม่ก่อน หากยังไม่สำเร็จให้ลบข้อมูล PEAK ในแท็บนี้</p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onReload} className="h-12 rounded-xl bg-blue-600 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">โหลดใหม่</button>
            <button type="button" onClick={onClear} className="h-12 rounded-xl border border-slate-700 bg-transparent px-5 text-[15px] font-semibold text-white transition-colors hover:bg-slate-900 active:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">ลบข้อมูล PEAK</button>
          </div>
          <p className="mt-4 text-[12px] leading-5 text-slate-400">เก็บเฉพาะประวัติเวลาล่าสุด · ไม่มีข้อมูลถูกส่งออก</p>
        </>}
      </section>
    </main>
  );
}

interface AppErrorBoundaryState {
  failed: boolean;
  clearFailed: boolean;
}

export class AppErrorBoundary extends React.Component<{children: React.ReactNode}, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false, clearFailed: false };
  private headingRef = React.createRef<HTMLHeadingElement>();

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true, clearFailed: false };
  }

  componentDidCatch() {
    console.error('Siam ERP render failed');
    window.requestAnimationFrame(() => this.headingRef.current?.focus());
  }

  private reload = () => window.location.reload();

  private clear = () => {
    if (clearRecoveryState()) {
      window.location.reload();
      return;
    }
    this.setState({ failed: true, clearFailed: true }, () => this.headingRef.current?.focus());
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return <RecoveryScreen clearFailed={this.state.clearFailed} headingRef={this.headingRef} onReload={this.reload} onClear={this.clear} />;
  }
}
