import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

class AppErrorBoundary extends React.Component<{children: React.ReactNode}, {failed: boolean}> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
        <section className="w-full max-w-md" aria-labelledby="recovery-title">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-base font-bold shadow-[0_12px_30px_-16px_rgba(37,99,235,0.9)]">ส</span>
          <h1 id="recovery-title" className="mt-8 text-[32px] font-semibold leading-tight tracking-[-0.03em]">เปิดหน้านี้ไม่ได้</h1>
          <p className="mt-3 max-w-[36ch] text-[15px] leading-6 text-slate-300">ลองใหม่อีกครั้ง หากยังไม่สำเร็จให้ปิดแท็บแล้วเปิดใหม่</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-[15px] font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">ลองใหม่</button>
        </section>
      </main>
    );
  }
}

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<AppErrorBoundary><App /></AppErrorBoundary>);
}
