import { type Camera, Vector3, Vector4 } from "three";
import { useStore } from "@/lib/store";

/*
 * The pointer as the particles see it (CLAUDE.md §9.2, chunk 3.4). The canvas ignores pointer
 * events, so this listens on window and keeps the raw position in plain fields (no React, no
 * store: it changes every frame). Each frame, update() projects it onto the z = 0 plane, smooths
 * it, and derives a velocity and a strength that rises while the pointer moves and decays over
 * about 600 ms after it stops.
 *
 * Hand mode (8.3): while ar.enabled and a hand is in view, window pointer moves are ignored (both
 * the real mouse and the hand's synthetic ones) and the position is read from ar.hand each frame,
 * so the canvas never gets two inputs. The hand's pinch still ripples (its synthetic pointerdown).
 * 8.5 tunes the hand's look on the canvas.
 *
 * Clicks and taps also start a ripple: a soft ring that runs out from the click point. Up to
 * RIPPLE_SLOTS overlap, so quick clicks never cut each other off (the oldest slot is reused).
 */

/** Per-frame lerp toward the raw pointer, at 60 fps (made frame-rate independent below). */
const FOLLOW = 0.15;
/** Strength rises over ~80 ms while moving, and falls to ~5% in 600 ms once still. */
const RISE_TAU = 0.08;
const DECAY_TAU = 0.2;
/** Strength for a slow move, and how much each world unit per second adds on top. */
const BASE_STRENGTH = 0.5;
const SPEED_GAIN = 0.15;
/** Velocity smoothing, so a single jumpy event doesn't spike the swirl. */
const VELOCITY_TAU = 0.1;
/** A move counts as "moving" for this long after the last event. */
const MOVING_MS = 60;
/** Ripples: how many can overlap, and how long one lives (its amplitude is ~2% by then). */
export const RIPPLE_SLOTS = 4;
const RIPPLE_LIFE_S = 1.6;

export type PointerFrame = {
  /** Smoothed pointer on the z = 0 plane, world units. */
  x: number;
  y: number;
  /** Smoothed velocity, world units per second. */
  vx: number;
  vy: number;
  /** 0–1. */
  strength: number;
  /** One per slot: x, y (z = 0 plane), age in seconds, amplitude (0 = idle). */
  ripples: Vector4[];
};

export type PointerTracker = {
  update(camera: Camera, dt: number): PointerFrame;
  dispose(): void;
};

