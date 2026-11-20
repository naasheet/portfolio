"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { gsap } from "@/lib/motion/gsap";

type CursorState = "default" | "hover" | "text" | "view" | "magnet";

/** Inputs that take typing get the text bar; buttons styled as inputs don't. */
const TEXT_INPUTS =
  "textarea, [contenteditable='true'], input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file'])";

/** Gap between a magnetic control and the frame that snaps around it (px each side). */
const FRAME_GAP = 4;

function stateFor(target: EventTarget | null): {
  state: CursorState;
  el: HTMLElement | null;
} {
  if (!(target instanceof Element)) return { state: "default", el: null };
  const input = target.closest<HTMLElement>(TEXT_INPUTS);
  if (input) return { state: "text", el: input };
  const el = target.closest<HTMLElement>("[data-cursor]");
  const value = el?.dataset.cursor;
  if (!el || !value) return { state: "default", el: null };
  if (value === "hover" && el.classList.contains("magnetic")) {
    return { state: "magnet", el };
  }
  if (value === "hover" || value === "text" || value === "view") {
    return { state: value, el };
  }
  return { state: "default", el: null };
}

/**
 * The custom mouse cursor (Cursor board, chunk 1.7): a 6 px dot that sits exactly on the
 * pointer and a 32 px ring that follows 0.15 s behind, both moved by GSAP on the shared ticker
 * (quickSetter / quickTo, no loop of its own). The element under the pointer picks the state
 * through data-cursor ("hover" | "text" | "view"); inputs always get the text bar; magnetic
 * controls get a frame that snaps around them. State lives in data attributes, never React
 * state. It renders nothing on touch / coarse pointers and with reduced motion, and hides
 * (giving the system cursor back) when the pointer leaves the window.
 * 8.3 adds the amber hand mode to this same component.
 */
export function Cursor() {
  const reduced = useReducedMotion();
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const active = finePointer && !reduced;

  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rootEl = root.current;
    const dotEl = dot.current;
    const ringEl = ring.current;
    const labelEl = label.current;
    const frameEl = frame.current;
    if (!active || !rootEl || !dotEl || !ringEl || !labelEl || !frameEl) return;

    const html = document.documentElement;
    const setDotX = gsap.quickSetter(dotEl, "x", "px");
    const setDotY = gsap.quickSetter(dotEl, "y", "px");
    const ringX = gsap.quickTo(ringEl, "x", {
      duration: 0.15,
      ease: "power3.out",
    });
    const ringY = gsap.quickTo(ringEl, "y", {
      duration: 0.15,
      ease: "power3.out",
    });
    const setFrameX = gsap.quickSetter(frameEl, "x", "px");
    const setFrameY = gsap.quickSetter(frameEl, "y", "px");

    let placed = false;
    let magnetEl: HTMLElement | null = null;

    const show = () => {
      rootEl.dataset.visible = "";
      html.classList.add("has-cursor");
    };
    const hide = () => {
      delete rootEl.dataset.visible;
      delete rootEl.dataset.pressed;
      html.classList.remove("has-cursor");
    };

    // The frame tracks the control itself (it drifts with the magnetic pull).
    const placeFrame = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      setFrameX(r.left - FRAME_GAP);
      setFrameY(r.top - FRAME_GAP);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        hide();
        return;
      }
      setDotX(e.clientX);
      setDotY(e.clientY);
      if (!placed) {
        // First sighting: put the ring under the pointer instead of sweeping in from 0,0.
        gsap.set(ringEl, { x: e.clientX, y: e.clientY });
        placed = true;
      } else {
        ringX(e.clientX);
        ringY(e.clientY);
      }
      if (magnetEl) placeFrame(magnetEl);
      show();
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const { state, el } = stateFor(e.target);
      rootEl.dataset.state = state;
      if (state === "view") labelEl.textContent = el?.dataset.cursorLabel ?? "";
      if (state === "magnet" && el) {
        const r = el.getBoundingClientRect();
        frameEl.style.width = `${r.width + FRAME_GAP * 2}px`;
        frameEl.style.height = `${r.height + FRAME_GAP * 2}px`;
        frameEl.style.borderRadius = `calc(${getComputedStyle(el).borderTopLeftRadius} + ${FRAME_GAP}px)`;
        magnetEl = el;
        placeFrame(el);
      } else {
        magnetEl = null;
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") rootEl.dataset.pressed = "";
    };
    const onUp = () => {
      delete rootEl.dataset.pressed;
    };
    // relatedTarget is null when the pointer leaves the window.
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("blur", hide);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("blur", hide);
      gsap.killTweensOf(ringEl);
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
      <div ref={frame} className="cursor-frame" />
      <div ref={ring} className="cursor-pos">
        <span className="cursor-ring" />
        <span ref={label} className="cursor-label" />
      </div>
      <div ref={dot} className="cursor-pos">
        <span className="cursor-dot" />
        <span className="cursor-bar" />
      </div>
    </div>
  );
}
