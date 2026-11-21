/*
 * Page transitions (2.5). `navigate()` plays the exit (app/template.tsx animates while
 * `leaving` is true) and pushes the route after 300 ms; under reduced motion it pushes at once.
 * `navigate()` also marks the navigation as a push. A route that mounts without that mark is
 * Back / Forward, so it restores its scroll position instead of starting at the top
 * (lib/motion/scrollMemory.ts). (A popstate flag doesn't work: React 19 renders a traversal
 * synchronously before any popstate listener of ours runs.) So every in-site navigation must
 * go through TransitionLink or navigate(), never a bare next/link or router.push.
 */
import { rememberScroll, setScrollPath } from "./scrollMemory";

export const PAGE_EXIT_MS = 300;

export type PushRouter = {
  push: (href: string, options?: { scroll?: boolean }) => void;
};

let leaving = false;
let pushing = false;
let pending: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function setLeaving(next: boolean) {
  if (leaving === next) return;
  leaving = next;
  for (const l of listeners) l();
}

// Back / Forward during an exit cancels the pending push.
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    clearTimeout(pending);
    pushing = false;
    setLeaving(false);
  });
}

export function subscribeLeaving(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isLeaving(): boolean {
  return leaving;
}

/** Called by the new page's template as it mounts. */
export function endLeaving(): void {
  setLeaving(false);
}

/** Called once by each newly mounted route: true if navigate() pushed it, false for Back / Forward. */
export function takePushed(): boolean {
  const pushed = pushing;
  pushing = false;
  return pushed;
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Leave the current page with the exit animation, then push `href`. Next's own scroll handling
 * is off (`scroll: false`): the template decides where the new page starts. `immediate` pushes
 * at once with no exit (opening a page from the particle room, R.4: the canvas's morph is the
 * transition).
 */
export function navigate(
  router: PushRouter,
  href: string,
  { immediate = false }: { immediate?: boolean } = {},
): void {
  if (leaving) return;
  rememberScroll(window.location.pathname, window.scrollY);
  // Until the next page takes over, nothing files positions (the exit doesn't scroll).
  setScrollPath(window.location.pathname);
  const push = () => {
    pushing = true;
    router.push(href, { scroll: false });
  };
  if (immediate || prefersReducedMotion()) {
    push();
    return;
  }
  setLeaving(true);
  pending = setTimeout(push, PAGE_EXIT_MS);
}
