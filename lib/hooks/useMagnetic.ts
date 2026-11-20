"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "./useReducedMotion";

export type MagneticOptions = {
  /** How far outside the element (px) the pull starts. */
  radius?: number;
  /** Largest drift (px) on each axis. */
  max?: number;
  /** Share of the pointer's offset from the centre that the element follows. */
  strength?: number;
};

type Entry = {
  options: Required<MagneticOptions>;
  /** Current drift, the tween target; mirrored into --mx / --my. */
  drift: { x: number; y: number };
  active: boolean;
};

const entries = new Map<HTMLElement, Entry>();

function apply(el: HTMLElement, drift: Entry["drift"]) {
  el.style.setProperty("--mx", `${drift.x}px`);
  el.style.setProperty("--my", `${drift.y}px`);
}

function release(el: HTMLElement, entry: Entry) {
  entry.active = false;
  gsap.to(entry.drift, {
    x: 0,
    y: 0,
    duration: 0.6,
    ease: "elastic.out(1, 0.5)",
    overwrite: true,
    onUpdate: () => apply(el, entry.drift),
  });
}

/** One listener for every magnetic element on the page. */
function onPointerMove(e: PointerEvent) {
  if (e.pointerType !== "mouse") return;
  for (const [el, entry] of entries) {
    const { radius, max, strength } = entry.options;
    const r = el.getBoundingClientRect();
    // The rect includes the current drift; measure from the element's resting place.
    const cx = r.left + r.width / 2 - entry.drift.x;
    const cy = r.top + r.height / 2 - entry.drift.y;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const outsideX = Math.max(0, Math.abs(dx) - r.width / 2);
    const outsideY = Math.max(0, Math.abs(dy) - r.height / 2);
    const near = Math.hypot(outsideX, outsideY) <= radius;

    if (near) {
      entry.active = true;
      gsap.to(entry.drift, {
        x: gsap.utils.clamp(-max, max, dx * strength),
        y: gsap.utils.clamp(-max, max, dy * strength),
        duration: 0.35,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => apply(el, entry.drift),
      });
    } else if (entry.active) {
      release(el, entry);
    }
  }
}

function onLeaveWindow(e: MouseEvent) {
  if (e.relatedTarget) return;
  for (const [el, entry] of entries) if (entry.active) release(el, entry);
}

function register(el: HTMLElement, options: Required<MagneticOptions>) {
  entries.set(el, { options, drift: { x: 0, y: 0 }, active: false });
  if (entries.size === 1) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseout", onLeaveWindow);
  }
}

function unregister(el: HTMLElement) {
  const entry = entries.get(el);
  if (entry) gsap.killTweensOf(entry.drift);
  entries.delete(el);
  el.style.removeProperty("--mx");
  el.style.removeProperty("--my");
  if (entries.size === 0) {
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("mouseout", onLeaveWindow);
  }
}

/**
 * The element drifts toward the pointer while it's within `radius` px (up to `max` px), and
 * springs back on leave (Cursor board: radius 60, max 8). It writes --mx / --my, which the
 * `.magnetic` class feeds into the CSS `translate` property, so it never touches `transform`
 * (Framer owns that for the press). Mouse only; off on touch and with reduced motion.
 * Pass enabled = false to switch it off.
 */
export function useMagnetic(
  ref: RefObject<HTMLElement | null>,
  { radius = 60, max = 8, strength = 0.3 }: MagneticOptions = {},
  enabled = true,
): void {
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    register(el, { radius, max, strength });
    return () => unregister(el);
  }, [ref, enabled, reduced, radius, max, strength]);
}
