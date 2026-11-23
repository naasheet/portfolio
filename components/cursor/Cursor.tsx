"use client";

import { ArrowUpRight, Hand, Pause, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { arCopy } from "@/content/ar";
import { gsap } from "@/lib/motion/gsap";
import { useStore } from "@/lib/store";

type CursorState = "default" | "orbit" | "text" | "view";

/** One dot and a pool of 16 specks (the palm ring needs 16); 3 orbit at rest (Orbit board). */
const POOL = 16;
/** An element's ring uses at most 14 of them. */
const RING_MAX = 14;
const REST_SPECKS = 3;
/** Every third speck is amber. */
const isAmber = (i: number) => i % 3 === 2;
/** At rest each speck trails the dot with its own lag (s), cycling 0.08 / 0.14 / 0.20. */
const LAGS = [0.08, 0.14, 0.2];
const ORBIT_RADIUS = 13;
/** 90° a second: one turn every 4 s. */
const ORBIT_SPEED = Math.PI / 2;
/** The ring sits this far outside the element's edge, 2 px while pressed. */
const EDGE = 7;
const EDGE_PRESSED = 2;
/** Specks drift along the ring at 20 px/s. */
const DRIFT_SPEED = 20;
/** Ring spacing: one speck per ~32 px of perimeter, between 8 and 14 specks. */
const RING_SPACING = 32;
const RING_MIN = 8;
/** Hand mode (8.3, the Orbit board's amber states): the three specks sit at 18 px. */
const HAND_ORBIT_RADIUS = 18;
/** The palm hold: 16 specks in a ring this far out, lit one by one as the hold fills. */
const PALM_SPECKS = 16;
const PALM_RADIUS = 26;
/**
 * 8.4: the hand gone this long (after the cursor's 500 ms fade, so 3 s in all) shows "Show me
 * your hand" where it was last seen (AR board edge state, "Hand lost").
 */
const LOST_HINT_MS = 2500;
/** A dwell click flashes the pressed look this long. */
const CLICK_FLASH_MS = 160;
/** Two-finger scroll: four specks above and below the dot (px). */
const SCROLL_SPECKS = [0, 1, 2, 3];
const SCROLL_OFFSETS = [-24, -14, 14, 24];
/** Easing time constants (s): onto the ring in ~250 ms (soft spring), snapping in when pressed. */
const RING_TAU = 0.07;
const PRESS_TAU = 0.035;
const TEXT_TAU = 0.05;
/** Specks grow from 3 px to 4 px while pressed. */
const PRESSED_SCALE = 4 / 3;
/** The caret's ends sit 12 px above and below the pointer (2 x 24 caret). */
const CARET_HALF = 12;
/** Specks marking the caret ends (both amber). */
const CARET_SPECKS = [2, 5];

/** Inputs that take typing get the caret; buttons styled as inputs don't. */
const TEXT_INPUTS =
  "textarea, [contenteditable='true'], input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file'])";

function stateFor(target: EventTarget | null): {
  state: CursorState;
  el: HTMLElement | null;
} {
  if (!(target instanceof Element)) return { state: "default", el: null };
  const input = target.closest<HTMLElement>(TEXT_INPUTS);
  if (input) return { state: "text", el: input };
  const tagged = target.closest<HTMLElement>("[data-cursor]");
  const value = tagged?.dataset.cursor;
  if (tagged && (value === "orbit" || value === "text" || value === "view")) {
    return { state: value, el: tagged };
  }
  // Any link gets the ring too (board: "links").
  const link = target.closest<HTMLElement>("a[href]");
  if (link) return { state: "orbit", el: link };
  return { state: "default", el: null };
}

type Ring = { x: number; y: number; w: number; h: number; r: number };

function perimeter({ w, h, r }: Ring): number {
  return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
}

/** The point `s` px along a rounded rectangle's outline, clockwise from its top edge. */
function pointOnRing(ring: Ring, s: number): [number, number] {
  const { x, y, w, h, r } = ring;
  const sw = w - 2 * r;
  const sh = h - 2 * r;
  const arc = (Math.PI * r) / 2;
  const total = perimeter(ring);
  let d = ((s % total) + total) % total;
  const corner = (cx: number, cy: number, from: number): [number, number] => {
    const a = from + (d / (arc || 1)) * (Math.PI / 2);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  if (d < sw) return [x + r + d, y];
  d -= sw;
  if (d < arc) return corner(x + w - r, y + r, -Math.PI / 2);
  d -= arc;
  if (d < sh) return [x + w, y + r + d];
  d -= sh;
  if (d < arc) return corner(x + w - r, y + h - r, 0);
  d -= arc;
  if (d < sw) return [x + w - r - d, y + h];
  d -= sw;
  if (d < arc) return corner(x + r, y + h - r, Math.PI / 2);
  d -= arc;
  if (d < sh) return [x, y + h - r - d];
  d -= sh;
  return corner(x + r, y + r, Math.PI);
}

/** The ring around an element: its rect pushed out by `offset`, corners rounded to match. */
function ringAround(el: HTMLElement, radius: number, offset: number): Ring {
  const b = el.getBoundingClientRect();
  const w = b.width + offset * 2;
  const h = b.height + offset * 2;
  return {
    x: b.left - offset,
    y: b.top - offset,
    w,
    h,
    r: Math.max(0, Math.min(radius + offset, w / 2, h / 2)),
  };
}

/**
 * The custom mouse cursor, "Orbit" (board: stuff/reference/Cursor — Orbit (chunks 1.7, 8.3)):
 * a 6 px dot exactly on the pointer with three 3 px specks orbiting it at 13 px (one turn every
 * 4 s, one speck in three amber). Moving pulls the specks into a short stream behind the dot.
 *
 * - orbit (data-cursor="orbit" on Button, IconButton, Chip and interactive Card; any link): the
 *   dot fades and 8-14 specks spread 7 px outside the element's edge in ~250 ms, then drift
 *   along it at 20 px/s. The ring follows the element (magnetic drift, scrolling). Pressed snaps
 *   them to 2 px from the edge, grows them to 4 px, and makes them all glow.
 * - text (data-cursor="text", inputs): a 2 x 24 caret with an amber speck at each end.
 * - view (data-cursor="view" + data-cursor-label): a pill that follows the pointer; the specks
 *   orbit the pill.
 *
 * The dot is set straight from pointer events; the specks are plain spans moved with transforms
 * from one gsap.ticker callback (no loop of its own), which runs only while the cursor is
 * visible and the tab is in front. State lives in data attributes, never React state. Renders
 * nothing on touch / coarse pointers or with reduced motion.
 *
 * Hand mode (8.3, while ar.enabled): data-mode="hand", amber. The position comes from ar.hand
 * (features/ar/gestures.ts) instead of mouse events, and the real mouse is ignored; the rings
 * still follow the synthetic pointer's over events. Pointing: an 8 px dot with three specks at
 * 18 px. Dwell (ar.hand.dwell): the ring around what it rests on (or 16 specks around the dot)
 * lights up one by one; the click (ar.hand.clicks) flashes the pressed look: the specks collapse
 * into the 14 px dot and burst back out. Two-finger scroll (ar.hand.scrolling): four specks line
 * up above and below the dot. Palm hold (ar.hand.palm): 16 specks ring a play / pause icon and
 * light up one by one. Hand lost: it fades.
 * It renders in hand mode even with reduced motion (it is the only pointer then): the specks are
 * still (no spin, no easing) and the click snaps.
 */
export function Cursor() {
  const reduced = useReducedMotion();
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const handOn = useStore((s) => s.ar.enabled);
  const active = finePointer && (!reduced || handOn);

  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const pillShape = useRef<HTMLSpanElement>(null);
  const pillText = useRef<HTMLSpanElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const specks = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const rootEl = root.current;
    const dotEl = dot.current;
    const pillEl = pill.current;
    const pillShapeEl = pillShape.current;
    const pillTextEl = pillText.current;
    const hintEl = hint.current;
    const speckEls = specks.current.filter((s): s is HTMLSpanElement => !!s);
    if (
      !active ||
      !rootEl ||
      !dotEl ||
      !pillEl ||
      !pillShapeEl ||
      !pillTextEl ||
      !hintEl ||
      speckEls.length !== POOL
    ) {
      return;
    }

    const html = document.documentElement;
    const setDotX = gsap.quickSetter(dotEl, "x", "px");
    const setDotY = gsap.quickSetter(dotEl, "y", "px");
    const pillX = gsap.quickTo(pillEl, "x", {
      duration: 0.12,
      ease: "power3.out",
    });
    const pillY = gsap.quickTo(pillEl, "y", {
      duration: 0.12,
      ease: "power3.out",
    });

    let state: CursorState = "default";
    let target: HTMLElement | null = null;
    let targetRadius = 0;
    let pressed = false;
    const pointer = { x: 0, y: 0 };
    let placed = false;
    let orbitAngle = 0;
    let drift = 0;
    /** Hand mode (8.3): position, press and palm come from the store. */
    let hand = false;
    let shown = false;
    /** Dwell clicks seen (ar.hand.clicks) and the end of the click flash (ms). */
    let seenClicks = useStore.getState().ar.hand.clicks;
    let flashUntil = 0;
    /** When the hand went out of view (ms), for the lost hint; 0 while it's in view. */
    let lostSince = 0;
    const setLost = (on: boolean) => {
      if (on === "lost" in rootEl.dataset) return;
      if (on) {
        // Where the hand was last seen (the centre if it never was).
        gsap.set(hintEl, { x: pointer.x, y: pointer.y });
        rootEl.dataset.lost = "";
      } else delete rootEl.dataset.lost;
    };

    // Per-speck position, scale and visibility.
    const pos = speckEls.map(() => ({ x: 0, y: 0, s: 1 }));
    const on = speckEls.map(() => false);
    const setOn = (i: number, value: boolean) => {
      if (on[i] === value) return;
      on[i] = value;
      const el = speckEls[i];
      if (!el) return;
      if (value) el.dataset.on = "";
      else delete el.dataset.on;
    };

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.05);
      if (!reduced) {
        orbitAngle += ORBIT_SPEED * dt;
        drift += DRIFT_SPEED * dt;
      }

      let palm = 0;
      let dwell = 0;
      let scrolling = false;
      if (hand) {
        const ar = useStore.getState().ar;
        if (!ar.hand.visible) {
          if (shown) hideVisual();
          const now = performance.now();
          if (!lostSince) lostSince = now;
          setLost(now - lostSince > LOST_HINT_MS);
          return;
        }
        lostSince = 0;
        setLost(false);
        placeAt(ar.hand.x * window.innerWidth, ar.hand.y * window.innerHeight);
        if (!shown) showVisual();
        // A dwell click: a short press flash (the specks snap in, then burst back out).
        const nowMs = performance.now();
        if (ar.hand.clicks !== seenClicks) {
          seenClicks = ar.hand.clicks;
          flashUntil = nowMs + CLICK_FLASH_MS;
        }
        const flashing = nowMs < flashUntil;
        if (pressed !== flashing) {
          pressed = flashing;
          if (pressed) rootEl.dataset.pressed = "";
          else delete rootEl.dataset.pressed;
        }
        dwell = ar.hand.dwell;
        if (dwell > 0) rootEl.dataset.dwell = "";
        else delete rootEl.dataset.dwell;
        scrolling = ar.hand.scrolling;
        if (scrolling) rootEl.dataset.scroll = "";
        else delete rootEl.dataset.scroll;
        palm = ar.hand.palm;
        if (palm > 0) rootEl.dataset.palm = "";
        else delete rootEl.dataset.palm;
        // 8.4: the icon in the ring says what the hold does: open (↗) or play / pause.
        const action = ar.hand.holdKind ?? "";
        if (rootEl.dataset.action !== action) rootEl.dataset.action = action;
        const playing = useStore.getState().audio.playing;
        if (playing !== "playing" in rootEl.dataset) {
          if (playing) rootEl.dataset.playing = "";
          else delete rootEl.dataset.playing;
        }
      }
      const lit = Math.floor(palm * PALM_SPECKS + 1e-6);
      /** Mark speck i lit or not (the palm ring and the dwell ring light up in order). */
      const setLit = (i: number, on: boolean) => {
        const el = speckEls[i];
        if (el && on !== "lit" in el.dataset) {
          if (on) el.dataset.lit = "";
          else delete el.dataset.lit;
        }
      };

      if (target && !target.isConnected) target = null;

      // Where each speck should be, and how quickly it gets there.
      let ring: Ring | null = null;
      if (state === "orbit" && target) {
        ring = ringAround(target, targetRadius, pressed ? EDGE_PRESSED : EDGE);
      } else if (state === "view") {
        ring = ringAround(pillShapeEl, 16, EDGE);
      }
      const ringCount = ring
        ? Math.max(
            RING_MIN,
            Math.min(RING_MAX, Math.round(perimeter(ring) / RING_SPACING)),
          )
        : 0;

      for (let i = 0; i < POOL; i++) {
        let tx = pointer.x;
        let ty = pointer.y;
        let visible = false;
        let tau = LAGS[i % LAGS.length] ?? 0.14;
        let scale = 1;

        if (hand && palm > 0) {
          // Palm hold: a ring of 16 around the icon, lit in order as the hold fills.
          visible = i < PALM_SPECKS;
          const a = -Math.PI / 2 + (i * Math.PI * 2) / PALM_SPECKS;
          tx = pointer.x + PALM_RADIUS * Math.cos(a);
          ty = pointer.y + PALM_RADIUS * Math.sin(a);
          tau = RING_TAU;
          setLit(i, i < lit);
        } else if (hand && scrolling) {
          // Two-finger scroll: the specks line up above and below the dot, like a scroll track.
          const slot = SCROLL_SPECKS.indexOf(i);
          visible = slot !== -1;
          if (visible) ty = pointer.y + (SCROLL_OFFSETS[slot] ?? 0);
          tau = TEXT_TAU;
          setLit(i, false);
        } else if (ring) {
          visible = i < ringCount;
          if (visible) {
            const len = perimeter(ring);
            [tx, ty] = pointOnRing(ring, drift + (i * len) / ringCount);
          }
          tau = pressed ? PRESS_TAU : RING_TAU;
          scale = pressed && state === "orbit" ? PRESSED_SCALE : 1;
          // Dwell: the ring around the target lights up in order as the click comes.
          setLit(i, hand && i < Math.floor(dwell * ringCount + 1e-6));
        } else if (hand && dwell > 0) {
          // Dwell on something without its own ring: 16 specks ring the dot instead.
          visible = i < PALM_SPECKS;
          const a = -Math.PI / 2 + (i * Math.PI * 2) / PALM_SPECKS;
          tx = pointer.x + PALM_RADIUS * Math.cos(a);
          ty = pointer.y + PALM_RADIUS * Math.sin(a);
          tau = RING_TAU;
          setLit(i, i < Math.floor(dwell * PALM_SPECKS + 1e-6));
        } else if (state === "text") {
          const end = CARET_SPECKS.indexOf(i);
          visible = end !== -1;
          if (visible) ty = pointer.y + (end === 0 ? -CARET_HALF : CARET_HALF);
          tau = TEXT_TAU;
        } else if (hand && pressed) {
          // A dwell click: the specks collapse into the dot, then burst back out.
          visible = i < REST_SPECKS;
          tau = PRESS_TAU;
          setLit(i, false);
        } else {
          setLit(i, false);
          visible = i < REST_SPECKS;
          if (visible) {
            const radius = hand ? HAND_ORBIT_RADIUS : ORBIT_RADIUS;
            const a = orbitAngle + (i * Math.PI * 2) / REST_SPECKS;
            tx = pointer.x + radius * Math.cos(a);
            ty = pointer.y + radius * Math.sin(a);
          }
        }

        const p = pos[i];
        const el = speckEls[i];
        if (!p || !el) continue;
        // Reduced motion (hand mode only): no easing, everything snaps.
        const k = reduced ? 1 : 1 - Math.exp(-dt / tau);
        p.x += (tx - p.x) * k;
        p.y += (ty - p.y) * k;
        p.s += (scale - p.s) * k;
        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.s})`;
        setOn(i, visible);
      }
    };

    let ticking = false;
    const startTicker = () => {
      if (ticking) return;
      gsap.ticker.add(tick);
      ticking = true;
    };
    const stopTicker = () => {
      if (!ticking) return;
      gsap.ticker.remove(tick);
      ticking = false;
    };

    const showVisual = () => {
      shown = true;
      rootEl.dataset.visible = "";
      html.classList.add("has-cursor");
    };
    const hideVisual = () => {
      shown = false;
      delete rootEl.dataset.visible;
      delete rootEl.dataset.pressed;
      delete rootEl.dataset.palm;
      pressed = false;
      // The next sighting starts under the pointer again (no sweep from the old spot).
      placed = false;
      html.classList.remove("has-cursor");
    };
    const show = () => {
      showVisual();
      if (document.visibilityState === "visible") startTicker();
    };
    const hide = () => {
      hideVisual();
      // Hand mode keeps ticking: it watches the store for the hand coming back.
      if (!hand) stopTicker();
    };

    const placeAt = (x: number, y: number) => {
      pointer.x = x;
      pointer.y = y;
      setDotX(x);
      setDotY(y);
      pillX(x);
      pillY(y);
      if (!placed) {
        // First sighting: start everything under the pointer, not at 0,0.
        for (const p of pos) {
          p.x = x;
          p.y = y;
        }
        gsap.set(pillEl, { x, y });
        placed = true;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (hand) return;
      if (e.pointerType !== "mouse") {
        hide();
        return;
      }
      placeAt(e.clientX, e.clientY);
      show();
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      // Hand mode follows only the hand's synthetic pointer (untrusted), never the real mouse.
      if (hand === e.isTrusted) return;
      const next = stateFor(e.target);
      state = next.state;
      rootEl.dataset.state = state;
      target = state === "orbit" ? next.el : null;
      if (target) {
        targetRadius =
          parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0;
      }
      if (state === "view") {
        pillTextEl.textContent = next.el?.dataset.cursorLabel ?? "";
      }
    };

    const onDown = (e: PointerEvent) => {
      if (hand || e.pointerType !== "mouse") return;
      pressed = true;
      rootEl.dataset.pressed = "";
    };
    const onUp = () => {
      if (hand) return;
      pressed = false;
      delete rootEl.dataset.pressed;
    };
    // relatedTarget is null when the pointer leaves the window.
    const onOut = (e: MouseEvent) => {
      if (!hand && !e.relatedTarget) hide();
    };
    // Specks hide while the tab is in the background.
    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        hideVisual();
        stopTicker();
      } else if (hand) {
        startTicker();
      }
    };
    const onBlur = () => {
      if (!hand) hide();
    };

    // Hand mode follows ar.enabled (no React state: the effect owns the switch).
    const setHand = (on: boolean) => {
      if (hand === on) return;
      hand = on;
      rootEl.dataset.mode = on ? "hand" : "mouse";
      lostSince = 0;
      setLost(false);
      if (on) {
        // Until the hand is seen, the lost hint sits in the middle of the screen.
        pointer.x = window.innerWidth / 2;
        pointer.y = window.innerHeight / 2;
      }
      state = "default";
      rootEl.dataset.state = state;
      target = null;
      hideVisual();
      for (const el of speckEls) delete el.dataset.lit;
      if (on && document.visibilityState === "visible") startTicker();
      if (!on) stopTicker();
    };
    const unsubscribeHand = useStore.subscribe((s) => s.ar.enabled, setHand, {
      fireImmediately: true,
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);

    return () => {
      unsubscribeHand();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      gsap.killTweensOf(pillEl);
      hand = false;
      hide();
    };
  }, [active, reduced]);

  if (!active) return null;

  return (
    <div
      ref={root}
      aria-hidden
      className="cursor-root"
      data-state="default"
      data-mode="mouse"
    >
      <div ref={pill} className="cursor-pos">
        <span ref={pillShape} className="cursor-pill">
          <span ref={pillText} />
          <ArrowUpRight aria-hidden className="size-3.5" />
        </span>
      </div>
      {Array.from({ length: POOL }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            specks.current[i] = el;
          }}
          className="cursor-speck"
          data-amber={isAmber(i) ? "" : undefined}
        />
      ))}
      <div ref={dot} className="cursor-pos">
        <span className="cursor-dot" />
        <span className="cursor-palm-icon">
          <Play aria-hidden className="cursor-palm-play" />
          <Pause aria-hidden className="cursor-palm-pause" />
          <ArrowUpRight aria-hidden className="cursor-palm-open" />
        </span>
        <span className="cursor-caret" />
      </div>
      <div ref={hint} className="cursor-pos">
        <span className="cursor-hint">
          <Hand aria-hidden className="size-4" />
          {arCopy.lostHint}
        </span>
      </div>
    </div>
  );
}
