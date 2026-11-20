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
  // A lock is active while Lenis starts: keep the new instance stopped too.
  if (lenis && lockCount > 0) lenis.stop();
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

/**
 * Freeze page scrolling (for overlays). Calls nest: each lock needs its own unlock.
 * Stops Lenis and hides the page scrollbar. Where the scrollbar takes space (Windows), <html>
 * is padded by its width so the layout doesn't shift; fixed elements can add the same space
 * with `padding-right: var(--scrollbar-gap, 0px)`.
 */
export function lockScroll(): void {
  if (typeof document === "undefined") return;
  lockCount += 1;
  if (lockCount > 1) return;
  const html = document.documentElement;
  const gap = window.innerWidth - html.clientWidth;
  html.style.setProperty("--scrollbar-gap", `${gap}px`);
  if (gap > 0) html.style.paddingRight = `${gap}px`;
  html.style.overflow = "hidden";
  instance?.stop();
}

/** Undo one lockScroll(). Scrolling resumes when every lock is released. */
export function unlockScroll(): void {
  if (typeof document === "undefined" || lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;
  const html = document.documentElement;
  html.style.overflow = "";
  html.style.paddingRight = "";
  html.style.removeProperty("--scrollbar-gap");
  instance?.start();
}
