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
  /** Placeholder pill in the persistent layer (2.3); 7.4 replaces it with the Ask bubble. */
  layer: {
    ask: "Ask",
  },
} as const;
