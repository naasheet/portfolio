"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { gsap } from "@/lib/motion/gsap";

type CursorState = "default" | "select" | "text" | "view";

/** Inputs that take typing get the caret; buttons styled as inputs don't. */
const TEXT_INPUTS =
  "textarea, [contenteditable='true'], input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file'])";

/** Selection box padding around the target, and while pressed (px). */
const PAD = 6;
const PAD_PRESSED = 4;
/** Spark size: the box grows out of a square this big at the pointer. */
const SPARK = 8;
/** Pointer speed (px/ms) at which the tail reaches its full 28 px. */
const FULL_TAIL_SPEED = 1.5;

function stateFor(target: EventTarget | null): {
  state: CursorState;
  el: HTMLElement | null;
} {
  if (!(target instanceof Element)) return { state: "default", el: null };
  const input = target.closest<HTMLElement>(TEXT_INPUTS);
  if (input) return { state: "text", el: input };
  const el = target.closest<HTMLElement>("[data-cursor]");
  const value = el?.dataset.cursor;
  if (el && (value === "select" || value === "text" || value === "view")) {
    return { state: value, el };
  }
  return { state: "default", el: null };
}

/**
 * The custom mouse cursor (Cursor board, chunk 1.7): "a spark that moves through the particles,
 * and a selection box when you point at something you can use".
 *
 * - Spark: an 8 px glowing dot set straight onto the pointer (quickSetter), so it never lags.
 * - Tail: one element behind the spark; scaleX from pointer speed (up to 28 px), rotated to the
 *   direction of travel, eased back to 0 when the pointer stops.
 * - Select (data-cursor="select"): a selection box with 6 px padding, square corner handles, a
 *   name tag (data-cursor-label) and the element's size. It grows from the pointer to the target's
 *   bounds in 200 ms and follows the target (magnetic drift, scrolling). Pressed tightens it to
 *   4 px and fills the handles.
 * - Text (data-cursor="text", inputs, textareas): a 2 x 24 caret, no tail.
 * - View (data-cursor="view"): no box; a pill with data-cursor-label follows the pointer.
 *
 * GSAP runs it on the shared ticker (no loop of its own); state lives in data attributes, never
 * React state. Renders nothing on touch / coarse pointers and with reduced motion; hides and
 * gives the system cursor back when the pointer leaves the window. 8.3 adds the amber hand mode.
 */
