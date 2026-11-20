"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { gsap } from "@/lib/motion/gsap";

type CursorState = "default" | "orbit" | "text" | "view";

/** One dot and a pool of 14 specks; 3 orbit at rest (Orbit board). */
const POOL = 14;
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
 * nothing on touch / coarse pointers or with reduced motion. 8.3 adds the amber hand mode.
 */
export function Cursor() {
  const reduced = useReducedMotion();
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const active = finePointer && !reduced;

  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const pillShape = useRef<HTMLSpanElement>(null);
  const pillText = useRef<HTMLSpanElement>(null);
  const specks = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const rootEl = root.current;
    const dotEl = dot.current;
    const pillEl = pill.current;
    const pillShapeEl = pillShape.current;
    const pillTextEl = pillText.current;
    const speckEls = specks.current.filter((s): s is HTMLSpanElement => !!s);
    if (
      !active ||
      !rootEl ||
      !dotEl ||
      !pillEl ||
      !pillShapeEl ||
      !pillTextEl ||
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
      orbitAngle += ORBIT_SPEED * dt;
      drift += DRIFT_SPEED * dt;

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
            Math.min(POOL, Math.round(perimeter(ring) / RING_SPACING)),
          )
        : 0;

      for (let i = 0; i < POOL; i++) {
        let tx = pointer.x;
        let ty = pointer.y;
        let visible = false;
        let tau = LAGS[i % LAGS.length] ?? 0.14;
        let scale = 1;

        if (ring) {
          visible = i < ringCount;
          if (visible) {
            const len = perimeter(ring);
            [tx, ty] = pointOnRing(ring, drift + (i * len) / ringCount);
          }
          tau = pressed ? PRESS_TAU : RING_TAU;
          scale = pressed && state === "orbit" ? PRESSED_SCALE : 1;
        } else if (state === "text") {
          const end = CARET_SPECKS.indexOf(i);
          visible = end !== -1;
          if (visible) ty = pointer.y + (end === 0 ? -CARET_HALF : CARET_HALF);
          tau = TEXT_TAU;
        } else {
          visible = i < REST_SPECKS;
          if (visible) {
            const a = orbitAngle + (i * Math.PI * 2) / REST_SPECKS;
            tx = pointer.x + ORBIT_RADIUS * Math.cos(a);
            ty = pointer.y + ORBIT_RADIUS * Math.sin(a);
          }
        }

        const p = pos[i];
        const el = speckEls[i];
        if (!p || !el) continue;
        const k = 1 - Math.exp(-dt / tau);
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

    const show = () => {
      rootEl.dataset.visible = "";
      html.classList.add("has-cursor");
      if (document.visibilityState === "visible") startTicker();
    };
    const hide = () => {
      delete rootEl.dataset.visible;
      delete rootEl.dataset.pressed;
      pressed = false;
      html.classList.remove("has-cursor");
      stopTicker();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        hide();
        return;
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      setDotX(e.clientX);
      setDotY(e.clientY);
      pillX(e.clientX);
      pillY(e.clientY);
      if (!placed) {
        // First sighting: start everything under the pointer, not at 0,0.
        for (const p of pos) {
          p.x = e.clientX;
          p.y = e.clientY;
        }
        gsap.set(pillEl, { x: e.clientX, y: e.clientY });
        placed = true;
      }
      show();
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
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
      if (e.pointerType !== "mouse") return;
      pressed = true;
      rootEl.dataset.pressed = "";
    };
    const onUp = () => {
      pressed = false;
      delete rootEl.dataset.pressed;
    };
    // relatedTarget is null when the pointer leaves the window.
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
    };
    // Specks hide while the tab is in the background.
    const onVisibility = () => {
      if (document.visibilityState !== "visible") hide();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", hide);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", hide);
      gsap.killTweensOf(pillEl);
      hide();
    };
  }, [active]);

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
        <span className="cursor-caret" />
      </div>
    </div>
  );
}
