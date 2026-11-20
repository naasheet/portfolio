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
  /** Placeholder pills in the persistent layer (2.3); 5.2 and 7.4 replace them. */
  layer: {
    player: "Player",
    ask: "Ask about my work",
  },
} as const;
