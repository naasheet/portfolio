/*
 * The hand's synthetic pointer (8.3). Replays the browser's own mouse event sequence at the hand
 * cursor, as pointerType "mouse", so everything built for the mouse works with the hand: React's
 * onMouseEnter / onMouseLeave (mouseover / mouseout), Framer's whileHover (pointerenter /
 * pointerleave), the island, the room's hover cards, tooltips, card spotlights.
 *
 *   target changes   old: pointerout, mouseout, then pointerleave + mouseleave on each element
 *                    left (deepest first); new: pointerover, mouseover, then pointerenter +
 *                    mouseenter on each element entered (outermost first). Enter / leave don't
 *                    bubble, so each element gets its own.
 *   every move       pointermove, mousemove (and every frame, a fresh hit test: a page that
 *                    changes under a still hand still gets its over / out events).
 *   pinch            pointerdown, mousedown, and focus (unless a handler prevented the default).
 *   release          pointerup, mouseup, click (no click after a drag).
 *
 * CSS :hover can't be set from script, so the same chain :hover would cover (the target and its
 * ancestors) gets `data-hand-hover`; globals.css makes Tailwind's hover variant match it
 * (`@custom-variant hover`), and the few plain :hover rules list it by hand.
 *
 * Synthetic events aren't user activation: a link that opens a new tab is blocked as a popup.
 */
import { getLenis, isScrollLocked } from "@/lib/motion/lenis";

export const HAND_HOVER = "data-hand-hover";
/** Chrome's id for the mouse pointer. */
const POINTER_ID = 1;

const FOCUSABLE =
  'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export type Synthetic = {
  /**
   * Every frame while the hand is in view: re-checks what's under (x, y) (the page can change
   * under a still hand, as browsers notice for a still mouse) and, when `moved`, sends the moves.
   * `pressed` while a pinch is held.
   */
  move(x: number, y: number, pressed: boolean, moved: boolean): void;
  /** Pinch: press at (x, y). */
  down(x: number, y: number): void;
  /** Pinch released; `click` false after a drag or when the hand was lost. */
  up(x: number, y: number, click: boolean): void;
  /** The pinch became a drag: release the press without a click (pointercancel). */
  cancelPress(x: number, y: number): void;
  /** Scroll by `dy` px whatever is under (x, y): an inner scroll area, else the page. */
  scroll(x: number, y: number, dy: number): void;
  /** The hand left: leave the hovered chain. */
  leave(): void;
};

/** The element and its ancestors, innermost first (what :hover would cover). */
function chainOf(el: Element | null): Element[] {
  const chain: Element[] = [];
  for (let e = el; e; e = e.parentElement) chain.push(e);
  return chain;
}

function isScrollable(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (el === document.body || el === document.documentElement) return false;
  if (el.scrollHeight <= el.clientHeight + 1) return false;
  const overflow = getComputedStyle(el).overflowY;
  return overflow === "auto" || overflow === "scroll";
}

export function createSynthetic(): Synthetic {
  let chain: Element[] = [];
  let pressTarget: Element | null = null;

  const init = (
    x: number,
    y: number,
    buttons: number,
    related: Element | null = null,
  ): PointerEventInit => ({
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: window.screenX + x,
    screenY: window.screenY + y,
    button: 0,
    buttons,
    relatedTarget: related,
    pointerId: POINTER_ID,
    pointerType: "mouse",
    isPrimary: true,
    width: 1,
    height: 1,
    pressure: buttons ? 0.5 : 0,
  });

  /** A pointer event and its mouse twin; returns false if either was default-prevented. */
  const fire = (
    target: Element,
    pointer: string,
    mouse: string | null,
    options: PointerEventInit,
    bubbles = true,
  ): boolean => {
    const opts = { ...options, bubbles, cancelable: bubbles };
    const a = target.dispatchEvent(new PointerEvent(pointer, opts));
    const b = mouse ? target.dispatchEvent(new MouseEvent(mouse, opts)) : true;
    return a && b;
  };

  const hoverTo = (
    next: Element | null,
    x: number,
    y: number,
    buttons: number,
  ) => {
    const old = chain[0] ?? null;
    if (next === old) return;
    const nextChain = chainOf(next);
    const keep = new Set(nextChain);
    const before = new Set(chain);
    if (old) {
      const o = init(x, y, buttons, next);
      fire(old, "pointerout", "mouseout", o);
      for (const el of chain) {
        if (keep.has(el)) break;
        fire(el, "pointerleave", "mouseleave", o, false);
        el.removeAttribute(HAND_HOVER);
      }
    }
    if (next) {
      const o = init(x, y, buttons, old);
      fire(next, "pointerover", "mouseover", o);
      const entered = nextChain.filter((el) => !before.has(el)).reverse();
      for (const el of entered) {
        el.setAttribute(HAND_HOVER, "");
        fire(el, "pointerenter", "mouseenter", o, false);
      }
    }
    chain = nextChain;
  };

  const at = (x: number, y: number) => document.elementFromPoint(x, y);

  return {
    move(x, y, pressed, moved) {
      const buttons = pressed ? 1 : 0;
      const el = at(x, y);
      hoverTo(el, x, y, buttons);
      if (el && moved)
        fire(el, "pointermove", "mousemove", init(x, y, buttons));
    },
    down(x, y) {
      const el = at(x, y);
      hoverTo(el, x, y, 0);
      pressTarget = el;
      if (!el) return;
      const allowed = fire(el, "pointerdown", "mousedown", init(x, y, 1));
      if (allowed) {
        const focusable = el.closest<HTMLElement>(FOCUSABLE);
        focusable?.focus({ preventScroll: true });
      }
    },
    up(x, y, click) {
      const el = pressTarget;
      pressTarget = null;
      if (!el || !el.isConnected) return;
      fire(el, "pointerup", "mouseup", init(x, y, 0));
      if (click) {
        el.dispatchEvent(
          new MouseEvent("click", { ...init(x, y, 0), detail: 1 }),
        );
      }
    },
    cancelPress(x, y) {
      if (pressTarget?.isConnected) {
        fire(pressTarget, "pointercancel", null, init(x, y, 0));
      }
    },
    scroll(x, y, dy) {
      for (let el = at(x, y); el; el = el.parentElement) {
        if (isScrollable(el)) {
          el.scrollTop += dy;
          return;
        }
      }
      if (isScrollLocked()) return;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(lenis.targetScroll + dy, { immediate: true });
      else window.scrollBy(0, dy);
    },
    leave() {
      const old = chain[0];
      if (!old) return;
      hoverTo(null, 0, 0, 0);
    },
  };
}
