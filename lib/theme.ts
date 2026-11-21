import { storage } from "./browser";

export type Theme = "dark" | "light";

/** localStorage key for the saved theme. ThemeScript reads the same key before first paint. */
export const THEME_STORAGE_KEY = "theme";

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/** The theme currently on <html>. Falls back to dark on the server or before ThemeScript runs. */
export function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const current = document.documentElement.dataset.theme;
  return isTheme(current) ? current : "dark";
}

/** Switch the theme: updates <html data-theme> (which restyles every token) and saves it. */
export function setTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  // If storage is blocked, the theme still applies for this visit.
  storage.set(THEME_STORAGE_KEY, theme);
}

/** Where the theme reveal starts, in CSS px from the viewport's top left. */
export type RevealOrigin = { x: number; y: number };

/** The reveal (R.5): a 600 ms circle with View Transitions, else a 400 ms crossfade. */
const REVEAL_MS = 600;
const CROSSFADE_MS = 400;
const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/**
 * Fired inside the reveal's update: the canvas (canvas/FrameDriver.tsx) draws one frame at once,
 * because the browser runs no animation frames while a View Transition is updating.
 */
export const DRAW_NOW_EVENT = "canvas:draw-now";

/**
 * Switch the theme with the reveal (R.5): `apply` changes data-theme (the store's
 * theme.toggleMode). With the View Transitions API the new theme spreads from `origin` (the
 * lamp's bulb, or the theme button) as a growing clip-path circle, 600 ms. The transition
 * captures one still image of the new state, so while `html[data-theme-reveal]` is set the
 * canvas switches its colours at once (canvas/particles/colors.ts) and is told to draw
 * synchronously (DRAW_NOW_EVENT) before the capture. (Awaiting requestAnimationFrame here
 * deadlocks: rendering is paused until the update resolves.) Without the API: a plain 400 ms crossfade (a veil in the old
 * background colour fades out). Reduced motion: an instant switch.
 */
export function revealTheme(apply: () => void, origin?: RevealOrigin | null): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply();
    return;
  }
  const doc = document as ViewTransitionDocument;
  if (typeof doc.startViewTransition === "function") {
    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    root.dataset.themeReveal = "";
    const transition = doc.startViewTransition(async () => {
      apply();
      // Let the theme observer (a microtask queued by apply) set the canvas colours, then draw.
      await Promise.resolve();
      window.dispatchEvent(new Event(DRAW_NOW_EVENT));
    });
    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          { duration: REVEAL_MS, easing: REVEAL_EASE, pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
    transition.finished.finally(() => delete root.dataset.themeReveal);
    return;
  }
  const veil = document.createElement("div");
  veil.className = "theme-veil";
  veil.style.background = getComputedStyle(root).getPropertyValue("--color-bg-base");
  document.body.append(veil);
  apply();
  veil
    .animate([{ opacity: 1 }, { opacity: 0 }], { duration: CROSSFADE_MS, easing: REVEAL_EASE })
    .finished.finally(() => veil.remove());
}
