/*
 * Hand gestures (8.3, reworked after 8.5 with Nasheet): the landmarks from the tracker (8.2)
 * become a cursor and three gestures.
 *
 *   point        the index fingertip moves the cursor.
 *   dwell        rest the cursor on something clickable for 0.8 s: it clicks (a ring of specks
 *                fills around it). Moving off cancels; after a click the same target won't
 *                click again until the cursor leaves it.
 *   two fingers  index and middle up, ring and little down: scroll mode. The cursor holds still
 *                and moving the hand scrolls like grabbing the page (hand up = further down),
 *                gliding on when the pose ends.
 *   open palm    held 1 s: play / pause the music; on Home over a desk object, 0.8 s opens it.
 *   pinch + drag thumb and index together, then sideways: right goes back, left goes forward (the
 *                browser's buttons), on release once the drag is far enough. No clicks or
 *                scrolling while pinching.
 *
 * The top half is pure (tested in __tests__/gestures.test.ts). startGestures() is the driver:
 * one gsap.ticker callback (the shared clock) that reads `landmarks`, filters the fingertip (One
 * Euro), writes ar.hand to the store and drives the synthetic pointer (synthetic.ts). Started by
 * components/ar/ARLayer.tsx once tracking is ready. Tune the constants below on a real webcam
 * with /dev's readout (`gestureDebug`).
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
/** A finger is extended when its tip is this many times further from the wrist than its knuckle. */
export const FINGER_EXTENDED = 1.5;
/** The thumb is out when its tip is this far from the index knuckle, in hand sizes. */
export const THUMB_EXTENDED = 0.6;
/** Pinch ratio (thumb tip to index tip ÷ hand size): pinch below, let go above. */
export const PINCH_ON = 0.25;
export const PINCH_OFF = 0.35;
/** Sideways travel (px) a pinch-drag needs before letting go goes back / forward. */
export const SWIPE_PX = 160;
/** ...and it must be this much more sideways than vertical. */
export const SWIPE_RATIO = 1.5;
/** Rest on something clickable this long to click it (Nasheet: 0.8 s). */
export const DWELL_S = 0.8;
/** The palm must be held this long to toggle the music. */
export const PALM_HOLD_S = 1;
/** 8.4: on Home, a palm held over a desk object this long opens it. */
export const PALM_OPEN_S = 0.8;
/** Two fingers must hold this long to enter scroll mode, and be gone this long to leave it. */
export const SCROLL_ENTER_S = 0.12;
export const SCROLL_EXIT_S = 0.15;
/** Page px scrolled per px of hand travel in scroll mode. */
export const SCROLL_GAIN = 2;
/** Travel (px) that makes a scroll count for the coach. */
export const SCROLL_COUNTS_PX = 24;
/** Inertia after scrolling: the speed decays with this time constant (s), gone in ~0.4 s. */
export const INERTIA_TAU = 0.12;
/** 8.4: the coach's "point" step counts once the cursor has travelled this far (px). */
export const POINT_TRAVEL_PX = 120;
/** The cursor fades this long after the hand leaves the frame. */
export const LOST_S = 0.5;
/** The displayed cursor eases toward the filtered point (s): smooths the ~30 Hz results at 60 Hz. */
const DISPLAY_TAU = 0.03;

/** What dwell can click: links, buttons and anything the cursor rings (data-cursor). */
export const CLICKABLE =
  'a[href], button, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], summary, label, select, input:not([type="hidden"]), textarea, [data-cursor="orbit"], [data-cursor="view"]';

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

/**
 * A pinch-drag of (dx, dy) px: −1 to 1 toward forward (dragging left) or back (dragging right),
 * 0 unless it's mostly sideways.
 */
export function swipeProgress(dx: number, dy: number): number {
  if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return 0;
  return Math.max(-1, Math.min(1, dx / SWIPE_PX));
}

/** What letting go of a pinch-drag does: right = back, left = forward (Nasheet), else nothing. */
export const swipeAction = (progress: number): "back" | "forward" | null =>
  progress >= 1 ? "back" : progress <= -1 ? "forward" : null;

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

/** Two fingers (scroll): index and middle up, ring and little down; the thumb doesn't matter. */
export const isTwoFingers = (f: Fingers) =>
  f.index && f.middle && !f.ring && !f.little;

/**
 * What an open-palm hold does (8.4): on Home with a desk object highlighted (room.hot) it opens
 * that object after 0.8 s; anywhere else it toggles the music after 1 s. The plant is never
 * highlighted, so a palm over it toggles the music.
 */
export function palmTarget(
  pageId: string | null,
  hot: string | null,
): { kind: "open" | "music"; target: string | null; duration: number } {
  return pageId === "home" && hot
    ? { kind: "open", target: hot, duration: PALM_OPEN_S }
    : { kind: "music", target: null, duration: PALM_HOLD_S };
}