export function createPointerTracker(): PointerTracker {
  let clientX = 0;
  let clientY = 0;
  let seen = false; // no pointer yet: nothing to push
  let snapped = false; // the smoothed point starts on the first real position
  let lastMove = -Infinity;
  const frame: PointerFrame = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    strength: 0,
    ripples: Array.from({ length: RIPPLE_SLOTS }, () => new Vector4()),
  };
  const ray = new Vector3();
  const hit = { x: 0, y: 0 };
  // Clicks waiting to be projected (that needs the camera), and each slot's start time.
  const clicks: { x: number; y: number; at: number }[] = [];
  const rippleStart = new Array<number>(RIPPLE_SLOTS).fill(-Infinity);
  let nextSlot = 0;

  /** Where a client position meets the z = 0 plane (written into `hit`). */
  const project = (camera: Camera, cx: number, cy: number) => {
    ray
      .set(
        (cx / window.innerWidth) * 2 - 1,
        -(cy / window.innerHeight) * 2 + 1,
        0.5,
      )
      .unproject(camera)
      .sub(camera.position);
    const t = ray.z !== 0 ? -camera.position.z / ray.z : 0;
    hit.x = camera.position.x + ray.x * t;
    hit.y = camera.position.y + ray.y * t;
  };

  const record = (e: PointerEvent) => {
    clientX = e.clientX;
    clientY = e.clientY;
    seen = true;
    lastMove = performance.now();
  };
  /** The hand drives the pointer (8.3): ignore window moves. */
  const handActive = () => {
    const ar = useStore.getState().ar;
    return ar.enabled && ar.hand.visible;
  };
  let handX = NaN;
  let handY = NaN;

  const onMove = (e: PointerEvent) => {
    if (handActive()) return;
    // Touch: only while a finger is down (touch pointermove only fires then anyway).
    if (e.pointerType === "touch" && e.buttons === 0) return;
    record(e);
  };
  const onDown = (e: PointerEvent) => {
    if (e.isPrimary && e.button === 0) {
      clicks.push({ x: e.clientX, y: e.clientY, at: performance.now() });
      if (clicks.length > RIPPLE_SLOTS) clicks.shift();
    }
    if (e.pointerType === "touch") {
      record(e);
      snapped = false; // a new finger: start where it landed, not where the last one left
    }
  };
  // Leaving the window or lifting a finger just stops feeding moves; strength decays on its own.
  const onLeave = () => {
    lastMove = -Infinity;
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onLeave, { passive: true });
  window.addEventListener("pointercancel", onLeave, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  window.addEventListener("blur", onLeave);

  return {
    update(camera, rawDt) {
      const dt = Math.min(Math.max(rawDt, 0), 0.1); // after a hidden tab, don't leap
      const now = performance.now();

      // Ripples: start queued clicks, age the running ones, retire the finished ones.
      for (const click of clicks) {
        project(camera, click.x, click.y);
        frame.ripples[nextSlot]!.set(hit.x, hit.y, 0, 1);
        rippleStart[nextSlot] = click.at;
        nextSlot = (nextSlot + 1) % RIPPLE_SLOTS;
      }
      clicks.length = 0;
      for (let i = 0; i < RIPPLE_SLOTS; i++) {
        const r = frame.ripples[i]!;
        if (r.w === 0) continue;
        r.z = (now - rippleStart[i]!) / 1000;
        if (r.z > RIPPLE_LIFE_S) r.w = 0;
      }

      // Hand mode: the hand cursor is the pointer; it "moves" whenever its position changes.
      if (handActive()) {
        const { x, y } = useStore.getState().ar.hand;
        const cx = x * window.innerWidth;
        const cy = y * window.innerHeight;
        if (cx !== handX || cy !== handY) {
          handX = cx;
          handY = cy;
          clientX = cx;
          clientY = cy;
          seen = true;
          lastMove = now;
        }
      }

      if (!seen || dt === 0) return frame;

      // Project the pointer onto z = 0: a ray from the camera through it.
      project(camera, clientX, clientY);
      const tx = hit.x;
      const ty = hit.y;

      if (!snapped) {
        frame.x = tx;
        frame.y = ty;
        frame.vx = 0;
        frame.vy = 0;
        snapped = true;
      }

      // Follow (lerp ~0.15 per 60 fps frame, at any frame rate).
      const k = 1 - Math.pow(1 - FOLLOW, dt * 60);
      const px = frame.x;
      const py = frame.y;
      frame.x += (tx - frame.x) * k;
      frame.y += (ty - frame.y) * k;
      const kv = 1 - Math.exp(-dt / VELOCITY_TAU);
      frame.vx += ((frame.x - px) / dt - frame.vx) * kv;
      frame.vy += ((frame.y - py) / dt - frame.vy) * kv;

      const moving = now - lastMove < MOVING_MS;
      if (moving) {
        const speed = Math.hypot(frame.vx, frame.vy);
        const target = Math.min(1, BASE_STRENGTH + speed * SPEED_GAIN);
        frame.strength +=
          (target - frame.strength) * (1 - Math.exp(-dt / RISE_TAU));
      } else {
        frame.strength *= Math.exp(-dt / DECAY_TAU);
        if (frame.strength < 1e-3) frame.strength = 0;
      }
      return frame;
    },
    dispose() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onLeave);
      window.removeEventListener("pointercancel", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    },
  };
}
