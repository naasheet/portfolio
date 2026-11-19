/*
 * Motion tokens (CLAUDE.md §8). Keep durations and the curve in sync with the
 * --duration-* and --ease-out variables in app/globals.css.
 */

/** UI durations in milliseconds. */
export const duration = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

/** The same durations in seconds, for GSAP and Framer Motion. */
export const durationS = {
  fast: duration.fast / 1000,
  base: duration.base / 1000,
  slow: duration.slow / 1000,
} as const;

type Bezier = [number, number, number, number];

/** Ease-out curve as control points, for Framer Motion's `ease`. */
export const easeOutPoints: Bezier = [0.22, 1, 0.36, 1];

/** Ease-out curve as a CSS / GSAP string. */
export const easeOut = `cubic-bezier(${easeOutPoints.join(", ")})`;

type Spring = { type: "spring"; stiffness: number; damping: number };

/** Framer Motion spring presets. */
export const spring = {
  /** Presses, toggles, small controls. */
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  /** Panels, drawers, cards. */
  soft: { type: "spring", stiffness: 200, damping: 26 },
  /** Large or slow layout moves. */
  gentle: { type: "spring", stiffness: 120, damping: 20 },
} as const satisfies Record<string, Spring>;