/**
 * Dwell to click: feed it the clickable element under the cursor (or null) each frame. It returns
 * how far the dwell is (0–1) and fires once when it fills. After firing it waits until the target
 * changes (the cursor leaves it) before it can fire again.
 */
export function createDwell<T>(durationS = DWELL_S) {
  let target: T | null = null;
  let since = 0;
  let fired = false;
  return {
    update(next: T | null, nowS: number): { progress: number; fire: boolean } {
      if (next !== target) {
        target = next;
        since = nowS;
        fired = false;
      }
      if (target === null || fired) return { progress: 0, fire: false };
      const progress = Math.min(1, (nowS - since) / durationS);
      if (progress < 1) return { progress, fire: false };
      fired = true;
      return { progress: 0, fire: true };
    },
    /** Start over (scroll mode, palm hold, hand lost): the same target needs a fresh dwell. */
    reset() {
      target = null;
      fired = false;
    },
  };
}

/**
 * A pose that must hold for `enterS` to switch on and be gone for `exitS` to switch off, so one
 * misread frame neither starts nor ends it.
 */
export function createLatch(enterS: number, exitS: number) {
  let on = false;
  let since = -1;
  return {
    update(seen: boolean, nowS: number): boolean {
      if (seen === on) {
        since = -1;
        return on;
      }
      if (since < 0) since = nowS;
      if (nowS - since >= (on ? exitS : enterS)) {
        on = seen;
        since = -1;
      }
      return on;
    },
    reset() {
      on = false;
      since = -1;
    },
  };
}

// --- Events (8.4: the coach waits for each gesture once) -------------------------------------

export type GestureEvent = "point" | "click" | "scroll";
const listeners = new Set<(event: GestureEvent) => void>();

