/*
 * Visitor-facing UI strings (CLAUDE.md §8: copy lives in content/, never in components).
 * Chunk 4.1 extends this into the full copy model.
 */
export const copy = {
  ui: {
    /** Screen-reader text for a button that is busy. */
    loading: "Loading",
    /** Accessible name of a toast's close button. */
    dismiss: "Dismiss",
  },
  /**
   * Default name tags on the cursor's selection box (Cursor board), by kind of control.
   * Visual only (the cursor is aria-hidden). Override per control with `cursorLabel`.
   */
  cursor: {
    button: "Button",
    link: "Link",
    chip: "Filter",
    card: "Card",
  },
} as const;
