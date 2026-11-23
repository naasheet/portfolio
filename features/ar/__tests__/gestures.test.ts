import { describe, expect, it } from "vitest";
import {
  coachStepDone,
  createHistory,
  extendedFingers,
  isOpenPalm,
  mapToScreen,
  nextPinch,
  palmTarget,
  pinchRatio,
} from "../gestures";
import { SLOT, TRACKED_COUNT } from "../landmarks";
import { createOneEuro } from "../oneEuro";

/** A hand in camera space (0–1, not mirrored), slot by slot. */
function hand(points: Partial<Record<keyof typeof SLOT, [number, number]>>) {
  const p = new Float32Array(TRACKED_COUNT * 2);
  for (const [name, [x, y]] of Object.entries(points)) {
    const slot = SLOT[name as keyof typeof SLOT];
    p[slot * 2] = x;
    p[slot * 2 + 1] = y;
  }
  return p;
}

/** An open hand, fingers up; the wrist at the bottom, hand size 0.2 (square frame). */
const open = {
  wrist: [0.5, 0.8],
  indexKnuckle: [0.44, 0.61],
  middleKnuckle: [0.5, 0.6],
  littleKnuckle: [0.6, 0.63],
  thumbTip: [0.3, 0.62],
  indexTip: [0.42, 0.42],
  middleTip: [0.5, 0.38],
  ringTip: [0.57, 0.4],
  littleTip: [0.66, 0.46],
} satisfies Parameters<typeof hand>[0];

/** A fist: tips curled back near the knuckles. */
const fist = {
  ...open,
  thumbTip: [0.46, 0.66],
  indexTip: [0.45, 0.66],
  middleTip: [0.5, 0.66],
  ringTip: [0.55, 0.67],
  littleTip: [0.59, 0.69],
} satisfies Parameters<typeof hand>[0];

describe("mapToScreen", () => {
  it("mirrors x and maps the inner 70% to the whole screen", () => {
    expect(mapToScreen(0.5, 0.5, 1000, 800)).toEqual([500, 400]);
    // The camera's right edge of the inner box is the screen's left edge (mirrored).
    const [x, y] = mapToScreen(0.85, 0.15, 1000, 800);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    // Beyond the inner box clamps.
    expect(mapToScreen(0, 1, 1000, 800)).toEqual([1000, 800]);
  });
});

describe("pinch", () => {
  it("ratio is thumb-to-index over hand size", () => {
    const p = hand({ ...open, thumbTip: [0.42, 0.45], indexTip: [0.42, 0.42] });
    expect(pinchRatio(p, 1)).toBeCloseTo(0.03 / 0.2, 2);
  });
  it("starts below 0.25 and releases above 0.35", () => {
    expect(nextPinch(false, 0.3)).toBe(false);
    expect(nextPinch(false, 0.24)).toBe(true);
    expect(nextPinch(true, 0.3)).toBe(true);
    expect(nextPinch(true, 0.36)).toBe(false);
  });
});

describe("open palm", () => {
  it("an open hand has every finger out", () => {
    expect(isOpenPalm(extendedFingers(hand(open), 1))).toBe(true);
  });
  it("a fist has none", () => {
    const f = extendedFingers(hand(fist), 1);
    expect(Object.values(f).some(Boolean)).toBe(false);
  });
  it("pointing is not a palm", () => {
    const f = extendedFingers(hand({ ...fist, indexTip: open.indexTip }), 1);
    expect(f.index).toBe(true);
    expect(isOpenPalm(f)).toBe(false);
  });
});

describe("history", () => {
  it("looks back to the newest position at or before a time", () => {
    const h = createHistory(4);
    h.push(1.0, 10, 10);
    h.push(1.05, 20, 20);
    h.push(1.1, 30, 30);
    expect(h.at(1.06)).toEqual([20, 20]);
    expect(h.at(0.5)).toEqual([10, 10]); // older than kept: the oldest
    h.push(1.15, 40, 40);
    h.push(1.2, 50, 50); // overwrites 1.0
    expect(h.at(0.5)).toEqual([20, 20]);
  });
});

describe("One Euro", () => {
  it("smooths jitter when still and keeps up when moving", () => {
    const f = createOneEuro();
    let out = 0;
    for (let i = 0; i < 60; i++) out = f.filter(100 + (i % 2 ? 3 : -3), i / 30);
    expect(Math.abs(out - 100)).toBeLessThan(2);
    // A fast move: after 10 frames it has covered most of the way.
    for (let i = 0; i < 10; i++)
      out = f.filter(100 + (i + 1) * 40, (60 + i) / 30);
    expect(out).toBeGreaterThan(300);
  });
});

describe("palm target (8.4)", () => {
  it("opens the highlighted desk object on Home, after 0.8 s", () => {
    expect(palmTarget("home", "arcade")).toEqual({
      kind: "open",
      target: "arcade",
      duration: 0.8,
    });
  });
  it("toggles the music elsewhere, or with nothing highlighted, after 1 s", () => {
    expect(palmTarget("home", null).kind).toBe("music");
    expect(palmTarget("work", "arcade")).toEqual({
      kind: "music",
      target: null,
      duration: 1,
    });
  });
});

describe("coach steps (8.4)", () => {
  it("each step waits for its own gesture", () => {
    expect(coachStepDone(0, "point")).toBe(true);
    expect(coachStepDone(0, "click")).toBe(false);
    expect(coachStepDone(1, "click")).toBe(true);
    expect(coachStepDone(2, "drag")).toBe(true);
    expect(coachStepDone(2, "click")).toBe(false);
  });
});
