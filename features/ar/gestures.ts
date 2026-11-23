/*
 * Hand gestures (8.3): the landmarks from the tracker (8.2) become a cursor, a pinch click, a
 * pinch-drag scroll and an open-palm hold that plays or pauses the music.
 *
 * The top half is pure maths (tested in __tests__/gestures.test.ts). startGestures() is the
 * driver: one gsap.ticker callback (the shared clock) that reads `landmarks`, filters the
 * fingertip (One Euro), writes ar.hand / ar.pinching to the store and drives the synthetic
 * pointer (synthetic.ts). Started by components/ar/ARLayer.tsx once tracking is ready.
 *
 * Thresholds are constants below: tune them on a real webcam with /dev's readout (`gestureDebug`).
 */
import { gsap } from "@/lib/motion/gsap";
import { toggleMusic } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";
import { SLOT, landmarks } from "./landmarks";
import { createOneEuro } from "./oneEuro";
import { createSynthetic, type Synthetic } from "./synthetic";

// --- Tuning ------------------------------------------------------------------------------------

/** The inner part of the camera frame mapped to the whole screen (nobody reaches the edges). */
export const INNER = 0.7;
/** Pinch ratio (thumb tip to index tip ÷ hand size): press below, release above. */
export const PINCH_ON = 0.25;
export const PINCH_OFF = 0.35;
/** A finger is extended when its tip is this many times further from the wrist than its knuckle. */
export const FINGER_EXTENDED = 1.5;
/** The thumb is out when its tip is this far from the index knuckle, in hand sizes. */
export const THUMB_EXTENDED = 0.6;
/** The palm must be held this long to toggle the music. */
export const PALM_HOLD_S = 1;
/** 8.4: on Home, a palm held over a desk object this long opens it. */
export const PALM_OPEN_S = 0.8;
/** 8.4: the coach's "point" step counts once the cursor has travelled this far (px). */
export const POINT_TRAVEL_PX = 120;
/** The click lands where the cursor was this long before the pinch (fingers closing drag it). */
export const CLICK_LOOKBACK_S = 0.12;
/** The visible cursor holds still this long after a pinch starts. */
export const PINCH_FREEZE_S = 0.08;
/** Vertical travel (px) that turns a pinch into a drag (scroll, no click). */
export const DRAG_START_PX = 24;
/** Page px scrolled per px of cursor travel while pinch-dragging. */
export const DRAG_GAIN = 2;
/** Inertia after a drag: the speed decays with this time constant (s), gone in ~0.4 s. */
export const INERTIA_TAU = 0.12;
/** The cursor fades this long after the hand leaves the frame. */
export const LOST_S = 0.5;
/** The displayed cursor eases toward the filtered point (s): smooths the ~30 Hz results at 60 Hz. */
const DISPLAY_TAU = 0.03;

// --- Pure helpers ------------------------------------------------------------------------------

type Points = ArrayLike<number>;

/** Mirror x and map the inner `inner` of the camera frame (0–1) to the screen (px). */
export function mapToScreen(
  x: number,
  y: number,
  width: number,
  height: number,
  inner = INNER,
): [number, number] {
  const margin = (1 - inner) / 2;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const sx = clamp((1 - x - margin) / inner);
  const sy = clamp((y - margin) / inner);
  return [sx * width, sy * height];
}

/** Distance between two slots, with x scaled by the frame's aspect (so both axes are alike). */
export function slotDistance(
  p: Points,
  a: number,
  b: number,
  aspect: number,
): number {
  const dx = (p[a * 2]! - p[b * 2]!) * aspect;
  const dy = p[a * 2 + 1]! - p[b * 2 + 1]!;
  return Math.hypot(dx, dy);
}

/** Hand size: wrist to middle knuckle. */
export const handSize = (p: Points, aspect: number) =>
  slotDistance(p, SLOT.wrist, SLOT.middleKnuckle, aspect);

/** Thumb tip to index tip ÷ hand size (Infinity when the hand is degenerate). */
export function pinchRatio(p: Points, aspect: number): number {
  const size = handSize(p, aspect);
  if (size < 1e-4) return Infinity;
  return slotDistance(p, SLOT.thumbTip, SLOT.indexTip, aspect) / size;
}

/** Pinch with hysteresis: starts below PINCH_ON, ends above PINCH_OFF. */
export const nextPinch = (pinching: boolean, ratio: number) =>
  pinching ? ratio < PINCH_OFF : ratio < PINCH_ON;

