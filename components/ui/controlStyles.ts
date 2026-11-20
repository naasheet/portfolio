/*
 * Classes every interactive primitive shares, so their states stay identical (CLAUDE.md §8).
 * Hover only changes colour, never size, so it can't shift the layout.
 */

/** 2 px accent ring with a 2 px gap, keyboard focus only. */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus";

/** Colour-only transition for hover and selected states. */
export const colorTransition =
  "transition-[background-color,border-color,color] duration-150 ease-out";

/** Disabled look for native `disabled` and `aria-disabled`. */
export const disabledState =
  "disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40";

/** Framer Motion's DOM-event props clash with React's; controls omit these from their HTML props. */
export type MotionConflicts =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragOver"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";
