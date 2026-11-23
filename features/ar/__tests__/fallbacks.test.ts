import { afterEach, describe, expect, it, vi } from "vitest";
import {
  WORKER_IDLE_MS,
  acquireWorker,
  createSlowMonitor,
  hasWarmWorker,
  releaseWorker,
} from "../tracker";

describe("slow monitor (8.5)", () => {
  it("fires after 3 s under 15 fps, and a good second starts it over", () => {
    const m = createSlowMonitor();
    expect(m.update(10, 0)).toBe(false);
    expect(m.update(10, 1)).toBe(false);
    expect(m.update(20, 2)).toBe(false); // recovered
    expect(m.update(10, 3)).toBe(false);
    expect(m.update(12, 5)).toBe(false);
    expect(m.update(12, 6)).toBe(true); // 3 s under since t = 3
  });
  it("never fires at a healthy rate", () => {
    const m = createSlowMonitor();
    for (let t = 0; t < 10; t++) expect(m.update(27, t)).toBe(false);
  });
});

/** A stand-in Worker: records listeners and termination. */
function fakeWorker() {
  const target = new EventTarget();
  const worker = {
    terminated: false,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    postMessage: vi.fn(),
    terminate() {
      worker.terminated = true;
    },
  };
  return worker;
}

describe("warm worker (8.5)", () => {
  afterEach(() => vi.useRealTimers());

  it("is kept for 30 s after Hand off, reused if Hand comes back, then released", () => {
    vi.useFakeTimers();
    const created: ReturnType<typeof fakeWorker>[] = [];
    const create = () => {
      const w = fakeWorker();
      created.push(w);
      return w as unknown as Worker;
    };
    const a = acquireWorker(create);
    releaseWorker(a);
    vi.advanceTimersByTime(WORKER_IDLE_MS - 1000);
    // Back within 30 s: the same worker (the model stays loaded).
    const b = acquireWorker(create);
    expect(b).toBe(a);
    expect(created).toHaveLength(1);
    releaseWorker(b);
    vi.advanceTimersByTime(WORKER_IDLE_MS - 1);
    expect(created[0]!.terminated).toBe(false);
    vi.advanceTimersByTime(1);
    expect(created[0]!.terminated).toBe(true);
    expect(hasWarmWorker()).toBe(false);
  });

  it("drops a broken worker at once", () => {
    const w = fakeWorker();
    const a = acquireWorker(() => w as unknown as Worker);
    releaseWorker(a, true);
    expect(w.terminated).toBe(true);
    expect(hasWarmWorker()).toBe(false);
  });
});
