import type Lenis from "lenis";
import type { ScrollToOptions } from "lenis";

/*
 * The single Lenis instance, owned by components/providers/SmoothScroll.tsx.
 * Every helper here falls back to native scrolling when Lenis is off (reduced motion,
 * or before it mounts), so callers never need to check.
 */

let instance: Lenis | null = null;
let lockCount = 0;

/** Called by SmoothScroll only. */
export function setLenis(lenis: Lenis | null): void {
  instance = lenis;
  if (typeof document === "undefined" || lockCount === 0) return;
  // A lock is active while Lenis starts or stops: move the lock to whichever scroller now runs.
  if (lenis) {
    document.documentElement.style.overflow = "";
    lenis.stop();
  } else {
    document.documentElement.style.overflow = "hidden";
  }
}

export function getLenis(): Lenis | null {
  return instance;
}

export type ScrollTarget = number | string | HTMLElement;

/** Smooth-scroll to a y position, a selector ("#work") or an element. Instant without Lenis. */
export function scrollTo(
  target: ScrollTarget,
  options: ScrollToOptions = {},
): void {
  if (instance) {
    instance.scrollTo(target, options);
    return;
  }
  if (typeof window === "undefined") return;

  const offset = options.offset ?? 0;
  let top: number;
  if (typeof target === "number") {
    top = target;
  } else {
    const el =
      typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    top = el.getBoundingClientRect().top + window.scrollY;
  }
  window.scrollTo({ top: top + offset, behavior: "instant" });
}

/** Freeze page scrolling (for overlays). Calls nest: each lock needs its own unlock. */
export function lockScroll(): void {
  if (typeof document === "undefined") return;
  lockCount += 1;
  if (lockCount > 1) return;
  if (instance) instance.stop();
  else document.documentElement.style.overflow = "hidden";
}

/** Undo one lockScroll(). Scrolling resumes when every lock is released. */
export function unlockScroll(): void {
  if (typeof document === "undefined" || lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;
  if (instance) instance.start();
  else document.documentElement.style.overflow = "";
}