/** Called when the visitor points (moves the cursor a little), dwell-clicks or scrolls. */
export function onGesture(listener: (event: GestureEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const emit = (event: GestureEvent) => {
  for (const listener of listeners) listener(event);
};

// --- Debug (tuning) ----------------------------------------------------------------------------

/** Live numbers for /dev's readout and tuning; nothing reads them in the app. */
export const gestureDebug = {
  fingers: "",
  /** idle | point | dwell | scroll | palm | swipe */
  gesture: "idle",
};

// --- Driver ------------------------------------------------------------------------------------

/** Starts turning landmarks into the cursor and gestures; returns stop(). */
export function startGestures(): () => void {
  const store = useStore.getState;
  const synthetic: Synthetic = createSynthetic();
  const fx = createOneEuro();
  const fy = createOneEuro();
  const dwell = createDwell<Element>();
  const scrollPose = createLatch(SCROLL_ENTER_S, SCROLL_EXIT_S);

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

  // Scroll mode.
  let scrolling = false;
  let prevHandY = 0;
  let scrollTravel = 0;
  let scrollVelocity = 0;
  let inertia = 0;
  // The pose of the latest result.
  let twoFingers = false;
  let palmPose = false;

  // Palm hold.
  let palmStart = -1;
  let palmLatched = false;
  let palm = 0;
  let holdKind: "open" | "music" | null = null;
  let holdTarget: string | null = null;

  // Dwell.
  let dwellProgress = 0;
  let clicks = 0;

  // Pinch and drag sideways: back / forward.
  let pinchRatioNow = Infinity;
  let pinching = false;
  let pinchX = 0;
  let pinchY = 0;
  let swipe = 0;

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

  const endScroll = (glide: boolean) => {
    if (!scrolling) return;
    scrolling = false;
    inertia = glide ? scrollVelocity : 0;
    if (glide && scrollTravel > SCROLL_COUNTS_PX) emit("scroll");
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
        lastSeen = now;
        if (!placed) {
          dx = tx;
          dy = ty;
          placed = true;
        }
        visible = true;

        pinchRatioNow = pinchRatio(p, aspect);
        const fingers = extendedFingers(p, aspect);
        twoFingers = isTwoFingers(fingers);
        palmPose = isOpenPalm(fingers);
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

        // Pinch: starts a sideways drag from where the hand is; letting go past the line goes
        // back (dragged right) or forward (dragged left).
        const pinchNow = nextPinch(pinching, pinchRatioNow);
        if (pinchNow && !pinching && !scrolling) {
          pinching = true;
          pinchX = tx;
          pinchY = ty;
          swipe = 0;
          endHold();
          dwell.reset();
          dwellProgress = 0;
        } else if (!pinchNow && pinching) {
          pinching = false;
          const action = swipeAction(swipe);
          swipe = 0;
          if (action === "back") window.history.back();
          else if (action === "forward") window.history.forward();
        }
        if (pinching) swipe = swipeProgress(tx - pinchX, ty - pinchY);

        // Open palm, held: open the desk object under it (Home), else toggle the music; once
        // per hold. Moving onto another object restarts the hold.
        if (!scrolling && !pinching && palmPose) {
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

    // 2. Hand lost: stop scrolling (and drop a pinch without navigating) at once, fade the
    //    cursor after LOST_S.
    if (visible && now - lastSeen > 0.15 && scrolling) {
      scrollPose.reset();
      endScroll(false);
    }
    if (visible && now - lastSeen > 0.15 && pinching) {
      pinching = false;
      swipe = 0;
    }
    if (visible && now - lastSeen > LOST_S) {
      visible = false;
      endHold();
      dwell.reset();
      dwellProgress = 0;
      scrollPose.reset();
      travel = 0;
      pointed = false;
      fx.reset();
      fy.reset();
      placed = false;
      synthetic.leave();
      lastSentX = -Infinity;
    }

    // 3. Scroll mode: two fingers held. The cursor holds still; the hand's vertical travel
    //    scrolls whatever is under the cursor, like grabbing the page.
    const wantScroll =
      visible && scrollPose.update(twoFingers && !pinching, now);
    if (wantScroll && !scrolling) {
      scrolling = true;
      prevHandY = ty;
      scrollTravel = 0;
      scrollVelocity = 0;
      inertia = 0;
      endHold();
      dwell.reset();
      dwellProgress = 0;
    } else if (!wantScroll && scrolling) {
      endScroll(true);
    }
    if (scrolling) {
      const step = -(ty - prevHandY) * SCROLL_GAIN;
      prevHandY = ty;
      scrollTravel += Math.abs(step) / SCROLL_GAIN;
      if (step !== 0) synthetic.scroll(dx, dy, step);
      if (dt > 0) {
        const v = step / dt;
        scrollVelocity += (v - scrollVelocity) * (1 - Math.exp(-dt / 0.05));
      }
    } else if (inertia !== 0) {
      synthetic.scroll(dx, dy, inertia * dt);
      inertia *= Math.exp(-dt / INERTIA_TAU);
      if (Math.abs(inertia) < 20) inertia = 0;
    }

    // 4. The displayed cursor eases toward the hand (held still while scrolling).
    if (visible && !scrolling) {
      const k = 1 - Math.exp(-dt / DISPLAY_TAU);
      dx += (tx - dx) * k;
      dy += (ty - dy) * k;
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

    // 5. Synthetic pointer (hover chain every frame, moves when moved), then dwell on what's
    //    under it: only clickable things, never while scrolling or holding a palm.
    if (visible) {
      const moved =
        Math.abs(dx - lastSentX) > 0.1 || Math.abs(dy - lastSentY) > 0.1;
      if (moved) {
        lastSentX = dx;
        lastSentY = dy;
      }
      synthetic.move(dx, dy, false, moved);

      const canDwell = !scrolling && !pinching && !palmPose && palm === 0;
      const target = canDwell
        ? (synthetic.hovered()?.closest(CLICKABLE) ?? null)
        : null;
      const usable =
        target &&
        !(target as HTMLButtonElement).disabled &&
        target.getAttribute("aria-disabled") !== "true"
          ? target
          : null;
      const d = dwell.update(usable, now);
      dwellProgress = d.progress;
      if (d.fire && usable) {
        clicks++;
        // Events before the click: a click on the coach's Next moves it on, which must not
        // count this same dwell for the next step.
        emit("click");
        synthetic.clickElement(usable, dx, dy);
      }
    }

    // 6. Store (fast values; only when something changed).
    gestureDebug.gesture = !visible
      ? "idle"
      : pinching
        ? "swipe"
        : scrolling
          ? "scroll"
          : palm > 0
            ? "palm"
            : dwellProgress > 0
              ? "dwell"
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
      hand.holdTarget !== holdTarget ||
      hand.dwell !== dwellProgress ||
      hand.scrolling !== scrolling ||
      hand.clicks !== clicks ||
      hand.swipe !== swipe
    ) {
      store().ar.setHand({
        x,
        y,
        visible,
        palm,
        holdKind,
        holdTarget,
        dwell: dwellProgress,
        scrolling,
        clicks,
        swipe,
      });
    }
  };

  gsap.ticker.add(tick);
  return () => {
    gsap.ticker.remove(tick);
    synthetic.leave();
    store().ar.setHand({
      x: 0.5,
      y: 0.5,
      visible: false,
      palm: 0,
      holdKind: null,
      holdTarget: null,
      dwell: 0,
      scrolling: false,
      clicks: 0,
      swipe: 0,
    });
    gestureDebug.gesture = "idle";
  };
}

// --- Coach (8.4) ------------------------------------------------------------------------------

/** The gesture each coach step waits for: Point, Hold to click, Two fingers to scroll. */
export const COACH_EVENTS: readonly GestureEvent[] = [
  "point",
  "click",
  "scroll",
];

/** Whether `event` completes coach step `step` (0-based). */
export const coachStepDone = (step: number, event: GestureEvent) =>
  COACH_EVENTS[step] === event;
