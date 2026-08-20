import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PEAK_META_KEY, PEAK_SESSION_DEADLINE_KEY, PEAK_SESSION_KEY, DEMO_STORAGE_KEY } from './store';
import { RecoveryScreen } from './error-boundary';
import { clearRecoveryState } from './recovery-storage';

class MemoryStorage {
  readonly attempted: string[] = [];
  private values = new Map<string, string>();

  constructor(initial: Record<string, string>, private readonly failingKeys = new Set<string>()) {
    Object.entries(initial).forEach(([key, value]) => this.values.set(key, value));
  }

  removeItem(key: string) {
    this.attempted.push(key);
    if (this.failingKeys.has(key)) throw new Error('synthetic storage failure');
    this.values.delete(key);
  }

  has(key: string) {
    return this.values.has(key);
  }
}

describe('runtime recovery boundary', () => {
  it('clears only recoverable app state and preserves safe freshness history', () => {
    const local = new MemoryStorage({ [DEMO_STORAGE_KEY]: 'demo', [PEAK_META_KEY]: 'safe-meta', unrelated: 'keep' });
    const session = new MemoryStorage({ [PEAK_SESSION_KEY]: 'private', [PEAK_SESSION_DEADLINE_KEY]: 'deadline', unrelated: 'keep' });

    expect(clearRecoveryState(() => local, () => session)).toBe(true);
    expect(local.has(DEMO_STORAGE_KEY)).toBe(false);
    expect(session.has(PEAK_SESSION_KEY)).toBe(false);
    expect(session.has(PEAK_SESSION_DEADLINE_KEY)).toBe(false);
    expect(local.has(PEAK_META_KEY)).toBe(true);
    expect(local.has('unrelated')).toBe(true);
    expect(session.has('unrelated')).toBe(true);
  });

  it('attempts every scoped deletion and reports any unverified private cleanup', () => {
    const local = new MemoryStorage({ [DEMO_STORAGE_KEY]: 'legacy-private' }, new Set([DEMO_STORAGE_KEY]));
    const session = new MemoryStorage(
      { [PEAK_SESSION_KEY]: 'private', [PEAK_SESSION_DEADLINE_KEY]: 'deadline' },
      new Set([PEAK_SESSION_KEY]),
    );

    expect(clearRecoveryState(() => local, () => session)).toBe(false);
    expect(local.attempted).toEqual([DEMO_STORAGE_KEY]);
    expect(session.attempted).toEqual([PEAK_SESSION_KEY, PEAK_SESSION_DEADLINE_KEY]);
    expect(session.has(PEAK_SESSION_DEADLINE_KEY)).toBe(false);
  });

  it('renders distinct recovery instructions when deletion cannot be verified', () => {
    const normal = renderToStaticMarkup(<RecoveryScreen clearFailed={false} onReload={() => undefined} onClear={() => undefined} />);
    const failed = renderToStaticMarkup(<RecoveryScreen clearFailed onReload={() => undefined} onClear={() => undefined} />);

    expect(normal).toContain('โหลดใหม่');
    expect(normal).toContain('ลบข้อมูล PEAK');
    expect(normal).toContain('ไม่มีข้อมูลถูกส่งออก');
    expect(failed).toContain('ปิดแท็บนี้เพื่อจบเซสชัน');
    expect(failed).toContain('ลองลบอีกครั้ง');
    expect(failed).not.toContain('โหลดใหม่');
  });
});