export function Cursor() {
  const reduced = useReducedMotion();
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const active = finePointer && !reduced;

  const root = useRef<HTMLDivElement>(null);
  const spark = useRef<HTMLDivElement>(null);
  const tail = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const size = useRef<HTMLSpanElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const pillText = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const rootEl = root.current;
    const sparkEl = spark.current;
    const tailEl = tail.current;
    const boxEl = box.current;
    const tagEl = tag.current;
    const sizeEl = size.current;
    const pillEl = pill.current;
    const pillTextEl = pillText.current;
    if (
      !active ||
      !rootEl ||
      !sparkEl ||
      !tailEl ||
      !boxEl ||
      !tagEl ||
      !sizeEl ||
      !pillEl ||
      !pillTextEl
    ) {
      return;
    }

    const html = document.documentElement;

    // Spark: no delay at all.
    const setX = gsap.quickSetter(sparkEl, "x", "px");
    const setY = gsap.quickSetter(sparkEl, "y", "px");
    // Pill: follows the pointer, a touch softer.
    const pillX = gsap.quickTo(pillEl, "x", {
      duration: 0.12,
      ease: "power3.out",
    });
    const pillY = gsap.quickTo(pillEl, "y", {
      duration: 0.12,
      ease: "power3.out",
    });
    // Tail: length from speed, heading from direction; eases back to 0 after the pointer stops.
    const tailScale = gsap.quickTo(tailEl, "scaleX", {
      duration: 0.15,
      ease: "power2.out",
    });
    const setTailRotation = gsap.quickSetter(tailEl, "rotation", "deg");
    const settleTail = gsap.delayedCall(0.06, () => tailScale(0)).pause();
    // Box: follows its target.
    const boxX = gsap.quickTo(boxEl, "x", {
      duration: 0.2,
      ease: "power3.out",
    });
    const boxY = gsap.quickTo(boxEl, "y", {
      duration: 0.2,
      ease: "power3.out",
    });

    let placed = false;
    let last = { x: 0, y: 0, t: 0 };
    let pointer = { x: 0, y: 0 };
    let target: HTMLElement | null = null;
    let boxShown = false;

    const show = () => {
      rootEl.dataset.visible = "";
      html.classList.add("has-cursor");
    };
    const hide = () => {
      delete rootEl.dataset.visible;
      delete rootEl.dataset.pressed;
      html.classList.remove("has-cursor");
    };

    /** Box geometry for the current target: size, labels and press scale. */
    const fitBox = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const w = r.width + PAD * 2;
      const h = r.height + PAD * 2;
      boxEl.style.width = `${w}px`;
      boxEl.style.height = `${h}px`;
      boxEl.style.setProperty(
        "--press-sx",
        `${(r.width + PAD_PRESSED * 2) / w}`,
      );
      boxEl.style.setProperty(
        "--press-sy",
        `${(r.height + PAD_PRESSED * 2) / h}`,
      );
      sizeEl.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
      tagEl.textContent = el.dataset.cursorLabel ?? "";
      return { r, w, h };
    };

    /**
     * Keep the box on the target as it drifts (magnetic spring) or scrolls. Runs on the shared
     * GSAP ticker only while something is selected, so the box keeps up even after the pointer
     * stops moving.
     */
    const followTarget = () => {
      if (!target) return;
      const r = target.getBoundingClientRect();
      boxX(r.left - PAD);
      boxY(r.top - PAD);
    };
    let following = false;
    const startFollow = () => {
      if (following) return;
      gsap.ticker.add(followTarget);
      following = true;
    };
    const stopFollow = () => {
      if (!following) return;
      gsap.ticker.remove(followTarget);
      following = false;
    };

    const select = (el: HTMLElement) => {
      const { r, w, h } = fitBox(el);
      if (!boxShown) {
        // Grow out of a spark-sized square at the pointer into the target's bounds.
        gsap.set(boxEl, {
          x: pointer.x - SPARK / 2,
          y: pointer.y - SPARK / 2,
          scaleX: SPARK / w,
          scaleY: SPARK / h,
        });
        gsap.to(boxEl, {
          scaleX: 1,
          scaleY: 1,
          duration: 0.2,
          ease: "power3.out",
          overwrite: "auto",
        });
        boxShown = true;
      }
      boxX(r.left - PAD);
      boxY(r.top - PAD);
      startFollow();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        hide();
        return;
      }
      pointer = { x: e.clientX, y: e.clientY };
      setX(e.clientX);
      setY(e.clientY);
      pillX(e.clientX);
      pillY(e.clientY);

      if (!placed) {
        gsap.set(pillEl, { x: e.clientX, y: e.clientY });
        placed = true;
      } else {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        const dt = Math.max(1, e.timeStamp - last.t);
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
          setTailRotation((Math.atan2(dy, dx) * 180) / Math.PI);
          tailScale(Math.min(1, dist / dt / FULL_TAIL_SPEED));
          settleTail.restart(true);
        }
      }
      last = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      show();
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const { state, el } = stateFor(e.target);
      rootEl.dataset.state = state;
      if (state === "select" && el) {
        if (el !== target) {
          target = el;
          select(el);
        }
        return;
      }
      target = null;
      boxShown = false;
      stopFollow();
      if (state === "view")
        pillTextEl.textContent = el?.dataset.cursorLabel ?? "";
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
      stopFollow();
      settleTail.kill();
      gsap.killTweensOf([pillEl, tailEl, boxEl]);
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
      <div ref={box} className="cursor-box">
        <div className="cursor-box-inner">
          <span className="cursor-handle" data-corner="tl" />
          <span className="cursor-handle" data-corner="tr" />
          <span className="cursor-handle" data-corner="bl" />
          <span className="cursor-handle" data-corner="br" />
          <span ref={tag} className="cursor-tag" />
          <span ref={size} className="cursor-size" />
        </div>
      </div>
      <div ref={pill} className="cursor-pos">
        <span className="cursor-pill">
          <span ref={pillText} />
          <ArrowUpRight aria-hidden className="size-3.5" />
        </span>
      </div>
      <div ref={spark} className="cursor-pos">
        <span ref={tail} className="cursor-tail" />
        <span className="cursor-spark" />
        <span className="cursor-caret" />
      </div>
    </div>
  );
}