export type Fingers = {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  little: boolean;
};

/** Which fingers are extended. The ring finger's knuckle is taken halfway between middle and little. */
export function extendedFingers(p: Points, aspect: number): Fingers {
  const wx = p[SLOT.wrist * 2]!;
  const wy = p[SLOT.wrist * 2 + 1]!;
  const fromWrist = (x: number, y: number) =>
    Math.hypot((x - wx) * aspect, y - wy);
  const at = (slot: number) => fromWrist(p[slot * 2]!, p[slot * 2 + 1]!);
  const out = (tip: number, knuckle: number) =>
    at(tip) > at(knuckle) * FINGER_EXTENDED;
  const ringKnuckle = fromWrist(
    (p[SLOT.middleKnuckle * 2]! + p[SLOT.littleKnuckle * 2]!) / 2,
    (p[SLOT.middleKnuckle * 2 + 1]! + p[SLOT.littleKnuckle * 2 + 1]!) / 2,
  );
  const size = handSize(p, aspect);
  return {
    thumb:
      size > 1e-4 &&
      slotDistance(p, SLOT.thumbTip, SLOT.indexKnuckle, aspect) / size >
        THUMB_EXTENDED,
    index: out(SLOT.indexTip, SLOT.indexKnuckle),
    middle: out(SLOT.middleTip, SLOT.middleKnuckle),
    ring: at(SLOT.ringTip) > ringKnuckle * FINGER_EXTENDED,
    little: out(SLOT.littleTip, SLOT.littleKnuckle),
  };
}

/** Open palm: every finger extended. */
export const isOpenPalm = (f: Fingers) =>
  f.thumb && f.index && f.middle && f.ring && f.little;

/**
 * What an open-palm hold does (8.4): on Home with a desk object highlighted (room.hot) it opens
 * that object after 0.8 s; anywhere else it toggles the music after 1 s. The plant is never
 * highlighted (only a pinch waters it), so a palm over it toggles the music.
 */
export function palmTarget(
  pageId: string | null,
  hot: string | null,
): { kind: "open" | "music"; target: string | null; duration: number } {
  return pageId === "home" && hot
    ? { kind: "open", target: hot, duration: PALM_OPEN_S }
    : { kind: "music", target: null, duration: PALM_HOLD_S };
}

// --- Events (8.4: the coach waits for each gesture once) -------------------------------------

export type GestureEvent = "point" | "click" | "drag";
const listeners = new Set<(event: GestureEvent) => void>();

