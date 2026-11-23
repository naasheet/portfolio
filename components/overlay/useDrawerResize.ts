"use client";

import {
  useEffect,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import { storage } from "@/lib/browser";

export type DrawerResize = {
  /** localStorage key for the height, saved as a fraction of the window (0–1). */
  storageKey: string;
  /** Smallest height in px. */
  min: number;
};

/** md and up: phones keep the fixed height (and get /terminal for the terminal, 6.6). */
const DESKTOP = "(min-width: 48rem)";
/** Keyboard step for ↑ / ↓ on the handle (px). */
const STEP = 32;
/** The drawer sits 12 px from the top; leave the same at the bottom. */
const GAP = 24;

const maxHeight = () => window.innerHeight - GAP;
const clamp = (h: number, min: number) =>
  Math.round(Math.min(maxHeight(), Math.max(min, h)));

/** The panel's height (null: back to its classes). Module-level: DOM writes, not hook state. */
function setHeight(el: HTMLElement, css: string | null) {
  if (css === null) el.style.removeProperty("height");
  else el.style.height = css;
}

/** The separator's value: the drawer's height as a % of the window. */
function setValue(handle: HTMLElement | null, h: number) {
  handle?.setAttribute(
    "aria-valuenow",
    String(Math.round((h / window.innerHeight) * 100)),
  );
}

/**
 * The Drawer's drag handle (6.6): drag (or ↑ / ↓ / Home / End on the focused handle) to resize,
 * and the height is remembered. While dragging, the height is written straight to the panel's
 * style (a runtime value; nothing animates it, and no React state is touched). On release it's
 * saved, and set back as a share of the window (`calc(f * 100dvh)`), so it scales with resizes.
 */
export function useDrawerResize(
  panel: RefObject<HTMLElement | null>,
  handle: RefObject<HTMLElement | null>,
  resize: DrawerResize | undefined,
  open: boolean,
) {
  const key = resize?.storageKey;
  const min = resize?.min ?? 0;

  const label = (h: number) => setValue(handle.current, h);

  const save = (h: number) => {
    const el = panel.current;
    if (!el || !key) return;
    const f = h / window.innerHeight;
    setHeight(el, `calc(${f.toFixed(4)} * 100dvh)`);
    storage.set(key, f.toFixed(4));
    label(h);
  };

  // Restore the saved height when the drawer opens (desktop only).
  useEffect(() => {
    const el = panel.current;
    if (!open || !el || !key) return;
    if (!window.matchMedia(DESKTOP).matches) {
      setHeight(el, null);
      return;
    }
    const f = Number(storage.get(key));
    if (f > 0 && f <= 1) setHeight(el, `calc(${f} * 100dvh)`);
    setValue(handle.current, el.getBoundingClientRect().height);
  }, [open, key, panel, handle]);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    const el = panel.current;
    if (!el || e.button !== 0) return;
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startH = el.getBoundingClientRect().height;
    let h = startH;
    const move = (ev: globalThis.PointerEvent) => {
      h = clamp(startH + ev.clientY - startY, min);
      setHeight(el, `${h}px`);
      label(h);
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
      target.removeAttribute("data-dragging");
      save(h);
    };
    target.setAttribute("data-dragging", "");
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const el = panel.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height;
    const next =
      e.key === "ArrowDown"
        ? h + STEP
        : e.key === "ArrowUp"
          ? h - STEP
          : e.key === "Home"
            ? min
            : e.key === "End"
              ? maxHeight()
              : null;
    if (next === null) return;
    e.preventDefault();
    save(clamp(next, min));
  };

  return { onPointerDown, onKeyDown };
}
