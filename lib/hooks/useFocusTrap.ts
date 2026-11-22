"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/** Active traps, oldest first. Only the last one (the topmost overlay) handles keys. */
const stack: HTMLElement[] = [];

/** True when `root` is the topmost active trap. Overlays use it to route Esc. */
export function isTopmostTrap(root: HTMLElement | null): boolean {
  return root !== null && stack[stack.length - 1] === root;
}

/** Focusable, visible elements inside `root`, in tab order. */
export function getFocusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) =>
      !el.closest("[inert]") &&
      el.getAttribute("aria-hidden") !== "true" &&
      el.getClientRects().length > 0,
  );
}

/**
 * While `active`, keeps Tab and Shift+Tab inside `ref`. On activation it focuses the element
 * from `initialFocus` (if given), else the first focusable child, else the container itself
 * (give it tabIndex={-1}). On deactivation it returns focus to whatever had it before,
 * if that element is still in the page. Traps nest: only the topmost one acts.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  initialFocus?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    stack.push(root);
    const first =
      initialFocus?.current ??
      root.querySelector<HTMLElement>("[data-autofocus]") ??
      getFocusable(root)[0] ??
      root;
    first.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      // A control inside that uses Tab itself (the terminal's completion, 6.2) prevents the default.
      if (e.key !== "Tab" || e.defaultPrevented || !isTopmostTrap(root)) return;
      const items = getFocusable(root);
      if (items.length === 0) {
        e.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }
      const head = items[0]!;
      const tail = items[items.length - 1]!;
      const current = document.activeElement;
      const inside = current instanceof Node && root.contains(current);
      if (e.shiftKey && (current === head || current === root || !inside)) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && (current === tail || !inside)) {
        e.preventDefault();
        head.focus();
      }
    };

    // Focus that escapes (e.g. a click on the page behind) is pulled back in.
    const onFocusIn = (e: FocusEvent) => {
      if (!isTopmostTrap(root)) return;
      if (e.target instanceof Node && !root.contains(e.target)) {
        (getFocusable(root)[0] ?? root).focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      const at = stack.lastIndexOf(root);
      if (at !== -1) stack.splice(at, 1);
      if (previous && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [ref, active, initialFocus]);
}