/** Called when the visitor points (moves the cursor a little), pinch-clicks or pinch-drags. */
export function onGesture(listener: (event: GestureEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const emit = (event: GestureEvent) => {
  for (const listener of listeners) listener(event);
};

/** A short history of filtered cursor positions, to look back to before a pinch. */
export function createHistory(size = 16) {
  const t = new Float64Array(size);
  const x = new Float64Array(size);
  const y = new Float64Array(size);
  let count = 0;
  let head = 0;
  return {
    push(time: number, px: number, py: number) {
      t[head] = time;
      x[head] = px;
      y[head] = py;
      head = (head + 1) % size;
      count = Math.min(count + 1, size);
    },
    /** The newest position at or before `time`; the oldest kept one if none is that old. */
    at(time: number): [number, number] | null {
      if (count === 0) return null;
      let oldest: [number, number] = [0, 0];
      for (let i = 1; i <= count; i++) {
        const j = (head - i + size) % size;
        if (t[j]! <= time) return [x[j]!, y[j]!];
        oldest = [x[j]!, y[j]!];
      }
      return oldest;
    },
    clear() {
      count = 0;
    },
  };
}

// --- Debug (tuning) ----------------------------------------------------------------------------

/** Live numbers for /dev's readout and tuning; nothing reads them in the app. */
export const gestureDebug = {
  ratio: 0,
  fingers: "",
  /** idle | point | pinch | drag | palm */
  gesture: "idle",
  /** How far (px) the last pinch's click point was moved back from the cursor at pinch time. */
  lastCorrection: 0,
};

// --- Driver ------------------------------------------------------------------------------------

/** Starts turning landmarks into the cursor and gestures; returns stop(). */
export function startGestures(): () => void {
  const store = useStore.getState;
  const synthetic: Synthetic = createSynthetic();
  const fx = createOneEuro();
  const fy = createOneEuro();
  const history = createHistory();
  const dev = process.env.NODE_ENV !== "production";

  let seenVersion = -1;
  let lastSeen = -Infinity;
  let visible = false;
  /** Filtered target and the displayed cursor (px). */
  let tx = 0;
  let ty = 0;
  let dx = 0;
  let dy = 0;
  let placed = false;
  let lastSentX = -Infinity;
  let lastSentY = -Infinity;

  let pinching = false;
  let pinchStart = 0;
  let downX = 0;
  let downY = 0;
  let dragging = false;
  let prevDragY = 0;
  let dragVelocity = 0;
  let inertia = 0;

  let palmStart = -1;
  let palmLatched = false;
  let palm = 0;
  let holdKind: "open" | "music" | null = null;
  let holdTarget: string | null = null;
  /** Cursor travel while the hand is in view, for the coach's "point" step. */
  let travel = 0;
  let pointed = false;
  let prevX = NaN;
  let prevY = NaN;

  const endHold = () => {
    palmStart = -1;
    palm = 0;
    holdKind = null;
    holdTarget = null;
  };

  const setPinching = (on: boolean) => {
    if (store().ar.pinching !== on) store().ar.setPinching(on);
  };

  const release = (cancelled: boolean) => {
    if (!pinching) return;
    pinching = false;
    setPinching(false);
    // Events go out before the click: a click on the coach's Next moves it to the next step,
    // which must not count this same pinch.
    if (dragging) {
      if (!cancelled) emit("drag");
      synthetic.up(downX, downY, false);
      inertia = cancelled ? 0 : dragVelocity;
    } else {
      if (!cancelled) emit("click");
      synthetic.up(downX, downY, !cancelled);
    }
    dragging = false;
  };

  const tick = (_time: number, deltaMs: number) => {
    const now = performance.now() / 1000;
    const dt = Math.min(deltaMs / 1000, 0.1);
    const w = window.innerWidth;
    const h = window.innerHeight;

    // 1. A new detection result.
    if (landmarks.version !== seenVersion) {
      seenVersion = landmarks.version;
      if (landmarks.visible) {
        const p = landmarks.points;
        const aspect = landmarks.aspect || 4 / 3;
        const [mx, my] = mapToScreen(
          p[SLOT.indexTip * 2]!,
          p[SLOT.indexTip * 2 + 1]!,
          w,
          h,
        );
        tx = fx.filter(mx, now);
        ty = fy.filter(my, now);
        history.push(now, tx, ty);
        lastSeen = now;
        if (!placed) {
          dx = tx;
          dy = ty;
          placed = true;
        }
        visible = true;

        const ratio = pinchRatio(p, aspect);
        const fingers = extendedFingers(p, aspect);
        gestureDebug.ratio = ratio;
        gestureDebug.fingers = (
          [
            ["T", fingers.thumb],
            ["I", fingers.index],
            ["M", fingers.middle],
            ["R", fingers.ring],
            ["L", fingers.little],
          ] as const
        )
          .map(([k, on]) => (on ? k : "·"))
          .join("");

        // Pinch.
        const pinchNow = nextPinch(pinching, ratio);
        if (pinchNow && !pinching) {
          const back = history.at(now - CLICK_LOOKBACK_S) ?? [tx, ty];
          [downX, downY] = back;
          gestureDebug.lastCorrection = Math.hypot(tx - downX, ty - downY);
          if (dev) {
            console.info(
              `[hand] pinch: click moved back ${gestureDebug.lastCorrection.toFixed(1)} px (${CLICK_LOOKBACK_S * 1000} ms)`,
            );
          }
          pinching = true;
          pinchStart = now;
          dragging = false;
          inertia = 0;
          dx = downX;
          dy = downY;
          setPinching(true);
          synthetic.down(downX, downY);
        } else if (!pinchNow && pinching) {
          release(false);
        }

        // Open palm, held: open the desk object under it (Home), else toggle the music; once
        // per hold. Moving onto another object restarts the hold.
        if (!pinching && isOpenPalm(fingers)) {
          const { page, room } = store();
          const goal = palmTarget(page.id, room.hot);
          if (palmLatched) {
            palm = 0;
            holdKind = null;
            holdTarget = null;
          } else {
            if (
              palmStart < 0 ||
              goal.kind !== holdKind ||
              goal.target !== holdTarget
            ) {
              palmStart = now;
              holdKind = goal.kind;
              holdTarget = goal.target;
            }
            palm = Math.min(1, (now - palmStart) / goal.duration);
            if (palm >= 1) {
              palmLatched = true;
              const kind = holdKind;
              endHold();
              // Open: a click where the hand points, on the room's hit element (R.4 opens it).
              if (kind === "open") synthetic.click(dx, dy);
              else toggleMusic();
            }
          }
        } else {
          endHold();
          palmLatched = false;
        }
      }
    }

    // 2. Hand lost: let go of a pinch at once, fade the cursor after LOST_S.
    if (visible && now - lastSeen > 0.15 && pinching) release(true);
    if (visible && now - lastSeen > LOST_S) {
      visible = false;
      endHold();
      travel = 0;
      pointed = false;
      fx.reset();
      fy.reset();
      history.clear();
      placed = false;
      synthetic.leave();
      lastSentX = -Infinity;
    }

    // 3. The displayed cursor: held still for the first moments of a pinch, else easing.
    if (visible) {
      const frozen = pinching && now - pinchStart < PINCH_FREEZE_S;
      if (!frozen) {
        const k = 1 - Math.exp(-dt / DISPLAY_TAU);
        dx += (tx - dx) * k;
        dy += (ty - dy) * k;
      }
    }

    // 4. Pinch-drag scrolls; after release the speed carries on and decays.
    if (pinching && !dragging && Math.abs(dy - downY) > DRAG_START_PX) {
      dragging = true;
      prevDragY = dy;
      dragVelocity = 0;
      synthetic.cancelPress(downX, downY);
    }
    if (dragging) {
      const step = -(dy - prevDragY) * DRAG_GAIN;
      prevDragY = dy;
      if (step !== 0) synthetic.scroll(downX, downY, step);
      if (dt > 0) {
        const v = step / dt;
        dragVelocity += (v - dragVelocity) * (1 - Math.exp(-dt / 0.05));
      }
    } else if (inertia !== 0) {
      synthetic.scroll(downX, downY, inertia * dt);
      inertia *= Math.exp(-dt / INERTIA_TAU);
      if (Math.abs(inertia) < 20) inertia = 0;
    }

    // The coach's "point": the hand moved the cursor a little.
    if (visible && !pointed) {
      if (!Number.isNaN(prevX)) travel += Math.hypot(dx - prevX, dy - prevY);
      if (travel > POINT_TRAVEL_PX) {
        pointed = true;
        emit("point");
      }
    }
    prevX = visible ? dx : NaN;
    prevY = visible ? dy : NaN;

    // 5. Store and synthetic pointer.
    gestureDebug.gesture = !visible
      ? "idle"
      : dragging
        ? "drag"
        : pinching
          ? "pinch"
          : palm > 0
            ? "palm"
            : "point";
    const hand = store().ar.hand;
    const x = w > 0 ? dx / w : 0.5;
    const y = h > 0 ? dy / h : 0.5;
    if (
      hand.visible !== visible ||
      hand.x !== x ||
      hand.y !== y ||
      hand.palm !== palm ||
      hand.holdKind !== holdKind ||
      hand.holdTarget !== holdTarget
    ) {
      store().ar.setHand({ x, y, visible, palm, holdKind, holdTarget });
    }
    if (visible) {
      const moved =
        Math.abs(dx - lastSentX) > 0.1 || Math.abs(dy - lastSentY) > 0.1;
      if (moved) {
        lastSentX = dx;
        lastSentY = dy;
      }
      synthetic.move(dx, dy, pinching, moved);
    }
  };

  gsap.ticker.add(tick);
  return () => {
    gsap.ticker.remove(tick);
    if (pinching) release(true);
    synthetic.leave();
    setPinching(false);
    store().ar.setHand({
      x: 0.5,
      y: 0.5,
      visible: false,
      palm: 0,
      holdKind: null,
      holdTarget: null,
    });
    gestureDebug.gesture = "idle";
  };
}

// --- Coach (8.4) ------------------------------------------------------------------------------

/** The gesture each coach step waits for: Point, Pinch to click, Pinch and drag to scroll. */
export const COACH_EVENTS: readonly GestureEvent[] = ["point", "click", "drag"];

/** Whether `event` completes coach step `step` (0-based). */
export const coachStepDone = (step: number, event: GestureEvent) =>
  COACH_EVENTS[step] === event;
