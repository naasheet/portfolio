import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TRACKED,
  TRACKED_COUNT,
  landmarks,
  writeLandmarks,
} from "../landmarks";
import { createResultHandler } from "../tracker";

beforeEach(() => {
  writeLandmarks(null);
  landmarks.phase = "loading";
  landmarks.fps = 0;
});

describe("tracked points", () => {
  it("are the wrist, fingertips and three knuckles", () => {
    expect([...TRACKED]).toEqual([0, 4, 5, 8, 9, 12, 16, 17, 20]);
    expect(landmarks.points).toHaveLength(TRACKED_COUNT * 2);
  });

  it("writeLandmarks copies a result and bumps the version", () => {
    const v = landmarks.version;
    const packed = new Float32Array(TRACKED_COUNT * 2).map((_, i) => i / 100);
    writeLandmarks(packed);
    expect(landmarks.visible).toBe(true);
    expect(landmarks.points[17]).toBeCloseTo(0.17);
    expect(landmarks.version).toBe(v + 1);
    writeLandmarks(null);
    expect(landmarks.visible).toBe(false);
    expect(landmarks.version).toBe(v + 2);
  });

  it("a wrongly sized result counts as no hand", () => {
    writeLandmarks(new Float32Array(4));
    expect(landmarks.visible).toBe(false);
  });
});

describe("createResultHandler", () => {
  it("ready sets the phase and reports the delegate", () => {
    const onReady = vi.fn();
    const h = createResultHandler({ onReady, onError: vi.fn() }, vi.fn());
    expect(h.handle({ type: "ready", delegate: "GPU" })).toBe(false);
    expect(landmarks.phase).toBe("ready");
    expect(onReady).toHaveBeenCalledWith("GPU");
  });

  it("a result frees the next frame and measures the rate", () => {
    let now = 0;
    const h = createResultHandler({ onError: vi.fn() }, vi.fn(), () => now);
    for (let i = 0; i < 30; i++) {
      now += 1000 / 30;
      expect(h.handle({ type: "result", points: null })).toBe(true);
    }
    expect(landmarks.fps).toBeCloseTo(30, 0);
  });

  it("an error stops the tracker before reporting it", () => {
    const order: string[] = [];
    const h = createResultHandler(
      { onError: (m) => order.push(`error ${m}`) },
      () => order.push("stop"),
    );
    expect(h.handle({ type: "error", message: "no GPU" })).toBe(false);
    expect(order).toEqual(["stop", "error no GPU"]);
  });
});
